import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('didactic catalog shows real status/duration without implying learner completion',()=>{
 const code=read('apps/training/catalog-browser.js');
 for(const s of ['v45-catalog-toolbar','aria-live="polite"','type="search"','fmtMin(r.nominal_minutes)','r.unit_count','materialLabel(r)','statusClass(r)'])assert.ok(code.includes(s),s);
 assert.ok(code.includes('isLearner()'));
 assert.doesNotMatch(code,/r\.progress_pct|r\.active_seconds/);
});
test('assigned course cards retain real progress/status and accessible progressbar',()=>{
 const code=read('apps/training/learner-dashboard.js');
 for(const s of ['role="progressbar"','aria-valuemin="0"','aria-valuemax="100"','aria-valuenow="${pct.toFixed(0)}"','Avanzamento dei contenuti','data-enrollment-id','availability(a)','refreshAssignments()'])assert.ok(code.includes(s),s);
 assert.ok(code.includes('data-course-status'));
});
test('responsive visual styles and PWA cache are registered',()=>{
 const css=read('apps/training/catalog-learner-v45.css');
 for(const s of ['#catalogBrowserRoot .catalog-card','.learner-shell .learner-course','max-width:1100px','max-width:680px',':focus-visible','prefers-reduced-motion'])assert.ok(css.includes(s),s);
 const html=read('apps/training/index.html'),sw=read('apps/training/sw.js');
 assert.ok(html.includes('catalog-learner-v45.css'));
 assert.ok(sw.includes('"./catalog-learner-v45.css"'));
 assert.ok(sw.includes('safety-training-v46-5-editorial-matrix'));
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md'])assert.ok(read(p).includes('v45 — Tranche 2: catalogo e corsista/docente'));
});
