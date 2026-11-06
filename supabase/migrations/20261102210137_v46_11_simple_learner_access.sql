-- SafetyTraining v46.11 — streamlined internal learner access.
-- Passwords remain exclusively in Supabase Auth; not stored in learners or audit logs.
-- The two RPCs are admin scoped and are used by the server-side Edge Function.
create or replace function public.admin_prepare_learner_access_v46_11(p_learner_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare l public.learners%rowtype; uid uuid; n integer; email_normalized text;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into l from public.learners where id=p_learner_id;
  if not found then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(l.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if not l.active then raise exception 'learner_inactive' using errcode='22023'; end if;
  email_normalized:=lower(btrim(coalesce(l.email,'')));
  if email_normalized='' then raise exception 'learner_email_required' using errcode='22023'; end if;
  select count(*),(array_agg(u.id))[1] into n,uid from auth.users u
  where lower(btrim(u.email))=email_normalized;
  if n>1 then raise exception 'duplicate_auth_email_requires_review' using errcode='23505'; end if;
  if exists(select 1 from public.learners other where other.id<>l.id and other.auth_user_id=uid)
    or exists(select 1 from public.learners other where other.id<>l.id and other.active and lower(btrim(coalesce(other.email,'')))=email_normalized)
  then raise exception 'learner_email_already_assigned' using errcode='23505';end if;
  if l.auth_user_id is not null and l.auth_user_id is distinct from uid then
    raise exception 'linked_auth_email_mismatch' using errcode='42501';
  end if;
  if uid is not null and (exists(select 1 from public.platform_admins pa where pa.user_id=uid)
    or exists(select 1 from public.organization_memberships m where m.user_id=uid and m.active))
  then raise exception 'privileged_auth_account_cannot_be_reassigned' using errcode='42501';end if;
  return jsonb_build_object('learner_id',l.id,'email',email_normalized,
    'auth_user_id',uid,'linked',l.auth_user_id is not null);
end;$func$;
revoke all on function public.admin_prepare_learner_access_v46_11(uuid) from public,anon;
grant execute on function public.admin_prepare_learner_access_v46_11(uuid) to authenticated;

create or replace function public.admin_bind_learner_access_v46_11(p_learner_id uuid,p_auth_user_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare l public.learners%rowtype; auth_email text; is_confirmed bool;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into l from public.learners where id=p_learner_id for update;
  if not found then raise exception 'learner_not_found' using errcode='P0002';end if;
  if not private.can_manage_training_org(l.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';end if;
  if not l.active then raise exception 'learner_inactive' using errcode='22023';end if;
  if l.auth_user_id is not null and l.auth_user_id<>p_auth_user_id then
    raise exception 'learner_already_linked_to_another_account' using errcode='23505';end if;
  select lower(btrim(email)),email_confirmed_at is not null into auth_email,is_confirmed
  from auth.users where id=p_auth_user_id;
  if auth_email is null or not coalesce(is_confirmed,false) then
    raise exception 'confirmed_auth_account_required' using errcode='42501';end if;
  if auth_email is distinct from lower(btrim(coalesce(l.email,''))) then
    raise exception 'auth_email_does_not_match_learner' using errcode='42501';end if;
  if exists(select 1 from public.learners x where x.auth_user_id=p_auth_user_id and x.id<>l.id)
     or exists(select 1 from public.platform_admins x where x.user_id=p_auth_user_id)
     or exists(select 1 from public.organization_memberships x where x.user_id=p_auth_user_id and x.active)
  then raise exception 'account_assigned_elsewhere' using errcode='42501';end if;
  update public.learners set auth_user_id=p_auth_user_id,updated_at=now() where id=p_learner_id;
  update public.learner_account_invitations
    set status='accepted',auth_user_id=p_auth_user_id,accepted_at=now(),
      last_error=null,token_hash=null,updated_at=now()
  where learner_id=p_learner_id and status<>'accepted';
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'learner.access_provisioned','learner',p_learner_id,l.organization_id,
    jsonb_build_object('auth_user_linked',true,'password_secret_retained',false));
  return jsonb_build_object('status','linked','learner_id',p_learner_id);
end;$func$;
revoke all on function public.admin_bind_learner_access_v46_11(uuid,uuid) from public,anon;
grant execute on function public.admin_bind_learner_access_v46_11(uuid,uuid) to authenticated;
