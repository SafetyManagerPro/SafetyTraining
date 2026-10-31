import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('apps/training/teacher-didactic-guide-v46.js');
function element(){
 const classes=new Set(['hidden']),children={},handlers={};
 return {children,handlers,textContent:'',innerHTML:'',
 classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},
 querySelector:k=>children[k]||null,addEventListener:(k,f)=>handlers[k]=f,
 trigger:(k,e)=>handlers[k]?.(e),focus(){this.focused=true}};
}
function setup(){
 const panel=element(),context=element(),sections=element(),cover=element(),reveal=element(),hide=element(),close=element(),body=element(),events={},winds={};
 Object.assign(panel.children,{'#v46GuideContext':context,'#v46GuideSections':sections,'#v46GuideCover':cover,'[data-v46-reveal]':reveal,'[data-v46-hide]':hide,'[data-v46-close]':close});
 body.classList.add('deckmode');body.appendChild=()=>{};
 const document={body,createElement:()=>panel,addEventListener:(k,fn)=>events[k]=fn};
 let opened=0,closed=0;
 const window={__deck:{cid:'c1',index:0},__deckSlides:[],addEventListener:(k,fn)=>winds[k]=fn,
 SAFETY_MODAL_ACCESS:{opened:()=>opened++,closed:()=>closed++}};
 runInNewContext(code,{document,window,location:{hash:'#deck/c1/0'}});
 return {panel,context,sections,cover,reveal,hide,close,body,events,winds,window,getOpened:()=>opened,getClosed:()=>closed};
}
test('v46 derives teacher guide from existing authored data without inventing instructions',()=>{
 const x=setup(),api=x.window.SAFETY_TEACHER_GUIDE_V46;
 const info=api.guide({type:'case',title:'Rischio <elettrico>',module:{title:'Impianti'},start:10,end:12,
 case:'Cavo danneggiato',question:'Cosa fare?',answer:'RISPOSTA RISERVATA',
 topic:{summary:'Isolare il pericolo',teacher:'Usa un caso reale',teaching_steps:['0–5 min: osserva','5–10 min: confronto'],
 teacher_expansion:['Esempio discusso'],guided:{apply:['Segnala il guasto']},common_errors:['Intervenire da soli']}},4);
 assert.equal(info.title,'Rischio <elettrico>');assert.equal(info.duration,2);
 assert.ok(info.sections.some(p=>p.label==='Domanda da porre all’aula'&&p.items[0]==='Cosa fare?'));
 assert.ok(info.sections.some(p=>p.label==='Scaletta indicativa dell’argomento'));
 const rendered=api.markup(info);
 assert.match(rendered,/Rischio|Cavo danneggiato/);
 assert.doesNotMatch(rendered,/RISPOSTA RISERVATA/);
 assert.match(rendered,/Intervenire da soli/);
 const safe=api.markup({sections:[{label:'Titolo',items:['<img src=x onerror=alert(1)>']}]});
 assert.match(safe,/&lt;img/);assert.doesNotMatch(safe,/<img/);
});
test('v46 handles missing teacher details and module heading without fabricated technical content',()=>{
 const api=setup().window.SAFETY_TEACHER_GUIDE_V46;
 const empty=api.guide({},2);
 assert.equal(empty.sections.length,0);
 assert.match(api.markup(empty),/non sono disponibili note didattiche/);
 const module=api.guide({type:'module',title:'Primo modulo',topics:[{title:'Introduzione'},{title:'Protezione'}]},0);
 assert.equal(module.sections.length,1);assert.equal(module.sections[0].items.length,2);
 const quiz=api.guide({type:'quiz',quiz:{q:'Qual è la scelta?',answers:['Segreto'],correct:0},
 topic:{teacher:'Presenta la domanda'}},1);
 const text=api.markup(quiz);
 assert.match(text,/Qual è la scelta/);assert.doesNotMatch(text,/Segreto/);
});
test('v46 focus-managed panel closes when slide or account changes and never persists state',()=>{
 const x=setup(),a=x.window.SAFETY_TEACHER_GUIDE_V46;
 x.window.__deckSlides=[{type:'explain',title:'Prova',explain:'Spiegazione corretta',module:{title:'Base'},end:5,start:3}];
 assert.equal(a.open(),true);assert.equal(x.getOpened(),1);
 assert.match(x.context.textContent,/Slide 1/);
 assert.equal(x.sections.innerHTML,'');
 assert.equal(x.sections.hidden,true);
 assert.equal(x.reveal.focused,true);
 x.panel.trigger('click',{target:{closest:k=>k==='[data-v46-reveal]'?{}:null}});
 assert.match(x.sections.innerHTML,/Spiegazione corretta/);
 assert.equal(x.cover.hidden,true);
 assert.equal(x.sections.hidden,false);
 x.window.__deck.index=1;x.events['safety:deck-slide-rendered']();
 assert.ok(x.panel.classList.contains('hidden'));assert.equal(x.getClosed(),1);
 x.window.__deck.index=0;a.open();x.events['safety:auth-changed']();
 assert.ok(x.panel.classList.contains('hidden'));
 assert.doesNotMatch(code,/fetch\s*\(|\.rpc\s*\(|localStorage|sessionStorage|indexedDB|learning_events|active_seconds|\.insert\s*\(|\.update\s*\(/);
});
test('v46 modules, PWA, guide and handoffs synchronized without Vercel calls',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 const teacher=read('apps/training/deck-teacher-tools-v45-7.js'),help=read('apps/training/admin-help-v22.js');
 for(const asset of ['teacher-didactic-guide-v46.js','teacher-didactic-guide-v46.css']){
  assert.ok(html.includes(asset)&&sw.includes(asset),asset);
 }
 assert.ok(teacher.includes('data-tools-teacher-guide'));
 assert.ok(teacher.includes('SAFETY_TEACHER_GUIDE_V46?.open?.()'));
 assert.ok(html.indexOf('deck-course-audit-v45-9.js')<html.indexOf('teacher-didactic-depth-v46-2.js'));
 assert.ok(html.indexOf('teacher-didactic-depth-v46-2.js')<html.indexOf('teacher-didactic-guide-v46.js'));
 assert.match(sw,/const CACHE='safety-training-v46-2-didactic-depth'/);
 assert.ok(help.includes('Guida didattica'));
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(path);
  assert.ok(doc.slice(0,850).includes('safety-training-v46-2-didactic-depth'));
  assert.ok(doc.includes('v46.0 — Guida docente contestuale'));
 }
 assert.ok(read('package.json').includes('tests/teacher-didactic-guide-v46.test.mjs'));
});
