-- SafetyTraining v22.1 — additive, staff-only guided practice assessments.
-- Existing written notes, manual evidence RPC and completion gate rules remain untouched.
create table if not exists public.enrollment_practice_assessments_v22 (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  requirement_key text not null,
  lab_key text not null,
  lab_snapshot jsonb not null default '{}'::jsonb,
  step_marks jsonb not null default '[]'::jsonb,
  checklist_marks jsonb not null default '[]'::jsonb,
  critical_issue boolean not null default false,
  observed_on date,
  instructor_name text,
  notes text,
  status text not null default 'draft' check (status in ('draft','recorded')),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollment_practice_assessments_v22_key unique(enrollment_id,requirement_key,lab_key),
  constraint enrollment_practice_assessments_v22_marks check (
    jsonb_typeof(step_marks)='array' and jsonb_typeof(checklist_marks)='array'
  )
);
create index if not exists enrollment_practice_assessments_v22_enrollment_idx
  on public.enrollment_practice_assessments_v22(enrollment_id);
alter table public.enrollment_practice_assessments_v22 enable row level security;
revoke all on public.enrollment_practice_assessments_v22 from public,anon,authenticated;
grant select on public.enrollment_practice_assessments_v22 to authenticated;
drop policy if exists practice_assessment_staff_read_v22 on public.enrollment_practice_assessments_v22;
create policy practice_assessment_staff_read_v22 on public.enrollment_practice_assessments_v22
  for select to authenticated using (
    exists (
      select 1 from public.enrollments en
      join public.course_editions ed on ed.id=en.edition_id
      where en.id=enrollment_id
      and private.can_access_company(ed.organization_id,ed.company_id)
    )
  );

