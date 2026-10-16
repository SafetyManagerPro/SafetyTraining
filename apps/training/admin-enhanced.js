/* SafetyTraining — enhanced course administration and mobile navigation. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const asBool=v=>v===true||v==='true';
  const state={courses:new Map()};

  function ensureShellEnhancements(){
    const shell=document.getElementById('adminShell');if(!shell)return;
    if(!document.getElementById('adminNavBackdrop')){const back=document.createElement('div');back.id='adminNavBackdrop';back.className='admin-nav-backdrop';back.onclick=closeNav;shell.appendChild(back);}
    const head=shell.querySelector('.admin-head');
    if(head&&!document.getElementById('adminMenuBtn')){
      const actions=document.createElement('div');actions.className='admin-head-actions';
      const menu=document.createElement('button');menu.id='adminMenuBtn';menu.className='admin-menu-btn';menu.type='button';menu.textContent='☰ Menu';menu.onclick=toggleNav;
      const refresh=document.getElementById('adminRefresh');head.insertBefore(actions,refresh);actions.appendChild(menu);if(refresh)actions.appendChild(refresh);
    }
    shell.querySelectorAll('.admin-nav [data-tab],.admin-nav [data-sm-course-catalog],.admin-nav #adminBack').forEach(b=>{
      if(b.dataset.adminCloseBound==='1')return;
      b.dataset.adminCloseBound='1';
      b.addEventListener('click',closeNav);
    });
    ensureModal();
  }
  function toggleNav(){const s=document.getElementById('adminShell');if(!s)return;s.classList.toggle('admin-mobile-nav-open');document.getElementById('adminNavBackdrop')?.classList.toggle('open',s.classList.contains('admin-mobile-nav-open'));}
  function closeNav(){document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open');document.getElementById('adminNavBackdrop')?.classList.remove('open');}

  function ensureModal(){
    if(document.getElementById('adminCourseEditOverlay'))return;
    const ov=document.createElement('div');ov.id='adminCourseEditOverlay';ov.className='admin-edit-overlay hidden';
    ov.innerHTML=`<section class="admin-edit-modal"><div class="admin-edit-head"><div><div class="admin-kicker">EDITOR CORSO</div><h2 id="adminCourseEditTitle">Modifica corso</h2></div><button class="admin-edit-close" type="button">×</button></div><div id="adminCourseEditBody"></div></section>`;
    ov.addEventListener('click',e=>{if(e.target===ov)closeEditor();});ov.querySelector('.admin-edit-close').onclick=closeEditor;document.body.appendChild(ov);
  }
  function closeEditor(){document.getElementById('adminCourseEditOverlay')?.classList.add('hidden');}

  async function fetchCourse(id){
    const client=db();if(!client)return null;
    const [{data:c,error},{data:v,error:ve}]=await Promise.all([
      client.from('courses').select('id,title,stable_key,family,description,nominal_minutes,certification_mode,active,metadata').eq('id',id).single(),
      client.from('course_versions').select('id,version_number,status,published_at,syllabus_snapshot').eq('course_id',id).order('version_number',{ascending:false}).limit(1)
    ]);
    if(error)throw error;if(ve)throw ve;const latest=v?.[0]||null;let unitCount=0;
    if(latest){const {data:m}=await client.from('course_modules').select('id').eq('course_version_id',latest.id);const ids=(m||[]).map(x=>x.id);if(ids.length){const {count}=await client.from('course_module_units').select('*',{count:'exact',head:true}).in('module_id',ids);unitCount=count||0;}}
    return {...c,latest,unitCount};
  }

  async function openEditor(id){
    ensureModal();const ov=document.getElementById('adminCourseEditOverlay'),body=document.getElementById('adminCourseEditBody');ov.classList.remove('hidden');body.innerHTML='<div class="admin-loading">Caricamento…</div>';
    try{
      const x=await fetchCourse(id);state.courses.set(id,x);document.getElementById('adminCourseEditTitle').textContent=x.title;
      const frozen=asBool(x.metadata?.frozen);
      const approved=asBool(x.latest?.syllabus_snapshot?.finalization_candidate)&&asBool(x.latest?.syllabus_snapshot?.go_live_ready);
      const lifecycleLocked=frozen||approved;
      body.innerHTML=`<form id="adminCourseEditForm" class="admin-edit-form">
        <label class="full">Titolo<input name="title" value="${esc(x.title)}" required></label>
        <label>Chiave stabile<input value="${esc(x.stable_key)}" disabled></label>
        <label>Famiglia<input name="family" value="${esc(x.family||'')}"></label>
        <label>Durata nominale (min)<input name="nominal_minutes" type="number" min="0" value="${x.nominal_minutes??''}"></label>
        <label>Modalità certificazione<select name="certification_mode"><option value="internal_learning" ${x.certification_mode==='internal_learning'?'selected':''}>Percorso interno</option><option value="certifiable" ${x.certification_mode==='certifiable'?'selected':''}>Certificabile</option><option value="certified_only" ${x.certification_mode==='certified_only'?'selected':''}>Solo certificato</option></select></label>
        <label>Stato corso<select name="active" ${lifecycleLocked?'disabled':''}><option value="true" ${x.active?'selected':''}>Attivo</option><option value="false" ${!x.active?'selected':''}>Disattivo</option></select></label>
        <label>Versione corrente<input value="${x.latest?`v${x.latest.version_number}`:'nessuna'}" disabled></label>
        <label>Stato versione<select name="version_status" ${!x.latest||lifecycleLocked?'disabled':''}><option value="draft" ${x.latest?.status==='draft'?'selected':''}>Bozza</option><option value="published" ${x.latest?.status==='published'?'selected':''}>Pubblicata</option><option value="archived" ${x.latest?.status==='archived'?'selected':''}>Archiviata</option></select></label>
        <label class="full">Descrizione<textarea name="description">${esc(x.description||'')}</textarea></label>
        ${lifecycleLocked?`<div class="admin-guard-note admin-go-live-lock full">${frozen?'Corso congelato: attivazione e stato versione sono protetti.':'Versione approvata in go-live: attivazione e stato versione sono protetti dal flusso controllato.'}</div>`:''}
        <div class="admin-materials full"><strong>Materiale didattico</strong><p class="admin-note">${x.unitCount} Learning Unit collegate alla versione corrente. La modalità di erogazione non limita la consultazione del materiale da parte di amministratore/docente.</p><button type="button" class="admin-row-btn" id="adminPreviewMaterials">Apri materiale</button></div>
        <div class="admin-edit-actions"><button type="button" id="adminCourseEditCancel">Annulla</button><button class="save" type="submit">Salva modifiche</button></div>
      </form>`;
      document.getElementById('adminCourseEditCancel').onclick=closeEditor;
      document.getElementById('adminPreviewMaterials').onclick=()=>{closeEditor();location.hash=`library/${x.stable_key}`;window.SAFETY_ADMIN?.close?.();};
      document.getElementById('adminCourseEditForm').onsubmit=async e=>{
        e.preventDefault();const f=new FormData(e.currentTarget),activeControl=e.currentTarget.elements.active,versionControl=e.currentTarget.elements.version_status;
        const patch={title:f.get('title').trim(),family:f.get('family')?.trim()||'other',description:f.get('description')?.trim()||null,nominal_minutes:f.get('nominal_minutes')===''?null:Number(f.get('nominal_minutes')),certification_mode:f.get('certification_mode'),active:activeControl?.disabled?x.active:f.get('active')==='true'};
        const {error}=await db().from('courses').update(patch).eq('id',id);if(error)return alert(error.message);
        if(x.latest&&versionControl&&!versionControl.disabled){const status=f.get('version_status'),vp={status,published_at:status==='published'?(x.latest.published_at||new Date().toISOString()):null};const {error:versionError}=await db().from('course_versions').update(vp).eq('id',x.latest.id);if(versionError)return alert(versionError.message);}
        closeEditor();document.getElementById('adminRefresh')?.click();window.SAFETY_CATALOG?.load?.(true);
      };
    }catch(e){body.innerHTML=`<div class="admin-error">${esc(e.message)}</div>`;}
  }

  function enhanceCourseTab(){
    const host=document.getElementById('adminContent');if(!host||document.getElementById('adminTitle')?.textContent!=='Corsi')return;
    const form=document.getElementById('courseForm');
    if(form&&!form.dataset.enhanced){
      form.dataset.enhanced='1';
      form.onsubmit=async e=>{
        e.preventDefault();const f=new FormData(form),payload={title:f.get('title').trim(),stable_key:f.get('stable_key').trim(),family:f.get('family')?.trim()||'other',nominal_minutes:f.get('nominal_minutes')?Number(f.get('nominal_minutes')):null,certification_mode:f.get('certification_mode')};
        const {data:course,error}=await db().from('courses').insert(payload).select('id').single();if(error)return alert(error.message);
        const {error:ve}=await db().from('course_versions').insert({course_id:course.id,version_number:1,status:'draft'});if(ve)return alert(`Corso creato, ma versione non creata: ${ve.message}`);
        alert('Corso creato in bozza. Il materiale può essere completato prima della pubblicazione.');document.getElementById('adminRefresh')?.click();
      };
    }
    host.querySelectorAll('button[data-action="edit"]').forEach(b=>{if(b.dataset.enhanced)return;b.dataset.enhanced='1';b.onclick=e=>{e.preventDefault();e.stopPropagation();openEditor(b.dataset.id);};});
    host.querySelectorAll('button[data-action="edit"]').forEach(b=>{
      const td=b.closest('td');if(!td||td.querySelector('[data-materials]'))return;const m=document.createElement('button');m.className='admin-row-btn';m.dataset.materials='1';m.textContent='Materiali';m.onclick=async()=>{const x=await fetchCourse(b.dataset.id);location.hash=`library/${x.stable_key}`;window.SAFETY_ADMIN?.close?.();};td.appendChild(m);
    });
  }

  function observe(){
    ensureShellEnhancements();const shell=document.getElementById('adminShell');if(!shell)return;
    const obs=new MutationObserver(()=>{ensureShellEnhancements();enhanceCourseTab();});obs.observe(shell,{childList:true,subtree:true});enhanceCourseTab();
  }
  async function boot(){for(let i=0;i<40&&!document.getElementById('adminShell');i++)await new Promise(r=>setTimeout(r,150));observe();document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNav();closeEditor();}});}
  window.SAFETY_ADMIN_ENHANCED={openEditor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
