/* SafetyTraining v22.001 — Safety Scenario + Practice Lab inside course view. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const arr=v=>Array.isArray(v)?v:[];
  let seq=0;

  function courseKey(){
    const p=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    return p[0]==='course'&&p[1]?decodeURIComponent(p[1]):null;
  }
  const list=(items,cls='')=>arr(items).length?`<ul class="${cls}">${arr(items).map(x=>`<li>${esc(typeof x==='string'?x:(x?.label||x?.title||JSON.stringify(x)))}</li>`).join('')}</ul>`:'<p class="v22-muted">Nessun elemento configurato.</p>';
  const links=items=>arr(items).map((m,i)=>m?.url?`<a class="v22-media-link" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer"><span>${m.kind==='video'?'▶':'↗'}</span><span><strong>${esc(m.title||`Risorsa ${i+1}`)}</strong><small>${m.kind==='video'?'Video dimostrativo / approfondimento':'Fonte o materiale di approfondimento'}</small></span></a>`:'').join('');
  const visual=items=>arr(items).find(x=>x?.asset)?.asset||'';

  async function loadExperience(key){
    const c=db(); if(!c)return null;
    const {data:course,error}=await c.from('courses').select('id,stable_key,title,metadata').eq('stable_key',key).eq('active',true).maybeSingle();
    if(error||!course||course.metadata?.freeze_scope)return null;
    const [{data:sl,error:se},{data:pl,error:pe}]=await Promise.all([
      c.from('course_scenarios_v22').select('scenario_id,position,required').eq('course_id',course.id).order('position'),
      c.from('course_practice_labs_v22').select('practice_lab_id,position,required').eq('course_id',course.id).order('position')
    ]);
    if(se||pe)throw se||pe;
    const sids=(sl||[]).map(x=>x.scenario_id), pids=(pl||[]).map(x=>x.practice_lab_id);
    const [{data:scenarios,error:sce},{data:labs,error:ple}]=await Promise.all([
      sids.length?c.from('training_scenarios_v22').select('*').in('id',sids).eq('active',true):Promise.resolve({data:[],error:null}),
      pids.length?c.from('practice_labs_v22').select('*').in('id',pids).eq('active',true):Promise.resolve({data:[],error:null})
    ]);
    if(sce||ple)throw sce||ple;
    const sm=new Map((scenarios||[]).map(x=>[x.id,x])), pm=new Map((labs||[]).map(x=>[x.id,x]));
    return {course,scenarios:(sl||[]).map(x=>sm.get(x.scenario_id)).filter(Boolean),labs:(pl||[]).map(x=>pm.get(x.practice_lab_id)).filter(Boolean)};
  }

  function scenarioCard(s){
    const img=visual(s.visuals), questions=arr(s.debrief?.questions), decisions=arr(s.decisions);
    return `<article class="v22-card v22-scenario"><div class="v22-card-head"><span class="v22-kicker">SAFETY SCENARIO</span><span class="v22-pill">${esc(s.scenario_type)}</span></div><h3>${esc(s.title)}</h3>${s.intro?`<p>${esc(s.intro)}</p>`:''}<div class="v22-split">${img?`<div class="v22-visual"><img src="assets/${esc(img)}" alt="Schema per ${esc(s.title)}"></div>`:''}<div><h4>La sfida</h4><p class="v22-prompt">${esc(s.prompt)}</p>${decisions.length?`<h4>Decisioni da discutere</h4>${list(decisions.map(x=>`${x.choice}${x.effect?` → ${x.effect}`:''}`))}`:''}</div></div>${questions.length?`<details><summary>Debriefing guidato</summary>${list(questions)}</details>`:''}${links(s.media)}${links(s.sources)}</article>`;
  }

  function labCard(l){
    const physical=!!l.requires_physical_validation;
    return `<article class="v22-card v22-lab"><div class="v22-card-head"><span class="v22-kicker">PRACTICE LAB</span><span class="v22-pill">${esc(l.lab_type)}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.objective)}</p>${l.briefing?`<div class="v22-brief"><strong>Briefing</strong>${esc(l.briefing)}</div>`:''}${physical?'<div class="v22-physical"><strong>Pratica fisica richiesta</strong><span>Video, immagini e simulazioni preparano la prova. La capacità manuale viene osservata e validata dal docente/istruttore: questo modulo digitale non la marca automaticamente come completata.</span></div>':''}<div class="v22-lab-grid"><section><h4>Sequenza operativa</h4>${list(l.steps,'v22-steps')}</section><section><h4>Checklist osservabile</h4>${list(l.checklist,'v22-check')}</section><section><h4>Errori critici</h4>${list(l.critical_errors,'v22-errors')}</section><section><h4>Condizioni di stop</h4>${list(l.stop_conditions,'v22-stop')}</section></div><div class="v22-media">${links(l.media)}${links(l.sources)}</div></article>`;
  }

  async function inject(expected){
    const my=++seq, key=courseKey();
    document.getElementById('v22CourseExperience')?.remove();
    if(!key||expected&&expected!==key)return;
    try{
      const data=await loadExperience(key); if(my!==seq||!data||courseKey()!==key)return;
      const app=document.getElementById('app'); if(!app)return;
      const block=document.createElement('section'); block.id='v22CourseExperience'; block.className='v22-experience';
      block.innerHTML=`<div class="v22-heading"><div><span class="v22-kicker">STANDARD DIDATTICO v22</span><h2>Allenati prima di dover decidere davvero</h2><p>Scenario, dimostrazione e pratica trasformano il contenuto del corso in comportamenti osservabili.</p></div><span class="v22-version">v22.001</span></div>${data.scenarios.map(scenarioCard).join('')}${data.labs.map(labCard).join('')}`;
      app.appendChild(block);
    }catch(err){console.warn('[SafetyTraining v22 experience]',err?.message||err);}
  }

  function schedule(){const key=courseKey();[0,100,300,750,1500].forEach(ms=>setTimeout(()=>inject(key),ms));}
  window.addEventListener('hashchange',schedule);
  document.addEventListener('safety:course-rendered',schedule);
  window.SAFETY_COURSE_EXPERIENCE_V22={schedule,version:'22.001'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
