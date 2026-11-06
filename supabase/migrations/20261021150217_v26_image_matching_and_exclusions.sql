-- v26: Private image recommendations support and reversible exclusion (different from deleting source file).
-- Review and original PDF rights stay unchanged. Curriculum data remains admin-only.
create table if not exists public.training_image_exclusions_v26(
 image_key text primary key,
 image_kind text not null check(image_kind in ('private_pdf','local')),
 excluded boolean not null default true,
 reason text not null,
 changed_by uuid not null,
 updated_at timestamptz not null default now(),
 constraint training_image_exclusions_key_check check(
  (image_kind='private_pdf' and image_key ~ '^pdf-[0-9]{5}$') or
  (image_kind='local' and image_key ~ '^assets/[a-zA-Z0-9_/-]+[.](svg|png|webp|jpg|jpeg)$')
 )
);
alter table public.training_image_exclusions_v26 enable row level security;
revoke all on public.training_image_exclusions_v26 from public,anon,authenticated;
grant select on public.training_image_exclusions_v26 to authenticated;
create policy training_image_exclusions_v26_admin_read
 on public.training_image_exclusions_v26 for select to authenticated using(private.is_platform_admin());

create or replace function public.training_set_image_exclusion_v26(
 p_key text,p_kind text,p_excluded boolean,p_reason text
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_reason text:=btrim(coalesce(p_reason,''));
begin
 if auth.uid() is null or not private.is_platform_admin() then
  raise exception 'Solo il platform-admin può escludere o reincludere immagini.' using errcode='42501';
 end if;
 if p_excluded is null or p_kind not in ('private_pdf','local') or
    (p_kind='private_pdf' and (p_key !~ '^pdf-[0-9]{5}$' or
     not exists(select 1 from public.training_integral_pdf_refs_v24 where id=p_key))) or
    (p_kind='local' and (p_key !~ '^assets/[a-zA-Z0-9_/-]+[.](svg|png|webp|jpg|jpeg)$' or p_key like '%..%')) then
  raise exception 'Immagine o tipologia non valida.';
 end if;
 if length(v_reason)<12 or length(v_reason)>600 then
  raise exception 'Indicare una motivazione di almeno 12 caratteri (massimo 600).';
 end if;
 insert into public.training_image_exclusions_v26(image_key,image_kind,excluded,reason,changed_by,updated_at)
 values(p_key,p_kind,p_excluded,v_reason,auth.uid(),now())
 on conflict(image_key) do update set
  image_kind=excluded.image_kind,excluded=excluded.excluded,reason=excluded.reason,
  changed_by=excluded.changed_by,updated_at=excluded.updated_at;
 return jsonb_build_object('key',p_key,'kind',p_kind,'excluded',p_excluded);
end $fn$;
revoke all on function public.training_set_image_exclusion_v26(text,text,boolean,text) from public,anon;
grant execute on function public.training_set_image_exclusion_v26(text,text,boolean,text) to authenticated;

create or replace function public.training_excluded_local_images_v26()
returns text[] language plpgsql stable security definer set search_path=''
as $fn$
declare v_keys text[];
begin
 -- Only public bundled asset paths are returned, never private PDF references or reviewer metadata.
 select coalesce(array_agg(image_key order by image_key),'{}'::text[])
 into v_keys from public.training_image_exclusions_v26
 where image_kind='local' and excluded=true;
 return v_keys;
end $fn$;
revoke all on function public.training_excluded_local_images_v26() from public,anon;
grant execute on function public.training_excluded_local_images_v26() to authenticated;

create or replace function public.training_image_matching_catalog_v26()
returns table(
 course_key text,course_title text,version_number integer,
 module_key text,module_title text,unit_position integer,unit_title text,unit_summary text
) language plpgsql stable security definer set search_path=''
as $fn$
begin
 if auth.uid() is null or not private.is_platform_admin() then
  raise exception 'Inventario didattico accessibile solo agli amministratori.' using errcode='42501';
 end if;
 return query
 select c.stable_key,c.title,cv.version_number,cm.module_key,cm.title,
  row_number() over(partition by cm.id order by mu.position,mu.id)::integer,
  lu.title,coalesce(lu.summary,'')
 from public.courses c
 join lateral (
   select id,version_number from public.course_versions cv0
   where cv0.course_id=c.id and cv0.status='published'
   order by cv0.version_number desc limit 1
 ) cv on true
 join public.course_modules cm on cm.course_version_id=cv.id
 join public.course_module_units mu on mu.module_id=cm.id
 join public.learning_unit_versions luv on luv.id=mu.unit_version_id
 join public.learning_units lu on lu.id=luv.learning_unit_id
 where c.active=true
  and coalesce(c.metadata->>'freeze_scope','')=''
  and coalesce(c.metadata->>'frozen','false')<>'true'
  and coalesce(c.metadata->>'is_frozen','false')<>'true'
  and coalesce(c.metadata->>'course_frozen','false')<>'true'
 order by c.stable_key,cm.position,mu.position,mu.id;
end $fn$;
revoke all on function public.training_image_matching_catalog_v26() from public,anon;
grant execute on function public.training_image_matching_catalog_v26() to authenticated;

comment on table public.training_image_exclusions_v26 is
'Persistent reversible image visibility exclusion. Original file never deleted; only platform administrators can change it.';
comment on function public.training_image_matching_catalog_v26() is
'Exact published and unfrozen course/module/unit titles for administrator-only evidence-based candidate matching. Not a vision classifier.';
