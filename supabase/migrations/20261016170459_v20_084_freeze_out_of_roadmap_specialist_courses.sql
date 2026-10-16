update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'frozen',true,'development_state','frozen','frozen_on','2026-10-16',
 'freeze_scope','user_out_of_roadmap_specialist','freeze_reason','user_declared_not_of_interest',
 'exclude_from_modernization_queue',true,'exclude_from_finalization_queue',true,
 'resume_only_on_explicit_request',true,'publication_blocked',true,
 'auto_publish',false,'auto_relink',false,'content_preserved',true
),updated_at=now()
where stable_key in (
 'csp_cse_120h','agg_csp_cse_40h','ponteggi_28h','agg_ponteggi_4h',
 'funi_alberi_32h','funi_siti_32h','agg_funi_alberi_8h','agg_funi_siti_8h',
 'preposto_funi_8h','agg_preposto_funi_4h','amb_confinati','agg_spazi_confinati_4h',
 'segnaletica_stradale_lav_8h','segnaletica_stradale_prep_12h','segnaletica_stradale_prep_integ_4h',
 'agg_segnaletica_stradale_lav_6h','agg_segnaletica_stradale_prep_6h'
);

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
 'frozen',true,'development_state','frozen','frozen_on','2026-10-16',
 'freeze_scope','user_out_of_roadmap_specialist','freeze_reason','user_declared_not_of_interest',
 'exclude_from_modernization_queue',true,'exclude_from_finalization_queue',true,
 'resume_only_on_explicit_request',true,'publication_blocked',true,
 'auto_publish',false,'auto_relink',false,'content_preserved',true
),updated_at=now()
where stable_key in ('confined_spaces_initial','confined_spaces_update');

do $$ declare c int; b int; ext int; begin
 select count(*) into c from public.courses where stable_key in (
 'csp_cse_120h','agg_csp_cse_40h','ponteggi_28h','agg_ponteggi_4h','funi_alberi_32h','funi_siti_32h','agg_funi_alberi_8h','agg_funi_siti_8h','preposto_funi_8h','agg_preposto_funi_4h','amb_confinati','agg_spazi_confinati_4h','segnaletica_stradale_lav_8h','segnaletica_stradale_prep_12h','segnaletica_stradale_prep_integ_4h','agg_segnaletica_stradale_lav_6h','agg_segnaletica_stradale_prep_6h')
 and metadata->>'frozen'='true' and metadata->>'exclude_from_finalization_queue'='true';
 if c<>17 then raise exception 'expected 17 frozen specialist courses got %',c; end if;
 select count(*) into b from public.training_blueprints where stable_key in ('confined_spaces_initial','confined_spaces_update') and metadata->>'frozen'='true' and metadata->>'exclude_from_finalization_queue'='true';
 if b<>2 then raise exception 'expected 2 existing specialist blueprints frozen got %',b; end if;
 select count(*) into ext from public.courses where active=true and metadata->>'freeze_scope'='external_rspp_aspp' and metadata->>'frozen'='true';
 if ext<>10 then raise exception 'expected 10 external RSPP/ASPP still frozen got %',ext; end if;
end $$;