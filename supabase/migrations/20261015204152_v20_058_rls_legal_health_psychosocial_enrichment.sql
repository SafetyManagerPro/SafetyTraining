-- SafetyTraining v20.058
-- RLS enrichment batch 3: legal sources, responsibility, health surveillance, psychosocial risk.
-- Draft LU v2 only; published legacy versions remain unchanged.

insert into public.training_sources(source_key,authority,title,source_type,canonical_url,publication_date,checked_on,license_kind,reuse_policy,normative_status,topics,notes,metadata)
values
('inail-stress-methodology-2025','INAIL','Metodologia per la valutazione e gestione del rischio stress lavoro-correlato - aggiornamenti 2025','technical_method','https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-salute-sul-lavoro/rischi-psicosociali-e-tutela-dei-lavoratori-vulnerabili/rischio-stress-lavoro-correlato.html?all=true',date '2025-04-11',date '2026-10-15','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['stress lavoro-correlato','rischi psicosociali','valutazione partecipativa','organizzazione'], 'Metodo INAIL per valutazione e gestione SLC e moduli integrativi 2025.',jsonb_build_object('priority','high_evidence')),
('inail-violence-work-2025','INAIL','Molestie e violenze sul lavoro - analisi e prevenzione','incident_evidence','https://www.inail.it/portale/it/inail-comunica/news/notizia.2025.03.molestie-e-violenze-sul-lavoro-analisi-di-un-fenomeno-in-crescita.html',date '2025-03-17',date '2026-10-15','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['violenze','molestie','aggressioni','rischi psicosociali','prevenzione'], 'Fonte INAIL per fenomenologia e prevenzione di molestie, minacce e aggressioni sul lavoro.',jsonb_build_object('priority','high_evidence'))
on conflict (source_key) do update set authority=excluded.authority,title=excluded.title,source_type=excluded.source_type,canonical_url=excluded.canonical_url,publication_date=excluded.publication_date,checked_on=excluded.checked_on,license_kind=excluded.license_kind,reuse_policy=excluded.reuse_policy,normative_status=excluded.normative_status,topics=excluded.topics,notes=excluded.notes,metadata=excluded.metadata,updated_at=now();

with base as (
 select lu.id learning_unit_id,lu.stable_key,v.content
 from public.learning_units lu
 join lateral (select content from public.learning_unit_versions luv where luv.learning_unit_id=lu.id and luv.status='published' order by version_number desc limit 1) v on true
 where lu.stable_key in ('rls:principi-giuridici-rls','rls:sanzioni-responsabilita-rls','rls:sorveglianza-sanitaria-rls','rls:stress-violenza-rls')
), enriched as (
 select learning_unit_id,stable_key,
  content || jsonb_build_object('didactic_version','rls-v2','quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'scenario_based',true),'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-15','normative_validation','Normattiva D.Lgs. 81/2008 vigente','reuse_policy','reference_and_original_rewrite'))
  || case stable_key
   when 'rls:principi-giuridici-rls' then jsonb_build_object(
     'source_hierarchy_lab',jsonb_build_object('title','Che valore ha questa fonte?','cards',jsonb_build_array('norma vigente','regolamento/atto attuativo','accordo o disposizione applicabile','documento istituzionale tecnico','norma tecnica/buona prassi','materiale didattico o commento'),'task','Consegnare sei documenti simulati e far stabilire: fonte, vigenza, campo di applicazione, valore nel caso concreto e fonte primaria da verificare.','rule','Una slide, una FAQ o una guida possono aiutare a capire, ma non sostituiscono il controllo della fonte normativa vigente.'),
     'legal_reading_method',jsonb_build_array('identifica la fonte','controlla vigenza/data','individua destinatari e campo','distingui obbligo da raccomandazione','collega la regola alla situazione aziendale')
   )
   when 'rls:sanzioni-responsabilita-rls' then jsonb_build_object(
     'responsibility_lab',jsonb_build_object('title','Obbligo, potere, omissione: a chi compete?','matrix',jsonb_build_array('obbligo/decisione','soggetto titolare','potere organizzativo disponibile','azione attesa','evidenza','possibile omissione','ruolo dell’RLS'),'scenarios',jsonb_build_array('misura DVR non attuata','preposto non presente dove necessario','formazione non organizzata','segnalazione RLS senza risposta','procedura firmata ma non applicata'),'principle','La responsabilità non si trasferisce all’RLS perché segnala, partecipa o firma un verbale: occorre collegare obblighi ai soggetti e ai poteri effettivi previsti dal sistema.'),
     'escalation_tool',jsonb_build_array('documenta il fatto','individua il soggetto competente','formula richiesta/osservazione','fissa o registra il follow-up','se le misure restano inidonee valuta gli strumenti previsti dall’art. 50')
   )
   when 'rls:sorveglianza-sanitaria-rls' then jsonb_build_object(
     'health_surveillance_lab',jsonb_build_object('title','Parlare di sorveglianza sanitaria senza entrare nei dati clinici individuali','allowed_questions',jsonb_build_array('Il protocollo sanitario è coerente con i rischi del DVR?','Le prescrizioni organizzative aggregate trovano attuazione?','Sono emerse indicazioni generali utili alla prevenzione?','Le condizioni di lavoro richiedono riesame della valutazione?'),'not_for_rls',jsonb_build_array('diagnosi individuali','cartelle sanitarie','dettagli clinici nominativi','interpretazioni mediche personali'),'scenario','Più lavoratori riferiscono disturbi simili: l’RLS raccoglie il tema organizzativo/espositivo e coinvolge i soggetti competenti senza chiedere dati clinici individuali.'),
     'privacy_boundary','L’RLS lavora su rischi, organizzazione, misure e informazioni aggregate pertinenti; la valutazione clinica individuale resta nell’ambito sanitario competente.'
   )
   when 'rls:stress-violenza-rls' then jsonb_build_object(
     'psychosocial_lab',jsonb_build_object('title','Dai segnali organizzativi alle misure preventive','data_map',jsonb_build_array('eventi sentinella/assenze/turnover','carichi e ritmi','autonomia e chiarezza dei ruoli','conflitti e supporto','cambiamenti organizzativi','aggressioni/minacce/molestie','lavoro con pubblico','lavoro remoto/tecnologia'),'task','Dati tre scenari, distinguere segnale individuale da fattore organizzativo, scegliere dati da approfondire e proporre una misura primaria sull’organizzazione prima delle sole misure individuali.','participation','Raccogliere percezioni dei lavoratori con metodo e riservatezza; integrare dati oggettivi e confronto con le figure della prevenzione.'),
     'violence_prevention_map',jsonb_build_array('riconoscere contesti e fattori di rischio','definire comportamenti inaccettabili e canali di segnalazione','organizzare spazi, turni, accessi e supporto','formare su prevenzione/de-escalation ove pertinente','gestire e registrare gli eventi','seguire azioni e supporto','rivalutare il rischio'),
     'evidence_sources',jsonb_build_array(jsonb_build_object('authority','INAIL','title','Metodologia rischio stress lavoro-correlato e aggiornamenti 2025','url','https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-salute-sul-lavoro/rischi-psicosociali-e-tutela-dei-lavoratori-vulnerabili/rischio-stress-lavoro-correlato.html?all=true','use','technical_method','checked_on','2026-10-15'),jsonb_build_object('authority','INAIL','title','Molestie e violenze sul lavoro - analisi 2025','url','https://www.inail.it/portale/it/inail-comunica/news/notizia.2025.03.molestie-e-violenze-sul-lavoro-analisi-di-un-fenomeno-in-crescita.html','use','risk_evidence','checked_on','2026-10-15'))
   ) end as new_content
 from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione del quadro normativo vigente per fonti, responsabilità, sorveglianza sanitaria e valutazione dei rischi.',date '2026-10-15','{}'::jsonb from public.learning_units lu where lu.stable_key in ('rls:principi-giuridici-rls','rls:sanzioni-responsabilita-rls','rls:sorveglianza-sanitaria-rls','rls:stress-violenza-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-stress-methodology-2025','technical_method','Metodo INAIL partecipativo per valutazione e gestione dello stress lavoro-correlato e rischi psicosociali.',date '2026-10-15','{}'::jsonb from public.learning_units lu where lu.stable_key='rls:stress-violenza-rls'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-violence-work-2025','risk_evidence','Evidenze INAIL per leggere molestie, minacce e aggressioni come rischio lavorativo da prevenire e gestire.',date '2026-10-15','{}'::jsonb from public.learning_units lu where lu.stable_key='rls:stress-violenza-rls'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
