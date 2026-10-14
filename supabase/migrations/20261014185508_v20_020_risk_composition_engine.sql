-- SafetyTraining v20.020
-- Risk-based Learning Unit composition for SafetyManager imports.
-- This engine only proposes content. It never auto-publishes a course and does not replace
-- DVR, mansione, procedure aziendali, addestramento or required practical activities.

create table if not exists public.learning_unit_risk_links (
  learning_unit_id uuid not null references public.learning_units(id) on delete cascade,
  risk_code text not null references public.risk_catalog(code) on update cascade on delete cascade,
  relevance integer not null default 90 check (relevance between 1 and 100),
  role text not null default 'core' check (role in ('core','supporting','specialist')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (learning_unit_id, risk_code)
);
create index if not exists learning_unit_risk_links_risk_idx on public.learning_unit_risk_links(risk_code,relevance desc);

create table if not exists public.safetymanager_risk_aliases (
  source_code text not null,
  risk_code text not null references public.risk_catalog(code) on update cascade on delete cascade,
  confidence integer not null default 90 check (confidence between 1 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_code,risk_code)
);
create index if not exists safetymanager_risk_aliases_risk_idx on public.safetymanager_risk_aliases(risk_code);

create table if not exists public.safetymanager_course_risk_profiles (
  external_course_code text not null,
  risk_code text not null references public.risk_catalog(code) on update cascade on delete cascade,
  requirement text not null default 'recommended' check (requirement in ('core','recommended','contextual')),
  relevance integer not null default 80 check (relevance between 1 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (external_course_code,risk_code)
);
create index if not exists safetymanager_course_risk_profiles_risk_idx on public.safetymanager_course_risk_profiles(risk_code);

create table if not exists public.safetymanager_course_unit_sources (
  external_course_code text not null,
  source_group text not null,
  relevance integer not null default 75 check (relevance between 1 and 100),
  role text not null default 'supporting' check (role in ('core','supporting','contextual')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (external_course_code,source_group)
);
create index if not exists safetymanager_course_unit_sources_group_idx on public.safetymanager_course_unit_sources(source_group);

create table if not exists public.integration_training_contexts (
  source_system text not null,
  external_project_id text not null,
  local_edition_id uuid null references public.course_editions(id) on delete set null,
  local_company_id uuid null references public.companies(id) on delete set null,
  external_course_code text null,
  source_sector_code text null,
  source_risk_codes text[] not null default '{}'::text[],
  normalized_risk_codes text[] not null default '{}'::text[],
  custom_risks text[] not null default '{}'::text[],
  analysis_accepted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_system,external_project_id)
);
create index if not exists integration_training_contexts_edition_idx on public.integration_training_contexts(local_edition_id);
create index if not exists integration_training_contexts_company_idx on public.integration_training_contexts(local_company_id);
create index if not exists integration_training_contexts_course_idx on public.integration_training_contexts(external_course_code);

alter table public.learning_unit_risk_links enable row level security;
alter table public.safetymanager_risk_aliases enable row level security;
alter table public.safetymanager_course_risk_profiles enable row level security;
alter table public.safetymanager_course_unit_sources enable row level security;
alter table public.integration_training_contexts enable row level security;

drop policy if exists learning_unit_risk_links_admin on public.learning_unit_risk_links;
create policy learning_unit_risk_links_admin on public.learning_unit_risk_links for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
drop policy if exists safetymanager_risk_aliases_admin on public.safetymanager_risk_aliases;
create policy safetymanager_risk_aliases_admin on public.safetymanager_risk_aliases for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
drop policy if exists safetymanager_course_risk_profiles_admin on public.safetymanager_course_risk_profiles;
create policy safetymanager_course_risk_profiles_admin on public.safetymanager_course_risk_profiles for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
drop policy if exists safetymanager_course_unit_sources_admin on public.safetymanager_course_unit_sources;
create policy safetymanager_course_unit_sources_admin on public.safetymanager_course_unit_sources for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
drop policy if exists integration_training_contexts_admin on public.integration_training_contexts;
create policy integration_training_contexts_admin on public.integration_training_contexts for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

grant select,insert,update,delete on public.learning_unit_risk_links to authenticated;
grant select,insert,update,delete on public.safetymanager_risk_aliases to authenticated;
grant select,insert,update,delete on public.safetymanager_course_risk_profiles to authenticated;
grant select,insert,update,delete on public.safetymanager_course_unit_sources to authenticated;
grant select,insert,update,delete on public.integration_training_contexts to authenticated;

-- Existing Learning Unit tags are the first deterministic semantic link to the risk catalog.
insert into public.learning_unit_risk_links(learning_unit_id,risk_code,relevance,role,metadata)
select distinct lu.id,rc.code,90,'core',jsonb_build_object('source','learning_unit.tags','engine','risk-v1')
from public.learning_units lu
cross join lateral unnest(lu.tags) tag(value)
join public.risk_catalog rc on rc.code=tag.value and rc.active
where lu.active
on conflict (learning_unit_id,risk_code) do update set relevance=excluded.relevance,metadata=public.learning_unit_risk_links.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_risk_aliases(source_code,risk_code,confidence,metadata) values
('vd_t','vdt',100,'{"source":"SafetyManager Step60"}'),('vdt','vdt',100,'{"source":"SafetyManager Step60"}'),
('postura','mmc',95,'{"source":"SafetyManager Step60"}'),('posture','mmc',95,'{"source":"SafetyManager Step60"}'),('carichi','mmc',95,'{"source":"SafetyManager Step60"}'),('mmc','mmc',100,'{"source":"SafetyManager Step60"}'),('movimentazione','mmc',90,'{"source":"SafetyManager Step60"}'),('ripetitivi','mmc',90,'{"source":"SafetyManager Step60"}'),
('microclima','weather',100,'{"source":"SafetyManager Step60"}'),('caldo','weather',95,'{"source":"SafetyManager Step60"}'),('freddo','weather',95,'{"source":"SafetyManager Step60"}'),('meteo','weather',95,'{"source":"SafetyManager Step60"}'),
('elettrico','electrical',100,'{"source":"SafetyManager Step60"}'),
('incendio','emergency',100,'{"source":"SafetyManager Step60"}'),('esodo','emergency',100,'{"source":"SafetyManager Step60"}'),('emergenza','emergency',100,'{"source":"SafetyManager Step60"}'),('emergenze','emergency',100,'{"source":"SafetyManager Step60"}'),
('stress','organization',100,'{"source":"SafetyManager Step60"}'),('stress_pubblico','organization',95,'{"source":"SafetyManager Step60"}'),('affollamento','organization',80,'{"source":"SafetyManager Step60"}'),('fatica','organization',90,'{"source":"SafetyManager Step60"}'),
('aggressioni','aggression',100,'{"source":"SafetyManager Step60"}'),('violenza','aggression',100,'{"source":"SafetyManager Step60"}'),('conflitto','aggression',95,'{"source":"SafetyManager Step60"}'),('rapina','aggression',90,'{"source":"SafetyManager Step60"}'),
('biologico','bio',100,'{"source":"SafetyManager Step60"}'),
('chimico','chemical',100,'{"source":"SafetyManager Step60"}'),('sostanze','chemical',95,'{"source":"SafetyManager Step60"}'),('polveri','chemical',80,'{"source":"SafetyManager Step60"}'),
('meccanici','machine',100,'{"source":"SafetyManager Step60"}'),('macchine','machine',100,'{"source":"SafetyManager Step60"}'),('attrezzature','machine',100,'{"source":"SafetyManager Step60"}'),('utensili','machine',95,'{"source":"SafetyManager Step60"}'),('tagli','machine',80,'{"source":"SafetyManager Step60"}'),('taglio','machine',80,'{"source":"SafetyManager Step60"}'),
('cadute','space',80,'{"source":"SafetyManager Step60","note":"cadute generiche/in piano; quota separata"}'),('illuminazione','space',75,'{"source":"SafetyManager Step60"}'),('confinati','space',100,'{"source":"SafetyManager Step60"}'),('spazi_confinati','space',100,'{"source":"SafetyManager Step60"}'),
('quota','height',100,'{"source":"SafetyManager Step60"}'),('cadute_alto','height',100,'{"source":"SafetyManager Step60"}'),('caduta_alto','height',100,'{"source":"SafetyManager Step60"}'),
('traffico','traffic',100,'{"source":"SafetyManager Step60"}'),('investimento','traffic',100,'{"source":"SafetyManager Step60"}'),('veicoli','traffic',95,'{"source":"SafetyManager Step60"}'),('stradale','traffic',100,'{"source":"SafetyManager Step60"}'),
('rumore','noise',100,'{"source":"SafetyManager Step60"}'),('vibrazioni','noise',100,'{"source":"SafetyManager Step60"}')
on conflict (source_code,risk_code) do update set confidence=excluded.confidence,metadata=public.safetymanager_risk_aliases.metadata||excluded.metadata,updated_at=now();

-- Conservative general baseline for every administrative course.
insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata)
select external_course_code,'general','contextual',45,jsonb_build_object('source','course-profile-v1')
from public.integration_course_catalog where source_system='safetymanager'
on conflict (external_course_code,risk_code) do nothing;

-- Worker profiles. Project/DVR risk context has priority during composition.
insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata) values
('lav_basso','general','core',100,'{"profile":"worker-low"}'),('lav_basso','system','core',90,'{"profile":"worker-low"}'),('lav_basso','electrical','recommended',70,'{"profile":"worker-low"}'),('lav_basso','vdt','recommended',70,'{"profile":"worker-low"}'),('lav_basso','mmc','recommended',70,'{"profile":"worker-low"}'),('lav_basso','organization','recommended',70,'{"profile":"worker-low"}'),('lav_basso','emergency','recommended',70,'{"profile":"worker-low"}'),('lav_basso','space','recommended',65,'{"profile":"worker-low"}'),
('lav_medio','general','core',100,'{"profile":"worker-medium"}'),('lav_medio','system','core',90,'{"profile":"worker-medium"}'),('lav_medio','electrical','recommended',75,'{"profile":"worker-medium"}'),('lav_medio','mmc','recommended',80,'{"profile":"worker-medium"}'),('lav_medio','organization','recommended',75,'{"profile":"worker-medium"}'),('lav_medio','emergency','recommended',75,'{"profile":"worker-medium"}'),('lav_medio','space','recommended',70,'{"profile":"worker-medium"}'),('lav_medio','machine','recommended',80,'{"profile":"worker-medium"}'),('lav_medio','chemical','recommended',75,'{"profile":"worker-medium"}'),('lav_medio','bio','recommended',70,'{"profile":"worker-medium"}'),('lav_medio','noise','recommended',75,'{"profile":"worker-medium"}'),
('lav_alto','general','core',100,'{"profile":"worker-high"}'),('lav_alto','system','core',90,'{"profile":"worker-high"}'),('lav_alto','electrical','recommended',85,'{"profile":"worker-high"}'),('lav_alto','mmc','recommended',85,'{"profile":"worker-high"}'),('lav_alto','organization','recommended',75,'{"profile":"worker-high"}'),('lav_alto','emergency','recommended',85,'{"profile":"worker-high"}'),('lav_alto','space','recommended',80,'{"profile":"worker-high"}'),('lav_alto','machine','recommended',95,'{"profile":"worker-high"}'),('lav_alto','chemical','recommended',90,'{"profile":"worker-high"}'),('lav_alto','bio','recommended',80,'{"profile":"worker-high"}'),('lav_alto','noise','recommended',90,'{"profile":"worker-high"}'),('lav_alto','height','contextual',75,'{"profile":"worker-high"}'),('lav_alto','traffic','contextual',70,'{"profile":"worker-high"}'),('lav_alto','weather','contextual',65,'{"profile":"worker-high"}'),
('agg_lav','general','core',90,'{"profile":"worker-update"}'),('agg_lav','system','recommended',80,'{"profile":"worker-update"}')
on conflict (external_course_code,risk_code) do update set requirement=excluded.requirement,relevance=excluded.relevance,metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

