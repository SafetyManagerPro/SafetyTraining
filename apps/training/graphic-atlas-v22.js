/* Graphic Atlas v22: unified read-only illustration selection for slides, detail pages and A4 handouts.
   Original, local assets only. No course, progress, licensing or version mutations. */
(()=>{'use strict';
const local=/^assets\/[a-zA-Z0-9_-]+\.(?:svg|png|jpe?g|webp)$/i;
const toVisual=(value)=>{
 if(!value||typeof value!=='object')return null;
 let src=String(value.src||value.asset||value.file||value.image||'').trim();
 if(src&&!src.startsWith('assets/'))src='assets/'+src.replace(/^\.\/|^assets\//g,'');
 if(!local.test(src))return null;
 return {src,caption:String(value.caption||value.title||'Schema didattico').slice(0,180)};
};
function collect(course,topic){
 const frozen=window.SAFETY_GRAPHIC_PACK_01?.isFrozen;
 if(typeof frozen!=='function'||!course?.presentation_generated_from_db||!topic?.db_backed||frozen(course))return [];
 // Authored images are preserved; a shallow view-only copy allows supplemental diagrams.
 const probe={...topic,presentation_quality:{...(topic.presentation_quality||{}),visual_mode:'auto-themed'}};
 const picks=[
  ...(window.SAFETY_GRAPHIC_PACK_04?.pick?.(course,topic)||[]),
  ...(window.SAFETY_GRAPHIC_PACK_02?.pick?.(course,probe)||[]),
  ...(window.SAFETY_GRAPHIC_PACK_03?.pick?.(course,probe)||[]),
  ...(window.SAFETY_GRAPHIC_PACK_01?.pick?.(course,probe)||[])
 ];
 const authored=[
  ...Array.isArray(topic.idea_images)?topic.idea_images:[],
  ...Array.isArray(topic.visuals)?topic.visuals:[],
  ...Array.isArray(topic.graphic_cards)?topic.graphic_cards:[]
 ].map(toVisual).filter(Boolean);
 return [...new Map([...picks,...authored].map(toVisual).filter(Boolean).map(x=>[x.src,x])).values()];
}
function distribute(course,topic,slides){
 const list=Array.isArray(slides)?slides:[];
 const images=collect(course,topic);
 if(!images.length)return list;
 // The authored hero, source-specific video and technical procedure images stay unchanged.
 const displayed=new Set(list.filter(s=>['concept','explain','deep','risks','prevention','procedure','graphic','sourceDigest','video','howTo','escalation'].includes(s.type)).map(s=>s.img?.src).filter(Boolean));
 const unplaced=images.filter(x=>!displayed.has(x.src));
 const targets=list.filter(s=>['concept','explain','deep','risks','prevention','procedure'].includes(s.type)&&s.img?.src);
 let i=0;
 // Up to two supplementary drawings alongside the full-size image on each existing slide.
 for(const visual of unplaced){
  if(i>=targets.length*2)break;
  const target=targets[i%targets.length];
  target.visualGallery=[...(target.visualGallery||[]),visual];
  i++;
 }
 // Everything else appears in an atlas continuation, also used by the real two-up A4 print.
 const rest=unplaced.slice(i);
 const out=[...list];
 for(let j=0;j<rest.length;j+=4)out.push({type:'visualAtlas',weight:.7,img:null,title:topic.slide_title||topic.title||'Illustrazioni',visuals:rest.slice(j,j+4),partIndex:j/4});
 return out;
}
window.SAFETY_VISUAL_ATLAS_V22={collect,distribute};
})();