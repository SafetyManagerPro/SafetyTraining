with req(course_key,requirement_key,title,minutes,mode,level,kind) as (values
 ('antincendio_l1','fire_practical','Esercitazione pratica antincendio - Livello 1',120,'in_person_training','1','initial'),
 ('antincendio','fire_practical','Esercitazione pratica antincendio - Livello 2',180,'in_person_training','2','initial'),
 ('antincendio_l3','fire_practical','Esercitazione pratica antincendio - Livello 3',240,'in_person_training','3','initial'),
 ('agg_antincendio_l1','fire_update_practical','Aggiornamento pratico antincendio - Livello 1',120,'in_person_training','1','update'),
 ('agg_antincendio_l2','fire_update_practical','Aggiornamento pratico antincendio - Livello 2',180,'in_person_training','2','update'),
 ('agg_antincendio_l3','fire_update_practical','Aggiornamento pratico antincendio - Livello 3',180,'in_person_training','3','update')
)
insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
select c.id,r.requirement_key,r.title,r.minutes,true,r.mode,
       jsonb_build_object('level',r.level,'kind',r.kind,'regulatory',true,'normative_ref','D.M. 2 settembre 2021 - Allegato III','requires_external_record',true,'digital_completion_allowed',false,'validated_on','2026-10-16')
from req r join public.courses c on c.stable_key=r.course_key
on conflict (course_id,requirement_key) do update set title=excluded.title,nominal_minutes=excluded.nominal_minutes,required=excluded.required,completion_mode=excluded.completion_mode,metadata=excluded.metadata,updated_at=now();

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('practical_gate_required',true,'practical_completion_not_digital',true,'practical_gate_reviewed_on','2026-10-16'),updated_at=now()
where stable_key in ('antincendio_l1','antincendio','antincendio_l3','agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3');

update public.courses
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('company_drill_separate',true,'company_drill_outside_nominal_minutes',true,'company_drill_is_course_completion_gate',false,'internal_non_certifying',true,'practical_gate_reviewed_on','2026-10-16'),updated_at=now()
where stable_key='emergenze_evacuazione';

update public.training_blueprints
set metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('company_drill_separate',true,'company_drill_outside_nominal_minutes',true,'company_drill_is_course_completion_gate',false,'practical_completion_not_digital',true,'practical_gate_reviewed_on','2026-10-16'),updated_at=now()
where stable_key='emergency_evacuation_internal';

do $$ declare n int; bad int; begin
 select count(*) into n from public.course_practical_requirements r join public.courses c on c.id=r.course_id where c.stable_key in ('antincendio_l1','antincendio','antincendio_l3','agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3') and r.required=true and r.metadata->>'digital_completion_allowed'='false';
 if n<>6 then raise exception 'expected 6 fire practical gates got %',n; end if;
 select count(*) into bad from public.course_practical_requirements r join public.courses c on c.id=r.course_id where c.stable_key in ('antincendio_l1','antincendio','antincendio_l3','agg_antincendio_l1','agg_antincendio_l2','agg_antincendio_l3') and ((c.stable_key='antincendio_l1' and r.nominal_minutes<>120) or (c.stable_key='antincendio' and r.nominal_minutes<>180) or (c.stable_key='antincendio_l3' and r.nominal_minutes<>240) or (c.stable_key='agg_antincendio_l1' and r.nominal_minutes<>120) or (c.stable_key='agg_antincendio_l2' and r.nominal_minutes<>180) or (c.stable_key='agg_antincendio_l3' and r.nominal_minutes<>180));
 if bad<>0 then raise exception 'fire practical minutes mismatch %',bad; end if;
 if (select metadata->>'company_drill_is_course_completion_gate' from public.courses where stable_key='emergenze_evacuazione')<>'false' then raise exception 'emergency drill boundary missing'; end if;
end $$;