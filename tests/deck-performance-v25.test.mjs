import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('a compiled course deck is reused when paging and private PDF fetches do not gate the slide',()=>{
 const js=read('apps/training/app.js');
 assert.match(js,/let liveDeckCache=new WeakMap\(\)/);
 assert.match(js,/const deck=cachedDeck\(c\);/);
 assert.match(js,/const d=cachedDeck\(c\);/);
 assert.match(js,/deckView\(c,p\[2\]\|\|0\);/);
 assert.match(js,/if\(entered&&window\.SAFETY_INTEGRAL_PDF_V24\?\.hasAccess/);
 assert.doesNotMatch(js,/if\(p\[0\]==='deck'\).*await window\.SAFETY_INTEGRAL_PDF_V24/);
 assert.match(js,/liveDeckCache\.delete\(c\)/);
 assert.match(js,/safety:auth-changed/);
});

test('signed URLs are issued only after topic placement',()=>{
 const js=read('apps/training/integral-pdf-v24.js');
 const eligible=js.indexOf('const automatic=list.map');
 const signing=js.indexOf('createSignedUrls(batch,1200)');
 assert.ok(eligible>=0&&signing>eligible);
 assert.match(js,/\.filter\(x=>x\.index>=0&&topics\[x\.index\]/);
 assert.match(js,/for\(const \{ref:r,index:idx\} of eligible\)/);
});

test('offline install precaches a small shell instead of saturating the connection with 201 images',()=>{
 const sw=read('apps/training/sw.js');
 assert.match(sw,/ASSETS\.filter\(asset=>essential\.has\(asset\)\)/);
 assert.match(sw,/caches\.match\(event\.request\)/);
 assert.match(sw,/safety-training-v22-78/);
});

test('visible forward/backward controls are keyboard accessible and disabled at endpoints',()=>{
 const js=read('apps/training/app.js');
 assert.match(js,/class="deck-pager-prev"/);
 assert.match(js,/class="deck-pager-next"/);
 assert.match(js,/ArrowRight/);
 assert.match(js,/ArrowLeft/);
 const css=read('apps/training/deck-performance-v25.css');
 assert.match(css,/\.deck-pager button:disabled/);
});

test('the redesigned safety pyramid keeps the apex text short and explains it outside the triangle',()=>{
 const svg=read('apps/training/assets/piramide-pericoli.svg');
 assert.match(svg,/<text x="530" y="82"[^>]+>GRAVE<\/text>/);
 assert.match(svg,/INFORTUNIO GRAVE<\/text>/);
 assert.doesNotMatch(svg,/>INFORTUNIO GRAVE<\/text>\s*<text x="620"/);
 assert.match(svg,/<rect x="1020"/);
 const textTags=[...svg.matchAll(/<text\s+[^>]*font-size="(\d+)"/g)];
 assert.ok(textTags.length>=10);
});

test('image administration inventories all shipped artwork without exposing private files',()=>{
 const manifest=JSON.parse(read('apps/training/image-library-v25.json'));
 assert.equal(manifest.images.length,201);
 assert.equal(new Set(manifest.images).size,manifest.images.length);
 for(const path of manifest.images)assert.ok(existsSync(new URL('../apps/training/'+path,import.meta.url)),'missing asset '+path);
 const js=read('apps/training/admin-image-library-v25.js');
 assert.match(js,/platform_admins/);
 assert.match(js,/createSignedUrls\(paths,600\)/);
 assert.match(js,/const pageSize=24/);
 assert.match(js,/SAFETY_INTEGRAL_PDF_V24\?\.show/);
 assert.match(js,/SAFETY_SOURCE_VISUALS_V23\?\.open/);
 assert.doesNotMatch(js,/\.delete\s*\(|\.update\s*\(|\.upsert\s*\(/);
 const ctx={window:{},document:{readyState:'loading',addEventListener(){}}};
 runInNewContext(js,ctx);
 assert.equal(ctx.window.SAFETY_ADMIN_IMAGE_LIBRARY_V25.category('assets/gp02-forklift-load.svg'),'Carrelli');
 assert.equal(ctx.window.SAFETY_ADMIN_IMAGE_LIBRARY_V25.category('assets/gp02-crane-preuse.svg'),'Gru');
 assert.equal(ctx.window.SAFETY_ADMIN_IMAGE_LIBRARY_V25.category('assets/gp02-ple-preuse.svg'),'PLE');
});
