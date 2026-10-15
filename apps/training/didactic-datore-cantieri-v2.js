/* SafetyTraining — Modulo Cantieri 6h, revisione didattica v2.
   Valido come modulo aggiuntivo per datore/dirigente dell'impresa affidataria.
   La scansione in 6 LU da 60 minuti è interna e non sostituisce il programma ufficiale.
   Test Builder finale non modificato. */
(() => {
  'use strict';
  const data=window.SAFETY_DATA||[];
  const norm=s=>String(s||'').toLowerCase();
  const course=data.find(c=>c.id==='mod_cantieri')||data.find(c=>norm(c.title).includes('modulo cantieri')||norm(c.title).includes('cantieri - 6h'));
  if(!course) return;

  const base=(o)=>({
    icon:'🏗️',minutes:60,visual:'general',risks:[],prevention:[],dpi:[],procedure:[],good:[],bad:[],
    idea_images:[],resources:[],teacher_expansion:[],teaching_steps:[],common_errors:[],
    guided:{observe:[],importance:[],apply:[]},
    operational:{before:[],during:[],after:[],step_by_step:[],if_problem:[],stop_conditions:[],who_to_involve:[],remember:'',adaptation:''},
    discussion_feedback:{answer:[],case_solution:[],general_solution:[]},
    quiz:{q:'',answers:[],correct:0,explanation:'',case_solution:[],general_solution:[]},
    quality:{score:100,complete:true,version:'datore-cantieri-v2',final_assessment:false},
    didactic_version:'datore-cantieri-v2',...o
  });

  course.didactic_version='datore-cantieri-v2';
  course.subtitle='6 ore · modulo aggiuntivo per datore di lavoro o dirigente dell’impresa affidataria: ruoli, PSC/POS, artt. 95-96, cronoprogramma, verifiche e coordinamento';
  course.disclaimer='Il modulo è condizionale: si applica al datore di lavoro o dirigente dell’impresa affidataria. La suddivisione in 6 unità da 60 minuti è una scelta didattica interna; la durata minima complessiva è 6 ore.';
  course.delivery_note='Erogazione in presenza, videoconferenza sincrona o e-learning secondo l’Accordo Stato-Regioni 17/04/2025 e i requisiti del progetto formativo.';
  course.modules=[
    {id:'cant-a',title:'CANT-A · Sistema di cantiere, piani, misure e programmazione',topic_ids:['cant01','cant02','cant03'],minutes:180,start_minute:0,end_minute:180},
    {id:'cant-b',title:'CANT-B · Verifica, coordinamento e congruenza',topic_ids:['cant04','cant05','cant06'],minutes:180,start_minute:180,end_minute:360}
  ];

  course.topics=[
    base({id:'cant01',title:'CANT01 · Soggetti del Titolo IV, ruoli e responsabilità',icon:'🏗️',visual:'roles',
      slide_title:'Il cantiere è una rete di responsabilità: chiarisci chi decide, coordina e verifica',
      summary:'Il datore o dirigente dell’impresa affidataria deve sapersi collocare tra committente, coordinatori, imprese esecutrici, autonomi, preposti e lavoratori.',
      detail:'L’obiettivo non è memorizzare l’elenco dei soggetti, ma capire chi deve fare cosa, quali informazioni devono circolare e quali decisioni restano in capo all’affidataria anche quando il lavoro è materialmente eseguito da altri.',
      question:'Quali decisioni restano in capo all’impresa affidataria quando entrano nuove imprese esecutrici?',
      case:'Due nuove imprese devono entrare in una fase già avviata. Referenti e flussi non sono stati aggiornati. Cosa deve accadere prima dell’avvio?',
      risks:['Ruoli e referenti non chiari','Informazioni che non arrivano alle squadre','Affidamento confuso con trasferimento totale del rischio'],
      prevention:['Matrice ruoli-responsabilità','Referenti nominativi aggiornati','Flussi di coordinamento ed escalation'],
      procedure:['Mappa i soggetti','Attribuisci obblighi e referenti','Verifica i flussi','Coordina prima dell’ingresso','Autorizza l’avvio','Riesamina ai cambiamenti'],
      good:['Responsabilità esplicite','Referenti raggiungibili','Variazioni comunicate prima dell’attività'],
      bad:['Ingresso di imprese senza coordinamento','Ruoli affidati solo alla memoria','Pensare che il subaffidamento elimini il presidio dell’affidataria'],
      teacher_expansion:['0–15 · Mappa dei soggetti del Titolo IV','15–30 · Obblighi e responsabilità','30–45 · Impresa affidataria: ruolo di governo','45–55 · Caso ingresso nuova impresa','55–60 · Decision map'],
      common_errors:['Confondere il coordinamento documentale con quello operativo.','Lasciare invariata la catena informativa quando cambia il cantiere.'],
      guided:{observe:['Chi decide','Chi coordina','Chi controlla','Chi deve essere informato'],importance:['Le responsabilità devono corrispondere al lavoro reale.'],apply:['Usare una matrice ruoli/flussi prima dell’avvio.']},
      operational:{objective:'Rendere espliciti ruoli, flussi e responsabilità prima dell’attività.',before:['Identifica imprese e soggetti presenti'],during:['Verifica che i flussi funzionino'],after:['Aggiorna assetto e registrazioni'],step_by_step:['Mappa','Assegna','Verifica','Comunica','Autorizza','Riesamina'],if_problem:['Ferma l’ingresso non coordinato','Escala la responsabilità non definita'],stop_conditions:['Referente non identificato','Nuova impresa senza coordinamento'],who_to_involve:['Datore/dirigente affidataria','Coordinatori quando previsti','Preposti','Imprese esecutrici'],remember:'Il cantiere cambia: anche ruoli e flussi devono cambiare con lui.'},
      discussion_feedback:{answer:['L’affidataria mantiene funzioni di verifica e coordinamento previste dal Titolo IV.'],case_solution:['Non avviare','Aggiornare soggetti e referenti','Verificare condizioni e documenti','Comunicare le prescrizioni'],general_solution:['Ruoli chiari','Flussi aggiornati','Avvio solo dopo coordinamento']},
      quiz:{q:'L’ingresso di una nuova impresa esecutrice può avvenire solo perché il suo POS è già disponibile?',answers:['No: servono anche verifica delle condizioni e coordinamento coerente con il cantiere reale.','Sì, il POS basta sempre.','Sì, se l’impresa ha già lavorato in altri cantieri.'],correct:0,explanation:'Il documento non sostituisce il coordinamento e la verifica delle condizioni effettive.',case_solution:['Aggiornare il sistema prima dell’avvio'],general_solution:['Documento + condizioni reali + coordinamento']},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titolo IV d.lgs. 81/2008'}),

    base({id:'cant02',title:'CANT02 · PSC e POS: finalità, tempi, contenuti e relazione operativa',icon:'📑',visual:'general',
      slide_title:'PSC e POS servono a governare il lavoro prima che inizi e quando cambia',
      summary:'PSC e POS sono strumenti di governo: devono essere coerenti con fasi, aree, metodi, interferenze e condizioni reali.',
      detail:'Il controllo utile non è “il documento c’è?”, ma “descrive ancora il lavoro che stiamo per fare?”. Ogni variazione significativa deve attivare un confronto tra piano, programma e realtà.',
      question:'Quale segnale ti dice che PSC o POS non stanno più descrivendo il cantiere reale?',
      case:'Una lavorazione prevista in zona A viene spostata in zona B, dove opera un’altra impresa. PSC e POS non recepiscono la nuova sovrapposizione.',
      risks:['Piani formalmente presenti ma non aderenti','Prescrizioni non trasferite alle squadre','Variazioni gestite dopo l’avvio'],
      prevention:['Confronto PSC-POS-lavoro reale','Riesame alle variazioni','Prescrizioni operative comunicate'],
      procedure:['Leggi la fase prevista','Confronta PSC','Confronta POS','Verifica area e interferenze','Riallinea','Comunica','Autorizza'],
      good:['Piani coerenti con la fase reale','Variazioni gestite prima dell’avvio'],bad:['POS archiviato e mai riesaminato','PSC trattato come documento statico'],
      teacher_expansion:['0–15 · Finalità e differenze PSC/POS','15–30 · Tempi e contenuti','30–45 · Coerenza col lavoro reale','45–55 · Caso spostamento lavorazione','55–60 · Check di congruenza'],
      common_errors:['Controllare solo presenza e firme.','Ritenere che il piano resti valido dopo ogni modifica.'],
      operational:{objective:'Usare PSC e POS come condizioni di avvio e controllo.',before:['Confronta i documenti con la fase prevista'],during:['Controlla che le prescrizioni siano applicate'],after:['Riesamina dopo variazioni'],step_by_step:['Confronta','Individua scostamenti','Coordina','Aggiorna','Comunica','Autorizza'],if_problem:['Non avviare una fase incoerente'],stop_conditions:['Piano incoerente con l’attività','Interferenza non valutata'],who_to_involve:['Affidataria','Esecutrice','Coordinatore quando previsto'],remember:'Un piano è utile solo se descrive il lavoro reale.'},
      quiz:{q:'Un POS può essere considerato adeguato solo perché completo nei suoi campi?',answers:['No, deve anche essere congruo con lavorazione, PSC e condizioni reali.','Sì, completezza formale equivale a congruenza.','Sì, se firmato dal datore.'],correct:0,explanation:'La verifica deve essere sostanziale e riferita al cantiere concreto.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titolo IV d.lgs. 81/2008'}),

    base({id:'cant03',title:'CANT03 · Artt. 95 e 96: misure generali e obblighi operativi',icon:'🛡️',visual:'risk',
      slide_title:'Le misure degli artt. 95 e 96 devono diventare condizioni organizzative verificabili',
      summary:'Le misure di tutela devono restare efficaci nel tempo: spazi, viabilità, accessi, depositi, protezioni e ordine possono degradarsi con l’avanzamento dei lavori.',
      detail:'L’unità collega gli obblighi del Titolo IV alle condizioni quotidiane del cantiere, con un approccio “osserva, confronta, correggi, verifica”.',
      question:'Quali condizioni possono diventare insicure anche se erano corrette all’apertura del cantiere?',
      case:'Materiali e rifiuti restringono i passaggi e un percorso pedonale finisce condiviso con i mezzi. Come gestisci la deviazione?',
      risks:['Viabilità degradata','Accumuli e accessi critici','Protezione rimossa o spostata','Misure temporanee diventate permanenti'],
      prevention:['Controlli periodici','Responsabili di area','Regole di ripristino','Riesame dopo modifiche'],
      procedure:['Osserva','Confronta con le misure previste','Proteggi subito','Assegna correzione','Verifica ripristino','Riesamina causa'],
      good:['Anomalie corrette e verificate','Misure mantenute nel tempo'],bad:['Accettare deviazioni “solo per oggi” senza controllo','Chiudere la segnalazione senza verifica'],
      teacher_expansion:['0–15 · Logica dell’art. 95','15–30 · Obblighi art. 96','30–45 · Mantenere le misure','45–55 · Caso viabilità/depositi','55–60 · Audit rapido'],
      common_errors:['Considerare definitiva l’organizzazione iniziale.','Correggere il sintomo senza owner e scadenza.'],
      operational:{objective:'Mantenere nel tempo le condizioni organizzative di sicurezza.',before:['Definisci criteri di controllo'],during:['Osserva e correggi gli scostamenti'],after:['Verifica il ripristino'],step_by_step:['Verifica','Segnala','Proteggi','Assegna','Ripristina','Controlla'],if_problem:['Metti in sicurezza prima di cercare la soluzione definitiva'],stop_conditions:['Passaggi non sicuri','Protezione essenziale assente'],who_to_involve:['Affidataria','Esecutrice interessata','Preposti'],remember:'Una misura non è “fatta”: deve restare efficace.'},
      quiz:{q:'Una misura organizzativa corretta all’apertura del cantiere resta automaticamente adeguata fino a fine lavori?',answers:['No, deve essere mantenuta e riesaminata quando cambiano condizioni e fasi.','Sì, salvo incidente.','Sì, se prevista nel PSC.'],correct:0,explanation:'Il cantiere è dinamico e richiede verifica continuativa.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; artt. 95 e 96 d.lgs. 81/2008'}),

    base({id:'cant04',title:'CANT04 · Cronoprogramma, fasi di lavoro e interferenze',icon:'🗓️',visual:'risk',
      slide_title:'Il cronoprogramma è una mappa temporale dei rischi e delle interferenze',
      summary:'Ogni anticipo, ritardo o sovrapposizione può modificare rischi, accessi, risorse condivise e coordinamento.',
      detail:'Il cronoprogramma non serve solo alla produttività: è un trigger per individuare contemporaneità e incompatibilità prima che diventino esposizioni reali.',
      question:'Quale variazione temporale dovrebbe attivare un safety gate?',
      case:'Una lavorazione viene anticipata per recuperare un ritardo e si sovrappone a sollevamenti programmati.',
      risks:['Sovrapposizioni non valutate','Pressione temporale','Spazi e risorse condivisi','Modifiche comunicate tardi'],
      prevention:['Safety review delle variazioni','Separazione spazio-tempo','Coordinamento prima della modifica'],
      procedure:['Confronta vecchio e nuovo programma','Individua sovrapposizioni','Valuta interferenze','Definisci misure','Comunica','Autorizza la variante'],
      good:['Variazione gestita prima dell’esecuzione'],bad:['Cambio programma deciso solo per recuperare tempi'],
      teacher_expansion:['0–15 · Cronoprogramma come prevenzione','15–30 · Interferenze spazio-tempo','30–45 · Change control','45–55 · Caso anticipo','55–60 · Safety gate'],
      common_errors:['Aggiornare il programma senza aggiornare il coordinamento.','Guardare solo durata e produttività.'],
      operational:{objective:'Fare della variazione temporale un trigger di rivalutazione.',before:['Confronta le sequenze'],during:['Controlla sovrapposizioni reali'],after:['Aggiorna programma e prescrizioni'],step_by_step:['Rileva','Mappa impatti','Coordina','Proteggi','Comunica','Autorizza'],if_problem:['Rimuovi o separa l’interferenza'],stop_conditions:['Sovrapposizione non valutata','Variazione non condivisa'],who_to_involve:['Affidataria','Esecutrici','Coordinatore quando previsto'],remember:'Cambiare quando si lavora può cambiare anche come si rischia.'},
      quiz:{q:'Un anticipo di lavorazione senza modifica tecnica richiede sempre attenzione alla sicurezza?',answers:['Sì, perché può creare nuove sovrapposizioni e interferenze.','No, conta solo il metodo tecnico.','No, se riduce la durata del cantiere.'],correct:0,explanation:'Tempo e sequenza sono variabili del rischio.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titolo IV d.lgs. 81/2008'}),

    base({id:'cant05',title:'CANT05 · Verifica dei lavori affidati e applicazione del PSC',icon:'🔎',visual:'general',
      slide_title:'Verificare significa osservare il lavoro reale e chiudere gli scostamenti',
      summary:'La verifica richiede criteri, evidenze, azioni, responsabilità e controllo del ripristino.',
      detail:'Un sopralluogo non basta: l’affidataria deve trasformare il rilievo in messa in sicurezza, azione assegnata, scadenza, evidenza e verifica di chiusura.',
      question:'Quando un rilievo può dirsi davvero chiuso?',
      case:'Una protezione collettiva è stata rimossa. Il preposto promette il ripristino entro sera. Puoi considerare la criticità chiusa?',
      risks:['Rilievi senza follow-up','Azioni solo verbali','Ripresa prematura','Prescrizioni PSC non applicate'],
      prevention:['Criteri di verifica','Stop ed escalation','Owner e scadenza','Evidenza del ripristino'],
      procedure:['Rileva','Valuta gravità','Metti in sicurezza','Assegna','Traccia','Verifica ripristino','Chiudi o escala'],
      good:['Chiusura con evidenza'],bad:['Chiudere sul “me l’hanno detto”'],
      teacher_expansion:['0–15 · Cosa significa verificare','15–30 · Criteri ed evidenze','30–45 · Gestione scostamenti','45–55 · Caso protezione rimossa','55–60 · Closed-loop verification'],
      common_errors:['Confondere sopralluogo e verifica efficace.','Non sospendere quando manca una condizione essenziale.'],
      operational:{objective:'Chiudere ogni criticità con evidenza del ripristino.',before:['Definisci criteri di controllo'],during:['Gestisci subito le criticità'],after:['Verifica la chiusura'],step_by_step:['Rileva','Proteggi','Assegna','Traccia','Verifica','Chiudi'],if_problem:['Sospendi la fase se manca una barriera essenziale'],stop_conditions:['Protezione essenziale assente','Prescrizione PSC non rispettata'],who_to_involve:['Affidataria','Esecutrice','Preposto','Coordinatore quando previsto'],remember:'Una criticità non è chiusa finché non hai verificato il ripristino.'},
      quiz:{q:'La promessa di ripristino di una protezione collettiva consente di riprendere subito il lavoro?',answers:['No, occorre assicurare la condizione di sicurezza e verificarne il ripristino.','Sì, se fatta dal preposto.','Sì, se annotata nel verbale.'],correct:0,explanation:'La gestione documentale non sostituisce la condizione reale di sicurezza.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titolo IV d.lgs. 81/2008'}),

    base({id:'cant06',title:'CANT06 · Congruenza dei POS, coordinamento e scenario integrato',icon:'🧩',visual:'general',
      slide_title:'Documenti, sequenze e lavoro reale devono raccontare la stessa storia',
      summary:'Congruenza dei POS, PSC, cronoprogramma e condizioni di cantiere devono convergere prima dell’autorizzazione di una fase.',
      detail:'Scenario integrato di chiusura: il datore/dirigente deve riconoscere incoerenze, impedire l’avvio prematuro, coordinare le correzioni e verificare sul campo. L’esercitazione non sostituisce la verifica finale prevista dal corso.',
      question:'Quali incoerenze ti farebbero fermare una nuova fase prima dell’avvio?',
      case:'Una nuova esecutrice ha un POS formalmente completo, ma il metodo differisce dal PSC, il cronoprogramma crea una sovrapposizione e l’area prevista è già occupata.',
      risks:['POS formalmente completo ma non congruo','Interferenze da sequenza','Area incompatibile','Pressione a partire comunque'],
      prevention:['Analisi di congruenza','Coordinamento prima dell’avvio','Riallineamento di documenti e condizioni'],
      procedure:['Confronta PSC/POS','Confronta cronoprogramma','Verifica area','Risolvi interferenze','Aggiorna','Comunica','Autorizza','Verifica sul campo'],
      good:['Avvio condizionato alla chiusura delle criticità'],bad:['Autorizzare con problemi da sistemare dopo'],
      teacher_expansion:['0–10 · Metodo di congruenza','10–25 · POS vs PSC','25–40 · POS vs cronoprogramma e area','40–50 · Scenario integrato','50–60 · Decision record'],
      common_errors:['Valutare il POS isolatamente.','Non verificare sul campo il coordinamento concordato.'],
      operational:{objective:'Autorizzare la fase solo quando documenti e condizioni reali sono coerenti.',before:['Confronta piani, programma e area'],during:['Verifica l’applicazione delle prescrizioni'],after:['Riesamina eventuali scostamenti'],step_by_step:['Confronta','Rileva','Coordina','Aggiorna','Comunica','Autorizza','Verifica'],if_problem:['Non autorizzare la fase'],stop_conditions:['POS non congruo','Interferenza aperta','Area incompatibile'],who_to_involve:['Affidataria','Esecutrice','Coordinatore quando previsto','Preposti'],remember:'La congruenza è sostanziale: carta e cantiere devono coincidere.'},
      discussion_feedback:{answer:['La congruenza non è solo completezza formale.','PSC, POS, cronoprogramma e condizioni reali devono essere coerenti.'],case_solution:['Non avviare','Riallineare metodo e PSC','Rimuovere sovrapposizione','Verificare area','Autorizzare solo dopo chiusura'],general_solution:['Confronto','Coordinamento','Chiusura criticità','Verifica sul campo']},
      quiz:{q:'Un POS completo ma incoerente con PSC e cronoprogramma è sufficiente per iniziare?',answers:['No, occorre risolvere le incongruenze e coordinare la fase.','Sì, se firmato.','Sì, se l’impresa è qualificata.'],correct:0,explanation:'La congruenza riguarda il rapporto tra piano, fase reale e coordinamento.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titolo IV d.lgs. 81/2008'})
  ];
})();
