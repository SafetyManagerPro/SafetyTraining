/* CNA SafetyTraining · complete PDF visual library v24.
   14 source PDFs · private Supabase storage · platform-admin only.
   Source rights / medical and technical compliance remain to be reviewed.
   All links are short-lived signed URLs, NOT public static assets. */
(()=>{'use strict';
const BUCKET='training-source-figures',ASSETS='training_integral_pdf_assets_v24',REFS='training_integral_pdf_refs_v24',DELETED='training_integral_pdf_deleted_v24';
const c=()=>window.SAFETY_CLOUD?.state?.client;
const admin=()=>!!(window.SAFETY_CLOUD?.state?.user?.id&&window.SAFETY_ADMIN_CAPABILITIES_STATE?.platform_admin);
const frozen=x=>!!window.SAFETY_GRAPHIC_PACK_01?.isFrozen?.(x);
const safeId=/^img-[0-9a-f]{20}$/,safeFile=/^assets\/pdf-figures\/img-[0-9a-f]{20}\.webp$/;
const cache=new Map(),trusted=new Set(),loading=new Map(),selected=new Set();
let catalogBusy=false,currentCatalogPage=0;
const text=s=>String(s??'').slice(0,600);
const esc=s=>text(s).replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
// V25: stop-word-filtered, title-only evidence. Summary is frequently generic DB boilerplate.
const textNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const stop=new Set('corso corsi lavoro lavori lavoratori lavoratore sicurezza generale generali specifici attrezzature macchine macchina dispositivi dispositivo formazione addetti utilizzo parte capitolo documento documenti pagina pagine figure figura tavola illustrata completa scannerizzata normativa decreto legislativo testo relatore rischio rischi pericoli prevenzione procedure procedura aggiornamento gruppo gruppi primo secondo tecnico teorico pratica pratico dott ing giovanni colafemmina delle della degli dalle nelle nella sullo sul della con senza sono degli sua loro delle degli dell anno 2008 2011 2012 2016 2020 2025'.split(' '));
const vocab=s=>new Set((textNorm(s).match(/[a-z0-9]+/g)||[]).filter(w=>w.length>=5&&!stop.has(w)));
const recurringHeader=/tavola illustrata completa|pagina scannerizzata|dott\.?\s*ing\.?|le imbracature mettiamoci la testa|d\.?\s*lvo\s*81|d\.?\s*lgs\.?\s*81|^primo soccorso$|^formazione$|^componenti$|piattaforme di lavoro mobili elevabili con e senza stabilizzatori/i;
function score(topic,ref){
 const t=String(ref.topic||'').trim(),doc=String(ref.source_document||'').replace(/\.pdf$/i,'').trim();
 if(!t||textNorm(t)===textNorm(doc)||recurringHeader.test(t))return 0;
 const source=vocab(t),heading=vocab((topic?.title||'')+' '+(topic?.slide_title||''));
 let matching=0;for(const w of source)if(heading.has(w))matching++;
 return matching*5;
}
// Photo/manual pages visually sampled from the original forklift PDF. Indexes never
// determine placement; only these topic-specific illustrations are eligible.
const forkliftPageTopics=[
 [/tipolog|principali rischi/i,[27,28,29,30,31,32,33,34,37,38,44]],
 [/fisica|baricentr|stabilit/i,[49,50,51,54,55,57]],
 [/component|montant|organi di presa/i,[35,36,39,40,41,52,53,74]],
 [/comandi|freni|dispositivi di sicurezza/i,[22,23,60]],
 [/portata|targhett|diagramm|equilibrio/i,[49,50,54,55,57,66]],
 [/circolaz|utilizzo in sicurezza/i,[13,19,20,23,58,62,80,81,83]],
 [/controll|manutenz|procedure operative/i,[66,70,74,75,76,86]]
];
function placementIndex(course,ref,topics,topicCounts=new Map()){
 if(!Array.isArray(topics)||!topics.length||!Array.isArray(ref?.candidate_course_keys)||!ref.candidate_course_keys.includes(keyOf(course)))return -1;
 const name=String(ref.source_document||'');
 if(name==='Manuale-carrelli elevatori.pdf'){
  const page=Number(ref.source_page);
  for(const [pattern,pages]of forkliftPageTopics){
   if(!pages.includes(page))continue;
   const index=topics.findIndex(t=>pattern.test(String(t.title||'')));
   if(index>=0)return index;
  }
  return -1; // e.g. manual title pages, laws, unillustrated passages
 }
 const header=String(ref.topic||'').trim().toLowerCase();
 if(!header||recurringHeader.test(header)||(topicCounts.get(header)||0)>=4)return -1;
 let best=0,winner=-1,ambiguous=false;
 topics.forEach((t,i)=>{
  const rating=score(t,ref);
  if(rating>best){best=rating;winner=i;ambiguous=false;}
  else if(rating===best&&rating>0)ambiguous=true;
 });
 return best>=5&&!ambiguous?winner:-1;
}
function keyOf(course){return String(course?.stable_key||course?.id||'');}
function relevantKeys(course){
 // Do not leak images from general, equipment or employer courses into others.
 // Only the source manifest's explicit candidate course keys are evidence.
 const key=keyOf(course);return key?[key]:[];
}
function hasAccess(course){return admin()&&!!course?.presentation_generated_from_db&&!frozen(course);}
function invalidate(){cache.clear();}
async function paginate(query,size=600){
 let out=[];for(let from=0;from<10000;from+=size){
  const {data,error}=await query.range(from,from+size-1);
  if(error)throw error;out.push(...(data||[]));if((data||[]).length<size)break;
 }return out;
}
async function prepareCourse(course,{client}={}){
 if(!hasAccess(course))return[];
 const db=client||c();if(!db)return[];
 const name=keyOf(course),hit=cache.get(name);
 if(hit&&Date.now()<hit.expires)return hit.visuals;
 if(loading.has(name))return loading.get(name);
 const operation=(async()=>{
  const rows=[];const seen=new Set();
  // Manual assignments apply only to the currently presented, published version.
  // They cannot make an image public or bypass the prerequisite review.
  const {data:placements,error:placementError}=await db.from('training_integral_pdf_placements_v25')
   .select('ref_id,module_key,unit_position,version_number')
   .eq('course_key',name).eq('version_number',Number(course.db_version)||-1);
  if(placementError)throw placementError;
  const manual=placements||[];
  for(const k of relevantKeys(course)){
   const found=await paginate(db.from(REFS).select('id,asset_id,topic,source_document,source_page,category,candidate_course_keys,asset:training_integral_pdf_assets_v24!inner(storage_path)').gte('id','pdf-50000').contains('candidate_course_keys',[k]).order('id'),650);
   for(const r of found)if(!seen.has(r.id)){rows.push(r);seen.add(r.id);}
  }
  const manualIds=[...new Set(manual.map(x=>x.ref_id))];
  for(let i=0;i<manualIds.length;i+=100){
   const {data:extra,error:extraError}=await db.from(REFS)
    .select('id,asset_id,topic,source_document,source_page,category,candidate_course_keys,asset:training_integral_pdf_assets_v24!inner(storage_path)')
    .in('id',manualIds.slice(i,i+100));
   if(extraError)throw extraError;
   for(const r of extra||[])if(!seen.has(r.id)){rows.push(r);seen.add(r.id);}
  }
  // Keep the most specific automatic candidate for an asset. A manual
  // assignment always takes priority over automatic matching for that asset.
  const byId=new Map(rows.map(r=>[r.id,r]));
  const manuallyUsedAssets=new Set(manualIds.map(id=>byId.get(id)?.asset_id).filter(Boolean));
  const unique=new Map();
  for(const r of rows){
   if(manuallyUsedAssets.has(r.asset_id))continue;
   const curr=unique.get(r.asset_id);
   if(!curr||String(r.topic||'').length>String(curr.topic||'').length)unique.set(r.asset_id,r);
  }
  const list=[...unique.values()];
  const topics=Array.isArray(course.topics)?course.topics:[];
  const byTopic=new Map(topics.map(t=>[String(t.id),[]]));
  const topicCounts=new Map();
  for(const r of list){const key=String(r.topic||'').trim().toLowerCase();topicCounts.set(key,(topicCounts.get(key)||0)+1);}
  // Match the page to a lesson before requesting a private signed URL.
  // Generic and unassigned pages cannot stall the opening of presentations.
  const automatic=list.map(r=>({ref:r,index:placementIndex(course,r,topics,topicCounts),manual:false}))
    .filter(x=>x.index>=0&&topics[x.index]&&x.ref.asset?.storage_path);
  const explicit=[];
  for(const mapping of manual){
   const mod=(course.modules||[]).find(m=>String(m.id)===String(mapping.module_key));
   const topicId=mod?.topic_ids?.[Number(mapping.unit_position)-1];
   const index=topics.findIndex(t=>String(t.id)===String(topicId));
   const ref=byId.get(mapping.ref_id);
   if(index>=0&&ref?.asset?.storage_path)explicit.push({ref,index,manual:true});
  }
  const matching=[...automatic,...explicit];
  const distinct=new Map(matching.map(x=>[x.ref.id,x]));
  const reviewable=[...distinct.values()];
  // A rejected technical or rights review must immediately prevent projection,
  // while unreviewed figures may still be inspected in the private admin deck.
  const reviews=new Map();
  for(let i=0;i<reviewable.length;i+=100){
    const slice=reviewable.slice(i,i+100);
    const {data:decisions,error:reviewError}=await db.from('training_integral_pdf_reviews_v25')
      .select('ref_id,technical_status,rights_status').in('ref_id',slice.map(x=>x.ref.id));
    if(reviewError)throw reviewError;
    for(const x of decisions||[])reviews.set(x.ref_id,x);
  }
  const eligible=matching.filter(x=>{
    const decision=reviews.get(x.ref.id);
    if(x.manual)return decision?.technical_status==='approved'&&decision?.rights_status==='cleared_internal';
    return decision?.technical_status!=='rejected'&&decision?.rights_status!=='rejected';
  });
  const paths=[...new Set(eligible.map(x=>x.ref.asset.storage_path))];
  const urls=new Map();
  for(let start=0;start<paths.length;start+=50){
   const batch=paths.slice(start,start+50),res=await db.storage.from(BUCKET).createSignedUrls(batch,1200);
   if(res.error)throw res.error;
   (res.data||[]).forEach((u,i)=>{if(u.signedUrl&&!u.error){urls.set(batch[i],u.signedUrl);trusted.add(u.signedUrl);}});
  }
  for(const {ref:r,index:idx} of eligible){
   if(!urls.has(r.asset.storage_path))continue;
   const t=topics[idx];
   byTopic.get(String(t.id)).push({
     src:urls.get(r.asset.storage_path),
     caption:text(((reviews.get(r.id)?.technical_status==='approved'&&reviews.get(r.id)?.rights_status==='cleared_internal')?'REVISIONATA PER USO INTERNO · ':'FONTE PDF DA VERIFICARE · ')+r.category+' · '+r.source_document+' · pag. '+r.source_page),
     media_origin:'private_pdf_v24',source_id:r.id,topic_id:t.id
   });
  }
  const visuals=[...byTopic.values()].flat();
  cache.set(name,{visuals,byTopic,expires:Date.now()+14*60*1000});
  return visuals;
 })().finally(()=>loading.delete(name));
 loading.set(name,operation);return operation;
}
function pick(course,topic){
 if(!hasAccess(course)||!topic)return[];
 const e=cache.get(keyOf(course));if(!e||e.expires<Date.now())return[];
 return e.byTopic?.get(String(topic.id))||[];
}
function isTrustedSrc(url){return typeof url==='string'&&trusted.has(url)&&url.startsWith('https://');}
function note(s,bad=false){const el=document.getElementById('integralPdfStatus');if(el){el.textContent=s;el.style.color=bad?'#b13d2d':'';}}
async function existingIds(db,table,ids){
 const done=new Set();
 for(let i=0;i<ids.length;i+=100){const {data,error}=await db.from(table).select('id').in('id',ids.slice(i,i+100));if(error)throw error;for(const row of data||[])done.add(row.id);}
 return done;
}
async function importZip(zip){
 if(!admin())throw Error('Accedi come platform-admin CNA per importare.');
 const db=c();if(!db)throw Error('Connessione Supabase assente.');
 if(!window.JSZip)throw Error('Lettore ZIP non disponibile.');
 if(!zip||zip.size>110*1024*1024)throw Error('Seleziona lo ZIP completo o uno dei dieci ZIP piccoli (max 110 MB per file).');
 note('Lettura ZIP e controllo indice...');
 const archive=await JSZip.loadAsync(zip);
 const source=archive.file('manifest.json');if(!source)throw Error('Indice manifest.json non trovato.');
 const manifest=JSON.parse(await source.async('string'));
 // Accept the original complete ZIP or a set of ten small, independently resumable parts.
 const coherent=manifest.archive_type==='safetytraining_coherent_v2';
 const split=manifest.archive_type==='safetytraining_partial_v1'||coherent;
 if(coherent&&(!Number.isInteger(manifest.total_assets)||manifest.total_assets<300||manifest.total_assets>3000||
 !Number.isInteger(manifest.total_figures)||manifest.total_figures<manifest.total_assets||manifest.total_figures>5000||
 !Number.isInteger(manifest.part_count)||manifest.part_count<1||manifest.part_count>40))throw Error('Indice figure complete non valido.');
 if(!Array.isArray(manifest.assets)||!Array.isArray(manifest.figures)||(!split&&(manifest.assets.length<2000||manifest.figures.length<4000)))throw Error('Archivio incompleto o formato errato.');
 if(split&&((!coherent&&(manifest.total_assets!==2634||manifest.total_figures!==4783||manifest.part_count!==10))||!Number.isInteger(manifest.part_index)||manifest.part_index<1||manifest.part_index>manifest.part_count||!manifest.assets.length||!manifest.figures.length))throw Error('Pacchetto suddiviso non valido: scarica le dieci parti ufficiali.');
 if(manifest.assets.length>12000||manifest.figures.length>40000)throw Error('Manifest superiore ai limiti ammessi.');
 const ids=manifest.assets.map(a=>a.filename?.replace(/\.webp$/,''));
 if(ids.some(id=>!safeId.test(String(id))))throw Error('ID immagine fuori formato.');
 if(new Set(ids).size!==ids.length)throw Error('Immagini duplicate nel manifesto.');
 if(split){
  const assigned=new Set(ids);
  if(manifest.figures.some(f=>!assigned.has(f.asset_id)))throw Error('Un riferimento PDF appartiene a una parte ZIP diversa.');
  const zipName='PARTE_'+String(manifest.part_index).padStart(2,'0')+'_di_'+String(manifest.part_count).padStart(2,'0');
  note('Aperta '+zipName+': '+manifest.assets.length+' immagini, '+manifest.figures.length+' riferimenti.');
 }
 const stored=await existingIds(db,ASSETS,ids);
 const discarded=await existingIds(db,DELETED,ids); // Previously rejected logos/irrelevant figures never reappear on reimport.
 let done=0,added=0;
 for(let i=0;i<manifest.assets.length;i+=5){
  if(!admin())throw Error('Sessione amministrativa non più valida.');
  const chunk=manifest.assets.slice(i,i+5).filter(a=>!stored.has(a.filename.replace(/\.webp$/,''))&&!discarded.has(a.filename.replace(/\.webp$/,'')));
  const uploaded=await Promise.all(chunk.map(async a=>{
   const id=a.filename.replace(/\.webp$/,'');
   const src='assets/pdf-figures/'+a.filename;
   if(!safeId.test(id)||!safeFile.test(src)||!archive.file(src))throw Error('File immagine non valido: '+src);
   const bytes=await archive.file(src).async('uint8array');
   if(bytes.length<20||bytes.length>5242880||bytes[0]!==0x52||bytes[1]!==0x49||bytes[2]!==0x46||bytes[3]!==0x46||bytes[8]!==0x57||bytes[9]!==0x45||bytes[10]!==0x42||bytes[11]!==0x50)throw Error('WebP non valido: '+id);
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
   if(sha!==a.sha256)throw Error('SHA-256 differente: '+id);
   const path='integral/v1/'+id+'.webp';
   const put=await db.storage.from(BUCKET).upload(path,new Blob([bytes],{type:'image/webp'}),{upsert:true,contentType:'image/webp'});
   if(put.error)throw Error('Upload '+id+': '+put.error.message);
   return {id,storage_path:path,sha256:sha,bytes:bytes.length,width:a.width,height:a.height,rights_status:'review_required'};
  }));
  if(uploaded.length){const row=await db.from(ASSETS).upsert(uploaded,{onConflict:'id'});if(row.error)throw Error('Indice immagini: '+row.error.message);added+=uploaded.length;}
  done+=manifest.assets.slice(i,i+5).length;
  if(i%25===0)note('Immagini verificate '+done+'/'+manifest.assets.length+' · nuove '+added+' (puoi riprendere l’importazione in caso di interruzione)');
 }
 note('Immagini presenti. Catalogazione di '+manifest.figures.length+' riferimenti...');
 const refsDone=await existingIds(db,REFS,manifest.figures.map(f=>f.id));
 let indexed=0;
 for(let i=0;i<manifest.figures.length;i+=100){
  const rows=manifest.figures.slice(i,i+100).filter(f=>!refsDone.has(f.id)&&!discarded.has(f.asset_id)).map(f=>({
    id:f.id,asset_id:f.asset_id,source_document:text(f.source_document).slice(0,300),
    source_page:f.source_page,category:text(f.category).slice(0,120),topic:text(f.topic),
    source_kind:f.kind||'embedded',
    candidate_course_keys:Array.isArray(f.candidate_course_keys)?f.candidate_course_keys.filter(k=>typeof k==='string').slice(0,12):[],
    citation:text(f.citation).slice(0,600),
    technical_review_required:!!f.technical_review_required,rights_status:'review_required'
  }));
  if(rows.length){const q=await db.from(REFS).upsert(rows,{onConflict:'id'});if(q.error)throw Error('Catalogazione pagine: '+q.error.message);indexed+=rows.length;}
  if(i%400===0)note('Pagine catalogate '+Math.min(i+100,manifest.figures.length)+'/'+manifest.figures.length);
 }
 cache.clear();trusted.clear();
 note('Archivio importato: '+manifest.assets.length+' figure uniche, '+manifest.figures.length+' riferimenti, '+added+' nuovi asset e '+indexed+' nuovi riferimenti. Solo consultazione privata CNA.');
 return {assets:manifest.assets.length,refs:manifest.figures.length,added,indexed};
}

function refreshBulkControls(){
 const status=document.getElementById('integralPdfSelectionCount'),remove=document.getElementById('integralPdfDeleteSelected'),
       clear=document.getElementById('integralPdfClearSelection'),all=document.getElementById('integralPdfSelectPage');
 if(status)status.textContent=selected.size+' immagini selezionate · massimo 100 per eliminazione';
 if(remove){remove.disabled=!selected.size||catalogBusy;remove.textContent='Elimina '+selected.size+' immagini selezionate';}
 if(clear)clear.disabled=!selected.size||catalogBusy;
 if(all)all.disabled=catalogBusy;
}
function setCatalogBusy(value){
 catalogBusy=!!value;
 for(const key of ['integralPdfImport','integralPdfZip','integralPdfGeneration','integralPdfCategory','integralPdfSearch','integralPdfPrev','integralPdfNext']){
  const el=document.getElementById(key);if(el)el.disabled=catalogBusy;
 }
 const container=document.getElementById('integralPdfCatalog');
 if(container)container.querySelectorAll('input[type=checkbox]').forEach(el=>{el.disabled=catalogBusy;});
 refreshBulkControls();
}
async function cleanupDeletedStorage(){
 if(!admin())throw Error('Accesso amministrativo richiesto.');
 const db=c();
 const {data,error}=await db.from(DELETED).select('id,storage_path').is('storage_cleared_at',null).order('deleted_at').limit(100);
 if(error)throw error;
 if(!(data||[]).length)return {cleaned:0,pending:0};
 const paths=data.map(x=>x.storage_path);
 const remove=await db.storage.from(BUCKET).remove(paths);
 if(remove.error)throw Error('Cancellazione record completata; pulizia file non riuscita: '+remove.error.message);
 const done=await db.from(DELETED).update({storage_cleared_at:new Date().toISOString()}).in('id',data.map(x=>x.id));
 if(done.error)throw Error('File eliminati ma conferma pulizia non salvata: '+done.error.message);
 return {cleaned:data.length,pending:data.length===100?1:0};
}
async function removeSelection(){
 if(catalogBusy||!selected.size)return;
 if(!admin())return note('Eliminazione riservata al platform-admin.',true);
 const ids=[...selected];
 if(ids.length>100)return note('Elimina al massimo 100 immagini alla volta.',true);
 const db=c();
 const related=await db.from(REFS).select('id',{count:'exact',head:true}).in('asset_id',ids);
 if(related.error)return note('Non è stato possibile calcolare i riferimenti: '+related.error.message,true);
 const count=related.count||0;
 if(!window.confirm('Eliminare definitivamente '+ids.length+' immagini importate e '+count+' riferimenti a pagine/corsi? Le figure scompariranno dalle slide e dalle stampe al successivo caricamento. Questa azione non è reversibile. Confermi?'))return;
 setCatalogBusy(true);
 try{
  const res=await db.rpc('training_delete_integral_pdf_assets_v24',{p_ids:ids});
  if(res.error)throw new Error('Eliminazione database: '+res.error.message);
  const rows=res.data||[],removedRefs=rows.reduce((s,r)=>s+Number(r.removed_references||0),0);
  // Do not retain short-lived URLs or old course mappings after removal.
  selected.clear();cache.clear();trusted.clear();loading.clear();
  let cleanup='';
  try{
   const result=await cleanupDeletedStorage();
   cleanup=result.pending?' Alcuni file restano da ripulire: premi Riprova pulizia file.':' File eliminati anche dallo Storage.';
  }catch(e){cleanup=' I riferimenti sono stati rimossi, ma occorre completare la pulizia dei file: '+e.message;}
  await renderCatalog(currentCatalogPage);
  note('Eliminate '+rows.length+' immagini e '+removedRefs+' riferimenti dal catalogo.'+cleanup);
 }catch(e){note('Eliminazione non completata: '+e.message,true);}
 finally{setCatalogBusy(false);}
}
async function renderCatalog(page=0){
 currentCatalogPage=Math.max(0,page);
 const container=document.getElementById('integralPdfCatalog'),status=document.getElementById('integralPdfCatalogStatus');
 if(!container||!status||!admin())return;
 const db=c(),category=document.getElementById('integralPdfCategory')?.value||'';
 const queryString=(document.getElementById('integralPdfSearch')?.value||'').trim().slice(0,90).replace(/[%_,()]/g,'');
 const generation=document.getElementById('integralPdfGeneration')?.value||'complete';
 let req=db.from(REFS).select('id,asset_id,source_document,source_page,category,topic,candidate_course_keys,asset:training_integral_pdf_assets_v24!inner(storage_path)',{count:'exact'}).order('id');
 if(generation==='complete')req=req.gte('id','pdf-50000');
 if(generation==='legacy')req=req.lt('id','pdf-50000');
 if(category)req=req.eq('category',category);
 if(queryString)req=req.ilike('topic','%'+queryString+'%');
 const {data,error,count}=await req.range(currentCatalogPage*24,currentCatalogPage*24+23);
 if(error){status.textContent='Catalogo non disponibile: '+error.message;container.innerHTML='';return;}
 if(!(data||[]).length&&currentCatalogPage>0)return renderCatalog(currentCatalogPage-1);
 const list=data||[],signed=list.length?await db.storage.from(BUCKET).createSignedUrls(list.map(v=>v.asset?.storage_path).filter(Boolean),1200):{data:[]};
 if(signed.error){status.textContent='Anteprime non disponibili: '+signed.error.message;container.innerHTML='';return;}
 const urls=signed.data||[];
 status.textContent=(count||0)+' riferimenti nel catalogo · pagina '+(currentCatalogPage+1)+' · seleziona le immagini che non servono';
 let pos=0;
 container.innerHTML=list.map(r=>{
  const u=urls[pos++],src=u&&!u.error&&u.signedUrl?u.signedUrl:'';
  if(src)trusted.add(src);
  const checked=selected.has(r.asset_id),disabled=catalogBusy||(!checked&&selected.size>=100);
  return '<article class="st-integral-entry"><label class="st-integral-select"><input type="checkbox" data-asset-id="'+esc(r.asset_id)+'" '+(checked?'checked ':'')+(disabled?'disabled ':'')+'><strong>Seleziona per eliminare</strong></label>'+
   (src?'<img loading="lazy" src="'+esc(src)+'" alt="Figura estratta da PDF">':'')+
   '<small>ID immagine: '+esc(r.asset_id)+'</small><strong>'+esc(r.category)+'</strong><small>'+esc(r.source_document)+' · pag. '+r.source_page+'</small>'+
   '<p>'+esc(r.topic||'Immagine senza testo riconoscibile')+'</p><small>Corsi candidati: '+esc((r.candidate_course_keys||[]).join(' · '))+'</small></article>';
 }).join('')||'<p>Archivio non ancora importato o nessun risultato. Seleziona gli ZIP integrali qui sopra.</p>';
 container.onchange=e=>{
  const input=e.target;
  if(!input.matches?.('input[data-asset-id]')||catalogBusy)return;
  const item=input.dataset.assetId;
  if(!safeId.test(item))return;
  if(input.checked){if(selected.size>=100){input.checked=false;return note('Massimo 100 immagini per operazione.',true);}selected.add(item);}
  else selected.delete(item);
  refreshBulkControls();
 };
 const prev=document.getElementById('integralPdfPrev'),next=document.getElementById('integralPdfNext');
 if(prev){prev.disabled=catalogBusy||currentCatalogPage===0;prev.onclick=()=>void renderCatalog(Math.max(0,currentCatalogPage-1));}
 if(next){next.disabled=catalogBusy||(currentCatalogPage+1)*24>=(count||0);next.onclick=()=>void renderCatalog(currentCatalogPage+1);}
 refreshBulkControls();
}
function show(){
 if(!admin()){alert('L’archivio integrale è riservato alla gestione CNA.');return;}
 document.getElementById('integralPdfOverlay')?.remove();
 selected.clear();currentCatalogPage=0;
 const el=document.createElement('div');el.className='admin-modal-overlay';el.id='integralPdfOverlay';
 el.innerHTML='<section class="admin-modal wide st-integral-modal" role="dialog" aria-modal="true" aria-label="Archivio integrale immagini PDF">'+
 '<header><div><div class="admin-kicker">CNA AVELLINO · FONTI PDF</div><h2>Archivio integrale immagini</h2></div><button type="button" id="integralPdfClose" class="admin-modal-close">×</button></header>'+
 '<div class="admin-modal-body"><p>14 PDF esaminati · 856 tavole complete catalogate. Solo gli abbinamenti con riscontro preciso compaiono nelle slide e nella stampa; le altre tavole restano in revisione. Biblioteca privata riservata agli amministratori della piattaforma.</p>'+
 '<p>Scarica e importa i <strong>9 nuovi ZIP FIGURE COMPLETE (5–7 MB)</strong>, insieme o singolarmente, senza decomprimerli. Il caricamento è riprendibile e le figure restano riservate alla docenza CNA; i corsi sospesi sono esclusi.</p>'+
 '<p>Il materiale proviene da fonti esterne: mantieni citazione, utilizzo didattico interno e revisione tecnico-normativa. L’importazione non costituisce autorizzazione generale di riutilizzo.</p>'+
 '<input id="integralPdfZip" type="file" multiple accept=".zip,application/zip"><label class="st-integral-confirm"><input type="checkbox" id="integralPdfPrivateCheck"> Confermo l’importazione nell’archivio privato per revisione e docenza CNA</label>'+
 '<button type="button" class="admin-primary" id="integralPdfImport">Importa / riprendi archivio integrale</button><p id="integralPdfStatus" role="status">Pronto.</p>'+'<h3>Catalogo privato immagini importate</h3><label>Versione delle immagini <select id="integralPdfGeneration"><option value="complete">Nuove tavole complete</option><option value="legacy">Vecchi frammenti da scartare</option><option value="all">Tutte le immagini</option></select></label><p>Seleziona le figure inutili o non pertinenti, anche su pagine diverse. Eliminandone una vengono tolte tutte le sue occorrenze nelle lezioni, nelle slide e nella stampa. Lo stesso ZIP non la reimporterà.</p><div class="st-integral-bulk"><span id="integralPdfSelectionCount" role="status">0 immagini selezionate</span><button type="button" id="integralPdfSelectPage">Seleziona pagina</button><button type="button" id="integralPdfClearSelection" disabled>Deseleziona</button><button type="button" id="integralPdfDeleteSelected" class="st-integral-danger" disabled>Elimina selezionate</button><button type="button" id="integralPdfRetryCleanup">Riprova pulizia file</button></div><label>Categoria <select id="integralPdfCategory"><option value="">Tutte le categorie</option>'+['DPI III categoria','DPI e protezioni','Carrelli elevatori','PLE','Gru su autocarro','Macchine movimento terra','Antincendio','Primo soccorso','Rischio meccanico','Attrezzature','Lavori in quota'].map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')+'</select></label>'+'<label>Argomento <input id="integralPdfSearch" type="search" placeholder="Es. stabilità, DPI, evacuazione"></label><p id="integralPdfCatalogStatus" role="status">Catalogo in caricamento...</p><div id="integralPdfCatalog" class="st-integral-gallery"></div>'+'<div class="st-integral-pagination"><button type="button" id="integralPdfPrev">← Precedenti</button><button type="button" id="integralPdfNext">Successive →</button></div></div></section>';
 document.body.appendChild(el);
 el.querySelector('#integralPdfClose').onclick=()=>el.remove();el.addEventListener('click',e=>{if(e.target===el)el.remove();});
 el.querySelector('#integralPdfSelectPage').onclick=()=>{
  for(const input of el.querySelectorAll('#integralPdfCatalog input[data-asset-id]')){
   if(selected.size>=100)break;
   selected.add(input.dataset.assetId);input.checked=true;
  }
  refreshBulkControls();
 };
 el.querySelector('#integralPdfClearSelection').onclick=()=>{selected.clear();void renderCatalog(currentCatalogPage);};
 el.querySelector('#integralPdfDeleteSelected').onclick=()=>void removeSelection();
 el.querySelector('#integralPdfRetryCleanup').onclick=async()=>{
  if(catalogBusy)return;
  setCatalogBusy(true);
  try{let cleaned=0,pending=0;for(let part=0;part<30;part++){const result=await cleanupDeletedStorage();cleaned+=result.cleaned;pending=result.pending;note('Pulizia Storage in corso: '+cleaned+' file rimossi.');if(!pending||!result.cleaned)break;}note('Pulizia Storage completata: '+cleaned+' file.'+(pending?' Restano file da ripulire, riprova.':''));}
  catch(e){note('Pulizia non completata: '+e.message,true);}
  finally{setCatalogBusy(false);}
 };
 el.querySelector('#integralPdfGeneration').onchange=()=>{selected.clear();void renderCatalog(0);};
 el.querySelector('#integralPdfCategory').onchange=()=>void renderCatalog(0);
 el.querySelector('#integralPdfSearch').onchange=()=>void renderCatalog(0);
 void renderCatalog(0);
 el.querySelector('#integralPdfImport').onclick=async()=>{
  const button=el.querySelector('#integralPdfImport'),files=[...(el.querySelector('#integralPdfZip').files||[])].sort((a,b)=>a.name.localeCompare(b.name));
  if(!el.querySelector('#integralPdfPrivateCheck').checked)return note('Conferma uso privato e revisione.',true);
  if(!files.length)return note('Seleziona uno ZIP completo oppure le 10 parti. Puoi selezionarle tutte insieme.',true);
  setCatalogBusy(true);
  let completed=0,figures=0,references=0;
  try{
   for(const file of files){
    note('Importazione '+(completed+1)+'/'+files.length+' · '+file.name);
    const outcome=await importZip(file);
    completed++;figures+=outcome.assets;references+=outcome.refs;
   }
   const full=(figures===856&&references===856)||(figures===2634&&references===4783);
   note('Completati '+completed+'/'+files.length+' archivi · '+figures+' immagini / '+references+' riferimenti in questa selezione. '+(full?'Tutti i file della selezione presenti.':'Aggiungi gli eventuali altri ZIP mancanti.'));
   await renderCatalog(0);
  }catch(e){note('Importazione interrotta dopo '+completed+' file: '+(e.message||e)+' · seleziona di nuovo gli ZIP rimasti o tutti, il caricamento è riprendibile.',true);}
  finally{setCatalogBusy(false);}
 };
}
function boot(){
 function ensure(){
  const head=document.querySelector('#adminShell .admin-head-actions');if(!head||document.getElementById('integralPdfButton'))return;
  const button=document.createElement('button');button.type='button';button.id='integralPdfButton';button.textContent='🗂 Archivio PDF integrale';button.onclick=show;head.prepend(button);
 }
 ensure();[250,800,1500].forEach(delay=>setTimeout(ensure,delay));
}
window.SAFETY_INTEGRAL_PDF_V24={prepareCourse,pick,isTrustedSrc,importZip,relevantKeys,score,placementIndex,show,hasAccess,invalidate};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();