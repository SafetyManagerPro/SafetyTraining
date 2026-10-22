import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
for(const p of ['graphic-pack-01.js','graphic-pack-02.js','graphic-pack-03.js'])runInNewContext(read('apps/training/'+p),ctx);
const pack=ctx.window.SAFETY_GRAPHIC_PACK_03;
const course=(metadata={})=>({title:'Formazione lavoratori',presentation_generated_from_db:true,metadata});
const topic=(title,summary='',mode='auto-themed')=>({title,summary,db_backed:true,presentation_quality:{visual_mode:mode}});
test('twelve standalone, original and passive SVGs',()=>{
 assert.equal(pack.items.length,12);
 const ids=new Set();
 for(const item of pack.items){
  assert.ok(!ids.has(item.id));ids.add(item.id);
  const svg=read('apps/training/'+item.src);
  assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg,/<title id="title">/);
  assert.match(svg,/<desc id="desc">/);
  assert.match(svg,/ILLUSTRAZIONE DIDATTICA ORIGINALE/);
  assert.ok(svg.length>1800);
  assert.doesNotMatch(svg,/<script|<foreignObject|<image |onload=|href=|xlink:href=|<use\\b/i);
  assert.ok(svg.trim().endsWith('</svg>'));
 }
});
test('contextual matching chooses concrete, not universal filler diagrams',()=>{
 const cases=[['Gerarchia delle misure di prevenzione','gerarchia-prevenzione'],['Valutazione dei rischi: probabilità e gravità','matrice-rischio'],['Analisi di un near miss','near-miss'],['Il rischio elettrico','isolamento-elettrico'],['Movimentazione manuale dei carichi','movimentazione-carichi'],['Postazione VDT','postazione-vdt'],['SDS: leggere la scheda dati di sicurezza','scheda-sicurezza-chimica'],['Gestire rischi interferenziali','rischi-interferenziali']];
 for(const [name,id] of cases){const selected=Array.from(pack.pick(course(),topic(name)),x=>x.graphic_pack_id);assert.ok(selected.includes(id),name+' -> '+selected);}
 assert.equal(pack.pick(course(),topic('Ruoli e responsabilità','')).length,0);
 assert.equal(pack.pick(course(),topic('Intervista docente','')).length,0);
});
test('visuals never alter frozen, authored or non-DB lessons',()=>{
 const t=topic('Near miss');
 for(const meta of [{frozen:true},{freeze_scope:'catalog'},{is_frozen:true},{course_frozen:true}])assert.equal(pack.pick(course(meta),t).length,0);
 assert.equal(pack.pick(course(),topic('Near miss','','authored')).length,0);
 assert.equal(pack.pick({...course(),presentation_generated_from_db:false},t).length,0);
 assert.equal(pack.pick(course(),{...t,db_backed:false}).length,0);
});
test('same read-only buildDeck is used for A4 and projection',()=>{
 const app=read('apps/training/app.js'),html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 assert.ok(app.includes('SAFETY_GRAPHIC_PACK_03?.pick?.(c,t)'));
 assert.ok(app.indexOf('SAFETY_GRAPHIC_PACK_02?.pick')<app.indexOf('SAFETY_GRAPHIC_PACK_03?.pick'));
 assert.ok(html.indexOf('graphic-pack-02.js')<html.indexOf('graphic-pack-03.js'));
 assert.ok(html.indexOf('graphic-pack-03.js')<html.indexOf('app.js'));
 assert.match(sw,/const CACHE='safety-training-[^']+'/);
 for(const item of pack.items)assert.ok(sw.includes('./'+item.src),'missing '+item.src);
 assert.ok(read('apps/training/admin-print-slides-v23.js').includes('projection.buildDeck(converted)'));
 for(const verb of ['.upsert(','.delete(','.insert(','.update('])assert.ok(!read('apps/training/graphic-pack-03.js').includes(verb),'unexpected DB mutation '+verb);
});
