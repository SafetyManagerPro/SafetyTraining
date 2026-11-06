-- v37: immediate learner archive also unlinks the Auth mapping used by enrollment RLS.
-- Training attendance/tests/history remain untouched.
create or replace function public.admin_archive_learner_v36(p_learner_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid; v_auth uuid;
begin
 if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
 select organization_id,auth_user_id into v_org,v_auth from public.learners
 where id=p_learner_id for update;
 if v_org is null then raise exception 'learner_not_found';end if;
 if not private.can_manage_training_org(v_org) then raise exception 'admin_required' using errcode='42501';end if;
 update public.learners set active=false,auth_user_id=null,updated_at=now(),
 metadata=coalesce(metadata,'{}'::jsonb)||
 (case when v_auth is not null then jsonb_build_object('archived_auth_user_id_v37',v_auth::text) else '{}'::jsonb end)
 where id=p_learner_id;
 update public.learner_account_invitations set status='revoked',revoked_at=now(),token_hash=null,updated_at=now()
 where learner_id=p_learner_id and status<>'accepted';
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
 values(auth.uid(),'learner.archive','learner',p_learner_id,v_org,
 jsonb_build_object('auth_link_disabled',v_auth is not null,'evidence_preserved',true));
 return jsonb_build_object('status','archived','learner_id',p_learner_id,'auth_link_disabled',v_auth is not null);
end;$fn$;

create or replace function public.admin_restore_learner_v37(p_learner_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare v_org uuid;v_saved uuid;v_can_relink boolean:=false;
begin
 if auth.uid() is null then raise exception 'admin_required' using errcode='42501';end if;
 select organization_id,nullif(metadata->>'archived_auth_user_id_v37','')::uuid into v_org,v_saved
 from public.learners where id=p_learner_id for update;
 if v_org is null then raise exception 'learner_not_found';end if;
 if not private.can_manage_training_org(v_org) then raise exception 'admin_required' using errcode='42501';end if;
 if v_saved is not null then
  select exists(select 1 from auth.users where id=v_saved) and
   not exists(select 1 from public.learners where auth_user_id=v_saved and id<>p_learner_id)
  into v_can_relink;
 end if;
 update public.learners set active=true,auth_user_id=case when v_can_relink then v_saved else auth_user_id end,
 metadata=coalesce(metadata,'{}'::jsonb)-'archived_auth_user_id_v37',updated_at=now()
 where id=p_learner_id;
 insert into private.admin_audit_log(actor_user_id,action,entity_type,entity_id,organization_id,context)
 values(auth.uid(),'learner.restore','learner',p_learner_id,v_org,jsonb_build_object('auth_link_restored',v_can_relink));
 return jsonb_build_object('status','active','learner_id',p_learner_id,'auth_link_restored',v_can_relink);
end;$fn$;
revoke execute on function public.admin_archive_learner_v36(uuid) from public,anon;
revoke execute on function public.admin_restore_learner_v37(uuid) from public,anon;
grant execute on function public.admin_archive_learner_v36(uuid),public.admin_restore_learner_v37(uuid) to authenticated;
