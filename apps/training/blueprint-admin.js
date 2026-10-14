/* SafetyTraining — admin roadmap for SafetyManager course blueprints and reusable content profiles. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const hours=min=>`${Math.round(Number(min||0)/60*10)/10} h`;
  const statusLabel={planned:'Da sviluppare',partial:'Parziale',ready:'Pronto',hybrid_partial:'Ibrido parziale',unavailable:'Non erogabile',draft:'Bozza',retired:'Ritirato'};

  function root(){return document.getElementById('adminShell');}
  function host(){return document.getElementById('adminContent');}
  function title(){return document.getElementById('adminTitle');}

  function ensureNav(){
    const shell=root(); if(!shell||shell.querySelector('[data-blueprint-admin]')) return;
    const nav=shell.querySelector('.admin-nav nav'); if(!nav) return;
    const b=document.createElement('button'); b.type='button'; b.dataset.blueprintAdmin='1';
    b.innerHTML='<span>🧩</span> Blueprint corsi';
    const catalog=nav.querySelector('[data-sm-course-catalog]');
    catalog?.after(b); if(!catalog) nav.appendChild(b);
    b.onclick=render;
  }

  function badge(status){
    const cls=status==='ready'?'admin-ok':status==='partial'||status==='hybrid_partial'?'admin-warn':'admin-note';
    return `<span class="${cls}">${esc(statusLabel[status]||status||'—')}</span>`;
  }

  async function render(){
    if(!db()||!host()) return;
    root()?.querySelectorAll('.admin-nav button').forEach(x=>x.classList.remove('active'));
    root()?.querySelector('[data-blueprint-admin]')?.classList.add('active');
    if(title()) title().textContent='Blueprint corsi e libreria contenuti';
    host().innerHTML='<div class="admin-loading">Caricamento blueprint…</div>';

    const [bpRes,mapRes,catRes,secRes,profileRes]=await Promise.all([
      db().from('training_blueprints').select('stable_key,title,family,strategy,status,description,metadata').order('family').order('title'),
      db().from('training_blueprint_course_types').select('external_course_code,blueprint_key,variant_key,development_status,metadata').eq('source_system','safetymanager'),
      db().from('integration_course_catalog').select('external_course_code,title,nominal_minutes,delivery_status,metadata').eq('source_system','safetymanager'),
      db().from('training_blueprint_sections').select('blueprint_key,section_key,title,position,section_type,nominal_minutes,source_course_stable_key,source_profile_key,practical,metadata').order('position'),
      db().from('learning_content_profiles').select('stable_key,title,profile_kind,status,metadata,source_course_id').order('profile_kind').order('title')
    ]);
    const err=bpRes.error||mapRes.error||catRes.error||secRes.error||profileRes.error;
    if(err){host().innerHTML=`<div class="admin-error">${esc(err.message)}</div>`;return;}

    const blueprints=bpRes.data||[], mappings=mapRes.data||[], catalog=catRes.data||[], sections=secRes.data||[], profiles=profileRes.data||[];
    const bpMap=new Map(blueprints.map(x=>[x.stable_key,x]));
    const catMap=new Map(catalog.map(x=>[x.external_course_code,x]));
    const families=[...new Set(blueprints.map(x=>x.family))];
    const totals={ready:0,partial:0,planned:0};
    mappings.forEach(m=>{ if(m.development_status==='ready') totals.ready++; else if(['partial','hybrid_partial'].includes(m.development_status)) totals.partial++; else totals.planned++; });

    const familyHtml=families.map(family=>{
      const famBps=blueprints.filter(b=>b.family===family);
      const famMaps=mappings.filter(m=>famBps.some(b=>b.stable_key===m.blueprint_key));
      return `<section class="admin-card"><h2>${esc(family)}</h2><p class="admin-note">${famMaps.length} tipologie SafetyManager · ${famBps.length} blueprint</p>
        <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Corso SafetyManager</th><th>Durata</th><th>Blueprint</th><th>Variante</th><th>Sviluppo</th><th>Struttura</th></tr></thead><tbody>
        ${famMaps.sort((a,b)=>String(catMap.get(a.external_course_code)?.title||'').localeCompare(String(catMap.get(b.external_course_code)?.title||''),'it')).map(m=>{
          const c=catMap.get(m.external_course_code)||{}; const bp=bpMap.get(m.blueprint_key)||{};
          const ss=sections.filter(s=>s.blueprint_key===m.blueprint_key);
          const structure=ss.map(s=>`${s.practical?'🛠️ ':''}${esc(s.title)}${s.nominal_minutes?` (${hours(s.nominal_minutes)})`:''}`).join('<br>');
          return `<tr><td><strong>${esc(c.title||m.external_course_code)}</strong><div class="admin-note">${esc(m.external_course_code)}</div></td><td>${c.nominal_minutes?hours(c.nominal_minutes):'—'}</td><td><strong>${esc(bp.title||m.blueprint_key)}</strong><div class="admin-note">${esc(bp.strategy||'')}</div></td><td>${esc(m.variant_key||'—')}</td><td>${badge(m.development_status)}</td><td>${structure||'<span class="admin-note">Da strutturare</span>'}</td></tr>`;
        }).join('')}
        </tbody></table></div></section>`;
    }).join('');

    const profileHtml=profiles.map(p=>`<tr><td><strong>${esc(p.title)}</strong><div class="admin-note">${esc(p.stable_key)}</div></td><td>${p.profile_kind==='art37_job_profile'?'Profilo mansione Art. 37':p.profile_kind==='core_module'?'Nucleo comune':'Libreria condivisa'}</td><td>${esc(p.status)}</td><td>${p.profile_kind==='art37_job_profile'?'Riutilizzabile per comporre la formazione specifica: non è più una tipologia corso autonoma nel nuovo modello.':'Riutilizzabile trasversalmente nei blueprint.'}</td></tr>`).join('');

    host().innerHTML=`
      <section class="admin-card"><h2>Architettura corsi SafetyTraining</h2><p class="admin-note">SafetyManager resta il catalogo amministrativo master. SafetyTraining sviluppa contenuti e blueprint riutilizzabili. I vecchi corsi per mansione vengono conservati come profili di contenuto Art. 37, non eliminati.</p>
      <div class="admin-stats"><article class="admin-stat"><strong>${mappings.length}</strong><span>Tipologie SafetyManager coperte</span></article><article class="admin-stat"><strong>${blueprints.length}</strong><span>Blueprint</span></article><article class="admin-stat"><strong>${totals.ready}</strong><span>Pronti</span></article><article class="admin-stat"><strong>${totals.partial}</strong><span>Parziali</span></article><article class="admin-stat"><strong>${totals.planned}</strong><span>Da sviluppare</span></article></div></section>
      <section class="admin-card"><h2>Priorità di sviluppo</h2><p class="admin-note"><strong>1.</strong> Lavoratori Art. 37 e aggiornamenti · <strong>2.</strong> Datore di lavoro + aggiornamento + modulo cantieri · <strong>3.</strong> DL SPP/RSPP Datore di lavoro (comune + settori + aggiornamento) · <strong>4.</strong> Preposto e Dirigente · <strong>5.</strong> RLS e aggiornamenti · <strong>6.</strong> Emergenze e rischi specialistici · <strong>7.</strong> Attrezzature.</p></section>
      ${familyHtml}
      <section class="admin-card"><h2>Libreria contenuti recuperata dai vecchi corsi</h2><p class="admin-note">Back Office, Front Office, Operatori Ecologici, Polizia Locale e Verde Pubblico restano disponibili come profili didattici riutilizzabili.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Profilo</th><th>Tipo</th><th>Stato</th><th>Uso</th></tr></thead><tbody>${profileHtml}</tbody></table></div></section>`;
  }

  async function boot(){
    for(let i=0;i<40&&!root();i++) await new Promise(r=>setTimeout(r,200));
    ensureNav();
    if(root()) new MutationObserver(ensureNav).observe(root(),{childList:true,subtree:true});
  }
  window.SAFETY_BLUEPRINT_ADMIN={render};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
