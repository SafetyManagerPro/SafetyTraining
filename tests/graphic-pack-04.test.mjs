import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import vm from'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const w={SAFETY_GRAPHIC_PACK_01:{isFrozen:c=>!!c.metadata?.freeze_scope}};
vm.runInNewContext(read('apps/training/graphic-pack-04.js'),{window:w});
test('original standalone schematics are complete and have no foreign image embeddings',()=>{
assert.equal(w.SAFETY_GRAPHIC_PACK_04.items.length,54);
for(const i of w.SAFETY_GRAPHIC_PACK_04.items){assert.ok(existsSync(new URL('../apps/training/'+i.src,import.meta.url)));const s=read('apps/training/'+i.src);assert.match(s,/<svg xmlns=/);assert.match(s,/<\/svg>$/);assert.ok(s.includes('COMPORTAMENTO SICURO'));assert.ok(s.includes('DA EVITARE'));assert.doesNotMatch(s,/<image|data:image|<\/rect>/);}
});
test('selector honors DB and frozen / authored gates',()=>{
const p=w.SAFETY_GRAPHIC_PACK_04.pick,c={title:'Carrelli elevatori',presentation_generated_from_db:true},t={db_backed:true,title:'Pedoni e viabilità',id:'test'};
assert.equal(p(c,t).length,2);assert.equal(p({...c,metadata:{freeze_scope:true}},t).length,0);assert.equal(p(c,{...t,db_backed:false}).length,0);assert.equal(p(c,{...t,presentation_quality:{visual_mode:'authored'}}).length,2);
});
test('authored courses retain their hero visual and gain an additive gallery',()=>{
 const app=read('apps/training/app.js'),html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 assert.ok(app.includes('topicIllustrationsHtml(c,t)'));
 assert.ok(app.includes('const authoredMain='));
 assert.ok(app.includes('const img=authoredMain||packVisuals[0]'));
 assert.ok(app.includes('const visuals=topicAdditionalVisuals(c,t)'));
 assert.ok(html.includes('graphic-pack-04-gallery.css'));
 assert.ok(sw.includes('graphic-pack-04-gallery.css'));
});
test('family matching does not misclassify first-aid groups as cranes or generic words as PLE',()=>{
 const p=w.SAFETY_GRAPHIC_PACK_04.pick;
 const aid=p({title:'Primo soccorso - Gruppo A',presentation_generated_from_db:true},{title:'Chiamata di emergenza',id:'aid-1',db_backed:true});
 assert.ok(aid.length>0);
 assert.ok(aid.every(x=>x.src.includes('-soccorso.svg')));
 const other=p({title:'Completo aggiornamento lavoratori',presentation_generated_from_db:true},{title:'Riconoscere rischi generali',id:'other-1',summary:'Regole per il personale',db_backed:true});
 assert.equal(other.length,0);
});
test('projector and PWA load original diagrams',()=>{
assert.ok(read('apps/training/index.html').includes('graphic-pack-04.js'));assert.ok(read('apps/training/app.js').includes('SAFETY_GRAPHIC_PACK_04?.pick'));const sw=read('apps/training/sw.js');assert.ok(sw.includes("const CACHE='safety-training-v22-"));assert.ok(sw.includes('gp04-pedoni-carrelli.svg'));
});