/* SafetyTraining v46.10 — authentication FIRST, role and enrollment scoped UI.
 * This is a UX guard; protected database records remain governed by Supabase RLS.
 * Never grant rights based on client-editable user_metadata or hidden UI alone. */
(()=>{'use strict';
 const ROLES=new Set(['organization_admin','training_manager','teacher','tutor']);
 const state={phase:'pending',userId:null,allowedKeys:new Set(),staffRoles:[],serial:0,busy:false,booted:false,reason:''};
 const cloud=()=>window.SAFETY_CLOUD?.state;
 const client=()=>cloud()?.client;
 const currentUser=()=>cloud()?.user;
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const isAuthenticated=()=>['admin','staff','learner'].includes(state.phase);
 const canBrowse=()=>state.phase==='admin'||state.phase==='staff';
 const rowsForViewer=rows=>{
  const list=Array.isArray(rows)?rows:[];
  if(state.phase==='admin')return list;
  if(state.phase==='staff')return list.filter(row=>state.allowedKeys.has(String(row.stable_key||row.id||'')));
  return [];
 };
 const canOpen=(key)=>{
  const stableKey=String(key||'');
  if(!stableKey)return false;
  if(state.phase==='admin')return true;
  if(state.phase==='staff')return state.allowedKeys.has(stableKey);
  if(state.phase==='learner')return !!window.SAFETY_LEARNER_NAV_V22?.assigned?.(cloud()?.assignments,stableKey);
  return false;
 };
 const canVisit=(hash=location.hash)=>{
  if(!isAuthenticated())return false;
  const parts=String(hash||'').replace(/^#/,'').split('/').filter(Boolean);
  if(!parts.length)return true;
  if(!['course','topic','deck','lab','resources','library'].includes(parts[0]))return false;
  let key='';try{key=decodeURIComponent(parts[1]||'');}catch{return false;}
  if(parts[0]==='library')return canBrowse()&&canOpen(key);
  return canOpen(key);
 };
 const locked=()=>!isAuthenticated();
 const notify=(message,kind='')=>{
  const root=document.getElementById('stAccessMessage');if(!root)return;
  root.textContent=message||'';root.className='st-access-status '+kind;
 };
 function setPhase(phase,reason=''){
  const before=state.phase;
  state.phase=phase;state.reason=reason;
  document.body.classList.remove('st-access-pending','st-access-guest','st-access-admin','st-access-staff','st-access-learner','st-access-denied','st-access-error');
  document.body.classList.add('st-access-'+phase);
  const text=document.getElementById('stAccessDenied');
  if(text)text.textContent=phase==='error'?'Impossibile verificare i permessi. Riprova l’accesso o contatta l’amministratore.':
    'Questo account è autenticato ma non risulta autorizzato ad alcun corso o funzione amministrativa. Contatta il responsabile della formazione.';
  if(['guest','denied','error'].includes(phase)){
    // Prevent a stale learner/admin session, sidebar or deck from remaining visible.
    document.body.classList.remove('mobile-nav-open','admin-open','deckmode','bigscreen');
    document.getElementById('adminShell')?.classList.add('hidden');
    document.getElementById('learnerShell')?.classList.add('hidden');
    document.getElementById('cloudOverlay')?.classList.add('hidden');
    document.getElementById('app')?.replaceChildren();
    document.getElementById('sideCourses')?.replaceChildren();
    const search=document.getElementById('search');if(search)search.value='';
  }
  if(phase==='learner'){
    document.getElementById('adminShell')?.classList.add('hidden');
    document.body.classList.remove('admin-open');
    document.getElementById('search')?.setAttribute('hidden','');
  }
  if(phase!=='pending'&&before!==phase)document.dispatchEvent(new CustomEvent('safety:access-ready',{detail:{phase}}));
 }
 function guardRoute({reset=true}={}){
  if(state.phase==='pending')return false;
  if(!isAuthenticated())return false;
  if(canVisit())return true;
  if(reset&&location.hash){
    // Replace rather than adding unauthorized deep links to browser history.
    history.replaceState(null,'',location.pathname+location.search);
    window.dispatchEvent(new Event('hashchange'));
  }
  return false;
 }
 async function resolve(){
  const serial=++state.serial, user=currentUser(), c=client(), id=user?.id||null;
  state.userId=id;state.allowedKeys=new Set();state.staffRoles=[];
  if(!c){setPhase('pending');return;}
  if(!user){setPhase('guest');return;}
  // Cloud resolves learner identity & assigned enrollments asynchronously.
  if(!cloud()?.identityReady){setPhase('pending');return;}
  setPhase('pending');
  try{
    const admin=await c.from('platform_admins').select('user_id').eq('user_id',id).maybeSingle();
    if(serial!==state.serial||currentUser()?.id!==id)return;
    if(admin.error)throw admin.error;
    if(admin.data){
      setPhase('admin');
      guardRoute();
      window.SAFETY_CATALOG?.load?.(true);
      // A platform administrator starts in the full administrative console.
      if(!document.body.classList.contains('admin-open'))void window.SAFETY_ADMIN?.open?.();
      else window.SAFETY_ADMIN?.refreshRole?.();
      return;
    }
    const memberships=await c.from('organization_memberships')
      .select('organization_id,company_id,role,active')
      .eq('user_id',id).eq('active',true);
    if(serial!==state.serial||currentUser()?.id!==id)return;
    if(memberships.error)throw memberships.error;
    const permitted=(memberships.data||[]).filter(r=>ROLES.has(r.role)&&r.organization_id);
    if(permitted.length){
      const orgs=new Set(permitted.map(x=>x.organization_id));
      const courseResult=await c.from('courses').select('id,stable_key,owner_organization_id').eq('active',true);
      if(serial!==state.serial||currentUser()?.id!==id)return;
      if(courseResult.error)throw courseResult.error;
      // Never show courses outside organizations confirmed in the membership registry.
      const allowedCourseIds=new Set((courseResult.data||[])
        .filter(x=>orgs.has(x.owner_organization_id)).map(x=>x.id).filter(Boolean));
      // A course owned globally may still be assigned to this organization
      // through a concrete edition; include only that explicitly scoped course.
      const editionResult=await c.from('course_editions')
        .select('course_version_id,organization_id').in('organization_id',[...orgs]);
      if(serial!==state.serial||currentUser()?.id!==id)return;
      if(editionResult.error)throw editionResult.error;
      const versionIds=[...new Set((editionResult.data||[]).map(x=>x.course_version_id).filter(Boolean))];
      if(versionIds.length){
        const versions=await c.from('course_versions').select('id,course_id').in('id',versionIds);
        if(serial!==state.serial||currentUser()?.id!==id)return;
        if(versions.error)throw versions.error;
        for(const x of versions.data||[])allowedCourseIds.add(x.course_id);
      }
      state.allowedKeys=new Set((courseResult.data||[])
        .filter(x=>allowedCourseIds.has(x.id)).map(x=>x.stable_key).filter(Boolean));
      state.staffRoles=permitted.map(x=>x.role);
      setPhase('staff');guardRoute();
      if(permitted.some(x=>x.role==='organization_admin'||x.role==='training_manager') &&
          !document.body.classList.contains('admin-open'))void window.SAFETY_ADMIN?.open?.();
      window.SAFETY_SIDEBAR_GROUPS?.loadFull?.();
      window.SAFETY_CATALOG?.load?.(true);
      window.dispatchEvent(new Event('hashchange'));
      return;
    }
    if(cloud()?.learner){
      setPhase('learner');guardRoute();
      const main=document.getElementById('app');
      if(main&&!location.hash)main.innerHTML='<section class="hero"><h1>I miei corsi</h1><p>Visualizza esclusivamente i percorsi assegnati al tuo account.</p><button class="openbtn" type="button" id="stOpenMyCourses">Apri i miei corsi</button></section>';
      document.getElementById('stOpenMyCourses')?.addEventListener('click',()=>window.SAFETY_LEARNER?.open?.());
      window.SAFETY_LEARNER?.sync?.();
      if(!location.hash)window.SAFETY_LEARNER?.open?.();
      window.dispatchEvent(new Event('hashchange'));
      return;
    }
    setPhase('denied');
  }catch(e){
    if(serial!==state.serial||currentUser()?.id!==id)return;
    console.warn('[SafetyTraining access] permission check:',String(e?.message||e));
    setPhase('error');
  }
 }
 async function signIn(event){
  event.preventDefault();if(state.busy)return;
  const email=document.getElementById('stAccessEmail')?.value?.trim();
  const password=document.getElementById('stAccessPassword')?.value||'';
  if(!client()){notify('Il servizio di autenticazione non è disponibile. Riprova ricaricando la pagina.','error');return;}
  if(!email||!password)return;
  state.busy=true;
  const button=document.getElementById('stAccessSubmit');if(button)button.disabled=true;
  notify('Verifica delle credenziali in corso…');
  try{
    const {error}=await client().auth.signInWithPassword({email,password});
    if(error)throw error;
    notify('Credenziali corrette. Verifica dei permessi in corso…');
    setPhase('pending');
    const field=document.getElementById('stAccessPassword');if(field)field.value='';
  }catch(e){
    setPhase('guest');
    notify('Accesso non riuscito. Verifica email, password e attivazione dell’account.','error');
  }finally{state.busy=false;if(button)button.disabled=false;}
 }
 async function signOut(){
  state.serial++;
  setPhase('pending');
  await client()?.auth?.signOut?.();
  state.userId=null;state.allowedKeys.clear();state.staffRoles=[];
  setPhase('guest');
 }
 function boot(){
  if(state.booted)return;state.booted=true;
  document.getElementById('stAccessForm')?.addEventListener('submit',signIn);
  document.getElementById('stAccessOut')?.addEventListener('click',()=>void signOut());
  document.addEventListener('safety:auth-changed',()=>{state.serial++;setPhase('pending');});
  document.addEventListener('safety:cloud-state-changed',()=>{void resolve();});
  document.addEventListener('safety:cloud-unavailable',()=>setPhase('error'));
  window.addEventListener('hashchange',()=>{if(isAuthenticated())guardRoute();});
  // The cloud module may have completed session initialization before boot.
  if(client()&&cloud()?.identityReady)void resolve();
  else if(!client()&&!window.supabase?.createClient)setPhase('error');
 }
 window.SAFETY_ACCESS_V46_10={state,resolve,canOpen,canVisit,canBrowse,rowsForViewer,guardRoute,isAuthenticated,locked,boot};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
