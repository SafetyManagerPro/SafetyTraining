-- SafetyTraining v21_023
-- Preserve learners.company_id as the current company while keeping the company context of every training enrollment.

create table if not exists public.learner_company_training_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  learner_id uuid not null references public.learners(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  edition_id uuid not null references public.course_editions(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  source_system text,
  source_project_external_id text,
  source_enrollment_external_id text,
  context_from timestamptz,
  context_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_company_training_history_enrollment_key unique(enrollment_id)
);

create index if not exists learner_company_training_history_learner_idx
  on public.learner_company_training_history(organization_id, learner_id, context_from desc);
create index if not exists learner_company_training_history_company_idx
  on public.learner_company_training_history(organization_id, company_id, context_from desc);
create index if not exists learner_company_training_history_edition_idx
  on public.learner_company_training_history(edition_id, learner_id);

alter table public.learner_company_training_history enable row level security;
revoke all on table public.learner_company_training_history from public, anon, authenticated;
grant select on table public.learner_company_training_history to authenticated;
grant all on table public.learner_company_training_history to service_role;

drop policy if exists learner_company_training_history_admin_select on public.learner_company_training_history;
create policy learner_company_training_history_admin_select
on public.learner_company_training_history
for select
to authenticated
using (
  private.is_platform_admin()
  or private.can_manage_training_org(organization_id)
);

insert into public.learner_company_training_history(
  organization_id, learner_id, company_id, edition_id, enrollment_id,
  source_system, source_project_external_id, source_enrollment_external_id,
  context_from, context_until, metadata
)
select
  d.organization_id,
  e.learner_id,
  d.company_id,
  d.id,
  e.id,
  coalesce(nullif(e.metadata->>'source_system',''), nullif(d.metadata->>'source_system',''), 'safetytraining'),
  nullif(coalesce(e.metadata->>'source_project_id', d.metadata->>'source_external_id'),''),
  nullif(e.metadata->>'source_enrollment_id',''),
  d.available_from,
  coalesce(d.recommended_due_at, d.available_until),
  jsonb_build_object('backfilled',true,'training_company_context',true)
from public.enrollments e
join public.course_editions d on d.id=e.edition_id
where d.company_id is not null
on conflict (enrollment_id) do update
set organization_id=excluded.organization_id,
    learner_id=excluded.learner_id,
    company_id=excluded.company_id,
    edition_id=excluded.edition_id,
    source_system=excluded.source_system,
    source_project_external_id=excluded.source_project_external_id,
    source_enrollment_external_id=excluded.source_enrollment_external_id,
    context_from=excluded.context_from,
    context_until=excluded.context_until,
    metadata=public.learner_company_training_history.metadata || excluded.metadata,
    updated_at=now();

alter function public.import_safetymanager_package(jsonb)
  rename to import_safetymanager_package_v21_legacy;
revoke all on function public.import_safetymanager_package_v21_legacy(jsonb) from public, anon, authenticated, service_role;

create or replace function public.import_safetymanager_package(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_result jsonb;
  v_existing jsonb := '[]'::jsonb;
  v_item jsonb;
  v_saved jsonb;
  v_learner_id uuid;
  v_company_id uuid;
  v_cf text;
  v_email text;
  v_ext text;
  v_edition_id uuid;
  v_preserved integer := 0;
  v_history integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if not private.is_platform_admin() then
    raise exception 'platform admin required' using errcode='42501';
  end if;
  if coalesce(p_payload->>'schema','') <> 'safetytraining.transfer'
     or lower(coalesce(p_payload->>'source_system','')) <> 'safetymanager'
     or left(coalesce(p_payload->>'schema_version',''),2) <> '1.' then
    raise exception 'unsupported SafetyManager transfer package';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'learners','[]'::jsonb))
  loop
    v_learner_id := null;
    v_company_id := null;
    v_ext := nullif(v_item->>'external_id','');
    v_cf := nullif(upper(regexp_replace(btrim(coalesce(v_item->>'fiscal_code','')), '[^A-Z0-9]', '', 'g')),'');
    v_email := nullif(lower(btrim(coalesce(v_item->>'email',''))),'');

    if v_ext is not null then
      select m.local_id into v_learner_id
      from public.external_mappings m
      where m.source_system='safetymanager' and m.entity_type='learner' and m.external_id=v_ext
      limit 1;
    end if;

    if v_learner_id is null and v_cf is not null then
      select l.id into v_learner_id
      from public.learners l
      where l.fiscal_code_normalized=v_cf
        and l.organization_id=(select o.id from public.organizations o where o.code='DEFAULT' and o.active order by o.created_at limit 1)
        and l.active
      order by l.created_at limit 1;
    end if;

    if v_learner_id is null and v_email is not null then
      select l.id into v_learner_id
      from public.learners l
      where lower(btrim(coalesce(l.email,'')))=v_email
        and l.organization_id=(select o.id from public.organizations o where o.code='DEFAULT' and o.active order by o.created_at limit 1)
        and l.active
      order by l.created_at limit 1;
    end if;

    if v_learner_id is not null then
      select l.company_id into v_company_id from public.learners l where l.id=v_learner_id;
      if v_company_id is not null then
        v_existing := v_existing || jsonb_build_array(jsonb_build_object(
          'learner_id',v_learner_id,
          'company_id',v_company_id
        ));
      end if;
    end if;
  end loop;

  v_result := public.import_safetymanager_package_v21_legacy(p_payload);

  for v_saved in select value from jsonb_array_elements(v_existing)
  loop
    update public.learners
       set company_id=(v_saved->>'company_id')::uuid,
           updated_at=now()
     where id=(v_saved->>'learner_id')::uuid
       and company_id is distinct from (v_saved->>'company_id')::uuid;
    if found then v_preserved := v_preserved + 1; end if;
  end loop;

  v_edition_id := nullif(v_result->>'edition_id','')::uuid;
  if v_edition_id is not null then
    insert into public.learner_company_training_history(
      organization_id,learner_id,company_id,edition_id,enrollment_id,
      source_system,source_project_external_id,source_enrollment_external_id,
      context_from,context_until,metadata
    )
    select
      d.organization_id,e.learner_id,d.company_id,d.id,e.id,
      'safetymanager',
      nullif(coalesce(e.metadata->>'source_project_id',d.metadata->>'source_external_id'),''),
      nullif(e.metadata->>'source_enrollment_id',''),
      d.available_from,
      coalesce(d.recommended_due_at,d.available_until),
      jsonb_build_object(
        'training_company_context',true,
        'schema_version',p_payload->>'schema_version',
        'current_company_preserved',
          exists(select 1 from public.learners l where l.id=e.learner_id and l.company_id is distinct from d.company_id)
      )
    from public.enrollments e
    join public.course_editions d on d.id=e.edition_id
    where e.edition_id=v_edition_id and d.company_id is not null
    on conflict (enrollment_id) do update
      set organization_id=excluded.organization_id,
          learner_id=excluded.learner_id,
          company_id=excluded.company_id,
          edition_id=excluded.edition_id,
          source_system=excluded.source_system,
          source_project_external_id=excluded.source_project_external_id,
          source_enrollment_external_id=excluded.source_enrollment_external_id,
          context_from=excluded.context_from,
          context_until=excluded.context_until,
          metadata=public.learner_company_training_history.metadata || excluded.metadata,
          updated_at=now();
    get diagnostics v_history = row_count;
  end if;

  return v_result || jsonb_build_object(
    'preserved_current_company',v_preserved,
    'training_company_history_rows',v_history
  );
