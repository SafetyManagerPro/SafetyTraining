-- v43: bulk review of PDF page images with independent technical/right checks.
-- Deliberately no automatic approval and no automatic publication to students.
create or replace function public.training_bulk_review_integral_pdf_v43(
 p_ref_ids text[],
 p_technical_note text,
 p_rights_status text default 'review_required',
 p_rights_evidence text default '',
 p_confirm_visual_review boolean default false,
 p_confirm_rights_review boolean default false
)
returns jsonb
language plpgsql security definer set search_path=''
as $bulk$
declare
 v_count integer; v_updated integer:=0; v_skipped integer:=0;
 v_ids text[]; v_ref text; v_source_count integer; v_note text;
 v_evidence text:=btrim(coalesce(p_rights_evidence,''));
 v_technical text:=btrim(coalesce(p_technical_note,''));
 v_entry record;
begin
 if auth.uid() is null or not private.is_platform_admin() then
  raise exception 'Solo gli amministratori della piattaforma possono approvare le immagini.' using errcode='42501';
 end if;
 if p_confirm_visual_review is distinct from true then
  raise exception 'Confermare la verifica visiva e tecnico-didattica di tutte le figure selezionate.';
 end if;
 if p_rights_status is null or p_rights_status not in ('review_required','cleared_internal') then
  raise exception 'Stato dei diritti non consentito per approvazione di massa.';
 end if;
 if length(v_technical)<40 or length(v_technical)>700 then
  raise exception 'Motivazione tecnico-didattica comune: da 40 a 700 caratteri.';
 end if;
 if length(v_evidence)>950 then raise exception 'Il riferimento ai diritti è troppo lungo.';end if;
 if p_rights_status='cleared_internal' and
   (p_confirm_rights_review is distinct from true or length(v_evidence)<30) then
  raise exception 'Per approvare i diritti occorrono conferma e fonte verificabile della licenza/autorizzazione (30 caratteri minimi).';
 end if;
 if p_ref_ids is null or cardinality(p_ref_ids)<1 or cardinality(p_ref_ids)>100 then
  raise exception 'Seleziona da 1 a 100 immagini per ogni approvazione.';
 end if;
 select array_agg(distinct id order by id) into v_ids from unnest(p_ref_ids) as ids(id);
 if cardinality(v_ids)<>cardinality(p_ref_ids) or
    exists(select 1 from unnest(v_ids) id where id is null or id !~ '^pdf-[0-9]{5}$') then
  raise exception 'Elenco con duplicati o identificativi non validi.';
 end if;
 -- Disallow partially applied batches: validate all selected records before writing.
 select count(*),count(distinct source_document) into v_count,v_source_count
 from public.training_integral_pdf_refs_v24 where id=any(v_ids);
 if v_count<>cardinality(v_ids) then raise exception 'Alcuni riferimenti PDF non esistono.';end if;
 if p_rights_status='cleared_internal' and v_source_count<>1 then
  raise exception 'Per l’approvazione dei diritti seleziona immagini di un unico documento di origine.';
 end if;
 -- Lock all existing decisions in stable order for concurrent-review safety.
 perform 1 from public.training_integral_pdf_reviews_v25
 where ref_id=any(v_ids) order by ref_id for update;
 for v_entry in
  select r.id,r.source_document,r.source_page,
   rv.technical_status,rv.rights_status
  from public.training_integral_pdf_refs_v24 r
  left join public.training_integral_pdf_reviews_v25 rv on rv.ref_id=r.id
  where r.id=any(v_ids) order by r.id
 loop
  -- Finalized approvals/rejections are never silently overwritten.
  if coalesce(v_entry.technical_status,'pending')<>'pending' or
     coalesce(v_entry.rights_status,'review_required')<>'review_required' then
   v_skipped:=v_skipped+1;
   continue;
  end if;
  v_note:=v_technical||' | Origine: '||left(v_entry.source_document,155)||
   ', pagina '||v_entry.source_page||', rif. '||v_entry.id;
  if length(v_note)>1000 then raise exception 'Motivazione troppo lunga.';end if;
  perform public.training_review_integral_pdf_v25(
    v_entry.id,'approved',p_rights_status,v_note,
    case when p_rights_status='cleared_internal' then v_evidence else '' end
  );
  v_updated:=v_updated+1;
 end loop;
 return jsonb_build_object('requested',cardinality(v_ids),'approved',v_updated,
  'skipped_previously_reviewed',v_skipped,
  'rights_status',p_rights_status,'technical_status','approved');
end;
$bulk$;
revoke all on function public.training_bulk_review_integral_pdf_v43(text[],text,text,text,boolean,boolean) from public,anon;
grant execute on function public.training_bulk_review_integral_pdf_v43(text[],text,text,text,boolean,boolean) to authenticated;
comment on function public.training_bulk_review_integral_pdf_v43(text[],text,text,text,boolean,boolean) is
 'Administrator-only, human-confirmed bulk review, 100 max. Rights clearance only per source document and with documented authorization. Audited by v25 review events; private images remain private.';
