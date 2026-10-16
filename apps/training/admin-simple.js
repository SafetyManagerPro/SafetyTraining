/* SafetyTraining — simplify administration only when exactly one organization is active. */
(() => {
  'use strict';
  let defaultOrgId = null;
  let simpleMode = false;

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
        th.style.display = hidden ? 'none' : '';
        table.querySelectorAll('tbody tr').forEach(tr => {
          const cell = tr.children[index];
          if (cell) cell.style.display = hidden ? 'none' : '';
        });
      });
    });
  }

  function patchAdmin() {
    const shell = document.getElementById('adminShell');
    if (!shell) return;

    const orgNav = shell.querySelector('[data-tab="organizations"]');
    if (orgNav) orgNav.style.display = simpleMode ? 'none' : '';

    shell.querySelectorAll('.admin-stat').forEach(card => {
      if (card.textContent.toLowerCase().includes('organizzazioni')) card.style.display = simpleMode ? 'none' : '';
    });

    shell.querySelectorAll('.admin-flow span').forEach(span => {
      if (!span.textContent.toLowerCase().includes('organizzazione')) return;
      const next = span.nextElementSibling;
      span.style.display = simpleMode ? 'none' : '';
      if (next?.tagName === 'B') next.style.display = simpleMode ? 'none' : '';
    });

    const flow = shell.querySelector('.admin-flow');
    if (flow) {
      const labels = [...flow.querySelectorAll('span')].filter(x => x.style.display !== 'none');
      labels.forEach((x, i) => x.textContent = `${i + 1}. ${x.textContent.replace(/^\d+\.\s*/, '')}`);
    }

    shell.querySelectorAll('select[name="organization_id"]').forEach(select => {
      if (!simpleMode || !defaultOrgId) {
        select.classList.remove('admin-org-hidden');
        select.removeAttribute('aria-hidden');
        select.tabIndex = 0;
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
      if (opt.textContent.trim() === "Tutta l'organizzazione") opt.textContent = 'Tutte le aziende';
    });

    organizationColumns(shell, simpleMode);
  }

  async function boot() {
    for (let i = 0; i < 30 && !db(); i++) await new Promise(r => setTimeout(r, 200));
    await resolveDefaultOrganization();
    const shell = document.getElementById('adminShell');
    if (shell) new MutationObserver(patchAdmin).observe(shell, { childList: true, subtree: true });
    db()?.auth?.onAuthStateChange(() => setTimeout(resolveDefaultOrganization, 50));
  }

  window.SAFETY_ADMIN_SIMPLE = { refresh: resolveDefaultOrganization, isSimple: () => simpleMode };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
