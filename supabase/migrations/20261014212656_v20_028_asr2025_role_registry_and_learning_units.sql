-- SafetyTraining v20.028
-- ASR 17/04/2025: role-course registry, reusable Learning Units and verification requirements.
-- Excluded by project decision: RSPP/ASPP A-B-C/B-SP, CSP/CSE, ponteggi, funi and standalone segnaletica stradale families.

alter table public.training_blueprint_rules
  drop constraint if exists training_blueprint_rules_rule_type_check;
alter table public.training_blueprint_rules
  add constraint training_blueprint_rules_rule_type_check
  check (rule_type in (
    'audience','duration','sector','risk','practical','eligibility','composition',
    'legacy_alias','delivery','assessment','renewal'
  ));

create table if not exists public.course_verification_requirements (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.course_versions(id) on delete cascade,
  requirement_key text not null,
  title text not null,
  verification_mode text not null
    check (verification_mode in (
      'test_or_interview','test','interview','simulation','practical',
      'test_and_practical','practical_and_interview'
    )),
  minimum_questions integer null check (minimum_questions is null or minimum_questions > 0),
  minimum_options_per_question integer null check (minimum_options_per_question is null or minimum_options_per_question > 1),
  passing_score_pct numeric null check (passing_score_pct is null or passing_score_pct between 0 and 100),
  required boolean not null default true,
  completion_mode text not null default 'platform_or_external'
    check (completion_mode in ('platform','external','platform_or_external')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_version_id,requirement_key)
);

alter table public.course_verification_requirements enable row level security;
drop policy if exists course_verification_requirements_admin on public.course_verification_requirements;
create policy course_verification_requirements_admin
on public.course_verification_requirements
for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());
grant select,insert,update,delete on public.course_verification_requirements to authenticated;
drop trigger if exists course_verification_requirements_touch on public.course_verification_requirements;
create trigger course_verification_requirements_touch
before update on public.course_verification_requirements
for each row execute function public.touch_updated_at();

-- Blueprint regulatory metadata. Per-section hours below are internal didactic allocation,
-- never presented as statutory per-topic hour requirements.
update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',720,'delivery_constraint','synchronous_or_classroom',
  'elearning_asynchronous_allowed',false,'assessment','test_or_interview',
  'test_minimum_questions',30,'test_minimum_options',3,'test_passing_score_pct',70,
  'prerequisite','worker_general_and_specific','internal_section_allocation_not_regulatory',true,
  'master_registry_version',2),updated_at=now()
where stable_key='preposto_initial';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',360,'renewal_interval_months',24,
  'delivery_constraint','synchronous_or_classroom','elearning_asynchronous_allowed',false,
  'assessment','test_or_interview','test_minimum_questions',10,'test_minimum_options',3,
  'test_passing_score_pct',70,'master_registry_version',2),updated_at=now()
where stable_key='preposto_update';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',720,'delivery_constraint','elearning_asynchronous_allowed',
  'assessment','test_or_interview','test_minimum_questions',30,'test_minimum_options',3,
  'test_passing_score_pct',70,'internal_section_allocation_not_regulatory',true,
  'master_registry_version',2),updated_at=now()
where stable_key='dirigente_initial';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',360,'renewal_interval_months',60,
  'delivery_constraint','elearning_asynchronous_allowed','assessment','test_or_interview',
  'test_minimum_questions',10,'test_minimum_options',3,'test_passing_score_pct',70,
  'master_registry_version',2),updated_at=now()
where stable_key='dirigente_update';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',960,'delivery_constraint','elearning_asynchronous_allowed',
  'assessment','test_or_interview','test_minimum_questions',30,'test_minimum_options',3,
  'test_passing_score_pct',70,'internal_section_allocation_not_regulatory',true,
  'master_registry_version',2),updated_at=now()
where stable_key='employer_initial';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',360,'renewal_interval_months',60,
  'delivery_constraint','elearning_asynchronous_allowed','assessment','test_or_interview',
  'test_minimum_questions',10,'test_minimum_options',3,'test_passing_score_pct',70,
  'master_registry_version',2),updated_at=now()
