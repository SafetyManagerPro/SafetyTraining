/* SafetyTraining — Formazione Generale 4h, revisione didattica v2.
   Layer di presentazione per Aula/Docente. Non modifica Test Builder o banche domande finali. */
(() => {
  'use strict';

  const course = (window.SAFETY_DATA || []).find(c => c.id === 'generale');
  if (!course) return;

  course.didactic_version = 'general-v2';
  course.subtitle = '4 ore · rischio, prevenzione, sistema aziendale, comportamenti, segnalazioni ed emergenze';
  course.disclaimer = 'Percorso didattico per la formazione generale dei lavoratori. Le domande presenti nelle slide sono strumenti di confronto in aula e non costituiscono la verifica finale del corso.';

  // Le 7 Learning Unit atomiche restano riutilizzabili; in aula sono organizzate in 4 macro-blocchi.
  course.modules = [
    {
      id: 'lg01',
      title: 'LG01 · Capire il rischio e scegliere le misure',
      topic_ids: ['rischio', 'prevenzione-protezione'],
      minutes: 70,
      start_minute: 0,
      end_minute: 70
    },
    {
      id: 'lg02',
      title: 'LG02 · Il sistema aziendale della prevenzione',
      topic_ids: ['organizzazione'],
      minutes: 45,
      start_minute: 70,
      end_minute: 115
    },
    {
      id: 'lg03',
      title: 'LG03 · Diritti, doveri e comportamenti sicuri',
      topic_ids: ['diritti-doveri'],
      minutes: 40,
      start_minute: 115,
      end_minute: 155
    },
    {
      id: 'lg04',
      title: 'LG04 · Segnalare, reagire e orientarsi in emergenza',
      topic_ids: ['incidenti', 'emergenze-generale', 'segnaletica-generale'],
      minutes: 85,
      start_minute: 155,
      end_minute: 240
    }
  ];

  const patches = {
    rischio: {
      slide_title: 'Pericolo, rischio e danno: leggere una situazione prima di agire',
      summary: 'Il pericolo è ciò che può causare un danno; il rischio nasce quando persone e attività possono essere esposte a quel pericolo. Riconoscerli prima di agire è il primo passo della prevenzione.',
      detail: 'Pericolo, esposizione, evento e danno non sono sinonimi. Una fonte pericolosa può esistere senza produrre automaticamente un infortunio: il rischio cambia in base a chi è esposto, per quanto tempo, con quali modalità e con quali misure già presenti. La valutazione serve a decidere cosa eliminare, cosa ridurre e cosa controllare.',
      question: 'Guardando il vostro lavoro quotidiano: qual è un pericolo che spesso viene scambiato per “il rischio”?',
      case: 'Una prolunga con guaina lesionata serve per finire un’attività urgente. Un collega propone di usarla “solo cinque minuti”. Quali elementi devi riconoscere prima di decidere?',
      risks: [
        'Confondere il pericolo con il danno già avvenuto',
        'Valutare solo il comportamento individuale e non le condizioni di lavoro',
        'Normalizzare anomalie e quasi incidenti perché “finora non è successo nulla”'
      ],
      prevention: [
        'Osservare attività, ambiente e persone esposte prima di iniziare',
        'Eliminare o ridurre il pericolo alla fonte quando possibile',
        'Segnalare anomalie e cambiamenti prima che diventino eventi dannosi'
      ],
      procedure: [
        'Osserva la situazione reale',
        'Individua la fonte di pericolo',
        'Chiediti chi può essere esposto e come',
        'Verifica le misure già presenti',
        'Se il rischio non è controllato: fermati, segnala, ripristina'
      ],
      good: [
        'Fermarsi davanti a una condizione diversa da quella prevista',
        'Descrivere il pericolo con fatti concreti',
        'Segnalare un near miss anche quando non ci sono danni'
      ],
      bad: [
        '“È sempre andata bene”',
        '“Lo faccio solo per un minuto”',
        '“Il DPI basta, quindi il problema è risolto”'
      ],
      idea_images: [
        { file: 'scene-generale.svg', caption: 'Scenario da leggere insieme: prima si osserva, poi si decide.' },
        { file: 'piramide-pericoli.svg', caption: 'Anomalie e near miss sono segnali utili prima dell’infortunio.' },
        { file: 'modello-farfalla-rischio.svg', caption: 'Dal pericolo all’evento e alle conseguenze: dove può intervenire la prevenzione.' },
        { file: 'idea-risk-cycle.svg', caption: 'Pericolo → esposizione → possibile evento → danno → misura.' }
      ],
      graphic_cards: [
        {
          kicker: 'LETTURA DEL RISCHIO',
          title: 'Non aspettare il danno per accorgerti del rischio',
          text: 'Anomalie, deviazioni e near miss sono informazioni: permettono di correggere il sistema prima che l’evento produca conseguenze.',
          image: 'piramide-pericoli.svg',
          caption: 'Piramide dei pericoli e degli eventi.',
          points: [
            'Una condizione pericolosa è già un segnale da gestire.',
            'Il near miss non è “fortuna”: è un’occasione di apprendimento.',
            'La prevenzione efficace interviene prima dell’infortunio.'
          ]
        },
        {
          kicker: 'SCHEMA CAUSALE',
          title: 'Dove intervenire prima che accada l’evento',
          text: 'Il modello mostra che si può agire sulle cause, sulle barriere preventive e sulle conseguenze: non esiste un solo punto di controllo.',
          image: 'modello-farfalla-rischio.svg',
          caption: 'Modello a farfalla semplificato per la discussione in aula.',
          points: [
            'Controllare le cause riduce la probabilità.',
            'Le barriere devono essere presenti e funzionanti.',
            'Le misure di emergenza limitano le conseguenze, ma non sostituiscono la prevenzione.'
          ]
        }
      ],
      teacher: 'Non iniziare con la definizione normativa. Mostra prima una scena concreta e fai nominare ai corsisti: fonte di pericolo, persona esposta, possibile evento, possibile danno e misura.',
      teacher_expansion: [
        '[0–5 min] Apertura: mostra una situazione quotidiana (cavo danneggiato, pavimento bagnato, mezzo in retromarcia). Chiedi “che cosa vedete?” senza usare ancora le parole pericolo e rischio.',
        '[5–13 min] Dai le definizioni solo dopo gli esempi. Ribadisci che il rischio non è un oggetto: dipende dall’esposizione e dalle condizioni reali.',
        '[13–20 min] Usa la piramide per spiegare perché anomalie e near miss vanno segnalati. Evita di presentare rapporti numerici come leggi universali: il valore didattico è la logica preventiva.',
        '[20–28 min] Lavora sul caso della prolunga lesionata. Fai emergere urgenza, normalizzazione della deviazione e responsabilità di fermarsi/segnalare.',
        '[28–35 min] Chiusura: ogni corsista costruisce un esempio “pericolo → esposizione → evento → danno → misura” riferito alla propria mansione.'
      ],
      teaching_steps: [
        '0–5 min · Osservazione libera di uno scenario',
        '5–13 min · Pericolo, esposizione, rischio, evento e danno',
        '13–20 min · Piramide: anomalie e near miss',
        '20–28 min · Caso guidato e confronto',
        '28–35 min · Applicazione alla mansione + messaggio finale'
      ],
      common_errors: [
        'Dire “rischio = pericolo” senza distinguere esposizione e conseguenza.',
        'Attribuire ogni incidente alla distrazione del lavoratore senza cercare cause tecniche e organizzative.',
        'Usare la piramide come formula matematica invece che come strumento per valorizzare i segnali deboli.'
      ],
      example_story: 'In un magazzino una piccola perdita rende il pavimento scivoloso. Per giorni tutti la evitano passando di lato. Nessuno cade: proprio per questo il problema diventa “normale”. Il rischio non è diminuito; è stata solo rinviata la possibile conseguenza.',
      guided: {
        observe: ['Fonte di pericolo', 'Chi è esposto', 'Cosa può succedere', 'Quali barriere sono già presenti'],
        importance: ['Leggere il rischio prima dell’azione permette di evitare l’evento.', 'Un’anomalia ripetuta e tollerata tende a diventare una prassi.'],
        apply: ['Elimina se possibile', 'Riduci l’esposizione', 'Controlla le misure', 'Segnala ciò che non puoi risolvere']
      },
      operational: {
        category: 'general',
        objective: 'Riconoscere una situazione pericolosa e trasformarla in una decisione operativa prima che avvenga l’evento.',
        what_to_do: ['Osserva il lavoro reale', 'Individua il pericolo', 'Valuta l’esposizione', 'Controlla le misure', 'Segnala e interrompi se il rischio non è controllato'],
        before: ['Guarda ambiente, attività e persone coinvolte.', 'Verifica che condizioni e attrezzature corrispondano a quelle previste.'],
        during: ['Controlla se cambiano persone, spazi, tempi o attrezzature.', 'Non normalizzare deviazioni dalla procedura.'],
        after: ['Segnala anomalie e near miss.', 'Verifica che la criticità sia presa in carico.'],
        step_by_step: ['Osserva', 'Individua', 'Valuta', 'Controlla', 'Segnala'],
        if_problem: ['Fermati se compare un pericolo non controllato.', 'Metti in sicurezza solo se puoi farlo senza esporti.', 'Avvisa il preposto/responsabile.'],
        stop_conditions: ['Protezione mancante o inefficace', 'Condizione diversa da quella prevista', 'Pericolo nuovo o non valutato'],
        who_to_involve: ['Preposto/responsabile operativo', 'RSPP per aspetti tecnici e organizzativi', 'RLS per segnalazioni e partecipazione quando pertinente'],
        remember: 'Prima di chiederti “come faccio?”, chiediti “che cosa può andare storto e cosa lo impedisce?”.',
        adaptation: 'Gli esempi devono essere sostituiti o integrati con rischi e situazioni del DVR e della mansione reale.'
      },
      discussion_feedback: {
        answer: ['Non usare la prolunga danneggiata', 'Impedirne l’uso se possibile senza esporsi', 'Segnalare la condizione e ottenere un’attrezzatura idonea'],
        explanation: 'L’urgenza non modifica il pericolo. Usare temporaneamente un’attrezzatura danneggiata significa accettare consapevolmente una condizione non controllata.',
        case_solution: ['Interrompi l’uso', 'Segnala', 'Sostituisci o ripristina', 'Riprendi solo in condizioni sicure'],
        general_solution: ['Riconosci il pericolo', 'Riduci l’esposizione', 'Verifica le barriere', 'Non normalizzare anomalie']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    },

    'prevenzione-protezione': {
      slide_title: 'Prevenzione e protezione: intervenire prima, non solo difendersi dopo',
      summary: 'La prevenzione riduce la probabilità che l’evento accada; la protezione limita l’esposizione o le conseguenze. Le misure vanno scelte secondo una gerarchia, privilegiando interventi alla fonte e protezioni collettive.',
      detail: 'Una misura efficace non si sceglie partendo dal DPI. Prima si valuta se il pericolo può essere eliminato o sostituito, poi si interviene con soluzioni tecniche e organizzative; i dispositivi di protezione individuale completano il sistema quando rimane un rischio residuo.',
      question: 'Se una macchina produce troppo rumore, qual è la prima domanda da fare: “quali cuffie compro?” oppure “posso eliminare o ridurre il rumore alla fonte?”',
      case: 'Una lavorazione rumorosa supera il livello accettabile. L’unica proposta iniziale è consegnare otoprotettori. Come costruiresti una strategia più completa?',
      risks: ['Affidarsi al solo DPI', 'Scegliere misure senza verificare l’efficacia', 'Confondere una procedura scritta con una misura realmente applicata'],
      prevention: ['Eliminare o sostituire il pericolo quando possibile', 'Usare misure tecniche e protezioni collettive', 'Organizzare tempi, accessi e procedure', 'Usare DPI per il rischio residuo e verificarne l’uso corretto'],
      procedure: ['Elimina o sostituisci', 'Riduci alla fonte', 'Isola o proteggi collettivamente', 'Organizza il lavoro', 'Gestisci il rischio residuo con DPI adeguati'],
      idea_images: [
        { file: 'idea-dpi-hierarchy.svg', caption: 'Gerarchia delle misure: il DPI non è il primo gradino.' },
        { file: 'procedura-operativa-5-fasi.svg', caption: 'Dalla preparazione alla verifica finale: la misura deve funzionare nel lavoro reale.' },
        { file: 'idea-risk-cycle.svg', caption: 'La misura interrompe la catena tra pericolo, esposizione ed evento.' }
      ],
      graphic_cards: [{
        kicker: 'GERARCHIA DELLE MISURE',
        title: 'Il DPI è importante, ma non sostituisce la prevenzione alla fonte',
        text: 'Più la misura agisce vicino alla fonte del pericolo e meno dipende dal comportamento del singolo, più è robusta.',
        image: 'idea-dpi-hierarchy.svg',
        caption: 'Gerarchia semplificata delle misure di prevenzione e protezione.',
        points: ['Eliminare è meglio che proteggersi dall’esposizione.', 'Le misure collettive proteggono più persone.', 'Il DPI richiede scelta, formazione, uso e controllo.']
      }],
      teacher: 'Usa un solo caso e fai “salire” la classe lungo la gerarchia delle misure. Ogni proposta deve rispondere a: su cosa agisce? da chi dipende? come verifichiamo che funzioni?',
      teacher_expansion: [
        '[0–5 min] Riparti dal tema precedente: trovato il rischio, che cosa facciamo? Raccogli le prime proposte senza giudicarle.',
        '[5–12 min] Distingui prevenzione e protezione con esempi molto concreti.',
        '[12–20 min] Mostra la gerarchia: eliminazione/sostituzione → misure tecniche/collettive → organizzazione → DPI.',
        '[20–30 min] Caso rumore: chiedi almeno una misura per ciascun livello e discutine robustezza e limiti.',
        '[30–35 min] Chiusura: una misura esiste davvero solo se è applicata, mantenuta e verificata.'
      ],
      teaching_steps: ['0–5 min · Brainstorming sulle misure', '5–12 min · Prevenzione vs protezione', '12–20 min · Gerarchia delle misure', '20–30 min · Caso rumore', '30–35 min · Verifica dell’efficacia'],
      common_errors: ['Partire dal DPI come unica soluzione.', 'Confondere “abbiamo una procedura” con “la procedura viene applicata”.', 'Non verificare manutenzione e permanenza dell’efficacia della misura.'],
      example_story: 'Una zona di passaggio è pericolosa per la caduta di oggetti. Consegnare il casco riduce una possibile conseguenza; eliminare il transito sotto il punto di caduta o installare una protezione collettiva agisce invece sul rischio in modo più robusto.',
      operational: {
        category: 'general',
        objective: 'Scegliere misure che riducano il rischio alla fonte e verificare che funzionino nel tempo.',
        what_to_do: ['Prova a eliminare', 'Riduci tecnicamente', 'Proteggi collettivamente', 'Organizza', 'Completa con DPI quando necessario'],
        before: ['Definisci il rischio da controllare.', 'Verifica quali misure sono già presenti e se sono efficaci.'],
        during: ['Non bypassare protezioni o procedure.', 'Controlla che la misura resti applicabile nelle condizioni reali.'],
        after: ['Verifica l’efficacia.', 'Segnala guasti, limiti o comportamenti che rendono la misura inefficace.'],
        step_by_step: ['Elimina', 'Riduci', 'Proteggi', 'Organizza', 'Completa'],
        if_problem: ['Se la misura non funziona, non compensare con una scorciatoia.', 'Interrompi o limita l’attività secondo procedura e segnala.'],
        stop_conditions: ['Protezione collettiva assente o guasta', 'DPI necessario ma non disponibile/idoneo', 'Procedura non applicabile alla situazione reale'],
        who_to_involve: ['Preposto/responsabile', 'RSPP', 'Datore/dirigente per decisioni organizzative e risorse'],
        remember: 'Prima riduci il rischio alla fonte; poi gestisci ciò che rimane.',
        adaptation: 'La gerarchia va applicata alle misure concretamente previste dal DVR e dalle procedure aziendali.'
      },
      discussion_feedback: {
        answer: ['Ridurre il rumore alla fonte', 'Isolare/separare la sorgente', 'Ridurre esposizione con organizzazione del lavoro', 'Usare otoprotettori adeguati per il rischio residuo'],
        explanation: 'Il DPI può essere necessario ma non deve diventare l’unica risposta quando esistono misure tecniche o organizzative più efficaci.',
        case_solution: ['Analizza sorgente', 'Applica misure tecniche', 'Organizza l’esposizione', 'Completa con DPI', 'Verifica efficacia'],
        general_solution: ['Agisci alla fonte', 'Privilegia protezione collettiva', 'Gestisci il rischio residuo', 'Controlla nel tempo']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    },

    organizzazione: {
      slide_title: 'Chi fa cosa: il sistema aziendale della prevenzione',
      summary: 'La sicurezza non dipende da una sola persona: datore di lavoro, dirigenti, preposti, lavoratori, RSPP/ASPP, RLS, medico competente e addetti alle emergenze hanno ruoli diversi che devono comunicare tra loro.',
      detail: 'Capire i ruoli significa sapere chi decide e organizza, chi vigila sul lavoro, chi supporta tecnicamente, chi rappresenta i lavoratori, chi svolge la sorveglianza sanitaria e chi interviene nelle emergenze. Le funzioni non vanno confuse: il supporto dell’RSPP, ad esempio, non sostituisce le responsabilità decisionali del datore di lavoro.',
      question: 'Se vedi una protezione rotta, a chi lo dici? E chi deve poi decidere e organizzare la correzione?',
      case: 'Un lavoratore segnala una protezione guasta all’RSPP e pensa che “adesso è responsabilità sua”. Che cosa manca in questo ragionamento?',
      risks: ['Non sapere a chi segnalare', 'Confondere consulenza tecnica e potere decisionale', 'Pensare che la sicurezza appartenga solo a RSPP o preposto'],
      prevention: ['Ruoli chiari e comunicati', 'Canali di segnalazione semplici', 'Vigilanza e follow-up delle azioni', 'Consultazione e collaborazione tra figure'],
      procedure: ['Riconosci il problema', 'Avvisa il referente operativo', 'Coinvolgi la funzione competente', 'Assegna decisione/azione a chi ne ha il potere', 'Verifica che la correzione sia stata attuata'],
      idea_images: [
        { file: 'organigramma-sicurezza.svg', caption: 'Organigramma didattico: ruoli diversi, relazioni diverse.' },
        { file: 'idea-safety-system.svg', caption: 'La prevenzione funziona come sistema, non come somma di figure isolate.' },
        { file: 'stop-segnala-ripristina.svg', caption: 'Dal problema alla ripresa: segnalazione, presa in carico e verifica.' }
      ],
      graphic_cards: [{
        kicker: 'ORGANIGRAMMA DELLA SICUREZZA',
        title: 'Ruoli diversi, una responsabilità organizzata',
        text: 'Il valore dell’organigramma non è imparare una lista di sigle: è sapere chi contattare, chi decide, chi controlla e chi supporta.',
        image: 'organigramma-sicurezza.svg',
        caption: 'Schema didattico delle principali figure della prevenzione.',
        points: ['Datore/dirigenti organizzano e decidono nel proprio ambito.', 'Il preposto vigila sul lavoro operativo.', 'RSPP supporta tecnicamente; RLS rappresenta i lavoratori.', 'Il lavoratore collabora, applica e segnala.']
      }],
      teacher: 'Usa l’organigramma come una mappa delle relazioni. Non trasformare questa unità in una sequenza di definizioni giuridiche: per ogni figura chiedi “quando la incontriamo nel lavoro reale?”.',
      teacher_expansion: [
        '[0–6 min] Domanda iniziale: “chi è responsabile della sicurezza?”. Usa le risposte per mostrare che la domanda è troppo generica.',
        '[6–18 min] Costruisci l’organigramma partendo da datore → dirigente → preposto → lavoratore e poi aggiungi funzioni di supporto/consultazione.',
        '[18–28 min] Chiarisci gli equivoci più frequenti: RSPP non è il “capo della sicurezza”; RLS non gestisce la sicurezza; medico competente non sostituisce il datore.',
        '[28–38 min] Caso della protezione guasta: fate percorrere insieme il flusso segnalazione → decisione → intervento → verifica.',
        '[38–45 min] Chiusura: ogni corsista deve sapere chi è il proprio referente operativo e come segnalare una criticità.'
      ],
      teaching_steps: ['0–6 min · “Chi è responsabile?”', '6–18 min · Costruzione organigramma', '18–28 min · Cosa fa / cosa non fa ogni figura', '28–38 min · Caso segnalazione', '38–45 min · Mappa dei riferimenti reali'],
      common_errors: ['Definire l’RSPP come responsabile di tutto ciò che riguarda la sicurezza.', 'Confondere preposto e RLS.', 'Presentare le figure senza spiegare come comunicano e come una segnalazione viene chiusa.'],
      example_story: 'Un’anomalia viene segnalata a voce durante un turno, ma nessuno sa chi debba prenderla in carico. Il giorno dopo è ancora presente. Il problema non è solo “chi ha sbagliato”: è un flusso organizzativo che non ha trasformato la segnalazione in azione.',
      operational: {
        category: 'system',
        objective: 'Sapere a chi rivolgersi e comprendere come una criticità deve diventare un’azione tracciabile.',
        what_to_do: ['Segnala al referente operativo', 'Fornisci informazioni concrete', 'Coinvolgi la funzione competente', 'Verifica la presa in carico'],
        before: ['Conosci ruoli, nomi e canali di comunicazione della tua organizzazione.'],
        during: ['Segnala fatti, non giudizi.', 'In presenza di pericolo immediato gestisci prima la sicurezza della situazione.'],
        after: ['Verifica che il problema abbia un responsabile e un esito.', 'Riporta la criticità se resta aperta.'],
        step_by_step: ['Segnala', 'Assegna', 'Intervieni', 'Verifica'],
        if_problem: ['Se non sai a chi rivolgerti, parti dal preposto/responsabile operativo.', 'Se la situazione è urgente, non aspettare il normale flusso amministrativo.'],
        stop_conditions: ['Pericolo grave/immediato', 'Protezione essenziale non disponibile', 'Attività fuori dalle condizioni previste'],
        who_to_involve: ['Preposto', 'Datore/dirigente', 'RSPP', 'RLS', 'Medico competente quando il tema riguarda la sorveglianza sanitaria'],
        remember: 'La sicurezza funziona quando ogni problema ha un canale, un responsabile, una misura e una verifica.',
        adaptation: 'Sostituire lo schema generico con nomi, ruoli e flussi reali dell’azienda/ente quando disponibili.'
      },
      discussion_feedback: {
        answer: ['L’RSPP può supportare l’analisi, ma la segnalazione deve entrare nel sistema organizzativo che ha potere di decidere e intervenire.', 'La criticità deve avere presa in carico e verifica finale.'],
        explanation: 'Le funzioni di supporto non assorbono gli obblighi delle figure che organizzano e dirigono il lavoro.',
        case_solution: ['Segnala al referente operativo', 'Coinvolgi RSPP se serve supporto tecnico', 'Definisci l’azione', 'Verifica il ripristino'],
        general_solution: ['Ruoli chiari', 'Segnalazioni tracciabili', 'Presa in carico', 'Follow-up']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    },

    'diritti-doveri': {
      slide_title: 'Diritti e doveri: la sicurezza è anche comportamento',
      summary: 'Il lavoratore deve essere messo nelle condizioni di lavorare in sicurezza e, a sua volta, deve rispettare istruzioni, usare correttamente attrezzature e DPI, non rimuovere protezioni e segnalare pericoli e difetti.',
      detail: 'La prevenzione è un patto operativo: l’organizzazione deve valutare i rischi, fornire informazioni, formazione, mezzi e misure adeguate; il lavoratore deve collaborare attivamente, applicare le disposizioni ricevute e non trasformare l’esperienza personale in una licenza a improvvisare.',
      question: 'Qual è la differenza tra “eseguire un ordine” e “collaborare alla sicurezza” quando noti una condizione pericolosa?',
      case: 'Una protezione rallenta una lavorazione. Un collega la rimuove e dice: “so quello che faccio, l’ho già fatto cento volte”. Come deve reagire chi assiste?',
      risks: ['Rimozione o elusione delle protezioni', 'Mancata segnalazione di difetti', 'Uso improprio di attrezzature e DPI', 'Scorciatoie giustificate dall’esperienza o dalla fretta'],
      prevention: ['Istruzioni comprensibili', 'Formazione e addestramento pertinenti', 'Uso corretto di attrezzature e DPI', 'Segnalazione tempestiva', 'Vigilanza coerente'],
      procedure: ['Comprendi l’istruzione', 'Verifica che le condizioni siano quelle previste', 'Applica senza scorciatoie', 'Segnala anomalie', 'Fermati e chiedi supporto se la sicurezza non è garantita'],
      idea_images: [
        { file: 'rights.svg', caption: 'Diritti e doveri devono essere letti insieme.' },
        { file: 'stop-segnala-ripristina.svg', caption: 'Se la condizione non è sicura: stop, segnalazione, ripristino, verifica.' },
        { file: 'procedura-operativa-5-fasi.svg', caption: 'Una buona procedura guida il comportamento prima, durante e dopo l’attività.' }
      ],
      graphic_cards: [{
        kicker: 'COMPORTAMENTO OPERATIVO',
        title: 'STOP → SEGNALA → RIPRISTINA → VERIFICA',
        text: 'Quando una condizione non è più quella prevista, la risposta sicura non è improvvisare: si interrompe, si segnala e si riprende solo dopo il ripristino.',
        image: 'stop-segnala-ripristina.svg',
        caption: 'Sequenza operativa per gestire una condizione non sicura.',
        points: ['Segnalare non significa “lamentarsi”.', 'L’esperienza non autorizza a bypassare una protezione.', 'Riprendere senza verificare espone di nuovo allo stesso rischio.']
      }],
      teacher: 'Evita una lezione centrata sulle sanzioni. Fai emergere cosa deve fare concretamente una persona quando vede un problema e perché la segnalazione è parte del lavoro.',
      teacher_expansion: [
        '[0–5 min] Fai completare la frase: “Un lavoratore ha diritto a…” e poi “Un lavoratore deve…”. Metti le risposte in due colonne.',
        '[5–15 min] Collega diritti e doveri: formazione comprensibile, mezzi adeguati e procedure da una parte; uso corretto, collaborazione e segnalazione dall’altra.',
        '[15–25 min] Caso protezione rimossa. Non chiedere subito “chi viene sanzionato?”, ma “che cosa deve succedere nei prossimi 30 secondi?”.',
        '[25–34 min] Usa STOP–SEGNALA–RIPRISTINA–VERIFICA come schema operativo.',
        '[34–40 min] Chiusura: chiedi quali scorciatoie vengono normalizzate più facilmente nel loro contesto e come prevenirle.'
      ],
      teaching_steps: ['0–5 min · Diritti / doveri in due colonne', '5–15 min · Patto operativo', '15–25 min · Caso protezione rimossa', '25–34 min · Stop–segnala–ripristina', '34–40 min · Scorciatoie da non normalizzare'],
      common_errors: ['Ridurre l’argomento alle sanzioni.', 'Far credere che segnalare un pericolo equivalga a rifiutare il lavoro.', 'Presentare l’esperienza come sostitutiva di procedura, formazione o addestramento.'],
      example_story: 'Un lavoratore esperto usa per mesi una macchina con un microinterruttore manomesso. Nessun incidente rafforza l’idea che la modifica sia innocua. La ripetizione della deviazione la rende “normale”, non sicura.',
      operational: {
        category: 'general',
        objective: 'Tradurre diritti e doveri in comportamenti osservabili durante il lavoro.',
        what_to_do: ['Segui le istruzioni', 'Usa correttamente mezzi e DPI', 'Non rimuovere protezioni', 'Segnala difetti/pericoli', 'Partecipa a formazione e addestramento previsti'],
        before: ['Assicurati di aver compreso attività e istruzioni.', 'Verifica che attrezzature e protezioni siano idonee.'],
        during: ['Non usare scorciatoie.', 'Segnala immediatamente variazioni o anomalie.'],
        after: ['Lascia l’area in sicurezza.', 'Assicurati che le anomalie segnalate siano prese in carico.'],
        step_by_step: ['Comprendi', 'Controlla', 'Esegui', 'Segnala', 'Verifica'],
        if_problem: ['Stop se la condizione non è controllata.', 'Avvisa preposto/responsabile.', 'Riprendi solo dopo il ripristino.'],
        stop_conditions: ['Protezione rimossa/inefficace', 'Attrezzatura o DPI difettoso', 'Istruzione non chiara o non applicabile'],
        who_to_involve: ['Preposto/responsabile', 'Datore/dirigente per problemi organizzativi', 'RLS quando pertinente'],
        remember: 'La sicurezza non è obbedienza cieca: è applicare le regole e segnalare quando le condizioni non sono più sicure.',
        adaptation: 'Usare procedure e canali di segnalazione realmente adottati dall’azienda/ente.'
      },
      discussion_feedback: {
        answer: ['Non accettare la rimozione della protezione', 'Interrompere/segnalare la condotta secondo ruolo e procedura', 'Ripristinare la protezione prima di riprendere'],
        explanation: 'La competenza non elimina il pericolo. Rimuovere o eludere una protezione trasforma una deviazione in una condizione di rischio intenzionalmente accettata.',
        case_solution: ['Stop', 'Segnala', 'Ripristina', 'Verifica'],
        general_solution: ['Procedure chiare', 'Vigilanza', 'Segnalazione', 'Nessuna normalizzazione delle scorciatoie']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    },

    incidenti: {
      slide_title: 'Infortuni, near miss e anomalie: imparare prima che il danno si ripeta',
      summary: 'Un near miss e un’anomalia non sono eventi “senza importanza”: raccontano dove le barriere hanno quasi fallito e permettono di migliorare prima del prossimo evento.',
      detail: 'La segnalazione utile descrive fatti, condizioni, sequenza e misure presenti senza cercare subito un colpevole. Lo scopo è capire perché l’evento è stato possibile e quali cambiamenti tecnici, organizzativi o comportamentali possono evitare che si ripeta.',
      question: 'Quale quasi incidente ricordate che avrebbe potuto avere conseguenze molto diverse con pochi centimetri o pochi secondi di differenza?',
      case: 'Un carrello fa retromarcia e un pedone deve spostarsi rapidamente per evitare l’urto. Nessuno si fa male. È sufficiente dire “è andata bene”?',
      risks: ['Non segnalare perché non ci sono danni', 'Cercare subito il colpevole', 'Raccogliere opinioni invece di fatti', 'Correggere solo il comportamento senza analizzare il sistema'],
      prevention: ['Cultura della segnalazione', 'Analisi di fatti e cause', 'Azioni correttive con responsabile e scadenza', 'Verifica che la misura abbia davvero ridotto il rischio'],
      procedure: ['Metti in sicurezza', 'Raccogli i fatti essenziali', 'Segnala secondo il canale previsto', 'Individua cause e barriere fallite', 'Definisci e verifica le azioni'],
      idea_images: [
        { file: 'piramide-pericoli.svg', caption: 'Near miss e anomalie sono segnali da leggere, non episodi da dimenticare.' },
        { file: 'modello-farfalla-rischio.svg', caption: 'Ricostruire l’evento significa capire quali barriere sono mancate o hanno fallito.' },
        { file: 'stop-segnala-ripristina.svg', caption: 'Segnalare serve a chiudere il ciclo con un’azione verificata.' }
      ],
      graphic_cards: [{
        kicker: 'NEAR MISS',
        title: '“Non è successo niente” è proprio il momento migliore per imparare',
        text: 'Quando l’esito è stato favorevole ma la sequenza era pericolosa, abbiamo informazioni preziose senza aver pagato il costo di un danno.',
        image: 'piramide-pericoli.svg',
        caption: 'Dai segnali deboli agli eventi con danno.',
        points: ['Descrivi cosa è successo.', 'Chiedi perché era possibile.', 'Correggi la barriera debole.', 'Verifica che l’azione resti efficace.']
      }],
      teacher: 'Se possibile usa un near miss reale anonimizzato. Evita il tono investigativo/sanzionatorio: la prima finalità didattica è far capire perché segnalare conviene a tutti.',
      teacher_expansion: [
        '[0–5 min] Chiedi se un evento senza feriti “conta”. Raccogli le opinioni.',
        '[5–12 min] Distingui infortunio, near miss e anomalia/condizione pericolosa con esempi.',
        '[12–20 min] Mostra la piramide: non usare numeri rigidi; usa il concetto di segnali precoci.',
        '[20–30 min] Caso carrello-pedone: ricostruisci fatti, barriere e cause possibili.',
        '[30–35 min] Chiusura: una segnalazione è utile solo se produce presa in carico, azione e verifica.'
      ],
      teaching_steps: ['0–5 min · Conta anche se nessuno si fa male?', '5–12 min · Infortunio / near miss / anomalia', '12–20 min · Piramide e segnali deboli', '20–30 min · Caso carrello-pedone', '30–35 min · Dal report all’azione'],
      common_errors: ['Dire “errore umano” e fermare l’analisi.', 'Usare il near miss solo per trovare responsabilità individuali.', 'Raccogliere segnalazioni senza dare feedback o chiudere le azioni.'],
      example_story: 'Un utensile cade da un ripiano e atterra a pochi centimetri da un lavoratore. Se il report si limita a “fare più attenzione”, il sistema non impara nulla su stoccaggio, fissaggio, disposizione degli spazi e controlli.',
      operational: {
        category: 'general',
        objective: 'Trasformare eventi e quasi eventi in informazioni utili per prevenire la ripetizione.',
        what_to_do: ['Metti in sicurezza', 'Raccogli fatti', 'Segnala', 'Analizza', 'Correggi', 'Verifica'],
        before: ['Conosci il canale di segnalazione.', 'Sappi quali informazioni minime servono.'],
        during: ['Proteggi persone e area prima di raccogliere informazioni.', 'Distingui fatti da interpretazioni.'],
        after: ['Assegna azione e scadenza.', 'Comunica il feedback.', 'Verifica l’efficacia.'],
        step_by_step: ['Sicurezza', 'Fatti', 'Segnalazione', 'Cause', 'Azioni', 'Verifica'],
        if_problem: ['Se permane un pericolo, non aspettare il report: gestisci subito la condizione.', 'Se mancano informazioni, evita conclusioni premature.'],
        stop_conditions: ['Pericolo ancora presente', 'Attrezzatura coinvolta non verificata', 'Area non messa in sicurezza'],
        who_to_involve: ['Preposto/responsabile', 'RSPP', 'RLS secondo sistema aziendale', 'Datore/dirigente per azioni organizzative'],
        remember: 'Un near miss è un avvertimento gratuito: sprecarlo significa rinunciare a prevenire.',
        adaptation: 'Usare il sistema di reporting realmente adottato e casi coerenti con la mansione.'
      },
      discussion_feedback: {
        answer: ['Mettere in sicurezza il percorso', 'Segnalare il near miss', 'Analizzare separazione pedoni-mezzi, visibilità, velocità, procedure e organizzazione'],
        explanation: 'L’assenza di danno non rende sicura la sequenza. Il quasi urto mostra che una o più barriere erano deboli.',
        case_solution: ['Sicurezza immediata', 'Raccolta fatti', 'Analisi delle barriere', 'Azione correttiva', 'Verifica'],
        general_solution: ['Segnala presto', 'Analizza il sistema', 'Correggi prima del prossimo evento']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    },

    'emergenze-generale': {
      slide_title: 'Emergenza: riconoscere, allertare, evacuare senza improvvisare',
      summary: 'Nell’emergenza il lavoratore deve riconoscere l’allarme, seguire le procedure, avvisare correttamente e raggiungere il luogo sicuro. I compiti specialistici spettano agli addetti formati e designati.',
      detail: 'La formazione generale non trasforma il lavoratore in addetto antincendio o primo soccorso. Serve invece a sapere che cosa fare quando cambia improvvisamente lo scenario: come dare l’allarme, quali vie seguire, quali comportamenti evitare e come facilitare l’intervento degli addetti e dei soccorsi.',
      question: 'Se senti l’allarme ma non vedi il pericolo, qual è il comportamento corretto: cercare personalmente la causa oppure seguire la procedura?',
      case: 'Durante il lavoro senti odore di bruciato e poi scatta l’allarme. Un collega vuole tornare indietro a recuperare telefono e giacca. Che cosa deve fare il gruppo?',
      risks: ['Ritardare l’allarme', 'Tornare indietro per oggetti personali', 'Usare percorsi non previsti', 'Improvisare compiti specialistici senza formazione'],
      prevention: ['Conoscere allarme e vie di esodo', 'Tenere libere le uscite', 'Conoscere punto di raccolta e riferimenti', 'Partecipare alle prove e seguire le indicazioni degli addetti'],
      procedure: ['Riconosci/allerta', 'Interrompi l’attività in sicurezza se possibile', 'Segui la via prevista', 'Non tornare indietro', 'Raggiungi il punto di raccolta e attendi indicazioni'],
      idea_images: [
        { file: 'idea-emergency-steps.svg', caption: 'Sequenza essenziale di comportamento in emergenza.' },
        { file: 'emergency.svg', caption: 'L’emergenza richiede procedure semplici e note prima dell’evento.' },
        { file: 'idea-evac-public.svg', caption: 'L’esodo deve considerare persone, percorsi e condizioni reali.' }
      ],
      graphic_cards: [{
        kicker: 'SEQUENZA DI EMERGENZA',
        title: 'RICONOSCI → ALLERTA → ESEGUI → RAGGIUNGI IL LUOGO SICURO',
        text: 'Sotto stress le procedure devono essere semplici e già note. Non è il momento di inventare una soluzione personale.',
        image: 'idea-emergency-steps.svg',
        caption: 'Passaggi essenziali per il lavoratore non addetto.',
        points: ['Allarme tempestivo.', 'Esodo lungo percorsi previsti.', 'Niente recupero di oggetti.', 'Compiti specialistici solo agli addetti formati.']
      }],
      teacher: 'Adatta questa unità alla procedura reale: tipo di allarme, vie di esodo, punto di raccolta, numeri interni. Evita di entrare nelle tecniche operative riservate alla formazione degli addetti.',
      teacher_expansion: [
        '[0–5 min] Domanda iniziale: che cosa fareste nei primi 30 secondi? Fai emergere le reazioni istintive.',
        '[5–13 min] Spiega differenza tra lavoratore e addetto all’emergenza. Il lavoratore deve sapere agire correttamente, non sostituirsi all’addetto.',
        '[13–22 min] Usa lo schema di evacuazione: allarme, arresto in sicurezza se possibile, esodo, punto di raccolta.',
        '[22–30 min] Caso odore di bruciato: discuti ritorno per oggetti, ascensori/percorsi e comunicazioni.',
        '[30–35 min] Chiusura: identifica con la classe dove sono uscita e punto di raccolta del luogo reale, se noti.'
      ],
      teaching_steps: ['0–5 min · I primi 30 secondi', '5–13 min · Lavoratore vs addetto', '13–22 min · Sequenza di evacuazione', '22–30 min · Caso pratico', '30–35 min · Procedura reale del luogo'],
      common_errors: ['Insegnare manovre specialistiche nel modulo generale.', 'Fermarsi a leggere il piano senza collegarlo a spazi reali.', 'Dare per scontato che tutti riconoscano allarme e punto di raccolta.'],
      example_story: 'Durante un allarme reale alcune persone continuano a lavorare perché pensano sia un’esercitazione. Una procedura è efficace solo se il segnale è riconoscibile, il comportamento atteso è noto e la prova viene presa sul serio.',
      operational: {
        category: 'emergency',
        objective: 'Agire rapidamente e in modo prevedibile durante un’emergenza senza assumere compiti per cui non si è formati.',
        what_to_do: ['Allerta', 'Segui procedura', 'Evacua se previsto', 'Raggiungi il punto di raccolta', 'Attendi indicazioni'],
        before: ['Conosci segnale di allarme, vie di esodo e punto di raccolta.', 'Non ostruire uscite e attrezzature di emergenza.'],
        during: ['Mantieni la calma e segui le indicazioni.', 'Non tornare indietro.', 'Non usare mezzi/attrezzature di emergenza se non previsto e se non formato.'],
        after: ['Resta disponibile per appello/informazioni.', 'Non rientrare finché non è autorizzato.'],
        step_by_step: ['Riconosci', 'Allerta', 'Esci', 'Raggiungi', 'Attendi'],
        if_problem: ['Se la via prevista è impraticabile, usa la via alternativa indicata dalla procedura.', 'Se una persona necessita assistenza, attiva immediatamente gli addetti secondo il piano.'],
        stop_conditions: ['Fumo/pericolo sul percorso', 'Indicazione degli addetti di non procedere', 'Via di esodo non praticabile'],
        who_to_involve: ['Addetti antincendio/primo soccorso', 'Preposto/responsabile', 'Soccorsi esterni secondo procedura'],
        remember: 'In emergenza non cercare di essere eroico: sii prevedibile, rapido e coerente con il piano.',
        adaptation: 'Sostituire sempre gli esempi generici con allarmi, vie, riferimenti e punto di raccolta reali.'
      },
      discussion_feedback: {
        answer: ['Non tornare indietro per oggetti', 'Seguire il percorso previsto e le indicazioni', 'Raggiungere il punto di raccolta'],
        explanation: 'Tornare indietro aumenta l’esposizione, ostacola l’esodo e può costringere gli addetti a gestire una persona in più.',
        case_solution: ['Allerta/segui allarme', 'Evacua', 'Niente recupero oggetti', 'Punto di raccolta'],
        general_solution: ['Procedura nota', 'Comportamento semplice', 'Compiti specialistici agli addetti']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    },

    'segnaletica-generale': {
      slide_title: 'Segnaletica: riconoscere il messaggio e sapere cosa fare',
      summary: 'La segnaletica comunica rapidamente un divieto, un obbligo, un avvertimento o un’informazione di emergenza. Serve a orientare il comportamento, non a sostituire le misure di sicurezza.',
      detail: 'Non è utile memorizzare decine di pittogrammi isolati. È più efficace riconoscere forma, colore e funzione delle principali famiglie e collegare immediatamente il segnale al comportamento richiesto.',
      question: 'Quando vedete un segnale, sapete prima riconoscerne la categoria oppure provate a ricordare il singolo disegno?',
      case: 'Una porta di emergenza è correttamente segnalata ma davanti sono stati temporaneamente lasciati materiali. Il cartello rende comunque sicura la via di esodo?',
      risks: ['Segnale presente ma misura non attuata', 'Cartelli non visibili o incoerenti', 'Conoscere il simbolo ma non il comportamento richiesto'],
      prevention: ['Segnaletica visibile e coerente', 'Vie e attrezzature realmente accessibili', 'Formazione sul significato operativo delle categorie'],
      procedure: ['Riconosci categoria', 'Leggi il messaggio', 'Applica il comportamento', 'Segnala segnale mancante/contraddittorio o condizione non coerente'],
      idea_images: [
        { file: 'idea-signs-basic.svg', caption: 'Famiglie principali della segnaletica di sicurezza.' },
        { file: 'scene-generale.svg', caption: 'Individua nella scena quali segnali servono e perché.' }
      ],
      graphic_cards: [{
        kicker: 'LEGGERE UN SEGNALE',
        title: 'Forma + colore + simbolo = comportamento',
        text: 'Il segnale ha valore quando il lavoratore riconosce il messaggio e sa quale azione deve compiere.',
        image: 'idea-signs-basic.svg',
        caption: 'Categorie essenziali della segnaletica.',
        points: ['Divieto: cosa non fare.', 'Obbligo: cosa fare.', 'Avvertimento: quale pericolo aspettarsi.', 'Salvataggio/emergenza: dove andare o cosa trovare.']
      }],
      teacher: 'Fai un esercizio rapido di riconoscimento per categorie. Non spendere il quarto d’ora in un catalogo di cartelli.',
      teacher_expansion: [
        '[0–3 min] Mostra 4 segnali di categorie diverse e chiedi che tipo di messaggio trasmettono.',
        '[3–8 min] Spiega come forma e colore aiutano a riconoscere la funzione prima ancora di leggere il simbolo.',
        '[8–12 min] Caso uscita di emergenza ostruita: il segnale non sostituisce una condizione fisicamente sicura.',
        '[12–15 min] Chiusura a ritmo rapido: categoria → comportamento atteso.'
      ],
      teaching_steps: ['0–3 min · Riconoscimento categorie', '3–8 min · Forma e colore', '8–12 min · Cartello vs condizione reale', '12–15 min · Ripasso rapido'],
      common_errors: ['Trasformare la segnaletica in un esercizio mnemonico.', 'Pensare che mettere un cartello elimini il pericolo.', 'Usare cartelli contraddittori o non coerenti con la situazione reale.'],
      example_story: 'Una via di esodo è perfettamente segnalata, ma la porta è bloccata da materiali. Il messaggio è corretto; il sistema di sicurezza no.',
      operational: {
        category: 'general',
        objective: 'Riconoscere rapidamente il tipo di messaggio e tradurlo nel comportamento corretto.',
        what_to_do: ['Riconosci categoria', 'Comprendi il simbolo', 'Agisci', 'Segnala incoerenze'],
        before: ['Osserva la segnaletica del luogo di lavoro e le vie di emergenza.'],
        during: ['Rispetta divieti e obblighi.', 'Non coprire/rimuovere segnali.'],
        after: ['Segnala segnaletica danneggiata, mancante o incoerente.'],
        step_by_step: ['Riconosci', 'Comprendi', 'Agisci', 'Segnala'],
        if_problem: ['Se segnale e condizione reale sono in contrasto, non affidarti al cartello: gestisci la condizione e segnala.'],
        stop_conditions: ['Via di esodo ostruita', 'Segnale di obbligo senza mezzo/DPI disponibile', 'Pericolo non adeguatamente delimitato'],
        who_to_involve: ['Preposto/responsabile', 'Addetti emergenza se riguarda vie/mezzi di emergenza'],
        remember: 'Il cartello comunica una misura: non è la misura.',
        adaptation: 'Usare fotografie o esempi della segnaletica realmente presente nella sede quando disponibili.'
      },
      discussion_feedback: {
        answer: ['No: la via di esodo deve essere realmente libera e utilizzabile.', 'Occorre rimuovere l’ostacolo e segnalare la criticità.'],
        explanation: 'La segnaletica orienta, ma non può compensare una condizione materiale incompatibile con la sicurezza.',
        case_solution: ['Rimuovi/gestisci ostacolo', 'Ripristina accessibilità', 'Segnala e verifica'],
        general_solution: ['Segnale coerente', 'Condizione reale sicura', 'Comportamento corretto']
      },
      quality: { score: 100, complete: true, version: 'general-v2', classroom_first: true, final_assessment: false }
    }
  };

  for (const topic of course.topics || []) {
    const patch = patches[topic.id];
    if (!patch) continue;
    Object.assign(topic, patch);
    topic.quality = { ...(topic.quality || {}), ...(patch.quality || {}) };
    topic.didactic_version = 'general-v2';
    if (topic.quiz) {
      topic.quiz = {
        ...topic.quiz,
        didactic_only: true,
        final_assessment: false
      };
    }
  }
})();
