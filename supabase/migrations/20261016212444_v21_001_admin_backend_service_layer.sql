create table if not exists private.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  organization_id uuid null references public.organizations(id) on delete set null,
  before_state jsonb null,
  after_state jsonb null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on private.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_entity_idx on private.admin_audit_log(entity_type, entity_id, created_at desc);
create index if not exists admin_audit_log_org_idx on private.admin_audit_log(organization_id, created_at desc);

revoke all on private.admin_audit_log from public, anon, authenticated;

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
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode = '42501';
  end if;
  if v_name is null then
    raise exception 'company_name_required' using errcode = '22023';
  end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode = '23503';
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
    update public.companies
      set name=v_name,
          vat_number=nullif(btrim(p_vat_number),''),
          fiscal_code=nullif(btrim(p_fiscal_code),''),
          ateco_code=nullif(btrim(p_ateco_code),'')
    where id=p_company_id
    returning id into v_id;
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
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if p_company_id is not null and not exists(
    select 1 from public.companies c where c.id=p_company_id and c.organization_id=p_organization_id and c.active
  ) then
    raise exception 'company_not_compatible_with_organization' using errcode='23503';
  end if;

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
    update public.learners
      set company_id=p_company_id,
          first_name=nullif(btrim(p_first_name),''),
          last_name=nullif(btrim(p_last_name),''),
          email=v_email,
          fiscal_code=nullif(btrim(p_fiscal_code),''),
          job_title=nullif(btrim(p_job_title),'')
    where id=p_learner_id
    returning id into v_id;
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
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
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
  from public.course_versions cv
  join public.courses c on c.id=cv.course_id
  where cv.id=p_course_version_id
    and cv.status='published'
    and c.active
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
  if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  if p_learning_mode not in ('elearning_internal','classroom','blended','self_study') then raise exception 'invalid_learning_mode' using errcode='22023'; end if;
  if p_status not in ('draft','open','closed','archived') then raise exception 'invalid_edition_status' using errcode='22023'; end if;
  if p_available_from is not null and p_available_until is not null and p_available_until < p_available_from then raise exception 'available_until_before_available_from' using errcode='22023'; end if;

  select e.organization_id,e.status,to_jsonb(e) into v_org,v_current_status,v_before
  from public.course_editions e where e.id=p_edition_id for update;
  if v_org is null then raise exception 'edition_not_found' using errcode='P0002'; end if;
  if v_current_status='archived' and p_status <> 'archived' then raise exception 'archived_edition_is_terminal' using errcode='22023'; end if;
  if p_company_id is not null and not exists(select 1 from public.companies c where c.id=p_company_id and c.organization_id=v_org and c.active) then
    raise exception 'company_not_compatible_with_organization' using errcode='23503';
  end if;

  update public.course_editions
  set title=nullif(btrim(p_title),''), company_id=p_company_id, learning_mode=p_learning_mode, status=p_status,
      available_from=p_available_from, available_until=p_available_until, recommended_due_at=p_recommended_due_at,
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
  if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  if p_learner_ids is null or cardinality(p_learner_ids)=0 then raise exception 'learner_ids_required' using errcode='22023'; end if;

  select e.organization_id,e.company_id,e.status into v_org,v_company,v_status
  from public.course_editions e where e.id=p_edition_id for update;
  if v_org is null then raise exception 'edition_not_found' using errcode='P0002'; end if;
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
  if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  select to_jsonb(en),ed.organization_id into v_before,v_org
  from public.enrollments en join public.course_editions ed on ed.id=en.edition_id
  where en.id=p_enrollment_id for update of en;
  if v_before is null then raise exception 'enrollment_not_found' using errcode='P0002'; end if;

  if coalesce(p_revoked,false) then
    v_new_status:='revoked';
  else
    v_new_status:=case when coalesce((v_before->>'progress_pct')::numeric,0)>0 then 'in_progress' else 'not_started' end;
  end if;
  update public.enrollments set status=v_new_status where id=p_enrollment_id;
  select to_jsonb(en) into v_after from public.enrollments en where en.id=p_enrollment_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
  values(auth.uid(),case when p_revoked then 'enrollment.revoke' else 'enrollment.restore' end,'enrollment',p_enrollment_id,v_org,v_before,v_after);
  return v_new_status;
end;
$$;

create or replace function public.admin_recent_actions(p_limit integer default 100)
returns table(
  id uuid,
  actor_user_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  organization_id uuid,
  context jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  return query
  select a.id,a.actor_user_id,a.action,a.entity_type,a.entity_id,a.organization_id,a.context,a.created_at
  from private.admin_audit_log a
  order by a.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),500));
end;
$$;

revoke all on function public.admin_save_company(uuid,uuid,text,text,text,text) from public, anon;
revoke all on function public.admin_save_learner(uuid,uuid,uuid,text,text,text,text,text) from public, anon;
revoke all on function public.admin_create_edition(uuid,uuid,uuid,text,text,text,timestamptz,timestamptz) from public, anon;
revoke all on function public.admin_update_edition(uuid,text,uuid,text,text,timestamptz,timestamptz,timestamptz,boolean) from public, anon;
revoke all on function public.admin_bulk_enroll(uuid,uuid[],text) from public, anon;
revoke all on function public.admin_set_enrollment_revoked(uuid,boolean) from public, anon;
revoke all on function public.admin_recent_actions(integer) from public, anon;

grant execute on function public.admin_save_company(uuid,uuid,text,text,text,text) to authenticated;
grant execute on function public.admin_save_learner(uuid,uuid,uuid,text,text,text,text,text) to authenticated;
grant execute on function public.admin_create_edition(uuid,uuid,uuid,text,text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.admin_update_edition(uuid,text,uuid,text,text,timestamptz,timestamptz,timestamptz,boolean) to authenticated;
grant execute on function public.admin_bulk_enroll(uuid,uuid[],text) to authenticated;
grant execute on function public.admin_set_enrollment_revoked(uuid,boolean) to authenticated;
grant execute on function public.admin_recent_actions(integer) to authenticated;
