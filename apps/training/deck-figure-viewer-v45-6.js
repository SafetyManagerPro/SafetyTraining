/* v45.6 — read-only image zoom for already rendered slides. */
(()=>{'use strict';
let modal=null,list=[],at=0,level=1,origin='';
const deck=()=>document.body.classList.contains('deckmode')&&!!window.__deck;
const figures=()=>deck()?[...document.querySelectorAll('#projectorSlide .slide-visual img, #projectorSlide .st-atlas-grid img')].filter(i=>!i.closest('button,a')&&!i.classList.contains('st-brand-course')):[];
const visible=()=>modal&&!modal.classList.contains('hidden');
const button=()=>document.querySelector('[data-deck-figure-open]');
function refresh(){
 const b=button();if(!b)return;
 const n=figures().length;b.disabled=n===0;b.title=n?('Ingrandisci '+n+' figure della slide'):'Nessuna figura da ingrandire';
}
function init(){
 if(modal)return modal;
 modal=document.createElement('div');modal.id='deckFigureOverlay';modal.className='deck-figure-overlay hidden';
 modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="figureHeading" class="deck-figure-dialog"><header><div><strong id="figureHeading">Figura ingrandita</strong><small id="figureCounter"></small></div><button type="button" class="figure-close" data-figure-close aria-label="Chiudi">×</button></header><div class="figure-body"><button type="button" data-figure-prev aria-label="Figura precedente">‹</button><div class="figure-scroller"><img id="figureImage" alt=""><p id="figureCaption"></p></div><button type="button" data-figure-next aria-label="Figura successiva">›</button></div><footer><span>Usa + / − per ingrandire · Esc per chiudere</span><div><button type="button" data-figure-minus aria-label="Riduci zoom">−</button><b id="figureZoom">100%</b><button type="button" data-figure-plus aria-label="Aumenta zoom">+</button><button type="button" data-figure-fit>Adatta</button></div></footer></section>';
 modal.addEventListener('click',e=>{
  if(e.target===modal||e.target?.closest?.('[data-figure-close]')){close();return;}
  if(e.target?.closest?.('[data-figure-prev]'))move(-1);
  if(e.target?.closest?.('[data-figure-next]'))move(1);
  if(e.target?.closest?.('[data-figure-plus]'))zoom(level+.5);
  if(e.target?.closest?.('[data-figure-minus]'))zoom(level-.5);
  if(e.target?.closest?.('[data-figure-fit]'))zoom(1);
 });
 document.body.appendChild(modal);return modal;
}
function zoom(n){
 if(!visible())return;
 level=Math.max(1,Math.min(3,Math.round(n*2)/2));
 modal.querySelector('#figureImage').style.width=level*100+'%';
 modal.querySelector('#figureZoom').textContent=Math.round(level*100)+'%';
 modal.querySelector('[data-figure-minus]').disabled=level===1;
 modal.querySelector('[data-figure-plus]').disabled=level===3;
}
function draw(){
 if(!visible())return;
 const i=list[at],out=modal.querySelector('#figureImage');
 out.src=i.currentSrc||i.src;out.alt=i.alt||'Figura didattica';
 const parent=i.closest('.st-slide-figure,.slide-visual,.st-atlas-grid figure');
 modal.querySelector('#figureCaption').textContent=parent?.querySelector('.st-slide-figure-caption,figcaption')?.textContent||i.alt||'';
 modal.querySelector('#figureCounter').textContent='Figura '+(at+1)+' di '+list.length;
 modal.querySelector('[data-figure-prev]').disabled=at===0;
 modal.querySelector('[data-figure-next]').disabled=at===list.length-1;
 const scroller=modal.querySelector('.figure-scroller');scroller.scrollTop=0;scroller.scrollLeft=0;zoom(1);
}
function open(index=0){
 const found=figures();if(!found.length||!Number.isInteger(index)||index<0||index>=found.length)return false;
 list=found;at=index;origin=window.__deck.cid+':'+window.__deck.index;
 const el=init();el.classList.remove('hidden');document.body.classList.add('deck-figure-open');
 draw();window.SAFETY_MODAL_ACCESS?.opened?.(el,close);el.querySelector('[data-figure-close]').focus();return true;
}
function close(){
 if(!visible())return;
 modal.classList.add('hidden');document.body.classList.remove('deck-figure-open');
 list=[];origin='';modal.querySelector('#figureImage').removeAttribute('src');
 window.SAFETY_MODAL_ACCESS?.closed?.(modal);
}
function move(by){if(!visible()||!Number.isInteger(by)||at+by<0||at+by>=list.length)return false;at+=by;draw();return true;}
document.addEventListener('click',e=>{
 if(e.target?.closest?.('[data-deck-figure-open]')){open();return;}
 const i=e.target?.closest?.('#projectorSlide .slide-visual img, #projectorSlide .st-atlas-grid img');
 if(i){const index=figures().indexOf(i);if(index>=0)open(index);}
});
document.addEventListener('keydown',e=>{
 if(!visible()||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey)return;
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation?.();move(e.key==='ArrowRight'?1:-1);}
 else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(level+.5);}
 else if(e.key==='-'){e.preventDefault();zoom(level-.5);}
},true);
document.addEventListener('safety:deck-slide-rendered',()=>{if(visible()&&origin!==window.__deck?.cid+':'+window.__deck?.index)close();refresh();});
for(const evt of ['safety:slide-image-edited','safety:image-review-updated','safety:auth-changed'])document.addEventListener(evt,()=>{close();refresh();});
window.addEventListener('hashchange',()=>{close();refresh();});
refresh();
window.SAFETY_DECK_FIGURES_V45_6={open,close,move,refresh,zoom};
})();
