with evac as (
  select id from public.courses where stable_key='emergenze_evacuazione' and active and coalesce(metadata->>'freeze_scope','')=''
)
insert into public.course_practical_requirements(course_id,requirement_key,title,nominal_minutes,required,completion_mode,metadata)
select id,'v22_evacuation_drill','Drill pratico di evacuazione e debriefing',null,true,'external_presence',jsonb_build_object('standard','v22.008','practice_lab_key','v22:evacuation-specific-lab','assessment_mode','instructor_observed','evidence_rpc','admin_set_requirement_evidence')
from evac
on conflict(course_id,requirement_key) do update
set title=excluded.title,required=true,completion_mode=excluded.completion_mode,metadata=public.course_practical_requirements.metadata||excluded.metadata,updated_at=now();

with lab_keys as (
  select cp.course_id,jsonb_agg(distinct p.stable_key order by p.stable_key) as keys
  from public.course_practice_labs_v22 cp
  join public.practice_labs_v22 p on p.id=cp.practice_lab_id and p.active and p.requires_physical_validation
  group by cp.course_id
)
update public.course_practical_requirements r
set metadata=coalesce(r.metadata,'{}'::jsonb)||jsonb_build_object('v22_practice_lab_keys',lk.keys,'v22_assessment_mode','instructor_observed','v22_evidence_rpc','admin_set_requirement_evidence'),updated_at=now()
from lab_keys lk
where lk.course_id=r.course_id and r.required;

comment on table public.practice_labs_v22 is 'SafetyTraining v22 Practice Labs. Physical labs prepare and structure practice; completion remains instructor-observed and recorded through enrollment requirement evidence when a practical requirement is bound.';
