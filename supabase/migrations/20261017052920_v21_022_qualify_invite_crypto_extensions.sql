-- SECURITY DEFINER functions below keep search_path='' and therefore qualify pgcrypto calls explicitly.

create or replace function public.admin_issue_learner_invite(
  p_learner_id uuid,
  p_delivery_channel text,
  p_expires_hours integer default 168
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_l public.learners%rowtype;
  v_org_active boolean;
  v_channel text := lower(btrim(coalesce(p_delivery_channel,'')));
  v_token text;
  v_hash text;
  v_exp timestamptz;
  v_prev_count integer := 0;
  v_invite_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if v_channel <> all(array['email','whatsapp','sms','manual','qr']::text[]) then raise exception 'unsupported_delivery_channel' using errcode='22023'; end if;
  if coalesce(p_expires_hours,0) < 1 or p_expires_hours > 720 then raise exception 'invalid_invite_expiry' using errcode='22023'; end if;
  select * into v_l from public.learners where id=p_learner_id for update;
  if not found then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_l.organization_id) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
  if not v_l.active then raise exception 'learner_inactive' using errcode='22023'; end if;
  select active into v_org_active from public.organizations where id=v_l.organization_id;
  if coalesce(v_org_active,false)=false then raise exception 'organization_inactive' using errcode='22023'; end if;
  if v_l.auth_user_id is not null then raise exception 'learner_account_already_active' using errcode='22023'; end if;
  if v_channel='email' and nullif(btrim(coalesce(v_l.email,'')),'') is null then raise exception 'learner_email_required' using errcode='22023'; end if;
  if v_channel in ('whatsapp','sms') and nullif(btrim(coalesce(v_l.phone,'')),'') is null then raise exception 'learner_phone_required' using errcode='22023'; end if;
  select sent_count into v_prev_count from public.learner_account_invitations where learner_id=p_learner_id;
  v_prev_count := coalesce(v_prev_count,0);
  v_token := encode(extensions.gen_random_bytes(32),'hex');
  v_hash := encode(extensions.digest(v_token,'sha256'),'hex');
  v_exp := now() + make_interval(hours => p_expires_hours);
  insert into public.learner_account_invitations(
    learner_id,email,status,sent_count,last_sent_at,accepted_at,auth_user_id,last_error,created_by,metadata,
    token_hash,token_prefix,delivery_channel,recipient_phone,issued_at,expires_at,revoked_at,consumed_at,updated_at
  ) values (
    v_l.id,coalesce(nullif(lower(btrim(v_l.email)),''),''),'not_sent',v_prev_count,null,null,null,null,auth.uid(),
    jsonb_build_object('organization_id',v_l.organization_id,'issued_by',auth.uid()),
    v_hash,left(v_token,8),v_channel,v_l.phone,now(),v_exp,null,null,now()
  )
  on conflict (learner_id) do update set
    email=excluded.email,status='not_sent',last_error=null,created_by=auth.uid(),
    metadata=coalesce(public.learner_account_invitations.metadata,'{}'::jsonb) || excluded.metadata,
    token_hash=excluded.token_hash,token_prefix=excluded.token_prefix,delivery_channel=excluded.delivery_channel,
    recipient_phone=excluded.recipient_phone,issued_at=excluded.issued_at,expires_at=excluded.expires_at,
    revoked_at=null,consumed_at=null,accepted_at=null,auth_user_id=null,updated_at=now()
  returning id into v_invite_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'learner_invite.issue','learner',v_l.id,v_l.organization_id,
    jsonb_build_object('invitation_id',v_invite_id,'delivery_channel',v_channel,'expires_at',v_exp,'token_prefix',left(v_token,8)));
  return jsonb_build_object('invitation_id',v_invite_id,'learner_id',v_l.id,'organization_id',v_l.organization_id,'company_id',v_l.company_id,
    'first_name',v_l.first_name,'last_name',v_l.last_name,'email',v_l.email,'phone',v_l.phone,'delivery_channel',v_channel,
    'token',v_token,'token_prefix',left(v_token,8),'expires_at',v_exp,
    'identity_verification',case when v_l.fiscal_code_normalized is not null then 'fiscal_code' when v_l.email is not null then 'email' when v_l.phone is not null then 'phone_last4' else 'none' end);
end;
$$;

