-- Derive credited active time from server time rather than trusting a browser counter.
create or replace function private.normalize_learning_event_time()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_session public.learning_sessions%rowtype;
  v_elapsed integer;
  v_credit integer := 0;
begin
  new.occurred_at := now();

  if new.event_type <> 'heartbeat' then
    new.active_delta_seconds := 0;
    return new;
  end if;

  if new.session_id is null then
    raise exception 'heartbeat requires session_id';
  end if;

  select * into v_session
  from public.learning_sessions
  where id = new.session_id
  for update;

  if not found or v_session.enrollment_id <> new.enrollment_id then
    raise exception 'invalid learning session';
  end if;

  if v_session.ended_at is not null then
    raise exception 'learning session already ended';
  end if;

  v_elapsed := greatest(
    0,
    floor(extract(epoch from (now() - coalesce(v_session.last_heartbeat_at, v_session.started_at))))::integer
  );

  -- Normal heartbeat is 30 s. Allow modest jitter, but never credit time
  -- that has not actually elapsed on the server.
  v_credit := least(greatest(coalesce(new.active_delta_seconds, 0), 0), v_elapsed, 90);
  new.active_delta_seconds := v_credit;

  update public.learning_sessions
     set last_heartbeat_at = now(),
         active_seconds = active_seconds + v_credit
   where id = v_session.id;

  update public.enrollments
     set active_seconds = active_seconds + v_credit,
         last_activity_at = now(),
         started_at = coalesce(started_at, now()),
         status = case when status = 'not_started' then 'in_progress' else status end,
         updated_at = now()
   where id = new.enrollment_id;

  return new;
end;
$$;

revoke all on function private.normalize_learning_event_time() from public, anon, authenticated;

create trigger learning_events_normalize_active_time
before insert on public.learning_events
for each row execute function private.normalize_learning_event_time();

alter table public.learning_events
  drop constraint if exists learning_events_active_delta_seconds_check;
alter table public.learning_events
  add constraint learning_events_active_delta_seconds_check
  check (active_delta_seconds between 0 and 90);
