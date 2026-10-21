/* SafetyTraining v24.8.7 — one admin-only catalog for local and private image inventories. */
(()=>{'use strict';
const root=()=>document.getElementById('adminShell');
const host=()=>document.getElementById('adminContent');
const cloud=()=>window.SAFETY_CLOUD?.state;
const actor=()=>cloud()?.user?.id||null;
const db=()=>cloud()?.client;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={type:'local',query:'',page:0,files:null,seq:0,stats:null};
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
 const {count,error}=await condition(db().from(table).select('id',{count:'exact',head:true}));
 return error?'n/d':count??0;
}
async function loadStats(){
 const values=await Promise.allSettled([
  count('training_integral_pdf_assets_v24',q=>q),
  count('training_integral_pdf_refs_v24',q=>q.gte('id','pdf-50000')),
  count('training_source_figures_v23',q=>q)
 ]);
 return values.map(v=>v.status==='fulfilled'?v.value:'n/d');
}
async function rowsPrivate(type,page,q){
 const table=type==='integral'?'training_integral_pdf_refs_v24':'training_source_figures_v23';
 const fields=type==='integral'
  ?'id,category,topic,source_document,source_page,rights_status,technical_review_required,asset:training_integral_pdf_assets_v24!inner(storage_path)'
  :'id,category,excerpt,source_document,source_page,rights_status,review_class,storage_path';
 let req=db().from(table).select(fields,{count:'exact'}).order('id');
 if(type==='integral')req=req.gte('id','pdf-50000');
 if(q)req=req.ilike(type==='integral'?'topic':'excerpt','%'+q.replace(/[%_,()]/g,'').slice(0,65)+'%');
 const {data,error,count:total}=await req.range(page*pageSize,page*pageSize+pageSize-1);
 if(error)throw error;
 const list=data||[],paths=list.map(x=>type==='integral'?x.asset?.storage_path:x.storage_path).filter(Boolean);
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
  status:type==='integral'?(x.technical_review_required?'Revisione tecnica richiesta':'Verificare i diritti'):(x.review_class||'In revisione'),
  rights:x.rights_status||'review_required'
 }))};
}
function tile(x,type){
 const image=x.src?'<img loading="lazy" decoding="async" src="'+esc(x.src)+'" alt="'+esc(x.name)+'">':'<div class="st-image-missing">Anteprima non disponibile</div>';
 return '<article class="st-image-card">'+image+'<strong>'+esc(x.name)+'</strong><small>'+esc(x.category)+'</small>'+
 (type==='local'?'<span class="st-image-status">Disponibile nell’app</span>':
 '<span class="st-image-status">Privata · '+esc(x.status)+' · '+esc(x.rights)+'</span>')+
 (x.detail?'<small>'+esc(x.detail)+'</small>':'')+'</article>';
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
  host().innerHTML='<section class="admin-card"><h2>Inventario immagini</h2><p>Le illustrazioni SVG/PNG distribuite con l’app sono in sola lettura. I file PDF importati restano privati e soggetti a revisione: la presenza in archivio non implica autorizzazione o pertinenza didattica.</p>'+
   '<div class="admin-stats"><article class="admin-stat"><strong>'+files.length+'</strong><span>Immagini locali disponibili</span></article><article class="admin-stat"><strong>'+esc(counts[0])+'</strong><span>Figure PDF caricate</span></article><article class="admin-stat"><strong>'+esc(counts[1])+'</strong><span>Riferimenti PDF completi</span></article><article class="admin-stat"><strong>'+esc(counts[2])+'</strong><span>Estratti PDF in revisione</span></article></div>'+
   '<div class="st-image-actions"><button type="button" data-st-image-integral>Gestisci archivio PDF · importa / elimina</button><button type="button" data-st-image-sources>Gestisci estratti PDF</button><button type="button" data-st-image-refresh>Aggiorna inventario</button></div></section>'+
   '<section class="admin-card"><h2>Esplora immagini</h2><div class="st-image-controls"><label>Archivio <select id="stImageType"><option value="local">Illustrazioni locali</option><option value="integral">Tavole PDF complete importate</option><option value="source">Estratti PDF in revisione</option></select></label><label>Cerca per tema <input type="search" id="stImageSearch" placeholder="Es. carrelli, DPI, portata"></label></div>'+
   '<div class="st-image-grid" id="stImageGallery"></div><div class="st-image-pagination"><button type="button" data-st-image-prev>← Precedenti</button><span id="stImagePagination" role="status"></span><button type="button" data-st-image-next>Successive →</button></div></section>';
  host().querySelector('#stImageType').value=state.type;
  host().querySelector('#stImageSearch').value=state.query;
  const content=host();
  content.querySelector('#stImageType').onchange=e=>{state.type=e.target.value;state.page=0;void paint();};
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
 document.addEventListener('safety:auth-changed',()=>{state.seq++;state.files=null;state.stats=null;});
}
window.SAFETY_ADMIN_IMAGE_LIBRARY_V25={render,ensureNav,category};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
