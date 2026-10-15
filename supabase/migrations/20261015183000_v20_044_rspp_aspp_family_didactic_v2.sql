-- SafetyTraining v20.044
-- RSPP/ASPP family: Module A, B common, B-SP1..5, Module C, ASPP/RSPP updates.
-- ASR 17/04/2025 Rep. 59/CSR. All course versions remain draft/hidden.
-- Test Builder remains paused. B-SP1/2/3/5 reuse the already authored sector LU library
-- shared with DL-RSPP where the official technical contents coincide.

-- 1) Master Registry / Blueprints
insert into public.training_blueprints(stable_key,title,family,strategy,status,description,metadata)
values
('rspp_aspp_a','RSPP/ASPP - Modulo A','RSPP/ASPP','role_program','partial','Modulo giuridico-istituzionale di 28 ore.',
 '{"regulatory_basis":"Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR","minimum_minutes":1680,"attendance_min_pct":90,"delivery":{"physical":true,"vcs":true,"elearning":true},"assessment":{"mode":"test","supplementary_interview_allowed":true,"minimum_questions":30,"minimum_options":3,"passing_score_pct":70},"learner_catalog_hidden":true,"didactic_version":"rspp-aspp-v2"}'::jsonb),
('rspp_aspp_b','RSPP/ASPP - Modulo B comune','RSPP/ASPP','role_program','partial','Modulo tecnico comune di 48 ore.',
 '{"regulatory_basis":"Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR","minimum_minutes":2880,"attendance_min_pct":90,"delivery":{"physical":true,"vcs":true,"elearning":false},"prerequisite":"rspp_aspp_a_or_exemption","assessment":{"mode":"test_and_simulation","minimum_questions":30,"minimum_options":3,"passing_score_pct":70,"scope":"module_b_common_plus_applicable_specializations"},"learner_catalog_hidden":true,"didactic_version":"rspp-aspp-v2"}'::jsonb),
('rspp_aspp_bsp','RSPP/ASPP - Moduli B specialistici','RSPP/ASPP','composite_sector','partial','Specializzazioni di settore B-SP1..B-SP5 da aggiungere al Modulo B comune quando applicabili.',
 '{"regulatory_basis":"Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR","variant_count":5,"attendance_min_pct":90,"delivery":{"physical":true,"vcs":true,"elearning":false},"prerequisite":"rspp_aspp_b","assessment":{"mode":"test_and_simulation","scope":"module_b_common_plus_applicable_specializations"},"learner_catalog_hidden":true,"didactic_version":"rspp-aspp-v2"}'::jsonb),
('rspp_c','RSPP - Modulo C','RSPP','role_program','partial','Specializzazione gestionale-relazionale di 24 ore riservata al RSPP.',
 '{"regulatory_basis":"Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR","minimum_minutes":1440,"attendance_min_pct":90,"delivery":{"physical":true,"vcs":true,"elearning":false},"audience":"RSPP","assessment":{"mode":"interview"},"learner_catalog_hidden":true,"didactic_version":"rspp-aspp-v2"}'::jsonb),
('aspp_update','Aggiornamento ASPP','RSPP/ASPP','update_program','partial','Aggiornamento quinquennale ASPP di almeno 20 ore.',
 '{"regulatory_basis":"Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR","minimum_minutes":1200,"renewal_interval_months":60,"renewal_anchor":"completion_of_rspp_aspp_module_b_common","attendance_min_pct":90,"delivery":{"physical":true,"vcs":true,"elearning":true},"assessment":{"mode":"test_or_interview","test_minimum_questions":10,"minimum_options":3,"passing_score_pct":70},"dynamic_update":true,"learner_catalog_hidden":true,"didactic_version":"rspp-aspp-v2"}'::jsonb),
