const CACHE='safety-training-v22-33';
const ASSETS=["./","./index.html","./styles.css","./responsive-v2.css","./sidebar-course-groups.css","./presentation-quality.css","./course-experience-v22.css","./mobile-reader-v3.css","./cloud.css","./cloud-v20.js","./completion-gates-learner-v20.js","./final-test-v20.js","./final-test-v20.css","./db-slide-adapter.js","./db-media-compat-v20.js","./presentation-enrichment-v3.js","./presentation-quality-ui.js","./admin.css","./admin-responsive-v21.css","./admin-list-tools-v21.css","./admin.js","./admin-help-v22.js","./admin-help-v22.css","./admin-delete-planner-v22.js","./admin-delete-planner-v22.css","./admin-guided-flow-v22.js","./admin-guided-flow-v22.css","./admin-registry-dedup-v21.js","./admin-backend-v21.js","./admin-details-v21.js","./requirement-evidence-admin-v21.js","./practice-forms-v22.js","./modal-access-v22.js","./admin-capabilities-v21.js","./admin-ux-v21.js","./admin-memberships-v21.js","./admin-access-import-v21.js","./course-catalog.js","./course-catalog-governance-v21.js","./blueprint-admin.js","./course-readiness-admin.js","./didactic-review-candidates-v23.js","./course-quality-v22.js","./admin-guidance-v21.js","./admin-path-audit-v23.js","./admin-path-audit-v23.css","./admin-print-lessons-v23.js","./admin-print-lessons-v23.css","./normative-sanctions-v23.js","./normative-sanctions-v23.css","./admin-list-tools-v21.js","./integration-import.js","./learner.css","./learner-navigation-v22.js","./learner-dashboard.js","./learner-invite-activation-v21.js","./learner-onboarding-v20.js","./learner-access-guard-v20.js","./app.js","./course-experience-v22.js","./home-v2.js","./catalog-browser.js","./sidebar-course-groups.js","./media-resilience-v3.js","./data.js","./didactic-general-v2.js","./didactic-preposto-v2.js","./didactic-dirigente-v2.js","./didactic-datore-v2.js","./didactic-dl-rspp-v2.js","./didactic-dl-rspp-sector-v2.js","./didactic-rspp-aspp-v2.js","./didactic-agg-datore-v2.js","./didactic-agg-dl-rspp-v2.js","./didactic-cantieri-v2.js","./dpi.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./assets/general.svg","./assets/risk.svg","./assets/roles.svg","./assets/rights.svg","./assets/conflict.svg","./assets/office.svg","./assets/road.svg","./assets/bio.svg","./assets/green.svg","./assets/fire.svg","./assets/emergency.svg","./assets/cna-avellino.png","./assets/scene-antincendio.svg","./assets/scene-backoffice.svg","./assets/scene-ecologici.svg","./assets/scene-frontoffice.svg","./assets/scene-generale.svg","./assets/scene-polizia.svg","./assets/scene-rls.svg","./assets/scene-verde.svg","./assets/scenario-critical.svg","./assets/idea-risk-cycle.svg","./assets/idea-vdt-ergonomia.svg","./assets/idea-aggression-flow.svg","./assets/idea-road-safety.svg","./assets/idea-bio-chain.svg","./assets/idea-fire-response.svg","./assets/idea-green-safearea.svg","./assets/idea-rls-cycle.svg","./assets/idea-dpi-hierarchy.svg","./assets/idea-emergency-steps.svg","./assets/idea-signs-basic.svg","./assets/idea-front-layout.svg","./assets/idea-evac-public.svg","./assets/idea-archive-safe.svg","./assets/idea-ladder-safe.svg","./assets/idea-compactor-safe.svg","./assets/idea-sharps-safe.svg","./assets/idea-hygiene-clean-dirty.svg","./assets/idea-heat-stress.svg","./assets/idea-chainsaw-safe.svg","./assets/idea-working-height-safe.svg","./assets/idea-safety-system.svg","./assets/idea-inspection-flow.svg","./assets/idea-sanctions-logic.svg","./assets/idea-police-road.svg","./assets/idea-police-conflict.svg","./assets/idea-police-night.svg","./assets/idea-fire-triangle.svg","./assets/idea-fire-passive.svg","./assets/idea-fire-practice.svg","./assets/idea-rls-consult.svg","./assets/idea-dvr-reading.svg","./assets/idea-duvri.svg","./assets/video-risky-business.svg","./assets/video-violence.svg","./assets/video-safe-moves.svg","./assets/video-fire-alert.svg","./assets/video-lighten-load.svg","./assets/video-work-height.svg","./assets/video-stop-noise.svg","./assets/video-chemicals.svg","./assets/organigramma-sicurezza.svg","./assets/piramide-pericoli.svg","./assets/modello-farfalla-rischio.svg","./assets/procedura-operativa-5-fasi.svg","./assets/stop-segnala-ripristina.svg"];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(ASSETS.map(async asset=>{
    const request=new Request(asset,{credentials:'same-origin',cache:'reload'});
    const response=await fetch(request);
    if(response.ok&&response.type==='basic')await cache.put(request,response);
  }));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  // Let the browser own navigations so Vercel Authentication/SSO redirects are not
  // converted into cross-origin fetch failures inside the service worker.
  if(event.request.mode==='navigate')return;
  const networkFirst=/\.(?:js|css|html|webmanifest)$/.test(url.pathname);
  if(networkFirst){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request);
        if(response.ok&&response.type==='basic'){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      }catch(error){
        return (await caches.match(event.request))||new Response('',{status:503,statusText:'Offline'});
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response.ok&&response.type==='basic'){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
      }
      return response;
    }catch(error){
      return new Response('',{status:503,statusText:'Offline'});
    }
  })());
});
