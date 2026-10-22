/* Owner-only slide image editor. Saved overrides are shared with print and viewer. */
(()=>{'use strict';
const db=()=>window.SAFETY_CLOUD?.state?.client;
const uid=()=>window.SAFETY_CLOUD?.state?.user?.id||null;
let owner=false,who=null,currentKey='',rows=new Map(),loaded=false,modal=null;
let projectedRevision=0,loadRevision=0,modalKeyAbort=null;
const temporaryPrivateUrls=new Set();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const isFrozen=c=>!!(c?.metadata?.freeze_scope||c?.metadata?.frozen||c?.metadata?.is_frozen||c?.metadata?.course_frozen||c?.frozen);
const editable=c=>!!(owner&&c?.presentation_generated_from_db&&c?.db_status==='published'&&!isFrozen(c));
async function authenticate(){who=uid();owner=false;if(!who||!db())return false;const {data,error}=await db().rpc('can_edit_slide_images_v33');owner=!error&&data===true&&uid()===who;return owner;}
function key(c){return String(c?.id||'')+'@'+Number(c?.db_version||0);}
async function load(c){
 const k=key(c),actor=uid();
 if(k===currentKey&&loaded)return;
 const requestRevision=++loadRevision;
 currentKey=k;loaded=false;rows=new Map();
 if(!actor||!c?.presentation_generated_from_db||!db())return;
 const {data,error}=await db().rpc('read_slide_images_v33',{p_course_key:c.id,p_version_number:Number(c.db_version)});
 if(error)throw error;
 if(uid()!==actor||currentKey!==k||requestRevision!==loadRevision)return;
 for(const row of data||[])rows.set(row.slide_uid,row.items||[]);
 loaded=true;
}
async function signPdf(item){
 if(item.kind!=='private_pdf'||!owner)return null;
 const {data,error}=await db().from('training_integral_pdf_refs_v24')
  .select('id,asset:training_integral_pdf_assets_v24!inner(storage_path)')
  .eq('id',item.ref_id).maybeSingle();
 if(error||!data?.asset?.storage_path)return null;
 const signed=await db().storage.from('training-source-figures').createSignedUrl(data.asset.storage_path,900);
 if(signed.error||!signed.data?.signedUrl)return null;
 temporaryPrivateUrls.add(signed.data.signedUrl);
 return signed.data.signedUrl;
}
async function apply(slide,c){
 if(!loaded||!slide?.uid||currentKey!==key(c)||!rows.has(slide.uid))return slide;
 const chosen=rows.get(slide.uid),out=[];
 for(const item of chosen){
  if(item.kind==='local'&&window.SAFETY_LOCAL_VISUALS_V32?.available?.(item.src)){
   out.push({src:item.src,caption:item.caption||'Immagine scelta dall’amministratore'});
  }else if(item.kind==='private_pdf'&&owner){
   const src=await signPdf(item);
   if(src){out.push({src,caption:item.caption||'Tavola PDF revisionata per uso interno'});}
  }
 }
 // For non-editor users, private choices must not reveal or replace source material.
 if(!owner&&!out.length&&chosen.some(x=>x.kind==='private_pdf'))return slide;
 if(!out.length)return {...slide,img:{src:'assets/general.svg',caption:'Nessuna immagine selezionata'},visualGallery:[]};
 return {...slide,img:out[0],visualGallery:out.slice(1)};
}
async function refreshProjected(c,index){
 const revision=++projectedRevision;
 if(!window.__deckSlides?.[index])return;
 const original=window.__deckSlides[index],changed=await apply(original,c);
 if(revision!==projectedRevision||window.__deck?.cid!==c.id||window.__deck?.index!==index||currentKey!==key(c))return;
 const article=document.getElementById('projectorSlide');if(!article)return;
 article.innerHTML=window.SAFETY_DECK_RENDER.deckSlideBody(changed,index);
}
function toolbar(c,slide,index){
 const shell=document.querySelector('.deck-shell');if(!shell)return;
 shell.querySelector('.slide-image-edit-btn')?.remove();
 if(!editable(c)||!slide?.uid||slide.type==='module')return;
 const btn=document.createElement('button');
 btn.className='slide-image-edit-btn';btn.type='button';btn.textContent='✎ Modifica immagini';
 btn.onclick=()=>void open(c,slide,index);
 shell.querySelector('.deck-actions')?.prepend(btn);
}
async function visit(c,slide,index){
 if(uid()!==who)await authenticate();
 const k=key(c);if(currentKey!==k||!loaded){try{await load(c)}catch(error){console.warn('Slide images',error.message);}}
 if(window.__deck?.cid!==c.id||window.__deck?.index!==index)return;
 toolbar(c,slide,index);await refreshProjected(c,index);
}
/* v41: searchable, topic-ranked and accessible visual editor for published lessons. */
const labelFor=src=>String(src||'').split('/').pop().replace(/\.(svg|png|jpe?g|webp)$/i,'').replace(/^gp\d\d[-_]/,'').replace(/[-_]/g,' ');
const cleanTokens=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>=4&&!['della','degli','delle','come','sono','dopo','prima','corso','formazione','rischio','sicurezza','slide','procedura','generale'].includes(t));
function matchScore(path,context){
 const name=labelFor(path).toLowerCase(),source=String(path).toLowerCase();
 const topic=[...new Set(cleanTokens(context))];
 let points=topic.reduce((score,word)=>score+(name.includes(word)?5:source.includes(word)?2:0),0);
 if(/general\.svg$/.test(source))points-=8;
 return points;
}
function familyOf(src){
 const s=String(src||'').toLowerCase();
 if(/dpi|casco|guanti|imbracatur|occhiali|udito|calzatur|respirator/.test(s))return'dpi';
 if(/segnal|cartell|divieto|obbligo|avvertiment|pittogramm/.test(s))return'segnaletica';
 if(/emerg|incend|soccor|evacua/.test(s))return'emergenze';
 if(/carrell|ple|gru|sollev|ribalt|macchin|preuso|attrezz|veicol/.test(s))return'attrezzature';
 if(/elettric|chimic|rumore|microclima|vdt|polver|caduta|rischio|preven|ergonom/.test(s))return'rischi';
 return'altro';
}
function itemHtml(item,index){
 const src=item.src||'assets/general.svg';
 return '<div class="slide-edit-item" data-selected-index="'+index+'"><img src="'+esc(src)+'" alt="Anteprima figura selezionata" loading="lazy"><div class="slide-edit-item-body">'+
 '<span class="slide-edit-index">'+(index===0?'Immagine principale':'Immagine aggiuntiva '+(index+1))+'</span>'+
 '<label>Didascalia <input type="text" data-caption="'+index+'" maxlength="180" value="'+esc(item.caption||'')+'" placeholder="Descrizione didattica chiara e pertinente"></label>'+
 '<div class="slide-edit-actions"><button data-move="'+index+':-1" type="button" '+(index===0?'disabled':'')+' aria-label="Sposta immagine verso l’alto">↑ Sposta</button>'+
 '<button data-move="'+index+':1" type="button" '+(index>=2?'disabled':'')+' aria-label="Sposta immagine verso il basso">↓ Sposta</button>'+
 '<button data-remove="'+index+'" type="button" aria-label="Rimuovi immagine">Rimuovi</button></div></div></div>';
}
async function open(c,slide,index){
 if(!editable(c)||!await authenticate()||!editable(c))return;
 if(!loaded||currentKey!==key(c))await load(c);
 const source=rows.get(slide.uid);
 let selection=source?JSON.parse(JSON.stringify(source)):[slide.img,...(slide.visualGallery||[])].filter(x=>x?.src)
  .filter(x=>window.SAFETY_LOCAL_VISUALS_V32?.available?.(x.src))
  .map(x=>({kind:'local',src:x.src,caption:x.caption||''}));
 if(selection.length>3)selection=selection.slice(0,3);
 modalKeyAbort?.abort();modal?.remove();
 const dialog=document.createElement('div');modal=dialog;
 dialog.className='slide-image-editor-backdrop';
 dialog.innerHTML='<div class="slide-image-editor slide-image-editor-v41" role="dialog" aria-modal="true" aria-labelledby="slideEditHeading">'+
 '<header><div><div class="slide-edit-eyebrow">EDITOR VISIVO · SOLO AMMINISTRATORE PROPRIETARIO</div><h2 id="slideEditHeading">Immagini della slide</h2>'+
 '<p class="slide-edit-context">'+esc(c.title||c.id||'Corso')+' · Slide '+(index+1)+' · '+esc(slide.title||'')+'</p></div><button data-close type="button" aria-label="Chiudi editor">✕</button></header>'+
 '<div class="slide-edit-grid"><section class="slide-edit-workspace" aria-label="Selezione immagini">'+
 '<div class="slide-edit-section-title"><h3>Immagini selezionate <span id="slideEditCount">0/3</span></h3><p>La prima è principale. Trascina idealmente la sequenza usando le frecce e scrivi una didascalia utile.</p></div>'+
 '<div id="slideEditSelected"></div>'+
 '<fieldset class="slide-edit-modes"><legend>Quando scegli un’immagine</legend>'+
 '<label><input type="radio" name="slideEditMode" value="replace" checked> Sostituisci immagine principale</label>'+
 '<label><input type="radio" name="slideEditMode" value="add"> Aggiungi alla galleria (max 3)</label></fieldset>'+
 '<div class="slide-edit-section-title"><h3>Archivio immagini</h3><p>Scegli una figura pertinente. Le immagini dei PDF devono essere già approvate per uso interno.</p></div>'+
 '<div class="slide-edit-filters"><label>Cerca per parola chiave<input id="slideEditSearch" type="search" placeholder="Es. DPI, emergenza, caduta, carrelli"></label>'+
 '<label>Argomento<select id="slideEditCategory"><option value="suggested">Suggerite per questa slide</option>'+
 '<option value="all">Tutte le figure</option><option value="dpi">DPI</option><option value="segnaletica">Segnaletica</option>'+
 '<option value="rischi">Rischi e prevenzione</option><option value="attrezzature">Attrezzature</option><option value="emergenze">Emergenze</option><option value="altro">Altre immagini</option></select></label></div>'+
 '<div class="slide-edit-tabs"><button type="button" data-library-tab="local" aria-pressed="true">Illustrate / SVG</button>'+
 '<button type="button" data-library-tab="private" aria-pressed="false">PDF approvati</button><span id="slideEditLibraryCount" aria-live="polite"></span></div>'+
 '<div id="slideEditLibrary" class="slide-edit-library" aria-label="Figure disponibili"></div></section>'+
 '<aside class="slide-edit-preview" aria-label="Anteprima composizione"><h3>Anteprima della slide</h3>'+
 '<div class="slide-edit-preview-canvas"><div class="slide-edit-preview-text"><span>CONTENUTO FORMATIVO</span><strong>'+esc(slide.title||'Slide')+'</strong>'+
 '<small>'+esc(String(slide.objective||slide.summary||slide.explain||slide.paragraph||'Illustrazione di supporto all’argomento').slice(0,145))+'</small></div>'+
 '<div id="slideEditPreviewImages" class="slide-edit-preview-images"></div></div>'+
 '<p>La composizione sarà utilizzata nella presentazione e nella stampa delle slide. Controlla la pertinenza tecnica prima del salvataggio.</p></aside></div>'+
 '<footer><button data-reset type="button">Ripristina immagini automatiche</button><button data-save type="button">Salva immagini nella slide</button></footer>'+
 '<p id="slideEditNotice" role="status" aria-live="polite"></p></div>';
 document.body.appendChild(dialog);
 const chosen=dialog.querySelector('#slideEditSelected'),lib=dialog.querySelector('#slideEditLibrary'),
 search=dialog.querySelector('#slideEditSearch'),category=dialog.querySelector('#slideEditCategory');
 const catalog=(window.SAFETY_LOCAL_VISUALS_V32?.catalog||[]).filter(x=>window.SAFETY_LOCAL_VISUALS_V32?.available?.(x));
 const context=[slide.title,slide.summary,slide.objective,slide.graphic?.title,c.title].filter(Boolean).join(' ');
 const ranked=catalog.map(src=>({src,score:matchScore(src,context)})).sort((a,b)=>b.score-a.score||a.src.localeCompare(b.src));
 let privateAssets=[],tab='local',limit=48,privateStatus='Caricamento dei PDF approvati…';
 const stillHere=()=>modal===dialog&&dialog.isConnected&&uid()===who&&editable(c);
 const choiceKey=x=>x.kind==='private_pdf'?'pdf:'+x.ref_id:'local:'+x.src;
 const flash=message=>{const note=dialog.querySelector('#slideEditNotice');if(note)note.textContent=message;};
 const srcFor=item=>item.kind==='private_pdf'?(item.src||privateAssets.find(x=>x.ref_id===item.ref_id)?.src||'assets/general.svg'):item.src;
 const choose=item=>{
  if(dialog.dataset.saving==='1')return;
  const add=dialog.querySelector('[name="slideEditMode"]:checked')?.value==='add';
  if(add){
   if(selection.some(x=>choiceKey(x)===choiceKey(item))){flash('Questa figura è già stata selezionata.');return;}
   if(selection.length>=3){flash('Sono consentite al massimo tre immagini per slide. Rimuovine una prima di aggiungerne altre.');return;}
   selection.push({...item});
  }else{
   // Replace the main visual and keep only distinct supporting figures.
   selection=[{...item},...selection.filter(x=>choiceKey(x)!==choiceKey(item)).slice(0,2)].slice(0,3);
  }
  flash('Modifica pronta: premi Salva per renderla visibile anche nella stampa PDF.');
  draw();
 };
 const renderSelected=()=>{
  dialog.querySelector('#slideEditCount').textContent=selection.length+'/3';
  chosen.innerHTML=selection.map((x,i)=>itemHtml({...x,src:srcFor(x)},i)).join('')||
   '<div class="slide-edit-empty">Nessuna figura selezionata. Scegline una dall’archivio oppure ripristina le immagini automatiche.</div>';
  const output=dialog.querySelector('#slideEditPreviewImages');
  output.innerHTML=selection.map((x,i)=>'<figure class="'+(i===0?'main':'secondary')+'"><img src="'+esc(srcFor(x)||'assets/general.svg')+
    '" loading="lazy" alt=""><figcaption>'+esc(x.caption||labelFor(x.src||x.ref_id))+'</figcaption></figure>').join('')||
    '<div class="slide-edit-preview-empty">Anteprima senza immagini</div>';
 };
 const renderLibrary=()=>{
  const q=cleanTokens(search.value).join(' '),words=q?q.split(' '):[];
  let results=[];
  if(tab==='local'){
   results=ranked.filter(r=>{
    if(category.value==='suggested'&&r.score<=0)return false;
    if(!['suggested','all'].includes(category.value)&&familyOf(r.src)!==category.value)return false;
    const text=(r.src+' '+labelFor(r.src)).toLowerCase();
    return words.every(w=>text.includes(w));
   });
  }else{
   results=privateAssets.filter(r=>{
    const text=(r.ref_id+' '+r.caption).toLowerCase();
    return words.every(w=>text.includes(w));
   });
  }
  const visible=results.slice(0,limit),total=results.length;
  dialog.querySelector('#slideEditLibraryCount').textContent=tab==='private'&&privateStatus?privateStatus:total+' figure · mostrate '+visible.length;
  lib.innerHTML=visible.map(r=>{
   const privateOne=tab==='private',key=privateOne?r.ref_id:r.src,already=selection.some(x=>choiceKey(x)===(privateOne?'pdf:'+key:'local:'+key));
   return '<button type="button" class="slide-edit-catalog-item '+(already?'selected':'')+'"'+
    (privateOne?' data-private-pick="'+esc(key)+'"':' data-pick="'+esc(key)+'"')+'>'+
    '<img src="'+esc(privateOne?r.src:r.src)+'" loading="lazy" alt="Anteprima">'+
    '<span>'+esc(privateOne?(r.caption||r.ref_id):labelFor(r.src))+'</span>'+
    (already?'<em>Selezionata</em>':'')+'</button>';
  }).join('')+(visible.length<total?'<button type="button" class="slide-edit-loadmore" data-loadmore>Mostra altre ('+(total-visible.length)+')</button>':'')+
   (!total?'<p class="slide-edit-empty">'+(tab==='private'?'Nessuna figura PDF approvata disponibile per questa ricerca.':'Nessuna figura trovata. Seleziona “Tutte le figure” o modifica la ricerca.')+'</p>':'');
 };
 const draw=()=>{if(!stillHere())return;renderSelected();renderLibrary();};
 const close=()=>{if(modal===dialog){modalKeyAbort?.abort();modalKeyAbort=null;dialog.remove();modal=null;}};
 dialog.querySelector('[data-close]').onclick=close;
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 const keyHandler=e=>{if(e.key==='Escape'&&modal===dialog){e.preventDefault();close();}};
 modalKeyAbort=new AbortController();
 document.addEventListener('keydown',keyHandler,{signal:modalKeyAbort.signal});
 // Search and grouping do not change the selection.
 search.oninput=()=>{limit=48;renderLibrary();};
 category.onchange=()=>{limit=48;renderLibrary();};
 dialog.querySelectorAll('[data-library-tab]').forEach(b=>b.onclick=()=>{
  tab=b.dataset.libraryTab;limit=48;
  dialog.querySelectorAll('[data-library-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  renderLibrary();
 });
 const save=async(reset)=>{
  if(!stillHere()||dialog.dataset.saving==='1')return;
  if(!reset&&selection.some(x=>String(x.caption||'').length>180)){flash('Didascalia troppo lunga (massimo 180 caratteri).');return;}
  dialog.dataset.saving='1';dialog.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
  flash('Salvataggio in corso…');
  const payload=reset?null:selection.map(x=>({kind:x.kind,src:x.kind==='local'?x.src:undefined,
   ref_id:x.kind==='private_pdf'?x.ref_id:undefined,caption:String(x.caption||'').trim()}));
  try{
   const {error}=await db().rpc('save_slide_images_v33',{p_course_key:c.id,p_version_number:Number(c.db_version),p_slide_uid:slide.uid,p_items:payload});
   if(error)throw error;
   if(!stillHere())return;
   if(reset)rows.delete(slide.uid);else rows.set(slide.uid,payload);
   loaded=true;
   flash(reset?'Immagini automatiche ripristinate.':'Immagini salvate: saranno usate anche dalla stampa PDF.');
   await refreshProjected(c,index);
   document.dispatchEvent(new Event('safety:slide-image-edited'));
  }catch(err){if(stillHere())flash('Salvataggio non riuscito: '+(err.message||err));}
  finally{if(stillHere()){dialog.dataset.saving='0';dialog.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);}}
 };
 dialog.addEventListener('input',e=>{
  const field=e.target.closest('[data-caption]');if(!field)return;
  const i=Number(field.dataset.caption);if(!Number.isInteger(i)||!selection[i])return;
  selection[i].caption=field.value;
  const figs=dialog.querySelectorAll('#slideEditPreviewImages figcaption');if(figs[i])figs[i].textContent=field.value||labelFor(selection[i].src||selection[i].ref_id);
 });
 dialog.addEventListener('click',e=>{
  const pick=e.target.closest('[data-pick]');
  if(pick){const src=pick.dataset.pick;if(catalog.includes(src))choose({kind:'local',src,caption:labelFor(src)});return;}
  const pdf=e.target.closest('[data-private-pick]');
  if(pdf){const item=privateAssets.find(x=>x.ref_id===pdf.dataset.privatePick);if(item)choose({kind:'private_pdf',ref_id:item.ref_id,src:item.src,caption:item.caption});return;}
  if(e.target.closest('[data-loadmore]')){limit+=48;renderLibrary();return;}
  const remove=e.target.closest('[data-remove]');
  if(remove){selection.splice(Number(remove.dataset.remove),1);draw();return;}
  const move=e.target.closest('[data-move]');
  if(move){const [i,dir]=move.dataset.move.split(':').map(Number),j=i+dir;
   if(j>=0&&j<selection.length)[selection[i],selection[j]]=[selection[j],selection[i]];
   draw();return;}
  if(e.target.closest('[data-reset]')){void save(true);return;}
  if(e.target.closest('[data-save]'))void save(false);
 });
 draw();
 // Resolve already-selected PDF thumbnails without accidentally switching modal.
 for(const s of selection.filter(x=>x.kind==='private_pdf'&&!x.src)){
  void signPdf(s).then(src=>{if(stillHere()&&src){s.src=src;renderSelected();}}).catch(()=>{});
 }
 void (async()=>{
  try{
   const {data:approved,error}=await db().from('training_integral_pdf_reviews_v25')
    .select('ref_id').eq('technical_status','approved').eq('rights_status','cleared_internal').limit(200);
   if(error)throw error;
   if(!approved?.length){privateStatus='';if(stillHere())renderLibrary();return;}
   const {data:figures,error:fe}=await db().from('training_integral_pdf_refs_v24')
    .select('id,category,topic,asset:training_integral_pdf_assets_v24!inner(storage_path)')
    .in('id',approved.map(x=>x.ref_id));
   if(fe)throw fe;
   const {data:excluded,error:ex}=await db().from('training_image_exclusions_v26')
    .select('image_key').eq('excluded',true).in('image_key',approved.map(x=>x.ref_id));
   if(ex)throw ex;
   const blocked=new Set((excluded||[]).map(x=>x.image_key));
   const pool=(figures||[]).filter(x=>!blocked.has(x.id));
   const batch=await Promise.all(pool.map(async f=>{
    const src=await signPdf({kind:'private_pdf',ref_id:f.id});
    return src?{ref_id:f.id,src,caption:f.topic||f.category||f.id}:null;
   }));
   if(!stillHere())return;
   privateAssets=batch.filter(Boolean);privateStatus='';
   for(const selected of selection.filter(x=>x.kind==='private_pdf'&&!x.src)){
    const found=privateAssets.find(x=>x.ref_id===selected.ref_id);if(found)selected.src=found.src;
   }
   draw();
  }catch(error){if(stillHere()){privateStatus='PDF non disponibili';flash('Archivio PDF: '+(error.message||error));renderLibrary();}}
 })();
}
async function applyDeck(slides,c){
 await authenticate();
 await load(c);
 return Promise.all(slides.map(s=>apply(s,c)));
}
window.addEventListener('safety:auth-changed',()=>{modalKeyAbort?.abort();modalKeyAbort=null;projectedRevision++;loadRevision++;who=null;owner=false;rows.clear();temporaryPrivateUrls.clear();loaded=false;currentKey='';modal?.remove();modal=null;});
window.SAFETY_SLIDE_IMAGE_EDITOR_V33={authenticate,visit,applyDeck,apply,canEdit:()=>owner,load,isTrustedPrivateUrl:url=>owner&&temporaryPrivateUrls.has(url)};
})();