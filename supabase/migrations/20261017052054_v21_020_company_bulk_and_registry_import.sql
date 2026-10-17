create or replace function public.admin_company_bulk_context(p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_company public.companies%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_company from public.companies where id=p_company_id;
  if not found then raise exception 'company_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_company.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;

  return jsonb_build_object(
    'company',jsonb_build_object(
      'id',v_company.id,'organization_id',v_company.organization_id,'name',v_company.name,
      'vat_number',v_company.vat_number,'fiscal_code',v_company.fiscal_code,'ateco_code',v_company.ateco_code,'active',v_company.active
    ),
    'learners',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',l.id,'first_name',l.first_name,'last_name',l.last_name,'email',l.email,'phone',l.phone,
        'fiscal_code',l.fiscal_code,'job_title',l.job_title,'active',l.active,'auth_user_id',l.auth_user_id,
        'invite_status',i.status,'invite_channel',i.delivery_channel,'invite_expires_at',i.expires_at,'invite_last_sent_at',i.last_sent_at
      ) order by l.last_name,l.first_name)
      from public.learners l
      left join public.learner_account_invitations i on i.learner_id=l.id
      where l.company_id=v_company.id
    ),'[]'::jsonb),
    'editions',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',e.id,'title',coalesce(e.title,c.title),'status',e.status,'course_title',c.title,
        'course_version_id',e.course_version_id,'available_from',e.available_from,'available_until',e.available_until,
        'company_id',e.company_id
      ) order by e.created_at desc)
      from public.course_editions e
      join public.course_versions cv on cv.id=e.course_version_id
      join public.courses c on c.id=cv.course_id
      where e.organization_id=v_company.organization_id
        and e.status='open'
        and (e.company_id is null or e.company_id=v_company.id)
    ),'[]'::jsonb)
  );
end;
$$;

revoke execute on function public.admin_company_bulk_context(uuid) from public, anon;
grant execute on function public.admin_company_bulk_context(uuid) to authenticated;

create or replace function public.admin_import_learners_preview(
  p_company_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_company public.companies%rowtype;
  v_row jsonb;
  v_out jsonb := '[]'::jsonb;
  v_n integer := 0;
  v_first text;
  v_last text;
  v_email text;
  v_phone text;
  v_cf text;
  v_cf_key text;
  v_existing public.learners%rowtype;
  v_seen text[] := array[]::text[];
  v_class text;
  v_reason text;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_company from public.companies where id=p_company_id;
  if not found then raise exception 'company_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_company.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if jsonb_typeof(p_rows)<>'array' then raise exception 'rows_array_required' using errcode='22023'; end if;
  if jsonb_array_length(p_rows)>500 then raise exception 'import_row_limit_500' using errcode='22023'; end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_n := v_n + 1;
    v_first := nullif(btrim(coalesce(v_row->>'first_name','')), '');
    v_last := nullif(btrim(coalesce(v_row->>'last_name','')), '');
    v_email := nullif(lower(btrim(coalesce(v_row->>'email',''))), '');
    v_phone := nullif(regexp_replace(btrim(coalesce(v_row->>'phone','')), '[^0-9+]', '', 'g'), '');
    v_cf := nullif(upper(regexp_replace(upper(btrim(coalesce(v_row->>'fiscal_code',''))),'[^A-Z0-9]','','g')), '');
    v_cf_key := v_cf;
    v_existing := null;
    v_class := null;
    v_reason := null;

    if v_first is null and v_last is null then
      v_class := 'invalid'; v_reason := 'name_required';
    elsif v_email is not null and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      v_class := 'invalid'; v_reason := 'invalid_email';
    elsif v_phone is not null and length(regexp_replace(v_phone,'\D','','g')) < 7 then
      v_class := 'invalid'; v_reason := 'invalid_phone';
    elsif v_cf_key is null then
      v_class := 'needs_review'; v_reason := 'fiscal_code_missing';
    elsif v_cf_key = any(v_seen) then
      v_class := 'duplicate_in_file'; v_reason := 'same_fiscal_code_repeated';
    else
      v_seen := array_append(v_seen,v_cf_key);
      select * into v_existing
      from public.learners l
      where l.organization_id=v_company.organization_id and l.fiscal_code_normalized=v_cf_key
      limit 1;
      if found then
        if v_existing.company_id=v_company.id then
          v_class := 'existing_same_company'; v_reason := 'reuse_existing';
        else
          v_class := 'existing_other_company'; v_reason := 'explicit_link_required';
        end if;
      else
        v_class := 'create'; v_reason := 'new_fiscal_code';
      end if;
    end if;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'row_no',v_n,
      'classification',v_class,
      'reason',v_reason,
      'first_name',v_first,
      'last_name',v_last,
      'email',v_email,
      'phone',v_phone,
      'fiscal_code',v_cf,
      'job_title',nullif(btrim(coalesce(v_row->>'job_title','')),''),
      'existing_learner_id',case when v_existing.id is null then null else v_existing.id end,
      'existing_company_id',case when v_existing.id is null then null else v_existing.company_id end,
      'existing_name',case when v_existing.id is null then null else nullif(btrim(concat_ws(' ',v_existing.first_name,v_existing.last_name)),'') end
    ));
  end loop;

  return jsonb_build_object(
    'company_id',v_company.id,'company_name',v_company.name,'organization_id',v_company.organization_id,
    'rows',v_out,
    'summary',jsonb_build_object(
      'total',jsonb_array_length(v_out),
      'create',(select count(*) from jsonb_array_elements(v_out) x where x->>'classification'='create'),
      'existing_same_company',(select count(*) from jsonb_array_elements(v_out) x where x->>'classification'='existing_same_company'),
      'existing_other_company',(select count(*) from jsonb_array_elements(v_out) x where x->>'classification'='existing_other_company'),
      'needs_review',(select count(*) from jsonb_array_elements(v_out) x where x->>'classification'='needs_review'),
      'invalid',(select count(*) from jsonb_array_elements(v_out) x where x->>'classification' in ('invalid','duplicate_in_file'))
    )
  );
