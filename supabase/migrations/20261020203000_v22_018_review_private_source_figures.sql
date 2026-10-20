-- v22_018: classify private PDF sources for administrative teaching review only.
-- Existing imports become RED by default: never auto-publish or treat as cleared.
alter table public.training_source_figures_v23
 add column if not exists review_class text not null default 'ROSSO',
 add column if not exists review_reason text not null default 'Fonte da ridisegnare o sottoporre a verifica';
do $guard$
begin
 if not exists (
  select 1 from pg_constraint
  where conname='training_source_figures_v23_review_class_check'
    and conrelid='public.training_source_figures_v23'::regclass
 ) then
 alter table public.training_source_figures_v23
 add constraint training_source_figures_v23_review_class_check
 check (review_class in ('ROSSO','GIALLO'));
 end if;
end
$guard$;
comment on column public.training_source_figures_v23.review_class is
'Rights/editorial review category, not a license grant; yellow admin preview only, red blocked from slide preview';
