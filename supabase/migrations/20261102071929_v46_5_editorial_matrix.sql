-- SafetyTraining v46.5: private editorial review register for existing published Learning Units.
-- Does NOT publish, overwrite or change courses, Learning Units, assessment, learner evidence or original figures.
create table if not exists public.training_lu_editorial_reviews_v46_5 (
  module_unit_id uuid primary key references public.course_module_units(id) on delete restrict,
  text_status text not null default 'pending' check (text_status in ('pending','approved','changes_requested')),
  visual_status text not null default 'pending' check (visual_status in ('pending','approved','changes_requested','not_applicable')),
  source_status text not null default 'pending' check (source_status in ('pending','approved','changes_requested')),
  analysis_status text not null default 'pending' check (analysis_status in ('pending','approved','changes_requested')),
  rights_status text not null default 'pending' check (rights_status in ('pending','approved','changes_requested','not_applicable')),
  decision text not null default 'pending' check (decision in ('pending','approved','changes_requested')),
  reviewer_note text not null default '',
  rights_evidence text not null default '',
  reviewed_by uuid not null references auth.users(id),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);
create table if not exists public.training_lu_editorial_events_v46_5 (
  id bigint generated always as identity primary key,
  module_unit_id uuid not null references public.course_module_units(id) on delete restrict,
  revision integer not null,
  snapshot jsonb not null,
  actor_id uuid not null references auth.users(id),
  occurred_at timestamptz not null default now(),
  unique(module_unit_id, revision)
);
create index if not exists training_lu_editorial_events_v46_5_ref_idx
 on public.training_lu_editorial_events_v46_5(module_unit_id, occurred_at desc);
alter table public.training_lu_editorial_reviews_v46_5 enable row level security;
alter table public.training_lu_editorial_events_v46_5 enable row level security;
revoke all on public.training_lu_editorial_reviews_v46_5 from public,anon,authenticated;
revoke all on public.training_lu_editorial_events_v46_5 from public,anon,authenticated;
revoke all on sequence public.training_lu_editorial_events_v46_5_id_seq from public,anon,authenticated;
grant select on public.training_lu_editorial_reviews_v46_5 to authenticated;
grant select on public.training_lu_editorial_events_v46_5 to authenticated;
drop policy if exists training_lu_editorial_reviews_v46_5_admin_select on public.training_lu_editorial_reviews_v46_5;
create policy training_lu_editorial_reviews_v46_5_admin_select
 on public.training_lu_editorial_reviews_v46_5 for select to authenticated
 using (auth.uid() is not null and (select private.is_platform_admin()));
drop policy if exists training_lu_editorial_events_v46_5_admin_select on public.training_lu_editorial_events_v46_5;
create policy training_lu_editorial_events_v46_5_admin_select
 on public.training_lu_editorial_events_v46_5 for select to authenticated
 using (auth.uid() is not null and (select private.is_platform_admin()));

