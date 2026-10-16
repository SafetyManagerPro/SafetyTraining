-- SafetyTraining v20.070
-- Preposto + Dirigente authored standard completion.
-- Draft-only: no published composition, Test Builder or final assessment is modified.

do $$
declare n integer;
begin
  select count(*) into n
  from public.learning_units
  where stable_key in (
    'preposto:ruolo-obblighi-relazioni','preposto:rapporti-cooperazione','preposto:vigilanza-operativa','preposto:interruzione-segnalazione',
    'preposto:valutazione-situazioni-rischio','preposto:controllo-misure-esecuzione','preposto:comunicazione-feedback','preposto:scenari-decisionali',
    'dirigente:ruolo-responsabilita-delega','dirigente:sistema-istituzionale-231-tutele','dirigente:processi-mog-sgsl','dirigente:dvr-misure-risorse',
    'dirigente:appalti-interferenze','dirigente:emergenze-organizzazione','dirigente:comunicazione-formazione-consultazione','dirigente:scenario-manageriale',
    'update:preposto:role','update:preposto:vigilance','update:preposto:stop','update:preposto:communication',
    'update:dirigente:governance','update:dirigente:risk','update:dirigente:contractors','update:dirigente:leadership'
  );
  if n <> 24 then raise exception 'v20.070 expected 24 learning units, found %', n; end if;
end $$;

with target as (
  select lu.id learning_unit_id, lu.stable_key,
         (select max(v.version_number)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
         (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id order by v.version_number desc limit 1) content
  from public.learning_units lu
  where lu.stable_key in (
    'preposto:ruolo-obblighi-relazioni','preposto:rapporti-cooperazione','preposto:vigilanza-operativa','preposto:interruzione-segnalazione',
    'preposto:valutazione-situazioni-rischio','preposto:controllo-misure-esecuzione','preposto:comunicazione-feedback','preposto:scenari-decisionali',
    'dirigente:ruolo-responsabilita-delega','dirigente:sistema-istituzionale-231-tutele','dirigente:processi-mog-sgsl','dirigente:dvr-misure-risorse',
    'dirigente:appalti-interferenze','dirigente:emergenze-organizzazione','dirigente:comunicazione-formazione-consultazione','dirigente:scenario-manageriale',
    'update:preposto:role','update:preposto:vigilance','update:preposto:stop','update:preposto:communication',
    'update:dirigente:governance','update:dirigente:risk','update:dirigente:contractors','update:dirigente:leadership'
  )
), enriched as (
  select learning_unit_id, stable_key, target_version,
    content || jsonb_build_object(
      'didactic_version','role-authored-v3',
      'question',coalesce(content->>'question',content->'quiz'->>'question',content->>'summary'),
      'question_explanation',coalesce(content->>'question_explanation',content->'quiz'->>'explanation',content->>'detail',content->>'summary'),
      'takeaway',coalesce(content->>'takeaway',content->>'summary'),
      'teacher_activity',jsonb_build_object(
        'prompt',coalesce(content->>'case',content->'guided_activity'->>'prompt',content->>'question',content->'quiz'->>'question'),
        'method','Prima raccogliere fatti e decisioni dell’aula; poi mostrare la soluzione ragionata e collegarla al ruolo.',
        'debrief','Chiudere con cosa fare, chi coinvolgere, condizione di STOP e criterio di verifica.'
      ),
      'operational',coalesce(content->'operational','{}'::jsonb)||jsonb_build_object(
        'before',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Verifica attività, rischi, misure e cambiamenti del contesto.','Chiarisci persone, procedure applicabili e canali di escalation.')
          else jsonb_build_array('Raccogli evidenze da DVR, processi, audit, eventi e cambiamenti.','Chiarisci priorità, poteri, risorse e responsabili prima di decidere.') end,
        'during',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Osserva il lavoro reale e le condizioni.','Intervieni, correggi o ferma quando necessario.','Comunica ed escala ciò che supera il tuo ruolo.')
          else jsonb_build_array('Assegna risorse e responsabilità.','Coordina le funzioni coinvolte.','Gestisci gli scostamenti rispetto alle misure e agli obiettivi.') end,
        'after',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Verifica il ripristino e la tenuta della correzione.','Riporta near miss, trend e criticità ricorrenti al sistema di prevenzione.')
          else jsonb_build_array('Verifica attuazione ed efficacia.','Riesamina decisioni, indicatori e rischio residuo e correggi ciò che non funziona.') end,
        'step_by_step',coalesce(content->'operational'->'step_by_step',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Osserva','Confronta con regole e rischio','Decidi','Intervieni','Segnala/escalation','Verifica')
          else jsonb_build_array('Analizza evidenze e vincoli','Prioritizza','Decidi','Assegna poteri e risorse','Controlla attuazione','Riesamina efficacia') end),
        'if_problem',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Metti in sicurezza le persone.','Non normalizzare lo scostamento.','Attiva chi ha poteri o competenze ulteriori.')
          else jsonb_build_array('Rendi esplicito lo scostamento e il rischio residuo.','Rimuovi ostacoli di risorse, responsabilità o coordinamento.','Escala al datore di lavoro quando la decisione supera i poteri disponibili.') end,
        'stop_conditions',coalesce(content->'operational'->'stop_conditions',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Pericolo grave o immediato.','Misura o barriera essenziale assente o inefficace.','Cambiamento non valutato che rende il rischio non controllato.')
          else jsonb_build_array('Rischio grave senza misura praticabile.','Responsabilità o risorse essenziali non disponibili.','Evidenza di inefficacia ignorata o cambiamento significativo non governato.') end),
        'who_to_involve',case when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('Dirigente','Datore di lavoro','RSPP/SPP','RLS quando pertinente')
          else jsonb_build_array('Datore di lavoro','RSPP/SPP','Responsabili di processo','Preposti','RLS quando pertinente') end,
        'remember',coalesce(content->>'takeaway',content->>'summary'),
        'adaptation','Adattare esempi, procedure e soggetti coinvolti al DVR, all’organizzazione e alle deleghe effettive dell’ente.'
      ),
      'quiz',case when content ? 'quiz' and jsonb_typeof(content->'quiz')='object'
        then content->'quiz'||jsonb_build_object('formative_only',true,'test_builder_excluded',true)
        else content->'quiz' end,
      'quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object(
        'teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,
        'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true
      ),
      'source_keys',case
        when stable_key in ('preposto:vigilanza-operativa','preposto:comunicazione-feedback','preposto:scenari-decisionali','update:preposto:vigilance','update:preposto:communication')
          then jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025','comune-milano-materiale-didattico','inail-condivido-near-miss')
        when stable_key like 'preposto:%' or stable_key like 'update:preposto:%'
          then jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025','comune-milano-materiale-didattico')
        when stable_key in ('dirigente:sistema-istituzionale-231-tutele','dirigente:comunicazione-formazione-consultazione','update:dirigente:leadership')
          then jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025','inail-violence-work-2025','inail-stress-methodology-2025')
        else jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025') end,
      'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','reuse_policy','reference_and_original_rewrite','normative_validation','D.Lgs. 81/2008 vigente + Accordo Stato-Regioni 17/04/2025'),
      'source_integration_note','Le modalità di erogazione restano regole di delivery e non impoveriscono il materiale. Domande e quiz interni sono formativi e restano esclusi dal Test Builder.',
      'final_assessment',false
    ) new_content
  from target
), final_content as (
  select e.learning_unit_id,e.target_version,
    e.new_content||jsonb_build_object('evidence_sources',coalesce((
      select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key)
      from jsonb_array_elements_text(e.new_content->'source_keys') sk(source_key)
      join public.training_sources ts on ts.source_key=sk.source_key
    ),'[]'::jsonb)) new_content
  from enriched e
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',new_content,md5(new_content::text),null
from final_content;

