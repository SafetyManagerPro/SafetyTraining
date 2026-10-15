-- SafetyTraining v20.036
-- Didactic revision of worker General Training 4h.
-- Keeps LU v1 and course version 1 untouched; creates LU v2 and a draft course version 2.
-- Test Builder/final question banks are intentionally outside this migration.

do $do$
declare
  r record;
  v_lu_id uuid;
  v_course_id uuid;
  v_course_version_id uuid;
  v_module_id uuid;
  v_base jsonb;
begin
  for r in select * from (values
    ('generale:rischio', jsonb_build_object(
      'didactic_version','general-v2',
      'slide_title','Pericolo, rischio e danno: leggere una situazione prima di agire',
      'summary','Il pericolo è ciò che può causare un danno; il rischio nasce quando persone e attività possono essere esposte a quel pericolo. Riconoscerli prima di agire è il primo passo della prevenzione.',
      'detail','Pericolo, esposizione, evento e danno non sono sinonimi. Il rischio cambia in base a chi è esposto, per quanto tempo, con quali modalità e con quali misure già presenti.',
      'question','Guardando il vostro lavoro quotidiano: qual è un pericolo che spesso viene scambiato per il rischio?',
      'case','Una prolunga con guaina lesionata serve per finire un’attività urgente. Un collega propone di usarla solo cinque minuti. Quali elementi devi riconoscere prima di decidere?',
      'teacher','Non iniziare con la definizione. Mostra prima una scena concreta e fai nominare fonte di pericolo, persona esposta, possibile evento, possibile danno e misura.',
      'teacher_expansion',jsonb_build_array('[0–5 min] Apertura con una situazione quotidiana: chiedi che cosa vedono senza usare ancora le parole pericolo e rischio.','[5–13 min] Introduci pericolo, esposizione, rischio, evento e danno partendo dagli esempi emersi.','[13–20 min] Usa la piramide per spiegare perché anomalie e near miss sono segnali da utilizzare prima dell’infortunio.','[20–28 min] Lavora sul caso della prolunga lesionata e fai emergere urgenza e normalizzazione della deviazione.','[28–35 min] Ogni corsista costruisce un esempio pericolo → esposizione → evento → danno → misura.'),
      'teaching_steps',jsonb_build_array('0–5 min · Osservazione scenario','5–13 min · Concetti base','13–20 min · Piramide e near miss','20–28 min · Caso guidato','28–35 min · Applicazione alla mansione'),
      'common_errors',jsonb_build_array('Confondere pericolo e rischio.','Fermarsi alla distrazione del lavoratore senza cercare cause tecniche e organizzative.','Usare la piramide come formula matematica invece che come strumento didattico.'),
      'example_story','In un magazzino una piccola perdita rende il pavimento scivoloso. Per giorni tutti la evitano passando di lato: il problema diventa normale, ma il rischio non diminuisce.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','scene-generale.svg','caption','Scenario da leggere insieme: prima si osserva, poi si decide.'),jsonb_build_object('file','piramide-pericoli.svg','caption','Anomalie e near miss sono segnali utili prima dell’infortunio.'),jsonb_build_object('file','modello-farfalla-rischio.svg','caption','Dove può intervenire la prevenzione prima e dopo l’evento.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    )),
    ('generale:prevenzione-protezione', jsonb_build_object(
      'didactic_version','general-v2','slide_title','Prevenzione e protezione: intervenire prima, non solo difendersi dopo',
      'summary','La prevenzione riduce la probabilità che l’evento accada; la protezione limita l’esposizione o le conseguenze. Le misure vanno scelte secondo una gerarchia, privilegiando interventi alla fonte e protezioni collettive.',
      'detail','Una misura efficace non si sceglie partendo dal DPI. Prima si valuta se il pericolo può essere eliminato o sostituito, poi si interviene con soluzioni tecniche e organizzative; i DPI completano il sistema sul rischio residuo.',
      'question','Se una macchina produce troppo rumore, qual è la prima domanda: quali cuffie compro oppure posso eliminare o ridurre il rumore alla fonte?',
      'case','Una lavorazione rumorosa viene gestita solo consegnando otoprotettori. Come costruiresti una strategia più completa?',
      'teacher','Fai salire la classe lungo la gerarchia delle misure. Ogni proposta deve rispondere a: su cosa agisce, da chi dipende, come verifichiamo che funzioni?',
      'teacher_expansion',jsonb_build_array('[0–5 min] Riparti dal rischio appena riconosciuto e raccogli le prime proposte di soluzione.','[5–12 min] Distingui prevenzione e protezione con esempi concreti.','[12–20 min] Mostra la gerarchia: eliminazione/sostituzione → misure tecniche/collettive → organizzazione → DPI.','[20–30 min] Caso rumore: chiedi una misura per ciascun livello.','[30–35 min] Chiudi sulla verifica dell’efficacia: una misura deve essere applicata, mantenuta e controllata.'),
      'teaching_steps',jsonb_build_array('0–5 min · Brainstorming','5–12 min · Prevenzione vs protezione','12–20 min · Gerarchia delle misure','20–30 min · Caso rumore','30–35 min · Verifica efficacia'),
      'common_errors',jsonb_build_array('Partire dal DPI come unica soluzione.','Confondere una procedura scritta con una misura realmente applicata.','Non verificare nel tempo l’efficacia della misura.'),
      'example_story','Una zona di passaggio è esposta alla caduta di oggetti. Il casco limita una conseguenza; eliminare il passaggio sotto il pericolo o installare una protezione collettiva agisce in modo più robusto.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','idea-dpi-hierarchy.svg','caption','Gerarchia delle misure: il DPI non è il primo gradino.'),jsonb_build_object('file','procedura-operativa-5-fasi.svg','caption','Preparare, controllare, eseguire, verificare e segnalare.'),jsonb_build_object('file','idea-risk-cycle.svg','caption','La misura interrompe la catena tra pericolo, esposizione ed evento.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    )),
    ('generale:organizzazione', jsonb_build_object(
      'didactic_version','general-v2','slide_title','Chi fa cosa: il sistema aziendale della prevenzione',
      'summary','La sicurezza non dipende da una sola persona: datore di lavoro, dirigenti, preposti, lavoratori, RSPP/ASPP, RLS, medico competente e addetti alle emergenze hanno ruoli diversi che devono comunicare tra loro.',
      'detail','Capire i ruoli significa sapere chi decide e organizza, chi vigila sul lavoro, chi supporta tecnicamente, chi rappresenta i lavoratori, chi svolge la sorveglianza sanitaria e chi interviene nelle emergenze.',
      'question','Se vedi una protezione rotta, a chi lo dici? E chi deve poi decidere e organizzare la correzione?',
      'case','Un lavoratore segnala una protezione guasta all’RSPP e pensa che adesso sia responsabilità sua. Che cosa manca in questo ragionamento?',
      'teacher','Usa l’organigramma come mappa delle relazioni. Per ogni figura chiedi: quando la incontriamo nel lavoro reale e che cosa non dobbiamo attribuirle?',
      'teacher_expansion',jsonb_build_array('[0–6 min] Domanda iniziale: chi è responsabile della sicurezza? Mostra perché la domanda è troppo generica.','[6–18 min] Costruisci l’organigramma da datore, dirigente, preposto e lavoratore, poi aggiungi supporto e consultazione.','[18–28 min] Chiarisci gli equivoci: RSPP non è il capo della sicurezza; RLS non gestisce la sicurezza; medico competente non sostituisce il datore.','[28–38 min] Caso protezione guasta: segnalazione → decisione → intervento → verifica.','[38–45 min] Ogni corsista identifica referente operativo e canale reale di segnalazione.'),
      'teaching_steps',jsonb_build_array('0–6 min · Chi è responsabile?','6–18 min · Organigramma','18–28 min · Cosa fa/cosa non fa','28–38 min · Caso segnalazione','38–45 min · Riferimenti reali'),
      'common_errors',jsonb_build_array('Definire l’RSPP come responsabile di tutto.','Confondere preposto e RLS.','Presentare le figure senza spiegare come una segnalazione diventa azione.'),
      'example_story','Un’anomalia viene segnalata a voce durante un turno, ma nessuno sa chi debba prenderla in carico. Il giorno dopo è ancora presente: il problema è anche un flusso organizzativo incompleto.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','organigramma-sicurezza.svg','caption','Ruoli diversi e relazioni diverse nel sistema prevenzionistico.'),jsonb_build_object('file','idea-safety-system.svg','caption','La prevenzione funziona come sistema, non come somma di figure isolate.'),jsonb_build_object('file','stop-segnala-ripristina.svg','caption','Dal problema alla ripresa: segnalazione, presa in carico e verifica.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    )),
    ('generale:diritti-doveri', jsonb_build_object(
      'didactic_version','general-v2','slide_title','Diritti e doveri: la sicurezza è anche comportamento',
      'summary','Il lavoratore deve essere messo nelle condizioni di lavorare in sicurezza e, a sua volta, deve rispettare istruzioni, usare correttamente attrezzature e DPI, non rimuovere protezioni e segnalare pericoli e difetti.',
      'detail','La prevenzione è un patto operativo: l’organizzazione deve fornire misure, informazione, formazione e mezzi adeguati; il lavoratore deve collaborare, applicare le disposizioni ricevute e non trasformare l’esperienza in una licenza a improvvisare.',
      'question','Qual è la differenza tra eseguire un ordine e collaborare alla sicurezza quando noti una condizione pericolosa?',
      'case','Una protezione rallenta una lavorazione. Un collega la rimuove e dice: so quello che faccio, l’ho già fatto cento volte. Come deve reagire chi assiste?',
      'teacher','Evita una lezione centrata sulle sanzioni. Fai emergere cosa deve fare concretamente una persona quando vede un problema e perché la segnalazione è parte del lavoro.',
      'teacher_expansion',jsonb_build_array('[0–5 min] Completa con la classe: un lavoratore ha diritto a… / un lavoratore deve….','[5–15 min] Collega diritti e doveri: formazione e mezzi da una parte; uso corretto, collaborazione e segnalazione dall’altra.','[15–25 min] Caso protezione rimossa: chiedi che cosa deve succedere nei prossimi 30 secondi.','[25–34 min] Usa STOP–SEGNALA–RIPRISTINA–VERIFICA come schema operativo.','[34–40 min] Chiedi quali scorciatoie vengono normalizzate più facilmente nel loro contesto.'),
      'teaching_steps',jsonb_build_array('0–5 min · Diritti/doveri','5–15 min · Patto operativo','15–25 min · Caso protezione rimossa','25–34 min · Stop-segnala-ripristina','34–40 min · Scorciatoie da prevenire'),
      'common_errors',jsonb_build_array('Ridurre l’argomento alle sanzioni.','Far credere che segnalare equivalga a rifiutare il lavoro.','Presentare esperienza e abitudine come sostitutive delle procedure.'),
      'example_story','Un lavoratore esperto usa per mesi una macchina con un microinterruttore manomesso. L’assenza di incidenti rende la deviazione normale agli occhi del gruppo, non sicura.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','rights.svg','caption','Diritti e doveri devono essere letti insieme.'),jsonb_build_object('file','stop-segnala-ripristina.svg','caption','Quando la condizione non è sicura: stop, segnalazione, ripristino, verifica.'),jsonb_build_object('file','procedura-operativa-5-fasi.svg','caption','Una procedura deve guidare il comportamento nel lavoro reale.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    )),
    ('generale:incidenti', jsonb_build_object(
      'didactic_version','general-v2','slide_title','Infortuni, near miss e anomalie: imparare prima che il danno si ripeta',
      'summary','Un near miss e un’anomalia non sono eventi senza importanza: raccontano dove le barriere hanno quasi fallito e permettono di migliorare prima del prossimo evento.',
      'detail','La segnalazione utile descrive fatti, condizioni, sequenza e misure presenti senza cercare subito un colpevole. Lo scopo è capire perché l’evento è stato possibile e quali cambiamenti possono evitare che si ripeta.',
      'question','Quale quasi incidente ricordate che avrebbe potuto avere conseguenze molto diverse con pochi secondi o pochi centimetri di differenza?',
      'case','Un carrello fa retromarcia e un pedone deve spostarsi rapidamente per evitare l’urto. Nessuno si fa male. È sufficiente dire: è andata bene?',
      'teacher','Se possibile usa un near miss reale anonimizzato. Evita il tono sanzionatorio: la finalità è far capire perché segnalare conviene a tutti.',
      'teacher_expansion',jsonb_build_array('[0–5 min] Chiedi se un evento senza feriti conta e raccogli le opinioni.','[5–12 min] Distingui infortunio, near miss e anomalia/condizione pericolosa.','[12–20 min] Mostra la piramide come logica dei segnali precoci, non come legge numerica.','[20–30 min] Caso carrello-pedone: ricostruisci fatti, barriere e possibili cause.','[30–35 min] Una segnalazione è utile solo se produce presa in carico, azione e verifica.'),
      'teaching_steps',jsonb_build_array('0–5 min · Conta anche senza danno?','5–12 min · Infortunio/near miss/anomalia','12–20 min · Segnali deboli','20–30 min · Caso carrello-pedone','30–35 min · Dal report all’azione'),
      'common_errors',jsonb_build_array('Dire errore umano e fermare l’analisi.','Usare il near miss solo per trovare un colpevole.','Raccogliere segnalazioni senza feedback o chiusura delle azioni.'),
      'example_story','Un utensile cade da un ripiano e atterra a pochi centimetri da un lavoratore. Dire solo di fare più attenzione non analizza stoccaggio, spazi e controlli.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','piramide-pericoli.svg','caption','Near miss e anomalie sono segnali da leggere, non episodi da dimenticare.'),jsonb_build_object('file','modello-farfalla-rischio.svg','caption','Ricostruire l’evento significa capire quali barriere sono mancate o hanno fallito.'),jsonb_build_object('file','stop-segnala-ripristina.svg','caption','La segnalazione deve chiudersi con un’azione verificata.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    )),
    ('generale:emergenze-generale', jsonb_build_object(
      'didactic_version','general-v2','slide_title','Emergenza: riconoscere, allertare, evacuare senza improvvisare',
      'summary','Nell’emergenza il lavoratore deve riconoscere l’allarme, seguire le procedure, avvisare correttamente e raggiungere il luogo sicuro. I compiti specialistici spettano agli addetti formati e designati.',
      'detail','La formazione generale non trasforma il lavoratore in addetto antincendio o primo soccorso. Serve a sapere come dare l’allarme, quali vie seguire, quali comportamenti evitare e come facilitare l’intervento degli addetti e dei soccorsi.',
      'question','Se senti l’allarme ma non vedi il pericolo, cerchi personalmente la causa oppure segui la procedura?',
      'case','Durante il lavoro senti odore di bruciato e poi scatta l’allarme. Un collega vuole tornare indietro a recuperare telefono e giacca. Che cosa deve fare il gruppo?',
      'teacher','Adatta questa unità alla procedura reale: tipo di allarme, vie di esodo, punto di raccolta e numeri interni. Non entrare nelle tecniche riservate agli addetti.',
      'teacher_expansion',jsonb_build_array('[0–5 min] Che cosa fareste nei primi 30 secondi? Fai emergere le reazioni istintive.','[5–13 min] Distingui lavoratore e addetto all’emergenza.','[13–22 min] Allarme, arresto in sicurezza se possibile, esodo, punto di raccolta.','[22–30 min] Caso odore di bruciato: ritorno per oggetti, percorsi e comunicazioni.','[30–35 min] Identifica con la classe uscita e punto di raccolta reali se disponibili.'),
      'teaching_steps',jsonb_build_array('0–5 min · Primi 30 secondi','5–13 min · Lavoratore vs addetto','13–22 min · Sequenza di evacuazione','22–30 min · Caso pratico','30–35 min · Procedura reale'),
      'common_errors',jsonb_build_array('Insegnare manovre specialistiche nel modulo generale.','Leggere il piano senza collegarlo agli spazi reali.','Dare per scontato che tutti riconoscano allarme e punto di raccolta.'),
      'example_story','Durante un allarme reale alcune persone continuano a lavorare perché pensano sia un’esercitazione. Una procedura è efficace solo se segnale e comportamento atteso sono già noti.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','idea-emergency-steps.svg','caption','Sequenza essenziale di comportamento in emergenza.'),jsonb_build_object('file','emergency.svg','caption','L’emergenza richiede procedure semplici e note prima dell’evento.'),jsonb_build_object('file','idea-evac-public.svg','caption','L’esodo deve considerare persone, percorsi e condizioni reali.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    )),
    ('generale:segnaletica-generale', jsonb_build_object(
      'didactic_version','general-v2','slide_title','Segnaletica: riconoscere il messaggio e sapere cosa fare',
      'summary','La segnaletica comunica rapidamente un divieto, un obbligo, un avvertimento o un’informazione di emergenza. Orienta il comportamento, ma non sostituisce le misure di sicurezza.',
      'detail','Non serve memorizzare decine di pittogrammi isolati. È più efficace riconoscere forma, colore e funzione delle principali famiglie e collegare il segnale al comportamento richiesto.',
      'question','Quando vedete un segnale, riconoscete prima la categoria oppure provate a ricordare il singolo disegno?',
      'case','Una porta di emergenza è correttamente segnalata ma davanti sono stati lasciati materiali. Il cartello rende comunque sicura la via di esodo?',
      'teacher','Fai un esercizio rapido di riconoscimento per categorie. Non spendere il quarto d’ora in un catalogo di cartelli.',
      'teacher_expansion',jsonb_build_array('[0–3 min] Mostra quattro segnali di categorie diverse e chiedi che tipo di messaggio trasmettono.','[3–8 min] Spiega come forma e colore aiutano a riconoscere la funzione.','[8–12 min] Caso uscita di emergenza ostruita: il segnale non sostituisce la condizione fisicamente sicura.','[12–15 min] Ripasso rapido: categoria → comportamento atteso.'),
      'teaching_steps',jsonb_build_array('0–3 min · Riconoscimento categorie','3–8 min · Forma e colore','8–12 min · Cartello vs condizione reale','12–15 min · Ripasso rapido'),
      'common_errors',jsonb_build_array('Trasformare la segnaletica in un esercizio mnemonico.','Pensare che mettere un cartello elimini il pericolo.','Usare cartelli non coerenti con la situazione reale.'),
      'example_story','Una via di esodo è perfettamente segnalata, ma la porta è bloccata da materiali. Il messaggio è corretto; il sistema di sicurezza no.',
      'idea_images',jsonb_build_array(jsonb_build_object('file','idea-signs-basic.svg','caption','Famiglie principali della segnaletica di sicurezza.'),jsonb_build_object('file','scene-generale.svg','caption','Individua nella scena quali segnali servono e perché.')),
      'quality',jsonb_build_object('score',100,'complete',true,'version','general-v2','classroom_first',true,'final_assessment',false)
    ))
  ) x(stable_key,patch)
  loop
    select id into v_lu_id from public.learning_units where stable_key=r.stable_key;
    if v_lu_id is null then continue; end if;
    select content into v_base from public.learning_unit_versions where learning_unit_id=v_lu_id order by version_number desc limit 1;
    insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at)
    values(v_lu_id,2,'published',coalesce(v_base,'{}'::jsonb)||r.patch,now())
    on conflict (learning_unit_id,version_number) do update
      set status='published',content=excluded.content,published_at=coalesce(public.learning_unit_versions.published_at,now());
    update public.learning_units
      set metadata=metadata||jsonb_build_object('latest_didactic_version','general-v2','didactic_reviewed_at',now()),updated_at=now()
      where id=v_lu_id;
  end loop;

  select id into v_course_id from public.courses where stable_key='generale';
  if v_course_id is not null then
    update public.courses set metadata=metadata||jsonb_build_object(
      'didactic_preview_version','general-v2','didactic_macro_blocks',4,'didactic_atomic_units',7,
      'didactic_focus','classroom_and_teacher_support','final_test_builder_paused',true
    ),updated_at=now() where id=v_course_id;

    insert into public.course_versions(course_id,version_number,status,syllabus_snapshot,normative_snapshot)
    values(v_course_id,2,'draft',
      jsonb_build_object(
        'didactic_version','general-v2',
        'macro_blocks',jsonb_build_array(
          jsonb_build_object('key','lg01','title','Capire il rischio e scegliere le misure','minutes',70),
          jsonb_build_object('key','lg02','title','Il sistema aziendale della prevenzione','minutes',45),
          jsonb_build_object('key','lg03','title','Diritti, doveri e comportamenti sicuri','minutes',40),
          jsonb_build_object('key','lg04','title','Segnalare, reagire e orientarsi in emergenza','minutes',85)
        ),
        'atomic_learning_units',7,'total_minutes',240,'purpose','classroom_and_teacher_support','final_assessment_in_scope',false
      ),
      jsonb_build_object('basis','D.Lgs. 81/2008 art. 37; Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR','duration_minutes',240)
    )
    on conflict (course_id,version_number) do update set status='draft',syllabus_snapshot=excluded.syllabus_snapshot,normative_snapshot=excluded.normative_snapshot
    returning id into v_course_version_id;

    delete from public.course_module_units where module_id in (select id from public.course_modules where course_version_id=v_course_version_id);
    delete from public.course_modules where course_version_id=v_course_version_id;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'lg01','LG01 · Capire il rischio e scegliere le misure',0,70) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,jsonb_build_object('didactic_version','general-v2')
    from (values ('generale:rischio',1),('generale:prevenzione-protezione',2)) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key
    join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=2;

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'lg02','LG02 · Il sistema aziendale della prevenzione',70,45) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,1,true,0,true,jsonb_build_object('didactic_version','general-v2')
    from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=2
    where lu.stable_key='generale:organizzazione';

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'lg03','LG03 · Diritti, doveri e comportamenti sicuri',115,40) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,1,true,0,true,jsonb_build_object('didactic_version','general-v2')
    from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=2
    where lu.stable_key='generale:diritti-doveri';

    insert into public.course_modules(course_version_id,module_key,title,position,nominal_minutes)
    values(v_course_version_id,'lg04','LG04 · Segnalare, reagire e orientarsi in emergenza',155,85) returning id into v_module_id;
    insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
    select v_module_id,luv.id,x.pos,true,0,true,jsonb_build_object('didactic_version','general-v2')
    from (values ('generale:incidenti',1),('generale:emergenze-generale',2),('generale:segnaletica-generale',3)) x(key,pos)
    join public.learning_units lu on lu.stable_key=x.key
    join public.learning_unit_versions luv on luv.learning_unit_id=lu.id and luv.version_number=2;
  end if;
end $do$;