('rspp_update','Aggiornamento RSPP','RSPP/ASPP','update_program','partial','Aggiornamento quinquennale RSPP di almeno 40 ore.',
 '{"regulatory_basis":"Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR","minimum_minutes":2400,"renewal_interval_months":60,"renewal_anchor":"completion_of_rspp_aspp_module_b_common","attendance_min_pct":90,"delivery":{"physical":true,"vcs":true,"elearning":true},"assessment":{"mode":"test_or_interview","test_minimum_questions":10,"minimum_options":3,"passing_score_pct":70},"dynamic_update":true,"learner_catalog_hidden":true,"didactic_version":"rspp-aspp-v2"}'::jsonb)
on conflict(stable_key) do update set
 title=excluded.title,family=excluded.family,strategy=excluded.strategy,status='partial',description=excluded.description,
 metadata=public.training_blueprints.metadata||excluded.metadata,updated_at=now();

insert into public.training_blueprint_variants(blueprint_key,variant_key,title,nominal_minutes,status,metadata)
values
('rspp_aspp_bsp','bsp1_agricoltura','B-SP1 - Agricoltura, silvicoltura e zootecnia',960,'partial','{"ateco_reference":"A 01-02","shared_sector_library":"dl_rspp_sector:agricoltura_zootecnia"}'::jsonb),
('rspp_aspp_bsp','bsp2_pesca','B-SP2 - Pesca',720,'partial','{"ateco_reference":"A 03","shared_sector_library":"dl_rspp_sector:pesca"}'::jsonb),
('rspp_aspp_bsp','bsp3_costruzioni','B-SP3 - Costruzioni',960,'partial','{"ateco_reference":"F","shared_sector_library":"dl_rspp_sector:costruzioni"}'::jsonb),
('rspp_aspp_bsp','bsp4_sanita_residenziale','B-SP4 - Sanità residenziale',720,'partial','{"ateco_reference":"Q 86.1, 87","dedicated_learning_units":true}'::jsonb),
('rspp_aspp_bsp','bsp5_chimico_petrolchimico','B-SP5 - Chimico-petrolchimico',960,'partial','{"ateco_reference":"C 19-20","shared_sector_library":"dl_rspp_sector:chimico_petrolchimico"}'::jsonb)
on conflict(blueprint_key,variant_key) do update set title=excluded.title,nominal_minutes=excluded.nominal_minutes,status='partial',metadata=public.training_blueprint_variants.metadata||excluded.metadata,updated_at=now();

