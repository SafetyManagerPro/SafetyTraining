-- Registry identity deduplication for company VAT numbers and learner fiscal codes.
-- NOTE: case-insensitive normalization in this first pass is corrected by v21_018 immediately after it.

alter table public.companies
  add column if not exists vat_number_normalized text
  generated always as (
    case
      when nullif(upper(regexp_replace(coalesce(vat_number,''),'[^A-Z0-9]','','g')),'') is null then null
      when upper(regexp_replace(coalesce(vat_number,''),'[^A-Z0-9]','','g')) ~ '^IT[0-9]{11}$'
        then substring(upper(regexp_replace(coalesce(vat_number,''),'[^A-Z0-9]','','g')) from 3)
      else upper(regexp_replace(coalesce(vat_number,''),'[^A-Z0-9]','','g'))
    end
  ) stored,
  add column if not exists fiscal_code_normalized text
  generated always as (
    nullif(upper(regexp_replace(coalesce(fiscal_code,''),'[^A-Z0-9]','','g')),'')
  ) stored;

alter table public.learners
  add column if not exists fiscal_code_normalized text
  generated always as (
    nullif(upper(regexp_replace(coalesce(fiscal_code,''),'[^A-Z0-9]','','g')),'')
  ) stored;

create unique index if not exists companies_unique_vat_normalized_per_org
  on public.companies(organization_id, vat_number_normalized)
  where vat_number_normalized is not null;

create unique index if not exists learners_unique_fiscal_code_normalized_per_org
  on public.learners(organization_id, fiscal_code_normalized)
  where fiscal_code_normalized is not null;

create index if not exists companies_fiscal_code_normalized_idx
  on public.companies(organization_id, fiscal_code_normalized)
  where fiscal_code_normalized is not null;

