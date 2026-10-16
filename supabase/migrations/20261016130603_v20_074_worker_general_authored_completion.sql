with target as (
 select lu.id learning_unit_id,lu.stable_key,
        (select max(v.version_number)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
        (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id order by v.version_number desc limit 1) old_content,
        case lu.stable_key
          when 'generale:rischio' then 'Il pericolo è la sorgente potenziale di danno; il rischio dipende anche da esposizione, condizioni e misure. La distinzione serve a decidere prima di agire.'
          when 'generale:prevenzione-protezione' then 'La gerarchia delle misure privilegia eliminazione/riduzione alla fonte e protezioni collettive prima dei soli DPI.'
          when 'generale:organizzazione' then 'Le figure della prevenzione hanno compiti diversi: il lavoratore deve sapere chi coinvolgere e come far circolare una segnalazione fino alla decisione correttiva.'
          when 'generale:diritti-doveri' then 'Collaborare alla sicurezza significa rispettare istruzioni e protezioni, usare correttamente attrezzature/DPI e segnalare subito condizioni pericolose senza improvvisare soluzioni.'
          when 'generale:incidenti' then 'Near miss e anomalie sono segnali utili perché mostrano dove una barriera ha quasi fallito e permettono di intervenire prima del danno.'
          when 'generale:emergenze-generale' then 'In emergenza il lavoratore segue la procedura, comunica l’evento, si mette in sicurezza e lascia i compiti specialistici agli addetti formati.'
          when 'generale:segnaletica-generale' then 'La segnaletica orienta il comportamento ma non sostituisce protezioni, procedure e organizzazione del lavoro.' end explanation,
        case when lu.stable_key='generale:incidenti' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','comune-milano-materiale-didattico','inail-condivido-near-miss') when lu.stable_key='generale:emergenze-generale' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','comune-milano-materiale-didattico','vvf-materiali-antincendio') else jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','comune-milano-materiale-didattico') end source_keys
 from public.learning_units lu
 where lu.stable_key in ('generale:rischio','generale:prevenzione-protezione','generale:organizzazione','generale:diritti-doveri','generale:incidenti','generale:emergenze-generale','generale:segnaletica-generale')
), enriched as (
 select learning_unit_id,stable_key,target_version,source_keys,
 old_content || jsonb_build_object(
   'didactic_version','general-authored-v4',
   'question_explanation',explanation,
   'teacher_activity',jsonb_build_object('prompt',coalesce(old_content->>'question',old_content->>'summary'),'method','Raccogliere prima esempi dal lavoro reale; poi distinguere fatto osservabile, regola generale, comportamento corretto, segnalazione e verifica.','debrief','Chiudere con una regola semplice trasferibile al lavoro e con il soggetto da coinvolgere quando il lavoratore non può risolvere in autonomia.'),
   'operational',coalesce(old_content->'operational','{}'::jsonb) || jsonb_build_object('before',jsonb_build_array('Osserva attività, ambiente e condizioni prima di iniziare.','Conosci regole, protezioni e canali di segnalazione applicabili.'),'during',jsonb_build_array('Rispetta procedure e protezioni.','Non rimuovere o aggirare misure di sicurezza.','Segnala condizioni pericolose e chiedi supporto quando necessario.'),'after',jsonb_build_array('Lascia il lavoro in condizioni sicure.','Segnala anomalie e near miss utili al miglioramento.'),'if_problem',jsonb_build_array('Interrompi o allontanati se esiste un pericolo grave non controllato.','Avvisa il preposto/responsabile e attiva le procedure previste.'),'who_to_involve',jsonb_build_array('Preposto/responsabile','RSPP/SPP o RLS per criticità ricorrenti','Addetti emergenza quando necessario'),'stop_conditions',jsonb_build_array('Protezione essenziale assente o inefficace.','Condizione non prevista che può causare danno.','Attività che esce dai limiti della formazione o delle istruzioni ricevute.'),'adaptation','Collegare sempre i principi generali alle attività e ai rischi reali dell’organizzazione.'),
   'scope_boundary','La formazione generale costruisce concetti, ruoli e principi comuni; non sostituisce la formazione specifica sui rischi effettivi della mansione né eventuali percorsi specialistici obbligatori.',
   'formative_check',jsonb_build_object('question',coalesce(old_content->>'question',old_content->>'summary'),'explanation',explanation,'formative_only',true,'test_builder_excluded',true),
   'source_keys',source_keys,
   'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','reuse_policy','reference_and_original_rewrite','normative_validation','D.Lgs. 81/2008 vigente + Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR'),
   'source_integration_note','Completamento authored della formazione generale: spiegazione dopo ogni domanda, trasferimento operativo, provenance e separazione dal Test Builder.',
   'quality',coalesce(old_content->'quality','{}'::jsonb) || jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true,'scope_boundary_explicit',true),
   'final_assessment',false
 ) new_content
 from target
), final_content as (
 select e.*,e.new_content || jsonb_build_object('evidence_sources',(select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key) from jsonb_array_elements_text(e.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key)) content_final
 from enriched e
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',content_final,md5(content_final::text),null from final_content;

with authored as (select lu.id learning_unit_id,luv.content->'source_keys' source_keys from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id where luv.content->>'didactic_version'='general-authored-v4')
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v4','Fonte usata per validazione normativa o didattica nella versione general-authored-v4.',date '2026-10-16',jsonb_build_object('didactic_version','general-authored-v4','reuse_policy','reference_and_original_rewrite')
from authored a cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key)
join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$ declare n integer; links integer; bad integer; begin
 select count(*) into n from public.learning_unit_versions where content->>'didactic_version'='general-authored-v4' and status='draft'; if n<>7 then raise exception 'expected 7 general-authored-v4, got %',n; end if;
 select count(*) into links from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id where luv.content->>'didactic_version'='general-authored-v4'; if links<>0 then raise exception 'general authored drafts unexpectedly linked: %',links; end if;
 select count(*) into bad from public.learning_unit_versions where content->>'didactic_version'='general-authored-v4' and (content->'quality'->>'question_has_explanation' is distinct from 'true' or content->'quality'->>'test_builder_excluded' is distinct from 'true' or content->>'final_assessment' is distinct from 'false'); if bad<>0 then raise exception 'general quality failed %',bad; end if;
end $$;
