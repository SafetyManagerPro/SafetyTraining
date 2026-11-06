-- v22_017: PDF source figures are PRIVATE administrative review references, never published course media.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('training-source-figures','training-source-figures',false,5242880,array['image/jpeg']::text[])
on conflict (id) do nothing;
create table if not exists public.training_source_figures_v23 (
 id text primary key check (id ~ '^[a-z0-9_-]{3,96}$'),
 storage_path text not null unique check (storage_path ~ '^references/v1/[a-z0-9_-]+[.]jpg$'),
 source_document text not null,
 source_page integer not null check(source_page>0),
 category text not null,
 excerpt text not null default '',
 tags text[] not null default '{}'::text[],
 image_type text not null default 'page_preview',
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 rights_status text not null default 'review_required' check(rights_status='review_required'),
 created_at timestamptz not null default now(),
 created_by uuid not null default auth.uid()
);
alter table public.training_source_figures_v23 enable row level security;
grant select,insert,update on public.training_source_figures_v23 to authenticated;
do $$begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_source_figures_v23' and policyname='source_figures_admin_read') then
 create policy source_figures_admin_read on public.training_source_figures_v23 for select to authenticated using (private.is_platform_admin());
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_source_figures_v23' and policyname='source_figures_admin_insert') then
 create policy source_figures_admin_insert on public.training_source_figures_v23 for insert to authenticated with check (private.is_platform_admin() and rights_status='review_required');
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_source_figures_v23' and policyname='source_figures_admin_update') then
 create policy source_figures_admin_update on public.training_source_figures_v23 for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin() and rights_status='review_required');
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='source_figures_storage_admin_read') then
 create policy source_figures_storage_admin_read on storage.objects for select to authenticated using (bucket_id='training-source-figures' and private.is_platform_admin());
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='source_figures_storage_admin_insert') then
 create policy source_figures_storage_admin_insert on storage.objects for insert to authenticated with check (bucket_id='training-source-figures' and private.is_platform_admin());
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='source_figures_storage_admin_update') then
 create policy source_figures_storage_admin_update on storage.objects for update to authenticated using (bucket_id='training-source-figures' and private.is_platform_admin()) with check (bucket_id='training-source-figures' and private.is_platform_admin());
 end if;
end$$;
