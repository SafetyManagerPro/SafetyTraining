-- Corrective migration after the accidental re-application of v21_007 at 20261017042346.
-- Restores the v21_008 invariant: platform-generated evidence can only be completed or failed.
create or replace function private.validate_requirement_evidence_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_version_id uuid;
  v_course_id uuid;
  v_requirement_id uuid;
  v_requirement_completion_mode text;
  v_selected_mode text;
  v_attempt_completed_at timestamptz;
  v_attempt_passed boolean;
begin
  if tg_op='UPDATE' and (
    new.enrollment_id is distinct from old.enrollment_id or
    new.requirement_kind is distinct from old.requirement_kind or
    new.requirement_key is distinct from old.requirement_key
  ) then
    raise exception 'requirement_evidence_binding_is_immutable' using errcode='22023';
  end if;

  select d.course_version_id,cv.course_id
    into v_course_version_id,v_course_id
  from public.enrollments e
  join public.course_editions d on d.id=e.edition_id
  join public.course_versions cv on cv.id=d.course_version_id
  where e.id=new.enrollment_id;

  if v_course_version_id is null then
    raise exception 'enrollment_not_found' using errcode='23503';
  end if;

  if new.requirement_kind='practical' then
    select r.id,r.completion_mode
      into v_requirement_id,v_requirement_completion_mode
    from public.course_practical_requirements r
    where r.course_id=v_course_id
      and r.requirement_key=new.requirement_key
      and r.required
    limit 1;

    if v_requirement_id is null then
      raise exception 'practical_requirement_not_bound_to_enrollment' using errcode='22023';
    end if;

    new.practical_requirement_id:=v_requirement_id;
    new.verification_requirement_id:=null;
    if new.completion_mode<>'external' then
      raise exception 'practical_requirement_requires_external_evidence' using errcode='22023';
    end if;

  elsif new.requirement_kind='verification' then
    select r.id,r.completion_mode,r.selected_mode
      into v_requirement_id,v_requirement_completion_mode,v_selected_mode
    from public.course_verification_requirements r
    where r.course_version_id=v_course_version_id
      and r.requirement_key=new.requirement_key
      and r.required
    limit 1;

    if v_requirement_id is null then
      raise exception 'verification_requirement_not_bound_to_enrollment' using errcode='22023';
    end if;

    new.verification_requirement_id:=v_requirement_id;
    new.practical_requirement_id:=null;

    if new.completion_mode='platform' then
      if new.status not in ('completed','failed') then
        raise exception 'platform_evidence_status_invalid' using errcode='22023';
      end if;
      if v_selected_mode is distinct from 'test' or v_requirement_completion_mode not in ('platform','platform_or_external') then
        raise exception 'verification_requirement_not_platform_managed' using errcode='22023';
      end if;

      select ta.completed_at,ta.passed
        into v_attempt_completed_at,v_attempt_passed
      from public.test_attempts ta
      join public.tests t on t.id=ta.test_id
      where ta.enrollment_id=new.enrollment_id
        and ta.id::text=coalesce(new.evidence->>'test_attempt_id','')
        and t.course_version_id=v_course_version_id
        and t.metadata->>'requirement_key'=new.requirement_key
      limit 1;

      if v_attempt_completed_at is null then
        raise exception 'platform_evidence_requires_completed_test_attempt' using errcode='22023';
      end if;
      if new.status='completed' and v_attempt_passed is distinct from true then
        raise exception 'platform_evidence_pass_status_mismatch' using errcode='22023';
      end if;
      if new.status='failed' and v_attempt_passed is distinct from false then
        raise exception 'platform_evidence_fail_status_mismatch' using errcode='22023';
      end if;
      new.completed_at:=case when new.status='completed' then v_attempt_completed_at else null end;

    elsif new.completion_mode='external' then
      if v_requirement_completion_mode='platform'
         or (v_selected_mode='test' and v_requirement_completion_mode='platform_or_external') then
        raise exception 'platform_managed_verification_cannot_be_completed_manually' using errcode='22023';
      end if;
    else
      raise exception 'invalid_evidence_completion_mode' using errcode='22023';
    end if;
  else
    raise exception 'invalid_requirement_kind' using errcode='22023';
  end if;

  if auth.uid() is not null then
    new.recorded_by:=auth.uid();
  end if;

  return new;
end;
$$;

revoke all on function private.validate_requirement_evidence_context() from public, anon, authenticated;
