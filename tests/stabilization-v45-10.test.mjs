import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('apps/training/deck-course-audit-v45-9.js');
const api=()=>{
 const document={body:{classList:{contains:()=>true}},addEventListener(){},createElement(){throw Error('No DOM mutation during metadata scan')}};
 const window={addEventListener(){},__deck:{cid:'course'},__deckSlides:[]};
 runInNewContext(source,{window,document,location:{hash:'#deck/course/0'}});
 return window.SAFETY_DECK_COURSE_AUDIT_V45_9;
};
test('v45.10: audit of empty and malformed slides is safe, read-only and deterministic',()=>{
 const a=api();
 assert.equal(a.collect(null).length,0);
 const input=[null,{}, {type:'visualAtlas',visuals:null}, {type:'concept',img:null,visualGallery:[null,{}, {src:'a',caption:'ok'}]}];
 const first=a.collect(input),second=a.collect(input);
 assert.equal(first.length,4);
 assert.deepEqual(JSON.parse(JSON.stringify(first)),JSON.parse(JSON.stringify(second)));
 assert.equal(first[2].figures,0);
 assert.ok(first[2].issues.includes('Atlante senza figure'));
 assert.equal(first[3].figures,2);
 assert.ok(first[3].issues.some(s=>s.includes('sorgente originale')));
});
test('v45.10: report never writes course progress or network state',()=>{
 assert.doesNotMatch(source,/fetch\s*\(|\.rpc\s*\(|localStorage|sessionStorage|new Image\s*\(|learning_events|active_seconds/);
 for(const path of ['apps/training/deck-visual-audit-v45-8.js','apps/training/deck-teacher-tools-v45-7.js']){
  const s=read(path);
  assert.ok(s.includes('SAFETY_'),path);
 }
});
test('v45.10: handoff documents record pending manual smoke and GitHub-only workflow',()=>{
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const s=read(path);
  assert.match(s,/v45\.10 — Stabilizzazione/);
  assert.match(s,/senza consultare @Vercel/);
  assert.match(s,/smoke manuale/i);
 }
});
