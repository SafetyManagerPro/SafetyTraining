import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const original=read('apps/training/app.js');
const extracted=read('apps/training/internal-original-deck-v47-3.js');
const player=read('apps/training/internal-player-v47.js');
const html=read('apps/training/interno.html');
const api=read('supabase/functions/internal-course/index.ts');
const migration=read('supabase/migrations/20261103102000_v47_3_original_slides_progress.sql');
const admin=read('apps/training/admin-internal-v47.js');

test('the internal viewer uses verbatim original buildDeck and slide HTML, not a simplified renderer',()=>{
 const start=original.indexOf('function fmtMin(m){');
 const end=original.indexOf('// Cache one compiled presentation',start);
 assert.ok(start>0&&end>start+15000);
 const originalEngine=original.slice(start,end).trim();
 assert.ok(extracted.includes(originalEngine),'the standalone engine must contain the complete original source without altering slide code');
 assert.match(extracted,/window\.SAFETY_DECK_RENDER=\{buildDeck,deckSlideBody\}/);
 assert.match(player,/window\.SAFETY_DECK_RENDER\.buildDeck\(state\.course\)/);
 assert.match(player,/window\.SAFETY_DECK_RENDER\.deckSlideBody\(s,i\)/);
 assert.doesNotMatch(player,/lessonContent\(|function renderValue\(|ip-card.*Spiegazione/);
});

test('a real original slide deck can be built by the isolated engine',()=>{
 const topic={id:'unit-1',title:'Argomento di prova',slide_title:'Slide originale',
  minutes:30,summary:'Testo originale',detail:'Spiegazione originale.',risks:[],prevention:[],
  procedure:[],good:[],bad:[],case:'Caso',question:'Domanda',guided:null,
  graphic_cards:[],teacher_expansion:[],deepdetail:[],common_errors:[],source_digest:[],
  quiz:null,source_stable_key:'unit-1'};
 const course={id:'test-course',title:'Corso originale',topics:[topic],metadata:{},modules:[{
  id:'m1',title:'Modulo',topic_ids:['unit-1'],minutes:30,start_minute:0,end_minute:30
 }]};
 const context={window:{SAFETY_DATA:[course]},document:{},console,encodeURIComponent,decodeURIComponent};
 runInNewContext(extracted,context);
 const engine=context.window.SAFETY_DECK_RENDER;
 assert.equal(typeof engine.buildDeck,'function');
 assert.equal(typeof engine.deckSlideBody,'function');
 const slides=engine.buildDeck(course);
 assert.ok(slides.length>=2);
 assert.equal(slides[0].type,'module');
 assert.ok(slides.some(x=>x.type==='concept'));
 const htmlOutput=engine.deckSlideBody(slides.find(x=>x.type==='concept'),1);
 assert.match(htmlOutput,/slide-grid slide-opening/);
 assert.match(htmlOutput,/Slide originale/);
 assert.match(htmlOutput,/Testo originale/);
});

test('link-only page loads the original course adapter and visual assets without account/admin scripts',()=>{
 for(const file of ['styles.css','presentation-quality.css','slide-visual-design-v41.css',
  'visual-asset-guard-v32.js','graphic-pack-01.js','graphic-pack-02.js','graphic-pack-03.js',
  'graphic-pack-04.js','graphic-atlas-v22.js','db-slide-adapter.js',
  'internal-original-deck-v47-3.js','internal-slide-v47-3.css'])
  assert.ok(html.includes(file),'missing original viewer dependency: '+file);
 assert.doesNotMatch(html,/src="\.\/(admin|cloud-v20|access-gate-v46-10|app)\.js"/);
 assert.doesNotMatch(html,/id="stAccessForm"|name="password"/);
 assert.match(html,/referrer.*no-referrer/);
 assert.match(player,/SAFETY_DB_SLIDES\.adaptBundle/);
 assert.match(player,/state\.course=adaptExactCourse\(state\.bundle\)/);
 assert.match(player,/SAFETY_DATA/);
});

test('personal link continues to authorize only one course with no login',()=>{
 assert.match(player,/parseToken\(\)/);
 assert.match(player,/location\.hash/);
 assert.match(api,/internal_link_open_v47/);
 assert.match(api,/internal_link_slide_v47_3/);
 assert.match(api,/!\\['open','visit','slide'\\]\.includes\(action\)/);
 assert.doesNotMatch(player,/signIn|signUp|localStorage|sessionStorage|supabase\.auth/);
 assert.match(migration,/where token_hash=p_token_hash and active for update/);
 assert.match(migration,/m\.course_version_id=assignment\.course_version_id and mu\.unit_version_id=p_unit_version_id/);
 assert.match(migration,/to service_role/);
 assert.match(migration,/from public,anon,authenticated/);
});

test('progress records original slide index, tracks opened slides, and resumes at exact position',()=>{
 assert.match(migration,/create table if not exists private\.internal_slide_visits_v47_3/);
 assert.match(migration,/primary key\(assignment_id,slide_index\)/);
 assert.match(migration,/last_slide_index=p_slide_index,total_slides=p_total_slides/);
 assert.match(migration,/'visited_slides',slides_seen/);
 assert.match(migration,/'last_slide_index',a\.last_slide_index/);
 assert.match(player,/request\('slide',fields\)/);
 assert.match(player,/state\.lastSlide=Number\.isInteger\(last\)/);
 assert.match(player,/resume\?state\.lastSlide:0/);
 assert.match(admin,/a\.last_slide_index/);
 assert.match(admin,/a\.visited_slides/);
});

test('original published lesson images, quiz answers and presentation source fields are retained',()=>{
 for(const term of ["'stable_key',lu.stable_key","'default_minutes',lu.default_minutes","'metadata',lu.metadata",
  "'source_group',lu.source_group","'content',uv.content","'stable_key',c.stable_key",
  "'position',m.position"])assert.ok(migration.includes(term),term);
 for(const value of ['teacher_expansion','discussion_feedback','video_moment','video_plan','idea_images',
  'visuals','graphic_cards','quiz'])assert.ok(api.includes(value),value);
 assert.match(api,/if\(quiz\)out\.quiz=quiz/);
});

test('existing published course content, tests, registration and source tables are not modified',()=>{
 assert.doesNotMatch(migration,/\b(?:update|delete from|truncate)\s+public\.(courses|course_versions|learning_unit_versions|course_modules|course_module_units|enrollments|learners)\b/i);
 assert.doesNotMatch(migration,/\bdrop\s+(?:table|function)\b/i);
 assert.match(migration,/create or replace function public\.internal_link_open_v47/);
 assert.match(migration,/create or replace function public\.internal_admin_state_v47/);
});
