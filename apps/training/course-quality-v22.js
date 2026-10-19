/* SafetyTraining v22.007 — didactic quality dashboard for non-frozen courses. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const root=()=>document.getElementById('adminShell');
  const host=()=>document.getElementById('adminContent');
  const title=()=>document.getElementById('adminTitle');
  const subtitle=()=>document.getElementById('adminSubtitle');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const labels={gold:'Gold',silver:'Silver',bronze:'Bronze',incomplete:'Da completare'};
  const gaps={missing_learning_units:'Learning Unit mancanti',missing_operational_content:'Contenuto operativo insufficiente',missing_scenario_content:'Casi/scenari insufficienti',missing_visual_support:'Supporto visuale da integrare',missing_safety_scenario:'Safety Scenario mancante',missing_specific_scenario:'Scenario specifico del corso mancante',missing_practice_lab:'Practice Lab mancante',missing_specific_practice_lab:'Practice Lab specifico del corso mancante',missing_media_or_demo:'Video/dimostrazione mancante',missing_sources:'Fonti da integrare',missing_verification_path:'Percorso di verifica mancante',test_bank_incomplete:'Test/banca domande incompleta'};

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
  const prioritySteps=Object.freeze([
    ['missing_learning_units',9,'Completare moduli e Learning Unit con obiettivi, tempi e sequenza didattica.'],
    ['missing_verification_path',9,'Definire verifica coerente con il corso: test o colloquio, modalità e soglia.'],
    ['test_bank_incomplete',9,'Completare il numero e la qualità delle domande necessarie al test scelto.'],
    ['missing_operational_content',8,'Ampliare cosa fare, come farlo e come reagire ai rischi della mansione.'],
    ['missing_specific_practice_lab',8,'Creare una prova pratica specifica del corso con osservazioni e criteri del docente.'],
    ['missing_specific_scenario',8,'Inserire uno scenario decisionale riferito al settore e al ruolo effettivo.'],
    ['missing_practice_lab',7,'Aggiungere laboratorio operativo guidato e relativa checklist.'],
    ['missing_safety_scenario',7,'Aggiungere scenario di sicurezza con decisioni ed errori da correggere.'],
    ['missing_scenario_content',6,'Ampliare i casi pratici nelle Learning Unit e spiegarne le conseguenze.'],
    ['missing_sources',5,'Associare fonti verificabili, riferimenti normativi e data della revisione.'],
    ['missing_media_or_demo',4,'Aggiungere dimostrazione o media pertinenti e verificare le relative fonti.'],
    ['missing_visual_support',4,'Aggiungere schemi o immagini che chiariscano procedure e rischi.']
  ]);
  function nextStep(course){
    const flags=Array.isArray(course?.quality_gaps)?course.quality_gaps:[];
    const best=prioritySteps.find(([key])=>flags.includes(key));
    return best?{score:best[1],text:best[2],code:best[0]}:
      {score:0,text:flags.length?'Verificare i gap non classificati prima di dichiarare completo il corso.':
        'Nessuna lacuna rilevata dal controllo automatico: eseguire revisione esperta.',code:''};
  }
  function prioritize(courses){
    return [...courses].sort((a,b)=>nextStep(b).score-nextStep(a).score||
      Number(b.quality_gaps?.length||0)-Number(a.quality_gaps?.length||0)||
      String(a.title||'').localeCompare(String(b.title||''),'it'));
  }

  async function render(){
    if(!db()||!host())return;
    root()?.querySelectorAll('.admin-nav button').forEach(x=>x.classList.remove('active'));
    root()?.querySelector('[data-quality-v22]')?.classList.add('active');
    if(title())title().textContent='Qualità didattica v22';
    if(subtitle())subtitle().textContent='Qualità reale: contenuti, pratica specifica, scenari, visual, media, fonti e verifica';
    host().innerHTML='<div class="admin-loading">Calcolo Quality Score v22…</div>';
    const {data,error}=await db().rpc('get_course_quality_v22');
    if(error){host().innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;return;}
    const summary=data?.summary||{}, courses=prioritize(Array.isArray(data?.courses)?data.courses:[]);
    const stat=(v,l)=>`<article class="admin-stat"><strong>${esc(v||0)}</strong><span>${esc(l)}</span></article>`;
    host().innerHTML=`
      <section class="admin-card admin-guide-card"><h2>Standard v22.007</h2><p class="admin-note">Lo stato <b>Pubblicato</b> non equivale a “corso finito”. Gold richiede zero gap reali e, oltre alle Learning Unit, almeno uno <b>Safety Scenario specifico</b> e un <b>Practice Lab specifico</b> del corso/famiglia, con visual, media/fonti e verifica coerente.</p><div class="admin-stats">${stat(summary.total,'Corsi valutati')}${stat(summary.gold,'Gold')}${stat(summary.silver,'Silver')}${stat(summary.bronze,'Bronze')}${stat(summary.incomplete,'Da completare')}${stat(summary.specific_complete,'Specifici completi')}${stat(summary.with_gaps,'Con gap')}${stat(summary.frozen_excluded,'Frozen esclusi')}</div><div class="admin-note-block"><strong>Regola pratica:</strong> per competenze manuali il digitale prepara decisione e sequenza; l’abilità fisica resta osservata e validata dal docente/istruttore e non viene marcata automaticamente dal corso online.</div></section>
      <section class="admin-card"><div class="admin-card-head"><div><h2>Quality backlog prioritizzato</h2><p>Prima le carenze strutturali e di verifica, poi scenari, pratica e supporti. La priorità suggerisce l'ordine di lavoro, non autorizza la pubblicazione.</p></div></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Corso</th><th>Famiglia</th><th>Punteggio</th><th>Livello</th><th>Pratica fisica</th><th>Esperienza v22</th><th>Contenuti</th><th>Prossima azione didattica</th><th>Gap</th></tr></thead><tbody>${courses.map(c=>`<tr><td><strong>${esc(c.title)}</strong><div class="admin-note">${esc(c.stable_key)} · v${esc(c.version_number||'—')} · ${esc(c.version_status||'—')}</div></td><td>${esc(c.family||'—')}</td><td><strong>${esc(c.quality_score)}/100</strong></td><td>${gradeBadge(c.quality_grade)}</td><td>${physical(c.physical_validation_present)}</td><td>${esc(c.scenario_count||0)} scenario (${esc(c.specific_scenario_count||0)} specifici) · ${esc(c.practice_lab_count||0)} lab (${esc(c.specific_lab_count||0)} specifici) · ${esc(c.media_count||0)} media</td><td>${esc(c.unit_count||0)} LU · ${esc(c.operational_units||0)} operative · ${esc(c.scenario_units||0)} con caso · ${esc((c.explicit_visual_units||0)+(c.scenario_visual_count||0))} supporti visuali</td><td><strong>${esc(nextStep(c).text)}</strong>${window.SAFETY_DIDACTIC_REVIEW_V23?.renderFor?.(c.stable_key)||""}</td><td>${gapHtml(c.quality_gaps)}</td></tr>`).join('')}</tbody></table></div></section>`;
    window.SAFETY_ADMIN_LIST_TOOLS_V21?.schedule?.();
  }

  async function boot(){
    for(let i=0;i<40&&!root();i++)await new Promise(r=>setTimeout(r,150));
    ensureNav();
    document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,60));
  }
  window.SAFETY_COURSE_QUALITY_V22={render,ensureNav,nextStep,prioritize,version:'22.6'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
