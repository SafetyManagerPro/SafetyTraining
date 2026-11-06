-- v33, explicit single-account slide-image editor.
-- Never grant editorial access merely because another user becomes platform_admin.
create table if not exists private.slide_image_editor_allowlist_v33(
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now()
);
revoke all on private.slide_image_editor_allowlist_v33 from public,anon,authenticated;
-- Seed only when the existing deployment has one authenticated user AND one platform admin.
insert into private.slide_image_editor_allowlist_v33(user_id)
select pa.user_id from public.platform_admins pa
where (select count(*) from public.platform_admins)=1
  and (select count(*) from auth.users)=1
  and exists(select 1 from auth.users u where u.id=pa.user_id)
on conflict do nothing;
create or replace function private.can_edit_slide_images_v33()
 returns boolean language sql stable security definer set search_path=''
as $f$
 select auth.uid() is not null and
  exists(select 1 from private.slide_image_editor_allowlist_v33 e
   join public.platform_admins pa on pa.user_id=e.user_id
   where e.user_id=auth.uid());
$f$;
revoke all on function private.can_edit_slide_images_v33() from public,anon,authenticated;
create or replace function public.can_edit_slide_images_v33()
 returns boolean language sql stable security definer set search_path=''
as $f$ select private.can_edit_slide_images_v33(); $f$;
revoke all on function public.can_edit_slide_images_v33() from public,anon;
grant execute on function public.can_edit_slide_images_v33() to authenticated;
create table if not exists public.slide_image_local_catalog_v33(
 path text primary key,
 constraint valid_asset_path check(path ~ '^assets/[A-Za-z0-9_.-]+[.](svg|png|jpg|jpeg|webp)$')
);
alter table public.slide_image_local_catalog_v33 enable row level security;
revoke all on public.slide_image_local_catalog_v33 from public,anon,authenticated;
grant select on public.slide_image_local_catalog_v33 to authenticated;
create policy slide_image_local_catalog_v33_read on public.slide_image_local_catalog_v33
 for select to authenticated using(auth.uid() is not null);
