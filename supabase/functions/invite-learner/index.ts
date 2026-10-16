import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'missing_authorization' }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (userError || !caller) return json({ error: 'invalid_session' }, 401);

    const body = await req.json().catch(() => ({}));
    const learnerId = String(body?.learner_id || '').trim();
    const redirectTo = String(body?.redirect_to || '').trim() || undefined;
    if (!learnerId) return json({ error: 'learner_id_required' }, 400);

    const { data: learner, error: learnerError } = await admin.from('learners')
      .select('id,organization_id,company_id,email,first_name,last_name,active,auth_user_id')
      .eq('id', learnerId).maybeSingle();
    if (learnerError || !learner) return json({ error: 'learner_not_found' }, 404);
    if (!learner.active) return json({ error: 'learner_inactive' }, 409);

    const { data: organization, error: orgError } = await admin.from('organizations')
      .select('id,active').eq('id', learner.organization_id).maybeSingle();
    if (orgError || !organization) return json({ error: 'organization_not_found' }, 404);
    if (!organization.active) return json({ error: 'organization_inactive' }, 409);

    const { data: platformAdmin, error: platformError } = await admin.from('platform_admins')
      .select('user_id').eq('user_id', caller.id).maybeSingle();
    if (platformError) return json({ error: 'authorization_check_failed' }, 500);

    let authorizedRole = 'platform_admin';
    if (!platformAdmin) {
      const { data: membership, error: membershipError } = await admin.from('organization_memberships')
        .select('role')
        .eq('user_id', caller.id)
        .eq('organization_id', learner.organization_id)
        .eq('active', true)
        .in('role', ['organization_admin', 'training_manager'])
        .limit(1)
        .maybeSingle();
      if (membershipError) return json({ error: 'authorization_check_failed' }, 500);
      if (!membership) return json({ error: 'forbidden' }, 403);
      authorizedRole = membership.role;
    }

    const email = String(learner.email || '').trim().toLowerCase();
    if (!email) return json({ error: 'learner_email_required' }, 409);

    if (learner.auth_user_id) {
      await admin.from('learner_account_invitations').upsert({
        learner_id: learner.id,
        email,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        auth_user_id: learner.auth_user_id,
        last_error: null,
        metadata: {
          accepted_via: 'existing_auth_link',
          checked_by: caller.id,
          authorization_role: authorizedRole
        }
      }, { onConflict: 'learner_id' });
      return json({ status: 'accepted', already_linked: true });
    }

    const { data: existing } = await admin.from('learner_account_invitations')
      .select('sent_count').eq('learner_id', learner.id).maybeSingle();
    const sentCount = Number(existing?.sent_count || 0) + 1;
    const metadata = {
      safetytraining_invite: true,
      learner_id: learner.id,
      first_name: learner.first_name || null,
      last_name: learner.last_name || null,
      invited_by: caller.id,
      authorization_role: authorizedRole,
      organization_id: learner.organization_id
    };

    let mode = 'invite';
    let sendError: any = null;
    const inviteOptions: any = { data: metadata };
    if (redirectTo) inviteOptions.redirectTo = redirectTo;
    const invited = await admin.auth.admin.inviteUserByEmail(email, inviteOptions);
    sendError = invited.error;

    if (sendError && /already|registered|exists/i.test(String(sendError.message || ''))) {
      mode = 'recovery';
      const recoveryOptions: any = {};
      if (redirectTo) recoveryOptions.redirectTo = redirectTo;
      const recovery = await admin.auth.resetPasswordForEmail(email, recoveryOptions);
      sendError = recovery.error;
    }

    if (sendError) {
      await admin.from('learner_account_invitations').upsert({
        learner_id: learner.id,
        email,
        status: 'failed',
        sent_count: sentCount,
        last_sent_at: new Date().toISOString(),
        last_error: String(sendError.message || 'invite_failed'),
        created_by: caller.id,
        metadata: {
          delivery_mode: mode,
          redirect_to: redirectTo || null,
          authorization_role: authorizedRole,
          organization_id: learner.organization_id
        }
      }, { onConflict: 'learner_id' });
      return json({ error: 'invite_failed', message: sendError.message }, 400);
    }

    await admin.from('learner_account_invitations').upsert({
      learner_id: learner.id,
      email,
      status: 'sent',
      sent_count: sentCount,
      last_sent_at: new Date().toISOString(),
      accepted_at: null,
      auth_user_id: null,
      last_error: null,
      created_by: caller.id,
      metadata: {
        delivery_mode: mode,
        redirect_to: redirectTo || null,
        authorization_role: authorizedRole,
        organization_id: learner.organization_id
      }
    }, { onConflict: 'learner_id' });

    return json({ status: 'sent', mode, email });
  } catch (error) {
    return json({ error: 'internal_error', message: String((error as any)?.message || error) }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
