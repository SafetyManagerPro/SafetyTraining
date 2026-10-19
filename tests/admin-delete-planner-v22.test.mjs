import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context={window:{}};runInNewContext(read('apps/training/admin-delete-planner-v22.js'),context);
const d=context.window.SAFETY_ADMIN_DELETE_PLANNER_V22;
test('all four admin types have explicit dependency policies',()=>{
  for(const key of ['company','learner','edition','enrollment']){
    assert.ok(d.specs[key]);assert.ok(d.specs[key].links.length>=3);
  }
  assert.equal(d.specs.enrollment.links.length,8);
});
test('only demonstrably untouched enrollments are preliminary candidates',()=>{
  const clean={status:'not_started',progress_pct:0,active_seconds:0};
  assert.equal(d.classify('enrollment',clean),'candidate');
  for(const record of [
    {...clean,status:'revoked'}, {...clean,progress_pct:3}, {...clean,active_seconds:15},
    {...clean,last_activity_at:'2026-10-01'}, {...clean,final_score_pct:99},
    {...clean,started_at:'2026-10-01'}, {...clean,completed_at:'2026-10-01'}
  ])assert.equal(d.classify('enrollment',record),'protected');
});
test('only failed/revoked invitations without linked auth user are preliminary candidates',()=>{
  assert.equal(d.classify('invitation',{status:'failed',auth_user_id:null}),'candidate');
  assert.equal(d.classify('invitation',{status:'revoked',auth_user_id:null}),'candidate');
  assert.equal(d.classify('invitation',{status:'sent',auth_user_id:null}),'manual');
  assert.equal(d.classify('invitation',{status:'revoked',auth_user_id:'u'}),'manual');
});
test('plan blocks parent when protected/manual dependency remains',()=>{
  const groups=[{entries:[{key:'e:1',category:'candidate',label:'One',source:'e'},{key:'h:2',category:'protected',label:'History',source:'h'}],truncated:false,error:null}];
  const p=d.plan(groups,new Set(['e:1']),true,'candidate');
  assert.equal(p.selectedCount,1);assert.equal(p.blockers,1);assert.equal(p.deleteParent,false);
});
test('plan allows root in the simulated summary only after all candidates selected',()=>{
  const groups=[{entries:[{key:'a',category:'candidate',label:'A',source:'test'}],error:null,truncated:false}];
  assert.equal(d.plan(groups,new Set(),true,'candidate').deleteParent,false);
  assert.equal(d.plan(groups,new Set(['a']),true,'candidate').deleteParent,true);
  assert.equal(d.plan([],new Set(),true,'protected').deleteParent,false);
});
test('unknown, truncated or inaccessible dependencies always block parent',()=>{
  assert.equal(d.plan([{entries:[],error:'forbidden',truncated:false}],new Set(),true,'candidate').parentReady,false);
  assert.equal(d.plan([{entries:[],error:null,truncated:true}],new Set(),true,'candidate').parentReady,false);
});
test('UI supports per-row and select-all with real deletion disabled',()=>{
  const src=read('apps/training/admin-delete-planner-v22.js'),html=read('apps/training/index.html');
  for(const piece of ['data-plan-choice','data-plan-all','data-plan-none','data-plan-parent','data-plan-next','data-plan-back','Conferma eliminazione definitiva'])assert.ok(src.includes(piece),piece);
  assert.match(src,/getActorId\(\)===actorId/);
  assert.doesNotMatch(src,/\.from\([^)]*\)\.delete\s*\(|\.from\([^)]*\)\.update\s*\(/);
  assert.match(html,/admin-delete-planner-v22\.js/);assert.match(html,/admin-delete-planner-v22\.css/);
});


