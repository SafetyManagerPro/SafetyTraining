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

test('switching company clears stale edition, roster and incomplete people',()=>{
 const s={organizationId:'o1',companyId:'c1',companyMode:'existing',editionId:'e1',editionMode:'new',versionId:'v1',editionTitle:'Titolo',selectedIds:['a'],newLearners:[{email:'a@b.it'}],result:{inserted:1}};
 assert.equal(u.changeScope(s,'companyId','c2'),true);
 assert.equal(s.companyId,'c2');assert.equal(s.editionId,'');assert.equal(s.editionMode,'existing');
 assert.deepEqual(s.selectedIds,[]);assert.deepEqual(s.newLearners,[]);assert.equal(s.result,null);
 assert.equal(s.versionId,'');assert.equal(s.editionTitle,'');
});
test('switching organization clears the company form and downstream state',()=>{
 const s={organizationId:'o1',companyId:'c1',companyMode:'existing',companyName:'test',vat:'0123',fiscal:'CF',ateco:'88',editionId:'e1',editionMode:'new',versionId:'v1',selectedIds:['x'],newLearners:[{}]};
 u.changeScope(s,'organizationId','o2');
 assert.equal(s.companyId,'');assert.equal(s.companyMode,'existing');assert.equal(s.companyName,'');
 assert.equal(s.vat,'');assert.equal(s.fiscal,'');assert.equal(s.ateco,'');
 assert.equal(s.editionId,'');assert.deepEqual(s.selectedIds,[]);assert.deepEqual(s.newLearners,[]);
});
test('draft restoration cannot import company, edition or learner from other scopes',()=>{
 const r={companies:[{id:'c1',organization_id:'o1'}],courses:[{id:'course',active:true,metadata:{}}],versions:[{id:'v1',course_id:'course',status:'published',syllabus_snapshot:{go_live_ready:true,finalization_candidate:true}}],editions:[{id:'e1',organization_id:'o1',company_id:'c1',course_version_id:'v1',status:'open'}],learners:[{id:'a',organization_id:'o1',company_id:'c1',active:true},{id:'b',organization_id:'o2',company_id:'c2',active:true}]};
 assert.equal(u.restoredDraft({organizationId:'o2',companyId:'c1'},r),null);
 const ok=u.restoredDraft({organizationId:'o1',companyId:'c1',editionId:'e1',selectedIds:['a','b','a']},r);
 assert.equal(ok.editionId,'e1');assert.deepEqual([...ok.selectedIds],['a']);
 r.editions[0].status='archived';
 assert.equal(u.restoredDraft({organizationId:'o1',companyId:'c1',editionId:'e1'},r).editionId,'');
});
test('roster is rejected when selection belongs to another company',()=>{
 const s={organizationId:'o1',companyId:'c1',selectedIds:['other'],newLearners:[]};
 assert.throws(()=>u.validateRoster(s,{learners:[{id:'other',active:true,organization_id:'o1',company_id:'c2'}]}),/non appartiene/);
});
test('roster rejects duplicate emails and fiscal codes independently in a batch',()=>{
 const base={organizationId:'o1',companyId:'c1',selectedIds:[]};
 const p=(email,cf)=>({first_name:'Mario',last_name:'Rossi',email,fiscal_code:cf});
 assert.throws(()=>u.validateRoster({...base,newLearners:[p('X@example.com','ABC'),p('x@EXAMPLE.com','DEF')]},{learners:[]}),/due nuovi/);
 assert.throws(()=>u.validateRoster({...base,newLearners:[p('a@example.com',' AB C '),p('b@example.com','abc')]},{learners:[]}),/due nuovi/);
});
test('already-created rows can be retried without self-duplicate errors',()=>{
 const person={createdId:'l1',first_name:'Mario',last_name:'Rossi',email:'m@example.com'};
 const records={learners:[{id:'l1',organization_id:'o1',company_id:'c1',active:true,email:'m@example.com'}]};
 assert.equal(u.validateRoster({organizationId:'o1',companyId:'c1',selectedIds:[],newLearners:[person]},records),true);
});
test('roster still blocks duplicate email against another existing learner',()=>{
 const records={learners:[{id:'l1',organization_id:'o1',company_id:'c1',active:true,email:'m@example.com'}]};
 assert.throws(()=>u.validateRoster({organizationId:'o1',companyId:'c1',selectedIds:[],newLearners:[{first_name:'M',last_name:'R',email:'m@EXAMPLE.com'}]},records),/Anagrafica probabilmente/);
});
test('help content covers every step and stays HTML escaped',()=>{
 for(let i=0;i<=4;i++){const h=u.helpFor(i);assert.equal(typeof h.title,'string');assert.ok(h.items.length>=3);}
 const src=readFileSync(new URL('../apps/training/admin-guided-flow-v22.js',import.meta.url),'utf8');
 assert.match(src,/aria-controls="gwHelp"/);assert.match(src,/aria-expanded/);
 assert.match(src,/guide\.items\.map\(item=>'<li>'\+esc\(item\)/);
});
test('successful enrollment is recorded before loading invitation recipients',()=>{
 const src=readFileSync(new URL('../apps/training/admin-guided-flow-v22.js',import.meta.url),'utf8');
 const from=src.indexOf("const result=await rpc('admin_bulk_enroll'");
 const success=src.indexOf('st.step=4;',from);
 const refresh=src.indexOf('await load();',from);
 assert.ok(from>=0&&success>from&&refresh>success);
 assert.match(src,/missingEmailIds/);
 assert.match(src,/if\(!s\.host\|\|!wizardVisible\(\)\)return/);
});

test('wizard event handlers ignore other admin tabs and concurrent mutations',()=>{
 const source=readFileSync(new URL('../apps/training/admin-guided-flow-v22.js',import.meta.url),'utf8');
 assert.match(source,/if\(!wizardVisible\(\)\|\|!e\.target\.closest\('\.gw-shell'\)\)return/);
 assert.match(source,/function rememberInput\(target\)\{\s*if\(s\.busy\)return/);
 assert.match(source,/if\(remove\)\{if\(s\.busy\)return/);
});
