update public.tests
set active=true,
    metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
      'activation_stage','qa_active',
      'activated_on','2026-10-16',
      'activation_block_reason','course_versions_go_live_pending'
    )
where metadata->>'finalization_batch'='v20_091' and active=false;

do $$ declare active_tests int; bad_tests int; ready_versions int; candidate_editions int; begin
  select count(*) into active_tests from public.tests where metadata->>'finalization_batch'='v20_091' and active=true;
  if active_tests<>36 then raise exception 'expected 36 active candidate tests, got %',active_tests; end if;

  with tqc as (
    select t.id,t.course_version_id,t.metadata->>'requirement_key' requirement_key,t.passing_score_pct,count(tq.question_id) question_count
    from public.tests t join public.test_questions tq on tq.test_id=t.id
    where t.metadata->>'finalization_batch'='v20_091' and t.active=true
    group by t.id
  )
  select count(*) into bad_tests
  from tqc q
  join public.course_verification_requirements vr on vr.course_version_id=q.course_version_id and vr.requirement_key=q.requirement_key
  join public.course_versions cv on cv.id=q.course_version_id
  where cv.status<>'published' or q.question_count<>coalesce(vr.minimum_questions,q.question_count) or q.passing_score_pct<>vr.passing_score_pct or vr.selected_mode<>'test';
  if bad_tests<>0 then raise exception 'candidate test integrity failures: %',bad_tests; end if;

  select count(*) into ready_versions from public.course_versions where syllabus_snapshot->>'finalization_candidate'='true' and syllabus_snapshot->>'go_live_ready'='true';
  if ready_versions<>0 then raise exception 'course versions became go-live-ready too early: %',ready_versions; end if;

  select count(*) into candidate_editions from public.course_editions e join public.course_versions cv on cv.id=e.course_version_id where cv.syllabus_snapshot->>'finalization_candidate'='true';
  if candidate_editions<>0 then raise exception 'candidate editions exist before go-live: %',candidate_editions; end if;
end $$;
