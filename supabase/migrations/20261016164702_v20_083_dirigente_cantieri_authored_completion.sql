update public.training_sources set checked_on=date '2026-10-16',updated_at=now() where source_key in ('mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss','inail-costruzioni-dati-2026');

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'manager_content_ready',true,
 'manager_candidate_didactic_version','dirigente-cantieri-authored-v3',
 'manager_minimum_minutes',360,
 'manager_base_role_minutes',720,
 'manager_composite_minutes',1080,
 'manager_required_context','entrusted_company',
 'manager_prerequisite_blueprint','dirigente_initial',
 'manager_delivery_modes',jsonb_build_array('physical','synchronous_video','asynchronous_elearning'),
 'manager_publication_policy','draft_review_before_linking',
 'manager_test_builder_scope','paused_excluded',
 'manager_update_rule','general_dirigente_update_6h_quinquennial_context_based',
 'role_variant_resolution','audience_rule'
),updated_at=now()
where stable_key='employer_construction_addon';

update public.training_blueprint_variants
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'legal_reviewed_on','2026-10-16','content_ready',true,
 'didactic_candidate','dirigente-cantieri-authored-v3',
 'audience_role','manager','construction_role','entrusted_company',
 'minimum_minutes',360,'base_role_minutes',720,'composite_total_minutes',1080,
 'prerequisite_blueprint','dirigente_initial','prerequisite_course_key','dirigente',
 'delivery_modes',jsonb_build_array('physical','synchronous_video','asynchronous_elearning'),
 'final_verification','test_or_interview','test_minimum_questions',30,'test_minimum_options',3,'test_passing_score_pct',70,
 'update_rule','general_dirigente_update_6h_quinquennial_context_based',
 'candidate_version_selector','didactic_version',
 'candidate_learning_unit_keys',jsonb_build_array('roles:cantiere:subjects-obligations','roles:cantiere:plans-psc-pos','roles:cantiere:art95-art96','roles:cantiere:cronoprogramma','roles:cantiere:condition-verification','roles:cantiere:pos-analysis-coordination'),
 'test_builder_scope','paused_excluded','auto_materialize',false,'auto_publish',false,'auto_relink',false
),updated_at=now()
where blueprint_key='employer_construction_addon' and variant_key='manager';

update public.courses
set metadata=(coalesce(metadata,'{}'::jsonb)-'prerequisite_blueprint'-'prerequisite_course_key')||jsonb_build_object(
 'legal_reviewed_on','2026-10-16','content_review_ready',true,'role_variants_ready',true,
 'role_variant_resolution','audience_rule',
 'candidate_didactic_versions',jsonb_build_array('datore-cantieri-authored-v3','dirigente-cantieri-authored-v3'),
 'role_candidate_didactic_versions',jsonb_build_object('employer','datore-cantieri-authored-v3','manager','dirigente-cantieri-authored-v3'),
 'role_prerequisites',jsonb_build_object(
   'employer',jsonb_build_object('blueprint_key','employer_initial','course_key','dl_base','minimum_minutes',960),
   'manager',jsonb_build_object('blueprint_key','dirigente_initial','course_key','dirigente','minimum_minutes',720)
 ),
 'construction_role_required','entrusted_company','official_minimum_minutes',360,
 'delivery_modes',jsonb_build_array('physical','synchronous_video','asynchronous_elearning'),
 'publication_policy','draft_review_before_linking','final_test_builder_paused',true,'auto_publish',false,'auto_relink',false
),updated_at=now()
where stable_key='mod_cantieri';

update public.training_blueprint_course_types
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'employer_content_ready',true,'manager_content_ready',true,
 'role_variant_candidates',jsonb_build_object('employer','datore-cantieri-authored-v3','manager','dirigente-cantieri-authored-v3'),
 'role_prerequisites',jsonb_build_object('employer','employer_initial','manager','dirigente_initial'),
 'variant_resolution','audience_rule','requires_final_composition_review',true,'question_bank_complete',false
),updated_at=now()
where source_system='safetymanager' and external_course_code='mod_cantieri';

