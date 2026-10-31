/* SafetyTraining v46.3 — original, topic-scoped classroom cases.
   Read-only teacher material: not a certification, not a machine procedure.
   The manufacturer's instructions, site risk assessment and instructor take precedence.
   No historic courses, frozen versions, learner data or tests are changed. */
(()=>{'use strict';
const groups=Object.freeze({
 carrelli:[
  {id:'stabilita',re:/stabilit|baricentr|diagramma.{0,15}portat|centro.{0,15}caric|portat|targhett|diagramm|equilibri/i,visual:'assets/gp04-baricentro-carrelli.svg',imageCaption:'Carrello e posizione del baricentro: schema concettuale, non diagramma di portata della macchina.',
   case:'Un collo pesante, con baricentro decentrato, deve essere movimentato lungo un percorso con una curva. Il gruppo individui quali dati mancano prima di stabilire se la movimentazione è ammissibile.',
   analysis:['La massa nominale da sola non descrive la stabilità: incidono centro del carico, configurazione dell’attrezzatura, accessori e condizioni di marcia.','La curva e l’eventuale sollevamento del carico modificano le condizioni dinamiche: discutere le barriere organizzative e il confronto con la targhetta e il manuale specifici.','Una figura concettuale non permette di dedurre la portata residua né di autorizzare la manovra.'],
   prompt:'Quali informazioni della macchina e del carico verificheresti prima di scegliere il percorso?'},
  {id:'pedoni',re:/pedon|investiment|angol[oi] ciech|visibilit|percors[oi].{0,22}separat|regole.{0,14}circolazion|viabilit/i,visual:'assets/gp04-pedoni-carrelli.svg',imageCaption:'Interferenza fra pedoni e carrelli: osservare separazioni e punti ciechi.',
   case:'All’uscita di una scaffalatura un pedone attraversa il corridoio mentre il carrello si avvicina. Non avviene il contatto. Analizzare il quasi incidente senza limitarsi al comportamento individuale.',
   analysis:['Individuare il punto in cui i flussi si sovrappongono, la visibilità reale, le precedenze e gli ostacoli alla percezione.','Valutare misure di separazione fisica, organizzazione dei percorsi e procedure di comunicazione adeguate al sito.','Controllare nel tempo che le misure scelte funzionino anche durante picchi di attività o modifiche del layout.'],
   prompt:'Come documenteresti l’efficacia della separazione fra i due flussi?'},
  {id:'preuso',re:/pre.?uso|ispezion|controll.{0,16}inizial|verifich.{0,16}inizial|comandi|freni|controlli, manutenzione|procedure operative/i,visual:'assets/gp04-preuso-carrelli.svg',imageCaption:'Controllo prima dell’uso: lo schema non sostituisce la checklist del costruttore.',
   case:'Prima del turno l’operatore rileva un’anomalia al carrello. Un collega propone di usarlo solo per uno spostamento breve. Discutere come vengono gestiti segnalazione, fermo e ripristino.',
   analysis:['Un’anomalia potenzialmente rilevante non diventa trascurabile perché l’utilizzo previsto è breve.','La decisione di riutilizzo deve seguire ruoli, controlli e autorizzazioni previsti dall’organizzazione e dal costruttore.','La registrazione dell’anomalia permette di distinguere la segnalazione dalla verifica dell’avvenuto ripristino.'],
   prompt:'Quale evidenza dovrebbe essere disponibile prima della rimessa in servizio?'},
  {id:'batterie',re:/batter|ricaric|fonti di energia/i,visual:'assets/gp02-forklift-battery.svg',imageCaption:'Area di ricarica: individuare tecnologia, condizioni del luogo e anomalie del sistema.',
   case:'Durante la ricarica di un carrello un addetto propone di utilizzare un caricabatterie non identificato. La tecnologia della batteria e le istruzioni della macchina non sono note al gruppo.',
   analysis:['Rischi e precauzioni variano con la tecnologia della batteria: evitare di trasferire automaticamente procedure da un tipo all’altro.','Valutare compatibilità, condizioni dell’area, protezioni e indicazioni del fabbricante prima di pianificare l’attività.','Segnalare eventuali anomalie e affidare verifiche o interventi a personale competente secondo le procedure applicabili.'],
   prompt:'Quali dati dovrebbero essere disponibili prima di organizzare un’area di ricarica?'}
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
   prompt:'Chi deve sapere dove sono le istruzioni di recupero e come si verifica che le conosca?'},
  {id:'controlli',re:/rischi, controlli|dispositivi di comando|sicurezza e dpi|controlli e utilizzo/i,visual:'assets/gp04-controlli-ple.svg',imageCaption:'Controlli PLE: collegare dispositivi, segnalazioni e manuale del mezzo.',
   case:'Prima dell’impiego di una piattaforma l’operatore riscontra una segnalazione di anomalia, ma non ne conosce il significato. La squadra deve discutere che cosa verificare prima di avviare il lavoro.',
   analysis:['Le spie, i comandi e i dispositivi di protezione dipendono dal modello: occorre riconoscere le informazioni fornite dal costruttore.','I controlli preuso devono distinguere condizioni regolari da situazioni che richiedono fermo, segnalazione e verifica competente.','L’attrezzatura e il contesto devono essere coerenti con l’attività e i rischi valutati; non inferire la sicurezza dalla sola assenza di guasti visibili.'],
   prompt:'Come dimostreresti che l’anomalia è stata risolta e che le condizioni d’impiego sono ammissibili?'}
 ],
 gru:[
  {id:'portata',re:/portat|diagramm|sbracc|baricentr|limitator.{0,10}caric|stabilit|tabell.{0,15}caric/i,visual:'assets/gp04-portata-gru.svg',imageCaption:'Portata e sbraccio di una gru su autocarro: esempio concettuale senza valori operativi.',
   case:'Un carico sembra compatibile con la portata massima dichiarata, ma deve essere posato lontano dal veicolo. Analizzare perché la massa nominale non basta a decidere.',
   analysis:['Configurazione, sbraccio e condizioni di stabilizzazione incidono sulla capacità utilizzabile.','La verifica riguarda il diagramma del modello e della configurazione effettiva, oltre al peso e al baricentro del carico.','Non estrapolare limiti operativi da una figura senza scala.'],
   prompt:'Quali parametri vanno ricavati dalla documentazione della gru prima di autorizzare il sollevamento?'},
  {id:'imbraco',re:/imbracatur|brache|accessor.{0,20}sollevament|gancio|organi di presa/i,visual:'assets/gp04-brache-gru.svg',imageCaption:'Brache e accessori di sollevamento: criteri di esame visivo e adeguatezza.',
   case:'Una braca presenta un segno di danneggiamento e la squadra è in ritardo. Chiedere come si evita che la pressione sui tempi diventi criterio di scelta.',
   analysis:['La valutazione considera identificazione, stato, compatibilità e modalità d’impiego degli accessori secondo le istruzioni pertinenti.','Non è sufficiente controllare solo il peso del carico: configurazione dell’imbraco, angoli e punti di presa cambiano le sollecitazioni.','La gestione delle non conformità richiede un canale di segnalazione e una decisione competente documentabile.'],
   prompt:'Quali controlli non possono essere sostituiti dalla sola esperienza dell’operatore?'},
  {id:'preuso',re:/controlli pre.?utilizzo|comandi, limitatori|verifiche.{0,15}prima/i,visual:'assets/gp02-crane-preuse.svg',imageCaption:'Controlli preuso della gru: quadro sintetico, non lista esaustiva.',
   case:'Prima del sollevamento si rileva un segnale non compreso su un dispositivo di limitazione. Un operatore propone di iniziare comunque perché il carico appare leggero.',
   analysis:['La valutazione dei dispositivi e delle segnalazioni richiede le istruzioni specifiche della macchina, non ipotesi sulla base del peso apparente.','Un controllo preuso documentato aiuta a distinguere guasto, segnalazione e ripristino effettivo.','La pressione organizzativa sui tempi non sostituisce le verifiche di idoneità dell’attrezzatura.'],
   prompt:'Chi può autorizzare l’impiego dopo una segnalazione anomala, e con quale verifica?'},
  {id:'posizionamento',re:/posizionament|segnaletica gestuale|stabilizzator/i,visual:'assets/gp04-stabilizzatori-gru.svg',imageCaption:'Posizionamento e stabilizzatori: il terreno e la configurazione incidono sulle condizioni di stabilità.',
   case:'La gru deve operare accanto a un piazzale con chiusini e traffico di altri mezzi. La squadra valuta dove stabilizzare e come organizzare le comunicazioni.',
   analysis:['La portanza del piano di appoggio e la configurazione degli stabilizzatori vanno valutate con le istruzioni della gru e le caratteristiche del sito.','La presenza di interferenze richiede coordinamento dei movimenti e comunicazioni non ambigue con chi opera nelle vicinanze.','La corretta segnalazione non sostituisce la gestione degli accessi alla zona interessata dal sollevamento.'],
   prompt:'Quali condizioni del piazzale e delle interferenze devono essere documentate prima di iniziare?'},
  {id:'sospeso',re:/sospes|perimetr|interferenz|segnalator|area.{0,15}manovr/i,visual:'assets/gp04-sospeso-gru.svg',imageCaption:'Carico sospeso e area di manovra: separare i percorsi delle persone.',
   case:'Il sollevamento attraversa una zona nella quale altri addetti potrebbero entrare per raggiungere un deposito. Individuare le interferenze prima di muovere il carico.',
   analysis:['La valutazione deve comprendere l’intero ingombro della movimentazione e i possibili movimenti imprevisti.','La zona di esclusione e le comunicazioni devono essere comprensibili e mantenute efficaci anche con visibilità limitata.','Non confondere la presenza di un segnalatore con la rimozione dell’esposizione alle interferenze.'],
   prompt:'Come verificheresti che nessuno possa accedere involontariamente alla zona esposta?'}
 ],
 dpi:[
  {id:'anticaduta',re:/imbracature|trattenuta|arresto caduta|vestizione|regolazione.{0,20}dpi|sistemi.{0,12}anticaduta/i,visual:'assets/gp02-ppe-harness-check.svg',imageCaption:'Imbracatura e connettori: verifica illustrativa che non sostituisce addestramento o istruzioni del fabbricante.',
   case:'Prima di una attività in quota viene individuato un componente con etichetta non leggibile. Il gruppo discuta quale controllo va fatto e perché la scelta del sistema dipende dalle condizioni del lavoro.',
   analysis:['L’idoneità del sistema dipende dalla valutazione del rischio, dal tipo di attività, dagli elementi compatibili e dall’eventuale disponibilità di protezioni collettive.','Identificazione, stato dei componenti e istruzioni del fabbricante devono essere verificati prima di ogni impiego; non improvvisare combinazioni non previste.','La formazione non sostituisce l’addestramento pratico richiesto e il piano di emergenza e recupero specifico.'],
   prompt:'Quali dati dimostrano che ogni componente è identificabile, compatibile e adatto all’uso previsto?'},
  {id:'casco',re:/casco|protezione.{0,12}testa/i,visual:'assets/gp04-casco-dpi.svg',imageCaption:'Protezione del capo: idoneità, regolazione e stato sono da riferire al rischio valutato.',
   case:'Due operatori eseguono attività diverse e indossano protezioni del capo apparentemente simili. Analizzare perché l’aspetto non dimostra l’adeguatezza al rischio.',
   analysis:['La selezione deriva dai rischi effettivi e dalle prestazioni richieste, non dal solo colore o dalla forma.','Integrità, corretto indossamento, compatibilità e limiti d’uso vanno verificati nelle istruzioni del dispositivo.','Un DPI non elimina il pericolo e non sostituisce le misure tecniche e collettive applicabili.'],
   prompt:'Quali informazioni permettono di collegare il modello usato al rischio specifico?'},
  {id:'udito',re:/udit|rumore|otoprotett/i,visual:'assets/gp04-udito-dpi.svg',imageCaption:'Protezione dell’udito: attenuazione e compatibilità vanno valutate sul caso reale.',
   case:'In un reparto rumoroso alcuni lavoratori tolgono frequentemente gli otoprotettori per comunicare. Analizzare il problema senza concludere che basti richiamare le persone.',
   analysis:['La protezione va scelta considerando esposizione valutata, attenuazione idonea, comfort e comunicazioni essenziali.','L’uso intermittente può compromettere l’efficacia: indagare le cause operative e organizzative.','Esaminare prioritariamente possibili riduzioni del rumore alla fonte e misure collettive.'],
   prompt:'Quali evidenze useresti per capire se la protezione è utilizzata efficacemente?'},
  {id:'selezione',re:/scelta.{0,20}dpi|dispositiv.{0,25}protezione|tipolog.{0,12}dpi|dpi.{0,12}dpc|guant|respirator|visier|gerarchia.{0,16}protezione|scelta delle misure/i,visual:'assets/gp02-checklist-dpi.svg',imageCaption:'Checklist didattica dei DPI: la scelta dipende dai rischi e dalle istruzioni d’uso.',
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