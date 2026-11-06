create or replace function private.validate_requirement_evidence_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_version_id uuid;
  v_course_id uuid;
  v_requirement_id uuid;
  v_requirement_completion_mode text;
  v_selected_mode text;
  v_attempt_completed_at timestamptz;
  v_attempt_passed boolean;
begin
  if tg_op='UPDATE' and (
    new.enrollment_id is distinct from old.enrollment_id or
    new.requirement_kind is distinct from old.requirement_kind or
    new.requirement_key is distinct from old.requirement_key
  ) then
    raise exception 'requirement_evidence_binding_is_immutable' using errcode='22023';
  end if;

  select d.course_version_id,cv.course_id
    into v_course_version_id,v_course_id
  from public.enrollments e
  join public.course_editions d on d.id=e.edition_id
  join public.course_versions cv on cv.id=d.course_version_id
  where e.id=new.enrollment_id;

  if v_course_version_id is null then
    raise exception 'enrollment_not_found' using errcode='23503';
  end if;

  if new.requirement_kind='practical' then
    select r.id,r.completion_mode
      into v_requirement_id,v_requirement_completion_mode
    from public.course_practical_requirements r
    where r.course_id=v_course_id
      and r.requirement_key=new.requirement_key
      and r.required
    limit 1;

    if v_requirement_id is null then
      raise exception 'practical_requirement_not_bound_to_enrollment' using errcode='22023';
    end if;

    new.practical_requirement_id:=v_requirement_id;
    new.verification_requirement_id:=null;
    if new.completion_mode<>'external' then
      raise exception 'practical_requirement_requires_external_evidence' using errcode='22023';
    end if;

  elsif new.requirement_kind='verification' then
    select r.id,r.completion_mode,r.selected_mode
      into v_requirement_id,v_requirement_completion_mode,v_selected_mode
    from public.course_verification_requirements r
    where r.course_version_id=v_course_version_id
      and r.requirement_key=new.requirement_key
      and r.required
    limit 1;

    if v_requirement_id is null then
      raise exception 'verification_requirement_not_bound_to_enrollment' using errcode='22023';
    end if;

    new.verification_requirement_id:=v_requirement_id;
    new.practical_requirement_id:=null;

    if new.completion_mode='platform' then
      if v_selected_mode is distinct from 'test' or v_requirement_completion_mode not in ('platform','platform_or_external') then
        raise exception 'verification_requirement_not_platform_managed' using errcode='22023';
      end if;

      select ta.completed_at,ta.passed
        into v_attempt_completed_at,v_attempt_passed
      from public.test_attempts ta
      join public.tests t on t.id=ta.test_id
      where ta.enrollment_id=new.enrollment_id
        and ta.id::text=coalesce(new.evidence->>'test_attempt_id','')
        and t.course_version_id=v_course_version_id
        and t.metadata->>'requirement_key'=new.requirement_key
      limit 1;

      if v_attempt_completed_at is null then
        raise exception 'platform_evidence_requires_completed_test_attempt' using errcode='22023';
      end if;
      if new.status='completed' and v_attempt_passed is distinct from true then
        raise exception 'platform_evidence_pass_status_mismatch' using errcode='22023';
      end if;
      if new.status='failed' and v_attempt_passed is distinct from false then
        raise exception 'platform_evidence_fail_status_mismatch' using errcode='22023';
      end if;
      new.completed_at:=case when new.status='completed' then v_attempt_completed_at else null end;

    elsif new.completion_mode='external' then
      if v_requirement_completion_mode='platform'
         or (v_selected_mode='test' and v_requirement_completion_mode='platform_or_external') then
        raise exception 'platform_managed_verification_cannot_be_completed_manually' using errcode='22023';
      end if;
    else
      raise exception 'invalid_evidence_completion_mode' using errcode='22023';
    end if;
  else
    raise exception 'invalid_requirement_kind' using errcode='22023';
  end if;

  if auth.uid() is not null then
    new.recorded_by:=auth.uid();
  end if;

  return new;
end;
$$;

revoke all on function private.validate_requirement_evidence_context() from public, anon, authenticated;

drop trigger if exists enrollment_requirement_evidence_context_guard on public.enrollment_requirement_evidence;
create trigger enrollment_requirement_evidence_context_guard
before insert or update on public.enrollment_requirement_evidence
for each row execute function private.validate_requirement_evidence_context();

