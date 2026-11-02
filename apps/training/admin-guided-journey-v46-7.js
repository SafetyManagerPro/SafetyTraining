/* SafetyTraining v46.7 — one guided entry point, read-only learner journey.
 * Pure status interpretation; all writes remain in the existing authorized wizard.
 * Digital completion != formal certification or validation of practical requirements. */
(()=>{'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const label={done:'Registrato',todo:'Da fare',wait:'In attesa',now:'In corso',warn:'Da verificare'};
 const namedStatus=s=>({not_started:'Da iniziare',in_progress:'In corso',completed:'Completato',passed:'Superato',failed:'Non superato',revoked:'Revocato'})[s]||'Da verificare';
 const numeric=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const safeDate=v=>{if(!v)return null;const ms=new Date(v).getTime();return Number.isFinite(ms)?ms:null;};
 const namedDate=v=>v&&safeDate(v)!==null?new Date(v).toLocaleDateString('it-IT'):'—';
 const scopeMatches=(learner,edition,companyId,orgId)=>!!(learner&&learner.active===true&&
   learner.company_id===companyId&&learner.organization_id===orgId&&edition&&
   edition.organization_id===orgId&&(!edition.company_id||edition.company_id===companyId));
 const steps=[
  ['registry','Azienda e corsista'],
  ['edition','Corso ed edizione'],
  ['enrollment','Iscrizione'],
  ['account','Invito e account'],
  ['availability','Accesso al corso'],
  ['attendance','Frequenza'],
  ['verification','Verifiche finali']
 ];
 function describe({learner,edition,enrollment,invitation,now=Date.now()}){
  if(!learner||!edition)throw Error('Contesto formativo incompleto.');
  const e=enrollment||null,inv=invitation||null;
  const enrolled=!!e&&e.status!=='revoked';
  const linked=!!learner.auth_user_id;
  const started=!!e&&(numeric(e.active_seconds)>0||numeric(e.progress_pct)>0||!!e.started_at||
    ['in_progress','completed','passed','failed'].includes(e.status));
  const complete=!!e&&['completed','passed'].includes(e.status);
  const progress=Math.min(100,numeric(e?.progress_pct));
  const minutes=Math.floor(numeric(e?.active_seconds)/60);
  const from=safeDate(edition.available_from),until=safeDate(edition.available_until);
  const editionOpen=edition.status==='open';
  const inWindow=(from===null||now>=from)&&(until===null||now<=until);
  const dateMessage=from!==null&&now<from?'Disponibile dal '+namedDate(edition.available_from):
    until!==null&&now>until?'Periodo di accesso terminato il '+namedDate(edition.available_until):
    'Periodo di accesso attivo';
  const invited=inv?.status==='sent';
  const inviteError=inv?.status==='failed'||inv?.status==='revoked';
  const accessStatus=linked?'done':invited?'wait':inviteError?'warn':'todo';
  const accountDescription=linked?'Account collegato':
    invited?'Invito inviato; verificare l’attivazione':
    inviteError?'Invito non riuscito o revocato':
    !learner.email?'Email mancante (possibile link personale alternativo)':'Invito non ancora confermato';
  const checks=e?.final_score_pct!==null&&e?.final_score_pct!==undefined;
  const items=[
   {key:'registry',name:steps[0][1],status:'done',detail:'Anagrafica aziendale presente e corsista attivo'},
   {key:'edition',name:steps[1][1],status:editionOpen?'done':'warn',detail:editionOpen?'Edizione aperta':'Edizione non aperta'},
   {key:'enrollment',name:steps[2][1],status:!e?'todo':enrolled?'done':'warn',
    detail:!e?'Iscrizione non ancora registrata':enrolled?'Iscrizione registrata':'Iscrizione revocata'},
   {key:'account',name:steps[3][1],status:accessStatus,detail:accountDescription},
   {key:'availability',name:steps[4][1],status:!enrolled?'todo':!editionOpen?'warn':!inWindow?'wait':linked?'done':'wait',
    detail:!enrolled?'Prima completare l’iscrizione':!editionOpen?'Verificare lo stato dell’edizione':
     !inWindow?dateMessage:linked?'Accesso disponibile secondo le date dell’edizione':'In attesa di attivazione account'},
   {key:'attendance',name:steps[5][1],status:!enrolled?'todo':complete?'done':started?'now':'todo',
    detail:!enrolled?'Iscrizione mancante':complete?'Percorso digitale con stato '+namedStatus(e.status):
     started?'Avanzamento '+Math.round(progress)+'% · '+minutes+' minuti attivi':'Nessuna frequenza registrata'},
   {key:'verification',name:steps[6][1],status:!enrolled?'todo':e.status==='failed'?'warn':
    complete?'now':checks?'now':'todo',
    detail:!enrolled?'Prima completare l’iscrizione':e.status==='failed'?'Verifica non superata: controllare il percorso':
     complete?'Stato digitale '+namedStatus(e.status)+'; validare pratica, evidenze e attestato':
     checks?'Punteggio digitale presente ('+numeric(e.final_score_pct)+'%); verificare requisiti':
     'Esiti, requisiti pratici e attestato ancora da verificare'}
  ];
  let next='Controlla iscrizione e corso',action='go-enrollments';
  if(!e){next='Conferma l’iscrizione dalla sequenza guidata';action='back-to-learners';}
  else if(!enrolled){next='Verifica o riattiva l’iscrizione revocata';}
  else if(!editionOpen){next='Verifica lo stato dell’edizione';}
  else if(!linked){
    next=!learner.email?'Completa i recapiti oppure crea un link personale':
      inviteError?'Verifica e riprova l’invito':
      invited?'Controlla se il corsista ha attivato l’account':'Invia un invito personale al corsista';
    action='go-access';
  }else if(!inWindow){next=dateMessage+' — verifica le date dell’edizione';action='go-enrollments';}
  else if(e.status==='failed'){next='Controlla la verifica non superata';action='go-control';}
  else if(complete){next='Verifica requisiti pratici, evidenze e attestato prima della chiusura';action='go-control';}
  else if(!started){next='Invita il corsista ad aprire il corso; controlla il primo accesso';action='go-control';}
  else {next='Controlla frequenza, avanzamento e requisiti ancora da completare';action='go-control';}
  return {learnerId:learner.id,enrollmentId:e?.id||'',steps:items,next,action,
   courseStatus:namedStatus(e?.status),progress,minutes,hasRecordedScore:checks,
   score:checks?numeric(e.final_score_pct):null,completedDigital:complete,
   recordedAt:e?.enrolled_at||null};
 }
 async function read(client,{editionId,learners}){
  if(!client||!editionId||!Array.isArray(learners))throw Error('Seleziona prima un’edizione e i corsisti.');
  const ids=[...new Set(learners.map(l=>l?.id).filter(Boolean))];
  if(!ids.length||ids.length>500)throw Error('Seleziona da 1 a 500 corsisti per il controllo.');
  const [enrollmentResult,inviteResult]=await Promise.all([
   client.from('enrollments')
    .select('id,learner_id,edition_id,status,progress_pct,active_seconds,final_score_pct,enrolled_at,started_at,last_activity_at,completed_at')
    .eq('edition_id',editionId).in('learner_id',ids),
   client.from('learner_account_invitations')
    .select('learner_id,status,last_sent_at,accepted_at,last_error')
    .in('learner_id',ids)
  ]);
  if(enrollmentResult.error)throw enrollmentResult.error;
  const enrollmentMap=new Map((enrollmentResult.data||[]).map(x=>[x.learner_id,x]));
  const inviteMap=new Map((inviteResult.error?[]:inviteResult.data||[]).map(x=>[x.learner_id,x]));
  return {enrollments:enrollmentMap,invites:inviteMap,
   inviteNotice:inviteResult.error?'Stato degli inviti non consultabile. Verificalo da Accessi & import.':''};
 }
 const info=(st)=>st==='done'?'✓':st==='now'?'◉':st==='warn'?'!':st==='wait'?'◷':'○';
 function render({learners=[],edition=null,snapshot=null,companyId='',orgId=''}){
  if(!snapshot||!edition)return '<p class="gw-note">Seleziona un’edizione e i corsisti per leggere lo stato dal database.</p>';
  let overview=[];
  for(const learner of learners){
   if(!scopeMatches(learner,edition,companyId,orgId))continue;
   const detail=describe({learner,edition,enrollment:snapshot.enrollments.get(learner.id)||null,
    invitation:snapshot.invites.get(learner.id)||null});
   overview.push({learner,detail});
  }
  const enrolled=overview.filter(x=>x.detail.enrollmentId).length,
    completed=overview.filter(x=>x.detail.completedDigital).length,
    awaiting=overview.filter(x=>x.detail.steps.find(s=>s.key==='account')?.status!=='done').length;
  const summary='<div class="gw-journey-stats"><div><strong>'+overview.length+'</strong><span>Corsisti selezionati</span></div>'+
   '<div><strong>'+enrolled+'</strong><span>Iscrizioni rilevate (incluse revocate)</span></div>'+
   '<div><strong>'+awaiting+'</strong><span>Account da verificare</span></div>'+
   '<div><strong>'+completed+'</strong><span>Stato digitale concluso (non attestato)</span></div></div>';
  const cards=overview.map(({learner,detail})=>{
   const title=[learner.last_name,learner.first_name].filter(Boolean).join(' ')||'Corsista';
   const summaryText=detail.enrollmentId?'Iscrizione '+detail.courseStatus+' · '+Math.round(detail.progress)+'% · '+detail.minutes+' min attivi':
    'Nessuna iscrizione per questa edizione';
   return '<article class="gw-journey-card"><div class="gw-journey-title"><div><h4>'+esc(title)+'</h4><p>'+esc(summaryText)+'</p></div>'+
     '<span class="gw-journey-overall">'+esc(detail.completedDigital?'Digitale concluso':'Da seguire')+'</span></div>'+
     '<ol class="gw-journey-steps">'+detail.steps.map((step,i)=>'<li class="gw-journey-'+esc(step.status)+'">'+
       '<span class="gw-journey-icon" aria-hidden="true">'+info(step.status)+'</span><div><strong>'+(i+1)+'. '+esc(step.name)+'</strong>'+
       '<small>'+esc(step.detail)+'</small></div><span class="gw-journey-state">'+esc(label[step.status])+'</span></li>').join('')+'</ol>'+
     '<div class="gw-journey-next"><strong>Prossima azione</strong><p>'+esc(detail.next)+'</p>'+
     '<button type="button" data-gw="'+esc(detail.action)+'">'+esc(detail.action==='go-access'?'Apri Accessi & import':
       detail.action==='go-control'?'Apri Controllo operativo':
       detail.action==='back-to-learners'?'Torna alla selezione':'Apri Iscrizioni')+'</button></div></article>';
  }).join('');
  return summary+(snapshot.inviteNotice?'<p class="gw-warning">'+esc(snapshot.inviteNotice)+'</p>':'')+
   '<p class="gw-journey-legal">Gli stati derivano da iscrizioni, account e attività registrate. Il completamento digitale non equivale a idoneità pratica, frequenza certificata o attestato rilasciato.</p>'+
   '<div class="gw-journey-cards">'+(cards||'<p class="gw-warning">Nessun corsista disponibile nel perimetro selezionato.</p>')+'</div>';
 }
 window.SAFETY_GUIDED_JOURNEY_V46_7={describe,read,render,scopeMatches,steps,version:'v46.7'};
})();
