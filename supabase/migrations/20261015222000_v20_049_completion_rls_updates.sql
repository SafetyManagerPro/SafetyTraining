-- SafetyTraining v20.049
-- Reconciliation snapshot: aggiornamenti RLS 4h e 8h completati direttamente nel DB live.
-- Le prime quattro LU sono riutilizzate da entrambi i percorsi; il corso 8h aggiunge quattro LU di approfondimento.
-- Durata annuale minima modellata secondo art. 37 c.11, con verifica della contrattazione collettiva applicabile.
-- Versioni draft / learner-hidden; Test Builder finale sospeso.

DO $do$
DECLARE
  rec jsonb;
  v_lu uuid;
  v_luv uuid;
  v_course uuid;
  v_cv uuid;
  v_module uuid;
  v_content jsonb;
BEGIN
  FOR rec IN SELECT value FROM jsonb_array_elements($specs$
  [
    {"key":"update:rls:changes","position":1,"scope":"core","title":"Novità, cambiamenti e consultazione RLS","summary":"Aggiornare il RLS sui cambiamenti normativi e aziendali e tradurli in domande di consultazione concrete.","case":"L’azienda cambia turnazione e layout: il RLS prepara le domande per la consultazione collegando cambiamenti, rischi, gruppi esposti e misure.","norm":"D.Lgs. 81/2008 artt. 37 c.11 e 50; contrattazione collettiva applicabile.","focus":["attribuzioni art.50","consultazione","cambiamenti","documentazione","proposte"],"detail":"Il RLS deve distinguere informazione, consultazione e proposta. Ogni cambiamento rilevante va letto chiedendo: quali lavoratori sono coinvolti, quali rischi cambiano, quali misure sono previste, quali evidenze ne dimostrano l’efficacia e quando il RLS deve essere consultato.","procedure":["raccogliere il cambiamento in termini di attività e persone esposte","richiedere dati e documenti pertinenti alla funzione","formulare osservazioni specifiche e motivate","tracciare esito e follow-up della consultazione"],"errors":["ridurre il ruolo RLS a raccolta lamentele","confondere consultazione con potere decisionale","presentare osservazioni generiche senza evidenze","non verificare l’esito delle proposte"]},
    {"key":"update:rls:dvr-events","position":2,"scope":"core","title":"DVR, rischi attuali, infortuni e near miss","summary":"Leggere DVR ed eventi per individuare scostamenti tra rischio previsto e lavoro reale.","case":"Tre quasi incidenti avvengono nello stesso incrocio interno: il RLS costruisce una proposta basata su esposizione, traffico, visibilità e misure tecniche/organizzative.","norm":"D.Lgs. 81/2008 artt. 28, 29, 37, 50.","focus":["DVR","rischi specifici","incidenti","near miss","misure"],"detail":"Il RLS usa DVR, segnalazioni, infortuni, malattie professionali e near miss come fonti diverse. L’obiettivo non è rifare la valutazione al posto del datore di lavoro, ma individuare domande, evidenze e proposte che aiutino a verificare adeguatezza delle misure.","procedure":["collegare evento a rischio e barriera prevista","verificare se persone o attività sono cambiate","chiedere quali azioni sono state decise e con quali tempi","controllare se la misura è stata verificata dopo l’attuazione"],"errors":["limitarsi al numero di infortuni","ignorare i quasi incidenti","presumere che il DVR descriva sempre il lavoro reale","formulare accuse invece di osservazioni verificabili"]},
    {"key":"update:rls:measures","position":3,"scope":"core","title":"Misure, sorveglianza, appalti ed emergenze","summary":"Verificare coerenza delle misure di prevenzione nei principali processi aziendali.","case":"Un’impresa esterna blocca periodicamente una via interna durante la manutenzione: il RLS analizza interferenze, esodo, comunicazione e coordinamento.","norm":"D.Lgs. 81/2008 artt. 26, 41, 43-46, 50; contrattazione applicabile.","focus":["gerarchia misure","DPI","sorveglianza sanitaria","appalti","emergenze"],"detail":"Il RLS deve saper leggere una misura come sistema: eliminazione/riduzione del rischio, protezioni collettive, organizzazione, DPI, sorveglianza sanitaria quando prevista ed emergenze. Negli appalti osserva anche le interferenze e l’effettivo coordinamento fra organizzazioni.","procedure":["verificare se la misura agisce sulla causa o solo sulla conseguenza","osservare l’applicabilità reale della procedura","raccogliere feedback dei lavoratori senza trattare dati sanitari riservati","portare in consultazione criticità ricorrenti di appalti ed emergenze"],"errors":["chiedere dati sanitari individuali non dovuti","considerare il DPI unica misura possibile","ignorare imprese esterne nelle osservazioni","valutare un piano di emergenza solo sulla carta"]},
    {"key":"update:rls:communication","position":4,"scope":"core","title":"Comunicazione, proposta e piano annuale di miglioramento","summary":"Trasformare osservazioni e segnalazioni in proposte chiare, prioritarie e verificabili.","case":"Preparare per la riunione periodica una scheda su tre criticità: evidenza, persone esposte, misura proposta, priorità e indicatore di chiusura.","norm":"D.Lgs. 81/2008 artt. 35, 37 c.11, 50; contrattazione collettiva applicabile.","focus":["tecnica della comunicazione","segnalazioni","riunione periodica","proposte","follow-up"],"detail":"Una buona segnalazione RLS descrive il fatto, chi è esposto, quale rischio è plausibile, quale misura esiste e cosa si propone di verificare o migliorare. Il modulo allena il passaggio da problema generico a proposta tracciabile con priorità, interlocutore e follow-up.","procedure":["descrivere fatti osservabili","separare urgenza da importanza","proporre una misura o una richiesta di verifica concreta","definire quando e con quali evidenze riesaminare il tema"],"errors":["usare formulazioni vaghe","accumulare segnalazioni senza priorità","confondere conflitto personale e rischio","non chiudere il ciclo con un follow-up"]},
    {"key":"update:rls:contractors","position":5,"scope":"extra","title":"Appalti, cambiamento e rischi interferenziali","summary":"Approfondire la lettura RLS di appalti, cambiamenti e lavori non routinari.","case":"Durante una fermata impianto cambiano aree e orari rispetto al piano iniziale: il RLS ricostruisce quali nuove interferenze vanno segnalate.","norm":"D.Lgs. 81/2008 artt. 26 e 50.","focus":["appalti","DUVRI ove applicabile","interferenze","fermate","cambiamenti"],"detail":"Il RLS osserva come rischi e misure si combinano quando più organizzazioni lavorano nello stesso luogo. Il focus è su informazioni, sequenze, segregazioni, emergenze e cambiamenti rispetto a quanto pianificato.","procedure":["identificare lavorazioni contemporanee","verificare se le interferenze previste corrispondono al lavoro reale","raccogliere segnalazioni prima e durante l’attività","portare tempestivamente variazioni significative al sistema di prevenzione"],"errors":["guardare solo i rischi della propria azienda","considerare invariata un’attività che cambia sequenza","attendere la riunione periodica per una criticità urgente","confondere coordinamento con semplice consegna documenti"]},
    {"key":"update:rls:health-organization","position":6,"scope":"extra","title":"Salute, organizzazione, stress, violenze e inclusione","summary":"Approfondire rischi organizzativi e tutela della salute nel rispetto dei ruoli e della riservatezza.","case":"Aumentano aggressioni verbali e assenze in un front office: il RLS costruisce domande su carichi, organizzazione, procedure e misure senza trattare dati sanitari personali.","norm":"D.Lgs. 81/2008 artt. 28, 41, 50; principi di riservatezza.","focus":["stress lavoro correlato","violenza e molestie","turni","fragilità e inclusione","privacy sanitaria"],"detail":"Il RLS non formula diagnosi né tratta dati sanitari individuali; osserva condizioni organizzative, carichi, turni, conflitti, episodi di violenza o molestia e segnali collettivi utili alla valutazione e alle misure preventive.","procedure":["raccogliere elementi organizzativi e non diagnosi individuali","distinguere episodio da pattern ricorrente","segnalare fattori che possono richiedere valutazione o misura","verificare informazione, canali di supporto e prevenzione"],"errors":["chiedere diagnosi dei colleghi","ridurre tutto alla resilienza individuale","ignorare eventi relazionali perché non causano lesioni immediate","diffondere dettagli riservati"]},
    {"key":"update:rls:audit","position":7,"scope":"extra","title":"Vigilanza, ispezioni, audit e modelli organizzativi","summary":"Comprendere come usare esiti di audit e vigilanza per la funzione di rappresentanza.","case":"Un audit trova ripetute carenze di manutenzione su protezioni: il RLS prepara domande su cause, piano, priorità e verifica dell’efficacia.","norm":"D.Lgs. 81/2008 artt. 50 e sistema istituzionale di vigilanza.","focus":["organi di vigilanza","audit","prescrizioni","MOG","azioni correttive"],"detail":"Verbali, prescrizioni, audit e indicatori possono evidenziare debolezze del sistema. Il RLS deve leggere i temi pertinenti, distinguere obbligo, raccomandazione e miglioramento e seguire le azioni senza assumere compiti gestionali che non gli competono.","procedure":["individuare tema e rischio sottostante","chiedere stato e scadenza delle azioni pertinenti","verificare il coinvolgimento dei lavoratori quando utile","seguire l’efficacia e non solo la chiusura formale"],"errors":["sostituirsi a RSPP o datore di lavoro","considerare chiusa una criticità solo perché esiste un documento","diffondere informazioni riservate senza motivo","usare l’audit come strumento punitivo personale"]},
    {"key":"update:rls:workshop","position":8,"scope":"extra","title":"Workshop annuale: priorità e piano di miglioramento","summary":"Integrare dati, osservazioni e consultazione in un piano annuale RLS di temi prioritari.","case":"Da dieci segnalazioni dell’anno selezionare tre priorità e costruire per ciascuna una scheda di rappresentanza completa.","norm":"D.Lgs. 81/2008 artt. 35, 37 c.11, 50; contrattazione collettiva applicabile.","focus":["prioritizzazione","piano annuale","riunione periodica","indicatori","follow-up"],"detail":"Il workshop finale organizza le evidenze dell’anno in poche priorità. Per ogni tema il RLS definisce fatto, rischio, persone esposte, misura o domanda, interlocutore, urgenza e follow-up. Non è un piano gestionale aziendale, ma uno strumento per esercitare in modo ordinato le attribuzioni di rappresentanza.","procedure":["selezionare temi con evidenze e impatto","formulare proposte realistiche e verificabili","preparare contributi per consultazioni e riunione periodica","programmare follow-up e comunicazione ai lavoratori"],"errors":["creare una lista infinita senza priorità","promettere risultati che il RLS non può decidere","non distinguere urgenze immediate da miglioramenti","non restituire ai lavoratori lo stato delle segnalazioni"]}
  ]
  $specs$::jsonb)
  LOOP
    v_content := jsonb_build_object(
      'case',rec->>'case','norm',rec->>'norm',
      'quiz',jsonb_build_object(
        'options',jsonb_build_array('Continuare con maggiore attenzione','Ignorare se non è ancora accaduto un infortunio','Riconoscere lo scostamento, applicare il proprio ruolo, segnalare/intervenire e verificare il ripristino','Aspettare il prossimo corso'),
        'question','Qual è il comportamento più efficace quando una misura o una condizione di lavoro non corrisponde più a quanto previsto?',
        'explanation','L’aggiornamento serve a riconoscere cambiamenti e scostamenti e ad attivare tempestivamente il ruolo previsto, non a normalizzare condizioni diverse da quelle valutate.',
        'correct_index',2),
      'focus',rec->'focus','title',rec->>'title','detail',rec->>'detail','minutes',60,
      'quality',jsonb_build_object('learner_ready',true,'teacher_ready',true,'scenario_based',true),
      'summary',rec->>'summary','visuals',jsonb_build_array('modello-farfalla-rischio.svg','stop-segnala-ripristina.svg','procedura-operativa-5-fasi.svg'),
      'procedure',rec->'procedure',
      'objectives',jsonb_build_array('comprendere il perché delle misure e non solo ricordarne il nome','applicare il contenuto a una situazione concreta','riconoscere una condizione che richiede segnalazione o stop','proporre o applicare un follow-up verificabile'),
      'common_errors',rec->'errors',
      'delivery_note','Il contenuto didattico resta integralmente disponibile a docente e corsista; eventuali regole sulla modalità di erogazione sono metadata organizzativi e non riducono il materiale consultabile.',
      'guided_activity',jsonb_build_array('presentare uno scenario incompleto e chiedere quali informazioni mancano','far individuare almeno una barriera tecnica/organizzativa e una comportamentale','far formulare una segnalazione o decisione in forma concreta','chiudere con feedback: cosa fare, chi coinvolgere, come verificare'),
      'didactic_version','completion-v2','final_assessment',false,
      'teacher_expansion','Usare un caso reale o plausibile dell’organizzazione. Prima far descrivere i fatti, poi chiedere rischio, barriera, decisione e verifica. Evitare lezioni solo frontali: almeno un terzo del tempo deve essere dedicato ad analisi guidata, confronto, documenti o simulazione decisionale coerente con il ruolo.'
    );

    INSERT INTO public.learning_units(owner_organization_id,stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    VALUES(NULL,rec->>'key',rec->>'title',rec->>'summary',60,'SafetyTraining completion-v2',
      ARRAY['safetytraining','update','completion-v2',CASE WHEN rec->>'scope'='core' THEN 'agg_rls_4h' ELSE 'agg_rls_8h' END],true,
      jsonb_build_object('learner_ready',true,'teacher_ready',true,'didactic_version','completion-v2'))
    ON CONFLICT(stable_key) DO UPDATE SET title=excluded.title,summary=excluded.summary,default_minutes=60,source_group=excluded.source_group,
      tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now();
    SELECT id INTO v_lu FROM public.learning_units WHERE stable_key=rec->>'key';

    INSERT INTO public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
    VALUES(v_lu,1,'draft',v_content,NULL,NULL)
    ON CONFLICT(learning_unit_id,version_number) DO UPDATE SET status='draft',content=excluded.content,content_hash=NULL,published_at=NULL;
  END LOOP;

  -- 4-hour annual update: shared core only.
  INSERT INTO public.courses(owner_organization_id,stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
  VALUES(NULL,'agg_rls_4h','Aggiornamento RLS (4h - Imprese 15-50 dip.)','RLS','Aggiornamento annuale RLS con nucleo comune di quattro Learning Unit.',240,'internal_learning',true,
    jsonb_build_object('blueprint_key','rls_update','variant_key','4h','employee_band','15-50','renewal_interval_months',12,
      'delivery_constraint','collective_bargaining_or_applicable_rules','requires_collective_bargaining_check',true,
      'didactic_version','completion-v2','material_complete',true,'composition_version','v20_049','requires_admin_review',true,
      'learner_catalog_hidden',true,'learner_material_complete',true,'teacher_material_complete',true,'delivery_rules_are_metadata_only',true))
  ON CONFLICT(stable_key) DO UPDATE SET title=excluded.title,family='RLS',nominal_minutes=240,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now();
  SELECT id INTO v_course FROM public.courses WHERE stable_key='agg_rls_4h';
  INSERT INTO public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot,published_at)
  VALUES(v_course,1,'draft','2026-10-14',jsonb_build_object('didactic_version','completion-v2','material_minutes',240,'learning_unit_count',4,'material_complete',true),
    jsonb_build_object('basis','D.Lgs. 81/2008 art. 37 comma 11','minimum_minutes',240,'renewal_interval_months',12,'employee_band','15-50','collective_bargaining_check',true),NULL)
  ON CONFLICT(course_id,version_number) DO UPDATE SET status='draft',syllabus_snapshot=public.course_versions.syllabus_snapshot||excluded.syllabus_snapshot,
    normative_snapshot=public.course_versions.normative_snapshot||excluded.normative_snapshot,published_at=NULL;
  SELECT id INTO v_cv FROM public.course_versions WHERE course_id=v_course AND version_number=1;
  INSERT INTO public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
  VALUES(v_cv,'agg-rls-core','Aggiornamento annuale RLS: nucleo comune',1,240)
  ON CONFLICT(course_version_id,module_key) DO UPDATE SET title=excluded.title,position=1,nominal_minutes=240;
  SELECT id INTO v_module FROM public.course_modules WHERE course_version_id=v_cv AND module_key='agg-rls-core';
  INSERT INTO public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
  SELECT v_module,luv.id,x.pos,true,0,true,'{"material_complete":true,"scenario_required":true}'::jsonb
  FROM (VALUES ('update:rls:changes',1),('update:rls:dvr-events',2),('update:rls:measures',3),('update:rls:communication',4)) x(k,pos)
  JOIN public.learning_units lu ON lu.stable_key=x.k
  JOIN public.learning_unit_versions luv ON luv.learning_unit_id=lu.id AND luv.version_number=1
  ON CONFLICT(module_id,unit_version_id) DO UPDATE SET position=excluded.position,required=true,min_active_seconds=0,requires_comprehension=true,completion_rules=excluded.completion_rules;

  -- 8-hour annual update: same shared core + four extra units.
  INSERT INTO public.courses(owner_organization_id,stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
  VALUES(NULL,'agg_rls_8h','Aggiornamento RLS (8h - Imprese >50 dip.)','RLS','Aggiornamento annuale RLS: nucleo comune di 4h più approfondimento di 4h.',480,'internal_learning',true,
    jsonb_build_object('blueprint_key','rls_update','variant_key','8h','employee_band','>50','renewal_interval_months',12,
      'delivery_constraint','collective_bargaining_or_applicable_rules','requires_collective_bargaining_check',true,
      'didactic_version','completion-v2','material_complete',true,'composition_version','v20_049','requires_admin_review',true,
      'learner_catalog_hidden',true,'learner_material_complete',true,'teacher_material_complete',true,'delivery_rules_are_metadata_only',true,'reuses_rls_4h_core',true))
  ON CONFLICT(stable_key) DO UPDATE SET title=excluded.title,family='RLS',nominal_minutes=480,active=true,metadata=public.courses.metadata||excluded.metadata,updated_at=now();
  SELECT id INTO v_course FROM public.courses WHERE stable_key='agg_rls_8h';
  INSERT INTO public.course_versions(course_id,version_number,status,effective_from,syllabus_snapshot,normative_snapshot,published_at)
  VALUES(v_course,1,'draft','2026-10-14',jsonb_build_object('didactic_version','completion-v2','material_minutes',480,'learning_unit_count',8,'material_complete',true,'reuses_rls_4h_core',true),
    jsonb_build_object('basis','D.Lgs. 81/2008 art. 37 comma 11','minimum_minutes',480,'renewal_interval_months',12,'employee_band','>50','collective_bargaining_check',true),NULL)
  ON CONFLICT(course_id,version_number) DO UPDATE SET status='draft',syllabus_snapshot=public.course_versions.syllabus_snapshot||excluded.syllabus_snapshot,
    normative_snapshot=public.course_versions.normative_snapshot||excluded.normative_snapshot,published_at=NULL;
  SELECT id INTO v_cv FROM public.course_versions WHERE course_id=v_course AND version_number=1;

  INSERT INTO public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
  VALUES(v_cv,'agg-rls-core','Aggiornamento annuale RLS: nucleo comune',1,240)
  ON CONFLICT(course_version_id,module_key) DO UPDATE SET title=excluded.title,position=1,nominal_minutes=240;
  SELECT id INTO v_module FROM public.course_modules WHERE course_version_id=v_cv AND module_key='agg-rls-core';
  INSERT INTO public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
  SELECT v_module,luv.id,x.pos,true,0,true,'{"material_complete":true,"scenario_required":true}'::jsonb
  FROM (VALUES ('update:rls:changes',1),('update:rls:dvr-events',2),('update:rls:measures',3),('update:rls:communication',4)) x(k,pos)
  JOIN public.learning_units lu ON lu.stable_key=x.k
  JOIN public.learning_unit_versions luv ON luv.learning_unit_id=lu.id AND luv.version_number=1
  ON CONFLICT(module_id,unit_version_id) DO UPDATE SET position=excluded.position,required=true,min_active_seconds=0,requires_comprehension=true,completion_rules=excluded.completion_rules;

  INSERT INTO public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
  VALUES(v_cv,'agg-rls-extra','Approfondimento RLS per aggiornamento 8 ore',2,240)
  ON CONFLICT(course_version_id,module_key) DO UPDATE SET title=excluded.title,position=2,nominal_minutes=240;
  SELECT id INTO v_module FROM public.course_modules WHERE course_version_id=v_cv AND module_key='agg-rls-extra';
  INSERT INTO public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
  SELECT v_module,luv.id,x.pos,true,0,true,'{"material_complete":true,"scenario_required":true}'::jsonb
  FROM (VALUES ('update:rls:contractors',5),('update:rls:health-organization',6),('update:rls:audit',7),('update:rls:workshop',8)) x(k,pos)
  JOIN public.learning_units lu ON lu.stable_key=x.k
  JOIN public.learning_unit_versions luv ON luv.learning_unit_id=lu.id AND luv.version_number=1
  ON CONFLICT(module_id,unit_version_id) DO UPDATE SET position=excluded.position,required=true,min_active_seconds=0,requires_comprehension=true,completion_rules=excluded.completion_rules;
END $do$;
