-- SafetyTraining v20.025
-- Libreria teorica Primo Soccorso (D.M. 388/2003).
-- 8 LU comuni B/C (480 min) + 2 LU di approfondimento Gruppo A (120 min).
-- La pratica resta esterna/dal vivo e non viene considerata completata digitalmente.

do $$
declare
  r record;
  v_lu uuid;
  v_ver uuid;
  v_q uuid;
  v_content jsonb;
begin
  for r in select * from (values
    ('primo_soccorso:allertamento-sicurezza-scena','Allertamento dei soccorsi e sicurezza della scena','Riconoscere l’emergenza, proteggere se stessi e trasmettere ai soccorsi informazioni essenziali.','Qual è la prima priorità prima di avvicinarsi a una persona infortunata?','Verificare che la scena sia sicura per soccorritore e infortunato','Spostare subito la persona senza valutare i pericoli','Cercare prima i documenti della persona','0'),
    ('primo_soccorso:valutazione-iniziale','Valutazione iniziale dell’infortunato','Osservare coscienza, respirazione e condizioni generali senza sostituirsi alla valutazione sanitaria.','Durante la valutazione iniziale, quale elemento richiede un’attivazione immediata dei soccorsi?','Una richiesta di acqua','Assenza di risposta e respirazione non normale','Un piccolo graffio superficiale','1'),
    ('primo_soccorso:funzioni-vitali','Funzioni vitali, coscienza e respirazione','Comprendere i segnali di compromissione delle funzioni vitali e il ruolo dell’addetto nella catena dei soccorsi.','Se una persona non risponde e non respira normalmente, l’addetto deve principalmente:','Attivare subito il sistema di emergenza e applicare le manovre per cui è stato addestrato','Attendere alcuni minuti senza fare nulla','Somministrare farmaci disponibili sul posto','0'),
    ('primo_soccorso:traumi-emorragie','Traumi, ferite ed emorragie','Riconoscere traumi ed emorragie e richiedere assistenza sanitaria adeguata proteggendo soccorritore e infortunato.','In presenza di un’emorragia importante, quale comportamento è corretto?','Proteggersi dal contatto con sangue e attivare rapidamente i soccorsi, applicando solo le tecniche apprese','Ignorare la perdita di sangue se la persona parla','Rimuovere sempre eventuali corpi estranei conficcati','0'),
    ('primo_soccorso:traumi-scheletro-colonna','Traumi muscolo-scheletrici, cranici e della colonna','Riconoscere meccanismi di trauma che possono coinvolgere arti, cranio o colonna e prevenire spostamenti non necessari.','Dopo una caduta importante con possibile trauma alla colonna, in assenza di pericoli immediati è preferibile:','Limitare gli spostamenti e attendere i soccorsi seguendo le indicazioni ricevute','Far camminare subito la persona per verificare se sta bene','Sollevare la persona da soli','0'),
    ('primo_soccorso:traumi-torace-addome','Traumi del torace e dell’addome','Individuare segnali di possibile trauma toracico o addominale e comprenderne l’urgenza.','Dopo un forte trauma al torace o all’addome, la persona riferisce dolore crescente e difficoltà respiratoria. Cosa fai?','Attivo rapidamente i soccorsi e tengo sotto osservazione la persona senza somministrare cibi, bevande o farmaci','La faccio riprendere il lavoro per distrarla','Aspetto la fine del turno','0'),
    ('primo_soccorso:emergenze-mediche','Emergenze mediche improvvise','Riconoscere segnali di allarme compatibili con emergenze mediche e attivare precocemente il soccorso senza formulare diagnosi.','Una persona presenta improvvisamente difficoltà nel parlare e debolezza a un lato del corpo. L’azione corretta è:','Attivare subito il sistema di emergenza e annotare l’orario di comparsa dei sintomi se noto','Aspettare che passi spontaneamente','Darle un farmaco scelto da un collega','0'),
    ('primo_soccorso:ustioni-intossicazioni-temperatura','Ustioni, esposizioni, intossicazioni e temperature estreme','Riconoscere esposizioni a calore, freddo, sostanze o energia elettrica e dare priorità alla sicurezza della scena.','Davanti a una possibile esposizione chimica, prima di soccorrere è essenziale:','Verificare il pericolo, proteggersi e seguire le procedure/SDS prima del contatto','Entrare subito nell’area contaminata senza protezione','Far bere qualcosa alla persona a prescindere dalla sostanza','0'),
    ('primo_soccorso:gruppo-a-rischi-specifici','Gruppo A: rischi lavorativi specifici e agenti pericolosi','Approfondire la relazione tra rischi dell’attività, possibili danni acuti e informazioni da trasmettere ai soccorsi.','Per un’azienda di Gruppo A, la preparazione dell’addetto deve essere collegata soprattutto a:','Rischi reali dell’attività, procedure aziendali e informazioni disponibili su agenti pericolosi','Un elenco generico uguale per ogni azienda','Solo al numero di dipendenti','0'),
    ('primo_soccorso:gruppo-a-scenari-complessi','Gruppo A: scenari complessi e coordinamento dei soccorsi','Gestire organizzativamente scenari con più persone coinvolte o rischi persistenti senza superare il ruolo dell’addetto.','In un evento con più infortunati e un pericolo ancora presente, la priorità organizzativa è:','Evitare nuove esposizioni, attivare i soccorsi e fornire un quadro chiaro dello scenario','Entrare tutti nell’area per aiutare più rapidamente','Spostare ogni persona senza valutare il rischio','0')
  ) t(stable_key,title,summary,prompt,a0,a1,a2,correct_id)
  loop
    v_content := jsonb_build_object(
      'id',split_part(r.stable_key,':',2),
      'title',r.title,'slide_title',r.title,'summary',r.summary,'detail',r.summary||' La parte manuale deve essere appresa e verificata in presenza.',
      'norm','D.M. 388/2003, Allegati 3 e 4','minutes',60,'icon','⛑️','visual','first-aid',
      'prevention',jsonb_build_array('sicurezza della scena','allertamento precoce','assistenza entro i limiti della formazione'),
      'bad',jsonb_build_array('improvvisare manovre non apprese','esporsi a un pericolo non controllato','ritardare i soccorsi'),
      'teacher','Collegare sempre la teoria a rischi, procedure, presidi e organizzazione reali dell’azienda.',
      'quiz',jsonb_build_object('q',r.prompt,'answers',jsonb_build_array(r.a0,r.a1,r.a2),'correct',r.correct_id::int),
      'quality',jsonb_build_object('score',100,'version','v20.025','complete',true),
      'scope',jsonb_build_object('theory_support',true,'practical_training_required',true,'internal_non_certifying',true)
    );

    insert into public.learning_units(stable_key,title,summary,default_minutes,source_group,tags,active,metadata)
    values(r.stable_key,r.title,r.summary,60,'primo_soccorso',array['primo_soccorso','emergency','dm388','theory'],true,jsonb_build_object('family','Emergenze','normative_ref','D.M. 388/2003','practical_training_required',true,'created_by_migration','v20_025'))
    on conflict (stable_key) do update set title=excluded.title,summary=excluded.summary,default_minutes=60,source_group='primo_soccorso',tags=excluded.tags,active=true,metadata=public.learning_units.metadata||excluded.metadata,updated_at=now()
    returning id into v_lu;

    select id into v_ver from public.learning_unit_versions where learning_unit_id=v_lu and version_number=1 limit 1;
    if v_ver is null then
      insert into public.learning_unit_versions(learning_unit_id,version_number,status,content,published_at) values(v_lu,1,'published',v_content,now()) returning id into v_ver;
    else
      update public.learning_unit_versions set status='published',content=v_content,published_at=coalesce(published_at,now()) where id=v_ver;
    end if;

    insert into public.questions(stable_key,unit_version_id,prompt,question_type,options,active,metadata)
    values(r.stable_key||':quiz',v_ver,r.prompt,'single_choice',jsonb_build_array(jsonb_build_object('id','0','label',r.a0),jsonb_build_object('id','1','label',r.a1),jsonb_build_object('id','2','label',r.a2)),true,jsonb_build_object('tags',array['primo_soccorso','emergency','dm388','quiz'],'difficulty','medium','assignment',jsonb_build_object('purpose','comprehension','position',0,'required',true,'unit_stable_key',r.stable_key),'created_by_migration','v20_025'))
    on conflict (stable_key) do update set unit_version_id=excluded.unit_version_id,prompt=excluded.prompt,options=excluded.options,active=true,metadata=public.questions.metadata||excluded.metadata,updated_at=now()
    returning id into v_q;

    insert into public.question_answer_keys(question_id,answer_key,explanation_private)
    values(v_q,jsonb_build_object('correct_answer',jsonb_build_object('option_id',r.correct_id)),'Privilegiare sicurezza del soccorritore, attivazione tempestiva dei soccorsi e sole manovre apprese.')
    on conflict (question_id) do update set answer_key=excluded.answer_key,explanation_private=excluded.explanation_private,updated_at=now();
  end loop;
end $$;

insert into public.safetymanager_course_unit_sources(external_course_code,source_group,relevance,role,metadata)
select x.code,'primo_soccorso',100,'core',jsonb_build_object('profile','first-aid-v1','created_by_migration','v20_025')
from (values ('primo_soccorso_a_16h'),('primo_soccorso_12h'),('agg_primo_soccorso_a_6h'),('agg_primo_soccorso_4h')) x(code)
on conflict (external_course_code,source_group) do update set relevance=excluded.relevance,role=excluded.role,metadata=public.safetymanager_course_unit_sources.metadata||excluded.metadata,updated_at=now();

update public.training_blueprint_sections set metadata=metadata||jsonb_build_object('source_group','primo_soccorso','digital_theory_library_ready',true),updated_at=now() where blueprint_key='first_aid_initial' and section_key='first_aid_theory';
update public.training_blueprints set status='partial',metadata=metadata||jsonb_build_object('digital_theory_library','primo_soccorso','digital_learning_units',10),updated_at=now() where stable_key in ('first_aid_initial','first_aid_update');
