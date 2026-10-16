/* SafetyTraining v21 — governance filter for SafetyManager course mapping selector. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const state={allowed:null,loading:null,lastLoadedAt:0};
  const asBool=v=>v===true||v==='true';

  async function loadAllowed(force=false){
    if(!db())return new Set();
    const fresh=Date.now()-state.lastLoadedAt<30000;
    if(state.allowed&&!force&&fresh)return state.allowed;
    if(state.loading&&!force)return state.loading;
    state.loading=(async()=>{
      const [{data:courses,error:ce},{data:versions,error:ve}]=await Promise.all([
        db().from('courses').select('id,active,metadata').eq('active',true),
        db().from('course_versions').select('course_id,status,syllabus_snapshot').eq('status','published')
      ]);
      if(ce)throw ce;if(ve)throw ve;
      const ready=new Set((versions||[]).filter(v=>asBool(v.syllabus_snapshot?.finalization_candidate)&&asBool(v.syllabus_snapshot?.go_live_ready)).map(v=>v.course_id));
      state.allowed=new Set((courses||[]).filter(c=>{
        const m=c.metadata||{};
        return ready.has(c.id)
          && !asBool(m.frozen)
          && !asBool(m.exclude_from_finalization_queue)
          && m.finalization_scope!=='reference_library'
          && !asBool(m.source_placeholder);
      }).map(c=>c.id));
      state.lastLoadedAt=Date.now();
      return state.allowed;
    })().finally(()=>{state.loading=null;});
    return state.loading;
  }

  async function apply(){
    if(document.getElementById('adminTitle')?.textContent!=='Catalogo corsi SafetyManager')return;
    const host=document.getElementById('adminContent');if(!host)return;
    const selects=[...host.querySelectorAll('select[data-map]')];if(!selects.length)return;
    try{
      const allowed=await loadAllowed();
      let removed=0;
      selects.forEach(select=>{
        [...select.options].slice(1).forEach(option=>{
          if(!allowed.has(option.value)){option.remove();removed++;}
        });
        select.dataset.governanceFiltered='true';
      });
      let note=document.getElementById('smCatalogGovernanceNote');
      if(!note){
        note=document.createElement('div');note.id='smCatalogGovernanceNote';note.className='admin-note';
        const card=[...host.querySelectorAll('.admin-card')].find(x=>x.querySelector('h2')?.textContent==='Corsi SafetyManager');
        card?.insertBefore(note,card.children[1]||null);
      }
      if(note)note.textContent=`Selettore governance v21: mostra solo percorsi pubblicati, finalizzati e go-live; corsi congelati, placeholder o librerie interne sono esclusi.${removed?` ${removed} opzioni legacy/non idonee rimosse dalla vista.`:''}`;
    }catch(error){console.warn('[SafetyManager catalog governance]',error?.message||error);}
  }

  function boot(){
    const root=document.getElementById('adminShell')||document.body;
    new MutationObserver(()=>setTimeout(apply,30)).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target.closest('[data-sm-course-catalog]'))setTimeout(()=>{state.lastLoadedAt=0;apply();},80);});
    apply();
  }
  window.SAFETY_SM_CATALOG_GOVERNANCE={apply,refresh:()=>loadAllowed(true),version:'21.1'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
