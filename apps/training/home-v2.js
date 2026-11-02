/* SafetyTraining — Home v3
   Dashboard + complete didactic catalog. Delivery constraints never hide teaching material. */
(() => {
  'use strict';
  function safeData(){return Array.isArray(window.SAFETY_DATA)?window.SAFETY_DATA:[];}
  function homeV2(){
    const gate=window.SAFETY_ACCESS_V46_10;
    if(!gate?.isAuthenticated?.())return;
    if(gate.state.phase==='learner'){
      window.SAFETY_LEARNER?.open?.();
      return;
    }
    document.body.classList.remove('deckmode');
    const root=document.getElementById('app');if(!root)return;
    const data=safeData().filter(x=>gate.canOpen(x.id)),courses=data.length,units=data.reduce((n,c)=>n+((c.topics||[]).length),0),revised=data.filter(c=>String(c.didactic_version||'').includes('v2')).length;
    const minutes=data.reduce((n,c)=>n+(c.planned_minutes||c.target_minutes||0),0),hours=Math.round(minutes/60);
    root.innerHTML=`
      <section class="hero presentation-hero"><span class="pill">CENTRO DIDATTICO</span><h1>Safety Training</h1><p>Dashboard e libreria completa dei corsi. Il materiale per docente e corsista è separato dalle regole sulla modalità di erogazione.</p></section>
      <section class="grid home-status-grid">
        <article class="card"><div class="duration">CONTENUTI LOCALI</div><div class="icon">📚</div><h3>${courses}</h3><p class="muted">percorsi con renderer Aula/Docente già caricati</p></article>
        <article class="card"><div class="duration">UNITÀ LOCALI</div><div class="icon">🧩</div><h3>${units}</h3><p class="muted">argomenti didattici nella libreria locale</p></article>
        <article class="card"><div class="duration">REVISIONE DIDATTICA</div><div class="icon">✅</div><h3>${revised}</h3><p class="muted">percorsi locali già portati al nuovo standard v2</p></article>
        <article class="card"><div class="duration">LIBRERIA LOCALE</div><div class="icon">⏱️</div><h3>${hours} h</h3><p class="muted">durata pianificata indicativa del materiale locale</p></article>
      </section>
      <div id="catalogBrowserRoot"><div class="catalog-loading">Caricamento catalogo didattico completo…</div></div>
      <h2 class="sectiontitle">Strumenti rapidi</h2>
      <section class="smallgrid">
        <article class="smallcard"><div class="duration">ACCESSO RAPIDO</div><h4>⭐ Preferiti</h4><p class="muted">Riprendi gli argomenti salvati.</p><button class="softbtn" onclick="document.getElementById('showFav')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">CONTINUITÀ</div><h4>🕘 Recenti</h4><p class="muted">Torna alle ultime schede consultate.</p><button class="softbtn" onclick="document.getElementById('showRecent')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">SUPPORTO</div><h4>🥽 Libreria DPI</h4><p class="muted">Consulta rapidamente DPI e controlli.</p><button class="softbtn" onclick="document.getElementById('showDpi')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">FONTI</div><h4>📚 Approfondimenti</h4><p class="muted">Accedi ai riferimenti collegati ai percorsi.</p><button class="softbtn" onclick="document.getElementById('showRefs')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">DOCENTE</div><h4>✅ Checklist</h4><p class="muted">Controlli essenziali prima della lezione.</p><button class="softbtn" onclick="document.getElementById('showChecklist')?.click()">Apri</button></article>
      </section>`;
    window.SAFETY_CATALOG?.renderHome?.();
  }
  try{home=homeV2;}catch(_){}window.home=homeV2;
  if(!location.hash||location.hash==='#')homeV2();
  document.addEventListener('safety:access-ready',()=>{if(!location.hash||location.hash==='#')homeV2();});
})();
