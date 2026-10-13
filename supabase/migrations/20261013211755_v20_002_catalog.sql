-- SafetyTraining Cloud v20 — versioned course/content catalog
create table public.courses (
 id uuid primary key default gen_random_uuid(), owner_organization_id uuid references public.organizations(id) on delete cascade,
 stable_key text not null unique,title text not null,family text not null default 'other',description text,
 nominal_minutes integer check(nominal_minutes is null or nominal_minutes>=0),
 certification_mode text not null default 'internal_learning' check(certification_mode in ('internal_learning','certifiable','certified_only')),
 active boolean not null default true,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.course_versions (
 id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses(id) on delete cascade,
 version_number integer not null check(version_number>0),status text not null default 'draft' check(status in ('draft','published','retired')),
 effective_from date,effective_to date,syllabus_snapshot jsonb not null default '{}'::jsonb,normative_snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),published_at timestamptz,unique(course_id,version_number)
);
create table public.learning_units (
 id uuid primary key default gen_random_uuid(),owner_organization_id uuid references public.organizations(id) on delete cascade,
 stable_key text not null unique,title text not null,summary text,default_minutes integer check(default_minutes is null or default_minutes>=0),
 source_group text,tags text[] not null default '{}',active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.learning_unit_versions (
 id uuid primary key default gen_random_uuid(),learning_unit_id uuid not null references public.learning_units(id) on delete cascade,
 version_number integer not null check(version_number>0),status text not null default 'draft' check(status in ('draft','published','retired')),
 content jsonb not null default '{}'::jsonb,content_hash text,created_at timestamptz not null default now(),published_at timestamptz,
 unique(learning_unit_id,version_number)
);
create table public.course_modules (
 id uuid primary key default gen_random_uuid(),course_version_id uuid not null references public.course_versions(id) on delete cascade,
 module_key text not null,title text not null,position integer not null default 0,nominal_minutes integer check(nominal_minutes is null or nominal_minutes>=0),
 unique(course_version_id,module_key)
);
create table public.course_module_units (
 id uuid primary key default gen_random_uuid(),module_id uuid not null references public.course_modules(id) on delete cascade,
 unit_version_id uuid not null references public.learning_unit_versions(id) on delete restrict,position integer not null default 0,
 required boolean not null default true,min_active_seconds integer not null default 0 check(min_active_seconds>=0),
 requires_comprehension boolean not null default true,completion_rules jsonb not null default '{}'::jsonb,unique(module_id,unit_version_id)
);
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();
create trigger learning_units_touch before update on public.learning_units for each row execute function public.touch_updated_at();
alter table public.courses enable row level security; alter table public.course_versions enable row level security;
alter table public.learning_units enable row level security; alter table public.learning_unit_versions enable row level security;
alter table public.course_modules enable row level security; alter table public.course_module_units enable row level security;
create policy courses_read on public.courses for select to authenticated using(active and (owner_organization_id is null or public.has_org_role(owner_organization_id,array['organization_admin','training_manager','teacher','tutor','company_admin','learner']) or exists(select 1 from public.learners l where l.auth_user_id=auth.uid() and l.organization_id=owner_organization_id)));
create policy courses_manage on public.courses for all to authenticated using(public.is_platform_admin() or (owner_organization_id is not null and public.has_org_role(owner_organization_id,array['organization_admin','training_manager']))) with check(public.is_platform_admin() or (owner_organization_id is not null and public.has_org_role(owner_organization_id,array['organization_admin','training_manager'])));
create policy course_versions_read on public.course_versions for select to authenticated using(exists(select 1 from public.courses c where c.id=course_id and (status='published' or public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager','teacher','tutor'])))));
create policy course_versions_manage on public.course_versions for all to authenticated using(exists(select 1 from public.courses c where c.id=course_id and (public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager']))))) with check(exists(select 1 from public.courses c where c.id=course_id and (public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])))));
create policy learning_units_read on public.learning_units for select to authenticated using(active);
create policy learning_units_manage on public.learning_units for all to authenticated using(public.is_platform_admin() or (owner_organization_id is not null and public.has_org_role(owner_organization_id,array['organization_admin','training_manager']))) with check(public.is_platform_admin() or (owner_organization_id is not null and public.has_org_role(owner_organization_id,array['organization_admin','training_manager'])));
create policy learning_unit_versions_read on public.learning_unit_versions for select to authenticated using(status='published' or exists(select 1 from public.learning_units u where u.id=learning_unit_id and (public.is_platform_admin() or (u.owner_organization_id is not null and public.has_org_role(u.owner_organization_id,array['organization_admin','training_manager','teacher','tutor'])))));
create policy learning_unit_versions_manage on public.learning_unit_versions for all to authenticated using(exists(select 1 from public.learning_units u where u.id=learning_unit_id and (public.is_platform_admin() or (u.owner_organization_id is not null and public.has_org_role(u.owner_organization_id,array['organization_admin','training_manager']))))) with check(exists(select 1 from public.learning_units u where u.id=learning_unit_id and (public.is_platform_admin() or (u.owner_organization_id is not null and public.has_org_role(u.owner_organization_id,array['organization_admin','training_manager'])))));
create policy modules_read on public.course_modules for select to authenticated using(exists(select 1 from public.course_versions v where v.id=course_version_id and (v.status='published' or public.is_platform_admin())));
create policy modules_manage on public.course_modules for all to authenticated using(exists(select 1 from public.course_versions v join public.courses c on c.id=v.course_id where v.id=course_version_id and (public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager']))))) with check(exists(select 1 from public.course_versions v join public.courses c on c.id=v.course_id where v.id=course_version_id and (public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])))));
create policy module_units_read on public.course_module_units for select to authenticated using(exists(select 1 from public.course_modules m join public.course_versions v on v.id=m.course_version_id where m.id=module_id and (v.status='published' or public.is_platform_admin())));
create policy module_units_manage on public.course_module_units for all to authenticated using(exists(select 1 from public.course_modules m join public.course_versions v on v.id=m.course_version_id join public.courses c on c.id=v.course_id where m.id=module_id and (public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager']))))) with check(exists(select 1 from public.course_modules m join public.course_versions v on v.id=m.course_version_id join public.courses c on c.id=v.course_id where m.id=module_id and (public.is_platform_admin() or (c.owner_organization_id is not null and public.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])))));
