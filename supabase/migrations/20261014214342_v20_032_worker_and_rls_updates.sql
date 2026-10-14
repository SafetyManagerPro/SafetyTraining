-- SafetyTraining v20.032
-- Completes the remaining planned mapped course types in scope: worker update and RLS updates.

update public.training_blueprints
set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',360,'renewal_interval_months',60,
  'early_update_triggers',jsonb_build_array('risk_assessment_changes','training_effectiveness_results'),
  'delivery_constraint','elearning_asynchronous_allowed',
  'assessment','test_or_interview','test_minimum_questions',10,'test_minimum_options',3,
  'test_passing_score_pct',70,'dynamic_update',true,'master_registry_version',5),updated_at=now()
where stable_key='worker_update';

insert into public.training_blueprint_rules(blueprint_key,rule_key,rule_type,priority,conditions,outcome,source,notes) values
('worker_initial','renewal_cycle','renewal',30,'{}','{"update_blueprint":"worker_update","interval_months":60,"minimum_minutes":360,"earlier_if":["risk_assessment_changes","training_effectiveness_results"]}','ASR 17/04/2025','Worker update is due at least every five years and earlier when the regulatory triggers occur.'),
('worker_update','duration_and_triggers','duration',5,'{}','{"minimum_minutes":360,"interval_months":60,"earlier_if":["risk_assessment_changes","training_effectiveness_results"]}','ASR 17/04/2025',null),
('worker_update','delivery_update','delivery',10,'{}','{"allowed":["physical","synchronous_video","asynchronous_elearning"]}','ASR 17/04/2025',null),
('worker_update','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null)
on conflict (blueprint_key,rule_key) do update set rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

update public.training_blueprints
set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','D.Lgs. 81/2008 art. 37 c.11',
  'renewal_interval_months',12,'duration_rule','employee_count_and_collective_bargaining',
  'delivery_constraint','collective_bargaining_or_applicable_rules',
  'assessment_not_nationally_hardcoded',true,'dynamic_update',true,'master_registry_version',5),updated_at=now()
where stable_key='rls_update';

update public.training_blueprint_variants
set status='partial',metadata=metadata||jsonb_build_object(
  'minimum_minutes',240,'interval_months',12,'employees_min',15,'employees_max',50,
  'regulatory_basis','D.Lgs. 81/2008 art. 37 c.11','content_and_modalities_source','national_collective_bargaining'),updated_at=now()
where blueprint_key='rls_update' and variant_key='4h';
update public.training_blueprint_variants
set status='partial',metadata=metadata||jsonb_build_object(
  'minimum_minutes',480,'interval_months',12,'employees_min',51,
  'regulatory_basis','D.Lgs. 81/2008 art. 37 c.11','content_and_modalities_source','national_collective_bargaining'),updated_at=now()
where blueprint_key='rls_update' and variant_key='8h';

insert into public.training_blueprint_rules(blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes) values
('rls_update','annual_cycle_4h','4h','renewal',10,'{"employees_min":15,"employees_max":50}','{"interval_months":12,"minimum_minutes":240,"select_variant":"4h"}','D.Lgs. 81/2008 art. 37 c.11','National minimum; contents and modalities remain subject to collective bargaining.'),
('rls_update','annual_cycle_8h','8h','renewal',10,'{"employees_min":51}','{"interval_months":12,"minimum_minutes":480,"select_variant":"8h"}','D.Lgs. 81/2008 art. 37 c.11','National minimum; contents and modalities remain subject to collective bargaining.'),
('rls_update','delivery_collective_bargaining',null,'delivery',20,'{}','{"source":"national_collective_bargaining_or_applicable_rules","asynchronous_elearning":null,"synchronous_video":null}','D.Lgs. 81/2008 art. 37 c.11','Do not infer a nationally permitted delivery mode for RLS updates.')
on conflict (blueprint_key,rule_key) do update set variant_key=excluded.variant_key,rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

