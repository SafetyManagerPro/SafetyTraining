-- SafetyTraining v20.042
-- DL-RSPP: moduli tecnico-integrativi di settore ex Parte II punto 4 ASR 17/04/2025.
-- Corsi/moduli mantenuti separati dal modulo comune 8h; le durate delle singole LU sono
-- una microprogettazione interna e NON durate normative per singola UD.
-- Test Builder finale non modificato; pubblicazione corsista resta bloccata.

do $do$
declare
  s jsonb;
  u jsonb;
  v_course_id uuid;
  v_course_version_id uuid;
  v_module_id uuid;
  v_lu_id uuid;
  v_pos integer;
  v_count integer;
begin
  for s in
    select value from jsonb_array_elements($json$
    [
      {"course_key":"dl_spp_agri","variant":"agricoltura_zootecnia","title":"DL-RSPP · Modulo integrativo 1 · Agricoltura, silvicoltura e zootecnia","sector":"Agricoltura, silvicoltura e zootecnia","ateco":"A 01-02","minutes":960,"composite_minutes":1440,"units":[
        ["ud1","UD1","Analisi degli infortuni e malattie professionali del comparto",60],
        ["ud2","UD2","Organizzazione del lavoro: ambienti di lavoro (serre, campi, boschi, ecc.)",90],
        ["ud3","UD3","Normativa tecnica per strutture e impianti",90],
        ["ud4","UD4","Rischi legati all’utilizzo di macchine e attrezzature di lavoro: ribaltamento, schiacciamento e altri eventi",150],
        ["ud5","UD5","Sostanze pericolose",90],
        ["ud6","UD6","Agenti biologici",60],
        ["ud7","UD7","Agenti fisici",90],
        ["ud8","UD8","Ambienti confinati e/o sospetti di inquinamento",90],
        ["ud9","UD9","Rischio incendio e gestione dell’emergenza",60],
        ["ud10","UD10","Rischio di caduta dall’alto",90],
        ["ud11","UD11","Movimentazione dei carichi",90]
      ]},
      {"course_key":"dl_spp_pesca","variant":"pesca","title":"DL-RSPP · Modulo integrativo 2 · Pesca","sector":"Pesca","ateco":"A 03","minutes":720,"composite_minutes":1200,"units":[
        ["ud1","UD1","Analisi degli infortuni e malattie professionali del comparto",60],
        ["ud2","UD2","Legislazione specifica di riferimento",45],
        ["ud3","UD3","Organizzazione del lavoro: ambienti di lavoro",60],
        ["ud4","UD4","Normativa tecnica per strutture e impianti",45],
        ["ud5","UD5","Rischi legati all’utilizzo di macchine e attrezzature di lavoro",60],
        ["ud6","UD6","Sostanze pericolose",45],
        ["ud7","UD7","Agenti biologici",45],
        ["ud8","UD8","Agenti fisici",45],
        ["ud9","UD9","Ambienti confinati e/o sospetti di inquinamento",60],
        ["ud10","UD10","Rischio incendio e gestione dell’emergenza",45],
        ["ud11","UD11","Rischio cadute dall’alto, a bordo e fuori bordo",60],
        ["ud12","UD12","Movimentazione dei carichi",60],
        ["ud13","UD13","Atmosfere iperbariche e attività subacquee",90]
      ]},
      {"course_key":"dl_spp_costruzioni","variant":"costruzioni","title":"DL-RSPP · Modulo integrativo 3 · Costruzioni","sector":"Costruzioni","ateco":"F","minutes":960,"composite_minutes":1440,"units":[
        ["ud1","UD1","Soggetti definiti dal Titolo IV capo I e relativi obblighi e responsabilità",60],
        ["ud2a","UD2","Analisi degli infortuni e malattie professionali del comparto",45],
        ["ud2b","UD2","Organizzazione, tecniche e fasi lavorative, aree di lavoro dei cantieri",60],
        ["ud3","UD3","Misure generali di tutela secondo l’art. 95 del d.lgs. 81/2008",45],
        ["ud4","UD4","Piano operativo di sicurezza (POS)",60],
        ["ud5","UD5","Cenni sul PSC",45],
        ["ud6","UD6","Cadute dall’alto e opere provvisionali",60],
        ["ud7","UD7","Lavori di demolizione e scavo",60],
        ["ud8","UD8","Impianti elettrici e illuminazione di cantiere",45],
        ["ud9","UD9","Rischi legati all’utilizzo di macchine e attrezzature di lavoro",60],
        ["ud10","UD10","Movimentazione dei carichi manuale e meccanica",45],
        ["ud11","UD11","Sostanze pericolose",45],
        ["ud12","UD12","Agenti biologici",45],
        ["ud13","UD13","Agenti fisici",45],
        ["ud14","UD14","Rischio incendio ed esplosione",60],
        ["ud15","UD15","Dispositivi di protezione collettiva e individuali",45],
        ["ud16","UD16","Attività su sedi stradali",60],
        ["ud17","UD17","Esempi e analisi di un POS",75]
      ]},
      {"course_key":"dl_spp_chimico","variant":"chimico_petrolchimico","title":"DL-RSPP · Modulo integrativo 4 · Chimico-petrolchimico","sector":"Chimico-petrolchimico","ateco":"C 19-20","minutes":960,"composite_minutes":1440,"units":[
        ["ud1","UD1","Analisi degli infortuni e malattie professionali del comparto",60],
        ["ud2","UD2","Processo produttivo, organizzazione del lavoro e ambienti di lavoro",90],
        ["ud3","UD3","Normativa tecnica per strutture e impianti",60],
        ["ud4","UD4","Cenni sulle attività a rischio di incidente rilevante",60],
        ["ud5","UD5","Cenni sulle industrie insalubri",45],
        ["ud6","UD6","Rischi legati agli impianti e alle attrezzature di lavoro",90],
        ["ud7","UD7","Manutenzione impianti e gestione fornitori",90],
        ["ud8","UD8","Sostanze pericolose",120],
        ["ud9","UD9","Agenti fisici",60],
        ["ud10","UD10","Rischi incendio ed esplosioni e gestione dell’emergenza",90],
        ["ud11","UD11","Ambienti confinati e/o sospetti di inquinamento",75],
        ["ud12","UD12","Dispositivi di protezione collettiva ed individuali",75],
        ["ud13","UD13","Gestione dei rifiuti",45]
      ]}
    ]
    $json$::jsonb)
  loop
    v_count := jsonb_array_length(s->'units');

    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    values(
      s->>'course_key', s->>'title', 'DL SPP / RSPP Datore di lavoro',
      'Modulo tecnico-integrativo di settore del percorso DL-RSPP. Da aggiungere al modulo comune 8h quando il settore ATECO è applicabile.',
      (s->>'minutes')::integer, 'internal_learning', true,
      jsonb_build_object(
        'blueprint_key','dl_spp_sector','variant_key',s->>'variant','sector_only_module',true,
        'sector_additional_minutes',(s->>'minutes')::integer,'composite_total_minutes',(s->>'composite_minutes')::integer,
        'common_course_key','dl_spp_comune','ateco_reference',s->>'ateco',
        'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte II punto 4',
        'delivery_constraint','synchronous_or_classroom','classroom_allowed',true,'vcs_allowed',true,'elearning_asynchronous_allowed',false,
        'attendance_min_pct',90,'learner_catalog_hidden',true,'requires_admin_review',true,
        'didactic_preview_version','dl-rspp-sector-v2','didactic_atomic_units',v_count,
        'final_verification','test_or_interview','test_min_questions',30,'test_min_options',3,'test_passing_score_pct',70,
        'final_verification_scope','common_plus_applicable_sector','final_test_builder_paused',true,
        'internal_didactic_allocation',true,'statutory_per_topic_duration',false
      )
    )
    on conflict (stable_key) do update set
      title=excluded.title,family=excluded.family,description=excluded.description,nominal_minutes=excluded.nominal_minutes,
      certification_mode=excluded.certification_mode,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now()
    returning id into v_course_id;

    insert into public.course_versions(course_id,version_number,status,syllabus_snapshot,normative_snapshot)
    values(
      v_course_id,1,'draft',
      jsonb_build_object(
        'didactic_version','dl-rspp-sector-v2','sector',s->>'sector','ateco_reference',s->>'ateco',
        'sector_module_minutes',(s->>'minutes')::integer,'official_content_items',v_count,
        'common_course_key','dl_spp_comune','sector_only_module',true,
        'internal_didactic_allocation',true,'statutory_per_ud_duration',false,'final_assessment_in_scope',false
      ),
      jsonb_build_object(
        'basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte II punto 4; art. 34 d.lgs. 81/2008',
        'ateco_reference',s->>'ateco','minimum_sector_minutes',(s->>'minutes')::integer,
        'composite_total_minutes',(s->>'composite_minutes')::integer,
        'attendance_min_pct',90,
        'delivery',jsonb_build_object('classroom',true,'vcs',true,'elearning_asynchronous',false),
        'verification',jsonb_build_object('mode','test_or_interview','test_min_questions',30,'test_min_options',3,'passing_score_pct',70,'scope','common_plus_applicable_sector')
      )
    )
    on conflict (course_id,version_number) do update set
      status='draft',syllabus_snapshot=excluded.syllabus_snapshot,normative_snapshot=excluded.normative_snapshot
    returning id into v_course_version_id;

    delete from public.course_module_units
      where module_id in (select id from public.course_modules where course_version_id=v_course_version_id);
    delete from public.course_modules where course_version_id=v_course_version_id;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'sector',s->>'title',0,(s->>'minutes')::integer)
    returning id into v_module_id;

    v_pos := 0;
    for u in select value from jsonb_array_elements(s->'units')
    loop
      v_pos := v_pos + 1;

      insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
      values(
        'dl-rspp-sector:'||(s->>'variant')||':'||(u->>0),
        (u->>1)||' · '||(u->>2),
        'Contenuto tecnico-integrativo per il settore '||(s->>'sector')||': '||(u->>2)||'.',
        (u->>3)::integer,
        'dl_rspp_sector',
        array['dl-rspp','asr-2025','sector',s->>'variant'],
        true,
        jsonb_build_object(
          'didactic_version','dl-rspp-sector-v2','variant_key',s->>'variant','sector',s->>'sector','ateco_reference',s->>'ateco',
          'official_ud',u->>1,'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte II punto 4',
          'internal_didactic_allocation',true,'statutory_per_topic_duration',false
        )
      )
      on conflict (stable_key) do update set
        title=excluded.title,summary=excluded.summary,default_minutes=excluded.default_minutes,source_group=excluded.source_group,
        tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
      returning id into v_lu_id;

      insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
      values(
        v_lu_id,1,'published',
        jsonb_build_object(
          'didactic_version','dl-rspp-sector-v2','official_ud',u->>1,'title',u->>2,'minutes',(u->>3)::integer,
          'sector',s->>'sector','ateco_reference',s->>'ateco',
          'summary','Applicare il tema al contesto reale del settore, collegando pericoli, esposizioni, misure, responsabilità e verifica dell’efficacia.',
          'detail','La trattazione deve partire dalle attività effettive e integrare valutazione del rischio, misure tecniche e organizzative, documentazione pertinente e trigger di riesame.',
          'question','Quali condizioni specifiche del settore modificano il modo in cui questo rischio o requisito deve essere governato?',
          'teacher_expansion',jsonb_build_array('Contesto e obiettivi','Analisi tecnica e normativa','Caso applicativo di settore','Scelte di prevenzione e protezione','Debrief e riesame'),
          'procedure',jsonb_build_array('Descrivi attività e scenario','Individua pericoli ed esposti','Verifica requisiti e dati','Definisci misure','Assegna responsabilità','Controlla applicazione','Riesamina'),
          'common_errors',jsonb_build_array('Usare soluzioni standard senza verificarne l’applicabilità.','Confondere presenza della procedura con efficacia della misura.'),
          'final_assessment',false
        ),now()
      )
      on conflict (learning_unit_id,version_number) do update set
        status='published',content=excluded.content,published_at=coalesce(public.learning_unit_versions.published_at,now());

      insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
      select v_module_id,luv.id,v_pos,true,0,true,
        jsonb_build_object('didactic_version','dl-rspp-sector-v2','official_ud',u->>1,'final_assessment',false)
      from public.learning_unit_versions luv
      where luv.learning_unit_id=v_lu_id and luv.version_number=1;
    end loop;

    update public.training_blueprint_variants
      set status='partial',
          title=case s->>'variant'
            when 'agricoltura_zootecnia' then 'DL SPP - Modulo Comune + Agricoltura/Silvicoltura/Zootecnia (24h)'
            when 'pesca' then 'DL SPP - Modulo Comune + Pesca (20h)'
            when 'costruzioni' then 'DL SPP - Modulo Comune + Costruzioni (24h)'
            else 'DL SPP - Modulo Comune + Chimico-Petrolchimico (24h)' end,
          metadata=metadata||jsonb_build_object(
            'didactic_version','dl-rspp-sector-v2','sector_learning_units_ready',true,
            'sector_course_key',s->>'course_key','sector_additional_minutes',(s->>'minutes')::integer,
            'common_minutes',480,'ateco_reference',s->>'ateco',
            'delivery_constraint','synchronous_or_classroom','elearning_asynchronous_allowed',false,
            'publication_blocked',true,'block_reason','final_verification_and_admin_review_pending',
            'internal_didactic_allocation',true,'statutory_per_topic_duration',false
          ),updated_at=now()
      where blueprint_key='dl_spp_sector' and variant_key=s->>'variant';

    update public.training_blueprint_course_types
      set development_status='partial',
          metadata=metadata||jsonb_build_object(
            'mapped_sector_course_key',s->>'course_key','sector_learning_units_ready',true,
            'sector_module_minutes',(s->>'minutes')::integer,'common_module_ready',true,
            'delivery_constraint','synchronous_or_classroom','elearning_asynchronous_allowed',false,
            'publication_blocked',true,'block_reason','final_verification_and_admin_review_pending',
            'didactic_version','dl-rspp-sector-v2','requires_final_composition_review',true
          ),updated_at=now()
      where source_system='safetymanager' and external_course_code=s->>'course_key';
  end loop;

  update public.training_blueprints
    set status='partial',metadata=metadata||jsonb_build_object(
      'sector_didactic_version','dl-rspp-sector-v2','sector_variants_ready',true,'variant_count',4,
      'delivery_constraint','synchronous_or_classroom','elearning_asynchronous_allowed',false,
      'common_course_key','dl_spp_comune','publication_blocked',true,
      'block_reason','final_verification_and_admin_review_pending'
    ),updated_at=now()
    where stable_key='dl_spp_sector';
end
$do$;
