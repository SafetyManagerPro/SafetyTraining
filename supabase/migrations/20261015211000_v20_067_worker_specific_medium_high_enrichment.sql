-- SafetyTraining v20.067
-- Worker-specific medium/high shared-risk enrichment.
-- Dynamic guard requires exactly five shared LUs: chemical, biological, noise/vibration, traffic, ecological/field.

do $$
declare n integer;
begin
  with shared as (
    select lu.id,lu.stable_key,lu.title
    from public.courses c
    join public.course_versions cv on cv.course_id=c.id
    join public.course_modules cm on cm.course_version_id=cv.id
    join public.course_module_units cmu on cmu.module_id=cm.id
    join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
    join public.learning_units lu on lu.id=luv.learning_unit_id
    where c.stable_key in ('lav_medio','lav_alto') and lu.stable_key not like 'generale:%'
    group by lu.id having count(distinct c.stable_key)=2
  ), target as (
    select * from shared
    where lower(title) like '%chimic%' or lower(title) like '%biologic%' or lower(title) like '%rumore%' or lower(title) like '%vibraz%' or lower(title) like '%traff%' or lower(title) like '%viabil%' or lower(title) like '%investiment%' or lower(title) like '%ecologic%' or lower(stable_key) like '%ecologic%'
  )
  select count(*) into n from target;
  if n <> 5 then raise exception 'v20.067 expected 5 medium/high shared risk LUs, found %',n; end if;
end $$;

