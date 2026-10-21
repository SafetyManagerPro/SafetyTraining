/* SafetyTraining v32: local illustration catalog and evidence-safe presentation resolver.
 * Only existing, bundled images are selectable. Source PDF permissions are independent. */
(()=>{'use strict';
const AVAILABLE=new Set(["assets/gp03-gerarchia-prevenzione.svg","assets/gp03-matrice-rischio.svg","assets/gp03-near-miss.svg","assets/gp03-isolamento-elettrico.svg","assets/gp03-caduta-livello.svg","assets/gp03-movimentazione-carichi.svg","assets/gp03-postazione-vdt.svg","assets/gp03-rumore-esposizione.svg","assets/gp03-aspirazione-polveri.svg","assets/gp03-microclima-calore.svg","assets/gp03-scheda-sicurezza-chimica.svg","assets/gp03-rischi-interferenziali.svg","assets/gp04-casco-dpi.svg","assets/gp04-visiera-dpi.svg","assets/gp04-respiratore-dpi.svg","assets/gp04-guanti-dpi.svg","assets/gp04-udito-dpi.svg","assets/gp04-calzature-dpi.svg","assets/gp04-divieto-segnali.svg","assets/gp04-obbligo-segnali.svg","assets/gp04-avvertimento-segnali.svg","assets/gp04-esodo-segnali.svg","assets/gp04-preuso-carrelli.svg","assets/gp04-baricentro-carrelli.svg","assets/gp04-pedoni-carrelli.svg","assets/gp04-visuale-carrelli.svg","assets/gp04-pendenza-carrelli.svg","assets/gp04-parcheggio-carrelli.svg","assets/gp04-controlli-ple.svg","assets/gp04-stabilita-ple.svg","assets/gp04-ostacoli-ple.svg","assets/gp04-elettrico-ple.svg","assets/gp04-vento-ple.svg","assets/gp04-recupero-ple.svg","assets/gp04-stabilizzatori-gru.svg","assets/gp04-portata-gru.svg","assets/gp04-brache-gru.svg","assets/gp04-sospeso-gru.svg","assets/gp04-segnalatore-gru.svg","assets/gp04-elettrico-gru.svg","assets/gp04-preuso-mmt.svg","assets/gp04-sottoservizi-mmt.svg","assets/gp04-scarpate-mmt.svg","assets/gp04-raggio-mmt.svg","assets/gp04-retromarcia-mmt.svg","assets/gp04-riparo-macchina.svg","assets/gp04-rotanti-macchina.svg","assets/gp04-energia-macchina.svg","assets/gp04-utensili-macchina.svg","assets/gp04-anomalia-macchina.svg","assets/gp04-allarme-fire.svg","assets/gp04-uscita-fire.svg","assets/gp04-fumo-fire.svg","assets/gp04-innesco-fire.svg","assets/gp04-presidi-fire.svg","assets/gp04-scena-soccorso.svg","assets/gp04-chiamata-soccorso.svg","assets/gp04-presidi-soccorso.svg","assets/gp04-arrivo-soccorso.svg","assets/gp04-parapetti-quota.svg","assets/gp04-aperture-quota.svg","assets/gp04-ancoraggio-quota.svg","assets/gp04-recupero-quota.svg","assets/gp04-brache-sollevamento.svg","assets/gp04-baricentro-sollevamento.svg","assets/gp04-perimetro-sollevamento.svg","assets/general.svg","assets/gp02-ppe-helmet-check.svg","assets/gp02-ppe-harness-check.svg","assets/gp02-ppe-respirator-fit.svg","assets/gp02-ppe-gloves-rotation.svg","assets/gp02-signs-ban-mandate.svg","assets/gp02-signs-warning-rescue.svg","assets/gp02-exit-obstructed.svg","assets/gp02-fire-extinguisher-identify.svg","assets/gp02-collective-barriers.svg","assets/gp02-machine-pinch-guard.svg","assets/gp02-pedestrian-separated.svg","assets/gp02-chemical-labels.svg","assets/gp02-checklist-dpi.svg","assets/gp02-emergency-alert.svg","assets/gp02-lifting-suspended-load.svg","assets/gp02-first-aid-safety.svg","assets/gp02-forklift-preuse.svg","assets/gp02-forklift-blindspot.svg","assets/gp02-forklift-pedestrians.svg","assets/gp02-forklift-load.svg","assets/gp02-forklift-forks.svg","assets/gp02-forklift-ramp.svg","assets/gp02-forklift-battery.svg","assets/gp02-forklift-park.svg","assets/gp02-ple-preuse.svg","assets/gp02-ple-stabilizers.svg","assets/gp02-ple-overhead-pinch.svg","assets/gp02-ple-power-lines.svg","assets/gp02-ple-weather.svg","assets/gp02-ple-harness.svg","assets/gp02-ple-emergency.svg","assets/gp02-ple-exclusion.svg","assets/gp02-crane-preuse.svg","assets/gp02-crane-outriggers.svg","assets/gp02-crane-suspended.svg","assets/gp02-crane-swing.svg","assets/gp02-crane-signaller.svg","assets/gp02-crane-crushing.svg","assets/gp02-crane-electric.svg","assets/gp02-crane-capacity.svg","assets/gp02-mmt-preuse.svg","assets/gp02-mmt-three-points.svg","assets/gp02-mmt-swing-zone.svg","assets/gp02-mmt-excavation-edge.svg","assets/gp02-mmt-slope.svg","assets/gp02-mmt-underground.svg","assets/gp02-mmt-maintenance.svg","assets/gp02-mmt-reversing.svg","assets/gp01-dpi-casco.svg","assets/gp01-dpi-occhiali.svg","assets/gp01-dpi-guanti.svg","assets/gp01-dpi-scarpe.svg","assets/gp01-dpi-udito.svg","assets/gp01-dpi-respiratore.svg","assets/gp01-dpi-imbracatura.svg","assets/gp01-dpi-vs-dpc.svg","assets/gp01-segnali-famiglie.svg","assets/gp01-segnali-colori.svg","assets/gp01-segnali-divieto.svg","assets/gp01-segnali-obbligo.svg","assets/gp01-segnali-avvertimento.svg","assets/gp01-segnali-emergenza.svg","assets/gp01-rischio-caduta.svg","assets/gp01-rischio-schiacciamento.svg","assets/gp01-rischio-investimento.svg","assets/gp01-rischio-ribaltamento.svg","assets/gp01-procedura-preuso.svg","assets/gp01-procedura-emergenza.svg","assets/risk.svg","assets/roles.svg","assets/rights.svg","assets/conflict.svg","assets/office.svg","assets/road.svg","assets/bio.svg","assets/green.svg","assets/fire.svg","assets/emergency.svg","assets/cna-avellino.png","assets/scene-antincendio.svg","assets/scene-backoffice.svg","assets/scene-ecologici.svg","assets/scene-frontoffice.svg","assets/scene-generale.svg","assets/scene-polizia.svg","assets/scene-rls.svg","assets/scene-verde.svg","assets/scenario-critical.svg","assets/idea-risk-cycle.svg","assets/idea-vdt-ergonomia.svg","assets/idea-aggression-flow.svg","assets/idea-road-safety.svg","assets/idea-bio-chain.svg","assets/idea-fire-response.svg","assets/idea-green-safearea.svg","assets/idea-rls-cycle.svg","assets/idea-dpi-hierarchy.svg","assets/idea-emergency-steps.svg","assets/idea-signs-basic.svg","assets/idea-front-layout.svg","assets/idea-evac-public.svg","assets/idea-archive-safe.svg","assets/idea-ladder-safe.svg","assets/idea-compactor-safe.svg","assets/idea-sharps-safe.svg","assets/idea-hygiene-clean-dirty.svg","assets/idea-heat-stress.svg","assets/idea-chainsaw-safe.svg","assets/idea-working-height-safe.svg","assets/idea-safety-system.svg","assets/idea-inspection-flow.svg","assets/idea-sanctions-logic.svg","assets/idea-police-road.svg","assets/idea-police-conflict.svg","assets/idea-police-night.svg","assets/idea-fire-triangle.svg","assets/idea-fire-passive.svg","assets/idea-fire-practice.svg","assets/idea-rls-consult.svg","assets/idea-dvr-reading.svg","assets/idea-duvri.svg","assets/video-risky-business.svg","assets/video-violence.svg","assets/video-safe-moves.svg","assets/video-fire-alert.svg","assets/video-lighten-load.svg","assets/video-work-height.svg","assets/video-stop-noise.svg","assets/video-chemicals.svg","assets/organigramma-sicurezza.svg","assets/piramide-pericoli.svg","assets/modello-farfalla-rischio.svg","assets/procedura-operativa-5-fasi.svg","assets/stop-segnala-ripristina.svg"]);
const normalize=value=>{
 const raw=String(value||'').trim().replace(/^\.\/|^\/+/, '');
 const src=raw.startsWith('assets/')?raw:'assets/'+raw;
 if(!/^assets\/[a-z0-9][a-z0-9_.-]*\.(svg|png|webp|jpe?g)$/i.test(src))return '';
 return AVAILABLE.has(src)?src:'';
};
const pair=(file,caption)=>({src:'assets/'+file,caption});
const FALLBACKS={
 'role-safety':[
   pair('idea-safety-system.svg','Schema del sistema di prevenzione aziendale'),
   pair('organigramma-sicurezza.svg','Ruoli e responsabilità della sicurezza'),
   pair('idea-inspection-flow.svg','Percorso di controllo e verifica')],
 'first-aid':[
   pair('gp04-scena-soccorso.svg','Sicurezza della scena e primo intervento'),
   pair('gp04-chiamata-soccorso.svg','Allertamento dei soccorsi'),
   pair('gp04-presidi-soccorso.svg','Presidi di primo soccorso')],
 'confined-space':[
   pair('idea-risk-cycle.svg','Identificazione e valutazione dei rischi'),
   pair('stop-segnala-ripristina.svg','Fermarsi, segnalare e rivalutare'),
   pair('idea-inspection-flow.svg','Verifiche preliminari e autorizzazioni')],
 general:[
   pair('general.svg','Schema generale di prevenzione'),
   pair('idea-risk-cycle.svg','Valutazione e gestione dei rischi'),
   pair('procedura-operativa-5-fasi.svg','Procedura operativa in sicurezza')]
};
const EQUIPMENT={
 carroponte:[
  pair('gp04-baricentro-sollevamento.svg','Baricentro e stabilità del carico sospeso'),
  pair('gp04-brache-sollevamento.svg','Imbracatura e accessori di sollevamento'),
  pair('gp04-perimetro-sollevamento.svg','Delimitazione della zona di sollevamento')],
 carrelli:[
  pair('gp04-baricentro-carrelli.svg','Baricentro e stabilità del carrello'),
  pair('gp04-preuso-carrelli.svg','Controlli prima dell’utilizzo del carrello'),
  pair('gp04-pedoni-carrelli.svg','Separazione dei pedoni dal mezzo')],
 ple:[
  pair('gp04-stabilita-ple.svg','Stabilità della piattaforma elevabile'),
  pair('gp04-controlli-ple.svg','Controlli preuso della PLE'),
  pair('gp04-ostacoli-ple.svg','Ostacoli e interferenze in quota')],
 gru:[
  pair('gp04-portata-gru.svg','Portata e limiti del sollevamento'),
  pair('gp04-brache-gru.svg','Accessori e imbracatura del carico'),
  pair('gp04-segnalatore-gru.svg','Segnalazioni e manovre coordinate')],
 mmt:[
  pair('gp04-scarpate-mmt.svg','Bordi degli scavi e stabilità dei mezzi'),
  pair('gp04-preuso-mmt.svg','Controlli preuso delle macchine movimento terra'),
  pair('gp04-raggio-mmt.svg','Raggio d’azione e zone di pericolo')],
 other:[
  pair('idea-inspection-flow.svg','Controlli e verifiche prima dell’uso'),
  pair('procedura-operativa-5-fasi.svg','Procedura operativa in sicurezza'),
  pair('stop-segnala-ripristina.svg','Gestione delle anomalie in sicurezza')]
};
function equipmentFamily(course,topic){
 const scope=String(course?.id||'')+' '+String(course?.title||'')+' '+
  String(topic?.title||'')+' '+String(topic?.source_stable_key||'');
 if(/carroponte|cavalletto|bridge.?crane/i.test(scope))return 'carroponte';
 if(/carrell|mulett|forklift/i.test(scope))return 'carrelli';
 if(/\bple\b|piattaforme? elevabil/i.test(scope))return 'ple';
 if(/gru|autocarro|torre/i.test(scope))return 'gru';
 if(/escavat|movimento terra|\bmmt\b|pale|terne/i.test(scope))return 'mmt';
 return 'other';
}
function candidates(topic,course){
 const visual=String(topic?.visual||'').trim();
 if(visual==='equipment-training')return EQUIPMENT[equipmentFamily(course,topic)];
 if(FALLBACKS[visual])return FALLBACKS[visual];
 const exact=normalize(visual.endsWith('.svg')?visual:visual+'.svg');
 if(exact)return [{src:exact,caption:'Schema visuale del tema'}];
 return FALLBACKS.general;
}
function resolve(topic,course,slot=0){
 const source=Array.isArray(topic?.idea_images)?topic.idea_images:[];
 const authored=source.map(x=>{
   const f=typeof x==='string'?x:(x?.file||x?.src||x?.image);
   const src=normalize(f);
   return src?{src,caption:String(x?.caption||'Schema didattico originale')}:null;
 }).filter(Boolean);
 if(authored[slot])return authored[slot];
 if(authored.length&&slot===0)return authored[0];
 const group=candidates(topic,course);
 const good=group.filter(x=>normalize(x.src));
 return good[Math.max(0,Number(slot)||0)%good.length]||FALLBACKS.general[0];
}
function recoverBrokenLocalImage(img){
 if(!img||img.dataset?.assetRepair==='1')return false;
 const src=img.getAttribute?.('src')||'';
 if(!/^(\.\/)?assets\/[a-z0-9_.-]+\.(svg|png|webp|jpe?g)(?:\?.*)?$/i.test(src))return false;
 // For actual print previews, the existing image preflight must signal failures.
 if(img.closest?.('#adminPrintableSlides,#adminPrintableLessons,#safetyPrintStage'))return false;
 const fallback='assets/general.svg';
 if(src.replace(/^\.\//,'').split('?')[0]===fallback)return false;
 img.dataset.assetRepair='1';
 img.setAttribute('data-original-broken-src',src);
 img.src=fallback;
 img.alt='Schema generale di prevenzione — immagine originale da verificare';
 img.title='Immagine originale non caricata: utilizzato uno schema generale, da verificare';
 return true;
}
window.SAFETY_LOCAL_VISUALS_V32={resolve,normalize,available:src=>!!normalize(src),recoverBrokenLocalImage,catalog:[...AVAILABLE].sort()};
})();