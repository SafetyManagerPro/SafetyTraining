/* v47: no account, no login, only the assigned course through a personal bearer link. */
(()=>{'use strict';
 const API='https://ejkwvatmzdqqjozpxntk.supabase.co/functions/v1/internal-course';
 const KEY='sb_publishable_bn9DnocbbBEcf98WAwcSHw_wABCiOSA';
 const root=document.getElementById('internalApp');
 const state={token:'',course:null,units:[],visited:new Set(),position:0,lastUnit:null,viewing:false,menuOpen:false,busy:false};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const text=x=>typeof x==='string'?x.trim():String(typeof x==='number'?x:'').trim();
 const pct=()=>Math.round(100*state.visited.size/Math.max(1,new Set(state.units.map(u=>u.unit_id)).size));
 function parseToken(){
  const fragment=new URLSearchParams(location.hash.replace(/^#/,''));
  const query=new URLSearchParams(location.search);
  const token=fragment.get('t')||query.get('t')||'';
  return /^[A-Za-z0-9_-]{43}$/.test(token)?token:'';
 }
 async function request(action,unitId){
  const body={action,token:state.token};
  if(unitId)body.unit_id=unitId;
  const resp=await fetch(API,{method:'POST',cache:'no-store',referrerPolicy:'no-referrer',
   headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify(body)});
  const json=await resp.json().catch(()=>({}));
  if(!resp.ok||json.error)throw new Error(resp.status===404?'Il collegamento non è valido oppure è stato disattivato.':'Impossibile connettersi al corso. Verifica Internet e riprova.');
  return json;
 }
 function showError(message){
  root.innerHTML='<section class="ip-error"><div class="ip-logo">SAFETYTRAINING</div><h1>Non posso aprire il corso</h1>'+
   '<p>'+esc(message)+'</p><p>Chiedi all’amministratore un nuovo collegamento personale.</p></section>';
 }
 function progress(){return '<div class="ip-progress" role="progressbar" aria-valuenow="'+pct()+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+pct()+'%"></span></div>';}
 function hero(){
  const c=state.course.course||{},last=state.lastUnit;
  root.innerHTML='<header class="ip-header"><div class="ip-logo">SAFETYTRAINING</div><small>Formazione interna</small></header>'+
   '<section class="ip-hero"><div><div class="ip-eyebrow">Il tuo corso interno</div>'+
   '<h1>'+esc(c.title||'Corso assegnato')+'</h1><p>'+esc(c.description||'Percorso interno, accessibile senza registrazione.')+'</p></div>'+
   '<div class="ip-meta"><span class="ip-pill">Benvenuto '+esc(state.course.person_first_name||'')+'</span>'+
   '<span class="ip-pill">'+state.units.length+' sezioni</span>'+
   '<span class="ip-pill">'+(c.nominal_minutes?esc(c.nominal_minutes)+' min indicativi · ':'')+'non certificante</span></div>'+
   '<div>'+progress()+'<p class="ip-footnote">'+pct()+'% delle sezioni aperte · l’accesso non costituisce certificazione, attestato o verifica dell’identità.</p></div>'+
   '<div><button class="ip-primary" id="ipStart">'+(last?'Riprendi il corso':'Avvia corso')+'</button></div></section>';
  document.getElementById('ipStart').onclick=()=>void visit(Math.max(0,state.units.findIndex(u=>u.unit_id===last)));
 }
 function renderValue(v,depth=0){
  if(v==null||v===false||depth>3)return '';
  if(typeof v==='string'||typeof v==='number')return '<p>'+esc(v)+'</p>';
  if(Array.isArray(v)){
   if(!v.length)return '';
   return '<ul>'+v.map(x=>'<li>'+(typeof x==='object'?renderValue(x,depth+1):esc(x))+'</li>').join('')+'</ul>';
  }
  if(typeof v==='object'){
   return Object.entries(v).filter(([k,x])=>x!=null&&x!==''&&!['correct','correct_index','teacher','teacher_notes','teacher_expansion','answer','solution'].includes(k)).map(([k,x])=>{
    const label={before:'Prima',during:'Durante',after:'Dopo',objective:'Obiettivo',observe:'Osserva',
     apply:'Applica',importance:'Perché è importante',if_problem:'Se emerge un problema',
     stop_conditions:'Quando fermarsi',step_by_step:'Passaggi',remember:'Da ricordare',
     adaptation:'Adattamento',title:'Titolo',caption:'Didascalia',file:'File',question:'Domanda',
     answers:'Possibili risposte'}[k]||k.replaceAll('_',' ');
    return '<div><strong>'+esc(label)+'</strong>'+renderValue(x,depth+1)+'</div>';
   }).join('');
  }
  return '';
 }
 function section(title,value){
  if(value==null||value===''||(Array.isArray(value)&&!value.length))return '';
  return '<section class="ip-card"><h2>'+esc(title)+'</h2>'+renderValue(value)+'</section>';
 }
 function images(content){
  const data=[...(Array.isArray(content.idea_images)?content.idea_images:[]),...(Array.isArray(content.visuals)?content.visuals:[])];
  const found=[];
  for(const item of data){
   const file=typeof item==='string'?item:String(item?.file||item?.image||'');
   // Restrict to reviewed same-origin illustrations; do not load arbitrary URLs.
   if(!/^[a-z0-9_-]+\.(svg|png|jpg|jpeg|webp)$/i.test(file))continue;
   if(found.some(x=>x.file===file))continue;
   found.push({file,caption:typeof item==='object'?String(item?.caption||''):''});
  }
  if(!found.length)return '';
  return '<section class="ip-card"><h2>Immagini e schemi del corso</h2><div class="ip-visuals">'+
   found.map(x=>'<figure><img loading="lazy" alt="'+esc(x.caption||'Illustrazione didattica')+'" src="./assets/'+encodeURIComponent(x.file)+'" referrerpolicy="no-referrer"><figcaption>'+esc(x.caption||'Schema didattico')+'</figcaption></figure>').join('')+
   '</div></section>';
 }
 function quiz(value){
  if(!value||!Array.isArray(value.answers)||!value.answers.length)return '';
  return '<section class="ip-card"><h2>Domanda di autovalutazione</h2><p>'+esc(value.question||'Rifletti sulle possibili risposte')+'</p>'+
   '<div class="ip-check">'+value.answers.map(x=>'<label><input type="radio" name="ipQuiz"> '+esc(x)+'</label>').join('')+'</div>'+
   '<p class="ip-footnote">Esercizio di riflessione non valutato. Nessuna prova certificante.</p></section>';
 }
 function resources(items){
  if(!Array.isArray(items))return '';
  const html=items.map(x=>{
   const url=String(x?.url||'');
   if(!/^https:\/\//i.test(url))return '';
   return '<li><a href="'+esc(url)+'" target="_blank" rel="noreferrer noopener" referrerpolicy="no-referrer">'+esc(x?.title||x?.source||'Approfondimento')+'</a></li>';
  }).filter(Boolean);
  return html.length?'<section class="ip-card"><h2>Fonti e approfondimenti</h2><ul>'+html.join('')+'</ul></section>':'';
 }
 function lessonContent(content){
  const c=content&&typeof content==='object'?content:{};
  return '<p class="ip-intro">'+esc(c.summary||'')+'</p>'+
   section('Spiegazione',c.detail)+
   section('Punti di attenzione',c.focus)+
   section('Rischi',c.risks)+
   section('Misure di prevenzione',c.prevention)+
   section('Procedura',c.procedure||c.steps||c.step_by_step)+
   section('Dispositivi di protezione',c.dpi||c.ppe)+
   images(c)+
   section('Passaggi operativi',c.operational)+
   section('Osserva, comprendi, applica',c.guided)+
   section('Comportamenti corretti',c.good)+
   section('Da evitare',c.bad)+
   section('Caso pratico',c.case||c.example_story)+
   section('Domande per riflettere',c.question)+
   section('Approfondimento',c.deepdetail)+
   section('Errori frequenti',c.common_errors)+
   section('Schede grafiche',c.graphic_cards)+
   quiz(c.quiz)+resources(c.resources||c.evidence_sources);
 }
 function display(){
  const unit=state.units[state.position],count=state.units.length;
  if(!unit)return showError('Nessun contenuto disponibile nel corso selezionato.');
  const nav=state.units.map((u,i)=>{
   const done=state.visited.has(u.unit_id);
   return '<button type="button" data-ip-unit="'+i+'"'+(i===state.position?' aria-current="step"':'')+'>'+
    '<span class="'+(done?'ip-done':'')+'">'+(done?'✓ ':'')+(i+1)+'. </span>'+esc(u.title)+'</button>';
  }).join('');
  root.innerHTML='<header class="ip-header"><div class="ip-logo">SAFETYTRAINING</div>'+
   '<button id="ipMobileToggle" class="ip-secondary ip-mobile-toggle" aria-expanded="'+state.menuOpen+'">Sezioni ☰</button>'+
   '<small>'+pct()+'% delle sezioni aperte</small></header>'+
   '<div class="ip-course'+(state.menuOpen?' ip-menu-open':'')+'">'+
   '<aside class="ip-sidebar"><h2>'+esc(state.course.course.title)+'</h2><p>Avanzamento '+pct()+'% · '+state.visited.size+' sezioni visitate</p>'+
   progress()+'<nav class="ip-nav" aria-label="Sezioni del corso">'+nav+'</nav></aside>'+
   '<article class="ip-stage"><div class="ip-stage-head"><span class="ip-eyebrow">Sezione '+(state.position+1)+' di '+count+'</span>'+
   '<button class="ip-secondary" id="ipHome">Panoramica</button></div>'+
   '<h1>'+esc(unit.content?.slide_title||unit.content?.title||unit.title)+'</h1>'+
   '<p class="ip-footnote">Modulo: '+esc(unit.module_title)+'</p>'+
   lessonContent(unit.content)+
   '<div class="ip-actions"><button class="ip-secondary" id="ipPrevious"'+(state.position===0?' disabled':'')+'>← Indietro</button>'+
   '<button class="ip-primary" id="ipNext">'+(state.position===count-1?'Termina la lettura':'Sezione successiva →')+'</button></div>'+
   '<p class="ip-footnote">Il salvataggio avviene quando apri una sezione. Puoi chiudere questa pagina e riprendere con lo stesso link.</p>'+
   '</article></div>';
  root.querySelectorAll('[data-ip-unit]').forEach(b=>b.onclick=()=>void visit(Number(b.dataset.ipUnit)));
  document.getElementById('ipPrevious').onclick=()=>void visit(state.position-1);
  document.getElementById('ipNext').onclick=()=>{
   if(state.position===count-1){state.viewing=false;hero();}
   else void visit(state.position+1);
  };
  document.getElementById('ipHome').onclick=()=>{state.viewing=false;hero();};
  document.getElementById('ipMobileToggle').onclick=()=>{
   state.menuOpen=!state.menuOpen;
   root.querySelector('.ip-course')?.classList.toggle('ip-menu-open',state.menuOpen);
   document.getElementById('ipMobileToggle').setAttribute('aria-expanded',String(state.menuOpen));
  };
 }
 async function visit(index){
  if(state.busy||index<0||index>=state.units.length)return;
  state.busy=true;
  const u=state.units[index];
  try{
   const result=await request('visit',u.unit_id);
   state.position=index;state.viewing=true;state.menuOpen=false;
   state.visited.add(u.unit_id);state.lastUnit=u.unit_id;
   // The server is authoritative; local set only mirrors a successful write.
   if(Number(result.progress?.visited_count)!==state.visited.size){
    const open=await request('open');state.visited=new Set(open.course.visited_unit_ids||[]);
   }
   display();window.scrollTo(0,0);
  }catch(error){showError(error?.message||'Impossibile salvare i progressi.');}
  finally{state.busy=false;}
 }
 async function boot(){
  state.token=parseToken();
  if(!state.token)return showError('Il collegamento personale è mancante o non è valido.');
  try{
   const result=await request('open');
   const bundle=result.course||{};
   state.course=bundle;
   state.visited=new Set(bundle.visited_unit_ids||[]);
   state.lastUnit=bundle.last_unit_version_id||null;
   state.units=(Array.isArray(bundle.modules)?bundle.modules:[]).flatMap(m=>
    (Array.isArray(m.units)?m.units:[]).map(u=>({...u,module_title:m.title||'Modulo'}))
   );
   if(!state.units.length)return showError('Questo corso non ha ancora sezioni disponibili.');
   hero();
  }catch(error){showError(error?.message||'Impossibile aprire il corso.');}
 }
 void boot();
})();