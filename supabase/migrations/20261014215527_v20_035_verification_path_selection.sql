-- SafetyTraining v20.035
-- Explicitly resolve alternative verification paths (test OR interview) without forcing a platform test.

alter table public.course_verification_requirements add column if not exists selected_mode text null;
alter table public.course_verification_requirements drop constraint if exists course_verification_requirements_selected_mode_check;
alter table public.course_verification_requirements add constraint course_verification_requirements_selected_mode_check
check (selected_mode is null or selected_mode in ('test','interview','simulation','practical','test_and_practical','practical_and_interview'));

update public.course_verification_requirements
set selected_mode=case verification_mode
  when 'test' then 'test'
  when 'interview' then 'interview'
  when 'simulation' then 'simulation'
  when 'practical' then 'practical'
  when 'test_and_practical' then 'test_and_practical'
  when 'practical_and_interview' then 'practical_and_interview'
  else selected_mode
end,
metadata=metadata||case when verification_mode='test_or_interview'
  then '{"verification_path_selection_required":true,"allowed_selected_modes":["test","interview"]}'::jsonb
  else jsonb_build_object('verification_path_selection_required',false) end,
updated_at=now();

update public.tests t
set metadata=t.metadata||jsonb_build_object(
  'verification_selected_mode',cvr.selected_mode,
  'bank_required',case
    when cvr.verification_mode in ('test','test_and_practical') then true
    when cvr.verification_mode='test_or_interview' and cvr.selected_mode='test' then true
    else false end),
updated_at=now()
from public.course_verification_requirements cvr
where cvr.course_version_id=t.course_version_id and cvr.requirement_key=t.test_key;

create or replace function public.set_course_verification_path(p_course_version_id uuid,p_requirement_key text,p_selected_mode text)
returns jsonb
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare
  v_req public.course_verification_requirements%rowtype;
  v_test_id uuid;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;

  select * into v_req
  from public.course_verification_requirements
  where course_version_id=p_course_version_id and requirement_key=p_requirement_key and required
  for update;

  if v_req.id is null then raise exception 'verification requirement not found'; end if;
  if v_req.verification_mode<>'test_or_interview' then
    raise exception 'verification path is not selectable for mode %',v_req.verification_mode;
  end if;
  if p_selected_mode not in ('test','interview') then raise exception 'selected mode must be test or interview'; end if;

  update public.course_verification_requirements
  set selected_mode=p_selected_mode,
      metadata=metadata||jsonb_build_object('selected_mode',p_selected_mode,'selected_at',now()),
      updated_at=now()
  where id=v_req.id;

  if p_selected_mode='test' then
    insert into public.tests(course_version_id,test_key,title,passing_score_pct,max_attempts,active,metadata)
    values(v_req.course_version_id,v_req.requirement_key,v_req.title,coalesce(v_req.passing_score_pct,70),null,false,
      jsonb_build_object('verification_requirement_id',v_req.id,'verification_mode',v_req.verification_mode,
        'verification_selected_mode','test','minimum_questions',v_req.minimum_questions,
        'minimum_options_per_question',v_req.minimum_options_per_question,'bank_required',true,
        'question_bank_complete',false,'activation_gate','question_bank_review'))
    on conflict(course_version_id,test_key) do update set
      title=excluded.title,passing_score_pct=excluded.passing_score_pct,
      metadata=public.tests.metadata||excluded.metadata,active=false,updated_at=now()
    returning id into v_test_id;
  else
    update public.tests
    set active=false,metadata=metadata||jsonb_build_object('verification_selected_mode','interview','bank_required',false),updated_at=now()
    where course_version_id=v_req.course_version_id and test_key=v_req.requirement_key
    returning id into v_test_id;
  end if;

  return jsonb_build_object('ok',true,'course_version_id',p_course_version_id,'requirement_key',p_requirement_key,'selected_mode',p_selected_mode,'test_id',v_test_id);
end;
$$;

revoke all on function public.set_course_verification_path(uuid,text,text) from public,anon;
grant execute on function public.set_course_verification_path(uuid,text,text) to authenticated,service_role;

