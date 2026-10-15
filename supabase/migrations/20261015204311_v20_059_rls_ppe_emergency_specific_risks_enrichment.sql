-- SafetyTraining v20.059
-- RLS enrichment batch 4: PPE, emergency drills and specific-risk profiling.
-- Draft LU v2 only; published legacy versions remain unchanged.

with base as (
 select lu.id learning_unit_id,lu.stable_key,v.content
 from public.learning_units lu
 join lateral (select content from public.learning_unit_versions luv where luv.learning_unit_id=lu.id and luv.status='published' order by version_number desc limit 1) v on true
 where lu.stable_key in ('rls:dpi-rls','rls:emergenze-rls','rls:rischi-specifici-rls')
), enriched as (
 select learning_unit_id,stable_key,
  content || jsonb_build_object(
   'didactic_version','rls-v2',
   'quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'scenario_based',true),
   'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-15','normative_validation','Normattiva D.Lgs. 81/2008 vigente','reuse_policy','reference_and_original_rewrite')
  ) || case stable_key
   when 'rls:dpi-rls' then jsonb_build_object(
    'ppe_effectiveness_lab',jsonb_build_object(
      'title','Il DPI funziona davvero nel compito reale?',
      'sequence',jsonb_build_array('definisci pericolo/esposizione','verifica se il rischio può essere eliminato o ridotto con misure collettive/tecniche/organizzative','identifica prestazioni richieste al DPI','controlla compatibilità con altri DPI e con il compito','raccogli criticità d’uso dai lavoratori','verifica formazione/addestramento ove previsto','verifica manutenzione, sostituzione e disponibilità','formula osservazione/proposta RLS'),
      'scenario','Protezione uditiva efficace sul rumore ma incompatibile con la necessità di percepire segnali/comunicazioni in una fase operativa: costruire una richiesta di rivalutazione senza scegliere autonomamente il DPI.',
      'red_flags',jsonb_build_array('DPI usato al posto di una misura collettiva tecnicamente praticabile','DPI incompatibili fra loro','taglia/ergonomia che induce mancato uso','assenza di addestramento quando necessario','manutenzione o sostituzione non definite','rischio reale diverso da quello considerato nella scelta')
    ),
    'rls_boundary','L’RLS raccoglie evidenze, verifica coerenza con DVR e uso reale e formula osservazioni/proposte; scelta, valutazione tecnica e fornitura restano ai soggetti obbligati/competenti.'
   )
   when 'rls:emergenze-rls' then jsonb_build_object(
    'emergency_drill_debrief',jsonb_build_object(
      'title','Dalla prova di emergenza al piano di miglioramento',
      'observation_grid',jsonb_build_array('allarme percepito/compreso','tempi di avvio delle azioni','vie/uscite realmente utilizzabili','comportamenti e punti di congestione','assistenza a persone con esigenze specifiche','ruoli/addetti disponibili','accesso e informazioni per soccorsi','comunicazioni','punto di raccolta/appello','anomalie tecniche/organizzative'),
      'exercise','Osservare una simulazione o un caso video/planimetrico e produrre massimo cinque criticità prioritarie con azione, responsabile, scadenza ed evidenza di chiusura.',
      'debrief_rule','La prova non è superata solo perché tutti sono usciti: deve produrre apprendimento, correzioni e verifica delle azioni.'
    ),
    'evidence_sources',jsonb_build_array(jsonb_build_object('authority','Corpo Nazionale dei Vigili del Fuoco','title','Materiale didattico per corsi antincendio','url','https://www.vigilfuoco.it/comando-vvf-napoli/formazione-le-aziende/materiale-didattico-i-corsi-di-formazione-8108','use','technical_reference','checked_on','2026-10-15'))
   )
   when 'rls:rischi-specifici-rls' then jsonb_build_object(
    'specific_risk_profile_lab',jsonb_build_object(
      'title','Costruire il profilo di rischio reale dell’ente',
      'profile_fields',jsonb_build_array('settore/reparto','attività reale','mansione/gruppo omogeneo','pericolo','come avviene l’esposizione','frequenza/durata/condizioni','persone particolarmente esposte','misure collettive/tecniche','misure organizzative/procedurali','DPI se necessari','informazione/formazione/addestramento','emergenza pertinente','evidenza dal DVR/procedura','evidenza dal campo','criticità/segnalazioni','azione di miglioramento'),
      'method','Partire da attività e lavoro reale; solo dopo associare famiglie di rischio. Vietato riempire il modulo con un elenco standard uguale per ogni azienda.',
      'exercise','Confrontare la stessa famiglia di rischio in due mansioni/reparti e dimostrare come cambiano esposizione, priorità e misure.',
      'output_required','Una scheda rischio-specifico completa e una osservazione RLS collegata a un’evidenza.'
    ),
    'teacher_rule','La quota sui rischi specifici deve usare DVR, procedure, segnalazioni e scenari dell’organizzazione, anonimizzati quando necessario, invece di rimanere su esempi generici.'
   ) end as new_content
 from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione vigente per DPI, gestione emergenze e valutazione/formazione sui rischi specifici.',date '2026-10-15','{}'::jsonb
from public.learning_units lu where lu.stable_key in ('rls:dpi-rls','rls:emergenze-rls','rls:rischi-specifici-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'rer-formazione-figure-prevenzione','method_reference','Metodo e struttura per valutazione dei rischi, gerarchia delle misure, DPI ed emergenze, con adattamento originale SafetyTraining.',date '2026-10-15',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable')
from public.learning_units lu where lu.stable_key in ('rls:dpi-rls','rls:emergenze-rls','rls:rischi-specifici-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'vvf-materiali-antincendio','technical_reference','Riferimento tecnico-didattico VVF per gestione antincendio, allarme, esodo e debrief delle esercitazioni.',date '2026-10-15','{}'::jsonb
from public.learning_units lu where lu.stable_key='rls:emergenze-rls'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
