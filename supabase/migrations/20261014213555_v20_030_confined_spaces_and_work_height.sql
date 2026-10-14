-- SafetyTraining v20.030
-- Confined spaces under ASR 17/04/2025 and work-at-height/DPI III category under D.Lgs. 81/08 art. 77.
-- Ponteggi and funi are intentionally excluded.

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; DPR 177/2011','minimum_minutes',720,
  'theory_minutes',240,'practical_minutes',480,'delivery_constraint','physical_only',
  'asynchronous_elearning_allowed',false,'synchronous_video_allowed',false,'assessment','test_and_practical',
  'test_minimum_questions',30,'test_minimum_options',3,'test_passing_score_pct',70,
  'renewal_interval_months',60,'update_minimum_minutes',240,'master_registry_version',3),updated_at=now()
where stable_key='confined_spaces_initial';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; DPR 177/2011','minimum_minutes',240,
  'practical_minutes',240,'theory_minutes',0,'delivery_constraint','physical_only',
  'asynchronous_elearning_allowed',false,'synchronous_video_allowed',false,'assessment','practical_and_interview',
  'renewal_interval_months',60,'master_registry_version',3),updated_at=now()
where stable_key='confined_spaces_update';

update public.training_blueprint_sections set title='Modulo giuridico-tecnico',nominal_minutes=240,practical=false,
  metadata=metadata||'{"regulatory_split":true,"delivery":"physical"}'::jsonb,updated_at=now()
where blueprint_key='confined_spaces_initial' and section_key='confined_theory';
update public.training_blueprint_sections set title='Parte pratica',nominal_minutes=480,practical=true,
  metadata=metadata||'{"regulatory_split":true,"delivery":"physical","not_completed_digitally":true}'::jsonb,updated_at=now()
where blueprint_key='confined_spaces_initial' and section_key='confined_practice';
update public.training_blueprint_sections set nominal_minutes=0,required=false,
  metadata=metadata||'{"not_part_of_regulatory_minimum":true,"retained_for_legacy_compatibility":true}'::jsonb,updated_at=now()
where blueprint_key='confined_spaces_update' and section_key='confined_update';
update public.training_blueprint_sections set title='Aggiornamento pratico',nominal_minutes=240,practical=true,
  metadata=metadata||'{"regulatory_split":true,"delivery":"physical","not_completed_digitally":true}'::jsonb,updated_at=now()
where blueprint_key='confined_spaces_update' and section_key='confined_practice';

insert into public.training_blueprint_rules(blueprint_key,rule_key,rule_type,priority,conditions,outcome,source,notes) values
('confined_spaces_initial','delivery_initial','delivery',10,'{}','{"allowed":["physical"],"synchronous_video":false,"asynchronous_elearning":false}','ASR 17/04/2025','The course is delivered in physical presence.'),
('confined_spaces_initial','regulatory_split','composition',15,'{}','{"theory_minutes":240,"practical_minutes":480,"total_minutes":720}','ASR 17/04/2025','4h legal-technical + 8h practical.'),
('confined_spaces_initial','final_verification','assessment',20,'{}','{"mode":"test_and_practical","test_min_questions":30,"min_options":3,"passing_score_pct":70,"practical_required":true}','ASR 17/04/2025',null),
('confined_spaces_initial','renewal_cycle','renewal',30,'{}','{"update_blueprint":"confined_spaces_update","interval_months":60,"minimum_minutes":240,"practical_minutes":240}','ASR 17/04/2025',null),
('confined_spaces_update','delivery_update','delivery',10,'{}','{"allowed":["physical"],"synchronous_video":false,"asynchronous_elearning":false}','ASR 17/04/2025',null),
('confined_spaces_update','final_verification','assessment',20,'{}','{"mode":"practical_and_interview","practical_required":true,"interview_required":true}','ASR 17/04/2025',null)
on conflict (blueprint_key,rule_key) do update set rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','D.Lgs. 81/2008 art. 77; Regolamento UE 2016/425','catalog_minutes',480,
  'statutory_minimum_minutes',null,'duration_source','safetymanager_legacy_catalog',
  'training_required',true,'practical_training_required',true,'delivery_constraint','practical_in_person',
  'excludes_funi_and_ponteggi',true,'master_registry_version',3),updated_at=now()
