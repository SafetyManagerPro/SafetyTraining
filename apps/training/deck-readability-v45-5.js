/* SafetyTraining v45.5 — reversible display preference and mobile slide-top reset.
   Navigation UI only: never writes attendance, tests, progress or course data. */
(()=>{'use strict';
  const body=document.body;
  const active=()=>body.classList.contains('deckmode');
  const button=()=>document.querySelector('[data-deck-readable]');
  const mobile=()=>window.matchMedia?.('(max-width: 1100px), ((pointer: coarse) and (max-width: 1366px))')?.matches??window.innerWidth<=1100;
  function syncButton(){
    const b=button();if(!b)return;
    const on=body.classList.contains('deck-readable');
    b.setAttribute('aria-pressed',String(on));
    b.setAttribute('aria-label',on?'Disattiva alta leggibilità delle slide':'Attiva alta leggibilità delle slide');
    b.title=on?'Torna alla visualizzazione standard':'Aumenta contrasto e leggibilità';
    b.textContent=on?'Aa Standard':'Aa Leggibilità';
  }
  function reset(){
    body.classList.remove('deck-readable');
    syncButton();
  }
  function toggle(){
    if(!active())return false;
    const on=body.classList.toggle('deck-readable');
    syncButton();
    return on;
  }
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('[data-deck-readable]'))toggle();
  });
  window.addEventListener('hashchange',()=>{
    if(!/^#?deck\//.test(location.hash)){reset();return;}
    // Tablet/phone use a native vertically scrolling reader, not the scaled 1600px projector.
    if(mobile())window.requestAnimationFrame?.(()=>{
      if(active()&&/^#?deck\//.test(location.hash))window.scrollTo?.(0,0);
    });
  });
  document.addEventListener('safety:auth-changed',reset);
  window.SAFETY_DECK_READABILITY_V45_5={toggle,reset,syncButton};
})();
