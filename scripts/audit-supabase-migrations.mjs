#!/usr/bin/env node
// Controllo strettamente read-only tra snapshot delle migrazioni applicate e file in Git.
// Non accede al database; non esegue SQL e non tenta riparazioni automatiche.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const snapshot = JSON.parse(readFileSync(join(root,'docs','SUPABASE_REMOTE_MIGRATIONS_2026-11-06.json'),'utf8'));
const dir = join(root,'supabase','migrations');
const local = readdirSync(dir).filter(name => /^\d{14}_.+\.sql$/.test(name)).sort();
const remote = snapshot.migrations;
const byVersion = new Map();
for (const entry of remote) {
  if (byVersion.has(entry.version)) throw new Error('Versione remota duplicata: '+entry.version);
  byVersion.set(entry.version,entry);
}
const latestRemote = remote.map(x=>x.version).sort().at(-1);
const remoteMissing = remote.filter(x => !local.includes(x.version+'_'+x.name+'.sql'));
const obsolete = local.filter(filename => !byVersion.has(filename.slice(0,14)) && filename.slice(0,14)<=latestRemote);
const pending = local.filter(filename => !byVersion.has(filename.slice(0,14)) && filename.slice(0,14)>latestRemote);
const wrongNames = local.filter(filename => {
  const entry=byVersion.get(filename.slice(0,14));
  return entry && filename!==entry.version+'_'+entry.name+'.sql';
});
let exactSQL = 0;
const sqlDiffs = [];
for (const migration of remote) {
  const filename=migration.version+'_'+migration.name+'.sql';
  if (!local.includes(filename)) continue;
  const sql=readFileSync(join(dir,filename));
  const md5=createHash('md5').update(sql).digest('hex');
  if (md5===migration.sql_md5) exactSQL++;
  else sqlDiffs.push({name:filename,localBytes:sql.length,remoteBytes:migration.sql_bytes});
}
// Impronte dei file applicati, indipendenti dal contenuto abbreviato di schema_migrations.statements.
const locked=JSON.parse(readFileSync(join(root,'docs','SUPABASE_MIGRATION_SOURCE_LOCK_2026-11-06.json'),'utf8'));
const lockedByVersion=new Map();
const integrityErrors=[];
for (const item of locked.migrations) {
  if (lockedByVersion.has(item.version)) integrityErrors.push('LOCK_DUPLICATE '+item.version);
  lockedByVersion.set(item.version,item);
}
if (locked.migrations.length!==remote.length) integrityErrors.push('LOCK_COUNT '+locked.migrations.length+' != '+remote.length);
for (const migration of remote) {
  const item=lockedByVersion.get(migration.version);
  const filename=migration.version+'_'+migration.name+'.sql';
  if (!item || item.name!==migration.name) {
    integrityErrors.push('LOCK_MISSING '+filename);
    continue;
  }
  if (!local.includes(filename)) continue; // already reported by remoteMissing
  const sql=readFileSync(join(dir,filename));
  const blobSha=createHash('sha1').update(Buffer.from('blob '+sql.length+'\0')).update(sql).digest('hex');
  if (blobSha!==item.git_blob_sha) integrityErrors.push('LOCK_MODIFIED '+filename);
}
for (const item of locked.migrations) {
  if (!byVersion.has(item.version)) integrityErrors.push('LOCK_UNKNOWN '+item.version);
}

console.log('Snapshot '+snapshot.captured_on+': '+remote.length+' versioni Supabase; '+local.length+' file SQL GitHub');
console.log('Versioni/nome mancanti nel repository: '+remoteMissing.length);
console.log('File storici senza versione remota: '+obsolete.length);
console.log('File per migrazioni future (dopo snapshot): '+pending.length);
console.log('Filename non corrispondenti a nome remoto: '+wrongNames.length);
console.log('SQL coincidente byte-per-byte con testo storico disponibile: '+exactSQL+'/'+remote.length);
console.log('Testo SQL non identico (non necessariamente anomalia): '+sqlDiffs.length);
console.log('Integrita sorgenti storici (Git SHA): '+(remote.length-integrityErrors.length)+'/'+remote.length);
for (const x of remoteMissing) console.error('MISSING '+x.version+'_'+x.name+'.sql');
for (const x of obsolete) console.error('OBSOLETE '+x);
for (const x of wrongNames) console.error('WRONG_NAME '+x);
for (const x of pending) console.log('PENDING '+x);
for (const x of integrityErrors) console.error(x);
if (process.argv.includes('--strict') && (remoteMissing.length||obsolete.length||wrongNames.length||integrityErrors.length)) {
  console.error('ERRORE: riconciliazione degli identificativi incompleta.');
  process.exitCode=1;
}
if (process.argv.includes('--strict-content') && sqlDiffs.length) {
  console.error('ERRORE: il contenuto SQL non coincide esattamente con il testo storico.');
  process.exitCode=1;
}
// Differenze SQL storiche: alcune migration entries contengono placeholder e non il SQL effettivamente applicato.
// Non riscrivere i file SQL dai record remoti senza verificare dipendenze ed eseguire replay isolato.
