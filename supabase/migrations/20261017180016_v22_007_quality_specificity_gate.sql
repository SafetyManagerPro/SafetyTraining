create or replace function public.get_course_quality_v22()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare v_result jsonb;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;
  with latest as (
    select distinct on (cv.course_id) cv.id course_version_id,cv.course_id,cv.version_number,cv.status
    from public.course_versions cv order by cv.course_id,cv.version_number desc
  ), content_stats as (
    select l.course_id,count(cmu.id)::int unit_count,
      count(cmu.id) filter(where luv.content ? 'operational')::int operational_units,
      count(cmu.id) filter(where luv.content ? 'case' or luv.content ? 'teacher_activity')::int scenario_units,
      count(cmu.id) filter(where luv.content ? 'idea_images' or luv.content ? 'visuals')::int explicit_visual_units,
      count(cmu.id) filter(where luv.content ? 'evidence_sources' or luv.content ? 'sources')::int sourced_units
    from latest l left join public.course_modules cm on cm.course_version_id=l.course_version_id
    left join public.course_module_units cmu on cmu.module_id=cm.id left join public.learning_unit_versions luv on luv.id=cmu.unit_version_id group by l.course_id
  ), scenario_stats as (
    select cs.course_id,count(distinct cs.scenario_id)::int scenario_count,
      count(distinct cs.scenario_id) filter(where cs.context->>'specific'='true')::int specific_scenario_count,
      coalesce(sum(case when jsonb_typeof(s.visuals)='array' then jsonb_array_length(s.visuals) else 0 end),0)::int scenario_visual_count,
      coalesce(sum(case when jsonb_typeof(s.media)='array' then jsonb_array_length(s.media) else 0 end),0)::int scenario_media_count,
      coalesce(sum(case when jsonb_typeof(s.sources)='array' then jsonb_array_length(s.sources) else 0 end),0)::int scenario_source_count
    from public.course_scenarios_v22 cs join public.training_scenarios_v22 s on s.id=cs.scenario_id and s.active group by cs.course_id
  ), lab_stats as (
    select cp.course_id,count(distinct cp.practice_lab_id)::int practice_lab_count,
      count(distinct cp.practice_lab_id) filter(where cp.context->>'specific'='true')::int specific_lab_count,
      coalesce(sum(case when jsonb_typeof(pl.media)='array' then jsonb_array_length(pl.media) else 0 end),0)::int lab_media_count,
      coalesce(sum(case when jsonb_typeof(pl.sources)='array' then jsonb_array_length(pl.sources) else 0 end),0)::int lab_source_count,
      bool_or(coalesce(pl.requires_physical_validation,false)) physical_validation_present
    from public.course_practice_labs_v22 cp join public.practice_labs_v22 pl on pl.id=cp.practice_lab_id and pl.active group by cp.course_id
  ), ver as (
    select l.course_id,count(distinct vr.id) filter(where vr.required)::int verification_count,
      count(distinct vr.id) filter(where vr.required and (vr.verification_mode in ('test','test_and_practical') or (vr.verification_mode='test_or_interview' and vr.selected_mode='test')))::int required_test_count,
      max(vr.minimum_questions) filter(where vr.required and (vr.verification_mode in ('test','test_and_practical') or (vr.verification_mode='test_or_interview' and vr.selected_mode='test')))::int min_questions
    from latest l left join public.course_verification_requirements vr on vr.course_version_id=l.course_version_id group by l.course_id
  ), tst as (
    select l.course_id,count(distinct t.id) filter(where t.active)::int active_tests,count(distinct q.id) filter(where t.active and q.active)::int active_questions
    from latest l left join public.tests t on t.course_version_id=l.course_version_id left join public.test_questions tq on tq.test_id=t.id left join public.questions q on q.id=tq.question_id group by l.course_id
  ), scored as (
    select c.id,c.stable_key,c.title,c.family,c.nominal_minutes,c.metadata,l.version_number,l.status version_status,
      coalesce(cs.unit_count,0) unit_count,coalesce(cs.operational_units,0) operational_units,coalesce(cs.scenario_units,0) scenario_units,
      coalesce(cs.explicit_visual_units,0) explicit_visual_units,coalesce(cs.sourced_units,0) sourced_units,
      coalesce(ss.scenario_count,0) scenario_count,coalesce(ss.specific_scenario_count,0) specific_scenario_count,coalesce(ss.scenario_visual_count,0) scenario_visual_count,
      coalesce(ls.practice_lab_count,0) practice_lab_count,coalesce(ls.specific_lab_count,0) specific_lab_count,
      coalesce(ss.scenario_media_count,0)+coalesce(ls.lab_media_count,0) media_count,
      coalesce(ss.scenario_source_count,0)+coalesce(ls.lab_source_count,0) experience_source_count,
      coalesce(ls.physical_validation_present,false) physical_validation_present,
      coalesce(v.verification_count,0) verification_count,coalesce(v.required_test_count,0) required_test_count,coalesce(v.min_questions,0) min_questions,
      coalesce(t.active_tests,0) active_tests,coalesce(t.active_questions,0) active_questions,
      (case when l.course_version_id is not null and coalesce(cs.unit_count,0)>0 then 10 else 0 end+
       case when coalesce(cs.unit_count,0)>0 and cs.operational_units*2>=cs.unit_count then 10 when cs.operational_units>0 then 5 else 0 end+
       case when coalesce(cs.scenario_units,0)>0 or coalesce(ss.scenario_count,0)>0 then 10 else 0 end+
       case when coalesce(cs.explicit_visual_units,0)>0 or coalesce(ss.scenario_visual_count,0)>0 then 10 else 0 end+
       case when coalesce(ss.scenario_count,0)>0 then 15 else 0 end+
       case when coalesce(ls.practice_lab_count,0)>0 then 20 else 0 end+
       case when coalesce(ss.scenario_media_count,0)+coalesce(ls.lab_media_count,0)>0 then 10 else 0 end+
       case when coalesce(cs.sourced_units,0)>0 or coalesce(ss.scenario_source_count,0)+coalesce(ls.lab_source_count,0)>0 then 5 else 0 end+
       case when coalesce(v.verification_count,0)>0 and (coalesce(v.required_test_count,0)=0 or (coalesce(t.active_tests,0)>=v.required_test_count and coalesce(t.active_questions,0)>=greatest(coalesce(v.min_questions,0),1))) then 10 else 0 end)::int quality_score
    from public.courses c left join latest l on l.course_id=c.id left join content_stats cs on cs.course_id=c.id left join scenario_stats ss on ss.course_id=c.id left join lab_stats ls on ls.course_id=c.id left join ver v on v.course_id=c.id left join tst t on tst.course_id=c.id
    where c.active and coalesce(c.metadata->>'freeze_scope','')=''
  ), gapped as (
    select s.*,array_remove(array[
      case when unit_count=0 then 'missing_learning_units' end,
      case when operational_units=0 then 'missing_operational_content' end,
      case when scenario_units=0 and scenario_count=0 then 'missing_scenario_content' end,
      case when explicit_visual_units=0 and scenario_visual_count=0 then 'missing_visual_support' end,
      case when scenario_count=0 then 'missing_safety_scenario' end,
      case when specific_scenario_count=0 then 'missing_specific_scenario' end,
      case when practice_lab_count=0 then 'missing_practice_lab' end,
      case when specific_lab_count=0 then 'missing_specific_practice_lab' end,
      case when media_count=0 then 'missing_media_or_demo' end,
      case when sourced_units=0 and experience_source_count=0 then 'missing_sources' end,
      case when verification_count=0 then 'missing_verification_path' end,
      case when required_test_count>0 and (active_tests<required_test_count or active_questions<greatest(min_questions,1)) then 'test_bank_incomplete' end
    ],null)::text[] quality_gaps from scored s
  ), final as (
    select g.*,case when quality_score>=85 and coalesce(cardinality(quality_gaps),0)=0 then 'gold' when quality_score>=70 then 'silver' when quality_score>=55 then 'bronze' else 'incomplete' end quality_grade from gapped g
  )
  select jsonb_build_object(
    'standard','v22.007','generated_at',now(),
    'summary',jsonb_build_object('total',count(*),'gold',count(*) filter(where quality_grade='gold'),'silver',count(*) filter(where quality_grade='silver'),'bronze',count(*) filter(where quality_grade='bronze'),'incomplete',count(*) filter(where quality_grade='incomplete'),'specific_complete',count(*) filter(where specific_scenario_count>0 and specific_lab_count>0),'with_gaps',count(*) filter(where coalesce(cardinality(quality_gaps),0)>0),'frozen_excluded',(select count(*) from public.courses x where x.active and coalesce(x.metadata->>'freeze_scope','')<>'')),
    'courses',coalesce(jsonb_agg(jsonb_build_object('course_id',id,'stable_key',stable_key,'title',title,'family',family,'nominal_minutes',nominal_minutes,'version_number',version_number,'version_status',version_status,'quality_score',quality_score,'quality_grade',quality_grade,'quality_gaps',to_jsonb(quality_gaps),'unit_count',unit_count,'operational_units',operational_units,'scenario_units',scenario_units,'explicit_visual_units',explicit_visual_units,'scenario_visual_count',scenario_visual_count,'sourced_units',sourced_units,'scenario_count',scenario_count,'specific_scenario_count',specific_scenario_count,'practice_lab_count',practice_lab_count,'specific_lab_count',specific_lab_count,'media_count',media_count,'physical_validation_present',physical_validation_present,'verification_count',verification_count,'active_tests',active_tests,'active_questions',active_questions) order by quality_score,title),'[]'::jsonb)
  ) into v_result from final;
  return v_result;
end;
$function$;
revoke all on function public.get_course_quality_v22() from public,anon;
grant execute on function public.get_course_quality_v22() to authenticated,service_role;
