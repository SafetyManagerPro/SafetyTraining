-- v36 public edition registration, human admin approval, reversible learner archive.
-- Personal details and share secrets are held in private schema, not in the public Data API.
create table if not exists private.course_registration_links_v36 (
 edition_id uuid primary key references public.course_editions(id) on delete cascade,
 token text not null unique,
 active boolean not null default true,
 expires_at timestamptz not null,
 created_by uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint registration_token_format_v36 check (token ~ '^[a-f0-9]{48}$')
);
create table if not exists private.course_registration_requests_v36 (
 id uuid primary key default gen_random_uuid(),
 edition_id uuid not null references public.course_editions(id),
 first_name text not null,
 last_name text not null,
 email text not null,
 phone text,
 fiscal_code text,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 privacy_acknowledged_at timestamptz not null,
 created_at timestamptz not null default now(),
 reviewed_by uuid,
 reviewed_at timestamptz,
 learner_id uuid references public.learners(id) on delete set null,
 constraint registration_request_unique_email_v36 unique(edition_id,email)
);
create index if not exists registration_requests_by_edition_v36 on private.course_registration_requests_v36(edition_id,status,created_at desc);
alter table private.course_registration_links_v36 enable row level security;
alter table private.course_registration_requests_v36 enable row level security;
revoke all on private.course_registration_links_v36, private.course_registration_requests_v36 from public,anon,authenticated;

