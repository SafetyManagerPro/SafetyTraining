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
 for(const [q,re] of [['Medico competente',/Art. 58/],['Coordinatore per l’esecuzione',/Art. 158/],
   ['Lavoratori autonomi',/Art. 160/],['Progettisti e fabbricanti',/Art. 57/]]){
   assert.match(sanctions.renderFor({title:q}),re);
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
