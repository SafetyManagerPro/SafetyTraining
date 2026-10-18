/* SafetyTraining Cloud v20 — auth, assignments, trusted telemetry and quiz sync. */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://ejkwvatmzdqqjozpxntk.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bn9DnocbbBEcf98WAwcSHw_wABCiOSA';
  const HEARTBEAT_SECONDS = 30;
  const IDLE_LIMIT_MS = 5 * 60 * 1000;

  const state = {
    client: null,
    session: null,
    user: null,
    learner: null,
    assignments: [],
    activeAssignment: null,
    learningSession: null,
    currentUnitVersionId: null,
    currentUnitStableKey: null,
    heartbeatTimer: null,
    lastInteractionAt: Date.now(),
    online: navigator.onLine
  };

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const formatSeconds = (value) => {
    const seconds = Math.max(0, Number(value) || 0);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
  };

  function ensureUi() {
    if (!$('cloudAccount')) {
      const button = document.createElement('button');
      button.id = 'cloudAccount';
      button.className = 'cloud-account';
      button.type = 'button';
      button.addEventListener('click', openPanel);
      const mode = document.querySelector('.mode');
      if (mode) mode.insertAdjacentElement('afterend', button);
      else document.querySelector('.topbar')?.appendChild(button);
    }
    if (!$('cloudOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'cloudOverlay';
      overlay.className = 'cloud-overlay hidden';
      overlay.innerHTML = `<section class="cloud-modal" role="dialog" aria-modal="true" aria-labelledby="cloudTitle">
        <div class="cloud-modal-head"><div><div class="cloud-kicker">SAFETY TRAINING CLOUD</div><h2 id="cloudTitle">Account e percorso</h2></div><button id="cloudClose" class="cloud-close" aria-label="Chiudi">×</button></div>
        <div id="cloudPanelBody"></div><div id="cloudMessage" class="cloud-message"></div>
        <div class="cloud-legal">Percorso formativo interno — non certificante. Il sistema registra attività, progressi e verifiche senza sostituire DVR, addestramento pratico o requisiti formali previsti per corsi certificanti.</div>
      </section>`;
      overlay.addEventListener('click', (event) => { if (event.target === overlay) closePanel(); });
      document.body.appendChild(overlay);
      $('cloudClose')?.addEventListener('click', closePanel);
    }
    updateBadge();
  }

  function setMessage(text, kind = '') {
    const el = $('cloudMessage');
    if (!el) return;
    el.textContent = text || '';
    el.className = `cloud-message ${kind}`.trim();
  }

  function updateBadge() {
    const btn = $('cloudAccount');
    if (!btn) return;
    btn.classList.toggle('offline', !state.online);
    btn.classList.toggle('authenticated', !!state.user);
    const learnerName = state.learner ? `${state.learner.first_name || ''} ${state.learner.last_name || ''}`.trim() : '';
    const label = !state.online ? 'Offline' : state.user ? (learnerName || state.user.email || 'Account') : 'Accedi';
    btn.innerHTML = `<span class="cloud-dot"></span><span>${esc(label)}</span>`;
  }

  function openPanel() { ensureUi(); $('cloudOverlay')?.classList.remove('hidden'); renderPanel(); }
  function closePanel() { $('cloudOverlay')?.classList.add('hidden'); }

  function renderPanel() {
    const body = $('cloudPanelBody');
    if (!body) return;
    if (!state.client) {
      body.innerHTML = '<div class="cloud-state">Connessione cloud non disponibile. Il materiale didattico locale resta utilizzabile.</div>';
      return;
    }
    if (!state.user) {
      body.innerHTML = `<form id="cloudLoginForm" class="cloud-login">
        <p>Accedi con l’account assegnato dall’amministratore per registrare tempo attivo, progressi e risposte.</p>
        <label>Email<input id="cloudEmail" type="email" autocomplete="username" required></label>
        <label>Password<input id="cloudPassword" type="password" autocomplete="current-password" required></label>
        <button class="openbtn" type="submit">Accedi</button></form>`;
      $('cloudLoginForm')?.addEventListener('submit', signIn);
      return;
    }
    const cards = state.assignments.length ? state.assignments.map((a) => `<article class="cloud-assignment ${state.activeAssignment?.id === a.id ? 'active' : ''}" data-enrollment-id="${esc(a.id)}">
      <div><strong>${esc(a.courseTitle || a.editionTitle || 'Percorso')}</strong><span>v${esc(a.versionNumber || 1)} · ${esc(a.status)}</span></div>
      <div class="cloud-progress"><span style="width:${Math.max(0, Math.min(100, Number(a.progressPct || 0)))}%"></span></div>
      <small>${Number(a.progressPct || 0).toFixed(0)}% · ${formatSeconds(a.activeSeconds || 0)} attivi</small></article>`).join('') : '<div class="cloud-state">Account attivo, ma non risultano ancora percorsi assegnati.</div>';
    body.innerHTML = `<div class="cloud-user-row"><div><strong>${esc(state.user.email || '')}</strong><span>${esc(state.learner ? 'Corsista collegato' : 'Account senza profilo corsista')}</span></div><button id="cloudLogout" class="ghost" type="button">Esci</button></div>
      <div class="cloud-summary"><span>${state.assignments.length}</span> percorsi assegnati</div><div class="cloud-assignments">${cards}</div>`;
    $('cloudLogout')?.addEventListener('click', signOut);
    document.dispatchEvent(new Event('safety:cloud-panel-rendered'));
  }

  async function signIn(event) {
    event.preventDefault();
    const email = $('cloudEmail')?.value?.trim();
    const password = $('cloudPassword')?.value || '';
    if (!email || !password) return;
    setMessage('Accesso in corso…');
    const { error } = await state.client.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message || 'Accesso non riuscito.', 'error');
    else setMessage('Accesso effettuato.', 'ok');
  }

  async function signOut() {
    stopHeartbeat();
    try { await endLearningSession(); } catch (_) {}
    await state.client?.auth.signOut();
  }

  async function syncIdentity() {
    if (!state.user) {
      state.learner = null;
      state.assignments = [];
      state.activeAssignment = null;
      state.learningSession = null;
      updateBadge();
      renderPanel();
      return;
    }
    try {
      await state.client.from('profiles').upsert({
        user_id: state.user.id,
        display_name: state.user.user_metadata?.display_name || state.user.email || null,
        locale: 'it-IT',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.warn('[SafetyTraining Cloud] profile sync:', error?.message || error);
    }

    const { data: learner, error } = await state.client.from('learners')
      .select('id,organization_id,company_id,auth_user_id,first_name,last_name,email,job_title')
      .eq('auth_user_id', state.user.id).eq('active', true).maybeSingle();
    if (error) console.warn('[SafetyTraining Cloud] learner lookup:', error.message);
    state.learner = learner || null;
    state.assignments = state.learner ? await loadAssignments(state.learner.id) : [];
    updateBadge();
    renderPanel();
    await syncRouteContext();
  }

  async function loadAssignments(learnerId) {
    const { data: enrollments, error } = await state.client.from('enrollments')
      .select('id,edition_id,status,active_seconds,progress_pct,final_score_pct,started_at,completed_at,last_activity_at')
      .eq('learner_id', learnerId).order('enrolled_at', { ascending: false });
    if (error || !enrollments?.length) return [];
    const editionIds = [...new Set(enrollments.map((x) => x.edition_id).filter(Boolean))];
    const { data: editions } = await state.client.from('course_editions').select('id,course_version_id,title,status,available_from,available_until').in('id', editionIds);
    const editionMap = new Map((editions || []).map((x) => [x.id, x]));
    const versionIds = [...new Set((editions || []).map((x) => x.course_version_id).filter(Boolean))];
    const { data: versions } = versionIds.length ? await state.client.from('course_versions').select('id,course_id,version_number,status').in('id', versionIds) : { data: [] };
    const versionMap = new Map((versions || []).map((x) => [x.id, x]));
    const courseIds = [...new Set((versions || []).map((x) => x.course_id).filter(Boolean))];
    const { data: courses } = courseIds.length ? await state.client.from('courses').select('id,stable_key,title,nominal_minutes').in('id', courseIds) : { data: [] };
    const courseMap = new Map((courses || []).map((x) => [x.id, x]));
    return enrollments.map((e) => {
      const edition = editionMap.get(e.edition_id) || {};
      const version = versionMap.get(edition.course_version_id) || {};
      const course = courseMap.get(version.course_id) || {};
      return { id:e.id, editionId:e.edition_id, editionTitle:edition.title, courseVersionId:version.id || edition.course_version_id || null, courseStableKey:course.stable_key, courseTitle:course.title, versionNumber:version.version_number, status:e.status, activeSeconds:e.active_seconds, progressPct:e.progress_pct, finalScorePct:e.final_score_pct, availableFrom:edition.available_from, availableUntil:edition.available_until };
    });
  }

  function parseRoute() {
    const parts = location.hash.replace(/^#/, '').split('/').filter(Boolean);
    if (parts[0] === 'topic' && parts.length >= 3) return { type:'topic', courseKey:parts[1], topicKey:parts[2], unitStableKey:`${parts[1]}:${parts[2]}` };
    if (parts[0] === 'course' && parts.length >= 2) return { type:'course', courseKey:parts[1] };
    return { type:'other' };
  }

  async function lookupUnitVersion(stableKey, courseVersionId) {
    if (!stableKey || !courseVersionId || !state.user) return null;
    const { data: unit, error: unitError } = await state.client.from('learning_units').select('id,stable_key').eq('stable_key', stableKey).eq('active', true).maybeSingle();
    if (unitError) throw unitError;
    if (!unit) return null;

    const { data: modules, error: modulesError } = await state.client.from('course_modules').select('id').eq('course_version_id', courseVersionId);
    if (modulesError) throw modulesError;
    const moduleIds = (modules || []).map((row) => row.id).filter(Boolean);
    if (!moduleIds.length) return null;

    const { data: links, error: linksError } = await state.client.from('course_module_units').select('unit_version_id').in('module_id', moduleIds);
    if (linksError) throw linksError;
    const linkedVersionIds = [...new Set((links || []).map((row) => row.unit_version_id).filter(Boolean))];
    if (!linkedVersionIds.length) return null;

    const { data: versions, error: versionsError } = await state.client.from('learning_unit_versions')
      .select('id,learning_unit_id,version_number,status')
      .in('id', linkedVersionIds)
      .eq('learning_unit_id', unit.id);
    if (versionsError) throw versionsError;
    if (!versions?.length) return null;
    if (versions.length > 1) {
      console.warn('[SafetyTraining Cloud] multiple linked versions for unit/course snapshot', { stableKey, courseVersionId, versions:versions.map((v) => v.id) });
      return null;
    }
    return versions[0].id;
  }

  async function syncRouteContext() {
    if (!state.user || !state.learner) return;
    const route = parseRoute();
    if (route.type !== 'topic') {
      if (state.currentUnitVersionId) await recordEvent('unit_closed', state.currentUnitVersionId, 0).catch(() => {});
      state.currentUnitStableKey = null;
      state.currentUnitVersionId = null;
      return;
    }
    const assignment = state.assignments.find((a) => a.courseStableKey === route.courseKey && ['not_started','in_progress'].includes(a.status));
    if (!assignment) return;
    if (state.activeAssignment?.id !== assignment.id) {
      try { await endLearningSession(); } catch (_) {}
      state.activeAssignment = assignment;
      await startLearningSession(assignment.id);
    }
    const previous = state.currentUnitVersionId;
    const unitVersionId = await lookupUnitVersion(route.unitStableKey, assignment.courseVersionId);
    if (!unitVersionId) return;
    if (previous && previous !== unitVersionId) await recordEvent('unit_closed', previous, 0).catch(() => {});
    state.currentUnitStableKey = route.unitStableKey;
    state.currentUnitVersionId = unitVersionId;
    if (previous !== unitVersionId) {
      await recordEvent('unit_opened', unitVersionId, 0).catch(() => {});
      await recordEvent('content_viewed', unitVersionId, 0, { route:location.hash, course_version_id:assignment.courseVersionId }).catch(() => {});
    }
    startHeartbeat();
    window.setTimeout(enhanceVisibleQuiz, 0);
  }

  async function startLearningSession(enrollmentId) {
    if (!state.user || !enrollmentId) return null;
    const clientSessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const { data, error } = await state.client.from('learning_sessions').insert({ enrollment_id:enrollmentId, client_session_id:clientSessionId })
      .select('id,enrollment_id,started_at,active_seconds').single();
    if (error) { console.warn('[SafetyTraining Cloud] session start:', error.message); return null; }
    state.learningSession = data;
    await recordEvent('session_started', null, 0, { client_session_id:clientSessionId }).catch(() => {});
    return data;
  }

  async function endLearningSession() {
    if (!state.learningSession || !state.activeAssignment) return;
    stopHeartbeat();
    if (state.currentUnitVersionId) await recordEvent('unit_closed', state.currentUnitVersionId, 0).catch(() => {});
    await recordEvent('session_ended', null, 0).catch(() => {});
    await state.client.from('learning_sessions').update({ ended_at:new Date().toISOString() }).eq('id', state.learningSession.id);
    state.learningSession = null;
    state.currentUnitVersionId = null;
    state.currentUnitStableKey = null;
  }

  async function recordEvent(eventType, unitVersionId = null, activeDeltaSeconds = 0, payload = {}) {
    if (!state.learningSession || !state.activeAssignment) return null;
    const { data, error } = await state.client.from('learning_events').insert({ enrollment_id:state.activeAssignment.id, session_id:state.learningSession.id, unit_version_id:unitVersionId, event_type:eventType, active_delta_seconds:activeDeltaSeconds, payload:payload || {} }).select('id,occurred_at,active_delta_seconds').single();
    if (error) throw error;
    return data;
  }

  async function sendHeartbeat() {
    if (!state.user || !state.learningSession || !state.activeAssignment) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    if (Date.now() - state.lastInteractionAt > IDLE_LIMIT_MS) return;
    try {
      const event = await recordEvent('heartbeat', state.currentUnitVersionId, HEARTBEAT_SECONDS, { visible:true, focused:true, route:location.hash });
      if (event?.active_delta_seconds) state.activeAssignment.activeSeconds = Number(state.activeAssignment.activeSeconds || 0) + Number(event.active_delta_seconds || 0);
    } catch (error) { console.warn('[SafetyTraining Cloud] heartbeat:', error?.message || error); }
  }
  function startHeartbeat() { stopHeartbeat(); state.heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_SECONDS * 1000); }
  function stopHeartbeat() { if (state.heartbeatTimer) clearInterval(state.heartbeatTimer); state.heartbeatTimer = null; }

  async function getQuestionForUnit(stableKey) {
    const unitVersionId = await lookupUnitVersion(stableKey, state.activeAssignment?.courseVersionId);
    if (!unitVersionId) return null;
    const { data, error } = await state.client.from('questions').select('id,stable_key,prompt,question_type,options,metadata').eq('unit_version_id', unitVersionId).eq('active', true).order('created_at', { ascending:true }).limit(1).maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function submitAnswer({ questionId, optionId }) {
    if (!state.user || !state.activeAssignment) throw new Error('Autenticazione e percorso assegnato richiesti');
    const { count } = await state.client.from('question_attempts').select('id', { count:'exact', head:true }).eq('enrollment_id', state.activeAssignment.id).eq('question_id', questionId);
    const { data, error } = await state.client.from('question_attempts').insert({ enrollment_id:state.activeAssignment.id, question_id:questionId, session_id:state.learningSession?.id || null, answer:{ option_id:String(optionId) }, attempt_no:Number(count || 0) + 1, metadata:{ client:'SafetyTraining Cloud v20' } }).select('id,is_correct,metadata,attempt_no,answered_at').single();
    if (error) throw error;
    return data;
  }

  async function enhanceVisibleQuiz() {
    const route = parseRoute();
    const box = document.querySelector('.detail-quiz-options');
    if (!box || box.dataset.cloudBound === '1' || route.type !== 'topic' || !state.user || !state.activeAssignment) return;
    try {
      const question = await getQuestionForUnit(route.unitStableKey);
      if (!question) return;
      box.dataset.cloudBound = '1';
      const options = [...box.children];
      options.forEach((el, index) => {
        el.classList.add('cloud-quiz-option');
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        const choose = async () => {
          if (box.dataset.submitting === '1') return;
          box.dataset.submitting = '1';
          options.forEach((node) => node.classList.remove('cloud-answer-ok','cloud-answer-no'));
          try {
            const result = await submitAnswer({ questionId:question.id, optionId:index });
            el.classList.add(result.is_correct ? 'cloud-answer-ok' : 'cloud-answer-no');
            let feedback = box.parentElement?.querySelector('.cloud-quiz-feedback');
            if (!feedback) {
              feedback = document.createElement('div');
              feedback.className = 'cloud-quiz-feedback';
              box.insertAdjacentElement('afterend', feedback);
            }
            const explanation = result.metadata?.feedback?.explanation || '';
            feedback.innerHTML = `<strong>${result.is_correct ? '✅ Risposta corretta' : '❌ Risposta non corretta'}</strong>${explanation ? `<p>${esc(explanation)}</p>` : ''}<small>Tentativo ${result.attempt_no} registrato nel percorso.</small>`;
          } catch (error) {
            console.warn('[SafetyTraining Cloud] answer:', error?.message || error);
          } finally { box.dataset.submitting = '0'; }
        };
        el.addEventListener('click', choose);
        el.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
      });
    } catch (error) { console.warn('[SafetyTraining Cloud] quiz bind:', error?.message || error); }
  }

  async function init() {
    ensureUi();
    if (!window.supabase?.createClient) { console.warn('[SafetyTraining Cloud] Supabase client unavailable; local mode remains active.'); return; }
    state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
    const { data } = await state.client.auth.getSession();
    state.session = data?.session || null;
    state.user = state.session?.user || null;
    await syncIdentity();
    state.client.auth.onAuthStateChange((_event, session) => {
      state.session = session || null;
      state.user = session?.user || null;
      window.setTimeout(() => { syncIdentity().catch((error) => console.warn('[SafetyTraining Cloud] auth sync:', error?.message || error)); }, 0);
    });
    const app = document.getElementById('app');
    if (app) new MutationObserver(() => { window.setTimeout(enhanceVisibleQuiz, 0); }).observe(app, { childList:true, subtree:true });
  }

  ['pointerdown','keydown','scroll','touchstart'].forEach((name) => window.addEventListener(name, () => { state.lastInteractionAt = Date.now(); }, { passive:true }));
  window.addEventListener('online', () => { state.online = true; updateBadge(); });
  window.addEventListener('offline', () => { state.online = false; updateBadge(); });
  window.addEventListener('hashchange', () => { window.setTimeout(() => syncRouteContext().catch(() => {}), 0); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') recordEvent('visibility_paused', state.currentUnitVersionId, 0).catch(() => {});
    else { state.lastInteractionAt = Date.now(); recordEvent('visibility_resumed', state.currentUnitVersionId, 0).catch(() => {}); }
  });
  window.addEventListener('pagehide', () => { stopHeartbeat(); });

  window.SAFETY_CLOUD = { state, openPanel, closePanel, getQuestionForUnit, submitAnswer, recordEvent, syncRouteContext };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();