create or replace function public.training_catalog_summary()
returns table(stable_key text,title text,family text,nominal_minutes integer,unit_count bigint,version_status text,didactic_version text)
language sql stable security definer set search_path = public
as $$
  with latest as (
    select distinct on (cv.course_id) cv.id,cv.course_id,cv.version_number,cv.status
    from public.course_versions cv
    order by cv.course_id,cv.version_number desc
  ), counts as (
    select l.course_id,count(distinct cmu.unit_version_id)::bigint as unit_count
    from latest l
    left join public.course_modules cm on cm.course_version_id=l.id
    left join public.course_module_units cmu on cmu.module_id=cm.id
    group by l.course_id
  )
  select c.stable_key,c.title,c.family,c.nominal_minutes,coalesce(ct.unit_count,0)::bigint,
         coalesce(l.status,'draft')::text,
         coalesce(c.metadata->>'didactic_version',c.metadata->>'didactic_preview_version')::text
  from public.courses c
  left join latest l on l.course_id=c.id
  left join counts ct on ct.course_id=c.id
  where c.active=true
  order by c.family,c.title;
$$;
revoke all on function public.training_catalog_summary() from public;
grant execute on function public.training_catalog_summary() to anon, authenticated;

create or replace function public.training_course_bundle(p_stable_key text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'course',jsonb_build_object('stable_key',c.stable_key,'title',c.title,'family',c.family,'description',c.description,'nominal_minutes',c.nominal_minutes,'metadata',c.metadata),
    'version',jsonb_build_object('version_number',cv.version_number,'status',cv.status,'syllabus_snapshot',cv.syllabus_snapshot,'normative_snapshot',cv.normative_snapshot),
    'modules',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'module_key',cm.module_key,
          'title',cm.title,
          'position',cm.position,
          'nominal_minutes',cm.nominal_minutes,
          'units',coalesce((
            select jsonb_agg(
              jsonb_build_object('stable_key',lu.stable_key,'title',lu.title,'summary',lu.summary,'default_minutes',lu.default_minutes,'source_group',lu.source_group,'metadata',lu.metadata,'content',luv.content,'position',cmu.position)
              order by cmu.position
            )
            from public.course_module_units cmu
            join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
            join public.learning_units lu on lu.id=luv.learning_unit_id
            where cmu.module_id=cm.id and lu.active=true
          ),'[]'::jsonb)
        ) order by cm.position
      ) from public.course_modules cm where cm.course_version_id=cv.id
    ),'[]'::jsonb)
  ) into v_result
  from public.courses c
  join lateral (
    select v.id,v.version_number,v.status,v.syllabus_snapshot,v.normative_snapshot
    from public.course_versions v where v.course_id=c.id
    order by v.version_number desc limit 1
  ) cv on true
  where c.active=true and c.stable_key=p_stable_key
  limit 1;
  return v_result;
end;
$$;
revoke all on function public.training_course_bundle(text) from public;
grant execute on function public.training_course_bundle(text) to anon, authenticated;