-- Role/governance courses.
insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata)
select c.external_course_code,r.risk_code,r.requirement,r.relevance,jsonb_build_object('profile','governance')
from public.integration_course_catalog c
cross join (values ('system','core',100),('organization','recommended',85),('general','recommended',75),('emergency','contextual',55)) r(risk_code,requirement,relevance)
where c.source_system='safetymanager' and c.external_course_code ~ '^(preposto|dirigente|dl_base|agg_prep|agg_dir|agg_dl)$'
on conflict (external_course_code,risk_code) do update set requirement=excluded.requirement,relevance=excluded.relevance,metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata)
select c.external_course_code,r.risk_code,r.requirement,r.relevance,jsonb_build_object('profile','rls')
from public.integration_course_catalog c
cross join (values ('system','core',100),('general','recommended',80),('organization','recommended',70)) r(risk_code,requirement,relevance)
where c.source_system='safetymanager' and c.external_course_code ~ '^(rls|agg_rls_)'
on conflict (external_course_code,risk_code) do update set requirement=excluded.requirement,relevance=excluded.relevance,metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

-- Special/equipment course profiles.
insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata)
select c.external_course_code,r.risk_code,r.requirement,r.relevance,jsonb_build_object('profile','equipment')
from public.integration_course_catalog c
cross join (values ('machine','core',100),('noise','recommended',70),('traffic','contextual',60),('general','recommended',60)) r(risk_code,requirement,relevance)
where c.source_system='safetymanager' and (c.external_course_code like 'attr_%' or c.external_course_code like 'agg_attr_%')
on conflict (external_course_code,risk_code) do update set requirement=excluded.requirement,relevance=excluded.relevance,metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata)
select external_course_code,'height','recommended',85,jsonb_build_object('profile','equipment-height')
from public.integration_course_catalog where source_system='safetymanager' and (external_course_code like '%ple%' or external_course_code like '%gru_%' or external_course_code like '%carroponte%')
on conflict (external_course_code,risk_code) do update set requirement=excluded.requirement,relevance=excluded.relevance,metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata) values
('amb_confinati','space','core',100,'{"profile":"confined"}'),('amb_confinati','chemical','recommended',95,'{"profile":"confined"}'),('amb_confinati','bio','recommended',80,'{"profile":"confined"}'),('amb_confinati','emergency','recommended',90,'{"profile":"confined"}'),
('agg_spazi_confinati_4h','space','core',100,'{"profile":"confined"}'),('agg_spazi_confinati_4h','chemical','recommended',95,'{"profile":"confined"}'),('agg_spazi_confinati_4h','bio','recommended',80,'{"profile":"confined"}'),('agg_spazi_confinati_4h','emergency','recommended',90,'{"profile":"confined"}'),
('lav_quota','height','core',100,'{"profile":"work-height"}'),('lav_quota','machine','recommended',75,'{"profile":"work-height"}'),('lav_quota','general','recommended',65,'{"profile":"work-height"}'),
('antincendio_liv2','emergency','core',100,'{"profile":"fire"}'),('agg_antincendio_liv2_5h','emergency','core',100,'{"profile":"fire"}'),('primo_soccorso_12h','emergency','core',100,'{"profile":"emergency"}'),('agg_primo_soccorso_4h','emergency','core',100,'{"profile":"emergency"}')
on conflict (external_course_code,risk_code) do update set requirement=excluded.requirement,relevance=excluded.relevance,metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

