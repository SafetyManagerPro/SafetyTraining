-- v22.2: read-only staff-scoped audit timeline for additive practice assessments.
create or replace function public.admin_practice_assessment_history_v22(
  p_enrollment_id uuid,
  p_requirement_key text default null,
  p_lab_key text default null
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
  v_org uuid;
  v_company uuid;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if p_enrollment_id is null then
    raise exception 'enrollment_required' using errcode='22023';
  end if;
  select d.organization_id, d.company_id into v_org, v_company
  from public.enrollments e
  join public.course_editions d on d.id=e.edition_id
  where e.id=p_enrollment_id;
  if v_org is null then
    raise exception 'enrollment_not_found' using errcode='P0002';
  end if;
  if not private.can_access_company(v_org,v_company) then
    raise exception 'staff_access_required' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(entry.payload order by entry.created_at desc), '[]'::jsonb)
    into v_result
  from (
    select a.created_at,
      jsonb_build_object(
        'when', a.created_at,
        'status', a.after_state->>'status',
        'requirement_key', a.context->>'requirement_key',
        'lab_key', a.context->>'lab_key',
        'instructor_name', a.after_state->>'instructor_name',
        'observed_on', a.after_state->>'observed_on',
        'notes', a.after_state->>'notes',
        'critical_issue', coalesce((a.after_state->>'critical_issue')::boolean,false),
        'step_marks', coalesce(a.after_state->'step_marks','[]'::jsonb),
        'checklist_marks', coalesce(a.after_state->'checklist_marks','[]'::jsonb)
      ) as payload
    from private.admin_audit_log a
    where a.organization_id=v_org
      and a.entity_type='enrollment_practice_assessments_v22'
      and a.action in ('practice_assessment.draft','practice_assessment.recorded')
      and a.context->>'enrollment_id'=p_enrollment_id::text
      and (p_requirement_key is null or a.context->>'requirement_key'=btrim(p_requirement_key))
      and (p_lab_key is null or a.context->>'lab_key'=btrim(p_lab_key))
    order by a.created_at desc
    limit 50
  ) entry;
  return v_result;
end;
$$;
revoke all on function public.admin_practice_assessment_history_v22(uuid,text,text) from public, anon;
grant execute on function public.admin_practice_assessment_history_v22(uuid,text,text) to authenticated;
