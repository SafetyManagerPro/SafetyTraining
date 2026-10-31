import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function n(){
 const c=new Set(['hidden']),child={},events={};
 return {child,events,innerHTML:'',textContent:'',dataset:{},
 classList:{add:k=>c.add(k),remove:k=>c.delete(k),contains:k=>c.has(k)},
 querySelector:k=>child[k]||null,addEventListener:(k,fn)=>events[k]=fn,fire:(k,e)=>events[k]?.(e),focus(){this.focused=true}};
}
function make(){
 const root=n(),context=n(),summary=n(),list=n(),closer=n(),body=n(),events={},winds={},arr=[];
 Object.assign(root.child,{'#deckAuditContext':context,'#deckAuditSummary':summary,'#deckAuditResults':list,'[data-audit-close]':closer});
 body.classList.add('deckmode');body.appendChild=()=>{};
 let opened=0,closed=0,viewed=-1;
 const document={body,createElement:()=>root,querySelectorAll:()=>arr,addEventListener:(k,fn)=>events[k]=fn};
 const window={__deck:{cid:'test',index:0},__deckSlides:[{title:'Protezione'}],addEventListener:(k,fn)=>winds[k]=fn,
 SAFETY_MODAL_ACCESS:{opened:()=>opened++,closed:()=>closed++},SAFETY_DECK_FIGURES_V45_6:{open:i=>{viewed=i}}};
 runInNewContext(read('apps/training/deck-visual-audit-v45-8.js'),{document,window,Number,String,Array});
 const add=(data={})=>{
  const img={alt:data.alt??'Descrizione',src:'assets/img.svg',complete:data.complete??true,naturalWidth:data.width??250,
   getAttribute:()=>img.src,
   classList:{contains:()=>false},
   closest:selector=>selector==='button,a'?null:{querySelector:()=>({textContent:data.caption??'Didascalia'})}};
  arr.push(img);return img;
 };
 return {root,context,summary,list,events,winds,window,body,add,getOpen:()=>opened,getClose:()=>closed,viewed:()=>viewed};
}
test('loaded, broken and pending images are distinguished and metadata issues surfaced',()=>{
 const x=make();x.add();x.add({alt:'',caption:'',width:0});x.add({complete:false,width:0});
 const api=x.window.SAFETY_VISUAL_AUDIT_V45_8;
 assert.equal(api.open(),true);assert.equal(x.getOpen(),1);
 assert.match(x.context.textContent,/Slide 1/);
 assert.equal(x.summary.textContent,'3 figure · 1 con segnalazioni · 1 in caricamento');
 for(const term of ['Caricata','Errore caricamento','In caricamento','Testo alternativo mancante','Didascalia mancante','data-audit-view="1" disabled'])assert.ok(x.list.innerHTML.includes(term),term);
});
test('rendered text is escaped and opening preview preserves slide index',()=>{
 const x=make();x.add({caption:'<script>'});x.window.SAFETY_VISUAL_AUDIT_V45_8.open();
 assert.match(x.list.innerHTML,/&lt;script&gt;/);
 x.root.fire('click',{target:{closest:k=>k==='[data-audit-view]'?{dataset:{auditView:'0'}}:null}});
 assert.equal(x.viewed(),0);assert.equal(x.window.__deck.index,0);assert.equal(x.getClose(),1);
 x.window.SAFETY_VISUAL_AUDIT_V45_8.open();x.winds.hashchange();
 assert.ok(x.root.classList.contains('hidden'));
});
test('empty slides, image load refresh and route guard behave read-only',()=>{
 const x=make(),api=x.window.SAFETY_VISUAL_AUDIT_V45_8;
 api.open();assert.match(x.summary.textContent,/Nessuna figura/);
 const im=x.add({complete:false,width:0});api.refresh();
 assert.match(x.list.innerHTML,/In caricamento/);
 im.complete=true;im.naturalWidth=100;
 x.events.load({target:{closest:()=>true}});
 assert.match(x.list.innerHTML,/Caricata/);
 x.window.__deck.index=1;x.events['safety:deck-slide-rendered']();
 assert.ok(x.root.classList.contains('hidden'));
 const code=read('apps/training/deck-visual-audit-v45-8.js');
 assert.doesNotMatch(code,/\.rpc\(|localStorage|learning_events|progress_pct|active_seconds|fetch\(/);
 assert.match(code,/Non certifica pertinenza didattica/);
});
test('assets and both handoffs align with read-only teacher entry',()=>{
 const teacher=read('apps/training/deck-teacher-tools-v45-7.js'),html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 assert.ok(teacher.includes('data-tools-audit')&&teacher.includes('SAFETY_VISUAL_AUDIT_V45_8?.open?.()'));
 for(const s of ['deck-visual-audit-v45-8.js','deck-visual-audit-v45-8.css'])assert.ok(html.includes(s)&&sw.includes(s),s);
 assert.ok(html.indexOf('deck-teacher-tools-v45-7.js')<html.indexOf('deck-visual-audit-v45-8.js'));
 assert.ok(sw.includes('safety-training-v46-1-guide-privacy'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const h=read(p);assert.ok(h.slice(0,850).includes('safety-training-v46-1-guide-privacy'),p);
  assert.ok(h.includes('v45.8 — Verifica visiva slide'));
 }
 assert.ok(read('package.json').includes('tests/deck-visual-audit-v45-8.test.mjs'));
});