where stable_key='work_height_dpi3';

update public.training_blueprint_sections set nominal_minutes=240,
  metadata=metadata||'{"internal_allocation":true,"duration_source":"legacy_catalog_not_statutory"}'::jsonb,updated_at=now()
where blueprint_key='work_height_dpi3' and section_key='height_theory';
update public.training_blueprint_sections set nominal_minutes=240,practical=true,
  metadata=metadata||'{"internal_allocation":true,"duration_source":"legacy_catalog_not_statutory","not_completed_digitally":true}'::jsonb,updated_at=now()
where blueprint_key='work_height_dpi3' and section_key='height_practice';

insert into public.training_blueprint_rules(blueprint_key,rule_key,rule_type,priority,conditions,outcome,source,notes) values
('work_height_dpi3','catalog_duration_not_statutory','duration',5,'{}','{"catalog_minutes":480,"statutory_minimum_minutes":null,"source":"safetymanager_legacy_catalog"}','D.Lgs. 81/2008 art. 77','The 8h duration is a catalog choice, not a national statutory minimum under art. 77.'),
('work_height_dpi3','practical_training_required','practical',10,'{}','{"digital_completion":false,"requires_practical_component":true,"section_key":"height_practice"}','D.Lgs. 81/2008 art. 77','Practical training is mandatory for category III PPE.'),
('work_height_dpi3','scope_exclusions','eligibility',20,'{}','{"excludes":["ponteggi","sistemi_accesso_posizionamento_funi"]}','SafetyTraining project scope','Standalone ponteggi and funi families are intentionally excluded.')
on conflict (blueprint_key,rule_key) do update set rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

do $do$
declare r record; v_lu uuid; v_ver uuid; v_q uuid; v_content jsonb;
begin
  for r in select * from (values
    ('confined:theory:01','Normativa, definizioni e identificazione degli ambienti confinati','Riconoscere il quadro normativo, le definizioni e le caratteristiche di un ambiente confinato o sospetto di inquinamento.'),
    ('confined:theory:02','Fattori di rischio e dinamiche infortunistiche','Individuare fattori di rischio, eventi infortunistici ricorrenti, atmosfere pericolose, incendio/esplosione, seppellimento e cadute.'),
    ('confined:theory:03','Misure e procedure di prevenzione','Applicare procedure di ingresso e uscita, controllo accessi, ventilazione, illuminazione, isolamento delle attrezzature e sorveglianza sanitaria.'),
    ('confined:theory:04','Monitoraggio atmosfera, DPI, APVR ed emergenze','Comprendere monitoraggio dell’atmosfera, scelta dei DPI e APVR, comunicazione e principi delle procedure di emergenza e recupero.')
  ) t(stable_key,title,summary)
  loop
    v_content:=jsonb_build_object('id',split_part(r.stable_key,':',3),'title',r.title,'slide_title',r.title,'summary',r.summary,
      'detail',r.summary||' La trattazione teorica non sostituisce le otto ore di parte pratica previste dal percorso.',
      'norm','ASR 17/04/2025 - DPR 177/2011','minutes',60,'icon','🫁','visual','confined-space',
      'teacher','Usare casi reali e collegare sempre la teoria alle procedure di ingresso, monitoraggio ed emergenza.',
      'quality',jsonb_build_object('version','v20.030','checkpoint_only',true,'final_assessment',false),
      'scope',jsonb_build_object('physical_course_only',true,'practical_component_separate',true));
    insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    values(r.stable_key,r.title,r.summary,60,'ambienti_confinati',array['asr2025','confined_spaces','theory'],true,
      jsonb_build_object('regulatory_basis','ASR 17/04/2025; DPR 177/2011','created_by_migration','v20_030'))
    on conflict(stable_key) do update set title=excluded.title,summary=excluded.summary,default_minutes=60,source_group='ambienti_confinati',tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
    returning id into v_lu;
    select id into v_ver from public.learning_unit_versions where learning_unit_id=v_lu and version_number=1 limit 1;
    if v_ver is null then
      insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
      values(v_lu,1,'published',v_content,now()) returning id into v_ver;
    else
      update public.learning_unit_versions set status='published',content=v_content,published_at=coalesce(published_at,now()) where id=v_ver;
    end if;
    insert into public.questions(stable_key,unit_version_id,prompt,question_type,options,public_explanation,active,metadata)
    values(r.stable_key||':checkpoint',v_ver,'Quale principio è coerente con questa unità?','single_choice',
      jsonb_build_array(jsonb_build_object('id','0','label',r.summary),jsonb_build_object('id','1','label','La parte pratica può essere sostituita dalla sola lettura delle procedure.'),jsonb_build_object('id','2','label','Il rischio può essere gestito senza valutazione e procedure specifiche.')),
      r.summary,true,jsonb_build_object('assignment',jsonb_build_object('purpose','checkpoint','required',true),'not_final_assessment',true,'created_by_migration','v20_030'))
    on conflict(stable_key) do update set unit_version_id=excluded.unit_version_id,prompt=excluded.prompt,options=excluded.options,public_explanation=excluded.public_explanation,active=true,metadata=public.questions.metadata||excluded.metadata,updated_at=now()
    returning id into v_q;
    insert into public.question_answer_keys(question_id,answer_key,explanation_private)
    values(v_q,jsonb_build_object('correct_answer',jsonb_build_object('option_id','0')),r.summary)
    on conflict(question_id) do update set answer_key=excluded.answer_key,explanation_private=excluded.explanation_private,updated_at=now();
  end loop;
