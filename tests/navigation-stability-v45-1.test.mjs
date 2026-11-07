import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('catalog actions use data attributes, not inline executable strings',()=>{
 const source=read('apps/training/catalog-browser.js');
 assert.doesNotMatch(source,/onclick="openCatalog(?:Course|Library)\(/);
 for(const value of ['data-catalog-action="open"','data-catalog-action="library"','button.dataset.courseKey','encodeURIComponent(row.stable_key)','decodeURIComponent(p[1])'])assert.ok(source.includes(value),value);
 assert.ok(source.includes('data-catalog-retry'));
 assert.ok(source.includes('role="status"'));
});
test('catalog renders escaped identifiers and safely dispatches a course click',async()=>{
 let click,cardHtml='',counter='',hash='';
 const row={stable_key:"slug' onclick='alert(1)",title:'<Corso>',family:'Attrezzature',unit_count:4,nominal_minutes:180,version_status:'published'};
 const cards={contains:()=>true,addEventListener:(type,handler)=>{if(type==='click')click=handler;},set innerHTML(value){cardHtml=value;}};
 const elements={
  catalogBrowserRoot:{innerHTML:'',querySelector:()=>null},
  catalogSearch:{value:'',oninput:null},
  catalogFamily:{value:'',onchange:null},
  catalogCards:cards,
  catalogResultCount:{set textContent(v){counter=v;}}
 };
 const documentMock={readyState:'loading',body:{classList:{remove(){},add(){},toggle(){return false;}}},addEventListener(){},getElementById:id=>elements[id]||null};
 const locationMock={get hash(){return hash;},set hash(v){hash=v;}};
 const windowMock={SAFETY_CLOUD:{state:{client:{rpc:async()=>({data:[row],error:null})},user:{id:'admin'},learner:null}},SAFETY_DATA:[],SAFETY_ACCESS_V46_10:{isAuthenticated:()=>true,canBrowse:()=>true,canOpen:()=>true,rowsForViewer:rows=>rows}};
 runInNewContext(read('apps/training/catalog-browser.js'),{window:windowMock,document:documentMock,location:locationMock,console,setTimeout,encodeURIComponent,decodeURIComponent,Number,Set,String});
 await windowMock.SAFETY_CATALOG.load();
 assert.match(cardHtml,/slug&#039; onclick=&#039;alert\(1\)/);
 assert.doesNotMatch(cardHtml,/onclick="/);
 assert.equal(counter,'1 corso trovato');
 assert.equal(typeof click,'function');
 click({target:{closest:()=>({dataset:{catalogAction:'library',courseKey:row.stable_key}})}});
 assert.equal(hash,'library/'+encodeURIComponent(row.stable_key));
});
test('tablet menu uses the same breakpoint as reader CSS and updates ARIA state',()=>{
 const source=read('apps/training/catalog-browser.js'),index=read('apps/training/index.html');
 const mobile=read('apps/training/mobile-reader-v3.css');
 assert.ok(source.includes('usesMobileNavigation()'));
 assert.ok(source.includes('max-width: 1100px'));
 assert.ok(mobile.includes('max-width:1100px'));
 assert.ok(source.includes("setAttribute('aria-expanded','false')"));
 assert.ok(source.includes("setAttribute('aria-expanded',String(open))"));
 assert.ok(index.includes('aria-controls="trainingSidebar"'));
});
test('learner dialog reuses existing shared focus and escape manager',()=>{
 const learner=read('apps/training/learner-dashboard.js');
 const manager=read('apps/training/modal-access-v22.js');
 assert.ok(learner.includes('SAFETY_MODAL_ACCESS?.opened?.(shell,close)'));
 assert.ok(learner.includes('SAFETY_MODAL_ACCESS?.closed?.(shell)'));
 assert.ok(manager.includes("e.key==='Escape'"));
 assert.ok(manager.includes("e.key!=='Tab'"));
});
test('PWA and synchronized handoffs identify v45.1',()=>{
 const cache='safety-training-v48-slide-dwell';
 const sw=read('apps/training/sw.js');assert.ok(sw.includes(cache));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const c=read(p);assert.ok(c.slice(0,780).includes(cache),p);assert.ok(c.includes('v45.1 — Stabilizzazione navigazione e accessibilità'));
 }
 const pkg=read('package.json');assert.ok(pkg.includes('tests/navigation-stability-v45-1.test.mjs'));
});
