create temp table _mc_ctx on commit drop as
select c.id course_id,
       (select v.id from public.course_versions v where v.course_id=c.id order by v.version_number desc limit 1) source_version_id,
       (select v.id from public.course_versions v where v.course_id=c.id and exists(select 1 from public.course_verification_requirements r where r.course_version_id=v.id) order by v.version_number asc limit 1) verification_source_version_id,
       (select max(v.version_number) from public.course_versions v where v.course_id=c.id) base_version
from public.courses c where c.stable_key='mod_cantieri';

create temp table _mc_versions on commit drop as
select course_id,source_version_id,verification_source_version_id,'employer' role_key,'datore-cantieri-authored-v3' didactic_version,base_version+1 version_number,gen_random_uuid() version_id from _mc_ctx
union all
select course_id,source_version_id,verification_source_version_id,'manager','dirigente-cantieri-authored-v3',base_version+2,gen_random_uuid() from _mc_ctx;

insert into public.course_versions(id,course_id,version_number,status,syllabus_snapshot,normative_snapshot)
select mv.version_id,mv.course_id,mv.version_number,'draft',
       coalesce(src.syllabus_snapshot,'{}'::jsonb)||jsonb_build_object('finalization_candidate',true,'finalization_batch','v20_088','candidate_created_on','2026-10-16','role_variant',mv.role_key,'didactic_version',mv.didactic_version,'source_course_version_id',mv.source_version_id,'authored_linking_complete',true,'question_bank_complete',false,'publication_blocked_until_readiness',true),
       coalesce(src.normative_snapshot,'{}'::jsonb)||jsonb_build_object('candidate_reviewed_on','2026-10-16','audience_role',mv.role_key)
from _mc_versions mv join public.course_versions src on src.id=mv.source_version_id;

create temp table _mc_modules on commit drop as
select mv.role_key,mv.version_id,cm.id source_module_id,gen_random_uuid() module_id,cm.module_key,cm.title,cm.position,cm.nominal_minutes
from _mc_versions mv join public.course_modules cm on cm.course_version_id=mv.source_version_id;
insert into public.course_modules(id,course_version_id,module_key,title,position,nominal_minutes)
select module_id,version_id,module_key,title,position,nominal_minutes from _mc_modules;

insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
select mm.module_id,cand.id,cmu.position,cmu.required,cmu.min_active_seconds,cmu.requires_comprehension,
       coalesce(cmu.completion_rules,'{}'::jsonb)||jsonb_build_object('candidate_authored_link',true,'finalization_batch','v20_088','role_variant',mm.role_key)
from _mc_modules mm
join public.course_module_units cmu on cmu.module_id=mm.source_module_id
join public.learning_unit_versions old on old.id=cmu.unit_version_id
join public.learning_units lu on lu.id=old.learning_unit_id
join lateral (
 select v.id from public.learning_unit_versions v
 where v.learning_unit_id=lu.id and v.status='draft'
   and v.content->>'didactic_version'=case mm.role_key when 'employer' then 'datore-cantieri-authored-v3' else 'dirigente-cantieri-authored-v3' end
   and coalesce(v.content->'quality'->>'teacher_ready','false')='true'
   and coalesce(v.content->'quality'->>'learner_ready','false')='true'
 order by v.version_number desc limit 1
) cand on true;

insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select mv.version_id,r.requirement_key,r.title,r.verification_mode,r.minimum_questions,r.minimum_options_per_question,r.passing_score_pct,r.required,r.completion_mode,
       coalesce(r.metadata,'{}'::jsonb)||jsonb_build_object('copied_from_course_version_id',mv.verification_source_version_id,'finalization_batch','v20_088','role_variant',mv.role_key),r.selected_mode
from _mc_versions mv join public.course_verification_requirements r on r.course_version_id=mv.verification_source_version_id;

update public.courses c set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'candidate_composition_ready',true,'candidate_composition_batch','v20_088','role_candidate_course_versions',
 (select jsonb_object_agg(role_key,jsonb_build_object('course_version_id',version_id,'version_number',version_number,'didactic_version',didactic_version)) from _mc_versions),
 'auto_publish',false,'auto_relink',false,'learner_catalog_hidden',true),updated_at=now()
where c.stable_key='mod_cantieri';

do $$ declare v int; u int; r int; bad int; begin
 select count(*) into v from public.course_versions where syllabus_snapshot->>'finalization_batch'='v20_088'; if v<>2 then raise exception 'expected 2 role snapshots got %',v; end if;
 select count(*) into u from public.course_versions cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id where cv.syllabus_snapshot->>'finalization_batch'='v20_088'; if u<>12 then raise exception 'expected 12 linked role units got %',u; end if;
 select count(*) into r from public.course_versions cv join public.course_verification_requirements x on x.course_version_id=cv.id where cv.syllabus_snapshot->>'finalization_batch'='v20_088'; if r<>2 then raise exception 'expected 2 verification requirements got %',r; end if;
 select count(*) into bad from public.course_versions cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id join public.learning_unit_versions luv on luv.id=cmu.unit_version_id where cv.syllabus_snapshot->>'finalization_batch'='v20_088' and ((cv.syllabus_snapshot->>'role_variant'='employer' and luv.content->>'didactic_version'<>'datore-cantieri-authored-v3') or (cv.syllabus_snapshot->>'role_variant'='manager' and luv.content->>'didactic_version'<>'dirigente-cantieri-authored-v3')); if bad<>0 then raise exception 'role version mismatch %',bad; end if;
end $$;