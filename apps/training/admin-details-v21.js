/* SafetyTraining v21 — server-backed administration detail views. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtDate=v=>v?new Date(v).toLocaleDateString('it-IT'):'—';
  const fmtDateTime=v=>v?new Date(v).toLocaleString('it-IT'):'—';
  const hours=s=>`${Math.round(Number(s||0)/360)/10} h`;
  const pct=v=>v==null?'—':`${Number(v).toFixed(0)}%`;
  const state={kind:null,id:null};

  function ensureUi(){
    if(document.getElementById('adminDetailOverlay'))return;
    const style=document.createElement('style');style.id='adminDetailStyle';style.textContent=`
      .admin-detail-overlay{position:fixed;inset:0;z-index:1750;background:rgba(2,8,18,.84);backdrop-filter:blur(10px);display:grid;place-items:center;padding:18px}.admin-detail-overlay.hidden{display:none}.admin-detail-modal{width:min(1080px,100%);max-height:94vh;overflow:auto;background:#111c2d;color:#f7fbff;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 100px rgba(0,0,0,.55)}.admin-detail-head{display:flex;justify-content:space-between;gap:16px;padding:20px;border-bottom:1px solid rgba(255,255,255,.09)}.admin-detail-head h2{margin:3px 0}.admin-detail-head p{margin:4px 0 0;color:#aebbd0;font-size:12px}.admin-detail-close{border:0;background:rgba(255,255,255,.08);color:white;border-radius:10px;width:38px;height:38px;font-size:22px}.admin-detail-body{padding:20px;display:grid;gap:15px}.admin-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.admin-detail-stat{padding:13px;background:#0b1626;border:1px solid rgba(255,255,255,.08);border-radius:13px}.admin-detail-stat strong{display:block;font-size:21px}.admin-detail-stat span{color:#aebbd0;font-size:11px}.admin-detail-section{border:1px solid rgba(255,255,255,.08);border-radius:14px;background:#0d1829;padding:14px}.admin-detail-section h3{margin:0 0 9px}.admin-detail-meta{display:flex;gap:14px;flex-wrap:wrap;color:#aebbd0;font-size:12px}.admin-detail-table{width:100%;border-collapse:collapse;font-size:12px}.admin-detail-table th,.admin-detail-table td{text-align:left;padding:9px 8px;border-bottom:1px solid rgba(255,255,255,.07);vertical-align:top}.admin-detail-table th{color:#aebbd0}.admin-detail-pill{display:inline-block;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.07);font-size:10px}.admin-detail-pill.ok{background:rgba(77,211,168,.14);color:#a9f2d6}.admin-detail-pill.warn{background:rgba(255,196,92,.14);color:#ffe0a0}.admin-detail-pill.danger{background:rgba(255,105,105,.14);color:#ffc2c2}.admin-detail-empty{color:#aebbd0;font-size:12px}.admin-detail-actions{display:flex;gap:6px;flex-wrap:wrap}@media(max-width:720px){.admin-detail-body{padding:13px}.admin-detail-modal{border-radius:14px}.admin-detail-table{font-size:11px}.admin-detail-table th,.admin-detail-table td{padding:7px 5px}}
    `;document.head.appendChild(style);
    const ov=document.createElement('div');ov.id='adminDetailOverlay';ov.className='admin-detail-overlay hidden';ov.innerHTML=`<section class="admin-detail-modal"><header class="admin-detail-head"><div><div class="admin-kicker">DETTAGLIO AMMINISTRATIVO</div><h2 id="adminDetailTitle">Dettaglio</h2><p id="adminDetailSubtitle">Dati server-side</p></div><button type="button" class="admin-detail-close">×</button></header><div id="adminDetailBody" class="admin-detail-body"></div></section>`;document.body.appendChild(ov);
    ov.onclick=e=>{if(e.target===ov)close();};ov.querySelector('.admin-detail-close').onclick=close;
    ov.addEventListener('click',e=>{const b=e.target.closest('[data-open-detail]');if(!b)return;open(b.dataset.openDetail,b.dataset.id);});
  }

  function close(){document.getElementById('adminDetailOverlay')?.classList.add('hidden');state.kind=null;state.id=null;}
  const pill=(text,kind='')=>`<span class="admin-detail-pill ${kind}">${esc(text??'—')}</span>`;
  const stat=(value,label)=>`<div class="admin-detail-stat"><strong>${esc(value??0)}</strong><span>${esc(label)}</span></div>`;
  const button=(kind,id,label='Apri')=>`<button type="button" class="admin-row-btn" data-open-detail="${esc(kind)}" data-id="${esc(id)}">${esc(label)}</button>`;
  const statusKind=s=>['completed','passed','open','accepted','sent'].includes(s)?'ok':['in_progress','draft','not_started','needs_configuration'].includes(s)?'warn':['revoked','failed','closed'].includes(s)?'danger':'';

  function table(headers,rows,empty='Nessun dato disponibile.'){
    return `<div style="overflow:auto"><table class="admin-detail-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="admin-detail-empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  }

  function actionsHtml(actions){
    const rows=(actions||[]).slice(0,12).map(a=>[fmtDateTime(a.created_at),`<code>${esc(a.action)}</code>`]);
    return `<section class="admin-detail-section"><h3>Azioni amministrative recenti</h3>${table(['Quando','Azione'],rows,'Nessuna azione registrata per questa entità.')}</section>`;
  }

  function renderCompany(d){
    const c=d.company||{},s=d.summary||{};
    document.getElementById('adminDetailTitle').textContent=c.name||'Azienda';
    document.getElementById('adminDetailSubtitle').textContent=`${d.organization?.name||'Organizzazione'} · ${c.ateco_code||'ATECO non indicato'}`;
    const learnerRows=(d.learners||[]).map(l=>[
      `<strong>${esc(`${l.first_name||''} ${l.last_name||''}`.trim()||'—')}</strong><br><small>${esc(l.job_title||'')}</small>`,
      esc(l.email||'—'),
      l.account_active?pill('Account attivo','ok'):pill(l.invite_status||'Da invitare',statusKind(l.invite_status)),
      l.active?pill('Attivo','ok'):pill('Disattivo','danger'),
      button('learner',l.id,'Dettaglio')
    ]);
    const editionRows=(d.editions||[]).map(x=>[
      `<strong>${esc(x.title)}</strong><br><small>${esc(x.course_title||'')}</small>`,
      `v${esc(x.course_version||'—')}`,
      pill(x.status,statusKind(x.status)),
      esc(x.enrollments_total||0),
      esc(x.completed||0),
      button('edition',x.id,'Dettaglio')
    ]);
    return `<div class="admin-detail-grid">${stat(s.learners_active,'Corsisti attivi')}${stat(s.learners_with_account,'Account attivi')}${stat(s.editions_open,'Edizioni aperte')}${stat(s.enrollments_total,'Iscrizioni')}${stat(s.enrollments_in_progress,'In corso')}${stat(s.enrollments_completed,'Completate')}</div>
      <section class="admin-detail-section"><h3>Anagrafica</h3><div class="admin-detail-meta"><span>P.IVA: <strong>${esc(c.vat_number||'—')}</strong></span><span>CF: <strong>${esc(c.fiscal_code||'—')}</strong></span><span>ATECO: <strong>${esc(c.ateco_code||'—')}</strong></span><span>Stato: <strong>${c.active?'attiva':'disattiva'}</strong></span></div></section>
      <section class="admin-detail-section"><h3>Corsisti</h3>${table(['Corsista','Email','Accesso','Stato',''],learnerRows)}</section>
      <section class="admin-detail-section"><h3>Edizioni aziendali</h3>${table(['Edizione','Versione','Stato','Iscritti','Completati',''],editionRows)}</section>
      ${actionsHtml(d.recent_admin_actions)}`;
  }

  function renderLearner(d){
    const l=d.learner||{},s=d.summary||{},inv=d.invitation||{};
    const name=`${l.first_name||''} ${l.last_name||''}`.trim()||l.email||'Corsista';
    document.getElementById('adminDetailTitle').textContent=name;
    document.getElementById('adminDetailSubtitle').textContent=`${d.company?.name||'Nessuna azienda'} · ${l.job_title||'Mansione non indicata'}`;
    const rows=(d.enrollments||[]).map(e=>{
      const gate=e.completion_gate||{};
      const gateText=(gate.practical_required||gate.verification_required)?`${gate.practical_completed||0}/${gate.practical_required||0} pratica · ${gate.verification_completed||0}/${gate.verification_required||0} verifica`:'—';
      return [
        `<strong>${esc(e.edition_title)}</strong><br><small>${esc(e.course_title)} · v${esc(e.course_version)}</small>`,
        pill(e.status,statusKind(e.status)),
        pct(e.progress_pct),
        hours(e.active_seconds),
        e.final_score_pct==null?'—':pct(e.final_score_pct),
        esc(gateText),
        fmtDateTime(e.last_activity_at),
        button('edition',e.edition_id,'Edizione')
      ];
    });
    return `<div class="admin-detail-grid">${stat(s.active_enrollments,'Percorsi attivi')}${stat(s.in_progress,'In corso')}${stat(s.completed,'Completati')}${stat(s.enrollments_total,'Iscrizioni totali')}${stat(s.account_active?'Sì':'No','Account attivo')}</div>
      <section class="admin-detail-section"><h3>Anagrafica e accesso</h3><div class="admin-detail-meta"><span>Email: <strong>${esc(l.email||'—')}</strong></span><span>CF: <strong>${esc(l.fiscal_code||'—')}</strong></span><span>Azienda: <strong>${esc(d.company?.name||'—')}</strong></span><span>Invito: <strong>${esc(inv.status||'—')}</strong></span><span>Ultimo invio: <strong>${fmtDateTime(inv.last_sent_at)}</strong></span></div>${inv.last_error?`<p class="admin-error">Ultimo errore invito: ${esc(inv.last_error)}</p>`:''}</section>
      <section class="admin-detail-section"><h3>Percorsi / iscrizioni</h3>${table(['Percorso','Stato','Progresso','Tempo','Punteggio','Gate','Ultima attività',''],rows)}</section>
      ${actionsHtml(d.recent_admin_actions)}`;
  }

  function renderEdition(d){
    const e=d.edition||{},c=d.course||{},s=d.summary||{};
    document.getElementById('adminDetailTitle').textContent=e.title||c.title||'Edizione';
    document.getElementById('adminDetailSubtitle').textContent=`${c.title||'Corso'} · v${c.version_number||'—'} · ${d.company?.name||'tutte le aziende'}`;
    const rows=(d.enrollments||[]).map(x=>[
      `<strong>${esc(x.learner_name||x.email||'—')}</strong><br><small>${esc(x.job_title||'')}</small>`,
      esc(x.email||'—'),
      x.account_active?pill('Account attivo','ok'):pill(x.invite_status||'Da invitare',statusKind(x.invite_status)),
      pill(x.status,statusKind(x.status)),
      pct(x.progress_pct),
      x.final_score_pct==null?'—':pct(x.final_score_pct),
      `${esc(x.evidence_completed||0)} ok / ${esc(x.evidence_pending||0)} pend.`,
      button('learner',x.learner_id,'Corsista')
    ]);
    return `<div class="admin-detail-grid">${stat(s.enrollments_total,'Iscritti')}${stat(s.accounts_active,'Account attivi')}${stat(s.not_started,'Da iniziare')}${stat(s.in_progress,'In corso')}${stat(s.completed,'Completati')}${stat(s.revoked,'Revocati')}${stat(s.practical_requirements,'Gate pratici')}${stat(s.verification_requirements,'Verifiche')}</div>
      <section class="admin-detail-section"><h3>Corso ed erogazione</h3><div class="admin-detail-meta"><span>Corso: <strong>${esc(c.title||'—')}</strong></span><span>Versione: <strong>v${esc(c.version_number||'—')}</strong></span><span>Go-live: <strong>${c.go_live_ready?'sì':'no'}</strong></span><span>Modalità: <strong>${esc(e.learning_mode||'—')}</strong></span><span>Stato: <strong>${esc(e.status||'—')}</strong></span><span>Disponibilità: <strong>${fmtDate(e.available_from)} → ${fmtDate(e.available_until)}</strong></span></div></section>
      <section class="admin-detail-section"><h3>Corsisti iscritti</h3>${table(['Corsista','Email','Accesso','Stato','Progresso','Score','Evidenze',''],rows)}</section>
      ${actionsHtml(d.recent_admin_actions)}`;
  }

  async function open(kind,id){
    ensureUi();state.kind=kind;state.id=id;const ov=document.getElementById('adminDetailOverlay'),body=document.getElementById('adminDetailBody');ov.classList.remove('hidden');body.innerHTML='<div class="admin-loading">Caricamento dettaglio dal backend…</div>';
    const rpcName={company:'admin_company_detail',learner:'admin_learner_detail',edition:'admin_edition_detail'}[kind];
    const argName={company:'p_company_id',learner:'p_learner_id',edition:'p_edition_id'}[kind];
    if(!rpcName){body.innerHTML='<div class="admin-error">Tipo dettaglio non supportato.</div>';return;}
    const {data,error}=await db().rpc(rpcName,{[argName]:id});
    if(error){body.innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;return;}
    body.innerHTML=kind==='company'?renderCompany(data):kind==='learner'?renderLearner(data):renderEdition(data);
  }

  function enhance(){
    const specs=[['edit-company','company'],['edit-learner','learner'],['edit-edition','edition']];
    specs.forEach(([action,kind])=>{
      document.querySelectorAll(`#adminContent [data-action="${action}"]`).forEach(anchor=>{
        const cell=anchor.closest('td');if(!cell||cell.querySelector(`[data-detail-added="${kind}"][data-id="${anchor.dataset.id}"]`))return;
        const b=document.createElement('button');b.type='button';b.className='admin-row-btn';b.dataset.detailAdded=kind;b.dataset.id=anchor.dataset.id;b.textContent='Dettagli';b.onclick=e=>{e.preventDefault();e.stopPropagation();open(kind,anchor.dataset.id);};cell.insertBefore(b,anchor);
      });
    });
  }

  function boot(){ensureUi();const root=document.getElementById('adminShell')||document.body;new MutationObserver(enhance).observe(root,{childList:true,subtree:true});enhance();document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}
  window.SAFETY_ADMIN_DETAILS_V21={open,close,enhance,version:'21.1'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
