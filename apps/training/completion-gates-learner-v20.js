/* SafetyTraining Completion Gates Learner v20 — read-only completion transparency. */
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

  async function refresh(){
    const st=cloud()?.state;if(state.busy||!st?.client||!st?.user||!st.assignments?.length)return;
    state.busy=true;
    try{
      const ids=st.assignments.map(a=>a.id).filter(Boolean);
      const {data,error}=await st.client.from('enrollments').select('id,status,progress_pct,metadata').in('id',ids);
      if(error)throw error;
      state.gates=new Map((data||[]).map(x=>[x.id,x.metadata?.completion_gate||null]));
      decorate();
    }catch(e){console.warn('[SafetyTraining Completion Gates] learner:',e?.message||e);}finally{state.busy=false;}
  }

  function decorate(){
    ensureStyle();const st=cloud()?.state;const cards=[...document.querySelectorAll('#cloudPanelBody .cloud-assignment')];if(!st?.assignments?.length||!cards.length)return;
    cards.forEach((card,index)=>{
      const assignment=st.assignments[index];if(!assignment)return;
      card.querySelector('.cloud-gate-line')?.remove();
      const gate=state.gates.get(assignment.id);if(!gate)return;
      const practicalRequired=Number(gate.practical_required||0),verificationRequired=Number(gate.verification_required||0);
      if(!practicalRequired&&!verificationRequired)return;
      const line=document.createElement('div');line.className='cloud-gate-line';
      const status=gate.completion_ready?'<span class="cloud-gate-ready">Requisiti completati</span>':gate.content_complete?'<span class="cloud-gate-pending">Contenuti completati · requisiti in attesa</span>':'<span>Requisiti di completamento</span>';
      line.innerHTML=`${status}${practicalRequired?`<span>Pratica <strong>${Number(gate.practical_completed||0)}/${practicalRequired}</strong></span>`:''}${verificationRequired?`<span>Verifiche <strong>${Number(gate.verification_completed||0)}/${verificationRequired}</strong></span>`:''}`;
      card.appendChild(line);
    });
  }

  async function boot(){
    ensureStyle();for(let i=0;i<40&&!cloud()?.state?.client;i++)await new Promise(r=>setTimeout(r,150));
    const body=document.getElementById('cloudPanelBody');if(body)new MutationObserver(()=>{decorate();window.setTimeout(refresh,100);}).observe(body,{childList:true,subtree:true});
    await refresh();state.timer=setInterval(refresh,15000);
    cloud()?.state?.client?.auth?.onAuthStateChange(()=>window.setTimeout(refresh,250));
  }
  window.SAFETY_LEARNER_GATES={refresh,state};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();