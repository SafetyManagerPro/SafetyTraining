-- SafetyTraining Cloud v20 — assessments, private answer keys and integration outbox
create table public.questions (
 id uuid primary key default gen_random_uuid(),owner_organization_id uuid references public.organizations(id) on delete cascade,
 stable_key text not null unique,unit_version_id uuid references public.learning_unit_versions(id) on delete set null,
 prompt text not null,question_type text not null default 'single_choice' check(question_type in ('single_choice','multiple_choice','true_false','free_text')),
 options jsonb not null default '[]'::jsonb,public_explanation text,active boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.question_answer_keys (
 question_id uuid primary key references public.questions(id) on delete cascade,answer_key jsonb not null default '{}'::jsonb,
 explanation_private text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.question_attempts (
 id uuid primary key default gen_random_uuid(),enrollment_id uuid not null references public.enrollments(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete restrict,session_id uuid references public.learning_sessions(id) on delete set null,
 attempt_no integer not null default 1 check(attempt_no>0),answer jsonb not null default '{}'::jsonb,is_correct boolean,
 answered_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb
);
create index question_attempts_enrollment_idx on public.question_attempts(enrollment_id,answered_at);
create table public.tests (
 id uuid primary key default gen_random_uuid(),course_version_id uuid not null references public.course_versions(id) on delete cascade,
 title text not null,passing_score_pct numeric(5,2) not null default 70 check(passing_score_pct between 0 and 100),max_attempts integer check(max_attempts is null or max_attempts>0),
 active boolean not null default true,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.test_questions (
 test_id uuid not null references public.tests(id) on delete cascade,question_id uuid not null references public.questions(id) on delete restrict,
 position integer not null default 0,points numeric(8,2) not null default 1 check(points>=0),primary key(test_id,question_id)
);
create table public.test_attempts (
 id uuid primary key default gen_random_uuid(),enrollment_id uuid not null references public.enrollments(id) on delete cascade,
 test_id uuid not null references public.tests(id) on delete restrict,attempt_no integer not null check(attempt_no>0),started_at timestamptz not null default now(),completed_at timestamptz,
 score_pct numeric(5,2) check(score_pct is null or score_pct between 0 and 100),passed boolean,metadata jsonb not null default '{}'::jsonb,
 unique(enrollment_id,test_id,attempt_no)
);
create table public.test_answers (
 id uuid primary key default gen_random_uuid(),test_attempt_id uuid not null references public.test_attempts(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete restrict,answer jsonb not null default '{}'::jsonb,is_correct boolean,
 points_awarded numeric(8,2),answered_at timestamptz not null default now(),unique(test_attempt_id,question_id)
);
create table public.external_mappings (
 id uuid primary key default gen_random_uuid(),source_system text not null,entity_type text not null,external_id text not null,
 local_entity_type text not null,local_id uuid not null,external_version text,external_updated_at timestamptz,
 metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(source_system,entity_type,external_id)
);
create table public.integration_outbox (
 id uuid primary key default gen_random_uuid(),event_type text not null,destination text not null,aggregate_type text,aggregate_id uuid,
 schema_version text not null default '1.0',payload jsonb not null default '{}'::jsonb,status text not null default 'pending' check(status in ('pending','processing','sent','failed','dead_letter')),
 retry_count integer not null default 0 check(retry_count>=0),next_attempt_at timestamptz,last_error text,created_at timestamptz not null default now(),processed_at timestamptz
);
create index integration_outbox_status_idx on public.integration_outbox(status,next_attempt_at,created_at);
create table public.integration_receipts (
 event_id uuid primary key,source_system text not null,event_type text not null,received_at timestamptz not null default now(),payload_hash text,metadata jsonb not null default '{}'::jsonb
);
create table public.audit_log (
 id bigint generated always as identity primary key,organization_id uuid references public.organizations(id) on delete set null,
 actor_user_id uuid references auth.users(id) on delete set null,action text not null,entity_type text not null,entity_id text,
 metadata jsonb not null default '{}'::jsonb,occurred_at timestamptz not null default now()
);
create index audit_log_org_time_idx on public.audit_log(organization_id,occurred_at desc);
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger question_answer_keys_touch before update on public.question_answer_keys for each row execute function public.touch_updated_at();
create trigger tests_touch before update on public.tests for each row execute function public.touch_updated_at();
create trigger external_mappings_touch before update on public.external_mappings for each row execute function public.touch_updated_at();
alter table public.questions enable row level security; alter table public.question_answer_keys enable row level security;
alter table public.question_attempts enable row level security; alter table public.tests enable row level security; alter table public.test_questions enable row level security;
alter table public.test_attempts enable row level security; alter table public.test_answers enable row level security; alter table public.external_mappings enable row level security;
alter table public.integration_outbox enable row level security; alter table public.integration_receipts enable row level security; alter table public.audit_log enable row level security;
create policy questions_read on public.questions for select to authenticated using(active);
create policy questions_manage on public.questions for all to authenticated using(public.is_platform_admin() or (owner_organization_id is not null and public.has_org_role(owner_organization_id,array['organization_admin','training_manager']))) with check(public.is_platform_admin() or (owner_organization_id is not null and public.has_org_role(owner_organization_id,array['organization_admin','training_manager'])));
create policy answer_keys_admin_read on public.question_answer_keys for select to authenticated using(public.is_platform_admin() or exists(select 1 from public.questions q where q.id=question_id and q.owner_organization_id is not null and public.has_org_role(q.owner_organization_id,array['organization_admin','training_manager'])));
create policy answer_keys_admin_write on public.question_answer_keys for all to authenticated using(public.is_platform_admin() or exists(select 1 from public.questions q where q.id=question_id and q.owner_organization_id is not null and public.has_org_role(q.owner_organization_id,array['organization_admin','training_manager']))) with check(public.is_platform_admin() or exists(select 1 from public.questions q where q.id=question_id and q.owner_organization_id is not null and public.has_org_role(q.owner_organization_id,array['organization_admin','training_manager'])));
create policy question_attempts_read on public.question_attempts for select to authenticated using(public.can_use_enrollment(enrollment_id));
create policy question_attempts_insert on public.question_attempts for insert to authenticated with check(public.can_use_enrollment(enrollment_id));
create policy tests_read on public.tests for select to authenticated using(active);
create policy test_questions_read on public.test_questions for select to authenticated using(true);
create policy test_attempts_read on public.test_attempts for select to authenticated using(public.can_use_enrollment(enrollment_id));
create policy test_attempts_insert on public.test_attempts for insert to authenticated with check(public.can_use_enrollment(enrollment_id));
create policy test_attempts_update on public.test_attempts for update to authenticated using(public.can_use_enrollment(enrollment_id)) with check(public.can_use_enrollment(enrollment_id));
create policy test_answers_read on public.test_answers for select to authenticated using(exists(select 1 from public.test_attempts a where a.id=test_attempt_id and public.can_use_enrollment(a.enrollment_id)));
create policy test_answers_insert on public.test_answers for insert to authenticated with check(exists(select 1 from public.test_attempts a where a.id=test_attempt_id and public.can_use_enrollment(a.enrollment_id)));
create policy external_mappings_admin on public.external_mappings for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy integration_outbox_admin on public.integration_outbox for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy integration_receipts_admin on public.integration_receipts for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy audit_log_read on public.audit_log for select to authenticated using(public.is_platform_admin() or (organization_id is not null and public.has_org_role(organization_id,array['organization_admin','training_manager'])));
create policy audit_log_insert on public.audit_log for insert to authenticated with check(actor_user_id=auth.uid() or public.is_platform_admin());
revoke insert,update,delete on public.question_answer_keys from anon;
revoke all on function public.rls_auto_enable() from public,anon,authenticated;
grant execute on function public.rls_auto_enable() to service_role;
