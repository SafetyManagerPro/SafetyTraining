create or replace function private.can_manage_edition_id(p_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
select exists(
  select 1
  from public.course_editions d
  where d.id=p_edition_id
    and private.can_access_company(d.organization_id,d.company_id)
);
$$;

create or replace function private.current_user_has_edition_enrollment(p_edition_id uuid)
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
  where e.edition_id=p_edition_id
    and l.auth_user_id=auth.uid()
    and e.status <> 'revoked'
);
$$;

drop policy if exists enrollments_manage_staff on public.enrollments;
create policy enrollments_manage_staff
on public.enrollments
for all
to authenticated
using (private.can_manage_edition_id(edition_id))
with check (private.can_manage_edition_id(edition_id));

drop policy if exists editions_read on public.course_editions;
create policy editions_read
on public.course_editions
for select
to authenticated
using (
  private.can_access_company(organization_id,company_id)
  or private.current_user_has_edition_enrollment(id)
);

comment on function private.can_manage_edition_id(uuid) is
'RLS-safe helper used by enrollment staff policies. Internal edition lookup runs with row_security=off to avoid course_editions/enrollments policy recursion.';
comment on function private.current_user_has_edition_enrollment(uuid) is
'RLS-safe learner helper used by course_editions read policy. Internal enrollment lookup runs with row_security=off to break cross-table RLS recursion.';
