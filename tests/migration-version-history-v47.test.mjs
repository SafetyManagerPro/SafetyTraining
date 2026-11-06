import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const migrationsDir=join(root,'supabase','migrations');
const snapshot=JSON.parse(readFileSync(join(root,'docs','SUPABASE_REMOTE_MIGRATIONS_2026-11-06.json'),'utf8'));
const sqlFiles=readdirSync(migrationsDir).filter(x=>/^\d{14}_.+\.sql$/.test(x));
const sql=(filename)=>readFileSync(join(migrationsDir,filename),'utf8');

test('ogni versione applicata è presente con il suo nome esatto',()=>{
 const files=new Set(sqlFiles);
 const versions=new Set();
 for(const entry of snapshot.migrations){
  assert.match(entry.version,/^\d{14}$/);
  assert.ok(!versions.has(entry.version),'versione duplicata '+entry.version);
  versions.add(entry.version);
  assert.ok(files.has(entry.version+'_'+entry.name+'.sql'),'manca '+entry.version+'_'+entry.name+'.sql');
 }
});

test('le due migrazioni remote prima assenti sono recuperate senza modifica dei dati',()=>{
 const preview=sql('20261019135645_v22_013_admin_deletion_read_only_preview.sql');
 assert.match(preview,/admin_preview_deletion_v25/);
 assert.match(preview,/execution_enabled'\s*,\s*false/);
 assert.doesNotMatch(preview,/\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b/i);
 const cleanup=sql('20261020203108_v24_007_assisted_cleanup_audit.sql');
 assert.match(cleanup,/add column if not exists deletion_origin/i);
 assert.doesNotMatch(cleanup,/\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b/i);
});

test('le due registrazioni duplicate conservano la stessa logica idempotente',()=>{
 assert.equal(
  sql('20261016214908_v21_007_admin_requirement_evidence_service.sql'),
  sql('20261017042346_v21_007_admin_requirement_evidence_service.sql')
 );
 assert.equal(
  sql('20261020055444_v22_018_review_private_source_figures.sql'),
  sql('20261020070604_v22_018_review_private_source_figures.sql')
 );
});

test('le migrazioni v47 originali mantengono i contratti interni senza sincronizzare Corsisti',()=>{
 const sqlText=sql('20261104115002_v47_11_fast_copy_regular_learners.sql');
 assert.match(sqlText,/internal_admin_import_candidates_v47_11/);
 assert.match(sqlText,/internal_admin_import_assign_v47_11/);
 assert.match(sqlText,/No table links, no synchronization/);
});
