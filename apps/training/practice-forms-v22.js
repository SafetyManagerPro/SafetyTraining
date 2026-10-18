/* SafetyTraining v22.1 — additional guided instructor observations; legacy note flow stays available. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const str=v=>typeof v==='string'?v:(v?.title||v?.label||JSON.stringify(v));
  const arr=v=>Array.isArray(v)?v:[];
  const cssId='practiceFormV22Style',rootId='practiceFormV22';
  let context=null,loading=false;
  function ensure(){
    if(!document.getElementById(cssId)){
      const css=document.createElement('style');css.id=cssId;
      css.textContent='.pf22-backdrop{position:fixed;inset:0;z-index:1550;background:rgba(2,8,18,.87);display:grid;place-items:center;padding:12px}.pf22-backdrop.hidden{display:none}.pf22-panel{width:min(920px,100%);max-height:94dvh;overflow-y:auto;background:#111e32;border:1px solid #3d526f;border-radius:18px;padding:20px;color:#edf5ff}.pf22-panel header{display:flex;justify-content:space-between;gap:16px;align-items:start}.pf22-panel h2{margin:0 0 8px}.pf22-intro{line-height:1.5;color:#cbd7ea}.pf22-section{margin:15px 0;padding:14px;border-radius:12px;border:1px solid #3a4a63}.pf22-section h3{margin-top:0}.pf22-field{display:grid;gap:5px;margin:10px 0}.pf22-field input,.pf22-field textarea,.pf22-line select{font:inherit;padding:9px;background:#0a1729;border:1px solid #61738b;color:white;border-radius:8px;min-width:0}.pf22-line{display:grid;grid-template-columns:minmax(0,1fr) 165px;gap:12px;align-items:center;margin:7px 0;padding:8px;border-bottom:1px solid #33445c}.pf22-line label{line-height:1.5}.pf22-alert{color:#ffe0ab}.pf22-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.pf22-actions button{border:1px solid #6f839f;background:#22364d;color:white;padding:11px 13px;border-radius:9px;cursor:pointer}.pf22-actions .primary{background:#3bba94;border-color:#3bba94;color:#08251c;font-weight:800}.pf22-close{font-size:22px}.pf22-message{margin:14px 0;font-size:14px}body.pf22-open{overflow:hidden}@media(max-width:560px){.pf22-panel{padding:12px}.pf22-line{grid-template-columns:1fr}.pf22-line select{width:100%}}';
      document.head.appendChild(css);
    }
    if(document.getElementById(rootId))return;
    const root=document.createElement('div');root.id=rootId;root.className='pf22-backdrop hidden';root.innerHTML='<section class="pf22-panel" role="dialog" aria-modal="true" aria-labelledby="pf22Title"><header><div><div class="admin-kicker">SCHEDA AGGIUNTIVA DOCENTE</div><h2 id="pf22Title">Procedura e checklist</h2></div><button class="pf22-close" type="button" aria-label="Chiudi">×</button></header><div id="pf22Body"></div></section>';
    document.body.appendChild(root);root.querySelector('.pf22-close').onclick=close;
    root.addEventListener('click',e=>{if(e.target===root)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.classList.contains('hidden'))close();});
  }
  function close(){document.getElementById(rootId)?.classList.add('hidden');document.body.classList.remove('pf22-open');context=null;}
  const statusOpts=[['pending','Da osservare'],['yes','Eseguito correttamente'],['no','Da correggere'],['na','Non applicabile']];
  function marksHTML(items,kind,values){
    return arr(items).map((item,i)=>'<div class="pf22-line"><label for="pf22-'+kind+'-'+i+'">'+esc(str(item))+'</label><select id="pf22-'+kind+'-'+i+'" data-kind="'+kind+'" data-idx="'+i+'">'+statusOpts.map(([v,label])=>'<option value="'+v+'" '+((values[i]||'pending')===v?'selected':'')+'>'+label+'</option>').join('')+'</select></div>').join('')||'<p>Nessuna voce prevista per questo laboratorio.</p>';
  }
  function currentMarks(kind){return [...document.querySelectorAll('#pf22Body select[data-kind="'+kind+'"]')].map(el=>el.value);}
  function bodyMessage(s,error=false){const el=document.getElementById('pf22Msg');if(el){el.textContent=s;el.className='pf22-message'+(error?' pf22-alert':'');}}
  async function open(enrollmentId,requirementKey,labKey){
    if(!db())return;
    ensure();const modal=document.getElementById(rootId);modal.classList.remove('hidden');document.body.classList.add('pf22-open');
    document.getElementById('pf22Body').innerHTML='<p>Caricamento della scheda pratica…</p>';
    context=null;
    try{
      const [{data:lab,error:lerr},{data:prior,error:perr}]=await Promise.all([
        db().from('practice_labs_v22').select('stable_key,title,objective,briefing,steps,checklist,critical_errors,stop_conditions,requires_physical_validation').eq('stable_key',labKey).eq('active',true).single(),
        db().from('enrollment_practice_assessments_v22').select('step_marks,checklist_marks,critical_issue,observed_on,instructor_name,notes,status,updated_at').eq('enrollment_id',enrollmentId).eq('requirement_key',requirementKey).eq('lab_key',labKey).maybeSingle()
      ]);
      if(lerr||perr)throw lerr||perr;
      if(modal.classList.contains('hidden'))return;
      context={enrollmentId,requirementKey,labKey,lab};const value=prior||{};
      const date=value.observed_on||new Date().toLocaleDateString('en-CA');
      document.getElementById('pf22Title').textContent=lab.title||'Scheda pratica';
      document.getElementById('pf22Body').innerHTML=
        '<p class="pf22-intro">Scheda aggiuntiva, indipendente dalla nota testuale e dalla validazione Gate. Il salvataggio NON completa automaticamente il corso.</p>'+
        '<section class="pf22-section"><h3>1. Procedura guidata</h3><p>'+esc(lab.objective||lab.briefing||'Seguire i passaggi previsti e osservare il risultato.')+'</p>'+marksHTML(lab.steps,'step',arr(value.step_marks))+'</section>'+
        '<section class="pf22-section"><h3>2. Checklist osservabile</h3>'+marksHTML(lab.checklist,'check',arr(value.checklist_marks))+'</section>'+
        '<section class="pf22-section"><h3>3. Sicurezza e osservazioni</h3><h4>Errori critici</h4><ul>'+arr(lab.critical_errors).map(x=>'<li>'+esc(str(x))+'</li>').join('')+'</ul><h4>Condizioni di stop</h4><ul>'+arr(lab.stop_conditions).map(x=>'<li>'+esc(str(x))+'</li>').join('')+'</ul>'+
        '<label class="pf22-field"><span>Criticità o condizioni di stop riscontrate</span><select id="pf22Critical"><option value="no" '+(!value.critical_issue?'selected':'')+'>No</option><option value="yes" '+(value.critical_issue?'selected':'')+'>Sì — dettaglia nelle note</option></select></label>'+
        '<label class="pf22-field">Data osservazione<input id="pf22Date" type="date" value="'+esc(date)+'"></label>'+
        '<label class="pf22-field">Docente / istruttore responsabile<input id="pf22Instructor" maxlength="180" value="'+esc(value.instructor_name||'')+'" placeholder="Nome e cognome"></label>'+
        '<label class="pf22-field">Osservazioni e note integrative<textarea id="pf22Notes" rows="4" maxlength="5000" placeholder="Esito, condizioni, eventuali interventi…">'+esc(value.notes||'')+'</textarea></label>'+
        (lab.requires_physical_validation?'<p class="pf22-alert">La prova manuale richiede osservazione diretta del docente/istruttore; la checklist digitale non sostituisce l’addestramento fisico.</p>':'')+
        '</section><div class="pf22-actions"><button type="button" id="pf22History">Storico osservazioni</button><button type="button" id="pf22Draft">Salva bozza</button><button type="button" class="primary" id="pf22Record">Registra osservazione</button><button type="button" id="pf22Dismiss">Chiudi senza salvare</button></div><div id="pf22Msg" class="pf22-message" aria-live="polite">'+(value.status==='recorded'?'Osservazione già registrata: puoi aggiornarla.':value.status==='draft'?'Bozza salvata in precedenza.':'')+'</div>';
      document.getElementById('pf22History').onclick=showHistory;
      document.getElementById('pf22Draft').onclick=()=>save('draft');
      document.getElementById('pf22Record').onclick=()=>save('recorded');
      document.getElementById('pf22Dismiss').onclick=close;
    }catch(error){document.getElementById('pf22Body').textContent='Impossibile caricare la scheda: '+(error?.message||error);}
  }
  async function showHistory(){
    if(!context)return;
    document.getElementById('pf22HistoryPanel')?.remove();
    const c=context,host=document.createElement('section');host.id='pf22HistoryPanel';host.className='pf22-section';host.textContent='Caricamento storico…';
    document.getElementById('pf22Msg')?.before(host);
    try{const {data,error}=await db().rpc('admin_practice_assessment_history_v22',{p_enrollment_id:c.enrollmentId,p_requirement_key:c.requirementKey,p_lab_key:c.labKey});if(error)throw error;const rows=Array.isArray(data)?data:[];host.innerHTML='<h3>Storico osservazioni</h3>'+(rows.length?rows.map(x=>'<article class="pf22-field"><strong>'+esc(new Date(x.when).toLocaleString('it-IT'))+' · '+esc(x.status||'')+'</strong><span>Docente: '+esc(x.instructor_name||'—')+'</span><p>'+esc(x.notes||'Nessuna nota')+'</p><small>Passaggi: '+esc(JSON.stringify(x.step_marks||[]))+' · Checklist: '+esc(JSON.stringify(x.checklist_marks||[]))+'</small></article>').join(''):'<p>Nessuna modifica registrata.</p>');}catch(e){host.textContent='Storico non disponibile: '+(e?.message||e);}
  }
  async function save(status){
    if(loading||!context)return;
    const step=currentMarks('step'),check=currentMarks('check'),date=document.getElementById('pf22Date').value,instructor=document.getElementById('pf22Instructor').value.trim(),notes=document.getElementById('pf22Notes').value.trim(),critical=document.getElementById('pf22Critical').value==='yes';
    if(status==='recorded'&&(step.concat(check).includes('pending')||!date||!instructor)){bodyMessage('Per registrare occorre valutare ogni voce, indicare data e docente. Puoi salvare una bozza incompleta.',true);return;}
    if(status==='recorded'&&critical&&!notes){bodyMessage('Descrivi nelle note la criticità o condizione di stop riscontrata.',true);return;}
    loading=true;document.querySelectorAll('#pf22Body button').forEach(b=>b.disabled=true);bodyMessage('Salvataggio…');
    try{
      const c=context;
      const {error}=await db().rpc('admin_save_practice_assessment_v22',{
        p_enrollment_id:c.enrollmentId,p_requirement_key:c.requirementKey,p_lab_key:c.labKey,
        p_step_marks:step,p_checklist_marks:check,p_critical_issue:critical,
        p_observed_on:date||null,p_instructor_name:instructor||null,p_notes:notes||null,p_status:status
      });
      if(error)throw error;
      bodyMessage(status==='draft'?'Bozza salvata. La validazione Gate resta invariata.':'Osservazione registrata. Per convalidare la pratica usa ancora il comando «Valida pratica» nel pannello Gate.');
    }catch(error){bodyMessage(error?.message||'Salvataggio non riuscito.',true);}
    finally{loading=false;document.querySelectorAll('#pf22Body button').forEach(b=>b.disabled=false);}
  }
  window.SAFETY_PRACTICE_FORMS_V22={open,close};
})();
