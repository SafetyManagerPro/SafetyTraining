-- SafetyTraining v20.027
-- Extend the existing blueprint architecture into a normalized Master Registry.
-- No legacy course code is removed or renamed: SafetyManager remains the administrative source catalog.

create table if not exists public.training_blueprint_variants (
  blueprint_key text not null references public.training_blueprints(stable_key) on update cascade on delete cascade,
  variant_key text not null,
  title text not null,
  nominal_minutes integer null check (nominal_minutes is null or nominal_minutes >= 0),
  status text not null default 'planned'
    check (status in ('planned','partial','ready','hybrid_partial','unavailable','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (blueprint_key, variant_key)
);

create index if not exists training_blueprint_variants_status_idx
  on public.training_blueprint_variants(status);

create table if not exists public.training_blueprint_rules (
  blueprint_key text not null references public.training_blueprints(stable_key) on update cascade on delete cascade,
  rule_key text not null,
  variant_key text null,
  rule_type text not null
    check (rule_type in ('audience','duration','sector','risk','practical','eligibility','composition','legacy_alias')),
  priority integer not null default 100,
  conditions jsonb not null default '{}'::jsonb,
  outcome jsonb not null default '{}'::jsonb,
  source text null,
  notes text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (blueprint_key, rule_key),
  foreign key (blueprint_key, variant_key)
    references public.training_blueprint_variants(blueprint_key, variant_key)
    on update cascade on delete restrict
);

create index if not exists training_blueprint_rules_type_idx
  on public.training_blueprint_rules(rule_type, active, priority);

alter table public.training_blueprint_variants enable row level security;
alter table public.training_blueprint_rules enable row level security;

drop policy if exists training_blueprint_variants_admin on public.training_blueprint_variants;
create policy training_blueprint_variants_admin on public.training_blueprint_variants
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists training_blueprint_rules_admin on public.training_blueprint_rules;
create policy training_blueprint_rules_admin on public.training_blueprint_rules
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

grant select,insert,update,delete on public.training_blueprint_variants to authenticated;
grant select,insert,update,delete on public.training_blueprint_rules to authenticated;

drop trigger if exists training_blueprint_variants_touch on public.training_blueprint_variants;
create trigger training_blueprint_variants_touch before update on public.training_blueprint_variants
for each row execute function public.touch_updated_at();

drop trigger if exists training_blueprint_rules_touch on public.training_blueprint_rules;
create trigger training_blueprint_rules_touch before update on public.training_blueprint_rules
for each row execute function public.touch_updated_at();

-- Materialize the variants that already exist implicitly in SafetyManager mappings.
insert into public.training_blueprint_variants
(blueprint_key,variant_key,title,nominal_minutes,status,metadata)
select
  m.blueprint_key,
  m.variant_key,
  min(c.title) as title,
  max(c.nominal_minutes) as nominal_minutes,
  case
    when bool_or(m.development_status='ready') then 'ready'
    when bool_or(m.development_status='hybrid_partial') then 'hybrid_partial'
    when bool_or(m.development_status='partial') then 'partial'
    when bool_or(m.development_status='unavailable') then 'unavailable'
    else 'planned'
  end as status,
  jsonb_build_object(
    'source_system','safetymanager',
    'materialized_from_course_types',jsonb_agg(m.external_course_code order by m.external_course_code)
  )
from public.training_blueprint_course_types m
join public.integration_course_catalog c
  on c.source_system=m.source_system and c.external_course_code=m.external_course_code
where m.source_system='safetymanager'
  and m.variant_key is not null
group by m.blueprint_key,m.variant_key
on conflict (blueprint_key,variant_key) do update
set title=excluded.title,
    nominal_minutes=excluded.nominal_minutes,
    status=excluded.status,
    metadata=public.training_blueprint_variants.metadata || excluded.metadata,
    updated_at=now();

-- Legacy mod_cantieri is one administrative code but has two audiences.
insert into public.training_blueprint_variants
(blueprint_key,variant_key,title,nominal_minutes,status,metadata) values
('employer_construction_addon','employer','Modulo cantieri - Datore di lavoro',360,'planned','{"legacy_course_code":"mod_cantieri","audience_role":"employer"}'::jsonb),
('employer_construction_addon','manager','Modulo cantieri - Dirigente',360,'planned','{"legacy_course_code":"mod_cantieri","audience_role":"manager"}'::jsonb)
on conflict (blueprint_key,variant_key) do update
set title=excluded.title,nominal_minutes=excluded.nominal_minutes,
    metadata=public.training_blueprint_variants.metadata||excluded.metadata,updated_at=now();

update public.training_blueprint_course_types
set metadata=metadata || '{"legacy_role_unspecified":true,"variant_resolution":"audience_rule"}'::jsonb,
    updated_at=now()
where source_system='safetymanager' and external_course_code='mod_cantieri';

-- Registry rules: deterministic composition/selection behavior.
insert into public.training_blueprint_rules
(blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes) values
('worker_initial','general_core_locked_240',null,'composition',10,'{}'::jsonb,
 '{"fixed_general_minutes":240,"specific_section":"risk_dynamic"}'::jsonb,
 'SafetyTraining risk composition engine','The 4h general core is preserved; only the remaining duration is composed.'),
('worker_initial','project_risks_override_generic',null,'risk',20,'{"project_risks_present":true}'::jsonb,
 '{"specific_content_source":"project_risks","generic_profile_role":"informative"}'::jsonb,
 'SafetyTraining risk-v2.1','Project/DVR risks drive the specific portion when available.'),
('worker_update','update_from_current_risk_context',null,'risk',20,'{}'::jsonb,
 '{"content_source":["changed_risks","procedures","organizational_changes","training_needs"],"requires_review":true}'::jsonb,
 'SafetyTraining master registry','Update content is selected from the current context, not from a fixed job-course copy.'),
('dl_spp_sector','inherit_common_module',null,'composition',10,'{}'::jsonb,
 '{"include_blueprint":"dl_spp_common","common_minutes":480,"fill_remaining_with":"sector_dynamic"}'::jsonb,
 'SafetyTraining blueprint architecture','Sector variants inherit the common module and add the sector-specific remainder.'),
('rls_update','legacy_company_size_4h','4h','duration',20,'{"employees_min":15,"employees_max":50}'::jsonb,
 '{"select_variant":"4h","nominal_minutes":240}'::jsonb,
 'SafetyManager source catalog','Models the existing SafetyManager 4h RLS update selection; no inference is made for company sizes outside this range.'),
('rls_update','legacy_company_size_8h','8h','duration',20,'{"employees_min":51}'::jsonb,
 '{"select_variant":"8h","nominal_minutes":480}'::jsonb,
 'SafetyManager source catalog','Models the existing SafetyManager 8h RLS update selection.'),
('work_height_dpi3','practical_training_separate',null,'practical',10,'{}'::jsonb,
 '{"digital_completion":false,"requires_practical_component":true,"section_key":"height_practice"}'::jsonb,
 'SafetyTraining blueprint architecture','Theory and practical/addestramento are tracked separately.'),
('equipment_initial','practical_training_separate',null,'practical',10,'{}'::jsonb,
 '{"digital_completion":false,"requires_practical_component":true,"section_key":"equipment_practice"}'::jsonb,
 'SafetyTraining blueprint architecture','Equipment qualification keeps practical training outside digital-only completion.'),
('equipment_update','practical_training_separate',null,'practical',10,'{}'::jsonb,
 '{"digital_completion":false,"requires_practical_component":true,"section_key":"equipment_practice"}'::jsonb,
 'SafetyTraining blueprint architecture','Equipment updates keep the practical/presence component separate.'),
('employer_construction_addon','audience_employer','employer','audience',10,'{"audience_role":"employer"}'::jsonb,
 '{"select_variant":"employer"}'::jsonb,
 'SafetyTraining master registry','Resolves the legacy shared mod_cantieri code for the employer audience.'),
('employer_construction_addon','audience_manager','manager','audience',10,'{"audience_role":"manager"}'::jsonb,
 '{"select_variant":"manager"}'::jsonb,
 'SafetyTraining master registry','Resolves the legacy shared mod_cantieri code for the manager audience.')
on conflict (blueprint_key,rule_key) do update
set variant_key=excluded.variant_key,rule_type=excluded.rule_type,priority=excluded.priority,
    conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,
    active=true,updated_at=now();

update public.training_blueprints
set metadata=metadata || '{"master_registry_version":1}'::jsonb,
    updated_at=now()
where status <> 'retired';