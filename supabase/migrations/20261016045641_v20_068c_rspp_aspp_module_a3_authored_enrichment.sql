-- SafetyTraining v20_068c
-- RSPP/ASPP Modulo A · A3 authored enrichment.
-- Draft v2 only; current course composition untouched; Test Builder excluded.

do $$
begin
  if (select count(*) from public.learning_units where stable_key='rspp-aspp:rspp_aspp_a:a3') <> 1 then raise exception 'v20_068c: target missing/duplicated'; end if;
  if (select count(*) from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1 where lu.stable_key='rspp-aspp:rspp_aspp_a:a3') <> 1 then raise exception 'v20_068c: base v1 missing'; end if;
end $$;

with profile as (select $json${"summary":"Gestire la valutazione dei rischi come processo continuo alimentato da pericoli, esposizioni, dati, eventi, interferenze e cambiamenti.","detail":"Il DVR è l’esito documentato di un ciclo: osservazione del lavoro reale, raccolta evidenze, valutazione, scelta delle misure, attribuzione di responsabilità, verifica di efficacia e riesame.","focus":["Integrare osservazioni, dati, segnalazioni e near miss","Esplicitare metodo, assunzioni e limiti","Valutare attività ordinarie e non ordinarie e interferenze","Applicare gerarchia delle misure e verificarne l’efficacia"],"risks":["Valutazione standard non aderente al lavoro reale","Near miss raccolti ma non usati","Interferenze non analizzate","Misure senza indicatori o riesame"],"prevention":["Integrare osservazioni, dati, segnalazioni e near miss","Esplicitare metodo, assunzioni e limiti","Valutare attività ordinarie e non ordinarie e interferenze","Applicare gerarchia delle misure e verificarne l’efficacia"],"procedure":["Definisci contesto ed esposti","Raccogli dati ed eventi","Individua pericoli e condizioni di esposizione","Valuta rischio e incertezza","Definisci misure e owner","Verifica efficacia e riesamina"],"case":"DVR aggiornato sei mesi fa; entrano nuovo appaltatore e nuova linea e avvengono due near miss. Quali evidenze fanno scattare il riesame e come strutturi l’analisi?","question":"Quali evidenze dimostrano che la valutazione rappresenta il lavoro reale e non solo il documento?","teacher_expansion":["Fai distinguere PERICOLO e RISCHIO con esempi diversi a parità di sorgente.","Ricostruisci un near miss: fatti → barriere → fattori → azioni.","Usa un mini-lab su interferenze tra due attività.","Chiudi con evidenza → rischio → misura → owner → indicatore → riesame."],"common_errors":["Confondere pericolo e rischio","Usare una matrice numerica come sostituto dell’analisi","Ignorare near miss perché senza danno","Aggiornare il DVR senza verificare le misure"],"idea_images":[{"file":"idea-risk-cycle.svg","caption":"Ciclo valutazione, misure, verifica e riesame."},{"file":"modello-farfalla-rischio.svg","caption":"Barriere preventive e protettive."},{"file":"idea-duvri.svg","caption":"Interferenze e coordinamento."}],"graphic_cards":[{"image":"idea-risk-cycle.svg","kicker":"SCHEMA AUTORIALE","title":"DVR COME CICLO","text":"Collega il principio alla decisione operativa.","points":["contesto","valutazione","misure","verifica/riesame"]},{"image":"modello-farfalla-rischio.svg","kicker":"SCHEMA AUTORIALE","title":"IMPARARE DAGLI EVENTI","text":"Collega il principio alla decisione operativa.","points":["cause/condizioni","barriere preventive","evento","conseguenze/barriere"]}],"quiz":{"q":"Processo cambiato e near miss non previsti: quale risposta è corretta?","answers":["Riesaminare contesto, pericoli e barriere, definire misure e verificarne l’efficacia.","Attendere la scadenza periodica del DVR.","Registrare i near miss senza cambiare misure.","Fare solo un richiamo comportamentale."],"correct":0,"explanation":"Cambiamenti ed eventi sentinella vanno integrati nel processo di valutazione e miglioramento.","formative_only":true,"test_builder_excluded":true}}$json$::jsonb p),
base as (
  select lu.id learning_unit_id,v.content,p.p
  from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1
  cross join profile p where lu.stable_key='rspp-aspp:rspp_aspp_a:a3'
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
      select coalesce(jsonb_agg(jsonb_build_object('authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'use',case ts.source_key when 'mlps-asr-2025' then 'normative_validation_and_module_a_contents' when 'normattiva-dlgs81-vigente' then 'normative_validation' when 'piemonte-indicazioni-formazione-2025' then 'official_guidance_cross_check' when 'rer-formazione-figure-prevenzione' then 'method_and_visual_structure_reference_only' when 'inail-condivido-near-miss' then 'near_miss_and_learning_from_events_method' end,'checked_on','2026-10-16') order by array_position(array['mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','rer-formazione-figure-prevenzione','inail-condivido-near-miss'],ts.source_key)),'[]'::jsonb)
      from public.training_sources ts where ts.source_key in ('mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','rer-formazione-figure-prevenzione','inail-condivido-near-miss')
    ),
    'source_integration_note','Contenuti, casi, domande e schemi sono originali SafetyTraining; fonti usate per validazione, contenuti minimi e metodo.','final_assessment',false
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
where lu.stable_key='rspp-aspp:rspp_aspp_a:a3'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-condivido-near-miss','near_miss_method_reference','Metodo INAIL per near miss ed eventi sentinella nel riesame della valutazione.',date '2026-10-16','{}'::jsonb
from public.learning_units lu where lu.stable_key='rspp-aspp:rspp_aspp_a:a3'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
