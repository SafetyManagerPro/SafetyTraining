import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../apps/training/course-experience-v22.js',import.meta.url),'utf8');
test('supplementary equipment labs label physical attendance explicitly',()=>{
 assert.match(src,/training_mode==='in_person_practice_only'/);
 assert.match(src,/presenza fisica obbligatoria/);
 assert.match(src,/non equivale alle ore di aggiornamento pratico/);
 assert.match(src,/requires_physical_validation/);
 assert.doesNotMatch(src,/\.from\([^)]*\)\s*\.(update|insert|delete)\s*\(/);
});
