with candidate_cv as (
  select id from public.course_versions where syllabus_snapshot->>'finalization_candidate'='true'
), linked as (
  select distinct cmu.unit_version_id id
  from candidate_cv cv
  join public.course_modules cm on cm.course_version_id=cv.id
  join public.course_module_units cmu on cmu.module_id=cm.id
)
update public.learning_unit_versions luv
set status='published',published_at=coalesce(luv.published_at,now())
from linked l
where luv.id=l.id and luv.status='draft';

do $$ declare lu_pub int; cv_draft int; tests_active int; frozen_candidates int; begin
  with candidate_cv as (select id from public.course_versions where syllabus_snapshot->>'finalization_candidate'='true'), linked as (select distinct cmu.unit_version_id id from candidate_cv cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id)
  select count(*) into lu_pub from linked l join public.learning_unit_versions luv on luv.id=l.id where luv.status='published' and luv.published_at is not null;
  if lu_pub<>290 then raise exception 'expected 290 published candidate LU versions, got %',lu_pub; end if;

  select count(*) into cv_draft from public.course_versions where syllabus_snapshot->>'finalization_candidate'='true' and status='draft';
  if cv_draft<>60 then raise exception 'expected 60 candidate course versions still draft, got %',cv_draft; end if;

  select count(*) into tests_active from public.tests where metadata->>'finalization_batch'='v20_091' and active=true;
  if tests_active<>0 then raise exception 'candidate tests activated unexpectedly: %',tests_active; end if;

  select count(*) into frozen_candidates from public.course_versions cv join public.courses c on c.id=cv.course_id where cv.syllabus_snapshot->>'finalization_candidate'='true' and coalesce(c.metadata->>'frozen','false')='true';
  if frozen_candidates<>0 then raise exception 'frozen candidate detected: %',frozen_candidates; end if;
end $$;
