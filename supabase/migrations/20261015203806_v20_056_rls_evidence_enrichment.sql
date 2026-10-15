-- SafetyTraining v20.056
-- RLS evidence-based enrichment: DVR, consultazione, near miss e comunicazione.
-- Creates draft LU v2 while preserving published legacy versions.

insert into public.training_sources(source_key,authority,title,source_type,canonical_url,publication_date,checked_on,license_kind,reuse_policy,normative_status,topics,notes,metadata)
values(
  'normattiva-dlgs81-vigente','Normattiva','D.Lgs. 9 aprile 2008, n. 81 - testo vigente','normative_source',
  'https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED',null,date '2026-10-15',
  'official_public_source','quote_minimally_and_reference','primary',
  array['D.Lgs. 81/2008','RLS','DVR','consultazione','riunione periodica','valutazione rischi'],
  'Fonte normativa primaria consolidata; verificata su Normattiva con aggiornamenti pubblicati fino al 23/03/2026.',
  jsonb_build_object('priority','primary_normative')
)
on conflict (source_key) do update set
 authority=excluded.authority,title=excluded.title,source_type=excluded.source_type,canonical_url=excluded.canonical_url,
 checked_on=excluded.checked_on,license_kind=excluded.license_kind,reuse_policy=excluded.reuse_policy,
 normative_status=excluded.normative_status,topics=excluded.topics,notes=excluded.notes,metadata=excluded.metadata,updated_at=now();

