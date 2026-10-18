/* SafetyTraining — invited learner onboarding and account completion. */
(() => {
  'use strict';

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const state = { recovery:false, open:false, filtering:false };

  function onboardingRequested() {
    return new URL(location.href).searchParams.get('onboarding') === '1' || state.recovery;
  }

  function ensureUi() {
    if (!document.getElementById('learnerOnboardingStyles')) {
      const style = document.createElement('style');
      style.id = 'learnerOnboardingStyles';
      style.textContent = `
        .learner-onboarding{position:fixed;inset:0;z-index:10050;background:rgba(2,6,23,.72);display:grid;place-items:center;padding:20px}.learner-onboarding.hidden{display:none}
        .learner-onboarding-card{width:min(520px,100%);background:#fff;color:#0f172a;border-radius:20px;padding:24px;box-shadow:0 25px 80px rgba(0,0,0,.35)}
        .learner-onboarding-card h2{margin:4px 0 8px}.learner-onboarding-card p{color:#475569;line-height:1.5}.learner-onboarding-card label{display:grid;gap:6px;margin:14px 0;font-weight:700}.learner-onboarding-card input{font:inherit;padding:12px;border:1px solid #cbd5e1;border-radius:10px}.learner-onboarding-card button{font:inherit;padding:11px 16px;border:0;border-radius:10px;background:#0f172a;color:#fff;font-weight:800;cursor:pointer}.learner-onboarding-card button:disabled{opacity:.55;cursor:wait}.learner-onboarding-message{min-height:1.4em;margin-top:10px;font-size:.9rem}.learner-onboarding-message.error{color:#b91c1c}.learner-onboarding-message.ok{color:#166534}
        .learner-onboarding-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
      `;
      document.head.appendChild(style);
    }
    if (document.getElementById('learnerOnboarding')) return;
    const root = document.createElement('div');
    root.id = 'learnerOnboarding';
    root.className = 'learner-onboarding hidden';
    root.innerHTML = `<section class="learner-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="learnerOnboardingTitle">
      <div style="font-size:.75rem;font-weight:800;letter-spacing:.08em;color:#64748b">SAFETY TRAINING · PRIMO ACCESSO</div>
      <h2 id="learnerOnboardingTitle">Imposta la tua password</h2>
      <p>Completa l'attivazione dell'account. Dopo questo passaggio vedrai esclusivamente i corsi che ti sono stati assegnati.</p>
      <form id="learnerOnboardingForm">
        <label class="learner-onboarding-sr-only">Email dell'account<input id="learnerOnboardingUsername" type="email" name="username" autocomplete="username" readonly tabindex="-1"></label>
        <label>Nuova password<input id="learnerNewPassword" type="password" autocomplete="new-password" minlength="8" required></label>
        <label>Conferma password<input id="learnerNewPasswordConfirm" type="password" autocomplete="new-password" minlength="8" required></label>
        <button id="learnerPasswordSubmit" type="submit">Attiva account</button>
      </form>
      <div id="learnerOnboardingMessage" class="learner-onboarding-message"></div>
    </section>`;
    document.body.appendChild(root);
    document.getElementById('learnerOnboardingForm').onsubmit = submitPassword;
  }

  function message(text, kind = '') {
    const el = document.getElementById('learnerOnboardingMessage');
    if (!el) return;
    el.textContent = text || '';
    el.className = `learner-onboarding-message ${kind}`.trim();
  }

  function show(sessionUser = null) {
    ensureUi();
    const usernameField = document.getElementById('learnerOnboardingUsername');
    if (usernameField) usernameField.value = sessionUser?.email || cloud()?.state?.user?.email || '';
    state.open = true;
    document.getElementById('learnerOnboarding')?.classList.remove('hidden');
  }

  function cleanOnboardingUrl() {
    const u = new URL(location.href);
    u.searchParams.delete('onboarding');
    history.replaceState({}, '', `${u.pathname}${u.search}${u.hash}`);
  }

  async function claimLearner() {
    if (cloud()?.state?.learner) return true;
    const { data, error } = await db().rpc('claim_learner_account');
    if (error) throw error;
    return !!data;
  }

  async function submitPassword(event) {
    event.preventDefault();
    const pass = document.getElementById('learnerNewPassword')?.value || '';
    const confirm = document.getElementById('learnerNewPasswordConfirm')?.value || '';
    if (pass.length < 8) return message('La password deve avere almeno 8 caratteri.', 'error');
    if (pass !== confirm) return message('Le due password non coincidono.', 'error');
    const button = document.getElementById('learnerPasswordSubmit');
    if (button) button.disabled = true;
    message('Attivazione in corso…');
    try {
      const { error } = await db().auth.updateUser({ password: pass });
      if (error) throw error;
      try { await claimLearner(); } catch (claimError) {
        if (!cloud()?.state?.learner) throw claimError;
      }
      cleanOnboardingUrl();
      message('Account attivato. Carico i tuoi corsi…', 'ok');
      window.setTimeout(() => location.reload(), 600);
    } catch (error) {
      message(error?.message || 'Impossibile completare l’attivazione.', 'error');
      if (button) button.disabled = false;
    }
  }

  function removeRevokedAssignments() {
    const c = cloud()?.state;
    if (!c?.assignments?.length || state.filtering) return;
    const kept = c.assignments.filter(a => a.status !== 'revoked');
    if (kept.length === c.assignments.length) return;
    state.filtering = true;
    c.assignments = kept;
    Promise.resolve(window.SAFETY_LEARNER?.render?.()).catch(() => {}).finally(() => { state.filtering = false; });
  }

  async function maybeOpen() {
    if (!db() || !onboardingRequested()) return;
    const { data } = await db().auth.getSession();
    if (data?.session?.user) show(data.session.user);
  }

  async function boot() {
    ensureUi();
    for (let i = 0; i < 40 && !db(); i++) await new Promise(r => setTimeout(r, 200));
    await maybeOpen();
    db()?.auth?.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') state.recovery = true;
      if (session?.user && (event === 'PASSWORD_RECOVERY' || onboardingRequested())) window.setTimeout(() => show(session.user), 100);
      window.setTimeout(removeRevokedAssignments, 700);
    });
    window.setInterval(removeRevokedAssignments, 5000);
  }

  window.SAFETY_ONBOARDING = { show, maybeOpen };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
