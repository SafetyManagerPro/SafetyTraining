-- v47.2: repair ambiguous c.id in the internal-link assignment RPC.
-- Only this function is replaced; all data, courses, permissions and historical assignments are preserved.
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
 insert into private.internal_assignments_v47(organization_id,person_id,course_version_id,token_hash,created_by)
 values(p_org_id,pid,p_course_version_id,p_token_hash,auth.uid())
 on conflict(person_id,course_version_id) do update set token_hash=excluded.token_hash,active=true,updated_at=now()
 returning id into aid;
 return jsonb_build_object('assignment_id',aid,'person_id',pid,'course_title',course_row.title);
end;$func$;

-- Preserve the same authenticated-only grant and organization authorization checks.
revoke all on function public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text) from public, anon;
grant execute on function public.internal_admin_assign_v47(uuid,text,text,text,text,uuid,text) to authenticated;
