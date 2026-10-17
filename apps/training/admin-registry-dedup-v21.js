/* SafetyTraining v21 — registry duplicate preflight (Codice Fiscale / Partita IVA). */
(() => {
  'use strict';

  const db = () => window.SAFETY_CLOUD?.state?.client;
  const state = { companyId:null, learnerId:null };
  const bypass = new WeakSet();

  function toast(message, kind='warn') {
    let host = document.getElementById('adminToasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'adminToasts';
      host.className = 'admin-toasts';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = `admin-toast ${kind}`;
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 180);
    }, 5200);
  }

  const formTitle = form => form.closest('#adminModal')?.querySelector('h2')?.textContent?.trim() || '';

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'new-company') state.companyId = null;
    if (action === 'edit-company') state.companyId = button.dataset.id || null;
    if (action === 'new-learner') state.learnerId = null;
    if (action === 'edit-learner') state.learnerId = button.dataset.id || null;
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (bypass.has(form)) {
      bypass.delete(form);
      return;
    }

    const title = formTitle(form);
    const isCompany = title === 'Nuova azienda' || title === 'Modifica azienda';
    const isLearner = title === 'Nuovo corsista' || title === 'Modifica corsista';
    if (!isCompany && !isLearner) return;

    const identifierName = isCompany ? 'vat_number' : 'fiscal_code';
    const identifierField = form.querySelector(`[name="${identifierName}"]`);
    const organizationId = form.querySelector('[name="organization_id"]')?.value || null;
    const identifier = identifierField?.value?.trim() || '';
    if (!identifier || !organizationId || !db()) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    (async () => {
      let proceed = true;
      try {
        const {data, error} = await db().rpc('admin_registry_conflict', {
          p_entity_type: isCompany ? 'company' : 'learner',
          p_organization_id: organizationId,
          p_identifier: identifier,
          p_exclude_id: isCompany ? state.companyId : state.learnerId
        });
        if (error) throw error;

        if (data) {
          proceed = false;
          if (isCompany) {
            toast(`P. IVA già presente: ${data.label || 'azienda esistente'}. Usa l’azienda già registrata invece di crearne una nuova.`, 'warn');
          } else {
            const company = data.company_name ? ` · ${data.company_name}` : '';
            toast(`Codice fiscale già presente: ${data.label || 'corsista esistente'}${company}. Modifica o collega il corsista già registrato invece di crearne uno nuovo.`, 'warn');
          }
          identifierField?.focus();
        }
      } catch (error) {
        console.warn('[Registry dedup preflight]', error?.message || error);
        toast('Controllo duplicati preventivo non disponibile: il salvataggio resta protetto dal database.', 'warn');
      }

      if (proceed) {
        bypass.add(form);
        form.requestSubmit();
      }
    })();
  }, true);

  window.SAFETY_ADMIN_REGISTRY_DEDUP_V21 = { version:'21.1' };
})();
