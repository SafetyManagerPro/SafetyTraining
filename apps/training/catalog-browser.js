/* SafetyTraining — complete didactic catalog browser.
   Delivery rules are descriptive metadata only: they never hide teaching material.
   Database-backed courses are adapted into the same presentation model used by app.js. */
(() => {
  'use strict';
  const blankFilters=()=>({query:'',family:'',readiness:'all',sort:'title'});
  const state={rows:[],loaded:false,loading:false,opening:new Set(),error:'',filters:blankFilters(),libraryRequest:0};
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtMin=m=>{m=Number(m||0);const h=Math.floor(m/60),mm=m%60;return h?`${h} h${mm?` ${mm} min`:''}`:`${mm} min`;};
  const localCourse=key=>(window.SAFETY_DATA||[]).find(c=>c.id===key);
  const gate=()=>window.SAFETY_ACCESS_V46_10;
  const isLearner=()=>gate()?.state?.phase==='learner';
  const isAuthenticated=()=>gate()?.isAuthenticated?.()===true;

  async function waitCloud(){for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,150));return db();}
  async function load(force=false){
    if(state.loading||(!force&&state.loaded)) return state.rows;
    if(!gate()?.canBrowse?.()) return [];
    const client=await waitCloud(); if(!client)return [];
    state.loading=true;
    try{
      const {data,error}=await client.rpc('training_catalog_summary');
      if(error)throw error;
      if(!gate()?.canBrowse?.())return [];
      state.rows=gate().rowsForViewer(Array.isArray(data)?data:[]);state.loaded=true;state.error='';
      syncSidebar();renderHome();
    }catch(e){
      state.error=String(e?.message||'Errore temporaneo di caricamento.');
      console.warn('[Catalog browser]',state.error);
      const host=document.getElementById('catalogBrowserRoot');
      if(host)showLoadError(host);
    }
    finally{state.loading=false;}
    return state.rows;
  }

  function showLoadError(host){
    host.innerHTML='<div class="notice catalog-load-error" role="alert"><strong>Catalogo temporaneamente non disponibile.</strong><p>'+esc(state.error)+'</p><button type="button" data-catalog-retry>Riprova caricamento</button></div>';
    host.querySelector('[data-catalog-retry]')?.addEventListener('click',()=>{
      state.error='';host.innerHTML='<div class="catalog-loading">Caricamento catalogo didattico…</div>';
      void load(true);
    },{once:true});
  }

  function materialLabel(row){return Number(row.unit_count||0)>0?'Presentazione disponibile':'Materiale da completare';}
  function statusClass(row){return Number(row.unit_count||0)>0?'catalog-ready':'catalog-missing';}

  async function ensurePresentation(key){
    if(!gate()?.canOpen?.(key))throw Error('Accesso al corso non autorizzato.');
    if(localCourse(key)) return localCourse(key);
    const adapter=window.SAFETY_DB_SLIDES;
    if(!adapter?.ensureCourse) throw new Error('Adapter presentazione non disponibile.');
    return adapter.ensureCourse(key,await waitCloud());
  }

  async function openCourse(row){
    if(!row||!gate()?.canOpen?.(row.stable_key))return;
    closeMobileMenu();
    if(Number(row.unit_count||0)<=0){location.hash=`library/${encodeURIComponent(row.stable_key)}`;return;}
    if(state.opening.has(row.stable_key))return;
    state.opening.add(row.stable_key);
    const root=document.getElementById('app');
    if(root)root.innerHTML=`<div class="catalog-loading">Preparazione presentazione “${esc(row.title)}”…</div>`;
    try{
      const course=await ensurePresentation(row.stable_key);
      if(!course)throw new Error('Corso non presentabile.');
      location.hash=`course/${encodeURIComponent(row.stable_key)}`;
    }catch(e){
      console.warn('[Catalog presentation]',row.stable_key,e?.message||e);
      location.hash=`library/${encodeURIComponent(row.stable_key)}`;
    }finally{state.opening.delete(row.stable_key);}
  }
  window.openCatalogCourse=key=>{const row=state.rows.find(x=>x.stable_key===key);if(row)return openCourse(row);};
  window.openCatalogLibrary=key=>{if(!gate()?.canBrowse?.()||!gate()?.canOpen?.(key))return;closeMobileMenu();location.hash=`library/${encodeURIComponent(key)}`;};

  function syncSidebar(){
    if(!gate()?.canBrowse?.())return;
    const host=document.getElementById('sideCourses');if(!host)return;
    const existing=new Set([...host.querySelectorAll('[data-course-key]')].map(x=>x.dataset.courseKey));
    [...host.querySelectorAll('.navbtn')].forEach(b=>{if(b.dataset.courseKey)existing.add(b.dataset.courseKey);});
    state.rows.forEach(row=>{
      if(existing.has(row.stable_key))return;
      const b=document.createElement('button');b.className='navbtn catalog-navbtn';b.dataset.courseKey=row.stable_key;
      b.innerHTML=`<span>${Number(row.unit_count||0)>0?'▶️':'📝'}</span><span>${esc(row.title)}</span>`;
      b.title=`${materialLabel(row)} · ${row.unit_count||0} unità`;
      b.onclick=()=>openCourse(row);host.appendChild(b);existing.add(row.stable_key);
    });
  }

  function renderHome(){
    if(!gate()?.canBrowse?.())return;
    const host=document.getElementById('catalogBrowserRoot');if(!host)return;
    if(!isAuthenticated()){
      host.innerHTML='<div class="notice"><strong>Catalogo completo:</strong> accedi come amministratore/docente per consultare tutti i corsi e il relativo materiale. I corsisti vedono soltanto i percorsi assegnati.</div>';
      return;
    }
    if(state.error){showLoadError(host);return;}
    if(!state.loaded){host.innerHTML='<div class="catalog-loading">Caricamento catalogo didattico…</div>';void load();return;}
    const ready=state.rows.filter(x=>Number(x.unit_count||0)>0).length,missing=state.rows.length-ready;
    const families=[...new Set(state.rows.map(x=>x.family||'Altro'))];
    host.innerHTML=`
      <section class="catalog-heading"><div><span class="pill">LIBRERIA DIDATTICA COMPLETA</span><h2>Tutti i corsi predisposti</h2><p>I corsi con Learning Unit si aprono ora nella stessa modalità agenda + slide delle prime presentazioni. La vista tecnica resta disponibile separatamente. I vincoli di presenza, pratica, videoconferenza o e-learning restano regole organizzative e normative e non vengono alterati dalla proiezione digitale.</p></div><div class="catalog-summary"><strong>${state.rows.length}</strong><span>corsi attivi</span><strong>${ready}</strong><span>presentabili</span><strong>${missing}</strong><span>da completare</span></div></section>
      <div class="catalog-toolbar v45-catalog-toolbar"><label class="v45-catalog-filter v45-catalog-filter--search" for="catalogSearch">Cerca corso<input id="catalogSearch" type="search" autocomplete="off" placeholder="Titolo, codice o famiglia…"></label><label class="v45-catalog-filter" for="catalogFamily">Famiglia<select id="catalogFamily"><option value="">Tutte le famiglie</option>${families.map(f=>`<option>${esc(f)}</option>`).join('')}</select></label><label class="v45-catalog-filter" for="catalogReadiness">Materiale<select id="catalogReadiness"><option value="all">Tutti</option><option value="ready">Presentazione disponibile</option><option value="missing">Da completare</option></select></label><label class="v45-catalog-filter" for="catalogSort">Ordina per<select id="catalogSort"><option value="title">Titolo A–Z</option><option value="duration">Durata crescente</option><option value="units">Più unità didattiche</option></select></label><button type="button" id="catalogResetFilters" class="v45-catalog-reset">Azzera filtri</button></div>
      <p id="catalogResultCount" class="v45-catalog-result-count" role="status" aria-live="polite"></p>
      <div id="catalogCards" class="catalog-grid" aria-label="Risultati catalogo corsi"></div>`;
    const search=document.getElementById('catalogSearch'),family=document.getElementById('catalogFamily');
    const readiness=document.getElementById('catalogReadiness'),sort=document.getElementById('catalogSort');
    const reset=document.getElementById('catalogResetFilters');
    if(search)search.value=state.filters.query;
    if(family)family.value=state.filters.family;
    if(readiness)readiness.value=state.filters.readiness;
    if(sort)sort.value=state.filters.sort;
    const byTitle=(a,b)=>String(a.title||'').localeCompare(String(b.title||''),'it',{sensitivity:'base'})||String(a.stable_key||'').localeCompare(String(b.stable_key||''));
    const draw=()=>{
      const q=(search?.value||'').trim().toLocaleLowerCase('it'),f=family?.value||'';
      const availability=readiness?.value||'all',order=sort?.value||'title';
      state.filters={query:search?.value||'',family:f,readiness:availability,sort:order};
      const filtered=!!(q||f||availability!=='all'||order!=='title');
      const rows=state.rows.filter(r=>(!f||r.family===f)
        &&(availability==='all'||(availability==='ready'?Number(r.unit_count||0)>0:Number(r.unit_count||0)<=0))
        &&(!q||[r.title,r.stable_key,r.family].some(v=>String(v||'').toLocaleLowerCase('it').includes(q))));
      rows.sort((a,b)=>{
        if(order==='duration'){
          const x=Number(a.nominal_minutes)||Infinity,y=Number(b.nominal_minutes)||Infinity;
          return x-y||byTitle(a,b);
        }
        if(order==='units')return Number(b.unit_count||0)-Number(a.unit_count||0)||byTitle(a,b);
        return byTitle(a,b);
      });
      const cards=document.getElementById('catalogCards');
      if(!cards)return;
      cards.innerHTML=rows.map(r=>`<article class="catalog-card ${statusClass(r)}"><div class="catalog-card-top"><span>${esc(r.family||'Altro')}</span><b aria-label="Stato versione">${esc(r.version_status||'draft')}</b></div><h3>${esc(r.title)}</h3><div class="catalog-meta"><span>⏱ ${fmtMin(r.nominal_minutes)}</span><span>🧩 ${Number(r.unit_count||0)} unità</span></div><p class="v45-catalog-state ${statusClass(r)}-text"><span aria-hidden="true">●</span> ${materialLabel(r)}</p><div class="catalog-card-actions"><button type="button" class="softbtn" data-catalog-action="open" data-course-key="${esc(r.stable_key)}">${Number(r.unit_count||0)>0?'▶ Apri presentazione':'Vedi stato'}</button>${Number(r.unit_count||0)>0?`<button type="button" class="ghost" data-catalog-action="library" data-course-key="${esc(r.stable_key)}">Vista tecnica</button>`:''}</div></article>`).join('')||'<div class="notice">Nessun corso corrisponde ai filtri.</div>';
      const count=document.getElementById('catalogResultCount');if(count)count.textContent=(rows.length===1?'1 corso trovato':rows.length+' corsi trovati')+(filtered?' su '+state.rows.length:'');
      if(reset)reset.disabled=!filtered;
    };
    const cards=document.getElementById('catalogCards');
    cards?.addEventListener('click',event=>{
      const button=event.target.closest('[data-catalog-action]');
      if(!button||!cards.contains(button))return;
      const row=state.rows.find(r=>r.stable_key===button.dataset.courseKey);
      if(!row)return;
      if(button.dataset.catalogAction==='open')void openCourse(row);
      else if(button.dataset.catalogAction==='library')window.openCatalogLibrary(row.stable_key);
    });
    if(search)search.oninput=draw;
    if(family)family.onchange=draw;
    if(readiness)readiness.onchange=draw;
    if(sort)sort.onchange=draw;
    if(reset)reset.onclick=()=>{
      state.filters=blankFilters();
      if(search)search.value='';
      if(family)family.value='';
      if(readiness)readiness.value='all';
      if(sort)sort.value='title';
      draw();search?.focus();
    };
    draw();
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

  function libraryRouteIs(key){
    const parts=location.hash.replace(/^#/,'').split('/');
    try{return parts[0]==='library'&&decodeURIComponent(parts[1]||'')===key;}
    catch{return false;}
  }
  async function renderLibrary(key){
    if(!gate()?.canBrowse?.()||!gate()?.canOpen?.(key)){gate()?.guardRoute?.();return;}
    const root=document.getElementById('app');if(!root)return;
    const request=++state.libraryRequest,viewer=cloud()?.state?.user?.id;
    root.innerHTML='<div class="catalog-loading">Caricamento materiale didattico…</div>';
    const client=await waitCloud();
    if(request!==state.libraryRequest||!libraryRouteIs(key))return;
    if(!client||!gate()?.canBrowse?.()||!gate()?.canOpen?.(key)||cloud()?.state?.user?.id!==viewer){
      root.innerHTML='<div class="notice">Accedi come amministratore/docente per consultare la libreria completa.</div>';
      return;
    }
    let data,error;
    try{({data,error}=await client.rpc('training_course_bundle',{p_stable_key:key}));}
    catch(e){error=e;}
    if(request!==state.libraryRequest||!libraryRouteIs(key)||!gate()?.canBrowse?.()||!gate()?.canOpen?.(key)||cloud()?.state?.user?.id!==viewer)return;
    if(error||!data){
      root.innerHTML='<div class="admin-error" role="alert">'+esc(error?.message||'Corso non trovato.')+' <button type="button" data-library-retry>Riprova</button></div>';
      root.querySelector('[data-library-retry]')?.addEventListener('click',()=>{void renderLibrary(key);},{once:true});
      return;
    }
    const c=data.course||{},mods=Array.isArray(data.modules)?data.modules:[],units=mods.flatMap(m=>m.units||[]);
    root.innerHTML=`<div class="breadcrumb"><button type="button" data-catalog-home>Home</button><span>›</span><span>${esc(c.title)}</span></div><section class="hero"><span class="pill">VISTA TECNICA DEL MATERIALE</span><h1>${esc(c.title)}</h1><p>${esc(c.description||'Percorso didattico predisposto nella libreria SafetyTraining.')}</p><div class="coursemeta"><span>${esc(c.family||'Altro')}</span><span>⏱ ${fmtMin(c.nominal_minutes)}</span><span>🧩 ${units.length} unità</span><span>v${esc(data.version?.version_number||1)} · ${esc(data.version?.status||'draft')}</span></div>${units.length?`<button type="button" class="openbtn big" data-catalog-open>▶ Apri come presentazione</button>`:''}</section>${!units.length?'<div class="notice"><strong>Materiale da completare:</strong> il corso è censito e resta visibile, ma non contiene ancora Learning Unit.</div>':mods.map((m,mi)=>`<section class="section library-module"><h2>${mi+1}. ${esc(m.title||'Modulo')}</h2><div class="library-units">${(m.units||[]).map((u,ui)=>{const blocks=normalizeContent(u.content);return `<details class="library-unit" ${ui===0?'open':''}><summary><div><strong>${esc(u.title)}</strong><span>${fmtMin(u.default_minutes)} · ${esc(u.source_group||'Learning Unit')}</span></div></summary><div class="library-unit-body"><p class="summary">${esc(u.summary||u.content?.summary||'')}</p>${blocks.map(b=>`<section><h3>${esc(b.title)}</h3>${b.html}</section>`).join('')}</div></details>`;}).join('')}</div></section>`).join('')}`;
    root.querySelector('[data-catalog-home]')?.addEventListener('click',()=>{location.hash='';});
    root.querySelector('[data-catalog-open]')?.addEventListener('click',()=>{window.openCatalogCourse(key);});
    if(units.length)window.SAFETY_LIBRARY_UX?.mount?.(root,mods);
  }

  async function route(){
    const parsed=window.SAFETY_LEARNER_NAV_V22?.route(location.hash);
    const p=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    if(p[0]==='library'&&p[1]){
      let libraryKey;try{libraryKey=decodeURIComponent(p[1]);}catch{return;}
      void renderLibrary(libraryKey);return;
    }
    if(!parsed?.key||!['course','topic','deck','lab','resources'].includes(parsed.kind)||localCourse(parsed.key)) {
      if(!p.length)setTimeout(renderHome,0);
      return;
    }
    if(!isAuthenticated()||!gate()?.canOpen?.(parsed.key))return;
    const key=parsed.key;
    const assignment=isLearner()?window.SAFETY_LEARNER_NAV_V22?.assigned(cloud()?.state?.assignments,key):null;
    if(isLearner()&&!assignment){
      location.hash='';
      window.SAFETY_LEARNER?.open?.();
      return;
    }
    if(state.opening.has(key))return;
    state.opening.add(key);
    const routeAtStart=location.hash;
    try{
      const course=await ensurePresentation(key);
      if(assignment?.versionNumber!=null&&course?.db_version!=null&&Number(assignment.versionNumber)!==Number(course.db_version)){
        throw new Error('Versione assegnata non corrispondente al materiale didattico disponibile.');
      }
      if(location.hash===routeAtStart&&isAuthenticated()&&gate()?.canOpen?.(key)){
        window.dispatchEvent(new Event('hashchange'));
      }
    }catch(e){
      console.warn('[Catalog deep-link presentation]',key,e?.message||e);
      if(isLearner()&&location.hash===routeAtStart){
        const root=document.getElementById('app');
        if(root){
          root.innerHTML='<div class="notice"><strong>Impossibile aprire il percorso.</strong> '+esc(e?.message||'Materiale non disponibile.')+'</div>';
        }
      }
    }finally{state.opening.delete(key);}
  }
  function closeMobileMenu(){
    document.body.classList.remove('mobile-nav-open');
    document.getElementById('mobileNavBackdrop')?.classList.remove('open');
    const button=document.getElementById('mobileMenuBtn');
    button?.setAttribute('aria-expanded','false');button?.setAttribute('aria-label','Apri menu');
  }
  const usesMobileNavigation=()=>window.matchMedia?.('(max-width: 1100px), ((pointer: coarse) and (max-width: 1366px))').matches??window.innerWidth<=1100;
  function initMobile(){
    const b=document.getElementById('mobileMenuBtn'),back=document.getElementById('mobileNavBackdrop');
    if(b){b.setAttribute('aria-expanded','false');b.onclick=()=>{const open=document.body.classList.toggle('mobile-nav-open');back?.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');};}
    if(back)back.onclick=closeMobileMenu;
    document.querySelector('.sidebar')?.addEventListener('click',e=>{if(e.target.closest('button')&&usesMobileNavigation())closeMobileMenu();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileMenu();});
  }

  async function boot(){initMobile();await waitCloud();await load();route();
    document.addEventListener('safety:access-ready',()=>{state.loaded=false;state.rows=[];state.filters=blankFilters();state.libraryRequest++;if(gate()?.canBrowse?.())void load(true);});cloud()?.state?.client?.auth?.onAuthStateChange(()=>setTimeout(()=>{state.loaded=false;state.error='';state.rows=[];state.filters=blankFilters();state.libraryRequest++;load(true);route();},350));window.addEventListener('hashchange',()=>{state.libraryRequest++;route();});}
  window.SAFETY_CATALOG={load,renderHome,syncSidebar,renderLibrary,ensurePresentation};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
