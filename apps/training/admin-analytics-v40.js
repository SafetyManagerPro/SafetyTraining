/* SafetyTraining v40 — scoped admin dashboards, course/student reporting, evidentiary summaries. */
(()=>{'use strict';
const db=()=>window.SAFETY_CLOUD?.state?.client,actor=()=>window.SAFETY_CLOUD?.state?.user?.id;
const cap=k=>{const c=window.SAFETY_ADMIN_CAPABILITIES_STATE;return !!(c?.platform_admin||c?.capabilities?.[k]);};
const allowed=()=>!!actor()&&(cap('manage_enrollments')||cap('manage_learners')||cap('manage_evidence'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&gt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc, fmt=n=>new Intl.NumberFormat('it-IT').format(Number(n)||0);
const date=v=>v?new Date(v).toLocaleDateString('it-IT'):'—';
const pct=v=>Math.min(100,Math.max(0,Number(v)||0));
const status=s=>({not_started:'Da iniziare',in_progress:'In corso',completed:'Completato',passed:'Superato',failed:'Non superato',revoked:'Revocato'})[s]||s||'—';
const done=s=>['completed','passed'].includes(s);
const num=v=>Number(v)||0;
let currentReportSeq=0,reportState={course:'',query:'',learner:'',includeRevoked:false,all:null,filtered:[]};
const CSS='.a40-root{display:grid;gap:16px}.a40-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(138px,1fr));gap:10px}.a40-kpi{border:1px solid rgba(255,255,255,.11);background:#102439;border-radius:12px;padding:15px}.a40-kpi strong{display:block;font-size:25px;color:#e7f9ff}.a40-kpi small{color:#afc2d2;font-size:12px}.a40-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(265px,1fr));gap:15px}.a40-bar{display:grid;grid-template-columns:minmax(94px,140px) minmax(0,1fr) 50px;align-items:center;gap:9px;padding:7px 0;font-size:12px}.a40-bar label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#d0deea}.a40-track{height:15px;background:#142a40;border-radius:8px;overflow:hidden}.a40-fill{height:100%;background:linear-gradient(90deg,#288caa,#44cdaa);min-width:0}.a40-bar b{text-align:right;font-variant-numeric:tabular-nums}.a40-filters{display:flex;gap:12px;flex-wrap:wrap;align-items:end}.a40-filters label{display:grid;gap:5px;min-width:180px;flex:1;font-size:12px}.a40-filters input,.a40-filters select{padding:10px;border:1px solid #496076;border-radius:9px;background:#0d2031;color:#fff;width:100%}.a40-actions{display:flex;gap:8px;flex-wrap:wrap}.a40-actions button,.a40-btn{padding:9px 12px;border-radius:8px;border:1px solid #55728a;background:#1a4059;color:#fff;font-weight:730;cursor:pointer}.a40-actions button:disabled{opacity:.45}.a40-table{overflow-x:auto}.a40-table table{width:100%;border-collapse:collapse;min-width:650px;font-size:12px}.a40-table th,.a40-table td{padding:10px;border-bottom:1px solid #304156;text-align:left}.a40-table th{color:#b9c9db}.a40-note{font-size:12px;color:#adbece;line-height:1.5}.a40-error{color:#ffadad}.a40-badge{display:inline-block;font-size:11px;padding:3px 7px;background:#28445b;border-radius:8px}.a40-badge.done{background:#165e50}.a40-badge.revoked{background:#68383f}.a40-student{padding:12px;border:1px solid #3b4d61;border-radius:10px;background:#102236}.a40-student dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}.a40-student dt{font-size:11px;color:#afc5d7}.a40-student dd{margin:3px 0;font-weight:730}.a40-title{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}.a40-loading{padding:14px;color:#bdd4e4}';
function initStyle(){if(document.getElementById('a40Style'))return;const s=document.createElement('style');s.id='a40Style';s.textContent=CSS;document.head.appendChild(s);}
async function paged(table,columns,{max=3000,filters=[]}={}){
 let rows=[],page=500,truncated=false;
 for(let start=0;start<max;start+=page){
  let query=db().from(table).select(columns).range(start,start+page-1);
  for(const [key,op,value] of filters){if(op==='eq')query=query.eq(key,value);else if(op==='in')query=query.in(key,value);}
  const {data,error}=await query;if(error)throw Error(table+': '+error.message);
  rows.push(...(data||[]));
  if(!data||data.length<page)return {rows,truncated:false};
 }
 truncated=true;return {rows,truncated};
}
function bars(entries,{percent=false}={}){
 const max=Math.max(1,...entries.map(x=>Number(x[1])||0));
 return entries.map(([label,value])=>'<div class="a40-bar"><label title="'+attr(label)+'">'+esc(label)+'</label><div class="a40-track"><div class="a40-fill" style="width:'+Math.min(100,Math.max(0,(Number(value)||0)/max*100)).toFixed(1)+'%"></div></div><b>'+fmt(value)+(percent?'%':'')+'</b></div>').join('')||'<p class="a40-note">Nessun dato disponibile.</p>';
}
function kpi(value,label){return '<div class="a40-kpi"><strong>'+fmt(value)+'</strong><small>'+esc(label)+'</small></div>';}
const month=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,7);};
function monthEntries(rows){
 const now=new Date(),keys=[];for(let i=5;i>=0;i--){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-i,1));keys.push(d.toISOString().slice(0,7));}
 const counts=new Map(keys.map(k=>[k,0]));rows.forEach(r=>{const k=month(r.enrolled_at);if(counts.has(k))counts.set(k,counts.get(k)+1);});
 return keys.map(k=>[new Date(k+'-01T12:00:00Z').toLocaleDateString('it-IT',{month:'short',year:'2-digit'}),counts.get(k)]);
}
async function dataset(){
 if(!allowed())throw Error('Accesso ai report riservato al personale autorizzato.');
 const [e,l,ed,v,c]=await Promise.all([
  paged('enrollments','id,learner_id,edition_id,status,progress_pct,active_seconds,final_score_pct,started_at,completed_at,enrolled_at,last_activity_at',{max:4000}),
  paged('learners','id,first_name,last_name,email,company_id,active',{max:4000}),
  paged('course_editions','id,course_version_id,title,status,company_id',{max:1500}),
  paged('course_versions','id,course_id',{max:1500}),
  paged('courses','id,title,nominal_minutes',{max:1500})
 ]);
 const learners=new Map(l.rows.map(x=>[x.id,x])),editions=new Map(ed.rows.map(x=>[x.id,x])),versions=new Map(v.rows.map(x=>[x.id,x])),courses=new Map(c.rows.map(x=>[x.id,x]));
 const rows=e.rows.map(x=>{const edition=editions.get(x.edition_id),course=courses.get(versions.get(edition?.course_version_id)?.course_id);
  return {...x,learner:learners.get(x.learner_id),edition,course,courseId:course?.id||'',courseTitle:course?.title||edition?.title||'Corso non disponibile',
    learnerName:[learners.get(x.learner_id)?.last_name,learners.get(x.learner_id)?.first_name].filter(Boolean).join(' ')||'Corsista non disponibile'};
 });
 return {rows,learners,editions,courses,truncated:[e,l,ed,v,c].some(x=>x.truncated)};
}
function statusEntries(rows){const bins=['not_started','in_progress','completed','passed','failed','revoked'];return bins.map(s=>[status(s),rows.filter(r=>r.status===s).length]);}
function dashboardMarkup(data){
 const rows=data.rows,active=rows.filter(x=>x.status!=='revoked');
 const finished=active.filter(x=>done(x.status)).length;
 const average=active.length?Math.round(active.reduce((sum,x)=>sum+pct(x.progress_pct),0)/active.length):0;
 const tests=active.filter(x=>x.final_score_pct!==null).length;
 const byCourse=new Map();active.forEach(r=>byCourse.set(r.courseTitle,(byCourse.get(r.courseTitle)||0)+1));
 const courses=[...byCourse].sort((a,b)=>b[1]-a[1]).slice(0,8);
 const needsAttention=rows.filter(x=>x.status==='in_progress'&&x.last_activity_at&&Date.now()-new Date(x.last_activity_at)>30*86400000).length;
 return '<div class="a40-root">'+
 '<div class="a40-kpis">'+kpi(active.length,'Iscrizioni attive')+kpi(finished,'Completate / superate')+
 kpi(average+'%','Avanzamento medio')+kpi(tests,'Esiti test registrati')+kpi(needsAttention,'Inattivi da oltre 30 giorni')+'</div>'+
 '<div class="a40-grid">'+
 '<section class="admin-card"><h2>Distribuzione dei percorsi</h2>'+bars(statusEntries(rows))+'</section>'+
 '<section class="admin-card"><h2>Nuove iscrizioni · ultimi 6 mesi</h2>'+bars(monthEntries(rows))+'</section>'+
 '<section class="admin-card"><h2>Corsi con più iscritti</h2>'+bars(courses)+'</section>'+
 '<section class="admin-card"><h2>Indicatori di avanzamento</h2>'+
 bars([['Non avviati',active.filter(x=>x.status==='not_started').length],['In corso',active.filter(x=>x.status==='in_progress').length],['Completati',finished],['Con test registrato',tests]])+
 '<p class="a40-note">L’avanzamento contenuti e i tempi attivi non equivalgono automaticamente a ore di frequenza certificate.</p></section></div>'+
 (data.truncated?'<p class="a40-error">Attenzione: indicatori calcolati su un massimo di 4.000 iscrizioni e 4.000 corsisti visibili. Per report completi occorre un’aggregazione server.</p>':'')+
 '<p class="a40-note">Aggiornamento all’apertura. Dati secondo le autorizzazioni dell’account. I risultati non attestano automaticamente la validità di un corso.</p></div>';
}
async function renderDashboard(args={}){
 const target=document.getElementById(args.targetId||'adminDashboardAnalytics');if(!target||!allowed())return;
 initStyle();const id=actor();target.innerHTML='<div class="a40-loading">Caricamento indicatori…</div>';
 try{const data=await dataset();if(!target.isConnected||actor()!==id)return;target.innerHTML=dashboardMarkup(data);}
 catch(e){if(target.isConnected)target.innerHTML='<p class="a40-error">Grafici non disponibili: '+esc(e.message||e)+'</p>';}
}
function registerNav(){
 const n=document.querySelector('#adminShell .admin-nav nav');if(!n)return;
 let b=document.getElementById('adminReportsV40Nav');
 if(!b){
  b=document.createElement('button');b.type='button';b.id='adminReportsV40Nav';b.innerHTML='<span>📊</span> Report formazione';
  const anchor=n.querySelector('[data-tab="activity"]');
  if(anchor)anchor.after(b);else n.appendChild(b);
  b.onclick=()=>void renderReports();
 }
 b.classList.toggle('hidden',!allowed());b.setAttribute('aria-hidden',String(!allowed()));
 window.SAFETY_ADMIN_MENU_V39?.reconcile?.();
}
function activeReports(){return document.getElementById('adminReportsV40Nav')?.classList.contains('active');}
function setHeader(){
 document.querySelectorAll('#adminShell .admin-nav nav button').forEach(b=>b.classList.remove('active'));
 document.getElementById('adminReportsV40Nav')?.classList.add('active');
 document.getElementById('adminTitle').textContent='Report formazione';
 document.getElementById('adminSubtitle').textContent='Statistiche, analisi corsisti e schede di svolgimento';
}
function filtered(data){
 const q=reportState.query.toLocaleLowerCase('it-IT').trim();
 return data.rows.filter(r=>(reportState.includeRevoked||r.status!=='revoked')&&(!reportState.course||r.courseId===reportState.course)&&
 (!reportState.learner||r.learner_id===reportState.learner)&&(!q||[r.courseTitle,r.learnerName,r.learner?.email,r.edition?.title].some(x=>String(x||'').toLocaleLowerCase('it-IT').includes(q))));
}
function reportFilters(data){
 const courses=[...data.courses.values()].sort((a,b)=>a.title.localeCompare(b.title,'it'));
 const learners=[...data.learners.values()].sort((a,b)=>[a.last_name,a.first_name].join(' ').localeCompare([b.last_name,b.first_name].join(' '),'it'));
 return '<section class="admin-card"><div class="a40-title"><h2>Filtra i report</h2><div class="a40-actions"><button id="a40Csv">Esporta CSV</button><button id="a40Print">Stampa report</button></div></div>'+
 '<div class="a40-filters"><label>Corso<select id="a40Course"><option value="">Tutti i corsi</option>'+
 courses.map(x=>'<option value="'+attr(x.id)+'"'+(reportState.course===x.id?' selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label>'+
 '<label>Corsista<select id="a40Learner"><option value="">Tutti i corsisti</option>'+
 learners.map(x=>'<option value="'+attr(x.id)+'"'+(reportState.learner===x.id?' selected':'')+'>'+esc([x.last_name,x.first_name].filter(Boolean).join(' ')||x.email||'Corsista')+'</option>').join('')+'</select></label>'+
 '<label>Ricerca<input id="a40Search" type="search" placeholder="Corsista, email, corso…" value="'+attr(reportState.query)+'"></label></div>'+
 '<label class="a40-note"><input id="a40Revoked" type="checkbox"'+(reportState.includeRevoked?' checked':'')+'> Includi iscrizioni revocate</label>'+
 '<p class="a40-note">Il CSV contiene dati personali: condividilo soltanto con persone autorizzate. I dati sono limitati al perimetro del tuo account.</p></section>';
}
function reportBody(data){
 const rows=reportState.filtered=filtered(data),complete=rows.filter(x=>done(x.status)).length;
 const tested=rows.filter(x=>x.final_score_pct!==null);
 const scores=tested.length?Math.round(tested.reduce((a,x)=>a+num(x.final_score_pct),0)/tested.length):0;
 const time=rows.reduce((a,x)=>a+num(x.active_seconds),0);
 const statHtml='<div class="a40-kpis">'+kpi(rows.length,'Iscrizioni filtrate')+kpi(complete,'Con stato completato/superato')+
 kpi(tested.length,'Con esito test')+kpi(scores+'%','Punteggio medio dei test presenti')+kpi(Math.floor(time/60),'Minuti attivi registrati')+'</div>';
 const byCourse=new Map();rows.forEach(r=>byCourse.set(r.courseTitle,(byCourse.get(r.courseTitle)||0)+1));
 const many='<div class="a40-grid"><section class="admin-card"><h2>Stati dei corsisti</h2>'+bars(statusEntries(rows))+'</section>'+
 '<section class="admin-card"><h2>Iscrizioni per corso</h2>'+bars([...byCourse].sort((a,b)=>b[1]-a[1]).slice(0,12))+'</section></div>';
 const table='<section class="admin-card"><div class="a40-title"><h2>Riepilogo corsisti</h2><span class="a40-note">'+fmt(rows.length)+' righe</span></div><div class="a40-table"><table><thead><tr>'+
 '<th>Corsista</th><th>Corso / edizione</th><th>Stato</th><th>Avanzamento</th><th>Attività registrata</th><th>Test</th><th>Dettagli</th></tr></thead><tbody>'+
 rows.slice(0,250).map(r=>'<tr><td>'+esc(r.learnerName)+'</td><td>'+esc(r.edition?.title||r.courseTitle)+'</td><td><span class="a40-badge '+(done(r.status)?'done':r.status==='revoked'?'revoked':'')+'">'+esc(status(r.status))+'</span></td><td>'+Math.round(pct(r.progress_pct))+'%</td><td>'+Math.floor(num(r.active_seconds)/60)+' min</td><td>'+ (r.final_score_pct===null?'—':fmt(r.final_score_pct)+'%')+'</td><td><button class="a40-btn" data-a40-detail="'+attr(r.id)+'">Scheda</button></td></tr>').join('')+
 '</tbody></table></div>'+(rows.length>250?'<p class="a40-note">Tabella limitata a 250 righe. CSV e riepiloghi usano tutto il campione recuperato.</p>':'')+'</section>';
 return statHtml+many+table+
 '<div id="a40StudentDetail"></div><p class="a40-note">Scheda di svolgimento interna, non attestato ufficiale. Frequenze effettive, verifiche, idoneità e requisiti normativi vanno validati dall’organizzatore.</p>'+
 (data.truncated?'<p class="a40-error">Risultati parziali: superato limite di righe. Richiedere esportazione aggregata server per dati completi.</p>':'');
}
function csvCell(value){let s=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCsv(rows){
 const heads=['Corsista','Email','Edizione','Corso','Stato','Avanzamento %','Tempo attivo min','Punteggio test %','Iscritto','Completato'];
 const data=rows.map(r=>[r.learnerName,r.learner?.email||'',r.edition?.title||'',r.courseTitle,status(r.status),Math.round(pct(r.progress_pct)),Math.floor(num(r.active_seconds)/60),r.final_score_pct??'',date(r.enrolled_at),date(r.completed_at)]);
 const blob=new Blob(['\ufeff'+[heads,...data].map(row=>row.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='safetytraining-report-'+new Date().toISOString().slice(0,10)+'.csv';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function printSheet(title,html){
 const win=window.open('','_blank');if(!win){alert('Abilita le finestre di stampa nel browser.');return;}
 const stylesheet='<style>body{font:14px Arial,sans-serif;color:#1b2937;margin:30px}h1{font-size:23px}h2{font-size:17px;border-bottom:1px solid #ccc;padding-bottom:8px}table{border-collapse:collapse;width:100%;font-size:11px}td,th{padding:7px;border:1px solid #cbd1da;text-align:left}small,.note{color:#566370}button{display:none}@page{size:A4;margin:17mm}</style>';
 win.document.open();win.document.write('<!doctype html><html lang="it"><head><meta charset="utf-8"><title>'+esc(title)+'</title>'+stylesheet+'</head><body><h1>'+esc(title)+'</h1><p>SafetyTraining · Elaborato il '+esc(new Date().toLocaleString('it-IT'))+'</p>'+html+
 '<p class="note">DOCUMENTO INTERNO DI ANALISI. Non costituisce attestato ufficiale né certificazione di frequenza, apprendimento o idoneità.</p></body></html>');win.document.close();win.focus();win.print();
}
function printOverview(rows){
 const cols=['Corsista','Corso','Stato','Avanzamento','Tempo attivo','Punteggio test'];
 const records=rows.map(r=>[r.learnerName,r.edition?.title||r.courseTitle,status(r.status),Math.round(pct(r.progress_pct))+'%',Math.floor(num(r.active_seconds)/60)+' min',r.final_score_pct===null?'—':fmt(r.final_score_pct)+'%']);
 const html='<p>Totale iscrizioni nel filtro: <b>'+fmt(rows.length)+'</b></p><table><thead><tr>'+cols.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+records.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 printSheet('Riepilogo percorsi e corsisti',html);
}
async function studentDetail(enrollmentId,seq,who){
 const r=reportState.filtered.find(x=>x.id===enrollmentId),target=document.getElementById('a40StudentDetail');if(!r||!target)return;
 target.innerHTML='<section class="admin-card"><p>Caricamento scheda corsista…</p></section>';
 try{
  const [sessions,tests,progress]=await Promise.all([
   db().from('learning_sessions').select('id,started_at,ended_at,active_seconds').eq('enrollment_id',r.id).order('started_at',{ascending:false}).limit(250),
   db().from('test_attempts').select('id,attempt_no,completed_at,score_pct,passed').eq('enrollment_id',r.id).order('started_at',{ascending:false}).limit(250),
   db().from('learning_progress').select('unit_version_id,status,active_seconds,completed_at').eq('enrollment_id',r.id).limit(400)
  ]);
  if(!activeReports()||seq!==currentReportSeq||who!==actor()||!target.isConnected)return;
  for(const x of [sessions,tests,progress])if(x.error)throw x.error;
  const sn=sessions.data||[],ts=tests.data||[],pr=progress.data||[];
  const best=ts.filter(t=>t.score_pct!==null).reduce((m,t)=>Math.max(m,num(t.score_pct)),0);
  const completedUnits=pr.filter(x=>x.status==='completed').length;
  const items=[['Corsista',r.learnerName],['Email',r.learner?.email||'—'],['Corso',r.courseTitle],
   ['Edizione',r.edition?.title||'—'],['Stato',status(r.status)],['Avanzamento contenuti',Math.round(pct(r.progress_pct))+'%'],
   ['Tempo attivo registrato',Math.floor(num(r.active_seconds)/60)+' minuti'],['Iscrizione',date(r.enrolled_at)],
   ['Ultima attività',date(r.last_activity_at)],['Completamento registrato',date(r.completed_at)],
   ['Sessioni registrate (max 250)',sn.length],['Unità completate nel registro (max 400)',completedUnits+'/'+pr.length],
   ['Tentativi di test visibili (max 250)',ts.length],['Miglior risultato test visibile',ts.length?best+'%':'—']];
  const dl=items.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('');
  const sheet='<h2>'+esc(r.learnerName)+'</h2><table>'+items.map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(v)+'</td></tr>').join('')+'</table>'+
   '<p>Dettaglio dei tentativi test: '+esc(ts.map(x=>(x.score_pct===null?'non valutato':x.score_pct+'%')+(x.passed?' superato':'')).join('; ')||'nessuno')+'</p>';
  target.innerHTML='<section class="admin-card"><div class="a40-title"><h2>Scheda di svolgimento interna</h2><div class="a40-actions"><button id="a40PrintStudent">Stampa scheda</button><button id="a40CloseStudent">Chiudi</button></div></div>'+
   '<div class="a40-student"><dl>'+dl+'</dl></div><p class="a40-note">I minuti sono tempo di attività tracciato, non ore di frequenza certificate. Verificare fonti e completezza delle evidenze prima di qualsiasi attestazione ufficiale.</p></section>';
  target.querySelector('#a40PrintStudent').onclick=()=>printSheet('Scheda interna di svolgimento corso',sheet);
  target.querySelector('#a40CloseStudent').onclick=()=>{target.innerHTML='';};
  target.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){if(target.isConnected)target.innerHTML='<section class="admin-card"><p class="a40-error">Impossibile ottenere le evidenze: '+esc(e.message||e)+'</p></section>';}
}
async function renderReports(){
 if(!allowed())return;registerNav();initStyle();
 const h=document.getElementById('adminContent'),who=actor(),seq=++currentReportSeq;
 if(!h)return;setHeader();
 h.innerHTML='<div class="a40-loading">Preparazione report…</div>';
 try{
  const data=await dataset();if(seq!==currentReportSeq||actor()!==who||!activeReports())return;
  reportState.all=data;
  h.innerHTML='<div class="a40-root">'+reportFilters(data)+'<div id="a40Result"></div></div>';
  const result=document.getElementById('a40Result');
  const draw=()=>{result.innerHTML=reportBody(data);result.querySelectorAll('[data-a40-detail]').forEach(b=>b.onclick=()=>void studentDetail(b.dataset.a40Detail,seq,who));};
  const bind=(id,action,event='change')=>h.querySelector(id)?.addEventListener(event,action);
  bind('#a40Course',e=>{reportState.course=e.target.value;draw();});
  bind('#a40Learner',e=>{reportState.learner=e.target.value;draw();});
  bind('#a40Search',e=>{reportState.query=e.target.value;draw();},'input');
  bind('#a40Revoked',e=>{reportState.includeRevoked=e.target.checked;draw();});
  bind('#a40Csv',()=>exportCsv(reportState.filtered),'click');
  bind('#a40Print',()=>printOverview(reportState.filtered),'click');
  draw();
 }catch(e){if(seq===currentReportSeq&&h.isConnected)h.innerHTML='<section class="admin-card"><p class="a40-error">Report non disponibile: '+esc(e.message||e)+'</p><button id="a40Retry">Riprova</button></section>';h.querySelector('#a40Retry')?.addEventListener('click',()=>void renderReports());}
}
function boot(){
 registerNav();
 document.addEventListener('safety:admin-capabilities',registerNav);
 document.addEventListener('safety:auth-changed',()=>{currentReportSeq++;reportState.all=null;registerNav();});
 document.getElementById('adminConsoleBtn')?.addEventListener('click',registerNav);
 const n=document.querySelector('#adminShell .admin-nav nav');if(n)new MutationObserver(registerNav).observe(n,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SAFETY_ADMIN_ANALYTICS_V40={renderDashboard,renderReports,dashboardMarkup,csvCell};
})();