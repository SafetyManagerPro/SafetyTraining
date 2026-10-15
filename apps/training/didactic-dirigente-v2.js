/* SafetyTraining — Dirigente 12h, revisione didattica v2.
   Layer Aula/Docente basato su organizzazione, decisione, delega, processi e riesame.
   Non modifica Test Builder o banca domande finale. */
(() => {
  'use strict';
  const data = window.SAFETY_DATA || [];
  const norm = s => String(s || '').toLowerCase();
  const course = data.find(c => c.id === 'dirigente') || data.find(c => norm(c.title).includes('dirigente') && !norm(c.title).includes('aggiorn'));
  if (!course) return;

  const mk = (o) => ({
    icon:'🧭', minutes:90, visual:'roles', risks:[], prevention:[], procedure:[],
    idea_images:[], graphic_cards:[], teacher_expansion:[], teaching_steps:[], common_errors:[],
    guided:{observe:[],importance:[],apply:[]},
    operational:{before:[],during:[],after:[],step_by_step:[],if_problem:[],stop_conditions:[],who_to_involve:[]},
    discussion_feedback:{answer:[],case_solution:[],general_solution:[]},
    quality:{score:100,complete:true,version:'dirigente-v2',classroom_first:false,final_assessment:false,managerial:true},
    didactic_version:'dirigente-v2', ...o
  });

  course.didactic_version='dirigente-v2';
  course.subtitle='12 ore · organizzazione, responsabilità, processi, appalti, emergenze, comunicazione e decisioni manageriali';
  course.disclaimer='La suddivisione in 4 macro-blocchi da 180 minuti è una scelta didattica interna. Le attività in aula e gli scenari non sostituiscono la verifica finale prevista dal percorso.';
  course.delivery_note='Erogazione consentita in presenza, videoconferenza sincrona o e-learning, secondo condizioni e requisiti applicabili al progetto formativo.';

  course.modules=[
    {id:'dir-a',title:'DIR-A · Ruolo, responsabilità e sistema istituzionale',topic_ids:['dir01','dir02'],minutes:180,start_minute:0,end_minute:180},
    {id:'dir-b',title:'DIR-B · Gestione e organizzazione della sicurezza',topic_ids:['dir03','dir04'],minutes:180,start_minute:180,end_minute:360},
    {id:'dir-c',title:'DIR-C · Rischi, appalti ed emergenze',topic_ids:['dir05','dir06'],minutes:180,start_minute:360,end_minute:540},
    {id:'dir-d',title:'DIR-D · Comunicazione, consultazione e decisioni',topic_ids:['dir07','dir08'],minutes:180,start_minute:540,end_minute:720}
  ];

  course.topics=[
    mk({id:'dir01',title:'DIR01 · Ruolo, obblighi, responsabilità e delega',icon:'⚖️',visual:'roles',
      slide_title:'Dirigere significa organizzare decisioni che producono sicurezza',
      summary:'Il dirigente attua le direttive del datore di lavoro organizzando l’attività e governando il sistema affidato alla propria funzione. Responsabilità, poteri e risorse devono essere coerenti.',
      detail:'Il focus è collegare ruolo, obblighi, responsabilità civili e penali, delega di funzioni e poteri effettivi. La domanda chiave è: quali decisioni può assumere davvero il dirigente e quali deve far risalire?',
      question:'Quali condizioni rendono una responsabilità organizzativa realmente governabile?',
      case:'Hai obiettivi produttivi e budget limitato, ma non puoi modificare turni né fermare una lavorazione critica senza autorizzazione. Come gestisci una criticità urgente?',
      risks:['Responsabilità senza poteri adeguati','Confusione tra ruolo formale e funzione concreta','Delega usata come scarico di responsabilità'],
      prevention:['Perimetro decisionale chiaro','Poteri e risorse coerenti','Escalation definita'],
      procedure:['Definisci il perimetro','Verifica poteri e risorse','Decidi nel tuo ambito','Escala ciò che eccede il mandato','Traccia le decisioni rilevanti'],
      idea_images:[{file:'organigramma-sicurezza.svg',caption:'Ruoli e linee decisionali nel sistema di prevenzione.'},{file:'idea-safety-system.svg',caption:'Il dirigente traduce direttive in organizzazione.'}],
      teacher:'Parti da decisioni reali, non da definizioni astratte.',
      teacher_expansion:['0–15 · Quali decisioni può prendere davvero il dirigente?','15–35 · Ruolo e relazioni con datore, preposti e funzioni di supporto','35–55 · Responsabilità legata a decisioni e omissioni','55–75 · Delega: limiti e condizioni','75–90 · Caso poteri/risorse ed escalation'],
      common_errors:['Pensare che il titolo contrattuale basti a definire il ruolo prevenzionistico.','Delegare senza verificare poteri, competenze e risorse.','Accettare responsabilità operative senza canali di escalation.'],
      operational:{objective:'Allineare responsabilità, poteri, risorse ed escalation.',step_by_step:['Identifica perimetro','Verifica poteri','Assegna risorse','Decidi','Escala','Traccia'],stop_conditions:['Poteri insufficienti per il rischio','Decisione critica fuori mandato','Risorsa essenziale assente'],who_to_involve:['Datore di lavoro','Preposti','RSPP','RLS quando pertinente']},
      discussion_feedback:{answer:['Responsabilità e poteri devono essere coerenti.','L’assenza di poteri adeguati richiede escalation formale.'],case_solution:['Metti in sicurezza','Documenta il limite decisionale','Escala la decisione necessaria'],general_solution:['Ruoli chiari','Poteri coerenti','Risorse disponibili','Escalation definita']}}),

    mk({id:'dir02',title:'DIR02 · Sistema istituzionale, 231 e tutele organizzative',icon:'🏛️',visual:'general',
      slide_title:'Un sistema credibile deve funzionare anche sotto controllo',
      summary:'Organi di vigilanza, responsabilità amministrativa, procedure ispettive, prevenzione di violenza e molestie e inclusione richiedono processi organizzativi reali, non solo documenti.',
      detail:'Il dirigente deve capire quali evidenze dimostrano l’effettività del sistema: ruoli, procedure applicate, segnalazioni gestite, azioni correttive e coerenza tra ciò che è scritto e ciò che accade.',
      question:'Che cosa rende credibile un sistema di prevenzione davanti a un controllo esterno?',
      case:'Le procedure sono aggiornate, ma i capi reparto descrivono prassi diverse e nessuno sa chi chiude le anomalie. Qual è il problema organizzativo?',
      risks:['Conformità solo formale','Prassi divergenti','Segnalazioni senza presa in carico'],
      prevention:['Processi coerenti con documenti','Responsabilità assegnate','Azioni correttive tracciate'],
      procedure:['Mappa obblighi','Verifica prassi','Raccogli evidenze','Correggi scostamenti','Riesamina'],
      idea_images:[{file:'idea-inspection-flow.svg',caption:'Controllo, rilievo, azione e verifica.'},{file:'idea-sanctions-logic.svg',caption:'Responsabilità e conseguenze collegate al sistema reale.'}],
      teacher_expansion:['0–15 · ASL/INL/VVF/INAIL: ruolo operativo','15–35 · Effettività vs carta','35–50 · 231 e organizzazione','50–70 · Violenza, molestie e inclusione come processi da governare','70–90 · Caso ispezione e incoerenze'],
      common_errors:['Preparare documenti solo per l’ispezione.','Separare temi organizzativi e sicurezza.','Non verificare se le procedure sono comprese e applicate.'],
      operational:{objective:'Rendere coerenti assetto formale, prassi ed evidenze.',step_by_step:['Mappa','Verifica','Correggi','Assegna','Controlla'],stop_conditions:['Documenti e prassi divergenti','Responsabilità non definite','Segnalazione sensibile senza canale']}}),

    mk({id:'dir03',title:'DIR03 · Processi di sicurezza, MOG e sistemi di gestione',icon:'⚙️',visual:'general',
      slide_title:'La sicurezza come processo: owner, controllo, evidenza, riesame',
      summary:'La prevenzione funziona quando entra nei processi ordinari: acquisti, manutenzioni, turni, appalti, cambiamenti, formazione ed emergenze.',
      detail:'L’unità traduce modelli organizzativi e sistemi di gestione in una logica concreta: input, responsabile, attività, controllo, indicatore, azione correttiva e riesame.',
      question:'Dove si rompe più spesso un processo di sicurezza?',
      case:'La procedura di manutenzione è corretta ma nessuno verifica la chiusura delle anomalie. Il problema è tecnico o di processo?',
      risks:['Processi senza owner','Controlli senza criterio','Azioni correttive mai chiuse'],
      prevention:['Owner esplicito','Indicatori utili','Riesame e verifica efficacia'],
      procedure:['Definisci obiettivo','Assegna owner','Stabilisci controlli','Misura','Correggi','Riesamina'],
      idea_images:[{file:'idea-safety-system.svg',caption:'Processi collegati nel sistema di prevenzione.'},{file:'procedura-operativa-5-fasi.svg',caption:'Pianificare, fare, verificare, correggere.'}],
      teacher_expansion:['0–15 · Disegna un processo reale','15–35 · Owner, risorse e controlli','35–55 · MOG e sistemi di gestione','55–75 · Caso manutenzione','75–90 · Da obbligo a processo verificabile'],
      common_errors:['Confondere sistema di gestione e documentazione.','Misurare solo attività svolte.','Non verificare l’efficacia delle azioni correttive.'],
      operational:{objective:'Progettare processi controllabili.',step_by_step:['Obiettivo','Owner','Risorse','Controllo','Indicatore','Correzione','Riesame'],stop_conditions:['Nessun owner','Controllo senza criterio','Azione critica senza follow-up']}}),

    mk({id:'dir04',title:'DIR04 · Dal DVR alle decisioni: misure, risorse e sorveglianza sanitaria',icon:'📋',visual:'risk',
      slide_title:'Il DVR diventa sicurezza solo quando genera decisioni e risorse',
      summary:'Il dirigente traduce rischi e misure in priorità, risorse, responsabili, scadenze e controlli reali.',
      detail:'Si lavora sul percorso DVR → priorità → misura → risorsa → owner → verifica, includendo i flussi organizzativi collegati alla sorveglianza sanitaria.',
      question:'Quando una misura prevista nel DVR può dirsi davvero attuata?',
      case:'Una modifica tecnica è prevista entro tre mesi, il budget viene rinviato e si continua con una misura provvisoria non formalizzata. Cosa fai?',
      risks:['Misura solo prevista','Provvisorio senza scadenza','Priorità senza risorse'],
      prevention:['Piano con owner e scadenza','Misure temporanee controllate','Verifica efficacia'],
      procedure:['Leggi rischio e misura','Definisci priorità','Assegna risorsa e responsabile','Gestisci temporaneo','Controlla attuazione','Riesamina'],
      idea_images:[{file:'idea-dvr-reading.svg',caption:'Dal DVR al piano operativo.'},{file:'modello-farfalla-rischio.svg',caption:'Barriere e misure devono essere reali ed efficaci.'}],
      teacher_expansion:['0–15 · Chi/cosa/quando/risorse','15–35 · Misure tecniche-organizzative-procedurali','35–50 · Temporaneo: criteri e scadenza','50–65 · Sorveglianza sanitaria e flussi','65–90 · Caso budget rinviato'],
      common_errors:['Equivalere previsione a realizzazione.','Lasciare misure provvisorie indefinite.','Non collegare rischio, budget e responsabilità.'],
      operational:{objective:'Convertire misure in azioni finanziate e verificate.',step_by_step:['Priorità','Owner','Risorsa','Scadenza','Verifica','Riesame'],stop_conditions:['Rischio rilevante senza misura praticabile','Misura temporanea scaduta','Indicazione sanitaria non presa in carico']}}),

    mk({id:'dir05',title:'DIR05 · Appalti, somministrazione, subappalti e interferenze',icon:'🔗',visual:'risk',
      slide_title:'Quando entrano altri soggetti cambia il sistema di rischio',
      summary:'Appalti e subappalti richiedono coordinamento reale di tempi, spazi, accessi, viabilità, emergenze e responsabilità.',
      detail:'Il DUVRI viene trattato come strumento vivo di coordinamento. Il dirigente deve riconoscere quando una variazione rende non più valido il coordinamento pianificato.',
      question:'Quali interferenze possono nascere anche tra lavorazioni tecnicamente diverse?',
      case:'Un’impresa anticipa la manutenzione e occupa l’area prevista per la movimentazione interna. Il DUVRI non contempla la sovrapposizione. Cosa fai?',
      risks:['Interferenza non prevista','Piano non aggiornato','Responsabilità di area confuse'],
      prevention:['Coordinamento prima dell’avvio','Aggiornamento alle variazioni','Responsabilità chiare'],
      procedure:['Identifica attività','Mappa interferenze','Coordina sequenze e misure','Comunica variazioni','Autorizza avvio/ripresa','Verifica'],
      idea_images:[{file:'idea-duvri.svg',caption:'Interferenze e coordinamento tra attività.'},{file:'idea-safety-system.svg',caption:'Più soggetti richiedono più chiarezza.'}],
      teacher_expansion:['0–15 · Interferenze: spazio/tempo/energia/accessi','15–35 · Appalti e flussi informativi','35–55 · DUVRI come processo','55–75 · Caso manutenzione anticipata','75–90 · Chi deve sapere cosa prima di iniziare'],
      common_errors:['Trattare il DUVRI come archivio.','Non riesaminare quando cambiano tempi o spazi.','Scaricare sul solo preposto un problema organizzativo.'],
      operational:{objective:'Governare interferenze prima che entrino nel lavoro.',step_by_step:['Mappa','Coordina','Comunica','Autorizza','Verifica'],stop_conditions:['Interferenza non valutata','Sovrapposizione non coordinata','Responsabilità non definita']}}),

    mk({id:'dir06',title:'DIR06 · Organizzare prevenzione incendi, primo soccorso ed emergenze',icon:'🚨',visual:'emergency',
      slide_title:'L’emergenza si gestisce prima che accada',
      summary:'Nomine e piani non bastano: il sistema deve funzionare nei turni reali, con presenze, layout, ditte esterne e variazioni operative reali.',
      detail:'Il dirigente verifica coperture, sostituzioni, dotazioni, vie, comunicazioni, esercitazioni e compatibilità con il contesto.',
      question:'Quali condizioni possono rendere inefficace un piano formalmente corretto?',
      case:'Turno serale, pochi addetti formati, via di esodo modificata e manutentori esterni presenti. Il piano generale è invariato. È sufficiente?',
      risks:['Copertura insufficiente','Variazioni non riesaminate','Ruoli non comunicati'],
      prevention:['Coperture per turno','Gestione variazioni','Esercitazioni e feedback'],
      procedure:['Verifica scenario','Controlla coperture','Gestisci variazioni','Comunica ruoli','Esercita','Correggi'],
      idea_images:[{file:'idea-emergency-steps.svg',caption:'Preparare la risposta prima dell’evento.'},{file:'idea-evac-public.svg',caption:'Esodo e persone devono restare coerenti col contesto.'}],
      teacher_expansion:['0–15 · Capacità reale di risposta','15–35 · Coperture e sostituzioni','35–55 · Cambiamenti di layout e presenze','55–75 · Caso turno serale','75–90 · Checklist manageriale'],
      common_errors:['Contare solo gli addetti nominali.','Non riesaminare modifiche temporanee.','Ignorare imprese esterne e visitatori.'],
      operational:{objective:'Garantire capacità di risposta reale.',step_by_step:['Scenario','Coperture','Dotazioni','Comunicazione','Esercitazione','Correzione'],stop_conditions:['Copertura insufficiente','Via di esodo non gestita','Variazione significativa non riesaminata']}}),

    mk({id:'dir07',title:'DIR07 · Comunicazione, formazione, gruppi e consultazione',icon:'💬',visual:'roles',
      slide_title:'Una decisione non comunicata non è ancora attuata',
      summary:'Il dirigente deve governare il passaggio decisione → comunicazione → formazione → comprensione → comportamento → feedback.',
      detail:'L’unità comprende tecniche di comunicazione e informazione, obblighi formativi, gestione gruppi e conflitti e consultazione/partecipazione RLS.',
      question:'Come distingui una comunicazione inviata da una comunicazione davvero recepita?',
      case:'Una nuova procedura viene inviata via e-mail. Due reparti continuano come prima e i preposti la interpretano diversamente. Dove ha fallito il processo?',
      risks:['Messaggio non compreso','Formazione non trasferita al lavoro','Conflitti che generano scorciatoie'],
      prevention:['Destinatari e canali definiti','Verifica comprensione','Osservazione applicazione','Consultazione quando prevista'],
      procedure:['Definisci destinatari','Scegli canale','Comunica comportamento atteso','Forma','Verifica comprensione','Osserva','Raccogli feedback'],
      idea_images:[{file:'idea-safety-system.svg',caption:'Comunicazione come parte del sistema.'},{file:'idea-rls-consult.svg',caption:'Consultazione e partecipazione come processo.'}],
      teacher_expansion:['0–15 · Inviato vs efficace','15–35 · Informazione/formazione/addestramento','35–55 · Gruppi e conflitti','55–70 · RLS e partecipazione','70–90 · Caso nuova procedura'],
      common_errors:['Usare la mail come prova di comprensione.','Formare senza verificare il comportamento.','Coinvolgere RLS solo a decisioni già chiuse quando è prevista consultazione.'],
      operational:{objective:'Portare la decisione fino al comportamento osservabile.',step_by_step:['Destinatari','Canale','Messaggio','Formazione','Verifica','Feedback'],stop_conditions:['Messaggio critico non compreso','Formazione necessaria non completata','Conflitto che induce deviazioni']}}),

    mk({id:'dir08',title:'DIR08 · Scenario manageriale integrato e riesame',icon:'🎯',visual:'risk',
      slide_title:'Sei il dirigente: quale decisione cambia davvero il sistema?',
      summary:'L’ultima unità mette insieme near miss, appalti, ritardi formativi, azioni correttive scadute e pressione produttiva.',
      detail:'Ogni gruppo produce una decision record: fatti, priorità, misura immediata, decisione organizzativa, owner, risorsa, scadenza, evidenza e criterio di riesame.',
      question:'Qual è la differenza tra risolvere l’episodio e correggere il sistema che lo ha generato?',
      case:'Due near miss in una settimana, interferenza segnalata da un appaltatore, formazione rinviata per carenza di personale e tre azioni correttive scadute. La produzione chiede di non modificare il piano del mese. Quali sono le prime decisioni?',
      risks:['Cause sistemiche aperte','Scadenze critiche non gestite','Pressione produttiva che prevale sui controlli'],
      prevention:['Priorità esplicite','Owner e risorse','Scadenze e verifica efficacia','Riesame periodico'],
      procedure:['Raccogli fatti','Stabilisci priorità','Proteggi subito','Decidi modifica organizzativa','Assegna owner e risorsa','Fissa scadenza','Definisci evidenza','Riesamina'],
      idea_images:[{file:'modello-farfalla-rischio.svg',caption:'Cause, barriere ed evento.'},{file:'idea-risk-cycle.svg',caption:'Decisione, misura, verifica e riesame.'},{file:'piramide-pericoli.svg',caption:'Near miss e anomalie come indicatori gestionali.'}],
      teacher_expansion:['0–10 · Metodo decisionale','10–30 · Near miss ripetuti','30–50 · Appalto/interferenza','50–70 · Formazione rinviata','70–85 · Decision record di gruppo','85–90 · Indicatori da riesaminare'],
      common_errors:['Risolvere solo l’urgenza.','Lasciare azioni critiche senza escalation.','Non legare priorità a risorse e responsabilità.'],
      operational:{objective:'Prendere decisioni manageriali tracciabili e verificabili.',step_by_step:['Fatti','Priorità','Protezione immediata','Decisione','Owner','Risorsa','Scadenza','Evidenza','Riesame'],stop_conditions:['Near miss ripetuto con causa aperta','Interferenza non governata','Obbligo formativo rinviato senza controllo','Azione critica scaduta']},
      discussion_feedback:{answer:['Prima si protegge il sistema, poi si rimuovono le cause organizzative.','Ogni decisione deve avere owner, risorsa, scadenza ed evidenza.'],case_solution:['Gestisci criticità immediate','Rivaluta appalto/interferenza','Pianifica recupero formativo con misura transitoria','Escala azioni scadute','Riesamina il piano produttivo'],general_solution:['Priorità','Decisione','Owner','Risorsa','Scadenza','Verifica']}})
  ];
})();
