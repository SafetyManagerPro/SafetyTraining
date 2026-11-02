import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function el(){
 const events={},set=new Set(['hidden']),map={};
 return {innerHTML:'',textContent:'',value:'',dataset:{},events,map,contains:()=>true,focus(){this.focused=true;},
  classList:{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x)},
  addEventListener:(k,fn)=>{events[k]=fn;},querySelector:k=>map[k]||null,fire:(k,e)=>events[k]?.(e)};
}
function setup(){
 const root=el(),module=el(),search=el(),count=el(),list=el(),current=el(),body=el(),de={},we={};
 body.classList.add('deckmode');body.appendChild=()=>{};
 Object.assign(root.map,{'#deckIndexModule':module,'#deckIndexSearch':search,'#deckIndexCount':count,'#deckIndexList':list,'#deckIndexCurrent':current});
 const document={body,createElement:()=>root,addEventListener:(k,fn)=>de[k]=fn};
 let opens=0,closes=0,jump;
 const window={__deck:{cid:'a',index:1},__deckSlides:[
  {type:'module',title:'DPI',moduleIndex:0,module:{title:'Protezione'}},
  {type:'explain',title:'Guanti',moduleIndex:0,module:{title:'Protezione'},topic:{title:'Mani'}},
  {type:'module',title:'Emergenze',moduleIndex:1,module:{title:'Emergenze'}},
  {type:'case',title:'Evacuazione',moduleIndex:1,module:{title:'Emergenze'}}],
  deckGo:(id,index)=>jump=[id,index],addEventListener:(k,fn)=>we[k]=fn,
  SAFETY_MODAL_ACCESS:{opened:()=>opens++,closed:()=>closes++}};
 runInNewContext(read('apps/training/deck-index-v45-4.js'),{document,window,Map,Number,String,Array});
 return {window,document,root,module,search,count,list,current,de,we,getJump:()=>jump,getOpens:()=>opens,getCloses:()=>closes};
}
test('opens current module, searches all titles and jumps without persistence',()=>{
 const x=setup();x.window.SAFETY_DECK_INDEX_V45_4.open();
 assert.equal(x.getOpens(),1);assert.equal(x.module.value,'0');
 assert.match(x.list.innerHTML,/Guanti/);assert.doesNotMatch(x.list.innerHTML,/Evacuazione/);
 assert.match(x.list.innerHTML,/aria-current="step"/);
 x.module.value='1';x.module.fire('change');
 assert.match(x.list.innerHTML,/Evacuazione/);
 x.search.value='guanti';x.search.fire('input');
 assert.match(x.list.innerHTML,/Guanti/);
 assert.match(x.count.textContent,/1 slide visibili su 4/);
 x.root.fire('click',{target:{closest:s=>s==='[data-deck-jump]'?{dataset:{deckJump:'1'}}:null}});
 assert.deepEqual(x.getJump(),['a',1]);assert.equal(x.getCloses(),1);
 assert.ok(x.root.classList.contains('hidden'));
});
test('rejects invalid slide and closes on route/auth changes',()=>{
 const x=setup();x.window.SAFETY_DECK_INDEX_V45_4.open();
 x.root.fire('click',{target:{closest:s=>s==='[data-deck-jump]'?{dataset:{deckJump:'1000'}}:null}});
 assert.equal(x.getJump(),undefined);
 x.we.hashchange();assert.ok(x.root.classList.contains('hidden'));
 x.window.SAFETY_DECK_INDEX_V45_4.open();x.de['safety:auth-changed']();
 assert.ok(x.root.classList.contains('hidden'));assert.equal(x.getCloses(),2);
});
test('keyboard guards and modal use existing focus manager',()=>{
 const app=read('apps/training/app.js'),idx=read('apps/training/deck-index-v45-4.js');
 for(const s of ['data-deck-index-open','e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey',
 "document.getElementById('deckIndexOverlay')?.classList.contains('hidden')===false",
 '[role="dialog"]','SAFETY_DECK_BOOKMARK_V42?.save?.(c,deck,index)'])assert.ok(app.includes(s),s);
 assert.ok(idx.includes('SAFETY_MODAL_ACCESS?.opened?.(el,close)'));
 assert.ok(idx.includes('SAFETY_MODAL_ACCESS?.closed?.(overlay)'));
 assert.doesNotMatch(idx,/\.rpc\(|active_seconds|learning_events|progress_pct|fetch\(|localStorage/);
});
test('assets and both handoffs report v45.4',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 for(const p of ['deck-index-v45-4.js','deck-index-v45-4.css'])assert.ok(html.includes(p)&&sw.includes(p),p);
 assert.ok(html.indexOf('app.js')<html.indexOf('deck-index-v45-4.js'));
 assert.ok(sw.includes('safety-training-v46-7-unified-journey'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const d=read(p);assert.ok(d.slice(0,800).includes('safety-training-v46-7-unified-journey'));assert.ok(d.includes('v45.4 — Indice slide docente'));
 }
 assert.ok(read('package.json').includes('tests/deck-index-v45-4.test.mjs'));
});