-- Source-group affinities prevent unrelated specialist content from ranking highly.
insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select external_course_code,'generale',70,'supporting','{"source":"source-affinity-v1"}'::jsonb from public.integration_course_catalog where source_system='safetymanager'
on conflict (external_course_code,source_group) do nothing;
insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select external_course_code,'fondamenti',70,'supporting','{"source":"source-affinity-v1"}'::jsonb from public.integration_course_catalog where source_system='safetymanager'
on conflict (external_course_code,source_group) do nothing;

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select c.external_course_code,g.source_group,g.relevance,g.role,'{"profile":"worker"}'::jsonb
from public.integration_course_catalog c cross join (values ('generale',100,'core'),('fondamenti',85,'core'),('frontoffice',78,'contextual'),('backoffice',78,'contextual'),('ecologici',78,'contextual'),('verde',78,'contextual'),('polizia',72,'contextual')) g(source_group,relevance,role)
where c.source_system='safetymanager' and c.external_course_code in ('lav_basso','lav_medio','lav_alto','agg_lav')
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select c.external_course_code,g.source_group,g.relevance,g.role,'{"profile":"rls"}'::jsonb
from public.integration_course_catalog c cross join (values ('rls',100,'core'),('fondamenti',90,'core'),('generale',75,'supporting')) g(source_group,relevance,role)
where c.source_system='safetymanager' and c.external_course_code ~ '^(rls|agg_rls_)'
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select c.external_course_code,g.source_group,g.relevance,g.role,'{"profile":"fire"}'::jsonb
from public.integration_course_catalog c cross join (values ('antincendio',100,'core'),('fondamenti',55,'supporting'),('generale',45,'supporting')) g(source_group,relevance,role)
where c.source_system='safetymanager' and c.external_course_code in ('antincendio_liv2','agg_antincendio_liv2_5h')
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select c.external_course_code,g.source_group,g.relevance,g.role,'{"profile":"governance"}'::jsonb
from public.integration_course_catalog c cross join (values ('fondamenti',100,'core'),('rls',80,'supporting'),('generale',80,'supporting')) g(source_group,relevance,role)
where c.source_system='safetymanager' and (c.external_course_code ~ '^(preposto|dirigente|dl_|agg_prep|agg_dir|agg_dl|mod_cantieri)' or c.external_course_code='agg_dl_spp')
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select c.external_course_code,g.source_group,g.relevance,g.role,'{"profile":"equipment"}'::jsonb
from public.integration_course_catalog c cross join (values ('verde',90,'contextual'),('ecologici',85,'contextual'),('polizia',65,'contextual'),('generale',65,'supporting'),('fondamenti',55,'supporting')) g(source_group,relevance,role)
where c.source_system='safetymanager' and (c.external_course_code like 'attr_%' or c.external_course_code like 'agg_attr_%' or c.external_course_code='lav_quota')
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select c.external_course_code,g.source_group,g.relevance,g.role,'{"profile":"confined"}'::jsonb
from public.integration_course_catalog c cross join (values ('ecologici',90,'contextual'),('verde',75,'contextual'),('antincendio',65,'supporting'),('generale',60,'supporting'),('fondamenti',55,'supporting')) g(source_group,relevance,role)
where c.source_system='safetymanager' and c.external_course_code in ('amb_confinati','agg_spazi_confinati_4h')
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

