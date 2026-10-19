/* SafetyTraining v22.6 — enrollment journey audit; read-only, never certifies. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const actor=()=>cloud()?.state?.user?.id||null;
  const root=()=>document.getElementById('adminShell');
  const host=()=>document.getElementById('adminContent');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const MAX_EDITIONS=100,MAX_ENROLLMENTS=100,MAX_DETAILS=1000;
  const state={editionId:'',seq:0,actorId:null,bound:false};
  const secs=v=>{const n=Math.max(0,Number(v)||0);return Math.floor(n/3600)+'h '+String(Math.floor(n%3600/60)).padStart(2,'0')+'m';};
  const group=(items,key)=>{const map=new Map();for(const item of items||[]){const id=item[key];if(!id)continue;if(!map.has(id))map.set(id,[]);map.get(id).push(item);}return map;};
  const countStatus=rows=>{const n={};for(const r of rows||[])n[r.status||'senza stato']=(n[r.status||'senza stato']||0)+1;return Object.entries(n).map(([s,k])=>s+': '+k).join(', ');};
  function inspect(enrollment,related){
    const learner=related.learners.get(enrollment.learner_id);
    const sessions=related.sessions.get(enrollment.id)||[];
    const progresses=related.progress.get(enrollment.id)||[];
    const tests=related.tests.get(enrollment.id)||[];
    const evidence=related.evidence.get(enrollment.id)||[];
    const practice=related.practice.get(enrollment.id)||[];
    const openSessions=sessions.filter(s=>!s.ended_at).length;
    const staleSessions=sessions.filter(s=>!s.ended_at&&s.last_heartbeat_at&&Date.now()-Date.parse(s.last_heartbeat_at)>15*60*1000).length;
    const missingHeartbeat=sessions.filter(s=>!s.ended_at&&!s.last_heartbeat_at).length;
    const sessionSeconds=sessions.reduce((sum,s)=>sum+Math.max(0,Number(s.active_seconds)||0),0);
    const reportedSeconds=Math.max(0,Number(enrollment.active_seconds)||0);
    const inconsistentTime=(sessions.length===0&&reportedSeconds>0) ||
      (sessions.length>0&&Math.abs(reportedSeconds-sessionSeconds)>60);
    const finishedTests=tests.filter(t=>t.completed_at);
    const passed=finishedTests.filter(t=>t.passed===true).length;
    const name=learner?[learner.first_name,learner.last_name].filter(Boolean).join(' ')||'Anagrafica senza nome':'Corsista non visibile';
    return {
      id:enrollment.id,name,
      enrollmentStatus:enrollment.status||'—',
      administrative:learner?'Anagrafica collegata':'Verificare collegamento corsista',
      didactics:enrollment.status==='revoked'?'Revocata':String(Number(enrollment.progress_pct||0))+'% contenuti · '+progresses.length+' unità tracciate',
      frequency:secs(reportedSeconds)+' registrate · '+sessions.length+' sessioni'+(openSessions?' · '+openSessions+' aperte':'')+
        (inconsistentTime?' · riconciliare tempi':''),
      tests:finishedTests.length?passed+'/'+finishedTests.length+' superati':'Nessun test concluso registrato',
      evidence:evidence.length+' evidenze'+(evidence.length?' ('+countStatus(evidence)+')':''),
      practice:practice.length+' valutazioni pratiche'+(practice.length?' ('+countStatus(practice)+')':''),
      alerts:[...(!learner?['anagrafica']:[]),...(openSessions?['sessioni aperte']:[]),...(staleSessions?['heartbeat scaduto']:[]),...(missingHeartbeat?['heartbeat assente']:[]),
        ...(inconsistentTime?['tempi non allineati']:[])],
      documentDecision:'Da verificare manualmente',
      hasSessions:sessions.length>0,hasTests:finishedTests.length>0,hasEvidence:evidence.length>0
    };
  }
  function ensureNav(){
    const nav=root()?.querySelector('.admin-nav nav');
    if(!nav||nav.querySelector('[data-path-audit]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.pathAudit='1';
    b.innerHTML='<span>☑</span> Controllo percorsi';
    const anchor=nav.querySelector('[data-quality-v22]')||nav.querySelector('[data-readiness-admin]');
    if(anchor)anchor.after(b);else nav.appendChild(b);
    b.addEventListener('click',()=>{root()?.classList.remove('admin-mobile-nav-open');render();});
  }
  const active=(seq,who)=>seq===state.seq&&actor()===who&&
    !!root()?.querySelector('[data-path-audit].active')&&!!host();
  async function limited(query,limit,label){
    const r=await query.limit(limit+1);
    if(r.error)throw new Error(label+': '+r.error.message);
    return {rows:(r.data||[]).slice(0,limit),truncated:r.count==null||r.count>limit||(r.data||[]).length>limit,total:r.count};
  }
  async function loadEdition(client,edition){
    const assignments=await limited(client.from('enrollments')
      .select('id,learner_id,edition_id,status,progress_pct,active_seconds,updated_at',{count:'exact'})
      .eq('edition_id',edition.id).order('updated_at',{ascending:false}),MAX_ENROLLMENTS,'Iscrizioni');
    if(!assignments.rows.length)return {assignments,diagnostics:[],incomplete:assignments.truncated};
    const ids=assignments.rows.map(x=>x.id);
    const learnerIds=[...new Set(assignments.rows.map(x=>x.learner_id).filter(Boolean))];
    const queries=[
      ['learners','id,first_name,last_name','id',learnerIds],
      ['learning_sessions','id,enrollment_id,started_at,ended_at,last_heartbeat_at,active_seconds','enrollment_id',ids],
      ['learning_progress','enrollment_id,unit_version_id,status','enrollment_id',ids],
      ['test_attempts','id,enrollment_id,completed_at,passed','enrollment_id',ids],
      ['enrollment_requirement_evidence','id,enrollment_id,requirement_key,status','enrollment_id',ids],
      ['enrollment_practice_assessments_v22','id,enrollment_id,requirement_key,status','enrollment_id',ids]
    ];
    const results=await Promise.all(queries.map(async ([table,columns,fk,keys])=>
      keys.length?limited(client.from(table).select(columns,{count:'exact'}).in(fk,keys),
        MAX_DETAILS,table):{rows:[],truncated:false,total:0}));
    const incomplete=assignments.truncated||results.some(r=>r.truncated);
    const related={
      learners:new Map(results[0].rows.map(r=>[r.id,r])),
      sessions:group(results[1].rows,'enrollment_id'),
      progress:group(results[2].rows,'enrollment_id'),
      tests:group(results[3].rows,'enrollment_id'),
      evidence:group(results[4].rows,'enrollment_id'),
      practice:group(results[5].rows,'enrollment_id')
    };
    return {assignments,diagnostics:assignments.rows.map(e=>inspect(e,related)),incomplete};
  }
  // A paper register is a blank attendance form sourced only from visible,
  // non-revoked enrollment identities, not an attendance or certificate claim.
  function attendanceRegister(edition,details){
    if(details.incomplete)return '<p role="alert" class="admin-error">Registro non disponibile: elenco parziale. Risolvere i limiti di lettura prima della stampa.</p>';
    const active=details.diagnostics.filter(x=>x.enrollmentStatus!=='revoked');
    if(!active.length)return '<p class="admin-note">Nessuna iscrizione attiva per compilare un registro.</p>';
    const rows=active.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(x.name)+'</td>'+
      '<td>__________</td><td>__________</td><td>__________</td>'+
      '<td>________________</td><td>________________</td></tr>').join('');
    return '<section class="admin-card admin-attendance-register" aria-label="Registro cartaceo presenze non compilato">'+
      '<h2>REGISTRO PRESENZE — DA COMPILARE E VALIDARE</h2>'+
      '<p>Edizione: <strong>'+esc(edition.title||'Senza titolo')+'</strong> · ID: '+esc(edition.id||'—')+'</p>'+
      '<p>Data: __________________ Sede: __________________ Modalità: __________________</p>'+
      '<p>Sessione / argomento: _______________________________________ Docente: _______________________</p>'+
      '<p>Orario previsto: da __________ a __________ Orario effettivo da convalidare: __________</p>'+
      '<table class="admin-table"><thead><tr><th>N.</th><th>Corsista iscritto</th>'+
      '<th>Entrata</th><th>Uscita</th><th>Ore convalidate</th><th>Firma corsista</th>'+
      '<th>Firma docente / riscontro</th></tr></thead><tbody>'+rows+'</tbody></table>'+
      '<p>Interruzioni, assenze, recuperi e anomalie: ______________________________________________________________</p>'+
      '<p>Firma docente ______________________ Firma responsabile ______________________ Data ______________</p>'+
      '<p><strong>NON È ATTESTATO NÉ PROVA DI PRESENZA GIÀ VALIDATA.</strong> Le colonne sono vuote: compilarle sulla base della presenza reale, riconciliare con eventuali tracciati digitali e conservare il registro secondo la procedura applicabile.</p>'+
      '<p class="admin-note">Iscrizioni revocate escluse: '+esc(details.diagnostics.length-active.length)+
      ' · Nessuna presenza, ora convalidata o firma viene precompilata.</p></section>';
  }
  function renderReport(edition,metadata,data){
    const all=data.diagnostics,activeRows=all.filter(x=>x.enrollmentStatus!=='revoked');
    const stat=(v,label)=>'<article class="admin-stat"><strong>'+esc(v)+'</strong><span>'+esc(label)+'</span></article>';
    const warn=data.incomplete?'<div class="admin-error" role="alert">Dati parziali: è stato raggiunto un limite di righe o non è disponibile il conteggio. Non usare questa vista per decidere completamenti o documenti.</div>':'';
    return '<section class="admin-card"><h2>Quadro percorso · '+esc(edition.title||metadata.courseTitle||'Edizione senza titolo')+'</h2>'+
      '<p class="admin-note">Edizione: '+esc(edition.status)+' · Corso: '+esc(metadata.courseTitle||'non visibile')+
      ' · Durata nominale: '+esc(metadata.nominalMinutes==null?'non disponibile':metadata.nominalMinutes+' minuti')+
      ' · Modalità: '+esc(edition.learning_mode||'—')+'</p>'+
      '<div class="admin-stats">'+stat(all.length,'Iscrizioni caricate')+
      stat(activeRows.length,'Non revocate')+
      stat(activeRows.filter(x=>x.hasSessions).length,'Con sessioni registrate')+
      stat(activeRows.filter(x=>x.hasTests).length,'Con test conclusi')+
      stat(activeRows.filter(x=>x.hasEvidence).length,'Con evidenze inserite')+
      stat(activeRows.filter(x=>x.alerts.length).length,'Da riconciliare')+'</div>'+warn+
      '<p class="admin-note">Sessioni ancora aperte, heartbeat assente o vecchio e contatori divergenti richiedono riconciliazione con il registro di presenza. I tempi sono registrazioni tecniche, non certificazioni di presenza. Il completamento dei contenuti, i test e le evidenze NON autorizzano automaticamente attestati. Verificare requisiti, modalità, firme, eventuale formazione pratica e registri cartacei prima di qualsiasi rilascio.</p>'+
      '<p><button type="button" data-path-quality>Apri qualità didattica</button> <button type="button" data-path-readiness>Apri readiness corsi</button> <button type="button" data-path-print>Stampa scheda istruttoria</button> <button type="button" data-path-register'+(data.incomplete||!activeRows.length?' disabled':'')+'>Stampa registro presenze</button></p></section>'+
      '<section class="admin-card"><h2>Verifica per iscrizione</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr>'+
      '<th>Corsista / gestione</th><th>Didattica</th><th>Frequenza registrata</th><th>Verifiche</th>'+
      '<th>Documentazione</th><th>Attestato</th></tr></thead><tbody>'+
      (all.length?all.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong><small class="admin-cell-note">'+
         esc(x.enrollmentStatus)+' · '+esc(x.administrative)+'</small></td>'+
         '<td>'+esc(x.didactics)+'</td><td>'+esc(x.frequency)+'</td><td>'+esc(x.tests)+'</td>'+
         '<td>'+esc(x.evidence)+'<small class="admin-cell-note">'+esc(x.practice)+'</small></td>'+
         '<td><strong>Da verificare</strong>'+ (x.alerts.length?'<small class="admin-cell-note">'+esc(x.alerts.join(', '))+'</small>':'')+
         '</td></tr>').join(''):'<tr><td colspan="6">Nessuna iscrizione per questa edizione.</td></tr>')+
      '</tbody></table></div></section>'+ attendanceRegister(edition,data)+
      '<section class="admin-card admin-path-review"><h2>Scheda di controllo documentale — NON È UN ATTESTATO</h2>'+ 
      '<p>□ Anagrafica e collegamento all’edizione verificati · □ Frequenza e registri cartacei verificati</p>'+ 
      '<p>□ Test/colloqui e relative firme verificati · □ Esercitazioni pratiche e valutazione docente verificate</p>'+ 
      '<p>□ Requisiti applicabili e documentazione controllati · □ Emissione attestato autorizzata separatamente</p>'+ 
      '<p>Firma responsabile ________________________ Data ______________ · Firma docente ________________________</p>'+ 
      '<p class="admin-note">Questa scheda è un promemoria istruttorio e non prova da sola la frequenza né conferisce validità legale alla formazione.</p></section>';
  }
  async function render(){
    ensureNav();if(!db()||!host()||!actor())return;
    const who=actor(),seq=++state.seq;
    if(who!==state.actorId){state.actorId=who;state.editionId='';}
    root()?.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
    root()?.querySelector('[data-path-audit]')?.classList.add('active');
    document.getElementById('adminTitle').textContent='Controllo percorsi';
    document.getElementById('adminSubtitle').textContent='Azienda e iscrizioni · didattica · frequenza · verifiche e documenti';
    host().innerHTML='<div class="admin-loading">Caricamento edizioni…</div>';
    try{
      const client=db();
      const editions=await limited(client.from('course_editions')
        .select('id,title,status,learning_mode,course_version_id',{count:'exact'})
        .order('created_at',{ascending:false}),MAX_EDITIONS,'Edizioni');
      if(!active(seq,who))return;
      if(!editions.rows.some(e=>e.id===state.editionId))state.editionId=editions.rows[0]?.id||'';
      const selected=editions.rows.find(e=>e.id===state.editionId);
      let header='<section class="admin-card"><div class="admin-card-head"><div><h2>Controllo incrociato del percorso</h2>'+
        '<p>Seleziona un’edizione. La verifica è in sola lettura e non emette attestati.</p></div>'+
        '<button type="button" data-path-refresh>Aggiorna dati</button></div>'+
        '<label>Edizione<select id="adminPathEdition" aria-label="Seleziona edizione">'+
        editions.rows.map(e=>'<option value="'+esc(e.id)+'"'+(e.id===state.editionId?' selected':'')+'>'+
        esc(e.title||'Senza titolo')+' · '+esc(e.status)+'</option>').join('')+'</select></label>'+
        (editions.truncated?'<p class="admin-error">Elenco edizioni parziale: usare il backend per un controllo completo.</p>':'')+'</section>';
      if(!selected){host().innerHTML=header+'<section class="admin-card">Nessuna edizione visibile.</section>';return;}
      host().innerHTML=header+'<div class="admin-loading">Analisi iscrizioni e dipendenze…</div>';
      const [detail,cv]=await Promise.all([
        loadEdition(client,selected),
        client.from('course_versions').select('id,course_id').eq('id',selected.course_version_id).maybeSingle()
      ]);
      if(cv.error)throw cv.error;
      let meta={courseTitle:null,nominalMinutes:null};
      if(cv.data?.course_id){
        const course=await client.from('courses').select('title,nominal_minutes').eq('id',cv.data.course_id).maybeSingle();
        if(course.error)throw course.error;
        meta={courseTitle:course.data?.title||null,nominalMinutes:course.data?.nominal_minutes??null};
      }
      if(!active(seq,who))return;
      host().innerHTML=header+renderReport(selected,meta,detail);
      window.SAFETY_ADMIN_LIST_TOOLS_V21?.schedule?.();
    }catch(error){if(active(seq,who))host().innerHTML='<div class="admin-error" role="alert">Controllo non disponibile: '+esc(error?.message||error)+'</div>';}
  }
  function bind(){
    if(state.bound)return;
    state.bound=true;
    document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,60));
    document.addEventListener('change',e=>{if(e.target?.id==='adminPathEdition'){
      state.editionId=e.target.value;void render();
    }});
    window.addEventListener('afterprint',()=>{document.body.classList.remove('admin-path-print','admin-attendance-print');});
    document.addEventListener('click',e=>{
      if(!root()?.querySelector('[data-path-audit].active'))return;
      if(e.target.closest('[data-path-refresh]')){void render();return;}
      if(e.target.closest('[data-path-print]')){document.body.classList.add('admin-path-print');window.print();return;}
      if(e.target.closest('[data-path-register]')){if(e.target.closest('[disabled]'))return;document.body.classList.add('admin-attendance-print');window.print();return;}
      if(e.target.closest('[data-path-quality]'))root()?.querySelector('[data-quality-v22]')?.click();
      if(e.target.closest('[data-path-readiness]'))root()?.querySelector('[data-readiness-admin]')?.click();
    });
  }
  async function boot(){
    for(let i=0;i<40&&!root();i++)await new Promise(r=>setTimeout(r,150));
    ensureNav();bind();
  }
  window.SAFETY_ADMIN_PATH_AUDIT_V23={inspect,renderReport,attendanceRegister,loadEdition,ensureNav,render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
