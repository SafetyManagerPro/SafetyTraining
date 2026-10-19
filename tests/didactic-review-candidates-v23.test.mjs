import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
runInNewContext(read('apps/training/didactic-review-candidates-v23.js'),ctx);
const d=ctx.window.SAFETY_DIDACTIC_REVIEW_V23;
test('targeted additions are complete four-stage practical drafts, not publications',()=>{
 for(const key of ['agg_attr_carrelli_ind_4h','agg_attr_ple_4h']){
  const v=d.reviewFor(key);
  assert.ok(v);
  assert.match(v.status,/BOZZA/);
  assert.equal(v.segments.length,4);
  assert.equal(v.segments.reduce((s,x)=>s+x.minutes,0),240);
  assert.ok(v.segments.every(s=>s.actions.length>90&&s.practice.length>50&&s.observation.length>40));
  assert.match(v.validation,/valid|programma|conform|tempo|attrezzatura/i);
  const html=d.renderFor(key);
  assert.match(html,/da validare/);
  assert.match(html,/NON frequenza convalidata/);
  assert.match(html,/Le versioni pubblicate restano inalterate/);
 }
 assert.equal(d.reviewFor('course_unknown'),null);
 assert.equal(d.renderFor('course_unknown'),'');
});
test('quality admin links didactic drafts by stable key without mutating database',()=>{
 const qual=read('apps/training/course-quality-v22.js');
 const index=read('apps/training/index.html');
 assert.match(qual,/SAFETY_DIDACTIC_REVIEW_V23/);
 assert.ok(index.indexOf('didactic-review-candidates-v23.js')<index.indexOf('course-quality-v22.js'));
 const src=read('apps/training/didactic-review-candidates-v23.js');
 assert.doesNotMatch(src,/\.update\s*\(|\.insert\s*\(|\.delete\s*\(|\.upsert\s*\(/);
});
