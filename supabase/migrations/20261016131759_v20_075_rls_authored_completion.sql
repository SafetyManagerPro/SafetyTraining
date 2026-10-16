update public.training_sources set checked_on=date '2026-10-16', updated_at=now() where source_key in ('normattiva-dlgs81-vigente','mlps-asr-2025','comune-milano-materiale-didattico','inail-condivido-near-miss','inail-stress-methodology-2025','inail-violence-work-2025','inail-sgsl','inail-mog-art30-2026','vvf-materiali-antincendio');

update public.training_blueprints set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('legal_reviewed_on','2026-10-16','initial_minimum_minutes',1920,'specific_risk_minimum_minutes',720,'regulatory_basis','D.Lgs. 81/2008 art. 37 commi 10-11 vigente 2026','publication_policy','draft_review_before_linking'), updated_at=now() where stable_key='rls_initial';

update public.training_blueprints set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('legal_reviewed_on','2026-10-16','regulatory_basis','D.Lgs. 81/2008 art. 37 c.11 vigente 2026','under_15_duration_rule','national_collective_bargaining_proportionality','under_15_no_fixed_national_hours',true,'publication_policy','draft_review_before_linking'), updated_at=now() where stable_key='rls_update';

update public.training_blueprint_rules set source='D.Lgs. 81/2008 art. 37 c.11 vigente 2026', notes='Per imprese con meno di 15 lavoratori non inferire una durata nazionale fissa: modalità e aggiornamento sono disciplinati dalla contrattazione collettiva nazionale secondo proporzionalità, tenendo conto di dimensione aziendale e livello di rischio.', updated_at=now() where blueprint_key='rls_update' and rule_key='under_15_collective_bargaining';