with target as (
  select lu.id learning_unit_id,lu.stable_key,
    case
      when lu.stable_key in ('preposto:vigilanza-operativa','preposto:comunicazione-feedback','preposto:scenari-decisionali','update:preposto:vigilance','update:preposto:communication')
        then jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025','comune-milano-materiale-didattico','inail-condivido-near-miss')
      when lu.stable_key like 'preposto:%' or lu.stable_key like 'update:preposto:%'
        then jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025','comune-milano-materiale-didattico')
      when lu.stable_key in ('dirigente:sistema-istituzionale-231-tutele','dirigente:comunicazione-formazione-consultazione','update:dirigente:leadership')
        then jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025','inail-violence-work-2025','inail-stress-methodology-2025')
      else jsonb_build_array('normattiva-dlgs81-vigente','mlps-asr-2025','piemonte-indicazioni-formazione-2025') end source_keys
  from public.learning_units lu
  where lu.stable_key in (
    'preposto:ruolo-obblighi-relazioni','preposto:rapporti-cooperazione','preposto:vigilanza-operativa','preposto:interruzione-segnalazione','preposto:valutazione-situazioni-rischio','preposto:controllo-misure-esecuzione','preposto:comunicazione-feedback','preposto:scenari-decisionali',
    'dirigente:ruolo-responsabilita-delega','dirigente:sistema-istituzionale-231-tutele','dirigente:processi-mog-sgsl','dirigente:dvr-misure-risorse','dirigente:appalti-interferenze','dirigente:emergenze-organizzazione','dirigente:comunicazione-formazione-consultazione','dirigente:scenario-manageriale',
    'update:preposto:role','update:preposto:vigilance','update:preposto:stop','update:preposto:communication','update:dirigente:governance','update:dirigente:risk','update:dirigente:contractors','update:dirigente:leadership'
  )
)
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select t.learning_unit_id,sk.source_key,'authored_evidence_v3','Fonte usata per validazione normativa, approfondimento o benchmark nella versione authored-v3 di Preposto/Dirigente.',date '2026-10-16',jsonb_build_object('didactic_version','role-authored-v3','reuse_policy','reference_and_original_rewrite')
from target t
cross join lateral jsonb_array_elements_text(t.source_keys) sk(source_key)
join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