where stable_key='employer_update';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',360,'delivery_constraint','elearning_asynchronous_allowed',
  'integrates_role_course',true,'internal_section_allocation_not_regulatory',true,
  'master_registry_version',2),updated_at=now()
where stable_key='employer_construction_addon';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',480,'delivery_constraint','synchronous_or_classroom',
  'elearning_asynchronous_allowed',false,'prerequisite','employer_initial',
  'assessment','test_or_interview','test_minimum_questions',30,'test_minimum_options',3,
  'test_passing_score_pct',70,'master_registry_version',2),updated_at=now()
where stable_key='dl_spp_common';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'delivery_constraint','synchronous_or_classroom','elearning_asynchronous_allowed',false,
  'inherits_common_minutes',480,'assessment','test_or_interview','test_minimum_questions',30,
  'test_minimum_options',3,'test_passing_score_pct',70,'master_registry_version',2),updated_at=now()
where stable_key='dl_spp_sector';

update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object(
  'regulatory_basis','Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR',
  'minimum_minutes',480,'renewal_interval_months',60,
  'delivery_constraint','elearning_asynchronous_allowed','assessment','test_or_interview',
  'test_minimum_questions',10,'test_minimum_options',3,'test_passing_score_pct',70,
  'include_sector_topics_when_still_applicable',true,'master_registry_version',2),updated_at=now()
where stable_key='dl_spp_update';

-- Internal blueprint section allocation.
update public.training_blueprint_sections set title='Giuridico normativo',nominal_minutes=180,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='preposto_initial' and section_key='shared_prevention_system';
update public.training_blueprint_sections set title='Gestione e organizzazione della sicurezza',nominal_minutes=180,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='preposto_initial' and section_key='preposto_role';
update public.training_blueprint_sections set title='Valutazione delle situazioni di rischio e controllo delle attività',nominal_minutes=240,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='preposto_initial' and section_key='preposto_cases';
insert into public.training_blueprint_sections(
  blueprint_key,section_key,title,position,section_type,nominal_minutes,required,practical,metadata)
