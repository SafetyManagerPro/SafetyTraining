import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('DB slide UID uses colon-delimited unit stable keys and migration permits exact expected characters',()=>{
 const adapter=read('apps/training/db-slide-adapter.js'),app=read('apps/training/app.js'),migration=read('supabase/migrations/20261021232000_v34_slide_uid_colons.sql');
 assert.match(adapter,/presentationId:.*::/);
 assert.match(app,/uid:`\$\{c\.id\}-\$\{t\.id\}-\$\{s\.type\}-\$\{si\}`/);
 assert.match(migration,/p_slide_uid !~ '\^\[A-Za-z0-9_:-\]\+\$'/);
 assert.match(migration,/private\.can_edit_slide_images_v33\(\)/);
 assert.match(migration,/coalesce\(c\.metadata->>'freeze_scope'/);
 assert.match(migration,/v\.technical_status='approved'/);
 const valid=/^[A-Za-z0-9_:-]+$/;
 assert.ok(valid.test('attr_carroponte_10h-equipment_theory::equipment:carroponte:theory:01::1-explain-1'));
 assert.ok(!valid.test('course-../../escape-explain-1'));
 assert.ok(!valid.test('course other-explain-1'));
});