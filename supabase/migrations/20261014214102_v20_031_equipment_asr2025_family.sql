-- SafetyTraining v20.031
-- Equipment operator qualifications under ASR 17/04/2025, art. 73(5) D.Lgs. 81/08.
-- Physical-presence courses only. Theory checkpoint/test is separate from the practical final verification.

update public.training_blueprints
set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; D.Lgs. 81/2008 art. 73 c.5',
  'delivery_constraint','physical_only','synchronous_video_allowed',false,'asynchronous_elearning_allowed',false,
  'assessment_structure','theory_intermediate_test_plus_practical_final',
  'theory_test_passing_score_pct',70,'renewal_interval_months',60,
  'update_minimum_minutes',240,'update_practical_minutes',240,'master_registry_version',4),updated_at=now()
where stable_key='equipment_initial';

update public.training_blueprints
set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; D.Lgs. 81/2008 art. 73 c.5',
  'minimum_minutes',240,'practical_minutes',240,'delivery_constraint','physical_only',
  'synchronous_video_allowed',false,'asynchronous_elearning_allowed',false,
  'assessment','practical_and_interview','renewal_interval_months',60,'master_registry_version',4),updated_at=now()
where stable_key='equipment_update';

update public.training_blueprint_sections
set metadata=metadata||'{"duration_from_variant":true,"delivery":"physical","theory_intermediate_test_required":true,"passing_score_pct":70}'::jsonb,updated_at=now()
where blueprint_key='equipment_initial' and section_key in ('equipment_common','equipment_specific');
update public.training_blueprint_sections
set metadata=metadata||'{"duration_from_variant":true,"delivery":"physical","not_completed_digitally":true,"practical_final_required":true}'::jsonb,updated_at=now()
where blueprint_key='equipment_initial' and section_key='equipment_practice';
update public.training_blueprint_sections
set nominal_minutes=0,required=false,metadata=metadata||'{"legacy_theory_section":true,"not_part_of_regulatory_update_minimum":true}'::jsonb,updated_at=now()
where blueprint_key='equipment_update' and section_key='equipment_update_theory';
update public.training_blueprint_sections
set nominal_minutes=240,practical=true,metadata=metadata||'{"regulatory":true,"delivery":"physical","not_completed_digitally":true}'::jsonb,updated_at=now()
where blueprint_key='equipment_update' and section_key='equipment_practice';

insert into public.training_blueprint_rules(blueprint_key,rule_key,rule_type,priority,conditions,outcome,source,notes) values
('equipment_initial','delivery_initial','delivery',5,'{}','{"allowed":["physical"],"synchronous_video":false,"asynchronous_elearning":false}','ASR 17/04/2025','Equipment operator qualification courses are delivered in physical presence.'),
('equipment_initial','theory_intermediate_test','assessment',10,'{}','{"mode":"test","stage":"after_theory_before_practice","passing_score_pct":70,"propedeutic_to_practice":true}','ASR 17/04/2025','The theoretical-technical module ends with an intermediate multiple-choice test.'),
('equipment_initial','practical_final','assessment',20,'{}','{"mode":"practical","stage":"final","external_validation":true}','ASR 17/04/2025','Final verification is practical and follows the equipment-specific exercises.'),
('equipment_initial','renewal_cycle','renewal',30,'{}','{"update_blueprint":"equipment_update","interval_months":60,"minimum_minutes":240,"practical_minutes":240}','ASR 17/04/2025',null),
('equipment_update','delivery_update','delivery',5,'{}','{"allowed":["physical"],"synchronous_video":false,"asynchronous_elearning":false}','ASR 17/04/2025',null),
('equipment_update','practical_update','practical',10,'{}','{"minimum_minutes":240,"practical_minutes":240,"digital_completion":false}','ASR 17/04/2025',null),
('equipment_update','final_verification','assessment',20,'{}','{"mode":"practical_and_interview","practical_required":true,"interview_required":true}','ASR 17/04/2025',null)
on conflict (blueprint_key,rule_key) do update set rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":360,"total_minutes":600,"practice_scope":"PLE con e senza stabilizzatori","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='ple';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":480,"total_minutes":720,"practice_scope":"gru per autocarro","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='gru_autocarro';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":480,"practical_minutes":360,"total_minutes":840,"practice_scope":"gru a torre rotazione in basso e in alto","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='gru_torre';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":480,"practical_minutes":240,"total_minutes":720,"practice_scope":"carrelli industriali semoventi","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='carrelli_ind';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":480,"practical_minutes":480,"total_minutes":960,"practice_scope":"industriali + telescopici + telescopici rotativi","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='carrelli_all';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":180,"practical_minutes":300,"total_minutes":480,"practice_scope":"one_selected_subtype","allowed_subtypes":["ruote","cingoli"],"requires_subtype_selection":true,"covers_both_subtypes":false,"regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='trattori';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":360,"total_minutes":600,"practice_scope":"escavatore idraulico","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='mmt_esc';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":720,"total_minutes":960,"practice_scope":"escavatori idraulici + caricatori frontali + terne","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='mmt_all';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":420,"practical_minutes":420,"total_minutes":840,"practice_scope":"pompe per calcestruzzo","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='pompe';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":240,"total_minutes":480,"practice_scope":"macchina agricola raccoglifrutta CRF","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='crf';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":240,"total_minutes":480,"practice_scope":"caricatore movimentazione materiali CMM","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='cmm';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":360,"total_minutes":600,"practice_scope":"una tipologia comando: cabina oppure pensile/radiocomando","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='carroponte_10h';
update public.training_blueprint_variants set status='partial',metadata=metadata||'{"theory_minutes":240,"practical_minutes":420,"total_minutes":660,"practice_scope":"tutte le tipologie comando","regulatory_split":true}'::jsonb,updated_at=now() where blueprint_key='equipment_initial' and variant_key='carroponte_all_11h';

