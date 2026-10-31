/* SafetyTraining v46.2 — approfondimenti di sola lettura per la guida docente.
   I casi integrativi sono esercizi di discussione, NON istruzioni operative né contenuti certificati.
   Mai alterare LU pubblicate, corsi frozen, risultati, requisiti o test. */
(()=>{'use strict';
const curated=Object.freeze({
 rischio:{
  visual:'assets/modello-farfalla-rischio.svg',
  imageCaption:'Modello causa–barriera–conseguenza: utile per distinguere i punti in cui intervenire.',
  case:'In un magazzino una perdita rende il pavimento scivoloso, ma nessuno è ancora caduto. Il gruppo distingua fonte di pericolo, esposizione, evento possibile e misura preventiva.',
  analysis:['L’assenza di un infortunio non prova che il rischio sia sotto controllo: verificare frequenza di esposizione, condizioni del percorso e barriere presenti.','Un quasi incidente è un segnale da analizzare insieme alle cause tecniche e organizzative; non usarlo per attribuire automaticamente colpe individuali.'],
  prompt:'Quale evidenza concreta servirebbe per affermare che la condizione è stata ripristinata?'
 },
 'prevenzione-protezione':{
  visual:'assets/gp03-gerarchia-prevenzione.svg',
  imageCaption:'Gerarchia delle misure: dalla riduzione alla fonte fino alla protezione individuale.',
  case:'Una lavorazione genera polvere; vengono distribuite mascherine ma la fonte rimane invariata. Chiedere quali altre misure valutare prima di fare affidamento esclusivamente sui DPI.',
  analysis:['La scelta dei DPI non sostituisce la valutazione dell’eliminazione, sostituzione, contenimento o aspirazione del pericolo alla fonte.','Le misure collettive e organizzative vanno considerate con efficacia reale, manutenzione e possibilità di verifica.'],
  prompt:'Come mostreresti che la misura scelta riduce davvero l’esposizione dei lavoratori?'
 },
 organizzazione:{
  visual:'assets/organigramma-sicurezza.svg',
  imageCaption:'Ruoli del sistema di prevenzione: distinguere responsabilità, collaborazione e segnalazioni.',
  case:'Un addetto nota un riparo mancante su un’attrezzatura. Discutere che cosa deve comunicare, a chi e come assicurarsi che la segnalazione venga presa in carico.',
  analysis:['Attribuire un nome a un ruolo non basta: il sistema funziona quando comunicazioni, decisioni, risorse e verifiche sono riconoscibili.','Separare chi osserva e segnala, chi valuta le misure e chi autorizza il ripristino, facendo riferimento all’organizzazione effettiva.'],
  prompt:'Nel vostro contesto chi riceve la segnalazione e come viene verificata la chiusura?'
 },
 'diritti-doveri':{
  visual:'assets/idea-rls-consult.svg',
  imageCaption:'Partecipazione, consultazione e confronto come elementi del sistema di prevenzione.',
  case:'Un lavoratore segnala ripetutamente un passaggio ostacolato. Analizzare come documentare i fatti e attivare i canali previsti senza trasformare il confronto in uno scontro personale.',
  analysis:['Diritti e doveri si traducono in comportamenti osservabili: usare i mezzi idonei, rispettare le istruzioni, segnalare pericoli e partecipare quando richiesto.','La partecipazione è efficace se i problemi sono descritti con luogo, condizione, esposizione e proposta di verifica.'],
  prompt:'Quali fatti osservabili rendono una segnalazione utile a chi deve intervenire?'
 },
 incidenti:{
  visual:'assets/gp03-near-miss.svg',
  imageCaption:'Near miss: analizzare i segnali e le barriere prima che si verifichi un danno.',
  case:'Un carrello frena all’ultimo momento vicino a un pedone. Non ci sono feriti. Il gruppo analizzi cause possibili, barriere inefficaci e azioni di verifica.',
  analysis:['Distinguere evento, conseguenza e cause: l’assenza di danno non deve annullare la necessità di analisi.','Esaminare percorso, visibilità, interferenze, condizioni operative e organizzazione prima di ridurre tutto alla distrazione.'],
  prompt:'Quali modifiche verificabili potrebbero impedire che lo stesso evento si ripeta?'
 },
 'emergenze-generale':{
  visual:'assets/gp02-exit-obstructed.svg',
  imageCaption:'Percorso di esodo ostruito: immagine da discutere rispetto al piano reale.',
  case:'Durante una prova una via di esodo prevista non è percorribile. Chiedere dove reperire le indicazioni alternative del piano e quali informazioni comunicare.',
  analysis:['Conoscere preventivamente allarme, incaricati, percorsi e punti di raccolta evita improvvisazioni durante un evento reale.','Le azioni devono dipendere dal piano di emergenza del luogo di lavoro, dalla situazione e dall’addestramento ricevuto.'],
  prompt:'Qual è la prima fonte verificabile per decidere il percorso corretto nella vostra sede?'
 },
 'segnaletica-generale':{
  visual:'assets/gp02-signs-warning-rescue.svg',
  imageCaption:'Famiglie di segnaletica: il significato del cartello va legato alla condizione concreta.',
  case:'Un cartello indica l’uscita ma l’accesso è occupato da materiali. Domandare se il cartello, da solo, rende sicuro il percorso.',
  analysis:['La segnaletica informa, vieta, prescrive o orienta, ma non elimina il rischio materiale.','Confrontare sempre il messaggio grafico con la disponibilità reale di protezioni, uscite e dispositivi indicati.'],
  prompt:'Che cosa deve fare chi osserva un segnale corretto ma una condizione incoerente?'
 }
});
const txt=(x,max=500)=>typeof x==='string'?x.trim().slice(0,max):'';
const arr=(a,max=4)=>Array.isArray(a)?a.map(v=>txt(v)).filter(Boolean).slice(0,max):[];
const safeVisual=src=>typeof src==='string'&&/^assets\/(?:gp0[1-4]-|idea-|scene-|modello-|piramide-|organigramma-|procedura-|stop-)[a-z0-9-]+\.svg$/.test(src);
function forSlide(slide,courseId=''){
 const s=slide&&typeof slide==='object'?slide:{};
 if(s.type==='module'||!s.topic||typeof s.topic!=='object')return {sections:[],figure:null};
 const t=s.topic,o=t.operational||{},sections=[];
 const push=(label,items)=>{const values=arr(items,4);if(values.length)sections.push({label,items:values});};
 push('Rischi e condizioni da analizzare',t.risks);
 push('Misure e barriere già previste',t.prevention);
 push('Prima · durante · dopo',[
  ...arr(o.before,2).map(x=>'Prima: '+x),
  ...arr(o.during,2).map(x=>'Durante: '+x),
  ...arr(o.after,2).map(x=>'Dopo: '+x)
 ]);
 push('Condizioni di arresto o escalation',o.stop_conditions);
 push('Ruoli da coinvolgere',o.who_to_involve);
 const id=txt(t.id,100),extra=String(courseId)==='generale'?curated[id]:null;
 if(extra){
  push('Caso integrativo da discutere in aula',[extra.case]);
  push('Lettura critica del caso',extra.analysis);
  push('Domanda di trasferimento alla mansione',[extra.prompt]);
 }
 const original=s.img&&typeof s.img==='object'?s.img:{};
 const curatedSrc=extra&&safeVisual(extra.visual)?extra.visual:'';
 const originalSrc=safeVisual(original.src)?original.src:'';
 const src=curatedSrc||originalSrc;
 const figure=src?{src,alt:src===extra?.visual?extra.imageCaption:txt(original.caption,220)||'Figura tematica della slide',caption:src===extra?.visual?extra.imageCaption:txt(original.caption,220)||'Figura associata alla slide',origin:src===extra?.visual?'Illustrazione tematica curata per Formazione generale':'Figura già associata alla slide — pertinenza da verificare dal docente'}:null;
 return {sections,figure,editorial:!!extra};
}
window.SAFETY_DIDACTIC_DEPTH_V46_2={forSlide,safeVisual,version:'v46.2'};
})();