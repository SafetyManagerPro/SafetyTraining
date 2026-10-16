/* SafetyTraining — safe course-version selector for new editions. */
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

  async function refresh(){
    if(running||!db())return;
    if(document.getElementById('adminTitle')?.textContent?.trim()!=='Edizioni')return;
    const select=document.querySelector('#editionForm select[name="course_version_id"]');
    if(!select||select.dataset.safeVersions==='ready')return;
    running=true;
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
        const all=(byCourse.get(c.id)||[]).sort((a,b)=>Number(b.version_number)-Number(a.version_number));
        const candidates=all.filter(v=>v.syllabus_snapshot?.finalization_candidate===true||v.syllabus_snapshot?.finalization_candidate==='true');
        const chosen=candidates.length?candidates:all.slice(0,1);
        chosen.sort((a,b)=>Number(a.version_number)-Number(b.version_number)).forEach(v=>options.push({course:c,version:v}));
      });
      options.sort((a,b)=>a.course.title.localeCompare(b.course.title,'it')||Number(a.version.version_number)-Number(b.version.version_number));
      const current=select.value;
      select.innerHTML='<option value="">Corso / versione approvata…</option>'+options.map(({course,version})=>{
        const role=roleLabel(version.syllabus_snapshot?.role_variant);
        const candidate=version.syllabus_snapshot?.finalization_candidate===true||version.syllabus_snapshot?.finalization_candidate==='true';
        const suffix=role?` · ${role}`:` · v${version.version_number}`;
        return `<option value="${version.id}">${esc(course.title)}${esc(suffix)}${candidate?' · approvata':''}</option>`;
      }).join('');
      if([...select.options].some(o=>o.value===current))select.value=current;
      select.dataset.safeVersions='ready';
      if(!document.getElementById('editionVersionHint')){
        const hint=document.createElement('p');hint.id='editionVersionHint';hint.className='admin-note';hint.textContent='Per le nuove edizioni sono mostrate solo versioni pubblicate approvate; corsi congelati e librerie interne sono esclusi.';select.closest('form')?.appendChild(hint);
      }
    }catch(e){console.warn('[Edition version selector]',e?.message||e);}finally{running=false;}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,100);}
  async function boot(){for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,200));new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule();}
  window.SAFETY_EDITION_VERSION_SELECTOR={refresh:()=>{document.querySelector('#editionForm select[name="course_version_id"]')?.removeAttribute('data-safe-versions');schedule();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
