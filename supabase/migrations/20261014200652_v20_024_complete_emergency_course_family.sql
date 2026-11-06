-- SafetyTraining v20.024
-- Completa la famiglia Emergenze del catalogo SafetyManager:
-- primo soccorso Gruppo A/B-C, antincendio livelli 1/2/3 e percorso aziendale
-- interno per gestione emergenze/evacuazione.
-- Le componenti pratiche restano separate e non sono completabili digitalmente.

insert into public.integration_course_catalog(
  source_system,external_course_code,title,nominal_minutes,delivery_status,metadata
) values
('safetymanager','primo_soccorso_a_16h','Addetto al Primo Soccorso (Gruppo A) - 16h',960,'hybrid',jsonb_build_object('family','Emergenze','requires_presence',true,'practical_separate',true,'normative_ref','D.Lgs. 81/08 art. 45; D.M. 388/2003')),
('safetymanager','agg_primo_soccorso_a_6h','Aggiornamento Primo Soccorso (Gruppo A) - 6h',360,'hybrid',jsonb_build_object('family','Emergenze','requires_presence',true,'practical_separate',true,'normative_ref','D.Lgs. 81/08 art. 45; D.M. 388/2003')),
('safetymanager','antincendio_liv1','Addetto Antincendio - Livello 1 - 4h',240,'hybrid',jsonb_build_object('family','Emergenze','requires_presence',true,'practical_separate',true,'normative_ref','D.Lgs. 81/08 art. 46; D.M. 2/9/2021 Allegato III')),
('safetymanager','agg_antincendio_liv1_2h','Aggiornamento Antincendio - Livello 1 - 2h',120,'hybrid',jsonb_build_object('family','Emergenze','requires_presence',true,'practical_separate',true,'normative_ref','D.Lgs. 81/08 art. 46; D.M. 2/9/2021 Allegato III')),
('safetymanager','antincendio_liv3','Addetto Antincendio - Livello 3 - 16h',960,'hybrid',jsonb_build_object('family','Emergenze','requires_presence',true,'practical_separate',true,'normative_ref','D.Lgs. 81/08 art. 46; D.M. 2/9/2021 Allegato III')),
('safetymanager','agg_antincendio_liv3_8h','Aggiornamento Antincendio - Livello 3 - 8h',480,'hybrid',jsonb_build_object('family','Emergenze','requires_presence',true,'practical_separate',true,'normative_ref','D.Lgs. 81/08 art. 46; D.M. 2/9/2021 Allegato III')),
('safetymanager','emergenze_evacuazione_2h','Gestione Emergenze ed Evacuazione - Percorso Aziendale Interno - 2h',120,'needs_configuration',jsonb_build_object('family','Emergenze','requires_presence',false,'internal_non_certifying',true,'organizational_course',true,'note','Percorso interno: non sostituisce la formazione degli addetti antincendio o primo soccorso e non sostituisce le prove di evacuazione ove previste'))
on conflict (source_system,external_course_code) do update
set title=excluded.title,
    nominal_minutes=excluded.nominal_minutes,
    metadata=public.integration_course_catalog.metadata||excluded.metadata,
    last_seen_at=now(),
    updated_at=now();

-- Blueprints generici, con varianti normative per gruppo/livello.
insert into public.training_blueprints(stable_key,title,family,strategy,status,description,metadata) values
('first_aid_initial','Addetti Primo Soccorso - formazione iniziale','Emergenze','hybrid_program','draft','Blueprint comune per Gruppo A e Gruppi B/C. Teoria e pratica sono distinte; la pratica richiede presenza.','{"practical_separate":true,"variant_driven":true}'::jsonb),
('first_aid_update','Addetti Primo Soccorso - aggiornamento','Emergenze','hybrid_program','draft','Aggiornamento triennale con forte componente pratica; durata determinata dal gruppo.','{"practical_separate":true,"variant_driven":true}'::jsonb),
('fire_initial','Addetti Antincendio - formazione iniziale','Emergenze','hybrid_program','partial','Blueprint comune ai Livelli 1, 2 e 3 con durata teorica/pratica determinata dal livello.','{"practical_separate":true,"variant_driven":true,"source_course":"antincendio"}'::jsonb),
('fire_update','Addetti Antincendio - aggiornamento','Emergenze','hybrid_program','partial','Blueprint comune agli aggiornamenti Livelli 1, 2 e 3.','{"practical_separate":true,"variant_driven":true,"source_course":"antincendio"}'::jsonb),
('emergency_evacuation_internal','Gestione emergenze ed evacuazione - percorso aziendale interno','Emergenze','fixed_internal_program','partial','Percorso organizzativo interno su ruoli, allarme, evacuazione e chiamata dei soccorsi. Non abilita come addetto antincendio o primo soccorso.','{"internal_non_certifying":true,"not_replacement_for_fire_or_first_aid":true,"drill_separate":true}'::jsonb)
on conflict (stable_key) do update
set title=excluded.title,family=excluded.family,strategy=excluded.strategy,status=excluded.status,
    description=excluded.description,metadata=public.training_blueprints.metadata||excluded.metadata,updated_at=now();

