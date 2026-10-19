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
