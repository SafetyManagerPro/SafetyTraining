/* SafetyTraining v45.9: read-only course image metadata. No preloading or DB operations. */
(()=>{'use strict';
let modal=null,courseId='',rows=[];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const types=new Set(['concept','explain','deep','graphic','risks','prevention','procedure','howTo','escalation','sourceDigest']);
const active=()=>document.body.classList.contains('deckmode')&&!!window.__deck?.cid&&Array.isArray(window.__deckSlides);
const shown=()=>!!modal&&!modal.classList.contains('hidden');
function inspect(s,i){
 s=s||{};const issues=[],type=String(s.type||'');
 let figures=0;
 if(type==='visualAtlas'){
  const vs=Array.isArray(s.visuals)?s.visuals:[];figures=vs.length;
  if(!figures)issues.push('Atlante senza figure');
  vs.forEach((v,j)=>{if(!String(v?.src||'').trim())issues.push('Figura '+(j+1)+': sorgente mancante');
   if(!String(v?.caption||'').trim())issues.push('Figura '+(j+1)+': didascalia e testo alternativo assenti');});
 }else if(types.has(type)){
  const main=s.img||{},gallery=Array.isArray(s.visualGallery)?s.visualGallery.filter(v=>v&&String(v.src||'').trim()).slice(0,2):[];
  figures=1+gallery.length;
  if(!String(main.src||'').trim())issues.push('Figura principale: sorgente originale assente (grafica sostitutiva)');
  if(!String(main.caption||'').trim())issues.push('Figura principale: didascalia originale non specifica (testo automatico in slide)');
  gallery.forEach((v,j)=>{if(!String(v.caption||'').trim())issues.push('Figura aggiuntiva '+(j+2)+': didascalia originale non specifica');});
 }
 // Nonvisual slides and clickable video posters are intentionally excluded.
 return {index:i,title:String(s.title||s.topic?.title||s.module?.title||('Slide '+(i+1))),type,
  moduleIndex:Number(s.moduleIndex)||0,moduleTitle:String(s.module?.title||('Modulo '+((Number(s.moduleIndex)||0)+1))),figures,issues};
}
const collect=list=>(Array.isArray(list)?list:[]).map(inspect);
function ensure(){
 if(modal)return modal;
 modal=document.createElement('div');modal.id='deckCourseAuditOverlay';modal.className='deck-course-audit-overlay hidden';
 modal.innerHTML='<section class="deck-course-audit-dialog" role="dialog" aria-modal="true" aria-labelledby="deckCourseAuditTitle"><header><div><small>INVENTARIO PRELIMINARE · SOLA LETTURA</small><h2 id="deckCourseAuditTitle">Controllo figure del corso</h2><p id="deckCourseAuditContext"></p></div><button type="button" data-course-audit-close aria-label="Chiudi report">×</button></header><div class="deck-course-audit-content"><p id="deckCourseAuditSummary" role="status" aria-live="polite"></p><div class="deck-course-audit-filters"><label>Modulo<select id="deckCourseAuditModule"></select></label><label>Mostra<select id="deckCourseAuditFilter"><option value="issues">Da controllare</option><option value="all">Tutte le slide</option><option value="figures">Con figure</option></select></label><label class="deck-course-audit-search">Cerca slide<input type="search" id="deckCourseAuditSearch" placeholder="Titolo o argomento…" autocomplete="off"></label></div><p id="deckCourseAuditCount" role="status"></p><div id="deckCourseAuditList" class="deck-course-audit-list"></div><p class="deck-course-audit-note"><strong>Come leggere il report:</strong> inventario delle sorgenti e didascalie nella presentazione compilata. La slide può mostrare didascalie automatiche anche quando quelle originali mancano. Non carica le figure delle altre slide, non verifica errori HTTP né eventuali sostituzioni asincrone dell’editor. Per verificare la figura realmente visualizzata apri la slide e scegli «Controlla figure slide». Pertinenza, diritti e approvazioni richiedono una revisione umana. Nessuna modifica salvata.</p></div><footer><button type="button" data-course-audit-refresh>↻ Aggiorna</button><button type="button" data-course-audit-close>Chiudi</button></footer></section>';
 modal.addEventListener('click',e=>{
  if(e.target===modal||e.target?.closest?.('[data-course-audit-close]')){close();return;}
  if(e.target?.closest?.('[data-course-audit-refresh]')){rows=collect(window.__deckSlides);render();return;}
  const button=e.target?.closest?.('[data-course-audit-jump]');
  if(!button)return;
  const i=Number(button.dataset.courseAuditJump),cid=window.__deck?.cid;
  if(!active()||String(cid)!==courseId||!Number.isInteger(i)||i<0||i>=window.__deckSlides.length)return;
  close();window.deckGo?.(cid,i);
 });
 for(const id of ['#deckCourseAuditModule','#deckCourseAuditFilter','#deckCourseAuditSearch'])
  modal.querySelector(id).addEventListener(id.includes('Search')?'input':'change',render);
 document.body.appendChild(modal);return modal;
}
function render(){
 if(!shown()||!active()||String(window.__deck.cid)!==courseId){close();return;}
 const figureCount=rows.reduce((n,r)=>n+r.figures,0),withImages=rows.filter(r=>r.figures>0).length,flagged=rows.filter(r=>r.issues.length).length;
 modal.querySelector('#deckCourseAuditSummary').textContent=rows.length+' slide · '+withImages+' con immagini · '+figureCount+' figure previste · '+flagged+' slide da verificare';
 const module=modal.querySelector('#deckCourseAuditModule').value,filter=modal.querySelector('#deckCourseAuditFilter').value;
 const q=normalize(modal.querySelector('#deckCourseAuditSearch').value.trim());
 const matching=rows.filter(r=>(module==='all'||String(r.moduleIndex)===module)
   &&(filter==='all'||(filter==='issues'?r.issues.length>0:r.figures>0))
   &&(!q||normalize([r.title,r.moduleTitle,r.type].join(' ')).includes(q)));
 const visible=matching.slice(0,100);
 modal.querySelector('#deckCourseAuditCount').textContent=matching.length+' slide corrispondenti'+(matching.length>100?' · mostrate le prime 100; restringi i filtri':'');
 modal.querySelector('#deckCourseAuditList').innerHTML=visible.map(r=>'<article class="deck-course-audit-item'+(r.issues.length?' has-issues':'')+'"><div><strong>Slide '+(r.index+1)+' · '+escape(r.title)+'</strong><small>'+escape(r.moduleTitle)+' · '+r.figures+' figure</small></div>'+
  (r.issues.length?'<ul>'+r.issues.map(a=>'<li>'+escape(a)+'</li>').join('')+'</ul>':'<p class="deck-course-audit-ok">'+(r.figures?'Nessun metadato mancante rilevato.':'Slide senza figure didattiche previste.')+'</p>')+
  '<button type="button" data-course-audit-jump="'+r.index+'">Apri slide '+(r.index+1)+'</button></article>').join('')||'<p class="deck-course-audit-empty">Nessuna slide con questi filtri.</p>';
}
function open(){
 if(!active())return false;
 const el=ensure();courseId=String(window.__deck.cid);rows=collect(window.__deckSlides);
 const modules=new Map(rows.map(r=>[String(r.moduleIndex),r.moduleTitle]));
 el.querySelector('#deckCourseAuditModule').innerHTML='<option value="all">Tutti i moduli</option>'+[...modules].map(([id,t])=>'<option value="'+escape(id)+'">'+escape(t)+'</option>').join('');
 el.querySelector('#deckCourseAuditModule').value='all';el.querySelector('#deckCourseAuditFilter').value='issues';el.querySelector('#deckCourseAuditSearch').value='';
 el.querySelector('#deckCourseAuditContext').textContent='Corso '+courseId+' · dati compilati senza download delle figure';
 el.classList.remove('hidden');document.body.classList.add('deck-course-audit-open');
 render();window.SAFETY_MODAL_ACCESS?.opened?.(el,close);el.querySelector('#deckCourseAuditSearch').focus();return true;
}
function close(){
 if(!shown())return;
 modal.classList.add('hidden');document.body.classList.remove('deck-course-audit-open');
 rows=[];courseId='';window.SAFETY_MODAL_ACCESS?.closed?.(modal);
}
document.addEventListener('safety:deck-slide-rendered',()=>{if(shown()&&(!active()||String(window.__deck.cid)!==courseId))close();});
for(const name of ['safety:image-review-updated','safety:slide-image-edited','safety:auth-changed'])document.addEventListener(name,close);
window.addEventListener('hashchange',()=>{if(shown()&&!/^#deck\//.test(location.hash))close();});
window.SAFETY_DECK_COURSE_AUDIT_V45_9={open,close,collect,inspect,render};
})();