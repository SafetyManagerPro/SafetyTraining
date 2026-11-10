import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('apps/training/admin-internal-v47.js');
const css=read('apps/training/admin-internal-v47.css');

test('no course is preselected: the course select starts on an empty, required placeholder',()=>{
 assert.match(ui,/const choices='<option value="" selected>— Scegli il corso —<\/option>'\+courses\.map/);
 assert.match(ui,/<select id="iv47Course" name="course_version_id" required autocomplete="off">/);
});

test('"Salva corsista" sits beside "Genera link personale" and needs a course',()=>{
 assert.match(ui,/<button type="button" id="iv47SaveAssignment"[^>]*>Salva corsista<\/button><button type="submit" class="primary"[^>]*>Genera link personale<\/button>/);
 assert.match(ui,/document\.getElementById\('iv47SaveAssignment'\)\?\.addEventListener\('click',event=>void assign\(event,'save'\)\);/);
 assert.match(ui,/if\(!version\)throw Error\('Scegli il corso da assegnare prima di salvare o generare il link\.'\);/);
});

test('saving without a link does not reveal or keep any link in the page',()=>{
 const body=ui.slice(ui.indexOf('async function assign(event,mode'),ui.indexOf('async function rotate('));
 assert.match(body,/if\(mode==='save'\)\{[\s\S]*?state\.link='';[\s\S]*?return;\s*\}/);
 const saveBranch=body.slice(body.indexOf("if(mode==='save')"),body.indexOf("await presentLink(token"));
 assert.doesNotMatch(saveBranch,/presentLink|showLink/);
});

test('progress section offers company and learner filters plus a grouping choice',()=>{
 assert.match(ui,/<select id="iv47CompanyFilter">/);
 assert.match(ui,/<select id="iv47PersonFilter">/);
 assert.match(ui,/<select id="iv47GroupBy">/);
 assert.match(ui,/\[\['person','Corsista'\],\['company','Azienda'\],\['none','Nessun gruppo'\]\]/);
 assert.match(ui,/groupBy:'person'/);
 assert.match(ui,/\(!filterCompany\|\|\(a\.company_name\|\|'Generico'\)===filterCompany\)&&/);
 assert.match(ui,/\(!filterPerson\|\|a\.person_id===filterPerson\)&&/);
});

test('rows are grouped with one compact header per learner or company, keeping order',()=>{
 assert.match(ui,/function groupItems\(items\)\{/);
 assert.match(ui,/class="iv47-group"><th colspan="8">/);
 assert.match(css,/\.iv47 \.iv47-table tr\.iv47-group th\{/);
});

test('filters and grouping are reset when the organization changes',()=>{
 assert.match(ui,/state\.filterCompany='';state\.filterPerson='';state\.editPerson='';/);
});
