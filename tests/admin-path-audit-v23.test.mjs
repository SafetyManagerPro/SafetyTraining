import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){}},setTimeout};
runInNewContext(read('apps/training/admin-path-audit-v23.js'),context);
const audit=context.window.SAFETY_ADMIN_PATH_AUDIT_V23;
const related=(overrides={})=>({
 learners:new Map([['learner',{id:'learner',first_name:'Mario',last_name:'Test'}]]),
 sessions:new Map(),progress:new Map(),tests:new Map(),evidence:new Map(),practice:new Map(),...overrides
});
test('course evidence never turns automatically into an attestato',()=>{
 const result=audit.inspect({id:'en',learner_id:'learner',status:'passed',progress_pct:100,active_seconds:3600},related({
  sessions:new Map([['en',[{active_seconds:3600,ended_at:'2026-01-01'}]]]),
  tests:new Map([['en',[{passed:true,completed_at:'2026-01-01'}]]]),
  evidence:new Map([['en',[{status:'completed'}]]])
 }));
 assert.equal(result.hasSessions,true);
 assert.equal(result.hasTests,true);
 assert.equal(result.hasEvidence,true);
 assert.equal(result.documentDecision,'Da verificare manualmente');
 assert.match(result.tests,/1\/1 superati/);
 const html=audit.renderReport({id:'ed',status:'open',learning_mode:'elearning_internal',title:'Corso'},
   {courseTitle:'Corso',nominalMinutes:480},{diagnostics:[result],incomplete:false});
 assert.match(html,/NON autorizzano automaticamente attestati/);
 assert.match(html,/Da verificare/);
});
test('missing learner and mismatched attendance is flagged, not certified',()=>{
 const v=audit.inspect({id:'en',learner_id:'missing',status:'in_progress',progress_pct:30,active_seconds:1000},
   related({sessions:new Map([['en',[{active_seconds:50,ended_at:null}]]])}));
 assert.match(v.administrative,/Verificare/);
 assert.match(v.frequency,/riconciliare tempi/);
 assert.match(v.frequency,/1 aperte/);
 assert.ok(v.alerts.includes('anagrafica'));
 assert.ok(v.alerts.includes('tempi non allineati'));
});
test('revoked enrollment stays visible while readiness remains undecided',()=>{
 const v=audit.inspect({id:'en',learner_id:'learner',status:'revoked',progress_pct:0,active_seconds:0},related());
 assert.equal(v.didactics,'Revocata');
 assert.equal(v.documentDecision,'Da verificare manualmente');
});
test('file is read-only, uses bounded queries, and links existing readiness and quality sections',()=>{
 const src=read('apps/training/admin-path-audit-v23.js');
 assert.match(src,/MAX_DETAILS=1000/);
 assert.match(src,/data-quality-v22/);
 assert.match(src,/data-readiness-admin/);
 assert.match(src,/adminPathEdition/);
 assert.match(src,/Dati parziali/);
 assert.doesNotMatch(src,/\.delete\s*\(|\.update\s*\(|\.insert\s*\(|\.upsert\s*\(/);
});

test('print-only review is explicitly not a certificate and does not write records',()=>{
 const js=read('apps/training/admin-path-audit-v23.js');
 const css=read('apps/training/admin-path-audit-v23.css');
 const index=read('apps/training/index.html');
 assert.match(js,/Stampa scheda istruttoria/);
 assert.match(js,/NON È UN ATTESTATO/);
 assert.match(js,/Firma docente/);
 assert.match(js,/admin-path-print/);
 assert.match(css,/@media print/);
 assert.match(index,/admin-path-audit-v23\.css/);
 assert.doesNotMatch(js,/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(/);
});
