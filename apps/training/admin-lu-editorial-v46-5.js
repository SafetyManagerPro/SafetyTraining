/* SafetyTraining v46.5 — auditable LU editorial matrix.
 * Only existing owner allowlist can save reviews; public course content is never modified.
 * Automated flags are triage hints, not approval of technology, law or image rights. */
(()=>{'use strict';
const root=()=>document.getElementById('adminShell');
const host=()=>document.getElementById('adminContent');
const db=()=>window.SAFETY_CLOUD?.state?.client;
const actor=()=>window.SAFETY_CLOUD?.state?.user?.id||'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const states=['pending','approved','changes_requested','not_applicable'];
const labels={pending:'Da verificare',approved:'Verificato',changes_requested:'Da correggere',not_applicable:'Non applicabile'};
const sections=[['text','Testo'],['visual','Immagini'],['source','Fonti'],['analysis','Analisi'],['rights','Diritti']];
const valid=key=>/^[a-zA-Z0-9_:-]{1,120}$/.test(key);
const state={course:'',courses:[],units:[],canReview:false,search:'',filter:'all',page:0,pageSize:20,request:0,actor:'',expanded:'',history:null,busy:false};
function ensureNav(){
 const nav=root()?.querySelector('.admin-nav nav');
 if(!nav||nav.querySelector('[data-editorial-matrix-v46-5]'))return;
 const button=document.createElement('button');button.type='button';button.dataset.editorialMatrixV465='1';
 button.innerHTML='<span>▤</span> Revisione Learning Unit';
 const anchor=nav.querySelector('[data-quality-v22]')||nav.querySelector('[data-readiness-admin]');
 if(anchor)anchor.after(button);else nav.appendChild(button);
 button.addEventListener('click',()=>{root()?.classList.remove('admin-mobile-nav-open');void render();});
 window.SAFETY_ADMIN_MENU_V39?.reconcile?.();
}
const editable=u=>!!(state.canReview&&u&&u.course_active===true&&!u.frozen&&u.unit_status==='published');
const score=u=>{
 const warnings=[];
 if(Number(u.summary_chars||0)<60||Number(u.detail_chars||0)<140)warnings.push('Testo: verificare chiarezza e completezza');
 if(Number(u.risk_count||0)<1||Number(u.prevention_count||0)<1||!u.has_case||!u.has_question)warnings.push('Analisi: verificare rischi, misure, caso e domanda');
 if(Number(u.explicit_visual_count||0)<1)warnings.push('Immagini: nessuna illustrazione esplicita censita nella LU');
 if(Number(u.source_reference_count||0)<1)warnings.push('Fonti: nessun riferimento esplicito censito');
 return warnings;
};
const reviewFor=u=>u.review||{};
const decision=u=>reviewFor(u).decision||'pending';
const badge=(status)=>'<span class="st-v465-badge '+esc(status||'pending')+'">'+esc(labels[status]||'Da verificare')+'</span>';
function csvCell(value){
 const raw=String(value??'');
 const safe=/^[\s\uFEFF]*[=+@-]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
function csv(rows){
 const headers=['Corso','Versione corso','Modulo','Learning Unit','Versione LU','Stato LU','Frozen','Testo','Immagini','Fonti','Analisi','Diritti','Esito','Avvisi','Note revisore','Revisione'];
 const lines=[headers,...rows.map(u=>[u.course_title,u.course_version,u.module_title,u.unit_title,u.unit_version,u.unit_status,u.frozen?'Sì':'No',
  ...sections.map(([k])=>reviewFor(u)[k+'_status']||'pending'),decision(u),score(u).join(' | '),reviewFor(u).reviewer_note||'',reviewFor(u).revision||0])];
 return '\uFEFF'+lines.map(row=>row.map(csvCell).join(';')).join('\r\n');
}
function exportCsv(){
 if(!state.units.length)return;
 const blob=new Blob([csv(filtered())],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='safetytraining-revisione-LU-'+state.course+'.csv';
 document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function filtered(){
 const q=state.search.trim().toLocaleLowerCase('it');
 return state.units.filter(u=>{
  if(q&&!([u.unit_title,u.module_title,u.unit_key,u.summary_preview].join(' ').toLocaleLowerCase('it').includes(q)))return false;
  const d=decision(u);
  if(state.filter==='todo')return d!=='approved';
  if(state.filter==='approved')return d==='approved';
  if(state.filter==='changes_requested')return d==='changes_requested';
  if(state.filter==='blocked')return !editable(u);
  if(state.filter==='warning')return score(u).length>0;
  return true;
 });
}
function options(values,current){
 return values.map(v=>'<option value="'+esc(v)+'"'+(current===v?' selected':'')+'>'+esc(labels[v]||v)+'</option>').join('');
}
function editor(u){
 const r=reviewFor(u);
 return '<form class="st-v465-form" data-review-unit="'+esc(u.module_unit_id)+'">'+
 '<h3>Revisione editoriale: '+esc(u.unit_title)+'</h3>'+
 '<p class="st-v465-note">Una revisione è distinta dalla pubblicazione: le Learning Unit e le ore ufficiali restano immutate. La verifica della pertinenza delle immagini e dei diritti è umana e documentata.</p>'+
 '<div class="st-v465-formgrid">'+sections.map(([key,label])=>{
  let choices=(key==='visual'||key==='rights')?states:states.slice(0,3);
  return '<label>'+esc(label)+'<select name="'+key+'_status" required>'+options(choices,r[key+'_status']||'pending')+'</select></label>';
 }).join('')+
 '<label>Decisione finale<select name="decision" required>'+options(states.slice(0,3),r.decision||'pending')+'</select></label></div>'+
 '<label>Motivazione tecnico-didattica e riferimenti esaminati<textarea name="reviewer_note" maxlength="2000" rows="4" placeholder="Descrivi pertinenza al tema, attendibilità, eventuali correzioni e fonti consultate">'+esc(r.reviewer_note||'')+'</textarea></label>'+
 '<label>Prova dei diritti delle immagini (licenza, autore, autorizzazione e ambito)<textarea name="rights_evidence" maxlength="2000" rows="3" placeholder="Necessaria se i diritti sono marcati verificati">'+esc(r.rights_evidence||'')+'</textarea></label>'+
 '<div class="st-v465-actions"><label class="st-v465-checkbox"><input type="checkbox" name="confirm" required> Confermo di aver effettuato personalmente la revisione e di non voler pubblicare automaticamente il corso.</label>'+
 '<button type="submit" class="admin-primary">Registra revisione</button><button type="button" data-review-history="'+esc(u.module_unit_id)+'">Storico decisioni</button></div>'+
 '<div class="st-v465-history" data-review-history-content aria-live="polite"></div>'+
 '<p class="st-v465-note">Revisione corrente: '+esc(r.revision||0)+(r.updated_at?' · '+esc(new Date(r.updated_at).toLocaleString('it-IT')):'')+'</p>'+
 '<p data-review-result role="status" aria-live="polite"></p></form>';
}
function metrics(){
 const total=state.units.length,approved=state.units.filter(x=>decision(x)==='approved').length;
 const changes=state.units.filter(x=>decision(x)==='changes_requested').length;
 const frozen=state.units.filter(x=>!editable(x)).length;
 const warnings=state.units.filter(x=>score(x).length>0).length;
 const metric=(n,label)=>'<div class="st-v465-metric"><strong>'+n+'</strong><span>'+label+'</span></div>';
 return '<div class="st-v465-metrics">'+metric(total,'Unità pubblicate/composizioni')+metric(approved,'Revisioni approvate')+metric(changes,'Da correggere')+metric(frozen,'Non modificabili')+metric(warnings,'Con avvisi preliminari')+'</div>';
}
function rows(){
 const arr=filtered(),max=Math.max(1,Math.ceil(arr.length/state.pageSize));
 if(state.page>=max)state.page=max-1;
 const view=arr.slice(state.page*state.pageSize,(state.page+1)*state.pageSize);
 const cell=(label,key,u)=>'<td data-label="'+esc(label)+'">'+badge(reviewFor(u)[key+'_status']||'pending')+'</td>';
 return '<div class="st-v465-tablewrap"><table class="st-v465-table"><thead><tr><th>Unità / Modulo</th><th>Testo</th><th>Immagini</th><th>Fonti</th><th>Analisi</th><th>Diritti</th><th>Esito</th><th>Dettagli</th></tr></thead><tbody>'+
 (view.length?view.map(u=>{
  const frozen=!editable(u),flags=score(u);
  const candidate=window.SAFETY_EQUIPMENT_CASES_V46_3?.forSlide?.({type:'concept',title:u.unit_title,topic:{id:u.unit_key,title:u.unit_title}},state.course);
  const suggested=candidate&&/^assets\\/gp0[1-4]-[a-z0-9-]+\\.svg$/.test(candidate.visual)
   ?'<figure class="st-v465-editor-figure"><img loading="lazy" src="'+esc(candidate.visual)+'" alt="'+esc(candidate.imageCaption||'Schema originale proposto')+'"><figcaption>Figura tematica proposta, non approvata: '+esc(candidate.imageCaption||'Verificare pertinenza e diritti')+'</figcaption></figure>'
   :'';
  const row='<tr><td data-label="Unità / Modulo"><strong>'+esc(u.unit_title)+'</strong><small>'+esc(u.module_title)+' · LU v'+esc(u.unit_version)+' · '+esc(u.unit_status)+'</small>'+
   (frozen?'<span class="st-v465-locked">Sola lettura / non idonea alla revisione</span>':'')+'</td>'+
   sections.map(([key,label])=>cell(label,key,u)).join('')+
   '<td data-label="Esito">'+badge(decision(u))+'</td>'+
   '<td data-label="Dettagli"><button type="button" data-toggle-editor="'+esc(u.module_unit_id)+'">'+(state.expanded===u.module_unit_id?'Chiudi':'Esamina')+'</button></td></tr>';
  const details=state.expanded!==u.module_unit_id?'':'<tr class="st-v465-details"><td colspan="8"><div class="st-v465-detail-grid"><section><h3>Inventario preliminare</h3><p>'+esc(u.summary_preview||'Nessuna sintesi')+'</p><dl>'+
   '<dt>Testo</dt><dd>'+esc(u.summary_chars||0)+' caratteri sintesi · '+esc(u.detail_chars||0)+' dettagli</dd>'+
   '<dt>Rischi e misure</dt><dd>'+esc(u.risk_count||0)+' rischi · '+esc(u.prevention_count||0)+' misure</dd>'+
   '<dt>Scenari</dt><dd>Caso: '+(u.has_case?'presente':'non rilevato')+' · Domanda: '+(u.has_question?'presente':'non rilevata')+'</dd>'+
   '<dt>Figure</dt><dd>'+esc(u.explicit_visual_count||0)+' riferimenti espliciti; categoria: '+esc(u.visual_hint||'nessuna')+'</dd>'+
   '<dt>Fonti</dt><dd>'+esc(u.source_reference_count||0)+' riferimenti espliciti (non validati)</dd></dl>'+
   suggested+'<h4>Avvisi da controllare</h4>'+(flags.length?'<ul>'+flags.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Nessuna carenza rilevata automaticamente. È comunque necessaria la valutazione umana.</p>')+'</section>'+
   '<section>'+(frozen?'<div class="st-v465-note"><h3>Revisione non consentita</h3><p>Stato corso/unità o autorizzazione impediscono le modifiche. I dati restano consultabili e non possono essere approvati da questa schermata.</p></div>':editor(u))+'</section></div></td></tr>';
  return row+details;
 }).join(''):'<tr><td colspan="8">Nessuna Learning Unit con i filtri selezionati.</td></tr>')+
 '</tbody></table></div><div class="st-v465-pagination"><button type="button" data-page="-1" '+(state.page===0?'disabled':'')+'>← Precedente</button>'+
 '<span>'+arr.length+' risultati · pagina '+(state.page+1)+' / '+max+'</span>'+
 '<button type="button" data-page="1" '+(state.page>=max-1?'disabled':'')+'>Successiva →</button></div>';
}
function paint(){
 if(!host())return;
 const course=state.courses.find(x=>x.stable_key===state.course);
 const select=state.courses.map(c=>'<option value="'+esc(c.stable_key)+'"'+(c.stable_key===state.course?' selected':'')+'>'+
  esc(c.title)+' · v'+esc(c.version_number)+(c.frozen?' · FROZEN':'')+'</option>').join('');
 host().innerHTML='<section class="admin-card st-v465-head"><div><small>SAFETYTRAINING · EDITORIAL QA v46.5</small><h2>Matrice di revisione Learning Unit</h2>'+
  '<p>Controllo puntuale di testi, rischi, immagini, fonti, analisi e diritti. I segnali automatici indicano soltanto cosa verificare: non certificano contenuti o immagini.</p></div>'+
  '<p class="st-v465-note">Le approvazioni vengono registrate con revisore, motivazione e storico. <strong>Non pubblicano nuovi corsi, non cambiano quiz o attestati.</strong></p></section>'+
  '<section class="admin-card st-v465-toolbar"><label>Corso pubblicato<select id="stV465Course">'+select+'</select></label>'+
  '<label>Ricerca in tutte le unità del corso<input id="stV465Search" type="search" placeholder="Argomento, modulo, codice" value="'+esc(state.search)+'"></label>'+
  '<label>Stato<select id="stV465Filter">'+[
   ['all','Tutti'],['todo','Da completare'],['approved','Revisionati'],['changes_requested','Da correggere'],['blocked','Sola lettura'],['warning','Con avvisi']
  ].map(([v,label])=>'<option value="'+v+'"'+(v===state.filter?' selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
  '<div class="st-v465-tools"><button type="button" data-v465-refresh>Aggiorna</button><button type="button" data-v465-export>Esporta CSV filtrato</button></div>'+
  '</section><section class="admin-card"><p class="st-v465-scope">'+(course?esc(course.title)+' · versione '+esc(course.version_number)+(course.frozen?' · frozen':''):'Seleziona un corso')+
  ' · <strong>'+(state.canReview?'Modifica consentita al responsabile editoriale':'Sola consultazione')+'</strong></p>'+metrics()+
  '<p class="st-v465-note">La presenza di immagini/fonti nei metadati non ne dimostra la pertinenza o la liceità d’uso; la revisione rimane individuale e non è possibile approvare in massa.</p>'+
  rows()+'</section>';
 const h=host();
 h.querySelector('#stV465Course').addEventListener('change',e=>{state.course=e.target.value;state.page=0;state.search='';state.expanded='';void loadCourse();});
 h.querySelector('#stV465Search').addEventListener('input',e=>{state.search=e.target.value;state.page=0;paint();h.querySelector('#stV465Search')?.focus();});
 h.querySelector('#stV465Filter').addEventListener('change',e=>{state.filter=e.target.value;state.page=0;paint();});
 h.querySelector('[data-v465-refresh]').addEventListener('click',()=>void loadCourse());
 h.querySelector('[data-v465-export]').addEventListener('click',exportCsv);
 h.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{state.page+=Number(b.dataset.page);paint();}));
 h.querySelectorAll('[data-toggle-editor]').forEach(b=>b.addEventListener('click',()=>{state.expanded=state.expanded===b.dataset.toggleEditor?'':b.dataset.toggleEditor;paint();}));
 h.addEventListener('submit',event=>{if(event.target.closest('[data-review-unit]'))void save(event);});
 h.querySelectorAll('[data-review-history]').forEach(b=>b.addEventListener('click',()=>void history(b.dataset.reviewHistory)));
}
async function history(id){
 const area=host()?.querySelector('[data-review-unit="'+id+'"] [data-review-history-content]');
 if(!area||!db())return;
 area.textContent='Lettura dello storico…';
 const {data,error}=await db().from('training_lu_editorial_events_v46_5')
  .select('revision,actor_id,occurred_at,snapshot')
  .eq('module_unit_id',id).order('revision',{ascending:false}).limit(12);
 if(!area.isConnected||state.expanded!==id)return;
 if(error){area.textContent='Storico non disponibile: '+error.message;return;}
 area.innerHTML='<h4>Ultime decisioni (max 12)</h4>'+(data?.length?'<ol>'+data.map(row=>'<li>'+
  esc(new Date(row.occurred_at).toLocaleString('it-IT'))+' · revisione '+esc(row.revision)+
  ' · '+esc(row.snapshot?.decision||'pending')+' · '+esc(row.snapshot?.reviewer_note||'')+'</li>').join('')+'</ol>':'<p>Nessuna revisione precedente.</p>');
}
async function save(event){
 event.preventDefault();
 const form=event.target.closest('[data-review-unit]');
 if(!form||state.busy||!db())return;
 const id=form.dataset.reviewUnit,u=state.units.find(x=>x.module_unit_id===id);
 if(!editable(u)){form.querySelector('[data-review-result]').textContent='Questa unità non è modificabile.';return;}
 const fd=new FormData(form),data={p_module_unit_id:id,p_expected_revision:Number(u.review?.revision||0)};
 for(const [key] of sections)data['p_'+key+'_status']=String(fd.get(key+'_status')||'pending');
 data.p_decision=String(fd.get('decision')||'pending');
 data.p_reviewer_note=String(fd.get('reviewer_note')||'').trim();
 data.p_rights_evidence=String(fd.get('rights_evidence')||'').trim();
 data.p_confirm_review=fd.get('confirm')==='on';
 const result=form.querySelector('[data-review-result]');
 if(!data.p_confirm_review){result.textContent='Confermare la revisione prima del salvataggio.';return;}
 if(data.p_decision==='approved'&&data.p_reviewer_note.length<40){result.textContent='Per approvare serve una motivazione tecnica di almeno 40 caratteri.';return;}
 if(!window.confirm('Confermi la registrazione della revisione editoriale di questa Learning Unit? Non viene pubblicato alcun contenuto ufficiale.'))return;
 state.busy=true;
 const buttons=[...form.querySelectorAll('button')];buttons.forEach(x=>x.disabled=true);
 const identity=actor(),request=state.request,course=state.course;
 try{
  const response=await db().rpc('training_save_lu_editorial_review_v46_5',data);
  if(response.error)throw response.error;
  if(identity!==actor()||request!==state.request||course!==state.course)return;
  await loadCourse();
  const note=host()?.querySelector('.st-v465-scope');
  if(note)note.insertAdjacentHTML('beforeend',' <span class="st-v465-saved" role="status">Revisione registrata · rev. '+esc(response.data?.revision||'')+'</span>');
 }catch(e){if(form.isConnected){result.textContent='Salvataggio non eseguito: '+String(e?.message||e);buttons.forEach(x=>x.disabled=false);}}
 finally{state.busy=false;}
}
async function loadCourse(){
 if(!db()||!actor()||!valid(state.course))return;
 const request=++state.request,identity=state.actor=actor(),course=state.course;
 host().innerHTML='<p class="admin-loading">Caricamento della matrice della versione pubblicata…</p>';
 const {data,error}=await db().rpc('training_lu_editorial_matrix_v46_5',{p_course_key:course});
 if(request!==state.request||actor()!==identity||state.course!==course)return;
 if(error){host().innerHTML='<p class="admin-error">'+esc(error.message)+'</p>';return;}
 state.courses=Array.isArray(data?.courses)?data.courses:[];
 state.units=Array.isArray(data?.units)?data.units:[];
 state.canReview=data?.can_review===true;
 state.expanded='';paint();
}
async function render(){
 ensureNav();
 if(!db()||!actor()||!host()||root()?.classList.contains('hidden'))return;
 root().querySelectorAll('.admin-nav nav button').forEach(b=>b.classList.remove('active'));
 root().querySelector('[data-editorial-matrix-v46-5]')?.classList.add('active');
 document.getElementById('adminTitle').textContent='Revisione Learning Unit';
 const subtitle=document.getElementById('adminSubtitle');if(subtitle)subtitle.textContent='Matrice editoriale v46.5 · verifica umana per singola Learning Unit';
 window.SAFETY_ADMIN_HELP_V22?.sync?.();
 host().innerHTML='<p class="admin-loading">Caricamento dei corsi pubblicati…</p>';
 const request=++state.request,identity=state.actor=actor();
 const {data,error}=await db().rpc('training_lu_editorial_matrix_v46_5',{p_course_key:null});
 if(request!==state.request||identity!==actor())return;
 if(error){host().innerHTML='<p class="admin-error">'+esc(error.message)+'</p>';return;}
 state.courses=Array.isArray(data?.courses)?data.courses:[];
 state.canReview=data?.can_review===true;
 if(!state.courses.length){host().innerHTML='<p class="admin-note">Nessun corso pubblicato disponibile per la revisione.</p>';return;}
 if(!state.courses.some(c=>c.stable_key===state.course))state.course=state.courses.find(c=>c.stable_key==='attr_carrelli_ind')?.stable_key||state.courses[0].stable_key;
 await loadCourse();
}
function reset(){state.request++;state.units=[];state.courses=[];state.canReview=false;state.expanded='';state.actor='';if(root()&&!root().classList.contains('hidden')&&root().querySelector('[data-editorial-matrix-v46-5].active'))host().textContent='Sessione cambiata: riaprire Revisione Learning Unit.';}
async function boot(){
 for(let i=0;i<40&&!root();i++)await new Promise(resolve=>setTimeout(resolve,150));
 ensureNav();
 document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,70));
 document.getElementById('adminRefresh')?.addEventListener('click',()=>setTimeout(ensureNav,70));
 document.addEventListener('safety:admin-capabilities',ensureNav);
 document.addEventListener('safety:auth-changed',reset);
}
window.SAFETY_LU_EDITORIAL_V46_5={ensureNav,render,score,editable,csv,filtered,version:'v46.5'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else void boot();
})();