create temp table _candidate_luv on commit drop as
select distinct luv.id unit_version_id,lu.id learning_unit_id,lu.stable_key unit_key,lu.title unit_title,
       luv.content,luv.content->>'didactic_version' didactic_version
from public.course_versions cv
join public.course_modules cm on cm.course_version_id=cv.id
join public.course_module_units cmu on cmu.module_id=cm.id
join public.learning_unit_versions luv on luv.id=cmu.unit_version_id
join public.learning_units lu on lu.id=luv.learning_unit_id
where cv.syllabus_snapshot->>'finalization_batch' in ('v20_087','v20_088');

create temp table _final_questions on commit drop as
with base as (
 select c.*,
        coalesce(nullif(c.content->'formative_check'->>'explanation',''),nullif(c.content->>'question_explanation',''),nullif(c.content->>'focus',''),'La risposta corretta applica le misure previste, mantiene il controllo del rischio e richiede STOP o coinvolgimento delle figure previste quando le condizioni non sono sicure.') explanation,
        coalesce(c.content->'operational'->'before'->>0,'Verificare condizioni, limiti, procedure e interferenze prima di iniziare.') before_correct,
        coalesce(c.content->'operational'->'during'->>0,'Mantenere le condizioni previste e rivalutare ogni cambiamento significativo durante l’attività.') during_correct,
        coalesce(c.content->'operational'->'stop_conditions'->>0,'Fermarsi quando una condizione essenziale di sicurezza non è verificata o controllata.') stop_correct,
        coalesce(c.content->'operational'->'if_problem'->>0,'Mettere in sicurezza, interrompere se necessario e attivare la procedura prevista senza improvvisare.') problem_correct,
        coalesce(c.content->'operational'->'who_to_involve'->>0,c.content->'operational'->'after'->>0,'Coinvolgere la figura prevista dalla procedura e documentare/chiudere correttamente l’azione.') involve_correct
 from _candidate_luv c
), expanded as (
 select b.*,x.perspective,x.correct_text,x.prompt,
        case x.perspective
          when 'before' then 'Procedere subito e verificare le condizioni solo se emerge un problema.'
          when 'during' then 'Proseguire invariati anche se cambiano condizioni, area o interferenze.'
          when 'stop' then 'Continuare perché l’attività è già iniziata e fermarsi solo a fine fase.'
          when 'problem' then 'Aggirare temporaneamente la protezione o la procedura per terminare più rapidamente.'
          else 'Gestire sempre individualmente senza informare le figure previste.' end wrong_a,
        case x.perspective
          when 'before' then 'Affidarsi all’esperienza individuale senza riesaminare procedure, limiti o interferenze.'
          when 'during' then 'Compensare un’anomalia con maggiore attenzione senza fermare o rivalutare.'
          when 'stop' then 'Ignorare il segnale perché l’operatore ha già svolto attività simili in passato.'
          when 'problem' then 'Rinviare la segnalazione al termine del turno continuando comunque l’attività.'
          else 'Coinvolgere solo un collega non incaricato, senza attivare il flusso previsto.' end wrong_b,
        mod(abs(hashtext(b.unit_version_id::text||':'||x.perspective)),3) correct_idx
 from base b
 cross join lateral (values
   ('before',b.before_correct,'Prima di operare sul tema «'||b.unit_title||'», quale azione è coerente con il percorso formativo?'),
   ('during',b.during_correct,'Durante un’attività collegata a «'||b.unit_title||'», quale comportamento è coerente con la gestione sicura?'),
   ('stop',b.stop_correct,'Nel tema «'||b.unit_title||'», quale condizione richiede STOP o rivalutazione prima di proseguire?'),
   ('problem',b.problem_correct,'Se emerge un problema nel contesto «'||b.unit_title||'», quale risposta è coerente con il percorso?'),
   ('involve',b.involve_correct,'Nel contesto «'||b.unit_title||'», chi o cosa deve essere coinvolto per gestire correttamente la situazione?')
 ) x(perspective,correct_text,prompt)
)
select gen_random_uuid() question_id,
       'final:v20_090:'||unit_version_id::text||':'||perspective stable_key,
       unit_version_id,prompt,'single_choice'::text question_type,
       case correct_idx
         when 0 then jsonb_build_array(jsonb_build_object('id','0','label',correct_text),jsonb_build_object('id','1','label',wrong_a),jsonb_build_object('id','2','label',wrong_b))
         when 1 then jsonb_build_array(jsonb_build_object('id','0','label',wrong_a),jsonb_build_object('id','1','label',correct_text),jsonb_build_object('id','2','label',wrong_b))
         else jsonb_build_array(jsonb_build_object('id','0','label',wrong_a),jsonb_build_object('id','1','label',wrong_b),jsonb_build_object('id','2','label',correct_text)) end options,
       explanation public_explanation,true active,
       jsonb_build_object('final_builder',true,'finalization_batch','v20_090','source_didactic_version',didactic_version,'generated_from_authored_structure',true,'perspective',perspective,'candidate_only',true,'unit_stable_key',unit_key,'difficulty','medium','generated_on','2026-10-16') metadata,
       correct_idx::text correct_option_id
from expanded;

insert into public.questions(id,stable_key,unit_version_id,prompt,question_type,options,public_explanation,active,metadata)
select question_id,stable_key,unit_version_id,prompt,question_type,options,public_explanation,active,metadata from _final_questions
on conflict(stable_key) do update set unit_version_id=excluded.unit_version_id,prompt=excluded.prompt,question_type=excluded.question_type,options=excluded.options,public_explanation=excluded.public_explanation,active=excluded.active,metadata=excluded.metadata,updated_at=now();

insert into public.question_answer_keys(question_id,answer_key,explanation_private)
select q.id,jsonb_build_object('correct_answer',jsonb_build_object('option_id',fq.correct_option_id),'source','authored_structure_v20_090'),fq.public_explanation
from _final_questions fq join public.questions q on q.stable_key=fq.stable_key
on conflict(question_id) do update set answer_key=excluded.answer_key,explanation_private=excluded.explanation_private,updated_at=now();

do $$ declare n int; keys int; explained int; optbad int; byunit int; perspectives int; begin
 select count(*) into n from public.questions where metadata->>'finalization_batch'='v20_090'; if n<>1450 then raise exception 'expected 1450 generated questions got %',n; end if;
 select count(*) into keys from public.question_answer_keys k join public.questions q on q.id=k.question_id where q.metadata->>'finalization_batch'='v20_090'; if keys<>1450 then raise exception 'expected 1450 answer keys got %',keys; end if;
 select count(*) into explained from public.questions where metadata->>'finalization_batch'='v20_090' and public_explanation is not null and btrim(public_explanation)<>''; if explained<>1450 then raise exception 'expected explanations on all questions got %',explained; end if;
 select count(*) into optbad from public.questions where metadata->>'finalization_batch'='v20_090' and jsonb_array_length(options)<>3; if optbad<>0 then raise exception 'option count invalid on % questions',optbad; end if;
 select count(*) into byunit from (select unit_version_id,count(*) n from public.questions where metadata->>'finalization_batch'='v20_090' group by unit_version_id having count(*)=5) s; if byunit<>290 then raise exception 'expected 290 unit versions with five questions got %',byunit; end if;
 select count(distinct metadata->>'perspective') into perspectives from public.questions where metadata->>'finalization_batch'='v20_090'; if perspectives<>5 then raise exception 'expected 5 perspectives got %',perspectives; end if;
end $$;