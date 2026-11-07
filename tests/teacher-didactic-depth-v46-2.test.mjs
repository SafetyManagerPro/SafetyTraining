import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function api(){
 const window={};
 runInNewContext(read('apps/training/teacher-didactic-depth-v46-2.js'),{window});
 return window.SAFETY_DIDACTIC_DEPTH_V46_2;
}
test('v46.2 uses specific, curated cases only for Formazione generale',()=>{
 const a=api(),s={type:'concept',topic:{id:'rischio',risks:['Esposizione non valutata'],prevention:['Valutare misure alla fonte'],operational:{before:['Osserva'],during:['Controlla'],stop_conditions:['Barriera assente']}}};
 const d=a.forSlide(s,'generale');
 assert.equal(d.editorial,true);
 assert.match(d.sections.map(x=>x.items.join(' ')).join(' '),/pavimento scivoloso/);
 assert.match(d.sections.map(x=>x.items.join(' ')).join(' '),/Barriera assente/);
 assert.ok(d.figure&&d.figure.src.startsWith('assets/'));
 const frozen=a.forSlide(s,'corso_frozen');assert.equal(frozen.editorial,false);
 assert.ok(!frozen.sections.some(x=>x.label.includes('Caso integrativo')));
 assert.equal(a.forSlide({type:'module',topic:s.topic},'generale').sections.length,0);
});
test('v46.2 select figures only from already paired or curated local SVGs',()=>{
 const a=api(),slide={type:'concept',topic:{id:'rischio'},img:{src:'assets/gp03-matrice-rischio.svg',caption:'Matrice originale della slide'}};
 assert.equal(a.forSlide(slide,'generale').figure.src,'assets/modello-farfalla-rischio.svg');
 assert.equal(a.forSlide(slide,'other').figure.src,'assets/gp03-matrice-rischio.svg');
 const fallback=a.forSlide({type:'concept',topic:slide.topic,img:{src:'https://example.com/x.svg'}},'generale');
 assert.equal(fallback.figure.src,'assets/modello-farfalla-rischio.svg');
 assert.equal(a.forSlide({type:'concept',topic:{id:'unknown'},img:{src:'../../bad.svg'}},'other').figure,null);
 for(const f of ['modello-farfalla-rischio','gp03-gerarchia-prevenzione','organigramma-sicurezza','idea-rls-consult','gp03-near-miss','gp02-exit-obstructed','gp02-signs-warning-rescue']){
  assert.ok(existsSync(new URL('../apps/training/assets/'+f+'.svg',import.meta.url)),f);
 }
 for(const s of ['javascript:alert(1)','assets/../x.svg','https://example.com/a.svg','assets/bad.svg?x=1'])assert.equal(a.safeVisual(s),false);
});
test('v46.2 derives analysis without exposing assessments, inventing procedures, or DB writes',()=>{
 const a=api(),s={type:'quiz',quiz:{answers:['RISPOSTA SEGRETA'],correct:0},topic:{id:'test',risks:['Rischio specifico'],prevention:['Misura specifica'],operational:{before:['Valutazione preuso'],who_to_involve:['Preposto']}}};
 const d=a.forSlide(s,'course');
 const txt=JSON.stringify(d);
 assert.match(txt,/Rischio specifico/);assert.match(txt,/Preposto/);
 assert.doesNotMatch(txt,/RISPOSTA SEGRETA/);
 const js=read('apps/training/teacher-didactic-depth-v46-2.js');
 assert.doesNotMatch(js,/fetch\s*\(|\.rpc\s*\(|localStorage|sessionStorage|indexedDB|\.insert\s*\(|\.update\s*\(/);
});
test('v46.2 graphically and operationally wired to guide without touching freezes',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js'),guide=read('apps/training/teacher-didactic-guide-v46.js');
 assert.ok(html.indexOf('teacher-didactic-depth-v46-2.js')<html.indexOf('teacher-didactic-guide-v46.js'));
 assert.ok(sw.includes('./teacher-didactic-depth-v46-2.js'));
 assert.ok(sw.includes("safety-training-v48-slide-dwell"));
 assert.match(guide,/SAFETY_DIDACTIC_DEPTH_V46_2/);
 assert.match(guide,/figure\+parts/);
 assert.match(read('apps/training/teacher-didactic-guide-v46.css'),/v46-guide-figure/);
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  assert.ok(read(p).slice(0,850).includes('safety-training-v48-slide-dwell'));
  assert.ok(read(p).includes('v46.2 — Analisi didattica'));
 }
});