test('each dependency has safe detail view and an existing admin navigation route where applicable',()=>{
  const src=read('apps/training/admin-delete-planner-v22.js');
  const admin=read('apps/training/admin.js');
  assert.match(src,/data-plan-inspect/);
  assert.match(src,/data-plan-manage/);
  assert.match(src,/data-plan-detail-back/);
  assert.match(src,/openRecord\(action\.kind,inspected\.id,inspected\.learnerId\)/);
  assert.match(admin,/async function openDependencyRecord/);
  for(const x of ['edit-company','edit-learner','edit-edition','revoke','restore'])
    assert.match(admin,new RegExp(x));
});
test('sensitive invitation credentials and metadata never appear in record detail',()=>{
  const detail=d.safeDetails({id:'abc',status:'failed',email:'demo@example.org',
    token_hash:'SECRET_TOKEN',token_prefix:'SECRET_PREFIX',
    metadata:{password:'SECRET_PASSWORD'},recipient_phone:'PRIVATE_PHONE'});
  const display=JSON.stringify(detail);
  assert.match(display,/demo@example\.org/);
  for(const secret of ['SECRET_TOKEN','SECRET_PREFIX','SECRET_PASSWORD','PRIVATE_PHONE'])assert.ok(!display.includes(secret),secret);
});
test('dependency routes distinguish editable entities and retained evidence',()=>{
  assert.equal(d.managementAction('learners').kind,'learner');
  assert.equal(d.managementAction('companies').kind,'company');
  assert.equal(d.managementAction('course_editions').kind,'edition');
  assert.equal(d.managementAction('enrollments').kind,'enrollment');
  assert.equal(d.managementAction('organization_memberships').kind,'memberships');
  assert.equal(d.managementAction('learner_account_invitations').kind,'invites');
  assert.equal(d.managementAction('learning_events'),null);
  assert.equal(d.managementAction('learner_company_training_history'),null);
});

test('the admin can explicitly plan action on sensitive records, regardless of course type',()=>{
 const groups=[{table:'learning_events',column:'enrollment_id',entries:[{key:'events:1',label:'Event',source:'learning_events',category:'protected'}],truncated:false,error:null}];
 const plan=d.intentPlan(groups,new Map([['events:1','delete']]),true,'protected');
 assert.equal(plan.remove.length,1);
 assert.equal(plan.warnings.length,1);
 assert.equal(plan.rootPossible,true);
 assert.equal(plan.deleteParent,true);
});
test('keep blocks main removal and unlink only offered for nullable relations',()=>{
 const groups=[{table:'learners',column:'company_id',entries:[{key:'learners:1',label:'A',source:'learners',category:'manual'}],truncated:false,error:null}];
 assert.equal(d.intentPlan(groups,new Map(),true,'candidate').rootPossible,false);
 assert.equal(d.intentPlan(groups,new Map([['learners:1','unlink']]),true,'candidate').rootPossible,true);
 assert.equal(d.canUnlink('learners','company_id'),true);
 assert.equal(d.canUnlink('enrollments','learner_id'),false);
 assert.equal(d.intentPlan([{...groups[0],truncated:true}],new Map([['learners:1','delete']]),true,'candidate').rootPossible,false);
});


