-- SafetyTraining v20.066
-- Worker-specific shared core enrichment for units reused by low/medium/high worker courses.
-- Creates draft v2; current course compositions remain on published v1.

with base as (
  select lu.id learning_unit_id,lu.stable_key,v.content
  from public.learning_units lu
  join lateral (
    select content from public.learning_unit_versions luv
    where luv.learning_unit_id=lu.id and luv.status='published'
    order by version_number desc limit 1
  ) v on true
  where lu.stable_key in ('backoffice:archivi','backoffice:elettrico-back','backoffice:mmc-back','frontoffice:spazi-front','frontoffice:stress-front','frontoffice:vdt-front')
), enriched as (
 select learning_unit_id,stable_key,
  content || jsonb_build_object(
    'didactic_version','worker-specific-evidence-v2',
    'quality',coalesce(content->'quality','{}'::jsonb)||jsonb_build_object('teacher_ready',true,'learner_ready',true,'scenario_based',true,'transfer_to_work',true),
    'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-15','normative_validation','D.Lgs. 81/2008 vigente + ASR 17/04/2025','reuse_policy','reference_and_original_rewrite'),
    'evidence_sources',jsonb_build_array(
      jsonb_build_object('authority','Normattiva','title','D.Lgs. 81/2008 - testo vigente','url','https://www.normattiva.it/eli/id/2008/04/30/008G0104/CONSOLIDATED','use','normative_validation','checked_on','2026-10-15'),
      jsonb_build_object('authority','Regione Emilia-Romagna','title','Materiali didattici per la formazione delle figure della prevenzione','url','https://salute.regione.emilia-romagna.it/sicurezza-nei-luoghi-di-lavoro/formazione/materiali-didattici','use','method_and_structure_reference','checked_on','2026-10-15')
    ) || case when stable_key='frontoffice:stress-front' then jsonb_build_array(
      jsonb_build_object('authority','INAIL','title','Metodologia per la valutazione e gestione del rischio stress lavoro-correlato - aggiornamenti 2025','url','https://www.inail.it/portale/ricerca-e-tecnologia/it/ambiti-di-ricerca/area-salute-sul-lavoro/rischi-psicosociali-e-tutela-dei-lavoratori-vulnerabili/rischio-stress-lavoro-correlato.html?all=true','use','psychosocial_method_reference','checked_on','2026-10-15'),
      jsonb_build_object('authority','INAIL','title','Molestie e violenze sul lavoro - analisi e prevenzione','url','https://www.inail.it/portale/it/inail-comunica/news/notizia.2025.03.molestie-e-violenze-sul-lavoro-analisi-di-un-fenomeno-in-crescita.html','use','violence_prevention_reference','checked_on','2026-10-15')
    ) else '[]'::jsonb end,
    'source_integration_note','La LU mantiene contenuto e casi SafetyTraining originali; le fonti sono usate per validazione, metodo e criteri di osservazione, senza copia diretta.'
  ) || case stable_key
   when 'backoffice:archivi' then jsonb_build_object(
    'storage_safety_lab',jsonb_build_object(
      'title','Archivio sicuro: non basta che tutto “stia dentro”',
      'inspection_fields',jsonb_build_array('stabilità scaffalatura','carico e distribuzione','materiali sporgenti','accessi e corridoi','uso improprio di sedie/scatole come rialzo','oggetti pesanti in quota','uscite/presidi ostruiti','urti o deformazioni','ordine e prelievo frequente'),
      'scenario','Scaffale alto con faldoni pesanti in sommità, corridoio ristretto e scatola usata come gradino: individuare cosa va fermato subito, cosa va riorganizzato e quale attrezzatura/accesso serve.',
      'task','Produrre una mini-checklist GO/NO-GO per prelievo e stoccaggio e indicare una misura tecnica/organizzativa più efficace del semplice richiamo “stare attenti”.'
    ),
    'near_miss_trigger','Caduta di oggetto senza danno, urto a scaffale o instabilità percepita sono segnali da segnalare e verificare prima di continuare l’uso.'
   )
   when 'backoffice:elettrico-back' then jsonb_build_object(
    'electrical_safe_use_lab',jsonb_build_object(
      'title','Uso sicuro ≠ riparazione improvvisata',
      'red_flags',jsonb_build_array('cavo o spina danneggiati','presa/adattatore surriscaldato','ciabatte sovraccariche o collegate in cascata','liquidi vicino a parti elettriche','scintille/odore anomalo','protezione o involucro mancante','attrezzatura bagnata o caduta','quadro/presa non accessibile o manomessa'),
      'action_pattern',jsonb_build_array('interrompi l’uso se la condizione è anomala','non aprire/riparare se non sei autorizzato e competente','segnala e identifica l’attrezzatura non utilizzabile secondo procedura','attiva manutenzione/persona competente','riprendi solo dopo ripristino/verifica'),
      'scenario','Multipresa calda con alimentatori in cascata sotto una postazione: il corsista deve decidere cosa disalimentare/segnalare senza intervenire sull’impianto.'
    ),
    'boundary_rule','La formazione del lavoratore insegna riconoscimento e comportamento sicuro; interventi elettrici e riparazioni restano ai soggetti competenti secondo organizzazione e normativa applicabile.'
   )
   when 'backoffice:mmc-back' then jsonb_build_object(
    'manual_handling_task_lab',jsonb_build_object(
      'title','Non esiste solo “solleva con la schiena dritta”: valuta il compito',
      'factors',jsonb_build_array('peso/ingombro e presa','altezza di origine/destinazione','distanza dal corpo','torsioni e spazi','frequenza/durata','distanza di trasporto','pavimento/ostacoli','carrello o altro ausilio disponibile','necessità di lavoro in due','ritmo e urgenza'),
      'scenario','Trasferimento ripetuto di faldoni da ripiano basso a carrello in corridoio stretto: scegliere come ridurre il compito prima di concentrarsi sulla sola tecnica individuale.',
      'task','Proporre nell’ordine: eliminazione/riduzione della movimentazione, ausilio o riprogettazione, organizzazione del lavoro, tecnica/addestramento pertinente e criterio di stop.'
    ),
    'stop_conditions',jsonb_build_array('carico non gestibile in sicurezza','percorso ostruito o instabile','presa insufficiente','necessità di raggiungere/torcere in modo marcato','ausilio necessario non disponibile o non utilizzabile')
   )
   when 'frontoffice:spazi-front' then jsonb_build_object(
    'space_egress_lab',jsonb_build_object(
      'title','Lo spazio cambia durante la giornata: resta sicuro?',
      'map_fields',jsonb_build_array('accesso/uscita','percorso pedonale','zona attesa/pubblico','porte e aperture','materiali temporanei','cavi/oggetti a pavimento','presidi emergenza','visibilità/segnaletica','persone con esigenze specifiche'),
      'scenario','Consegna temporanea occupa parte del corridoio e modifica il percorso verso l’uscita: il corsista deve capire se basta “passarci piano” o serve rimuovere/segregare/riprogettare prima di proseguire.',
      'task','Individuare tre condizioni che rendono un’area temporaneamente non accettabile e definire chi avvisare e quale evidenza consente la riapertura.'
    ),
    'temporary_change_rule','Una configurazione sicura al mattino può diventare non sicura dopo consegne, lavori, eventi o affollamento: le modifiche temporanee vanno gestite come condizioni reali, non come eccezioni trascurabili.'
   )
   when 'frontoffice:stress-front' then jsonb_build_object(
    'frontoffice_psychosocial_lab',jsonb_build_object(
      'title','Dalla giornata difficile al fattore organizzativo',
      'signals',jsonb_build_array('picchi di affluenza senza rinforzo','conflitti frequenti con utenti','ruoli/limiti decisionali poco chiari','interruzioni continue','assenza di supporto dopo aggressioni o minacce','obiettivi incompatibili con tempi disponibili','pause/recupero insufficienti','segnalazioni ripetute senza risposta'),
      'scenario','Operatore front-office subisce insulti ripetuti durante picchi di affluenza; il problema viene trattato come “saper gestire il cliente”. Il gruppo deve separare competenza individuale da fattori di organizzazione e protezione.',
      'task','Proporre almeno una misura primaria organizzativa, una misura di supporto/procedura per eventi critici e un indicatore per verificare se la situazione migliora.'
    ),
    'violence_escalation_pattern',jsonb_build_array('riconosci minaccia/aggressione','mantieni distanza e usa i canali/procedure previsti','attiva supporto/sicurezza/soccorsi se necessario','non gestire da solo una situazione oltre le proprie competenze','registra/segnala l’evento secondo procedura','contribuisci al riesame delle misure')
   )
   when 'frontoffice:vdt-front' then jsonb_build_object(
    'workstation_adjustment_lab',jsonb_build_object(
      'title','Adatta la postazione al compito e alla persona',
      'check',jsonb_build_array('sedia e appoggio','altezza/posizione schermo','distanza di lettura','tastiera/mouse e spazio per avambracci','riflessi/abbagliamento','documenti/telefono/accessori più usati','spazio gambe','rumore/interruzioni','alternanza attività e pause previste','segnalazione di discomfort o difetti'),
      'scenario','Postazione condivisa da due lavoratori di stature diverse: il corsista deve fare un set-up rapido, spiegare cosa regolare e distinguere aggiustamenti individuali da difetti della postazione da segnalare.',
      'task','Eseguire una checklist su postazione reale/simulata e produrre tre miglioramenti: uno di regolazione, uno di organizzazione del lavoro, uno strutturale se necessario.'
    ),
    'ergonomy_rule','L’obiettivo non è mantenere una postura “perfetta” immobile, ma ridurre vincoli, favorire regolazione e variazione, organizzare il compito e segnalare condizioni che non possono essere corrette dall’utilizzatore.'
   ) end as new_content
 from base
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,2,'draft',new_content,md5(new_content::text),null from enriched
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'normattiva-dlgs81-vigente','normative_validation','Validazione vigente per luoghi di lavoro, attrezzature, elettrico, movimentazione, VDT e obblighi/comportamenti dei lavoratori.',date '2026-10-15','{}'::jsonb from public.learning_units lu where lu.stable_key in ('backoffice:archivi','backoffice:elettrico-back','backoffice:mmc-back','frontoffice:spazi-front','frontoffice:stress-front','frontoffice:vdt-front')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'rer-formazione-figure-prevenzione','method_reference','Riferimento metodologico per rischio, misure, DPI, ambienti, emergenze e valutazione operativa; adattamento originale SafetyTraining.',date '2026-10-15',jsonb_build_object('reuse_policy','adapt_with_attribution_where_applicable') from public.learning_units lu where lu.stable_key in ('backoffice:archivi','backoffice:elettrico-back','backoffice:mmc-back','frontoffice:spazi-front','frontoffice:stress-front','frontoffice:vdt-front')
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-stress-methodology-2025','psychosocial_method_reference','Metodo INAIL partecipativo per riconoscere e gestire fattori organizzativi dello stress lavoro-correlato.',date '2026-10-15','{}'::jsonb from public.learning_units lu where lu.stable_key='frontoffice:stress-front'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select lu.id,'inail-violence-work-2025','violence_prevention_reference','Evidenze INAIL per prevenzione di molestie, minacce e aggressioni nei contesti front-office e a contatto con il pubblico.',date '2026-10-15','{}'::jsonb from public.learning_units lu where lu.stable_key='frontoffice:stress-front'
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;
