/* SafetyTraining v21.6 — lightweight client-side list tools for admin/editorial tables. */
(() => {
  'use strict';

  const viewState = new Map();
  const fold = value => String(value ?? '').trim().toLocaleLowerCase('it');
  const text = element => String(element?.textContent || '').replace(/\s+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[char]));

  const configs = {
    'Organizzazioni': { filters:['Stato'], sorts:['Nome','Codice','Stato'], existingSearch:true },
    'Aziende': { filters:['Stato','Organizzazione'], sorts:['Azienda','Organizzazione','P. IVA','ATECO','Stato'], existingSearch:true },
    'Corsisti': { filters:['Accesso','Stato'], sorts:['Corsista','Azienda','Organizzazione','Mansione','Stato'], existingSearch:true },
    'Corsi': { filters:['Famiglia','Governance','Stato'], sorts:['Corso','Famiglia','Durata','Versione','Stato'], existingSearch:true },
    'Edizioni': { filters:['Stato','Azienda'], sorts:['Edizione','Corso','Azienda','Stato','Disponibilità'], existingSearch:true },
    'Iscrizioni': { filters:['Stato'], sorts:['Corsista','Percorso','Stato','Progresso','Ultima attività'], existingSearch:true },
    'Catalogo corsi SafetyManager': { filters:['Stato'], sorts:['Corso SafetyManager','Codice','Durata','Stato'], search:true },
    'Blueprint corsi e Master Registry': { filters:['Sviluppo'], sorts:['Corso SafetyManager','Blueprint / regola','Profilo'], search:true, multi:true },
    'Readiness e pubblicabilità corsi': { filters:['Stato'], sorts:['Corso','Stato','Struttura'], search:true, multi:true },
    'Qualità didattica v22': { filters:['Famiglia','Livello','Pratica fisica'], sorts:['Corso','Famiglia','Punteggio','Livello'], search:true }
  };

  function tableMeta(table) {
    const headers = [...table.querySelectorAll('thead th')].map(text);
    const rows = [...table.querySelectorAll('tbody tr')].filter(row => !row.querySelector('td[colspan]'));
    rows.forEach((row, index) => {
      if (!row.dataset.listToolsOrder) row.dataset.listToolsOrder = String(index);
    });
    return { table, headers, rows };
  }

  function columnIndex(meta, label) {
    const wanted = fold(label);
    return meta.headers.findIndex(header => fold(header) === wanted);
  }

  function cellText(row, index) {
    return index < 0 ? '' : text(row.children[index]);
  }

  function filterCellText(row, index) {
    if (index < 0) return '';
    const cell = row.children[index];
    const marker = cell?.querySelector('.admin-badge,.admin-ok,.admin-warn,.admin-error');
    return text(marker || cell);
  }

  function uniqueValues(metas, label) {
    return [...new Set(metas.flatMap(meta => {
      const index = columnIndex(meta, label);
      return index < 0 ? [] : meta.rows.map(row => filterCellText(row, index)).filter(Boolean);
    }))].sort((a, b) => a.localeCompare(b, 'it', { numeric:true, sensitivity:'base' }));
  }

  function stateFor(title) {
    if (!viewState.has(title)) viewState.set(title, { query:'', filters:{}, sort:'', direction:'asc' });
    return viewState.get(title);
  }

  function buildToolbar(title, config, metas) {
    const saved = stateFor(title);
    const toolbar = document.createElement('div');
    toolbar.className = 'admin-list-tools';
    toolbar.dataset.adminListTools = title;

    const search = config.search ? `<label class="admin-list-search"><span>⌕</span><input type="search" data-list-query value="${esc(saved.query)}" placeholder="Cerca nella vista…" aria-label="Cerca nella vista"></label>` : '';
    const filters = config.filters.map(label => {
      const values = uniqueValues(metas, label);
      if (!values.length) return '';
      return `<label class="admin-list-control"><span>${esc(label)}</span><select data-list-filter="${esc(label)}"><option value="">Tutti</option>${values.map(value => `<option value="${esc(value)}" ${saved.filters[label] === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>`;
    }).join('');
    const sortOptions = config.sorts.filter(label => metas.some(meta => columnIndex(meta, label) >= 0));
    const sort = sortOptions.length ? `<label class="admin-list-control"><span>Ordina per</span><select data-list-sort><option value="">Ordine originale</option>${sortOptions.map(label => `<option value="${esc(label)}" ${saved.sort === label ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label><button type="button" class="admin-list-direction" data-list-direction aria-label="Inverti ordinamento" title="Inverti ordinamento">${saved.direction === 'desc' ? '↓' : '↑'}</button>` : '';

    toolbar.innerHTML = `${search}<div class="admin-list-controls">${filters}${sort}<button type="button" class="admin-list-reset" data-list-reset>Reset</button><output class="admin-list-count" data-list-count aria-live="polite"></output></div>`;
    return toolbar;
  }

  function apply(title, config, toolbar, metas) {
    const saved = stateFor(title);
    const query = fold(saved.query);
    let visible = 0;
    let total = 0;

    metas.forEach(meta => {
      const sortIndex = columnIndex(meta, saved.sort);
      const rows = [...meta.rows];
      if (sortIndex >= 0) {
        rows.sort((a, b) => {
          const result = cellText(a, sortIndex).localeCompare(cellText(b, sortIndex), 'it', { numeric:true, sensitivity:'base' });
          return saved.direction === 'desc' ? -result : result;
        });
      } else {
        rows.sort((a, b) => Number(a.dataset.listToolsOrder) - Number(b.dataset.listToolsOrder));
      }
      rows.forEach(row => meta.table.tBodies[0].appendChild(row));

      let tableVisible = 0;
      rows.forEach(row => {
        const queryOk = !query || fold(text(row)).includes(query);
        const filtersOk = Object.entries(saved.filters).every(([label, value]) => {
          if (!value) return true;
          const index = columnIndex(meta, label);
          return index >= 0 && fold(filterCellText(row, index)) === fold(value);
        });
        const show = queryOk && filtersOk;
        row.hidden = !show;
        total += 1;
        if (show) { visible += 1; tableVisible += 1; }
      });

      if (config.multi) {
        const card = meta.table.closest('.admin-card');
        if (card && !card.classList.contains('admin-guide-card')) card.classList.toggle('admin-list-card-empty', tableVisible === 0);
      }
    });

    const count = toolbar.querySelector('[data-list-count]');
    if (count) count.textContent = `${visible} di ${total}`;
  }

  function bind(title, config, toolbar, metas) {
    const saved = stateFor(title);
    toolbar.addEventListener('input', event => {
      if (event.target.matches('[data-list-query]')) saved.query = event.target.value;
      apply(title, config, toolbar, metas);
    });
    toolbar.addEventListener('change', event => {
      if (event.target.matches('[data-list-filter]')) saved.filters[event.target.dataset.listFilter] = event.target.value;
      if (event.target.matches('[data-list-sort]')) saved.sort = event.target.value;
      apply(title, config, toolbar, metas);
    });
    toolbar.addEventListener('click', event => {
      if (event.target.closest('[data-list-direction]')) {
        saved.direction = saved.direction === 'asc' ? 'desc' : 'asc';
        event.target.closest('[data-list-direction]').textContent = saved.direction === 'desc' ? '↓' : '↑';
        apply(title, config, toolbar, metas);
      }
      if (event.target.closest('[data-list-reset]')) {
        saved.query = ''; saved.filters = {}; saved.sort = ''; saved.direction = 'asc';
        const existing = document.querySelector('#adminContent [data-admin-search]');
        if (config.existingSearch && existing?.value) {
          existing.value = '';
          existing.dispatchEvent(new Event('input', { bubbles:true }));
          schedule();
          return;
        }
        enhance(true);
      }
    });
  }

  function enhance(force=false) {
    const title = text(document.getElementById('adminTitle'));
    const config = configs[title];
    const host = document.getElementById('adminContent');
    if (!config || !host || host.querySelector('.admin-loading')) return;
    if (host.querySelector('[data-admin-list-tools]') && !force) return;

    host.querySelectorAll('[data-admin-list-tools]').forEach(node => node.remove());
    host.querySelectorAll('.admin-list-card-empty').forEach(node => node.classList.remove('admin-list-card-empty'));
    const metas = [...host.querySelectorAll('.admin-table')].map(tableMeta).filter(meta => meta.rows.length);
    if (!metas.length) return;

    const toolbar = buildToolbar(title, config, metas);
    if (config.multi) {
      const anchor = host.querySelector('.admin-guide-card') || host.querySelector('.admin-card');
      anchor?.insertAdjacentElement('afterend', toolbar);
    } else {
      const card = metas[0].table.closest('.admin-card');
      const search = card?.querySelector('.admin-search');
      (search || card?.querySelector('.admin-table-wrap'))?.insertAdjacentElement(search ? 'afterend' : 'beforebegin', toolbar);
    }
    if (!toolbar.isConnected) host.prepend(toolbar);
    bind(title, config, toolbar, metas);
    apply(title, config, toolbar, metas);
  }

  function schedule() {
    [0, 120, 320, 700, 1400, 2400].forEach(delay => setTimeout(enhance, delay));
  }

  async function boot() {
    for (let i=0; i<40 && !document.getElementById('adminShell'); i++) await new Promise(resolve => setTimeout(resolve, 120));
    document.querySelector('#adminShell .admin-nav')?.addEventListener('click', schedule);
    document.getElementById('adminRefresh')?.addEventListener('click', schedule);
    document.getElementById('adminConsoleBtn')?.addEventListener('click', schedule);
    document.addEventListener('input', event => { if (event.target.closest('[data-admin-search]')) schedule(); }, true);
    document.addEventListener('click', event => {
      if (event.target.closest('[data-action],[data-sm-course-catalog],[data-blueprint-admin],[data-readiness-admin],[data-quality-v22],[data-save]')) schedule();
    }, true);
    schedule();
  }

  window.SAFETY_ADMIN_LIST_TOOLS_V21 = { enhance, schedule, version:'21.6' };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
