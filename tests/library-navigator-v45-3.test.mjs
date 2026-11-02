import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function element(){
 const listeners={};
 return {
  value:'',hidden:false,disabled:false,open:false,dataset:{},className:'',textContent:'',
  innerHTML:'',children:[],listeners,
  addEventListener:(key,fn)=>{listeners[key]=fn;},setAttribute(){},
  appendChild(child){this.children.push(child);},before(child){this.inserted=child;},
  querySelector(name){return this.map?.[name]||null;},
  querySelectorAll(name){return this.map?.[name]||[];},
  fire(name){this.listeners[name]?.();},focus(){this.focused=true;}
 };
}
function scene(){
 const details=[element(),element(),element()];
 const sectionA=element(),sectionB=element();
 sectionA.map={'h2':element(),'.library-unit':details.slice(0,2)};
 sectionB.map={'h2':element(),'.library-unit':details.slice(2)};
 const controls={
  '#libraryUnitSearch':element(),'#libraryUnitCount':element(),'#libraryUnitEmpty':element(),
  '[data-library-expand]':element(),'[data-library-collapse]':element(),'[data-library-clear]':element()
 };
 const toolbar=element();toolbar.map=controls;
 const root=element();
 root.map={'.v45-library-toolbar':null,'.library-module':[sectionA,sectionB]};
 const doc={createElement:tag=>tag==='section'?toolbar:element()};
 const win={};
 runInNewContext(read('apps/training/library-navigator-v45-3.js'),{document:doc,window:win,String,Array,Map,Set});
 const modules=[
  {title:'Protezione',units:[{title:'Guanti',summary:'Uso DPI',content:{detail:'Normativa generale'}},{title:'Elmetti',summary:'Indossare',content:{detail:'Caduta materiali'}}]},
  {title:'Emergenze',units:[{title:'Allarme',summary:'Evacuazione',content:{detail:'Procedura sicura'}}]}
 ];
 win.SAFETY_LIBRARY_UX.mount(root,modules);
 return {root,toolbar,controls,details,sections:[sectionA,sectionB],modules,api:win.SAFETY_LIBRARY_UX};
}
test('searches unit content, hides empty modules and shows results',()=>{
 const {controls,details,sections}=scene();
 const search=controls['#libraryUnitSearch'];
 assert.equal(controls['#libraryUnitCount'].textContent,'3 di 3 Learning Unit visibili');
 search.value='procedura';search.fire('input');
 assert.deepEqual(details.map(x=>x.hidden),[true,true,false]);
 assert.deepEqual(sections.map(x=>x.hidden),[true,false]);
 assert.equal(details[2].open,true);
 assert.equal(controls['#libraryUnitCount'].textContent,'1 di 3 Learning Unit visibili');
 assert.equal(controls['#libraryUnitEmpty'].hidden,true);
 search.value='nonpresente';search.fire('input');
 assert.equal(controls['#libraryUnitCount'].textContent,'0 di 3 Learning Unit visibili');
 assert.equal(controls['#libraryUnitEmpty'].hidden,false);
 assert.equal(controls['[data-library-expand]'].disabled,true);
});
test('expands/collapses visible units; reset restores full list',()=>{
 const {controls,details,sections}=scene();
 controls['[data-library-collapse]'].fire('click');
 assert.ok(details.every(x=>!x.open));
 controls['[data-library-expand]'].fire('click');
 assert.ok(details.every(x=>x.open));
 controls['#libraryUnitSearch'].value='guanti';
 controls['#libraryUnitSearch'].fire('input');
 controls['[data-library-collapse]'].fire('click');
 assert.equal(details[0].open,false);
 assert.equal(details[1].open,true);
 controls['[data-library-clear]'].fire('click');
 assert.ok(details.every(x=>!x.hidden));
 assert.ok(sections.every(x=>!x.hidden));
 assert.equal(controls['#libraryUnitSearch'].value,'');
 assert.equal(controls['[data-library-clear]'].disabled,true);
});
test('v45.3 is wired to library only, preserves frozen assets and new cache',()=>{
 const cat=read('apps/training/catalog-browser.js'),index=read('apps/training/index.html');
 const sw=read('apps/training/sw.js'),cache='safety-training-v46-6-admin-scrollbars';
 assert.ok(cat.includes("window.SAFETY_LIBRARY_UX?.mount?.(root,mods)"));
 assert.ok(cat.includes('libraryRouteIs(key)'));
 assert.ok(cat.includes('state.libraryRequest++'));
 assert.ok(cat.includes("isLearner()"));
 assert.ok(index.includes('<script src="library-navigator-v45-3.js"></script>'));
 assert.ok(sw.includes('"./library-navigator-v45-3.js"'));
 assert.ok(sw.includes(cache));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const h=read(p);assert.ok(h.slice(0,780).includes(cache));assert.ok(h.includes('v45.3 — Esplorazione Learning Unit nella vista tecnica'));
 }
 assert.ok(read('package.json').includes('tests/library-navigator-v45-3.test.mjs'));
});
