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
 assert.match(html,/Con test registrato/);
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
    'Esporta CSV','Stampa report','Schede svolgimento','Non costituisce attestato ufficiale',
    'manage_enrollments','adminDashboardAnalytics','renderControlSummary','Priorità operative','Attestazione interna di svolgimento'])assert.ok(s.includes(token),token);
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
 assert.ok(app.includes("renderControlSummary?.({targetId:'adminControlAnalytics'})"));
 assert.match(sw,/const CACHE='safety-training-[^']+'/);
 assert.ok(sw.includes('admin-analytics-v40.js'));
});


test('backend enhancer never replaces the dashboard structure and control panel stays wired',()=>{
 const backend=read('apps/training/admin-backend-v21.js');
 const app=read('apps/training/admin.js');
 assert.doesNotMatch(backend,/host\.innerHTML=dashboardMarkup\(summary\)/);
 assert.ok(backend.includes("host.querySelector('.admin-loading') || !host.querySelector('.admin-stats')"));
 assert.ok(app.includes('id="adminControlAnalytics"'));
 assert.ok(app.includes("setHeader('Controllo operativo'"));
});


test('analytics hydration prevents MutationObserver re-entry storms',()=>{
 const s=read('apps/training/admin-analytics-v40.js');
 assert.equal((s.match(/dataset\.a40Loading='1'/g)||[]).length,2);
 assert.equal((s.match(/dataset\.a40Loading==='1'/g)||[]).length,2);
 assert.equal((s.match(/delete target\.dataset\.a40Loading/g)||[]).length,2);
 assert.equal((s.match(/dataset\.a40Loaded='error'/g)||[]).length,1);
});

test('analytics errors stay terminal until the user explicitly retries',async()=>{
 let calls=0,retryHandler;
 const retryButton={addEventListener(type,handler,options){assert.equal(type,'click');assert.equal(options?.once,true);retryHandler=handler;}};
 const target={dataset:{},isConnected:true,innerHTML:'',querySelector(selector){return selector==='[data-a40-retry]'?retryButton:null;}};
 const style={};
 const documentMock={
  readyState:'loading',head:{appendChild(){}},addEventListener(){},
  createElement(){return style;},
  getElementById(id){return id==='adminDashboardAnalytics'?target:null;}
 };
 const client={from(){calls++;throw Error('<errore transitorio>');}};
 const windowMock={
  SAFETY_CLOUD:{state:{client,user:{id:'admin-test'}}},
  SAFETY_ADMIN_CAPABILITIES_STATE:{platform_admin:true,capabilities:{}}
 };
 runInNewContext(read('apps/training/admin-analytics-v40.js'),{window:windowMock,document:documentMock,Intl,Date,Math,Number,String,Map,Set,Error});
 await windowMock.SAFETY_ADMIN_ANALYTICS_V40.renderDashboard();
 assert.equal(calls,6);
 assert.equal(target.dataset.a40Loaded,'error');
 assert.equal(target.dataset.a40Loading,undefined);
 assert.match(target.innerHTML,/Riprova/);
 assert.match(target.innerHTML,/&lt;errore transitorio&gt;/);
 assert.equal(typeof retryHandler,'function');
 retryHandler();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,12);
 assert.equal(target.dataset.a40Loaded,'error');
});

