import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('apps/training/integration-import.js');
const jsonFixture=read('tests/fixtures/safetymanager-transfer-v1.2.json');
const csvFixture=read('tests/fixtures/safetymanager-transfer-v1.2.csv');

function importer(){
  const window={};
  const document={readyState:'loading',addEventListener(){}};
  runInNewContext(source,{window,document,console,setTimeout});
  return window.SAFETY_SM_IMPORT;
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('JSON v1.x remains backward compatible and exposes mapped fields',()=>{
  const api=importer(),parsed=api.jsonToPayload(jsonFixture),check=api.validatePayload(parsed.payload);
  assert.equal(check.ok,true);
  assert.equal(parsed.payload.schema_version,'1.2');
  assert.equal(parsed.payload.learners.length,2);
  assert.deepEqual(plain(parsed.payload.project.risk_codes),['RUMORE','VDT']);
  const fields=api.mappedFieldNames(parsed.payload);
  assert.ok(fields.includes('company.vat_or_fiscal_code'));
  assert.ok(fields.includes('project.course_code'));
  assert.ok(fields.includes('learners[].fiscal_code'));

  const legacy=plain(parsed.payload);legacy.schema_version='1.0';delete legacy.company.vat_or_fiscal_code;
  const legacyCheck=api.validatePayload(legacy);
  assert.equal(legacyCheck.ok,true);
  assert.match(legacyCheck.warnings.join(' '),/Codice Fiscale azienda mancante/);
});

test('CSV exported by SafetyManager rebuilds the same transfer payload as JSON',()=>{
  const api=importer(),json=plain(api.jsonToPayload(jsonFixture).payload),csv=plain(api.csvToPayload(csvFixture).payload);
  assert.deepEqual(csv,json);
  assert.equal(api.validatePayload(csv).ok,true);
  assert.equal(csv.project.course_duration_minutes,480);
  assert.equal(csv.project.requires_presence,false);
  assert.equal(csv.project.needs_analysis_accepted,true);
});

test('file detection accepts JSON and CSV while rejecting unrelated or malformed files',async()=>{
  const api=importer();
  const json=await api.parseTransferFile({name:'export.json',type:'application/json',text:async()=>jsonFixture});
  const csv=await api.parseTransferFile({name:'export.csv',type:'text/csv',text:async()=>csvFixture});
  assert.equal(json.format,'JSON');assert.equal(csv.format,'CSV');
  await assert.rejects(api.parseTransferFile({name:'corsisti.csv',type:'text/csv',text:async()=>'Nome;Cognome\nMario;Rossi'}),/Colonne mancanti/);
  await assert.rejects(api.parseTransferFile({name:'export.json',type:'application/json',text:async()=>'{bad'}),/JSON non valido/);
  await assert.rejects(api.parseTransferFile({name:'export.txt',type:'text/plain',text:async()=>''}),/Formato .* non supportato/);
});

test('preview lists mapped company, project and learner fields before any import',()=>{
  const api=importer(),payload=api.jsonToPayload(jsonFixture).payload,check=api.validatePayload(payload),fields=api.mappedFieldNames(payload);
  const html=api.previewHtml(payload,'JSON',fields,check);
  assert.match(html,/Campi mappati/);
  assert.match(html,/company\.vat_or_fiscal_code/);
  assert.match(html,/project\.course_code/);
  assert.match(html,/learners\[\]\.fiscal_code/);
  assert.match(html,/Mario Rossi/);
  assert.match(html,/BNCNNA85B41F205X/);
});

test('generic CSV/Excel importer routes SafetyManager structured CSV to the dedicated preview',()=>{
  const generic=read('apps/training/admin-access-import-v21.js');
  assert.match(generic,/isSafetyManagerCsv/);
  assert.match(generic,/SAFETY_SM_IMPORT\?\.openFile/);
  assert.match(source,/accept="application\/json,text\/csv,\.json,\.csv"/);
  assert.match(source,/version:'48\.4'/);
});
