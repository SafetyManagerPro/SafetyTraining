import fs from 'node:fs';
import path from 'node:path';

const dir=process.argv[2]||'seeds';
const out=process.argv[3]||path.join(dir,'v19_content_seed.sql');
const units=JSON.parse(fs.readFileSync(path.join(dir,'learning_units.json'),'utf8'));
const questions=JSON.parse(fs.readFileSync(path.join(dir,'questions_public.json'),'utf8'));
const keys=JSON.parse(fs.readFileSync(path.join(dir,'question_keys_private.json'),'utf8'));
const risks=JSON.parse(fs.readFileSync(path.join(dir,'risk_catalog.json'),'utf8'));
const keyByStable=new Map(keys.map(x=>[x.stable_key,x]));
const qByStable=new Map(questions.map(x=>[x.stable_key,x]));
const esc=s=>String(s??'').replaceAll("'","''");
const j=v=>`'${esc(JSON.stringify(v))}'::jsonb`;
const arr=a=>`array[${(a||[]).map(x=>`'${esc(x)}'`).join(',')}]::text[]`;
let sql=`-- Generated seed for Safety Platform v19\n-- Generated from Safety Training v18 content; no certification semantics are implied.\n\n`;
for(const r of risks){
  sql+=`insert into public.training_risk_catalog(code,title,category,description) values ('${esc(r.code)}','${esc(r.title)}','${esc(r.category||'')}',null) on conflict (code) do update set title=excluded.title, category=excluded.category;\n`;
}
sql+='\n';
for(const u of units){
  sql+=`insert into public.training_learning_units(stable_key,title,summary,default_minutes,source_group,tags) values ('${esc(u.stable_key)}','${esc(u.title)}','${esc(u.summary)}',${Number(u.default_minutes||0)},'${esc(u.source_group)}',${arr(u.tags)}) on conflict (stable_key) do update set title=excluded.title, summary=excluded.summary, default_minutes=excluded.default_minutes, source_group=excluded.source_group, tags=excluded.tags, active=true, updated_at=now();\n`;
  sql+=`insert into public.training_learning_unit_versions(learning_unit_id,version_number,status,content,published_at) select id,${Number(u.version_number||1)},'${esc(u.status||'draft')}',${j(u.content)},case when '${esc(u.status||'draft')}'='published' then now() else null end from public.training_learning_units where stable_key='${esc(u.stable_key)}' on conflict (learning_unit_id,version_number) do update set content=excluded.content,status=excluded.status;\n`;
}
sql+='\n';
for(const q of questions){
  sql+=`insert into public.training_questions(stable_key,question_type,prompt,options,difficulty,tags) values ('${esc(q.stable_key)}','${esc(q.question_type)}','${esc(q.prompt)}',${j(q.options)},'${esc(q.difficulty||'medium')}',${arr(q.tags)}) on conflict (stable_key) do update set prompt=excluded.prompt,options=excluded.options,difficulty=excluded.difficulty,tags=excluded.tags,active=true,updated_at=now();\n`;
  const k=keyByStable.get(q.stable_key);
  if(k){
    sql+=`insert into public.training_question_keys(question_id,correct_answer,explanation,case_solution,general_solution) select id,${j(k.correct_answer)},'${esc(k.explanation||'')}', '${esc(Array.isArray(k.case_solution)?k.case_solution.join(' • '):k.case_solution||'')}', '${esc(Array.isArray(k.general_solution)?k.general_solution.join(' • '):k.general_solution||'')}' from public.training_questions where stable_key='${esc(q.stable_key)}' on conflict (question_id) do update set correct_answer=excluded.correct_answer,explanation=excluded.explanation,case_solution=excluded.case_solution,general_solution=excluded.general_solution,updated_at=now();\n`;
  }
  const a=q.assignment;
  if(a?.unit_stable_key){
    sql+=`insert into public.training_question_assignments(question_id,unit_version_id,purpose,required,position) select q.id,uv.id,'${esc(a.purpose||'comprehension')}',${a.required?'true':'false'},${Number(a.position||0)} from public.training_questions q join public.training_learning_units u on u.stable_key='${esc(a.unit_stable_key)}' join public.training_learning_unit_versions uv on uv.learning_unit_id=u.id and uv.version_number=1 where q.stable_key='${esc(q.stable_key)}' and not exists (select 1 from public.training_question_assignments x where x.question_id=q.id and x.unit_version_id=uv.id and x.purpose='${esc(a.purpose||'comprehension')}');\n`;
  }
}
fs.writeFileSync(out,sql);
console.log(`Creato ${out}: ${units.length} unità, ${questions.length} domande, ${risks.length} rischi.`);
