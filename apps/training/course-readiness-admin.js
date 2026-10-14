/* SafetyTraining — administrative course-readiness gate. */
(() => {
  'use strict';

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
  const root = () => document.getElementById('adminShell');
  const host = () => document.getElementById('adminContent');
  const title = () => document.getElementById('adminTitle');
  const hours = min => `${Math.round(Number(min || 0) / 60 * 10) / 10} h`;

  const stateLabel = {
    blocked: 'Bloccato',
    needs_configuration: 'Da configurare',
    ready_for_review: 'Pronto per revisione',
    ready_for_publish: 'Pubblicabile tecnicamente',
    published: 'Pubblicato'
  };

  const itemLabel = {
    missing_course_version: 'Versione corso mancante',
    missing_course_modules: 'Moduli corso mancanti',
    missing_practical_requirement: 'Requisito pratico mancante',
    missing_verification_requirement: 'Verifica finale mancante',
    missing_test_definition: 'Definizione test mancante',
    draft_version: 'Versione in bozza',
    admin_review_required: 'Revisione amministrativa/didattica richiesta',
    learner_catalog_hidden: 'Nascosto al catalogo corsisti',
    dynamic_content_selection_required: 'Contenuti dinamici da selezionare',
    collective_bargaining_check_required: 'Verifica contrattazione collettiva richiesta',
    verification_path_selection_required: 'Scegliere test oppure colloquio',
    platform_question_bank_incomplete: 'Question bank del test incompleta',
    external_practical_validation_required: 'Validazione pratica esterna/in presenza richiesta'
  };

  function badge(state) {
    const cls = state === 'published' || state === 'ready_for_publish'
      ? 'admin-ok'
      : state === 'blocked'
        ? 'admin-error'
        : 'admin-warn';
    return `<span class="${cls}">${esc(stateLabel[state] || state || '—')}</span>`;
  }

  function chips(items, hard = false) {
    if (!items?.length) return '<span class="admin-ok">Nessuno</span>';
    return items.map(item => `<span class="${hard ? 'admin-error' : 'admin-note'}">${esc(itemLabel[item] || item)}</span>`).join('<br>');
  }

  function ensureNav() {
    const shell = root();
    if (!shell || shell.querySelector('[data-readiness-admin]')) return;
    const nav = shell.querySelector('.admin-nav nav');
    if (!nav) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.readinessAdmin = '1';
    button.innerHTML = '<span>🚦</span> Readiness corsi';
    const anchor = nav.querySelector('[data-blueprint-admin]') || nav.querySelector('[data-sm-course-catalog]');
    anchor?.after(button);
    if (!anchor) nav.appendChild(button);
    button.onclick = render;
  }

  async function render() {
    if (!db() || !host()) return;
    root()?.querySelectorAll('.admin-nav button').forEach(x => x.classList.remove('active'));
    root()?.querySelector('[data-readiness-admin]')?.classList.add('active');
    if (title()) title().textContent = 'Readiness e pubblicabilità corsi';
    host().innerHTML = '<div class="admin-loading">Analisi readiness corsi…</div>';

    const { data, error } = await db().rpc('get_course_readiness');
    if (error) {
      host().innerHTML = `<div class="admin-error">${esc(error.message)}</div>`;
      return;
    }

    const payload = data || {};
    const summary = payload.summary || {};
    const courses = Array.isArray(payload.courses) ? payload.courses : [];
    const order = ['blocked','needs_configuration','ready_for_review','ready_for_publish','published'];

    const stats = [
      ['Totale', summary.total || 0],
      ['Bloccati', summary.blocked || 0],
      ['Da configurare', summary.needs_configuration || 0],
      ['Pronti per revisione', summary.ready_for_review || 0],
      ['Pubblicabili tecnicamente', summary.ready_for_publish || 0],
      ['Pubblicati', summary.published || 0]
    ].map(([label,value]) => `<article class="admin-stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></article>`).join('');

    const sections = order.map(state => {
      const rows = courses.filter(c => c.readiness_state === state);
      if (!rows.length) return '';
      return `<section class="admin-card">
        <h2>${esc(stateLabel[state] || state)} <span class="admin-note">(${rows.length})</span></h2>
        <div class="admin-table-wrap"><table class="admin-table">
          <thead><tr><th>Corso</th><th>Stato</th><th>Struttura</th><th>Blocchi</th><th>Da verificare</th></tr></thead>
          <tbody>${rows.map(c => `<tr>
            <td><strong>${esc(c.title)}</strong><div class="admin-note">${esc(c.stable_key)} · ${esc(c.family || '—')} · ${c.nominal_minutes ? hours(c.nominal_minutes) : '—'}</div><div class="admin-note">Blueprint: ${esc(c.blueprint_key || '—')}${c.variant_key ? ` · Variante: ${esc(c.variant_key)}` : ''}</div></td>
            <td>${badge(c.readiness_state)}<div class="admin-note">Versione ${esc(c.version_number || '—')} · ${esc(c.version_status || '—')}</div>${c.delivery_constraint ? `<div class="admin-note">${esc(c.delivery_constraint)}</div>` : ''}</td>
            <td><strong>${esc(c.module_count || 0)}</strong> moduli · <strong>${esc(c.unit_count || 0)}</strong> LU<br><span class="admin-note">Pratica: ${esc(c.required_practical_count || 0)} · Verifiche: ${esc(c.required_verification_count || 0)}</span>${c.required_practical_minutes ? `<br><span class="admin-note">Pratica richiesta: ${hours(c.required_practical_minutes)}</span>` : ''}<br><span class="admin-note">Test richiesti: ${esc(c.required_test_count || 0)} · Test definiti: ${esc(c.test_count || 0)} · Domande collegate: ${esc(c.linked_required_test_question_count || 0)}</span>${c.verification_path_selection_count ? `<br><span class="admin-warn">Scelta verifica da effettuare: ${esc(c.verification_path_selection_count)}</span>` : ''}</td>
            <td>${chips(c.hard_blockers, true)}</td>
            <td>${chips(c.review_items, false)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </section>`;
    }).join('');

    host().innerHTML = `
      <section class="admin-card">
        <h2>Gate amministrativo di pubblicazione</h2>
        <p class="admin-note">Questo controllo misura soltanto la readiness tecnica/amministrativa del catalogo. Non pubblica corsi automaticamente e non attribuisce validità legale alla formazione. Dove la verifica può essere test oppure colloquio, il metodo deve essere scelto esplicitamente: la banca domande è obbligatoria solo se viene selezionato il test.</p>
        <div class="admin-stats">${stats}</div>
      </section>
      ${sections || '<section class="admin-card"><p class="admin-note">Nessun corso disponibile per il controllo.</p></section>'}
    `;
  }

  async function boot() {
    for (let i = 0; i < 40 && !root(); i++) await new Promise(r => setTimeout(r, 200));
    ensureNav();
    if (root()) new MutationObserver(ensureNav).observe(root(), { childList:true, subtree:true });
  }

  window.SAFETY_COURSE_READINESS_ADMIN = { render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
