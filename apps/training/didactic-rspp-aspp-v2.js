/* SafetyTraining — RSPP/ASPP Moduli A, B, B-SP, C e aggiornamenti — didattica v2.
   ASR 17/04/2025 Rep. 59/CSR. Le durate assegnate alle singole LU sono microprogettazione interna,
   salvo le durate ufficialmente attribuite ai sotto-moduli A1-A5 e C1-C4.
   Modulo A: presenza/VCS/e-learning; B, B-SP e C: presenza/VCS; aggiornamenti: presenza/VCS/e-learning.
   Test Builder finale resta separato e non viene finalizzato da questo layer. */
(() => {
  'use strict';
  const data=window.SAFETY_DATA=window.SAFETY_DATA||[];
  const VERSION='rspp-aspp-v2';
  const norm=s=>String(s||'').toLowerCase();
  const find=id=>data.find(c=>c.id===id);
  const ensure=spec=>{
    let c=find(spec.id);
    if(!c){c={id:spec.id,title:spec.title,icon:spec.icon||'🛡️',topics:[]};data.push(c);}
    Object.assign(c,spec,{topics:c.topics||[]});
    c.didactic_version=VERSION;c.learner_catalog_hidden=true;c.requires_admin_review=true;
    c.disclaimer=(spec.disclaimer||'')+' Le durate delle singole Learning Unit non espressamente fissate dall’Accordo sono una microprogettazione didattica interna e non costituiscono durata normativa per singolo argomento.';
    return c;
  };
  const imgFor=t=>{
    t=norm(t);
    if(t.includes('incend')||t.includes('esplos')) return 'idea-fire-response.svg';
    if(t.includes('chimic')||t.includes('sostanz')) return 'video-chemicals.svg';
    if(t.includes('biologic')) return 'idea-bio-chain.svg';
    if(t.includes('alto')||t.includes('cadut')) return 'idea-working-height-safe.svg';
    if(t.includes('comunic')||t.includes('relaz')) return 'organigramma-sicurezza.svg';
    if(t.includes('dvr')||t.includes('valutaz')) return 'idea-dvr-reading.svg';
    if(t.includes('emerg')) return 'idea-emergency-steps.svg';
    if(t.includes('dpi')||t.includes('protezione')) return 'idea-dpi-hierarchy.svg';
    return 'idea-risk-cycle.svg';
  };
  const iconFor=t=>{
    t=norm(t);
    if(t.includes('incend')) return '🔥'; if(t.includes('chimic')) return '🧪'; if(t.includes('biologic')) return '🦠';
    if(t.includes('comunic')) return '💬'; if(t.includes('valutaz')||t.includes('dvr')) return '📋'; if(t.includes('formaz')) return '🎓';
    if(t.includes('organizz')) return '🏢'; if(t.includes('emerg')) return '🚨'; return '🛡️';
  };
  function richTopic(prefix,u,i,ctx){
    const [code,title,minutes,aim,scenario]=u;
    const id=prefix+String(i+1).padStart(2,'0');
    const objective=aim||`Applicare ${norm(title)} al lavoro reale, collegando dati, pericoli, misure, responsabilità e verifica di efficacia.`;
    const caseText=scenario||`Nel contesto analizzato emergono cambiamenti organizzativi e tecnici che rendono insufficiente una valutazione standard di “${title}”. Come procede RSPP/ASPP?`;
    return {
      id,official_ud:code,title:`${code} · ${title}`,icon:iconFor(title),minutes,visual:'risk',didactic_version:VERSION,
      slide_title:title,summary:objective,
      detail:`L’unità sviluppa “${title}” con approccio professionale RSPP/ASPP: partire dalle condizioni di lavoro, distinguere fonti informative e incertezze, scegliere metodi coerenti, proporre misure secondo gerarchia e verificare che siano attuate ed efficaci. ${ctx||''}`,
      question:`Quali evidenze servono per trasformare “${title}” da conoscenza teorica a decisione prevenzionistica verificabile?`,case:caseText,
      risks:['Analisi formale scollegata dal lavoro reale','Dati incompleti o non rappresentativi','Misure proposte senza priorità, owner o verifica di efficacia'],
      prevention:['Osservare processi ordinari e non ordinari','Usare dati, documenti, eventi e confronto con i lavoratori','Applicare la gerarchia delle misure','Tracciare responsabilità, tempi e criteri di riesame'],
      procedure:['Definisci il contesto','Raccogli evidenze','Individua pericoli ed esposti','Valuta rischio e incertezza','Definisci misure','Assegna responsabilità','Verifica applicazione ed efficacia','Riesamina'],
      teacher_expansion:['Avvio · obiettivo e confini del tema','Mappa delle evidenze necessarie','Metodo tecnico/normativo','Caso applicativo e decisioni','Debrief: errori, misure e criteri di riesame'],
      common_errors:['Copiare valutazioni o procedure senza contestualizzarle.','Confondere conformità documentale con controllo effettivo del rischio.','Proporre DPI prima di aver valutato eliminazione, sostituzione e protezioni collettive.'],
      guided:{observe:['Attività, persone e variabilità','Pericoli, esposizioni e interferenze','Misure esistenti e loro stato','Eventi, anomalie e segnali deboli'],importance:['RSPP/ASPP deve trasformare dati tecnici e organizzativi in supporto decisionale per il sistema di prevenzione.'],apply:['Collegare evidenza, rischio, misura, responsabile e verifica.']},
      operational:{objective,before:['Definire campo e dati minimi necessari','Verificare fonti e aggiornamento delle informazioni'],during:['Confrontare documento e lavoro reale','Rendere esplicite assunzioni e limiti'],after:['Formalizzare azioni, priorità e riesame'],step_by_step:['Contesto','Evidenze','Pericoli','Valutazione','Misure','Owner','Verifica','Riesame'],if_problem:['Dati insufficienti: non forzare conclusioni; pianificare approfondimenti.','Rischio grave: proporre misure immediate e attivare i soggetti con potere decisionale.'],stop_conditions:['Pericolo grave e immediato non controllato','Informazioni essenziali mancanti'],who_to_involve:['Datore/dirigenti/preposti','RLS e lavoratori','Medico competente','Tecnici o specialisti quando necessari'],remember:'Ogni proposta del SPP deve essere comprensibile, motivata, attuabile e verificabile.'},
      discussion_feedback:{answer:['Partire da evidenze reali e definire misure coerenti con priorità e responsabilità.'],case_solution:['Mettere sotto controllo le criticità immediate','Integrare dati mancanti','Riesaminare valutazione e misure','Definire responsabili, scadenze e verifica'],general_solution:['La qualità del SPP si misura nella capacità di trasformare analisi in prevenzione applicata.']},
      idea_images:[{file:imgFor(title),caption:`Supporto visuale per ${title}.`},{file:'modello-farfalla-rischio.svg',caption:'Dal pericolo alle barriere preventive e protettive.'}],
      quiz:{q:`Qual è l’approccio più corretto per “${title}”?`,answers:['Contestualizzare, raccogliere evidenze, definire misure e verificarne l’efficacia.','Usare una soluzione standard senza verificare il contesto.','Limitarsi a registrare il rischio senza proporre un controllo.'],correct:0,explanation:'Il ruolo tecnico del SPP richiede analisi contestualizzata, misure adeguate e verifica dell’efficacia.'},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; art. 32 e Titolo I d.lgs. 81/2008; normativa tecnica applicabile.',
      quality:{score:100,complete:true,version:VERSION,final_assessment:false}
    };
  }

  const a=ensure({id:'rspp_aspp_a',title:'RSPP/ASPP · Modulo A · 28h',icon:'🏛️',duration:'28 h',nominal_minutes:1680,
    subtitle:'Modulo giuridico-istituzionale propedeutico al percorso RSPP/ASPP',delivery_note:'Presenza fisica, videoconferenza sincrona o e-learning consentiti.',attendance_note:'Ammissione alla verifica finale con almeno il 90% di frequenza.',assessment_note:'Verifica finale: test, eventualmente integrato da colloquio. Test Builder globale ancora sospeso.',
    disclaimer:'Le durate A1-A5 (8+4+8+4+4 ore) sono quelle previste dall’Accordo.'});
  const A=[
    ['A1','Approccio alla prevenzione, sistema legislativo, sistema istituzionale, vigilanza e assistenza',480,'Costruire il quadro giuridico-istituzionale necessario per leggere obblighi, responsabilità, vigilanza e supporto alle imprese.','Un’organizzazione riceve prescrizioni ispettive mentre sta modificando processi e ruoli: come distinguere obblighi, soggetti responsabili e azioni di adeguamento?'],
    ['A2','Soggetti del sistema di prevenzione aziendale: compiti, obblighi e responsabilità',240,'Distinguere ruoli, poteri, obblighi, relazioni e limiti operativi dei soggetti della prevenzione.','Una criticità resta irrisolta perché tutti pensano che “sia compito dell’RSPP”: come ricostruire correttamente responsabilità e flussi decisionali?'],
    ['A3','Processo di valutazione dei rischi: metodi, incidenti, interferenze e DVR',480,'Leggere il processo di valutazione come ciclo che integra dati, incidenti, near miss, interferenze, metodologie e programma di miglioramento.','Un DVR è formalmente aggiornato ma non considera una nuova attività in appalto: come impostare il riesame?'],
    ['A4','Misure di prevenzione e protezione, segnaletica, emergenze e sorveglianza sanitaria',240,'Collegare valutazione dei rischi a misure collettive e individuali, emergenze e sorveglianza sanitaria quando prevista.','L’azienda ha aumentato i DPI ma gli incidenti non diminuiscono: quale verifica sulla gerarchia delle misure è necessaria?'],
    ['A5','Consultazione e partecipazione; informazione, formazione e addestramento',240,'Governare consultazione, partecipazione e sviluppo delle competenze come componenti del sistema di prevenzione.','Una nuova procedura è stata inviata via e-mail ma non applicata: come distinguere informazione, formazione, addestramento e verifica sul campo?']
  ];
  a.topics=A.map((u,i)=>richTopic('ra',u,i,'Il Modulo A prepara l’accesso ai moduli successivi e può essere fruito anche in e-learning secondo i requisiti dell’Accordo.'));
  a.modules=A.map((u,i)=>({id:`a${i+1}`,title:`${u[0]} · ${u[1]}`,topic_ids:[`ra${String(i+1).padStart(2,'0')}`],minutes:u[2]}));

  const b=ensure({id:'rspp_aspp_b',title:'RSPP/ASPP · Modulo B comune · 48h',icon:'🔎',duration:'48 h',nominal_minutes:2880,
    subtitle:'Modulo tecnico comune a tutti i settori produttivi; propedeutico agli eventuali B-SP',delivery_note:'Presenza fisica o videoconferenza sincrona. E-learning asincrono non consentito.',attendance_note:'Ammissione alla verifica finale con almeno il 90% di frequenza.',assessment_note:'Verifica finale: test + simulazione. Test Builder globale ancora sospeso.',
    prerequisite_note:'Richiede il Modulo A o il relativo credito/esonero previsto dall’art. 32 e dall’Accordo.'});
  const B=[
    ['UD1','Tecniche specifiche di valutazione dei rischi e analisi degli incidenti',240,'Scegliere tecniche di analisi coerenti con fenomeno, dati disponibili e decisione da supportare.'],
    ['UD2','Organizzazione dei processi produttivi e del lavoro, layout, modelli organizzativi, nuove forme di lavoro e tecnologia',240,'Leggere il rischio come risultato dell’interazione tra processi, spazi, tecnologia, persone e organizzazione.'],
    ['UD3','Ambienti e luoghi di lavoro',240,'Valutare requisiti e condizioni dei luoghi di lavoro, inclusi accessi, percorsi, microclima, ordine e manutenzione.'],
    ['UD4','Rischio incendio, atmosfere esplosive e gestione delle emergenze',240,'Integrare scenari incidentali, prevenzione incendi, ATEX e capacità organizzativa di risposta.'],
    ['UD5','Rischi infortunistici: macchine, elettrico, meccanico, movimentazione/sollevamento, trasporti e lavori in quota',240,'Analizzare i principali rischi di infortunio e costruire misure tecniche, organizzative e procedurali coerenti.'],
    ['UD6','Rischi ergonomici e organizzativi: movimentazione manuale e videoterminali',240,'Riconoscere esposizioni ergonomiche e organizzative e progettare il lavoro per ridurle.'],
    ['UD7','Rischi psicosociali: stress lavoro-correlato, mobbing/burnout, molestie e aggressioni',240,'Integrare fattori psicosociali, indicatori organizzativi e misure di prevenzione primaria.'],
    ['UD8','Agenti fisici',240,'Impostare valutazione e controllo di rumore, vibrazioni, campi, radiazioni e altri agenti fisici pertinenti.'],
    ['UD9','Agenti chimici, cancerogeni, mutageni e amianto',240,'Valutare sostanze ed esposizioni applicando sostituzione, contenimento, procedure, monitoraggio e protezione.'],
    ['UD10','Agenti biologici',240,'Riconoscere catene di esposizione biologica e definire misure tecniche, organizzative, igieniche e sanitarie.'],
    ['UD11','Attività particolari: ambienti confinati, sedi stradali e gestione rifiuti',240,'Gestire attività non ordinarie o ad alta variabilità con autorizzazioni, coordinamento, emergenza e competenze adeguate.'],
    ['UD12','Sostanze psicotrope, stupefacenti e alcol',240,'Conoscere il quadro prevenzionistico e organizzativo collegato ad alcol e sostanze in rapporto a mansioni e sicurezza.']
  ];
  b.topics=B.map((u,i)=>richTopic('rb',u,i,'Il Modulo B deve privilegiare problem solving, analisi, valutazione e pianificazione di interventi, evitando ripetizioni puramente nozionistiche.'));
  b.modules=[{id:'b-common',title:'Modulo B comune · 12 unità tecnico-applicative',topic_ids:b.topics.map(t=>t.id),minutes:2880}];

  const sectorMap=[
    ['rspp_aspp_bsp1','RSPP/ASPP · B-SP1 · Agricoltura, silvicoltura e zootecnia · 16h','A 01-02','dl_spp_agri','🌾'],
    ['rspp_aspp_bsp2','RSPP/ASPP · B-SP2 · Pesca · 12h','A 03','dl_spp_pesca','🎣'],
    ['rspp_aspp_bsp3','RSPP/ASPP · B-SP3 · Costruzioni · 16h','F','dl_spp_costruzioni','🏗️'],
    ['rspp_aspp_bsp5','RSPP/ASPP · B-SP5 · Chimico-petrolchimico · 16h','C 19-20','dl_spp_chimico','⚗️']
  ];
  sectorMap.forEach((s,idx)=>{
    const source=find(s[3]); const minutes=source?.nominal_minutes||([960,720,960,960][idx]);
    const c=ensure({id:s[0],title:s[1],icon:s[4],duration:`${minutes/60} h`,nominal_minutes:minutes,ateco_reference:s[2],subtitle:`Modulo B specialistico per ATECO ${s[2]}`,delivery_note:'Presenza fisica o videoconferenza sincrona. E-learning asincrono non consentito.',attendance_note:'Almeno 90% di frequenza.',assessment_note:'La verifica del Modulo B comprende test e simulazione.',prerequisite_note:'Richiede il Modulo B comune.'});
    c.topics=(source?.topics||[]).map((t,i)=>({...t,id:`${s[0].replace('rspp_aspp_','')}-${String(i+1).padStart(2,'0')}`,didactic_version:VERSION,title:t.title,norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Modulo B specialistico; d.lgs. 81/2008 e normativa specifica applicabile.',quality:{...(t.quality||{}),version:VERSION,shared_sector_lu:true,final_assessment:false}}));
    c.modules=[{id:'sector',title:s[1],topic_ids:c.topics.map(t=>t.id),minutes}];
  });

  const sp4=ensure({id:'rspp_aspp_bsp4',title:'RSPP/ASPP · B-SP4 · Sanità residenziale · 12h',icon:'🏥',duration:'12 h',nominal_minutes:720,ateco_reference:'Q 86.1, 87',
    subtitle:'Modulo B specialistico per servizi ospedalieri e assistenza sociale residenziale',delivery_note:'Presenza fisica o videoconferenza sincrona. E-learning asincrono non consentito.',attendance_note:'Almeno 90% di frequenza.',assessment_note:'La verifica del Modulo B comprende test e simulazione.',prerequisite_note:'Richiede il Modulo B comune.'});
  const SP4=[
    ['UD1','Analisi degli infortuni e malattie professionali del comparto',45],['UD2','Organizzazione del lavoro in ospedali, ambulatori e strutture residenziali',60],['UD3','Normativa tecnica per strutture e impianti',45],['UD4','Macchine e attrezzature di lavoro',45],['UD5','Movimentazione manuale dei carichi e dei pazienti',45],['UD6','Rischio di taglio e puntura',45],['UD7','Agenti chimici, cancerogeni, mutageni e amianto',60],['UD8','Agenti biologici',60],['UD9','Agenti fisici',45],['UD10','Cenni sulle radiazioni ionizzanti',30],['UD11','Rischio incendio e gestione dell’emergenza',45],['UD12','Aggressioni, stress lavoro-correlato e burnout',60],['UD13','Dispositivi di protezione collettiva e individuale',45],['UD14','Atmosfere iperbariche',45],['UD15','Gestione dei rifiuti ospedalieri',45]
  ];
  sp4.topics=SP4.map((u,i)=>richTopic('sp4',u,i,'Il contesto sanitario richiede integrazione tra rischio clinico-organizzativo, esposizioni professionali, continuità assistenziale, igiene, emergenze e protezione degli operatori.'));
  sp4.modules=[{id:'sector',title:'B-SP4 · Sanità residenziale',topic_ids:sp4.topics.map(t=>t.id),minutes:720}];

  const c=ensure({id:'rspp_c',title:'RSPP · Modulo C · 24h',icon:'🧭',duration:'24 h',nominal_minutes:1440,audience:'RSPP only',
    subtitle:'Specializzazione gestionale-relazionale riservata alle funzioni di RSPP',delivery_note:'Presenza fisica o videoconferenza sincrona. E-learning asincrono non consentito.',attendance_note:'Almeno 90% di frequenza.',assessment_note:'Verifica finale: colloquio individuale.',prerequisite_note:'Completa il percorso RSPP insieme ai Moduli A, B comune ed eventuali B-SP applicabili.',disclaimer:'Le durate C1-C4 (8+8+4+4 ore) sono quelle previste dall’Accordo.'});
  const C=[
    ['C1','Informazione, formazione e addestramento; analisi dei fabbisogni e progettazione formativa',480,'Progettare processi formativi coerenti con DVR, fabbisogni, apprendimento degli adulti, metodi, valutazione e registrazioni.','Il piano formativo replica ogni anno gli stessi corsi nonostante siano cambiate mansioni e tecnologie: come si riprogetta partendo dai fabbisogni?'],
    ['C2','Organizzazione e sistemi di gestione della salute e sicurezza',480,'Collegare MOG ex art. 30, d.lgs. 231/2001, ISO 45001, PDCA, audit, riesame e integrazione con altri sistemi.','Un sistema certificato produce molte registrazioni ma le non conformità si ripetono: come distinguere conformità di sistema ed efficacia prevenzionistica?'],
    ['C3','Relazioni e comunicazione: riunioni, negoziazione e gestione dei conflitti',240,'Gestire comunicazione professionale, riunioni, negoziazione e conflitti per far funzionare il sistema di prevenzione.','RSPP e produzione divergono sulle priorità di intervento: come impostare una negoziazione basata su rischio, evidenze e responsabilità?'],
    ['C4','Benessere organizzativo, ergonomia, fattori psicosociali, motivazione e team building',240,'Integrare benessere, ergonomia organizzativa, collaborazione e circolazione delle informazioni nella prevenzione.','Turnover, carichi e conflitti aumentano mentre gli indicatori infortunistici restano stabili: quali segnali anticipatori considerare?']
  ];
  c.topics=C.map((u,i)=>richTopic('rc',u,i,'Il Modulo C sviluppa le competenze gestionali e relazionali necessarie al RSPP, non sostituisce i contenuti tecnici del Modulo B.'));
  c.modules=C.map((u,i)=>({id:`c${i+1}`,title:`${u[0]} · ${u[1]}`,topic_ids:[`rc${String(i+1).padStart(2,'0')}`],minutes:u[2]}));

  function updateCourse(id,title,hours,count,role){
    const minutes=hours*60; const per=minutes/count;
    const uc=ensure({id,title,icon:'🔄',duration:`${hours} h / 5 anni`,nominal_minutes:minutes,dynamic_update:true,renewal_interval_months:60,renewal_anchor:'completion_of_rspp_aspp_module_b_common',
      subtitle:`Aggiornamento quinquennale ${role}: contenuti distribuiti nel quinquennio e costruiti su cambiamenti, rischi ed efficacia del sistema`,delivery_note:'Presenza fisica, videoconferenza sincrona o e-learning consentiti.',attendance_note:'Almeno 90% di frequenza per i singoli eventi formativi computati ai fini dell’aggiornamento.',assessment_note:'Verifica coerente con l’oggetto dell’aggiornamento; se test, almeno 10 domande, 3 alternative, soglia 70%.',
      disclaimer:'La scansione delle LU è una struttura didattica interna e dinamica; il monte ore può essere distribuito nell’arco del quinquennio.'});
    const themes=['Novità normative, tecniche e organizzative','Riesame dei rischi, metodi e dati','Infortuni, near miss, audit e indicatori','Efficacia delle misure e programma di miglioramento','Competenze, comunicazione, consultazione e coordinamento','Approfondimenti specialistici coerenti con i settori seguiti','Sistemi di gestione, organizzazione e cambiamento','Project work e riesame professionale'];
    uc.topics=themes.slice(0,count).map((t,i)=>richTopic(id==='agg_rspp'?'ur':'ua',[`U${i+1}`,t,per,`Aggiornare le competenze ${role} sul tema “${t}” usando evidenze del quinquennio e casi coerenti con gli incarichi effettivi.`,`Nel quinquennio il contesto seguito dal ${role} cambia per tecnologie, appalti e organizzazione: quali evidenze determinano priorità e piano di aggiornamento?`],i,'L’aggiornamento non è ripetizione dei moduli iniziali: seleziona contenuti coerenti con evoluzioni normative, tecniche, organizzative e professionali.'));
    uc.modules=[{id:'dynamic-update',title:`Aggiornamento ${role} · percorso dinamico`,topic_ids:uc.topics.map(t=>t.id),minutes}];
    return uc;
  }
  updateCourse('agg_aspp','Aggiornamento ASPP · 20h / 5 anni',20,5,'ASPP');
  updateCourse('agg_rspp','Aggiornamento RSPP · 40h / 5 anni',40,8,'RSPP');
})();
