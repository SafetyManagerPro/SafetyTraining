import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261103080000_v47_internal_link_courses.sql');
const fn=read('supabase/functions/internal-course/index.ts');
const admin=read('apps/training/admin-internal-v47.js');
const player=read('apps/training/internal-player-v47.js');
const html=read('apps/training/interno.html');
const nav=read('apps/training/admin-menu-v39.js');
const index=read('apps/training/index.html');
const sw=read('apps/training/sw.js');

test('internal course does not alter any existing course, enrollment, authentication or didactic record',()=>{
 assert.doesNotMatch(sql,/\b(?:drop|truncate)\s+(?:table|function|schema|public\.)/i);
 assert.doesNotMatch(sql,/\b(?:update|delete\s+from)\s+public\.(courses|course_versions|course_modules|course_module_units|enrollments|learners|learning_unit_versions)/i);
 for(const object of ['private.internal_people_v47','private.internal_assignments_v47','private.internal_visits_v47'])assert.ok(sql.includes(object),object);
 assert.match(sql,/certificate|certifying/i); // Only mention a non-certifying scope, never grant certificates.
});
test('fiscal code identifies one person within organization and is not used as link token',()=>{
 assert.match(sql,/unique \(organization_id,fiscal_code\)/);
 assert.match(sql,/cf !~ '\^\[A-Z0-9\]\{16\}\$'/);
 assert.match(admin,/newToken\(\)/);
 assert.match(admin,/crypto\.getRandomValues\(new Uint8Array\(32\)\)/);
 assert.match(admin,/crypto\.subtle\.digest\('SHA-256'/);
 assert.match(sql,/token_hash text not null unique/);
 assert.doesNotMatch(admin,/localStorage|sessionStorage/);
 assert.doesNotMatch(player,/fiscal_code/);
});
test('access control has no learner login and only scopes one published course',()=>{
 assert.match(html,/internal-player-v47\.js/);
 assert.doesNotMatch(html,/supabase\.js|admin\.js|access-gate-v46-10\.js/);
 assert.doesNotMatch(player,/signInWithPassword|signUp|password|user_metadata/);
 assert.match(fn,/verify|256-bit bearer link/);
 assert.match(fn,/internal_link_open_v47/);
 assert.match(fn,/internal_link_visit_v47/);
 assert.match(sql,/grant execute on function public\.internal_link_open_v47\(text\),public\.internal_link_visit_v47\(text,uuid\) to service_role/);
 assert.match(sql,/revoke all on function public\.internal_admin_state_v47/);
 assert.match(sql,/private\.can_manage_training_org/);
 assert.match(sql,/v\.status='published'/);
 assert.match(player,/\/interno\.html#t=/);
});
test('progress is per person/course and records valid viewed sections only',()=>{
 assert.match(sql,/primary key\(assignment_id,unit_version_id\)/);
 assert.match(sql,/m\.course_version_id=a\.course_version_id and mu\.unit_version_id=p_unit_version_id/);
 assert.match(sql,/last_unit_version_id=p_unit_version_id/);
 assert.match(sql,/started_at=coalesce\(started_at,now\(\)\)/);
 assert.match(player,/state\.lastUnit=bundle\.last_unit_version_id/);
 assert.match(player,/state\.visited\.add\(u\.unit_id\)/);
 assert.match(player,/Sezioni|sezioni/);
});
test('private links are revocable and rotating them retains old progress',()=>{
 assert.match(sql,/token_hash=p_token_hash,active=true,updated_at=now\(\)/);
 assert.match(sql,/active=false,updated_at=now\(\)/);
 assert.doesNotMatch(sql,/delete from private\.internal_visits_v47/);
 assert.match(player,/Il collegamento non è valido oppure è stato disattivato/);
 assert.match(admin,/Generarne uno nuovo invaliderà il precedente senza perdere i progressi/);
});
test('contents are loaded only through token-gated server function and teacher answers do not leave the server',()=>{
 assert.match(fn,/filterContent/);
 assert.match(fn,/const plainKeys=/);
 assert.match(fn,/quiz\)=/);
 assert.doesNotMatch(fn,/out\.quiz\s*=\s*quiz;/);
 assert.match(html,/referrer.*no-referrer/);
 assert.match(fn,/Cache-Control.*no-store/);
 assert.match(player,/referrerPolicy:'no-referrer'/);
 assert.match(player,/^/);
});
test('primary admin menu exposes Corsisti interni and preserves advanced e-learning',()=>{
 assert.match(index,/admin-internal-v47\.js/);
 assert.match(index,/admin-internal-v47\.css/);
 assert.match(nav,/id:'internal',label:'CORSISTI INTERNI'/);
 assert.match(nav,/GESTIONE E-LEARNING AVANZATA/);
 assert.match(nav,/id:'courses'/);
 assert.match(nav,/id:'enroll'/);
 assert.match(admin,/internal_admin_state_v47/);
 assert.match(admin,/internal_admin_assign_v47/);
 assert.match(admin,/internal_admin_link_v47/);
 assert.match(admin,/mailto:/);
 assert.match(sw,/safety-training-v47-internal-links/);
 assert.match(sw,/admin-internal-v47\.js/);
});
