drop function if exists public.service_accept_learner_invite(text,uuid,text);

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
  v_hash := encode(digest(v_raw,'sha256'),'hex');
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
  v_verification := case
    when v_l.fiscal_code_normalized is not null then 'fiscal_code'
    when v_email is not null then 'email'
    when length(v_phone_digits)>=4 then 'phone_last4'
    else 'manual_review'
  end;

  return jsonb_build_object(
    'valid',true,
    'first_name',v_l.first_name,
    'last_name_initial',case when v_l.last_name is null then null else left(upper(v_l.last_name),1)||'.' end,
    'company_name',v_company_name,
    'delivery_channel',v_i.delivery_channel,
    'expires_at',v_i.expires_at,
    'verification',v_verification,
    'email_required',v_email is null,
    'email_masked',case when v_email is null then null else left(split_part(v_email,'@',1),2)||'***@'||split_part(v_email,'@',2) end,
    'phone_masked',case when length(v_phone_digits)<4 then null else '***'||right(v_phone_digits,4) end
  );
end;
$$;

revoke execute on function public.learner_invite_public_info(text) from public;
grant execute on function public.learner_invite_public_info(text) to anon, authenticated;

create or replace function public.claim_learner_invite(
  p_token text,
  p_identity_value text
)
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
  v_hash := encode(digest(v_raw,'sha256'),'hex');

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
    if upper(regexp_replace(upper(v_identity),'[^A-Z0-9]','','g'))<>v_l.fiscal_code_normalized then
      raise exception 'identity_verification_failed' using errcode='42501';
    end if;
  elsif nullif(lower(btrim(coalesce(v_l.email,''))),'') is not null then
    if lower(v_identity)<>lower(btrim(v_l.email)) then raise exception 'identity_verification_failed' using errcode='42501'; end if;
  elsif nullif(btrim(coalesce(v_l.phone,'')),'') is not null then
    v_phone_digits:=regexp_replace(v_l.phone,'\D','','g');
    if length(v_phone_digits)<4 or regexp_replace(v_identity,'\D','','g')<>right(v_phone_digits,4) then
      raise exception 'identity_verification_failed' using errcode='42501';
    end if;
  else
    raise exception 'manual_identity_review_required' using errcode='42501';
  end if;

  if v_l.email is not null and lower(btrim(v_l.email))<>v_auth_email then
    raise exception 'invitation_email_mismatch' using errcode='42501';
  end if;
  if v_l.auth_user_id is not null and v_l.auth_user_id<>v_uid then raise exception 'learner_linked_to_other_account' using errcode='23505'; end if;
  if exists(select 1 from public.learners where auth_user_id=v_uid and id<>v_l.id) then raise exception 'auth_account_already_linked' using errcode='23505'; end if;

  update public.learners
     set auth_user_id=v_uid,
         email=coalesce(nullif(lower(btrim(email)),''),v_auth_email),
         updated_at=now()
   where id=v_l.id;

  update public.learner_account_invitations
     set status='accepted',accepted_at=now(),consumed_at=now(),auth_user_id=v_uid,
         email=coalesce(nullif(email,''),v_auth_email),token_hash=null,last_error=null,updated_at=now()
   where id=v_i.id;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(v_uid,'learner_invite.accept','learner',v_l.id,v_l.organization_id,
    jsonb_build_object('delivery_channel',v_i.delivery_channel,'invitation_id',v_i.id));

  return jsonb_build_object('status','accepted','learner_id',v_l.id,'organization_id',v_l.organization_id);
end;
$$;

revoke execute on function public.claim_learner_invite(text,text) from public, anon;
grant execute on function public.claim_learner_invite(text,text) to authenticated;