-- Only accessible to signed-in platform administrators. When no course selected, return
-- the catalog only, not the full 1000+ Learning Unit inventory in the browser.
create or replace function public.training_lu_editorial_matrix_v46_5(p_course_key text default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $fn$
declare v_catalog jsonb; v_units jsonb := '[]'::jsonb;
begin
 if auth.uid() is null or not private.is_platform_admin() then
   raise exception 'Permessi amministrativi insufficienti.' using errcode='42501';
 end if;
 if p_course_key is not null and (length(p_course_key) > 120 or p_course_key !~ '^[a-zA-Z0-9_:-]+$') then
   raise exception 'Identificativo corso non valido.';
 end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.title,q.stable_key),'[]'::jsonb) into v_catalog
 from (
   select c.stable_key,c.title,cv.id as course_version_id,cv.version_number,
    c.active,
    (coalesce(c.metadata->>'freeze_scope','')<>'' or
     coalesce(c.metadata->>'frozen','false')='true' or
     coalesce(c.metadata->>'is_frozen','false')='true' or
     coalesce(c.metadata->>'course_frozen','false')='true') as frozen,
    count(cmu.id)::int as unit_count,
    count(r.module_unit_id) filter(where r.decision='approved')::int as approved_count
   from public.courses c
   join lateral (
     select cv0.id,cv0.version_number from public.course_versions cv0
     where cv0.course_id=c.id and cv0.status='published'
     order by cv0.version_number desc limit 1
   ) cv on true
   left join public.course_modules cm on cm.course_version_id=cv.id
   left join public.course_module_units cmu on cmu.module_id=cm.id
   left join public.training_lu_editorial_reviews_v46_5 r on r.module_unit_id=cmu.id
   group by c.id,c.stable_key,c.title,c.active,c.metadata,cv.id,cv.version_number
 ) q;
 if p_course_key is not null then
   select coalesce(jsonb_agg(
    jsonb_build_object(
     'module_unit_id',cmu.id,'course_version_id',cv.id,'unit_version_id',luv.id,
     'course_key',c.stable_key,'course_title',c.title,'course_version',cv.version_number,
     'course_active',c.active,
     'frozen',(coalesce(c.metadata->>'freeze_scope','')<>'' or
       coalesce(c.metadata->>'frozen','false')='true' or
       coalesce(c.metadata->>'is_frozen','false')='true' or
       coalesce(c.metadata->>'course_frozen','false')='true'),
     'module_key',cm.module_key,'module_title',cm.title,'module_position',cm.position,
     'unit_position',cmu.position,'unit_key',lu.stable_key,
     'unit_title',coalesce(nullif(luv.content->>'title',''),lu.title),
     'unit_status',luv.status,'unit_version',luv.version_number,
     'summary_preview',left(coalesce(luv.content->>'summary',lu.summary,''),230),
     'detail_chars',length(coalesce(luv.content->>'detail','')),
     'summary_chars',length(coalesce(luv.content->>'summary',lu.summary,'')),
     'risk_count',case when jsonb_typeof(luv.content->'risks')='array' then jsonb_array_length(luv.content->'risks') else 0 end,
     'prevention_count',case when jsonb_typeof(luv.content->'prevention')='array' then jsonb_array_length(luv.content->'prevention') else 0 end,
     'has_case',length(coalesce(luv.content->>'case',''))>25,
     'has_question',length(coalesce(luv.content->>'question',''))>10,
     'visual_hint',left(coalesce(luv.content->>'visual',''),100),
     'explicit_visual_count',
       (case when jsonb_typeof(luv.content->'idea_images')='array' then jsonb_array_length(luv.content->'idea_images') else 0 end)+
       (case when jsonb_typeof(luv.content->'graphic_cards')='array' then jsonb_array_length(luv.content->'graphic_cards') else 0 end)+
       (case when jsonb_typeof(luv.content->'visuals')='array' then jsonb_array_length(luv.content->'visuals') else 0 end),
     'source_reference_count',coalesce(src.n,0)+
       (case when jsonb_typeof(luv.content->'source_keys')='array' then jsonb_array_length(luv.content->'source_keys') else 0 end)+
       (case when jsonb_typeof(luv.content->'evidence_sources')='array' then jsonb_array_length(luv.content->'evidence_sources') else 0 end),
     'review',case when r.module_unit_id is null then null else
       jsonb_build_object('text_status',r.text_status,'visual_status',r.visual_status,
        'source_status',r.source_status,'analysis_status',r.analysis_status,
        'rights_status',r.rights_status,'decision',r.decision,
        'reviewer_note',r.reviewer_note,'rights_evidence',r.rights_evidence,
        'reviewed_by',r.reviewed_by,'revision',r.revision,
        'updated_at',r.updated_at,'approved_at',r.approved_at) end
    ) order by cm.position,cmu.position
   ),'[]'::jsonb) into v_units
   from public.courses c
   join lateral (
     select cv0.id,cv0.version_number from public.course_versions cv0
     where cv0.course_id=c.id and cv0.status='published'
     order by cv0.version_number desc limit 1
   ) cv on true
   join public.course_modules cm on cm.course_version_id=cv.id
   join public.course_module_units cmu on cmu.module_id=cm.id
   join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
   join public.learning_units lu on lu.id=luv.learning_unit_id
   left join lateral (
     select count(*)::int as n from public.learning_unit_sources lus
     where lus.learning_unit_id=lu.id
   ) src on true
   left join public.training_lu_editorial_reviews_v46_5 r on r.module_unit_id=cmu.id
   where c.stable_key=p_course_key;
 end if;
 return jsonb_build_object('courses',v_catalog,'units',v_units,
   'can_review',private.can_edit_slide_images_v33(),
   'display_scope','latest_published_course_version',
   'note','Conteggi preliminari: non equivalgono a validazione tecnica, normativa o diritti.');
