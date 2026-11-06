-- SafetyTraining v22.5.1: read-only deletion impact inspection.
-- No DELETE, UPDATE, TRUNCATE or other data-modifying commands.

create or replace function public.admin_delete_capabilities_v25()
returns jsonb language sql stable security invoker set search_path='' as $fn$
  select pg_catalog.jsonb_build_object(
    'version','v25',
    'preview_ready', auth.uid() is not null and private.is_platform_admin(),
    'ready', false,
    'execution_enabled', false
  );
$fn$;

create or replace function public.admin_preview_deletion_v25(
  p_kind text, p_root_id uuid, p_actions jsonb, p_delete_parent boolean
) returns jsonb
language plpgsql stable security invoker set search_path='' as $fn$
declare
  v_root text;
  v_row jsonb;
  v_impact jsonb := '[]'::jsonb;
  v_actions integer := 0;
  v_child text;
  v_fk text;
  v_action text;
  v_key jsonb;
  v_item jsonb;
  v_existing boolean;
  v_count bigint;
  v_primary text;
  v_seen text[] := '{}'::text[];
  v_warning jsonb := '[]'::jsonb;
  v_dep record;
begin
  if auth.uid() is null or not private.is_platform_admin() then
    raise exception 'platform_admin_required' using errcode='42501';
  end if;
  if p_root_id is null or p_kind not in ('company','learner','edition','enrollment')
     or p_actions is null or pg_catalog.jsonb_typeof(p_actions) <> 'array'
     or pg_catalog.jsonb_array_length(p_actions) > 300 then
    raise exception 'invalid_deletion_preview_request' using errcode='22023';
  end if;
  v_root := case p_kind
    when 'company' then 'companies' when 'learner' then 'learners'
    when 'edition' then 'course_editions' when 'enrollment' then 'enrollments' end;
  execute pg_catalog.format('select to_jsonb(t) from public.%I t where id=$1',v_root)
    into v_row using p_root_id;
  if v_row is null then raise exception 'root_not_found_or_not_visible' using errcode='P0002'; end if;
  if p_kind='learner' and coalesce(p_delete_parent,false) and nullif(v_row->>'auth_user_id','') is not null then
    v_warning:=v_warning || pg_catalog.jsonb_build_array(
      'Profilo collegato a un account di autenticazione: verificare l’identità prima della rimozione.');
  end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_actions) loop
    v_key := nullif(v_item->>'key','')::jsonb;
    v_action := v_item->>'action';
    if v_action not in ('delete','unlink') or v_key is null
      or pg_catalog.jsonb_typeof(v_key)<>'array'
      or pg_catalog.jsonb_array_length(v_key) not in (2,3) then
      raise exception 'invalid_selected_action' using errcode='22023';
    end if;
    if v_key::text=any(v_seen) then raise exception 'duplicate_selected_action' using errcode='22023'; end if;
    v_seen:=pg_catalog.array_append(v_seen,v_key::text);
    v_child := v_key->>0;
    v_fk := case
      when p_kind='company' and v_child in ('learners','course_editions','organization_memberships','learner_company_training_history') then 'company_id'
      when p_kind='company' and v_child='integration_training_contexts' then 'local_company_id'
      when p_kind='learner' and v_child in ('enrollments','learner_account_invitations','learner_company_training_history') then 'learner_id'
      when p_kind='edition' and v_child in ('enrollments','learner_company_training_history') then 'edition_id'
      when p_kind='edition' and v_child='integration_training_contexts' then 'local_edition_id'
      when p_kind='enrollment' and v_child in (
        'learning_events','learning_progress','learning_sessions','test_attempts',
        'question_attempts','enrollment_requirement_evidence',
        'enrollment_practice_assessments_v22','learner_company_training_history'
      ) then 'enrollment_id'
      else null end;
    if v_fk is null then raise exception 'selected_child_not_allowed_in_scope' using errcode='22023'; end if;
    if v_action='unlink' and not (
        (v_child='learners' and v_fk='company_id') or
        (v_child='course_editions' and v_fk='company_id') or
        (v_child='integration_training_contexts' and v_fk in ('local_company_id','local_edition_id'))
    ) then raise exception 'unlink_not_supported_for_required_relation' using errcode='22023'; end if;
    if v_child in ('learning_progress','integration_training_contexts') then
      if pg_catalog.jsonb_array_length(v_key)<>3 then
        raise exception 'composite_identity_required' using errcode='22023';
      end if;
      if v_child='learning_progress' then
        execute pg_catalog.format(
          'select exists(select 1 from public.learning_progress where enrollment_id::text=$1 and unit_version_id::text=$2 and %I::text=$3)',v_fk)
          into v_existing using v_key->>1,v_key->>2,p_root_id::text;
      else
        execute pg_catalog.format(
          'select exists(select 1 from public.integration_training_contexts where source_system=$1 and external_project_id=$2 and %I::text=$3)',v_fk)
          into v_existing using v_key->>1,v_key->>2,p_root_id::text;
      end if;
    else
      if pg_catalog.jsonb_array_length(v_key)<>2 then raise exception 'row_identity_required' using errcode='22023'; end if;
      execute pg_catalog.format(
        'select exists(select 1 from public.%I where id::text=$1 and %I::text=$2)',v_child,v_fk)
        into v_existing using v_key->>1,p_root_id::text;
    end if;
    if not coalesce(v_existing,false) then
      raise exception 'selected_row_missing_or_outside_root' using errcode='P0002';
    end if;
    v_actions:=v_actions+1;
    v_impact:=v_impact || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'label',v_child,'action',v_action,'count',1,'selected',true));
    if v_action='delete' and v_child in ('test_attempts','learning_sessions') then
      v_warning:=v_warning || pg_catalog.jsonb_build_array(
        case when v_child='test_attempts'
          then 'Le risposte test_answers sono collegate al tentativo; verificare la loro presenza.'
          else 'Gli eventi della sessione possono essere eliminati; le risposte possono perdere il collegamento.' end);
    end if;
  end loop;

  -- Count all direct referencing rows visible with the current caller's RLS.
  -- These counts are informational: the server is not approved to execute deletion.
  for v_dep in
    select cl.relname as child,a.attname as fk,
      case c.confdeltype when 'c' then 'CASCADE'
        when 'n' then 'SET NULL' when 'r' then 'RESTRICT' else 'NO ACTION' end as effect
    from pg_catalog.pg_constraint c
    join pg_catalog.pg_class cl on cl.oid=c.conrelid
    join pg_catalog.pg_namespace n on n.oid=cl.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    where c.contype='f' and n.nspname='public'
      and c.confrelid=pg_catalog.to_regclass('public.'||v_root)
      and pg_catalog.array_length(c.conkey,1)=1
  loop
    execute pg_catalog.format('select count(*) from public.%I where %I::text=$1',v_dep.child,v_dep.fk)
      into v_count using p_root_id::text;
    if v_count>0 then
      v_impact:=v_impact || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'label',v_dep.child,'action','Possibile '||v_dep.effect,
        'count',v_count,'selected',false));
    end if;
  end loop;
  return pg_catalog.jsonb_build_object(
    'version','v25','preview_ready',true,'execution_ready',false,
    'safe',false,'impact',v_impact,'validated_actions',v_actions,
    'delete_parent_requested',coalesce(p_delete_parent,false),
    'warnings',v_warning,
    'message','Anteprima in sola lettura: transazione di eliminazione non installata.'
  );
end;
$fn$;

revoke all on function public.admin_delete_capabilities_v25() from public,anon;
revoke all on function public.admin_preview_deletion_v25(text,uuid,jsonb,boolean) from public,anon;
grant execute on function public.admin_delete_capabilities_v25() to authenticated;
grant execute on function public.admin_preview_deletion_v25(text,uuid,jsonb,boolean) to authenticated;

