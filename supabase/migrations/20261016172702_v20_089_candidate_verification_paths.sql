with candidates as (
 select cv.id course_version_id,c.stable_key,c.title,cv.syllabus_snapshot
 from public.course_versions cv join public.courses c on c.id=cv.course_id
 where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088')
), initial_test as (
 select * from candidates where stable_key in ('generale','lav_basso','lav_medio','lav_alto','preposto','dirigente','dl_base','dl_spp_comune','dl_spp_agri','dl_spp_pesca','dl_spp_costruzioni','dl_spp_chimico','mod_cantieri')
), update_test as (
 select * from candidates where stable_key in ('agg_lav','agg_prep','agg_dir','agg_dl','agg_dl_spp')
), rls_test as (
 select * from candidates where stable_key in ('rls','agg_rls_4h','agg_rls_8h')
), internal_test as (
 select * from candidates where stable_key='emergenze_evacuazione'
), practical_only as (
 select * from candidates where stable_key in ('antincendio_l1','antincendio','antincendio_l3','agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3','primo_soccorso_12h','primo_soccorso_a_16h','agg_primo_soccorso_4h','agg_primo_soccorso_a_6h','lav_quota')
)
insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select course_version_id,'final_learning_verification','Verifica finale di apprendimento','test_or_interview',30,3,70,true,'platform_or_external',
       jsonb_build_object('regulatory_basis','ASR 17/04/2025 Parte IV punto 6.3','selected_project_mode','test','statutory_minimum_questions',30,'statutory_minimum_options',3,'statutory_passing_score_pct',70,'finalization_batch',syllabus_snapshot->>'finalization_batch','verification_path_selection_required',false),'test'
from initial_test
on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode=excluded.verification_mode,minimum_questions=excluded.minimum_questions,minimum_options_per_question=excluded.minimum_options_per_question,passing_score_pct=excluded.passing_score_pct,required=excluded.required,completion_mode=excluded.completion_mode,metadata=excluded.metadata,selected_mode=excluded.selected_mode;

