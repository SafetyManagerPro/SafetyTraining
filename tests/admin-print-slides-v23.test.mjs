import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const doc={readyState:'loading',addEventListener(){}};
const ctx={window:{addEventListener(){}},document:doc,setTimeout,URL};
runInNewContext(read('apps/training/admin-print-slides-v23.js'),ctx);
const printer=ctx.window.SAFETY_ADMIN_PRINT_SLIDES_V23;
const mk=(type,n)=>({type,moduleIndex:0,title:'Slide '+n, img:{src:'assets/idea-risk-cycle.svg'},module:{title:'Modulo'}});
test('two genuine projector slides are placed on every A4 sheet',()=>{
 const list=Array.from({length:5},(_,i)=>mk('concept',i+1));
 const sheets=printer.sheetData(list);
 assert.equal(sheets.length,3);
 assert.deepEqual(Array.from(sheets,s=>s.length),[2,2,1]);
 const html=printer.createSheets({title:'Percorso'}, {version_number:2},list,
   (s,i)=>'<h1>'+s.title+'</h1><img src="'+s.img.src+'">');
 assert.equal((html.match(/class="slide-print-sheet"/g)||[]).length,3);
 assert.equal((html.match(/class="projector-slide type-concept slide-print-projector"/g)||[]).length,5);
 assert.match(html,/Slide 5 \/ 5/);
 assert.match(html,/assets\/idea-risk-cycle.svg/);
 assert.match(html,/Non è attestato/);
});
test('source media must be local and cannot contain traversal or external URLs',()=>{
 assert.equal(printer.safeSlideImage('assets/scene-rls.svg'),'assets/scene-rls.svg');
 assert.equal(printer.safeSlideImage('./assets/general.svg'),'assets/general.svg');
 for(const bad of ['https://example.org/a.svg','javascript:alert(1)','../assets/general.svg','assets/../../secret.png','assets/x.svg" onclick="alert(1)']){
   assert.equal(printer.safeSlideImage(bad),null);
 }
 assert.throws(()=>printer.createSheets({title:'Course'},{version_number:1},[{
   type:'concept',moduleIndex:0,title:'Unsafe',img:{src:'https://evil.example/x.svg'}
 }],()=>'<h1>unsafe</h1>'),/Immagine.*non ammessa/);
});
test('unreasonably huge deck refuses to truncate silently',()=>{
 assert.throws(()=>printer.sheetData(Array.from({length:701},(_,i)=>i)),/limite prudenziale/);
 assert.throws(()=>printer.sheetData([]),/non contiene slide/);
});
test('screen projector engine is reused rather than a new synthetic presentation',()=>{
 const js=read('apps/training/admin-print-slides-v23.js');
 const original=read('apps/training/app.js');
 assert.match(js,/projection\.buildDeck\(converted\)/);
 assert.match(js,/projection\.deckSlideBody/);
 assert.match(original,/window\.SAFETY_DECK_RENDER=\{buildDeck,deckSlideBody\}/);
 assert.match(js,/platform_admins/);
 assert.match(js,/SAFETY_ADMIN_PRINT_LESSONS_V23/);
 assert.doesNotMatch(js,/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(/);
});
test('two-up portrait A4 layout is printed in its own body-level stage and never a fixed admin panel',()=>{
 const css=read('apps/training/admin-print-slides-v23.css');
 assert.match(css,/@page\{size:A4 portrait/);
 assert.match(css,/safetySlidePrintStage/);
 assert.match(css,/slide-print-sheet:last-child/);
 assert.match(css,/page-break-inside:avoid/);
 assert.match(css,/background:#fff/);
 assert.match(css,/print-color-adjust:exact/);
 assert.match(css,/projector-slide/);
 assert.doesNotMatch(css,/body\.admin-slides-print #adminShell #adminContent/);
});
test('projector reveal controls are removed while a video poster illustration survives',()=>{
 const dom={
  buttons:[],
  querySelectorAll(query){
   if(query==='.video-poster-button')return this.buttons;
   if(query==='button, input, select, textarea, script, iframe, video, audio')return [];
   if(query==='*')return [];
   return [];
  }
 };
 let replaced=false;
 const btn={querySelector(selector){return selector==='figure'?{}:null;},replaceWith(){replaced=true;}};
 dom.buttons=[btn];
 printer.removeInteraction(dom);
 assert.ok(replaced);
});

test('missing graphic-card image is safely replaced without dropping the projected slide',()=>{
 const html=printer.createSheets({title:'Sicurezza'},
   {version_number:2},[
     {type:'graphic',moduleIndex:0,title:'Schema dei rischi',img:{src:'assets/undefined'}}
   ],(slide)=>'<h1>'+slide.title+'</h1><img src="'+slide.img.src+'">');
 assert.match(html,/Schema dei rischi/);
 assert.match(html,/assets\/general\.svg/);
 assert.doesNotMatch(html,/assets\/undefined/);
});
test('only absent image-key placeholders are recovered, not unsafe URLs',()=>{
 for(const placeholder of ['assets/undefined','assets/null','assets/NaN','assets/']){
  const html=printer.createSheets({title:'Corso'},{version_number:1},
     [{type:'concept',moduleIndex:0,title:'Titolo',img:{src:placeholder}}],
     slide=>'<img src="'+slide.img.src+'">');
  assert.match(html,/assets\/general\.svg/);
 }
 for(const bad of ['assets/undefined.svg','assets/..%2fsecret.svg','https://evil.test/x.svg']){
  assert.throws(()=>printer.createSheets({title:'Corso'},{version_number:1},
    [{type:'concept',moduleIndex:0,title:'Titolo',img:{src:bad}}],
    slide=>'<img src="'+slide.img.src+'">'),/non ammessa/);
 }
});
test('the source deck never constructs an undefined graphic-card visual',()=>{
 const src=read('apps/training/app.js');
 assert.match(src,/const graphicImage=/);
 assert.match(src,/img:graphicImage/);
 assert.doesNotMatch(src,/src:\`assets\/\$\{g\.image\}\`/);
 assert.match(src,/const valid=arr\.find/);
});

test('CLI check workflow runs the print-slide regression tests',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts.check,/node --test tests\/admin-print-slides-v23\.test\.mjs/);
 assert.match(pkg.scripts.check,/node --check apps\/training\/admin-print-slides-v23\.js/);
});
