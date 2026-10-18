/* SafetyTraining v21.5 — contextual guidance for SafetyManager catalog, blueprint/master registry and course readiness. */
(() => {
  'use strict';
  const db=()=>window.SAFETY_CLOUD?.state?.client;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cards={
    'Catalogo corsi SafetyManager':()=>`<section class="admin-card admin-guide-card" data-admin-guide="catalog"><h2>Come funziona questo collegamento</h2><div class="admin-guide-grid"><article><strong>1 · Catalogo SafetyManager</strong><p>È il catalogo amministrativo sorgente: codice corso, titolo, durata e vincoli provenienti dal progetto SafetyManager. Non contiene da solo il materiale didattico e non equivale a un corso pubblicato.</p></article><article><strong>2 · Percorso SafetyTraining</strong><p>È il corso interno governato da SafetyTraining a cui viene associato il codice SafetyManager. Solo un percorso pubblicato e approvato può diventare destinazione operativa.</p></article><article><strong>3 · Learning Unit</strong><p>Il pulsante Learning Unit genera un’anteprima di composizione. Per i lavoratori mantiene il nucleo generale e usa i rischi del progetto/DVR per proporre la parte specifica. Un eventuale residuo di ore resta evidenziato: non viene riempito con contenuti non pertinenti.</p></article><article><strong>4 · Stato di erogazione</strong><p><b>Da configurare</b>: manca una mappatura valida. <b>Pronto e-learning</b>: il percorso digitale è configurato. <b>Ibrido</b>: la parte digitale è affiancata da presenza/pratica esterna. <b>Non erogabile</b>: SafetyTraining non deve aprire quel percorso.</p></article></div><div class="admin-note-block"><strong>Regola:</strong> il catalogo SafetyManager decide <em>che corso amministrativo è richiesto</em>; SafetyTraining decide <em>quale versione didattica concreta viene erogata</em>. La preview Learning Unit è supporto alla progettazione, non una pubblicazione automatica.</div></section>`,
    'Blueprint corsi e Master Registry':()=>`<section class="admin-card admin-guide-card" data-admin-guide="blueprint"><h2>Blueprint, Master Registry, regole, libreria e moduli: differenze</h2><div class="admin-guide-grid"><article><strong>Master Registry</strong><p>È il livello di governo: collega i codici corso SafetyManager al blueprint corretto, alla variante e alle regole. Non è una seconda libreria di corsi.</p></article><article><strong>Blueprint</strong><p>È il modello riutilizzabile di una famiglia di corsi: stabilisce sezioni, logica e struttura attesa senza essere ancora la singola edizione erogata.</p></article><article><strong>Varianti e regole</strong><p>Le varianti descrivono forme ammesse per ruolo, settore o durata; le regole scelgono quali parti usare in base a rischio, profilo, pratica e contesto.</p></article><article><strong>Libreria / profili contenuto</strong><p>Sono gruppi di contenuti riusabili recuperati o progettati per comporre percorsi. Non diventano automaticamente corsi ufficiali né generano iscrizioni.</p></article><article><strong>Moduli</strong><p>Sono invece contenitori concreti e ordinati dentro una specifica versione di corso. I moduli contengono le Learning Unit e fanno parte del percorso realmente assegnato.</p></article><article><strong>Altri contenuti</strong><p>DPI, fonti, checklist e materiali di consultazione restano risorse di supporto. Possono aiutare docente/corsista ma non sostituiscono moduli, verifiche o requisiti del percorso.</p></article></div><div class="admin-note-block"><strong>Perché “Parziale”?</strong> Significa che il modello nel Master Registry è stato costruito ma non è stato ancora dichiarato completamente riusabile/chiuso per tutte le varianti. È uno stato del <em>modello di composizione</em>, non necessariamente dello specifico corso: una versione corso può essere già pubblicata mentre il blueprint resta “Parziale”.</div><div class="admin-note-block"><strong>Perché “Ibrido parziale”?</strong> È usato soprattutto per percorsi come primo soccorso/antincendio: una parte può essere gestita digitalmente, mentre pratica/presenza resta separata; inoltre il relativo modello Master Registry non è ancora chiuso in ogni regola/variante. Non indica un errore di caricamento.</div></section>`,
    'Readiness e pubblicabilità corsi':()=>`<section class="admin-card admin-guide-card" data-admin-guide="readiness"><h2>Come leggere la Readiness</h2><div class="admin-guide-grid"><article><strong>Bloccato</strong><p>C’è un impedimento strutturale: versione, moduli, requisito pratico/verifica o test obbligatorio realmente mancante. Va risolto prima di avanzare.</p></article><article><strong>Da configurare</strong><p>La struttura esiste, ma serve una scelta amministrativa/didattica: per esempio percorso di verifica, contenuti dinamici o regole applicabili.</p></article><article><strong>Pronto per revisione</strong><p>Non ci sono hard blocker; resta una revisione umana, una validazione pratica o un controllo richiesto. Non pubblica automaticamente nulla.</p></article><article><strong>Pubblicabile tecnicamente</strong><p>Tutti i gate tecnici risultano soddisfatti. La pubblicazione resta comunque un atto amministrativo esplicito.</p></article><article><strong>Pubblicato</strong><p>La versione è già nello stato pubblicato. Questo non significa che eventuali prove pratiche esterne siano automaticamente completate per ciascun corsista.</p></article><article><strong>Test e banca domande</strong><p>Un test richiesto è valido per la readiness quando è attivo e possiede almeno il numero minimo di domande attive previsto. Il vecchio flag tecnico <code>bank_required</code> non è più usato come falso indicatore di assenza.</p></article></div><div class="admin-note-block"><strong>Ordine di risoluzione:</strong> 1) hard blocker; 2) configurazioni richieste; 3) revisione/validazioni; 4) pubblicazione esplicita. I corsi congelati o fuori roadmap devono restare tali e non vanno “sbloccati” solo per azzerare il contatore.</div><div id="readinessFrozenV21" class="admin-note-block">Controllo corsi congelati…</div></section>`
  };

  async function fillFrozen(){
    const host=document.getElementById('readinessFrozenV21');if(!host||host.dataset.done)return;host.dataset.done='1';
    try{const {data,error}=await db().rpc('get_course_readiness');if(error)throw error;const frozen=(data?.courses||[]).filter(x=>x.frozen);const blocked=frozen.filter(x=>x.readiness_state==='blocked');host.innerHTML=`<strong>Governance congelata:</strong> ${frozen.length} corsi risultano congelati/fuori coda di finalizzazione.${blocked.length?` ${blocked.length} di questi sono ancora “Bloccati” (${blocked.map(x=>esc(x.title)).join('; ')}): è intenzionale finché restano fuori roadmap.`:' Nessun corso congelato è attualmente un hard blocker.'}`;}catch(e){host.textContent='Stato dei corsi congelati non disponibile in questo momento.';}
  }
  /* v22.3.3: read-only dependency preview; never issue DELETE. */
  const previewTypes={'Aziende':['company','companies',[['learners','company_id'],['course_editions','company_id'],['organization_memberships','company_id'],['learner_company_training_history','company_id'],['integration_training_contexts','local_company_id']]],
    'Corsisti':['learner','learners',[['enrollments','learner_id'],['learner_account_invitations','learner_id'],['learner_company_training_history','learner_id']]],
    'Edizioni':['edition','course_editions',[['enrollments','edition_id'],['learner_company_training_history','edition_id'],['integration_training_contexts','local_edition_id']]],
    'Iscrizioni':['enrollment','enrollments',[['learning_events','enrollment_id'],['learning_sessions','enrollment_id'],['learning_progress','enrollment_id'],['test_attempts','enrollment_id'],['question_attempts','enrollment_id'],['enrollment_requirement_evidence','enrollment_id'],['enrollment_practice_assessments_v22','enrollment_id'],['learner_company_training_history','enrollment_id']]]};
  function addDependencyPreviewButtons(title,content){
    const spec=previewTypes[title];if(!spec)return;
    content.querySelectorAll('td').forEach(td=>{
      const source=td.querySelector('button[data-action][data-id]');
      if(!source||td.querySelector('[data-preview-dependency]'))return;
      const b=document.createElement('button');b.type='button';b.className='admin-row-btn';
      b.dataset.previewDependency=spec[0];b.dataset.id=source.dataset.id;
      b.textContent='Verifica eliminazione';b.title='Controllo indicativo delle dipendenze. Non cancella dati.';
      td.append(' ',b);
    });
  }
  async function openDependencyPreview(type,id){
    const spec=Object.values(previewTypes).find(x=>x[0]===type),root=document.getElementById('adminContent');
    if(!spec||!root||!id)return;
    root.querySelector('#adminDependencyPreview')?.remove();
    const section=document.createElement('section');section.id='adminDependencyPreview';section.className='admin-card';
    section.innerHTML='<h2>Verifica eliminazione</h2><p>Controllo dipendenze in corso…</p>';
    root.prepend(section);
    try{
      const client=db();if(!client)throw Error('Sessione non disponibile');
      const {data:row,error:missing}=await client.from(spec[1]).select('id').eq('id',id).maybeSingle();
      if(missing)throw missing;if(!row)throw Error('Record non accessibile');
      const checks=await Promise.all(spec[2].map(async ([table,column])=>{
        const {count,error}=await client.from(table).select('id',{head:true,count:'exact'}).eq(column,id);
        return {table,count,error:error?.message};
      }));
      const affected=checks.filter(x=>x.error||x.count>0);
      if(!section.isConnected)return;
      section.innerHTML='<h2>Verifica eliminazione · '+esc(type)+'</h2><p>'+
        (affected.length?'Attenzione: presenti dipendenze o verifiche incomplete.':'Nessuna dipendenza rilevata nelle sole letture consentite.')+
        '</p><ul>'+checks.map(x=>'<li>'+esc(x.table)+': '+(x.error?'non verificabile':esc(x.count))+'</li>').join('')+
        '</ul><p><strong>Eliminazione definitiva disabilitata.</strong> Questa anteprima non garantisce che il record sia eliminabile: servono controlli transazionali e autorizzazioni server.</p><button type="button" data-close-dependency>Chiudi</button>';
    }catch(e){if(section.isConnected)section.textContent='Verifica non disponibile: '+(e.message||e);}
  }
  function inject(){
    const title=document.getElementById('adminTitle')?.textContent,make=cards[title];
    window.SAFETY_ADMIN_HELP_V22?.sync?.();
    if(!make)return;
    const content=document.getElementById('adminContent');if(!content)return;
    addDependencyPreviewButtons(title,content);
    if(content.querySelector('.admin-guide-card'))return;
    content.insertAdjacentHTML('afterbegin',make());if(title==='Readiness corsi')fillFrozen();
  }
  function schedule(){[80,220,500,900,1500,2400].forEach(ms=>setTimeout(inject,ms));}
  async function boot(){document.addEventListener('click',e=>{
    const b=e.target.closest('[data-preview-dependency]');
    if(b){e.preventDefault();void openDependencyPreview(b.dataset.previewDependency,b.dataset.id);}
    if(e.target.closest('[data-close-dependency]'))document.getElementById('adminDependencyPreview')?.remove();
  });for(let i=0;i<40&&!document.getElementById('adminShell');i++)await new Promise(r=>setTimeout(r,120));document.querySelector('#adminShell .admin-nav')?.addEventListener('click',schedule);document.getElementById('adminRefresh')?.addEventListener('click',schedule);document.addEventListener('click',e=>{if(e.target.closest('[data-sm-course-catalog],#blueprintAdminBtn,#courseReadinessBtn'))schedule();},true);schedule();}
  window.SAFETY_ADMIN_GUIDANCE_V21={inject,version:'21.4'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