create or replace function public.learner_invite_public_info(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_raw text := lower(btrim(coalesce(p_token,'')));
  v_hash text;
  v_i public.learner_account_invitations%rowtype;
  v_l public.learners%rowtype;
  v_company_name text;
  v_email text;
  v_phone_digits text;
  v_verification text;
begin
  if v_raw !~ '^[a-f0-9]{64}$' then raise exception 'invalid_invitation_token' using errcode='22023'; end if;
  v_hash := encode(extensions.digest(v_raw,'sha256'),'hex');
  select * into v_i from public.learner_account_invitations where token_hash=v_hash;
  if not found then raise exception 'invalid_invitation_token' using errcode='22023'; end if;
  if v_i.status='revoked' or v_i.revoked_at is not null then raise exception 'invitation_revoked' using errcode='22023'; end if;
  if v_i.status='accepted' or v_i.consumed_at is not null then raise exception 'invitation_already_used' using errcode='22023'; end if;
  if v_i.expires_at is null or v_i.expires_at<=now() then raise exception 'invitation_expired' using errcode='22023'; end if;
  select * into v_l from public.learners where id=v_i.learner_id;
  if not found or not v_l.active then raise exception 'learner_unavailable' using errcode='22023'; end if;
  if v_l.company_id is not null then select name into v_company_name from public.companies where id=v_l.company_id; end if;
  v_email := nullif(lower(btrim(coalesce(v_l.email,''))), '');
  v_phone_digits := regexp_replace(coalesce(v_l.phone,''),'\D','','g');
  v_verification := case when v_l.fiscal_code_normalized is not null then 'fiscal_code' when v_email is not null then 'email' when length(v_phone_digits)>=4 then 'phone_last4' else 'manual_review' end;
  return jsonb_build_object('valid',true,'first_name',v_l.first_name,
    'last_name_initial',case when v_l.last_name is null then null else left(upper(v_l.last_name),1)||'.' end,
    'company_name',v_company_name,'delivery_channel',v_i.delivery_channel,'expires_at',v_i.expires_at,'verification',v_verification,
    'email_required',v_email is null,
    'email_masked',case when v_email is null then null else left(split_part(v_email,'@',1),2)||'***@'||split_part(v_email,'@',2) end,
    'phone_masked',case when length(v_phone_digits)<4 then null else '***'||right(v_phone_digits,4) end);
end;
$$;

create or replace function public.claim_learner_invite(p_token text,p_identity_value text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_raw text := lower(btrim(coalesce(p_token,'')));
  v_hash text;
  v_i public.learner_account_invitations%rowtype;
  v_l public.learners%rowtype;
  v_auth_email text;
  v_identity text := btrim(coalesce(p_identity_value,''));
  v_phone_digits text;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if v_raw !~ '^[a-f0-9]{64}$' then raise exception 'invalid_invitation_token' using errcode='22023'; end if;
  v_hash := encode(extensions.digest(v_raw,'sha256'),'hex');
  select * into v_i from public.learner_account_invitations where token_hash=v_hash for update;
  if not found then raise exception 'invalid_invitation_token' using errcode='22023'; end if;
  if v_i.status='revoked' or v_i.revoked_at is not null then raise exception 'invitation_revoked' using errcode='22023'; end if;
  if v_i.status='accepted' or v_i.consumed_at is not null then raise exception 'invitation_already_used' using errcode='22023'; end if;
  if v_i.expires_at is null or v_i.expires_at<=now() then raise exception 'invitation_expired' using errcode='22023'; end if;
  select * into v_l from public.learners where id=v_i.learner_id for update;
  if not found or not v_l.active then raise exception 'learner_unavailable' using errcode='22023'; end if;
  select lower(email) into v_auth_email from auth.users where id=v_uid;
  if v_auth_email is null then raise exception 'authenticated_email_required' using errcode='22023'; end if;
  if v_l.fiscal_code_normalized is not null then
    if upper(regexp_replace(upper(v_identity),'[^A-Z0-9]','','g'))<>v_l.fiscal_code_normalized then raise exception 'identity_verification_failed' using errcode='42501'; end if;
  elsif nullif(lower(btrim(coalesce(v_l.email,''))),'') is not null then
    if lower(v_identity)<>lower(btrim(v_l.email)) then raise exception 'identity_verification_failed' using errcode='42501'; end if;
  elsif nullif(btrim(coalesce(v_l.phone,'')),'') is not null then
    v_phone_digits:=regexp_replace(v_l.phone,'\D','','g');
    if length(v_phone_digits)<4 or regexp_replace(v_identity,'\D','','g')<>right(v_phone_digits,4) then raise exception 'identity_verification_failed' using errcode='42501'; end if;
  else raise exception 'manual_identity_review_required' using errcode='42501'; end if;
  if v_l.email is not null and lower(btrim(v_l.email))<>v_auth_email then raise exception 'invitation_email_mismatch' using errcode='42501'; end if;
  if v_l.auth_user_id is not null and v_l.auth_user_id<>v_uid then raise exception 'learner_linked_to_other_account' using errcode='23505'; end if;
  if exists(select 1 from public.learners where auth_user_id=v_uid and id<>v_l.id) then raise exception 'auth_account_already_linked' using errcode='23505'; end if;
  update public.learners set auth_user_id=v_uid,email=coalesce(nullif(lower(btrim(email)),''),v_auth_email),updated_at=now() where id=v_l.id;
  update public.learner_account_invitations set status='accepted',accepted_at=now(),consumed_at=now(),auth_user_id=v_uid,
    email=coalesce(nullif(email,''),v_auth_email),token_hash=null,last_error=null,updated_at=now() where id=v_i.id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(v_uid,'learner_invite.accept','learner',v_l.id,v_l.organization_id,jsonb_build_object('delivery_channel',v_i.delivery_channel,'invitation_id',v_i.id));
  return jsonb_build_object('status','accepted','learner_id',v_l.id,'organization_id',v_l.organization_id);
end;
$$;