test('composite primary keys produce unique selectors for related records',()=>{
 const a=d.recordKey('learning_progress',{enrollment_id:'en-1',unit_version_id:'unit-1'});
 const b=d.recordKey('learning_progress',{enrollment_id:'en-1',unit_version_id:'unit-2'});
 assert.notEqual(a,b);
 assert.equal(d.recordKey('learning_progress',{enrollment_id:'en-1'}),null);
 const x=d.recordKey('integration_training_contexts',{source_system:'import',external_project_id:'proj:1'});
 const y=d.recordKey('integration_training_contexts',{source_system:'import',external_project_id:'proj:2'});
 assert.notEqual(x,y);
 assert.equal(d.recordKey('integration_training_contexts',{source_system:'import'}),null);
 assert.ok(!x.includes('undefined'));
});
test('the scanner never requests unrestricted fields or invitation token hashes',()=>{
 for(const [table,columns] of Object.entries(d.projections)){
  assert.ok(columns&&columns!=='*',table);
  assert.ok(columns.split(',').every(x=>/^[a-z_]+$/.test(x)),table);
 }
 for(const field of ['token_hash','token_prefix','metadata','recipient_phone']){
  assert.ok(!d.projections.learner_account_invitations.includes(field),field);
 }
 const code=read('apps/training/admin-delete-planner-v22.js');
 assert.doesNotMatch(code,/\.select\('\*'\)/);
});
function fakeClient(fixtures,reads=[]){
 return {from(table){
  return {select(columns){
   reads.push({table,columns});
   return {eq(){
    return {
     maybeSingle:async()=>({data:fixtures[table]?.one||null,error:null}),
     limit:async()=>({data:fixtures[table]?.rows||[],count:(fixtures[table]?.rows||[]).length,error:null})
    };
   }};
  }};
 }};
}
test('edition scan distinguishes integration contexts by their composite primary key',async()=>{
 const reads=[];
 const c=fakeClient({
  course_editions:{one:{id:'ed-1',status:'open'}},
  integration_training_contexts:{rows:[
   {source_system:'sync',external_project_id:'one',local_edition_id:'ed-1'},
   {source_system:'sync',external_project_id:'two',local_edition_id:'ed-1'}
  ]}
 },reads);
 const data=await d.scan(c,'edition','ed-1');
 const group=data.groups.find(x=>x.table==='integration_training_contexts');
 assert.equal(group.entries.length,2);
 assert.notEqual(group.entries[0].key,group.entries[1].key);
 assert.ok(group.entries.every(x=>x.id===null));
 assert.ok(reads.every(x=>x.columns!=='*'));
});
test('enrollment scan distinguishes learning progress by unit version',async()=>{
 const c=fakeClient({
  enrollments:{one:{id:'en-1',status:'in_progress'}},
  learning_progress:{rows:[
   {enrollment_id:'en-1',unit_version_id:'unit-1',status:'started'},
   {enrollment_id:'en-1',unit_version_id:'unit-2',status:'completed'}
  ]}
 });
 const data=await d.scan(c,'enrollment','en-1');
 const progress=data.groups.find(x=>x.table==='learning_progress');
 assert.equal(progress.entries.length,2);
 assert.notEqual(progress.entries[0].key,progress.entries[1].key);
 assert.ok(progress.entries.every(x=>x.id===null));
});

test('server is mandatory and a missing backend fails closed before mutation',async()=>{
  const groups=[{table:'learning_events',column:'enrollment_id',entries:[{key:'[\"learning_events\",123]',source:'learning_events',category:'protected'}],error:null,truncated:false}];
  const info={kind:'enrollment',id:'123',spec:{table:'enrollments'},groups,parentType:'protected'};
  const effect=d.intentPlan(groups,new Map([['[\"learning_events\",123]','delete']]),true,info.parentType);
  let count=0;
  const client={rpc:async name=>{count++;return {error:{message:'function does not exist'}};}};
  await assert.rejects(d.verifiedServerPreview(client,info,effect),/non è ancora installato/);
  assert.equal(count,1);
});
test('server confirmation is exact and payload includes only consciously selected links',()=>{
  const info={kind:'edition',id:'ed-id',spec:{table:'course_editions'}};
  const effect={incomplete:false,accountLinked:false,remove:[{key:'[\"enrollments\",\"en-id\"]',source:'enrollments'}],unlink:[],deleteParent:true};
  const payload=d.executionPayload(info,effect);
  assert.equal(payload.p_actions.length,1);
  assert.equal(payload.p_actions[0].action,'delete');
  assert.equal(payload.p_delete_parent,true);
  assert.equal(d.exactConfirmation('ed-id'),'ELIMINA ed-id');
});
test('impact preview warns about nested deletions including test answers',()=>{
 const info={spec:{table:'enrollments'}};
 const effect={remove:[{source:'test_attempts'}],deleteParent:true};
 const warnings=d.effectWarnings(info,effect);
 assert.ok(warnings.some(x=>x.table==='test_attempts'&&x.note.includes('test_answers')));
 assert.ok(warnings.some(x=>x.table==='enrollments'));
});
test('frontend executes only via guarded server RPC and never client-side DELETE',()=>{
 const src=read('apps/training/admin-delete-planner-v22.js');
 assert.match(src,/admin_delete_capabilities_v25/);
 assert.match(src,/admin_preview_deletion_v25/);
 assert.match(src,/admin_execute_deletion_v25/);
 assert.match(src,/preview_token/);
 assert.match(src,/data-plan-confirm/);
 assert.doesNotMatch(src,/\.from\([^)]*\)\.delete\s*\(/);
});