create or replace function public.get_course_readiness()
returns jsonb
language plpgsql
security definer
set search_path=public,private,auth
as $$
declare
  v_result jsonb;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;

  with latest_version as (
    select distinct on (cv.course_id) cv.id as course_version_id,cv.course_id,cv.version_number,cv.status as version_status,
      cv.effective_from,cv.effective_to,cv.published_at
    from public.course_versions cv order by cv.course_id,cv.version_number desc
  ),
  module_stats as (
    select lv.course_id,count(distinct cm.id)::integer as module_count,count(distinct cmu.id)::integer as unit_count,
      count(distinct cmu.id) filter(where cmu.required)::integer as required_unit_count
    from latest_version lv
    left join public.course_modules cm on cm.course_version_id=lv.course_version_id
    left join public.course_module_units cmu on cmu.module_id=cm.id
    group by lv.course_id
  ),
  practical_stats as (
    select c.id as course_id,count(cpr.id) filter(where cpr.required)::integer as required_practical_count,
      coalesce(sum(cpr.nominal_minutes) filter(where cpr.required),0)::integer as required_practical_minutes
    from public.courses c left join public.course_practical_requirements cpr on cpr.course_id=c.id group by c.id
  ),
  verification_stats as (
    select lv.course_id,count(cvr.id) filter(where cvr.required)::integer as required_verification_count,
      count(cvr.id) filter(where cvr.required and cvr.verification_mode='test_or_interview' and cvr.selected_mode is null)::integer as verification_path_selection_count,
      count(cvr.id) filter(where cvr.required and (cvr.verification_mode in ('test','test_and_practical') or (cvr.verification_mode='test_or_interview' and cvr.selected_mode='test')))::integer as required_test_count,
      max(cvr.minimum_questions) filter(where cvr.required and (cvr.verification_mode in ('test','test_and_practical') or (cvr.verification_mode='test_or_interview' and cvr.selected_mode='test'))) as maximum_minimum_questions
    from latest_version lv
    left join public.course_verification_requirements cvr on cvr.course_version_id=lv.course_version_id
    group by lv.course_id
  ),
  test_stats as (
    select lv.course_id,count(t.id)::integer as test_count,count(t.id) filter(where t.active)::integer as active_test_count,
      count(t.id) filter(where lower(coalesce(t.metadata->>'bank_required','false')) in ('true','1','yes'))::integer as bank_required_test_count,
      count(t.id) filter(where lower(coalesce(t.metadata->>'bank_required','false')) in ('true','1','yes') and lower(coalesce(t.metadata->>'question_bank_complete','false')) in ('true','1','yes'))::integer as completed_required_bank_count,
      coalesce(sum(x.bank_count) filter(where lower(coalesce(t.metadata->>'bank_required','false')) in ('true','1','yes')),0)::integer as linked_required_test_question_count,
      coalesce(bool_and(case when coalesce((t.metadata->>'minimum_questions')::integer,0)>0 then x.bank_count >= (t.metadata->>'minimum_questions')::integer else x.bank_count>0 end)
        filter(where lower(coalesce(t.metadata->>'bank_required','false')) in ('true','1','yes')),true) as required_banks_meet_minimum
    from latest_version lv
    left join public.tests t on t.course_version_id=lv.course_version_id
    left join lateral (select count(*)::integer as bank_count from public.test_questions tq where tq.test_id=t.id) x on true
    group by lv.course_id
  ),
  base as (
    select c.id as course_id,c.stable_key,c.title,c.family,c.nominal_minutes,c.metadata,
      lv.course_version_id,lv.version_number,lv.version_status,
      coalesce(ms.module_count,0) as module_count,coalesce(ms.unit_count,0) as unit_count,coalesce(ms.required_unit_count,0) as required_unit_count,
      coalesce(ps.required_practical_count,0) as required_practical_count,coalesce(ps.required_practical_minutes,0) as required_practical_minutes,
      coalesce(vs.required_verification_count,0) as required_verification_count,coalesce(vs.verification_path_selection_count,0) as verification_path_selection_count,
      coalesce(vs.required_test_count,0) as required_test_count,vs.maximum_minimum_questions,
      coalesce(ts.test_count,0) as test_count,coalesce(ts.active_test_count,0) as active_test_count,
      coalesce(ts.bank_required_test_count,0) as bank_required_test_count,coalesce(ts.completed_required_bank_count,0) as completed_required_bank_count,
      coalesce(ts.linked_required_test_question_count,0) as linked_required_test_question_count,coalesce(ts.required_banks_meet_minimum,true) as required_banks_meet_minimum,
      lower(coalesce(c.metadata->>'requires_admin_review','false')) in ('true','1','yes') as requires_admin_review,
      lower(coalesce(c.metadata->>'learner_catalog_hidden','false')) in ('true','1','yes') as learner_catalog_hidden,
      lower(coalesce(c.metadata->>'dynamic_update','false')) in ('true','1','yes') as dynamic_update,
      lower(coalesce(c.metadata->>'requires_collective_bargaining_check','false')) in ('true','1','yes') as requires_collective_bargaining_check,
      lower(coalesce(c.metadata->>'practical_component_separate','false')) in ('true','1','yes') as practical_component_separate,
      nullif(c.metadata->>'final_verification','') as declared_final_verification,
      nullif(c.metadata->>'blueprint_key','') as blueprint_key,nullif(c.metadata->>'variant_key','') as variant_key,
      nullif(c.metadata->>'delivery_constraint','') as delivery_constraint
    from public.courses c
    left join latest_version lv on lv.course_id=c.id
    left join module_stats ms on ms.course_id=c.id
    left join practical_stats ps on ps.course_id=c.id
    left join verification_stats vs on vs.course_id=c.id
    left join test_stats ts on ts.course_id=c.id
    where c.active
  ),
  assessed as (
    select b.*,
      array_remove(array[
        case when b.course_version_id is null then 'missing_course_version' end,
        case when b.course_version_id is not null and b.module_count=0 and not b.dynamic_update and b.required_practical_count=0 then 'missing_course_modules' end,
        case when b.practical_component_separate and b.required_practical_count=0 then 'missing_practical_requirement' end,
        case when b.declared_final_verification is not null and b.required_verification_count=0 then 'missing_verification_requirement' end,
        case when b.required_test_count>b.bank_required_test_count then 'missing_test_definition' end
      ],null)::text[] as hard_blockers,
      array_remove(array[
        case when b.version_status='draft' then 'draft_version' end,
        case when b.requires_admin_review then 'admin_review_required' end,
        case when b.learner_catalog_hidden then 'learner_catalog_hidden' end,
        case when b.dynamic_update then 'dynamic_content_selection_required' end,
        case when b.requires_collective_bargaining_check then 'collective_bargaining_check_required' end,
        case when b.verification_path_selection_count>0 then 'verification_path_selection_required' end,
        case when b.required_test_count>0 and (b.completed_required_bank_count<b.required_test_count or not b.required_banks_meet_minimum) then 'platform_question_bank_incomplete' end,
        case when b.required_practical_count>0 then 'external_practical_validation_required' end
      ],null)::text[] as review_items
    from base b
  ),
  classified as (
    select a.*,
      case
        when coalesce(array_length(a.hard_blockers,1),0)>0 then 'blocked'
        when a.version_status='published' then 'published'
        when a.requires_collective_bargaining_check or a.dynamic_update or a.verification_path_selection_count>0 then 'needs_configuration'
        when a.requires_admin_review or (a.required_test_count>0 and (a.completed_required_bank_count<a.required_test_count or not a.required_banks_meet_minimum)) or a.required_practical_count>0 then 'ready_for_review'
        else 'ready_for_publish'
      end as readiness_state
    from assessed a
  )
  select jsonb_build_object(
    'generated_at',now(),'semantics','Administrative readiness only: no automatic publication and no legal-validity claim.',
    'summary',jsonb_build_object('total',count(*),'blocked',count(*) filter(where readiness_state='blocked'),'needs_configuration',count(*) filter(where readiness_state='needs_configuration'),'ready_for_review',count(*) filter(where readiness_state='ready_for_review'),'ready_for_publish',count(*) filter(where readiness_state='ready_for_publish'),'published',count(*) filter(where readiness_state='published')),
    'courses',coalesce(jsonb_agg(jsonb_build_object(
      'course_id',course_id,'stable_key',stable_key,'title',title,'family',family,'nominal_minutes',nominal_minutes,
      'blueprint_key',blueprint_key,'variant_key',variant_key,'delivery_constraint',delivery_constraint,
      'version_number',version_number,'version_status',version_status,'module_count',module_count,'unit_count',unit_count,'required_unit_count',required_unit_count,
      'required_practical_count',required_practical_count,'required_practical_minutes',required_practical_minutes,
      'required_verification_count',required_verification_count,'verification_path_selection_count',verification_path_selection_count,
      'required_test_count',required_test_count,'maximum_minimum_questions',maximum_minimum_questions,'test_count',test_count,'active_test_count',active_test_count,
      'bank_required_test_count',bank_required_test_count,'completed_required_bank_count',completed_required_bank_count,
      'linked_required_test_question_count',linked_required_test_question_count,'required_banks_meet_minimum',required_banks_meet_minimum,
      'requires_admin_review',requires_admin_review,'learner_catalog_hidden',learner_catalog_hidden,'dynamic_update',dynamic_update,
      'requires_collective_bargaining_check',requires_collective_bargaining_check,'hard_blockers',to_jsonb(hard_blockers),'review_items',to_jsonb(review_items),'readiness_state',readiness_state
    ) order by family,title),'[]'::jsonb)
  ) into v_result
  from classified;

  return v_result;
end;
$$;

revoke all on function public.get_course_readiness() from public,anon;
grant execute on function public.get_course_readiness() to authenticated,service_role;