insert into public.slide_image_local_catalog_v33(path) values
('assets/gp03-gerarchia-prevenzione.svg'),
('assets/gp03-matrice-rischio.svg'),
('assets/gp03-near-miss.svg'),
('assets/gp03-isolamento-elettrico.svg'),
('assets/gp03-caduta-livello.svg'),
('assets/gp03-movimentazione-carichi.svg'),
('assets/gp03-postazione-vdt.svg'),
('assets/gp03-rumore-esposizione.svg'),
('assets/gp03-aspirazione-polveri.svg'),
('assets/gp03-microclima-calore.svg'),
('assets/gp03-scheda-sicurezza-chimica.svg'),
('assets/gp03-rischi-interferenziali.svg'),
('assets/gp04-casco-dpi.svg'),
('assets/gp04-visiera-dpi.svg'),
('assets/gp04-respiratore-dpi.svg'),
('assets/gp04-guanti-dpi.svg'),
('assets/gp04-udito-dpi.svg'),
('assets/gp04-calzature-dpi.svg'),
('assets/gp04-divieto-segnali.svg'),
('assets/gp04-obbligo-segnali.svg'),
('assets/gp04-avvertimento-segnali.svg'),
('assets/gp04-esodo-segnali.svg'),
('assets/gp04-preuso-carrelli.svg'),
('assets/gp04-baricentro-carrelli.svg'),
('assets/gp04-pedoni-carrelli.svg'),
('assets/gp04-visuale-carrelli.svg'),
('assets/gp04-pendenza-carrelli.svg'),
('assets/gp04-parcheggio-carrelli.svg'),
('assets/gp04-controlli-ple.svg'),
('assets/gp04-stabilita-ple.svg'),
('assets/gp04-ostacoli-ple.svg'),
('assets/gp04-elettrico-ple.svg'),
('assets/gp04-vento-ple.svg'),
('assets/gp04-recupero-ple.svg'),
('assets/gp04-stabilizzatori-gru.svg'),
('assets/gp04-portata-gru.svg'),
('assets/gp04-brache-gru.svg'),
('assets/gp04-sospeso-gru.svg'),
('assets/gp04-segnalatore-gru.svg'),
('assets/gp04-elettrico-gru.svg'),
('assets/gp04-preuso-mmt.svg'),
('assets/gp04-sottoservizi-mmt.svg'),
('assets/gp04-scarpate-mmt.svg'),
('assets/gp04-raggio-mmt.svg'),
('assets/gp04-retromarcia-mmt.svg'),
('assets/gp04-riparo-macchina.svg'),
('assets/gp04-rotanti-macchina.svg'),
('assets/gp04-energia-macchina.svg'),
('assets/gp04-utensili-macchina.svg'),
('assets/gp04-anomalia-macchina.svg'),
('assets/gp04-allarme-fire.svg'),
('assets/gp04-uscita-fire.svg'),
('assets/gp04-fumo-fire.svg'),
('assets/gp04-innesco-fire.svg'),
('assets/gp04-presidi-fire.svg'),
('assets/gp04-scena-soccorso.svg'),
('assets/gp04-chiamata-soccorso.svg'),
('assets/gp04-presidi-soccorso.svg'),
('assets/gp04-arrivo-soccorso.svg'),
('assets/gp04-parapetti-quota.svg'),
('assets/gp04-aperture-quota.svg'),
('assets/gp04-ancoraggio-quota.svg'),
('assets/gp04-recupero-quota.svg'),
('assets/gp04-brache-sollevamento.svg'),
('assets/gp04-baricentro-sollevamento.svg'),
('assets/gp04-perimetro-sollevamento.svg'),
('assets/general.svg'),
('assets/gp02-ppe-helmet-check.svg'),
('assets/gp02-ppe-harness-check.svg'),
('assets/gp02-ppe-respirator-fit.svg'),
('assets/gp02-ppe-gloves-rotation.svg'),
('assets/gp02-signs-ban-mandate.svg'),
('assets/gp02-signs-warning-rescue.svg'),
('assets/gp02-exit-obstructed.svg'),
('assets/gp02-fire-extinguisher-identify.svg'),
('assets/gp02-collective-barriers.svg'),
('assets/gp02-machine-pinch-guard.svg'),
('assets/gp02-pedestrian-separated.svg'),
('assets/gp02-chemical-labels.svg'),
('assets/gp02-checklist-dpi.svg'),
('assets/gp02-emergency-alert.svg'),
('assets/gp02-lifting-suspended-load.svg'),
('assets/gp02-first-aid-safety.svg'),
('assets/gp02-forklift-preuse.svg'),
('assets/gp02-forklift-blindspot.svg'),
('assets/gp02-forklift-pedestrians.svg'),
('assets/gp02-forklift-load.svg'),
('assets/gp02-forklift-forks.svg'),
('assets/gp02-forklift-ramp.svg'),
('assets/gp02-forklift-battery.svg'),
('assets/gp02-forklift-park.svg'),
('assets/gp02-ple-preuse.svg'),
('assets/gp02-ple-stabilizers.svg'),
('assets/gp02-ple-overhead-pinch.svg'),
('assets/gp02-ple-power-lines.svg'),
('assets/gp02-ple-weather.svg'),
('assets/gp02-ple-harness.svg'),
('assets/gp02-ple-emergency.svg'),
('assets/gp02-ple-exclusion.svg'),
('assets/gp02-crane-preuse.svg'),
('assets/gp02-crane-outriggers.svg'),
('assets/gp02-crane-suspended.svg'),
('assets/gp02-crane-swing.svg'),
('assets/gp02-crane-signaller.svg'),
('assets/gp02-crane-crushing.svg'),
('assets/gp02-crane-electric.svg'),
('assets/gp02-crane-capacity.svg'),
('assets/gp02-mmt-preuse.svg'),
('assets/gp02-mmt-three-points.svg'),
('assets/gp02-mmt-swing-zone.svg'),
('assets/gp02-mmt-excavation-edge.svg'),
('assets/gp02-mmt-slope.svg'),
('assets/gp02-mmt-underground.svg'),
('assets/gp02-mmt-maintenance.svg'),
('assets/gp02-mmt-reversing.svg'),
('assets/gp01-dpi-casco.svg'),
('assets/gp01-dpi-occhiali.svg'),
('assets/gp01-dpi-guanti.svg'),
('assets/gp01-dpi-scarpe.svg'),
('assets/gp01-dpi-udito.svg'),
('assets/gp01-dpi-respiratore.svg'),
('assets/gp01-dpi-imbracatura.svg'),
('assets/gp01-dpi-vs-dpc.svg'),
('assets/gp01-segnali-famiglie.svg'),
('assets/gp01-segnali-colori.svg'),
('assets/gp01-segnali-divieto.svg'),
('assets/gp01-segnali-obbligo.svg'),
('assets/gp01-segnali-avvertimento.svg'),
('assets/gp01-segnali-emergenza.svg'),
('assets/gp01-rischio-caduta.svg'),
('assets/gp01-rischio-schiacciamento.svg'),
('assets/gp01-rischio-investimento.svg'),
('assets/gp01-rischio-ribaltamento.svg'),
('assets/gp01-procedura-preuso.svg'),
('assets/gp01-procedura-emergenza.svg'),
('assets/risk.svg'),
('assets/roles.svg'),
('assets/rights.svg'),
('assets/conflict.svg'),
('assets/office.svg'),
('assets/road.svg'),
('assets/bio.svg'),
('assets/green.svg'),
('assets/fire.svg'),
('assets/emergency.svg'),
('assets/cna-avellino.png'),
('assets/scene-antincendio.svg'),
('assets/scene-backoffice.svg'),
('assets/scene-ecologici.svg'),
('assets/scene-frontoffice.svg'),
('assets/scene-generale.svg'),
('assets/scene-polizia.svg'),
('assets/scene-rls.svg'),
('assets/scene-verde.svg'),
('assets/scenario-critical.svg'),
('assets/idea-risk-cycle.svg'),
('assets/idea-vdt-ergonomia.svg'),
('assets/idea-aggression-flow.svg'),
('assets/idea-road-safety.svg'),
('assets/idea-bio-chain.svg'),
('assets/idea-fire-response.svg'),
('assets/idea-green-safearea.svg'),
('assets/idea-rls-cycle.svg'),
('assets/idea-dpi-hierarchy.svg'),
('assets/idea-emergency-steps.svg'),
('assets/idea-signs-basic.svg'),
('assets/idea-front-layout.svg'),
('assets/idea-evac-public.svg'),
('assets/idea-archive-safe.svg'),
('assets/idea-ladder-safe.svg'),
('assets/idea-compactor-safe.svg'),
('assets/idea-sharps-safe.svg'),
('assets/idea-hygiene-clean-dirty.svg'),
('assets/idea-heat-stress.svg'),
('assets/idea-chainsaw-safe.svg'),
('assets/idea-working-height-safe.svg'),
('assets/idea-safety-system.svg'),
('assets/idea-inspection-flow.svg'),
('assets/idea-sanctions-logic.svg'),
('assets/idea-police-road.svg'),
('assets/idea-police-conflict.svg'),
('assets/idea-police-night.svg'),
('assets/idea-fire-triangle.svg'),
('assets/idea-fire-passive.svg'),
('assets/idea-fire-practice.svg'),
('assets/idea-rls-consult.svg'),
('assets/idea-dvr-reading.svg'),
('assets/idea-duvri.svg'),
('assets/video-risky-business.svg'),
('assets/video-violence.svg'),
('assets/video-safe-moves.svg'),
('assets/video-fire-alert.svg'),
('assets/video-lighten-load.svg'),
('assets/video-work-height.svg'),
('assets/video-stop-noise.svg'),
('assets/video-chemicals.svg'),
('assets/organigramma-sicurezza.svg'),
('assets/piramide-pericoli.svg'),
('assets/modello-farfalla-rischio.svg'),
('assets/procedura-operativa-5-fasi.svg'),
('assets/stop-segnala-ripristina.svg')
on conflict(path) do nothing;
create table if not exists public.slide_image_overrides_v33(
 course_key text not null,
 version_number integer not null check(version_number>=1),
 slide_uid text not null,
 items jsonb not null check(jsonb_typeof(items)='array'),
 edited_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now(),
 primary key(course_key,version_number,slide_uid)
);
alter table public.slide_image_overrides_v33 enable row level security;
revoke all on public.slide_image_overrides_v33 from public,anon,authenticated;
-- Only the RPC layer can read/change the rows; no direct table grants to API users.

