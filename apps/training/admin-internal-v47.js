/* SafetyTraining v47 — corsisti interni: independent, non-certifying link-only workflow. */
(()=>{'use strict';
 const ORIGIN='https://safety-training-safety-manager.vercel.app';
 const state={open:false,busy:false,seq:0,org:'',data:null,link:'',email:'',notice:'',error:false};
 const db=()=>window.SAFETY_CLOUD?.state?.client;
 const gate=()=>window.SAFETY_ACCESS_V46_10?.state;
 const root=()=>document.getElementById('adminContent');
 const nav=()=>document.querySelector('#adminShell .admin-nav nav');
 const allowed=()=>!!db()&&(gate()?.phase==='admin'||(gate()?.phase==='staff'&&gate()?.staffRoles?.some(r=>['organization_admin','training_manager'].includes(r))));
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const fmt=v=>v?new Date(v).toLocaleString('it-IT'):'—';
 const percent=(a)=>Number(a.total_slides)>0?
  Math.round(100*Number(a.visited_slides||0)/Math.max(1,Number(a.total_slides))):
  Math.round(100*Number(a.visited_count||0)/Math.max(1,Number(a.total_units||0)));
 const status=a=>!a.active?(percent(a)>=100?'Storico · terminato':'Storico · disattivato'):!a.started_at?'Non iniziato':percent(a)>=100?'Tutte le slide aperte':'In corso';
 function ensureNav(){
  const n=nav();if(!n)return;
  let btn=document.getElementById('adminInternalV47Nav');
  if(!btn){
   btn=document.createElement('button');btn.id='adminInternalV47Nav';btn.type='button';
   btn.innerHTML='<span>🔗</span> Corsisti interni';
   btn.addEventListener('click',()=>void open());
   n.prepend(btn);
  }
  btn.classList.toggle('hidden',!allowed());
  window.SAFETY_ADMIN_MENU_V39?.reconcile?.();
 }
 function notice(message,isError=false){
  state.notice=message;state.error=isError;
  const box=document.getElementById('iv47Notice');
  if(box){box.textContent=message;box.className='iv47-notice'+(isError?' iv47-error':'');}
 }
 const rpc=async(name,args)=>{
  const {data,error}=await db().rpc(name,args);
  if(error)throw new Error(String(error.message||'Operazione non riuscita').slice(0,220));
  return data;
 };
 async function load(){
  if(!allowed())throw new Error('Accesso amministrativo non autorizzato.');
  const seq=++state.seq;
  const data=await rpc('internal_admin_state_v47',{p_org_id:state.org||null});
  if(seq!==state.seq||!allowed())return false;
  if(!data||!Array.isArray(data.assignments)||!Array.isArray(data.courses))
   throw new Error('Dati Corsisti interni non disponibili. Premi Riprova.');
  state.data=data;
  state.org=data.organization_id;
  return true;
 }
 async function requireData(){
  if(state.data&&Array.isArray(state.data.assignments)&&Array.isArray(state.data.courses))return state.data;
  if(!await load()||!state.data)throw new Error('Sessione aggiornata. Riapri Corsisti interni e riprova.');
  return state.data;
 }
 function header(){
  nav()?.querySelectorAll('button.active').forEach(b=>b.classList.remove('active'));
  document.getElementById('adminInternalV47Nav')?.classList.add('active');
  const t=document.getElementById('adminTitle'),s=document.getElementById('adminSubtitle');
  if(t)t.textContent='Corsisti interni';
  if(s)s.textContent='Scegli un corso, condividi un link e controlla le sezioni visitate';
 }
 const option=(x,label,selected)=>'<option value="'+esc(x)+'"'+(selected?' selected':'')+'>'+esc(label)+'</option>';
 async function render(){
  if(!state.open||!allowed()||!root()||!state.data)return;
  ensureNav();header();
  const d=state.data,courses=d.courses||[],people=d.people||[],assignments=d.assignments||[];
  const active=assignments.filter(a=>a.active),started=active.filter(a=>a.started_at),finished=active.filter(a=>a.started_at&&percent(a)===100);
  const orgs=(d.organizations||[]).map(o=>option(o.id,o.name,o.id===state.org)).join('');
  const choices=courses.map(c=>option(c.version_id,c.title+' · v'+c.version_number+' ('+c.unit_count+' sezioni)',false)).join('');
  const roster='<option value="">Nuovo corsista</option>'+people.map(p=>option(p.id,p.last_name+' '+p.first_name+' · '+p.fiscal_code,false)).join('');
  root().innerHTML='<div class="iv47">'+
   '<section class="iv47-card"><h2>Corsisti interni · formazione non certificante</h2>'+
   '<p>Un corsista può seguire più corsi contemporaneamente e nel tempo, con link e progressi separati. Nessun account o password. La percentuale non è una certificazione.</p>'+
   '<div class="iv47-metrics"><div class="iv47-metric"><strong>'+active.length+'</strong><span>Assegnazioni attive</span></div>'+
   '<div class="iv47-metric"><strong>'+started.length+'</strong><span>Percorsi iniziati</span></div>'+
   '<div class="iv47-metric"><strong>'+finished.length+'</strong><span>Tutte le sezioni aperte</span></div></div>'+
   '<label>Organizzazione<select id="iv47Org">'+orgs+'</select></label></section>'+
   '<section class="iv47-card"><h2>1. Assegna un corso</h2>'+
   '<p>Scegli un corsista già presente per assegnare altri corsi, oppure inseriscine uno nuovo. L’email è facoltativa.</p>'+
   '<label>Corsista già presente (facoltativo)<select id="iv47Person">'+roster+'</select></label>'+
   '<form id="iv47Form" class="iv47-fields"><label>Nome<input name="first_name" id="iv47First" maxlength="120" required autocomplete="off"></label>'+
   '<label>Cognome<input name="last_name" id="iv47Last" maxlength="120" required autocomplete="off"></label>'+
   '<label>Codice fiscale<input name="fiscal_code" id="iv47CF" maxlength="16" minlength="16" pattern="[a-zA-Z0-9]{16}" required autocomplete="off" style="text-transform:uppercase"></label>'+
   '<label>Email facoltativa<input name="email" type="email" id="iv47Email" autocomplete="off"></label>'+
   '<label style="grid-column:1/-1">Corso da assegnare<select id="iv47Course" name="course_version_id" required>'+choices+'</select></label>'+
   '<div class="iv47-actions" style="grid-column:1/-1"><button type="submit" class="primary"'+(courses.length?'':' disabled')+'>Genera link personale</button></div></form>'+
   (courses.length?'':'<p>Nessun corso pubblicato e disponibile per questa organizzazione.</p>')+
   '</section>'+
   '<section class="iv47-card" id="iv47LinkCard"'+(state.link?'':' hidden')+'><h2>2. Condividi il link</h2>'+
   '<p>Il corsista apre il collegamento e segue direttamente il corso. Il link si mostra una volta sola: per sostituirlo puoi generarne uno nuovo, conservando i progressi.</p>'+
   '<div class="iv47-clipboard"><input readonly id="iv47LinkValue" aria-label="Link personale" value="'+esc(state.link)+'">'+
   '<div class="iv47-actions"><button type="button" class="primary" id="iv47Copy">Copia link</button>'+
   '<button type="button" id="iv47EmailLink">Apri email</button>'+
   '<button type="button" id="iv47Share">Condividi</button></div></div></section>'+
   '<section class="iv47-card"><h2>3. Controlla i progressi</h2>'+
   '<label>Cerca nome, codice fiscale o corso<input id="iv47Search" placeholder="Cerca corsista o corso…" autocomplete="off"></label>'+
   '<div class="iv47-table"><table><thead><tr><th>Corsista</th><th>Corso</th><th>Avanzamento</th><th>Ultima attività</th><th>Stato</th><th>Gestione link</th></tr></thead>'+
   '<tbody id="iv47Rows"></tbody></table></div></section>'+
   '<p id="iv47Notice" class="iv47-notice'+(state.error?' iv47-error':'')+'" role="status" aria-live="polite">'+esc(state.notice)+'</p>'+
   '</div>';
  bind();paintRows();
 }
 function paintRows(){
  const body=document.getElementById('iv47Rows');if(!body)return;
  const q=(document.getElementById('iv47Search')?.value||'').toLowerCase();
  const items=(state.data?.assignments||[]).filter(a=>[a.first_name,a.last_name,a.fiscal_code,a.course_title].some(x=>String(x||'').toLowerCase().includes(q)));
  body.innerHTML=items.map(a=>{
   const pct=percent(a);
   return '<tr><td><strong>'+esc(a.last_name+' '+a.first_name)+'</strong><div class="iv47-muted">'+esc(a.fiscal_code)+'</div></td>'+
    '<td>'+esc(a.course_title)+' <small>v'+esc(a.version_number)+'</small><div class="iv47-muted">Assegnato: '+esc(fmt(a.created_at))+'</div></td>'+
    '<td><progress max="100" value="'+pct+'"></progress><div>'+pct+'% · '+
     (Number(a.total_slides)>0?esc(a.visited_slides)+'/'+esc(a.total_slides)+' slide aperte · ultima slide '+(Number(a.last_slide_index||0)+1):
      esc(a.visited_count)+'/'+esc(a.total_units)+' sezioni')+'</div></td>'+
    '<td>'+esc(fmt(a.last_activity_at||a.last_opened_at))+'</td><td>'+esc(status(a))+'</td><td>'+
    '<button type="button" data-internal-rotate="'+esc(a.id)+'">'+(a.active?'Nuovo link':'Nuovo ciclo')+'</button> '+
    (a.active?'<button type="button" data-internal-repeat="'+esc(a.id)+'">Ripeti corso</button> ':'')+
    (a.active?'<button type="button" class="danger" data-internal-revoke="'+esc(a.id)+'">Disattiva</button>':'')+'</td></tr>';
  }).join('')||'<tr><td colspan="6">Nessuna assegnazione interna.</td></tr>';
  body.querySelectorAll('[data-internal-rotate]').forEach(btn=>btn.onclick=()=>void rotate(btn.dataset.internalRotate));
  body.querySelectorAll('[data-internal-revoke]').forEach(btn=>btn.onclick=()=>void revoke(btn.dataset.internalRevoke));
  body.querySelectorAll('[data-internal-repeat]').forEach(btn=>btn.onclick=()=>void repeatCourse(btn.dataset.internalRepeat));
 }
 const newToken=()=>{
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 };
 const tokenHash=async token=>{
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 };
 function showLink(token,email=''){
  state.link=ORIGIN+'/interno.html#t='+token;
  state.email=email;
 }
 async function operate(fn){
  if(state.busy||!allowed())return;
  state.busy=true;
  root()?.querySelectorAll('.iv47 button').forEach(b=>b.disabled=true);
  try{await fn();}catch(error){notice(error?.message||'Operazione non riuscita.',true);}
  finally{
   state.busy=false;
   root()?.querySelectorAll('.iv47 button').forEach(b=>b.disabled=false);
  }
 }
 async function assign(event){
  event.preventDefault();
  await operate(async()=>{
   const f=document.getElementById('iv47Form');
   const first=f.querySelector('#iv47First').value.trim();
   const last=f.querySelector('#iv47Last').value.trim();
   const cf=f.querySelector('#iv47CF').value.trim().toUpperCase().replace(/\s/g,'');
   const email=f.querySelector('#iv47Email').value.trim();
   const version=f.querySelector('#iv47Course').value;
   if(!first||!last||!/^[A-Z0-9]{16}$/.test(cf)||!version)throw Error('Compila nome, cognome, codice fiscale e corso.');
   // Auth refresh can invalidate cached UI data while the form stays visible.
   const snapshot=await requireData();
   const existing=(snapshot.assignments||[]).find(a=>a.fiscal_code===cf&&a.course_version_id===version&&a.active);
   if(existing){
    notice('Corso già assegnato. Usa “Nuovo link” per continuare da dove era arrivato, oppure “Ripeti corso” per un nuovo percorso con storico separato.');
    return;
   }
   const token=newToken();
   await rpc('internal_admin_assign_v47',{p_org_id:state.org,p_first_name:first,p_last_name:last,p_fiscal_code:cf,p_email:email||null,p_course_version_id:version,p_token_hash:await tokenHash(token)});
   if(!state.open||!allowed())return;
   showLink(token,email);notice('Assegnazione salvata. Condividi subito il link personale.');
   if(await load())await render();
  });
 }
 async function rotate(id){
  await operate(async()=>{
   const snapshot=await requireData();
   const a=snapshot.assignments.find(x=>x.id===id);
   if(!a)throw Error('Assegnazione non disponibile. Aggiorna la schermata.');
   if(!a.active){
    if(!confirm('Avviare un nuovo percorso di “'+a.course_title+'” per '+a.first_name+' '+a.last_name+'? Il precedente e i suoi progressi resteranno nello storico.'))return;
    const token=newToken();
    await rpc('internal_admin_assign_v47',{p_org_id:state.org,p_first_name:a.first_name,p_last_name:a.last_name,
     p_fiscal_code:a.fiscal_code,p_email:a.email||null,p_course_version_id:a.course_version_id,p_token_hash:await tokenHash(token)});
    if(!state.open||!allowed())return;
    showLink(token,a.email||'');notice('Nuovo percorso creato, storico conservato.');
    if(await load())await render();
    return;
   }
   if(!confirm('Generare un nuovo link per '+a.first_name+' '+a.last_name+'? Il vecchio link smetterà di funzionare, ma i progressi resteranno invariati.'))return;
   const token=newToken();
   await rpc('internal_admin_link_v47',{p_assignment_id:id,p_token_hash:await tokenHash(token),p_revoke:false});
   if(!state.open||!allowed())return;
   showLink(token,a.email||'');notice('Nuovo link pronto. Il collegamento precedente è stato disattivato.');
   if(await load())await render();
  });
 }
 async function repeatCourse(id){
  await operate(async()=>{
   const snapshot=await requireData();
   const a=snapshot.assignments.find(x=>x.id===id&&x.active);
   if(!a)throw Error('Percorso non più attivo. Aggiorna la schermata.');
   if(!confirm('Ripetere “'+a.course_title+'” per '+a.first_name+' '+a.last_name+'? Il percorso precedente sarà conservato nello storico, il vecchio link disattivato e il nuovo inizierà da zero.'))return;
   const token=newToken();
   await rpc('internal_admin_repeat_v47_6',{p_assignment_id:id,p_token_hash:await tokenHash(token)});
   if(!state.open||!allowed())return;
   showLink(token,a.email||'');notice('Nuovo percorso creato. Il precedente resta nello storico con i progressi conservati.');
   if(await load())await render();
  });
 }
 async function revoke(id){
  await operate(async()=>{
   const snapshot=await requireData();
   const a=snapshot.assignments.find(x=>x.id===id);
   if(!a||!confirm('Disattivare il link di '+a.first_name+' '+a.last_name+'? Le sezioni già visitate resteranno registrate.'))return;
   await rpc('internal_admin_link_v47',{p_assignment_id:id,p_token_hash:null,p_revoke:true});
   state.link='';notice('Link disattivato. Progressi conservati.');
   if(await load())await render();
  });
 }
 function bind(){
  const org=document.getElementById('iv47Org');if(org)org.onchange=()=>void operate(async()=>{
   state.org=org.value;state.link='';if(await load())await render();
  });
  const person=document.getElementById('iv47Person');if(person)person.onchange=()=>{
   const p=(state.data?.people||[]).find(p=>p.id===person.value);
   document.getElementById('iv47First').value=p?.first_name||'';
   document.getElementById('iv47Last').value=p?.last_name||'';
   document.getElementById('iv47CF').value=p?.fiscal_code||'';
   document.getElementById('iv47Email').value=p?.email||'';
  };
  document.getElementById('iv47Form')?.addEventListener('submit',event=>void assign(event));
  document.getElementById('iv47Search')?.addEventListener('input',paintRows);
  document.getElementById('iv47Copy')?.addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(state.link);notice('Link copiato.');}
   catch{const inp=document.getElementById('iv47LinkValue');inp?.select();notice('Seleziona e copia il link con il dispositivo.');}
  });
  document.getElementById('iv47EmailLink')?.addEventListener('click',()=>{
   if(!state.link)return;
   const sub=encodeURIComponent('SafetyTraining — il tuo corso interno');
   const body=encodeURIComponent('Apri questo link per seguire il corso assegnato, senza registrarti:\n'+state.link+'\n\nPuoi riaprirlo per riprendere il percorso.');
   window.location.href='mailto:'+encodeURIComponent(state.email||'')+'?subject='+sub+'&body='+body;
  });
  document.getElementById('iv47Share')?.addEventListener('click',async()=>{
   if(!state.link)return;
   if(navigator.share){try{await navigator.share({title:'SafetyTraining — corso interno',url:state.link});}catch(_){}}
   else{try{await navigator.clipboard.writeText(state.link);notice('Link copiato.');}catch{notice('Copia il link dal campo qui sopra.',true);}}
  });
 }
 async function open(){
  if(!allowed())return alert('Accesso amministrativo richiesto.');
  state.open=true;state.seq++;state.link='';state.notice='';state.error=false;
  document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open');
  header();if(root())root().innerHTML='<div class="iv47">Carico corsisti interni e corsi…</div>';
  try{if(await load())await render();}
  catch(e){if(root())root().innerHTML='<div class="iv47"><section class="iv47-card"><h2>Impossibile caricare Corsisti interni</h2><p>'+esc(e.message||e)+'</p><button id="iv47Retry">Riprova</button></section></div>';document.getElementById('iv47Retry')?.addEventListener('click',()=>void open());}
 }
 function boot(){
  ensureNav();
  document.addEventListener('safety:access-ready',ensureNav);
  document.addEventListener('safety:auth-changed',()=>{state.open=false;state.data=null;state.link='';state.org='';state.seq++;ensureNav();});
  nav()?.addEventListener('click',e=>{if(!e.target.closest('#adminInternalV47Nav'))state.open=false;},true);
 }
 window.SAFETY_INTERNAL_V47={open};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();