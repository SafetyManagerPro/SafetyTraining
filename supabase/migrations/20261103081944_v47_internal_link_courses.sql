
-- v47: link-only, non-certifying internal courses. No existing courses/enrollments are changed.
-- Private data is never exposed as tables through the Data API.
create table if not exists private.internal_people_v47 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 first_name text not null, last_name text not null,
 fiscal_code text not null,
 email text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint internal_people_v47_cf_format check (fiscal_code ~ '^[A-Z0-9]{16}$'),
 constraint internal_people_v47_identity unique (organization_id,fiscal_code)
);
create table if not exists private.internal_assignments_v47 (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 person_id uuid not null references private.internal_people_v47(id) on delete restrict,
 course_version_id uuid not null references public.course_versions(id) on delete restrict,
 token_hash text not null unique,
 active boolean not null default true,
 last_unit_version_id uuid references public.learning_unit_versions(id) on delete set null,
 last_opened_at timestamptz,
 started_at timestamptz,
 total_opens integer not null default 0,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint internal_assignment_v47_hash_format check (token_hash ~ '^[a-f0-9]{64}$'),
 constraint internal_assignment_v47_one_version unique(person_id,course_version_id)
);
create index if not exists internal_assignment_v47_org_idx on private.internal_assignments_v47(organization_id,created_at desc);
create table if not exists private.internal_visits_v47 (
 assignment_id uuid not null references private.internal_assignments_v47(id) on delete cascade,
 unit_version_id uuid not null references public.learning_unit_versions(id) on delete restrict,
 first_viewed_at timestamptz not null default now(),
 last_viewed_at timestamptz not null default now(),
 view_count integer not null default 1,
 primary key(assignment_id,unit_version_id)
);
alter table private.internal_people_v47 enable row level security;
alter table private.internal_assignments_v47 enable row level security;
alter table private.internal_visits_v47 enable row level security;
revoke all on private.internal_people_v47, private.internal_assignments_v47, private.internal_visits_v47 from public, anon, authenticated;

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
   'id',a.id,'person_id',a.person_id,'first_name',p.first_name,'last_name',p.last_name,'fiscal_code',p.fiscal_code,
   'email',p.email,'course_title',c.title,'version_number',v.version_number,'active',a.active,
   'last_opened_at',a.last_opened_at,'started_at',a.started_at,
   'last_unit_version_id',a.last_unit_version_id,
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

