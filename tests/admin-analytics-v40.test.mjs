import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const mockWindow={};
const doc={readyState:'loading',addEventListener(){}};
runInNewContext(read('apps/training/admin-analytics-v40.js'),{window:mockWindow,document:doc,Intl,Date,Math,Number,String,Map,Set,Error});
const api=mockWindow.SAFETY_ADMIN_ANALYTICS_V40;

test('analytics dashboard shows real ratios and escapes untrusted text',()=>{
 const rows=[{status:'completed',progress_pct:75,final_score_pct:88,courseTitle:'Corsi <test>',enrolled_at:new Date().toISOString(),active_seconds:1200},
             {status:'in_progress',progress_pct:25,final_score_pct:null,courseTitle:'Corsi <test>',enrolled_at:new Date().toISOString(),active_seconds:0}];
 const html=api.dashboardMarkup({rows,truncated:false});
 assert.match(html,/50%/);
 assert.match(html,/Corsi &lt;test&gt;/);
 assert.doesNotMatch(html,/Corsi <test>/);
 assert.match(html,/Non avviati/);
 assert.match(html,/Esiti test registrati/);
 assert.match(html,/non equivalgono automaticamente/);
});

test('CSV export text cells are escaped against spreadsheet formula injection',()=>{
 assert.equal(api.csvCell('=1+1'), '"\'=1+1"');
 assert.ok(api.csvCell('=IMPORTXML("http://bad")').startsWith('"\'='));
 assert.equal(api.csvCell('Mario; Rossi'),'"Mario; Rossi"');
 assert.equal(api.csvCell('A"B'),'"A""B"');
});

test('report code retains learner/course filters, evidence lookup and no official certificate promise',()=>{
 const s=read('apps/training/admin-analytics-v40.js');
 for(const token of ['adminReportsV40Nav','a40Course','a40Learner','test_attempts','learning_sessions','learning_progress',
    'Esporta CSV','Stampa report','Scheda di svolgimento interna','Non costituisce attestato ufficiale',
    'manage_enrollments','adminDashboardAnalytics'])assert.ok(s.includes(token),token);
 assert.match(s,/new Blob/);
 assert.match(s,/truncated/);
});

test('HTML menu and PWA include analytics; sections link to report',()=>{
 const html=read('apps/training/index.html'),menu=read('apps/training/admin-menu-v39.js'),
 app=read('apps/training/admin.js'),sw=read('apps/training/sw.js');
 assert.ok(html.includes('admin-analytics-v40.js'));
 assert.ok(menu.includes("reports:'#adminReportsV40Nav'"));
 assert.ok(menu.includes("keys:['reports','activity','misc']"));
 assert.ok(app.includes('id="adminDashboardAnalytics"'));
 assert.ok(app.includes("renderDashboard?.({targetId:'adminDashboardAnalytics'})"));
 assert.ok(sw.includes('safety-training-v40-reports-dashboard'));
 assert.ok(sw.includes('admin-analytics-v40.js'));
});
