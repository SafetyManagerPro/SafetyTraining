update public.tests
set metadata=(coalesce(metadata,'{}'::jsonb)-'activation_requires_app_version_binding_fix') || jsonb_build_object(
  'activation_requires_app_version_binding_fix',false,
  'app_version_binding_fixed',true,
  'app_version_binding_fixed_on','2026-10-16',
  'app_version_binding_commit','44c858b0',
  'activation_block_reason','candidate_review_and_explicit_activation_pending'
)
where metadata->>'finalization_batch'='v20_091';

do $$ declare n int; active_n int; begin
 select count(*) into n
 from public.tests
 where metadata->>'finalization_batch'='v20_091'
   and metadata->>'activation_requires_app_version_binding_fix'='false'
   and metadata->>'app_version_binding_fixed'='true'
   and metadata->>'activation_block_reason'='candidate_review_and_explicit_activation_pending';
 if n<>36 then raise exception 'expected 36 resolved binding flags got %',n; end if;

 select count(*) into active_n
 from public.tests
 where metadata->>'finalization_batch'='v20_091' and active=true;
 if active_n<>0 then raise exception 'candidate tests unexpectedly active: %',active_n; end if;
end $$;
