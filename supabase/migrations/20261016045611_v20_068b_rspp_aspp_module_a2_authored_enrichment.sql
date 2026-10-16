-- SafetyTraining v20_068b
-- RSPP/ASPP Modulo A · A2 authored enrichment.
-- Draft v2 only; current course composition untouched; Test Builder excluded.

do $$
begin
  if (select count(*) from public.learning_units where stable_key='rspp-aspp:rspp_aspp_a:a2') <> 1 then raise exception 'v20_068b: target missing/duplicated'; end if;
  if (select count(*) from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1 where lu.stable_key='rspp-aspp:rspp_aspp_a:a2') <> 1 then raise exception 'v20_068b: base v1 missing'; end if;
end $$;

with profile as (select $json${"summary":"Distinguere ruoli, poteri, obblighi e relazioni dei soggetti della prevenzione, evitando di attribuire al SPP responsabilità decisionali improprie.","detail":"Per ogni criticità si separano il soggetto che decide o organizza, chi vigila sul lavoro, chi supporta tecnicamente o sanitariamente, chi viene consultato e chi applica o segnala.","focus":["Mappare problema → titolare → supporti → evidenze","Verificare coerenza tra organigramma e funzionamento reale","Definire escalation e presa in carico","Associare ogni misura a un responsabile con poteri adeguati"],"risks":["Misure senza owner o risorse","Responsabilità scaricate sull’RSPP","Consultazione RLS confusa con gestione gerarchica"],"prevention":["Mappare problema → titolare → supporti → evidenze","Verificare coerenza tra organigramma e funzionamento reale","Definire escalation e presa in carico","Associare ogni misura a un responsabile con poteri adeguati"],"procedure":["Descrivi il problema","Individua potere e obbligo","Identifica supporti tecnici/sanitari","Verifica consultazione necessaria","Assegna owner e termine","Controlla esecuzione e feedback"],"case":"Una protezione di macchina è inefficace: il preposto segnala e l’RSPP propone la soluzione, ma nessuno autorizza fermata e intervento. Ricostruisci ruoli e flusso.","question":"Come distingui chi analizza tecnicamente il rischio da chi ha potere-dovere di organizzare o far eseguire la misura?","teacher_expansion":["Collega a ogni ruolo un verbo: decide, organizza, vigila, supporta, consulta, sorveglia, applica, segnala.","Usa il caso macchina per smontare l’idea che «sia tutto compito dell’RSPP».","Fai un role-play preposto → RSPP → dirigente → RLS.","Chiudi con una matrice problema/owner/supporto/verifica."],"common_errors":["Organigramma trattato come elenco statico","RSPP considerato sostituto del datore di lavoro","RLS confuso con ruolo gerarchico"],"idea_images":[{"file":"organigramma-sicurezza.svg","caption":"Mappa dei soggetti della prevenzione."},{"file":"idea-rls-consult.svg","caption":"Consultazione e feedback nel sistema."}],"graphic_cards":[{"image":"organigramma-sicurezza.svg","kicker":"SCHEMA AUTORIALE","title":"RUOLI E POTERI","text":"Collega il principio alla decisione operativa.","points":["decide/organizza","vigila","supporta","consulta"]},{"image":"idea-rls-consult.svg","kicker":"SCHEMA AUTORIALE","title":"SEGNALAZIONE → CHIUSURA","text":"Collega il principio alla decisione operativa.","points":["fatto","presa in carico","azione","feedback/verifica"]}],"quiz":{"q":"Una misura proposta dall’RSPP richiede investimento e modifica organizzativa. Chi assume la decisione secondo i rispettivi poteri?","answers":["Datore di lavoro o linea dirigente competente, con supporto tecnico del SPP.","RSPP in autonomia.","RLS.","Qualunque lavoratore informato."],"correct":0,"explanation":"Il SPP supporta tecnicamente; le decisioni organizzative e di risorse restano ai soggetti titolari dei relativi poteri.","formative_only":true,"test_builder_excluded":true}}$json$::jsonb p),
base as (
  select lu.id learning_unit_id,v.content,p.p
  from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1
  cross join profile p where lu.stable_key='rspp-aspp:rspp_aspp_a:a2'
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
where lu.stable_key='rspp-aspp:rspp_aspp_a:a2'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
