-- SafetyTraining v20.015
-- Versioned, idempotent import bridge from SafetyManager Pro.

create table if not exists public.integration_course_mappings (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  external_course_code text not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_system, external_course_code)
);
create index if not exists integration_course_mappings_course_idx on public.integration_course_mappings(course_id);
alter table public.integration_course_mappings enable row level security;
create policy integration_course_mappings_admin_read on public.integration_course_mappings for select to authenticated using (private.is_platform_admin());
create policy integration_course_mappings_admin_manage on public.integration_course_mappings for all to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
create trigger integration_course_mappings_touch before update on public.integration_course_mappings for each row execute function public.touch_updated_at();

insert into public.integration_course_mappings(source_system, external_course_code, course_id, metadata)
select 'safetymanager', 'rls', c.id, jsonb_build_object('note','Corrispondenza diretta verificabile per codice') from public.courses c where c.stable_key='rls'
on conflict (source_system, external_course_code) do update set course_id=excluded.course_id, active=true;
insert into public.integration_course_mappings(source_system, external_course_code, course_id, metadata)
select 'safetymanager', 'antincendio_liv2', c.id, jsonb_build_object('note','Percorso interno SafetyTraining dedicato antincendio livello 2; non sostituisce la parte pratica') from public.courses c where c.stable_key='antincendio'
on conflict (source_system, external_course_code) do update set course_id=excluded.course_id, active=true;

