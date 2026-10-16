/* SafetyTraining — simplify administration only when exactly one organization is active. */
(() => {
  'use strict';
  let defaultOrgId = null;
  let simpleMode = false;
  let patchTimer = null;
  let patching = false;

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;

  async function resolveDefaultOrganization() {
    if (!db()) return;
    const { data, error } = await db().from('organizations').select('id,name,code,active').eq('active', true).order('created_at');
    if (error) {
      console.warn('[SafetyTraining Admin Simple]', error.message);
      simpleMode = false;
      defaultOrgId = null;
    } else {
      simpleMode = (data || []).length === 1;
      defaultOrgId = simpleMode ? data[0].id : null;
    }
    patchAdmin();
  }

  function organizationColumns(root, hidden) {
    root.querySelectorAll('table.admin-table').forEach(table => {
      const heads = [...table.querySelectorAll('thead th')];
      heads.forEach((th, index) => {
        if (th.textContent.trim().toLowerCase() !== 'organizzazione') return;
        const display = hidden ? 'none' : '';
        if (th.style.display !== display) th.style.display = display;
        table.querySelectorAll('tbody tr').forEach(tr => {
          const cell = tr.children[index];
          if (cell && cell.style.display !== display) cell.style.display = display;
        });
      });
    });
  }

  function patchAdmin() {
    if (patching) return;
    const shell = document.getElementById('adminShell');
    if (!shell) return;
    patching = true;
    try {
      const orgNav = shell.querySelector('[data-tab="organizations"]');
      if (orgNav) {
        const display = simpleMode ? 'none' : '';
        if (orgNav.style.display !== display) orgNav.style.display = display;
      }

      shell.querySelectorAll('.admin-stat').forEach(card => {
        if (!card.textContent.toLowerCase().includes('organizzazioni')) return;
        const display = simpleMode ? 'none' : '';
        if (card.style.display !== display) card.style.display = display;
      });

      shell.querySelectorAll('.admin-flow span').forEach(span => {
        if (!span.textContent.toLowerCase().includes('organizzazione')) return;
        const next = span.nextElementSibling;
        const display = simpleMode ? 'none' : '';
        if (span.style.display !== display) span.style.display = display;
        if (next?.tagName === 'B' && next.style.display !== display) next.style.display = display;
      });

      const flow = shell.querySelector('.admin-flow');
      if (flow) {
        const labels = [...flow.querySelectorAll('span')].filter(x => x.style.display !== 'none');
        labels.forEach((x, i) => {
          const desired = `${i + 1}. ${x.textContent.replace(/^\d+\.\s*/, '')}`;
          if (x.textContent !== desired) x.textContent = desired;
        });
      }

      shell.querySelectorAll('select[name="organization_id"]').forEach(select => {
        if (!simpleMode || !defaultOrgId) {
          select.classList.remove('admin-org-hidden');
          select.removeAttribute('aria-hidden');
          select.removeAttribute('tabindex');
          return;
        }
        if (select.value !== defaultOrgId) {
          select.value = defaultOrgId;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        select.classList.add('admin-org-hidden');
        select.setAttribute('aria-hidden', 'true');
        select.tabIndex = -1;
      });

      shell.querySelectorAll('option').forEach(opt => {
        if (!opt.dataset.adminOriginalText) opt.dataset.adminOriginalText = opt.textContent.trim();
        const original = opt.dataset.adminOriginalText;
        const desired = simpleMode && original === "Tutta l'organizzazione" ? 'Tutte le aziende' : original;
        if (opt.textContent.trim() !== desired) opt.textContent = desired;
      });

      organizationColumns(shell, simpleMode);
    } finally {
      patching = false;
    }
  }

  function schedulePatch(delay = 0) {
    clearTimeout(patchTimer);
    patchTimer = setTimeout(patchAdmin, delay);
  }

  async function boot() {
    for (let i = 0; i < 30 && !db(); i++) await new Promise(r => setTimeout(r, 200));
    await resolveDefaultOrganization();
    const shell = document.getElementById('adminShell');
    if (shell) new MutationObserver(() => schedulePatch(0)).observe(shell, { childList: true, subtree: true });
    db()?.auth?.onAuthStateChange(() => setTimeout(resolveDefaultOrganization, 50));
  }

  window.SAFETY_ADMIN_SIMPLE = { refresh: resolveDefaultOrganization, isSimple: () => simpleMode };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
