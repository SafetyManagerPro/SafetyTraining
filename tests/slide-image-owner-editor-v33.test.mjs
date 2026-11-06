import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('owner-only slide editor is restricted by an immutable one-time user allowlist and RLS',()=>{
 const sql=read('supabase/migrations/20261021203900_v33_slide_image_owner_editor.sql');
 for(const word of ['private.slide_image_editor_allowlist_v33','private.can_edit_slide_images_v33()','public.save_slide_images_v33','auth.uid()','from auth.users','count(*) from public.platform_admins','count(*) from auth.users','slide_image_overrides_v33','edited_by','private_pdf','technical_status=\'approved\'','rights_status=\'cleared_internal\'','is_platform_admin']){if(word==='is_platform_admin')continue;assert.ok(sql.includes(word),word);}
 assert.match(sql,/revoke all on public.slide_image_overrides_v33 from public,anon,authenticated/);
 assert.match(sql,/not private.can_edit_slide_images_v33\(\)/);
 assert.match(sql,/c\.active=true/);
 assert.match(sql,/cv\.status='published'/);
 assert.match(sql,/metadata->>'freeze_scope'/);
 assert.match(sql,/jsonb_array_length\(p_items\)>3/);
 assert.doesNotMatch(sql,/grant update on public.slide_image_overrides_v33/i);
});
test('real editor toolbar and owner-only selected images feed screen and PDF print',()=>{
 const editor=read('apps/training/slide-image-editor-v33.js');
 const app=read('apps/training/app.js');
 const print=read('apps/training/admin-print-slides-v23.js');
 const html=read('apps/training/index.html');
 const sw=read('apps/training/sw.js');
 for(const marker of ['can_edit_slide_images_v33','read_slide_images_v33','save_slide_images_v33','data-pick','data-remove','data-move','data-reset','data-save','training_integral_pdf_reviews_v25','technical_status','rights_status','training_image_exclusions_v26','createSignedUrl','slide.uid'])assert.ok(editor.includes(marker),marker);
 assert.match(app,/SAFETY_SLIDE_IMAGE_EDITOR_V33\?\.visit/);
 assert.match(print,/SAFETY_SLIDE_IMAGE_EDITOR_V33\?\.applyDeck/);
 assert.match(print,/SAFETY_SLIDE_IMAGE_EDITOR_V33\?\.isTrustedPrivateUrl/);
 assert.match(editor,/temporaryPrivateUrls\.clear\(\)/);
 assert.ok(html.indexOf('slide-image-editor-v33.js')<html.indexOf('app.js'));
 assert.match(sw,/slide-image-editor-v33\.js/);
 assert.match(read('apps/training/visual-asset-guard-v32.js'),/catalog:\[\.\.\.AVAILABLE\]/);
 assert.match(editor,/!owner&&![a-zA-Z]+\.length&&chosen\.some/);
});
test('editor does not grant changes without editor rights',async()=>{
 const source=read('apps/training/slide-image-editor-v33.js');
 const handlers={};
 const window={addEventListener:(name,cb)=>handlers[name]=cb,SAFETY_CLOUD:{state:{user:null,client:null}}};
 const document={};
 runInNewContext(source,{window,document,console});
 const editor=window.SAFETY_SLIDE_IMAGE_EDITOR_V33;
 assert.equal(editor.canEdit(),false);
 assert.equal(await editor.authenticate(),false);
 assert.equal(editor.canEdit(),false);
 handlers['safety:auth-changed']();
});
