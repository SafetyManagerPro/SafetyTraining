import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function node(){
 const handlers={},children={},classes=new Set(['hidden']);
 return {handlers,children,style:{},textContent:'',src:'',currentSrc:'',alt:'',scrollLeft:5,scrollTop:8,disabled:false,
  classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
  addEventListener:(k,fn)=>{handlers[k]=fn;},querySelector:k=>children[k]||null,
  focus(){this.focused=true},removeAttribute(k){if(k==='src')this.src='';},closest:()=>null,fire:(k,e)=>handlers[k]?.(e)};
}
function fixture(){
 const root=node(),img=node(),caption=node(),counter=node(),zoom=node(),prev=node(),next=node();
 Object.assign(root.children,{'#figureImage':img,'#figureCaption':caption,'#figureCounter':counter,'#figureZoom':zoom,
  '[data-figure-prev]':prev,'[data-figure-next]':next,'[data-figure-minus]':node(),
  '[data-figure-plus]':node(),'[data-figure-close]':node(),'.figure-scroller':node()});
 const images=[node(),node()];images.forEach((n,i)=>{n.src='assets/figure-'+i+'.svg';n.currentSrc=n.src;n.alt='Figura '+i;n.closest=selector=>selector==='button,a'?null:{querySelector:()=>({textContent:'Didascalia '+i})};});
 const control=node(),events={},winds={},body=node();body.classList.add('deckmode');body.appendChild=()=>{};
 const document={body,createElement:()=>root,querySelector:k=>k==='[data-deck-figure-open]'?control:null,querySelectorAll:()=>images,
  addEventListener:(k,fn)=>{events[k]=fn}};
 let opened=0,closed=0;
 const window={__deck:{cid:'course',index:3},addEventListener:(k,fn)=>winds[k]=fn,SAFETY_MODAL_ACCESS:{opened:()=>opened++,closed:()=>closed++}};
 runInNewContext(read('apps/training/deck-figure-viewer-v45-6.js'),{document,window,Number,String,Array});
 return {window,document,root,img,caption,counter,zoom,prev,next,control,events,winds,opened:()=>opened,closed:()=>closed};
}
test('figure viewer opens existing slide image and navigates/zooms without route modification',()=>{
 const a=fixture(),api=a.window.SAFETY_DECK_FIGURES_V45_6;
 api.refresh();assert.equal(a.control.disabled,false);
 assert.equal(api.open(0),true);assert.equal(a.opened(),1);assert.equal(a.img.src,'assets/figure-0.svg');
 assert.equal(a.caption.textContent,'Didascalia 0');assert.equal(a.prev.disabled,true);
 assert.equal(api.move(1),true);assert.equal(a.img.src,'assets/figure-1.svg');
 api.zoom(2);assert.equal(a.img.style.width,'200%');assert.equal(a.zoom.textContent,'200%');
 assert.equal(api.move(1),false);api.close();assert.equal(a.closed(),1);
 assert.equal(a.window.__deck.index,3);assert.ok(a.root.classList.contains('hidden'));
});
test('out-of-range figures cannot open, viewer closes on change of slide, auth and route',()=>{
 const a=fixture(),api=a.window.SAFETY_DECK_FIGURES_V45_6;
 assert.equal(api.open(9),false);
 api.open();a.winds.hashchange();assert.ok(a.root.classList.contains('hidden'));
 api.open();a.events['safety:auth-changed']();assert.ok(a.root.classList.contains('hidden'));
 api.open();a.window.__deck.index=4;a.events['safety:deck-slide-rendered']();assert.ok(a.root.classList.contains('hidden'));
 a.document.body.classList.remove('deckmode');assert.equal(api.open(),false);
});
test('viewer excludes persisted evidence and preserves image editor and captions',()=>{
 const js=read('apps/training/deck-figure-viewer-v45-6.js'),app=read('apps/training/app.js');
 assert.ok(app.includes('data-deck-figure-open'));
 assert.equal((app.match(/new Event\('safety:deck-slide-rendered'\)/g)||[]).length,2);
 assert.ok(js.includes('SAFETY_MODAL_ACCESS?.opened?.(el,close)'));
 assert.ok(js.includes('SAFETY_MODAL_ACCESS?.closed?.(modal)'));
 assert.ok(js.includes("i.currentSrc||i.src"));
 assert.doesNotMatch(js,/\.rpc\(|learning_progress|active_seconds|learning_events|localStorage|fetch\(/);
});
test('v45.6 assets, PWA and handoffs are synchronized',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 for(const s of ['deck-figure-viewer-v45-6.js','deck-figure-viewer-v45-6.css'])assert.ok(html.includes(s)&&sw.includes(s));
 assert.ok(sw.includes('safety-training-v46-4-lesson-enrichment'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const h=read(p);assert.ok(h.slice(0,800).includes('safety-training-v46-4-lesson-enrichment'));assert.ok(h.includes('v45.6 — Figure ingrandite nelle slide'));
 }
 assert.ok(read('package.json').includes('tests/deck-figure-viewer-v45-6.test.mjs'));
});
