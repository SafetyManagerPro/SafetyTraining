import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admin=read('apps/training/admin.js');
const internal=read('apps/training/admin-internal-v47.js');

test('registered learners without email get a move-to-internal action only when active',()=>{
 assert.match(admin,/!x\.email&&x\.active\?btn\('Sposta in interni','move-learner-internal',x\.id\):''/);
 assert.match(admin,/if\(a==='move-learner-internal'\)return moveLearnerToInternal\(id\);/);
});

test('move copies only the fields the internal form needs and saves nothing by itself',()=>{
 const body=admin.slice(admin.indexOf('async function moveLearnerToInternal'),admin.indexOf('async function createEdition'));
 assert.match(body,/select\('id,organization_id,company_id,first_name,last_name,fiscal_code,phone,job_title,active'\)/);
 assert.doesNotMatch(body,/\.insert\(|\.update\(|\.upsert\(|\.rpc\(|invite-learner|\.delete\(/);
 assert.match(body,/api\.openFromLearner\(\{/);
});

test('internal view receives the learner and reuses the existing candidate filler',()=>{
 const body=internal.slice(internal.indexOf('async function openFromLearner'),internal.indexOf('function boot()'));
 assert.match(body,/useImport\(candidate\.id\)/);
 assert.doesNotMatch(body,/\.insert\(|\.upsert\(|rpc\(|internal_admin_assign|newToken|presentLink/);
 assert.match(internal,/window\.SAFETY_INTERNAL_V47=\{open,openFromLearner\};/);
});

test('a "COGNOME NOME" name with empty surname is split for the admin to check',()=>{
 const body=internal.slice(internal.indexOf('async function openFromLearner'),internal.indexOf('function boot()'));
 assert.match(body,/const split=!String\(candidate\.last_name\|\|''\)\.trim\(\)&&full\.includes\(' '\)/);
 assert.match(body,/const last=split\?full\.slice\(0,full\.indexOf\(' '\)\):/);
});
