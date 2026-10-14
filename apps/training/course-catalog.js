/* SafetyTraining — SafetyManager administrative course catalog + Learning Unit composition preview. */
(() => {
  'use strict';
  const cloud=()=>window.SAFETY_CLOUD;
  const db=()=>cloud()?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const labels={needs_configuration:'Da configurare',ready:'Pronto e-learning',hybrid:'Ibrido / pratica esterna',unavailable:'Non erogabile in SafetyTraining'};
  let installed=false;

  function adminRoot(){return document.getElementById('adminShell');}
  function adminContent(){return document.getElementById('adminContent');}
  function titleEl(){return document.getElementById('adminTitle');}

  function ensureNav(){
    const shell=adminRoot(); if(!shell||shell.querySelector('[data-sm-course-catalog]')) return;
    const nav=shell.querySelector('.admin-nav nav'); if(!nav) return;
    const b=document.createElement('button');
    b.type='button'; b.dataset.smCourseCatalog='1';
    b.innerHTML='<span>⇄</span> Catalogo SafetyManager';
    const courses=nav.querySelector('[data-tab="courses"]');
    nav.insertBefore(b,courses||null);
    b.onclick=()=>render();
  }

  function ensurePreviewUi(){
    if(document.getElementById('smCompositionOverlay')) return;
    const style=document.createElement('style');style.textContent=`
      .sm-comp-overlay{position:fixed;inset:0;z-index:1600;background:rgba(2,8,18,.82);display:grid;place-items:center;padding:18px}.sm-comp-overlay.hidden{display:none}.sm-comp-modal{width:min(900px,100%);max-height:92vh;overflow:auto;background:#111c2d;color:#f7fbff;border:1px solid rgba(255,255,255,.12);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.5)}.sm-comp-head{display:flex;justify-content:space-between;gap:15px;padding:20px;border-bottom:1px solid rgba(255,255,255,.1)}.sm-comp-head h2{margin:3px 0}.sm-comp-body{padding:20px;display:grid;gap:14px}.sm-comp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.sm-comp-stat{background:#0b1626;border:1px solid rgba(255,255,255,.08);border-radius:13px;padding:12px}.sm-comp-stat strong{display:block;font-size:20px}.sm-comp-table{width:100%;border-collapse:collapse;font-size:12px}.sm-comp-table th,.sm-comp-table td{text-align:left;padding:9px;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top}.sm-comp-close{border:0;background:rgba(255,255,255,.08);color:white;border-radius:10px;width:38px;height:38px;font-size:22px}.sm-comp-note{font-size:12px;color:#aebbd0;line-height:1.5}.sm-comp-warn{color:#ffd391}.sm-comp-risk{display:inline-block;padding:4px 7px;margin:2px;border-radius:999px;background:rgba(77,211,168,.12);border:1px solid rgba(77,211,168,.22);font-size:11px}
    `;document.head.appendChild(style);
    const ov=document.createElement('div');ov.id='smCompositionOverlay';ov.className='sm-comp-overlay hidden';ov.innerHTML=`<section class="sm-comp-modal"><header class="sm-comp-head"><div><div class="admin-kicker">COMPOSIZIONE LEARNING UNIT</div><h2 id="smCompTitle">Anteprima</h2><div id="smCompSubtitle" class="sm-comp-note"></div></div><button id="smCompClose" class="sm-comp-close">×</button></header><div id="smCompBody" class="sm-comp-body"></div></section>`;document.body.appendChild(ov);ov.onclick=e=>{if(e.target===ov)ov.classList.add('hidden');};document.getElementById('smCompClose').onclick=()=>ov.classList.add('hidden');
  }

  function statusClass(s){return s==='ready'?'admin-ok':s==='hybrid'?'admin-warn':s==='unavailable'?'admin-error':'admin-note';}

  async function showComposition(row){
    ensurePreviewUi();
    const ov=document.getElementById('smCompositionOverlay'),body=document.getElementById('smCompBody');
    document.getElementById('smCompTitle').textContent=row.title||row.external_course_code;
    document.getElementById('smCompSubtitle').textContent=`${row.external_course_code} · proposta automatica, non pubblicazione`;
    body.innerHTML='<div class="admin-loading">Analisi Learning Unit…</div>';ov.classList.remove('hidden');
    const {data:contexts}=await db().from('integration_training_contexts').select('source_risk_codes,normalized_risk_codes,custom_risks,source_sector_code,analysis_accepted,updated_at').eq('source_system','safetymanager').eq('external_course_code',row.external_course_code).order('updated_at',{ascending:false}).limit(1);
    const ctx=contexts?.[0]||null;
    const risks=Array.isArray(ctx?.source_risk_codes)?ctx.source_risk_codes:[];
    const {data,error}=await db().rpc('preview_safetymanager_composition',{p_external_course_code:row.external_course_code,p_risk_codes:risks});
    if(error){body.innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;return;}
    const effective=Array.isArray(data?.effective_risks)?data.effective_risks:[];
    const coverage=Array.isArray(data?.coverage_by_risk)?data.coverage_by_risk:[];
    const units=Array.isArray(data?.proposed_units)?data.proposed_units:[];
    const target=Number(data?.target_minutes||0),proposed=Number(data?.proposed_minutes||0);
    body.innerHTML=`
      <div class="sm-comp-grid"><div class="sm-comp-stat"><strong>${effective.length}</strong><span>Categorie rischio</span></div><div class="sm-comp-stat"><strong>${Number(data?.matched_unit_count||0)}</strong><span>LU pertinenti disponibili</span></div><div class="sm-comp-stat"><strong>${units.length}</strong><span>LU proposte</span></div><div class="sm-comp-stat"><strong>${Math.round(proposed/60*10)/10} h</strong><span>Durata proposta${target?` / ${Math.round(target/60*10)/10} h`:''}</span></div></div>
      <section><strong>Rischi utilizzati</strong><div style="margin-top:7px">${effective.length?effective.map(x=>`<span class="sm-comp-risk">${esc(x.title||x.code)} · ${esc(x.weight)}</span>`).join(''):'<span class="sm-comp-note">Solo profilo generico disponibile.</span>'}</div>${ctx?`<div class="sm-comp-note" style="margin-top:7px">Ultimo contesto importato: settore ${esc(ctx.source_sector_code||'—')} · analisi fabbisogni ${ctx.analysis_accepted?'validata':'da validare'}${ctx.custom_risks?.length?` · ${ctx.custom_risks.length} rischi personalizzati da revisione manuale`:''}</div>`:'<div class="sm-comp-note sm-comp-warn" style="margin-top:7px">Nessun progetto con rischi importati per questo corso: anteprima basata sul solo profilo del tipo corso.</div>'}</section>
      <section><strong>Learning Unit proposte</strong>${units.length?`<div style="overflow:auto;margin-top:7px"><table class="sm-comp-table"><thead><tr><th>#</th><th>Learning Unit</th><th>Gruppo</th><th>Rischi</th><th>Min.</th><th>Punteggio</th></tr></thead><tbody>${units.map((u,i)=>`<tr><td>${i+1}</td><td><strong>${esc(u.title)}</strong><div class="sm-comp-note">${esc(u.stable_key)}</div></td><td>${esc(u.source_group||'—')}</td><td>${(u.risk_codes||[]).map(esc).join(', ')}</td><td>${esc(u.minutes||0)}</td><td>${esc(u.score||0)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="sm-comp-warn">Non ci sono ancora Learning Unit coerenti sufficienti per questo profilo.</p>'}</section>
      <section><strong>Copertura per rischio</strong><div class="sm-comp-note">${coverage.map(x=>`${esc(x.title||x.code)}: ${esc(x.unit_count)} LU / ${Math.round(Number(x.available_minutes||0)/60*10)/10} h`).join(' · ')||'Nessuna copertura calcolata.'}</div></section>
      <div class="sm-comp-note sm-comp-warn">La composizione è un supporto alla progettazione. Prima di rendere il corso disponibile va verificata rispetto a DVR, mansione, esposizioni reali, procedure aziendali e componenti pratiche/addestrative.</div>`;
  }

  async function render(){
    const host=adminContent(); if(!host||!db()) return;
    if(titleEl()) titleEl().textContent='Catalogo corsi SafetyManager';
    adminRoot()?.querySelectorAll('.admin-nav button').forEach(x=>x.classList.remove('active'));
    adminRoot()?.querySelector('[data-sm-course-catalog]')?.classList.add('active');
    host.innerHTML='<div class="admin-loading">Caricamento catalogo…</div>';

    const [{data:catalog,error},{data:courses},{data:versions}]=await Promise.all([
      db().from('integration_course_catalog').select('source_system,external_course_code,title,nominal_minutes,delivery_status,mapped_course_id,metadata,last_seen_at').eq('source_system','safetymanager').order('title'),
      db().from('courses').select('id,title,stable_key,nominal_minutes,active,metadata').eq('active',true).order('title'),
      db().from('course_versions').select('course_id,status').eq('status','published')
    ]);
    if(error){host.innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;return;}
    const published=new Set((versions||[]).map(v=>v.course_id));
    const targets=(courses||[]).filter(c=>published.has(c.id)&&c.metadata?.source_placeholder!==true&&c.metadata?.source_placeholder!=='true');
    const counts=(catalog||[]).reduce((a,x)=>(a[x.delivery_status]=(a[x.delivery_status]||0)+1,a),{});
    host.innerHTML=`
      <section class="admin-card"><h2>Catalogo amministrativo importato</h2><p class="admin-note">SafetyManager definisce il tipo di corso e, quando disponibile, trasferisce anche settore e rischi dell’analisi fabbisogni. SafetyTraining usa questi dati per proporre Learning Unit riutilizzabili. Nessuna proposta viene pubblicata automaticamente.</p>
      <div class="admin-stats"><article class="admin-stat"><strong>${(catalog||[]).length}</strong><span>Tipologie importate</span></article><article class="admin-stat"><strong>${counts.needs_configuration||0}</strong><span>Da configurare</span></article><article class="admin-stat"><strong>${(counts.ready||0)+(counts.hybrid||0)}</strong><span>Configurate</span></article></div></section>
      <section class="admin-card"><h2>Corsi SafetyManager</h2>${(catalog||[]).length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Corso SafetyManager</th><th>Codice</th><th>Durata</th><th>Vincoli</th><th>Stato</th><th>Percorso SafetyTraining</th><th>Azioni</th></tr></thead><tbody>${(catalog||[]).map((x,i)=>{
        const presence=x.metadata?.requires_presence===true||x.metadata?.requires_presence==='true';
        const engine=x.metadata?.composition_engine==='risk-v1';
        return `<tr><td><strong>${esc(x.title)}</strong>${engine?'<div class="admin-note">Motore LU attivo</div>':''}</td><td>${esc(x.external_course_code)}</td><td>${x.nominal_minutes?`${Math.round(x.nominal_minutes/60*10)/10} h`:'—'}</td><td>${presence?'Presenza/pratica prevista':'Nessun vincolo pratico importato'}</td><td class="${statusClass(x.delivery_status)}">${esc(labels[x.delivery_status]||x.delivery_status)}</td><td><select data-map="${i}"><option value="">— nessun percorso —</option>${targets.map(c=>`<option value="${c.id}" ${x.mapped_course_id===c.id?'selected':''}>${esc(c.title)}${c.nominal_minutes?` · ${Math.round(c.nominal_minutes/60*10)/10} h`:''}</option>`).join('')}</select><select data-status="${i}"><option value="needs_configuration" ${x.delivery_status==='needs_configuration'?'selected':''}>Da configurare</option><option value="ready" ${x.delivery_status==='ready'?'selected':''}>Pronto e-learning</option><option value="hybrid" ${x.delivery_status==='hybrid'?'selected':''}>Ibrido / pratica esterna</option><option value="unavailable" ${x.delivery_status==='unavailable'?'selected':''}>Non erogabile</option></select></td><td><button class="admin-mini" data-preview="${i}">Learning Unit</button> <button class="admin-mini" data-save="${i}">Salva</button></td></tr>`;
      }).join('')}</tbody></table></div>`:'<p class="admin-note">Nessun corso SafetyManager importato.</p>'}</section>`;

    host.querySelectorAll('[data-preview]').forEach(btn=>btn.onclick=()=>showComposition((catalog||[])[Number(btn.dataset.preview)]));
    host.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=async()=>{
      const i=Number(btn.dataset.save),row=(catalog||[])[i]; if(!row)return;
      const status=host.querySelector(`[data-status="${i}"]`)?.value||'needs_configuration';
      const courseId=host.querySelector(`[data-map="${i}"]`)?.value||null;
      if(['ready','hybrid'].includes(status)&&!courseId){alert('Seleziona un percorso SafetyTraining pubblicato.');return;}
      if((row.metadata?.requires_presence===true||row.metadata?.requires_presence==='true')&&status==='ready'){alert('Questo corso prevede presenza/pratica: scegli “Ibrido / pratica esterna” oppure “Non erogabile”.');return;}
      btn.disabled=true; btn.textContent='Salvataggio…';
      const {error:e}=await db().rpc('configure_safetymanager_course',{p_external_course_code:row.external_course_code,p_course_id:courseId,p_delivery_status:status});
      if(e){alert(e.message);btn.disabled=false;btn.textContent='Salva';return;}
      await render();
    });
  }

  async function boot(){
    for(let i=0;i<40&&!adminRoot();i++) await new Promise(r=>setTimeout(r,200));
    ensureNav();ensurePreviewUi();
    if(adminRoot()) new MutationObserver(ensureNav).observe(adminRoot(),{childList:true,subtree:true});
    installed=true;
  }
  window.SAFETY_SM_CATALOG={render,showComposition,get installed(){return installed;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
