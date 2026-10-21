import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import * as importsVm from 'node:vm';
const rd=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('private complete archive importer handles WebP hash, 2511 files and 4659 page references',()=>{
 const s=rd('apps/training/integral-pdf-v24.js');
 for(const v of ['manifest.assets.length<2000','manifest.figures.length<4000','SHA-256','image/webp','rights_status','createSignedUrls','integral/v1/','candidate_course_keys','review_required'])assert.ok(s.includes(v),v);
 assert.ok(s.includes("const stored=await existingIds"));
 assert.ok(s.includes('const refsDone=await existingIds'));
 assert.ok(s.includes("admin()"));
 assert.ok(s.includes("renderCatalog(page=0)"));
 assert.ok(s.includes("manifest.archive_type==='safetytraining_partial_v1'"));
 assert.ok(s.includes("manifest.total_assets!==2634"));
 assert.ok(s.includes("manifest.total_figures!==4783"));
 assert.ok(s.includes("multiple accept="));
 assert.ok(s.includes("for(const file of files)"));
 assert.ok(s.includes("outcome.assets"));
 assert.ok(s.includes("Un riferimento PDF appartiene a una parte ZIP diversa."));
 assert.ok(s.includes("placementIndex(course,r,topics,topicCounts)"));
 assert.ok(s.includes(".filter(x=>x.index>=0&&topics[x.index]"));

 assert.ok(s.includes("856 tavole complete"));
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
 assert.ok(rd('apps/training/sw.js').includes("safety-training-v22-67"));
});

test('multi-select deletion removes imported figure references, persists tombstones and protects frozen courses',()=>{
 const s=rd('apps/training/integral-pdf-v24.js');
 const sql=rd('supabase/migrations/20261020204500_v24_005_delete_imported_pdf_figures.sql');
 for(const token of ['integralPdfSelectPage','integralPdfClearSelection','integralPdfDeleteSelected','selected=new Set()','training_delete_integral_pdf_assets_v24','window.confirm(','cleanupDeletedStorage','discarded.has(f.asset_id)','selected.size>=100','storage_cleared_at'])assert.ok(s.includes(token),token);
 for(const token of ['security definer','private.is_platform_admin()','training_integral_pdf_refs_v24','training_integral_pdf_assets_v24','training_integral_pdf_deleted_v24','source_pdf_integral_admin_delete','grant execute','deleted_by'])assert.ok(sql.includes(token),token);
 assert.ok(sql.includes("name like 'integral/v1/%'"));
 assert.ok(!sql.includes('on public.courses'));
 assert.ok(!s.includes('getPublicUrl('));
});

test('old and new PDF figure filters coexist with bulk selection',()=>{const s=rd('apps/training/integral-pdf-v24.js');for(const x of ['integralPdfGeneration',"req.gte('id','pdf-50000')","req.lt('id','pdf-50000')"])assert.ok(s.includes(x));});

test('ambiguous PDF pages never receive arbitrary topic placement',()=>{
 const {runInNewContext}=importsVm;
 const w={SAFETY_GRAPHIC_PACK_01:{isFrozen:()=>false}};
 const doc={readyState:'loading',addEventListener(){}};
 runInNewContext(rd('apps/training/integral-pdf-v24.js'),{window:w,document:doc});
 const choose=w.SAFETY_INTEGRAL_PDF_V24.placementIndex;
 const course={stable_key:'attr_carrelli_all'};
 const topics=[{title:'Tipologie di carrelli e principali rischi'},{title:'Fisica dei carichi, baricentro e stabilità'},{title:'Controlli, manutenzione e procedure operative'}];
 const ref=(page,topic='Tavola illustrata completa (pagina scannerizzata)')=>({source_document:'Manuale-carrelli elevatori.pdf',source_page:page,topic,candidate_course_keys:['attr_carrelli_all']});
 assert.equal(choose(course,ref(50),topics),1,'source forklift stabilita diagram must match the correct topic');
 assert.equal(choose(course,ref(8),topics),-1,'cover must never be added');
 assert.equal(choose(course,ref(42),topics),-1,'unspecific text page must be held');
 assert.equal(choose(course,ref(71),topics),-1,'predominantly text page must be held');
 assert.equal(choose({stable_key:'attr_ple'},ref(50),topics),-1,'other equipment course must not inherit forklift figures');
 const unknown={source_document:'131220_Inail_slide_DPI.pdf',source_page:34,topic:'D. Lvo 81/2008 –',candidate_course_keys:['attr_carrelli_all']};
 assert.equal(choose(course,unknown,topics),-1,'generic law citation cannot drive placement');
 const ambiguous={source_document:'Example.pdf',source_page:12,topic:'Baricentro',candidate_course_keys:['attr_carrelli_all']};
 assert.equal(choose(course,ambiguous,[{title:'Baricentro e stabilità'},{title:'Sicurezza del baricentro'}]),-1,'topic tie must be held');
});

test('DB presentation adapter never invents course-wide images for unrelated topic',()=>{
 const adapter=rd('apps/training/db-slide-adapter.js');
 assert.ok(adapter.includes('No invented hero figures based on course title'));
 assert.ok(adapter.includes('return [];'));
 assert.ok(adapter.includes('if (fromIdeas.length) return fromIdeas.slice(0, 3)'));
 assert.ok(adapter.includes('if (explicitVisuals.length) return explicitVisuals.slice(0, 3)'));
});
