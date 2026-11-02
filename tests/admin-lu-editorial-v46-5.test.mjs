import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const entry=read('apps/training/admin-lu-editorial-v46-5.js');
function api(){
 const events=[];
 const document={readyState:'loading',addEventListener(type,cb){events.push([type,cb]);}};
 const window={};
 runInNewContext(entry,{window,document});
 return {mod:window.SAFETY_LU_EDITORIAL_V46_5,events};
}
test('v46.5 owner-only review gates frozen, draft, inactive and historical unit statuses',()=>{
 const {mod}=api();
 const u={course_active:true,frozen:false,unit_status:'published'};
 assert.equal(mod.mayEdit(u,true),true);
 for(const [row,owner] of [[u,false],[{...u,frozen:true},true],[{...u,course_active:false},true],[{...u,unit_status:'draft'},true],[{...u,unit_status:'retired'},true]])assert.equal(mod.mayEdit(row,owner),false);
 assert.equal(mod.editable(u),false,'No admin capability before authenticated service response');
});
test('v46.5 score is triage only, not an automatic approval',()=>{
 const {mod}=api();
 const empty=mod.score({});
 assert.equal(empty.length,4);
 assert.ok(empty.some(s=>s.includes('Immagini')));
 assert.ok(empty.some(s=>s.includes('Fonti')));
 assert.deepEqual(Array.from(mod.score({summary_chars:180,detail_chars:600,risk_count:2,prevention_count:3,has_case:true,has_question:true,explicit_visual_count:1,source_reference_count:2})),[]);
 assert.equal(typeof mod.mayEdit,'function');
 assert.doesNotMatch(entry,/automaticallyApprove|autoPublish|newVersion|updateLearningUnit/);
});
test('v46.5 CSV export scopes to current rows and escapes spreadsheet formula injection',()=>{
 const {mod}=api();
 const data=[{course_title:'=HYPERLINK("https://evil")',course_version:2,module_title:'Test',unit_title:'+SUM(1,2)',unit_version:1,unit_status:'published',frozen:false,
  summary_chars:200,detail_chars:230,risk_count:1,prevention_count:1,has_case:true,has_question:true,explicit_visual_count:1,source_reference_count:1,
  review:{reviewer_note:'=cmd|',text_status:'approved',visual_status:'pending',source_status:'pending',analysis_status:'pending',rights_status:'pending',decision:'pending',revision:1}}];
 const csv=mod.csv(data);
 assert.match(csv,/Corso/);
 assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes("'+SUM"));
 assert.ok(csv.includes("'=cmd"));
 assert.ok(!csv.includes(',"=HYPERLINK'));
 assert.equal(csv.trim().split('\r\n').length,2);
});
test('v46.5 preserves closed publication boundaries and requires explicit recorded human approval',()=>{
 const sql=read('supabase/migrations/20261102071929_v46_5_editorial_matrix.sql');
 assert.match(sql,/create table if not exists public\.training_lu_editorial_reviews_v46_5/i);
 assert.match(sql,/create table if not exists public\.training_lu_editorial_events_v46_5/i);
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/for select to authenticated/i);
 assert.match(sql,/private\.is_platform_admin\(\)/);
 assert.match(sql,/not private\.can_edit_slide_images_v33\(\)/);
 assert.match(sql,/p_confirm_review is distinct from true/i);
 assert.match(sql,/p_expected_revision/i);
 assert.match(sql,/v_prev\.revision<>p_expected_revision/i);
 assert.match(sql,/v_note\)<40/i);
 assert.match(sql,/length\(v_rights\)<30/i);
 assert.match(sql,/newer\.version_number>cv\.version_number/i);
 assert.match(sql,/luv\.status='published'/i);
 assert.match(sql,/c\.metadata->>'freeze_scope'/);
 assert.match(sql,/insert into public\.training_lu_editorial_events_v46_5/i);
 assert.doesNotMatch(sql,/\b(update|delete|truncate)\s+(public\.)?(learning_unit_versions|learning_units|course_versions|course_modules|enrollments|learner_progress|assessments)\b/i);
 assert.doesNotMatch(sql,/grant\s+(insert|update|delete)\s+on\s+public\.training_lu_editorial_reviews/i);
});
test('v46.5 frontend is mounted in administrative scope with an accessible guide and precache',()=>{
 const html=read('apps/training/index.html');
 assert.ok(html.includes('admin-lu-editorial-v46-5.js'));
 assert.ok(html.includes('admin-lu-editorial-v46-5.css'));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/const CACHE='safety-training-v46-9-company-review'/);
 assert.ok(sw.includes('./admin-lu-editorial-v46-5.js'));
 assert.ok(sw.includes('./admin-lu-editorial-v46-5.css'));
 const menu=read('apps/training/admin-menu-v39.js');
 assert.match(menu,/editorial:'\[data-editorial-matrix-v46-5\]'/);
 const guide=read('apps/training/admin-help-v22.js');
 assert.match(guide,/'Revisione Learning Unit':/);
 assert.match(entry,/training_lu_editorial_matrix_v46_5/);
 assert.match(entry,/training_save_lu_editorial_review_v46_5/);
 assert.match(entry,/window\.confirm\(/);
 assert.match(entry,/data-review-history/);
 assert.match(entry,/SAFETY_EQUIPMENT_CASES_V46_3/);
 assert.match(read('package.json'),/tests\/admin-lu-editorial-v46-5\.test\.mjs/);
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const doc=read(p);
  assert.ok(doc.slice(0,900).includes('safety-training-v46-9-company-review'));
  assert.ok(doc.includes('v46.5 — Matrice di revisione editoriale delle Learning Unit'));
 }
});
