import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const input = process.argv[2];
const scopePath = process.argv[3] || 'packages/platform-core/course-scope.json';
const output = process.argv[4] || 'seeds/safetymanager_course_catalog.json';
if(!input){
  console.error('Uso: node tools/import_safetymanager_catalog.mjs <js/data.js SafetyManager> [course-scope.json] [output.json]');
  process.exit(2);
}
const scope=JSON.parse(fs.readFileSync(scopePath,'utf8'));
const code=fs.readFileSync(input,'utf8');
const sandbox={window:{},console:{log(){},warn(){},error(){}}};
vm.createContext(sandbox);
vm.runInContext(code,sandbox,{filename:input});
const db=sandbox.window.DB_CORSI||{};

const matches=(id,list=[])=>list.includes(id);
const starts=(id,list=[])=>list.some(p=>id.startsWith(p));
const include=id=>(matches(id,scope.include_exact)||starts(id,scope.include_prefixes)) && !(matches(id,scope.exclude_exact)||starts(id,scope.exclude_prefixes));

const familyFor=(id,course)=>{
  if(id.startsWith('lav_') && id!=='lav_quota') return 'lavoratori';
  if(id==='lav_quota') return 'lavori_quota';
  if(id.startsWith('preposto')||id==='agg_prep') return 'preposto';
  if(id.startsWith('dirigente')||id==='agg_dir') return 'dirigente';
  if(id.startsWith('dl_')||id.startsWith('agg_dl')) return 'datore_lavoro';
  if(id==='rls'||id.startsWith('agg_rls')) return 'rls';
  if(id.includes('primo_soccorso')) return 'primo_soccorso';
  if(id.includes('antincendio')) return 'antincendio';
  if(id.startsWith('attr_')||id.startsWith('agg_attr_')) return 'attrezzature';
  if(id==='mod_cantieri') return 'cantieri_dl_dirigente';
  return 'other';
};

const result=Object.entries(db)
 .filter(([id,c])=>include(id) && !c?.deprecated)
 .map(([id,c])=>({
   legacy_course_id:id,
   title:c.t||id,
   family:familyFor(id,c),
   nominal_hours:c.ore??null,
   expiry_years:c.scad===99?null:(c.scad??null),
   risk_code:c.risk||null,
   course_code:c.code||null,
   legal_ref:c.norma||null,
   enabled_in_lms:true,
   certification_mode:'internal_learning',
   source_metadata:{prog:c.prog||[]}
 }));
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(`Importati ${result.length} corsi su ${Object.keys(db).length}; esclusi ${Object.keys(db).length-result.length}.`);
