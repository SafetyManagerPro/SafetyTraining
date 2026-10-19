/* SafetyTraining v22.8.1 — contextual statutory sanction learning notes (no amount estimates). */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const SOURCE='https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED';
  const SOURCEINL='https://www.ispettorato.gov.it/documenti-e-normativa/normativa-di-interesse/salute-e-sicurezza-nei-luoghi-di-lavoro/';
  const updated='19/10/2026';
  const cases=[
    {id:'dvr',pattern:/\bDVR\b|valutazione (?:di|dei) rischi|documento di valutazione/i,
      scenario:'Il datore di lavoro non provvede alla valutazione dei rischi e alla redazione del relativo documento.',
      roles:[['Datore di lavoro','La valutazione dei rischi è obbligo non delegabile (art. 17, c. 1, lett. a; art. 29).','Art. 55, c. 1, lett. a: contravvenzione con arresto o ammenda, salvo i casi aggravati previsti dal c. 2.']],
      references:'Artt. 17, 28, 29 e 55, D.Lgs. 81/2008.'},
    {id:'rspp',pattern:/nomina (?:del )?(?:RSPP|responsabile del servizio)|designazione (?:del )?responsabile del servizio/i,
      scenario:'La funzione di responsabile del servizio di prevenzione e protezione non viene formalmente designata.',
      roles:[['Datore di lavoro','La designazione del RSPP rientra negli obblighi non delegabili (art. 17, c. 1, lett. b).','Art. 55, c. 1, lett. b: contravvenzione con arresto o ammenda.'],
        ['RSPP / ASPP','La funzione tecnica non comporta una sanzione diretta automatica per ogni inadempienza aziendale.','Eventuali responsabilità personali richiedono valutazione del fatto, delle attribuzioni e del nesso causale: non applicare automaticamente la sanzione datoriale.']],
      references:'Artt. 17, 31–33 e 55, D.Lgs. 81/2008.'},
    {id:'training',pattern:/\bart(?:icolo)?\.?\s*37\b|formazione (?:e addestramento |dei |del )?(?:lavoratori|preposti|dirigenti)|mancata formazione/i,
      scenario:'Lavoratori vengono impiegati senza la formazione obbligatoria pertinente a mansioni e rischi.',
      roles:[['Datore di lavoro e, nei casi previsti, dirigente','Organizzare informazione, formazione e addestramento richiesti (artt. 36 e 37).','L’art. 55, c. 5, lett. c, sanziona specifiche violazioni dell’art. 37 con arresto o ammenda; verificare la fattispecie precisa e l’eventuale aggravamento del c. 6-bis.']],
      references:'Artt. 36, 37 e 55, D.Lgs. 81/2008.'},
    {id:'dpi',pattern:/\bDPI\b|dispositiv[io] di protezione individuale/i,
      scenario:'Un addetto non usa un DPI previsto; il preposto vede il comportamento e non interviene.',
      roles:[['Lavoratore','Usare correttamente i DPI forniti e rispettare le disposizioni (art. 20, c. 2, lett. d).','Art. 59, c. 1, lett. a: arresto fino a un mese o ammenda per le violazioni ivi richiamate.'],
        ['Preposto','Sovrintendere, vigilare e intervenire secondo l’art. 19, c. 1.','Art. 56: arresto o ammenda per le specifiche omissioni dell’art. 19, nei limiti delle attribuzioni e competenze.'],
        ['Datore di lavoro / dirigente','Fornire DPI idonei e adempiere agli obblighi applicabili, inclusa la vigilanza organizzativa (art. 18).','Art. 55, c. 5, lett. d, contempla la violazione dell’art. 18, c. 1, lett. d, con arresto o ammenda.']],
      references:'Artt. 18, 19, 20, 55, 56 e 59, D.Lgs. 81/2008.'},
    {id:'preposto',pattern:/\bprepost[oi]\b|omessa vigilanza|funzione di vigilanza/i,
      scenario:'Una lavorazione evidentemente pericolosa continua senza l’intervento di chi deve sovrintendere.',
      roles:[['Preposto','Vigilare, intervenire e, quando richiesto, interrompere l’attività secondo le competenze effettive (art. 19).','L’art. 56 prevede arresto o ammenda per le violazioni specificamente richiamate dell’art. 19.'],
        ['Datore di lavoro / dirigente','Individuare il preposto nei casi dovuti, organizzare prevenzione e formazione.','L’art. 55, c. 5, lett. d, richiama anche l’art. 18, c. 1, lett. b-bis: verificare obbligo e fattispecie.']],
      references:'Artt. 18, 19, 37, 55 e 56, D.Lgs. 81/2008.'},
    {id:'health',pattern:/\bmedico competente\b|sorveglianza sanitaria/i,
      scenario:'Le attività di sorveglianza previste sono omesse o svolte fuori dalle rispettive responsabilità.',
      roles:[['Medico competente','Eseguire gli obblighi propri dell’art. 25 nelle situazioni applicabili.','L’art. 58 contiene sanzioni specifiche, con fattispecie anche penali; non attribuire automaticamente al medico ogni omissione del datore.'],
        ['Datore di lavoro / dirigente','Effettuare nomina e organizzazione della sorveglianza nei casi previsti dagli artt. 18 e 41.','L’art. 55 e altre disposizioni del decreto sanzionano specifiche omissioni datoriali; individuare il comma applicabile.']],
      references:'Artt. 18, 25, 41, 55 e 58, D.Lgs. 81/2008.'},
    {id:'equipment',pattern:/carrell[io] elevator|piattaforme? di lavoro elevabil|\bPLE\b|attrezzature di lavoro|gru a torre|carroponte/i,
      scenario:'Un’attrezzatura viene usata senza adeguata gestione del rischio o da persona priva della formazione/addestramento richiesti.',
      roles:[['Datore di lavoro / dirigente','Mettere a disposizione attrezzature idonee e garantire formazione e addestramento pertinenti (artt. 71 e 73).','Verificare l’art. 87 e le ulteriori sanzioni collegate alla specifica violazione, oltre all’art. 55 per le ipotesi formative richiamate.'],
        ['Lavoratore','Usare correttamente le attrezzature e osservare le istruzioni (art. 20).','Art. 59 per le condotte espressamente indicate; non confondere inosservanza del lavoratore con mancata formazione imputabile al datore.']],
      references:'Artt. 20, 37, 71, 73, 55, 59 e 87, D.Lgs. 81/2008.'},
    {id:'site',pattern:/coordinatore per (?:la progettazione|l.esecuzione)|\bCSE\b|\bCSP\b|committente|responsabile dei lavori/i,
      scenario:'Nel cantiere mancano una designazione dovuta o un controllo di coordinamento previsto dalle norme.',
      roles:[['Committente / responsabile dei lavori','Verificare incarichi, designazioni e obblighi effettivi dell’art. 90 e correlati.','Art. 157: fattispecie penali e amministrative distinte per la specifica omissione.'],
        ['Coordinatore per la progettazione / per l’esecuzione','Adempiere agli obblighi rispettivamente previsti dagli artt. 91 e 92.','Art. 158: arresto o ammenda per le violazioni tassativamente indicate.']],
      references:'Artt. 90–93, 157 e 158, D.Lgs. 81/2008.'},
    {id:'supply',pattern:/\bfabbricant[ei]\b|\binstallator[ei]\b|progettist[ai]|fornitor[ei] di attrezzature/i,
      scenario:'Sono progettati, commercializzati o installati dispositivi non conformi agli obblighi applicabili.',
      roles:[['Progettisti, fabbricanti, fornitori, installatori','Rispettare i rispettivi obblighi degli artt. 22, 23 e 24.','Art. 57: arresto o ammenda per le fattispecie indicate; il ruolo preciso e il fatto sono determinanti.']],
      references:'Artt. 22–24 e 57, D.Lgs. 81/2008.'},
    {id:'autonomo',pattern:/lavorator[ei] autonom[oi]|impresa familiare/i,
      scenario:'Un autonomo che opera nei contesti assoggettati alla normativa trascura obblighi di sicurezza propri.',
      roles:[['Lavoratori autonomi / componenti dell’impresa familiare','Osservare i doveri che il decreto assegna al proprio status, ad esempio art. 21.','Gli artt. 60 e, nei cantieri, 160 disciplinano fattispecie specifiche. Non applicare indistintamente le sanzioni previste per lavoratori subordinati.']],
      references:'Artt. 21, 60 e 160, D.Lgs. 81/2008.'},

    {id:'interference',pattern:/\bDUVRI\b|rischi interferenzial|\bappalt[oi]\b|cooperazione e coordinamento/i,
      scenario:'Due imprese lavorano nella stessa area senza organizzare correttamente le interferenze tra attività.',
      roles:[['Datore di lavoro committente e altri datori coinvolti','Accertare obblighi di verifica, informazione, cooperazione, coordinamento e documento per i rischi interferenziali nei casi previsti dall’art. 26.','Art. 55, c. 5, lett. d, per specifiche violazioni dell’art. 26, commi 2 e 3, primo periodo: arresto o ammenda; le esenzioni e le responsabilità degli altri soggetti vanno verificate.']],
      references:'Artt. 26 e 55, c. 5, lett. d, D.Lgs. 81/2008.'},
    {id:'emergencies',pattern:/gestione (?:delle )?emergenz|\bpiano di emergenza\b|\bevacuazione\b|\besodo\b/i,
      scenario:'In presenza di un allarme i lavoratori non sanno a chi segnalare, come evacuare né chi coordina.',
      roles:[['Datore di lavoro / dirigente','Organizzare rapporti con servizi, designazioni, istruzioni, misure e formazione per le emergenze secondo i requisiti concretamente applicabili.','Art. 55, c. 5, lett. a, per le specifiche ipotesi dell’art. 43, c. 1 e c. 4 richiamate: arresto o ammenda.'],
        ['Lavoratore','Rispettare le istruzioni operative ricevute e avvisare delle condizioni di pericolo, nei limiti delle attribuzioni.','Art. 59 può riguardare violazioni degli obblighi specificamente indicati nell’art. 20; non sostituisce il dovere organizzativo del datore.']],
      references:'Artt. 18, 20, 43, 44, 55 e 59, D.Lgs. 81/2008.'},
    {id:'first-aid',pattern:/primo soccorso|cassetta di pronto soccorso|addett[oi] al primo soccorso/i,
      scenario:'Non sono organizzati addetti, presidi e modalità per chiamare i soccorsi secondo il rischio aziendale.',
      roles:[['Datore di lavoro / dirigente','Adottare i provvedimenti necessari per primo soccorso e assistenza medica di emergenza in relazione alla natura delle attività.','Art. 55, c. 5, lett. a, per violazione dell’art. 45, c. 1: arresto o ammenda.'],
        ['Addetti al primo soccorso','Intervenire nei limiti di formazione, procedure e condizioni effettive, senza improvvisare prestazioni sanitarie.','La sola qualifica di addetto non attribuisce automaticamente la sanzione prevista per l’omissione organizzativa del datore.']],
      references:'Artt. 18, 43, 45 e 55, D.Lgs. 81/2008.'},
    {id:'fire',pattern:/prevenzione incend|\bantincendio\b|rischio incendio|addett[oi] antincendio/i,
      scenario:'I presidi antincendio o le misure organizzative non sono gestiti come richiesto nel contesto dell’attività.',
      roles:[['Datore di lavoro / dirigente','Applicare le misure di prevenzione incendi e gestione delle emergenze richieste dal tipo di attività e dalla valutazione dei rischi.','Art. 55, c. 5, lett. c, per le ipotesi richiamate dell’art. 46, c. 2: arresto o ammenda. Altri obblighi sono sanzionati da norme specifiche.']],
      references:'Artt. 18, 43, 46 e 55, D.Lgs. 81/2008.'},
    {id:'signs',pattern:/segnaletica di sicurezza|segnali di sicurezza|cartellonistica di sicurezza/i,
      scenario:'In un reparto il pericolo rimane non segnalato o il personale non comprende il significato dei segnali.',
      roles:[['Datore di lavoro / dirigente','Adottare segnaletica quando i rischi non sono evitabili o sufficientemente limitabili con altre misure; informare i lavoratori sui segnali.','Art. 165, c. 1, lett. a, per le violazioni dell’art. 163, e lett. b per l’art. 164: arresto o ammenda; non considerare la segnaletica un sostituto delle misure tecniche.']],
      references:'Artt. 163, 164 e 165, D.Lgs. 81/2008.'},
    {id:'confined',pattern:/\bspazi confinati\b|ambienti sospetti di inquinamento|ambienti confinati|accesso in cisterna|lavori in silos/i,
      scenario:'È previsto l’accesso a un ambiente con possibile carenza di ossigeno o sostanze pericolose senza verifiche preliminari.',
      roles:[['Datore di lavoro / dirigente','Valutare i rischi e rispettare divieti, condizioni e misure specifiche previste per ambienti sospetti di inquinamento.','Art. 68, c. 1, lett. a, per violazione dell’art. 66: arresto o ammenda. Gli ulteriori obblighi del contesto e la disciplina speciale vanno verificati.']],
      references:'Artt. 66 e 68, D.Lgs. 81/2008; D.P.R. 177/2011 nei casi applicabili.'},
    {id:'pos',pattern:/\bPOS\b|piano operativo di sicurezza|obblighi impresa affidataria|documenti di cantiere/i,
      scenario:'L’impresa esecutrice avvia attività in cantiere senza il POS previsto o con un documento privo degli elementi richiesti.',
      roles:[['Datore di lavoro dell’impresa esecutrice','Redigere il POS per lo specifico cantiere nei casi previsti e con i contenuti applicabili.','Art. 159, c. 1, per violazione dell’art. 96, c. 1, lett. g: arresto o ammenda; sono previste discipline differenti per omissione, rischi particolari e carenze degli elementi del documento.']],
      references:'Artt. 96, 97 e 159, D.Lgs. 81/2008.'},
    {id:'height',pattern:/\blavori? in quota\b|cadut[ae] dall.alt[oa]|protezioni contro le cadute|pontegg[io]/i,
      scenario:'Lavorazioni in quota si svolgono con protezioni collettive mancanti o accessi non adeguati.',
      roles:[['Datore di lavoro / dirigente','Scegliere sistemi di accesso e protezioni pertinenti, garantendo sicurezza delle opere e dei posti di lavoro.','Art. 159, c. 2, lett. a o b a seconda della violazione degli articoli del Titolo IV, tra cui art. 122; arresto o ammenda.'],
        ['Preposto','Vigilare sul rispetto delle protezioni e intervenire nei limiti dell’art. 19 e del ruolo realmente svolto.','Le specifiche violazioni del Titolo IV possono coinvolgere l’art. 159 e quelle generali l’art. 56: non applicare entrambe automaticamente.']],
      references:'Artt. 19, 111, 115, 122, 159 e 56, D.Lgs. 81/2008.'},
    {id:'rls',pattern:/\bRLS\b|rappresentante dei lavoratori per la sicurezza/i,
      scenario:'La consultazione e la partecipazione del rappresentante sono organizzate in modo inadeguato.',
      roles:[['Datore di lavoro / dirigente','Rispettare consultazione e informazione dove previste (artt. 18, 47–50).','Verificare la specifica omissione e disposizione sanzionatoria applicabile al soggetto obbligato.'],
        ['RLS','Il ruolo rappresentativo non costituisce di per sé una qualifica con una sanzione penale generalizzata per le attribuzioni dell’art. 50.','Restano distinti gli eventuali obblighi e responsabilità della persona in altri ruoli effettivamente ricoperti.']],
      references:'Artt. 18, 47–50 e 55, D.Lgs. 81/2008.'}
  ];
  // Operational prompts are educational checks, not a substitute for factual legal assessment.
  const practical={
    dvr:['Verificare attività, rischi reali, lavoratori esposti, misure e aggiornamento del DVR.','Controllare presenza della valutazione e ruolo non delegabile del datore.'],
    rspp:['Verificare la designazione formale e la disponibilità del servizio prevenzione.','Distinguere compiti tecnici RSPP dalle decisioni che restano in capo al datore.'],
    training:['Verificare mansioni, rischi, formazione iniziale, aggiornamenti e addestramento ove necessari.','Non attribuire ore o abilità tramite semplice lettura digitale.'],
    dpi:['Controllare scelta, consegna, istruzioni, uso effettivo dei DPI e intervento del preposto.','Separare mancata fornitura da mancato uso del lavoratore.'],
    preposto:['Definire chi deve vigilare e quali anomalie richiedono interruzione e segnalazione.','Registrare fatti osservabili, interventi e comunicazioni.'],
    health:['Verificare se il rischio richiede sorveglianza sanitaria e chi ha il compito di organizzarla.','Separare omissioni del datore da obblighi clinico-professionali del medico.'],
    equipment:['Controllare idoneità macchina, verifiche, istruzioni d’uso, manutenzioni, formazione e addestramento.','Non equiparare presenza online ad abilitazione per attrezzature.'],
    site:['Controllare designazioni, PSC, coordinamento, verifiche e condizioni di applicabilità degli obblighi.','Distinguere CSP, CSE, committente e responsabile lavori.'],
    supply:['Verificare provenienza, documenti e conformità delle attrezzature rispetto al ruolo effettivo.','Non confondere la responsabilità del fornitore con gli obblighi dell’utilizzatore.'],
    autonomo:['Accertare se il soggetto rientra nell’art. 21 o opera in un cantiere ai sensi del Titolo IV.','Controllare equipaggiamenti, DPI e obblighi applicabili in concreto.'],
    rls:['Verificare consultazioni e accesso alle informazioni dovute.','Non trasformare l’RLS in un preposto o datore di lavoro.'],
    interference:['Individuare compresenze, interferenze concrete, misure comuni e obblighi di coordinamento.','Verificare condizioni di applicabilità e casi di esclusione del DUVRI.'],
    emergencies:['Verificare ruoli, comunicazioni, percorsi di esodo e prove in rapporto ai rischi.','Riconoscere quando interrompere l’attività e chiamare i soccorsi.'],
    'first-aid':['Verificare addetti, materiale di soccorso, recapiti, accessibilità e organizzazione.','Assicurare che le manovre siano svolte da personale preparato nei limiti del proprio ruolo.'],
    fire:['Controllare valutazione rischio incendio, addetti, istruzioni, presidi e manutenzioni.','Non usare estintori o evacuazione improvvisando se manca addestramento adeguato.'],
    signs:['Verificare che il rischio residuo richieda segnaletica e che i segnali siano visibili e comprensibili.','Ricordare che cartelli da soli non eliminano il pericolo.'],
    confined:['Valutare atmosfera, accessi, emergenza e requisiti specialistici prima di qualsiasi ingresso.','Sospendere attività se non sono chiarite condizioni e misure di sicurezza.'],
    pos:['Verificare che POS e PSC, ove dovuti, siano specifici per il cantiere e coerenti con l’attività.','Controllare la differenza fra assenza, incompletezza e verifica dei documenti.'],
    height:['Valutare accesso, protezioni collettive, protezione individuale, condizioni ambientali e vigilanza.','Sospendere l’attività se caduta dall’alto o interferenze non sono controllate.']
  };
  function matches(context){
    // Match the subject taught, not generic statutory references listed in a note.
    // A catch-all reference to art. 37 or DVR must not insert penalties in every lesson.
    const focus=[context?.title,context?.summary].filter(x=>typeof x==='string').join(' ').slice(0,7000);
    if(!focus.trim())return [];
    return cases.filter(x=>x.pattern.test(focus)).slice(0,5);
  }
  function renderFor(context){
    const found=matches(context);if(!found.length)return '';
    return '<section class="section print-lesson-section normative-sanctions" aria-label="Sanzioni e responsabilità">'+
      '<h3>⚖️ Inadempienze, ruoli e sanzioni: casi pratici</h3>'+
      '<p>Riferimenti didattici, non attribuzioni automatiche di colpa: verificare ruolo, obbligo, circostanze, testo vigente e importi aggiornati. Ammenda penale e sanzione amministrativa non sono sinonimi. Revisione didattica: '+updated+'. La versione INL di gennaio 2026 può non includere modifiche successive.</p>'+
      found.map(x=>'<article class="normative-sanction-case"><h4>'+esc(x.id.toUpperCase())+' · '+esc(x.scenario)+'</h4>'+
        '<dl>'+x.roles.map(([role,obligation,consequence])=>'<dt><strong>'+esc(role)+'</strong></dt><dd><p>'+esc(obligation)+'</p><p><strong>Conseguenze:</strong> '+esc(consequence)+'</p></dd>').join('')+'</dl>'+
        '<p><strong>Norma:</strong> '+esc(x.references)+'</p>'+ 
        '<div class="normative-sanction-actions"><strong>Cosa verificare / come procedere</strong><ul>'+
        (practical[x.id]||[]).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></div></article>').join('')+
      '<p><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">D.Lgs. 81/2008 vigente — Normattiva</a> · '+
      '<a href="'+SOURCEINL+'" target="_blank" rel="noopener noreferrer">Raccolta testo coordinato INL (verificare edizione)</a>.</p>'+
      '<p>Importi omessi volutamente: controllare gli aggiornamenti monetari e le disposizioni in vigore alla data della violazione.</p></section>';
  }
  window.SAFETY_NORMATIVE_SANCTIONS_V23={matches,renderFor,cases,practical};
})();
