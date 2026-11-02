/* Owner/admin-operated edition registration links, QR and request approval. */
(()=>{'use strict';
 const client=()=>window.SAFETY_CLOUD?.state?.client;
 const actor=()=>window.SAFETY_CLOUD?.state?.user?.id;
 const host=()=>document.getElementById('adminContent');
 const shell=()=>document.getElementById('adminShell');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const state={editionId:'',seq:0,busy:false,qrLoading:null,notice:'',noticeKind:'info',requests:new Map()};
 const PUBLIC_ORIGIN='https://safety-training-safety-manager.vercel.app/';
 const registrationUrl=token=>{const url=new URL(PUBLIC_ORIGIN);url.searchParams.set('registration',token);return url.toString();};
 // Use the canonical recipient URL, never a localhost/admin preview origin.
 const activationRedirect=()=>new URL('?onboarding=1',PUBLIC_ORIGIN).toString();
 const notice=(message,kind='info')=>{state.notice=message;state.noticeKind=kind;};
 const inviteResult=result=>result?.already_linked?'Account già collegato; non serve una nuova email.':
  result?.status==='sent'?'Il servizio Auth ha accettato la richiesta di invio email (la consegna nella casella non è ancora verificata).':
  'Stato dell’email inatteso: verifica la sezione Accessi & import.';
 async function inviteLearner(learnerId){
  if(!learnerId)throw Error('Corsista approvato non valido. Ricarica le richieste.');
  const {data,error}=await client().functions.invoke('invite-learner',
   {body:{learner_id:learnerId,redirect_to:activationRedirect()}});
  if(error||data?.error){
    let detail=data?.message||data?.error||error?.message||'Invio non riuscito.';
    if(error?.context?.json){
      try{
        const body=await error.context.clone().json();
        detail=body?.message||body?.error||detail;
      }catch{ /* API may respond without JSON: retain a safe generic error. */ }
    }
    throw Error(String(detail).slice(0,300));
  }
  return data;
 }
 const explain=e=>{const msg=e?.message||String(e);alert('Operazione non riuscita: '+msg);};
 const rpc=async(name,params)=>{const {data,error}=await client().rpc(name,params);if(error)throw error;return data;};
 function styles(){
  if(document.getElementById('ar36Style'))return;
  const css=document.createElement('style');css.id='ar36Style';css.textContent=[
   '.ar36-controls{display:flex;flex-wrap:wrap;align-items:end;gap:12px}.ar36-controls label{display:grid;gap:6px;flex:1;min-width:220px}',
   '.ar36-controls select,.ar36-controls input{padding:10px;border:1px solid #63758c;border-radius:9px;background:#132238;color:white}',
   '.ar36-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.ar36-actions button{border:1px solid #557089;border-radius:9px;padding:10px 12px;background:#153d57;color:#fff;cursor:pointer;font-weight:750}',
   '.ar36-actions button:disabled{opacity:.5;cursor:default}.ar36-actions .ar36-primary{background:#148468}.ar36-actions .ar36-danger{background:#6e2d31}',
   '.ar36-link{overflow-wrap:anywhere;font-size:13px;background:#081522;border:1px solid #3d5062;border-radius:9px;padding:13px;color:#c6e7f2}',
   '.ar36-request{border-bottom:1px solid #39465a;padding:11px 2px}.ar36-request small{display:block;color:#9fafc0}',
   '.ar36-qr{width:max-content;max-width:100%;background:white;padding:12px;border-radius:12px;margin:12px 0}',
   '.ar36-note{line-height:1.5;font-size:13px;color:#b5c7d7}.ar36-muted{color:#b6c8d8}.ar36-delivery{margin-top:9px;border-left:3px solid #6cc4b1;padding-left:11px}.ar36-notice{border:1px solid #4d9f87;background:#163b36;color:#e4fff6;border-radius:9px;padding:12px;margin:12px 0;line-height:1.55}.ar36-notice.warn{border-color:#d5a55a;background:#49391f;color:#fff2cd}',
   '#adminRegistrationNav{white-space:normal}'
  ].join('');document.head.appendChild(css);
 }
 function nav(){
  const list=shell()?.querySelector('.admin-nav nav');
  if(!list||document.getElementById('adminRegistrationNav'))return;
  const btn=document.createElement('button');btn.type='button';btn.id='adminRegistrationNav';btn.innerHTML='<span>🔗</span> Iscrizioni pubbliche';
  const anchor=list.querySelector('#adminAccessImportNav')||list.querySelector('[data-tab="enrollments"]');
  if(anchor)anchor.after(btn);else list.appendChild(btn);
  btn.addEventListener('click',()=>{list.querySelectorAll('button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');shell()?.classList.remove('admin-mobile-nav-open');void render();});
 }
 const current=(id,who)=>id===state.seq&&actor()===who&&document.getElementById('adminRegistrationNav')?.classList.contains('active')&&host();
 async function qr(url){
  if(window.QRCode)return;
  if(state.qrLoading)return state.qrLoading;
  state.qrLoading=new Promise((resolve,reject)=>{
   const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(Error('Generatore QR non disponibile'));document.head.appendChild(s);
  });
  try{await state.qrLoading;}finally{state.qrLoading=null;}
 }
 async function validatePublicLink(url){
  const token=new URL(url).searchParams.get('registration');
  if(!/^[a-f0-9]{48}$/.test(token||''))throw Error('Link QR non valido: rigenera il link.');
  const info=await rpc('public_registration_info_v36',{p_token:token});
  if(!info?.available)throw Error('Link QR non disponibile o scaduto: rigenera il link.');
  return info;
 }
 async function showQr(url){
  const area=host()?.querySelector('#ar36Qr');if(!area)return;
  await validatePublicLink(url);
  await qr(url);if(!area.isConnected)return;
  area.innerHTML='';new window.QRCode(area,{text:url,width:240,height:240,correctLevel:window.QRCode.CorrectLevel.M});
 }
 async function downloadQr(){
  const area=host()?.querySelector('#ar36Qr');const canvas=area?.querySelector('canvas');
  const img=area?.querySelector('img');let data=canvas?.toDataURL?.('image/png')||img?.src;
  if(!data)throw Error('Genera prima il QR code.');
  const a=document.createElement('a');a.href=data;a.download='SafetyTraining-QR-iscrizione.png';document.body.appendChild(a);a.click();a.remove();
 }
 async function lists(){
  const [editions,versions,courses]=await Promise.all([
   client().from('course_editions').select('id,title,organization_id,company_id,course_version_id,status').eq('status','open').order('created_at',{ascending:false}).limit(250),
   client().from('course_versions').select('id,course_id').limit(400),
   client().from('courses').select('id,title').limit(250)
  ]);
  for(const r of [editions,versions,courses])if(r.error)throw r.error;
  const vm=new Map((versions.data||[]).map(x=>[x.id,x.course_id]));
  const cm=new Map((courses.data||[]).map(x=>[x.id,x.title]));
  return (editions.data||[]).map(x=>({...x,display:[x.title||cm.get(vm.get(x.course_version_id))||'Corso',cm.get(vm.get(x.course_version_id))].filter(Boolean).join(' · ')}));
 }
 const choice=(edition)=>'<option value="'+esc(edition.id)+'"'+(edition.id===state.editionId?' selected':'')+'>'+esc(edition.display)+'</option>';
 const requestRows=(requests,invites=new Map())=>{
  const pending=requests.filter(r=>r.status==='pending');
  const history=requests.filter(r=>r.status!=='pending').slice(0,30);
  const entry=(r,isPending)=>{
   const status=invites.get(r.learner_id)?.status||'';
   const mailText=status==='accepted'?'Account già collegato':
    status==='sent'?'Richiesta invio email accettata da Auth; consegna da verificare':
    status==='failed'?'Invio email fallito: verifica SMTP':
    'Email di attivazione non verificata. Controlla Accessi & import.';
   return '<div class="ar36-request"><strong>'+esc(r.last_name)+' '+esc(r.first_name)+'</strong> · '+esc(r.email)+
    '<small>Telefono: '+esc(r.phone||'—')+' · CF: '+esc(r.fiscal_code||'—')+' · '+esc(new Date(r.created_at).toLocaleString('it-IT'))+'</small>'+
    (isPending?'<div class="ar36-actions"><button class="ar36-primary" data-ar36-approve="'+esc(r.id)+'">Approva, iscrivi e invia email</button>'+
     '<button class="ar36-danger" data-ar36-reject="'+esc(r.id)+'">Rifiuta</button></div>':
     '<small>Esito: '+esc(r.status==='approved'?'Iscrizione approvata':'Richiesta rifiutata')+'</small>'+
     (r.status==='approved'&&r.learner_id?'<div class="ar36-delivery"><small>'+esc(mailText)+'</small>'+
      '<div class="ar36-actions"><button type="button" data-ar36-resend="'+esc(r.id)+'">Invia / reinvia email di accesso</button></div></div>':''))+
    '</div>';
  };
  return '<section class="admin-card"><h2>Da approvare ('+pending.length+')</h2><p class="ar36-note">Il QR registra una richiesta. L’email di attivazione viene tentata soltanto dopo l’approvazione dell’amministratore.</p>'+
   (pending.map(x=>entry(x,true)).join('')||'<p>Nessuna richiesta in attesa.</p>')+
   (history.length?'<details open><summary>Richieste già esaminate ('+history.length+')</summary>'+history.map(x=>entry(x,false)).join('')+'</details>':'')+'</section>';
 };
 async function render(){
  nav();styles();const who=actor(),root=host();if(!who||!client()||!root)return;
  const seq=++state.seq;document.getElementById('adminRegistrationNav')?.classList.add('active');
  document.getElementById('adminTitle').textContent='Iscrizioni pubbliche';
  document.getElementById('adminSubtitle').textContent='Un link e un QR per ciascuna edizione, con approvazione manuale';
  root.innerHTML='<section class="admin-card">Caricamento edizioni…</section>';
  try{
   const editions=await lists();if(!current(seq,who))return;
   if(!editions.some(x=>x.id===state.editionId))state.editionId=editions[0]?.id||'';
   if(!state.editionId){root.innerHTML='<section class="admin-card"><h2>Nessuna edizione aperta</h2><p>Apri prima un’edizione nella sezione Edizioni.</p></section>';return;}
   const [link,requests]=await Promise.all([
    rpc('admin_registration_links_v36',{p_edition_id:state.editionId}),
    rpc('admin_registration_requests_v36',{p_edition_id:state.editionId})
   ]);
   if(!current(seq,who))return;
   state.requests=new Map((Array.isArray(requests)?requests:[]).map(r=>[r.id,r]));
   const ids=[...new Set((Array.isArray(requests)?requests:[]).filter(r=>r.status==='approved'&&r.learner_id).map(r=>r.learner_id))].slice(0,250);
   let invites=new Map();
   if(ids.length){
    const {data,error}=await client().from('learner_account_invitations')
     .select('learner_id,status,last_sent_at').in('learner_id',ids);
    if(!current(seq,who))return;
    if(!error)invites=new Map((data||[]).map(r=>[r.learner_id,r]));
   }
   const live=link?.active&&new Date(link.expires_at)>new Date();
   const url=live?registrationUrl(link.token):'';
   root.innerHTML=(state.notice?'<div class="ar36-notice '+esc(state.noticeKind)+'" role="status" aria-live="polite">'+esc(state.notice)+'</div>':'')+
    '<section class="admin-card"><h2>Link pubblico e QR code</h2>'+
    '<p class="ar36-note">Questo QR serve a <strong>richiedere l’iscrizione</strong>, non ad accedere immediatamente al corso. Dopo l’approvazione il sistema prova a inviare automaticamente l’email di attivazione. La consegna effettiva dipende dalla configurazione SMTP.</p>'+
    '<div class="ar36-controls"><label>Edizione<select id="ar36Edition">'+editions.map(choice).join('')+'</select></label>'+
    '<label>Durata del link<select id="ar36Duration"><option value="7">7 giorni</option><option value="30" selected>30 giorni</option><option value="90">90 giorni</option><option value="365">365 giorni</option></select></label></div>'+
    (live?'<p class="ar36-note">Link attivo fino al '+esc(new Date(link.expires_at).toLocaleString('it-IT'))+'</p><p class="ar36-link">'+esc(url)+'</p>'+
     '<div class="ar36-actions"><button class="ar36-primary" id="ar36Copy">Copia link</button><button id="ar36Share">Condividi</button>'+
     '<button id="ar36CheckLink">Verifica link</button><button id="ar36ShowQr">Mostra QR</button><button id="ar36DownloadQr">Scarica QR</button>'+
     '<button class="ar36-danger" id="ar36Disable">Disattiva link</button></div><div id="ar36Qr"></div>'+
     '<p class="ar36-note">La rigenerazione invalida immediatamente il vecchio link.</p>':
     '<p class="ar36-muted">Nessun link attivo per questa edizione.</p>')+
    '<div class="ar36-actions"><button class="ar36-primary" id="ar36Create">'+(live?'Rigenera link':'Crea link e QR')+'</button>'+
    '<button id="ar36Refresh">Aggiorna richieste</button></div></section>'+
    requestRows(Array.isArray(requests)?requests:[],invites);
   if(live)void showQr(url).catch(()=>{const area=root.querySelector('#ar36Qr');if(area)area.textContent='QR temporaneamente non disponibile: utilizza il link.';});
   root.querySelector('#ar36Edition').onchange=e=>{state.editionId=e.target.value;state.notice='';void render();};
   root.querySelector('#ar36Create').onclick=()=>void operate(async()=>{
    if(live&&!confirm('Rigenerare il link? Il vecchio link e relativo QR smetteranno di funzionare.'))return;
    await rpc('admin_create_registration_link_v36',{p_edition_id:state.editionId,p_expires_days:Number(root.querySelector('#ar36Duration').value)});
    await render();
   });
   root.querySelector('#ar36Refresh').onclick=()=>void render();
   root.querySelector('#ar36Copy')?.addEventListener('click',()=>void operate(async()=>{await navigator.clipboard.writeText(url);alert('Link copiato.');}));
   root.querySelector('#ar36Share')?.addEventListener('click',()=>void operate(async()=>{if(navigator.share)await navigator.share({title:'SafetyTraining · richiesta iscrizione',url});else{await navigator.clipboard.writeText(url);alert('Link copiato.');}}));
   root.querySelector('#ar36CheckLink')?.addEventListener('click',()=>void operate(async()=>{
    await validatePublicLink(url);
    notice('Il database conferma che il link e il modulo sono disponibili. La ricezione di email è una verifica separata.');
    await render();
   }));
   root.querySelector('#ar36ShowQr')?.addEventListener('click',()=>void operate(async()=>showQr(url)));
   root.querySelector('#ar36DownloadQr')?.addEventListener('click',()=>void operate(async()=>{if(!root.querySelector('#ar36Qr canvas'))await showQr(url);await downloadQr();}));
   root.querySelector('#ar36Disable')?.addEventListener('click',()=>void operate(async()=>{if(confirm('Disattivare il link di iscrizione? Le richieste già ricevute restano disponibili.')){await rpc('admin_disable_registration_link_v36',{p_edition_id:state.editionId});await render();}}));
   root.querySelectorAll('[data-ar36-approve]').forEach(b=>b.onclick=()=>void decide(b.dataset.ar36Approve,true));
   root.querySelectorAll('[data-ar36-reject]').forEach(b=>b.onclick=()=>void decide(b.dataset.ar36Reject,false));
   root.querySelectorAll('[data-ar36-resend]').forEach(b=>b.onclick=()=>void resend(b.dataset.ar36Resend));
  }catch(e){if(current(seq,who))root.innerHTML='<section class="admin-card"><p class="admin-error">'+esc(e?.message||e)+'</p><button id="ar36Retry">Riprova</button></section>';root.querySelector('#ar36Retry')?.addEventListener('click',()=>void render());}
 }
 async function operate(job){if(state.busy)return;state.busy=true;host()?.querySelectorAll('button').forEach(x=>x.disabled=true);try{await job();}catch(e){explain(e);}finally{state.busy=false;host()?.querySelectorAll('button').forEach(x=>x.disabled=false);}}
 async function resend(id){
  const req=state.requests.get(id);
  if(!req||req.status!=='approved'||!req.learner_id)return explain(Error('Richiesta approvata non trovata. Aggiorna la pagina.'));
  if(!confirm('Inviare nuovamente l’email di accesso? Non verrà creata un’altra iscrizione.'))return;
  await operate(async()=>{
   try{
    const result=await inviteLearner(req.learner_id);
    notice('Invito: '+inviteResult(result));
   }catch(error){
    notice('Email NON inviata: '+(error?.message||error)+'. Verifica SMTP e limiti; puoi riprovare senza iscrivere di nuovo.','warn');
   }
   await render();
  });
 }
 async function decide(id,approve){
  if(!confirm(approve?'Confermi i dati? Il corsista verrà iscritto e il sistema invierà automaticamente l’invito email.':'Rifiutare questa richiesta?'))return;
  await operate(async()=>{
   const result=await rpc('admin_registration_decide_v36',{p_request_id:id,p_approve:approve});
   if(!approve){notice('Richiesta rifiutata. Nessuna email di attivazione inviata.');await render();return;}
   // Enrollment is committed first; email errors never cause re-approval or duplicate enrollments.
   try{
    const email=await inviteLearner(result?.learner_id);
    notice('Iscrizione approvata. '+inviteResult(email));
   }catch(error){
    notice('Iscrizione approvata, ma email NON inviata: '+(error?.message||error)+
     '. Usa «Invia / reinvia email di accesso» nella richiesta approvata. Non ripetere l’iscrizione.','warn');
   }
   await render();
  });
 }
 function start(){
  nav();
  const target=shell()?.querySelector('.admin-nav nav');
  if(target){const obs=new MutationObserver(()=>nav());obs.observe(target,{childList:true});}
  document.addEventListener('safety:auth-changed',()=>{state.seq++;});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.SAFETY_ADMIN_REGISTRATION_V36={render,registrationUrl};
})();
