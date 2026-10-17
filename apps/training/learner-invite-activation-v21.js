/* SafetyTraining v21.3 — secure learner activation from personal multichannel invitation links. */
(() => {
  'use strict';

  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const state={token:null,info:null,mode:'signup',busy:false};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function tokenFromUrl(){return new URL(location.href).searchParams.get('learner_invite')||'';}
  function requested(){return /^[a-f0-9]{64}$/i.test(tokenFromUrl());}
  function cleanToken(keepOnboarding=false){const u=new URL(location.href);u.searchParams.delete('learner_invite');if(!keepOnboarding)u.searchParams.delete('onboarding');history.replaceState({},'',`${u.pathname}${u.search}${u.hash}`);}

  function styles(){
    if(document.getElementById('learnerInviteV21Style'))return;
    const s=document.createElement('style');s.id='learnerInviteV21Style';s.textContent=`
      .li21{position:fixed;inset:0;z-index:12050;background:rgba(2,6,23,.84);backdrop-filter:blur(11px);display:grid;place-items:center;padding:18px}.li21.hidden{display:none}.li21-card{width:min(560px,100%);max-height:94vh;overflow:auto;background:#fff;color:#0f172a;border-radius:22px;padding:24px;box-shadow:0 32px 100px rgba(0,0,0,.48)}.li21-card h2{margin:5px 0 8px}.li21-card p{color:#475569;line-height:1.5}.li21-kicker{font-size:11px;font-weight:900;letter-spacing:.11em;color:#0f766e}.li21-info{padding:13px;border-radius:12px;background:#f1f5f9;margin:12px 0;font-size:13px}.li21-info strong{color:#0f172a}.li21-form{display:grid;gap:12px;margin-top:14px}.li21-form label{display:grid;gap:6px;font-weight:800;font-size:13px}.li21-form input{font:inherit;padding:12px;border:1px solid #cbd5e1;border-radius:10px}.li21-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}.li21-actions button{font:inherit;border:0;border-radius:10px;padding:11px 14px;font-weight:850;cursor:pointer}.li21-primary{background:#0f766e;color:white}.li21-secondary{background:#e2e8f0;color:#0f172a}.li21-actions button:disabled{opacity:.55;cursor:wait}.li21-msg{min-height:1.4em;margin-top:12px;font-size:13px}.li21-msg.error{color:#b91c1c}.li21-msg.ok{color:#166534}.li21-tabs{display:flex;gap:6px;margin-top:12px}.li21-tabs button{border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:8px 10px;font-weight:800}.li21-tabs button.active{background:#0f172a;color:white;border-color:#0f172a}.li21-note{font-size:12px;color:#64748b;margin-top:8px}
    `;document.head.appendChild(s);
  }

  function ensureUi(){
    styles();if(document.getElementById('learnerInviteV21'))return;
    const root=document.createElement('div');root.id='learnerInviteV21';root.className='li21 hidden';root.innerHTML=`<section class="li21-card" role="dialog" aria-modal="true"><div class="li21-kicker">SAFETY TRAINING · INVITO PERSONALE</div><h2 id="li21Title">Attiva il tuo accesso</h2><div id="li21Body"><p>Verifico il link di invito…</p></div><div id="li21Msg" class="li21-msg"></div></section>`;document.body.appendChild(root);
  }
  function show(){ensureUi();document.getElementById('learnerInviteV21')?.classList.remove('hidden');}
  function message(text,kind=''){const el=document.getElementById('li21Msg');if(!el)return;el.textContent=text||'';el.className=`li21-msg ${kind}`.trim();}

  function identityLabel(info){if(info.verification==='fiscal_code')return['Codice fiscale','Inserisci il tuo codice fiscale completo'];if(info.verification==='email')return['Email associata','Inserisci l’indirizzo email associato all’invito'];if(info.verification==='phone_last4')return['Ultime 4 cifre telefono','Inserisci le ultime 4 cifre del numero associato'];return['Verifica manuale','Contatta l’amministratore per completare l’attivazione'];}

  async function inspect(){
    state.token=tokenFromUrl().toLowerCase();const {data,error}=await db().rpc('learner_invite_public_info',{p_token:state.token});if(error)throw error;state.info=data||{};render();
  }

  function infoHtml(){const i=state.info||{};return `<div class="li21-info"><strong>${esc(i.first_name||'Corsista')} ${esc(i.last_name_initial||'')}</strong>${i.company_name?` · ${esc(i.company_name)}`:''}<br><span>Invito ${esc(i.delivery_channel||'personale')} · valido fino al ${i.expires_at?new Date(i.expires_at).toLocaleString('it-IT'):'—'}</span>${i.email_masked?`<br><span>Email: ${esc(i.email_masked)}</span>`:''}${i.phone_masked?`<br><span>Telefono: ${esc(i.phone_masked)}</span>`:''}</div>`;}

  async function hasSession(){const {data}=await db().auth.getSession();return data?.session||null;}

  async function render(){
    show();const body=document.getElementById('li21Body'),info=state.info||{},session=await hasSession();const [label,placeholder]=identityLabel(info);
    if(info.verification==='manual_review'){
      body.innerHTML=`${infoHtml()}<p>Questo invito non contiene abbastanza dati per una verifica automatica sicura. Contatta chi ti ha assegnato il corso.</p>`;return;
    }
    if(session?.user){
      body.innerHTML=`${infoHtml()}<p>Sei autenticato come <strong>${esc(session.user.email||'account')}</strong>. Verifica la tua identità per collegare questo account al profilo corsista.</p><form id="li21Claim" class="li21-form"><label>${esc(label)}<input id="li21Identity" autocomplete="off" required placeholder="${esc(placeholder)}"></label><div class="li21-actions"><button class="li21-primary" type="submit">Collega account e continua</button></div></form>`;body.querySelector('#li21Claim').onsubmit=claim;return;
    }
    body.innerHTML=`${infoHtml()}<p>Accedi con un account esistente oppure crea il tuo account SafetyTraining. Il link da solo non basta: dovrai anche superare la verifica identità.</p><div class="li21-tabs"><button id="li21SignupTab" class="${state.mode==='signup'?'active':''}">Nuovo account</button><button id="li21LoginTab" class="${state.mode==='login'?'active':''}">Ho già un account</button></div><form id="li21Auth" class="li21-form"><label>Email<input id="li21Email" type="email" autocomplete="email" required ${info.email_masked&&!info.email_required?'':' '} placeholder="nome@azienda.it"></label><label>Password<input id="li21Password" type="password" autocomplete="${state.mode==='signup'?'new-password':'current-password'}" minlength="${state.mode==='signup'?10:8}" required></label>${state.mode==='signup'?'<label>Conferma password<input id="li21Password2" type="password" autocomplete="new-password" minlength="10" required></label>':''}<label>${esc(label)}<input id="li21Identity" autocomplete="off" required placeholder="${esc(placeholder)}"></label><div class="li21-actions"><button class="li21-primary" type="submit">${state.mode==='signup'?'Crea account':'Accedi'} e continua</button></div><div class="li21-note">Per sicurezza il link è personale, monouso e può essere revocato dall’amministratore.</div></form>`;
    body.querySelector('#li21SignupTab').onclick=()=>{state.mode='signup';render();};body.querySelector('#li21LoginTab').onclick=()=>{state.mode='login';render();};body.querySelector('#li21Auth').onsubmit=authThenClaim;
  }

  async function claim(event){
    event?.preventDefault?.();if(state.busy)return;state.busy=true;message('Verifica e collegamento in corso…');const identity=document.getElementById('li21Identity')?.value||'';
    try{const {data,error}=await db().rpc('claim_learner_invite',{p_token:state.token,p_identity_value:identity});if(error)throw error;message('Account collegato correttamente.','ok');await finish(data);}catch(e){message(friendly(e?.message||e),'error');}finally{state.busy=false;}
  }

  async function authThenClaim(event){
    event.preventDefault();if(state.busy)return;state.busy=true;const email=document.getElementById('li21Email')?.value.trim().toLowerCase(),password=document.getElementById('li21Password')?.value||'',identity=document.getElementById('li21Identity')?.value||'';
    try{
      if(state.mode==='signup'){
        const confirm=document.getElementById('li21Password2')?.value||'';if(password.length<10)throw new Error('La password deve avere almeno 10 caratteri.');if(password!==confirm)throw new Error('Le due password non coincidono.');
        message('Creazione account…');const redirect=new URL(location.href);const {data,error}=await db().auth.signUp({email,password,options:{emailRedirectTo:redirect.toString()}});if(error)throw error;
        if(!data?.session){message('Controlla la tua email e conferma l’account. Poi riapri questo stesso link per completare l’attivazione.','ok');return;}
      }else{
        message('Accesso in corso…');const {error}=await db().auth.signInWithPassword({email,password});if(error)throw error;
      }
      message('Verifica identità…');const {data,error}=await db().rpc('claim_learner_invite',{p_token:state.token,p_identity_value:identity});if(error)throw error;message('Account attivato.','ok');await finish(data);
    }catch(e){message(friendly(e?.message||e),'error');}finally{state.busy=false;}
  }

  async function finish(){
    const onboarding=new URL(location.href).searchParams.get('onboarding')==='1';cleanToken(onboarding);document.getElementById('learnerInviteV21')?.classList.add('hidden');
    if(onboarding){window.setTimeout(()=>window.SAFETY_ONBOARDING?.show?.(),120);return;}
    window.setTimeout(()=>location.reload(),350);
  }

  function friendly(code){const map={invalid_invitation_token:'Link di invito non valido.',invitation_revoked:'Questo invito è stato revocato.',invitation_already_used:'Questo invito è già stato utilizzato.',invitation_expired:'Questo invito è scaduto.',identity_verification_failed:'I dati di verifica non coincidono.',invitation_email_mismatch:'Questo account email non corrisponde all’invito.',auth_account_already_linked:'Questo account è già collegato a un altro corsista.',learner_linked_to_other_account:'Questo corsista è già collegato a un altro account.'};return map[code]||String(code||'Impossibile completare l’attivazione.');}

  async function boot(){
    if(!requested())return;ensureUi();show();for(let i=0;i<50&&!db();i++)await new Promise(r=>setTimeout(r,120));if(!db())return message('Servizio di accesso non disponibile.','error');
    try{await inspect();}catch(e){message(friendly(e?.message||e),'error');document.getElementById('li21Body').innerHTML='<p>Non è possibile utilizzare questo link.</p>';}
    db()?.auth?.onAuthStateChange((event,session)=>{if(session?.user&&requested())window.setTimeout(()=>render(),120);});
  }

  window.SAFETY_LEARNER_INVITE_V21={inspect,show,version:'21.3'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
