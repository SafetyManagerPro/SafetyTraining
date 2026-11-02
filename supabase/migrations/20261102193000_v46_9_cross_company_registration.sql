-- SafetyTraining v46.9: audited cross-company public-registration review.
-- No learner company reassignment, account duplication, or historical-data rewriting.
-- Preserve all existing enrollment protections; allow only a verified in-transaction exception.
do $guard$
declare original text;patched text;
  needle text:='or (v_company is not null and v_learner_company is distinct from v_company) then';
  replacement text:=$new$or (v_company is not null and v_learner_company is distinct from v_company
    and not (
      new.metadata->>'enrollment_source'='public_registration_cross_company_v46_9'
      and new.metadata->>'company_review_confirmed'='true'
      and new.metadata->>'company_reviewed_by'=auth.uid()::text
      and new.metadata->>'company_review_request_id'=pg_catalog.current_setting('safetytraining.cross_company_request',true)
      and private.can_manage_training_org(v_org)
      and exists (
        select 1 from private.course_registration_requests_v36 r
        join public.learners ll on ll.id=new.learner_id
        where r.id::text=new.metadata->>'company_review_request_id'
          and r.edition_id=new.edition_id and r.status='pending'
          and ll.organization_id=v_org
          and lower(btrim(coalesce(ll.email,'')))=r.email
          and r.fiscal_code is not null and ll.fiscal_code_normalized=r.fiscal_code
      )
    )
  ) then$new$;
begin
  original:=pg_catalog.pg_get_functiondef('private.validate_admin_enrollment_write()'::regprocedure);
  if pg_catalog.strpos(original,needle)=0 then
    raise exception 'unexpected_enrollment_guardrail_version' using errcode='22023';
  end if;
  patched:=pg_catalog.replace(original,needle,replacement);
  execute patched;
end;
$guard$;

