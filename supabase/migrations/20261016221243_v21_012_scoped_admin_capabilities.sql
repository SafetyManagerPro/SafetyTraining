create or replace function private.can_manage_training_org(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships m
      where m.user_id=auth.uid()
        and m.organization_id=p_organization_id
        and m.active
        and m.role in ('organization_admin','training_manager')
    );
$$;

create or replace function private.can_manage_company_registry(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships m
      where m.user_id=auth.uid()
        and m.organization_id=p_organization_id
        and m.active
        and m.role='organization_admin'
    );
$$;

revoke all on function private.can_manage_training_org(uuid) from public,anon,authenticated;
revoke all on function private.can_manage_company_registry(uuid) from public,anon,authenticated;

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
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;

  v_platform:=private.is_platform_admin();

  select
    coalesce(bool_or(m.role='organization_admin'),false),
    coalesce(bool_or(m.role='training_manager'),false)
  into v_has_org_admin,v_has_training_manager
  from public.organization_memberships m
  where m.user_id=auth.uid()
    and m.active
    and m.role in ('organization_admin','training_manager');

  if v_platform then
    select coalesce(jsonb_agg(jsonb_build_object(
      'organization_id',o.id,
      'organization_name',o.name,
      'role','platform_admin',
      'company_id',null
    ) order by o.name),'[]'::jsonb)
    into v_scopes
    from public.organizations o
    where o.active;
  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'organization_id',m.organization_id,
      'organization_name',o.name,
      'role',m.role,
      'company_id',m.company_id
    ) order by o.name,m.role),'[]'::jsonb)
    into v_scopes
    from public.organization_memberships m
    join public.organizations o on o.id=m.organization_id
    where m.user_id=auth.uid()
      and m.active
      and o.active
      and m.role in ('organization_admin','training_manager');
  end if;

  return jsonb_build_object(
    'admin_console',v_platform or v_has_org_admin or v_has_training_manager,
    'platform_admin',v_platform,
    'roles',jsonb_build_object(
      'organization_admin',v_has_org_admin,
      'training_manager',v_has_training_manager
    ),
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
      'view_editorial_tools',v_platform
    ),
    'scopes',v_scopes
  );
end;
$$;

revoke all on function public.admin_capabilities() from public,anon;
grant execute on function public.admin_capabilities() to authenticated;

