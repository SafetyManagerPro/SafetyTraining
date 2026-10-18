-- Applied to Supabase on 2026-10-18 as migration 20261018163653.
-- Fix SQLSTATE 42883: PostgreSQL does not support min(uuid).
-- Preserve original single-candidate email matching and invitation guard behavior.
create or replace function public.claim_learner_account()
returns uuid
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed timestamptz;
  v_candidate uuid;
  v_count integer;
begin
  if v_uid is null then return null; end if;
  select u.email,u.email_confirmed_at into v_email,v_confirmed
  from auth.users u where u.id=v_uid;
  if v_email is null or v_confirmed is null then return null; end if;
  select count(*),(array_agg(l.id order by l.id))[1] into v_count,v_candidate
  from public.learners l
  where l.active and l.auth_user_id is null
    and l.email is not null and lower(btrim(l.email))=lower(btrim(v_email));
  if v_count<>1 or v_candidate is null then return null; end if;
  update public.learners set auth_user_id=v_uid,updated_at=now()
  where id=v_candidate and auth_user_id is null
  returning id into v_candidate;
  return v_candidate;
end;
$function$;
