/* SafetyTraining v22.13 — print actual projector slides, two per white A4 page. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const actor=()=>window.SAFETY_CLOUD?.state?.user?.id||null;
  const root=()=>document.getElementById('adminShell');
  const host=()=>document.getElementById('adminContent');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const state={courseId:'',versionId:'',seq:0,actorId:null,bound:false,stage:null};
  const MAX_COURSES=150,MAX_VERSIONS=40,MAX_SLIDES=700;
  const PHOTO=/^(?:\.\/)?assets\/[a-zA-Z0-9_/-]+\.(?:svg|png|jpe?g|webp)$/i;
  function safeSlideImage(src){
    const value=String(src||'');
    return PHOTO.test(value)&&!value.includes('..')?value.replace(/^\.\//,''):null;
  }
  function slideMarkup(slide,index,deckRenderer){
    if(slide.img?.src&&!safeSlideImage(slide.img.src)){
      throw Error('Immagine della slide '+(index+1)+' non ammessa per stampa: '+String(slide.img.src).slice(0,140));
    }
    const safe=slide.img?.src?{...slide,img:{...slide.img,src:safeSlideImage(slide.img.src)}}:slide;
    // The SAME HTML generator used by the screen projector, not a text summary.
    // Buttons are removed from the detached DOM by buildSheets.
    return deckRenderer(safe,index);
  }
  function sheetData(slides){
    if(!Array.isArray(slides)||slides.length===0)throw Error('Il percorso non contiene slide presentabili.');
    if(slides.length>MAX_SLIDES)throw Error('Il percorso produce '+slides.length+' slide. Supera il limite prudenziale di '+MAX_SLIDES+' per una singola stampa: suddividere il percorso.');
    const sheets=[];
    for(let i=0;i<slides.length;i+=2)sheets.push(slides.slice(i,i+2));
    return sheets;
  }
  function createSheets(course,version,slides,renderSlide){
    const sheets=sheetData(slides);
    const title=String(course?.title||'Corso');
    return '<div id="adminPrintableSlides" aria-label="Slide stampabili del percorso" class="slide-print-document">'+
      '<p class="slide-print-disclaimer">Materiale didattico · '+esc(title)+
      ' · versione '+esc(version?.version_number??'—')+
      ' · Non è attestato né registrazione di frequenza. Non contiene soluzioni riservate.</p>'+
      sheets.map((group,pi)=>'<section class="slide-print-sheet" data-sheet="'+(pi+1)+'">'+
        group.map((slide,si)=>{
          const i=pi*2+si;
          const b=slideMarkup(slide,i,renderSlide);
          return '<div class="slide-print-tile" data-slide="'+(i+1)+'">'+
            '<div class="slide-print-caption"><strong>'+esc(title)+'</strong><span>Modulo '+(slide.moduleIndex+1)+
            ' · Slide '+(i+1)+' / '+slides.length+'</span></div>'+
            '<div class="slide-print-frame"><article class="projector-slide type-'+esc(slide.type)+
            ' slide-print-projector">'+b+'</article></div>'+
            '</div>';
        }).join('')+
      '</section>').join('')+'</div>';
  }
  function removeInteraction(preview){
    // Interaction never belongs on printed handouts.
    // Video poster image is preserved when its clickable wrapper is removed.
    preview.querySelectorAll('.video-poster-button').forEach(b=>{
      const figure=b.querySelector('figure');
      if(figure)b.replaceWith(figure);
      else b.remove();
    });
    preview.querySelectorAll('button, input, select, textarea, script, iframe, video, audio').forEach(n=>n.remove());
    // Drop event handlers even if a future projector template introduces them.
    preview.querySelectorAll('*').forEach(n=>Array.from(n.attributes||[]).forEach(a=>{
      if(a.name.toLowerCase().startsWith('on'))n.removeAttribute(a.name);
    }));
  }
  function scaleSlides(preview){
    const frames=Array.from(preview?.querySelectorAll?.('.slide-print-frame')||[]);
    for(const frame of frames){
      const slide=frame.querySelector('.slide-print-projector');
      if(!slide)continue;
      const frameWidth=frame.getBoundingClientRect().width;
      const frameHeight=frame.getBoundingClientRect().height;
      if(frameWidth>0&&frameHeight>0){
        const scale=Math.min(frameWidth/1600,frameHeight/900);
        slide.style.transform='scale('+scale.toFixed(7)+')';
      }
      slide.classList.remove('compact','compact2');
      if(slide.scrollHeight>902||slide.scrollWidth>1602)slide.classList.add('compact');
      if(slide.scrollHeight>902||slide.scrollWidth>1602)slide.classList.add('compact2');
    }
  }
  async function limited(query,max,label){
    const r=await query.limit(max+1);
    if(r.error)throw Error(label+': '+r.error.message);
    if(r.count==null||r.count>max||(r.data||[]).length>max)throw Error(label+': lettura incompleta, stampa bloccata.');
    return r.data||[];
  }
  async function prepare(client,course,version){
    const base=window.SAFETY_ADMIN_PRINT_LESSONS_V23;
    const adapter=window.SAFETY_DB_SLIDES;
    const projection=window.SAFETY_DECK_RENDER;
    if(!base?.loadBook||!base?.inspectBook||!adapter?.adaptBundle||!projection?.buildDeck||!projection?.deckSlideBody)
      throw Error('Motore di stampa e presentazione non disponibile. Ricaricare la pagina.');
    const book=await base.loadBook(client,course,version);
    const preflight=base.inspectBook(book);
    if(!preflight.ready)throw Error('Stampa bloccata: '+preflight.issues.slice(0,4).join(' | '));
    const bundle={course,version,modules:book.modules.map(m=>({
      ...m,units:m.units.map(u=>({...u,stable_key:u.unit_version_id,default_minutes:u.minutes}))
    }))};
    const converted=adapter.adaptBundle(bundle);
    const slides=projection.buildDeck(converted);
    sheetData(slides);
    return {book,slides,renderSlide:projection.deckSlideBody};
  }
  function ensureNav(){
    const nav=root()?.querySelector('.admin-nav nav');
    if(!nav||nav.querySelector('[data-print-slides-nav]'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.dataset.printSlidesNav='1';
    btn.innerHTML='<span>▧</span> Stampa slide';
    const anchor=nav.querySelector('[data-print-lessons-nav]')||nav.querySelector('[data-tab="courses"]');
    if(anchor)anchor.after(btn);else nav.appendChild(btn);
    btn.addEventListener('click',()=>{root()?.classList.remove('admin-mobile-nav-open');void render();});
  }
  const current=(seq,who)=>seq===state.seq&&actor()===who&&!!host()&&
    !!root()?.querySelector('[data-print-slides-nav].active');
  async function render(){
    ensureNav();const client=db(),who=actor();
    if(!client||!who||!host())return;
    const seq=++state.seq;
    if(who!==state.actorId){state.actorId=who;state.courseId='';state.versionId='';}
    root()?.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
    root()?.querySelector('[data-print-slides-nav]')?.classList.add('active');
    document.getElementById('adminTitle').textContent='Stampa slide';
    document.getElementById('adminSubtitle').textContent='Due slide reali per foglio A4 bianco';
    host().innerHTML='<div class="admin-loading">Caricamento corsi…</div>';
    let selectors='';
    try{
      const authorized=await client.from('platform_admins').select('user_id').eq('user_id',who).maybeSingle();
      if(authorized.error||!authorized.data)throw Error('Accesso consentito solo agli amministratori della piattaforma.');
      const courses=await limited(client.from('courses')
        .select('id,title,stable_key,description,nominal_minutes',{count:'exact'})
        .eq('active',true).order('title'),MAX_COURSES,'Catalogo corsi');
      if(!current(seq,who))return;
      if(!courses.some(c=>c.id===state.courseId)){state.courseId=courses[0]?.id||'';state.versionId='';}
      const course=courses.find(c=>c.id===state.courseId);
      const versions=course?await limited(client.from('course_versions')
        .select('id,course_id,version_number,status',{count:'exact'})
        .eq('course_id',course.id).eq('status','published')
        .order('version_number',{ascending:false}),MAX_VERSIONS,'Versioni'):[];
      if(!current(seq,who))return;
      if(!versions.some(v=>v.id===state.versionId))state.versionId=versions[0]?.id||'';
      const version=versions.find(v=>v.id===state.versionId);
      selectors='<section class="admin-card slide-print-controls">'+
        '<h2>Stampa slide · 2 per foglio</h2>'+
        '<p>A4 verticale con fondo bianco, mantenendo titoli, box, immagini e grafica della presentazione. Nessuna risposta riservata.</p>'+
        '<label>Corso <select id="adminSlidesCourse">'+courses.map(c=>
        '<option value="'+esc(c.id)+'"'+(c.id===state.courseId?' selected':'')+'>'+esc(c.title)+'</option>').join('')+
        '</select></label> <label>Versione <select id="adminSlidesVersion">'+versions.map(v=>
        '<option value="'+esc(v.id)+'"'+(v.id===state.versionId?' selected':'')+'>v'+esc(v.version_number)+' · pubblicata</option>').join('')+
        '</select></label> <button type="button" data-print-slides-reload>Ricarica</button>'+
        '<button type="button" data-print-slides-run disabled>Stampa slide / salva PDF</button>'+
        '<p id="slidePrintReadiness" role="status" class="admin-note">Preparazione in corso…</p></section>';
      if(!course||!version){host().innerHTML=selectors+'<p class="admin-error">Nessuna versione pubblicata disponibile.</p>';return;}
      host().innerHTML=selectors+'<p class="admin-loading">Composizione delle slide originali…</p>';
      const result=await prepare(client,course,version);
      if(!current(seq,who))return;
      const markup=createSheets(course,version,result.slides,result.renderSlide);
      host().innerHTML=selectors+'<p class="admin-note">Anteprima completa · '+result.slides.length+
        ' slide · '+Math.ceil(result.slides.length/2)+' fogli A4. Le slide sono ricavate dal motore originale della presentazione.</p>'+markup;
      const preview=host().querySelector('#adminPrintableSlides');
      removeInteraction(preview);
      scaleSlides(preview);
      const imgCheck=await window.SAFETY_ADMIN_PRINT_LESSONS_V23.verifyPrintImages(preview,10000);
      if(!current(seq,who))return;
      const status=host().querySelector('#slidePrintReadiness');
      if(!imgCheck.ready){
        status.className='admin-error';
        status.textContent='Stampa bloccata: '+imgCheck.missing.length+
          ' immagini non caricate: '+imgCheck.missing.slice(0,4).join(', ');
      }else{
        status.textContent=result.slides.length+' slide · '+Math.ceil(result.slides.length/2)+
          ' fogli · '+imgCheck.checked+' immagini verificate. Pronto per la stampa.';
        host().querySelector('[data-print-slides-run]')?.removeAttribute('disabled');
      }
    }catch(error){
      if(current(seq,who))host().innerHTML=selectors+
        '<section class="admin-card"><p class="admin-error" role="alert">'+esc(error?.message||error)+
        '</p><button type="button" data-print-slides-reload>Riprova</button></section>';
    }
  }
  function startPrint(){
    if(state.stage)return false;
    const preview=host()?.querySelector('#adminPrintableSlides');
    if(!preview?.parentNode)return false;
    const marker=document.createComment('Restore SafetyTraining slide preview');
    preview.parentNode.insertBefore(marker,preview);
    const stage=document.createElement('div');stage.id='safetySlidePrintStage';
    stage.appendChild(preview);
    document.body.appendChild(stage);
    state.stage={preview,marker,stage};
    document.body.classList.add('admin-slides-print');
    scaleSlides(preview);
    return true;
  }
  function finishPrint(){
    if(!state.stage)return;
    const {preview,marker,stage}=state.stage;
    state.stage=null;
    if(marker.parentNode)marker.parentNode.insertBefore(preview,marker);
    marker.remove();stage.remove();
    document.body.classList.remove('admin-slides-print');
    scaleSlides(preview);
  }
  function bind(){
    if(state.bound)return;state.bound=true;
    document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.addEventListener('change',e=>{
      if(e.target?.id==='adminSlidesCourse'){state.courseId=e.target.value;state.versionId='';void render();}
      if(e.target?.id==='adminSlidesVersion'){state.versionId=e.target.value;void render();}
    });
    document.addEventListener('click',e=>{
      if(!root()?.querySelector('[data-print-slides-nav].active'))return;
      if(e.target.closest('[data-print-slides-reload]')){void render();return;}
      const btn=e.target.closest('[data-print-slides-run]');
      if(btn&&!btn.disabled&&startPrint()){
        try{window.print();}catch(error){finishPrint();throw error;}
      }
    });
    window.addEventListener('beforeprint',()=>{
      if(state.stage)scaleSlides(state.stage.preview);
    });
    window.addEventListener('afterprint',finishPrint);
  }
  async function boot(){
    for(let i=0;i<40&&!root();i++)await new Promise(r=>setTimeout(r,150));
    ensureNav();bind();
  }
  window.SAFETY_ADMIN_PRINT_SLIDES_V23={safeSlideImage,sheetData,createSheets,removeInteraction,scaleSlides,startPrint,finishPrint,prepare,render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
