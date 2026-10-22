/* SafetyTraining — admin backend RPC bridge v21. */
(() => {
  'use strict';

  const db = () => window.SAFETY_CLOUD?.state?.client;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state = { edit:{}, enhancing:false, enhanceTimer:null, enhanceSeq:0 };

  const ACTION_LABELS = {
    'organization.create':'Organizzazione creata', 'organization.update':'Organizzazione aggiornata',
    'company.create':'Azienda creata', 'company.update':'Azienda aggiornata',
    'learner.create':'Corsista creato', 'learner.update':'Corsista aggiornato',
    'course.create':'Corso creato', 'course.update':'Corso aggiornato',
    'edition.create':'Edizione creata', 'edition.update':'Edizione aggiornata',
    'enrollment.bulk_create':'Iscrizione multipla', 'enrollment.revoke':'Iscrizione revocata',
    'enrollment.restore':'Iscrizione riattivata', 'entity.activate':'Entità riattivata',
    'entity.deactivate':'Entità disattivata'
  };

  function notify(message, kind='info') {
    let host=document.getElementById('adminToasts');
    if(!host){host=document.createElement('div');host.id='adminToasts';host.className='admin-toasts';document.body.appendChild(host);}
    const el=document.createElement('div');el.className=`admin-toast ${kind}`;el.textContent=message;host.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),180);},3600);
  }

  async function rpc(name,args={}) {
    const client=db();
    if(!client) throw new Error('Backend Supabase non disponibile.');
    const {data,error}=await client.rpc(name,args);
    if(error) throw error;
    return data;
  }

  function closeModal(){document.querySelector('#adminModal .admin-modal-close')?.click();}
  async function rerender(){closeModal();await window.SAFETY_ADMIN?.render?.();scheduleEnhance(40);}
  const iso=v=>v?new Date(v).toISOString():null;
  const formTitle=form=>form.closest('#adminModal')?.querySelector('h2')?.textContent?.trim()||'';

  function rememberAction(button) {
    const a=button?.dataset?.action,id=button?.dataset?.id||null;
    if(!a)return;
    if(a==='edit-org')state.edit.organization=id;
    if(a==='new-company')state.edit.company=null;
    if(a==='edit-company')state.edit.company=id;
    if(a==='new-learner')state.edit.learner=null;
    if(a==='edit-learner')state.edit.learner=id;
    if(a==='new-course')state.edit.course=null;
    if(a==='edit-course')state.edit.course=id;
    if(a==='edit-edition')state.edit.edition=id;
  }

  async function submitOrganization(form) {
    const f=new FormData(form);
    await rpc('admin_save_organization',{p_organization_id:state.edit.organization||null,p_name:f.get('name'),p_code:f.get('code')||null});
    notify('Organizzazione aggiornata.','success');
    await window.SAFETY_ADMIN?.refreshRole?.();
    await rerender();
  }

  async function submitCompany(form) {
    const f=new FormData(form), id=state.edit.company||null;
    await rpc('admin_save_company',{
      p_company_id:id,p_organization_id:f.get('organization_id')||null,p_name:f.get('name'),
      p_vat_number:f.get('vat_number')||null,p_fiscal_code:f.get('fiscal_code')||null,p_ateco_code:f.get('ateco_code')||null
    });
    notify(id?'Azienda aggiornata.':'Azienda creata.','success');
    await rerender();
  }

  async function submitLearner(form) {
    const f=new FormData(form), id=state.edit.learner||null;
    await rpc('admin_save_learner',{
      p_learner_id:id,p_organization_id:f.get('organization_id')||null,p_company_id:f.get('company_id')||null,
      p_first_name:f.get('first_name')||null,p_last_name:f.get('last_name')||null,p_email:f.get('email')||null,
      p_fiscal_code:f.get('fiscal_code')||null,p_job_title:f.get('job_title')||null
    });
    notify(id?'Corsista aggiornato.':'Corsista creato.','success');
    await rerender();
  }

  async function submitCourse(form) {
    const f=new FormData(form), id=state.edit.course||null;
    const rawMinutes=f.get('nominal_minutes'), active=f.has('active')?f.get('active')==='true':null;
    await rpc('admin_save_course',{
      p_course_id:id,p_stable_key:id?null:(f.get('stable_key')||null),p_title:f.get('title'),p_family:f.get('family')||'other',
      p_description:f.get('description')||null,p_nominal_minutes:rawMinutes===''||rawMinutes==null?null:Number(rawMinutes),
      p_certification_mode:f.get('certification_mode'),p_active:active
    });
    notify(id?'Corso aggiornato.':'Corso creato con versione v1 in bozza.','success');
    await rerender();
  }

  async function submitEditionCreate(form) {
    const f=new FormData(form);
    await rpc('admin_create_edition',{
      p_organization_id:f.get('organization_id')||null,p_company_id:f.get('company_id')||null,
      p_course_version_id:f.get('course_version_id'),p_title:f.get('title')||null,p_learning_mode:f.get('learning_mode'),
      p_status:f.get('status'),p_available_from:iso(f.get('available_from')),p_available_until:iso(f.get('available_until'))
    });
    notify('Edizione creata.','success');
    form.reset();
    await rerender();
  }

  async function submitEditionUpdate(form) {
    const f=new FormData(form);
    await rpc('admin_update_edition',{
      p_edition_id:state.edit.edition,p_title:f.get('title')||null,p_company_id:f.get('company_id')||null,
      p_learning_mode:f.get('learning_mode'),p_status:f.get('status'),p_available_from:iso(f.get('available_from')),
      p_available_until:iso(f.get('available_until')),p_recommended_due_at:iso(f.get('recommended_due_at')),
      p_block_after_due:f.get('block_after_due')==='on'
    });
    notify('Edizione aggiornata.','success');
    await rerender();
  }

  async function setActive(entityType,id) {
    const table={organization:'organizations',company:'companies',learner:'learners',course:'courses'}[entityType];
    const {data,error}=await db().from(table).select('active').eq('id',id).single();
    if(error)throw error;
    const next=!data.active;
    if(entityType==='learner'&&!next&&!window.confirm('Disattivare questo corsista? Il profilo non potrà accedere ai corsi, anche se iscritto ad altri percorsi. Storico, attestati e iscrizioni resteranno conservati. Per annullare soltanto un corso usa «Annulla iscrizione» nella sezione Iscrizioni.'))return;
    await rpc('admin_set_active',{p_entity_type:entityType,p_entity_id:id,p_active:next});
    notify(next?'Elemento riattivato.':'Elemento disattivato.','success');
    if(entityType==='organization'){state.edit.organization=null;await window.SAFETY_ADMIN?.refreshRole?.();}
    await rerender();
  }

  async function setEditionStatus(id,status) {
    const {data:x,error}=await db().from('course_editions').select('title,company_id,learning_mode,available_from,available_until,recommended_due_at,block_after_due').eq('id',id).single();
    if(error)throw error;
    await rpc('admin_update_edition',{
      p_edition_id:id,p_title:x.title,p_company_id:x.company_id,p_learning_mode:x.learning_mode,p_status:status,
      p_available_from:x.available_from,p_available_until:x.available_until,p_recommended_due_at:x.recommended_due_at,p_block_after_due:x.block_after_due
    });
    notify(status==='closed'?'Edizione chiusa.':'Edizione riaperta.','success');
    await rerender();
  }

  async function setEnrollmentRevoked(id,revoked) {
    await rpc('admin_set_enrollment_revoked',{p_enrollment_id:id,p_revoked:revoked});
    notify(revoked?'Iscrizione revocata.':'Iscrizione riattivata.','success');
    await rerender();
  }

  async function bulkSubmit() {
    const editionId=document.getElementById('bulkEdition')?.value;
    const ids=[...document.querySelectorAll('[data-bulk-learner]:checked')].map(x=>x.dataset.bulkLearner);
    if(!editionId)return notify('Seleziona un’edizione.','error');
    if(!ids.length)return notify('Seleziona almeno un corsista.','error');
    const result=await rpc('admin_bulk_enroll',{p_edition_id:editionId,p_learner_ids:ids,p_source:'admin_v21_rpc_bridge'});
    let invited=0,failed=0;
    if(document.getElementById('bulkInvite')?.checked){
      const {data:learners,error}=await db().from('learners').select('id,email,auth_user_id').in('id',ids);
      if(error)throw error;
      for(const learner of learners||[]){
        if(!learner.email||learner.auth_user_id)continue;
        try{
          const {error:e,data}=await db().functions.invoke('invite-learner',{body:{learner_id:learner.id,redirect_to:new URL('?onboarding=1',location.href).toString()}});
          if(e||data?.error)throw e||new Error(data.message||data.error);
          invited++;
        }catch(err){console.warn('[Admin v21 invite]',err);failed++;}
      }
    }
    const inserted=Number(result?.inserted??ids.length), skipped=Number(result?.skipped_existing??0);
    notify(`${inserted} corsisti iscritti${skipped?` · ${skipped} già presenti`:''}${invited?` · ${invited} invitati`:''}${failed?` · ${failed} inviti non riusciti`:''}.`,failed?'warn':'success');
    await rerender();
  }

  document.addEventListener('submit',async event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement))return;
    if(!form.closest('#adminShell')&&!form.closest('#adminModal'))return;
    const title=formTitle(form);
    let handler=null;
    if(form.id==='editionForm')handler=()=>submitEditionCreate(form);
    else if(title==='Modifica organizzazione')handler=()=>submitOrganization(form);
    else if(title==='Nuova azienda'||title==='Modifica azienda')handler=()=>submitCompany(form);
    else if(title==='Nuovo corsista'||title==='Modifica corsista')handler=()=>submitLearner(form);
    else if(title==='Nuovo corso'||title==='Modifica corso')handler=()=>submitCourse(form);
    else if(title==='Modifica edizione')handler=()=>submitEditionUpdate(form);
    if(!handler)return;
    event.preventDefault();event.stopImmediatePropagation();
    try{await handler();}catch(err){console.error('[Admin v21 RPC]',err);notify(err?.message||'Operazione non riuscita.','error');}
  },true);

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');
    if(!button)return;
    rememberAction(button);
    const action=button.dataset.action,id=button.dataset.id;
    const handled=['toggle-company','toggle-learner','toggle-org','close-edition','open-edition','revoke','restore','bulk-submit'];
    if(!handled.includes(action))return;
    event.preventDefault();event.stopImmediatePropagation();
    try{
      if(action==='toggle-company')return await setActive('company',id);
      if(action==='toggle-learner')return await setActive('learner',id);
      if(action==='toggle-org')return await setActive('organization',id);
      if(action==='close-edition')return await setEditionStatus(id,'closed');
      if(action==='open-edition')return await setEditionStatus(id,'open');
      if(action==='revoke'){if(window.confirm('Annullare questa iscrizione? Il corsista non potrà proseguire questo percorso. Le attività e le evidenze già registrate verranno conservate e la revoca sarà tracciata.'))return await setEnrollmentRevoked(id,true);return;}
      if(action==='restore')return await setEnrollmentRevoked(id,false);
      if(action==='bulk-submit')return await bulkSubmit();
    }catch(err){console.error('[Admin v21 RPC action]',err);notify(err?.message||'Operazione non riuscita.','error');}
  },true);

  function dashboardMarkup(summary) {
    const stat=(value,label)=>`<article class="admin-stat"><strong>${esc(value??0)}</strong><span>${esc(label)}</span></article>`;
    return `
      <div class="admin-stats">${stat(summary?.companies_active,'Aziende attive')}${stat(summary?.learners_active,'Corsisti attivi')}${stat(summary?.courses_active,'Corsi attivi')}${stat(summary?.editions_open,'Edizioni aperte')}${stat(summary?.enrollments_in_progress,'Percorsi in corso')}${stat(summary?.pending_invites,'Accessi da gestire')}</div>
      <div class="admin-guided-cta"><div><h2>Nuovo percorso formativo</h2><p>Un’unica procedura: azienda, corso, corsisti e inviti.</p></div><button type="button" data-jump="wizard">+ Avvia percorso guidato →</button></div>
      <div class="admin-grid two">
        <section class="admin-card"><div class="admin-card-head"><div><h2>Flusso operativo</h2><p>Dall’anagrafica all’erogazione.</p></div></div><div class="admin-step-list"><button data-jump="companies"><b>1</b><span>Azienda<small>Anagrafica, P.IVA e ATECO</small></span></button><button data-jump="learners"><b>2</b><span>Corsisti<small>Dati, account e inviti</small></span></button><button data-jump="courses"><b>3</b><span>Corsi<small>Catalogo e versioni</small></span></button><button data-jump="editions"><b>4</b><span>Edizioni<small>Versione approvata e disponibilità</small></span></button><button data-jump="enrollments"><b>5</b><span>Iscrizioni<small>Assegnazione, accessi e avanzamento</small></span></button></div></section>
        <section class="admin-card"><div class="admin-card-head"><div><h2>Stato piattaforma</h2><p>Snapshot amministrativo server-side.</p></div></div><div class="admin-summary-list"><div><span>Edizioni complessive</span><strong>${esc(summary?.editions_total??0)}</strong></div><div><span>Iscrizioni complessive</span><strong>${esc(summary?.enrollments_total??0)}</strong></div><div><span>Ambito</span><strong>${esc(summary?.scope==='platform'?'Piattaforma':'Organizzazione')}</strong></div><div><span>Pubblicazione contenuti</span><strong>Controllata</strong></div></div><p class="admin-note">I contatori della dashboard arrivano da un unico snapshot autorizzato lato server; nessun polling DOM o refresh ricorsivo.</p></section>
      </div>`;
  }

  async function enhanceDashboard(seq) {
    const active=document.querySelector('#adminShell .admin-nav [data-tab="dashboard"].active');
    if(!active)return;
    const summary=await rpc('admin_dashboard_summary');
    if(seq!==state.enhanceSeq)return;
    const host=document.getElementById('adminContent');
    if(!host)return;
    if(host.querySelector('.admin-loading') || !host.querySelector('.admin-stats')) {
      host.innerHTML=dashboardMarkup(summary);
      return;
    }
    const stats=[summary?.companies_active,summary?.learners_active,summary?.courses_active,summary?.editions_open,summary?.enrollments_in_progress,summary?.pending_invites];
    host.querySelectorAll('.admin-stats .admin-stat strong').forEach((el,i)=>{if(stats[i]!=null&&el.textContent!==String(stats[i]))el.textContent=String(stats[i]);});
    const rows=host.querySelectorAll('.admin-summary-list strong');
    if(rows[0]&&summary?.editions_total!=null)rows[0].textContent=String(summary.editions_total);
    if(rows[1]&&summary?.enrollments_total!=null)rows[1].textContent=String(summary.enrollments_total);
  }

  async function enhanceActivity(seq) {
    const active=document.querySelector('#adminShell .admin-nav [data-tab="activity"].active');
    if(!active)return;
    const {data:actions,error}=await db().rpc('admin_recent_actions',{p_limit:100});
    if(error)throw error;
    if(seq!==state.enhanceSeq)return;
    let section=document.getElementById('adminAuditActions');
    if(!section){section=document.createElement('section');section.id='adminAuditActions';section.className='admin-card';document.getElementById('adminContent')?.prepend(section);}
    const rows=(actions||[]).map(x=>`<tr><td>${esc(new Date(x.created_at).toLocaleString('it-IT'))}</td><td>${esc(ACTION_LABELS[x.action]||x.action)}</td><td>${esc(x.entity_type)}</td><td><code>${esc(x.entity_id||'—')}</code></td></tr>`).join('');
    const html=`<div class="admin-card-head"><div><h2>Azioni amministrative</h2><p>Audit delle ultime operazioni eseguite tramite backend v21.</p></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Quando</th><th>Azione</th><th>Entità</th><th>ID</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="admin-empty">Nessuna azione amministrativa registrata.</td></tr>'}</tbody></table></div>`;
    if(section.innerHTML!==html)section.innerHTML=html;
  }

  async function enhance(){
    if(state.enhancing)return;
    state.enhancing=true;
    const seq=++state.enhanceSeq;
    try{await enhanceDashboard(seq);await enhanceActivity(seq);}catch(err){console.warn('[Admin v21 enhance]',err?.message||err);}finally{state.enhancing=false;}
  }
  function scheduleEnhance(delay=100){clearTimeout(state.enhanceTimer);state.enhanceTimer=setTimeout(enhance,delay);}

  function boot(){
    scheduleEnhance(120);
    document.addEventListener('click',event=>{
      if(event.target.closest('#adminConsoleBtn,#adminRefresh,#adminShell [data-tab],#adminContent [data-jump]')) scheduleEnhance(80);
    });
    db()?.auth?.onAuthStateChange(()=>scheduleEnhance(180));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.SAFETY_ADMIN_BACKEND_V21={rpc,enhance,scheduleEnhance,version:'21.3'};
})();
