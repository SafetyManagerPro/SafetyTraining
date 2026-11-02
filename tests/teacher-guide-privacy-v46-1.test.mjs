import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function el(){const cl=new Set(['hidden']),child={},handlers={};return {child,handlers,hidden:false,innerHTML:'',textContent:'',classList:{add:k=>cl.add(k),remove:k=>cl.delete(k),contains:k=>cl.has(k)},querySelector:k=>child[k]||null,addEventListener:(k,f)=>handlers[k]=f,fire:(k,e)=>handlers[k]?.(e),focus(){this.focused=true}};}
function fixture(){
 const panel=el(),body=el(),events={},winds={};
 for(const k of ['#v46GuideContext','#v46GuideSections','#v46GuideCover','[data-v46-reveal]','[data-v46-hide]','[data-v46-close]'])panel.child[k]=el();
 body.classList.add('deckmode');body.appendChild=()=>{};
 const document={body,hidden:false,createElement:()=>panel,addEventListener:(k,f)=>events[k]=f};
 const window={__deck:{cid:'lesson',index:0},__deckSlides:[{type:'explain',title:'Prevenzione',explain:'Spiegazione',topic:{teacher:'SOLO PER IL DOCENTE'}}],addEventListener:(k,f)=>winds[k]=f,SAFETY_MODAL_ACCESS:{opened(){},closed(){}}};
 runInNewContext(read('apps/training/teacher-didactic-guide-v46.js'),{window,document,location:{hash:'#deck/lesson/0'}});
 const press=key=>panel.fire('click',{target:{closest:k=>k==='[data-v46-'+key+']'?{}:null}});
 return {panel,document,window,events,winds,press,node:key=>panel.querySelector(key)};
}
test('guide opens with private notes completely absent from DOM',()=>{
 const x=fixture(),a=x.window.SAFETY_TEACHER_GUIDE_V46;
 assert.equal(a.open(),true);
 assert.equal(x.node('#v46GuideSections').innerHTML,'');
 assert.equal(x.node('#v46GuideSections').hidden,true);
 assert.equal(x.node('#v46GuideCover').hidden,false);
 x.press('reveal');
 assert.match(x.node('#v46GuideSections').innerHTML,/SOLO PER IL DOCENTE/);
 assert.equal(x.node('#v46GuideSections').hidden,false);
 x.press('hide');
 assert.equal(x.node('#v46GuideSections').innerHTML,'');
 assert.equal(x.node('#v46GuideSections').hidden,true);
});
test('background/fullscreen/slide changes clear revealed notes',()=>{
 const x=fixture(),a=x.window.SAFETY_TEACHER_GUIDE_V46;
 a.open();x.press('reveal');x.document.hidden=true;x.events.visibilitychange();
 assert.equal(x.node('#v46GuideSections').innerHTML,'');
 x.document.hidden=false;x.press('reveal');x.events.fullscreenchange();
 assert.equal(x.node('#v46GuideSections').innerHTML,'');
 x.press('reveal');x.window.__deck.index=1;x.events['safety:deck-slide-rendered']();
 assert.ok(x.panel.classList.contains('hidden'));
 assert.equal(x.node('#v46GuideSections').innerHTML,'');
 assert.equal(a.reveal(),false);
});
test('privacy rules and PWA documentation stay synchronized',()=>{
 const js=read('apps/training/teacher-didactic-guide-v46.js'),css=read('apps/training/teacher-didactic-guide-v46.css');
 assert.ok(js.includes('Mostra note su questo schermo'));assert.ok(js.includes("document.addEventListener('visibilitychange'"));
 assert.match(css,/#v46GuideSections\[hidden\]/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\s*\(|\.rpc\s*\(|learning_events|active_seconds/);
 const help=read('apps/training/admin-help-v22.js');assert.ok(help.includes('schermo proiettato'));
 const sw=read('apps/training/sw.js');assert.match(sw,/const CACHE='safety-training-v46-5-editorial-matrix'/);
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const s=read(p);assert.ok(s.slice(0,850).includes('safety-training-v46-5-editorial-matrix'));assert.ok(s.includes('v46.1 — Note docente protette'));
 }
});
