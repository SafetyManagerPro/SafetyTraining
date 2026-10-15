create table if not exists public.training_sources (
  source_key text primary key,
  authority text not null,
  title text not null,
  source_type text not null,
  canonical_url text not null,
  publication_date date,
  checked_on date not null default current_date,
  license_kind text not null default 'unknown',
  reuse_policy text not null,
  normative_status text not null default 'supporting',
  topics text[] not null default '{}'::text[],
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_unit_sources (
  learning_unit_id uuid not null references public.learning_units(id) on delete cascade,
  source_key text not null references public.training_sources(source_key) on delete cascade,
  purpose text not null,
  relevance_note text,
  verified_on date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  primary key (learning_unit_id, source_key, purpose)
);

create index if not exists learning_unit_sources_source_idx on public.learning_unit_sources(source_key);
create index if not exists training_sources_topics_gin on public.training_sources using gin(topics);

alter table public.training_sources enable row level security;
alter table public.learning_unit_sources enable row level security;

grant select, insert, update, delete on public.training_sources to authenticated;
grant select, insert, update, delete on public.learning_unit_sources to authenticated;

create policy training_sources_admin_all on public.training_sources
for all to authenticated
using (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())))
with check (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())));

create policy learning_unit_sources_admin_all on public.learning_unit_sources
for all to authenticated
using (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())))
with check (exists (select 1 from public.platform_admins pa where pa.user_id = (select auth.uid())));

