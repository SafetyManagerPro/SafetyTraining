/* SafetyTraining v22.4 — selective removal plan. Simulation only; no destructive operations. */
(() => {
  'use strict';
  const MAX_ROWS = 80;
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const specs = Object.freeze({
    company: {title:'azienda',table:'companies',links:[
      ['Corsisti','learners','company_id','manual'],
      ['Edizioni','course_editions','company_id','manual'],
      ['Appartenenze organizzative','organization_memberships','company_id','manual'],
      ['Storico formativo','learner_company_training_history','company_id','protected'],
      ['Collegamenti integrazioni','integration_training_contexts','local_company_id','manual']]},
    learner: {title:'corsista',table:'learners',links:[
      ['Iscrizioni','enrollments','learner_id','enrollment'],
      ['Inviti','learner_account_invitations','learner_id','invitation'],
      ['Storico formativo','learner_company_training_history','learner_id','protected']]},
    edition: {title:'edizione',table:'course_editions',links:[
      ['Iscrizioni','enrollments','edition_id','enrollment'],
      ['Storico formativo','learner_company_training_history','edition_id','protected'],
      ['Collegamenti integrazioni','integration_training_contexts','local_edition_id','manual']]},
    enrollment: {title:'iscrizione',table:'enrollments',links:[
      ['Eventi didattici','learning_events','enrollment_id','protected'],
      ['Progressi','learning_progress','enrollment_id','protected'],
      ['Sessioni','learning_sessions','enrollment_id','protected'],
      ['Tentativi ai test','test_attempts','enrollment_id','protected'],
      ['Risposte ai test','question_attempts','enrollment_id','protected'],
      ['Evidenze requisiti','enrollment_requirement_evidence','enrollment_id','protected'],
      ['Valutazioni pratiche','enrollment_practice_assessments_v22','enrollment_id','protected'],
      ['Storico formativo','learner_company_training_history','enrollment_id','protected']]}
  });
  function unusedEnrollment(row){
    return row.status==='not_started' && Number(row.progress_pct||0)===0 &&
      Number(row.active_seconds||0)===0 && row.final_score_pct==null &&
      !row.started_at && !row.completed_at && !row.last_activity_at;
  }
  function classify(policy,row){
    if(policy==='protected')return 'protected';
    if(policy==='manual')return 'manual';
    if(policy==='enrollment')return unusedEnrollment(row)?'candidate':'protected';
    if(policy==='invitation')return ['revoked','failed'].includes(row.status)&&!row.auth_user_id?'candidate':'manual';
    return 'manual';
  }
  function classifyParent(kind,record){
    if(kind==='learner'&&record.auth_user_id)return 'account-linked';
    if(kind==='enrollment'&&!unusedEnrollment(record))return 'protected';
    return 'candidate';
  }
  function plan(groups,selected,withParent,parentType){
    const all=groups.flatMap(g=>g.entries);
    const candidates=all.filter(e=>e.category==='candidate');
    const blockers=all.filter(e=>e.category!=='candidate').length;
    const incomplete=groups.some(g=>g.error||g.truncated);
    const chosen=candidates.filter(e=>selected.has(e.key));
    const parentReady=parentType==='candidate'&&!blockers&&!incomplete&&chosen.length===candidates.length;
    return {candidateCount:candidates.length,selectedCount:chosen.length,blockers,
      incomplete,parentReady,deleteParent:!!withParent&&parentReady,
      choices:chosen.map(x=>({key:x.key,label:x.label,source:x.source}))};
  }
  // Supabase: not all relations have an "id" primary key.
  // Explicit column projection avoids fetching invitation secrets.
  const projections=Object.freeze({
    companies:'id,organization_id,name,active,created_at',
    learners:'id,organization_id,company_id,auth_user_id,first_name,last_name,email,active,created_at',
    course_editions:'id,organization_id,company_id,course_version_id,title,status,learning_mode,created_at',
    enrollments:'id,edition_id,learner_id,status,progress_pct,active_seconds,final_score_pct,last_activity_at,started_at,completed_at,enrolled_at',
    organization_memberships:'id,user_id,organization_id,company_id,role,active,updated_at',
    learner_company_training_history:'id,learner_id,company_id,edition_id,enrollment_id,source_system,created_at',
    integration_training_contexts:'source_system,external_project_id,local_company_id,local_edition_id,created_at,updated_at',
    learner_account_invitations:'id,learner_id,email,status,auth_user_id,accepted_at,sent_count,created_at',
    learning_events:'id,enrollment_id,event_type,occurred_at',
    learning_progress:'enrollment_id,unit_version_id,status,active_seconds,started_at,completed_at,updated_at',
    learning_sessions:'id,enrollment_id,started_at,ended_at,active_seconds',
    test_attempts:'id,enrollment_id,started_at,completed_at,score_pct,passed',
    question_attempts:'id,enrollment_id,answered_at,is_correct',
    enrollment_requirement_evidence:'id,enrollment_id,requirement_key,status,updated_at',
    enrollment_practice_assessments_v22:'id,enrollment_id,requirement_key,lab_key,status,updated_at'
  });
  function recordKey(table,row){
    if(table==='learning_progress'){
      if(!row.enrollment_id||!row.unit_version_id)return null;
      return JSON.stringify([table,row.enrollment_id,row.unit_version_id]);
    }
    if(table==='integration_training_contexts'){
      if(!row.source_system||!row.external_project_id)return null;
      return JSON.stringify([table,row.source_system,row.external_project_id]);
    }
    return row.id?JSON.stringify([table,row.id]):null;
  }
  function recordLabel(row,table){
    if(table==='learning_progress')return 'Unità '+String(row.unit_version_id||'—').slice(0,14)+' · '+String(row.status||'—');
    if(table==='integration_training_contexts')return (String(row.source_system||'—')+' · '+String(row.external_project_id||'—')).slice(0,150);
    const name=[row.first_name,row.last_name].filter(Boolean).join(' ');
    const value=row.name||name||row.title||row.email||row.requirement_key||row.event_type||row.status||row.id;
    return String(value||'Record').slice(0,110)+(row.id?' · '+String(row.id).slice(0,8):'');
  }
  async function scan(client,kind,id){
    const spec=specs[kind];if(!spec||!id)throw Error('Elemento non valido.');
    const main=await client.from(spec.table).select(projections[spec.table]).eq('id',id).maybeSingle();
    if(main.error)throw main.error;
    if(!main.data)throw Error('Elemento non trovato o non autorizzato.');
    const groups=await Promise.all(spec.links.map(async ([label,table,column,policy])=>{
      const columns=projections[table];
      if(!columns)return {label,table,column,entries:[],error:'Schema non configurato',truncated:true,count:null};
      const response=await client.from(table).select(columns,{count:'exact'}).eq(column,id).limit(MAX_ROWS+1);
      if(response.error)return {label,table,column,entries:[],error:response.error.message,truncated:true,count:null};
      const found=response.data||[],total=response.count;
      const badKey=found.some(row=>!recordKey(table,row));
      const truncated=found.length>MAX_ROWS||total==null||total>MAX_ROWS||badKey;
      const entries=found.slice(0,MAX_ROWS).flatMap(row=>{
        const key=recordKey(table,row);
        return key?[{key,source:table,id:row.id||null,
          label:recordLabel(row,table),category:truncated?'manual':classify(policy,row),
          details:safeDetails(row),learnerId:row.learner_id||null}]:[];
      });
      return {label,table,column,entries,error:badKey?'Identificativo composto incompleto':null,truncated,count:total};
    }));
    return {kind,id,spec,main:main.data,groups,parentType:classifyParent(kind,main.data)};
  }

  /* Only a compact, allowlisted set of fields is displayed.
     Never expose invitation hashes, credentials, internal metadata or raw JSON. */
  const detailFields=Object.freeze([
    ['id','Identificativo'],['name','Nome'],['title','Titolo'],
    ['unit_version_id','Versione unità'],['external_project_id','Progetto esterno'],
    ['source_system','Sistema origine'],['local_company_id','Azienda locale'],
    ['local_edition_id','Edizione locale'],['event_type','Tipo evento'],
    ['occurred_at','Data evento'],['role','Ruolo'],
    ['first_name','Nome'],['last_name','Cognome'],['email','Email'],
    ['status','Stato'],['active','Attivo'],['company_id','Azienda'],
    ['organization_id','Organizzazione'],['learner_id','Corsista'],
    ['edition_id','Edizione'],['course_version_id','Versione corso'],
    ['learning_mode','Modalità'],['progress_pct','Progresso (%)'],
    ['active_seconds','Tempo attivo (s)'],['final_score_pct','Esito (%)'],
    ['enrolled_at','Iscritto il'],['last_activity_at','Ultima attività'],
    ['accepted_at','Invito accettato'],['sent_count','Invii'],
    ['source_system','Provenienza'],['created_at','Creato il'],
    ['updated_at','Aggiornato il']
  ]);
  function safeDetails(row){
    return detailFields.filter(([k])=>row&&row[k]!=null&&row[k]!=='')
      .map(([key,label])=>({key,label,value:String(row[key]).slice(0,180)}));
  }
  function managementAction(table){
    const known={
      companies:{label:'Apri e modifica azienda',kind:'company'},
      learners:{label:'Apri e modifica corsista',kind:'learner'},
      course_editions:{label:'Apri e modifica edizione',kind:'edition'},
      enrollments:{label:'Vai all’iscrizione',kind:'enrollment'},
      learner_account_invitations:{label:'Gestisci inviti del corsista',kind:'invites'},
      organization_memberships:{label:'Apri ruoli amministrativi',kind:'memberships'}
    };
    return known[table]||null;
  }

  /* v22.4.2: decisions are admin intentions, never database authorizations.
     Explicitly distinguish FK constraints, preserved records, and sensitive cascades. */
  const nullableKeys=new Set([
    'learners:company_id','course_editions:company_id',
    'integration_training_contexts:local_company_id',
    'integration_training_contexts:local_edition_id'
  ]);
  const canUnlink=(table,column)=>nullableKeys.has(table+':'+column);
  const cascadeWarnings={
    enrollments:'Possibili presenze, test, progressi e verifiche collegate.',
    learner_company_training_history:'Storico formativo: ricostruire i riferimenti indiretti prima di eliminare.',
    learning_events:'Attività formativa registrata.',
    learning_sessions:'Tempi di frequenza registrati.',
    test_attempts:'Tentativi di verifica registrati.',
    question_attempts:'Risposte di verifica registrate.',
    enrollment_requirement_evidence:'Documentazione di requisiti collegata.',
    enrollment_practice_assessments_v22:'Valutazioni pratiche registrate.'
  };
  function intentPlan(groups,decisions,parentSelected,parentType){
    const all=groups.flatMap(g=>g.entries.map(e=>({...e,link:g.table,column:g.column})));
    const incomplete=groups.some(g=>g.error||g.truncated);
    const intents=all.map(e=>({...e,action:decisions.get(e.key)||'keep'}));
    const remove=intents.filter(e=>e.action==='delete');
    const unlink=intents.filter(e=>e.action==='unlink'&&canUnlink(e.link,e.column));
    const unresolved=intents.filter(e=>e.action==='keep'||(e.action==='unlink'&&!canUnlink(e.link,e.column)));
    const warnings=remove.filter(e=>e.category!=='candidate');
    const rootPossible=parentType!=='account-linked'&&!incomplete&&unresolved.length===0;
    return {remove,unlink,unresolved,warnings,incomplete,
      accountLinked:parentType==='account-linked',rootPossible,
      deleteParent:!!parentSelected&&rootPossible};
  }

  // An administrative plan is not authority to remove records. Only a versioned,
  // independently authorized server preview can authorize the final confirmation.
  const secondaryImpacts=Object.freeze({
    companies:'Le appartenenze organizzative possono essere eliminate in cascata.',
    learners:'Le iscrizioni e gli inviti collegati possono essere eliminati in cascata.',
    course_editions:'Le iscrizioni e lo storico collegati possono essere eliminati in cascata.',
    enrollments:'Possono essere eliminate presenze, eventi, progressi, test, risposte, documenti e storico.',
    learning_sessions:'Gli eventi della sessione possono essere eliminati; alcune risposte perdono il collegamento alla sessione.',
    test_attempts:'Le risposte in test_answers possono essere eliminate in cascata.'
  });
  function effectWarnings(info,effect){
    const targets=new Set(effect.remove.map(x=>x.source));
    if(effect.deleteParent)targets.add(info.spec.table);
    return [...targets].filter(table=>secondaryImpacts[table])
      .map(table=>({table,note:secondaryImpacts[table]}));
  }
  function executionPayload(info,effect){
    if(effect.incomplete||effect.accountLinked&&effect.deleteParent)throw Error('Controlli incompleti o account ancora collegato.');
    if(!effect.remove.length&&!effect.unlink.length&&!effect.deleteParent)throw Error('Non ci sono azioni da eseguire.');
    const actions=effect.remove.map(x=>({key:x.key,action:'delete'}))
      .concat(effect.unlink.map(x=>({key:x.key,action:'unlink'})));
    if(new Set(actions.map(x=>x.key)).size!==actions.length)throw Error('Selezione ambigua.');
    return {p_kind:info.kind,p_root_id:info.id,p_actions:actions,p_delete_parent:effect.deleteParent};
  }
  async function verifiedServerPreview(client,info,effect){
    const payload=executionPayload(info,effect);
    const capability=await client.rpc('admin_delete_capabilities_v25');
    if(capability.error||!capability.data||capability.data.version!=='v25'||capability.data.preview_ready!==true){
      throw Error('Il servizio server di eliminazione non è ancora installato o non è pronto. Nessun dato è stato modificato.');
    }
    const response=await client.rpc('admin_preview_deletion_v25',payload);
    if(response.error)throw Error('Verifica server non riuscita: '+response.error.message);
    const data=response.data;
    if(!data||data.version!=='v25'||!Array.isArray(data.impact)){
      throw Error('Il server non ha autorizzato un riepilogo completo. Nessun dato è stato modificato.');
    }
    return {payload,token:data.preview_token||null,impact:data.impact,ready:data.safe===true&&capability.data.ready===true&&data.execution_ready===true,warnings:data.warnings||[]};
  }
  function exactConfirmation(rootId){return 'ELIMINA '+rootId;}
  const categoryText={candidate:'Candidato',manual:'Da verificare / scollegare',protected:'Storico o verifiche: attenzione'};
  function open({kind,id,client,actorId,modal,closeModal,getActorId,openRecord,onDeleted}){
    if(!specs[kind]||!client||!actorId)return;
    const spec=specs[kind],selected=new Set(),decisions=new Map();
    let info=null,stage=0,wantParent=false,locked=false,inspected=null,serverPreview=null,previewError='';
    const overlay=modal('Gestione eliminazione · '+spec.title,
      '<div class="admin-delete-v24"><div class="admin-delete-steps">1. Selezione → 2. Riepilogo → 3. Conferma server</div>'+
      '<div id="adminDeletePlan" role="status" aria-live="polite">Analisi delle dipendenze…</div>'+
      '<div class="admin-delete-actions"><button type="button" data-plan-close>Chiudi</button></div></div>',
      {wide:true});
    const holder=overlay.querySelector('#adminDeletePlan');
    overlay.querySelector('[data-plan-close]').onclick=closeModal;
    const alive=()=>overlay.isConnected && getActorId()===actorId;
    function showSelection(){
      const effect=intentPlan(info.groups,decisions,wantParent,info.parentType);
      if(!effect.rootPossible)wantParent=false;
      const groups=info.groups.map(g=>{
        const warning=g.error?'Verifica non riuscita: '+g.error:g.truncated?'Record non completamente leggibili: controllo da completare.':'';
        const canDetach=canUnlink(g.table,g.column);
        return '<section class="admin-delete-group"><header><h3>'+esc(g.label)+'</h3><span>'+
          (g.count==null?'?':esc(g.count))+' record</span></header>'+
          (warning?'<p class="admin-delete-caution">'+esc(warning)+'</p>':'')+
          (cascadeWarnings[g.table]?'<p class="admin-delete-impact">'+esc(cascadeWarnings[g.table])+'</p>':'')+
          (g.entries.length?'<div class="admin-delete-entries">'+g.entries.map(e=>{
            const action=decisions.get(e.key)||'keep';
            return '<div class="admin-delete-decision"><div class="admin-delete-entry">'+
              '<span><strong>'+esc(e.label)+'</strong><small>'+esc(e.source)+'</small></span>'+
              '<em data-kind="'+esc(e.category)+'">'+esc(categoryText[e.category])+'</em></div>'+
              '<label class="admin-delete-choice">Azione desiderata'+
              '<select data-plan-choice="'+esc(e.key)+'" aria-label="Azione per '+esc(e.label)+'">'+
              '<option value="keep"'+(action==='keep'?' selected':'')+'>Conserva</option>'+
              '<option value="delete"'+(action==='delete'?' selected':'')+'>Elimina</option>'+
              (canDetach?'<option value="unlink"'+(action==='unlink'?' selected':'')+'>Scollega (conserva il record)</option>':'')+
              '</select></label><button type="button" class="admin-delete-detail-trigger" data-plan-inspect="'+
              esc(e.key)+'">Apri / modifica / gestisci →</button></div>';
          }).join('')+'</div>':'<p class="admin-delete-empty">Nessun collegamento diretto.</p>')+'</section>';
      }).join('');
      holder.innerHTML='<h3>1 · Scegli l’azione per ogni dipendenza</h3>'+
        '<p>La decisione spetta all’amministratore, per qualunque corso. Le etichette di rischio non impediscono di pianificare «Elimina»: segnalano gli elementi indiretti da esaminare.</p>'+
        '<div class="admin-delete-toolbar"><button type="button" data-plan-all>Imposta Elimina per tutte le voci caricate</button>'+
        '<button type="button" data-plan-none>Imposta Conserva per tutte</button></div>'+groups+
        '<div class="admin-delete-parent"><label><input type="checkbox" data-plan-parent'+
        (effect.rootPossible?'':' disabled')+(wantParent&&effect.rootPossible?' checked':'')+
        '> Includi anche '+esc(spec.title)+' principale</label>'+
        '<small>'+(effect.accountLinked?'Prima va gestito anche l’account collegato.':
         effect.incomplete?'Esistono controlli incompleti.':
         effect.rootPossible?'Tutte le dipendenze visibili hanno un’azione che permetterebbe la rimozione.':
         'Per rimuovere il record principale devi scegliere cosa eliminare o scollegare per ogni dipendenza.')+
        '</small></div>'+
        '<p class="admin-delete-totals">Da eliminare: '+effect.remove.length+
        ' · Da scollegare: '+effect.unlink.length+
        ' · Da risolvere: '+effect.unresolved.length+
        ' · Elementi delicati: '+effect.warnings.length+'</p>'+
        '<p class="admin-delete-caution">La scelta non effettua nessuna operazione. Prima di una cancellazione reale saranno necessari l’elenco completo degli effetti a cascata, i controlli del server e una conferma esplicita.</p>'+
        '<div class="admin-delete-actions"><button type="button" data-plan-close>Chiudi</button>'+
        '<button type="button" data-plan-next'+((effect.remove.length||effect.unlink.length||wantParent&&effect.rootPossible)?'':' disabled')+
        '>Riepilogo delle scelte →</button></div>';
    }
    function showDetails(){
      if(!inspected){stage=0;showSelection();return;}
      const action=managementAction(inspected.source);
      const rows=(inspected.details||[]).map(x=>
        '<div class="admin-delete-field"><dt>'+esc(x.label)+'</dt><dd>'+esc(x.value)+'</dd></div>').join('');
      const explanation=inspected.category==='protected'?
        'Questa voce contiene attività o storico: puoi proporne l’eliminazione, ma occorre visualizzare tutti gli effetti indiretti prima della conferma.' :
        inspected.category==='manual'?
        'Il collegamento richiede una verifica. Apri la scheda per modificarlo o scollegarlo con la procedura ordinaria, se prevista.' :
        'La voce è un possibile candidato, non un’autorizzazione alla cancellazione. La verifica definitiva resta server-side.';
      holder.innerHTML='<div class="admin-delete-detail"><h3 tabindex="-1">Dettaglio collegamento</h3>'+
        '<p><strong>'+esc(inspected.label)+'</strong></p>'+
        '<p><span class="admin-badge">'+esc(categoryText[inspected.category])+'</span></p>'+
        '<dl>'+rows+'</dl>'+
        '<p class="admin-delete-caution">'+esc(explanation)+'</p>'+
        (action?'<p>Puoi proseguire nella schermata amministrativa dedicata. Modificare o scollegare non equivale a eliminare.</p>':
          '<p>Per questo dato non è disponibile una modifica diretta: mantienilo o verifica la procedura amministrativa appropriata.</p>')+
        '<div class="admin-delete-actions"><button type="button" data-plan-detail-back>← Torna alle dipendenze</button>'+
        (action?'<button type="button" data-plan-manage>'+esc(action.label)+'</button>':'')+
        '<button type="button" data-plan-close>Chiudi</button></div></div>';
      holder.querySelector('h3')?.focus();
    }
    function showReview(){
      const effect=intentPlan(info.groups,decisions,wantParent,info.parentType);
      const rows=effect.remove.map(e=>({...e,action:'Elimina'}))
        .concat(effect.unlink.map(e=>({...e,action:'Scollega'})));
      const impacts=effectWarnings(info,effect);
      const canReview=!effect.incomplete&&!(effect.accountLinked&&effect.deleteParent)&&
        (effect.remove.length||effect.unlink.length||effect.deleteParent);
      holder.innerHTML='<h3>2 · Riepilogo prima della verifica server</h3>'+
        '<p>Eliminazioni richieste: <strong>'+effect.remove.length+'</strong> · Scollegamenti richiesti: <strong>'+
        effect.unlink.length+'</strong> · Dipendenze conservate: <strong>'+effect.unresolved.length+'</strong></p>'+
        '<ul class="admin-delete-review">'+rows.map(e=>
          '<li><strong>'+esc(e.action)+'</strong> · '+esc(e.label)+' <small>('+esc(e.source)+')</small></li>').join('')+'</ul>'+
        '<p>Record principale: <strong>'+(effect.deleteParent?'Incluso nel piano':'Conservato')+'</strong></p>'+
        '<p>Voci delicate selezionate: '+effect.warnings.length+'; verifiche incomplete: '+(effect.incomplete?'sì':'no')+'.</p>'+
        (impacts.length?'<div class="admin-delete-caution"><strong>Ulteriori effetti possibili (ancora da verificare dal server)</strong>'+
          '<ul>'+impacts.map(x=>'<li>'+esc(x.table)+': '+esc(x.note)+'</li>').join('')+'</ul></div>':'')+
        '<p>Il backup locale è stato generato, ma non ne è stato collaudato il ripristino. Una cancellazione può essere irreversibile.</p>'+
        '<div class="admin-delete-caution">La conferma richiede un controllo aggiuntivo direttamente sul server: autorizzazioni, selezione, relazioni indirette ed effetti a cascata. La disponibilità di questo servizio non viene presunta.</div>'+
        (previewError?'<p class="admin-delete-caution" role="alert">'+esc(previewError)+'</p>':'')+
        '<div class="admin-delete-actions"><button type="button" data-plan-back>← Modifica scelte</button>'+
        '<button type="button" data-plan-server-review'+(canReview?'':' disabled')+'>Verifica eliminazione sul server →</button>'+
        '<button type="button" data-plan-close>Chiudi</button></div>';
    }
    function showServerConfirmation(){
      if(!serverPreview){stage=1;showReview();return;}
      holder.innerHTML='<h3>3 · Verifica server delle dipendenze</h3>'+
        '<p>Supabase ha controllato le voci selezionate e le relazioni dirette visibili. I conteggi diretti e indiretti sono indicativi e limitati ai record visibili dalle policy RLS. Non autorizzano una cancellazione definitiva.</p>'+
        '<ul class="admin-delete-review">'+serverPreview.impact.map(x=>
          '<li>'+esc(x.label||x.table||'Dipendenza')+' · '+esc(x.action||'Da eliminare')+
          ' · '+esc(x.count??'Numero non disponibile')+'</li>').join('')+'</ul>'+
        (serverPreview.warnings?.length?'<div class="admin-delete-caution"><strong>Avvisi del server</strong><ul>'+serverPreview.warnings.map(w=>'<li>'+esc(w)+'</li>').join('')+'</ul></div>':'')+
        '<p><strong>'+(serverPreview.ready?'Operazione irreversibile: conferma richiesta.':'Solo anteprima: la cancellazione definitiva non è installata.')+'</strong></p>'+
        (serverPreview.ready?'<label class="admin-delete-confirm">Per confermare scrivi esattamente '+
        '<code>'+esc(exactConfirmation(info.id))+'</code>'+
        '<input type="text" data-plan-confirm autocomplete="off" spellcheck="false" aria-label="Conferma eliminazione"></label>':'')+
        (previewError?'<p role="alert" class="admin-delete-caution">'+esc(previewError)+'</p>':'')+
        '<div class="admin-delete-actions"><button type="button" data-plan-back>← Torna al riepilogo</button>'+
        (serverPreview.ready?'<button type="button" data-plan-execute disabled>Conferma eliminazione definitiva</button>':'')+
        '<button type="button" data-plan-close>Chiudi</button></div>';
    }
    async function verifyServer(){
      if(locked||!info||!alive())return;
      const effect=intentPlan(info.groups,decisions,wantParent,info.parentType);
      serverPreview=null;previewError='';locked=true;
      holder.innerHTML='<p role="status">Verifica dei permessi e delle dipendenze sul server…</p>';
      try {
        const result=await verifiedServerPreview(client,info,effect);
        if(!alive())return;
        serverPreview=result;stage=3;
      } catch(error){
        if(!alive())return;
        stage=1;previewError=error?.message||String(error);
      } finally {
        locked=false;
        if(alive())redraw();
      }
    }
    async function executeConfirmed(){
      if(!serverPreview?.ready||!serverPreview.token||!alive()||locked)return;
      const input=holder.querySelector('[data-plan-confirm]');
      if(input?.value!==exactConfirmation(info.id))return;
      const snapshot=serverPreview;locked=true;
      holder.innerHTML='<p role="status">Richiesta di eliminazione in corso. Non chiudere questa finestra.</p>';
      try {
        if(!alive())return;
        const reply=await client.rpc('admin_execute_deletion_v25',{
          ...snapshot.payload,p_preview_token:snapshot.token,p_confirmation:exactConfirmation(info.id)
        });
        if(reply.error)throw reply.error;
        if(!reply.data||reply.data.executed!==true)throw Error('Il server non ha attestato il completamento.');
        if(!alive())return;
        closeModal();
        if(typeof onDeleted==='function')await onDeleted(reply.data);
      } catch(error){
        if(!alive())return;
        previewError='Operazione non confermata: '+(error?.message||String(error))+
          '. Verifica lo stato prima di riprovare.';
        serverPreview=null;stage=1;locked=false;redraw();
      }
    }
    function redraw(){if(!alive()||!info||locked)return;if(stage===0)showSelection();else if(stage===1)showReview();else if(stage===3)showServerConfirmation();else showDetails();}
    overlay.addEventListener('click',e=>{
      if(e.target.closest('[data-plan-close]')){closeModal();return;}
      if(!info||locked)return;
      const inspect=e.target.closest('[data-plan-inspect]');
      if(inspect){
        inspected=info.groups.flatMap(g=>g.entries).find(x=>x.key===inspect.dataset.planInspect)||null;
        if(inspected){stage=2;redraw();}return;
      }
      if(e.target.closest('[data-plan-detail-back]')){inspected=null;stage=0;redraw();return;}
      if(e.target.closest('[data-plan-server-review]')){void verifyServer();return;}
      if(e.target.closest('[data-plan-execute]')){void executeConfirmed();return;}
      if(e.target.closest('[data-plan-manage]')){
        if(!inspected||typeof openRecord!=='function')return;
        const action=managementAction(inspected.source);
        if(action){Promise.resolve(openRecord(action.kind,inspected.id,inspected.learnerId))
          .catch(error=>{if(alive())holder.insertAdjacentHTML('beforeend',
            '<p class="admin-delete-caution">'+esc(error?.message||error)+'</p>');});}
        return;
      }
      if(e.target.closest('[data-plan-all]')){
        info.groups.forEach(g=>g.entries.forEach(x=>decisions.set(x.key,'delete')));
        wantParent=false;redraw();
      }else if(e.target.closest('[data-plan-none]')){decisions.clear();wantParent=false;redraw();}
      else if(e.target.closest('[data-plan-next]')){stage=1;redraw();}
      else if(e.target.closest('[data-plan-back]')){serverPreview=null;previewError='';stage=stage===3?1:0;redraw();}
    });
    overlay.addEventListener('input',e=>{
      if(!info||locked)return;
      const confirmation=e.target.closest('[data-plan-confirm]');
      if(confirmation){const submit=holder.querySelector('[data-plan-execute]');if(submit)submit.disabled=confirmation.value!==exactConfirmation(info.id);}
    });
    overlay.addEventListener('change',e=>{
      if(!info||locked)return;
      const confirmation=e.target.closest('[data-plan-confirm]');
      if(confirmation){const submit=holder.querySelector('[data-plan-execute]');if(submit)submit.disabled=confirmation.value!==exactConfirmation(info.id);return;}
      const choice=e.target.closest('[data-plan-choice]');
      if(choice){
        const key=choice.dataset.planChoice;
        const group=info.groups.find(g=>g.entries.some(x=>x.key===key));
        if(group){
          if(choice.value==='delete')decisions.set(key,'delete');
          else if(choice.value==='unlink'&&canUnlink(group.table,group.column))decisions.set(key,'unlink');
          else decisions.delete(key);
        }
        wantParent=false;serverPreview=null;previewError='';redraw();return;
      }
      if(e.target.matches('[data-plan-parent]')){
        const effect=intentPlan(info.groups,decisions,false,info.parentType);
        wantParent=effect.rootPossible&&e.target.checked;serverPreview=null;previewError='';redraw();
      }
    });
    scan(client,kind,id).then(result=>{
      if(!alive())return;
      info=result;showSelection();
    }).catch(error=>{
      if(!alive())return;
      locked=true;
      holder.innerHTML='<h3>Verifica non disponibile</h3><p>'+esc(error?.message||error)+'</p>'+
        '<p>Operazione bloccata senza modifiche al database.</p>';
    });
  }
  window.SAFETY_ADMIN_DELETE_PLANNER_V22={open,specs,classify,unusedEnrollment,plan,intentPlan,canUnlink,scan,classifyParent,safeDetails,managementAction,recordKey,projections,effectWarnings,executionPayload,verifiedServerPreview,exactConfirmation};
})();