-- I vecchi blueprint specifici restano nello storico ma non sono più usati dal catalogo attivo.
update public.training_blueprints
set status='retired',updated_at=now()
where stable_key in ('first_aid_bc_initial','first_aid_bc_update','fire_l2_initial','fire_l2_update');

insert into public.training_blueprint_sections
(blueprint_key,section_key,title,position,section_type,nominal_minutes,source_course_stable_key,source_profile_key,required,practical,metadata) values
('first_aid_initial','first_aid_theory','Allertamento, riconoscimento, traumi e patologie',1,'role_specific',null,null,null,true,false,'{"duration_from_variant":true}'::jsonb),
('first_aid_initial','first_aid_practice','Capacità di intervento pratico',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true,"duration_from_variant":true}'::jsonb),
('first_aid_update','first_aid_update_practice','Aggiornamento capacità di intervento pratico',1,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true,"duration_from_variant":true}'::jsonb),
('fire_initial','fire_theory','Incendio, prevenzione, protezione e procedure',1,'shared_library',null,'antincendio',null,true,false,'{"duration_from_variant":true}'::jsonb),
('fire_initial','fire_practice','Esercitazioni pratiche antincendio',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true,"duration_from_variant":true}'::jsonb),
('fire_update','fire_update_theory','Aggiornamento teorico',1,'update_dynamic',null,'antincendio',null,false,false,'{"duration_from_variant":true,"level1_theory_minutes":0}'::jsonb),
('fire_update','fire_update_practice','Aggiornamento pratico',2,'practical_external',null,null,null,true,true,'{"not_completed_digitally":true,"duration_from_variant":true}'::jsonb),
('emergency_evacuation_internal','emergency_principles','Principi di emergenza ed evacuazione',1,'shared_library',35,'generale','general_core',true,false,'{"learning_unit_keys":["generale:emergenze-generale"]}'::jsonb),
('emergency_evacuation_internal','emergency_roles','Ruoli degli addetti e coordinamento',2,'shared_library',25,'fondamenti','shared_foundations',true,false,'{"learning_unit_keys":["fondamenti:emergenze-figure"]}'::jsonb),
('emergency_evacuation_internal','alarm_communication','Rivelazione, allarme e comunicazioni',3,'shared_library',60,'antincendio',null,true,false,'{"learning_unit_keys":["antincendio:rivelazione-allarme"]}'::jsonb),
('emergency_evacuation_internal','company_drill','Prova/esercitazione aziendale ove prevista',4,'practical_external',null,null,null,false,true,'{"not_completed_digitally":true,"outside_nominal_course_minutes":true,"context_dependent":true}'::jsonb)
on conflict (blueprint_key,section_key) do update
set title=excluded.title,position=excluded.position,section_type=excluded.section_type,
    nominal_minutes=excluded.nominal_minutes,source_course_stable_key=excluded.source_course_stable_key,
    source_profile_key=excluded.source_profile_key,required=excluded.required,practical=excluded.practical,
    metadata=public.training_blueprint_sections.metadata||excluded.metadata,updated_at=now();

