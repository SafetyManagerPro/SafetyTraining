/* PDF figures: private rights-pending admin review; never public course content. */
(()=>{'use strict';
const TABLE='training_source_figures_v23',BUCKET='training-source-figures';
const cloud=()=>window.SAFETY_CLOUD,c=()=>cloud()?.state?.client;
const admin=()=>!!(cloud()?.state?.user?.id&&window.SAFETY_ADMIN_CAPABILITIES_STATE?.platform_admin);
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const families=[['carrelli',/carrell|muletto|forch[ea]/i],['ple',/\\bple\\b|piattaform.{0,24}elevabil/i],['gru',/gru|autogru/i],['mmt',/\\bmmt\\b|movimento terra|escavat|pala caricatrice/i],['antincendio',/antincendio|incendio|estintor|evacuaz|esodo|fumo/i],['soccorso',/primo soccorso|rianimaz|emorrag|ferit|trauma/i],['quota',/lavori in quota|caduta dall.alto|anticadut|ancoragg|imbracatur/i],['meccanico',/meccanic|ripari|cesoiam|schiacciament/i],['dpi',/\\bdpi\\b|protezione individuale|guant|mascher|respirator|elmett|visier/i],['attrezzature',/brache|sollevament|carico sospeso|attrezzature di lavoro/i]];
const junk=new Set(['della','delle','dello','degli','nelle','nella','nelle','sulla','delle','come','quando','dopo','prima','dell','alla','dalla','anche','nella','per','con','dei','del','gli','una','nel','non','che','uno','tra','sono','caso','cosa','fare','sicurezza','lavoro','rischio','rischi','operatore','operatori','lavoratori','formazione']);
const tokens=s=>new Set(String(s||'').toLocaleLowerCase('it').replace(/[^a-zà-ÿ0-9 ]/gi,' ').split(/\\s+/).filter(x=>x.length>4&&!junk.has(x)).slice(0,90));
function type(a){const n=String(a.source_document||'').toLowerCase();if(n.includes('carrell'))return'carrelli';if(n.includes('ple'))return'ple';if(n.includes('gru-'))return'gru';if(n.includes('mmt'))return'mmt';if(n.includes('quota')||n.includes('iii-categoria'))return'quota';if(n.includes('antincendio'))return'antincendio';if(n.includes('soccorso'))return'soccorso';if(n.includes('meccanic'))return'meccanico';if(n.includes('attrezzature'))return'attrezzature';if(n.includes('dpi')||String(a.category).toLowerCase().includes('dpi'))return'dpi';return'other';}
let pictures=[],loaded=0,pending=null,overlay=null;
async function reload(force=false){
 if(!admin()){pictures=[];loaded=0;return[];}
 if(pending&&!force)return pending;
 if(!force&&Date.now()-loaded<8*60*1000)return pictures;
 pending=(async()=>{
 const {data,error}=await c().from(TABLE).select('id,storage_path,source_document,source_page,category,excerpt,tags,rights_status').eq('rights_status','review_required').order('source_document').order('source_page').limit(400);if(error)throw error;
 const a=data||[];for(let i=0;i<a.length;i+=50){
  const group=a.slice(i,i+50),res=await c().storage.from(BUCKET).createSignedUrls(group.map(x=>x.storage_path),1200);if(res.error)throw res.error;
  (res.data||[]).forEach((u,j)=>group[j].url=u.error?'':u.signedUrl);
 }
 pictures=a.filter(x=>x.url);loaded=Date.now();return pictures;
 })().finally(()=>pending=null);
 return pending;
}
function pick(course,topic){
 const blocked=window.SAFETY_GRAPHIC_PACK_01?.isFrozen;
 if(!admin()||!course?.presentation_generated_from_db||!topic?.db_backed||typeof blocked!=='function'||blocked(course)||topic.presentation_quality?.visual_mode==='authored'||!pictures.length)return[];
 const title=String(topic.slide_title||topic.title||''),name=String(course.title||'');
 const family=families.find(x=>x[1].test(name))?.[0]||families.find(x=>x[1].test(title))?.[0];if(!family)return[];
 const terms=tokens(title+' '+String(topic.summary||''));
 const scored=pictures.map(p=>{const t=type(p);if(!(family===t||(family==='dpi'&&t==='quota'&&/imbracatur|anticadut/i.test(title))))return null;
 const ref=tokens(p.excerpt);let score=8;for(const word of terms)if(ref.has(word))score+=3;
 return {...p,score};}).filter(Boolean).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 if(!scored.length)return[];
 const p=scored[0];return[{src:p.url,caption:'SOLO RIFERIMENTO NON VALIDATO · '+p.source_document+' · pag. '+p.source_page,graphic_pack_id:'pdf-'+p.id}];
}
function msg(s,bad=false){const el=document.getElementById('sourcePdfStatus');if(el){el.textContent=s;el.style.color=bad?'#bd4646':'';}}
function grid(q=''){const el=document.getElementById('sourcePdfGallery');if(!el)return;
 const arr=pictures.filter(x=>!q||String(x.category+' '+x.source_document+' '+x.excerpt).toLowerCase().includes(q.toLowerCase()));
 document.getElementById('sourcePdfCount').textContent=arr.length+' riferimenti in revisione (prime 36 anteprime)';
 el.innerHTML=arr.slice(0,36).map(x=>'<article class="source-pdf-card"><img loading="lazy" alt="Anteprima fonte PDF" src="'+esc(x.url)+'"><strong>'+esc(x.category)+'</strong><small>'+esc(x.source_document)+' · pag. '+x.source_page+'</small><span>Diritti e aggiornamento da verificare</span></article>').join('')||'<p>Importa il pacchetto ZIP per iniziare.</p>';
}
async function importPack(file){
 if(!admin())throw Error('Permessi di amministratore richiesti.');
 if(!window.JSZip)throw Error('JSZip non disponibile. Controlla la connessione.');
 if(!file||file.size>120*1024*1024)throw Error('ZIP assente o oltre 120 MB.');
 const z=await JSZip.loadAsync(file),entry=z.file('manifest.json');if(!entry)throw Error('manifest.json non trovato nello ZIP.');
 const manifest=JSON.parse(await entry.async('string'));if(!Array.isArray(manifest.assets)||!manifest.assets.length||manifest.assets.length>300)throw Error('Indice immagini non valido.');
 let ok=0,fail=[];
 for(const a of manifest.assets){
  if(!admin())throw Error('Sessione amministrativa scaduta.');
  const key=String(a.id||''),filePath=String(a.file||'');
  if(!/^[a-z0-9_-]{3,96}$/.test(key)||!/^assets\\/source-pdf\\/[a-z0-9_-]+\\.jpg$/.test(filePath)||!Number.isInteger(a.source_page)||a.source_page<1){fail.push(key+': metadati non validi');continue;}
  const f=z.file(filePath);if(!f){fail.push(key+': file mancante');continue;}
  const b=await f.async('uint8array');
  if(b.length<500||b.length>5*1024*1024||b[0]!==255||b[1]!==216||b[b.length-2]!==255||b[b.length-1]!==217){fail.push(key+': JPEG non valido');continue;}
  const digest=await crypto.subtle.digest('SHA-256',b);const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  if(a.sha256&&sha!==a.sha256){fail.push(key+': SHA-256 non coerente');continue;}
  const path='references/v1/'+key+'.jpg';
  const up=await c().storage.from(BUCKET).upload(path,new Blob([b],{type:'image/jpeg'}),{contentType:'image/jpeg',upsert:true});
  if(up.error){fail.push(key+': '+up.error.message);continue;}
  const row={id:key,storage_path:path,source_document:String(a.source_document||'').slice(0,300),source_page:a.source_page,category:String(a.category||'').slice(0,120),excerpt:String(a.excerpt||'').slice(0,600),tags:(a.tags||[]).filter(t=>typeof t==='string').slice(0,20),image_type:String(a.image_type||'page_preview'),sha256:sha,rights_status:'review_required'};
  const save=await c().from(TABLE).upsert(row,{onConflict:'id'});
  if(save.error)fail.push(key+': '+save.error.message);else ok++;
  if((ok+fail.length)%5===0)msg('Importazione '+(ok+fail.length)+'/'+manifest.assets.length+' · riuscite '+ok+' · errori '+fail.length);
 }
 await reload(true);return{ok,fail,total:manifest.assets.length};
}
function close(){overlay?.remove();overlay=null;}
async function open(){
 if(!admin())return alert('Accesso riservato al platform admin.');
 close();overlay=document.createElement('div');overlay.id='sourcePdfOverlay';overlay.className='admin-modal-overlay';
 overlay.innerHTML='<section class="admin-modal wide source-pdf-modal" role="dialog" aria-modal="true" aria-labelledby="sourcePdfTitle"><header><div><div class="admin-kicker">BIBLIOTECA FONTI</div><h2 id="sourcePdfTitle">Immagini dai PDF</h2></div><button id="sourcePdfClose" class="admin-modal-close" aria-label="Chiudi">×</button></header><div class="admin-modal-body"><p><strong>Solo revisione amministrativa.</strong> Queste immagini non sono pubblicate ai corsisti: occorre verificare diritti di riuso e aggiornamento normativo/tecnico prima di approvarle.</p><div class="source-pdf-upload"><label>Pacchetto ZIP<input id="sourcePdfZip" type="file" accept=".zip,application/zip"></label><label><input type="checkbox" id="sourcePdfConsent"> Importo esclusivamente per revisione interna, non per la pubblicazione.</label><button type="button" id="sourcePdfImport" class="admin-primary">Importa 169 immagini</button></div><p role="status" id="sourcePdfStatus">Libreria in caricamento...</p><label>Cerca per tema<input type="search" id="sourcePdfSearch" placeholder="DPI, PLE, carrelli, rischio..."></label><p id="sourcePdfCount"></p><div id="sourcePdfGallery" class="source-pdf-gallery"></div></div></section>';
 document.body.appendChild(overlay);document.getElementById('sourcePdfClose').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 document.getElementById('sourcePdfSearch').oninput=e=>grid(e.target.value);
 document.getElementById('sourcePdfImport').onclick=async()=>{
  if(!document.getElementById('sourcePdfConsent').checked)return msg('Conferma la revisione interna.',true);
  const file=document.getElementById('sourcePdfZip').files[0];if(!file)return msg('Seleziona lo ZIP.',true);
  const button=document.getElementById('sourcePdfImport');button.disabled=true;msg('Verifica e importazione in corso...');
  try{const result=await importPack(file);msg(result.ok+' di '+result.total+' immagini importate; errori: '+result.fail.length+(result.fail.length?' ('+result.fail.slice(0,2).join('; ')+')':''),!!result.fail.length);grid();}
  catch(e){msg(e.message,true);}finally{button.disabled=false;}
 };
 try{await reload(true);if(!overlay)return;msg(pictures.length+' immagini in revisione; nessuna pubblicazione automatica.');grid();}
 catch(e){msg('Libreria non disponibile: '+e.message,true);}
}
function boot(){
 const ensure=()=>{const head=document.querySelector('#adminShell .admin-head-actions');if(!head||document.getElementById('sourcePdfButton'))return;const b=document.createElement('button');b.type='button';b.id='sourcePdfButton';b.textContent='🖼 Immagini PDF';b.onclick=open;head.prepend(b);};
 ensure();[200,600,1300].forEach(ms=>setTimeout(ensure,ms));
 setTimeout(()=>{const sb=c();if(sb?.auth){sb.auth.onAuthStateChange(()=>{pictures=[];loaded=0;setTimeout(()=>reload().catch(()=>{}),180);});reload().catch(()=>{});}},900);
}
window.SAFETY_SOURCE_VISUALS_V23={pick,reload,open,type};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();