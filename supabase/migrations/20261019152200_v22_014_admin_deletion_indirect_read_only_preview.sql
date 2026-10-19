-- Read-only SQL; tracks the database-installed function. No DELETE, UPDATE, or destructive executor.
CREATE OR REPLACE FUNCTION public.admin_preview_deletion_v25(p_kind text, p_root_id uuid, p_actions jsonb, p_delete_parent boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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

  v_selected_enrollments uuid[] := '{}'::uuid[];
  v_selected_learners uuid[] := '{}'::uuid[];
  v_selected_editions uuid[] := '{}'::uuid[];
  v_selected_sessions uuid[] := '{}'::uuid[];
  v_selected_attempts uuid[] := '{}'::uuid[];
  v_impacted_enrollments uuid[] := '{}'::uuid[];
  v_impacted_sessions uuid[] := '{}'::uuid[];
  v_impacted_attempts uuid[] := '{}'::uuid[];
  v_stat record;

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

    -- Only already-validated explicit DELETE decisions enter the impact graph.
    if v_action='delete' then
      if v_child='enrollments' then
        v_selected_enrollments := pg_catalog.array_append(v_selected_enrollments,(v_key->>1)::uuid);
      elsif v_child='learners' then
        v_selected_learners := pg_catalog.array_append(v_selected_learners,(v_key->>1)::uuid);
      elsif v_child='course_editions' then
        v_selected_editions := pg_catalog.array_append(v_selected_editions,(v_key->>1)::uuid);
      elsif v_child='learning_sessions' then
        v_selected_sessions := pg_catalog.array_append(v_selected_sessions,(v_key->>1)::uuid);
      elsif v_child='test_attempts' then
        v_selected_attempts := pg_catalog.array_append(v_selected_attempts,(v_key->>1)::uuid);
      end if;
    end if;

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

  -- Conservative, read-only two-level/three-level effects of *requested*
  -- root/child deletions. Counts are RLS-visible, never approval to DELETE.
  select coalesce(pg_catalog.array_agg(distinct e.id),'{}'::uuid[])
    into v_impacted_enrollments
  from public.enrollments e
  where e.id=any(v_selected_enrollments)
    or e.learner_id=any(v_selected_learners)
    or e.edition_id=any(v_selected_editions)
    or (coalesce(p_delete_parent,false) and (
       (p_kind='enrollment' and e.id=p_root_id)
       or (p_kind='learner' and e.learner_id=p_root_id)
       or (p_kind='edition' and e.edition_id=p_root_id)
       or (p_kind='company' and (
         exists(select 1 from public.learners l
           where l.id=e.learner_id and l.company_id=p_root_id)
         or exists(select 1 from public.course_editions d
           where d.id=e.edition_id and d.company_id=p_root_id)
       ))
    ));

  select coalesce(pg_catalog.array_agg(distinct s.id),'{}'::uuid[])
    into v_impacted_sessions
  from public.learning_sessions s
  where s.enrollment_id=any(v_impacted_enrollments)
    or s.id=any(v_selected_sessions);

  select coalesce(pg_catalog.array_agg(distinct t.id),'{}'::uuid[])
    into v_impacted_attempts
  from public.test_attempts t
  where t.enrollment_id=any(v_impacted_enrollments)
    or t.id=any(v_selected_attempts);

  for v_stat in
    select label,effect,row_count from (
      values
        ('enrollments','CASCADE',coalesce(pg_catalog.array_length(v_impacted_enrollments,1),0)::bigint),
        ('learning_sessions','CASCADE',coalesce(pg_catalog.array_length(v_impacted_sessions,1),0)::bigint),
        ('test_attempts','CASCADE',coalesce(pg_catalog.array_length(v_impacted_attempts,1),0)::bigint),
        ('test_answers','CASCADE',(
          select count(*) from public.test_answers a
          where a.test_attempt_id=any(v_impacted_attempts))),
        ('learning_events','CASCADE',(
          select count(*) from public.learning_events ev
          where ev.enrollment_id=any(v_impacted_enrollments)
          or ev.session_id=any(v_impacted_sessions))),
        ('learning_progress','CASCADE',(
          select count(*) from public.learning_progress pr
          where pr.enrollment_id=any(v_impacted_enrollments))),
        ('question_attempts','CASCADE',(
          select count(*) from public.question_attempts qa
          where qa.enrollment_id=any(v_impacted_enrollments))),
        ('question_attempts','SET NULL',(
          select count(*) from public.question_attempts qa
          where qa.session_id=any(v_impacted_sessions)
            and not(qa.enrollment_id=any(v_impacted_enrollments)))),
        ('enrollment_requirement_evidence','CASCADE',(
          select count(*) from public.enrollment_requirement_evidence re
          where re.enrollment_id=any(v_impacted_enrollments))),
        ('enrollment_practice_assessments_v22','CASCADE',(
          select count(*) from public.enrollment_practice_assessments_v22 pa
          where pa.enrollment_id=any(v_impacted_enrollments))),
        ('learner_company_training_history','CASCADE',(
          select count(*) from public.learner_company_training_history th
          where th.enrollment_id=any(v_impacted_enrollments)))
    ) as risk(label,effect,row_count)
  loop
    if v_stat.row_count>0 then
      v_impact := v_impact || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'label',v_stat.label,'action','Effetto indiretto '||v_stat.effect,
          'count',v_stat.row_count,'selected',false,'source','indirect_rls_visible'));
    end if;
  end loop;
  if pg_catalog.array_length(v_impacted_enrollments,1)>0
     or pg_catalog.array_length(v_impacted_sessions,1)>0
     or pg_catalog.array_length(v_impacted_attempts,1)>0 then
    v_warning:=v_warning || pg_catalog.jsonb_build_array(
      'Il conteggio indiretto considera i dati visibili alle policy RLS. Non è una verifica transazionale completa e non abilita la cancellazione.');
  end if;

  return pg_catalog.jsonb_build_object(
    'version','v25','preview_ready',true,'execution_ready',false,
    'safe',false,'impact',v_impact,'validated_actions',v_actions,
    'delete_parent_requested',coalesce(p_delete_parent,false),
    'warnings',v_warning,
    'message','Anteprima in sola lettura: transazione di eliminazione non installata.'
  );
end;
$function$

