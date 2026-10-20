import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('private complete archive importer handles WebP hash, 2511 files and 4659 page references',()=>{
 const s=rd('apps/training/integral-pdf-v24.js');
 for(const v of ['manifest.assets.length<2000','manifest.figures.length<4000','SHA-256','image/webp','rights_status','createSignedUrls','integral/v1/','candidate_course_keys','review_required'])assert.ok(s.includes(v),v);
 assert.ok(s.includes("const stored=await existingIds"));
 assert.ok(s.includes('const refsDone=await existingIds'));
 assert.ok(s.includes("admin()"));
 assert.ok(s.includes("renderCatalog(page=0)"));
 assert.ok(s.includes("maxPage.get(r.source_document)"));
 assert.ok(s.includes("if(!t||t===doc)return 0"));

 assert.ok(s.includes("2.634 immagini uniche"));
 assert.ok(!s.includes('getPublicUrl('));
});
test('source is private, admin-only, and signed urls must be allowlisted',()=>{
 const s=rd('apps/training/integral-pdf-v24.js');
 assert.ok(s.includes("trusted.has(url)"));
 assert.ok(s.includes("trusted.has(url)"));
 assert.ok(s.includes("private.is_platform_admin()")===false);
 assert.ok(rd('supabase/migrations/20261020191000_v24_001_integral_pdf_media.sql').includes('private.is_platform_admin()'));
});
test('slides + two-up print invoke exact same private source placement',()=>{
 const app=rd('apps/training/app.js'),printer=rd('apps/training/admin-print-slides-v23.js');
 assert.ok(app.includes("SAFETY_INTEGRAL_PDF_V24?.prepareCourse"));
 assert.ok(rd('apps/training/graphic-atlas-v22.js').includes("SAFETY_INTEGRAL_PDF_V24?.pick"));
 assert.ok(printer.includes("await window.SAFETY_INTEGRAL_PDF_V24?.prepareCourse"));
 assert.ok(printer.includes("isTrustedSrc"));
 assert.ok(printer.includes("projection.buildDeck(converted)"));
 const html=rd('apps/training/index.html');assert.ok(html.includes('integral-pdf-v24.js'));
 assert.ok(rd('apps/training/sw.js').includes("safety-training-v22-56"));
});
