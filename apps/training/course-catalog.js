/* SafetyTraining — SafetyManager administrative course catalog. */
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

  function statusClass(s){return s==='ready'?'admin-ok':s==='hybrid'?'admin-warn':s==='unavailable'?'admin-error':'admin-note';}

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
      <section class="admin-card"><h2>Catalogo amministrativo importato</h2><p class="admin-note">SafetyManager definisce il tipo di corso da assegnare. SafetyTraining conserva subito azienda, corsisti, edizione e iscrizioni; il percorso resta bloccato finché i contenuti non sono configurati. I corsi con componente pratica vanno gestiti come ibridi o non erogabili online.</p>
      <div class="admin-stats"><article class="admin-stat"><strong>${(catalog||[]).length}</strong><span>Tipologie importate</span></article><article class="admin-stat"><strong>${counts.needs_configuration||0}</strong><span>Da configurare</span></article><article class="admin-stat"><strong>${(counts.ready||0)+(counts.hybrid||0)}</strong><span>Configurate</span></article></div></section>
      <section class="admin-card"><h2>Corsi SafetyManager</h2>${(catalog||[]).length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Corso SafetyManager</th><th>Codice</th><th>Durata</th><th>Vincoli</th><th>Stato</th><th>Percorso SafetyTraining</th><th>Azione</th></tr></thead><tbody>${(catalog||[]).map((x,i)=>{
        const presence=x.metadata?.requires_presence===true||x.metadata?.requires_presence==='true';
        return `<tr><td><strong>${esc(x.title)}</strong></td><td>${esc(x.external_course_code)}</td><td>${x.nominal_minutes?`${Math.round(x.nominal_minutes/60*10)/10} h`:'—'}</td><td>${presence?'Presenza/pratica prevista':'Nessun vincolo pratico importato'}</td><td class="${statusClass(x.delivery_status)}">${esc(labels[x.delivery_status]||x.delivery_status)}</td><td><select data-map="${i}"><option value="">— nessun percorso —</option>${targets.map(c=>`<option value="${c.id}" ${x.mapped_course_id===c.id?'selected':''}>${esc(c.title)}${c.nominal_minutes?` · ${Math.round(c.nominal_minutes/60*10)/10} h`:''}</option>`).join('')}</select><select data-status="${i}"><option value="needs_configuration" ${x.delivery_status==='needs_configuration'?'selected':''}>Da configurare</option><option value="ready" ${x.delivery_status==='ready'?'selected':''}>Pronto e-learning</option><option value="hybrid" ${x.delivery_status==='hybrid'?'selected':''}>Ibrido / pratica esterna</option><option value="unavailable" ${x.delivery_status==='unavailable'?'selected':''}>Non erogabile</option></select></td><td><button class="admin-mini" data-save="${i}">Salva</button></td></tr>`;
      }).join('')}</tbody></table></div>`:'<p class="admin-note">Nessun corso SafetyManager importato. Importa un progetto da SafetyManager per alimentare automaticamente il catalogo.</p>'}</section>`;

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
    ensureNav();
    if(adminRoot()) new MutationObserver(ensureNav).observe(adminRoot(),{childList:true,subtree:true});
    installed=true;
  }
  window.SAFETY_SM_CATALOG={render,get installed(){return installed;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
