/* SafetyTraining — DL-RSPP / Datore di lavoro che svolge direttamente i compiti SPP.
   Modulo comune 8h, revisione didattica v2.
   Percorso distinto dal corso Datore di lavoro 16h e dai moduli tecnici-integrativi di settore.
   La scansione in 8 LU da 60 minuti è una scelta didattica interna; la verifica finale resta separata. */
(() => {
  'use strict';
  const data = window.SAFETY_DATA = window.SAFETY_DATA || [];
  const norm = s => String(s || '').toLowerCase();

  let course = data.find(c => ['dl_spp_comune','dl_spp_common','dlrspp_common'].includes(c.id));
  if (!course) {
    course = data.find(c => {
      const t = norm(c.title);
      return t.includes('datore di lavoro') && (t.includes('spp') || t.includes('rspp')) && !t.includes('aggiorn');
    });
  }
  if (!course) {
    course = {
      id:'dl_spp_comune',
      title:'Datore di lavoro che svolge direttamente i compiti SPP - Modulo comune 8h',
      duration:'8 h',
      icon:'🧠',
      topics:[]
    };
    data.push(course);
  }

  const mk = o => ({
    icon:'🧠', minutes:60, visual:'risk', risks:[], prevention:[], dpi:[], procedure:[], good:[], bad:[],
    idea_images:[], graphic_cards:[], resources:[], teacher_expansion:[], teaching_steps:[], common_errors:[],
    guided:{observe:[],importance:[],apply:[]},
    operational:{objective:'',before:[],during:[],after:[],step_by_step:[],if_problem:[],stop_conditions:[],who_to_involve:[],remember:'',adaptation:''},
    discussion_feedback:{answer:[],case_solution:[],general_solution:[]},
    quiz:{q:'',answers:[],correct:0,explanation:'',case_solution:[],general_solution:[]},
    quality:{score:100,complete:true,version:'dl-rspp-common-v2',classroom_first:true,final_assessment:false},
    didactic_version:'dl-rspp-common-v2', ...o
  });

  course.didactic_version='dl-rspp-common-v2';
  course.duration='8 h';
  course.subtitle='8 ore · modulo comune tecnico-operativo successivo al Datore 16h: valutazione dei rischi, misure di prevenzione e protezione, DVR applicato';
  course.disclaimer='La suddivisione in 3 macro-blocchi e 8 unità da 60 minuti è una scelta didattica interna. Non attribuisce durate normative ai singoli argomenti. Il modulo comune non comprende i moduli tecnici-integrativi di settore e non sostituisce la verifica finale.';
  course.delivery_note='Erogazione iniziale in presenza o videoconferenza sincrona. L’e-learning asincrono non è previsto per questo modulo iniziale.';
  course.prerequisite_note='Accesso dopo il completamento del corso Datore di lavoro previsto dall’Accordo Stato-Regioni 17/04/2025.';
  course.attendance_note='Frequenza minima: 90% delle ore previste.';
  course.assessment_note='Verifica finale separata: colloquio oppure test; se test, almeno 30 domande con almeno 3 alternative e superamento al 70%.';
  course.specialist_note='Gli eventuali moduli tecnici-integrativi Agricoltura/Silvicoltura/Zootecnia, Pesca, Costruzioni e Chimico/Petrolchimico restano percorsi separati e si aggiungono quando applicabili.';

  course.modules=[
    {id:'dlr-a',title:'DLR-A · Processo di valutazione dei rischi',topic_ids:['dlr01','dlr02','dlr03','dlr04'],minutes:240,start_minute:0,end_minute:240},
    {id:'dlr-b',title:'DLR-B · Fattori di rischio e misure di prevenzione/protezione',topic_ids:['dlr05','dlr06','dlr07'],minutes:180,start_minute:240,end_minute:420},
    {id:'dlr-c',title:'DLR-C · Esercitazione DVR riferita al settore ATECO',topic_ids:['dlr08'],minutes:60,start_minute:420,end_minute:480}
  ];

  course.topics=[
    mk({id:'dlr01',title:'DLR01 · Processo di valutazione: pericolo, rischio, criteri e decisione',icon:'🔎',visual:'risk',
      slide_title:'Valutare significa decidere prima che il rischio diventi evento',
      summary:'Il DL-RSPP deve trasformare informazioni sul lavoro in una valutazione strutturata, motivata e orientata alle misure.',
      detail:'L’unità chiarisce il passaggio da pericolo ed esposizione alla stima del rischio, alla priorità e alla decisione. Il focus è sul processo: raccolta dati, coinvolgimento delle figure competenti, criteri coerenti, misure e riesame.',
      question:'Quale informazione manca più spesso quando una valutazione sembra completa ma non descrive il lavoro reale?',
      case:'Una nuova fase produttiva viene avviata usando la valutazione della fase precedente perché attrezzature e personale sembrano simili. Quali elementi devono essere rivalutati prima di confermare l’equivalenza?',
      risks:['Valutazione basata su ipotesi non verificate','Pericoli presenti ma non collegati alle attività reali','Priorità definite senza criteri espliciti'],
      prevention:['Osservazione del lavoro reale','Criteri di valutazione dichiarati','Coinvolgimento di RLS, preposti, lavoratori e medico competente quando pertinente'],
      procedure:['Descrivi attività e contesto','Individua pericoli','Definisci esposti ed esposizione','Stima e valuta','Individua misure','Prioritizza','Riesamina'],
      teacher_expansion:['0–10 · Dal pericolo al rischio','10–25 · Dati e osservazione del lavoro','25–40 · Criteri e priorità','40–50 · Caso nuova fase','50–60 · Decision map'],
      common_errors:['Confondere presenza del pericolo con livello di rischio.','Riutilizzare valutazioni precedenti senza verificare contesto ed esposizione.'],
      guided:{observe:['Attività effettive','Variabilità','Persone esposte','Misure già presenti'],importance:['Una valutazione affidabile parte dal lavoro reale e rende tracciabili i criteri usati.'],apply:['Usare una sequenza pericolo-esposizione-rischio-misura-verifica.']},
      operational:{objective:'Costruire una valutazione motivata e utilizzabile per decidere.',before:['Raccogli attività, persone, ambienti, attrezzature e sostanze'],during:['Confronta situazione reale e misure esistenti'],after:['Registra decisioni e trigger di riesame'],step_by_step:['Descrivi','Individua','Stima','Valuta','Decidi','Verifica'],if_problem:['Se mancano dati, non chiudere la valutazione come certa.'],stop_conditions:['Pericolo grave e immediato non controllato'],who_to_involve:['Datore-DL/RSPP','RLS','Preposti e lavoratori','Medico competente quando pertinente'],remember:'La matrice non sostituisce il ragionamento sul lavoro reale.'},
      discussion_feedback:{answer:['Dati reali su attività, esposizione, persone e variabilità.'],case_solution:['Confrontare compiti, pericoli, durata/frequenza, persone esposte e misure prima di dichiarare equivalenza.'],general_solution:['Ogni valutazione deve essere ricostruibile e collegata alle decisioni.']},
      idea_images:[{file:'idea-risk-cycle.svg',caption:'Dal pericolo alla misura e al riesame.'},{file:'modello-farfalla-rischio.svg',caption:'Barriere preventive e protettive lungo la dinamica del rischio.'}],
      quiz:{q:'Una valutazione dei rischi può essere considerata adeguata solo perché utilizza una matrice numerica?',answers:['No: il metodo deve essere coerente con il rischio e fondato su dati e condizioni reali.','Sì, il punteggio numerico è sufficiente.','Sì, se la matrice è uguale per tutti i rischi.'],correct:0,explanation:'Il metodo è uno strumento: qualità dei dati, coerenza e decisioni restano essenziali.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; artt. 17, 28 e 29 d.lgs. 81/2008'}),

    mk({id:'dlr02',title:'DLR02 · Strumenti e metodologie per individuare e valutare i rischi',icon:'🧰',visual:'risk',
      slide_title:'Scegliere lo strumento giusto per il rischio che stai analizzando',
      summary:'Checklist, osservazioni, misure, dati storici, schede tecniche e metodi specifici hanno funzioni diverse e vanno integrati.',
      detail:'L’unità insegna a distinguere strumenti di screening, metodi di approfondimento e misurazioni tecniche. Un metodo non va scelto perché comodo, ma perché adeguato al fenomeno, ai dati disponibili e alla decisione da prendere.',
      question:'Quando una checklist deve diventare il punto di partenza di un approfondimento e non la conclusione della valutazione?',
      case:'Un sopralluogo non rileva criticità evidenti, ma near miss e segnalazioni mostrano problemi intermittenti nel cambio turno. Come allarghi l’analisi?',
      risks:['Checklist usata come prova definitiva','Misure effettuate senza strategia','Dati storici ignorati','Condizioni anomale non osservate'],
      prevention:['Triangolare più fonti','Scegliere metodo proporzionato al rischio','Osservare condizioni ordinarie e non ordinarie'],
      procedure:['Definisci domanda','Scegli fonti','Scegli metodo','Raccogli evidenze','Confronta risultati','Approfondisci se necessario','Documenta'],
      teacher_expansion:['0–15 · Screening vs approfondimento','15–30 · Osservazioni, interviste e dati','30–45 · Misure e metodi specifici','45–55 · Caso cambio turno','55–60 · Regola di escalation'],
      common_errors:['Usare un solo strumento per qualunque rischio.','Raccogliere dati senza sapere quale decisione devono supportare.'],
      operational:{objective:'Selezionare strumenti adeguati e integrare evidenze diverse.',before:['Definisci cosa devi capire e perché'],during:['Confronta fonti indipendenti'],after:['Conserva evidenze e motivazione del metodo'],step_by_step:['Domanda','Fonti','Metodo','Evidenze','Confronto','Approfondimento'],if_problem:['Se i dati sono discordanti, analizza la causa prima di mediare i risultati.'],stop_conditions:['Metodo non applicabile al rischio considerato'],who_to_involve:['DL-RSPP','Figure tecniche competenti','Lavoratori coinvolti'],remember:'La qualità della decisione dipende dalla qualità delle evidenze.'},
      idea_images:[{file:'idea-inspection-flow.svg',caption:'Osservazione, rilievo, azione e verifica.'},{file:'piramide-pericoli.svg',caption:'Segnali deboli e near miss completano i dati sugli eventi.'}],
      quiz:{q:'Una checklist senza anomalie esclude sempre la presenza di un rischio significativo?',answers:['No, può richiedere ulteriori evidenze o metodi specifici.','Sì, se è firmata.','Sì, se è stata usata l’anno precedente.'],correct:0,explanation:'La checklist è uno strumento e non sostituisce l’analisi delle condizioni effettive.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; d.lgs. 81/2008'}),

    mk({id:'dlr03',title:'DLR03 · DVR: struttura, contenuti, misure e programma di miglioramento',icon:'📋',visual:'general',
      slide_title:'Il DVR deve rendere visibili rischi, decisioni e miglioramento',
      summary:'Il DVR è l’esito documentato di un processo continuo: deve collegare valutazione, misure, ruoli, programma e criteri di riesame.',
      detail:'Si lavora sulla leggibilità operativa del DVR: attività, pericoli, esposti, criteri, misure esistenti, rischio residuo, azioni di miglioramento, responsabilità e scadenze. Il documento deve essere coerente con procedure e lavoro reale.',
      question:'Quali informazioni rendono una misura del DVR realmente governabile nel tempo?',
      case:'Il DVR indica “formare il personale e migliorare la protezione” senza responsabile, priorità, scadenza o criterio di efficacia. Come trasformi la frase in un’azione verificabile?',
      risks:['DVR descrittivo ma non operativo','Misure senza responsabile o scadenza','Aggiornamento documentale non tradotto nel lavoro'],
      prevention:['Azioni con owner e scadenza','Priorità motivate','Evidenze di attuazione e verifica efficacia'],
      procedure:['Collega rischio e misura','Definisci responsabile','Assegna risorse','Fissa scadenza','Definisci evidenza','Verifica efficacia','Riesamina'],
      teacher_expansion:['0–15 · Architettura del DVR','15–30 · Criteri e risultati','30–45 · Piano di miglioramento','45–55 · Caso azione generica','55–60 · Scheda decisione'],
      common_errors:['Scambiare il DVR per un archivio di rischi.','Chiudere un’azione perché eseguita senza verificarne l’efficacia.'],
      operational:{objective:'Trasformare il DVR in uno strumento di governo.',before:['Verifica coerenza con attività e organizzazione'],during:['Collega ogni criticità a una misura concreta'],after:['Verifica attuazione ed efficacia'],step_by_step:['Rischio','Misura','Owner','Risorsa','Scadenza','Evidenza','Riesame'],if_problem:['Se una misura definitiva è rinviata, governa le misure temporanee.'],stop_conditions:['Rischio grave senza misura immediata'],who_to_involve:['Datore-DL/RSPP','Dirigenti/preposti','RLS','Medico competente quando pertinente'],remember:'Una misura senza owner, scadenza e verifica non è governata.'},
      idea_images:[{file:'idea-dvr-reading.svg',caption:'Leggere il DVR dal rischio alla decisione.'},{file:'procedura-operativa-5-fasi.svg',caption:'Tradurre la misura in sequenza verificabile.'}],
      quiz:{q:'Quale elemento manca a una misura del DVR indicata solo come “migliorare la sicurezza”?',answers:['Una definizione operativa con responsabilità, tempi e verifica.','Solo una firma aggiuntiva.','Nulla, è già sufficiente.'],correct:0,explanation:'Il programma deve rendere governabile l’attuazione delle misure.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; artt. 28 e 29 d.lgs. 81/2008'}),

    mk({id:'dlr04',title:'DLR04 · Near miss, dinamiche incidentali, documentazione e procedure semplificate',icon:'⚠️',visual:'risk',
      slide_title:'Imparare dagli eventi prima che diventino infortuni',
      summary:'Near miss, incidenti e anomalie aiutano a riconoscere debolezze del sistema e a correggere cause, non solo comportamenti finali.',
      detail:'L’unità collega analisi degli eventi, documentazione tecnico-amministrativa e procedure standardizzate/semplificate quando applicabili. Il punto chiave è ricostruire sequenze, barriere mancanti, fattori organizzativi e azioni correttive.',
      question:'Quale differenza c’è tra trovare “chi ha sbagliato” e individuare perché il sistema ha permesso l’errore?',
      case:'Tre quasi-infortuni avvengono sulla stessa attività in turni diversi. Ogni volta viene fatto un richiamo individuale. Quale analisi manca?',
      risks:['Near miss non registrati','Analisi fermata all’errore umano','Documenti tecnici non aggiornati','Procedure semplificate usate senza verificarne applicabilità'],
      prevention:['Segnalazione semplice','Analisi delle cause e delle barriere','Azioni correttive con verifica efficacia','Tracciabilità dei documenti'],
      procedure:['Raccogli fatti','Ricostruisci sequenza','Individua barriere','Analizza cause','Definisci azioni','Verifica efficacia','Aggiorna valutazione/documenti'],
      teacher_expansion:['0–15 · Near miss e segnali precoci','15–30 · Dinamica incidentale','30–40 · Cause e barriere','40–50 · Documentazione tecnico-amministrativa','50–60 · Caso ripetitivo'],
      common_errors:['Usare il richiamo come unica azione correttiva.','Confondere modulistica semplificata con valutazione semplificata del rischio.'],
      operational:{objective:'Usare eventi e documenti per migliorare il sistema.',before:['Raccogli evidenze senza cercare subito un colpevole'],during:['Ricostruisci condizioni e barriere'],after:['Aggiorna misure, DVR e procedure quando necessario'],step_by_step:['Fatti','Sequenza','Barriere','Cause','Azioni','Efficacia'],if_problem:['Proteggi subito prima dell’analisi completa se il rischio è ancora presente.'],stop_conditions:['Condizione pericolosa ancora attiva'],who_to_involve:['DL-RSPP','Preposti','Lavoratori','RLS'],remember:'La ripetizione dello stesso evento segnala un problema di sistema.'},
      idea_images:[{file:'piramide-pericoli.svg',caption:'Anomalie e near miss come segnali anticipatori.'},{file:'modello-farfalla-rischio.svg',caption:'Ricostruire barriere preventive e protettive.'}],
      quiz:{q:'Tre near miss simili richiedono soltanto tre richiami individuali?',answers:['No, serve cercare anche cause comuni e debolezze del sistema.','Sì, se nessuno si è infortunato.','Sì, se i lavoratori sono diversi.'],correct:0,explanation:'La ripetizione suggerisce fattori organizzativi o tecnici da analizzare.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; d.lgs. 81/2008'}),

    mk({id:'dlr05',title:'DLR05 · Luoghi, attrezzature, MMC e videoterminali',icon:'🏭',visual:'general',
      slide_title:'Leggere i rischi operativi nel modo in cui persone, spazi e attrezzature interagiscono',
      summary:'Luoghi di lavoro, attrezzature, movimentazione manuale e VDT richiedono analisi delle condizioni reali, non categorie isolate.',
      detail:'Il docente collega requisiti dei luoghi, uso sicuro delle attrezzature, manutenzione, ergonomia, movimentazione e postazioni VDT. L’obiettivo è riconoscere interazioni, cambiamenti e misure secondo la gerarchia della prevenzione.',
      question:'Quale modifica apparentemente “logistica” può cambiare più rischi contemporaneamente?',
      case:'Il layout viene compattato per aumentare lo spazio di deposito: cambiano passaggi, movimentazione, accesso alle macchine e postazioni. Come imposti il riesame?',
      risks:['Viabilità e spazi inadeguati','Attrezzature non mantenute o usate fuori condizioni','Sovraccarico biomeccanico','Postazioni VDT non adattate'],
      prevention:['Progettazione ergonomica','Manutenzione e controlli','Separazione dei flussi','Ausili e organizzazione del lavoro'],
      procedure:['Osserva attività','Individua interazioni','Verifica requisiti','Applica gerarchia misure','Forma/addestra dove necessario','Controlla efficacia'],
      teacher_expansion:['0–15 · Luoghi e layout','15–30 · Attrezzature e manutenzione','30–45 · MMC ed ergonomia','45–55 · VDT','55–60 · Caso layout'],
      common_errors:['Valutare una macchina senza considerare ambiente e organizzazione.','Affidare l’ergonomia solo a istruzioni comportamentali.'],
      operational:{objective:'Valutare insieme persona, compito, attrezzatura e ambiente.',before:['Mappa flussi, compiti e utilizzi reali'],during:['Osserva deviazioni e condizioni non nominali'],after:['Riesamina dopo modifiche di layout o processo'],step_by_step:['Mappa','Osserva','Valuta','Riduci alla fonte','Proteggi','Verifica'],if_problem:['Ferma l’uso se mancano condizioni essenziali di sicurezza.'],stop_conditions:['Protezione essenziale assente','Percorso o accesso non sicuro'],who_to_involve:['DL-RSPP','Preposti','Utilizzatori','Manutenzione'],remember:'Il rischio nasce spesso dall’interazione, non dal singolo elemento.'},
      idea_images:[{file:'idea-vdt-ergonomia.svg',caption:'Adattare la postazione alla persona e al compito.'},{file:'idea-dpi-hierarchy.svg',caption:'Prima eliminazione/riduzione e protezioni collettive, poi DPI per il residuo.'}],
      quiz:{q:'Dopo una modifica importante del layout è sufficiente verificare solo le vie di esodo?',answers:['No, vanno riesaminate anche interazioni, flussi, attrezzature ed ergonomia interessati.','Sì, gli altri rischi restano invariati.','Sì, se non sono state acquistate nuove macchine.'],correct:0,explanation:'Il cambiamento può modificare più fattori di rischio contemporaneamente.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titoli II, III e VI d.lgs. 81/2008'}),

    mk({id:'dlr06',title:'DLR06 · Agenti fisici, sostanze pericolose, biologico e atmosfere esplosive',icon:'🧪',visual:'risk',
      slide_title:'Rischi specialistici: riconoscere quando serve misurare, approfondire e coinvolgere competenze',
      summary:'Agenti fisici, chimici, biologici e atmosfere esplosive richiedono dati affidabili, metodi specifici e controllo dell’esposizione.',
      detail:'L’unità non sostituisce le valutazioni specialistiche. Insegna al DL-RSPP a riconoscere sorgenti, vie di esposizione, condizioni di innesco o diffusione, documenti tecnici, misure e trigger per il coinvolgimento di competenze qualificate.',
      question:'Quale segnale indica che una valutazione qualitativa non è più sufficiente?',
      case:'Viene introdotto un nuovo prodotto con classificazione diversa e aumenta il tempo di utilizzo. La vecchia valutazione viene lasciata invariata perché la quantità giornaliera sembra bassa. Cosa verifichi?',
      risks:['Esposizione non caratterizzata','SDS o dati tecnici non aggiornati','Misure non adeguate alla nuova sorgente','Competenza specialistica coinvolta troppo tardi'],
      prevention:['Inventario aggiornato','Valutazioni/metodi specifici','Sostituzione e contenimento','Monitoraggio quando previsto','Procedure ed emergenze coerenti'],
      procedure:['Identifica sorgente','Raccogli dati','Caratterizza esposizione','Verifica metodo applicabile','Definisci misure','Coinvolgi competenze se necessario','Riesamina'],
      teacher_expansion:['0–15 · Agenti fisici','15–30 · Chimico e cancerogeni','30–40 · Biologico','40–50 · Atmosfere esplosive','50–60 · Caso nuovo prodotto'],
      common_errors:['Usare la stessa logica di stima per rischi che richiedono metodi specifici.','Considerare la sola quantità senza modalità e durata di esposizione.'],
      operational:{objective:'Riconoscere i requisiti di approfondimento e governare l’esposizione.',before:['Raccogli SDS, dati di processo e sorgenti'],during:['Verifica esposizione e funzionamento delle misure'],after:['Aggiorna valutazione alle modifiche'],step_by_step:['Sorgente','Dati','Esposizione','Metodo','Misure','Verifica'],if_problem:['Richiedi supporto specialistico quando il metodo o la misura richiedono competenze non disponibili.'],stop_conditions:['Condizione non valutata potenzialmente grave'],who_to_involve:['DL-RSPP','Medico competente quando pertinente','Tecnici qualificati','Lavoratori esposti'],remember:'Sapere quando approfondire è parte della competenza del DL-RSPP.'},
      idea_images:[{file:'idea-bio-chain.svg',caption:'Interrompere la catena di esposizione.'},{file:'video-chemicals.svg',caption:'Richiamo visivo alla gestione delle sostanze pericolose.'}],
      quiz:{q:'L’introduzione di una nuova sostanza con diversa classificazione può richiedere il riesame della valutazione?',answers:['Sì, insieme a modalità, durata e condizioni di esposizione.','No, se la quantità è piccola.','Solo dopo un incidente.'],correct:0,explanation:'Il cambiamento di pericolo o esposizione può rendere non più valida la valutazione precedente.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; Titoli VIII, IX, X e XI d.lgs. 81/2008'}),

    mk({id:'dlr07',title:'DLR07 · Psicosociale, differenze individuali, misure, DPI e segnaletica',icon:'🛡️',visual:'roles',
      slide_title:'La prevenzione deve funzionare per persone reali e rischi reali',
      summary:'Stress lavoro-correlato, fattori psicosociali e differenze di genere, età o provenienza vanno integrati nella valutazione insieme alle misure tecniche, organizzative e procedurali.',
      detail:'L’unità collega fattori organizzativi e gruppi esposti alla gerarchia delle misure. DPI e segnaletica sono collocati nel sistema complessivo: non devono sostituire interventi alla fonte o protezioni collettive quando queste sono praticabili.',
      question:'Quando un problema presentato come “comportamentale” può essere il segnale di un’organizzazione del lavoro da riesaminare?',
      case:'Aumentano errori e turnover in un reparto con picchi di lavoro, turni variabili e procedure complesse. La risposta proposta è solo un nuovo cartello e un richiamo alla maggiore attenzione. Cosa manca?',
      risks:['Fattori psicosociali esclusi dal sistema','Misure uguali per esposizioni diverse','DPI usato come prima misura','Segnaletica usata al posto della correzione del rischio'],
      prevention:['Analisi dell’organizzazione','Considerazione dei gruppi esposti','Gerarchia delle misure','DPI adeguati al rischio residuo','Segnaletica coerente e comprensibile'],
      procedure:['Analizza fattori','Identifica gruppi/esposti','Elimina o riduci alla fonte','Applica misure collettive/organizzative','Gestisci rischio residuo con DPI','Comunica e verifica'],
      teacher_expansion:['0–15 · Stress e fattori psicosociali','15–25 · Genere, età, provenienza e vulnerabilità','25–40 · Gerarchia delle misure','40–50 · DPI','50–60 · Segnaletica e caso reparto'],
      common_errors:['Ridurre lo stress a fragilità individuale.','Usare DPI e cartelli per compensare una misura tecnica o organizzativa mancante.'],
      operational:{objective:'Integrare persone, organizzazione e gerarchia delle misure.',before:['Analizza compito, carichi, gruppi e rischio residuo'],during:['Verifica praticabilità ed efficacia delle misure'],after:['Raccogli segnali e riesamina'],step_by_step:['Analizza','Elimina','Riduci','Proteggi collettivamente','Organizza','DPI residuo','Verifica'],if_problem:['Non attribuire automaticamente l’errore alla persona: verifica il sistema.'],stop_conditions:['Rischio grave non controllato'],who_to_involve:['DL-RSPP','RLS','Preposti e lavoratori','Medico competente quando pertinente'],remember:'DPI e segnaletica completano la prevenzione, non la sostituiscono.'},
      idea_images:[{file:'idea-dpi-hierarchy.svg',caption:'Gerarchia delle misure e ruolo del DPI.'},{file:'idea-signs-basic.svg',caption:'Segnaletica come supporto a misure già governate.'}],
      quiz:{q:'Un cartello di attenzione può sostituire una misura tecnica ragionevolmente attuabile?',answers:['No, la segnaletica non sostituisce la riduzione del rischio alla fonte.','Sì, se ben visibile.','Sì, se tutti firmano per presa visione.'],correct:0,explanation:'La segnaletica è una misura complementare nel sistema di prevenzione.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; artt. 15, 28 e Titolo III d.lgs. 81/2008'}),

    mk({id:'dlr08',title:'DLR08 · Esercitazione: costruzione guidata di un DVR su caso ATECO',icon:'🧩',visual:'general',
      slide_title:'Dalla descrizione dell’attività a un DVR coerente e verificabile',
      summary:'L’ultima unità integra il percorso su un caso concreto riferito al settore ATECO: attività, pericoli, esposti, valutazione, misure, priorità e programma.',
      detail:'Il docente assegna un caso coerente con il contesto dei partecipanti e guida la costruzione ragionata di una sezione di DVR. L’esercitazione serve a rendere applicabili le competenze del modulo comune e resta distinta dalla verifica finale del corso.',
      question:'Quale passaggio rende evidente che il DVR deriva davvero dal caso concreto e non da un modello standard?',
      case:'Caso guidato: azienda con attività principale definita, reparti, lavorazioni, attrezzature, sostanze, turni, appalto di manutenzione e tre near miss recenti. Costruisci la mappa minima dal processo alle misure e al riesame.',
      risks:['Copiare rischi da un modello senza legarli all’attività','Saltare esposizione e gruppi coinvolti','Misure generiche senza priorità','Ignorare appalti, anomalie e cambiamenti'],
      prevention:['Mappa processo-attività-pericolo','Evidenze e criteri espliciti','Misure secondo gerarchia','Programma con owner, tempi e verifica'],
      procedure:['Descrivi azienda e processi','Scomponi attività','Individua pericoli ed esposti','Valuta','Definisci misure','Prioritizza','Assegna azioni','Definisci riesame'],
      teacher_expansion:['0–10 · Presentazione caso ATECO','10–20 · Processi, attività, esposti','20–35 · Pericoli e valutazione','35–50 · Misure e programma','50–57 · Confronto gruppi','57–60 · Debrief'],
      common_errors:['Partire dal catalogo dei rischi invece che dalle attività.','Produrre un DVR formalmente completo ma privo di decisioni verificabili.'],
      guided:{observe:['Processi','Attività','Persone','Attrezzature/sostanze','Interferenze','Eventi recenti'],importance:['Il caso obbliga a integrare gli strumenti del modulo comune.'],apply:['Costruire una catena tracciabile da attività a misura e riesame.']},
      operational:{objective:'Applicare in modo integrato il processo di valutazione.',before:['Leggi il caso senza partire da un modello precompilato'],during:['Motiva ogni scelta e ogni priorità'],after:['Confronta il risultato con lavoro reale e trigger di riesame'],step_by_step:['Contesto','Attività','Pericoli','Esposti','Valutazione','Misure','Programma','Riesame'],if_problem:['Se una conclusione non è supportata da dati, dichiarare l’informazione mancante.'],stop_conditions:['Rischio grave lasciato senza misura immediata'],who_to_involve:['Gruppo corsisti','Docente','Figure aziendali simulate nel caso'],remember:'Il DVR è la traccia delle decisioni di prevenzione, non un elenco prefabbricato.'},
      discussion_feedback:{answer:['La coerenza tra attività reale, esposizione, criteri e misure.'],case_solution:['Mappare processi e attività','Identificare pericoli ed esposti','Motivare valutazione','Definire misure e programma','Stabilire trigger di riesame'],general_solution:['Dal lavoro reale alla decisione verificabile.']},
      idea_images:[{file:'idea-dvr-reading.svg',caption:'Dal contesto alla valutazione e alle misure.'},{file:'idea-risk-cycle.svg',caption:'Il ciclo si chiude solo con verifica e riesame.'}],
      quiz:{q:'Nell’esercitazione DVR qual è il punto di partenza più corretto?',answers:['Il lavoro reale: processi, attività, persone e condizioni.','Un elenco standard di rischi da copiare.','La scelta dei DPI.'],correct:0,explanation:'La valutazione parte dalla comprensione del contesto e delle attività effettive.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; artt. 17, 28 e 29 d.lgs. 81/2008'})
  ];
})();
