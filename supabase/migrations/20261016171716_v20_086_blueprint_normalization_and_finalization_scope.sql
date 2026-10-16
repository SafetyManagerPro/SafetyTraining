update public.courses
set metadata=(coalesce(metadata,'{}'::jsonb)-'blueprint_key')||jsonb_build_object(
 'blueprint_key','fire_initial','blueprint_variant_key',case stable_key when 'antincendio_l1' then 'level_1' when 'antincendio' then 'level_2' else 'level_3' end,
 'finalization_scope','formal_regulatory_course','internal_non_certifying',false,
 'candidate_didactic_version','fire-authored-v3','blueprint_normalized_on','2026-10-16'
),updated_at=now()
where stable_key in ('antincendio_l1','antincendio','antincendio_l3');

update public.courses
set metadata=(coalesce(metadata,'{}'::jsonb)-'blueprint_key')||jsonb_build_object(
 'blueprint_key','fire_update','blueprint_variant_key',case stable_key when 'agg_antincendio_l1' then 'level_1' when 'agg_antincendio_l2' then 'level_2' else 'level_3' end,
 'finalization_scope','formal_regulatory_course','internal_non_certifying',false,
 'candidate_didactic_version','fire-authored-v3','blueprint_normalized_on','2026-10-16'
),updated_at=now()
where stable_key in ('agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3');

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'blueprint_key','rls_initial','finalization_scope','formal_regulatory_course','internal_non_certifying',false,
 'candidate_didactic_version','rls-authored-v3','blueprint_normalized_on','2026-10-16'
),updated_at=now() where stable_key='rls';

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'blueprint_key','worker_initial','blueprint_variant_key',metadata->>'risk_level',
 'finalization_scope','formal_regulatory_course','internal_non_certifying',false,
 'candidate_didactic_versions',jsonb_build_array('general-authored-v4','worker-authored-v3'),
 'blueprint_normalized_on','2026-10-16'
),updated_at=now() where stable_key in ('lav_basso','lav_medio','lav_alto');

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'finalization_scope','formal_regulatory_course','internal_non_certifying',false,'candidate_didactic_version','first-aid-authored-v3','blueprint_normalized_on','2026-10-16'
),updated_at=now() where stable_key in ('primo_soccorso_12h','primo_soccorso_a_16h','agg_primo_soccorso_4h','agg_primo_soccorso_a_6h');

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('finalization_scope','reference_library','exclude_from_finalization_queue',true,'publication_blocked',true,'internal_non_certifying',true,'finalization_scope_reviewed_on','2026-10-16'),updated_at=now()
where stable_key in ('fondamenti','backoffice','frontoffice','ecologici','verde','polizia');

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('finalization_scope','formal_core_course','candidate_didactic_version','general-authored-v4','internal_non_certifying',false,'finalization_scope_reviewed_on','2026-10-16'),updated_at=now()
where stable_key='generale';

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('finalization_scope','formal_internal_course','finalization_scope_reviewed_on','2026-10-16'),updated_at=now()
where stable_key='emergenze_evacuazione';

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('finalization_scope','role_variant_container','finalization_requires_role_snapshot',true,'finalization_scope_reviewed_on','2026-10-16'),updated_at=now()
where stable_key='mod_cantieri';

do $$ declare bad int; refn int; begin
 select count(*) into bad from public.courses c left join public.training_blueprints tb on tb.stable_key=c.metadata->>'blueprint_key'
 where c.stable_key in ('antincendio_l1','antincendio','antincendio_l3','agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3','rls','lav_basso','lav_medio','lav_alto') and tb.stable_key is null;
 if bad<>0 then raise exception 'normalized formal courses with missing blueprint: %',bad; end if;
 select count(*) into refn from public.courses where stable_key in ('fondamenti','backoffice','frontoffice','ecologici','verde','polizia') and metadata->>'exclude_from_finalization_queue'='true' and metadata->>'finalization_scope'='reference_library';
 if refn<>6 then raise exception 'expected 6 reference-library exclusions got %',refn; end if;
 if (select metadata->>'blueprint_variant_key' from public.courses where stable_key='antincendio')<>'level_2' then raise exception 'fire L2 normalization failed'; end if;
 if (select metadata->>'blueprint_key' from public.courses where stable_key='rls')<>'rls_initial' then raise exception 'RLS normalization failed'; end if;
end $$;