end $fn$;
revoke all on function public.training_lu_editorial_matrix_v46_5(text) from public,anon,authenticated;
grant execute on function public.training_lu_editorial_matrix_v46_5(text) to authenticated;

-- Persist only editorial decisions, never change the source LU, official versions or rights register.
create or replace function public.training_save_lu_editorial_review_v46_5(
 p_module_unit_id uuid,
 p_text_status text,
 p_visual_status text,
 p_source_status text,
 p_analysis_status text,
 p_rights_status text,
 p_decision text,
 p_reviewer_note text,
 p_rights_evidence text,
 p_expected_revision integer default 0,
 p_confirm_review boolean default false
) returns jsonb language plpgsql security definer set search_path=''
as $fn$
declare
 v_prev public.training_lu_editorial_reviews_v46_5%rowtype;
 v_now public.training_lu_editorial_reviews_v46_5%rowtype;
 v_allowed boolean;
 v_note text:=btrim(coalesce(p_reviewer_note,''));
 v_rights text:=btrim(coalesce(p_rights_evidence,''));
begin
 if auth.uid() is null or not private.can_edit_slide_images_v33() then
   raise exception 'Solo il responsabile editoriale autorizzato può registrare la revisione.' using errcode='42501';
 end if;
 if p_module_unit_id is null or p_expected_revision is null or p_expected_revision<0 then
   raise exception 'Richiesta editoriale incompleta.';
 end if;
 if p_text_status is null or p_text_status not in ('pending','approved','changes_requested') or
    p_visual_status is null or p_visual_status not in ('pending','approved','changes_requested','not_applicable') or
    p_source_status is null or p_source_status not in ('pending','approved','changes_requested') or
    p_analysis_status is null or p_analysis_status not in ('pending','approved','changes_requested') or
    p_rights_status is null or p_rights_status not in ('pending','approved','changes_requested','not_applicable') or
    p_decision is null or p_decision not in ('pending','approved','changes_requested') then
   raise exception 'Stato editoriale non riconosciuto.';
 end if;
 if length(v_note)>2000 or length(v_rights)>2000 then
   raise exception 'Le motivazioni superano il limite consentito.';
 end if;
 if p_confirm_review is distinct from true then
   raise exception 'Conferma esplicita necessaria prima di registrare una revisione.';
 end if;
 select exists(
   select 1 from public.course_module_units cmu
   join public.course_modules cm on cm.id=cmu.module_id
   join public.course_versions cv on cv.id=cm.course_version_id
   join public.courses c on c.id=cv.course_id
   join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
   where cmu.id=p_module_unit_id and c.active=true
    and cv.status='published' and luv.status='published'
    and coalesce(c.metadata->>'freeze_scope','')=''
    and coalesce(c.metadata->>'frozen','false')<>'true'
    and coalesce(c.metadata->>'is_frozen','false')<>'true'
    and coalesce(c.metadata->>'course_frozen','false')<>'true'
    and not exists(
      select 1 from public.course_versions newer
      where newer.course_id=c.id and newer.status='published'
        and newer.version_number>cv.version_number
    )
 ) into v_allowed;
 if not v_allowed then
   raise exception 'Unità frozen, non pubblicata, non attiva o versione storica: modifica impedita.' using errcode='42501';
 end if;
 if p_decision='approved' and (
   p_text_status<>'approved' or p_source_status<>'approved' or p_analysis_status<>'approved' or
   p_visual_status not in ('approved','not_applicable') or
   (p_visual_status='approved' and p_rights_status<>'approved') or
   (p_visual_status='not_applicable' and p_rights_status<>'not_applicable') or
   length(v_note)<40 or
   (p_rights_status='approved' and length(v_rights)<30)
 ) then
   raise exception 'Approvazione bloccata: verificare tutti gli ambiti, motivazione e prova dei diritti.';
 end if;
 if p_rights_status='approved' and length(v_rights)<30 then
   raise exception 'Documentare i diritti con fonte/licenza/autorizzazione verificabile (almeno 30 caratteri).';
 end if;
 if p_visual_status='not_applicable' and p_rights_status<>'not_applicable' then
   raise exception 'I diritti vanno marcati non applicabili solo insieme alle immagini non applicabili.';
 end if;
 select * into v_prev from public.training_lu_editorial_reviews_v46_5
 where module_unit_id=p_module_unit_id for update;
 if found then
   if v_prev.revision<>p_expected_revision then
     raise exception 'Revisione già modificata: ricaricare la scheda prima di salvare.';
   end if;
   update public.training_lu_editorial_reviews_v46_5 set
     text_status=p_text_status, visual_status=p_visual_status, source_status=p_source_status,
     analysis_status=p_analysis_status, rights_status=p_rights_status,
     decision=p_decision,reviewer_note=v_note,rights_evidence=v_rights,
     reviewed_by=auth.uid(),revision=v_prev.revision+1,updated_at=now(),
     approved_at=case when p_decision='approved' then now() else null end
   where module_unit_id=p_module_unit_id returning * into v_now;
 else
   if p_expected_revision<>0 then
     raise exception 'Scheda di revisione non ancora presente: ricaricare.';
   end if;
   insert into public.training_lu_editorial_reviews_v46_5
     (module_unit_id,text_status,visual_status,source_status,analysis_status,
      rights_status,decision,reviewer_note,rights_evidence,reviewed_by,
      approved_at)
   values (p_module_unit_id,p_text_status,p_visual_status,p_source_status,p_analysis_status,
      p_rights_status,p_decision,v_note,v_rights,auth.uid(),
      case when p_decision='approved' then now() else null end)
   returning * into v_now;
 end if;
 insert into public.training_lu_editorial_events_v46_5
   (module_unit_id,revision,snapshot,actor_id)
 values (p_module_unit_id,v_now.revision,to_jsonb(v_now),auth.uid());
 return jsonb_build_object('module_unit_id',v_now.module_unit_id,
   'decision',v_now.decision,'revision',v_now.revision,'updated_at',v_now.updated_at);
end $fn$;
revoke all on function public.training_save_lu_editorial_review_v46_5(uuid,text,text,text,text,text,text,text,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.training_save_lu_editorial_review_v46_5(uuid,text,text,text,text,text,text,text,text,integer,boolean) to authenticated;
comment on table public.training_lu_editorial_reviews_v46_5 is
 'Human editorial review of a specific published module-unit composition. Approval is an editorial decision only; never publishes or changes a course.';
comment on function public.training_save_lu_editorial_review_v46_5(uuid,text,text,text,text,text,text,text,text,integer,boolean) is
 'Owner-only, version-safe audited editorial decisions. No permission to update learning units, live course versions, assessments or image approvals.';
