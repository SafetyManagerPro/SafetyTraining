-- SafetyTraining v20.026
-- Composizione dei quattro percorsi Primo Soccorso a partire dalla libreria LU v20.025.
-- I corsi iniziali contengono la sola parte teorica digitale; la pratica resta requisito separato.
-- Gli aggiornamenti Gruppo A/B-C sono registrati come percorsi pratici/presenza e non vengono simulati online.

create table if not exists public.course_practical_requirements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  requirement_key text not null,
  title text not null,
  nominal_minutes integer null check (nominal_minutes is null or nominal_minutes >= 0),
  required boolean not null default true,
  completion_mode text not null default 'external_presence'
    check (completion_mode in ('external_presence','in_person_training','practical_assessment')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,requirement_key)
);

alter table public.course_practical_requirements enable row level security;
drop policy if exists course_practical_requirements_admin on public.course_practical_requirements;
create policy course_practical_requirements_admin on public.course_practical_requirements
for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
grant select,insert,update,delete on public.course_practical_requirements to authenticated;
drop trigger if exists course_practical_requirements_touch on public.course_practical_requirements;
create trigger course_practical_requirements_touch before update on public.course_practical_requirements
for each row execute function public.touch_updated_at();

-- Helper locale: crea/aggiorna un corso, una versione bozza e un modulo teorico.
do $$
declare
  v_course_id uuid;
  v_version_id uuid;
  v_module_id uuid;
  v_luv_id uuid;
  v_pos integer;
  v_code text;
  v_title text;
  v_minutes integer;
  v_theory_minutes integer;
  v_practical_minutes integer;
  v_group text;
  v_update boolean;
  v_keys text[];
  v_key text;
