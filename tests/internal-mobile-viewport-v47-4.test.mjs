import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const mobile=read('apps/training/internal-slide-v47-3.css');
const reader=read('apps/training/internal-player-v47.js');
const index=read('apps/training/interno.html');
const source=read('apps/training/app.js');
const copied=read('apps/training/internal-original-deck-v47-3.js');

test('v47.4: original slide is positioned relative to mobile stage, not a 1600px grid track',()=>{
 assert.match(mobile,/#internalApp \.deck-stage\s*\{[^}]*display:block!important/s);
 assert.match(mobile,/#internalApp \.deck-stage\s*\{[^}]*overflow:hidden!important/s);
 assert.match(mobile,/#internalApp \.deck-stage > \.projector-slide\s*\{[^}]*position:absolute!important/s);
 assert.match(mobile,/#internalApp \.deck-stage > \.projector-slide\s*\{[^}]*left:50%;[^}]*top:50%;/s);
 assert.match(mobile,/#internalApp\s*\{[^}]*padding:0!important/s);
 assert.match(reader,/translate\(-50%, -50%\) scale\(/);
 assert.doesNotMatch(reader,/slide\.style\.transform='scale\('/);
});

test('v47.4: 1600x900 slide remains wholly inside narrow and rotated phone stages',()=>{
 const W=1600,H=900,pad=12;
 for(const [stageW,stageH] of [[320,568],[360,640],[375,667],[390,750],[430,800],[844,300],[812,320],[768,840],[1024,650]]){
  const scale=Math.min(Math.max(.1,(stageW-pad*2)/W),Math.max(.1,(stageH-pad*2)/H));
  const left=(stageW-W*scale)/2;
  const top=(stageH-H*scale)/2;
  const right=left+W*scale,bottom=top+H*scale;
  assert.ok(left>=0&&top>=0,'offscreen left/top '+stageW+'x'+stageH);
  assert.ok(right<=stageW&&bottom<=stageH,'offscreen right/bottom '+stageW+'x'+stageH);
  assert.ok(W*scale>100&&H*scale>100,'unexpected invisible deck '+stageW+'x'+stageH);
 }
});

test('v47.4: refit slide when phone orientation and visual viewport change',()=>{
 assert.match(reader,/stage\.clientWidth,h=stage\.clientHeight/);
 assert.match(reader,/if\(w<1\|\|h<1\)return/);
 assert.match(reader,/new ResizeObserver\(\(\)=>requestAnimationFrame\(fit\)\)/);
 assert.match(reader,/stageResizeObserver\.observe\(stage\)/);
 assert.match(reader,/window\.visualViewport\?\.addEventListener\?\.\('resize'/);
});

test('v47.4: link-only access and source slide rendering stay untouched',()=>{
 assert.match(reader,/SAFETY_DECK_RENDER\.deckSlideBody\(s,i\)/);
 assert.match(reader,/request\('slide',fields\)/);
 assert.match(reader,/parseToken\(\)/);
 assert.match(index,/internal-original-deck-v47-3\.js/);
 assert.match(index,/internal-slide-v47-3\.css/);
 assert.doesNotMatch(index,/cloud-v20\.js|access-gate-v46-10\.js|<input[^>]+password/);
 const start=source.indexOf('function fmtMin(m){');
 const end=source.indexOf('// Cache one compiled presentation',start);
 assert.ok(start>0&&end>start);
 assert.ok(copied.includes(source.slice(start,end).trim()),'original slide builder must not change');
});
