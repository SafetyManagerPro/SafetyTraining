import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const helper=read('apps/training/slide-dwell-gate-v48.js');
const app=read('apps/training/app.js');
const index=read('apps/training/index.html');
const sw=read('apps/training/sw.js');

function load(){
 const window={};
 runInNewContext(helper,{window});
 return window.SAFETY_SLIDE_DWELL_V48;
}
const words=n=>Array.from({length:n},(_,i)=>'parola'+i).join(' ');

test('minimum reading time is at least three seconds and grows with text length',()=>{
 const g=load();
 assert.equal(g.requiredSeconds({type:'module'}),3);
 assert.equal(g.requiredSeconds({title:words(200)}),63);
 assert.equal(g.requiredSeconds({title:words(20)}),9);
});

test('minimum reading time is capped so a long slide never blocks a learner for good',()=>{
 const g=load();
 assert.equal(g.requiredSeconds({title:words(5000)}),180);
});

test('images, paths, module structure and hidden answers are not counted as reading',()=>{
 const g=load();
 const slide={title:'Titolo',src:'assets/figura-molto-lunga-con-nome-di-file.png',
  module:{title:words(400)},topic:{title:words(400)},visuals:[{caption:words(300)}],
  answer:words(300),revealAnswer:words(300),image:'https://example.test/img.png'};
 assert.equal(g.readingWords(slide),1);
 assert.equal(g.requiredSeconds(slide),3+1);
});

test('html markup inside text is stripped before counting words',()=>{
 const g=load();
 assert.equal(g.readingWords({explain:'<p><strong>Uno</strong> due tre</p>'}),3);
});

test('app.js gates forward navigation in deckGo and blocks skipping ahead',()=>{
 assert.match(app,/window\.deckGo=\(cid,i\)=>\{\s*const target=Math\.max\(0,i\);\s*if\(!dwellCanMove\(cid,target\)\)/);
 assert.match(app,/function dwellCanMove\(cid,target\)\{[\s\S]*?if\(target>cur\+1\)return false;/);
});

test('app.js applies the gate on both slide render paths and checks history jumps',()=>{
 const calls=app.match(/syncDwellGate\(c,index,deck\);/g)||[];
 assert.equal(calls.length,2);
 assert.match(app,/if\(dwellLearnerActive\(c\.id\)&&dwellGate\.cid===c\.id&&dwellGate\.index>=0&&!dwellCanMove\(c\.id,index\)\)\{setHash/);
});

test('the gate applies to registered learners with an assignment for the course, not to the session',()=>{
 assert.match(app,/const dwellLearnerActive=\(cid\)=>\{const st=window\.SAFETY_CLOUD\?\.state;return !!\(st\?\.user&&st\?\.learner&&cid&&\(st\.assignments\|\|\[\]\)\.some\(a=>a\.courseStableKey===cid&&\['not_started','in_progress'\]\.includes\(a\.status\)\)\);\};/);
 assert.doesNotMatch(app,/dwellLearnerActive\(\)/);
});

test('progress is logged as an existing interaction event, not a new event type',()=>{
 assert.match(app,/recordEvent\?\.\('interaction',/);
 assert.doesNotMatch(app,/recordEvent\?\.\('slide_dwell'/);
});

test('helper is loaded by the page and precached by the service worker',()=>{
 assert.match(index,/<script src="slide-dwell-gate-v48\.js"><\/script><script src="teacher-equipment-cases-v46-3\.js"/);
 assert.match(sw,/"\.\/slide-dwell-gate-v48\.js"/);
 assert.match(sw,/const CACHE='safety-training-v48-slide-dwell'/);
});

test('the gate is re-applied when the learner identity and assignments become known',()=>{
 assert.match(app,/document\.addEventListener\('safety:cloud-state-changed',\(\)=>\{[\s\S]*?if\(!c\|\|!dwellLearnerActive\(c\.id\)\|\|dwellGate\.cid===c\.id\)return;\s*deckView\(c,now\[2\]\|\|0\);/);
});
