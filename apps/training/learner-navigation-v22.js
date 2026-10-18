/* SafetyTraining v22.1 — common, testable learner navigation authorization rules.
   These are UX guards; Supabase RLS remains the authoritative access boundary. */
(() => {
  'use strict';
  const routeKinds = new Set(['course','topic','deck','lab','resources']);
  function route(hash) {
    const parts=String(hash||'').replace(/^#/,'').split('/').filter(Boolean);
    let key='';
    if(parts.length>1)try{key=decodeURIComponent(parts[1]);}catch{return {kind:parts[0]||'',key:'',invalid:true};}
    return {kind:parts[0]||'',key,invalid:false};
  }
  function access(a,now=Date.now()) {
    const key=String(a?.courseStableKey||'').trim();
    if(!key)return {usable:false,label:'Percorso in configurazione'};
    if(a.status==='revoked')return {usable:false,label:'Accesso revocato'};
    if(a.availableFrom&&new Date(a.availableFrom).getTime()>now)return {usable:false,label:'Non ancora disponibile'};
    if(a.availableUntil&&new Date(a.availableUntil).getTime()<now)return {usable:false,label:'Periodo di accesso terminato'};
    return {usable:true,label:['completed','passed'].includes(a.status)?'Rivedi percorso':a.status==='in_progress'?'Continua':'Inizia'};
  }
  function assigned(assignments,key,now=Date.now()) {
    return (Array.isArray(assignments)?assignments:[]).find(a=>a?.courseStableKey===key&&access(a,now).usable)||null;
  }
  function allowedRoute(hash,assignments,now=Date.now()) {
    const r=route(hash);
    if(r.invalid||r.kind==='library')return false;
    if(!r.kind)return true;
    if(!routeKinds.has(r.kind))return false;
    return Boolean(r.key&&assigned(assignments,r.key,now));
  }
  window.SAFETY_LEARNER_NAV_V22={route,access,assigned,allowedRoute};
})();
