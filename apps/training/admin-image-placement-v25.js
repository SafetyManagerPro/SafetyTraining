/* SafetyTraining v25.2 — administrator-only manual placement of technically and legally reviewed PDF figures. */
(()=>{'use strict';
const cloud=()=>window.SAFETY_CLOUD?.state;
const db=()=>cloud()?.client;
const actor=()=>cloud()?.user?.id||null;
const admin=()=>!!(actor()&&window.SAFETY_ADMIN_CAPABILITIES_STATE?.platform_admin);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let owner=null,courses=null,sequence=0;
const bundles=new Map();
const courseAllowed=c=>c?.active!==false&&c?.stable_key&&!c?.metadata?.freeze_scope&&!c?.metadata?.frozen&&!c?.metadata?.is_frozen&&!c?.metadata?.course_frozen;
function reset(){
 owner=null;courses=null;sequence++;bundles.clear();
}
async function getCourses(){
 if(owner!==actor()){owner=actor();courses=null;bundles.clear();}
 if(courses)return courses;
 const {data,error}=await db().from('courses').select('stable_key,title,active,metadata')
  .eq('active',true).order('title').limit(200);
 if(error)throw error;
 courses=(data||[]).filter(courseAllowed);
 return courses;
}
async function getBundle(key){
 if(bundles.has(key))return bundles.get(key);
 if(!(await getCourses()).some(c=>c.stable_key===key))throw Error('Corso non disponibile o congelato.');
 const {data,error}=await db().rpc('training_course_bundle',{p_stable_key:key});
 if(error)throw error;
 if(data?.version?.status!=='published')throw Error('Il corso deve avere una versione pubblicata.');
 const modules=(data.modules||[]).map(m=>({
  key:String(m.module_key||''),title:String(m.title||m.module_key||'Modulo'),
  units:(m.units||[]).slice().sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0))
   .map((u,i)=>({position:i+1,title:String(u.title||u.stable_key||'Argomento '+(i+1))}))
 })).filter(m=>m.key&&m.units.length);
 if(!modules.length)throw Error('Moduli e argomenti non disponibili.');
 const bundle={modules,version:data.version.version_number};
 bundles.set(key,bundle);
 return bundle;
}
function option(value,label){return '<option value="'+esc(value)+'">'+esc(label)+'</option>';}
function formMarkup(refId,availableCourses){
 return '<form data-placement-form data-ref="'+esc(refId)+'">'+
  '<label>Corso<select name="course_key" required><option value="">Seleziona il corso</option>'+
  availableCourses.map(c=>option(c.stable_key,c.title)).join('')+'</select></label>'+
  '<label>Modulo<select name="module_key" required><option value="">Prima scegli un corso</option></select></label>'+
  '<label>Argomento della lezione<select name="unit_position" required><option value="">Prima scegli un modulo</option></select></label>'+
  '<label>Motivazione dell’associazione<textarea name="rationale" minlength="15" maxlength="600" rows="2" required placeholder="Perché questa immagine spiega questo argomento?"></textarea></label>'+
  '<p>Disponibile nelle presentazioni e stampe riservate. Nessuna pubblicazione ai corsisti.</p>'+
  '<button type="submit">Associa alla lezione</button><small data-placement-message role="status"></small></form>';
}
function linksMarkup(refId,placements){
 if(!placements.length)return '<p>Nessuna associazione manuale registrata.</p>';
 return '<ul class="st-placement-links">'+placements.map(a=>
  '<li><span>'+esc(a.course_key)+' · '+esc(a.module_key)+' · argomento '+Number(a.unit_position)+
  ' · versione '+Number(a.version_number)+'</span>'+
  '<button type="button" data-placement-remove="'+esc(refId)+'" data-course="'+esc(a.course_key)+
  '" data-module="'+esc(a.module_key)+'" data-position="'+Number(a.unit_position)+'">Rimuovi</button></li>'
 ).join('')+'</ul>';
}
function notifyChanged(){
 window.SAFETY_INTEGRAL_PDF_V24?.invalidate?.();
 document.dispatchEvent(new Event('safety:image-review-updated'));
}
async function submitPlacement(form,host,items){
 if(!admin()||!form.isConnected)return;
 const id=form.dataset.ref,newData=new FormData(form),key=String(newData.get('course_key')||''),
  mod=String(newData.get('module_key')||''),position=Number(newData.get('unit_position')||0),
  reason=String(newData.get('rationale')||'').trim(),message=form.querySelector('[data-placement-message]');
 if(!/^pdf-[0-9]{5}$/.test(id)||!Number.isInteger(position)||position<1||reason.length<15){
  message.textContent='Compila corso, modulo, argomento e una motivazione di almeno 15 caratteri.';return;
 }
 try{
  const b=await getBundle(key);
  if(!b.modules.some(m=>m.key===mod&&m.units.some(u=>u.position===position))){
   message.textContent='Selezione non presente nella versione pubblicata.';return;
  }
  if(!window.confirm('Associare la figura già approvata alla lezione selezionata, solo per uso interno?'))return;
  const currentActor=actor(),button=form.querySelector('button[type="submit"]');
  button.disabled=true;message.textContent='Salvataggio…';
  const {error}=await db().rpc('training_place_integral_pdf_v25',{
   p_ref_id:id,p_course_key:key,p_module_key:mod,p_unit_position:position,
   p_action:'attach',p_rationale:reason
  });
  if(error)throw error;
  if(actor()!==currentActor)return;
  notifyChanged();
  await renderFor(host,items);
 }catch(err){if(form.isConnected)message.textContent='Errore: '+(err?.message||err);}
 finally{const button=form.querySelector('button[type="submit"]');if(button)button.disabled=false;}
}
async function removePlacement(button,host,items){
 if(!admin())return;
 const reason=window.prompt('Motivazione della rimozione (minimo 15 caratteri):');
 if(reason===null)return;
 if(reason.trim().length<15){window.alert('Specificare una motivazione di almeno 15 caratteri.');return;}
 if(!window.confirm('Rimuovere questa associazione senza eliminare l’immagine originale?'))return;
 const id=button.dataset.placementRemove,currentActor=actor();button.disabled=true;
 try{
  const {error}=await db().rpc('training_place_integral_pdf_v25',{
   p_ref_id:id,p_course_key:button.dataset.course,p_module_key:button.dataset.module,
   p_unit_position:Number(button.dataset.position),p_action:'detach',p_rationale:reason.trim()
  });
  if(error)throw error;
  if(actor()!==currentActor)return;
  notifyChanged();
  await renderFor(host,items);
 }catch(err){window.alert('Impossibile rimuovere l’associazione: '+(err?.message||err));}
 finally{button.disabled=false;}
}
async function changeSelect(select){
 const form=select.closest('form[data-placement-form]');
 if(!form||!admin())return;
 const moduleSelect=form.querySelector('[name="module_key"]'),unitSelect=form.querySelector('[name="unit_position"]');
 if(select.name==='course_key'){
  unitSelect.innerHTML=option('','Prima scegli il modulo');
  moduleSelect.innerHTML=option('','Caricamento moduli…');
  const chosen=select.value,requestOwner=actor();
  if(!chosen){moduleSelect.innerHTML=option('','Prima scegli il corso');return;}
  try{
   const bundle=await getBundle(chosen);
   if(!form.isConnected||actor()!==requestOwner||select.value!==chosen)return;
   moduleSelect.innerHTML=option('','Seleziona modulo')+bundle.modules.map(m=>option(m.key,m.title)).join('');
  }catch(err){if(form.isConnected)moduleSelect.innerHTML=option('',err?.message||'Moduli non disponibili');}
 }else if(select.name==='module_key'){
  const b=bundles.get(form.querySelector('[name="course_key"]').value);
  const m=b?.modules.find(m=>m.key===select.value);
  unitSelect.innerHTML=option('','Seleziona argomento')+(m?m.units.map(u=>option(u.position,u.title)).join(''):'');
 }
}
async function renderFor(host,items){
 const request=++sequence,currentActor=actor();
 if(!admin()||!host?.isConnected||!Array.isArray(items)||!items.length)return;
 const ids=items.map(x=>x.id).filter(x=>/^pdf-[0-9]{5}$/.test(x));
 if(!ids.length)return;
 try{
  const [availableCourses,{data:links,error}]=await Promise.all([
   getCourses(),
   db().from('training_integral_pdf_placements_v25')
    .select('ref_id,course_key,module_key,unit_position,version_number')
    .in('ref_id',ids).order('course_key')
  ]);
  if(error)throw error;
  if(request!==sequence||actor()!==currentActor||!host.isConnected)return;
  const map=new Map();
  for(const link of links||[]){
   if(!map.has(link.ref_id))map.set(link.ref_id,[]);
   map.get(link.ref_id).push(link);
  }
  for(const x of items){
   const card=[...host.querySelectorAll('[data-review-ref]')].find(c=>c.dataset.reviewRef===x.id);
   if(!card)continue;
   card.querySelector('.st-image-placement')?.remove();
   const panel=document.createElement('details');
   panel.className='st-image-placement';
   const allowed=x.review?.technical_status==='approved'&&x.review?.rights_status==='cleared_internal';
   panel.innerHTML='<summary>Associa a corso, modulo e argomento</summary>'+
    linksMarkup(x.id,map.get(x.id)||[])+
    (allowed?formMarkup(x.id,availableCourses):
    '<p class="st-image-placement-notice">Prima conferma la revisione tecnica e il diritto di utilizzo interno: senza entrambi non si può aggiungere un’associazione.</p>');
   card.appendChild(panel);
  }
  host.__placementItems=items;
  if(host.dataset.placementHandlers!=='1'){
   host.dataset.placementHandlers='1';
   // The image catalog itself is rerendered, but this gallery node remains stable.
   host.addEventListener('submit',e=>{
    const form=e.target.closest?.('form[data-placement-form]');
    if(!form)return;e.preventDefault();void submitPlacement(form,host,host.__placementItems);
   });
   host.addEventListener('change',e=>{
    if(e.target.closest?.('form[data-placement-form]'))void changeSelect(e.target);
   });
   host.addEventListener('click',e=>{
    const button=e.target.closest?.('[data-placement-remove]');
    if(button)void removePlacement(button,host,host.__placementItems);
   });
  }
 }catch(err){
  if(request===sequence&&host.isConnected){
   const notice=document.createElement('p');notice.className='st-image-placement-notice';
   notice.textContent='Associazioni non disponibili: '+(err?.message||err);
   host.prepend(notice);
  }
 }
}
document.addEventListener('safety:auth-changed',reset);
window.SAFETY_ADMIN_IMAGE_PLACEMENT_V25={renderFor,getBundle,courseAllowed,reset};
})();