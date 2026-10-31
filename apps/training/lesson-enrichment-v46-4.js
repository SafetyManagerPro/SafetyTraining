/* SafetyTraining v46.4 — contestualizzazione didattica nelle schede e nelle slide.
   Le schede integrative sono solo materiale originale di discussione, non una modifica
   delle Learning Unit pubblicate o delle durate/attestazioni/prove.
   Uso limitato a corsi DB pubblicati e non frozen, con argomento identificabile. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const SOURCES=Object.freeze({
 carrelli:{title:'INAIL · Infor.MO scheda 21: utilizzo dei carrelli elevatori',url:'https://www.inail.it/content/dam/inail-hub-site/documenti/2023/10/Scheda%2021%20InforMO%2C0.pdf'},
 ple:{title:'INAIL · Piattaforme di lavoro elevabili, confronto EN 280',url:'https://www.inail.it/content/dam/inail-hub-site/documenti/2024/05/PiattaformeDiLavoroElevabili.pdf'},
 gru:{title:'INAIL · Apparecchi di sollevamento materiali di tipo mobile',url:'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/attrezzature-di-lavoro/manutenzione%2C-controllo-e-verifica-di-un-attrezzatura.html'},
 dpi:{title:'INAIL · Misure di prevenzione e protezione: DPI',url:'https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-chimici/misure-di-prevenzione-e-protezione.html'}
});
const allowedSlides=new Set(['concept','explain','deep','risks','prevention','procedure','actionPlan','guided','case']);
const validVisual=src=>typeof src==='string'&&/^assets\/gp0[1-4]-[a-z0-9-]+\.svg$/.test(src);
const frozen=c=>!!(c?.frozen||c?.metadata?.frozen||c?.metadata?.freeze_scope||
 c?.metadata?.is_frozen||c?.metadata?.course_frozen);
function eligible(c){
 return !!(c&&c.presentation_generated_from_db===true&&c.db_status==='published'&&!frozen(c));
}
function forTopic(c,t){
 if(!eligible(c)||!t||t.db_backed!==true)return null;
 const entry=window.SAFETY_EQUIPMENT_CASES_V46_3?.forSlide?.({type:'concept',title:t.title,topic:t},c.id);
 if(!entry||!validVisual(entry.visual)||!Array.isArray(entry.analysis)||!entry.analysis.length)return null;
 const source=SOURCES[entry.family];if(!source)return null;
 return {caseId:entry.caseId,family:entry.family,title:t.title,case:entry.case,
  analysis:entry.analysis.slice(0,4),prompt:entry.prompt,src:entry.visual,
  caption:entry.imageCaption,source};
}
function forDeck(c,s){
 if(!s||!allowedSlides.has(s.type)||!s.topic)return null;
 return forTopic(c,s.topic);
}
function markup(item,compact=false){
 if(!item)return '';
 const figure='<figure class="st-v464-figure"><img loading="lazy" decoding="async" src="'+esc(item.src)+'" alt="'+esc(item.caption)+'"><figcaption>'+esc(item.caption)+'</figcaption></figure>';
 const body='<div class="st-v464-text"><h3>Il caso da analizzare</h3><p>'+esc(item.case)+'</p>'+
  '<h3>Analisi dei rischi e delle barriere</h3><ul>'+item.analysis.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul>'+
  '<h3>Domanda per l’aula</h3><p>'+esc(item.prompt)+'</p></div>';
 return '<section class="st-v464-enrichment '+(compact?'st-v464-compact':'')+'" aria-label="Approfondimento didattico contestuale">'+
  '<header><span>APPROFONDIMENTO · CASO DIDATTICO</span><p>Integrazione per discutere i rischi. Non modifica il programma, le ore o le verifiche del corso.</p></header>'+
  '<div class="st-v464-layout">'+figure+body+'</div><footer>'+
  '<a href="'+esc(item.source.url)+'" target="_blank" rel="noopener noreferrer">Fonte di approfondimento: '+esc(item.source.title)+'</a>'+
  '<p>Schema concettuale originale: la pertinenza va verificata da un docente competente. Per l’operatività seguire DVR, istruzioni del fabbricante e procedure del luogo di lavoro; il collegamento INAIL non certifica questo caso.</p>'+
  '</footer></section>';
}
function renderForTopic(c,t){return markup(forTopic(c,t));}
const current=()=>{
 const id=window.__deck?.cid;
 const c=Array.isArray(window.SAFETY_DATA)?window.SAFETY_DATA.find(x=>x.id===id):null;
 const index=Number(window.__deck?.index);
 const s=Number.isInteger(index)?window.__deckSlides?.[index]:null;
 return c&&s?{c,s,item:forDeck(c,s),key:c.id+'@'+c.db_version+':'+(s.uid||index)}:null;
};
let overlay=null,openedKey='';
const visible=()=>!!overlay&&!overlay.classList.contains('hidden');
function close(){
 if(!visible())return;
 overlay.querySelector('[data-v464-content]').innerHTML='';
 overlay.classList.add('hidden');openedKey='';
 window.SAFETY_MODAL_ACCESS?.closed?.(overlay);
}
function ensure(){
 if(overlay)return overlay;
 overlay=document.createElement('div');overlay.id='stV464Overlay';
 overlay.className='st-v464-overlay hidden';
 overlay.innerHTML='<section class="st-v464-dialog" role="dialog" aria-modal="true" aria-labelledby="stV464Title"><header class="st-v464-dialog-header"><div><span>SCENARIO DI DISCUSSIONE · NON CERTIFICATIVO</span><h2 id="stV464Title">Approfondimento della lezione</h2></div><button type="button" data-v464-close aria-label="Chiudi approfondimento">×</button></header><div data-v464-content class="st-v464-dialog-content"></div><footer class="st-v464-dialog-footer"><button type="button" data-v464-close>Ritorna alla slide</button></footer></section>';
 overlay.addEventListener('click',event=>{if(event.target===overlay||event.target?.closest?.('[data-v464-close]'))close();});
 document.body.appendChild(overlay);return overlay;
}
function open(){
 const active=current();
 if(!document.body.classList.contains('deckmode')||!active?.item)return false;
 const root=ensure();
 openedKey=active.key;
 root.querySelector('[data-v464-content]').innerHTML=markup(active.item,true);
 root.classList.remove('hidden');
 window.SAFETY_MODAL_ACCESS?.opened?.(root,close);
 root.querySelector('[data-v464-close]').focus();
 return true;
}
function sync(){
 if(visible()&&(!document.body.classList.contains('deckmode')||openedKey!==current()?.key))close();
 const actions=document.querySelector('.deck-shell .deck-actions');
 if(!actions)return;
 let button=actions.querySelector('[data-v464-open]');
 if(!button){button=document.createElement('button');button.type='button';button.dataset.v464Open='';
  button.className='st-v464-toolbar-btn';button.textContent='📖 Caso e analisi';
  button.setAttribute('aria-label','Apri approfondimento didattico della slide');
  button.addEventListener('click',open);actions.appendChild(button);}
 const active=current();
 button.hidden=!(document.body.classList.contains('deckmode')&&active?.item);
}
document.addEventListener('safety:deck-slide-rendered',sync);
document.addEventListener('safety:auth-changed',close);
document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
document.addEventListener('fullscreenchange',()=>{if(visible())close();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&visible())close();});
window.addEventListener('pagehide',close);
window.addEventListener('hashchange',()=>{if(visible()&&(!location.hash.startsWith('#deck/')||openedKey!==current()?.key))close();});
window.SAFETY_LESSON_ENRICHMENT_V46_4={eligible,forTopic,forDeck,renderForTopic,markup,open,close,sync,version:'v46.4'};
})();