/* SafetyTraining — strict approved course-version selector for new editions. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let running=false,timer=null;

  function roleLabel(value){
    if(value==='employer')return 'Datore';
    if(value==='manager')return 'Dirigente';
    return value?String(value):'';
  }
  const isCandidate=v=>v?.syllabus_snapshot?.finalization_candidate===true||v?.syllabus_snapshot?.finalization_candidate==='true';
  const isGoLiveReady=v=>v?.syllabus_snapshot?.go_live_ready===true||v?.syllabus_snapshot?.go_live_ready==='true';

  async function refresh(){
    if(running||!db())return;
    if(document.getElementById('adminTitle')?.textContent?.trim()!=='Edizioni')return;
    const select=document.querySelector('#editionForm select[name="course_version_id"]');
    if(!select||select.dataset.safeVersions==='ready')return;
    running=true;
    select.dataset.safeVersions='loading';
    try{
      const [{data:courses,error:ce},{data:versions,error:ve}]=await Promise.all([
        db().from('courses').select('id,title,stable_key,active,metadata').eq('active',true).order('title'),
        db().from('course_versions').select('id,course_id,version_number,status,syllabus_snapshot,created_at').eq('status','published').order('version_number',{ascending:false})
      ]);
      if(ce||ve)throw ce||ve;
      const eligible=(courses||[]).filter(c=>{
        const m=c.metadata||{};
        return m.frozen!==true&&String(m.frozen)!=='true'&&m.exclude_from_finalization_queue!==true&&String(m.exclude_from_finalization_queue)!=='true'&&m.finalization_scope!=='reference_library';
      });
      const byCourse=new Map();
      (versions||[]).forEach(v=>{if(!byCourse.has(v.course_id))byCourse.set(v.course_id,[]);byCourse.get(v.course_id).push(v);});
      const options=[];
      eligible.forEach(c=>{
        const approved=(byCourse.get(c.id)||[]).filter(v=>isCandidate(v)&&isGoLiveReady(v));
        approved.sort((a,b)=>Number(a.version_number)-Number(b.version_number)).forEach(v=>options.push({course:c,version:v}));
      });
      options.sort((a,b)=>a.course.title.localeCompare(b.course.title,'it')||Number(a.version.version_number)-Number(b.version.version_number));
      const current=select.value;
      select.innerHTML='<option value="">Corso / versione approvata…</option>'+options.map(({course,version})=>{
        const role=roleLabel(version.syllabus_snapshot?.role_variant);
        const suffix=role?` · ${role}`:` · v${version.version_number}`;
        return `<option value="${version.id}" data-approved="true">${esc(course.title)}${esc(suffix)} · approvata</option>`;
      }).join('');
      if([...select.options].some(o=>o.value===current))select.value=current;
      select.dataset.safeVersions='ready';
      select.disabled=options.length===0;
      let hint=document.getElementById('editionVersionHint');
      if(!hint){hint=document.createElement('p');hint.id='editionVersionHint';hint.className='admin-note';select.closest('form')?.appendChild(hint);}
      hint.textContent=options.length
        ? `${options.length} versioni approvate disponibili. Per le nuove edizioni non vengono proposte versioni legacy, corsi congelati o librerie interne.`
        : 'Nessuna versione approvata disponibile per una nuova edizione.';
      document.dispatchEvent(new CustomEvent('safety:approved-versions-ready',{detail:{count:options.length}}));
    }catch(e){
      select.dataset.safeVersions='error';
      select.disabled=true;
      console.warn('[Edition version selector]',e?.message||e);
    }finally{running=false;}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,80);}
  async function boot(){for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,200));new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();}
  window.SAFETY_EDITION_VERSION_SELECTOR={refresh:()=>{const s=document.querySelector('#editionForm select[name="course_version_id"]');if(s){s.removeAttribute('data-safe-versions');s.disabled=false;}schedule();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
