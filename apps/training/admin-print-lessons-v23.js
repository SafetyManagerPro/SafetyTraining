/* SafetyTraining v22.8 — printable individual course/learning-unit manual (read-only). */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const actor=()=>window.SAFETY_CLOUD?.state?.user?.id||null;
  const root=()=>document.getElementById('adminShell');
  const host=()=>document.getElementById('adminContent');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const MAX_COURSES=150,MAX_MODULES=60,MAX_UNITS=300;
  const state={courseId:'',versionId:'',seq:0,actorId:null,bound:false,printing:false};
  const filteredKeys=/^(quiz|quizzes|answers?|correct(?:_.*)?|solutions?|explanations?_correct|answer_key|scoring|test_attempts|metadata|quality|teacher|teacher_notes|teacher_expansion|discussion_feedback|final_assessment|internal|access_token|invitation_hash|password|private|secret|grading|hints?)$/i;
  const sectionLabels={
    summary:'Introduzione',detail:'Approfondimento',objectives:'Obiettivi',focus:'Punti fondamentali',
    risks:'Rischi',prevention:'Misure di prevenzione',procedure:'Procedura operativa',
    operational:'Come procedere',sections:'Svolgimento della lezione',case:'Caso pratico',
    example_story:'Esempio',common_errors:'Errori da evitare',learner_takeaway:'Da ricordare',
    norm:'Norme richiamate',delivery_note:'Modalità e vincoli di erogazione',
    evidence_sources:'Fonti e approfondimenti',visuals:'Schemi didattici',
    guided:'Esercitazione guidata',deepdetail:'Approfondimenti',good:'Comportamenti corretti',bad:'Errori da evitare',idea_images:'Schemi aggiuntivi'
  };
  const nestedLabels={title:'',heading:'',name:'',minutes:'Durata indicativa (min)',procedure:'Procedura',
    procedures:'Procedure',steps:'Passaggi',checklist:'Checklist',risks:'Rischi',prevention:'Prevenzione',
    focus:'Punti chiave',controls:'Controlli',actions:'Azioni',action:'Azione',objective:'Obiettivo',
    objectives:'Obiettivi',summary:'Sintesi',detail:'Approfondimento',description:'Descrizione',
    context:'Contesto',example:'Esempio',examples:'Esempi',case:'Caso pratico',note:'Nota',
    notes:'Note',warning:'Attenzione',caution:'Precauzioni',stop_conditions:'Condizioni di arresto',
    common_errors:'Errori da evitare',good:'Comportamenti corretti',bad:'Errori',
    before:'Prima dell’attività',during:'Durante',after:'Dopo',step_by_step:'Passaggi operativi',
    if_problem:'Se si presenta un problema',who_to_involve:'Chi coinvolgere',remember:'Da ricordare',
    adaptation:'Adattamento al contesto',observe:'Osserva',importance:'Perché è importante',apply:'Applica',
    materials:'Materiali',
    demonstrations:'Dimostrazioni',scenario:'Scenario',question:'Domanda di riflessione'};
  const isPlain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const asText=v=>typeof v==='string'||typeof v==='number'?esc(String(v).slice(0,6500)):'';
  const paragraph=s=>String(s).trim()?'<p>'+asText(s).replace(/\r?\n/g,'<br>')+'</p>':'';
  function safeResource(url){
    try{const u=new URL(url,'https://invalid.example');
      return /^https?:$/.test(u.protocol)&&u.hostname!=='invalid.example'?u.href:null;
    }catch{return null;}
  }
  function renderSources(v){
    if(!Array.isArray(v))return '';
    const arr=v.slice(0,40).flatMap(x=>{
      if(typeof x==='string')return ['<li>'+asText(x)+'</li>'];
      if(!isPlain(x))return [];
      const href=safeResource(x.url);
      const title=asText(x.title||x.authority||x.source||x.name||'Fonte');
      return ['<li>'+(href?'<a href="'+esc(href)+'" rel="noopener noreferrer">'+title+'</a>':title)+
        (x.note?'<p>'+asText(x.note)+'</p>':'')+'</li>'];
    });
    return arr.length?'<ul>'+arr.join('')+'</ul>':'';
  }
  function renderVisuals(v){
    if(!Array.isArray(v))return '';
    const figures=v.slice(0,30).flatMap(x=>{
      if(!isPlain(x))return [];
      const asset=String(x.asset||x.file||'').replace(/^(\.\/)?assets\//,'');
      // Prevent external resources, relative traversal, or raw HTML in the printed content.
      if(!/^[a-zA-Z0-9_-]+\.(?:svg|png|jpe?g|webp)$/.test(asset))return [];
      return ['<figure><img loading="eager" alt="'+esc(x.caption||x.title||'Schema didattico')+
        '" src="assets/'+esc(asset)+'"><figcaption>'+asText(x.caption||x.title||'Schema didattico')+'</figcaption></figure>'];
    });
    return figures.join('');
  }
  function renderValue(v,depth=0){
    if(depth>5||v==null)return '';
    if(typeof v==='string'||typeof v==='number')return paragraph(v);
    if(Array.isArray(v)){
      const items=v.slice(0,80).map(x=>renderValue(x,depth+1)).filter(Boolean);
      return items.length?'<ul>'+items.map(html=>'<li>'+html+'</li>').join('')+'</ul>':'';
    }
    if(!isPlain(v))return '';
    const title=asText(v.title||v.heading||v.name||'');
    const children=Object.entries(v).filter(([k])=>!['title','heading','name'].includes(k)&&
      Object.prototype.hasOwnProperty.call(nestedLabels,k)&&!filteredKeys.test(k)).slice(0,35);
    const printable=children.map(([k,val])=>{
      const body=renderValue(val,depth+1);
      return body?'<section>'+(nestedLabels[k]?'<h5>'+esc(nestedLabels[k])+'</h5>':'')+body+'</section>':'';
    }).filter(Boolean);
    if(!printable.length)return '';
    return '<div class="print-unit-detail">'+(title?'<h4>'+title+'</h4>':'')+printable.join('')+'</div>';
  }
  // One shared whitelist is used for output and its completeness preflight.
  function printableBody(content){
    const value=isPlain(content)?content:{};
    return Object.entries(sectionLabels).map(([k,label])=>{
      const v=value[k];if(v==null)return '';
      const html=(k==='visuals'||k==='idea_images')?renderVisuals(v):k==='evidence_sources'?renderSources(v):renderValue(v);
      return html?'<section class="print-lesson-section"><h3>'+esc(label)+'</h3>'+html+'</section>':'';
    }).join('');
  }
  function inspectBook(book){
    const modules=Array.isArray(book?.modules)?book.modules:[];
    const failures=[],units=modules.flatMap((m,mi)=>{
      if(!Array.isArray(m.units)||!m.units.length)failures.push('Modulo '+(mi+1)+' senza Learning Unit.');
      return Array.isArray(m.units)?m.units:[];
    });
    units.forEach((u,i)=>{
      if(u.unitStatus!=='published')failures.push('Unità '+(i+1)+': versione LU non pubblicata.');
      if(!printableBody(u.content))failures.push('Unità '+(i+1)+': nessun contenuto didattico stampabile.');
    });
    if(!modules.length||!units.length)failures.push('Percorso senza moduli o lezioni.');
    return {moduleCount:modules.length,unitCount:units.length,issues:failures,ready:failures.length===0};
  }
  function lessonHtml(unit,i){
    const content=isPlain(unit.content)?unit.content:{};
    const title=asText(content.title||unit.title||'Learning Unit '+(i+1));
    const body=printableBody(content);
    const sanction=window.SAFETY_NORMATIVE_SANCTIONS_V23?.renderFor?.({
      title:String(content.title||unit.title||''),
      summary:String(content.summary||''),
      detail:String(content.detail||''),
      norm:String(content.norm||'')
    })||'';
    return '<article class="print-lesson" id="print-unit-'+(i+1)+'"><h2>'+(i+1)+'. '+title+'</h2>'+
      '<p class="print-unit-meta">Unità didattica '+(i+1)+' · '+asText(unit.minutes??'—')+
      ' minuti nominali · versione LU '+asText(unit.unitVersion??'—')+'</p>'+
      (body||'<p>Contenuto testuale non disponibile per questa unità.</p>')+
      sanction+'</article>';
  }
  function documentHtml(book){
    const moduleRows=book.modules.map((m,i)=>'<li>Modulo '+(i+1)+': '+asText(m.title)+
      ' ('+m.units.length+' unità)</li>').join('');
    let i=0;
    const modules=book.modules.map((m,index)=>
      '<section class="print-module"><h2>Modulo '+(index+1)+': '+asText(m.title)+'</h2>'+
      '<p>Durata nominale modulo: '+asText(m.minutes??'—')+' minuti</p>'+
      m.units.map(u=>lessonHtml(u,i++)).join('')+'</section>').join('');
    return '<section id="adminPrintableLessons" class="admin-card" aria-label="Dispensa del singolo percorso formativo">'+
      '<div class="print-cover"><p class="print-kicker">SAFETYTRAINING · MATERIALE DIDATTICO</p>'+
      '<h1>'+asText(book.course.title)+'</h1>'+
      '<p>'+asText(book.course.description||'')+'</p><p><strong>Versione corso '+asText(book.version.version_number)+
      '</strong> · '+asText(book.version.status)+
      ' · '+asText(book.course.nominal_minutes)+' minuti nominali</p>'+
      '<p class="print-caution">Questa dispensa non è un attestato e non dimostra frequenza, superamento di test o validazione pratica. Materiale tratto dalle lezioni della versione indicata, senza risposte riservate dei quiz.</p>'+
      '<p>Data di stampa: '+new Date().toLocaleDateString('it-IT')+'</p></div>'+
      '<section class="print-toc"><h2>Indice dei moduli</h2><ol>'+moduleRows+'</ol></section>'+
      modules+'</section>';
  }
  async function limited(query,max,label){
    const r=await query.limit(max+1);
    if(r.error)throw new Error(label+': '+r.error.message);
    if(r.count==null||r.count>max||(r.data||[]).length>max)throw new Error(label+': risultato incompleto, stampa bloccata.');
    return r.data||[];
  }
  async function loadBook(client,course,version){
    if(version.course_id!==course.id||version.status!=='published')throw Error('Versione non pubblicata o non appartenente al corso.');
    const modules=await limited(client.from('course_modules').select('id,title,module_key,position,nominal_minutes',{count:'exact'})
      .eq('course_version_id',version.id).order('position'),MAX_MODULES,'Moduli');
    if(!modules.length)throw Error('Nessun modulo leggibile nella versione selezionata.');
    const links=await limited(client.from('course_module_units').select('module_id,unit_version_id,position,required',{count:'exact'})
      .in('module_id',modules.map(x=>x.id)).order('position'),MAX_UNITS,'Collegamenti Learning Unit');
    if(!links.length)throw Error('Nessuna Learning Unit nella versione selezionata.');
    const ids=[...new Set(links.map(x=>x.unit_version_id))];
    const versions=await limited(client.from('learning_unit_versions').select('id,learning_unit_id,version_number,status,content',{count:'exact'})
      .in('id',ids),MAX_UNITS,'Testi Learning Unit');
    const units=await limited(client.from('learning_units').select('id,title,default_minutes',{count:'exact'})
      .in('id',[...new Set(versions.map(v=>v.learning_unit_id))]),MAX_UNITS,'Anagrafiche Learning Unit');
    const textMap=new Map(versions.map(v=>[v.id,v]));
    const labelMap=new Map(units.map(v=>[v.id,v]));
    const linksByModule=new Map(modules.map(m=>[m.id,[]]));
    for(const link of links){
      const v=textMap.get(link.unit_version_id);const base=v&&labelMap.get(v.learning_unit_id);
      if(!v||!base||!linksByModule.has(link.module_id))throw Error('Unità non visibile o incompleta. Stampa bloccata.');
      if(v.status!=='published')throw Error('La versione di una Learning Unit non è pubblicata. Stampa bloccata.');
      linksByModule.get(link.module_id).push({...link,title:base.title,content:v.content,
        minutes:v.content?.minutes??base.default_minutes,unitVersion:v.version_number,unitStatus:v.status});
    }
    return {course,version,modules:modules.map(m=>({...m,minutes:m.nominal_minutes,
      units:linksByModule.get(m.id).sort((a,b)=>a.position-b.position)}))};
  }
  function ensureNav(){
    const nav=root()?.querySelector('.admin-nav nav');
    if(!nav||nav.querySelector('[data-print-lessons-nav]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.printLessonsNav='1';
    b.innerHTML='<span>▤</span> Stampa lezioni';
    const anchor=nav.querySelector('[data-path-audit]')||nav.querySelector('[data-quality-v22]')||nav.querySelector('[data-tab="courses"]');
    if(anchor)anchor.after(b);else nav.appendChild(b);
    b.addEventListener('click',()=>{root()?.classList.remove('admin-mobile-nav-open');void render();});
  }
  const current=(seq,who)=>seq===state.seq&&actor()===who&&
    !!root()?.querySelector('[data-print-lessons-nav].active')&&!!host();
  async function render(){
    ensureNav();const client=db(),who=actor();if(!client||!who||!host())return;
    const seq=++state.seq;
    if(who!==state.actorId){state.actorId=who;state.courseId='';state.versionId='';}
    root()?.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
    root()?.querySelector('[data-print-lessons-nav]')?.classList.add('active');
    document.getElementById('adminTitle').textContent='Stampa lezioni';
    document.getElementById('adminSubtitle').textContent='Dispensa completa per corso e versione pubblicata';
    host().innerHTML='<div class="admin-loading">Caricamento contenuti della versione…</div>';
    let selectors='';
    try{
      const auth=await client.from('platform_admins').select('user_id').eq('user_id',who).maybeSingle();
      if(auth.error||!auth.data)throw Error('Richiesta non autorizzata come amministratore di piattaforma.');
      const courses=await limited(client.from('courses').select('id,title,stable_key,description,nominal_minutes',{count:'exact'})
        .eq('active',true).order('title'),MAX_COURSES,'Catalogo');
      if(!current(seq,who))return;
      if(!courses.some(x=>x.id===state.courseId)){state.courseId=courses[0]?.id||'';state.versionId='';}
      const course=courses.find(x=>x.id===state.courseId);
      const versions=course?await limited(client.from('course_versions')
        .select('id,course_id,version_number,status',{count:'exact'})
        .eq('course_id',course.id).eq('status','published').order('version_number',{ascending:false}),40,'Versioni pubblicate'):[];
      if(!current(seq,who))return;
      if(!versions.some(x=>x.id===state.versionId))state.versionId=versions[0]?.id||'';
      const version=versions.find(v=>v.id===state.versionId);
      selectors='<section class="admin-card print-selector"><h2>Dispensa del singolo corso</h2>'+
        '<p>Seleziona il corso e la versione pubblicata. Stampa o salva in PDF dal browser: niente test riservati, presenze o attestati.</p>'+
        '<label>Corso <select id="printLessonCourse">'+courses.map(c=>
          '<option value="'+esc(c.id)+'"'+(c.id===state.courseId?' selected':'')+'>'+esc(c.title)+'</option>').join('')+
        '</select></label> <label>Versione <select id="printLessonVersion">'+versions.map(v=>
          '<option value="'+esc(v.id)+'"'+(v.id===state.versionId?' selected':'')+'>v'+esc(v.version_number)+' · pubblicata</option>').join('')+
        '</select></label> <button type="button" data-print-lessons-refresh>Ricarica</button>'+
        '<button type="button" data-print-lessons disabled>Stampa lezioni / salva PDF</button></section>';
      if(!course||!version){host().innerHTML=selectors+'<div class="admin-error">Nessuna versione pubblicata stampabile per questa scelta.</div>';return;}
      host().innerHTML=selectors+'<p class="admin-loading">Preparazione moduli e Learning Unit…</p>';
      const book=await loadBook(client,course,version);
      if(!current(seq,who))return;
      const report=inspectBook(book);
      const summary='<section class="admin-card" role="status"><h2>Verifica dispensa</h2>'+
        '<p><strong>'+report.moduleCount+' moduli · '+report.unitCount+' Learning Unit</strong> · corso v'+
        esc(version.version_number)+'</p>'+
        (report.ready?'<p class="admin-ok">Tutte le unità della versione selezionata hanno contenuti didattici stampabili.</p>':
          '<div class="admin-error"><strong>Stampa bloccata: contenuti incompleti</strong><ul>'+
            report.issues.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>')+
        '<p class="admin-note">Controllo della completezza tecnica del materiale, non certificazione della conformità normativa.</p></section>';
      host().innerHTML=selectors+summary+documentHtml(book);
      if(report.ready)host().querySelector('[data-print-lessons]')?.removeAttribute('disabled');
    }catch(error){if(current(seq,who))host().innerHTML=selectors+'<section class="admin-card"><p role="alert" class="admin-error">'+
      esc(error?.message||error)+'</p><button type="button" data-print-lessons-refresh>Riprova</button></section>';}
  }
  function bind(){
    if(state.bound)return;state.bound=true;
    document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.addEventListener('change',e=>{
      if(e.target?.id==='printLessonCourse'){state.courseId=e.target.value;state.versionId='';void render();}
      if(e.target?.id==='printLessonVersion'){state.versionId=e.target.value;void render();}
    });
    document.addEventListener('click',e=>{
      if(!root()?.querySelector('[data-print-lessons-nav].active'))return;
      if(e.target.closest('[data-print-lessons-refresh]')){void render();return;}
      const b=e.target.closest('[data-print-lessons]');
      if(b&&!b.disabled&&host()?.querySelector('#adminPrintableLessons')){
        document.body.classList.add('admin-course-print');window.print();
      }
    });
    window.addEventListener('afterprint',()=>document.body.classList.remove('admin-course-print'));
  }
  async function boot(){
    for(let i=0;i<40&&!root();i++)await new Promise(r=>setTimeout(r,150));
    ensureNav();bind();
  }
  window.SAFETY_ADMIN_PRINT_LESSONS_V23={lessonHtml,documentHtml,renderValue,renderSources,renderVisuals,inspectBook,loadBook,render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
