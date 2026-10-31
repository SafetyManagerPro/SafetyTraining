import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function node(){
 const events={},children={},classes=new Set(['hidden']),attrs={};
 return {events,children,attrs,textContent:'',innerHTML:'',disabled:false,
 classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},
 addEventListener:(k,fn)=>events[k]=fn,querySelector:k=>children[k]||null,
 setAttribute:(k,v)=>attrs[k]=v,focus(){this.focused=true},
 fire:(k,e)=>events[k]?.(e)};
}
function setup(){
 const panel=node(),blank=node(),clock=node(),toggle=node(),reset=node(),panelClose=node(),blankResume=node(),button=node(),events={},winds={};
 Object.assign(panel.children,{'#deckTeacherClock':clock,'[data-tools-toggle]':toggle,'[data-tools-reset]':reset,'[data-tools-close]':panelClose});
 Object.assign(blank.children,{'[data-tools-resume]':blankResume});
 const body=node();body.classList.add('deckmode');body.appendChild=()=>{};
 const document={body,querySelector:()=>button,createElement:(()=>{let i=0;return()=>i++===0?panel:blank})(),addEventListener:(k,fn)=>events[k]=fn};
 let now=1_000_000,activeInterval,cleared=0,opened=0,closed=0,hash='#deck/c1/3';
 const location={get hash(){return hash},set hash(v){hash=v}};
 const window={__deck:{cid:'c1',index:3},addEventListener:(k,fn)=>winds[k]=fn,
 SAFETY_MODAL_ACCESS:{opened:()=>opened++,closed:()=>closed++}};
 const ctx={window,document,location,Date:{now:()=>now},Math,Number,String,
 setInterval:(fn,delay)=>{activeInterval=fn;assert.equal(delay,1000);return 6;},
 clearInterval:id=>{assert.equal(id,6);cleared++;activeInterval=null;}};
 runInNewContext(read('apps/training/deck-teacher-tools-v45-7.js'),ctx);
 return {window,document,location,panel,blank,clock,toggle,reset,panelClose,blankResume,button,events,winds,
 advance:ms=>{now+=ms;activeInterval?.()},getOpened:()=>opened,getClosed:()=>closed,getCleared:()=>cleared};
}
test('teacher timer is opt-in, persists across slide changes but not across course or route',()=>{
 const x=setup(),api=x.window.SAFETY_DECK_TEACHER_V45_7;
 x.events['safety:deck-slide-rendered']();
 assert.equal(api.readElapsed(),0);
 assert.equal(api.showPanel(),true);assert.equal(x.getOpened(),1);
 assert.equal(x.clock.textContent,'00:00');
 assert.equal(api.toggleTimer(),true);x.advance(125_000);
 assert.equal(x.clock.textContent,'02:05');
 assert.equal(x.button.textContent,'⏱ 02:05');
 x.window.__deck.index=4;x.events['safety:deck-slide-rendered']();
 assert.equal(api.readElapsed(),125000);
 assert.equal(api.toggleTimer(),false);x.advance(5000);assert.equal(api.readElapsed(),125000);
 assert.equal(x.toggle.attrs['aria-pressed'],'false');
 x.window.__deck.cid='c2';x.events['safety:deck-slide-rendered']();
 assert.equal(api.readElapsed(),0);
 x.location.hash='#course/c2';x.winds.hashchange();
 assert.equal(api.readElapsed(),0);
 assert.ok(!x.document.body.classList.contains('deck-tools-paused'));
});
test('blank projection is a focus-managed overlay; resumes without slide movement',()=>{
 const x=setup(),api=x.window.SAFETY_DECK_TEACHER_V45_7;
 api.showPanel();api.closePanel();assert.equal(api.showBlank(),true);
 assert.equal(x.blankResume.focused,true);
 assert.ok(!x.blank.classList.contains('hidden'));
 let blocked=false;
 x.events.keydown({key:'ArrowRight',defaultPrevented:false,preventDefault:()=>{blocked=true},stopImmediatePropagation(){}});
 assert.equal(blocked,true);
 api.closeBlank();assert.ok(x.blank.classList.contains('hidden'));
 assert.equal(x.window.__deck.index,3);
 assert.equal(x.getOpened(),2);assert.equal(x.getClosed(),2);
});
test('auth and route changes reset transient tools; not attendance',()=>{
 const x=setup(),api=x.window.SAFETY_DECK_TEACHER_V45_7;
 api.showPanel();api.toggleTimer();x.advance(1234);
 x.events['safety:auth-changed']();
 assert.equal(api.readElapsed(),0);assert.ok(x.panel.classList.contains('hidden'));
 assert.ok(x.getCleared()>0);
 const code=read('apps/training/deck-teacher-tools-v45-7.js');
 assert.doesNotMatch(code,/\.rpc\(|learning_progress|learning_events|active_seconds|localStorage|fetch\(/);
 assert.ok(code.includes('Cronometro personale del docente'));
});
test('v45.7 assets, cache and handoffs match; earlier modules load first',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 for(const asset of ['deck-teacher-tools-v45-7.js','deck-teacher-tools-v45-7.css'])assert.ok(html.includes(asset)&&sw.includes(asset),asset);
 assert.ok(html.indexOf('deck-figure-viewer-v45-6.js')<html.indexOf('deck-teacher-tools-v45-7.js'));
 assert.ok(read('apps/training/app.js').includes('data-deck-tools-open'));
 assert.ok(sw.includes('safety-training-v46-3-equipment-depth'));
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
 const content=read(path);assert.ok(content.slice(0,850).includes('safety-training-v46-3-equipment-depth'));
 assert.ok(content.includes('v45.7 — Strumenti aula e pausa proiezione'));
 }
 assert.ok(read('package.json').includes('tests/deck-teacher-tools-v45-7.test.mjs'));
});
