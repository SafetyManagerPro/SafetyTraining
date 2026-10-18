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
  function recordLabel(row,table){
    const name=[row.first_name,row.last_name].filter(Boolean).join(' ');
    const value=row.name||name||row.title||row.email||row.requirement_key||row.status||row.id;
    return String(value||'Record').slice(0,110)+(row.id?' · '+String(row.id).slice(0,8):'');
  }
  async function scan(client,kind,id){
    const spec=specs[kind];if(!spec||!id)throw Error('Elemento non valido.');
    const main=await client.from(spec.table).select('*').eq('id',id).maybeSingle();
    if(main.error)throw main.error;
    if(!main.data)throw Error('Elemento non trovato o non autorizzato.');
    const groups=await Promise.all(spec.links.map(async ([label,table,column,policy])=>{
      const response=await client.from(table).select('*',{count:'exact'}).eq(column,id).limit(MAX_ROWS+1);
      if(response.error)return {label,table,column,entries:[],error:response.error.message,truncated:false,count:null};
      const found=response.data||[],total=response.count;
      const truncated=found.length>MAX_ROWS||total==null||total>MAX_ROWS;
      const entries=found.slice(0,MAX_ROWS).map(row=>({
        key:table+':'+row.id,source:table,id:row.id,
        label:recordLabel(row,table),category:truncated?'manual':classify(policy,row),
        details:safeDetails(row),learnerId:row.learner_id||null
      }));
      return {label,table,column,entries,error:null,truncated,count:total};
    }));
    return {kind,id,spec,main:main.data,groups,parentType:classifyParent(kind,main.data)};
  }

  /* Only a compact, allowlisted set of fields is displayed.
     Never expose invitation hashes, credentials, internal metadata or raw JSON. */
  const detailFields=Object.freeze([
    ['id','Identificativo'],['name','Nome'],['title','Titolo'],
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
  const categoryText={candidate:'Candidato',manual:'Da verificare / scollegare',protected:'Storico o verifiche: attenzione'};
  function open({kind,id,client,actorId,modal,closeModal,getActorId,openRecord}){
    if(!specs[kind]||!client||!actorId)return;
    const spec=specs[kind],selected=new Set(),decisions=new Map();
    let info=null,stage=0,wantParent=false,locked=false,inspected=null;
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
        '<div class="admin-delete-toolbar"><button type="button" data-plan-all>Imposta Elimina per tutte le voci</button>'+
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
        'Questa voce contiene o può rappresentare dati da conservare. Consultala senza rimuovere le evidenze.' :
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
      holder.innerHTML='<h3>2 · Riepilogo dell’intervento</h3>'+
        '<p>Eliminazioni richieste: <strong>'+effect.remove.length+'</strong> · Scollegamenti richiesti: <strong>'+
        effect.unlink.length+'</strong> · Da risolvere: <strong>'+effect.unresolved.length+'</strong></p>'+
        '<ul class="admin-delete-review">'+rows.map(e=>
          '<li><strong>'+esc(e.action)+'</strong> · '+esc(e.label)+' <small>('+esc(e.source)+')</small></li>').join('')+'</ul>'+
        '<p>Record principale: <strong>'+(effect.deleteParent?'Incluso nel piano':'Conservato')+'</strong></p>'+
        '<p>Riferimenti sensibili nella selezione: '+effect.warnings.length+
        '. Elenco incompleto: '+(effect.incomplete?'sì':'no')+'.</p>'+
        '<div class="admin-delete-caution"><strong>Operazione finale non attiva.</strong> Il riepilogo è indicativo e non calcola ancora tutti gli effetti indiretti. L’esecuzione dovrà mostrare tali effetti, chiedere una conferma esplicita ed essere effettuata in una transazione server con audit.</div>'+
        '<div class="admin-delete-actions"><button type="button" data-plan-back>← Modifica scelte</button>'+
        '<button type="button" data-plan-close>Chiudi</button>'+
        '<button type="button" disabled aria-disabled="true">Conferma eliminazione (non disponibile)</button></div>';
    }
    function redraw(){if(!alive()||!info||locked)return;if(stage===0)showSelection();else if(stage===1)showReview();else showDetails();}
    overlay.addEventListener('click',e=>{
      if(e.target.closest('[data-plan-close]')){closeModal();return;}
      if(!info||locked)return;
      const inspect=e.target.closest('[data-plan-inspect]');
      if(inspect){
        inspected=info.groups.flatMap(g=>g.entries).find(x=>x.key===inspect.dataset.planInspect)||null;
        if(inspected){stage=2;redraw();}return;
      }
      if(e.target.closest('[data-plan-detail-back]')){inspected=null;stage=0;redraw();return;}
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
      else if(e.target.closest('[data-plan-back]')){stage=0;redraw();}
    });
    overlay.addEventListener('change',e=>{
      if(!info||locked)return;
      const choice=e.target.closest('[data-plan-choice]');
      if(choice){
        const key=choice.dataset.planChoice;
        const group=info.groups.find(g=>g.entries.some(x=>x.key===key));
        if(group){
          if(choice.value==='delete')decisions.set(key,'delete');
          else if(choice.value==='unlink'&&canUnlink(group.table,group.column))decisions.set(key,'unlink');
          else decisions.delete(key);
        }
        wantParent=false;redraw();return;
      }
      if(e.target.matches('[data-plan-parent]')){
        const effect=intentPlan(info.groups,decisions,false,info.parentType);
        wantParent=effect.rootPossible&&e.target.checked;redraw();
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
  window.SAFETY_ADMIN_DELETE_PLANNER_V22={open,specs,classify,unusedEnrollment,plan,intentPlan,canUnlink,scan,classifyParent,safeDetails,managementAction};
})();
