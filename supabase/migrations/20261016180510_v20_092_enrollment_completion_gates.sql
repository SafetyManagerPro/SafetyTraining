create table public.enrollment_requirement_evidence (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  requirement_kind text not null check (requirement_kind in ('practical','verification')),
  practical_requirement_id uuid references public.course_practical_requirements(id) on delete cascade,
  verification_requirement_id uuid references public.course_verification_requirements(id) on delete cascade,
  requirement_key text not null,
  status text not null default 'pending' check (status in ('pending','completed','failed','revoked')),
  completion_mode text not null default 'external' check (completion_mode in ('platform','external')),
  completed_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollment_requirement_evidence_kind_target_check check (
    (requirement_kind='practical' and practical_requirement_id is not null and verification_requirement_id is null)
    or (requirement_kind='verification' and verification_requirement_id is not null and practical_requirement_id is null)
  ),
  constraint enrollment_requirement_evidence_unique unique(enrollment_id,requirement_kind,requirement_key)
);
create index enrollment_requirement_evidence_enrollment_idx on public.enrollment_requirement_evidence(enrollment_id);
create index enrollment_requirement_evidence_practical_idx on public.enrollment_requirement_evidence(practical_requirement_id) where practical_requirement_id is not null;
create index enrollment_requirement_evidence_verification_idx on public.enrollment_requirement_evidence(verification_requirement_id) where verification_requirement_id is not null;
alter table public.enrollment_requirement_evidence enable row level security;
create policy enrollment_requirement_evidence_read on public.enrollment_requirement_evidence for select to authenticated using (private.can_use_enrollment(enrollment_id));
create policy enrollment_requirement_evidence_staff_manage on public.enrollment_requirement_evidence for all to authenticated
using (exists(select 1 from public.enrollments e join public.course_editions d on d.id=e.edition_id where e.id=enrollment_requirement_evidence.enrollment_id and private.can_access_company(d.organization_id,d.company_id)))
with check (exists(select 1 from public.enrollments e join public.course_editions d on d.id=e.edition_id where e.id=enrollment_requirement_evidence.enrollment_id and private.can_access_company(d.organization_id,d.company_id)));
create trigger enrollment_requirement_evidence_touch before update on public.enrollment_requirement_evidence for each row execute function public.touch_updated_at();

