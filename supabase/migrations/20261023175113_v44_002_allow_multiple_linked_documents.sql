-- SafetyTraining v44_002 — consente più allegati dello stesso tipo per ogni iscrizione.
-- Il vincolo univoco rimane soltanto sull'attestato non ritirato.
alter table public.learner_course_documents
 drop constraint if exists learner_course_documents_enrollment_id_kind_key;
create unique index if not exists learner_course_documents_single_certificate
 on public.learner_course_documents(enrollment_id)
 where kind='attestato' and document_status in ('draft','published');
