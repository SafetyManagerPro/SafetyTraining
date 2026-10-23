-- v44_003 Remove dependencies between printing, course completion and attestation publication.
-- Keep authenticated recipient ownership and private storage. A published PDF still needs a path.
create or replace function private.check_learner_course_document()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
declare v_learner_id uuid;
begin
 select e.learner_id into v_learner_id
 from public.enrollments e where e.id=new.enrollment_id;
 if v_learner_id is null or new.learner_id is distinct from v_learner_id then
  raise exception 'Documento e iscrizione appartengono a corsisti diversi';
 end if;
 if new.storage_path is not null and
    (new.storage_path not like (new.enrollment_id::text||'/'||new.id::text||'/%')
     or new.storage_path !~ '\.pdf$') then
  raise exception 'Percorso PDF documento non valido';
 end if;
 if new.document_status='published' then
  if new.storage_path is null then
   raise exception 'Per pubblicare è necessario allegare un PDF';
  end if;
  if tg_op='INSERT' or old.document_status is distinct from 'published' then
   new.published_at=now();
  end if;
 else new.published_at=null;
 end if;
 new.updated_at=now();new.updated_by=auth.uid();
 return new;
end $fn$;
create or replace function private.can_read_learner_course_document(
 p_learner uuid,p_enrollment uuid,p_kind text)
returns boolean language sql stable security definer set search_path=''
as $fn$
select (select auth.uid()) is not null
and exists (
 select 1 from public.learners l join public.enrollments e on e.learner_id=l.id
 where l.id=p_learner and e.id=p_enrollment and l.auth_user_id=(select auth.uid())
);
$fn$;
revoke all on function private.can_read_learner_course_document(uuid,uuid,text) from public,anon;
grant execute on function private.can_read_learner_course_document(uuid,uuid,text) to authenticated;