insert into public.training_blueprint_sections(blueprint_key,section_key,title,position,section_type,nominal_minutes,required,practical,metadata)
values
('rspp_aspp_a','a1','A1 - Approccio alla prevenzione, sistema legislativo e istituzionale',1,'fixed_course',480,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_aspp_a','a2','A2 - Soggetti del sistema di prevenzione aziendale',2,'fixed_course',240,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_aspp_a','a3','A3 - Processo di valutazione dei rischi',3,'fixed_course',480,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_aspp_a','a4','A4 - Misure di prevenzione/protezione, emergenze e sorveglianza sanitaria',4,'fixed_course',240,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_aspp_a','a5','A5 - Consultazione, informazione, formazione e addestramento',5,'fixed_course',240,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_aspp_b','b_common','Modulo B comune - 12 UD tecnico-applicative',1,'fixed_course',2880,true,false,'{"internal_ud_allocation":true,"official_total_minutes":2880}'::jsonb),
('rspp_aspp_bsp','sector_specialization','B-SP applicabile al settore',1,'sector_dynamic',null,true,false,'{"variant_driven":true}'::jsonb),
('rspp_c','c1','C1 - Informazione, formazione e addestramento',1,'fixed_course',480,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_c','c2','C2 - Organizzazione e sistemi di gestione SSL',2,'fixed_course',480,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_c','c3','C3 - Relazioni e comunicazione',3,'fixed_course',240,true,false,'{"statutory_duration":true}'::jsonb),
('rspp_c','c4','C4 - Benessere organizzativo, ergonomia e fattori psicosociali',4,'fixed_course',240,true,false,'{"statutory_duration":true}'::jsonb),
('aspp_update','dynamic_update','Aggiornamento contestualizzato ASPP',1,'update_dynamic',1200,true,false,'{"dynamic_update":true}'::jsonb),
('rspp_update','dynamic_update','Aggiornamento contestualizzato RSPP',1,'update_dynamic',2400,true,false,'{"dynamic_update":true}'::jsonb)
on conflict(blueprint_key,section_key) do update set title=excluded.title,position=excluded.position,section_type=excluded.section_type,nominal_minutes=excluded.nominal_minutes,required=true,practical=excluded.practical,metadata=public.training_blueprint_sections.metadata||excluded.metadata,updated_at=now();

insert into public.training_blueprint_rules(blueprint_key,rule_key,rule_type,priority,conditions,outcome,source,notes)
values
('rspp_aspp_a','delivery','delivery',10,'{}','{"allowed":["physical","synchronous_video","elearning"]}','ASR 17/04/2025','E-learning consentito per il solo Modulo A nel percorso iniziale RSPP/ASPP.'),
('rspp_aspp_a','final_verification','assessment',20,'{}','{"mode":"test","supplementary_interview_allowed":true,"minimum_questions":30,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025','Test eventualmente integrato da colloquio.'),
('rspp_aspp_b','eligibility','eligibility',5,'{}','{"requires_any":["rspp_aspp_a","art32_exemption"]}','ASR 17/04/2025','Modulo A o esonero/credito previsto.'),
('rspp_aspp_b','delivery','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025','E-learning non consentito per Modulo B.'),
('rspp_aspp_b','final_verification','assessment',20,'{}','{"mode":"test_and_simulation","test_min_questions":30,"min_options":3,"passing_score_pct":70,"scope":"common_plus_applicable_specializations"}','ASR 17/04/2025','Verifica del Modulo B: test e simulazione.'),
('rspp_aspp_bsp','eligibility','eligibility',5,'{}','{"requires":["rspp_aspp_b"]}','ASR 17/04/2025','Il Modulo B comune è propedeutico alle specializzazioni.'),
('rspp_aspp_bsp','delivery','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025','E-learning non consentito per B-SP.'),
('rspp_c','audience','audience',5,'{}','{"roles":["RSPP"]}','ASR 17/04/2025','Modulo C riservato alle funzioni RSPP.'),
('rspp_c','delivery','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025','E-learning non consentito per Modulo C.'),
('rspp_c','final_verification','assessment',20,'{}','{"mode":"interview"}','ASR 17/04/2025','Colloquio individuale.'),
('aspp_update','renewal','renewal',10,'{}','{"interval_months":60,"minimum_minutes":1200,"anchor":"completion_of_rspp_aspp_module_b_common"}','ASR 17/04/2025','20 ore ASPP nel quinquennio.'),
('aspp_update','delivery','delivery',20,'{}','{"allowed":["physical","synchronous_video","elearning"]}','ASR 17/04/2025','Aggiornamento RSPP/ASPP erogabile anche in e-learning.'),
('aspp_update','assessment','assessment',30,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025','Verifica coerente con l’oggetto dell’aggiornamento.'),
('rspp_update','renewal','renewal',10,'{}','{"interval_months":60,"minimum_minutes":2400,"anchor":"completion_of_rspp_aspp_module_b_common"}','ASR 17/04/2025','40 ore RSPP nel quinquennio.'),
('rspp_update','delivery','delivery',20,'{}','{"allowed":["physical","synchronous_video","elearning"]}','ASR 17/04/2025','Aggiornamento RSPP/ASPP erogabile anche in e-learning.'),
('rspp_update','assessment','assessment',30,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025','Verifica coerente con l’oggetto dell’aggiornamento.')
on conflict(blueprint_key,rule_key) do update set rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

insert into public.training_blueprint_course_types(source_system,external_course_code,blueprint_key,variant_key,development_status,metadata)
values
('safetytraining','rspp_aspp_a','rspp_aspp_a',null,'partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_aspp_b','rspp_aspp_b',null,'partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_aspp_bsp1','rspp_aspp_bsp','bsp1_agricoltura','partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_aspp_bsp2','rspp_aspp_bsp','bsp2_pesca','partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_aspp_bsp3','rspp_aspp_bsp','bsp3_costruzioni','partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_aspp_bsp4','rspp_aspp_bsp','bsp4_sanita_residenziale','partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_aspp_bsp5','rspp_aspp_bsp','bsp5_chimico_petrolchimico','partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','rspp_c','rspp_c',null,'partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','agg_aspp','aspp_update',null,'partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb),
('safetytraining','agg_rspp','rspp_update',null,'partial','{"didactic_version":"rspp-aspp-v2"}'::jsonb)
on conflict(source_system,external_course_code) do update set blueprint_key=excluded.blueprint_key,variant_key=excluded.variant_key,development_status='partial',metadata=public.training_blueprint_course_types.metadata||excluded.metadata,updated_at=now();

-- 2) Course and LU materialization

do $do$
declare
  spec jsonb; u jsonb; v_course_id uuid; v_cv_id uuid; v_mod_id uuid; v_lu_id uuid; v_luv_id uuid; v_pos int;
begin
  -- Courses whose LUs are authored in this migration.
  for spec in select value from jsonb_array_elements($json$
  [
    {"key":"rspp_aspp_a","title":"RSPP/ASPP - Modulo A - 28h","family":"RSPP/ASPP","minutes":1680,"blueprint":"rspp_aspp_a","delivery":"physical_vcs_elearning","assessment":"test_optional_interview","units":[
      ["a1","A1 - Approccio alla prevenzione, sistema legislativo e istituzionale",480],["a2","A2 - Soggetti del sistema di prevenzione aziendale",240],["a3","A3 - Processo di valutazione dei rischi",480],["a4","A4 - Misure, emergenze e sorveglianza sanitaria",240],["a5","A5 - Consultazione, informazione, formazione e addestramento",240]]},
    {"key":"rspp_aspp_b","title":"RSPP/ASPP - Modulo B comune - 48h","family":"RSPP/ASPP","minutes":2880,"blueprint":"rspp_aspp_b","delivery":"physical_or_vcs","assessment":"test_and_simulation","units":[
      ["ud1","UD1 - Tecniche specifiche di valutazione e analisi incidenti",240],["ud2","UD2 - Organizzazione dei processi produttivi e del lavoro",240],["ud3","UD3 - Ambienti e luoghi di lavoro",240],["ud4","UD4 - Incendio, ATEX ed emergenze",240],["ud5","UD5 - Rischi infortunistici",240],["ud6","UD6 - Ergonomia, movimentazione manuale e VDT",240],["ud7","UD7 - Rischi psicosociali",240],["ud8","UD8 - Agenti fisici",240],["ud9","UD9 - Agenti chimici, cancerogeni, mutageni e amianto",240],["ud10","UD10 - Agenti biologici",240],["ud11","UD11 - Attività particolari: confinati, strade, rifiuti",240],["ud12","UD12 - Sostanze psicotrope, stupefacenti e alcol",240]]},
    {"key":"rspp_aspp_bsp4","title":"RSPP/ASPP - B-SP4 Sanità residenziale - 12h","family":"RSPP/ASPP","minutes":720,"blueprint":"rspp_aspp_bsp","variant":"bsp4_sanita_residenziale","delivery":"physical_or_vcs","assessment":"module_b_test_and_simulation","units":[
      ["ud1","UD1 - Infortuni e malattie professionali del comparto",45],["ud2","UD2 - Organizzazione del lavoro sanitario e residenziale",60],["ud3","UD3 - Strutture e impianti",45],["ud4","UD4 - Macchine e attrezzature",45],["ud5","UD5 - Movimentazione carichi e pazienti",45],["ud6","UD6 - Taglio e puntura",45],["ud7","UD7 - Chimici, cancerogeni, mutageni e amianto",60],["ud8","UD8 - Agenti biologici",60],["ud9","UD9 - Agenti fisici",45],["ud10","UD10 - Cenni sulle radiazioni ionizzanti",30],["ud11","UD11 - Incendio ed emergenze",45],["ud12","UD12 - Aggressioni, stress e burnout",60],["ud13","UD13 - Protezioni collettive e DPI",45],["ud14","UD14 - Atmosfere iperbariche",45],["ud15","UD15 - Rifiuti ospedalieri",45]]},
    {"key":"rspp_c","title":"RSPP - Modulo C - 24h","family":"RSPP","minutes":1440,"blueprint":"rspp_c","delivery":"physical_or_vcs","assessment":"interview","units":[
      ["c1","C1 - Informazione, formazione, addestramento e progettazione formativa",480],["c2","C2 - Organizzazione e sistemi di gestione SSL",480],["c3","C3 - Relazioni, comunicazione, negoziazione e conflitti",240],["c4","C4 - Benessere organizzativo, ergonomia e fattori psicosociali",240]]},
    {"key":"agg_aspp","title":"Aggiornamento ASPP - 20h / 5 anni","family":"RSPP/ASPP","minutes":1200,"blueprint":"aspp_update","delivery":"physical_vcs_elearning","assessment":"test_or_interview","dynamic":true,"units":[
      ["u1","Novità normative, tecniche e organizzative",240],["u2","Riesame dei rischi, metodi e dati",240],["u3","Infortuni, near miss, audit e indicatori",240],["u4","Efficacia delle misure e miglioramento",240],["u5","Competenze, coordinamento e approfondimenti professionali",240]]},
    {"key":"agg_rspp","title":"Aggiornamento RSPP - 40h / 5 anni","family":"RSPP/ASPP","minutes":2400,"blueprint":"rspp_update","delivery":"physical_vcs_elearning","assessment":"test_or_interview","dynamic":true,"units":[
      ["u1","Novità normative, tecniche e organizzative",300],["u2","Riesame dei rischi, metodi e dati",300],["u3","Infortuni, near miss, audit e indicatori",300],["u4","Efficacia delle misure e miglioramento",300],["u5","Competenze, comunicazione e consultazione",300],["u6","Approfondimenti specialistici di settore",300],["u7","Sistemi di gestione e cambiamento organizzativo",300],["u8","Project work e riesame professionale",300]]}
  ]$json$::jsonb)
  loop
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(spec->>'key',spec->>'title',spec->>'family','Percorso RSPP/ASPP ASR 2025 in sviluppo didattico v2.',(spec->>'minutes')::int,'internal_learning',true,
      jsonb_build_object('blueprint_key',spec->>'blueprint','variant_key',spec->>'variant','didactic_version','rspp-aspp-v2','regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','attendance_min_pct',90,'delivery_constraint',spec->>'delivery','assessment',spec->>'assessment','learner_catalog_hidden',true,'requires_admin_review',true,'final_test_builder_paused',true,'dynamic_update',coalesce((spec->>'dynamic')::boolean,false),'internal_didactic_allocation',true,'statutory_per_topic_duration',false))
    on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=excluded.nominal_minutes,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course_id;

    insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
    values(v_course_id,1,'draft',date '2025-05-24',
      jsonb_build_object('didactic_version','rspp-aspp-v2','blueprint_key',spec->>'blueprint','total_minutes',(spec->>'minutes')::int,'learning_unit_count',jsonb_array_length(spec->'units'),'dynamic_update',coalesce((spec->>'dynamic')::boolean,false),'publication_gate','Admin/didactic review + final verification configuration'),
      jsonb_build_object('reference','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','attendance_min_pct',90,'delivery_constraint',spec->>'delivery','assessment',spec->>'assessment'))
    on conflict(course_id,version_number) do update set status='draft',syllabus_snapshot=excluded.syllabus_snapshot,normative_snapshot=excluded.normative_snapshot
    returning id into v_cv_id;

    delete from public.course_module_units where module_id in(select id from public.course_modules where course_version_id=v_cv_id);
    delete from public.course_modules where course_version_id=v_cv_id;
    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_cv_id,'program',spec->>'title',1,(spec->>'minutes')::int) returning id into v_mod_id;

    v_pos:=0;
    for u in select value from jsonb_array_elements(spec->'units') loop
      v_pos:=v_pos+1;
      insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
      values('rspp-aspp:'||(spec->>'key')||':'||(u->>0),u->>1,'Unità didattica RSPP/ASPP: '||(u->>1),(u->>2)::int,'rspp_aspp',array['rspp','aspp','asr-2025',spec->>'key'],true,
        jsonb_build_object('didactic_version','rspp-aspp-v2','official_ud',u->>0,'course_key',spec->>'key','internal_didactic_allocation',true,'statutory_per_topic_duration',case when spec->>'key' in('rspp_aspp_a','rspp_c') then true else false end))
      on conflict(stable_key) do update set title=excluded.title,summary=excluded.summary,default_minutes=excluded.default_minutes,source_group=excluded.source_group,tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
      returning id into v_lu_id;

      insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
      values(v_lu_id,1,'published',jsonb_build_object(
        'didactic_version','rspp-aspp-v2','official_ud',u->>0,'title',u->>1,'minutes',(u->>2)::int,
        'summary','Applicare il tema al contesto di lavoro trasformando conoscenze, dati e requisiti in decisioni prevenzionistiche verificabili.',
        'detail','Partire dalle condizioni reali, raccogliere evidenze, esplicitare limiti e incertezze, scegliere metodi coerenti, definire misure secondo gerarchia e verificarne applicazione ed efficacia.',
        'question','Quali evidenze servono per trasformare questo tema in una decisione prevenzionistica verificabile?',
        'procedure',jsonb_build_array('Definisci il contesto','Raccogli evidenze','Individua pericoli ed esposti','Valuta rischio e incertezza','Definisci misure','Assegna responsabilità','Verifica efficacia','Riesamina'),
        'common_errors',jsonb_build_array('Copiare valutazioni standard senza contestualizzazione.','Confondere la presenza del documento con il controllo effettivo del rischio.'),
        'teacher_expansion',jsonb_build_array('Obiettivi e confini','Evidenze e metodo','Caso applicativo','Misure e responsabilità','Debrief e riesame'),
        'final_assessment',false),now())
      on conflict(learning_unit_id,version_number) do update set status='published',content=excluded.content,published_at=coalesce(public.learning_unit_versions.published_at,now());

      select id into v_luv_id from public.learning_unit_versions where learning_unit_id=v_lu_id and version_number=1;
      insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
      values(v_mod_id,v_luv_id,v_pos,true,0,true,jsonb_build_object('didactic_version','rspp-aspp-v2','final_assessment_separate',true));
    end loop;

    -- Final verification requirements only where the Agreement defines a self-contained check.
    if spec->>'key'='rspp_aspp_a' then
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata)
      values(v_cv_id,'final_test','Verifica Modulo A','test',30,3,70,true,'platform_or_external','{"supplementary_interview_allowed":true,"question_bank_complete":false}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='test',minimum_questions=30,minimum_options_per_question=3,passing_score_pct=70,metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    elsif spec->>'key'='rspp_aspp_b' then
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata)
      values(v_cv_id,'final_test','Test Modulo B','test',30,3,70,true,'platform_or_external','{"scope":"common_plus_applicable_specializations","question_bank_complete":false}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='test',minimum_questions=30,minimum_options_per_question=3,passing_score_pct=70,metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,required,completion_mode,metadata)
      values(v_cv_id,'final_simulation','Simulazione Modulo B','simulation',true,'platform_or_external','{"scope":"common_plus_applicable_specializations"}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='simulation',required=true,metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    elsif spec->>'key'='rspp_c' then
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,required,completion_mode,metadata)
      values(v_cv_id,'final_interview','Colloquio individuale Modulo C','interview',true,'external','{"question_bank_complete":false}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='interview',required=true,completion_mode='external',metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    elsif spec->>'key' in('agg_aspp','agg_rspp') then
      insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata)
      values(v_cv_id,'update_verification','Verifica aggiornamento','test_or_interview',10,3,70,true,'platform_or_external','{"in_relation_to_update_subject":true,"question_bank_complete":false}'::jsonb)
      on conflict(course_version_id,requirement_key) do update set verification_mode='test_or_interview',minimum_questions=10,minimum_options_per_question=3,passing_score_pct=70,metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    end if;
  end loop;

  -- 3) B-SP1/2/3/5: courses that reuse the shared sector LU versions already present.
  for spec in select value from jsonb_array_elements($json$
  [
    {"key":"rspp_aspp_bsp1","title":"RSPP/ASPP - B-SP1 Agricoltura, silvicoltura e zootecnia - 16h","minutes":960,"variant":"agricoltura_zootecnia","ateco":"A 01-02","source_course":"dl_spp_agri"},
    {"key":"rspp_aspp_bsp2","title":"RSPP/ASPP - B-SP2 Pesca - 12h","minutes":720,"variant":"pesca","ateco":"A 03","source_course":"dl_spp_pesca"},
    {"key":"rspp_aspp_bsp3","title":"RSPP/ASPP - B-SP3 Costruzioni - 16h","minutes":960,"variant":"costruzioni","ateco":"F","source_course":"dl_spp_costruzioni"},
    {"key":"rspp_aspp_bsp5","title":"RSPP/ASPP - B-SP5 Chimico-petrolchimico - 16h","minutes":960,"variant":"chimico_petrolchimico","ateco":"C 19-20","source_course":"dl_spp_chimico"}
  ]$json$::jsonb)
  loop
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(spec->>'key',spec->>'title','RSPP/ASPP','Modulo B specialistico. Riusa la libreria tecnica di settore condivisa con DL-RSPP quando i contenuti ufficiali coincidono.',(spec->>'minutes')::int,'internal_learning',true,
      jsonb_build_object('blueprint_key','rspp_aspp_bsp','variant_key','bsp'||substring(spec->>'key' from '[0-9]+')||'_'||(spec->>'variant'),'didactic_version','rspp-aspp-v2','ateco_reference',spec->>'ateco','regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','attendance_min_pct',90,'delivery_constraint','physical_or_vcs','assessment','module_b_test_and_simulation','verification_scope','module_b_common_plus_applicable_specializations','shared_sector_learning_units',true,'learner_catalog_hidden',true,'requires_admin_review',true,'final_test_builder_paused',true))
    on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=excluded.nominal_minutes,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course_id;

    insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
    values(v_course_id,1,'draft',date '2025-05-24',jsonb_build_object('didactic_version','rspp-aspp-v2','variant',spec->>'variant','total_minutes',(spec->>'minutes')::int,'shared_sector_learning_units',true,'publication_gate','Admin/didactic review + Module B final verification configuration'),jsonb_build_object('reference','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','attendance_min_pct',90,'delivery','physical_or_vcs','assessment','test_and_simulation'))
    on conflict(course_id,version_number) do update set status='draft',syllabus_snapshot=excluded.syllabus_snapshot,normative_snapshot=excluded.normative_snapshot
    returning id into v_cv_id;

    delete from public.course_module_units where module_id in(select id from public.course_modules where course_version_id=v_cv_id);
    delete from public.course_modules where course_version_id=v_cv_id;
    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_cv_id,'sector',spec->>'title',1,(spec->>'minutes')::int) returning id into v_mod_id;

    v_pos:=0;
    for v_luv_id in
      select cmu.unit_version_id
      from public.courses sc
      join public.course_versions scv on scv.course_id=sc.id and scv.version_number=1
      join public.course_modules scm on scm.course_version_id=scv.id
      join public.course_module_units cmu on cmu.module_id=scm.id
      where sc.stable_key=spec->>'source_course'
      order by scm.position,cmu.position
    loop
      v_pos:=v_pos+1;
      insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
      values(v_mod_id,v_luv_id,v_pos,true,0,true,jsonb_build_object('didactic_version','rspp-aspp-v2','shared_sector_learning_unit',true,'module_b_verification_separate',true));
    end loop;

    if v_pos=0 then raise exception 'No shared sector LU found for %',spec->>'source_course'; end if;
  end loop;
end $do$;