values('preposto_initial','preposto_communication','Comunicazione e informazione',4,'role_specific',120,true,false,
  '{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb)
on conflict (blueprint_key,section_key) do update set
  title=excluded.title,position=excluded.position,section_type=excluded.section_type,
  nominal_minutes=excluded.nominal_minutes,
  metadata=public.training_blueprint_sections.metadata||excluded.metadata,updated_at=now();

update public.training_blueprint_sections set title='Giuridico normativo',nominal_minutes=180,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='dirigente_initial' and section_key='shared_prevention_system';
update public.training_blueprint_sections set title='Gestione e organizzazione della sicurezza',nominal_minutes=240,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='dirigente_initial' and section_key='manager_role';
update public.training_blueprint_sections set title='Compiti specifici del dirigente in relazione alla SSL',nominal_minutes=180,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='dirigente_initial' and section_key='management_cases';
insert into public.training_blueprint_sections(
  blueprint_key,section_key,title,position,section_type,nominal_minutes,required,practical,metadata)
values('dirigente_initial','manager_communication','Comunicazione, formazione, informazione e consultazione',4,'role_specific',120,true,false,
  '{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb)
on conflict (blueprint_key,section_key) do update set
  title=excluded.title,position=excluded.position,section_type=excluded.section_type,
  nominal_minutes=excluded.nominal_minutes,
  metadata=public.training_blueprint_sections.metadata||excluded.metadata,updated_at=now();

update public.training_blueprint_sections set title='Giuridico normativo',nominal_minutes=480,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='employer_initial' and section_key='system_governance';
update public.training_blueprint_sections set title='Valutazione dei rischi e misure conseguenti',nominal_minutes=180,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='employer_initial' and section_key='risk_assessment';
update public.training_blueprint_sections set title='Organizzazione e gestione della SSL',nominal_minutes=180,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='employer_initial' and section_key='prevention_management';
update public.training_blueprint_sections set title='Vigilanza, comunicazione e partecipazione',nominal_minutes=120,
  metadata=metadata||'{"internal_allocation":true,"source_group":"ruoli_asr2025"}'::jsonb,updated_at=now()
where blueprint_key='employer_initial' and section_key='relations_communication';

update public.training_blueprint_sections set nominal_minutes=480,
  metadata=metadata||'{"source_group":"ruoli_asr2025","digital_learning_units_planned":8}'::jsonb,updated_at=now()
where blueprint_key='dl_spp_common' and section_key='spp_common';
update public.training_blueprint_sections set nominal_minutes=360,
  metadata=metadata||'{"source_group":"ruoli_asr2025","digital_learning_units_planned":6}'::jsonb,updated_at=now()
where blueprint_key='employer_construction_addon' and section_key='construction_context';
update public.training_blueprint_sections set nominal_minutes=360,
  metadata=metadata||'{"dynamic_update":true}'::jsonb,updated_at=now()
where blueprint_key in ('preposto_update','dirigente_update','employer_update');
update public.training_blueprint_sections set nominal_minutes=480,
  metadata=metadata||'{"dynamic_update":true}'::jsonb,updated_at=now()
where blueprint_key='dl_spp_update';

-- DL-SPP sector variants.
update public.training_blueprint_variants set metadata=metadata||
  '{"common_minutes":480,"sector_additional_minutes":960,"ateco_reference":"A 01-02","regulatory_basis":"ASR 17/04/2025"}'::jsonb,updated_at=now()
where blueprint_key='dl_spp_sector' and variant_key='agricoltura_zootecnia';
update public.training_blueprint_variants set metadata=metadata||
  '{"common_minutes":480,"sector_additional_minutes":720,"ateco_reference":"A 03","regulatory_basis":"ASR 17/04/2025"}'::jsonb,updated_at=now()
where blueprint_key='dl_spp_sector' and variant_key='pesca';
update public.training_blueprint_variants set metadata=metadata||
  '{"common_minutes":480,"sector_additional_minutes":960,"ateco_reference":"F","regulatory_basis":"ASR 17/04/2025"}'::jsonb,updated_at=now()
where blueprint_key='dl_spp_sector' and variant_key='costruzioni';
update public.training_blueprint_variants set metadata=metadata||
  '{"common_minutes":480,"sector_additional_minutes":960,"ateco_reference":"C 19-20","regulatory_basis":"ASR 17/04/2025"}'::jsonb,updated_at=now()
where blueprint_key='dl_spp_sector' and variant_key='chimico_petrolchimico';

-- Deterministic registry rules.
insert into public.training_blueprint_rules(
  blueprint_key,rule_key,rule_type,priority,conditions,outcome,source,notes)
values
('preposto_initial','requires_worker_training','eligibility',5,'{}','{"requires":["worker_general","worker_specific"]}','ASR 17/04/2025','Access only after worker general and specific training.'),
('preposto_initial','delivery_initial','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025','E-learning is not allowed.'),
('preposto_initial','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":30,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025','Final learning verification.'),
('preposto_initial','renewal_cycle','renewal',30,'{}','{"update_blueprint":"preposto_update","interval_months":24,"minimum_minutes":360}','ASR 17/04/2025','Two-year update cycle.'),
('preposto_update','delivery_update','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025','E-learning is not allowed for preposto update.'),
('preposto_update','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025','Update verification.'),
('dirigente_initial','delivery_initial','delivery',10,'{}','{"allowed":["physical","synchronous_video","asynchronous_elearning"]}','ASR 17/04/2025',null),
('dirigente_initial','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":30,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('dirigente_initial','renewal_cycle','renewal',30,'{}','{"update_blueprint":"dirigente_update","interval_months":60,"minimum_minutes":360}','ASR 17/04/2025',null),
('dirigente_update','delivery_update','delivery',10,'{}','{"allowed":["physical","synchronous_video","asynchronous_elearning"]}','ASR 17/04/2025',null),
('dirigente_update','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('employer_initial','delivery_initial','delivery',10,'{}','{"allowed":["physical","synchronous_video","asynchronous_elearning"]}','ASR 17/04/2025',null),
('employer_initial','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":30,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('employer_initial','renewal_cycle','renewal',30,'{}','{"update_blueprint":"employer_update","interval_months":60,"minimum_minutes":360}','ASR 17/04/2025',null),
('employer_update','delivery_update','delivery',10,'{}','{"allowed":["physical","synchronous_video","asynchronous_elearning"]}','ASR 17/04/2025',null),
('employer_update','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('dl_spp_common','requires_employer_course','eligibility',5,'{}','{"requires":["employer_initial"]}','ASR 17/04/2025','The common module is accessed after the employer course.'),
('dl_spp_common','delivery_initial','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025',null),
('dl_spp_common','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":30,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('dl_spp_common','renewal_cycle','renewal',30,'{}','{"update_blueprint":"dl_spp_update","interval_months":60,"minimum_minutes":480}','ASR 17/04/2025',null),
('dl_spp_sector','delivery_initial','delivery',10,'{}','{"allowed":["physical","synchronous_video"],"asynchronous_elearning":false}','ASR 17/04/2025',null),
('dl_spp_sector','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":30,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('dl_spp_update','delivery_update','delivery',10,'{}','{"allowed":["physical","synchronous_video","asynchronous_elearning"]}','ASR 17/04/2025','E-learning is allowed for the DL-SPP update.'),
('dl_spp_update','final_verification','assessment',20,'{}','{"mode":"test_or_interview","test_min_questions":10,"min_options":3,"passing_score_pct":70}','ASR 17/04/2025',null),
('rls_update','under_15_collective_bargaining','duration',15,'{"employees_max":14}','{"duration_source":"national_collective_bargaining","proportionality":{"company_size":true,"risk_level":true},"fixed_variant":false}','D.Lgs. 81/2008 art. 37 c.11 as amended 2025','Do not infer a fixed duration for companies under 15 workers.')
on conflict (blueprint_key,rule_key) do update set
  rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,
  outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

-- Reusable role-course Learning Units. One-hour allocation is internal instructional decomposition.
do $do$
declare
  r record;
  v_lu uuid;
  v_ver uuid;
  v_q uuid;
  v_content jsonb;
begin
  for r in select * from (values
    ('roles:shared:legislative-system','Sistema legislativo della salute e sicurezza','Leggere il quadro normativo e collegarlo ai ruoli, ai processi e alle decisioni aziendali.','shared'),
    ('roles:shared:prevention-actors','Soggetti del sistema di prevenzione','Distinguere compiti, relazioni e responsabilità dei soggetti del sistema di prevenzione aziendale.','shared'),
    ('roles:shared:responsibilities-delegation','Responsabilità e delega di funzioni','Comprendere responsabilità civili, penali e amministrative e condizioni e limiti della delega.','shared'),
    ('roles:shared:institutional-system','Sistema istituzionale, vigilanza e ispezioni','Conoscere ruoli di ASL, INL, VVF e INAIL e il funzionamento delle attività di vigilanza e ispezione.','shared'),
    ('roles:preposto:role-effectiveness','Individuazione del preposto ed effettività del ruolo','Riconoscere il preposto in relazione alle funzioni effettivamente esercitate e ai suoi obblighi.','preposto'),
    ('roles:preposto:supervision-control','Sovrintendenza e vigilanza operativa','Applicare la funzione di controllo sull’osservanza delle disposizioni e delle procedure da parte dei lavoratori.','preposto'),
    ('roles:preposto:nonconformity-interruption','Non conformità, intervento e interruzione dell’attività','Gestire condizioni e comportamenti non sicuri, segnalare e interrompere l’attività quando ricorrono i presupposti.','preposto'),
    ('roles:preposto:communication-workers','Comunicazione e informazione ai lavoratori','Usare tecniche di comunicazione e sensibilizzazione efficaci, anche con neoassunti, somministrati e lavoratori stranieri.','preposto'),
    ('roles:preposto:risk-context','Rischi del contesto operativo e misure di prevenzione','Collegare i rischi presenti nel contesto operativo alle misure tecniche, organizzative e procedurali definite dall’azienda.','preposto'),
    ('roles:preposto:contracts-interference','Appalti, interferenze e DUVRI per il preposto','Comprendere le ricadute operative di appalti, somministrazione, subappalti e gestione delle interferenze.','preposto'),
    ('roles:preposto:incident-near-miss','Incidenti, infortuni mancati e segnalazioni','Individuare e segnalare incidenti e near miss come informazioni utili al miglioramento della prevenzione.','preposto'),
    ('roles:preposto:cooperation','Cooperazione con datore, dirigente e SPP','Cooperare con datore di lavoro, dirigenti e servizio di prevenzione e protezione per attuare le modalità operative.','preposto'),
    ('roles:dirigente:role-obligations','Ruolo, obblighi e responsabilità del dirigente','Inquadrare ruolo e obblighi del dirigente e il rapporto con le altre figure della prevenzione.','dirigente'),
    ('roles:dirigente:organization-processes','Organizzazione dei processi di salute e sicurezza','Organizzare e gestire processi e attività relativi alla salute e sicurezza nel proprio ambito di responsabilità.','dirigente'),
    ('roles:dirigente:models-sgsl','Modelli organizzativi e sistemi di gestione','Comprendere MOG ex art. 30 e sistemi di gestione della salute e sicurezza come strumenti organizzativi.','dirigente'),
    ('roles:dirigente:risk-context-directives','Rischi del contesto e direttive del datore di lavoro','Tradurre la valutazione dei rischi e le direttive del datore in misure organizzative e operative coerenti.','dirigente'),
    ('roles:dirigente:contracts-subcontracts','Contratti d’opera, somministrazione e subappalti','Gestire gli aspetti di salute e sicurezza connessi a contratti, subappalti, interferenze e DUVRI.','dirigente'),
    ('roles:dirigente:emergency-organization','Organizzazione delle emergenze','Organizzare prevenzione incendi, primo soccorso e gestione delle emergenze nel proprio ambito.','dirigente'),
    ('roles:dirigente:training-consultation','Formazione, informazione e consultazione','Governare obblighi formativi, informazione, partecipazione e consultazione dei lavoratori e dei loro rappresentanti.','dirigente'),
    ('roles:dirigente:leadership-conflict','Comunicazione, leadership e gestione dei conflitti','Utilizzare comunicazione, gestione dei gruppi e gestione dei conflitti per sostenere comportamenti sicuri.','dirigente'),
    ('roles:employer:role-context','Identificazione e ruolo del datore di lavoro','Individuare il datore di lavoro in relazione al contesto organizzativo e alle funzioni effettive.','employer'),
    ('roles:employer:legal-liability','Obblighi e responsabilità del datore di lavoro','Approfondire obblighi e responsabilità civili, penali e amministrative del datore di lavoro.','employer'),
    ('roles:employer:231','Responsabilità amministrativa e D.Lgs. 231/2001','Comprendere le ricadute del D.Lgs. 231/2001 e il rapporto con i modelli organizzativi.','employer'),
    ('roles:employer:violence-inclusion','Violenza, molestie e inclusione','Integrare nella gestione SSL prevenzione di violenza e molestie e tutela dei lavoratori con specifiche esigenze.','employer'),
    ('roles:employer:inspection-bodies','Organi di vigilanza e procedure ispettive','Gestire consapevolmente rapporti, obblighi documentali e procedure con gli organi di vigilanza.','employer'),
    ('roles:employer:technical-standards','Standard tecnico-strutturali e documentazione','Governare conformità di attrezzature, impianti, luoghi e agenti di rischio e relativa documentazione obbligatoria.','employer'),
    ('roles:employer:risk-assessment-governance','Valutazione dei rischi e misure conseguenti','Governare la valutazione dei rischi e la definizione delle misure di prevenzione e protezione.','employer'),
    ('roles:employer:collective-priority','Priorità delle misure collettive e tutela delle differenze','Applicare la gerarchia delle misure privilegiando la protezione collettiva e considerando gruppi e condizioni particolari.','employer'),
    ('roles:employer:duvri-contracts','Appalti, interferenze e DUVRI','Organizzare la gestione di appalti, interferenze, DUVRI e riunioni periodiche di sicurezza.','employer'),
    ('roles:employer:health-emergency-training','Sorveglianza sanitaria, emergenze e formazione','Integrare sorveglianza sanitaria, emergenze, informazione, formazione, partecipazione e consultazione.','employer'),
    ('roles:employer:monitoring-procedures','Vigilanza sulle procedure e verifica dell’efficacia','Organizzare la vigilanza sul rispetto delle procedure e la verifica periodica della loro applicazione ed efficacia.','employer'),
    ('roles:employer:mog-costs-communication','MOG, costi-benefici e comunicazione','Valutare modelli organizzativi, costi della mancata sicurezza, benefici della prevenzione e strumenti di comunicazione.','employer'),
    ('roles:dlspp:evaluation-methods','Criteri e metodologie di valutazione dei rischi','Applicare criteri e strumenti per individuare e valutare i rischi in modo metodologicamente coerente.','dl_spp'),
    ('roles:dlspp:dvr-structure','Struttura e contenuti del DVR','Strutturare il documento di valutazione dei rischi collegando pericoli, valutazioni, misure e programma di miglioramento.','dl_spp'),
    ('roles:dlspp:near-miss-analysis','Analisi di infortuni e near miss','Analizzare infortuni mancati e modalità di accadimento per individuare cause e azioni di prevenzione.','dl_spp'),
    ('roles:dlspp:technical-admin-docs','Documentazione tecnico-amministrativa','Organizzare e mantenere la documentazione tecnico-amministrativa rilevante per il sistema di prevenzione.','dl_spp'),
    ('roles:dlspp:risk-factors-workplace-equipment','Luoghi, attrezzature, MMC e VDT','Valutare i principali fattori di rischio connessi a luoghi di lavoro, attrezzature, movimentazione carichi e videoterminali.','dl_spp'),
    ('roles:dlspp:agents-hazards','Agenti fisici, sostanze, agenti biologici e ATEX','Inquadrare i criteri di prevenzione per agenti fisici, sostanze pericolose, agenti biologici e atmosfere esplosive.','dl_spp'),
    ('roles:dlspp:psychosocial-differences','Stress, rischi psicosociali e differenze','Considerare stress lavoro-correlato, fattori psicosociali e rischi connessi a genere, età e provenienza.','dl_spp'),
    ('roles:dlspp:controls-ppe-signage','Misure di prevenzione, DPI e segnaletica','Selezionare misure tecniche, organizzative e procedurali, DPI e segnaletica in coerenza con la valutazione dei rischi.','dl_spp'),
    ('roles:cantiere:subjects-obligations','Soggetti del Titolo IV e relativi obblighi','Conoscere soggetti, obblighi e responsabilità nel cantiere temporaneo o mobile.','cantiere'),
    ('roles:cantiere:plans-psc-pos','PSC e POS: finalità, tempi e contenuti','Comprendere funzione, contenuti e relazioni tra PSC e POS.','cantiere'),
    ('roles:cantiere:art95-art96','Misure generali di tutela e obblighi ex artt. 95 e 96','Applicare le misure generali di tutela e gli obblighi di datore, dirigenti e preposti previsti per i cantieri.','cantiere'),
    ('roles:cantiere:cronoprogramma','Cronoprogramma e organizzazione del cantiere','Leggere il cronoprogramma in relazione a fasi, interferenze e organizzazione in sicurezza.','cantiere'),
    ('roles:cantiere:condition-verification','Verifica delle condizioni di sicurezza dei lavori affidati','Verificare condizioni di sicurezza, applicazione del PSC e coordinamento degli interventi dell’impresa affidataria.','cantiere'),
    ('roles:cantiere:pos-analysis-coordination','Congruenza dei POS e coordinamento','Valutare la congruenza dei POS delle imprese esecutrici e coordinare gli adempimenti dell’impresa affidataria.','cantiere')
  ) t(stable_key,title,summary,audience)
  loop
    v_content := jsonb_build_object(
      'id',split_part(r.stable_key,':',3),
      'title',r.title,
      'slide_title',r.title,
      'summary',r.summary,
      'detail',r.summary||' L’unità va sempre ricondotta all’organizzazione, alle procedure e ai rischi reali dell’azienda.',
      'norm','Accordo Stato-Regioni 17/04/2025 - Rep. 59/CSR',
      'minutes',60,
      'icon','🧭',
      'visual','role-safety',
      'teacher','Collegare il contenuto a casi, documenti e decisioni reali; evitare una trattazione solo mnemonica.',
      'quiz',jsonb_build_object(
        'q','Quale affermazione descrive correttamente l’argomento trattato?',
        'answers',jsonb_build_array(
          r.summary,
          'È un adempimento puramente formale senza ricadute operative.',
          'Riguarda esclusivamente il medico competente.'),
        'correct',0),
      'quality',jsonb_build_object('version','v20.028','checkpoint_only',true,'final_assessment',false),
      'scope',jsonb_build_object(
        'audience',r.audience,
        'internal_didactic_allocation',true,
        'statutory_per_topic_duration',false)
    );

    insert into public.learning_units(
      stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    values(
      r.stable_key,r.title,r.summary,60,'ruoli_asr2025',array['asr2025','roles',r.audience],true,
      jsonb_build_object(
        'regulatory_basis','ASR 17/04/2025',
        'audience',r.audience,
        'internal_didactic_allocation',true,
        'created_by_migration','v20_028'))
    on conflict (stable_key) do update set
      title=excluded.title,
      summary=excluded.summary,
      default_minutes=60,
      source_group='ruoli_asr2025',
      tags=excluded.tags,
      active=true,
      metadata=public.learning_units.metadata||excluded.metadata,
      updated_at=now()
    returning id into v_lu;

    select id into v_ver
    from public.learning_unit_versions
    where learning_unit_id=v_lu and version_number=1
    limit 1;

    if v_ver is null then
      insert into public.learning_unit_versions(
        learning_unit_id,version_number,status,content,published_at)
      values(v_lu,1,'published',v_content,now())
      returning id into v_ver;
    else
      update public.learning_unit_versions
      set status='published',content=v_content,published_at=coalesce(published_at,now())
      where id=v_ver;
    end if;

    insert into public.questions(
      stable_key,unit_version_id,prompt,question_type,options,public_explanation,active,metadata)
    values(
      r.stable_key||':checkpoint',v_ver,
      'Quale affermazione descrive correttamente l’argomento trattato?',
      'single_choice',
      jsonb_build_array(
        jsonb_build_object('id','0','label',r.summary),
        jsonb_build_object('id','1','label','È un adempimento puramente formale senza ricadute operative.'),
        jsonb_build_object('id','2','label','Riguarda esclusivamente il medico competente.')),
      r.summary,true,
      jsonb_build_object(
        'tags',array['asr2025','roles',r.audience],
        'assignment',jsonb_build_object(
          'purpose','checkpoint','required',true,'unit_stable_key',r.stable_key),
        'not_final_assessment',true,
        'created_by_migration','v20_028'))
    on conflict (stable_key) do update set
      unit_version_id=excluded.unit_version_id,
      prompt=excluded.prompt,
      options=excluded.options,
      public_explanation=excluded.public_explanation,
      active=true,
      metadata=public.questions.metadata||excluded.metadata,
      updated_at=now()
    returning id into v_q;

    insert into public.question_answer_keys(question_id,answer_key,explanation_private)
    values(v_q,jsonb_build_object('correct_answer',jsonb_build_object('option_id','0')),r.summary)
    on conflict (question_id) do update set
      answer_key=excluded.answer_key,
      explanation_private=excluded.explanation_private,
      updated_at=now();
  end loop;
end $do$;

update public.training_blueprint_course_types
set development_status='partial',
    metadata=metadata||jsonb_build_object(
      'regulatory_registry_version','v20_028',
      'learning_library','ruoli_asr2025',
      'requires_final_composition_review',true),
    updated_at=now()
where source_system='safetymanager'
  and external_course_code in (
    'preposto','agg_prep','dirigente','agg_dir','dl_base','agg_dl','mod_cantieri',
    'dl_spp_comune','dl_spp_agri','dl_spp_pesca','dl_spp_costruzioni','dl_spp_chimico','agg_dl_spp'
  );
