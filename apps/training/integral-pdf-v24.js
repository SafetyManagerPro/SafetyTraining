/* CNA SafetyTraining · complete PDF visual library v24.
   14 source PDFs · private Supabase storage · platform-admin only.
   Source rights / medical and technical compliance remain to be reviewed.
   All links are short-lived signed URLs, NOT public static assets. */
(()=>{'use strict';
const BUCKET='training-source-figures',ASSETS='training_integral_pdf_assets_v24',REFS='training_integral_pdf_refs_v24';
const c=()=>window.SAFETY_CLOUD?.state?.client;
const admin=()=>!!(window.SAFETY_CLOUD?.state?.user?.id&&window.SAFETY_ADMIN_CAPABILITIES_STATE?.platform_admin);
const frozen=x=>!!window.SAFETY_GRAPHIC_PACK_01?.isFrozen?.(x);
const safeId=/^img-[0-9a-f]{20}$/,safeFile=/^assets\/pdf-figures\/img-[0-9a-f]{20}\.webp$/;
const cache=new Map(),trusted=new Set(),loading=new Map();
const text=s=>String(s??'').slice(0,600);
const esc=s=>text(s).replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const vocab=s=>new Set(text(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>4));
const score=(topic,ref)=>{
 const words=vocab(ref.topic+' '+ref.category);
 const head=vocab(topic.title+' '+(topic.slide_title||''));
 const more=vocab(topic.summary||'');
 let points=0;for(const w of words)points+=head.has(w)?5:more.has(w)?2:0;
 return points;
};
function keyOf(course){return String(course?.stable_key||course?.id||'');}
const alias=[
 [/^agg_attr_carrelli|^attr_carrelli/,'attr_carrelli_ind'],
 [/^agg_attr_ple|^attr_ple/,'attr_ple'],
 [/^agg_attr_gru_autocarro|^attr_gru_autocarro/,'attr_gru_autocarro'],
 [/^agg_attr_mmt|^attr_mmt/,'attr_mmt_all'],
 [/^agg_antincendio|^antincendio/,'antincendio'],
 [/^agg_primo_soccorso|^primo_soccorso/,'primo_soccorso_12h'],
 [/^lav_(basso|medio|alto)$|^agg_lav$/,'generale'],
 [/^dl_|^agg_dl|^preposto$|^dirigente$|^agg_prep|^agg_dir/,'generale'],
 [/^rls$|^agg_rls/,'generale'],
 [/^mod_cantieri$|^dl_spp_costruzioni$/,'lav_quota'],
 [/^attr_|^agg_attr_/,'lav_alto'],
 [/^emergenze_evacuazione$/,'antincendio'],
 [/^fondamenti$/,'generale'],
 [/^verde$|^frontoffice$|^backoffice$|^ecologici$|^polizia$/,'generale']
];
function relevantKeys(course){
 const key=keyOf(course);const candidates=new Set([key]);
 for(const [rx,aliasKey]of alias)if(rx.test(key))candidates.add(aliasKey);
 return [...candidates].filter(Boolean);
}
function hasAccess(course){return admin()&&!!course?.presentation_generated_from_db&&!frozen(course);}
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
  for(const k of relevantKeys(course)){
   const found=await paginate(db.from(REFS).select('id,asset_id,topic,source_document,source_page,category,candidate_course_keys,asset:training_integral_pdf_assets_v24!inner(storage_path)').contains('candidate_course_keys',[k]).order('id'),650);
   for(const r of found)if(!seen.has(r.id)){rows.push(r);seen.add(r.id);}
  }
  const unique=new Map();
  for(const r of rows){const curr=unique.get(r.asset_id);
   if(!curr||String(r.topic||'').length>String(curr.topic||'').length)unique.set(r.asset_id,r);
  }
  const list=[...unique.values()];
  if(!list.length){cache.set(name,{visuals:[],expires:Date.now()+5*60*1000});return[];}
  const paths=list.map(r=>r.asset?.storage_path).filter(Boolean);
  const urls=new Map();
  for(let start=0;start<paths.length;start+=50){
   const batch=paths.slice(start,start+50),res=await db.storage.from(BUCKET).createSignedUrls(batch,1200);
   if(res.error)throw res.error;
   (res.data||[]).forEach((u,i)=>{if(u.signedUrl&&!u.error){urls.set(batch[i],u.signedUrl);trusted.add(u.signedUrl);}});
  }
  const available=list.filter(r=>urls.has(r.asset?.storage_path));
  const topics=Array.isArray(course.topics)?course.topics:[];
  // Each image is assigned exactly once per course; ties use a stable, even distribution.
  const byTopic=new Map(topics.map(t=>[String(t.id),[]]));
  for(const r of available){
   let best=-1,idx=0;const token=r.asset_id.slice(-7);const seed=parseInt(token,16)||0;
   for(let j=0;j<topics.length;j++){
    const grade=score(topics[j],r);
    if(grade>best){best=grade;idx=j;}
   }
   if(best<=0&&topics.length)idx=seed%topics.length;
   const t=topics[idx];if(!t)continue;
   byTopic.get(String(t.id)).push({
     src:urls.get(r.asset.storage_path),
     caption:text('FONTE PDF DA VERIFICARE · '+r.category+' · '+r.source_document+' · pag. '+r.source_page),
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
 if(!zip||zip.size>110*1024*1024)throw Error('Seleziona il file ZIP integrale (max 110 MB).');
 note('Lettura ZIP e controllo indice...');
 const archive=await JSZip.loadAsync(zip);
 const source=archive.file('manifest.json');if(!source)throw Error('Indice manifest.json non trovato.');
 const manifest=JSON.parse(await source.async('string'));
 if(!Array.isArray(manifest.assets)||!Array.isArray(manifest.figures)||manifest.assets.length<2000||manifest.figures.length<4000)throw Error('Archivio incompleto o formato errato.');
 if(manifest.assets.length>12000||manifest.figures.length>40000)throw Error('Manifest superiore ai limiti ammessi.');
 const ids=manifest.assets.map(a=>a.filename?.replace(/\.webp$/,''));
 if(ids.some(id=>!safeId.test(String(id))))throw Error('ID immagine fuori formato.');
 if(new Set(ids).size!==ids.length)throw Error('Immagini duplicate nel manifesto.');
 const stored=await existingIds(db,ASSETS,ids);
 let done=0,added=0;
 for(let i=0;i<manifest.assets.length;i+=5){
  if(!admin())throw Error('Sessione amministrativa non più valida.');
  const chunk=manifest.assets.slice(i,i+5).filter(a=>!stored.has(a.filename.replace(/\.webp$/,'')));
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
  const rows=manifest.figures.slice(i,i+100).filter(f=>!refsDone.has(f.id)).map(f=>({
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

async function renderCatalog(page=0){
 const container=document.getElementById('integralPdfCatalog'),status=document.getElementById('integralPdfCatalogStatus');
 if(!container||!status||!admin())return;
 const db=c(),category=document.getElementById('integralPdfCategory')?.value||'';
 const queryString=(document.getElementById('integralPdfSearch')?.value||'').trim().slice(0,90).replace(/[%_,()]/g,'');
 let req=db.from(REFS).select('id,asset_id,source_document,source_page,category,topic,candidate_course_keys,asset:training_integral_pdf_assets_v24!inner(storage_path)',{count:'exact'}).order('id');
 if(category)req=req.eq('category',category);
 if(queryString)req=req.ilike('topic','%'+queryString+'%');
 const {data,error,count}=await req.range(page*24,page*24+23);
 if(error){status.textContent='Catalogo non disponibile: '+error.message;container.innerHTML='';return;}
 const list=data||[],signed=list.length?await db.storage.from(BUCKET).createSignedUrls(list.map(v=>v.asset?.storage_path).filter(Boolean),1200):{data:[]};
 if(signed.error){status.textContent='Anteprime non disponibili: '+signed.error.message;container.innerHTML='';return;}
 const urls=signed.data||[];
 status.textContent=(count||0)+' riferimenti nel catalogo · pagina '+(page+1);
 let pos=0;
 container.innerHTML=list.map(r=>{
  const u=urls[pos++],src=u&&!u.error&&u.signedUrl?u.signedUrl:'';
  if(src)trusted.add(src);
  return '<article class="st-integral-entry">'+(src?'<img loading="lazy" src="'+esc(src)+'" alt="Figura estratta da PDF">':'')+
   '<strong>'+esc(r.category)+'</strong><small>'+esc(r.source_document)+' · pag. '+r.source_page+'</small>'+
   '<p>'+esc(r.topic||'Immagine senza testo riconoscibile')+'</p><small>Corsi candidati: '+esc((r.candidate_course_keys||[]).join(' · '))+'</small></article>';
 }).join('')||'<p>Archivio non ancora importato o nessun risultato. Seleziona lo ZIP integrale qui sopra.</p>';
 const prev=document.getElementById('integralPdfPrev'),next=document.getElementById('integralPdfNext');
 if(prev){prev.disabled=page===0;prev.onclick=()=>void renderCatalog(Math.max(0,page-1));}
 if(next){next.disabled=(page+1)*24>=(count||0);next.onclick=()=>void renderCatalog(page+1);}
}
function show(){
 if(!admin()){alert('L’archivio integrale è riservato alla gestione CNA.');return;}
 document.getElementById('integralPdfOverlay')?.remove();
 const el=document.createElement('div');el.className='admin-modal-overlay';el.id='integralPdfOverlay';
 el.innerHTML='<section class="admin-modal wide st-integral-modal" role="dialog" aria-modal="true" aria-label="Archivio integrale immagini PDF">'+
 '<header><div><div class="admin-kicker">CNA AVELLINO · FONTI PDF</div><h2>Archivio integrale immagini</h2></div><button type="button" id="integralPdfClose" class="admin-modal-close">×</button></header>'+
 '<div class="admin-modal-body"><p>14 documenti · 2.634 immagini uniche · 4.783 riferimenti a pagina, categoria, corso e argomento. Biblioteca privata riservata agli amministratori della piattaforma.</p>'+
 '<p>Usa <strong>SafetyTraining_estrazione_integrale_figure.zip</strong> senza decomprimerlo. Dopo il caricamento compariranno nelle slide del docente autorizzato e nella stampa slide. I corsi sospesi restano esclusi.</p>'+
 '<p>Il materiale proviene da fonti esterne: mantieni citazione, utilizzo didattico interno e revisione tecnico-normativa. L’importazione non costituisce autorizzazione generale di riutilizzo.</p>'+
 '<input id="integralPdfZip" type="file" accept=".zip,application/zip"><label class="st-integral-confirm"><input type="checkbox" id="integralPdfPrivateCheck"> Confermo l’importazione nell’archivio privato per revisione e docenza CNA</label>'+
 '<button type="button" class="admin-primary" id="integralPdfImport">Importa / riprendi archivio integrale</button><p id="integralPdfStatus" role="status">Pronto.</p>'+'<h3>Catalogo privato immagini importate</h3><label>Categoria <select id="integralPdfCategory"><option value="">Tutte le categorie</option>'+['DPI III categoria','DPI e protezioni','Carrelli elevatori','PLE','Gru su autocarro','Macchine movimento terra','Antincendio','Primo soccorso','Rischio meccanico','Attrezzature','Lavori in quota'].map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')+'</select></label>'+'<label>Argomento <input id="integralPdfSearch" type="search" placeholder="Es. stabilità, DPI, evacuazione"></label><p id="integralPdfCatalogStatus" role="status">Catalogo in caricamento...</p><div id="integralPdfCatalog" class="st-integral-gallery"></div>'+'<div class="st-integral-pagination"><button type="button" id="integralPdfPrev">← Precedenti</button><button type="button" id="integralPdfNext">Successive →</button></div></div></section>';
 document.body.appendChild(el);
 el.querySelector('#integralPdfClose').onclick=()=>el.remove();el.addEventListener('click',e=>{if(e.target===el)el.remove();});
 el.querySelector('#integralPdfCategory').onchange=()=>void renderCatalog(0);
 el.querySelector('#integralPdfSearch').onchange=()=>void renderCatalog(0);
 void renderCatalog(0);
 el.querySelector('#integralPdfImport').onclick=async()=>{
  const button=el.querySelector('#integralPdfImport'),file=el.querySelector('#integralPdfZip').files?.[0];
  if(!el.querySelector('#integralPdfPrivateCheck').checked)return note('Conferma uso privato e revisione.',true);
  if(!file)return note('Seleziona lo ZIP integrale.',true);
  button.disabled=true;try{await importZip(file);await renderCatalog(0);}catch(e){note('Importazione interrotta: '+(e.message||e)+' · riprova con lo stesso ZIP per riprendere.',true);}finally{button.disabled=false;}
 };
}
function boot(){
 function ensure(){
  const head=document.querySelector('#adminShell .admin-head-actions');if(!head||document.getElementById('integralPdfButton'))return;
  const button=document.createElement('button');button.type='button';button.id='integralPdfButton';button.textContent='🗂 Archivio PDF integrale';button.onclick=show;head.prepend(button);
 }
 ensure();[250,800,1500].forEach(delay=>setTimeout(ensure,delay));
}
window.SAFETY_INTEGRAL_PDF_V24={prepareCourse,pick,isTrustedSrc,importZip,relevantKeys,score,show,hasAccess};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();