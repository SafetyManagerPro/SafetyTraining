/* SafetyTraining v47.8 — Italian alphabetical order in administrative pickers.
 * This changes DISPLAY order only. It never sorts course slides, didactic units,
 * quiz answers, stored rows, chronology, or the learner's course navigation.
 */
(()=>{'use strict';
 const collator=new Intl.Collator('it-IT',{sensitivity:'base',numeric:true,ignorePunctuation:true});
 const compare=(a,b)=>collator.compare(String(a??'').trim(),String(b??'').trim());
 const sortBy=(items,getLabel)=>[...(items||[])].sort((a,b)=>compare(getLabel(a),getLabel(b)));
 const entityLabel=/corsist|learner|alliev|azienda|company|organizz|organization|edizion|edition|corso|course|modul|persona|person/i;
 const skipLabel=/\b(?:stato|status|modalità|modalita|durata|giorni|mese|anno|data|scadenza|versione\s+(?:numero|stato)|ordinamento|ordine|risultato|punteggio|tipo|certificazione|step|pagina|percentuale)\b/i;
 let pending=false;
 function labelFor(select){
  const label=select.closest('label');
  if(label){
   // Only label text OUTSIDE the <select>; including option text could
   // incorrectly mark unrelated status dropdowns as "course" selectors.
   const lead=[...label.childNodes].filter(x=>x!==select).map(x=>x.textContent||'').join(' ').trim();
   if(lead)return lead;
  }
  return select.getAttribute('aria-label')||select.getAttribute('id')||select.getAttribute('name')||
   select.getAttribute('data-field')||'';
 }
 function shouldSort(select){
  if(select.hasAttribute('data-alpha-preserve')||select.closest('[data-alpha-preserve]'))return false;
  if(select.hasAttribute('data-alpha-sort'))return true;
  const label=labelFor(select);
  if(skipLabel.test(label)||!entityLabel.test(label))return false;
  return true;
 }
 function groups(select){
  if(select.querySelector('optgroup'))return [...select.querySelectorAll('optgroup')];
  return [select];
 }
 function sortOptions(select){
  if(!shouldSort(select)||select.disabled)return false;
  let changed=false;
  const oldValue=select.value;
  const oldIndex=select.selectedIndex;
  for(const group of groups(select)){
   const options=[...group.children].filter(node=>node.tagName==='OPTION');
   if(options.length<2)continue;
   const first=options.filter(o=>!o.value||o.disabled&&o.value==='');
   const actions=options.filter(o=>o.value==='new'||/^\s*\+\s/.test(o.textContent||''));
   const movable=options.filter(o=>!first.includes(o)&&!actions.includes(o));
   const desired=[...first,...movable.sort((x,y)=>compare(x.textContent,y.textContent)),...actions];
   if(options.every((o,i)=>o===desired[i]))continue;
   const fragment=document.createDocumentFragment();
   desired.forEach(o=>fragment.appendChild(o));
   group.appendChild(fragment);
   changed=true;
  }
  if(changed){
   // Sorting must never switch an active organization, course or learner.
   if([...select.options].some(o=>o.value===oldValue))select.value=oldValue;
   else if(oldIndex>=0&&oldIndex<select.options.length)select.selectedIndex=oldIndex;
  }
  return changed;
 }
 function apply(root=document){
  const scopes=[];
  if(root.querySelectorAll)scopes.push(...root.querySelectorAll('#adminShell select,#adminModal select,.admin-modal-overlay select'));
  if(root.matches?.('select')&&root.closest('#adminShell,#adminModal,.admin-modal-overlay'))scopes.push(root);
  let changed=0;
  for(const select of new Set(scopes))if(sortOptions(select))changed++;
  return changed;
 }
 function schedule(){
  if(pending)return;
  pending=true;
  queueMicrotask(()=>{pending=false;apply();});
 }
 function start(){
  apply();
  const observer=new MutationObserver(records=>{
   if(records.some(record=>{
    const target=record.target;
    if(target.nodeType===1&&target.closest?.('#adminShell,#adminModal,.admin-modal-overlay'))return true;
    return [...record.addedNodes].some(node=>node.nodeType===1&&
     (node.matches?.('#adminShell,#adminModal,.admin-modal-overlay')||
      node.querySelector?.('#adminShell,#adminModal,.admin-modal-overlay')));
   }))schedule();
  });
  observer.observe(document.body,{childList:true,subtree:true});
 }
 window.SAFETY_ADMIN_ALPHA_V47_8={compare,sortBy,sortOptions,apply};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();