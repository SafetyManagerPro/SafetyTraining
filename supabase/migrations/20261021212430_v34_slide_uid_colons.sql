-- v34: Generated Learning Unit IDs contain colons; keep every other security guard unchanged.
create or replace function public.save_slide_images_v33(
 p_course_key text,p_version_number integer,p_slide_uid text,p_items jsonb)
 returns jsonb language plpgsql security definer set search_path=''
as $f$
declare x jsonb; v_course_id uuid; v_latest int; v_count int;
begin
 if not private.can_edit_slide_images_v33() then
  raise exception 'Modifica delle immagini consentita esclusivamente al proprietario amministratore.' using errcode='42501';
 end if;
 if p_course_key is null or p_course_key !~ '^[a-zA-Z0-9_-]{3,120}$' or
    p_slide_uid is null or length(p_slide_uid)>240 or length(p_slide_uid)<4 or
    p_slide_uid !~ '^[A-Za-z0-9_:-]+$' or
    left(p_slide_uid,length(p_course_key)+1)<>p_course_key||'-' then
  raise exception 'Corso o identificativo slide non valido.';
 end if;
 select c.id into v_course_id from public.courses c where c.stable_key=p_course_key
   and c.active=true and coalesce(c.metadata->>'freeze_scope','')=''
   and coalesce(c.metadata->>'frozen','false')<>'true'
   and coalesce(c.metadata->>'is_frozen','false')<>'true'
   and coalesce(c.metadata->>'course_frozen','false')<>'true';
 if v_course_id is null then raise exception 'Corso non modificabile o congelato.';end if;
 select cv.version_number into v_latest from public.course_versions cv
 where cv.course_id=v_course_id and cv.status='published'
 order by cv.version_number desc limit 1;
 if v_latest is null or v_latest<>p_version_number then
  raise exception 'La modifica deve riferirsi alla versione pubblicata corrente.';
 end if;
 if p_items is null then
  delete from public.slide_image_overrides_v33 o
   where o.course_key=p_course_key and o.version_number=p_version_number and o.slide_uid=p_slide_uid;
  return jsonb_build_object('reset',true);
 end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>3 then
  raise exception 'Una slide può contenere da zero a tre immagini.';
 end if;
 for x in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(x)<>'object' or x->>'kind' not in ('local','private_pdf')
     or length(coalesce(x->>'caption',''))>180 then
   raise exception 'Dati immagine non validi.';
  end if;
  if x->>'kind'='local' then
   if not exists(select 1 from public.slide_image_local_catalog_v33 a
                 where a.path=x->>'src') then
    raise exception 'Illustrazione non appartenente all’archivio.';
   end if;
  else
   if coalesce(x->>'ref_id','') !~ '^pdf-[0-9]{5}$' or
      not exists(
       select 1 from public.training_integral_pdf_refs_v24 r
       join public.training_integral_pdf_reviews_v25 v on v.ref_id=r.id
       left join public.training_image_exclusions_v26 e on e.image_key=r.id
       where r.id=x->>'ref_id' and v.technical_status='approved'
       and v.rights_status='cleared_internal'
       and coalesce(e.excluded,false)=false
      ) then
    raise exception 'Tavola privata priva di entrambe le approvazioni o esclusa.';
   end if;
  end if;
 end loop;
 insert into public.slide_image_overrides_v33(course_key,version_number,slide_uid,items,edited_by)
 values(p_course_key,p_version_number,p_slide_uid,p_items,auth.uid())
 on conflict(course_key,version_number,slide_uid) do update set
  items=excluded.items,edited_by=excluded.edited_by,updated_at=now();
 return jsonb_build_object('saved',true,'images',jsonb_array_length(p_items));
end $f$;
