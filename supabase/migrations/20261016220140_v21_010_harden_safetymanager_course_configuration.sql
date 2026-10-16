with changed as (
  update public.integration_course_catalog ic
     set delivery_status='needs_configuration',
         metadata=ic.metadata || jsonb_build_object(
           'governance_normalized_on','2026-10-16',
           'governance_normalization_reason','missing_approved_go_live_mapping'
         ),
         updated_at=now()
   where ic.source_system='safetymanager'
     and ic.delivery_status in ('ready','hybrid')
     and not exists (
       select 1
       from public.courses c
       join public.course_versions cv on cv.course_id=c.id
       where c.id=ic.mapped_course_id
         and c.active
         and cv.status='published'
         and coalesce((c.metadata->>'frozen')::boolean,false)=false
         and coalesce((c.metadata->>'exclude_from_finalization_queue')::boolean,false)=false
         and coalesce(c.metadata->>'finalization_scope','') <> 'reference_library'
         and coalesce((cv.syllabus_snapshot->>'finalization_candidate')::boolean,false)=true
         and coalesce((cv.syllabus_snapshot->>'go_live_ready')::boolean,false)=true
     )
  returning ic.external_course_code
)
insert into private.admin_audit_log(action,entity_type,context)
select 'safetymanager.catalog_governance_normalize','integration_course_catalog',
       jsonb_build_object(
         'normalized_count',count(*),
         'course_codes',jsonb_agg(external_course_code order by external_course_code),
         'reason','missing_approved_go_live_mapping'
       )
from changed
having count(*)>0;