test('confirmation responds while typing; linked login only blocks root deletion',()=>{
 const source=read('apps/training/admin-delete-planner-v22.js');
 assert.match(source,/addEventListener\('input'/);
 assert.match(source,/effect.accountLinked&&effect.deleteParent/);
 const effect={remove:[{key:'[\"learner_account_invitations\",\"inv\"]',source:'learner_account_invitations'}],unlink:[],incomplete:false,accountLinked:true,deleteParent:false};
 const request=d.executionPayload({kind:'learner',id:'learner-1'},effect);
 assert.equal(request.p_delete_parent,false);
});

test('read-only server preview exposes explicit indirect counts and safety warnings',()=>{
 const src=read('apps/training/admin-delete-planner-v22.js');
 assert.match(src,/serverPreview\.warnings/);
 const migration=read('supabase/migrations/20261019152200_v22_014_admin_deletion_indirect_read_only_preview.sql');
 for(const phrase of ['test_answers','learning_sessions','SET NULL','indirect_rls_visible'])assert.ok(migration.includes(phrase));
 assert.doesNotMatch(migration,/\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b/i);
});

test('backend readiness alone cannot activate destructive UI without full contract',()=>{
 const cap={version:'v25',preview_ready:true,ready:true,execution_enabled:true};
 const pre={version:'v25',safe:true,execution_ready:true,graph_complete:true,
 audit_ready:true,preview_token:'q'.repeat(64),
 impact:[{selected:true,acknowledged:true,count:1,action:'delete'}],warnings:[]};
 assert.equal(d.canExecuteApprovedPreview(cap,pre),true);
 const rejected=[
  [{...cap,execution_enabled:false},pre],
  [cap,{...pre,graph_complete:false}],
  [cap,{...pre,audit_ready:false}],
  [cap,{...pre,preview_token:null}],
  [cap,{...pre,impact:[{selected:false,acknowledged:false,count:1,action:'CASCADE'}]}],
  [cap,{...pre,impact:[{selected:true,acknowledged:false,count:1,action:'delete'}]}],
  [cap,{...pre,warnings:['uncertain dependency']}],
  [cap,{...pre,impact:[{selected:true,acknowledged:true,count:Infinity,action:'delete'}]}]
 ];
 for(const [c,p] of rejected)assert.equal(d.canExecuteApprovedPreview(c,p),false);
});
test('installed read-only preview cannot enable destructive confirmation',async()=>{
 const info={kind:'enrollment',id:'enrollment-id',spec:{table:'enrollments'}};
 const effect={remove:[],unlink:[],deleteParent:true,incomplete:false,accountLinked:false};
 const calls=[];
 const client={rpc:async(name)=>{
  calls.push(name);
  if(name==='admin_delete_capabilities_v25')return {data:{
   version:'v25',preview_ready:true,ready:false,execution_enabled:false},error:null};
  if(name==='admin_preview_deletion_v25')return {data:{
   version:'v25',safe:false,execution_ready:false,impact:[],warnings:[]},error:null};
  throw Error('Unexpected execution request');
 }};
 const got=await d.verifiedServerPreview(client,info,effect);
 assert.equal(got.ready,false);
 assert.equal(got.token,null);
 assert.deepEqual(calls,['admin_delete_capabilities_v25','admin_preview_deletion_v25']);
});
