/* SafetyTraining v44 — documenti corso per singola iscrizione (RLS + Storage privato). */
(() => {
'use strict';
if (window.SAFETY_COURSE_DOCUMENTS) return;
const BUCKET='learner-course-documents';
const KINDS={
  attestato:'Attestato di formazione',
  nomina_preposto:'Individuazione / nomina preposto',
  designazione_primo_soccorso:'Designazione addetto primo soccorso',
  designazione_antincendio:'Designazione addetto antincendio / evacuazione',
  autorizzazione_attrezzatura:'Autorizzazione all’uso dell’attrezzatura',
  incarico_quota_dpi:'Incarico lavori in quota / DPI III categoria',
  incarico_generico:'Lettera d’incarico / designazione',
  verbale_consegna_dpi:'Verbale di consegna DPI',
  istruzioni_sicurezza:'Istruzioni / procedure di sicurezza',
  altro_documento:'Altro documento collegato'
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.SAFETY_CLOUD?.state?.client;
const cloud=()=>window.SAFETY_CLOUD?.state;
const platformAdmin=()=>!!cloud()?.user?.id && !!window.SAFETY_ADMIN_CAPABILITIES_STATE?.platform_admin;
const done=v=>['passed','completed'].includes(v);
const courseName=a=>a?.courseTitle||a?.editionTitle||'Corso di formazione';
const state={selected:'',assignments:[],busy:false,menu:null};
const showError=(target,e)=>{if(target)target.textContent=e?.message||String(e)};
function suggest(stableKey=''){
 const key=String(stableKey).toLowerCase();
 if (/^(?:agg_)?prep(?:osto)?$/.test(key)||key.includes('prepost'))return ['nomina_preposto'];
 if(key.includes('primo_soccorso'))return ['designazione_primo_soccorso'];
 if(key.includes('antincendio'))return ['designazione_antincendio'];
 if(key.startsWith('attr_')||key.startsWith('agg_attr_'))return ['autorizzazione_attrezzatura'];
 if(key.includes('quota')||key.includes('dpi_iii'))return ['incarico_quota_dpi','verbale_consegna_dpi'];
 if(key.includes('dpi'))return ['verbale_consegna_dpi'];
 return [];
}
const css=`
.lcd-line{margin-top:13px;padding:12px;border:1px solid #47617a;border-radius:12px;background:#12263c}
.lcd-line h3{font-size:14px;margin:0 0 8px}
.lcd-note{font-size:12px;color:#b4c9d9;line-height:1.45}
.lcd-list{display:grid;gap:8px;margin:9px 0}
.lcd-row{padding:10px;background:#1c3548;border:1px solid #496177;border-radius:10px;display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap}
.lcd-row small{color:#b6cbdc;display:block}
.lcd-btn{border:1px solid #75b7cb;background:#214761;color:#fff;padding:8px 11px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer}
.lcd-btn:disabled{opacity:.4;cursor:not-allowed}
.lcd-admin{display:grid;gap:12px}
.lcd-admin select,.lcd-admin input,.lcd-admin textarea{background:#0c2133;color:#fff;border:1px solid #58738c;border-radius:8px;padding:10px;width:100%;min-width:0}
.lcd-admin label{display:grid;gap:5px;font-size:12px}
.lcd-admin button{max-width:100%}
.lcd-fieldgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
.lcd-checkbox{display:flex!important;flex-direction:row;align-items:start;gap:8px}
.lcd-checkbox input{width:auto!important}
`;
function style(){if(document.getElementById('lcdStyle'))return;const s=document.createElement('style');s.id='lcdStyle';s.textContent=css;document.head.appendChild(s);}
async function documents(enrollmentId){
 const {data,error}=await db().from('learner_course_documents')
  .select('id,enrollment_id,learner_id,kind,title,document_status,is_required,storage_path,original_filename,notes,verified_signature,approved_by,issued_at,published_at,created_at')
  .eq('enrollment_id',enrollmentId).order('created_at',{ascending:false});
 if(error)throw error;return data||[];
}
async function openDocument(row){
 if(!row?.storage_path)throw Error('Nessun PDF allegato.');
 // Apre subito una scheda in risposta al click (anche Safari/iOS blocca i popup asincroni).
 const viewer=window.open('','_blank');
 if(!viewer)throw Error('Consenti i popup per aprire e stampare il PDF.');
 viewer.opener=null;
 try{
   viewer.document.title='Caricamento documento';
   viewer.document.body.textContent='Apertura PDF riservato…';
   const {data,error}=await db().storage.from(BUCKET).createSignedUrl(row.storage_path,90);
   if(error)throw error;
   if(!data?.signedUrl)throw Error('PDF non disponibile.');
   viewer.location.replace(data.signedUrl);
 }catch(e){viewer.close();throw e;}
}
function template(kind,assignment){
 const name=[cloud()?.learner?.last_name,cloud()?.learner?.first_name].filter(Boolean).join(' ')||'______________________';
 const course=courseName(assignment);
 const title=KINDS[kind]||'Documento collegato';
 const sections={
 nomina_preposto:['D.Lgs. 81/2008, artt. 18, comma 1, lett. b-bis, e 19','Il datore di lavoro individua il preposto, definendone il reparto, le attività presidiate, i compiti e i poteri connessi alla vigilanza.'],
 designazione_primo_soccorso:['D.Lgs. 81/2008, artt. 18, 43 e 45','Il datore di lavoro designa l’addetto per le misure di primo soccorso e ne specifica organizzazione, presidî e procedure.'],
 designazione_antincendio:['D.Lgs. 81/2008, artt. 18, 43 e 46','Il datore di lavoro designa l’addetto alla prevenzione incendi, gestione emergenze e evacuazione secondo organizzazione aziendale.'],
 autorizzazione_attrezzatura:['D.Lgs. 81/2008, artt. 71 e 73','Autorizzazione per attrezzatura specificamente identificata, subordinata a formazione/abilitazione valida, addestramento e altre verifiche dovute.'],
 incarico_quota_dpi:['D.Lgs. 81/2008, artt. 77 e 115','Incarico per attività in quota, con attrezzature, DPI e procedure definiti dalla valutazione dei rischi e dall’addestramento.'],
 verbale_consegna_dpi:['D.Lgs. 81/2008, artt. 18, 20 e 74-79','Il datore di lavoro consegna i dispositivi specificati, registra modello/taglia, informazioni, istruzioni e addestramento ove richiesto.']
 };
 const [refs,body]=sections[kind]||['D.Lgs. 81/2008','Definire l’incarico o la documentazione specifica secondo la valutazione dei rischi aziendali.'];
 const details=kind==='verbale_consegna_dpi'?
 '<p><b>DPI consegnati (tipo / marca / modello / taglia / quantità):</b><br>__________________________________________________________________<br>__________________________________________________________________</p><p><b>Istruzioni consegnate / addestramento verificato:</b> _________________________</p>':
 '<p><b>Ruolo, reparto, attività o attrezzatura specifica:</b> ________________________________</p><p><b>Compiti, responsabilità e limiti dell’incarico:</b><br>__________________________________________________________________<br>__________________________________________________________________</p>';
 return '<!doctype html><html lang="it"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>@page{size:A4;margin:18mm}body{font:13px/1.65 Arial;color:#172132;max-width:800px;margin:auto}h1{font-size:20px}h2{font-size:14px}header{border-bottom:2px solid #243a54;padding-bottom:12px}.warning{border:2px solid #9c2f37;padding:12px;color:#8c1725;font-weight:700;margin:18px 0}.sign{display:flex;justify-content:space-between;margin-top:58px;gap:35px}.sign span{width:48%;border-top:1px solid #666;padding-top:8px}button{padding:9px 18px;background:#243a54;color:white;border:0;border-radius:6px}@media print{button{display:none}}</style></head><body><header><small>FACSIMILE PERSONALIZZABILE · DOCUMENTO NON SOTTOSCRITTO</small><h1>'+esc(title.toUpperCase())+'</h1><div>'+esc(refs)+'</div></header><div class="warning">MODELLO DA COMPILARE: NON È UNA NOMINA, AUTORIZZAZIONE O CONSEGNA DPI EFFICACE. Richiede verifica organizzativa, compilazione, data e sottoscrizione delle parti previste.</div><p><b>Azienda / datore di lavoro:</b> __________________________________________</p><p><b>Sede:</b> ________________________ <b>Data e luogo:</b> __________________</p><p><b>Lavoratore:</b> '+esc(name)+'</p><p><b>Corso di riferimento:</b> '+esc(course)+'</p><h2>Oggetto</h2><p>'+esc(body)+'</p>'+details+'<p><b>Decorrenza:</b> _________________ <b>Durata / condizioni / revoca:</b> ________________________</p><p>Prima della firma verificare l’effettiva necessità del documento, i requisiti di legge e le condizioni specifiche di lavoro. La sola frequenza del corso non costituisce una nomina automatica.</p><div class="sign"><span>Datore di lavoro / soggetto autorizzato</span><span>Lavoratore per presa visione / accettazione, ove prevista</span></div><p style="margin-top:35px"><button onclick="print()">Stampa modello</button></p></body></html>';
}
function printTemplate(kind,assignment){
 const win=window.open('','_blank');if(!win){alert('Consenti i popup per stampare il modello.');return;}
 win.document.open();win.document.write(template(kind,assignment));win.document.close();win.focus();
}
async function renderForAssignments(host,assignments){
 if(!cloud()?.learner||!host)return;
 style();
 const identity=cloud()?.user?.id,active=new Set(assignments.map(a=>a.id));
 host.querySelectorAll('.lcd-line').forEach(el=>el.remove());
 const eligible=assignments.filter(a=>a?.id);
 if(!eligible.length)return;
 let settled;
 try{
   // Un'unica lettura RLS per tutti i corsi del corsista, evitando N richieste ogni refresh.
   const {data,error}=await db().from('learner_course_documents')
     .select('id,enrollment_id,kind,title,document_status,is_required,storage_path,notes,published_at')
     .in('enrollment_id',eligible.map(a=>a.id)).eq('document_status','published')
     .order('created_at',{ascending:false});
   if(error)throw error;
   const byEnrollment=new Map(eligible.map(a=>[a.id,[]]));
   (data||[]).forEach(doc=>byEnrollment.get(doc.enrollment_id)?.push(doc));
   settled=eligible.map(a=>({a,docs:byEnrollment.get(a.id)||[]}));
 }catch(e){settled=eligible.map(a=>({a,error:e}));}
 if(cloud()?.user?.id!==identity||!host.isConnected)return;
 settled.forEach(({a,docs,error})=>{
   if(!active.has(a.id))return;
   const card=[...host.querySelectorAll('[data-enrollment-id]')].find(btn=>btn.dataset.enrollmentId===a.id)?.closest('.learner-course');
   if(!card)return;
   const pane=document.createElement('section');pane.className='lcd-line';
   if(error){pane.innerHTML='<p class="lcd-note">Documenti non disponibili: '+esc(error.message||error)+'</p>';card.appendChild(pane);return;}
   const published=docs.filter(d=>d.document_status==='published');
   const linked=published;
   // Ogni modello è disponibile subito, senza prerequisiti formativi o documentali.
   const proposed=Object.keys(KINDS).filter(k=>k!=='altro_documento'&&!linked.some(d=>d.kind===k));
   pane.innerHTML='<h3>📄 Documenti e modelli stampabili</h3><p class="lcd-note">Stampa disponibile in qualsiasi fase. I PDF pubblicati sono separati dai facsimili da completare.</p><div class="lcd-list">'+
    published.map(d=>'<div class="lcd-row"><div><b>'+esc(d.title)+'</b><small>'+esc(d.is_required?'Documento collegato indicato come obbligatorio':'PDF pubblicato dall’amministrazione')+'</small></div><button type="button" class="lcd-btn" data-lcd-download="'+esc(d.id)+'">Apri / stampa PDF</button></div>').join('')+
    proposed.map(k=>'<div class="lcd-row"><div><b>'+esc(KINDS[k])+'</b><small>Facsimile da compilare e approvare, non valido come nomina firmata</small></div><button type="button" class="lcd-btn" data-lcd-template="'+esc(k)+'">Stampa modello</button></div>').join('')+
    '</div><p class="lcd-note">Il completamento del corso non conferisce automaticamente incarichi o autorizzazioni. I modelli devono essere validati e sottoscritti dai responsabili prima dell’utilizzo.</p>';
   pane.querySelectorAll('[data-lcd-download]').forEach(b=>b.onclick=async()=>{const row=published.find(d=>d.id===b.dataset.lcdDownload);if(row){b.disabled=true;try{await openDocument(row);}catch(e){alert(e.message||e);}finally{b.disabled=false;}}});
   pane.querySelectorAll('[data-lcd-template]').forEach(b=>b.onclick=()=>printTemplate(b.dataset.lcdTemplate,a));
   card.appendChild(pane);
 });
}
// Admin: caricamento di PDF individuali, revisione firma, pubblicazione e revoca.
function ensureNav(){
 const nav=document.querySelector('#adminShell .admin-nav nav');
 if(!nav)return;
 let b=document.getElementById('adminCourseDocumentsNav');
 if(!b){b=document.createElement('button');b.id='adminCourseDocumentsNav';b.type='button';b.innerHTML='<span>📄</span> Attestati e documenti';nav.appendChild(b);b.onclick=()=>{document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open');void renderAdmin();};}
 b.classList.toggle('hidden',!platformAdmin());b.setAttribute('aria-hidden',String(!platformAdmin()));
}
async function loadAdminEnrollments(){
 const {data:rows,error}=await db().from('enrollments').select('id,learner_id,edition_id,status,completed_at').order('created_at',{ascending:false}).limit(500);
 if(error)throw error;
 const learners=[...new Set((rows||[]).map(e=>e.learner_id))];
 const editions=[...new Set((rows||[]).map(e=>e.edition_id))];
 const [people,courseEditions]=await Promise.all([
  learners.length?db().from('learners').select('id,first_name,last_name,email').in('id',learners):{data:[],error:null},
  editions.length?db().from('course_editions').select('id,title').in('id',editions):{data:[],error:null}
 ]);
 if(people.error)throw people.error;if(courseEditions.error)throw courseEditions.error;
 const lm=new Map((people.data||[]).map(p=>[p.id,p])),em=new Map((courseEditions.data||[]).map(p=>[p.id,p]));
 return (rows||[]).map(e=>({...e,person:lm.get(e.learner_id),edition:em.get(e.edition_id)}));
}
function current(){return document.getElementById('adminCourseDocumentsNav')?.classList.contains('active')&&platformAdmin();}
async function renderAdmin(){
 if(!platformAdmin()||!db())return;
 style();ensureNav();
 const nav=document.querySelector('#adminShell .admin-nav nav');
 nav?.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
 document.getElementById('adminCourseDocumentsNav')?.classList.add('active');
 const title=document.getElementById('adminTitle'),subtitle=document.getElementById('adminSubtitle'),host=document.getElementById('adminContent');
 if(title)title.textContent='Attestati e documenti';if(subtitle)subtitle.textContent='Pubblicazione controllata per ogni corsista e iscrizione';
 if(!host)return;
 host.innerHTML='<section class="admin-card"><h2>Archivio documenti per corsista</h2><p class="lcd-note">Qualsiasi documento può essere caricato, aperto e stampato senza controlli sullo stato del corso. La pubblicazione consente al corsista di vedere il PDF; la validità formale resta distinta dalla stampa.</p><div id="lcdAdminBody">Caricamento…</div></section>';
 try{
  state.assignments=await loadAdminEnrollments();if(!current())return;
  const opts=state.assignments.map(e=>'<option value="'+esc(e.id)+'">'+esc([e.person?.last_name,e.person?.first_name].filter(Boolean).join(' ')||e.person?.email||'Corsista')+' — '+esc(e.edition?.title||'Edizione')+'</option>').join('');
  host.querySelector('#lcdAdminBody').innerHTML='<div class="lcd-admin"><label>Seleziona corsista e iscrizione<select id="lcdAdminEnrollment"><option value="">Seleziona corsista e corso</option>'+opts+'</select></label><div id="lcdAdminRecords"></div><div id="lcdAdminFeedback" role="status" aria-live="polite"></div></div>';
  const sel=host.querySelector('#lcdAdminEnrollment');if(state.selected&&state.assignments.some(e=>e.id===state.selected))sel.value=state.selected;
  sel.onchange=()=>{state.selected=sel.value;void renderAdminRecords();};
  if(sel.value)await renderAdminRecords();
 }catch(e){showError(host.querySelector('#lcdAdminBody'),e);}
}
async function renderAdminRecords(){
 const host=document.getElementById('lcdAdminRecords');if(!host||!current())return;
 const e=state.assignments.find(x=>x.id===state.selected);if(!e){host.innerHTML='';return;}
 host.textContent='Caricamento documenti…';
 try{
  const docs=await documents(e.id);if(!current()||state.selected!==e.id)return;
  host.innerHTML='<h3>Documenti registrati</h3><div class="lcd-list">'+(docs.length?docs.map(d=>
   '<div class="lcd-row"><div><b>'+esc(d.title)+'</b><small>'+esc(d.document_status.toUpperCase())+' · '+esc(KINDS[d.kind])+(d.is_required?' · Obbligatorio':'')+'</small></div><div style="display:flex;gap:6px;flex-wrap:wrap">'+
   (d.storage_path?'<button class="lcd-btn" data-lcd-preview="'+esc(d.id)+'">Apri</button>':'')+
   (d.document_status==='draft'?'<button class="lcd-btn" data-lcd-publish="'+esc(d.id)+'">Pubblica</button>':'')+
   (d.document_status==='published'?'<button class="lcd-btn" data-lcd-retire="'+esc(d.id)+'">Ritira</button>':'')+
   '</div></div>').join(''):'<p class="lcd-note">Non ci sono documenti: inizia caricando l’attestato.</p>')+'</div>'+
   '<h3>Nuovo documento — stampa libera</h3><form id="lcdAdminForm" class="lcd-admin">'+
   '<div class="lcd-fieldgrid"><label>Tipo<select name="kind">'+Object.entries(KINDS).map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v)+'</option>').join('')+'</select></label>'+
   '<label>Titolo<input name="title" required minlength="3" maxlength="180" placeholder="Titolo documento"></label></div>'+
   '<label>PDF da rendere stampabile (massimo 15 MB)<input name="pdf" type="file" accept="application/pdf,.pdf" required></label>'+
   '<div class="lcd-fieldgrid"><label>Data documento<input name="issued_at" type="date"></label><label>Verificato / approvato da (facoltativo)<input name="approved_by" placeholder="Nominativo, se già approvato"></label></div>'+
   '<label class="lcd-checkbox"><input name="is_required" type="checkbox"> Documento obbligatorio per questo caso (secondo verifica aziendale / normativa)</label>'+
   '<label class="lcd-checkbox"><input name="verified_signature" type="checkbox"> Documento già sottoscritto/verificato (informazione facoltativa, non blocca la stampa)</label>'+
   '<label>Note interne<textarea name="notes" rows="2" placeholder="Eventuali verifiche o condizioni"></textarea></label>'+
   '<button type="submit" class="lcd-btn">Carica come bozza</button><p class="lcd-note">Carica una bozza, aprila e stampala subito; pubblicala quando vuoi renderla visibile al corsista. Non è necessario un attestato precedente né un corso completato.</p></form>';
  host.querySelectorAll('[data-lcd-preview]').forEach(b=>b.onclick=()=>act(async()=>openDocument(docs.find(d=>d.id===b.dataset.lcdPreview))));
  host.querySelectorAll('[data-lcd-publish]').forEach(b=>b.onclick=()=>act(async()=>{
   const d=docs.find(x=>x.id===b.dataset.lcdPublish);
   if(!confirm('Rendere questo PDF visibile e stampabile al corsista?'))return;
   const {error}=await db().from('learner_course_documents').update({document_status:'published'}).eq('id',d.id);if(error)throw error;
   await renderAdminRecords();
  }));
  host.querySelectorAll('[data-lcd-retire]').forEach(b=>b.onclick=()=>act(async()=>{
   const d=docs.find(x=>x.id===b.dataset.lcdRetire);
   if(!confirm('Ritirare questo documento? Non sarà più visibile al corsista.'))return;
   const {error}=await db().from('learner_course_documents').update({document_status:'retired'}).eq('id',d.id);if(error)throw error;
   await renderAdminRecords();
  }));
  host.querySelector('#lcdAdminForm').onsubmit=ev=>{ev.preventDefault();void act(()=>upload(ev.currentTarget,e));};
 }catch(err){showError(host,err);}
}
async function act(fn){
 const feedback=document.getElementById('lcdAdminFeedback');
 if(state.busy)return;state.busy=true;if(feedback)feedback.textContent='Operazione in corso…';
 try{await fn();if(feedback)feedback.textContent='Operazione completata.';}catch(e){console.error('[Documenti corsista]',e);showError(feedback,e);}finally{state.busy=false;}
}
async function upload(form,e){
 if(!platformAdmin())throw Error('Accesso non autorizzato.');
 const v=new FormData(form),file=v.get('pdf'),kind=String(v.get('kind')||'');
 if(!(file instanceof File)||file.size===0||file.size>15728640||file.type!=='application/pdf'||!file.name.toLowerCase().endsWith('.pdf'))throw Error('Selezionare un PDF valido di massimo 15 MB.');
 const id=crypto.randomUUID(),path=e.id+'/'+id+'/documento.pdf',title=String(v.get('title')||'').trim();
 const row={id,enrollment_id:e.id,learner_id:e.learner_id,kind,title,is_required:v.get('is_required')==='on',verified_signature:v.get('verified_signature')==='on',approved_by:String(v.get('approved_by')||'').trim(),issued_at:v.get('issued_at')||null,notes:String(v.get('notes')||'').trim(),document_status:'draft'};
 const created=await db().from('learner_course_documents').insert(row);if(created.error)throw created.error;
 try{
  const uploaded=await db().storage.from(BUCKET).upload(path,file,{cacheControl:'0',upsert:false,contentType:'application/pdf'});
  if(uploaded.error)throw uploaded.error;
  const saved=await db().from('learner_course_documents').update({storage_path:path,original_filename:file.name}).eq('id',id);
  if(saved.error)throw saved.error;
 }catch(err){
  // Lascia bozza non pubblicata per diagnosi; non promuove file incompleti.
  throw Error('Bozza creata ma caricamento PDF non completato: '+(err.message||err));
 }
 await renderAdminRecords();
}
function boot(){
 style();ensureNav();
 // La console amministrativa è creata anche dopo il login; non basta il solo DOMContentLoaded.
 document.addEventListener('safety:cloud-state-changed',ensureNav);
 document.addEventListener('safety:admin-capabilities',ensureNav);
 document.addEventListener('safety:auth-changed',ensureNav);
 document.getElementById('adminConsoleBtn')?.addEventListener('click',()=>setTimeout(ensureNav,0));
 const shell=document.getElementById('adminShell');
 if(shell)new MutationObserver(()=>{if(!document.getElementById('adminCourseDocumentsNav'))ensureNav();}).observe(shell,{childList:true,subtree:true});
}
window.SAFETY_COURSE_DOCUMENTS={renderForAssignments,renderAdmin,printTemplate,suggest,KINDS};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();