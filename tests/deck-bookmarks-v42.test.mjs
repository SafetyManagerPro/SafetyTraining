import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function setup(){
 const values=new Map();
 const localStorage={
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(String(key),String(value)),
  removeItem:key=>values.delete(String(key))
 };
 const window={localStorage,SAFETY_CLOUD:{state:{user:{id:'teacher-1'}}}};
 runInNewContext(file('apps/training/deck-bookmarks-v42.js'),
  {window,localStorage,Date,JSON,Number,String,Math,encodeURIComponent});
 return {api:window.SAFETY_DECK_BOOKMARK_V42,window,values};
}
const slides=[
 {uid:'lav_medio-module-0',title:'Modulo 1'},
 {uid:'lav_medio-ruoli-explain-0',title:'Ruoli della sicurezza'},
 {uid:'lav_medio-dpi-concept-0',title:'DPI'}];
const course={id:'lav_medio',db_version:2};

test('bookmarks restore the same course slide and support intentional start from beginning',()=>{
 const {api}=setup();
 assert.equal(api.read(course,slides),null);
 assert.equal(api.save(course,slides,1),true);
 assert.equal(api.read(course,slides).index,1);
 assert.equal(api.read(course,slides).number,2);
 assert.equal(api.read(course,slides).total,3);
 assert.equal(api.save(course,slides,0),true);
 assert.equal(api.read(course,slides).index,0);
 assert.equal(api.clear(course),true);
 assert.equal(api.read(course,slides),null);
});

test('bookmarks remain scoped by user, course and version',()=>{
 const {api,window}=setup();
 assert.equal(api.save(course,slides,2),true);
 assert.equal(api.read({id:'lav_basso',db_version:2},slides),null);
 assert.equal(api.read({...course,db_version:3},slides),null);
 window.SAFETY_CLOUD.state.user.id='teacher-2';
 assert.equal(api.read(course,slides),null);
 assert.equal(api.save(course,slides,1),true);
 window.SAFETY_CLOUD.state.user.id='teacher-1';
 assert.equal(api.read(course,slides).index,2);
});

test('bookmarks match stable slide UIDs and reject removed slides',()=>{
 const {api}=setup();
 api.save(course,slides,1);
 const reordered=[slides[1],slides[0],slides[2]];
 assert.equal(api.read(course,reordered).index,0);
 const newDeck=[slides[0],slides[2]];
 assert.equal(api.read(course,newDeck),null);
 assert.equal(api.save(course,slides,-1),false);
 assert.equal(api.save(course,slides,99),false);
});

test('bookmark feature is only UI navigation, not accredited attendance or server progress',()=>{
 const code=file('apps/training/deck-bookmarks-v42.js');
 assert.doesNotMatch(code,/\.rpc\(|learning_events|learning_progress|active_seconds|recordLearning/);
 assert.match(code,/localStorage/);
 assert.match(code,/savedAt/);
});

test('projector has Home, Agenda and Resume buttons on course home and agenda',()=>{
 const app=file('apps/training/app.js'),css=file('apps/training/deck-bookmarks-v42.css');
 assert.ok(app.includes('⌂ Home'));
 assert.ok(app.includes('← Agenda'));
 assert.ok(app.includes('window.resumeCourseDeck='));
 assert.ok(app.includes("window.SAFETY_DECK_BOOKMARK_V42?.save?.(c,deck,index)"));
 assert.ok(app.includes("window.SAFETY_DECK_BOOKMARK_V42?.read?.(c,cachedDeck(c))"));
 assert.ok(app.includes("▶ Avvia presentazione dall'inizio</button> \${continueCourseButton(c)}"));
 assert.ok(app.includes("▶ Avvia presentazione</button>\${continueCourseButton(c)}"));
 assert.ok(css.includes('.deck-home-btn')&&css.includes('.deck-resume-btn'));
});

test('entrypoint loads bookmark module before app and PWA includes new resources',()=>{
 const index=file('apps/training/index.html'),sw=file('apps/training/sw.js');
 assert.ok(index.indexOf('deck-bookmarks-v42.js')<index.indexOf('<script src="app.js">'));
 for(const f of ['deck-bookmarks-v42.js','deck-bookmarks-v42.css'])
  assert.ok(index.includes(f)&&sw.includes(f),f);
 assert.ok(sw.includes('safety-training-v42-deck-resume'));
});
