import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('image destinations support multiple courses but do not create bogus expert certification',()=>{
 const sql=rd('supabase/migrations/20261021180818_v30_multiple_placement_proposals.sql');
 assert.match(sql,/primary key\(ref_id,course_key,module_key,unit_position\)/);
 assert.match(sql,/contact_sheet_visual_inspection/);
 assert.match(sql,/training_integral_pdf_visual_audit_v27/);
 assert.match(sql,/private.is_platform_admin\(\)/);
 assert.match(sql,/coalesce\(course.metadata->>'freeze_scope'/);
 assert.match(sql,/non-exposed/gi.test(sql)?/NEVER/:/never publishes images/);
 assert.doesNotMatch(sql,/update\s+public\.training_integral_pdf_reviews_v25/i);
 assert.doesNotMatch(sql,/insert\s+into\s+public\.training_integral_pdf_placements_v25/i);
 const ui=rd('apps/training/image-suggestions-v26.js');
 assert.match(ui,/training_image_placement_proposals_v30/);
 assert.match(ui,/Nessuna approvazione tecnica o dei diritti è stata registrata automaticamente/);
});
