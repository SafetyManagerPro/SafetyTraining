import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const worker=read('apps/training/sw.js');
const cache=/const CACHE='([^']+)'/.exec(worker)?.[1];
const docs=['docs/SAFETYTRAINING_HANDOFF_LATEST.md','docs/SAFETYTRAINING_HANDOFF.md'];
test('both persistent handoffs identify the currently deployed PWA cache in their header',()=>{
 assert.ok(cache);
 for(const path of docs){
  const file=read(path);
  assert.match(file.slice(0,700),/Ultimo aggiornamento: 2026-10-19/);
  assert.ok(file.slice(0,700).includes('PWA \`'+cache+'\`')||file.slice(0,700).includes('PWA '+cache));
  assert.ok(file.includes('cancellazione')||file.includes('eliminazione'));
 }
});
test('most recent dated handoff entries are the same across both files',()=>{
 const headings=docs.map(p=>Array.from(read(p).matchAll(/^## 20\d\d-\d\d-\d\d\s+—\s+(.+)$/gm),m=>m[1]));
 assert.ok(headings[0].length>0);
 assert.equal(headings[0].at(-1),headings[1].at(-1));
 assert.match(headings[0].at(-1),/v22\.14/);
});
test('latest handoffs preserve safety and course freeze constraints',()=>{
 for(const path of docs){
  const file=read(path);
  assert.match(file,/27 catalog entry frozen/);
  assert.match(file,/RSPP\/ASPP/);
 }
});
