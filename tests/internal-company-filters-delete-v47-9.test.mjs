import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('apps/training/admin-internal-v47.js');
const sql=read('supabase/migrations/20261103123352_v47_9_internal_company_archive.sql');
const style=read('apps/training/admin-internal-v47.css');

test('company is optional, stored only for internal people and displayed with Generic fallback',()=>{
 assert.match(sql,/add column if not exists company_name text not null default 'Generico'/);
 assert.match(sql,/add column if not exists archived_at timestamptz/);
 assert.match(sql,/'company_name',p.company_name/);
 assert.match(sql,/'archived_at',p.archived_at/);
 assert.match(sql,/from public.companies co where co.organization_id=chosen and co.active/);
 assert.match(sql,/'companies',companies/);
 assert.match(ui,/id="iv47Company"/);
 assert.match(ui,/list="iv47Companies"/);
 assert.match(ui,/Generico \(nessuna azienda\)/);
 assert.match(ui,/internal_admin_assign_company_v47_9/);
 assert.match(ui,/internal_admin_company_v47_9/);
 assert.match(ui,/p_company_name:company\|\|null/);
 assert.match(ui,/esc\(a.company_name\|\|'Generico'\)/);
 assert.match(ui,/id="iv47SaveCompany"/);
 assert.match(sql,/if name_value is not null then/);
});

