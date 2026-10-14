-- SafetyTraining v20.029
-- Materialize ASR 17/04/2025 role courses from the reusable ruoli_asr2025 Learning Unit library.
-- Initial role courses are composed; updates remain dynamic and require admin/didactic review.

do $do$
declare
  r record;
  v_course_id uuid;
  v_version_id uuid;
  v_module_id uuid;
  v_luv_id uuid;
  v_key text;
  v_pos integer;
  v_question_min integer;
begin
  for r in select * from (values
    ('preposto','Preposto - 12h','Ruoli della prevenzione',720,'preposto_initial',false,
      array['roles:shared:legislative-system','roles:shared:prevention-actors','roles:shared:responsibilities-delegation','roles:shared:institutional-system','roles:preposto:role-effectiveness','roles:preposto:supervision-control','roles:preposto:nonconformity-interruption','roles:preposto:communication-workers','roles:preposto:risk-context','roles:preposto:contracts-interference','roles:preposto:incident-near-miss','roles:preposto:cooperation']::text[], 'synchronous_or_classroom'),
    ('dirigente','Dirigente - 12h','Ruoli della prevenzione',720,'dirigente_initial',false,
      array['roles:shared:legislative-system','roles:shared:prevention-actors','roles:shared:responsibilities-delegation','roles:shared:institutional-system','roles:dirigente:role-obligations','roles:dirigente:organization-processes','roles:dirigente:models-sgsl','roles:dirigente:risk-context-directives','roles:dirigente:contracts-subcontracts','roles:dirigente:emergency-organization','roles:dirigente:training-consultation','roles:dirigente:leadership-conflict']::text[], 'elearning_asynchronous_allowed'),
    ('dl_base','Datore di lavoro - 16h','Datore di lavoro',960,'employer_initial',false,
      array['roles:shared:legislative-system','roles:shared:prevention-actors','roles:shared:responsibilities-delegation','roles:shared:institutional-system','roles:employer:role-context','roles:employer:legal-liability','roles:employer:231','roles:employer:violence-inclusion','roles:employer:inspection-bodies','roles:employer:technical-standards','roles:employer:risk-assessment-governance','roles:employer:collective-priority','roles:employer:duvri-contracts','roles:employer:health-emergency-training','roles:employer:monitoring-procedures','roles:employer:mog-costs-communication']::text[], 'elearning_asynchronous_allowed'),
    ('dl_spp_comune','Datore di lavoro che svolge direttamente i compiti SPP - Modulo comune 8h','DL SPP / RSPP Datore di lavoro',480,'dl_spp_common',false,
      array['roles:dlspp:evaluation-methods','roles:dlspp:dvr-structure','roles:dlspp:near-miss-analysis','roles:dlspp:technical-admin-docs','roles:dlspp:risk-factors-workplace-equipment','roles:dlspp:agents-hazards','roles:dlspp:psychosocial-differences','roles:dlspp:controls-ppe-signage']::text[], 'synchronous_or_classroom'),
    ('mod_cantieri','Modulo cantieri - 6h','Datore di lavoro',360,'employer_construction_addon',false,
      array['roles:cantiere:subjects-obligations','roles:cantiere:plans-psc-pos','roles:cantiere:art95-art96','roles:cantiere:cronoprogramma','roles:cantiere:condition-verification','roles:cantiere:pos-analysis-coordination']::text[], 'elearning_asynchronous_allowed'),
    ('agg_prep','Aggiornamento Preposto - 6h','Ruoli della prevenzione',360,'preposto_update',true,array[]::text[],'synchronous_or_classroom'),
    ('agg_dir','Aggiornamento Dirigente - 6h','Ruoli della prevenzione',360,'dirigente_update',true,array[]::text[],'elearning_asynchronous_allowed'),
    ('agg_dl','Aggiornamento Datore di lavoro - 6h','Datore di lavoro',360,'employer_update',true,array[]::text[],'elearning_asynchronous_allowed'),
    ('agg_dl_spp','Aggiornamento Datore di lavoro che svolge direttamente i compiti SPP - 8h','DL SPP / RSPP Datore di lavoro',480,'dl_spp_update',true,array[]::text[],'elearning_asynchronous_allowed')
  ) t(code,title,family,minutes,blueprint_key,is_update,unit_keys,delivery_constraint)
  loop
    v_question_min := case when r.is_update then 10 else 30 end;

    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(
      r.code,r.title,r.family,
      case when r.is_update then
        'Percorso di aggiornamento dinamico: contenuti selezionati in base a evoluzioni normative, tecniche, organizzative e fabbisogni formativi. Richiede revisione didattica prima della pubblicazione.'
      else
        'Percorso composto dalla libreria Learning Unit ASR 2025. La suddivisione interna in LU è didattica; durata complessiva, modalità e verifica finale seguono il Master Registry.' end,
      r.minutes,'internal_learning',true,
      jsonb_build_object(
        'blueprint_key',r.blueprint_key,
        'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
        'delivery_constraint',r.delivery_constraint,
        'final_verification','test_or_interview',
        'test_min_questions',v_question_min,
        'test_min_options',3,
        'test_passing_score_pct',70,
        'requires_admin_review',true,
        'learner_catalog_hidden',true,
        'dynamic_update',r.is_update,
        'composition_version','v20_029',
        'internal_didactic_allocation',true,
        'statutory_per_topic_duration',false
      )
    )
    on conflict (stable_key) do update set
      title=excluded.title,
      family=excluded.family,
      description=excluded.description,
      nominal_minutes=excluded.nominal_minutes,
      active=true,
      metadata=public.courses.metadata||excluded.metadata,
      updated_at=now()
    returning id into v_course_id;

    select id into v_version_id
    from public.course_versions
    where course_id=v_course_id and version_number=1
    limit 1;

    if v_version_id is null then
      insert into public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot)
      values(
        v_course_id,1,'draft',date '2025-05-24',
        jsonb_build_object(
          'source','v20_029','blueprint_key',r.blueprint_key,'nominal_minutes',r.minutes,
          'learning_unit_count',coalesce(array_length(r.unit_keys,1),0),
          'dynamic_update',r.is_update,
          'publication_gate','Admin/didactic review + final verification configuration'
        ),
        jsonb_build_object(
          'reference','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
          'published_in_gu','24/05/2025',
          'delivery_constraint',r.delivery_constraint,
          'verification_mode','test_or_interview',
          'test_min_questions',v_question_min,
          'test_min_options',3,
          'passing_score_pct',70
        )
      ) returning id into v_version_id;
    else
      update public.course_versions
      set syllabus_snapshot=syllabus_snapshot||jsonb_build_object(
            'source','v20_029','blueprint_key',r.blueprint_key,'nominal_minutes',r.minutes,
            'learning_unit_count',coalesce(array_length(r.unit_keys,1),0),
            'dynamic_update',r.is_update,
            'publication_gate','Admin/didactic review + final verification configuration'),
          normative_snapshot=normative_snapshot||jsonb_build_object(
            'reference','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
            'published_in_gu','24/05/2025',
            'delivery_constraint',r.delivery_constraint,
            'verification_mode','test_or_interview',
            'test_min_questions',v_question_min,
            'test_min_options',3,
            'passing_score_pct',70)
      where id=v_version_id and status='draft';
    end if;

    insert into public.course_verification_requirements(
      course_version_id,requirement_key,title,verification_mode,minimum_questions,
      minimum_options_per_question,passing_score_pct,required,completion_mode,metadata)
    values(
      v_version_id,'final_learning_verification','Verifica finale di apprendimento',
      'test_or_interview',v_question_min,3,70,true,'platform_or_external',
      jsonb_build_object(
        'regulatory_basis','ASR 17/04/2025',
        'interview_alternative_allowed',true,
        'platform_test_requires_complete_question_bank',true,
        'composition_version','v20_029')
    )
    on conflict (course_version_id,requirement_key) do update set
      title=excluded.title,
      verification_mode=excluded.verification_mode,
      minimum_questions=excluded.minimum_questions,
      minimum_options_per_question=excluded.minimum_options_per_question,
      passing_score_pct=excluded.passing_score_pct,
      required=true,
      completion_mode=excluded.completion_mode,
      metadata=public.course_verification_requirements.metadata||excluded.metadata,
      updated_at=now();

    if r.is_update then
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values(v_version_id,'dynamic_update','Aggiornamento contestualizzato',1,r.minutes)
      on conflict (course_version_id,module_key) do update
      set title=excluded.title,position=1,nominal_minutes=excluded.nominal_minutes
      returning id into v_module_id;
    else
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values(v_version_id,'role_program','Programma formativo',1,r.minutes)
      on conflict (course_version_id,module_key) do update
      set title=excluded.title,position=1,nominal_minutes=excluded.nominal_minutes
      returning id into v_module_id;

      v_pos := 0;
      foreach v_key in array r.unit_keys loop
        v_pos := v_pos + 1;
        select luv.id into v_luv_id
        from public.learning_units lu
        join public.learning_unit_versions luv
          on luv.learning_unit_id=lu.id and luv.status='published'
        where lu.stable_key=v_key and lu.active
        order by luv.version_number desc
        limit 1;

        if v_luv_id is null then
          raise exception 'Missing published Learning Unit % for course %', v_key, r.code;
        end if;

        insert into public.course_module_units(
          module_id,unit_version_id,position,required,min_active_seconds,
          requires_comprehension,completion_rules)
        values(
          v_module_id,v_luv_id,v_pos,true,2160,true,
          jsonb_build_object(
            'source','v20_029','blueprint_key',r.blueprint_key,
            'checkpoint_only',true,'final_assessment_separate',true))
        on conflict (module_id,unit_version_id) do update set
          position=excluded.position,
          required=true,
          min_active_seconds=excluded.min_active_seconds,
          requires_comprehension=true,
          completion_rules=public.course_module_units.completion_rules||excluded.completion_rules;
      end loop;
    end if;

    insert into public.integration_course_mappings(
      source_system,external_course_code,course_id,active,metadata)
    values(
      'safetymanager',r.code,v_course_id,true,
      jsonb_build_object(
        'blueprint',r.blueprint_key,
        'composition_version','v20_029',
        'regulatory_basis','ASR 17/04/2025'))
    on conflict (source_system,external_course_code) do update set
      course_id=excluded.course_id,
      active=true,
      metadata=public.integration_course_mappings.metadata||excluded.metadata,
      updated_at=now();

    update public.integration_course_catalog
    set mapped_course_id=v_course_id,
        delivery_status='needs_configuration',
        metadata=metadata||jsonb_build_object(
          'mapped_course_key',r.code,
          'composition_version','v20_029',
          'delivery_constraint',r.delivery_constraint,
          'final_verification_separate',true,
          'question_bank_complete',false,
          'requires_admin_review',true),
        updated_at=now()
    where source_system='safetymanager' and external_course_code=r.code;

    update public.training_blueprint_course_types
    set development_status='partial',
        metadata=metadata||jsonb_build_object(
          'mapped_course_key',r.code,
          'composition_version','v20_029',
          'delivery_constraint',r.delivery_constraint,
          'final_verification_separate',true,
          'question_bank_complete',false,
          'requires_admin_review',true),
        updated_at=now()
    where source_system='safetymanager' and external_course_code=r.code;
  end loop;
end $do$;

-- Sector DL-SPP courses remain deliberately partial until their sector-specific LU libraries are authored.
update public.training_blueprint_course_types
set development_status='partial',
    metadata=metadata||jsonb_build_object(
      'composition_version','v20_029',
      'common_module_ready',true,
      'sector_learning_units_ready',false,
      'publication_blocked',true,
      'block_reason','sector_specific_learning_units_missing'),
    updated_at=now()
where source_system='safetymanager'
  and external_course_code in ('dl_spp_agri','dl_spp_pesca','dl_spp_costruzioni','dl_spp_chimico');
