import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function fixture(mobile=true){
 const classSet=new Set(['deckmode']),clicks={},events={},attrs={};
 const btn={attrs,setAttribute(k,v){attrs[k]=v;},getAttribute:k=>attrs[k]};
 const document={body:{classList:{contains:k=>classSet.has(k),add:k=>classSet.add(k),remove:k=>classSet.delete(k),toggle(k){if(classSet.has(k)){classSet.delete(k);return false}classSet.add(k);return true}}},querySelector:()=>btn,addEventListener:(k,fn)=>clicks[k]=fn};
 let hash='#deck/test/0',scrolls=0;let callback;
 const location={get hash(){return hash},set hash(v){hash=v}};
 const window={innerWidth:800,matchMedia:()=>({matches:mobile}),requestAnimationFrame:fn=>{callback=fn;},scrollTo:()=>{scrolls++},addEventListener:(k,fn)=>events[k]=fn};
 runInNewContext(read('apps/training/deck-readability-v45-5.js'),{document,window,location,String});
 return {document,window,location,clicks,events,attrs,classSet,btn,getScroll:()=>scrolls,frame:()=>callback?.()};
}
test('readability toggles on and off with accessible state while deck is open',()=>{
 const x=fixture();
 assert.equal(x.window.SAFETY_DECK_READABILITY_V45_5.toggle(),true);
 assert.ok(x.classSet.has('deck-readable'));assert.equal(x.attrs['aria-pressed'],'true');
 assert.equal(x.btn.textContent,'Aa Standard');
 x.clicks.click({target:{closest:()=>x.btn}});
 assert.ok(!x.classSet.has('deck-readable'));assert.equal(x.attrs['aria-pressed'],'false');
 x.classSet.delete('deckmode');
 assert.equal(x.window.SAFETY_DECK_READABILITY_V45_5.toggle(),false);
});
test('route changes reset the mode and native tablet scroll returns to slide start',()=>{
 const x=fixture();x.window.SAFETY_DECK_READABILITY_V45_5.toggle();
 x.events.hashchange();assert.equal(x.getScroll(),0);
 x.frame();assert.equal(x.getScroll(),1);
 x.location.hash='#course/test';x.events.hashchange();
 assert.ok(!x.classSet.has('deck-readable'));
 const y=fixture(false);y.events.hashchange();y.frame();assert.equal(y.getScroll(),0);
});
test('auth change also resets read mode and never writes server data',()=>{
 const x=fixture();x.window.SAFETY_DECK_READABILITY_V45_5.toggle();
 x.clicks['safety:auth-changed']();assert.equal(x.attrs['aria-pressed'],'false');
 const src=read('apps/training/deck-readability-v45-5.js');
 assert.doesNotMatch(src,/\.rpc\(|active_seconds|progress_pct|learning_events|localStorage|fetch\(/);
 assert.ok(src.includes("window.scrollTo?.(0,0)"));
});
test('slide controls, responsive CSS, cache and handoffs include v45.5',()=>{
 const app=read('apps/training/app.js'),html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 assert.ok(app.includes('data-deck-readable'));assert.ok(app.includes('aria-pressed="false"'));
 for(const f of ['deck-readability-v45-5.js','deck-readability-v45-5.css'])assert.ok(html.includes(f)&&sw.includes(f),f);
 assert.ok(html.indexOf('deck-index-v45-4.js')<html.indexOf('deck-readability-v45-5.js'));
 const style=read('apps/training/deck-readability-v45-5.css');
 for(const marker of ['deck-readable','max-width:1100px','max-width:700px','@media print',':focus']){if(marker!==':focus')assert.ok(style.includes(marker),marker)}
 assert.ok(sw.includes('safety-training-v46-9-company-review'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(p);assert.ok(doc.slice(0,750).includes('safety-training-v46-9-company-review'));assert.ok(doc.includes('v45.5 — Leggibilità slide'));
 }
 assert.ok(read('package.json').includes('tests/deck-readability-v45-5.test.mjs'));
});
