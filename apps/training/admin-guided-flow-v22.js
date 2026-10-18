/* SafetyTraining v22.3 — additive guided enrollment. All mutations use existing audited RPCs. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const user=()=>window.SAFETY_CLOUD?.state?.user;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').trim().toLocaleLowerCase('it-IT');
  const normalizeCf=v=>norm(v).replace(/[^a-z0-9]/g,'');
  const steps=['Azienda','Corso ed edizione','Corsisti','Riepilogo'];
  const empty=()=>({step:0,organizationId:'',companyId:'',companyMode:'existing',companyName:'',vat:'',ateco:'',fiscal:'',editionMode:'existing',editionId:'',versionId:'',editionTitle:'',learningMode:'elearning_internal',availableFrom:'',availableUntil:'',selectedIds:[],newLearners:[],sendInvites:true,result:null});
  const s={data:empty(),userId:null,records:null,busy:false,rendering:0,serial:0,host:null,notice:''};
  const ACTIVE=()=>user()?.id&&user().id===s.userId;
  function readyVersions(courses,versions){
    const cm=new Map(courses.map(c=>[c.id,c]));
    return versions.filter(v=>{const c=cm.get(v.course_id),m=c?.metadata||{},snap=v.syllabus_snapshot||{};
      return c?.active&&v.status==='published'&&!m.frozen&&!m.exclude_from_finalization_queue&&m.finalization_scope!=='reference_library'&&snap.finalization_candidate===true&&snap.go_live_ready===true;
    });
  }
  function eligibleEditions(editions,companyId,orgId,versionIds){
    return editions.filter(e=>e.organization_id===orgId&&e.status==='open'&&(!e.company_id||e.company_id===companyId)&&versionIds.has(e.course_version_id));
  }
  function eligibleLearners(learners,companyId,orgId){
    return learners.filter(l=>l.active&&l.organization_id===orgId&&l.company_id===companyId);
  }
  function duplicateLearner(row,all,organizationId){
    const cf=normalizeCf(row.fiscal_code),email=norm(row.email);
    return all.find(l=>l.organization_id===organizationId&&(
      (cf&&normalizeCf(l.fiscal_code)===cf)||(email&&norm(l.email)===email)
    ))||null;
  }
  function draftSafe(st){return {organizationId:st.organizationId,companyId:st.companyId,editionId:st.editionId,selectedIds:st.selectedIds.slice(0,500)};}
  window.SAFETY_GUIDED_FLOW_RULES_V22={readyVersions,eligibleEditions,eligibleLearners,duplicateLearner,draftSafe};
  const draftKey=()=>user()?.id?'safety-training-guided-flow-'+user().id:null;
  function toast(msg,type=''){
    s.notice=msg;
    const el=s.host?.querySelector('#gwNotice');
    if(el){el.textContent=msg;el.className='gw-notice '+(type||'');}
  }
  async function rpc(name,args){
    if(!ACTIVE())throw new Error('La sessione amministrativa è cambiata. Riapri il percorso.');
    const {data,error}=await db().rpc(name,args);
    if(error)throw error;
    if(!ACTIVE())throw new Error('Sessione terminata. Aggiorna per verificare le operazioni già eseguite.');
    return data;
  }
  async function list(table,columns,adjust){
    let query=db().from(table).select(columns);if(adjust)query=adjust(query);
    const {data,error}=await query;if(error)throw error;return data||[];
  }
  async function load(){
    const items=await Promise.all([
      list('organizations','id,name,active',q=>q.eq('active',true).order('name')),
      list('companies','id,name,organization_id,vat_number,active',q=>q.eq('active',true).order('name')),
      list('courses','id,title,active,metadata'),
      list('course_versions','id,course_id,version_number,status,syllabus_snapshot'),
      list('course_editions','id,organization_id,company_id,course_version_id,title,status,available_from,available_until',q=>q.order('created_at',{ascending:false})),
      list('learners','id,organization_id,company_id,active,first_name,last_name,email,fiscal_code,job_title,auth_user_id',q=>q.eq('active',true).order('last_name'))
    ]);
    if(!ACTIVE())throw new Error('Sessione non valida.');
    const [orgs,companies,courses,versions,editions,learners]=items;
    s.records={orgs,companies,courses,versions,editions,learners};
    if(!s.data.organizationId&&orgs.length===1)s.data.organizationId=orgs[0].id;
  }
  const opt=(value,label,selected)=>'<option value="'+esc(value)+'" '+(selected?'selected':'')+'>'+esc(label)+'</option>';
  const info=(message)=>'<p class="gw-note">'+esc(message)+'</p>';
  const btn=(title,action,extra='')=>'<button type="button" data-gw="'+action+'" '+extra+'>'+esc(title)+'</button>';
  function shell(){
    const tabs=steps.map((label,i)=>'<span class="'+(s.data.step===i?'is-active':s.data.step>i?'is-done':'')+'"><b>'+(i+1)+'</b>'+esc(label)+'</span>').join('');
    s.host.innerHTML='<section class="gw-shell"><div class="gw-top"><h2>Avvia un percorso formativo</h2><p>Una sola procedura per azienda, corso, corsisti e accessi. Le sezioni amministrative avanzate restano disponibili.</p></div><nav class="gw-steps" aria-label="Passaggi di iscrizione">'+tabs+'</nav><div id="gwNotice" class="gw-notice" role="status" aria-live="polite">'+esc(s.notice)+'</div><div id="gwStage"></div><footer class="gw-footer">'+btn('Salva selezioni come bozza','draft')+btn('Ricomincia','reset')+'</footer></section>';
    draw();
  }
  function draw(){
    const r=s.records,st=s.data,target=s.host?.querySelector('#gwStage');if(!r||!target)return;
    if(st.step===0)target.innerHTML=stepCompany(r,st);
    if(st.step===1)target.innerHTML=stepEdition(r,st);
    if(st.step===2)target.innerHTML=stepLearners(r,st);
    if(st.step===3)target.innerHTML=stepReview(r,st);
    if(st.step===4)target.innerHTML=stepResult(st);
  }
  function navigation(back=true,next=true,label='Continua'){
    return '<div class="gw-actions">'+(back?btn('← Indietro','back'):'')+
      (next?'<button type="button" class="gw-primary" data-gw="next">'+esc(label)+' →</button>':'')+'</div>';
  }
  function stepCompany(r,st){
    const orgOptions=r.orgs.map(o=>opt(o.id,o.name,o.id===st.organizationId)).join('');
    const companies=r.companies.filter(c=>c.organization_id===st.organizationId);
    const companyOptions=companies.map(c=>opt(c.id,c.name,c.id===st.companyId)).join('');
    return '<div class="gw-panel"><h3>1. Seleziona l’azienda</h3>'+
      '<div class="gw-grid"><label>Organizzazione<select data-field="organizationId">'+opt('','Seleziona organizzazione',!st.organizationId)+orgOptions+'</select></label>'+
      '<label>Azienda<select data-field="companyId">'+opt('','Seleziona azienda',!st.companyId)+companyOptions+opt('new','+ Nuova azienda',st.companyMode==='new')+'</select></label></div>'+
      (st.companyMode==='new'?'<div class="gw-sub"><h4>Nuova azienda</h4><div class="gw-grid">'+
      '<label>Ragione sociale *<input data-field="companyName" value="'+esc(st.companyName)+'" required></label>'+
      '<label>Partita IVA<input data-field="vat" value="'+esc(st.vat)+'"></label>'+
      '<label>Codice fiscale<input data-field="fiscal" value="'+esc(st.fiscal)+'"></label>'+
      '<label>Codice ATECO<input data-field="ateco" value="'+esc(st.ateco)+'"></label></div>'+
      info('Scegliendo «Crea azienda e continua», l’anagrafica viene salvata subito sul database.')+'</div>':
      info('L’azienda selezionata verrà proposta automaticamente nei passaggi successivi.'))+
      navigation(false,true,st.companyMode==='new'?'Crea azienda e continua':'Continua')+'</div>';
  }
  function stepEdition(r,st){
    const v=readyVersions(r.courses,r.versions),validIds=new Set(v.map(x=>x.id)),open=eligibleEditions(r.editions,st.companyId,st.organizationId,validIds);
    const cm=new Map(r.courses.map(x=>[x.id,x])),vm=new Map(r.versions.map(x=>[x.id,x]));
    const editions=open.map(e=>{const ver=vm.get(e.course_version_id);return opt(e.id,(e.title||cm.get(ver?.course_id)?.title||'Edizione')+' · '+(cm.get(ver?.course_id)?.title||'Corso'),st.editionId===e.id)}).join('');
    const courses=v.map(ver=>opt(ver.id,(cm.get(ver.course_id)?.title||'Corso')+' · v'+ver.version_number,st.versionId===ver.id)).join('');
    return '<div class="gw-panel"><h3>2. Corso ed edizione</h3><p>Un corso approvato può essere riutilizzato. Crei una nuova edizione soltanto se manca quella adatta.</p>'+
      '<label class="gw-label">Edizione disponibile<select data-field="editionId">'+opt('','Seleziona edizione aperta…',!st.editionId)+editions+opt('new','+ Crea nuova edizione',st.editionMode==='new')+'</select></label>'+
      (st.editionMode==='new'?'<div class="gw-sub"><h4>Nuova edizione</h4><div class="gw-grid">'+
      '<label class="gw-wide">Corso approvato *<select data-field="versionId">'+opt('','Seleziona corso…',!st.versionId)+courses+'</select></label>'+
      '<label>Titolo edizione<input data-field="editionTitle" value="'+esc(st.editionTitle)+'" placeholder="Facoltativo"></label>'+
      '<label>Modalità<select data-field="learningMode">'+[['elearning_internal','E-learning'],['classroom','Aula'],['blended','Blended'],['self_study','Autoformazione']].map(x=>opt(x[0],x[1],x[0]===st.learningMode)).join('')+'</select></label>'+
      '<label>Disponibile da<input data-field="availableFrom" type="datetime-local" value="'+esc(st.availableFrom)+'"></label>'+
      '<label>Disponibile fino<input data-field="availableUntil" type="datetime-local" value="'+esc(st.availableUntil)+'"></label>'+
      '</div>'+info('Proseguendo, l’edizione verrà creata come «Aperta». I corsi non approvati o congelati sono esclusi.')+'</div>':
      info(open.length?'Seleziona un’edizione compatibile già esistente.':'Non ci sono edizioni compatibili: scegli «Crea nuova edizione».'))+
      navigation(true,true,st.editionMode==='new'?'Crea edizione e continua':'Continua')+'</div>';
  }
  function stepLearners(r,st){
    const learners=eligibleLearners(r.learners,st.companyId,st.organizationId), selected=new Set(st.selectedIds);
    const cards=learners.map(l=>'<label class="gw-person"><input type="checkbox" data-existing="'+esc(l.id)+'" '+(selected.has(l.id)?'checked':'')+'><span><strong>'+esc((l.first_name||'')+' '+(l.last_name||''))+'</strong><small>'+esc(l.email||'Email non presente')+(l.auth_user_id?' · account attivo':' · da invitare')+'</small></span></label>').join('');
    const newRows=st.newLearners.map((l,i)=>'<div class="gw-new"><div class="gw-new-head"><strong>Nuovo corsista '+(i+1)+'</strong><button type="button" data-remove="'+esc(l.localId)+'">Rimuovi</button></div><div class="gw-grid">'+
      ['first_name','last_name','email','fiscal_code','job_title'].map((field,j)=>'<label>'+['Nome *','Cognome *','Email','Codice fiscale','Mansione'][j]+'<input data-person="'+esc(l.localId)+'" data-person-field="'+field+'" '+(field==='email'?'type="email"':'')+' value="'+esc(l[field]||'')+'"></label>').join('')+'</div></div>').join('');
    return '<div class="gw-panel"><h3>3. Scegli i corsisti</h3><p>Seleziona persone già presenti o aggiungi nuovi corsisti. È possibile iscrivere anche più persone insieme.</p>'+
      '<div class="gw-sub"><div class="gw-sub-head"><h4>Corsisti aziendali ('+learners.length+')</h4>'+btn('Seleziona tutti','select-all')+'</div>'+
      '<div class="gw-persons">'+(cards||'<p>Nessun corsista presente in questa azienda.</p>')+'</div></div>'+
      '<div class="gw-sub"><div class="gw-sub-head"><h4>Nuovi corsisti</h4>'+btn('+ Aggiungi corsista','add-person')+'</div>'+newRows+
      info('I nuovi corsisti saranno creati soltanto nella conferma finale. I possibili duplicati vengono bloccati.')+'</div>'+
      navigation(true,true,'Rivedi iscrizioni')+'</div>';
  }
  function stepReview(r,st){
    const company=r.companies.find(x=>x.id===st.companyId),edition=r.editions.find(x=>x.id===st.editionId);
    const version=r.versions.find(x=>x.id===edition?.course_version_id),course=r.courses.find(x=>x.id===version?.course_id);
    const existing=st.selectedIds.map(id=>r.learners.find(l=>l.id===id)).filter(Boolean);
    const newOnes=st.newLearners,names=existing.concat(newOnes).map(x=>esc((x.first_name||'')+' '+(x.last_name||''))).join(', ');
    return '<div class="gw-panel"><h3>4. Controlla prima di confermare</h3>'+
      '<dl class="gw-summary"><dt>Azienda</dt><dd>'+esc(company?.name||'—')+'</dd><dt>Corso</dt><dd>'+esc(course?.title||'—')+'</dd>'+
      '<dt>Edizione</dt><dd>'+esc(edition?.title||course?.title||'—')+'</dd><dt>Corsisti</dt><dd>'+esc(String(existing.length+st.newLearners.length))+'</dd></dl>'+
      '<p class="gw-roster">'+(names||'Nessuno')+'</p>'+
      '<label class="gw-check"><input type="checkbox" data-field="sendInvites" '+(st.sendInvites?'checked':'')+'> Invia l’invito email ai corsisti che non hanno un account attivo</label>'+
      info('L’iscrizione viene creata una sola volta. Per WhatsApp, SMS o QR potrai utilizzare anche «Accessi & import» dopo la conferma.')+
      '<p class="gw-warning">Confermando saranno creati eventuali nuovi corsisti e le relative iscrizioni. Gli inviti riusciti non potranno essere annullati.</p>'+
      '<div class="gw-actions">'+btn('← Indietro','back')+'<button type="button" class="gw-primary" data-gw="submit">Conferma iscrizioni'+(st.sendInvites?' e invia email':'')+'</button></div></div>';
  }
  function stepResult(st){
    const r=st.result||{},fail=Array.isArray(r.failedIds)?r.failedIds.length:0;
    return '<div class="gw-panel"><h3>Risultato iscrizioni</h3>'+
      '<div class="gw-summary"><p><b>'+Number(r.inserted||0)+'</b> nuove iscrizioni create</p><p><b>'+Number(r.skipped_existing||0)+'</b> iscrizioni già esistenti, non duplicate</p>'+
      '<p><b>'+Number(r.invited||0)+'</b> inviti email riusciti</p><p><b>'+fail+'</b> inviti da verificare</p></div>'+
      (fail?'<p class="gw-warning">Alcuni inviti non sono riusciti. Le iscrizioni restano valide; puoi riprovare senza duplicarle.</p>'+btn('Riprova inviti non riusciti','retry-invites'):'')+
      '<div class="gw-actions">'+btn('Apri Iscrizioni','go-enrollments')+btn('Accessi & import / SMS / WhatsApp','go-access')+
      '<button class="gw-primary" type="button" data-gw="reset">Nuovo percorso →</button></div></div>';
  }
  function rememberInput(target){
    const field=target?.dataset?.field;
    if(field){
      if(field==='organizationId'){s.data.organizationId=target.value;s.data.companyId='';s.data.companyMode='existing';s.data.editionId='';s.data.editionMode='existing';s.data.selectedIds=[];s.data.newLearners=[];draw();return;}
      if(field==='companyId'){s.data.companyId=target.value==='new'?'':target.value;s.data.companyMode=target.value==='new'?'new':'existing';draw();return;}
      if(field==='editionId'){s.data.editionId=target.value==='new'?'':target.value;s.data.editionMode=target.value==='new'?'new':'existing';draw();return;}
      s.data[field]=target.type==='checkbox'?target.checked:target.value;return;
    }
    const l=s.data.newLearners.find(x=>x.localId===target?.dataset?.person);
    if(l&&target.dataset.personField)l[target.dataset.personField]=target.value;
    if(target?.dataset?.existing){
      const key=target.dataset.existing;
      s.data.selectedIds=target.checked?[...new Set(s.data.selectedIds.concat([key]))]:s.data.selectedIds.filter(x=>x!==key);
    }
  }
  async function refreshThenDraw(){
    await load();
    shell();
  }
  async function next(){
    const st=s.data,r=s.records;
    if(st.step===0){
      if(!st.organizationId)throw new Error('Seleziona un’organizzazione.');
      if(st.companyMode==='new'){
        if(!st.companyName.trim())throw new Error('Inserisci la ragione sociale.');
        const id=await rpc('admin_save_company',{p_company_id:null,p_organization_id:st.organizationId,p_name:st.companyName,p_vat_number:st.vat||null,p_fiscal_code:st.fiscal||null,p_ateco_code:st.ateco||null});
        st.companyId=id;st.companyMode='existing';await load();
      }
      if(!s.records.companies.some(c=>c.id===st.companyId&&c.organization_id===st.organizationId))throw new Error('Seleziona un’azienda valida.');
      st.step=1;
    } else if(st.step===1){
      if(st.editionMode==='new'){
        const allowed=readyVersions(s.records.courses,s.records.versions);
        if(!allowed.some(v=>v.id===st.versionId))throw new Error('Seleziona una versione pubblicata e approvata.');
        if(st.availableFrom&&st.availableUntil&&new Date(st.availableUntil)<new Date(st.availableFrom))throw new Error('Le date di disponibilità non sono valide.');
        const id=await rpc('admin_create_edition',{p_organization_id:st.organizationId,p_company_id:st.companyId,p_course_version_id:st.versionId,p_title:st.editionTitle||null,p_learning_mode:st.learningMode,p_status:'open',p_available_from:st.availableFrom?new Date(st.availableFrom).toISOString():null,p_available_until:st.availableUntil?new Date(st.availableUntil).toISOString():null});
        st.editionId=id;st.editionMode='existing';await load();
      }
      const versions=new Set(readyVersions(s.records.courses,s.records.versions).map(x=>x.id));
      const allowed=eligibleEditions(s.records.editions,st.companyId,st.organizationId,versions);
      if(!allowed.some(e=>e.id===st.editionId))throw new Error('Seleziona un’edizione aperta e compatibile.');
      st.step=2;
    } else if(st.step===2){
      const existing=eligibleLearners(r.learners,st.companyId,st.organizationId);
      if(st.selectedIds.some(id=>!existing.some(l=>l.id===id)))throw new Error('Uno dei corsisti selezionati non appartiene all’azienda.');
      if(!st.selectedIds.length&&!st.newLearners.length)throw new Error('Seleziona o aggiungi almeno un corsista.');
      const usedCf=new Set(),usedEmail=new Set();
      for(const person of st.newLearners){
        if(!norm(person.first_name)||!norm(person.last_name))throw new Error('Nome e cognome sono obbligatori per i nuovi corsisti.');
        const dup=duplicateLearner(person,r.learners,st.organizationId);
        if(dup)throw new Error('Anagrafica probabilmente già presente ('+(dup.first_name||'')+' '+(dup.last_name||'')+'). Riutilizzala dalla sezione Corsisti oppure verifica l’azienda.');
        const cf=normalizeCf(person.fiscal_code),email=norm(person.email);
        if(cf&&usedCf.has(cf)||email&&usedEmail.has(email))throw new Error('Hai inserito due nuovi corsisti con email o codice fiscale uguale.');
        if(cf)usedCf.add(cf);
        if(email)usedEmail.add(email);
      }
      st.step=3;
    }
    s.notice='';shell();
  }
  async function invite(ids){
    const failed=[],sent=[];
    for(const id of ids){
      if(!ACTIVE())throw new Error('Sessione cambiata prima del completamento degli inviti.');
      const learner=s.records.learners.find(x=>x.id===id);
      if(!learner||learner.auth_user_id)continue;
      if(!learner.email){failed.push(id);continue;}
      try{
        const {data,error}=await db().functions.invoke('invite-learner',{body:{learner_id:id,redirect_to:new URL('?onboarding=1',location.href).toString()}});
        if(error||data?.error)throw error||new Error(data.message||data.error);
        if(data?.already_linked)continue;
        sent.push(id);
      }catch(error){failed.push(id);console.warn('[Guided flow invite]',error?.message||error);}
    }
    return {failed,sent};
  }
  async function submit(){
    const st=s.data;
    if(!ACTIVE())throw new Error('Sessione non valida.');
    const original=st.selectedIds.slice();
    for(const p of st.newLearners){
      if(!p.createdId){
        p.createdId=await rpc('admin_save_learner',{p_learner_id:null,p_organization_id:st.organizationId,p_company_id:st.companyId,p_first_name:p.first_name,p_last_name:p.last_name,p_email:p.email||null,p_fiscal_code:p.fiscal_code||null,p_job_title:p.job_title||null});
      }
      original.push(p.createdId);
    }
    const ids=[...new Set(original)];
    if(!ids.length)throw new Error('Nessun corsista disponibile.');
    const result=await rpc('admin_bulk_enroll',{p_edition_id:st.editionId,p_learner_ids:ids,p_source:'admin_guided_flow_v22'});
    st.result={...result,invited:0,failedIds:[]};
    if(st.sendInvites){
      await load();
      const invites=await invite(ids);
      st.result.invited=invites.sent.length;
      st.result.failedIds=invites.failed;
    }
    st.step=4;
    const key=draftKey();if(key)sessionStorage.removeItem(key);
    shell();
  }
  async function action(type,target){
    if(s.busy)return;
    if(type==='draft'){
      const key=draftKey();if(!key)return;
      sessionStorage.setItem(key,JSON.stringify(draftSafe(s.data)));
      return toast('Selezioni salvate in questa sessione. Per privacy, i dati dei nuovi corsisti non vengono salvati nella bozza.');
    }
    if(type==='reset'){
      if(s.data.step!==4&&!confirm('Ricominciare? I dati già creati sul server restano disponibili.'))return;
      s.data=empty();s.notice='';await load();shell();return;
    }
    if(type==='back'){s.data.step=Math.max(0,s.data.step-1);s.notice='';shell();return;}
    if(type==='select-all'){
      s.data.selectedIds=eligibleLearners(s.records.learners,s.data.companyId,s.data.organizationId).map(x=>x.id);draw();return;
    }
    if(type==='add-person'){
      s.data.newLearners.push({localId:'new-'+(++s.serial),first_name:'',last_name:'',email:'',fiscal_code:'',job_title:''});draw();return;
    }
    if(type==='go-enrollments'){await window.SAFETY_ADMIN?.setTab?.('enrollments');return;}
    if(type==='go-access'){
      document.getElementById('adminAccessImportNav')?.click();
      await window.SAFETY_ADMIN_ACCESS_IMPORT_V21?.openCompany?.(s.data.companyId);
      return;
    }
    s.busy=true;
    const button=target;if(button)button.disabled=true;
    try{
      if(type==='next')await next();
      if(type==='submit')await submit();
      if(type==='retry-invites'){
        const ids=s.data.result?.failedIds||[],inv=await invite(ids);
        s.data.result.invited+=inv.sent.length;s.data.result.failedIds=inv.failed;shell();
      }
    }catch(e){toast(e?.message||'Operazione non riuscita.','error');}
    finally{s.busy=false;if(button?.isConnected)button.disabled=false;}
  }
  async function render({isCurrent}={}){
    const host=document.getElementById('adminContent');
    if(!host||!db()||!user())return;
    const generation=++s.rendering,who=user().id;
    if(s.userId!==who){s.userId=who;s.data=empty();s.records=null;s.notice='';}
    s.host=host;
    host.innerHTML='<div class="admin-loading">Preparo il percorso guidato…</div>';
    try{
      await load();
      if(generation!==s.rendering||user()?.id!==who||isCurrent&&!isCurrent())return;
      const key=draftKey(),raw=key&&sessionStorage.getItem(key);
      if(raw&&s.data.step===0&&!s.data.companyId){
        try{const saved=JSON.parse(raw);
          if(saved.companyId&&s.records.companies.some(x=>x.id===saved.companyId)){
            s.data.organizationId=saved.organizationId;s.data.companyId=saved.companyId;
            s.data.editionId=saved.editionId||'';
            s.data.selectedIds=Array.isArray(saved.selectedIds)?saved.selectedIds.filter(x=>typeof x==='string'):[];
            s.notice='Bozza di selezioni recuperata. Ricontrolla prima di confermare.';
          }
        }catch{sessionStorage.removeItem(key);}
      }
      shell();
      if(!host.dataset.guidedHandlersBound){
        host.dataset.guidedHandlersBound='1';
        host.addEventListener('input',e=>{if(!host.contains(e.target))return;rememberInput(e.target);});
        host.addEventListener('change',e=>{if(!host.contains(e.target))return;rememberInput(e.target);});
        host.addEventListener('click',e=>{
          const remove=e.target.closest('[data-remove]');
          if(remove){s.data.newLearners=s.data.newLearners.filter(x=>x.localId!==remove.dataset.remove);draw();return;}
          const b=e.target.closest('[data-gw]');if(b)void action(b.dataset.gw,b);
        });
      }
    }catch(e){if(generation===s.rendering)host.innerHTML='<div class="admin-error">'+esc(e.message||e)+'</div>';}
  }
  window.SAFETY_ADMIN_GUIDED_FLOW_V22={render};
})();