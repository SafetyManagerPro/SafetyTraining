/* SafetyTraining v46.11 — single-page internal learner management.
 * Administrative actions still enforce database/Edge Function authorization.
 * No automatic declaration of official ASR course certification. */
(()=>{'use strict';
const db=()=>window.SAFETY_CLOUD?.state?.client;
const actor=()=>window.SAFETY_CLOUD?.state?.user?.id;
const gate=()=>window.SAFETY_ACCESS_V46_10;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const s={open:false,busy:false,seq:0,learnerId:'',editionId:'',versionId:'',query:'',data:null,notice:'',status:''};
const root=()=>document.getElementById('adminContent');
const nav=()=>document.querySelector('#adminShell .admin-nav nav');
const learner=()=>s.data?.learners.find(x=>x.id===s.learnerId)||null;
const title=x=>[x?.last_name,x?.first_name].filter(Boolean).join(' ')||x?.email||'Corsista';
const validAdmin=()=>!!actor()&&!!db()&&['admin','staff'].includes(gate()?.state?.phase)&&
  (gate()?.state?.phase==='admin'||gate()?.state?.staffRoles?.some(r=>['organization_admin','training_manager'].includes(r)));
const errorMessage=e=>String(e?.message||e||'Operazione non riuscita.').slice(0,220);
function notice(message,kind=''){s.notice=message;s.status=kind;const box=document.getElementById('qv11Message');if(box){box.textContent=message;box.className='qv11-message '+kind;}}
function ensureNav(){
 const host=nav();if(!host)return;
 let btn=document.getElementById('qv11Nav');
 if(!btn){
  btn=document.createElement('button');btn.type='button';btn.id='qv11Nav';
  btn.innerHTML='<span>⚡</span> Gestione rapida corsisti';
  (host.querySelector('[data-tab="wizard"]')||host.firstElementChild)?.after(btn);
  btn.onclick=()=>{document.getElementById('adminShell')?.classList.remove('admin-mobile-nav-open');void open();};
 }
 btn.classList.toggle('hidden',!validAdmin());
}
function setHeader(){
 nav()?.querySelectorAll('button').forEach(btn=>btn.classList.remove('active'));
 document.getElementById('qv11Nav')?.classList.add('active');
 const title=document.getElementById('adminTitle'),sub=document.getElementById('adminSubtitle');
 if(title)title.textContent='Gestione rapida corsisti';
 if(sub)sub.textContent='Iscrivi, attiva accesso, cambia password o elimina: senza passaggi inutili';
}
function ensureStyles(){
 if(document.getElementById('qv11Styles'))return;
 const style=document.createElement('style');style.id='qv11Styles';
 style.textContent=`
 .qv11-panel{display:grid;gap:14px;max-width:1100px;margin:12px auto}
 .qv11-card{background:#121c2e;border:1px solid #2b4059;border-radius:16px;padding:18px;display:grid;gap:12px;min-width:0}
 .qv11-card h2{font-size:20px;margin:0}.qv11-card p{margin:0;color:#adbfce;line-height:1.5}
 .qv11-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:14px}
 .qv11-field{display:grid;gap:6px;font-weight:700;font-size:13px;color:#cddcee}
 .qv11-field :is(input,select){border:1px solid #52637a;background:#0b1729;color:#fff;border-radius:10px;width:100%;min-width:0;min-height:42px;padding:9px 12px}
 .qv11-actions{display:flex;flex-wrap:wrap;gap:8px}
 .qv11-actions button{border:1px solid #45657f;border-radius:10px;background:#243956;color:#fff;font-weight:750;padding:10px 13px;min-height:42px}
 .qv11-actions .qv11-primary{background:#4dd3a8;color:#07241b;border-color:#4dd3a8}
 .qv11-actions .qv11-danger{color:#ffcccc;background:#54232d;border-color:#904551}
 .qv11-actions button:disabled{opacity:.6;cursor:wait}
 .qv11-message{min-height:22px;white-space:normal;font-size:14px;color:#cee5f5}.qv11-message.error{color:#ffb8b8}.qv11-message.success{color:#a2f4d0}
 .qv11-secret{border:1px solid #5ba992;background:#0d2a29;border-radius:12px;padding:12px;display:grid;gap:9px}
 .qv11-secret input{width:100%;border:1px solid #719d94;border-radius:8px;background:#081e21;color:#fff;padding:9px;font:inherit}
 .qv11-note{font-size:12px;color:#acbacd}
 @media(max-width:650px){.qv11-card{padding:13px}.qv11-actions button{flex:1 1 180px}}
 `;
 document.head.appendChild(style);
}
const rpc=async(name,p)=>{const {data,error}=await db().rpc(name,p);if(error)throw error;return data;};
async function load(){
 const user=actor(),seq=++s.seq;if(!validAdmin())throw Error('Accesso amministrativo richiesto.');
 const tasks=[
  db().from('learners').select('id,first_name,last_name,email,phone,auth_user_id,organization_id,company_id,active').order('last_name').limit(800),
  db().from('course_editions').select('id,title,status,organization_id,company_id,course_version_id').eq('status','open').limit(1000),
  db().from('courses').select('id,title,owner_organization_id,active,metadata,certification_mode').eq('active',true).limit(500),
  db().from('course_versions').select('id,course_id,version_number,status').eq('status','published').limit(1000)
 ];
 const [l,e,c,v]=await Promise.all(tasks);
 for(const r of [l,e,c,v])if(r.error)throw r.error;
 if(seq!==s.seq||actor()!==user)return false;
 s.data={learners:l.data||[],editions:e.data||[],courses:c.data||[],versions:v.data||[]};
 if(!s.data.learners.some(x=>x.id===s.learnerId))s.learnerId=s.data.learners.find(x=>x.active)?.id||'';
 return true;
}
function edTitle(e){const v=s.data.versions.find(x=>x.id===e.course_version_id);const c=s.data.courses.find(x=>x.id===v?.course_id);return (c?.title||e.title||'Corso')+' · '+(e.title||'Edizione');}
function options(){
 const l=learner();if(!l)return {editions:[],versions:[]};
 const editions=s.data.editions.filter(e=>e.organization_id===l.organization_id&&(!e.company_id||e.company_id===l.company_id));
 const courses=s.data.courses.filter(c=>c.active&&(!c.owner_organization_id||c.owner_organization_id===l.organization_id)
   &&!c.metadata?.frozen&&!c.metadata?.freeze_scope);
 const ids=new Set(courses.map(c=>c.id));
 const versions=s.data.versions.filter(v=>ids.has(v.course_id));
 return {editions,versions};
}
async function draw(){
 if(!s.open||!validAdmin()||!root())return;
 ensureNav();setHeader();ensureStyles();
 const q=s.query.toLocaleLowerCase('it-IT');
 const matches=s.data.learners.filter(x=>x.active&&[title(x),x.email||''].some(v=>v.toLocaleLowerCase('it-IT').includes(q)));
 // Never retain a hidden learner from an earlier search when acting on a visible selection.
 if(!matches.some(x=>x.id===s.learnerId))s.learnerId=matches[0]?.id||'';
 const l=learner(),{editions,versions}=options();
 if(!editions.some(x=>x.id===s.editionId))s.editionId=editions[0]?.id||'';
 if(!versions.some(x=>x.id===s.versionId))s.versionId=versions[0]?.id||'';
 const courseNames=new Map(s.data.courses.map(x=>[x.id,x.title]));
 root().innerHTML=`<div class="qv11-panel">
 <section class="qv11-card"><h2>1. Scegli il corsista</h2>
 <div class="qv11-grid"><label class="qv11-field">Cerca per nome o email<input id="qv11Query" value="${esc(s.query)}" placeholder="Cerca corsista"></label>
 <label class="qv11-field">Corsista<select id="qv11Learner">${matches.map(x=>`<option value="${esc(x.id)}"${x.id===s.learnerId?' selected':''}>${esc(title(x))}${x.email?' · '+esc(x.email):' · senza email'}</option>`).join('')}</select></label></div>
 ${l?`<p><b>${esc(title(l))}</b> · Account: <b>${l.auth_user_id?'collegato':'non ancora collegato'}</b></p>`:'<p>Nessun corsista disponibile. Crealo dalla sezione Corsisti.</p>'}
 </section>
 ${l?`<div class="qv11-grid">
 <section class="qv11-card"><h2>2. Iscrivi al corso</h2>
 <p>Usa una delle edizioni aperte. Per percorsi interni non vengono richiesti ulteriori passaggi di conformità ASR.</p>
 <label class="qv11-field">Edizione disponibile<select id="qv11Edition">${editions.map(e=>`<option value="${esc(e.id)}"${e.id===s.editionId?' selected':''}>${esc(edTitle(e))}</option>`).join('')}</select></label>
 <div class="qv11-actions"><button id="qv11Enroll" class="qv11-primary" ${!s.editionId?'disabled':''}>Iscrivi / riattiva il corso</button></div>
 <label class="qv11-field">Per creare un'edizione interna di un corso pubblicato<select id="qv11Version">${versions.map(v=>`<option value="${esc(v.id)}"${v.id===s.versionId?' selected':''}>${esc(courseNames.get(v.course_id)||'Corso')} · v${esc(v.version_number)}</option>`).join('')}</select></label>
 <div class="qv11-actions"><button id="qv11CreateEdition" ${!s.versionId?'disabled':''}>Crea edizione interna aperta</button></div>
 </section>
 <section class="qv11-card"><h2>3. Attiva accesso e gestisci password</h2>
 <p>Il corsista entra subito con email e password temporanea, senza attendere l'email. La vecchia password non è leggibile; ne puoi impostare una nuova.</p>
 <label class="qv11-field">Email usata per l'accesso<input id="qv11Email" type="email" value="${esc(l.email||'')}" placeholder="corsista@email.it"></label>
 <div class="qv11-actions"><button id="qv11SaveEmail">Salva email</button>
 <button id="qv11Activate" class="qv11-primary" ${!l.email||l.auth_user_id?'disabled':''}>Attiva accesso subito</button>
 <button id="qv11Reset" ${!l.auth_user_id?'disabled':''}>Reimposta password</button></div>
 <div id="qv11Credentials" aria-live="polite"></div>
 <p class="qv11-note">La password generata compare una sola volta in questa pagina. Consegnala al corsista tramite un canale riservato e chiedigli di cambiarla.</p>
 </section></div>
 <section class="qv11-card"><h2>4. Elimina o rimuovi corsista</h2>
 <p><b>Elimina</b> cancella davvero l'anagrafica se non contiene frequenze o prove. Se ha uno storico, la rimuove subito dalla gestione attiva conservando quei dati, senza farti compilare piani di cancellazione.</p>
 <div class="qv11-actions"><button class="qv11-danger" id="qv11Delete">Elimina / rimuovi corsista</button></div></section>`:''}
 <p id="qv11Message" class="qv11-message ${esc(s.status)}" role="status" aria-live="polite">${esc(s.notice)}</p></div>`;
 bind();
}
async function action(fn){
 if(s.busy||!validAdmin())return;
 s.busy=true;
 root()?.querySelectorAll('.qv11-panel button').forEach(b=>b.disabled=true);
 try{await fn();}catch(e){notice(errorMessage(e),'error');}
 finally{s.busy=false;root()?.querySelectorAll('.qv11-panel button').forEach(b=>b.disabled=false);}
}
function bind(){
 const h=root(),q=h?.querySelector('#qv11Query');
 if(q)q.onchange=()=>{s.query=q.value;void draw();};
 const sel=h?.querySelector('#qv11Learner');
 if(sel)sel.onchange=()=>{s.learnerId=sel.value;s.editionId='';s.versionId='';s.notice='';void draw();};
 const ed=h?.querySelector('#qv11Edition');if(ed)ed.onchange=()=>{s.editionId=ed.value;};
 const ver=h?.querySelector('#qv11Version');if(ver)ver.onchange=()=>{s.versionId=ver.value;};
 const attach=(id,fn)=>{const b=h?.querySelector('#'+id);if(b)b.onclick=()=>void action(fn);};
 attach('qv11SaveEmail',async()=>{
  const l=learner(),email=h.querySelector('#qv11Email')?.value.trim().toLowerCase()||'';
  if(!email||!/^\S+@\S+\.\S+$/.test(email))throw Error('Inserisci un indirizzo email valido.');
  if(l.auth_user_id&&email!==String(l.email||'').toLowerCase())throw Error('Account già collegato: modifica l’email con una procedura di verifica dedicata.');
  await rpc('admin_set_learner_contact',{p_learner_id:l.id,p_email:email,p_phone:l.phone||null});
  notice('Email salvata. Ora puoi attivare l’accesso.','success');await load();await draw();
 });
 attach('qv11CreateEdition',async()=>{
  const l=learner(),version=s.data.versions.find(x=>x.id===s.versionId);
  if(!l||!version||!confirm('Creare un’edizione interna aperta per questo corso?'))return;
  const course=s.data.courses.find(x=>x.id===version.course_id);
  const payload={organization_id:l.organization_id,company_id:l.company_id||null,course_version_id:version.id,
   title:(course?.title||'Formazione')+' — interno',status:'open',learning_mode:'elearning_internal',
   certification_mode:'not_certifying',created_by:actor()};
  const result=await db().from('course_editions').insert(payload).select('id').single();
  if(result.error)throw result.error;
  s.editionId=result.data.id;notice('Edizione interna creata e aperta. Premi «Iscrivi» per assegnarla.','success');
  await load();await draw();
 });
 attach('qv11Enroll',async()=>{
  const l=learner(),edition=s.data.editions.find(x=>x.id===s.editionId);
  if(!l||!edition)throw Error('Seleziona corsista e corso.');
  const existing=await db().from('enrollments')
    .select('id,status').eq('edition_id',edition.id).eq('learner_id',l.id).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data?.status==='revoked'){
    await rpc('admin_set_enrollment_revoked',{p_enrollment_id:existing.data.id,p_revoked:false});
    notice('Iscrizione riattivata. Ora puoi attivare l’accesso.','success');
  }else{
    const enrolled=await rpc('admin_bulk_enroll',{p_edition_id:edition.id,p_learner_ids:[l.id],p_source:'internal_quick_v46_11'});
    notice(Number(enrolled?.inserted)?'Corsista iscritto correttamente. Ora attiva l’accesso.':
     'Il corsista risultava già iscritto. Nessuna iscrizione duplicata.','success');
  }
 });
 attach('qv11Activate',()=>credentials('activate'));
 attach('qv11Reset',()=>credentials('reset'));
 attach('qv11Delete',async()=>{
  const l=learner();if(!l||!confirm('Vuoi eliminare '+title(l)+' dalla gestione? Se ci sono presenze o prove, lo storico sarà conservato e il corsista verrà rimosso dalla lista attiva.'))return;
  let text='';try{
   const result=await rpc('admin_delete_unused_learner_v38',{p_learner_id:l.id,p_confirmation:'ELIMINA'});
   text='Corsista eliminato definitivamente. '+Number(result?.empty_enrollments_removed||0)+' iscrizioni vuote eliminate.';
  }catch(err){
   const protectedRecord=/learner_has_|linked_account_protected|accepted_account_invitation_protected|training_activity|training_history|training_evidence/.test(String(err?.message||''));
   if(!protectedRecord)throw err;
   await rpc('admin_archive_learner_v36',{p_learner_id:l.id});
   text='Corsista rimosso dalla gestione attiva. Storico e prove conservati (non eliminati definitivamente).';
  }
  s.learnerId='';notice(text,'success');await load();await draw();
 });
}
async function credentials(actionType){
 const l=learner();if(!l)throw Error('Scegli un corsista.');
 if(!l.email)throw Error('Inserisci e salva prima l’email del corsista.');
 if(actionType==='reset'&&!confirm('Reimpostare la password esistente? Il corsista dovrà usare quella nuova.'))return;
 const response=await db().functions.invoke('learner-access',{body:{action:actionType,learner_id:l.id}});
 if(response.error||response.data?.error)throw Error(response.data?.message||response.data?.error||response.error?.message||'Accesso non attivato.');
 if(response.data?.status!=='ready'||!response.data.temporary_password)throw Error('Il server non ha generato la nuova password.');
 const area=root()?.querySelector('#qv11Credentials');if(!area)return;
 area.innerHTML='<div class="qv11-secret"><strong>Credenziali create: da consegnare una sola volta</strong>'+
 '<label class="qv11-field">Email<input id="qv11CredentialEmail" readonly value="'+esc(response.data.email)+'"></label>'+
 '<label class="qv11-field">Password temporanea<input id="qv11TemporaryPassword" type="password" readonly></label>'+
 '<div class="qv11-actions"><button id="qv11ShowPassword">Mostra / nascondi</button><button id="qv11CopyCredentials">Copia credenziali</button></div>'+
 '<p>La password precedente non è stata letta né memorizzata. Questa nuova password sarà cancellata dalla pagina al cambio corsista o aggiornamento.</p></div>';
 const field=area.querySelector('#qv11TemporaryPassword');field.value=response.data.temporary_password;
 area.querySelector('#qv11ShowPassword').onclick=()=>{field.type=field.type==='password'?'text':'password';};
 area.querySelector('#qv11CopyCredentials').onclick=()=>{
  const words='SafetyTraining\nEmail: '+response.data.email+'\nPassword temporanea: '+field.value+'\nPer sicurezza cambia la password dopo il primo accesso.';
  navigator.clipboard.writeText(words).then(()=>notice('Credenziali copiate; consegnale al corsista in modo riservato.','success'),()=>notice('Copia non disponibile: usa Mostra / nascondi.','error'));
 };
 // No secret retained in state or localStorage.
 await load();
 notice('Account pronto per l’accesso. Copia subito le credenziali prima di uscire.','success');
}
async function open(){
 if(!validAdmin()){alert('Accesso amministrativo necessario.');return;}
 ensureNav();s.open=true;s.notice='';s.status='';s.seq++;ensureStyles();
 setHeader();if(root())root().innerHTML='<section class="admin-card">Caricamento corsisti e corsi…</section>';
 try{if(await load())await draw();}
 catch(e){if(root())root().innerHTML='<section class="admin-card"><p class="admin-error">'+esc(errorMessage(e))+'</p><button type="button" id="qv11Retry">Riprova</button></section>';document.getElementById('qv11Retry')?.addEventListener('click',()=>void open());}
}
function boot(){ensureNav();document.addEventListener('safety:access-ready',ensureNav);document.addEventListener('safety:auth-changed',()=>{s.seq++;s.open=false;s.data=null;s.learnerId='';ensureNav();});}
window.SAFETY_ADMIN_QUICK_V46_11={open};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
