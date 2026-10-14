-- SafetyTraining v20.019
-- Draft Learning Unit blueprints for SafetyManager worker-training course families.
-- These are internal/non-certifying templates and remain draft until the learner
-- player can render database-native course structures and the content is adapted
-- to the company's actual DVR, tasks and exposures.

do $$
declare
  v_course_id uuid;
  v_version_id uuid;
  v_module_id uuid;
  v_key text;
  v_title text;
  v_minutes integer;
  v_risk text;
  v_unit record;
  v_pos integer;
begin
  foreach v_key in array array['lav_basso','lav_medio','lav_alto'] loop
    v_title := case v_key
      when 'lav_basso' then 'Formazione Lavoratori - Rischio Basso'
      when 'lav_medio' then 'Formazione Lavoratori - Rischio Medio'
      else 'Formazione Lavoratori - Rischio Alto'
    end;
    v_minutes := case v_key when 'lav_basso' then 480 when 'lav_medio' then 720 else 960 end;
    v_risk := case v_key when 'lav_basso' then 'basso' when 'lav_medio' then 'medio' else 'alto' end;

    insert into public.courses(
      stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata
    ) values (
      v_key,
      v_title,
      'lavoratori',
      'Bozza modulare composta da Learning Unit riutilizzabili. Percorso interno non certificante; la formazione specifica deve essere adattata ai rischi effettivi, al DVR, alle mansioni e alle procedure aziendali.',
      v_minutes,
      'internal_learning',
      true,
      jsonb_build_object(
        'source_system','safetymanager',
        'source_course_code',v_key,
        'internal_non_certifying',true,
        'template_draft',true,
        'requires_dvr_adaptation',true,
        'risk_level',v_risk,
        'learning_unit_blueprint','worker-v1'
      )
    )
    on conflict (stable_key) do update
      set title=excluded.title,
          family=excluded.family,
          description=excluded.description,
          nominal_minutes=excluded.nominal_minutes,
          metadata=public.courses.metadata || excluded.metadata,
          updated_at=now()
    returning id into v_course_id;

    insert into public.course_versions(
      course_id,version_number,status,syllabus_snapshot,normative_snapshot
    ) values (
      v_course_id,1,'draft',
      jsonb_build_object(
        'blueprint','worker-v1',
        'general_minutes',240,
        'specific_minutes',v_minutes-240,
        'note','Learning Unit riutilizzabili; adattare la parte specifica ai rischi effettivi prima della pubblicazione.'
      ),
      jsonb_build_object(
        'mode','internal_non_certifying',
        'requires_company_risk_adaptation',true
      )
    )
    on conflict (course_id,version_number) do update
      set syllabus_snapshot=excluded.syllabus_snapshot,
          normative_snapshot=excluded.normative_snapshot
    returning id into v_version_id;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values (v_version_id,'general-4h','Formazione generale - concetti, ruoli e prevenzione',0,240)
    on conflict (course_version_id,module_key) do update
      set title=excluded.title,position=excluded.position,nominal_minutes=excluded.nominal_minutes
    returning id into v_module_id;

    v_pos := 0;
    for v_unit in
      select luv.id as version_id,lu.default_minutes
      from public.learning_units lu
      join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published'
      where lu.stable_key in (
        'generale:rischio','generale:prevenzione-protezione','generale:organizzazione',
        'generale:diritti-doveri','generale:incidenti','generale:emergenze-generale',
        'generale:segnaletica-generale'
      )
      order by array_position(array[
        'generale:rischio','generale:prevenzione-protezione','generale:organizzazione',
        'generale:diritti-doveri','generale:incidenti','generale:emergenze-generale',
        'generale:segnaletica-generale'
      ]::text[],lu.stable_key)
    loop
      insert into public.course_module_units(
        module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules
      ) values (
        v_module_id,v_unit.version_id,v_pos,true,coalesce(v_unit.default_minutes,0)*36,true,
        jsonb_build_object('blueprint','worker-v1','active_ratio',0.60)
      )
      on conflict (module_id,unit_version_id) do update
        set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,
            requires_comprehension=true,completion_rules=excluded.completion_rules;
      v_pos := v_pos + coalesce(v_unit.default_minutes,0);
    end loop;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values (v_version_id,'specific-base-4h','Formazione specifica - rischi trasversali di base',240,240)
    on conflict (course_version_id,module_key) do update
      set title=excluded.title,position=excluded.position,nominal_minutes=excluded.nominal_minutes
    returning id into v_module_id;

    v_pos := 0;
    for v_unit in
      select luv.id as version_id,lu.default_minutes
      from public.learning_units lu
      join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published'
      where lu.stable_key in (
        'frontoffice:vdt-front','backoffice:elettrico-back','backoffice:archivi',
        'frontoffice:stress-front','backoffice:mmc-back','generale:emergenze-generale',
        'frontoffice:spazi-front'
      )
      order by array_position(array[
        'frontoffice:vdt-front','backoffice:elettrico-back','backoffice:archivi',
        'frontoffice:stress-front','backoffice:mmc-back','generale:emergenze-generale',
        'frontoffice:spazi-front'
      ]::text[],lu.stable_key)
    loop
      insert into public.course_module_units(
        module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules
      ) values (
        v_module_id,v_unit.version_id,v_pos,true,coalesce(v_unit.default_minutes,0)*36,true,
        jsonb_build_object('blueprint','worker-v1','active_ratio',0.60,'requires_dvr_validation',true)
      )
      on conflict (module_id,unit_version_id) do update
        set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,
            requires_comprehension=true,completion_rules=excluded.completion_rules;
      v_pos := v_pos + coalesce(v_unit.default_minutes,0);
    end loop;

    if v_key in ('lav_medio','lav_alto') then
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values (v_version_id,'specific-medium-4h','Formazione specifica - rischi operativi e di esposizione',480,240)
      on conflict (course_version_id,module_key) do update
        set title=excluded.title,position=excluded.position,nominal_minutes=excluded.nominal_minutes
      returning id into v_module_id;

      v_pos := 0;
      for v_unit in
        select luv.id as version_id,lu.default_minutes
        from public.learning_units lu
        join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published'
        where lu.stable_key in (
          'ecologici:biologico','ecologici:chimico-ecologici','verde:rumore-vibrazioni-verde',
          'ecologici:cadute-ecologici','ecologici:traffico-ecologici'
        )
        order by array_position(array[
          'ecologici:biologico','ecologici:chimico-ecologici','verde:rumore-vibrazioni-verde',
          'ecologici:cadute-ecologici','ecologici:traffico-ecologici'
        ]::text[],lu.stable_key)
      loop
        insert into public.course_module_units(
          module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules
        ) values (
          v_module_id,v_unit.version_id,v_pos,true,coalesce(v_unit.default_minutes,0)*36,true,
          jsonb_build_object('blueprint','worker-v1','active_ratio',0.60,'requires_dvr_validation',true)
        )
        on conflict (module_id,unit_version_id) do update
          set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,
              requires_comprehension=true,completion_rules=excluded.completion_rules;
        v_pos := v_pos + coalesce(v_unit.default_minutes,0);
      end loop;
    end if;

    if v_key='lav_alto' then
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values (v_version_id,'specific-high-4h','Formazione specifica - rischi elevati e attività operative',720,240)
      on conflict (course_version_id,module_key) do update
        set title=excluded.title,position=excluded.position,nominal_minutes=excluded.nominal_minutes
      returning id into v_module_id;

      v_pos := 0;
      for v_unit in
        select luv.id as version_id,lu.default_minutes
        from public.learning_units lu
        join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published'
        where lu.stable_key in (
          'verde:motosega','verde:decespugliatore','verde:lavoro-strada-verde',
          'verde:potatura-alto','verde:microclima-verde'
        )
        order by array_position(array[
          'verde:motosega','verde:decespugliatore','verde:lavoro-strada-verde',
          'verde:potatura-alto','verde:microclima-verde'
        ]::text[],lu.stable_key)
      loop
        insert into public.course_module_units(
          module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules
        ) values (
          v_module_id,v_unit.version_id,v_pos,true,coalesce(v_unit.default_minutes,0)*36,true,
          jsonb_build_object('blueprint','worker-v1','active_ratio',0.60,'requires_dvr_validation',true,'practical_training_not_replaced',true)
        )
        on conflict (module_id,unit_version_id) do update
          set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,
              requires_comprehension=true,completion_rules=excluded.completion_rules;
        v_pos := v_pos + coalesce(v_unit.default_minutes,0);
      end loop;
    end if;

    update public.integration_course_catalog
       set metadata = metadata || jsonb_build_object(
             'blueprint_course_key',v_key,
             'learning_unit_blueprint','worker-v1',
             'blueprint_status','draft',
             'requires_dvr_adaptation',true
           ),
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_key;
  end loop;
end $$;
