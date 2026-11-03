-- v47.10: Dedicated internal learner registry editor, independently of course assignments.
-- Optional extra fields; no existing person, enrollment, lesson or progress is rewritten.
alter table private.internal_people_v47
 add column if not exists phone text,
 add column if not exists job_title text,
 add column if not exists birth_date date,
 add column if not exists birth_city text,
 add column if not exists residence_address text,
 add column if not exists notes text;

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
  'id',p.id,'first_name',p.first_name,'last_name',p.last_name,'fiscal_code',p.fiscal_code,'email',p.email,'company_name',p.company_name,'archived_at',p.archived_at,'updated_at',p.updated_at,
  'phone',p.phone,'job_title',p.job_title,'birth_date',p.birth_date,
  'birth_city',p.birth_city,'residence_address',p.residence_address,'notes',p.notes
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

create or replace function public.internal_admin_update_person_v47_10(
 p_person_id uuid, p_first_name text, p_last_name text, p_fiscal_code text,
 p_email text, p_company_name text, p_phone text, p_job_title text,
 p_birth_date date, p_birth_city text, p_residence_address text,
 p_notes text, p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare person_row private.internal_people_v47%rowtype;
        first_value text;last_value text;cf_value text;email_value text;
        company_value text;phone_value text;job_value text;city_value text;
        address_value text;notes_value text;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 select * into person_row from private.internal_people_v47 p where p.id=p_person_id for update;
 if not found then raise exception 'person_not_found' using errcode='P0002';end if;
 if not private.can_manage_training_org(person_row.organization_id) then
  raise exception 'training_admin_scope_required' using errcode='42501';end if;
 if person_row.archived_at is not null then raise exception 'person_archived_restore_first' using errcode='22023';end if;
 if p_expected_updated_at is null or person_row.updated_at is distinct from p_expected_updated_at then
  raise exception 'person_modified_reload_before_save' using errcode='40001';end if;

 first_value:=btrim(coalesce(p_first_name,''));
 last_value:=btrim(coalesce(p_last_name,''));
 cf_value:=upper(regexp_replace(coalesce(p_fiscal_code,''),'[[:space:]]','','g'));
 email_value:=nullif(lower(btrim(coalesce(p_email,''))),'');
 company_value:=coalesce(nullif(btrim(p_company_name),''),'Generico');
 phone_value:=nullif(btrim(coalesce(p_phone,'')),'');
 job_value:=nullif(btrim(coalesce(p_job_title,'')),'');
 city_value:=nullif(btrim(coalesce(p_birth_city,'')),'');
 address_value:=nullif(btrim(coalesce(p_residence_address,'')),'');
 notes_value:=nullif(btrim(coalesce(p_notes,'')),'');
 if length(first_value) not between 2 and 120 or length(last_value) not between 2 and 120 then
  raise exception 'name_required_or_too_long' using errcode='22023';end if;
 if cf_value !~ '^[A-Z0-9]{16}$' then raise exception 'fiscal_code_invalid' using errcode='22023';end if;
 if email_value is not null and
  (length(email_value)>250 or email_value !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then
  raise exception 'email_invalid' using errcode='22023';end if;
 if length(company_value)>180 or length(coalesce(phone_value,''))>40
  or length(coalesce(job_value,''))>120
  or length(coalesce(city_value,''))>120
  or length(coalesce(address_value,''))>250
  or length(coalesce(notes_value,''))>1500 then
  raise exception 'registry_field_too_long' using errcode='22023';end if;
 if p_birth_date>current_date then raise exception 'birth_date_future' using errcode='22023';end if;
 if exists(select 1 from private.internal_people_v47 other
  where other.organization_id=person_row.organization_id
   and other.fiscal_code=cf_value and other.id<>person_row.id) then
  raise exception 'fiscal_code_already_used' using errcode='23505';end if;

 update private.internal_people_v47 set
  first_name=first_value,last_name=last_value,fiscal_code=cf_value,email=email_value,
  company_name=company_value,phone=phone_value,job_title=job_value,
  birth_date=p_birth_date,birth_city=city_value,
  residence_address=address_value,notes=notes_value,updated_at=now()
 where id=person_row.id and organization_id=person_row.organization_id;
 return jsonb_build_object('person_id',person_row.id,'updated',true);
end;$func$;

revoke all on function public.internal_admin_update_person_v47_10(
 uuid,text,text,text,text,text,text,text,date,text,text,text,timestamptz
) from public,anon,authenticated;
grant execute on function public.internal_admin_update_person_v47_10(
 uuid,text,text,text,text,text,text,text,date,text,text,text,timestamptz
) to authenticated;

-- The state RPC was already restricted to authorized organization admins.
revoke all on function public.internal_admin_state_v47(uuid) from public,anon,authenticated;
grant execute on function public.internal_admin_state_v47(uuid) to authenticated;
