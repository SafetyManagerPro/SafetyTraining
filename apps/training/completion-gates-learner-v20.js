/* SafetyTraining v22.1 — completion gates without self-triggering MutationObserver loops. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const state={gates:new Map(),busy:false,timer:null};
  function ensureStyle(){
    if(document.getElementById('learnerGateStyle'))return;
    const s=document.createElement('style');s.id='learnerGateStyle';s.textContent=`
      .cloud-gate-line{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07);display:flex;flex-wrap:wrap;gap:6px 10px;font-size:11px;color:var(--muted)}.cloud-gate-line strong{color:#dfeaff}.cloud-gate-pending{color:#ffd08a;font-weight:800}.cloud-gate-ready{color:#a7f3db;font-weight:800}
    `;document.head.appendChild(s);
  }
  function decorate(){
    ensureStyle();
    const st=cloud()?.state,body=document.getElementById('cloudPanelBody');
    if(!st?.assignments?.length||!body)return;
    const byId=new Map(st.assignments.filter(a=>a.id).map(a=>[String(a.id),a]));
    body.querySelectorAll('.cloud-assignment[data-enrollment-id]').forEach(card=>{
      const assignment=byId.get(card.dataset.enrollmentId);
      const line=card.querySelector('.cloud-gate-line');
      const gate=assignment?state.gates.get(assignment.id):null;
      if(!gate){line?.remove();return;}
      const practicalRequired=Math.max(0,Number(gate.practical_required)||0);
      const verificationRequired=Math.max(0,Number(gate.verification_required)||0);
      if(!practicalRequired&&!verificationRequired){line?.remove();return;}
      const status=gate.completion_ready?'<span class="cloud-gate-ready">Requisiti completati</span>':gate.content_complete?'<span class="cloud-gate-pending">Contenuti completati · requisiti in attesa</span>':'<span>Requisiti di completamento</span>';
      const html=`${status}${practicalRequired?`<span>Pratica <strong>${Math.max(0,Number(gate.practical_completed)||0)}/${practicalRequired}</strong></span>`:''}${verificationRequired?`<span>Verifiche <strong>${Math.max(0,Number(gate.verification_completed)||0)}/${verificationRequired}</strong></span>`:''}`;
      if(line?.dataset.signature===html)return;
      const target=line||document.createElement('div');
      target.className='cloud-gate-line';target.innerHTML=html;target.dataset.signature=html;
      if(!line)card.appendChild(target);
    });
  }
  async function refresh(){
    const st=cloud()?.state;
    if(!st?.client||!st?.user||!st.assignments?.length){state.gates.clear();return;}
    if(document.getElementById('cloudOverlay')?.classList.contains('hidden')||state.busy)return;
    state.busy=true;
    try{
      const ids=st.assignments.map(a=>a.id).filter(Boolean);if(!ids.length)return;
      const {data,error}=await st.client.from('enrollments').select('id,status,progress_pct,metadata').in('id',ids);
      if(error)throw error;
      state.gates=new Map((data||[]).map(x=>[x.id,x.metadata?.completion_gate||null]));decorate();
    }catch(e){console.warn('[SafetyTraining Completion Gates] learner:',e?.message||e);}
    finally{state.busy=false;}
  }
  async function boot(){
    ensureStyle();
    for(let i=0;i<40&&!cloud()?.state?.client;i++)await new Promise(r=>setTimeout(r,150));
    document.addEventListener('safety:cloud-panel-rendered',()=>{decorate();void refresh();});
    await refresh();
    state.timer=setInterval(refresh,30000);
    cloud()?.state?.client?.auth?.onAuthStateChange(()=>window.setTimeout(refresh,250));
  }
  window.SAFETY_LEARNER_GATES={refresh,state};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
