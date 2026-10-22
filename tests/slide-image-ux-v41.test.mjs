import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('editor retains owner-only authorization and the canonical RPC used by slide and print',async()=>{
 const s=read('apps/training/slide-image-editor-v33.js');
 const win={SAFETY_CLOUD:{state:{user:null,client:null}},addEventListener(){}};
 runInNewContext(s,{window:win,document:{},console});
 assert.equal(win.SAFETY_SLIDE_IMAGE_EDITOR_V33.canEdit(),false);
 assert.equal(await win.SAFETY_SLIDE_IMAGE_EDITOR_V33.authenticate(),false);
 for(const token of ['can_edit_slide_images_v33','read_slide_images_v33','save_slide_images_v33','slide.uid',
  'training_integral_pdf_reviews_v25',"'cleared_internal'",'training_image_exclusions_v26','temporaryPrivateUrls.clear()'])
  assert.ok(s.includes(token),token);
});
test('better image picker includes clear selection modes, topical search, preview and captions',()=>{
 const s=read('apps/training/slide-image-editor-v33.js');
 for(const token of ['slideEditSearch','slideEditCategory','data-library-tab="local"','data-library-tab="private"',
  'matchScore','familyOf','slideEditPreviewImages','data-caption','data-move','data-remove','data-reset','data-save',
  'Sostituisci immagine principale','Aggiungi alla galleria','maxlength="180"','max 3',
  'AbortController','modalKeyAbort?.abort()','document.dispatchEvent(new Event('])
  assert.ok(s.includes(token),token);
 assert.match(s,/rows\.set\(slide\.uid,payload\)/);
 assert.match(s,/refreshProjected\(c,index\)/);
});
test('topic relevance does not treat all graphic packs as suggestions',()=>{
 const s=read('apps/training/slide-image-editor-v33.js');
 const fragment=s.slice(s.indexOf('const labelFor='),s.indexOf('async function open('));
 assert.ok(fragment);
 const helpers=new Function('const esc='+esc.toString()+';\n'+fragment+'\nreturn {matchScore,familyOf,labelFor};')();
 assert.ok(helpers.matchScore('assets/gp03-dpi-guanti.svg','Guanti di protezione')>helpers.matchScore('assets/gp03-rumore.svg','Guanti di protezione'));
 assert.equal(helpers.familyOf('assets/gp01-segnali-divieto.svg'),'segnaletica');
 assert.equal(helpers.familyOf('assets/gp01-dpi-casco.svg'),'dpi');
 assert.ok(helpers.labelFor('assets/gp03-risk-elettrico.svg').includes('risk elettrico'));
});
test('screen and PDF slideshow both carry each individual gallery caption',()=>{
 const app=read('apps/training/app.js');
 const fragment=app.slice(app.indexOf('function slideVisualFigure('),app.indexOf('function deckSlideBody('));
 const slideFigure=new Function('const esc='+esc.toString()+';\n'+fragment+'\nreturn slideVisualFigure;')();
 const s={img:{src:'assets/a.svg',caption:'Principale'},visualGallery:[
  {src:'assets/b.svg',caption:'Controllo DPI'},{src:'assets/c.svg',caption:'Segnaletica obbligatoria'}]};
 const markup=slideFigure(s,'Test');
 for(const text of ['Principale','Controllo DPI','Segnaletica obbligatoria','st-slide-images','st-slide-figure'])assert.ok(markup.includes(text),text);
 assert.equal((markup.match(/<img/g)||[]).length,3);
 assert.ok(!slideFigure({img:{src:'assets/a.svg',caption:'<script>x</script>'}},'Test').includes('<script>'));
 const print=read('apps/training/admin-print-slides-v23.js');
 assert.ok(print.includes('SAFETY_DECK_RENDER')||print.includes('deckRenderer'));
});
test('visual theme applies consistent composition in presentation and printed slides',()=>{
 const css=read('apps/training/slide-visual-design-v41.css');
 const html=read('apps/training/index.html');
 const sw=read('apps/training/sw.js');
 assert.ok(css.includes('.st-slide-figure-caption'));
 assert.ok(css.includes('.slide-print-projector'));
 assert.ok(css.includes('object-fit:contain'));
 assert.ok(html.includes('slide-visual-design-v41.css'));
 assert.ok(sw.includes('slide-visual-design-v41.css'));
 assert.match(sw,/const CACHE='safety-training-[^']+'/);
});