create or replace function public.admin_registration_links_v36(p_edition_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid; v_result jsonb;
begin
 select organization_id into v_org from public.course_editions where id=p_edition_id;
 if v_org is null then raise exception 'edition_not_found'; end if;
 if auth.uid() is null or not private.can_manage_training_org(v_org) then raise exception 'admin_required' using errcode='42501'; end if;
 select jsonb_build_object('token',token,'active',active,'expires_at',expires_at,
   'pending_count',(select count(*) from private.course_registration_requests_v36 r where r.edition_id=p_edition_id and r.status='pending'))
 into v_result from private.course_registration_links_v36 where edition_id=p_edition_id;
 return coalesce(v_result,'null'::jsonb);
end;$fn$;

create or replace function public.admin_create_registration_link_v36(p_edition_id uuid,p_expires_days integer default 30)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid; v_status text; v_token text; v_exp timestamptz;
begin
 if auth.uid() is null then raise exception 'admin_required' using errcode='42501'; end if;
 if p_expires_days not between 1 and 365 then raise exception 'expiry_out_of_range'; end if;
 select organization_id,status into v_org,v_status from public.course_editions where id=p_edition_id for update;
 if v_org is null then raise exception 'edition_not_found'; end if;
 if not private.can_manage_training_org(v_org) then raise exception 'admin_required' using errcode='42501'; end if;
 if v_status<>'open' then raise exception 'edition_must_be_open'; end if;
 v_token:=encode(extensions.gen_random_bytes(24),'hex'); v_exp:=now()+make_interval(days=>p_expires_days);
 insert into private.course_registration_links_v36(edition_id,token,active,expires_at,created_by)
 values(p_edition_id,v_token,true,v_exp,auth.uid())
 on conflict(edition_id) do update set token=excluded.token,active=true,expires_at=excluded.expires_at,updated_at=now();
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
 values(auth.uid(),'registration.link.issue','course_edition',p_edition_id,v_org,jsonb_build_object('expires_at',v_exp));
 return jsonb_build_object('token',v_token,'active',true,'expires_at',v_exp);
end;$fn$;

create or replace function public.admin_disable_registration_link_v36(p_edition_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid;
begin
 select organization_id into v_org from public.course_editions where id=p_edition_id;
 if v_org is null or auth.uid() is null or not private.can_manage_training_org(v_org) then
  raise exception 'admin_required' using errcode='42501';
 end if;
 update private.course_registration_links_v36 set active=false,updated_at=now() where edition_id=p_edition_id;
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id)
 values(auth.uid(),'registration.link.disable','course_edition',p_edition_id,v_org);
 return true;
end;$fn$;

create or replace function public.public_registration_info_v36(p_token text)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v jsonb;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{48}$' then return jsonb_build_object('available',false);end if;
 select jsonb_build_object('available',true,'edition_title',coalesce(e.title,c.title),
  'course_title',c.title,'expires_at',l.expires_at)
 into v
 from private.course_registration_links_v36 l
 join public.course_editions e on e.id=l.edition_id
 join public.course_versions cv on cv.id=e.course_version_id
 join public.courses c on c.id=cv.course_id
 join public.organizations o on o.id=e.organization_id
 where l.token=p_token and l.active and l.expires_at>now() and e.status='open' and o.active;
 return coalesce(v,jsonb_build_object('available',false));
end;$fn$;

create or replace function public.public_registration_submit_v36(
 p_token text,p_first_name text,p_last_name text,p_email text,
 p_phone text default null,p_fiscal_code text default null,
 p_privacy_acknowledged boolean default false,p_website text default '')
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_edition uuid; v_email text; v_first text; v_last text; v_phone text; v_cf text; v_count int;
begin
 -- Honeypot: return an innocuous receipt without writing data.
 if length(coalesce(p_website,''))>0 then return jsonb_build_object('status','received');end if;
 if not coalesce(p_privacy_acknowledged,false) then raise exception 'privacy_acknowledgement_required';end if;
 if p_token is null or p_token !~ '^[a-f0-9]{48}$' then raise exception 'invalid_or_expired_link';end if;
 select l.edition_id into v_edition
 from private.course_registration_links_v36 l
 join public.course_editions e on e.id=l.edition_id
 join public.organizations o on o.id=e.organization_id
 where l.token=p_token and l.active and l.expires_at>now() and e.status='open' and o.active;
 if v_edition is null then raise exception 'invalid_or_expired_link';end if;
 v_first:=btrim(coalesce(p_first_name,''));v_last:=btrim(coalesce(p_last_name,''));
 v_email:=lower(btrim(coalesce(p_email,'')));v_phone:=nullif(btrim(coalesce(p_phone,'')),'');
 v_cf:=nullif(upper(regexp_replace(coalesce(p_fiscal_code,''),'[^A-Za-z0-9]','','g')),'');
 if length(v_first) not between 2 and 90 or length(v_last) not between 2 and 90
   or length(v_email)>254 or v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
   or length(coalesce(v_phone,''))>32 or length(coalesce(v_cf,''))>16 then
  raise exception 'invalid_registration_fields';
 end if;
 -- A duplicate never discloses whether an email was registered previously.
 if exists(select 1 from private.course_registration_requests_v36 where edition_id=v_edition and email=v_email) then
  return jsonb_build_object('status','received');
 end if;
 -- Conservative edition-wide cap; the admin can rotate/disable links at any time.
 select count(*) into v_count from private.course_registration_requests_v36
 where edition_id=v_edition and created_at>now()-interval '24 hours';
 if v_count>=200 then raise exception 'registration_limit_reached';end if;
 insert into private.course_registration_requests_v36
 (edition_id,first_name,last_name,email,phone,fiscal_code,privacy_acknowledged_at)
 values(v_edition,v_first,v_last,v_email,v_phone,v_cf,now())
 on conflict(edition_id,email) do nothing;
 return jsonb_build_object('status','received');
end;$fn$;

create or replace function public.admin_registration_requests_v36(p_edition_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid; v jsonb;
begin
 select organization_id into v_org from public.course_editions where id=p_edition_id;
 if v_org is null or auth.uid() is null or not private.can_manage_training_org(v_org) then
  raise exception 'admin_required' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'first_name',first_name,'last_name',last_name,
  'email',email,'phone',phone,'fiscal_code',fiscal_code,'status',status,'created_at',created_at,
  'reviewed_at',reviewed_at,'learner_id',learner_id) order by created_at desc),'[]'::jsonb)
 into v from (select * from private.course_registration_requests_v36 where edition_id=p_edition_id
 order by created_at desc limit 250) x;
 return v;
end;$fn$;

create or replace function public.admin_registration_decide_v36(p_request_id uuid,p_approve boolean)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_req private.course_registration_requests_v36%rowtype;v_ed public.course_editions%rowtype;
 v_learner uuid;v_count int;v_existing public.learners%rowtype;
