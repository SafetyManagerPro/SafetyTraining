/* SafetyTraining Cloud v20
 * Browser-safe Supabase integration. No service-role credentials belong here.
 * The existing classroom content remains available locally while cloud identity,
 * assignments and learning telemetry are progressively enabled.
 */
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
    initialized: false,
    online: navigator.onLine
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));

  function byId(id) { return document.getElementById(id); }
  function setMessage(text, kind = '') {
    const el = byId('cloudMessage');
    if (!el) return;
    el.textContent = text || '';
    el.className = `cloud-message ${kind}`.trim();
  }

  function ensureUi() {
    if (!byId('cloudAccount')) {
      const button = document.createElement('button');
      button.id = 'cloudAccount';
      button.className = 'cloud-account';
      button.type = 'button';
      button.innerHTML = '<span class="cloud-dot"></span><span>Cloud</span>';
      button.addEventListener('click', openPanel);
      const mode = document.querySelector('.mode');
      if (mode) mode.insertAdjacentElement('afterend', button);
      else document.querySelector('.topbar')?.appendChild(button);
    }

    if (!byId('cloudOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'cloudOverlay';
      overlay.className = 'cloud-overlay hidden';
      overlay.innerHTML = `
        <section class="cloud-modal" role="dialog" aria-modal="true" aria-labelledby="cloudTitle">
          <div class="cloud-modal-head">
            <div>
              <div class="cloud-kicker">SAFETY TRAINING CLOUD</div>
              <h2 id="cloudTitle">Account e percorso</h2>
            </div>
            <button id="cloudClose" class="cloud-close" aria-label="Chiudi">×</button>
          </div>
          <div id="cloudPanelBody"></div>
          <div id="cloudMessage" class="cloud-message"></div>
          <div class="cloud-legal">Percorso formativo interno — non certificante. Il sistema registra attività, progressi e verifiche senza sostituire DVR, addestramento pratico o requisiti formali previsti per corsi certificanti.</div>
        </section>`;
      overlay.addEventListener('click', (event) => { if (event.target === overlay) closePanel(); });
      document.body.appendChild(overlay);
      byId('cloudClose')?.addEventListener('click', closePanel);
    }
  }

  function updateBadge() {
    ensureUi();
    const btn = byId('cloudAccount');
    if (!btn) return;
    btn.classList.toggle('offline', !state.online);
    btn.classList.toggle('authenticated', !!state.user);
    const label = !state.online
      ? 'Offline'
      : state.user
        ? (state.learner ? `${state.learner.first_name || ''} ${state.learner.last_name || ''}`.trim() || state.user.email : state.user.email)
        : 'Accedi';
    btn.innerHTML = `<span class="cloud-dot"></span><span>${esc(label)}</span>`;
    btn.title = state.user ? 'Apri account Safety Training' : 'Accedi a Safety Training Cloud';
  }

  function openPanel() {
    ensureUi();
    byId('cloudOverlay')?.classList.remove('hidden');
    renderPanel();
  }

  function closePanel() {
    byId('cloudOverlay')?.classList.add('hidden');
  }

  function renderPanel() {
    ensureUi();
    const body = byId('cloudPanelBody');
    if (!body) return;

    if (!state.client) {
      body.innerHTML = '<div class="cloud-state">Connessione cloud non disponibile. Il materiale didattico locale resta utilizzabile.</div>';
      return;
    }

    if (!state.user) {
      body.innerHTML = `
        <form id="cloudLoginForm" class="cloud-login">
          <p>Accedi con l’account assegnato dall’amministratore per registrare tempo attivo, progressi e risposte.</p>
          <label>Email<input id="cloudEmail" type="email" autocomplete="username" required></label>
          <label>Password<input id="cloudPassword" type="password" autocomplete="current-password" required></label>
          <button class="openbtn" type="submit">Accedi</button>
        </form>`;
      byId('cloudLoginForm')?.addEventListener('submit', signIn);
      return;
    }

    const assignments = state.assignments || [];
    const cards = assignments.length
      ? assignments.map((a) => `
          <article class="cloud-assignment ${state.activeAssignment?.id === a.id ? 'active' : ''}">
            <div><strong>${esc(a.courseTitle || a.editionTitle || 'Percorso')}</strong><span>v${esc(a.versionNumber || 1)} · ${esc(a.status)}</span></div>
            <div class="cloud-progress"><span style="width:${Math.max(0, Math.min(100, Number(a.progressPct || 0)))}%"></span></div>
            <small>${Number(a.progressPct || 0).toFixed(0)}% · ${formatSeconds(a.activeSeconds || 0)} attivi</small>
          </article>`).join('')
      : '<div class="cloud-state">Account attivo, ma non risultano ancora percorsi assegnati.</div>';

    body.innerHTML = `
      <div class="cloud-user-row">
        <div><strong>${esc(state.user.email || '')}</strong><span>${esc(state.learner ? 'Corsista collegato' : 'Account senza profilo corsista')}</span></div>
        <button id="cloudLogout" class="ghost" type="button">Esci</button>
      </div>
      <div class="cloud-summary"><span>${assignments.length}</span> percorsi assegnati</div>
      <div class="cloud-assignments">${cards}</div>`;
    byId('cloudLogout')?.addEventListener('click', signOut);
  }

  function formatSeconds(value) {
    const seconds = Math.max(0, Number(value) || 0);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
  }

  async function signIn(event) {
    event.preventDefault();
    const email = byId('cloudEmail')?.value?.trim();
    const password = byId('cloudPassword')?.value || '';
    if (!email || !password) return;
    setMessage('Accesso in corso…');
    const { error } = await state.client.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message || 'Accesso non riuscito.', 'error');
      return;
    }
    setMessage('Accesso effettuato.', 'ok');
  }

  async function signOut() {
    stopHeartbeat();
    if (state.learningSession) await endLearningSession().catch(() => {});
    await state.client?.auth.signOut();
    state.learner = null;
    state.assignments = [];
    state.activeAssignment = null;
    state.learningSession = null;
    renderPanel();
  }

  async function syncIdentity() {
    if (!state.user) {
      state.learner = null;
      state.assignments = [];
      state.activeAssignment = null;
      updateBadge();
      renderPanel();
      return;
    }

    await state.client.from('profiles').upsert({
      user_id: state.user.id,
      display_name: state.user.user_metadata?.display_name || state.user.email || null,
      locale: 'it-IT',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).catch(() => {});

    const { data: learner, error } = await state.client
      .from('learners')
      .select('id,organization_id,company_id,auth_user_id,first_name,last_name,email,job_title')
      .eq('auth_user_id', state.user.id)
      .eq('active', true)
      .maybeSingle();

    if (error) console.warn('[SafetyTraining Cloud] learner lookup:', error.message);
    state.learner = learner || null;
    state.assignments = state.learner ? await loadAssignments(state.learner.id) : [];
    updateBadge();
    renderPanel();
    await syncRouteContext();
  }

  async function loadAssignments(learnerId) {
    const { data: enrollments, error } = await state.client
      .from('enrollments')
      .select('id,edition_id,status,active_seconds,progress_pct,final_score_pct,started_at,completed_at,last_activity_at')
      .eq('learner_id', learnerId)
      .order('enrolled_at', { ascending: false });
    if (error || !enrollments?.length) return [];

    const editionIds = [...new Set(enrollments.map((x) => x.edition_id).filter(Boolean))];
    const { data: editions } = await state.client.from('course_editions')
      .select('id,course_version_id,title,status,available_from,available_until')
      .in('id', editionIds);
    const editionMap = new Map((editions || []).map((x) => [x.id, x]));

    const versionIds = [...new Set((editions || []).map((x) => x.course_version_id).filter(Boolean))];
    const { data: versions } = versionIds.length
      ? await state.client.from('course_versions').select('id,course_id,version_number,status').in('id', versionIds)
      : { data: [] };
    const versionMap = new Map((versions || []).map((x) => [x.id, x]));

    const courseIds = [...new Set((versions || []).map((x) => x.course_id).filter(Boolean))];
    const { data: courses } = courseIds.length
      ? await state.client.from('courses').select('id,stable_key,title,nominal_minutes').in('id', courseIds)
      : { data: [] };
    const courseMap = new Map((courses || []).map((x) => [x.id, x]));

    return enrollments.map((e) => {
      const edition = editionMap.get(e.edition_id) || {};
      const version = versionMap.get(edition.course_version_id) || {};
      const course = courseMap.get(version.course_id) || {};
      return {
        id: e.id,
        editionId: e.edition_id,
        editionTitle: edition.title,
        courseStableKey: course.stable_key,
        courseTitle: course.title,
        versionNumber: version.version_number,
        status: e.status,
        activeSeconds: e.active_seconds,
        progressPct: e.progress_pct,
        finalScorePct: e.final_score_pct,
        availableFrom: edition.available_from,
        availableUntil: edition.available_until
      };
    });
  }

  function parseRoute() {
    const value = location.hash.replace(/^#/, '');
    const parts = value.split('/').filter(Boolean);
    if (parts[0] === 'topic' && parts.length >= 3) {
      return { type: 'topic', courseKey: parts[1], topicKey: parts[2], unitStableKey: `${parts[1]}:${parts[2]}` };
    }
    if (parts[0] === 'course' && parts.length >= 2) return { type: 'course', courseKey: parts[1] };
    return { type: 'other' };
  }

  async function lookupUnitVersion(stableKey) {
    if (!stableKey || !state.user) return null;
    const { data: unit } = await state.client.from('learning_units')
      .select('id,stable_key')
      .eq('stable_key', stableKey)
      .eq('active', true)
      .maybeSingle();
    if (!unit) return null;
    const { data: version } = await state.client.from('learning_unit_versions')
      .select('id,version_number,status')
      .eq('learning_unit_id', unit.id)
      .eq('status', 'published')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    return version?.id || null;
  }

  async function syncRouteContext() {
    if (!state.user || !state.learner) return;
    const route = parseRoute();
    if (route.type !== 'topic') {
      state.currentUnitStableKey = null;
      state.currentUnitVersionId = null;
      return;
    }

    const assignment = state.assignments.find((a) => a.courseStableKey === route.courseKey && ['not_started', 'in_progress'].includes(a.status));
    if (!assignment) return;

    if (state.activeAssignment?.id !== assignment.id) {
      if (state.learningSession) await endLearningSession().catch(() => {});
      state.activeAssignment = assignment;
      await startLearningSession(assignment.id);
    }

    const previousUnit = state.currentUnitVersionId;
    const unitVersionId = await lookupUnitVersion(route.unitStableKey);
    if (!unitVersionId) return;

    if (previousUnit && previousUnit !== unitVersionId) {
      await recordEvent('unit_closed', previousUnit, 0).catch(() => {});
    }
    state.currentUnitStableKey = route.unitStableKey;
    state.currentUnitVersionId = unitVersionId;
    if (previousUnit !== unitVersionId) {
      await recordEvent('unit_opened', unitVersionId, 0).catch(() => {});
      await recordEvent('content_viewed', unitVersionId, 0, { route: location.hash }).catch(() => {});
    }
    startHeartbeat();
  }

  async function startLearningSession(enrollmentId) {
    if (!state.user || !enrollmentId) return null;
    const clientSessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const { data, error } = await state.client.from('learning_sessions')
      .insert({ enrollment_id: enrollmentId, client_session_id: clientSessionId, last_heartbeat_at: new Date().toISOString() })
      .select('id,enrollment_id,started_at,active_seconds')
      .single();
    if (error) {
      console.warn('[SafetyTraining Cloud] session start:', error.message);
      return null;
    }
    state.learningSession = data;
    await recordEvent('session_started', null, 0, { client_session_id: clientSessionId }).catch(() => {});
    return data;
  }

  async function endLearningSession() {
    if (!state.learningSession || !state.activeAssignment) return;
    stopHeartbeat();
    if (state.currentUnitVersionId) await recordEvent('unit_closed', state.currentUnitVersionId, 0).catch(() => {});
    await recordEvent('session_ended', null, 0).catch(() => {});
    await state.client.from('learning_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', state.learningSession.id);
    state.learningSession = null;
    state.currentUnitVersionId = null;
    state.currentUnitStableKey = null;
  }

  async function recordEvent(eventType, unitVersionId = null, activeDeltaSeconds = 0, payload = {}) {
    if (!state.learningSession || !state.activeAssignment) return null;
    const { data, error } = await state.client.from('learning_events').insert({
      enrollment_id: state.activeAssignment.id,
      session_id: state.learningSession.id,
      unit_version_id: unitVersionId,
      event_type: eventType,
      active_delta_seconds: activeDeltaSeconds,
      payload: payload || {}
    }).select('id,occurred_at,active_delta_seconds').single();
    if (error) throw error;
    return data;
  }

  async function sendHeartbeat() {
    if (!state.user || !state.learningSession || !state.activeAssignment) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
    if ((Date.now() - state.lastInteractionAt) > IDLE_LIMIT_MS) return;
    try {
      const event = await recordEvent('heartbeat', state.currentUnitVersionId, HEARTBEAT_SECONDS, {
        visible: true,
        focused: true,
        route: location.hash
      });
      if (event?.active_delta_seconds) {
        state.activeAssignment.activeSeconds = Number(state.activeAssignment.activeSeconds || 0) + Number(event.active_delta_seconds || 0);
      }
    } catch (error) {
      console.warn('[SafetyTraining Cloud] heartbeat:', error.message || error);
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    state.heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_SECONDS * 1000);
  }
  function stopHeartbeat() {
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    state.heartbeatTimer = null;
  }

  async function submitAnswer({ enrollmentId, questionId, optionId, sessionId = null }) {
    if (!state.user) throw new Error('Autenticazione richiesta');
    const targetEnrollment = enrollmentId || state.activeAssignment?.id;
    const targetSession = sessionId || state.learningSession?.id || null;
    if (!targetEnrollment || !questionId) throw new Error('Percorso o domanda non disponibili');

    const { count } = await state.client.from('question_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_id', targetEnrollment)
      .eq('question_id', questionId);

    const { data, error } = await state.client.from('question_attempts').insert({
      enrollment_id: targetEnrollment,
      question_id: questionId,
      session_id: targetSession,
      answer: { option_id: String(optionId) },
      attempt_no: Number(count || 0) + 1,
      metadata: { client: 'SafetyTraining Cloud v20' }
    }).select('id,is_correct,metadata,attempt_no,answered_at').single();
    if (error) throw error;
    return data;
  }

  async function getQuestionForUnit(stableKey) {
    const unitVersionId = await lookupUnitVersion(stableKey);
    if (!unitVersionId) return null;
    const { data, error } = await state.client.from('questions')
      .select('id,stable_key,prompt,question_type,options,metadata')
      .eq('unit_version_id', unitVersionId)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function init() {
    ensureUi();
    if (!window.supabase?.createClient) {
      console.warn('[SafetyTraining Cloud] Supabase browser client unavailable. Local mode kept active.');
      updateBadge();
      return;
    }

    state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const { data } = await state.client.auth.getSession();
    state.session = data?.session || null;
    state.user = state.session?.user || null;
    state.initialized = true;
    await syncIdentity();

    state.client.auth.onAuthStateChange(async (_event, session) => {
      state.session = session || null;
      state.user = session?.user || null;
      await syncIdentity();
    });
  }

  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((name) => {
    window.addEventListener(name, () => { state.lastInteractionAt = Date.now(); }, { passive: true });
  });
  window.addEventListener('online', () => { state.online = true; updateBadge(); });
  window.addEventListener('offline', () => { state.online = false; updateBadge(); });
  window.addEventListener('hashchange', () => { syncRouteContext().catch(() => {}); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      recordEvent('visibility_paused', state.currentUnitVersionId, 0).catch(() => {});
    } else {
      state.lastInteractionAt = Date.now();
      recordEvent('visibility_resumed', state.currentUnitVersionId, 0).catch(() => {});
    }
  });

  window.SAFETY_CLOUD = {
    state,
    openPanel,
    closePanel,
    loadAssignments: () => state.learner ? loadAssignments(state.learner.id) : Promise.resolve([]),
    getQuestionForUnit,
    submitAnswer,
    recordEvent,
    syncRouteContext
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
