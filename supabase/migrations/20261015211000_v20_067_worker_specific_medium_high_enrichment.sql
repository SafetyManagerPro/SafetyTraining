-- SafetyTraining v20.067
-- Worker-specific medium/high shared-risk enrichment.
-- Corrected after full rollback test: no cross-statement CTE reuse.
-- Idempotent; creates/updates draft v2 only and leaves current course compositions untouched.

do $$
declare n integer;
begin
  select count(*) into n
  from public.learning_units
  where stable_key in (
    'ecologici:biologico',
    'ecologici:cadute-ecologici',
    'ecologici:chimico-ecologici',
    'ecologici:traffico-ecologici',
    'verde:rumore-vibrazioni-verde'
  );
  if n <> 5 then
    raise exception 'v20.067 expected 5 target LUs, found %', n;
  end if;

  select count(*) into n
  from (
    select lu.stable_key
    from public.courses c
    join public.course_versions cv on cv.course_id=c.id
    join public.course_modules cm on cm.course_version_id=cv.id
    join public.course_module_units cmu on cmu.module_id=cm.id
    join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
    join public.learning_units lu on lu.id=luv.learning_unit_id
    where c.stable_key in ('lav_medio','lav_alto')
      and lu.stable_key in (
        'ecologici:biologico',
        'ecologici:cadute-ecologici',
        'ecologici:chimico-ecologici',
        'ecologici:traffico-ecologici',
        'verde:rumore-vibrazioni-verde'
      )
    group by lu.stable_key
    having count(distinct c.stable_key)=2
  ) s;
  if n <> 5 then
    raise exception 'v20.067 expected all 5 target LUs to be shared by lav_medio and lav_alto, found %', n;
  end if;
end $$;

with target_units(stable_key,risk_kind) as (
  values
    ('ecologici:biologico','biological'),
    ('ecologici:cadute-ecologici','ecological'),
    ('ecologici:chimico-ecologici','chemical'),
    ('ecologici:traffico-ecologici','traffic'),
    ('verde:rumore-vibrazioni-verde','physical')
), base as (
  select lu.id learning_unit_id,lu.stable_key,tu.risk_kind,v.content
  from target_units tu
  join public.learning_units lu on lu.stable_key=tu.stable_key
  join lateral (
    select luv.content
    from public.learning_unit_versions luv
    where luv.learning_unit_id=lu.id and luv.status='published'
    order by luv.version_number desc
    limit 1
  ) v on true
), enriched as (
  select learning_unit_id,stable_key,
    content || jsonb_build_object(
      'didactic_version','worker-specific-evidence-v2',
      'quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object(
        'teacher_ready',true,
        'learner_ready',true,
        'scenario_based',true,
        'transfer_to_work',true
      ),
      'source_audit',jsonb_build_object(
        'status','reviewed',
        'checked_on','2026-10-15',
        'normative_validation','D.Lgs. 81/2008 vigente + ASR 17/04/2025',
        'reuse_policy','reference_and_original_rewrite'
      ),
      'source_integration_note','La LU conserva contenuto tecnico SafetyTraining e viene rafforzata con un laboratorio di riconoscimento-esposizione-barriere-stop; nessuna fonte esterna sostituisce DVR, procedure o addestramento aziendale.'
    ) || case risk_kind
      when 'chemical' then jsonb_build_object(
        'chemical_task_lab',jsonb_build_object(
          'title','Dal prodotto al compito: che cosa può realmente esporre il lavoratore?',
          'map_fields',jsonb_build_array(
            'prodotto/agente','fase di lavoro','via di esposizione plausibile','durata/frequenza','quantità/dispersione','ventilazione/aspirazione','misure tecniche','procedura/igiene','DPI residui','SDS/etichetta disponibile','condizione anomala/stop'
          ),
          'scenario','Prodotto abituale usato in locale diverso e meno ventilato: stessa sostanza non significa stessa esposizione; prima di proseguire servono verifica e coerenza con SDS/procedura.'
        ),
        'chemical_stop_conditions',jsonb_build_array(
          'prodotto o contenitore non identificato','ventilazione/aspirazione prevista non disponibile','versamento o anomalia non prevista','DPI specifico previsto non disponibile','procedura non coerente con il compito reale'
        )
      )
      when 'biological' then jsonb_build_object(
        'biological_exposure_lab',jsonb_build_object(
          'title','Sorgente – via di esposizione – persona: interrompi la catena',
          'chain',jsonb_build_array(
            'sorgente/materiale/ambiente','via di esposizione','compito','barriera tecnica/organizzativa','igiene/procedura','DPI residui se previsti','evento accidentale e segnalazione'
          ),
          'scenario','Materiale o rifiuto potenzialmente contaminato viene gestito con procedura diversa dal solito: individuare informazioni necessarie, barriere e condizioni di stop.'
        ),
        'exposure_event_rule','Puntura, taglio, schizzo o altra esposizione accidentale vanno gestiti secondo procedure aziendali e sanitarie previste; non minimizzare l’evento solo perché non vi è danno immediato visibile.'
      )
      when 'physical' then jsonb_build_object(
        'noise_vibration_control_lab',jsonb_build_object(
          'title','Riduci alla fonte prima di affidarti al solo comportamento individuale',
          'map_fields',jsonb_build_array(
            'sorgente/macchina/utensile','fase e durata','distanza/contatto','manutenzione','persone esposte','misura alla fonte','isolamento/separazione','organizzazione tempi','addestramento','DPI residuo','segnale di anomalia/stop'
          ),
          'scenario','Rumore o vibrazione percepiti maggiori del solito: riconoscere l’anomalia e attivare verifica/manutenzione invece di compensare soltanto con DPI o forza.'
        ),
        'change_trigger','Aumento di rumore/vibrazione, modifica dell’utensile, manutenzione carente o tempi di utilizzo diversi possono modificare l’esposizione reale.'
      )
      when 'traffic' then jsonb_build_object(
        'vehicle_pedestrian_lab',jsonb_build_object(
          'title','Separare persone e mezzi prima di affidarsi alla visibilità del conducente',
          'map_fields',jsonb_build_array(
            'percorso mezzi','percorso pedoni','incroci','retromarce','punti ciechi','accessi/uscite','carico che limita visuale','zone di esclusione','comunicazione','illuminazione','stop condition'
          ),
          'scenario','Mezzo in retromarcia e pedoni usano temporaneamente lo stesso varco: riprogettare la sequenza o segregare, non limitarsi a guardarsi meglio.',
          'near_miss_prompt','Un quasi investimento va analizzato come fallimento o assenza di barriere di viabilità, segregazione, visibilità o organizzazione, non solo come errore individuale.'
        ),
        'source_evidence_note','Il caso INAIL Infor.MO sui carrelli è usato per dinamiche investimento/visibilità e scenari originali; non implica che ogni unità riguardi l’abilitazione alla conduzione.'
      )
      when 'ecological' then jsonb_build_object(
        'field_environment_lab',jsonb_build_object(
          'title','Il rischio cambia con ambiente, percorso e materiale incontrato',
          'map_fields',jsonb_build_array(
            'attività/area','traffico o mezzi','terreno/ostacoli','materiali/rifiuti sconosciuti','agenti biologici/chimici plausibili','meteo/microclima','lavoro isolato/comunicazione','DPI/attrezzi','igiene/decontaminazione','emergenza/accesso soccorsi','condizione di stop'
          ),
          'scenario','Attività esterna abituale ma con accesso, materiali presenti o meteo cambiati: rifare il controllo operativo prima di iniziare invece di applicare automaticamente la routine.'
        ),
        'dynamic_environment_rule','Nelle attività esterne o ambientali il sopralluogo operativo e la segnalazione dei cambiamenti sono barriere preventive.'
      )
    end as new_content
  from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null
