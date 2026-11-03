-- v47.9 Internal company label and reversible learner removal. No didactic data changes.
alter table private.internal_people_v47
 add column if not exists company_name text not null default 'Generico',
 add column if not exists archived_at timestamptz;
alter table private.internal_people_v47
 add constraint internal_people_v47_9_company_name_valid
 check(length(btrim(company_name)) between 1 and 180);

-- Existing v47 assignment RPC keeps the exact same signature; the only change
-- is that an intentionally re-added fiscal code can re-activate its anagrafica.
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
 email=coalesce(excluded.email,private.internal_people_v47.email),archived_at=null,updated_at=now()
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

-- A separate wrapper preserves the established 7-parameter assignment RPC and
-- keeps name/company creation atomic even when the frontend refresh is interrupted.
create or replace function public.internal_admin_assign_company_v47_9(
 p_org_id uuid,p_first_name text,p_last_name text,p_fiscal_code text,
 p_email text,p_course_version_id uuid,p_token_hash text,p_company_name text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare assigned jsonb; name_value text;
begin
 if auth.uid() is null or not private.can_manage_training_org(p_org_id) then
  raise exception 'training_admin_scope_required' using errcode='42501';end if;
 name_value:=nullif(btrim(p_company_name),'');
 if name_value is not null and length(name_value)>180 then raise exception 'company_name_too_long' using errcode='22023';end if;
 assigned:=public.internal_admin_assign_v47(
  p_org_id,p_first_name,p_last_name,p_fiscal_code,p_email,p_course_version_id,p_token_hash);
 -- When the field is left blank for a returning learner, keep their company;
 -- new people already default to "Generico".
 if name_value is not null then
  update private.internal_people_v47 set company_name=name_value,updated_at=now()
  where id=(assigned->>'person_id')::uuid and organization_id=p_org_id;
 end if;
 return assigned;
end;$func$;

-- Edit the company independently of enrollments, so reassigning a course is not required.
create or replace function public.internal_admin_company_v47_9(p_person_id uuid,p_company_name text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare person_row private.internal_people_v47%rowtype; name_value text;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 select * into person_row from private.internal_people_v47 where id=p_person_id for update;
 if not found then raise exception 'person_not_found' using errcode='P0002';end if;
 if not private.can_manage_training_org(person_row.organization_id) then
  raise exception 'training_admin_scope_required' using errcode='42501';end if;
 if person_row.archived_at is not null then
  raise exception 'person_archived_restore_first' using errcode='22023';end if;
 name_value:=coalesce(nullif(btrim(p_company_name),''),'Generico');
 if length(name_value)>180 then raise exception 'company_name_too_long' using errcode='22023';end if;
 update private.internal_people_v47 set company_name=name_value,updated_at=now()
 where id=person_row.id;
 return jsonb_build_object('person_id',person_row.id,'company_name',name_value);
end;$func$;

-- Delete from the active list and revoke every personal course link atomically.
-- Historical assignments and slide visits remain in the private schema.
-- Restore never reactivates old links; new links must be generated explicitly.
create or replace function public.internal_admin_archive_person_v47_9(p_person_id uuid,p_restore boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare person_row private.internal_people_v47%rowtype; revoked_count int:=0;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 select * into person_row from private.internal_people_v47 where id=p_person_id for update;
 if not found then raise exception 'person_not_found' using errcode='P0002';end if;
 if not private.can_manage_training_org(person_row.organization_id) then
  raise exception 'training_admin_scope_required' using errcode='42501';end if;
 if p_restore then
  update private.internal_people_v47 set archived_at=null,updated_at=now() where id=person_row.id;
 else
  update private.internal_people_v47 set archived_at=coalesce(archived_at,now()),updated_at=now()
  where id=person_row.id;
  update private.internal_assignments_v47 set active=false,updated_at=now()
  where person_id=person_row.id and organization_id=person_row.organization_id and active;
  get diagnostics revoked_count = row_count;
 end if;
 return jsonb_build_object('person_id',person_row.id,'restored',p_restore,
  'archived',not p_restore,'revoked_links',revoked_count);
end;$func$;

create or replace function public.internal_admin_state_v47(p_org_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare chosen uuid; orgs jsonb; cats jsonb; people jsonb; assignments jsonb; companies jsonb;
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
 select coalesce(jsonb_agg(jsonb_build_object('id',co.id,'name',co.name) order by co.name),'[]'::jsonb)
 into companies from public.companies co where co.organization_id=chosen and co.active;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',p.id,'first_name',p.first_name,'last_name',p.last_name,'fiscal_code',p.fiscal_code,'email',p.email,'company_name',p.company_name,'archived_at',p.archived_at
 ) order by p.last_name,p.first_name),'[]'::jsonb) into people
 from private.internal_people_v47 p where p.organization_id=chosen;
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',a.id,'course_version_id',a.course_version_id,'person_id',a.person_id,'first_name',p.first_name,'last_name',p.last_name,'fiscal_code',p.fiscal_code,
   'email',p.email,'company_name',p.company_name,'archived_at',p.archived_at,'course_title',c.title,'version_number',v.version_number,'active',a.active,
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
 return jsonb_build_object('organization_id',chosen,'organizations',orgs,'courses',cats,'companies',companies,'people',people,'assignments',assignments);
end;$func$;

revoke all on function public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text),
 public.internal_admin_assign_company_v47_9(uuid,text,text,text,text,uuid,text,text),
 public.internal_admin_company_v47_9(uuid,text),
 public.internal_admin_archive_person_v47_9(uuid,boolean),
 public.internal_admin_state_v47(uuid) from public,anon,authenticated;
grant execute on function public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text),
 public.internal_admin_assign_company_v47_9(uuid,text,text,text,text,uuid,text,text),
 public.internal_admin_company_v47_9(uuid,text),
 public.internal_admin_archive_person_v47_9(uuid,boolean),
 public.internal_admin_state_v47(uuid) to authenticated;