begin
  foreach v_code in array array['primo_soccorso_12h','primo_soccorso_a_16h','agg_primo_soccorso_4h','agg_primo_soccorso_a_6h']
  loop
    v_update := v_code like 'agg_%';

    if v_code='primo_soccorso_12h' then
      v_title := 'Addetto Primo Soccorso - Gruppi B/C - 12h';
      v_minutes := 720; v_theory_minutes := 480; v_practical_minutes := 240; v_group := 'BC';
      v_keys := array[
        'primo_soccorso:allertamento-sicurezza-scena','primo_soccorso:valutazione-iniziale',
        'primo_soccorso:funzioni-vitali','primo_soccorso:traumi-emorragie',
        'primo_soccorso:traumi-scheletro-colonna','primo_soccorso:traumi-torace-addome',
        'primo_soccorso:emergenze-mediche','primo_soccorso:ustioni-intossicazioni-temperatura'
      ];
    elsif v_code='primo_soccorso_a_16h' then
      v_title := 'Addetto Primo Soccorso - Gruppo A - 16h';
      v_minutes := 960; v_theory_minutes := 600; v_practical_minutes := 360; v_group := 'A';
      v_keys := array[
        'primo_soccorso:allertamento-sicurezza-scena','primo_soccorso:valutazione-iniziale',
        'primo_soccorso:funzioni-vitali','primo_soccorso:traumi-emorragie',
        'primo_soccorso:traumi-scheletro-colonna','primo_soccorso:traumi-torace-addome',
        'primo_soccorso:emergenze-mediche','primo_soccorso:ustioni-intossicazioni-temperatura',
        'primo_soccorso:gruppo-a-rischi-specifici','primo_soccorso:gruppo-a-scenari-complessi'
      ];
    elsif v_code='agg_primo_soccorso_4h' then
      v_title := 'Aggiornamento Primo Soccorso - Gruppi B/C - 4h';
      v_minutes := 240; v_theory_minutes := 0; v_practical_minutes := 240; v_group := 'BC';
      v_keys := array[]::text[];
    else
      v_title := 'Aggiornamento Primo Soccorso - Gruppo A - 6h';
      v_minutes := 360; v_theory_minutes := 0; v_practical_minutes := 360; v_group := 'A';
      v_keys := array[]::text[];
    end if;

    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(
      v_code,v_title,'primo_soccorso',
      case when v_update
        then 'Percorso di aggiornamento con componente pratica/presenza obbligatoria. SafetyTraining ne gestisce assegnazione e tracciamento, non simula la pratica online.'
        else 'Percorso ibrido: teoria digitale strutturata in Learning Unit e componente pratica/presenza separata.' end,
      v_minutes,'internal_learning',true,
      jsonb_build_object(
        'blueprint_key',case when v_update then 'first_aid_update' else 'first_aid_initial' end,
        'first_aid_group',v_group,'theory_minutes',v_theory_minutes,'practical_minutes',v_practical_minutes,
        'requires_presence',true,'practical_separate',true,'internal_non_certifying',true,
        'learner_catalog_hidden',true,'requires_admin_review',true,'source_course_code',v_code
      )
    )
    on conflict (stable_key) do update
      set title=excluded.title,family=excluded.family,description=excluded.description,
          nominal_minutes=excluded.nominal_minutes,active=true,
          metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course_id;

    select id into v_version_id from public.course_versions
    where course_id=v_course_id and version_number=1 limit 1;

    if v_version_id is null then
      insert into public.course_versions(course_id,version_number,status,syllabus_snapshot,normative_snapshot)
      values(
        v_course_id,1,'draft',
        jsonb_build_object(
          'source','v20_026','group',v_group,'nominal_minutes',v_minutes,
          'theory_minutes',v_theory_minutes,'practical_minutes',v_practical_minutes,
          'digital_units',coalesce(array_length(v_keys,1),0),
          'publication_gate','Admin review + practical workflow configuration'
        ),
        jsonb_build_object('reference','D.M. 388/2003','practical_training_required',true)
      ) returning id into v_version_id;
    else
      update public.course_versions
      set syllabus_snapshot=syllabus_snapshot||jsonb_build_object(
            'source','v20_026','group',v_group,'nominal_minutes',v_minutes,
            'theory_minutes',v_theory_minutes,'practical_minutes',v_practical_minutes,
            'digital_units',coalesce(array_length(v_keys,1),0),
            'publication_gate','Admin review + practical workflow configuration'),
          normative_snapshot=normative_snapshot||jsonb_build_object('reference','D.M. 388/2003','practical_training_required',true)
      where id=v_version_id and status='draft';
    end if;

    if v_theory_minutes > 0 then
      insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
      values(v_version_id,'theory','Parte teorica',1,v_theory_minutes)
      on conflict (course_version_id,module_key) do update
      set title=excluded.title,position=excluded.position,nominal_minutes=excluded.nominal_minutes
      returning id into v_module_id;

      v_pos := 0;
      foreach v_key in array v_keys loop
        v_pos := v_pos + 1;
        select luv.id into v_luv_id
        from public.learning_units lu
        join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.status='published'
        where lu.stable_key=v_key and lu.active
        order by luv.version_number desc limit 1;

        if v_luv_id is not null then
          insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
          values(v_module_id,v_luv_id,v_pos,true,2160,true,
                 jsonb_build_object('source','v20_026','phase','theory','first_aid_group',v_group))
          on conflict (module_id,unit_version_id) do update
          set position=excluded.position,required=true,min_active_seconds=excluded.min_active_seconds,
              requires_comprehension=true,completion_rules=public.course_module_units.completion_rules||excluded.completion_rules;
        end if;
      end loop;
    end if;

    insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
    values(
      v_course_id,'first_aid_practical',
      case when v_update then 'Aggiornamento pratico di primo soccorso' else 'Addestramento pratico di primo soccorso' end,
      v_practical_minutes,true,'in_person_training',
      jsonb_build_object('group',v_group,'normative_ref','D.M. 388/2003','digital_completion_allowed',false,
                         'requires_external_record',true,'source','v20_026')
    )
    on conflict (course_id,requirement_key) do update
    set title=excluded.title,nominal_minutes=excluded.nominal_minutes,required=true,
        completion_mode=excluded.completion_mode,
        metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();

    insert into public.integration_course_mappings(source_system,external_course_code,course_id,active,metadata)
    values('safetymanager',v_code,v_course_id,true,
           jsonb_build_object('blueprint',case when v_update then 'first_aid_update' else 'first_aid_initial' end,
                              'group',v_group,'hybrid',true,'source','v20_026'))
    on conflict (source_system,external_course_code) do update
    set course_id=excluded.course_id,active=true,
        metadata=public.integration_course_mappings.metadata||excluded.metadata,updated_at=now();

    update public.integration_course_catalog
       set mapped_course_id=v_course_id,
           delivery_status='hybrid',
           metadata=metadata||jsonb_build_object(
             'mapped_course_key',v_code,'theory_minutes',v_theory_minutes,'practical_minutes',v_practical_minutes,
             'practical_completion_external',true,'composition_version','v20_026'),
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.training_blueprint_course_types
       set development_status=case when v_update then 'hybrid_partial' else 'hybrid_partial' end,
           metadata=metadata||jsonb_build_object('mapped_course_key',v_code,'theory_minutes',v_theory_minutes,
                                                  'practical_minutes',v_practical_minutes,'composition_version','v20_026'),
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;
  end loop;
end $$;
