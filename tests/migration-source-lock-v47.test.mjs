import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const base=join(root,'supabase','migrations');
const lock=JSON.parse(readFileSync(join(root,'docs','SUPABASE_MIGRATION_SOURCE_LOCK_2026-11-06.json'),'utf8'));
const snapshot=JSON.parse(readFileSync(join(root,'docs','SUPABASE_REMOTE_MIGRATIONS_2026-11-06.json'),'utf8'));
const gitBlobSha = sql => createHash('sha1').update(Buffer.from('blob '+sql.length+'\0')).update(sql).digest('hex');

test('le 188 migrazioni applicate restano immutabili nel repository',()=>{
 assert.equal(lock.migrations.length,188);
 assert.deepEqual(lock.migrations.map(x=>[x.version,x.name]),snapshot.migrations.map(x=>[x.version,x.name]));
 for(const entry of lock.migrations){
  const buf=readFileSync(join(base,entry.version+'_'+entry.name+'.sql'));
  assert.equal(gitBlobSha(buf),entry.git_blob_sha,'SQL storico modificato: '+entry.name);
 }
});

test('la guardia intercetta anche una modifica invisibile alle statistiche SQL',()=>{
 const item=lock.migrations[0],sql=readFileSync(join(base,item.version+'_'+item.name+'.sql'));
 assert.notEqual(gitBlobSha(Buffer.concat([sql,Buffer.from('\n-- modifica non autorizzata')])),item.git_blob_sha);
});

test('nessun file SQL storico orfano',()=>{
 const known=new Set(lock.migrations.map(x=>x.version+'_'+x.name+'.sql'));
 const files=readdirSync(base).filter(x=>/^\d{14}_.+\.sql$/.test(x));
 const latest=lock.migrations.at(-1).version;
 assert.deepEqual(files.filter(x=>x.slice(0,14)<=latest && !known.has(x)),[]);
});