end;
$$;

revoke execute on function public.admin_import_learners_preview(uuid,jsonb) from public, anon;
grant execute on function public.admin_import_learners_preview(uuid,jsonb) to authenticated;

create or replace function public.admin_import_learners_apply(
  p_company_id uuid,
  p_rows jsonb,
  p_source text default 'registry_import'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_company public.companies%rowtype;
  v_row jsonb;
  v_action text;
  v_first text;
  v_last text;
  v_email text;
  v_phone text;
  v_cf text;
  v_cf_key text;
  v_job text;
  v_existing public.learners%rowtype;
  v_id uuid;
  v_created integer := 0;
  v_reused integer := 0;
  v_linked integer := 0;
  v_skipped integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_n integer := 0;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into v_company from public.companies where id=p_company_id for update;
  if not found then raise exception 'company_not_found' using errcode='P0002'; end if;
  if not private.can_manage_training_org(v_company.organization_id) then
    raise exception 'training_admin_scope_required' using errcode='42501';
  end if;
  if not v_company.active then raise exception 'company_inactive' using errcode='22023'; end if;
  if jsonb_typeof(p_rows)<>'array' then raise exception 'rows_array_required' using errcode='22023'; end if;
  if jsonb_array_length(p_rows)>500 then raise exception 'import_row_limit_500' using errcode='22023'; end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_n := v_n + 1;
    begin
      v_action := lower(btrim(coalesce(v_row->>'action','skip')));
      if v_action='skip' then v_skipped:=v_skipped+1; continue; end if;
      if v_action not in ('create','create_reviewed','reuse','link') then raise exception 'invalid_import_action'; end if;

      v_first := nullif(btrim(coalesce(v_row->>'first_name','')), '');
      v_last := nullif(btrim(coalesce(v_row->>'last_name','')), '');
      v_email := nullif(lower(btrim(coalesce(v_row->>'email',''))), '');
      v_phone := nullif(regexp_replace(btrim(coalesce(v_row->>'phone','')), '[^0-9+]', '', 'g'), '');
      v_cf := nullif(upper(regexp_replace(upper(btrim(coalesce(v_row->>'fiscal_code',''))),'[^A-Z0-9]','','g')), '');
      v_cf_key := v_cf;
      v_job := nullif(btrim(coalesce(v_row->>'job_title','')), '');

      if v_first is null and v_last is null then raise exception 'name_required'; end if;
      if v_email is not null and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email'; end if;
      if v_phone is not null and length(regexp_replace(v_phone,'\D','','g'))<7 then raise exception 'invalid_phone'; end if;

      v_existing := null;
      if v_cf_key is not null then
        select * into v_existing from public.learners l
        where l.organization_id=v_company.organization_id and l.fiscal_code_normalized=v_cf_key
        limit 1 for update;
      end if;

      if v_action='reuse' then
        if v_existing.id is null then raise exception 'existing_learner_not_found'; end if;
        v_reused:=v_reused+1;
      elsif v_action='link' then
        if v_existing.id is null then raise exception 'existing_learner_not_found'; end if;
        update public.learners
           set company_id=v_company.id,
               email=coalesce(email,v_email),
               phone=coalesce(phone,v_phone),
               job_title=coalesce(job_title,v_job),
               updated_at=now()
         where id=v_existing.id;
        v_linked:=v_linked+1;
      elsif v_action in ('create','create_reviewed') then
        if v_action='create' and v_cf_key is null then raise exception 'fiscal_code_required_for_auto_create'; end if;
        if v_action='create_reviewed' and v_cf_key is null and v_email is null and v_phone is null then
          raise exception 'reviewed_create_requires_contact';
        end if;
        if v_existing.id is not null then
          if v_existing.company_id=v_company.id then v_reused:=v_reused+1;
          else raise exception 'existing_learner_requires_explicit_link'; end if;
        else
          insert into public.learners(organization_id,company_id,first_name,last_name,email,phone,fiscal_code,job_title,active)
          values(v_company.organization_id,v_company.id,v_first,v_last,v_email,v_phone,v_cf,v_job,true)
          returning id into v_id;
          v_created:=v_created+1;
        end if;
      end if;
    exception when others then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row_no',v_n,'error',sqlerrm,'fiscal_code',v_cf,'email',v_email));
    end;
  end loop;

  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'learner.import','company',v_company.id,v_company.organization_id,
    jsonb_build_object('source',coalesce(nullif(btrim(p_source),''),'registry_import'),'created',v_created,'reused',v_reused,'linked',v_linked,'skipped',v_skipped,'errors',jsonb_array_length(v_errors)));

  return jsonb_build_object('company_id',v_company.id,'created',v_created,'reused',v_reused,'linked',v_linked,'skipped',v_skipped,'errors',v_errors);
end;
$$;

revoke execute on function public.admin_import_learners_apply(uuid,jsonb,text) from public, anon;
grant execute on function public.admin_import_learners_apply(uuid,jsonb,text) to authenticated;