create or replace function public.admin_set_requirement_evidence(
  p_enrollment_id uuid,
  p_requirement_kind text,
  p_requirement_key text,
  p_status text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_company uuid;
  v_course_version_id uuid;
  v_course_id uuid;
  v_requirement_id uuid;
  v_requirement_completion_mode text;
  v_selected_mode text;
  v_existing public.enrollment_requirement_evidence%rowtype;
  v_saved public.enrollment_requirement_evidence%rowtype;
  v_enrollment public.enrollments%rowtype;
  v_action text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if p_requirement_kind not in ('practical','verification') then
    raise exception 'invalid_requirement_kind' using errcode='22023';
  end if;
  if nullif(btrim(p_requirement_key),'') is null then
    raise exception 'requirement_key_required' using errcode='22023';
  end if;
  if p_status not in ('completed','failed','revoked') then
    raise exception 'invalid_manual_evidence_status' using errcode='22023';
  end if;

  select d.organization_id,d.company_id,d.course_version_id,cv.course_id
    into v_org,v_company,v_course_version_id,v_course_id
  from public.enrollments e
  join public.course_editions d on d.id=e.edition_id
  join public.course_versions cv on cv.id=d.course_version_id
  where e.id=p_enrollment_id
  for update of e;

  if v_org is null then
    raise exception 'enrollment_not_found' using errcode='P0002';
  end if;
  if not private.can_access_company(v_org,v_company) then
    raise exception 'staff_access_required' using errcode='42501';
  end if;

  if p_requirement_kind='practical' then
    select r.id,r.completion_mode
      into v_requirement_id,v_requirement_completion_mode
    from public.course_practical_requirements r
    where r.course_id=v_course_id
      and r.requirement_key=btrim(p_requirement_key)
      and r.required
    limit 1;
  else
    select r.id,r.completion_mode,r.selected_mode
      into v_requirement_id,v_requirement_completion_mode,v_selected_mode
    from public.course_verification_requirements r
    where r.course_version_id=v_course_version_id
      and r.requirement_key=btrim(p_requirement_key)
      and r.required
    limit 1;
  end if;

  if v_requirement_id is null then
    raise exception 'requirement_not_bound_to_enrollment' using errcode='22023';
  end if;

  if p_requirement_kind='verification'
     and (v_requirement_completion_mode='platform'
          or (v_selected_mode='test' and v_requirement_completion_mode='platform_or_external')) then
    raise exception 'platform_managed_verification_cannot_be_completed_manually' using errcode='22023';
  end if;

  select * into v_existing
  from public.enrollment_requirement_evidence e
  where e.enrollment_id=p_enrollment_id
    and e.requirement_kind=p_requirement_kind
    and e.requirement_key=btrim(p_requirement_key)
  for update;

  if p_status='revoked' and v_existing.id is null then
    raise exception 'requirement_evidence_not_found' using errcode='P0002';
  end if;

  if p_status='revoked' then
    update public.enrollment_requirement_evidence
       set status='revoked',
           completion_mode='external',
           completed_at=null,
           evidence=jsonb_build_object(
             'note',coalesce(nullif(btrim(p_note),''),'Evidenza revocata da amministrazione'),
             'source','admin_requirement_rpc_v21'
           ),
           recorded_by=auth.uid()
     where id=v_existing.id
     returning * into v_saved;
    v_action:='requirement_evidence.revoke';
  else
    insert into public.enrollment_requirement_evidence(
      enrollment_id,requirement_kind,practical_requirement_id,verification_requirement_id,
      requirement_key,status,completion_mode,completed_at,evidence,recorded_by
    ) values(
      p_enrollment_id,p_requirement_kind,
      case when p_requirement_kind='practical' then v_requirement_id else null end,
      case when p_requirement_kind='verification' then v_requirement_id else null end,
      btrim(p_requirement_key),p_status,'external',
      case when p_status='completed' then now() else null end,
      jsonb_build_object('note',nullif(btrim(p_note),''),'source','admin_requirement_rpc_v21'),auth.uid()
    )
    on conflict (enrollment_id,requirement_kind,requirement_key) do update
      set practical_requirement_id=excluded.practical_requirement_id,
          verification_requirement_id=excluded.verification_requirement_id,
          status=excluded.status,
          completion_mode='external',
          completed_at=excluded.completed_at,
          evidence=excluded.evidence,
          recorded_by=excluded.recorded_by,
          updated_at=now()
    returning * into v_saved;
    v_action:=case when p_status='completed' then 'requirement_evidence.complete' else 'requirement_evidence.fail' end;
  end if;

  select * into v_enrollment from public.enrollments where id=p_enrollment_id;

  insert into private.admin_audit_log(
    actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state,context
  ) values(
    auth.uid(),v_action,'enrollment_requirement_evidence',v_saved.id,v_org,
    case when v_existing.id is null then null else to_jsonb(v_existing) end,
    to_jsonb(v_saved),
    jsonb_build_object(
      'enrollment_id',p_enrollment_id,
      'requirement_kind',p_requirement_kind,
      'requirement_key',btrim(p_requirement_key)
    )
  );

  return jsonb_build_object(
    'evidence_id',v_saved.id,
    'status',v_saved.status,
    'enrollment_id',p_enrollment_id,
    'enrollment_status',v_enrollment.status,
    'progress_pct',v_enrollment.progress_pct,
    'completion_gate',v_enrollment.metadata->'completion_gate'
  );
end;
$$;

revoke all on function public.admin_set_requirement_evidence(uuid,text,text,text,text) from public, anon;
grant execute on function public.admin_set_requirement_evidence(uuid,text,text,text,text) to authenticated;