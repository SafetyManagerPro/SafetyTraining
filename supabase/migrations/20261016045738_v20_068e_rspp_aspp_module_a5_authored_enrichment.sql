-- SafetyTraining v20_068e
-- RSPP/ASPP Modulo A · A5 authored enrichment.
-- Draft v2 only; current course composition untouched; Test Builder excluded.

do $$
begin
  if (select count(*) from public.learning_units where stable_key='rspp-aspp:rspp_aspp_a:a5') <> 1 then raise exception 'v20_068e: target missing/duplicated'; end if;
  if (select count(*) from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1 where lu.stable_key='rspp-aspp:rspp_aspp_a:a5') <> 1 then raise exception 'v20_068e: base v1 missing'; end if;
end $$;

with profile as (select $json${"summary":"Progettare consultazione, informazione, formazione e addestramento come processi che producono competenza, partecipazione e feedback.","detail":"Si distinguono finalità e prove: comunicare non equivale a far apprendere; la formazione sviluppa conoscenze e capacità, l’addestramento esercita l’uso corretto e sicuro quando richiesto, la consultazione porta informazioni del lavoro reale nelle decisioni.","focus":["Programmare la consultazione nei punti decisionali pertinenti","Definire obiettivi osservabili e destinatari","Usare metodi coerenti con le competenze da sviluppare","Verificare comprensione, abilità e trasferimento al lavoro"],"risks":["Consultazione svolta a decisione già presa","Informazione ridotta a email/firma","Formazione non aderente a rischi e compiti","Addestramento dichiarato senza prova pratica"],"prevention":["Programmare la consultazione nei punti decisionali pertinenti","Definire obiettivi osservabili e destinatari","Usare metodi coerenti con le competenze da sviluppare","Verificare comprensione, abilità e trasferimento al lavoro"],"procedure":["Individua bisogno e destinatari","Definisci chi consultare/informare/formare/addestrare","Stabilisci obiettivi osservabili","Scegli metodo ed esercitazioni","Verifica comprensione/abilità","Osserva applicazione e raccogli feedback"],"case":"Una nuova procedura per attrezzatura viene inviata via email; tutti firmano ma continuano a usare la vecchia sequenza e l’RLS è informato solo dopo. Che cosa è mancato?","question":"Come distingui la prova di comunicazione dalla prova che la persona sappia applicare la competenza richiesta?","teacher_expansion":["Confronta leggere una comunicazione, discutere un rischio ed eseguire una procedura.","Costruisci destinatario → obiettivo → metodo → evidenza → verifica.","Usa il caso email per separare tracciabilità amministrativa e apprendimento.","Chiudi chiedendo cosa osservare sul campo una settimana dopo."],"common_errors":["Confondere presenza con apprendimento","Chiamare addestramento una spiegazione solo teorica","Consultare quando la decisione è già chiusa","Ignorare barriere organizzative che impediscono il comportamento corretto"],"idea_images":[{"file":"idea-rls-consult.svg","caption":"Consultazione e partecipazione."},{"file":"organigramma-sicurezza.svg","caption":"Relazioni tra soggetti della prevenzione."},{"file":"procedura-operativa-5-fasi.svg","caption":"Dal bisogno alla verifica."}],"graphic_cards":[{"image":"idea-rls-consult.svg","kicker":"SCHEMA AUTORIALE","title":"PARTECIPARE PRIMA","text":"Collega il principio alla decisione operativa.","points":["tema/decisione","soggetti","osservazioni","feedback"]},{"image":"procedura-operativa-5-fasi.svg","kicker":"SCHEMA AUTORIALE","title":"DAL CONTENUTO ALL’AZIONE","text":"Collega il principio alla decisione operativa.","points":["obiettivo","metodo","esercitazione","verifica/trasferimento"]}],"quiz":{"q":"Una nuova procedura richiede una sequenza pratica. Quale evidenza è più significativa della sola email inviata?","answers":["Verifica coerente della comprensione e, quando richiesto, addestramento con osservazione dell’esecuzione.","Conferma di lettura email.","Procedura presente sul server.","Firma di chi ha scritto la procedura."],"correct":0,"explanation":"La tracciabilità della comunicazione non dimostra da sola l’acquisizione della competenza.","formative_only":true,"test_builder_excluded":true}}$json$::jsonb p),
base as (
  select lu.id learning_unit_id,v.content,p.p
  from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1
  cross join profile p where lu.stable_key='rspp-aspp:rspp_aspp_a:a5'
), enriched as (
  select learning_unit_id, content || p || jsonb_build_object(
    'didactic_version','rspp-aspp-authored-v3',
    'operational',jsonb_build_object('objective',p->>'summary','before',p->'prevention','during',p->'procedure','after',jsonb_build_array('Verifica attuazione ed efficacia.','Traccia criticità aperte, owner, scadenza e riesame.'),'step_by_step',p->'procedure','if_problem',jsonb_build_array('Se mancano informazioni essenziali, attiva l’approfondimento competente.','Se emerge una condizione grave non controllata, attiva subito chi ha potere di intervento.'),'stop_conditions',p->'risks','who_to_involve',jsonb_build_array('Datore di lavoro/dirigenti','RSPP/ASPP','Preposti','RLS e lavoratori','Medico competente quando pertinente'),'remember',p->>'summary','adaptation','Adattare esempi e decisioni a DVR, procedure, ruoli e contesto reale.'),
    'quality',jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'final_assessment',false,'test_builder_excluded',true),
    'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','normative_validation','D.Lgs. 81/2008 vigente + ASR 17/04/2025 Rep. 59/CSR','reuse_policy','facts_reference_and_original_didactic_rewrite'),
    'evidence_sources',(
      select coalesce(jsonb_agg(jsonb_build_object('authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'use',case ts.source_key when 'mlps-asr-2025' then 'normative_validation_and_module_a_contents' when 'normattiva-dlgs81-vigente' then 'normative_validation' when 'piemonte-indicazioni-formazione-2025' then 'official_guidance_cross_check' when 'rer-formazione-figure-prevenzione' then 'method_and_visual_structure_reference_only' end,'checked_on','2026-10-16') order by array_position(array['mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','rer-formazione-figure-prevenzione'],ts.source_key)),'[]'::jsonb)
      from public.training_sources ts where ts.source_key in ('mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','rer-formazione-figure-prevenzione')
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
where lu.stable_key='rspp-aspp:rspp_aspp_a:a5'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
