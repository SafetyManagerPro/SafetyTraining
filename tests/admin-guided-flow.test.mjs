import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const sb={window:{},console};const source=readFileSync(new URL('../apps/training/admin-guided-flow-v22.js',import.meta.url),'utf8');
runInNewContext(source,sb);
const u=sb.window.SAFETY_GUIDED_FLOW_RULES_V22;
test('only published, go-live-ready, unfrozen versions can be used',()=>{
 const cs=[{id:'a',active:true,metadata:{}},{id:'b',active:true,metadata:{frozen:true}}];
 const vs=[{id:'1',course_id:'a',status:'published',syllabus_snapshot:{finalization_candidate:true,go_live_ready:true}},{id:'2',course_id:'b',status:'published',syllabus_snapshot:{finalization_candidate:true,go_live_ready:true}},{id:'3',course_id:'a',status:'draft',syllabus_snapshot:{finalization_candidate:true,go_live_ready:true}}];
 assert.deepEqual([...u.readyVersions(cs,vs)].map(v=>v.id),['1']);
});
test('existing edition must be open and company compatible',()=>{
 const versions=new Set(['v1']);const ed=[{id:'one',company_id:'c1',organization_id:'o1',status:'open',course_version_id:'v1'},{id:'two',company_id:'c2',organization_id:'o1',status:'open',course_version_id:'v1'},{id:'three',company_id:null,organization_id:'o1',status:'open',course_version_id:'v1'},{id:'four',company_id:'c1',organization_id:'o1',status:'draft',course_version_id:'v1'}];
 assert.deepEqual([...u.eligibleEditions(ed,'c1','o1',versions)].map(e=>e.id),['one','three']);
});
test('learners are scoped to exactly the company and organization',()=>{
 const ls=[{id:'a',active:true,company_id:'c1',organization_id:'o1'},{id:'b',active:true,company_id:'c2',organization_id:'o1'},{id:'c',active:false,company_id:'c1',organization_id:'o1'}];
 assert.deepEqual([...u.eligibleLearners(ls,'c1','o1')].map(l=>l.id),['a']);
});
test('duplicate detection normalizes fiscal code and email within organization',()=>{
 const ls=[{id:'a',organization_id:'o1',email:'ONE@example.com',fiscal_code:'AB C123'}];
 assert.equal(u.duplicateLearner({fiscal_code:'abc123'},ls,'o1').id,'a');
 assert.equal(u.duplicateLearner({email:'one@EXAMPLE.com'},ls,'o1').id,'a');
 assert.equal(u.duplicateLearner({email:'one@example.com'},ls,'o2'),null);
});
test('draft never contains new person contact details',()=>{
 const d=u.draftSafe({organizationId:'org',companyId:'company',editionId:'edition',selectedIds:['a'],newLearners:[{email:'secret@example.com'}],sendInvites:true});
 assert.ok(!JSON.stringify(d).includes('secret@example.com'));
 assert.deepEqual([...d.selectedIds],['a']);
});
