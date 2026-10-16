update public.course_versions
set status='published',
    published_at=coalesce(published_at,now()),
    syllabus_snapshot=coalesce(syllabus_snapshot,'{}'::jsonb)||jsonb_build_object(
      'publication_stage','published_candidate_test_pending',
      'go_live_ready',false,
      'administrative_assignment_blocked',true,
      'candidate_published_on','2026-10-16'
    )
where syllabus_snapshot->>'finalization_candidate'='true' and status='draft';

do $$ declare cv_pub int; bad_lu int; active_tests int; editions int; frozen int; begin
  select count(*) into cv_pub from public.course_versions where syllabus_snapshot->>'finalization_candidate'='true' and status='published' and published_at is not null and syllabus_snapshot->>'go_live_ready'='false' and syllabus_snapshot->>'administrative_assignment_blocked'='true';
  if cv_pub<>60 then raise exception 'expected 60 published blocked candidates, got %',cv_pub; end if;

  select count(*) into bad_lu
  from public.course_versions cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
  where cv.syllabus_snapshot->>'finalization_candidate'='true' and luv.status<>'published';
  if bad_lu<>0 then raise exception 'candidate course links unpublished LU versions: %',bad_lu; end if;

  select count(*) into active_tests from public.tests where metadata->>'finalization_batch'='v20_091' and active=true;
  if active_tests<>0 then raise exception 'tests activated unexpectedly: %',active_tests; end if;

  select count(*) into editions from public.course_editions e join public.course_versions cv on cv.id=e.course_version_id where cv.syllabus_snapshot->>'finalization_candidate'='true';
  if editions<>0 then raise exception 'candidate editions exist unexpectedly: %',editions; end if;

  select count(*) into frozen from public.course_versions cv join public.courses c on c.id=cv.course_id where cv.syllabus_snapshot->>'finalization_candidate'='true' and coalesce(c.metadata->>'frozen','false')='true';
  if frozen<>0 then raise exception 'frozen candidates found: %',frozen; end if;
end $$;
