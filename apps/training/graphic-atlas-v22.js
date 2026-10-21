/* Graphic Atlas v22: unified read-only illustration selection for slides, detail pages and A4 handouts.
   Original, local assets only. No course, progress, licensing or version mutations. */
(()=>{'use strict';
const local=/^assets\/[a-zA-Z0-9_-]+\.(?:svg|png|jpe?g|webp)$/i;
// Existing self-contained learning graphics, selected only by lesson subject; never copied from PDFs.
const excludedLocal=new Set();
let exclusionRefresh=null;
async function refreshExcludedLocal(){
 const db=window.SAFETY_CLOUD?.state?.client;
 if(!db||!window.SAFETY_CLOUD?.state?.user?.id)return;
 if(exclusionRefresh)return exclusionRefresh;
 exclusionRefresh=(async()=>{
  const {data,error}=await db.rpc('training_excluded_local_images_v26');
  if(error)return;
  const fresh=new Set(Array.isArray(data)?data:[]);
  const changed=fresh.size!==excludedLocal.size||[...fresh].some(x=>!excludedLocal.has(x));
  excludedLocal.clear();for(const src of fresh)excludedLocal.add(src);
  if(changed)document.dispatchEvent(new Event('safety:image-review-updated'));
 })().finally(()=>{exclusionRefresh=null;});
 return exclusionRefresh;
}
if(typeof document!=='undefined')document.addEventListener('safety:auth-changed',()=>{
 excludedLocal.clear();void refreshExcludedLocal();
});
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void refreshExcludedLocal(),{once:true});
 else void refreshExcludedLocal();
}
const legacyRules=[{"filename":"idea-aggression-flow.svg","pattern":"aggressione|conflitto con utenti|violenza verbale"},{"filename":"idea-archive-safe.svg","pattern":"archiviazione|archivio|scaffalature|deposito documenti"},{"filename":"idea-bio-chain.svg","pattern":"rischio biologico|contaminazione biologica|agenti biologici"},{"filename":"idea-chainsaw-safe.svg","pattern":"motosega|taglio alberi|potatura"},{"filename":"idea-compactor-safe.svg","pattern":"compattatore|compattazione|rifiuti solidi"},{"filename":"idea-dpi-hierarchy.svg","pattern":"gerarchia dei dpi|priorità delle protezioni|dpi e dpc"},{"filename":"idea-duvri.svg","pattern":"duvri|rischi interferenziali|interferenze tra imprese"},{"filename":"idea-dvr-reading.svg","pattern":"documento di valutazione dei rischi|lettura del dvr|dvr"},{"filename":"idea-emergency-steps.svg","pattern":"piano di emergenza|procedure di emergenza|gestione emergenze"},{"filename":"idea-evac-public.svg","pattern":"evacuazione del pubblico|esodo|vie di fuga"},{"filename":"idea-fire-passive.svg","pattern":"compartimentazione|protezione passiva|resistenza al fuoco"},{"filename":"idea-fire-practice.svg","pattern":"prova pratica antincendio|esercitazione con estintore|addestramento antincendio"},{"filename":"idea-fire-response.svg","pattern":"intervento antincendio|principio di incendio|allarme incendio"},{"filename":"idea-fire-triangle.svg","pattern":"triangolo del fuoco|innesco|combustibile"},{"filename":"idea-front-layout.svg","pattern":"front.?office|sportello|accoglienza utenti"},{"filename":"idea-green-safearea.svg","pattern":"verde pubblico|manutenzione verde|giardinaggio"},{"filename":"idea-heat-stress.svg","pattern":"stress termico|microclima|colpo di calore|esposizione al caldo"},{"filename":"idea-hygiene-clean-dirty.svg","pattern":"igiene personale|pulizia e sporco|contaminazione"},{"filename":"idea-inspection-flow.svg","pattern":"vigilanza|ispezione|sopralluogo"},{"filename":"idea-ladder-safe.svg","pattern":"scala portatile|scale a mano|scala a pioli"},{"filename":"idea-police-conflict.svg","pattern":"aggressione|conflitto|sicurezza degli operatori"},{"filename":"idea-police-night.svg","pattern":"lavoro notturno|turno notturno|servizio notturno"},{"filename":"idea-police-road.svg","pattern":"viabilità stradale|polizia locale|controllo del traffico"},{"filename":"idea-risk-cycle.svg","pattern":"valutazione dei rischi|prevenzione del rischio|analisi del rischio"},{"filename":"idea-rls-consult.svg","pattern":"consultazione rls|consultare rls|rappresentante dei lavoratori"},{"filename":"idea-rls-cycle.svg","pattern":"ruolo del rls|elezione rls|funzioni del rls"},{"filename":"idea-road-safety.svg","pattern":"sicurezza stradale|guida sicura|incidente stradale"},{"filename":"idea-safety-system.svg","pattern":"sistema di prevenzione|ruoli della sicurezza|organizzazione sicurezza"},{"filename":"idea-sanctions-logic.svg","pattern":"sanzioni|responsabilità penale|apparato sanzionatorio"},{"filename":"idea-sharps-safe.svg","pattern":"taglienti|aghi|punture accidentali"},{"filename":"idea-signs-basic.svg","pattern":"segnaletica|cartelli di sicurezza|pittogrammi"},{"filename":"idea-vdt-ergonomia.svg","pattern":"videoterminali|postazione vdt|ergonomia"},{"filename":"idea-working-height-safe.svg","pattern":"lavori in quota|caduta dall.alto|anticaduta"},{"filename":"organigramma-sicurezza.svg","pattern":"organigramma|figure della sicurezza|ruoli e responsabilità"},{"filename":"piramide-pericoli.svg","pattern":"piramide dei pericoli|piramide della prevenzione|gerarchia del rischio"},{"filename":"modello-farfalla-rischio.svg","pattern":"modello farfalla|bow.?tie|barriere preventive"}]
 .map(x=>({...x,re:new RegExp(x.pattern,'i')}));
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
 const subject=String(topic.slide_title||topic.title||'')+' '+String(topic.summary||'');
 const legacy=legacyRules.filter(x=>x.re.test(subject)).map(x=>({src:'assets/'+x.filename,caption:x.filename.replace(/^(?:idea-)/,'').replace(/\.svg$/,'').replace(/-/g,' ')}));
 const placed=window.SAFETY_VISUAL_COVERAGE_V23?.forTopic?.(course,topic)||[];
 const privatePdf=window.SAFETY_INTEGRAL_PDF_V24?.pick?.(course,topic)||[];
 const authored=[
  ...Array.isArray(topic.idea_images)?topic.idea_images:[],
  ...Array.isArray(topic.visuals)?topic.visuals:[],
  ...Array.isArray(topic.graphic_cards)?topic.graphic_cards:[]
 ].map(toVisual).filter(Boolean);
 return [...new Map([...picks,...legacy,...placed,...authored].map(toVisual).filter(Boolean).filter(x=>!excludedLocal.has(x.src)).map(x=>[x.src,x])).values(),...privatePdf];
}
function distribute(course,topic,slides){
 const list=Array.isArray(slides)?slides:[];
 const images=collect(course,topic);
 if(!images.length)return list;
 // The authored hero, source-specific video and technical procedure images stay unchanged.
 const displayed=new Set(list.filter(s=>['concept','explain','deep','risks','prevention','procedure','graphic','sourceDigest','video','howTo','escalation'].includes(s.type)).map(s=>s.img?.src).filter(Boolean));
 const unplaced=images.filter(x=>!displayed.has(x.src));
 // Do not pack additional figures next to a lead image: the original 590px
 // image rule overflowed the 2x2 gallery in projector and A4 printing.
 // One figure per atlas slide keeps complete PDF pages legible and uncropped.
 const out=[...list];
 for(let j=0;j<unplaced.length;j++){
  out.push({type:'visualAtlas',weight:.7,img:null,title:topic.slide_title||topic.title||'Illustrazioni',visuals:[unplaced[j]],partIndex:j});
 }
 return out;
}
window.SAFETY_VISUAL_ATLAS_V22={collect,distribute,refreshExcludedLocal};
})();