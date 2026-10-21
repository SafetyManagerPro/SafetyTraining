/* Owner-only slide image editor. Saved overrides are shared with print and viewer. */
(()=>{'use strict';
const db=()=>window.SAFETY_CLOUD?.state?.client;
const uid=()=>window.SAFETY_CLOUD?.state?.user?.id||null;
let owner=false,who=null,currentKey='',rows=new Map(),loaded=false,modal=null;
const temporaryPrivateUrls=new Set();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const isFrozen=c=>!!(c?.metadata?.freeze_scope||c?.metadata?.frozen||c?.metadata?.is_frozen||c?.metadata?.course_frozen||c?.frozen);
const editable=c=>!!(owner&&c?.presentation_generated_from_db&&c?.db_status==='published'&&!isFrozen(c));
async function authenticate(){who=uid();owner=false;if(!who||!db())return false;const {data,error}=await db().rpc('can_edit_slide_images_v33');owner=!error&&data===true&&uid()===who;return owner;}
function key(c){return String(c?.id||'')+'@'+Number(c?.db_version||0);}
async function load(c){
 const k=key(c),actor=uid();
 if(k===currentKey&&loaded)return;
 currentKey=k;loaded=false;rows=new Map();
 if(!actor||!c?.presentation_generated_from_db||!db())return;
 const {data,error}=await db().rpc('read_slide_images_v33',{p_course_key:c.id,p_version_number:Number(c.db_version)});
 if(error)throw error;
 if(uid()!==actor||currentKey!==k)return;
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
 if(!window.__deckSlides?.[index])return;
 const original=window.__deckSlides[index],changed=await apply(original,c);
 if(window.__deck?.cid!==c.id||window.__deck?.index!==index)return;
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
function itemHtml(item,index){
 return '<div class="slide-edit-item"><img src="'+esc(item.src)+'" alt="" loading="lazy"><div>'+
 '<small>'+esc(item.caption||item.src)+'</small><div class="slide-edit-actions">'+
 '<button data-move="'+index+':-1" type="button">↑</button><button data-move="'+index+':1" type="button">↓</button>'+
 '<button data-remove="'+index+'" type="button">Rimuovi</button></div></div></div>';
}
async function open(c,slide,index){
 if(!editable(c)||!await authenticate()||!editable(c))return;
 const source=rows.get(slide.uid);
 let selection=source?JSON.parse(JSON.stringify(source)):[slide.img,...(slide.visualGallery||[])].filter(x=>x?.src)
  .filter(x=>window.SAFETY_LOCAL_VISUALS_V32?.available?.(x.src))
  .map(x=>({kind:'local',src:x.src,caption:x.caption||''}));
 if(selection.length>3)selection=selection.slice(0,3);
 modal?.remove();modal=document.createElement('div');modal.className='slide-image-editor-backdrop';
 modal.innerHTML='<div class="slide-image-editor" role="dialog" aria-modal="true" aria-label="Modifica immagini della slide">'+
 '<header><h2>Immagini della slide</h2><button data-close type="button">✕</button></header>'+
 '<p>'+esc(slide.title||'')+' · Solo amministratore proprietario · max 3 immagini.</p>'+
 '<div id="slideEditSelected"></div><p><button type="button" data-add-mode aria-pressed="false">Modalità: sostituisci immagine</button> <small>Per una galleria di più immagini attiva prima la modalità Aggiungi.</small></p><label>Cerca nell’archivio <input id="slideEditSearch" type="search" placeholder="Es. carroponte, stabilità, soccorso"></label>'+
 '<div id="slideEditLibrary" class="slide-edit-library"></div>'+
 '<footer><button data-reset type="button">Ripristina scelta automatica</button><button data-save type="button">Salva per slide e stampa PDF</button></footer>'+
 '<p id="slideEditNotice" role="status"></p></div>';
 document.body.appendChild(modal);
 const chosen=modal.querySelector('#slideEditSelected'),lib=modal.querySelector('#slideEditLibrary'),search=modal.querySelector('#slideEditSearch');
 const catalog=window.SAFETY_LOCAL_VISUALS_V32?.catalog||[];
 let privateAssets=[];
 let addMode=false;
 const choose=item=>{if(addMode){if(selection.length<3)selection.push(item);}else{selection=[item];}refresh();};
 const refresh=()=>{
  chosen.innerHTML=selection.map((x,i)=>itemHtml({src:x.src||'assets/general.svg',caption:x.caption||x.ref_id},i)).join('')||'<p>Nessuna immagine. Il salvataggio mostrerà lo schema neutro.</p>';
  const q=search.value.toLowerCase().trim();const matches=catalog.filter(x=>x.toLowerCase().includes(q)).slice(0,60);
  lib.innerHTML=matches.map(x=>'<button type="button" data-pick="'+esc(x)+'"><img src="'+esc(x)+'" loading="lazy" alt=""><span>'+esc(x.split('/').pop())+'</span></button>').join('')+
   privateAssets.filter(x=>!q||(x.ref_id+' '+x.caption).toLowerCase().includes(q)).map(x=>
    '<button type="button" data-private-pick="'+esc(x.ref_id)+'"><img src="'+esc(x.src)+'" loading="lazy" alt=""><span>PDF approvato · '+esc(x.ref_id)+'</span></button>').join('');
 };
 search.oninput=refresh;refresh();
 void (async()=>{
  const {data:approved,error}=await db().from('training_integral_pdf_reviews_v25')
   .select('ref_id').eq('technical_status','approved').eq('rights_status','cleared_internal').limit(120);
  if(error||!approved?.length||!modal?.isConnected)return;
  const {data:figures,error:fe}=await db().from('training_integral_pdf_refs_v24')
   .select('id,category,asset:training_integral_pdf_assets_v24!inner(storage_path)')
   .in('id',approved.map(x=>x.ref_id));
  if(fe||!modal?.isConnected)return;
  const {data:excluded}=await db().from('training_image_exclusions_v26')
   .select('image_key').eq('excluded',true).in('image_key',approved.map(x=>x.ref_id));
  const barred=new Set((excluded||[]).map(x=>x.image_key));
  for(const f of (figures||[]).filter(x=>!barred.has(x.id))){
   const src=await signPdf({kind:'private_pdf',ref_id:f.id});
   if(src)privateAssets.push({ref_id:f.id,src,caption:f.category||''});
  }
  if(modal?.isConnected)refresh();
 })();
 modal.onclick=async e=>{
  const mode=e.target.closest('[data-add-mode]');
  if(mode){addMode=!addMode;mode.setAttribute('aria-pressed',String(addMode));mode.textContent=addMode?'Modalità: aggiungi alla galleria':'Modalità: sostituisci immagine';return;}
  if(e.target.closest('[data-close]')){modal.remove();modal=null;return;}
  const pick=e.target.closest('[data-pick]');
  if(pick){choose({kind:'local',src:pick.dataset.pick,caption:''});return;}
  const privatePick=e.target.closest('[data-private-pick]');
  if(privatePick){const f=privateAssets.find(x=>x.ref_id===privatePick.dataset.privatePick);if(f)choose({kind:'private_pdf',ref_id:f.ref_id,src:f.src,caption:f.caption});return;}
  const remove=e.target.closest('[data-remove]');
  if(remove){selection.splice(Number(remove.dataset.remove),1);refresh();return;}
  const move=e.target.closest('[data-move]');
  if(move){const [i,dir]=move.dataset.move.split(':').map(Number),j=i+dir;
   if(j>=0&&j<selection.length)[selection[i],selection[j]]=[selection[j],selection[i]];refresh();return;}
  const reset=e.target.closest('[data-reset]'),save=e.target.closest('[data-save]');
  if(!reset&&!save)return;
  const notice=modal.querySelector('#slideEditNotice');notice.textContent='Salvataggio…';
  const payload=reset?null:selection.map(x=>({kind:x.kind,src:x.kind==='local'?x.src:undefined,ref_id:x.kind==='private_pdf'?x.ref_id:undefined,caption:x.caption||''}));
  try{
   const {error}=await db().rpc('save_slide_images_v33',{p_course_key:c.id,p_version_number:Number(c.db_version),p_slide_uid:slide.uid,p_items:payload});
   if(error)throw error;
   if(reset)rows.delete(slide.uid);else rows.set(slide.uid,payload);
   loaded=true;notice.textContent='Salvato per le slide e per la stampa PDF.';
   await refreshProjected(c,index);
   document.dispatchEvent(new Event('safety:slide-image-edited'));
  }catch(err){notice.textContent='Salvataggio negato: '+(err.message||err);}
 };
}
async function applyDeck(slides,c){
 await authenticate();
 await load(c);
 return Promise.all(slides.map(s=>apply(s,c)));
}
window.addEventListener('safety:auth-changed',()=>{who=null;owner=false;rows.clear();temporaryPrivateUrls.clear();loaded=false;currentKey='';modal?.remove();modal=null;});
window.SAFETY_SLIDE_IMAGE_EDITOR_V33={authenticate,visit,applyDeck,apply,canEdit:()=>owner,load,isTrustedPrivateUrl:url=>owner&&temporaryPrivateUrls.has(url)};
})();