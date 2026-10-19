import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('anonymous pages do not call admin capabilities from access/import observers',()=>{
  const source=read('apps/training/admin-access-import-v21.js');
  assert.doesNotMatch(source,/\.rpc\(['"]admin_capabilities['"]\)/);
  assert.match(source,/safety:admin-capabilities/);
  assert.match(source,/!!user\(\)/);
});

test('capability responses and course experience cache are account scoped',()=>{
  const capabilities=read('apps/training/admin-capabilities-v21.js');
  const experience=read('apps/training/course-experience-v22.js');
  assert.match(capabilities,/requestId !== state\.requestId/);
  assert.match(capabilities,/user\(\)\?\.id !== userId/);
  assert.match(experience,/account\|\|'anon'/);
  assert.match(experience,/safety:auth-changed/);
  assert.match(experience,/cache\.clear\(\)/);
});

test('quiz requests reject stale identity and concurrent submissions',()=>{
  const cloud=read('apps/training/cloud-v20.js');
  const finalTest=read('apps/training/final-test-v20.js');
  assert.match(cloud,/pendingQuizSubmissions/);
  assert.match(cloud,/quizContextCurrent/);
  assert.match(cloud,/identityRequestId/);
  assert.match(finalTest,/availabilitySeq/);
  assert.match(finalTest,/openSeq/);
  assert.match(finalTest,/local\.current===current/);
  assert.doesNotMatch(finalTest,/setInterval\(refreshAvailability/);
});

test('layered dialogs close only the top layer with Escape',()=>{
  const modal=read('apps/training/modal-access-v22.js');
  assert.match(modal,/const stack=\[\]/);
  assert.match(modal,/e\.key==='Escape'/);
  assert.match(modal,/toggleAttribute\('inert'/);
  assert.match(modal,/closeTop/);
});

test('PWA keeps protected navigation outside the service worker',()=>{
  const index=read('apps/training/index.html');
  const worker=read('apps/training/sw.js');
  assert.match(index,/rel="manifest"[^>]+crossorigin="use-credentials"/);
  assert.match(index,/rel="icon" href="icons\/icon-192\.png"/);
  assert.match(worker,/request\.mode==='navigate'\)return/);
  assert.match(worker,/Promise\.allSettled/);
  assert.match(worker,/const CACHE='safety-training-v22-\d+'/); // sync with handoff docs is tested separately
});

test('already-applied v22 migrations are tracked locally',()=>{
  const first=read('supabase/migrations/20261018141147_v22_010_additive_practice_assessment_forms.sql');
  const second=read('supabase/migrations/20261018142341_v22_011_practice_assessment_staff_history.sql');
  assert.match(first,/create table if not exists public\.enrollment_practice_assessments_v22/);
  assert.match(first,/does not modify enrollment_requirement_evidence or completion gates/);
  assert.match(second,/admin_practice_assessment_history_v22/);
  assert.match(second,/limit 50/);
});

test('learner password setup exposes a non-visual authenticated username to password managers',()=>{
  const onboard=read('apps/training/learner-onboarding-v20.js');
  assert.match(onboard,/id="learnerOnboardingUsername"/);
  assert.match(onboard,/autocomplete="username"/);
  assert.match(onboard,/learner-onboarding-sr-only/);
  assert.match(onboard,/usernameField\.value = sessionUser\?\.email/);
  assert.match(onboard,/show\(data\.session\.user\)/);
  assert.match(onboard,/show\(session\.user\)/);
});
