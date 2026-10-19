import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
runInNewContext(read('apps/training/graphic-pack-01.js'),ctx);
const pack=ctx.window.SAFETY_GRAPHIC_PACK_01;
const course={presentation_generated_from_db:true,metadata:{}};
const lesson=(title,mode='auto-themed')=>({title,summary:'',db_backed:true,presentation_quality:{visual_mode:mode}});
test('Graphic Pack 01 contains 20 original printable SVG illustrations',()=>{
 assert.equal(pack.items.length,20);
 assert.equal(new Set(pack.items.map(x=>x.src)).size,20);
 for(const item of pack.items){
  const svg=read('apps/training/'+item.src);
  assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg,/<title id="title">/);
  assert.match(svg,/<desc id="desc">/);
  assert.match(svg,/SAFETYTRAINING/);
  assert.doesNotMatch(svg,/<script|<foreignObject|<image |onload=|href=|xlink:href=|<use\b/i);
  assert.match(svg,/<\/svg>$/);
 }
});
test('topic-first matching connects the illustrations to relevant lessons',()=>{
 for(const [title,asset] of [
  ['Obbligo del casco','dpi-casco'],['Protezione delle mani con guanti','dpi-guanti'],
  ['Rischio caduta dall’alto','rischio-caduta'],['Controlli preuso del carrello','procedura-preuso'],
  ['Rischio di ribaltamento','rischio-ribaltamento'],['Pericolo schiacciamento','rischio-schiacciamento'],
  ['Segnaletica aziendale','segnali-famiglie'],['Antincendio - piano di emergenza','procedura-emergenza']
 ]){
  const picked=Array.from(pack.pick(course,lesson(title)),x=>x.graphic_pack_id);
  assert.ok(picked.includes(asset),'missing '+asset+' in '+title);
 }
});
test('frozen courses and explicitly authored diagrams are never visually replaced',()=>{
 for(const metadata of [{frozen:true},{freeze_scope:'course'},{is_frozen:true},{course_frozen:true}]){
  assert.equal(pack.pick({...course,metadata},lesson('DPI casco')).length,0);
 }
 assert.equal(pack.pick(course,lesson('DPI casco','authored')).length,0);
 assert.equal(pack.pick({presentation_generated_from_db:false},lesson('DPI casco')).length,0);
 assert.equal(pack.pick(course,{...lesson('DPI casco'),db_backed:false}).length,0);
});
test('neutral topics are not decorated with unrelated danger icons',()=>{
 assert.equal(pack.pick(course,lesson('Principi e responsabilità')).length,0);
});
test('the printer and projector use one deck and retain metadata of frozen courses',()=>{
 const app=read('apps/training/app.js'),adapter=read('apps/training/db-slide-adapter.js');
 const printer=read('apps/training/admin-print-slides-v23.js');
 const index=read('apps/training/index.html');
 const worker=read('apps/training/sw.js');
 assert.match(app,/SAFETY_GRAPHIC_PACK_01\?\.pick\?\.\(c,t\)/);
 assert.match(app,/packVisuals\[0\]\|\|getTopicImage/);
 assert.match(adapter,/metadata: \(c\.metadata/);
 assert.match(printer,/nominal_minutes,metadata/);
 assert.ok(index.indexOf('graphic-pack-01.js')<index.indexOf('app.js'));
 assert.match(worker,/graphic-pack-01\.js/);
});