-- Mappa tutte le varianti di primo soccorso al blueprint comune.
insert into public.training_blueprint_course_types
(source_system,external_course_code,blueprint_key,variant_key,development_status,metadata) values
('safetymanager','primo_soccorso_a_16h','first_aid_initial','group_a','planned','{"catalog_minutes":960,"theory_minutes":600,"practice_minutes":360,"requires_presence":true}'::jsonb),
('safetymanager','primo_soccorso_12h','first_aid_initial','group_bc','planned','{"catalog_minutes":720,"theory_minutes":480,"practice_minutes":240,"requires_presence":true}'::jsonb),
('safetymanager','agg_primo_soccorso_a_6h','first_aid_update','group_a','planned','{"catalog_minutes":360,"practice_minutes":360,"requires_presence":true}'::jsonb),
('safetymanager','agg_primo_soccorso_4h','first_aid_update','group_bc','planned','{"catalog_minutes":240,"practice_minutes":240,"requires_presence":true}'::jsonb),
('safetymanager','antincendio_liv1','fire_initial','level_1','hybrid_partial','{"catalog_minutes":240,"theory_minutes":120,"practice_minutes":120,"requires_presence":true}'::jsonb),
('safetymanager','antincendio_liv2','fire_initial','level_2','hybrid_partial','{"catalog_minutes":480,"theory_minutes":300,"practice_minutes":180,"requires_presence":true}'::jsonb),
('safetymanager','antincendio_liv3','fire_initial','level_3','hybrid_partial','{"catalog_minutes":960,"theory_minutes":720,"practice_minutes":240,"requires_presence":true}'::jsonb),
('safetymanager','agg_antincendio_liv1_2h','fire_update','level_1','hybrid_partial','{"catalog_minutes":120,"theory_minutes":0,"practice_minutes":120,"requires_presence":true}'::jsonb),
('safetymanager','agg_antincendio_liv2_5h','fire_update','level_2','hybrid_partial','{"catalog_minutes":300,"theory_minutes":120,"practice_minutes":180,"requires_presence":true}'::jsonb),
('safetymanager','agg_antincendio_liv3_8h','fire_update','level_3','hybrid_partial','{"catalog_minutes":480,"theory_minutes":300,"practice_minutes":180,"requires_presence":true}'::jsonb),
('safetymanager','emergenze_evacuazione_2h','emergency_evacuation_internal','internal_2h','partial','{"catalog_minutes":120,"internal_non_certifying":true,"requires_presence":false}'::jsonb)
on conflict (source_system,external_course_code) do update
set blueprint_key=excluded.blueprint_key,variant_key=excluded.variant_key,
    development_status=excluded.development_status,
    metadata=public.training_blueprint_course_types.metadata||excluded.metadata,updated_at=now();

-- Profili di rischio e affinità contenuti per l'intera famiglia Emergenze.
insert into public.safetymanager_course_risk_profiles(external_course_code,risk_code,requirement,relevance,metadata)
select x.code,'emergency','core',100,jsonb_build_object('profile','emergency-family-v2')
from (values
 ('primo_soccorso_a_16h'),('primo_soccorso_12h'),('agg_primo_soccorso_a_6h'),('agg_primo_soccorso_4h'),
 ('antincendio_liv1'),('antincendio_liv2'),('antincendio_liv3'),
 ('agg_antincendio_liv1_2h'),('agg_antincendio_liv2_5h'),('agg_antincendio_liv3_8h'),
 ('emergenze_evacuazione_2h')
) x(code)
on conflict (external_course_code,risk_code) do update
set requirement=excluded.requirement,relevance=excluded.relevance,
    metadata=public.safetymanager_course_risk_profiles.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select x.code,'antincendio',100,'core',jsonb_build_object('profile','emergency-family-v2')
from (values
 ('antincendio_liv1'),('antincendio_liv2'),('antincendio_liv3'),
 ('agg_antincendio_liv1_2h'),('agg_antincendio_liv2_5h'),('agg_antincendio_liv3_8h'),
 ('emergenze_evacuazione_2h')
) x(code)
on conflict (external_course_code,source_group) do update
set relevance=excluded.relevance,role=excluded.role,
    metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select 'emergenze_evacuazione_2h',g.source_group,g.relevance,g.role,'{"profile":"emergency-internal"}'::jsonb
from (values ('generale',95,'core'),('fondamenti',95,'core'),('frontoffice',70,'contextual'),('backoffice',70,'contextual'),('polizia',65,'contextual'),('ecologici',60,'contextual'),('verde',60,'contextual')) g(source_group,relevance,role)
on conflict (external_course_code,source_group) do update
set relevance=excluded.relevance,role=excluded.role,
    metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

-- Corso SafetyTraining interno da 2h, già composto con tre LU pubblicate esistenti.
-- Rimane in bozza: nessuna pubblicazione automatica ai corsisti.
do $$
declare
  v_course_id uuid;
  v_version_id uuid;
  v_module_id uuid;
  v_unit_version_id uuid;
  v_pos integer := 0;
  v_key text;
  v_minutes integer;
