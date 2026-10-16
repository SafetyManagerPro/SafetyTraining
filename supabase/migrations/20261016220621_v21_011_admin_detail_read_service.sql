create or replace function public.admin_company_detail(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company public.companies%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;

  select * into v_company from public.companies where id=p_company_id;
  if v_company.id is null then
    raise exception 'company_not_found' using errcode='P0002';
  end if;

  select jsonb_build_object(
    'company',to_jsonb(v_company),
    'organization',(
      select jsonb_build_object('id',o.id,'name',o.name,'code',o.code,'active',o.active)
      from public.organizations o where o.id=v_company.organization_id
    ),
    'summary',jsonb_build_object(
      'learners_total',(select count(*) from public.learners l where l.company_id=v_company.id),
      'learners_active',(select count(*) from public.learners l where l.company_id=v_company.id and l.active),
      'learners_with_account',(select count(*) from public.learners l where l.company_id=v_company.id and l.auth_user_id is not null),
      'editions_total',(select count(*) from public.course_editions d where d.company_id=v_company.id),
      'editions_open',(select count(*) from public.course_editions d where d.company_id=v_company.id and d.status='open'),
      'enrollments_total',(
        select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id
        where d.company_id=v_company.id
      ),
      'enrollments_in_progress',(
        select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id
        where d.company_id=v_company.id and e.status='in_progress'
      ),
      'enrollments_completed',(
        select count(*) from public.enrollments e join public.course_editions d on d.id=e.edition_id
        where d.company_id=v_company.id and e.status in ('completed','passed')
      )
    ),
    'learners',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',l.id,
        'first_name',l.first_name,
        'last_name',l.last_name,
        'email',l.email,
        'fiscal_code',l.fiscal_code,
        'job_title',l.job_title,
        'active',l.active,
        'account_active',l.auth_user_id is not null,
        'invite_status',i.status,
        'invite_last_sent_at',i.last_sent_at
      ) order by l.last_name,l.first_name,l.created_at)
      from public.learners l
      left join public.learner_account_invitations i on i.learner_id=l.id
      where l.company_id=v_company.id
    ),'[]'::jsonb),
    'editions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,
        'title',coalesce(d.title,c.title),
        'status',d.status,
        'learning_mode',d.learning_mode,
        'available_from',d.available_from,
        'available_until',d.available_until,
        'course_id',c.id,
        'course_title',c.title,
        'course_version_id',cv.id,
        'course_version',cv.version_number,
        'enrollments_total',(select count(*) from public.enrollments e where e.edition_id=d.id and e.status<>'revoked'),
        'completed',(select count(*) from public.enrollments e where e.edition_id=d.id and e.status in ('completed','passed'))
      ) order by d.created_at desc)
      from public.course_editions d
      join public.course_versions cv on cv.id=d.course_version_id
      join public.courses c on c.id=cv.course_id
      where d.company_id=v_company.id
    ),'[]'::jsonb),
    'recent_admin_actions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'action',a.action,'created_at',a.created_at,'context',a.context
      ) order by a.created_at desc)
      from (
        select action,created_at,context
        from private.admin_audit_log
        where entity_type='company' and entity_id=v_company.id
        order by created_at desc limit 20
      ) a
    ),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_learner_detail(p_learner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner public.learners%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;

  select * into v_learner from public.learners where id=p_learner_id;
  if v_learner.id is null then
    raise exception 'learner_not_found' using errcode='P0002';
  end if;

  select jsonb_build_object(
    'learner',to_jsonb(v_learner),
    'organization',(
      select jsonb_build_object('id',o.id,'name',o.name,'code',o.code)
      from public.organizations o where o.id=v_learner.organization_id
    ),
    'company',(
      select jsonb_build_object('id',c.id,'name',c.name,'vat_number',c.vat_number,'ateco_code',c.ateco_code,'active',c.active)
      from public.companies c where c.id=v_learner.company_id
    ),
    'invitation',(
      select jsonb_build_object(
        'status',i.status,
        'email',i.email,
        'sent_count',i.sent_count,
        'last_sent_at',i.last_sent_at,
        'accepted_at',i.accepted_at,
        'last_error',i.last_error
      )
      from public.learner_account_invitations i where i.learner_id=v_learner.id
    ),
    'summary',jsonb_build_object(
      'enrollments_total',(select count(*) from public.enrollments e where e.learner_id=v_learner.id),
      'active_enrollments',(select count(*) from public.enrollments e where e.learner_id=v_learner.id and e.status<>'revoked'),
      'in_progress',(select count(*) from public.enrollments e where e.learner_id=v_learner.id and e.status='in_progress'),
      'completed',(select count(*) from public.enrollments e where e.learner_id=v_learner.id and e.status in ('completed','passed')),
      'account_active',v_learner.auth_user_id is not null
    ),
    'enrollments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,
        'status',e.status,
        'progress_pct',e.progress_pct,
        'active_seconds',e.active_seconds,
        'final_score_pct',e.final_score_pct,
        'enrolled_at',e.enrolled_at,
        'started_at',e.started_at,
        'completed_at',e.completed_at,
        'last_activity_at',e.last_activity_at,
        'completion_gate',e.metadata->'completion_gate',
        'edition_id',d.id,
        'edition_title',coalesce(d.title,c.title),
        'edition_status',d.status,
        'learning_mode',d.learning_mode,
        'course_id',c.id,
        'course_title',c.title,
        'course_version_id',cv.id,
        'course_version',cv.version_number,
        'company_id',d.company_id,
        'company_name',co.name,
        'tests',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',ta.id,
            'attempt_no',ta.attempt_no,
            'started_at',ta.started_at,
            'completed_at',ta.completed_at,
            'score_pct',ta.score_pct,
            'passed',ta.passed
          ) order by ta.attempt_no desc)
          from public.test_attempts ta where ta.enrollment_id=e.id
        ),'[]'::jsonb),
        'evidence',coalesce((
          select jsonb_agg(jsonb_build_object(
            'kind',ev.requirement_kind,
            'key',ev.requirement_key,
            'status',ev.status,
            'completion_mode',ev.completion_mode,
            'completed_at',ev.completed_at,
            'note',ev.evidence->>'note'
          ) order by ev.requirement_kind,ev.requirement_key)
          from public.enrollment_requirement_evidence ev where ev.enrollment_id=e.id
        ),'[]'::jsonb)
      ) order by e.enrolled_at desc)
      from public.enrollments e
      join public.course_editions d on d.id=e.edition_id
      join public.course_versions cv on cv.id=d.course_version_id
      join public.courses c on c.id=cv.course_id
      left join public.companies co on co.id=d.company_id
      where e.learner_id=v_learner.id
    ),'[]'::jsonb),
    'recent_admin_actions',coalesce((
      select jsonb_agg(jsonb_build_object('action',a.action,'created_at',a.created_at,'context',a.context) order by a.created_at desc)
      from (
        select action,created_at,context from private.admin_audit_log
        where entity_type='learner' and entity_id=v_learner.id
        order by created_at desc limit 20
      ) a
    ),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_edition_detail(p_edition_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_edition public.course_editions%rowtype;
  v_course_version public.course_versions%rowtype;
  v_course public.courses%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;

  select * into v_edition from public.course_editions where id=p_edition_id;
  if v_edition.id is null then
    raise exception 'edition_not_found' using errcode='P0002';
  end if;
  select * into v_course_version from public.course_versions where id=v_edition.course_version_id;
  select * into v_course from public.courses where id=v_course_version.course_id;

  select jsonb_build_object(
    'edition',to_jsonb(v_edition),
    'course',jsonb_build_object(
      'id',v_course.id,
      'stable_key',v_course.stable_key,
      'title',v_course.title,
      'family',v_course.family,
      'nominal_minutes',v_course.nominal_minutes,
      'certification_mode',v_course.certification_mode,
      'version_id',v_course_version.id,
      'version_number',v_course_version.version_number,
      'version_status',v_course_version.status,
      'go_live_ready',coalesce((v_course_version.syllabus_snapshot->>'go_live_ready')::boolean,false)
    ),
    'organization',(
      select jsonb_build_object('id',o.id,'name',o.name,'code',o.code) from public.organizations o where o.id=v_edition.organization_id
    ),
    'company',(
      select jsonb_build_object('id',c.id,'name',c.name,'vat_number',c.vat_number,'ateco_code',c.ateco_code) from public.companies c where c.id=v_edition.company_id
    ),
    'summary',jsonb_build_object(
      'enrollments_total',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status<>'revoked'),
      'not_started',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status='not_started'),
      'in_progress',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status='in_progress'),
      'completed',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status in ('completed','passed')),
      'revoked',(select count(*) from public.enrollments e where e.edition_id=v_edition.id and e.status='revoked'),
      'accounts_active',(
        select count(*) from public.enrollments e join public.learners l on l.id=e.learner_id
        where e.edition_id=v_edition.id and e.status<>'revoked' and l.auth_user_id is not null
      ),
      'practical_requirements',(select count(*) from public.course_practical_requirements r where r.course_id=v_course.id and r.required),
      'verification_requirements',(select count(*) from public.course_verification_requirements r where r.course_version_id=v_course_version.id and r.required)
    ),
    'enrollments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,
        'status',e.status,
        'progress_pct',e.progress_pct,
        'active_seconds',e.active_seconds,
        'final_score_pct',e.final_score_pct,
        'last_activity_at',e.last_activity_at,
        'completion_gate',e.metadata->'completion_gate',
        'learner_id',l.id,
        'learner_name',btrim(coalesce(l.first_name,'')||' '||coalesce(l.last_name,'')),
        'email',l.email,
        'job_title',l.job_title,
        'account_active',l.auth_user_id is not null,
        'invite_status',i.status,
        'invite_last_sent_at',i.last_sent_at,
        'evidence_completed',(select count(*) from public.enrollment_requirement_evidence ev where ev.enrollment_id=e.id and ev.status='completed'),
        'evidence_pending',(select count(*) from public.enrollment_requirement_evidence ev where ev.enrollment_id=e.id and ev.status in ('pending','failed','revoked'))
      ) order by l.last_name,l.first_name,e.enrolled_at)
      from public.enrollments e
      join public.learners l on l.id=e.learner_id
      left join public.learner_account_invitations i on i.learner_id=l.id
      where e.edition_id=v_edition.id
    ),'[]'::jsonb),
    'recent_admin_actions',coalesce((
      select jsonb_agg(jsonb_build_object('action',a.action,'created_at',a.created_at,'context',a.context) order by a.created_at desc)
      from (
        select action,created_at,context from private.admin_audit_log
        where (entity_type='course_edition' and entity_id=v_edition.id)
           or context->>'enrollment_id' in (select id::text from public.enrollments where edition_id=v_edition.id)
        order by created_at desc limit 30
      ) a
    ),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_company_detail(uuid) from public, anon;
revoke all on function public.admin_learner_detail(uuid) from public, anon;
revoke all on function public.admin_edition_detail(uuid) from public, anon;

grant execute on function public.admin_company_detail(uuid) to authenticated;
grant execute on function public.admin_learner_detail(uuid) to authenticated;
grant execute on function public.admin_edition_detail(uuid) to authenticated;
