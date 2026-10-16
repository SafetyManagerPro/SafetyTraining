-- SafetyTraining v20_068a
-- RSPP/ASPP Modulo A · A1 authored enrichment.
-- Draft v2 only; current course composition untouched; Test Builder excluded.

do $$
begin
  if (select count(*) from public.learning_units where stable_key='rspp-aspp:rspp_aspp_a:a1') <> 1 then raise exception 'v20_068a: target missing/duplicated'; end if;
  if (select count(*) from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1 where lu.stable_key='rspp-aspp:rspp_aspp_a:a1') <> 1 then raise exception 'v20_068a: base v1 missing'; end if;
end $$;

with profile as (select $json${"summary":"Orientarsi tra sistema legislativo, istituzioni, vigilanza e assistenza, trasformando una regola vigente in responsabilità, azioni ed evidenze aziendali.","detail":"Metodo operativo: partire dalla questione concreta, verificare fonte e campo di applicazione, individuare il soggetto titolare dell’obbligo, definire l’adeguamento e controllarne l’attuazione sul lavoro reale.","focus":["Verificare fonte, vigenza e campo di applicazione","Collegare obbligo, titolare, supporti ed evidenze","Tradurre l’aggiornamento in misure, procedure o organizzazione","Riesaminare l’efficacia dopo il cambiamento"],"risks":["Riferimenti non vigenti o non pertinenti","Conformità solo documentale","Confusione tra supporto tecnico del SPP e poteri della linea aziendale"],"prevention":["Verificare fonte, vigenza e campo di applicazione","Collegare obbligo, titolare, supporti ed evidenze","Tradurre l’aggiornamento in misure, procedure o organizzazione","Riesaminare l’efficacia dopo il cambiamento"],"procedure":["Definisci il problema","Verifica la fonte vigente","Mappa obbligo e soggetto responsabile","Individua evidenze e controlli","Assegna azioni e scadenze","Verifica sul campo e riesamina"],"case":"Una procedura interna richiama una norma superata mentre l’organizzazione sta cambiando. Ricostruisci fonte vigente, obbligo, responsabile, azione ed evidenza di chiusura.","question":"Come eviti che un aggiornamento normativo resti una modifica di carta senza effetto sul lavoro reale?","teacher_expansion":["Apri con: «quando una regola cambia, che cosa deve cambiare davvero in azienda?»","Costruisci la catena fonte → obbligo → soggetto → evidenza → verifica.","Distingui vigilanza, assistenza, supporto SPP e potere organizzativo aziendale.","Chiudi con una mini-checklist di monitoraggio normativo e attuazione."],"common_errors":["Memorizzare sigle senza collegarle a funzioni concrete","Usare fonti secondarie senza verifica","Confondere consulenza tecnica con potere decisionale"],"idea_images":[{"file":"idea-safety-system.svg","caption":"Dal requisito al sistema di prevenzione."},{"file":"organigramma-sicurezza.svg","caption":"Ruoli e relazioni aziendali."}],"graphic_cards":[{"image":"idea-safety-system.svg","kicker":"SCHEMA AUTORIALE","title":"DALLA FONTE ALL’AZIONE","text":"Collega il principio alla decisione operativa.","points":["fonte vigente","obbligo","responsabile","evidenza"]},{"image":"organigramma-sicurezza.svg","kicker":"SCHEMA AUTORIALE","title":"CHI FA COSA","text":"Collega il principio alla decisione operativa.","points":["linea datoriale","SPP","RLS/lavoratori","sistema istituzionale"]}],"quiz":{"q":"Di fronte a una nuova disposizione che incide su una procedura, qual è l’approccio corretto?","answers":["Verificare fonte vigente, obbligo e responsabile, aggiornare le misure e controllarne l’attuazione.","Aggiornare solo il riferimento nel DVR.","Demandare ogni decisione all’RSPP.","Attendere il prossimo controllo ispettivo."],"correct":0,"explanation":"La conformità efficace richiede fonte verificata, responsabilità, attuazione e controllo.","formative_only":true,"test_builder_excluded":true}}$json$::jsonb p),
base as (
  select lu.id learning_unit_id,v.content,p.p
  from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1
  cross join profile p where lu.stable_key='rspp-aspp:rspp_aspp_a:a1'
), enriched as (
  select learning_unit_id, content || p || jsonb_build_object(
    'didactic_version','rspp-aspp-authored-v3',
    'operational',jsonb_build_object(
      'objective',p->>'summary','before',p->'prevention','during',p->'procedure',
      'after',jsonb_build_array('Verifica attuazione ed efficacia.','Traccia criticità aperte, owner, scadenza e riesame.'),
      'step_by_step',p->'procedure',
      'if_problem',jsonb_build_array('Se mancano informazioni essenziali, attiva l’approfondimento competente.','Se emerge una condizione grave non controllata, attiva subito chi ha potere di intervento.'),
      'stop_conditions',p->'risks',
      'who_to_involve',jsonb_build_array('Datore di lavoro/dirigenti','RSPP/ASPP','Preposti','RLS e lavoratori','Medico competente quando pertinente'),
      'remember',p->>'summary','adaptation','Adattare esempi e decisioni a DVR, procedure, ruoli e contesto reale.'
    ),
    'quality',jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'final_assessment',false,'test_builder_excluded',true),
    'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','normative_validation','D.Lgs. 81/2008 vigente + ASR 17/04/2025 Rep. 59/CSR','reuse_policy','facts_reference_and_original_didactic_rewrite'),
    'evidence_sources',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,
        'use',case ts.source_key
          when 'mlps-asr-2025' then 'normative_validation_and_module_a_contents'
          when 'normattiva-dlgs81-vigente' then 'normative_validation'
          when 'piemonte-indicazioni-formazione-2025' then 'official_guidance_cross_check'
          when 'rer-formazione-figure-prevenzione' then 'method_and_visual_structure_reference_only'
        end,'checked_on','2026-10-16'
      ) order by array_position(array['mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','rer-formazione-figure-prevenzione'],ts.source_key)),'[]'::jsonb)
      from public.training_sources ts where ts.source_key in ('mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','rer-formazione-figure-prevenzione')
    ),
    'source_integration_note','Contenuti, casi, domande e schemi sono originali SafetyTraining; fonti usate per validazione, contenuti minimi e metodo.',
    'final_assessment',false
  ) new_content from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,s.source_key,s.purpose,s.note,date '2026-10-16',s.metadata
from public.learning_units lu cross join (values
 ('mlps-asr-2025','normative_validation','Fonte ufficiale MLPS per durata, obiettivi e contenuti minimi del Modulo A.',jsonb_build_object('scope','Modulo A')),
 ('normattiva-dlgs81-vigente','normative_validation','Validazione vigente del quadro prevenzionistico.','{}'::jsonb),
 ('piemonte-indicazioni-formazione-2025','official_guidance_cross_check','Controllo operativo dell’applicazione dell’Accordo 2025.','{}'::jsonb),
 ('rer-formazione-figure-prevenzione','method_reference','Riferimento metodologico/visuale storico; claim normativi ricontrollati su fonti 2025/2026.',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable'))
) s(source_key,purpose,note,metadata)
where lu.stable_key='rspp-aspp:rspp_aspp_a:a1'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
