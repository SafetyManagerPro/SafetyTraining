/* SafetyTraining v46.0 — contextual instructor guide sourced only from existing authored lesson data.
   Read-only presenter aid. No invented safety procedures, no test answers and no learning records. */
(()=>{'use strict';
let panel=null,openedKey='';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(value,max=1400)=>typeof value==='string'?value.trim().slice(0,max):'';
const list=(values,limit=5)=>Array.isArray(values)?values.map(value=>text(value,520)).filter(Boolean).slice(0,limit):[];
const first=(...values)=>values.map(value=>text(value)).find(Boolean)||'';
const active=()=>document.body.classList.contains('deckmode')&&!!window.__deck?.cid&&Array.isArray(window.__deckSlides);
const currentKey=()=>String(window.__deck?.cid)+':'+String(window.__deck?.index);
const visible=()=>!!panel&&!panel.classList.contains('hidden');
function guide(slide,index=0){
 const s=slide&&typeof slide==='object'?slide:{},t=s.topic&&typeof s.topic==='object'?s.topic:{};
 const title=first(s.title,t.title,'Slide '+(index+1)),sections=[];
 const push=(label,content)=>{const value=text(content);if(value)sections.push({label,items:[value]});};
 const pushList=(label,items)=>{const values=list(items);if(values.length)sections.push({label,items:values});};
 if(s.type==='module'){
  push('Presentazione del modulo',s.module?.description);
  pushList('Argomenti del modulo',(s.topics||[]).map(item=>item?.title).filter(Boolean));
 }else{
  push('Obiettivo e messaggio',first(s.summary,s.objective,s.explain,s.paragraph,s.digest?.summary,s.graphic?.text,t.summary));
  push('Nota del docente',t.teacher);
  pushList('Approfondimenti già preparati',t.teacher_expansion?.slice?.(0,3));
  push('Domanda da porre all’aula',first(s.question,s.quiz?.q,t.question));
  push('Esempio o caso operativo',first(s.case,s.story,t.example_story,t.case));
  pushList('Scaletta indicativa dell’argomento',t.teaching_steps);
  const operational=list(s.steps||s.procedure||s.apply||t.guided?.apply||t.operational?.step_by_step||t.procedure,5);
  const observation=list(s.observe||t.guided?.observe,3);
  if(observation.length)sections.push({label:'Cosa osservare con i partecipanti',items:observation});
  if(operational.length)sections.push({label:'Applicazione pratica dai contenuti esistenti',items:operational});
  pushList('Errori da evitare',s.errors||t.common_errors);
 }
 const duration=Number(s.end)-Number(s.start);
 return {title,type:text(s.type,50)||'slide',index,sections,
  module:first(s.module?.title),duration:Number.isFinite(duration)&&duration>0?Math.round(duration*10)/10:null};
}
function markup(info){
 const parts=info.sections.map(section=>'<section class="v46-guide-card"><h3>'+escape(section.label)+'</h3>'+
  (section.items.length===1?'<p>'+escape(section.items[0])+'</p>':'<ul>'+section.items.map(item=>'<li>'+escape(item)+'</li>').join('')+'</ul>')+
  '</section>').join('');
 return parts||'<p class="v46-guide-empty">Per questa slide non sono disponibili note didattiche aggiuntive. Consulta i materiali della lezione e le procedure aziendali applicabili.</p>';
}
function ensure(){
 if(panel)return panel;
 panel=document.createElement('div');panel.id='v46TeacherGuideOverlay';panel.className='v46-guide-overlay hidden';
 panel.innerHTML='<section class="v46-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="v46GuideTitle"><header><div><small>SUPPORTO DOCENTE · CONSULTAZIONE</small><h2 id="v46GuideTitle">Guida didattica</h2><p id="v46GuideContext"></p></div><button type="button" data-v46-close aria-label="Chiudi guida">×</button></header><div class="v46-guide-body"><div id="v46GuideSections"></div><p class="v46-guide-disclaimer">Le indicazioni provengono soltanto dai materiali già presenti nel corso. Non sono una nuova procedura di sicurezza, non certificano la formazione e non sostituiscono la verifica normativa o le istruzioni del luogo di lavoro. Non vengono mostrate soluzioni dei quiz.</p></div><footer><button type="button" data-v46-close>Chiudi</button></footer></section>';
 panel.addEventListener('click',event=>{if(event.target===panel||event.target?.closest?.('[data-v46-close]'))close();});
 document.body.appendChild(panel);return panel;
}
function open(){
 if(!active())return false;
 const entry=window.__deckSlides[window.__deck.index];if(!entry)return false;
 const root=ensure(),info=guide(entry,window.__deck.index);
 openedKey=currentKey();
 root.querySelector('#v46GuideContext').textContent='Slide '+(info.index+1)+' · '+info.title+(info.module?' · '+info.module:'')+(info.duration!==null?' · circa '+info.duration+' min previsti':'');
 root.querySelector('#v46GuideSections').innerHTML=markup(info);
 root.classList.remove('hidden');document.body.classList.add('v46-guide-open');
 window.SAFETY_MODAL_ACCESS?.opened?.(root,close);
 root.querySelector('[data-v46-close]').focus();
 return true;
}
function close(){
 if(!visible())return;
 panel.classList.add('hidden');document.body.classList.remove('v46-guide-open');
 openedKey='';window.SAFETY_MODAL_ACCESS?.closed?.(panel);
}
document.addEventListener('safety:deck-slide-rendered',()=>{if(visible()&&(!active()||openedKey!==currentKey()))close();});
document.addEventListener('safety:auth-changed',close);
window.addEventListener('hashchange',()=>{if(visible()&&(!/^#deck\//.test(location.hash)||openedKey!==currentKey()))close();});
window.SAFETY_TEACHER_GUIDE_V46={open,close,guide,markup};
})();
