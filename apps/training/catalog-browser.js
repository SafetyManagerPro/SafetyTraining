/* SafetyTraining — complete didactic catalog browser.
   Delivery rules are descriptive metadata only: they never hide teaching material.
   Database-backed courses are adapted into the same presentation model used by app.js. */
(() => {
  'use strict';
  const state={rows:[],loaded:false,loading:false,opening:new Set()};
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtMin=m=>{m=Number(m||0);const h=Math.floor(m/60),mm=m%60;return h?`${h} h${mm?` ${mm} min`:''}`:`${mm} min`;};
  const localCourse=key=>(window.SAFETY_DATA||[]).find(c=>c.id===key);
  const isLearner=()=>!!cloud()?.state?.learner;
  const isAuthenticated=()=>!!cloud()?.state?.user;

  async function waitCloud(){for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,150));return db();}
  async function load(force=false){
    if(state.loading||(!force&&state.loaded)) return state.rows;
    if(!isAuthenticated()||isLearner()) return [];
    const client=await waitCloud(); if(!client)return [];
    state.loading=true;
    try{
      const {data,error}=await client.rpc('training_catalog_summary');
      if(error)throw error;
      state.rows=Array.isArray(data)?data:[];state.loaded=true;
      syncSidebar();renderHome();
    }catch(e){console.warn('[Catalog browser]',e?.message||e);}
    finally{state.loading=false;}
    return state.rows;
  }

  function materialLabel(row){return Number(row.unit_count||0)>0?'Presentazione disponibile':'Materiale da completare';}
  function statusClass(row){return Number(row.unit_count||0)>0?'catalog-ready':'catalog-missing';}

  async function ensurePresentation(key){
    if(localCourse(key)) return localCourse(key);
    const adapter=window.SAFETY_DB_SLIDES;
    if(!adapter?.ensureCourse) throw new Error('Adapter presentazione non disponibile.');
    return adapter.ensureCourse(key,await waitCloud());
  }

  async function openCourse(row){
    if(!row)return;
    closeMobileMenu();
    if(Number(row.unit_count||0)<=0){location.hash=`library/${row.stable_key}`;return;}
    if(state.opening.has(row.stable_key))return;
    state.opening.add(row.stable_key);
    const root=document.getElementById('app');
    if(root)root.innerHTML=`<div class="catalog-loading">Preparazione presentazione “${esc(row.title)}”…</div>`;
    try{
      const course=await ensurePresentation(row.stable_key);
      if(!course)throw new Error('Corso non presentabile.');
      location.hash=`course/${row.stable_key}`;
    }catch(e){
      console.warn('[Catalog presentation]',row.stable_key,e?.message||e);
      location.hash=`library/${row.stable_key}`;
    }finally{state.opening.delete(row.stable_key);}
  }
  window.openCatalogCourse=key=>{const row=state.rows.find(x=>x.stable_key===key);if(row)return openCourse(row);};
  window.openCatalogLibrary=key=>{closeMobileMenu();location.hash=`library/${key}`;};

  function syncSidebar(){
    if(isLearner())return;
    const host=document.getElementById('sideCourses');if(!host)return;
    const existing=new Set([...host.querySelectorAll('[data-course-key]')].map(x=>x.dataset.courseKey));
    [...host.querySelectorAll('.navbtn')].forEach((b,i)=>{const c=(window.SAFETY_DATA||[])[i];if(c){b.dataset.courseKey=c.id;existing.add(c.id);}});
    state.rows.forEach(row=>{
      if(existing.has(row.stable_key))return;
      const b=document.createElement('button');b.className='navbtn catalog-navbtn';b.dataset.courseKey=row.stable_key;
      b.innerHTML=`<span>${Number(row.unit_count||0)>0?'▶️':'📝'}</span><span>${esc(row.title)}</span>`;
      b.title=`${materialLabel(row)} · ${row.unit_count||0} unità`;
      b.onclick=()=>openCourse(row);host.appendChild(b);existing.add(row.stable_key);
    });
  }

  function renderHome(){
    if(isLearner())return;
    const host=document.getElementById('catalogBrowserRoot');if(!host)return;
    if(!isAuthenticated()){
      host.innerHTML='<div class="notice"><strong>Catalogo completo:</strong> accedi come amministratore/docente per consultare tutti i corsi e il relativo materiale. I corsisti vedono soltanto i percorsi assegnati.</div>';
      return;
    }
    if(!state.loaded){host.innerHTML='<div class="catalog-loading">Caricamento catalogo didattico…</div>';load();return;}
    const ready=state.rows.filter(x=>Number(x.unit_count||0)>0).length,missing=state.rows.length-ready;
    const families=[...new Set(state.rows.map(x=>x.family||'Altro'))];
    host.innerHTML=`
      <section class="catalog-heading"><div><span class="pill">LIBRERIA DIDATTICA COMPLETA</span><h2>Tutti i corsi predisposti</h2><p>I corsi con Learning Unit si aprono ora nella stessa modalità agenda + slide delle prime presentazioni. La vista tecnica resta disponibile separatamente. I vincoli di presenza, pratica, videoconferenza o e-learning restano regole organizzative e normative e non vengono alterati dalla proiezione digitale.</p></div><div class="catalog-summary"><strong>${state.rows.length}</strong><span>corsi attivi</span><strong>${ready}</strong><span>presentabili</span><strong>${missing}</strong><span>da completare</span></div></section>
      <div class="catalog-toolbar"><input id="catalogSearch" placeholder="Cerca corso, famiglia…"><select id="catalogFamily"><option value="">Tutte le famiglie</option>${families.map(f=>`<option>${esc(f)}</option>`).join('')}</select></div>
      <div id="catalogCards" class="catalog-grid"></div>`;
    const search=document.getElementById('catalogSearch'),family=document.getElementById('catalogFamily');
    const draw=()=>{
      const q=(search?.value||'').trim().toLowerCase(),f=family?.value||'';
      const rows=state.rows.filter(r=>(!f||r.family===f)&&(!q||[r.title,r.stable_key,r.family].some(v=>String(v||'').toLowerCase().includes(q))));
      document.getElementById('catalogCards').innerHTML=rows.map(r=>`<article class="catalog-card ${statusClass(r)}"><div class="catalog-card-top"><span>${esc(r.family||'Altro')}</span><b>${esc(r.version_status||'draft')}</b></div><h3>${esc(r.title)}</h3><div class="catalog-meta"><span>⏱ ${fmtMin(r.nominal_minutes)}</span><span>🧩 ${Number(r.unit_count||0)} unità</span></div><p class="${statusClass(r)}-text">${materialLabel(r)}</p><div class="catalog-card-actions"><button class="softbtn" onclick="openCatalogCourse('${esc(r.stable_key)}')">${Number(r.unit_count||0)>0?'▶ Apri presentazione':'Vedi stato'}</button>${Number(r.unit_count||0)>0?`<button class="ghost" onclick="openCatalogLibrary('${esc(r.stable_key)}')">Vista tecnica</button>`:''}</div></article>`).join('')||'<div class="notice">Nessun corso corrisponde ai filtri.</div>';
    };
    search.oninput=draw;family.onchange=draw;draw();
  }

  function normalizeContent(content){
    if(!content||typeof content!=='object')return [];
    const blocks=[];
    ['detail','summary','teacher_expansion','case','question','norm'].forEach(k=>{if(content[k])blocks.push({title:k.replaceAll('_',' '),html:`<p>${esc(Array.isArray(content[k])?content[k].join(' · '):content[k])}</p>`});});
    Object.entries(content).forEach(([k,v])=>{
      if(['title','minutes','detail','summary','teacher_expansion','case','question','norm','didactic_version','final_assessment'].includes(k))return;
      if(Array.isArray(v)&&v.length)blocks.push({title:k.replaceAll('_',' '),html:`<ul>${v.map(x=>`<li>${esc(typeof x==='object'?JSON.stringify(x):x)}</li>`).join('')}</ul>`});
      else if(v&&typeof v==='string')blocks.push({title:k.replaceAll('_',' '),html:`<p>${esc(v)}</p>`});
    });
    return blocks;
  }

  async function renderLibrary(key){
    if(isLearner()){location.hash='';return;}
    const root=document.getElementById('app');if(!root)return;
    root.innerHTML='<div class="catalog-loading">Caricamento materiale didattico…</div>';
    const client=await waitCloud();if(!client||!isAuthenticated()){root.innerHTML='<div class="notice">Accedi come amministratore/docente per consultare la libreria completa.</div>';return;}
    const {data,error}=await client.rpc('training_course_bundle',{p_stable_key:key});
    if(error||!data){root.innerHTML=`<div class="admin-error">${esc(error?.message||'Corso non trovato.')}</div>`;return;}
    const c=data.course||{},mods=Array.isArray(data.modules)?data.modules:[],units=mods.flatMap(m=>m.units||[]);
    root.innerHTML=`<div class="breadcrumb"><button onclick="location.hash=''">Home</button><span>›</span><span>${esc(c.title)}</span></div><section class="hero"><span class="pill">VISTA TECNICA DEL MATERIALE</span><h1>${esc(c.title)}</h1><p>${esc(c.description||'Percorso didattico predisposto nella libreria SafetyTraining.')}</p><div class="coursemeta"><span>${esc(c.family||'Altro')}</span><span>⏱ ${fmtMin(c.nominal_minutes)}</span><span>🧩 ${units.length} unità</span><span>v${esc(data.version?.version_number||1)} · ${esc(data.version?.status||'draft')}</span></div>${units.length?`<button class="openbtn big" onclick="openCatalogCourse('${esc(key)}')">▶ Apri come presentazione</button>`:''}</section>${!units.length?'<div class="notice"><strong>Materiale da completare:</strong> il corso è censito e resta visibile, ma non contiene ancora Learning Unit.</div>':mods.map((m,mi)=>`<section class="section library-module"><h2>${mi+1}. ${esc(m.title||'Modulo')}</h2><div class="library-units">${(m.units||[]).map((u,ui)=>{const blocks=normalizeContent(u.content);return `<details class="library-unit" ${ui===0?'open':''}><summary><div><strong>${esc(u.title)}</strong><span>${fmtMin(u.default_minutes)} · ${esc(u.source_group||'Learning Unit')}</span></div></summary><div class="library-unit-body"><p class="summary">${esc(u.summary||u.content?.summary||'')}</p>${blocks.map(b=>`<section><h3>${esc(b.title)}</h3>${b.html}</section>`).join('')}</div></details>`;}).join('')}</div></section>`).join('')}`;
  }

  async function route(){
    const p=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    if(p[0]==='library'&&p[1]){renderLibrary(p[1]);return;}
    if(p[0]==='course'&&p[1]&&!localCourse(p[1])&&!isLearner()&&isAuthenticated()){
      try{
        await ensurePresentation(p[1]);
        window.dispatchEvent(new Event('hashchange'));
      }catch(e){console.warn('[Catalog deep-link presentation]',e?.message||e);}
      return;
    }
    if(!p.length)setTimeout(renderHome,0);
  }
  function closeMobileMenu(){document.body.classList.remove('mobile-nav-open');document.getElementById('mobileNavBackdrop')?.classList.remove('open');}
  function initMobile(){
    const b=document.getElementById('mobileMenuBtn'),back=document.getElementById('mobileNavBackdrop');
    if(b)b.onclick=()=>{const open=document.body.classList.toggle('mobile-nav-open');back?.classList.toggle('open',open);};
    if(back)back.onclick=closeMobileMenu;
    document.querySelector('.sidebar')?.addEventListener('click',e=>{if(e.target.closest('button')&&innerWidth<=900)closeMobileMenu();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileMenu();});
  }

  async function boot(){initMobile();await waitCloud();await load();route();cloud()?.state?.client?.auth?.onAuthStateChange(()=>setTimeout(()=>{state.loaded=false;load(true);route();},350));window.addEventListener('hashchange',route);}
  window.SAFETY_CATALOG={load,renderHome,syncSidebar,renderLibrary,ensurePresentation};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