from enriched
on conflict (learning_unit_id,version_number) do update
set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione vigente per agenti chimici, biologici, fisici, viabilità/attrezzature e obblighi del lavoratore.',date '2026-10-15','{}'::jsonb
from public.learning_units lu
where lu.stable_key in (
  'ecologici:biologico','ecologici:cadute-ecologici','ecologici:chimico-ecologici','ecologici:traffico-ecologici','verde:rumore-vibrazioni-verde'
)
on conflict (learning_unit_id,source_key,purpose) do update
set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'rer-formazione-figure-prevenzione','method_reference','Riferimento metodologico per gerarchia delle misure, valutazione del rischio e attività didattiche originali.',date '2026-10-15',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable')
from public.learning_units lu
where lu.stable_key in (
  'ecologici:biologico','ecologici:cadute-ecologici','ecologici:chimico-ecologici','ecologici:traffico-ecologici','verde:rumore-vibrazioni-verde'
)
on conflict (learning_unit_id,source_key,purpose) do update
set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-informo-carrelli-21','incident_evidence','Caso INAIL per dinamiche investimento, visibilità, separazione mezzi-pedoni e barriere organizzative.',date '2026-10-15','{}'::jsonb
from public.learning_units lu
where lu.stable_key='ecologici:traffico-ecologici'
on conflict (learning_unit_id,source_key,purpose) do update
set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-primo-soccorso-chimico-2025','sds_and_exposure_information_reference','Riferimento INAIL 2025 per accessibilità SDS e specificità delle informazioni in caso di esposizione.',date '2026-10-15','{}'::jsonb
from public.learning_units lu
where lu.stable_key='ecologici:chimico-ecologici'
on conflict (learning_unit_id,source_key,purpose) do update
set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
