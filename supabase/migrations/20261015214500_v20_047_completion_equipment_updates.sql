-- SafetyTraining v20.047
-- Reconciliation snapshot: 13 equipment-update courses completed directly in the live DB.
-- Source of truth: live rows tagged SafetyTraining completion-v2, audited 2026-10-15.
-- Idempotent: resolves UUIDs from stable keys and keeps all course/unit versions draft + learner-hidden.
-- Delivery constraints remain metadata; didactic material is not hidden by delivery modality.

DO $do$
DECLARE
  rec jsonb;
  v_lu uuid;
  v_luv uuid;
  v_course uuid;
  v_cv uuid;
  v_module uuid;
  v_content jsonb;
  v_machine text;
  v_evidence jsonb;
  v_evidence_case jsonb;
BEGIN
  FOR rec IN SELECT value FROM jsonb_array_elements($specs$
  [
    {
      "course_key":"agg_attr_carrelli_all_4h",
      "course_title":"Aggiornamento Carrelli elevatori industriali + telescopici + rotativi (4h)",
      "variant_key":"carrelli_all_4h",
      "unit_key":"update:agg_attr_carrelli_all_4h:practical",
      "unit_title":"Aggiornamento pratico integrato — Carrelli industriali, telescopici e telescopici rotativi",
      "case":"Con un telescopico rotativo viene richiesto di raggiungere un punto oltre quello previsto dal diagramma: il corsista deve leggere configurazione, sbraccio, carico e stabilizzazione e motivare il rifiuto della manovra.",
      "risks":["ribaltamento per sbraccio, rotazione o terreno non idoneo","perdita del carico per accessorio/configurazione errati","collisione o investimento durante traslazione e rotazione","contatto con ostacoli o linee elettriche durante lo sbraccio"],
      "checklist":["forche/accessori e sistema di aggancio","stabilizzatori e assetto del telaio quando presenti","limitatori/indicatori e diagramma della configurazione","pneumatici, sterzo, freni, allarmi e ritenuta"],
      "s2":["identificare esattamente tipologia e configurazione","verificare portanza e planarità per la stabilizzazione","selezionare accessorio autorizzato e relativo diagramma","delimitare raggio di rotazione e zone di esclusione"],
      "s3":["provare funzioni e arresti prima di caricare","mantenere carico entro inviluppo e diagramma ammessi","coordinare traslazione, sollevamento, sbraccio e rotazione senza brusche correzioni","rientrare lo sbraccio e riportare la macchina in assetto stabile prima degli spostamenti previsti"],
      "s4":["arrestare e ridurre il momento ribaltante se interviene un limitatore","non bypassare sensori o limitatori","recuperare il carico solo con manovre previste dal fabbricante","porre fuori servizio la macchina in caso di anomalia del sistema di stabilità"],
      "source_audit":{"status":"reviewed","checked_on":"2026-10-15","reuse_policy":"facts_and_original_didactic_rewrite","primary_evidence":"INAIL Infor.MO Scheda 21 (2023)"},
      "informo":true
    },
    {
      "course_key":"agg_attr_carrelli_ind_4h",
      "course_title":"Aggiornamento Carrelli Elevatori Industriali Semoventi (4h)",
      "variant_key":"carrelli_ind_4h",
      "unit_key":"update:agg_attr_carrelli_ind_4h:practical",
      "unit_title":"Aggiornamento pratico integrato — Carrelli elevatori industriali semoventi",
      "case":"Un pallet alto nasconde la visuale e il percorso attraversa una zona pedonale: il corsista deve scegliere percorso, direzione, velocità e modalità di segnalazione senza affidarsi solo al clacson.",
      "risks":["ribaltamento laterale o frontale","caduta del carico o perdita di stabilità in quota","investimento di pedoni e collisione con scaffalature","schiacciamento durante manovre in spazi stretti"],
      "checklist":["forche, piastra portaforche e montante","catene e circuito idraulico","pneumatici, freni e sterzo","cintura/ritenuta, allarmi e segnalatori"],
      "s2":["controllare pavimentazione, rampe e vie di circolazione","leggere portata e baricentro del carico","regolare correttamente forche e organo di presa","separare flussi pedonali e carrelli"],
      "s3":["inserire completamente e centrare le forche","sollevare il minimo necessario e mantenere assetto stabile","procedere con visuale garantita o retromarcia controllata quando prevista","accostare e depositare senza urtare scaffalature"],
      "s4":["fermarsi se la visibilità non è sufficiente","mantenersi nel posto di guida e usare la ritenuta in caso di principio di ribaltamento secondo addestramento/manuale","abbassare il carico e parcheggiare in sicurezza in caso di anomalia","segnalare danni a scaffalature o dispositivi prima di riprendere"],
      "source_audit":{"status":"reviewed","checked_on":"2026-10-15","reuse_policy":"facts_and_original_didactic_rewrite","primary_evidence":"INAIL Infor.MO Scheda 21 (2023)"},
      "informo":true
    },
    {
      "course_key":"agg_attr_carroponte_10h_4h","course_title":"Aggiornamento Carroponte / gru a cavalletto - una tipologia comando (4h)","variant_key":"carroponte_10h_4h","unit_key":"update:agg_attr_carroponte_10h_4h:practical","unit_title":"Aggiornamento pratico integrato — Carroponte/gru a cavalletto – una tipologia di comando","case":"Un carico lungo inizia a ruotare durante la traslazione: analizzare baricentro, punti di presa, velocità, percorso e sistemi di guida senza avvicinare persone al carico sospeso.","risks":["caduta del carico per imbracatura errata","schiacciamento tra carico e strutture","oscillazione incontrollata del carico","transito di persone sotto carichi sospesi"],"checklist":["gancio con sicurezza e bozzello","funi/catene e organi di sollevamento visibili","pulsantiera o radiocomando previsto e arresto di emergenza","finecorsa e area di corsa libera"],"s2":["valutare peso, baricentro e punti di presa","scegliere accessori di sollevamento idonei e controllati","liberare percorso e zona di deposito","concordare segnali con l’eventuale segnalatore"],"s3":["tesare lentamente l’imbracatura e verificare l’assetto","sollevare di pochi centimetri per prova di equilibrio","traslare senza strappi mantenendo il carico controllato","depositare e scaricare gli accessori solo a carico stabilmente appoggiato"],"s4":["azionare arresto in caso di movimento anomalo","non tentare di liberare a mano un carico sospeso incastrato","isolare l’area in caso di guasto con carico sospeso","segnalare immediatamente funi, ganci o comandi danneggiati"]
    },
    {
      "course_key":"agg_attr_carroponte_all_11h_4h","course_title":"Aggiornamento Carroponte / gru a cavalletto - tutte le tipologie comando (4h)","variant_key":"carroponte_all_11h_4h","unit_key":"update:agg_attr_carroponte_all_11h_4h:practical","unit_title":"Aggiornamento pratico integrato — Carroponte/gru a cavalletto – tutte le tipologie di comando","case":"In reparto sono presenti due carriponte simili comandati via radio: il corsista deve dimostrare come identifica macchina e comando, evita l’attivazione errata e mantiene il controllo del carico.","risks":["errore di comando nel passaggio fra sistemi differenti","caduta o oscillazione del carico","schiacciamento e interferenza con persone o altre gru","perdita del controllo visivo durante radiocomando o cabina"],"checklist":["gancio, bozzello, funi/catene e accessori","pulsantiera pensile, radiocomando e/o cabina","arresti, finecorsa e segnalatori","identificazione univoca del comando associato alla gru"],"s2":["riconoscere la tipologia di comando effettivamente utilizzata","verificare pairing/identificazione del radiocomando ove previsto","stabilire una posizione operatore con visuale utile","definire percorso, zona di esclusione e comunicazione"],"s3":["provare arresti e direzioni senza carico","eseguire sollevamento di prova e controllo assetto","mantenere movimenti progressivi nelle tre direzioni","cambiare sistema di comando solo secondo procedura autorizzata"],"s4":["usare l’arresto corretto senza perdere identificazione della gru","interrompere se il segnale radio è instabile o la visuale viene persa","isolare area e comando in caso di guasto","non affidare il comando a persona non abilitata/addestrata"]
    },
    {
      "course_key":"agg_attr_cmm_4h","course_title":"Aggiornamento Caricatori per movimentazione materiali CMM (4h)","variant_key":"cmm_4h","unit_key":"update:agg_attr_cmm_4h:practical","unit_title":"Aggiornamento pratico integrato — Caricatori per movimentazione materiali (CMM)","case":"Durante la movimentazione di materiale sfuso il carico si sbilancia mentre un pedone entra nel raggio operativo: il corsista deve interrompere, ristabilire la segregazione e rivalutare presa, percorso e stabilità.","risks":["ribaltamento per terreno o carico non compatibile","caduta o perdita del materiale movimentato","investimento o schiacciamento nel raggio operativo","urti con strutture, impianti o linee"],"checklist":["organi di presa e sistema di attacco","pneumatici/cingoli e perdite idrauliche","comandi, allarmi e arresti","targhe e diagrammi applicabili"],"s2":["delimitare l’area e individuare interferenze","verificare portanza, pendenze e ostacoli","scegliere organo di presa e configurazione coerenti","provare a vuoto funzioni, freni e arresti"],"s3":["avvicinarsi al materiale a velocità controllata","centrare la presa e verificare stabilità prima del sollevamento","trasportare nella posizione più stabile prevista dal fabbricante","depositare progressivamente mantenendo persone fuori dalla zona pericolosa"],"s4":["arrestare la manovra se il materiale diventa instabile","riportare l’attrezzatura in condizione stabile quando possibile","non improvvisare riparazioni su perdite o anomalie","porre fuori servizio se la condizione pericolosa permane"]
    },
    {
      "course_key":"agg_attr_crf_4h","course_title":"Aggiornamento Macchina agricola raccoglifrutta CRF (4h)","variant_key":"crf_4h","unit_key":"update:agg_attr_crf_4h:practical","unit_title":"Aggiornamento pratico integrato — Macchina agricola raccoglifrutta (CRF)","case":"Durante la raccolta il filare presenta una buca non visibile e un operatore tende a sporgersi: analizzare percorso, velocità, posizione e criterio di arresto.","risks":["caduta dall’alto dalla piattaforma","ribaltamento su terreno sconnesso o in pendenza","schiacciamento contro rami o strutture","investimento o urto durante avanzamento in filare"],"checklist":["parapetti, cancelli e piattaforma","comandi in piattaforma e da terra","ruote, sterzo, freni e stabilità","batterie/alimentazione e arresti di emergenza"],"s2":["valutare pendenza, buche e consistenza del terreno","verificare chiusura accessi e protezioni","controllare spazio laterale e superiore nel filare","stabilire comunicazione tra operatori a bordo e a terra"],"s3":["procedere a velocità compatibile con terreno e visibilità","evitare spostamenti con ostacoli nel raggio della piattaforma","mantenere persone e materiali entro limiti previsti","arrestare prima di interventi o rimozione inceppamenti"],"s4":["usare comando di emergenza/abbassamento previsto","fermare se il terreno perde portanza","non sporgersi oltre le protezioni","isolare e segnalare guasti ai sistemi di arresto o piattaforma"]
    },
    {
      "course_key":"agg_attr_gru_autocarro_4h","course_title":"Aggiornamento Gru per autocarro (4h)","variant_key":"gru_autocarro_4h","unit_key":"update:agg_attr_gru_autocarro_4h:practical","unit_title":"Aggiornamento pratico integrato — Gru per autocarro","case":"Una gru per autocarro deve operare su bordo strada con terreno non uniforme: definire stabilizzazione, segregazione, gestione traffico e limiti di manovra.","risks":["ribaltamento per stabilizzazione insufficiente","schiacciamento nella zona stabilizzatori o articolazioni","caduta e oscillazione del carico","contatto del braccio con linee elettriche o ostacoli"],"checklist":["stabilizzatori, piastre e interblocchi","braccio, articolazioni, tubazioni e gancio","limitatori e diagrammi di carico","area circostante, linee elettriche e traffico"],"s2":["scegliere area con portanza e spazio adeguati","estendere stabilizzatori come previsto e usare piastre idonee","delimitare area e verificare distanze da linee","selezionare configurazione e diagramma corretti"],"s3":["provare comandi e arresti da posizione sicura","sollevare gradualmente monitorando stabilità","evitare trascinamenti laterali e tiri obliqui","richiudere e bloccare braccio/stabilizzatori prima della marcia"],"s4":["interrompere se un appoggio cede o la macchina si inclina","non tentare correzioni improvvise aumentando lo sbraccio","in caso di contatto elettrico impedire l’avvicinamento e applicare la procedura specifica","porre fuori servizio per perdite o limitatori anomali"]
    },
    {
      "course_key":"agg_attr_gru_torre_4h","course_title":"Aggiornamento Gru a torre rotazione basso e alto (4h)","variant_key":"gru_torre_4h","unit_key":"update:agg_attr_gru_torre_4h:practical","unit_title":"Aggiornamento pratico integrato — Gru a torre a rotazione alta e bassa","case":"Il vento aumenta durante un sollevamento e il carico ha ampia superficie esposta: il corsista decide quando sospendere, come mettere in sicurezza e quale configurazione adottare.","risks":["sovraccarico e superamento del momento ammesso","interferenza con altre gru, edifici o linee elettriche","caduta del carico su aree sottostanti","effetti del vento e oscillazione del carico"],"checklist":["funi, gancio e bozzello visibili","limitatori di carico/momento e finecorsa","rotaie/ancoraggi o appoggi secondo configurazione","anemometro e dispositivi legati al vento quando previsti"],"s2":["controllare area di rotazione e interferenze","verificare condizioni meteo e limiti del fabbricante","accertare peso del carico e diagramma applicabile","coordinare segnalatore e zone interdette a terra"],"s3":["sollevare gradualmente verificando assetto e limitatori","coordinare sollevamento, carrello e rotazione senza brusche accelerazioni","mantenere il carico lontano dalle persone","parcheggiare la gru secondo istruzioni per fuori servizio e vento"],"s4":["arrestare in caso di allarme/limitatore senza bypassarlo","gestire perdita di comunicazione secondo procedura","non proseguire con vento oltre limiti o oscillazioni non controllabili","mettere la gru nella configurazione di sicurezza prevista per interruzioni prolungate"]
    },
    {
      "course_key":"agg_attr_mmt_all_4h","course_title":"Aggiornamento Macchine movimento terra (escavatori + pale + terne) (4h)","variant_key":"mmt_all_4h","unit_key":"update:agg_attr_mmt_all_4h:practical","unit_title":"Aggiornamento pratico integrato — Macchine movimento terra – escavatori, pale e terne","case":"Una terna deve lavorare vicino a uno scavo mentre mezzi e pedoni transitano nella stessa area: ridisegnare zona di lavoro, distanze, segnalazioni e sequenza operativa.","risks":["ribaltamento su scarpate, pendenze o terreni cedevoli","investimento di persone nel raggio di rotazione","crollo di fronti/scavi o caduta nel vuoto","sgancio accessorio o caduta di materiale"],"checklist":["struttura ROPS/FOPS, cintura e cabina","benne/accessori e sistemi di attacco rapido","cingoli/pneumatici, freni e circuiti idraulici","telecamere, allarmi e dispositivi di sicurezza"],"s2":["ispezionare terreno, scavi, sottoservizi e margini","identificare zone cieche e raggio di rotazione","verificare aggancio accessori e configurazione","organizzare viabilità e segregazione dell’area"],"s3":["spostarsi con attrezzatura in posizione stabile","mantenere distanza da bordi e scavi","evitare rotazioni sopra persone o cabine","usare funzioni di sollevamento solo nei limiti previsti"],"s4":["abbassare l’attrezzatura e arrestare se compare instabilità","restare nel volume protetto in caso di ribaltamento secondo sistemi di ritenuta/addestramento","arrestare se una persona entra nella zona cieca","isolare la macchina con attacco/accessorio anomalo"]
    },
    {
      "course_key":"agg_attr_mmt_esc_4h","course_title":"Aggiornamento Macchine movimento terra / escavatori idraulici (4h)","variant_key":"mmt_esc_4h","unit_key":"update:agg_attr_mmt_esc_4h:practical","unit_title":"Aggiornamento pratico integrato — Escavatori idraulici","case":"Durante uno scavo emerge terreno diverso dal previsto e una tubazione non indicata: sospendere, mettere in sicurezza e attivare la verifica prima di proseguire.","risks":["ribaltamento vicino a bordi o scavi","schiacciamento nel raggio di rotazione","rottura o sfilamento di sottoservizi","sgancio benna o caduta del materiale"],"checklist":["cingoli, sottocarro e cabina con cintura","braccio, avambraccio, benna e attacco rapido","circuito idraulico e blocchi di sicurezza","allarmi/telecamere e area di rotazione"],"s2":["leggere terreno e distanza dal bordo","localizzare sottoservizi prima dello scavo","verificare corretta chiusura dell’attacco rapido","separare raggio di rotazione da pedoni e mezzi"],"s3":["posizionare il carro in assetto stabile","scavare evitando sovraccarichi laterali e bruschi movimenti","ruotare solo con area libera e visibilità gestita","depositare materiale senza sovraccaricare il ciglio"],"s4":["arrestare se emerge un sottoservizio non previsto","abbassare benna e mettere in sicurezza se compare instabilità","fermare per perdita idraulica significativa","isolare la macchina se l’attacco rapido non conferma il bloccaggio"]
    },
    {
      "course_key":"agg_attr_ple_4h","course_title":"Aggiornamento Piattaforme di Lavoro Elevabili PLE (4h)","variant_key":"ple_4h","unit_key":"update:agg_attr_ple_4h:practical","unit_title":"Aggiornamento pratico integrato — Piattaforme di lavoro mobili elevabili (PLE)","case":"La PLE deve raggiungere una copertura sotto una trave con traffico a terra: definire posizionamento, segregazione, avvicinamento, DPI e recupero di emergenza.","risks":["caduta dall’alto o effetto catapulta","ribaltamento per terreno, pendenza o sbraccio","schiacciamento contro strutture","contatto con linee elettriche o ostacoli in quota"],"checklist":["parapetti, cancelli e punti di ancoraggio previsti","comandi in piattaforma e a terra, emergenza/abbassamento","stabilizzatori, pneumatici e livellamento","limitatori, sensori e allarmi"],"s2":["valutare terreno, pendenza e portanza","delimitare area a terra e gestire traffico/interferenze","controllare ostacoli e linee lungo tutto l’inviluppo","usare DPI previsti dalla specifica PLE e procedura"],"s3":["provare comandi ed emergenza prima dell’elevazione","elevare gradualmente mantenendo distanze dagli ostacoli","evitare manovre incompatibili con configurazione e manuale","mantenere corpo e materiali entro la piattaforma"],"s4":["conoscere e provare il recupero da terra","interrompere in caso di allarme inclinazione o sovraccarico","non arrampicarsi sul parapetto né usare scale sulla piattaforma","applicare il piano di recupero se l’operatore resta bloccato in quota"]
    },
    {
      "course_key":"agg_attr_pompe_4h","course_title":"Aggiornamento Pompe per calcestruzzo (4h)","variant_key":"pompe_4h","unit_key":"update:agg_attr_pompe_4h:practical","unit_title":"Aggiornamento pratico integrato — Pompe per calcestruzzo","case":"Durante il pompaggio la portata cala e si sospetta un’ostruzione: spiegare perché non si apre un giunto in pressione e descrivere arresto, depressurizzazione e ripristino.","risks":["ribaltamento o cedimento degli appoggi","colpo di frusta/rottura tubazioni e proiezione","schiacciamento nel raggio del braccio","contatto con linee elettriche o interferenza con mezzi"],"checklist":["stabilizzatori, piastre e sensori","braccio, articolazioni e tubazioni","giunti, terminale flessibile e chiusure","comandi, arresti e comunicazione con squadra/autobetoniera"],"s2":["scegliere piazzamento con portanza e spazio per stabilizzatori","verificare tubazioni, giunti e terminale","delimitare inviluppo del braccio e zona terminale","coordinare segnali tra pompista, autobetoniera e addetti al getto"],"s3":["aprire e stabilizzare secondo sequenza del fabbricante","avviare il pompaggio progressivamente controllando pressioni","muovere il braccio senza passare sopra persone","depressurizzare prima di aprire giunti o rimuovere blocchi"],"s4":["arrestare immediatamente per rottura o movimento anomalo della tubazione","non aprire linee in pressione","gestire un intasamento solo con procedura prevista","interrompere in caso di cedimento di un appoggio o avvicinamento pericoloso a linee"]
    },
    {
      "course_key":"agg_attr_trattori_4h","course_title":"Aggiornamento Trattori agricoli o forestali (4h)","variant_key":"trattori_4h","unit_key":"update:agg_attr_trattori_4h:practical","unit_title":"Aggiornamento pratico integrato — Trattori agricoli o forestali","case":"Un trattore con attrezzatura portata deve lavorare su terreno in pendenza: valutare zavorratura, carreggiata, traiettoria, velocità e uso della cintura.","risks":["ribaltamento laterale o posteriore","impigliamento nella presa di forza o organi in moto","schiacciamento durante attacco/distacco attrezzature","perdita di controllo su strada o terreno sconnesso"],"checklist":["telaio/cabina ROPS e cintura","pneumatici, freni e sterzo","presa di forza, protezioni e albero cardanico","attacco a tre punti, zavorre e macchina operatrice"],"s2":["valutare pendenze e condizioni del terreno","configurare zavorre e carreggiata secondo attrezzatura","spegnere/isolare prima di interventi su PTO o organi","controllare corretta connessione di attrezzi e rimorchi"],"s3":["usare cintura con struttura ROPS operativa","affrontare pendenze e svolte a velocità adeguata","innestare PTO solo con persone fuori dalla zona pericolosa","parcheggiare con attrezzatura abbassata e macchina immobilizzata"],"s4":["restare nel volume protetto in caso di ribaltamento secondo addestramento e sistemi di ritenuta","arrestare il motore prima di liberare inceppamenti","interrompere se protezioni PTO sono assenti o danneggiate","segnalare anomalie a freni, sterzo o attacchi prima dell’uso"]
    }
  ]
  $specs$::jsonb)
  LOOP
    v_machine := regexp_replace(rec->>'unit_title', '^Aggiornamento pratico integrato — ', '');

    v_evidence := CASE WHEN coalesce((rec->>'informo')::boolean,false) THEN
      jsonb_build_array(jsonb_build_object(
        'url','https://www.inail.it/content/dam/inail-hub-site/documenti/2024/01/Scheda%2021%20InforMO.pdf',
        'use','incident_evidence_and_prevention',
        'title','Utilizzo dei carrelli elevatori: dinamiche infortunistiche, fattori di rischio e misure preventive - Scheda 21',
        'authority','INAIL - Sistema Infor.MO',
        'checked_on','2026-10-15'))
      ELSE NULL END;

    v_evidence_case := CASE WHEN coalesce((rec->>'informo')::boolean,false) THEN
      jsonb_build_object(
        'task','Il corsista deve ridisegnare il percorso distinguendo misure tecnico-strutturali, organizzative e procedurali; poi indicare quando la manovra deve essere fermata.',
        'title','Viabilità interna: il rischio non è solo il carrello',
        'scenario','In un magazzino il percorso del carrello incrocia pedoni e visitatori. Un pallet alto riduce la visuale e la segnaletica è presente ma non crea una vera separazione fisica.',
        'learning_point','L’analisi Infor.MO mostra il peso di investimenti, interferenze e uso non corretto: la risposta efficace combina layout, separazione dei flussi, controllo degli accessi, attrezzatura idonea e comportamento operativo.',
        'teacher_questions',jsonb_build_array('Quale barriera funziona anche se una persona commette un errore?','Dove serve separazione fisica invece della sola segnaletica?','Quali cambiamenti dello scenario richiedono STOP e nuova valutazione?'))
      ELSE NULL END;

    v_content := jsonb_build_object(
      'case',rec->>'case',
      'norm','Accordo Stato-Regioni 17/04/2025, Parte III §6: aggiornamento quinquennale minimo di 4 ore relative alla parte pratica; D.Lgs. 81/2008 art. 73; manuale del fabbricante e procedure aziendali.',
      'quiz',jsonb_build_object(
        'options',jsonb_build_array('Continuare lentamente','Fermare e rivalutare prima di proseguire','Compensare aumentando l’attenzione','Far decidere a un collega'),
        'question','Durante l’uso cambia una condizione che influenza stabilità o zona di lavoro. Qual è la risposta corretta?',
        'explanation','Il cambiamento di scenario richiede una nuova verifica: la prudenza da sola non sostituisce stabilità, limiti e segregazione.',
        'correct_index',1),
      'risks',rec->'risks',
      'title',rec->>'unit_title',
      'detail','L’aggiornamento non ripete semplicemente il corso iniziale: parte da controlli e scenari reali. Il corsista deve verbalizzare cosa osserva, quale rischio previene e quando interrompere il lavoro. Il docente usa macchina reale o attrezzatura coerente con l’abilitazione, introducendo almeno una non conformità simulata e una variazione dello scenario.',
      'minutes',240,
      'quality',jsonb_build_object('learner_ready',true,'teacher_ready',true,'scenario_based',true,'practical_focus',true),
      'summary','Percorso pratico per verificare e rinforzare la capacità di usare '||v_machine||' mantenendo controllo, margine e criteri di arresto.',
      'visuals',jsonb_build_array('procedura-operativa-5-fasi.svg','stop-segnala-ripristina.svg','piramide-pericoli.svg'),
      'sections',jsonb_build_array(
        jsonb_build_object(
          'title','1. Controllo pre-uso e decisione GO/NO-GO','minutes',60,'checklist',rec->'checklist',
          'procedure',jsonb_build_array('identificare macchina, accessorio e configurazione','eseguire il giro macchina e osservare l’area','provare funzioni e arresti a vuoto','non iniziare se non è garantita una condizione sicura'),
          'explanation','La prima competenza è decidere se l’attrezzatura può iniziare il lavoro. Un’anomalia non si compensa con maggiore prudenza: si identifica, si segnala e si decide se fermare.'),
        jsonb_build_object(
          'title','2. Assetto, stabilità e area di lavoro','minutes',60,'procedure',rec->'s2',
          'explanation','La sicurezza dipende dalla configurazione reale e dall’ambiente. Terreno, carico, sbraccio, visibilità, persone e interferenze possono modificare il rischio anche se la macchina è efficiente.',
          'stop_conditions',jsonb_build_array('limiti o portata non verificabili','terreno/appoggi non affidabili','persone nella zona di esclusione','ostacoli o interferenze non gestite')),
        jsonb_build_object(
          'focus',jsonb_build_array('velocità compatibile con scenario','segnali concordati quando serve assistenza','nessuna persona nella zona pericolosa','movimenti progressivi senza correzioni improvvise'),
          'title','3. Manovre, visuale e comunicazione','minutes',60,'procedure',rec->'s3',
          'explanation','L’abilità pratica si misura dalla capacità di mantenere margine e controllo, non dalla velocità. Se si perde visuale, comunicazione o segregazione dell’area, la manovra si interrompe.'),
        jsonb_build_object(
          'title','4. Anomalie, emergenze e prova integrata','debrief',jsonb_build_array('qual è stato il primo segnale debole?','quale barriera ha evitato il danno?','quale informazione deve arrivare a preposto/manutenzione?'),
          'minutes',60,'procedure',rec->'s4',
          'explanation','Davanti a un’anomalia l’obiettivo è impedire l’escalation: fermare, riportare o mantenere l’attrezzatura in condizione stabile quando possibile, proteggere l’area e riprendere solo dopo un ripristino verificato.')),
      'objectives',jsonb_build_array('eseguire controlli pre-uso motivandone il significato','valutare area, stabilità, configurazione e interferenze','eseguire manovre progressive mantenendo persone fuori dalla zona pericolosa','riconoscere anomalie e applicare stop, protezione, segnalazione e ripristino'),
      'prevention',jsonb_build_array('checklist coerente con manuale e procedura aziendale','zona di esclusione realmente mantenuta','configurazione e limiti verificati prima della manovra','nessun bypass di protezioni, sensori o limitatori','stop immediato se lo scenario non è più sotto controllo'),
      'common_errors',jsonb_build_array('partire perché «ha sempre funzionato»','confondere esperienza con autorizzazione a superare limiti','tollerare persone nella zona pericolosa','riavviare dopo allarme/anomalia senza chiarirne la causa'),
      'delivery_note','Il materiale resta disponibile a docente e corsista per studio e preparazione. La consultazione digitale non sostituisce la parte pratica richiesta per il rinnovo dell’abilitazione.',
      'didactic_version','completion-v2',
      'final_assessment',false,
      'learner_takeaway','Prima di usare: controllo. Prima di muovere: area e stabilità. Durante: visuale, margine e persone fuori. Se qualcosa cambia: STOP. Dopo un’anomalia: nessuna ripresa senza verifica.',
      'teacher_expansion','Il docente fa verbalizzare al corsista i controlli e il rischio associato, inserisce almeno una non conformità simulata e una interferenza realistica, osserva comportamento e comunicazione e chiude con debriefing su errore, barriera e azione correttiva. La dimostrazione pratica va adattata alla macchina reale e al manuale del fabbricante.'
    );

    IF v_evidence IS NOT NULL THEN
      v_content := v_content || jsonb_build_object('evidence_sources',v_evidence,'evidence_based_case',v_evidence_case);
    END IF;

    INSERT INTO public.learning_units(owner_organization_id,stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    VALUES(
      NULL,rec->>'unit_key',rec->>'unit_title','Aggiornamento operativo di 4 ore: controlli, stabilità/area, manovre e gestione delle anomalie.',240,
      'SafetyTraining completion-v2',
      ARRAY['safetytraining','update','equipment','completion-v2',rec->>'course_key'],true,
      jsonb_build_object('course_key',rec->>'course_key','learner_ready',true,'teacher_ready',true,'practical_focus',true,'didactic_version','completion-v2')
        || CASE WHEN rec ? 'source_audit' THEN jsonb_build_object('source_audit',rec->'source_audit') ELSE '{}'::jsonb END)
    ON CONFLICT(stable_key) DO UPDATE SET
      title=excluded.title,summary=excluded.summary,default_minutes=excluded.default_minutes,source_group=excluded.source_group,
      tags=excluded.tags,active=excluded.active,metadata=excluded.metadata,updated_at=now();

    SELECT id INTO v_lu FROM public.learning_units WHERE stable_key=rec->>'unit_key';
    INSERT INTO public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash)
    VALUES(v_lu,1,'draft',v_content,NULL)
    ON CONFLICT(learning_unit_id,version_number) DO UPDATE SET status='draft',content=excluded.content,content_hash=NULL;
    SELECT id INTO v_luv FROM public.learning_unit_versions WHERE learning_unit_id=v_lu AND version_number=1;

    INSERT INTO public.courses(owner_organization_id,stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata)
    VALUES(
      NULL,rec->>'course_key',rec->>'course_title','Attrezzature',
      'Aggiornamento quinquennale con materiale didattico completo e parte pratica obbligatoria.',240,'internal_learning',true,
      jsonb_build_object(
        'variant_key',rec->>'variant_key','blueprint_key','equipment_update','theory_minutes',0,'practical_minutes',240,
        'didactic_version','completion-v2','material_complete',true,'composition_version','v20_031','delivery_constraint','physical_only',
        'requires_admin_review',true,'learner_catalog_hidden',true,'learner_material_complete',true,'teacher_material_complete',true,
        'delivery_rules_are_metadata_only',true))
    ON CONFLICT(stable_key) DO UPDATE SET
      title=excluded.title,family=excluded.family,nominal_minutes=240,certification_mode='internal_learning',active=true,
      metadata=public.courses.metadata || excluded.metadata,updated_at=now();
    SELECT id INTO v_course FROM public.courses WHERE stable_key=rec->>'course_key';

    INSERT INTO public.course_versions(course_id,version_number,status,effective_from,effective_to,syllabus_snapshot,normative_snapshot,published_at)
    VALUES(
      v_course,1,'draft','2025-05-24',NULL,
      jsonb_build_object('source','v20_031','variant_key',rec->>'variant_key','blueprint_key','equipment_update','didactic_version','completion-v2','material_minutes',240,'material_complete',true,'practical_minutes',240,'learning_unit_count',1,'learner_material_complete',true,'teacher_material_complete',true),
      jsonb_build_object('reference','ASR 17/04/2025','verification','practical_and_interview','delivery_constraint','physical_only','renewal_interval_months',60),
      NULL)
    ON CONFLICT(course_id,version_number) DO UPDATE SET
      status='draft',effective_from=excluded.effective_from,effective_to=NULL,syllabus_snapshot=excluded.syllabus_snapshot,
      normative_snapshot=excluded.normative_snapshot,published_at=NULL;
    SELECT id INTO v_cv FROM public.course_versions WHERE course_id=v_course AND version_number=1;

    INSERT INTO public.course_modules(course_version_id,module_key,title,position,nominal_minutes,required,metadata)
    VALUES(v_cv,'agg-pratica','Aggiornamento pratico operativo',1,240,true,jsonb_build_object('didactic_version','completion-v2'))
    ON CONFLICT(course_version_id,module_key) DO UPDATE SET title=excluded.title,position=1,nominal_minutes=240,required=true,metadata=public.course_modules.metadata || excluded.metadata;
    SELECT id INTO v_module FROM public.course_modules WHERE course_version_id=v_cv AND module_key='agg-pratica';

    INSERT INTO public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    VALUES(v_module,v_luv,1,true,0,true,jsonb_build_object('material_complete',true,'practical_or_guided',true))
    ON CONFLICT(module_id,unit_version_id) DO UPDATE SET
      position=1,required=true,min_active_seconds=0,requires_comprehension=true,completion_rules=excluded.completion_rules;
  END LOOP;
END $do$;

-- Reconciliation guard: these courses must remain draft and hidden until formal review/publication.
UPDATE public.courses
SET metadata = metadata || '{"requires_admin_review":true,"learner_catalog_hidden":true,"material_complete":true}'::jsonb,
    updated_at = now()
WHERE stable_key IN (
  'agg_attr_carrelli_all_4h','agg_attr_carrelli_ind_4h','agg_attr_carroponte_10h_4h','agg_attr_carroponte_all_11h_4h',
  'agg_attr_cmm_4h','agg_attr_crf_4h','agg_attr_gru_autocarro_4h','agg_attr_gru_torre_4h','agg_attr_mmt_all_4h',
  'agg_attr_mmt_esc_4h','agg_attr_ple_4h','agg_attr_pompe_4h','agg_attr_trattori_4h'
);
