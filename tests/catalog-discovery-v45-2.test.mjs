import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const rows=[
 {stable_key:'alpha',title:'Alpha DPI',family:'DPI',nominal_minutes:120,unit_count:10,version_status:'published'},
 {stable_key:'beta',title:'Beta Carrelli',family:'Attrezzature',nominal_minutes:0,unit_count:0,version_status:'draft'},
 {stable_key:'gamma',title:'Gamma Rischi',family:'DPI',nominal_minutes:60,unit_count:5,version_status:'published'},
 {stable_key:'delta',title:'Delta Mezzi',family:'Attrezzature',nominal_minutes:180,unit_count:1,version_status:'published'}
];
function setup(){
 let html='',count='';
 const controls={
  catalogSearch:{value:'',oninput:null,focus(){}},catalogFamily:{value:'',onchange:null},
  catalogReadiness:{value:'all',onchange:null},catalogSort:{value:'title',onchange:null},
  catalogResetFilters:{disabled:false,onclick:null},
  catalogResultCount:{set textContent(v){count=v;}},
  catalogCards:{set innerHTML(v){html=v;},addEventListener(){}},
  catalogBrowserRoot:{innerHTML:'',querySelector:()=>null}
 };
 const doc={readyState:'loading',getElementById:id=>controls[id]||null,addEventListener(){},body:{classList:{remove(){}}}};
 const win={SAFETY_DATA:[],SAFETY_CLOUD:{state:{user:{id:'admin'},learner:null,client:{rpc:async()=>({data:rows,error:null})}}}};
 runInNewContext(read('apps/training/catalog-browser.js'),{window:win,document:doc,console,setTimeout,Number,Set,String,encodeURIComponent,decodeURIComponent});
 const names=()=>[...html.matchAll(/<h3>(.*?)<\/h3>/g)].map(m=>m[1]);
 return {win,controls,names,getCount:()=>count};
}
test('filters material availability and sorts from real metadata',async()=>{
 const {win,controls,names,getCount}=setup();
 await win.SAFETY_CATALOG.load();
 assert.deepEqual(names(),['Alpha DPI','Beta Carrelli','Delta Mezzi','Gamma Rischi']);
 assert.equal(getCount(),'4 corsi trovati');
 assert.equal(controls.catalogResetFilters.disabled,true);
 controls.catalogReadiness.value='ready';controls.catalogReadiness.onchange();
 assert.deepEqual(names(),['Alpha DPI','Delta Mezzi','Gamma Rischi']);
 assert.equal(getCount(),'3 corsi trovati su 4');
 controls.catalogSort.value='duration';controls.catalogSort.onchange();
 assert.deepEqual(names(),['Gamma Rischi','Alpha DPI','Delta Mezzi']);
 controls.catalogSort.value='units';controls.catalogSort.onchange();
 assert.deepEqual(names(),['Alpha DPI','Gamma Rischi','Delta Mezzi']);
 controls.catalogReadiness.value='missing';controls.catalogReadiness.onchange();
 assert.deepEqual(names(),['Beta Carrelli']);
});
test('filters persist when returning home and reset without stored preferences',async()=>{
 const {win,controls,names,getCount}=setup();
 await win.SAFETY_CATALOG.load();
 controls.catalogSearch.value='a';controls.catalogSearch.oninput();
 controls.catalogFamily.value='DPI';controls.catalogFamily.onchange();
 assert.deepEqual(names(),['Alpha DPI','Gamma Rischi']);
 win.SAFETY_CATALOG.renderHome();
 assert.equal(controls.catalogSearch.value,'a');
 assert.equal(controls.catalogFamily.value,'DPI');
 assert.deepEqual(names(),['Alpha DPI','Gamma Rischi']);
 controls.catalogReadiness.value='missing';controls.catalogReadiness.onchange();
 assert.deepEqual(names(),[]);
 assert.equal(getCount(),'0 corsi trovati su 4');
 controls.catalogResetFilters.onclick();
 assert.deepEqual(names(),['Alpha DPI','Beta Carrelli','Delta Mezzi','Gamma Rischi']);
 assert.equal(controls.catalogSearch.value,'');
 assert.equal(controls.catalogFamily.value,'');
 assert.equal(controls.catalogReadiness.value,'all');
 assert.equal(controls.catalogSort.value,'title');
 assert.equal(controls.catalogResetFilters.disabled,true);
});
test('v45.2 frontend and handoffs match cache and preserve learner guard',()=>{
 const src=read('apps/training/catalog-browser.js');
 for(const s of ['id="catalogReadiness"','id="catalogSort"','id="catalogResetFilters"','filters:blankFilters()','state.filters=blankFilters()','isLearner()'])assert.ok(src.includes(s),s);
 assert.doesNotMatch(src,/r\.progress_pct|r\.active_seconds/);
 const css=read('apps/training/catalog-learner-v45.css');
 assert.ok(css.includes('@media(max-width:1150px)'));
 assert.ok(css.includes('@media(max-width:680px)'));
 const cache='safety-training-v46-7-unified-journey';
 assert.ok(read('apps/training/sw.js').includes(cache));
 for(const path of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const h=read(path);assert.ok(h.slice(0,750).includes(cache));assert.ok(h.includes('v45.2 — Ricerca e filtri catalogo'));
 }
 assert.ok(read('package.json').includes('tests/catalog-discovery-v45-2.test.mjs'));
});
