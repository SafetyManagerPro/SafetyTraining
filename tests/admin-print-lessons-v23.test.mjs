import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const context={window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){}},setTimeout,URL};
runInNewContext(read('apps/training/admin-print-lessons-v23.js'),context);
const book=context.window.SAFETY_ADMIN_PRINT_LESSONS_V23;
test('lesson print includes authored didactics and excludes quiz answers and private internals',()=>{
 const out=book.lessonHtml({title:'Rischi e DPI',unitVersion:2,minutes:45,content:{
  title:'Rischi e DPI',summary:'Testo della lezione',sections:[{title:'Procedura',steps:['Controllare i DPI']}],
  quiz:{question:'Quale risposta?',answer:'SEGRETO',correct:1},
  final_assessment:{solution:'SEGRETO2'},metadata:{secret:'SEGRETO3'}
 }},0);
 assert.match(out,/Testo della lezione/);
 assert.match(out,/Controllare i DPI/);
 assert.doesNotMatch(out,/SEGRETO|SEGRETO2|SEGRETO3|Quale risposta/);
});
test('nested content filters answer and solution keys',()=>{
 const out=book.renderValue([{title:'Scenario',steps:['Controllare'],answer:'RISPOSTA RISERVATA',solution:'NASCONDI'}]);
 assert.match(out,/Controllare/);
 assert.doesNotMatch(out,/RISPOSTA RISERVATA|NASCONDI/);
});
test('print excludes remote imagery, traversal, and unsafe source URLs',()=>{
 const img=book.renderVisuals([{asset:'../secret.svg'},{asset:'https://evil.example/x.svg'},{asset:'idea-risk-cycle.svg'}]);
 assert.match(img,/assets\/idea-risk-cycle\.svg/);
 assert.doesNotMatch(img,/secret|evil/);
 const links=book.renderSources([{url:'javascript:alert(1)',title:'Scorretta'},{url:'https://www.normattiva.it/',title:'Normattiva'}]);
 assert.match(links,/Normattiva/);
 assert.doesNotMatch(links,/href="javascript/);
});
test('complete print booklet distinguishes a teaching handout from attendance and certificate',()=>{
 const html=book.documentHtml({course:{title:'Corso prova',nominal_minutes:120},version:{version_number:3,status:'published'},
 modules:[{title:'Primo modulo',minutes:120,units:[{title:'Unità',unitVersion:1,minutes:120,content:{summary:'Lezione'}}]}]});
 assert.match(html,/Indice dei moduli/);
 assert.match(html,/Primo modulo/);
 assert.match(html,/Lezione/);
 assert.match(html,/non è un attestato/);
});
test('no browser-side mutations or certificate claims appear in print pipeline',()=>{
 const src=read('apps/training/admin-print-lessons-v23.js');
 assert.match(src,/platform_admins/);
 assert.match(src,/status!=='published'/);
 assert.match(src,/Stampa lezioni/);
 assert.doesNotMatch(src,/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(/);
});

test('operational content is retained for printed before-during-after sequences',()=>{
 const html=book.lessonHtml({title:'Unità operativa',minutes:45,unitVersion:1,content:{
  guided:{observe:['Guarda prima'],importance:['Perché'],apply:['Prova']},
  operational:{before:['Verifica area'],during:['Procedi con cautela'],after:['Registra esito'],
    if_problem:['Arresta la macchina'],who_to_involve:['Preposto']},
  deepdetail:['Analisi aggiuntiva']
 }},0);
 for(const expected of ['Guarda prima','Verifica area','Procedi con cautela','Registra esito',
   'Arresta la macchina','Preposto','Analisi aggiuntiva'])assert.match(html,new RegExp(expected));
});

test('print preflight counts all modules and refuses empty or draft learning units',()=>{
 const report=book.inspectBook({modules:[
   {title:'Modulo 1',units:[{title:'U1',unitStatus:'published',content:{summary:'Spiegazione'}}]},
   {title:'Modulo 2',units:[{title:'U2',unitStatus:'draft',content:{summary:'Non pronta'}},
      {title:'U3',unitStatus:'published',content:{quiz:{answer:'RISERVATO'}}}]}
 ]});
 assert.equal(report.moduleCount,2);
 assert.equal(report.unitCount,3);
 assert.equal(report.ready,false);
 assert.ok(report.issues.some(x=>/versione LU non pubblicata/.test(x)));
 assert.ok(report.issues.some(x=>/nessun contenuto didattico stampabile/.test(x)));
});
test('print preflight accepts real authored explanatory sections without quiz solutions',()=>{
 const report=book.inspectBook({modules:[{title:'Modulo',units:[
   {unitStatus:'published',content:{sections:[{title:'Avvio',procedures:['Controllo iniziale']}]}}
 ]}]});
 assert.equal(report.ready,true);
 assert.equal(report.unitCount,1);
});
test('print preflight rejects a wholly empty course and an empty module',()=>{
 const no=book.inspectBook({modules:[]});
 assert.equal(no.ready,false);
 const empty=book.inspectBook({modules:[{title:'Senza lezioni',units:[]}]});
 assert.equal(empty.ready,false);
});

test('printable preflight rejects empty section titles and empty arrays',()=>{
  const report=book.inspectBook({modules:[{title:'Modulo',units:[
    {unitStatus:'published',content:{sections:[{title:'Titolo soltanto',steps:[]}],objectives:[]}}
  ]}]});
  assert.equal(report.ready,false);
  assert.ok(report.issues.some(x=>/nessun contenuto didattico stampabile/.test(x)));
});
test('print selection stays available after a failed course load',()=>{
  const source=read('apps/training/admin-print-lessons-v23.js');
  assert.match(source,/let selectors='';/);
  assert.match(source,/host\(\)\.innerHTML=selectors\+'<section class="admin-card"><p role="alert"/);
});

test('long A4 booklet has a navigable module and every-lesson index without duplicate anchors',()=>{
 const modules=Array.from({length:7},(_,mi)=>({
  title:'Modulo '+(mi+1),minutes:180,
  units:Array.from({length:18},(_,ui)=>({
   title:'Lezione '+(mi+1)+'-'+(ui+1),unitVersion:2,unitStatus:'published',
   minutes:10,content:{summary:'Testo del modulo '+(mi+1)+' lezione '+(ui+1),quiz:{answer:'SEGRETO'}}
  }))
 }));
 const html=book.documentHtml({course:{title:'Corso lungo',description:'Percorso formativo',nominal_minutes:1260},
  version:{version_number:2,status:'published'},modules});
 assert.equal((html.match(/class="print-lesson" id="print-unit-/g)||[]).length,126);
 assert.equal((html.match(/href="#print-unit-/g)||[]).length,126);
 assert.equal((html.match(/class="print-module" id="print-module-/g)||[]).length,7);
 assert.equal((html.match(/href="#print-module-/g)||[]).length,7);
 assert.match(html,/id="print-unit-126"/);
 assert.doesNotMatch(html,/SEGRETO/);
 assert.equal(book.inspectBook({modules}).ready,true);
});
test('image preflight detects failed images and accepts loaded local assets',async()=>{
 const loaded={complete:true,naturalWidth:640,getAttribute:()=> 'assets/diagram.svg'};
 const broken={complete:true,naturalWidth:0,getAttribute:()=> 'assets/missing.svg'};
 const all=await book.verifyPrintImages({querySelectorAll:()=>[loaded,broken]});
 assert.equal(all.ready,false);
 assert.equal(all.checked,2);
 assert.deepEqual(Array.from(all.missing),['assets/missing.svg']);
 const ok=await book.verifyPrintImages({querySelectorAll:()=>[loaded]});
 assert.equal(ok.ready,true);
});
test('A4 layout supports multi-page index, chapter breaks, long list items and page margin number',()=>{
 const css=read('apps/training/admin-print-lessons-v23.css');
 assert.match(css,/@page\s*\{/);
 assert.match(css,/counter\(page\)/);
 assert.match(css,/\.print-module\{break-before:page/);
 assert.match(css,/\.print-toc\{break-after:page/);
 assert.match(css,/body\.admin-course-print #safetyPrintStage \.print-lesson,/);
 assert.match(css,/a\[href\^="#"\]:after\{content:none/);
 assert.match(css,/max-height:95mm/);
 assert.match(css,/print-toc > ol > li\{break-inside:auto/);
 assert.match(css,/print-toc > ol > li > ol > li\{break-inside:avoid/);
 assert.match(css,/body\.admin-course-print > :not\(#safetyPrintStage\)\{display:none!important/);
 assert.doesNotMatch(css,/body\.admin-course-print > \*\{visibility:hidden/);
});

test('the booklet is moved outside the scrollable admin shell and restored after printing',()=>{
 const page={id:'adminPrintableLessons',parentNode:null};
 const source={children:[],insertBefore(n,ref){
   const idx=this.children.indexOf(ref);
   if(idx<0)throw Error('missing reference');
   if(n.parentNode){const from=n.parentNode.children;from.splice(from.indexOf(n),1);}
   this.children.splice(idx,0,n);n.parentNode=this;
 },querySelector(s){return s==='#adminPrintableLessons'&&this.children.includes(page)?page:null;}};
 source.children.push(page);page.parentNode=source;
 const body={children:[],classList:{active:new Set(),add(v){this.active.add(v);},remove(v){this.active.delete(v);}},
   appendChild(n){
     if(n.parentNode){const a=n.parentNode.children;a.splice(a.indexOf(n),1);}
     this.children.push(n);n.parentNode=this;return n;
   }};
 function element(){return {id:'',children:[],parentNode:null,appendChild(n){
     if(n.parentNode){const a=n.parentNode.children;a.splice(a.indexOf(n),1);}
     this.children.push(n);n.parentNode=this;return n;
   },remove(){
     if(this.parentNode){const a=this.parentNode.children;a.splice(a.indexOf(this),1);this.parentNode=null;}
   }};}
 const doc=context.document;
 const previous={body:doc.body,getElementById:doc.getElementById,createElement:doc.createElement,createComment:doc.createComment};
 doc.body=body;
 doc.getElementById=id=>id==='adminContent'?source:null;
 doc.createElement=()=>element();
 doc.createComment=()=>element();
 try{
  assert.equal(book.beginPrintStage(),true);
  assert.equal(book.beginPrintStage(),false);
  assert.equal(source.children.includes(page),false);
  const stage=body.children.find(x=>x.id==='safetyPrintStage');
  assert.ok(stage);
  assert.equal(stage.children[0],page);
  assert.ok(body.classList.active.has('admin-course-print'));
  book.finishPrintStage();
  assert.equal(source.children.includes(page),true);
  assert.equal(body.children.length,0);
  assert.equal(body.classList.active.has('admin-course-print'),false);
  book.finishPrintStage(); // cleanup is idempotent
 }finally{
  book.finishPrintStage();
  Object.assign(doc,previous);
 }
});
test('print CSS keeps black ink and page content in a standalone, non-scrollable surface',()=>{
 const css=read('apps/training/admin-print-lessons-v23.css');
 assert.match(css,/#safetyPrintStage\{display:none;\}/);
 assert.match(css,/body\.admin-course-print #safetyPrintStage\{\s*display:block!important/);
 assert.match(css,/body\.admin-course-print #safetyPrintStage #adminPrintableLessons\{/);
 assert.match(css,/height:auto!important/);
 assert.match(css,/color:#111!important/);
 assert.doesNotMatch(css,/body\.admin-course-print #adminShell #adminContent/);
});
