import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function api(){
 const window={};
 runInNewContext(read('apps/training/teacher-equipment-cases-v46-3.js'),{window});
 runInNewContext(read('apps/training/teacher-didactic-depth-v46-2.js'),{window});
 return {cases:window.SAFETY_EQUIPMENT_CASES_V46_3,depth:window.SAFETY_DIDACTIC_DEPTH_V46_2};
}
test('v46.3 enriches four exact equipment/PPE families with nonprescriptive analyses and images',()=>{
 const {cases,depth}=api();
 const examples=[
  ['attr_carrelli_all','Stabilità e baricentro del carrello','gp04-baricentro-carrelli.svg'],
  ['attr_carrelli_ind','Pedoni e percorsi separati','gp04-pedoni-carrelli.svg'],
  ['attr_ple','Stabilizzatori e terreno','gp04-stabilita-ple.svg'],
  ['attr_ple','Recupero in emergenza','gp04-recupero-ple.svg'],
  ['attr_gru_autocarro','Portata e sbraccio','gp04-portata-gru.svg'],
  ['attr_gru_autocarro','Accessori di sollevamento e brache','gp04-brache-gru.svg'],
  ['lav_alto','Protezione dell’udito e rumore','gp04-udito-dpi.svg'],
  ['dpi_iii','Scelta DPI e DPC','gp02-checklist-dpi.svg']
 ];
 for(const [id,title,file] of examples){
  const slide={type:'concept',title,topic:{id:'unit',title}};
  const item=cases.forSlide(slide,id);
  assert.ok(item,id+' '+title);assert.ok(item.analysis.length>=2);
  const detail=depth.forSlide(slide,id);
  assert.equal(detail.figure.src,'assets/'+file);
  assert.ok(detail.sections.some(s=>s.label.includes('Lettura critica')));
  assert.ok(existsSync(new URL('../apps/training/assets/'+file,import.meta.url)),file);
  assert.equal(detail.editorial,true);
 }
});
test('v46.3 never leaks equipment cases into other courses, modules or frozen slide data',()=>{
 const {cases,depth}=api();
 const s={type:'concept',title:'Portata e sbraccio',topic:{id:'portata'}};
 for(const id of ['generale','mod_cantieri','csp','attr_mmt_all','attr_gru_torre','attr_gru_autocarro_agg']){
  assert.equal(cases.forSlide(s,id),null,id);
  assert.equal(depth.forSlide(s,id).editorial,false,id);
 }
 for(const s2 of [{...s,type:'module'},{...s,frozen:true},{...s,topic:{...s.topic,frozen:true}}])
  assert.equal(cases.forSlide(s2,'attr_gru_autocarro'),null);
 assert.equal(cases.forSlide({type:'concept',title:'Descrizione introduttiva',topic:{id:'intro'}},'attr_ple'),null);
});
test('v46.3 does not expose quiz answers or write data',()=>{
 const {depth}=api();
 const s={type:'quiz',title:'Portata e sbraccio',quiz:{correct:2,answers:['SEGRETO_QUIZ']},topic:{id:'portata'}};
 assert.doesNotMatch(JSON.stringify(depth.forSlide(s,'attr_gru_autocarro')),/SEGRETO_QUIZ/);
 const js=read('apps/training/teacher-equipment-cases-v46-3.js');
 assert.doesNotMatch(js,/fetch\s*\(|\.rpc\s*\(|localStorage|sessionStorage|indexedDB|\.insert\s*\(|\.update\s*\(/);
});
test('v46.3 scripts, PWA and handoffs are consistent',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js'),packageText=read('package.json');
 assert.ok(html.indexOf('teacher-equipment-cases-v46-3.js')<html.indexOf('teacher-didactic-depth-v46-2.js'));
 assert.ok(sw.includes('./teacher-equipment-cases-v46-3.js'));
 assert.ok(sw.includes('safety-training-v48-slide-dwell'));
 assert.ok(packageText.includes('teacher-equipment-cases-v46-3.test.mjs'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  assert.ok(read(p).slice(0,900).includes('safety-training-v48-slide-dwell'));
  assert.ok(read(p).includes('v46.3 — Casi ragionati attrezzature'));
 }
});
