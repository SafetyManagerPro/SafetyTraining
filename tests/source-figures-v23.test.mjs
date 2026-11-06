import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('PDF sources are private staged assets, not published learning content',()=>{
 const sql=rd('supabase/migrations/20261020045047_v22_017_private_source_figures.sql');
 assert.match(sql,/false,5242880/);assert.match(sql,/enable row level security/);assert.match(sql,/private.is_platform_admin\(\)/);assert.match(sql,/rights_status='review_required'/);
 assert.doesNotMatch(sql,/create policy .* for select to anon/i);
});
test('import checks staff identity, MIME and sha before private upload',()=>{
 const js=rd('apps/training/source-figures-v23.js');assert.match(js,/admin=\(\)=>/);
 for(const token of ['SHA-256','image\/jpeg','manifest.json','rights_status:\x27review_required\x27','upsert(row','source_document','source_page'])assert.ok(js.includes(token),token);
 assert.doesNotMatch(js,/getPublicUrl\(/);
 assert.ok(js.includes("review_class:a.review_class==='GIALLO'?'GIALLO':'ROSSO'"));
 assert.ok(js.includes("filter(p=>p.review_class==='GIALLO')"));
});
test('instructor PDF preview never overrides frozen or authored LU',()=>{
 const js=rd('apps/training/source-figures-v23.js');
 assert.ok(js.includes("isFrozen"));
 assert.ok(js.includes('source_review_only:true'));
 assert.ok(js.includes('const pool=scored.filter'));
 assert.ok(js.includes('chosen.slice(0,2)'));
assert.ok(js.includes("presentation_generated_from_db"));assert.ok(js.includes("visual_mode==='authored'"));
 const app=rd('apps/training/app.js');
 assert.ok(app.includes('SAFETY_SOURCE_VISUALS_V23?.pick'));
});
test('script and CSS loaded; print geometry unchanged',()=>{
 const index=rd('apps/training/index.html'),sw=rd('apps/training/sw.js');
 assert.match(index,/source-figures-v23\.js/);assert.match(index,/source-figures-v23\.css/);
 assert.match(sw,/source-figures-v23\.js/);assert.match(sw,/const CACHE='safety-training-[^']+'/);
 assert.match(rd('apps/training/admin-print-slides-v23.js'),/projection\.buildDeck\(converted\)/);
});