end;
$$;

revoke all on function public.import_safetymanager_package(jsonb) from public, anon;
grant execute on function public.import_safetymanager_package(jsonb) to authenticated, service_role;

create or replace function public.admin_learner_company_history(p_learner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_org uuid;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select organization_id into v_org from public.learners where id=p_learner_id;
  if v_org is null then raise exception 'learner_not_found'; end if;
  if not private.is_platform_admin() and not private.can_manage_training_org(v_org) then
    raise exception 'forbidden' using errcode='42501';
  end if;

  select jsonb_build_object(
    'learner_id',l.id,
    'current_company_id',l.company_id,
    'current_company_name',cc.name,
    'training_history',coalesce((
      select jsonb_agg(jsonb_build_object(
        'company_id',h.company_id,
        'company_name',c.name,
        'edition_id',h.edition_id,
        'enrollment_id',h.enrollment_id,
        'edition_title',d.title,
        'context_from',h.context_from,
        'context_until',h.context_until,
        'source_system',h.source_system,
        'source_project_external_id',h.source_project_external_id,
        'source_enrollment_external_id',h.source_enrollment_external_id,
        'is_current_company',(l.company_id=h.company_id)
      ) order by h.context_from desc nulls last,h.created_at desc)
      from public.learner_company_training_history h
      join public.companies c on c.id=h.company_id
      join public.course_editions d on d.id=h.edition_id
      where h.learner_id=l.id
    ),'[]'::jsonb)
  ) into v_result
  from public.learners l
  left join public.companies cc on cc.id=l.company_id
  where l.id=p_learner_id;

  return v_result;
end;
$$;
revoke all on function public.admin_learner_company_history(uuid) from public, anon;
grant execute on function public.admin_learner_company_history(uuid) to authenticated, service_role;
