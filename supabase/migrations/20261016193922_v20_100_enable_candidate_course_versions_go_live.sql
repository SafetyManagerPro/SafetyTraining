update public.course_versions cv
set syllabus_snapshot = coalesce(cv.syllabus_snapshot,'{}'::jsonb)
  || jsonb_build_object(
       'go_live_ready', true,
       'administrative_assignment_blocked', false,
       'go_live_batch', 'v20_100',
       'go_live_on', '2026-10-16'
     )
from public.courses c
where c.id=cv.course_id
  and cv.syllabus_snapshot->>'finalization_candidate'='true'
  and cv.status='published'
  and coalesce(c.metadata->>'frozen','false')<>'true';

do $$
declare
  cv_total int; cv_ready int; cv_blocked int; frozen int; lu_bad int;
  test_req int; test_ok int; practical int; practical_bad int; verify_versions int;
  editions int; enrollments int;
begin
  select count(*),
         count(*) filter (where cv.syllabus_snapshot->>'go_live_ready'='true'),
         count(*) filter (where cv.syllabus_snapshot->>'administrative_assignment_blocked'='true'),
         count(*) filter (where coalesce(c.metadata->>'frozen','false')='true')
  into cv_total,cv_ready,cv_blocked,frozen
  from public.course_versions cv join public.courses c on c.id=cv.course_id
  where cv.syllabus_snapshot->>'finalization_candidate'='true';
  if cv_total<>60 or cv_ready<>60 or cv_blocked<>0 or frozen<>0 then
    raise exception 'candidate state invalid total %, ready %, blocked %, frozen %',cv_total,cv_ready,cv_blocked,frozen;
  end if;

  with candidate_cv as (select id from public.course_versions where syllabus_snapshot->>'finalization_candidate'='true'), linked as (
    select distinct cmu.unit_version_id id from candidate_cv cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id
  )
  select count(*) into lu_bad from linked l join public.learning_unit_versions luv on luv.id=l.id where luv.status<>'published';
  if lu_bad<>0 then raise exception 'non-published candidate LUs: %',lu_bad; end if;

  select count(*) into verify_versions from (
    select distinct v.course_version_id
    from public.course_verification_requirements v
    join public.course_versions cv on cv.id=v.course_version_id
    where cv.syllabus_snapshot->>'finalization_candidate'='true' and v.required=true and v.selected_mode is not null
  ) x;
  if verify_versions<>60 then raise exception 'verification coverage invalid: %',verify_versions; end if;

  select count(*) into test_req
  from public.course_verification_requirements v join public.course_versions cv on cv.id=v.course_version_id
  where cv.syllabus_snapshot->>'finalization_candidate'='true' and v.required=true and v.selected_mode='test';
  select count(*) into test_ok
  from public.tests t join public.course_versions cv on cv.id=t.course_version_id
  where cv.syllabus_snapshot->>'finalization_candidate'='true' and t.metadata->>'finalization_batch'='v20_091' and t.active=true and t.passing_score_pct=70;
  if test_req<>36 or test_ok<>36 then raise exception 'test gate invalid requirements %, active %',test_req,test_ok; end if;

  select count(*), count(*) filter (where p.completion_mode is null or btrim(p.completion_mode)='')
  into practical,practical_bad
  from public.course_practical_requirements p
  join public.course_versions cv on cv.course_id=p.course_id
  where cv.syllabus_snapshot->>'finalization_candidate'='true' and p.required=true;
  if practical<>37 or practical_bad<>0 then raise exception 'practical gate invalid total %, bad %',practical,practical_bad; end if;

  select count(*) into editions from public.course_editions ce join public.course_versions cv on cv.id=ce.course_version_id where cv.syllabus_snapshot->>'finalization_candidate'='true';
  select count(*) into enrollments from public.enrollments en join public.course_editions ce on ce.id=en.edition_id join public.course_versions cv on cv.id=ce.course_version_id where cv.syllabus_snapshot->>'finalization_candidate'='true';
  if editions<>0 or enrollments<>0 then raise exception 'candidate runtime data exists editions %, enrollments %',editions,enrollments; end if;
end $$;
