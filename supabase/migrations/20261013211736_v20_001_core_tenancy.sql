-- SafetyTraining Cloud v20 — core tenancy/auth foundation
-- Applied to Supabase project ejkwvatmzdqqjozpxntk on 2026-10-13.
create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end; $$;

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text, locale text not null default 'it-IT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, code text unique,
  active boolean not null default true, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.companies (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, vat_number text, fiscal_code text, ateco_code text, active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index companies_org_idx on public.companies(organization_id,active);
create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  role text not null check(role in ('organization_admin','training_manager','teacher','tutor','company_admin','learner')),
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index memberships_unique_ctx_idx on public.organization_memberships(user_id,organization_id,coalesce(company_id,'00000000-0000-0000-0000-000000000000'::uuid),role);
create index memberships_user_idx on public.organization_memberships(user_id) where active;
create table public.learners (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null, auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text,last_name text,email text,fiscal_code text,job_title text,active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index learners_org_company_idx on public.learners(organization_id,company_id,active);

create or replace function public.is_platform_admin() returns boolean language sql stable security definer set search_path=public,auth as $$
select exists(select 1 from public.platform_admins a where a.user_id=auth.uid()); $$;
create or replace function public.has_org_role(p_organization_id uuid,p_roles text[]) returns boolean language sql stable security definer set search_path=public,auth as $$
select public.is_platform_admin() or exists(select 1 from public.organization_memberships m where m.user_id=auth.uid() and m.organization_id=p_organization_id and m.active and m.role=any(p_roles)); $$;
create or replace function public.can_access_company(p_organization_id uuid,p_company_id uuid) returns boolean language sql stable security definer set search_path=public,auth as $$
select public.is_platform_admin() or exists(select 1 from public.organization_memberships m where m.user_id=auth.uid() and m.organization_id=p_organization_id and m.active and (m.role in ('organization_admin','training_manager','teacher','tutor') or (m.role='company_admin' and m.company_id is not distinct from p_company_id))); $$;
create or replace function public.current_learner_id() returns uuid language sql stable security definer set search_path=public,auth as $$
select l.id from public.learners l where l.auth_user_id=auth.uid() and l.active limit 1; $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger companies_touch before update on public.companies for each row execute function public.touch_updated_at();
create trigger memberships_touch before update on public.organization_memberships for each row execute function public.touch_updated_at();
create trigger learners_touch before update on public.learners for each row execute function public.touch_updated_at();

alter table public.platform_admins enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.companies enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.learners enable row level security;

revoke all on function public.is_platform_admin() from public,anon;
revoke all on function public.has_org_role(uuid,text[]) from public,anon;
revoke all on function public.can_access_company(uuid,uuid) from public,anon;
revoke all on function public.current_learner_id() from public,anon;
grant execute on function public.is_platform_admin() to authenticated,service_role;
grant execute on function public.has_org_role(uuid,text[]) to authenticated,service_role;
grant execute on function public.can_access_company(uuid,uuid) to authenticated,service_role;
grant execute on function public.current_learner_id() to authenticated,service_role;

create policy platform_admins_read on public.platform_admins for select to authenticated using(user_id=auth.uid() or public.is_platform_admin());
create policy profiles_self on public.profiles for select to authenticated using(user_id=auth.uid() or public.is_platform_admin());
create policy profiles_insert on public.profiles for insert to authenticated with check(user_id=auth.uid());
create policy profiles_update on public.profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy organizations_read on public.organizations for select to authenticated using(public.is_platform_admin() or exists(select 1 from public.organization_memberships m where m.organization_id=id and m.user_id=auth.uid() and m.active));
create policy companies_read on public.companies for select to authenticated using(public.can_access_company(organization_id,id) or exists(select 1 from public.learners l where l.auth_user_id=auth.uid() and l.company_id=id));
create policy memberships_read on public.organization_memberships for select to authenticated using(user_id=auth.uid() or public.has_org_role(organization_id,array['organization_admin','training_manager']));
create policy learners_read on public.learners for select to authenticated using(auth_user_id=auth.uid() or public.can_access_company(organization_id,company_id));
create policy companies_manage on public.companies for all to authenticated using(public.has_org_role(organization_id,array['organization_admin','training_manager'])) with check(public.has_org_role(organization_id,array['organization_admin','training_manager']));
create policy memberships_manage on public.organization_memberships for all to authenticated using(public.has_org_role(organization_id,array['organization_admin'])) with check(public.has_org_role(organization_id,array['organization_admin']));
create policy learners_manage on public.learners for all to authenticated using(public.can_access_company(organization_id,company_id)) with check(public.can_access_company(organization_id,company_id));
