import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('v45 reuses existing dashboard and navigation',()=>{
 const a=read('apps/training/admin.js');
 const slice=a.slice(a.indexOf('async function dashboard(seq)'),a.indexOf('async function organizations(seq)'));
 assert.ok(slice.includes('class="v45-dashboard"'));
 for(const route of ['learners','courses','editions','enrollments'])assert.ok(slice.includes('data-jump="'+route+'"'));
 assert.ok(slice.includes('id="adminDashboardAnalytics"'));
 assert.ok(slice.includes("renderDashboard?.({targetId:'adminDashboardAnalytics'})"));
 assert.ok(slice.includes('data-action="open-reports-v40"'));
 assert.ok(read('apps/training/admin-analytics-v40.js').includes('data-a40-retry'));
});
test('v45 CSS remains scoped, accessible and responsive',()=>{
 const css=read('apps/training/admin-visual-v45.css');
 for(const s of ['#adminContent .v45-dashboard','.a40-grid','prefers-reduced-motion',':focus-visible','max-width:1180px','max-width:760px','max-width:520px'])assert.ok(css.includes(s),s);
});
test('v45 asset and handoffs aligned',()=>{
 assert.ok(read('apps/training/index.html').includes('admin-visual-v45.css'));
 const sw=read('apps/training/sw.js');
 assert.ok(sw.includes('"./admin-visual-v45.css"'));
 assert.ok(sw.includes("safety-training-v46-6-admin-scrollbars"));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md'])assert.ok(read(p).includes('v45 — Tranche 1: dashboard e navigazione'));
});
