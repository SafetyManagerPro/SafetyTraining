/* SafetyTraining v46.3 — original, topic-scoped classroom cases.
   Read-only teacher material: not a certification, not a machine procedure.
   The manufacturer's instructions, site risk assessment and instructor take precedence.
   No historic courses, frozen versions, learner data or tests are changed. */
(()=>{'use strict';
const groups=Object.freeze({
 carrelli:[
  {id:'stabilita',re:/stabilit|baricentr|diagramma.{0,15}portat|centro.{0,15}caric/i,visual:'assets/gp04-baricentro-carrelli.svg',imageCaption:'Carrello e posizione del baricentro: schema concettuale, non diagramma di portata della macchina.',
   case:'Un collo pesante, con baricentro decentrato, deve essere movimentato lungo un percorso con una curva. Il gruppo individui quali dati mancano prima di stabilire se la movimentazione è ammissibile.',
   analysis:['La massa nominale da sola non descrive la stabilità: incidono centro del carico, configurazione dell’attrezzatura, accessori e condizioni di marcia.','La curva e l’eventuale sollevamento del carico modificano le condizioni dinamiche: discutere le barriere organizzative e il confronto con la targhetta e il manuale specifici.','Una figura concettuale non permette di dedurre la portata residua né di autorizzare la manovra.'],
   prompt:'Quali informazioni della macchina e del carico verificheresti prima di scegliere il percorso?'},
  {id:'pedoni',re:/pedon|investiment|angol[oi] ciech|visibilit|percors[oi].{0,22}separat/i,visual:'assets/gp04-pedoni-carrelli.svg',imageCaption:'Interferenza fra pedoni e carrelli: osservare separazioni e punti ciechi.',
   case:'All’uscita di una scaffalatura un pedone attraversa il corridoio mentre il carrello si avvicina. Non avviene il contatto. Analizzare il quasi incidente senza limitarsi al comportamento individuale.',
   analysis:['Individuare il punto in cui i flussi si sovrappongono, la visibilità reale, le precedenze e gli ostacoli alla percezione.','Valutare misure di separazione fisica, organizzazione dei percorsi e procedure di comunicazione adeguate al sito.','Controllare nel tempo che le misure scelte funzionino anche durante picchi di attività o modifiche del layout.'],
   prompt:'Come documenteresti l’efficacia della separazione fra i due flussi?'},
  {id:'preuso',re:/pre.?uso|ispezion|controll.{0,16}inizial|verifich.{0,16}inizial/i,visual:'assets/gp04-preuso-carrelli.svg',imageCaption:'Controllo prima dell’uso: lo schema non sostituisce la checklist del costruttore.',
   case:'Prima del turno l’operatore rileva un’anomalia al carrello. Un collega propone di usarlo solo per uno spostamento breve. Discutere come vengono gestiti segnalazione, fermo e ripristino.',
   analysis:['Un’anomalia potenzialmente rilevante non diventa trascurabile perché l’utilizzo previsto è breve.','La decisione di riutilizzo deve seguire ruoli, controlli e autorizzazioni previsti dall’organizzazione e dal costruttore.','La registrazione dell’anomalia permette di distinguere la segnalazione dalla verifica dell’avvenuto ripristino.'],
   prompt:'Quale evidenza dovrebbe essere disponibile prima della rimessa in servizio?'}
 ],
 ple:[
  {id:'stabilita',re:/stabilizz|livellament|appogg|terreno|stabilit/i,visual:'assets/gp04-stabilita-ple.svg',imageCaption:'Condizioni di appoggio e stabilità PLE: schema didattico non dimensionale.',
   case:'Per raggiungere un punto di manutenzione viene proposta una PLE su una superficie apparentemente piana, ma sono presenti un chiusino e un riporto recente di terreno.',
   analysis:['La sola planarità visiva non dimostra la capacità portante del piano di appoggio.','Verificare la configurazione ammessa della macchina, le condizioni del suolo e le eventuali ripartizioni previste dal manuale e dalla valutazione del sito.','Una modifica delle condizioni di appoggio richiede di rivalutare la situazione prima dell’uso.'],
   prompt:'Quali informazioni renderebbero verificabile l’idoneità dell’appoggio?'},
  {id:'ostacoli',re:/ostacol|schiacciament|intrappolament|struttur.{0,12}sovrast/i,visual:'assets/gp04-ostacoli-ple.svg',imageCaption:'Spazi e ostacoli sopraelevati: evidenziare il rischio di intrappolamento.',
   case:'Durante l’avvicinamento a una struttura, una trave riduce lo spazio fra piattaforma e ostacolo. L’operatore deve valutare il rischio prima di proseguire.',
   analysis:['L’area da controllare include gli ingombri della macchina, il movimento della cesta e la posizione degli occupanti.','Visibilità, comunicazione e condizioni del luogo incidono sulla possibilità di riconoscere un intrappolamento prima che si verifichi.','Discutere dispositivi e procedure specifici della PLE senza attribuire allo schema funzioni che la macchina potrebbe non possedere.'],
   prompt:'Quali cambiamenti di scenario farebbero sospendere la manovra?'},
  {id:'emergenza',re:/emergenz|recuper|abbassament|soccorso/i,visual:'assets/gp04-recupero-ple.svg',imageCaption:'Recupero da PLE: il percorso corretto dipende da macchina e piano di emergenza.',
   case:'Una piattaforma resta ferma in quota e chi si trova a terra non conosce i dispositivi di emergenza del modello impiegato. Valutare le lacune della preparazione, senza simulare manovre improvvisate.',
   analysis:['Il recupero deve essere pianificato prima del lavoro, con competenze e responsabilità definite.','I comandi e le modalità di emergenza variano fra modelli: prevalgono manuale, addestramento e piano del sito.','Le prove formative devono evitare di esporre le persone a rischi aggiuntivi.'],
   prompt:'Chi deve sapere dove sono le istruzioni di recupero e come si verifica che le conosca?'}
 ],
 gru:[
  {id:'portata',re:/portat|diagramm|sbracc|baricentr|limitator.{0,10}caric/i,visual:'assets/gp04-portata-gru.svg',imageCaption:'Portata e sbraccio di una gru su autocarro: esempio concettuale senza valori operativi.',
   case:'Un carico sembra compatibile con la portata massima dichiarata, ma deve essere posato lontano dal veicolo. Analizzare perché la massa nominale non basta a decidere.',
   analysis:['Configurazione, sbraccio e condizioni di stabilizzazione incidono sulla capacità utilizzabile.','La verifica riguarda il diagramma del modello e della configurazione effettiva, oltre al peso e al baricentro del carico.','Non estrapolare limiti operativi da una figura senza scala.'],
   prompt:'Quali parametri vanno ricavati dalla documentazione della gru prima di autorizzare il sollevamento?'},
  {id:'imbraco',re:/imbracatur|brache|accessor.{0,20}sollevament|gancio/i,visual:'assets/gp04-brache-gru.svg',imageCaption:'Brache e accessori di sollevamento: criteri di esame visivo e adeguatezza.',
   case:'Una braca presenta un segno di danneggiamento e la squadra è in ritardo. Chiedere come si evita che la pressione sui tempi diventi criterio di scelta.',
   analysis:['La valutazione considera identificazione, stato, compatibilità e modalità d’impiego degli accessori secondo le istruzioni pertinenti.','Non è sufficiente controllare solo il peso del carico: configurazione dell’imbraco, angoli e punti di presa cambiano le sollecitazioni.','La gestione delle non conformità richiede un canale di segnalazione e una decisione competente documentabile.'],
   prompt:'Quali controlli non possono essere sostituiti dalla sola esperienza dell’operatore?'},
  {id:'sospeso',re:/sospes|perimetr|interferenz|segnalator|area.{0,15}manovr/i,visual:'assets/gp04-sospeso-gru.svg',imageCaption:'Carico sospeso e area di manovra: separare i percorsi delle persone.',
   case:'Il sollevamento attraversa una zona nella quale altri addetti potrebbero entrare per raggiungere un deposito. Individuare le interferenze prima di muovere il carico.',
   analysis:['La valutazione deve comprendere l’intero ingombro della movimentazione e i possibili movimenti imprevisti.','La zona di esclusione e le comunicazioni devono essere comprensibili e mantenute efficaci anche con visibilità limitata.','Non confondere la presenza di un segnalatore con la rimozione dell’esposizione alle interferenze.'],
   prompt:'Come verificheresti che nessuno possa accedere involontariamente alla zona esposta?'}
 ],
 dpi:[
  {id:'casco',re:/casco|protezione.{0,12}testa/i,visual:'assets/gp04-casco-dpi.svg',imageCaption:'Protezione del capo: idoneità, regolazione e stato sono da riferire al rischio valutato.',
   case:'Due operatori eseguono attività diverse e indossano protezioni del capo apparentemente simili. Analizzare perché l’aspetto non dimostra l’adeguatezza al rischio.',
   analysis:['La selezione deriva dai rischi effettivi e dalle prestazioni richieste, non dal solo colore o dalla forma.','Integrità, corretto indossamento, compatibilità e limiti d’uso vanno verificati nelle istruzioni del dispositivo.','Un DPI non elimina il pericolo e non sostituisce le misure tecniche e collettive applicabili.'],
   prompt:'Quali informazioni permettono di collegare il modello usato al rischio specifico?'},
  {id:'udito',re:/udit|rumore|otoprotett/i,visual:'assets/gp04-udito-dpi.svg',imageCaption:'Protezione dell’udito: attenuazione e compatibilità vanno valutate sul caso reale.',
   case:'In un reparto rumoroso alcuni lavoratori tolgono frequentemente gli otoprotettori per comunicare. Analizzare il problema senza concludere che basti richiamare le persone.',
   analysis:['La protezione va scelta considerando esposizione valutata, attenuazione idonea, comfort e comunicazioni essenziali.','L’uso intermittente può compromettere l’efficacia: indagare le cause operative e organizzative.','Esaminare prioritariamente possibili riduzioni del rumore alla fonte e misure collettive.'],
   prompt:'Quali evidenze useresti per capire se la protezione è utilizzata efficacemente?'},
  {id:'selezione',re:/scelta.{0,20}dpi|dispositiv.{0,25}protezione|tipolog.{0,12}dpi|dpi.{0,12}dpc|guant|respirator|visier/i,visual:'assets/gp02-checklist-dpi.svg',imageCaption:'Checklist didattica dei DPI: la scelta dipende dai rischi e dalle istruzioni d’uso.',
   case:'Per una nuova attività viene distribuito un DPI già disponibile a magazzino. Il gruppo discuta quali verifiche occorrono prima di considerarlo adatto.',
   analysis:['Rischio, prestazioni richieste, compatibilità con altri dispositivi e condizioni reali di uso costituiscono il punto di partenza.','Taglia, indossamento, manutenzione, durata e formazione influenzano la protezione effettivamente ottenuta.','La disponibilità del dispositivo non dimostra che sia la misura sufficiente o appropriata.'],
   prompt:'Come spiegheresti la differenza fra disponibilità di un DPI e protezione adeguata?'}
 ]
});
const courseGroup=(id)=>{
 const k=String(id||'').toLowerCase().trim();
 if(k==='attr_carrelli_ind'||k==='attr_carrelli_all')return 'carrelli';
 if(k==='attr_ple')return 'ple';
 if(k==='attr_gru_autocarro')return 'gru';
 if(k==='lav_alto'||k==='lav_quota'||/^dpi(?:_|$)/.test(k))return 'dpi';
 return '';
};
function forSlide(slide,courseId=''){
 const s=slide&&typeof slide==='object'?slide:{};
 if(s.type==='module'||s.frozen===true||s.topic?.frozen===true)return null;
 const group=courseGroup(courseId);if(!group)return null;
 const t=s.topic&&typeof s.topic==='object'?s.topic:{};
 const needle=[s.title,t.title,t.id].filter(v=>typeof v==='string').join(' ').slice(0,350);
 if(!needle)return null;
 const match=groups[group].find(item=>item.re.test(needle));if(!match)return null;
 return {visual:match.visual,imageCaption:match.imageCaption,case:match.case,
  analysis:match.analysis,prompt:match.prompt,origin:'Caso tecnico originale per discussione in aula · verificare con docente, DVR e manuale specifico',
  family:group,caseId:match.id};
}
window.SAFETY_EQUIPMENT_CASES_V46_3={forSlide,courseGroup,version:'v46.3'};
})();