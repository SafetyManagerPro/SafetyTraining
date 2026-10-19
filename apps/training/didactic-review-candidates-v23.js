/* SafetyTraining v22.6.5 — specific didactic review drafts. NOT course publishing. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const drafts=Object.freeze({
    agg_attr_carrelli_ind_4h: {
      title:'Aggiornamento pratico — carrelli industriali semoventi',
      status:'BOZZA DA VALIDARE',
      overview:'L’unità pubblicata affronta già un pallet che impedisce la visuale vicino a un passaggio pedonale. Questa proposta sviluppa esercitazioni osservabili intorno allo stesso rischio; non sostituisce il programma obbligatorio, il manuale del mezzo o il giudizio dell’istruttore.',
      objectives:[
        'Individuare i controlli pre-utilizzo, la portata ammessa e le condizioni che impongono di non usare il mezzo.',
        'Pianificare spostamenti, percorsi e separazione dai pedoni quando il carico limita la visibilità.',
        'Eseguire movimentazioni controllate e riconoscere condizioni di instabilità o interferenza.',
        'Dimostrare arresto sicuro, isolamento di un mezzo difettoso e comunicazione tempestiva di un quasi incidente.'
      ],
      segments:[
        {minutes:60,title:'1 · Preparazione e verifica del mezzo',
         actions:'L’istruttore presenta il carrello effettivo e la relativa documentazione. Ogni partecipante individua targhe, portata e limiti indicati dal costruttore; controlla visivamente forche, pneumatici, protezioni, comandi, freni, allarmi e area di manovra seguendo la checklist specifica del mezzo.',
         practice:'Scenario: anomalia al dispositivo di avviso prima della partenza. Il corsista deve motivare perché sospendere l’utilizzo, mettere il mezzo in condizione sicura e attivare la segnalazione prevista.',
         observation:'Check docente: riconosce il problema, interrompe l’uso e non tenta riparazioni non autorizzate.'},
        {minutes:60,title:'2 · Percorso cieco e interferenza pedonale',
         actions:'Allestire in area segregata una simulazione di pallet che copre la visuale e incrocio pedonale. Prima del movimento il partecipante valuta percorso alternativo, visibilità effettiva, presenza di persone, velocità consentita e modalità di comunicazione previste dalla procedura aziendale.',
         practice:'L’istruttore introduce una persona simulata in prossimità del varco. Il corsista deve fermarsi e scegliere una ripartenza solo quando la manovra è realmente controllabile; il clacson da solo non è accettato come misura risolutiva.',
         observation:'Check docente: osservazione prima di muovere, arresto in caso di dubbio, rispetto delle separazioni e comunicazione chiara.'},
        {minutes:60,title:'3 · Movimentazione e stabilità del carico',
         actions:'Su percorso autorizzato, verificare compatibilità del pallet, distribuzione del peso, condizioni del pavimento e limiti di sollevamento. Mostrare che carico alto e brusche manovre modificano visibilità e stabilità; non eseguire esercitazioni in condizioni effettivamente pericolose.',
         practice:'Con carichi didattici appropriati, eseguire prelievo, breve trasferimento e deposito seguendo l’istruttore e il manuale. Integrare un caso di carico apparentemente sbilanciato: il corsista deve sospendere la movimentazione e chiedere verifica.',
         observation:'Check docente: controllo area, forche e carico, scelta della traiettoria, arresto e posizionamento senza interferire con terzi.'},
        {minutes:60,title:'4 · Anomalie, comunicazione e valutazione',
         actions:'Simulare una segnalazione di guasto e un quasi incidente, senza produrre rischi reali. Il corsista esegue arresto e messa in sicurezza secondo manuale, delimita l’area se previsto, segnala al responsabile e documenta l’anomalia.',
         practice:'Ripetizione assistita del percorso del pallet alto, con valutazione individuale. Discussione degli errori osservati e nuova prova pratica quando necessaria.',
         observation:'Check docente: individua il momento in cui fermarsi, non riparte senza aver ristabilito sicurezza, gestisce correttamente la comunicazione.'}
      ],
      redFlags:[
        'Proseguire nonostante visuale insufficiente o persona nella traiettoria.',
        'Trattare allarmi o dispositivi non funzionanti come dettagli trascurabili.',
        'Superare portata e limiti del mezzo o improvvisare una procedura non autorizzata.'
      ],
      validation:'Prima di usarla come contenuto ufficiale: confermare conformità al programma di aggiornamento applicabile, effettivo tempo di attività pratica, adeguatezza istruttori/attrezzature/area, valutazione individuale e fonti aggiornate.'
    },
    agg_attr_ple_4h:{
      title:'Aggiornamento pratico — PLE',
      status:'BOZZA DA VALIDARE',
      overview:'Bozza di quattro stazioni didattiche supervisionate per PLE. Le scelte su stabilizzatori, dispositivi di protezione, vento, terreno e procedure di emergenza dipendono dal modello, dal fabbricante e dalla valutazione dei rischi; non vengono imposte regole universali.',
      objectives:[
        'Verificare che mezzo, area, persone e condizioni ambientali consentano l’attività prevista.',
        'Riconoscere i limiti specifici della piattaforma e le interferenze in quota e a terra.',
        'Operare sotto supervisione rispettando comandi, procedure e dispositivi richiesti.',
        'Saper interrompere l’attività e attivare il piano di recupero previsto, senza improvvisazioni.'
      ],
      segments:[
        {minutes:60,title:'1 · Contesto, terreno e interferenze',
         actions:'Ispezione dell’area con valutazione di portanza del suolo, pendenze, ostacoli, traffico, linee aeree, vento e delimitazioni. Confrontare le condizioni osservate con manuale PLE e piano aziendale.',
         practice:'Scenario: terreno apparentemente compatto vicino a un pozzetto. Il partecipante deve sospendere la scelta della posizione e richiedere una verifica dell’appoggio.',
         observation:'Check docente: rileva la criticità prima del posizionamento e non tratta gli stabilizzatori come soluzione universale.'},
        {minutes:60,title:'2 · Controllo del modello in uso',
         actions:'Individuare marcature, portata in piattaforma, limiti di impiego, controlli pre-utilizzo, dispositivo di arresto e comandi di emergenza del mezzo effettivo. Verificare i DPI richiesti dal costruttore e dalle procedure, senza generalizzare tra macchine diverse.',
         practice:'Una anomalia simulata impedisce la partenza. Ogni partecipante documenta la sospensione e il percorso di segnalazione.',
         observation:'Check docente: controlli pertinenti, identificazione del difetto, nessuna riparazione improvvisata.'},
        {minutes:60,title:'3 · Movimenti sorvegliati e spazio di lavoro',
         actions:'Esercitazione controllata in area protetta: posizionamento, accesso, movimenti consentiti, comunicazioni con personale a terra e controllo delle distanze dai punti di schiacciamento e dagli ostacoli.',
         practice:'Scenario: compare una interferenza nella traiettoria del braccio o del cestello. Il corsista arresta la manovra e ristabilisce un percorso sicuro con l’istruttore.',
         observation:'Check docente: gradualità dei comandi, attenzione a persone e ingombri, arresto preventivo.'},
        {minutes:60,title:'4 · Emergenza e valutazione individuale',
         actions:'Richiamare il piano aziendale di recupero e i comandi a terra, dimostrati dall’istruttore secondo manuale. Non simulare guasti mettendo realmente in pericolo persone in quota.',
         practice:'Esercitazione protetta di comunicazione con il personale a terra e decisione di sospendere il lavoro per vento o altre condizioni non ammesse; valutazione individuale delle scelte.',
         observation:'Check docente: riconosce condizioni di fermo, comunica l’emergenza, non avvia recuperi non previsti dal piano.'}
      ],
      redFlags:[
        'Operare su terreno non valutato o con interferenze non controllate.',
        'Ignorare limiti del costruttore e condizioni ambientali incompatibili.',
        'Confondere una simulazione didattica con un reale intervento di salvataggio.'
      ],
      validation:'Validare programma formativo e tipologia di PLE, tempi di pratica, attrezzatura, area, istruttore, rischio interferenze, DPI e piano di recupero prima di pubblicare nuove Learning Unit.'
    }
  });
  function reviewFor(key){return drafts[key]||null;}
  function renderFor(key){
    const draft=reviewFor(key);if(!draft)return '';
    return '<details class="admin-note-block admin-didactic-review"><summary>Bozza approfondimento pratico — da validare</summary>'+
      '<h4>'+esc(draft.title)+'</h4><p><strong>'+esc(draft.status)+'</strong></p>'+
      '<p>'+esc(draft.overview)+'</p>'+
      '<h5>Risultati osservabili attesi</h5><ul>'+
      draft.objectives.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>'+
      '<h5>Sequenza proposta (240 minuti indicativi, NON frequenza convalidata)</h5>'+
      draft.segments.map(x=>'<section><h5>'+esc(x.title)+' · '+esc(x.minutes)+' minuti proposti</h5>'+
        '<p><strong>Cosa fare:</strong> '+esc(x.actions)+'</p>'+
        '<p><strong>Esercitazione:</strong> '+esc(x.practice)+'</p>'+
        '<p><strong>Cosa osservare:</strong> '+esc(x.observation)+'</p></section>').join('')+
      '<h5>Comportamenti che impongono fermo e correzione</h5><ul>'+
      draft.redFlags.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>'+
      '<p><strong>Verifiche prima della pubblicazione:</strong> '+esc(draft.validation)+'</p>'+
      '<p><em>Materiale di progettazione didattica, non prova dell’abilitazione né sostitutivo della sessione pratica. Le versioni pubblicate restano inalterate.</em></p></details>';
  }
  window.SAFETY_DIDACTIC_REVIEW_V23={reviewFor,renderFor};
})();
