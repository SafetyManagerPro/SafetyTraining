/* SafetyTraining — administration guardrails and UI consistency checks. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const asBool=v=>v===true||v==='true';
  const state={timer:null,running:false};

  function ensureStyles(){
    if(document.getElementById('adminHardeningStyles'))return;
    const style=document.createElement('style');
    style.id='adminHardeningStyles';
    style.textContent=`
      .admin-guard-note{margin:10px 0;padding:10px 12px;border:1px solid rgba(106,168,255,.28);background:rgba(106,168,255,.08);border-radius:10px;color:#cfe2ff;font-size:12px;line-height:1.45}
      .admin-guard-warning{margin:10px 0;padding:10px 12px;border:1px solid rgba(255,209,102,.30);background:rgba(255,209,102,.08);border-radius:10px;color:#ffe2a0;font-size:12px;line-height:1.45}
      .admin-guarded-control{opacity:.72;cursor:not-allowed!important}
      .admin-form button:disabled{opacity:.5;cursor:not-allowed}
    `;
    document.head.appendChild(style);
  }

  function guardEditionForm(){
    if(document.getElementById('adminTitle')?.textContent?.trim()!=='Edizioni')return;
    const form=document.getElementById('editionForm');
    const select=form?.querySelector('select[name="course_version_id"]');
    const submit=form?.querySelector('button[type="submit"],button:not([type])');
    if(!form||!select||!submit)return;

    const ready=select.dataset.safeVersions==='ready';
    submit.disabled=!ready||select.disabled;
    if(!form.dataset.approvedGuard){
      form.dataset.approvedGuard='1';
      form.addEventListener('submit',event=>{
        const selected=select.selectedOptions?.[0];
        if(select.dataset.safeVersions!=='ready'||!selected?.value||selected.dataset.approved!=='true'){
          event.preventDefault();
          event.stopImmediatePropagation();
          alert('Seleziona una versione approvata e pronta al go-live.');
        }
      },true);
    }
  }

  async function guardCourseEditor(){
    const form=document.getElementById('adminCourseEditForm');
    if(!form||form.dataset.governanceChecked)return;
    form.dataset.governanceChecked='loading';
    const stable=[...form.querySelectorAll('label')].find(l=>l.textContent.trim().startsWith('Chiave stabile'))?.querySelector('input')?.value;
    if(!stable||!db()){form.dataset.governanceChecked='skip';return;}
    try{
      const {data:course,error:ce}=await db().from('courses').select('id,active').eq('stable_key',stable).maybeSingle();
      if(ce||!course)throw ce||new Error('Corso non trovato');
      const {data:versions,error:ve}=await db().from('course_versions').select('id,version_number,status,syllabus_snapshot').eq('course_id',course.id).order('version_number',{ascending:false});
      if(ve)throw ve;
      const latest=(versions||[])[0]||null;
      const approved=(versions||[]).filter(v=>asBool(v.syllabus_snapshot?.finalization_candidate)&&asBool(v.syllabus_snapshot?.go_live_ready));
      const latestApproved=!!latest&&asBool(latest.syllabus_snapshot?.finalization_candidate)&&asBool(latest.syllabus_snapshot?.go_live_ready);
      if(!approved.length){form.dataset.governanceChecked='ready';return;}

      const active=form.querySelector('select[name="active"]');
      const versionStatus=form.querySelector('select[name="version_status"]');
      const originalActive=String(course.active);
      const originalVersionStatus=latest?.status||'';
      if(active){active.style.pointerEvents='none';active.tabIndex=-1;active.classList.add('admin-guarded-control');active.setAttribute('aria-disabled','true');}
      if(versionStatus&&latestApproved){versionStatus.style.pointerEvents='none';versionStatus.tabIndex=-1;versionStatus.classList.add('admin-guarded-control');versionStatus.setAttribute('aria-disabled','true');}

      if(!form.querySelector('.admin-go-live-lock')){
        const note=document.createElement('div');
        note.className='admin-guard-note admin-go-live-lock full';
        note.textContent=`Corso in go-live controllato: ${approved.length} version${approved.length===1?'e':'i'} approvat${approved.length===1?'a':'e'}. Attivazione del corso${latestApproved?' e stato della versione corrente':''} sono protetti da modifiche accidentali.`;
        form.querySelector('.admin-materials')?.insertAdjacentElement('beforebegin',note);
      }
      form.addEventListener('submit',event=>{
        if(active&&active.value!==originalActive){event.preventDefault();event.stopImmediatePropagation();alert('L’attivazione di un corso approvato non può essere modificata da questo editor.');return;}
        if(latestApproved&&versionStatus&&versionStatus.value!==originalVersionStatus){event.preventDefault();event.stopImmediatePropagation();alert('Lo stato di una versione approvata non può essere modificato da questo editor.');}
      },true);
      form.dataset.governanceChecked='ready';
    }catch(error){
      form.dataset.governanceChecked='error';
      console.warn('[Admin hardening course editor]',error?.message||error);
    }
  }

  async function repairClosedEnrollmentContext(){
    if(document.getElementById('adminTitle')?.textContent?.trim()!=='Iscrizioni'||!db())return;
    const rows=[...document.querySelectorAll('#adminContent .admin-table tbody tr')].filter(row=>row.querySelector('[data-action="revoke"],[data-action="restore"]'));
    const targets=rows.filter(row=>row.children[1]?.textContent?.trim()==='—'&&!row.dataset.editionContextChecked);
    if(!targets.length)return;
    targets.forEach(row=>row.dataset.editionContextChecked='loading');
    const ids=targets.map(row=>row.querySelector('[data-action="revoke"],[data-action="restore"]')?.dataset.id).filter(Boolean);
    try{
      const {data:en,error:ee}=await db().from('enrollments').select('id,edition_id').in('id',ids);if(ee)throw ee;
      const editionIds=[...new Set((en||[]).map(x=>x.edition_id).filter(Boolean))];if(!editionIds.length)return;
      const {data:eds,error:de}=await db().from('course_editions').select('id,course_version_id,title,status').in('id',editionIds);if(de)throw de;
      const versionIds=[...new Set((eds||[]).map(x=>x.course_version_id).filter(Boolean))];
      const {data:versions,error:ve}=versionIds.length?await db().from('course_versions').select('id,course_id').in('id',versionIds):{data:[],error:null};if(ve)throw ve;
      const courseIds=[...new Set((versions||[]).map(x=>x.course_id).filter(Boolean))];
      const {data:courses,error:ce}=courseIds.length?await db().from('courses').select('id,title').in('id',courseIds):{data:[],error:null};if(ce)throw ce;
      const em=new Map((eds||[]).map(x=>[x.id,x])),vm=new Map((versions||[]).map(x=>[x.id,x])),cm=new Map((courses||[]).map(x=>[x.id,x.title])),enm=new Map((en||[]).map(x=>[x.id,x]));
      targets.forEach(row=>{
        const id=row.querySelector('[data-action="revoke"],[data-action="restore"]')?.dataset.id;
        const enrollment=enm.get(id),edition=em.get(enrollment?.edition_id),version=vm.get(edition?.course_version_id);
        if(edition&&row.children[1])row.children[1].textContent=edition.title||cm.get(version?.course_id)||'Edizione';
        row.dataset.editionContextChecked='ready';
      });
    }catch(error){
      targets.forEach(row=>row.dataset.editionContextChecked='error');
      console.warn('[Admin hardening enrollment context]',error?.message||error);
    }
  }

  async function warnMissingLearnerEmails(){
    if(document.getElementById('adminTitle')?.textContent?.trim()!=='Corsisti'||!db())return;
    const host=document.getElementById('adminContent');
    if(!host||host.querySelector('.admin-missing-email-warning'))return;
    const {count,error}=await db().from('learners').select('*',{count:'exact',head:true}).eq('active',true).is('email',null);
    if(error||!count)return;
    const note=document.createElement('div');
    note.className='admin-guard-warning admin-missing-email-warning';
    note.textContent=`${count} corsist${count===1?'a attivo non ha':'i attivi non hanno'} un indirizzo email: finché non viene inserito non è possibile inviare l’invito di accesso alla piattaforma.`;
    host.prepend(note);
  }

  async function harden(){
    if(state.running||!db())return;
    const shell=document.getElementById('adminShell');
    if(!shell||shell.classList.contains('hidden'))return;
    state.running=true;
    try{
      ensureStyles();
      guardEditionForm();
      await guardCourseEditor();
      await repairClosedEnrollmentContext();
      await warnMissingLearnerEmails();
    }finally{state.running=false;}
  }
  function schedule(delay=80){clearTimeout(state.timer);state.timer=setTimeout(harden,delay);}
  async function boot(){
    ensureStyles();
    for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,200));
    new MutationObserver(()=>schedule()).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('safety:approved-versions-ready',()=>schedule(0));
    window.addEventListener('focus',()=>schedule(50));
    schedule(0);
  }
  window.SAFETY_ADMIN_HARDENING={refresh:()=>schedule(0)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
