update public.training_scenarios_v22
set visuals = replace(visuals::text, 'idea-safe-moves.svg', 'video-safe-moves.svg')::jsonb,
    updated_at = now()
where visuals::text like '%idea-safe-moves.svg%';

create index if not exists course_scenarios_v22_scenario_idx
  on public.course_scenarios_v22(scenario_id);
create index if not exists course_practice_labs_v22_lab_idx
  on public.course_practice_labs_v22(practice_lab_id);
