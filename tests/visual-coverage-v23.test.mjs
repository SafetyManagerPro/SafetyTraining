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
test('every teaching graphic is positioned in one topic of its assigned real published course',()=>{
 const keys=new Set(["generale","lav_alto","lav_medio","lav_basso","lav_quota","antincendio","antincendio_l1","primo_soccorso_12h","attr_carrelli_ind","attr_ple","attr_gru_autocarro","attr_mmt_all","dl_spp_chimico","dl_base","preposto","rls","verde","backoffice","frontoffice","ecologici","polizia","emergenze_evacuazione"]);
 const groups=new Map();
 for(const x of m.assets){if(x.role==='brand')continue;assert.ok(keys.has(x.course_key),'unpublished/frozen target: '+x.course_key);
  if(!groups.has(x.course_key))groups.set(x.course_key,[]);groups.get(x.course_key).push(x);
 }
 for(const [key,assets] of groups){
  const course={id:key,title:'Corso '+key,metadata:{},presentation_generated_from_db:true,
   topics:[{id:key+'-intro',title:'Introduzione alla sicurezza',summary:'Informazioni generali',db_backed:true},
           {id:key+'-specific',title:'Prevenzione, controllo e misure',summary:'Valutazione del rischio',db_backed:true}]};
  const placed=new Set(course.topics.flatMap(t=>m.forTopic(course,t).map(v=>v.src)));
  for(const x of assets)assert.ok(placed.has('assets/'+x.file),'not displayed in destination: '+x.file);
  const full=new Set(course.topics.flatMap(t=>atlas.collect(course,t).map(v=>v.src)));
  for(const x of assets)assert.ok(full.has('assets/'+x.file),'missing from projected/print atlas: '+x.file);
 }
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