create or replace function public.admin_registration_company_review_v46_9(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $review$
declare
  v_req private.course_registration_requests_v36%rowtype;
  v_ed public.course_editions%rowtype;
  v_l public.learners%rowtype;
  v_count integer;v_history integer;
  v_old text;v_new text;v_valid boolean;
begin
  if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
  select * into v_req from private.course_registration_requests_v36 where id=p_request_id;
  if not found then raise exception 'request_not_found' using errcode='22023';end if;
  select * into v_ed from public.course_editions where id=v_req.edition_id;
  if not found or not private.can_manage_training_org(v_ed.organization_id) then
    raise exception 'admin_required' using errcode='42501';end if;
  if v_req.status<>'pending' then
    return jsonb_build_object('review_needed',false,'reason_code','request_already_reviewed');end if;
  select count(*) into v_count from public.learners l
    where l.organization_id=v_ed.organization_id
      and (lower(btrim(coalesce(l.email,'')))=v_req.email or
        (v_req.fiscal_code is not null and l.fiscal_code_normalized=v_req.fiscal_code));
  if v_count<>1 then
    return jsonb_build_object('review_needed',false,'reason_code',
      case when v_count>1 then 'multiple_matching_learners_manual_review' else 'no_existing_learner' end);
  end if;
  select * into v_l from public.learners l where l.organization_id=v_ed.organization_id
    and (lower(btrim(coalesce(l.email,'')))=v_req.email or
      (v_req.fiscal_code is not null and l.fiscal_code_normalized=v_req.fiscal_code)) limit 1;
  if v_ed.company_id is null or v_l.company_id is not distinct from v_ed.company_id then
    return jsonb_build_object('review_needed',false,'reason_code','same_company');end if;
  v_valid:=v_ed.status='open' and v_l.active
    and lower(btrim(coalesce(v_l.email,'')))=v_req.email
    and v_req.fiscal_code is not null
    and v_l.fiscal_code_normalized=v_req.fiscal_code;
  select name into v_old from public.companies where id=v_l.company_id;
  select name into v_new from public.companies where id=v_ed.company_id;
  select count(*) into v_history from public.enrollments where learner_id=v_l.id;
  return jsonb_build_object(
    'review_needed',true,'eligible',v_valid,
    'reason_code',case when v_valid then 'same_person_different_company'
                       else 'identity_or_edition_requires_manual_review' end,
    'existing_learner_id',v_l.id,
    'existing_company',coalesce(v_old,'Senza azienda assegnata'),
    'edition_company',coalesce(v_new,'Azienda non disponibile'),
    'historical_enrollments',v_history,
    'already_enrolled',exists(select 1 from public.enrollments
      where learner_id=v_l.id and edition_id=v_ed.id));
end;
$review$;

create or replace function public.admin_registration_company_approve_v46_9(
  p_request_id uuid,p_existing_learner_id uuid,p_confirm_identity boolean,p_note text)
returns jsonb language plpgsql security definer set search_path=''
as $approve$
declare
  v_req private.course_registration_requests_v36%rowtype;
  v_ed public.course_editions%rowtype;
  v_l public.learners%rowtype;
  v_count integer;
  v_note text:=btrim(coalesce(p_note,''));
begin
  if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
  if p_confirm_identity is distinct from true or length(v_note) not between 20 and 500 then
    raise exception 'identity_confirmation_and_reason_required' using errcode='22023';end if;
  select * into v_req from private.course_registration_requests_v36 where id=p_request_id for update;
  if not found then raise exception 'request_not_found' using errcode='22023';end if;
  select * into v_ed from public.course_editions where id=v_req.edition_id;
  if not found or not private.can_manage_training_org(v_ed.organization_id) then
    raise exception 'admin_required' using errcode='42501';end if;
  if v_req.status<>'pending' then raise exception 'request_already_reviewed' using errcode='22023';end if;
  if v_ed.status<>'open' or v_ed.company_id is null then
    raise exception 'edition_must_be_open_and_company_scoped' using errcode='22023';end if;
  select count(*) into v_count from public.learners l
    where l.organization_id=v_ed.organization_id
      and (lower(btrim(coalesce(l.email,'')))=v_req.email or
        (v_req.fiscal_code is not null and l.fiscal_code_normalized=v_req.fiscal_code));
  if v_count<>1 then
    raise exception 'multiple_or_missing_matching_learners_manual_review' using errcode='22023';end if;
  select * into v_l from public.learners where id=p_existing_learner_id for update;
  if not found or v_l.organization_id is distinct from v_ed.organization_id
    or not v_l.active
    or v_l.company_id is not distinct from v_ed.company_id
    or lower(btrim(coalesce(v_l.email,''))) is distinct from v_req.email
    or v_req.fiscal_code is null
    or v_l.fiscal_code_normalized is distinct from v_req.fiscal_code then
    raise exception 'identity_or_company_review_failed' using errcode='22023';end if;
  if exists(select 1 from public.enrollments where learner_id=v_l.id and edition_id=v_ed.id) then
    raise exception 'existing_enrollment_requires_manual_review' using errcode='22023';end if;

  -- Only the server can establish this transaction-local marker; a direct
  -- authenticated PostgREST INSERT remains protected by the original trigger.
  perform pg_catalog.set_config('safetytraining.cross_company_request',p_request_id::text,true);
  insert into public.enrollments(edition_id,learner_id,status,metadata)
  values(v_ed.id,v_l.id,'not_started',jsonb_build_object(
    'enrollment_source','public_registration_cross_company_v46_9',
    'company_review_request_id',p_request_id::text,
    'company_review_confirmed','true',
    'company_reviewed_by',auth.uid()::text,
    'edition_company_id',v_ed.company_id,
    'existing_learner_company_id',v_l.company_id));
  update private.course_registration_requests_v36
    set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),learner_id=v_l.id
    where id=p_request_id;
  insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
  values(auth.uid(),'registration.cross_company_manual_approve','learner',v_l.id,v_ed.organization_id,
    jsonb_build_object('edition_id',v_ed.id,'request_id',v_req.id,
      'existing_company_id',v_l.company_id,
      'edition_company_id',v_ed.company_id,
      'identity_confirmed',true,'reason',v_note,'history_preserved',true));
  return jsonb_build_object('status','approved','learner_id',v_l.id,
    'edition_id',v_ed.id,'review_mode','cross_company_manual');
end;
$approve$;

revoke all on function public.admin_registration_company_review_v46_9(uuid) from public,anon;
revoke all on function public.admin_registration_company_approve_v46_9(uuid,uuid,boolean,text) from public,anon;
grant execute on function public.admin_registration_company_review_v46_9(uuid),
  public.admin_registration_company_approve_v46_9(uuid,uuid,boolean,text) to authenticated;
