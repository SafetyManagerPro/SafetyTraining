-- v25.1: independently review technical accuracy and usage rights of each private PDF reference.
-- Additive only: imported source metadata, original rights_status constraints, private Storage and frozen courses stay unchanged.
create table if not exists public.training_integral_pdf_reviews_v25(
 ref_id text primary key references public.training_integral_pdf_refs_v24(id) on delete cascade,
 technical_status text not null default 'pending' check (technical_status in ('pending','approved','rejected')),
 rights_status text not null default 'review_required' check (rights_status in ('review_required','cleared_internal','rejected')),
 technical_note text not null default '',
 rights_evidence text not null default '',
 reviewed_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
create table if not exists public.training_integral_pdf_review_events_v25(
 id bigint generated always as identity primary key,
 ref_id text not null,
 technical_status text not null,
 rights_status text not null,
 technical_note text not null,
 rights_evidence text not null,
 actor_id uuid not null,
 occurred_at timestamptz not null default now()
);
create index if not exists training_integral_pdf_review_events_ref_idx
 on public.training_integral_pdf_review_events_v25(ref_id,occurred_at desc);
alter table public.training_integral_pdf_reviews_v25 enable row level security;
alter table public.training_integral_pdf_review_events_v25 enable row level security;
revoke all on public.training_integral_pdf_reviews_v25 from public,anon,authenticated;
revoke all on public.training_integral_pdf_review_events_v25 from public,anon,authenticated;
grant select on public.training_integral_pdf_reviews_v25 to authenticated;
grant select on public.training_integral_pdf_review_events_v25 to authenticated;
create policy training_integral_pdf_reviews_v25_admin_read
 on public.training_integral_pdf_reviews_v25 for select to authenticated using(private.is_platform_admin());
create policy training_integral_pdf_review_events_v25_admin_read
 on public.training_integral_pdf_review_events_v25 for select to authenticated using(private.is_platform_admin());

create or replace function public.training_review_integral_pdf_v25(
 p_ref_id text,
 p_technical_status text,
 p_rights_status text,
 p_technical_note text,
 p_rights_evidence text
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_review public.training_integral_pdf_reviews_v25%rowtype;
 v_note text:=btrim(coalesce(p_technical_note,''));
 v_evidence text:=btrim(coalesce(p_rights_evidence,''));
begin
 if auth.uid() is null or not private.is_platform_admin() then
  raise exception 'Solo gli amministratori della piattaforma possono revisionare le figure.' using errcode='42501';
 end if;
 if p_ref_id is null or p_ref_id !~ '^pdf-[0-9]{5}$' or not exists(
  select 1 from public.training_integral_pdf_refs_v24 r where r.id=p_ref_id
 ) then raise exception 'Riferimento PDF inesistente o non valido.'; end if;
 if p_technical_status not in ('pending','approved','rejected') or p_technical_status is null
  or p_rights_status not in ('review_required','cleared_internal','rejected') or p_rights_status is null then
  raise exception 'Stato di revisione non riconosciuto.';
 end if;
 if length(v_note)<25 or length(v_note)>1000 then
  raise exception 'Motivazione tecnica obbligatoria: da 25 a 1000 caratteri.';
 end if;
 if length(v_evidence)>1000 then
  raise exception 'Il riferimento ai diritti deve contenere al massimo 1000 caratteri.';
 end if;
 if p_rights_status='cleared_internal' and length(v_evidence)<20 then
  raise exception 'Per confermare i diritti di uso interno indicare una licenza o autorizzazione verificabile (minimo 20 caratteri).';
 end if;
 insert into public.training_integral_pdf_reviews_v25
  (ref_id,technical_status,rights_status,technical_note,rights_evidence,reviewed_by,updated_at)
 values(p_ref_id,p_technical_status,p_rights_status,v_note,v_evidence,auth.uid(),now())
 on conflict(ref_id) do update set
  technical_status=excluded.technical_status,rights_status=excluded.rights_status,
  technical_note=excluded.technical_note,rights_evidence=excluded.rights_evidence,
  reviewed_by=excluded.reviewed_by,updated_at=excluded.updated_at
 returning * into v_review;
 insert into public.training_integral_pdf_review_events_v25
  (ref_id,technical_status,rights_status,technical_note,rights_evidence,actor_id)
 values(v_review.ref_id,v_review.technical_status,v_review.rights_status,v_review.technical_note,v_review.rights_evidence,auth.uid());
 return jsonb_build_object('ref_id',v_review.ref_id,
  'technical_status',v_review.technical_status,
  'rights_status',v_review.rights_status,
  'reviewed_by',v_review.reviewed_by,
  'updated_at',v_review.updated_at);
end
$fn$;
revoke all on function public.training_review_integral_pdf_v25(text,text,text,text,text) from public,anon;
grant execute on function public.training_review_integral_pdf_v25(text,text,text,text,text) to authenticated;
comment on table public.training_integral_pdf_reviews_v25 is
'Administrator-attested technical review and internal usage-rights evidence; never grants public publication or overrides source metadata.';
comment on function public.training_review_integral_pdf_v25(text,text,text,text,text) is
'Platform-admin-only, reasoned and audited review. No mass approval, public URLs, or auto-publication.';
