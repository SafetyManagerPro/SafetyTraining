update public.training_sources set checked_on=date '2026-10-16',updated_at=now()
where source_key in ('gu-dm388-2003','inail-primo-soccorso-2018','inail-dae-2025','inail-primo-soccorso-chimico-2025','comune-milano-materiale-didattico','normattiva-dlgs81-vigente');

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'legal_reviewed_on','2026-10-16',
 'regulatory_basis','D.Lgs. 81/2008 art. 45 + D.M. 388/2003 art. 3 e allegati 3-4',
 'content_ready',true,
 'classification_requires_explicit_dm388_group',true,
 'trainer_requirement','Formazione svolta da personale medico; nella parte pratica il medico può avvalersi di personale infermieristico o altro personale specializzato.',
 'group_a_minutes',960,'group_bc_minutes',720,
 'group_a_theory_minutes',600,'group_bc_theory_minutes',480,
 'group_a_practical_minutes',360,'group_bc_practical_minutes',240,
 'practical_completion_not_digital',true,
 'publication_policy','draft_review_before_linking'
),updated_at=now()
where stable_key='first_aid_initial';

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'legal_reviewed_on','2026-10-16',
 'regulatory_basis','D.Lgs. 81/2008 art. 45 + D.M. 388/2003 art. 3 c.5',
 'content_ready',true,
 'renewal_interval_months',36,
 'renewal_focus','capacita_di_intervento_pratico',
 'group_a_minutes',360,'group_bc_minutes',240,
 'practical_completion_not_digital',true,
 'trainer_requirement','Formazione svolta da personale medico; nella parte pratica il medico può avvalersi di personale infermieristico o altro personale specializzato.',
 'publication_policy','draft_review_before_linking'
),updated_at=now()
where stable_key='first_aid_update';

update public.training_blueprint_variants
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('content_ready',true,'legal_reviewed_on','2026-10-16','didactic_version','first-aid-authored-v3','practical_gate_required',true),updated_at=now()
where blueprint_key in ('first_aid_initial','first_aid_update');

update public.training_blueprint_sections
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('legal_reviewed_on','2026-10-16','dm388_practical_gate',practical,'completed_digitally',case when practical then false else null end),updated_at=now()
where blueprint_key in ('first_aid_initial','first_aid_update');

update public.training_blueprint_course_types
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('content_ready',true,'legal_reviewed_on','2026-10-16','didactic_version','first-aid-authored-v3','practical_gate_required',true),updated_at=now()
where blueprint_key in ('first_aid_initial','first_aid_update');

