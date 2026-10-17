alter table public.learners
  add column if not exists phone text;

alter table public.learner_account_invitations
  add column if not exists token_hash text,
  add column if not exists token_prefix text,
  add column if not exists delivery_channel text,
  add column if not exists recipient_phone text,
  add column if not exists issued_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists consumed_at timestamptz;

create unique index if not exists learner_account_invitations_token_hash_uidx
  on public.learner_account_invitations(token_hash)
  where token_hash is not null;

alter table public.learner_account_invitations
  drop constraint if exists learner_account_invitations_delivery_channel_check;
alter table public.learner_account_invitations
  add constraint learner_account_invitations_delivery_channel_check
  check (delivery_channel is null or delivery_channel = any(array['email','whatsapp','sms','manual','qr']::text[]));

revoke insert, update, delete, truncate, references, trigger
  on public.learner_account_invitations from anon, authenticated;
drop policy if exists learner_account_invitations_admin_manage on public.learner_account_invitations;

create or replace function public.admin_set_learner_contact(
  p_learner_id uuid,
  p_email text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner public.learners%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_email text := nullif(lower(btrim(coalesce(p_email,''))), '');
  v_phone text := nullif(regexp_replace(btrim(coalesce(p_phone,'')), '[^0-9+]', '', 'g'), '');
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_learner from public.learners where id=p_learner_id for update;
  if not found then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_learner.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if v_email is not null and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_email' using errcode='22023';
  end if;
  if v_phone is not null and length(regexp_replace(v_phone,'\D','','g')) < 7 then
    raise exception 'invalid_phone' using errcode='22023';
  end if;

  v_before := to_jsonb(v_learner);
  update public.learners
     set email=v_email,
         phone=v_phone,
         updated_at=now()
   where id=p_learner_id
   returning to_jsonb(public.learners.*) into v_after;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
  values(auth.uid(),'learner.contact_update','learner',p_learner_id,v_learner.organization_id,v_before,v_after);

  return jsonb_build_object('learner_id',p_learner_id,'email',v_email,'phone',v_phone);
end;
$$;

revoke execute on function public.admin_set_learner_contact(uuid,text,text) from public, anon;
grant execute on function public.admin_set_learner_contact(uuid,text,text) to authenticated;

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
  if v_channel <> all(array['email','whatsapp','sms','manual','qr']::text[]) then
    raise exception 'unsupported_delivery_channel' using errcode='22023';
  end if;
  if coalesce(p_expires_hours,0) < 1 or p_expires_hours > 720 then
    raise exception 'invalid_invite_expiry' using errcode='22023';
  end if;

  select * into v_l from public.learners where id=p_learner_id for update;
  if not found then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_l.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if not v_l.active then raise exception 'learner_inactive' using errcode='22023'; end if;
  select active into v_org_active from public.organizations where id=v_l.organization_id;
  if coalesce(v_org_active,false)=false then raise exception 'organization_inactive' using errcode='22023'; end if;
  if v_l.auth_user_id is not null then raise exception 'learner_account_already_active' using errcode='22023'; end if;
  if v_channel='email' and nullif(btrim(coalesce(v_l.email,'')),'') is null then
    raise exception 'learner_email_required' using errcode='22023';
  end if;
  if v_channel in ('whatsapp','sms') and nullif(btrim(coalesce(v_l.phone,'')),'') is null then
    raise exception 'learner_phone_required' using errcode='22023';
  end if;

  select sent_count into v_prev_count
  from public.learner_account_invitations where learner_id=p_learner_id;
  v_prev_count := coalesce(v_prev_count,0);
  v_token := encode(gen_random_bytes(32),'hex');
  v_hash := encode(digest(v_token,'sha256'),'hex');
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
    email=excluded.email,
    status='not_sent',
    last_error=null,
    created_by=auth.uid(),
    metadata=coalesce(public.learner_account_invitations.metadata,'{}'::jsonb) || excluded.metadata,
    token_hash=excluded.token_hash,
    token_prefix=excluded.token_prefix,
    delivery_channel=excluded.delivery_channel,
    recipient_phone=excluded.recipient_phone,
    issued_at=excluded.issued_at,
    expires_at=excluded.expires_at,
    revoked_at=null,
    consumed_at=null,
    accepted_at=null,
    auth_user_id=null,
    updated_at=now()
  returning id into v_invite_id;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'learner_invite.issue','learner',v_l.id,v_l.organization_id,
    jsonb_build_object('invitation_id',v_invite_id,'delivery_channel',v_channel,'expires_at',v_exp,'token_prefix',left(v_token,8)));

  return jsonb_build_object(
    'invitation_id',v_invite_id,
    'learner_id',v_l.id,
    'organization_id',v_l.organization_id,
    'company_id',v_l.company_id,
    'first_name',v_l.first_name,
    'last_name',v_l.last_name,
    'email',v_l.email,
    'phone',v_l.phone,
    'delivery_channel',v_channel,
    'token',v_token,
    'token_prefix',left(v_token,8),
    'expires_at',v_exp,
    'identity_verification',case when v_l.fiscal_code_normalized is not null then 'fiscal_code' when v_l.email is not null then 'email' when v_l.phone is not null then 'phone_last4' else 'none' end
  );
