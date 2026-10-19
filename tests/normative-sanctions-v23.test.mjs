import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={window:{}};
runInNewContext(read('apps/training/normative-sanctions-v23.js'),ctx);
const sanctions=ctx.window.SAFETY_NORMATIVE_SANCTIONS_V23;
test('DVR sanctions identify nondelegable employer obligation without invented figures',()=>{
 const html=sanctions.renderFor({title:'Valutazione dei rischi e DVR'});
 assert.match(html,/Datore di lavoro/);
 assert.match(html,/Art. 55/);
 assert.match(html,/arresto o ammenda/);
 assert.match(html,/Importi omessi volutamente/);
});
test('DPI links sanctions for worker, employer and preposto, without blanket attribution',()=>{
 const html=sanctions.renderFor({title:'Uso dei DPI'});
 assert.match(html,/Lavoratore/);
 assert.match(html,/Preposto/);
 assert.match(html,/Datore di lavoro/);
 assert.match(html,/Art. 59/);
 assert.match(html,/Art. 56/);
});
test('medical, self-employed, coordinators and project roles have distinct statutory articles',()=>{
 for(const [title,id,number] of [
   ['Medico competente','health','58'],
   ['Coordinatore per l’esecuzione','site','158'],
   ['Lavoratori autonomi','autonomo','160'],
   ['Progettisti e fabbricanti','supply','57']]){
   const found=Array.from(sanctions.matches({title}),x=>x.id);
   assert.ok(found.includes(id),title);
   const record=sanctions.cases.find(x=>x.id===id);
   assert.match(record.references,new RegExp('\\b'+number+'\\b'),title);
 }
});
test('unrelated lesson does not receive generic or invented penalties',()=>{
 assert.equal(sanctions.renderFor({title:'Igiene delle mani e pulizia delle superfici'}),'');
});
test('no database writes or automatic penalty amounts and sanitation preserved',()=>{
 const src=read('apps/training/normative-sanctions-v23.js');
 assert.doesNotMatch(src,/\.update\s*\(|\.insert\s*\(|\.delete\s*\(|\.upsert\s*\(/);
 assert.match(src,/casi|circostanze|importi aggiornati/i);
 const app=read('apps/training/app.js');
 assert.match(app,/SAFETY_NORMATIVE_SANCTIONS_V23/);
 assert.match(app,/t\.db_backed/);
});

test('sanctions are not attached solely because a legal bibliography contains an article',()=>{
  const html=sanctions.renderFor({title:'La corretta manutenzione quotidiana',
    summary:'Controllare pulizia e ordine della postazione.',
    norm:'Articoli 17, 19, 20, 37, 55 e 59; DVR'});
  assert.equal(html,'');
});
test('topic summary can trigger applicable sanctions without requiring a title keyword',()=>{
  const html=sanctions.renderFor({title:'Le responsabilità individuali',
    summary:'I DPI devono essere impiegati correttamente.'});
  assert.match(html,/Art\. 59/);
});
test('legal references point to canonical, public official sources',()=>{
  const html=sanctions.renderFor({title:'La valutazione dei rischi e DVR'});
  assert.match(html,/normattiva\.it/);
  assert.match(html,/ispettorato\.gov\.it/);
});

test('new casebook includes eight distinct workplace hazard scenarios and precise role references',()=>{
 const examples=[
  ['DUVRI','interference','55'],
  ['Gestione delle emergenze e evacuazione','emergencies','43'],
  ['Primo soccorso','first-aid','45'],
  ['Antincendio','fire','46'],
  ['Segnaletica di sicurezza','signs','165'],
  ['Spazi confinati','confined','68'],
  ['POS','pos','159'],
  ['Cadute dall’alto','height','159']
 ];
 for(const [title,id,article] of examples){
  const selected=Array.from(sanctions.matches({title}),x=>x.id);
  assert.ok(selected.includes(id),'missing '+id+' for '+title);
  const html=sanctions.renderFor({title});
  assert.match(html,/Cosa verificare \/ come procedere/);
  assert.match(html,/<ul>/);
  const record=sanctions.cases.find(x=>x.id===id);
  assert.match(record.references,new RegExp('\\b'+article+'\\b'),title);
 }
});
test('inappropriate generic references do not add sanctions without subject matter',()=>{
 assert.equal(sanctions.renderFor({title:'Lavoro ordinario',summary:'Routine in ufficio',norm:'DUVRI, POS, incendio, art. 55'}),'');
});
test('casebook links current Normattiva and INL landing, not an outdated 2026 January PDF',()=>{
 const html=sanctions.renderFor({title:'Primo soccorso'});
 assert.match(html,/normattiva\.it/);
 assert.match(html,/ispettorato\.gov\.it\/documenti-e-normativa\//);
 assert.match(html,/gennaio 2026 può non includere modifiche successive/);
 assert.doesNotMatch(html,/TU-81-08-Ed\.-Gennaio-2026\.pdf/);
});
test('role-aware casebook remains read-only and has actions for all scenarios',()=>{
 assert.ok(sanctions.cases.length>=19);
 for(const item of sanctions.cases){
  assert.ok(Array.isArray(sanctions.practical[item.id]),item.id);
  assert.ok(sanctions.practical[item.id].length>=2,item.id);
  assert.ok(item.references.includes('D.Lgs. 81/2008')||item.references.includes('D.Lgs. 81/2008;'));
 }
});
