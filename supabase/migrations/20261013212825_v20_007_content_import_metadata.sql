-- Preserve source metadata from the v19 content library during the cloud import.
alter table public.learning_units
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.questions
  add column if not exists metadata jsonb not null default '{}'::jsonb;
