-- SafetyTraining v20.034
-- Normalize course tests around verification requirements. Tests stay inactive until their question bank is reviewed.

alter table public.tests add column if not exists test_key text;
update public.tests set test_key=coalesce(nullif(test_key,''),coalesce(nullif(metadata->>'requirement_key',''),'final')) where test_key is null or test_key='';
alter table public.tests alter column test_key set default 'final';
alter table public.tests alter column test_key set not null;
create unique index if not exists tests_course_version_test_key_uidx on public.tests(course_version_id,test_key);

drop policy if exists tests_admin_manage on public.tests;
create policy tests_admin_manage on public.tests
for all to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1 from public.course_versions cv
    join public.courses c on c.id=cv.course_id
    where cv.id=tests.course_version_id
      and c.owner_organization_id is not null
      and private.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])
  )
)
with check (
  private.is_platform_admin()
  or exists (
    select 1 from public.course_versions cv
    join public.courses c on c.id=cv.course_id
    where cv.id=tests.course_version_id
      and c.owner_organization_id is not null
      and private.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])
  )
);

drop policy if exists test_questions_admin_manage on public.test_questions;
create policy test_questions_admin_manage on public.test_questions
for all to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1 from public.tests t
    join public.course_versions cv on cv.id=t.course_version_id
    join public.courses c on c.id=cv.course_id
    where t.id=test_questions.test_id
      and c.owner_organization_id is not null
      and private.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])
  )
)
with check (
  private.is_platform_admin()
  or exists (
    select 1 from public.tests t
    join public.course_versions cv on cv.id=t.course_version_id
    join public.courses c on c.id=cv.course_id
    where t.id=test_questions.test_id
      and c.owner_organization_id is not null
      and private.has_org_role(c.owner_organization_id,array['organization_admin','training_manager'])
  )
);

grant select,insert,update,delete on public.tests to authenticated;
grant select,insert,update,delete on public.test_questions to authenticated;

insert into public.tests(course_version_id,test_key,title,passing_score_pct,max_attempts,active,metadata)
select
  cvr.course_version_id,
  cvr.requirement_key,
  cvr.title,
  coalesce(cvr.passing_score_pct,70),
  null,
  false,
  jsonb_build_object(
    'verification_requirement_id',cvr.id,
    'verification_mode',cvr.verification_mode,
    'minimum_questions',cvr.minimum_questions,
    'minimum_options_per_question',cvr.minimum_options_per_question,
    'question_bank_complete',false,
    'activation_gate','question_bank_review',
    'created_by_migration','v20_034'
  )
from public.course_verification_requirements cvr
where cvr.required
  and cvr.verification_mode in ('test','test_or_interview','test_and_practical')
on conflict (course_version_id,test_key) do update set
  title=excluded.title,
  passing_score_pct=excluded.passing_score_pct,
  metadata=public.tests.metadata||excluded.metadata,
  active=false,
  updated_at=now();

