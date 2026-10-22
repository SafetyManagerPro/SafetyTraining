/* SafetyTraining v43: visually selected, admin-only batch review of private PDF figures.
 * Selection is per image and spans gallery pages; no automated technical/licensing claims.
 */
(()=>{'use strict';
 const selected=new Map();
 let target=null,refresh=null,pageItems=[],busy=false,requestNo=0,confirmedOwner=null;
 const cloud=()=>window.SAFETY_CLOUD?.state;
 const db=()=>cloud()?.client;
 const actor=()=>cloud()?.user?.id||null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const eligible=x=>/^pdf-[0-9]{5}$/.test(x?.id||'')&&
  (!x.review||((x.review.technical_status||'pending')==='pending'&&(x.review.rights_status||'review_required')==='review_required'));
 const active=()=>!!target?.isConnected&&!!db()&&!!actor()&&
  !!document.querySelector('#adminShell .admin-nav nav [data-image-library-v25].active');
 const validateActor=()=>{if(confirmedOwner!==actor()){selected.clear();confirmedOwner=actor();}};
 function display(){
  if(!target?.isConnected)return;
  const count=selected.size,ids=Array.from(selected.values());
  const documents=new Set(ids.map(x=>x.source_document));
  const summary=target.querySelector('#stBulkSummary');
  if(summary)summary.textContent=count+' figure selezionate · '+documents.size+' document'+(documents.size===1?'o':'i')+' di origine · limite 100 per operazione';
  target.querySelector('[data-st-bulk-approve]')?.toggleAttribute('disabled',!count||busy);
  target.querySelector('[data-st-bulk-clear]')?.toggleAttribute('disabled',!count||busy);
  target.querySelector('[data-st-bulk-page]')?.toggleAttribute('disabled',busy||!pageItems.some(x=>eligible(x)&&!selected.has(x.id)));
  const rights=target.querySelector('#stBulkRights');
  if(rights?.value==='cleared_internal'&&documents.size>1){
   target.querySelector('#stBulkDocWarning').textContent='Per approvare anche i diritti, seleziona soltanto pagine dello stesso PDF originale.';
  }else target.querySelector('#stBulkDocWarning').textContent='';
  const previous=target.querySelector('#stBulkSelectedList');
  if(previous)previous.textContent=ids.slice(0,8).map(x=>x.id+' · '+x.source_page+' · '+x.source_document).join(' | ')+(count>8?' · …':'');
 }
 function message(text,isError=false){
  const area=target?.querySelector('#stBulkMessage');
  if(area){area.textContent=text;area.classList.toggle('st-bulk-error',isError);}
 }
 function syncCheckboxes(){
  const gallery=document.getElementById('stImageGallery');
  gallery?.querySelectorAll('[data-st-bulk-item]').forEach(input=>{input.checked=selected.has(input.dataset.stBulkItem);});
 }
 function selectVisible(){
  validateActor();if(busy)return;
  for(const item of pageItems){
   if(!eligible(item)||selected.has(item.id))continue;
   if(selected.size>=100){message('Hai raggiunto 100 figure: approva questa selezione prima di aggiungerne altre.',true);break;}
   selected.set(item.id,{id:item.id,source_document:item.source_document,source_page:item.source_page,topic:item.name});
  }
  syncCheckboxes();display();
 }
 function clear(){if(busy)return;selected.clear();syncCheckboxes();message('Selezione cancellata.');display();}
 async function approve(event){
  event.preventDefault();if(busy||!active())return;
  validateActor();if(!selected.size){message('Seleziona prima le figure.',true);return;}
  const form=event.currentTarget,formData=new FormData(form),ids=[...selected.values()];
  const rights=String(formData.get('rights_status')||'review_required');
  const note=String(formData.get('technical_note')||'').trim();
  const evidence=String(formData.get('rights_evidence')||'').trim();
  const seen=formData.get('inspected')==='on',licensed=formData.get('rights_verified')==='on';
  if(note.length<40||note.length>700){message('Indica una motivazione tecnico-didattica comune di 40–700 caratteri.',true);return;}
  if(!seen){message('Conferma di avere visionato singolarmente tutte le immagini selezionate.',true);return;}
  const docs=new Set(ids.map(x=>x.source_document));
  if(rights==='cleared_internal'&&(docs.size!==1||!licensed||evidence.length<30)){
   message('Per autorizzare i diritti: un solo documento PDF, autorizzazione verificabile e conferma separata obbligatoria.',true);return;
  }
  const question='Vuoi registrare la verifica TECNICA di '+ids.length+' immagini'+
    (rights==='cleared_internal'?' e l’autorizzazione dei diritti per uso interno del documento '+[...docs][0]:' (senza approvare i diritti)')+
    '? Le immagini resteranno private; ogni decisione sarà registrata nell’audit.';
  if(!window.confirm(question))return;
  busy=true;target.querySelectorAll('button,textarea,select,input').forEach(x=>x.disabled=true);
  message('Registrazione delle revisioni in corso…');
  const who=actor(),callId=++requestNo;
  try{
   const {data,error}=await db().rpc('training_bulk_review_integral_pdf_v43',{
    p_ref_ids:ids.map(x=>x.id),
    p_technical_note:note,
    p_rights_status:rights,
    p_rights_evidence:rights==='cleared_internal'?evidence:'',
    p_confirm_visual_review:true,
    p_confirm_rights_review:rights==='cleared_internal'
   });
   if(error)throw error;
   if(actor()!==who||callId!==requestNo)return;
   const updated=Number(data?.approved||0),skipped=Number(data?.skipped_previously_reviewed||0);
   selected.clear();
   window.SAFETY_INTEGRAL_PDF_V24?.invalidate?.();
   document.dispatchEvent(new Event('safety:image-review-updated'));
   message('Operazione completata: '+updated+' approvate · '+skipped+' già esaminate, lasciate inalterate. Nessuna pubblicazione automatica.');
   // Refresh gallery to show the actual database status and new eligibility.
   if(typeof refresh==='function')await refresh();
  }catch(error){
   if(actor()===who)message('Approvazione di massa non riuscita: '+(error?.message||error),true);
  }finally{
   busy=false;
   if(target?.isConnected){target.querySelectorAll('button,textarea,select,input').forEach(x=>x.disabled=false);display();}
  }
 }
 function mount(container,refreshGallery){
  validateActor();
  if(!container)return;
  target=container;refresh=refreshGallery;
  target.innerHTML='<section class="st-bulk-shell"><div class="st-bulk-head"><div><h3>Approvazione di massa · Tavole PDF</h3>'+
   '<p>Seleziona le immagini che hai effettivamente esaminato. Puoi accumularle cambiando pagina (max 100 per conferma).</p></div>'+
   '<div class="st-bulk-buttons"><button type="button" data-st-bulk-page>Seleziona le immagini di questa pagina</button>'+
   '<button type="button" data-st-bulk-clear>Deseleziona tutto</button></div></div>'+
   '<p id="stBulkSummary" aria-live="polite"></p><small id="stBulkSelectedList"></small>'+
   '<form id="stBulkForm"><div class="st-bulk-inputs"><label>Tipo di approvazione<select id="stBulkRights" name="rights_status">'+
   '<option value="review_required">Solo verifica tecnico-didattica (diritti ancora da verificare)</option>'+
   '<option value="cleared_internal">Verifica tecnica + diritti autorizzati per uso interno</option></select></label>'+
   '<label>Motivazione tecnico-didattica comune<textarea name="technical_note" minlength="40" maxlength="700" rows="3" required '+
   'placeholder="Indica il contenuto verificato e spiega perché queste tavole sono didatticamente corrette e pertinenti, specificando limiti o contesto applicativo."></textarea></label>'+
   '<label>Documentazione dei diritti (se approvati)<textarea name="rights_evidence" maxlength="950" rows="2" '+
   'placeholder="Tipo di licenza, titolare, fonte, data di verifica, ambito di uso interno; non basta citare il nome del PDF."></textarea></label></div>'+
   '<label class="st-bulk-confirm"><input type="checkbox" name="inspected" required> Confermo di aver visualizzato e verificato singolarmente tutte le figure selezionate e la pertinenza della motivazione per ciascuna.</label>'+
   '<label class="st-bulk-confirm"><input type="checkbox" name="rights_verified"> Confermo di aver verificato un’autorizzazione valida per l’uso interno di tutte le tavole del documento selezionato (necessario solo per approvare i diritti).</label>'+
   '<p id="stBulkDocWarning" class="st-bulk-error"></p>'+
   '<div class="st-bulk-foot"><button type="submit" data-st-bulk-approve disabled>Conferma approvazione selezionate</button>'+
   '<span>Solo amministratori. Nessun inserimento automatico nelle slide o pubblicazione ai corsisti.</span></div>'+
   '<p id="stBulkMessage" role="status" aria-live="polite"></p></form></section>';
  target.querySelector('[data-st-bulk-page]').onclick=selectVisible;
  target.querySelector('[data-st-bulk-clear]').onclick=clear;
  target.querySelector('#stBulkForm').onsubmit=e=>void approve(e);
  target.querySelector('#stBulkRights').onchange=display;
  display();
 }
 function decorate(gallery,items,type){
  validateActor();pageItems=type==='integral'?items:[];
  if(target?.isConnected)target.hidden=type!=='integral';
  if(type!=='integral'||!gallery)return;
  for(const item of items){
   const card=gallery.querySelector('[data-review-ref="'+item.id+'"]');
   if(!card||card.querySelector('[data-st-bulk-item]'))continue;
   const label=document.createElement('label');label.className='st-bulk-tile-check';
   const input=document.createElement('input');input.type='checkbox';input.dataset.stBulkItem=item.id;
   input.checked=selected.has(item.id);
   input.disabled=!eligible(item);
   const word=document.createElement('span');word.textContent=eligible(item)?'Seleziona per approvazione di massa':'Già revisionata';
   label.append(input,word);card.prepend(label);
   input.addEventListener('change',()=>{
    if(busy)return;
    if(input.checked){
     if(selected.size>=100&&!selected.has(item.id)){input.checked=false;message('Puoi selezionare al massimo 100 figure.',true);return;}
     selected.set(item.id,{id:item.id,source_document:item.source_document,source_page:item.source_page,topic:item.name});
    }else selected.delete(item.id);
    display();
   });
  }
  display();
 }
 function reset(){selected.clear();pageItems=[];confirmedOwner=null;requestNo++;target=null;refresh=null;}
 window.addEventListener('safety:auth-changed',reset);
 window.SAFETY_BULK_REVIEW_V43={mount,decorate,reset,getSelectionCount:()=>selected.size};
})();