create or replace function public.configure_safetymanager_course(
  p_external_course_code text,
  p_course_id uuid default null,
  p_delivery_status text default 'ready'
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := lower(nullif(btrim(coalesce(p_external_course_code,'')),''));
  v_status text := lower(coalesce(p_delivery_status,''));
  v_course_version_id uuid;
  v_old_course_id uuid;
  v_requires_presence boolean := false;
  v_editions integer := 0;
  v_enrollments integer := 0;
  v_catalog_before jsonb;
  v_catalog_after jsonb;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;

  if v_code is null then
    raise exception 'external_course_code_required' using errcode='22023';
  end if;

  if v_status not in ('needs_configuration','ready','hybrid','unavailable') then
    raise exception 'invalid_delivery_status' using errcode='22023';
  end if;

  select to_jsonb(ic),
         lower(coalesce(ic.metadata->>'requires_presence','false')) in ('true','1','yes')
    into v_catalog_before,v_requires_presence
  from public.integration_course_catalog ic
  where ic.source_system='safetymanager' and ic.external_course_code=v_code
  for update;

  if v_catalog_before is null then
    raise exception 'safetymanager_course_not_found' using errcode='P0002';
  end if;

  if v_requires_presence and v_status='ready' then
    raise exception 'presence_course_requires_hybrid_or_unavailable' using errcode='22023';
  end if;

  select m.course_id into v_old_course_id
  from public.integration_course_mappings m
  where m.source_system='safetymanager' and m.external_course_code=v_code
  limit 1;

  if v_status in ('ready','hybrid') then
    if p_course_id is null then
      raise exception 'approved_go_live_course_required' using errcode='22023';
    end if;

    select cv.id into v_course_version_id
    from public.course_versions cv
    join public.courses c on c.id=cv.course_id
    where cv.course_id=p_course_id
      and cv.status='published'
      and c.active
      and coalesce((c.metadata->>'frozen')::boolean,false)=false
      and coalesce((c.metadata->>'exclude_from_finalization_queue')::boolean,false)=false
      and coalesce(c.metadata->>'finalization_scope','') <> 'reference_library'
      and coalesce((cv.syllabus_snapshot->>'finalization_candidate')::boolean,false)=true
      and coalesce((cv.syllabus_snapshot->>'go_live_ready')::boolean,false)=true
    order by cv.version_number desc
    limit 1;

    if v_course_version_id is null then
      raise exception 'selected_course_has_no_approved_go_live_version' using errcode='22023';
    end if;

    insert into public.integration_course_mappings(
      source_system,external_course_code,course_id,active,metadata
    ) values (
      'safetymanager',v_code,p_course_id,true,
      jsonb_build_object('configured_by_admin',true,'auto_placeholder',false,'go_live_validated',true)
    )
    on conflict (source_system,external_course_code) do update
      set course_id=excluded.course_id,
          active=true,
          metadata=public.integration_course_mappings.metadata || excluded.metadata,
          updated_at=now();

    update public.integration_course_catalog
       set mapped_course_id=p_course_id,
           delivery_status=v_status,
           metadata=metadata || jsonb_build_object(
             'go_live_validated',true,
             'go_live_course_version_id',v_course_version_id,
             'configured_at',now()
           ),
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.course_editions
       set course_version_id=v_course_version_id,
           status=case when status='archived' then status else 'open' end,
           learning_mode=case when v_status='hybrid' then 'blended' else 'elearning_internal' end,
           metadata=metadata || jsonb_build_object('delivery_status',v_status,'go_live_validated',true),
           updated_at=now()
     where metadata->>'source_system'='safetymanager'
       and lower(coalesce(metadata->>'source_course_code',''))=v_code;
    get diagnostics v_editions = row_count;

    if v_old_course_id is not null and v_old_course_id <> p_course_id then
      update public.courses
         set active=false,updated_at=now()
       where id=v_old_course_id
         and metadata->>'source_system'='safetymanager'
         and metadata->>'source_placeholder'='true';
    end if;

  elsif v_status='unavailable' then
    update public.integration_course_catalog
       set delivery_status='unavailable',
           metadata=metadata || jsonb_build_object('configured_at',now()),
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.course_editions
       set status=case when status='archived' then status else 'closed' end,
           metadata=metadata || jsonb_build_object('delivery_status','unavailable'),
           updated_at=now()
     where metadata->>'source_system'='safetymanager'
       and lower(coalesce(metadata->>'source_course_code',''))=v_code;
    get diagnostics v_editions = row_count;

  else
    update public.integration_course_catalog
       set delivery_status='needs_configuration',
           mapped_course_id=null,
           metadata=metadata - 'go_live_validated' - 'go_live_course_version_id'
                    || jsonb_build_object('configured_at',now()),
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.course_editions
       set status=case when status='archived' then status else 'draft' end,
           metadata=metadata || jsonb_build_object('delivery_status','needs_configuration'),
           updated_at=now()
     where metadata->>'source_system'='safetymanager'
       and lower(coalesce(metadata->>'source_course_code',''))=v_code;
    get diagnostics v_editions = row_count;
  end if;

  update public.enrollments e
     set metadata=e.metadata || jsonb_build_object('delivery_status',v_status),
         updated_at=now()
   where exists (
     select 1 from public.course_editions d
     where d.id=e.edition_id
       and d.metadata->>'source_system'='safetymanager'
       and lower(coalesce(d.metadata->>'source_course_code',''))=v_code
   );
  get diagnostics v_enrollments = row_count;

  select to_jsonb(ic) into v_catalog_after
  from public.integration_course_catalog ic
  where ic.source_system='safetymanager' and ic.external_course_code=v_code;

  insert into private.admin_audit_log(
    actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state,context
  ) values (
    auth.uid(),'safetymanager.course_configure','integration_course_catalog',null,null,
    v_catalog_before,v_catalog_after,
    jsonb_build_object(
      'external_course_code',v_code,
      'delivery_status',v_status,
      'mapped_course_id',case when v_status in ('ready','hybrid') then p_course_id else null end,
      'course_version_id',v_course_version_id,
      'updated_editions',v_editions,
      'updated_enrollments',v_enrollments
    )
  );

  return jsonb_build_object(
    'ok',true,
    'course_code',v_code,
    'delivery_status',v_status,
    'mapped_course_id',case when v_status in ('ready','hybrid') then p_course_id else null end,
    'course_version_id',v_course_version_id,
    'updated_editions',v_editions,
    'updated_enrollments',v_enrollments
  );
end;
$$;

revoke all on function public.configure_safetymanager_course(text,uuid,text) from public, anon;
grant execute on function public.configure_safetymanager_course(text,uuid,text) to authenticated;

alter function public.import_safetymanager_package(jsonb) set search_path = '';
alter function public.sync_safetymanager_training_context(jsonb) set search_path = '';
alter function public.preview_safetymanager_composition(text,text[]) set search_path = '';
alter function public.get_course_readiness() set search_path = '';
alter function public.set_course_verification_path(uuid,text,text) set search_path = '';

revoke all on function public.import_safetymanager_package(jsonb) from public, anon;
revoke all on function public.sync_safetymanager_training_context(jsonb) from public, anon;
revoke all on function public.preview_safetymanager_composition(text,text[]) from public, anon;
revoke all on function public.get_course_readiness() from public, anon;
revoke all on function public.set_course_verification_path(uuid,text,text) from public, anon;

grant execute on function public.import_safetymanager_package(jsonb) to authenticated;
grant execute on function public.sync_safetymanager_training_context(jsonb) to authenticated;
grant execute on function public.preview_safetymanager_composition(text,text[]) to authenticated;
grant execute on function public.get_course_readiness() to authenticated;
grant execute on function public.set_course_verification_path(uuid,text,text) to authenticated;
