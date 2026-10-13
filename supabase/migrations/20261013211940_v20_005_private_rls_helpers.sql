-- SafetyTraining Cloud v20 — move SECURITY DEFINER RLS helpers outside exposed public API schema.
create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated,service_role;

alter function public.is_platform_admin() set schema private;
alter function public.has_org_role(uuid,text[]) set schema private;
alter function public.can_access_company(uuid,uuid) set schema private;
alter function public.current_learner_id() set schema private;
alter function public.can_use_enrollment(uuid) set schema private;

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path=public,private,auth as $$
select exists(select 1 from public.platform_admins a where a.user_id=auth.uid()); $$;
create or replace function private.has_org_role(p_organization_id uuid,p_roles text[])
returns boolean language sql stable security definer set search_path=public,private,auth as $$
select private.is_platform_admin() or exists(select 1 from public.organization_memberships m where m.user_id=auth.uid() and m.organization_id=p_organization_id and m.active and m.role=any(p_roles)); $$;
create or replace function private.can_access_company(p_organization_id uuid,p_company_id uuid)
returns boolean language sql stable security definer set search_path=public,private,auth as $$
select private.is_platform_admin() or exists(select 1 from public.organization_memberships m where m.user_id=auth.uid() and m.organization_id=p_organization_id and m.active and (m.role in ('organization_admin','training_manager','teacher','tutor') or (m.role='company_admin' and m.company_id is not distinct from p_company_id))); $$;
create or replace function private.current_learner_id()
returns uuid language sql stable security definer set search_path=public,private,auth as $$
select l.id from public.learners l where l.auth_user_id=auth.uid() and l.active limit 1; $$;
create or replace function private.can_use_enrollment(p_enrollment_id uuid)
returns boolean language sql stable security definer set search_path=public,private,auth as $$
select exists(select 1 from public.enrollments e join public.learners l on l.id=e.learner_id join public.course_editions d on d.id=e.edition_id where e.id=p_enrollment_id and (l.auth_user_id=auth.uid() or private.can_access_company(d.organization_id,d.company_id))); $$;

revoke all on all functions in schema private from public,anon;
grant execute on function private.is_platform_admin() to authenticated,service_role;
grant execute on function private.has_org_role(uuid,text[]) to authenticated,service_role;
grant execute on function private.can_access_company(uuid,uuid) to authenticated,service_role;
grant execute on function private.current_learner_id() to authenticated,service_role;
grant execute on function private.can_use_enrollment(uuid) to authenticated,service_role;
