create table if not exists public.training_sources (
  source_key text primary key,
  authority text not null,
  title text not null,
  source_type text not null,
  canonical_url text not null,
  publication_date date,
  checked_on date not null default current_date,
  license_kind text not null default 'unknown',
  reuse_policy text not null,
  normative_status text not null default 'supporting',
  topics text[] not null default '{}'::text[],
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_unit_sources (
  learning_unit_id uuid not null references public.learning_units(id) on delete cascade,
  source_key text not null references public.training_sources(source_key) on delete cascade,
  purpose text not null,
  relevance_note text,
  verified_on date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  primary key (learning_unit_id, source_key, purpose)
);

create index if not exists learning_unit_sources_source_idx on public.learning_unit_sources(source_key);
create index if not exists training_sources_topics_gin on public.training_sources using gin(topics);

alter table public.training_sources enable row level security;
alter table public.learning_unit_sources enable row level security;

grant select, insert, update, delete on public.training_sources to authenticated;
grant select, insert, update, delete on public.learning_unit_sources to authenticated;

create policy training_sources_admin_all on public.training_sources
for all to authenticated
using (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())))
with check (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())));

create policy learning_unit_sources_admin_all on public.learning_unit_sources
for all to authenticated
using (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())))
with check (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())));