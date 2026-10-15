-- SafetyTraining v20.057
-- RLS enrichment batch 2: role boundaries, normative roles, interferences and inspection follow-up.
-- Draft LU v2 only; published legacy versions remain unchanged.

with base as (
  select lu.id learning_unit_id,lu.stable_key,v.content
  from public.learning_units lu
  join lateral (select content from public.learning_unit_versions luv where luv.learning_unit_id=lu.id and luv.status='published' order by version_number desc limit 1) v on true
  where lu.stable_key in ('rls:ruolo-rls','rls:normativa-rls','rls:appalti-rls','rls:organi-vigilanza-rls')
), enriched as (
 select learning_unit_id,stable_key,
   content || jsonb_build_object(
     'didactic_version','rls-v2',
     'quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'scenario_based',true),
     'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-15','normative_validation','Normattiva D.Lgs. 81/2008 vigente','reuse_policy','reference_and_original_rewrite'),
     'evidence_sources',jsonb_build_array(
       jsonb_build_object('authority','Normattiva','title','D.Lgs. 81/2008 - testo vigente','url','https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED','use','normative_validation','checked_on','2026-10-15'),
       jsonb_build_object('authority','INAIL','title','Corso per il rappresentante dei lavoratori per la sicurezza','url','https://www.inail.it/portale/formazione/it/corsi-inail/catalogo-corsi/dettaglio-corso.2024.01.corso-per-il-rappresentante-dei-lavoratori-per-la-sicurezza.html','use','didactic_structure_reference','checked_on','2026-10-15'),
       jsonb_build_object('authority','Regione Emilia-Romagna','title','Materiali didattici per la formazione delle figure della prevenzione','url','https://salute.regione.emilia-romagna.it/sicurezza-nei-luoghi-di-lavoro/formazione/materiali-didattici','use','method_and_structure_reference','checked_on','2026-10-15')
     )
   ) || case stable_key
    when 'rls:ruolo-rls' then jsonb_build_object(
      'role_boundary_lab',jsonb_build_object(
        'title','Può farlo l’RLS? Confini, interlocutori e follow-up',
        'columns',jsonb_build_array('situazione','azione che l’RLS può svolgere','azione che non compete all’RLS','soggetto competente','evidenza da richiedere','follow-up'),
        'scenarios',jsonb_build_array('DPI ritenuto inadeguato da più lavoratori','macchina con protezione rimossa','sospetta problematica sanitaria individuale','modifica di reparto non ancora discussa','misura del DVR dichiarata ma non attuata'),
        'principle','L’RLS rappresenta, consulta, accede alle informazioni, formula osservazioni e proposte e segue gli esiti; non assume poteri gestionali o tecnici che la legge attribuisce ad altri soggetti.'
      )
    )
    when 'rls:normativa-rls' then jsonb_build_object(
      'who_does_what_lab',jsonb_build_object(
        'title','Chi decide, chi valuta, chi vigila, chi rappresenta',
        'actors',jsonb_build_array('datore di lavoro','dirigente','preposto','RSPP/ASPP','medico competente','lavoratore','RLS','organi di vigilanza'),
        'task','Per sei situazioni assegnare responsabilità/attribuzioni al soggetto corretto e indicare il canale con cui l’RLS interagisce.',
        'anti_confusion',jsonb_build_array('RLS ≠ RSPP','consultazione ≠ autorizzazione','proposta ≠ decisione gestionale','accesso alle informazioni ≠ responsabilità della valutazione')
      ),
      'norm_to_action_method',jsonb_build_array('individua l’obbligo o attribuzione','identifica il soggetto titolare','definisci quale informazione serve all’RLS','scegli il canale di consultazione/segnalazione','verifica l’esito')
    )
    when 'rls:appalti-rls' then jsonb_build_object(
      'interference_mapping_lab',jsonb_build_object(
        'title','Mappa delle interferenze: cosa cambia perché arriva un’altra organizzazione?',
        'map_fields',jsonb_build_array('attività committente','attività appaltatore','stessa area/tempo?','energia/mezzi/sostanze coinvolti','chi può essere esposto','interferenza concreta','misura di eliminazione/separazione','coordinamento necessario','documento/procedura collegata','verifica sul campo'),
        'scenario','Manutenzione impiantistica in edificio aperto: tecnici esterni, dipendenti, utenti, scale/attrezzature, sezionamento elettrico e percorsi condivisi.',
        'teacher_debrief','Il DUVRI, quando previsto, non sostituisce cooperazione e coordinamento reali: l’RLS deve saper leggere la coerenza fra documento e condizioni effettive.'
      ),
      'change_trigger','Se cambiano attività, tempi, aree, mezzi o soggetti, la mappa delle interferenze va riesaminata: non si trasferisce automaticamente lo schema precedente.'
    )
    when 'rls:organi-vigilanza-rls' then jsonb_build_object(
      'inspection_followup_lab',jsonb_build_object(
        'title','Dal verbale alla chiusura verificata',
        'register_fields',jsonb_build_array('ente/competenza','data e oggetto controllo','rilievo/prescrizione','rischio collegato','azione richiesta','responsabile aziendale','scadenza','evidenza di attuazione','verifica sul campo','stato aperto/chiuso'),
        'exercise','Analizzare un verbale simulato con tre rilievi e costruire un follow-up RLS senza sostituirsi al soggetto obbligato.',
        'rules',jsonb_build_array('conservare fatti e documenti senza alterazioni','distinguere prescrizione, raccomandazione e azione interna','seguire l’attuazione e non solo la scadenza formale','verificare se la misura risolve realmente il rischio')
      ),
      'authority_interaction','L’RLS può fornire osservazioni e informazioni nell’ambito delle proprie attribuzioni e può ricorrere alle autorità competenti nei casi previsti dall’art. 50; la vigilanza esterna non sostituisce la prevenzione aziendale.'
    ) end as new_content
 from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione vigente delle attribuzioni RLS, dei ruoli prevenzionistici, degli appalti/interferenze e del sistema di vigilanza.',date '2026-10-15','{}'::jsonb
from public.learning_units lu where lu.stable_key in ('rls:ruolo-rls','rls:normativa-rls','rls:appalti-rls','rls:organi-vigilanza-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'rer-formazione-figure-prevenzione','method_reference','Riferimento metodologico per soggetti della prevenzione, sistema istituzionale e consultazione/partecipazione.',date '2026-10-15',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable')
from public.learning_units lu where lu.stable_key in ('rls:ruolo-rls','rls:normativa-rls','rls:appalti-rls','rls:organi-vigilanza-rls')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
