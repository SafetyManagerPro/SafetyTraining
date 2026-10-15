-- SafetyTraining v20.040
-- Aggiornamento Datore di lavoro 6h / 5 anni.
-- Percorso didattico dinamico: 6 LU da 60 minuti come struttura interna minima.
-- Se permane il ruolo di impresa affidataria, il Composer deve includere anche temi del modulo Cantieri.
-- Test Builder invariato.

do $do$
declare
  r record;
  v_lu_id uuid;
  v_course_id uuid;
  v_course_version_id uuid;
  v_module_id uuid;
begin
  for r in select * from (values
    ('agg-datore:novita-cambiamenti','ADL01 · Novità normative e cambiamenti organizzativi',60,
      jsonb_build_object('didactic_version','agg-datore-v2','code','ADL01','minutes',60,'slide_title','Che cosa è cambiato dall’ultimo aggiornamento?','summary','L’aggiornamento parte dai cambiamenti intervenuti: norme, organizzazione, processi, tecnologie, persone e responsabilità.','detail','Il docente ricostruisce con il gruppo le variazioni realmente intervenute nell’azienda e verifica quali hanno modificato rischi, misure o responsabilità.','question','Quale cambiamento degli ultimi anni ha inciso di più sul vostro modo di gestire la sicurezza?','case','L’azienda ha introdotto nuovi turni, un nuovo fornitore e una macchina diversa, ma il sistema formativo è rimasto identico. Quali elementi devono essere riesaminati?','teacher_expansion',jsonb_build_array('0–15 · Mappa dei cambiamenti','15–30 · Novità normative rilevanti','30–45 · Impatto su ruoli e misure','45–55 · Caso aziendale','55–60 · Priorità di aggiornamento'),'common_errors',jsonb_build_array('Usare l’aggiornamento per ripetere il corso base.','Ignorare cambiamenti organizzativi senza infortuni.'),'operational',jsonb_build_object('objective','Collegare ogni cambiamento a rischi, responsabilità e misure da riesaminare.','step_by_step',jsonb_build_array('Elenca cambiamenti','Valuta impatti','Individua misure interessate','Assegna priorità','Definisci azioni')),'idea_images',jsonb_build_array(jsonb_build_object('file','idea-risk-cycle.svg','caption','Ogni cambiamento riapre il ciclo di valutazione e controllo.')),'quality',jsonb_build_object('score',100,'complete',true,'dynamic_update',true,'final_assessment',false))),
    ('agg-datore:rischi-dvr-misure','ADL02 · DVR, rischi emergenti e misure',60,
      jsonb_build_object('didactic_version','agg-datore-v2','code','ADL02','minutes',60,'slide_title','Il DVR è ancora coerente con il lavoro reale?','summary','L’aggiornamento deve confrontare rischi e misure con le condizioni attuali, non con quelle del precedente corso.','detail','Si analizzano cambiamenti del profilo di rischio, misure tecniche/organizzative/procedurali, gruppi esposti e priorità di miglioramento.','question','Quale misura oggi è meno efficace di cinque anni fa e perché?','case','Una misura temporanea introdotta anni fa è diventata la prassi ordinaria. Come deve essere riesaminata?','teacher_expansion',jsonb_build_array('0–15 · Rischi cambiati','15–30 · Misure ancora efficaci?','30–45 · Misure temporanee e gruppi esposti','45–55 · Caso misura diventata permanente','55–60 · Azioni di riesame'),'common_errors',jsonb_build_array('Aggiornare il documento senza aggiornare il lavoro.','Mantenere misure temporanee senza scadenza.'),'operational',jsonb_build_object('objective','Riesaminare efficacia e adeguatezza delle misure attuali.','step_by_step',jsonb_build_array('Confronta DVR e realtà','Individua scostamenti','Valuta efficacia','Definisci correzioni','Verifica')),'idea_images',jsonb_build_array(jsonb_build_object('file','idea-dvr-reading.svg','caption','Dal DVR alla verifica delle condizioni reali.'),jsonb_build_object('file','modello-farfalla-rischio.svg','caption','Controllare se le barriere continuano a funzionare.')),'quality',jsonb_build_object('score',100,'complete',true,'dynamic_update',true,'final_assessment',false))),
    ('agg-datore:eventi-nearmiss-indicatori','ADL03 · Infortuni, near miss, audit e indicatori',60,
      jsonb_build_object('didactic_version','agg-datore-v2','code','ADL03','minutes',60,'slide_title','Gli eventi degli ultimi anni devono cambiare le decisioni future','summary','Near miss, infortuni, audit, non conformità e indicatori servono per capire se il sistema sta davvero migliorando.','detail','Il docente lavora sui trend aziendali e sulle azioni correttive: non basta chiudere un rilievo, occorre verificare che la causa sia stata gestita e che l’effetto non si ripeta.','question','Quale indicatore vi direbbe prima di un infortunio che il sistema sta peggiorando?','case','Tre near miss simili vengono chiusi con richiami diversi ma senza una causa comune identificata. Che cosa deve cambiare?','teacher_expansion',jsonb_build_array('0–15 · Eventi e indicatori','15–30 · Leading vs lagging','30–45 · Cause e azioni correttive','45–55 · Caso near miss ripetuti','55–60 · Riesame'),'common_errors',jsonb_build_array('Contare solo gli infortuni.','Chiudere azioni senza verifica di efficacia.'),'operational',jsonb_build_object('objective','Usare gli eventi come input per il riesame del sistema.','step_by_step',jsonb_build_array('Raccogli segnali','Cerca pattern','Analizza cause','Correggi','Verifica efficacia')),'idea_images',jsonb_build_array(jsonb_build_object('file','piramide-pericoli.svg','caption','Near miss e anomalie come segnali precoci.'),jsonb_build_object('file','idea-inspection-flow.svg','caption','Rilievo, azione e verifica di efficacia.')),'quality',jsonb_build_object('score',100,'complete',true,'dynamic_update',true,'final_assessment',false))),
    ('agg-datore:organizzazione-competenze','ADL04 · Ruoli, competenze, formazione e vigilanza',60,
      jsonb_build_object('didactic_version','agg-datore-v2','code','ADL04','minutes',60,'slide_title','Il sistema funziona ancora con le persone e i ruoli di oggi?','summary','Cambi di organigramma, turnover, nuovi preposti, nuove mansioni o carenze formative possono indebolire il sistema anche senza modificare impianti e processi.','detail','Si riesaminano ruoli, competenze, formazione, addestramento, consultazione e sistema di vigilanza alla luce dell’organizzazione attuale.','question','Quale ruolo oggi ha responsabilità maggiori rispetto a cinque anni fa senza che il sistema sia stato adeguato?','case','Un reparto ha cambiato capi turno e mansioni, ma procedure e formazione sono rimaste identiche. Quali verifiche deve attivare il datore?','teacher_expansion',jsonb_build_array('0–15 · Cambiamenti di ruolo','15–30 · Competenze e formazione','30–45 · Vigilanza e consultazione','45–55 · Caso reparto riorganizzato','55–60 · Piano competenze'),'common_errors',jsonb_build_array('Aggiornare solo chi ha una scadenza formale.','Ignorare competenze richieste da nuove mansioni.'),'operational',jsonb_build_object('objective','Allineare ruoli e competenze all’organizzazione attuale.','step_by_step',jsonb_build_array('Mappa ruoli','Verifica competenze','Individua gap','Forma/addestra','Controlla applicazione')),'idea_images',jsonb_build_array(jsonb_build_object('file','organigramma-sicurezza.svg','caption','Ruoli e relazioni devono seguire l’organizzazione reale.'),jsonb_build_object('file','idea-safety-system.svg','caption','Le competenze sono una componente del sistema di prevenzione.')),'quality',jsonb_build_object('score',100,'complete',true,'dynamic_update',true,'final_assessment',false))),
    ('agg-datore:appalti-emergenze-cambiamenti','ADL05 · Appalti, emergenze e scenari modificati',60,
      jsonb_build_object('didactic_version','agg-datore-v2','code','ADL05','minutes',60,'slide_title','Contratti, emergenze e cambiamenti devono essere riesaminati insieme','summary','Nuovi appaltatori, modifiche di layout, turni o accessi possono rendere obsolete misure di coordinamento ed emergenza.','detail','L’unità collega appalti/interferenze, gestione delle emergenze e cambiamenti temporanei o permanenti che incidono sulla capacità reale di risposta.','question','Quale variazione organizzativa può rendere inefficace un piano di emergenza formalmente aggiornato?','case','Un nuovo appaltatore lavora nel turno serale in un’area con vie temporaneamente modificate. Che cosa va riesaminato?','teacher_expansion',jsonb_build_array('0–15 · Appalti cambiati','15–30 · Interferenze','30–45 · Emergenze e coperture','45–55 · Caso turno serale','55–60 · Safety gate'),'common_errors',jsonb_build_array('Aggiornare il contratto ma non il coordinamento.','Non riesaminare emergenze dopo modifiche temporanee.'),'operational',jsonb_build_object('objective','Riesaminare coordinamento ed emergenze quando cambia il contesto.','step_by_step',jsonb_build_array('Identifica variazioni','Mappa interferenze','Verifica coperture','Aggiorna misure','Comunica','Verifica')),'idea_images',jsonb_build_array(jsonb_build_object('file','idea-duvri.svg','caption','Interferenze e coordinamento aggiornati al contesto.'),jsonb_build_object('file','idea-emergency-steps.svg','caption','La risposta deve restare coerente con persone e spazi reali.')),'quality',jsonb_build_object('score',100,'complete',true,'dynamic_update',true,'final_assessment',false))),
    ('agg-datore:governance-cantieri-riesame','ADL06 · Governance, riesame e modulo Cantieri quando applicabile',60,
      jsonb_build_object('didactic_version','agg-datore-v2','code','ADL06','minutes',60,'slide_title','Chiudere l’aggiornamento con decisioni, responsabilità e riesame','summary','L’ultima ora integra priorità, risorse, azioni e criteri di verifica. Se permane il ruolo di impresa affidataria, deve includere anche i temi Cantieri pertinenti.','detail','L’unità conclude con un decision record: criticità, misura, owner, risorsa, scadenza, evidenza e riesame. Il docente inserisce i temi del modulo Cantieri quando il contesto dell’impresa affidataria è ancora presente.','question','Quali tre decisioni dovrebbero uscire concretamente da questo aggiornamento?','case','Persistono attività come impresa affidataria, sono cambiati subappaltatori e cronoprogrammi e restano azioni correttive aperte. Come costruisci il piano di riesame?','teacher_expansion',jsonb_build_array('0–10 · Sintesi criticità','10–25 · Priorità e risorse','25–40 · Temi Cantieri se applicabili','40–50 · Decision record','50–60 · Impegni e verifica'),'common_errors',jsonb_build_array('Chiudere l’aggiornamento senza decisioni applicative.','Omettere i temi Cantieri quando il ruolo permane.'),'operational',jsonb_build_object('objective','Tradurre l’aggiornamento in un piano di miglioramento verificabile.','step_by_step',jsonb_build_array('Prioritizza','Decidi','Assegna owner','Assegna risorse','Fissa scadenza','Verifica'),'stop_conditions',jsonb_build_array('Criticità rilevante senza owner','Ruolo di impresa affidataria non considerato')),'idea_images',jsonb_build_array(jsonb_build_object('file','idea-risk-cycle.svg','caption','Decisione, attuazione, verifica e riesame.'),jsonb_build_object('file','idea-duvri.svg','caption','Richiamo ai temi Cantieri quando ancora applicabili.')),'quality',jsonb_build_object('score',100,'complete',true,'dynamic_update',true,'construction_conditional',true,'final_assessment',false)))
  ) x(stable_key,title,minutes,content)
  loop
    insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    values(r.stable_key,r.title,r.content->>'summary',r.minutes,'agg_datore_lavoro',array['datore-lavoro','aggiornamento','asr-2025','dynamic'],true,
      jsonb_build_object('didactic_version','agg-datore-v2','regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','dynamic_update',true))
    on conflict (stable_key) do update set title=excluded.title,summary=excluded.summary,default_minutes=excluded.default_minutes,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
    returning id into v_lu_id;

    insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
    values(v_lu_id,1,'published',r.content,now())
    on conflict (learning_unit_id,version_number) do update set status='published',content=excluded.content,published_at=coalesce(public.learning_unit_versions.published_at,now());
  end loop;

  select id into v_course_id from public.courses where stable_key='agg_dl';
  if v_course_id is not null then
    update public.courses set metadata=metadata||jsonb_build_object(
      'didactic_preview_version','agg-datore-v2','didactic_atomic_units',6,'didactic_macro_blocks',2,
      'didactic_focus','contextual_update_and_effectiveness_review','minimum_minutes',360,
      'renewal_interval_months',60,'dynamic_update',true,'construction_topics_conditional',true,
      'final_test_builder_paused',true,'learner_catalog_hidden',true
    ),updated_at=now() where id=v_course_id;

    insert into public.course_versions(course_id,version_number,status,syllabus_snapshot,normative_snapshot)
    values(v_course_id,2,'draft',
      jsonb_build_object('didactic_version','agg-datore-v2','macro_blocks',jsonb_build_array(
        jsonb_build_object('key','adl-a','title','Cambiamenti, rischi, eventi e competenze','minutes',180),
        jsonb_build_object('key','adl-b','title','Appalti, emergenze, governance e riesame','minutes',180)),
        'atomic_learning_units',6,'total_minutes',360,'dynamic_update',true,
        'composition_rule','select/adapt units to current duties, company changes, risks and effectiveness findings',
        'construction_rule','include relevant construction topics when entrusted-company conditions remain'),
      jsonb_build_object('basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','minimum_minutes',360,'renewal_interval_months',60,'construction_topics_when_applicable',true))
    on conflict (course_id,version_number) do update set status='draft',syllabus_snapshot=excluded.syllabus_snapshot,normative_snapshot=excluded.normative_snapshot
    returning id into v_course_version_id;

    delete from public.course_module_units where module_id in (select id from public.course_modules where course_version_id=v_course_version_id);
    delete from public.course_modules where course_version_id=v_course_version_id;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'adl-a','ADL-A · Cambiamenti, rischi, eventi e competenze',0,180) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,jsonb_build_object('didactic_version','agg-datore-v2','dynamic',true)
    from (values ('agg-datore:novita-cambiamenti',1),('agg-datore:rischi-dvr-misure',2),('agg-datore:eventi-nearmiss-indicatori',3)) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'adl-b','ADL-B · Appalti, emergenze, governance e riesame',180,180) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,jsonb_build_object('didactic_version','agg-datore-v2','dynamic',true)
    from (values ('agg-datore:organizzazione-competenze',1),('agg-datore:appalti-emergenze-cambiamenti',2),('agg-datore:governance-cantieri-riesame',3)) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1;
  end if;
end $do$;