update public.training_blueprint_variants
set status='partial',metadata=metadata||jsonb_build_object('theory_minutes',0,'practical_minutes',240,'total_minutes',240,'renewal_interval_months',60,'regulatory_split',true,'assessment','practical_and_interview'),updated_at=now()
where blueprint_key='equipment_update';

insert into public.training_blueprint_rules(blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes)
values('equipment_initial','tractor_subtype_required','trattori','eligibility',8,'{"variant":"trattori"}','{"require_one_of":["ruote","cingoli"],"covers_both":false}','ASR 17/04/2025','The 8h legacy course consists of 3h theory plus 5h practical for one selected tractor subtype.')
on conflict (blueprint_key,rule_key) do update set variant_key=excluded.variant_key,rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

do $do$
declare r record; i integer; v_lu uuid; v_ver uuid; v_q uuid; v_key text; v_title text; v_summary text; v_content jsonb;
begin
  for r in select * from (values
    ('ple',array['Categorie, componenti e caratteristiche delle PLE','Dispositivi di comando, sicurezza e DPI','Rischi, controlli e utilizzo in sicurezza','Procedure operative e salvataggio in emergenza']::text[]),
    ('gru_autocarro',array['Tipologie, componenti e organi di presa','Fisica, stabilità e tabelle di carico','Comandi, limitatori e controlli pre-utilizzo','Posizionamento, uso sicuro e segnaletica gestuale']::text[]),
    ('gru_torre',array['Ruolo dell’operatore e norme di utilizzo','Tipologie e rischi della gru a torre','Fisica dei carichi e condizioni di equilibrio','Tecnologia, meccanismi e componenti strutturali','Comandi, dispositivi di sicurezza e limitatori','Diagrammi di carico e ausili alla conduzione','Installazione, ancoraggi e controlli pre-utilizzo','Uso in sicurezza, interferenze e segnaletica gestuale']::text[]),
    ('carrelli',array['Tipologie di carrelli e principali rischi','Fisica dei carichi, baricentro e stabilità','Componenti, montanti e organi di presa','Fonti di energia, batterie e sistemi di ricarica','Comandi, freni e dispositivi di sicurezza','Portata, targhette, diagrammi e condizioni di equilibrio','Regole di circolazione e utilizzo in sicurezza','Controlli, manutenzione e procedure operative']::text[]),
    ('trattori',array['Categorie, componenti e macchine operatrici','Comandi, sicurezza, DPI e controlli','Rischi, stabilità e utilizzo in sicurezza']::text[]),
    ('mmt',array['Categorie e componenti delle macchine movimento terra','Comandi, dispositivi di sicurezza e controlli','Rischi, stabilità e procedure di utilizzo','Configurazioni di lavoro, sollevamento e agenti fisici']::text[]),
    ('pompe',array['Categorie e componenti delle pompe per calcestruzzo','Comandi, sicurezza e controlli pre-utilizzo','Rischi, posizionamento e stabilizzazione','Trasferimento su strada e accesso al cantiere','Allestimento, tubazioni e sito di scarico','Pompaggio, braccio e gestione delle interferenze','Pulizia, manutenzione e messa a riposo']::text[]),
    ('crf',array['Categorie e componenti dei carri raccoglifrutta','Comandi, sicurezza, stabilità e controlli','Rischi e utilizzo operativo in sicurezza','Procedure di emergenza, ricarica e messa a riposo']::text[]),
    ('cmm',array['Terminologia, tipologie e principali rischi dei CMM','Fisica, stabilità, componenti e organi di presa','Comandi, sicurezza, documentazione e diagrammi di carico','Segnaletica gestuale, controlli e utilizzo operativo']::text[]),
    ('carroponte',array['Tipologie, fisica e componenti del carroponte','Comandi, dispositivi di sicurezza ed equipaggiamenti','Rischi, DPI, documentazione e verifiche','Imbracatura, movimentazione, segnaletica e controlli']::text[])
  ) t(family_key,topics)
  loop
    for i in 1..array_length(r.topics,1) loop
      v_key := 'equipment:'||r.family_key||':theory:'||lpad(i::text,2,'0');
      v_title := r.topics[i];
      v_summary := 'Conoscere e applicare gli elementi teorico-tecnici relativi a: '||lower(r.topics[i])||'.';
      v_content := jsonb_build_object('id',r.family_key||'-'||i,'title',v_title,'slide_title',v_title,'summary',v_summary,
        'detail',v_summary||' L’unità è parte del modulo teorico-tecnico e non sostituisce l’addestramento pratico sull’attrezzatura.',
        'norm','Accordo Stato-Regioni 17/04/2025 - art. 73 c.5 D.Lgs. 81/08','minutes',60,'icon','🏗️','visual','equipment-training',
        'teacher','Collegare sempre teoria, manuale del costruttore, controlli e situazioni operative reali.',
        'quality',jsonb_build_object('version','v20.031','checkpoint_only',true,'final_assessment',false),
        'scope',jsonb_build_object('equipment_family',r.family_key,'physical_course_only',true,'practical_component_separate',true));
      insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
      values(v_key,v_title,v_summary,60,'attrezzature_asr2025',array['asr2025','equipment',r.family_key,'theory'],true,
        jsonb_build_object('regulatory_basis','ASR 17/04/2025','equipment_family',r.family_key,'created_by_migration','v20_031'))
      on conflict(stable_key) do update set title=excluded.title,summary=excluded.summary,default_minutes=60,source_group='attrezzature_asr2025',tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
      returning id into v_lu;
      select id into v_ver from public.learning_unit_versions where learning_unit_id=v_lu and version_number=1 limit 1;
      if v_ver is null then
        insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at) values(v_lu,1,'published',v_content,now()) returning id into v_ver;
      else
        update public.learning_unit_versions set status='published',content=v_content,published_at=coalesce(published_at,now()) where id=v_ver;
      end if;
      insert into public.questions(stable_key,unit_version_id,prompt,question_type,options,public_explanation,active,metadata)
      values(v_key||':checkpoint',v_ver,'Quale principio è coerente con questa unità teorico-tecnica?','single_choice',
        jsonb_build_array(jsonb_build_object('id','0','label',v_summary),jsonb_build_object('id','1','label','La pratica può essere sostituita dal solo studio teorico.'),jsonb_build_object('id','2','label','I controlli e le indicazioni del costruttore non incidono sull’uso sicuro.')),
        v_summary,true,jsonb_build_object('assignment',jsonb_build_object('purpose','checkpoint','required',true),'not_theory_intermediate_test',true,'created_by_migration','v20_031'))
      on conflict(stable_key) do update set unit_version_id=excluded.unit_version_id,prompt=excluded.prompt,options=excluded.options,public_explanation=excluded.public_explanation,active=true,metadata=public.questions.metadata||excluded.metadata,updated_at=now()
      returning id into v_q;
      insert into public.question_answer_keys(question_id,answer_key,explanation_private)
      values(v_q,jsonb_build_object('correct_answer',jsonb_build_object('option_id','0')),v_summary)
      on conflict(question_id) do update set answer_key=excluded.answer_key,explanation_private=excluded.explanation_private,updated_at=now();
    end loop;
  end loop;
