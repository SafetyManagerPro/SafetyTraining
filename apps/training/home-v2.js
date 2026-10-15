/* SafetyTraining — Home v2
   La sidebar è l'unico catalogo dei corsi.
   La home non duplica i percorsi: mostra stato libreria e strumenti rapidi. */
(() => {
  'use strict';

  function safeData(){
    return Array.isArray(window.SAFETY_DATA) ? window.SAFETY_DATA : [];
  }

  function homeV2(){
    document.body.classList.remove('deckmode');
    const root=document.getElementById('app');
    if(!root) return;

    const data=safeData();
    const courses=data.length;
    const units=data.reduce((n,c)=>n+((c.topics||[]).length),0);
    const revised=data.filter(c=>String(c.didactic_version||'').includes('v2')).length;
    const minutes=data.reduce((n,c)=>n+(c.planned_minutes||c.target_minutes||0),0);
    const hours=Math.round(minutes/60);

    root.innerHTML=`
      <section class="hero presentation-hero">
        <span class="pill">CENTRO DIDATTICO</span>
        <h1>Safety Training</h1>
        <p>Seleziona il percorso dalla <strong>barra laterale</strong>. La pagina iniziale resta un cruscotto operativo e non ripete il catalogo dei corsi.</p>
      </section>

      <section class="grid home-status-grid">
        <article class="card">
          <div class="duration">CATALOGO</div>
          <div class="icon">📚</div>
          <h3>${courses}</h3>
          <p class="muted">percorsi disponibili nella navigazione laterale</p>
        </article>
        <article class="card">
          <div class="duration">CONTENUTI</div>
          <div class="icon">🧩</div>
          <h3>${units}</h3>
          <p class="muted">unità e argomenti didattici disponibili</p>
        </article>
        <article class="card">
          <div class="duration">REVISIONE DIDATTICA</div>
          <div class="icon">✅</div>
          <h3>${revised}</h3>
          <p class="muted">percorsi già portati al nuovo standard v2</p>
        </article>
        <article class="card">
          <div class="duration">LIBRERIA</div>
          <div class="icon">⏱️</div>
          <h3>${hours} h</h3>
          <p class="muted">durata pianificata complessiva indicativa del materiale</p>
        </article>
      </section>

      <h2 class="sectiontitle">Strumenti rapidi</h2>
      <section class="smallgrid">
        <article class="smallcard"><div class="duration">ACCESSO RAPIDO</div><h4>⭐ Preferiti</h4><p class="muted">Riprendi gli argomenti salvati.</p><button class="softbtn" onclick="document.getElementById('showFav')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">CONTINUITÀ</div><h4>🕘 Recenti</h4><p class="muted">Torna alle ultime schede consultate.</p><button class="softbtn" onclick="document.getElementById('showRecent')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">SUPPORTO</div><h4>🥽 Libreria DPI</h4><p class="muted">Consulta rapidamente DPI e controlli.</p><button class="softbtn" onclick="document.getElementById('showDpi')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">FONTI</div><h4>📚 Approfondimenti</h4><p class="muted">Accedi ai riferimenti collegati ai percorsi.</p><button class="softbtn" onclick="document.getElementById('showRefs')?.click()">Apri</button></article>
        <article class="smallcard"><div class="duration">DOCENTE</div><h4>✅ Checklist</h4><p class="muted">Controlli essenziali prima della lezione.</p><button class="softbtn" onclick="document.getElementById('showChecklist')?.click()">Apri</button></article>
      </section>

      <div class="notice"><strong>Navigazione semplificata:</strong> i corsi compaiono una sola volta, nella barra laterale. Il corpo centrale è riservato a stato, strumenti e attività operative.</div>`;
  }

  // app.js definisce home() come funzione globale. La sostituiamo dopo il suo caricamento
  // così anche i successivi ritorni alla Home usano il nuovo cruscotto.
  try { home = homeV2; } catch (_) {}
  window.home = homeV2;

  if(!location.hash || location.hash==='#') homeV2();
})();
