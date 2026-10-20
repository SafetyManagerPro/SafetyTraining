-- v24 complete figures extracted from 14 CNA source PDFs. Private and administrative only.
update storage.buckets set file_size_limit=5242880,
 allowed_mime_types=array['image/jpeg','image/webp']::text[]
 where id='training-source-figures' and public=false;
create table if not exists public.training_integral_pdf_assets_v24(
 id text primary key check(id ~ '^img-[0-9a-f]{20}$'),
 storage_path text unique not null check(storage_path ~ '^integral/v1/img-[0-9a-f]{20}[.]webp$'),
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 bytes integer not null check(bytes>0 and bytes<=5242880),
 width integer not null check(width>0),
 height integer not null check(height>0),
 rights_status text not null default 'review_required' check(rights_status='review_required'),
 created_at timestamptz not null default now()
);
create table if not exists public.training_integral_pdf_refs_v24(
 id text primary key check(id ~ '^pdf-[0-9]{5}$'),
 asset_id text not null references public.training_integral_pdf_assets_v24(id),
 source_document text not null,
 source_page integer not null check(source_page>0),
 category text not null,
 topic text not null default '',
 source_kind text not null default 'embedded',
 candidate_course_keys text[] not null default '{}'::text[],
 citation text not null,
 technical_review_required boolean not null default true,
 rights_status text not null default 'review_required' check(rights_status='review_required'),
 created_at timestamptz not null default now()
);
create index if not exists training_integral_pdf_refs_course_gin on public.training_integral_pdf_refs_v24 using gin(candidate_course_keys);
create index if not exists training_integral_pdf_refs_asset_idx on public.training_integral_pdf_refs_v24(asset_id);
alter table public.training_integral_pdf_assets_v24 enable row level security;
alter table public.training_integral_pdf_refs_v24 enable row level security;
grant select,insert,update on public.training_integral_pdf_assets_v24 to authenticated;
grant select,insert,update on public.training_integral_pdf_refs_v24 to authenticated;
do $$begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_integral_pdf_assets_v24' and policyname='integral_pdf_assets_platform_admin') then
 create policy integral_pdf_assets_platform_admin on public.training_integral_pdf_assets_v24 for all to authenticated
 using (private.is_platform_admin()) with check(private.is_platform_admin() and rights_status='review_required');
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_integral_pdf_refs_v24' and policyname='integral_pdf_refs_platform_admin') then
 create policy integral_pdf_refs_platform_admin on public.training_integral_pdf_refs_v24 for all to authenticated
 using (private.is_platform_admin()) with check(private.is_platform_admin() and rights_status='review_required');
 end if;
end$$;
comment on table public.training_integral_pdf_refs_v24 is 'Page-level provenance from user-supplied PDF manuals, shown only by authorized CNA platform admins. No public media URLs or course-content mutations.';