begin
 if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
 select * into v_req from private.course_registration_requests_v36 where id=p_request_id for update;
 if not found then raise exception 'request_not_found';end if;
 select * into v_ed from public.course_editions where id=v_req.edition_id;
 if not private.can_manage_training_org(v_ed.organization_id) then raise exception 'admin_required' using errcode='42501';end if;
 if v_req.status<>'pending' then raise exception 'request_already_reviewed';end if;
 if not p_approve then
  update private.course_registration_requests_v36 set status='rejected',reviewed_by=auth.uid(),reviewed_at=now() where id=p_request_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id)
  values(auth.uid(),'registration.reject','course_edition',v_ed.id,v_ed.organization_id);
  return jsonb_build_object('status','rejected');
 end if;
 if v_ed.status<>'open' then raise exception 'edition_must_be_open';end if;
 -- Detect all same-email or same-CF profiles before linking to prevent identity confusion.
 select count(*) into v_count from public.learners
 where organization_id=v_ed.organization_id and
 (lower(btrim(coalesce(email,'')))=v_req.email or
  (v_req.fiscal_code is not null and fiscal_code_normalized=v_req.fiscal_code));
 if v_count>1 then raise exception 'multiple_matching_learners_manual_review';end if;
 if v_count=1 then
  select * into v_existing from public.learners
  where organization_id=v_ed.organization_id and
  (lower(btrim(coalesce(email,'')))=v_req.email or
   (v_req.fiscal_code is not null and fiscal_code_normalized=v_req.fiscal_code)) for update;
  if v_existing.email is not null and lower(btrim(v_existing.email))<>v_req.email then
   raise exception 'identity_email_conflict_manual_review';
  end if;
  if v_ed.company_id is not null and v_existing.company_id is distinct from v_ed.company_id then
   raise exception 'learner_company_mismatch_manual_review';
  end if;
  if not v_existing.active then raise exception 'learner_inactive_manual_review';end if;
  v_learner:=v_existing.id;
 else
  insert into public.learners(organization_id,company_id,first_name,last_name,email,phone,fiscal_code,active,metadata)
  values(v_ed.organization_id,v_ed.company_id,v_req.first_name,v_req.last_name,v_req.email,
    v_req.phone,v_req.fiscal_code,true,jsonb_build_object('created_by','registration_v36','request_id',p_request_id))
  returning id into v_learner;
 end if;
 insert into public.enrollments(edition_id,learner_id,status,metadata)
 values(v_ed.id,v_learner,'not_started',jsonb_build_object('enrollment_source','public_registration_v36','request_id',p_request_id))
 on conflict(edition_id,learner_id) do nothing;
 update private.course_registration_requests_v36 set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),learner_id=v_learner where id=p_request_id;
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
 values(auth.uid(),'registration.approve','learner',v_learner,v_ed.organization_id,jsonb_build_object('edition_id',v_ed.id,'request_id',p_request_id));
 return jsonb_build_object('status','approved','learner_id',v_learner,'edition_id',v_ed.id);
end;$fn$;

-- Instant, reversible removal of a learner from the active registry.
-- Crucially, NO deletion of attendance, tests, enrollments, or Auth accounts.
create or replace function public.admin_archive_learner_v36(p_learner_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid;v_name text;
begin
 if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
 select organization_id,concat_ws(' ',first_name,last_name) into v_org,v_name
 from public.learners where id=p_learner_id for update;
 if v_org is null then raise exception 'learner_not_found';end if;
 if not private.can_manage_training_org(v_org) then raise exception 'admin_required' using errcode='42501';end if;
 update public.learners set active=false,updated_at=now() where id=p_learner_id;
 update public.learner_account_invitations set status='revoked',revoked_at=now(),token_hash=null,updated_at=now()
 where learner_id=p_learner_id and status<>'accepted';
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
 values(auth.uid(),'learner.archive','learner',p_learner_id,v_org,jsonb_build_object('reason','admin_removed_from_active_registry'));
 return jsonb_build_object('status','archived','learner_id',p_learner_id);
end;$fn$;

revoke execute on function public.admin_registration_links_v36(uuid) from public,anon;
revoke execute on function public.admin_create_registration_link_v36(uuid,integer) from public,anon;
revoke execute on function public.admin_disable_registration_link_v36(uuid) from public,anon;
revoke execute on function public.admin_registration_requests_v36(uuid) from public,anon;
revoke execute on function public.admin_registration_decide_v36(uuid,boolean) from public,anon;
revoke execute on function public.admin_archive_learner_v36(uuid) from public,anon;
grant execute on function public.admin_registration_links_v36(uuid),public.admin_create_registration_link_v36(uuid,integer),
 public.admin_disable_registration_link_v36(uuid),public.admin_registration_requests_v36(uuid),
 public.admin_registration_decide_v36(uuid,boolean),public.admin_archive_learner_v36(uuid) to authenticated;
revoke execute on function public.public_registration_info_v36(text) from public;
revoke execute on function public.public_registration_submit_v36(text,text,text,text,text,text,boolean,text) from public;
grant execute on function public.public_registration_info_v36(text),
 public.public_registration_submit_v36(text,text,text,text,text,text,boolean,text) to anon,authenticated;