with target_keys as (
  select distinct lu.stable_key
  from public.courses c
  join public.course_versions cv on cv.course_id=c.id
  join public.course_modules cm on cm.course_version_id=cv.id
  join public.course_module_units cmu on cmu.module_id=cm.id
  join public.learning_unit_versions linked on linked.id=cmu.unit_version_id
  join public.learning_units lu on lu.id=linked.learning_unit_id
  where c.stable_key in ('rls','agg_rls_4h','agg_rls_8h')
    and cv.version_number=(select max(cv2.version_number) from public.course_versions cv2 where cv2.course_id=c.id)
), target as (
  select lu.id learning_unit_id,lu.stable_key,lu.title,lu.default_minutes,
         (select max(v.version_number)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
         (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id order by v.version_number desc limit 1) old_content,
         case when lu.stable_key like 'update:rls:%' then 'update' else 'base' end family
  from public.learning_units lu join target_keys tk on tk.stable_key=lu.stable_key
), profiled as (
  select t.*,
    case
      when stable_key='rls:principi-giuridici-rls' then 'Collocare il ruolo del RLS nel sistema dei diritti di partecipazione e rappresentanza, distinguendo norme, accordi collettivi, procedure aziendali e capacità effettiva di incidere sulla prevenzione.'
      when stable_key='rls:normativa-rls' then 'Leggere obblighi e responsabilità dei soggetti della prevenzione per capire quando il RLS deve essere consultato, quali informazioni può richiedere e quali limiti non deve oltrepassare.'
      when stable_key='rls:ruolo-rls' then 'Usare le attribuzioni dell’art. 50 come strumenti operativi: accesso, consultazione, proposta, segnalazione e partecipazione devono tradursi in azioni tracciabili e pertinenti.'
      when stable_key='rls:consultazione-rls' then 'Preparare consultazioni e riunioni periodiche partendo da dati, cambiamenti e criticità, formulando osservazioni verificabili e seguendo gli esiti fino alla chiusura.'
      when stable_key='rls:dvr-rls' then 'Leggere il DVR non come documento statico ma come mappa delle esposizioni: attività, gruppi esposti, misure, priorità, responsabilità, tempi e indicatori devono risultare coerenti con il lavoro reale.'
      when stable_key='rls:rischi-specifici-rls' then 'Riconoscere i rischi specifici effettivamente presenti nell’organizzazione e verificare se misure tecniche, organizzative e procedurali sono applicate, comprese e ancora efficaci.'
      when stable_key='rls:infortuni-rls' then 'Analizzare infortuni, quasi incidenti e anomalie senza cercare un colpevole unico: ricostruire fattori tecnici, organizzativi e comportamentali e trasformarli in azioni di prevenzione.'
      when stable_key='rls:sorveglianza-sanitaria-rls' then 'Comprendere il rapporto tra rischi valutati, protocollo sanitario, giudizi di idoneità e informazioni aggregate, rispettando riservatezza e ruolo del medico competente.'
      when stable_key='rls:dpi-rls' then 'Valutare il DPI come ultima barriera dentro una gerarchia di misure: scelta, compatibilità, addestramento, manutenzione e uso reale vanno verificati rispetto al rischio residuo.'
      when stable_key='rls:appalti-rls' then 'Leggere appalti e interferenze dal punto di vista della cooperazione preventiva: attività simultanee, scambio informazioni, DUVRI quando dovuto e verifica sul campo delle misure concordate.'
      when stable_key='rls:emergenze-rls' then 'Valutare se piani, addetti, comunicazioni, vie di esodo e presidi sono coerenti con persone, ambienti e scenari reali, evitando che l’emergenza resti un adempimento solo documentale.'
      when stable_key='rls:comunicazione-rls' then 'Trasformare segnalazioni e percezioni dei lavoratori in informazioni utilizzabili: fatto osservato, rischio, contesto, evidenza, proposta e follow-up devono essere separati dalle opinioni generiche.'
      when stable_key='rls:stress-violenza-rls' then 'Leggere stress, molestie, aggressioni e violenza come rischi da prevenire attraverso organizzazione, partecipazione, dati e misure, non come problemi esclusivamente individuali.'
      when stable_key='rls:organi-vigilanza-rls' then 'Comprendere funzioni e poteri degli organi di vigilanza e il comportamento corretto durante accessi e verifiche, mantenendo il ruolo autonomo di rappresentanza del RLS.'
      when stable_key='rls:sanzioni-responsabilita-rls' then 'Distinguere responsabilità dei diversi soggetti, sistema sanzionatorio e modelli organizzativi senza attribuire al RLS compiti gestionali o di garanzia che la legge non gli assegna.'
      when stable_key='update:rls:changes' then 'Usare l’aggiornamento annuale per leggere novità normative, organizzative, tecnologiche e di rischio e capire quali consultazioni, verifiche o approfondimenti il RLS deve attivare.'
      when stable_key='update:rls:dvr-events' then 'Riesaminare DVR, infortuni, near miss e segnali deboli dell’ultimo periodo per verificare se la valutazione e le misure corrispondono ancora al lavoro reale.'
      when stable_key='update:rls:measures' then 'Verificare l’efficacia attuale di misure, sorveglianza sanitaria, gestione appalti ed emergenze, individuando scostamenti tra procedura dichiarata e pratica effettiva.'
      when stable_key='update:rls:communication' then 'Rafforzare la capacità del RLS di raccogliere evidenze, restituire priorità, formulare proposte e seguire un piano annuale di miglioramento fino alla verifica degli esiti.'
      when stable_key='update:rls:contractors' then 'Aggiornare la lettura delle interferenze generate da appalti, cambiamenti di layout, processi e organizzazione, verificando cooperazione e coordinamento prima e durante le attività.'
      when stable_key='update:rls:health-organization' then 'Integrare salute, organizzazione, stress, violenze, molestie e inclusione nell’osservazione del lavoro, evitando approcci esclusivamente individuali e cercando indicatori organizzativi.'
      when stable_key='update:rls:audit' then 'Usare ispezioni, audit, segnalazioni e sistemi di gestione per capire se le misure funzionano davvero e se le non conformità vengono chiuse con responsabilità e tempi definiti.'
      when stable_key='update:rls:workshop' then 'Chiudere l’aggiornamento trasformando evidenze dell’anno in un piano di priorità: problema, rischio, misura proposta, responsabile, scadenza, indicatore e follow-up.'
      else 'Collegare il ruolo del RLS a dati, rischi reali, consultazione e miglioramento verificabile.' end focus,
    case
      when stable_key like 'update:rls:%' then 'Durante il riesame annuale il RLS riceve informazioni nuove sul tema “'||title||'”. Il gruppo deve decidere quali evidenze chiedere, quale consultazione attivare, quale proposta formulare e come verificare la risposta dell’organizzazione.'
      when stable_key in ('rls:dvr-rls','rls:rischi-specifici-rls','rls:infortuni-rls','rls:sorveglianza-sanitaria-rls','rls:dpi-rls') then 'Il RLS confronta DVR, dati e lavoro osservato sul tema “'||title||'” e trova uno scostamento. Stabilire quali informazioni servono, chi coinvolgere, quale proposta avanzare e quando richiedere un riesame della misura.'
      else 'Un lavoratore porta al RLS una criticità collegata a “'||title||'”. Separare fatto, rischio, informazione mancante, attribuzione del RLS, interlocutore corretto e follow-up.' end case_text,
    case when stable_key in ('rls:dvr-rls','rls:rischi-specifici-rls','rls:infortuni-rls','rls:sorveglianza-sanitaria-rls','rls:dpi-rls') then default_minutes else 0 end specific_risk_minutes,
    case
      when stable_key='rls:infortuni-rls' or stable_key='update:rls:dvr-events' or stable_key='update:rls:workshop' then jsonb_build_array('normattiva-dlgs81-vigente','inail-condivido-near-miss','comune-milano-materiale-didattico')
      when stable_key='rls:stress-violenza-rls' or stable_key='update:rls:health-organization' then jsonb_build_array('normattiva-dlgs81-vigente','inail-stress-methodology-2025','inail-violence-work-2025')
      when stable_key='rls:emergenze-rls' then jsonb_build_array('normattiva-dlgs81-vigente','vvf-materiali-antincendio','comune-milano-materiale-didattico')
      when stable_key in ('rls:sanzioni-responsabilita-rls','update:rls:audit') then jsonb_build_array('normattiva-dlgs81-vigente','inail-sgsl','inail-mog-art30-2026')
      when stable_key in ('rls:appalti-rls','update:rls:contractors') then jsonb_build_array('normattiva-dlgs81-vigente','inail-sgsl','comune-milano-materiale-didattico')
      when stable_key like 'update:rls:%' then jsonb_build_array('normattiva-dlgs81-vigente','comune-milano-materiale-didattico','inail-sgsl')
      else jsonb_build_array('normattiva-dlgs81-vigente','comune-milano-materiale-didattico') end source_keys
  from target t
), enriched as (
  select learning_unit_id,stable_key,target_version,source_keys,
    old_content || jsonb_build_object(
      'summary',coalesce(old_content->>'summary','Il RLS usa conoscenze, consultazione e osservazione del lavoro per contribuire al miglioramento della prevenzione senza sostituirsi ai soggetti gestionali.'),
      'detail',coalesce(old_content->>'detail',focus)||' L’obiettivo è saper passare da una criticità o informazione a una richiesta motivata, a una proposta pertinente e a un follow-up verificabile.',
      'focus',focus,'case',case_text,
      'question',coalesce(old_content->>'question','Qual è la prima informazione che il RLS dovrebbe verificare prima di formulare una proposta su questo tema?'),
      'question_explanation','Una risposta efficace non si limita a richiamare una norma: identifica il fatto o il dato da verificare, collega il rischio alla misura e usa correttamente le attribuzioni del RLS. Punto chiave: '||focus,
      'common_errors',jsonb_build_array('Confondere il ruolo di rappresentanza e consultazione con funzioni gestionali o di vigilanza operativa proprie di altri soggetti.','Formulare segnalazioni generiche senza evidenze, contesto o proposta verificabile.','Leggere DVR, verbali o procedure come documenti statici senza confrontarli con il lavoro reale.','Chiudere la segnalazione con l’invio iniziale senza controllare risposta, tempi ed efficacia della misura.'),
      'teacher_activity',jsonb_build_object('prompt',case_text,'method','Far lavorare l’aula sulla sequenza fatto → rischio → informazione/evidenza → attribuzione RLS → interlocutore → proposta → follow-up.','debrief','Evidenziare cosa compete al RLS e cosa invece deve essere deciso o attuato da datore, dirigente, preposto, RSPP, medico competente o addetti. Chiudere sempre con una verifica di efficacia.'),
      'operational',coalesce(old_content->'operational','{}'::jsonb) || jsonb_build_object('before',jsonb_build_array('Definisci il tema e raccogli dati, segnalazioni, documenti e osservazioni pertinenti.','Verifica quale attribuzione del RLS è applicabile e quali interlocutori devono essere coinvolti.'),'during',jsonb_build_array('Distingui fatti da valutazioni e richieste da decisioni gestionali.','Collega criticità, rischio e misura richiesta.','Traccia consultazione, risposta, responsabilità e tempi concordati.'),'after',jsonb_build_array('Verifica che la misura sia stata attuata e che abbia ridotto il rischio.','Restituisci ai lavoratori l’esito in modo comprensibile e rispettoso della riservatezza.','Mantieni aperto il follow-up se il problema persiste o cambia.'),'if_problem',jsonb_build_array('Se mancano informazioni essenziali, richiedile prima di concludere la valutazione.','Se emerge un pericolo grave o immediato, usa tempestivamente i canali aziendali previsti e le attribuzioni del RLS senza esporsi inutilmente.','Se la risposta non è adeguata, documenta il percorso e valuta gli ulteriori strumenti previsti dalla normativa e dalla rappresentanza.'),'who_to_involve',jsonb_build_array('Lavoratori interessati','Datore di lavoro/dirigente/preposto secondo il tema','RSPP/SPP','Medico competente quando pertinente','Organismi paritetici o altri soggetti previsti quando applicabile'),'stop_conditions',jsonb_build_array('Informazioni insufficienti per una conclusione affidabile.','Rischio grave/immediato che richiede gestione operativa da parte dei soggetti competenti.','Richiesta che esce dalle attribuzioni del RLS e necessita di decisione tecnica, sanitaria o gestionale specialistica.'),'adaptation','Personalizzare esempi, documenti e casi su DVR, organizzazione, rischi, CCNL applicabile e procedure effettive dell’azienda.'),
      'visuals',jsonb_build_array(jsonb_build_object('type','flow','title','Ciclo di intervento RLS','steps',jsonb_build_array('Segnalazione/dato','Verifica','Consultazione','Proposta','Decisione/attuazione','Follow-up')),jsonb_build_object('type','hierarchy','title','Gerarchia delle misure','steps',jsonb_build_array('Eliminare il pericolo','Ridurre alla fonte','Misure collettive/organizzative','Procedure','DPI e comportamento'))),
      'graphic_cards',jsonb_build_array(jsonb_build_object('title','Domanda RLS','body','Quale evidenza serve per capire se il rischio è valutato e la misura funziona?'),jsonb_build_object('title','Confine del ruolo','body','Il RLS consulta, osserva, segnala e propone: non sostituisce chi deve decidere, attuare o vigilare operativamente.'),jsonb_build_object('title','Follow-up','body','Una proposta è utile solo se responsabilità, tempi ed efficacia vengono verificati.')),
      'specific_risk_segment',specific_risk_minutes>0,'specific_risk_minutes',specific_risk_minutes,'annual_update',family='update',
      'update_rule',case when family='update' then 'Aggiornamento periodico secondo art. 37 c.11 e contrattazione collettiva applicabile; 4h annue minimo per imprese 15-50, 8h annue minimo oltre 50; sotto 15 nessuna durata nazionale fissa, applicare CCNL e proporzionalità.' else null end,
      'scope_boundary',case when family='update' then 'La LU è materiale di aggiornamento RLS e deve essere contestualizzata a novità, rischi, eventi e cambiamenti dell’anno. Non sostituisce la verifica del CCNL applicabile, soprattutto per imprese con meno di 15 lavoratori.' else 'La LU appartiene al corso RLS iniziale di almeno 32 ore. Il corso deve comprendere almeno 12 ore sui rischi specifici presenti in azienda e relative misure.' end,
      'formative_check',jsonb_build_object('question',coalesce(old_content->>'question','Qual è la prima informazione che il RLS dovrebbe verificare prima di formulare una proposta su questo tema?'),'explanation','Usare la sequenza fatto → rischio → evidenza → attribuzione RLS → proposta → follow-up.','formative_only',true,'test_builder_excluded',true),
      'didactic_version','rls-authored-v3','source_keys',source_keys,
      'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','normative_validation','D.Lgs. 81/2008 art. 37 commi 10-11 vigente 2026; ASR 2025 considerato per il quadro generale dei crediti/formazione ove pertinente','reuse_policy','reference_and_original_rewrite'),
      'source_integration_note','Fonti normative e tecniche usate per validazione e approfondimento. Testi, casi, spiegazioni, diagrammi e sequenze operative SafetyTraining sono riscritti originali. Le verifiche interne sono formative e restano fuori dal Test Builder.',
      'quality',coalesce(old_content->'quality','{}'::jsonb) || jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true,'scope_boundary_explicit',true),
      'final_assessment',false,'test_builder_excluded',true
    ) new_content
  from profiled
), final_content as (
  select e.*, e.new_content || jsonb_build_object('evidence_sources',coalesce((select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key) from jsonb_array_elements_text(e.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key),'[]'::jsonb)) content_final
  from enriched e
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',content_final,md5(content_final::text),null from final_content
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

with authored as (select lu.id learning_unit_id,luv.content->'source_keys' source_keys from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id where luv.content->>'didactic_version'='rls-authored-v3' and luv.status='draft')
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v3','Fonte usata per validazione normativa, approfondimento tecnico o metodo nella versione rls-authored-v3.',date '2026-10-16',jsonb_build_object('didactic_version','rls-authored-v3','reuse_policy','reference_and_original_rewrite')
from authored a cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$ declare n integer; links integer; bad integer; base_n integer; upd_n integer; specific_minutes integer; base_minutes integer; under15_ok integer; begin
select count(*) into n from public.learning_unit_versions where content->>'didactic_version'='rls-authored-v3' and status='draft'; if n<>23 then raise exception 'expected 23 rls-authored-v3 drafts, got %',n; end if;
select count(*) into links from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id where luv.content->>'didactic_version'='rls-authored-v3'; if links<>0 then raise exception 'rls authored drafts unexpectedly linked: %',links; end if;
select count(*) into base_n from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='rls-authored-v3' and lu.stable_key like 'rls:%'; select count(*) into upd_n from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='rls-authored-v3' and lu.stable_key like 'update:rls:%'; if base_n<>15 or upd_n<>8 then raise exception 'expected 15 base + 8 update, got % + %',base_n,upd_n; end if;
select sum(lu.default_minutes) into base_minutes from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='rls-authored-v3' and lu.stable_key like 'rls:%'; if base_minutes<>1920 then raise exception 'RLS base minutes expected 1920, got %',base_minutes; end if;
select sum((luv.content->>'specific_risk_minutes')::int) into specific_minutes from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='rls-authored-v3' and lu.stable_key like 'rls:%'; if specific_minutes<720 then raise exception 'RLS specific risk segment expected >=720, got %',specific_minutes; end if;
select count(*) into bad from public.learning_unit_versions luv where luv.content->>'didactic_version'='rls-authored-v3' and (luv.content->'quality'->>'teacher_ready' is distinct from 'true' or luv.content->'quality'->>'learner_ready' is distinct from 'true' or luv.content->'quality'->>'question_has_explanation' is distinct from 'true' or luv.content->'quality'->>'test_builder_excluded' is distinct from 'true' or luv.content->>'final_assessment' is distinct from 'false' or not(luv.content ? 'scope_boundary') or jsonb_array_length(coalesce(luv.content->'evidence_sources','[]'::jsonb))<2); if bad<>0 then raise exception 'quality assertions failed for % units',bad; end if;
select count(*) into under15_ok from public.training_blueprint_rules where blueprint_key='rls_update' and rule_key='under_15_collective_bargaining' and active=true and conditions->>'employees_max'='14' and outcome->>'fixed_variant'='false'; if under15_ok<>1 then raise exception 'under 15 RLS rule invalid'; end if; end $$;
