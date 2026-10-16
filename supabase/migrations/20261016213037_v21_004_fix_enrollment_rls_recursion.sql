create or replace function private.can_use_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
select exists(
  select 1
  from public.enrollments e
  join public.learners l on l.id=e.learner_id
  join public.course_editions d on d.id=e.edition_id
  where e.id=p_enrollment_id
    and (
      l.auth_user_id=auth.uid()
      or private.can_access_company(d.organization_id,d.company_id)
    )
);
$$;

comment on function private.can_use_enrollment(uuid) is
'RLS helper for enrollment-bound resources. SECURITY DEFINER with row_security=off prevents recursive evaluation of enrollments_read while preserving auth.uid()/staff authorization checks.';
