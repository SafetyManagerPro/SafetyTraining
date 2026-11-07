/* SafetyTraining — unified administration frontend v21. */
(() => {
  'use strict';

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const user = () => cloud()?.state?.user;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const asBool = v => v === true || v === 'true';
  const fmtDate = v => v ? new Date(v).toLocaleDateString('it-IT') : '—';
  const fmtDateTime = v => v ? new Date(v).toLocaleString('it-IT') : '—';
  const alphabetical=new Intl.Collator('it-IT',{sensitivity:'base',numeric:true});
  const alphabeticalBy=(items,label)=>[...(items||[])].sort((a,b)=>alphabetical.compare(String(label(a)||''),String(label(b)||'')));
  const hours = v => v == null ? '—' : `${Math.round(Number(v) / 60 * 10) / 10} h`;
  const match = (q, ...values) => !q || values.some(v => String(v ?? '').toLocaleLowerCase('it').includes(q.toLocaleLowerCase('it')));

  const TABS = [
    ['dashboard','▦','Panoramica e grafici'],
    ['wizard','✨','Avvia percorso'],
    ['organizations','🏢','Organizzazioni'],
    ['companies','🏭','Aziende'],
    ['learners','👥','Corsisti'],
    ['courses','📚','Corsi'],
    ['editions','🗂','Edizioni'],
    ['enrollments','✅','Iscrizioni'],
    ['activity','📈','Controllo operativo']
  ];
  const LABEL = {
    draft:'Bozza', published:'Pubblicata', retired:'Ritirata',
    open:'Aperta', closed:'Chiusa', archived:'Archiviata',
    not_started:'Da iniziare', in_progress:'In corso', completed:'Completato',
    passed:'Superato', failed:'Non superato', revoked:'Revocato'
  };
  const state = {
    open:false, admin:false, tab:'dashboard', filters:{}, renderSeq:0,
    orgs:[], defaultOrgId:null, multiOrg:false, modal:null, showRevokedEnrollments:false, showArchivedLearners:false
  };
  // Do not refetch 5 progress datasets after every keystroke in the learner search.
  // Never keep a cached learner snapshot across authentication changes.
  const progressCache={snapshot:null,at:0,pending:null,generation:0};
  function invalidateProgress(){
    progressCache.snapshot=null;progressCache.at=0;progressCache.generation+=1;progressCache.pending=null;
  }

  function toast(message, kind='info') {
    let host = document.getElementById('adminToasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'adminToasts'; host.className = 'admin-toasts';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = `admin-toast ${kind}`; el.textContent = message;
    host.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 180); }, 3600);
  }
  function fail(error, prefix='Operazione non riuscita') {
    console.error('[Admin v21]', error);
    toast(`${prefix}: ${error?.message || error}`, 'error');
  }
  function loading(text='Caricamento…') { return `<div class="admin-loading"><span class="admin-spinner"></span>${esc(text)}</div>`; }
  function badge(text, kind='muted') { return `<span class="admin-badge ${kind}">${esc(text)}</span>`; }
  function btn(label, action, id='', kind='') { return `<button type="button" class="admin-row-btn ${kind}" data-action="${esc(action)}" data-id="${esc(id)}">${esc(label)}</button>`; }
  function stat(value, label, detail='') { return `<article class="admin-stat"><strong>${esc(value)}</strong><span>${esc(label)}</span>${detail ? `<small>${esc(detail)}</small>` : ''}</article>`; }
  const clampPct = v => Math.max(0,Math.min(100,Number.isFinite(Number(v))?Number(v):0));
  const fmtActiveTime = seconds => {
    const total=Math.floor(Math.max(0,Number(seconds)||0)/60),h=Math.floor(total/60),m=total%60;
    return h?`${h} h ${m.toString().padStart(2,'0')} min`:`${m} min`;
  };
  const progressBar = (value,label='Avanzamento contenuti') => {
    const pct=clampPct(value);
    return `<div class="admin-progress-wrap"><progress class="admin-course-progress" value="${pct}" max="100" aria-label="${esc(label)}"></progress><strong>${Math.round(pct)}%</strong></div>`;
  };
  function searchBox(tab, placeholder) { return `<label class="admin-search"><span>⌕</span><input data-admin-search="${tab}" value="${esc(state.filters[tab] || '')}" placeholder="${esc(placeholder)}"></label>`; }
  function table(headers, rows, empty='Nessun dato disponibile.') {
    return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="admin-empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  }
  function setHeader(title, subtitle='Gestione operativa della piattaforma') {
    document.getElementById('adminTitle').textContent = title;
    document.getElementById('adminSubtitle').textContent = subtitle;
    document.querySelectorAll('#adminShell .admin-nav nav button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#adminShell .admin-nav [data-tab="${state.tab}"]`)?.classList.add('active');
    window.SAFETY_ADMIN_HELP_V22?.sync?.();
  }
  function out(html) { const host = document.getElementById('adminContent'); if (host) host.innerHTML = html; }

  function ensureUi() {
    if (!document.getElementById('adminConsoleBtn')) {
      const b = document.createElement('button');
      b.id = 'adminConsoleBtn'; b.type = 'button'; b.className = 'admin-console-btn hidden';
      b.innerHTML = '<span>⚙</span><span>Amministrazione</span>'; b.onclick = open;
      const account = document.getElementById('cloudAccount');
      (account?.parentElement || document.querySelector('.topbar'))?.insertBefore(b, account || null);
    }
    if (document.getElementById('adminShell')) return;
    const shell = document.createElement('div');
    shell.id = 'adminShell'; shell.className = 'admin-shell hidden';
    shell.innerHTML = `
      <div id="adminNavBackdrop" class="admin-nav-backdrop"></div>
      <aside class="admin-nav">
        <div class="admin-brand"><strong>SAFETY TRAINING</strong><span>Amministrazione</span></div>
        <nav>${TABS.map(([key,icon,label]) => `<button type="button" data-tab="${key}"><span>${icon}</span>${label}</button>`).join('')}</nav>
        <div class="admin-nav-foot"><button type="button" id="adminBack">← Torna alla formazione</button></div>
      </aside>
      <main class="admin-main">
        <header class="admin-head">
          <button type="button" id="adminMenuBtn" class="admin-menu-btn">☰</button>
          <div class="admin-head-title"><div class="admin-kicker">CONSOLE</div><h1 id="adminTitle">Dashboard</h1><p id="adminSubtitle">Gestione operativa della piattaforma</p></div>
          <div class="admin-head-actions"><button type="button" id="adminHelpToggle" aria-controls="adminHelpPanel" aria-expanded="false" aria-label="Guida in linea per la sezione corrente" title="Apri la guida in linea">?</button><button type="button" id="adminRefresh">↻ Aggiorna</button></div>
        </header>
        <section id="adminHelpPanel" role="region" aria-labelledby="adminHelpHeading" hidden></section>
        <div id="adminContent"></div>
      </main>`;
    document.body.appendChild(shell);
    shell.querySelector('.admin-nav').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'); if (!b) return;
      state.tab = b.dataset.tab; closeNav(); render();
    });
    shell.querySelector('#adminBack').onclick = close;
    shell.querySelector('#adminMenuBtn').onclick = () => shell.classList.toggle('admin-mobile-nav-open');
    shell.querySelector('#adminNavBackdrop').onclick = closeNav;
    shell.querySelector('#adminRefresh').onclick = () => {
      invalidateProgress();
      const external = shell.querySelector('.admin-nav nav button.active:not([data-tab])');
      if (external) external.click(); else render();
    };
    shell.querySelector('#adminContent').addEventListener('input', e => {
      const input = e.target.closest('[data-admin-search]'); if (!input) return;
      state.filters[input.dataset.adminSearch] = input.value; render(false);
    });
    shell.querySelector('#adminContent').addEventListener('click', handleAction);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeNav(); } });
  }
  function closeNav() { document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open'); }

  async function resolveOrganizations() {
    const {data,error} = await db().from('organizations').select('id,name,code,active,created_at').order('created_at');
    if (error) throw error;
    state.orgs = alphabeticalBy(data,x=>x.name);
    const active = state.orgs.filter(x => x.active);
    state.defaultOrgId = active.length === 1 ? active[0].id : (active.find(x => x.code === 'DEFAULT')?.id || null);
    state.multiOrg = active.length > 1;
    document.querySelector('[data-tab="organizations"]')?.classList.toggle('hidden', !state.multiOrg);
    if (!state.multiOrg && state.tab === 'organizations') state.tab = 'dashboard';
  }
  async function isAdmin() {
    if (!db() || !user()) return false;
    const {data,error} = await db().from('platform_admins').select('user_id').eq('user_id', user().id).maybeSingle();
    if (error) throw error;
    if(data)return true;
    const scoped=await db().from('organization_memberships').select('role')
      .eq('user_id',user().id).eq('active',true)
      .in('role',['organization_admin','training_manager']).limit(1);
    if(scoped.error)throw scoped.error;
    return (scoped.data||[]).length>0;
  }
  async function refreshRole() {
    invalidateProgress();
    ensureUi();
    try { state.admin = await isAdmin(); if (state.admin) await resolveOrganizations(); }
    catch (e) { state.admin = false; console.warn('[Admin role]', e?.message || e); }
    document.getElementById('adminConsoleBtn')?.classList.toggle('hidden', !state.admin);
    if (!state.admin && state.open) close();
  }
  async function open() {
    ensureUi(); await refreshRole();
    if (!state.admin) return toast('Accesso amministrativo non disponibile.', 'error');
    state.open = true; document.getElementById('adminShell').classList.remove('hidden'); document.body.classList.add('admin-open');
    await render();
  }
  function close() {
    state.open = false; closeModal(); closeNav();
    document.getElementById('adminShell')?.classList.add('hidden'); document.body.classList.remove('admin-open');
  }
  async function render(showLoader=true) {
    if (!state.open || !state.admin || !db()) return;
    const seq = ++state.renderSeq; if (showLoader) out(loading());
    try { if (!state.orgs.length) await resolveOrganizations(); await (RENDERERS[state.tab] || dashboard)(seq); }
    catch (e) { if (seq === state.renderSeq) out(`<div class="admin-error">${esc(e?.message || e)}</div>`); }
  }
  function current(seq, html) { if (seq === state.renderSeq) out(html); }
  async function count(tableName, filter) {
    let q = db().from(tableName).select('*', {count:'exact', head:true}); if (filter) q = filter(q);
    const {count,error} = await q; if (error) throw error; return count || 0;
  }

  async function dashboard(seq) {
    setHeader('Panoramica', 'Indicatori, grafici e stato generale di corsi, persone e attività');
    const [companies,learners,courses,editions,enrollments,openEditions,inProgress,pendingInvites] = await Promise.all([
      count('companies', q => q.eq('active',true)), count('learners', q => q.eq('active',true)), count('courses', q => q.eq('active',true)),
      count('course_editions'), count('enrollments'), count('course_editions', q => q.eq('status','open')),
      count('enrollments', q => q.eq('status','in_progress')), count('learner_account_invitations', q => q.in('status',['not_sent','failed']))
    ]);
    current(seq, `
      <div class="v45-dashboard"><section class="v45-hero" aria-label="Accessi rapidi alla gestione"><div><span class="v45-eyebrow">Panoramica operativa</span><h2>Formazione sotto controllo</h2><p>Indicatori aggiornati e collegamenti ai flussi esistenti, nel rispetto delle autorizzazioni.</p></div><nav class="v45-quicklinks" aria-label="Collegamenti rapidi amministrazione"><button type="button" data-jump="learners">Corsisti</button><button type="button" data-jump="courses">Corsi</button><button type="button" data-jump="editions">Edizioni</button><button type="button" data-jump="enrollments">Iscrizioni</button></nav></section>
      <div class="admin-stats">${stat(companies,'Aziende attive')}${stat(learners,'Corsisti attivi')}${stat(courses,'Corsi attivi')}${stat(openEditions,'Edizioni aperte')}${stat(inProgress,'Percorsi in corso')}${stat(pendingInvites,'Accessi da gestire')}</div>
      <div class="admin-guided-cta"><div><h2>Avvia percorso · punto unico</h2><p>Crea nuove iscrizioni oppure riprendi quelle già presenti. Segui lo stato di ogni corsista fino alle verifiche.</p></div><button type="button" data-jump="wizard">+ Avvia percorso →</button></div>
      <div class="admin-grid two">
        <section class="admin-card"><div class="admin-card-head"><div><h2>Sequenza unica · Avvia percorso</h2><p>La stessa sequenza della procedura guidata, senza navigare fra schede separate.</p></div></div><ol class="gw-unified-preview"><li><b>1</b> Azienda: seleziona o crea l’anagrafica</li><li><b>2</b> Corso ed edizione: scegli una versione pronta e un’edizione aperta</li><li><b>3</b> Corsisti: scegli persone esistenti o crea nuove anagrafiche</li><li><b>4</b> Iscrizione: verifica e conferma la sola assegnazione</li><li><b>5</b> Stato corsisti: account, disponibilità, frequenza e verifiche</li></ol><button type="button" class="gw-unified-cta" data-jump="wizard">Apri Avvia percorso · gestione completa</button><p class="admin-note" style="margin-top:10px">Per un corsista già iscritto scegli la sua azienda, l’edizione e il nominativo, quindi «Controlla stato esistente». Le altre sezioni restano disponibili per la gestione avanzata.</p></section>
        <section class="admin-card"><div class="admin-card-head"><div><h2>Stato piattaforma</h2><p>Numeri amministrativi correnti.</p></div></div><div class="admin-summary-list"><div><span>Edizioni complessive</span><strong>${editions}</strong></div><div><span>Iscrizioni complessive</span><strong>${enrollments}</strong></div><div><span>Organizzazione</span><strong>${esc(state.multiOrg ? `${state.orgs.filter(x=>x.active).length} attive` : (state.orgs.find(x=>x.id===state.defaultOrgId)?.name || '—'))}</strong></div><div><span>Pubblicazione contenuti</span><strong>Controllata</strong></div></div><p class="admin-note">La console non pubblica automaticamente Learning Unit o nuove versioni corso: le operazioni editoriali restano soggette a revisione.</p></section>
      </div>
      <section class="admin-card"><div class="admin-card-head"><div><h2>Analisi della formazione</h2><p>Indicatori, distribuzione percorsi, tendenze e partecipazione.</p></div><button data-action="open-reports-v40" type="button">Apri report dettagliati →</button></div><div id="adminDashboardAnalytics" aria-live="polite">Caricamento grafici…</div></section></div>`);
    if(seq===state.renderSeq)void window.SAFETY_ADMIN_ANALYTICS_V40?.renderDashboard?.({targetId:'adminDashboardAnalytics'});
  }

  async function organizations(seq) {
    setHeader('Organizzazioni', 'Gestione tenant della piattaforma');
    const q = state.filters.organizations || '';
    const rows = state.orgs.filter(x => match(q,x.name,x.code));
    current(seq, `<section class="admin-card"><div class="admin-card-head"><div><h2>Organizzazioni</h2><p>Visibile solo in configurazione multi-organizzazione.</p></div></div>${searchBox('organizations','Nome o codice…')}${table(['Nome','Codice','Stato','Azioni'], rows.map(x => [esc(x.name),esc(x.code||'—'),badge(x.active?'Attiva':'Disattiva',x.active?'ok':'muted'),`${btn('Modifica','edit-org',x.id)} ${btn(x.active?'Disattiva':'Riattiva','toggle-org',x.id,x.active?'danger':'')}`]))}</section>`);
  }

  async function companies(seq) {
    setHeader('Aziende', 'Anagrafiche aziendali e contesto ATECO');
    const {data,error} = await db().from('companies').select('id,organization_id,name,vat_number,fiscal_code,ateco_code,active,created_at').order('name');
    if (error) throw error;
    const om = new Map(state.orgs.map(x => [x.id,x.name])), q = state.filters.companies || '';
    const rows = (data||[]).filter(x => match(q,x.name,x.vat_number,x.fiscal_code,x.ateco_code,om.get(x.organization_id)));
    current(seq, `<section class="admin-card"><div class="admin-card-head"><div><h2>Aziende</h2><p>${rows.length} anagrafiche visualizzate.</p></div><button class="admin-primary" data-action="new-company">+ Nuova azienda</button></div>${searchBox('companies','Azienda, P.IVA, CF, ATECO…')}${table(['Azienda',...(state.multiOrg?['Organizzazione']:[]),'P. IVA','CF','ATECO','Stato','Azioni'], rows.map(x => [esc(x.name),...(state.multiOrg?[esc(om.get(x.organization_id)||'—')]:[]),esc(x.vat_number||'—'),esc(x.fiscal_code||'—'),esc(x.ateco_code||'—'),badge(x.active?'Attiva':'Disattiva',x.active?'ok':'muted'),`${btn('Modifica','edit-company',x.id)} ${btn(x.active?'Disattiva':'Riattiva','toggle-company',x.id,x.active?'danger':'')} ${btn('Elimina…','review-delete-company',x.id,'danger')}`]))}</section>`);
  }

  function inviteState(learner, inv) {
    if (learner?.auth_user_id || inv?.status === 'accepted') return ['Account attivo','ok'];
    if (!learner?.email) return ['Email mancante','warn'];
    if (inv?.status === 'sent') return ['Invitato','info'];
    if (inv?.status === 'failed') return ['Invio fallito','danger'];
    if (inv?.status === 'revoked') return ['Invito revocato','warn'];
    return ['Da invitare','muted'];
  }
  async function learners(seq) {
    setHeader('Corsisti', 'Anagrafiche, account di accesso e inviti');
    const [{data:l,error},{data:c},{data:i}] = await Promise.all([
      db().from('learners').select('id,organization_id,company_id,auth_user_id,first_name,last_name,email,fiscal_code,job_title,active,created_at').order('created_at',{ascending:false}),
      db().from('companies').select('id,name,organization_id'),
      db().from('learner_account_invitations').select('learner_id,status,sent_count,last_sent_at,last_error')
    ]);
    if (error) throw error;
    const cm = new Map((c||[]).map(x=>[x.id,x.name])), im = new Map((i||[]).map(x=>[x.learner_id,x])), om = new Map(state.orgs.map(x=>[x.id,x.name]));
    const q = state.filters.learners || '', rows = alphabeticalBy((l||[]).filter(x => (state.showArchivedLearners||x.active)&&match(q,x.first_name,x.last_name,x.email,x.fiscal_code,x.job_title,cm.get(x.company_id))),x=>(x.last_name||'')+' '+(x.first_name||''));
    const archivedCount=(l||[]).filter(x=>!x.active).length;
    const missing = (l||[]).filter(x=>x.active&&!x.email).length;
    current(seq, `${missing?`<div class="admin-warning">${missing} corsist${missing===1?'a attivo non ha':'i attivi non hanno'} un indirizzo email: l’invito via email non è disponibile. Usa Invita o Reinvia e scegli Copia link o QR code.</div>`:''}<section class="admin-card"><div class="admin-card-head"><div><h2>Corsisti</h2><p>Rimuovi subito i corsisti errati dall’elenco attivo, senza perdere lo storico.</p></div><button type="button" data-action="toggle-archived-learners">${state.showArchivedLearners?'Nascondi':'Mostra'} rimossi (${archivedCount})</button><button class="admin-primary" data-action="new-learner">+ Nuovo corsista</button></div>${searchBox('learners','Nome, email, CF, azienda, mansione…')}${table(['Corsista','Email','Azienda',...(state.multiOrg?['Organizzazione']:[]),'Mansione','Accesso','Stato','Azioni'], rows.map(x => { const inv=im.get(x.id), [s,k]=inviteState(x,inv); return [esc(`${x.first_name||''} ${x.last_name||''}`.trim()||'—'),esc(x.email||'—'),esc(cm.get(x.company_id)||'—'),...(state.multiOrg?[esc(om.get(x.organization_id)||'—')]:[]),esc(x.job_title||'—'),`${badge(s,k)}${inv?.last_sent_at?`<small class="admin-cell-note">${fmtDateTime(inv.last_sent_at)}</small>`:''}`,badge(x.active?'Attivo':'Disattivo',x.active?'ok':'muted'),`${btn('Modifica','edit-learner',x.id)} ${x.active&&!x.auth_user_id?btn(inv?'Reinvia':'Invita','invite-learner',x.id):''} ${!x.email&&x.active?btn('Sposta in interni','move-learner-internal',x.id):''} ${x.active?btn('Rimuovi corsista','archive-learner-v36',x.id,'danger'):btn('Ripristina','restore-learner-v37',x.id)} ${btn('Elimina definitivamente…','quick-delete-learner-v38',x.id,'danger')}`]; }))}</section>`);
    void renderLearnerProgress(seq,q);
  }

  async function loadProgressData(){
    if(progressCache.snapshot&&Date.now()-progressCache.at<30000)return progressCache.snapshot;
    if(!progressCache.pending){
      const generation=progressCache.generation;
      progressCache.pending=Promise.all([
        db().from('enrollments').select('id,learner_id,edition_id,status,progress_pct,active_seconds,last_activity_at').order('enrolled_at',{ascending:false}),
        db().from('learners').select('id,first_name,last_name,email,company_id'),
        db().from('course_editions').select('id,title,course_version_id'),
        db().from('course_versions').select('id,course_id'),
        db().from('courses').select('id,title,nominal_minutes')
      ]).then(rows=>{
        if(generation!==progressCache.generation)throw new Error('Monitoraggio annullato dopo cambio sessione o aggiornamento.');
        if(rows.some(r=>r.error))throw rows.find(r=>r.error).error;
        progressCache.snapshot=rows;progressCache.at=Date.now();return rows;
      }).finally(()=>{if(generation===progressCache.generation)progressCache.pending=null;});
    }
    return progressCache.pending;
  }

  async function renderLearnerProgress(seq,query){
    const host=document.getElementById('adminContent');if(!host||seq!==state.renderSeq)return;
    const section=document.createElement('section');section.id='adminLearnerProgress';section.className='admin-card';
    section.innerHTML='<div class="admin-card-head"><div><h2>Avanzamento corsisti per corso</h2><p>Progresso dei contenuti e confronto tra tempo attivo e durata nominale.</p></div></div><div class="admin-loading">Caricamento monitoraggio…</div>';
    host.appendChild(section);
    try{
      const [{data:en,error:ee},{data:learners,error:le},{data:ed,error:de},{data:versions,error:ve},{data:courses,error:ce}]=await loadProgressData();
      if(ee||le||de||ve||ce)throw ee||le||de||ve||ce;
      if(seq!==state.renderSeq||!section.isConnected||state.tab!=='learners')return;
      const lm=new Map((learners||[]).map(x=>[x.id,x])),em=new Map((ed||[]).map(x=>[x.id,x])),vm=new Map((versions||[]).map(x=>[x.id,x])),cm=new Map((courses||[]).map(x=>[x.id,x]));
      const rows=(en||[]).map(item=>{
        const learner=lm.get(item.learner_id),edition=em.get(item.edition_id),course=cm.get(vm.get(edition?.course_version_id)?.course_id);
        return {item,learner,edition,course,name:`${learner?.first_name||''} ${learner?.last_name||''}`.trim()||learner?.email||'Corsista'};
      }).filter(r=>r.learner&&match(query,r.name,r.learner.email,r.edition?.title,r.course?.title,r.item.status));
      const valid=rows.filter(r=>r.item.status!=='revoked'),done=valid.filter(r=>['passed','completed'].includes(r.item.status)).length;
      const average=valid.length?Math.round(valid.reduce((sum,r)=>sum+clampPct(r.item.progress_pct),0)/valid.length):0;
      const list=rows.map(({item,edition,course,name})=>{
        const nominal=Math.max(0,Number(course?.nominal_minutes)||0),active=Math.max(0,Number(item.active_seconds)||0);
        const target=nominal?fmtActiveTime(nominal*60):'non indicata';
        const ratio=nominal?Math.min(100,Math.round(active/(nominal*60)*100)):null;
        return `<tr><td><strong>${esc(name)}</strong></td><td>${esc(course?.title||edition?.title||'Corso non disponibile')}<small class="admin-cell-note">${esc(edition?.title&&edition?.title!==course?.title?edition.title:'')}</small></td><td>${badge(LABEL[item.status]||item.status,item.status==='revoked'?'danger':['completed','passed'].includes(item.status)?'ok':'info')}</td><td>${progressBar(item.progress_pct,'Avanzamento contenuti di '+name)}</td><td><strong>${esc(fmtActiveTime(active))}</strong><small class="admin-cell-note">Durata prevista: ${esc(target)}${ratio!==null?` · ${ratio}% del tempo nominale`:''}</small></td><td>${fmtDateTime(item.last_activity_at)}</td></tr>`;
      }).join('');
      section.innerHTML=`<div class="admin-card-head"><div><h2>Avanzamento corsisti per corso</h2><p>La percentuale indica il completamento dei contenuti; il tempo attivo è separato e non certifica da solo la frequenza.</p></div></div><div class="admin-stats">${stat(valid.length,'Iscrizioni attive')}${stat(done,'Percorsi completati')}${stat(average+'%','Progresso medio dei contenuti')}</div><div class="admin-table-wrap"><table class="admin-table admin-learner-progress-table"><thead><tr><th>Corsista</th><th>Corso / edizione</th><th>Stato</th><th>Contenuti</th><th>Tempo seguito / previsto</th><th>Ultima attività</th></tr></thead><tbody>${list||'<tr><td colspan="6" class="admin-empty">Nessun percorso assegnato per la ricerca corrente.</td></tr>'}</tbody></table></div>`;
    }catch(error){if(seq===state.renderSeq&&section.isConnected)section.innerHTML=`<div class="admin-error">Impossibile caricare l’avanzamento: ${esc(error?.message||error)}</div>`;}
  }

  async function courses(seq) {
    setHeader('Corsi', 'Catalogo SafetyTraining e stato versioni');
    const [{data:c,error},{data:v}] = await Promise.all([
      db().from('courses').select('id,title,stable_key,family,description,nominal_minutes,certification_mode,active,metadata').order('title'),
      db().from('course_versions').select('id,course_id,version_number,status,published_at,syllabus_snapshot,created_at').order('version_number',{ascending:false})
    ]);
    if (error) throw error;
    const latest = new Map(); (v||[]).forEach(x=>{if(!latest.has(x.course_id))latest.set(x.course_id,x);});
    const q = state.filters.courses || '', rows = (c||[]).filter(x=>match(q,x.title,x.stable_key,x.family));
    current(seq, `<section class="admin-card"><div class="admin-card-head"><div><h2>Corsi</h2><p>Le nuove versioni nascono in bozza: nessuna pubblicazione automatica.</p></div><button class="admin-primary" data-action="new-course">+ Nuovo corso</button></div>${searchBox('courses','Titolo, chiave, famiglia…')}${table(['Corso','Famiglia','Durata','Versione','Governance','Stato','Azioni'], rows.map(x=>{const ver=latest.get(x.id),approved=ver&&asBool(ver.syllabus_snapshot?.finalization_candidate)&&asBool(ver.syllabus_snapshot?.go_live_ready),frozen=asBool(x.metadata?.frozen);return [`<strong>${esc(x.title)}</strong><small class="admin-cell-note">${esc(x.stable_key)}</small>`,esc(x.family),hours(x.nominal_minutes),ver?`v${ver.version_number} · ${badge(LABEL[ver.status]||ver.status,ver.status==='published'?'ok':ver.status==='draft'?'warn':'muted')}`:'—',approved?badge('Approvata','ok'):frozen?badge('Congelato','muted'):badge('In revisione','warn'),badge(x.active?'Attivo':'Disattivo',x.active?'ok':'muted'),`${btn('Modifica','edit-course',x.id)} ${btn('Materiali','materials-course',x.id)}`];}))}</section>`);
  }

  function approvedVersions(courses, versions) {
    const courseMap = new Map((courses||[]).map(x=>[x.id,x]));
    return (versions||[]).filter(v=>{
      const c=courseMap.get(v.course_id),m=c?.metadata||{};
      return c?.active && !asBool(m.frozen) && !asBool(m.exclude_from_finalization_queue) && m.finalization_scope!=='reference_library' && v.status==='published' && asBool(v.syllabus_snapshot?.finalization_candidate) && asBool(v.syllabus_snapshot?.go_live_ready);
    });
  }
  async function editions(seq) {
    setHeader('Edizioni', 'Apertura percorsi su versioni approvate');
    const [{data:e,error},{data:companies},{data:courses},{data:versions},{data:en},{data:learners}] = await Promise.all([
      db().from('course_editions').select('id,course_version_id,organization_id,company_id,title,status,learning_mode,certification_mode,available_from,available_until,recommended_due_at,block_after_due,created_at').order('created_at',{ascending:false}),
      db().from('companies').select('id,organization_id,name,active').order('name'),
      db().from('courses').select('id,title,active,metadata').order('title'),
      db().from('course_versions').select('id,course_id,version_number,status,syllabus_snapshot,created_at').order('version_number',{ascending:false}),
      db().from('enrollments').select('edition_id,learner_id,status,progress_pct'),
      db().from('learners').select('id,auth_user_id')
    ]);
    if (error) throw error;
    const approved=alphabeticalBy(approvedVersions(courses,versions),x=>courses?.find(c=>c.id===x.course_id)?.title), vm=new Map((versions||[]).map(x=>[x.id,x])), cm=new Map((courses||[]).map(x=>[x.id,x.title])), companyMap=new Map((companies||[]).map(x=>[x.id,x.name])), lm=new Map((learners||[]).map(x=>[x.id,x]));
    const q=state.filters.editions||'', rows=(e||[]).filter(x=>{const v=vm.get(x.course_version_id);return match(q,x.title,x.status,companyMap.get(x.company_id),cm.get(v?.course_id));});
    const stats = id => {const list=(en||[]).filter(x=>x.edition_id===id&&x.status!=='revoked');return {total:list.length,account:list.filter(x=>lm.get(x.learner_id)?.auth_user_id).length,running:list.filter(x=>x.status==='in_progress'||Number(x.progress_pct||0)>0&&!['completed','passed'].includes(x.status)).length,done:list.filter(x=>['completed','passed'].includes(x.status)).length};};
    current(seq, `<section class="admin-card"><div class="admin-card-head"><div><h2>Nuova edizione</h2><p>Solo versioni pubblicate, finalizzate e pronte al go-live.</p></div>${badge(`${approved.length} versioni disponibili`,approved.length?'ok':'warn')}</div><form id="editionForm" class="admin-form grid">${state.multiOrg?orgSelect('organization_id','editionOrg'):`<input type="hidden" name="organization_id" value="${esc(state.defaultOrgId)}">`}<label>Azienda<select id="editionCompany" name="company_id"><option value="">Tutte le aziende</option>${(companies||[]).filter(x=>x.active).map(x=>`<option data-org="${x.organization_id}" value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label><label class="wide">Corso / versione<select name="course_version_id" required ${approved.length?'':'disabled'}><option value="">Seleziona versione approvata…</option>${approved.map(v=>`<option value="${v.id}">${esc(cm.get(v.course_id)||'Corso')} · v${v.version_number}</option>`).join('')}</select></label><label class="wide">Titolo edizione<input name="title" placeholder="Opzionale"></label><label>Modalità<select name="learning_mode"><option value="elearning_internal">E-learning interno</option><option value="classroom">Aula</option><option value="blended">Blended</option><option value="self_study">Autoformazione</option></select></label><label>Stato<select name="status"><option value="draft">Bozza</option><option value="open">Aperta</option></select></label><label>Disponibile da<input type="datetime-local" name="available_from"></label><label>Disponibile fino a<input type="datetime-local" name="available_until"></label><div class="admin-form-actions wide"><button class="admin-primary" ${approved.length?'':'disabled'}>Crea edizione</button></div></form></section><section class="admin-card"><div class="admin-card-head"><div><h2>Edizioni</h2><p>Stato, disponibilità e partecipazione.</p></div></div>${searchBox('editions','Titolo, corso, azienda, stato…')}${table(['Edizione','Corso','Azienda','Stato','Disponibilità','Partecipazione','Azioni'], rows.map(x=>{const v=vm.get(x.course_version_id),st=stats(x.id);return [`<strong>${esc(x.title||cm.get(v?.course_id)||'Edizione')}</strong><small class="admin-cell-note">${esc(x.learning_mode)}</small>`,`${esc(cm.get(v?.course_id)||'—')}<small class="admin-cell-note">v${v?.version_number||'—'}</small>`,esc(companyMap.get(x.company_id)||'Tutte le aziende'),badge(LABEL[x.status]||x.status,x.status==='open'?'ok':x.status==='draft'?'warn':'muted'),`${x.available_from?fmtDate(x.available_from):'Subito'} → ${x.available_until?fmtDate(x.available_until):'Senza scadenza'}`,`<div class="admin-metrics"><span>👥 ${st.total}</span><span>🔐 ${st.account}</span><span>▶ ${st.running}</span><span>✓ ${st.done}</span></div>`,`${btn('Modifica','edit-edition',x.id)} ${btn('Gestisci corsisti','manage-edition',x.id)} ${x.status==='open'?btn('Chiudi','close-edition',x.id,'danger'):x.status==='closed'?btn('Riapri','open-edition',x.id):''} ${btn('Elimina…','review-delete-edition',x.id,'danger')}`];}))}</section>`);
    const form=document.getElementById('editionForm'); if(form){form.onsubmit=e=>createEdition(e,companies||[]); bindOrgCompany(form,'[name="organization_id"]','#editionCompany');}
  }

  async function enrollments(seq) {
    setHeader('Iscrizioni', 'Assegnazione corsisti, accessi e avanzamento');
    const [{data:ed,error},{data:learners},{data:en},{data:versions},{data:courses},{data:invites}] = await Promise.all([
      db().from('course_editions').select('id,organization_id,company_id,course_version_id,title,status').order('created_at',{ascending:false}),
      db().from('learners').select('id,organization_id,company_id,first_name,last_name,email,auth_user_id,active').eq('active',true).order('last_name'),
      db().from('enrollments').select('id,edition_id,learner_id,status,progress_pct,active_seconds,final_score_pct,last_activity_at,enrolled_at').order('created_at',{ascending:false}),
      db().from('course_versions').select('id,course_id,version_number'),
      db().from('courses').select('id,title'),
      db().from('learner_account_invitations').select('learner_id,status,sent_count,last_sent_at')
    ]);
    if(error) throw error;
    const em=new Map((ed||[]).map(x=>[x.id,x])), lm=new Map((learners||[]).map(x=>[x.id,x])), vm=new Map((versions||[]).map(x=>[x.id,x])), cm=new Map((courses||[]).map(x=>[x.id,x.title])), im=new Map((invites||[]).map(x=>[x.learner_id,x]));
    const open=alphabeticalBy((ed||[]).filter(x=>x.status==='open'),x=>x.title||cm.get(vm.get(x.course_version_id)?.course_id)); const q=state.filters.enrollments||'';
    const rows=(en||[]).filter(x=>{if(!state.showRevokedEnrollments&&x.status==='revoked')return false;const l=lm.get(x.learner_id),edition=em.get(x.edition_id),v=vm.get(edition?.course_version_id);return match(q,l?.first_name,l?.last_name,l?.email,edition?.title,cm.get(v?.course_id),x.status);});
    const revokedCount=(en||[]).filter(x=>x.status==='revoked').length;
    current(seq, `<section class="admin-card"><div class="admin-card-head"><div><h2>Iscrizione multipla</h2><p>Assegna un’edizione e, se necessario, invia gli accessi.</p></div></div><div class="admin-bulk-grid"><div><label>Edizione<select id="bulkEdition"><option value="">Seleziona edizione…</option>${open.map(x=>{const v=vm.get(x.course_version_id);return `<option value="${x.id}">${esc(x.title||cm.get(v?.course_id)||'Edizione')}</option>`;}).join('')}</select></label><div id="bulkSummary" class="admin-note-block">Seleziona un’edizione.</div><label class="inline-check"><input type="checkbox" id="bulkInvite" checked> Invita gli account non ancora attivi</label><div class="admin-bulk-actions"><button type="button" data-action="bulk-select-all">Seleziona tutti</button><button type="button" data-action="bulk-clear">Deseleziona</button><button type="button" class="admin-primary" data-action="bulk-submit">Iscrivi selezionati</button></div></div><div id="bulkLearners" class="admin-check-list"><div class="admin-empty">Nessuna edizione selezionata.</div></div></div></section><section class="admin-card"><div class="admin-card-head"><div><h2>Iscrizioni</h2><p>Per correggere un errore usa «Annulla iscrizione»; lo storico non viene cancellato. I record revocati sono nascosti, ma recuperabili.</p></div><button type="button" data-action="toggle-revoked-enrollments">${state.showRevokedEnrollments?'Nascondi':'Mostra'} revocate (${revokedCount})</button></div>${searchBox('enrollments','Corsista, corso, edizione, stato…')}${table(['Corsista','Percorso','Stato','Progresso','Tempo','Punteggio','Ultima attività','Azioni'], rows.map(x=>{const l=lm.get(x.learner_id),edition=em.get(x.edition_id),v=vm.get(edition?.course_version_id),[access,kind]=inviteState(l,im.get(x.learner_id));return [`<strong>${esc(`${l?.first_name||''} ${l?.last_name||''}`.trim()||l?.email||'—')}</strong><small class="admin-cell-note">${badge(access,kind)}</small>`,esc(edition?.title||cm.get(v?.course_id)||'—'),badge(LABEL[x.status]||x.status,['completed','passed'].includes(x.status)?'ok':x.status==='in_progress'?'info':x.status==='revoked'?'danger':'muted'),`${progressBar(x.progress_pct,'Avanzamento contenuti')}`,`${Math.floor(Number(x.active_seconds||0)/60)} min`,x.final_score_pct==null?'—':`${x.final_score_pct}%`,fmtDateTime(x.last_activity_at),(x.status==='revoked'?btn('Riattiva','restore',x.id):btn(x.status==='not_started'&&!Number(x.progress_pct)&&!Number(x.active_seconds)&&!x.last_activity_at?'Annulla iscrizione errata':'Revoca accesso','revoke',x.id,'danger'))+' '+btn('Elimina…','review-delete-enrollment',x.id,'danger')];}))}</section>`);
    setupBulk({open,learners:learners||[],enrollments:en||[],invites:im});
  }

  async function activity(seq) {
    setHeader('Controllo operativo', 'Priorità corsisti, risultati, attività e audit amministrativo');
    const [{data:events,error},{data:en},{data:l},{data:ed},{data:v},{data:c}] = await Promise.all([
      db().from('learning_events').select('event_type,occurred_at,active_delta_seconds,enrollment_id').order('occurred_at',{ascending:false}).limit(200),
      db().from('enrollments').select('id,learner_id,edition_id'), db().from('learners').select('id,first_name,last_name,email'),
      db().from('course_editions').select('id,course_version_id,title'), db().from('course_versions').select('id,course_id'), db().from('courses').select('id,title')
    ]);
    if(error) throw error;
    const enm=new Map((en||[]).map(x=>[x.id,x])), lm=new Map((l||[]).map(x=>[x.id,x])), edm=new Map((ed||[]).map(x=>[x.id,x])), vm=new Map((v||[]).map(x=>[x.id,x])), cm=new Map((c||[]).map(x=>[x.id,x.title])), q=state.filters.activity||'';
    const rows=(events||[]).filter(x=>match(q,x.event_type)).map(x=>{const enrollment=enm.get(x.enrollment_id),learner=lm.get(enrollment?.learner_id),edition=edm.get(enrollment?.edition_id),ver=vm.get(edition?.course_version_id);return [fmtDateTime(x.occurred_at),esc(x.event_type),esc(`${learner?.first_name||''} ${learner?.last_name||''}`.trim()||learner?.email||'—'),esc(edition?.title||cm.get(ver?.course_id)||'—'),`${x.active_delta_seconds||0}s`];});
    current(seq, `
      <section class="admin-card">
        <div class="admin-card-head"><div><h2>Controllo corsisti e percorsi</h2><p>Priorità operative ricavate da iscrizioni, avanzamento, attività ed esiti disponibili.</p></div><button type="button" data-action="open-reports-v40">Report dettagliati →</button></div>
        <div id="adminControlAnalytics" aria-live="polite">Caricamento controlli…</div>
      </section>
      <section class="admin-card"><div class="admin-card-head"><div><h2>Eventi recenti</h2><p>Ultimi 200 eventi di apprendimento disponibili.</p></div></div>${searchBox('activity','Tipo evento…')}${table(['Quando','Evento','Corsista','Percorso','Tempo accreditato'],rows)}</section>`);
    if(seq===state.renderSeq)void window.SAFETY_ADMIN_ANALYTICS_V40?.renderControlSummary?.({targetId:'adminControlAnalytics'});
  }

  async function wizard(seq){
    setHeader('Avvia percorso','Iscrivi uno o più corsisti con una procedura guidata');
    await window.SAFETY_ADMIN_GUIDED_FLOW_V22?.render?.({isCurrent:()=>state.open&&state.admin&&state.tab==='wizard'&&state.renderSeq===seq});
  }
  const RENDERERS={dashboard,wizard,organizations,companies,learners,courses,editions,enrollments,activity};

  function modal(title, body, {wide=false}={}) {
    closeModal(); const ov=document.createElement('div'); ov.id='adminModal'; ov.className='admin-modal-overlay';
    ov.innerHTML=`<section class="admin-modal ${wide?'wide':''}"><header><div><div class="admin-kicker">AMMINISTRAZIONE</div><h2>${esc(title)}</h2></div><button type="button" class="admin-modal-close">×</button></header><div class="admin-modal-body">${body}</div></section>`;
    ov.onclick=e=>{if(e.target===ov)closeModal();}; ov.querySelector('.admin-modal-close').onclick=closeModal; document.body.appendChild(ov); state.modal=ov; return ov;
  }
  function closeModal(){ state.modal?.remove(); state.modal=null; document.getElementById('adminModal')?.remove(); }
  function orgInput(name='organization_id') {
    if (!state.multiOrg && state.defaultOrgId) return `<input type="hidden" name="${name}" value="${esc(state.defaultOrgId)}">`;
    return `<label>Organizzazione<select name="${name}" required><option value="">Seleziona…</option>${state.orgs.filter(x=>x.active).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>`;
  }
  function bindOrgCompany(root, orgSelector, companySelector) {
    const org=root.querySelector(orgSelector), company=root.querySelector(companySelector); if(!company)return;
    const apply=()=>{const oid=org?.value||state.defaultOrgId||'';[...company.options].forEach((o,i)=>{if(i)o.hidden=!!oid&&o.dataset.org!==oid;});if(company.selectedOptions[0]?.hidden)company.value='';};
    if(org)org.onchange=apply; apply();
  }
  async function update(tableName,id,patch,message='Modifiche salvate.') {
    const {error}=await db().from(tableName).update(patch).eq('id',id); if(error)throw error;
    toast(message,'success'); closeModal(); await render();
  }

  async function editOrganization(id) {
    const x=state.orgs.find(o=>o.id===id); if(!x)return;
    const ov=modal('Modifica organizzazione',`<form class="admin-form grid"><label class="wide">Nome<input name="name" required value="${esc(x.name)}"></label><label>Codice<input name="code" value="${esc(x.code||'')}"></label><div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">Salva</button></div></form>`);
    ov.querySelector('[data-close]').onclick=closeModal;
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await update('organizations',id,{name:f.get('name').trim(),code:f.get('code')?.trim()||null});await resolveOrganizations();};
  }
  async function editCompany(id) {
    const [{data:companies,error},{data:orgs}] = await Promise.all([db().from('companies').select('*').order('name'),db().from('organizations').select('id,name,active')]); if(error)throw error;
    const x=id?(companies||[]).find(v=>v.id===id):null;
    const ov=modal(x?'Modifica azienda':'Nuova azienda',`<form class="admin-form grid">${state.multiOrg?`<label>Organizzazione<select name="organization_id" required>${(orgs||[]).filter(o=>o.active).map(o=>`<option value="${o.id}" ${x?.organization_id===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label>`:`<input type="hidden" name="organization_id" value="${esc(state.defaultOrgId)}">`}<label class="wide">Ragione sociale<input name="name" required value="${esc(x?.name||'')}"></label><label>P. IVA<input name="vat_number" value="${esc(x?.vat_number||'')}"></label><label>Codice fiscale<input name="fiscal_code" value="${esc(x?.fiscal_code||'')}"></label><label>ATECO<input name="ateco_code" value="${esc(x?.ateco_code||'')}"></label><div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">${x?'Salva':'Crea'}</button></div></form>`);
    ov.querySelector('[data-close]').onclick=closeModal;
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),payload={organization_id:f.get('organization_id')||state.defaultOrgId,name:f.get('name').trim(),vat_number:f.get('vat_number')?.trim()||null,fiscal_code:f.get('fiscal_code')?.trim()||null,ateco_code:f.get('ateco_code')?.trim()||null};if(x)return update('companies',id,payload,'Azienda aggiornata.');const {error}=await db().from('companies').insert(payload);if(error)throw error;toast('Azienda creata.','success');closeModal();await render();};
  }
  async function editLearner(id) {
    const [{data:x,error},{data:companies}] = await Promise.all([id?db().from('learners').select('*').eq('id',id).single():Promise.resolve({data:null,error:null}),db().from('companies').select('id,name,organization_id,active').eq('active',true).order('name')]); if(error)throw error;
    const ov=modal(x?'Modifica corsista':'Nuovo corsista',`<form class="admin-form grid">${orgInput()}<label>Azienda<select id="modalLearnerCompany" name="company_id"><option value="">Nessuna / opzionale</option>${(companies||[]).map(co=>`<option data-org="${co.organization_id}" value="${co.id}" ${x?.company_id===co.id?'selected':''}>${esc(co.name)}</option>`).join('')}</select></label><label>Nome<input name="first_name" value="${esc(x?.first_name||'')}"></label><label>Cognome<input name="last_name" value="${esc(x?.last_name||'')}"></label><label class="wide">Email<input type="email" name="email" value="${esc(x?.email||'')}"></label><label>Codice fiscale<input name="fiscal_code" value="${esc(x?.fiscal_code||'')}"></label><label>Mansione<input name="job_title" value="${esc(x?.job_title||'')}"></label><div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">${x?'Salva':'Crea anagrafica'}</button></div></form>`);
    ov.querySelector('[data-close]').onclick=closeModal; const org=ov.querySelector('[name="organization_id"]'); if(x&&org&&org.tagName==='SELECT')org.value=x.organization_id; bindOrgCompany(ov,'[name="organization_id"]','#modalLearnerCompany');
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),organization_id=f.get('organization_id')||state.defaultOrgId,company=(companies||[]).find(co=>co.id===f.get('company_id'));if(company&&company.organization_id!==organization_id)return toast('L’azienda non appartiene all’organizzazione selezionata.','error');const payload={organization_id,company_id:f.get('company_id')||null,first_name:f.get('first_name')?.trim()||null,last_name:f.get('last_name')?.trim()||null,email:f.get('email')?.trim()||null,fiscal_code:f.get('fiscal_code')?.trim()||null,job_title:f.get('job_title')?.trim()||null};if(x)return update('learners',id,payload,'Corsista aggiornato.');const {error}=await db().from('learners').insert(payload);if(error)throw error;toast('Corsista creato.','success');closeModal();await render();};
  }
  async function editCourse(id) {
    let x=null,latest=null,unitCount=0;
    if(id){const [{data:c,error},{data:v}]=await Promise.all([db().from('courses').select('*').eq('id',id).single(),db().from('course_versions').select('id,version_number,status,published_at,syllabus_snapshot').eq('course_id',id).order('version_number',{ascending:false}).limit(1)]);if(error)throw error;x=c;latest=v?.[0]||null;if(latest){const {data:mods}=await db().from('course_modules').select('id').eq('course_version_id',latest.id);const ids=(mods||[]).map(m=>m.id);if(ids.length){const {count}=await db().from('course_module_units').select('*',{count:'exact',head:true}).in('module_id',ids);unitCount=count||0;}}}
    const approved=latest&&asBool(latest.syllabus_snapshot?.finalization_candidate)&&asBool(latest.syllabus_snapshot?.go_live_ready);
    const ov=modal(x?'Modifica corso':'Nuovo corso',`<form class="admin-form grid"><label class="wide">Titolo<input name="title" required value="${esc(x?.title||'')}"></label><label>Chiave stabile<input name="stable_key" required ${x?'disabled':''} value="${esc(x?.stable_key||'')}"></label><label>Famiglia<input name="family" value="${esc(x?.family||'other')}"></label><label>Durata nominale (min)<input type="number" min="0" name="nominal_minutes" value="${x?.nominal_minutes??''}"></label><label>Modalità certificazione<select name="certification_mode"><option value="internal_learning" ${x?.certification_mode==='internal_learning'?'selected':''}>Percorso interno</option><option value="certifiable" ${x?.certification_mode==='certifiable'?'selected':''}>Certificabile</option><option value="certified_only" ${x?.certification_mode==='certified_only'?'selected':''}>Solo certificato</option></select></label>${x?`<label>Stato corso<select name="active" ${approved?'disabled':''}><option value="true" ${x.active?'selected':''}>Attivo</option><option value="false" ${!x.active?'selected':''}>Disattivo</option></select></label><label>Versione corrente<input disabled value="${latest?`v${latest.version_number} · ${LABEL[latest.status]||latest.status}`:'nessuna'}"></label>`:''}<label class="wide">Descrizione<textarea name="description">${esc(x?.description||'')}</textarea></label>${x?`<div class="admin-material-box wide"><strong>Materiale didattico</strong><span>${unitCount} Learning Unit collegate alla versione corrente.</span>${approved?'<em>Versione approvata: attivazione protetta da modifiche accidentali.</em>':''}<button type="button" data-open-materials>Apri materiali</button></div>`:''}<div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">${x?'Salva':'Crea in bozza'}</button></div></form>`,{wide:true});
    ov.querySelector('[data-close]').onclick=closeModal;ov.querySelector('[data-open-materials]')?.addEventListener('click',()=>{closeModal();close();location.hash=`library/${x.stable_key}`;});
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),payload={title:f.get('title').trim(),family:f.get('family')?.trim()||'other',description:f.get('description')?.trim()||null,nominal_minutes:f.get('nominal_minutes')===''?null:Number(f.get('nominal_minutes')),certification_mode:f.get('certification_mode')};if(x){if(!approved)payload.active=f.get('active')==='true';return update('courses',id,payload,'Corso aggiornato.');}payload.stable_key=f.get('stable_key').trim();const {data:course,error}=await db().from('courses').insert(payload).select('id').single();if(error)throw error;const {error:ve}=await db().from('course_versions').insert({course_id:course.id,version_number:1,status:'draft'});if(ve)throw ve;toast('Corso creato con versione v1 in bozza.','success');closeModal();await render();};
  }
  async function editEdition(id) {
    const [{data:x,error},{data:companies}] = await Promise.all([db().from('course_editions').select('*').eq('id',id).single(),db().from('companies').select('id,name,organization_id,active').eq('active',true).order('name')]); if(error)throw error;
    const local=v=>v?new Date(new Date(v).getTime()-new Date(v).getTimezoneOffset()*60000).toISOString().slice(0,16):'';
    const ov=modal('Modifica edizione',`<form class="admin-form grid"><label class="wide">Titolo<input name="title" value="${esc(x.title||'')}"></label><label>Azienda<select name="company_id"><option value="">Tutte le aziende</option>${(companies||[]).filter(co=>co.organization_id===x.organization_id).map(co=>`<option value="${co.id}" ${co.id===x.company_id?'selected':''}>${esc(co.name)}</option>`).join('')}</select></label><label>Modalità<select name="learning_mode"><option value="elearning_internal" ${x.learning_mode==='elearning_internal'?'selected':''}>E-learning interno</option><option value="classroom" ${x.learning_mode==='classroom'?'selected':''}>Aula</option><option value="blended" ${x.learning_mode==='blended'?'selected':''}>Blended</option><option value="self_study" ${x.learning_mode==='self_study'?'selected':''}>Autoformazione</option></select></label><label>Stato<select name="status"><option value="draft" ${x.status==='draft'?'selected':''}>Bozza</option><option value="open" ${x.status==='open'?'selected':''}>Aperta</option><option value="closed" ${x.status==='closed'?'selected':''}>Chiusa</option><option value="archived" ${x.status==='archived'?'selected':''}>Archiviata</option></select></label><label>Disponibile da<input type="datetime-local" name="available_from" value="${local(x.available_from)}"></label><label>Disponibile fino a<input type="datetime-local" name="available_until" value="${local(x.available_until)}"></label><label>Scadenza consigliata<input type="datetime-local" name="recommended_due_at" value="${local(x.recommended_due_at)}"></label><label class="inline-check"><input type="checkbox" name="block_after_due" ${x.block_after_due?'checked':''}> Blocca dopo scadenza</label><div class="admin-form-actions wide"><button type="button" data-close>Annulla</button><button class="admin-primary">Salva</button></div></form>`);
    ov.querySelector('[data-close]').onclick=closeModal;
    ov.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),from=f.get('available_from'),until=f.get('available_until');if(from&&until&&new Date(until)<new Date(from))return toast('La data di fine non può precedere quella di inizio.','error');await update('course_editions',id,{title:f.get('title')?.trim()||null,company_id:f.get('company_id')||null,learning_mode:f.get('learning_mode'),status:f.get('status'),available_from:from?new Date(from).toISOString():null,available_until:until?new Date(until).toISOString():null,recommended_due_at:f.get('recommended_due_at')?new Date(f.get('recommended_due_at')).toISOString():null,block_after_due:f.get('block_after_due')==='on'},'Edizione aggiornata.');};
  }
  async function sendInvite(id) {
    const {data,error}=await db().functions.invoke('invite-learner',{body:{learner_id:id,redirect_to:new URL('?onboarding=1',location.href).toString()}});
    if(error)throw error;if(data?.error)throw new Error(data.message||data.error);toast(data?.already_linked?'Account già collegato.':'Invito inviato.','success');await render();
  }
  async function moveLearnerToInternal(id) {
    // Copies only what the internal form needs. Nothing is saved until the admin picks a course and presses "Genera link personale".
    const {data:l,error}=await db().from('learners').select('id,organization_id,company_id,first_name,last_name,fiscal_code,phone,job_title,active').eq('id',id).single();
    if(error)throw error;
    if(!l.active)return toast('Il corsista non è attivo.','error');
    const {data:co}=l.company_id?await db().from('companies').select('name').eq('id',l.company_id).maybeSingle():{data:null};
    const api=window.SAFETY_INTERNAL_V47;
    if(!api?.openFromLearner)return toast('Corsisti interni non disponibili: ricarica la pagina.','error');
    await api.openFromLearner({id:l.id,organization_id:l.organization_id,first_name:l.first_name||'',last_name:l.last_name||'',fiscal_code:l.fiscal_code||'',email:'',company_name:co?.name||'',phone:l.phone||'',job_title:l.job_title||''});
  }
  async function createEdition(ev,companies) {
    ev.preventDefault();const f=new FormData(ev.currentTarget),organization_id=f.get('organization_id')||state.defaultOrgId,company=companies.find(x=>x.id===f.get('company_id'));
    if(company&&company.organization_id!==organization_id)return toast('L’azienda non appartiene all’organizzazione selezionata.','error');
    const from=f.get('available_from'),until=f.get('available_until');if(from&&until&&new Date(until)<new Date(from))return toast('La data di fine non può precedere quella di inizio.','error');
    const payload={organization_id,company_id:f.get('company_id')||null,course_version_id:f.get('course_version_id'),title:f.get('title')?.trim()||null,learning_mode:f.get('learning_mode'),certification_mode:'not_certifying',available_from:from?new Date(from).toISOString():null,available_until:until?new Date(until).toISOString():null,status:f.get('status'),created_by:user()?.id||null};
    const {error}=await db().from('course_editions').insert(payload);if(error)throw error;toast('Edizione creata.','success');await render();
  }
  function setupBulk(ctx) {
    const select=document.getElementById('bulkEdition'),list=document.getElementById('bulkLearners'),summary=document.getElementById('bulkSummary');if(!select||!list)return;
    const draw=()=>{const edition=ctx.open.find(x=>x.id===select.value);if(!edition){list.innerHTML='<div class="admin-empty">Nessuna edizione selezionata.</div>';summary.textContent='Seleziona un’edizione.';return;}const existing=new Set(ctx.enrollments.filter(x=>x.edition_id===edition.id).map(x=>x.learner_id)),eligible=ctx.learners.filter(l=>l.organization_id===edition.organization_id&&(!edition.company_id||l.company_id===edition.company_id)),available=eligible.filter(l=>!existing.has(l.id));summary.textContent=`${eligible.length} compatibili · ${existing.size} già presenti · ${available.length} disponibili`;list.innerHTML=available.map(l=>{const [s,k]=inviteState(l,ctx.invites.get(l.id));return `<label class="admin-check-row"><input type="checkbox" data-bulk-learner="${l.id}"><span><strong>${esc(`${l.last_name||''} ${l.first_name||''}`.trim()||l.email||'Corsista')}</strong><small>${esc(l.email||'Email non disponibile')}</small></span>${badge(s,k)}</label>`;}).join('')||'<div class="admin-empty">Nessun nuovo corsista compatibile.</div>';};
    select.onchange=draw;draw();
  }
  async function bulkSubmit() {
    const edition_id=document.getElementById('bulkEdition')?.value, ids=[...document.querySelectorAll('[data-bulk-learner]:checked')].map(x=>x.dataset.bulkLearner);if(!edition_id)return toast('Seleziona un’edizione.','error');if(!ids.length)return toast('Seleziona almeno un corsista.','error');
    const {error}=await db().from('enrollments').insert(ids.map(learner_id=>({edition_id,learner_id,status:'not_started',metadata:{enrollment_source:'admin_v21_bulk'}})));if(error)throw error;
    let invited=0,failed=0;if(document.getElementById('bulkInvite')?.checked){const {data:learners}=await db().from('learners').select('id,email,auth_user_id').in('id',ids);for(const l of learners||[]){if(!l.email||l.auth_user_id)continue;try{const {error:e,data}=await db().functions.invoke('invite-learner',{body:{learner_id:l.id,redirect_to:new URL('?onboarding=1',location.href).toString()}});if(e||data?.error)throw e||new Error(data?.error);invited++;}catch{failed++;}}}
    toast(`${ids.length} corsisti iscritti${invited?` · ${invited} invitati`:''}${failed?` · ${failed} inviti non riusciti`:''}.`,failed?'warn':'success');await render();
  }



  // Reuse the existing, permission-checked admin editors instead of allowing ad-hoc edits to FK data.
  async function openDependencyRecord(kind,id,learnerId){
    if(!state.open||!state.admin||!user()?.id)throw new Error('Sessione amministrativa necessaria.');
    if(kind==='memberships'){
      closeModal();
      const target=window.SAFETY_ADMIN_MEMBERSHIPS_V21;
      if(!target?.render)throw new Error('Gestione ruoli non disponibile.');
      return target.render();
    }
    if(kind==='invites'){
      if(!learnerId)throw new Error('Il corsista collegato non è disponibile.');
      const target=window.SAFETY_ADMIN_ACCESS_IMPORT_V21;
      if(!target?.openInvite)throw new Error('Gestione inviti non disponibile.');
      closeModal();
      return target.openInvite(learnerId);
    }
    const routes={
      company:['companies','edit-company'],
      learner:['learners','edit-learner'],
      edition:['editions','edit-edition'],
      enrollment:['enrollments',null]
    };
    const route=routes[kind];
    if(!route||!id||!/^[-a-f0-9]{36}$/i.test(id))throw new Error('Tipo o record non riconosciuto.');
    closeModal();
    const [tab,action]=route;
    state.tab=tab;
    state.filters[tab]='';
    await render();
    if(!state.open||!state.admin||state.tab!==tab)return;
    const list=Array.from(document.querySelectorAll('#adminContent button[data-id]'));
    const found=list.find(x=>x.dataset.id===id&&(action?x.dataset.action===action:
      ['revoke','restore'].includes(x.dataset.action)));
    if(!found)throw new Error('Record non visibile nell’elenco: controlla ricerca, organizzazione e autorizzazioni.');
    found.closest('tr')?.scrollIntoView({behavior:'smooth',block:'center'});
    found.closest('tr')?.classList.add('admin-dependency-focus');
    if(action)found.click();else found.focus();
  }
  // v22.5: server-only execution after capability probe, impact preview and typed confirmation.
  async function reviewDeletion(kind,id){
    if(!state.open||!state.admin||!user()?.id)return toast('Accesso amministrativo richiesto.','error');
    return window.SAFETY_ADMIN_DELETE_PLANNER_V22?.open?.({
      kind,id,client:db(),actorId:user().id,modal,closeModal,getActorId:()=>user()?.id,
      openRecord:openDependencyRecord,
      onDeleted:async ()=>{await render();toast('Eliminazione confermata dal server.','success');}
    });
  }

  async function handleAction(e) {
    const jump=e.target.closest('[data-jump]');if(jump){state.tab=jump.dataset.jump;return render();}
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    try {
      if(a==='open-reports-v40')return window.SAFETY_ADMIN_ANALYTICS_V40?.renderReports?.();
      if(a==='toggle-archived-learners'){state.showArchivedLearners=!state.showArchivedLearners;return render();}
      if(a==='restore-learner-v37'){
        if(!confirm('Ripristinare questo corsista nell’elenco attivo? Se l’account originario è ancora disponibile verrà ricollegato.'))return;
        const {data,error}=await db().rpc('admin_restore_learner_v37',{p_learner_id:id});if(error)throw error;
        toast(data?.auth_link_restored?'Corsista e account ripristinati.':'Corsista ripristinato; verifica il collegamento dell’account in Accessi & import.','success');return render();
      }
      if(a==='quick-delete-learner-v38'){
        const typed=window.prompt('Eliminazione definitiva: consentita in modo rapido solo ai corsisti senza account collegato o attività formative. Digita ELIMINA per confermare.');
        if(typed!=='ELIMINA')return;
        const {data,error}=await db().rpc('admin_delete_unused_learner_v38',{p_learner_id:id,p_confirmation:typed});
        if(error){
          const message=String(error.message||'');
          if(/_protected|manual_review|linked_account/i.test(message)){
            if(window.confirm('Sono presenti un account collegato, attività o dati da conservare. Vuoi aprire la procedura approfondita con verifica delle dipendenze?'))return reviewDeletion('learner',id);
            return;
          }
          throw error;
        }
        if(data?.deleted!==true)throw Error('Il server non ha confermato la cancellazione.');
        toast('Corsista eliminato definitivamente.','success');return render();
      }
      if(a==='archive-learner-v36'){
        if(!confirm('Rimuovere questo corsista dalla gestione attiva? Non potrà proseguire i corsi. Iscrizioni, presenze, test, attestati e storico saranno conservati. Potrai ripristinarlo dalla sezione «Mostra rimossi».'))return;
        const {error}=await db().rpc('admin_archive_learner_v36',{p_learner_id:id});if(error)throw error;
        toast('Corsista rimosso dalla gestione attiva. Puoi ripristinarlo in «Mostra rimossi».','success');return render();
      }
      if(a==='toggle-revoked-enrollments'){state.showRevokedEnrollments=!state.showRevokedEnrollments;return render();}
      if(a.startsWith('review-delete-'))return reviewDeletion(a.slice('review-delete-'.length),id);
      if(a==='new-company'||a==='edit-company')return editCompany(a==='edit-company'?id:null);
      if(a==='toggle-company'){const {data}=await db().from('companies').select('active').eq('id',id).single();return update('companies',id,{active:!data.active},data.active?'Azienda disattivata.':'Azienda riattivata.');}
      if(a==='new-learner'||a==='edit-learner')return editLearner(a==='edit-learner'?id:null);
      if(a==='toggle-learner'){const {data}=await db().from('learners').select('active').eq('id',id).single();return update('learners',id,{active:!data.active},data.active?'Corsista disattivato.':'Corsista riattivato.');}
      if(a==='invite-learner')return sendInvite(id);
      if(a==='move-learner-internal')return moveLearnerToInternal(id);
      if(a==='new-course'||a==='edit-course')return editCourse(a==='edit-course'?id:null);
      if(a==='materials-course'){const {data}=await db().from('courses').select('stable_key').eq('id',id).single();close();location.hash=`library/${data.stable_key}`;return;}
      if(a==='edit-edition')return editEdition(id);
      if(a==='close-edition'||a==='open-edition')return update('course_editions',id,{status:a==='close-edition'?'closed':'open'},a==='close-edition'?'Edizione chiusa.':'Edizione riaperta.');
      if(a==='manage-edition'){state.tab='enrollments';await render();const s=document.getElementById('bulkEdition');if(s){s.value=id;s.dispatchEvent(new Event('change'));s.scrollIntoView({behavior:'smooth',block:'center'});}return;}
      if(a==='revoke'){if(!confirm('Revocare questa iscrizione?'))return;return update('enrollments',id,{status:'revoked'},'Iscrizione revocata.');}
      if(a==='restore'){const {data}=await db().from('enrollments').select('progress_pct').eq('id',id).single();return update('enrollments',id,{status:Number(data.progress_pct||0)>0?'in_progress':'not_started'},'Iscrizione riattivata.');}
      if(a==='bulk-select-all'){document.querySelectorAll('[data-bulk-learner]').forEach(x=>x.checked=true);return;}
      if(a==='bulk-clear'){document.querySelectorAll('[data-bulk-learner]').forEach(x=>x.checked=false);return;}
      if(a==='bulk-submit')return bulkSubmit();
      if(a==='edit-org')return editOrganization(id);
      if(a==='toggle-org'){const x=state.orgs.find(o=>o.id===id);if(x)return update('organizations',id,{active:!x.active},x.active?'Organizzazione disattivata.':'Organizzazione riattivata.');}
    } catch(err) { fail(err); }
  }

  async function boot() {
    ensureUi();
    for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,150));
    await refreshRole();
    db()?.auth?.onAuthStateChange(()=>setTimeout(refreshRole,60));
  }
  window.SAFETY_ADMIN={open,close,render,setTab:tab=>{state.tab=tab;return render();},refreshRole};
  window.SAFETY_ADMIN_V21=window.SAFETY_ADMIN;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
