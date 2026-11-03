import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('apps/training/admin-internal-v47.js');
const sql=read('supabase/migrations/20261103110000_v47_6_multi_course_history.sql');

test('free internal learner creation does not access null assignments during an auth refresh',()=>{
 assert.match(ui,/async function requireData\(\)/);
 assert.match(ui,/if\(state\.data&&Array\.isArray\(state\.data\.assignments\)/);
 assert.match(ui,/if\(!await load\(\)\|\|!state\.data\)throw new Error/);
 assert.match(ui,/const snapshot=await requireData\(\)/);
 assert.match(ui,/const existing=\(snapshot\.assignments\|\|\[\]\)\.find/);
 assert.doesNotMatch(ui,/const existing=\(state\.data\.assignments\|\|\[\]\)/);
 assert.match(ui,/if\(!data\|\|!Array\.isArray\(data\.assignments\)\|\|!Array\.isArray\(data\.courses\)\)/);
});

test('a person is identified by one fiscal code and can attend different courses simultaneously',()=>{
 assert.match(sql,/on private\.internal_assignments_v47\(person_id,course_version_id\) where active/);
 assert.match(sql,/drop constraint if exists internal_assignment_v47_one_version/);
 assert.match(sql,/and a\.course_version_id=p_course_version_id and a\.active/);
 assert.match(sql,/raise exception 'course_already_assigned'/);
 assert.match(ui,/a\.course_version_id===version&&a\.active/);
 assert.match(ui,/p_fiscal_code:cf/);
 assert.match(ui,/p_course_version_id:version/);
 assert.match(sql,/on conflict\(organization_id,fiscal_code\) do update/);
});

test('repeat creates a new course link without deleting or overwriting any previous progress',()=>{
 assert.match(sql,/create or replace function public\.internal_admin_repeat_v47_6/);
 assert.match(sql,/where a\.id=p_assignment_id for update/);
 assert.match(sql,/if not private\.can_manage_training_org\(previous_assignment\.organization_id\)/);
 assert.match(sql,/update private\.internal_assignments_v47 set active=false/);
 assert.match(sql,/created:=public\.internal_admin_assign_v47\(/);
 assert.match(sql,/'repeated_from',previous_assignment\.id/);
 assert.doesNotMatch(sql,/\b(?:delete from|truncate|drop table)\s+private\.internal_(?:visits|slide_visits|assignments|people)/i);
 assert.match(ui,/internal_admin_repeat_v47_6/);
 assert.match(ui,/data-internal-repeat/);
 assert.match(ui,/async function repeatCourse\(id\)/);
 assert.match(ui,/if\(!a\.active\)\{/);
 assert.match(ui,/Nuovo percorso creato, storico conservato/);
});

test('admin lists version-specific assignments with their own created dates and active history state',()=>{
 assert.match(sql,/'course_version_id',a\.course_version_id/);
 assert.match(ui,/Assegnato: /);
 assert.match(ui,/Storico · terminato/);
 assert.match(ui,/Storico · disattivato/);
 assert.match(ui,/Un corsista può seguire più corsi contemporaneamente/);
});

test('no course, learning-unit, certifications, user account or historical record content is altered',()=>{
 assert.doesNotMatch(sql,/\b(?:update|delete from|truncate|alter table)\s+public\.(?:courses|course_versions|learning_units|learning_unit_versions|course_modules|course_module_units|learners|enrollments)\b/i);
 assert.doesNotMatch(sql,/from\s+auth\.users/i);
 assert.match(sql,/revoke all on function public\.internal_admin_assign_v47/);
 assert.match(sql,/to authenticated/);
 assert.doesNotMatch(sql,/\b(?:delete from|truncate)\s+private\.internal_/i);
});
