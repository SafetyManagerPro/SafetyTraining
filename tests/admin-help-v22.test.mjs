import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const context={window:{}};runInNewContext(read('apps/training/admin-help-v22.js'),context);
const {helpFor}=context.window.SAFETY_ADMIN_HELP_RULES_V22;
test('every main administration section provides specific operational help',()=>{
 for(const t of ['Dashboard','Organizzazioni','Aziende','Corsisti','Corsi','Edizioni','Iscrizioni','Attività']){
   const guide=helpFor(t);
   assert.match(guide.title,/Guida/);
   assert.ok(guide.steps.length>=3,t);
   assert.ok(guide.note.length>30,t);
 }
});
test('technical screens and onboarding guidance are also available',()=>{
 for(const title of ['Catalogo corsi SafetyManager','Blueprint corsi e Master Registry','Readiness corsi','Qualità didattica v22','Accessi & import','Requisiti pratici']){
   assert.ok(helpFor(title).steps.length>=3,title);
 }
 assert.ok(helpFor('Altra schermata').steps.length>=3);
});
test('help explains deletion constraints rather than enabling hard delete',()=>{
 for(const name of ['Aziende','Corsisti','Edizioni','Iscrizioni'])assert.match(helpFor(name).note,/elimina|cancell|revoca|disattiva/i);
 const src=read('apps/training/admin-help-v22.js');
 assert.doesNotMatch(src,/\.delete\s*\(|\.rpc\s*\(/);
});
test('admin header exposes an accessible question-mark toggle and an inline region',()=>{
 const admin=read('apps/training/admin.js'),html=read('apps/training/index.html');
 assert.match(admin,/id="adminHelpToggle" aria-controls="adminHelpPanel" aria-expanded="false"/);
 assert.match(admin,/id="adminHelpPanel" role="region" aria-labelledby="adminHelpHeading" hidden/);
 assert.match(admin,/SAFETY_ADMIN_HELP_V22\?\.sync/);
 assert.match(html,/admin-help-v22\.css/);assert.match(html,/admin-help-v22\.js/);
});
test('help stays nonmodal and wizard retains its own contextual question mark',()=>{
 const src=read('apps/training/admin-help-v22.js');
 assert.match(src,/title==='Avvia percorso'/);
 assert.match(src,/hidden=!open\|\|hidden/);
 assert.match(src,/focus\(\)/);
 assert.doesNotMatch(src,/MutationObserver|setInterval/);
});

test('v22.3.3 deletion procedure is visible in every required admin list',()=>{
  const source=read('apps/training/admin.js');
  for(const type of ['company','learner','edition','enrollment']){
    assert.match(source,new RegExp("btn\\('Elimina…','review-delete-"+type+"'"));
  }
  assert.match(source,/a\.startsWith\('review-delete-'\)/);
  assert.match(source,/async function reviewDeletion\(kind,id\)/);
  assert.match(source,/SAFETY_ADMIN_DELETE_PLANNER_V22/);
  assert.match(read('apps/training/admin-delete-planner-v22.js'),/transazione autorizzata e auditata/);
  const guide=read('apps/training/admin-guidance-v21.js');
  assert.doesNotMatch(guide,/addDependencyPreviewButtons|data-preview-dependency/);
});