create or replace function public.import_safetymanager_package(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_org_id uuid; v_company_id uuid; v_course_id uuid; v_course_version_id uuid; v_edition_id uuid; v_enrollment_id uuid; v_learner_id uuid;
  v_source text := lower(coalesce(p_payload->>'source_system','')); v_schema text := coalesce(p_payload->>'schema',''); v_schema_version text := coalesce(p_payload->>'schema_version',''); v_export_id text := nullif(p_payload->>'export_id','');
  v_company jsonb := coalesce(p_payload->'company','{}'::jsonb); v_project jsonb := coalesce(p_payload->'project','{}'::jsonb); v_learner jsonb;
  v_company_ext text; v_project_ext text; v_course_code text; v_learner_ext text; v_enrollment_ext text; v_full_name text; v_cf text; v_email text; v_job text; v_piva_cf text;
  v_created_company integer := 0; v_created_learners integer := 0; v_updated_learners integer := 0; v_created_edition integer := 0; v_created_enrollments integer := 0; v_reused_enrollments integer := 0;
  v_warnings jsonb := '[]'::jsonb;
begin
  if not private.is_platform_admin() then raise exception 'platform admin required'; end if;
  if v_schema <> 'safetytraining.transfer' or v_source <> 'safetymanager' or v_schema_version !~ '^1\\.' then raise exception 'unsupported SafetyManager transfer package'; end if;
  select id into v_org_id from public.organizations where code='DEFAULT' and active order by created_at asc limit 1;
  if v_org_id is null then raise exception 'default Safety Training organization not configured'; end if;

  v_company_ext := nullif(v_company->>'external_id','');
  if v_company_ext is null then raise exception 'company.external_id is required'; end if;
  select local_id into v_company_id from public.external_mappings where source_system='safetymanager' and entity_type='company' and external_id=v_company_ext limit 1;
  v_piva_cf := nullif(btrim(coalesce(v_company->>'vat_or_fiscal_code','')),'');
  if v_company_id is null and v_piva_cf is not null then
    select c.id into v_company_id from public.companies c where c.organization_id=v_org_id and c.active and (upper(coalesce(c.vat_number,''))=upper(v_piva_cf) or upper(coalesce(c.fiscal_code,''))=upper(v_piva_cf)) order by c.created_at asc limit 1;
  end if;
  if v_company_id is null then
    insert into public.companies(organization_id,name,vat_number,fiscal_code,ateco_code,metadata)
    values (v_org_id,coalesce(nullif(btrim(v_company->>'name'),''),'Azienda importata'),case when v_piva_cf ~ '^[0-9]{11}$' then v_piva_cf else null end,case when v_piva_cf is not null and v_piva_cf !~ '^[0-9]{11}$' then upper(v_piva_cf) else null end,nullif(btrim(v_company->>'ateco_code'),''),jsonb_build_object('source_system','safetymanager','source_external_id',v_company_ext)) returning id into v_company_id;
    v_created_company := 1;
  else
    update public.companies set name=coalesce(nullif(btrim(v_company->>'name'),''),name),vat_number=case when v_piva_cf ~ '^[0-9]{11}$' then v_piva_cf else vat_number end,fiscal_code=case when v_piva_cf is not null and v_piva_cf !~ '^[0-9]{11}$' then upper(v_piva_cf) else fiscal_code end,ateco_code=coalesce(nullif(btrim(v_company->>'ateco_code'),''),ateco_code),metadata=metadata || jsonb_build_object('source_system','safetymanager','source_external_id',v_company_ext),updated_at=now() where id=v_company_id;
  end if;
  insert into public.external_mappings(source_system,entity_type,external_id,local_entity_type,local_id,external_updated_at,metadata)
  values ('safetymanager','company',v_company_ext,'company',v_company_id,null,jsonb_build_object('schema_version',v_schema_version))
  on conflict (source_system,entity_type,external_id) do update set local_entity_type=excluded.local_entity_type,local_id=excluded.local_id,metadata=public.external_mappings.metadata || excluded.metadata,updated_at=now();

  for v_learner in select value from jsonb_array_elements(coalesce(p_payload->'learners','[]'::jsonb)) loop
    v_learner_ext := nullif(v_learner->>'external_id','');
    if v_learner_ext is null then v_warnings := v_warnings || jsonb_build_array('Corsista saltato: external_id mancante'); continue; end if;
    v_full_name := nullif(btrim(coalesce(v_learner->>'full_name','')),''); v_cf := nullif(upper(btrim(coalesce(v_learner->>'fiscal_code',''))),''); v_email := nullif(lower(btrim(coalesce(v_learner->>'email',''))),''); v_job := nullif(btrim(coalesce(v_learner->>'job_title','')),'');
    select local_id into v_learner_id from public.external_mappings where source_system='safetymanager' and entity_type='learner' and external_id=v_learner_ext limit 1;
    if v_learner_id is null and v_cf is not null then select l.id into v_learner_id from public.learners l where l.organization_id=v_org_id and l.active and upper(coalesce(l.fiscal_code,''))=v_cf order by l.created_at asc limit 1; end if;
    if v_learner_id is null and v_email is not null then select l.id into v_learner_id from public.learners l where l.organization_id=v_org_id and l.active and lower(coalesce(l.email,''))=v_email order by l.created_at asc limit 1; end if;
    if v_learner_id is null then
      insert into public.learners(organization_id,company_id,first_name,last_name,email,fiscal_code,job_title,metadata)
      values (v_org_id,v_company_id,coalesce(nullif(v_learner->>'first_name',''),v_full_name),nullif(v_learner->>'last_name',''),v_email,v_cf,v_job,jsonb_build_object('source_system','safetymanager','source_external_id',v_learner_ext,'source_full_name',v_full_name)) returning id into v_learner_id;
      v_created_learners := v_created_learners + 1;
    else
      update public.learners set company_id=v_company_id,first_name=coalesce(nullif(v_learner->>'first_name',''),v_full_name,first_name),last_name=coalesce(nullif(v_learner->>'last_name',''),last_name),email=coalesce(v_email,email),fiscal_code=coalesce(v_cf,fiscal_code),job_title=coalesce(v_job,job_title),metadata=metadata || jsonb_build_object('source_system','safetymanager','source_external_id',v_learner_ext,'source_full_name',v_full_name),updated_at=now() where id=v_learner_id;
      v_updated_learners := v_updated_learners + 1;
    end if;
    insert into public.external_mappings(source_system,entity_type,external_id,local_entity_type,local_id,metadata)
    values ('safetymanager','learner',v_learner_ext,'learner',v_learner_id,jsonb_build_object('schema_version',v_schema_version))
    on conflict (source_system,entity_type,external_id) do update set local_entity_type=excluded.local_entity_type,local_id=excluded.local_id,metadata=public.external_mappings.metadata || excluded.metadata,updated_at=now();
  end loop;

  v_project_ext := nullif(v_project->>'external_id',''); v_course_code := lower(nullif(btrim(coalesce(v_project->>'course_code','')),''));
  if v_project_ext is null then v_warnings := v_warnings || jsonb_build_array('Edizione non creata: project.external_id mancante');
  elsif v_course_code is null then v_warnings := v_warnings || jsonb_build_array('Edizione non creata: project.course_code mancante');
  else
    select m.course_id into v_course_id from public.integration_course_mappings m where m.source_system='safetymanager' and lower(m.external_course_code)=v_course_code and m.active limit 1;
    if v_course_id is null then select c.id into v_course_id from public.courses c where lower(c.stable_key)=v_course_code and c.active limit 1; end if;
    if v_course_id is null then v_warnings := v_warnings || jsonb_build_array('Corso SafetyManager "'||v_course_code||'" non ancora associato a un percorso SafetyTraining');
    else
      select cv.id into v_course_version_id from public.course_versions cv where cv.course_id=v_course_id and cv.status='published' order by cv.version_number desc limit 1;
      if v_course_version_id is null then v_warnings := v_warnings || jsonb_build_array('Nessuna versione pubblicata per il corso associato');
      else
        select local_id into v_edition_id from public.external_mappings where source_system='safetymanager' and entity_type='project' and external_id=v_project_ext limit 1;
        if v_edition_id is null then
          insert into public.course_editions(course_version_id,organization_id,company_id,title,learning_mode,certification_mode,available_from,recommended_due_at,block_after_due,status,metadata)
          values (v_course_version_id,v_org_id,v_company_id,coalesce(nullif(btrim(v_project->>'title'),''),nullif(btrim(v_project->>'code'),''),'Edizione SafetyManager'),'elearning_internal','not_certifying',case when coalesce(v_project->>'available_from','') ~ '^\\d{4}-\\d{2}-\\d{2}' then (v_project->>'available_from')::timestamptz else null end,case when coalesce(v_project->>'recommended_due_at','') ~ '^\\d{4}-\\d{2}-\\d{2}' then (v_project->>'recommended_due_at')::timestamptz else null end,false,'open',jsonb_build_object('source_system','safetymanager','source_external_id',v_project_ext,'source_course_code',v_course_code,'source_mode',v_project->>'source_mode')) returning id into v_edition_id;
          v_created_edition := 1;
        else
          update public.course_editions set course_version_id=v_course_version_id,company_id=v_company_id,title=coalesce(nullif(btrim(v_project->>'title'),''),title),recommended_due_at=case when coalesce(v_project->>'recommended_due_at','') ~ '^\\d{4}-\\d{2}-\\d{2}' then (v_project->>'recommended_due_at')::timestamptz else recommended_due_at end,metadata=metadata || jsonb_build_object('source_system','safetymanager','source_external_id',v_project_ext,'source_course_code',v_course_code,'source_mode',v_project->>'source_mode'),updated_at=now() where id=v_edition_id;
        end if;
        insert into public.external_mappings(source_system,entity_type,external_id,local_entity_type,local_id,metadata)
        values ('safetymanager','project',v_project_ext,'course_edition',v_edition_id,jsonb_build_object('schema_version',v_schema_version,'course_code',v_course_code))
        on conflict (source_system,entity_type,external_id) do update set local_entity_type=excluded.local_entity_type,local_id=excluded.local_id,metadata=public.external_mappings.metadata || excluded.metadata,updated_at=now();

        for v_learner in select value from jsonb_array_elements(coalesce(p_payload->'learners','[]'::jsonb)) loop
          v_learner_ext := nullif(v_learner->>'external_id',''); v_enrollment_ext := nullif(v_learner->>'enrollment_external_id','');
          if v_learner_ext is null then continue; end if;
          select local_id into v_learner_id from public.external_mappings where source_system='safetymanager' and entity_type='learner' and external_id=v_learner_ext limit 1;
          if v_learner_id is null then continue; end if;
          v_enrollment_id := null;
          if v_enrollment_ext is not null then select local_id into v_enrollment_id from public.external_mappings where source_system='safetymanager' and entity_type='enrollment' and external_id=v_enrollment_ext limit 1; end if;
          if v_enrollment_id is null then select e.id into v_enrollment_id from public.enrollments e where e.edition_id=v_edition_id and e.learner_id=v_learner_id limit 1; end if;
          if v_enrollment_id is null then
            insert into public.enrollments(edition_id,learner_id,status,metadata) values (v_edition_id,v_learner_id,'not_started',jsonb_build_object('source_system','safetymanager','source_project_id',v_project_ext,'source_enrollment_id',v_enrollment_ext)) returning id into v_enrollment_id;
            v_created_enrollments := v_created_enrollments + 1;
          else
            update public.enrollments set metadata=metadata || jsonb_build_object('source_system','safetymanager','source_project_id',v_project_ext,'source_enrollment_id',v_enrollment_ext),updated_at=now() where id=v_enrollment_id;
            v_reused_enrollments := v_reused_enrollments + 1;
          end if;
          if v_enrollment_ext is not null then
            insert into public.external_mappings(source_system,entity_type,external_id,local_entity_type,local_id,metadata) values ('safetymanager','enrollment',v_enrollment_ext,'enrollment',v_enrollment_id,jsonb_build_object('schema_version',v_schema_version))
            on conflict (source_system,entity_type,external_id) do update set local_entity_type=excluded.local_entity_type,local_id=excluded.local_id,metadata=public.external_mappings.metadata || excluded.metadata,updated_at=now();
          end if;
        end loop;
      end if;
    end if;
  end if;

  if v_export_id is not null and v_export_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    insert into public.integration_receipts(event_id,source_system,event_type,payload_hash,metadata) values (v_export_id::uuid,'safetymanager','manual_transfer_import',null,jsonb_build_object('schema_version',v_schema_version,'company_external_id',v_company_ext,'project_external_id',v_project_ext))
    on conflict (event_id) do update set received_at=now(),metadata=public.integration_receipts.metadata || excluded.metadata;
  end if;

  return jsonb_build_object('ok',true,'company_id',v_company_id,'course_code',v_course_code,'course_id',v_course_id,'edition_id',v_edition_id,'created_company',v_created_company,'created_learners',v_created_learners,'updated_or_reused_learners',v_updated_learners,'created_edition',v_created_edition,'created_enrollments',v_created_enrollments,'reused_enrollments',v_reused_enrollments,'warnings',v_warnings);
end;
$$;
revoke all on function public.import_safetymanager_package(jsonb) from public, anon;
grant execute on function public.import_safetymanager_package(jsonb) to authenticated, service_role;