with base as (
  select lu.id learning_unit_id, lu.stable_key, v.content
  from public.learning_units lu
  join lateral (
    select content from public.learning_unit_versions luv
    where luv.learning_unit_id=lu.id and luv.status='published'
    order by version_number desc limit 1
  ) v on true
  where lu.stable_key in ('rls:dvr-rls','rls:consultazione-rls','rls:infortuni-rls','rls:comunicazione-rls')
), enriched as (
  select learning_unit_id,stable_key,
    content || jsonb_build_object(
      'didactic_version','rls-v2',
      'quality',coalesce(content->'quality','{}'::jsonb) || jsonb_build_object('teacher_ready',true,'learner_ready',true,'scenario_based',true),
      'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-15','reuse_policy','reference_and_original_rewrite','normative_validation','Normattiva D.Lgs. 81/2008 vigente'),
      'evidence_sources',jsonb_build_array(
        jsonb_build_object('authority','Normattiva','title','D.Lgs. 81/2008 - testo vigente','url','https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED','use','normative_validation','checked_on','2026-10-15'),
        jsonb_build_object('authority','Comune di Milano','title','Corso RLS 32 ore - materiali didattici','url','https://sslcommil.comune.milano.it/formazione/materiale-didattico','use','didactic_benchmark','checked_on','2026-10-15'),
        jsonb_build_object('authority','Regione Emilia-Romagna','title','Materiali didattici per la formazione delle figure della prevenzione','url','https://salute.regione.emilia-romagna.it/sicurezza-nei-luoghi-di-lavoro/formazione/materiali-didattici','use','method_and_structure_reference','checked_on','2026-10-15')
      ) || case when stable_key='rls:infortuni-rls' then jsonb_build_array(
        jsonb_build_object('authority','INAIL','title','Condivido - sviluppo delle conoscenze sui near miss','url','https://www.inail.it/portale/it/inail-comunica/pubblicazioni/catalogo-generale/catalogo-generale-dettaglio.2025.04.condivido-approccio-integrato-in-reti-collaborative-sviluppo-conoscenze-near-miss.html','use','near_miss_method_reference','checked_on','2026-10-15')
      ) else '[]'::jsonb end,
      'source_integration_note','Materiali esterni usati come riferimento metodologico/benchmark. Testi, scenari, schemi e attività restano originali SafetyTraining; il dato normativo è validato su Normattiva.'
    ) || case stable_key
      when 'rls:dvr-rls' then jsonb_build_object(
        'dvr_reading_lab',jsonb_build_object(
          'title','Dal DVR al lavoro reale: verifica a campione',
          'input','Estratto anonimizzato di DVR con una misura dichiarata, un responsabile e una scadenza.',
          'matrix',jsonb_build_array('attività/mansione','pericolo','persone esposte','misure già presenti','misura programmata','responsabile','scadenza','evidenza di attuazione','scostamento osservato','osservazione RLS'),
          'task',jsonb_build_array('Individuare il rischio descritto.','Verificare se il documento identifica esposti e misure.','Confrontare almeno una misura con lo scenario reale o simulato.','Distinguere misura presente, misura solo prevista e misura inefficace.','Formulare una osservazione RLS documentata e verificabile.'),
          'teacher_debrief','Il punteggio di rischio non chiude l’analisi: l’RLS collega documento, misure, programma e condizioni reali.'
        ),
        'normative_focus',jsonb_build_object('art_29','La valutazione è effettuata previa consultazione dell’RLS; in caso di rielaborazione le misure aggiornate devono essere rese immediatamente evidenti e comunicate all’RLS.','art_50','L’RLS accede alle informazioni e alla documentazione aziendale inerente la valutazione dei rischi secondo le modalità previste dalla legge.')
      )
      when 'rls:consultazione-rls' then jsonb_build_object(
        'consultation_lab',jsonb_build_object(
          'title','Preparare una consultazione che produca decisioni',
          'question_pack',jsonb_build_array('Qual è il fatto o cambiamento da esaminare?','Quali lavoratori/processi sono coinvolti?','Quali dati o documenti servono prima di esprimere un’osservazione?','Quale misura è già prevista?','Quale criticità resta aperta?','Quale proposta concreta formula l’RLS?','Chi deve rispondere o agire?','Entro quando?','Quale evidenza chiude il punto?'),
          'output_required','Scheda di consultazione con tema, evidenze, osservazione/proposta, responsabile del follow-up, scadenza ed esito.',
          'meeting_simulation','Simulare 15 minuti di riunione periodica con tre priorità: una urgente, una programmabile, una non supportata da dati sufficienti.'
        )
      )
      when 'rls:infortuni-rls' then jsonb_build_object(
        'near_miss_lab',jsonb_build_object(
          'title','Dall’evento sentinella al piano di miglioramento',
          'sequence',jsonb_build_array('separa fatti e ipotesi','ricostruisci la sequenza dell’evento','individua pericoli ed esposizioni','elenca barriere previste','identifica barriere assenti/inefficaci/bypassate','cerca fattori tecnici, organizzativi, procedurali e formativi','proponi azioni secondo gerarchia delle misure','assegna responsabile e scadenza','definisci verifica di efficacia'),
          'anti_blame_rule','La domanda guida non è “chi ha sbagliato?”, ma “quali condizioni e barriere hanno permesso che l’evento fosse possibile?”.',
          'output_required','Scheda causa-barriera con almeno una misura immediata e una misura sistemica, più criterio di verifica.'
        ),
        'event_to_dvr_link','Se l’evento evidenzia un rischio non adeguatamente valutato o se ricorrono le condizioni dell’art. 29, il caso deve alimentare la verifica/rielaborazione della valutazione e delle misure, non restare isolato.'
      )
      when 'rls:comunicazione-rls' then jsonb_build_object(
        'reporting_lab',jsonb_build_object(
          'title','Da “qui è pericoloso” a una segnalazione verificabile',
          'template',jsonb_build_array('fatto osservato','luogo/fase/ora o frequenza','persone esposte','rischio o conseguenza plausibile','misura presente o mancante','eventuale misura temporanea già adottata','documento/procedura collegata','richiesta di verifica o intervento','destinatario competente','follow-up previsto'),
          'exercise','Trasformare tre lamentele generiche in segnalazioni neutrali, verificabili e indirizzate al soggetto competente.',
          'feedback_rule','Dare riscontro anche quando la richiesta non viene accolta: indicare cosa è stato verificato, quale decisione è stata presa e quale passo successivo resta possibile.'
        ),
        'urgency_gate',jsonb_build_object('immediate','Pericolo grave/immediato: prima la messa in sicurezza e l’attivazione del soggetto competente, poi la tracciatura.','non_immediate','Raccogliere elementi sufficienti, classificare priorità, inoltrare e verificare il seguito.')
      )
    end as new_content
  from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update
set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione normativa vigente per valutazione rischi, consultazione, partecipazione e attribuzioni RLS.',date '2026-10-15','{}'::jsonb
from public.learning_units lu where lu.stable_key in ('rls:dvr-rls','rls:consultazione-rls','rls:infortuni-rls','rls:comunicazione-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'comune-milano-materiale-didattico','didactic_benchmark','Benchmark RLS per struttura, esercitazioni e collegamento tra valutazione rischi e partecipazione; nessuna copia diretta.',date '2026-10-15',jsonb_build_object('reuse_policy','reference_and_original_rewrite')
from public.learning_units lu where lu.stable_key in ('rls:dvr-rls','rls:consultazione-rls','rls:infortuni-rls','rls:comunicazione-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'rer-formazione-figure-prevenzione','method_reference','Riferimento metodologico per valutazione rischi, consultazione/partecipazione e costruzione di attività didattiche originali.',date '2026-10-15',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable')
from public.learning_units lu where lu.stable_key in ('rls:dvr-rls','rls:consultazione-rls','rls:infortuni-rls','rls:comunicazione-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-condivido-near-miss','near_miss_method_reference','Metodo evidence-based per usare near miss ed eventi sentinella come ingresso al miglioramento preventivo.',date '2026-10-15','{}'::jsonb
from public.learning_units lu where lu.stable_key='rls:infortuni-rls'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
