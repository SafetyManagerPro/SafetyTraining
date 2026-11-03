/* SafetyTraining v47.3. Link-only viewer using the ORIGINAL slide builders from app.js. */
(()=>{'use strict';
 const API='https://ejkwvatmzdqqjozpxntk.supabase.co/functions/v1/internal-course';
 const KEY='sb_publishable_bn9DnocbbBEcf98WAwcSHw_wABCiOSA';
 const root=document.getElementById('internalApp');
 const state={token:'',bundle:null,course:null,deck:[],index:0,lastSlide:null,visitedSlides:0,busy:false,menuOpen:false};
 let stageResizeObserver=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 function parseToken(){
  // The bearer token stays in the URL fragment: it is never sent as a referrer.
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  const token=hash.get('t')||'';
  return /^[A-Za-z0-9_-]{43}$/.test(token)?token:'';
 }
 async function request(action,fields={}){
  const resp=await fetch(API,{method:'POST',cache:'no-store',referrerPolicy:'no-referrer',
   headers:{'Content-Type':'application/json','apikey':KEY},
   body:JSON.stringify({action,token:state.token,...fields})});
  const json=await resp.json().catch(()=>({}));
  if(!resp.ok||json.error)throw new Error(resp.status===404?
   'Il collegamento non è valido oppure è stato disattivato.':
   'Impossibile connettersi al corso. Verifica Internet e riprova.');
  return json;
 }
 function showError(error){
  stageResizeObserver?.disconnect();
  document.body.classList.remove('deckmode');
  root.innerHTML='<section class="ip-error"><div class="ip-logo">SAFETYTRAINING</div>'+
   '<h1>Non posso aprire il corso</h1><p>'+esc(error?.message||error||'Collegamento non disponibile.')+'</p>'+
   '<p>Chiedi all’amministratore un nuovo collegamento personale.</p></section>';
 }
 function adaptExactCourse(data){
  if(!window.SAFETY_DB_SLIDES?.adaptBundle||!window.SAFETY_DECK_RENDER?.buildDeck||!window.SAFETY_DECK_RENDER?.deckSlideBody)
   throw Error('Il visualizzatore originale delle slide non è disponibile.');
  const sourceModules=Array.isArray(data?.modules)?data.modules:[];
  const courseData=data?.course||{};
  const course=window.SAFETY_DB_SLIDES.adaptBundle({
   course:{...courseData,stable_key:courseData.stable_key||'internal-assigned-course'},
   version:{status:'published',version_number:courseData.version||1},
   modules:sourceModules
  });
  window.SAFETY_PRESENTATION_ENRICHMENT?.enrichCourse?.(course);
  if(!course.topics?.length)throw Error('Il corso assegnato non contiene slide pubblicate.');
  // The original adapter preserves stable keys, while the token API supplies
  // the immutable unit_version_id required for server-side progress tracking.
  const byStable=new Map(sourceModules.flatMap(m=>(m.units||[]).map(u=>[
   String(u.stable_key||u.unit_id),String(u.unit_id||'')
  ])));
  for(const topic of course.topics)topic.internal_unit_version_id=byStable.get(topic.source_stable_key)||null;
  const all=window.SAFETY_DATA||(window.SAFETY_DATA=[]);
  all.splice(0,all.length,course);
  return course;
 }
 const pc=()=>state.deck.length?Math.round(100*state.visitedSlides/state.deck.length):0;
 function showHome(){
  stageResizeObserver?.disconnect();
  document.body.classList.remove('deckmode');
  state.menuOpen=false;
  const c=state.course;
  const resume=Number.isInteger(state.lastSlide);
  root.innerHTML='<header class="ip-header"><div class="ip-logo">SAFETYTRAINING</div><small>Formazione interna</small></header>'+
   '<section class="ip-hero"><div class="ip-eyebrow">Corso assegnato</div>'+
   '<h1>'+esc(c.title)+'</h1><p>'+esc(c.subtitle||'')+'</p>'+
   '<div class="ip-meta"><span class="ip-pill">Benvenuto '+esc(state.bundle.person_first_name||'')+'</span>'+
   '<span class="ip-pill">'+state.deck.length+' slide originali</span>'+
   '<span class="ip-pill">Corso interno non certificante</span></div>'+
   '<div class="ip-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pc()+'">'+
   '<span style="width:'+pc()+'%"></span></div>'+
   '<p class="ip-footnote">'+state.visitedSlides+' di '+state.deck.length+
   ' slide aperte. Il percorso non costituisce attestato né verifica dell’identità.</p>'+
   '<div><button class="ip-primary" id="ipStart">'+(resume?'Riprendi dalle slide':'Avvia il corso')+'</button></div></section>';
  document.getElementById('ipStart').onclick=()=>void go(resume?state.lastSlide:0);
 }
 function fit(){
  const stage=document.getElementById('deckStage'),slide=document.getElementById('projectorSlide');
  if(!stage||!slide)return;
  slide.classList.remove('compact','compact2');
  const pad=12;
  // The original 1600×900 slide must first be centered in the SMALL visible
  // stage. Scaling it in grid layout alone leaves the content offscreen on phones.
  const w=stage.clientWidth,h=stage.clientHeight;
  if(w<1||h<1)return;
  const scale=Math.min(Math.max(.04,(w-pad*2)/1600),Math.max(.04,(h-pad*2)/900));
  slide.style.transform='translate(-50%, -50%) scale('+scale+')';
  slide.style.setProperty('--deck-scale',scale);
  requestAnimationFrame(()=>{
   if(slide.scrollHeight>slide.clientHeight+2||slide.scrollWidth>slide.clientWidth+2){
    slide.classList.add('compact');
    requestAnimationFrame(()=>{
     if(slide.scrollHeight>slide.clientHeight+2||slide.scrollWidth>slide.clientWidth+2)slide.classList.add('compact2');
    });
   }
  });
 }
 function makeSlide(){
  const i=state.index,c=state.course,slides=state.deck,s=slides[i];
  const pct=(100*(i+1)/slides.length);
  const body=window.SAFETY_DECK_RENDER.deckSlideBody(s,i);
  const module=esc(s.module?.title||c.title);
  const topic=s.topic?'<span>'+esc(s.topic.title)+'</span>':'';
  document.body.classList.add('deckmode','bigscreen');
  window.__deck={cid:c.id,index:i,total:slides.length};
  window.__deckSlides=slides;
  root.innerHTML='<div class="deck-shell"><div class="deck-top">'+
   '<div class="deck-top-navigation"><button type="button" id="ipHome" class="deck-home-btn" title="Torna alla home">⌂ Home</button></div>'+
   '<div class="deck-course">'+esc(c.icon)+' '+esc(c.title)+'</div>'+
   '<div class="deck-actions"><button type="button" id="ipIndex" aria-label="Apri indice slide">☷ Indice</button>'+
   '<button type="button" id="ipFullscreen" aria-label="Schermo intero">⛶</button></div></div>'+
   '<div class="deck-stage" id="deckStage"><article class="projector-slide type-'+esc(s.type)+'" id="projectorSlide">'+body+'</article></div>'+
   '<div class="deck-footer"><div><strong>'+module+'</strong>'+topic+
   '</div><div class="deck-time"><span>Slide visitate</span><b>'+state.visitedSlides+' / '+slides.length+'</b></div>'+
   '<div class="deck-pager"><button type="button" id="ipPrev"'+(i===0?' disabled':'')+'>← Indietro</button>'+
   '<span class="deck-counter" aria-live="polite">'+(i+1)+' / '+slides.length+'</span>'+
   '<button type="button" id="ipNext"'+(i===slides.length-1?' disabled':'')+'>Avanti →</button></div></div>'+
   '<div class="deck-progress"><span style="width:'+pct+'%"></span></div>'+
   '<button type="button" class="deck-nav prev" aria-label="Slide precedente" id="ipPrevSide"'+(i===0?' disabled':'')+'>‹</button>'+
   '<button type="button" class="deck-nav next" aria-label="Slide successiva" id="ipNextSide"'+(i===slides.length-1?' disabled':'')+'>›</button>'+
   '</div><aside class="ip-slide-panel" id="ipSlidePanel" hidden aria-label="Indice delle slide"></aside>';
  for(const id of ['ipPrev','ipPrevSide'])document.getElementById(id).onclick=()=>void go(state.index-1);
  for(const id of ['ipNext','ipNextSide'])document.getElementById(id).onclick=()=>void go(state.index+1);
  document.getElementById('ipHome').onclick=showHome;
  document.getElementById('ipIndex').onclick=openIndex;
  document.getElementById('ipFullscreen').onclick=()=>{
   const button=document.getElementById('ipFullscreen');
   const active=document.fullscreenElement||document.webkitFullscreenElement;
   const element=document.documentElement;
   const action=active
    ?(document.exitFullscreen||document.webkitExitFullscreen)?.bind(document)
    :(element.requestFullscreen||element.webkitRequestFullscreen)?.bind(element);
   if(!action){button.title='Schermo intero non disponibile in questo browser';return;}
   try{
    Promise.resolve(action()).catch(()=>{button.title='Schermo intero non consentito dal browser';});
   }catch(_){button.title='Schermo intero non consentito dal browser';}
  };
  stageResizeObserver?.disconnect();
  const stage=document.getElementById('deckStage');
  if(stage&&typeof ResizeObserver!=='undefined'){
   stageResizeObserver=new ResizeObserver(()=>requestAnimationFrame(fit));
   stageResizeObserver.observe(stage);
  }
  requestAnimationFrame(fit);
 }
 function openIndex(){
  const panel=document.getElementById('ipSlidePanel');
  if(!panel)return;
  if(!panel.hidden){panel.hidden=true;return;}
  const rows=state.deck.map((slide,i)=>'<button type="button" data-slide="'+i+'"'+
   (i===state.index?' aria-current="true"':'')+'>'+(i+1)+'. '+esc(slide.title||slide.module?.title||'Slide')+
   (slide.type==='module'?' · Modulo':'')+'</button>').join('');
  panel.innerHTML='<button type="button" class="ip-panel-close" id="ipCloseIndex">✕ Chiudi</button>'+
   '<h2>Indice delle slide</h2><p class="ip-panel-note">Scegli una slide del corso assegnato.</p>'+rows;
  panel.hidden=false;
  document.getElementById('ipCloseIndex').onclick=()=>{panel.hidden=true;};
  panel.querySelectorAll('[data-slide]').forEach(el=>el.onclick=()=>void go(Number(el.dataset.slide)));
 }
 async function go(i){
  if(state.busy||!Number.isInteger(i)||i<0||i>=state.deck.length)return;
  state.busy=true;
  const slide=state.deck[i];
  try{
   const fields={slide_index:i,total_slides:state.deck.length,
    unit_id:slide.topic?.internal_unit_version_id||null};
   const result=await request('slide',fields);
   state.index=i;state.lastSlide=i;
   state.visitedSlides=Number(result.progress?.visited_slides||state.visitedSlides);
   makeSlide();
  }catch(e){showError(e);}
  finally{state.busy=false;}
 }
 async function boot(){
  state.token=parseToken();
  if(!state.token)return showError('Il collegamento personale è mancante o non valido.');
  try{
   const response=await request('open');
   state.bundle=response.course||{};
   state.course=adaptExactCourse(state.bundle);
   state.deck=window.SAFETY_DECK_RENDER.buildDeck(state.course);
   if(!state.deck.length)throw Error('Il corso selezionato non contiene slide.');
   state.visitedSlides=Math.max(0,Number(state.bundle.visited_slides||0));
   const last=state.bundle.last_slide_index;
   // A link used with the earlier unit-only reader may already have progress.
   // Preserve its resume point until this reader records the precise slide number.
   const previousUnit=state.bundle.last_unit_version_id||null;
   const oldUnitSlide=previousUnit?state.deck.findIndex(s=>s.topic?.internal_unit_version_id===previousUnit):-1;
   state.lastSlide=Number.isInteger(last)&&last>=0&&last<state.deck.length?last:(oldUnitSlide>=0?oldUnitSlide:null);
   showHome();
  }catch(e){showError(e);}
 }
 window.SAFETY_INTERNAL_SLIDE_V47_3={resume(){
  void go(state.lastSlide??0);
 },navigate(route){
  const segments=String(route||'').split('/');
  if(segments[0]==='deck')void go(Number(segments[2]));
  else showHome();
 }};
 // Original module slides call deckGo; only our token-gated navigation may move.
 window.deckGo=(_courseId,index)=>void go(Number(index));
 window.addEventListener('resize',()=>{if(document.body.classList.contains('deckmode'))requestAnimationFrame(fit);});
 window.visualViewport?.addEventListener?.('resize',()=>{if(document.body.classList.contains('deckmode'))requestAnimationFrame(fit);});
 document.addEventListener('fullscreenchange',()=>{if(document.body.classList.contains('deckmode'))requestAnimationFrame(fit);});
 document.addEventListener('keydown',event=>{
  if(document.getElementById('answerOverlay')||document.getElementById('videoOverlay')){
   if(event.key==='Escape'){window.closeAnswerOverlay?.();window.closeVideoPlayer?.();}return;
  }
  if(!document.body.classList.contains('deckmode')||state.busy)return;
  if(event.altKey||event.ctrlKey||event.metaKey||event.target?.closest?.('input,select,textarea,button,a,[role="dialog"]'))return;
  if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();void go(state.index+1);}
  if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();void go(state.index-1);}
 });
 void boot();
})();