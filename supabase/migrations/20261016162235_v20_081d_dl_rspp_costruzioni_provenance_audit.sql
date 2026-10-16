with authored as (
 select lu.id learning_unit_id,luv.content->'source_keys' source_keys
 from public.learning_units lu
 join public.learning_unit_versions luv on luv.learning_unit_id=lu.id
 where luv.status='draft'
   and luv.content->>'didactic_version'='dl-rspp-authored-v3'
   and lu.stable_key like 'dl-rspp-sector:costruzioni:%'
)
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v3','Fonte usata per validazione normativa, tecnica o di scenario nel DL-RSPP Costruzioni.',date '2026-10-16',jsonb_build_object('didactic_version','dl-rspp-authored-v3','sector','costruzioni','reuse_policy','reference_and_original_rewrite')
from authored a
cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key)
join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update
set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$
declare n int; mins int; links int; bad int; evidence_units int; refs int; active_n int; material_n int;
begin
 select count(*) into n
 from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id
 where luv.status='draft' and luv.content->>'didactic_version'='dl-rspp-authored-v3' and lu.stable_key like 'dl-rspp-sector:costruzioni:%';
 if n<>18 then raise exception 'expected 18 construction authored drafts, got %',n; end if;
 select sum(lu.default_minutes) into mins
 from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id
 where luv.status='draft' and luv.content->>'didactic_version'='dl-rspp-authored-v3' and lu.stable_key like 'dl-rspp-sector:costruzioni:%';
 if mins<>960 then raise exception 'expected 960 construction minutes, got %',mins; end if;
 select count(*) into links
 from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id join public.learning_units lu on lu.id=luv.learning_unit_id
 where luv.content->>'didactic_version'='dl-rspp-authored-v3' and lu.stable_key like 'dl-rspp-sector:costruzioni:%';
 if links<>0 then raise exception 'new construction authored versions linked unexpectedly: %',links; end if;
 select count(*) into bad
 from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id
 where luv.status='draft' and luv.content->>'didactic_version'='dl-rspp-authored-v3' and lu.stable_key like 'dl-rspp-sector:costruzioni:%'
 and (luv.content->'quality'->>'teacher_ready' is distinct from 'true'
   or luv.content->'quality'->>'learner_ready' is distinct from 'true'
   or luv.content->'quality'->>'question_has_explanation' is distinct from 'true'
   or luv.content->'quality'->>'test_builder_excluded' is distinct from 'true'
   or luv.content->'quality'->>'scope_boundary_explicit' is distinct from 'true'
   or luv.content->>'final_assessment' is distinct from 'false'
   or jsonb_array_length(coalesce(luv.content->'evidence_sources','[]'::jsonb))<4);
 if bad<>0 then raise exception 'construction quality failed %',bad; end if;
 select count(distinct lus.learning_unit_id),count(*) into evidence_units,refs
 from public.learning_unit_sources lus join public.learning_units lu on lu.id=lus.learning_unit_id
 where lu.stable_key like 'dl-rspp-sector:costruzioni:%' and lus.purpose='authored_evidence_v3';
 if evidence_units<>18 or refs<72 then raise exception 'construction provenance failed units % refs %',evidence_units,refs; end if;
 if (select metadata->>'official_sector_minutes' from public.courses where stable_key='dl_spp_costruzioni')<>'960' then raise exception 'sector duration metadata missing'; end if;
 if (select metadata->>'auto_relink' from public.courses where stable_key='dl_spp_costruzioni')<>'false' then raise exception 'auto_relink must be false'; end if;
 if coalesce((select metadata->>'frozen' from public.courses where stable_key='dl_spp_costruzioni'),'false')='true' then raise exception 'DL-RSPP Costruzioni must not be frozen'; end if;
 select count(*) into active_n from public.courses where active=true;
 select count(*) into material_n from public.courses c where c.active=true and exists(select 1 from public.course_versions cv join public.course_modules cm on cm.course_version_id=cv.id join public.course_module_units cmu on cmu.module_id=cm.id where cv.course_id=c.id);
 if active_n<>92 or material_n<>92 then raise exception 'catalog expected 92/92 got %/%',active_n,material_n; end if;
end $$;