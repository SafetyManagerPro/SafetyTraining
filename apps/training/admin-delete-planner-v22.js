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
    if(kind==='learner'&&record.auth_user_id)return 'protected';
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
      if(response.error)return {label,table,entries:[],error:response.error.message,truncated:false,count:null};
      const found=response.data||[],total=response.count;
      const truncated=found.length>MAX_ROWS||total==null||total>MAX_ROWS;
      const entries=found.slice(0,MAX_ROWS).map(row=>({
        key:table+':'+row.id,source:table,id:row.id,
        label:recordLabel(row,table),category:truncated?'manual':classify(policy,row)
      }));
      return {label,table,entries,error:null,truncated,count:total};
    }));
    return {kind,id,spec,main:main.data,groups,parentType:classifyParent(kind,main.data)};
  }
  const categoryText={candidate:'Candidato',manual:'Da verificare / scollegare',protected:'Protetto'};
  function open({kind,id,client,actorId,modal,closeModal,getActorId}){
    if(!specs[kind]||!client||!actorId)return;
    const spec=specs[kind],selected=new Set();
    let info=null,stage=0,wantParent=false,locked=false;
    const overlay=modal('Gestione eliminazione · '+spec.title,
      '<div class="admin-delete-v24"><div class="admin-delete-steps">1. Selezione → 2. Riepilogo → 3. Conferma server</div>'+
      '<div id="adminDeletePlan" role="status" aria-live="polite">Analisi delle dipendenze…</div>'+
      '<div class="admin-delete-actions"><button type="button" data-plan-close>Chiudi</button></div></div>',
      {wide:true});
    const holder=overlay.querySelector('#adminDeletePlan');
    overlay.querySelector('[data-plan-close]').onclick=closeModal;
    const alive=()=>overlay.isConnected && getActorId()===actorId;
    function showSelection(){
      const p=plan(info.groups,selected,wantParent,info.parentType);
      if(!p.parentReady)wantParent=false;
      const list=info.groups.map(g=>{
        const warning=g.error?'Controllo non riuscito: '+g.error:g.truncated?'Elenco incompleto: selezione bloccata.':'';
        return '<section class="admin-delete-group"><header><h3>'+esc(g.label)+'</h3><span>'+
          (g.count==null?'?':esc(g.count))+' record</span></header>'+
          (warning?'<p class="admin-delete-caution">'+esc(warning)+'</p>':'')+
          (g.entries.length?'<div class="admin-delete-entries">'+g.entries.map(item=>{
            const check=item.category==='candidate'&&!g.truncated&&!g.error;
            return '<label class="admin-delete-entry"><input type="checkbox" data-plan-item="'+esc(item.key)+'"'+
              (selected.has(item.key)&&check?' checked':'')+(check?'':' disabled')+'>'+
              '<span><strong>'+esc(item.label)+'</strong><small>'+esc(item.source)+'</small></span>'+
              '<em data-kind="'+esc(item.category)+'">'+esc(categoryText[item.category])+'</em></label>';
          }).join('')+'</div>':'<p class="admin-delete-empty">Nessun elemento collegato.</p>')+
          '</section>';
      }).join('');
      holder.innerHTML='<h3>Passaggio 1 · Scegli le voci</h3>'+
        '<p>Puoi selezionare singoli candidati o tutti quelli consentiti. I dati formativi e i collegamenti non verificati restano protetti.</p>'+
        '<div class="admin-delete-toolbar"><button data-plan-all type="button">Seleziona tutti i candidati</button>'+
        '<button data-plan-none type="button">Deseleziona</button></div>'+
        list+
        '<div class="admin-delete-parent"><label><input type="checkbox" data-plan-parent'+
          (p.parentReady?'':' disabled')+(wantParent&&p.parentReady?' checked':'')+
          '> Includi anche '+esc(spec.title)+' principale</label>'+
          '<small>'+(p.parentReady?'Nessun blocco rilevato nella verifica preliminare.':'Prima occorre risolvere le dipendenze o completare le verifiche.')+'</small></div>'+
        '<p class="admin-delete-totals">Selezionati: <strong>'+p.selectedCount+'</strong> · Blocchi: <strong>'+
        p.blockers+'</strong> · Verifiche incomplete: <strong>'+(p.incomplete?'Sì':'No')+'</strong></p>'+
        '<p class="admin-delete-caution">Questi esiti sono indicativi: letture limitate da RLS, dati concorrenti o ulteriori dipendenze possono impedire la cancellazione. La selezione non modifica il database.</p>'+
        '<div class="admin-delete-actions"><button type="button" data-plan-close>Chiudi</button>'+
        '<button type="button" data-plan-next'+((p.selectedCount||wantParent&&p.parentReady)?'':' disabled')+'>Riepilogo selezione →</button></div>';
    }
    function showReview(){
      const p=plan(info.groups,selected,wantParent,info.parentType);
      holder.innerHTML='<h3>Passaggio 2 · Riepilogo simulato</h3>'+
        '<p><strong>'+p.selectedCount+'</strong> voci selezionate per la possibile eliminazione.</p>'+
        (p.choices.length?'<ul class="admin-delete-review">'+p.choices.map(x=>
          '<li>'+esc(x.label)+' <small>('+esc(x.source)+')</small></li>').join('')+'</ul>':
          '<p>Nessun record secondario selezionato.</p>')+
        '<p>Record principale: <strong>'+(p.deleteParent?'Incluso':'Conservato')+'</strong></p>'+
        '<p>Elementi protetti o da verificare: <strong>'+p.blockers+'</strong>. Controlli incompleti: '+
        (p.incomplete?'sì':'no')+'.</p>'+
        '<div class="admin-delete-caution"><strong>Passaggio 3 non abilitato:</strong> il server non espone ancora una transazione autorizzata e auditata per questa selezione. Non verranno eliminati record.</div>'+
        '<div class="admin-delete-actions"><button type="button" data-plan-close>Chiudi</button>'+
        '<button type="button" data-plan-back>← Modifica selezione</button>'+
        '<button type="button" disabled aria-disabled="true">Conferma eliminazione (non disponibile)</button></div>';
    }
    function redraw(){if(!alive()||!info||locked)return;if(stage===0)showSelection();else showReview();}
    overlay.addEventListener('click',e=>{
      if(e.target.closest('[data-plan-close]')){closeModal();return;}
      if(!info||locked)return;
      if(e.target.closest('[data-plan-all]')){
        info.groups.forEach(g=>{if(!g.truncated&&!g.error)g.entries.forEach(x=>{if(x.category==='candidate')selected.add(x.key);});});
        redraw();
      }else if(e.target.closest('[data-plan-none]')){selected.clear();wantParent=false;redraw();}
      else if(e.target.closest('[data-plan-next]')){stage=1;redraw();}
      else if(e.target.closest('[data-plan-back]')){stage=0;redraw();}
    });
    overlay.addEventListener('change',e=>{
      if(!info||locked)return;
      const item=e.target.closest('[data-plan-item]');
      if(item){
        const key=item.dataset.planItem;
        const eligible=info.groups.some(g=>!g.truncated&&!g.error&&g.entries.some(x=>x.key===key&&x.category==='candidate'));
        if(eligible){if(item.checked)selected.add(key);else selected.delete(key);}
        redraw();
      }
      if(e.target.matches('[data-plan-parent]')){
        const p=plan(info.groups,selected,false,info.parentType);
        wantParent=p.parentReady&&e.target.checked;redraw();
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
  window.SAFETY_ADMIN_DELETE_PLANNER_V22={open,specs,classify,unusedEnrollment,plan,scan,classifyParent};
})();
