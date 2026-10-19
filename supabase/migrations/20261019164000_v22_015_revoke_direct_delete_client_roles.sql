-- Deployed to Supabase: v22_015_revoke_direct_delete_client_roles
-- Only direct client DELETE privileges are revoked; no data changes.
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
