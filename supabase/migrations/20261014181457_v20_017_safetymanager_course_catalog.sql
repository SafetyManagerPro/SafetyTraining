-- SafetyTraining v20.017
-- SafetyManager remains the administrative course catalog master.
-- Unknown SafetyManager course types are imported as non-deliverable placeholders,
-- so company, learners, edition and enrollments are never blocked by missing content.

create table if not exists public.integration_course_catalog (
  source_system text not null,
  external_course_code text not null,
  title text not null,
  nominal_minutes integer null check (nominal_minutes is null or nominal_minutes >= 0),
  delivery_status text not null default 'needs_configuration'
    check (delivery_status in ('needs_configuration','ready','hybrid','unavailable')),
  mapped_course_id uuid null references public.courses(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_system, external_course_code)
);

create index if not exists integration_course_catalog_mapped_course_idx
  on public.integration_course_catalog(mapped_course_id);

alter table public.integration_course_catalog enable row level security;

drop policy if exists integration_course_catalog_admin_read on public.integration_course_catalog;
create policy integration_course_catalog_admin_read
on public.integration_course_catalog
for select to authenticated
using (private.is_platform_admin());

drop policy if exists integration_course_catalog_admin_manage on public.integration_course_catalog;
create policy integration_course_catalog_admin_manage
on public.integration_course_catalog
for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop trigger if exists integration_course_catalog_touch on public.integration_course_catalog;
create trigger integration_course_catalog_touch
before update on public.integration_course_catalog
for each row execute function public.touch_updated_at();

insert into public.integration_course_catalog(
  source_system, external_course_code, title, nominal_minutes,
  delivery_status, mapped_course_id, metadata
)
select 'safetymanager', 'rls', c.title, c.nominal_minutes,
       'ready', c.id, jsonb_build_object('seeded_from','v20_015_mapping')
from public.courses c
where c.stable_key='rls'
on conflict (source_system, external_course_code) do nothing;

insert into public.integration_course_catalog(
  source_system, external_course_code, title, nominal_minutes,
  delivery_status, mapped_course_id, metadata
)
select 'safetymanager', 'antincendio_liv2', c.title, c.nominal_minutes,
       'hybrid', c.id,
       jsonb_build_object('seeded_from','v20_015_mapping','requires_presence',true,
                          'note','La parte pratica non viene sostituita dal percorso online')
from public.courses c
where c.stable_key='antincendio'
on conflict (source_system, external_course_code) do nothing;

