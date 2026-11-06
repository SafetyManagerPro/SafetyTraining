#!/usr/bin/env node
// Controllo automatico del repository: sintassi JS, test Node e validazione XML GP04.
// Scopre da solo i file: aggiungere un nuovo modulo o test non richiede modifiche qui.
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const JS_DIRS = ['apps', 'packages', 'tools'];
const SKIP = new Set(['node_modules', '.git', 'docs', 'assets', 'supabase']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(js|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

function run(label, cmd, args) {
  const res = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  const ok = res.status === 0;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  return ok;
}

const failures = [];

// 1. Sintassi di tutti i moduli JS/MJS
const files = JS_DIRS.flatMap(d => walk(join(ROOT, d)));
for (const f of files) {
  const rel = relative(ROOT, f).split(sep).join('/');
  if (!run(`syntax ${rel}`, process.execPath, ['--check', f])) failures.push(rel);
}

// 2. Tutti i test Node
const tests = readdirSync(join(ROOT, 'tests'))
  .filter(n => n.endsWith('.test.mjs'))
  .map(n => `tests/${n}`);
if (!run(`tests (${tests.length} file)`, process.execPath, ['--test', ...tests])) failures.push('tests');

// 3. Validazione XML GP04 (Python, opzionale: se python3 manca lo script segnala l'errore)
if (!run('validate_gp04_xml.py', 'python3', ['scripts/validate_gp04_xml.py'])) failures.push('validate_gp04_xml.py');

console.log(`\nFile sintassi: ${files.length} | Test file: ${tests.length}`);
if (failures.length) {
  console.log(`Controlli falliti: ${failures.length}`);
  process.exit(1);
}
console.log('Tutti i controlli superati.');
