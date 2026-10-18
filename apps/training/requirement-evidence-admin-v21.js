/* SafetyTraining Completion Gates Admin v22.008 — evidence writes through backend RPC + Practice Lab rubric. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const arr=v=>Array.isArray(v)?v:[];
  const state={openEnrollmentId:null};

  function ensureStyle(){
    if(document.getElementById('gateAdminStyle'))return;
    const s=document.createElement('style');s.id='gateAdminStyle';s.textContent=`
      .gate-admin-overlay{position:fixed;inset:0;z-index:1400;background:rgba(2,8,18,.82);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px}.gate-admin-overlay.hidden{display:none!important}.gate-admin-modal{width:min(980px,100%);max-height:92vh;overflow:auto;background:#121c30;border:1px solid rgba(255,255,255,.13);border-radius:20px;padding:20px;box-shadow:0 28px 90px rgba(0,0,0,.5)}.gate-admin-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.gate-admin-head h2{margin:4px 0 0}.gate-admin-close{border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:10px;width:38px;height:38px;font-size:24px}.gate-admin-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:16px 0}.gate-admin-stat{padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:#0c1728}.gate-admin-stat strong{display:block;font-size:19px}.gate-admin-stat span{font-size:11px;color:var(--muted)}.gate-admin-list{display:grid;gap:10px}.gate-admin-item{padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:#0e192b}.gate-admin-item-head{display:flex;justify-content:space-between;gap:12px}.gate-admin-item h3{margin:0 0 5px;font-size:15px}.gate-admin-meta{font-size:11px;color:var(--muted)}.gate-admin-status{font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.08);white-space:nowrap}.gate-admin-status.completed{background:rgba(75,210,155,.16);color:#baf5dd}.gate-admin-status.failed{background:rgba(255,110,110,.15);color:#ffc0c0}.gate-admin-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.gate-admin-note{margin:8px 0 0;font-size:12px;color:var(--muted);line-height:1.45}.gate-admin-message{min-height:20px;margin-top:12px;color:var(--muted);font-size:12px}.gate-v22-rubric{margin-top:11px;border:1px solid rgba(77,211,168,.18);border-radius:11px;background:rgba(77,211,168,.035);overflow:hidden}.gate-v22-rubric summary{cursor:pointer;padding:10px 11px;font-size:12px;font-weight:850;color:#baf5dd}.gate-v22-rubric-body{padding:0 11px 11px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.gate-v22-rubric section{padding:9px;border:1px solid rgba(255,255,255,.07);border-radius:9px;background:rgba(255,255,255,.02)}.gate-v22-rubric h4{margin:0 0 5px;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.gate-v22-rubric ul{margin:0;padding-left:17px}.gate-v22-rubric li{font-size:11px;line-height:1.4;margin:3px 0}.gate-v22-warn{color:#ffd391}.gate-v22-source{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.gate-v22-source a{font-size:10px;color:#b9d7ff}.gate-v22-physical{margin:7px 0;padding:8px 9px;border-radius:9px;background:rgba(255,180,82,.08);border:1px solid rgba(255,180,82,.2);font-size:11px;color:#ffd391}@media(max-width:700px){.gate-admin-summary{grid-template-columns:1fr 1fr}.gate-admin-item-head{display:grid}.gate-v22-rubric-body{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function ensureModal(){
    ensureStyle();if(document.getElementById('gateAdminOverlay'))return;
    const ov=document.createElement('div');ov.id='gateAdminOverlay';ov.className='gate-admin-overlay hidden';ov.innerHTML=`<section class="gate-admin-modal" role="dialog" aria-modal="true" aria-labelledby="gateAdminTitle"><div class="gate-admin-head"><div><div class="admin-kicker">GATE DI COMPLETAMENTO</div><h2 id="gateAdminTitle">Requisiti iscrizione</h2></div><button class="gate-admin-close" type="button">×</button></div><div id="gateAdminBody"></div><div id="gateAdminMessage" class="gate-admin-message"></div></section>`;
    ov.addEventListener('click',e=>{if(e.target===ov)closeModal();});ov.querySelector('.gate-admin-close').onclick=closeModal;document.body.appendChild(ov);
  }
  function closeModal(){window.SAFETY_MODAL_ACCESS?.closed(document.getElementById('gateAdminOverlay'));document.getElementById('gateAdminOverlay')?.classList.add('hidden');state.openEnrollmentId=null;}
  function msg(text){const el=document.getElementById('gateAdminMessage');if(el)el.textContent=text||'';}

  async function loadEnrollment(id){
    const client=db();if(!client)throw new Error('Cloud non disponibile');
    const {data:en,error}=await client.from('enrollments').select('id,edition_id,learner_id,status,progress_pct,final_score_pct,metadata').eq('id',id).single();if(error)throw error;
    const [{data:ed,error:ee},{data:learner,error:le}]=await Promise.all([
      client.from('course_editions').select('id,course_version_id,title,organization_id,company_id').eq('id',en.edition_id).single(),
      client.from('learners').select('id,first_name,last_name,email').eq('id',en.learner_id).single()
    ]);if(ee)throw ee;if(le)throw le;
    const {data:cv,error:ce}=await client.from('course_versions').select('id,course_id,version_number,status').eq('id',ed.course_version_id).single();if(ce)throw ce;
    const {data:course,error:coe}=await client.from('courses').select('id,stable_key,title').eq('id',cv.course_id).single();if(coe)throw coe;
    const [{data:practical,error:pe},{data:verification,error:ve},{data:evidence,error:ev}]=await Promise.all([
      client.from('course_practical_requirements').select('id,requirement_key,title,nominal_minutes,required,completion_mode,metadata').eq('course_id',course.id).eq('required',true).order('created_at'),
      client.from('course_verification_requirements').select('id,requirement_key,title,verification_mode,selected_mode,minimum_questions,passing_score_pct,required,completion_mode,metadata').eq('course_version_id',cv.id).eq('required',true).order('created_at'),
      client.from('enrollment_requirement_evidence').select('id,requirement_kind,practical_requirement_id,verification_requirement_id,requirement_key,status,completion_mode,completed_at,evidence,recorded_by,updated_at').eq('enrollment_id',en.id)
    ]);if(pe)throw pe;if(ve)throw ve;if(ev)throw ev;
    const labKeys=[...new Set((practical||[]).flatMap(r=>arr(r.metadata?.v22_practice_lab_keys)).concat((practical||[]).map(r=>r.metadata?.practice_lab_key).filter(Boolean)))];
    let practiceLabsByKey=new Map();
    if(labKeys.length){
      const {data:labs,error:labError}=await client.from('practice_labs_v22').select('stable_key,title,lab_type,objective,briefing,steps,checklist,critical_errors,stop_conditions,media,sources,requires_physical_validation').in('stable_key',labKeys).eq('active',true);
      if(labError)throw labError;practiceLabsByKey=new Map((labs||[]).map(l=>[l.stable_key,l]));
    }
    return {en,ed,learner,cv,course,practical:practical||[],verification:verification||[],evidence:evidence||[],practiceLabsByKey};
  }

  const evidenceFor=(x,kind,req)=>x.evidence.find(e=>e.requirement_kind===kind&&e.requirement_key===req.requirement_key);
  const statusLabel=e=>e?.status==='completed'?'COMPLETATO':e?.status==='failed'?'NON SUPERATO':e?.status==='revoked'?'REVOCATO':'IN ATTESA';

  async function openGate(id){
    ensureModal();state.openEnrollmentId=id;document.getElementById('gateAdminOverlay').classList.remove('hidden');window.SAFETY_MODAL_ACCESS?.opened(document.getElementById('gateAdminOverlay'),closeModal);document.getElementById('gateAdminBody').innerHTML='<div class="admin-loading">Caricamento requisiti…</div>';msg('');
    try{render(await loadEnrollment(id));}catch(e){document.getElementById('gateAdminBody').innerHTML=`<div class="admin-error">${esc(e.message)}</div>`;}
  }

  function render(x){
    const body=document.getElementById('gateAdminBody');if(!body)return;
    const gate=x.en.metadata?.completion_gate||{};const learner=`${x.learner.first_name||''} ${x.learner.last_name||''}`.trim()||x.learner.email||'Corsista';
    document.getElementById('gateAdminTitle').textContent=`${learner} · ${x.course.title}`;
    const rows=[];
    x.practical.forEach(r=>{const e=evidenceFor(x,'practical',r);rows.push({kind:'practical',r,e,external:true,label:'Pratica / addestramento'});});
    x.verification.forEach(r=>{const e=evidenceFor(x,'verification',r);const platform=r.selected_mode==='test'&&r.completion_mode!=='external';rows.push({kind:'verification',r,e,external:!platform,label:platform?'Test piattaforma':'Verifica esterna'});});
    body.innerHTML=`<div class="gate-admin-summary">
      <div class="gate-admin-stat"><strong>${Number(x.en.progress_pct||0).toFixed(0)}%</strong><span>contenuti</span></div>
      <div class="gate-admin-stat"><strong>${gate.practical_completed??0}/${gate.practical_required??x.practical.length}</strong><span>pratiche</span></div>
      <div class="gate-admin-stat"><strong>${gate.verification_completed??0}/${gate.verification_required??x.verification.length}</strong><span>verifiche</span></div>
      <div class="gate-admin-stat"><strong>${esc(x.en.status)}</strong><span>stato iscrizione</span></div>
    </div>
    <div class="gate-admin-list">${rows.length?rows.map((it,i)=>itemHtml(x,it,i)).join(''):'<div class="admin-note">Nessun gate aggiuntivo richiesto per questa versione corso.</div>'}</div>`;
    body.querySelectorAll('[data-practice-form]').forEach(b=>b.onclick=()=>{
      const req=x.practical[Number(b.dataset.practiceForm)],labKey=b.dataset.labKey;
      if(req&&labKey)window.SAFETY_PRACTICE_FORMS_V22?.open?.(x.en.id,req.requirement_key,labKey);
    });
    body.querySelectorAll('[data-gate-complete]').forEach(b=>b.onclick=()=>setEvidence(x,Number(b.dataset.gateComplete),'completed'));
    body.querySelectorAll('[data-gate-fail]').forEach(b=>b.onclick=()=>setEvidence(x,Number(b.dataset.gateFail),'failed'));
    body.querySelectorAll('[data-gate-reset]').forEach(b=>b.onclick=()=>resetEvidence(x,Number(b.dataset.gateReset)));
  }

  function labRubricHtml(x,r){
    const keys=[...new Set(arr(r.metadata?.v22_practice_lab_keys).concat(r.metadata?.practice_lab_key?[r.metadata.practice_lab_key]:[]))];
    const labs=keys.map(k=>x.practiceLabsByKey.get(k)).filter(Boolean);if(!labs.length)return '';
    return labs.map(l=>`<details class="gate-v22-rubric"><summary>Checklist v22 · ${esc(l.title)}</summary><div class="gate-v22-rubric-body"><section><h4>Sequenza</h4>${listHtml(l.steps)}</section><section><h4>Checklist osservabile</h4>${listHtml(l.checklist)}</section><section><h4>Errori critici</h4>${listHtml(l.critical_errors,'gate-v22-warn')}</section><section><h4>Condizioni di stop</h4>${listHtml(l.stop_conditions,'gate-v22-warn')}</section></div>${l.requires_physical_validation?'<div class="gate-v22-physical">La competenza manuale deve essere osservata dal docente/istruttore prima di registrare l’evidenza.</div>':''}${resourceHtml(arr(l.media).concat(arr(l.sources)))}</details>`).join('');
  }
  function listHtml(items,cls=''){return arr(items).length?`<ul class="${cls}">${arr(items).map(v=>`<li>${esc(typeof v==='string'?v:(v?.title||v?.label||JSON.stringify(v)))}</li>`).join('')}</ul>`:'<span class="gate-admin-meta">—</span>';}
  function resourceHtml(items){const rows=arr(items).filter(x=>x?.url);return rows.length?`<div class="gate-v22-source">${rows.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(x.title||'Risorsa')}</a>`).join('')}</div>`:'';}

  function itemHtml(x,it,index){
    const r=it.r,e=it.e;const meta=[];
    if(r.nominal_minutes!=null)meta.push(`${r.nominal_minutes} min`);
    if(r.selected_mode)meta.push(`modalità: ${r.selected_mode}`);else if(r.verification_mode)meta.push(`modalità: ${r.verification_mode}`);
    if(r.minimum_questions)meta.push(`${r.minimum_questions} domande`);
    if(r.passing_score_pct!=null)meta.push(`soglia ${r.passing_score_pct}%`);
    const note=e?.evidence?.note?`<p class="gate-admin-note">Nota: ${esc(e.evidence.note)}</p>`:'';
    const rubric=it.kind==='practical'?labRubricHtml(x,r):'';
    const labKeys=it.kind==='practical'?[...new Set(arr(r.metadata?.v22_practice_lab_keys).concat(r.metadata?.practice_lab_key?[r.metadata.practice_lab_key]:[]))].filter(key=>x.practiceLabsByKey.has(key)):[];
    const formActions=labKeys.length?'<div class="gate-admin-actions">'+labKeys.map(key=>'<button class="admin-row-btn" type="button" data-practice-form="'+index+'" data-lab-key="'+esc(key)+'">+ Procedura guidata / checklist compilabile · '+esc(x.practiceLabsByKey.get(key).title)+'</button>').join('')+'</div>':'';

    return `<article class="gate-admin-item" data-gate-index="${index}"><div class="gate-admin-item-head"><div><span class="gate-admin-meta">${esc(it.label)}</span><h3>${esc(r.title)}</h3><div class="gate-admin-meta">${esc(meta.join(' · ')||r.completion_mode)}</div></div><span class="gate-admin-status ${esc(e?.status||'pending')}">${statusLabel(e)}</span></div>${rubric}${formActions}${note}${it.external?`<div class="gate-admin-actions">${e?.status==='completed'?`<button class="admin-row-btn danger" type="button" data-gate-reset="${index}">Revoca evidenza</button>`:`<button class="admin-row-btn" type="button" data-gate-complete="${index}">${it.kind==='practical'?'Valida pratica':'Segna completato'}</button>${it.kind==='verification'?`<button class="admin-row-btn danger" type="button" data-gate-fail="${index}">Segna non superato</button>`:''}`}</div>`:`<p class="gate-admin-note">Esito gestito automaticamente dal Test Builder: non è modificabile manualmente da questo pannello.</p>`}</article>`;
  }

  async function saveEvidenceRpc(x,it,status,note){
    const {data,error}=await db().rpc('admin_set_requirement_evidence',{
      p_enrollment_id:x.en.id,
      p_requirement_kind:it.kind,
      p_requirement_key:it.r.requirement_key,
      p_status:status,
      p_note:note||null
    });
    if(error)throw error;
    return data;
  }

  async function setEvidence(x,index,status){
    const rows=[...x.practical.map(r=>({kind:'practical',r})),...x.verification.map(r=>({kind:'verification',r}))];const it=rows[index];if(!it)return;
    const label=it.kind==='practical'?'Nota della valutazione pratica (es. data, docente, esito checklist, criticità):':status==='completed'?'Nota/evidenza opzionale (es. verbale, data prova, docente):':'Nota opzionale sul mancato superamento:';
    const note=prompt(label,'');if(note===null)return;
    try{
      await saveEvidenceRpc(x,it,status,note.trim()||null);
      msg('Evidenza registrata. Lo stato del corso è stato ricalcolato automaticamente.');render(await loadEnrollment(x.en.id));
    }catch(error){alert(error.message);}
  }

  async function resetEvidence(x,index){
    const rows=[...x.practical.map(r=>({kind:'practical',r})),...x.verification.map(r=>({kind:'verification',r}))];const it=rows[index];if(!it)return;if(!confirm('Revocare questa evidenza? Il completamento del corso verrà ricalcolato.'))return;
    try{
      await saveEvidenceRpc(x,it,'revoked','Evidenza revocata da amministrazione');
      msg('Evidenza revocata.');render(await loadEnrollment(x.en.id));
    }catch(error){alert(error.message);}
  }

  function enhance(){
    if(document.getElementById('adminTitle')?.textContent!=='Iscrizioni')return;
    const host=document.getElementById('adminContent');if(!host)return;
    host.querySelectorAll('button[data-action="revoke"],button[data-action="restore"]').forEach(anchor=>{
      const cell=anchor.closest('td');if(!cell||cell.querySelector('[data-completion-gates]'))return;
      const b=document.createElement('button');b.type='button';b.className='admin-row-btn';b.dataset.completionGates='1';b.textContent='Gate';b.onclick=e=>{e.preventDefault();e.stopPropagation();openGate(anchor.dataset.id);};cell.insertBefore(b,anchor);
    });
  }
  function scheduleEnhance(){[0,80,220,500,1000].forEach(ms=>setTimeout(enhance,ms));}

  async function boot(){
    ensureModal();for(let i=0;i<40&&!document.getElementById('adminShell');i++)await new Promise(r=>setTimeout(r,150));
    const shell=document.getElementById('adminShell');if(!shell)return;
    shell.querySelector('.admin-nav')?.addEventListener('click',scheduleEnhance);
    document.getElementById('adminRefresh')?.addEventListener('click',scheduleEnhance);
    document.getElementById('adminConsoleBtn')?.addEventListener('click',scheduleEnhance);
    document.addEventListener('click',e=>{if(e.target.closest('[data-action="revoke"],[data-action="restore"],[data-tab="enrollments"]'))scheduleEnhance();},true);
    scheduleEnhance();document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  }
  window.SAFETY_COMPLETION_GATES={openGate,closeModal,scheduleEnhance,version:'22.008'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
