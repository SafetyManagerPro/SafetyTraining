/* SafetyTraining v22.001 — didactic quality dashboard for non-frozen courses. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const root=()=>document.getElementById('adminShell');
  const host=()=>document.getElementById('adminContent');
  const title=()=>document.getElementById('adminTitle');
  const subtitle=()=>document.getElementById('adminSubtitle');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const labels={gold:'Gold',silver:'Silver',bronze:'Bronze',incomplete:'Da completare'};
  const gaps={missing_learning_units:'Learning Unit mancanti',missing_operational_content:'Contenuto operativo insufficiente',missing_scenario_content:'Casi/scenari nelle LU insufficienti',missing_authored_visuals:'Visual authored da integrare',missing_safety_scenario:'Safety Scenario mancante',missing_practice_lab:'Practice Lab mancante',missing_media_or_demo:'Video/dimostrazione mancante',missing_sources:'Fonti da integrare',missing_verification_path:'Percorso di verifica mancante',test_bank_incomplete:'Test/banca domande incompleta'};

  function ensureNav(){
    const shell=root(); if(!shell||shell.querySelector('[data-quality-v22]'))return;
    const nav=shell.querySelector('.admin-nav nav'); if(!nav)return;
    const b=document.createElement('button'); b.type='button'; b.dataset.qualityV22='1';
    b.innerHTML='<span>◆</span> Qualità didattica v22';
    const anchor=nav.querySelector('[data-readiness-admin]')||nav.querySelector('[data-blueprint-admin]');
    anchor?.after(b); if(!anchor)nav.appendChild(b);
    b.addEventListener('click',render);
  }

  function gradeBadge(grade){const cls=grade==='gold'?'admin-ok':grade==='incomplete'?'admin-error':'admin-warn';return `<span class="${cls}">${esc(labels[grade]||grade)}</span>`;}
  function gapHtml(items){return (items||[]).length?(items||[]).map(x=>`<span class="admin-note">• ${esc(gaps[x]||x)}</span>`).join('<br>'):'<span class="admin-ok">Nessun gap rilevato</span>';}
  function physical(v){return v?'<span class="admin-warn">Sì · validazione docente</span>':'No / digitale';}

  async function render(){
    if(!db()||!host())return;
    root()?.querySelectorAll('.admin-nav button').forEach(x=>x.classList.remove('active'));
    root()?.querySelector('[data-quality-v22]')?.classList.add('active');
    if(title())title().textContent='Qualità didattica v22';
    if(subtitle())subtitle().textContent='Qualità reale del corso: contenuti, pratica, scenari, media, fonti e verifica';
    host().innerHTML='<div class="admin-loading">Calcolo Quality Score v22…</div>';
    const {data,error}=await db().rpc('get_course_quality_v22');
    if(error){host().innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;return;}
    const summary=data?.summary||{}, courses=Array.isArray(data?.courses)?data.courses:[];
    const stat=(v,l)=>`<article class="admin-stat"><strong>${esc(v||0)}</strong><span>${esc(l)}</span></article>`;
    host().innerHTML=`
      <section class="admin-card admin-guide-card"><h2>Standard v22</h2><p class="admin-note">Lo stato <b>Pubblicato</b> non equivale più a “corso finito”. Il Quality Score misura se il percorso contiene anche pratica, scenari, supporti visuali, media/fonti e una verifica coerente. I corsi congelati sono esclusi intenzionalmente.</p><div class="admin-stats">${stat(summary.total,'Corsi valutati')}${stat(summary.gold,'Gold')}${stat(summary.silver,'Silver')}${stat(summary.bronze,'Bronze')}${stat(summary.incomplete,'Da completare')}${stat(summary.frozen_excluded,'Frozen esclusi')}</div><div class="admin-note-block"><strong>Obiettivo:</strong> portare tutti i corsi non frozen a <b>Gold</b>. Per le competenze manuali, video e simulazioni preparano la pratica ma non sostituiscono la validazione fisica del docente.</div></section>
      <section class="admin-card"><div class="admin-card-head"><div><h2>Quality backlog</h2><p>Ordine crescente di punteggio: in alto ciò che richiede più lavoro.</p></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Corso</th><th>Famiglia</th><th>Punteggio</th><th>Livello</th><th>Pratica fisica</th><th>Esperienza v22</th><th>Contenuti</th><th>Gap</th></tr></thead><tbody>${courses.map(c=>`<tr><td><strong>${esc(c.title)}</strong><div class="admin-note">${esc(c.stable_key)} · v${esc(c.version_number||'—')} · ${esc(c.version_status||'—')}</div></td><td>${esc(c.family||'—')}</td><td><strong>${esc(c.quality_score)}/100</strong></td><td>${gradeBadge(c.quality_grade)}</td><td>${physical(c.physical_validation_present)}</td><td>${esc(c.scenario_count||0)} scenario · ${esc(c.practice_lab_count||0)} lab · ${esc(c.media_count||0)} media</td><td>${esc(c.unit_count||0)} LU · ${esc(c.operational_units||0)} operative · ${esc(c.scenario_units||0)} con caso · ${esc(c.explicit_visual_units||0)} visual authored</td><td>${gapHtml(c.quality_gaps)}</td></tr>`).join('')}</tbody></table></div></section>`;
    window.SAFETY_ADMIN_LIST_TOOLS_V21?.schedule?.();
  }

  async function boot(){
    for(let i=0;i<40&&!root();i++)await new Promise(r=>setTimeout(r,150));
    ensureNav();
    document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,60));
  }
  window.SAFETY_COURSE_QUALITY_V22={render,ensureNav,version:'22.001'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