update public.training_blueprint_sections
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'role_variant_candidates',jsonb_build_object('employer','datore-cantieri-authored-v3','manager','dirigente-cantieri-authored-v3'),
 'manager_digital_learning_units_planned',6,'manager_content_ready',true
),updated_at=now()
where blueprint_key='employer_construction_addon' and section_key='construction_context';

insert into public.training_blueprint_rules(blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes,active)
values('employer_construction_addon','requires_dirigente_initial','manager','eligibility',4,
 jsonb_build_object('audience_role','manager','construction_role','entrusted_company'),
 jsonb_build_object('requires',jsonb_build_array('dirigente_initial')),
 'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte II punto 2.3',
 'Il modulo Cantieri integra il corso Dirigente di 12 ore e non lo sostituisce.',true)
on conflict (blueprint_key,rule_key) do update set variant_key=excluded.variant_key,rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=excluded.active,updated_at=now();

with profiles(stable_key,focus,case_text,question_text,explanation_text,boundary,source_keys) as (
values
('roles:cantiere:subjects-obligations',
 'Il dirigente dell’impresa affidataria deve saper leggere l’organizzazione del cantiere e tradurre le direttive del datore di lavoro in assetti, flussi, responsabilità operative e controlli coerenti con i poteri effettivamente attribuiti. Deve distinguere ciò che può decidere direttamente da ciò che richiede escalation al datore, al CSE o ad altri soggetti.',
 'Entrano due nuove imprese esecutrici a cantiere avviato. Il dirigente riceve l’obiettivo produttivo di farle partire il giorno successivo, ma referenti, flussi informativi e interferenze non sono stati riallineati. Costruire la sequenza manageriale corretta prima del GO.',
 'Quali decisioni può assumere direttamente il dirigente dell’impresa affidataria e quali devono essere riportate al datore di lavoro o al coordinamento di cantiere?',
 'La risposta parte dai poteri reali del dirigente: egli organizza e gestisce nell’ambito delle attribuzioni ricevute, assicura che le misure siano attuate e segnala/escalation quando servono decisioni, risorse o atti che eccedono tali poteri. Non va confusa la funzione manageriale con l’automatica titolarità di tutti gli obblighi del datore.',
 'L’art. 97, comma 3-ter richiede adeguata formazione anche ai dirigenti dell’impresa affidataria. La formazione non attribuisce automaticamente al dirigente tutti gli obblighi propri del datore di lavoro: responsabilità e poteri dipendono dalla funzione effettivamente esercitata, dall’organizzazione e dalle eventuali deleghe valide.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:plans-psc-pos',
 'Il dirigente deve usare PSC e POS per organizzare il lavoro reale: trasferire prescrizioni alle squadre, verificare che metodi e sequenze siano coerenti, intercettare variazioni e attivare il riesame prima che la produzione proceda su condizioni non più coperte dai piani.',
 'Il POS prevede una fase in zona A; per esigenze di programma la squadra viene spostata in zona B, già occupata da un’altra impresa. Il dirigente ha l’autorità di organizzare le squadre ma non può modificare unilateralmente il PSC. Definire cosa fa, cosa sospende e chi coinvolge.',
 'Come deve procedere il dirigente quando il lavoro reale non è più coerente con PSC o POS?',
 'Deve impedire che la variante diventi operativa senza riesame, mettere in sicurezza l’organizzazione, raccogliere lo scostamento, coinvolgere i soggetti competenti per gli aggiornamenti necessari e autorizzare la ripresa solo quando documenti, misure e condizioni reali risultano riallineati.',
 'Il dirigente applica e fa applicare le prescrizioni nell’ambito delle proprie attribuzioni; non sostituisce il CSE nella modifica/coordinamento del PSC né il datore nei compiti che restano legalmente in capo a quest’ultimo.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:art95-art96',
 'Il dirigente deve trasformare misure e obblighi degli artt. 95 e 96 in organizzazione quotidiana: spazi, accessi, viabilità, ordine, protezioni, manutenzioni, sequenze e modalità operative devono avere owner, risorse e controllo. Il preposto vigila sul campo; il dirigente governa il sistema organizzativo e interviene sugli scostamenti.',
 'Depositi e rifiuti restringono un percorso, un parapetto viene temporaneamente rimosso per movimentare materiali e pedoni e mezzi condividono un accesso. Il dirigente deve decidere priorità, sospensioni, responsabilità e tempi di ripristino.',
 'Qual è la differenza tra il compito del dirigente e quello del preposto davanti a una misura organizzativa che sta degradando?',
 'Il dirigente deve assicurare organizzazione, risorse, regole e correzioni coerenti con i poteri attribuiti; il preposto sovrintende e vigila sull’esecuzione e sui comportamenti operativi. Entrambi devono reagire agli scostamenti, ma con funzioni diverse e coordinate.',
 'La LU non confonde direzione e vigilanza: il dirigente organizza e gestisce secondo le attribuzioni ricevute; il preposto mantiene la vigilanza operativa prevista dall’art. 19.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:cronoprogramma',
 'Il dirigente deve leggere il cronoprogramma come leva di organizzazione e prevenzione. Anticipi, ritardi e sovrapposizioni cambiano interferenze, accessi, mezzi e risorse: prima della variazione serve un safety gate e, quando necessario, il coinvolgimento del datore e del coordinamento di cantiere.',
 'Per recuperare un ritardo il dirigente riceve pressione per anticipare una fase che si sovrapporrebbe a sollevamenti programmati. Può riorganizzare le squadre ma la nuova sequenza modifica interferenze previste dal PSC. Stabilire il percorso decisionale.',
 'Quando il dirigente può rimodulare il programma direttamente e quando deve fermare la modifica e attivare il coordinamento?',
 'Può agire entro i poteri organizzativi assegnati solo se la variazione non apre rischi o interferenze non valutate e resta coerente con i piani. Se cambia lo scenario di sicurezza, la produzione si ferma sul punto critico e il riesame precede la nuova autorizzazione.',
 'Il dirigente non usa il cronoprogramma per aggirare PSC, procedure o competenze di altri soggetti. La pressione temporale non amplia i suoi poteri né riduce le condizioni di sicurezza richieste.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:condition-verification',
 'Il dirigente deve contribuire alla verifica delle condizioni di sicurezza dei lavori affidati attraverso un processo chiuso: criteri, sopralluogo, scostamento, misura immediata, assegnazione, evidenza e follow-up. La verifica deve produrre decisioni organizzative e non solo verbali.',
 'Un controllo rileva una protezione collettiva rimossa. Il preposto promette il ripristino entro sera mentre la squadra vorrebbe continuare. Il dirigente deve stabilire cosa può proseguire, cosa va sospeso e come chiudere formalmente e sostanzialmente il rilievo.',
 'Quando il dirigente può considerare chiusa una non conformità rilevata nei lavori affidati?',
 'Solo quando la condizione pericolosa è stata controllata, l’azione è stata eseguita e il ripristino è stato verificato. La promessa di intervento o la mera apertura di un’azione non equivalgono alla chiusura del rischio.',
 'La LU sviluppa la capacità del dirigente di organizzare, controllare e fare escalation nell’ambito dei propri poteri; non trasforma automaticamente il dirigente nel titolare legale di ogni verifica attribuita dall’art. 97 al datore di lavoro.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss']::text[]),
