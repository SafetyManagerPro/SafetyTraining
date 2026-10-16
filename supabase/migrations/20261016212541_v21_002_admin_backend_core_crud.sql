create or replace function public.admin_save_organization(
  p_organization_id uuid,
  p_name text,
  p_code text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
  v_name text := nullif(btrim(p_name), '');
  v_code text := nullif(upper(btrim(p_code)), '');
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;
  if v_name is null then raise exception 'organization_name_required' using errcode='22023'; end if;

  if p_organization_id is null then
    insert into public.organizations(name,code) values(v_name,v_code) returning id into v_id;
    select to_jsonb(o) into v_after from public.organizations o where o.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state)
    values(auth.uid(),'organization.create','organization',v_id,v_id,v_after);
  else
    select to_jsonb(o) into v_before from public.organizations o where o.id=p_organization_id for update;
    if v_before is null then raise exception 'organization_not_found' using errcode='P0002'; end if;
    update public.organizations set name=v_name,code=v_code where id=p_organization_id returning id into v_id;
    select to_jsonb(o) into v_after from public.organizations o where o.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
    values(auth.uid(),'organization.update','organization',v_id,v_id,v_before,v_after);
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_set_active(
  p_entity_type text,
  p_entity_id uuid,
  p_active boolean
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_org uuid;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;
  if p_entity_type='organization' then
    select to_jsonb(o),o.id into v_before,v_org from public.organizations o where o.id=p_entity_id for update;
    if v_before is null then raise exception 'organization_not_found' using errcode='P0002'; end if;
    if p_active=false and exists(select 1 from public.course_editions e where e.organization_id=p_entity_id and e.status='open') then
      raise exception 'organization_has_open_editions' using errcode='22023';
    end if;
    update public.organizations set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(o) into v_after from public.organizations o where o.id=p_entity_id;
  elsif p_entity_type='company' then
    select to_jsonb(c),c.organization_id into v_before,v_org from public.companies c where c.id=p_entity_id for update;
    if v_before is null then raise exception 'company_not_found' using errcode='P0002'; end if;
    if p_active=false and exists(select 1 from public.course_editions e where e.company_id=p_entity_id and e.status='open') then
      raise exception 'company_has_open_editions' using errcode='22023';
    end if;
    update public.companies set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(c) into v_after from public.companies c where c.id=p_entity_id;
  elsif p_entity_type='learner' then
    select to_jsonb(l),l.organization_id into v_before,v_org from public.learners l where l.id=p_entity_id for update;
    if v_before is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
    update public.learners set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(l) into v_after from public.learners l where l.id=p_entity_id;
  elsif p_entity_type='course' then
    select to_jsonb(c),c.owner_organization_id into v_before,v_org from public.courses c where c.id=p_entity_id for update;
    if v_before is null then raise exception 'course_not_found' using errcode='P0002'; end if;
    if p_active=false and exists(
      select 1 from public.course_editions e join public.course_versions cv on cv.id=e.course_version_id
      where cv.course_id=p_entity_id and e.status='open'
    ) then raise exception 'course_has_open_editions' using errcode='22023'; end if;
    update public.courses set active=coalesce(p_active,false) where id=p_entity_id;
    select to_jsonb(c) into v_after from public.courses c where c.id=p_entity_id;
  else
    raise exception 'unsupported_entity_type' using errcode='22023';
  end if;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state,context)
  values(auth.uid(),case when p_active then 'entity.activate' else 'entity.deactivate' end,p_entity_type,p_entity_id,v_org,v_before,v_after,jsonb_build_object('active',p_active));
  return coalesce(p_active,false);
end;
$$;

create or replace function public.admin_save_course(
  p_course_id uuid,
  p_stable_key text,
  p_title text,
  p_family text,
  p_description text,
  p_nominal_minutes integer,
  p_certification_mode text,
  p_active boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
  v_stable_key text := nullif(lower(btrim(p_stable_key)), '');
  v_title text := nullif(btrim(p_title), '');
  v_latest public.course_versions%rowtype;
begin
  if auth.uid() is null or not private.is_platform_admin() then raise exception 'platform_admin_required' using errcode='42501'; end if;
  if v_title is null then raise exception 'course_title_required' using errcode='22023'; end if;
  if p_nominal_minutes is not null and p_nominal_minutes < 0 then raise exception 'invalid_nominal_minutes' using errcode='22023'; end if;
  if p_certification_mode not in ('internal_learning','certifiable','certified_only') then raise exception 'invalid_certification_mode' using errcode='22023'; end if;

  if p_course_id is null then
    if v_stable_key is null then raise exception 'stable_key_required' using errcode='22023'; end if;
    insert into public.courses(stable_key,title,family,description,nominal_minutes,certification_mode,active)
    values(v_stable_key,v_title,coalesce(nullif(btrim(p_family),''),'other'),nullif(btrim(p_description),''),p_nominal_minutes,p_certification_mode,coalesce(p_active,true))
    returning id into v_id;
    insert into public.course_versions(course_id,version_number,status) values(v_id,1,'draft');
    select to_jsonb(c) into v_after from public.courses c where c.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state,context)
    values(auth.uid(),'course.create','course',v_id,null,v_after,jsonb_build_object('initial_version',1));
  else
    select to_jsonb(c) into v_before from public.courses c where c.id=p_course_id for update;
    if v_before is null then raise exception 'course_not_found' using errcode='P0002'; end if;
    select * into v_latest from public.course_versions cv where cv.course_id=p_course_id order by cv.version_number desc limit 1;
    if v_latest.id is not null
       and coalesce((v_latest.syllabus_snapshot->>'finalization_candidate')::boolean,false)=true
       and coalesce((v_latest.syllabus_snapshot->>'go_live_ready')::boolean,false)=true
       and coalesce(p_active,(v_before->>'active')::boolean) is distinct from (v_before->>'active')::boolean then
      raise exception 'approved_course_active_change_requires_dedicated_operation' using errcode='22023';
    end if;
    update public.courses set
      title=v_title,
      family=coalesce(nullif(btrim(p_family),''),'other'),
      description=nullif(btrim(p_description),''),
      nominal_minutes=p_nominal_minutes,
      certification_mode=p_certification_mode,
      active=coalesce(p_active,active)
    where id=p_course_id returning id into v_id;
    select to_jsonb(c) into v_after from public.courses c where c.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
    values(auth.uid(),'course.update','course',v_id,(v_after->>'owner_organization_id')::uuid,v_before,v_after);
  end if;
  return v_id;
end;
$$;

revoke all on function public.admin_save_organization(uuid,text,text) from public, anon;
revoke all on function public.admin_set_active(text,uuid,boolean) from public, anon;
revoke all on function public.admin_save_course(uuid,text,text,text,text,integer,text,boolean) from public, anon;
grant execute on function public.admin_save_organization(uuid,text,text) to authenticated;
grant execute on function public.admin_set_active(text,uuid,boolean) to authenticated;
grant execute on function public.admin_save_course(uuid,text,text,text,text,integer,text,boolean) to authenticated;
