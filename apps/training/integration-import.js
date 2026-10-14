/* SafetyTraining v20 — manual import bridge from SafetyManager Pro. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const user=()=>cloud()?.state?.user;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state={admin:false,payload:null,result:null,context:null};
  const statusLabels={needs_configuration:'Da configurare',ready:'Pronto e-learning',hybrid:'Ibrido / pratica esterna',unavailable:'Non erogabile in SafetyTraining'};

  function style(){
    if(document.getElementById('sm-import-style')) return;
    const s=document.createElement('style');s.id='sm-import-style';s.textContent=`
      .sm-import-btn{border:1px solid rgba(77,211,168,.35);background:rgba(77,211,168,.10);color:#dffcf3;padding:8px 11px;border-radius:10px;font-weight:800}.sm-import-btn.hidden{display:none}
      .sm-import-overlay{position:fixed;inset:0;z-index:1400;background:rgba(2,8,18,.78);backdrop-filter:blur(9px);display:grid;place-items:center;padding:18px}.sm-import-overlay.hidden{display:none}
      .sm-import-modal{width:min(780px,100%);max-height:92vh;overflow:auto;background:#121d30;color:#fff;border:1px solid rgba(255,255,255,.13);border-radius:22px;box-shadow:0 30px 90px rgba(0,0,0,.5)}
      .sm-import-head{padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:16px}.sm-import-head h2{margin:3px 0}.sm-import-kicker{font-size:10px;letter-spacing:1.4px;font-weight:900;color:#4dd3a8}.sm-import-close{width:38px;height:38px;border:0;border-radius:11px;background:rgba(255,255,255,.08);color:#fff;font-size:24px}.sm-import-body{padding:20px 22px;display:grid;gap:14px}.sm-import-drop{border:1px dashed rgba(255,255,255,.2);border-radius:16px;padding:18px;background:#0c1728}.sm-import-drop input{width:100%;margin-top:10px}.sm-import-preview,.sm-import-result{padding:14px;border-radius:14px;background:#0d1829;border:1px solid rgba(255,255,255,.09);line-height:1.5}.sm-import-preview strong,.sm-import-result strong{color:#fff}.sm-import-muted{color:#92a0b5;font-size:12px}.sm-import-warn{color:#ffd391}.sm-import-ok{color:#9ff0ce}.sm-import-actions{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid rgba(255,255,255,.08);background:#0f192a}.sm-import-actions button{padding:10px 14px;border-radius:11px;border:1px solid rgba(255,255,255,.13);font-weight:850}.sm-import-primary{background:#23a77d;color:white}.sm-import-secondary{background:rgba(255,255,255,.06);color:#fff}.sm-lu-list{margin:8px 0 0;padding-left:18px;font-size:12px;color:#d9e4f3}.sm-lu-list li{margin:3px 0}
    `;document.head.appendChild(s);
  }

  function ensureUi(){
    style();
    if(!document.getElementById('smImportBtn')){
      const b=document.createElement('button');b.id='smImportBtn';b.type='button';b.className='sm-import-btn hidden';b.textContent='⇄ Importa SafetyManager';b.onclick=open;
      const admin=document.getElementById('adminConsoleBtn'),acct=document.getElementById('cloudAccount');
      const parent=admin?.parentElement||acct?.parentElement||document.querySelector('.topbar');
      parent?.insertBefore(b,admin||acct||null);
    }
    if(!document.getElementById('smImportOverlay')){
      const ov=document.createElement('div');ov.id='smImportOverlay';ov.className='sm-import-overlay hidden';
      ov.innerHTML=`<section class="sm-import-modal"><header class="sm-import-head"><div><div class="sm-import-kicker">SAFETYMANAGER → SAFETYTRAINING</div><h2>Importa assegnazioni</h2><div class="sm-import-muted">Formato v1 · importazione idempotente · composizione Learning Unit</div></div><button class="sm-import-close" id="smImportClose">×</button></header><div class="sm-import-body"><div class="sm-import-drop"><strong>File esportato da SafetyManager</strong><div class="sm-import-muted">Seleziona il file JSON generato dal pulsante “SafetyTraining” in SafetyManager Pro.</div><input id="smImportFile" type="file" accept="application/json,.json"></div><div id="smImportPreview" class="sm-import-preview"><span class="sm-import-muted">Nessun file selezionato.</span></div><div id="smImportResult" class="sm-import-result hidden"></div></div><footer class="sm-import-actions"><button class="sm-import-secondary" id="smImportCancel">Chiudi</button><button class="sm-import-primary" id="smImportRun" disabled>Importa</button></footer></section>`;
      ov.onclick=e=>{if(e.target===ov)close();};document.body.appendChild(ov);
      document.getElementById('smImportClose').onclick=close;document.getElementById('smImportCancel').onclick=close;
      document.getElementById('smImportFile').onchange=readFile;document.getElementById('smImportRun').onclick=runImport;
    }
  }
  function open(){ensureUi();document.getElementById('smImportOverlay').classList.remove('hidden');}
  function close(){document.getElementById('smImportOverlay')?.classList.add('hidden');}

  async function readFile(e){
    const file=e.target.files?.[0];state.payload=null;state.result=null;state.context=null;document.getElementById('smImportRun').disabled=true;document.getElementById('smImportResult').classList.add('hidden');
    if(!file)return;
    try{
      const p=JSON.parse(await file.text());
      if(p?.schema!=='safetytraining.transfer'||p?.source_system!=='safetymanager'||!String(p?.schema_version||'').startsWith('1.')) throw new Error('File non riconosciuto come export SafetyManager v1.');
      if(!p?.company?.external_id||!p?.project?.external_id) throw new Error('Il file non contiene azienda/progetto validi.');
      state.payload=p;
      const learners=Array.isArray(p.learners)?p.learners:[];
      const risks=Array.isArray(p.project?.risk_codes)?p.project.risk_codes:[];
      const custom=Array.isArray(p.project?.custom_risks)?p.project.custom_risks:[];
      const duration=p.project?.course_duration_minutes?` · ${Math.round(Number(p.project.course_duration_minutes)/60*10)/10} h`:'';
      const presence=p.project?.requires_presence===true?' · presenza/pratica prevista':'';
      const riskLine=risks.length||custom.length?`<div class="sm-import-muted">Contesto: ${esc(p.project?.risk_sector_label||p.project?.risk_sector_code||'settore non indicato')} · ${risks.length} rischi catalogati${custom.length?` · ${custom.length} personalizzati`:''}</div>`:'<div class="sm-import-muted sm-import-warn">Nessun rischio specifico nel file: verrà usato solo il profilo generico del corso.</div>';
      document.getElementById('smImportPreview').innerHTML=`<strong>${esc(p.company.name||'Azienda')}</strong><div>${esc(p.project.title||p.project.code||'Progetto')}</div><div class="sm-import-muted">Corso SafetyManager: <strong>${esc(p.project.course_code||'—')}</strong>${duration}${presence} · ${learners.length} corsisti · esportato ${p.exported_at?new Date(p.exported_at).toLocaleString('it-IT'):'—'}</div>${riskLine}`;
      document.getElementById('smImportRun').disabled=false;
    }catch(err){document.getElementById('smImportPreview').innerHTML=`<span class="sm-import-warn">${esc(err.message||err)}</span>`;}
  }

  async function runImport(){
    if(!state.payload||!db())return;
    const run=document.getElementById('smImportRun'),res=document.getElementById('smImportResult');run.disabled=true;res.classList.remove('hidden');res.innerHTML='<span class="sm-import-muted">Importazione in corso…</span>';
    const {data,error}=await db().rpc('import_safetymanager_package',{p_payload:state.payload});
    if(error){run.disabled=false;res.innerHTML=`<span class="sm-import-warn">Importazione non riuscita: ${esc(error.message)}</span>`;return;}
    state.result=data||{};

    let context=null,contextError=null;
    const ctxCall=await db().rpc('sync_safetymanager_training_context',{p_payload:state.payload});
    if(ctxCall.error) contextError=ctxCall.error; else context=ctxCall.data||{};
    state.context=context;
    run.disabled=false;

    const warnings=Array.isArray(data?.warnings)?data.warnings:[];
    const delivery=data?.delivery_status||'needs_configuration';
    const status=statusLabels[delivery]||delivery;
    const guidance=delivery==='needs_configuration'
      ? 'Azienda, corsisti, edizione e iscrizioni sono stati salvati. Il corso resta bloccato ai corsisti finché il percorso didattico non viene revisionato e configurato.'
      : delivery==='hybrid'
        ? 'Il percorso è configurato come ibrido: SafetyTraining gestisce la parte digitale, mentre la componente pratica/presenza resta separata.'
        : delivery==='unavailable'
          ? 'I dati amministrativi sono stati importati, ma questo corso non viene erogato in SafetyTraining.'
          : 'Il corso è collegato a un percorso SafetyTraining pubblicato ed è pronto per l’erogazione interna.';

    const preview=context?.preview||{};
    const effective=Array.isArray(preview.effective_risks)?preview.effective_risks:[];
    const units=Array.isArray(preview.proposed_units)?preview.proposed_units:[];
    const unmapped=Array.isArray(context?.unmapped_risk_codes)?context.unmapped_risk_codes:[];
    const composition=contextError
      ? `<div class="sm-import-warn" style="margin-top:10px">Dati amministrativi importati, ma composizione Learning Unit non aggiornata: ${esc(contextError.message||contextError)}</div>`
      : `<div style="margin-top:12px"><strong>Composizione didattica proposta</strong><div class="sm-import-muted">${effective.length} categorie di rischio effettive · ${Number(preview.proposed_unit_count||0)} Learning Unit · circa ${Math.round(Number(preview.proposed_minutes||0)/60*10)/10} h selezionate rispetto a ${preview.target_minutes?Math.round(Number(preview.target_minutes)/60*10)/10+' h nominali':'durata da definire'}.</div>${effective.length?`<div class="sm-import-muted">Rischi normalizzati: ${effective.map(x=>esc(x.title||x.code)).join(', ')}</div>`:''}${units.length?`<ul class="sm-lu-list">${units.slice(0,8).map(x=>`<li>${esc(x.title)} · ${esc(x.minutes||0)} min</li>`).join('')}${units.length>8?`<li>… altre ${units.length-8} unità</li>`:''}</ul>`:''}${unmapped.length?`<div class="sm-import-warn">Codici rischio da mappare: ${unmapped.map(esc).join(', ')}</div>`:''}<div class="sm-import-warn" style="margin-top:8px">Questa è una proposta automatica: prima della pubblicazione va confrontata con DVR, mansioni, esposizioni e procedure aziendali. Le parti pratiche/addestrative restano separate.</div></div>`;

    res.innerHTML=`<strong class="sm-import-ok">Importazione completata</strong><div class="sm-import-muted">Corso: ${esc(data?.course_title||state.payload?.project?.course_title||'—')} · Stato: <strong>${esc(status)}</strong></div><div class="sm-import-muted">Azienda creata: ${data?.created_company||0} · Corsisti creati: ${data?.created_learners||0} · Corsisti aggiornati/riusati: ${data?.updated_or_reused_learners||0} · Edizione creata: ${data?.created_edition||0} · Iscrizioni create: ${data?.created_enrollments||0} · Iscrizioni già presenti: ${data?.reused_enrollments||0}</div><div style="margin-top:8px">${esc(guidance)}</div>${warnings.length?`<div class="sm-import-warn" style="margin-top:8px">${warnings.map(esc).join('<br>')}</div>`:''}${composition}`;
    window.SAFETY_ADMIN?.refreshRole?.();
  }

  async function refreshAdmin(){
    if(!db()||!user()){state.admin=false;ensureUi();document.getElementById('smImportBtn').classList.add('hidden');return;}
    const {data}=await db().from('platform_admins').select('user_id').eq('user_id',user().id).maybeSingle();state.admin=!!data;ensureUi();document.getElementById('smImportBtn').classList.toggle('hidden',!state.admin);
  }
  async function boot(){ensureUi();for(let i=0;i<30&&!db();i++)await new Promise(r=>setTimeout(r,150));await refreshAdmin();db()?.auth?.onAuthStateChange(()=>setTimeout(refreshAdmin,0));}
  window.SAFETY_SM_IMPORT={open,close,runImport};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
