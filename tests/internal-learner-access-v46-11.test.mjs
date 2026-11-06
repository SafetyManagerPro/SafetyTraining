import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('apps/training/admin-quick-access-v46-11.js');
const cloud=read('apps/training/cloud-v20.js');
const gate=read('apps/training/access-gate-v46-10.js');
const sql=read('supabase/migrations/20261102210137_v46_11_simple_learner_access.sql');
const edge=read('supabase/functions/learner-access/index.ts');
test('auth fixes link a confirmed existing learner before choosing role',()=>{
 assert.match(cloud,/state\.client\.rpc\('claim_learner_account'\)/);
 assert.ok(cloud.indexOf("rpc('claim_learner_account')")<cloud.indexOf('const assignments=learner ? await loadAssignments'));
 const signIn=gate.slice(gate.indexOf('async function signIn(event)'),gate.indexOf('async function signOut()'));
 assert.match(signIn,/setPhase\('pending'\);\s*try\{/);
 assert.doesNotMatch(signIn,/notify\('Credenziali corrette[^\n]*\n\s*setPhase\('pending'\)/);
});
test('quick management exposes one enrollment, one-time credentials, and delete',()=>{
 for(const marker of ["Gestione rapida corsisti","qv11Enroll","qv11Activate","qv11Reset","qv11Delete",
  "admin_bulk_enroll","admin_set_enrollment_revoked","admin_delete_unused_learner_v38",
  "admin_archive_learner_v36","admin_set_learner_contact","elearning_internal",
  "certification_mode:'not_certifying'"]){
  assert.ok(ui.includes(marker),marker);
 }
 assert.match(ui,/p_confirmation:'ELIMINA'/);
 assert.match(ui,/confirm\('Vuoi eliminare/);
 assert.match(ui,/Storico e prove conservati/);
 assert.match(ui,/s\.busy=true/);
});
test('quick search acts on visible learner and email changes preserve the existing phone',()=>{
 assert.match(ui,/select\('id,first_name,last_name,email,phone,auth_user_id/);
 assert.match(ui,/if\(!matches\.some\(x=>x\.id===s\.learnerId\)\)s\.learnerId=matches\[0\]\?\.id\|\|''/);
 assert.match(ui,/p_email:email,p_phone:l\.phone\|\|null/);
 assert.doesNotMatch(ui,/p_email:email,p_phone:null/);
});
test('temporary passwords exist only in Auth and are shown once in the administrator screen',()=>{
 assert.match(edge,/crypto\.getRandomValues/);
 assert.match(edge,/admin\.auth\.admin\.createUser/);
 assert.match(edge,/admin\.auth\.admin\.updateUserById/);
 assert.match(edge,/auth\.getUser\(token\)/);
 assert.match(edge,/admin_prepare_learner_access_v46_11/);
 assert.match(edge,/admin_bind_learner_access_v46_11/);
 assert.match(edge,/'Cache-Control':'no-store'/);
 assert.doesNotMatch(edge,/console\.(?:log|info|debug)\([^)]*password/i);
 assert.match(ui,/navigator\.clipboard\.writeText\(words\)/);
 assert.match(ui,/Non.*password|password precedente/i);
 assert.doesNotMatch(ui,/localStorage\.(?:setItem|getItem)\([^)]*password/i);
});
test('scoped backend denies anonymous provisioning and cross-organization or privileged accounts',()=>{
 for(const marker of ["auth.uid() is null","private.can_manage_training_org(l.organization_id)",
  "learner_email_required","learner_email_already_assigned","linked_auth_email_mismatch",
  "privileged_auth_account_cannot_be_reassigned","confirmed_auth_account_required",
  "auth_email_does_not_match_learner","account_assigned_elsewhere",
  "revoke all on function public.admin_prepare_learner_access_v46_11(uuid) from public,anon",
  "revoke all on function public.admin_bind_learner_access_v46_11(uuid,uuid) from public,anon"]){
  assert.ok(sql.includes(marker),marker);
 }
 assert.ok(!sql.toLowerCase().includes('service_role'));
 assert.doesNotMatch(sql,/delete\s+from\s+public\.(?:enrollments|learners)/i);
});
test('PWA, help and both handoffs align to v46.11',()=>{
 const cache='safety-training-v46-11-internal-access';
 const html=read('apps/training/index.html');
 const sw=read('apps/training/sw.js');
 const pkg=read('package.json');
 assert.match(html,/admin-quick-access-v46-11\.js/);
 assert.match(sw,/admin-quick-access-v46-11\.js/);
 assert.match(sw,/safety-training-v46-11-internal-access/);
 assert.match(pkg,/tests\/internal-learner-access-v46-11\.test\.mjs/);
 assert.match(read('apps/training/admin-help-v22.js'),/Gestione rapida corsisti/);
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const text=read(path);
  assert.ok(text.slice(0,900).includes(cache));
  assert.match(text,/v46\.11 — Gestione interna semplice/);
 }
});
