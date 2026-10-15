-- SafetyTraining v20.048
-- Reconciliation snapshot: aggiornamenti Lavoratori, Preposti e Dirigenti completati direttamente nel DB live.
-- Source of truth: Learning Unit source_group = SafetyTraining completion-v2, audited 2026-10-15.
-- Tutte le versioni restano draft / learner-hidden. Il Test Builder finale resta sospeso.

DO $do$
DECLARE
  rec jsonb;
  v_lu uuid;
  v_luv uuid;
  v_course uuid;
  v_cv uuid;
  v_module uuid;
  v_content jsonb;
  v_group text;
BEGIN
  FOR rec IN SELECT value FROM jsonb_array_elements($specs$
  [
    {
      "group":"worker","course_key":"agg_lav","course_title":"Aggiornamento Lavoratori - 6h","family":"Lavoratori","module_key":"agg-worker","module_title":"Aggiornamento lavoratori: rischi, cambiamenti e comportamenti","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:worker:changes","position":1,"title":"Cambiamenti, rischi e segnali deboli","summary":"Riconoscere come cambiamenti di mansione, processo, attrezzatura, ambiente o organizzazione possono modificare il rischio.","case":"Un reparto modifica il percorso dei materiali e una nuova interferenza pedone-mezzo compare in un punto prima libero: il corsista deve individuare il cambiamento, il rischio creato e la misura immediata e strutturale.","norm":"D.Lgs. 81/2008 art. 37; Accordo Stato-Regioni 17/04/2025: aggiornamento lavoratori almeno 6 ore ogni 5 anni e in relazione all’evoluzione/cambiamento dei rischi.","focus":["cambiamenti del lavoro","pericolo-rischio-danno","near miss","segnali deboli","diritto-dovere di segnalazione"],"detail":"L’aggiornamento del lavoratore parte da ciò che è cambiato. Anche modifiche apparentemente piccole possono rendere insufficiente una procedura precedente: nuova macchina, sostanza, layout, turnazione, appalto, software, flusso logistico o evento anomalo. Il lavoratore deve saper riconoscere il cambiamento, confrontarlo con le misure note e segnalare tempestivamente ciò che non è coerente.","procedure":["confrontare la situazione attuale con quella per cui si è stati formati","individuare ciò che cambia esposizione, probabilità o gravità","verificare procedura, protezioni e istruzioni aggiornate","fermare e segnalare quando la condizione non è prevista o controllata"],"errors":["normalizzare una modifica perché sembra piccola","continuare per abitudine senza verificare la procedura","segnalare solo dopo un infortunio","confondere assenza di danno con assenza di rischio"]
    },
    {
      "group":"worker","course_key":"agg_lav","course_title":"Aggiornamento Lavoratori - 6h","family":"Lavoratori","module_key":"agg-worker","module_title":"Aggiornamento lavoratori: rischi, cambiamenti e comportamenti","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:worker:measures","position":2,"title":"Misure, procedure, DPI e comportamento sicuro","summary":"Rafforzare la capacità di applicare correttamente misure collettive, procedure, DPI e criteri di stop.","case":"Una protezione di macchina ostacola una lavorazione urgente e viene proposto di rimuoverla per pochi minuti: il corsista deve identificare perché la soluzione è inaccettabile e quale percorso decisionale seguire.","norm":"D.Lgs. 81/2008 Titolo I e art. 37; contenuti aggiornati in funzione dei rischi reali e delle misure aziendali.","focus":["gerarchia delle misure","protezioni collettive","procedure operative","DPI","emergenze"],"detail":"La prevenzione efficace segue una gerarchia: eliminare o ridurre il pericolo alla fonte, usare misure tecniche e collettive, organizzare il lavoro e ricorrere ai DPI per il rischio residuo. Il lavoratore deve distinguere ciò che è una barriera di sistema da ciò che dipende dal proprio comportamento e non deve mai compensare una misura mancante con sola attenzione.","procedure":["verificare che le protezioni previste siano presenti e funzionanti","seguire la procedura nella sequenza prevista","scegliere e usare DPI coerenti con rischio e istruzioni","interrompere se una barriera essenziale manca o viene neutralizzata"],"errors":["usare il DPI come sostituto di una protezione collettiva","rimuovere protezioni per velocizzare il lavoro","improvvisare una procedura diversa senza autorizzazione","riutilizzare DPI danneggiati o incompatibili"]
    },
    {
      "group":"worker","course_key":"agg_lav","course_title":"Aggiornamento Lavoratori - 6h","family":"Lavoratori","module_key":"agg-worker","module_title":"Aggiornamento lavoratori: rischi, cambiamenti e comportamenti","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:worker:current-risks","position":3,"title":"Rischi attuali, interferenze ed emergenze","summary":"Applicare la lettura del rischio a situazioni trasversali e specifiche dell’attività, con attenzione a interferenze ed emergenze.","case":"Durante una manutenzione entra una ditta esterna mentre l’attività ordinaria continua: il corsista deve individuare interferenze, informazioni da condividere e condizioni che richiedono coordinamento o stop.","norm":"D.Lgs. 81/2008 artt. 26, 36, 37 e parti speciali applicabili ai rischi presenti; DVR e procedure aziendali.","focus":["rischi specifici del DVR","interferenze","viabilità interna","emergenze","fattori ergonomici e organizzativi"],"detail":"Il modulo usa il DVR, le mansioni e gli eventi dell’azienda per selezionare i rischi effettivamente presenti. La base didattica copre rischi meccanici, elettrici, cadute, movimentazione, agenti fisici/chimici/biologici, viabilità, ergonomia e fattori organizzativi; il docente sostituisce o approfondisce gli scenari in funzione del contesto reale.","procedure":["leggere il rischio a partire dal compito concreto","identificare chi può essere esposto oltre all’esecutore","definire barriera preventiva e risposta se la barriera fallisce","conoscere allarme, esodo, chiamata e comportamento in emergenza"],"errors":["trattare tutti i reparti come se avessero gli stessi rischi","ignorare appalti o lavorazioni contemporanee","confondere addestramento specialistico con semplice informazione","non aggiornare il comportamento dopo una modifica del DVR"]
    },
    {
      "group":"worker","course_key":"agg_lav","course_title":"Aggiornamento Lavoratori - 6h","family":"Lavoratori","module_key":"agg-worker","module_title":"Aggiornamento lavoratori: rischi, cambiamenti e comportamenti","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:worker:lessons","position":4,"title":"Infortuni, near miss e scenario integrato","summary":"Usare eventi, quasi-eventi e osservazioni per migliorare comportamento e sistema di prevenzione.","case":"Un oggetto cade da uno scaffale senza colpire nessuno: ricostruire cause, barriere, esposizione potenziale, segnalazione e azioni correttive, includendo chi verifica il risultato.","norm":"D.Lgs. 81/2008 art. 37; Accordo Stato-Regioni 17/04/2025; sistema aziendale di segnalazione e miglioramento.","focus":["analisi eventi","barriere","comunicazione","azioni correttive","verifica dell’efficacia"],"detail":"Un near miss è utile solo se viene trasformato in apprendimento. L’analisi deve evitare la ricerca del colpevole e ricostruire cosa è successo, quali condizioni hanno favorito l’evento, quali barriere mancavano o non hanno funzionato e quale azione riduce la probabilità di ripetizione. Il lavoratore contribuisce con segnalazioni chiare e verificabili.","procedure":["descrivere fatti e condizioni senza supposizioni inutili","distinguere causa immediata da fattori organizzativi","proporre una misura concreta e verificabile","controllare nel tempo se la misura ha funzionato"],"errors":["limitarsi a dire “errore umano”","nascondere un quasi incidente perché non ci sono danni","proporre solo richiami generici a fare attenzione","chiudere l’azione senza verificarne l’efficacia"]
    },

    {
      "group":"preposto","course_key":"agg_prep","course_title":"Aggiornamento Preposto - 6h","family":"Ruoli della prevenzione","module_key":"agg-preposto","module_title":"Aggiornamento preposti: vigilare, intervenire, comunicare","delivery":"synchronous_or_classroom",
      "unit_key":"update:preposto:role","position":1,"title":"Ruolo del preposto e cambiamenti organizzativi","summary":"Aggiornare la lettura del ruolo, degli obblighi e delle relazioni operative del preposto.","case":"Una nuova attrezzatura viene introdotta in reparto ma le abitudini operative restano quelle precedenti: il preposto deve individuare cosa verificare prima dell’uso ordinario.","norm":"D.Lgs. 81/2008 artt. 19 e 37; Accordo Stato-Regioni 17/04/2025.","focus":["ruolo e obblighi","organizzazione","nuovi rischi","cooperazione","flussi informativi"],"detail":"Il preposto sovrintende e vigila sull’osservanza delle disposizioni aziendali e sull’uso dei mezzi di protezione. L’aggiornamento deve collegare la norma alla realtà: nuove squadre, appalti, tecnologie, procedure o rischi modificano ciò che va osservato e come va organizzata la vigilanza.","procedure":["conoscere le direttive e procedure applicabili alla squadra","osservare cambiamenti che rendono le misure non più adeguate","trasmettere informazioni utili a dirigente/datoredilavoro/RSPP","verificare che i lavoratori abbiano condizioni e competenze per operare"],"errors":["considerare la vigilanza un controllo occasionale","accettare prassi difformi perché consolidate","assumere compiti tecnici senza poteri o informazioni","non comunicare criticità ricorrenti"]
    },
    {
      "group":"preposto","course_key":"agg_prep","course_title":"Aggiornamento Preposto - 6h","family":"Ruoli della prevenzione","module_key":"agg-preposto","module_title":"Aggiornamento preposti: vigilare, intervenire, comunicare","delivery":"synchronous_or_classroom",
      "unit_key":"update:preposto:vigilance","position":2,"title":"Vigilanza operativa su comportamenti e condizioni","summary":"Riconoscere scostamenti, condizioni pericolose e segnali deboli durante l’attività.","case":"Un lavoratore aggira una protezione perché l’operazione è più veloce: il preposto deve fermare la deviazione e capire anche perché la procedura viene sistematicamente aggirata.","norm":"D.Lgs. 81/2008 art. 19; principi di vigilanza e prevenzione.","focus":["vigilanza","comportamenti","condizioni","barriere","near miss"],"detail":"Vigilare significa osservare sia i comportamenti sia le condizioni di lavoro. Il preposto deve distinguere una deviazione occasionale da una condizione strutturale, intervenire tempestivamente e documentare o escalare ciò che non può correggere direttamente.","procedure":["osservare lavoro reale e non solo documenti","confrontare attività con procedura e misure previste","correggere immediatamente una deviazione quando possibile","segnalare carenze di mezzi, organizzazione o competenze"],"errors":["intervenire solo dopo un richiamo esterno","focalizzarsi sul lavoratore ignorando la causa organizzativa","tollerare eccezioni ripetute","non verificare che la correzione resti nel tempo"]
    },
    {
      "group":"preposto","course_key":"agg_prep","course_title":"Aggiornamento Preposto - 6h","family":"Ruoli della prevenzione","module_key":"agg-preposto","module_title":"Aggiornamento preposti: vigilare, intervenire, comunicare","delivery":"synchronous_or_classroom",
      "unit_key":"update:preposto:stop","position":3,"title":"Intervento, interruzione e ripristino","summary":"Applicare criteri chiari per intervenire e interrompere attività non sicure.","case":"Una protezione fondamentale non funziona a metà turno e la produzione è in ritardo: il preposto deve gestire stop, area, escalation e condizioni per una eventuale ripresa.","norm":"D.Lgs. 81/2008 art. 19; Accordo Stato-Regioni 17/04/2025.","focus":["condizione di stop","pericolo grave e immediato","segnalazione","ripristino","verifica"],"detail":"Quando una condizione presenta un pericolo grave e immediato o non può essere riportata entro le misure previste, il preposto deve agire senza attendere l’evento. La competenza consiste nel riconoscere il punto di stop, mettere in sicurezza persone e area, segnalare e autorizzare la ripresa solo dopo un ripristino verificabile.","procedure":["interrompere la sequenza pericolosa","allontanare o proteggere le persone esposte","comunicare la criticità al livello competente","verificare il ripristino prima della ripresa"],"errors":["confondere pressione produttiva con urgenza di sicurezza","lasciare la decisione al singolo lavoratore esposto","riprendere dopo una correzione provvisoria non validata","non registrare anomalie ricorrenti"]
    },
    {
      "group":"preposto","course_key":"agg_prep","course_title":"Aggiornamento Preposto - 6h","family":"Ruoli della prevenzione","module_key":"agg-preposto","module_title":"Aggiornamento preposti: vigilare, intervenire, comunicare","delivery":"synchronous_or_classroom",
      "unit_key":"update:preposto:communication","position":4,"title":"Comunicazione, feedback e scenario integrato","summary":"Gestire correzioni e comunicazioni in modo autorevole, comprensibile e orientato alla prevenzione.","case":"Una squadra esperta contesta una nuova procedura perché la ritiene più lenta: il preposto deve gestire il confronto senza autorizzare scorciatoie e riportare eventuali criticità del processo.","norm":"D.Lgs. 81/2008 artt. 19 e 37; Accordo Stato-Regioni 17/04/2025.","focus":["comunicazione","feedback","briefing","conflitto","verifica della comprensione"],"detail":"Un ordine efficace non è solo formalmente corretto: deve essere compreso e applicabile. Il preposto usa comunicazioni brevi, verifica la comprensione, affronta resistenze e conflitti senza trasformare il richiamo in una discussione personale. Lo scenario finale integra vigilanza, stop, segnalazione e follow-up.","procedure":["descrivere il fatto osservato","spiegare rischio e comportamento atteso","chiedere conferma operativa o dimostrazione","verificare successivamente che il comportamento corretto sia mantenuto"],"errors":["urlare senza spiegare il rischio","limitarsi a una comunicazione generica","dare istruzioni contraddittorie rispetto alla procedura","non verificare comprensione o applicazione"]
    },

    {
      "group":"dirigente","course_key":"agg_dir","course_title":"Aggiornamento Dirigente - 6h","family":"Ruoli della prevenzione","module_key":"agg-dirigente","module_title":"Aggiornamento dirigenti: governo del sistema di prevenzione","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:dirigente:governance","position":1,"title":"Evoluzione normativa, responsabilità e governance","summary":"Aggiornare il quadro decisionale del dirigente e il collegamento tra poteri, responsabilità, deleghe e processi.","case":"Una riorganizzazione accorpa due reparti ma procedure e responsabilità rimangono separate: il dirigente deve riallineare ruoli, flussi e controllo dei rischi.","norm":"D.Lgs. 81/2008 artt. 16, 18, 37; D.Lgs. 231/2001 per i profili organizzativi applicabili; Accordo Stato-Regioni 17/04/2025.","focus":["responsabilità","delega","assetto organizzativo","modello 231","flussi informativi"],"detail":"Il dirigente traduce le direttive del datore di lavoro in organizzazione concreta. L’aggiornamento deve verificare che deleghe, responsabilità, risorse e flussi informativi corrispondano al lavoro reale e alle modifiche intervenute, evitando zone grigie in cui un rischio è noto ma nessuno ha compito, potere o risorsa per gestirlo.","procedure":["mappare decisioni e responsabilità rilevanti per la sicurezza","verificare coerenza fra compiti, poteri e risorse","aggiornare flussi verso datore di lavoro e funzioni tecniche","tracciare decisioni e follow-up quando il rischio richiede interventi"],"errors":["delegare senza poteri o risorse reali","confondere incarico operativo con trasferimento di responsabilità","lasciare rischi noti senza owner","misurare la sicurezza solo tramite assenza di infortuni"]
    },
    {
      "group":"dirigente","course_key":"agg_dir","course_title":"Aggiornamento Dirigente - 6h","family":"Ruoli della prevenzione","module_key":"agg-dirigente","module_title":"Aggiornamento dirigenti: governo del sistema di prevenzione","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:dirigente:risk","position":2,"title":"DVR, priorità, risorse e indicatori","summary":"Trasformare la valutazione dei rischi in priorità, risorse, responsabilità e indicatori di controllo.","case":"Tre near miss simili si ripetono senza infortuni: il dirigente deve decidere se e come elevare la priorità e quali indicatori usare per verificare la soluzione.","norm":"D.Lgs. 81/2008 artt. 17, 18, 28, 29; sistemi aziendali di gestione e miglioramento.","focus":["DVR","priorità","programma di miglioramento","risorse","KPI leading e lagging"],"detail":"Il DVR non è un archivio: deve guidare decisioni. Il dirigente collega rischio, misura, scadenza, responsabile e risorsa e usa indicatori anticipatori come audit, segnalazioni, manutenzioni, addestramenti e chiusura delle azioni, non solo indicatori ritardati come gli infortuni.","procedure":["identificare rischi non accettabili o in peggioramento","assegnare misura, owner, risorsa e scadenza","monitorare indicatori di attuazione ed efficacia","riesaminare priorità quando cambiano processi o risultati"],"errors":["approvare azioni senza budget o responsabile","chiudere un’azione solo perché scaduta","guardare soltanto frequenza infortuni","non riesaminare il DVR dopo cambiamenti significativi"]
    },
    {
      "group":"dirigente","course_key":"agg_dir","course_title":"Aggiornamento Dirigente - 6h","family":"Ruoli della prevenzione","module_key":"agg-dirigente","module_title":"Aggiornamento dirigenti: governo del sistema di prevenzione","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:dirigente:contractors","position":3,"title":"Appalti, interferenze ed emergenze organizzative","summary":"Governare appalti, coordinamento e capacità di risposta alle emergenze.","case":"Durante una fermata impianto operano contemporaneamente manutentori, produzione e trasportatori: il dirigente deve stabilire coordinamento, segregazioni e regole di escalation.","norm":"D.Lgs. 81/2008 artt. 18, 26 e gestione delle emergenze; procedure aziendali.","focus":["appalti","interferenze","DUVRI ove applicabile","coordinamento","emergenze"],"detail":"La presenza di imprese diverse crea rischi che nessuna valutazione isolata può gestire. Il dirigente deve garantire verifica dei requisiti, scambio di informazioni, coordinamento, gestione delle interferenze e chiarezza dei poteri in emergenza. Lo stesso principio vale per manutenzioni, fermate impianto e attività non routinarie.","procedure":["definire perimetro e interferenze prima dell’avvio","assicurare informazioni reciproche comprensibili e tempestive","stabilire responsabilità e canali di escalation","verificare copertura di emergenza anche durante turni e attività straordinarie"],"errors":["trattare l’appalto come mero acquisto di servizio","affidarsi alla sola esperienza del fornitore","non aggiornare il coordinamento se cambia il lavoro","avere procedure di emergenza non praticabili nel turno reale"]
    },
    {
      "group":"dirigente","course_key":"agg_dir","course_title":"Aggiornamento Dirigente - 6h","family":"Ruoli della prevenzione","module_key":"agg-dirigente","module_title":"Aggiornamento dirigenti: governo del sistema di prevenzione","delivery":"elearning_asynchronous_allowed",
      "unit_key":"update:dirigente:leadership","position":4,"title":"Leadership, comunicazione e riesame integrato","summary":"Integrare decisioni, comunicazione, partecipazione e riesame in una governance verificabile.","case":"Un obiettivo produttivo induce più squadre a saltare un controllo preliminare: il dirigente deve intervenire su processo, incentivi, vigilanza e verifica dell’efficacia.","norm":"D.Lgs. 81/2008; Accordo Stato-Regioni 17/04/2025; principi di gestione organizzativa della prevenzione.","focus":["leadership","cultura","segnalazioni","RLS","audit","riesame"],"detail":"La leadership di sicurezza si misura dalle decisioni: cosa viene fermato, finanziato, verificato e corretto. Il dirigente deve rendere coerenti messaggi e incentivi, ascoltare RLS e lavoratori, usare audit e segnalazioni come fonti di conoscenza e chiudere il ciclo con un riesame delle azioni.","procedure":["comunicare priorità coerenti con i comportamenti richiesti","proteggere e valorizzare la segnalazione di criticità","consultare i soggetti previsti nei momenti corretti","riesaminare risultati e correggere misure inefficaci"],"errors":["premiare implicitamente scorciatoie produttive","considerare la segnalazione come problema personale","consultare a decisione già presa","confondere audit documentale con efficacia reale"]
    }
  ]
  $specs$::jsonb)
  LOOP
    v_group := rec->>'group';

    v_content := jsonb_build_object(
      'case',rec->>'case',
      'norm',rec->>'norm',
      'quiz',jsonb_build_object(
        'options',jsonb_build_array('Continuare con maggiore attenzione','Ignorare se non è ancora accaduto un infortunio','Riconoscere lo scostamento, applicare il proprio ruolo, segnalare/intervenire e verificare il ripristino','Aspettare il prossimo corso'),
        'question','Qual è il comportamento più efficace quando una misura o una condizione di lavoro non corrisponde più a quanto previsto?',
        'explanation','L’aggiornamento serve a riconoscere cambiamenti e scostamenti e ad attivare tempestivamente il ruolo previsto, non a normalizzare condizioni diverse da quelle valutate.',
        'correct_index',2),
      'focus',rec->'focus',
      'title',rec->>'title',
      'detail',rec->>'detail',
      'minutes',90,
      'quality',jsonb_build_object('learner_ready',true,'teacher_ready',true,'scenario_based',true),
      'summary',rec->>'summary',
      'visuals',jsonb_build_array('modello-farfalla-rischio.svg','stop-segnala-ripristina.svg','procedura-operativa-5-fasi.svg'),
      'procedure',rec->'procedure',
      'objectives',jsonb_build_array('comprendere il perché delle misure e non solo ricordarne il nome','applicare il contenuto a una situazione concreta','riconoscere una condizione che richiede segnalazione o stop','proporre o applicare un follow-up verificabile'),
      'common_errors',rec->'errors',
      'delivery_note','Il contenuto didattico resta integralmente disponibile a docente e corsista; eventuali regole sulla modalità di erogazione sono metadata organizzativi e non riducono il materiale consultabile.',
      'guided_activity',jsonb_build_array('presentare uno scenario incompleto e chiedere quali informazioni mancano','far individuare almeno una barriera tecnica/organizzativa e una comportamentale','far formulare una segnalazione o decisione in forma concreta','chiudere con feedback: cosa fare, chi coinvolgere, come verificare'),
      'didactic_version','completion-v2',
      'final_assessment',false,
      'learner_takeaway','Aggiornarsi significa cambiare ciò che serve nel lavoro reale e saper spiegare il perché.',
      'teacher_expansion','Usare un caso reale o plausibile dell’organizzazione. Prima far descrivere i fatti, poi chiedere rischio, barriera, decisione e verifica. Evitare lezioni solo frontali: almeno un terzo del tempo deve essere dedicato ad analisi guidata, confronto, documenti o simulazione decisionale coerente con il ruolo.'
    );

    INSERT INTO public.learning_units(owner_organization_id,stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    VALUES(NULL,rec->>'unit_key',rec->>'title',rec->>'summary',90,'SafetyTraining completion-v2',
      ARRAY['safetytraining','update','completion-v2',rec->>'course_key'],true,
      jsonb_build_object('learner_ready',true,'teacher_ready',true,'didactic_version','completion-v2'))
    ON CONFLICT(stable_key) DO UPDATE SET
      title=excluded.title,summary=excluded.summary,default_minutes=excluded.default_minutes,source_group=excluded.source_group,
      tags=excluded.tags,active=true,metadata=public.learning_units.metadata || excluded.metadata,updated_at=now();

    SELECT id INTO v_lu FROM public.learning_units WHERE stable_key=rec->>'unit_key';
    INSERT INTO public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
    VALUES(v_lu,1,'draft',v_content,NULL,NULL)
    ON CONFLICT(learning_unit_id,version_number) DO UPDATE SET status='draft',content=excluded.content,content_hash=NULL,published_at=NULL;
    SELECT id INTO v_luv FROM public.learning_unit_versions WHERE learning_unit_id=v_lu AND version_number=1;

    INSERT INTO public.courses(owner_organization_id,stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    VALUES(NULL,rec->>'course_key',rec->>'course_title',rec->>'family','Aggiornamento periodico con materiale didattico completo e scenari applicativi.',360,'internal_learning',true,
      jsonb_build_object(
        'blueprint_key',CASE v_group WHEN 'worker' THEN 'worker_update' WHEN 'preposto' THEN 'preposto_update' ELSE 'dirigente_update' END,
        'didactic_version','completion-v2','material_complete',true,'composition_version','v20_048',
        'delivery_constraint',rec->>'delivery','delivery_rules_are_metadata_only',true,
        'dynamic_update',true,'requires_admin_review',true,'learner_catalog_hidden',true,
        'learner_material_complete',true,'teacher_material_complete',true,'final_test_builder_paused',true,
        'internal_didactic_allocation',true,'statutory_per_topic_duration_claim',false))
    ON CONFLICT(stable_key) DO UPDATE SET
      title=excluded.title,family=excluded.family,nominal_minutes=360,certification_mode='internal_learning',active=true,
      metadata=public.courses.metadata || excluded.metadata,updated_at=now();
    SELECT id INTO v_course FROM public.courses WHERE stable_key=rec->>'course_key';

    INSERT INTO public.course_versions(course_id,version_number,status,effective_from,effective_to,syllabus_snapshot,normative_snapshot,published_at)
    VALUES(v_course,1,'draft','2025-05-24',NULL,
      jsonb_build_object(
        'didactic_version','completion-v2','material_minutes',360,'material_complete',true,'learning_unit_count',4,
        'dynamic_update',true,'learner_material_complete',true,'teacher_material_complete',true),
      jsonb_build_object(
        'basis','D.Lgs. 81/2008 + Accordo Stato-Regioni 17/04/2025',
        'minimum_minutes',360,'delivery_constraint',rec->>'delivery',
        'final_verification',CASE WHEN v_group='worker' THEN 'course_rules' ELSE 'test_or_interview' END,
        'test_min_questions',CASE WHEN v_group='worker' THEN NULL ELSE 10 END,
        'test_min_options',CASE WHEN v_group='worker' THEN NULL ELSE 3 END,
        'passing_score_pct',CASE WHEN v_group='worker' THEN NULL ELSE 70 END),
      NULL)
    ON CONFLICT(course_id,version_number) DO UPDATE SET
      status='draft',effective_from=excluded.effective_from,effective_to=NULL,
      syllabus_snapshot=public.course_versions.syllabus_snapshot || excluded.syllabus_snapshot,
      normative_snapshot=public.course_versions.normative_snapshot || excluded.normative_snapshot,published_at=NULL;
    SELECT id INTO v_cv FROM public.course_versions WHERE course_id=v_course AND version_number=1;

    INSERT INTO public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    VALUES(v_cv,rec->>'module_key',rec->>'module_title',1,360)
    ON CONFLICT(course_version_id,module_key) DO UPDATE SET title=excluded.title,position=1,nominal_minutes=360;
    SELECT id INTO v_module FROM public.course_modules WHERE course_version_id=v_cv AND module_key=rec->>'module_key';

    INSERT INTO public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    VALUES(v_module,v_luv,(rec->>'position')::int,true,0,true,jsonb_build_object('material_complete',true,'scenario_required',true))
    ON CONFLICT(module_id,unit_version_id) DO UPDATE SET
      position=excluded.position,required=true,min_active_seconds=0,requires_comprehension=true,completion_rules=excluded.completion_rules;
  END LOOP;
END $do$;

UPDATE public.courses
SET metadata = metadata || '{"requires_admin_review":true,"learner_catalog_hidden":true,"material_complete":true,"final_test_builder_paused":true}'::jsonb,
    updated_at=now()
WHERE stable_key IN ('agg_lav','agg_prep','agg_dir');
