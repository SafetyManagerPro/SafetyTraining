-- SafetyTraining v44_001 — fascicolo documentale associato a una specifica iscrizione.
-- Prima pubblicazione limitata al platform_admin; accesso corsista solo dopo attestato verificato.
create table public.learner_course_documents (
 id uuid primary key default gen_random_uuid(),
 enrollment_id uuid not null references public.enrollments(id) on delete restrict,
 learner_id uuid not null references public.learners(id) on delete restrict,
 kind text not null check (kind in ('attestato','nomina_preposto','designazione_primo_soccorso','designazione_antincendio','autorizzazione_attrezzatura','incarico_quota_dpi','incarico_generico','verbale_consegna_dpi','istruzioni_sicurezza','altro_documento')),
 title text not null check (length(trim(title)) between 3 and 180),
 document_status text not null default 'draft' check (document_status in ('draft','published','retired')),
 is_required boolean not null default false,
 storage_path text, original_filename text, notes text,
 verified_signature boolean not null default false,
 approved_by text, issued_at date, published_at timestamptz,
 created_by uuid default auth.uid(), updated_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(enrollment_id,kind),
 check (storage_path is null or length(storage_path)<500)
);
create index learner_course_documents_person_idx on public.learner_course_documents(learner_id,enrollment_id);
create index learner_course_documents_publication_idx on public.learner_course_documents(enrollment_id,kind,document_status);

create or replace function private.check_learner_course_document()
returns trigger language plpgsql security invoker set search_path=''
as $fn$
declare v_learner_id uuid;v_status text;
begin
 select e.learner_id,e.status into v_learner_id,v_status
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
  if v_status not in ('completed','passed') then
   raise exception 'Pubblicazione possibile solo per iscrizioni completate con esito ammesso';
  end if;
  if new.storage_path is null or btrim(coalesce(new.approved_by,''))='' or new.verified_signature is distinct from true then
   raise exception 'Pubblicazione bloccata: servono PDF, verifica firma e approvatore';
  end if;
  if new.kind <> 'attestato' and not exists (
    select 1 from public.learner_course_documents c
    where c.enrollment_id=new.enrollment_id and c.kind='attestato' and c.document_status='published'
  ) then
   raise exception 'Pubblica prima l’attestato della stessa iscrizione';
  end if;
  if tg_op='INSERT' or old.document_status is distinct from 'published' then
   new.published_at=now();
  end if;
 else
  new.published_at=null;
 end if;
 new.updated_at=now();new.updated_by=auth.uid();
 return new;
end $fn$;
create trigger trg_check_learner_course_document
before insert or update on public.learner_course_documents
for each row execute function private.check_learner_course_document();

create or replace function private.can_read_learner_course_document(p_learner uuid,p_enrollment uuid,p_kind text)
returns boolean language sql stable security definer set search_path=''
as $fn$
select (select auth.uid()) is not null
and exists (
  select 1 from public.learners l join public.enrollments e on e.learner_id=l.id
  where l.id=p_learner and e.id=p_enrollment and l.auth_user_id=(select auth.uid())
  and l.active=true and e.status in ('completed','passed')
)
and (p_kind='attestato' or exists (
  select 1 from public.learner_course_documents c where c.enrollment_id=p_enrollment
  and c.kind='attestato' and c.document_status='published'
));
$fn$;
revoke all on function private.can_read_learner_course_document(uuid,uuid,text) from public,anon;
grant execute on function private.can_read_learner_course_document(uuid,uuid,text) to authenticated;
revoke all on function private.check_learner_course_document() from public,anon,authenticated;
alter table public.learner_course_documents enable row level security;
revoke all on public.learner_course_documents from anon,authenticated;
grant select,insert,update,delete on public.learner_course_documents to authenticated;
create policy lcd_platform_admin_manage on public.learner_course_documents for all
to authenticated using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
create policy lcd_learner_read_published on public.learner_course_documents for select
to authenticated using (document_status='published'
  and private.can_read_learner_course_document(learner_id,enrollment_id,kind));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('learner-course-documents','learner-course-documents',false,15728640,array['application/pdf'])
on conflict (id) do nothing;
create policy "learner course docs admin read" on storage.objects for select to authenticated
using (bucket_id='learner-course-documents' and (select private.is_platform_admin()));
create policy "learner course docs admin insert" on storage.objects for insert to authenticated
with check(bucket_id='learner-course-documents' and (select private.is_platform_admin()));
create policy "learner course docs admin update" on storage.objects for update to authenticated
using (bucket_id='learner-course-documents' and (select private.is_platform_admin()))
with check(bucket_id='learner-course-documents' and (select private.is_platform_admin()));
create policy "learner course docs admin delete" on storage.objects for delete to authenticated
using (bucket_id='learner-course-documents' and (select private.is_platform_admin()));
create policy "learner course docs recipient read" on storage.objects for select to authenticated
using (bucket_id='learner-course-documents' and exists(
  select 1 from public.learner_course_documents d
  where d.storage_path=storage.objects.name and d.document_status='published'
    and private.can_read_learner_course_document(d.learner_id,d.enrollment_id,d.kind)
));
