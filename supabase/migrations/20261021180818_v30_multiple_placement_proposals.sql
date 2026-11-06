-- v30: Many-to-many placement proposals only. Never attest rights or expert review.
create table if not exists public.training_image_placement_proposals_v30(
 ref_id text not null references public.training_integral_pdf_refs_v24(id) on delete cascade,
 course_key text not null,
 module_key text not null,
 unit_position integer not null check(unit_position between 1 and 500),
 rationale text not null,
 proposed_rights_note text not null default 'Autorizzata da amministratore per uso interno — dichiarazione amministrativa, non licenza del titolare dei diritti',
 status text not null default 'proposed' check(status in ('proposed','dismissed')),
 source text not null default 'individual_visual_audit',
 created_at timestamptz not null default now(),
 primary key(ref_id,course_key,module_key,unit_position)
);
alter table public.training_image_placement_proposals_v30 enable row level security;
revoke all on public.training_image_placement_proposals_v30 from public,anon,authenticated;
grant select on public.training_image_placement_proposals_v30 to authenticated;
create policy image_placement_proposals_v30_admin_read on public.training_image_placement_proposals_v30
 for select to authenticated using(private.is_platform_admin());
-- Seed only individually observed relevant figures; reject frozen and nonpublished courses.
with candidates as (
 select a.ref_id,a.suggested_course_key as course_key,a.suggested_module_key as module_key,
 a.suggested_unit_position as unit_position,a.observed_subject,a.rationale
 from public.training_integral_pdf_visual_audit_v27 a
 where a.evidence_method='contact_sheet_visual_inspection' and a.recommendation='candidate'
 and a.suggested_course_key is not null and a.suggested_module_key is not null
 union all
 select a.ref_id,
 case
 when a.suggested_course_key='attr_carrelli_ind' then 'attr_carrelli_all'
 when a.suggested_course_key='attr_mmt_all' then 'attr_mmt_esc'
 when a.suggested_course_key='primo_soccorso_12h' then 'primo_soccorso_a_16h'
 when a.suggested_course_key='antincendio' then
  case when a.suggested_module_key='m1' then 'antincendio_l3' else 'antincendio_l3' end
 else a.suggested_course_key end,
 case
 when a.suggested_course_key='antincendio' and a.suggested_module_key='m1' then 'l3-fire'
 when a.suggested_course_key='antincendio' and a.suggested_module_key='m4' then 'l3-practice'
 else a.suggested_module_key end,
 case
 when a.suggested_course_key='antincendio' and a.suggested_module_key='m4'
 then case when a.observed_subject ilike '%idranti%' then 2 else 1 end
 else a.suggested_unit_position end,
 a.observed_subject,a.rationale
 from public.training_integral_pdf_visual_audit_v27 a
 where a.evidence_method='contact_sheet_visual_inspection' and a.recommendation='candidate'
 and a.suggested_course_key in ('attr_carrelli_ind','attr_mmt_all','primo_soccorso_12h','antincendio')
), valid as (
 select distinct c.ref_id,c.course_key,c.module_key,c.unit_position,c.observed_subject,c.rationale
 from candidates c
 join public.courses course on course.stable_key=c.course_key and course.active=true
 join lateral (
 select id from public.course_versions v where v.course_id=course.id and v.status='published'
 order by v.version_number desc limit 1
 ) published on true
 join public.course_modules cm on cm.course_version_id=published.id and cm.module_key=c.module_key
 where c.unit_position <=(select count(*) from public.course_module_units u where u.module_id=cm.id)
  and coalesce(course.metadata->>'freeze_scope','')=''
  and coalesce(course.metadata->>'frozen','false')<>'true'
  and coalesce(course.metadata->>'is_frozen','false')<>'true'
  and coalesce(course.metadata->>'course_frozen','false')<>'true'
)
insert into public.training_image_placement_proposals_v30
(ref_id,course_key,module_key,unit_position,rationale)
select ref_id,course_key,module_key,unit_position,
 left('Collocazione proposta: '||observed_subject||'. Motivazione tecnico-didattica: '||rationale||
 '. L’impiego concreto richiede conferma tecnico-specialistica e verifica dei diritti delle fonti.',1000)
from valid
on conflict(ref_id,course_key,module_key,unit_position) do nothing;
comment on table public.training_image_placement_proposals_v30 is
'Private, multiple course/module/lesson candidate mappings. A proposal never attests expert assessment, never clears third-party rights, and never publishes images.';