create or replace function public.internal_admin_assign_v47(
 p_org_id uuid,p_first_name text,p_last_name text,p_fiscal_code text,p_email text,p_course_version_id uuid,p_token_hash text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare pid uuid; aid uuid; cf text; first text; last text; email text; c public.courses%rowtype;
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
 select c.* into c from public.courses c join public.course_versions v on v.course_id=c.id
  where v.id=p_course_version_id and v.status='published' and c.active
  and (c.owner_organization_id is null or c.owner_organization_id=p_org_id)
  and coalesce(c.metadata->>'frozen','false')<>'true'
  and coalesce(c.metadata->>'freeze_scope','false')<>'true'
  and exists(select 1 from public.course_modules m join public.course_module_units mu on mu.module_id=m.id where m.course_version_id=v.id);
 if not found then raise exception 'course_not_available_for_internal_use' using errcode='22023'; end if;
 insert into private.internal_people_v47(organization_id,first_name,last_name,fiscal_code,email)
 values(p_org_id,first,last,cf,email)
 on conflict(organization_id,fiscal_code) do update set first_name=excluded.first_name,last_name=excluded.last_name,
 email=coalesce(excluded.email,private.internal_people_v47.email),updated_at=now()
 returning id into pid;
 insert into private.internal_assignments_v47(organization_id,person_id,course_version_id,token_hash,created_by)
 values(p_org_id,pid,p_course_version_id,p_token_hash,auth.uid())
 on conflict(person_id,course_version_id) do update set token_hash=excluded.token_hash,active=true,updated_at=now()
 returning id into aid;
 return jsonb_build_object('assignment_id',aid,'person_id',pid,'course_title',c.title);
end;$func$;

create or replace function public.internal_admin_link_v47(p_assignment_id uuid,p_token_hash text,p_revoke boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare aid uuid; org_id uuid;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 select a.id,a.organization_id into aid,org_id from private.internal_assignments_v47 a where a.id=p_assignment_id for update;
 if aid is null then raise exception 'assignment_not_found' using errcode='P0002';end if;
 if not private.can_manage_training_org(org_id) then raise exception 'training_admin_scope_required' using errcode='42501';end if;
 if p_revoke then
   update private.internal_assignments_v47 set active=false,updated_at=now() where id=aid;
 else
   if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_link_hash' using errcode='22023'; end if;
   update private.internal_assignments_v47 set token_hash=p_token_hash,active=true,updated_at=now() where id=aid;
 end if;
 return jsonb_build_object('assignment_id',aid,'active',not p_revoke);
end;$func$;

-- Only the server-side service role may call bearer-token lookup & recording. The public viewer cannot invoke SQL RPCs directly.
create or replace function public.internal_link_open_v47(p_token_hash text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare a private.internal_assignments_v47%rowtype; p private.internal_people_v47%rowtype;
 c public.courses%rowtype; v public.course_versions%rowtype; mods jsonb; total integer; seen integer;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_or_revoked_link' using errcode='42501'; end if;
 select * into a from private.internal_assignments_v47 where token_hash=p_token_hash and active;
 if not found then raise exception 'invalid_or_revoked_link' using errcode='42501'; end if;
 select * into p from private.internal_people_v47 where id=a.person_id;
 select * into v from public.course_versions where id=a.course_version_id and status='published';
 if not found then raise exception 'course_unavailable' using errcode='42501';end if;
 select * into c from public.courses where id=v.course_id and active;
 if not found then raise exception 'course_unavailable' using errcode='42501';end if;
 select count(distinct mu.unit_version_id) into total
  from public.course_modules m join public.course_module_units mu on mu.module_id=m.id
  where m.course_version_id=v.id;
 if total=0 then raise exception 'course_unavailable' using errcode='42501';end if;
 select count(*) into seen from private.internal_visits_v47 x where x.assignment_id=a.id;
 select coalesce(jsonb_agg(jsonb_build_object('title',m.title,'module_key',m.module_key,
 'units',coalesce((select jsonb_agg(jsonb_build_object(
 'unit_id',uv.id,'title',lu.title,'content',uv.content
 ) order by mu.position,mu.id)
 from public.course_module_units mu
 join public.learning_unit_versions uv on uv.id=mu.unit_version_id
 join public.learning_units lu on lu.id=uv.learning_unit_id
 where mu.module_id=m.id),'[]'::jsonb)) order by m.position,m.id),'[]'::jsonb) into mods
 from public.course_modules m where m.course_version_id=v.id;
 update private.internal_assignments_v47
 set last_opened_at=now(),total_opens=total_opens+1,updated_at=now()
 where id=a.id;
 return jsonb_build_object('person_first_name',p.first_name,
   'course',jsonb_build_object('title',c.title,'description',c.description,'version',v.version_number,'nominal_minutes',c.nominal_minutes),
   'modules',mods,'last_unit_version_id',a.last_unit_version_id,'visited_unit_ids',
   coalesce((select jsonb_agg(x.unit_version_id) from private.internal_visits_v47 x where x.assignment_id=a.id),'[]'::jsonb),
   'visited_count',seen,'total_units',total,'progress_pct',round(100.0*seen/total));
end;$func$;

create or replace function public.internal_link_visit_v47(p_token_hash text,p_unit_version_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare a private.internal_assignments_v47%rowtype; total integer; seen integer;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_or_revoked_link' using errcode='42501';end if;
 select * into a from private.internal_assignments_v47 where token_hash=p_token_hash and active for update;
 if not found then raise exception 'invalid_or_revoked_link' using errcode='42501';end if;
 if not exists(
   select 1 from public.course_modules m join public.course_module_units mu on mu.module_id=m.id
   where m.course_version_id=a.course_version_id and mu.unit_version_id=p_unit_version_id
 ) then raise exception 'unit_not_assigned' using errcode='42501'; end if;
 insert into private.internal_visits_v47(assignment_id,unit_version_id) values(a.id,p_unit_version_id)
 on conflict(assignment_id,unit_version_id) do update
 set last_viewed_at=now(),view_count=private.internal_visits_v47.view_count+1;
 update private.internal_assignments_v47
 set last_unit_version_id=p_unit_version_id,started_at=coalesce(started_at,now()),updated_at=now()
 where id=a.id;
 select count(distinct mu.unit_version_id) into total from public.course_modules m
 join public.course_module_units mu on mu.module_id=m.id where m.course_version_id=a.course_version_id;
 select count(*) into seen from private.internal_visits_v47 where assignment_id=a.id;
 return jsonb_build_object('visited_count',seen,'total_units',total,'progress_pct',round(100.0*seen/greatest(total,1)),'last_unit_version_id',p_unit_version_id);
end;$func$;

revoke all on function public.internal_admin_state_v47(uuid),public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text),
 public.internal_admin_link_v47(uuid,text,boolean),public.internal_link_open_v47(text),public.internal_link_visit_v47(text,uuid) from public,anon,authenticated;
grant execute on function public.internal_admin_state_v47(uuid),public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text),public.internal_admin_link_v47(uuid,text,boolean) to authenticated;
grant execute on function public.internal_link_open_v47(text),public.internal_link_visit_v47(text,uuid) to service_role;
