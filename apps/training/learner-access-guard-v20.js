/* SafetyTraining — learner access guard: assigned courses only. */
(() => {
  'use strict';
  const cloud = () => window.SAFETY_CLOUD;
  const isLearner = () => !!cloud()?.state?.learner;
  let applying = false;

  function hideLearnerOnlyUi() {
    const learner = isLearner();
    document.body.classList.toggle('learner-restricted-ui', learner);
    if (!learner) return;

    const search = document.getElementById('search');
    if (search) search.hidden = true;
    document.querySelector('.mode')?.setAttribute('hidden','');
    ['showFav','showRecent','showDpi','showRefs','showChecklist'].forEach(id => {
      const el = document.getElementById(id); if (el) el.hidden = true;
    });
    document.querySelectorAll('.sidebar h3').forEach(h => {
      if (h.textContent?.trim() === 'Strumenti') h.hidden = true;
    });
    const sub = document.querySelector('.brandsub');
    if (sub) sub.textContent = 'portale corsista · corsi assegnati';
  }

  function assignedOnlyHome() {
    if (!isLearner() || applying) return false;
    applying = true;
    try {
      hideLearnerOnlyUi();
      window.SAFETY_LEARNER?.open?.();
    } finally {
      setTimeout(() => { applying = false; }, 0);
    }
    return true;
  }

  function guardRoute() {
    hideLearnerOnlyUi();
    if (!isLearner()) return;
    const parts = location.hash.replace(/^#/,'').split('/').filter(Boolean);
    if (!parts.length) {
      setTimeout(assignedOnlyHome, 0);
      return;
    }
    if (parts[0] === 'library') {
      location.hash = '';
      setTimeout(assignedOnlyHome, 0);
    }
  }

  function overrideHome() {
    if (!isLearner()) return;
    try { window.home = () => assignedOnlyHome(); } catch (_) {}
  }

  async function boot() {
    for (let i=0;i<50 && !cloud()?.state?.client;i++) await new Promise(r=>setTimeout(r,150));
    hideLearnerOnlyUi();
    overrideHome();
    guardRoute();

    cloud()?.state?.client?.auth?.onAuthStateChange(() => {
      setTimeout(() => { hideLearnerOnlyUi(); overrideHome(); guardRoute(); }, 450);
    });
    window.addEventListener('hashchange', guardRoute);
    window.addEventListener('focus', () => { hideLearnerOnlyUi(); if (isLearner() && !location.hash) assignedOnlyHome(); });

    const observer = new MutationObserver(() => {
      if (!isLearner()) return;
      hideLearnerOnlyUi();
      if (!location.hash && document.getElementById('catalogBrowserRoot')) assignedOnlyHome();
    });
    observer.observe(document.body, {childList:true,subtree:true});
  }

  window.SAFETY_LEARNER_ACCESS = { refresh:guardRoute, openHome:assignedOnlyHome };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
