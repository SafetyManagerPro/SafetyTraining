import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import{runInNewContext}from'node:vm';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function api(){
 const ctx={window:{}};for(const file of ['graphic-pack-01.js','graphic-pack-02.js','graphic-pack-03.js','graphic-pack-04.js','graphic-atlas-v22.js'])runInNewContext(rd('apps/training/'+file),ctx);
 return ctx.window.SAFETY_VISUAL_ATLAS_V22;
}
test('the atlas offers relevant original and authored images without editing source LUs',()=>{
 const atlas=api(),course={title:'Carrelli elevatori industriali',presentation_generated_from_db:true,metadata:{}};
 const topic={id:'l1',title:'Controlli preuso carrello e viabilità pedoni',summary:'Investimento di persone e corretta portata del carico',db_backed:true,presentation_quality:{visual_mode:'authored'},idea_images:[{file:'scene-generale.svg',caption:'Figura autoriale'}]};
 const original=JSON.stringify(topic),items=atlas.collect(course,topic);
 assert.ok(items.length>=4,'expected GP04, GP02 and authored graphics');
 assert.ok(items.some(x=>x.src==='assets/scene-generale.svg'));
 assert.ok(items.some(x=>x.src.includes('gp02-')));
 assert.ok(items.some(x=>x.src.includes('gp04-')));
 assert.equal(new Set(items.map(x=>x.src)).size,items.length);
 assert.equal(JSON.stringify(topic),original,'a presentation overlay must not mutate authored LU');
 assert.equal(atlas.collect({...course,metadata:{freeze_scope:'catalog'}},topic).length,0);
 assert.equal(atlas.collect({...course,presentation_generated_from_db:false},topic).length,0);
 assert.equal(atlas.collect(course,{...topic,db_backed:false}).length,0);
});
test('previously isolated original illustrations are selected when their lessons need them',()=>{
 const atlas=api(),course={title:'Lavoratori rischio specifico',presentation_generated_from_db:true,metadata:{}};
 for(const [name,expected] of [
  ['Stress termico e colpo di calore','idea-heat-stress.svg'],
  ['Archivio e scaffalature','idea-archive-safe.svg'],
  ['Organigramma delle figure della sicurezza','organigramma-sicurezza.svg'],
  ['Piramide dei pericoli e gerarchia del rischio','piramide-pericoli.svg'],
  ['Uso del compattatore rifiuti','idea-compactor-safe.svg']
 ]){
  const found=atlas.collect(course,{id:name,title:name,summary:'',db_backed:true}).map(x=>x.src);
  assert.ok(found.some(x=>x.endsWith(expected)),name+' -> '+found);
 }
});
test('all relevant diagrams reach an actual slide via figures or atlas continuation',()=>{
 const atlas=api(),c={title:'Carrelli elevatori',presentation_generated_from_db:true,metadata:{}};
 const t={id:'u',title:'Pedoni e carico, controlli preuso e visibilità',summary:'Controllo carrelli, zone pedonali e portata',db_backed:true};
 const slides=[{type:'concept',img:{src:'assets/general.svg'}},{type:'explain',img:{src:'assets/general.svg'}}];
 const expected=atlas.collect(c,t).map(x=>x.src);
 const actual=atlas.distribute(c,t,slides);
 const visible=new Set(actual.flatMap(s=>[s.img?.src,...(s.visualGallery||[]).map(v=>v.src),...(s.visuals||[]).map(v=>v.src)]));
 for(const img of expected)assert.ok(visible.has(img),'lost visual '+img);
 assert.ok(actual.length>=2);
 const long=atlas.distribute(c,t,[{type:'concept',img:{src:'assets/general.svg'}}]);
 assert.ok(long.some(x=>x.type==='visualAtlas'));
 assert.ok(long.filter(x=>x.type==='visualAtlas').every(x=>x.visuals.length===1),'one illustration per supplemental slide');
 assert.ok(long.every(x=>!x.visualGallery?.length),'no forced galleries on lead slides');
 assert.equal(long.filter(x=>x.type==='visualAtlas').length,expected.filter(src=>src!=='assets/general.svg').length);
});
test('projector printer and teaching booklet connect to identical artwork inventory',()=>{
 const app=rd('apps/training/app.js'),book=rd('apps/training/admin-print-lessons-v23.js'),slides=rd('apps/training/admin-print-slides-v23.js');
 assert.ok(app.includes('SAFETY_VISUAL_ATLAS_V22?.distribute'));
 assert.ok(app.includes('slideVisualFigure(s,s.title'));
 assert.ok(app.includes("s.type==='visualAtlas'"));
 assert.ok(book.includes('SAFETY_VISUAL_ATLAS_V22?.collect'));
 assert.ok(book.includes('atlas+sanction'));
 assert.ok(book.includes('nominal_minutes,metadata'));
 assert.ok(slides.includes("slide.visualGallery"));
 assert.ok(slides.includes("slide.visuals"));
 assert.ok(rd('apps/training/index.html').includes('graphic-atlas-v22.js'));
 assert.ok(rd('apps/training/sw.js').includes('graphic-atlas-v22.css'));
});
