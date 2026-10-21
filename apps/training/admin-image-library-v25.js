/* SafetyTraining v24.8.7 — one admin-only catalog for local and private image inventories. */
(()=>{'use strict';
const root=()=>document.getElementById('adminShell');
const host=()=>document.getElementById('adminContent');
const cloud=()=>window.SAFETY_CLOUD?.state;
const actor=()=>cloud()?.user?.id||null;
const db=()=>cloud()?.client;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={type:'local',query:'',status:'all',course:'',module:'',page:0,files:null,seq:0,stats:null,filterCatalog:null};
const pageSize=24;
function category(src){
 const s=String(src).toLowerCase();
 if(/carrell|forklift/.test(s))return 'Carrelli';
 if(/\bple\b|[-/]ple[-.]/.test(s))return 'PLE';
 if(/gru|crane/.test(s))return 'Gru';
 if(/mmt|escavat/.test(s))return 'MMT';
 if(/dpi|ppe|casco|respir|guant/.test(s))return 'DPI';
 if(/segnal|signs/.test(s))return 'Segnaletica';
 if(/piramid|risch|risk/.test(s))return 'Rischi';
 if(/fire|antincend/.test(s))return 'Antincendio';
 return 'Altre illustrazioni';
}
const nameOf=src=>String(src).split('/').pop().replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
async function saveReview(event){
 event.preventDefault();
 const form=event.target;
 if(!form.matches?.('form[data-review-form]')||!await verified())return;
 const button=form.querySelector('[data-review-save]');
 const refId=button?.dataset.reviewSave||'';
 const msg=form.querySelector('[data-review-message]');
 const formData=new FormData(form);
 const technical_status=String(formData.get('technical_status')||'');
 const rights_status=String(formData.get('rights_status')||'');
 const technical_note=String(formData.get('technical_note')||'').trim();
 const rights_evidence=String(formData.get('rights_evidence')||'').trim();
 if(!/^pdf-[0-9]{5}$/.test(refId))return;
 if(technical_note.length<25){msg.textContent='Descrivi la motivazione tecnica con almeno 25 caratteri.';return;}
 if(rights_status==='cleared_internal'&&rights_evidence.length<20){
  msg.textContent='Inserisci un riferimento verificabile ai diritti di almeno 20 caratteri.';return;
 }
 if((technical_status==='approved'||rights_status==='cleared_internal')&&!window.confirm(
  'Confermi di avere realmente verificato la figura e la documentazione dichiarata? Questa operazione non pubblica l’immagine e sarà registrata con la tua identità.'))return;
 const currentActor=actor();
 button.disabled=true;msg.textContent='Registrazione della revisione…';
 try{
  const {error}=await db().rpc('training_review_integral_pdf_v25',{
   p_ref_id:refId,p_technical_status:technical_status,p_rights_status:rights_status,
   p_technical_note:technical_note,p_rights_evidence:rights_evidence
  });
  if(error)throw error;
  if(actor()!==currentActor)return;
  window.SAFETY_INTEGRAL_PDF_V24?.invalidate?.();
  document.dispatchEvent(new Event('safety:image-review-updated'));
  msg.textContent='Revisione registrata. Il catalogo verrà aggiornato.';
  await paint();
 }catch(error){if(actor()===currentActor)msg.textContent='Revisione non salvata: '+(error?.message||error);}
 finally{button.disabled=false;}
}
function ensureNav(){
 const nav=root()?.querySelector('.admin-nav nav');
 if(!nav||nav.querySelector('[data-image-library-v25]'))return;
 const button=document.createElement('button');
 button.type='button';button.dataset.imageLibraryV25='1';
 button.innerHTML='<span>🖼</span> Gestione immagini';
 const anchor=nav.querySelector('[data-tab="courses"]');
 if(anchor)anchor.after(button);else nav.appendChild(button);
 button.addEventListener('click',()=>{root()?.classList.remove('admin-mobile-nav-open');void render();});
}
async function verified(){
 const userId=actor(),client=db();
 if(!userId||!client)return false;
 const {data,error}=await client.from('platform_admins').select('user_id').eq('user_id',userId).maybeSingle();
 if(error)throw error;
 return !!data?.user_id&&actor()===userId;
}
function active(seq,userId){return seq===state.seq&&actor()===userId&&!!root()?.querySelector('[data-image-library-v25].active');}
async function loadLocal(){
 if(state.files)return state.files;
 const response=await fetch('./image-library-v25.json',{cache:'force-cache'});
 if(!response.ok)throw Error('Inventario illustrazioni locali non disponibile.');
 const manifest=await response.json();
 const files=Array.isArray(manifest.images)?manifest.images:[];
 state.files=files.filter(x=>/^assets\/[a-zA-Z0-9_/-]+\.(svg|png|jpe?g|webp)$/.test(x)&&!x.includes('..')).map(src=>({src,category:category(src),name:nameOf(src)}));
 return state.files;
}
async function count(table,condition){
 const {count,error}=await condition(db().from(table).select('*',{count:'exact',head:true}));
 return error?'n/d':count??0;
}
async function loadStats(){
 const values=await Promise.allSettled([
  count('training_integral_pdf_assets_v24',q=>q),
  count('training_integral_pdf_refs_v24',q=>q.gte('id','pdf-50000')),
  count('training_source_figures_v23',q=>q),
  count('training_integral_pdf_visual_audit_v27',q=>q.eq('evidence_method','contact_sheet_visual_inspection')),
  count('training_integral_pdf_visual_audit_v27',q=>q.eq('evidence_method','contact_sheet_group_visual_triage')),
  count('training_integral_pdf_screening_v28',q=>q),
  count('training_integral_pdf_comparison_v28',q=>q)
 ]);
 return values.map(v=>v.status==='fulfilled'?v.value:'n/d');
}
async function courseOptions(){
 if(state.filterCatalog)return state.filterCatalog;
 const {data,error}=await db().rpc('training_image_matching_catalog_v26');
 if(error)throw error;
 const courses=new Map(),modules=new Map();
 for(const r of data||[]){
  if(!courses.has(r.course_key))courses.set(r.course_key,r.course_title);
  if(!modules.has(r.course_key))modules.set(r.course_key,new Map());
  modules.get(r.course_key).set(r.module_key,r.module_title);
 }
 state.filterCatalog={courses,modules};
 return state.filterCatalog;
}
function syncFilterControls(){
 const root=host(),type=root?.querySelector('#stImageType')?.value||state.type;
 const pdf=type==='integral';
 for(const id of ['stImageStatus','stImageCourse','stImageModule']){
  const el=root?.querySelector('#'+id);
  if(el){el.disabled=!pdf;el.closest('label')?.classList.toggle('st-filter-disabled',!pdf);}
 }
 const mod=root?.querySelector('#stImageModule');
 if(mod&&!state.course)mod.disabled=true;
 const message=root?.querySelector('#stImageFilterHint');
 if(message)message.textContent=pdf?
  'Filtri sull’intero archivio PDF (non soltanto sulla pagina corrente). “Esaminate” indica analisi visiva, non approvazione. “Associate” richiede diritti e revisione tecnica approvati e una collocazione valida.':
  'I filtri didattici avanzati sono disponibili per le Tavole PDF complete. Per questo archivio rimane attiva la ricerca per tema.';
}
async function fillCourseOptions(){
 const cat=await courseOptions(),c=host()?.querySelector('#stImageCourse');
 if(!c)return;
 c.innerHTML='<option value="">Tutti i corsi</option>'+[...cat.courses].map(([key,title])=>'<option value="'+esc(key)+'">'+esc(title)+'</option>').join('');
 c.value=state.course;
 fillModuleOptions(cat);
}
function fillModuleOptions(cat){
 const m=host()?.querySelector('#stImageModule');
 if(!m)return;
 const options=state.course?Array.from(cat.modules.get(state.course)||[]):[];
 m.innerHTML='<option value="">Tutti i moduli</option>'+options.map(([key,title])=>'<option value="'+esc(key)+'">'+esc(title)+'</option>').join('');
 m.value=state.module;
 syncFilterControls();
}
async function rowsPrivate(type,page,q){
 const table=type==='integral'?'training_integral_pdf_refs_v24':'training_source_figures_v23';
 const fields=type==='integral'
  ?'id,category,topic,source_document,source_page,rights_status,technical_review_required,asset:training_integral_pdf_assets_v24!inner(storage_path)'
  :'id,category,excerpt,source_document,source_page,rights_status,review_class,storage_path';
 let req=db().from(table).select(fields,{count:'exact'}).order('id');
 if(type==='integral'&&(state.status!=='all'||state.course||state.module)){
  const {data:filtered,error:filterError}=await db().rpc('training_image_filter_page_v29',{
   p_status:state.status,p_course_key:state.course||null,p_module_key:state.module||null,
   p_search:q,p_page:page,p_page_size:pageSize
  });
  if(filterError)throw filterError;
  const ids=filtered?.ids||[];
  if(!ids.length)return {total:Number(filtered?.total)||0,rows:[]};
  req=db().from(table).select(fields).in('id',ids).order('id');
  q='';
  const {data,error}=await req;
  if(error)throw error;
  const original=data||[];
  return enrichPrivateRows(type,original,Number(filtered.total)||0);
 }
 if(type==='integral')req=req.gte('id','pdf-50000');
 if(q)req=req.ilike(type==='integral'?'topic':'excerpt','%'+q.replace(/[%_,()]/g,'').slice(0,65)+'%');
 const {data,error,count:total}=await req.range(page*pageSize,page*pageSize+pageSize-1);
 if(error)throw error;
 return enrichPrivateRows(type,data||[],total||0);
}
async function enrichPrivateRows(type,list,total){
 const paths=list.map(x=>type==='integral'?x.asset?.storage_path:x.storage_path).filter(Boolean);
 // Independent, administrator-only decisions do not alter the source's immutable provenance.
 const reviews=new Map();
 if(type==='integral'&&list.length){
  const {data:decisions,error:reviewError}=await db().from('training_integral_pdf_reviews_v25')
   .select('ref_id,technical_status,rights_status,technical_note,rights_evidence,reviewed_by,updated_at')
   .in('ref_id',list.map(x=>x.id));
  if(reviewError)throw reviewError;
  for(const decision of decisions||[])reviews.set(decision.ref_id,decision);
 }
 const map=new Map();
 if(paths.length){
  const {data:signed,error:signError}=await db().storage.from('training-source-figures').createSignedUrls(paths,600);
  if(signError)throw signError;
  (signed||[]).forEach((u,i)=>{if(u.signedUrl&&!u.error)map.set(paths[i],u.signedUrl);});
 }
 return {total:total||0,rows:list.map(x=>({
  id:x.id,
  name:x.topic||x.excerpt||'Tavola da verificare',
  category:x.category||'Senza categoria',
  src:map.get(type==='integral'?x.asset?.storage_path:x.storage_path)||'',
  detail:(x.source_document||'')+' · pagina '+(x.source_page||'—'),
  status:type==='integral'
   ?(reviews.get(x.id)?.technical_status==='approved'?'Revisione tecnica confermata':reviews.get(x.id)?.technical_status==='rejected'?'Non idonea':'Revisione tecnica richiesta')
   :(x.review_class||'In revisione'),
  rights:type==='integral'?(reviews.get(x.id)?.rights_status||'review_required'):(x.rights_status||'review_required'),
  review:reviews.get(x.id)||null
 }))};
}
function tile(x,type){
 const image=x.src?'<img loading="lazy" decoding="async" src="'+esc(x.src)+'" alt="'+esc(x.name)+'">':'<div class="st-image-missing">Anteprima non disponibile</div>';
 const review=x.review||{};
 const technical=review.technical_status||'pending',rights=review.rights_status||'review_required';
 const approved=technical==='approved'&&rights==='cleared_internal';
 const label=approved?'Revisionata per uso interno':x.status;
 const status='<span class="st-image-status">'+(type==='local'?'Disponibile nell’app':'Privata · '+esc(label)+' · Diritti: '+esc(rights))+'</span>';
 const detail=type==='integral'
  ?'<details class="st-image-review"><summary>Esamina / cambia stato di revisione</summary><form data-review-form>'+
     '<label>Esito tecnico<select name="technical_status"><option value="pending"'+(technical==='pending'?' selected':'')+'>Da verificare</option><option value="approved"'+(technical==='approved'?' selected':'')+'>Verificata da un esperto</option><option value="rejected"'+(technical==='rejected'?' selected':'')+'>Non idonea</option></select></label>'+
     '<label>Diritti di utilizzo<select name="rights_status"><option value="review_required"'+(rights==='review_required'?' selected':'')+'>Da verificare</option><option value="cleared_internal"'+(rights==='cleared_internal'?' selected':'')+'>Autorizzata per uso interno</option><option value="rejected"'+(rights==='rejected'?' selected':'')+'>Utilizzo non consentito</option></select></label>'+
     '<label>Motivazione tecnico-didattica (obbligatoria)<textarea name="technical_note" rows="3" maxlength="1000" required placeholder="Pertinenza, accuratezza, data e riferimenti esaminati">'+esc(review.technical_note||'')+'</textarea></label>'+
     '<label>Documento/licenza/autorizzazione dei diritti<textarea name="rights_evidence" rows="2" maxlength="1000" placeholder="Fonte verificabile, intestatario, autorizzazione e ambito di utilizzo">'+esc(review.rights_evidence||'')+'</textarea></label>'+
     '<p class="st-image-review-caution">L’approvazione non pubblica immagini ai corsisti: restano in archivio privato. L’abbinamento alla lezione è una verifica separata.</p>'+
     (review.updated_at?'<small>Ultima revisione: '+esc(new Date(review.updated_at).toLocaleString('it-IT'))+'</small>':'')+
     '<button type="submit" data-review-save="'+esc(x.id)+'">Salva revisione</button><p role="status" data-review-message></p>'+
    '</form></details>':'';
 return '<article class="st-image-card" data-review-ref="'+esc(x.id)+'">'+image+'<strong>'+esc(x.name)+'</strong><small>'+esc(x.category)+'</small>'+status+
 (x.detail?'<small>'+esc(x.detail)+'</small>':'')+detail+'</article>';
}
async function paint(){
 const seq=++state.seq,userId=actor(),gallery=host()?.querySelector('#stImageGallery'),stat=host()?.querySelector('#stImagePagination');
 if(!gallery||!stat||!active(seq,userId))return;
 gallery.innerHTML='<p class="admin-loading">Caricamento immagini…</p>';
 try{
  const type=state.type,q=state.query.toLowerCase().trim();
  let items,total;
  if(type==='local'){
   const all=(await loadLocal()).filter(x=>!q||(x.name+' '+x.category+' '+x.src).toLowerCase().includes(q));
   total=all.length;items=all.slice(state.page*pageSize,(state.page+1)*pageSize);
  }else{
   const result=await rowsPrivate(type,state.page,q);
   total=result.total;items=result.rows;
  }
  if(!active(seq,userId))return;
  gallery.innerHTML=items.map(x=>tile(x,type)).join('')||'<p>Nessuna immagine per questo filtro.</p>';
  if(type==='integral')void window.SAFETY_ADMIN_IMAGE_PLACEMENT_V25?.renderFor?.(gallery,items);
  void window.SAFETY_IMAGE_SUGGESTIONS_V26?.decorate?.(gallery,items,type);
  const pages=Math.max(1,Math.ceil(total/pageSize));
  stat.textContent=total+' immagini/riferimenti · pagina '+(state.page+1)+' di '+pages;
  host().querySelector('[data-st-image-prev]').disabled=state.page===0;
  host().querySelector('[data-st-image-next]').disabled=state.page+1>=pages;
 }catch(error){
  if(active(seq,userId)){gallery.innerHTML='<p class="admin-error">'+esc(error?.message||error)+'</p>';stat.textContent='Catalogo non disponibile';}
 }
}
async function render(){
 ensureNav();const userId=actor(),seq=++state.seq;
 if(!host()||!userId||!db())return;
 root()?.querySelectorAll('.admin-nav nav button').forEach(b=>b.classList.remove('active'));
 root()?.querySelector('[data-image-library-v25]')?.classList.add('active');
 document.getElementById('adminTitle').textContent='Gestione immagini';
 document.getElementById('adminSubtitle').textContent='Illustrazioni disponibili, immagini caricate e archivio privato';
 host().innerHTML='<div class="admin-loading">Verifica accesso e inventario…</div>';
 try{
  if(!await verified())throw Error('Accesso riservato agli amministratori.');
  const [files,counts]=await Promise.all([loadLocal(),loadStats()]);
  if(!active(seq,userId))return;
  state.stats=counts;
  host().innerHTML='<section class="admin-card"><h2>Inventario immagini</h2><p>Le illustrazioni SVG/PNG distribuite con l’app sono in sola lettura. Il catalogo distingue verifiche visive individuali, osservazioni per gruppi e screening preliminare. Le proposte testuali sono sempre etichettate; una figura osservata individualmente può essere collocata automaticamente solo dopo la doppia approvazione dell’amministratore. Nessuna osservazione certifica automaticamente correttezza tecnica o diritti. Le tavole PDF private richiedono una verifica tecnico-didattica e una verifica separata dei diritti. Puoi registrare le revisioni per singola figura, con motivazione e tracciabilità. Lo stato non determina da solo la presenza nelle slide: conta anche l’abbinamento al corso, e le immagini private non sono pubblicate ai corsisti.</p>'+
   '<div class="admin-stats"><article class="admin-stat"><strong>'+files.length+'</strong><span>Immagini locali disponibili</span></article><article class="admin-stat"><strong>'+esc(counts[0])+'</strong><span>Figure PDF caricate</span></article><article class="admin-stat"><strong>'+esc(counts[1])+'</strong><span>Riferimenti PDF completi</span></article><article class="admin-stat"><strong>'+esc(counts[2])+'</strong><span>Estratti PDF in revisione</span></article></div>'+
   '<div class="st-image-audit-summary"><strong>Analisi di pertinenza delle tavole PDF</strong><p>'+esc(counts[3])+' schede visive individuali · '+esc(counts[4])+' valutazioni per gruppi · '+esc(counts[5])+' screening preliminari · '+esc(counts[6])+' coppie confrontate.</p><small>Livelli di analisi distinti. Nessuno sostituisce la revisione tecnica o la verifica dei diritti.</small></div>'+
   '<div class="st-image-actions"><button type="button" data-st-image-integral>Gestisci archivio PDF · importa / elimina</button><button type="button" data-st-image-sources>Gestisci estratti PDF</button><button type="button" data-st-image-refresh>Aggiorna inventario</button></div></section>'+
   '<section class="admin-card"><h2>Esplora immagini</h2><div class="st-image-controls"><label>Archivio <select id="stImageType"><option value="local">Illustrazioni locali</option><option value="integral">Tavole PDF complete importate</option><option value="source">Estratti PDF in revisione</option></select></label>'+
   '<label>Esaminate / associazioni <select id="stImageStatus"><option value="all">Tutti gli stati</option><option value="examined">Esaminate (visivamente)</option><option value="individual">Esaminate singolarmente</option><option value="group">Esaminate per gruppi</option><option value="screening">Solo screening preliminare</option><option value="to_associate">Da associare (proposte)</option><option value="associated">Associate (attive e approvate)</option><option value="approved">Approvate per uso interno</option><option value="review_pending">Revisione da completare</option><option value="excluded">Escluse dalle presentazioni</option><option value="rejected">Respinte</option></select></label>'+
   '<label>Corso <select id="stImageCourse"><option value="">Tutti i corsi</option></select></label>'+
   '<label>Modulo <select id="stImageModule"><option value="">Tutti i moduli</option></select></label>'+
   '<label>Cerca per tema <input type="search" id="stImageSearch" placeholder="Es. carrelli, DPI, portata"></label></div><p class="st-image-filter-hint" id="stImageFilterHint"></p>'+
   '<div class="st-image-grid" id="stImageGallery"></div><div class="st-image-pagination"><button type="button" data-st-image-prev>← Precedenti</button><span id="stImagePagination" role="status"></span><button type="button" data-st-image-next>Successive →</button></div></section>';
  host().querySelector('#stImageType').value=state.type;
  host().querySelector('#stImageSearch').value=state.query;
  host().querySelector('#stImageStatus').value=state.status;
  syncFilterControls();
  void fillCourseOptions().catch(error=>{const hint=host()?.querySelector('#stImageFilterHint');if(hint)hint.textContent='Elenco corsi non disponibile: '+(error?.message||error);});
  const content=host();
  content.querySelector('#stImageGallery').addEventListener('submit',e=>void saveReview(e));
  content.querySelector('#stImageType').onchange=e=>{state.type=e.target.value;state.page=0;syncFilterControls();void paint();};
  content.querySelector('#stImageStatus').onchange=e=>{state.status=e.target.value;state.page=0;void paint();};
  content.querySelector('#stImageCourse').onchange=e=>{state.course=e.target.value;state.module='';state.page=0;if(state.filterCatalog)fillModuleOptions(state.filterCatalog);void paint();};
  content.querySelector('#stImageModule').onchange=e=>{state.module=e.target.value;state.page=0;void paint();};
  content.querySelector('#stImageSearch').oninput=e=>{state.query=e.target.value;state.page=0;void paint();};
  content.querySelector('[data-st-image-prev]').onclick=()=>{state.page=Math.max(0,state.page-1);void paint();};
  content.querySelector('[data-st-image-next]').onclick=()=>{state.page++;void paint();};
  content.querySelector('[data-st-image-integral]').onclick=()=>window.SAFETY_INTEGRAL_PDF_V24?.show?.();
  content.querySelector('[data-st-image-sources]').onclick=()=>window.SAFETY_SOURCE_VISUALS_V23?.open?.();
  content.querySelector('[data-st-image-refresh]').onclick=()=>{state.files=null;void render();};
  void paint();
 }catch(error){if(active(seq,userId))host().innerHTML='<p class="admin-error">'+esc(error?.message||error)+'</p>';}
}
function boot(){
 ensureNav();[200,650,1500].forEach(ms=>setTimeout(ensureNav,ms));
 document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,80));
 document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,80));
 document.addEventListener('safety:auth-changed',()=>{state.seq++;state.files=null;state.stats=null;state.filterCatalog=null;});
}
window.SAFETY_ADMIN_IMAGE_LIBRARY_V25={render,ensureNav,category};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
