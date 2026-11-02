import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const entry=read('apps/training/admin-guided-journey-v46-7.js');
function module(){const window={};runInNewContext(entry,{window});return window.SAFETY_GUIDED_JOURNEY_V46_7;}
const j=module();
const company='c1',org='o1';
const learner=(p={})=>({id:'l1',first_name:'Marta',last_name:'Rossi',active:true,company_id:company,organization_id:org,
 email:'marta@example.com',auth_user_id:null,...p});
const edition=(p={})=>({id:'e1',company_id:company,organization_id:org,status:'open',available_from:null,available_until:null,...p});
const enrollment=(p={})=>({id:'en1',learner_id:'l1',edition_id:'e1',status:'not_started',progress_pct:0,
 active_seconds:0,final_score_pct:null,started_at:null,enrolled_at:'2026-11-02T14:00:00Z',...p});
const item=(out,key)=>out.steps.find(x=>x.key===key);
test('v46.7 stage order is unique and matches the published wizard',()=>{
 assert.deepEqual([...j.steps].map(x=>x[0]),['registry','edition','enrollment','account','availability','attendance','verification']);
 assert.equal(j.version,'v46.7');
 const w=read('apps/training/admin-guided-flow-v22.js');
 for(const phrase of ['Avvia percorso · guida unica','Controlla stato esistente','Visualizza stato e prossime azioni','refresh-monitor','function stepMonitor','function monitor()'])assert.ok(w.includes(phrase),phrase);
 assert.ok(w.includes("const steps=['Azienda','Corso ed edizione','Corsisti','Riepilogo','Stato corsisti']"));
 assert.match(w,/if\(type==='monitor'\|\|type==='refresh-monitor'\)await monitor\(\)/);
 assert.match(w,/st\.step=5;shell\(\)/);
});
test('missing enrollment is explicit and never misrepresented as enrollment or activity',()=>{
 const p=j.describe({learner:learner(),edition:edition(),enrollment:null,invitation:null});
 assert.equal(item(p,'enrollment').status,'todo');
 assert.equal(item(p,'attendance').status,'todo');
 assert.equal(item(p,'verification').status,'todo');
 assert.equal(p.action,'back-to-learners');
 assert.match(p.next,/Conferma l’iscrizione/);
});
test('revoked enrollment remains visible and requires review rather than fresh invitation',()=>{
 const p=j.describe({learner:learner({auth_user_id:'auth'}),edition:edition(),enrollment:enrollment({status:'revoked'})});
 assert.equal(item(p,'enrollment').status,'warn');
 assert.equal(item(p,'attendance').status,'todo');
 assert.match(p.next,/revocata/);
});
test('invitation states distinguish delivered, failed, missing email and linked account',()=>{
 const e=enrollment();
 const sent=j.describe({learner:learner(),edition:edition(),enrollment:e,invitation:{status:'sent'}});
 assert.equal(item(sent,'account').status,'wait');
 assert.match(sent.next,/attivato/);
 const failed=j.describe({learner:learner(),edition:edition(),enrollment:e,invitation:{status:'failed'}});
 assert.equal(item(failed,'account').status,'warn');
 assert.equal(failed.action,'go-access');
 const missing=j.describe({learner:learner({email:null}),edition:edition(),enrollment:e});
 assert.match(missing.next,/recapiti/);
 const linked=j.describe({learner:learner({auth_user_id:'account'}),edition:edition(),enrollment:e});
 assert.equal(item(linked,'account').status,'done');
 assert.equal(item(linked,'availability').status,'done');
});
test('dates block availability without guessing access time, while progress is not certification',()=>{
 const t=Date.parse('2026-11-02T12:00:00Z');
 const future=j.describe({learner:learner({auth_user_id:'account'}),edition:edition({available_from:'2026-11-04T08:00:00Z'}),
  enrollment:enrollment(),now:t});
 assert.equal(item(future,'availability').status,'wait');
 assert.match(future.next,/Disponibile dal/);
 const expired=j.describe({learner:learner({auth_user_id:'account'}),edition:edition({available_until:'2026-10-01T00:00:00Z'}),
  enrollment:enrollment(),now:t});
 assert.equal(item(expired,'availability').status,'wait');
 const inProgress=j.describe({learner:learner({auth_user_id:'account'}),edition:edition(),
  enrollment:enrollment({status:'in_progress',active_seconds:3670,progress_pct:67}),now:t});
 assert.equal(item(inProgress,'attendance').status,'now');
 assert.equal(inProgress.minutes,61);
 assert.match(inProgress.next,/frequenza/);
 assert.equal(inProgress.completedDigital,false);
 const completed=j.describe({learner:learner({auth_user_id:'account'}),edition:edition(),
  enrollment:enrollment({status:'passed',final_score_pct:91,progress_pct:100})});
 assert.equal(item(completed,'attendance').status,'done');
 assert.equal(item(completed,'verification').status,'now');
 assert.match(completed.next,/attestato/);
 assert.equal(completed.completedDigital,true);
 const failed=j.describe({learner:learner({auth_user_id:'account'}),edition:edition(),
  enrollment:enrollment({status:'failed',final_score_pct:23})});
 assert.equal(item(failed,'verification').status,'warn');
});
test('v46.7 scope guard rejects foreign, inactive or company mismatched learners',()=>{
 assert.equal(j.scopeMatches(learner(),edition(),company,org),true);
 assert.equal(j.scopeMatches(learner({company_id:'other'}),edition(),company,org),false);
 assert.equal(j.scopeMatches(learner({active:false}),edition(),company,org),false);
 assert.equal(j.scopeMatches(learner({organization_id:'other'}),edition(),company,org),false);
 assert.equal(j.scopeMatches(learner(),edition({organization_id:'other'}),company,org),false);
 assert.equal(j.scopeMatches(learner(),edition({company_id:null}),company,org),true);
});
test('read-only fetch is restricted by edition and selected learner IDs and tolerates invitation errors',async()=>{
 const calls=[];
 function qb(name){
  return {select(cols){calls.push([name,'select',cols]);return this;},
   eq(col,value){calls.push([name,'eq',col,value]);return this;},
   in(col,ids){calls.push([name,'in',col,Array.from(ids)]);return Promise.resolve(
    name==='enrollments'?{data:[enrollment()],error:null}:
     {data:null,error:{message:'not permitted'}});}};
 }
 const result=await j.read({from(name){return qb(name);}},{editionId:'e1',learners:[learner(),learner()]});
 assert.equal(result.enrollments.size,1);
 assert.equal(result.invites.size,0);
 assert.match(result.inviteNotice,/non consultabile/);
 assert.ok(calls.some(x=>x[0]==='enrollments'&&x[1]==='eq'&&x[2]==='edition_id'&&x[3]==='e1'));
 assert.ok(calls.some(x=>x[0]==='learner_account_invitations'&&x[1]==='in'&&x[2]==='learner_id'&&x[3].join(',')==='l1'));
 await assert.rejects(()=>j.read(null,{editionId:'e1',learners:[learner()]}),/Seleziona/);
 await assert.rejects(()=>j.read({from(){throw Error('should not be called');}},{editionId:'e1',learners:[]}),/Seleziona/);
 assert.doesNotMatch(entry,/\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/);
});
test('HTML safely escapes learner details and keeps actions in the existing admin routing',()=>{
 const html=j.render({learners:[learner({first_name:'<img src=x onerror=alert(1)>',last_name:'\"><script>alert(1)</script>'})],
  edition:edition(),companyId:company,orgId:org,snapshot:{enrollments:new Map([['l1',enrollment()]]),invites:new Map()}});
 assert.doesNotMatch(html,/<script>|<img src=x/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/gw-journey-steps/);
 assert.match(html,/data-gw="go-access"/);
 assert.match(html,/non equivale a idoneità pratica/i);
});
test('dashboard, help, PWA and both handoffs share the unified flow',()=>{
 const admin=read('apps/training/admin.js');
 const backend=read('apps/training/admin-backend-v21.js');
 for(const src of [admin,backend]){
  assert.match(src,/Sequenza unica · Avvia percorso/);
  assert.match(src,/gw-unified-preview/);
  assert.match(src,/data-jump="wizard"/);
  assert.doesNotMatch(src,/data-jump="companies"><b>1<\/b><span>Azienda/);
 }
 const help=read('apps/training/admin-help-v22.js');
 assert.match(help,/riprendi un corso già assegnato/i);
 const html=read('apps/training/index.html');
 assert.ok(html.includes('admin-guided-journey-v46-7.js'));
 assert.ok(html.includes('admin-guided-journey-v46-7.css'));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-7-unified-journey'/);
 assert.ok(sw.includes('./admin-guided-journey-v46-7.js'));
 assert.ok(sw.includes('./admin-guided-journey-v46-7.css'));
 assert.match(read('package.json'),/tests\/admin-guided-journey-v46-7\.test\.mjs/);
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(path);
  assert.ok(doc.slice(0,950).includes('safety-training-v46-7-unified-journey'),path);
  assert.match(doc,/v46\.7 — Avvia percorso come punto unico/i);
 }
});
