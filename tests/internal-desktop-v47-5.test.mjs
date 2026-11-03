import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const actions=read('apps/training/internal-deck-actions-v47-5.js');
const html=read('apps/training/interno.html');
const player=read('apps/training/internal-player-v47.js');
const css=read('apps/training/internal-slide-v47-3.css');
const original=read('apps/training/internal-original-deck-v47-3.js');
const main=read('apps/training/app.js');

test('desktop viewer retains exact original slides, personal link and strict script CSP',()=>{
 const start=main.indexOf('function fmtMin(m){');
 const end=main.indexOf('// Cache one compiled presentation',start);
 assert.ok(start>=0&&end>start+10000);
 assert.ok(original.includes(main.slice(start,end).trim()),'slide renderer has not been changed');
 assert.match(player,/SAFETY_DECK_RENDER\.deckSlideBody\(s,i\)/);
 assert.match(player,/request\('slide',fields\)/);
 assert.match(player,/parseToken\(\)/);
 assert.ok(html.includes("script-src 'self'"));
 assert.ok(!html.includes("script-src 'self' 'unsafe-inline'"));
 assert.ok(html.includes('internal-deck-actions-v47-5.js'));
 assert.ok(!html.includes('access-gate-v46-10.js'));
});

test('CSP-safe controls activate original quiz answers, videos and close buttons without evaluating inline JS',()=>{
 let listener=null;
 const calls=[];
 const document={addEventListener:(event,fn,capture)=>{
  if(event==='click'){listener=fn;assert.equal(capture,true);}
 }};
 const window={
  openDeckAnswer:n=>calls.push(['answer',n]),
  openDeckVideo:n=>calls.push(['video',n]),
  closeAnswerOverlay:()=>calls.push(['closeAnswer']),
  closeVideoPlayer:()=>calls.push(['closeVideo']),
  SAFETY_INTERNAL_SLIDE_V47_3:{resume:()=>calls.push(['resume'])}
 };
 runInNewContext(actions,{document,window});
 assert.equal(typeof listener,'function');
 function click(action,inside=true){
  let attribute=action;
  const button={
   getAttribute:name=>name==='onclick'?attribute:null,
   removeAttribute:name=>{if(name==='onclick')attribute=null;},
   closest:selector=>selector==='button[onclick]'?button:(inside?{id:'internalApp'}:null)
  };
  let canceled=false,stopped=false;
  const event={target:{closest:selector=>selector==='button[onclick]'?button:null},
   preventDefault:()=>{canceled=true;},stopPropagation:()=>{stopped=true;}};
  listener(event);
  return {canceled,stopped,attribute};
 }
 for(const [action,expected] of [
  ['openDeckAnswer(5)',['answer',5]],
  ['openDeckVideo(8)',['video',8]],
  ['closeAnswerOverlay()',['closeAnswer']],
  ['closeVideoPlayer()',['closeVideo']],
  ["resumeCourseDeck('internal-assigned-course')",['resume']]
 ]){
  const before=calls.length;
  const result=click(action);
  assert.deepEqual(calls[before],expected);
  assert.equal(result.attribute,null);
  assert.ok(result.canceled&&result.stopped);
 }
 const count=calls.length;
 const unknown=click("alert('bad')");
 assert.equal(calls.length,count,'never run arbitrary inline JS');
 assert.equal(unknown.canceled,false);
 click('openDeckAnswer(1)',false);
 assert.equal(calls.length,count,'never act on buttons outside the reader');
});

test('desktop projector remains centered in common Windows and Mac window sizes and at high zoom',()=>{
 const pad=12;
 // Stage dimensions (CSS px) after the 48px header, 56px footer and 6px progress bar.
 for(const [w,windowHeight] of [
  [1920,1080],[2560,1440],[1440,900],[1366,768],[1280,720],
  [1024,768],[900,650],[800,600],[720,520],
  [640,450],[440,340],[320,240],[220,180],[150,180]
 ]){
  const h=windowHeight-110;
  const scale=Math.min(Math.max(.04,(w-2*pad)/1600),Math.max(.04,(h-2*pad)/900));
  const width=1600*scale,height=900*scale;
  assert.ok((w-width)/2>=-0.01,'horizontal clipped at '+w+'x'+windowHeight);
  assert.ok((h-height)/2>=-0.01,'vertical clipped at '+w+'x'+windowHeight);
  assert.ok(width>0&&height>0,'nonzero projector');
 }
 assert.match(css,/#internalApp \.deck-stage > \.projector-slide\s*\{[^}]*position:absolute!important/s);
 assert.match(player,/translate\(-50%, -50%\) scale\(/);
 assert.match(player,/Math\.max\(\.04,\(w-pad\*2\)\/1600\)/);
 assert.match(player,/stageResizeObserver\.observe\(stage\)/);
 assert.match(player,/window\.visualViewport\?\.addEventListener/);
});

test('Windows and Mac navigation works with buttons, keyboard, index and standard or Safari fullscreen API',()=>{
 for(const text of ["id=\"ipNext\"","id=\"ipPrev\"","id=\"ipIndex\"","id=\"ipHome\"","id=\"ipFullscreen\""])
  assert.ok(player.includes(text),'missing control '+text);
 assert.match(player,/panel\.querySelectorAll\('\[data-slide\]'\)/);
 assert.match(player,/\['ArrowRight','PageDown',' '\]/);
 assert.match(player,/\['ArrowLeft','PageUp'\]/);
 assert.match(player,/document\.fullscreenElement\|\|document\.webkitFullscreenElement/);
 assert.match(player,/element\.requestFullscreen\|\|element\.webkitRequestFullscreen/);
 assert.match(player,/document\.exitFullscreen\|\|document\.webkitExitFullscreen/);
 assert.match(css,/@media\(min-width:681px\) and \(max-width:1024px\)/);
 assert.match(css,/#internalApp \.deck-footer > \*\{min-width:0\}/);
});
