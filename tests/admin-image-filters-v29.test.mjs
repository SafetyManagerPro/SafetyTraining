import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('server-side catalog filters include review, placement, and full archive pagination',()=>{
 const sql=read('supabase/migrations/20261021172640_v29_admin_image_filters.sql');
 for(const token of ["private.is_platform_admin()","training_image_filter_page_v29","p_page_size","array_agg(id order by id)","technical_status='approved'","rights_status='cleared_internal'","manual_current","observed_published","to_associate","associated","screening","individual","group","p_course_key","p_module_key","training_image_exclusions_v26"]) assert.ok(sql.includes(token),token);
 assert.match(sql,/limit p_page_size offset \(p_page\*p_page_size\)/);
 assert.match(sql,/auth.uid\(\) is null/);
 assert.match(sql,/revoke all on function public.training_image_filter_page_v29/);
 assert.doesNotMatch(sql,/delete from public\.|update public\.training_integral_pdf_reviews/i);
});
test('admin image filters are accessible and page-scoped signed URLs remain lazy',()=>{
 const code=read('apps/training/admin-image-library-v25.js');
 for(const token of ['stImageStatus','stImageCourse','stImageModule','stImageType','stImageSearch','to_associate','associated','examined','training_image_filter_page_v29','training_image_matching_catalog_v26','syncFilterControls','pageSize=24'])assert.ok(code.includes(token),token);
 assert.match(code,/\.rpc\('training_image_filter_page_v29'/);
 assert.match(code,/\.in\('id',ids\)/);
 assert.match(code,/return enrichPrivateRows\(type,original,Number\(filtered.total\)\|\|0\)/);
 assert.match(code,/createSignedUrls\(paths,600\)/);
 assert.match(code,/state\.page=0/);
 const help=read('apps/training/admin-help-v22.js');
 assert.match(help,/'Gestione immagini'/);
 assert.match(help,/Esaminata ≠ approvata ≠ associata/);
 assert.match(help,/24 figure visibili/);
});
