-- v47.7: enrich existing internal learner monitoring without changing learner progress.
-- No table mutation, link rotation or course content changes.
create or replace function public.internal_admin_state_v47(p_org_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare chosen uuid; orgs jsonb; cats jsonb; people jsonb; assignments jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'name',o.name) order by o.name),'[]'::jsonb)
 into orgs from public.organizations o where o.active and private.can_manage_training_org(o.id);
 if p_org_id is not null then
   if not exists(select 1 from public.organizations o where o.id=p_org_id and o.active and private.can_manage_training_org(o.id)) then
     raise exception 'organization_not_authorized' using errcode='42501';
   end if;
   chosen:=p_org_id;
 else
   select o.id into chosen from public.organizations o where o.active and private.can_manage_training_org(o.id) order by o.name limit 1;
 end if;
 if chosen is null then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',c.id,'title',c.title,'family',c.family,'version_id',v.id,'version_number',v.version_number,
   'unit_count',(select count(distinct mu.unit_version_id) from public.course_modules m join public.course_module_units mu on mu.module_id=m.id where m.course_version_id=v.id)
 ) order by c.title),'[]'::jsonb) into cats
 from public.courses c
 join lateral (select cv.id,cv.version_number from public.course_versions cv where cv.course_id=c.id and cv.status='published' order by cv.version_number desc limit 1) v on true
 where c.active and (c.owner_organization_id is null or c.owner_organization_id=chosen)
   and coalesce(c.metadata->>'frozen','false')<>'true'
   and coalesce(c.metadata->>'freeze_scope','false')<>'true'
   and exists(select 1 from public.course_modules m join public.course_module_units mu on mu.module_id=m.id where m.course_version_id=v.id);
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',p.id,'first_name',p.first_name,'last_name',p.last_name,'fiscal_code',p.fiscal_code,'email',p.email
 ) order by p.last_name,p.first_name),'[]'::jsonb) into people
 from private.internal_people_v47 p where p.organization_id=chosen;
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',a.id,'course_version_id',a.course_version_id,'person_id',a.person_id,'first_name',p.first_name,'last_name',p.last_name,'fiscal_code',p.fiscal_code,
   'email',p.email,'course_title',c.title,'version_number',v.version_number,'active',a.active,
   'last_opened_at',a.last_opened_at,'started_at',a.started_at,
   'last_unit_version_id',a.last_unit_version_id,
   'last_slide_index',a.last_slide_index,'total_slides',a.total_slides,
   'visited_slides',(select count(*) from private.internal_slide_visits_v47_3 ss where ss.assignment_id=a.id),
   'last_activity_at',greatest(
     (select max(ss.last_viewed_at) from private.internal_slide_visits_v47_3 ss where ss.assignment_id=a.id),
     (select max(x.last_viewed_at) from private.internal_visits_v47 x where x.assignment_id=a.id),
     a.last_opened_at),
   'current_unit_title',(select lu.title from public.learning_unit_versions uv
     join public.learning_units lu on lu.id=uv.learning_unit_id
     where uv.id=a.last_unit_version_id),
   'current_module_title',(select m.title from public.course_modules m
     join public.course_module_units mu on mu.module_id=m.id
     where m.course_version_id=a.course_version_id and mu.unit_version_id=a.last_unit_version_id
     order by m.position,mu.position limit 1),
   'visited_count',(select count(*) from private.internal_visits_v47 x where x.assignment_id=a.id),
   'total_units',(select count(distinct mu.unit_version_id) from public.course_modules m join public.course_module_units mu on mu.module_id=m.id where m.course_version_id=v.id),
   'created_at',a.created_at
 ) order by a.created_at desc),'[]'::jsonb) into assignments
 from private.internal_assignments_v47 a
 join private.internal_people_v47 p on p.id=a.person_id
 join public.course_versions v on v.id=a.course_version_id
 join public.courses c on c.id=v.course_id
 where a.organization_id=chosen;
 return jsonb_build_object('organization_id',chosen,'organizations',orgs,'courses',cats,'people',people,'assignments',assignments);
end;$func$;

revoke all on function public.internal_admin_state_v47(uuid) from public,anon,authenticated;
grant execute on function public.internal_admin_state_v47(uuid) to authenticated;
