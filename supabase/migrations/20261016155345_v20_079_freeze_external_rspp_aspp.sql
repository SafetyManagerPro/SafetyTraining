update public.training_blueprints
set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
  'frozen', true,
  'development_state', 'frozen',
  'frozen_on', '2026-10-16',
  'freeze_scope', 'external_rspp_aspp',
  'freeze_reason', 'user_requested_deprioritization',
  'exclude_from_modernization_queue', true,
  'resume_only_on_explicit_request', true,
  'publication_blocked', true,
  'auto_publish', false,
  'auto_relink', false,
  'content_preserved', true
), updated_at=now()
where stable_key in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update');

update public.training_blueprint_variants
set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
  'frozen', true,
  'development_state', 'frozen',
  'frozen_on', '2026-10-16',
  'freeze_scope', 'external_rspp_aspp',
  'exclude_from_modernization_queue', true,
  'resume_only_on_explicit_request', true,
  'auto_materialize', false,
  'content_preserved', true
), updated_at=now()
where blueprint_key in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update');

update public.courses
set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
  'frozen', true,
  'development_state', 'frozen',
  'frozen_on', '2026-10-16',
  'freeze_scope', 'external_rspp_aspp',
  'freeze_reason', 'user_requested_deprioritization',
  'exclude_from_modernization_queue', true,
  'resume_only_on_explicit_request', true,
  'learner_catalog_hidden', true,
  'requires_admin_review', true,
  'auto_publish', false,
  'auto_relink', false,
  'content_preserved', true
), updated_at=now()
where active=true and metadata->>'blueprint_key' in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update');

do $$ declare b int; c int; bad int; dl int; begin
  select count(*) into b from public.training_blueprints where stable_key in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update') and metadata->>'frozen'='true' and metadata->>'development_state'='frozen';
  select count(*) into c from public.courses where active=true and metadata->>'blueprint_key' in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update') and metadata->>'frozen'='true' and metadata->>'development_state'='frozen';
  select count(*) into bad from public.courses where active=true and metadata->>'blueprint_key' in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update') and coalesce(metadata->>'resume_only_on_explicit_request','false')<>'true';
  select count(*) into dl from public.courses where active=true and metadata->>'blueprint_key' in ('dl_spp_common','dl_spp_sector','dl_spp_update') and metadata->>'frozen'='true';
  if b<>6 then raise exception 'expected 6 frozen external RSPP/ASPP blueprints, got %',b; end if;
  if c<>10 then raise exception 'expected 10 frozen external RSPP/ASPP courses, got %',c; end if;
  if bad<>0 then raise exception 'freeze flags incomplete on % external courses',bad; end if;
  if dl<>0 then raise exception 'DL-RSPP courses must not be frozen, got %',dl; end if;
end $$;
