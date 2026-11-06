-- SafetyTraining v22.5.3: remove public Data API DELETE routes on core admin records and attached evidence.
-- No table rows change. Existing SELECT / INSERT / UPDATE and service_role privileges remain unchanged.
-- Direct deletion must go through a separately authorized, audited backend service (not yet activated).
revoke delete on table public.companies from anon, authenticated;
revoke delete on table public.learners from anon, authenticated;
revoke delete on table public.course_editions from anon, authenticated;
revoke delete on table public.enrollments from anon, authenticated;
revoke delete on table public.organization_memberships from anon, authenticated;
revoke delete on table public.learner_company_training_history from anon, authenticated;
revoke delete on table public.integration_training_contexts from anon, authenticated;
revoke delete on table public.learner_account_invitations from anon, authenticated;
revoke delete on table public.learning_events from anon, authenticated;
revoke delete on table public.learning_progress from anon, authenticated;
revoke delete on table public.learning_sessions from anon, authenticated;
revoke delete on table public.test_attempts from anon, authenticated;
revoke delete on table public.test_answers from anon, authenticated;
revoke delete on table public.question_attempts from anon, authenticated;
revoke delete on table public.enrollment_requirement_evidence from anon, authenticated;
revoke delete on table public.enrollment_practice_assessments_v22 from anon, authenticated;

do $check$
declare t text;
begin
  foreach t in array array['companies','learners','course_editions','enrollments','organization_memberships','learner_company_training_history','integration_training_contexts','learner_account_invitations','learning_events','learning_progress','learning_sessions','test_attempts','test_answers','question_attempts','enrollment_requirement_evidence','enrollment_practice_assessments_v22']::text[] loop
    if has_table_privilege('anon',format('public.%I',t),'DELETE') or
       has_table_privilege('authenticated',format('public.%I',t),'DELETE') then
      raise exception 'Unexpected direct DELETE privilege remains on %',t;
    end if;
    if not has_table_privilege('service_role',format('public.%I',t),'DELETE') then
      raise exception 'Unexpected service_role DELETE privilege missing on %',t;
    end if;
  end loop;
end;
$check$;
