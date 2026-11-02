import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('apps/training/admin-scrollbars-v46-6.js');
const css=read('apps/training/admin-scrollbars-v46-6.css');
function init(){
 const callbacks=new Map();
 const document={readyState:'loading',body:{classList:{contains:()=>false}},
  getElementById(){return null;},addEventListener(name,cb){callbacks.set(name,cb);}};
 const window={};
 runInNewContext(source,{document,window,MutationObserver:class{},requestAnimationFrame(){}});
 return {api:window.SAFETY_ADMIN_SCROLLBARS_V46_6,callbacks,document};
}
function table(cols=5,{wrapped=false,inline=false,width=340,tableWidth=750,print=false}={}){
 const scope={contains(){return true}};
 const parent={clientWidth:width,style:{overflow:inline?'auto':''},parentElement:scope};
 const node={tHead:{rows:[{cells:Array(cols).fill({})}]},rows:[],scrollWidth:tableWidth,
  parentElement:parent,closest(selector){
   if(selector.includes('#adminPrintableSlides'))return print?{}:null;
   if(selector.includes('.admin-table-wrap'))return wrapped?{}:null;
   return null;
  }};
 return {scope,node,parent};
}
test('v46.6 detects uncovered wide admin tables but leaves existing wrappers untouched',()=>{
 const {api}=init();
 const uncovered=table(7),covered=table(7,{wrapped:true}),inline=table(7,{inline:true});
 assert.equal(api.shouldWrap(uncovered.node,uncovered.scope),true);
 assert.equal(api.shouldWrap(covered.node,covered.scope),false);
 assert.equal(api.shouldWrap(inline.node,inline.scope),false);
 assert.equal(api.countColumns(uncovered.node),7);
 const printable=table(7,{print:true});
 assert.equal(api.shouldWrap(printable.node,printable.scope),false);
 const simple=table(2,{width:900,tableWidth:320});
 assert.equal(api.shouldWrap(simple.node,simple.scope),false);
 const simpleOverflow=table(2,{width:300,tableWidth:650});
 assert.equal(api.shouldWrap(simpleOverflow.node,simpleOverflow.scope),true);
 assert.equal(api.shouldWrap(uncovered.node,{contains:()=>false}),false);
});
test('v46.6 pins the sidebar scroll box, footer and the main viewport separately',()=>{
 assert.match(css,/#adminShell \.admin-nav>nav\s*\{/);
 assert.match(css,/min-block-size:0;/);
 assert.match(css,/flex:1 1 auto;/);
 assert.match(css,/overflow-y:auto;/);
 assert.match(css,/overflow-x:auto;/);
 assert.match(css,/#adminShell \.admin-nav-foot\{margin-block-start:0\}/);
 assert.match(css,/#adminShell \.admin-main\s*\{/);
 assert.match(css,/scrollbar-gutter:stable/);
 assert.match(css,/scrollbar-color:#80b6e2/);
 assert.match(css,/::-webkit-scrollbar/);
 assert.match(css,/#adminShell\.admin-shell\{\s*block-size:100dvh;/);
});
test('v46.6 allows local horizontal and vertical scrolling in all main admin table families',()=>{
 for(const fragment of ['.admin-table-wrap','.bp-table-wrap','.readiness-table-wrap','.a40-table',
  '.st-v465-tablewrap','.st-v466-scroll-table','.admin-check-list','.st-v465-history']){
  assert.ok(css.includes(fragment),fragment);
 }
 assert.match(css,/max-block-size:min\(68dvh,760px\)/);
 assert.match(css,/max-block-size:min\(58dvh,540px\)/);
 assert.match(css,/table thead th\{/);
 assert.match(css,/position:sticky/);
 assert.match(css,/#adminDetailOverlay \.admin-detail-body div:has\(>table\)/);
 assert.match(css,/#smCompositionOverlay \.sm-comp-body div:has\(>table\)/);
 assert.match(css,/#adminModal \.admin-modal-body\{overflow-x:auto\}/);
 assert.match(css,/@media print\{/);
 assert.match(css,/overflow:visible!important/);
});
test('v46.6 auto-enhances dynamic admin-only content without modifying business logic or print',()=>{
 for(const fragment of ["const content=()=>document.getElementById('adminContent')",
  'new MutationObserver','requestAnimationFrame','data','tabIndex','role','aria-label',
  '.admin-table-wrap','className=\'st-v466-scroll-table\'','printMode()']){
  assert.ok(source.includes(fragment),fragment);
 }
 assert.doesNotMatch(source,/\.rpc\s*\(|\.from\s*\(|fetch\s*\(|localStorage|sessionStorage|indexedDB/);
 assert.doesNotMatch(source,/delete\s*\(|setHash\s*\(|location\.hash|window\.open\s*\(/);
 assert.doesNotMatch(source,/observer\.observe\(document\.body/);
 const {callbacks}=init();
 assert.equal(typeof callbacks.get('DOMContentLoaded'),'function');
});
test('v46.6 entrypoint, PWA, CI and handoffs include navigation scrollbar release',()=>{
 const html=read('apps/training/index.html');
 assert.ok(html.includes('admin-scrollbars-v46-6.css'));
 assert.ok(html.includes('admin-scrollbars-v46-6.js'));
 assert.ok(html.indexOf('admin-menu-v39.js')<html.indexOf('admin-scrollbars-v46-6.js'));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-8-registration-email'/);
 assert.ok(sw.includes('./admin-scrollbars-v46-6.css'));
 assert.ok(sw.includes('./admin-scrollbars-v46-6.js'));
 assert.match(read('package.json'),/tests\/admin-scrollbars-v46-6\.test\.mjs/);
 const guide=read('apps/training/admin-help-v22.js');
 assert.match(guide,/Per scorrere il menu laterale/);
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(path);
  assert.ok(doc.slice(0,950).includes('safety-training-v46-8-registration-email'),path);
  assert.match(doc,/v46\.6 — Barre di scorrimento in Amministrazione/);
 }
});