create or replace function public.preview_safetymanager_composition(p_external_course_code text,p_risk_codes text[] default '{}'::text[])
returns jsonb language plpgsql security definer set search_path=public,private,auth as $$
declare
  v_code text := lower(nullif(btrim(coalesce(p_external_course_code,'')),''));
  v_title text; v_target_minutes integer; v_requires_presence boolean := false;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;
  if v_code is null then raise exception 'external course code required'; end if;
  select c.title,c.nominal_minutes,lower(coalesce(c.metadata->>'requires_presence','false')) in ('true','1','yes')
    into v_title,v_target_minutes,v_requires_presence
  from public.integration_course_catalog c where c.source_system='safetymanager' and c.external_course_code=v_code;
  if v_title is null then raise exception 'SafetyManager course not found in catalog'; end if;

  return (
    with input_raw as (
      select distinct lower(btrim(x)) source_code from unnest(coalesce(p_risk_codes,'{}'::text[])) x where nullif(btrim(x),'') is not null
    ), input_risks as (
      select rc.code risk_code,100 weight,'project'::text source from input_raw i join public.risk_catalog rc on lower(rc.code)=i.source_code and rc.active
      union all select a.risk_code,a.confidence,'project_alias'::text from input_raw i join public.safetymanager_risk_aliases a on lower(a.source_code)=i.source_code
    ), profile_risks as (
      select p.risk_code,p.relevance weight,('course_'||p.requirement)::text source from public.safetymanager_course_risk_profiles p where p.external_course_code=v_code
    ), effective as (
      select risk_code,max(weight)::integer weight,string_agg(distinct source,',') sources from (select * from input_risks union all select * from profile_risks) z group by risk_code
    ), affinity as (
      select source_group,relevance,role from public.safetymanager_course_unit_sources where external_course_code=v_code
    ), candidates as (
      select lu.id,lu.stable_key,lu.title,lu.default_minutes,lu.source_group,
             max(round((l.relevance*e.weight*coalesce(a.relevance,55))/10000.0))::integer + least(15,greatest(0,(count(distinct e.risk_code)-1)*5)) score,
             array_agg(distinct l.risk_code order by l.risk_code) risk_codes
      from effective e join public.learning_unit_risk_links l on l.risk_code=e.risk_code join public.learning_units lu on lu.id=l.learning_unit_id and lu.active
      left join affinity a on a.source_group=lu.source_group
      where exists(select 1 from public.learning_unit_versions luv where luv.learning_unit_id=lu.id and luv.status='published')
        and (not exists(select 1 from affinity) or a.source_group is not null)
      group by lu.id,lu.stable_key,lu.title,lu.default_minutes,lu.source_group
    ), ranked as (
      select c.*,sum(coalesce(c.default_minutes,0)) over(order by c.score desc,coalesce(c.default_minutes,0) asc,c.stable_key) running_minutes,
             row_number() over(order by c.score desc,coalesce(c.default_minutes,0) asc,c.stable_key) rn from candidates c
    ), proposed as (
      select * from ranked where rn<=32 and (v_target_minutes is null or running_minutes-coalesce(default_minutes,0)<v_target_minutes)
    ), risk_lu as (
      select distinct e.risk_code,lu.id,coalesce(lu.default_minutes,0) minutes from effective e
      join public.learning_unit_risk_links l on l.risk_code=e.risk_code join public.learning_units lu on lu.id=l.learning_unit_id and lu.active
      left join affinity a on a.source_group=lu.source_group
      where exists(select 1 from public.learning_unit_versions luv where luv.learning_unit_id=lu.id and luv.status='published')
        and (not exists(select 1 from affinity) or a.source_group is not null)
    ), coverage as (
      select e.risk_code,rc.title,count(rl.id)::integer unit_count,coalesce(sum(rl.minutes),0)::integer available_minutes,e.weight,e.sources
      from effective e join public.risk_catalog rc on rc.code=e.risk_code left join risk_lu rl on rl.risk_code=e.risk_code
      group by e.risk_code,rc.title,e.weight,e.sources
    )
    select jsonb_build_object('ok',true,'engine','risk-v1','course_code',v_code,'course_title',v_title,'target_minutes',v_target_minutes,'requires_presence',v_requires_presence,
      'effective_risks',coalesce((select jsonb_agg(jsonb_build_object('code',c.risk_code,'title',c.title,'weight',c.weight,'sources',c.sources) order by c.weight desc,c.risk_code) from coverage c),'[]'::jsonb),
      'coverage_by_risk',coalesce((select jsonb_agg(jsonb_build_object('code',c.risk_code,'title',c.title,'unit_count',c.unit_count,'available_minutes',c.available_minutes) order by c.weight desc,c.risk_code) from coverage c),'[]'::jsonb),
      'matched_unit_count',(select count(*) from candidates),'matched_minutes',coalesce((select sum(coalesce(default_minutes,0)) from candidates),0),
      'proposed_unit_count',(select count(*) from proposed),'proposed_minutes',coalesce((select sum(coalesce(default_minutes,0)) from proposed),0),
      'proposed_units',coalesce((select jsonb_agg(jsonb_build_object('stable_key',p.stable_key,'title',p.title,'minutes',p.default_minutes,'source_group',p.source_group,'score',p.score,'risk_codes',p.risk_codes) order by p.score desc,p.rn) from proposed p),'[]'::jsonb),
      'notes',jsonb_build_array('Composizione proposta automaticamente: richiede revisione amministrativa e didattica prima della pubblicazione.','I rischi reali del DVR, la mansione, le procedure aziendali e le esposizioni prevalgono sul profilo generico del corso.',case when v_requires_presence then 'Il corso include presenza/pratica: le Learning Unit digitali non sostituiscono la componente pratica.' else 'Percorso digitale interno: verificare comunque modalità e requisiti applicabili.' end));
  end;
$$;
revoke all on function public.preview_safetymanager_composition(text,text[]) from public,anon;
grant execute on function public.preview_safetymanager_composition(text,text[]) to authenticated,service_role;

create or replace function public.sync_safetymanager_training_context(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,private,auth as $$
declare
  v_project jsonb := coalesce(p_payload->'project','{}'::jsonb); v_company jsonb := coalesce(p_payload->'company','{}'::jsonb);
  v_project_id text := nullif(v_project->>'external_id',''); v_company_ext text := nullif(v_company->>'external_id','');
  v_course_code text := lower(nullif(btrim(coalesce(v_project->>'course_code','')),'')); v_sector_code text := nullif(btrim(coalesce(v_project->>'risk_sector_code','')),'');
  v_sector_label text := nullif(btrim(coalesce(v_project->>'risk_sector_label','')),''); v_source_risks text[] := '{}'::text[]; v_normalized text[] := '{}'::text[]; v_custom text[] := '{}'::text[];
  v_analysis_accepted boolean := false; v_edition_id uuid; v_company_id uuid; v_preview jsonb;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;
  if lower(coalesce(p_payload->>'source_system','')) <> 'safetymanager' then raise exception 'SafetyManager payload required'; end if;
  if v_project_id is null then raise exception 'project.external_id is required'; end if;
  if v_course_code is null then raise exception 'project.course_code is required'; end if;
  if jsonb_typeof(v_project->'risk_codes')='array' then select coalesce(array_agg(distinct lower(btrim(value))) filter(where nullif(btrim(value),'') is not null),'{}'::text[]) into v_source_risks from jsonb_array_elements_text(v_project->'risk_codes'); end if;
  if jsonb_typeof(v_project->'custom_risks')='array' then select coalesce(array_agg(distinct btrim(value)) filter(where nullif(btrim(value),'') is not null),'{}'::text[]) into v_custom from jsonb_array_elements_text(v_project->'custom_risks'); end if;
  v_analysis_accepted := lower(coalesce(v_project->>'needs_analysis_accepted','false')) in ('true','1','yes','si','sì');
  select coalesce(array_agg(distinct x.risk_code order by x.risk_code),'{}'::text[]) into v_normalized from (
    select rc.code risk_code from unnest(v_source_risks) s(code) join public.risk_catalog rc on lower(rc.code)=lower(s.code) and rc.active
    union select a.risk_code from unnest(v_source_risks) s(code) join public.safetymanager_risk_aliases a on lower(a.source_code)=lower(s.code)
  ) x;
  select local_id into v_edition_id from public.external_mappings where source_system='safetymanager' and entity_type='project' and external_id=v_project_id limit 1;
  if v_company_ext is not null then select local_id into v_company_id from public.external_mappings where source_system='safetymanager' and entity_type='company' and external_id=v_company_ext limit 1; end if;
  insert into public.integration_training_contexts(source_system,external_project_id,local_edition_id,local_company_id,external_course_code,source_sector_code,source_risk_codes,normalized_risk_codes,custom_risks,analysis_accepted,metadata)
  values('safetymanager',v_project_id,v_edition_id,v_company_id,v_course_code,v_sector_code,v_source_risks,v_normalized,v_custom,v_analysis_accepted,jsonb_build_object('risk_sector_label',v_sector_label,'engine','risk-v1','payload_schema_version',p_payload->>'schema_version'))
  on conflict(source_system,external_project_id) do update set local_edition_id=excluded.local_edition_id,local_company_id=excluded.local_company_id,external_course_code=excluded.external_course_code,source_sector_code=excluded.source_sector_code,source_risk_codes=excluded.source_risk_codes,normalized_risk_codes=excluded.normalized_risk_codes,custom_risks=excluded.custom_risks,analysis_accepted=excluded.analysis_accepted,metadata=public.integration_training_contexts.metadata||excluded.metadata,updated_at=now();
  v_preview := public.preview_safetymanager_composition(v_course_code,v_source_risks);
  update public.integration_course_catalog set metadata=metadata||jsonb_build_object('composition_engine','risk-v1','last_composed_at',now(),'source_risk_count',cardinality(v_source_risks),'normalized_risk_count',cardinality(v_normalized),'proposed_unit_count',coalesce((v_preview->>'proposed_unit_count')::integer,0),'proposed_minutes',coalesce((v_preview->>'proposed_minutes')::integer,0),'requires_dvr_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=v_course_code;
  return jsonb_build_object('ok',true,'engine','risk-v1','project_external_id',v_project_id,'course_code',v_course_code,'risk_sector_code',v_sector_code,'risk_sector_label',v_sector_label,'source_risk_codes',v_source_risks,'normalized_risk_codes',v_normalized,'unmapped_risk_codes',coalesce((select jsonb_agg(s) from unnest(v_source_risks) s where not(s=any(v_normalized)) and not exists(select 1 from public.safetymanager_risk_aliases a where lower(a.source_code)=lower(s))),'[]'::jsonb),'custom_risks',v_custom,'analysis_accepted',v_analysis_accepted,'preview',v_preview);
end;
$$;
revoke all on function public.sync_safetymanager_training_context(jsonb) from public,anon;
grant execute on function public.sync_safetymanager_training_context(jsonb) to authenticated,service_role;
