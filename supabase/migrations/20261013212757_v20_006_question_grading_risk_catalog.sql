-- SafetyTraining Cloud v20: secure grading trigger + reusable risk catalog.

create table if not exists public.risk_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  category text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.risk_catalog enable row level security;

create policy risk_catalog_read
on public.risk_catalog
for select to authenticated
using (active);

create policy risk_catalog_manage
on public.risk_catalog
for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

create trigger risk_catalog_touch
before update on public.risk_catalog
for each row execute function public.touch_updated_at();

-- The client may submit an answer but cannot decide whether it is correct.
-- This trigger reads the private answer key and always overwrites is_correct.
create or replace function private.grade_question_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_key jsonb;
  v_explanation text;
begin
  select k.answer_key, k.explanation_private
    into v_key, v_explanation
  from public.question_answer_keys k
  where k.question_id = new.question_id;

  if v_key is null then
    new.is_correct := null;
    return new;
  end if;

  new.is_correct := (coalesce(new.answer, '{}'::jsonb) = coalesce(v_key->'correct_answer', '{}'::jsonb));

  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
    'feedback', jsonb_strip_nulls(jsonb_build_object(
      'explanation', v_explanation,
      'case_solution', v_key->'case_solution',
      'general_solution', v_key->'general_solution'
    ))
  );

  return new;
end;
$$;

revoke all on function private.grade_question_attempt() from public, anon, authenticated;

create trigger question_attempts_secure_grade
before insert on public.question_attempts
for each row execute function private.grade_question_attempt();

-- Keep progress and the event log coherent even if a browser omits a separate update.
create or replace function private.after_question_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_unit_version_id uuid;
begin
  select q.unit_version_id into v_unit_version_id
  from public.questions q
  where q.id = new.question_id;

  if v_unit_version_id is not null then
    insert into public.learning_progress (
      enrollment_id, unit_version_id, status, comprehension_passed, started_at, updated_at
    ) values (
      new.enrollment_id,
      v_unit_version_id,
      'in_progress',
      coalesce(new.is_correct, false),
      now(),
      now()
    )
    on conflict (enrollment_id, unit_version_id) do update
      set comprehension_passed = public.learning_progress.comprehension_passed or coalesce(excluded.comprehension_passed, false),
          status = case when public.learning_progress.status = 'not_started' then 'in_progress' else public.learning_progress.status end,
          started_at = coalesce(public.learning_progress.started_at, excluded.started_at),
          updated_at = now();
  end if;

  insert into public.learning_events (
    enrollment_id, session_id, unit_version_id, event_type, occurred_at, payload
  ) values (
    new.enrollment_id,
    new.session_id,
    v_unit_version_id,
    'question_answered',
    new.answered_at,
    jsonb_build_object(
      'question_id', new.question_id,
      'attempt_no', new.attempt_no,
      'is_correct', new.is_correct
    )
  );

  return new;
end;
$$;

revoke all on function private.after_question_attempt() from public, anon, authenticated;

create trigger question_attempts_sync_progress
after insert on public.question_attempts
for each row execute function private.after_question_attempt();

-- Cover frequently joined foreign keys identified by the database advisor.
create index if not exists audit_log_actor_user_idx on public.audit_log(actor_user_id);
create index if not exists course_editions_company_idx on public.course_editions(company_id) where company_id is not null;
create index if not exists course_editions_course_version_idx on public.course_editions(course_version_id);
create index if not exists course_editions_created_by_idx on public.course_editions(created_by) where created_by is not null;
create index if not exists course_module_units_unit_version_idx on public.course_module_units(unit_version_id);
create index if not exists courses_owner_org_idx on public.courses(owner_organization_id) where owner_organization_id is not null;
create index if not exists learners_company_idx on public.learners(company_id) where company_id is not null;
create index if not exists learning_events_session_idx on public.learning_events(session_id) where session_id is not null;
create index if not exists learning_events_unit_version_idx on public.learning_events(unit_version_id) where unit_version_id is not null;
create index if not exists learning_progress_unit_version_idx on public.learning_progress(unit_version_id);
create index if not exists learning_units_owner_org_idx on public.learning_units(owner_organization_id) where owner_organization_id is not null;
create index if not exists memberships_company_idx on public.organization_memberships(company_id) where company_id is not null;
create index if not exists memberships_org_idx on public.organization_memberships(organization_id);
create index if not exists question_attempts_question_idx on public.question_attempts(question_id);
create index if not exists question_attempts_session_idx on public.question_attempts(session_id) where session_id is not null;
create index if not exists questions_owner_org_idx on public.questions(owner_organization_id) where owner_organization_id is not null;
create index if not exists questions_unit_version_idx on public.questions(unit_version_id) where unit_version_id is not null;
create index if not exists test_answers_question_idx on public.test_answers(question_id);
create index if not exists test_attempts_test_idx on public.test_attempts(test_id);
create index if not exists test_questions_question_idx on public.test_questions(question_id);
create index if not exists tests_course_version_idx on public.tests(course_version_id);
