/* SafetyTraining v22.8.1 — contextual statutory sanction learning notes (no amount estimates). */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const SOURCE='https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED';
  const SOURCEINL='https://www.ispettorato.gov.it/files/2026/01/TU-81-08-Ed.-Gennaio-2026.pdf';
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
    {id:'rls',pattern:/\bRLS\b|rappresentante dei lavoratori per la sicurezza/i,
      scenario:'La consultazione e la partecipazione del rappresentante sono organizzate in modo inadeguato.',
      roles:[['Datore di lavoro / dirigente','Rispettare consultazione e informazione dove previste (artt. 18, 47–50).','Verificare la specifica omissione e disposizione sanzionatoria applicabile al soggetto obbligato.'],
        ['RLS','Il ruolo rappresentativo non costituisce di per sé una qualifica con una sanzione penale generalizzata per le attribuzioni dell’art. 50.','Restano distinti gli eventuali obblighi e responsabilità della persona in altri ruoli effettivamente ricoperti.']],
      references:'Artt. 18, 47–50 e 55, D.Lgs. 81/2008.'}
  ];
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
      '<h3>⚖️ Inadempienze e sanzioni: esempi collegati alla lezione</h3>'+
      '<p>Riferimenti didattici, non attribuzioni automatiche di colpa: verificare ruolo, obbligo, circostanze, testo vigente e importi aggiornati. Ammenda penale e sanzione amministrativa non sono sinonimi. Verifica fonti: '+updated+'.</p>'+
      found.map(x=>'<article class="normative-sanction-case"><h4>'+esc(x.id.toUpperCase())+' · '+esc(x.scenario)+'</h4>'+
        '<dl>'+x.roles.map(([role,obligation,consequence])=>'<dt><strong>'+esc(role)+'</strong></dt><dd><p>'+esc(obligation)+'</p><p><strong>Conseguenze:</strong> '+esc(consequence)+'</p></dd>').join('')+'</dl>'+
        '<p><strong>Norma:</strong> '+esc(x.references)+'</p></article>').join('')+
      '<p><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">Testo vigente D.Lgs. 81/2008 – fonte MEF</a> · '+
      '<a href="'+SOURCEINL+'" target="_blank" rel="noopener noreferrer">Testo coordinato INL (gennaio 2026)</a>.</p>'+
      '<p>Importi omessi volutamente: controllare gli aggiornamenti monetari e le disposizioni in vigore alla data della violazione.</p></section>';
  }
  window.SAFETY_NORMATIVE_SANCTIONS_V23={matches,renderFor,cases};
})();
