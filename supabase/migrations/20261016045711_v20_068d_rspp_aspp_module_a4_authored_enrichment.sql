-- SafetyTraining v20_068d
-- RSPP/ASPP Modulo A · A4 authored enrichment.
-- Draft v2 only; current course composition untouched; Test Builder excluded.

do $$
begin
  if (select count(*) from public.learning_units where stable_key='rspp-aspp:rspp_aspp_a:a4') <> 1 then raise exception 'v20_068d: target missing/duplicated'; end if;
  if (select count(*) from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1 where lu.stable_key='rspp-aspp:rspp_aspp_a:a4') <> 1 then raise exception 'v20_068d: base v1 missing'; end if;
end $$;

with profile as (select $json${"summary":"Collegare valutazione, protezioni collettive, DPI, segnaletica, emergenze e sorveglianza sanitaria mantenendo la gerarchia delle misure.","detail":"Le misure non si trattano come elementi isolati: si parte dalla fonte, si privilegiano interventi strutturali e collettivi, si gestisce il rischio residuo e si verifica che emergenza e sorveglianza siano coerenti con il contesto.","focus":["Applicare la gerarchia delle misure","Verificare idoneità, compatibilità e manutenzione dei DPI","Provare allarmi, vie di esodo e ruoli","Integrare contributi sanitari pertinenti nel riesame delle misure"],"risks":["Ricorso ai DPI prima di agire alla fonte","Segnaletica usata al posto di misure tecniche","Piani di emergenza non provati","Sorveglianza sanitaria trattata come sostituto della prevenzione"],"prevention":["Applicare la gerarchia delle misure","Verificare idoneità, compatibilità e manutenzione dei DPI","Provare allarmi, vie di esodo e ruoli","Integrare contributi sanitari pertinenti nel riesame delle misure"],"procedure":["Riparti da fonte e rischio","Elimina/riduci quando possibile","Definisci protezioni collettive e organizzative","Gestisci DPI per rischio residuo quando necessari","Costruisci scenari e ruoli di emergenza","Prova, mantieni e riesamina"],"case":"Dopo un infortunio vengono introdotti DPI migliori ma la fonte del rischio resta invariata; una prova di emergenza evidenzia anche una via di esodo ostruita. Riordina le priorità.","question":"Come dimostri che DPI, segnaletica, emergenza e sorveglianza completano e non sostituiscono la prevenzione alla fonte?","teacher_expansion":["Parti da un caso in cui il DPI è utile ma insufficiente.","Fai collocare misure reali nella gerarchia di prevenzione/protezione.","Simula una prova di emergenza con un vincolo inatteso.","Chiudi con la checklist: presente, utilizzabile, mantenuto, conosciuto, verificato."],"common_errors":["Partire dal DPI per comodità","Considerare il cartello una barriera sufficiente","Scrivere un piano di emergenza senza provarlo","Confondere idoneità sanitaria con eliminazione del rischio"],"idea_images":[{"file":"idea-dpi-hierarchy.svg","caption":"Gerarchia delle misure."},{"file":"idea-emergency-steps.svg","caption":"Sequenza di gestione dell’emergenza."},{"file":"stop-segnala-ripristina.svg","caption":"Stop, segnalazione e ripristino."}],"graphic_cards":[{"image":"idea-dpi-hierarchy.svg","kicker":"SCHEMA AUTORIALE","title":"NON INIZIARE DAL DPI","text":"Collega il principio alla decisione operativa.","points":["elimina/riduci","proteggi collettivamente","organizza","DPI per il residuo"]},{"image":"idea-emergency-steps.svg","kicker":"SCHEMA AUTORIALE","title":"PIANO CHE FUNZIONA","text":"Collega il principio alla decisione operativa.","points":["scenario","allarme","ruoli/azioni","prova e miglioramento"]}],"quiz":{"q":"Se una protezione collettiva tecnicamente applicabile può ridurre il rischio, quale impostazione è corretta?","answers":["Privilegiare la misura alla fonte/collettiva e usare i DPI per l’eventuale residuo.","Usare solo DPI più performanti.","Installare solo segnaletica.","Sostituire la misura con sorveglianza sanitaria più frequente."],"correct":0,"explanation":"La prevenzione privilegia interventi alla fonte e collettivi; i DPI completano il controllo del rischio residuo quando necessari.","formative_only":true,"test_builder_excluded":true}}$json$::jsonb p),
base as (
  select lu.id learning_unit_id,v.content,p.p
  from public.learning_units lu join public.learning_unit_versions v on v.learning_unit_id=lu.id and v.version_number=1
  cross join profile p where lu.stable_key='rspp-aspp:rspp_aspp_a:a4'
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
where lu.stable_key='rspp-aspp:rspp_aspp_a:a4'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
