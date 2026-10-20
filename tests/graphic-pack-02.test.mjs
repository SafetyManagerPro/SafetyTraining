import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
runInNewContext(read('apps/training/graphic-pack-01.js'),ctx);
runInNewContext(read('apps/training/graphic-pack-02.js'),ctx);
const pack=ctx.window.SAFETY_GRAPHIC_PACK_02;
const course=(title='Carrelli elevatori',metadata={})=>({title,presentation_generated_from_db:true,metadata});
const lesson=(title,summary='',quality='auto-themed')=>({title,summary,db_backed:true,presentation_quality:{visual_mode:quality}});
test('48 original SVG diagrams: 16 general and eight in each equipment family',()=>{
 assert.equal(pack.items.length,48);
 const family={};
 for(const item of pack.items){
  family[item.family]=(family[item.family]||0)+1;
  const svg=read('apps/training/'+item.src);
  assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg,/<title id="title">/);
  assert.match(svg,/<desc id="desc">/);
  assert.match(svg,/<\/svg>$/);
  assert.match(svg,/ILLUSTRAZIONE DIDATTICA ORIGINALE/);
  assert.doesNotMatch(svg,/>undefined<\/text>/,'unfinished SVG labels '+item.src);
  assert.match(svg,/AZIONE PREVENTIVA/,'safety callout '+item.src);
  assert.doesNotMatch(svg,/<script|<foreignObject|<image |onload=|href=|xlink:href=|<use\b/i);
  assert.ok(svg.length>1400,item.src);
 }
 assert.deepEqual(family,{base:16,forklift:8,ple:8,crane:8,mmt:8});
});
test('equipment family selection requires subject and relevant lesson keyword',()=>{
 const cases=[
  ['Carrelli elevatori','Controlli preuso del carrello','forklift-preuse'],
  ['Carrelli elevatori','Viabilità: punti ciechi','forklift-blindspot'],
  ['Corso PLE','Ispezione della PLE','ple-preuse'],
  ['Corso PLE','Linee elettriche aeree','ple-power-lines'],
  ['Gru su autocarro','Segnali gestuali','crane-signaller'],
  ['Gru su autocarro','Diagramma di carico','crane-capacity'],
  ['MMT macchine movimento terra','Rischio al ciglio dello scavo','mmt-excavation-edge'],
  ['MMT macchine movimento terra','Sottoservizi','mmt-underground'],
  ['DPI lavoratori','Casco: controllo visivo','ppe-helmet-check'],
  ['Lavoratori - emergenze','Uscita di emergenza','exit-obstructed']
 ];
 for(const [name,title,id] of cases){
  const ids=Array.from(pack.pick(course(name),lesson(title)),x=>x.graphic_pack_id);
  assert.ok(ids.includes(id),name+' · '+title+' -> '+ids);
 }
 const combined={...course('Carrelli Elev. Ind + Telescopici + Rotativi (16h)'),stable_key:'attr_carrelli_all'};
 assert.ok(pack.pick(combined,lesson('Fonti di energia, batterie e sistemi di ricarica')).some(x=>x.graphic_pack_id==='forklift-battery'));
 assert.ok(pack.pick(combined,lesson('Controlli preuso del carrello')).some(x=>x.graphic_pack_id==='forklift-preuse'));
 assert.equal(pack.pick(course('Formazione generale'),lesson('Ruoli e responsabilità')).length,0);
 assert.equal(pack.pick(course('Formazione generale'),lesson('Baricentro e stabilità')).length,0);
});
test('frozen courses and authored visuals never change; static non-DB courses remain untouched',()=>{
 const t=lesson('Ribaltamento del carrello');
 for(const metadata of [{frozen:true},{freeze_scope:'catalog'},{is_frozen:true},{course_frozen:true}]){
  assert.equal(pack.pick(course('Carrelli elevatori',metadata),t).length,0);
 }
 assert.equal(pack.pick(course(),lesson('Controlli preuso','','authored')).length,0);
 assert.equal(pack.pick({...course(),presentation_generated_from_db:false},t).length,0);
 assert.equal(pack.pick(course(),{...t,db_backed:false}).length,0);
});
test('projector and A4 print reuse identical deck overlay without new course content or attendance',()=>{
 const app=read('apps/training/app.js'),index=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 assert.match(app,/SAFETY_GRAPHIC_PACK_02\?\.pick\?\.\(c,t\)/);
 assert.match(app,/SAFETY_GRAPHIC_PACK_01\?\.pick\?\.\(c,t\)/);
 assert.ok(index.indexOf('graphic-pack-01.js')<index.indexOf('graphic-pack-02.js'));
 assert.ok(index.indexOf('graphic-pack-02.js')<index.indexOf('app.js'));
 assert.match(sw,/graphic-pack-02\.js/);
 for(const item of pack.items)assert.ok(sw.includes('./'+item.src),'missing SW asset '+item.src);
 assert.match(read('apps/training/admin-print-slides-v23.js'),/projection\.buildDeck\(converted\)/);
 const reg=read('apps/training/graphic-pack-02.js');
 assert.doesNotMatch(reg,/\.upsert\(|\.delete\(|\.insert\(|\.update\(/);
});

test('every equipment scenario ID resolves to an actual illustrated asset',()=>{
 const variants={
  forklift:['preuse','blind','pedestrian','load','high','slope','battery','park'],
  ple:['preuse','stabilizers','pinch','electric','wind','harness','rescue','zone'],
  crane:['preuse','stabilizers','load','swing','signal','pinch','electric','capacity'],
  mmt:['preuse','access','swing','edge','slope','pipes','maintenance','blind']
 };
 const ids=new Set(pack.items.map(x=>x.id));
 const resolved=[];
 for(const [family,names] of Object.entries(variants)){
  for(const variant of names){
   const id=pack.resolveVariant(family,variant);
   assert.ok(ids.has(id),'unresolved '+family+'/'+variant+' -> '+id);
   resolved.push(id);
  }
 }
 assert.equal(resolved.length,32);
 assert.equal(new Set(resolved).size,32);
});
