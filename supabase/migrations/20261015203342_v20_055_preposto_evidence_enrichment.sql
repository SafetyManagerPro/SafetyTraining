-- SafetyTraining v20.055
-- Preposto evidence-based enrichment: draft LU v2 + provenance.

insert into public.training_sources(source_key,authority,title,source_type,canonical_url,publication_date,checked_on,license_kind,reuse_policy,normative_status,topics,notes,metadata)
values(
  'inail-condivido-near-miss','INAIL',
  'Condivido: un approccio integrato in reti collaborative per lo sviluppo delle conoscenze sui near miss',
  'incident_evidence',
  'https://www.inail.it/portale/it/inail-comunica/pubblicazioni/catalogo-generale/catalogo-generale-dettaglio.2025.04.condivido-approccio-integrato-in-reti-collaborative-sviluppo-conoscenze-near-miss.html',
  date '2025-04-16',date '2026-10-15','institutional_terms','facts_and_original_didactic_rewrite','supporting',
  array['near miss','mancati infortuni','analisi multifattoriale','fattori di rischio','miglioramento continuo'],
  'Fonte evidence-based per analisi di eventi sentinella e near miss; usare fatti, metodo e concetti con riscrittura didattica originale.',
  jsonb_build_object('priority','high_evidence')
)
on conflict (source_key) do update set
 authority=excluded.authority,title=excluded.title,source_type=excluded.source_type,canonical_url=excluded.canonical_url,
 publication_date=excluded.publication_date,checked_on=excluded.checked_on,license_kind=excluded.license_kind,
 reuse_policy=excluded.reuse_policy,normative_status=excluded.normative_status,topics=excluded.topics,notes=excluded.notes,
 metadata=excluded.metadata,updated_at=now();

