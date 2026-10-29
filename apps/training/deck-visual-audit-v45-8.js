/* SafetyTraining v45.8 — slide visual diagnostics; read only, no rights or teaching approval. */
(()=>{'use strict';
let overlay=null,slideKey='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const deck=()=>document.body.classList.contains('deckmode')&&!!window.__deck?.cid;
const key=()=>window.__deck?.cid+':'+window.__deck?.index;
const shown=()=>!!overlay&&!overlay.classList.contains('hidden');
const images=()=>deck()?[...document.querySelectorAll('#projectorSlide .slide-visual img, #projectorSlide .st-atlas-grid img')].filter(i=>!i.closest('button,a')&&!i.classList.contains('st-brand-course')):[];
function inspect(img){
 const parent=img.closest('.st-slide-figure,.slide-visual,.st-atlas-grid figure');
 const caption=(parent?.querySelector('.st-slide-figure-caption,figcaption')?.textContent||'').trim();
 const alt=String(img.alt||'').trim();
 const src=img.getAttribute?.('src')??img.src;
 const status=!src||(img.complete&&img.naturalWidth===0)?'broken':img.complete&&img.naturalWidth>0?'ok':'pending';
 const issues=[];
 if(status==='broken')issues.push('Immagine non caricata');
 if(!alt)issues.push('Testo alternativo mancante');
 if(!caption)issues.push('Didascalia mancante');
 return {status,caption,alt,issues};
}
function setup(){
 if(overlay)return overlay;
 overlay=document.createElement('div');overlay.id='deckVisualAuditOverlay';overlay.className='deck-audit-overlay hidden';
 overlay.innerHTML='<section class="deck-audit-dialog" role="dialog" aria-modal="true" aria-labelledby="deckAuditTitle"><header><div><small>VERIFICA PRELIMINARE · SOLA LETTURA</small><h2 id="deckAuditTitle">Controllo figure slide</h2><p id="deckAuditContext"></p></div><button type="button" data-audit-close aria-label="Chiudi controllo">×</button></header><div class="deck-audit-content"><p id="deckAuditSummary" role="status" aria-live="polite"></p><div id="deckAuditResults" class="deck-audit-results"></div><p class="deck-audit-disclaimer">Questa verifica riguarda solo le immagini visualizzate nella slide corrente. Non certifica pertinenza didattica, autorizzazioni, diritti o qualità tecnica. Non registra modifiche.</p></div><footer><button type="button" data-audit-refresh>↻ Ricontrolla</button><button type="button" data-audit-close>Chiudi</button></footer></section>';
 overlay.addEventListener('click',e=>{
  if(e.target===overlay||e.target?.closest?.('[data-audit-close]')){close();return;}
  if(e.target?.closest?.('[data-audit-refresh]')){refresh();return;}
  const b=e.target?.closest?.('[data-audit-view]');if(!b)return;
  const i=Number(b.dataset.auditView),arr=images();
  if(!Number.isInteger(i)||i<0||i>=arr.length||inspect(arr[i]).status!=='ok')return;
  close();window.SAFETY_DECK_FIGURES_V45_6?.open?.(i);
 });
 document.body.appendChild(overlay);return overlay;
}
function refresh(){
 if(!shown())return;
 if(!deck()){close();return;}
 const arr=images(),states=arr.map(inspect),issues=states.filter(s=>s.issues.length).length,pending=states.filter(s=>s.status==='pending').length;
 const title=window.__deckSlides?.[window.__deck.index]?.title||'Presentazione';
 overlay.querySelector('#deckAuditContext').textContent='Slide '+(window.__deck.index+1)+' · '+String(title);
 overlay.querySelector('#deckAuditSummary').textContent=arr.length?arr.length+' figure · '+issues+' con segnalazioni'+(pending?' · '+pending+' in caricamento':''):'Nessuna figura didattica presente in questa slide.';
 overlay.querySelector('#deckAuditResults').innerHTML=states.map((state,i)=>{
  const label=state.status==='ok'?'Caricata':state.status==='broken'?'Errore caricamento':'In caricamento';
  return '<article class="deck-audit-item"><div class="deck-audit-item-top"><strong>Figura '+(i+1)+'</strong><span class="deck-audit-state state-'+state.status+'">'+label+'</span></div>'+
   '<p><b>Didascalia:</b> '+esc(state.caption||'Nessuna didascalia')+'</p><p><b>Descrizione:</b> '+esc(state.alt||'Nessun testo alternativo')+'</p>'+
   (state.issues.length?'<p class="deck-audit-alert">Da controllare: '+esc(state.issues.join(' · '))+'</p>':'<p class="deck-audit-good">Nessuna anomalia tecnica evidente dai dati caricati.</p>')+
   '<button type="button" data-audit-view="'+i+'"'+(state.status!=='ok'?' disabled':'')+'>🔍 Apri figura</button></article>';
 }).join('')||'<p class="deck-audit-empty">Questa slide non contiene immagini da controllare.</p>';
}
function open(){
 if(!deck())return false;
 const n=setup();slideKey=key();n.classList.remove('hidden');document.body.classList.add('deck-audit-open');
 refresh();window.SAFETY_MODAL_ACCESS?.opened?.(n,close);n.querySelector('[data-audit-close]').focus();return true;
}
function close(){
 if(!shown())return;
 overlay.classList.add('hidden');document.body.classList.remove('deck-audit-open');
 slideKey='';window.SAFETY_MODAL_ACCESS?.closed?.(overlay);
}
document.addEventListener('safety:deck-slide-rendered',()=>{if(!shown())return;if(!deck()||slideKey!==key()){close();return;}refresh();});
for(const name of ['load','error'])document.addEventListener(name,e=>{if(shown()&&e.target?.closest?.('#projectorSlide'))refresh();},true);
for(const name of ['safety:image-review-updated','safety:slide-image-edited','safety:auth-changed'])document.addEventListener(name,close);
window.addEventListener('hashchange',close);
window.SAFETY_VISUAL_AUDIT_V45_8={open,close,refresh,inspect};
})();
