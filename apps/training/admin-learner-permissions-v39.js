/* SafetyTraining v39 — unified learner access and permissions; server RPCs enforce scope. */
(()=>{'use strict';
 const cloud=()=>window.SAFETY_CLOUD?.state;
 const db=()=>cloud()?.client;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'" :'&#39;'}[c]));
 const cap=k=>{const x=window.SAFETY_ADMIN_CAPABILITIES_STATE;return !!(x?.platform_admin||x?.capabilities?.[k]);};
 const allowed=()=>!!cloud()?.user?.id&&(cap('manage_learners')||cap('manage_enrollments'));
 const host=()=>document.getElementById('adminContent');
 const nav=()=>document.querySelector('#adminShell .admin-nav nav');
 const state={learners:[],selected:'',query:'',includeInactive:false,seq:0,detailSeq:0,busy:false};
 const selected=()=>state.learners.find(x=>x.id===state.selected);
 const name=x=>[x?.last_name,x?.first_name].filter(Boolean).join(' ')||x?.email||'Corsista';
 const rpc=async(n,p)=>{const {data,error}=await db().rpc(n,p);if(error)throw error;return data;};
 const current=(seq,actor)=>seq===state.seq&&cloud()?.user?.id===actor&&document.getElementById('adminLearnerPermissionsNav')?.classList.contains('active');
 function toast(s,isError=false){const x=host()?.querySelector('#lp39Feedback');if(x){x.textContent=s;x.style.color=isError?'#ff9e9e':'#9de2c5';}else if(isError)alert(s);}
 function ensureNav(){
  const n=nav();if(!n)return;
  let b=document.getElementById('adminLearnerPermissionsNav');
  if(!b){
   b=document.createElement('button');b.id='adminLearnerPermissionsNav';b.type='button';b.innerHTML='<span>🔑</span> Permessi corsisti';
   n.querySelector('[data-tab="learners"]')?.after(b);
   if(!b.isConnected)n.appendChild(b);
   b.onclick=()=>{document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open');void render();};
  }
  b.classList.toggle('hidden',!allowed());b.setAttribute('aria-hidden',String(!allowed()));
 }
 function setHeader(){
  nav()?.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  document.getElementById('adminLearnerPermissionsNav')?.classList.add('active');
  document.getElementById('adminTitle').textContent='Permessi corsisti';
  document.getElementById('adminSubtitle').textContent='Controllo centralizzato di account, iscrizioni e inviti';
 }
 function choices(){
  const q=state.query.trim().toLocaleLowerCase('it-IT');
  return state.learners.filter(l=>(state.includeInactive||l.active)&&(!q||[name(l),l.email].some(x=>String(x||'').toLocaleLowerCase('it-IT').includes(q))));
 }
 function directory(){
  const visible=choices();
  return '<section class="admin-card"><h2>Seleziona corsista</h2><label class="lp39-control">Cerca<input id="lp39Search" type="search" placeholder="Nome, cognome, email" value="'+esc(state.query)+'"></label>'+
  '<label class="lp39-check"><input id="lp39Inactive" type="checkbox"'+(state.includeInactive?' checked':'')+'> Mostra corsisti rimossi</label>'+
  '<div class="lp39-list" id="lp39List">'+visible.map(l=>'<button type="button" class="'+(l.id===state.selected?'selected':'')+'" data-lp39-id="'+esc(l.id)+'"><strong>'+esc(name(l))+'</strong><small>'+esc(l.email||'Senza email')+' · '+(l.active?'Attivo':'Rimosso')+'</small></button>').join('')+
  (visible.length?'':'<p>Nessun risultato.</p>')+'</div></section>';
 }
 function bindList(){
  const h=host();if(!h)return;
  h.querySelector('#lp39Search')?.addEventListener('input',e=>{state.query=e.target.value;refreshList();const input=h.querySelector('#lp39Search');input?.focus();input?.setSelectionRange(input.value.length,input.value.length);});
  h.querySelector('#lp39Inactive')?.addEventListener('change',e=>{state.includeInactive=e.target.checked;refreshList();});
  h.querySelectorAll('[data-lp39-id]').forEach(b=>b.onclick=()=>{
   state.selected=b.dataset.lp39Id;
   h.querySelectorAll('[data-lp39-id]').forEach(x=>x.classList.toggle('selected',x===b));
   void detail(state.seq,cloud()?.user?.id);
  });
 }
 function refreshList(){const old=host()?.querySelector('.lp39-layout > .admin-card');if(!old)return;old.outerHTML=directory();bindList();}
 const status=v=>({not_started:'Da iniziare',in_progress:'In corso',completed:'Completato',passed:'Superato',failed:'Non superato',revoked:'Revocato'})[v]||v||'—';
 async function detail(seq,actor){
  const l=selected(),target=host()?.querySelector('#lp39Detail');if(!target)return;
  const request=++state.detailSeq;
  if(!l){target.innerHTML='<section class="admin-card">Seleziona un corsista.</section>';return;}
  target.innerHTML='<section class="admin-card">Caricamento accessi…</section>';
  try{
   const [en,iv]=await Promise.all([
    db().from('enrollments').select('id,edition_id,status,progress_pct,active_seconds').eq('learner_id',l.id).order('enrolled_at',{ascending:false}).limit(250),
    db().from('learner_account_invitations').select('status,expires_at').eq('learner_id',l.id).maybeSingle()
   ]);
   if(en.error)throw en.error;if(iv.error)throw iv.error;
   const ids=[...new Set((en.data||[]).map(x=>x.edition_id))];
   let editions=[];
   if(ids.length){const r=await db().from('course_editions').select('id,title').in('id',ids);if(r.error)throw r.error;editions=r.data||[];}
   if(!current(seq,actor)||request!==state.detailSeq||state.selected!==l.id)return;
   const title=new Map(editions.map(x=>[x.id,x.title||'Edizione']));
   const rows=en.data||[];
   target.innerHTML='<section class="admin-card"><h2>'+esc(name(l))+'</h2><p>'+esc(l.email||'Email mancante')+'</p>'+
   '<div class="lp39-stats"><span>Profilo: <b>'+(l.active?'Attivo':'Rimosso')+'</b></span><span>Account: <b>'+(l.auth_user_id?'Collegato':'Non collegato')+'</b></span>'+
   '<span>Invito: <b>'+esc(iv.data?.status||'Assente')+'</b></span><span>Iscrizioni attive: <b>'+rows.filter(x=>x.status!=='revoked').length+'</b></span></div>'+
   '<p class="lp39-help"><b>Revoca corso</b> blocca soltanto una singola iscrizione. <b>Rimuovi corsista</b> blocca l’intero profilo formativo, conservando storico e prove.</p>'+
   '<div class="lp39-actions">'+(cap('manage_learners')?(l.active?'<button class="lp39-danger" data-lp39-action="archive" data-id="'+l.id+'">Rimuovi corsista da tutti i corsi</button>':
   '<button data-lp39-action="restore" data-id="'+l.id+'">Ripristina corsista</button>'):'')+
   (cap('manage_learners')&&iv.data&& !['accepted','revoked'].includes(iv.data.status)?'<button data-lp39-action="invite" data-id="'+l.id+'">Revoca invito</button>':'')+'</div>'+
   '<h3>Iscrizioni per corso</h3>'+
   '<div class="lp39-courses">'+rows.map(x=>'<div class="lp39-course"><div><strong>'+esc(title.get(x.edition_id)||'Edizione')+'</strong>'+
   '<small>'+esc(status(x.status))+' · '+Math.round(Number(x.progress_pct||0))+'% · '+Math.floor(Number(x.active_seconds||0)/60)+' min</small></div>'+
   (cap('manage_enrollments')?'<button data-lp39-action="'+(x.status==='revoked'?'restore-course':'revoke-course')+'" data-id="'+x.id+'"'+(!l.active?' disabled title="Ripristina prima il corsista"':'')+'>'+(x.status==='revoked'?'Riattiva corso':'Revoca corso')+'</button>':'')+'</div>').join('')+
   (rows.length?'':'<p>Nessun corso assegnato.</p>')+'</div></section>';
   target.querySelectorAll('[data-lp39-action]').forEach(b=>b.onclick=()=>void act(b.dataset.lp39Action,b.dataset.id));
  }catch(e){if(current(seq,actor)&&request===state.detailSeq)target.innerHTML='<section class="admin-card"><p class="admin-error">'+esc(e.message||e)+'</p></section>';}
 }
 async function render(){
  ensureNav();if(!allowed()||!db())return;
  const actor=cloud()?.user?.id,seq=++state.seq;
  setHeader();host().innerHTML='<div class="admin-loading">Caricamento permessi…</div>';
  try{
   const result=await db().from('learners').select('id,first_name,last_name,email,active,auth_user_id').order('last_name').limit(500);
   if(result.error)throw result.error;
   if(!current(seq,actor))return;
   state.learners=result.data||[];
   if(!selected())state.selected=state.learners.find(x=>x.active)?.id||state.learners[0]?.id||'';
   host().innerHTML='<div class="lp39-layout">'+directory()+'<div id="lp39Detail"></div></div><p id="lp39Feedback" role="status"></p>'+
    (state.learners.length>=500?'<p class="lp39-help">Visualizzati i primi 500 profili. Usa Corsisti per ricerche più estese.</p>':'');
   bindList();await detail(seq,actor);
  }catch(e){if(current(seq,actor))host().innerHTML='<section class="admin-card"><p class="admin-error">'+esc(e.message||e)+'</p></section>';}
 }
 async function act(kind,id){
  if(state.busy)return;
  const questions={
   archive:'Rimuovere questo corsista da tutti i corsi? Account scollegato, attività e storico conservati.',
   restore:'Ripristinare il corsista e, se disponibile, il suo account?',
   invite:'Revocare questo invito non ancora utilizzato?',
   'revoke-course':'Revocare soltanto questo corso, conservando frequenze e test?',
   'restore-course':'Riattivare l’iscrizione al corso?'
  };
  if(!confirm(questions[kind]))return;
  state.busy=true;
  host()?.querySelectorAll('[data-lp39-action]').forEach(b=>b.disabled=true);
  try{
   if(['archive','restore','invite'].includes(kind)&&!cap('manage_learners'))throw Error('Permesso di gestione corsisti mancante.');
   if(['revoke-course','restore-course'].includes(kind)&&!cap('manage_enrollments'))throw Error('Permesso di gestione iscrizioni mancante.');
   if(kind==='archive')await rpc('admin_archive_learner_v36',{p_learner_id:id});
   else if(kind==='restore')await rpc('admin_restore_learner_v37',{p_learner_id:id});
   else if(kind==='invite')await rpc('admin_revoke_learner_invite',{p_learner_id:id});
   else await rpc('admin_set_enrollment_revoked',{p_enrollment_id:id,p_revoked:kind==='revoke-course'});
   await render();toast('Permessi aggiornati.');
  }catch(e){toast('Operazione non riuscita: '+(e.message||e),true);}
  finally{state.busy=false;host()?.querySelectorAll('[data-lp39-action]').forEach(b=>b.disabled=false);}
 }
 function boot(){
  ensureNav();document.addEventListener('safety:admin-capabilities',ensureNav);
  document.addEventListener('safety:auth-changed',()=>{state.seq++;state.learners=[];state.selected='';ensureNav();});
  document.getElementById('adminConsoleBtn')?.addEventListener('click',ensureNav);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.SAFETY_ADMIN_LEARNER_PERMISSIONS_V39={render};
})();