create or replace function private.recalculate_enrollment_progress(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_course_version_id uuid;
  v_course_id uuid;
  v_total integer := 0;
  v_done integer := 0;
  v_pct numeric(5,2) := 0;
  v_practical_required integer := 0;
  v_practical_done integer := 0;
  v_verification_required integer := 0;
  v_verification_done integer := 0;
  v_all_gates boolean := false;
  v_has_activity boolean := false;
begin
  select d.course_version_id,cv.course_id into v_course_version_id,v_course_id
  from public.enrollments e
  join public.course_editions d on d.id=e.edition_id
  join public.course_versions cv on cv.id=d.course_version_id
  where e.id=p_enrollment_id;
  if v_course_version_id is null then return; end if;

  select count(distinct mu.unit_version_id) into v_total
  from public.course_modules m join public.course_module_units mu on mu.module_id=m.id
  where m.course_version_id=v_course_version_id and mu.required;

  if v_total>0 then
    select count(*) into v_done
    from (
      select distinct mu.unit_version_id
      from public.course_modules m join public.course_module_units mu on mu.module_id=m.id
      where m.course_version_id=v_course_version_id and mu.required
    ) req
    join public.learning_progress lp on lp.enrollment_id=p_enrollment_id and lp.unit_version_id=req.unit_version_id and lp.status='completed';
    v_pct:=round((v_done::numeric*100.0)/v_total::numeric,2);
  else
    v_pct:=100;
  end if;

  select count(*) into v_practical_required from public.course_practical_requirements r where r.course_id=v_course_id and r.required;
  select count(*) into v_practical_done from public.course_practical_requirements r
  where r.course_id=v_course_id and r.required
    and exists(select 1 from public.enrollment_requirement_evidence e where e.enrollment_id=p_enrollment_id and e.requirement_kind='practical' and e.practical_requirement_id=r.id and e.status='completed');

  select count(*) into v_verification_required from public.course_verification_requirements r where r.course_version_id=v_course_version_id and r.required;
  select count(*) into v_verification_done from public.course_verification_requirements r
  where r.course_version_id=v_course_version_id and r.required
    and exists(select 1 from public.enrollment_requirement_evidence e where e.enrollment_id=p_enrollment_id and e.requirement_kind='verification' and e.verification_requirement_id=r.id and e.status='completed');

  v_all_gates:=(v_practical_done=v_practical_required and v_verification_done=v_verification_required);
  select exists(select 1 from public.learning_progress lp where lp.enrollment_id=p_enrollment_id and lp.status<>'not_started')
      or exists(select 1 from public.enrollment_requirement_evidence e where e.enrollment_id=p_enrollment_id)
    into v_has_activity;

  update public.enrollments
     set progress_pct=v_pct,
         status=case
           when status='revoked' then status
           when v_pct>=100 and v_all_gates then 'completed'
           when v_pct>0 or v_has_activity then 'in_progress'
           else 'not_started'
         end,
         completed_at=case
           when status='revoked' then completed_at
           when v_pct>=100 and v_all_gates then coalesce(completed_at,now())
           else null
         end,
         metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('completion_gate',jsonb_build_object(
           'content_complete',v_pct>=100,'content_progress_pct',v_pct,
           'practical_required',v_practical_required,'practical_completed',v_practical_done,
           'verification_required',v_verification_required,'verification_completed',v_verification_done,
           'all_requirements_complete',v_all_gates,'completion_ready',(v_pct>=100 and v_all_gates),'evaluated_at',now()
         )),updated_at=now()
   where id=p_enrollment_id;
end;
$$;

create or replace function private.sync_requirement_evidence_progress()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
begin
  if tg_op='DELETE' then
    perform private.recalculate_enrollment_progress(old.enrollment_id);
    return old;
  else
    perform private.recalculate_enrollment_progress(new.enrollment_id);
    return new;
  end if;
end;
$$;
create trigger enrollment_requirement_evidence_recalc after insert or update or delete on public.enrollment_requirement_evidence for each row execute function private.sync_requirement_evidence_progress();

create or replace function private.sync_test_attempt_score()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_test_id uuid;
  v_enrollment_id uuid;
  v_course_version_id uuid;
  v_total_questions integer;
  v_answered integer;
  v_total_points numeric;
  v_awarded numeric;
  v_score numeric(5,2);
  v_passing numeric;
  v_test_key text;
  v_requirement_key text;
  v_verification_requirement_id uuid;
begin
  select a.test_id,a.enrollment_id into v_test_id,v_enrollment_id from public.test_attempts a where a.id=new.test_attempt_id;
  select count(*),coalesce(sum(points),0) into v_total_questions,v_total_points from public.test_questions where test_id=v_test_id;
  select count(*),coalesce(sum(points_awarded),0) into v_answered,v_awarded from public.test_answers where test_attempt_id=new.test_attempt_id;

  if v_total_questions>0 and v_answered=v_total_questions then
    select t.passing_score_pct,t.course_version_id,t.test_key,t.metadata->>'requirement_key'
      into v_passing,v_course_version_id,v_test_key,v_requirement_key
    from public.tests t where t.id=v_test_id;
    v_score:=round(case when v_total_points>0 then (v_awarded*100.0/v_total_points) else 0 end,2);

    update public.test_attempts
       set score_pct=v_score,passed=(v_score>=v_passing),completed_at=coalesce(completed_at,now()),
           metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('graded_by','database','graded_at',now())
     where id=new.test_attempt_id;

    select r.id into v_verification_requirement_id
    from public.course_verification_requirements r
    where r.course_version_id=v_course_version_id and r.requirement_key=v_requirement_key and r.required limit 1;

    if v_verification_requirement_id is not null then
      insert into public.enrollment_requirement_evidence(enrollment_id,requirement_kind,verification_requirement_id,requirement_key,status,completion_mode,completed_at,evidence,recorded_by)
      values(v_enrollment_id,'verification',v_verification_requirement_id,v_requirement_key,case when v_score>=v_passing then 'completed' else 'failed' end,'platform',case when v_score>=v_passing then now() else null end,
             jsonb_build_object('test_id',v_test_id,'test_attempt_id',new.test_attempt_id,'score_pct',v_score,'passing_score_pct',v_passing,'test_key',v_test_key),auth.uid())
      on conflict (enrollment_id,requirement_kind,requirement_key) do update
        set verification_requirement_id=excluded.verification_requirement_id,status=excluded.status,completion_mode='platform',completed_at=excluded.completed_at,
            evidence=excluded.evidence,recorded_by=excluded.recorded_by,updated_at=now();
    else
      perform private.recalculate_enrollment_progress(v_enrollment_id);
    end if;

    if v_test_key like 'final-%' or v_requirement_key='internal_final_check' then
      update public.enrollments set final_score_pct=v_score,updated_at=now() where id=v_enrollment_id;
    end if;
  end if;
  return new;
end;
$$;

do $$ declare tbl int; trg int; pol int; begin
 select count(*) into tbl from information_schema.tables where table_schema='public' and table_name='enrollment_requirement_evidence';
 select count(*) into trg from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='enrollment_requirement_evidence' and t.tgname in ('enrollment_requirement_evidence_touch','enrollment_requirement_evidence_recalc') and not t.tgisinternal;
 select count(*) into pol from pg_policies where schemaname='public' and tablename='enrollment_requirement_evidence';
 if tbl<>1 or trg<>2 or pol<>2 then raise exception 'completion gate model incomplete table %, triggers %, policies %',tbl,trg,pol; end if;
 if (select count(*) from public.enrollments)<>0 then raise exception 'expected zero live enrollments during completion gate cutover'; end if;
end $$;