begin
  insert into public.courses(
    stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata
  ) values (
    'emergenze_evacuazione',
    'Gestione emergenze ed evacuazione - percorso aziendale interno',
    'emergenze',
    'Percorso interno organizzativo su ruoli, allarme, evacuazione e chiamata dei soccorsi. Non abilita come addetto antincendio o primo soccorso.',
    120,'internal_learning',true,
    jsonb_build_object('internal_non_certifying',true,'learner_catalog_hidden',true,'blueprint_key','emergency_evacuation_internal','requires_admin_review',true)
  )
  on conflict (stable_key) do update
    set title=excluded.title,family=excluded.family,description=excluded.description,
        nominal_minutes=excluded.nominal_minutes,
        metadata=public.courses.metadata||excluded.metadata,updated_at=now()
  returning id into v_course_id;

  select id into v_version_id
  from public.course_versions
  where course_id=v_course_id and version_number=1
  limit 1;

  if v_version_id is null then
    insert into public.course_versions(
      course_id,version_number,status,syllabus_snapshot,normative_snapshot
    ) values (
      v_course_id,1,'draft',
      jsonb_build_object('blueprint_key','emergency_evacuation_internal','nominal_minutes',120,'composition','3 existing published Learning Units'),
      jsonb_build_object('scope','internal_organizational','note','Non sostituisce formazione addetti antincendio/primo soccorso né prove di evacuazione ove previste')
    ) returning id into v_version_id;
  else
    update public.course_versions
       set syllabus_snapshot=syllabus_snapshot||jsonb_build_object('blueprint_key','emergency_evacuation_internal','nominal_minutes',120),
           normative_snapshot=normative_snapshot||jsonb_build_object('scope','internal_organizational')
     where id=v_version_id and status='draft';
  end if;

  insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
  values(v_version_id,'emergency_internal','Gestione emergenze ed evacuazione',1,120)
  on conflict (course_version_id,module_key) do update
    set title=excluded.title,position=excluded.position,nominal_minutes=excluded.nominal_minutes
  returning id into v_module_id;

  foreach v_key in array array['generale:emergenze-generale','fondamenti:emergenze-figure','antincendio:rivelazione-allarme']
  loop
    v_pos := v_pos + 1;
    select luv.id,coalesce(lu.default_minutes,0)
      into v_unit_version_id,v_minutes
    from public.learning_units lu
    join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published'
    where lu.stable_key=v_key and lu.active
    order by luv.version_number desc
    limit 1;

    if v_unit_version_id is not null then
      insert into public.course_module_units(
        module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules
      ) values (
        v_module_id,v_unit_version_id,v_pos,true,greatest(v_minutes*36,0),true,
        jsonb_build_object('source','emergency-blueprint-v1','internal_course',true)
      )
      on conflict (module_id,unit_version_id) do update
        set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,
            requires_comprehension=true,completion_rules=public.course_module_units.completion_rules||excluded.completion_rules;
    end if;
  end loop;

  insert into public.integration_course_mappings(
    source_system,external_course_code,course_id,active,metadata
  ) values (
    'safetymanager','emergenze_evacuazione_2h',v_course_id,true,
    jsonb_build_object('blueprint_key','emergency_evacuation_internal','configured_by_system',true,'draft_only',true)
  )
  on conflict (source_system,external_course_code) do update
    set course_id=excluded.course_id,active=true,
        metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();

  update public.integration_course_catalog
     set mapped_course_id=v_course_id,delivery_status='needs_configuration',
         metadata=metadata||jsonb_build_object('blueprint_key','emergency_evacuation_internal','blueprint_development_status','partial'),
         updated_at=now()
   where source_system='safetymanager' and external_course_code='emergenze_evacuazione_2h';
end $$;

-- Aggiorna i metadati catalogo con i blueprint correnti.
update public.integration_course_catalog c
set metadata=c.metadata||jsonb_build_object(
      'blueprint_key',m.blueprint_key,
      'blueprint_variant',m.variant_key,
      'blueprint_development_status',m.development_status,
      'catalog_role','administrative_course_type'
    ),updated_at=now()
from public.training_blueprint_course_types m
where m.source_system=c.source_system
  and m.external_course_code=c.external_course_code
  and c.source_system='safetymanager'
  and c.external_course_code in (
    'primo_soccorso_a_16h','primo_soccorso_12h','agg_primo_soccorso_a_6h','agg_primo_soccorso_4h',
    'antincendio_liv1','antincendio_liv2','antincendio_liv3',
    'agg_antincendio_liv1_2h','agg_antincendio_liv2_5h','agg_antincendio_liv3_8h','emergenze_evacuazione_2h'
  );