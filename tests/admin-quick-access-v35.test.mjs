import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('quick enrollment uses existing scoped enrollment and invitation services', () => {
  const source = read('apps/training/admin-access-import-v21.js');
  for (const marker of [
    'aiQuickBoth', 'Iscrivi e invia email', 'aiLearnerSearch',
    'admin_bulk_enroll', 'invite-learner', 'state.bulkBusy',
    'skippedPending', 'admin_company_bulk_context'
  ]) assert.ok(source.includes(marker), marker);
  assert.match(source, /mode==='both'&&l\.invite_status==='sent'/);
  assert.match(source, /finally\{state\.bulkBusy=false/);
});

test('accidental enrollment revocation is reversible and does not delete learner', () => {
  const ui = read('apps/training/admin.js');
  const backend = read('apps/training/admin-backend-v21.js');
  for (const marker of ['Annulla iscrizione errata','showRevokedEnrollments','toggle-revoked-enrollments','Riattiva','Disattiva accesso'])
    assert.ok(ui.includes(marker), marker);
  assert.match(backend, /admin_set_enrollment_revoked/);
  assert.match(backend, /admin_set_active/);
  assert.match(backend, /Disattivare questo corsista/);
  assert.doesNotMatch(backend, /\.from\('learners'\)\.delete\(/);
});