create or replace function public.import_safetymanager_package(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_org_id uuid;
  v_company_id uuid;
  v_course_id uuid;
  v_course_version_id uuid;
  v_edition_id uuid;
  v_enrollment_id uuid;
  v_learner_id uuid;
  v_catalog_mapped_course_id uuid;
  v_source text := lower(coalesce(p_payload->>'source_system',''));
  v_schema text := coalesce(p_payload->>'schema','');
  v_schema_version text := coalesce(p_payload->>'schema_version','');
  v_export_id text := nullif(p_payload->>'export_id','');
  v_company jsonb := coalesce(p_payload->'company','{}'::jsonb);
  v_project jsonb := coalesce(p_payload->'project','{}'::jsonb);
  v_learner jsonb;
  v_company_ext text;
  v_project_ext text;
  v_course_code text;
  v_learner_ext text;
  v_enrollment_ext text;
  v_full_name text;
  v_cf text;
  v_email text;
  v_job text;
  v_piva_cf text;
  v_source_title text;
  v_placeholder_key text;
  v_delivery_status text := 'needs_configuration';
  v_version_status text;
  v_edition_status text;
  v_source_minutes integer;
  v_created_company integer := 0;
  v_created_learners integer := 0;
  v_updated_learners integer := 0;
  v_created_edition integer := 0;
  v_created_enrollments integer := 0;
  v_reused_enrollments integer := 0;
  v_created_placeholder_course integer := 0;
  v_requires_presence boolean := false;
  v_is_placeholder boolean := false;
  v_warnings jsonb := '[]'::jsonb;
begin
  if not private.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if v_schema <> 'safetytraining.transfer'
     or v_source <> 'safetymanager'
     or left(v_schema_version, 2) <> '1.' then
    raise exception 'unsupported SafetyManager transfer package';
  end if;

  select id into v_org_id
  from public.organizations
  where code='DEFAULT' and active
  order by created_at asc
  limit 1;

  if v_org_id is null then
    raise exception 'default Safety Training organization not configured';
  end if;

  v_company_ext := nullif(v_company->>'external_id','');
  if v_company_ext is null then
    raise exception 'company.external_id is required';
  end if;

  select local_id into v_company_id
  from public.external_mappings
  where source_system='safetymanager'
    and entity_type='company'
    and external_id=v_company_ext
  limit 1;

  v_piva_cf := nullif(btrim(coalesce(v_company->>'vat_or_fiscal_code','')),'');

  if v_company_id is null and v_piva_cf is not null then
    select c.id into v_company_id
    from public.companies c
    where c.organization_id=v_org_id
      and c.active
      and (
        upper(coalesce(c.vat_number,''))=upper(v_piva_cf)
        or upper(coalesce(c.fiscal_code,''))=upper(v_piva_cf)
      )
    order by c.created_at asc
    limit 1;
  end if;

  if v_company_id is null then
    insert into public.companies(
      organization_id,name,vat_number,fiscal_code,ateco_code,metadata
    ) values (
      v_org_id,
      coalesce(nullif(btrim(v_company->>'name'),''),'Azienda importata'),
      case when v_piva_cf ~ '^[0-9]{11}$' then v_piva_cf else null end,
      case when v_piva_cf is not null and v_piva_cf !~ '^[0-9]{11}$' then upper(v_piva_cf) else null end,
      nullif(btrim(v_company->>'ateco_code'),''),
      jsonb_build_object('source_system','safetymanager','source_external_id',v_company_ext)
    ) returning id into v_company_id;
    v_created_company := 1;
  else
    update public.companies
       set name=coalesce(nullif(btrim(v_company->>'name'),''),name),
           vat_number=case when v_piva_cf ~ '^[0-9]{11}$' then v_piva_cf else vat_number end,
           fiscal_code=case when v_piva_cf is not null and v_piva_cf !~ '^[0-9]{11}$' then upper(v_piva_cf) else fiscal_code end,
           ateco_code=coalesce(nullif(btrim(v_company->>'ateco_code'),''),ateco_code),
           metadata=metadata || jsonb_build_object('source_system','safetymanager','source_external_id',v_company_ext),
           updated_at=now()
     where id=v_company_id;
  end if;

  insert into public.external_mappings(
    source_system,entity_type,external_id,local_entity_type,local_id,external_updated_at,metadata
  ) values (
    'safetymanager','company',v_company_ext,'company',v_company_id,null,
    jsonb_build_object('schema_version',v_schema_version)
  )
  on conflict (source_system,entity_type,external_id) do update
    set local_entity_type=excluded.local_entity_type,
        local_id=excluded.local_id,
        metadata=public.external_mappings.metadata || excluded.metadata,
        updated_at=now();

  for v_learner in
    select value from jsonb_array_elements(coalesce(p_payload->'learners','[]'::jsonb))
  loop
    v_learner_ext := nullif(v_learner->>'external_id','');
    if v_learner_ext is null then
      v_warnings := v_warnings || jsonb_build_array('Corsista saltato: external_id mancante');
      continue;
    end if;

    v_full_name := nullif(btrim(coalesce(v_learner->>'full_name','')),'');
    v_cf := nullif(upper(btrim(coalesce(v_learner->>'fiscal_code',''))),'');
    v_email := nullif(lower(btrim(coalesce(v_learner->>'email',''))),'');
    v_job := nullif(btrim(coalesce(v_learner->>'job_title','')),'');

    select local_id into v_learner_id
    from public.external_mappings
    where source_system='safetymanager'
      and entity_type='learner'
      and external_id=v_learner_ext
    limit 1;

    if v_learner_id is null and v_cf is not null then
      select l.id into v_learner_id
      from public.learners l
      where l.organization_id=v_org_id
        and l.active
        and upper(coalesce(l.fiscal_code,''))=v_cf
      order by l.created_at asc
      limit 1;
    end if;

    if v_learner_id is null and v_email is not null then
      select l.id into v_learner_id
      from public.learners l
      where l.organization_id=v_org_id
        and l.active
        and lower(coalesce(l.email,''))=v_email
      order by l.created_at asc
      limit 1;
    end if;

    if v_learner_id is null then
      insert into public.learners(
        organization_id,company_id,first_name,last_name,email,fiscal_code,job_title,metadata
      ) values (
        v_org_id,
        v_company_id,
        coalesce(nullif(v_learner->>'first_name',''),v_full_name),
        nullif(v_learner->>'last_name',''),
        v_email,
        v_cf,
        v_job,
        jsonb_build_object(
          'source_system','safetymanager',
          'source_external_id',v_learner_ext,
          'source_full_name',v_full_name
        )
      ) returning id into v_learner_id;
      v_created_learners := v_created_learners + 1;
    else
      update public.learners
         set company_id=v_company_id,
             first_name=coalesce(nullif(v_learner->>'first_name',''),v_full_name,first_name),
             last_name=coalesce(nullif(v_learner->>'last_name',''),last_name),
             email=coalesce(v_email,email),
             fiscal_code=coalesce(v_cf,fiscal_code),
             job_title=coalesce(v_job,job_title),
             metadata=metadata || jsonb_build_object(
               'source_system','safetymanager',
               'source_external_id',v_learner_ext,
               'source_full_name',v_full_name
             ),
             updated_at=now()
       where id=v_learner_id;
      v_updated_learners := v_updated_learners + 1;
    end if;

    insert into public.external_mappings(
      source_system,entity_type,external_id,local_entity_type,local_id,metadata
    ) values (
      'safetymanager','learner',v_learner_ext,'learner',v_learner_id,
      jsonb_build_object('schema_version',v_schema_version)
    )
    on conflict (source_system,entity_type,external_id) do update
      set local_entity_type=excluded.local_entity_type,
          local_id=excluded.local_id,
          metadata=public.external_mappings.metadata || excluded.metadata,
          updated_at=now();
  end loop;

  v_project_ext := nullif(v_project->>'external_id','');
  v_course_code := lower(nullif(btrim(coalesce(v_project->>'course_code','')),''));

  if coalesce(v_project->>'course_duration_minutes','') ~ '^[0-9]+$' then
    v_source_minutes := (v_project->>'course_duration_minutes')::integer;
  else
    v_source_minutes := null;
  end if;

  v_requires_presence := lower(coalesce(v_project->>'requires_presence','false')) in ('true','1','yes');
  v_source_title := coalesce(
    nullif(btrim(v_project->>'course_title'),''),
    nullif(btrim(v_project->>'title'),''),
    nullif(btrim(v_project->>'code'),''),
    v_course_code,
    'Corso SafetyManager'
  );

  if v_course_code is null then
    v_warnings := v_warnings || jsonb_build_array('Edizione non creata: project.course_code mancante');
  else
    insert into public.integration_course_catalog(
      source_system,external_course_code,title,nominal_minutes,metadata,last_seen_at
    ) values (
      'safetymanager',v_course_code,v_source_title,v_source_minutes,
      jsonb_build_object(
        'source_mode',v_project->>'source_mode',
        'requires_presence',v_requires_presence,
        'normative_ref',v_project->>'course_normative_ref'
      ),
      now()
    )
    on conflict (source_system,external_course_code) do update
      set title=excluded.title,
          nominal_minutes=coalesce(excluded.nominal_minutes,public.integration_course_catalog.nominal_minutes),
          metadata=public.integration_course_catalog.metadata || excluded.metadata,
          last_seen_at=now(),
          updated_at=now();

    select delivery_status,mapped_course_id
      into v_delivery_status,v_catalog_mapped_course_id
    from public.integration_course_catalog
    where source_system='safetymanager'
      and external_course_code=v_course_code;

    if v_catalog_mapped_course_id is not null then
      select c.id into v_course_id
      from public.courses c
      where c.id=v_catalog_mapped_course_id and c.active
      limit 1;
    end if;

    if v_course_id is null then
      select m.course_id into v_course_id
      from public.integration_course_mappings m
      join public.courses c on c.id=m.course_id and c.active
      where m.source_system='safetymanager'
        and lower(m.external_course_code)=v_course_code
        and m.active
      limit 1;
    end if;

    if v_course_id is null then
      select c.id into v_course_id
      from public.courses c
      where lower(c.stable_key)=v_course_code and c.active
      limit 1;
    end if;

    if v_course_id is not null then
      select coalesce(c.metadata->>'source_placeholder','false')='true'
        into v_is_placeholder
      from public.courses c
      where c.id=v_course_id;
    end if;

    if v_course_id is null then
      v_placeholder_key := 'sm-' || md5(v_course_code);
      insert into public.courses(
        stable_key,title,family,description,nominal_minutes,certification_mode,active,metadata
      ) values (
        v_placeholder_key,
        v_source_title,
        'safetymanager',
        'Tipologia importata da SafetyManager. I contenuti didattici devono essere configurati prima dell’erogazione.',
        v_source_minutes,
        'internal_learning',
        true,
        jsonb_build_object(
          'source_system','safetymanager',
          'source_course_code',v_course_code,
          'source_course_title',v_source_title,
          'source_placeholder',true,
          'delivery_status','needs_configuration',
          'requires_presence',v_requires_presence
        )
      )
      on conflict (stable_key) do update
        set title=excluded.title,
            nominal_minutes=coalesce(excluded.nominal_minutes,public.courses.nominal_minutes),
            metadata=public.courses.metadata || excluded.metadata,
            updated_at=now()
      returning id into v_course_id;

      if not exists (select 1 from public.course_versions where course_id=v_course_id) then
        insert into public.course_versions(
          course_id,version_number,status,syllabus_snapshot,normative_snapshot
        ) values (
          v_course_id,1,'draft',
          jsonb_build_object('source','safetymanager','state','needs_configuration'),
          jsonb_build_object('source_reference',v_project->>'course_normative_ref')
        );
      end if;

      v_is_placeholder := true;
      v_delivery_status := 'needs_configuration';
      v_created_placeholder_course := 1;
      v_warnings := v_warnings || jsonb_build_array(
        'Corso SafetyManager "'||v_source_title||'" importato nel catalogo: contenuti SafetyTraining da configurare'
      );
    end if;

    insert into public.integration_course_mappings(
      source_system,external_course_code,course_id,active,metadata
    ) values (
      'safetymanager',v_course_code,v_course_id,true,
      jsonb_build_object('auto_placeholder',v_is_placeholder,'catalog_v2',true)
    )
    on conflict (source_system,external_course_code) do update
      set course_id=excluded.course_id,
          active=true,
          metadata=public.integration_course_mappings.metadata || excluded.metadata,
          updated_at=now();

    if not v_is_placeholder and v_catalog_mapped_course_id is null then
      update public.integration_course_catalog
         set mapped_course_id=v_course_id,
             delivery_status=case
               when delivery_status='needs_configuration' and v_requires_presence then 'hybrid'
               when delivery_status='needs_configuration' then 'ready'
               else delivery_status
             end,
             updated_at=now()
       where source_system='safetymanager'
         and external_course_code=v_course_code;
    end if;

    select delivery_status
      into v_delivery_status
    from public.integration_course_catalog
    where source_system='safetymanager'
      and external_course_code=v_course_code;

    select cv.id,cv.status
      into v_course_version_id,v_version_status
    from public.course_versions cv
    where cv.course_id=v_course_id and cv.status='published'
    order by cv.version_number desc
    limit 1;

    if v_course_version_id is null then
      select cv.id,cv.status
        into v_course_version_id,v_version_status
      from public.course_versions cv
      where cv.course_id=v_course_id and cv.status='draft'
      order by cv.version_number desc
      limit 1;
    end if;

    if v_course_version_id is null then
      insert into public.course_versions(
        course_id,version_number,status,syllabus_snapshot,normative_snapshot
      ) values (
        v_course_id,1,'draft',
        jsonb_build_object('source','safetymanager','state','needs_configuration'),
        '{}'::jsonb
      ) returning id,status into v_course_version_id,v_version_status;
      v_delivery_status := 'needs_configuration';
      update public.integration_course_catalog
         set delivery_status='needs_configuration',updated_at=now()
       where source_system='safetymanager' and external_course_code=v_course_code;
    end if;

    if v_version_status <> 'published' and v_delivery_status in ('ready','hybrid') then
      v_delivery_status := 'needs_configuration';
      update public.integration_course_catalog
         set delivery_status='needs_configuration',updated_at=now()
       where source_system='safetymanager' and external_course_code=v_course_code;
    end if;

    v_edition_status := case
      when v_delivery_status='unavailable' then 'closed'
      when v_version_status='published' and v_delivery_status in ('ready','hybrid') then 'open'
      else 'draft'
    end;

    if v_project_ext is null then
      v_warnings := v_warnings || jsonb_build_array('Edizione non creata: project.external_id mancante');
    else
      select local_id into v_edition_id
      from public.external_mappings
      where source_system='safetymanager'
        and entity_type='project'
        and external_id=v_project_ext
      limit 1;

      if v_edition_id is null then
        insert into public.course_editions(
          course_version_id,organization_id,company_id,title,learning_mode,certification_mode,
          available_from,recommended_due_at,block_after_due,status,metadata
        ) values (
          v_course_version_id,
          v_org_id,
          v_company_id,
          coalesce(nullif(btrim(v_project->>'title'),''),nullif(btrim(v_project->>'code'),''),'Edizione SafetyManager'),
          case when v_delivery_status='hybrid' then 'blended' else 'elearning_internal' end,
          'not_certifying',
          case when coalesce(v_project->>'available_from','') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
               then (v_project->>'available_from')::timestamptz else null end,
          case when coalesce(v_project->>'recommended_due_at','') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
               then (v_project->>'recommended_due_at')::timestamptz else null end,
          false,
          v_edition_status,
          jsonb_build_object(
            'source_system','safetymanager',
            'source_external_id',v_project_ext,
            'source_course_code',v_course_code,
            'source_mode',v_project->>'source_mode',
            'delivery_status',v_delivery_status
          )
        ) returning id into v_edition_id;
        v_created_edition := 1;
      else
        update public.course_editions
           set course_version_id=v_course_version_id,
               company_id=v_company_id,
               title=coalesce(nullif(btrim(v_project->>'title'),''),title),
               learning_mode=case when v_delivery_status='hybrid' then 'blended' else learning_mode end,
               recommended_due_at=case
                 when coalesce(v_project->>'recommended_due_at','') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                 then (v_project->>'recommended_due_at')::timestamptz
                 else recommended_due_at
               end,
               status=case when status='archived' then status else v_edition_status end,
               metadata=metadata || jsonb_build_object(
                 'source_system','safetymanager',
                 'source_external_id',v_project_ext,
                 'source_course_code',v_course_code,
                 'source_mode',v_project->>'source_mode',
                 'delivery_status',v_delivery_status
               ),
               updated_at=now()
         where id=v_edition_id;
      end if;

      insert into public.external_mappings(
        source_system,entity_type,external_id,local_entity_type,local_id,metadata
      ) values (
        'safetymanager','project',v_project_ext,'course_edition',v_edition_id,
        jsonb_build_object('schema_version',v_schema_version,'course_code',v_course_code)
      )
      on conflict (source_system,entity_type,external_id) do update
        set local_entity_type=excluded.local_entity_type,
            local_id=excluded.local_id,
            metadata=public.external_mappings.metadata || excluded.metadata,
            updated_at=now();

      for v_learner in
        select value from jsonb_array_elements(coalesce(p_payload->'learners','[]'::jsonb))
      loop
        v_learner_ext := nullif(v_learner->>'external_id','');
        v_enrollment_ext := nullif(v_learner->>'enrollment_external_id','');
        if v_learner_ext is null then continue; end if;

        select local_id into v_learner_id
        from public.external_mappings
        where source_system='safetymanager'
          and entity_type='learner'
          and external_id=v_learner_ext
        limit 1;
        if v_learner_id is null then continue; end if;

        v_enrollment_id := null;
        if v_enrollment_ext is not null then
          select local_id into v_enrollment_id
          from public.external_mappings
          where source_system='safetymanager'
            and entity_type='enrollment'
            and external_id=v_enrollment_ext
          limit 1;
        end if;

        if v_enrollment_id is null then
          select e.id into v_enrollment_id
          from public.enrollments e
          where e.edition_id=v_edition_id and e.learner_id=v_learner_id
          limit 1;
        end if;

        if v_enrollment_id is null then
          insert into public.enrollments(edition_id,learner_id,status,metadata)
          values (
            v_edition_id,v_learner_id,'not_started',
            jsonb_build_object(
              'source_system','safetymanager',
              'source_project_id',v_project_ext,
              'source_enrollment_id',v_enrollment_ext,
              'source_course_code',v_course_code,
              'delivery_status',v_delivery_status
            )
          ) returning id into v_enrollment_id;
          v_created_enrollments := v_created_enrollments + 1;
        else
          update public.enrollments
             set metadata=metadata || jsonb_build_object(
               'source_system','safetymanager',
               'source_project_id',v_project_ext,
               'source_enrollment_id',v_enrollment_ext,
               'source_course_code',v_course_code,
               'delivery_status',v_delivery_status
             ),
             updated_at=now()
           where id=v_enrollment_id;
          v_reused_enrollments := v_reused_enrollments + 1;
        end if;

        if v_enrollment_ext is not null then
          insert into public.external_mappings(
            source_system,entity_type,external_id,local_entity_type,local_id,metadata
          ) values (
            'safetymanager','enrollment',v_enrollment_ext,'enrollment',v_enrollment_id,
            jsonb_build_object('schema_version',v_schema_version)
          )
          on conflict (source_system,entity_type,external_id) do update
            set local_entity_type=excluded.local_entity_type,
                local_id=excluded.local_id,
                metadata=public.external_mappings.metadata || excluded.metadata,
                updated_at=now();
        end if;
      end loop;
    end if;
  end if;

  if v_export_id is not null
     and v_export_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    insert into public.integration_receipts(
      event_id,source_system,event_type,payload_hash,metadata
    ) values (
      v_export_id::uuid,'safetymanager','manual_transfer_import',null,
      jsonb_build_object(
        'schema_version',v_schema_version,
        'company_external_id',v_company_ext,
        'project_external_id',v_project_ext,
        'course_code',v_course_code
      )
    )
    on conflict (event_id) do update
      set received_at=now(),
          metadata=public.integration_receipts.metadata || excluded.metadata;
  end if;

  return jsonb_build_object(
    'ok',true,
    'company_id',v_company_id,
    'course_code',v_course_code,
    'course_id',v_course_id,
    'course_title',v_source_title,
    'delivery_status',v_delivery_status,
    'edition_id',v_edition_id,
    'created_company',v_created_company,
    'created_learners',v_created_learners,
    'updated_or_reused_learners',v_updated_learners,
    'created_placeholder_course',v_created_placeholder_course,
    'created_edition',v_created_edition,
    'created_enrollments',v_created_enrollments,
    'reused_enrollments',v_reused_enrollments,
    'warnings',v_warnings
  );
end;
$$;

revoke all on function public.import_safetymanager_package(jsonb) from public, anon;
grant execute on function public.import_safetymanager_package(jsonb) to authenticated, service_role;

create or replace function public.configure_safetymanager_course(
  p_external_course_code text,
  p_course_id uuid default null,
  p_delivery_status text default 'ready'
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_code text := lower(nullif(btrim(coalesce(p_external_course_code,'')),''));
  v_status text := lower(coalesce(p_delivery_status,''));
  v_course_version_id uuid;
  v_old_course_id uuid;
  v_requires_presence boolean := false;
  v_editions integer := 0;
  v_enrollments integer := 0;
begin
  if not private.is_platform_admin() then
    raise exception 'platform admin required';
  end if;

  if v_code is null then
    raise exception 'external course code required';
  end if;

  if v_status not in ('needs_configuration','ready','hybrid','unavailable') then
    raise exception 'invalid delivery status';
  end if;

  if not exists (
    select 1 from public.integration_course_catalog
    where source_system='safetymanager' and external_course_code=v_code
  ) then
    raise exception 'SafetyManager course not found in imported catalog';
  end if;

  select lower(coalesce(metadata->>'requires_presence','false')) in ('true','1','yes')
    into v_requires_presence
  from public.integration_course_catalog
  where source_system='safetymanager' and external_course_code=v_code;

  if v_requires_presence and v_status='ready' then
    raise exception 'this source course includes a practical/presence component; use hybrid or unavailable';
  end if;

  select course_id into v_old_course_id
  from public.integration_course_mappings
  where source_system='safetymanager' and external_course_code=v_code
  limit 1;

  if v_status in ('ready','hybrid') then
    if p_course_id is null then
      raise exception 'a published SafetyTraining course is required';
    end if;

    select cv.id into v_course_version_id
    from public.course_versions cv
    join public.courses c on c.id=cv.course_id and c.active
    where cv.course_id=p_course_id and cv.status='published'
    order by cv.version_number desc
    limit 1;

    if v_course_version_id is null then
      raise exception 'selected SafetyTraining course has no published version';
    end if;

    insert into public.integration_course_mappings(
      source_system,external_course_code,course_id,active,metadata
    ) values (
      'safetymanager',v_code,p_course_id,true,
      jsonb_build_object('configured_by_admin',true,'auto_placeholder',false)
    )
    on conflict (source_system,external_course_code) do update
      set course_id=excluded.course_id,
          active=true,
          metadata=public.integration_course_mappings.metadata || excluded.metadata,
          updated_at=now();

    update public.integration_course_catalog
       set mapped_course_id=p_course_id,
           delivery_status=v_status,
           updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.course_editions
       set course_version_id=v_course_version_id,
           status=case when status='archived' then status else 'open' end,
           learning_mode=case when v_status='hybrid' then 'blended' else 'elearning_internal' end,
           metadata=metadata || jsonb_build_object('delivery_status',v_status),
           updated_at=now()
     where metadata->>'source_system'='safetymanager'
       and lower(coalesce(metadata->>'source_course_code',''))=v_code;
    get diagnostics v_editions = row_count;

    if v_old_course_id is not null and v_old_course_id <> p_course_id then
      update public.courses
         set active=false,updated_at=now()
       where id=v_old_course_id
         and metadata->>'source_system'='safetymanager'
         and metadata->>'source_placeholder'='true';
    end if;
  elsif v_status='unavailable' then
    update public.integration_course_catalog
       set delivery_status='unavailable',updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.course_editions
       set status=case when status='archived' then status else 'closed' end,
           metadata=metadata || jsonb_build_object('delivery_status','unavailable'),
           updated_at=now()
     where metadata->>'source_system'='safetymanager'
       and lower(coalesce(metadata->>'source_course_code',''))=v_code;
    get diagnostics v_editions = row_count;
  else
    update public.integration_course_catalog
       set delivery_status='needs_configuration',mapped_course_id=null,updated_at=now()
     where source_system='safetymanager' and external_course_code=v_code;

    update public.course_editions
       set status=case when status='archived' then status else 'draft' end,
           metadata=metadata || jsonb_build_object('delivery_status','needs_configuration'),
           updated_at=now()
     where metadata->>'source_system'='safetymanager'
       and lower(coalesce(metadata->>'source_course_code',''))=v_code;
    get diagnostics v_editions = row_count;
  end if;

  update public.enrollments e
     set metadata=e.metadata || jsonb_build_object('delivery_status',v_status),
         updated_at=now()
   where exists (
     select 1 from public.course_editions d
     where d.id=e.edition_id
       and d.metadata->>'source_system'='safetymanager'
       and lower(coalesce(d.metadata->>'source_course_code',''))=v_code
   );
  get diagnostics v_enrollments = row_count;

  return jsonb_build_object(
    'ok',true,
    'course_code',v_code,
    'delivery_status',v_status,
    'mapped_course_id',case when v_status in ('ready','hybrid') then p_course_id else null end,
    'updated_editions',v_editions,
    'updated_enrollments',v_enrollments
  );
end;
$$;

revoke all on function public.configure_safetymanager_course(text,uuid,text) from public, anon;
grant execute on function public.configure_safetymanager_course(text,uuid,text) to authenticated, service_role;
