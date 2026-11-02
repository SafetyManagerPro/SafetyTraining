/* SafetyTraining — learner dashboard, automatic claim and assigned-course guard. */
(() => {
  'use strict';

  const state = { open:false, claiming:false, openingId:null, menuSignature:'' };
  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtTime = (seconds) => {
    const s = Math.max(0, Number(seconds) || 0), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${String(m).padStart(2,'0')}m` : `${m} min`;
  };
  const statusLabel = (value) => ({not_started:'Da iniziare',in_progress:'In corso',completed:'Completato',passed:'Superato',failed:'Non superato',revoked:'Revocato'}[value] || value || '—');
  const rules = () => window.SAFETY_LEARNER_NAV_V22;
  const configured = a => !!String(a?.courseStableKey||'').trim();
  const access = a => rules()?.access(a) || {usable:false,label:'Percorso non disponibile'};

  function ensureUi() {
    if (!document.getElementById('learnerHomeBtn')) {
      const b = document.createElement('button');
      b.id = 'learnerHomeBtn';
      b.className = 'learner-home-btn hidden';
      b.type = 'button';
      b.textContent = '🎓 I miei corsi';
      b.onclick = open;
      const acct = document.getElementById('cloudAccount');
      (acct?.parentElement || document.querySelector('.topbar'))?.insertBefore(b, acct || null);
    }
    if (!document.getElementById('learnerShell')) {
      const root = document.createElement('div');
      root.id = 'learnerShell';
      root.className = 'learner-shell hidden';
      root.innerHTML = `<section class="learner-panel" role="dialog" aria-modal="true" aria-labelledby="learnerTitle">
        <header class="learner-head"><div><div class="learner-kicker">AREA CORSISTA</div><h1 id="learnerTitle">I miei corsi</h1><p id="learnerIdentity"></p></div><button id="learnerClose" aria-label="Chiudi">×</button></header>
        <div id="learnerSummary" class="learner-summary"></div>
        <p id="learnerOpenError" class="learner-open-error" role="alert" aria-live="assertive"></p>
        <div id="learnerCourses" class="learner-courses"></div>
        <footer>Safety Training · percorso formativo interno — non certificante</footer>
      </section>`;
      root.addEventListener('click', e => { if (e.target === root) close(); });
      document.body.appendChild(root);
      document.getElementById('learnerClose').onclick = close;
    }
  }

  function open() {
    ensureUi();
    const wasOpen=state.open;
    state.open = true;
    const shell=document.getElementById('learnerShell');
    shell?.classList.remove('hidden');
    document.body.classList.add('learner-dashboard-open');
    if(!wasOpen)window.SAFETY_MODAL_ACCESS?.opened?.(shell,close);
    render().catch(console.warn);
  }
  function close() {
    const wasOpen=state.open;
    state.open = false;
    const shell=document.getElementById('learnerShell');
    shell?.classList.add('hidden');
    document.body.classList.remove('learner-dashboard-open');
    if(wasOpen)window.SAFETY_MODAL_ACCESS?.closed?.(shell);
    if(cloud()?.state?.learner&&!location.hash){
      const root=document.getElementById('app');
      if(root)root.innerHTML='<section class="hero"><h1>I miei corsi</h1><p>Qui trovi soltanto i corsi assegnati.</p><button class="openbtn" id="stReturnCourses" type="button">Apri i miei corsi</button></section>';
      document.getElementById('stReturnCourses')?.addEventListener('click',open);
    }
  }

  async function claimIfNeeded() {
    const c = cloud()?.state;
    if (!db() || !c?.user || c.learner || state.claiming) return false;
    state.claiming = true;
    try {
      const { data, error } = await db().rpc('claim_learner_account');
      if (error) return false;
      if (data) { location.reload(); return true; }
    } finally { state.claiming = false; }
    return false;
  }

  async function refreshAssignments() {
    const c = cloud()?.state;
    if (!db() || !c?.learner || !c.assignments?.length) return c?.assignments || [];
    const ids = c.assignments.map(x => x.id);
    const { data } = await db().from('enrollments')
      .select('id,status,active_seconds,progress_pct,final_score_pct,last_activity_at,started_at,completed_at')
      .in('id', ids);
    const map = new Map((data || []).map(x => [x.id, x]));
    c.assignments.forEach(a => {
      const fresh = map.get(a.id); if (!fresh) return;
      a.status = fresh.status; a.activeSeconds = fresh.active_seconds; a.progressPct = fresh.progress_pct;
      a.finalScorePct = fresh.final_score_pct; a.lastActivityAt = fresh.last_activity_at;
      a.startedAt = fresh.started_at; a.completedAt = fresh.completed_at;
    });
    return c.assignments;
  }

  function availability(a) {
    return access(a);
  }

  function updateAssignedSidebar(){
    const c=cloud()?.state,host=document.getElementById('sideCourses');
    if(!c?.learner||!host)return;
    const entries=(c.assignments||[]).filter(a=>configured(a)&&availability(a).usable);
    const signature=JSON.stringify(entries.map(a=>[a.id,a.courseStableKey,a.courseTitle,a.editionTitle,a.status]));
    if(host.dataset.learnerSignature!==signature||!host.classList.contains('learner-assigned-nav')){
      host.replaceChildren();
      host.classList.remove('course-grouped-nav');
      host.classList.add('learner-assigned-nav');
      host.dataset.learnerSignature=signature;
      if(!entries.length){
        const note=document.createElement('p');
        note.className='learner-nav-empty';
        note.textContent='Nessun corso attualmente accessibile. Controlla I miei corsi.';
        host.appendChild(note);
      }
      entries.forEach(a=>{
        const b=document.createElement('button');
        b.type='button';b.className='navbtn learner-course-nav';b.dataset.courseKey=a.courseStableKey;
        b.dataset.enrollmentId=a.id;
        b.textContent=a.courseTitle||a.editionTitle||'Corso assegnato';
        b.addEventListener('click',()=>{void openCourse(a.id);});
        host.appendChild(b);
      });
    }
    const key=rules()?.route(location.hash).key;
    host.querySelectorAll('[data-course-key]').forEach(b=>b.classList.toggle('active',b.dataset.courseKey===key));
  }

  function restoreSidebar(){
    const host=document.getElementById('sideCourses');
    if(!host?.classList.contains('learner-assigned-nav'))return;
    host.classList.remove('learner-assigned-nav');
    delete host.dataset.learnerSignature;
    host.replaceChildren();
    window.SAFETY_SIDEBAR_GROUPS?.loadFull?.();
  }

  async function openCourse(enrollmentId){
    const initialUserId=cloud()?.state?.user?.id;
    const assignment=(cloud()?.state?.assignments||[]).find(a=>a.id===enrollmentId);
    if(!initialUserId||!assignment||!availability(assignment).usable){
      if(assignment)open();
      return false;
    }
    if(state.openingId)return false;
    state.openingId=enrollmentId;
    const btn=document.querySelector('#learnerCourses [data-enrollment-id="'+CSS.escape(enrollmentId)+'"]');
    if(btn){btn.disabled=true;btn.textContent='Apertura corso…';}
    const message=document.getElementById('learnerOpenError');
    if(message)message.textContent='';
    try{
      const key=String(assignment.courseStableKey);
      const local=(window.SAFETY_DATA||[]).find(c=>c.id===key);
      if(!local){
        const adapted=await window.SAFETY_CATALOG?.ensurePresentation?.(key);
        if(!adapted)throw new Error('Presentazione del corso non disponibile.');
        if(assignment.versionNumber!=null&&adapted.db_version!=null&&Number(assignment.versionNumber)!==Number(adapted.db_version)){
          throw new Error('La versione del corso assegnata è diversa da quella disponibile. Contatta il responsabile della formazione.');
        }
      }
      if(cloud()?.state?.user?.id!==initialUserId||!rules()?.assigned(cloud()?.state?.assignments,key)){
        throw new Error('L’accesso al percorso non è più disponibile.');
      }
      close();
      const hash='course/'+encodeURIComponent(key);
      if(location.hash==='#'+hash)window.dispatchEvent(new Event('hashchange'));
      else location.hash=hash;
      return true;
    }catch(error){
      open();
      const alert=document.getElementById('learnerOpenError');
      if(alert)alert.textContent=error?.message||'Impossibile aprire il corso.';
      console.warn('[SafetyTraining learner course]',error?.message||error);
      return false;
    }finally{
      state.openingId=null;
      if(btn&&btn.isConnected){btn.disabled=false;btn.textContent=availability(assignment).label;}
    }
  }

  async function render() {
    const c = cloud()?.state; if (!c?.learner) return;
    const assignments = await refreshAssignments();
    const identity = `${c.learner.first_name || ''} ${c.learner.last_name || ''}`.trim() || c.learner.email || c.user?.email || 'Corsista';
    document.getElementById('learnerIdentity').textContent = identity;
    const active = assignments.filter(a => !['revoked','completed','passed'].includes(a.status)).length;
    const completed = assignments.filter(a => ['completed','passed'].includes(a.status)).length;
    document.getElementById('learnerSummary').innerHTML = `<article><strong>${assignments.length}</strong><span>Percorsi assegnati</span></article><article><strong>${active}</strong><span>Da completare</span></article><article><strong>${completed}</strong><span>Completati</span></article>`;

    const host = document.getElementById('learnerCourses');
    if (!assignments.length) { host.innerHTML = '<div class="learner-empty">Non risultano ancora corsi assegnati al tuo account.</div>'; return; }
    host.innerHTML = assignments.map(a => {
      const pct = Math.max(0, Math.min(100, Number(a.progressPct || 0)));
      const av = availability(a);
      const due = a.availableUntil ? `Scadenza ${new Date(a.availableUntil).toLocaleDateString('it-IT')}` : 'Nessuna scadenza impostata';
      const score = a.finalScorePct == null ? '' : `<span>Esito ${Number(a.finalScorePct).toFixed(0)}%</span>`;
      return `<article class="learner-course ${!av.usable ? 'disabled' : ''}" data-course-status="${esc(a.status)}">
        <div class="learner-course-top"><div><span class="learner-status">${esc(statusLabel(a.status))}</span><h2>${esc(a.courseTitle || a.editionTitle || 'Percorso')}</h2><p>${esc(a.editionTitle && a.editionTitle !== a.courseTitle ? a.editionTitle : '')}</p></div><strong>${pct.toFixed(0)}%</strong></div>
        <div class="v45-progress-caption"><span>Avanzamento dei contenuti</span><strong>${pct.toFixed(0)}%</strong></div>
        <div class="learner-progress" role="progressbar" aria-label="Avanzamento dei contenuti" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct.toFixed(0)}"><span style="width:${pct}%"></span></div>
        <div class="learner-meta"><span>⏱ ${esc(fmtTime(a.activeSeconds))} attivi</span><span>📅 ${esc(due)}</span>${score}</div>
        <button class="learner-start" data-enrollment-id="${esc(a.id)}" ${!av.usable ? 'disabled' : ''}>${esc(av.label)}</button>
      </article>`;
    }).join('');
    host.querySelectorAll('[data-enrollment-id]').forEach(btn=>btn.onclick=()=>{void openCourse(btn.dataset.enrollmentId);});
    if (window.SAFETY_COURSE_DOCUMENTS?.renderForAssignments) {
      await window.SAFETY_COURSE_DOCUMENTS.renderForAssignments(host, assignments);
    }
    updateAssignedSidebar();
  }

  function syncLearnerMode() {
    const c = cloud()?.state;
    ensureUi();
    const learner = !!c?.learner;
    document.getElementById('learnerHomeBtn')?.classList.toggle('hidden', !learner);
    document.body.classList.toggle('learner-session', learner);
    if (!learner) return;

    updateAssignedSidebar();
    if(!rules()?.allowedRoute(location.hash,c.assignments)){
      location.hash='';
      setTimeout(open,0);
    }
  }

  async function sync() {
    const c = cloud()?.state;
    if (!c?.user) {
      close();restoreSidebar();
      document.getElementById('learnerHomeBtn')?.classList.add('hidden');
      document.body.classList.remove('learner-session');return;
    }
    if (!c.learner && await claimIfNeeded()) return;
    if(!c.learner)restoreSidebar();
    syncLearnerMode();
    if (state.open) await render();
  }

  async function boot() {
    ensureUi();
    for (let i = 0; i < 30 && !db(); i++) await new Promise(r => setTimeout(r, 200));
    await sync();
    db()?.auth?.onAuthStateChange((event) => setTimeout(async () => { await sync(); if (event === 'SIGNED_IN' && cloud()?.state?.learner) open(); }, 500));
    window.addEventListener('hashchange', () => setTimeout(syncLearnerMode, 0));
    setInterval(() => { if (state.open) render().catch(() => {}); }, 30000);
  }

  window.SAFETY_LEARNER = { open, close, render, sync, openCourse, syncLearnerMode };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
