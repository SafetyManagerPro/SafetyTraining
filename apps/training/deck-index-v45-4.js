/* SafetyTraining v45.4 — read-only projected slide index. */
(()=>{'use strict';
let overlay=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
const labels={module:'Modulo',concept:'Introduzione',explain:'Spiegazione',deep:'Approfondimento',guided:'Lettura guidata',graphic:'Schema',actionPlan:'Procedura',risks:'Rischi',prevention:'Prevenzione',case:'Caso pratico',quiz:'Domanda',video:'Video',sourceDigest:'Fonti'};
const slides=()=>Array.isArray(window.__deckSlides)?window.__deckSlides:[];
const current=()=>window.__deck;
const valid=()=>document.body.classList.contains('deckmode')&&!!current()?.cid&&slides().length>0;
function ensure(){
 if(overlay)return overlay;
 overlay=document.createElement('div');overlay.id='deckIndexOverlay';overlay.className='deck-index-overlay hidden';
 overlay.innerHTML='<section class="deck-index-panel" role="dialog" aria-modal="true" aria-labelledby="deckIndexTitle"><header class="deck-index-header"><div><span class="deck-index-kicker">PRESENTAZIONE</span><h2 id="deckIndexTitle">Indice slide</h2><p id="deckIndexCurrent"></p></div><button type="button" class="deck-index-close" data-index-close aria-label="Chiudi">×</button></header><div class="deck-index-filters"><label>Modulo<select id="deckIndexModule"></select></label><label>Cerca slide<input type="search" id="deckIndexSearch" autocomplete="off" placeholder="Titolo o argomento…"></label></div><p id="deckIndexCount" class="deck-index-count" role="status" aria-live="polite"></p><div id="deckIndexList" class="deck-index-list"></div><footer>La consultazione dell’indice non registra ore di frequenza.</footer></section>';
 overlay.addEventListener('click',event=>{
  if(event.target===overlay||event.target?.closest?.('[data-index-close]')){close();return;}
  const btn=event.target?.closest?.('[data-deck-jump]');
  if(!btn||!overlay.contains(btn))return;
  const i=Number(btn.dataset.deckJump),deck=current();
  if(!valid()||!Number.isInteger(i)||i<0||i>=slides().length)return;
  close();window.deckGo?.(deck.cid,i);
 });
 overlay.querySelector('#deckIndexModule').addEventListener('change',render);
 overlay.querySelector('#deckIndexSearch').addEventListener('input',render);
 document.body.appendChild(overlay);return overlay;
}
function render(){
 if(!overlay||!valid())return;
 const deck=current(),items=slides(),selected=overlay.querySelector('#deckIndexModule').value;
 const q=norm(overlay.querySelector('#deckIndexSearch').value.trim());
 const rows=items.map((slide,i)=>({slide,i,module:String(slide.moduleIndex??0)}))
  .filter(({slide,module})=>(!!q||module===selected)&&(!q||norm([slide.title,slide.topic?.title,slide.module?.title,labels[slide.type]].join(' ')).includes(q)));
 overlay.querySelector('#deckIndexList').innerHTML=rows.map(({slide,i})=>{
  const title=slide.title||slide.topic?.title||slide.module?.title||('Slide '+(i+1));
  const topic=slide.topic?.title&&slide.topic.title!==title?'<small>'+esc(slide.topic.title)+'</small>':'';
  return '<button type="button" class="deck-index-item" data-deck-jump="'+i+'"'+(i===deck.index?' aria-current="step"':'')+'><span class="deck-index-number">'+(i+1)+'</span><span class="deck-index-description"><strong>'+esc(title)+'</strong>'+topic+'</span><span class="deck-index-type">'+esc(labels[slide.type]||'Slide')+'</span></button>';
 }).join('')||'<p class="deck-index-empty">Nessuna slide corrisponde alla ricerca.</p>';
 overlay.querySelector('#deckIndexCount').textContent=rows.length+' slide visibili su '+items.length+(q?' · tutti i moduli':'');
 overlay.querySelector('#deckIndexCurrent').textContent='Slide '+(deck.index+1)+' di '+items.length;
}
function open(){
 if(!valid())return;
 const el=ensure(),items=slides(),deck=current(),select=el.querySelector('#deckIndexModule');
 const modules=new Map(items.map(s=>[String(s.moduleIndex??0),s.module?.title||('Modulo '+(Number(s.moduleIndex??0)+1))]));
 select.innerHTML=[...modules].map(([id,title])=>'<option value="'+esc(id)+'">'+esc(title)+'</option>').join('');
 select.value=String(items[deck.index]?.moduleIndex??0);
 el.querySelector('#deckIndexSearch').value='';
 el.classList.remove('hidden');document.body.classList.add('deck-index-open');
 render();window.SAFETY_MODAL_ACCESS?.opened?.(el,close);
 el.querySelector('#deckIndexSearch').focus();
}
function close(){
 if(!overlay||overlay.classList.contains('hidden'))return;
 overlay.classList.add('hidden');document.body.classList.remove('deck-index-open');
 window.SAFETY_MODAL_ACCESS?.closed?.(overlay);
}
document.addEventListener('click',event=>{if(event.target?.closest?.('[data-deck-index-open]'))open();});
document.addEventListener('keydown',event=>{
 if(event.defaultPrevented||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.key?.toLowerCase()!=='i'||!valid())return;
 if(event.target?.closest?.('input,textarea,select,button,a,[contenteditable="true"],[role="dialog"]'))return;
 if(overlay&&!overlay.classList.contains('hidden'))return;
 event.preventDefault();open();
});
window.addEventListener('hashchange',close);
document.addEventListener('safety:auth-changed',close);
window.SAFETY_DECK_INDEX_V45_4={open,close};
})();
