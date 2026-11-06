#!/usr/bin/env node
// Audit read-only delle migrazioni. Nessuna connessione DB o modifica ai file.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, 'docs', 'SUPABASE_REMOTE_MIGRATIONS_2026-11-06.json');
const migrationsDir = join(root, 'supabase', 'migrations');
const snapshot = JSON.parse(readFileSync(manifestPath, 'utf8'));
const local = readdirSync(migrationsDir).filter((name) => /^\d{14}_.+\.sql$/.test(name))
  .map((name) => ({ name, version: name.slice(0, 14), bytes: statSync(join(migrationsDir, name)).size }));
const byVersion = new Map(local.map((entry) => [entry.version, entry]));
const remote = snapshot.migrations;
const remoteVersions = new Set(remote.map((entry) => entry.version));
const remoteOnly = remote.filter((entry) => !byVersion.has(entry.version));
const localOnly = local.filter((entry) => !remoteVersions.has(entry.version));
const byteDifferences = remote.filter((entry) => byVersion.has(entry.version) &&
  Math.abs(byVersion.get(entry.version).bytes - entry.sql_bytes) > 5);
const duplicates = remote.filter((entry, index) => remote.findIndex((r) => r.name === entry.name) !== index);
console.log(`Snapshot ${snapshot.captured_on}: Supabase ${remote.length}, GitHub ${local.length}`);
console.log(`Solo su Supabase (versione): ${remoteOnly.length}`);
console.log(`Solo su GitHub (versione): ${localOnly.length}`);
console.log(`Nomi duplicati nello storico remoto: ${duplicates.length}`);
console.log(`Differenze dimensionali > 5 byte su versioni già abbinate: ${byteDifferences.length}`);
for (const entry of remoteOnly) console.log(`REMOTE_ONLY ${entry.version} ${entry.name}`);
for (const entry of localOnly) console.log(`LOCAL_ONLY ${entry.name}`);
for (const entry of byteDifferences) console.log(`SIZE_DIFF ${entry.version} ${entry.name}`);
if (process.argv.includes('--strict') && (remoteOnly.length || localOnly.length || byteDifferences.length)) {
  console.error('Allineamento incompleto: nessuna operazione SQL eseguita.');
  process.exitCode = 1;
}
// Il confronto dimensionale NON dimostra uguaglianza semantica del SQL.
