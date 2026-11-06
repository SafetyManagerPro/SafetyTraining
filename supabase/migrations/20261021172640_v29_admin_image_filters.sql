-- v29: exact server-side image filter counts and pagination, private and admin-only.
-- Do not change source files, technical approvals, usage rights or frozen course records.
create or replace function public.training_image_filter_page_v29(
 p_status text default 'all',
 p_course_key text default null,
 p_module_key text default null,
 p_search text default '',
 p_page integer default 0,
 p_page_size integer default 24
) returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare
 v_status text:=coalesce(p_status,'all');
 v_course text:=nullif(btrim(coalesce(p_course_key,'')),'');
 v_module text:=nullif(btrim(coalesce(p_module_key,'')),'');
 v_search text:=left(btrim(coalesce(p_search,'')),65);
 v_total bigint;
 v_ids text[];
begin
 if auth.uid() is null or not private.is_platform_admin() then
   raise exception 'Filtro immagini riservato agli amministratori della piattaforma.' using errcode='42501';
 end if;
 if v_status not in ('all','examined','individual','group','screening','approved','review_pending','to_associate','associated','excluded','rejected') then
   raise exception 'Filtro stato non riconosciuto.';
 end if;
 if p_page is null or p_page<0 or p_page>100000 or
    p_page_size is null or p_page_size<1 or p_page_size>48 then
   raise exception 'Intervallo di paginazione non valido.';
 end if;
 if (v_course is not null and length(v_course)>120) or
    (v_module is not null and (v_course is null or length(v_module)>160)) then
   raise exception 'Selezione corso/modulo non valida.';
 end if;
 with candidates as (
  select r.id, r.topic, r.category, r.source_document,
    v.technical_status,v.rights_status,
    a.evidence_method,a.recommendation,a.suggested_course_key,a.suggested_module_key,
    s.source_course_hint,
    coalesce(e.excluded,false) as is_excluded,
    exists (
     select 1 from public.training_integral_pdf_placements_v25 m
     join public.course_versions cv on cv.id=m.course_version_id
     join public.courses c on c.id=cv.course_id
     where m.ref_id=r.id and cv.status='published' and c.active=true
      and coalesce(c.metadata->>'freeze_scope','')=''
      and coalesce(c.metadata->>'frozen','false')<>'true'
      and coalesce(c.metadata->>'is_frozen','false')<>'true'
      and coalesce(c.metadata->>'course_frozen','false')<>'true'
    ) as manual_current,
    exists (
     select 1 from public.courses c
     join public.course_versions cv on cv.course_id=c.id
     join public.course_modules cm on cm.course_version_id=cv.id
     where c.stable_key=a.suggested_course_key and c.active=true and cv.status='published'
      and cm.module_key=a.suggested_module_key
      and a.suggested_unit_position between 1 and (
       select count(*) from public.course_module_units mu where mu.module_id=cm.id
      )
      and coalesce(c.metadata->>'freeze_scope','')=''
      and coalesce(c.metadata->>'frozen','false')<>'true'
      and coalesce(c.metadata->>'is_frozen','false')<>'true'
      and coalesce(c.metadata->>'course_frozen','false')<>'true'
    ) as observed_published
  from public.training_integral_pdf_refs_v24 r
  left join public.training_integral_pdf_reviews_v25 v on v.ref_id=r.id
  left join public.training_integral_pdf_visual_audit_v27 a on a.ref_id=r.id
  left join public.training_integral_pdf_screening_v28 s on s.ref_id=r.id
  left join public.training_image_exclusions_v26 e on e.image_key=r.id and e.image_kind='private_pdf'
  where r.id>='pdf-50000'
   and (v_search='' or r.id ilike '%'||v_search||'%' or
       coalesce(r.topic,'') ilike '%'||v_search||'%' or
       coalesce(r.category,'') ilike '%'||v_search||'%' or
       coalesce(r.source_document,'') ilike '%'||v_search||'%')
   and (v_course is null or a.suggested_course_key=v_course or s.source_course_hint=v_course or
        exists(select 1 from public.training_integral_pdf_placements_v25 p
               where p.ref_id=r.id and p.course_key=v_course))
   and (v_module is null or a.suggested_course_key=v_course and a.suggested_module_key=v_module or
        exists(select 1 from public.training_integral_pdf_placements_v25 p
               where p.ref_id=r.id and p.course_key=v_course and p.module_key=v_module))
 ), filtered as (
  select id from candidates
  where
    v_status='all'
    or (v_status='examined' and evidence_method is not null)
    or (v_status='individual' and evidence_method='contact_sheet_visual_inspection')
    or (v_status='group' and evidence_method='contact_sheet_group_visual_triage')
    or (v_status='screening' and evidence_method is null)
    or (v_status='approved' and technical_status='approved' and rights_status='cleared_internal')
    or (v_status='review_pending' and (technical_status is null or technical_status='pending' or rights_status='review_required'))
    or (v_status='excluded' and is_excluded)
    or (v_status='rejected' and (technical_status='rejected' or rights_status='rejected'))
    or (v_status='associated' and not is_excluded and technical_status='approved' and rights_status='cleared_internal'
      and (manual_current or (evidence_method='contact_sheet_visual_inspection' and recommendation='candidate' and observed_published)))
    or (v_status='to_associate' and not is_excluded
      and (suggested_course_key is not null or source_course_hint is not null or manual_current)
      and not (technical_status='approved' and rights_status='cleared_internal'
       and (manual_current or (evidence_method='contact_sheet_visual_inspection' and recommendation='candidate' and observed_published))))
 ), page_items as (
  select id from filtered order by id
  limit p_page_size offset (p_page*p_page_size)
 )
 select
  (select count(*) from filtered),
  (select coalesce(array_agg(id order by id),'{}'::text[]) from page_items)
 into v_total,v_ids;
 return jsonb_build_object('total',v_total,'ids',v_ids);
end
$fn$;
revoke all on function public.training_image_filter_page_v29(text,text,text,text,integer,integer) from public,anon;
grant execute on function public.training_image_filter_page_v29(text,text,text,text,integer,integer) to authenticated;
comment on function public.training_image_filter_page_v29(text,text,text,text,integer,integer) is
'Platform-admin-only server-side paginated PDF filters. Associated means visible in private admin deck if approved and current; to_associate means a proposal exists but is not active. No review or publication changes.';
