/* SafetyTraining v26: cautious, evidence-labelled recommendations, not image recognition. */
(()=>{'use strict';
const db=()=>window.SAFETY_CLOUD?.state?.client;
const authorized=()=>!!(window.SAFETY_CLOUD?.state?.user?.id&&window.SAFETY_ADMIN_CAPABILITIES_STATE?.platform_admin);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const stop=new Set('corso corsi modulo formazione sicurezza lavoro lavoratori attività attivita rischio rischi generale specifica specifiche attrezzature pagina manuale istruzioni utilizzo utilizzi addetti applicabili contenuti tecnica normativo normativa legge decreto prova documento documenti figure figura tavola completa scannerizzata parte una della delle degli nella negli alla allo anche come con per dei del sul il lo la le di da ed un uno d lvo 81 2008'.split(' '));
function tokens(s){return [...new Set(String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]+/g)?.filter(t=>t.length>=5&&!stop.has(t))||[])];}
function recommend(image,catalog){
 const title=String(image.name||'').trim(),category=String(image.category||''),source=String(image.detail||'');
 // The PDF topic is often a repeated heading: no false image-reading claims.
 const a=tokens(title),generic=a.length<2||/^(?:d\.? ?lvo|manuale|pagina|formazione|componenti)/i.test(title);
 const choices=(catalog||[]).filter(c=>!image.candidate_course_keys?.length||image.candidate_course_keys.includes(c.course_key)).map(c=>{
  const heading=tokens(c.unit_title),module=tokens(c.module_title);
  const matches=a.filter(w=>heading.includes(w)),modMatches=a.filter(w=>module.includes(w));
  const catMatch=tokens(category).filter(w=>tokens(c.course_title).includes(w));
  const evidence=matches.length?matches.map(w=>'argomento: '+w):modMatches.map(w=>'modulo: '+w);
  const score=matches.length*6+modMatches.length*2+Math.min(catMatch.length,2);
  return {course_key:c.course_key,course_title:c.course_title,module_key:c.module_key,module_title:c.module_title,unit_position:c.unit_position,unit_title:c.unit_title,version_number:c.version_number,score,evidence};
 }).filter(c=>c.score>=6).sort((x,y)=>y.score-x.score||x.course_key.localeCompare(y.course_key));
 const best=choices[0],runner=choices[1];
 // An exact title-only match can still be ambiguous between courses or lessons.
 const confident=!generic&&best?.score>=10&&(!runner||best.score-runner.score>=5);
 return {status:!best?'unassigned':confident?'candidate_strong':'uncertain',suggestions:choices.slice(0,3),basis:'metadati e titoli; contenuto dell’immagine NON verificato',source};
}
let catalog=null,catalogPromise=null,excluded=new Map(),generation=0;
async function getCatalog(){
 if(catalog)return catalog;
 if(!catalogPromise)catalogPromise=(async()=>{const {data,error}=await db().rpc('training_image_matching_catalog_v26');if(error)throw error;return data||[];})().finally(()=>{catalogPromise=null;});
 return catalog=await catalogPromise;
}
async function getExclusions(keys){
 if(!keys.length)return;
 const {data,error}=await db().from('training_image_exclusions_v26').select('image_key,excluded').in('image_key',keys);
 if(error)throw error;
 for(const key of keys)excluded.set(key,false);
 for(const x of data||[])excluded.set(x.image_key,x.excluded);
}
async function setExclude(key,kind,value,reason){
 if(!authorized())throw Error('Accesso amministrativo richiesto');
 const {error}=await db().rpc('training_set_image_exclusion_v26',{p_key:key,p_kind:kind,p_excluded:value,p_reason:reason});
 if(error)throw error;
 excluded.set(key,value);if(kind==='local')await window.SAFETY_VISUAL_ATLAS_V22?.refreshExcludedLocal?.();window.SAFETY_INTEGRAL_PDF_V24?.invalidate?.();document.dispatchEvent(new Event('safety:image-review-updated'));
}
async function decorate(host,items,type){
 if(!authorized()||!host?.isConnected||!items?.length)return;
 const turn=++generation;
 try{
  const [catalogRows]=await Promise.all([getCatalog(),getExclusions(items.map(x=>x.id||x.src))]);
  if(turn!==generation||!host.isConnected)return;
  for(const item of items){
   const key=type==='local'?item.src:item.id;
   const card=type==='local'?[...host.querySelectorAll('.st-image-card')].find((x,i)=>i===items.indexOf(item)):
   [...host.querySelectorAll('[data-review-ref]')].find(x=>x.dataset.reviewRef===item.id);
   if(!card)continue;
   const old=card.querySelector('.st-image-suggestions');if(old)old.remove();
   const wrap=document.createElement('div');wrap.className='st-image-suggestions';
   const off=excluded.get(key)===true;
   const allowed=type==='local'||type==='integral';
   let html='';
   if(allowed){
    const proposal=recommend(item,catalogRows);
    const reason=proposal.status==='unassigned'?'Nessuna corrispondenza specifica':proposal.status==='candidate_strong'?'Candidato testuale forte':'Corrispondenza incerta';
    html='<strong>Collocazione proposta · '+esc(reason)+'</strong><small>'+esc(proposal.basis)+'</small>';
    for(const c of proposal.suggestions){
     html+='<p><b>'+esc(c.course_title)+'</b> → '+esc(c.module_title)+' → '+esc(c.unit_title)+' <small>('+esc(c.evidence.join('; ')||'titoli')+')</small></p>';
    }
    if(!proposal.suggestions.length)html+='<p>Da esaminare visivamente: non assegnata.</p>';
   }else html='<p>Estratto privato in verifica: nessuna associazione determinata.</p>';
   html+='<button type="button" data-image-exclude="'+esc(key)+'" data-image-kind="'+(type==='local'?'local':'private_pdf')+'" data-excluded="'+(off?'1':'0')+'">'+(off?'Ripristina nelle presentazioni':'Escludi dalle presentazioni')+'</button>';
   if(off)html+='<p>Attualmente esclusa; file originale conservato.</p>';
   wrap.innerHTML=html;card.appendChild(wrap);
  }
 }catch(err){if(turn===generation&&host.isConnected){const n=document.createElement('p');n.textContent='Suggerimenti non disponibili: '+(err?.message||err);host.prepend(n);}}
}
document.addEventListener('click',async e=>{
 const b=e.target.closest?.('[data-image-exclude]');if(!b)return;
 const key=b.dataset.imageExclude,kind=b.dataset.imageKind,value=b.dataset.excluded!=='1';
 const reason=window.prompt(value?'Motivo dell’esclusione (almeno 12 caratteri)':'Motivo del ripristino (almeno 12 caratteri)');
 if(reason===null)return;if(reason.trim().length<12){window.alert('Inserire una motivazione di almeno 12 caratteri.');return;}
 if(!window.confirm(value?'Escludere dalle slide senza cancellare il file originale?':'Ripristinare l’immagine?'))return;
 b.disabled=true;
 try{await setExclude(key,kind,value,reason.trim());b.dataset.excluded=value?'1':'0';b.textContent=value?'Ripristina nelle presentazioni':'Escludi dalle presentazioni';}
 catch(error){window.alert('Modifica non salvata: '+(error?.message||error));}
 finally{b.disabled=false;}
});
document.addEventListener('safety:auth-changed',()=>{catalog=null;excluded.clear();generation++;});
window.SAFETY_IMAGE_SUGGESTIONS_V26={recommend,decorate,tokens};
})();