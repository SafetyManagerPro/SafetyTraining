import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const src=read('apps/training/admin-alphabetical-v47-8.js');
function start(){
 const document={
  readyState:'loading',
  addEventListener(){},
  createDocumentFragment(){return {isFragment:true,items:[],appendChild(node){this.items.push(node);}};}
 };
 const window={};
 runInNewContext(src,{document,window,Intl,queueMicrotask,MutationObserver:class{}});
 return {helpers:window.SAFETY_ADMIN_ALPHA_V47_8,document};
}
function mockSelect(label,entries,selected=''){
 const options=entries.map(([value,text])=>({value,textContent:text,tagName:'OPTION',disabled:false}));
 const select={
  label,children:options,tagName:'SELECT',disabled:false,
  selectedIndex:Math.max(0,options.findIndex(o=>o.value===selected)),
  hasAttribute(name){return name==='data-alpha-sort'?false:false;},
  closest(selector){
   if(selector==='label')return {childNodes:[{textContent:label},this]};
   if(selector==='[data-alpha-preserve]')return null;
   return null;
  },
  querySelector(){return null;},
  getAttribute(name){return name==='id'?'select-Test':null;},
  appendChild(fragment){
   for(const item of fragment.items){
    const index=this.children.indexOf(item);
    if(index>=0)this.children.splice(index,1);
    this.children.push(item);
   }
  },
  get options(){return this.children;},
  get value(){return this.options[this.selectedIndex]?.value||'';},
  set value(value){this.selectedIndex=this.options.findIndex(o=>o.value===value);}
 };
 return select;
}
test('alphabetical comparator uses Italian order, ignores case/accents, sorts numeric suffixes naturally',()=>{
 const {helpers}=start();
 const words=['Modulo 10','Zeta','Ètica','modulo 2','Álbero','caffè'];
 const got=[...words].sort(helpers.compare);
 assert.deepEqual(got,['Álbero','caffè','Ètica','modulo 2','Modulo 10','Zeta']);
 const records=[{title:'Zeta'},{title:'Alfa'}];
 const sorted=helpers.sortBy(records,x=>x.title);
 assert.deepEqual([...sorted].map(x=>x.title),['Alfa','Zeta']);
 assert.equal(records[0].title,'Zeta','source data must never be reordered');
});

test('course, learner, company and edition dropdowns stay alphabetic with placeholder and create action fixed',()=>{
 const {helpers}=start();
 for(const field of ['Corso da assegnare','Corsista già presente','Azienda','Organizzazione','Edizione','Modulo']){
  const select=mockSelect(field,[['','Seleziona…'],['z','Zeta 10'],['a','Álfa'],['n','Nero'],['b','Zeta 2'],['new','+ Nuova azienda']],'n');
  const before=select.value;
  assert.equal(helpers.sortOptions(select),true,field);
  assert.deepEqual(select.options.map(x=>x.value),['','a','n','b','z','new'],field);
  assert.equal(select.value,before,'must preserve chosen '+field);
  assert.equal(helpers.sortOptions(select),false,'second pass must be idempotent '+field);
 }
});

test('workflow and didactic semantic sequence controls must remain untouched',()=>{
 const {helpers}=start();
 for(const field of ['Stato corso','Durata del link','Modalità','Data del corso','Ordine delle slide','Stato versione']){
  const select=mockSelect(field,[['z','Zeta'],['a','Alfa']],'z');
  assert.equal(helpers.sortOptions(select),false,field);
  assert.deepEqual(select.options.map(x=>x.value),['z','a']);
 }
});

test('UI wiring covers all administration screens without touching learner slide renderer',()=>{
 const index=read('apps/training/index.html');
 const sw=read('apps/training/sw.js');
 const internal=read('apps/training/admin-internal-v47.js');
 const quick=read('apps/training/admin-quick-access-v46-11.js');
 const guided=read('apps/training/admin-guided-flow-v22.js');
 const admin=read('apps/training/admin.js');
 const image=read('apps/training/admin-image-library-v25.js');
 const registration=read('apps/training/admin-registration-v36.js');
 const membership=read('apps/training/admin-memberships-v21.js');
 assert.ok(index.includes('<script src="admin-alphabetical-v47-8.js"></script>'));
 assert.ok(sw.includes('./admin-alphabetical-v47-8.js'));
 assert.match(src,/MutationObserver/);
 assert.match(src,/if\(options\.every\(\(o,i\)=>o===desired\[i\]\)\)continue/);
 assert.match(src,/if\(\[\.\.\.select\.options\]\.some\(o=>o\.value===oldValue\)\)select\.value=oldValue/);
 assert.match(internal,/courses=alpha\(d\.courses,x=>x\.title\)/);
 assert.match(internal,/people=alpha\(\(d\.people\|\|\[\]\)\.filter\(p=>!p\.archived_at\),x=>x\.last_name\+' '\+x\.first_name\)/);
 assert.match(internal,/const items=alpha\(source\.filter/);
 assert.match(quick,/const matches=s\.data\.learners\.filter[\s\S]{0,160}\.sort\(\(a,b\)=>abc\.compare\(title\(a\),title\(b\)\)\)/);
 assert.match(guided,/const learners=ordered\(eligibleLearners/);
 assert.match(admin,/const q = state\.filters\.learners \|\| '', rows = alphabeticalBy/);
 assert.match(image,/\[\.\.\.cat\.courses\]\.sort/);
 assert.match(registration,/\.sort\(\(a,b\)=>a\.display\.localeCompare\(b\.display/);
 assert.match(membership,/activeOrganizations = organizations\.filter[\s\S]{0,160}\.sort/);
 assert.doesNotMatch(read('apps/training/interno.html'),/admin-alphabetical-v47-8\.js/);
 assert.doesNotMatch(src,/\.sort\(\(a,b\)=>Number\(a\.position\)/);
});
