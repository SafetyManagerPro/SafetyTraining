/* SafetyTraining v47 — corsisti interni: independent, non-certifying link-only workflow. */
(()=>{'use strict';
 const ORIGIN='https://safety-training-safety-manager.vercel.app';
 const state={open:false,busy:false,seq:0,org:'',data:null,link:'',email:'',linkRecipient:'',linkCourse:'',search:'',filterCourse:'',filterStatus:'all',editPerson:'',importOpen:false,importSeq:0,importResults:[],importTimer:null,importExtras:null,notice:'',error:false};
 const db=()=>window.SAFETY_CLOUD?.state?.client;
 const gate=()=>window.SAFETY_ACCESS_V46_10?.state;
 const root=()=>document.getElementById('adminContent');
 const nav=()=>document.querySelector('#adminShell .admin-nav nav');
 const allowed=()=>!!db()&&(gate()?.phase==='admin'||(gate()?.phase==='staff'&&gate()?.staffRoles?.some(r=>['organization_admin','training_manager'].includes(r))));
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const fmt=v=>v?new Date(v).toLocaleString('it-IT'):'—';
 const abc=new Intl.Collator('it-IT',{sensitivity:'base',numeric:true});
 const alpha=(records,name)=>[...(records||[])].sort((x,y)=>abc.compare(String(name(x)||''),String(name(y)||'')));
 const percent=(a)=>Number(a.total_slides)>0?
  Math.round(100*Number(a.visited_slides||0)/Math.max(1,Number(a.total_slides))):
  Math.round(100*Number(a.visited_count||0)/Math.max(1,Number(a.total_units||0)));
 const lastSlide=a=>Number.isInteger(a.last_slide_index)&&Number(a.total_slides)>0?'Slide '+(a.last_slide_index+1)+' di '+a.total_slides:'Non iniziato';
 const currentTopic=a=>[a.current_module_title,a.current_unit_title].filter(Boolean).join(' › ')||'Argomento non ancora raggiunto';
 const statusKey=a=>a.archived_at?'archived':!a.active?'inactive':!a.started_at?'not_started':percent(a)>=100?'viewed_all':'in_progress';
 const status=a=>a.archived_at?'Eliminato':!a.active?(percent(a)>=100?'Storico · terminato':'Storico · disattivato'):!a.started_at?'Non iniziato':percent(a)>=100?'Tutte le slide aperte':'In corso';
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
  const d=state.data,courses=alpha(d.courses,x=>x.title),people=alpha((d.people||[]).filter(p=>!p.archived_at),x=>x.last_name+' '+x.first_name),assignments=d.assignments||[];
  const active=assignments.filter(a=>a.active),started=active.filter(a=>a.started_at),finished=active.filter(a=>a.started_at&&percent(a)===100);
  const orgs=alpha(d.organizations,o=>o.name).map(o=>option(o.id,o.name,o.id===state.org)).join('');
  const companyChoices=alpha(d.companies||[],c=>c.name).map(c=>'<option value="'+esc(c.name)+'"></option>').join('');
  const assignedCourses=alpha([...new Map(assignments.map(a=>[a.course_version_id,{id:a.course_version_id,title:a.course_title,version:a.version_number}])).values()],c=>c.title);
  const courseFilters=assignedCourses.map(c=>option(c.id,c.title+' · v'+c.version,c.id===state.filterCourse)).join('');
  const choices=courses.map(c=>option(c.version_id,c.title+' · v'+c.version_number+' ('+c.unit_count+' sezioni)',false)).join('');
  const roster='<option value="">Nuovo corsista</option>'+people.map(p=>option(p.id,p.last_name+' '+p.first_name+' · '+p.fiscal_code+' · '+(p.company_name||'Generico'),false)).join('');
  const editorRoster='<option value="">Seleziona un corsista da modificare…</option>'+
   people.map(p=>option(p.id,p.last_name+' '+p.first_name+' · '+p.fiscal_code,p.id===state.editPerson)).join('');
  root().innerHTML='<div class="iv47">'+
   '<section class="iv47-card"><h2>Corsisti interni · formazione non certificante</h2>'+
   '<p>Un corsista può seguire più corsi contemporaneamente e nel tempo, con link e progressi separati. Nessun account o password. La percentuale non è una certificazione.</p>'+
   '<div class="iv47-metrics"><div class="iv47-metric"><strong>'+active.length+'</strong><span>Assegnazioni attive</span></div>'+
   '<div class="iv47-metric"><strong>'+started.length+'</strong><span>Percorsi iniziati</span></div>'+
   '<div class="iv47-metric"><strong>'+finished.length+'</strong><span>Tutte le sezioni aperte</span></div></div>'+
   '<label>Organizzazione<select id="iv47Org">'+orgs+'</select></label></section>'+
   '<section class="iv47-card" id="iv47AssignCard"><h2>1. Assegna un corso</h2>'+
   '<p>Scegli un corsista già presente, importalo dall’anagrafica Corsisti oppure inseriscine uno nuovo. L’email è facoltativa.</p>'+
   '<div class="iv47-actions"><button type="button" id="iv47ImportButton"><span aria-hidden="true">⇩</span> Importa da Corsisti</button></div>'+
   '<label>Corsista già presente (facoltativo)<select id="iv47Person">'+roster+'</select></label>'+
   '<form id="iv47Form" class="iv47-fields"><label>Nome<input name="first_name" id="iv47First" maxlength="120" required autocomplete="off"></label>'+
   '<label>Cognome<input name="last_name" id="iv47Last" maxlength="120" required autocomplete="off"></label>'+
   '<label>Codice fiscale<input name="fiscal_code" id="iv47CF" maxlength="16" minlength="16" pattern="[a-zA-Z0-9]{16}" required autocomplete="off" style="text-transform:uppercase"></label>'+
   '<label>Email facoltativa<input name="email" type="email" id="iv47Email" autocomplete="off"></label>'+ 
   '<label class="iv47-company-field">Azienda (facoltativa)<input id="iv47Company" name="company_name" list="iv47Companies" maxlength="180" autocomplete="off" placeholder="Generico (nessuna azienda)"><datalist id="iv47Companies">'+companyChoices+'</datalist></label>'+ 
   '<div class="iv47-actions iv47-company-save"><button type="button" id="iv47SaveCompany" disabled>Aggiorna azienda del corsista</button></div>'+
   '<label style="grid-column:1/-1">Corso da assegnare<select id="iv47Course" name="course_version_id" required>'+choices+'</select></label>'+
   '<div class="iv47-actions" style="grid-column:1/-1"><button type="submit" class="primary"'+(courses.length?'':' disabled')+'>Genera link personale</button></div></form>'+
   (courses.length?'':'<p>Nessun corso pubblicato e disponibile per questa organizzazione.</p>')+
   '</section>'+
   '<section class="iv47-card" id="iv47RegistryCard"><h2>2. Gestione e modifica anagrafica</h2>'+
   '<p>Seleziona un corsista per correggere o integrare la sua scheda. Le modifiche non cambiano i corsi assegnati, i link personali o i progressi.</p>'+
   '<label>Corsista da modificare<select id="iv47EditPerson">'+editorRoster+'</select></label>'+
   '<p id="iv47EditSummary" class="iv47-muted">Seleziona un corsista per visualizzare la scheda.</p>'+
   '<form id="iv47EditForm" class="iv47-fields"'+(state.editPerson?'':' hidden')+'>'+
   '<label>Nome<input id="iv47EditFirst" name="first_name" maxlength="120" required autocomplete="given-name"></label>'+
   '<label>Cognome<input id="iv47EditLast" name="last_name" maxlength="120" required autocomplete="family-name"></label>'+
   '<label>Codice fiscale<input id="iv47EditCF" name="fiscal_code" maxlength="16" minlength="16" pattern="[a-zA-Z0-9]{16}" required autocomplete="off" style="text-transform:uppercase"></label>'+
   '<label>Email<input id="iv47EditEmail" name="email" type="email" maxlength="250" autocomplete="email"></label>'+
   '<label>Azienda<input id="iv47EditCompany" name="company_name" list="iv47Companies" maxlength="180" placeholder="Generico"></label>'+
   '<label>Telefono<input id="iv47EditPhone" name="phone" type="tel" maxlength="40" autocomplete="tel"></label>'+
   '<label>Qualifica / Mansione<input id="iv47EditJob" name="job_title" maxlength="120"></label>'+
   '<label>Data di nascita<input id="iv47EditBirthDate" name="birth_date" type="date"></label>'+
   '<label>Comune di nascita<input id="iv47EditBirthCity" name="birth_city" maxlength="120"></label>'+
   '<label>Indirizzo di residenza<input id="iv47EditAddress" name="residence_address" maxlength="250"></label>'+
   '<label class="iv47-wide">Note interne<textarea id="iv47EditNotes" name="notes" rows="3" maxlength="1500" placeholder="Informazioni aggiuntive facoltative"></textarea></label>'+
   '<div class="iv47-actions iv47-wide"><button type="submit" class="primary" id="iv47SavePerson">Salva modifiche anagrafiche</button>'+
   '<button type="button" id="iv47CancelEdit">Chiudi scheda</button></div>'+
   '<p id="iv47EditFeedback" role="status" aria-live="polite" class="iv47-wide"></p>'+
   '</form>'+
   '<p class="iv47-muted">Il codice fiscale deve restare univoco all’interno dell’organizzazione. Le schede eliminate si ripristinano dal filtro Eliminati.</p>'+
   '</section>'+
   '<section class="iv47-card" id="iv47LinkCard"'+(state.link?'':' hidden')+'><h2>3. Condividi il link</h2>'+
   '<p>'+esc(state.linkRecipient?('Destinatario: '+state.linkRecipient+' · '+state.linkCourse+'. '):'')+'Il link è pronto per essere copiato o condiviso. Per ragioni di sicurezza, il link precedente è disattivato quando viene rigenerato; il corsista conserva tutti i progressi.</p>'+
   '<div class="iv47-clipboard"><input readonly id="iv47LinkValue" aria-label="Link personale" value="'+esc(state.link)+'">'+
   '<div class="iv47-actions"><button type="button" class="primary" id="iv47Copy">Copia link</button>'+
   '<button type="button" id="iv47EmailLink">Prepara email</button>'+
   '<button type="button" id="iv47Share">Condividi</button></div><p class="iv47-muted">L’email viene aperta nel programma di posta: controlla e conferma tu l’invio. Non viene spedita automaticamente.</p></div></section>'+
   '<section class="iv47-card"><h2>4. Controlla i progressi</h2>'+
   '<div class="iv47-actions"><button type="button" id="iv47Refresh">Aggiorna progressi</button></div>'+ 
   '<div class="iv47-filters">'+
   '<label>Filtra per corso<select id="iv47CourseFilter">'+option('','Tutti i corsi',!state.filterCourse)+courseFilters+'</select></label>'+ 
   '<label>Filtra per stato<select id="iv47StatusFilter">'+[['all','Tutti gli stati'],['not_started','Da iniziare'],['in_progress','In corso'],['viewed_all','Tutte le slide aperte'],['inactive','Disattivato'],['archived','Eliminati']].map(v=>option(v[0],v[1],state.filterStatus===v[0])).join('')+'</select></label></div>'+ 
   '<label>Cerca nome, codice fiscale, azienda o corso<input id="iv47Search" value="'+esc(state.search)+'" placeholder="Cerca corsista, azienda o corso…" autocomplete="off"></label>'+ 
   '<p id="iv47ResultCount" class="iv47-muted" role="status"></p>'+
   '<div class="iv47-table"><table><thead><tr><th>Corsista</th><th>Azienda</th><th>Corso</th><th>Avanzamento</th><th>Ultima attività</th><th>Stato</th><th>Gestione link</th><th>Gestione corsista</th></tr></thead>'+
   '<tbody id="iv47Rows"></tbody></table></div></section>'+
   '<div class="iv47-import-overlay" id="iv47ImportModal" role="dialog" aria-modal="true" aria-labelledby="iv47ImportTitle" hidden>'+
   '<section class="iv47-import-dialog"><div class="iv47-import-heading"><h2 id="iv47ImportTitle">Importa da Corsisti</h2>'+
   '<button type="button" id="iv47ImportClose" aria-label="Chiudi importazione">Chiudi</button></div>'+
   '<p>Cerca un corsista già presente nell’organizzazione. <strong>Solo copia dei dati:</strong> nessuna nuova iscrizione o collegamento tra gli archivi.</p>'+
   '<label>Ricerca per nome, cognome, codice fiscale o email<input id="iv47ImportSearch" type="search" autocomplete="off" maxlength="120" placeholder="Cerca un corsista…"></label>'+
   '<div id="iv47ImportResults" class="iv47-import-results" role="status" aria-live="polite"></div></section></div>'+
   '<p id="iv47Notice" class="iv47-notice'+(state.error?' iv47-error':'')+'" role="status" aria-live="polite">'+esc(state.notice)+'</p>'+
   '</div>';
  bind();paintRows();
 }
 function paintRows(){
  const body=document.getElementById('iv47Rows');if(!body)return;
  const q=(document.getElementById('iv47Search')?.value||'').toLocaleLowerCase('it-IT');
  const filterStatus=state.filterStatus||'all',filterCourse=state.filterCourse||'';
  const source=state.data?.assignments||[];
  const items=alpha(source.filter(a=>
   (filterStatus==='archived'?Boolean(a.archived_at):!a.archived_at)&&
   (!filterCourse||a.course_version_id===filterCourse)&&
   (filterStatus==='all'||statusKey(a)===filterStatus)&&
   [a.first_name,a.last_name,a.fiscal_code,a.company_name,a.course_title].some(x=>String(x||'').toLocaleLowerCase('it-IT').includes(q))
  ),a=>a.last_name+' '+a.first_name+' '+a.course_title);
  const info=document.getElementById('iv47ResultCount');
  if(info)info.textContent=items.length+' percorsi visualizzati';
  const seenPeople=new Set();
  body.innerHTML=items.map(a=>{
   const pct=percent(a);
   const last=lastSlide(a);
   const topic=currentTopic(a);
   const anotherActive=source.some(x=>x.active&&x.person_id===a.person_id&&x.course_version_id===a.course_version_id&&x.id!==a.id);
   const firstOfPerson=!seenPeople.has(a.person_id);seenPeople.add(a.person_id);
   const management=firstOfPerson?(a.archived_at?
    '<button type="button" data-internal-restore-person="'+esc(a.person_id)+'">Ripristina corsista</button>':
    '<button type="button" data-internal-edit-person="'+esc(a.person_id)+'">Modifica anagrafica</button> '+
    '<button type="button" class="danger" data-internal-delete-person="'+esc(a.person_id)+'">Elimina corsista</button>'):'';
   return '<tr><td><strong>'+esc(a.last_name+' '+a.first_name)+'</strong><div class="iv47-muted">'+esc(a.fiscal_code)+'</div></td>'+
    '<td>'+esc(a.company_name||'Generico')+'</td>'+
    '<td>'+esc(a.course_title)+' <small>v'+esc(a.version_number)+'</small><div class="iv47-muted">Assegnato: '+esc(fmt(a.created_at))+'</div></td>'+
    '<td><progress max="100" value="'+pct+'"></progress><div><strong>'+pct+'%</strong> · '+
     (Number(a.total_slides)>0?esc(a.visited_slides)+'/'+esc(a.total_slides)+' slide aperte':
      esc(a.visited_count)+'/'+esc(a.total_units)+' sezioni')+'</div>'+
     '<div class="iv47-progress-detail">Ultima posizione: '+esc(last)+'</div>'+
     '<div class="iv47-progress-detail">'+esc(topic)+'</div></td>'+
    '<td>'+esc(fmt(a.last_activity_at||a.last_opened_at))+'</td><td>'+esc(status(a))+'</td><td>'+
    (a.archived_at?'<span class="iv47-muted">Link eliminati</span>':(a.active||!anotherActive?
      '<button type="button" data-internal-rotate="'+esc(a.id)+'">'+(a.active?'Reinvia link':'Nuovo ciclo')+'</button> ':
      '<span class="iv47-muted">Storico</span> ')+
     (a.active?'<button type="button" data-internal-repeat="'+esc(a.id)+'">Ripeti corso</button> ':'')+
     (a.active?'<button type="button" class="danger" data-internal-revoke="'+esc(a.id)+'">Disattiva</button>':''))+
    '</td><td>'+management+'</td></tr>';
  }).join('')||'<tr><td colspan="8">Nessun corsista o percorso corrispondente ai filtri.</td></tr>';
  body.querySelectorAll('[data-internal-rotate]').forEach(btn=>btn.onclick=()=>void rotate(btn.dataset.internalRotate));
  body.querySelectorAll('[data-internal-revoke]').forEach(btn=>btn.onclick=()=>void revoke(btn.dataset.internalRevoke));
  body.querySelectorAll('[data-internal-repeat]').forEach(btn=>btn.onclick=()=>void repeatCourse(btn.dataset.internalRepeat));
  body.querySelectorAll('[data-internal-edit-person]').forEach(btn=>btn.onclick=()=>editPerson(btn.dataset.internalEditPerson));
  body.querySelectorAll('[data-internal-delete-person]').forEach(btn=>btn.onclick=()=>void archivePerson(btn.dataset.internalDeletePerson,false));
  body.querySelectorAll('[data-internal-restore-person]').forEach(btn=>btn.onclick=()=>void archivePerson(btn.dataset.internalRestorePerson,true));
 }
 function renderImportResults(message=''){
  const box=document.getElementById('iv47ImportResults');if(!box)return;
  if(message){box.innerHTML='<p class="iv47-muted">'+esc(message)+'</p>';return;}
  const results=state.importResults||[];
  box.innerHTML=results.map(person=>{
   const cf=String(person.fiscal_code||'').toUpperCase().trim();
   const local=(state.data?.people||[]).find(p=>p.fiscal_code===cf);
   const note=local?.archived_at?'Archiviato in Corsisti interni':
    local?'Già presente in Corsisti interni':'Disponibile da copiare';
   return '<div class="iv47-import-item"><div><strong>'+esc(person.last_name+' '+person.first_name)+'</strong>'+
    '<div class="iv47-muted">'+esc(person.company_name||'Generico')+' · '+esc(cf||'CF da completare')+'</div>'+
    '<div class="iv47-muted">'+esc(note)+'</div></div>'+
    '<button type="button" data-iv47-import-id="'+esc(person.id)+'">Usa dati</button></div>';
  }).join('')||'<p class="iv47-muted">Nessun corsista trovato. Puoi inserirlo manualmente nel modulo.</p>';
 }
 async function searchImport(query=''){
  if(!state.importOpen||!state.open||!allowed()||!state.org)return;
  const seq=++state.importSeq,org=state.org;
  renderImportResults('Ricerca corsisti in corso…');
  try{
   const data=await rpc('internal_admin_import_candidates_v47_11',{p_org_id:org,p_query:String(query).trim()});
   if(!state.importOpen||!state.open||!allowed()||seq!==state.importSeq||org!==state.org)return;
   if(!Array.isArray(data))throw Error('L’elenco corsisti non è disponibile.');
   state.importResults=data;
   renderImportResults();
  }catch(e){
   if(state.importOpen&&seq===state.importSeq&&org===state.org)
    renderImportResults('Impossibile caricare i corsisti: '+String(e?.message||e));
  }
 }
 function closeImport(){
  state.importOpen=false;state.importSeq++;state.importResults=[];
  if(state.importTimer!==null){clearTimeout(state.importTimer);state.importTimer=null;}
  const overlay=document.getElementById('iv47ImportModal');if(overlay)overlay.hidden=true;
  document.getElementById('iv47ImportButton')?.focus?.();
 }
 function openImport(){
  if(!state.open||!allowed()||!state.org)return;
  state.importOpen=true;state.importResults=[];
  const overlay=document.getElementById('iv47ImportModal');if(overlay)overlay.hidden=false;
  const input=document.getElementById('iv47ImportSearch');
  if(input){input.value='';input.focus();}
  void searchImport('');
 }
 function useImport(id){
  if(!state.open||!allowed())return;
  const candidate=state.importResults.find(p=>p.id===id);
  if(!candidate)return;
  const cf=String(candidate.fiscal_code||'').toUpperCase().replace(/\s/g,'');
  const internal=cf?(state.data?.people||[]).find(p=>p.fiscal_code===cf):null;
  if(internal?.archived_at){
   closeImport();state.filterStatus='archived';paintRows();
   notice('Questo codice fiscale è già presente tra i corsisti eliminati. Ripristina la scheda dal filtro Eliminati prima di assegnare un corso.',true);
   return;
  }
  const source=internal||candidate;
  const update=(field,value)=>{
   const element=document.getElementById(field);
   if(element)element.value=value||'';
  };
  update('iv47First',source.first_name);
  update('iv47Last',source.last_name);
  update('iv47CF',source.fiscal_code);
  update('iv47Email',source.email);
  update('iv47Company',source.company_name&&source.company_name!=='Generico'?source.company_name:'');
  const person=document.getElementById('iv47Person');
  if(person)person.value=internal?.id||'';
  const saveCompany=document.getElementById('iv47SaveCompany');
  if(saveCompany)saveCompany.disabled=!internal;
  // Only apply optional extras if the selected fiscal code is unchanged at save time.
  // For existing internal people, never overwrite already managed personal details.
  state.importExtras=internal?null:{cf,phone:String(candidate.phone||'').trim(),job_title:String(candidate.job_title||'').trim()};
  closeImport();
  notice(internal?'Corsista già presente: ho riutilizzato la scheda interna senza duplicarla. Scegli il corso.':
   cf.length===16?'Dati copiati nel modulo. Scegli il corso e premi Genera link personale per salvarli.':
   'Dati copiati. Completa il codice fiscale a 16 caratteri e scegli il corso per salvare.');
  document.getElementById('iv47AssignCard')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 }
 const newToken=()=>{
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 };
 const tokenHash=async token=>{
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
 };
 function showLink(token,email='',recipient='',course=''){
  state.link=ORIGIN+'/interno.html#t='+token;
  state.email=email;
  state.linkRecipient=recipient;
  state.linkCourse=course;
 }
 function revealLink(){
  document.getElementById('iv47LinkCard')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 }
 async function presentLink(token,email,recipient,course,message){
  if(!state.open||!allowed())return;
  showLink(token,email,recipient,course);
  notice(message);
  // Make the newly issued token visible BEFORE refreshing the assignment list.
  // If the progress RPC fails, the admin must still be able to copy and send it.
  await render();
  revealLink();
  try{
   if(await load()){await render();revealLink();}
  }catch(e){
   notice('Il nuovo link è disponibile nel pannello qui sopra. Non sono riuscito ad aggiornare i progressi: '+String(e?.message||e),true);
  }
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
   const company=f.querySelector('#iv47Company').value.trim();
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
   const args={p_org_id:state.org,p_first_name:first,p_last_name:last,p_fiscal_code:cf,
    p_email:email||null,p_course_version_id:version,p_token_hash:await tokenHash(token),
    p_company_name:company||null};
   const extras=state.importExtras?.cf===cf?state.importExtras:null;
   if(extras&&(extras.phone||extras.job_title)){
    await rpc('internal_admin_import_assign_v47_11',{...args,p_phone:extras.phone||null,p_job_title:extras.job_title||null});
   }else{
    await rpc('internal_admin_assign_company_v47_9',args);
   }
   state.importExtras=null;
   const chosen=snapshot.courses.find(c=>c.version_id===version);
   await presentLink(token,email,first+' '+last,chosen?.title||'Corso interno',
    'Assegnazione salvata. Copia il link oppure prepara un’email da inviare.');
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
    await presentLink(token,a.email||'',a.first_name+' '+a.last_name,a.course_title,
     'Nuovo percorso creato, storico conservato. Copia o invia il nuovo link.');
    return;
   }
   if(!confirm('Reinviare l’accesso a '+a.first_name+' '+a.last_name+' per “'+a.course_title+'”? Verrà creato un NUOVO link: quello precedente smetterà di funzionare. Le slide già viste e i progressi resteranno invariati.'))return;
   const token=newToken();
   await rpc('internal_admin_link_v47',{p_assignment_id:id,p_token_hash:await tokenHash(token),p_revoke:false});
   await presentLink(token,a.email||'',a.first_name+' '+a.last_name,a.course_title,
    'Nuovo link pronto. Il precedente è disattivato; il progresso è conservato. Copia il link oppure prepara l’email.');
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
   await presentLink(token,a.email||'',a.first_name+' '+a.last_name,a.course_title,
    'Nuovo percorso creato, il precedente resta nello storico. Copia o invia il nuovo link.');
  });
 }
 function fillPersonEditor(){
  const form=document.getElementById('iv47EditForm');
  if(!form)return;
  const record=(state.data?.people||[]).find(p=>p.id===state.editPerson&&!p.archived_at);
  form.hidden=!record;
  const summary=document.getElementById('iv47EditSummary');
  if(summary){
   const assignments=(state.data?.assignments||[]).filter(a=>a.person_id===state.editPerson);
   summary.textContent=record
    ?'Corsi assegnati: '+assignments.length+' · attivi: '+assignments.filter(a=>a.active).length+' · modifiche anagrafiche indipendenti dai progressi.'
    :'Seleziona un corsista per visualizzare la scheda.';
  }
  if(!record)return;
  const fields={
   iv47EditFirst:record.first_name,iv47EditLast:record.last_name,
   iv47EditCF:record.fiscal_code,iv47EditEmail:record.email,
   iv47EditCompany:record.company_name==='Generico'?'':record.company_name,
   iv47EditPhone:record.phone,iv47EditJob:record.job_title,
   iv47EditBirthDate:record.birth_date,iv47EditBirthCity:record.birth_city,
   iv47EditAddress:record.residence_address,iv47EditNotes:record.notes
  };
  for(const [id,value] of Object.entries(fields)){
   const field=document.getElementById(id);if(field)field.value=value??'';
  }
 }
 function editPerson(personId){
  const record=(state.data?.people||[]).find(p=>p.id===personId&&!p.archived_at);
  if(!record){notice('Corsista non disponibile. Aggiorna la schermata.',true);return;}
  state.editPerson=personId;
  const selector=document.getElementById('iv47EditPerson');if(selector)selector.value=personId;
  fillPersonEditor();
  document.getElementById('iv47RegistryCard')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 }
 async function savePerson(event){
  event.preventDefault();
  await operate(async()=>{
   const snapshot=await requireData();
   const person=snapshot.people.find(p=>p.id===state.editPerson&&!p.archived_at);
   const form=document.getElementById('iv47EditForm');
   if(!person||!form)throw Error('Seleziona un corsista attivo da modificare.');
   if(!form.reportValidity())return;
   const value=id=>document.getElementById(id)?.value.trim()||'';
   const first=value('iv47EditFirst'),last=value('iv47EditLast');
   const cf=value('iv47EditCF').toUpperCase().replace(/\s/g,'');
   const email=value('iv47EditEmail'),company=value('iv47EditCompany')||'Generico';
   const birth=value('iv47EditBirthDate');
   if(first.length<2||last.length<2||!/^[A-Z0-9]{16}$/.test(cf))throw Error('Verifica nome, cognome e codice fiscale (16 caratteri).');
   if(birth&&birth>new Date().toISOString().slice(0,10))throw Error('La data di nascita non può essere futura.');
   const other=snapshot.people.find(p=>p.id!==person.id&&p.fiscal_code===cf);
   if(other)throw Error('Il codice fiscale è già utilizzato da un altro corsista interno.');
   try{await rpc('internal_admin_update_person_v47_10',{
    p_person_id:person.id,p_first_name:first,p_last_name:last,p_fiscal_code:cf,
    p_email:email||null,p_company_name:company,p_phone:value('iv47EditPhone')||null,
    p_job_title:value('iv47EditJob')||null,p_birth_date:birth||null,
    p_birth_city:value('iv47EditBirthCity')||null,
    p_residence_address:value('iv47EditAddress')||null,
    p_notes:value('iv47EditNotes')||null,p_expected_updated_at:person.updated_at
   });}catch(error){
    const message=String(error?.message||error);
    if(message.includes('person_modified_reload_before_save'))
     throw Error('Un altro amministratore ha modificato questa anagrafica. Ricarica la pagina e riprova.');
    if(message.includes('fiscal_code_already_used')||message.includes('internal_people_v47_identity'))
     throw Error('Codice fiscale già presente per un altro corsista.');
    throw error;
   }
   if(await load()){
    await render();
    notice('Anagrafica aggiornata. Corsi, link e progressi sono rimasti invariati.');
    document.getElementById('iv47RegistryCard')?.scrollIntoView?.({block:'start'});
   }
  });
  const message=document.getElementById('iv47EditFeedback');
  if(message){message.textContent=state.notice;message.classList.toggle('iv47-error',state.error);}
 }
  async function saveCompany(){
  await operate(async()=>{
   const personId=document.getElementById('iv47Person')?.value;
   if(!personId)throw Error('Seleziona prima un corsista esistente.');
   const company=document.getElementById('iv47Company')?.value.trim()||'Generico';
   await rpc('internal_admin_company_v47_9',{p_person_id:personId,p_company_name:company});
   if(await load()){await render();notice('Azienda aggiornata: '+company+'.');}
  });
 }
 async function archivePerson(personId,restore){
  await operate(async()=>{
   const snapshot=await requireData();
   const person=(snapshot.people||[]).find(x=>x.id===personId);
   if(!person)throw Error('Corsista non trovato. Aggiorna la schermata.');
   const name=person.first_name+' '+person.last_name;
   if(!restore){
    const linked=(snapshot.assignments||[]).filter(a=>a.person_id===personId);
    const current=linked.filter(a=>a.active).length;
    if(!confirm('Eliminare '+name+' dai Corsisti interni? Verranno disattivati '+current+' link attivi, anche di corsi diversi. Le slide già viste e lo storico rimarranno conservati e sarà possibile ripristinare il corsista.'))return;
   }else if(!confirm('Ripristinare '+name+' nell’elenco Corsisti interni? I vecchi link restano disattivati; per riprendere il corso dovrai generarne uno nuovo.'))return;
   await rpc('internal_admin_archive_person_v47_9',{p_person_id:personId,p_restore:!!restore});
   state.link='';state.filterStatus='all';
   if(await load()){await render();notice(restore?'Corsista ripristinato. Per riattivare i corsi genera nuovi link.':'Corsista eliminato dall’elenco e tutti i suoi link disattivati. Storico conservato.');}
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
   closeImport();state.org=org.value;state.link='';state.search='';state.importExtras=null;state.filterStatus='all';state.filterCourse='';state.editPerson='';if(await load())await render();
  });
  const editorSelect=document.getElementById('iv47EditPerson');
  if(editorSelect)editorSelect.onchange=()=>{state.editPerson=editorSelect.value;fillPersonEditor();};
  document.getElementById('iv47EditForm')?.addEventListener('submit',event=>void savePerson(event));
  document.getElementById('iv47CancelEdit')?.addEventListener('click',()=>{state.editPerson='';if(editorSelect)editorSelect.value='';fillPersonEditor();});
  fillPersonEditor();
  document.getElementById('iv47ImportButton')?.addEventListener('click',openImport);
  document.getElementById('iv47ImportClose')?.addEventListener('click',closeImport);
  document.getElementById('iv47ImportSearch')?.addEventListener('input',event=>{
   if(state.importTimer!==null)clearTimeout(state.importTimer);
   state.importSeq++;state.importResults=[];
   renderImportResults('Ricerca corsisti in corso…');
   const term=event.target.value;
   state.importTimer=setTimeout(()=>{state.importTimer=null;void searchImport(term);},250);
  });
  document.getElementById('iv47ImportSearch')?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeImport();}});
  document.getElementById('iv47ImportResults')?.addEventListener('click',event=>{
   const btn=event.target.closest('[data-iv47-import-id]');
   if(btn)useImport(btn.dataset.iv47ImportId);
  });
  const person=document.getElementById('iv47Person');if(person)person.onchange=()=>{
   state.importExtras=null;
   const p=(state.data?.people||[]).find(p=>p.id===person.value);
   document.getElementById('iv47First').value=p?.first_name||'';
   document.getElementById('iv47Last').value=p?.last_name||'';
   document.getElementById('iv47CF').value=p?.fiscal_code||'';
   document.getElementById('iv47Email').value=p?.email||'';
   document.getElementById('iv47Company').value=p?.company_name&&p.company_name!=='Generico'?p.company_name:'';
   document.getElementById('iv47SaveCompany').disabled=!p;
  };
  document.getElementById('iv47Form')?.addEventListener('submit',event=>void assign(event));
  document.getElementById('iv47SaveCompany')?.addEventListener('click',()=>void saveCompany());
  document.getElementById('iv47CourseFilter')?.addEventListener('change',event=>{state.filterCourse=event.target.value;paintRows();});
  document.getElementById('iv47StatusFilter')?.addEventListener('change',event=>{state.filterStatus=event.target.value;paintRows();});
  document.getElementById('iv47Search')?.addEventListener('input',event=>{state.search=event.target.value;paintRows();});
  document.getElementById('iv47Refresh')?.addEventListener('click',()=>void operate(async()=>{
   if(await load()){await render();notice('Progressi aggiornati.');}
  }));
  document.getElementById('iv47Copy')?.addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(state.link);notice('Link copiato.');}
   catch{const inp=document.getElementById('iv47LinkValue');inp?.select();notice('Seleziona e copia il link con il dispositivo.');}
  });
  document.getElementById('iv47EmailLink')?.addEventListener('click',()=>{
   if(!state.link)return;
   const sub=encodeURIComponent('SafetyTraining — '+(state.linkCourse||'corso interno'));
   const body=encodeURIComponent('Ciao'+(state.linkRecipient?' '+state.linkRecipient:'')+',\n\nper seguire il corso “'+(state.linkCourse||'assegnato')+'” apri questo link personale (senza registrazione):\n'+state.link+'\n\nPuoi riaprirlo per riprendere il percorso dall’ultima slide.');
   window.location.href='mailto:'+encodeURIComponent(state.email||'')+'?subject='+sub+'&body='+body;
  });
  document.getElementById('iv47Share')?.addEventListener('click',async()=>{
   if(!state.link)return;
   if(navigator.share){try{await navigator.share({title:'SafetyTraining — '+(state.linkCourse||'corso interno'),text:'Link personale per il corso interno',url:state.link});}catch(_){}}
   else{try{await navigator.clipboard.writeText(state.link);notice('Link copiato.');}catch{notice('Copia il link dal campo qui sopra.',true);}}
  });
 }
 async function open(){
  if(!allowed())return alert('Accesso amministrativo richiesto.');
  state.open=true;state.seq++;state.link='';state.linkRecipient='';state.linkCourse='';state.editPerson='';state.importOpen=false;state.importSeq++;state.importExtras=null;state.importResults=[];state.search='';state.filterCourse='';state.filterStatus='all';state.notice='';state.error=false;
  document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open');
  header();if(root())root().innerHTML='<div class="iv47">Carico corsisti interni e corsi…</div>';
  try{if(await load())await render();}
  catch(e){if(root())root().innerHTML='<div class="iv47"><section class="iv47-card"><h2>Impossibile caricare Corsisti interni</h2><p>'+esc(e.message||e)+'</p><button id="iv47Retry">Riprova</button></section></div>';document.getElementById('iv47Retry')?.addEventListener('click',()=>void open());}
 }
 async function openFromLearner(candidate){
  if(!allowed())return;
  await open();
  if(!state.open||!document.getElementById('iv47Form'))return;
  if(candidate.organization_id&&candidate.organization_id!==state.org){
   notice('Il corsista appartiene a un’altra organizzazione: selezionala in alto e riprova.',true);
   return;
  }
  const cf=String(candidate.fiscal_code||'').toUpperCase().replace(/\s/g,'');
  const internalExists=!!cf&&(state.data?.people||[]).some(p=>p.fiscal_code===cf);
  // Registered learners often store "COGNOME NOME" in first_name with an empty last_name.
  const full=String(candidate.first_name||'').trim().replace(/\s+/g,' ');
  const split=!String(candidate.last_name||'').trim()&&full.includes(' ');
  const first=split?full.slice(full.indexOf(' ')+1):full;
  const last=split?full.slice(0,full.indexOf(' ')):String(candidate.last_name||'').trim();
  state.importResults=[{...candidate,first_name:first,last_name:last}];
  useImport(candidate.id);
  if(split&&!internalExists)notice('Ho separato il nome completo in cognome e nome: controlla i campi, scegli il corso e premi Genera link personale.');
 }
 function boot(){
  ensureNav();
  document.addEventListener('safety:access-ready',ensureNav);
  document.addEventListener('safety:auth-changed',()=>{state.open=false;state.data=null;state.link='';state.linkRecipient='';state.linkCourse='';state.org='';state.editPerson='';state.importOpen=false;state.importExtras=null;state.importResults=[];state.importSeq++;if(state.importTimer!==null){clearTimeout(state.importTimer);state.importTimer=null;}state.seq++;ensureNav();});
  nav()?.addEventListener('click',e=>{if(!e.target.closest('#adminInternalV47Nav'))state.open=false;},true);
 }
 window.SAFETY_INTERNAL_V47={open,openFromLearner};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();