create or replace function public.read_slide_images_v33(p_course_key text,p_version_number integer)
 returns jsonb language plpgsql stable security definer set search_path=''
as $f$
declare result jsonb; is_editor boolean;
begin
 if auth.uid() is null then return '[]'::jsonb;end if;
 is_editor:=private.can_edit_slide_images_v33();
 -- Noneditor viewers can see safe local custom graphics, never private figure IDs.
 select coalesce(jsonb_agg(jsonb_build_object(
  'slide_uid',o.slide_uid,
  'items',coalesce((
     select jsonb_agg(e.value order by e.ordinality)
     from jsonb_array_elements(o.items) with ordinality e(value,ordinality)
     where is_editor or e.value->>'kind'='local'
   ),'[]'::jsonb)
 ) order by o.slide_uid),'[]'::jsonb) into result
 from public.slide_image_overrides_v33 o
 where o.course_key=p_course_key and o.version_number=p_version_number;
 return result;
end $f$;
revoke all on function public.read_slide_images_v33(text,integer) from public,anon;
grant execute on function public.read_slide_images_v33(text,integer) to authenticated;

create or replace function public.save_slide_images_v33(
 p_course_key text,p_version_number integer,p_slide_uid text,p_items jsonb)
 returns jsonb language plpgsql security definer set search_path=''
