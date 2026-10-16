create or replace function private.validate_admin_company_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then return new; end if;
  if not exists(select 1 from public.organizations o where o.id=new.organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if tg_op='UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'company_organization_change_requires_dedicated_operation' using errcode='22023';
  end if;
  return new;
end;
$$;

create or replace function private.validate_admin_learner_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then return new; end if;
  if not exists(select 1 from public.organizations o where o.id=new.organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if new.company_id is not null and not exists(
    select 1 from public.companies c
    where c.id=new.company_id and c.organization_id=new.organization_id and c.active
  ) then
    raise exception 'company_not_compatible_with_organization' using errcode='23503';
  end if;
  if tg_op='UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'learner_organization_change_requires_dedicated_operation' using errcode='22023';
  end if;
  return new;
end;
$$;

create or replace function private.validate_admin_edition_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ready boolean;
begin
  if auth.uid() is null then return new; end if;
  if not exists(select 1 from public.organizations o where o.id=new.organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if new.company_id is not null and not exists(
    select 1 from public.companies c
    where c.id=new.company_id and c.organization_id=new.organization_id and c.active
  ) then
    raise exception 'company_not_compatible_with_organization' using errcode='23503';
  end if;
  if new.available_from is not null and new.available_until is not null and new.available_until < new.available_from then
    raise exception 'available_until_before_available_from' using errcode='22023';
  end if;
  if tg_op='UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'edition_organization_is_immutable' using errcode='22023';
  end if;
  if tg_op='UPDATE' and old.status='archived' and new.status <> 'archived' then
    raise exception 'archived_edition_is_terminal' using errcode='22023';
  end if;
  if tg_op='INSERT' or new.course_version_id is distinct from old.course_version_id or new.status='open' then
    select exists(
      select 1
      from public.course_versions cv
      join public.courses c on c.id=cv.course_id
      where cv.id=new.course_version_id
        and cv.status='published'
        and c.active
        and coalesce((c.metadata->>'frozen')::boolean,false)=false
        and coalesce((c.metadata->>'exclude_from_finalization_queue')::boolean,false)=false
        and coalesce(c.metadata->>'finalization_scope','') <> 'reference_library'
        and coalesce((cv.syllabus_snapshot->>'finalization_candidate')::boolean,false)=true
        and coalesce((cv.syllabus_snapshot->>'go_live_ready')::boolean,false)=true
    ) into v_ready;
    if not v_ready then raise exception 'course_version_not_go_live_ready' using errcode='22023'; end if;
  end if;
  return new;
end;
$$;

create or replace function private.validate_admin_enrollment_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_org uuid;
  v_company uuid;
  v_edition_status text;
  v_learner_org uuid;
  v_learner_company uuid;
  v_learner_active boolean;
begin
  if auth.uid() is null then return new; end if;
  if tg_op='UPDATE' and (new.edition_id is distinct from old.edition_id or new.learner_id is distinct from old.learner_id) then
    raise exception 'enrollment_binding_is_immutable' using errcode='22023';
  end if;
  if tg_op='INSERT' then
    select e.organization_id,e.company_id,e.status into v_org,v_company,v_edition_status
    from public.course_editions e where e.id=new.edition_id;
    if v_org is null then raise exception 'edition_not_found' using errcode='23503'; end if;
    if v_edition_status <> 'open' then raise exception 'edition_must_be_open' using errcode='22023'; end if;
    select l.organization_id,l.company_id,l.active into v_learner_org,v_learner_company,v_learner_active
    from public.learners l where l.id=new.learner_id;
    if v_learner_org is null then raise exception 'learner_not_found' using errcode='23503'; end if;
    if not v_learner_active or v_learner_org <> v_org or (v_company is not null and v_learner_company is distinct from v_company) then
      raise exception 'learner_not_eligible_for_edition' using errcode='22023';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists admin_company_guardrail on public.companies;
create trigger admin_company_guardrail before insert or update on public.companies for each row execute function private.validate_admin_company_write();

drop trigger if exists admin_learner_guardrail on public.learners;
create trigger admin_learner_guardrail before insert or update on public.learners for each row execute function private.validate_admin_learner_write();

drop trigger if exists admin_edition_guardrail on public.course_editions;
create trigger admin_edition_guardrail before insert or update on public.course_editions for each row execute function private.validate_admin_edition_write();

drop trigger if exists admin_enrollment_guardrail on public.enrollments;
create trigger admin_enrollment_guardrail before insert or update on public.enrollments for each row execute function private.validate_admin_enrollment_write();

create or replace function public.admin_dashboard_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;
  select jsonb_build_object(
    'companies_active',(select count(*) from public.companies where active),
    'learners_active',(select count(*) from public.learners where active),
    'courses_active',(select count(*) from public.courses where active),
    'editions_total',(select count(*) from public.course_editions),
    'editions_open',(select count(*) from public.course_editions where status='open'),
    'enrollments_total',(select count(*) from public.enrollments),
    'enrollments_in_progress',(select count(*) from public.enrollments where status='in_progress'),
    'pending_invites',(select count(*) from public.learner_account_invitations where status in ('not_sent','failed')),
    'admin_actions',(select count(*) from private.admin_audit_log)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.admin_dashboard_summary() from public, anon;
grant execute on function public.admin_dashboard_summary() to authenticated;
