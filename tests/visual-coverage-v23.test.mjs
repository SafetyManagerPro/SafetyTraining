import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const w={}; const ctx={window:w};
for(const f of ['graphic-pack-01.js','graphic-pack-02.js','graphic-pack-03.js','graphic-pack-04.js','visual-coverage-v23.js','graphic-atlas-v22.js'])runInNewContext(rd('apps/training/'+f),ctx);
const m=w.SAFETY_VISUAL_COVERAGE_V23,atlas=w.SAFETY_VISUAL_ATLAS_V22;
test('every actual local image has a declared destination and file',()=>{
 const items=m.assets;
 assert.equal(items.length,201);
 assert.equal(new Set(items.map(x=>x.file)).size,items.length);
 for(const x of items){assert.ok(existsSync(new URL('../apps/training/assets/'+x.file,import.meta.url)),x.file);assert.ok(x.role==='brand'||(x.role==='teaching'&&x.course_key),x.file);}
 assert.equal(items.filter(x=>x.role==='brand').length,1);
 assert.equal(items.find(x=>x.role==='brand').file,'cna-avellino.png');
});
test('graphic coverage only places assets in specifically relevant lessons',()=>{
 const c={id:'attr_carrelli_ind',title:'Carrelli',metadata:{},presentation_generated_from_db:true,topics:[
 {id:'intro',title:'Introduzione generale',summary:'Concetti introduttivi',db_backed:true},
 {id:'battery',title:'Batteria carrello e ricarica',summary:'Controlli batteria',db_backed:true}
 ]};
 const intro=m.forTopic(c,c.topics[0]);
 assert.equal(intro.length,0,'never force unrelated figures into first LU');
 const battery=m.forTopic(c,c.topics[1]);
 assert.ok(battery.some(x=>x.src.includes('gp02-forklift-battery.svg')),'subject-specific battery illustration stays available');
 const combined={...c,id:'attr_carrelli_all',stable_key:'attr_carrelli_all'};
 assert.ok(m.forTopic(combined,combined.topics[1]).some(x=>x.src.includes('gp02-forklift-battery.svg')),'16h forklift course uses relevant original diagram');
 const wrong={...c,id:'attr_ple',stable_key:'attr_ple'};
 assert.ok(!m.forTopic(wrong,wrong.topics[1]).some(x=>x.src.includes('gp02-forklift-battery.svg')),'no equipment family leakage');
 const tied={...combined,topics:[{id:'a',title:'Batteria carrello e ricarica',db_backed:true},{id:'b',title:'Batteria carrello e ricarica',db_backed:true}]};
 assert.ok(!m.forTopic(tied,tied.topics[0]).some(x=>x.src.includes('gp02-forklift-battery.svg')),'ambiguous lesson tie must be held');
 const inventory=m.assets.filter(x=>x.role==='teaching');
 assert.equal(inventory.length,200,'no original file was removed, only ungrounded placement is suppressed');
});
test('frozen and static courses cannot be decorated',()=>{
 const c={id:'attr_ple',presentation_generated_from_db:true,metadata:{freeze_scope:'catalog'},topics:[{id:'u',title:'PLE',db_backed:true}]};
 assert.equal(m.forTopic(c,c.topics[0]).length,0);
 assert.equal(m.forTopic({...c,metadata:{},presentation_generated_from_db:false},c.topics[0]).length,0);
});
test('the same placements appear in lessons, projector and two-up A4 slide printing',()=>{
 const app=rd('apps/training/app.js'),book=rd('apps/training/admin-print-lessons-v23.js'),slide=rd('apps/training/admin-print-slides-v23.js');
 assert.ok(app.includes('SAFETY_VISUAL_ATLAS_V22?.distribute'));
 assert.ok(book.includes('m.units.map(u=>lessonHtml(u,i++,printCourse))'));
 assert.ok(book.includes('SAFETY_VISUAL_ATLAS_V22?.collect'));
 assert.ok(slide.includes('projection.buildDeck(converted)'));
 assert.ok(app.includes('assets/cna-avellino.png'));
 assert.ok(book.includes('assets/cna-avellino.png'));
 const html=rd('apps/training/index.html'),sw=rd('apps/training/sw.js');
 assert.ok(html.indexOf('visual-coverage-v23.js')<html.indexOf('graphic-atlas-v22.js'));
 assert.ok(sw.includes('visual-coverage-v23.js'));
});