with target_keys as (
 select distinct lu.stable_key
 from public.courses c
 join public.course_versions cv on cv.course_id=c.id
 join public.course_modules cm on cm.course_version_id=cv.id
 join public.course_module_units cmu on cmu.module_id=cm.id
 join public.learning_unit_versions linked on linked.id=cmu.unit_version_id
 join public.learning_units lu on lu.id=linked.learning_unit_id
 where c.stable_key in ('primo_soccorso_12h','primo_soccorso_a_16h','agg_primo_soccorso_4h','agg_primo_soccorso_a_6h')
 and cv.version_number=(select max(v.version_number) from public.course_versions v where v.course_id=c.id)
), target as (
 select lu.id learning_unit_id,lu.stable_key,lu.title,lu.default_minutes,
        (select max(v.version_number)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
        (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id order by v.version_number desc limit 1) old_content,
        case when lu.stable_key like 'update:firstaid:%' then 'update' else 'base' end family
 from public.learning_units lu join target_keys tk on tk.stable_key=lu.stable_key
), profiled as (
 select t.*,
 case
  when stable_key='primo_soccorso:allertamento-sicurezza-scena' then 'Proteggere il soccorritore e le altre persone prima di intervenire, leggere i pericoli evidenti e probabili, attivare rapidamente il sistema di emergenza e trasferire informazioni chiare su luogo, evento, numero e condizioni degli infortunati.'
  when stable_key='primo_soccorso:valutazione-iniziale' then 'Valutare rapidamente coscienza, respirazione e segni di compromissione senza trasformare l’addetto in un diagnostico: riconoscere l’urgenza, chiedere aiuto e non ritardare l’attivazione dei soccorsi.'
  when stable_key='primo_soccorso:funzioni-vitali' then 'Riconoscere l’assenza di risposta e la respirazione non normale, attivare i soccorsi e applicare nella pratica le manovre apprese di rianimazione e l’uso del DAE disponibile secondo addestramento, procedura e indicazioni del dispositivo.'
  when stable_key='primo_soccorso:traumi-emorragie' then 'Controllare la sicurezza della scena, riconoscere emorragie e ferite rilevanti, applicare le tecniche di controllo apprese e prevenire ulteriori danni evitando manovre improvvisate o esposizione a sangue e fluidi.'
  when stable_key='primo_soccorso:traumi-scheletro-colonna' then 'Sospettare lesioni muscolo-scheletriche, craniche o della colonna in base al meccanismo e ai segni osservabili, limitando movimenti non necessari e affidando mobilizzazione e trasporto alle tecniche realmente apprese e alle indicazioni dei soccorsi.'
  when stable_key='primo_soccorso:traumi-torace-addome' then 'Riconoscere che traumi toracici e addominali possono essere gravi anche senza lesioni esterne evidenti, allertando precocemente il soccorso sanitario e monitorando le condizioni senza manipolazioni inutili.'
  when stable_key='primo_soccorso:emergenze-mediche' then 'Riconoscere quadri di malore potenzialmente urgenti — perdita di coscienza, difficoltà respiratoria, dolore toracico, reazione allergica, convulsioni, shock — e attivare una risposta coerente con i limiti del primo soccorso.'
  when stable_key='primo_soccorso:ustioni-intossicazioni-temperatura' then 'Interrompere l’esposizione solo se è possibile farlo senza creare nuove vittime, usare le informazioni disponibili sul rischio e sulle SDS, attivare il soccorso e applicare misure di primo intervento senza neutralizzazioni o trattamenti improvvisati.'
  when stable_key='primo_soccorso:gruppo-a-rischi-specifici' then 'Collegare i rischi specifici dell’attività di Gruppo A alla preparazione del soccorso: sostanze, energia, impianti, ambienti e scenari complessi richiedono autoprotezione, informazioni tecniche disponibili e raccordo con il sistema di emergenza.'
  when stable_key='primo_soccorso:gruppo-a-scenari-complessi' then 'Gestire scenari con più infortunati o pericoli persistenti senza entrare in aree non sicure: stabilire priorità, chiamata, controllo della scena, coordinamento interno e consegna strutturata delle informazioni ai soccorritori.'
  when stable_key='update:firstaid:scene-assessment' then 'Rinfrescare in esercitazione la sequenza sicurezza della scena → valutazione iniziale → chiamata, includendo errori di comunicazione, accesso dei soccorsi e cambiamenti dello scenario.'
  when stable_key='update:firstaid:vital-functions' then 'Rinfrescare praticamente riconoscimento delle funzioni vitali, chiamata, rianimazione e uso del DAE secondo l’addestramento applicabile, con correzione immediata degli errori tecnici da parte del docente.'
  when stable_key='update:firstaid:trauma-bleeding' then 'Rinfrescare praticamente la gestione iniziale di emorragie, ferite e trauma, con attenzione a protezione, controllo dell’emorragia, movimenti non necessari e corretta richiesta di supporto.'
  when stable_key='update:firstaid:medical-exposure' then 'Rinfrescare tramite scenari la risposta a malori, ustioni ed esposizioni: riconoscere l’urgenza, proteggersi, interrompere l’esposizione quando sicuro, usare informazioni specifiche e attivare rapidamente il soccorso.'
  when stable_key='update:firstaid:a-complex-trauma' then 'Per il Gruppo A, esercitare scenari a maggiore complessità con più pericoli o infortunati, mantenendo la sicurezza del soccorritore e il raccordo con procedure aziendali e sistema sanitario.'
  when stable_key='update:firstaid:a-simulation' then 'Integrare in una simulazione completa sicurezza della scena, chiamata, valutazione, manovre pratiche, coordinamento e handover, con debriefing su tempi, errori e decisioni.'
  else 'Applicare il primo soccorso entro i limiti della propria formazione, proteggendo il soccorritore, attivando il sistema sanitario e mantenendo il focus sulla capacità pratica.' end focus,
 case
  when family='update' then 'Durante una prova pratica sul tema “'||title||'” il docente introduce un cambiamento di scenario. L’addetto deve riconoscerlo, dichiarare cosa fa, cosa non fa, quando chiama aiuto e quali informazioni consegna ai soccorritori.'
  when stable_key like 'primo_soccorso:gruppo-a-%' then 'In un’attività di Gruppo A avviene un evento relativo a “'||title||'” con pericolo residuo e più persone presenti. Definire accesso sicuro, attivazione dei soccorsi, priorità dell’addetto e informazioni tecniche da rendere disponibili.'
  else 'Un lavoratore presenta una situazione relativa a “'||title||'”. Prima di intervenire l’addetto deve leggere la scena, proteggersi, riconoscere i segnali di urgenza, attivare il sistema sanitario e restare nei limiti delle manovre realmente apprese.' end case_text,
 case
  when stable_key in ('primo_soccorso:funzioni-vitali','update:firstaid:vital-functions') then jsonb_build_array('gu-dm388-2003','inail-primo-soccorso-2018','inail-dae-2025')
  when stable_key in ('primo_soccorso:ustioni-intossicazioni-temperatura','primo_soccorso:gruppo-a-rischi-specifici','update:firstaid:medical-exposure','update:firstaid:a-complex-trauma') then jsonb_build_array('gu-dm388-2003','inail-primo-soccorso-2018','inail-primo-soccorso-chimico-2025')
  when stable_key='update:firstaid:a-simulation' then jsonb_build_array('gu-dm388-2003','inail-primo-soccorso-2018','comune-milano-materiale-didattico')
  else jsonb_build_array('gu-dm388-2003','inail-primo-soccorso-2018') end source_keys
 from target t
), enriched as (
 select learning_unit_id,stable_key,target_version,family,source_keys,
 old_content || jsonb_build_object(
  'summary',coalesce(old_content->>'summary','L’addetto di primo soccorso protegge la scena, riconosce l’urgenza, attiva il sistema sanitario e applica solo le manovre per cui è stato formato e addestrato.'),
  'detail',coalesce(old_content->>'detail',focus)||' Il materiale digitale prepara e consolida il ragionamento, ma la capacità operativa deve essere esercitata e verificata nella componente pratica prevista dal D.M. 388/2003.',
  'focus',focus,'case',case_text,
  'question',coalesce(old_content->>'question','Qual è la prima decisione che protegge sia l’infortunato sia il soccorritore in questo scenario?'),
  'question_explanation','La risposta deve partire dalla sicurezza della scena e dai limiti dell’addetto, quindi collegare segnali osservabili, attivazione del soccorso e manovre realmente apprese. Punto chiave: '||focus,
  'common_errors',jsonb_build_array('Entrare nella scena senza verificare pericoli per il soccorritore e altre persone.','Ritardare la chiamata cercando di formulare una diagnosi.','Eseguire manovre non apprese o usare presidi fuori dalle procedure previste.','Spostare un traumatizzato senza una necessità di sicurezza o senza tecnica adeguata.','Dimenticare di comunicare luogo esatto, dinamica, numero degli infortunati e cambiamenti delle condizioni.'),
  'teacher_activity',jsonb_build_object('prompt',case_text,'method',case when family='update' then 'Usare simulazione pratica a stazioni: osservazione, esecuzione, feedback immediato, ripetizione corretta e debriefing.' else 'Prima discutere la sequenza decisionale; poi collegarla alla dimostrazione pratica del medico/docente e alle esercitazioni previste dal corso.' end,'debrief','Ricostruire sempre: sicurezza → riconoscimento → allertamento → intervento nei limiti → monitoraggio → handover. Evidenziare errori che possono creare una seconda vittima o ritardare il soccorso.'),
  'operational',coalesce(old_content->'operational','{}'::jsonb)||jsonb_build_object(
    'before',jsonb_build_array('Verifica che la scena sia accessibile senza esporti al pericolo.','Usa i DPI disponibili e individua vie di accesso/uscita per i soccorsi.','Raccogli rapidamente informazioni essenziali senza ritardare l’attivazione del sistema sanitario.'),
    'during',jsonb_build_array('Valuta coscienza, respirazione e condizioni evidenti secondo quanto appreso.','Attiva o fai attivare il sistema di emergenza e comunica in modo chiaro.','Applica solo tecniche e presidi per cui hai ricevuto formazione pratica.','Osserva continuamente cambiamenti della scena e dell’infortunato.'),
    'after',jsonb_build_array('Consegna ai soccorritori informazioni su evento, condizioni osservate e interventi eseguiti.','Ripristina e segnala l’uso dei presidi secondo procedura.','Partecipa al debriefing e segnala criticità organizzative emerse.'),
    'if_problem',jsonb_build_array('Non entrare o allontanati se la scena non è sicura.','Chiedi immediatamente supporto se le condizioni superano la tua formazione o le risorse disponibili.','Segui le indicazioni del sistema di emergenza e delle procedure aziendali senza improvvisare trattamenti.'),
    'who_to_involve',jsonb_build_array('Sistema di emergenza sanitaria 112/118 secondo organizzazione territoriale','Altri addetti al primo soccorso','Datore/dirigente/preposto o coordinamento interno secondo procedura','Medico competente per organizzazione e riesame quando pertinente','Squadre specialistiche se esistono per il rischio specifico'),
    'stop_conditions',jsonb_build_array('Scena con pericolo non controllato per il soccorritore.','Necessità di manovra o accesso per cui l’addetto non è formato/addestrato.','Esposizione chimica, elettrica, incendio, atmosfera o impianto non messo in sicurezza.','Movimentazione del traumatizzato non necessaria per sottrarlo a un pericolo immediato e non gestibile in sicurezza.'),
    'adaptation','Contestualizzare a rischi, layout, numeri di emergenza, presidi, SDS e procedure reali dell’azienda.'
  ),
  'practical_component',jsonb_build_object(
    'required',true,'completed_digitally',false,
    'initial_course',jsonb_build_object('group_a',jsonb_build_object('total_minutes',960,'theory_minutes',600,'practical_minutes',360),'group_bc',jsonb_build_object('total_minutes',720,'theory_minutes',480,'practical_minutes',240)),
    'update_course',jsonb_build_object('group_a',jsonb_build_object('minutes',360,'focus','capacità di intervento pratico'),'group_bc',jsonb_build_object('minutes',240,'focus','capacità di intervento pratico')),
    'trainer_requirement','La formazione è svolta da personale medico; nella parte pratica il medico può avvalersi di personale infermieristico o altro personale specializzato.',
    'qualification_note','Questa LU è materiale di supporto/riferimento. La fruizione digitale non attesta da sola la capacità pratica richiesta.'
  ),
  'scope_boundary','Materiale didattico di supporto al corso D.M. 388/2003. Non sostituisce esercitazioni pratiche, valutazione operativa del docente medico, procedure aziendali né indicazioni del sistema di emergenza sanitaria.',
  'formative_check',jsonb_build_object('question',coalesce(old_content->>'question','Qual è la prima decisione che protegge sia l’infortunato sia il soccorritore in questo scenario?'),'explanation','Valutare sicurezza, urgenza, chiamata e limiti dell’intervento. La verifica in LU resta formativa; la capacità pratica va esercitata separatamente.','formative_only',true,'test_builder_excluded',true),
  'graphic_cards',jsonb_build_array(jsonb_build_object('title','Prima sicurezza','body','Nessun intervento deve creare una seconda vittima.'),jsonb_build_object('title','Chiama presto','body','Comunica luogo, evento, numero di persone, condizioni e pericoli; aggiorna se la situazione cambia.'),jsonb_build_object('title','Pratica obbligatoria','body','Le manovre non si acquisiscono leggendo: devono essere dimostrate, esercitate e corrette dal docente.'),jsonb_build_object('title','Limite operativo','body','L’addetto presta primo soccorso: non formula diagnosi e non improvvisa procedure cliniche o tecniche non apprese.')),
  'didactic_version','first-aid-authored-v3','source_keys',source_keys,
  'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','normative_validation','D.Lgs. 81/2008 art.45 + D.M. 388/2003 art.3 e allegati 3-4','reuse_policy','reference_and_original_rewrite'),
  'source_integration_note','Fonti normative e tecniche usate per verificare obiettivi, limiti e organizzazione. Testi, casi, spiegazioni e sequenze operative SafetyTraining sono originali e non sostituiscono la pratica guidata.',
  'quality',coalesce(old_content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true,'practical_gate_explicit',true,'medical_trainer_requirement_explicit',true),
  'final_assessment',false,'test_builder_excluded',true
 ) new_content
 from profiled
), final_content as (
 select e.*,e.new_content||jsonb_build_object('evidence_sources',coalesce((select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key) from jsonb_array_elements_text(e.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key),'[]'::jsonb)) content_final
 from enriched e
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',content_final,md5(content_final::text),null from final_content
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

with authored as (
 select lu.id learning_unit_id,luv.content->'source_keys' source_keys
 from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id
 where luv.content->>'didactic_version'='first-aid-authored-v3' and luv.status='draft'
)
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v3','Fonte usata per validazione normativa, approfondimento tecnico o metodo nella versione first-aid-authored-v3.',date '2026-10-16',jsonb_build_object('didactic_version','first-aid-authored-v3','reuse_policy','reference_and_original_rewrite')
from authored a cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key)
join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$ declare n integer;base_n integer;upd_n integer;links integer;bad integer;durations integer;practice_sections integer; begin
 select count(*) into n from public.learning_unit_versions where content->>'didactic_version'='first-aid-authored-v3' and status='draft'; if n<>16 then raise exception 'expected 16 first-aid-authored-v3 drafts, got %',n; end if;
 select count(*) into base_n from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='first-aid-authored-v3' and lu.stable_key like 'primo_soccorso:%';
 select count(*) into upd_n from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='first-aid-authored-v3' and lu.stable_key like 'update:firstaid:%';
 if base_n<>10 or upd_n<>6 then raise exception 'expected 10 base + 6 update, got % + %',base_n,upd_n; end if;
 select count(*) into links from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id where luv.content->>'didactic_version'='first-aid-authored-v3'; if links<>0 then raise exception 'authored first aid versions linked: %',links; end if;
 select count(*) into bad from public.learning_unit_versions luv where luv.content->>'didactic_version'='first-aid-authored-v3' and (luv.content->'quality'->>'teacher_ready' is distinct from 'true' or luv.content->'quality'->>'learner_ready' is distinct from 'true' or luv.content->'quality'->>'question_has_explanation' is distinct from 'true' or luv.content->'quality'->>'test_builder_excluded' is distinct from 'true' or luv.content->'quality'->>'practical_gate_explicit' is distinct from 'true' or luv.content->>'final_assessment' is distinct from 'false' or luv.content->'practical_component'->>'completed_digitally' is distinct from 'false' or jsonb_array_length(coalesce(luv.content->'evidence_sources','[]'::jsonb))<2); if bad<>0 then raise exception 'quality assertions failed for % units',bad; end if;
 select count(*) into durations from public.courses where (stable_key='primo_soccorso_12h' and nominal_minutes=720) or (stable_key='primo_soccorso_a_16h' and nominal_minutes=960) or (stable_key='agg_primo_soccorso_4h' and nominal_minutes=240) or (stable_key='agg_primo_soccorso_a_6h' and nominal_minutes=360); if durations<>4 then raise exception 'first aid course durations invalid'; end if;
 select count(*) into practice_sections from public.training_blueprint_sections where blueprint_key in ('first_aid_initial','first_aid_update') and practical=true and section_type='practical_external' and metadata->>'completed_digitally'='false'; if practice_sections<>2 then raise exception 'expected two external practical gates, got %',practice_sections; end if;
end $$;