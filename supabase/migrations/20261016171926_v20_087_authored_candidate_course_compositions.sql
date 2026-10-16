create temp table _src_courses on commit drop as
select c.id course_id,c.stable_key,c.title,c.metadata,
       cv.id source_version_id,cv.version_number source_version_number,cv.syllabus_snapshot,cv.normative_snapshot
from public.courses c
join lateral (select * from public.course_versions v where v.course_id=c.id order by v.version_number desc limit 1) cv on true
where c.active=true and coalesce(c.metadata->>'frozen','false')<>'true'
  and coalesce(c.metadata->>'exclude_from_finalization_queue','false')<>'true'
  and coalesce(c.metadata->>'finalization_scope','')<>'role_variant_container';

create temp table _cv_map on commit drop as
select s.*,gen_random_uuid() new_version_id,(select max(v.version_number)+1 from public.course_versions v where v.course_id=s.course_id) new_version_number
from _src_courses s;

insert into public.course_versions(id,course_id,version_number,status,effective_from,effective_to,syllabus_snapshot,normative_snapshot,published_at)
select new_version_id,course_id,new_version_number,'draft',null,null,
       coalesce(syllabus_snapshot,'{}'::jsonb)||jsonb_build_object('finalization_candidate',true,'finalization_batch','v20_087','candidate_created_on','2026-10-16','source_course_version_id',source_version_id,'authored_linking_complete',true,'question_bank_complete',false,'publication_blocked_until_readiness',true),
       coalesce(normative_snapshot,'{}'::jsonb)||jsonb_build_object('candidate_reviewed_on','2026-10-16'),null
from _cv_map;

create temp table _module_map on commit drop as
select cm.id source_module_id,gen_random_uuid() new_module_id,m.new_version_id,cm.module_key,cm.title,cm.position,cm.nominal_minutes
from _cv_map m join public.course_modules cm on cm.course_version_id=m.source_version_id;

insert into public.course_modules(id,course_version_id,module_key,title,position,nominal_minutes)
select new_module_id,new_version_id,module_key,title,position,nominal_minutes from _module_map;

with source_rows as (
 select m.course_id,m.stable_key course_key,mm.new_module_id,cmu.position,cmu.required,cmu.min_active_seconds,cmu.requires_comprehension,cmu.completion_rules,
        lu.id learning_unit_id,lu.stable_key learning_unit_key
 from _cv_map m
 join _module_map mm on mm.new_version_id=m.new_version_id
 join public.course_module_units cmu on cmu.module_id=mm.source_module_id
 join public.learning_unit_versions oldv on oldv.id=cmu.unit_version_id
 join public.learning_units lu on lu.id=oldv.learning_unit_id
), resolved as (
 select sr.*,coalesce(repl.id,cand.id) candidate_version_id
 from source_rows sr
 left join lateral (
   select v.id from public.learning_unit_versions v
   where v.learning_unit_id=sr.learning_unit_id and v.status='draft'
     and coalesce(v.content->'quality'->>'teacher_ready','false')='true'
     and coalesce(v.content->'quality'->>'learner_ready','false')='true'
     and coalesce(v.content->'quality'->>'final_assessment','false')='false'
   order by v.version_number desc limit 1
 ) cand on not(sr.course_key='agg_dl' and sr.learning_unit_key='agg-datore:governance-cantieri-riesame')
 left join lateral (
   select v.id from public.learning_units rlu join public.learning_unit_versions v on v.learning_unit_id=rlu.id
   where sr.course_key='agg_dl' and sr.learning_unit_key='agg-datore:governance-cantieri-riesame'
     and rlu.stable_key='agg-datore:governance-riesame' and v.status='draft' and v.content->>'didactic_version'='datore-authored-v3'
   order by v.version_number desc limit 1
 ) repl on true
)
insert into public.course_module_units(module_id,unit_version_id,position,required,min_active_seconds,requires_comprehension,completion_rules)
select new_module_id,candidate_version_id,position,required,min_active_seconds,requires_comprehension,
       coalesce(completion_rules,'{}'::jsonb)||jsonb_build_object('candidate_authored_link',true,'finalization_batch','v20_087')
from resolved;

insert into public.course_verification_requirements(course_version_id,requirement_key,title,verification_mode,minimum_questions,minimum_options_per_question,passing_score_pct,required,completion_mode,metadata,selected_mode)
select m.new_version_id,r.requirement_key,r.title,r.verification_mode,r.minimum_questions,r.minimum_options_per_question,r.passing_score_pct,r.required,r.completion_mode,
       coalesce(r.metadata,'{}'::jsonb)||jsonb_build_object('copied_from_course_version_id',m.source_version_id,'finalization_batch','v20_087'),r.selected_mode
from _cv_map m join public.course_verification_requirements r on r.course_version_id=m.source_version_id;

update public.courses c
set metadata=coalesce(c.metadata,'{}'::jsonb)||jsonb_build_object('candidate_composition_ready',true,'candidate_composition_batch','v20_087','finalization_candidate_course_version_id',m.new_version_id,'finalization_candidate_version_number',m.new_version_number,'auto_relink',false,'auto_publish',false,'learner_catalog_hidden',true),updated_at=now()
from _cv_map m where c.id=m.course_id;

do $$ declare cvn int; bad_units int; wrong_status int; agg_ok int; ver_src int; ver_new int; begin
 select count(*) into cvn from public.course_versions where syllabus_snapshot->>'finalization_batch'='v20_087';
 if cvn<>58 then raise exception 'expected 58 candidate course versions got %',cvn; end if;
 select count(*) into bad_units from _cv_map m join public.course_modules cm on cm.course_version_id=m.new_version_id join public.course_module_units cmu on cmu.module_id=cm.id join public.learning_unit_versions luv on luv.id=cmu.unit_version_id where luv.status<>'draft' or coalesce(luv.content->'quality'->>'teacher_ready','false')<>'true' or coalesce(luv.content->'quality'->>'learner_ready','false')<>'true';
 if bad_units<>0 then raise exception 'candidate compositions contain % invalid unit links',bad_units; end if;
 select count(*) into wrong_status from _cv_map m join public.course_versions cv on cv.id=m.new_version_id where cv.status<>'draft';
 if wrong_status<>0 then raise exception 'candidate course versions not draft %',wrong_status; end if;
 select count(*) into agg_ok from _cv_map m join public.course_modules cm on cm.course_version_id=m.new_version_id join public.course_module_units cmu on cmu.module_id=cm.id join public.learning_unit_versions luv on luv.id=cmu.unit_version_id join public.learning_units lu on lu.id=luv.learning_unit_id where m.stable_key='agg_dl' and lu.stable_key='agg-datore:governance-riesame';
 if agg_ok<>1 then raise exception 'agg_dl governance replacement expected 1 got %',agg_ok; end if;
 select count(*) into ver_src from _cv_map m join public.course_verification_requirements r on r.course_version_id=m.source_version_id;
 select count(*) into ver_new from _cv_map m join public.course_verification_requirements r on r.course_version_id=m.new_version_id;
 if ver_src<>ver_new then raise exception 'verification requirement copy mismatch src % new %',ver_src,ver_new; end if;
end $$;