insert into public.training_sources
(source_key,authority,title,source_type,canonical_url,publication_date,checked_on,license_kind,reuse_policy,normative_status,topics,notes,metadata)
values
('rer-formazione-figure-prevenzione','Regione Emilia-Romagna','Formazione docenti e figure della prevenzione - raccolta materiali','didactic_material','https://salute.regione.emilia-romagna.it/dalla-scuola-al-lavoro-in-salute-e-sicurezza/materiale-utile/formazione-docenti-e-figure-della-prevenzione',null,'2026-10-15','CC BY 4.0 salvo elementi diversamente indicati','adapt_with_attribution','historical_check_required',array['RSPP','ASPP','valutazione rischi','soggetti prevenzione','DPI','emergenze','formazione'],'Materiale didattico utile, ma alcune parti nascono dal quadro precedente all ASR 2025: verificare sempre contro normativa vigente.','{"priority":"high","provided_by_user":true}'::jsonb),
('comune-milano-materiale-didattico','Comune di Milano','Sicurezza sul lavoro - materiale didattico','didactic_material','https://sslcommil.comune.milano.it/formazione/materiale-didattico',null,'2026-10-15','rights_review_required','reference_and_original_rewrite','historical_check_required',array['lavoratori','preposti','dirigenti','RLS','primo soccorso','antincendio','lavori in quota'],'Benchmark operativo: alcune dispense possono contenere sezioni stratificate o precedenti all ASR 2025. Nessuna copia diretta di testi o immagini senza verifica dei diritti.','{"priority":"high","provided_by_user":true}'::jsonb),
('anfos-materiale-didattico','ANFOS / Sicurezza.com','Materiale didattico corsi sicurezza','benchmark','https://elearning.sicurezza.com/corso/materialedidattico.html',null,'2026-10-15','no_open_license_verified','reference_and_original_rewrite','didactic_only',array['lavoratori','preposti','RLS','primo soccorso','antincendio','stress lavoro-correlato'],'Fonte secondaria per controllo di completezza e confronto didattico; riscrittura originale e validazione su fonti ufficiali obbligatorie.','{"priority":"secondary","provided_by_user":true}'::jsonb),
('vvf-materiali-antincendio','Corpo Nazionale dei Vigili del Fuoco','Materiale didattico per corsi di formazione antincendio','institutional_guidance','https://www.vigilfuoco.it/comando-vvf-napoli/formazione-le-aziende/materiale-didattico-i-corsi-di-formazione-8108',null,'2026-10-15','institutional_terms','reference_and_original_rewrite','official_guidance',array['antincendio','livello 1','livello 2','livello 3','esercitazioni'],'Riferimento tecnico-didattico prioritario per la famiglia antincendio, da affiancare al D.M. 2 settembre 2021.','{"priority":"primary_technical"}'::jsonb),
('inail-quaderni-cantieri','INAIL','Quaderni tecnici per i cantieri temporanei o mobili','technical_publication','https://www.inail.it/portale/it/inail-comunica/news/notizia.2018.10.-quaderni-tecnici-per-i-cantieri-temporanei-o-mobili-sul-portale-inail-la-nuova-edizione.html','2018-10-03','2026-10-15','institutional_terms','reference_and_original_rewrite','supporting',array['cantieri','ponteggi','ancoraggi','parapetti','reti','scale','scavi','anticaduta','trabattelli'],'Riferimento tecnico da aggiornare con norme tecniche e legislazione vigente.','{"priority":"high_technical"}'::jsonb),
('inail-informo-carrelli-21','INAIL - Sistema Infor.MO','Utilizzo dei carrelli elevatori: dinamiche infortunistiche, fattori di rischio e misure preventive - Scheda 21','incident_evidence','https://www.inail.it/content/dam/inail-hub-site/documenti/2024/01/Scheda%2021%20InforMO.pdf',null,'2026-10-15','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['carrelli elevatori','investimento','ribaltamento','viabilità','interferenze'],'Fonte evidence-based per casi, near miss, fattori causali e misure preventive.','{"priority":"high_evidence"}'::jsonb),
('inail-informo-confinati-11','INAIL - Sistema Infor.MO','Gli ambienti confinati - Scheda 11','incident_evidence','https://www.inail.it/content/dam/inail-hub-site/documenti/2017/06/Scheda11-InforMO.pdf',null,'2026-10-15','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['ambienti confinati','atmosfera','isolamento','soccorso','permesso di lavoro'],'Fonte evidence-based per dinamiche infortunistiche e costruzione di scenari; riferimenti normativi da aggiornare.','{"priority":"high_evidence"}'::jsonb),
('piemonte-indicazioni-formazione-2025','Regione Piemonte','Indicazioni operative per la formazione alla salute e sicurezza nei luoghi di lavoro - luglio 2025','institutional_guidance','https://www.regione.piemonte.it/web/temi/sanita/sicurezza-sul-lavoro/formazione-materia-salute-sicurezza-sul-lavoro','2025-07-23','2026-10-15','institutional_terms','reference_and_original_rewrite','official_guidance',array['ASR 2025','formazione','soggetti formatori','attestati','verifiche','modalità erogazione'],'Cross-check operativo post ASR 2025; non sostituisce la fonte nazionale.','{"priority":"high_compliance"}'::jsonb),
('inail-catalogo-2026','INAIL','Catalogo generale pubblicazioni INAIL','technical_publication','https://www.inail.it/portale/it/inail-comunica/pubblicazioni/catalogo-generale.html',null,'2026-10-15','institutional_terms','reference_and_original_rewrite','supporting',array['pubblicazioni','rischi','cantieri','agenti','attrezzature','prevenzione'],'Indice da monitorare per pubblicazioni tecniche aggiornate.','{"priority":"watch"}'::jsonb)
on conflict (source_key) do update set
 authority=excluded.authority,title=excluded.title,source_type=excluded.source_type,canonical_url=excluded.canonical_url,
 publication_date=excluded.publication_date,checked_on=excluded.checked_on,license_kind=excluded.license_kind,
 reuse_policy=excluded.reuse_policy,normative_status=excluded.normative_status,topics=excluded.topics,notes=excluded.notes,
 metadata=public.training_sources.metadata || excluded.metadata,updated_at=now();

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'vvf-materiali-antincendio','technical_reference','Manuali e materiali VVF come riferimento tecnico-didattico per spiegazioni, procedure ed esercitazioni.','2026-10-15' from public.learning_units where source_group='SafetyTraining fire-v2'
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'inail-quaderni-cantieri','technical_reference','Riferimento per opere provvisionali, protezioni collettive, ancoraggi, cadute e procedure di cantiere.','2026-10-15' from public.learning_units where source_group='SafetyTraining ponteggi-v2' or stable_key in ('csp:tech:height','csp:tech:scaffolds','csp:tech:excavations','csp:practice:inspection','csp:practice:integrated')
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'inail-informo-carrelli-21','incident_evidence','Dinamiche reali e fattori causali per casi e debriefing su carrelli elevatori.','2026-10-15' from public.learning_units where stable_key in ('update:agg_attr_carrelli_ind_4h:practical','update:agg_attr_carrelli_all_4h:practical')
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'inail-informo-confinati-11','incident_evidence','Dinamiche reali per riconoscimento dei punti di rottura della catena incidentale e prevenzione del soccorso impulsivo.','2026-10-15' from public.learning_units where stable_key like 'update:confined:%'
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'piemonte-indicazioni-formazione-2025','compliance_crosscheck','Cross-check operativo delle regole formative successive al recepimento ASR 2025.','2026-10-15' from public.learning_units where active=true and (metadata->>'didactic_version' is not null or source_group ilike '%SafetyTraining%' or source_group in ('rspp_aspp','attrezzature_asr2025'))
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'rer-formazione-figure-prevenzione','didactic_benchmark','Schemi e metodo didattico da adattare e aggiornare, con attribuzione ove applicabile.','2026-10-15' from public.learning_units where source_group='rspp_aspp' or stable_key like 'rspp-aspp:%'
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'comune-milano-materiale-didattico','didactic_benchmark','Benchmark per casi, sequenze operative e modalità di spiegazione; nessuna copia diretta di testi o immagini.','2026-10-15' from public.learning_units where stable_key like 'general:%' or stable_key like 'preposto:%' or stable_key like 'dirigente:%' or source_group='SafetyTraining fire-v2' or stable_key like 'first-aid:%' or stable_key like 'work-height:%'
on conflict do nothing;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on)
select id,'anfos-materiale-didattico','didactic_benchmark','Fonte secondaria per controllo completezza; ogni contenuto deve essere riscritto e verificato su fonti ufficiali.','2026-10-15' from public.learning_units where stable_key like 'general:%' or stable_key like 'preposto:%' or stable_key like 'first-aid:%'
on conflict do nothing;