create or replace function public.admin_save_company(
  p_company_id uuid,
  p_organization_id uuid,
  p_name text,
  p_vat_number text,
  p_fiscal_code text,
  p_ateco_code text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
  v_name text := nullif(btrim(p_name), '');
begin
  if auth.uid() is null or not private.can_manage_company_registry(p_organization_id) then
    raise exception 'organization_admin_required' using errcode='42501';
  end if;
  if v_name is null then raise exception 'company_name_required' using errcode='22023'; end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;

  if p_company_id is null then
    insert into public.companies(organization_id,name,vat_number,fiscal_code,ateco_code)
    values(p_organization_id,v_name,nullif(btrim(p_vat_number),''),nullif(btrim(p_fiscal_code),''),nullif(btrim(p_ateco_code),''))
    returning id into v_id;
    select to_jsonb(c) into v_after from public.companies c where c.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state)
    values(auth.uid(),'company.create','company',v_id,p_organization_id,v_after);
  else
    select to_jsonb(c) into v_before from public.companies c where c.id=p_company_id for update;
    if v_before is null then raise exception 'company_not_found' using errcode='P0002'; end if;
    if (v_before->>'organization_id')::uuid <> p_organization_id then
      raise exception 'company_organization_change_requires_dedicated_operation' using errcode='22023';
    end if;
    update public.companies set
      name=v_name,
      vat_number=nullif(btrim(p_vat_number),''),
      fiscal_code=nullif(btrim(p_fiscal_code),''),
      ateco_code=nullif(btrim(p_ateco_code),'')
    where id=p_company_id returning id into v_id;
    select to_jsonb(c) into v_after from public.companies c where c.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
    values(auth.uid(),'company.update','company',v_id,p_organization_id,v_before,v_after);
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_save_learner(
  p_learner_id uuid,
  p_organization_id uuid,
  p_company_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_fiscal_code text,
  p_job_title text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
  v_email text := nullif(lower(btrim(p_email)), '');
begin
  if auth.uid() is null or not private.can_manage_training_org(p_organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if p_company_id is not null and not exists(
    select 1 from public.companies c where c.id=p_company_id and c.organization_id=p_organization_id and c.active
  ) then raise exception 'company_not_compatible_with_organization' using errcode='23503'; end if;

  if p_learner_id is null then
    insert into public.learners(organization_id,company_id,first_name,last_name,email,fiscal_code,job_title)
    values(p_organization_id,p_company_id,nullif(btrim(p_first_name),''),nullif(btrim(p_last_name),''),v_email,nullif(btrim(p_fiscal_code),''),nullif(btrim(p_job_title),''))
    returning id into v_id;
    select to_jsonb(l) into v_after from public.learners l where l.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state)
    values(auth.uid(),'learner.create','learner',v_id,p_organization_id,v_after);
  else
    select to_jsonb(l) into v_before from public.learners l where l.id=p_learner_id for update;
    if v_before is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
    if (v_before->>'organization_id')::uuid <> p_organization_id then
      raise exception 'learner_organization_change_requires_dedicated_operation' using errcode='22023';
    end if;
    update public.learners set
      company_id=p_company_id,
      first_name=nullif(btrim(p_first_name),''),
      last_name=nullif(btrim(p_last_name),''),
      email=v_email,
      fiscal_code=nullif(btrim(p_fiscal_code),''),
      job_title=nullif(btrim(p_job_title),'')
    where id=p_learner_id returning id into v_id;
    select to_jsonb(l) into v_after from public.learners l where l.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
    values(auth.uid(),'learner.update','learner',v_id,p_organization_id,v_before,v_after);
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_create_edition(
  p_organization_id uuid,
  p_company_id uuid,
  p_course_version_id uuid,
  p_title text,
  p_learning_mode text,
  p_status text,
  p_available_from timestamptz,
  p_available_until timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_after jsonb;
  v_course_id uuid;
begin
  if auth.uid() is null or not private.can_manage_training_org(p_organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if p_status not in ('draft','open') then raise exception 'invalid_initial_edition_status' using errcode='22023'; end if;
  if p_learning_mode not in ('elearning_internal','classroom','blended','self_study') then raise exception 'invalid_learning_mode' using errcode='22023'; end if;
  if p_available_from is not null and p_available_until is not null and p_available_until < p_available_from then
    raise exception 'available_until_before_available_from' using errcode='22023';
  end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if p_company_id is not null and not exists(
    select 1 from public.companies c where c.id=p_company_id and c.organization_id=p_organization_id and c.active
  ) then raise exception 'company_not_compatible_with_organization' using errcode='23503'; end if;

  select cv.course_id into v_course_id
  from public.course_versions cv join public.courses c on c.id=cv.course_id
  where cv.id=p_course_version_id
    and cv.status='published' and c.active
    and coalesce((c.metadata->>'frozen')::boolean,false)=false
    and coalesce((c.metadata->>'exclude_from_finalization_queue')::boolean,false)=false
    and coalesce(c.metadata->>'finalization_scope','') <> 'reference_library'
    and coalesce((cv.syllabus_snapshot->>'finalization_candidate')::boolean,false)=true
    and coalesce((cv.syllabus_snapshot->>'go_live_ready')::boolean,false)=true;
  if v_course_id is null then raise exception 'course_version_not_go_live_ready' using errcode='22023'; end if;

  insert into public.course_editions(
    course_version_id,organization_id,company_id,title,learning_mode,certification_mode,
    available_from,available_until,status,created_by
  ) values(
    p_course_version_id,p_organization_id,p_company_id,nullif(btrim(p_title),''),p_learning_mode,'not_certifying',
    p_available_from,p_available_until,p_status,auth.uid()
  ) returning id into v_id;

  select to_jsonb(e) into v_after from public.course_editions e where e.id=v_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state,context)
  values(auth.uid(),'edition.create','course_edition',v_id,p_organization_id,v_after,jsonb_build_object('course_version_id',p_course_version_id));
  return v_id;
end;
$$;

create or replace function public.admin_update_edition(
  p_edition_id uuid,
  p_title text,
  p_company_id uuid,
  p_learning_mode text,
  p_status text,
  p_available_from timestamptz,
  p_available_until timestamptz,
  p_recommended_due_at timestamptz,
  p_block_after_due boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_org uuid;
  v_current_status text;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_learning_mode not in ('elearning_internal','classroom','blended','self_study') then raise exception 'invalid_learning_mode' using errcode='22023'; end if;
  if p_status not in ('draft','open','closed','archived') then raise exception 'invalid_edition_status' using errcode='22023'; end if;
  if p_available_from is not null and p_available_until is not null and p_available_until < p_available_from then raise exception 'available_until_before_available_from' using errcode='22023'; end if;

  select e.organization_id,e.status,to_jsonb(e) into v_org,v_current_status,v_before
  from public.course_editions e where e.id=p_edition_id for update;
  if v_org is null then raise exception 'edition_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_org) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
  if v_current_status='archived' and p_status <> 'archived' then raise exception 'archived_edition_is_terminal' using errcode='22023'; end if;
  if p_company_id is not null and not exists(select 1 from public.companies c where c.id=p_company_id and c.organization_id=v_org and c.active) then
    raise exception 'company_not_compatible_with_organization' using errcode='23503';
  end if;

  update public.course_editions set
    title=nullif(btrim(p_title),''),company_id=p_company_id,learning_mode=p_learning_mode,status=p_status,
    available_from=p_available_from,available_until=p_available_until,recommended_due_at=p_recommended_due_at,
    block_after_due=coalesce(p_block_after_due,false)
  where id=p_edition_id;

  select to_jsonb(e) into v_after from public.course_editions e where e.id=p_edition_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
  values(auth.uid(),'edition.update','course_edition',p_edition_id,v_org,v_before,v_after);
  return p_edition_id;
end;
$$;

create or replace function public.admin_bulk_enroll(
  p_edition_id uuid,
  p_learner_ids uuid[],
  p_source text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_company uuid;
  v_status text;
  v_requested int;
  v_eligible int;
  v_inserted int;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_learner_ids is null or cardinality(p_learner_ids)=0 then raise exception 'learner_ids_required' using errcode='22023'; end if;

  select e.organization_id,e.company_id,e.status into v_org,v_company,v_status
  from public.course_editions e where e.id=p_edition_id for update;
  if v_org is null then raise exception 'edition_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_org) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
  if v_status <> 'open' then raise exception 'edition_must_be_open' using errcode='22023'; end if;

  select count(*) into v_requested from (select distinct unnest(p_learner_ids) id) x;
  select count(*) into v_eligible
  from (select distinct unnest(p_learner_ids) id) x
  join public.learners l on l.id=x.id
  where l.active and l.organization_id=v_org and (v_company is null or l.company_id=v_company);
  if v_eligible <> v_requested then raise exception 'one_or_more_learners_not_eligible' using errcode='22023'; end if;

  with ins as (
    insert into public.enrollments(edition_id,learner_id,status,metadata)
    select p_edition_id,x.id,'not_started',jsonb_build_object('enrollment_source',coalesce(nullif(btrim(p_source),''),'admin_backend'))
    from (select distinct unnest(p_learner_ids) id) x
    on conflict (edition_id,learner_id) do nothing
    returning id
  ) select count(*) into v_inserted from ins;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'enrollment.bulk_create','course_edition',p_edition_id,v_org,
    jsonb_build_object('requested',v_requested,'inserted',v_inserted,'skipped_existing',v_requested-v_inserted,'source',coalesce(p_source,'admin_backend')));

  return jsonb_build_object('requested',v_requested,'inserted',v_inserted,'skipped_existing',v_requested-v_inserted);
end;
$$;

create or replace function public.admin_set_enrollment_revoked(
  p_enrollment_id uuid,
  p_revoked boolean
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_org uuid;
  v_new_status text;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select to_jsonb(en),ed.organization_id into v_before,v_org
  from public.enrollments en join public.course_editions ed on ed.id=en.edition_id
  where en.id=p_enrollment_id for update of en;
  if v_before is null then raise exception 'enrollment_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_org) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;

  if coalesce(p_revoked,false) then v_new_status:='revoked';
  else v_new_status:=case when coalesce((v_before->>'progress_pct')::numeric,0)>0 then 'in_progress' else 'not_started' end;
  end if;
  update public.enrollments set status=v_new_status where id=p_enrollment_id;
  select to_jsonb(en) into v_after from public.enrollments en where en.id=p_enrollment_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
  values(auth.uid(),case when p_revoked then 'enrollment.revoke' else 'enrollment.restore' end,'enrollment',p_enrollment_id,v_org,v_before,v_after);
  return v_new_status;
end;
$$;

create or replace function public.admin_set_active(
  p_entity_type text,
  p_entity_id uuid,
  p_active boolean
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_org uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;

  if p_entity_type='organization' then
    if not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
    select to_jsonb(o),o.id into v_before,v_org from public.organizations o where o.id=p_entity_id for update;
    if v_before is null then raise exception 'organization_not_found' using errcode='P0002'; end if;
    if p_active=false and exists(select 1 from public.course_editions e where e.organization_id=p_entity_id and e.status='open') then raise exception 'organization_has_open_editions' using errcode='22023'; end if;
    update public.organizations set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(o) into v_after from public.organizations o where o.id=p_entity_id;

  elsif p_entity_type='company' then
    select to_jsonb(c),c.organization_id into v_before,v_org from public.companies c where c.id=p_entity_id for update;
    if v_before is null then raise exception 'company_not_found' using errcode='P0002'; end if;
    if not private.can_manage_company_registry(v_org) then raise exception 'organization_admin_required' using errcode='42501'; end if;
    if p_active=false and exists(select 1 from public.course_editions e where e.company_id=p_entity_id and e.status='open') then raise exception 'company_has_open_editions' using errcode='22023'; end if;
    update public.companies set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(c) into v_after from public.companies c where c.id=p_entity_id;

  elsif p_entity_type='learner' then
    select to_jsonb(l),l.organization_id into v_before,v_org from public.learners l where l.id=p_entity_id for update;
    if v_before is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
    if not private.can_manage_training_org(v_org) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
    update public.learners set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(l) into v_after from public.learners l where l.id=p_entity_id;

  elsif p_entity_type='course' then
    if not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
    select to_jsonb(c),c.owner_organization_id into v_before,v_org from public.courses c where c.id=p_entity_id for update;
    if v_before is null then raise exception 'course_not_found' using errcode='P0002'; end if;
    if p_active=false and exists(
      select 1 from public.course_editions e join public.course_versions cv on cv.id=e.course_version_id
      where cv.course_id=p_entity_id and e.status='open'
    ) then raise exception 'course_has_open_editions' using errcode='22023'; end if;
    update public.courses set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(c) into v_after from public.courses c where c.id=p_entity_id;
  else
    raise exception 'unsupported_entity_type' using errcode='22023';
  end if;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state,context)
  values(auth.uid(),case when p_active then 'entity.activate' else 'entity.deactivate' end,p_entity_type,p_entity_id,v_org,v_before,v_after,jsonb_build_object('active',p_active));
  return coalesce(p_active,false);
end;
$$;

create or replace function public.admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_platform boolean;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  v_platform:=private.is_platform_admin();
  if not v_platform and not exists(
    select 1 from public.organization_memberships m
    where m.user_id=auth.uid() and m.active and m.role in ('organization_admin','training_manager')
  ) then raise exception 'admin_console_required' using errcode='42501'; end if;

  select jsonb_build_object(
    'scope',case when v_platform then 'platform' else 'organization' end,
    'companies_active',(
      select count(*) from public.companies c
      where c.active and (v_platform or private.can_manage_training_org(c.organization_id))
    ),
    'learners_active',(
      select count(*) from public.learners l
      where l.active and (v_platform or private.can_manage_training_org(l.organization_id))
    ),
    'courses_active',(
      select count(distinct c.id)
      from public.courses c join public.course_versions cv on cv.course_id=c.id
      where c.active and cv.status='published'
        and coalesce((c.metadata->>'frozen')::boolean,false)=false
        and coalesce((c.metadata->>'exclude_from_finalization_queue')::boolean,false)=false
        and coalesce(c.metadata->>'finalization_scope','')<>'reference_library'
        and coalesce((cv.syllabus_snapshot->>'finalization_candidate')::boolean,false)=true
        and coalesce((cv.syllabus_snapshot->>'go_live_ready')::boolean,false)=true
    ),
    'editions_total',(
      select count(*) from public.course_editions d where v_platform or private.can_manage_training_org(d.organization_id)
    ),
    'editions_open',(
      select count(*) from public.course_editions d where d.status='open' and (v_platform or private.can_manage_training_org(d.organization_id))
    ),
    'enrollments_total',(
      select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id
      where v_platform or private.can_manage_training_org(d.organization_id)
    ),
    'enrollments_in_progress',(
      select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id
      where e.status='in_progress' and (v_platform or private.can_manage_training_org(d.organization_id))
    ),
    'pending_invites',(
      select count(*)
      from public.learner_account_invitations i join public.learners l on l.id=i.learner_id
      where i.status in ('not_sent','failed') and (v_platform or private.can_manage_training_org(l.organization_id))
    ),
    'admin_actions',(
      select count(*) from private.admin_audit_log a
      where v_platform or (a.organization_id is not null and private.can_manage_training_org(a.organization_id))
    )
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.admin_recent_actions(p_limit integer default 100)
returns table(
  id uuid,actor_user_id uuid,action text,entity_type text,entity_id uuid,
  organization_id uuid,context jsonb,created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_platform boolean;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  v_platform:=private.is_platform_admin();
  if not v_platform and not exists(
    select 1 from public.organization_memberships m
    where m.user_id=auth.uid() and m.active and m.role in ('organization_admin','training_manager')
  ) then raise exception 'admin_console_required' using errcode='42501'; end if;

  return query
  select a.id,a.actor_user_id,a.action,a.entity_type,a.entity_id,a.organization_id,a.context,a.created_at
  from private.admin_audit_log a
  where v_platform or (a.organization_id is not null and private.can_manage_training_org(a.organization_id))
  order by a.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),500));
end;
$$;

create or replace function public.admin_company_detail(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company public.companies%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_company from public.companies where id=p_company_id;
  if v_company.id is null then raise exception 'company_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_company.organization_id) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;

  select jsonb_build_object(
    'company',to_jsonb(v_company),
    'organization',(select jsonb_build_object('id',o.id,'name',o.name,'code',o.code,'active',o.active) from public.organizations o where o.id=v_company.organization_id),
    'summary',jsonb_build_object(
      'learners_total',(select count(*) from public.learners l where l.company_id=v_company.id),
      'learners_active',(select count(*) from public.learners l where l.company_id=v_company.id and l.active),
      'learners_with_account',(select count(*) from public.learners l where l.company_id=v_company.id and l.auth_user_id is not null),
      'editions_total',(select count(*) from public.course_editions d where d.company_id=v_company.id),
      'editions_open',(select count(*) from public.course_editions d where d.company_id=v_company.id and d.status='open'),
      'enrollments_total',(select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id where d.company_id=v_company.id),
      'enrollments_in_progress',(select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id where d.company_id=v_company.id and e.status='in_progress'),
      'enrollments_completed',(select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id where d.company_id=v_company.id and e.status in ('completed','passed'))
    ),
    'learners',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',l.id,'first_name',l.first_name,'last_name',l.last_name,'email',l.email,'fiscal_code',l.fiscal_code,'job_title',l.job_title,
        'active',l.active,'account_active',l.auth_user_id is not null,'invite_status',i.status,'invite_last_sent_at',i.last_sent_at
      ) order by l.last_name,l.first_name,l.created_at)
      from public.learners l left join public.learner_account_invitations i on i.learner_id=l.id where l.company_id=v_company.id
    ),'[]'::jsonb),
    'editions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'title',coalesce(d.title,c.title),'status',d.status,'learning_mode',d.learning_mode,
        'available_from',d.available_from,'available_until',d.available_until,'course_id',c.id,'course_title',c.title,
        'course_version_id',cv.id,'course_version',cv.version_number,
        'enrollments_total',(select count(*) from public.enrollments e where e.edition_id=d.id and e.status<>'revoked'),
        'completed',(select count(*) from public.enrollments e where e.edition_id=d.id and e.status in ('completed','passed'))
      ) order by d.created_at desc)
      from public.course_editions d join public.course_versions cv on cv.id=d.course_version_id join public.courses c on c.id=cv.course_id
      where d.company_id=v_company.id
    ),'[]'::jsonb),
    'recent_admin_actions',coalesce((
      select jsonb_agg(jsonb_build_object('action',a.action,'created_at',a.created_at,'context',a.context) order by a.created_at desc)
      from (select action,created_at,context from private.admin_audit_log where entity_type='company' and entity_id=v_company.id order by created_at desc limit 20) a
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.admin_learner_detail(p_learner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner public.learners%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_learner from public.learners where id=p_learner_id;
  if v_learner.id is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_learner.organization_id) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;

  select jsonb_build_object(
    'learner',to_jsonb(v_learner),
    'organization',(select jsonb_build_object('id',o.id,'name',o.name,'code',o.code) from public.organizations o where o.id=v_learner.organization_id),
    'company',(select jsonb_build_object('id',c.id,'name',c.name,'vat_number',c.vat_number,'ateco_code',c.ateco_code,'active',c.active) from public.companies c where c.id=v_learner.company_id),
    'invitation',(select jsonb_build_object('status',i.status,'email',i.email,'sent_count',i.sent_count,'last_sent_at',i.last_sent_at,'accepted_at',i.accepted_at,'last_error',i.last_error) from public.learner_account_invitations i where i.learner_id=v_learner.id),
    'summary',jsonb_build_object(
      'enrollments_total',(select count(*) from public.enrollments e where e.learner_id=v_learner.id),
      'active_enrollments',(select count(*) from public.enrollments e where e.learner_id=v_learner.id and e.status<>'revoked'),
      'in_progress',(select count(*) from public.enrollments e where e.learner_id=v_learner.id and e.status='in_progress'),
      'completed',(select count(*) from public.enrollments e where e.learner_id=v_learner.id and e.status in ('completed','passed')),
      'account_active',v_learner.auth_user_id is not null
    ),
    'enrollments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'status',e.status,'progress_pct',e.progress_pct,'active_seconds',e.active_seconds,'final_score_pct',e.final_score_pct,
        'enrolled_at',e.enrolled_at,'started_at',e.started_at,'completed_at',e.completed_at,'last_activity_at',e.last_activity_at,
        'completion_gate',e.metadata->'completion_gate','edition_id',d.id,'edition_title',coalesce(d.title,c.title),'edition_status',d.status,
        'learning_mode',d.learning_mode,'course_id',c.id,'course_title',c.title,'course_version_id',cv.id,'course_version',cv.version_number,
        'company_id',d.company_id,'company_name',co.name,
        'tests',coalesce((select jsonb_agg(jsonb_build_object('id',ta.id,'attempt_no',ta.attempt_no,'started_at',ta.started_at,'completed_at',ta.completed_at,'score_pct',ta.score_pct,'passed',ta.passed) order by ta.attempt_no desc) from public.test_attempts ta where ta.enrollment_id=e.id),'[]'::jsonb),
        'evidence',coalesce((select jsonb_agg(jsonb_build_object('kind',ev.requirement_kind,'key',ev.requirement_key,'status',ev.status,'completion_mode',ev.completion_mode,'completed_at',ev.completed_at,'note',ev.evidence->>'note') order by ev.requirement_kind,ev.requirement_key) from public.enrollment_requirement_evidence ev where ev.enrollment_id=e.id),'[]'::jsonb)
      ) order by e.enrolled_at desc)
      from public.enrollments e join public.course_editions d on d.id=e.edition_id join public.course_versions cv on cv.id=d.course_version_id
      join public.courses c on c.id=cv.course_id left join public.companies co on co.id=d.company_id where e.learner_id=v_learner.id
    ),'[]'::jsonb),
    'recent_admin_actions',coalesce((
      select jsonb_agg(jsonb_build_object('action',a.action,'created_at',a.created_at,'context',a.context) order by a.created_at desc)
      from (select action,created_at,context from private.admin_audit_log where entity_type='learner' and entity_id=v_learner.id order by created_at desc limit 20) a
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.admin_edition_detail(p_edition_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_edition public.course_editions%rowtype;
  v_course_version public.course_versions%rowtype;
  v_course public.courses%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_edition from public.course_editions where id=p_edition_id;
  if v_edition.id is null then raise exception 'edition_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_edition.organization_id) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
  select * into v_course_version from public.course_versions where id=v_edition.course_version_id;
  select * into v_course from public.courses where id=v_course_version.course_id;

  select jsonb_build_object(
    'edition',to_jsonb(v_edition),
    'course',jsonb_build_object(
      'id',v_course.id,'stable_key',v_course.stable_key,'title',v_course.title,'family',v_course.family,'nominal_minutes',v_course.nominal_minutes,
      'certification_mode',v_course.certification_mode,'version_id',v_course_version.id,'version_number',v_course_version.version_number,
      'version_status',v_course_version.status,'go_live_ready',coalesce((v_course_version.syllabus_snapshot->>'go_live_ready')::boolean,false)
    ),
    'organization',(select jsonb_build_object('id',o.id,'name',o.name,'code',o.code) from public.organizations o where o.id=v_edition.organization_id),
    'company',(select jsonb_build_object('id',c.id,'name',c.name,'vat_number',c.vat_number,'ateco_code',c.ateco_code) from public.companies c where c.id=v_edition.company_id),
    'summary',jsonb_build_object(
      'enrollments_total',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status<>'revoked'),
      'not_started',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status='not_started'),
      'in_progress',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status='in_progress'),
      'completed',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status in ('completed','passed')),
      'revoked',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status='revoked'),
      'accounts_active',(select count(*) from public.enrollments e join public.learners l on l.id=e.learner_id where e.edition_id=v_edition.id and e.status<>'revoked' and l.auth_user_id is not null),
      'practical_requirements',(select count(*) from public.course_practical_requirements r where r.course_id=v_course.id and r.required),
      'verification_requirements',(select count(*) from public.course_verification_requirements r where r.course_version_id=v_course_version.id and r.required)
    ),
    'enrollments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'status',e.status,'progress_pct',e.progress_pct,'active_seconds',e.active_seconds,'final_score_pct',e.final_score_pct,
        'last_activity_at',e.last_activity_at,'completion_gate',e.metadata->'completion_gate','learner_id',l.id,
        'learner_name',btrim(coalesce(l.first_name,'')||' '||coalesce(l.last_name,'')),'email',l.email,'job_title',l.job_title,
        'account_active',l.auth_user_id is not null,'invite_status',i.status,'invite_last_sent_at',i.last_sent_at,
        'evidence_completed',(select count(*) from public.enrollment_requirement_evidence ev where ev.enrollment_id=e.id and ev.status='completed'),
        'evidence_pending',(select count(*) from public.enrollment_requirement_evidence ev where ev.enrollment_id=e.id and ev.status in ('pending','failed','revoked'))
      ) order by l.last_name,l.first_name,e.enrolled_at)
      from public.enrollments e join public.learners l on l.id=e.learner_id left join public.learner_account_invitations i on i.learner_id=l.id
      where e.edition_id=v_edition.id
    ),'[]'::jsonb),
    'recent_admin_actions',coalesce((
      select jsonb_agg(jsonb_build_object('action',a.action,'created_at',a.created_at,'context',a.context) order by a.created_at desc)
      from (
        select action,created_at,context from private.admin_audit_log
        where (entity_type='course_edition' and entity_id=v_edition.id)
           or context->>'enrollment_id' in (select id::text from public.enrollments where edition_id=v_edition.id)
        order by created_at desc limit 30
      ) a
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.admin_capabilities() from public,anon;
revoke all on function public.admin_save_company(uuid,uuid,text,text,text,text) from public,anon;
revoke all on function public.admin_save_learner(uuid,uuid,uuid,text,text,text,text,text) from public,anon;
revoke all on function public.admin_create_edition(uuid,uuid,uuid,text,text,text,timestamptz,timestamptz) from public,anon;
revoke all on function public.admin_update_edition(uuid,text,uuid,text,text,timestamptz,timestamptz,timestamptz,boolean) from public,anon;
revoke all on function public.admin_bulk_enroll(uuid,uuid[],text) from public,anon;
revoke all on function public.admin_set_enrollment_revoked(uuid,boolean) from public,anon;
revoke all on function public.admin_set_active(text,uuid,boolean) from public,anon;
revoke all on function public.admin_dashboard_summary() from public,anon;
revoke all on function public.admin_recent_actions(integer) from public,anon;
revoke all on function public.admin_company_detail(uuid) from public,anon;
revoke all on function public.admin_learner_detail(uuid) from public,anon;
revoke all on function public.admin_edition_detail(uuid) from public,anon;

grant execute on function public.admin_capabilities() to authenticated;
grant execute on function public.admin_save_company(uuid,uuid,text,text,text,text) to authenticated;
grant execute on function public.admin_save_learner(uuid,uuid,uuid,text,text,text,text,text) to authenticated;
grant execute on function public.admin_create_edition(uuid,uuid,uuid,text,text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.admin_update_edition(uuid,text,uuid,text,text,timestamptz,timestamptz,timestamptz,boolean) to authenticated;
grant execute on function public.admin_bulk_enroll(uuid,uuid[],text) to authenticated;
grant execute on function public.admin_set_enrollment_revoked(uuid,boolean) to authenticated;
grant execute on function public.admin_set_active(text,uuid,boolean) to authenticated;
grant execute on function public.admin_dashboard_summary() to authenticated;
grant execute on function public.admin_recent_actions(integer) to authenticated;
grant execute on function public.admin_company_detail(uuid) to authenticated;
grant execute on function public.admin_learner_detail(uuid) to authenticated;
grant execute on function public.admin_edition_detail(uuid) to authenticated;