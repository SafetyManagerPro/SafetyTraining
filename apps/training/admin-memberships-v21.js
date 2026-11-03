/* SafetyTraining v21 — platform-only organization admin membership UI. */
(() => {
  'use strict';

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const roleLabel = role => role === 'organization_admin' ? 'Admin organizzazione' : role === 'training_manager' ? 'Training manager' : role;
  const state = { booted:false, observer:null, snapshot:null, rendering:false };

  const canManage = () => !!window.SAFETY_ADMIN_CAPABILITIES_V21?.can?.('manage_admin_memberships');

  function notify(message, kind='info') {
    let host = document.getElementById('adminToasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'adminToasts'; host.className = 'admin-toasts';
      document.body.appendChild(host);
    }
    const item = document.createElement('div');
    item.className = `admin-toast ${kind}`;
    item.textContent = message;
    host.appendChild(item);
    requestAnimationFrame(() => item.classList.add('show'));
    setTimeout(() => { item.classList.remove('show'); setTimeout(() => item.remove(),180); }, 3600);
  }

  function ensureNav() {
    const nav = document.querySelector('#adminShell .admin-nav nav');
    if (!nav) return null;
    let button = document.getElementById('adminMembershipsNav');
    if (!button) {
      button = document.createElement('button');
      button.id = 'adminMembershipsNav';
      button.type = 'button';
      button.innerHTML = '<span>🛡️</span>Ruoli amministrativi';
      button.addEventListener('click', () => render());
      nav.appendChild(button);
    }
    button.classList.toggle('hidden', !canManage());
    button.setAttribute('aria-hidden', canManage() ? 'false' : 'true');
    return button;
  }

  function setHeader() {
    document.querySelectorAll('#adminShell .admin-nav nav button').forEach(b => b.classList.remove('active'));
    document.getElementById('adminMembershipsNav')?.classList.add('active');
    const title = document.getElementById('adminTitle');
    const subtitle = document.getElementById('adminSubtitle');
    if (title) title.textContent = 'Ruoli amministrativi';
    if (subtitle) subtitle.textContent = 'Assegnazione controllata dei ruoli organizzativi';
  }

  function loading() {
    return '<div class="admin-loading"><span class="admin-spinner"></span>Caricamento ruoli…</div>';
  }

  function badge(text, kind='muted') {
    return `<span class="admin-badge ${kind}">${esc(text)}</span>`;
  }

  function renderSnapshot(snapshot) {
    const host = document.getElementById('adminContent');
    if (!host) return;
    const organizations = snapshot?.organizations || [];
    const activeOrganizations = organizations.filter(o => o.organization_active).sort((a,b)=>(a.organization_name||'').localeCompare(b.organization_name||'','it-IT',{sensitivity:'base',numeric:true}));
    const memberships = snapshot?.memberships || [];
    const rows = [...memberships].sort((a,b)=>(a.email||'').localeCompare(b.email||'','it-IT',{sensitivity:'base',numeric:true})).map(item => {
      const canReactivate = item.organization_active !== false;
      const action = item.active
        ? `<button type="button" class="admin-row-btn danger" data-membership-toggle="0" data-id="${esc(item.membership_id)}">Revoca</button>`
        : `<button type="button" class="admin-row-btn" data-membership-toggle="1" data-id="${esc(item.membership_id)}" ${canReactivate ? '' : 'disabled title="Organizzazione inattiva"'}>Riattiva</button>`;
      return `<tr data-membership-row="${esc(item.membership_id)}">
        <td><strong>${esc(item.email || '—')}</strong><small class="admin-cell-note">${esc(item.user_id)}</small></td>
        <td>${esc(item.organization_name || '—')}</td>
        <td>${esc(roleLabel(item.role))}</td>
        <td>${badge(item.active ? 'Attivo' : 'Revocato', item.active ? 'ok' : 'muted')}</td>
        <td>${action}</td>
      </tr>`;
    }).join('');

    host.innerHTML = `
      <section class="admin-card">
        <div class="admin-card-head"><div><h2>Assegna ruolo</h2><p>Solo ruoli organizzativi ammessi. <code>company_admin</code> resta disabilitato.</p></div>${badge('Solo platform admin','info')}</div>
        <form id="adminMembershipForm" class="admin-form grid">
          <label class="wide">Email account Auth<input type="email" name="email" autocomplete="off" required placeholder="nome@azienda.it"></label>
          <label>Organizzazione<select name="organization_id" required><option value="">Seleziona…</option>${activeOrganizations.map(o => `<option value="${esc(o.organization_id)}">${esc(o.organization_name)}</option>`).join('')}</select></label>
          <label>Ruolo<select name="role" required><option value="organization_admin">Admin organizzazione</option><option value="training_manager">Training manager</option></select></label>
          <div class="admin-form-actions wide"><button class="admin-primary" ${activeOrganizations.length ? '' : 'disabled'}>Assegna / riattiva</button></div>
        </form>
        <p class="admin-note">L’account deve esistere già in Supabase Auth. La piattaforma non crea utenti da questa schermata e non modifica mai i platform admin.</p>
      </section>
      <section class="admin-card">
        <div class="admin-card-head"><div><h2>Ruoli assegnati</h2><p>${memberships.length} assegnazioni registrate, incluse quelle revocate.</p></div><button type="button" class="admin-row-btn" id="adminMembershipRefresh">↻ Aggiorna</button></div>
        <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Account</th><th>Organizzazione</th><th>Ruolo</th><th>Stato</th><th>Azioni</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="admin-empty">Nessun ruolo organizzativo assegnato.</td></tr>'}</tbody></table></div>
      </section>`;

    const form = document.getElementById('adminMembershipForm');
    form?.addEventListener('submit', assign);
    document.getElementById('adminMembershipRefresh')?.addEventListener('click', () => render(true));
    host.querySelectorAll('[data-membership-toggle]').forEach(button => button.addEventListener('click', toggleMembership));
  }

  async function fetchOverview() {
    const {data,error} = await db().rpc('admin_memberships_overview', {p_organization_id:null});
    if (error) throw error;
    state.snapshot = data || {organizations:[],memberships:[]};
    return state.snapshot;
  }

  async function render(force=false) {
    if (!canManage() || !db() || state.rendering) return;
    state.rendering = true;
    try {
      ensureNav(); setHeader();
      const host = document.getElementById('adminContent');
      if (host) host.innerHTML = loading();
      const snapshot = force || !state.snapshot ? await fetchOverview() : state.snapshot;
      renderSnapshot(snapshot);
    } catch (error) {
      console.error('[Admin memberships v21]', error);
      const host = document.getElementById('adminContent');
      if (host) host.innerHTML = `<div class="admin-error">${esc(error?.message || error)}</div>`;
    } finally {
      state.rendering = false;
    }
  }

  async function assign(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      p_organization_id: data.get('organization_id'),
      p_user_email: String(data.get('email') || '').trim(),
      p_role: data.get('role'),
      p_active: true
    };
    const submit = form.querySelector('button[type="submit"],button.admin-primary');
    if (submit) submit.disabled = true;
    try {
      const {data:result,error} = await db().rpc('admin_set_organization_membership', payload);
      if (error) throw error;
      notify(`${roleLabel(result.role)} assegnato a ${result.email}.`, 'success');
      state.snapshot = null;
      await render(true);
    } catch (error) {
      console.error('[Admin memberships assign]', error);
      notify(`Assegnazione non riuscita: ${error?.message || error}`, 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function toggleMembership(event) {
    const button = event.currentTarget;
    const id = button.dataset.id;
    const active = button.dataset.membershipToggle === '1';
    const item = state.snapshot?.memberships?.find(m => m.membership_id === id);
    if (!item) return;
    if (!active && !window.confirm(`Revocare ${roleLabel(item.role)} a ${item.email}?`)) return;
    button.disabled = true;
    try {
      const {error} = await db().rpc('admin_set_organization_membership', {
        p_organization_id:item.organization_id,
        p_user_email:item.email,
        p_role:item.role,
        p_active:active
      });
      if (error) throw error;
      notify(active ? 'Ruolo riattivato.' : 'Ruolo revocato.', 'success');
      state.snapshot = null;
      await render(true);
    } catch (error) {
      console.error('[Admin memberships toggle]', error);
      notify(`Operazione non riuscita: ${error?.message || error}`, 'error');
      button.disabled = false;
    }
  }

  function observe() {
    state.observer?.disconnect();
    state.observer = new MutationObserver(() => ensureNav());
    state.observer.observe(document.body,{childList:true,subtree:true});
    ensureNav();
  }

  async function boot() {
    if (state.booted) return;
    state.booted = true;
    for (let i=0; i<60 && (!window.SAFETY_ADMIN_CAPABILITIES_V21 || !document.getElementById('adminShell')); i++) {
      await new Promise(resolve => setTimeout(resolve,120));
    }
    observe();
  }

  window.SAFETY_ADMIN_MEMBERSHIPS_V21 = { render, refresh:() => render(true), version:'21.2' };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
