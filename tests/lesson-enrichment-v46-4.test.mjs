import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function setup(custom){
 const window={
  SAFETY_EQUIPMENT_CASES_V46_3:{forSlide:()=>({
   caseId:'stabilita',family:'carrelli',case:'Pavimento umido, curva e carico decentrato.',
   analysis:['Verificare le barriere organizzative','Verificare il manuale del costruttore'],
   prompt:'Quali evidenze servono?',visual:'assets/gp04-baricentro-carrelli.svg',
   imageCaption:'Baricentro del carrello, illustrazione concettuale.'
  })},addEventListener(){},...(custom||{})};
 const document={addEventListener(){},body:{classList:{contains(){return true}}},querySelector(){return null},hidden:false};
 runInNewContext(read('apps/training/lesson-enrichment-v46-4.js'),{window,document,location:{hash:''}});
 return {api:window.SAFETY_LESSON_ENRICHMENT_V46_4,window};
}
const course=(overrides={})=>({id:'attr_carrelli_ind',db_version:2,db_status:'published',presentation_generated_from_db:true,metadata:{},...overrides});
const topic=(overrides={})=>({id:'db-module::carrelli::1',title:'Stabilità e baricentro',db_backed:true,...overrides});
test('v46.4 publishes no new course, but adds sourced analysis to an eligible topic page',()=>{
 const {api}=setup();
 const e=api.forTopic(course(),topic());
 assert.equal(e.family,'carrelli');assert.match(e.case,/Pavimento umido/);
 assert.ok(existsSync(new URL('../apps/training/'+e.src,import.meta.url)));
 const html=api.renderForTopic(course(),topic());
 assert.match(html,/Il caso da analizzare/);
 assert.match(html,/Analisi dei rischi e delle barriere/);
 assert.match(html,/Domanda per l’aula/);
 assert.match(html,/INAIL/);
 assert.match(html,/non certifica questo caso/);
 assert.match(html,/gp04-baricentro-carrelli.svg/);
});
test('v46.4 is scoped to DB published and non frozen courses, not local data or historic versions',()=>{
 const {api}=setup();
 for(const c of [
  course({presentation_generated_from_db:false}),
  course({db_status:'draft'}),
  course({metadata:{frozen:true}}),
  course({metadata:{freeze_scope:'all'}}),
  course({metadata:{course_frozen:true}}),
  course({frozen:true})
 ])assert.equal(api.forTopic(c,topic()),null);
 assert.equal(api.forTopic(course(),topic({db_backed:false})),null);
 assert.equal(api.renderForTopic(course({metadata:{is_frozen:true}}),topic()),'');
 for(const kind of ['module','quiz','video','visualAtlas']){
  assert.equal(api.forDeck(course(),{type:kind,topic:topic()}),null);
 }
 assert.equal(api.forDeck(course(),{type:'explain',topic:topic()}).caseId,'stabilita');
});
test('v46.4 escapes all remote and source text, rejects unsafe image path',()=>{
 const {api}=setup({SAFETY_EQUIPMENT_CASES_V46_3:{forSlide:()=>({
  family:'carrelli',case:'<img src=x onerror=alert(1)>',analysis:['<script>hello</script>'],
  prompt:'<b>unsafe</b>',visual:'assets/gp04-baricentro-carrelli.svg',
  imageCaption:'" onerror="alert(2)'
 })}});
 const html=api.renderForTopic(course(),topic());
 assert.ok(!html.includes('<script>')&&!html.includes('<img src=x onerror'));
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;img/);
 assert.match(html,/&quot; onerror=&quot;/);
 const {api:bad}=setup({SAFETY_EQUIPMENT_CASES_V46_3:{forSlide:()=>({
  family:'carrelli',case:'a',analysis:['b'],prompt:'c',
  imageCaption:'d',visual:'https://evil.example/hero.svg'
 })}});
 assert.equal(bad.forTopic(course(),topic()),null);
});
test('v46.4 writes neither database nor learner progress and retains privacy of teacher notes',()=>{
 const js=read('apps/training/lesson-enrichment-v46-4.js');
 assert.doesNotMatch(js,/\.rpc\s*\(|\.insert\s*\(|\.update\s*\(|localStorage|sessionStorage|indexedDB|fetch\s*\(/);
 assert.doesNotMatch(js,/correct|answer_overlay|learning_events|active_seconds|enrollments/);
 assert.match(js,/SAFETY_MODAL_ACCESS/);
 assert.match(js,/safety:deck-slide-rendered/);
 assert.match(js,/visibilitychange/);
 const guide=read('apps/training/teacher-didactic-guide-v46.js');
 assert.match(guide,/Mostra note su questo schermo/);
});
test('v46.4 is loaded in the actual topic/deck frontend, precached and tracked in two handoffs',()=>{
 const html=read('apps/training/index.html');
 assert.ok(html.indexOf('teacher-equipment-cases-v46-3.js')<html.indexOf('lesson-enrichment-v46-4.js'));
 assert.ok(html.indexOf('lesson-enrichment-v46-4.js')<html.indexOf('app.js'));
 assert.ok(html.includes('lesson-enrichment-v46-4.css'));
 const app=read('apps/training/app.js');
 assert.ok(app.includes('SAFETY_LESSON_ENRICHMENT_V46_4?.renderForTopic?.(c,t)'));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-5-editorial-matrix'/);
 assert.ok(sw.includes('./lesson-enrichment-v46-4.js'));
 assert.ok(sw.includes('./lesson-enrichment-v46-4.css'));
 const packageFile=read('package.json');
 assert.ok(packageFile.includes('tests/lesson-enrichment-v46-4.test.mjs'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(p);assert.ok(doc.slice(0,900).includes('safety-training-v46-5-editorial-matrix'));
  assert.ok(doc.includes('v46.4 — Approfondimenti contestuali nelle lezioni'));
 }
});
