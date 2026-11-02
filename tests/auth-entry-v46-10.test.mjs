import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('apps/training/access-gate-v46-10.js');
const css=read('apps/training/access-gate-v46-10.css');

function mount({id=null,learner=null,assignments=[],admin=false,roles=[],courses=[],editions=[],versions=[],hash=''}={}){
 const classes=new Set(['st-access-pending']);
 const classList={add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);}};
 const doc={readyState:'loading',body:{classList},getElementById:()=>null,addEventListener(){},dispatchEvent(){}};
 const state={client:null,user:id?{id}:null,learner,assignments,identityReady:true};
 const window={dispatchEvent(){},SAFETY_CLOUD:{state},SAFETY_LEARNER_NAV_V22:{assigned(rows,key){return rows.find(a=>a.courseStableKey===key&&a.status!=='revoked')||null;}}};
 state.client={from(table){
   const filters=[];
   const q={
     select(){return q;},
     eq(k,v){filters.push([k,v]);return q;},
     in(k,v){filters.push([k,v]);return q;},
     limit(){return q;},
     maybeSingle:async()=>({data:table==='platform_admins'&&admin?{user_id:id}:null,error:null}),
     then(resolve,reject){
       const value=table==='organization_memberships'?roles:
         table==='courses'?courses:table==='course_editions'?editions:
         table==='course_versions'?versions:[];
       return Promise.resolve({data:value,error:null}).then(resolve,reject);
     }
   };
   return q;
 }};
 const location={hash,pathname:'/',search:''};
 const history={replaceState(_a,_b,url){location.hash='';}};
 runInNewContext(js,{window,document:doc,location,history,Event:class{},CustomEvent:class{
  constructor(type,init){this.type=type;this.detail=init?.detail;}
 },console,setTimeout});
 return {gate:window.SAFETY_ACCESS_V46_10,cloud:state,classes,location};
}
test('deny-by-default: a guest sees login and cannot visit any route',async()=>{
 const {gate,classes}=mount();
 assert.equal(gate.state.phase,'pending');
 assert.equal(gate.canOpen('course-a'),false);
 assert.equal(gate.canVisit('#course/course-a'),false);
 await gate.resolve();
 assert.equal(gate.state.phase,'guest');
 assert.equal(gate.canBrowse(),false);
 assert.equal(gate.canVisit(''),false);
 assert.ok(classes.has('st-access-guest'));
 assert.match(css,/body:not\(\.st-access-admin\):not\(\.st-access-staff\):not\(\.st-access-learner\)/);
 assert.match(css,/#stAccessEntry/);
});
test('an authenticated platform admin can use full catalog',async()=>{
 const {gate}=mount({id:'admin',admin:true});
 await gate.resolve();
 assert.equal(gate.state.phase,'admin');
 assert.equal(gate.canOpen('any'),true);
 assert.equal(gate.canVisit('#library/private'),true);
 assert.equal(gate.rowsForViewer([{stable_key:'x'},{stable_key:'y'}]).length,2);
});
test('staff can see only courses owned by or explicitly assigned to their organization',async()=>{
 const {gate}=mount({id:'teacher',
  roles:[{role:'teacher',organization_id:'org1',active:true}],
  courses:[{id:'a',stable_key:'allowed',owner_organization_id:'org1'},
    {id:'b',stable_key:'blocked',owner_organization_id:'org2'},
    {id:'c',stable_key:'issued',owner_organization_id:null}],
  editions:[{organization_id:'org1',course_version_id:'v3'}],
  versions:[{id:'v3',course_id:'c'}]});
 await gate.resolve();
 assert.equal(gate.state.phase,'staff');
 assert.equal(gate.canOpen('allowed'),true);
 assert.equal(gate.canOpen('issued'),true);
 assert.equal(gate.canOpen('blocked'),false);
 assert.equal(gate.canVisit('#topic/blocked/one'),false);
 assert.equal(gate.canVisit('#library/issued'),true);
 assert.equal(gate.rowsForViewer([{stable_key:'allowed'},{stable_key:'blocked'},{stable_key:'issued'}]).length,2);
});
test('learner cannot use catalog and can open only assigned, non-revoked courses',async()=>{
 const {gate}=mount({id:'learner',learner:{id:'l1'},
  assignments:[{courseStableKey:'selected',status:'not_started'},{courseStableKey:'revoked',status:'revoked'}]});
 await gate.resolve();
 assert.equal(gate.state.phase,'learner');
 assert.equal(gate.canBrowse(),false);
 assert.equal(gate.canOpen('selected'),true);
 assert.equal(gate.canOpen('revoked'),false);
 assert.equal(gate.canOpen('another'),false);
 assert.equal(gate.canVisit('#course/selected'),true);
 assert.equal(gate.canVisit('#topic/selected/one'),true);
 assert.equal(gate.canVisit('#deck/another/0'),false);
 assert.equal(gate.canVisit('#library/selected'),false);
 assert.equal(gate.rowsForViewer([{stable_key:'selected'}]).length,0);
});
test('signed-in account with no role or assigned learner profile is denied',async()=>{
 const {gate,classes}=mount({id:'unassigned'});
 await gate.resolve();
 assert.equal(gate.state.phase,'denied');
 assert.equal(gate.canOpen('anything'),false);
 assert.ok(classes.has('st-access-denied'));
});
test('identity resolution is fail closed until the server returns authorization context',async()=>{
 const {gate,cloud}=mount({id:'maybe',admin:true});
 cloud.identityReady=false;
 await gate.resolve();
 assert.equal(gate.state.phase,'pending');
 assert.equal(gate.canVisit('#course/example'),false);
});
test('the HTML boots with login-only and preserves public registration and invitation overlays',()=>{
 const html=read('apps/training/index.html');
 assert.match(html,/<body class="st-access-pending">/);
 assert.match(html,/id="stAccessForm"/);
 assert.match(html,/id="stAccessEmail"/);
 assert.match(html,/id="stAccessPassword"/);
 assert.ok(html.indexOf('access-gate-v46-10.css')<html.indexOf('styles.css'));
 assert.ok(html.indexOf('access-gate-v46-10.js')<html.indexOf('app.js'));
 assert.match(css,/body:has\(#safetyPublicRegistration\)/);
 assert.match(css,/body:has\(#learnerInviteV21:not\(\.hidden\)\)/);
 assert.match(read('apps/training/public-registration-v36.js'),/public_registration_info_v36/);
 assert.match(read('apps/training/learner-invite-activation-v21.js'),/learner_invite_public_info/);
});
test('route render and sidebar never expose course content before auth or after role downgrade',()=>{
 const app=read('apps/training/app.js');
 assert.match(app,/if\(!gate\?\.isAuthenticated\?\.\(\)\)return;/);
 assert.match(app,/if\(location.hash&&!gate.canVisit\(\)\)/);
 assert.match(app,/gate\.guardRoute\(\)/);
 assert.match(app,/DATA\.filter\(c=>gate\.canOpen\(c\.id\)\)/);
 assert.match(read('apps/training/home-v2.js'),/safeData\(\)\.filter\(x=>gate\.canOpen\(x\.id\)\)/);
 assert.match(read('apps/training/sidebar-course-groups.js'),/gate\.rowsForViewer\(rows\)/);
 assert.match(read('apps/training/catalog-browser.js'),/state\.rows=gate\(\)\.rowsForViewer/);
 assert.match(read('apps/training/learner-access-guard-v20.js'),/canVisit/);
 assert.match(read('apps/training/admin.js'),/organization_admin','training_manager/);
 const cloud=read('apps/training/cloud-v20.js');
 assert.match(cloud,/identityReady: false/);
 assert.match(cloud,/state\.identityReady = true/);
 assert.match(cloud,/notifyCloudState\(\)/);
});
test('backend catalog RPCs have explicit learner enrollment and staff scope',()=>{
 const sql=read('supabase/migrations/20261102195500_v46_10_catalog_rpc_scope.sql');
 for(const term of ["pg_get_functiondef('public.training_catalog_summary()'",
  "pg_get_functiondef('public.training_course_bundle(text)'",
  "unexpected_catalog_rpc_version","learner_l.auth_user_id=auth.uid()",
  "learner_e.status<>'revoked'","learner_ed.available_until",
  "private.is_platform_admin()","organization_memberships staff",
  "revoke all on function public.training_catalog_summary() from public,anon"]){
   assert.ok(sql.includes(term),term);
 }
 assert.doesNotMatch(sql,/update\s+public\.(learners|enrollments|course_versions)\b/i);
});
test('PWA, test suite and both handoffs are synchronized',()=>{
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-10-auth-gate'/);
 assert.ok(sw.includes('./access-gate-v46-10.js'));
 assert.ok(sw.includes('./access-gate-v46-10.css'));
 const pkg=read('package.json');
 assert.match(pkg,/tests\/auth-entry-v46-10\.test\.mjs/);
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const c=read(p);
  assert.ok(c.slice(0,950).includes('safety-training-v46-10-auth-gate'),p);
  assert.match(c,/v46\.10 — Login obbligatorio e contenuti per ruolo/);
 }
});
