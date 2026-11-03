/* SafetyTraining v39: stable grouped navigation, keeping original buttons and their handlers. */
(()=>{'use strict';
 const sections=[
  {id:'home',label:'PANORAMICA',icon:'▦',keys:['dashboard']},
  {id:'internal',label:'CORSISTI INTERNI',icon:'🔗',keys:['internal']},
  {id:'people',label:'ANAGRAFICHE E ACCESSI',icon:'👥',keys:['organizations','companies','learners','permissions','memberships']},
  {id:'enroll',label:'ISCRIZIONI E FORMAZIONE',icon:'✅',keys:['wizard','enrollments','registrations','access']},
  {id:'courses',label:'CORSI E DIDATTICA',icon:'📚',keys:['courses','editions','catalog','blueprint','readiness','quality','editorial','pathaudit']},
  {id:'assets',label:'MATERIALI E STAMPA',icon:'▤',keys:['images','lessons','slides','documents']},
  {id:'monitor',label:'CONTROLLO E REPORT',icon:'📊',keys:['reports','activity','misc']}
 ];
 const selectors={
  dashboard:'[data-tab="dashboard"]',internal:'#adminInternalV47Nav',organizations:'[data-tab="organizations"]',
  companies:'[data-tab="companies"]',learners:'[data-tab="learners"]',
  permissions:'#adminLearnerPermissionsNav',memberships:'#adminMembershipsNav',
  wizard:'[data-tab="wizard"]',enrollments:'[data-tab="enrollments"]',
  registrations:'#adminRegistrationNav',access:'#adminAccessImportNav',
  courses:'[data-tab="courses"]',editions:'[data-tab="editions"]',
  catalog:'[data-sm-course-catalog]',blueprint:'[data-blueprint-admin]',
  readiness:'[data-readiness-admin]',quality:'[data-quality-v22]',editorial:'[data-editorial-matrix-v46-5]',
  pathaudit:'[data-path-audit]',images:'[data-image-library-v25]',
  lessons:'[data-print-lessons-nav]',slides:'[data-print-slides-nav]',documents:'#adminCourseDocumentsNav',
  reports:'#adminReportsV40Nav',activity:'[data-tab="activity"]'
 };
 const route=new Map();
 sections.forEach(g=>g.keys.forEach(k=>route.set(k,g.id)));
 let pending=false,observer=null,nav=null,reconciling=false;
 function which(button){
  for(const [key,selector] of Object.entries(selectors)){
   if(button.matches(selector))return route.get(key);
  }
  const label=button.textContent.toLocaleLowerCase('it').trim();
  if(/stampa|pdf|immagin|grafich|figure|materiali/.test(label))return 'assets';
  if(/inviti|iscrizion|accessi|onboard|registrazion/.test(label))return 'enroll';
  if(/corsi|catalog|qualità|blueprint|readiness|didattic|percorsi/.test(label))return 'courses';
  if(/aziend|corsist|anagrafic|ruoli|permess|organizzazion/.test(label))return 'people';
  return 'monitor';
 }
 function visible(button){
  return !button.hidden&&!button.classList.contains('hidden')&&button.getAttribute('aria-hidden')!=='true';
 }
 function container(id){return nav?.querySelector('[data-admin-menu-items="'+id+'"]');}
 function reconcile(){
  if(reconciling)return;
  const root=document.querySelector('#adminShell .admin-nav nav');
  if(!root)return;
  if(nav!==root){observer?.disconnect();nav=root;observer=new MutationObserver(schedule);observer.observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});}
  reconciling=true;
  try{
   let advanced=nav.querySelector('[data-admin-menu-advanced]');
   if(!advanced){
    advanced=document.createElement('details');advanced.className='admin-menu-advanced';advanced.dataset.adminMenuAdvanced='1';
    advanced.innerHTML='<summary><span aria-hidden="true">⚙</span> GESTIONE E-LEARNING AVANZATA</summary><div class="admin-menu-advanced-items"></div>';
    nav.appendChild(advanced);
   }
   const advancedItems=advanced.querySelector('.admin-menu-advanced-items');
   for(const group of sections){
    let detail=nav.querySelector('[data-admin-menu-group="'+group.id+'"]');
    if(!detail){
     detail=document.createElement('details');detail.className='admin-menu-group';detail.dataset.adminMenuGroup=group.id;
     detail.innerHTML='<summary><span aria-hidden="true">'+group.icon+'</span> '+group.label+'</summary><div class="admin-menu-items" data-admin-menu-items="'+group.id+'"></div>';
     detail.open=group.id==='home'||group.id==='internal';
    }
    const parent=(group.id==='home'||group.id==='internal')?nav:advancedItems;
    if(detail.parentElement!==parent)parent.appendChild(detail);
   }
   // Keep daily-use links first; the optional advanced section remains below.
   for(const id of ['home','internal']){
    const d=nav.querySelector('[data-admin-menu-group="'+id+'"]');
    if(d && d.nextSibling!==advanced)nav.insertBefore(d,advanced);
   }
   const buttons=[...nav.querySelectorAll('button')].filter(b=>!b.closest('.admin-menu-group summary'));
   for(const button of buttons){
    const destination=container(which(button))||container('monitor');
    if(destination&&button.parentElement!==destination)destination.appendChild(button);
   }
   for(const group of sections){
    const detail=nav.querySelector('[data-admin-menu-group="'+group.id+'"]');
    const content=container(group.id);
    if(!detail||!content)continue;
    const ordered=group.keys.map(k=>nav.querySelector(selectors[k])).filter(b=>b&&b.parentElement===content);
    for(let i=0;i<ordered.length;i++){
     const target=content.children[i];
     if(target!==ordered[i])content.insertBefore(ordered[i],target||null);
    }
    const bs=[...content.querySelectorAll('button')];
    const isVisible=bs.some(visible);
    if(detail.hidden===isVisible)detail.hidden=!isVisible;
    if(bs.some(b=>b.classList.contains('active')&&visible(b))&&!detail.open)detail.open=true;
   }
   const advancedGroups=['people','enroll','courses','assets','monitor'];
   const anyAdvanced=advancedGroups.some(id=>{
    const group=nav.querySelector('[data-admin-menu-group="'+id+'"]');return group&&!group.hidden;
   });
   advanced.hidden=!anyAdvanced;
   if(advancedGroups.some(id=>{
    const group=nav.querySelector('[data-admin-menu-group="'+id+'"]');
    return group&&[...group.querySelectorAll('button')].some(b=>b.classList.contains('active')&&visible(b));
   }))advanced.open=true;
  }finally{reconciling=false;}
 }
 function schedule(){
  if(pending)return;
  pending=true;
  queueMicrotask(()=>{pending=false;reconcile();});
 }
 function boot(){
  schedule();
  document.addEventListener('safety:admin-capabilities',schedule);
  document.addEventListener('safety:auth-changed',schedule);
  document.querySelector('#adminShell .admin-nav')?.addEventListener('click',schedule);
  document.getElementById('adminConsoleBtn')?.addEventListener('click',schedule);
  document.getElementById('adminRefresh')?.addEventListener('click',schedule);
  window.SAFETY_ADMIN_MENU_V39={reconcile,sections:sections.map(s=>s.label)};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();