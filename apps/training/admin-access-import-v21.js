/* SafetyTraining v21.3 — multichannel learner access, company bulk actions and registry import. */
(() => {
  'use strict';

  const db = () => window.SAFETY_CLOUD?.state?.client;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const state = { companyId:null, context:null, preview:null, generated:[], capabilities:null };
  const MAX_BULK_INVITES = 100;

  function toast(message, kind='info') {
    let host = document.getElementById('adminToasts');
    if (!host) { host=document.createElement('div'); host.id='adminToasts'; host.className='admin-toasts'; document.body.appendChild(host); }
    const el=document.createElement('div'); el.className=`admin-toast ${kind}`; el.textContent=message; host.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show')); setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),180);},4400);
  }
  const fail = (error,prefix='Operazione non riuscita') => { console.error('[Access/import v21]',error); toast(`${prefix}: ${error?.message||error}`,'error'); };
  const appUrl = token => { const u=new URL(location.href); u.search=''; u.hash=''; u.searchParams.set('learner_invite',token); return u.toString(); };
  const inviteMessage = (name,url) => `Ciao${name?` ${name}`:''}, sei stato invitato ad accedere a SafetyTraining. Apri questo link personale per attivare il tuo account: ${url}`;
  const phoneDigits = value => String(value||'').replace(/\D/g,'');

  async function capabilities(){
    if(state.capabilities) return state.capabilities;
    const {data,error}=await db().rpc('admin_capabilities');
    if(error) throw error;
    state.capabilities=data||{}; return state.capabilities;
  }

  function ensureStyles(){
    if(document.getElementById('accessImportV21Style')) return;
    const s=document.createElement('style'); s.id='accessImportV21Style'; s.textContent=`
      .ai-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.ai-panel{background:#0d1829;border:1px solid rgba(255,255,255,.09);border-radius:15px;padding:15px}.ai-panel h3{margin:0 0 8px}.ai-muted{color:#9eacc0;font-size:12px;line-height:1.45}.ai-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ai-actions button,.ai-btn{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;border-radius:10px;padding:9px 11px;font-weight:800}.ai-actions .primary,.ai-btn.primary{background:#1e9d75}.ai-actions .danger{background:rgba(190,60,60,.18);color:#ffc4c4}.ai-control{display:grid;gap:6px;margin:9px 0;font-size:12px;font-weight:800}.ai-control select,.ai-control input{padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,.13);background:#081321;color:#fff}.ai-list{max-height:380px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:12px}.ai-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:10px;border-bottom:1px solid rgba(255,255,255,.06)}.ai-row:last-child{border-bottom:0}.ai-row small{display:block;color:#96a7bd;margin-top:2px}.ai-pill{font-size:10px;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.08)}.ai-pill.ok{background:rgba(60,190,135,.15);color:#a8f1d2}.ai-pill.warn{background:rgba(235,170,60,.15);color:#ffe1a2}.ai-import-table{width:100%;border-collapse:collapse;font-size:11px}.ai-import-table th,.ai-import-table td{padding:8px;border-bottom:1px solid rgba(255,255,255,.07);text-align:left;vertical-align:top}.ai-import-table select{max-width:150px;padding:6px;border-radius:8px;background:#081321;color:#fff}.ai-generated{display:grid;gap:8px;margin-top:12px}.ai-generated-row{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;background:#091524}.ai-generated-row code{display:block;word-break:break-all;color:#bdebdc;font-size:10px;margin:5px 0}.ai-modal{position:fixed;inset:0;z-index:1900;background:rgba(2,8,18,.84);display:grid;place-items:center;padding:18px}.ai-modal.hidden{display:none}.ai-modal-card{width:min(700px,100%);max-height:92vh;overflow:auto;background:#111c2d;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:18px}.ai-modal-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.ai-close{width:36px;height:36px;border:0;border-radius:9px;background:rgba(255,255,255,.08);color:#fff;font-size:22px}.ai-qr{background:#fff;padding:10px;width:max-content;border-radius:10px;margin-top:8px}.ai-summary{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.ai-summary span{padding:7px 9px;background:#081321;border-radius:9px;font-size:11px}.ai-file{width:100%;padding:11px;border:1px dashed rgba(255,255,255,.18);border-radius:10px;background:#091524;color:#fff}@media(max-width:700px){.ai-grid{grid-template-columns:1fr}.ai-import-table{font-size:10px}.ai-import-table th,.ai-import-table td{padding:6px 4px}}
    `; document.head.appendChild(s);
  }

  function modal(title,body){
    ensureStyles(); document.getElementById('accessImportModal')?.remove();
    const ov=document.createElement('div'); ov.id='accessImportModal'; ov.className='ai-modal';
    ov.innerHTML=`<section class="ai-modal-card"><div class="ai-modal-head"><div><div class="admin-kicker">ACCESSI SAFETYTRAINING</div><h2>${esc(title)}</h2></div><button type="button" class="ai-close">×</button></div>${body}</section>`;
    document.body.appendChild(ov); ov.querySelector('.ai-close').onclick=()=>ov.remove(); ov.onclick=e=>{if(e.target===ov)ov.remove();}; return ov;
  }

  async function saveContact(learnerId,email,phone){
    const {data,error}=await db().rpc('admin_set_learner_contact',{p_learner_id:learnerId,p_email:email||null,p_phone:phone||null});
    if(error) throw error; return data;
  }

  async function issue(learner,channel,expiresHours=168){
    const {data,error}=await db().rpc('admin_issue_learner_invite',{p_learner_id:learner.id,p_delivery_channel:channel,p_expires_hours:Number(expiresHours)});
    if(error) throw error;
    const url=appUrl(data.token), name=data.first_name||learner.first_name||'';
    if(channel==='email'){
      const redirect=new URL(url); redirect.searchParams.set('onboarding','1');
      const sent=await db().functions.invoke('invite-learner',{body:{learner_id:learner.id,redirect_to:redirect.toString()}});
      if(sent.error||sent.data?.error) throw sent.error||new Error(sent.data?.message||sent.data?.error||'invite_email_failed');
      return {...data,url,delivery:'sent'};
    }
    return {...data,url,message:inviteMessage(name,url),delivery:'not_sent'};
  }

  async function markDelivered(learnerId){
    const {error}=await db().rpc('admin_record_learner_invite_delivery',{p_learner_id:learnerId,p_status:'sent',p_error:null});
    if(error) throw error;
  }

  async function copyLink(item){
    await navigator.clipboard.writeText(item.url); await markDelivered(item.learner_id); toast('Link personale copiato.','success');
  }
  async function shareWhatsApp(item){
    const digits=phoneDigits(item.phone); if(!digits) throw new Error('Numero di telefono mancante.');
    await markDelivered(item.learner_id); window.open(`https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(item.message)}`,'_blank','noopener');
  }
  async function shareSms(item){
    const phone=String(item.phone||'').trim(); if(!phone) throw new Error('Numero di telefono mancante.');
    await markDelivered(item.learner_id); location.href=`sms:${phone}?&body=${encodeURIComponent(item.message)}`;
  }
  async function loadQr(){
    if(window.QRCode) return;
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('Libreria QR non disponibile'));document.head.appendChild(s);});
  }
  async function showQr(item,host){
    await loadQr(); host.innerHTML=''; const box=document.createElement('div'); box.className='ai-qr'; host.appendChild(box); new window.QRCode(box,{text:item.url,width:190,height:190,correctLevel:window.QRCode.CorrectLevel.M}); await markDelivered(item.learner_id);
  }

  function generatedHtml(items){
    if(!items.length) return '';
    return `<div class="ai-generated">${items.map((x,i)=>`<div class="ai-generated-row"><strong>${esc(`${x.last_name||''} ${x.first_name||''}`.trim()||x.email||'Corsista')}</strong><span class="ai-pill">${esc(x.delivery_channel)}</span><code>${esc(x.url||'Invio email completato')}</code>${x.delivery_channel!=='email'?`<div class="ai-actions"><button data-ai-copy="${i}">Copia link</button>${x.delivery_channel==='whatsapp'?`<button data-ai-wa="${i}">WhatsApp</button>`:''}${x.delivery_channel==='sms'?`<button data-ai-sms="${i}">SMS</button>`:''}<button data-ai-qr="${i}">QR</button><button class="danger" data-ai-revoke="${i}">Revoca</button></div><div data-ai-qr-host="${i}"></div>`:'<div class="ai-muted">Email inviata tramite Supabase Auth.</div>'}</div>`).join('')}</div>`;
  }

  function bindGenerated(host,items){
    host.querySelectorAll('[data-ai-copy]').forEach(b=>b.onclick=()=>copyLink(items[Number(b.dataset.aiCopy)]).catch(fail));
    host.querySelectorAll('[data-ai-wa]').forEach(b=>b.onclick=()=>shareWhatsApp(items[Number(b.dataset.aiWa)]).catch(fail));
    host.querySelectorAll('[data-ai-sms]').forEach(b=>b.onclick=()=>shareSms(items[Number(b.dataset.aiSms)]).catch(fail));
    host.querySelectorAll('[data-ai-qr]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.aiQr);showQr(items[i],host.querySelector(`[data-ai-qr-host="${i}"]`)).catch(fail);});
    host.querySelectorAll('[data-ai-revoke]').forEach(b=>b.onclick=async()=>{const x=items[Number(b.dataset.aiRevoke)];try{const {error}=await db().rpc('admin_revoke_learner_invite',{p_learner_id:x.learner_id});if(error)throw error;b.closest('.ai-generated-row').remove();toast('Invito revocato.','success');}catch(e){fail(e);}});
  }

  async function openInvite(learnerId){
    const {data:l,error}=await db().from('learners').select('id,first_name,last_name,email,phone,auth_user_id,company_id,fiscal_code').eq('id',learnerId).single();
    if(error) throw error; if(l.auth_user_id) return toast('Questo corsista ha già un account collegato.','warn');
    const ov=modal(`Invita ${`${l.first_name||''} ${l.last_name||''}`.trim()||'corsista'}`,`<div class="ai-panel"><label class="ai-control">Email<input id="aiEmail" type="email" value="${esc(l.email||'')}" placeholder="nome@azienda.it"></label><label class="ai-control">Telefono<input id="aiPhone" value="${esc(l.phone||'')}" placeholder="+39 333 1234567"></label><label class="ai-control">Canale<select id="aiChannel"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="manual">Copia link</option><option value="qr">QR code</option></select></label><label class="ai-control">Scadenza<select id="aiExpiry"><option value="72">72 ore</option><option value="168" selected>7 giorni</option><option value="720">30 giorni</option></select></label><div class="ai-muted">Il link è personale, monouso e revocabile. Se il CF è presente, sarà richiesto per completare l’attivazione.</div><div class="ai-actions"><button class="primary" id="aiIssue">Genera / invia</button></div><div id="aiSingleResult"></div></div>`);
    ov.querySelector('#aiIssue').onclick=async()=>{
      const btn=ov.querySelector('#aiIssue'); btn.disabled=true;
      try{
        const email=ov.querySelector('#aiEmail').value.trim(),phone=ov.querySelector('#aiPhone').value.trim(),channel=ov.querySelector('#aiChannel').value,expiry=Number(ov.querySelector('#aiExpiry').value);
        await saveContact(l.id,email,phone); l.email=email||null;l.phone=phone||null;
        const item=await issue(l,channel,expiry); item.first_name=l.first_name;item.last_name=l.last_name;item.delivery_channel=channel;
        state.generated=[item]; const result=ov.querySelector('#aiSingleResult'); result.innerHTML=generatedHtml(state.generated); bindGenerated(result,state.generated);
        toast(channel==='email'?'Invito email inviato.':'Link personale generato.','success');
      }catch(e){fail(e,'Invito non riuscito');}finally{btn.disabled=false;}
    };
  }

  async function openCompany(companyId){
    state.companyId=companyId; state.generated=[];
    const {data,error}=await db().rpc('admin_company_bulk_context',{p_company_id:companyId}); if(error) throw error; state.context=data;
    renderExternal();
  }

  async function loadCompanies(){
    const {data,error}=await db().from('companies').select('id,name,active,organization_id').eq('active',true).order('name'); if(error) throw error; return data||[];
  }

  async function renderExternal(){
    ensureStyles(); const host=document.getElementById('adminContent'); if(!host)return;
    document.getElementById('adminTitle').textContent='Accessi & import'; document.getElementById('adminSubtitle').textContent='Inviti multicanale, azioni massive e import anagrafiche';
    const companies=await loadCompanies();
    if(!state.companyId&&companies.length) state.companyId=companies[0].id;
    if(state.companyId&&!state.context?.company?.id){const call=await db().rpc('admin_company_bulk_context',{p_company_id:state.companyId});if(!call.error)state.context=call.data;}
    const ctx=state.context||{}, company=ctx.company||{}, learners=ctx.learners||[], editions=ctx.editions||[];
    host.innerHTML=`<section class="admin-card"><div class="admin-card-head"><div><h2>Gestione azienda</h2><p>Un unico punto per corsisti, iscrizioni, accessi e import.</p></div></div><div class="ai-grid"><div class="ai-panel"><label class="ai-control">Azienda<select id="aiCompany">${companies.map(c=>`<option value="${c.id}" ${c.id===state.companyId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><div class="ai-muted">${esc(company.vat_number?'P.IVA '+company.vat_number:'')} ${company.ateco_code?`· ATECO ${esc(company.ateco_code)}`:''}</div><div class="ai-summary"><span>${learners.length} corsisti</span><span>${editions.length} edizioni compatibili</span></div></div><div class="ai-panel"><label class="ai-control">Edizione<select id="aiEdition"><option value="">— Nessuna —</option>${editions.map(e=>`<option value="${e.id}">${esc(e.title||e.course_title)} · ${esc(e.course_title||'')}</option>`).join('')}</select></label><label class="ai-control">Canale invito<select id="aiBulkChannel"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="manual">Copia link</option><option value="qr">QR code</option></select></label><label class="ai-control">Scadenza<select id="aiBulkExpiry"><option value="72">72 ore</option><option value="168" selected>7 giorni</option><option value="720">30 giorni</option></select></label></div></div><div class="ai-panel" style="margin-top:12px"><div class="ai-actions"><button id="aiAll">Seleziona tutti</button><button id="aiNone">Nessuno</button><button class="primary" id="aiEnroll">Iscrivi selezionati</button><button class="primary" id="aiInvite">Invita selezionati</button><button class="primary" id="aiBoth">Iscrivi + invita</button></div><div class="ai-list" id="aiLearnerList">${learners.map(l=>{const active=!!l.active,account=!!l.auth_user_id;const access=account?'Account attivo':(l.invite_status||'Da invitare');return `<label class="ai-row"><input type="checkbox" data-ai-learner="${l.id}" ${!active?'disabled':''}><span><strong>${esc(`${l.last_name||''} ${l.first_name||''}`.trim()||l.email||'Corsista')}</strong><small>${esc(l.email||'email —')} · ${esc(l.phone||'tel. —')} · ${esc(l.fiscal_code||'CF —')}</small></span><span class="ai-pill ${account?'ok':l.invite_status==='sent'?'warn':''}">${esc(access)}</span></label>`;}).join('')||'<div class="admin-empty">Nessun corsista.</div>'}</div><div id="aiBulkResult"></div></div><div class="ai-panel" style="margin-top:12px"><h3>Importa corsisti CSV / Excel</h3><p class="ai-muted">Colonne riconosciute: Nome, Cognome, Email, Telefono, Codice fiscale/CF, Mansione. Prima di scrivere il database viene sempre mostrata una preview anti-doppione.</p><input id="aiImportFile" class="ai-file" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><div id="aiImportPreview"></div></div></section>`;
    host.querySelector('#aiCompany').onchange=async e=>{state.context=null;await openCompany(e.target.value);};
    host.querySelector('#aiAll').onclick=()=>host.querySelectorAll('[data-ai-learner]:not(:disabled)').forEach(x=>x.checked=true);
    host.querySelector('#aiNone').onclick=()=>host.querySelectorAll('[data-ai-learner]').forEach(x=>x.checked=false);
    host.querySelector('#aiEnroll').onclick=()=>bulkAction('enroll'); host.querySelector('#aiInvite').onclick=()=>bulkAction('invite'); host.querySelector('#aiBoth').onclick=()=>bulkAction('both');
    host.querySelector('#aiImportFile').onchange=readImport;
  }

  function selectedIds(){return [...document.querySelectorAll('[data-ai-learner]:checked')].map(x=>x.dataset.aiLearner);}
  async function bulkAction(mode){
    const ids=selectedIds(); if(!ids.length)return toast('Seleziona almeno un corsista.','warn');
    const edition=document.getElementById('aiEdition')?.value||'';
    if((mode==='enroll'||mode==='both')&&!edition)return toast('Seleziona un’edizione.','warn');
    const ctx=state.context||{}, byId=new Map((ctx.learners||[]).map(x=>[x.id,x]));
    try{
      if(mode==='enroll'||mode==='both'){
        const {data,error}=await db().rpc('admin_bulk_enroll',{p_edition_id:edition,p_learner_ids:ids,p_source:'admin_access_import_v21'}); if(error)throw error;
        toast(`${data?.inserted||0} iscrizioni create · ${data?.skipped_existing||0} già presenti.`,'success');
      }
      if(mode==='invite'||mode==='both'){
        if(ids.length>MAX_BULK_INVITES)throw new Error(`Massimo ${MAX_BULK_INVITES} inviti per operazione.`);
        const channel=document.getElementById('aiBulkChannel').value, expiry=Number(document.getElementById('aiBulkExpiry').value); state.generated=[]; let failed=0;
        for(const id of ids){const l=byId.get(id);if(!l||l.auth_user_id)continue;try{const item=await issue(l,channel,expiry);state.generated.push({...item,first_name:l.first_name,last_name:l.last_name,delivery_channel:channel});}catch(e){failed++;console.warn('[Bulk invite]',id,e?.message||e);}await sleep(channel==='email'?130:15);}
        const result=document.getElementById('aiBulkResult');result.innerHTML=`${failed?`<div class="admin-warning">${failed} inviti non riusciti.</div>`:''}${generatedHtml(state.generated)}`;bindGenerated(result,state.generated);toast(`${state.generated.length} inviti preparati${failed?` · ${failed} errori`:''}.`,failed?'warn':'success');
      }
      state.context=null; const call=await db().rpc('admin_company_bulk_context',{p_company_id:state.companyId});if(!call.error)state.context=call.data;
    }catch(e){fail(e);}
  }

  function normalizeHeader(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
  const aliases={first_name:['nome','first_name','name'],last_name:['cognome','last_name','surname'],email:['email','e_mail','mail'],phone:['telefono','cellulare','phone','mobile','tel'],fiscal_code:['codice_fiscale','codicefiscale','cf','fiscal_code'],job_title:['mansione','ruolo','job_title','qualifica']};
  function mapRows(matrix){
    if(!matrix.length)return[];const heads=matrix[0].map(normalizeHeader);const idx={};for(const [key,list] of Object.entries(aliases)){idx[key]=heads.findIndex(h=>list.includes(h));}
    return matrix.slice(1).filter(r=>r.some(v=>String(v??'').trim())).map(r=>Object.fromEntries(Object.keys(aliases).map(k=>[k,idx[k]>=0?String(r[idx[k]]??'').trim():''])));
  }
  function parseCsv(text){
    const rows=[];let row=[],field='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){field+='"';i++;continue;}if(c==='"'){q=!q;continue;}if((c===','||c===';'||c==='\t')&&!q){row.push(field);field='';continue;}if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(field);rows.push(row);row=[];field='';continue;}field+=c;}if(field.length||row.length){row.push(field);rows.push(row);}return rows;
  }
  async function loadXlsx(){if(window.XLSX)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('Libreria Excel non disponibile'));document.head.appendChild(s);});}
  async function fileRows(file){
    if(/\.csv$/i.test(file.name)||/csv/i.test(file.type))return mapRows(parseCsv(await file.text()));
    await loadXlsx();const data=await file.arrayBuffer(),book=window.XLSX.read(data,{type:'array'}),sheet=book.Sheets[book.SheetNames[0]],matrix=window.XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});return mapRows(matrix);
  }
  async function readImport(e){
    const file=e.target.files?.[0],host=document.getElementById('aiImportPreview');if(!file||!host)return;host.innerHTML='<div class="admin-loading">Analisi file…</div>';
    try{const rows=await fileRows(file);if(!rows.length)throw new Error('Nessuna riga valida nel file.');const {data,error}=await db().rpc('admin_import_learners_preview',{p_company_id:state.companyId,p_rows:rows});if(error)throw error;state.preview=data;renderImportPreview(host,data);}catch(err){host.innerHTML=`<div class="admin-error">${esc(err.message||err)}</div>`;}
  }
  function defaultAction(classification){return classification==='create'?'create':classification==='existing_same_company'?'reuse':'skip';}
  function renderImportPreview(host,data){
    const s=data.summary||{},rows=data.rows||[];host.innerHTML=`<div class="ai-summary"><span>${s.total||0} righe</span><span>${s.create||0} nuove</span><span>${s.existing_same_company||0} già azienda</span><span>${s.existing_other_company||0} altra azienda</span><span>${s.needs_review||0} da verificare</span><span>${s.invalid||0} non valide</span></div><div style="overflow:auto"><table class="ai-import-table"><thead><tr><th>#</th><th>Corsista</th><th>CF</th><th>Contatti</th><th>Esito</th><th>Azione</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${r.row_no}</td><td><strong>${esc(`${r.last_name||''} ${r.first_name||''}`.trim())}</strong>${r.existing_name?`<br><small>Esistente: ${esc(r.existing_name)}</small>`:''}</td><td>${esc(r.fiscal_code||'—')}</td><td>${esc(r.email||'—')}<br>${esc(r.phone||'—')}</td><td>${esc(r.classification)}<br><small>${esc(r.reason||'')}</small></td><td><select data-import-action="${i}">${actionOptions(r.classification,defaultAction(r.classification))}</select></td></tr>`).join('')}</tbody></table></div><div class="ai-actions"><button class="primary" id="aiImportApply">Applica import</button></div>`;host.querySelector('#aiImportApply').onclick=applyImport;
  }
  function actionOptions(cls,selected){
    const choices=[['skip','Salta']];if(cls==='create')choices.unshift(['create','Crea']);if(cls==='existing_same_company')choices.unshift(['reuse','Riusa']);if(cls==='existing_other_company')choices.unshift(['link','Collega a questa azienda']);if(cls==='needs_review')choices.unshift(['create_reviewed','Crea dopo verifica']);return choices.map(([v,l])=>`<option value="${v}" ${v===selected?'selected':''}>${l}</option>`).join('');
  }
  async function applyImport(){
    const preview=state.preview;if(!preview)return;const rows=(preview.rows||[]).map((r,i)=>({...r,action:document.querySelector(`[data-import-action="${i}"]`)?.value||'skip'}));
    try{const {data,error}=await db().rpc('admin_import_learners_apply',{p_company_id:state.companyId,p_rows:rows,p_source:'admin_csv_excel_v21'});if(error)throw error;const errors=data?.errors||[];toast(`${data?.created||0} creati · ${data?.reused||0} riusati · ${data?.linked||0} collegati${errors.length?` · ${errors.length} errori`:''}.`,errors.length?'warn':'success');state.preview=null;state.context=null;const call=await db().rpc('admin_company_bulk_context',{p_company_id:state.companyId});if(!call.error)state.context=call.data;await renderExternal();}catch(e){fail(e,'Import non riuscito');}
  }

  async function interceptLegacyBulk(){
    const edition=document.getElementById('bulkEdition')?.value,ids=[...document.querySelectorAll('[data-bulk-learner]:checked')].map(x=>x.dataset.bulkLearner);if(!edition)return toast('Seleziona un’edizione.','warn');if(!ids.length)return toast('Seleziona almeno un corsista.','warn');
    try{const {data,error}=await db().rpc('admin_bulk_enroll',{p_edition_id:edition,p_learner_ids:ids,p_source:'admin_v21_bulk_rpc'});if(error)throw error;let invited=0,failed=0;if(document.getElementById('bulkInvite')?.checked){if(ids.length>MAX_BULK_INVITES)throw new Error(`Massimo ${MAX_BULK_INVITES} inviti per operazione.`);const {data:learners}=await db().from('learners').select('id,first_name,last_name,email,phone,auth_user_id').in('id',ids);for(const l of learners||[]){if(l.auth_user_id||!l.email)continue;try{await issue(l,'email',168);invited++;}catch{failed++;}await sleep(130);}}toast(`${data?.inserted||0} iscrizioni create · ${data?.skipped_existing||0} già presenti${invited?` · ${invited} invitati`:''}${failed?` · ${failed} inviti falliti`:''}.`,failed?'warn':'success');await window.SAFETY_ADMIN?.render?.();}catch(e){fail(e);}
  }

  function addNav(){
    const nav=document.querySelector('#adminShell .admin-nav nav');if(!nav||document.getElementById('adminAccessImportNav'))return;
    const b=document.createElement('button');b.id='adminAccessImportNav';b.type='button';b.innerHTML='<span>🔐</span>Accessi & import';
    const learners=nav.querySelector('[data-tab="learners"]'); learners?.after(b); b.onclick=async()=>{nav.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.context=null;try{await renderExternal();}catch(e){fail(e);}};
  }

  async function refreshVisibility(){
    addNav();try{const c=await capabilities();document.getElementById('adminAccessImportNav')?.classList.toggle('hidden',!c?.capabilities?.manage_learners&&!c?.manage_learners);}catch(e){console.warn('[Access/import capabilities]',e?.message||e);}
  }

  function boot(){
    ensureStyles();const obs=new MutationObserver(()=>{addNav();refreshVisibility();});obs.observe(document.body,{childList:true,subtree:true});addNav();refreshVisibility();
    document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='invite-learner'){e.preventDefault();e.stopImmediatePropagation();const id=e.target.closest('[data-action]').dataset.id;openInvite(id).catch(fail);}else if(action==='bulk-submit'){e.preventDefault();e.stopImmediatePropagation();interceptLegacyBulk();}},true);
  }

  window.SAFETY_ADMIN_ACCESS_IMPORT_V21={openInvite,renderExternal,version:'21.3'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