end;
$$;

revoke execute on function public.admin_issue_learner_invite(uuid,text,integer) from public, anon;
grant execute on function public.admin_issue_learner_invite(uuid,text,integer) to authenticated;

create or replace function public.admin_record_learner_invite_delivery(
  p_learner_id uuid,
  p_status text,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid;
  v_status text := lower(btrim(coalesce(p_status,'')));
  v_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select l.organization_id into v_org from public.learners l where l.id=p_learner_id;
  if v_org is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_org) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
  if v_status not in ('sent','failed','not_sent') then raise exception 'invalid_invite_delivery_status' using errcode='22023'; end if;

  update public.learner_account_invitations
     set status=v_status,
         sent_count=sent_count + case when v_status='sent' then 1 else 0 end,
         last_sent_at=case when v_status='sent' then now() else last_sent_at end,
         last_error=case when v_status='failed' then nullif(left(coalesce(p_error,'invite_failed'),1000),'') else null end,
         updated_at=now()
   where learner_id=p_learner_id
   returning sent_count into v_count;
  if not found then raise exception 'invitation_not_found' using errcode='P0002'; end if;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'learner_invite.delivery','learner',p_learner_id,v_org,jsonb_build_object('status',v_status,'error',p_error));

  return jsonb_build_object('learner_id',p_learner_id,'status',v_status,'sent_count',v_count);
end;
$$;

revoke execute on function public.admin_record_learner_invite_delivery(uuid,text,text) from public, anon;
grant execute on function public.admin_record_learner_invite_delivery(uuid,text,text) to authenticated;

create or replace function public.admin_revoke_learner_invite(p_learner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select organization_id into v_org from public.learners where id=p_learner_id;
  if v_org is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_org) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;

  update public.learner_account_invitations
     set status='revoked',revoked_at=now(),token_hash=null,updated_at=now()
   where learner_id=p_learner_id and status<>'accepted';
  if not found then raise exception 'active_invitation_not_found' using errcode='P0002'; end if;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id)
  values(auth.uid(),'learner_invite.revoke','learner',p_learner_id,v_org);
  return jsonb_build_object('learner_id',p_learner_id,'status','revoked');
end;
$$;

revoke execute on function public.admin_revoke_learner_invite(uuid) from public, anon;
grant execute on function public.admin_revoke_learner_invite(uuid) to authenticated;

create or replace function public.service_accept_learner_invite(
  p_token_hash text,
  p_auth_user_id uuid,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_i public.learner_account_invitations%rowtype;
  v_l public.learners%rowtype;
  v_email text := nullif(lower(btrim(coalesce(p_email,''))), '');
begin
  if p_token_hash is null or p_auth_user_id is null or v_email is null then
    raise exception 'accept_parameters_required' using errcode='22023';
  end if;

  select * into v_i from public.learner_account_invitations where token_hash=p_token_hash for update;
  if not found then raise exception 'invalid_invitation_token' using errcode='22023'; end if;
  if v_i.status='revoked' or v_i.revoked_at is not null then raise exception 'invitation_revoked' using errcode='22023'; end if;
  if v_i.status='accepted' or v_i.consumed_at is not null then raise exception 'invitation_already_used' using errcode='22023'; end if;
  if v_i.expires_at is null or v_i.expires_at <= now() then raise exception 'invitation_expired' using errcode='22023'; end if;

  select * into v_l from public.learners where id=v_i.learner_id for update;
  if not found or not v_l.active then raise exception 'learner_unavailable' using errcode='22023'; end if;
  if v_l.auth_user_id is not null and v_l.auth_user_id<>p_auth_user_id then raise exception 'learner_linked_to_other_account' using errcode='23505'; end if;
  if exists(select 1 from public.learners where auth_user_id=p_auth_user_id and id<>v_l.id) then
    raise exception 'auth_account_already_linked' using errcode='23505';
  end if;
  if v_l.email is not null and lower(btrim(v_l.email))<>v_email then
    raise exception 'invitation_email_mismatch' using errcode='22023';
  end if;

  update public.learners
     set auth_user_id=p_auth_user_id,
         email=coalesce(nullif(lower(btrim(email)),''),v_email),
         updated_at=now()
   where id=v_l.id;

  update public.learner_account_invitations
     set status='accepted',accepted_at=now(),consumed_at=now(),auth_user_id=p_auth_user_id,
         email=v_email,token_hash=null,last_error=null,updated_at=now()
   where id=v_i.id;

  return jsonb_build_object('learner_id',v_l.id,'organization_id',v_l.organization_id,'status','accepted');
end;
$$;

revoke execute on function public.service_accept_learner_invite(text,uuid,text) from public, anon, authenticated;
grant execute on function public.service_accept_learner_invite(text,uuid,text) to service_role;
