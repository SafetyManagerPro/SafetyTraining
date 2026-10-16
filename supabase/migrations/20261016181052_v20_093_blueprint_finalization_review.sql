insert into public.training_blueprint_rules(blueprint_key,rule_key,variant_key,rule_type,priority,conditions,outcome,source,notes,active)
values('worker_initial','final_verification',null,'assessment',25,'{}'::jsonb,jsonb_build_object('mode','test_or_interview','test_min_questions',30,'min_options',3,'passing_score_pct',70),'Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR, Parte IV punto 6.3','Verifica finale del corso lavoratori; SafetyTraining seleziona test nella candidate course version.',true)
on conflict (blueprint_key,rule_key) do update set variant_key=excluded.variant_key,rule_type=excluded.rule_type,priority=excluded.priority,conditions=excluded.conditions,outcome=excluded.outcome,source=excluded.source,notes=excluded.notes,active=true,updated_at=now();

update public.training_blueprint_rules set active=false,notes=coalesce(notes,'')||' [Disattivata 2026-10-16: duplicata dalla regola practical_training_required.]',updated_at=now()
where blueprint_key='work_height_dpi3' and rule_key='practical_training_separate';
update public.training_blueprint_rules set active=false,notes=coalesce(notes,'')||' [Disattivata 2026-10-16: legacy duplicata dalla regola annual_cycle_* vigente.]',updated_at=now()
where blueprint_key='rls_update' and rule_key in ('legacy_company_size_4h','legacy_company_size_8h');

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('finalization_reviewed_on','2026-10-16','finalization_state','candidate_ready_for_qa','candidate_course_versions_created',true,'completion_gate_model','enrollment_requirement_evidence_v20_092','publication_blocked',true,'publication_policy','explicit_activation_after_qa'),updated_at=now()
where stable_key in ('dirigente_initial','dirigente_update','dl_spp_common','dl_spp_sector','dl_spp_update','emergency_evacuation_internal','employer_construction_addon','employer_initial','employer_update','equipment_initial','equipment_update','fire_initial','fire_update','first_aid_initial','first_aid_update','preposto_initial','preposto_update','rls_initial','rls_update','work_height_dpi3','worker_initial','worker_update') and coalesce(metadata->>'frozen','false')<>'true';

update public.training_blueprints set metadata=metadata||jsonb_build_object('test_builder_scope','candidate_inactive_ready','verification_runtime_state','configured_candidate_inactive') where stable_key in ('worker_initial','worker_update','preposto_initial','preposto_update','dirigente_initial','dirigente_update','employer_initial','employer_update','dl_spp_common','dl_spp_sector','dl_spp_update','employer_construction_addon','rls_initial','rls_update','emergency_evacuation_internal','equipment_initial');
update public.training_blueprints set metadata=metadata||jsonb_build_object('block_reason','candidate_review_and_activation_pending') where stable_key in ('dl_spp_sector','dl_spp_update');
update public.training_blueprints set metadata=metadata||jsonb_build_object('manager_test_builder_scope','candidate_inactive_ready','employer_test_builder_scope','candidate_inactive_ready') where stable_key='employer_construction_addon';

update public.training_blueprint_variants v set metadata=coalesce(v.metadata,'{}'::jsonb)||jsonb_build_object('finalization_reviewed_on','2026-10-16','finalization_state','candidate_ready_for_qa','publication_blocked',true,'auto_publish',false,'auto_relink',false),updated_at=now()
where v.blueprint_key in ('dirigente_initial','dirigente_update','dl_spp_common','dl_spp_sector','dl_spp_update','emergency_evacuation_internal','employer_construction_addon','employer_initial','employer_update','equipment_initial','equipment_update','fire_initial','fire_update','first_aid_initial','first_aid_update','preposto_initial','preposto_update','rls_initial','rls_update','work_height_dpi3','worker_initial','worker_update');

do $$ declare orphan_v int; orphan_r int; invalid_variant int; dup_height int; legacy_rls int; worker_rule int; begin
 select count(*) into orphan_v from public.training_blueprint_variants v where not exists(select 1 from public.training_blueprints b where b.stable_key=v.blueprint_key);
 select count(*) into orphan_r from public.training_blueprint_rules r where not exists(select 1 from public.training_blueprints b where b.stable_key=r.blueprint_key);
 select count(*) into invalid_variant from public.training_blueprint_rules r where r.variant_key is not null and not exists(select 1 from public.training_blueprint_variants v where v.blueprint_key=r.blueprint_key and v.variant_key=r.variant_key);
 select count(*) into dup_height from public.training_blueprint_rules where blueprint_key='work_height_dpi3' and rule_key='practical_training_separate' and active;
 select count(*) into legacy_rls from public.training_blueprint_rules where blueprint_key='rls_update' and rule_key in ('legacy_company_size_4h','legacy_company_size_8h') and active;
 select count(*) into worker_rule from public.training_blueprint_rules where blueprint_key='worker_initial' and rule_key='final_verification' and active and outcome->>'test_min_questions'='30' and outcome->>'passing_score_pct'='70';
 if orphan_v<>0 or orphan_r<>0 or invalid_variant<>0 then raise exception 'blueprint integrity failed variants %, rules %, invalid variants %',orphan_v,orphan_r,invalid_variant; end if;
 if dup_height<>0 or legacy_rls<>0 then raise exception 'duplicate rules still active height %, rls %',dup_height,legacy_rls; end if;
 if worker_rule<>1 then raise exception 'worker initial final verification rule missing or invalid'; end if;
 if exists(select 1 from public.training_blueprints where stable_key in ('rspp_aspp_a','rspp_aspp_b','rspp_aspp_bsp','rspp_c','aspp_update','rspp_update','confined_spaces_initial','confined_spaces_update') and metadata->>'finalization_state'='candidate_ready_for_qa') then raise exception 'frozen blueprint entered finalization'; end if;
end $$;