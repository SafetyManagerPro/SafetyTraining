-- v20.082: Datore di lavoro - modulo aggiuntivo Cantieri 6h authored completion
-- Live migration: 20261016163358
-- Scope: employer/impresa affidataria only. Dirigente variant unchanged.
-- Publication policy: draft only; no automatic relinking; Test Builder remains paused.

update public.training_sources
set checked_on=date '2026-10-16',updated_at=now()
where source_key in ('mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss','inail-costruzioni-dati-2026');

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'legal_reviewed_on','2026-10-16',
 'employer_content_ready',true,
 'employer_candidate_didactic_version','datore-cantieri-authored-v3',
 'employer_minimum_minutes',360,
 'employer_required_context','entrusted_company',
 'employer_prerequisite_blueprint','employer_initial',
 'employer_delivery_modes',jsonb_build_array('physical','synchronous_video','asynchronous_elearning'),
 'employer_update_includes_construction_if_conditions_persist',true,
 'employer_publication_policy','draft_review_before_linking',
 'employer_test_builder_scope','paused_excluded'
),updated_at=now()
where stable_key='employer_construction_addon';

update public.training_blueprint_variants
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'legal_reviewed_on','2026-10-16','content_ready',true,
 'didactic_candidate','datore-cantieri-authored-v3',
 'minimum_minutes',360,'audience_role','employer','construction_role','entrusted_company',
 'prerequisite_blueprint','employer_initial',
 'delivery_modes',jsonb_build_array('physical','synchronous_video','asynchronous_elearning'),
 'final_verification','test_or_interview','test_minimum_questions',30,'test_minimum_options',3,'test_passing_score_pct',70,
 'test_builder_scope','paused_excluded','auto_materialize',false,'auto_publish',false,'auto_relink',false
),updated_at=now()
where blueprint_key='employer_construction_addon' and variant_key='employer';

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'legal_reviewed_on','2026-10-16','content_review_ready',true,
 'candidate_didactic_versions',jsonb_build_array('datore-cantieri-authored-v3'),
 'official_minimum_minutes',360,'prerequisite_blueprint','employer_initial','prerequisite_course_key','dl_base',
 'construction_role_required','entrusted_company',
 'delivery_modes',jsonb_build_array('physical','synchronous_video','asynchronous_elearning'),
 'update_includes_construction_if_conditions_persist',true,
 'publication_policy','draft_review_before_linking','final_test_builder_paused',true,
 'auto_publish',false,'auto_relink',false
),updated_at=now()
where stable_key='mod_cantieri';

insert into public.training_blueprint_rules(blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes,active)
values('employer_construction_addon','requires_employer_initial','employer','eligibility',4,
       jsonb_build_object('audience_role','employer','construction_role','entrusted_company'),
       jsonb_build_object('requires',jsonb_build_array('employer_initial')),
       'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte II punto 3',
       'Il modulo Cantieri integra il corso Datore di lavoro e non lo sostituisce.',true)
on conflict (blueprint_key,rule_key) do update set variant_key=excluded.variant_key,rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=excluded.active,updated_at=now();

