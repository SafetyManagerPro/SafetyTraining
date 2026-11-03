/* SafetyTraining — admin learner invitation/access enhancement. */
(() => {
  'use strict';

  const cloud = () => window.SAFETY_CLOUD;
  const db = () => cloud()?.state?.client;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state = { timer:null, running:false };

  function ensureStyle() {
    if (document.getElementById('adminInviteStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminInviteStyles';
    style.textContent = `
      .invite-badge{display:inline-flex;align-items:center;gap:.35rem;border-radius:999px;padding:.22rem .55rem;font-size:.78rem;font-weight:700;white-space:nowrap}
      .invite-badge.ok{background:#dcfce7;color:#166534}.invite-badge.sent{background:#dbeafe;color:#1d4ed8}.invite-badge.warn{background:#fef3c7;color:#92400e}.invite-badge.err{background:#fee2e2;color:#991b1b}.invite-badge.muted{background:#e5e7eb;color:#4b5563}
      .invite-meta{display:block;margin-top:.28rem;font-size:.72rem;color:#64748b;line-height:1.35}.invite-inline{margin-top:.35rem}.admin-row-btn.invite-action{margin-left:.35rem}
    `;
    document.head.appendChild(style);
  }

  function statusFor(learner, invitation) {
    if (learner?.auth_user_id || invitation?.status === 'accepted') return { key:'accepted', label:'Account attivo', cls:'ok' };
    if (!learner?.email) return { key:'missing_email', label:'Email mancante', cls:'warn' };
    if (!invitation) return { key:'not_sent', label:'Non invitato', cls:'muted' };
    if (invitation.status === 'sent') return { key:'sent', label:'Invito inviato', cls:'sent' };
    if (invitation.status === 'failed') return { key:'failed', label:'Invio fallito', cls:'err' };
    if (invitation.status === 'revoked') return { key:'revoked', label:'Invito revocato', cls:'warn' };
    return { key:invitation.status || 'not_sent', label:'Non invitato', cls:'muted' };
  }

  function redirectUrl() {
    // Inviti inviati da admin o preview devono sempre terminare nel sito pubblico.
    return 'https://safety-training-safety-manager.vercel.app/?onboarding=1';
  }

  async function sendInvite(learnerId, button) {
    const client = db();
    if (!client || !learnerId) return;
    const old = button?.textContent || 'Invita';
    if (button) { button.disabled = true; button.textContent = 'Invio…'; }
    try {
      const { data, error } = await client.functions.invoke('invite-learner', {
        body: { learner_id: learnerId, redirect_to: redirectUrl() }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
      alert(data?.already_linked ? 'Account già collegato al corsista.' : 'Invito inviato correttamente.');
      document.querySelectorAll('[data-invite-sig]').forEach(el => el.removeAttribute('data-invite-sig'));
      schedule(50);
    } catch (error) {
      alert(`Invito non inviato: ${error?.message || error}`);
      schedule(100);
    } finally {
      if (button?.isConnected) { button.disabled = false; button.textContent = old; }
    }
  }

  async function loadMaps() {
    const client = db();
    if (!client) return null;
    const [{ data: learners, error: le }, { data: invites, error: ie }] = await Promise.all([
      client.from('learners').select('id,email,auth_user_id,active'),
      client.from('learner_account_invitations').select('learner_id,email,status,sent_count,last_sent_at,accepted_at,last_error')
    ]);
    if (le || ie) return null;
    return {
      learners: new Map((learners || []).map(x => [x.id, x])),
      invites: new Map((invites || []).map(x => [x.learner_id, x]))
    };
  }

  function inviteButton(learnerId, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-row-btn invite-action st-invite-action';
    b.textContent = label;
    b.dataset.learnerId = learnerId;
    b.onclick = () => sendInvite(learnerId, b);
    return b;
  }

  async function enhanceLearners() {
    const maps = await loadMaps();
    if (!maps) return;
    const rows = [...document.querySelectorAll('#adminContent .admin-table tbody tr')];
    rows.forEach(row => {
      const anchor = row.querySelector('[data-action="edit"], [data-action="toggle"]');
      const id = anchor?.dataset?.id;
      if (!id) return;
      const learner = maps.learners.get(id);
      if (!learner) return;
      const inv = maps.invites.get(id);
      const st = statusFor(learner, inv);
      const sig = `${st.key}|${inv?.sent_count || 0}|${inv?.last_sent_at || ''}|${learner.auth_user_id || ''}`;
      if (row.dataset.inviteSig === sig) return;
      row.dataset.inviteSig = sig;

      const cells = row.querySelectorAll('td');
      const accessCell = cells[5];
      const actionsCell = cells[cells.length - 1];
      if (accessCell) {
        const detail = st.key === 'sent' && inv?.last_sent_at ? `Inviato ${new Date(inv.last_sent_at).toLocaleString('it-IT')}`
          : st.key === 'failed' && inv?.last_error ? inv.last_error
          : st.key === 'accepted' && inv?.accepted_at ? `Accettato ${new Date(inv.accepted_at).toLocaleDateString('it-IT')}` : '';
        accessCell.innerHTML = `<span class="invite-badge ${st.cls}">${esc(st.label)}</span>${detail ? `<span class="invite-meta">${esc(detail)}</span>` : ''}`;
      }
      actionsCell?.querySelectorAll('.st-invite-action').forEach(x => x.remove());
      if (actionsCell && learner.email && st.key !== 'accepted') actionsCell.appendChild(inviteButton(id, st.key === 'not_sent' ? 'Invita' : 'Reinvia'));
    });
  }

  async function enhanceEnrollments() {
    const client = db();
    if (!client) return;
    const maps = await loadMaps();
    if (!maps) return;
    const { data: enrollments, error } = await client.from('enrollments').select('id,learner_id');
    if (error) return;
    const enrollmentMap = new Map((enrollments || []).map(x => [x.id, x.learner_id]));
    const rows = [...document.querySelectorAll('#adminContent .admin-table tbody tr')];
    rows.forEach(row => {
      const action = row.querySelector('[data-action="revoke"], [data-action="restore"]');
      const enrollmentId = action?.dataset?.id;
      const learnerId = enrollmentMap.get(enrollmentId);
      if (!learnerId) return;
      const learner = maps.learners.get(learnerId);
      const inv = maps.invites.get(learnerId);
      const st = statusFor(learner, inv);
      const sig = `${enrollmentId}|${st.key}|${inv?.sent_count || 0}`;
      if (row.dataset.inviteSig === sig) return;
      row.dataset.inviteSig = sig;
      const first = row.querySelector('td');
      if (first) {
        first.querySelectorAll('.st-account-state').forEach(x => x.remove());
        const wrap = document.createElement('div');
        wrap.className = 'invite-inline st-account-state';
        wrap.innerHTML = `<span class="invite-badge ${st.cls}">${esc(st.label)}</span>`;
        first.appendChild(wrap);
      }
      const last = row.querySelector('td:last-child');
      last?.querySelectorAll('.st-invite-action').forEach(x => x.remove());
      if (last && learner?.email && st.key !== 'accepted') last.appendChild(inviteButton(learnerId, st.key === 'not_sent' ? 'Invita' : 'Reinvia'));
    });
  }

  async function enhance() {
    if (state.running || !db()) return;
    const shell = document.getElementById('adminShell');
    if (!shell || shell.classList.contains('hidden')) return;
    const title = document.getElementById('adminTitle')?.textContent?.trim();
    if (!['Corsisti','Iscrizioni'].includes(title)) return;
    state.running = true;
    try {
      if (title === 'Corsisti') await enhanceLearners();
      else await enhanceEnrollments();
    } catch (error) {
      console.warn('[SafetyTraining Inviti]', error?.message || error);
    } finally { state.running = false; }
  }

  function schedule(delay = 120) {
    clearTimeout(state.timer);
    state.timer = setTimeout(enhance, delay);
  }

  async function boot() {
    ensureStyle();
    for (let i = 0; i < 40 && !db(); i++) await new Promise(r => setTimeout(r, 200));
    const observer = new MutationObserver(() => schedule());
    observer.observe(document.body, { childList:true, subtree:true });
    schedule(0);
    window.addEventListener('focus', () => schedule(50));
  }

  window.SAFETY_ADMIN_INVITES = { refresh:() => schedule(0), sendInvite };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
