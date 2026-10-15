/* SafetyTraining — Modulo aggiuntivo Cantieri 6h, revisione didattica v2.
   Core condiviso per Datore di lavoro / Dirigente dell'impresa affidataria.
   La selezione del ruolo è demandata al Course Composer; il modulo non è universale.
   Non modifica Test Builder o banca domande finale. */
(() => {
  'use strict';
  const data = window.SAFETY_DATA || [];
  const norm = s => String(s || '').toLowerCase();
  const course = data.find(c => c.id === 'mod_cantieri' || c.id === 'cantieri') ||
    data.find(c => norm(c.title).includes('modulo cantieri')) ||
    data.find(c => norm(c.title).includes('cantieri') && (norm(c.title).includes('datore') || norm(c.title).includes('dirigente')));
  if (!course) return;

  const mk = (o) => ({
    icon:'🏗️', minutes:60, visual:'roles', risks:[], prevention:[], procedure:[],
    idea_images:[], graphic_cards:[], teacher_expansion:[], teaching_steps:[], common_errors:[],
    guided:{observe:[],importance:[],apply:[]},
    operational:{before:[],during:[],after:[],step_by_step:[],if_problem:[],stop_conditions:[],who_to_involve:[]},
    discussion_feedback:{answer:[],case_solution:[],general_solution:[]},
    quality:{score:100,complete:true,version:'cantieri-v2',classroom_first:false,final_assessment:false,construction:true},
    didactic_version:'cantieri-v2', ...o
  });

  course.didactic_version='cantieri-v2';
  course.subtitle='6 ore · impresa affidataria: soggetti, PSC/POS, organizzazione, cronoprogramma, verifica e coordinamento';
  course.disclaimer='Il modulo è richiesto nel percorso del Datore di lavoro o del Dirigente dell’impresa affidataria quando ricorrono le condizioni dell’art. 97. La suddivisione in 3 blocchi da 120 minuti e 6 unità da 60 minuti è una scelta didattica interna e non una durata normativa per singolo argomento.';
  course.delivery_note='Erogazione consentita in presenza, videoconferenza sincrona o e-learning secondo le condizioni applicabili al progetto formativo. Il Test Builder finale resta separato.';
  course.context_note='Il Course Composer deve proporre questo modulo solo con construction_role = entrusted_company.';

  course.modules=[
    {id:'cant-a',title:'CANT-A · Soggetti, responsabilità, PSC e POS',topic_ids:['cant01','cant02'],minutes:120,start_minute:0,end_minute:120},
    {id:'cant-b',title:'CANT-B · Misure di tutela, obblighi e cronoprogramma',topic_ids:['cant03','cant04'],minutes:120,start_minute:120,end_minute:240},
    {id:'cant-c',title:'CANT-C · Verifica dei lavori, congruenza POS e coordinamento',topic_ids:['cant05','cant06'],minutes:120,start_minute:240,end_minute:360}
  ];

  course.topics=[
    mk({id:'cant01',title:'CANT01 · Soggetti del Titolo IV e relativi obblighi',icon:'🏗️',visual:'roles',
      slide_title:'Nel cantiere la sicurezza dipende da una rete di soggetti',
      summary:'Committente, responsabile dei lavori, coordinatori, impresa affidataria, imprese esecutrici e autonomi hanno funzioni diverse che devono essere comprese e coordinate.',
      detail:'Il punto non è memorizzare un organigramma: bisogna capire chi decide, chi coordina, chi esegue, quali informazioni devono circolare e quando una criticità deve essere fatta risalire.',
      question:'Se un problema coinvolge più imprese, chi deve sapere cosa e chi può decidere la misura necessaria?',
      case:'Una lavorazione di un’impresa esecutrice interferisce con l’accesso di un’altra. Tutti conoscono il problema, ma ciascuno ritiene che debba intervenire un altro soggetto. Come agisce l’impresa affidataria?',
      risks:['Ruoli confusi','Informazioni frammentate','Responsabilità non presidiate','Interferenze non coordinate'],
      prevention:['Mappa soggetti e responsabilità','Flussi informativi definiti','Coordinamento prima delle variazioni','Escalation chiara'],
      procedure:['Identifica i soggetti','Definisci responsabilità e flussi','Rileva l’interferenza','Coordina la misura','Comunica','Verifica la chiusura'],
      teacher:'Disegna la rete del cantiere e chiedi ai corsisti dove passa una decisione reale.',
      teacher_expansion:['0–10 · Il cantiere come sistema multi-soggetto','10–25 · Soggetti del Titolo IV','25–40 · Focus impresa affidataria','40–50 · Caso di interferenza','50–60 · Mappa decisionale'],
      common_errors:['Confondere impresa affidataria ed esecutrice.','Delegare tutto al preposto di una singola impresa.','Non aggiornare i flussi quando entrano nuovi soggetti.'],
      operational:{objective:'Rendere espliciti soggetti, responsabilità, flussi ed escalation.',step_by_step:['Mappa soggetti','Attribuisci funzioni','Definisci flussi','Coordina','Escala','Verifica'],who_to_involve:['Datore/Dirigente impresa affidataria','Coordinatori','Imprese esecutrici','Preposti']},
      discussion_feedback:{answer:['La responsabilità va letta per funzione e potere effettivo.','L’affidataria deve presidiare i flussi e il coordinamento che le competono.'],case_solution:['Blocca l’interferenza non coordinata','Coinvolgi i soggetti necessari','Definisci misura e responsabilità','Verifica prima della ripresa'],general_solution:['Ruoli chiari','Flussi chiari','Decisioni tracciate','Riesame alle variazioni']},
      idea_images:[{file:'organigramma-sicurezza.svg',caption:'Ruoli e relazioni da leggere come sistema decisionale.'},{file:'idea-safety-system.svg',caption:'Il cantiere come sistema di soggetti e processi collegati.'}]}),

    mk({id:'cant02',title:'CANT02 · PSC e POS: finalità, tempi e contenuti',icon:'📑',visual:'general',
      slide_title:'PSC e POS devono descrivere il lavoro reale prima che il lavoro inizi',
      summary:'PSC e POS sono strumenti di pianificazione e coordinamento: devono essere coerenti con lavorazioni, fasi, organizzazione, rischi e misure effettive.',
      detail:'Si confrontano finalità, tempi e contenuti dei piani, concentrandosi sulla relazione PSC–POS e sugli scostamenti tra carta e cantiere.',
      question:'Quale incoerenza tra PSC, POS e lavorazione reale richiede un riesame prima di iniziare?',
      case:'Il POS descrive un accesso e un’attrezzatura diversi da quelli realmente presenti; il PSC non considera la nuova configurazione. Si può iniziare perché i documenti esistono?',
      risks:['Piano generico','Misure non coerenti col sito','Variazioni non recepite','Avvio prima del coordinamento'],
      prevention:['Confronto PSC-POS-lavoro reale','Riesame alle variazioni','Condivisione delle prescrizioni','Avvio solo dopo verifica di coerenza'],
      procedure:['Leggi attività prevista','Confronta PSC e POS','Verifica condizioni reali','Individua scostamenti','Coordina aggiornamento','Autorizza solo dopo coerenza'],
      teacher:'Usa due esempi documentali e fai cercare prima le incoerenze, poi la soluzione.',
      teacher_expansion:['0–15 · Finalità di PSC e POS','15–30 · Cosa deve essere coerente','30–45 · Esempio comparato','45–55 · Caso variazione in campo','55–60 · Regola di stop'],
      common_errors:['Considerare sufficiente la presenza dei documenti.','Confondere controllo formale e congruenza sostanziale.','Accettare variazioni non riflesse nei piani.'],
      operational:{objective:'Usare PSC e POS come strumenti vivi.',step_by_step:['Confronta','Verifica sul campo','Rileva scostamento','Aggiorna','Comunica','Autorizza'],stop_conditions:['Condizione reale non prevista','Misura essenziale incoerente','Variazione non coordinata']},
      discussion_feedback:{answer:['Il documento è utile solo se descrive e governa il lavoro reale.'],case_solution:['Non avviare','Allinea documenti e condizioni','Coordina la variazione','Verifica sul campo'],general_solution:['Confronto sostanziale','Aggiornamento tempestivo','Avvio condizionato alla coerenza']},
      idea_images:[{file:'idea-dvr-reading.svg',caption:'Dal documento alla decisione operativa.'},{file:'idea-duvri.svg',caption:'Coordinamento di attività e interferenze.'}]}),

    mk({id:'cant03',title:'CANT03 · Misure generali di tutela e obblighi ex artt. 95 e 96',icon:'🛡️',visual:'risk',
      slide_title:'Gli artt. 95 e 96 diventano criteri per organizzare il cantiere',
      summary:'Le misure generali di tutela e gli obblighi di datore, dirigenti e preposti devono tradursi in scelte concrete sulle lavorazioni.',
      detail:'Ordine, accessi, movimentazioni, manutenzione, depositi, cooperazione e protezioni vanno letti come elementi dell’organizzazione reale del cantiere.',
      question:'Quale scelta organizzativa può ridurre il rischio prima ancora di introdurre un DPI?',
      case:'Per recuperare ritardo si sovrappongono due lavorazioni nello stesso spazio e si affida ai preposti il compito di “stare attenti”. È sufficiente?',
      risks:['Sovrapposizione non pianificata','Spazi inadeguati','Misure affidate al solo comportamento','Protezione collettiva insufficiente'],
      prevention:['Pianificazione delle fasi','Gerarchia delle misure','Coordinamento organizzativo','Controllo prima dell’avvio'],
      procedure:['Individua pericoli di fase','Applica gerarchia misure','Separa o coordina attività','Definisci responsabilità','Verifica prima dell’avvio','Riesamina'],
      teacher:'Trasforma gli articoli in decisioni concrete: spazio, tempo, protezione e responsabilità.',
      teacher_expansion:['0–15 · Misure generali di tutela','15–30 · Obblighi operativi ex art. 96','30–45 · Organizzazione prima del DPI','45–55 · Caso fasi sovrapposte','55–60 · Decisione e verifica'],
      common_errors:['Studiare gli articoli come elenco mnemonico.','Affidare la prevenzione al comportamento individuale.','Non riesaminare l’organizzazione quando cambia la sequenza.'],
      operational:{objective:'Tradurre gli obblighi in misure verificabili.',step_by_step:['Analizza fase','Elimina/riduci','Separa','Proteggi','Comunica','Verifica']},
      discussion_feedback:{answer:['La prima leva è l’organizzazione della fase, non il richiamo individuale.'],case_solution:['Riesamina la sovrapposizione','Separa o proteggi','Coordina le imprese','Verifica prima della ripresa'],general_solution:['Gerarchia delle misure','Organizzazione','Protezione collettiva','Verifica']},
      idea_images:[{file:'piramide-pericoli.svg',caption:'Intervenire prima possibile sulla fonte e sull’organizzazione.'},{file:'idea-dpi-hierarchy.svg',caption:'Il DPI è l’ultimo livello, non il primo.'}]}),

    mk({id:'cant04',title:'CANT04 · Cronoprogramma e organizzazione del cantiere',icon:'🗓️',visual:'risk',
      slide_title:'Il cronoprogramma è anche una misura di sicurezza',
      summary:'Tempi, sequenze e sovrapposizioni determinano esposizioni e interferenze. Il programma lavori deve essere letto anche come strumento di prevenzione.',
      detail:'Si impara a leggere fasi, spazi condivisi, mezzi, energie e protezioni necessarie, riconoscendo quando una variazione richiede nuovo coordinamento.',
      question:'Come cambia il rischio quando una fase viene anticipata senza riesaminare il cronoprogramma?',
      case:'Una lavorazione in quota viene anticipata mentre al piano inferiore continua la movimentazione materiali. Il ritardo contrattuale spinge a mantenerle entrambe. Cosa fai?',
      risks:['Sovrapposizioni','Caduta materiali','Interferenze mezzi-persone','Protezione non pronta'],
      prevention:['Sequenze compatibili','Zone interdette','Protezione collettiva prima della fase','Riesame a variazioni significative'],
      procedure:['Leggi fasi e tempi','Evidenzia sovrapposizioni','Valuta interferenze','Modifica sequenza o misure','Comunica','Verifica'],
      teacher:'Fai lavorare i corsisti su un mini cronoprogramma e chiedi di segnare le sovrapposizioni critiche.',
      teacher_expansion:['0–10 · Tempo come fattore di rischio','10–25 · Lettura del cronoprogramma','25–40 · Interferenze di fase','40–55 · Caso quota/movimentazione','55–60 · Gate prima della variazione'],
      common_errors:['Trattare il cronoprogramma solo come strumento produttivo.','Anticipare attività senza riesame.','Non comunicare la modifica a tutte le imprese.'],
      operational:{objective:'Integrare sicurezza e programmazione.',step_by_step:['Leggi sequenza','Trova sovrapposizioni','Valuta rischio','Coordina modifica','Comunica','Verifica']},
      discussion_feedback:{answer:['Una modifica temporale può creare nuovi rischi anche senza cambiare la lavorazione.'],case_solution:['Evita la sovrapposizione o crea protezioni adeguate','Aggiorna il coordinamento','Comunica','Verifica'],general_solution:['Tempo e spazio sono variabili di sicurezza','Ogni variazione significativa riapre la valutazione']},
      idea_images:[{file:'idea-risk-cycle.svg',caption:'Ogni variazione riapre il ciclo di valutazione.'},{file:'idea-duvri.svg',caption:'Interferenze lette per spazio e tempo.'}]}),

    mk({id:'cant05',title:'CANT05 · Verifica delle condizioni di sicurezza dei lavori affidati',icon:'🔎',visual:'risk',
      slide_title:'L’impresa affidataria deve verificare le condizioni, non presumere che siano corrette',
      summary:'La verifica riguarda condizioni di sicurezza, applicazione delle prescrizioni del PSC e coordinamento degli interventi.',
      detail:'Si costruisce un metodo: cosa osservare, quali evidenze raccogliere, quando intervenire, come gestire uno scostamento e come accertare la chiusura.',
      question:'Quali evidenze permettono di dire che una prescrizione del PSC è realmente applicata?',
      case:'Una protezione prevista nel PSC è stata rimossa temporaneamente e non ripristinata. L’impresa esecutrice sostiene che “manca poco”. Cosa deve fare l’affidataria?',
      risks:['Prescrizioni non applicate','Anomalie tollerate','Correzioni senza verifica','Normalizzazione dello scostamento'],
      prevention:['Controlli programmati e situazionali','Criteri di stop','Azioni con owner e scadenza','Verifica del ripristino'],
      procedure:['Osserva condizione','Confronta con PSC/POS','Classifica scostamento','Metti in sicurezza','Assegna correzione','Verifica ripristino','Registra esito'],
      teacher:'Distingui osservazione, rilievo, misura immediata, correzione e verifica di chiusura.',
      teacher_expansion:['0–15 · Cosa significa verificare','15–30 · PSC e condizione reale','30–45 · Stop, correzione, ripresa','45–55 · Caso protezione rimossa','55–60 · Evidenza di chiusura'],
      common_errors:['Limitarsi a chiedere se è tutto a posto.','Accettare il temporaneo senza controllo.','Chiudere l’anomalia senza verificare il ripristino.'],
      operational:{objective:'Rendere la verifica sistematica e tracciabile.',step_by_step:['Osserva','Confronta','Intervieni','Assegna','Verifica','Chiudi'],stop_conditions:['Prescrizione PSC non rispettata con rischio attuale','Protezione essenziale assente','Interferenza non coordinata']},
      discussion_feedback:{answer:['Verificare significa confrontare requisito e realtà e chiudere lo scostamento.'],case_solution:['Metti in sicurezza','Pretendi il ripristino','Verifica prima della ripresa','Registra l’esito'],general_solution:['Controllo','Azione','Verifica efficacia','Chiusura']},
      idea_images:[{file:'idea-inspection-flow.svg',caption:'Rilievo, azione correttiva, verifica e chiusura.'},{file:'stop-segnala-ripristina.svg',caption:'Stop, segnalazione e ripristino prima della ripresa.'}]}),

    mk({id:'cant06',title:'CANT06 · Congruenza dei POS e coordinamento',icon:'🔗',visual:'general',
      slide_title:'Congruenza dei POS: chiudere il cerchio tra documenti, imprese e lavoro reale',
      summary:'La congruenza non è solo completezza formale: i POS devono essere compatibili con PSC, cronoprogramma, condizioni reali e attività delle altre imprese.',
      detail:'Lo scenario finale integra soggetti, PSC, POS, artt. 95-96 e cronoprogramma in una decisione di avvio o ripresa tracciabile.',
      question:'Che cosa significa “congruente” se un POS è completo ma non compatibile con PSC o condizioni reali?',
      case:'Due POS sono completi, ma prevedono accessi e aree di deposito incompatibili nello stesso intervallo; il PSC non è stato aggiornato dopo una variante. Qual è la sequenza corretta?',
      risks:['Congruenza solo formale','Misure incompatibili','Variante non coordinata','Avvio con condizioni indefinite'],
      prevention:['Analisi comparata PSC-POS','Coordinamento delle sovrapposizioni','Aggiornamento prima dell’avvio','Tracciabilità della decisione'],
      procedure:['Confronta PSC e POS','Verifica cronoprogramma e sito','Rileva incongruenze','Coordina correzioni','Conferma responsabilità','Autorizza avvio','Controlla sul campo'],
      teacher:'Chiudi il modulo con una simulazione: il gruppo deve produrre una decisione di avvio/ripresa motivata.',
      teacher_expansion:['0–10 · Congruenza sostanziale','10–25 · Metodo comparato PSC/POS','25–40 · Coordinamento tra imprese','40–55 · Scenario integrato','55–60 · Decision record'],
      common_errors:['Controllare solo campi e firme.','Valutare i POS separatamente senza interferenze.','Autorizzare prima della chiusura delle incongruenze.'],
      operational:{objective:'Arrivare a una decisione di avvio/ripresa basata sulla coerenza reale.',step_by_step:['Confronta','Verifica','Coordina','Correggi','Conferma','Autorizza','Controlla'],stop_conditions:['POS incompatibile con PSC','Interferenza non risolta','Condizione reale diversa dal piano senza valutazione']},
      discussion_feedback:{answer:['Congruenza significa compatibilità sostanziale tra piani e lavoro reale.'],case_solution:['Blocca l’avvio','Allinea PSC/POS','Coordina spazi e tempi','Conferma responsabilità','Verifica prima della partenza'],general_solution:['Coerenza documentale','Coerenza operativa','Coordinamento','Verifica sul campo']},
      idea_images:[{file:'idea-duvri.svg',caption:'Coordinamento tra soggetti, tempi e spazi.'},{file:'procedura-operativa-5-fasi.svg',caption:'Verifica, correzione e riesame prima dell’avvio.'}]})
  ];
})();
