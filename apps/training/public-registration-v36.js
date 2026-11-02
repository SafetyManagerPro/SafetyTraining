/* Public self-registration: an edition request requires admin approval. */
(()=>{'use strict';
 const token=new URL(location.href).searchParams.get('registration');
 if(!token)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const client=()=>window.SAFETY_CLOUD?.state?.client;
 let busy=false;
 const root=document.createElement('section');
 root.id='safetyPublicRegistration';
 root.setAttribute('aria-label','Iscrizione pubblica SafetyTraining');
 root.innerHTML='<main class="spr-card"><div class="spr-kicker">SAFETY TRAINING · ISCRIZIONI</div><h1>Richiedi iscrizione</h1><div id="sprContent" role="status">Caricamento del corso…</div></main>';
 const styles=document.createElement('style');styles.textContent=[
 '#safetyPublicRegistration{position:fixed;inset:0;z-index:25000;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:clamp(12px,4vw,36px);background:#071221;color:#183047;font:inherit}',
 '#safetyPublicRegistration .spr-card{background:#fff;width:min(620px,100%);margin:4vh auto;padding:clamp(20px,4vw,38px);border-radius:18px;box-shadow:0 15px 70px #0006}',
 '.spr-kicker{color:#087c64;font-size:13px;font-weight:900;letter-spacing:.1em}.spr-card h1{color:#142f48;margin:9px 0 15px;font-size:clamp(26px,4vw,36px)}',
 '.spr-course{background:#edf7f5;border:1px solid #c5e3d9;border-radius:12px;padding:16px;margin:15px 0;font-weight:700}',
 '.spr-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.spr-fields label{display:grid;gap:5px;font-size:13px;font-weight:750}',
 '.spr-fields input{width:100%;min-width:0;border:1px solid #a5b7c4;border-radius:8px;font-size:16px;padding:11px;color:#102639;background:#fff}',
 '.spr-wide{grid-column:1/-1}.spr-privacy{margin:18px 0;display:flex;align-items:start;gap:9px;font-size:13px;line-height:1.5}',
 '.spr-privacy input{margin-top:4px}.spr-submit{display:block;width:100%;background:#147d63;color:white;border:0;border-radius:10px;padding:13px;font-size:16px;font-weight:800;cursor:pointer}',
 '.spr-submit:disabled{opacity:.55;cursor:default}.spr-error{color:#a72e2e;font-weight:700}.spr-good{color:#14634e;font-weight:750}',
 '.spr-small{font-size:12px;line-height:1.55;color:#506579}.spr-honeypot{position:absolute!important;left:-12000px!important}',
 '@media(max-width:500px){.spr-fields{grid-template-columns:1fr}.spr-wide{grid-column:auto}}'
 ].join('');document.head.appendChild(styles);
 (document.body||document.documentElement).appendChild(root);
 const content=root.querySelector('#sprContent');
 const renderUnavailable=()=>{content.innerHTML='<p class="spr-error">Questo link non è disponibile o è scaduto.</p><p class="spr-small">Richiedi all’organizzatore un nuovo link o QR code d’iscrizione. Il vecchio QR potrebbe essere stato rigenerato.</p>';};
 const friendlyError=error=>{
  const code=String(error?.message||error||'');
  if(/invalid_or_expired_link|link.*expired/i.test(code))return 'Il QR o il link non è più valido. Richiedi all’organizzatore un nuovo codice.';
  if(/registration_limit_reached/i.test(code))return 'Troppe richieste per questa edizione: contatta l’organizzatore.';
  if(/privacy_acknowledgement_required/i.test(code))return 'Per continuare devi accettare l’informativa privacy.';
  if(/invalid_registration_fields/i.test(code))return 'Controlla nome, cognome e indirizzo email.';
  if(/failed to fetch|network|timeout/i.test(code))return 'Impossibile contattare il servizio: verifica la connessione e prova ad aggiornare.';
  return 'Non è stato possibile registrare la richiesta. Contatta l’organizzatore e indica l’errore visualizzato.';
 };

 async function boot(){
  if(!/^[a-f0-9]{48}$/.test(token)){renderUnavailable();return;}
  for(let i=0;i<50&&!client();i++)await new Promise(r=>setTimeout(r,150));
  if(!client()){content.innerHTML='<p class="spr-error">Servizio temporaneamente non disponibile. Ricarica la pagina.</p>';return;}
  try{
   const {data,error}=await client().rpc('public_registration_info_v36',{p_token:token});
   if(error)throw error;
   if(!data?.available){renderUnavailable();return;}
   content.innerHTML='<div class="spr-course">'+esc(data.course_title)+'<div class="spr-small">'+esc(data.edition_title)+'</div></div>'+
    '<p>Inserisci i dati per <strong>richiedere l’iscrizione tramite QR o link pubblico</strong>. La richiesta deve essere approvata dall’organizzatore: non attiva subito il corso e non genera un account.</p>'+
    '<p class="spr-small"><strong>Email:</strong> il sistema non invia un’email automatica al momento della richiesta. Dopo l’approvazione l’organizzatore avvia l’email personale di attivazione. Per confermare la ricezione della richiesta, contatta l’organizzatore.</p>'+
    '<form id="sprForm" autocomplete="on"><div class="spr-fields">'+
    '<label>Nome *<input name="first_name" maxlength="90" minlength="2" autocomplete="given-name" required></label>'+
    '<label>Cognome *<input name="last_name" maxlength="90" minlength="2" autocomplete="family-name" required></label>'+
    '<label class="spr-wide">Email *<input name="email" type="email" maxlength="254" autocomplete="email" required></label>'+
    '<label>Telefono (facoltativo)<input name="phone" type="tel" maxlength="32" autocomplete="tel"></label>'+
    '<label>Codice fiscale (facoltativo)<input name="fiscal_code" maxlength="16" autocomplete="off"></label>'+
    '<label class="spr-honeypot" aria-hidden="true">Sito web<input name="website" tabindex="-1" autocomplete="off"></label></div>'+
    '<label class="spr-privacy"><input type="checkbox" name="privacy" required><span>Confermo di aver letto queste informazioni: i dati inseriti saranno usati dall’organizzatore per gestire la mia richiesta di iscrizione al corso. L’invio non comporta l’ammissione automatica. Per dettagli sul trattamento, sui tempi di conservazione e sui diritti privacy, rivolgersi all’organizzatore.</span></label>'+
    '<button class="spr-submit" type="submit">Invia richiesta d’iscrizione</button><p id="sprFeedback" role="alert"></p></form>'+
    '<p class="spr-small">* Campi obbligatori. Non inviare dati di altre persone senza autorizzazione.</p>';
   const form=content.querySelector('#sprForm');
   form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;busy=true;
    const button=form.querySelector('.spr-submit'),feedback=form.querySelector('#sprFeedback');button.disabled=true;button.textContent='Invio richiesta…';feedback.textContent='';
    try{
     const f=new FormData(form);
     const {data,error}=await client().rpc('public_registration_submit_v36',{
      p_token:token,p_first_name:String(f.get('first_name')||''),p_last_name:String(f.get('last_name')||''),
      p_email:String(f.get('email')||''),p_phone:String(f.get('phone')||''),
      p_fiscal_code:String(f.get('fiscal_code')||''),p_privacy_acknowledged:f.has('privacy'),p_website:String(f.get('website')||'')
     });
     if(error)throw error;
     if(data?.status!=='received')throw Error('Risposta del servizio inattesa.');
     content.innerHTML='<div class="spr-course spr-good"><h2>Richiesta ricevuta dal sistema</h2><p>La richiesta è stata acquisita o era già stata inviata: <strong>non significa che il corso sia attivo.</strong></p></div>'+
      '<p><strong>Prossimo passaggio:</strong> l’organizzatore verifica i dati e approva l’iscrizione. Soltanto dopo l’approvazione il sistema tenta di inviare l’email di attivazione. Controlla anche la cartella Spam.</p>'+
      '<p class="spr-small">Se non ricevi informazioni, contatta l’organizzatore indicando il corso e il tuo indirizzo email. Non ripetere la richiesta: l’invio duplicato non crea una nuova iscrizione.</p>';
    }catch(error){feedback.className='spr-error';feedback.textContent=friendlyError(error);button.disabled=false;button.textContent='Riprova richiesta';}
    finally{busy=false;}
   });
  }catch(error){content.innerHTML='<p class="spr-error">Impossibile aprire il modulo. '+esc(error?.message||error)+'</p>';}
 }
 void boot();
})();
