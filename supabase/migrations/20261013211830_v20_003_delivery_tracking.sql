-- SafetyTraining Cloud v20 — editions, enrollments and active learning tracking
create table public.course_editions (
 id uuid primary key default gen_random_uuid(),course_version_id uuid not null references public.course_versions(id) on delete restrict,
 organization_id uuid not null references public.organizations(id) on delete cascade,company_id uuid references public.companies(id) on delete set null,
 title text,learning_mode text not null default 'elearning_internal' check(learning_mode in ('elearning_internal','classroom','blended','self_study')),
 certification_mode text not null default 'not_certifying' check(certification_mode in ('not_certifying','certifiable','certifying')),
 available_from timestamptz,available_until timestamptz,recommended_due_at timestamptz,block_after_due boolean not null default false,
 status text not null default 'draft' check(status in ('draft','open','closed','archived')),created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(available_until is null or available_from is null or available_until>=available_from)
);
create index editions_context_idx on public.course_editions(organization_id,company_id,status);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(),edition_id uuid not null references public.course_editions(id) on delete cascade,
 learner_id uuid not null references public.learners(id) on delete cascade,status text not null default 'not_started' check(status in ('not_started','in_progress','completed','passed','failed','revoked')),
 enrolled_at timestamptz not null default now(),started_at timestamptz,completed_at timestamptz,last_activity_at timestamptz,
 active_seconds bigint not null default 0 check(active_seconds>=0),progress_pct numeric(5,2) not null default 0 check(progress_pct between 0 and 100),
 final_score_pct numeric(5,2) check(final_score_pct is null or final_score_pct between 0 and 100),metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(edition_id,learner_id)
);
create index enrollments_learner_idx on public.enrollments(learner_id,status);
create or replace function public.can_use_enrollment(p_enrollment_id uuid) returns boolean language sql stable security definer set search_path=public,auth as $$
select exists(select 1 from public.enrollments e join public.learners l on l.id=e.learner_id join public.course_editions d on d.id=e.edition_id where e.id=p_enrollment_id and (l.auth_user_id=auth.uid() or public.can_access_company(d.organization_id,d.company_id))); $$;
revoke all on function public.can_use_enrollment(uuid) from public,anon; grant execute on function public.can_use_enrollment(uuid) to authenticated,service_role;
create table public.learning_sessions (
 id uuid primary key default gen_random_uuid(),enrollment_id uuid not null references public.enrollments(id) on delete cascade,
 started_at timestamptz not null default now(),ended_at timestamptz,last_heartbeat_at timestamptz,active_seconds bigint not null default 0 check(active_seconds>=0),
 client_session_id text,metadata jsonb not null default '{}'::jsonb
);
create index sessions_enrollment_idx on public.learning_sessions(enrollment_id,started_at desc);
create table public.learning_events (
 id bigint generated always as identity primary key,enrollment_id uuid not null references public.enrollments(id) on delete cascade,
 session_id uuid references public.learning_sessions(id) on delete cascade,unit_version_id uuid references public.learning_unit_versions(id) on delete set null,
 event_type text not null check(event_type in ('session_started','session_ended','unit_opened','unit_closed','heartbeat','interaction','visibility_paused','visibility_resumed','content_viewed','question_answered','unit_completed','test_started','test_answered','test_completed')),
 occurred_at timestamptz not null default now(),active_delta_seconds integer not null default 0 check(active_delta_seconds between 0 and 3600),payload jsonb not null default '{}'::jsonb
);
create index events_enrollment_idx on public.learning_events(enrollment_id,occurred_at);
create table public.learning_progress (
 enrollment_id uuid not null references public.enrollments(id) on delete cascade,unit_version_id uuid not null references public.learning_unit_versions(id) on delete restrict,
 status text not null default 'not_started' check(status in ('not_started','in_progress','completed')),active_seconds bigint not null default 0 check(active_seconds>=0),
 content_viewed boolean not null default false,comprehension_passed boolean not null default false,started_at timestamptz,completed_at timestamptz,updated_at timestamptz not null default now(),
 primary key(enrollment_id,unit_version_id)
);
create trigger editions_touch before update on public.course_editions for each row execute function public.touch_updated_at();
create trigger enrollments_touch before update on public.enrollments for each row execute function public.touch_updated_at();
alter table public.course_editions enable row level security; alter table public.enrollments enable row level security;
alter table public.learning_sessions enable row level security; alter table public.learning_events enable row level security; alter table public.learning_progress enable row level security;
create policy editions_read on public.course_editions for select to authenticated using(public.can_access_company(public.course_editions.organization_id,public.course_editions.company_id) or exists(select 1 from public.enrollments e join public.learners l on l.id=e.learner_id where e.edition_id=public.course_editions.id and l.auth_user_id=auth.uid()));
create policy editions_manage on public.course_editions for all to authenticated using(public.can_access_company(public.course_editions.organization_id,public.course_editions.company_id)) with check(public.can_access_company(public.course_editions.organization_id,public.course_editions.company_id));
create policy enrollments_read on public.enrollments for select to authenticated using(public.can_use_enrollment(public.enrollments.id));
create policy enrollments_manage_staff on public.enrollments for all to authenticated using(exists(select 1 from public.course_editions d where d.id=public.enrollments.edition_id and public.can_access_company(d.organization_id,d.company_id))) with check(exists(select 1 from public.course_editions d where d.id=public.enrollments.edition_id and public.can_access_company(d.organization_id,d.company_id)));
create policy sessions_read on public.learning_sessions for select to authenticated using(public.can_use_enrollment(enrollment_id));
create policy sessions_insert on public.learning_sessions for insert to authenticated with check(public.can_use_enrollment(enrollment_id));
create policy sessions_update on public.learning_sessions for update to authenticated using(public.can_use_enrollment(enrollment_id)) with check(public.can_use_enrollment(enrollment_id));
create policy events_read on public.learning_events for select to authenticated using(public.can_use_enrollment(enrollment_id));
create policy events_insert on public.learning_events for insert to authenticated with check(public.can_use_enrollment(enrollment_id));
create policy progress_read on public.learning_progress for select to authenticated using(public.can_use_enrollment(enrollment_id));
create policy progress_write on public.learning_progress for all to authenticated using(public.can_use_enrollment(enrollment_id)) with check(public.can_use_enrollment(enrollment_id));
