/* SafetyTraining — DL-RSPP moduli tecnico-integrativi ASR 17/04/2025.
   Quattro percorsi separati dal modulo comune 8h. Le durate attribuite alle singole LU
   sono una microprogettazione interna: l'Accordo prescrive durata complessiva e contenuti minimi,
   non una durata per ciascuna UD. E-learning asincrono non consentito. */
(() => {
  'use strict';
  const data = window.SAFETY_DATA = window.SAFETY_DATA || [];
  const VERSION='dl-rspp-sector-v2';

  const sectors=[
    {
      id:'dl_spp_agri', icon:'🌾', title:'DL-RSPP · Modulo integrativo 1 · Agricoltura, silvicoltura e zootecnia', duration:'16 h', minutes:960,
      ateco:'A 01-02', sector:'Agricoltura, silvicoltura e zootecnia',
      context:'serre, campi, boschi, allevamenti, strutture rurali e lavorazioni con forte variabilità ambientale',
      caseBase:'Un’azienda amplia le lavorazioni stagionali, introduce una nuova attrezzatura e ricorre a personale temporaneo. Quali rischi, misure e verifiche devono essere riesaminati prima dell’avvio?',
      units:[
        ['UD1','Analisi degli infortuni e malattie professionali del comparto',60],
        ['UD2','Organizzazione del lavoro: ambienti di lavoro (serre, campi, boschi, ecc.)',90],
        ['UD3','Normativa tecnica per strutture e impianti',90],
        ['UD4','Rischi legati all’utilizzo di macchine e attrezzature di lavoro: ribaltamento, schiacciamento e altri eventi',150],
        ['UD5','Sostanze pericolose',90],
        ['UD6','Agenti biologici',60],
        ['UD7','Agenti fisici',90],
        ['UD8','Ambienti confinati e/o sospetti di inquinamento',90],
        ['UD9','Rischio incendio e gestione dell’emergenza',60],
        ['UD10','Rischio di caduta dall’alto',90],
        ['UD11','Movimentazione dei carichi',90]
      ]
    },
    {
      id:'dl_spp_pesca', icon:'🎣', title:'DL-RSPP · Modulo integrativo 2 · Pesca', duration:'12 h', minutes:720,
      ateco:'A 03', sector:'Pesca',
      context:'unità da pesca, aree di bordo, lavorazioni a terra, movimentazione, attrezzature e condizioni meteo-marine variabili',
      caseBase:'Durante una campagna di pesca cambiano equipaggio, condizioni meteo, sequenza delle lavorazioni e assetto dei carichi. Come deve essere riesaminato il sistema di prevenzione?',
      units:[
        ['UD1','Analisi degli infortuni e malattie professionali del comparto',60],
        ['UD2','Legislazione specifica di riferimento',45],
        ['UD3','Organizzazione del lavoro: ambienti di lavoro',60],
        ['UD4','Normativa tecnica per strutture e impianti',45],
        ['UD5','Rischi legati all’utilizzo di macchine e attrezzature di lavoro',60],
        ['UD6','Sostanze pericolose',45],
        ['UD7','Agenti biologici',45],
        ['UD8','Agenti fisici',45],
        ['UD9','Ambienti confinati e/o sospetti di inquinamento',60],
        ['UD10','Rischio incendio e gestione dell’emergenza',45],
        ['UD11','Rischio cadute dall’alto, a bordo e fuori bordo',60],
        ['UD12','Movimentazione dei carichi',60],
        ['UD13','Atmosfere iperbariche e attività subacquee',90]
      ]
    },
    {
      id:'dl_spp_costruzioni', icon:'🏗️', title:'DL-RSPP · Modulo integrativo 3 · Costruzioni', duration:'16 h', minutes:960,
      ateco:'F', sector:'Costruzioni',
      context:'cantieri temporanei o mobili, lavorazioni interferenti, imprese e autonomi, opere provvisionali, scavi, impianti e viabilità',
      caseBase:'Il cronoprogramma viene modificato e due lavorazioni prima separate diventano contemporanee nella stessa area. Quali documenti, coordinamenti e misure devono essere riesaminati prima di proseguire?',
      units:[
        ['UD1','Soggetti definiti dal Titolo IV capo I e relativi obblighi e responsabilità',60],
        ['UD2','Analisi degli infortuni e malattie professionali del comparto',45],
        ['UD2-b','Organizzazione, tecniche e fasi lavorative, aree di lavoro dei cantieri',60],
        ['UD3','Misure generali di tutela secondo l’art. 95 del d.lgs. 81/2008',45],
        ['UD4','Piano operativo di sicurezza (POS)',60],
        ['UD5','Cenni sul PSC',45],
        ['UD6','Cadute dall’alto e opere provvisionali',60],
        ['UD7','Lavori di demolizione e scavo',60],
        ['UD8','Impianti elettrici e illuminazione di cantiere',45],
        ['UD9','Rischi legati all’utilizzo di macchine e attrezzature di lavoro',60],
        ['UD10','Movimentazione dei carichi manuale e meccanica',45],
        ['UD11','Sostanze pericolose',45],
        ['UD12','Agenti biologici',45],
        ['UD13','Agenti fisici',45],
        ['UD14','Rischio incendio ed esplosione',60],
        ['UD15','Dispositivi di protezione collettiva e individuali',45],
        ['UD16','Attività su sedi stradali',60],
        ['UD17','Esempi e analisi di un POS',75]
      ]
    },
    {
      id:'dl_spp_chimico', icon:'⚗️', title:'DL-RSPP · Modulo integrativo 4 · Chimico-petrolchimico', duration:'16 h', minutes:960,
      ateco:'C 19-20', sector:'Chimico-petrolchimico',
      context:'processi continui e batch, impianti, sostanze pericolose, manutenzioni, fornitori, scenari di incendio/esplosione e gestione dei rifiuti',
      caseBase:'Durante una fermata impianto entrano più fornitori, vengono aperte linee di processo e cambiano le condizioni operative. Quali barriere e autorizzazioni devono essere verificate prima dei lavori?',
      units:[
        ['UD1','Analisi degli infortuni e malattie professionali del comparto',60],
        ['UD2','Processo produttivo, organizzazione del lavoro e ambienti di lavoro',90],
        ['UD3','Normativa tecnica per strutture e impianti',60],
        ['UD4','Cenni sulle attività a rischio di incidente rilevante',60],
        ['UD5','Cenni sulle industrie insalubri',45],
        ['UD6','Rischi legati agli impianti e alle attrezzature di lavoro',90],
        ['UD7','Manutenzione impianti e gestione fornitori',90],
        ['UD8','Sostanze pericolose',120],
        ['UD9','Agenti fisici',60],
        ['UD10','Rischi incendio ed esplosioni e gestione dell’emergenza',90],
        ['UD11','Ambienti confinati e/o sospetti di inquinamento',75],
        ['UD12','Dispositivi di protezione collettiva ed individuali',75],
        ['UD13','Gestione dei rifiuti',45]
      ]
    }
  ];

  const lower=s=>String(s||'').toLowerCase();
  const imgFor=title=>{
    const t=lower(title);
    if(t.includes('incend')||t.includes('esplos')) return ['idea-fire-response.svg','idea-emergency-steps.svg'];
    if(t.includes('cadut')||t.includes('alto')) return ['idea-working-height-safe.svg','idea-dpi-hierarchy.svg'];
    if(t.includes('biologic')) return ['idea-bio-chain.svg','idea-dpi-hierarchy.svg'];
    if(t.includes('sostanze')||t.includes('chimic')) return ['video-chemicals.svg','idea-dpi-hierarchy.svg'];
    if(t.includes('pos')||t.includes('psc')) return ['idea-dvr-reading.svg','procedura-operativa-5-fasi.svg'];
    if(t.includes('stradal')) return ['idea-road-safety.svg','idea-signs-basic.svg'];
    if(t.includes('carichi')) return ['idea-risk-cycle.svg','idea-dpi-hierarchy.svg'];
    if(t.includes('confinat')) return ['stop-segnala-ripristina.svg','idea-emergency-steps.svg'];
    if(t.includes('fisici')) return ['video-stop-noise.svg','idea-risk-cycle.svg'];
    return ['idea-risk-cycle.svg','piramide-pericoli.svg'];
  };
  const iconFor=title=>{
    const t=lower(title);
    if(t.includes('incend')||t.includes('esplos')) return '🔥';
    if(t.includes('cadut')||t.includes('alto')) return '🪜';
    if(t.includes('sostanze')) return '🧪';
    if(t.includes('biologic')) return '🦠';
    if(t.includes('macchine')||t.includes('attrezzature')) return '⚙️';
    if(t.includes('pos')||t.includes('psc')) return '📋';
    if(t.includes('infortuni')) return '📊';
    if(t.includes('carichi')) return '📦';
    if(t.includes('confinat')) return '🕳️';
    if(t.includes('stradal')) return '🚧';
    return '🛡️';
  };

  function makeTopic(sec,u,i){
    const [ud,title,minutes]=u;
    const imgs=imgFor(title);
    const code=sec.id.replace('dl_spp_','').toUpperCase()+'-'+String(i+1).padStart(2,'0');
    return {
      id:sec.id.replace('dl_spp_','')+String(i+1).padStart(2,'0'),
      official_ud:ud, title:`${ud} · ${title}`, icon:iconFor(title), minutes, visual:'risk', didactic_version:VERSION,
      slide_title:title,
      summary:`Applicare ${lower(title)} al contesto reale del settore ${sec.sector}, collegando pericoli, esposizioni, misure, responsabilità e verifica dell’efficacia.`,
      detail:`La trattazione parte dalle condizioni effettive di ${sec.context}. Il docente collega il tema “${title}” ai processi di valutazione del rischio, alle misure tecniche e organizzative, alla documentazione pertinente e ai trigger di riesame.`,
      question:`Quali condizioni del settore ${sec.sector} rendono il tema “${title}” diverso da una trattazione generica?`,
      case:sec.caseBase,
      risks:[`Valutazione di “${title}” non contestualizzata alle attività reali`,`Cambiamenti operativi non intercettati dal riesame`,`Misure presenti ma non verificate nella loro efficacia`],
      prevention:['Osservare attività ordinarie e non ordinarie','Applicare la gerarchia delle misure','Definire responsabilità, controlli e criteri di riesame','Coinvolgere competenze specialistiche quando necessarie'],
      procedure:['Descrivi attività e scenario','Individua pericoli ed esposti','Verifica requisiti e dati','Definisci misure','Assegna responsabilità','Controlla applicazione','Riesamina dopo cambiamenti o eventi'],
      teacher_expansion:[`Avvio · contesto e obiettivi (${code})`,`Analisi tecnica e normativa del tema`,`Caso applicativo di settore`,`Scelte di prevenzione e protezione`,`Debrief: evidenze e trigger di riesame`],
      common_errors:['Trasferire una soluzione standard senza verificare il contesto.','Confondere presenza della procedura con efficacia della misura.'],
      guided:{observe:['Attività reali','Esposizioni e interferenze','Misure esistenti','Scostamenti ed eventi'],importance:[`Nel settore ${sec.sector} il rischio cambia con ambiente, organizzazione e fasi operative.`],apply:['Collegare il tema a DVR, procedure, controlli e programma di miglioramento.']},
      operational:{objective:`Governare “${title}” nel settore ${sec.sector}.`,before:['Raccogli dati tecnici, organizzativi e documentali'],during:['Verifica condizioni reali e misure attive'],after:['Documenta esiti e azioni di miglioramento'],step_by_step:['Contesto','Pericoli','Esposti','Misure','Responsabilità','Controllo','Riesame'],if_problem:['Se mancano dati affidabili, dichiarare l’incertezza e attivare approfondimenti.'],stop_conditions:['Condizione grave e immediata non controllata'],who_to_involve:['Datore-DL/RSPP','Preposti e lavoratori','RLS','Medico competente o tecnico specialista quando pertinente'],remember:'Il modulo specialistico integra il modulo comune: non lo sostituisce.'},
      discussion_feedback:{answer:[`Contestualizzare ${lower(title)} a processi, persone, ambiente e variabilità del settore.`],case_solution:['Mettere in sicurezza le condizioni critiche','Riesaminare valutazione e interferenze','Aggiornare misure, responsabilità e verifiche'],general_solution:['Dal rischio reale alla misura verificabile e al riesame.']},
      idea_images:[{file:imgs[0],caption:`Supporto visuale per ${title}.`},{file:imgs[1],caption:'Gerarchia, controllo e riesame delle misure.'}],
      quiz:{q:`Qual è l’approccio corretto a “${title}” nel modulo specialistico?`,answers:['Valutarlo nel contesto reale del settore e collegarlo a misure e verifica di efficacia.','Usare una procedura standard senza ulteriori verifiche.','Rimandare l’analisi fino a quando si verifica un evento.'],correct:0,explanation:'Il modulo specialistico serve a contestualizzare e rendere operative le competenze del modulo comune.'},
      quality:{score:100,complete:true,version:VERSION,classroom_first:true,final_assessment:false},
      norm:'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte II punto 4; d.lgs. 81/2008 e normativa specifica applicabile.'
    };
  }

  sectors.forEach(sec=>{
    let course=data.find(c=>c.id===sec.id);
    if(!course){ course={id:sec.id,title:sec.title,icon:sec.icon,topics:[]}; data.push(course); }
    course.title=sec.title; course.icon=sec.icon; course.duration=sec.duration; course.nominal_minutes=sec.minutes;
    course.didactic_version=VERSION; course.ateco_reference=sec.ateco; course.learner_catalog_hidden=true;
    course.subtitle=`${sec.duration} · modulo tecnico-integrativo per ATECO ${sec.ateco}, da aggiungere al modulo comune DL-RSPP 8h quando applicabile.`;
    course.disclaimer='Le durate delle singole Learning Unit sono una microprogettazione didattica interna. I contenuti minimi e la durata complessiva del modulo derivano dall’Accordo; la verifica finale resta separata.';
    course.delivery_note='Erogazione consentita in presenza o videoconferenza sincrona; e-learning asincrono non consentito per il corso DL-RSPP.';
    course.prerequisite_note='Percorso specialistico collegato al modulo comune DL-RSPP. Applicare esclusivamente quando il settore ATECO di riferimento è pertinente.';
    course.attendance_note='Frequenza minima: 90% delle ore previste.';
    course.assessment_note='La verifica finale del percorso DL-RSPP resta gestita separatamente dal layer Aula/Docente.';
    course.topics=sec.units.map((u,i)=>makeTopic(sec,u,i));
    course.modules=[{id:`${sec.id}-sector`,title:`Modulo tecnico-integrativo · ${sec.sector}`,topic_ids:course.topics.map(t=>t.id),minutes:sec.minutes,start_minute:0,end_minute:sec.minutes}];
  });
})();