with profiles(stable_key,focus,case_text,question_text,explanation_text,boundary,source_keys) as (
values
('roles:cantiere:subjects-obligations',
 'Collocare il datore dell’impresa affidataria nella rete del Titolo IV e distinguere obblighi propri, obblighi di committente/CSE, compiti di imprese esecutrici e lavoratori autonomi. Il punto operativo è sapere chi deve essere coinvolto e quale verifica non può essere data per presunta.',
 'L’impresa affidataria inserisce due nuove esecutrici a cantiere avviato. I referenti sono noti solo informalmente e il cronoprogramma cambia dalla settimana successiva. Costruire la sequenza di verifiche e comunicazioni che deve precedere l’avvio.',
 'Quali controlli e flussi restano in capo all’impresa affidataria quando l’attività materiale è svolta da altre imprese?',
 'La risposta deve distinguere affidamento dell’esecuzione e responsabilità di governo dell’impresa affidataria: ruoli, idoneità/organizzazione, coordinamento, verifica delle condizioni affidate e follow-up non possono essere sostituiti dalla sola presenza di contratti o documenti.',
 'Il modulo non trasferisce al Datore funzioni proprie di committente, responsabile dei lavori o CSE; insegna invece a governare correttamente gli obblighi dell’impresa affidataria e i punti di interfaccia.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:plans-psc-pos',
 'Leggere PSC e POS come strumenti di governo del lavoro reale: finalità, tempi, contenuti e soprattutto coerenza con fase, area, metodo, interferenze e organizzazione. La presenza formale del documento non equivale a congruenza.',
 'Il POS colloca una lavorazione in zona A, ma il programma la sposta in zona B dove opera un’altra impresa e il PSC non descrive quella contemporaneità. Decidere cosa deve essere riallineato prima del GO.',
 'Quale evidenza dimostra che PSC e POS sono ancora utilizzabili quando cambia una fase di cantiere?',
 'Occorre confrontare documenti e realtà: lavorazioni, aree, sequenze, interferenze, misure e responsabilità devono restare coerenti. Se il cambiamento modifica questi elementi, il riesame precede l’avvio e non lo segue.',
 'La LU sviluppa capacità di lettura e verifica del Datore dell’impresa affidataria; non sostituisce i compiti di redazione, coordinamento o verifica attribuiti ad altri soggetti dal Titolo IV.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:art95-art96',
 'Tradurre gli artt. 95 e 96 in condizioni organizzative osservabili: ordine del cantiere, accessi, viabilità, stoccaggi, protezioni, manutenzione, gestione dei materiali e organizzazione delle lavorazioni devono essere mantenuti, non solo progettati.',
 'Dopo alcune settimane depositi e rifiuti restringono i passaggi, un parapetto è stato rimosso per movimentare materiali e pedoni e mezzi condividono un accesso. Definire priorità, owner, STOP e verifica di ripristino.',
 'Quando una deviazione organizzativa richiede correzione immediata anziché essere trattata come semplice rilievo da verbale?',
 'Quando degrada una misura essenziale o crea esposizione non controllata, il rilievo deve produrre messa in sicurezza, assegnazione e verifica del ripristino. Gli artt. 95 e 96 diventano così criteri di gestione quotidiana.',
 'Il Datore deve governare gli obblighi applicabili alla propria impresa senza sostituire il preposto nella vigilanza operativa o il CSE nelle funzioni di coordinamento previste dalla legge.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:cronoprogramma',
 'Usare il cronoprogramma come mappa temporale delle interferenze: anticipi, ritardi, sovrapposizioni e cambi di sequenza sono trigger di riesame delle misure prima di diventare problemi produttivi o incidenti.',
 'Per recuperare ritardo una fase viene anticipata e si sovrappone a sollevamenti e transito mezzi. Il responsabile di produzione propone di “gestirla sul posto”. Stabilire il safety gate prima della variazione.',
 'Quale modifica del cronoprogramma può essere approvata senza riesame della sicurezza e quale invece deve bloccare l’avvio?',
 'Le variazioni irrilevanti per esposizioni e interferenze possono non richiedere nuove misure; quando cambiano contemporaneità, spazi, accessi, mezzi o protezioni, serve un riesame esplicito prima dell’autorizzazione.',
 'Il cronoprogramma è trattato come strumento prevenzionistico e di coordinamento, non come sostituto del PSC o delle decisioni del CSE quando previste.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:condition-verification',
 'Verificare le condizioni di sicurezza dei lavori affidati e l’applicazione delle prescrizioni del PSC con un ciclo chiuso: criterio, osservazione, scostamento, messa in sicurezza, owner, scadenza, evidenza di ripristino e chiusura.',
 'Durante un sopralluogo manca una protezione collettiva prevista. Il preposto promette il ripristino entro sera ma la lavorazione prosegue. Stabilire cosa deve accadere subito e quale prova serve per chiudere il rilievo.',
 'Quando una verifica delle condizioni di sicurezza può essere considerata realmente chiusa?',
 'Non al momento del rilievo né alla sola assegnazione: la chiusura richiede che il rischio sia controllato, l’azione sia attuata e l’efficacia sia verificata. Se manca una barriera essenziale, il lavoro interessato non continua come se nulla fosse.',
 'La verifica dell’impresa affidataria non sostituisce la vigilanza di preposti/dirigenti né le attribuzioni del CSE; deve però produrre evidenze e azioni coerenti con il proprio ruolo.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:pos-analysis-coordination',
 'Integrare verifica di congruenza dei POS, PSC, cronoprogramma e condizioni reali prima dell’avvio di una nuova fase, trasformando l’analisi documentale in una decisione GO/NO-GO tracciabile.',
 'Una nuova esecutrice presenta un POS formalmente completo, ma il metodo differisce dal PSC, la fase si sovrappone a un’altra impresa e l’area non è libera. Costruire la sequenza di riallineamento e la decisione finale.',
 'Quali incoerenze rendono un POS non congruo anche se tutte le sezioni obbligatorie risultano compilate?',
 'La congruenza è sostanziale: metodo, rischi, misure, area, sequenza, interferenze e organizzazione devono raccontare la stessa situazione del PSC e del cantiere reale. Le incoerenze aperte impediscono il GO.',
 'L’esercitazione sviluppa capacità decisionale del Datore dell’impresa affidataria e non trasferisce compiti propri del CSE o di altri soggetti del Titolo IV.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss','inail-costruzioni-dati-2026']::text[])
), target as (
 select lu.id learning_unit_id,lu.stable_key,lu.title,lu.default_minutes,
        (select coalesce(max(v.version_number),0)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
        (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id order by v.version_number desc limit 1) old_content,
        p.focus,p.case_text,p.question_text,p.explanation_text,p.boundary,p.source_keys
 from public.learning_units lu join profiles p on p.stable_key=lu.stable_key
), built as (
 select t.*,coalesce(t.old_content,'{}'::jsonb)||jsonb_build_object(
   'summary','Nel modulo aggiuntivo Cantieri del Datore dell’impresa affidataria, “'||regexp_replace(t.title,'^CANT[0-9]+ · ','')||'” viene trattato come processo decisionale verificabile, non come adempimento documentale.',
   'detail',t.focus||' Ogni scelta viene collegata a responsabilità, interfacce tra soggetti, evidenze, condizioni di STOP e verifica dell’efficacia.',
   'focus',t.focus,'case',t.case_text,'question',t.question_text,'question_explanation',t.explanation_text,
   'procedure',jsonb_build_array('Definisci fase, impresa e area','Mappa soggetti e documenti applicabili','Confronta piano e lavoro reale','Individua scostamenti e interferenze','Scegli misura e owner','Definisci GO/STOP','Verifica attuazione','Chiudi o riesamina'),
   'common_errors',jsonb_build_array('Controllare la presenza dei documenti senza verificarne la congruenza.','Confondere subaffidamento con trasferimento integrale delle responsabilità.','Accettare deviazioni temporanee senza owner, scadenza e verifica.','Aggiornare PSC/POS o misure dopo l’avvio del cambiamento anziché prima.','Chiudere un rilievo sulla promessa di correzione e non sull’evidenza del ripristino.'),
   'operational',jsonb_build_object(
      'before',jsonb_build_array('Verifica che il discente operi come Datore di impresa affidataria e abbia completato la formazione Datore di lavoro.','Definisci fase, imprese/lavoratori autonomi coinvolti, area e cronoprogramma.','Raccogli PSC, POS, prescrizioni, verbali e documenti organizzativi pertinenti.','Individua chi decide, chi coordina, chi vigila e chi deve essere informato.'),
      'during',jsonb_build_array('Confronta continuamente condizioni reali e condizioni pianificate.','Tratta ogni variazione significativa come trigger di riesame.','Assegna azioni con responsabile e scadenza.','Usa una decisione esplicita GO/STOP/RIVALUTA quando una condizione essenziale cambia.'),
      'after',jsonb_build_array('Verifica il ripristino e l’efficacia delle azioni.','Traccia scostamenti, near miss e decisioni rilevanti.','Aggiorna o richiedi l’aggiornamento dei documenti pertinenti prima delle fasi successive.','Trasferisci gli apprendimenti a fasi analoghe senza copiare soluzioni fuori contesto.'),
      'if_problem',jsonb_build_array('Metti in sicurezza persone e area.','Sospendi la fase interessata quando manca una condizione essenziale.','Coinvolgi il soggetto competente per la decisione tecnica o di coordinamento.','Riprendi solo dopo verifica documentata delle condizioni che hanno causato lo STOP.'),
      'who_to_involve',jsonb_build_array('Datore di lavoro dell’impresa affidataria','Dirigenti e preposti','Imprese esecutrici e lavoratori autonomi','CSE e altri soggetti del Titolo IV quando pertinenti','RLS/RLST','Tecnici o specialisti competenti quando necessari'),
      'stop_conditions',jsonb_build_array('Ruoli o referenti critici non identificati.','PSC/POS o organizzazione non coerenti con il lavoro reale.','Interferenza significativa non valutata.','Protezione o misura essenziale assente o inefficace.','Condizione di sicurezza dei lavori affidati non verificata.','Azione correttiva dichiarata ma non verificata.')),
   'teacher_activity',jsonb_build_object('prompt',t.case_text,'method','Far separare fatti, obblighi, scostamenti e decisioni. Costruire una matrice soggetto → evidenza → misura → owner → STOP/GO e chiudere con decisione motivata.','debrief','Confrontare la soluzione con ruolo dell’impresa affidataria, PSC/POS, artt. 95-96, cronoprogramma e verifica delle condizioni affidate.'),
   'teacher_expansion',jsonb_build_array('Quadro normativo e ruolo','Lettura operativa di PSC/POS','Caso decisionale','Errore frequente','STOP ed escalation','Evidenza di efficacia'),
   'visuals',jsonb_build_array(
      jsonb_build_object('type','process','title','Ciclo di governo dell’impresa affidataria','steps',jsonb_build_array('AFFIDAMENTO','PIANI','CRONOPROGRAMMA','CONDIZIONI REALI','VERIFICA','AZIONE','FOLLOW-UP')),
      jsonb_build_object('type','decision','title','Gate prima dell’avvio','steps',jsonb_build_array('COERENTE?','INTERFERENZE CHIUSE?','MISURE ATTIVE?','RUOLI CHIARI?','GO / STOP / RIVALUTA'))),
   'graphic_cards',jsonb_build_array(
      jsonb_build_object('title','NON SOLO DOCUMENTI','body','PSC e POS sono utili solo se descrivono e governano il lavoro reale.'),
      jsonb_build_object('title','CHANGE CONTROL','body','Una variazione di fase, area, impresa o sequenza può richiedere riesame prima dell’avvio.'),
      jsonb_build_object('title','CLOSED LOOP','body','Un rilievo si chiude con verifica del ripristino, non con una promessa.'),
      jsonb_build_object('title','STOP','body','Se manca una condizione essenziale di sicurezza, la pressione produttiva non autorizza il GO.')),
   'scope_boundary',t.boundary,
   'formative_check',jsonb_build_object('question',t.question_text,'explanation',t.explanation_text,'formative_only',true,'test_builder_excluded',true),
   'didactic_version','datore-cantieri-authored-v3','source_keys',to_jsonb(t.source_keys),
   'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','reuse_policy','reference_and_original_rewrite','normative_validation','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR Parte II punto 3 + D.Lgs. 81/2008 vigente, Titolo IV e art. 97'),
   'source_integration_note','Fonti normative e INAIL sono usate per validazione e metodo. Testi, casi, sequenze operative, domande e spiegazioni SafetyTraining sono originali. Le verifiche interne sono formative e separate dal Test Builder.',
   'quality',coalesce(t.old_content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true,'scope_boundary_explicit',true,'prerequisite_explicit',true),
   'final_assessment',false,'test_builder_excluded',true,
   'prerequisite',jsonb_build_object('blueprint_key','employer_initial','course_key','dl_base','minimum_minutes',960)
 ) new_content
 from target t
), final_content as (
 select b.*,b.new_content||jsonb_build_object('evidence_sources',(
   select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key)
   from unnest(b.source_keys) sk(source_key)
   join public.training_sources ts on ts.source_key=sk.source_key
 )) content_final
 from built b
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',content_final,md5(content_final::text),null from final_content;

