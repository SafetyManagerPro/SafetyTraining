import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const src=readFileSync(new URL('../apps/training/course-quality-v22.js',import.meta.url),'utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
runInNewContext(src,context);
const {nextStep,prioritize,equipmentReview}=context.window.SAFETY_COURSE_QUALITY_V22;
test('missing modules and assessments outrank cosmetic media gaps',()=>{
 const ordered=prioritize([
  {title:'B',quality_gaps:['missing_visual_support']},
  {title:'A',quality_gaps:['missing_learning_units','missing_sources']},
  {title:'C',quality_gaps:['missing_specific_practice_lab']}
 ]);
 assert.deepEqual(Array.from(ordered,x=>x.title),['A','C','B']);
});
test('each priority gives an actionable explanation, not an automatic course approval',()=>{
 assert.match(nextStep({quality_gaps:['missing_verification_path']}).text,/test o colloquio/);
 assert.match(nextStep({quality_gaps:['missing_specific_practice_lab']}).text,/docente/);
 assert.match(nextStep({quality_gaps:[]}).text,/revisione esperta/);
});
test('priority backlog is a read-only navigation improvement; frozen courses are not modified',()=>{
 assert.match(src,/get_course_quality_v22/);
 assert.match(src,/Prossima azione didattica/);
 assert.doesNotMatch(src,/\.update\s*\(|\.insert\s*\(|\.delete\s*\(|\.upsert\s*\(/);
});

test('combined 16h forklift course is flagged for specific instructor-led practical review',()=>{
 const course={stable_key:'attr_carrelli_all',title:'Carrelli combinati 16h',quality_gaps:[]};
 assert.equal(nextStep(course).score,10,'regulatory review outranks cosmetic gaps');
 assert.match(nextStep(course).text,/tre tipologie di mezzo/);
 assert.match(equipmentReview(course).text,/8 ore pratiche/);
 assert.match(equipmentReview({stable_key:'attr_ple'}).text,/prove pratiche in presenza/);
 assert.equal(equipmentReview({stable_key:'generale'}),null);
 assert.equal(equipmentReview({stable_key:'attr_carrelli_all',metadata:{freeze_scope:'catalog'}})?.priority,true,'rendering a read-only note must not change frozen metadata');
});
