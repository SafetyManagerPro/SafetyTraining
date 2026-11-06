-- SafetyTraining v20.041
-- DL-RSPP / Datore di lavoro che svolge direttamente i compiti del SPP.
-- Modulo comune 8h: didattica v2, distinto dal Datore 16h e dai moduli tecnici-integrativi di settore.
-- La scansione in 8 LU da 60 minuti e 3 macro-blocchi è una scelta didattica interna.
-- Test Builder e moduli specialistici restano invariati.

do $do$
declare
  r record;
  v_lu_id uuid;
  v_course_id uuid;
  v_course_version_id uuid;
  v_module_id uuid;
begin
  for r in select * from (values
    ('dl-rspp:processo-valutazione','DLR01 · Processo di valutazione: pericolo, rischio, criteri e decisione',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR01','minutes',60,
        'slide_title','Valutare significa decidere prima che il rischio diventi evento',
        'summary','Il DL-RSPP deve trasformare informazioni sul lavoro in una valutazione strutturata, motivata e orientata alle misure.',
        'detail','Dal pericolo e dall’esposizione si passa alla stima, alla priorità, alla scelta delle misure e al riesame, usando dati sul lavoro reale e criteri espliciti.',
        'question','Quale informazione manca più spesso quando una valutazione sembra completa ma non descrive il lavoro reale?',
        'case','Una nuova fase produttiva viene avviata usando la valutazione della fase precedente perché attrezzature e personale sembrano simili. Quali elementi devono essere rivalutati?',
        'teacher_expansion',jsonb_build_array('0–10 · Pericolo, esposizione e rischio','10–25 · Dati e osservazione del lavoro','25–40 · Criteri e priorità','40–50 · Caso nuova fase','50–60 · Decision map'),
        'common_errors',jsonb_build_array('Confondere presenza del pericolo con livello di rischio.','Riutilizzare valutazioni precedenti senza verificare contesto ed esposizione.'),
        'operational',jsonb_build_object('objective','Costruire una valutazione motivata e utilizzabile per decidere.','step_by_step',jsonb_build_array('Descrivi attività','Individua pericoli','Definisci esposti','Stima e valuta','Decidi misure','Prioritizza','Riesamina')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-risk-cycle.svg','caption','Dal pericolo alla misura e al riesame.'),jsonb_build_object('file','modello-farfalla-rischio.svg','caption','Barriere preventive e protettive lungo la dinamica del rischio.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:strumenti-metodologie','DLR02 · Strumenti e metodologie per individuare e valutare i rischi',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR02','minutes',60,
        'slide_title','Scegliere lo strumento giusto per il rischio che stai analizzando',
        'summary','Checklist, osservazioni, misure, dati storici e metodi specifici hanno funzioni diverse e vanno integrati.',
        'detail','Si distinguono screening, approfondimento, misurazioni e metodi specifici, scegliendo lo strumento in funzione del rischio e della decisione da prendere.',
        'question','Quando una checklist deve diventare il punto di partenza di un approfondimento e non la conclusione?',
        'case','Un sopralluogo non rileva criticità evidenti, ma near miss e segnalazioni mostrano problemi intermittenti nel cambio turno. Come allarghi l’analisi?',
        'teacher_expansion',jsonb_build_array('0–15 · Screening vs approfondimento','15–30 · Osservazioni, interviste e dati','30–45 · Misure e metodi specifici','45–55 · Caso cambio turno','55–60 · Regola di escalation'),
        'common_errors',jsonb_build_array('Usare un solo strumento per qualunque rischio.','Raccogliere dati senza sapere quale decisione devono supportare.'),
        'operational',jsonb_build_object('objective','Selezionare strumenti adeguati e integrare evidenze diverse.','step_by_step',jsonb_build_array('Definisci domanda','Scegli fonti','Scegli metodo','Raccogli evidenze','Confronta','Approfondisci')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-inspection-flow.svg','caption','Osservazione, rilievo, azione e verifica.'),jsonb_build_object('file','piramide-pericoli.svg','caption','Segnali deboli e near miss completano i dati sugli eventi.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:dvr-struttura-contenuti','DLR03 · DVR: struttura, contenuti, misure e programma di miglioramento',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR03','minutes',60,
        'slide_title','Il DVR deve rendere visibili rischi, decisioni e miglioramento',
        'summary','Il DVR collega valutazione, misure, ruoli, programma di miglioramento e criteri di riesame.',
        'detail','Il documento deve rendere tracciabili attività, pericoli, esposti, criteri, misure, responsabilità, scadenze e verifica dell’efficacia.',
        'question','Quali informazioni rendono una misura del DVR realmente governabile nel tempo?',
        'case','Il DVR indica “formare il personale e migliorare la protezione” senza responsabile, priorità, scadenza o criterio di efficacia. Come trasformi la frase in un’azione verificabile?',
        'teacher_expansion',jsonb_build_array('0–15 · Architettura del DVR','15–30 · Criteri e risultati','30–45 · Piano di miglioramento','45–55 · Caso azione generica','55–60 · Scheda decisione'),
        'common_errors',jsonb_build_array('Scambiare il DVR per un archivio di rischi.','Chiudere un’azione perché eseguita senza verificarne l’efficacia.'),
        'operational',jsonb_build_object('objective','Trasformare il DVR in uno strumento di governo.','step_by_step',jsonb_build_array('Rischio','Misura','Owner','Risorsa','Scadenza','Evidenza','Riesame')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-dvr-reading.svg','caption','Leggere il DVR dal rischio alla decisione.'),jsonb_build_object('file','procedura-operativa-5-fasi.svg','caption','Tradurre la misura in sequenza verificabile.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:nearmiss-documentazione','DLR04 · Near miss, dinamiche incidentali, documentazione e procedure semplificate',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR04','minutes',60,
        'slide_title','Imparare dagli eventi prima che diventino infortuni',
        'summary','Near miss, incidenti e anomalie aiutano a riconoscere debolezze del sistema e a correggere cause, non solo comportamenti finali.',
        'detail','Si ricostruiscono sequenze, barriere, fattori organizzativi e azioni correttive, collegandoli alla documentazione tecnico-amministrativa e alle procedure applicabili.',
        'question','Quale differenza c’è tra trovare chi ha sbagliato e individuare perché il sistema ha permesso l’errore?',
        'case','Tre quasi-infortuni avvengono sulla stessa attività in turni diversi. Ogni volta viene fatto un richiamo individuale. Quale analisi manca?',
        'teacher_expansion',jsonb_build_array('0–15 · Near miss e segnali precoci','15–30 · Dinamica incidentale','30–40 · Cause e barriere','40–50 · Documentazione tecnico-amministrativa','50–60 · Caso ripetitivo'),
        'common_errors',jsonb_build_array('Usare il richiamo come unica azione correttiva.','Confondere modulistica semplificata con valutazione semplificata del rischio.'),
        'operational',jsonb_build_object('objective','Usare eventi e documenti per migliorare il sistema.','step_by_step',jsonb_build_array('Raccogli fatti','Ricostruisci sequenza','Individua barriere','Analizza cause','Definisci azioni','Verifica efficacia')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','piramide-pericoli.svg','caption','Anomalie e near miss come segnali anticipatori.'),jsonb_build_object('file','modello-farfalla-rischio.svg','caption','Ricostruire barriere preventive e protettive.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:rischi-operativi-ergonomici','DLR05 · Luoghi, attrezzature, MMC e videoterminali',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR05','minutes',60,
        'slide_title','Leggere i rischi operativi nel modo in cui persone, spazi e attrezzature interagiscono',
        'summary','Luoghi di lavoro, attrezzature, movimentazione manuale e VDT richiedono analisi delle condizioni reali, non categorie isolate.',
        'detail','Il modulo collega requisiti dei luoghi, uso e manutenzione delle attrezzature, ergonomia, movimentazione e postazioni VDT secondo la gerarchia della prevenzione.',
        'question','Quale modifica apparentemente logistica può cambiare più rischi contemporaneamente?',
        'case','Il layout viene compattato per aumentare lo spazio di deposito: cambiano passaggi, movimentazione, accesso alle macchine e postazioni. Come imposti il riesame?',
        'teacher_expansion',jsonb_build_array('0–15 · Luoghi e layout','15–30 · Attrezzature e manutenzione','30–45 · MMC ed ergonomia','45–55 · VDT','55–60 · Caso layout'),
        'common_errors',jsonb_build_array('Valutare una macchina senza considerare ambiente e organizzazione.','Affidare l’ergonomia solo a istruzioni comportamentali.'),
        'operational',jsonb_build_object('objective','Valutare insieme persona, compito, attrezzatura e ambiente.','step_by_step',jsonb_build_array('Mappa','Osserva','Valuta','Riduci alla fonte','Proteggi','Verifica')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-vdt-ergonomia.svg','caption','Adattare la postazione alla persona e al compito.'),jsonb_build_object('file','idea-dpi-hierarchy.svg','caption','Prima eliminazione/riduzione e protezioni collettive, poi DPI per il residuo.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:agenti-rischio','DLR06 · Agenti fisici, sostanze pericolose, biologico e atmosfere esplosive',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR06','minutes',60,
        'slide_title','Rischi specialistici: riconoscere quando serve misurare, approfondire e coinvolgere competenze',
        'summary','Agenti fisici, chimici, biologici e atmosfere esplosive richiedono dati affidabili, metodi specifici e controllo dell’esposizione.',
        'detail','L’obiettivo è riconoscere sorgenti, vie di esposizione, condizioni di innesco o diffusione, documenti tecnici, misure e trigger per il coinvolgimento di competenze qualificate.',
        'question','Quale segnale indica che una valutazione qualitativa non è più sufficiente?',
        'case','Viene introdotto un nuovo prodotto con classificazione diversa e aumenta il tempo di utilizzo. La vecchia valutazione viene lasciata invariata perché la quantità giornaliera sembra bassa. Cosa verifichi?',
        'teacher_expansion',jsonb_build_array('0–15 · Agenti fisici','15–30 · Chimico e cancerogeni','30–40 · Biologico','40–50 · Atmosfere esplosive','50–60 · Caso nuovo prodotto'),
        'common_errors',jsonb_build_array('Usare la stessa logica di stima per rischi che richiedono metodi specifici.','Considerare la sola quantità senza modalità e durata di esposizione.'),
        'operational',jsonb_build_object('objective','Riconoscere i requisiti di approfondimento e governare l’esposizione.','step_by_step',jsonb_build_array('Identifica sorgente','Raccogli dati','Caratterizza esposizione','Scegli metodo','Definisci misure','Verifica')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-bio-chain.svg','caption','Interrompere la catena di esposizione.'),jsonb_build_object('file','video-chemicals.svg','caption','Richiamo visivo alla gestione delle sostanze pericolose.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:psicosociale-misure-dpi','DLR07 · Psicosociale, differenze individuali, misure, DPI e segnaletica',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR07','minutes',60,
        'slide_title','La prevenzione deve funzionare per persone reali e rischi reali',
        'summary','Stress lavoro-correlato, fattori psicosociali e differenze individuali vanno integrati nella valutazione insieme alla gerarchia delle misure.',
        'detail','DPI e segnaletica sono collocati nel sistema complessivo e non sostituiscono interventi alla fonte o protezioni collettive quando praticabili.',
        'question','Quando un problema presentato come comportamentale può essere il segnale di un’organizzazione del lavoro da riesaminare?',
        'case','Aumentano errori e turnover in un reparto con picchi di lavoro, turni variabili e procedure complesse. La risposta proposta è solo un nuovo cartello e un richiamo alla maggiore attenzione. Cosa manca?',
        'teacher_expansion',jsonb_build_array('0–15 · Stress e fattori psicosociali','15–25 · Genere, età, provenienza e gruppi esposti','25–40 · Gerarchia delle misure','40–50 · DPI','50–60 · Segnaletica e caso reparto'),
        'common_errors',jsonb_build_array('Ridurre lo stress a fragilità individuale.','Usare DPI e cartelli per compensare una misura tecnica o organizzativa mancante.'),
        'operational',jsonb_build_object('objective','Integrare persone, organizzazione e gerarchia delle misure.','step_by_step',jsonb_build_array('Analizza','Elimina','Riduci','Proteggi collettivamente','Organizza','Gestisci rischio residuo','Verifica')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-dpi-hierarchy.svg','caption','Gerarchia delle misure e ruolo del DPI.'),jsonb_build_object('file','idea-signs-basic.svg','caption','Segnaletica come supporto a misure già governate.')),
        'quality',jsonb_build_object('score',100,'complete',true,'final_assessment',false))),

    ('dl-rspp:esercitazione-dvr-ateco','DLR08 · Esercitazione: costruzione guidata di un DVR su caso ATECO',60,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2','code','DLR08','minutes',60,
        'slide_title','Dalla descrizione dell’attività a un DVR coerente e verificabile',
        'summary','L’ultima unità integra il percorso su un caso concreto riferito al settore ATECO: attività, pericoli, esposti, valutazione, misure, priorità e programma.',
        'detail','Il docente assegna un caso coerente con il contesto dei partecipanti e guida la costruzione di una sezione di DVR. L’esercitazione resta distinta dalla verifica finale.',
        'question','Quale passaggio rende evidente che il DVR deriva davvero dal caso concreto e non da un modello standard?',
        'case','Azienda con attività principale definita, reparti, lavorazioni, attrezzature, sostanze, turni, appalto di manutenzione e tre near miss recenti. Costruisci la mappa minima dal processo alle misure e al riesame.',
        'teacher_expansion',jsonb_build_array('0–10 · Presentazione caso ATECO','10–20 · Processi, attività, esposti','20–35 · Pericoli e valutazione','35–50 · Misure e programma','50–57 · Confronto gruppi','57–60 · Debrief'),
        'common_errors',jsonb_build_array('Partire dal catalogo dei rischi invece che dalle attività.','Produrre un DVR formalmente completo ma privo di decisioni verificabili.'),
        'operational',jsonb_build_object('objective','Applicare in modo integrato il processo di valutazione.','step_by_step',jsonb_build_array('Contesto','Attività','Pericoli','Esposti','Valutazione','Misure','Programma','Riesame')),
        'idea_images',jsonb_build_array(jsonb_build_object('file','idea-dvr-reading.svg','caption','Dal contesto alla valutazione e alle misure.'),jsonb_build_object('file','idea-risk-cycle.svg','caption','Il ciclo si chiude solo con verifica e riesame.')),
        'quality',jsonb_build_object('score',100,'complete',true,'exercise',true,'final_assessment',false)))
  ) x(stable_key,title,minutes,content)
  loop
    insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    values(
      r.stable_key,r.title,r.content->>'summary',r.minutes,'dl_rspp_common',
      array['dl-rspp','asr-2025','common','art-34'],true,
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2',
        'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
        'internal_didactic_allocation',true,
        'statutory_per_topic_duration',false
      )
    )
    on conflict (stable_key) do update set
      title=excluded.title,
      summary=excluded.summary,
      default_minutes=excluded.default_minutes,
      source_group=excluded.source_group,
      tags=excluded.tags,
      active=true,
      metadata=public.learning_units.metadata||excluded.metadata,
      updated_at=now()
    returning id into v_lu_id;

    insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
    values(v_lu_id,1,'published',r.content,now())
    on conflict (learning_unit_id,version_number) do update set
      status='published',
      content=excluded.content,
      published_at=coalesce(public.learning_unit_versions.published_at,now());
  end loop;

  select id into v_course_id from public.courses where stable_key='dl_spp_comune';
  if v_course_id is not null then
    update public.courses
    set metadata=metadata||jsonb_build_object(
      'didactic_preview_version','dl-rspp-common-v2',
      'didactic_atomic_units',8,
      'didactic_macro_blocks',3,
      'didactic_focus','risk_assessment_and_prevention_protection',
      'minimum_minutes',480,
      'attendance_min_pct',90,
      'prerequisite_course_key','dl_base',
      'classroom_allowed',true,
      'vcs_allowed',true,
      'elearning_asynchronous_allowed',false,
      'delivery_constraint','synchronous_or_classroom',
      'final_verification','test_or_interview',
      'test_min_questions',30,
      'test_min_options',3,
      'test_passing_score_pct',70,
      'final_verification_outside_didactic_units',true,
      'sector_modules_separate',true,
      'final_test_builder_paused',true,
      'learner_catalog_hidden',true,
      'internal_didactic_allocation',true,
      'statutory_per_topic_duration',false
    ), updated_at=now()
    where id=v_course_id;

    insert into public.course_versions(course_id,version_number,status,syllabus_snapshot,normative_snapshot)
    values(
      v_course_id,2,'draft',
      jsonb_build_object(
        'didactic_version','dl-rspp-common-v2',
        'purpose','technical_operational_competences_for_direct_spp_tasks',
        'macro_blocks',jsonb_build_array(
          jsonb_build_object('key','dlr-a','title','Processo di valutazione dei rischi','minutes',240),
          jsonb_build_object('key','dlr-b','title','Fattori di rischio e misure di prevenzione/protezione','minutes',180),
          jsonb_build_object('key','dlr-c','title','Esercitazione DVR riferita al settore ATECO','minutes',60)
        ),
        'atomic_learning_units',8,
        'total_minutes',480,
        'official_module_mapping',jsonb_build_object(
          'processo_valutazione_rischi',jsonb_build_array('dlr-a'),
          'fattori_rischio_misure',jsonb_build_array('dlr-b'),
          'esercitazione_dvr',jsonb_build_array('dlr-c')
        ),
        'internal_didactic_allocation',true,
        'statutory_per_module_duration',false,
        'sector_modules_separate',true,
        'final_assessment_in_scope',false
      ),
      jsonb_build_object(
        'basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; art. 34 d.lgs. 81/2008',
        'prerequisite_course_key','dl_base',
        'minimum_minutes',480,
        'attendance_min_pct',90,
        'delivery',jsonb_build_object('classroom',true,'vcs',true,'elearning_asynchronous',false),
        'verification',jsonb_build_object('mode','test_or_interview','test_min_questions',30,'test_min_options',3,'passing_score_pct',70),
        'sector_modules_separate',true,
        'refresher',jsonb_build_object('interval_months',60,'minimum_minutes',480,'include_sector_topics_when_still_applicable',true)
      )
    )
    on conflict (course_id,version_number) do update set
      status='draft',
      syllabus_snapshot=excluded.syllabus_snapshot,
      normative_snapshot=excluded.normative_snapshot
    returning id into v_course_version_id;

    delete from public.course_module_units
    where module_id in (select id from public.course_modules where course_version_id=v_course_version_id);
    delete from public.course_modules where course_version_id=v_course_version_id;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'dlr-a','DLR-A · Processo di valutazione dei rischi',0,240)
    returning id into v_module_id;

    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,
      jsonb_build_object('didactic_version','dl-rspp-common-v2','final_assessment',false)
    from (values
      ('dl-rspp:processo-valutazione',1),
      ('dl-rspp:strumenti-metodologie',2),
      ('dl-rspp:dvr-struttura-contenuti',3),
      ('dl-rspp:nearmiss-documentazione',4)
    ) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key
    join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'dlr-b','DLR-B · Fattori di rischio e misure di prevenzione/protezione',240,180)
    returning id into v_module_id;

    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,
      jsonb_build_object('didactic_version','dl-rspp-common-v2','final_assessment',false)
    from (values
      ('dl-rspp:rischi-operativi-ergonomici',1),
      ('dl-rspp:agenti-rischio',2),
      ('dl-rspp:psicosociale-misure-dpi',3)
    ) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key
    join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'dlr-c','DLR-C · Esercitazione DVR riferita al settore ATECO',420,60)
    returning id into v_module_id;

    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,1,true,0,true,
      jsonb_build_object('didactic_version','dl-rspp-common-v2','exercise',true,'final_assessment',false)
    from public.learning_units lu
    join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=1
    where lu.stable_key='dl-rspp:esercitazione-dvr-ateco';
  end if;

  update public.training_blueprints
  set metadata=metadata||jsonb_build_object(
      'didactic_version','dl-rspp-common-v2',
      'didactic_atomic_units',8,
      'didactic_macro_blocks',3,
      'prerequisite_course_key','dl_base',
      'attendance_min_pct',90,
      'sector_modules_separate',true,
      'final_assessment_outside_learning_units',true
    ),
    updated_at=now()
  where stable_key='dl_spp_common';
end
$do$;
