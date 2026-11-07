import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admin=read('apps/training/admin-registration-v36.js');
const registration=read('apps/training/public-registration-v36.js');
const invitation=read('apps/training/learner-invite-activation-v21.js');
const auth=read('supabase/functions/invite-learner/index.ts');

test('public QR registration uses canonical public HTTPS link and 48-character edition token',()=>{
 const sb={window:{},document:{readyState:'loading',addEventListener(){}},URL,location:{href:'http://localhost:3000/'}};
 runInNewContext(admin,sb);
 const uri=sb.window.SAFETY_ADMIN_REGISTRATION_V36.registrationUrl('a'.repeat(48));
 assert.equal(uri,'https://safety-training-safety-manager.vercel.app/?registration='+ 'a'.repeat(48));
 assert.match(admin,/function validatePublicLink\(url\)/);
 assert.match(admin,/public_registration_info_v36/);
 assert.match(admin,/Verifica link/);
 assert.match(admin,/async function showQr\(url\)/);
 assert.match(admin,/await validatePublicLink\(url\)/);
 assert.match(admin,/QRCode\(area,/);
});

test('admin approval sends an activation invitation without a second optional confirmation',()=>{
 const start=admin.indexOf('async function decide(id,approve)');
 const end=admin.indexOf('function start()',start);
 const method=admin.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(method,/const result=await rpc\('admin_registration_decide_v36'/);
 assert.match(method,/if\(!approve\)/);
 const helper=admin.slice(admin.indexOf('async function finishApprovedEnrollment'),start);
 assert.match(method,/await finishApprovedEnrollment\(result\)/);
 assert.match(helper,/const response=await inviteLearner\(result\?\.learner_id\)/);
 assert.doesNotMatch(method,/if\(approve&&result\?\.learner_id&&confirm\(/);
 assert.ok(method.indexOf("admin_registration_decide_v36")<method.indexOf('finishApprovedEnrollment(result)'));
 assert.match(helper,/Iscrizione approvata, ma email NON inviata/);
 assert.match(helper,/Non ripetere l’iscrizione/);
 assert.match(admin,/const activationRedirect=\(\)=>new URL\('\?onboarding=1',PUBLIC_ORIGIN\)\.toString\(\)/);
 assert.doesNotMatch(admin,/redirect_to:new URL\('\?onboarding=1',location.href\)/);
});

test('resend is restricted to previously approved requests and never creates enrollments',()=>{
 const start=admin.indexOf('async function resend(id)');
 const end=admin.indexOf('async function decide(id,approve)',start);
 const block=admin.slice(start,end);
 assert.match(block,/req\.status!=='approved'/);
 assert.match(block,/!req\.learner_id/);
 assert.match(block,/await inviteLearner\(req\.learner_id\)/);
 assert.doesNotMatch(block,/admin_registration_decide_v36|admin_bulk_enroll|insert\(|update\(/);
 assert.match(admin,/data-ar36-resend/);
 assert.match(admin,/from\('learner_account_invitations'\)/);
 assert.match(admin,/Email di attivazione non verificata/);
 assert.match(admin,/La consegna effettiva dipende dalla configurazione SMTP/);
 assert.match(admin,/error\.context\.clone\(\)\.json\(\)/);
});

test('public QR form is explicitly a pending approval request, not an instant enrollment or email receipt',()=>{
 assert.match(registration,/public_registration_submit_v36/);
 assert.match(registration,/Richiesta ricevuta dal sistema/);
 assert.match(registration,/non significa che il corso sia attivo/);
 assert.match(registration,/non invia un’email automatica al momento della richiesta/);
 assert.match(registration,/dopo l’approvazione/i);
 assert.match(registration,/friendlyError\(/);
 assert.match(registration,/registration_limit_reached/);
 assert.doesNotMatch(registration,/auth\.signUp|admin_bulk_enroll|admin_registration_decide_v36|sendEmail\(/);
 const sql=read('supabase/migrations/20261022135530_v36_public_course_registration.sql');
 assert.match(sql,/status text not null default 'pending'/);
 assert.match(sql,/private\.can_manage_training_org/);
 assert.match(sql,/on conflict\(edition_id,email\) do nothing/);
});

test('self-service account activation allows manual confirmation resend without silent fake success',()=>{
 assert.match(invitation,/auth\.resend\(\{type:'signup'/);
 assert.match(invitation,/emailRedirectTo:new URL\(location.href\)\.toString\(\)/);
 assert.match(invitation,/Rinvia email di conferma/);
 assert.match(invitation,/Se avevi già un account, usa/);
 assert.match(invitation,/Se non ricevi nulla, contatta l’organizzatore/);
 assert.match(invitation,/otp_expired/);
 assert.match(invitation,/email_rate_limit_exceeded/);
 assert.match(invitation,/claim_learner_invite/);
 assert.match(invitation,/identity_verification_failed/);
});

test('Edge Function invite remains JWT-protected and does not claim verified inbox delivery',()=>{
 assert.match(auth,/admin\.auth\.getUser\(token\)/);
 assert.match(auth,/learner\.active/);
 assert.match(auth,/organization\.active/);
 assert.match(auth,/platform_admins/);
 assert.match(auth,/organization_memberships/);
 assert.match(auth,/admin\.auth\.admin\.inviteUserByEmail/);
 assert.match(auth,/status: 'failed'/);
 assert.match(auth,/status: 'sent'/);
 assert.match(admin,/La consegna|consegna da verificare/);
});

test('all learner email invites and recovery links use public HTTPS callback, never localhost or preview host',()=>{
 const invites=read('apps/training/admin-invitations-v20.js');
 const canonical='https://safety-training-safety-manager.vercel.app/?onboarding=1';
 assert.match(auth,/const redirectTo = 'https:\/\/safety-training-safety-manager\.vercel\.app\/\?onboarding=1'/);
 assert.match(auth,/inviteOptions\.redirectTo = redirectTo/);
 assert.match(auth,/recoveryOptions\.redirectTo = redirectTo/);
 assert.doesNotMatch(auth,/body\?\.redirect_to/);
 assert.ok(invites.includes("return '"+canonical+"'"));
 assert.doesNotMatch(invites,/new URL\(location\.href\)/);
 assert.ok(admin.includes("new URL('?onboarding=1',PUBLIC_ORIGIN)"));
});
test('v46.8 PWA, CI and twin handoffs record QR/email fix without a DB migration',()=>{
 const html=read('apps/training/index.html');
 assert.ok(html.includes('admin-registration-v36.js'));
 assert.ok(html.includes('public-registration-v36.js'));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-11-internal-access'/);
 assert.match(read('package.json'),/tests\/public-registration-delivery-v46-8\.test\.mjs/);
 const help=read('apps/training/admin-help-v22.js');
 assert.match(help,/Invia \/ reinvia email di accesso/);
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(path);
  assert.ok(doc.slice(0,950).includes('safety-training-v46-11-internal-access'),path);
  assert.match(doc,/v46\.8 — QR, iscrizione pubblica e inviti email/);
 }
});
