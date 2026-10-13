-- Safety Platform v19 — fondazione LMS additiva
-- Non sostituisce le tabelle SafetyManager esistenti e non modifica le policy legacy.
-- Obiettivo: login unico, ruoli, multiutente/multiazienda, learning unit, tracking e test.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Utility
-- -----------------------------------------------------------------------------
create or replace function public.platform_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Identità e ruoli: auth.users ↔ SafetyManager esistente
-- -----------------------------------------------------------------------------
create table if not exists public.platform_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_app text not null default 'training'
    check (preferred_app in ('manager','training')),
  locale text not null default 'it-IT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ente_id uuid not null references public.enti(id) on delete cascade,
  azienda_id uuid references public.aziende(id) on delete cascade,
  role text not null check (role in (
    'super_admin','organization_admin','training_manager','teacher','tutor','company_admin','learner'
  )),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_memberships_unique_scope
on public.platform_memberships(
  user_id,
  ente_id,
  role,
  coalesce(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index if not exists platform_memberships_user_idx on public.platform_memberships(user_id) where active;
create index if not exists platform_memberships_ente_idx on public.platform_memberships(ente_id, azienda_id) where active;

create table if not exists public.platform_corsista_accounts (
  corsista_id uuid primary key references public.corsisti(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  invited_at timestamptz,
  linked_at timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists public.platform_docente_accounts (
  docente_id uuid primary key references public.docenti(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  active boolean not null default true
);

create or replace function public.platform_has_any_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_memberships m
    where m.user_id = auth.uid()
      and m.active
      and m.role = any(p_roles)
  );
$$;

create or replace function public.platform_has_role(p_ente_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_memberships m
    where m.user_id = auth.uid()
      and m.active
      and m.ente_id = p_ente_id
      and m.role = any(p_roles)
  );
$$;

create or replace function public.platform_can_access_context(p_ente_id uuid, p_azienda_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_memberships m
    where m.user_id = auth.uid()
      and m.active
      and m.ente_id = p_ente_id
      and (
        m.role in ('super_admin','organization_admin','training_manager','teacher','tutor')
        or (m.role = 'company_admin' and m.azienda_id = p_azienda_id)
      )
  );
$$;

create or replace function public.platform_is_corsista(p_corsista_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.platform_corsista_accounts a
    where a.user_id = auth.uid()
      and a.corsista_id = p_corsista_id
      and a.active
  );
$$;

-- -----------------------------------------------------------------------------
-- Catalogo corsi sincronizzabile da SafetyManager DB_CORSI
-- -----------------------------------------------------------------------------
create table if not exists public.training_course_catalog (
  id uuid primary key default gen_random_uuid(),
  legacy_course_id text not null unique,
  owner_ente_id uuid references public.enti(id) on delete cascade,
  title text not null,
  family text not null default 'other',
  nominal_hours numeric(7,2) check (nominal_hours is null or nominal_hours >= 0),
  expiry_years numeric(6,2) check (expiry_years is null or expiry_years >= 0),
  risk_code text,
  course_code text,
  legal_ref text,
  enabled_in_lms boolean not null default true,
  certification_mode text not null default 'internal_learning'
    check (certification_mode in ('internal_learning','certifiable','certified_only')),
  source_system text not null default 'SafetyManager',
  source_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(source_metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_course_catalog(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft' check (status in ('draft','published','retired')),
  effective_from date,
  effective_to date,
  normative_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(normative_snapshot)='object'),
  syllabus_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(syllabus_snapshot)='object'),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(course_id, version_number)
);

-- -----------------------------------------------------------------------------
-- Learning Unit versionate: qui confluiscono le 90 schede Safety Training
-- -----------------------------------------------------------------------------
create table if not exists public.training_learning_units (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null unique,
  owner_ente_id uuid references public.enti(id) on delete cascade,
  title text not null,
  summary text,
  default_minutes integer check (default_minutes is null or default_minutes >= 0),
  source_group text,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_learning_unit_versions (
  id uuid primary key default gen_random_uuid(),
  learning_unit_id uuid not null references public.training_learning_units(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft' check (status in ('draft','published','retired')),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content)='object'),
  content_hash text,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(learning_unit_id, version_number)
);

create table if not exists public.training_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.training_course_versions(id) on delete cascade,
  module_key text not null,
  title text not null,
  position integer not null default 0,
  nominal_minutes integer check (nominal_minutes is null or nominal_minutes >= 0),
  created_at timestamptz not null default now(),
  unique(course_version_id, module_key)
);

create table if not exists public.training_course_module_units (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_course_modules(id) on delete cascade,
  unit_version_id uuid not null references public.training_learning_unit_versions(id) on delete restrict,
  position integer not null default 0,
  required boolean not null default true,
  min_active_seconds integer not null default 0 check (min_active_seconds >= 0),
  requires_comprehension boolean not null default true,
  completion_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(completion_rules)='object'),
  unique(module_id, unit_version_id)
);

-- -----------------------------------------------------------------------------
-- ATECO, mansioni e rischi: builder del percorso, senza automatismi assoluti
-- -----------------------------------------------------------------------------
create table if not exists public.training_risk_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  category text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.training_ateco_profiles (
  id uuid primary key default gen_random_uuid(),
  ateco_code text not null unique,
  title text,
  default_risk_level text check (default_risk_level is null or default_risk_level in ('low','medium','high')),
  suggested_risk_codes text[] not null default '{}',
  advisory_only boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_job_profiles (
  id uuid primary key default gen_random_uuid(),
  ente_id uuid references public.enti(id) on delete cascade,
  azienda_id uuid references public.aziende(id) on delete cascade,
  title text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_job_profile_risks (
  job_profile_id uuid not null references public.training_job_profiles(id) on delete cascade,
  risk_id uuid not null references public.training_risk_catalog(id) on delete restrict,
  exposure_level text check (exposure_level is null or exposure_level in ('low','medium','high')),
  source text not null default 'manual' check (source in ('ateco','dvr','manual','inspection','other')),
  notes text,
  primary key(job_profile_id, risk_id)
);

-- -----------------------------------------------------------------------------
-- Edizioni LMS: possono essere puramente interne o collegate a un progetto SafetyManager
-- -----------------------------------------------------------------------------
create table if not exists public.training_editions (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.training_course_versions(id) on delete restrict,
  ente_id uuid not null references public.enti(id) on delete cascade,
  azienda_id uuid references public.aziende(id) on delete cascade,
  progetto_id uuid references public.progetti(id) on delete set null,
  title text,
  learning_mode text not null default 'elearning_internal'
    check (learning_mode in ('elearning_internal','classroom','blended','self_study')),
  certification_mode text not null default 'not_certifying'
    check (certification_mode in ('not_certifying','certifiable','certifying')),
  availability_mode text not null default 'immediate'
    check (availability_mode in ('immediate','start_only','window','manual')),
  available_from timestamptz,
  available_until timestamptz,
  recommended_due_at timestamptz,
  block_after_due boolean not null default false,
  status text not null default 'draft' check (status in ('draft','open','closed','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_until is null or available_from is null or available_until >= available_from)
);
create index if not exists training_editions_context_idx on public.training_editions(ente_id, azienda_id, status);
create index if not exists training_editions_project_idx on public.training_editions(progetto_id) where progetto_id is not null;

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.training_editions(id) on delete cascade,
  corsista_id uuid not null references public.corsisti(id) on delete cascade,
  iscrizione_id uuid references public.iscrizioni(id) on delete set null,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','completed','passed','failed')),
  certification_status text not null default 'not_certified'
    check (certification_status in ('not_applicable','not_certified','certifiable','certified')),
  enrolled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz,
  active_seconds bigint not null default 0 check (active_seconds >= 0),
  progress_pct numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  final_score_pct numeric(5,2) check (final_score_pct is null or final_score_pct between 0 and 100),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(edition_id, corsista_id)
);
create index if not exists training_enrollments_corsista_idx on public.training_enrollments(corsista_id, status);

create or replace function public.platform_can_use_enrollment(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.training_enrollments e
    join public.training_editions d on d.id=e.edition_id
    where e.id=p_enrollment_id
      and (
        public.platform_is_corsista(e.corsista_id)
        or public.platform_can_access_context(d.ente_id, d.azienda_id)
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- Tracking tempo attivo / eventi
-- -----------------------------------------------------------------------------
create table if not exists public.training_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_heartbeat_at timestamptz,
  active_seconds bigint not null default 0 check (active_seconds >= 0),
  client_session_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object')
);
create index if not exists training_learning_sessions_enrollment_idx on public.training_learning_sessions(enrollment_id, started_at desc);

create table if not exists public.training_learning_events (
  id bigint generated always as identity primary key,
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  session_id uuid references public.training_learning_sessions(id) on delete cascade,
  unit_version_id uuid references public.training_learning_unit_versions(id) on delete set null,
  event_type text not null check (event_type in (
    'session_started','session_ended','unit_opened','unit_closed','heartbeat','interaction',
    'visibility_paused','visibility_resumed','content_viewed','question_answered','unit_completed',
    'test_started','test_answered','test_completed'
  )),
  occurred_at timestamptz not null default now(),
  active_delta_seconds integer not null default 0 check (active_delta_seconds between 0 and 3600),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object')
);
create index if not exists training_learning_events_enrollment_idx on public.training_learning_events(enrollment_id, occurred_at);
create index if not exists training_learning_events_unit_idx on public.training_learning_events(unit_version_id, occurred_at) where unit_version_id is not null;

create table if not exists public.training_unit_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  unit_version_id uuid not null references public.training_learning_unit_versions(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  opened_at timestamptz,
  last_activity_at timestamptz,
  completed_at timestamptz,
  active_seconds bigint not null default 0 check (active_seconds >= 0),
  required_items_seen integer not null default 0 check (required_items_seen >= 0),
  required_items_total integer not null default 0 check (required_items_total >= 0),
  questions_answered integer not null default 0 check (questions_answered >= 0),
  questions_correct integer not null default 0 check (questions_correct >= 0),
  comprehension_confirmed boolean not null default false,
  score_pct numeric(5,2) check (score_pct is null or score_pct between 0 and 100),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(enrollment_id, unit_version_id)
);

-- -----------------------------------------------------------------------------
-- Banca domande: la chiave corretta è separata e non leggibile dal corsista
-- -----------------------------------------------------------------------------
create table if not exists public.training_questions (
  id uuid primary key default gen_random_uuid(),
  stable_key text unique,
  owner_ente_id uuid references public.enti(id) on delete cascade,
  question_type text not null default 'single_choice'
    check (question_type in ('single_choice','multiple_choice','true_false','open_text')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options)='array'),
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_question_keys (
  question_id uuid primary key references public.training_questions(id) on delete cascade,
  correct_answer jsonb not null,
  explanation text,
  case_solution text,
  general_solution text,
  updated_at timestamptz not null default now()
);

create table if not exists public.training_question_assignments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.training_questions(id) on delete cascade,
  unit_version_id uuid references public.training_learning_unit_versions(id) on delete cascade,
  course_version_id uuid references public.training_course_versions(id) on delete cascade,
  purpose text not null default 'comprehension' check (purpose in ('comprehension','module_test','final_test','practice')),
  required boolean not null default false,
  position integer not null default 0,
  check (unit_version_id is not null or course_version_id is not null)
);

create table if not exists public.training_question_responses (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  unit_version_id uuid references public.training_learning_unit_versions(id) on delete cascade,
  question_id uuid not null references public.training_questions(id) on delete restrict,
  attempt_no integer not null default 1 check (attempt_no > 0),
  answer jsonb not null,
  is_correct boolean,
  feedback_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(feedback_snapshot)='object'),
  answered_at timestamptz not null default now()
);
create index if not exists training_question_responses_enrollment_idx
  on public.training_question_responses(enrollment_id, unit_version_id, answered_at desc);

create table if not exists public.training_test_templates (
  id uuid primary key default gen_random_uuid(),
  course_version_id uuid not null references public.training_course_versions(id) on delete cascade,
  title text not null,
  test_kind text not null default 'final' check (test_kind in ('entry','module','final','practice')),
  pass_pct numeric(5,2) not null default 70 check (pass_pct between 0 and 100),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  question_count integer check (question_count is null or question_count > 0),
  selection_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(selection_rules)='object'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_test_items (
  test_template_id uuid not null references public.training_test_templates(id) on delete cascade,
  question_id uuid not null references public.training_questions(id) on delete restrict,
  position integer not null default 0,
  points numeric(7,2) not null default 1 check (points > 0),
  primary key(test_template_id, question_id)
);

create table if not exists public.training_test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_template_id uuid not null references public.training_test_templates(id) on delete restrict,
  enrollment_id uuid not null references public.training_enrollments(id) on delete cascade,
  attempt_no integer not null check (attempt_no > 0),
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score_pct numeric(5,2) check (score_pct is null or score_pct between 0 and 100),
  passed boolean,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  unique(test_template_id, enrollment_id, attempt_no)
);

create table if not exists public.training_test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.training_test_attempts(id) on delete cascade,
  question_id uuid not null references public.training_questions(id) on delete restrict,
  answer jsonb not null,
  is_correct boolean,
  points_awarded numeric(7,2),
  feedback_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(feedback_snapshot)='object'),
  answered_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

-- RPC atomica per heartbeat/eventi: il server resta autorevole sul tempo registrato.
create or replace function public.training_record_event(
  p_enrollment_id uuid,
  p_session_id uuid,
  p_unit_version_id uuid,
  p_event_type text,
  p_active_delta_seconds integer default 0,
  p_payload jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_event_id bigint;
  v_delta integer := greatest(0, least(coalesce(p_active_delta_seconds,0), 3600));
begin
  if not public.platform_can_use_enrollment(p_enrollment_id) then
    raise exception 'not authorized for enrollment';
  end if;

  insert into public.training_learning_events(
    enrollment_id, session_id, unit_version_id, event_type, active_delta_seconds, payload
  ) values (
    p_enrollment_id, p_session_id, p_unit_version_id, p_event_type, v_delta, coalesce(p_payload,'{}'::jsonb)
  ) returning id into v_event_id;

  if p_session_id is not null and v_delta > 0 then
    update public.training_learning_sessions
      set active_seconds = active_seconds + v_delta,
          last_heartbeat_at = now()
    where id=p_session_id and enrollment_id=p_enrollment_id;
  end if;

  if p_unit_version_id is not null then
    insert into public.training_unit_progress(
      enrollment_id, unit_version_id, status, opened_at, last_activity_at, active_seconds
    ) values (
      p_enrollment_id, p_unit_version_id,
      case when p_event_type='unit_completed' then 'completed' else 'in_progress' end,
      now(), now(), v_delta
    )
    on conflict (enrollment_id, unit_version_id) do update
      set last_activity_at=now(),
          active_seconds=public.training_unit_progress.active_seconds + v_delta,
          status=case when p_event_type='unit_completed' then 'completed' else public.training_unit_progress.status end,
          completed_at=case when p_event_type='unit_completed' then coalesce(public.training_unit_progress.completed_at,now()) else public.training_unit_progress.completed_at end,
          updated_at=now();
  end if;

  update public.training_enrollments
    set active_seconds=active_seconds+v_delta,
        last_activity_at=now(),
        started_at=coalesce(started_at,now()),
        status=case when status='not_started' then 'in_progress' else status end,
        updated_at=now()
  where id=p_enrollment_id;

  return v_event_id;
end;
$$;

-- Risposta di comprensione: confronta la chiave lato server e restituisce feedback solo dopo il tentativo.
create or replace function public.training_submit_comprehension_answer(
  p_enrollment_id uuid,
  p_unit_version_id uuid,
  p_question_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_key public.training_question_keys%rowtype;
  v_correct boolean;
  v_attempt integer;
  v_feedback jsonb;
begin
  if not public.platform_can_use_enrollment(p_enrollment_id) then
    raise exception 'not authorized for enrollment';
  end if;

  if not exists(
    select 1 from public.training_question_assignments qa
    where qa.question_id=p_question_id
      and qa.unit_version_id=p_unit_version_id
      and qa.purpose='comprehension'
  ) then
    raise exception 'question is not assigned to this unit';
  end if;

  select * into v_key from public.training_question_keys where question_id=p_question_id;
  if not found then raise exception 'answer key not found'; end if;

  v_correct := coalesce(p_answer,'null'::jsonb) = v_key.correct_answer;
  select coalesce(max(attempt_no),0)+1 into v_attempt
  from public.training_question_responses
  where enrollment_id=p_enrollment_id and unit_version_id=p_unit_version_id and question_id=p_question_id;

  v_feedback := jsonb_build_object(
    'correct',v_correct,
    'explanation',coalesce(v_key.explanation,''),
    'case_solution',coalesce(v_key.case_solution,''),
    'general_solution',coalesce(v_key.general_solution,'')
  );

  insert into public.training_question_responses(
    enrollment_id,unit_version_id,question_id,attempt_no,answer,is_correct,feedback_snapshot
  ) values (p_enrollment_id,p_unit_version_id,p_question_id,v_attempt,p_answer,v_correct,v_feedback);

  insert into public.training_unit_progress(enrollment_id,unit_version_id,status,opened_at,last_activity_at,questions_answered,questions_correct,comprehension_confirmed)
  values (p_enrollment_id,p_unit_version_id,'in_progress',now(),now(),1,case when v_correct then 1 else 0 end,v_correct)
  on conflict (enrollment_id,unit_version_id) do update
    set questions_answered=public.training_unit_progress.questions_answered+1,
        questions_correct=public.training_unit_progress.questions_correct+case when v_correct then 1 else 0 end,
        comprehension_confirmed=public.training_unit_progress.comprehension_confirmed or v_correct,
        last_activity_at=now(),
        status=case when public.training_unit_progress.status='not_started' then 'in_progress' else public.training_unit_progress.status end,
        updated_at=now();

  perform public.training_record_event(p_enrollment_id,null,p_unit_version_id,'question_answered',0,
    jsonb_build_object('question_id',p_question_id,'correct',v_correct,'attempt',v_attempt));

  return v_feedback || jsonb_build_object('attempt',v_attempt);
end;
$$;

-- Completa una unità solo se sono rispettate le regole minime impostate nel corso.
create or replace function public.training_try_complete_unit(
  p_enrollment_id uuid,
  p_unit_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_course_version uuid;
  v_min_seconds integer := 0;
  v_requires_comprehension boolean := false;
  v_progress public.training_unit_progress%rowtype;
  v_active_ok boolean;
  v_content_ok boolean;
  v_comprehension_ok boolean;
  v_total integer;
  v_done integer;
  v_pct numeric(5,2);
begin
  if not public.platform_can_use_enrollment(p_enrollment_id) then
    raise exception 'not authorized for enrollment';
  end if;

  select d.course_version_id into v_course_version
  from public.training_enrollments e join public.training_editions d on d.id=e.edition_id
  where e.id=p_enrollment_id;

  select coalesce(max(cmu.min_active_seconds),0), coalesce(bool_or(cmu.requires_comprehension),false)
    into v_min_seconds,v_requires_comprehension
  from public.training_course_module_units cmu
  join public.training_course_modules cm on cm.id=cmu.module_id
  where cm.course_version_id=v_course_version and cmu.unit_version_id=p_unit_version_id and cmu.required;

  select * into v_progress from public.training_unit_progress
  where enrollment_id=p_enrollment_id and unit_version_id=p_unit_version_id;

  if not found then
    return jsonb_build_object('completed',false,'reasons',jsonb_build_array('unit_not_started'));
  end if;

  v_active_ok := v_progress.active_seconds >= v_min_seconds;
  v_content_ok := v_progress.required_items_total=0 or v_progress.required_items_seen >= v_progress.required_items_total;
  v_comprehension_ok := (not v_requires_comprehension) or v_progress.comprehension_confirmed;

  if not (v_active_ok and v_content_ok and v_comprehension_ok) then
    return jsonb_build_object(
      'completed',false,
      'active_ok',v_active_ok,
      'content_ok',v_content_ok,
      'comprehension_ok',v_comprehension_ok,
      'active_seconds',v_progress.active_seconds,
      'minimum_active_seconds',v_min_seconds
    );
  end if;

  update public.training_unit_progress
    set status='completed', completed_at=coalesce(completed_at,now()), last_activity_at=now(), updated_at=now()
  where id=v_progress.id;

  insert into public.training_learning_events(enrollment_id,unit_version_id,event_type,payload)
  values(p_enrollment_id,p_unit_version_id,'unit_completed',jsonb_build_object('validated_by','training_try_complete_unit'));

  select count(*) filter(where cmu.required),
         count(*) filter(where cmu.required and up.status='completed')
    into v_total,v_done
  from public.training_course_modules cm
  join public.training_course_module_units cmu on cmu.module_id=cm.id
  left join public.training_unit_progress up on up.enrollment_id=p_enrollment_id and up.unit_version_id=cmu.unit_version_id
  where cm.course_version_id=v_course_version;

  v_pct := case when v_total=0 then 0 else round((v_done::numeric/v_total::numeric)*100,2) end;
  update public.training_enrollments
    set progress_pct=v_pct,
        status=case when v_pct>=100 then 'completed' else 'in_progress' end,
        completed_at=case when v_pct>=100 then coalesce(completed_at,now()) else completed_at end,
        updated_at=now()
  where id=p_enrollment_id;

  return jsonb_build_object('completed',true,'progress_pct',v_pct,'completed_units',v_done,'required_units',v_total);
end;
$$;

-- Avvia un test senza consentire al client di scrivere direttamente punteggi/esiti.
create or replace function public.training_start_test(
  p_test_template_id uuid,
  p_enrollment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_template public.training_test_templates%rowtype;
  v_attempt_no integer;
  v_attempt_id uuid;
begin
  if not public.platform_can_use_enrollment(p_enrollment_id) then
    raise exception 'not authorized for enrollment';
  end if;
  select * into v_template from public.training_test_templates where id=p_test_template_id and active;
  if not found then raise exception 'test template not found'; end if;
  if not exists(
    select 1 from public.training_enrollments e
    join public.training_editions d on d.id=e.edition_id
    where e.id=p_enrollment_id and d.course_version_id=v_template.course_version_id
  ) then raise exception 'test not valid for this enrollment'; end if;

  select coalesce(max(attempt_no),0)+1 into v_attempt_no
  from public.training_test_attempts where test_template_id=p_test_template_id and enrollment_id=p_enrollment_id;
  if v_template.max_attempts is not null and v_attempt_no>v_template.max_attempts then
    raise exception 'maximum attempts reached';
  end if;

  insert into public.training_test_attempts(test_template_id,enrollment_id,attempt_no,status)
  values(p_test_template_id,p_enrollment_id,v_attempt_no,'in_progress') returning id into v_attempt_id;
  perform public.training_record_event(p_enrollment_id,null,null,'test_started',0,jsonb_build_object('test_template_id',p_test_template_id,'attempt',v_attempt_no));
  return v_attempt_id;
end;
$$;

create or replace function public.training_submit_test_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_attempt public.training_test_attempts%rowtype;
  v_key public.training_question_keys%rowtype;
  v_points numeric(7,2);
  v_correct boolean;
  v_feedback jsonb;
begin
  select * into v_attempt from public.training_test_attempts where id=p_attempt_id and status='in_progress';
  if not found then raise exception 'active attempt not found'; end if;
  if not public.platform_can_use_enrollment(v_attempt.enrollment_id) then raise exception 'not authorized for attempt'; end if;

  select points into v_points from public.training_test_items
  where test_template_id=v_attempt.test_template_id and question_id=p_question_id;
  if not found then raise exception 'question not assigned to test'; end if;

  select * into v_key from public.training_question_keys where question_id=p_question_id;
  if not found then raise exception 'answer key not found'; end if;
  v_correct := coalesce(p_answer,'null'::jsonb)=v_key.correct_answer;
  v_feedback := jsonb_build_object('correct',v_correct,'explanation',coalesce(v_key.explanation,''),'case_solution',coalesce(v_key.case_solution,''),'general_solution',coalesce(v_key.general_solution,''));

  insert into public.training_test_answers(attempt_id,question_id,answer,is_correct,points_awarded,feedback_snapshot)
  values(p_attempt_id,p_question_id,p_answer,v_correct,case when v_correct then v_points else 0 end,v_feedback)
  on conflict (attempt_id,question_id) do update
    set answer=excluded.answer,is_correct=excluded.is_correct,points_awarded=excluded.points_awarded,feedback_snapshot=excluded.feedback_snapshot,answered_at=now();

  perform public.training_record_event(v_attempt.enrollment_id,null,null,'test_answered',0,jsonb_build_object('attempt_id',p_attempt_id,'question_id',p_question_id,'correct',v_correct));
  return v_feedback;
end;
$$;

create or replace function public.training_finish_test(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_attempt public.training_test_attempts%rowtype;
  v_template public.training_test_templates%rowtype;
  v_total numeric;
  v_awarded numeric;
  v_answered integer;
  v_expected integer;
  v_score numeric(5,2);
  v_passed boolean;
begin
  select * into v_attempt from public.training_test_attempts where id=p_attempt_id and status='in_progress';
  if not found then raise exception 'active attempt not found'; end if;
  if not public.platform_can_use_enrollment(v_attempt.enrollment_id) then raise exception 'not authorized for attempt'; end if;
  select * into v_template from public.training_test_templates where id=v_attempt.test_template_id;

  select coalesce(sum(points),0),count(*) into v_total,v_expected
  from public.training_test_items where test_template_id=v_attempt.test_template_id;
  select coalesce(sum(points_awarded),0),count(*) into v_awarded,v_answered
  from public.training_test_answers where attempt_id=p_attempt_id;
  if v_expected=0 then raise exception 'test has no explicit items'; end if;
  if v_answered<v_expected then
    return jsonb_build_object('completed',false,'answered',v_answered,'expected',v_expected);
  end if;

  v_score := case when v_total=0 then 0 else round((v_awarded/v_total)*100,2) end;
  v_passed := v_score>=v_template.pass_pct;
  update public.training_test_attempts set status='completed',completed_at=now(),score_pct=v_score,passed=v_passed where id=p_attempt_id;
  update public.training_enrollments
    set final_score_pct=case when v_template.test_kind='final' then v_score else final_score_pct end,
        status=case when v_template.test_kind='final' then case when v_passed then 'passed' else 'failed' end else status end,
        updated_at=now()
    where id=v_attempt.enrollment_id;
  perform public.training_record_event(v_attempt.enrollment_id,null,null,'test_completed',0,jsonb_build_object('attempt_id',p_attempt_id,'score_pct',v_score,'passed',v_passed));
  return jsonb_build_object('completed',true,'score_pct',v_score,'passed',v_passed,'pass_pct',v_template.pass_pct);
end;
$$;

-- -----------------------------------------------------------------------------
-- Trigger updated_at
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'platform_user_profiles','platform_memberships','training_course_catalog','training_learning_units',
    'training_ateco_profiles','training_job_profiles','training_editions','training_enrollments',
    'training_unit_progress','training_questions','training_test_templates'
  ] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.platform_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- RLS — solo nuove tabelle. Le policy SafetyManager legacy restano invariate.
-- -----------------------------------------------------------------------------
alter table public.platform_user_profiles enable row level security;
alter table public.platform_memberships enable row level security;
alter table public.platform_corsista_accounts enable row level security;
alter table public.platform_docente_accounts enable row level security;
alter table public.training_course_catalog enable row level security;
alter table public.training_course_versions enable row level security;
alter table public.training_learning_units enable row level security;
alter table public.training_learning_unit_versions enable row level security;
alter table public.training_course_modules enable row level security;
alter table public.training_course_module_units enable row level security;
alter table public.training_risk_catalog enable row level security;
alter table public.training_ateco_profiles enable row level security;
alter table public.training_job_profiles enable row level security;
alter table public.training_job_profile_risks enable row level security;
alter table public.training_editions enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_learning_sessions enable row level security;
alter table public.training_learning_events enable row level security;
alter table public.training_unit_progress enable row level security;
alter table public.training_questions enable row level security;
alter table public.training_question_keys enable row level security;
alter table public.training_question_assignments enable row level security;
alter table public.training_question_responses enable row level security;
alter table public.training_test_templates enable row level security;
alter table public.training_test_items enable row level security;
alter table public.training_test_attempts enable row level security;
alter table public.training_test_answers enable row level security;

-- Profili: l'utente gestisce il proprio.
drop policy if exists platform_profile_self on public.platform_user_profiles;
create policy platform_profile_self on public.platform_user_profiles
for all to authenticated
using (user_id=auth.uid() or public.platform_has_any_role(array['super_admin']))
with check (user_id=auth.uid() or public.platform_has_any_role(array['super_admin']));

-- Membership: ognuno legge le proprie; gli admin dell'ente possono amministrarle.
drop policy if exists platform_memberships_read on public.platform_memberships;
create policy platform_memberships_read on public.platform_memberships
for select to authenticated
using (user_id=auth.uid() or public.platform_has_role(ente_id,array['super_admin','organization_admin']));
drop policy if exists platform_memberships_write on public.platform_memberships;
create policy platform_memberships_write on public.platform_memberships
for all to authenticated
using (public.platform_has_role(ente_id,array['super_admin','organization_admin']))
with check (public.platform_has_role(ente_id,array['super_admin','organization_admin']));

-- Collegamenti account: self o amministrazione dell'ente derivato dal record SafetyManager.
drop policy if exists corsista_accounts_read on public.platform_corsista_accounts;
create policy corsista_accounts_read on public.platform_corsista_accounts
for select to authenticated
using (
  user_id=auth.uid() or exists(
    select 1 from public.corsisti c
    where c.id=corsista_id and public.platform_can_access_context(c.ente_id,c.azienda_id)
  )
);
drop policy if exists corsista_accounts_write on public.platform_corsista_accounts;
create policy corsista_accounts_write on public.platform_corsista_accounts
for all to authenticated
using (exists(select 1 from public.corsisti c where c.id=corsista_id and public.platform_has_role(c.ente_id,array['super_admin','organization_admin','training_manager'])))
with check (exists(select 1 from public.corsisti c where c.id=corsista_id and public.platform_has_role(c.ente_id,array['super_admin','organization_admin','training_manager'])));

drop policy if exists docente_accounts_read on public.platform_docente_accounts;
create policy docente_accounts_read on public.platform_docente_accounts
for select to authenticated
using (
  user_id=auth.uid() or exists(
    select 1 from public.docenti d where d.id=docente_id and public.platform_has_role(d.ente_id,array['super_admin','organization_admin','training_manager'])
  )
);
drop policy if exists docente_accounts_write on public.platform_docente_accounts;
create policy docente_accounts_write on public.platform_docente_accounts
for all to authenticated
using (exists(select 1 from public.docenti d where d.id=docente_id and public.platform_has_role(d.ente_id,array['super_admin','organization_admin','training_manager'])))
with check (exists(select 1 from public.docenti d where d.id=docente_id and public.platform_has_role(d.ente_id,array['super_admin','organization_admin','training_manager'])));

-- Contenuti pubblicati: lettura a tutti gli autenticati. Modifica solo ruoli contenuto.
drop policy if exists training_catalog_read on public.training_course_catalog;
create policy training_catalog_read on public.training_course_catalog for select to authenticated using (enabled_in_lms);
drop policy if exists training_catalog_write on public.training_course_catalog;
create policy training_catalog_write on public.training_course_catalog for all to authenticated
using ((owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (owner_ente_id is not null and public.platform_has_role(owner_ente_id,array['super_admin','organization_admin','training_manager'])))
with check ((owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (owner_ente_id is not null and public.platform_has_role(owner_ente_id,array['super_admin','organization_admin','training_manager'])));

drop policy if exists learning_units_read on public.training_learning_units;
create policy learning_units_read on public.training_learning_units for select to authenticated using (active);
drop policy if exists learning_units_write on public.training_learning_units;
create policy learning_units_write on public.training_learning_units for all to authenticated
using ((owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (owner_ente_id is not null and public.platform_has_role(owner_ente_id,array['super_admin','organization_admin','training_manager'])))
with check ((owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (owner_ente_id is not null and public.platform_has_role(owner_ente_id,array['super_admin','organization_admin','training_manager'])));

-- Tabelle di struttura contenuto: lettura autenticata, scrittura ai content admin.
-- La policy globale è volutamente prudente: per contenuti condivisi richiede super_admin.
do $$
declare t text;
begin
  foreach t in array array['training_course_versions','training_learning_unit_versions','training_course_modules','training_course_module_units','training_risk_catalog','training_ateco_profiles','training_question_assignments','training_test_templates','training_test_items'] loop
    execute format('drop policy if exists %I_read on public.%I',t,t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)',t,t);
    execute format('drop policy if exists %I_write on public.%I',t,t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.platform_has_any_role(array[''super_admin''])) with check (public.platform_has_any_role(array[''super_admin'']))',t,t);
  end loop;
end $$;

-- Mansioni/rischi aziendali.
drop policy if exists job_profiles_access on public.training_job_profiles;
create policy job_profiles_access on public.training_job_profiles for all to authenticated
using (public.platform_can_access_context(ente_id,azienda_id))
with check (public.platform_can_access_context(ente_id,azienda_id));
drop policy if exists job_profile_risks_access on public.training_job_profile_risks;
create policy job_profile_risks_access on public.training_job_profile_risks for all to authenticated
using (exists(select 1 from public.training_job_profiles j where j.id=job_profile_id and public.platform_can_access_context(j.ente_id,j.azienda_id)))
with check (exists(select 1 from public.training_job_profiles j where j.id=job_profile_id and public.platform_can_access_context(j.ente_id,j.azienda_id)));

-- Edizioni: staff nel perimetro. Il corsista le vede attraverso la propria iscrizione.
drop policy if exists editions_read on public.training_editions;
create policy editions_read on public.training_editions for select to authenticated
using (
  public.platform_can_access_context(ente_id,azienda_id)
  or exists(
    select 1 from public.training_enrollments e
    where e.edition_id=id and public.platform_is_corsista(e.corsista_id)
  )
);
drop policy if exists editions_write on public.training_editions;
create policy editions_write on public.training_editions for all to authenticated
using (public.platform_has_role(ente_id,array['super_admin','organization_admin','training_manager']))
with check (public.platform_has_role(ente_id,array['super_admin','organization_admin','training_manager']));

drop policy if exists enrollments_read on public.training_enrollments;
create policy enrollments_read on public.training_enrollments for select to authenticated
using (
  public.platform_is_corsista(corsista_id)
  or exists(select 1 from public.training_editions d where d.id=edition_id and public.platform_can_access_context(d.ente_id,d.azienda_id))
);
drop policy if exists enrollments_write on public.training_enrollments;
create policy enrollments_write on public.training_enrollments for all to authenticated
using (exists(select 1 from public.training_editions d where d.id=edition_id and public.platform_has_role(d.ente_id,array['super_admin','organization_admin','training_manager'])))
with check (exists(select 1 from public.training_editions d where d.id=edition_id and public.platform_has_role(d.ente_id,array['super_admin','organization_admin','training_manager'])));

-- Tracking: il corsista può operare solo sulle proprie iscrizioni; staff legge/gestisce il perimetro.
do $$
declare t text;
begin
  foreach t in array array['training_learning_sessions','training_learning_events','training_unit_progress'] loop
    execute format('drop policy if exists %I_access on public.%I',t,t);
  end loop;
end $$;
create policy training_learning_sessions_access on public.training_learning_sessions for all to authenticated
using (public.platform_can_use_enrollment(enrollment_id)) with check (public.platform_can_use_enrollment(enrollment_id));
create policy training_learning_events_access on public.training_learning_events for all to authenticated
using (public.platform_can_use_enrollment(enrollment_id)) with check (public.platform_can_use_enrollment(enrollment_id));
create policy training_unit_progress_access on public.training_unit_progress for all to authenticated
using (public.platform_can_use_enrollment(enrollment_id)) with check (public.platform_can_use_enrollment(enrollment_id));
create policy training_question_responses_read on public.training_question_responses for select to authenticated
using (public.platform_can_use_enrollment(enrollment_id));
drop policy if exists training_test_attempts_read on public.training_test_attempts;
create policy training_test_attempts_read on public.training_test_attempts for select to authenticated
using (public.platform_can_use_enrollment(enrollment_id));
drop policy if exists training_test_attempts_manage on public.training_test_attempts;
create policy training_test_attempts_manage on public.training_test_attempts for all to authenticated
using (public.platform_has_any_role(array['super_admin','organization_admin','training_manager','teacher']))
with check (public.platform_has_any_role(array['super_admin','organization_admin','training_manager','teacher']));
drop policy if exists training_test_answers_read on public.training_test_answers;
create policy training_test_answers_read on public.training_test_answers for select to authenticated
using (exists(select 1 from public.training_test_attempts a where a.id=attempt_id and public.platform_can_use_enrollment(a.enrollment_id)));
drop policy if exists training_test_answers_manage on public.training_test_answers;
create policy training_test_answers_manage on public.training_test_answers for all to authenticated
using (public.platform_has_any_role(array['super_admin','organization_admin','training_manager','teacher']))
with check (public.platform_has_any_role(array['super_admin','organization_admin','training_manager','teacher']));

-- Domande visibili, chiavi corrette protette.
drop policy if exists questions_read on public.training_questions;
create policy questions_read on public.training_questions for select to authenticated using (active);
drop policy if exists questions_write on public.training_questions;
create policy questions_write on public.training_questions for all to authenticated
using ((owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (owner_ente_id is not null and public.platform_has_role(owner_ente_id,array['super_admin','organization_admin','training_manager'])))
with check ((owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (owner_ente_id is not null and public.platform_has_role(owner_ente_id,array['super_admin','organization_admin','training_manager'])));
drop policy if exists question_keys_manage on public.training_question_keys;
create policy question_keys_manage on public.training_question_keys for all to authenticated
using (exists(select 1 from public.training_questions q where q.id=question_id and ((q.owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (q.owner_ente_id is not null and public.platform_has_role(q.owner_ente_id,array['super_admin','organization_admin','training_manager','teacher'])))))
with check (exists(select 1 from public.training_questions q where q.id=question_id and ((q.owner_ente_id is null and public.platform_has_any_role(array['super_admin'])) or (q.owner_ente_id is not null and public.platform_has_role(q.owner_ente_id,array['super_admin','organization_admin','training_manager','teacher'])))));

-- Permesso RPC al ruolo autenticato; la funzione esegue il proprio controllo applicativo.
grant execute on function public.training_record_event(uuid,uuid,uuid,text,integer,jsonb) to authenticated;
grant execute on function public.training_submit_comprehension_answer(uuid,uuid,uuid,jsonb) to authenticated;
grant execute on function public.training_try_complete_unit(uuid,uuid) to authenticated;
grant execute on function public.training_start_test(uuid,uuid) to authenticated;
grant execute on function public.training_submit_test_answer(uuid,uuid,jsonb) to authenticated;
grant execute on function public.training_finish_test(uuid) to authenticated;

comment on table public.training_editions is 'Edizioni LMS. Possono essere percorsi didattici interni senza progetto/certificazione SafetyManager.';
comment on table public.training_learning_events is 'Audit didattico: eventi di fruizione e heartbeat. Non equivale automaticamente a certificazione normativa.';
comment on table public.training_question_keys is 'Answer key separata: non deve essere leggibile dal client corsista.';
