-- SafetyTraining v20.014
-- Self-service learner account claim by verified email + server-side unit/enrollment progress.

create unique index if not exists learners_unique_active_email_per_org
on public.learners (organization_id, lower(btrim(email)))
where email is not null and active;

create or replace function public.claim_learner_account()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_candidate uuid;
  v_count integer;
begin
  if v_uid is null then
    return null;
  end if;

  select u.email, u.email_confirmed_at
    into v_email, v_confirmed
  from auth.users u
  where u.id = v_uid;

  if v_email is null or v_confirmed is null then
    return null;
  end if;

  select count(*), min(l.id)
    into v_count, v_candidate
  from public.learners l
  where l.active
    and l.auth_user_id is null
    and l.email is not null
    and lower(btrim(l.email)) = lower(btrim(v_email));

  if v_count <> 1 or v_candidate is null then
    return null;
  end if;

  update public.learners
     set auth_user_id = v_uid,
         updated_at = now()
   where id = v_candidate
     and auth_user_id is null
  returning id into v_candidate;

  return v_candidate;
end;
$$;

revoke all on function public.claim_learner_account() from public, anon;
grant execute on function public.claim_learner_account() to authenticated, service_role;

create or replace function private.recalculate_enrollment_progress(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_course_version_id uuid;
  v_total integer := 0;
  v_done integer := 0;
  v_pct numeric(5,2) := 0;
begin
  select d.course_version_id
    into v_course_version_id
  from public.enrollments e
  join public.course_editions d on d.id = e.edition_id
  where e.id = p_enrollment_id;

  if v_course_version_id is null then
    return;
  end if;

  select count(distinct mu.unit_version_id)
    into v_total
  from public.course_modules m
  join public.course_module_units mu on mu.module_id = m.id
  where m.course_version_id = v_course_version_id
    and mu.required;

  if v_total > 0 then
    select count(*)
      into v_done
    from (
      select distinct mu.unit_version_id
      from public.course_modules m
      join public.course_module_units mu on mu.module_id = m.id
      where m.course_version_id = v_course_version_id
        and mu.required
    ) req
    join public.learning_progress lp
      on lp.enrollment_id = p_enrollment_id
     and lp.unit_version_id = req.unit_version_id
     and lp.status = 'completed';

    v_pct := round((v_done::numeric * 100.0) / v_total::numeric, 2);
  end if;

  update public.enrollments
     set progress_pct = v_pct,
         status = case
           when status = 'revoked' then status
           when v_pct >= 100 then 'completed'
           when v_pct > 0 and status = 'not_started' then 'in_progress'
           else status
         end,
         completed_at = case
           when v_pct >= 100 then coalesce(completed_at, now())
           else completed_at
         end,
         updated_at = now()
   where id = p_enrollment_id;
end;
$$;

revoke all on function private.recalculate_enrollment_progress(uuid) from public, anon, authenticated;

create or replace function private.sync_learning_event_progress()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_rule_count integer := 0;
  v_min_active integer := 0;
  v_requires_comprehension boolean := false;
  v_progress public.learning_progress%rowtype;
begin
  if new.unit_version_id is null then
    return new;
  end if;

  insert into public.learning_progress (
    enrollment_id,
    unit_version_id,
    status,
    active_seconds,
    content_viewed,
    comprehension_passed,
    started_at,
    updated_at
  ) values (
    new.enrollment_id,
    new.unit_version_id,
    'in_progress',
    greatest(coalesce(new.active_delta_seconds, 0), 0),
    new.event_type = 'content_viewed',
    false,
    now(),
    now()
  )
  on conflict (enrollment_id, unit_version_id) do update
    set active_seconds = public.learning_progress.active_seconds + greatest(excluded.active_seconds, 0),
        content_viewed = public.learning_progress.content_viewed or excluded.content_viewed,
        status = case when public.learning_progress.status = 'not_started' then 'in_progress' else public.learning_progress.status end,
        started_at = coalesce(public.learning_progress.started_at, excluded.started_at),
        updated_at = now();

  select count(*),
         coalesce(max(mu.min_active_seconds), 0),
         coalesce(bool_or(mu.requires_comprehension), false)
    into v_rule_count, v_min_active, v_requires_comprehension
  from public.enrollments e
  join public.course_editions d on d.id = e.edition_id
  join public.course_modules m on m.course_version_id = d.course_version_id
  join public.course_module_units mu
    on mu.module_id = m.id
   and mu.unit_version_id = new.unit_version_id
  where e.id = new.enrollment_id
    and mu.required;

  select *
    into v_progress
  from public.learning_progress
  where enrollment_id = new.enrollment_id
    and unit_version_id = new.unit_version_id;

  if v_rule_count > 0
     and v_progress.content_viewed
     and v_progress.active_seconds >= v_min_active
     and (not v_requires_comprehension or v_progress.comprehension_passed) then
    update public.learning_progress
       set status = 'completed',
           completed_at = coalesce(completed_at, now()),
           updated_at = now()
     where enrollment_id = new.enrollment_id
       and unit_version_id = new.unit_version_id;
  end if;

  perform private.recalculate_enrollment_progress(new.enrollment_id);
  return new;
end;
$$;

revoke all on function private.sync_learning_event_progress() from public, anon, authenticated;

drop trigger if exists learning_events_sync_progress on public.learning_events;
create trigger learning_events_sync_progress
after insert on public.learning_events
for each row execute function private.sync_learning_event_progress();
