-- SafetyTraining v20.023
-- Canonical architecture for the whole SafetyManager course catalog.
-- SafetyManager owns the administrative course type; SafetyTraining owns reusable content,
-- blueprint composition and delivery. Legacy job-based Art.37 courses become content profiles.

create table if not exists public.training_blueprints (
  stable_key text primary key,
  title text not null,
  family text not null,
  strategy text not null,
  status text not null default 'draft' check (status in ('draft','partial','ready','retired')),
  description text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_blueprint_course_types (
  source_system text not null,
  external_course_code text not null,
  blueprint_key text not null references public.training_blueprints(stable_key) on update cascade on delete restrict,
  variant_key text null,
  development_status text not null default 'planned'
    check (development_status in ('planned','partial','ready','hybrid_partial','unavailable')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_system, external_course_code),
  foreign key (source_system, external_course_code)
    references public.integration_course_catalog(source_system, external_course_code)
    on update cascade on delete cascade
);

create index if not exists training_blueprint_course_types_blueprint_idx
  on public.training_blueprint_course_types(blueprint_key);

create table if not exists public.training_blueprint_sections (
  blueprint_key text not null references public.training_blueprints(stable_key) on update cascade on delete cascade,
  section_key text not null,
  title text not null,
  position integer not null default 1,
  section_type text not null
    check (section_type in ('fixed_course','shared_library','risk_dynamic','sector_dynamic','role_specific','update_dynamic','practical_external','assessment','custom')),
  nominal_minutes integer null check (nominal_minutes is null or nominal_minutes >= 0),
  source_course_stable_key text null,
  source_profile_key text null,
  required boolean not null default true,
  practical boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (blueprint_key, section_key)
);

create index if not exists training_blueprint_sections_type_idx
  on public.training_blueprint_sections(section_type);

create table if not exists public.learning_content_profiles (
  stable_key text primary key,
  title text not null,
  profile_kind text not null
    check (profile_kind in ('core_module','shared_library','art37_job_profile')),
  source_course_id uuid not null references public.courses(id) on delete restrict,
  status text not null default 'active' check (status in ('active','draft','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists learning_content_profiles_source_course_idx
  on public.learning_content_profiles(source_course_id);

alter table public.training_blueprints enable row level security;
alter table public.training_blueprint_course_types enable row level security;
alter table public.training_blueprint_sections enable row level security;
alter table public.learning_content_profiles enable row level security;

drop policy if exists training_blueprints_admin on public.training_blueprints;
create policy training_blueprints_admin on public.training_blueprints
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists training_blueprint_course_types_admin on public.training_blueprint_course_types;
create policy training_blueprint_course_types_admin on public.training_blueprint_course_types
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists training_blueprint_sections_admin on public.training_blueprint_sections;
create policy training_blueprint_sections_admin on public.training_blueprint_sections
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

drop policy if exists learning_content_profiles_admin on public.learning_content_profiles;
create policy learning_content_profiles_admin on public.learning_content_profiles
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

grant select,insert,update,delete on public.training_blueprints to authenticated;
grant select,insert,update,delete on public.training_blueprint_course_types to authenticated;
grant select,insert,update,delete on public.training_blueprint_sections to authenticated;
grant select,insert,update,delete on public.learning_content_profiles to authenticated;

drop trigger if exists training_blueprints_touch on public.training_blueprints;
create trigger training_blueprints_touch before update on public.training_blueprints
for each row execute function public.touch_updated_at();
drop trigger if exists training_blueprint_course_types_touch on public.training_blueprint_course_types;
create trigger training_blueprint_course_types_touch before update on public.training_blueprint_course_types
for each row execute function public.touch_updated_at();
drop trigger if exists training_blueprint_sections_touch on public.training_blueprint_sections;
create trigger training_blueprint_sections_touch before update on public.training_blueprint_sections
for each row execute function public.touch_updated_at();
drop trigger if exists learning_content_profiles_touch on public.learning_content_profiles;
create trigger learning_content_profiles_touch before update on public.learning_content_profiles
for each row execute function public.touch_updated_at();

insert into public.training_blueprints(stable_key,title,family,strategy,status,description,metadata) values
('worker_initial','Formazione lavoratori iniziale','Lavoratori Art. 37','risk_composed','partial','4 ore generali fisse + parte specifica composta sui rischi reali del progetto.','{"engine":"risk-v2.1","dvr_driven":true}'),
('worker_update','Aggiornamento lavoratori','Lavoratori Art. 37','risk_composed','draft','Aggiornamento composto sui rischi, cambiamenti e fabbisogni effettivi.','{"dvr_driven":true}'),
('preposto_initial','Preposto','Ruoli della prevenzione','role_program','draft','Percorso dedicato al ruolo di preposto, separato dalla formazione lavoratori.','{}'),
('preposto_update','Aggiornamento preposto','Ruoli della prevenzione','update_program','draft','Aggiornamento del percorso preposto.','{}'),
('dirigente_initial','Dirigente','Ruoli della prevenzione','role_program','draft','Percorso dedicato al ruolo di dirigente.','{}'),
('dirigente_update','Aggiornamento dirigente','Ruoli della prevenzione','update_program','draft','Aggiornamento del percorso dirigente.','{}'),
('employer_initial','Datore di lavoro','Datore di lavoro','role_program','draft','Corso base del datore di lavoro come tipologia autonoma del catalogo SafetyManager.','{}'),
('employer_update','Aggiornamento datore di lavoro','Datore di lavoro','update_program','draft','Aggiornamento del datore di lavoro.','{}'),
('employer_construction_addon','Modulo cantieri DL/Dirigente','Datore di lavoro','sector_program','draft','Modulo aggiuntivo cantieri previsto dal catalogo SafetyManager.','{}'),
('dl_spp_common','DL SPP / RSPP Datore di lavoro - modulo comune','DL SPP / RSPP Datore di lavoro','role_program','draft','Modulo comune per il datore di lavoro che svolge direttamente i compiti del SPP.','{"common_minutes":480}'),
('dl_spp_sector','DL SPP / RSPP Datore di lavoro - modulo comune + settore','DL SPP / RSPP Datore di lavoro','composite_sector','draft','Modulo comune più contenuti specifici di settore.','{"common_minutes":480,"sector_minutes_from_catalog":true}'),
('dl_spp_update','Aggiornamento DL SPP / RSPP Datore di lavoro','DL SPP / RSPP Datore di lavoro','update_program','draft','Aggiornamento dedicato al DL SPP.','{}'),
('rls_initial','RLS iniziale','RLS','fixed_program','ready','Percorso RLS esistente, mantenuto come corso autonomo.','{"source_course":"rls"}'),
('rls_update','Aggiornamento RLS','RLS','update_program','draft','Aggiornamento RLS parametrizzato sulla durata del tipo corso.','{}'),
('fire_l2_initial','Antincendio Livello 2','Emergenze','hybrid_program','partial','Parte teorica digitale riutilizzabile + componente pratica/presenza separata.','{"source_course":"antincendio","practical_separate":true}'),
('fire_l2_update','Aggiornamento Antincendio Livello 2','Emergenze','hybrid_program','draft','Aggiornamento con componente pratica/presenza separata.','{"practical_separate":true}'),
('first_aid_bc_initial','Primo soccorso Gruppo B/C','Emergenze','hybrid_program','draft','Percorso teorico + componente pratica/presenza separata.','{"practical_separate":true}'),
('first_aid_bc_update','Aggiornamento primo soccorso Gruppo B/C','Emergenze','hybrid_program','draft','Aggiornamento con componente pratica/presenza separata.','{"practical_separate":true}'),
('confined_spaces_initial','Ambienti sospetti di inquinamento o confinati','Rischi specialistici','hybrid_program','draft','Contenuti teorici specialistici + parte pratica/presenza separata.','{"practical_separate":true}'),
('confined_spaces_update','Aggiornamento ambienti confinati','Rischi specialistici','hybrid_program','draft','Aggiornamento specialistico con parte pratica/presenza separata.','{"practical_separate":true}'),
('work_height_dpi3','Lavori in quota e DPI 3a categoria','Rischi specialistici','hybrid_program','draft','Teoria + addestramento/pratica separata.','{"practical_separate":true}'),
('equipment_initial','Attrezzature - abilitazione iniziale','Attrezzature','equipment_hybrid','draft','Nucleo teorico riutilizzabile + modulo specifico attrezzatura + pratica separata.','{"practical_separate":true}'),
('equipment_update','Attrezzature - aggiornamento','Attrezzature','equipment_hybrid','draft','Aggiornamento specifico attrezzatura con componente pratica/presenza separata.','{"practical_separate":true}')
on conflict (stable_key) do update
set title=excluded.title,family=excluded.family,strategy=excluded.strategy,status=excluded.status,
    description=excluded.description,metadata=public.training_blueprints.metadata||excluded.metadata,updated_at=now();

insert into public.learning_content_profiles(stable_key,title,profile_kind,source_course_id,status,metadata)
select x.profile_key,x.profile_title,x.profile_kind,c.id,'active',x.metadata
from (values
  ('general_core','Formazione generale - nucleo comune','core_module','generale','{"scope":"art37"}'::jsonb),
  ('shared_foundations','Fondamenti normativi e sistema prevenzione','shared_library','fondamenti','{"scope":"cross_course"}'::jsonb),
  ('art37_backoffice','Profilo contenuti Art. 37 - Back Office','art37_job_profile','backoffice','{"job_profile":"backoffice"}'::jsonb),
  ('art37_frontoffice','Profilo contenuti Art. 37 - Front Office','art37_job_profile','frontoffice','{"job_profile":"frontoffice"}'::jsonb),
  ('art37_ecologici','Profilo contenuti Art. 37 - Operatori Ecologici','art37_job_profile','ecologici','{"job_profile":"ecologici"}'::jsonb),
  ('art37_polizia','Profilo contenuti Art. 37 - Polizia Locale','art37_job_profile','polizia','{"job_profile":"polizia"}'::jsonb),
  ('art37_verde','Profilo contenuti Art. 37 - Verde Pubblico','art37_job_profile','verde','{"job_profile":"verde"}'::jsonb)
) as x(profile_key,profile_title,profile_kind,course_key,metadata)
join public.courses c on c.stable_key=x.course_key
on conflict (stable_key) do update
set title=excluded.title,profile_kind=excluded.profile_kind,source_course_id=excluded.source_course_id,
    status='active',metadata=public.learning_content_profiles.metadata||excluded.metadata,updated_at=now();

update public.courses
set metadata=metadata || case stable_key
  when 'generale' then '{"library_role":"core_module","learner_catalog_hidden":true,"content_profile_key":"general_core"}'::jsonb
  when 'fondamenti' then '{"library_role":"shared_library","learner_catalog_hidden":true,"content_profile_key":"shared_foundations"}'::jsonb
  when 'backoffice' then '{"library_role":"art37_content_profile","learner_catalog_hidden":true,"content_profile_key":"art37_backoffice"}'::jsonb
  when 'frontoffice' then '{"library_role":"art37_content_profile","learner_catalog_hidden":true,"content_profile_key":"art37_frontoffice"}'::jsonb
  when 'ecologici' then '{"library_role":"art37_content_profile","learner_catalog_hidden":true,"content_profile_key":"art37_ecologici"}'::jsonb
  when 'polizia' then '{"library_role":"art37_content_profile","learner_catalog_hidden":true,"content_profile_key":"art37_polizia"}'::jsonb
  when 'verde' then '{"library_role":"art37_content_profile","learner_catalog_hidden":true,"content_profile_key":"art37_verde"}'::jsonb
  else '{}'::jsonb end,
  updated_at=now()
where stable_key in ('generale','fondamenti','backoffice','frontoffice','ecologici','polizia','verde');

insert into public.training_blueprint_sections
(blueprint_key,section_key,title,position,section_type,nominal_minutes,source_course_stable_key,source_profile_key,required,practical,metadata) values
('worker_initial','general_4h','Formazione generale',1,'fixed_course',240,'generale','general_core',true,false,'{"locked":true}'),
('worker_initial','specific_risks','Formazione specifica sui rischi',2,'risk_dynamic',null,null,null,true,false,'{"fill_remaining_to_course_duration":true,"dvr_driven":true}'),
('worker_update','updated_risks','Rischi, cambiamenti e fabbisogni da aggiornare',1,'update_dynamic',null,null,null,true,false,'{"fill_course_duration":true,"dvr_driven":true}'),
('preposto_initial','shared_prevention_system','Sistema di prevenzione e organizzazione',1,'shared_library',null,'fondamenti','shared_foundations',true,false,'{}'),
('preposto_initial','preposto_role','Ruolo, vigilanza e gestione operativa',2,'role_specific',null,null,null,true,false,'{}'),
('preposto_initial','cases','Casi, comunicazione e gestione delle deviazioni',3,'role_specific',null,null,null,true,false,'{}'),
('preposto_update','role_update','Aggiornamento ruolo e vigilanza',1,'update_dynamic',null,null,null,true,false,'{}'),
('dirigente_initial','shared_prevention_system','Sistema di prevenzione e organizzazione',1,'shared_library',null,'fondamenti','shared_foundations',true,false,'{}'),
('dirigente_initial','manager_role','Organizzazione, deleghe, decisioni e controllo',2,'role_specific',null,null,null,true,false,'{}'),
('dirigente_initial','management_cases','Casi gestionali e applicazione organizzativa',3,'role_specific',null,null,null,true,false,'{}'),
('dirigente_update','manager_update','Aggiornamento del ruolo dirigente',1,'update_dynamic',null,null,null,true,false,'{}'),
('employer_initial','system_governance','Sistema di prevenzione e responsabilita organizzative',1,'shared_library',null,'fondamenti','shared_foundations',true,false,'{}'),
('employer_initial','risk_assessment','Valutazione e gestione dei rischi',2,'role_specific',null,null,null,true,false,'{}'),
('employer_initial','prevention_management','Organizzazione della prevenzione e misure',3,'role_specific',null,null,null,true,false,'{}'),
('employer_initial','relations_communication','Relazioni, informazione, formazione e consultazione',4,'role_specific',null,null,null,true,false,'{}'),
('employer_update','employer_update','Aggiornamento datore di lavoro',1,'update_dynamic',null,null,null,true,false,'{}'),
('employer_construction_addon','construction_context','Contesto e rischi del settore cantieri',1,'sector_dynamic',null,null,null,true,false,'{"sector":"costruzioni"}'),
('dl_spp_common','spp_common','Compiti SPP, organizzazione e gestione della prevenzione',1,'role_specific',480,'fondamenti','shared_foundations',true,false,'{"common_module":true}'),
('dl_spp_sector','spp_common','Modulo comune DL SPP',1,'role_specific',480,'fondamenti','shared_foundations',true,false,'{"inherits":"dl_spp_common"}'),
('dl_spp_sector','sector_specific','Modulo specifico di settore',2,'sector_dynamic',null,null,null,true,false,'{"fill_remaining_to_course_duration":true}'),
('dl_spp_update','spp_update','Aggiornamento DL SPP',1,'update_dynamic',null,null,null,true,false,'{}'),
('rls_initial','rls_program','Programma RLS esistente',1,'fixed_course',1920,'rls',null,true,false,'{}'),
('rls_update','rls_update','Aggiornamento RLS',1,'update_dynamic',null,null,null,true,false,'{"duration_from_course_type":true}'),
('fire_l2_initial','fire_theory','Teoria antincendio',1,'fixed_course',null,'antincendio',null,true,false,'{}'),
('fire_l2_initial','fire_practice','Esercitazioni/pratica',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('fire_l2_update','fire_update','Aggiornamento teorico',1,'update_dynamic',null,'antincendio',null,true,false,'{}'),
('fire_l2_update','fire_practice','Esercitazioni/pratica',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('first_aid_bc_initial','first_aid_theory','Contenuti teorici primo soccorso',1,'role_specific',null,null,null,true,false,'{}'),
('first_aid_bc_initial','first_aid_practice','Parte pratica/presenza',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('first_aid_bc_update','first_aid_update','Aggiornamento teorico',1,'update_dynamic',null,null,null,true,false,'{}'),
('first_aid_bc_update','first_aid_practice','Parte pratica/presenza',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('confined_spaces_initial','confined_theory','Rischi e procedure ambienti confinati',1,'role_specific',null,null,null,true,false,'{}'),
('confined_spaces_initial','confined_practice','Parte pratica/presenza',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('confined_spaces_update','confined_update','Aggiornamento teorico',1,'update_dynamic',null,null,null,true,false,'{}'),
('confined_spaces_update','confined_practice','Parte pratica/presenza',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('work_height_dpi3','height_theory','Lavori in quota e DPI - teoria',1,'role_specific',null,null,null,true,false,'{}'),
('work_height_dpi3','height_practice','Addestramento/pratica',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('equipment_initial','equipment_common','Nucleo teorico comune attrezzature',1,'shared_library',null,null,null,true,false,'{}'),
('equipment_initial','equipment_specific','Modulo specifico attrezzatura',2,'role_specific',null,null,null,true,false,'{}'),
('equipment_initial','equipment_practice','Pratica/addestramento',3,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}'),
('equipment_update','equipment_update_theory','Aggiornamento specifico attrezzatura',1,'update_dynamic',null,null,null,true,false,'{}'),
('equipment_update','equipment_practice','Pratica/presenza prevista',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true}')
on conflict (blueprint_key,section_key) do update
set title=excluded.title,position=excluded.position,section_type=excluded.section_type,
    nominal_minutes=excluded.nominal_minutes,source_course_stable_key=excluded.source_course_stable_key,
    source_profile_key=excluded.source_profile_key,required=excluded.required,practical=excluded.practical,
    metadata=public.training_blueprint_sections.metadata||excluded.metadata,updated_at=now();

insert into public.training_blueprint_course_types
(source_system,external_course_code,blueprint_key,variant_key,development_status,metadata)
select 'safetymanager',c.external_course_code,
  case
    when c.external_course_code in ('lav_basso','lav_medio','lav_alto') then 'worker_initial'
    when c.external_course_code='agg_lav' then 'worker_update'
    when c.external_course_code='preposto' then 'preposto_initial'
    when c.external_course_code='agg_prep' then 'preposto_update'
    when c.external_course_code='dirigente' then 'dirigente_initial'
    when c.external_course_code='agg_dir' then 'dirigente_update'
    when c.external_course_code='dl_base' then 'employer_initial'
    when c.external_course_code='agg_dl' then 'employer_update'
    when c.external_course_code='mod_cantieri' then 'employer_construction_addon'
    when c.external_course_code='dl_spp_comune' then 'dl_spp_common'
    when c.external_course_code in ('dl_spp_agri','dl_spp_pesca','dl_spp_costruzioni','dl_spp_chimico') then 'dl_spp_sector'
    when c.external_course_code='agg_dl_spp' then 'dl_spp_update'
    when c.external_course_code='rls' then 'rls_initial'
    when c.external_course_code in ('agg_rls_4h','agg_rls_8h') then 'rls_update'
    when c.external_course_code='antincendio_liv2' then 'fire_l2_initial'
    when c.external_course_code='agg_antincendio_liv2_5h' then 'fire_l2_update'
    when c.external_course_code='primo_soccorso_12h' then 'first_aid_bc_initial'
    when c.external_course_code='agg_primo_soccorso_4h' then 'first_aid_bc_update'
    when c.external_course_code='amb_confinati' then 'confined_spaces_initial'
    when c.external_course_code='agg_spazi_confinati_4h' then 'confined_spaces_update'
    when c.external_course_code='lav_quota' then 'work_height_dpi3'
    when c.external_course_code like 'attr_%' then 'equipment_initial'
    when c.external_course_code like 'agg_attr_%' then 'equipment_update'
    else null
  end as blueprint_key,
  case
    when c.external_course_code in ('lav_basso','lav_medio','lav_alto') then replace(c.external_course_code,'lav_','')
    when c.external_course_code='dl_spp_agri' then 'agricoltura_zootecnia'
    when c.external_course_code='dl_spp_pesca' then 'pesca'
    when c.external_course_code='dl_spp_costruzioni' then 'costruzioni'
    when c.external_course_code='dl_spp_chimico' then 'chimico_petrolchimico'
    when c.external_course_code='agg_rls_4h' then '4h'
    when c.external_course_code='agg_rls_8h' then '8h'
    when c.external_course_code like 'attr_%' then replace(c.external_course_code,'attr_','')
    when c.external_course_code like 'agg_attr_%' then replace(c.external_course_code,'agg_attr_','')
    else null
  end as variant_key,
  case
    when c.external_course_code='rls' then 'ready'
    when c.external_course_code='antincendio_liv2' then 'hybrid_partial'
    when c.external_course_code in ('lav_basso','lav_medio','lav_alto') then 'partial'
    else 'planned'
  end as development_status,
  jsonb_build_object('catalog_minutes',c.nominal_minutes,'requires_presence',coalesce(c.metadata->>'requires_presence','false'))
from public.integration_course_catalog c
where c.source_system='safetymanager'
  and (
    c.external_course_code in (
      'lav_basso','lav_medio','lav_alto','agg_lav','preposto','agg_prep','dirigente','agg_dir',
      'dl_base','agg_dl','mod_cantieri','dl_spp_comune','dl_spp_agri','dl_spp_pesca','dl_spp_costruzioni','dl_spp_chimico','agg_dl_spp',
      'rls','agg_rls_4h','agg_rls_8h','antincendio_liv2','agg_antincendio_liv2_5h',
      'primo_soccorso_12h','agg_primo_soccorso_4h','amb_confinati','agg_spazi_confinati_4h','lav_quota'
    )
    or c.external_course_code like 'attr_%'
    or c.external_course_code like 'agg_attr_%'
  )
on conflict (source_system,external_course_code) do update
set blueprint_key=excluded.blueprint_key,variant_key=excluded.variant_key,
    development_status=excluded.development_status,
    metadata=public.training_blueprint_course_types.metadata||excluded.metadata,updated_at=now();

update public.integration_course_catalog c
set metadata=c.metadata || jsonb_build_object(
  'blueprint_key',m.blueprint_key,
  'blueprint_variant',m.variant_key,
  'blueprint_development_status',m.development_status,
  'catalog_role','administrative_course_type'
), updated_at=now()
from public.training_blueprint_course_types m
where m.source_system=c.source_system
  and m.external_course_code=c.external_course_code
  and c.source_system='safetymanager';
