create or replace function private.prepare_test_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_test_course_version uuid;
  v_enrollment_course_version uuid;
  v_active boolean;
  v_max_attempts integer;
  v_existing integer;
begin
  select t.course_version_id,t.active,t.max_attempts
    into v_test_course_version,v_active,v_max_attempts
  from public.tests t
  where t.id=new.test_id;

  if v_test_course_version is null then raise exception 'test not found'; end if;
  if not v_active then raise exception 'test is not active'; end if;

  select d.course_version_id into v_enrollment_course_version
  from public.enrollments e join public.course_editions d on d.id=e.edition_id
  where e.id=new.enrollment_id;

  if v_enrollment_course_version is null then raise exception 'enrollment not found'; end if;
  if v_enrollment_course_version<>v_test_course_version then raise exception 'test does not belong to assigned course version'; end if;
  if exists(select 1 from public.test_attempts a where a.enrollment_id=new.enrollment_id and a.test_id=new.test_id and a.completed_at is null) then
    raise exception 'an incomplete test attempt already exists';
  end if;

  select count(*) into v_existing from public.test_attempts a where a.enrollment_id=new.enrollment_id and a.test_id=new.test_id;
  if v_max_attempts is not null and v_existing>=v_max_attempts then raise exception 'maximum test attempts reached'; end if;

  new.attempt_no:=v_existing+1;
  new.started_at:=now();
  new.completed_at:=null;
  new.score_pct:=null;
  new.passed:=null;
  new.metadata:=coalesce(new.metadata,'{}'::jsonb)||jsonb_build_object('secure_grading',true,'course_version_id',v_test_course_version);
  return new;
end;
$$;

create or replace function private.grade_test_answer()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_test_id uuid;
  v_completed_at timestamptz;
  v_points numeric;
  v_key jsonb;
begin
  select a.test_id,a.completed_at into v_test_id,v_completed_at
  from public.test_attempts a where a.id=new.test_attempt_id;
  if v_test_id is null then raise exception 'test attempt not found'; end if;
  if v_completed_at is not null then raise exception 'test attempt already completed'; end if;

  select tq.points,k.answer_key into v_points,v_key
  from public.test_questions tq
  join public.question_answer_keys k on k.question_id=tq.question_id
  where tq.test_id=v_test_id and tq.question_id=new.question_id;
  if v_key is null then raise exception 'question is not gradable for this test'; end if;

  new.is_correct:=(coalesce(new.answer,'{}'::jsonb)=coalesce(v_key->'correct_answer','{}'::jsonb));
  new.points_awarded:=case when new.is_correct then coalesce(v_points,1) else 0 end;
  new.answered_at:=now();
  return new;
end;
$$;

create or replace function private.sync_test_attempt_score()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_test_id uuid;
  v_total_questions integer;
  v_answered integer;
  v_total_points numeric;
  v_awarded numeric;
  v_score numeric(5,2);
  v_passing numeric;
begin
  select a.test_id into v_test_id from public.test_attempts a where a.id=new.test_attempt_id;
  select count(*),coalesce(sum(points),0) into v_total_questions,v_total_points from public.test_questions where test_id=v_test_id;
  select count(*),coalesce(sum(points_awarded),0) into v_answered,v_awarded from public.test_answers where test_attempt_id=new.test_attempt_id;

  if v_total_questions>0 and v_answered=v_total_questions then
    select passing_score_pct into v_passing from public.tests where id=v_test_id;
    v_score:=round(case when v_total_points>0 then (v_awarded*100.0/v_total_points) else 0 end,2);
    update public.test_attempts
       set score_pct=v_score,
           passed=(v_score>=v_passing),
           completed_at=coalesce(completed_at,now()),
           metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('graded_by','database','graded_at',now())
     where id=new.test_attempt_id;
  end if;
  return new;
end;
$$;

drop trigger if exists test_attempts_secure_prepare on public.test_attempts;
create trigger test_attempts_secure_prepare before insert on public.test_attempts for each row execute function private.prepare_test_attempt();
drop trigger if exists test_answers_secure_grade on public.test_answers;
create trigger test_answers_secure_grade before insert on public.test_answers for each row execute function private.grade_test_answer();
drop trigger if exists test_answers_sync_score on public.test_answers;
create trigger test_answers_sync_score after insert on public.test_answers for each row execute function private.sync_test_attempt_score();

drop policy if exists test_attempts_update on public.test_attempts;
drop policy if exists test_attempts_staff_update on public.test_attempts;
create policy test_attempts_staff_update on public.test_attempts for update to authenticated
using (exists(select 1 from public.enrollments e join public.course_editions d on d.id=e.edition_id where e.id=test_attempts.enrollment_id and private.can_access_company(d.organization_id,d.company_id)))
with check (exists(select 1 from public.enrollments e join public.course_editions d on d.id=e.edition_id where e.id=test_attempts.enrollment_id and private.can_access_company(d.organization_id,d.company_id)));

do $$ declare a int; q int; begin
  select count(*) into a from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='test_attempts' and t.tgname='test_attempts_secure_prepare' and not t.tgisinternal;
  select count(*) into q from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='test_answers' and t.tgname in ('test_answers_secure_grade','test_answers_sync_score') and not t.tgisinternal;
  if a<>1 or q<>2 then raise exception 'secure test triggers incomplete: attempts %, answers %',a,q; end if;
  if exists(select 1 from pg_policies where schemaname='public' and tablename='test_attempts' and policyname='test_attempts_update') then raise exception 'learner test_attempts_update policy still present'; end if;
end $$;