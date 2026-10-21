import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const window={};const context={window};
runInNewContext(read('apps/training/visual-asset-guard-v32.js'),context);
const api=window.SAFETY_LOCAL_VISUALS_V32;
const catalog=JSON.parse(read('apps/training/image-library-v25.json')).images;
test('every image in the local asset manifest exists in the deployed training directory',()=>{
 assert.ok(catalog.length>=200);
 for(const item of catalog)assert.equal(existsSync(new URL('../apps/training/'+item,import.meta.url)),true,item);
});
test('all four previously broken visual category slugs resolve to existing graphic files',()=>{
 const cases=[
  ['equipment-training','attr_carroponte_all_11h','Tipologie, fisica e componenti del carroponte','gp04-baricentro-sollevamento.svg'],
  ['equipment-training','attr_carrelli_ind','Portata e stabilità dei carrelli','gp04-baricentro-carrelli.svg'],
  ['equipment-training','attr_ple','Uso in sicurezza delle PLE','gp04-stabilita-ple.svg'],
  ['equipment-training','attr_mmt_all','Uso sicuro dell’escavatore','gp04-scarpate-mmt.svg'],
  ['equipment-training','attr_gru_autocarro','Portata della gru','gp04-portata-gru.svg'],
  ['equipment-training','attr_trattori','Trattori agricoli','idea-inspection-flow.svg'],
  ['role-safety','rspp_aspp','Ruoli e responsabilità','idea-safety-system.svg'],
  ['first-aid','primo_soccorso_12h','Valutazione della scena','gp04-scena-soccorso.svg'],
  ['confined-space','spazi_confinati','Emergenza in ambienti confinati','idea-risk-cycle.svg'],
 ];
 for(const [visual,id,title,expected] of cases){
  for(let i=0;i<3;i++){
   const asset=api.resolve({visual,title}, {id},i);
   assert.ok(catalog.includes(asset.src),id+' '+visual+' '+i);
   assert.equal(existsSync(new URL('../apps/training/'+asset.src,import.meta.url)),true,asset.src);
  }
  assert.match(api.resolve({visual,title},{id}).src,new RegExp(expected.replaceAll('.','\\.')));
 }
});
test('authored images remain preferred and invalid local references cannot escape known asset catalog',()=>{
 const course={id:'attr_carroponte_all_11h'};
 const good=api.resolve({visual:'equipment-training',idea_images:[{file:'idea-risk-cycle.svg',caption:'Immagine originale'}]},course);
 assert.equal(good.src,'assets/idea-risk-cycle.svg');
 assert.equal(good.caption,'Immagine originale');
 const bad=api.resolve({visual:'equipment-training',idea_images:[{file:'missing.svg'},{file:'../../forbidden.svg'}]},course);
 assert.equal(bad.src,'assets/gp04-baricentro-sollevamento.svg');
 assert.equal(api.normalize('assets/equipment-training.svg'),'');
 assert.equal(api.normalize('../../confidential.pdf'),'');
 assert.equal(api.available('general.svg'),true);
});
test('only local presentation pictures receive a marked fallback; print keeps strict preflight',()=>{
 const build=(src,isPrint=false)=>{
  const attrs={src},calls=[];
  return {dataset:{},calls,attrs,getAttribute(k){return attrs[k]},
   setAttribute(k,v){attrs[k]=v},set src(v){attrs.src=v},get src(){return attrs.src},
   closest(){return isPrint?{}:null;},set alt(v){attrs.alt=v},set title(v){attrs.title=v}};
 };
 const broken=build('assets/missing.svg');
 assert.equal(api.recoverBrokenLocalImage(broken),true);
 assert.equal(broken.src,'assets/general.svg');
 assert.equal(broken.dataset.assetRepair,'1');
 assert.equal(api.recoverBrokenLocalImage(broken),false);
 assert.equal(api.recoverBrokenLocalImage(build('assets/missing.svg',true)),false);
 assert.equal(api.recoverBrokenLocalImage(build('https://example.com/private.jpg')),false);
 assert.equal(api.recoverBrokenLocalImage(build('assets/general.svg')),false);
});
test('presentation and topic details resolve visual identifiers centrally',()=>{
 const app=read('apps/training/app.js');
 for(const call of ["SAFETY_LOCAL_VISUALS_V32?.resolve?.(t,c,slot)","getTopicImage(t,c)","topicSecondImage(t,c)","topicThirdImage(t,c)","getTopicImage(t,c);"])
  assert.ok(app.includes(call),call);
 assert.doesNotMatch(app,/src="assets\/\$\{visual\}\.svg"/);
 assert.doesNotMatch(app,/src:\`assets\/\$\{t\.visual\|\|'general'\}\.svg\`/);
 const index=read('apps/training/index.html');
 assert.ok(index.indexOf('visual-asset-guard-v32.js')<index.indexOf('app.js'));
 const sw=read('apps/training/sw.js');
 assert.match(sw,/visual-asset-guard-v32\.js/);
 const resilience=read('apps/training/media-resilience-v3.js');
 assert.match(resilience,/recoverBrokenLocalImage/);
});
