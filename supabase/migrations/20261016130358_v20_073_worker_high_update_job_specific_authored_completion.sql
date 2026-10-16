insert into public.training_sources(source_key,authority,title,source_type,canonical_url,publication_date,checked_on,license_kind,reuse_policy,normative_status,topics,notes,metadata)
values
('inail-vdt','INAIL','Videoterminali - ergonomia, postazione e ambiente di lavoro','institutional_technical','https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/ergonomia/videoterminali.html',null,date '2026-10-16','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['videoterminali','ergonomia','postura','affaticamento visivo','carico mentale'],'Fonte INAIL per rischi e prevenzione nel lavoro al VDT; contenuti SafetyTraining riscritti in modo originale.',jsonb_build_object('priority','high_evidence')),
('inail-mmc','INAIL','Movimentazione manuale dei carichi','institutional_technical','https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/ergonomia/movimentazione-manuale-dei-carichi.html',null,date '2026-10-16','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['movimentazione manuale','sovraccarico biomeccanico','ergonomia','sollevamento','spinta traino'],'Fonte INAIL per valutazione e prevenzione del sovraccarico biomeccanico e della movimentazione manuale.',jsonb_build_object('priority','high_evidence')),
('inail-rifiuti-igiene-urbana','INAIL','Sicurezza per gli operatori della raccolta dei rifiuti e dell’igiene urbana','institutional_technical','https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-biologici/Ambienti-di-lavoro.html',null,date '2026-10-16','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['rifiuti','igiene urbana','raccolta','biologico','mezzi','taglienti'],'Pagina INAIL che raccoglie il materiale tecnico per raccolta rifiuti e igiene urbana; uso come evidence e riferimento tecnico.',jsonb_build_object('priority','high_evidence')),
('inail-vibrazioni','INAIL','Vibrazioni - rischio mano-braccio e corpo intero','institutional_technical','https://www.inail.it/portale/prevenzione-e-sicurezza/it/come-fare-per/conoscere-il-rischio/agenti-fisici/vibrazioni.html',null,date '2026-10-16','institutional_terms','facts_and_original_didactic_rewrite','supporting',array['vibrazioni','motosega','decespugliatore','tagliaerba','attrezzature'],'Fonte INAIL per esposizione a vibrazioni da utensili e macchine, inclusa manutenzione del verde.',jsonb_build_object('priority','high_evidence'))
on conflict (source_key) do update set authority=excluded.authority,title=excluded.title,source_type=excluded.source_type,canonical_url=excluded.canonical_url,publication_date=excluded.publication_date,checked_on=excluded.checked_on,license_kind=excluded.license_kind,reuse_policy=excluded.reuse_policy,normative_status=excluded.normative_status,topics=excluded.topics,notes=excluded.notes,metadata=excluded.metadata,updated_at=now();

with target_keys as (
 select distinct lu.stable_key
 from public.courses c
 join public.course_versions cv on cv.course_id=c.id
 join public.course_modules cm on cm.course_version_id=cv.id
 join public.course_module_units cmu on cmu.module_id=cm.id
 join public.learning_unit_versions linked on linked.id=cmu.unit_version_id
 join public.learning_units lu on lu.id=linked.learning_unit_id
 where c.stable_key in ('lav_alto','agg_lav','verde','ecologici','polizia','frontoffice','backoffice')
   and cv.version_number=(select max(cv2.version_number) from public.course_versions cv2 where cv2.course_id=c.id)
   and lu.stable_key not like 'generale:%'
), target as (
 select lu.id learning_unit_id,lu.stable_key,lu.title,lu.default_minutes,
        (select max(v.version_number)+1 from public.learning_unit_versions v where v.learning_unit_id=lu.id) target_version,
        (select v.content from public.learning_unit_versions v where v.learning_unit_id=lu.id order by v.version_number desc limit 1) old_content,
        case when lu.stable_key like 'update:worker:%' then 'update'
             when lu.stable_key like 'backoffice:%' then 'backoffice'
             when lu.stable_key like 'frontoffice:%' then 'frontoffice'
             when lu.stable_key like 'ecologici:%' then 'ecologici'
             when lu.stable_key like 'verde:%' then 'verde'
             when lu.stable_key like 'polizia:%' then 'polizia' end family
 from public.learning_units lu join target_keys tk on tk.stable_key=lu.stable_key
), profiled as (
 select t.*,
   case
    when stable_key='update:worker:changes' then 'Riconoscere quando cambiamenti di organizzazione, mansione, attrezzature, sostanze, tecnologie o ambiente modificano i rischi e richiedono informazione/formazione specifica aggiuntiva oltre al normale aggiornamento.'
    when stable_key='update:worker:measures' then 'Riesaminare misure tecniche, procedure, DPI e comportamenti sulla base del lavoro reale, distinguendo regola scritta, uso corretto, deviazione e condizione di STOP.'
    when stable_key='update:worker:current-risks' then 'Aggiornare la lettura dei rischi effettivamente presenti oggi: interferenze, emergenze, nuovi assetti, rischi emergenti e segnali deboli devono essere tradotti in decisioni operative.'
    when stable_key='update:worker:lessons' then 'Usare infortuni, near miss e anomalie per ricostruire cause tecniche, organizzative e comportamentali e trasformarle in misure verificabili.'
    when stable_key like 'backoffice:vdt%' or stable_key like 'frontoffice:vdt%' then 'Regolare postazione, schermo, periferiche, illuminazione, pause e organizzazione del compito per ridurre posture statiche, affaticamento visivo e carico mentale.'
    when stable_key like '%:elettrico-%' then 'Usare attrezzature e prese d’ufficio senza adattamenti improvvisati: danni, surriscaldamenti, sovraccarichi o protezioni mancanti richiedono esclusione dall’uso e segnalazione.'
    when stable_key like 'backoffice:archivi' then 'Gestire archivi e scaffalature prevenendo instabilità, sovraccarico, caduta materiali e accessi impropri alle quote superiori.'
    when stable_key like 'backoffice:scale-portatili' then 'Usare scale portatili solo quando appropriate, integre e posizionate correttamente; evitare usi improvvisati per raggiungere archivi o scaffali.'
    when stable_key like '%:mmc-%' or stable_key like 'polizia:posture-%' then 'Ridurre il sovraccarico biomeccanico agendo su peso, frequenza, distanza, presa, postura, ausili, organizzazione e recupero, non affidandosi alla sola tecnica individuale.'
    when stable_key like 'backoffice:incendio-%' or stable_key like 'ecologici:incendio-%' then 'Prevenire l’innesco e limitare il carico d’incendio, mantenendo vie di esodo, presidi e comportamenti coerenti con il piano di emergenza.'
    when stable_key like '%:emergenza-%' or stable_key like '%:emergenze-%' then 'Rendere operativa la risposta all’emergenza: allarme, comunicazione, messa in sicurezza, evacuazione/assistenza e informazioni ai soccorsi devono essere conosciute nel contesto reale.'
    when stable_key='frontoffice:utenza' or stable_key like '%:aggressioni-%' then 'Prevenire escalation e aggressioni attraverso organizzazione degli spazi, comunicazione, supporto, vie di disimpegno, sistemi di allarme e regole di non esposizione solitaria.'
    when stable_key like '%:stress-%' or stable_key='polizia:lavoro-notturno' then 'Riconoscere fattori organizzativi di stress, fatica e riduzione dell’attenzione; la prevenzione richiede carichi, turni, supporto, recupero e gestione degli eventi critici.'
    when stable_key='frontoffice:spazi-front' or stable_key='frontoffice:privacy-sicurezza-front' then 'Organizzare spazi e flussi di persone/documenti senza creare ostacoli, accessi impropri, intralci alle vie di fuga o condizioni che aumentano conflitto e rischio.'
    when stable_key='ecologici:mezzi-raccolta' or stable_key like '%:traffico-%' or stable_key='polizia:stradale' or stable_key='polizia:veicoli-servizio' or stable_key='verde:lavoro-strada-verde' then 'Gestire il rischio di investimento e interferenza con veicoli tramite posizionamento, visibilità, comunicazione, sequenze di lavoro e aree sicure; questa LU non sostituisce la formazione specialistica sulla segnaletica stradale quando dovuta.'
    when stable_key='ecologici:biologico' or stable_key like '%:biologico-%' then 'Limitare il contatto con materiale potenzialmente contaminato attraverso igiene, DPI appropriati, modalità di raccolta/manipolazione e gestione immediata di contaminazioni o esposizioni accidentali.'
    when stable_key='ecologici:taglienti' or stable_key='ecologici:vetri-ingombranti' then 'Non comprimere, frugare o afferrare alla cieca materiali a rischio: individuare taglienti e oggetti irregolari, usare attrezzature/DPI previsti e gestire punture o ferite come eventi da segnalare.'
    when stable_key='ecologici:igiene-ecologici' then 'Separare sporco e pulito, gestire correttamente guanti/indumenti, igiene delle mani e contaminazioni per evitare trasferimenti dal lavoro a veicoli, locali e abitazione.'
    when stable_key='ecologici:compattatore' then 'Operare vicino a compattatori e organi in movimento rispettando zone pericolose, interblocchi, arresti e divieto assoluto di interventi improvvisati su inceppamenti.'
    when stable_key='ecologici:rumore-ecologici' or stable_key='verde:rumore-vibrazioni-verde' or stable_key='polizia:rumore-polizia' then 'Collegare rumore e vibrazioni a sorgente, durata, distanza e modalità d’uso, applicando manutenzione, organizzazione dei tempi e DPI quando previsti.'
    when stable_key like '%:chimico-%' then 'Prima di usare o manipolare prodotti, carburanti o rifiuti sconosciuti bisogna identificarli e conoscere le misure; in caso di perdita o sostanza ignota evitare il contatto e attivare la procedura prevista.'
    when stable_key like '%:microclima-%' then 'Caldo, freddo, sole e meteo modificano il rischio: idratazione, pause, abbigliamento, ombra/riparo e rimodulazione del lavoro vanno adattati alle condizioni reali.'
    when stable_key='verde:decespugliatore' then 'Prima dell’uso verificare integrità, utensile, protezioni e area di lavoro; mantenere distanza da terzi e interrompere l’attività per anomalie, proiezioni non controllabili o accesso di persone nell’area.'
    when stable_key='verde:motosega' then 'La motosega richiede addestramento e organizzazione specifica: controllo macchina, area, postura, vie di fuga, DPI e distanza da terzi devono essere definiti prima del taglio.'
    when stable_key='verde:tosaerba' then 'Per tosaerba e macchine da taglio verificare protezioni, organi di taglio, terreno e presenza di persone/oggetti; pulizia o disinceppamento avvengono solo a macchina arrestata e resa sicura.'
    when stable_key='verde:potatura-alto' then 'La LU introduce il rischio di caduta e la necessità di pianificare accesso e protezioni; non sostituisce formazione/addestramento specifici per lavori in quota, PLE o sistemi a fune quando applicabili.'
    when stable_key='verde:emergenze-verde' then 'Nel verde pubblico le emergenze possono avvenire in aree isolate o aperte al pubblico: localizzazione, comunicazioni, arresto attrezzature e accesso dei soccorsi devono essere pianificati.'
    when stable_key='polizia:dpi-polizia' then 'Selezionare e usare le dotazioni operative in base allo scenario e al rischio previsto, controllando integrità, compatibilità e limiti del DPI senza considerarlo sostitutivo delle misure organizzative.'
    else 'Collegare il rischio alla mansione reale, alle condizioni di esposizione, alle misure applicabili e ai segnali che richiedono STOP, segnalazione o supporto.' end focus,
   case
    when family='backoffice' then 'In un ufficio con picco di lavoro e archivio saturo emerge una criticità collegata a “'||title||'”. Il gruppo decide cosa correggere subito, cosa segnalare e quale condizione impedisce di proseguire.'
    when family='frontoffice' then 'Durante una giornata con forte afflusso di pubblico si verifica una criticità relativa a “'||title||'”. Individuare misura preventiva, risposta durante l’evento, via di disimpegno e soggetto da coinvolgere.'
    when family='ecologici' then 'Durante il servizio di raccolta/igiene urbana cambia una condizione relativa a “'||title||'”. Stabilire area sicura, comportamento immediato, STOP, segnalazione e ripresa solo dopo ripristino delle condizioni.'
    when family='verde' then 'Una squadra di manutenzione del verde deve svolgere un’attività relativa a “'||title||'” in area aperta al pubblico. Definire controlli preliminari, delimitazione, DPI/misure, STOP e gestione dell’anomalia.'
    when family='polizia' then 'Durante un servizio operativo si presenta una situazione relativa a “'||title||'”. Separare controllo immediato del rischio, richiesta di supporto, tutela dell’operatore e ripresa dell’attività.'
    else 'Nel quinquennio sono cambiate attività, tecnologie o procedure. Usare il tema “'||title||'” per individuare cosa non è più adeguato, quale misura aggiornare e come verificarne l’efficacia.' end case_text,
   case
    when family='update' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','piemonte-indicazioni-formazione-2025','inail-condivido-near-miss')
    when stable_key like '%vdt%' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','inail-vdt')
    when stable_key like '%mmc%' or stable_key like 'polizia:posture-%' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','inail-mmc')
    when stable_key like '%stress%' or stable_key like '%aggressioni%' or stable_key='frontoffice:utenza' or stable_key='polizia:lavoro-notturno' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','inail-violence-work-2025','inail-stress-methodology-2025')
    when family='ecologici' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','inail-rifiuti-igiene-urbana') || case when stable_key like '%rumore%' then jsonb_build_array('inail-vibrazioni') else '[]'::jsonb end
    when family='verde' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','inail-agricoltura-sicurezza') || case when stable_key like '%rumore%' or stable_key in ('verde:motosega','verde:decespugliatore','verde:tosaerba') then jsonb_build_array('inail-vibrazioni') else '[]'::jsonb end || case when stable_key like '%chimico%' then jsonb_build_array('inail-agenti-chimici') else '[]'::jsonb end
    when family='polizia' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','inail-condivido-near-miss') || case when stable_key like '%stress%' or stable_key like '%aggressioni%' or stable_key='polizia:lavoro-notturno' then jsonb_build_array('inail-violence-work-2025','inail-stress-methodology-2025') else '[]'::jsonb end
    when stable_key like '%incendio%' or stable_key like '%emergenz%' then jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','vvf-materiali-antincendio')
    else jsonb_build_array('mlps-asr-2025','normattiva-dlgs81-vigente','comune-milano-materiale-didattico') end source_keys
 from target t
), enriched as (
 select learning_unit_id,stable_key,target_version,source_keys,
   old_content || jsonb_build_object(
    'summary',coalesce(old_content->>'summary','La formazione specifica collega il tema “'||title||'” ai rischi effettivi della mansione e alle misure da applicare nel lavoro reale.'),
    'detail',coalesce(old_content->>'detail',focus)||' Il lavoratore deve riconoscere il pericolo, applicare la misura prevista, sapere quando fermarsi o chiedere supporto e segnalare condizioni non sicure.',
    'focus',focus,
    'case',case_text,
    'question',coalesce(old_content->>'question','Quale segnale ti farebbe fermare o cambiare il modo di lavorare in questa situazione?'),
    'question_explanation','La risposta è corretta quando collega un segnale osservabile a una misura concreta, chiarisce quando interrompere l’attività o chiedere supporto e indica come verificare che il rischio sia tornato sotto controllo. Punto chiave della LU: '||focus,
    'common_errors',jsonb_build_array('Applicare la regola in modo automatico senza leggere la situazione reale.','Continuare a lavorare con una protezione, un’attrezzatura o una condizione ambientale non verificata.','Confondere il DPI con l’unica misura di prevenzione.','Non segnalare anomalie o near miss perché non hanno prodotto danno.'),
    'teacher_activity',jsonb_build_object('prompt',case_text,'method','Chiedere prima cosa vede il lavoratore; poi costruire pericolo → possibile danno → misura → STOP → segnalazione → ripresa.','debrief','La chiusura deve produrre una regola operativa applicabile alla mansione reale, non una risposta teorica.'),
    'operational',coalesce(old_content->'operational','{}'::jsonb) || jsonb_build_object(
      'before',jsonb_build_array('Controlla area, attrezzature, materiali e condizioni che possono modificare il rischio.','Verifica di conoscere procedura, limiti del compito e modalità di richiesta supporto.'),
      'during',jsonb_build_array('Mantieni le misure previste e osserva cambiamenti o anomalie.','Proteggi te stesso e le altre persone esposte.','Comunica deviazioni e coordina l’attività quando ci sono interferenze.'),
      'after',jsonb_build_array('Lascia area e attrezzature in condizioni sicure.','Segnala anomalie, quasi incidenti e misure non efficaci.','Partecipa al riesame quando il rischio o il modo di lavorare cambia.'),
      'if_problem',jsonb_build_array('Interrompi o limita l’attività se manca una condizione essenziale di sicurezza.','Allontanati dalla zona di pericolo quando necessario.','Avvisa preposto/responsabile e usa i canali di emergenza previsti.'),
      'who_to_involve',case when family='polizia' then jsonb_build_array('Preposto/responsabile del servizio','Colleghi e centrale/coordinamento','RSPP/SPP o RLS per criticità ricorrenti','Addetti emergenza o soccorsi quando necessario') when family in ('verde','ecologici') then jsonb_build_array('Preposto/caposquadra','Colleghi della squadra','RSPP/SPP o RLS per criticità ricorrenti','Manutenzione o specialisti quando l’attrezzatura/condizione lo richiede') else jsonb_build_array('Preposto/responsabile','Colleghi interessati','RSPP/SPP o RLS per criticità ricorrenti','Addetti emergenza/manutenzione quando necessario') end,
      'stop_conditions',jsonb_build_array('Protezione essenziale assente o non funzionante.','Condizione diversa da quella prevista e non valutabile in sicurezza dal lavoratore.','Presenza di persone nella zona pericolosa o interferenza non controllata.','Attrezzatura/materiale/ambiente con anomalia che può causare danno.'),
      'adaptation','Adattare esempi, segnali di STOP e procedure al DVR, alla mansione, alle attrezzature e all’organizzazione reale.'
    ),
    'scope_boundary',case when stable_key in ('verde:lavoro-strada-verde','ecologici:traffico-ecologici','polizia:stradale') then 'Formazione specifica del lavoratore sul rischio di interferenza/investimento. Non sostituisce la formazione prevista dal DI 22/01/2019 per attività di pianificazione, controllo e apposizione/rimozione della segnaletica stradale quando applicabile.' when stable_key='verde:potatura-alto' then 'Formazione specifica del lavoratore sul rischio di caduta. Non sostituisce eventuali corsi/addestramenti specialistici per lavori in quota, PLE o sistemi a fune.' when stable_key in ('verde:motosega','verde:decespugliatore','verde:tosaerba','ecologici:compattatore') then 'Formazione specifica sui rischi della mansione. Restano necessari informazione/addestramento o abilitazioni specifiche previsti dalla normativa per l’attrezzatura e l’attività concretamente svolta.' else 'Questa LU integra la formazione specifica del lavoratore in base al DVR e non sostituisce eventuali percorsi specialistici obbligatori.' end,
    'formative_check',jsonb_build_object('question',coalesce(old_content->>'question','Quale segnale ti farebbe fermare o cambiare il modo di lavorare in questa situazione?'),'explanation','Usare il ragionamento segnale → rischio → misura → STOP/segnalazione → verifica.','formative_only',true,'test_builder_excluded',true),
    'graphic_cards',jsonb_build_array(jsonb_build_object('title','Cosa osservare','body',focus),jsonb_build_object('title','Scenario','body',case_text),jsonb_build_object('title','STOP','body','Fermarsi quando manca una barriera essenziale, compare un’anomalia non controllata o l’attività esce dai limiti della propria competenza/formazione.')),
    'didactic_version','worker-authored-v3',
    'source_keys',source_keys,
    'source_audit',jsonb_build_object('status','reviewed','checked_on','2026-10-16','reuse_policy','reference_and_original_rewrite','normative_validation','D.Lgs. 81/2008 vigente + Accordo Stato-Regioni 17/04/2025 Rep. 59/CSR; contenuti specifici adattati ai rischi di mansione'),
    'source_integration_note','Fonti normative e tecniche usate per validazione, criteri e metodo. Testi, casi, spiegazioni e sequenze operative SafetyTraining sono originali. Le verifiche interne sono formative e separate dal Test Builder.',
    'quality',coalesce(old_content->'quality','{}'::jsonb) || jsonb_build_object('teacher_ready',true,'learner_ready',true,'decision_based',true,'transfer_to_work',true,'authored_presentation',true,'question_has_explanation',true,'formative_checks_only',true,'final_assessment',false,'test_builder_excluded',true,'scope_boundary_explicit',true),
    'final_assessment',false
   ) new_content
 from profiled
), final_content as (
 select e.*,e.new_content || jsonb_build_object('evidence_sources',coalesce((select jsonb_agg(jsonb_build_object('source_key',ts.source_key,'authority',ts.authority,'title',ts.title,'url',ts.canonical_url,'checked_on','2026-10-16','use','authored_evidence') order by ts.source_key) from jsonb_array_elements_text(e.source_keys) sk(source_key) join public.training_sources ts on ts.source_key=sk.source_key),'[]'::jsonb)) content_final
 from enriched e
)
insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,content_hash,published_at)
select learning_unit_id,target_version,'draft',content_final,md5(content_final::text),null from final_content
on conflict (learning_unit_id,version_number) do update set status='draft',content=excluded.content,content_hash=excluded.content_hash,published_at=null;

with authored as (
 select lu.id learning_unit_id,luv.content->'source_keys' source_keys
 from public.learning_units lu join public.learning_unit_versions luv on luv.learning_unit_id=lu.id
 where luv.content->>'didactic_version'='worker-authored-v3' and luv.status='draft'
)
insert into public.learning_unit_sources(learning_unit_id,source_key,purpose,relevance_note,verified_on,metadata)
select a.learning_unit_id,sk.source_key,'authored_evidence_v3','Fonte usata per validazione normativa, approfondimento tecnico o metodo nella versione worker-authored-v3.',date '2026-10-16',jsonb_build_object('didactic_version','worker-authored-v3','reuse_policy','reference_and_original_rewrite')
from authored a cross join lateral jsonb_array_elements_text(a.source_keys) sk(source_key)
join public.training_sources ts on ts.source_key=sk.source_key
on conflict (learning_unit_id,source_key,purpose) do update set relevance_note=excluded.relevance_note,verified_on=excluded.verified_on,metadata=excluded.metadata;

do $$ declare n integer; links integer; bad integer; general_count integer; families integer; begin
 select count(*) into n from public.learning_unit_versions where content->>'didactic_version'='worker-authored-v3' and status='draft';
 if n<>55 then raise exception 'expected 55 worker-authored-v3 drafts, got %',n; end if;
 select count(*) into links from public.course_module_units cmu join public.learning_unit_versions luv on luv.id=cmu.unit_version_id where luv.content->>'didactic_version'='worker-authored-v3';
 if links<>0 then raise exception 'worker authored drafts unexpectedly linked: %',links; end if;
 select count(*) into bad from public.learning_unit_versions luv where luv.content->>'didactic_version'='worker-authored-v3' and (luv.content->'quality'->>'teacher_ready' is distinct from 'true' or luv.content->'quality'->>'learner_ready' is distinct from 'true' or luv.content->'quality'->>'question_has_explanation' is distinct from 'true' or luv.content->'quality'->>'test_builder_excluded' is distinct from 'true' or luv.content->>'final_assessment' is distinct from 'false' or not(luv.content ? 'scope_boundary'));
 if bad<>0 then raise exception 'quality assertions failed for % units',bad; end if;
 select count(*) into general_count from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='worker-authored-v3' and lu.stable_key like 'generale:%';
 if general_count<>0 then raise exception 'general training unexpectedly duplicated: %',general_count; end if;
 select count(distinct case when lu.stable_key like 'update:worker:%' then 'update' when lu.stable_key like 'backoffice:%' then 'backoffice' when lu.stable_key like 'frontoffice:%' then 'frontoffice' when lu.stable_key like 'ecologici:%' then 'ecologici' when lu.stable_key like 'verde:%' then 'verde' when lu.stable_key like 'polizia:%' then 'polizia' end) into families from public.learning_unit_versions luv join public.learning_units lu on lu.id=luv.learning_unit_id where luv.content->>'didactic_version'='worker-authored-v3';
 if families<>6 then raise exception 'expected 6 worker families, got %',families; end if;
end $$;
