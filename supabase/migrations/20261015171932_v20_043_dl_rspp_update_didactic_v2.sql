-- SafetyTraining v20.043
-- Aggiornamento DL-RSPP: minimo 8h ogni 5 anni dalla conclusione del modulo comune.
-- Se permangono le condizioni dei moduli specialistici, l'aggiornamento comprende anche tali tematiche.
-- 8 LU da 60 minuti = microprogettazione interna, non ripartizione normativa prescritta.

do $do$
declare
  r record;
  v_lu_id uuid;
  v_course_id uuid;
  v_course_version_id uuid;
  v_module_id uuid;
begin
  for r in select * from (values
    ('agg-dl-rspp:novita-cambiamenti','ADLR01 · Novità normative, tecniche e organizzative',60),
    ('agg-dl-rspp:riesame-dvr','ADLR02 · Riesame DVR, criteri e rischi emergenti',60),
    ('agg-dl-rspp:eventi-indicatori','ADLR03 · Infortuni, near miss, audit e indicatori',60),
    ('agg-dl-rspp:metodi-approfondimenti','ADLR04 · Metodi, misurazioni e approfondimenti specialistici',60),
    ('agg-dl-rspp:efficacia-misure','ADLR05 · Efficacia delle misure, DPI e manutenzione',60),
    ('agg-dl-rspp:ruoli-competenze','ADLR06 · Ruoli, competenze, formazione e coordinamento',60),
    ('agg-dl-rspp:settori-applicabili','ADLR07 · Tematiche specialistiche ancora applicabili',60),
    ('agg-dl-rspp:riesame-finale','ADLR08 · Piano di miglioramento e riesame finale',60)
  ) x(stable_key,title,minutes)
  loop
    insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    values(r.stable_key,r.title,'Aggiornamento quinquennale DL-RSPP basato su cambiamenti, evidenze, efficacia delle misure e compiti attuali.',r.minutes,'agg_dl_rspp',array['dl-rspp','update','asr-2025'],true,
      jsonb_build_object('didactic_version','agg-dl-rspp-v2','dynamic_update',true,'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte III','internal_didactic_allocation',true,'statutory_per_topic_duration',false))
    on conflict (stable_key) do update set title=excluded.title,summary=excluded.summary,default_minutes=excluded.default_minutes,source_group=excluded.source_group,tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
    returning id into v_lu_id;

    insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
    values(v_lu_id,1,'published',jsonb_build_object('didactic_version','agg-dl-rspp-v2','title',r.title,'minutes',r.minutes,'dynamic_update',true,'summary','Il docente usa dati e cambiamenti del quinquennio per costruire un aggiornamento pertinente ai compiti effettivi del DL-RSPP.','procedure',jsonb_build_array('Raccogli cambiamenti ed evidenze','Individua scostamenti','Valuta impatto','Definisci priorità','Assegna azioni','Verifica efficacia'),'final_assessment',false),now())
    on conflict (learning_unit_id,version_number) do update set status='published',content=excluded.content,published_at=coalesce(public.learning_unit_versions.published_at,now());
  end loop;

  select id into v_course_id from public.courses where stable_key='agg_dl_spp';
  if v_course_id is not null then
    update public.courses set metadata=metadata||jsonb_build_object(
      'didactic_preview_version','agg-dl-rspp-v2','didactic_atomic_units',8,'didactic_macro_blocks',2,
      'minimum_minutes',480,'renewal_interval_months',60,'renewal_anchor','completion_of_dl_spp_common_module',
      'dynamic_update',true,'include_sector_topics_when_still_applicable',true,
      'sector_topic_resolution','derive_from_completed_specialist_modules_and_current_applicability',
      'requires_admin_review',true,'learner_catalog_hidden',true,
      'final_test_builder_paused',true,'internal_didactic_allocation',true,'statutory_per_topic_duration',false
    ),updated_at=now() where id=v_course_id;

    insert into public.course_versions(course_id,version_number,status,syllabus_snapshot,normative_snapshot)
    values(v_course_id,2,'draft',
      jsonb_build_object('didactic_version','agg-dl-rspp-v2','purpose','quinquennial_contextual_update','total_minutes',480,'atomic_learning_units',8,'macro_blocks',jsonb_build_array(jsonb_build_object('key','adlr-a','title','Cambiamenti, valutazione e performance','minutes',240),jsonb_build_object('key','adlr-b','title','Misure, competenze, settori e riesame','minutes',240)),'dynamic_update',true,'include_sector_topics_when_still_applicable',true,'internal_didactic_allocation',true,'statutory_per_module_duration',false,'final_assessment_in_scope',false),
      jsonb_build_object('basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte III','minimum_minutes',480,'renewal_interval_months',60,'renewal_anchor','completion_of_common_module','sector_rule','if specialist modules were attended and conditions still apply, update must include those topics'))
    on conflict (course_id,version_number) do update set status='draft',syllabus_snapshot=excluded.syllabus_snapshot,normative_snapshot=excluded.normative_snapshot
    returning id into v_course_version_id;

    delete from public.course_module_units where module_id in (select id from public.course_modules where course_version_id=v_course_version_id);
    delete from public.course_modules where course_version_id=v_course_version_id;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'adlr-a','ADLR-A · Cambiamenti, valutazione e performance',0,240) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,jsonb_build_object('didactic_version','agg-dl-rspp-v2','dynamic_update',true)
    from (values ('agg-dl-rspp:novita-cambiamenti',1),('agg-dl-rspp:riesame-dvr',2),('agg-dl-rspp:eventi-indicatori',3),('agg-dl-rspp:metodi-approfondimenti',4)) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'adlr-b','ADLR-B · Misure, competenze, settori e riesame',240,240) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,jsonb_build_object('didactic_version','agg-dl-rspp-v2','dynamic_update',true,'sector_conditional',x.key='agg-dl-rspp:settori-applicabili')
    from (values ('agg-dl-rspp:efficacia-misure',1),('agg-dl-rspp:ruoli-competenze',2),('agg-dl-rspp:settori-applicabili',3),('agg-dl-rspp:riesame-finale',4)) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1;
  end if;

  update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
    'didactic_version','agg-dl-rspp-v2','didactic_atomic_units',8,'minimum_minutes',480,'renewal_interval_months',60,
    'renewal_anchor','completion_of_dl_spp_common_module','dynamic_update',true,
    'include_sector_topics_when_still_applicable',true,'publication_blocked',true,
    'block_reason','final_verification_and_admin_review_pending'
  ),updated_at=now() where stable_key='dl_spp_update';
end
$do$;