create or replace function public.admin_registry_conflict(
  p_entity_type text,
  p_organization_id uuid,
  p_identifier text,
  p_exclude_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := nullif(upper(regexp_replace(coalesce(p_identifier,''),'[^A-Z0-9]','','g')),'');
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authenticated_session_required' using errcode='42501';
  end if;
  if p_entity_type = 'company' then
    if not private.can_manage_company_registry(p_organization_id) then
      raise exception 'organization_admin_required' using errcode='42501';
    end if;
    if v_key ~ '^IT[0-9]{11}$' then v_key := substring(v_key from 3); end if;
    if v_key is null then return null; end if;
    select jsonb_build_object(
      'entity_type','company','id',c.id,'label',c.name,'active',c.active,
      'vat_number',c.vat_number,'fiscal_code',c.fiscal_code
    ) into v_result
    from public.companies c
    where c.organization_id=p_organization_id
      and c.vat_number_normalized=v_key
      and (p_exclude_id is null or c.id<>p_exclude_id)
    limit 1;
    return v_result;
  elsif p_entity_type = 'learner' then
    if not private.can_manage_training_org(p_organization_id) then
      raise exception 'training_admin_scope_required' using errcode='42501';
    end if;
    if v_key is null then return null; end if;
    select jsonb_build_object(
      'entity_type','learner','id',l.id,
      'label',coalesce(nullif(btrim(concat_ws(' ',l.first_name,l.last_name)),''),l.email,'Corsista'),
      'active',l.active,'fiscal_code',l.fiscal_code,
      'company_id',l.company_id,'company_name',c.name
    ) into v_result
    from public.learners l
    left join public.companies c on c.id=l.company_id
    where l.organization_id=p_organization_id
      and l.fiscal_code_normalized=v_key
      and (p_exclude_id is null or l.id<>p_exclude_id)
    limit 1;
    return v_result;
  end if;
  raise exception 'unsupported_registry_entity_type' using errcode='22023';
end;
$$;

revoke execute on function public.admin_registry_conflict(text,uuid,text,uuid) from public, anon;
grant execute on function public.admin_registry_conflict(text,uuid,text,uuid) to authenticated;

create or replace function public.admin_save_company(p_company_id uuid, p_organization_id uuid, p_name text, p_vat_number text, p_fiscal_code text, p_ateco_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
  v_existing_id uuid;
  v_name text := nullif(btrim(p_name), '');
  v_vat text := nullif(upper(regexp_replace(btrim(coalesce(p_vat_number,'')),'\s+','','g')), '');
  v_fiscal text := nullif(upper(regexp_replace(btrim(coalesce(p_fiscal_code,'')),'\s+','','g')), '');
  v_vat_key text;
begin
  if auth.uid() is null or not private.can_manage_company_registry(p_organization_id) then
    raise exception 'organization_admin_required' using errcode='42501';
  end if;
  if v_name is null then raise exception 'company_name_required' using errcode='22023'; end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;

  v_vat_key := nullif(upper(regexp_replace(coalesce(v_vat,''),'[^A-Z0-9]','','g')),'');
  if v_vat_key ~ '^IT[0-9]{11}$' then v_vat_key := substring(v_vat_key from 3); end if;
  if v_vat_key is not null then
    select c.id into v_existing_id
    from public.companies c
    where c.organization_id=p_organization_id
      and c.vat_number_normalized=v_vat_key
      and (p_company_id is null or c.id<>p_company_id)
    limit 1;
    if v_existing_id is not null then
      raise exception 'company_vat_duplicate' using errcode='23505', detail=v_existing_id::text;
    end if;
  end if;

  if p_company_id is null then
    insert into public.companies(organization_id,name,vat_number,fiscal_code,ateco_code)
    values(p_organization_id,v_name,v_vat,v_fiscal,nullif(btrim(p_ateco_code),''))
    returning id into v_id;
    select to_jsonb(c) into v_after from public.companies c where c.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state)
    values(auth.uid(),'company.create','company',v_id,p_organization_id,v_after);
  else
    select to_jsonb(c) into v_before from public.companies c where c.id=p_company_id for update;
    if v_before is null then raise exception 'company_not_found' using errcode='P0002'; end if;
    if (v_before->>'organization_id')::uuid <> p_organization_id then
      raise exception 'company_organization_change_requires_dedicated_operation' using errcode='22023';
    end if;
    update public.companies set
      name=v_name,
      vat_number=v_vat,
      fiscal_code=v_fiscal,
      ateco_code=nullif(btrim(p_ateco_code),'')
    where id=p_company_id returning id into v_id;
    select to_jsonb(c) into v_after from public.companies c where c.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
    values(auth.uid(),'company.update','company',v_id,p_organization_id,v_before,v_after);
  end if;
  return v_id;
end;
$$;

create or replace function public.admin_save_learner(p_learner_id uuid, p_organization_id uuid, p_company_id uuid, p_first_name text, p_last_name text, p_email text, p_fiscal_code text, p_job_title text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_id uuid;
  v_existing_id uuid;
  v_email text := nullif(lower(btrim(p_email)), '');
  v_fiscal text := nullif(upper(regexp_replace(btrim(coalesce(p_fiscal_code,'')),'\s+','','g')), '');
  v_fiscal_key text := nullif(upper(regexp_replace(coalesce(v_fiscal,''),'[^A-Z0-9]','','g')),'');
begin
  if auth.uid() is null or not private.can_manage_training_org(p_organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if not exists(select 1 from public.organizations o where o.id=p_organization_id and o.active) then
    raise exception 'active_organization_required' using errcode='23503';
  end if;
  if p_company_id is not null and not exists(
    select 1 from public.companies c where c.id=p_company_id and c.organization_id=p_organization_id and c.active
  ) then raise exception 'company_not_compatible_with_organization' using errcode='23503'; end if;

  if v_fiscal_key is not null then
    select l.id into v_existing_id
    from public.learners l
    where l.organization_id=p_organization_id
      and l.fiscal_code_normalized=v_fiscal_key
      and (p_learner_id is null or l.id<>p_learner_id)
    limit 1;
    if v_existing_id is not null then
      raise exception 'learner_fiscal_code_duplicate' using errcode='23505', detail=v_existing_id::text;
    end if;
  end if;

  if p_learner_id is null then
    insert into public.learners(organization_id,company_id,first_name,last_name,email,fiscal_code,job_title)
    values(p_organization_id,p_company_id,nullif(btrim(p_first_name),''),nullif(btrim(p_last_name),''),v_email,v_fiscal,nullif(btrim(p_job_title),''))
    returning id into v_id;
    select to_jsonb(l) into v_after from public.learners l where l.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,after_state)
    values(auth.uid(),'learner.create','learner',v_id,p_organization_id,v_after);
  else
    select to_jsonb(l) into v_before from public.learners l where l.id=p_learner_id for update;
    if v_before is null then raise exception 'learner_not_found' using errcode='P0002'; end if;
    if (v_before->>'organization_id')::uuid <> p_organization_id then
      raise exception 'learner_organization_change_requires_dedicated_operation' using errcode='22023';
    end if;
    update public.learners set
      company_id=p_company_id,
      first_name=nullif(btrim(p_first_name),''),
      last_name=nullif(btrim(p_last_name),''),
      email=v_email,
      fiscal_code=v_fiscal,
      job_title=nullif(btrim(p_job_title),'')
    where id=p_learner_id returning id into v_id;
    select to_jsonb(l) into v_after from public.learners l where l.id=v_id;
    insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,before_state,after_state)
    values(auth.uid(),'learner.update','learner',v_id,p_organization_id,v_before,v_after);
  end if;
  return v_id;
end;
$$;

revoke execute on function public.admin_save_company(uuid,uuid,text,text,text,text) from public, anon;
grant execute on function public.admin_save_company(uuid,uuid,text,text,text,text) to authenticated;
revoke execute on function public.admin_save_learner(uuid,uuid,uuid,text,text,text,text,text) from public, anon;
grant execute on function public.admin_save_learner(uuid,uuid,uuid,text,text,text,text,text) to authenticated;
