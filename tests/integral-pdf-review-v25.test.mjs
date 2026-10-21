import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rd=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('private PDF review preserves imported provenance and never grants automatic publication',()=>{
 const sql=rd('supabase/migrations/20261021094500_v25_001_integral_pdf_review_workflow.sql');
 assert.match(sql,/training_integral_pdf_reviews_v25/);
 assert.match(sql,/training_integral_pdf_review_events_v25/);
 assert.match(sql,/on delete cascade/);
 assert.match(sql,/technical_status in \('pending','approved','rejected'\)/);
 assert.match(sql,/rights_status in \('review_required','cleared_internal','rejected'\)/);
 assert.match(sql,/technical_note text not null/);
 assert.match(sql,/rights_evidence text not null/);
 assert.match(sql,/private\.is_platform_admin\(\)/);
 assert.match(sql,/auth\.uid\(\) is null/);
 assert.match(sql,/security definer set search_path=''/);
 assert.match(sql,/revoke all on function public\.training_review_integral_pdf_v25/);
 assert.match(sql,/grant execute on function public\.training_review_integral_pdf_v25.*to authenticated/);
 assert.match(sql,/if length\(v_note\)<25/);
 assert.match(sql,/p_rights_status='cleared_internal' and length\(v_evidence\)<20/);
 assert.doesNotMatch(sql,/update\s+public\.training_integral_pdf_refs_v24/i);
 assert.doesNotMatch(sql,/public\.training_integral_pdf_assets_v24\s+set/i);
});

test('review form separates technical suitability and usage rights with evidence and a confirmation',()=>{
 const js=rd('apps/training/admin-image-library-v25.js');
 assert.match(js,/data-review-form/);
 assert.match(js,/data-review-save/);
 assert.match(js,/technical_status/);
 assert.match(js,/rights_status/);
 assert.match(js,/technical_note/);
 assert.match(js,/rights_evidence/);
 assert.match(js,/training_review_integral_pdf_v25/);
 assert.match(js,/window\.confirm/);
 assert.match(js,/await verified\(\)/);
 assert.match(js,/\.in\('ref_id',list\.map\(x=>x\.id\)\)/);
 assert.doesNotMatch(js,/\.update\s*\(|\.delete\s*\(|\.upsert\s*\(/);
});
test('explicitly rejected figures are not selected for projector or printed deck',()=>{
 const js=rd('apps/training/integral-pdf-v24.js');
 assert.match(js,/training_integral_pdf_reviews_v25/);
 assert.match(js,/decision\?\.technical_status!=='rejected'/);
 assert.match(js,/decision\?\.rights_status!=='rejected'/);
 assert.match(js,/FONTE PDF DA VERIFICARE/);
 assert.match(js,/REVISIONATA PER USO INTERNO/);
 assert.match(js,/function hasAccess\(course\)/);
 assert.match(js,/function invalidate\(\)\{cache\.clear\(\);\}/);
 assert.doesNotMatch(js,/getPublicUrl\(/);
});
