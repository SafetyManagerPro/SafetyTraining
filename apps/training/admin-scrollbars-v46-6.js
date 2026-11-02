/* SafetyTraining v46.6 — admin-only scroll enhancement.
 * Add accessible scroll wrappers exclusively to administrative tables that lack one.
 * No database, identity, completion, course, quiz or publication operations. */
(()=>{'use strict';
 const root=()=>document.getElementById('adminShell');
 const content=()=>document.getElementById('adminContent');
 const knownWrappers='.admin-table-wrap,.bp-table-wrap,.readiness-table-wrap,.a40-table,.st-v465-tablewrap,.st-v466-scroll-table,.sm-comp-table-wrap';
 let observer=null,attachedTo=null,pending=false;
 const countColumns=table=>table.tHead?.rows?.[0]?.cells?.length||
  table.rows?.[0]?.cells?.length||0;
 const printMode=()=>document.body?.classList?.contains('admin-path-print')||
  document.body?.classList?.contains('admin-attendance-print')||
  document.body?.classList?.contains('admin-course-print')||
  document.body?.classList?.contains('admin-slides-print');
 function hasLocalScrollParent(table,scope){
  if(table.closest(knownWrappers))return true;
  for(let p=table.parentElement;p&&p!==scope;p=p.parentElement){
   // The existing inline overflow:auto wrappers (e.g. the course composition modal)
   // already contain horizontal scrolling. Never nest another scrollbar inside them.
   const style=p.style;
   if(style&&/^(auto|scroll)$/.test(String(style.overflow||style.overflowX||'').trim()))return true;
  }
  return false;
 }
 function shouldWrap(table,scope){
  if(!table||!scope||!scope.contains(table)||printMode())return false;
  if(table.closest('#adminPrintableSlides,#adminPrintableLessons,.slide-print-document'))return false;
  if(hasLocalScrollParent(table,scope))return false;
  const cols=countColumns(table),parent=table.parentElement;
  if(!parent)return false;
  // The ordinary two-column key/value tables should retain their original layout
  // unless they really overflow the parent (e.g. a very narrow mobile viewport).
  if(cols<3&&(!parent.clientWidth||table.scrollWidth<=parent.clientWidth+12))return false;
  return true;
 }
 function labelFor(table){
  const card=table.closest('.admin-card');
  const heading=card?.querySelector('h2,h3');
  const title=heading?.textContent?.trim();
  return title?'Tabella amministrativa: '+title:'Tabella amministrativa, scorri per consultare altre colonne e righe';
 }
 function decorate(target,label){
  if(!target||target.dataset?.stV466Enhanced)return;
  target.dataset.stV466Enhanced='true';
  if(target.tabIndex<0)target.tabIndex=0;
  if(!target.getAttribute('role')&&target.tagName!=='NAV'&&target.tagName!=='MAIN')
   target.setAttribute('role','region');
  if(!target.getAttribute('aria-label'))target.setAttribute('aria-label',label);
 }
 function wrap(table,scope){
  if(!shouldWrap(table,scope))return false;
  const cols=countColumns(table);
  const holder=document.createElement('div');
  holder.className='st-v466-scroll-table';
  holder.dataset.stV466Cols=String(cols);
  decorate(holder,labelFor(table));
  table.parentElement.insertBefore(holder,table);
  holder.appendChild(table);
  return true;
 }
 function enhance(){
  const shell=root(),scope=content();
  if(!shell||!scope||shell.classList.contains('hidden')||printMode())return 0;
  decorate(shell.querySelector('.admin-nav>nav'),'Menu laterale amministrazione: scorri verso il basso per altre sezioni');
  decorate(shell.querySelector('.admin-main'),'Contenuto Amministrazione: scorri verticalmente');
  let added=0;
  // Only actual tables inside admin pages: never learner/projector or print content.
  for(const table of [...scope.querySelectorAll('table')])if(wrap(table,scope))added++;
  const containers=scope.querySelectorAll(
   '.admin-table-wrap,.bp-table-wrap,.readiness-table-wrap,.a40-table,.st-v465-tablewrap,.st-v466-scroll-table,.admin-check-list,.admin-delete-review,.admin-delete-entries,.lp39-list,.st-v465-history'
  );
  for(const node of containers)decorate(node,
   node.querySelector('table')?labelFor(node.querySelector('table')):'Elenco amministrativo scorrevole');
  return added;
 }
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;enhance();});
 }
 function hasNewContent(records){
  return records.some(entry=>[...entry.addedNodes].some(node=>
   node.nodeType===1&&(node.matches?.('table,tr,thead,tbody,.admin-table-wrap,.st-v466-scroll-table')||
     node.querySelector?.('table'))));
 }
 function boot(){
  const shell=root(),scope=content();
  if(!shell||!scope)return false;
  if(attachedTo!==scope){
   observer?.disconnect();attachedTo=scope;
   observer=new MutationObserver(records=>{if(hasNewContent(records))schedule();});
   observer.observe(scope,{childList:true,subtree:true});
  }
  schedule();
  return true;
 }
 function start(){
  if(boot())return;
  let attempts=0;
  const timer=setInterval(()=>{if(boot()||++attempts>=40)clearInterval(timer);},150);
 }
 window.SAFETY_ADMIN_SCROLLBARS_V46_6={boot,enhance,shouldWrap,countColumns,version:'v46.6'};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();