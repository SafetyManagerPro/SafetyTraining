/* SafetyTraining v21 — scoped administration capabilities compatibility layer. */
(() => {
  'use strict';

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const user = () => cloud()?.state?.user;
  const state = { capabilities:null, booted:false, observer:null, authUnsub:null, promoting:false };

  const cap = key => !!state.capabilities?.capabilities?.[key];
  const isPlatform = () => !!state.capabilities?.platform_admin;
  const isScoped = () => !!state.capabilities?.admin_console && !isPlatform();

  function setHidden(el, hidden) {
    if (!el) return;
    el.classList.toggle('hidden', !!hidden);
    if (hidden) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden');
  }

  async function fetchCapabilities() {
    if (!db() || !user()) {
      state.capabilities = null;
      window.SAFETY_ADMIN_CAPABILITIES_STATE = null;
      return null;
    }
    const {data,error} = await db().rpc('admin_capabilities');
    if (error) throw error;
    state.capabilities = data || null;
    window.SAFETY_ADMIN_CAPABILITIES_STATE = state.capabilities;
    return state.capabilities;
  }

  function fakePlatformAdminBuilder() {
    return {
      select() {
        return {
          eq() {
            return {
              maybeSingle: async () => ({ data:{ user_id:user()?.id || null }, error:null })
            };
          }
        };
      }
    };
  }

  async function promoteScopedAdminState() {
    if (!isScoped() || !db() || !window.SAFETY_ADMIN?.refreshRole || state.promoting) return;
    state.promoting = true;
    const client = db();
    const originalFrom = client.from;
    client.from = function(table) {
      if (table === 'platform_admins') return fakePlatformAdminBuilder();
      return originalFrom.call(client, table);
    };
    try {
      await window.SAFETY_ADMIN.refreshRole();
    } finally {
      client.from = originalFrom;
      state.promoting = false;
    }
  }

  async function openScopedConsole() {
    try {
      await fetchCapabilities();
      if (!isScoped()) return;
      await promoteScopedAdminState();
      const shell = document.getElementById('adminShell');
      if (!shell) return;
      shell.classList.remove('hidden');
      document.body.classList.add('admin-open');
      await window.SAFETY_ADMIN?.render?.();
      applyVisibility();
    } catch (error) {
      console.error('[Admin capabilities v21]', error);
    }
  }

  function hideActions(actions, hidden) {
    actions.forEach(action => {
      document.querySelectorAll(`#adminContent [data-action="${action}"]`).forEach(el => setHidden(el, hidden));
    });
  }

  function applyVisibility() {
    const caps = state.capabilities;
    const button = document.getElementById('adminConsoleBtn');
    if (!caps?.admin_console) {
      setHidden(button, true);
      return;
    }

    if (isScoped()) {
      setHidden(button, false);
      button.onclick = openScopedConsole;
      button.title = caps.roles?.organization_admin ? 'Amministrazione organizzazione' : 'Gestione formazione organizzazione';
    }

    const nav = document.querySelector('#adminShell .admin-nav nav');
    if (nav) {
      setHidden(nav.querySelector('[data-tab="organizations"]'), !cap('manage_organizations'));
      setHidden(nav.querySelector('[data-tab="courses"]'), !cap('manage_courses'));
    }

    document.querySelectorAll('#adminContent [data-jump="courses"]').forEach(el => setHidden(el, !cap('manage_courses')));

    if (!cap('manage_companies')) {
      hideActions(['new-company','edit-company','toggle-company'], true);
    }

    if (!cap('manage_learners')) hideActions(['new-learner','edit-learner','toggle-learner','invite-learner'], true);
    if (!cap('manage_editions')) hideActions(['edit-edition','close-edition','open-edition','manage-edition'], true);
    if (!cap('manage_enrollments')) hideActions(['bulk-select-all','bulk-clear','bulk-submit','revoke','restore'], true);
    if (!cap('manage_evidence')) document.querySelectorAll('#adminContent [data-completion-gates]').forEach(el => setHidden(el, true));

    const editionForm = document.getElementById('editionForm');
    if (editionForm) setHidden(editionForm.closest('.admin-card') || editionForm, !cap('manage_editions'));

    const bulkEdition = document.getElementById('bulkEdition');
    if (bulkEdition) {
      const card = bulkEdition.closest('.admin-card');
      if (card && card.querySelector('[data-action="bulk-submit"]')) setHidden(card, !cap('manage_enrollments'));
    }

    // Global/editorial tools remain platform-only. The temporary platform-admin read shim
    // is active only during SAFETY_ADMIN.refreshRole(), never while these modules authorize.
    ['smImportBtn','blueprintAdminBtn','courseReadinessBtn'].forEach(id => setHidden(document.getElementById(id), !cap('view_editorial_tools')));
    document.querySelectorAll('[data-sm-course-catalog]').forEach(el => setHidden(el, !cap('manage_safetymanager')));
  }

  function observeUi() {
    state.observer?.disconnect();
    state.observer = new MutationObserver(() => applyVisibility());
    state.observer.observe(document.body, {childList:true, subtree:true});
    applyVisibility();
  }

  async function refresh() {
    try {
      await fetchCapabilities();
      if (isScoped()) await promoteScopedAdminState();
      applyVisibility();
    } catch (error) {
      state.capabilities = null;
      window.SAFETY_ADMIN_CAPABILITIES_STATE = null;
      console.warn('[Admin capabilities v21]', error?.message || error);
      setHidden(document.getElementById('adminConsoleBtn'), true);
    }
  }

  async function boot() {
    if (state.booted) return;
    state.booted = true;
    for (let i=0; i<50 && (!db() || !window.SAFETY_ADMIN); i++) await new Promise(r => setTimeout(r,120));
    await refresh();
    observeUi();
    const subscription = db()?.auth?.onAuthStateChange(() => setTimeout(refresh,140));
    state.authUnsub = subscription?.data?.subscription || null;
  }

  window.SAFETY_ADMIN_CAPABILITIES_V21 = {
    refresh,
    get:() => state.capabilities,
    can:key => cap(key),
    version:'21.1'
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