end $do$;

do $do$
declare r record; v_course uuid; v_cv uuid; v_mod uuid; v_luv uuid; i integer; v_key text;
begin
  for r in select * from (values
    ('attr_ple','ple','ple',240,360,'PLE con e senza stabilizzatori'),
    ('attr_gru_autocarro','gru_autocarro','gru_autocarro',240,480,'gru per autocarro'),
    ('attr_gru_torre','gru_torre','gru_torre',480,360,'gru a torre rotazione in basso e in alto'),
    ('attr_carrelli_ind','carrelli_ind','carrelli',480,240,'carrelli industriali semoventi'),
    ('attr_carrelli_all','carrelli_all','carrelli',480,480,'carrelli industriali, telescopici e telescopici rotativi'),
    ('attr_trattori','trattori','trattori',180,300,'trattore: sottotipo ruote oppure cingoli da selezionare'),
    ('attr_mmt_esc','mmt_esc','mmt',240,360,'escavatore idraulico'),
    ('attr_mmt_all','mmt_all','mmt',240,720,'escavatori idraulici, caricatori frontali e terne'),
    ('attr_pompe','pompe','pompe',420,420,'pompe per calcestruzzo'),
    ('attr_crf','crf','crf',240,240,'macchina agricola raccoglifrutta CRF'),
    ('attr_cmm','cmm','cmm',240,240,'caricatore movimentazione materiali CMM'),
    ('attr_carroponte_10h','carroponte_10h','carroponte',240,360,'una tipologia di comando'),
    ('attr_carroponte_all_11h','carroponte_all_11h','carroponte',240,420,'tutte le tipologie di comando')
  ) t(code,variant_key,theory_family,theory_minutes,practical_minutes,practice_scope)
  loop
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    select c.external_course_code,c.title,'Attrezzature','Abilitazione attrezzatura ASR 2025: modulo teorico-tecnico con verifica intermedia e modulo pratico con verifica finale.',c.nominal_minutes,'internal_learning',true,
      jsonb_build_object('blueprint_key','equipment_initial','variant_key',r.variant_key,'composition_version','v20_031','delivery_constraint','physical_only','theory_minutes',r.theory_minutes,'practical_minutes',r.practical_minutes,'practice_scope',r.practice_scope,'requires_admin_review',true,'learner_catalog_hidden',true,'question_bank_complete',false)
    from public.integration_course_catalog c where c.source_system='safetymanager' and c.external_course_code=r.code
    on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=excluded.nominal_minutes,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course;

    select id into v_cv from public.course_versions where course_id=v_course and version_number=1 limit 1;
    if v_cv is null then
      insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
      values(v_course,1,'draft',date '2025-05-24',jsonb_build_object('source','v20_031','blueprint_key','equipment_initial','variant_key',r.variant_key,'theory_minutes',r.theory_minutes,'practical_minutes',r.practical_minutes),jsonb_build_object('reference','ASR 17/04/2025 - art.73 c.5 D.Lgs.81/08','delivery_constraint','physical_only','publication_gate','Admin review + complete theory test + practical validation')) returning id into v_cv;
    end if;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_cv,'equipment_theory','Modulo teorico-tecnico',1,r.theory_minutes)
    on conflict(course_version_id,module_key) do update set title=excluded.title,position=1,nominal_minutes=excluded.nominal_minutes returning id into v_mod;

    for i in 1..(r.theory_minutes/60) loop
      v_key:='equipment:'||r.theory_family||':theory:'||lpad(i::text,2,'0');
      select luv.id into v_luv from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published' where lu.stable_key=v_key order by luv.version_number desc limit 1;
      if v_luv is null then raise exception 'Missing equipment theory LU %',v_key; end if;
      insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
      values(v_mod,v_luv,i,true,2160,true,'{"checkpoint_only":true,"theory_intermediate_test_separate":true,"practical_final_separate":true,"delivery":"physical"}'::jsonb)
      on conflict(module_id,unit_version_id) do update set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,requires_comprehension=true,completion_rules=public.course_module_units.completion_rules||excluded.completion_rules;
    end loop;

    insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
    values(v_course,'equipment_practice','Modulo pratico - '||r.practice_scope,r.practical_minutes,true,'external_presence',jsonb_build_object('regulatory',true,'delivery','physical','practice_scope',r.practice_scope,'validation_required',true,'variant_key',r.variant_key))
    on conflict(course_id,requirement_key) do update set title=excluded.title,nominal_minutes=excluded.nominal_minutes,required=true,completion_mode='external_presence',metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();

    insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,passing_score_pct,required,completion_mode,metadata)
    values(v_cv,'theory_intermediate','Verifica intermedia modulo teorico-tecnico','test',70,true,'platform_or_external','{"propedeutic_to_practice":true,"question_count_not_hardcoded":true,"regulatory_basis":"ASR 17/04/2025"}'::jsonb)
    on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode='test',passing_score_pct=70,required=true,completion_mode='platform_or_external',metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,required,completion_mode,metadata)
    values(v_cv,'practical_final','Verifica pratica finale','practical',true,'external',jsonb_build_object('practice_scope',r.practice_scope,'regulatory_basis','ASR 17/04/2025'))
    on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode='practical',required=true,completion_mode='external',metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();

    insert into public.integration_course_mappings(source_system,external_course_code,course_id,active,metadata)
    values('safetymanager',r.code,v_course,true,jsonb_build_object('blueprint','equipment_initial','variant_key',r.variant_key,'composition_version','v20_031'))
    on conflict(source_system,external_course_code) do update set course_id=excluded.course_id,active=true,metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();
    update public.integration_course_catalog set mapped_course_id=v_course,delivery_status='needs_configuration',metadata=metadata||jsonb_build_object('composition_version','v20_031','delivery_constraint','physical_only','theory_minutes',r.theory_minutes,'practical_minutes',r.practical_minutes,'question_bank_complete',false,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.code;
    update public.training_blueprint_course_types set development_status='partial',metadata=metadata||jsonb_build_object('composition_version','v20_031','delivery_constraint','physical_only','theory_minutes',r.theory_minutes,'practical_minutes',r.practical_minutes,'question_bank_complete',false,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.code;
  end loop;
end $do$;

do $do$
declare r record; v_course uuid; v_cv uuid;
begin
  for r in
    select c.external_course_code,c.title,c.nominal_minutes,m.variant_key
    from public.integration_course_catalog c
    join public.training_blueprint_course_types m on m.source_system=c.source_system and m.external_course_code=c.external_course_code
    where c.source_system='safetymanager' and m.blueprint_key='equipment_update'
  loop
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(r.external_course_code,r.title,'Attrezzature','Aggiornamento quinquennale abilitazione attrezzatura: almeno 4 ore relative alla parte pratica, in presenza.',240,'internal_learning',true,
      jsonb_build_object('blueprint_key','equipment_update','variant_key',r.variant_key,'composition_version','v20_031','delivery_constraint','physical_only','theory_minutes',0,'practical_minutes',240,'requires_admin_review',true,'learner_catalog_hidden',true))
    on conflict(stable_key) do update set title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=240,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course;
    select id into v_cv from public.course_versions where course_id=v_course and version_number=1 limit 1;
    if v_cv is null then
      insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
      values(v_course,1,'draft',date '2025-05-24',jsonb_build_object('source','v20_031','blueprint_key','equipment_update','variant_key',r.variant_key,'practical_minutes',240),jsonb_build_object('reference','ASR 17/04/2025','renewal_interval_months',60,'delivery_constraint','physical_only','verification','practical_and_interview')) returning id into v_cv;
    end if;
    insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
    values(v_course,'equipment_update_practice','Aggiornamento pratico attrezzatura',240,true,'external_presence',jsonb_build_object('regulatory',true,'delivery','physical','validation_required',true,'variant_key',r.variant_key))
    on conflict(course_id,requirement_key) do update set title=excluded.title,nominal_minutes=240,required=true,completion_mode='external_presence',metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();
    insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,required,completion_mode,metadata)
    values(v_cv,'final_verification','Verifica aggiornamento: prova pratica e colloquio','practical_and_interview',true,'external',jsonb_build_object('regulatory_basis','ASR 17/04/2025'))
    on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode='practical_and_interview',required=true,completion_mode='external',metadata=public.course_verification_requirements.metadata||excluded.metadata,updated_at=now();
    insert into public.integration_course_mappings(source_system,external_course_code,course_id,active,metadata)
    values('safetymanager',r.external_course_code,v_course,true,jsonb_build_object('blueprint','equipment_update','variant_key',r.variant_key,'composition_version','v20_031'))
    on conflict(source_system,external_course_code) do update set course_id=excluded.course_id,active=true,metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();
    update public.integration_course_catalog set mapped_course_id=v_course,delivery_status='needs_configuration',metadata=metadata||jsonb_build_object('composition_version','v20_031','delivery_constraint','physical_only','practical_minutes',240,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.external_course_code;
    update public.training_blueprint_course_types set development_status='partial',metadata=metadata||jsonb_build_object('composition_version','v20_031','delivery_constraint','physical_only','practical_minutes',240,'requires_admin_review',true),updated_at=now() where source_system='safetymanager' and external_course_code=r.external_course_code;
  end loop;
end $do$;
