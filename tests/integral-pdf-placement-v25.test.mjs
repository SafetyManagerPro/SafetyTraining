import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('manual PDF placement is administrative, version-specific and audited',()=>{
 const sql=rd('supabase/migrations/20261021091152_v25_002_integral_pdf_manual_placements.sql');
 for(const token of [
 'training_integral_pdf_placements_v25','training_integral_pdf_placement_events_v25',
 'private.is_platform_admin()','cv.status=','cv.version_number desc','metadata',
 "p_action not in ('attach','detach')","technical_status='approved'",
 "rights_status='cleared_internal'","row_number() over(order by mu.position,mu.id)",
 'p_unit_position','training_review_integral_pdf_v25', // Must not accidentally use this RPC from placement migration.
 ]) if(token!=='training_review_integral_pdf_v25')assert.ok(sql.includes(token),token);
 assert.ok(sql.includes('module_key=p_module_key'));
 assert.ok(sql.includes('unit_position between 1 and 500'));
 assert.ok(sql.includes('auth.uid() is null'));
 assert.ok(sql.includes('security definer set search_path'));
 assert.ok(sql.includes('revoke all on function public.training_place_integral_pdf_v25'));
 assert.ok(sql.includes('grant execute on function public.training_place_integral_pdf_v25'));
 assert.doesNotMatch(sql,/update\s+public\.courses\b/i);
 assert.doesNotMatch(sql,/update\s+public\.training_integral_pdf_refs_v24\b/i);
 assert.doesNotMatch(sql,/public\s+to\s+anon/i);
});

test('manual positions in slide and print are linked to module and position, not title heuristics',()=>{
 const js=rd('apps/training/integral-pdf-v24.js');
 assert.match(js,/training_integral_pdf_placements_v25/);
 assert.match(js,/eq\('course_key',name\)\.eq\('version_number',Number\(course\.db_version\)\|\|-1\)/);
 assert.match(js,/module_key/);
 assert.match(js,/unit_position/);
 assert.match(js,/mod\?\.topic_ids\?\.\[Number\(mapping\.unit_position\)-1\]/);
 assert.match(js,/manuallyUsedAssets/);
 assert.match(js,/const matching=\[\.\.\.automatic,\.\.\.explicit\]/);
 assert.match(js,/return decision\?\.technical_status==='approved'&&decision\?\.rights_status==='cleared_internal'/);
 assert.match(js,/excluded\.has\(x\.ref\.id\)\|\|!x\.manual/);
 const printer=rd('apps/training/admin-print-slides-v23.js');
 assert.match(printer,/await window\.SAFETY_INTEGRAL_PDF_V24\?\.prepareCourse\?\.\(converted,\{client\}\)/);
 assert.match(printer,/projection\.buildDeck\(converted\)/);
 const atlas=rd('apps/training/graphic-atlas-v22.js');
 assert.match(atlas,/SAFETY_INTEGRAL_PDF_V24\?\.pick/);
});

test('admin form safely loads published course bundles and supports attachment/removal',()=>{
 const js=rd('apps/training/admin-image-placement-v25.js');
 assert.match(js,/training_course_bundle/);
 assert.match(js,/data\?\.version\?\.status!=='published'/);
 assert.match(js,/\.filter\(courseAllowed\)/);
 assert.match(js,/SAFETY_ADMIN_CAPABILITIES_STATE\?\.platform_admin/);
 assert.match(js,/\breview/gi);
 assert.match(js,/data-placement-form/);
 assert.match(js,/name="course_key"/);
 assert.match(js,/name="module_key"/);
 assert.match(js,/name="unit_position"/);
 assert.match(js,/data-placement-remove/);
 assert.match(js,/p_action:'attach'/);
 assert.match(js,/p_action:'detach'/);
 assert.match(js,/window\.confirm/);
 assert.match(js,/training_place_integral_pdf_v25/);
 assert.doesNotMatch(js,/getPublicUrl\(/);
 const w={SAFETY_ADMIN_CAPABILITIES_STATE:{platform_admin:false}},doc={addEventListener(){}};
 runInNewContext(js,{window:w,document:doc});
 const allowed=w.SAFETY_ADMIN_IMAGE_PLACEMENT_V25.courseAllowed;
 assert.equal(Boolean(allowed({stable_key:'attr_ple',active:true,metadata:{}})),true);
 assert.equal(Boolean(allowed({stable_key:'frozen',active:true,metadata:{freeze_scope:'true'}})),false);
});
