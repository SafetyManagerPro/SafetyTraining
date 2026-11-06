-- SafetyTraining v47.11 — read-only, scoped quick copy of an existing regular learner.
-- No table links, no synchronization and no writes to public.learners or public.companies.
-- Importing a candidate NEVER creates an internal learner or course assignment.
create or replace function public.internal_admin_import_candidates_v47_11(
 p_org_id uuid,p_query text default '')
returns jsonb language plpgsql security definer set search_path='' as $func$
declare term text;
        items jsonb;
begin
 if auth.uid() is null or not private.can_manage_training_org(p_org_id) then
  raise exception 'training_admin_scope_required' using errcode='42501';
 end if;
 term:=btrim(coalesce(p_query,''));
 if length(term)>120 then raise exception 'search_too_long' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',src.id,
  'first_name',src.first_name,
  'last_name',src.last_name,
  'fiscal_code',src.fiscal_code,
  'email',src.email,
  'company_name',src.company_name,
  'phone',src.phone,
  'job_title',src.job_title
 ) order by src.last_name,src.first_name,src.id),'[]'::jsonb)
 into items
 from (
  select l.id,l.first_name,l.last_name,
   upper(regexp_replace(coalesce(l.fiscal_code,''),'[[:space:]]','','g')) as fiscal_code,
   coalesce(l.email,'') as email,
   coalesce(co.name,'Generico') as company_name,
   coalesce(l.phone,'') as phone,
   coalesce(l.job_title,'') as job_title
  from public.learners l
  left join public.companies co on co.id=l.company_id and co.organization_id=p_org_id
  where l.organization_id=p_org_id and l.active
   and (term='' or strpos(lower(concat_ws(' ',l.first_name,l.last_name,
    l.fiscal_code,l.email,co.name)),lower(term))>0)
  order by l.last_name,l.first_name,l.id
  limit 60
 ) src;
 return items;
end;$func$;

-- Same contract as v47.9 assignment, with optional phone/job sourced from a
-- regular learner. Supplied values only fill EMPTY fields on the internal record.
-- Existing internal contact details, assignments and progress are not overwritten.
create or replace function public.internal_admin_import_assign_v47_11(
 p_org_id uuid,p_first_name text,p_last_name text,p_fiscal_code text,
 p_email text,p_course_version_id uuid,p_token_hash text,p_company_name text,
 p_phone text,p_job_title text)
returns jsonb language plpgsql security definer set search_path='' as $func$
declare created jsonb;
        phone_value text;
        job_value text;
begin
 if auth.uid() is null or not private.can_manage_training_org(p_org_id) then
  raise exception 'training_admin_scope_required' using errcode='42501';
 end if;
 phone_value:=nullif(btrim(coalesce(p_phone,'')),'');
 job_value:=nullif(btrim(coalesce(p_job_title,'')),'');
 if length(coalesce(phone_value,''))>40 or length(coalesce(job_value,''))>120 then
  raise exception 'import_field_too_long' using errcode='22023';
 end if;
 created:=public.internal_admin_assign_company_v47_9(
  p_org_id,p_first_name,p_last_name,p_fiscal_code,p_email,
  p_course_version_id,p_token_hash,p_company_name);
 if phone_value is not null or job_value is not null then
  update private.internal_people_v47 p set
   phone=coalesce(nullif(p.phone,''),phone_value),
   job_title=coalesce(nullif(p.job_title,''),job_value),
   updated_at=now()
  where p.id=(created->>'person_id')::uuid and p.organization_id=p_org_id
   and ((nullif(p.phone,'') is null and phone_value is not null)
     or (nullif(p.job_title,'') is null and job_value is not null));
 end if;
 return created;
end;$func$;

revoke all on function public.internal_admin_import_candidates_v47_11(uuid,text),
 public.internal_admin_import_assign_v47_11(uuid,text,text,text,text,uuid,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.internal_admin_import_candidates_v47_11(uuid,text),
 public.internal_admin_import_assign_v47_11(uuid,text,text,text,text,uuid,text,text,text,text)
 to authenticated;
