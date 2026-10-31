import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const script=read('apps/training/deck-course-audit-v45-9.js');
function makeNode(){
 const flags=new Set(['hidden']),child={},events={};
 return {child,events,value:'',textContent:'',innerHTML:'',dataset:{},
  classList:{add:x=>flags.add(x),remove:x=>flags.delete(x),contains:x=>flags.has(x)},
  querySelector:id=>child[id]||null,addEventListener:(id,fn)=>events[id]=fn,
  fire:(id,event)=>events[id]?.(event),focus(){this.focused=true}};
}
function setup(){
 const root=makeNode(),body=makeNode(),events={},wind={},jumps=[];
 const controls=['#deckCourseAuditContext','#deckCourseAuditSummary','#deckCourseAuditModule','#deckCourseAuditFilter','#deckCourseAuditSearch','#deckCourseAuditCount','#deckCourseAuditList'];
 for(const id of controls)root.child[id]=makeNode();
 body.classList.add('deckmode');body.appendChild=()=>{};
 const document={body,createElement:()=>root,addEventListener:(id,fn)=>events[id]=fn};
 const window={__deck:{cid:'course',index:0},__deckSlides:[],deckGo:(cid,i)=>jumps.push([cid,i]),
  addEventListener:(id,fn)=>wind[id]=fn,SAFETY_MODAL_ACCESS:{opened(){},closed(){}}};
 runInNewContext(script,{document,window,location:{hash:'#deck/course/0'}});
 return {root,events,wind,window,jumps,ctrl:id=>root.child[id]};
}
test('inventory matches slide visual rendering and does not count video posters',()=>{
 const x=setup(),collect=x.window.SAFETY_DECK_COURSE_AUDIT_V45_9.collect;
 const rows=collect([
  {type:'module'}, {type:'concept',title:'Rischio',img:{src:'a.svg',caption:'Casco'},
    visualGallery:[{src:'b.svg',caption:''},{src:'c.svg',caption:'Guanti'},{src:'d.svg',caption:'Extra'}]},
  {type:'visualAtlas',visuals:[{src:'c.svg',caption:''},{src:'',caption:'Un altro'}]},
  {type:'video',img:{src:'poster.svg'}}, {type:'case',img:{src:''}},
  {type:'sourceDigest',img:{src:'',caption:''}}
 ]);
 assert.equal(rows.length,6);assert.equal(rows[0].figures,0);assert.equal(rows[1].figures,3);
 assert.ok(rows[1].issues.some(t=>t.includes('Figura aggiuntiva')));
 assert.equal(rows[2].figures,2);assert.ok(rows[2].issues.some(t=>t.includes('testo alternativo')));
 assert.equal(rows[3].figures,0);assert.equal(rows[4].figures,0);
 assert.ok(rows[5].issues.some(t=>t.includes('sorgente originale')));
 assert.ok(rows[5].issues.some(t=>t.includes('didascalia originale')));
});
test('search and filters show only intended slides, escape user text and jump without altering completion',()=>{
 const x=setup(),s=x.window.__deckSlides;
 s.push({type:'module',moduleIndex:0,module:{title:'Primo'},title:'Modulo'});
 s.push({type:'concept',moduleIndex:0,module:{title:'Primo'},title:'Rischi <svg>',img:{src:'a.svg',caption:''}});
 s.push({type:'concept',moduleIndex:1,module:{title:'Secondo'},title:'Protezione',img:{src:'b.svg',caption:'Casco'}});
 assert.equal(x.window.SAFETY_DECK_COURSE_AUDIT_V45_9.open(),true);
 assert.match(x.ctrl('#deckCourseAuditSummary').textContent,/3 slide · 2 con immagini/);
 assert.match(x.ctrl('#deckCourseAuditList').innerHTML,/&lt;svg&gt;/);
 assert.doesNotMatch(x.ctrl('#deckCourseAuditList').innerHTML,/data-course-audit-jump="2"/);
 x.ctrl('#deckCourseAuditFilter').value='all';
 x.ctrl('#deckCourseAuditSearch').value='Protezione';
 x.ctrl('#deckCourseAuditSearch').fire('input');
 assert.match(x.ctrl('#deckCourseAuditList').innerHTML,/data-course-audit-jump="2"/);
 x.root.fire('click',{target:{closest:key=>key==='[data-course-audit-jump]'?{dataset:{courseAuditJump:'2'}}:null}});
 assert.deepEqual(x.jumps,[['course',2]]);
 assert.ok(x.root.classList.contains('hidden'));
});
test('account and different course close report; scan does not send network or write DB',()=>{
 const x=setup(),api=x.window.SAFETY_DECK_COURSE_AUDIT_V45_9;
 api.open();x.events['safety:auth-changed']();assert.ok(x.root.classList.contains('hidden'));
 api.open();x.window.__deck.cid='other';x.events['safety:deck-slide-rendered']();
 assert.ok(x.root.classList.contains('hidden'));
 assert.doesNotMatch(script,/fetch\s*\(|\.rpc\s*\(|localStorage|sessionStorage|new Image\s*\(|learning_events|active_seconds/);
 assert.match(script,/non verifica errori HTTP/);
});
test('feature is loaded in teacher panel with PWA cache, guide and both handoffs aligned',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 const teacher=read('apps/training/deck-teacher-tools-v45-7.js');
 const help=read('apps/training/admin-help-v22.js');
 assert.ok(teacher.includes('data-tools-course-audit')&&teacher.includes('SAFETY_DECK_COURSE_AUDIT_V45_9?.open?.()'));
 for(const n of ['deck-course-audit-v45-9.js','deck-course-audit-v45-9.css'])
  assert.ok(html.includes(n)&&sw.includes(n),n);
 assert.ok(html.indexOf('deck-visual-audit-v45-8.js')<html.indexOf('deck-course-audit-v45-9.js'));
 assert.match(sw,/const CACHE='safety-training-v46-0-teacher-guide'/);
 assert.ok(help.includes('Controlla figure del corso'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(p);
  assert.ok(doc.slice(0,800).includes('safety-training-v46-0-teacher-guide'));
  assert.ok(doc.includes('v45.9 — Report immagini intero corso'));
 }
 assert.ok(read('package.json').includes('tests/deck-course-audit-v45-9.test.mjs'));
});