/* SafetyTraining — grouped/collapsible course navigation.
   Keeps initial courses and updates together inside stable didactic families. */
(() => {
  'use strict';

  const STORAGE_KEY='safetyTrainingOpenCourseGroups';
  const host=()=>document.getElementById('sideCourses');
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const isLearner=()=>!!cloud()?.state?.learner;
  const isAuthenticated=()=>!!cloud()?.state?.user;
  const localRows=()=>Array.isArray(window.SAFETY_DATA)?window.SAFETY_DATA.map(c=>({stable_key:c.id,title:c.title,family:c.family||'',unit_count:(c.topics||[]).length,icon:c.icon||'📘'})):[];
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const hay=row=>norm([row.stable_key,row.title,row.family].filter(Boolean).join(' '));
  const isUpdate=row=>/(^|[\s:_-])(agg|aggiornamento|aggiornamenti|update)([\s:_-]|$)/.test(hay(row))||norm(row.title).includes('aggiorn');

  const GROUPS=[
    {id:'workers',icon:'👷',label:'Lavoratori e aggiornamenti',test:r=>/lavorator|workers/.test(hay(r))&&!/prepost|dirigent|datore|rls/.test(hay(r))},
    {id:'roles',icon:'🧭',label:'Preposti e Dirigenti',test:r=>/prepost|dirigent|agg_prep|agg_dir/.test(hay(r))},
    {id:'employer',icon:'🏢',label:'Datori di lavoro e DL-RSPP',test:r=>/datore|dl[\s:_-]*rspp|dl spp|dlspp/.test(hay(r))},
    {id:'rspp',icon:'🛡️',label:'RSPP e ASPP',test:r=>/rspp|aspp/.test(hay(r))&&!/datore|dl[\s:_-]*rspp|dlspp/.test(hay(r))},
    {id:'rls',icon:'👥',label:'RLS e rappresentanza',test:r=>/(^|[\s:_-])rls([\s:_-]|$)|rappresentant/.test(hay(r))},
    {id:'firstaid',icon:'🚑',label:'Primo soccorso',test:r=>/primo soccorso|primo_soccorso|first[\s:_-]*aid/.test(hay(r))},
    {id:'fire',icon:'🔥',label:'Antincendio',test:r=>/antincendio|(^|[\s:_-])fire([\s:_-]|$)/.test(hay(r))},
    {id:'equipment',icon:'🚜',label:'Attrezzature di lavoro',test:r=>/attrezzatur|attr_|carrell|gru|carroponte|trattor|mmt|escavator|ple|pompe|piattaform|cmm|crf/.test(hay(r))},
    {id:'construction',icon:'🏗️',label:'Cantieri, CSP/CSE e Ponteggi',test:r=>/csp|cse|coordinator|cantier|pontegg/.test(hay(r))&&!/stradal|traffico|segnaletica/.test(hay(r))},
    {id:'height',icon:'🧗',label:'Lavori in quota e su funi',test:r=>/quota|funi|anticadut|dpi iii|lavori in altezza/.test(hay(r))},
    {id:'confined',icon:'🫁',label:'Spazi confinati',test:r=>/confinat|sospett.*inquin/.test(hay(r))},
    {id:'roads',icon:'🚧',label:'Segnaletica stradale e traffico',test:r=>/segnaletica|stradal|traffico/.test(hay(r))},
    {id:'specialist',icon:'🧩',label:'Rischi specialistici e altri percorsi',test:()=>true}
  ];

  function groupFor(row){return GROUPS.find(g=>g.test(row))||GROUPS[GROUPS.length-1];}
  function openState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}}
  function saveOpenState(){
    const state={};
    host()?.querySelectorAll('.course-group').forEach(d=>{state[d.dataset.groupId]=d.open;});
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  }
  function currentCourseKey(){
    const p=location.hash.replace(/^#/,'').split('/').filter(Boolean);
    return (p[0]==='course'||p[0]==='library')?decodeURIComponent(p[1]||''):'';
  }
  function openRow(row){
    const local=(window.SAFETY_DATA||[]).some(c=>c.id===row.stable_key);
    location.hash=`${local?'course':'library'}/${row.stable_key}`;
    document.body.classList.remove('mobile-nav-open');
    document.getElementById('mobileNavBackdrop')?.classList.remove('open');
  }

  function render(rows){
    const gate=window.SAFETY_ACCESS_V46_10;
    if(!gate?.canBrowse?.())return;
    rows=gate.rowsForViewer(rows);
    const root=host();if(!root)return;
    const data=[...new Map((rows||[]).filter(r=>r?.stable_key).map(r=>[r.stable_key,r])).values()];
    const grouped=new Map(GROUPS.map(g=>[g.id,[]]));
    data.forEach(row=>grouped.get(groupFor(row).id).push(row));
    grouped.forEach(items=>items.sort((a,b)=>Number(isUpdate(a))-Number(isUpdate(b))||String(a.title||'').localeCompare(String(b.title||''),'it',{sensitivity:'base'})));

    const remembered=openState();
    const activeKey=currentCourseKey();
    root.innerHTML='';
    root.classList.add('course-grouped-nav');

    GROUPS.forEach((g,index)=>{
      const items=grouped.get(g.id)||[];if(!items.length)return;
      const details=document.createElement('details');
      details.className='course-group';details.dataset.groupId=g.id;
      const containsActive=items.some(r=>r.stable_key===activeKey);
      details.open=containsActive||(g.id in remembered?!!remembered[g.id]:index===0);

      const summary=document.createElement('summary');summary.className='course-group-summary';
      const icon=document.createElement('span');icon.className='course-group-icon';icon.textContent=g.icon;
      const label=document.createElement('span');label.className='course-group-label';label.textContent=g.label;
      const count=document.createElement('span');count.className='course-group-count';count.textContent=String(items.length);
      const chevron=document.createElement('span');chevron.className='course-group-chevron';chevron.textContent='›';
      summary.append(icon,label,count,chevron);details.appendChild(summary);

      const list=document.createElement('div');list.className='course-group-items';
      items.forEach(row=>{
        const b=document.createElement('button');
        b.className='navbtn course-group-course';b.dataset.courseKey=row.stable_key;
        if(row.stable_key===activeKey)b.classList.add('active');
        const ready=Number(row.unit_count||0)>0;
        const mark=document.createElement('span');mark.className='course-group-course-icon';mark.textContent=ready?'📘':'📝';
        const text=document.createElement('span');text.className='course-group-course-title';text.textContent=row.title||row.stable_key;
        b.append(mark,text);
        if(isUpdate(row)){
          const badge=document.createElement('span');badge.className='course-update-badge';badge.textContent='AGG.';b.appendChild(badge);
        }
        b.title=`${row.title||row.stable_key}${ready?' · materiale disponibile':''}`;
        b.addEventListener('click',()=>openRow(row));list.appendChild(b);
      });
      details.appendChild(list);details.addEventListener('toggle',saveOpenState);root.appendChild(details);
    });
  }

  function syncActive(){
    const key=currentCourseKey();
    host()?.querySelectorAll('[data-course-key]').forEach(b=>b.classList.toggle('active',b.dataset.courseKey===key));
    const active=host()?.querySelector(`[data-course-key="${CSS.escape(key)}"]`);
    if(active)active.closest('details')?.setAttribute('open','');
  }

  async function waitCloud(){for(let i=0;i<40&&!db();i++)await new Promise(r=>setTimeout(r,150));return db();}
  async function loadFull(){
    if(!window.SAFETY_ACCESS_V46_10?.canBrowse?.())return;
    render(localRows());
    const client=await waitCloud();
    if(!client||!isAuthenticated()||isLearner())return;
    try{
      const {data,error}=await client.rpc('training_catalog_summary');
      if(error)throw error;
      if(Array.isArray(data)&&data.length)render(data);
    }catch(e){console.warn('[Sidebar course groups]',e?.message||e);}
  }

  function boot(){
    if(window.SAFETY_ACCESS_V46_10?.canBrowse?.())render(localRows());loadFull();
    document.addEventListener('safety:access-ready',()=>{if(window.SAFETY_ACCESS_V46_10?.canBrowse?.())void loadFull();});
    window.addEventListener('hashchange',syncActive);
    cloud()?.state?.client?.auth?.onAuthStateChange(()=>setTimeout(loadFull,250));
  }
  window.SAFETY_SIDEBAR_GROUPS={render,loadFull,groupFor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