end $do$;

do $do$
declare r record; v_course uuid; v_cv uuid; v_mod uuid; v_luv uuid; v_key text; v_pos int;
begin
  for r in select * from (values
    ('amb_confinati','Ambienti sospetti di inquinamento o confinati - 12h','Rischi specialistici',720,'confined_spaces_initial',false,array['confined:theory:01','confined:theory:02','confined:theory:03','confined:theory:04']::text[]),
    ('agg_spazi_confinati_4h','Aggiornamento ambienti sospetti di inquinamento o confinati - 4h','Rischi specialistici',240,'confined_spaces_update',true,array[]::text[]),
    ('lav_quota','Lavori in quota e DPI III categoria - 8h','Rischi specialistici',480,'work_height_dpi3',false,array[]::text[])
  ) t(code,title,family,minutes,blueprint_key,is_update,unit_keys)
  loop
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(r.code,r.title,r.family,
      case when r.blueprint_key='work_height_dpi3' then 'Percorso SafetyManager da 8h per lavori in quota e DPI III categoria. La durata di 8h è una scelta di catalogo e non è registrata come minimo nazionale dell’art. 77; l’addestramento pratico resta obbligatorio.'
      when r.is_update then 'Aggiornamento quinquennale di almeno 4h pratiche per ambienti confinati.'
      else 'Corso ASR 2025: 4h giuridico-tecniche e 8h pratiche, in presenza.' end,
      r.minutes,'internal_learning',true,
      jsonb_build_object('blueprint_key',r.blueprint_key,'composition_version','v20_030','requires_admin_review',true,'learner_catalog_hidden',true,
        'delivery_constraint','physical_only','practical_component_separate',true,
        'duration_source',case when r.blueprint_key='work_height_dpi3' then 'safetymanager_legacy_catalog' else 'regulatory' end))
    on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=excluded.nominal_minutes,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course;
    select id into v_cv from public.course_versions where course_id=v_course and version_number=1 limit 1;
    if v_cv is null then
      insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
      values(v_course,1,'draft',date '2025-05-24',jsonb_build_object('source','v20_030','blueprint_key',r.blueprint_key,'nominal_minutes',r.minutes),
        jsonb_build_object('reference',case when r.blueprint_key like 'confined%' then 'ASR 17/04/2025; DPR 177/2011' else 'D.Lgs. 81/2008 art. 77' end,'publication_gate','Admin/didactic review + practical validation')) returning id into v_cv;
    end if;

    if r.blueprint_key='confined_spaces_initial' then
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values(v_cv,'confined_theory','Modulo giuridico-tecnico',1,240)
      on conflict(course_version_id,module_key) do update set title=excluded.title,position=1,nominal_minutes=240 returning id into v_mod;
      v_pos:=0;
      foreach v_key in array r.unit_keys loop
        v_pos:=v_pos+1;
        select luv.id into v_luv from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published' where lu.stable_key=v_key order by luv.version_number desc limit 1;
        insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
        values(v_mod,v_luv,v_pos,true,2160,true,'{"checkpoint_only":true,"final_assessment_separate":true,"delivery":"physical"}'::jsonb)
        on conflict(module_id,unit_version_id) do update set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,completion_rules=public.course_module_units.completion_rules||excluded.completion_rules;
      end loop;
      insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
      values(v_course,'confined_practice','Parte pratica ambienti confinati',480,true,'external_presence','{"regulatory":true,"delivery":"physical","validation_required":true}'::jsonb)
      on conflict(course_id,requirement_key) do update set title=excluded.title,nominal_minutes=480,required=true,completion_mode='external_presence',metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata)
      values(v_cv,'final_verification','Verifica finale: test e prove pratiche','test_and_practical',30,3,70,true,'platform_or_external','{"practical_required":true,"regulatory_basis":"ASR 17/04/2025"}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='test_and_practical',minimum_questions=30,minimum_options_per_question=3,passing_score_pct=70,required=true,metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    elsif r.blueprint_key='confined_spaces_update' then
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values(v_cv,'confined_practical_update','Aggiornamento pratico',1,240)
      on conflict(course_version_id,module_key) do update set title=excluded.title,position=1,nominal_minutes=240;
      insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
      values(v_course,'confined_update_practice','Aggiornamento pratico ambienti confinati',240,true,'external_presence','{"regulatory":true,"delivery":"physical","validation_required":true}'::jsonb)
      on conflict(course_id,requirement_key) do update set title=excluded.title,nominal_minutes=240,required=true,completion_mode='external_presence',metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,required,completion_mode,metadata)
      values(v_cv,'final_verification','Verifica aggiornamento: prova pratica e colloquio','practical_and_interview',true,'external','{"regulatory_basis":"ASR 17/04/2025"}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='practical_and_interview',required=true,completion_mode='external',metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    else
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values(v_cv,'height_theory','Formazione lavori in quota e DPI',1,240)
      on conflict(course_version_id,module_key) do update set title=excluded.title,position=1,nominal_minutes=240;
      insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
      values(v_course,'dpi3_training','Addestramento pratico DPI III categoria',240,true,'external_presence','{"statutory_training_required":true,"allocation_minutes_internal":true,"duration_source":"legacy_catalog_not_statutory"}'::jsonb)
      on conflict(course_id,requirement_key) do update set title=excluded.title,nominal_minutes=240,required=true,completion_mode='external_presence',metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();
    end if;

    insert into public.integration_course_mappings(source_system,external_course_code,course_id,active,metadata)
    values('safetymanager',r.code,v_course,true,jsonb_build_object('blueprint',r.blueprint_key,'composition_version','v20_030'))
    on conflict(source_system,external_course_code) do update set course_id=excluded.course_id,active=true,metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();
    update public.integration_course_catalog set mapped_course_id=v_course,delivery_status='needs_configuration',metadata=metadata||jsonb_build_object('composition_version','v20_030','requires_presence',true,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.code;
    update public.training_blueprint_course_types set development_status='partial',metadata=metadata||jsonb_build_object('composition_version','v20_030','requires_presence',true,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.code;
  end loop;
end $do$;
