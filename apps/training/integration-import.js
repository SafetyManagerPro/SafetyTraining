/* SafetyTraining v48.4 — manual JSON/CSV import bridge from SafetyManager Pro. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const user=()=>cloud()?.state?.user;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const hours=min=>`${Math.round(Number(min||0)/60*10)/10} h`;
  const state={admin:false,payload:null,result:null,context:null,format:null,mappedFields:[]};
  const statusLabels={needs_configuration:'Da configurare',ready:'Pronto e-learning',hybrid:'Ibrido / pratica esterna',unavailable:'Non erogabile in SafetyTraining'};
  const csvRequired=['schema','schema_version','source_system','company_external_id','project_external_id','project_course_code','learner_external_id'];
  const companyFields=['external_id','name','vat_or_fiscal_code','ateco_code','address','operating_site'];
  const projectFields=['external_id','code','course_code','course_title','course_duration_minutes','course_normative_ref','requires_presence','title','available_from','recommended_due_at','source_mode','site','risk_sector_code','risk_sector_label','risk_codes','custom_risks','needs_analysis_accepted'];
  const learnerFields=['external_id','enrollment_external_id','full_name','first_name','last_name','fiscal_code','email','job_title','source_company_id'];

  function normalizeHeader(value){return String(value??'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_|_$/g,'');}
  function parseCsvMatrix(text){
    const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<String(text||'').length;i++){
      const c=text[i],next=text[i+1];
      if(c==='"'&&quoted&&next==='"'){field+='"';i++;continue;}
      if(c==='"'){quoted=!quoted;continue;}
      if((c===';'||c===','||c==='\t')&&!quoted){row.push(field);field='';continue;}
      if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&next==='\n')i++;row.push(field);rows.push(row);row=[];field='';continue;}
      field+=c;
    }
    if(quoted)throw new Error('CSV non valido: virgolette non chiuse.');
    if(field.length||row.length){row.push(field);rows.push(row);}
    return rows.filter(r=>r.some(v=>String(v??'').trim()));
  }
  function csvValue(value){const text=String(value??'').trim();return /^'[=+\-@]/.test(text)?text.slice(1):text;}
  function csvBoolean(value,field){
    const text=csvValue(value).toLowerCase();if(!text)return null;
    if(['true','1','si','sì','yes'].includes(text))return true;
    if(['false','0','no'].includes(text))return false;
    throw new Error(`CSV non valido: ${field} deve essere true/false.`);
  }
  function csvNumber(value,field){const text=csvValue(value);if(!text)return null;const number=Number(text);if(!Number.isFinite(number))throw new Error(`CSV non valido: ${field} deve essere numerico.`);return number;}
  function csvArray(value,field){
    const text=csvValue(value);if(!text)return[];
    try{const parsed=JSON.parse(text);if(Array.isArray(parsed))return parsed.map(v=>String(v??'').trim()).filter(Boolean);}catch(_error){}
    throw new Error(`CSV non valido: ${field} deve contenere un elenco JSON.`);
  }
  function readPrefixed(record,prefix,fields){return Object.fromEntries(fields.filter(field=>Object.prototype.hasOwnProperty.call(record,prefix+field)).map(field=>[field,csvValue(record[prefix+field])]));}
  function csvToPayload(text){
    const matrix=parseCsvMatrix(text);if(matrix.length<2)throw new Error('CSV SafetyManager vuoto: servono intestazioni e almeno un corsista.');
    const headers=matrix[0].map(normalizeHeader),missing=csvRequired.filter(name=>!headers.includes(name));
    if(missing.length)throw new Error(`CSV SafetyManager non riconosciuto. Colonne mancanti: ${missing.join(', ')}.`);
    const records=matrix.slice(1).map((values,rowIndex)=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??'']).concat([['_row',rowIndex+2]])));
    const first=records[0],shared=['schema','schema_version','source_system','export_id','exported_at',...companyFields.map(x=>'company_'+x),...projectFields.map(x=>'project_'+x)];
    for(const record of records.slice(1))for(const field of shared)if(csvValue(record[field])!==csvValue(first[field]))throw new Error(`CSV non valido: il campo ${field} cambia alla riga ${record._row}. Usa un solo export per file.`);
    const company=readPrefixed(first,'company_',companyFields),project=readPrefixed(first,'project_',projectFields);
    project.course_duration_minutes=csvNumber(first.project_course_duration_minutes,'project_course_duration_minutes');
    project.requires_presence=csvBoolean(first.project_requires_presence,'project_requires_presence');
    project.available_from=csvValue(first.project_available_from)||null;
    project.recommended_due_at=csvValue(first.project_recommended_due_at)||null;
    project.risk_sector_code=csvValue(first.project_risk_sector_code)||null;
    project.risk_codes=csvArray(first.project_risk_codes,'project_risk_codes');
    project.custom_risks=csvArray(first.project_custom_risks,'project_custom_risks');
    project.needs_analysis_accepted=csvBoolean(first.project_needs_analysis_accepted,'project_needs_analysis_accepted');
    const learners=records.map(record=>readPrefixed(record,'learner_',learnerFields));
    return {payload:{schema:csvValue(first.schema),schema_version:csvValue(first.schema_version),source_system:csvValue(first.source_system),export_id:csvValue(first.export_id),exported_at:csvValue(first.exported_at),company,project,learners},headers};
  }
  function jsonToPayload(text){
    try{return{payload:JSON.parse(String(text||'').replace(/^\uFEFF/,'')),headers:[]};}
    catch(error){throw new Error(`JSON non valido: ${error?.message||error}`);}
  }
  function validatePayload(payload){
    const errors=[],warnings=[];
    if(payload?.schema!=='safetytraining.transfer')errors.push('schema deve essere safetytraining.transfer.');
    if(payload?.source_system!=='safetymanager')errors.push('source_system deve essere safetymanager.');
    if(!String(payload?.schema_version||'').startsWith('1.'))errors.push('schema_version non supportata: sono accettate le versioni 1.x.');
    if(!payload?.company?.external_id)errors.push('company.external_id mancante.');
    if(!payload?.company?.name)errors.push('company.name mancante.');
    if(!payload?.company?.vat_or_fiscal_code)warnings.push('P. IVA / Codice Fiscale azienda mancante: verificare possibili doppioni.');
    if(!payload?.project?.external_id)errors.push('project.external_id mancante.');
    if(!payload?.project?.course_code)errors.push('project.course_code mancante.');
    if(!Array.isArray(payload?.learners)||!payload.learners.length)errors.push('Nessun corsista presente nel file.');
    const ids=new Set(),fiscalCodes=new Set();
    (payload?.learners||[]).forEach((learner,index)=>{
      const label=learner?.full_name||`riga corsista ${index+1}`;
      if(!learner?.external_id)errors.push(`${label}: learner.external_id mancante.`);
      else if(ids.has(learner.external_id))errors.push(`${label}: learner.external_id duplicato.`);else ids.add(learner.external_id);
      if(!learner?.fiscal_code)warnings.push(`${label}: Codice Fiscale mancante.`);
      else if(fiscalCodes.has(learner.fiscal_code))errors.push(`${label}: Codice Fiscale duplicato nel file.`);else fiscalCodes.add(learner.fiscal_code);
    });
    return{ok:errors.length===0,errors,warnings};
  }
  function mappedFieldNames(payload){
    const fields=[];
    for(const field of companyFields)if(payload?.company?.[field]!==undefined&&payload.company[field]!==null&&payload.company[field]!=='')fields.push('company.'+field);
    for(const field of projectFields)if(payload?.project?.[field]!==undefined&&payload.project[field]!==null&&payload.project[field]!==''&&(!Array.isArray(payload.project[field])||payload.project[field].length))fields.push('project.'+field);
    for(const field of learnerFields)if((payload?.learners||[]).some(row=>row?.[field]!==undefined&&row[field]!==null&&row[field]!==''))fields.push('learners[].'+field);
    return fields;
  }
  async function parseTransferFile(file){
    if(!file)throw new Error('Seleziona un file JSON o CSV esportato da SafetyManager Pro.');
    const name=String(file.name||''),type=String(file.type||'').toLowerCase(),text=await file.text();
    if(/\.csv$/i.test(name)||type.includes('csv'))return{...csvToPayload(text),format:'CSV'};
    if(/\.json$/i.test(name)||type.includes('json')||(!type&&!/\.[a-z0-9]+$/i.test(name)))return{...jsonToPayload(text),format:'JSON'};
    throw new Error(`Formato “${name||type}” non supportato. Usa .json o .csv esportato da SafetyManager Pro.`);
  }

  function style(){
    if(document.getElementById('sm-import-style')) return;
    const s=document.createElement('style');s.id='sm-import-style';s.textContent=`
      .sm-import-btn{border:1px solid rgba(77,211,168,.35);background:rgba(77,211,168,.10);color:#dffcf3;padding:8px 11px;border-radius:10px;font-weight:800}.sm-import-btn.hidden{display:none}
      .sm-import-overlay{position:fixed;inset:0;z-index:1400;background:rgba(2,8,18,.78);backdrop-filter:blur(9px);display:grid;place-items:center;padding:18px}.sm-import-overlay.hidden{display:none}
      .sm-import-modal{width:min(980px,100%);max-height:92vh;overflow:auto;background:#121d30;color:#fff;border:1px solid rgba(255,255,255,.13);border-radius:22px;box-shadow:0 30px 90px rgba(0,0,0,.5)}
      .sm-import-head{padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:16px}.sm-import-head h2{margin:3px 0}.sm-import-kicker{font-size:10px;letter-spacing:1.4px;font-weight:900;color:#4dd3a8}.sm-import-close{width:38px;height:38px;border:0;border-radius:11px;background:rgba(255,255,255,.08);color:#fff;font-size:24px}.sm-import-body{padding:20px 22px;display:grid;gap:14px}.sm-import-drop{border:1px dashed rgba(255,255,255,.2);border-radius:16px;padding:18px;background:#0c1728}.sm-import-drop input{width:100%;margin-top:10px}.sm-import-preview,.sm-import-result{padding:14px;border-radius:14px;background:#0d1829;border:1px solid rgba(255,255,255,.09);line-height:1.5}.sm-import-preview strong,.sm-import-result strong{color:#fff}.sm-import-muted{color:#92a0b5;font-size:12px}.sm-import-warn{color:#ffd391}.sm-import-ok{color:#9ff0ce}.sm-import-actions{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid rgba(255,255,255,.08);background:#0f192a}.sm-import-actions button{padding:10px 14px;border-radius:11px;border:1px solid rgba(255,255,255,.13);font-weight:850}.sm-import-primary{background:#23a77d;color:white}.sm-import-secondary{background:rgba(255,255,255,.06);color:#fff}.sm-lu-list{margin:8px 0 0;padding-left:18px;font-size:12px;color:#d9e4f3}.sm-lu-list li{margin:3px 0}.sm-import-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:10px}.sm-import-stat{padding:9px;border-radius:11px;background:#0a1423;border:1px solid rgba(255,255,255,.08)}.sm-import-stat strong{display:block;font-size:16px}.sm-import-fields{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.sm-import-field{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;padding:4px 6px;border-radius:7px;background:rgba(77,211,168,.1);color:#baf3df;border:1px solid rgba(77,211,168,.2)}.sm-import-table-wrap{overflow:auto;margin-top:10px}.sm-import-table{width:100%;border-collapse:collapse;font-size:11px}.sm-import-table th,.sm-import-table td{text-align:left;padding:7px;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top;white-space:nowrap}.sm-import-errors{margin:7px 0 0;padding-left:18px}.sm-import-errors li{margin:3px 0}
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
      ov.innerHTML=`<section class="sm-import-modal"><header class="sm-import-head"><div><div class="sm-import-kicker">SAFETYMANAGER → SAFETYTRAINING</div><h2>Importa assegnazioni</h2><div class="sm-import-muted">Schema 1.x · JSON o CSV · importazione idempotente · composizione Learning Unit v2</div></div><button class="sm-import-close" id="smImportClose">×</button></header><div class="sm-import-body"><div class="sm-import-drop"><strong>File esportato da SafetyManager Pro</strong><div class="sm-import-muted">Seleziona il JSON o il CSV creato da “Esporta per SafetyTraining”. Entrambi ricostruiscono lo stesso pacchetto; nessun dato viene scritto prima del pulsante Importa.</div><input id="smImportFile" type="file" accept="application/json,text/csv,.json,.csv"></div><div id="smImportPreview" class="sm-import-preview"><span class="sm-import-muted">Nessun file selezionato.</span></div><div id="smImportResult" class="sm-import-result hidden"></div></div><footer class="sm-import-actions"><button class="sm-import-secondary" id="smImportCancel">Chiudi</button><button class="sm-import-primary" id="smImportRun" disabled>Importa</button></footer></section>`;
      ov.onclick=e=>{if(e.target===ov)close();};document.body.appendChild(ov);
      document.getElementById('smImportClose').onclick=close;document.getElementById('smImportCancel').onclick=close;
      document.getElementById('smImportFile').onchange=readFile;document.getElementById('smImportRun').onclick=runImport;
    }
  }
  function open(){ensureUi();document.getElementById('smImportOverlay').classList.remove('hidden');}
  function close(){document.getElementById('smImportOverlay')?.classList.add('hidden');}

  function previewHtml(payload,format,mappedFields,check){
    const learners=Array.isArray(payload.learners)?payload.learners:[],risks=Array.isArray(payload.project?.risk_codes)?payload.project.risk_codes:[],custom=Array.isArray(payload.project?.custom_risks)?payload.project.custom_risks:[];
    const duration=payload.project?.course_duration_minutes?` · ${hours(payload.project.course_duration_minutes)}`:'',presence=payload.project?.requires_presence===true?' · presenza/pratica prevista':'';
    const riskLine=risks.length||custom.length?`<div class="sm-import-muted">Contesto: ${esc(payload.project?.risk_sector_label||payload.project?.risk_sector_code||'settore non indicato')} · ${risks.length} rischi catalogati${custom.length?` · ${custom.length} personalizzati`:''}</div>`:'<div class="sm-import-muted sm-import-warn">Nessun rischio specifico nel file: verrà usato solo il profilo generico del corso.</div>';
    const issues=check.errors.length?`<div class="sm-import-warn" role="alert"><strong>File non importabile</strong><ul class="sm-import-errors">${check.errors.map(error=>`<li>${esc(error)}</li>`).join('')}</ul></div>`:'';
    const warnings=check.warnings.length?`<div class="sm-import-warn"><strong>Avvisi da verificare</strong><ul class="sm-import-errors">${check.warnings.map(warning=>`<li>${esc(warning)}</li>`).join('')}</ul></div>`:'';
    const fields=`<div style="margin-top:10px"><strong>Campi mappati (${mappedFields.length})</strong><div class="sm-import-fields">${mappedFields.map(field=>`<span class="sm-import-field">${esc(field)}</span>`).join('')}</div></div>`;
    const rows=learners.slice(0,25).map((learner,index)=>`<tr><td>${index+1}</td><td>${esc(learner.full_name||[learner.last_name,learner.first_name].filter(Boolean).join(' ')||'—')}</td><td>${esc(learner.fiscal_code||'—')}</td><td>${esc(learner.job_title||'—')}</td><td>${esc(learner.external_id||'—')}</td><td>${esc(learner.enrollment_external_id||'—')}</td></tr>`).join('');
    const learnerTable=`<div class="sm-import-table-wrap"><table class="sm-import-table"><thead><tr><th>#</th><th>Corsista</th><th>Codice fiscale</th><th>Mansione</th><th>ID corsista</th><th>ID iscrizione</th></tr></thead><tbody>${rows}</tbody></table>${learners.length>25?`<div class="sm-import-muted">Anteprima limitata a 25 di ${learners.length} corsisti.</div>`:''}</div>`;
    return `<div class="sm-import-ok"><strong>${esc(format)} riconosciuto · schema ${esc(payload.schema_version||'—')}</strong></div><strong>${esc(payload.company?.name||'Azienda')}</strong><div class="sm-import-muted">P. IVA / CF: ${esc(payload.company?.vat_or_fiscal_code||'—')} · ID: ${esc(payload.company?.external_id||'—')}</div><div style="margin-top:7px"><strong>${esc(payload.project?.title||payload.project?.code||'Progetto')}</strong></div><div class="sm-import-muted">Corso: ${esc(payload.project?.course_code||'—')} · ${esc(payload.project?.course_title||'titolo non indicato')}${duration}${presence} · ${learners.length} corsisti · esportato ${payload.exported_at?new Date(payload.exported_at).toLocaleString('it-IT'):'—'}</div>${riskLine}${fields}${learnerTable}${issues}${warnings}`;
  }
  async function openFile(file){
    ensureUi();open();state.payload=null;state.result=null;state.context=null;state.format=null;state.mappedFields=[];
    const run=document.getElementById('smImportRun'),result=document.getElementById('smImportResult'),preview=document.getElementById('smImportPreview');
    run.disabled=true;result.classList.add('hidden');preview.innerHTML='<span class="sm-import-muted">Analisi e mappatura del file…</span>';
    try{
      const parsed=await parseTransferFile(file),check=validatePayload(parsed.payload),mappedFields=mappedFieldNames(parsed.payload);
      state.payload=check.ok?parsed.payload:null;state.format=parsed.format;state.mappedFields=mappedFields;
      preview.innerHTML=previewHtml(parsed.payload,parsed.format,mappedFields,check);run.disabled=!check.ok;
      return{...parsed,check,mappedFields};
    }catch(error){
      preview.innerHTML=`<div class="sm-import-warn" role="alert"><strong>File non importabile</strong><div>${esc(error?.message||error)}</div><div class="sm-import-muted" style="margin-top:7px">Usa il JSON o il CSV generato da SafetyManager Pro → Esporta per SafetyTraining. Nessun dato è stato modificato.</div></div>`;
      throw error;
    }
  }
  async function readFile(event){const file=event.target.files?.[0];if(!file)return;try{await openFile(file);}catch(error){console.warn('[SafetyManager import]',error?.message||error);}}

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
    const worker=!!preview.worker_initial_course;
    const general=Number(preview.general_core_minutes||0),proposed=Number(preview.proposed_minutes||0),specific=Math.max(0,proposed-general),gap=Number(preview.duration_gap_minutes||0);
    const composition=contextError
      ? `<div class="sm-import-warn" style="margin-top:10px">Dati amministrativi importati, ma composizione Learning Unit non aggiornata: ${esc(contextError.message||contextError)}</div>`
      : `<div style="margin-top:12px"><strong>Composizione didattica proposta</strong><div class="sm-import-stats"><div class="sm-import-stat"><strong>${hours(proposed)}</strong><span class="sm-import-muted">proposta</span></div>${worker?`<div class="sm-import-stat"><strong>${hours(general)}</strong><span class="sm-import-muted">generale fisso</span></div><div class="sm-import-stat"><strong>${hours(specific)}</strong><span class="sm-import-muted">specifico rischi</span></div>`:''}<div class="sm-import-stat"><strong>${hours(gap)}</strong><span class="sm-import-muted">da completare</span></div></div><div class="sm-import-muted" style="margin-top:8px">${effective.filter(x=>x.project_based).length} categorie di rischio di progetto · ${Number(preview.proposed_unit_count||0)} Learning Unit${preview.target_minutes?` · ${hours(preview.target_minutes)} nominali`:''}.</div>${worker?`<div class="${preview.project_risks_prioritized?'sm-import-ok':'sm-import-warn'}" style="margin-top:7px">4 ore generali mantenute integralmente. ${preview.project_risks_prioritized?'La parte specifica usa soltanto i rischi importati dal progetto.':'Mancano rischi specifici di progetto: completare l’analisi prima di pubblicare.'}</div>`:''}${gap?`<div class="sm-import-warn" style="margin-top:7px">Restano ${hours(gap)} da progettare: il sistema non inserisce contenuti estranei solo per raggiungere il monte ore.</div>`:''}${units.length?`<ul class="sm-lu-list">${units.slice(0,10).map(x=>`<li>${x.section==='general_core'?'[Generale]':'[Specifico]'} ${esc(x.title)} · ${esc(x.minutes||0)} min</li>`).join('')}${units.length>10?`<li>… altre ${units.length-10} unità</li>`:''}</ul>`:''}${unmapped.length?`<div class="sm-import-warn">Codici rischio da mappare: ${unmapped.map(esc).join(', ')}</div>`:''}${preview.practical_component_separate?'<div class="sm-import-warn" style="margin-top:8px">La componente pratica/presenza resta separata e non viene conteggiata come completata dalla parte digitale.</div>':''}<div class="sm-import-warn" style="margin-top:8px">Questa è una proposta automatica: prima della pubblicazione va confrontata con DVR, mansioni, esposizioni e procedure aziendali.</div></div>`;

    res.innerHTML=`<strong class="sm-import-ok">Importazione completata</strong><div class="sm-import-muted">Corso: ${esc(data?.course_title||state.payload?.project?.course_title||'—')} · Stato: <strong>${esc(status)}</strong></div><div class="sm-import-muted">Azienda creata: ${data?.created_company||0} · Corsisti creati: ${data?.created_learners||0} · Corsisti aggiornati/riusati: ${data?.updated_or_reused_learners||0} · Edizione creata: ${data?.created_edition||0} · Iscrizioni create: ${data?.created_enrollments||0} · Iscrizioni già presenti: ${data?.reused_enrollments||0}</div><div style="margin-top:8px">${esc(guidance)}</div>${warnings.length?`<div class="sm-import-warn" style="margin-top:8px">${warnings.map(esc).join('<br>')}</div>`:''}${composition}`;
    window.SAFETY_ADMIN?.refreshRole?.();
  }

  async function refreshAdmin(){
    if(!db()||!user()){state.admin=false;ensureUi();document.getElementById('smImportBtn').classList.add('hidden');return;}
    const {data}=await db().from('platform_admins').select('user_id').eq('user_id',user().id).maybeSingle();state.admin=!!data;ensureUi();document.getElementById('smImportBtn').classList.toggle('hidden',!state.admin);
  }
  async function boot(){ensureUi();for(let i=0;i<30&&!db();i++)await new Promise(r=>setTimeout(r,150));await refreshAdmin();db()?.auth?.onAuthStateChange(()=>setTimeout(refreshAdmin,0));}
  window.SAFETY_SM_IMPORT={open,close,openFile,runImport,parseTransferFile,csvToPayload,jsonToPayload,validatePayload,mappedFieldNames,previewHtml,version:'48.4'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
