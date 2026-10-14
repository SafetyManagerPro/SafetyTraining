/* SafetyTraining — learner dashboard, automatic claim and assigned-course guard. */
(() => {
  'use strict';

  const state = { open:false, claiming:false };
  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtTime = (seconds) => {
    const s = Math.max(0, Number(seconds) || 0), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${String(m).padStart(2,'0')}m` : `${m} min`;
  };
  const statusLabel = (value) => ({not_started:'Da iniziare',in_progress:'In corso',completed:'Completato',passed:'Superato',failed:'Non superato',revoked:'Revocato'}[value] || value || '—');

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
    state.open = true;
    document.getElementById('learnerShell')?.classList.remove('hidden');
    document.body.classList.add('learner-dashboard-open');
    render().catch(console.warn);
  }
  function close() {
    state.open = false;
    document.getElementById('learnerShell')?.classList.add('hidden');
    document.body.classList.remove('learner-dashboard-open');
  }

  async function claimIfNeeded() {
    const c = cloud()?.state;
    if (!db() || !c?.user || c.learner || state.claiming) return false;
    state.claiming = true;
    try {
      const { data, error } = await db().rpc('claim_learner_account');
      if (error) return false;
      if (data) {
        location.reload();
        return true;
      }
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
      const fresh = map.get(a.id);
      if (!fresh) return;
      a.status = fresh.status;
      a.activeSeconds = fresh.active_seconds;
      a.progressPct = fresh.progress_pct;
      a.finalScorePct = fresh.final_score_pct;
      a.lastActivityAt = fresh.last_activity_at;
      a.startedAt = fresh.started_at;
      a.completedAt = fresh.completed_at;
    });
    return c.assignments;
  }

  function availability(a) {
    const now = Date.now();
    if (a.status === 'revoked') return { usable:false, label:'Accesso revocato' };
    if (a.availableFrom && new Date(a.availableFrom).getTime() > now) return { usable:false, label:`Disponibile dal ${new Date(a.availableFrom).toLocaleDateString('it-IT')}` };
    if (a.availableUntil && new Date(a.availableUntil).getTime() < now) return { usable:false, label:'Periodo di accesso terminato' };
    if (['completed','passed'].includes(a.status)) return { usable:true, label:'Rivedi percorso' };
    return { usable:true, label:a.status === 'in_progress' ? 'Continua' : 'Inizia' };
  }

  async function render() {
    const c = cloud()?.state;
    if (!c?.learner) return;
    const assignments = await refreshAssignments();
    const identity = `${c.learner.first_name || ''} ${c.learner.last_name || ''}`.trim() || c.learner.email || c.user?.email || 'Corsista';
    document.getElementById('learnerIdentity').textContent = identity;
    const active = assignments.filter(a => !['revoked','completed','passed'].includes(a.status)).length;
    const completed = assignments.filter(a => ['completed','passed'].includes(a.status)).length;
    document.getElementById('learnerSummary').innerHTML = `<article><strong>${assignments.length}</strong><span>Percorsi assegnati</span></article><article><strong>${active}</strong><span>Da completare</span></article><article><strong>${completed}</strong><span>Completati</span></article>`;

    const host = document.getElementById('learnerCourses');
    if (!assignments.length) {
      host.innerHTML = '<div class="learner-empty">Non risultano ancora corsi assegnati al tuo account.</div>';
      return;
    }
    host.innerHTML = assignments.map(a => {
      const pct = Math.max(0, Math.min(100, Number(a.progressPct || 0)));
      const av = availability(a);
      const due = a.availableUntil ? `Scadenza ${new Date(a.availableUntil).toLocaleDateString('it-IT')}` : 'Nessuna scadenza impostata';
      const score = a.finalScorePct == null ? '' : `<span>Esito ${Number(a.finalScorePct).toFixed(0)}%</span>`;
      return `<article class="learner-course ${a.status === 'revoked' ? 'disabled' : ''}">
        <div class="learner-course-top"><div><span class="learner-status">${esc(statusLabel(a.status))}</span><h2>${esc(a.courseTitle || a.editionTitle || 'Percorso')}</h2><p>${esc(a.editionTitle && a.editionTitle !== a.courseTitle ? a.editionTitle : '')}</p></div><strong>${pct.toFixed(0)}%</strong></div>
        <div class="learner-progress"><span style="width:${pct}%"></span></div>
        <div class="learner-meta"><span>⏱ ${esc(fmtTime(a.activeSeconds))} attivi</span><span>📅 ${esc(due)}</span>${score}</div>
        <button class="learner-start" data-course="${esc(a.courseStableKey || '')}" ${!av.usable || !a.courseStableKey ? 'disabled' : ''}>${esc(av.label)}</button>
      </article>`;
    }).join('');
    host.querySelectorAll('[data-course]').forEach(btn => btn.onclick = () => {
      const key = btn.dataset.course;
      if (!key) return;
      close();
      location.hash = `course/${key}`;
    });
  }

  function syncLearnerMode() {
    const c = cloud()?.state;
    ensureUi();
    const learner = !!c?.learner;
    document.getElementById('learnerHomeBtn')?.classList.toggle('hidden', !learner);
    document.body.classList.toggle('learner-session', learner);
    if (!learner) return;

    const allowed = new Set((c.assignments || []).filter(a => a.status !== 'revoked').map(a => a.courseStableKey).filter(Boolean));
    const buttons = [...document.querySelectorAll('#sideCourses .navbtn')];
    (window.SAFETY_DATA || []).forEach((course, i) => {
      if (buttons[i]) buttons[i].hidden = !allowed.has(course.id);
    });

    const route = location.hash.replace(/^#/, '').split('/').filter(Boolean);
    if ((route[0] === 'course' || route[0] === 'topic') && route[1] && !allowed.has(route[1])) {
      location.hash = '';
      setTimeout(open, 0);
    }
  }

  async function sync() {
    const c = cloud()?.state;
    if (!c?.user) {
      close();
      document.getElementById('learnerHomeBtn')?.classList.add('hidden');
      document.body.classList.remove('learner-session');
      return;
    }
    if (!c.learner && await claimIfNeeded()) return;
    syncLearnerMode();
    if (state.open) await render();
  }

  async function boot() {
    ensureUi();
    for (let i = 0; i < 30 && !db(); i++) await new Promise(r => setTimeout(r, 200));
    await sync();
    db()?.auth?.onAuthStateChange((event) => setTimeout(async () => {
      await sync();
      if (event === 'SIGNED_IN' && cloud()?.state?.learner) open();
    }, 500));
    window.addEventListener('hashchange', () => setTimeout(syncLearnerMode, 0));
    setInterval(() => { if (state.open) render().catch(() => {}); }, 30000);
  }

  window.SAFETY_LEARNER = { open, close, render, sync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
