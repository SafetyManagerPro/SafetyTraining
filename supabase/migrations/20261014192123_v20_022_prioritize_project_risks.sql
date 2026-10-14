-- SafetyTraining v20.022
-- For initial worker courses, if project/DVR risks are available, the specialist
-- portion is composed only from those project risks. Course-profile risks remain
-- visible in the preview but no longer consume the worker-specific duration.

create or replace function public.preview_safetymanager_composition(
  p_external_course_code text,
  p_risk_codes text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_code text := lower(nullif(btrim(coalesce(p_external_course_code,'')),''));
  v_title text;
  v_target_minutes integer;
  v_requires_presence boolean := false;
  v_worker_initial boolean := false;
  v_general_minutes integer := 0;
  v_specialist_target integer := 0;
  v_has_project_risks boolean := false;
begin
  if not private.is_platform_admin() then
    raise exception 'platform admin required';
  end if;
  if v_code is null then raise exception 'external course code required'; end if;

  select c.title,c.nominal_minutes,
         lower(coalesce(c.metadata->>'requires_presence','false')) in ('true','1','yes')
    into v_title,v_target_minutes,v_requires_presence
  from public.integration_course_catalog c
  where c.source_system='safetymanager' and c.external_course_code=v_code;

  if v_title is null then raise exception 'SafetyManager course not found in catalog'; end if;

  v_worker_initial := v_code in ('lav_basso','lav_medio','lav_alto');
  v_has_project_risks := exists(
    select 1 from unnest(coalesce(p_risk_codes,'{}'::text[])) x
    where nullif(btrim(x),'') is not null
  );

  if v_worker_initial then
    select coalesce(sum(lu.default_minutes),0)::integer
      into v_general_minutes
    from public.learning_units lu
    where lu.active
      and lu.source_group='generale'
      and exists (
        select 1 from public.learning_unit_versions luv
        where luv.learning_unit_id=lu.id and luv.status='published'
      );
    v_general_minutes := least(v_general_minutes,coalesce(v_target_minutes,v_general_minutes));
  end if;

  v_specialist_target := greatest(coalesce(v_target_minutes,0)-v_general_minutes,0);

  return (
    with recursive
    input_raw as (
      select distinct lower(btrim(x)) as source_code
      from unnest(coalesce(p_risk_codes,'{}'::text[])) x
      where nullif(btrim(x),'') is not null
    ),
    input_risks as (
      select rc.code as risk_code,100 as weight,'project'::text as source
      from input_raw i
      join public.risk_catalog rc on lower(rc.code)=i.source_code and rc.active
      union all
      select a.risk_code,a.confidence,'project_alias'::text
      from input_raw i
      join public.safetymanager_risk_aliases a on lower(a.source_code)=i.source_code
    ),
    profile_risks as (
      select p.risk_code,p.relevance as weight,('course_'||p.requirement)::text as source
      from public.safetymanager_course_risk_profiles p
      where p.external_course_code=v_code
    ),
    effective as (
      select risk_code,max(weight)::integer as weight,string_agg(distinct source,',') as sources,
             bool_or(source like 'project%') as project_based
      from (
        select * from input_risks
        union all
        select * from profile_risks
      ) z
      group by risk_code
    ),
    candidate_risks as (
      select * from effective
      where not v_worker_initial
         or not v_has_project_risks
         or project_based
    ),
    affinity as (
      select source_group,relevance,role
      from public.safetymanager_course_unit_sources
      where external_course_code=v_code
    ),
    general_core as (
      select lu.id,lu.stable_key,lu.title,coalesce(lu.default_minutes,0)::integer as minutes,
             lu.source_group,100::integer as score,array['general']::text[] as risk_codes,
             'general_core'::text as section
      from public.learning_units lu
      where v_worker_initial
        and lu.active
        and lu.source_group='generale'
        and exists (
          select 1 from public.learning_unit_versions luv
          where luv.learning_unit_id=lu.id and luv.status='published'
        )
    ),
    raw_candidates as (
      select lu.id,lu.stable_key,lu.title,coalesce(lu.default_minutes,0)::integer as minutes,lu.source_group,
             max(round((l.relevance * e.weight * coalesce(a.relevance,55)) / 10000.0))::integer
               + case when bool_or(e.project_based) then 22 else 0 end
               + least(10,greatest(0,(count(distinct e.risk_code)-1)*3)) as score,
             array_agg(distinct l.risk_code order by l.risk_code) as risk_codes,
             case
               when lower(lu.title) ~ 'videoterm|vdt|scherm' then 'vdt'
               when lower(lu.title) ~ 'rumore|vibraz' then 'noise'
               when lower(lu.title) ~ 'chimic|sostanz|carburant|lubrificant' then 'chemical'
               when lower(lu.title) ~ 'biologic|igien|contamin|puntur|taglienti' then 'bio'
               when lower(lu.title) ~ 'moviment|carich|postur|ergonom' then 'mmc'
               when lower(lu.title) ~ 'elettric' then 'electrical'
               when lower(lu.title) ~ 'incend|emergenz|esodo|evacu' then 'emergency'
               when lower(lu.title) ~ 'aggress|violenz|conflitt|rapin' then 'aggression'
               when lower(lu.title) ~ 'traffico|strad|veicol|investiment' then 'traffic'
               when lower(lu.title) ~ 'quota|altezza|cadut.*alto' then 'height'
               when lower(lu.title) ~ 'meteo|microclima|calore|freddo|sole' then 'weather'
               when lower(lu.title) ~ 'macchin|attrezz|utensil|motoseg|decespug|trattor|compatt' then 'machine:'||lu.source_group
               when lower(lu.title) ~ 'scivol|inciamp|cadut' then 'space'
               else lu.stable_key
             end as concept_key
      from candidate_risks e
      join public.learning_unit_risk_links l on l.risk_code=e.risk_code
      join public.learning_units lu on lu.id=l.learning_unit_id and lu.active
      left join affinity a on a.source_group=lu.source_group
      where exists (
          select 1 from public.learning_unit_versions luv
          where luv.learning_unit_id=lu.id and luv.status='published'
        )
        and (not exists(select 1 from affinity) or a.source_group is not null)
        and (not v_worker_initial or lu.source_group<>'generale')
        and (not v_worker_initial or e.risk_code not in ('general','system'))
      group by lu.id,lu.stable_key,lu.title,lu.default_minutes,lu.source_group
    ),
    deduped as (
      select * from (
        select r.*,row_number() over(
          partition by concept_key
          order by score desc,minutes asc,stable_key
        ) as concept_rank
        from raw_candidates r
      ) q
      where concept_rank=1
    ),
    ranked as (
      select d.*,row_number() over(order by score desc,minutes asc,stable_key) as rn
      from deduped d
      where minutes>0
    ),
    greedy as (
      select 0::bigint as rn,0::integer as used_minutes,array[]::uuid[] as picked
      union all
      select r.rn,
             case
               when g.used_minutes+r.minutes <= case when v_worker_initial then v_specialist_target else coalesce(v_target_minutes,2147483647) end
                 then g.used_minutes+r.minutes
               else g.used_minutes
             end,
             case
               when g.used_minutes+r.minutes <= case when v_worker_initial then v_specialist_target else coalesce(v_target_minutes,2147483647) end
                 then array_append(g.picked,r.id)
               else g.picked
             end
      from greedy g
      join ranked r on r.rn=g.rn+1
    ),
    final_pick as (
      select picked,used_minutes
      from greedy
      order by rn desc
      limit 1
    ),
    specialist as (
      select r.id,r.stable_key,r.title,r.minutes,r.source_group,r.score,r.risk_codes,'specific_risk'::text as section,r.rn
      from ranked r,final_pick f
      where r.id=any(f.picked)
    ),
    proposed as (
      select id,stable_key,title,minutes,source_group,score,risk_codes,section,0::bigint as ord
      from general_core
      union all
      select id,stable_key,title,minutes,source_group,score,risk_codes,section,rn as ord
      from specialist
    ),
    risk_lu as (
      select distinct e.risk_code,lu.id,coalesce(lu.default_minutes,0) as minutes
      from effective e
      join public.learning_unit_risk_links l on l.risk_code=e.risk_code
      join public.learning_units lu on lu.id=l.learning_unit_id and lu.active
      where exists (
          select 1 from public.learning_unit_versions luv
          where luv.learning_unit_id=lu.id and luv.status='published'
        )
    ),
    coverage as (
      select e.risk_code,rc.title,count(rl.id)::integer as unit_count,
             coalesce(sum(rl.minutes),0)::integer as available_minutes,e.weight,e.sources,e.project_based
      from effective e
      join public.risk_catalog rc on rc.code=e.risk_code
      left join risk_lu rl on rl.risk_code=e.risk_code
      group by e.risk_code,rc.title,e.weight,e.sources,e.project_based
    ),
    totals as (
      select coalesce(sum(minutes),0)::integer as proposed_minutes,count(*)::integer as proposed_count
      from proposed
    )
    select jsonb_build_object(
      'ok',true,
      'engine','risk-v2.1',
      'course_code',v_code,
      'course_title',v_title,
      'worker_initial_course',v_worker_initial,
      'project_risks_prioritized',v_worker_initial and v_has_project_risks,
      'target_minutes',v_target_minutes,
      'general_core_minutes',v_general_minutes,
      'specialist_target_minutes',case when v_worker_initial then v_specialist_target else null end,
      'requires_presence',v_requires_presence,
      'practical_component_separate',v_requires_presence,
      'effective_risks',coalesce((
        select jsonb_agg(jsonb_build_object(
          'code',c.risk_code,'title',c.title,'weight',c.weight,'sources',c.sources,'project_based',c.project_based
        ) order by c.project_based desc,c.weight desc,c.risk_code)
        from coverage c
      ),'[]'::jsonb),
      'coverage_by_risk',coalesce((
        select jsonb_agg(jsonb_build_object(
          'code',c.risk_code,'title',c.title,'unit_count',c.unit_count,'available_minutes',c.available_minutes,
          'project_based',c.project_based
        ) order by c.project_based desc,c.weight desc,c.risk_code)
        from coverage c
      ),'[]'::jsonb),
      'matched_unit_count',(select count(*) from deduped),
      'matched_minutes',coalesce((select sum(minutes) from deduped),0),
      'proposed_unit_count',(select proposed_count from totals),
      'proposed_minutes',(select proposed_minutes from totals),
      'duration_gap_minutes',case when v_target_minutes is null then null else greatest(v_target_minutes-(select proposed_minutes from totals),0) end,
      'over_target_minutes',case when v_target_minutes is null then 0 else greatest((select proposed_minutes from totals)-v_target_minutes,0) end,
      'proposed_units',coalesce((
        select jsonb_agg(jsonb_build_object(
          'stable_key',p.stable_key,'title',p.title,'minutes',p.minutes,
          'source_group',p.source_group,'score',p.score,'risk_codes',p.risk_codes,'section',p.section
        ) order by case when p.section='general_core' then 0 else 1 end,p.ord,p.stable_key)
        from proposed p
      ),'[]'::jsonb),
      'notes',jsonb_build_array(
        case when v_worker_initial then 'Il modulo generale di 4 ore viene mantenuto integralmente; la durata residua è composta con Learning Unit specifiche.' else 'Composizione basata su profilo corso e rischi importati.' end,
        case when v_worker_initial and v_has_project_risks then 'Sono presenti rischi di progetto: la parte specifica usa soltanto tali rischi, mentre il profilo generico resta informativo.' else 'In assenza di rischi di progetto, la proposta usa il profilo generico del tipo corso.' end,
        'Le unità concettualmente sovrapposte vengono ridotte a una sola proposta per tema principale.',
        'La proposta non supera la durata nominale; eventuali minuti residui restano evidenziati per revisione didattica.',
        'I rischi reali del DVR, la mansione, le procedure aziendali e le esposizioni prevalgono sul profilo generico del corso.',
        case when v_requires_presence then 'La componente pratica/presenza resta separata e non è sostituita dalle Learning Unit digitali.' else 'Verificare comunque eventuali requisiti pratici o di presenza applicabili.' end
      )
    )
  );
end;
$$;

revoke all on function public.preview_safetymanager_composition(text,text[]) from public,anon;
grant execute on function public.preview_safetymanager_composition(text,text[]) to authenticated,service_role;
