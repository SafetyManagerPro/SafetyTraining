update public.course_verification_requirements r
set minimum_questions=10,minimum_options_per_question=3,
    metadata=coalesce(r.metadata,'{}'::jsonb)||jsonb_build_object('project_question_count',10,'statutory_question_count_claim',false,'project_minimum_options',3,'equipment_theory_builder_ready',true,'reviewed_on','2026-10-16'),updated_at=now()
from public.course_versions cv join public.courses c on c.id=cv.course_id
where r.course_version_id=cv.id and cv.syllabus_snapshot->>'finalization_batch'='v20_087' and c.metadata->>'blueprint_key'='equipment_initial' and r.requirement_key='theory_intermediate' and r.selected_mode='test';

create temp table _test_targets on commit drop as
select cv.id course_version_id,c.stable_key course_key,c.title course_title,cv.version_number,
       r.requirement_key,r.minimum_questions,r.passing_score_pct,
       coalesce(cv.syllabus_snapshot->>'role_variant','') role_variant,
       gen_random_uuid() test_id
from public.course_versions cv join public.courses c on c.id=cv.course_id join public.course_verification_requirements r on r.course_version_id=cv.id
where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088') and r.required=true and r.selected_mode='test' and r.minimum_questions is not null;

insert into public.tests(id,course_version_id,title,passing_score_pct,max_attempts,active,metadata,test_key)
select test_id,course_version_id,
       case when requirement_key='theory_intermediate' then 'Verifica intermedia teorico-tecnica – '||course_title else 'Verifica finale – '||course_title||case when role_variant<>'' then ' · '||role_variant else '' end end,
       passing_score_pct,null,false,
       jsonb_build_object('candidate_only',true,'finalization_batch','v20_091','builder_version','authored-structure-v1','requirement_key',requirement_key,'minimum_questions',minimum_questions,'course_key',course_key,'role_variant',nullif(role_variant,''),'generated_on','2026-10-16','activation_requires_app_version_binding_fix',true),
       case when requirement_key='theory_intermediate' then 'theory-v20_091' else 'final-v20_091' end
from _test_targets;

with raw_pool as (
 select distinct t.test_id,t.course_version_id,t.minimum_questions,q.id question_id,q.metadata->>'perspective' perspective
 from _test_targets t
 join public.course_modules cm on cm.course_version_id=t.course_version_id
 join public.course_module_units cmu on cmu.module_id=cm.id
 join public.questions q on q.unit_version_id=cmu.unit_version_id and q.metadata->>'finalization_batch'='v20_090' and q.active=true
), pool as (
 select rp.*,
        row_number() over(partition by rp.course_version_id,rp.perspective order by md5(rp.course_version_id::text||':'||rp.question_id::text)) perspective_rank
 from raw_pool rp
), ranked as (
 select p.*,row_number() over(partition by p.course_version_id order by p.perspective_rank,
        case p.perspective when 'before' then 1 when 'during' then 2 when 'stop' then 3 when 'problem' then 4 else 5 end,
        md5(p.question_id::text)) final_pos
 from pool p
)
insert into public.test_questions(test_id,question_id,position,points)
select test_id,question_id,final_pos,1 from ranked where final_pos<=minimum_questions;

update public.course_versions cv
set syllabus_snapshot=coalesce(cv.syllabus_snapshot,'{}'::jsonb)||jsonb_build_object('question_bank_complete',true,'test_definition_ready',true,'test_builder_batch','v20_091','tests_active',false,'test_builder_reviewed_on','2026-10-16')
where exists(select 1 from _test_targets t where t.course_version_id=cv.id);

do $$ declare targets int; tests_n int; links int; bad_count int; bad_expl int; bad_opts int; active_n int; persp_bad int; begin
 select count(*) into targets from _test_targets; if targets<>36 then raise exception 'expected 36 test targets got %',targets; end if;
 select count(*) into tests_n from public.tests where metadata->>'finalization_batch'='v20_091'; if tests_n<>36 then raise exception 'expected 36 candidate tests got %',tests_n; end if;
 select count(*) into active_n from public.tests where metadata->>'finalization_batch'='v20_091' and active=true; if active_n<>0 then raise exception 'candidate tests must be inactive got % active',active_n; end if;
 select count(*) into bad_count from (select t.id,t.metadata->>'minimum_questions' minq,count(tq.question_id) n from public.tests t left join public.test_questions tq on tq.test_id=t.id where t.metadata->>'finalization_batch'='v20_091' group by t.id having count(tq.question_id)<>(t.metadata->>'minimum_questions')::int) s; if bad_count<>0 then raise exception 'test question count mismatch on % tests',bad_count; end if;
 select count(*) into links from public.test_questions tq join public.tests t on t.id=tq.test_id where t.metadata->>'finalization_batch'='v20_091'; if links<>660 then raise exception 'expected 660 test-question links got %',links; end if;
 select count(*) into bad_expl from public.test_questions tq join public.tests t on t.id=tq.test_id join public.questions q on q.id=tq.question_id where t.metadata->>'finalization_batch'='v20_091' and (q.public_explanation is null or btrim(q.public_explanation)=''); if bad_expl<>0 then raise exception 'questions without public explanation %',bad_expl; end if;
 select count(*) into bad_opts from public.test_questions tq join public.tests t on t.id=tq.test_id join public.questions q on q.id=tq.question_id where t.metadata->>'finalization_batch'='v20_091' and jsonb_array_length(q.options)<3; if bad_opts<>0 then raise exception 'questions with fewer than 3 options %',bad_opts; end if;
 select count(*) into persp_bad from (select t.id,count(distinct q.metadata->>'perspective') p from public.tests t join public.test_questions tq on tq.test_id=t.id join public.questions q on q.id=tq.question_id where t.metadata->>'finalization_batch'='v20_091' group by t.id having count(distinct q.metadata->>'perspective')<5) x; if persp_bad<>0 then raise exception 'tests missing perspective diversity %',persp_bad; end if;
end $$;