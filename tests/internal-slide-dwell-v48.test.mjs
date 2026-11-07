import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const player=read('apps/training/internal-player-v47.js');
const page=read('apps/training/interno.html');

test('internal reader checks the reading time before any forward move in go()',()=>{
 assert.match(player,/async function go\(i\)\{\s*if\(state\.busy\|\|!Number\.isInteger\(i\)\|\|i<0\|\|i>=state\.deck\.length\)return;\s*if\(!dwellCanGo\(i\)\)\{dwellPaint\(\);return;\}/);
});

test('forward moves need the current slide to pass; back and resume to reached slides stay free',()=>{
 assert.match(player,/function dwellCanGo\(target\)\{\s*const i=state\.index;\s*if\(target<=i\|\|target<=dwell\.frontier\)return true;\s*if\(target>i\+1\)return false;\s*return dwellIsPassed\(i\);\s*\}/);
});

test('the reached frontier is set from the server resume point and advances only on success',()=>{
 assert.match(player,/dwell\.frontier=Number\.isInteger\(last\)&&last>=0\?last:0;/);
 assert.match(player,/state\.index=i;state\.lastSlide=i;dwell\.frontier=Math\.max\(dwell\.frontier,i\);/);
});

test('the gate is applied after every slide render and locks the next buttons',()=>{
 assert.match(player,/<\/aside>';\s*dwellSync\(\);/);
 assert.match(player,/document\.querySelectorAll\('#ipNext,#ipNextSide'\)/);
});

test('the helper is loaded on the internal page before the reader',()=>{
 const helperAt=page.indexOf('slide-dwell-gate-v48.js');
 const playerAt=page.indexOf('internal-player-v47.js');
 assert.ok(helperAt>0&&playerAt>helperAt);
});
