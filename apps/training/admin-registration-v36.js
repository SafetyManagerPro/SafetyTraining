/* Owner/admin-operated edition registration links, QR and request approval. */
(()=>{'use strict';
 const client=()=>window.SAFETY_CLOUD?.state?.client;
 const actor=()=>window.SAFETY_CLOUD?.state?.user?.id;
 const host=()=>document.getElementById('adminContent');
 const shell=()=>document.getElementById('adminShell');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const state={editionId:'',seq:0,busy:false,qrLoading:null};
 const registrationUrl=token=>{const url=new URL(location.origin+location.pathname);url.searchParams.set('registration',token);return url.toString();};
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
   '.ar36-note{line-height:1.5;font-size:13px;color:#b5c7d7}.ar36-muted{color:#b6c8d8}',
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
 async function showQr(url){
  const area=host()?.querySelector('#ar36Qr');if(!area)return;
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
 const requestRows=requests=>{
  const pending=requests.filter(r=>r.status==='pending');
  const history=requests.filter(r=>r.status!=='pending').slice(0,20);
  const entry=(r,isPending)=>'<div class="ar36-request"><strong>'+esc(r.last_name)+' '+esc(r.first_name)+'</strong> · '+esc(r.email)+
   '<small>Telefono: '+esc(r.phone||'—')+' · CF: '+esc(r.fiscal_code||'—')+' · '+esc(new Date(r.created_at).toLocaleString('it-IT'))+'</small>'+
   (isPending?'<div class="ar36-actions"><button class="ar36-primary" data-ar36-approve="'+esc(r.id)+'">Approva e iscrivi</button>'+
    '<button class="ar36-danger" data-ar36-reject="'+esc(r.id)+'">Rifiuta</button></div>':'<small>Esito: '+esc(r.status==='approved'?'Approvata':'Rifiutata')+'</small>')+
   '</div>';
  return '<section class="admin-card"><h2>Da approvare ('+pending.length+')</h2><p class="ar36-note">Controlla l’identità ed eventuali duplicati prima di approvare. Nessuna richiesta attiva il corso automaticamente.</p>'+
   (pending.map(x=>entry(x,true)).join('')||'<p>Nessuna richiesta in attesa.</p>')+
   (history.length?'<details><summary>Richieste già esaminate ('+history.length+')</summary>'+history.map(x=>entry(x,false)).join('')+'</details>':'')+'</section>';
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
   const live=link?.active&&new Date(link.expires_at)>new Date();
   const url=live?registrationUrl(link.token):'';
   root.innerHTML='<section class="admin-card"><h2>Link pubblico e QR code</h2>'+
    '<p class="ar36-note">Il link è specifico di questa edizione. Chi lo apre invia una richiesta, che resta sospesa fino alla tua approvazione.</p>'+
    '<div class="ar36-controls"><label>Edizione<select id="ar36Edition">'+editions.map(choice).join('')+'</select></label>'+
    '<label>Durata del link<select id="ar36Duration"><option value="7">7 giorni</option><option value="30" selected>30 giorni</option><option value="90">90 giorni</option><option value="365">365 giorni</option></select></label></div>'+
    (live?'<p class="ar36-note">Link attivo fino al '+esc(new Date(link.expires_at).toLocaleString('it-IT'))+'</p><p class="ar36-link">'+esc(url)+'</p>'+
     '<div class="ar36-actions"><button class="ar36-primary" id="ar36Copy">Copia link</button><button id="ar36Share">Condividi</button>'+
     '<button id="ar36ShowQr">Mostra QR</button><button id="ar36DownloadQr">Scarica QR</button>'+
     '<button class="ar36-danger" id="ar36Disable">Disattiva link</button></div><div id="ar36Qr"></div>'+
     '<p class="ar36-note">La rigenerazione invalida immediatamente il vecchio link.</p>':
     '<p class="ar36-muted">Nessun link attivo per questa edizione.</p>')+
    '<div class="ar36-actions"><button class="ar36-primary" id="ar36Create">'+(live?'Rigenera link':'Crea link e QR')+'</button>'+
    '<button id="ar36Refresh">Aggiorna richieste</button></div></section>'+
    requestRows(Array.isArray(requests)?requests:[]);
   root.querySelector('#ar36Edition').onchange=e=>{state.editionId=e.target.value;void render();};
   root.querySelector('#ar36Create').onclick=()=>void operate(async()=>{
    if(live&&!confirm('Rigenerare il link? Il vecchio link e relativo QR smetteranno di funzionare.'))return;
    await rpc('admin_create_registration_link_v36',{p_edition_id:state.editionId,p_expires_days:Number(root.querySelector('#ar36Duration').value)});
    await render();
   });
   root.querySelector('#ar36Refresh').onclick=()=>void render();
   root.querySelector('#ar36Copy')?.addEventListener('click',()=>void operate(async()=>{await navigator.clipboard.writeText(url);alert('Link copiato.');}));
   root.querySelector('#ar36Share')?.addEventListener('click',()=>void operate(async()=>{if(navigator.share)await navigator.share({title:'SafetyTraining · richiesta iscrizione',url});else{await navigator.clipboard.writeText(url);alert('Link copiato.');}}));
   root.querySelector('#ar36ShowQr')?.addEventListener('click',()=>void operate(async()=>showQr(url)));
   root.querySelector('#ar36DownloadQr')?.addEventListener('click',()=>void operate(async()=>{if(!root.querySelector('#ar36Qr canvas'))await showQr(url);await downloadQr();}));
   root.querySelector('#ar36Disable')?.addEventListener('click',()=>void operate(async()=>{if(confirm('Disattivare il link di iscrizione? Le richieste già ricevute restano disponibili.')){await rpc('admin_disable_registration_link_v36',{p_edition_id:state.editionId});await render();}}));
   root.querySelectorAll('[data-ar36-approve]').forEach(b=>b.onclick=()=>void decide(b.dataset.ar36Approve,true));
   root.querySelectorAll('[data-ar36-reject]').forEach(b=>b.onclick=()=>void decide(b.dataset.ar36Reject,false));
  }catch(e){if(current(seq,who))root.innerHTML='<section class="admin-card"><p class="admin-error">'+esc(e?.message||e)+'</p><button id="ar36Retry">Riprova</button></section>';root.querySelector('#ar36Retry')?.addEventListener('click',()=>void render());}
 }
 async function operate(job){if(state.busy)return;state.busy=true;host()?.querySelectorAll('button').forEach(x=>x.disabled=true);try{await job();}catch(e){explain(e);}finally{state.busy=false;host()?.querySelectorAll('button').forEach(x=>x.disabled=false);}}
 async function decide(id,approve){
  if(!confirm(approve?'Confermi di aver verificato i dati? Il corsista sarà iscritto al corso.':'Rifiutare questa richiesta?'))return;
  await operate(async()=>{
   const result=await rpc('admin_registration_decide_v36',{p_request_id:id,p_approve:approve});
   if(approve&&result?.learner_id&&confirm('Iscrizione approvata. Vuoi inviare adesso l’email di attivazione al corsista?')){
    const {data,error}=await client().functions.invoke('invite-learner',{
     body:{learner_id:result.learner_id,redirect_to:new URL('?onboarding=1',location.href).toString()}
    });
    if(error||data?.error)alert('Iscrizione approvata, ma email non inviata: '+(error?.message||data?.message||data?.error));
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