with base as (
  select lu.id as learning_unit_id, lu.stable_key, v.content
  from public.learning_units lu
  join lateral (
    select luv.content
    from public.learning_unit_versions luv
    where luv.learning_unit_id=lu.id and luv.status='published'
    order by luv.version_number desc
    limit 1
  ) v on true
  where lu.stable_key in (
    'preposto:vigilanza-operativa',
    'preposto:interruzione-segnalazione',
    'preposto:comunicazione-feedback',
    'preposto:scenari-decisionali'
  )
), enriched as (
  select learning_unit_id, stable_key,
    content || jsonb_build_object(
      'source_audit', jsonb_build_object(
        'status','reviewed','checked_on','2026-10-15','reuse_policy','reference_and_original_rewrite',
        'notes','Materiali esterni usati come benchmark/metodo; requisiti formativi e riferimenti normativi verificati separatamente su fonti ASR 2025.'
      ),
      'evidence_sources', jsonb_build_array(
        jsonb_build_object('authority','Comune di Milano - Sistema di Gestione della Sicurezza sul Lavoro','title','Formazione preposti - materiale didattico','url','https://sslcommil.comune.milano.it/documents/296431/1666300/6.1%20Formazione%20preposti.pdf','use','didactic_benchmark','checked_on','2026-10-15'),
        jsonb_build_object('authority','Regione Piemonte','title','Indicazioni operative per la formazione alla salute e sicurezza - edizione 2025','url','https://www.regione.piemonte.it/governo/bollettino/abbonati/2025/30/attach/dgr_01413_1050_23072025.pdf','use','asr2025_compliance_crosscheck','checked_on','2026-10-15')
      ) || case when stable_key in ('preposto:vigilanza-operativa','preposto:comunicazione-feedback','preposto:scenari-decisionali') then
        jsonb_build_array(jsonb_build_object('authority','INAIL','title','Condivido - sviluppo delle conoscenze sui near miss','url','https://www.inail.it/portale/it/inail-comunica/pubblicazioni/catalogo-generale/catalogo-generale-dettaglio.2025.04.condivido-approccio-integrato-in-reti-collaborative-sviluppo-conoscenze-near-miss.html','use','near_miss_method_reference','checked_on','2026-10-15'))
      else '[]'::jsonb end,
      'source_integration_note','Contenuti e scenari SafetyTraining restano originali. Comune di Milano è usato per struttura didattica e casi; INAIL per il metodo di analisi dei near miss; la conformità formativa è verificata rispetto al quadro 2025.'
    ) || case stable_key
      when 'preposto:vigilanza-operativa' then jsonb_build_object(
        'evidence_based_lab',jsonb_build_object(
          'title','Dalla deviazione occasionale alla prassi tollerata',
          'scenario','Durante tre osservazioni successive la stessa scorciatoia viene adottata da lavoratori diversi. Nessuno ha avuto conseguenze e la squadra la considera normale.',
          'task',jsonb_build_array('Descrivere solo fatti osservabili, senza attribuire subito colpe.','Distinguere comportamento individuale, condizione tecnica e fattore organizzativo.','Individuare quale barriera prevista non sta funzionando o viene aggirata.','Stabilire intervento immediato, escalation e verifica successiva.','Definire quale evidenza dimostra che la prassi è stata realmente corretta.'),
          'teacher_questions',jsonb_build_array('Quando una deviazione smette di essere individuale e diventa un problema del sistema?','Quale segnale richiede STOP immediato?','Come verifichi che il richiamo abbia prodotto un cambiamento stabile?')
        ),
        'near_miss_method',jsonb_build_object('sequence',jsonb_build_array('raccogli i fatti','ricostruisci la dinamica','individua fattori tecnici/organizzativi/procedurali','definisci correttivi','verifica efficacia'),'principle','Un quasi incidente è un segnale preventivo: va analizzato prima che la stessa catena produca un danno.')
      )
      when 'preposto:interruzione-segnalazione' then jsonb_build_object(
        'decision_gate',jsonb_build_object(
          'continue','Solo se condizioni, misure e procedura restano quelle previste e il rischio è controllato.',
          'correct_then_continue','Deviazione correggibile immediatamente senza esporre persone durante la correzione; ripresa dopo verifica.',
          'stop','Misura essenziale assente/inefficace, pericolo grave o immediato, cambiamento non valutato, ordine produttivo incompatibile con sicurezza o deviazione reiterata non controllata.',
          'restart','Solo dopo ripristino, comunicazione ai soggetti necessari e verifica della condizione sicura.'
        ),
        'teacher_microexercise',jsonb_build_object('prompt','Presentare cinque scenari in sequenza e chiedere CONTINUA / CORREGGI / STOP con motivazione di una frase.','debrief','La risposta corretta dipende dalla condizione reale, non dall’urgenza produttiva o dall’abitudine.')
      )
      when 'preposto:comunicazione-feedback' then jsonb_build_object(
        'communication_lab',jsonb_build_object(
          'model',jsonb_build_array('fatto osservabile','rischio/conseguenza','comportamento atteso','riformulazione o dimostrazione del lavoratore','osservazione dell’esecuzione','feedback'),
          'scenario','Un lavoratore molto esperto adotta una scorciatoia insicura e influenza i colleghi più giovani. Il preposto deve correggere il comportamento senza trasformare il confronto in uno scontro personale.',
          'rules',jsonb_build_array('Criticare il comportamento o la condizione, non la persona.','Evitare formule vaghe come “stai attento”.','Chiedere una riformulazione o una dimostrazione concreta, non solo “hai capito?”.','Chiudere con un controllo osservabile sul lavoro reale.'),
          'role_play','Uno interpreta il preposto, uno il lavoratore esperto, uno osserva chiarezza, fermezza, ascolto e verifica finale.'
        )
      )
      when 'preposto:scenari-decisionali' then jsonb_build_object(
        'near_miss_debrief',jsonb_build_object(
          'sequence',jsonb_build_array('Che cosa è successo realmente?','Che cosa avrebbe potuto succedere?','Quali barriere hanno fallito, mancavano o sono state bypassate?','Quali fattori tecnici, organizzativi e comportamentali hanno contribuito?','Che cosa va fatto subito?','Che cosa va modificato nel sistema?','Come e quando verifichiamo l’efficacia?'),
          'anti_blame_rule','Il debrief parte dai fatti e dalle barriere, non dalla ricerca immediata del colpevole.',
          'output_required','Mini piano di azione con misura, responsabile, scadenza, evidenza di chiusura e criterio di verifica.'
        )
      )
    end as new_content
  from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'comune-milano-materiale-didattico','didactic_benchmark','Benchmark per vigilanza, near miss, comunicazione e role-play del preposto; nessuna copia diretta di testi o immagini.',date '2026-10-15',jsonb_build_object('reuse_policy','reference_and_original_rewrite')
from public.learning_units lu where lu.stable_key in ('preposto:vigilanza-operativa','preposto:interruzione-segnalazione','preposto:comunicazione-feedback','preposto:scenari-decisionali')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'piemonte-indicazioni-formazione-2025','compliance_crosscheck','Cross-check operativo del quadro formativo successivo all’ASR 17/04/2025.',date '2026-10-15','{}'::jsonb
from public.learning_units lu where lu.stable_key in ('preposto:vigilanza-operativa','preposto:interruzione-segnalazione','preposto:comunicazione-feedback','preposto:scenari-decisionali')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-condivido-near-miss','near_miss_method_reference','Metodo INAIL per leggere near miss ed eventi sentinella come segnali di fattori tecnici, organizzativi e procedurali.',date '2026-10-15',jsonb_build_object('source_url','https://www.inail.it/portale/it/inail-comunica/pubblicazioni/catalogo-generale/catalogo-generale-dettaglio.2025.04.condivido-approccio-integrato-in-reti-collaborative-sviluppo-conoscenze-near-miss.html')
from public.learning_units lu where lu.stable_key in ('preposto:vigilanza-operativa','preposto:comunicazione-feedback','preposto:scenari-decisionali')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
