import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win={addEventListener(){},SAFETY_DATA:[]};
const ctx={window:win,document:{readyState:'loading',addEventListener(){}},setTimeout,URL};
runInNewContext(read('apps/training/admin-print-lessons-v23.js'),ctx);
runInNewContext(read('apps/training/db-slide-adapter.js'),ctx);
const printing=win.SAFETY_ADMIN_PRINT_LESSONS_V23;
const adapter=win.SAFETY_DB_SLIDES;

const placeholders=[
 ['agg_lav','dynamic_update'],
 ['agg_dir','dynamic_update'],
 ['agg_prep','dynamic_update'],
 ['agg_rls_4h','dynamic_rls_update'],
 ['agg_rls_8h','dynamic_rls_update'],
 ['lav_quota','height_theory']
];
test('exactly six recognized historical placeholder patterns are omitted only beside populated same-position modules',()=>{
 for(const [course,key] of placeholders){
  const modules=[
   {id:course+'-old',position:1,module_key:key,title:'Modulo storico vuoto'},
   {id:course+'-real',position:1,module_key:'published-real',title:'Modulo didattico completo'}
  ];
  const links=[{module_id:course+'-real',unit_version_id:'lu1',position:1}];
  const normalized=printing.classifyPrintModules(modules,links);
  assert.deepEqual(Array.from(normalized.modules.map(m=>m.id)),[course+'-real']);
  assert.deepEqual(Array.from(normalized.ignored.map(m=>m.id)),[course+'-old']);
  assert.equal(printing.classifyPrintModules(modules,[]).ignored.length,0);
  assert.equal(printing.classifyPrintModules([{...modules[0],position:2},modules[1]],links).ignored.length,0);
 }
});
test('non-scaffold or uniquely empty modules cannot pass the print preflight',()=>{
 const modules=[
  {id:'empty-important',module_key:'risk_assessment',position:1,title:'Modulo completo mancante'},
  {id:'populated',module_key:'normal',position:1,title:'Modulo reale'}
 ];
 const links=[{module_id:'populated',unit_version_id:'x'}];
 const normalized=printing.classifyPrintModules(modules,links);
 assert.equal(normalized.modules.length,2);
 const checked=printing.inspectBook({modules:normalized.modules.map(m=>({
   ...m,units:m.id==='populated'?[{unitStatus:'published',content:{summary:'Contenuto verificabile'}}]:[]
 }))});
 assert.equal(checked.ready,false);
 assert.match(checked.issues.join(' '),/senza Learning Unit/);
});
test('admin print loader keeps linked LU and strips only duplicate empty legacy shell',async()=>{
 const c={id:'c1',stable_key:'agg_lav',title:'Aggiornamento Lavoratori'},
 v={id:'v2',course_id:'c1',status:'published',version_number:2};
 const source={
  course_modules:[
   {id:'old',position:1,module_key:'dynamic_update',title:'Aggiornamento contestualizzato',nominal_minutes:360},
   {id:'full',position:1,module_key:'agg-worker',title:'Aggiornamento lavoratori: rischi',nominal_minutes:360}
  ],
  course_module_units:[
   {module_id:'full',unit_version_id:'uv1',position:1,required:true},
   {module_id:'full',unit_version_id:'uv2',position:2,required:true}
  ],
  learning_unit_versions:[
   {id:'uv1',learning_unit_id:'u1',version_number:1,status:'published',content:{summary:'Prima unità didattica'}},
   {id:'uv2',learning_unit_id:'u2',version_number:1,status:'published',content:{summary:'Seconda unità didattica'}}
  ],
  learning_units:[{id:'u1',title:'U1',default_minutes:45},{id:'u2',title:'U2',default_minutes:45}]
 };
 const client={from(name){return{
  select(){return this;},eq(){return this;},in(){return this;},order(){return this;},
  async limit(){return {data:source[name],count:source[name].length,error:null};}
 };}};
 const book=await printing.loadBook(client,c,v);
 assert.equal(book.modules.length,1);
 assert.equal(book.ignoredPlaceholders.length,1);
 assert.equal(book.modules[0].units.length,2);
 assert.equal(printing.inspectBook(book).ready,true);
});
test('presentation adapter does not allocate fake module time for duplicate placeholder',()=>{
 const bundle={
  course:{stable_key:'agg_lav',title:'Aggiornamento lavoratori',nominal_minutes:360},
  version:{status:'published',version_number:2},
  modules:[
   {module_key:'dynamic_update',position:1,title:'Vecchio',nominal_minutes:360,units:[]},
   {module_key:'agg-worker',position:1,title:'Aggiornamento',nominal_minutes:360,
    units:[{stable_key:'u1',position:1,title:'Comportamenti sicuri',default_minutes:120,content:{title:'Comportamenti sicuri',summary:'Approfondimento'}}]}
  ]
 };
 const output=adapter.adaptBundle(bundle);
 assert.equal(output.modules.length,1);
 assert.equal(output.topics.length,1);
 assert.equal(output.modules[0].id,'agg-worker');
 assert.ok(output.planned_minutes<=360);
});
