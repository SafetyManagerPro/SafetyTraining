import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('apps/training/admin-internal-v47.js');
const sql=read('supabase/migrations/20261104115002_v47_11_fast_copy_regular_learners.sql');
const css=read('apps/training/admin-internal-v47.css');

test('source learner lookup is read-only, organization-scoped, authenticated and capped',()=>{
 assert.match(sql,/create or replace function public\.internal_admin_import_candidates_v47_11/);
 assert.match(sql,/auth\.uid\(\) is null or not private\.can_manage_training_org\(p_org_id\)/);
 assert.match(sql,/from public\.learners l/);
 assert.match(sql,/left join public\.companies co on co\.id=l\.company_id and co\.organization_id=p_org_id/);
 assert.match(sql,/where l\.organization_id=p_org_id and l\.active/);
 assert.match(sql,/limit 60/);
 assert.match(sql,/grant execute on function public\.internal_admin_import_candidates_v47_11/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.doesNotMatch(sql,/\b(?:alter table|drop table|truncate table)\b/i);
 assert.doesNotMatch(sql,/\b(?:update|delete from|insert into)\s+public\.(?:learners|companies)/i);
 assert.doesNotMatch(sql,/\b(?:link_id|regular_learner_id|foreign key)\b/i);
});

test('optional copied phone/job fields only fill blank internal fields in the same course-assignment transaction',()=>{
 assert.match(sql,/create or replace function public\.internal_admin_import_assign_v47_11/);
 assert.match(sql,/created:=public\.internal_admin_assign_company_v47_9/);
 assert.match(sql,/phone=coalesce\(nullif\(p\.phone,''\),phone_value\)/);
 assert.match(sql,/job_title=coalesce\(nullif\(p\.job_title,''\),job_value\)/);
 assert.match(sql,/p\.organization_id=p_org_id/);
 assert.doesNotMatch(sql,/\b(?:delete from|truncate)\s+private\.internal_/i);
 assert.doesNotMatch(sql,/\bupdate\s+private\.internal_(?:assignments|visits|slide_visits)/i);
});

test('quick import button appears in assignment form without requiring it to use the old quick method',()=>{
 assert.match(ui,/id="iv47ImportButton"/);
 assert.match(ui,/id="iv47ImportModal"/);
 assert.match(ui,/id="iv47ImportSearch"/);
 assert.match(ui,/id="iv47ImportResults"/);
 assert.match(ui,/data-iv47-import-id/);
 assert.match(ui,/async function searchImport\(query=''\)/);
 assert.match(ui,/function useImport\(id\)/);
 assert.match(ui,/function closeImport\(\)/);
 assert.match(ui,/function openImport\(\)/);
 assert.match(ui,/internal_admin_assign_company_v47_9',args/);
 assert.match(ui,/internal_admin_import_assign_v47_11/);
 assert.match(ui,/const extras=state\.importExtras\?\.cf===cf\?state\.importExtras:null/);
 assert.match(ui,/state\.importExtras=null/);
 assert.match(css,/#iv47ImportButton/);
 assert.match(css,/\.iv47-import-overlay\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
});

function fixture(){
 const fromRegular=[
  {id:'regular-1',first_name:'Elena',last_name:'Rossi',fiscal_code:'RSSLNE90A01H501X',
   email:'elena@example.invalid',company_name:'Impresa Beta',phone:'+39 333 555 0011',job_title:'Tecnica'},
  {id:'regular-2',first_name:'Luca',last_name:'Bianchi',fiscal_code:'BNCLCU90A01H501K',
   email:'luca@example.invalid',company_name:'Azienda Alfa',phone:'',job_title:''}
 ];
 const existing={
  id:'internal-2',first_name:'Luca',last_name:'Bianchi',fiscal_code:'BNCLCU90A01H501K',
  email:'interno@example.invalid',company_name:'Azienda interna',archived_at:null
 };
 const data={organization_id:'org-1',organizations:[{id:'org-1',name:'Org'}],
  courses:[{version_id:'course-1',title:'Formazione interna',unit_count:8,version_number:1}],
  people:[existing],companies:[],assignments:[]};
 const calls=[];
 const nodes={};
 const element=(value='')=>({value,hidden:true,disabled:false,innerHTML:'',
  textContent:'',addEventListener(){},focus(){},scrollIntoView(){},
  querySelectorAll(){return [];},classList:{add(){},remove(){},toggle(){}}});
 const ids=['iv47First','iv47Last','iv47CF','iv47Email','iv47Company','iv47Person','iv47SaveCompany',
  'iv47ImportModal','iv47ImportButton','iv47ImportClose','iv47ImportSearch','iv47ImportResults',
  'iv47AssignCard','iv47LinkCard','iv47Rows','iv47ResultCount','iv47EditForm','iv47EditSummary'];
 for(const id of ids)nodes[id]=element();
 nodes.iv47Form={querySelector(selector){return nodes[selector.slice(1)];},addEventListener(){}};
 nodes.iv47Course=element('course-1');
 nodes.adminContent=element();
 const document={readyState:'loading',addEventListener(){},querySelector(){return null;},
  getElementById(id){return nodes[id]||null;}};
 const window={SAFETY_CLOUD:{state:{client:{rpc:async(name,args)=>{
  calls.push([name,args]);
  if(name==='internal_admin_import_candidates_v47_11')return {data:fromRegular.filter(x=>
   !args.p_query || [x.first_name,x.last_name,x.fiscal_code].join(' ').toLowerCase().includes(args.p_query.toLowerCase())),error:null};
  if(name==='internal_admin_state_v47')return {data,error:null};
  return {data:{assignment_id:'new-assignment'},error:null};
 }}}},SAFETY_ACCESS_V46_10:{state:{phase:'admin'}},SAFETY_ADMIN_MENU_V39:{reconcile(){}}};
 const source=ui.replace('window.SAFETY_INTERNAL_V47={open};',
  'window.__test={state,openImport,searchImport,useImport,closeImport,assign};window.SAFETY_INTERNAL_V47={open};');
 assert.notEqual(source,ui);
 runInNewContext(source,{window,document,crypto:webcrypto,btoa,TextEncoder,Intl,Date,
  setTimeout,clearTimeout,navigator:{clipboard:{writeText:async()=>{}}},confirm:()=>true,console});
 const api=window.__test;
 api.state.org='org-1';api.state.open=true;api.state.data=data;
 return {api,calls,nodes,fromRegular,existing,data};
}

test('choosing an unregistered learner only fills form (no write) then quick assign imports optional details',async()=>{
 const {api,calls,nodes}=fixture();
 await api.searchImport('Rossi'); // closed modal: no data request until opened
 assert.equal(calls.filter(([name])=>name==='internal_admin_import_candidates_v47_11').length,0);
 api.openImport();
 await api.searchImport('Rossi');
 assert.equal(api.state.importOpen,true);
 assert.match(nodes.iv47ImportResults.innerHTML,/Rossi Elena/);
 assert.match(nodes.iv47ImportResults.innerHTML,/Impresa Beta/);
 const writesBefore=calls.filter(([name])=>name==='internal_admin_import_assign_v47_11'||name==='internal_admin_assign_company_v47_9');
 assert.equal(writesBefore.length,0);
 api.useImport('regular-1');
 assert.equal(api.state.importOpen,false);
 assert.equal(nodes.iv47ImportModal.hidden,true);
 assert.equal(nodes.iv47Person.value,'');
 assert.equal(nodes.iv47First.value,'Elena');
 assert.equal(nodes.iv47Last.value,'Rossi');
 assert.equal(nodes.iv47CF.value,'RSSLNE90A01H501X');
 assert.equal(nodes.iv47Email.value,'elena@example.invalid');
 assert.equal(nodes.iv47Company.value,'Impresa Beta');
 assert.equal(calls.filter(([name])=>name==='internal_admin_import_assign_v47_11').length,0);
 assert.equal(api.state.importExtras.job_title,'Tecnica');
 await api.assign({preventDefault(){}});
 const saved=calls.filter(([name])=>name==='internal_admin_import_assign_v47_11');
 assert.equal(saved.length,1);
 assert.equal(saved[0][1].p_phone,'+39 333 555 0011');
 assert.equal(saved[0][1].p_job_title,'Tecnica');
 assert.equal(saved[0][1].p_org_id,'org-1');
 assert.equal(saved[0][1].p_course_version_id,'course-1');
 assert.match(saved[0][1].p_token_hash,/^[a-f0-9]{64}$/);
 assert.equal(api.state.importExtras,null);
});

test('existing fiscal code reuses its internal profile and does not override its stored information',async()=>{
 const {api,calls,nodes}=fixture();
 api.openImport();
 await api.searchImport('Bianchi');
 api.useImport('regular-2');
 assert.equal(nodes.iv47Person.value,'internal-2');
 assert.equal(nodes.iv47Email.value,'interno@example.invalid');
 assert.equal(nodes.iv47Company.value,'Azienda interna');
 assert.equal(api.state.importExtras,null);
 await api.assign({preventDefault(){}});
 assert.equal(calls.filter(([name])=>name==='internal_admin_assign_company_v47_9').length,1);
 assert.equal(calls.filter(([name])=>name==='internal_admin_import_assign_v47_11').length,0);
 assert.equal(api.state.link.startsWith('https://safety-training-safety-manager.vercel.app/interno.html#t='),true);
});

test('imported phone/job are ignored if user changes fiscal code before saving',async()=>{
 const {api,calls,nodes}=fixture();
 api.openImport();
 await api.searchImport('Rossi');
 api.useImport('regular-1');
 nodes.iv47CF.value='RSSLNE90A01H501Y';
 await api.assign({preventDefault(){}});
 assert.equal(calls.filter(([name])=>name==='internal_admin_assign_company_v47_9').length,1);
 assert.equal(calls.filter(([name])=>name==='internal_admin_import_assign_v47_11').length,0);
});

test('changing organization, archived profiles and canceled import cannot mutate existing data',()=>{
 assert.match(ui,/org!==state\.org/);
 assert.match(ui,/if\(internal\?\.archived_at\)/);
 assert.match(ui,/state\.filterStatus='archived'/);
 assert.match(ui,/state\.importSeq\+\+/);
 assert.match(ui,/state\.importSeq\+\+;state\.importResults=\[\]/);
 assert.match(ui,/state\.importExtras=null;state\.filterStatus='all'/);
 assert.match(ui,/clearTimeout\(state\.importTimer\)/);
});