with shared as (
  select lu.id,lu.stable_key,lu.title
  from public.courses c
  join public.course_versions cv on cv.course_id=c.id
  join public.course_modules cm on cm.course_version_id=cv.id
  join public.course_module_units cmu on cmu.module_id=cm.id
  join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
  join public.learning_units lu on lu.id=luv.learning_unit_id
  where c.stable_key in ('lav_medio','lav_alto') and lu.stable_key not like 'generale:%'
  group by lu.id having count(distinct c.stable_key)=2
), target_units as (
  select s.*,case when lower(s.title) like '%chimic%' then 'chemical' when lower(s.title) like '%biologic%' then 'biological' when lower(s.title) like '%rumore%' or lower(s.title) like '%vibraz%' then 'physical' when lower(s.title) like '%traff%' or lower(s.title) like '%viabil%' or lower(s.title) like '%investiment%' then 'traffic' when lower(s.title) like '%ecologic%' or lower(s.stable_key) like '%ecologic%' then 'ecological' end risk_kind
  from shared s
  where lower(s.title) like '%chimic%' or lower(s.title) like '%biologic%' or lower(s.title) like '%rumore%' or lower(s.title) like '%vibraz%' or lower(s.title) like '%traff%' or lower(s.title) like '%viabil%' or lower(s.title) like '%investiment%' or lower(s.title) like '%ecologic%' or lower(s.stable_key) like '%ecologic%'
), base as (
  select tu.id learning_unit_id,tu.stable_key,tu.title,tu.risk_kind,v.content
  from target_units tu
  join lateral (select content from public.learning_unit_versions luv where luv.learning_unit_id=tu.id and luv.status='published' order by version_number desc limit 1) v on true
), enriched as (
  select learning_unit_id,stable_key,
    content || jsonb_build_object(
      'didactic_version','worker-specific-evidence-v2',
      'quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'scenario_based',true,'transfer_to_work',true),
      'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-15','normative_validation','D.Lgs. 81/2008 vigente + ASR 17/04/2025','reuse_policy','reference_and_original_rewrite'),
      'evidence_sources',jsonb_build_array(
        jsonb_build_object('authority','Normattiva','title','D.Lgs. 81/2008 - testo vigente','url','https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED','use','normative_validation','checked_on','2026-10-15'),
        jsonb_build_object('authority','Regione Emilia-Romagna','title','Materiali didattici per la formazione delle figure della prevenzione','url','https://salute.regione.emilia-romagna.it/sicurezza-nei-luoghi-di-lavoro/formazione/materiali-didattici','use','method_and_structure_reference','checked_on','2026-10-15')
      ) || case when risk_kind='traffic' then jsonb_build_array(
        jsonb_build_object('authority','INAIL','title','Infor.MO Scheda 21 - dinamiche infortunistiche nell’uso dei carrelli elevatori','url','https://www.inail.it/content/dam/inail-hub-site/documenti/2024/01/Scheda%2021%20InforMO.pdf','use','incident_evidence','checked_on','2026-10-15')
      ) when risk_kind='chemical' then jsonb_build_array(
        jsonb_build_object('authority','INAIL','title','Rischio chimico sui luoghi di lavoro - primo soccorso in caso di infortunio','url','https://www.inail.it/portale/it/inail-comunica/news/notizia.2025.01.rischio-chimico-sui-luoghi-di-lavoro-online-un-manuale-di-primo-soccorso-in-caso-di-infortunio.html','use','sds_and_exposure_information_reference','checked_on','2026-10-15')
      ) else '[]'::jsonb end,
      'source_integration_note','La LU conserva contenuto tecnico SafetyTraining e viene rafforzata con un laboratorio di riconoscimento-esposizione-barriere-stop; nessuna fonte esterna sostituisce DVR, procedure o addestramento aziendale.'
    ) || case risk_kind
      when 'chemical' then jsonb_build_object('chemical_task_lab',jsonb_build_object('title','Dal prodotto al compito: che cosa può realmente esporre il lavoratore?','map_fields',jsonb_build_array('prodotto/agente','fase di lavoro','via di esposizione plausibile','durata/frequenza','quantità/dispersione','ventilazione/aspirazione','misure tecniche','procedura/igiene','DPI residui','SDS/etichetta disponibile','condizione anomala/stop'),'scenario','Prodotto abituale usato in locale diverso e meno ventilato: il corsista deve riconoscere che stessa sostanza non significa stessa esposizione e chiedere verifica prima di proseguire.','task','Leggere una SDS/etichetta didattica insieme alla procedura e individuare informazioni che cambiano manipolazione, stoccaggio, DPI, emergenza e segnalazione.'),'chemical_stop_conditions',jsonb_build_array('prodotto o contenitore non identificato','ventilazione/aspirazione prevista non disponibile','versamento o odore/anomalia non prevista','DPI specifico previsto non disponibile o non utilizzabile','procedura non coerente con il compito reale'))
      when 'biological' then jsonb_build_object('biological_exposure_lab',jsonb_build_object('title','Sorgente – via di esposizione – persona: interrompi la catena','chain',jsonb_build_array('sorgente/materiale/ambiente','modalità con cui l’agente può raggiungere la persona','compito che genera esposizione','barriera tecnica/organizzativa','igiene e procedura','DPI residui se previsti','evento accidentale e segnalazione'),'scenario','Materiale biologico o rifiuto potenzialmente contaminato viene gestito con procedura diversa dal solito: individuare quali informazioni servono prima di manipolarlo e quali condizioni impongono stop/escalation.','task','Confrontare due attività con la stessa sorgente ma diversa modalità di esposizione e spiegare perché misure e rischio non coincidono automaticamente.'),'exposure_event_rule','Puntura, taglio, schizzo o altra esposizione accidentale vanno gestiti secondo procedure aziendali e sanitarie previste; non minimizzare l’evento solo perché non vi è un danno immediato visibile.')
      when 'physical' then jsonb_build_object('noise_vibration_control_lab',jsonb_build_object('title','Riduci alla fonte prima di affidarti al solo comportamento individuale','map_fields',jsonb_build_array('sorgente/macchina/utensile','fase e durata','distanza/contatto','condizioni manutentive','persone esposte','misura alla fonte','isolamento/separazione','organizzazione tempi','informazione/addestramento','DPI residuo se previsto','segnale di anomalia/stop'),'scenario','Utensile normalmente usato produce rumore/vibrazione percepiti maggiori del solito: il lavoratore deve riconoscere l’anomalia, non compensare semplicemente con più DPI o forza e attivare verifica/manutenzione.','task','Dati tre casi, ordinare le misure da sorgente a lavoratore e indicare quale evidenza dimostra che l’esposizione è stata realmente ridotta.'),'change_trigger','Aumento di rumore/vibrazione, modifica dell’utensile, manutenzione carente o tempi di utilizzo diversi sono cambiamenti da segnalare perché possono modificare l’esposizione reale.')
      when 'traffic' then jsonb_build_object('vehicle_pedestrian_lab',jsonb_build_object('title','Separare persone e mezzi prima di affidarsi alla visibilità del conducente','map_fields',jsonb_build_array('percorso mezzi','percorso pedoni','incroci','retromarce','punti ciechi','accessi/uscite','carico che limita visuale','zone di esclusione','segnalatore/comunicazione quando prevista','illuminazione/condizioni','stop condition'),'scenario','Mezzo in retromarcia e pedoni usano temporaneamente lo stesso varco perché un percorso è occupato: il gruppo deve riprogettare la sequenza o segregare, non limitarsi a guardarsi meglio.','near_miss_prompt','Un quasi investimento va analizzato come fallimento o assenza di barriere di viabilità, segregazione, visibilità o organizzazione, non solo come errore individuale.'),'source_evidence_note','Il caso INAIL Infor.MO sui carrelli è usato per dinamiche investimento/visibilità e per costruire scenari originali; non implica che ogni unità riguardi l’abilitazione alla conduzione.')
      when 'ecological' then jsonb_build_object('field_environment_lab',jsonb_build_object('title','Il rischio cambia con ambiente, percorso e materiale incontrato','map_fields',jsonb_build_array('attività/area','traffico o mezzi','terreno/ostacoli','materiali/rifiuti taglienti o sconosciuti','agenti biologici/chimici plausibili','meteo/microclima','lavoro isolato/comunicazione','DPI/attrezzi','igiene/decontaminazione','emergenza/accesso soccorsi','condizione di stop'),'scenario','Attività esterna prevista in area abituale, ma accesso, materiali presenti e condizioni meteo sono cambiati: il lavoratore deve rifare il controllo operativo prima di iniziare invece di applicare automaticamente la routine.','task','Costruire una checklist pre-attività che distingua ciò che il lavoratore può controllare da ciò che richiede intervento organizzativo/tecnico.'),'dynamic_environment_rule','Nelle attività esterne o ambientali il sopralluogo operativo e la segnalazione dei cambiamenti sono barriere preventive: la routine non rende stabile un ambiente che cambia.')
    end as new_content
  from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select tu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione vigente per agenti chimici, biologici, fisici, rischi da viabilità/attrezzature e obblighi del lavoratore.',date '2026-10-15','{}'::jsonb from target_units tu
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select tu.id,'rer-formazione-figure-prevenzione','method_reference','Riferimento metodologico per gerarchia delle misure, valutazione del rischio e attività didattiche originali.',date '2026-10-15',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable') from target_units tu
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select tu.id,'inail-informo-carrelli-21','incident_evidence','Caso INAIL per dinamiche investimento, visibilità, separazione mezzi-pedoni e barriere organizzative.',date '2026-10-15','{}'::jsonb from target_units tu where tu.risk_kind='traffic'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select tu.id,'inail-primo-soccorso-chimico-2025','sds_and_exposure_information_reference','Riferimento INAIL 2025 per accessibilità SDS e specificità delle informazioni in caso di esposizione; usato come supporto, non come fonte unica di prevenzione chimica.',date '2026-10-15','{}'::jsonb from target_units tu where tu.risk_kind='chemical'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
