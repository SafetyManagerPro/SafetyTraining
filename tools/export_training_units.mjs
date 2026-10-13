import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const input = process.argv[2] || 'apps/training/data.js';
const outDir = process.argv[3] || 'seeds';
const code = fs.readFileSync(input,'utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(code,sandbox,{filename:input});
const data=sandbox.window.SAFETY_DATA;
if(!Array.isArray(data)) throw new Error('SAFETY_DATA non trovato');
fs.mkdirSync(outDir,{recursive:true});

const units=[];
const questions=[];
const keys=[];
const risks=new Map();

const riskTitles={
  aggression:'Aggressioni, violenza e conflitto', bio:'Rischio biologico', chemical:'Rischio chimico',
  electrical:'Rischio elettrico', emergency:'Emergenze e incendio', general:'Rischi generali e prevenzione',
  height:'Lavori in quota e cadute', machine:'Macchine e attrezzature', mmc:'Movimentazione manuale ed ergonomia',
  noise:'Rumore e vibrazioni', organization:'Organizzazione, stress e fatica', space:'Ambienti, archivi e spazi di lavoro',
  system:'Sistema di prevenzione, DVR e ruoli', traffic:'Traffico, investimento e veicoli', vdt:'Videoterminali ed ergonomia',
  weather:'Microclima, caldo, freddo e meteo'
};

for(const course of data){
  for(const topic of course.topics){
    const category=topic.operational?.category||'general';
    risks.set(category,{code:category,title:riskTitles[category]||category,category});
    const stableKey=`${course.id}:${topic.id}`;
    const tags=[course.id,topic.id,category];
    if(topic.dpi?.length) tags.push('dpi');
    if(topic.video_plan||topic.video_moment) tags.push('video');
    units.push({
      stable_key:stableKey,
      title:topic.title,
      summary:topic.summary||'',
      default_minutes:topic.minutes||0,
      source_group:course.id,
      source_group_title:course.title,
      tags:[...new Set(tags)],
      version_number:1,
      status:'draft',
      content:topic
    });
    if(topic.quiz){
      const qKey=`${stableKey}:quiz`;
      questions.push({
        stable_key:qKey,
        question_type:'single_choice',
        prompt:topic.quiz.q,
        options:(topic.quiz.answers||[]).map((label,index)=>({id:String(index),label})),
        difficulty:'medium',
        tags:[...new Set([...tags,'quiz'])],
        assignment:{unit_stable_key:stableKey,purpose:'comprehension',required:true,position:0}
      });
      const correctIndex=Number(topic.quiz.correct);
      const feedback=topic.discussion_feedback||{};
      keys.push({
        stable_key:qKey,
        correct_answer:{option_id:String(correctIndex)},
        explanation:topic.quiz.explanation||topic.detail||'',
        case_solution:topic.quiz.case_solution||feedback.case_solution||topic.procedure||[],
        general_solution:topic.quiz.general_solution||feedback.general_solution||topic.prevention||[]
      });
    }
  }
}

fs.writeFileSync(path.join(outDir,'learning_units.json'),JSON.stringify(units,null,2));
fs.writeFileSync(path.join(outDir,'questions_public.json'),JSON.stringify(questions,null,2));
fs.writeFileSync(path.join(outDir,'question_keys_private.json'),JSON.stringify(keys,null,2));
fs.writeFileSync(path.join(outDir,'risk_catalog.json'),JSON.stringify([...risks.values()].sort((a,b)=>a.code.localeCompare(b.code)),null,2));
console.log(JSON.stringify({courses:data.length,units:units.length,questions:questions.length,risks:risks.size},null,2));
