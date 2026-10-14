/* SafetyTraining — admin roadmap for SafetyManager course blueprints and reusable content profiles. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const hours=min=>`${Math.round(Number(min||0)/60*10)/10} h`;
  const statusLabel={planned:'Da sviluppare',partial:'Parziale',ready:'Pronto',hybrid_partial:'Ibrido parziale',unavailable:'Non erogabile',draft:'Bozza',retired:'Ritirato'};
  const ruleTypeLabel={audience:'Destinatario',duration:'Durata',sector:'Settore',risk:'Rischio',practical:'Pratica',eligibility:'Requisito',composition:'Composizione',legacy_alias:'Compatibilità legacy'};

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

  function jsonSummary(value){
    const obj=value&&typeof value==='object'?value:{};
    return Object.entries(obj).map(([k,v])=>`${esc(k)}: ${esc(Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):v)}`).join('<br>')||'—';
  }

  async function render(){
    if(!db()||!host()) return;
    root()?.querySelectorAll('.admin-nav button').forEach(x=>x.classList.remove('active'));
    root()?.querySelector('[data-blueprint-admin]')?.classList.add('active');
    if(title()) title().textContent='Blueprint corsi e Master Registry';
    host().innerHTML='<div class="admin-loading">Caricamento Master Registry…</div>';

    const [bpRes,mapRes,catRes,secRes,profileRes,variantRes,ruleRes]=await Promise.all([
      db().from('training_blueprints').select('stable_key,title,family,strategy,status,description,metadata').order('family').order('title'),
      db().from('training_blueprint_course_types').select('external_course_code,blueprint_key,variant_key,development_status,metadata').eq('source_system','safetymanager'),
      db().from('integration_course_catalog').select('external_course_code,title,nominal_minutes,delivery_status,metadata').eq('source_system','safetymanager'),
      db().from('training_blueprint_sections').select('blueprint_key,section_key,title,position,section_type,nominal_minutes,source_course_stable_key,source_profile_key,practical,metadata').order('position'),
      db().from('learning_content_profiles').select('stable_key,title,profile_kind,status,metadata,source_course_id').order('profile_kind').order('title'),
      db().from('training_blueprint_variants').select('blueprint_key,variant_key,title,nominal_minutes,status,metadata').order('blueprint_key').order('variant_key'),
      db().from('training_blueprint_rules').select('blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes,active').eq('active',true).order('blueprint_key').order('priority')
    ]);
    const err=bpRes.error||mapRes.error||catRes.error||secRes.error||profileRes.error||variantRes.error||ruleRes.error;
    if(err){host().innerHTML=`<div class="admin-error">${esc(err.message)}</div>`;return;}

    const blueprints=bpRes.data||[], mappings=mapRes.data||[], catalog=catRes.data||[], sections=secRes.data||[], profiles=profileRes.data||[], variants=variantRes.data||[], rules=ruleRes.data||[];
    const bpMap=new Map(blueprints.map(x=>[x.stable_key,x]));
    const catMap=new Map(catalog.map(x=>[x.external_course_code,x]));
    const variantMap=new Map(variants.map(x=>[`${x.blueprint_key}::${x.variant_key}`,x]));
    const families=[...new Set(blueprints.map(x=>x.family))];
    const totals={ready:0,partial:0,planned:0};
    mappings.forEach(m=>{ if(m.development_status==='ready') totals.ready++; else if(['partial','hybrid_partial'].includes(m.development_status)) totals.partial++; else totals.planned++; });

    const familyHtml=families.map(family=>{
      const famBps=blueprints.filter(b=>b.family===family);
      const famMaps=mappings.filter(m=>famBps.some(b=>b.stable_key===m.blueprint_key));
      return `<section class="admin-card"><h2>${esc(family)}</h2><p class="admin-note">${famMaps.length} tipologie SafetyManager · ${famBps.length} blueprint · ${variants.filter(v=>famBps.some(b=>b.stable_key===v.blueprint_key)).length} varianti</p>
        <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Corso SafetyManager</th><th>Durata</th><th>Blueprint</th><th>Variante</th><th>Sviluppo</th><th>Struttura / regole</th></tr></thead><tbody>
        ${famMaps.sort((a,b)=>String(catMap.get(a.external_course_code)?.title||'').localeCompare(String(catMap.get(b.external_course_code)?.title||''),'it')).map(m=>{
          const c=catMap.get(m.external_course_code)||{}; const bp=bpMap.get(m.blueprint_key)||{};
          const ss=sections.filter(s=>s.blueprint_key===m.blueprint_key);
          const rr=rules.filter(r=>r.blueprint_key===m.blueprint_key);
          const vv=m.variant_key?variantMap.get(`${m.blueprint_key}::${m.variant_key}`):null;
          const structure=ss.map(s=>`${s.practical?'🛠️ ':''}${esc(s.title)}${s.nominal_minutes?` (${hours(s.nominal_minutes)})`:''}`).join('<br>');
          const ruleNote=rr.length?`<div class="admin-note" style="margin-top:6px">⚙️ ${rr.length} ${rr.length===1?'regola':'regole'} Master Registry</div>`:'';
          return `<tr><td><strong>${esc(c.title||m.external_course_code)}</strong><div class="admin-note">${esc(m.external_course_code)}</div></td><td>${c.nominal_minutes?hours(c.nominal_minutes):'—'}</td><td><strong>${esc(bp.title||m.blueprint_key)}</strong><div class="admin-note">${esc(bp.strategy||'')}</div></td><td>${m.variant_key?`<strong>${esc(vv?.title||m.variant_key)}</strong><div class="admin-note">${esc(m.variant_key)}</div>`:'—'}</td><td>${badge(m.development_status)}</td><td>${structure||'<span class="admin-note">Da strutturare</span>'}${ruleNote}</td></tr>`;
        }).join('')}
        </tbody></table></div></section>`;
    }).join('');

    const ruleHtml=rules.map(r=>{
      const bp=bpMap.get(r.blueprint_key)||{};
      return `<tr><td><strong>${esc(bp.title||r.blueprint_key)}</strong><div class="admin-note">${esc(r.rule_key)}</div></td><td>${esc(ruleTypeLabel[r.rule_type]||r.rule_type)}</td><td>${esc(r.variant_key||'Tutte')}</td><td>${jsonSummary(r.conditions)}</td><td>${jsonSummary(r.outcome)}</td><td>${esc(r.notes||r.source||'—')}</td></tr>`;
    }).join('');

    const profileHtml=profiles.map(p=>`<tr><td><strong>${esc(p.title)}</strong><div class="admin-note">${esc(p.stable_key)}</div></td><td>${p.profile_kind==='art37_job_profile'?'Profilo mansione Art. 37':p.profile_kind==='core_module'?'Nucleo comune':'Libreria condivisa'}</td><td>${esc(p.status)}</td><td>${p.profile_kind==='art37_job_profile'?'Riutilizzabile per comporre la formazione specifica: non è più una tipologia corso autonoma nel nuovo modello.':'Riutilizzabile trasversalmente nei blueprint.'}</td></tr>`).join('');

    host().innerHTML=`
      <section class="admin-card"><h2>Architettura corsi SafetyTraining</h2><p class="admin-note">SafetyManager resta il catalogo amministrativo sorgente. SafetyTraining gestisce contenuti, blueprint, varianti e regole riutilizzabili. Gli ID storici restano compatibili; le differenze di ruolo, settore, rischio, durata e componente pratica vengono risolte dal Master Registry.</p>
      <div class="admin-stats"><article class="admin-stat"><strong>${mappings.length}</strong><span>Tipologie SafetyManager</span></article><article class="admin-stat"><strong>${blueprints.length}</strong><span>Blueprint</span></article><article class="admin-stat"><strong>${variants.length}</strong><span>Varianti</span></article><article class="admin-stat"><strong>${rules.length}</strong><span>Regole</span></article><article class="admin-stat"><strong>${totals.ready}</strong><span>Pronti</span></article><article class="admin-stat"><strong>${totals.partial}</strong><span>Parziali</span></article><article class="admin-stat"><strong>${totals.planned}</strong><span>Da sviluppare</span></article></div></section>
      <section class="admin-card"><h2>Priorità di sviluppo</h2><p class="admin-note"><strong>1.</strong> Lavoratori Art. 37 e aggiornamenti · <strong>2.</strong> Datore di lavoro + aggiornamento + modulo cantieri · <strong>3.</strong> DL SPP/RSPP Datore di lavoro (comune + settori + aggiornamento) · <strong>4.</strong> Preposto e Dirigente · <strong>5.</strong> RLS e aggiornamenti · <strong>6.</strong> Emergenze e rischi specialistici · <strong>7.</strong> Attrezzature.</p></section>
      <section class="admin-card"><h2>Regole Master Registry</h2><p class="admin-note">Regole esplicite e verificabili per risolvere composizione, destinatario, durata, rischi e pratica senza duplicare i corsi.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Blueprint / regola</th><th>Tipo</th><th>Variante</th><th>Condizioni</th><th>Esito</th><th>Nota</th></tr></thead><tbody>${ruleHtml||'<tr><td colspan="6">Nessuna regola configurata.</td></tr>'}</tbody></table></div></section>
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
