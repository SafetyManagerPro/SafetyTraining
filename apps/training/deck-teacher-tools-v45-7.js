/* SafetyTraining v45.7 — local teacher projection controls.
   This session stopwatch is NOT accredited course time, attendance or student progress. */
(()=>{'use strict';
let panel=null,blank=null,courseId=null,elapsed=0,started=null,tickHandle=null;
const isDeck=()=>document.body.classList.contains('deckmode')&&!!window.__deck?.cid;
const panelShown=()=>!!panel&&!panel.classList.contains('hidden');
const blankShown=()=>!!blank&&!blank.classList.contains('hidden');
const toolbarButton=()=>document.querySelector('[data-deck-tools-open]');
const ms=()=>elapsed+(started===null?0:Math.max(0,Date.now()-started));
function format(duration){
 const sec=Math.floor(duration/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
 return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function render(){
 const time=format(ms()),running=started!==null,btn=toolbarButton();
 if(btn){
  btn.textContent=running?'⏱ '+time:'⏱ Aula';
  btn.setAttribute('aria-label',running?'Apri strumenti aula, cronometro '+time:'Apri strumenti aula');
 }
 if(!panel)return;
 panel.querySelector('#deckTeacherClock').textContent=time;
 const go=panel.querySelector('[data-tools-toggle]');
 go.textContent=running?'⏸ Ferma cronometro':'▶ Avvia cronometro';
 go.setAttribute('aria-pressed',String(running));
 panel.querySelector('[data-tools-reset]').disabled=!running&&elapsed===0;
}
function stop(){
 if(started!==null){elapsed=ms();started=null;}
 if(tickHandle!==null){clearInterval(tickHandle);tickHandle=null;}
 render();
}
function toggleTimer(){
 if(!isDeck())return false;
 if(started!==null){stop();return false;}
 started=Date.now();
 if(tickHandle!==null)clearInterval(tickHandle);
 tickHandle=setInterval(render,1000);
 render();return true;
}
function resetTimer(){stop();elapsed=0;render();}
function initPanel(){
 if(panel)return panel;
 panel=document.createElement('div');panel.id='deckTeacherToolsOverlay';panel.className='deck-tools-overlay hidden';
 panel.innerHTML='<section class="deck-tools-dialog" role="dialog" aria-modal="true" aria-labelledby="deckTeacherTitle"><header><div><span class="deck-tools-kicker">COMANDI PER LA PROIEZIONE</span><h2 id="deckTeacherTitle">Strumenti aula</h2></div><button type="button" data-tools-close aria-label="Chiudi strumenti aula">×</button></header><div class="deck-tools-content"><p class="deck-tools-label">Cronometro della sessione</p><output id="deckTeacherClock" aria-label="Durata cronometro">00:00</output><div class="deck-tools-row"><button type="button" data-tools-toggle aria-pressed="false">▶ Avvia cronometro</button><button type="button" data-tools-reset>Azzera</button></div><button type="button" data-tools-blackout class="deck-tools-blackout-btn">◼ Oscura la slide</button><p class="deck-tools-disclaimer">Cronometro personale del docente: non registra frequenza, completamento o ore riconosciute del corso. Si azzera lasciando la presentazione.</p></div></section>';
 panel.addEventListener('click',event=>{
  if(event.target===panel||event.target?.closest?.('[data-tools-close]')){closePanel();return;}
  if(event.target?.closest?.('[data-tools-toggle]'))toggleTimer();
  if(event.target?.closest?.('[data-tools-reset]'))resetTimer();
  if(event.target?.closest?.('[data-tools-blackout]')){closePanel();showBlank();}
 });
 document.body.appendChild(panel);return panel;
}
function showPanel(){
 if(!isDeck())return false;
 const node=initPanel();
 if(panelShown())return true;
 node.classList.remove('hidden');document.body.classList.add('deck-tools-open');
 render();window.SAFETY_MODAL_ACCESS?.opened?.(node,closePanel);
 node.querySelector('[data-tools-close]').focus();return true;
}
function closePanel(){
 if(!panelShown())return;
 panel.classList.add('hidden');document.body.classList.remove('deck-tools-open');
 window.SAFETY_MODAL_ACCESS?.closed?.(panel);
}
function initBlank(){
 if(blank)return blank;
 blank=document.createElement('div');blank.id='deckTeacherBlank';blank.className='deck-tools-blank hidden';
 blank.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="deckBlankTitle" class="deck-tools-blank-inner"><span>PROIEZIONE SOSPESA</span><h2 id="deckBlankTitle">Slide temporaneamente oscurata</h2><p>La presentazione rimane sulla stessa slide.</p><button type="button" data-tools-resume>▶ Riprendi slide</button><small>Puoi anche premere Esc.</small></section>';
 blank.addEventListener('click',event=>{if(event.target?.closest?.('[data-tools-resume]'))closeBlank();});
 document.body.appendChild(blank);return blank;
}
function showBlank(){
 if(!isDeck())return false;
 if(blankShown())return true;
 const node=initBlank();node.classList.remove('hidden');document.body.classList.add('deck-tools-paused');
 window.SAFETY_MODAL_ACCESS?.opened?.(node,closeBlank);
 node.querySelector('[data-tools-resume]').focus();return true;
}
function closeBlank(){
 if(!blankShown())return;
 blank.classList.add('hidden');document.body.classList.remove('deck-tools-paused');
 window.SAFETY_MODAL_ACCESS?.closed?.(blank);
}
function leaveSession(){
 closeBlank();closePanel();stop();elapsed=0;courseId=null;render();
}
document.addEventListener('click',event=>{if(event.target?.closest?.('[data-deck-tools-open]'))showPanel();});
document.addEventListener('keydown',event=>{
 if(!blankShown()||event.defaultPrevented)return;
 // Prevent unseen slide navigation behind the black screen; Escape is handled by modal-access.
 if(['ArrowRight','ArrowLeft','PageUp','PageDown',' '].includes(event.key)){
  event.preventDefault();event.stopImmediatePropagation?.();
 }
},true);
document.addEventListener('safety:deck-slide-rendered',()=>{
 if(!isDeck())return;
 const next=String(window.__deck.cid);
 if(courseId!==null&&courseId!==next)leaveSession();
 courseId=next;render();
});
window.addEventListener('hashchange',()=>{
 if(!/^#deck\//.test(location.hash)){leaveSession();return;}
 // Direct URL navigation to another slide should not remain obscured.
 closeBlank();
});
document.addEventListener('safety:auth-changed',leaveSession);
window.addEventListener('pagehide',()=>{stop();closeBlank();closePanel();});
window.SAFETY_DECK_TEACHER_V45_7={showPanel,closePanel,showBlank,closeBlank,toggleTimer,resetTimer,leaveSession,format,readElapsed:ms};
})();
