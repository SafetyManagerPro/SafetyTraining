/* SafetyTraining v21.4 — focused administration UX: organizations, complete company view, unified learner name and safe edition archive. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const caps=()=>window.SAFETY_ADMIN_CAPABILITIES_STATE;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt=v=>v?new Date(v).toLocaleString('it-IT'):'—';
  let overlay=null;

  function can(key){const c=caps();return !!(c?.platform_admin||c?.capabilities?.[key]);}
  function client(){const c=db();if(!c)throw new Error('Connessione al database non disponibile.');return c;}
  function toast(message,type='success'){
    if(window.SAFETY_ADMIN_BACKEND_V21?.toast)return window.SAFETY_ADMIN_BACKEND_V21.toast(message,type);
    const host=document.querySelector('.admin-toasts')||document.body;
    const n=document.createElement('div');n.className=`admin-toast ${type}`;n.textContent=message;host.appendChild(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>n.remove(),3200);
  }
  function close(){overlay?.remove();overlay=null;}
  function modal(title,body,wide=false){
    close();overlay=document.createElement('div');overlay.className='admin-modal-overlay';overlay.innerHTML=`<section class="admin-modal ${wide?'wide':''}"><header><div><div class="admin-kicker">AMMINISTRAZIONE</div><h2>${esc(title)}</h2></div><button class="admin-modal-close" type="button" aria-label="Chiudi">×</button></header><div class="admin-modal-body">${body}</div></section>`;overlay.addEventListener('click',e=>{if(e.target===overlay)close();});overlay.querySelector('.admin-modal-close').onclick=close;document.body.appendChild(overlay);return overlay;
  }
  async function rerender(){document.getElementById('adminRefresh')?.click();scheduleEnhance();}
  function scheduleEnhance(){[0,100,260,600,1100].forEach(ms=>setTimeout(enhance,ms));}

  function ensureOrganizationNav(){
    const b=document.querySelector('#adminShell .admin-nav [data-tab="organizations"]');
    if(!b)return;
    if(can('manage_organizations')){b.classList.remove('hidden');b.removeAttribute('aria-hidden');}
  }
  function enhanceOrganizations(){
    if(document.getElementById('adminTitle')?.textContent!=='Organizzazioni'||!can('manage_organizations'))return;
    const card=document.querySelector('#adminContent .admin-card');if(!card)return;
    const head=card.querySelector('.admin-card-head');if(head&&!head.querySelector('[data-action="new-organization-v21"]')){
      const b=document.createElement('button');b.type='button';b.className='admin-primary';b.dataset.action='new-organization-v21';b.textContent='+ Nuova organizzazione';head.appendChild(b);
      const p=head.querySelector('p');if(p)p.textContent='Entità titolari del perimetro amministrativo. Ogni azienda e corsista appartiene a una organizzazione.';
    }
  }
  function enhanceEditions(){
    if(document.getElementById('adminTitle')?.textContent!=='Edizioni'||!can('manage_editions'))return;
    document.querySelectorAll('#adminContent button[data-action="edit-edition"]').forEach(edit=>{
      const td=edit.closest('td');if(!td||td.querySelector('[data-action="archive-edition-v21"]'))return;
      const tr=td.closest('tr');
      if(tr?.textContent?.includes('Archiviata'))return;
      const b=document.createElement('button');b.type='button';b.className='admin-row-btn danger';b.dataset.action='archive-edition-v21';b.dataset.id=edit.dataset.id;b.textContent='Disattiva';b.title='Archivia l’edizione senza eliminare iscrizioni, storico o audit';td.appendChild(b);
    });
  }
  function enhance(){ensureOrganizationNav();enhanceOrganizations();enhanceEditions();}

  async function organizationEditor(id=null){
    if(!can('manage_organizations'))return;
    let x=null;if(id){const {data,error}=await client().from('organizations').select('*').eq('id',id).single();if(error)throw error;x=data;}
    const ov=modal(x?'Modifica organizzazione':'Nuova organizzazione',`<form class="admin-form grid" id="orgV21Form"><label class="wide">Nome<input name="name" required value="${esc(x?.name||'')}"></label><label>Codice<input name="code" value="${esc(x?.code||'')}"></label>${x?`<label>Stato<input value="${x.active?'Attiva':'Disattiva'}" disabled></label><label>ID<input value="${esc(x.id)}" disabled></label><label>Creata<input value="${esc(fmt(x.created_at))}" disabled></label><label>Aggiornata<input value="${esc(fmt(x.updated_at))}" disabled></label>`:''}<div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">${x?'Salva':'Crea organizzazione'}</button></div></form>`);
    ov.querySelector('[data-close]').onclick=close;
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await client().rpc('admin_save_organization',{p_organization_id:id,p_name:f.get('name'),p_code:f.get('code')||null});if(error)throw error;toast(x?'Organizzazione aggiornata.':'Organizzazione creata.');close();await window.SAFETY_ADMIN_CAPABILITIES_V21?.refresh?.();await window.SAFETY_ADMIN?.refreshRole?.();scheduleEnhance();};
  }

  async function companyEditor(id=null){
    if(!can('manage_companies'))return;
    const c=client();
    const [{data:orgs,error:oe},{data:x,error:ce}]=await Promise.all([c.from('organizations').select('id,name,active').order('name'),id?c.from('companies').select('*').eq('id',id).single():Promise.resolve({data:null,error:null})]);if(oe)throw oe;if(ce)throw ce;
    const activeOrgs=(orgs||[]).filter(o=>o.active||o.id===x?.organization_id);
    const metadata=x?.metadata&&Object.keys(x.metadata).length?JSON.stringify(x.metadata,null,2):'{}';
    const ov=modal(x?'Modifica azienda':'Nuova azienda',`<form class="admin-form grid" id="companyV21Form"><label>Organizzazione<select name="organization_id" required ${x?'disabled':''}>${activeOrgs.map(o=>`<option value="${o.id}" ${o.id===x?.organization_id?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label>Stato<input value="${x?(x.active?'Attiva':'Disattiva'):'Attiva alla creazione'}" disabled></label><label class="wide">Ragione sociale<input name="name" required value="${esc(x?.name||'')}"></label><label>P. IVA<input name="vat_number" value="${esc(x?.vat_number||'')}"></label><label>Codice fiscale<input name="fiscal_code" value="${esc(x?.fiscal_code||'')}"></label><label>ATECO<input name="ateco_code" value="${esc(x?.ateco_code||'')}"></label>${x?`<div class="admin-field-group wide"><strong>Campi tecnici e di provenienza</strong><span>Visibili per completezza; i valori normalizzati sono generati automaticamente e i metadati di integrazione non vanno modificati da questa schermata.</span></div><label>ID<input value="${esc(x.id)}" disabled></label><label>P. IVA normalizzata<input value="${esc(x.vat_number_normalized||'—')}" disabled></label><label>CF normalizzato<input value="${esc(x.fiscal_code_normalized||'—')}" disabled></label><label>Creata<input value="${esc(fmt(x.created_at))}" disabled></label><label>Aggiornata<input value="${esc(fmt(x.updated_at))}" disabled></label><label class="wide">Metadata<textarea class="admin-tech-json" disabled>${esc(metadata)}</textarea></label>`:''}<div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">${x?'Salva':'Crea azienda'}</button></div></form>`,true);
    ov.querySelector('[data-close]').onclick=close;
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const org=x?.organization_id||f.get('organization_id');const {error}=await c.rpc('admin_save_company',{p_company_id:id,p_organization_id:org,p_name:f.get('name'),p_vat_number:f.get('vat_number')||null,p_fiscal_code:f.get('fiscal_code')||null,p_ateco_code:f.get('ateco_code')||null});if(error)throw error;toast(x?'Azienda aggiornata.':'Azienda creata.');close();await rerender();};
  }

  function fullName(x){
    const imported=x?.metadata?.source_full_name?.trim();if(imported)return imported;
    return [x?.first_name,x?.last_name].filter(Boolean).join(' ').trim();
  }
  async function learnerEditor(id=null){
    if(!can('manage_learners'))return;
    const c=client();
    const [{data:orgs,error:oe},{data:companies,error:ce},{data:x,error:le}]=await Promise.all([c.from('organizations').select('id,name,active').order('name'),c.from('companies').select('id,organization_id,name,active').order('name'),id?c.from('learners').select('*').eq('id',id).single():Promise.resolve({data:null,error:null})]);if(oe)throw oe;if(ce)throw ce;if(le)throw le;
    const defaultOrg=x?.organization_id||(orgs||[]).find(o=>o.active)?.id||'';
    const ov=modal(x?'Modifica corsista':'Nuovo corsista',`<form class="admin-form grid" id="learnerV21Form"><label>Organizzazione<select name="organization_id" required ${x?'disabled':''}>${(orgs||[]).filter(o=>o.active||o.id===x?.organization_id).map(o=>`<option value="${o.id}" ${o.id===defaultOrg?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label>Azienda<select name="company_id"><option value="">Nessuna / non assegnata</option>${(companies||[]).filter(co=>(co.active||co.id===x?.company_id)&&co.organization_id===defaultOrg).map(co=>`<option value="${co.id}" ${co.id===x?.company_id?'selected':''}>${esc(co.name)}</option>`).join('')}</select></label><label class="wide">Cognome/Nome<input name="full_name" required value="${esc(fullName(x))}" autocomplete="name"><small>Campo unico, coerente con SafetyManager. I vecchi record Nome + Cognome vengono riuniti quando vengono salvati.</small></label><label>Email<input name="email" type="email" value="${esc(x?.email||'')}"></label><label>Telefono<input name="phone" value="${esc(x?.phone||'')}" disabled title="Il contatto telefono è gestito dal servizio inviti dedicato"></label><label>Codice fiscale<input name="fiscal_code" value="${esc(x?.fiscal_code||'')}"></label><label>Mansione<input name="job_title" value="${esc(x?.job_title||'')}"></label>${x?`<label>Stato<input value="${x.active?'Attivo':'Disattivo'}" disabled></label><label>ID<input value="${esc(x.id)}" disabled></label><label>Account collegato<input value="${esc(x.auth_user_id||'No')}" disabled></label><label>Creata<input value="${esc(fmt(x.created_at))}" disabled></label><label>Aggiornata<input value="${esc(fmt(x.updated_at))}" disabled></label>`:''}<div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">${x?'Salva':'Crea corsista'}</button></div></form>`,true);
    const form=ov.querySelector('form'),orgSel=form.elements.organization_id,companySel=form.elements.company_id;
    orgSel.addEventListener('change',()=>{const oid=orgSel.value;companySel.innerHTML='<option value="">Nessuna / non assegnata</option>'+ (companies||[]).filter(co=>co.active&&co.organization_id===oid).map(co=>`<option value="${co.id}">${esc(co.name)}</option>`).join('');});
    ov.querySelector('[data-close]').onclick=close;
    form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),name=String(f.get('full_name')||'').trim();if(!name)return;const org=x?.organization_id||f.get('organization_id');const {error}=await c.rpc('admin_save_learner',{p_learner_id:id,p_organization_id:org,p_company_id:f.get('company_id')||null,p_first_name:name,p_last_name:null,p_email:f.get('email')||null,p_fiscal_code:f.get('fiscal_code')||null,p_job_title:f.get('job_title')||null});if(error)throw error;toast(x?'Corsista aggiornato.':'Corsista creato.');close();await rerender();};
  }

  async function archiveEdition(id){
    if(!can('manage_editions'))return;
    const c=client(),{data:x,error}=await c.from('course_editions').select('id,title,company_id,learning_mode,status,available_from,available_until,recommended_due_at,block_after_due').eq('id',id).single();if(error)throw error;if(x.status==='archived')return toast('Edizione già disattivata.','warn');
    if(!confirm(`Disattivare l’edizione “${x.title||'senza titolo'}”?\n\nVerrà archiviata: iscrizioni, avanzamenti, storico e audit resteranno conservati. Non viene eseguita alcuna cancellazione fisica.`))return;
    const {error:ue}=await c.rpc('admin_update_edition',{p_edition_id:id,p_title:x.title,p_company_id:x.company_id,p_learning_mode:x.learning_mode,p_status:'archived',p_available_from:x.available_from,p_available_until:x.available_until,p_recommended_due_at:x.recommended_due_at,p_block_after_due:!!x.block_after_due});if(ue)throw ue;toast('Edizione disattivata e archiviata.');await rerender();
  }

  function handle(e){
    const el=e.target.closest('[data-action]');if(!el)return;const action=el.dataset.action,id=el.dataset.id||null;
    if(!['new-organization-v21','edit-organization','new-company','edit-company','new-learner','edit-learner','archive-edition-v21'].includes(action))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    Promise.resolve().then(()=>{
      if(action==='new-organization-v21')return organizationEditor();
      if(action==='edit-organization')return organizationEditor(id);
      if(action==='new-company')return companyEditor();
      if(action==='edit-company')return companyEditor(id);
      if(action==='new-learner')return learnerEditor();
      if(action==='edit-learner')return learnerEditor(id);
      if(action==='archive-edition-v21')return archiveEdition(id);
    }).catch(err=>{console.error('[Admin UX v21]',err);toast(err.message||String(err),'error');});
  }

  async function boot(){
    for(let i=0;i<40&&(!db()||!document.getElementById('adminShell'));i++)await new Promise(r=>setTimeout(r,120));
    document.addEventListener('click',handle,true);
    document.querySelector('#adminShell .admin-nav')?.addEventListener('click',scheduleEnhance);
    document.getElementById('adminRefresh')?.addEventListener('click',scheduleEnhance);
    await window.SAFETY_ADMIN_CAPABILITIES_V21?.refresh?.();
    scheduleEnhance();
  }
  window.SAFETY_ADMIN_UX_V21={enhance,version:'21.4'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
