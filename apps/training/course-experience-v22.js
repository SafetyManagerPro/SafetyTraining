/* SafetyTraining v22.007 — specific Safety Scenario + Practice Lab inside course view. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const userId=()=>window.SAFETY_CLOUD?.state?.user?.id||null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const arr=v=>Array.isArray(v)?v:[];
  let seq=0,timer=null;const cache=new Map();

  function courseKey(){
    const p=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    return p[0]==='course'&&p[1]?decodeURIComponent(p[1]):null;
  }
  const list=(items,cls='')=>arr(items).length?`<ul class="${cls}">${arr(items).map(x=>`<li>${esc(typeof x==='string'?x:(x?.label||x?.title||JSON.stringify(x)))}</li>`).join('')}</ul>`:'<p class="v22-muted">Nessun elemento configurato.</p>';
  const links=items=>arr(items).map((m,i)=>m?.url?`<a class="v22-media-link" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer"><span>${['video','video_hub'].includes(m.kind)?'▶':'↗'}</span><span><strong>${esc(m.title||`Risorsa ${i+1}`)}</strong><small>${m.kind==='video'?'Video dimostrativo':m.kind==='video_hub'?'Raccolta video / approfondimenti':'Fonte o materiale tecnico'}</small></span></a>`:'').join('');
  const visuals=items=>arr(items).filter(x=>x?.asset).map(x=>x.asset);

  async function loadExperience(key){
    const c=db(),account=userId(),cacheKey=`${account||'anon'}:${key}`;
    if(!c)return null;if(cache.has(cacheKey))return cache.get(cacheKey);
    const {data:course,error}=await c.from('courses').select('id,stable_key,title,metadata').eq('stable_key',key).eq('active',true).maybeSingle();
    if(error||!course||course.metadata?.freeze_scope)return null;
    const [{data:sl,error:se},{data:pl,error:pe}]=await Promise.all([
      c.from('course_scenarios_v22').select('scenario_id,position,required,context').eq('course_id',course.id).order('position'),
      c.from('course_practice_labs_v22').select('practice_lab_id,position,required,context').eq('course_id',course.id).order('position')
    ]);
    if(se||pe)throw se||pe;
    const sids=(sl||[]).map(x=>x.scenario_id), pids=(pl||[]).map(x=>x.practice_lab_id);
    const [{data:scenarios,error:sce},{data:labs,error:ple}]=await Promise.all([
      sids.length?c.from('training_scenarios_v22').select('*').in('id',sids).eq('active',true):Promise.resolve({data:[],error:null}),
      pids.length?c.from('practice_labs_v22').select('*').in('id',pids).eq('active',true):Promise.resolve({data:[],error:null})
    ]);
    if(sce||ple)throw sce||ple;
    const sm=new Map((scenarios||[]).map(x=>[x.id,x])), pm=new Map((labs||[]).map(x=>[x.id,x]));
    const result={
      course,
      scenarios:(sl||[]).map(link=>sm.has(link.scenario_id)?{...sm.get(link.scenario_id),__link:link}:null).filter(Boolean),
      labs:(pl||[]).map(link=>pm.has(link.practice_lab_id)?{...pm.get(link.practice_lab_id),__link:link}:null).filter(Boolean)
    };
    if(userId()!==account)return null;cache.set(cacheKey,result);return result;
  }

  function visualGallery(items,title){
    const imgs=visuals(items); if(!imgs.length)return '';
    return `<div class="v22-visual-gallery">${imgs.map((img,i)=>`<figure class="v22-visual"><img src="assets/${esc(img)}" alt="${esc(title)} — schema ${i+1}"><figcaption>Schema ${i+1}</figcaption></figure>`).join('')}</div>`;
  }

  function scenarioCard(s){
    const questions=arr(s.debrief?.questions), decisions=arr(s.decisions), specific=s.__link?.context?.specific===true||s.__link?.context?.specific==='true';
    return `<article class="v22-card v22-scenario ${specific?'v22-specific':''}"><div class="v22-card-head"><span class="v22-kicker">${specific?'SAFETY SCENARIO · SPECIFICO':'SAFETY SCENARIO · FONDAMENTI'}</span><span class="v22-pill">${esc(s.scenario_type)}</span></div><h3>${esc(s.title)}</h3>${s.intro?`<p>${esc(s.intro)}</p>`:''}<div class="v22-split"><div>${visualGallery(s.visuals,s.title)}</div><div><h4>La sfida</h4><p class="v22-prompt">${esc(s.prompt)}</p>${decisions.length?`<h4>Decisioni da discutere</h4>${list(decisions.map(x=>`${x.choice}${x.effect?` → ${x.effect}`:''}`))}<div class="v22-interactive"><h4>Prova a decidere</h4>${decisions.map((d,i)=>`<button type="button" class="v22-decision-btn" data-choice="${i}">${esc(d.choice||String(d))}</button>`).join('')}<div class="v22-feedback" role="status" aria-live="polite"></div></div>`:''}</div></div>${questions.length?`<details><summary>Debriefing guidato</summary>${list(questions)}</details>`:''}<div class="v22-media">${links(s.media)}${links(s.sources)}</div></article>`;
  }

  function labCard(l){
    const physical=!!l.requires_physical_validation, specific=l.__link?.context?.specific===true||l.__link?.context?.specific==='true';
    return `<article class="v22-card v22-lab ${specific?'v22-specific':''}"><div class="v22-card-head"><span class="v22-kicker">${specific?'PRACTICE LAB · SPECIFICO':'PRACTICE LAB · FONDAMENTI'}</span><span class="v22-pill">${esc(l.lab_type)}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.objective)}</p>${l.briefing?`<div class="v22-brief"><strong>Briefing</strong><span>${esc(l.briefing)}</span></div>`:''}${physical?'<div class="v22-physical"><strong>Pratica fisica richiesta</strong><span>Video, immagini e simulazioni preparano la prova. La capacità manuale viene osservata e validata dal docente/istruttore: questo modulo digitale non la marca automaticamente come completata.</span></div>':''}<div class="v22-lab-grid"><section><h4>Sequenza operativa</h4>${list(l.steps,'v22-steps')}</section><section><h4>Checklist osservabile</h4>${list(l.checklist,'v22-check')}</section><section><h4>Errori critici</h4>${list(l.critical_errors,'v22-errors')}</section><section><h4>Condizioni di stop</h4>${list(l.stop_conditions,'v22-stop')}</section></div><div class="v22-media">${links(l.media)}${links(l.sources)}</div></article>`;
  }

  async function inject(expected){
    const my=++seq, key=courseKey();
    document.getElementById('v22CourseExperience')?.remove();
    if(!key||expected&&expected!==key)return;
    try{
      const data=await loadExperience(key); if(my!==seq||!data||courseKey()!==key)return;
      const app=document.getElementById('app'); if(!app)return;
      const specificScenarios=data.scenarios.filter(x=>x.__link?.context?.specific===true||x.__link?.context?.specific==='true').length;
      const specificLabs=data.labs.filter(x=>x.__link?.context?.specific===true||x.__link?.context?.specific==='true').length;
      const block=document.createElement('section'); block.id='v22CourseExperience'; block.className='v22-experience';
      block.innerHTML=`<div class="v22-heading"><div><span class="v22-kicker">STANDARD DIDATTICO v22.007</span><h2>Allenati prima di dover decidere davvero</h2><p>Ogni corso non congelato combina fondamenti riusabili con un’esperienza specifica della mansione, ruolo, settore o attrezzatura.</p><div class="v22-coverage"><span>${data.scenarios.length} scenari</span><span>${specificScenarios} specifici</span><span>${data.labs.length} laboratori</span><span>${specificLabs} specifici</span></div></div><span class="v22-version">v22.007</span></div>${data.scenarios.map(scenarioCard).join('')}${data.labs.map(labCard).join('')}`;
      app.appendChild(block);
       block.querySelectorAll('.v22-scenario').forEach((card,i)=>{const decisions=arr(data.scenarios[i]?.decisions);card.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{const d=decisions[Number(btn.dataset.choice)];if(!d)return;card.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));card.querySelector('.v22-feedback').textContent=d.effect||'Confronta con il docente la conseguenza della scelta.';});});
    }catch(err){console.warn('[SafetyTraining v22 experience]',err?.message||err);if(my!==seq||courseKey()!==key)return;const app=document.getElementById('app');if(!app)return;const block=document.createElement('section');block.id='v22CourseExperience';block.innerHTML='<div class="v22-load-error" role="alert">Scenari non disponibili. <button type="button">Riprova</button></div>';block.querySelector('button').onclick=()=>{cache.delete(key);inject(key);};app.appendChild(block);}
  }

  function schedule(){const key=courseKey();clearTimeout(timer);timer=setTimeout(()=>{if(!key){seq++;document.getElementById('v22CourseExperience')?.remove();return;}if(document.getElementById('app')?.querySelector('.agenda-hero'))inject(key);},120);}
  window.addEventListener('hashchange',schedule);
  document.addEventListener('safety:course-rendered',schedule);
  document.addEventListener('safety:auth-changed',()=>{seq++;cache.clear();document.getElementById('v22CourseExperience')?.remove();schedule();});
  window.SAFETY_COURSE_EXPERIENCE_V22={schedule,version:'22.007'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