with candidates as (select cv.id course_version_id,c.stable_key,cv.syllabus_snapshot from public.course_versions cv join public.courses c on c.id=cv.course_id where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088'))
insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select course_version_id,'final_learning_verification','Verifica finale aggiornamento','test_or_interview',10,3,70,true,'platform_or_external',
       jsonb_build_object('regulatory_basis',case when stable_key='agg_dl_spp' then 'ASR 17/04/2025 - verifica finale obbligatoria; modalità test adottata dal progetto formativo' else 'ASR 17/04/2025 Parte IV punto 6.3' end,'selected_project_mode','test','minimum_questions',10,'minimum_options',3,'passing_score_pct',70,'count_is_project_standard',stable_key='agg_dl_spp','finalization_batch',syllabus_snapshot->>'finalization_batch','verification_path_selection_required',false),'test'
from candidates where stable_key in ('agg_lav','agg_prep','agg_dir','agg_dl','agg_dl_spp')
on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode=excluded.verification_mode,minimum_questions=excluded.minimum_questions,minimum_options_per_question=excluded.minimum_options_per_question,passing_score_pct=excluded.passing_score_pct,required=excluded.required,completion_mode=excluded.completion_mode,metadata=excluded.metadata,selected_mode=excluded.selected_mode;

with candidates as (select cv.id course_version_id,c.stable_key,cv.syllabus_snapshot from public.course_versions cv join public.courses c on c.id=cv.course_id where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088'))
insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select course_version_id,'final_learning_verification','Verifica finale di apprendimento RLS','test',case when stable_key='rls' then 30 else 10 end,3,70,true,'platform',
       jsonb_build_object('project_quality_standard',true,'national_statutory_minimum_claim',false,'collective_bargaining_check_required',stable_key<>'rls','selected_project_mode','test','finalization_batch',syllabus_snapshot->>'finalization_batch'),'test'
from candidates where stable_key in ('rls','agg_rls_4h','agg_rls_8h')
on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode=excluded.verification_mode,minimum_questions=excluded.minimum_questions,minimum_options_per_question=excluded.minimum_options_per_question,passing_score_pct=excluded.passing_score_pct,required=excluded.required,completion_mode=excluded.completion_mode,metadata=excluded.metadata,selected_mode=excluded.selected_mode;

with candidates as (select cv.id course_version_id,c.stable_key,cv.syllabus_snapshot from public.course_versions cv join public.courses c on c.id=cv.course_id where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088'))
insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select course_version_id,'internal_final_check','Verifica finale percorso interno emergenze','test',10,3,70,true,'platform',jsonb_build_object('internal_non_certifying',true,'project_quality_standard',true,'selected_project_mode','test','finalization_batch',syllabus_snapshot->>'finalization_batch'),'test'
from candidates where stable_key='emergenze_evacuazione'
on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode=excluded.verification_mode,minimum_questions=excluded.minimum_questions,minimum_options_per_question=excluded.minimum_options_per_question,passing_score_pct=excluded.passing_score_pct,required=excluded.required,completion_mode=excluded.completion_mode,metadata=excluded.metadata,selected_mode=excluded.selected_mode;

with candidates as (select cv.id course_version_id,c.stable_key,cv.syllabus_snapshot from public.course_versions cv join public.courses c on c.id=cv.course_id where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088'))
insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select course_version_id,'external_practical_validation',
 case when stable_key like '%primo_soccorso%' then 'Validazione pratica primo soccorso' when stable_key='lav_quota' then 'Validazione addestramento pratico DPI anticaduta' else 'Validazione pratica antincendio' end,
 'practical',null,null,null,true,'external',jsonb_build_object('external_record_required',true,'digital_completion_allowed',false,'statutory_final_exam_claim',false,'completion_gate','external_practical_record','finalization_batch',syllabus_snapshot->>'finalization_batch'),'practical'
from candidates where stable_key in ('antincendio_l1','antincendio','antincendio_l3','agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3','primo_soccorso_12h','primo_soccorso_a_16h','agg_primo_soccorso_4h','agg_primo_soccorso_a_6h','lav_quota')
on conflict(course_version_id,requirement_key) do update set title=excluded.title,verification_mode=excluded.verification_mode,minimum_questions=excluded.minimum_questions,minimum_options_per_question=excluded.minimum_options_per_question,passing_score_pct=excluded.passing_score_pct,required=excluded.required,completion_mode=excluded.completion_mode,metadata=excluded.metadata,selected_mode=excluded.selected_mode;

update public.course_versions cv set syllabus_snapshot=coalesce(syllabus_snapshot,'{}'::jsonb)||jsonb_build_object('verification_configured',true,'verification_reviewed_on','2026-10-16') where syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088');

do $$ declare missing int; bad30 int; bad10 int; begin
 select count(*) into missing from public.course_versions cv where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088') and not exists(select 1 from public.course_verification_requirements r where r.course_version_id=cv.id and r.required=true); if missing<>0 then raise exception 'candidate versions without verification requirement: %',missing; end if;
 select count(*) into bad30 from public.course_versions cv join public.courses c on c.id=cv.course_id join public.course_verification_requirements r on r.course_version_id=cv.id and r.requirement_key='final_learning_verification' where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088') and c.stable_key in ('generale','lav_basso','lav_medio','lav_alto','preposto','dirigente','dl_base','dl_spp_comune','dl_spp_agri','dl_spp_pesca','dl_spp_costruzioni','dl_spp_chimico','mod_cantieri') and (r.minimum_questions<>30 or r.minimum_options_per_question<>3 or r.passing_score_pct<>70 or r.selected_mode<>'test'); if bad30<>0 then raise exception '30-question verification config bad %',bad30; end if;
 select count(*) into bad10 from public.course_versions cv join public.courses c on c.id=cv.course_id join public.course_verification_requirements r on r.course_version_id=cv.id and r.requirement_key='final_learning_verification' where cv.syllabus_snapshot->>'finalization_batch'='v20_087' and c.stable_key in ('agg_lav','agg_prep','agg_dir','agg_dl','agg_dl_spp') and (r.minimum_questions<>10 or r.minimum_options_per_question<>3 or r.passing_score_pct<>70 or r.selected_mode<>'test'); if bad10<>0 then raise exception '10-question verification config bad %',bad10; end if;
end $$;