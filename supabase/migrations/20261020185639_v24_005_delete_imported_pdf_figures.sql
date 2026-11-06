-- v24.5: admin-only irreversible bulk deletion of imported private PDF figures.
-- Deletions are tombstoned so ZIP reimport never resurrects discarded logos / irrelevant images.
create table if not exists public.training_integral_pdf_deleted_v24(
 id text primary key check(id ~ '^img-[0-9a-f]{20}$'),
 storage_path text not null check(storage_path ~ '^integral/v1/img-[0-9a-f]{20}[.]webp$'),
 deleted_at timestamptz not null default now(),
 deleted_by uuid not null,
 storage_cleared_at timestamptz
);
alter table public.training_integral_pdf_deleted_v24 enable row level security;
grant select,update on public.training_integral_pdf_deleted_v24 to authenticated;
do $$begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_integral_pdf_deleted_v24' and policyname='integral_pdf_deleted_admin_select') then
 create policy integral_pdf_deleted_admin_select on public.training_integral_pdf_deleted_v24 for select to authenticated using (private.is_platform_admin());
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='training_integral_pdf_deleted_v24' and policyname='integral_pdf_deleted_admin_update') then
 create policy integral_pdf_deleted_admin_update on public.training_integral_pdf_deleted_v24 for update to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());
 end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='source_pdf_integral_admin_delete') then
 create policy source_pdf_integral_admin_delete on storage.objects for delete to authenticated
 using (bucket_id='training-source-figures' and name like 'integral/v1/%' and private.is_platform_admin());
 end if;
end$$;
create or replace function public.training_delete_integral_pdf_assets_v24(p_ids text[])
returns table(deleted_id text, deleted_storage_path text, removed_references bigint)
language plpgsql security definer set search_path=''
as $fn$
declare
 v_ids text[];
 v_id text;
 v_path text;
 v_n bigint;
begin
 if auth.uid() is null or not private.is_platform_admin() then
  raise exception 'Only CNA platform administrators can remove PDF figures' using errcode='42501';
 end if;
 if p_ids is null or cardinality(p_ids)<1 or cardinality(p_ids)>100 then
  raise exception 'Select between 1 and 100 images';
 end if;
 select array_agg(distinct x) into v_ids from unnest(p_ids) as x;
 if exists(select 1 from unnest(v_ids) as x where x is null or x !~ '^img-[0-9a-f]{20}$') then
  raise exception 'Invalid imported image ID';
 end if;
 for v_id, v_path in
  select a.id,a.storage_path from public.training_integral_pdf_assets_v24 a
   where a.id=any(v_ids) order by a.id for update
 loop
  delete from public.training_integral_pdf_refs_v24 f where f.asset_id=v_id;
  get diagnostics v_n = row_count;
  insert into public.training_integral_pdf_deleted_v24(id,storage_path,deleted_by)
   values(v_id,v_path,auth.uid())
   on conflict(id) do update set storage_path=excluded.storage_path,deleted_at=now(),deleted_by=excluded.deleted_by,storage_cleared_at=null;
  delete from public.training_integral_pdf_assets_v24 a where a.id=v_id;
  deleted_id:=v_id;deleted_storage_path:=v_path;removed_references:=v_n;
  return next;
 end loop;
end
$fn$;
revoke all on function public.training_delete_integral_pdf_assets_v24(text[]) from public,anon;
grant execute on function public.training_delete_integral_pdf_assets_v24(text[]) to authenticated;
comment on function public.training_delete_integral_pdf_assets_v24(text[]) is
'Explicit admin-confirmed removal of imported PDF asset and every referring page record, with re-import tombstone. Storage cleanup follows through restricted Storage API.';
