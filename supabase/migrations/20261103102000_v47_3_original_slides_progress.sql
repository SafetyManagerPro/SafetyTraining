-- v47.3: precise original slide resume without changing any course version or content.
alter table private.internal_assignments_v47
 add column if not exists last_slide_index integer,
 add column if not exists total_slides integer;
create table if not exists private.internal_slide_visits_v47_3 (
 assignment_id uuid not null references private.internal_assignments_v47(id) on delete cascade,
 slide_index integer not null check(slide_index>=0 and slide_index<5000),
 first_viewed_at timestamptz not null default now(),
 last_viewed_at timestamptz not null default now(),
 primary key(assignment_id,slide_index)
);
alter table private.internal_slide_visits_v47_3 enable row level security;
revoke all on private.internal_slide_visits_v47_3 from public,anon,authenticated;

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
 'position',m.position,'nominal_minutes',m.nominal_minutes,
 'units',coalesce((select jsonb_agg(jsonb_build_object(
 'unit_id',uv.id,'stable_key',lu.stable_key,'title',lu.title,
 'position',mu.position,'default_minutes',lu.default_minutes,'metadata',lu.metadata,'source_group',lu.source_group,'content',uv.content
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
   'course',jsonb_build_object('title',c.title,'description',c.description,'family',c.family,'stable_key',c.stable_key,
    'metadata',c.metadata,'version',v.version_number,'nominal_minutes',c.nominal_minutes),
   'last_slide_index',a.last_slide_index,'total_slides',a.total_slides,
   'visited_slides',(select count(*) from private.internal_slide_visits_v47_3 ss where ss.assignment_id=a.id),
   'modules',mods,'last_unit_version_id',a.last_unit_version_id,'visited_unit_ids',
   coalesce((select jsonb_agg(x.unit_version_id) from private.internal_visits_v47 x where x.assignment_id=a.id),'[]'::jsonb),
   'visited_count',seen,'total_units',total,'progress_pct',round(100.0*seen/total));
end;$func$;

-- Slide progress is merely the number of slides opened, not official attendance/completion.
-- Every call must present the same 256-bit link; only service_role may execute this RPC.
create or replace function public.internal_link_slide_v47_3(
 p_token_hash text,p_slide_index integer,p_total_slides integer,p_unit_version_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare assignment private.internal_assignments_v47%rowtype;
 slides_seen integer; units_seen integer;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_or_revoked_link' using errcode='42501';end if;
 if p_total_slides is null or p_total_slides<1 or p_total_slides>5000
    or p_slide_index is null or p_slide_index<0 or p_slide_index>=p_total_slides
 then raise exception 'invalid_slide_position' using errcode='22023';end if;
 select * into assignment from private.internal_assignments_v47
 where token_hash=p_token_hash and active for update;
 if not found then raise exception 'invalid_or_revoked_link' using errcode='42501';end if;
 if not exists(select 1 from public.course_versions v where v.id=assignment.course_version_id and v.status='published')
 then raise exception 'course_unavailable' using errcode='42501';end if;
 if p_unit_version_id is not null and not exists(
  select 1 from public.course_modules m join public.course_module_units mu on mu.module_id=m.id
  where m.course_version_id=assignment.course_version_id and mu.unit_version_id=p_unit_version_id
 ) then raise exception 'unit_not_assigned' using errcode='42501';end if;
 insert into private.internal_slide_visits_v47_3(assignment_id,slide_index)
 values(assignment.id,p_slide_index)
 on conflict(assignment_id,slide_index) do update set last_viewed_at=now();
 if p_unit_version_id is not null then
  insert into private.internal_visits_v47(assignment_id,unit_version_id) values(assignment.id,p_unit_version_id)
  on conflict(assignment_id,unit_version_id) do update set last_viewed_at=now(),
   view_count=private.internal_visits_v47.view_count+1;
 end if;
 update private.internal_assignments_v47 set last_slide_index=p_slide_index,total_slides=p_total_slides,
  last_unit_version_id=coalesce(p_unit_version_id,last_unit_version_id),
  started_at=coalesce(started_at,now()),updated_at=now() where id=assignment.id;
 select count(*) into slides_seen from private.internal_slide_visits_v47_3 where assignment_id=assignment.id;
 select count(*) into units_seen from private.internal_visits_v47 where assignment_id=assignment.id;
 return jsonb_build_object('last_slide_index',p_slide_index,'total_slides',p_total_slides,
  'visited_slides',slides_seen,'progress_pct',round(100.0*slides_seen/p_total_slides),
  'visited_count',units_seen);
end;$func$;

revoke all on function public.internal_admin_state_v47(uuid),public.internal_link_open_v47(text),
 public.internal_link_slide_v47_3(text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.internal_admin_state_v47(uuid) to authenticated;
grant execute on function public.internal_link_open_v47(text),
 public.internal_link_slide_v47_3(text,integer,integer,uuid) to service_role;
