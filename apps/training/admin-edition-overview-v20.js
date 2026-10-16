/* SafetyTraining — edition operational overview. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const state={running:false,timer:null};

  function ensureStyle(){
    if(document.getElementById('editionOverviewStyles'))return;
    const s=document.createElement('style');s.id='editionOverviewStyles';s.textContent=`
      .edition-stats{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.edition-stat{font-size:.7rem;font-weight:700;padding:.18rem .42rem;border-radius:999px;background:#eef2f7;color:#475569}.edition-stat.ok{background:#dcfce7;color:#166534}.edition-stat.run{background:#dbeafe;color:#1d4ed8}.edition-stat.wait{background:#fef3c7;color:#92400e}.edition-manage{margin-left:.35rem}
    `;document.head.appendChild(s);
  }

  async function data(){
    const client=db();if(!client)return null;
    const [{data:en,error:ee},{data:learners,error:le},{data:invites,error:ie}]=await Promise.all([
      client.from('enrollments').select('id,edition_id,learner_id,status,progress_pct'),
      client.from('learners').select('id,auth_user_id'),
      client.from('learner_account_invitations').select('learner_id,status')
    ]);
    if(ee||le||ie)return null;
    return {en:en||[],learners:new Map((learners||[]).map(x=>[x.id,x])),invites:new Map((invites||[]).map(x=>[x.learner_id,x]))};
  }

  function statsFor(editionId,d){
    const rows=d.en.filter(x=>x.edition_id===editionId&&x.status!=='revoked');
    let account=0,completed=0,running=0,notStarted=0;
    rows.forEach(x=>{
      const l=d.learners.get(x.learner_id),inv=d.invites.get(x.learner_id);
      if(l?.auth_user_id||inv?.status==='accepted')account++;
      if(['completed','passed'].includes(x.status))completed++;
      else if(x.status==='in_progress'||Number(x.progress_pct||0)>0)running++;
      else notStarted++;
    });
    return {total:rows.length,account,completed,running,notStarted};
  }

  function manageEdition(editionId){
    const tab=document.querySelector('[data-tab="enrollments"]');
    if(!tab)return;
    tab.click();
    let tries=0;
    const timer=setInterval(()=>{
      const select=document.getElementById('bulkEdition');
      if(select){clearInterval(timer);if([...select.options].some(o=>o.value===editionId)){select.value=editionId;select.dispatchEvent(new Event('change',{bubbles:true}));select.scrollIntoView({behavior:'smooth',block:'center'});}}
      else if(++tries>20)clearInterval(timer);
    },150);
  }

  async function enhance(){
    if(state.running||!db())return;
    if(document.getElementById('adminTitle')?.textContent?.trim()!=='Edizioni')return;
    const host=document.getElementById('adminContent');if(!host)return;
    state.running=true;
    try{
      const d=await data();if(!d)return;
      [...host.querySelectorAll('.admin-table tbody tr')].forEach(row=>{
        const action=row.querySelector('[data-action="edit"], [data-action="toggle"]');
        const id=action?.dataset?.id;if(!id)return;
        const st=statsFor(id,d),sig=`${st.total}|${st.account}|${st.completed}|${st.running}|${st.notStarted}`;
        if(row.dataset.editionStats===sig)return;row.dataset.editionStats=sig;
        const first=row.querySelector('td');
        first?.querySelector('.edition-stats')?.remove();
        if(first){const box=document.createElement('div');box.className='edition-stats';box.innerHTML=`<span class="edition-stat">👥 ${st.total} iscritti</span><span class="edition-stat ok">🔐 ${st.account} account</span><span class="edition-stat wait">○ ${st.notStarted} da iniziare</span><span class="edition-stat run">▶ ${st.running} in corso</span><span class="edition-stat ok">✓ ${st.completed} completati</span>`;first.appendChild(box);}
        const last=row.querySelector('td:last-child');
        last?.querySelector('.edition-manage')?.remove();
        if(last){const b=document.createElement('button');b.type='button';b.className='admin-row-btn edition-manage';b.textContent='Gestisci corsisti';b.onclick=()=>manageEdition(id);last.appendChild(b);}
      });
    }finally{state.running=false;}
  }

  function schedule(){clearTimeout(state.timer);state.timer=setTimeout(enhance,120);}
  async function boot(){ensureStyle();for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,200));new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();}
  window.SAFETY_EDITION_OVERVIEW={refresh:schedule};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
