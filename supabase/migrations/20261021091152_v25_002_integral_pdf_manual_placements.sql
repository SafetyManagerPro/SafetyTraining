-- v25.2: Explicit instructor-reviewed PDF placements, scoped to an exact published course version.
-- No release of private media, no modifications to source catalog, and no auto-approval.
create table if not exists public.training_integral_pdf_placements_v25(
 ref_id text not null references public.training_integral_pdf_refs_v24(id) on delete cascade,
 course_key text not null,
 course_version_id uuid not null references public.course_versions(id) on delete cascade,
 version_number integer not null,
 module_key text not null,
 unit_position integer not null check(unit_position between 1 and 500),
 rationale text not null,
 created_by uuid not null,
 created_at timestamptz not null default now(),
 primary key(ref_id,course_version_id,module_key,unit_position)
);
create index if not exists training_integral_pdf_placements_course_idx on
 public.training_integral_pdf_placements_v25(course_key,version_number);
create table if not exists public.training_integral_pdf_placement_events_v25(
 id bigint generated always as identity primary key,
 ref_id text not null,
 course_key text not null,
 course_version_id uuid not null,
 version_number integer not null,
 module_key text not null,
 unit_position integer not null,
 action text not null check(action in ('attach','detach')),
 rationale text not null,
 actor_id uuid not null,
 occurred_at timestamptz not null default now()
);
create index if not exists training_integral_pdf_placement_events_ref_idx on
 public.training_integral_pdf_placement_events_v25(ref_id,occurred_at desc);
alter table public.training_integral_pdf_placements_v25 enable row level security;
alter table public.training_integral_pdf_placement_events_v25 enable row level security;
revoke all on public.training_integral_pdf_placements_v25 from public,anon,authenticated;
revoke all on public.training_integral_pdf_placement_events_v25 from public,anon,authenticated;
grant select on public.training_integral_pdf_placements_v25 to authenticated;
grant select on public.training_integral_pdf_placement_events_v25 to authenticated;
create policy training_integral_pdf_placements_v25_admin_read on
 public.training_integral_pdf_placements_v25 for select to authenticated using(private.is_platform_admin());
create policy training_integral_pdf_placement_events_v25_admin_read on
 public.training_integral_pdf_placement_events_v25 for select to authenticated using(private.is_platform_admin());

create or replace function public.training_place_integral_pdf_v25(
 p_ref_id text,p_course_key text,p_module_key text,p_unit_position integer,
 p_action text,p_rationale text
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_version_id uuid;
 v_version_number integer;
 v_reason text:=btrim(coalesce(p_rationale,''));
 v_frozen boolean;
 v_found integer;
begin
 if auth.uid() is null or not private.is_platform_admin() then
  raise exception 'Accesso consentito ai soli amministratori della piattaforma.' using errcode='42501';
 end if;
 if p_ref_id is null or p_ref_id !~ '^pdf-[0-9]{5}$' or
    p_course_key is null or length(p_course_key)>120 or p_module_key is null or length(p_module_key)>160 or
    p_unit_position is null or p_unit_position<1 or p_unit_position>500 or
    p_action is null or p_action not in ('attach','detach') then
  raise exception 'Dati di associazione non validi.';
 end if;
 if length(v_reason)<15 or length(v_reason)>600 then
  raise exception 'Indica la motivazione della pertinenza didattica (15-600 caratteri).';
 end if;
 select cv.id,cv.version_number,
  (coalesce(c.metadata->>'freeze_scope','')<>'' or
   coalesce(c.metadata->>'frozen','false')='true' or
   coalesce(c.metadata->>'is_frozen','false')='true' or
   coalesce(c.metadata->>'course_frozen','false')='true')
 into v_version_id,v_version_number,v_frozen
 from public.courses c join public.course_versions cv on cv.course_id=c.id
 where c.stable_key=p_course_key and cv.status='published'
 order by cv.version_number desc limit 1;
 if v_version_id is null or v_frozen then
  raise exception 'Il corso non ha una versione pubblicata utilizzabile oppure è congelato.';
 end if;
 if not exists (
  select 1 from (
   select row_number() over(order by mu.position,mu.id)::integer as ord
   from public.course_modules cm join public.course_module_units mu on mu.module_id=cm.id
   where cm.course_version_id=v_version_id and cm.module_key=p_module_key
  ) allowed where allowed.ord=p_unit_position
 ) then
  raise exception 'Modulo o unità non presente nella versione pubblicata del corso.';
 end if;
 if p_action='attach' then
  if not exists(
   select 1 from public.training_integral_pdf_reviews_v25 v
   where v.ref_id=p_ref_id and v.technical_status='approved' and v.rights_status='cleared_internal'
  ) then
   raise exception 'La figura deve avere verifica tecnica e autorizzazione ai diritti approvate per uso interno.';
  end if;
  insert into public.training_integral_pdf_placements_v25
   (ref_id,course_key,course_version_id,version_number,module_key,unit_position,rationale,created_by)
  values(p_ref_id,p_course_key,v_version_id,v_version_number,p_module_key,p_unit_position,v_reason,auth.uid())
  on conflict(ref_id,course_version_id,module_key,unit_position)
  do update set rationale=excluded.rationale,created_by=excluded.created_by,created_at=now();
 else
  delete from public.training_integral_pdf_placements_v25 a
  where a.ref_id=p_ref_id and a.course_version_id=v_version_id and
        a.module_key=p_module_key and a.unit_position=p_unit_position;
  get diagnostics v_found=row_count;
  if v_found=0 then raise exception 'Associazione inesistente oppure relativa a una versione precedente.';end if;
 end if;
 insert into public.training_integral_pdf_placement_events_v25
  (ref_id,course_key,course_version_id,version_number,module_key,unit_position,action,rationale,actor_id)
 values(p_ref_id,p_course_key,v_version_id,v_version_number,p_module_key,p_unit_position,p_action,v_reason,auth.uid());
 return jsonb_build_object('ref_id',p_ref_id,'course_key',p_course_key,'module_key',p_module_key,
  'unit_position',p_unit_position,'version_number',v_version_number,'action',p_action);
end
$fn$;
revoke all on function public.training_place_integral_pdf_v25(text,text,text,integer,text,text) from public,anon;
grant execute on function public.training_place_integral_pdf_v25(text,text,text,integer,text,text) to authenticated;
comment on table public.training_integral_pdf_placements_v25 is
'Private, admin-validated mappings to individual published course-version module/unit positions. Not learner media publication.';