('roles:cantiere:pos-analysis-coordination',
 'Il dirigente deve saper integrare POS, PSC, cronoprogramma e condizioni reali per supportare e attuare il coordinamento dell’impresa affidataria. La congruenza deve essere sostanziale e la decisione di avvio deve essere compatibile con ruolo, deleghe e poteri effettivi.',
 'Una nuova esecutrice presenta un POS formalmente completo, ma il metodo differisce dal PSC, l’area è occupata e il cronoprogramma crea una sovrapposizione. Il dirigente dispone dell’organizzazione operativa ma la verifica formale di congruenza è attribuita dall’art. 97 al datore. Costruire la sequenza corretta senza confondere i ruoli.',
 'Come può il dirigente contribuire alla verifica di congruenza dei POS senza attribuirsi automaticamente un obbligo che la legge pone sul datore di lavoro?',
 'Può svolgere analisi, raccogliere evidenze, coordinare il riallineamento e attuare decisioni nell’ambito delle attribuzioni ricevute; deve però rispettare la titolarità degli atti e delle responsabilità prevista dall’organizzazione e dalla legge, coinvolgendo il datore quando la decisione o la validazione eccede i suoi poteri.',
 'Il modulo forma il dirigente dell’impresa affidataria ai compiti specifici previsti dall’ASR 2025. Non modifica la titolarità degli obblighi dell’art. 97 né sostituisce una valida attribuzione/delega di funzioni quando necessaria.',
 array['mlps-asr-2025','normattiva-dlgs81-vigente','inail-quaderni-cantieri','inail-condivido-near-miss','inail-costruzioni-dati-2026']::text[])
), target as (
 select lu.id learning_unit_id,lu.stable_key,lu.title,lu.default_minutes,
        (select coalesce(max(v.version_number),0)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
        (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id and v.content->>'didactic_version'='datore-cantieri-authored-v3' order by v.version_number desc limit 1) base_content,
        p.focus,p.case_text,p.question_text,p.explanation_text,p.boundary,p.source_keys
 from public.learning_units lu join profiles p on p.stable_key=lu.stable_key
), built as (
 select t.*,coalesce(t.base_content,'{}'::jsonb)||jsonb_build_object(
   'summary','Nel modulo aggiuntivo Cantieri del Dirigente dell’impresa affidataria, “'||regexp_replace(t.title,'^CANT[0-9]+ · ','')||'” viene affrontato dal punto di vista di chi organizza, gestisce, attua e controlla nell’ambito dei poteri effettivamente attribuiti.',
   'detail',t.focus||' La didattica distingue sempre decisione datoriale, funzione dirigenziale, vigilanza del preposto e compiti del coordinamento di cantiere.',
   'focus',t.focus,'case',t.case_text,'question',t.question_text,'question_explanation',t.explanation_text,
   'role_perspective','manager','audience_role','manager','construction_role','entrusted_company',
   'common_errors',jsonb_build_array('Agire come se la qualifica di dirigente attribuisse automaticamente tutti gli obblighi del datore di lavoro.','Eseguire una direttiva produttiva senza verificare che resti coerente con PSC, POS e condizioni reali.','Confondere organizzazione del dirigente e vigilanza operativa del preposto.','Gestire una variazione significativa senza coinvolgere il soggetto competente per il riesame.','Chiudere una criticità sulla promessa di correzione e non sull’evidenza del ripristino.'),
   'operational',jsonb_build_object(
      'before',jsonb_build_array('Verifica il completamento del corso Dirigente 12h e il ruolo nell’impresa affidataria.','Chiarisci poteri, direttive, eventuali deleghe, risorse disponibili e canale di escalation verso il datore.','Definisci fase, imprese/lavoratori autonomi, area, PSC/POS e cronoprogramma applicabili.','Individua preposti, CSE e altri interlocutori necessari prima dell’avvio.'),
      'during',jsonb_build_array('Organizza attività e risorse mantenendo coerenza con piani, misure e direttive legittime.','Verifica che le prescrizioni raggiungano preposti e squadre e che siano attuabili.','Tratta cambiamenti e interferenze con decisione esplicita GO/STOP/RIVALUTA.','Escala al datore o al coordinamento quando la decisione eccede i poteri attribuiti o richiede modifica dei piani.'),
      'after',jsonb_build_array('Verifica chiusura ed efficacia delle azioni correttive.','Traccia decisioni, scostamenti, near miss e comunicazioni rilevanti.','Riferisci al datore le criticità che richiedono decisioni, risorse o adempimenti di sua competenza.','Riesamina organizzazione e flussi prima delle fasi successive.'),
      'if_problem',jsonb_build_array('Metti in sicurezza persone e area e sospendi la fase interessata quando necessario.','Non compensare con prassi informali la mancanza di poteri, risorse o competenze.','Coinvolgi datore, CSE, preposto o tecnico competente in funzione della criticità.','Riprendi solo dopo verifica documentata delle condizioni che hanno generato lo STOP.'),
      'who_to_involve',jsonb_build_array('Datore di lavoro dell’impresa affidataria','Dirigente dell’impresa affidataria','Preposti','Imprese esecutrici e lavoratori autonomi','CSE e altri soggetti del Titolo IV quando pertinenti','RLS/RLST','Tecnici o specialisti competenti'),
      'stop_conditions',jsonb_build_array('Direttiva o modifica produttiva incompatibile con una misura di sicurezza.','PSC/POS non coerenti con il lavoro reale.','Interferenza significativa non valutata.','Protezione o misura essenziale assente/inefficace.','Poteri o risorse del dirigente insufficienti per governare in sicurezza la situazione.','Decisione che richiede atto o validazione di altro soggetto non ancora ottenuta.','Azione correttiva non verificata.')
   ),
   'teacher_activity',jsonb_build_object('prompt',t.case_text,'method','Far costruire quattro colonne: DATORE decide/assicura; DIRIGENTE organizza/gestisce; PREPOSTO sovrintende/vigila; CSE coordina secondo Titolo IV. Applicare poi la matrice al caso e chiudere con GO/STOP/escalation.','debrief','Verificare che la soluzione distingua poteri effettivi, titolarità degli obblighi, prescrizioni PSC/POS, interferenze e closed-loop delle azioni.'),
   'teacher_expansion',jsonb_build_array('Ruolo e poteri effettivi del dirigente','Interfaccia con datore e preposti','PSC/POS e lavoro reale','Caso decisionale','STOP ed escalation','Evidenza di efficacia'),
   'scope_boundary',t.boundary,
   'formative_check',jsonb_build_object('question',t.question_text,'explanation',t.explanation_text,'formative_only',true,'test_builder_excluded',true),
   'didactic_version','dirigente-cantieri-authored-v3','source_keys',to_jsonb(t.source_keys),
   'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','reuse_policy','reference_and_original_rewrite','normative_validation','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR Parte II punto 2.3 + D.Lgs. 81/2008 vigente artt. 95, 96 e 97'),
   'source_integration_note','Le fonti sono usate per validare ruolo, obblighi e metodo. I contenuti SafetyTraining sono originali e separano la funzione del dirigente dalla titolarità degli obblighi del datore. Le domande sono formative e fuori dal Test Builder.',
   'quality',coalesce(t.base_content->'quality','{}'::jsonb)||jsonb_build_object('version','dirigente-cantieri-authored-v3','teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true,'scope_boundary_explicit',true,'prerequisite_explicit',true,'role_boundary_explicit',true),
   'final_assessment',false,'test_builder_excluded',true,
   'prerequisite',jsonb_build_object('blueprint_key','dirigente_initial','course_key','dirigente','minimum_minutes',720)
 ) new_content
 from target t
), final_content as (
 select b.*,b.new_content||jsonb_build_object('evidence_sources',(
   select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key)
   from unnest(b.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key
 )) content_final
 from built b
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',content_final,md5(content_final::text),null from final_content;

with authored as (
 select lu.id learning_unit_id,luv.content->'source_keys' source_keys
 from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id
 where luv.status='draft' and luv.content->>'didactic_version'='dirigente-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%'
)
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v3_manager','Fonte usata per validazione normativa, tecnica o metodologica del modulo Cantieri del Dirigente dell’impresa affidataria.',date '2026-10-16',jsonb_build_object('didactic_version','dirigente-cantieri-authored-v3','audience','manager','construction_role','entrusted_company','reuse_policy','reference_and_original_rewrite')
from authored a cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$
declare n int; mins int; bad int; links int; evidence_units int; refs int; active_n int; material_n int;
begin
 select count(*) into n from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.status='draft' and luv.content->>'didactic_version'='dirigente-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%';
 if n<>6 then raise exception 'expected 6 manager cantieri drafts, got %',n; end if;
 select sum(lu.default_minutes) into mins from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.status='draft' and luv.content->>'didactic_version'='dirigente-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%';
 if mins<>360 then raise exception 'expected 360 manager minutes, got %',mins; end if;
 select count(*) into bad from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.status='draft' and luv.content->>'didactic_version'='dirigente-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%' and (luv.content->'quality'->>'teacher_ready' is distinct from 'true' or luv.content->'quality'->>'learner_ready' is distinct from 'true' or luv.content->'quality'->>'question_has_explanation' is distinct from 'true' or luv.content->'quality'->>'test_builder_excluded' is distinct from 'true' or luv.content->'quality'->>'scope_boundary_explicit' is distinct from 'true' or luv.content->'quality'->>'prerequisite_explicit' is distinct from 'true' or luv.content->'quality'->>'role_boundary_explicit' is distinct from 'true' or luv.content->>'final_assessment' is distinct from 'false' or jsonb_array_length(coalesce(luv.content->'evidence_sources','[]'::jsonb))<4);
 if bad<>0 then raise exception 'manager quality failed for % units',bad; end if;
 select count(*) into links from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='dirigente-cantieri-authored-v3' and lu.stable_key like 'roles:cantiere:%';
 if links<>0 then raise exception 'manager authored versions linked unexpectedly: %',links; end if;
 select count(distinct lus.learning_unit_id),count(*) into evidence_units,refs from public.learning_unit_sources lus join public.learning_units lu on lu.id=lus.learning_unit_id where lu.stable_key like 'roles:cantiere:%' and lus.purpose='authored_evidence_v3_manager';
 if evidence_units<>6 or refs<24 then raise exception 'manager provenance failed units % refs %',evidence_units,refs; end if;
 if not exists(select 1 from public.training_blueprint_rules where blueprint_key='employer_construction_addon' and rule_key='requires_dirigente_initial' and variant_key='manager' and active=true and outcome->'requires' @> '["dirigente_initial"]'::jsonb) then raise exception 'manager prerequisite rule missing'; end if;
 if (select metadata->>'didactic_candidate' from public.training_blueprint_variants where blueprint_key='employer_construction_addon' and variant_key='manager')<>'dirigente-cantieri-authored-v3' then raise exception 'manager candidate missing'; end if;
 if (select metadata->>'didactic_candidate' from public.training_blueprint_variants where blueprint_key='employer_construction_addon' and variant_key='employer')<>'datore-cantieri-authored-v3' then raise exception 'employer candidate changed unexpectedly'; end if;
 if (select metadata ? 'prerequisite_blueprint' from public.courses where stable_key='mod_cantieri') then raise exception 'shared course must not hardcode single-role prerequisite'; end if;
 if (select metadata->'role_prerequisites'->'manager'->>'course_key' from public.courses where stable_key='mod_cantieri')<>'dirigente' then raise exception 'manager role prerequisite not encoded'; end if;
 if not ((select metadata->'candidate_didactic_versions' from public.courses where stable_key='mod_cantieri') @> '["datore-cantieri-authored-v3","dirigente-cantieri-authored-v3"]'::jsonb) then raise exception 'shared course candidates incomplete'; end if;
 select count(*) into active_n from public.courses where active=true;
 select count(*) into material_n from public.courses c where c.active=true and exists(select 1 from public.course_versions cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id where cv.course_id=c.id);
 if active_n<>92 or material_n<>92 then raise exception 'catalog expected 92/92 got %/%',active_n,material_n; end if;
end $$;