do $do$
declare v_course uuid; v_cv uuid; v_mod uuid;
begin
  insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
  values('agg_lav','Aggiornamento Lavoratori - 6h','Lavoratori','Percorso dinamico di aggiornamento: significative evoluzioni normative, tecniche, organizzative e dei rischi. Non replica automaticamente la formazione iniziale.',360,'internal_learning',true,
    jsonb_build_object('blueprint_key','worker_update','composition_version','v20_032','dynamic_update',true,'delivery_constraint','elearning_asynchronous_allowed','requires_admin_review',true,'learner_catalog_hidden',true,'question_bank_complete',false))
  on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=360,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
  returning id into v_course;
  select id into v_cv from public.course_versions where course_id=v_course and version_number=1 limit 1;
  if v_cv is null then
    insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
    values(v_course,1,'draft',date '2025-05-24',jsonb_build_object('source','v20_032','blueprint_key','worker_update','nominal_minutes',360,'dynamic_update',true,'content_selection','current_risks_changes_and_training_needs'),jsonb_build_object('reference','ASR 17/04/2025','interval_months',60,'early_update_triggers',jsonb_build_array('risk_assessment_changes','training_effectiveness_results'),'verification','test_or_interview')) returning id into v_cv;
  end if;
  insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
  values(v_cv,'dynamic_update','Aggiornamento contestualizzato',1,360)
  on conflict(course_version_id,module_key) do update set title=excluded.title,position=1,nominal_minutes=360 returning id into v_mod;
  insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata)
  values(v_cv,'final_learning_verification','Verifica finale aggiornamento lavoratori','test_or_interview',10,3,70,true,'platform_or_external','{"regulatory_basis":"ASR 17/04/2025","dynamic_question_bank":true}'::jsonb)
  on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode='test_or_interview',minimum_questions=10,minimum_options_per_question=3,passing_score_pct=70,required=true,completion_mode='platform_or_external',metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
  insert into public.integration_course_mappings(source_system,external_course_code,course_id,active,metadata)
  values('safetymanager','agg_lav',v_course,true,'{"blueprint":"worker_update","composition_version":"v20_032"}'::jsonb)
  on conflict(source_system,external_course_code) do update set course_id=excluded.course_id,active=true,metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();
  update public.integration_course_catalog set mapped_course_id=v_course,delivery_status='needs_configuration',metadata=metadata||'{"composition_version":"v20_032","dynamic_update":true,"question_bank_complete":false,"requires_admin_review":true}'::jsonb,updated_at=now() where source_system='safetymanager' and external_course_code='agg_lav';
  update public.training_blueprint_course_types set development_status='partial',metadata=metadata||'{"composition_version":"v20_032","dynamic_update":true,"question_bank_complete":false,"requires_admin_review":true}'::jsonb,updated_at=now() where source_system='safetymanager' and external_course_code='agg_lav';
end $do$;

do $do$
declare r record; v_course uuid; v_cv uuid; v_mod uuid;
begin
  for r in select * from (values
    ('agg_rls_4h','4h',240,'15-50'),
    ('agg_rls_8h','8h',480,'51+')
  ) t(code,variant_key,minutes,employee_band)
  loop
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    select c.external_course_code,c.title,'RLS','Aggiornamento periodico RLS. La durata minima deriva dall’art. 37, comma 11; contenuti e modalità specifiche devono essere verificati rispetto alla contrattazione collettiva nazionale applicabile.',r.minutes,'internal_learning',true,
      jsonb_build_object('blueprint_key','rls_update','variant_key',r.variant_key,'composition_version','v20_032','dynamic_update',true,'employee_band',r.employee_band,'interval_months',12,'delivery_constraint','collective_bargaining_or_applicable_rules','requires_collective_bargaining_check',true,'requires_admin_review',true,'learner_catalog_hidden',true)
    from public.integration_course_catalog c where c.source_system='safetymanager' and c.external_course_code=r.code
    on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=excluded.nominal_minutes,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course;
    select id into v_cv from public.course_versions where course_id=v_course and version_number=1 limit 1;
    if v_cv is null then
      insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
      values(v_course,1,'draft',current_date,jsonb_build_object('source','v20_032','blueprint_key','rls_update','variant_key',r.variant_key,'nominal_minutes',r.minutes,'dynamic_update',true,'content_source','applicable_collective_bargaining_and_current_safety_context'),jsonb_build_object('reference','D.Lgs. 81/2008 art. 37 c.11','interval_months',12,'delivery_mode_not_nationally_hardcoded',true)) returning id into v_cv;
    end if;
    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_cv,'dynamic_rls_update','Aggiornamento RLS contestualizzato',1,r.minutes)
    on conflict(course_version_id,module_key) do update set title=excluded.title,position=1,nominal_minutes=excluded.nominal_minutes returning id into v_mod;
    insert into public.integration_course_mappings(source_system,external_course_code,course_id,active,metadata)
    values('safetymanager',r.code,v_course,true,jsonb_build_object('blueprint','rls_update','variant_key',r.variant_key,'composition_version','v20_032'))
    on conflict(source_system,external_course_code) do update set course_id=excluded.course_id,active=true,metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();
    update public.integration_course_catalog set mapped_course_id=v_course,delivery_status='needs_configuration',metadata=metadata||jsonb_build_object('composition_version','v20_032','dynamic_update',true,'requires_collective_bargaining_check',true,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.code;
    update public.training_blueprint_course_types set development_status='partial',metadata=metadata||jsonb_build_object('composition_version','v20_032','dynamic_update',true,'requires_collective_bargaining_check',true,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.code;
  end loop;
end $do$;
