import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('apps/training/admin-registration-v36.js');
const sql=read('supabase/migrations/20261102193000_v46_9_cross_company_registration.sql');
test('v46.9 reproduces real cross-company block as a dedicated review rather than an automatic company transfer',()=>{
 const legacy=read('supabase/migrations/20261022144000_v36_public_registration.sql');
 assert.match(legacy,/learner_company_mismatch_manual_review/);
 assert.match(js,/admin_registration_company_review_v46_9/);
 assert.match(js,/admin_registration_company_approve_v46_9/);
 assert.match(js,/review\?\.review_needed/);
 assert.match(js,/state\.companyReview=\{\.\.\.review,requestId:id\}/);
 assert.match(js,/Azienda attuale/);
 assert.match(js,/Azienda dell’edizione/);
 assert.match(js,/Iscrizioni precedenti/);
 assert.match(js,/non modificherà i corsi precedenti/);
});
test('v46.9 two-factor identity and human approval conditions are mandatory on the server',()=>{
 for(const marker of [
  'p_confirm_identity is distinct from true','length(v_note) not between 20 and 500',
  "lower(btrim(coalesce(v_l.email,''))) is distinct from v_req.email",
  'v_l.fiscal_code_normalized is distinct from v_req.fiscal_code',
  'v_req.fiscal_code is null','v_count<>1','v_l.organization_id is distinct from v_ed.organization_id',
  'v_l.company_id is distinct from p_expected_existing_company_id',
  'v_ed.company_id is distinct from p_expected_edition_company_id',
  "if v_req.status<>'pending'","if v_ed.status<>'open'",
  'private.can_manage_training_org(v_ed.organization_id)',
  'existing_enrollment_requires_manual_review'
 ])assert.ok(sql.includes(marker),marker);
 for(const marker of ['p_confirm_identity:true','p_note:note',
  'p_expected_existing_company_id:review.existing_company_id',
  'p_expected_edition_company_id:review.edition_company_id',
  'data-ar36-cross-approve','id="ar36ConfirmIdentity"','id="ar36ReviewNote"',
  'note.length<20','note.length>500','Confermi di associare'])
  assert.ok(js.includes(marker),marker);
 assert.match(js,/role="group" aria-label="Verifica azienda differente"/);
});
test('v46.9 keeps existing enrollment guard and requires a session-local one-time marker',()=>{
 for(const marker of ["original:=pg_catalog.pg_get_functiondef",
  "unexpected_enrollment_guardrail_version",
  "v_company is not null and v_learner_company is distinct from v_company",
  "pg_catalog.current_setting('safetytraining.cross_company_request',true)",
  "and not coalesce((",
  "pg_catalog.set_config('safetytraining.cross_company_request',p_request_id::text,true)",
  "new.metadata->>'company_review_confirmed'='true'",
  "new.metadata->>'company_reviewed_by'=auth.uid()::text",
  "r.status='pending'","r.edition_id=new.edition_id",
  "ll.fiscal_code_normalized=r.fiscal_code",
  "ll.organization_id=v_org",
  "edition_must_be_open"
 ])assert.ok(sql.includes(marker),marker);
 assert.doesNotMatch(sql,/update\s+public\.learners\s+set\s+company_id/i);
 assert.doesNotMatch(sql,/delete\s+from\s+public\.(learners|enrollments|course_editions)/i);
 assert.doesNotMatch(sql,/\bdrop\s+(table|function|schema)\b/i);
 assert.match(sql,/insert into private\.admin_audit_log/);
 assert.match(sql,/registration\.cross_company_manual_approve/);
 assert.match(sql,/revoke all on function public\.admin_registration_company_approve_v46_9/);
 assert.match(sql,/grant execute on function public\.admin_registration_company_review_v46_9/);
});
test('v46.9 review avoids duplicate enrollment and never sends email on failed server approval',()=>{
 const start=js.indexOf('async function approveCrossCompany(id)');
 const end=js.indexOf('async function decide(id,approve)',start);
 const section=js.slice(start,end);
 assert.ok(start>=0 && end>start);
 assert.match(section,/await rpc\('admin_registration_company_approve_v46_9'/);
 assert.match(section,/await finishApprovedEnrollment\(result\)/);
 assert.ok(section.indexOf('admin_registration_company_approve_v46_9')<section.indexOf('finishApprovedEnrollment(result)'));
 assert.doesNotMatch(section,/admin_registration_decide_v36/);
 assert.match(sql,/if exists\(select 1 from public\.enrollments where learner_id=v_l.id and edition_id=v_ed.id\)/);
 assert.match(sql,/insert into public\.enrollments\(edition_id,learner_id,status,metadata\)/);
 assert.match(sql,/update private\.course_registration_requests_v36/);
 assert.match(js,/Invia \/ reinvia email di accesso/);
 assert.match(js,/Non ripetere l’iscrizione/);
});
test('v46.9 UI is available only on pending selected request; auth/edition changes clear it',()=>{
 assert.match(js,/const review=activeReview\?\.requestId===r.id\?activeReview:null/);
 assert.match(js,/isPending\?'<div class="ar36-actions">/);
 assert.match(js,/state\.editionId=e\.target\.value;state\.notice='';state\.companyReview=null/);
 assert.match(js,/state\.companyReview=null;state\.notice='';void render/);
 assert.match(js,/!review\.eligible\|\|review\.already_enrolled/);
 assert.match(js,/review\?\.reason_code==='multiple_matching_learners_manual_review'/);
});
test('v46.9 no new permissions, full PWA and instructions in both handoffs',()=>{
 assert.doesNotThrow(()=>new Function(js));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-9-company-review'/);
 assert.match(read('package.json'),/tests\/public-registration-company-review-v46-9\.test\.mjs/);
 assert.match(read('apps/training/admin-help-v22.js'),/Iscrizione in un’altra azienda/);
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const c=read(path);
  assert.ok(c.slice(0,950).includes('safety-training-v46-9-company-review'),path);
  assert.match(c,/v46\.9 — Approvazione richiesta per corsista già in altra azienda/);
 }
});
