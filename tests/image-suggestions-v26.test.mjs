import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('candidate matching is cautious, evidence-labelled and avoids guessed locations',()=>{
 const js=read('apps/training/image-suggestions-v26.js');
 const win={},ctx={window:win,document:{addEventListener(){}}};runInNewContext(js,ctx);
 const {recommend}=win.SAFETY_IMAGE_SUGGESTIONS_V26;
 const catalog=[{course_key:'attr_ple',course_title:'PLE',module_title:'Teoria',module_key:'theory',unit_title:'Stabilità dei mezzi di sollevamento',unit_position:1,version_number:1},{course_key:'primo_soccorso_12h',course_title:'Primo Soccorso',module_title:'Procedure',module_key:'p',unit_title:'Rianimazione cardiopolmonare',unit_position:3,version_number:1}];
 assert.equal(recommend({name:'D. Lvo 81/2008 –',category:'DPI'},catalog).status,'unassigned');
 const hit=recommend({name:'Rianimazione cardiopolmonare',category:'Primo soccorso'},catalog);
 assert.ok(hit.suggestions.length);
 assert.equal(hit.suggestions[0].course_key,'primo_soccorso_12h');
 assert.equal(hit.basis.includes('NON verificato'),true);
});
test('image exclusions are reversible and do not delete storage objects',()=>{
 const sql=read('supabase/migrations/20261021170000_v26_image_matching_and_exclusions.sql');
 const js=read('apps/training/image-suggestions-v26.js');
 assert.match(sql,/private.is_platform_admin\(\)/);
 assert.match(sql,/training_set_image_exclusion_v26/);
 assert.match(sql,/training_image_matching_catalog_v26/);
 assert.match(sql,/training_image_exclusions_v26/);
 assert.match(js,/Escludi dalle presentazioni/);
 assert.match(js,/Ripristina nelle presentazioni/);
 assert.doesNotMatch(sql,/delete from storage\./i);
 assert.doesNotMatch(sql,/update public\.training_integral_pdf_refs_v24/i);
 const deck=read('apps/training/integral-pdf-v24.js');
 assert.match(deck,/excluded\.has\(x\.ref\.id\)/);
});

test('visual inspection evidence and similarity flags appear as auditable private metadata',()=>{
 const source=read('apps/training/image-suggestions-v26.js');
 const sql=read('supabase/migrations/20261021174500_v27_visual_figure_audit.sql');
 assert.match(source,/training_integral_pdf_visual_audit_v27/);
 assert.match(source,/training_integral_pdf_comparison_v28/);
 assert.match(source,/La valutazione visiva non approva i diritti/);
 assert.match(sql,/visual_audit_v27_admin_select/);
 assert.match(sql,/similarity_v27_admin_select/);
 assert.match(sql,/contact_sheet_visual_inspection/);
 assert.match(sql,/phash_hamming between 0 and 7/);
 assert.doesNotMatch(sql,/update public.training_integral_pdf_reviews_v25/i);
});
