-- Platform-admin-only administration for organization-level admin memberships.
-- Browser mutations are disabled: writes must use the RPC service below.
revoke insert, update, delete, truncate, references, trigger on public.organization_memberships from anon, authenticated;
drop policy if exists memberships_manage on public.organization_memberships;

create or replace function public.admin_memberships_overview(p_organization_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_memberships jsonb;
  v_organizations jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  if p_organization_id is not null and not exists(select 1 from public.organizations o where o.id=p_organization_id) then
    raise exception 'organization_not_found' using errcode='23503';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'organization_id',o.id,'organization_name',o.name,'organization_code',o.code,'organization_active',o.active
  ) order by o.name),'[]'::jsonb)
  into v_organizations
  from public.organizations o
  where p_organization_id is null or o.id=p_organization_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'membership_id',m.id,'user_id',m.user_id,'email',u.email,
    'organization_id',m.organization_id,'organization_name',o.name,'organization_active',o.active,
    'role',m.role,'active',m.active,'created_at',m.created_at,'updated_at',m.updated_at
  ) order by o.name,lower(coalesce(u.email,'')),m.role),'[]'::jsonb)
  into v_memberships
  from public.organization_memberships m
  join public.organizations o on o.id=m.organization_id
  join auth.users u on u.id=m.user_id
  where m.company_id is null
    and m.role in ('organization_admin','training_manager')
    and (p_organization_id is null or m.organization_id=p_organization_id);

  return jsonb_build_object(
    'organizations',v_organizations,
    'memberships',v_memberships,
    'allowed_roles',jsonb_build_array('organization_admin','training_manager')
  );
end;
$$;

create or replace function public.admin_set_organization_membership(
  p_organization_id uuid,
  p_user_email text,
  p_role text,
  p_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid:=auth.uid();
  v_user_id uuid;
  v_email text;
  v_org public.organizations%rowtype;
  v_membership public.organization_memberships%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_action text;
begin
  if v_actor is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  if p_role not in ('organization_admin','training_manager') then
    raise exception 'unsupported_admin_membership_role' using errcode='22023';
  end if;
  if p_organization_id is null then raise exception 'organization_required' using errcode='22023'; end if;
  if nullif(btrim(coalesce(p_user_email,'')),'') is null then raise exception 'user_email_required' using errcode='22023'; end if;

  select * into v_org from public.organizations o where o.id=p_organization_id;
  if not found then raise exception 'organization_not_found' using errcode='23503'; end if;
  if p_active and not v_org.active then raise exception 'organization_inactive' using errcode='22023'; end if;

  select u.id,u.email into v_user_id,v_email
  from auth.users u
  where lower(u.email)=lower(btrim(p_user_email))
  limit 1;
  if v_user_id is null then raise exception 'auth_user_not_found' using errcode='23503'; end if;

  select * into v_membership
  from public.organization_memberships m
  where m.user_id=v_user_id and m.organization_id=p_organization_id
    and m.company_id is null and m.role=p_role
  for update;

  if p_active then
    if found then
      v_before:=to_jsonb(v_membership);
      if v_membership.active then
        v_action:='membership.assign_noop';
      else
        update public.organization_memberships set active=true,updated_at=now()
        where id=v_membership.id returning * into v_membership;
        v_action:='membership.reactivate';
      end if;
    else
      insert into public.organization_memberships(user_id,organization_id,company_id,role,active)
      values(v_user_id,p_organization_id,null,p_role,true)
      returning * into v_membership;
      v_action:='membership.assign';
    end if;
  else
    if not found then raise exception 'membership_not_found' using errcode='23503'; end if;
    v_before:=to_jsonb(v_membership);
    if not v_membership.active then
      v_action:='membership.revoke_noop';
    else
      update public.organization_memberships set active=false,updated_at=now()
      where id=v_membership.id returning * into v_membership;
      v_action:='membership.revoke';
    end if;
  end if;

  v_after:=to_jsonb(v_membership);
  if v_action not in ('membership.assign_noop','membership.revoke_noop') then
    insert into private.admin_audit_log(
      actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state,context
    ) values(
      v_actor,v_action,'organization_membership',v_membership.id,p_organization_id,v_before,v_after,
      jsonb_build_object('target_user_id',v_user_id,'target_email',v_email,'role',p_role)
    );
  end if;

  return jsonb_build_object(
    'membership_id',v_membership.id,'user_id',v_user_id,'email',v_email,
    'organization_id',p_organization_id,'organization_name',v_org.name,
    'role',p_role,'active',v_membership.active,'action',v_action
  );
end;
$$;

revoke all on function public.admin_memberships_overview(uuid) from public, anon;
revoke all on function public.admin_set_organization_membership(uuid,text,text,boolean) from public, anon;
grant execute on function public.admin_memberships_overview(uuid) to authenticated;
grant execute on function public.admin_set_organization_membership(uuid,text,text,boolean) to authenticated;

create or replace function public.admin_capabilities()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_platform boolean;
  v_has_org_admin boolean;
  v_has_training_manager boolean;
  v_scopes jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  v_platform:=private.is_platform_admin();

  select coalesce(bool_or(m.role='organization_admin'),false),coalesce(bool_or(m.role='training_manager'),false)
  into v_has_org_admin,v_has_training_manager
  from public.organization_memberships m
  where m.user_id=auth.uid() and m.active and m.role in ('organization_admin','training_manager');

  if v_platform then
    select coalesce(jsonb_agg(jsonb_build_object(
      'organization_id',o.id,'organization_name',o.name,'role','platform_admin','company_id',null
    ) order by o.name),'[]'::jsonb)
    into v_scopes from public.organizations o where o.active;
  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'organization_id',m.organization_id,'organization_name',o.name,'role',m.role,'company_id',m.company_id
    ) order by o.name,m.role),'[]'::jsonb)
    into v_scopes
    from public.organization_memberships m
    join public.organizations o on o.id=m.organization_id
    where m.user_id=auth.uid() and m.active and o.active and m.role in ('organization_admin','training_manager');
  end if;

  return jsonb_build_object(
    'admin_console',v_platform or v_has_org_admin or v_has_training_manager,
    'platform_admin',v_platform,
    'roles',jsonb_build_object('organization_admin',v_has_org_admin,'training_manager',v_has_training_manager),
    'capabilities',jsonb_build_object(
      'view_dashboard',v_platform or v_has_org_admin or v_has_training_manager,
      'manage_organizations',v_platform,
      'manage_companies',v_platform or v_has_org_admin,
      'manage_learners',v_platform or v_has_org_admin or v_has_training_manager,
      'manage_courses',v_platform,
      'manage_editions',v_platform or v_has_org_admin or v_has_training_manager,
      'manage_enrollments',v_platform or v_has_org_admin or v_has_training_manager,
      'manage_evidence',v_platform or v_has_org_admin or v_has_training_manager,
      'view_activity',v_platform or v_has_org_admin or v_has_training_manager,
      'manage_safetymanager',v_platform,
      'view_editorial_tools',v_platform,
      'manage_admin_memberships',v_platform
    ),
    'scopes',v_scopes
  );
end;
$$;
