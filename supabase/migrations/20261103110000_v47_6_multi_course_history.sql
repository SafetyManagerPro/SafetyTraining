-- v47.6: concurrent courses per internal learner + safely repeat a course over time.
-- No changes to published courses, learners' original evidence or any existing rows.
-- Active duplicate course assignments are forbidden, but old cycles remain permanent.
create unique index if not exists internal_assignment_active_course_v47_6
  on private.internal_assignments_v47(person_id,course_version_id) where active;
alter table private.internal_assignments_v47
  drop constraint if exists internal_assignment_v47_one_version;

create or replace function public.internal_admin_assign_v47(
 p_org_id uuid,p_first_name text,p_last_name text,p_fiscal_code text,p_email text,p_course_version_id uuid,p_token_hash text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare pid uuid; aid uuid; cf text; first text; last text; email text; course_row public.courses%rowtype;
begin
 if auth.uid() is null or not private.can_manage_training_org(p_org_id) then raise exception 'training_admin_scope_required' using errcode='42501'; end if;
 if not exists(select 1 from public.organizations where id=p_org_id and active) then raise exception 'organization_inactive' using errcode='22023';end if;
 first:=btrim(coalesce(p_first_name,''));last:=btrim(coalesce(p_last_name,''));
 cf:=upper(regexp_replace(coalesce(p_fiscal_code,''),'[[:space:]]','','g'));
 email:=nullif(lower(btrim(coalesce(p_email,''))),'');
 if length(first)<2 or length(last)<2 or length(first)>120 or length(last)>120 then raise exception 'name_required' using errcode='22023'; end if;
 if cf !~ '^[A-Z0-9]{16}$' then raise exception 'fiscal_code_invalid' using errcode='22023'; end if;
 if email is not null and (length(email)>250 or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'email_invalid' using errcode='22023';end if;
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_link_hash' using errcode='22023'; end if;
 select course_catalog.* into course_row from public.courses course_catalog join public.course_versions v on v.course_id=course_catalog.id
  where v.id=p_course_version_id and v.status='published' and course_catalog.active
  and (course_catalog.owner_organization_id is null or course_catalog.owner_organization_id=p_org_id)
  and coalesce(course_catalog.metadata->>'frozen','false')<>'true'
  and coalesce(course_catalog.metadata->>'freeze_scope','false')<>'true'
  and exists(select 1 from public.course_modules m join public.course_module_units mu on mu.module_id=m.id where m.course_version_id=v.id);
 if not found then raise exception 'course_not_available_for_internal_use' using errcode='22023'; end if;
 insert into private.internal_people_v47(organization_id,first_name,last_name,fiscal_code,email)
 values(p_org_id,first,last,cf,email)
 on conflict(organization_id,fiscal_code) do update set first_name=excluded.first_name,last_name=excluded.last_name,
 email=coalesce(excluded.email,private.internal_people_v47.email),updated_at=now()
 returning id into pid;
 -- The same person can follow MANY different courses in parallel. Each completed
 -- or revoked cycle of the SAME course is preserved, never overwritten.
 if exists (select 1 from private.internal_assignments_v47 a
   where a.person_id=pid and a.course_version_id=p_course_version_id and a.active)
 then raise exception 'course_already_assigned' using errcode='23505'; end if;
 insert into private.internal_assignments_v47(organization_id,person_id,course_version_id,token_hash,created_by)
 values(p_org_id,pid,p_course_version_id,p_token_hash,auth.uid())
 returning id into aid;
 return jsonb_build_object('assignment_id',aid,'person_id',pid,'course_title',course_row.title);
end;$func$;

-- Preserve the same authenticated-only grant and organization authorization checks.

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
   'last_activity_at',(select max(x.last_viewed_at) from private.internal_visits_v47 x where x.assignment_id=a.id),
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

-- Explicitly repeat an active course: archive its link, keep all visits/progress,
-- create a fresh independent assignment for the SAME person and published version.
create or replace function public.internal_admin_repeat_v47_6(p_assignment_id uuid,p_token_hash text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare previous_assignment private.internal_assignments_v47%rowtype;
        person_row private.internal_people_v47%rowtype;
        created jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 select * into previous_assignment from private.internal_assignments_v47 a
 where a.id=p_assignment_id for update;
 if not found then raise exception 'assignment_not_found' using errcode='P0002'; end if;
 if not private.can_manage_training_org(previous_assignment.organization_id) then
  raise exception 'training_admin_scope_required' using errcode='42501'; end if;
 if not previous_assignment.active then raise exception 'assignment_not_active' using errcode='22023'; end if;
 select * into person_row from private.internal_people_v47
 where id=previous_assignment.person_id and organization_id=previous_assignment.organization_id;
 if not found then raise exception 'person_not_found' using errcode='P0002';end if;
 update private.internal_assignments_v47 set active=false,updated_at=now()
 where id=previous_assignment.id;
 -- This checks current course publishing/organization authorization, and inserts
 -- a new assignment. Failure rolls the archive back in the same transaction.
 created:=public.internal_admin_assign_v47(
  previous_assignment.organization_id,person_row.first_name,person_row.last_name,
  person_row.fiscal_code,person_row.email,previous_assignment.course_version_id,p_token_hash);
 return created||jsonb_build_object('repeated_from',previous_assignment.id);
end;$func$;

revoke all on function public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text),
 public.internal_admin_state_v47(uuid),
 public.internal_admin_repeat_v47_6(uuid,text) from public,anon,authenticated;
grant execute on function public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text),
 public.internal_admin_state_v47(uuid), public.internal_admin_repeat_v47_6(uuid,text)
 to authenticated;
