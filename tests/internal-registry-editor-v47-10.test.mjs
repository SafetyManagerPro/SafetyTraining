import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('apps/training/admin-internal-v47.js');
const sql=read('supabase/migrations/20261103175734_v47_10_internal_registry_editor.sql');
const css=read('apps/training/admin-internal-v47.css');

test('registry editing is separate from course enrollment and exposes all expected fields',()=>{
 for(const id of ['iv47RegistryCard','iv47EditPerson','iv47EditForm','iv47EditFirst',
 'iv47EditLast','iv47EditCF','iv47EditEmail','iv47EditCompany','iv47EditPhone',
 'iv47EditJob','iv47EditBirthDate','iv47EditBirthCity','iv47EditAddress',
 'iv47EditNotes','iv47SavePerson','iv47CancelEdit'])assert.ok(ui.includes(id),id);
 assert.match(ui,/data-internal-edit-person/);
 assert.match(ui,/async function savePerson\(event\)/);
 assert.match(ui,/internal_admin_update_person_v47_10/);
 assert.match(ui,/function fillPersonEditor\(\)/);
 assert.match(css,/#iv47EditForm\[hidden\]\{display:none!important\}/);
 assert.match(sql,/alter table private\.internal_people_v47/);
 assert.match(sql,/'phone',p\.phone/);
 assert.match(sql,/'job_title',p\.job_title/);
 assert.match(sql,/'birth_date',p\.birth_date/);
 assert.match(sql,/'birth_city',p\.birth_city/);
 assert.match(sql,/'residence_address',p\.residence_address/);
 assert.match(sql,/'notes',p\.notes/);
 assert.match(sql,/'updated_at',p\.updated_at/);
});

test('backend edit is organization-scoped and keeps identity, links, courses and history unchanged',()=>{
 assert.match(sql,/create or replace function public\.internal_admin_update_person_v47_10/);
 assert.match(sql,/if auth\.uid\(\) is null then raise exception 'authentication_required'/);
 assert.match(sql,/private\.can_manage_training_org\(person_row\.organization_id\)/);
 assert.match(sql,/if person_row\.archived_at is not null/);
 assert.match(sql,/p_expected_updated_at is null or person_row\.updated_at is distinct from p_expected_updated_at/);
 assert.match(sql,/other\.fiscal_code=cf_value and other\.id<>person_row\.id/);
 assert.match(sql,/raise exception 'fiscal_code_already_used'/);
 assert.match(sql,/revoke all on function public\.internal_admin_update_person_v47_10/);
 assert.match(sql,/to authenticated/);
 assert.doesNotMatch(sql,/\b(?:delete from|truncate|update)\s+(?:public\.)?(?:courses|course_versions|course_modules|learning_unit_versions|learners|enrollments)\b/i);
 assert.doesNotMatch(sql,/\b(?:update|delete from|truncate)\s+private\.internal_(?:assignments|visits|slide_visits)/i);
 assert.match(sql,/update private\.internal_people_v47 set/);
});

test('editor loads an existing learner, saves added details and keeps course progress',async()=>{
 const learner={id:'person1',organization_id:'org1',first_name:'Giulia',
  last_name:'Bianchi',fiscal_code:'BNCGLL90A01H501Q',email:'giulia@example.invalid',
  company_name:'Generico',updated_at:'2026-11-03T14:00:00Z',archived_at:null,
  phone:null,job_title:null,birth_date:null,birth_city:null,residence_address:null,notes:null};
 const course={id:'assignment1',person_id:'person1',active:true,
  first_name:learner.first_name,last_name:learner.last_name,visited_slides:7,total_slides:20,
  course_title:'Sicurezza base',course_version_id:'v1',version_number:1};
 const data={organization_id:'org1',organizations:[{id:'org1',name:'Organizzazione'}],
  companies:[],courses:[{version_id:'v1',title:'Sicurezza base',version_number:1,unit_count:4}],
  people:[learner],assignments:[course]};
 const fieldIds=['iv47EditFirst','iv47EditLast','iv47EditCF','iv47EditEmail','iv47EditCompany','iv47EditPhone',
  'iv47EditJob','iv47EditBirthDate','iv47EditBirthCity','iv47EditAddress','iv47EditNotes'];
 const fields=Object.fromEntries(fieldIds.map(id=>[id,{value:''}]));
 const form={hidden:true,reportValidity:()=>true,addEventListener(){}};
 const selector={value:''};
 const root={innerHTML:'',querySelectorAll:()=>[]};
 const events=[];
 const document={readyState:'loading',addEventListener(){},querySelector(){return null;},
  getElementById(id){
   if(id==='adminContent')return root;
   if(id==='iv47EditForm')return form;
   if(id==='iv47EditPerson')return selector;
   if(id==='iv47RegistryCard')return {scrollIntoView(){}};
   return fields[id]||null;
  }};
 const window={SAFETY_CLOUD:{state:{client:{rpc:async(name,args)=>{
   events.push([name,args]);
   if(name==='internal_admin_update_person_v47_10'){
    Object.assign(learner,{first_name:args.p_first_name,last_name:args.p_last_name,
     fiscal_code:args.p_fiscal_code,email:args.p_email,company_name:args.p_company_name,
     phone:args.p_phone,job_title:args.p_job_title,birth_date:args.p_birth_date,
     birth_city:args.p_birth_city,residence_address:args.p_residence_address,
     notes:args.p_notes,updated_at:'2026-11-03T14:10:00Z'});
    return {data:{updated:true},error:null};
   }
   return {data:name==='internal_admin_state_v47'?data:{},error:null};
  }}}},SAFETY_ACCESS_V46_10:{state:{phase:'admin'}},
  SAFETY_ADMIN_MENU_V39:{reconcile(){}}};
 const code=ui.replace('window.SAFETY_INTERNAL_V47={open,openFromLearner};',
  'window.__registryTest={state,editPerson,fillPersonEditor,savePerson};window.SAFETY_INTERNAL_V47={open,openFromLearner};');
 assert.notEqual(code,ui);
 runInNewContext(code,{window,document,Intl,Date,confirm:()=>true,console});
 const {state,editPerson,savePerson}=window.__registryTest;
 state.open=true;state.org='org1';state.data=data;
 editPerson('person1');
 assert.equal(state.editPerson,'person1');
 assert.equal(selector.value,'person1');
 assert.equal(form.hidden,false);
 assert.equal(fields.iv47EditCF.value,'BNCGLL90A01H501Q');
 fields.iv47EditEmail.value='nuova@example.invalid';
 fields.iv47EditCompany.value='Studio Alfa';
 fields.iv47EditPhone.value='+39 333 1234567';
 fields.iv47EditJob.value='Impiegata';
 fields.iv47EditBirthDate.value='1990-01-01';
 fields.iv47EditBirthCity.value='Torino';
 fields.iv47EditAddress.value='Via Roma 5';
 fields.iv47EditNotes.value='Informazioni amministrative';
 await savePerson({preventDefault(){}});
 const calls=events.filter(([name])=>name==='internal_admin_update_person_v47_10');
 assert.equal(calls.length,1);
 assert.equal(calls[0][1].p_person_id,'person1');
 assert.equal(calls[0][1].p_expected_updated_at,'2026-11-03T14:00:00Z');
 assert.equal(calls[0][1].p_email,'nuova@example.invalid');
 assert.equal(calls[0][1].p_company_name,'Studio Alfa');
 assert.equal(calls[0][1].p_phone,'+39 333 1234567');
 assert.equal(calls[0][1].p_birth_city,'Torino');
 assert.equal(calls[0][1].p_notes,'Informazioni amministrative');
 assert.equal(course.visited_slides,7);
 assert.equal(course.total_slides,20);
 assert.equal(course.active,true);
 assert.equal(events.filter(([name])=>name==='internal_admin_assign_v47').length,0);
 assert.equal(state.editPerson,'person1');
});

test('editor guards against duplicate tax codes before any update call',async()=>{
 assert.match(ui,/const other=snapshot\.people\.find\(p=>p\.id!==person\.id&&p\.fiscal_code===cf\)/);
 assert.match(ui,/if\(other\)throw Error\('Il codice fiscale è già utilizzato/);
 assert.match(ui,/if\(!form\.reportValidity\(\)\)return/);
 assert.match(ui,/if\(birth&&birth>new Date\(\)\.toISOString\(\)\.slice\(0,10\)\)/);
});