create or replace function public.admin_save_practice_assessment_v22(
  p_enrollment_id uuid,
  p_requirement_key text,
  p_lab_key text,
  p_step_marks jsonb,
  p_checklist_marks jsonb,
  p_critical_issue boolean default false,
  p_observed_on date default null,
  p_instructor_name text default null,
  p_notes text default null,
  p_status text default 'draft'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_company uuid;
  v_course_id uuid;
  v_meta jsonb;
  v_lab public.practice_labs_v22%rowtype;
  v_existing public.enrollment_practice_assessments_v22%rowtype;
  v_saved public.enrollment_practice_assessments_v22%rowtype;
  v_accepted text[]:=array['pending','yes','no','na'];
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_status not in ('draft','recorded') then raise exception 'invalid_assessment_status' using errcode='22023'; end if;
  if p_enrollment_id is null or nullif(btrim(p_requirement_key),'') is null or nullif(btrim(p_lab_key),'') is null then
    raise exception 'assessment_binding_required' using errcode='22023';
  end if;
  select ed.organization_id,ed.company_id,cv.course_id into v_org,v_company,v_course_id
    from public.enrollments en
    join public.course_editions ed on ed.id=en.edition_id
    join public.course_versions cv on cv.id=ed.course_version_id
    where en.id=p_enrollment_id;
  if v_course_id is null then raise exception 'enrollment_not_found' using errcode='P0002'; end if;
  if not private.can_access_company(v_org,v_company) then raise exception 'staff_access_required' using errcode='42501'; end if;
  select r.metadata into v_meta
    from public.course_practical_requirements r
    where r.course_id=v_course_id and r.required and r.requirement_key=btrim(p_requirement_key)
    limit 1;
  if not found then raise exception 'practice_requirement_not_bound' using errcode='22023'; end if;
  if not (
    coalesce(v_meta->>'practice_lab_key','')=btrim(p_lab_key)
    or coalesce((v_meta->'v22_practice_lab_keys') ? btrim(p_lab_key),false)
  ) then raise exception 'lab_not_bound_to_requirement' using errcode='22023'; end if;
  select * into v_lab from public.practice_labs_v22
    where stable_key=btrim(p_lab_key) and active=true;
  if not found then raise exception 'practice_lab_not_found' using errcode='P0002'; end if;

  if p_step_marks is null or jsonb_typeof(p_step_marks)<>'array'
    or p_checklist_marks is null or jsonb_typeof(p_checklist_marks)<>'array'
    or jsonb_array_length(p_step_marks)<>jsonb_array_length(coalesce(v_lab.steps,'[]'::jsonb))
    or jsonb_array_length(p_checklist_marks)<>jsonb_array_length(coalesce(v_lab.checklist,'[]'::jsonb))
  then raise exception 'assessment_marks_length_invalid' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements_text(p_step_marks) as x(value) where x.value<>all(v_accepted))
    or exists(select 1 from jsonb_array_elements_text(p_checklist_marks) as x(value) where x.value<>all(v_accepted))
  then raise exception 'assessment_marks_invalid' using errcode='22023'; end if;
  if p_status='recorded' and (
    exists(select 1 from jsonb_array_elements_text(p_step_marks) as x(value) where x.value='pending')
    or exists(select 1 from jsonb_array_elements_text(p_checklist_marks) as x(value) where x.value='pending')
    or p_observed_on is null
    or nullif(btrim(p_instructor_name),'') is null
  ) then raise exception 'assessment_record_requires_observations_date_and_instructor' using errcode='22023'; end if;
  if length(coalesce(p_notes,''))>5000 or length(coalesce(p_instructor_name,''))>180 then
    raise exception 'assessment_text_too_long' using errcode='22023'; end if;

  select * into v_existing from public.enrollment_practice_assessments_v22
    where enrollment_id=p_enrollment_id and requirement_key=btrim(p_requirement_key) and lab_key=btrim(p_lab_key)
    for update;

  insert into public.enrollment_practice_assessments_v22(
    enrollment_id,requirement_key,lab_key,lab_snapshot,step_marks,checklist_marks,
    critical_issue,observed_on,instructor_name,notes,status,created_by,updated_by
  ) values (
    p_enrollment_id,btrim(p_requirement_key),btrim(p_lab_key),
    jsonb_build_object('title',v_lab.title,'steps',v_lab.steps,'checklist',v_lab.checklist,
      'critical_errors',v_lab.critical_errors,'stop_conditions',v_lab.stop_conditions,
      'requires_physical_validation',v_lab.requires_physical_validation),
    p_step_marks,p_checklist_marks,coalesce(p_critical_issue,false),
    p_observed_on,nullif(btrim(p_instructor_name),''),nullif(btrim(p_notes),''),
    p_status,auth.uid(),auth.uid()
  )
  on conflict(enrollment_id,requirement_key,lab_key) do update
    set lab_snapshot=excluded.lab_snapshot,step_marks=excluded.step_marks,
      checklist_marks=excluded.checklist_marks,critical_issue=excluded.critical_issue,
      observed_on=excluded.observed_on,instructor_name=excluded.instructor_name,
      notes=excluded.notes,status=excluded.status,updated_by=auth.uid(),updated_at=now()
  returning * into v_saved;

  insert into private.admin_audit_log(
    actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state,context
  ) values (
    auth.uid(),'practice_assessment.'||p_status,'enrollment_practice_assessments_v22',v_saved.id,
    v_org,case when v_existing.id is null then null else to_jsonb(v_existing) end,
    to_jsonb(v_saved),
    jsonb_build_object('enrollment_id',p_enrollment_id,'requirement_key',btrim(p_requirement_key),'lab_key',btrim(p_lab_key))
  );
  -- Intentionally does not modify enrollment_requirement_evidence or completion gates.
  return jsonb_build_object('assessment_id',v_saved.id,'status',v_saved.status,'updated_at',v_saved.updated_at);
end;
$$;
revoke all on function public.admin_save_practice_assessment_v22(uuid,text,text,jsonb,jsonb,boolean,date,text,text,text) from public,anon;
grant execute on function public.admin_save_practice_assessment_v22(uuid,text,text,jsonb,jsonb,boolean,date,text,text,text) to authenticated;