as $f$
declare x jsonb; v_course_id uuid; v_latest int; v_count int;
begin
 if not private.can_edit_slide_images_v33() then
  raise exception 'Modifica delle immagini consentita esclusivamente al proprietario amministratore.' using errcode='42501';
 end if;
 if p_course_key is null or p_course_key !~ '^[a-zA-Z0-9_-]{3,120}$' or
    p_slide_uid is null or length(p_slide_uid)>240 or length(p_slide_uid)<4 or
    p_slide_uid !~ '^[A-Za-z0-9_-]+$' or
    left(p_slide_uid,length(p_course_key)+1)<>p_course_key||'-' then
  raise exception 'Corso o identificativo slide non valido.';
 end if;
 select c.id into v_course_id from public.courses c where c.stable_key=p_course_key
   and c.active=true and coalesce(c.metadata->>'freeze_scope','')=''
   and coalesce(c.metadata->>'frozen','false')<>'true'
   and coalesce(c.metadata->>'is_frozen','false')<>'true'
   and coalesce(c.metadata->>'course_frozen','false')<>'true';
 if v_course_id is null then raise exception 'Corso non modificabile o congelato.';end if;
 select cv.version_number into v_latest from public.course_versions cv
 where cv.course_id=v_course_id and cv.status='published'
 order by cv.version_number desc limit 1;
 if v_latest is null or v_latest<>p_version_number then
  raise exception 'La modifica deve riferirsi alla versione pubblicata corrente.';
 end if;
 if p_items is null then
  delete from public.slide_image_overrides_v33 o
   where o.course_key=p_course_key and o.version_number=p_version_number and o.slide_uid=p_slide_uid;
  return jsonb_build_object('reset',true);
 end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>3 then
  raise exception 'Una slide può contenere da zero a tre immagini.';
 end if;
 for x in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(x)<>'object' or x->>'kind' not in ('local','private_pdf')
     or length(coalesce(x->>'caption',''))>180 then
   raise exception 'Dati immagine non validi.';
  end if;
  if x->>'kind'='local' then
   if not exists(select 1 from public.slide_image_local_catalog_v33 a
                 where a.path=x->>'src') then
    raise exception 'Illustrazione non appartenente all’archivio.';
   end if;
  else
   if coalesce(x->>'ref_id','') !~ '^pdf-[0-9]{5}$' or
      not exists(
       select 1 from public.training_integral_pdf_refs_v24 r
       join public.training_integral_pdf_reviews_v25 v on v.ref_id=r.id
       left join public.training_image_exclusions_v26 e on e.image_key=r.id
       where r.id=x->>'ref_id' and v.technical_status='approved'
       and v.rights_status='cleared_internal'
       and coalesce(e.excluded,false)=false
      ) then
    raise exception 'Tavola privata priva di entrambe le approvazioni o esclusa.';
   end if;
  end if;
 end loop;
 insert into public.slide_image_overrides_v33(course_key,version_number,slide_uid,items,edited_by)
 values(p_course_key,p_version_number,p_slide_uid,p_items,auth.uid())
 on conflict(course_key,version_number,slide_uid) do update set
  items=excluded.items,edited_by=excluded.edited_by,updated_at=now();
 return jsonb_build_object('saved',true,'images',jsonb_array_length(p_items));
end $f$;
revoke all on function public.save_slide_images_v33(text,integer,text,jsonb) from public,anon;
grant execute on function public.save_slide_images_v33(text,integer,text,jsonb) to authenticated;
comment on table public.slide_image_overrides_v33 is 'Version-specific viewer/print slide choices; only a one-time whitelisted owner admin may edit; others view local visuals only.';