test('filters for course and status do not modify slide order, stored progress or assignments',()=>{
 for(const pattern of [/id="iv47CourseFilter"/,/id="iv47StatusFilter"/,/filterStatus==='archived'/,
  /filterCourse\|\|a.course_version_id===filterCourse/,/statusKey\(a\)===filterStatus/,
  /state.filterCourse=event.target.value;paintRows\(\)/,
  /state.filterStatus=event.target.value;paintRows\(\)/,
  /state.search=event.target.value;paintRows\(\)/,
  /const items=alpha\(source.filter/])assert.match(ui,pattern);
 assert.match(ui,/Da iniziare/);
 assert.match(ui,/In corso/);
 assert.match(ui,/Tutte le slide aperte/);
 assert.match(ui,/Disattivato/);
 assert.match(ui,/Eliminati/);
 assert.doesNotMatch(sql,/\b(?:update|delete from|truncate)\s+public\.(courses|course_versions|learning_unit_versions|course_modules|learners|enrollments)\b/i);
 assert.match(style,/\.iv47 \.iv47-filters/);
});

test('Elimina corsista revokes EVERY active link, preserves progress and provides restoration',()=>{
 assert.match(sql,/create or replace function public\.internal_admin_archive_person_v47_9/);
 assert.match(sql,/select \* into person_row from private\.internal_people_v47 where id=p_person_id for update/);
 assert.match(sql,/if not private\.can_manage_training_org\(person_row.organization_id\)/);
 assert.match(sql,/update private\.internal_assignments_v47 set active=false,updated_at=now\(\)/);
 assert.match(sql,/get diagnostics revoked_count = row_count/);
 assert.match(sql,/archived_at=coalesce\(archived_at,now\(\)\)/);
 assert.match(sql,/if p_restore then[\s\S]*?archived_at=null/);
 assert.doesNotMatch(sql,/\bdelete from private\.internal_/i);
 assert.match(sql,/grant execute on function public\.internal_admin_assign_v47/);
 assert.match(sql,/public\.internal_admin_archive_person_v47_9\(uuid,boolean\)/);
 assert.match(sql,/public\.internal_admin_state_v47\(uuid\) to authenticated/);
 assert.match(ui,/data-internal-delete-person/);
 assert.match(ui,/data-internal-restore-person/);
 assert.match(ui,/async function archivePerson\(personId,restore\)/);
 assert.match(ui,/Verranno disattivati/);
 assert.match(ui,/Le slide già viste e lo storico rimarranno conservati/);
 assert.doesNotMatch(ui,/from\('learners'\)\.delete/);
});

test('mock admin UI filters independent courses and archives all learner links without losing progress',async()=>{
 const a1={id:'a1',person_id:'p1',course_version_id:'v1',course_title:'Antincendio',
  company_name:'Impresa Alfa',first_name:'Anna',last_name:'Verdi',fiscal_code:'VRDNNA90A01H501Z',
  active:true,started_at:'2026-10-01',visited_slides:8,total_slides:10,last_slide_index:8,version_number:1};
 const a2={...a1,id:'a2',course_version_id:'v2',course_title:'Carrelli',started_at:null,visited_slides:0,last_slide_index:null};
 const a3={...a1,id:'a3',person_id:'p2',first_name:'Luca',last_name:'Zeta',
  fiscal_code:'ZTALCU90A01H501M',company_name:'Generico',course_version_id:'v2',course_title:'Carrelli'};
 const data={organization_id:'org1',organizations:[{id:'org1',name:'Organizzazione'}],
  companies:[{id:'co1',name:'Impresa Alfa'}],
  courses:[{version_id:'v1',title:'Antincendio',version_number:1,unit_count:5},
   {version_id:'v2',title:'Carrelli',version_number:1,unit_count:5}],
  people:[{id:'p1',first_name:'Anna',last_name:'Verdi',fiscal_code:'VRDNNA90A01H501Z',
   company_name:'Impresa Alfa',archived_at:null},{id:'p2',first_name:'Luca',last_name:'Zeta',
   fiscal_code:'ZTALCU90A01H501M',company_name:'Generico',archived_at:null}],
  assignments:[a1,a2,a3]};
 const calls=[],rows={innerHTML:'',querySelectorAll:()=>[]},info={textContent:''};
 const root={innerHTML:'',querySelectorAll:()=>[]};
 const document={readyState:'loading',addEventListener(){},querySelector(){return null;},
  getElementById(id){
   if(id==='adminContent')return root;
   if(id==='iv47Rows')return rows;
   if(id==='iv47ResultCount')return info;
   if(id==='iv47Search')return {value:''};
   return null;
  }};
 const window={SAFETY_CLOUD:{state:{client:{rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='internal_admin_archive_person_v47_9'){
   const person=data.people.find(p=>p.id===args.p_person_id);
   person.archived_at=args.p_restore?null:'2026-11-03';
   data.assignments.filter(a=>a.person_id===args.p_person_id).forEach(a=>{
    a.archived_at=person.archived_at;
    if(!args.p_restore)a.active=false;
   });
   return {data:{archived:!args.p_restore},error:null};
  }
  return {data:name==='internal_admin_state_v47'?data:{},error:null};
 }}}},SAFETY_ACCESS_V46_10:{state:{phase:'admin'}},SAFETY_ADMIN_MENU_V39:{reconcile(){}}};
 const code=ui.replace('window.SAFETY_INTERNAL_V47={open};',
  'window.__vTest={state,paintRows,archivePerson,statusKey};window.SAFETY_INTERNAL_V47={open};');
 assert.notEqual(code,ui);
 runInNewContext(code,{window,document,console,confirm:()=>true,alert:()=>{},Intl});
 const {state,paintRows,archivePerson,statusKey}=window.__vTest;
 state.data=data;state.org='org1';state.open=true;
 paintRows();assert.equal(info.textContent,'3 percorsi visualizzati');
 assert.match(rows.innerHTML,/Impresa Alfa/);assert.match(rows.innerHTML,/Generico/);
 state.filterCourse='v1';paintRows();assert.equal(info.textContent,'1 percorsi visualizzati');
 assert.match(rows.innerHTML,/Antincendio/);assert.doesNotMatch(rows.innerHTML,/Carrelli/);
 state.filterCourse='';state.filterStatus='not_started';paintRows();
 assert.equal(info.textContent,'1 percorsi visualizzati');
 assert.match(rows.innerHTML,/Verdi Anna/);
 state.filterStatus='all';
 await archivePerson('p1',false);
 assert.equal(calls.filter(c=>c.name==='internal_admin_archive_person_v47_9').length,1);
 assert.equal(a1.active,false);assert.equal(a2.active,false);
 assert.equal(a1.visited_slides,8);assert.equal(a1.last_slide_index,8);
 paintRows();assert.equal(info.textContent,'1 percorsi visualizzati');
 state.filterStatus='archived';paintRows();assert.equal(info.textContent,'2 percorsi visualizzati');
 assert.match(rows.innerHTML,/Ripristina corsista/);
 assert.equal(statusKey(a1),'archived');
 await archivePerson('p1',true);
 assert.equal(data.people[0].archived_at,null);
 assert.equal(a1.active,false,'old links must stay revoked on restoration');
 assert.equal(a1.visited_slides,8);
});
