-- SafetyTraining v20.013
-- Enable platform-admin management of tenant roots and fix two self-join typos in read policies.

create policy organizations_manage_platform_admin
on public.organizations
for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists organizations_read on public.organizations;
create policy organizations_read
on public.organizations
for select to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = organizations.id
      and m.user_id = auth.uid()
      and m.active
  )
);

drop policy if exists companies_read on public.companies;
create policy companies_read
on public.companies
for select to authenticated
using (
  private.can_access_company(organization_id, id)
  or exists (
    select 1
    from public.learners l
    where l.auth_user_id = auth.uid()
      and l.company_id = companies.id
  )
);