with authored as (
 select lu.id learning_unit_id,luv.content->'source_keys' source_keys
 from public.learning_units lu
 join public.learning_unit_versions luv on luv.learning_unit_id=lu.id
 where luv.status='draft' and luv.content->>'didactic_version'='datore-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%'
)
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v3','Fonte usata per validazione normativa, tecnica o metodologica del modulo aggiuntivo Cantieri del Datore di lavoro.',date '2026-10-16',jsonb_build_object('didactic_version','datore-cantieri-authored-v3','audience','employer','construction_role','entrusted_company','reuse_policy','reference_and_original_rewrite')
from authored a
cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key)
join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$
declare n int; mins int; bad int; links int; evidence_units int; refs int; active_n int; material_n int;
begin
 select count(*) into n from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.status='draft' and luv.content->>'didactic_version'='datore-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%';
 if n<>6 then raise exception 'expected 6 authored cantieri drafts, got %',n; end if;
 select sum(lu.default_minutes) into mins from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.status='draft' and luv.content->>'didactic_version'='datore-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%';
 if mins<>360 then raise exception 'expected 360 minutes, got %',mins; end if;
 select count(*) into bad from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.status='draft' and luv.content->>'didactic_version'='datore-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%' and (luv.content->'quality'->>'teacher_ready' is distinct from 'true' or luv.content->'quality'->>'learner_ready' is distinct from 'true' or luv.content->'quality'->>'question_has_explanation' is distinct from 'true' or luv.content->'quality'->>'test_builder_excluded' is distinct from 'true' or luv.content->'quality'->>'scope_boundary_explicit' is distinct from 'true' or luv.content->'quality'->>'prerequisite_explicit' is distinct from 'true' or luv.content->>'final_assessment' is distinct from 'false' or jsonb_array_length(coalesce(luv.content->'evidence_sources','[]'::jsonb))<4);
 if bad<>0 then raise exception 'quality failed for % units',bad; end if;
 select count(*) into links from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='datore-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%';
 if links<>0 then raise exception 'authored versions linked unexpectedly: %',links; end if;
 select count(distinct lus.learning_unit_id),count(*) into evidence_units,refs from public.learning_unit_sources lus join public.learning_units lu on lu.id=lus.learning_unit_id where lu.stable_key like 'roles:cantiere:%' and lus.purpose='authored_evidence_v3';
 if evidence_units<>6 or refs<24 then raise exception 'provenance failed units % refs %',evidence_units,refs; end if;
 if not exists(select 1 from public.training_blueprint_rules where blueprint_key='employer_construction_addon' and rule_key='requires_employer_initial' and active=true and outcome->'requires' @> '["employer_initial"]'::jsonb) then raise exception 'prerequisite rule missing'; end if;
 if (select metadata->>'didactic_candidate' from public.training_blueprint_variants where blueprint_key='employer_construction_addon' and variant_key='employer')<>'datore-cantieri-authored-v3' then raise exception 'employer variant candidate missing'; end if;
 if coalesce((select metadata->>'didactic_candidate' from public.training_blueprint_variants where blueprint_key='employer_construction_addon' and variant_key='manager'),'')='datore-cantieri-authored-v3' then raise exception 'manager variant modified unexpectedly'; end if;
 if (select metadata->>'auto_relink' from public.courses where stable_key='mod_cantieri')<>'false' then raise exception 'auto_relink must be false'; end if;
 select count(*) into active_n from public.courses where active=true;
 select count(*) into material_n from public.courses c where c.active=true and exists(select 1 from public.course_versions cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id where cv.course_id=c.id);
 if active_n<>92 or material_n<>92 then raise exception 'catalog expected 92/92 got %/%',active_n,material_n; end if;
end $$;
