/* SafetyTraining — bulk enrollment + optional learner invitations. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state={running:false,timer:null};

  function style(){
    if(document.getElementById('bulkEnrollStyles'))return;
    const s=document.createElement('style');s.id='bulkEnrollStyles';s.textContent=`
      .bulk-enroll-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(260px,2fr);gap:14px;align-items:start}.bulk-enroll-list{border:1px solid #dbe3ee;border-radius:12px;max-height:340px;overflow:auto;background:#fff}.bulk-enroll-item{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #eef2f7}.bulk-enroll-item:last-child{border-bottom:0}.bulk-enroll-item small{display:block;color:#64748b;margin-top:2px}.bulk-enroll-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}.bulk-enroll-actions label{display:flex;align-items:center;gap:6px;font-weight:600}.bulk-summary{padding:10px 12px;border-radius:10px;background:#f8fafc;color:#475569;margin:10px 0}.bulk-account{font-size:.72rem;padding:.15rem .45rem;border-radius:999px;background:#e5e7eb}.bulk-account.ok{background:#dcfce7;color:#166534}.bulk-account.wait{background:#dbeafe;color:#1d4ed8}@media(max-width:800px){.bulk-enroll-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  async function loadData(){
    const client=db();if(!client)return null;
    const [{data:editions,error:ee},{data:versions,error:ve},{data:courses,error:ce},{data:learners,error:le},{data:enrollments,error:ene},{data:invites,error:ie}]=await Promise.all([
      client.from('course_editions').select('id,organization_id,company_id,course_version_id,title,status').eq('status','open').order('created_at',{ascending:false}),
      client.from('course_versions').select('id,course_id,version_number'),
      client.from('courses').select('id,title'),
      client.from('learners').select('id,organization_id,company_id,first_name,last_name,email,auth_user_id,active').eq('active',true).order('last_name'),
      client.from('enrollments').select('id,edition_id,learner_id,status'),
      client.from('learner_account_invitations').select('learner_id,status')
    ]);
    const error=ee||ve||ce||le||ene||ie;if(error)throw error;
    return {editions:editions||[],versions:versions||[],courses:courses||[],learners:learners||[],enrollments:enrollments||[],invites:invites||[]};
  }

  function accountLabel(learner,invite){
    if(learner.auth_user_id||invite?.status==='accepted')return ['Account attivo','ok'];
    if(invite?.status==='sent')return ['Invitato','wait'];
    return ['Da invitare',''];
  }

  async function renderCard(){
    if(state.running||!db())return;
    const host=document.getElementById('adminContent');
    if(!host||document.getElementById('bulkEnrollmentCard')||document.getElementById('adminTitle')?.textContent?.trim()!=='Iscrizioni')return;
    state.running=true;
    try{
      const data=await loadData();if(!data)return;
      const vm=new Map(data.versions.map(v=>[v.id,v])),cm=new Map(data.courses.map(c=>[c.id,c.title]));
      const card=document.createElement('section');card.id='bulkEnrollmentCard';card.className='admin-card';
      card.innerHTML=`<h2>Iscrizione multipla</h2><p class="admin-note">Assegna un'edizione a più corsisti compatibili e, se vuoi, invia subito gli accessi alla piattaforma.</p>
        <div class="bulk-enroll-grid"><div><label><strong>Edizione</strong><select id="bulkEdition" class="admin-input"><option value="">Seleziona edizione…</option>${data.editions.map(e=>{const v=vm.get(e.course_version_id);return `<option value="${e.id}">${esc(e.title||cm.get(v?.course_id)||'Edizione')} · v${esc(v?.version_number||'')}</option>`;}).join('')}</select></label><div id="bulkSummary" class="bulk-summary">Seleziona un'edizione.</div></div><div><div class="bulk-enroll-actions" style="margin-top:0"><button type="button" id="bulkSelectAll" class="admin-row-btn">Seleziona tutti</button><button type="button" id="bulkClear" class="admin-row-btn">Deseleziona</button></div><div id="bulkLearners" class="bulk-enroll-list"><div class="bulk-enroll-item">Nessuna edizione selezionata.</div></div></div></div>
        <div class="bulk-enroll-actions"><label><input id="bulkInvite" type="checkbox" checked> Invita gli account non ancora attivi</label><button id="bulkSubmit" type="button">Iscrivi selezionati</button><span id="bulkResult" class="admin-note"></span></div>`;
      host.insertBefore(card,host.firstChild);

      const editionSelect=card.querySelector('#bulkEdition'),list=card.querySelector('#bulkLearners'),summary=card.querySelector('#bulkSummary');
      const invites=new Map(data.invites.map(x=>[x.learner_id,x]));
      function draw(){
        const ed=data.editions.find(x=>x.id===editionSelect.value);
        if(!ed){list.innerHTML='<div class="bulk-enroll-item">Nessuna edizione selezionata.</div>';summary.textContent='Seleziona un’edizione.';return;}
        const existing=new Set(data.enrollments.filter(x=>x.edition_id===ed.id).map(x=>x.learner_id));
        const eligible=data.learners.filter(l=>l.organization_id===ed.organization_id&&(!ed.company_id||l.company_id===ed.company_id));
        const available=eligible.filter(l=>!existing.has(l.id));
        summary.textContent=`${eligible.length} corsisti compatibili · ${existing.size} già presenti · ${available.length} disponibili`;
        list.innerHTML=available.map(l=>{const [label,cls]=accountLabel(l,invites.get(l.id));const name=`${l.last_name||''} ${l.first_name||''}`.trim()||l.email||'Corsista';return `<label class="bulk-enroll-item"><input type="checkbox" data-learner="${l.id}"><span><strong>${esc(name)}</strong><small>${esc(l.email||'Email non disponibile')}</small></span><span class="bulk-account ${cls}">${esc(label)}</span></label>`;}).join('')||'<div class="bulk-enroll-item">Nessun nuovo corsista compatibile da iscrivere.</div>';
      }
      editionSelect.onchange=draw;
      card.querySelector('#bulkSelectAll').onclick=()=>list.querySelectorAll('input[type="checkbox"]').forEach(x=>x.checked=true);
      card.querySelector('#bulkClear').onclick=()=>list.querySelectorAll('input[type="checkbox"]').forEach(x=>x.checked=false);
      card.querySelector('#bulkSubmit').onclick=async()=>{
        const ed=data.editions.find(x=>x.id===editionSelect.value);if(!ed)return alert('Seleziona un’edizione.');
        const ids=[...list.querySelectorAll('input[data-learner]:checked')].map(x=>x.dataset.learner);if(!ids.length)return alert('Seleziona almeno un corsista.');
        const submit=card.querySelector('#bulkSubmit'),result=card.querySelector('#bulkResult'),shouldInvite=card.querySelector('#bulkInvite').checked;
        submit.disabled=true;result.textContent='Iscrizione in corso…';
        try{
          const payload=ids.map(id=>({edition_id:ed.id,learner_id:id,status:'not_started',metadata:{enrollment_source:'admin_bulk_v20'}}));
          const {error}=await db().from('enrollments').insert(payload);if(error)throw error;
          let invited=0,inviteFailed=0;
          if(shouldInvite){
            const queue=ids.map(id=>data.learners.find(l=>l.id===id)).filter(l=>l&&!l.auth_user_id&&l.email);
            for(let i=0;i<queue.length;i+=5){
              const batch=queue.slice(i,i+5);
              const results=await Promise.all(batch.map(l=>db().functions.invoke('invite-learner',{body:{learner_id:l.id,redirect_to:new URL('?onboarding=1',location.href).toString()}})));
              results.forEach(r=>{if(r.error||r.data?.error)inviteFailed++;else invited++;});
            }
          }
          result.textContent=`${ids.length} iscritti${shouldInvite?` · ${invited} inviti inviati${inviteFailed?` · ${inviteFailed} inviti da verificare`:''}`:''}.`;
          setTimeout(()=>document.getElementById('adminRefresh')?.click(),700);
        }catch(error){result.textContent=`Errore: ${error?.message||error}`;submit.disabled=false;}
      };
    }catch(error){console.warn('[Bulk enrollment]',error?.message||error);}finally{state.running=false;}
  }

  function schedule(){clearTimeout(state.timer);state.timer=setTimeout(renderCard,120);}
  async function boot(){style();for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,200));new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();}
  window.SAFETY_BULK_ENROLLMENT={refresh:()=>{document.getElementById('bulkEnrollmentCard')?.remove();schedule();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
