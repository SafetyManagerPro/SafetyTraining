import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('public registration has consent, no automatic account activation and minimal input',()=>{
 const js=file('apps/training/public-registration-v36.js');
 assert.doesNotThrow(()=>new Function(js));
 for(const needle of ['public_registration_info_v36','public_registration_submit_v36','p_privacy_acknowledged','name="website"','maxlength="254"','Richiesta ricevuta']){
  assert.ok(js.includes(needle),needle);
 }
 assert.doesNotMatch(js,/admin_bulk_enroll|auth\.signUp|auth\.admin/);
});
test('registration is per edition, QR share uses canonical production URL, and reviews are explicit',()=>{
 const js=file('apps/training/admin-registration-v36.js');
 assert.doesNotThrow(()=>new Function(js));
 for(const needle of ['https://safety-training-safety-manager.vercel.app/','admin_create_registration_link_v36',
  'admin_disable_registration_link_v36','public_registration_submit_v36','admin_registration_decide_v36',
  'Confermi di aver verificato i dati','QRCode','Scarica QR','pending']){
  if(needle==='public_registration_submit_v36')continue;
  assert.ok(js.includes(needle),needle);
 }
});
test('archiving is reversible and permanent deletion remains through guarded planner',()=>{
 const app=file('apps/training/admin.js');
 const sql=file('supabase/migrations/20261022144000_v36_public_registration.sql');
 for(const needle of ['Rimuovi corsista','Mostra','showArchivedLearners','admin_archive_learner_v36','quick-delete-learner-v38'])
  assert.ok(app.includes(needle),needle);
 assert.match(sql,/update public\.learners set active=false/);
 assert.doesNotMatch(sql,/delete from public\.learners/);
 assert.match(sql,/private\.can_manage_training_org/);
 assert.match(sql,/revoke execute on function public\.admin_archive_learner_v36\(uuid\) from public,anon/);
});
test('signup databases are private, requests await approval, public functions are allowlisted',()=>{
 const sql=file('supabase/migrations/20261022144000_v36_public_registration.sql');
 assert.match(sql,/create table if not exists private\.course_registration_links_v36/);
 assert.match(sql,/create table if not exists private\.course_registration_requests_v36/);
 assert.match(sql,/status text not null default 'pending'/);
 assert.match(sql,/alter table private\.course_registration_requests_v36 enable row level security/);
 assert.match(sql,/revoke all on private\.course_registration_links_v36, private\.course_registration_requests_v36 from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.public_registration_info_v36\(text\)/);
});

test('archive severs live Auth linkage and restoration checks for conflicts',()=>{
 const archive=file('supabase/migrations/20261022163500_v37_learner_archive_auth_guard.sql');
 const app=file('apps/training/admin.js');
 assert.match(archive,/update public\.learners set active=false,auth_user_id=null/);
 assert.match(archive,/not exists\(select 1 from public\.learners where auth_user_id=v_saved/);
 assert.match(archive,/admin_restore_learner_v37/);
 assert.match(app,/restore-learner-v37/);
});
test('fast permanent deletion cannot cascade into recorded training evidence',()=>{
 const sql=file('supabase/migrations/20261022170000_v38_delete_unused_learner.sql');
 const app=file('apps/training/admin.js');
 for(const marker of [
  'learner_has_training_history_protected',
  'learner_has_training_activity_protected',
  'learner_has_training_evidence_protected',
  'linked_account_protected_use_detailed_deletion',
  'public.learning_events','public.learning_progress','public.learning_sessions',
  'public.test_attempts','public.question_attempts',
  'public.enrollment_requirement_evidence','public.enrollment_practice_assessments_v22',
  'admin_audit_log'
 ])assert.ok(sql.includes(marker),marker);
 assert.match(sql,/perform 1 from public\.enrollments where learner_id=p_learner_id for update/);
 assert.match(app,/admin_delete_unused_learner_v38/);
 assert.match(app,/reviewDeletion\('learner',id\)/);
});
