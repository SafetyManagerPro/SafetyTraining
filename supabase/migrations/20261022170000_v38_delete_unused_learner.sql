-- v38: irreversible one-step deletion only for profiles never used in training.
-- Every learner, enrollment and related row is checked before CASCADE can run.
create or replace function public.admin_delete_unused_learner_v38(p_learner_id uuid,p_confirmation text)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid;v_auth uuid;v_metadata jsonb;v_count int;
begin
 if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
 if p_confirmation<>'ELIMINA' then raise exception 'typed_confirmation_required';end if;
 select organization_id,auth_user_id,metadata into v_org,v_auth,v_metadata
 from public.learners where id=p_learner_id for update;
 if v_org is null then raise exception 'learner_not_found';end if;
 if not private.can_manage_training_org(v_org) then raise exception 'admin_required' using errcode='42501';end if;
 if v_auth is not null or v_metadata ? 'archived_auth_user_id_v37' then
  raise exception 'linked_account_protected_use_detailed_deletion';
 end if;
 if exists(select 1 from public.learner_company_training_history where learner_id=p_learner_id) then
  raise exception 'learner_has_training_history_protected';
 end if;
 if exists(select 1 from public.learner_account_invitations where learner_id=p_learner_id and status='accepted') then
  raise exception 'accepted_account_invitation_protected';
 end if;
 -- Lock enrollments to prevent a concurrent session from creating progress while we inspect.
 perform 1 from public.enrollments where learner_id=p_learner_id for update;
 if exists(select 1 from public.enrollments where learner_id=p_learner_id
  and (status not in ('not_started','revoked') or coalesce(progress_pct,0)<>0 or
   coalesce(active_seconds,0)<>0 or final_score_pct is not null or
   started_at is not null or completed_at is not null or last_activity_at is not null)) then
  raise exception 'learner_has_training_activity_protected';
 end if;
 if exists(select 1 from public.learning_events x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 or exists(select 1 from public.learning_progress x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 or exists(select 1 from public.learning_sessions x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 or exists(select 1 from public.test_attempts x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 or exists(select 1 from public.question_attempts x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 or exists(select 1 from public.enrollment_requirement_evidence x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 or exists(select 1 from public.enrollment_practice_assessments_v22 x join public.enrollments en on en.id=x.enrollment_id where en.learner_id=p_learner_id)
 then raise exception 'learner_has_training_evidence_protected';
 end if;
 select count(*) into v_count from public.enrollments where learner_id=p_learner_id;
 delete from private.course_registration_requests_v36 where learner_id=p_learner_id;
 delete from public.learners where id=p_learner_id;
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
 values(auth.uid(),'learner.delete_unused','learner',p_learner_id,v_org,
 jsonb_build_object('removed_empty_enrollments',v_count,'no_training_evidence',true));
 return jsonb_build_object('deleted',true,'learner_id',p_learner_id,'empty_enrollments_removed',v_count);
end;$fn$;
revoke execute on function public.admin_delete_unused_learner_v38(uuid,text) from public,anon;
grant execute on function public.admin_delete_unused_learner_v38(uuid,text) to authenticated;