create or replace function public.get_course_readiness()
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_result jsonb;
begin
  if not private.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  with latest_version as (
    select distinct on (cv.course_id)
      cv.id as course_version_id,cv.course_id,cv.version_number,cv.status as version_status,
      cv.effective_from,cv.effective_to,cv.published_at
    from public.course_versions cv
    order by cv.course_id,cv.version_number desc
  ),
  module_stats as (
    select lv.course_id,count(distinct cm.id)::integer as module_count,
      count(distinct cmu.id)::integer as unit_count,
      count(distinct cmu.id) filter(where cmu.required)::integer as required_unit_count,
      coalesce(sum(distinct cm.nominal_minutes),0)::integer as module_nominal_minutes
    from latest_version lv
    left join public.course_modules cm on cm.course_version_id=lv.course_version_id
    left join public.course_module_units cmu on cmu.module_id=cm.id
    group by lv.course_id
  ),
  practical_stats as (
    select c.id as course_id,count(cpr.id) filter(where cpr.required)::integer as required_practical_count,
      coalesce(sum(cpr.nominal_minutes) filter(where cpr.required),0)::integer as required_practical_minutes
    from public.courses c
    left join public.course_practical_requirements cpr on cpr.course_id=c.id
    group by c.id
  ),
  verification_stats as (
    select lv.course_id,
      count(cvr.id) filter(where cvr.required)::integer as required_verification_count,
      count(cvr.id) filter(where cvr.required and cvr.verification_mode in ('test','test_or_interview','test_and_practical'))::integer as test_capable_requirement_count,
      max(cvr.minimum_questions) filter(where cvr.required) as maximum_minimum_questions
    from latest_version lv
    left join public.course_verification_requirements cvr on cvr.course_version_id=lv.course_version_id
    group by lv.course_id
  ),
  test_stats as (
    select lv.course_id,
      count(t.id)::integer as test_count,
      count(t.id) filter(where t.active)::integer as active_test_count,
      count(t.id) filter(where lower(coalesce(t.metadata->>'question_bank_complete','false')) in ('true','1','yes'))::integer as completed_bank_test_count,
      coalesce(sum(x.bank_count),0)::integer as linked_test_question_count,
      bool_and(
        case
          when coalesce((t.metadata->>'minimum_questions')::integer,0)>0
            then x.bank_count >= (t.metadata->>'minimum_questions')::integer
          else x.bank_count>0
        end
      ) filter(where t.id is not null) as banks_meet_declared_minimum
    from latest_version lv
    left join public.tests t on t.course_version_id=lv.course_version_id
    left join lateral (
      select count(*)::integer as bank_count from public.test_questions tq where tq.test_id=t.id
    ) x on true
    group by lv.course_id
  ),
  base as (
    select c.id as course_id,c.stable_key,c.title,c.family,c.nominal_minutes,c.certification_mode,c.active,c.metadata,
      lv.course_version_id,lv.version_number,lv.version_status,lv.effective_from,lv.effective_to,lv.published_at,
      coalesce(ms.module_count,0) as module_count,coalesce(ms.unit_count,0) as unit_count,
      coalesce(ms.required_unit_count,0) as required_unit_count,coalesce(ms.module_nominal_minutes,0) as module_nominal_minutes,
      coalesce(ps.required_practical_count,0) as required_practical_count,coalesce(ps.required_practical_minutes,0) as required_practical_minutes,
      coalesce(vs.required_verification_count,0) as required_verification_count,
      coalesce(vs.test_capable_requirement_count,0) as test_capable_requirement_count,vs.maximum_minimum_questions,
      coalesce(ts.test_count,0) as test_count,coalesce(ts.active_test_count,0) as active_test_count,
      coalesce(ts.completed_bank_test_count,0) as completed_bank_test_count,
      coalesce(ts.linked_test_question_count,0) as linked_test_question_count,
      coalesce(ts.banks_meet_declared_minimum,false) as banks_meet_declared_minimum,
      lower(coalesce(c.metadata->>'requires_admin_review','false')) in ('true','1','yes') as requires_admin_review,
      lower(coalesce(c.metadata->>'learner_catalog_hidden','false')) in ('true','1','yes') as learner_catalog_hidden,
      lower(coalesce(c.metadata->>'dynamic_update','false')) in ('true','1','yes') as dynamic_update,
      lower(coalesce(c.metadata->>'requires_collective_bargaining_check','false')) in ('true','1','yes') as requires_collective_bargaining_check,
      lower(coalesce(c.metadata->>'practical_component_separate','false')) in ('true','1','yes') as practical_component_separate,
      nullif(c.metadata->>'final_verification','') as declared_final_verification,
      nullif(c.metadata->>'blueprint_key','') as blueprint_key,
      nullif(c.metadata->>'variant_key','') as variant_key,
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
        case when b.test_capable_requirement_count>0 and b.test_count<b.test_capable_requirement_count then 'missing_test_definition' end
      ],null)::text[] as hard_blockers,
      array_remove(array[
        case when b.version_status='draft' then 'draft_version' end,
        case when b.requires_admin_review then 'admin_review_required' end,
        case when b.learner_catalog_hidden then 'learner_catalog_hidden' end,
        case when b.dynamic_update then 'dynamic_content_selection_required' end,
        case when b.requires_collective_bargaining_check then 'collective_bargaining_check_required' end,
        case when b.test_capable_requirement_count>0 and (b.completed_bank_test_count<b.test_capable_requirement_count or not b.banks_meet_declared_minimum) then 'platform_question_bank_incomplete' end,
        case when b.required_practical_count>0 then 'external_practical_validation_required' end
      ],null)::text[] as review_items
    from base b
  ),
  classified as (
    select a.*,
      case
        when coalesce(array_length(a.hard_blockers,1),0)>0 then 'blocked'
        when a.version_status='published' then 'published'
        when a.requires_collective_bargaining_check or a.dynamic_update then 'needs_configuration'
        when a.requires_admin_review
          or (a.test_capable_requirement_count>0 and (a.completed_bank_test_count<a.test_capable_requirement_count or not a.banks_meet_declared_minimum))
          or a.required_practical_count>0 then 'ready_for_review'
        else 'ready_for_publish'
      end as readiness_state
    from assessed a
  )
  select jsonb_build_object(
    'generated_at',now(),
    'semantics','Administrative readiness only: no automatic publication and no legal-validity claim.',
    'summary',jsonb_build_object(
      'total',count(*),'blocked',count(*) filter(where readiness_state='blocked'),
      'needs_configuration',count(*) filter(where readiness_state='needs_configuration'),
      'ready_for_review',count(*) filter(where readiness_state='ready_for_review'),
      'ready_for_publish',count(*) filter(where readiness_state='ready_for_publish'),
      'published',count(*) filter(where readiness_state='published')
    ),
    'courses',coalesce(jsonb_agg(jsonb_build_object(
      'course_id',course_id,'stable_key',stable_key,'title',title,'family',family,'nominal_minutes',nominal_minutes,
      'blueprint_key',blueprint_key,'variant_key',variant_key,'delivery_constraint',delivery_constraint,
      'version_number',version_number,'version_status',version_status,
      'module_count',module_count,'unit_count',unit_count,'required_unit_count',required_unit_count,
      'required_practical_count',required_practical_count,'required_practical_minutes',required_practical_minutes,
      'required_verification_count',required_verification_count,'test_capable_requirement_count',test_capable_requirement_count,
      'maximum_minimum_questions',maximum_minimum_questions,'test_count',test_count,'active_test_count',active_test_count,
      'completed_bank_test_count',completed_bank_test_count,'linked_test_question_count',linked_test_question_count,
      'banks_meet_declared_minimum',banks_meet_declared_minimum,
      'requires_admin_review',requires_admin_review,'learner_catalog_hidden',learner_catalog_hidden,
      'dynamic_update',dynamic_update,'requires_collective_bargaining_check',requires_collective_bargaining_check,
      'hard_blockers',to_jsonb(hard_blockers),'review_items',to_jsonb(review_items),'readiness_state',readiness_state
    ) order by family,title),'[]'::jsonb)
  ) into v_result
  from classified;

  return v_result;
end;
$$;

revoke all on function public.get_course_readiness() from public,anon;
grant execute on function public.get_course_readiness() to authenticated,service_role;
