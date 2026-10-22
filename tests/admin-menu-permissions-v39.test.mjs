import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('existing admin navigation is grouped without removing original buttons or listeners',()=>{
 const code=read('apps/training/admin-menu-v39.js');
 assert.doesNotThrow(()=>new Function(code));
 for(const section of ['home','people','enroll','courses','assets','monitor'])
  assert.ok(code.includes("id:'"+section+"'"),section);
 for(const existing of ['adminAccessImportNav','adminRegistrationNav','adminMembershipsNav',
  'data-quality-v22','data-print-lessons-nav','data-print-slides-nav',
  'data-image-library-v25','data-blueprint-admin','data-tab="enrollments"'])
  assert.ok(code.includes(existing),existing);
 assert.ok(code.includes('destination.appendChild(button)'));
 assert.ok(code.includes('button.parentElement!==destination'));
 assert.ok(code.includes('new MutationObserver(schedule)'));
 assert.doesNotMatch(code,/cloneNode|removeEventListener|replaceWith/);
});

test('permission hub uses separately authorized RPC paths for individual courses and whole profiles',()=>{
 const code=read('apps/training/admin-learner-permissions-v39.js');
 assert.doesNotThrow(()=>new Function(code));
 for(const rpc of ['admin_set_enrollment_revoked','admin_archive_learner_v36',
  'admin_restore_learner_v37','admin_revoke_learner_invite'])
  assert.ok(code.includes(rpc),rpc);
 for(const flag of ['manage_learners','manage_enrollments','safety:admin-capabilities'])
  assert.ok(code.includes(flag),flag);
 assert.doesNotMatch(code,/\.from\('learners'\)\.delete\(/);
 assert.doesNotMatch(code,/\.from\('enrollments'\)\.delete\(/);
});

test('entrypoint and offline cache reference all new assets',()=>{
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 for(const file of ['admin-menu-v39.js','admin-menu-v39.css',
  'admin-learner-permissions-v39.js','admin-learner-permissions-v39.css']){
  assert.ok(html.includes(file),'HTML missing '+file);
  assert.ok(sw.includes(file),'SW missing '+file);
 }
 assert.ok(sw.includes('safety-training-v39-menu-permissions'));
});
