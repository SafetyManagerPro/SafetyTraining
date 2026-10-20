
const DATA = window.SAFETY_DATA;
const app = document.getElementById('app');
const side = document.getElementById('sideCourses');
const search = document.getElementById('search');
let mode = 'class';
let timerStart = null, timerInt = null;
const favs = new Set(JSON.parse(localStorage.getItem('safetyFavs')||'[]'));
const recents = JSON.parse(localStorage.getItem('safetyRecents')||'[]');

const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function saveFavs(){localStorage.setItem('safetyFavs',JSON.stringify([...favs]));}
function pushRecent(cid,tid){
 const k=cid+':'+tid;
 const next=[k,...recents.filter(x=>x!==k)].slice(0,8);
 recents.length=0; recents.push(...next);
 localStorage.setItem('safetyRecents',JSON.stringify(recents));
}
function getRecentItems(){
 let items=[];
 recents.forEach(k=>{
   const [cid,tid]=k.split(':');
   const c=getCourse(cid), t=getTopic(c,tid);
   if(c&&t) items.push({c,t});
 });
 return items;
}
function topicMiniCard(c,t){
 return `<article class="smallcard"><div class="duration">${c.icon} ${esc(c.title)} • ${t.minutes} min</div><h4>${t.icon} ${esc(t.title)}</h4><p class="muted">${esc(t.summary)}</p><button class="softbtn" onclick="setHash('topic/${c.id}/${t.id}')">Apri</button></article>`;
}
function topicKey(c,t){return c.id+':'+t.id;}
function setHash(v){location.hash=v;}
function getCourse(id){return DATA.find(c=>c.id===id)}
function getTopic(c,id){return c?.topics.find(t=>t.id===id)}
function listHtml(arr){return '<ul>'+arr.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>'}
function stepsHtml(arr){return '<ol>'+arr.map(x=>`<li>${esc(x)}</li>`).join('')+'</ol>'}

DATA.forEach(c=>{
  const b=document.createElement('button'); b.className='navbtn'; b.innerHTML=`<span>${c.icon}</span><span>${esc(c.title)}</span>`;
  b.onclick=()=>setHash('course/'+c.id); side.appendChild(b);
});
document.querySelector('[data-home]').onclick=()=>setHash('');
document.getElementById('modeClass').onclick=()=>{mode='class'; document.body.classList.add('bigscreen'); syncMode(); renderRoute();}
document.getElementById('modeTeacher').onclick=()=>{mode='teacher'; document.body.classList.remove('bigscreen'); syncMode(); renderRoute();}
function syncMode(){
  document.getElementById('modeClass').classList.toggle('active',mode==='class');
  document.getElementById('modeTeacher').classList.toggle('active',mode==='teacher');
}
document.body.classList.add('bigscreen');


function fmtMin(m){
 const h=Math.floor(m/60), mm=m%60;
 return h?`${h}h ${String(mm).padStart(2,'0')}m`:`${mm} min`;
}
function clockMin(m){
 const h=Math.floor(m/60), mm=m%60;
 return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function getTopicImage(t){
 const arr=t.idea_images||[];
 const valid=arr.find(item=>item&&typeof item.file==='string'&&item.file.trim()&&
   !['undefined','null'].includes(item.file.trim().toLowerCase()));
 if(valid) return {src:`assets/${valid.file}`,caption:valid.caption||''};
 return {src:`assets/${t.visual||'general'}.svg`,caption:'Schema visuale di supporto'};
}
function concise(arr,n=4){return (arr||[]).slice(0,n)}
function slideTitle(t){return t?.slide_title||t?.title||''}
function splitSentences(text,maxChars=235){
 const src=String(text||'').replace(/\s+/g,' ').trim();
 if(!src) return [];
 const sentences=src.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[src];
 const units=[];
 sentences.forEach(raw=>{
   let s=raw.trim(); if(!s) return;
   if(s.length<=maxChars){units.push(s);return}
   // Long legal/technical sentences are first split at natural clause boundaries.
   const clauses=s.split(/(?<=[;:])\s+|,\s+(?=[A-ZÀ-Ü])/).filter(Boolean);
   if(clauses.length>1){clauses.forEach(x=>units.push(x.trim()));return}
   // Last resort: split by words without cutting a word.
   let cur='';
   s.split(' ').forEach(w=>{if(cur && (cur.length+1+w.length)>maxChars){units.push(cur);cur=w}else cur=(cur?cur+' ':'')+w});
   if(cur) units.push(cur);
 });
 const out=[]; let cur='';
 units.forEach(s=>{
   if(cur && (cur.length+1+s.length)>maxChars){out.push(cur.trim());cur=s}
   else cur=(cur?cur+' ':'')+s;
 });
 if(cur) out.push(cur.trim());
 return out;
}
function chunkList(arr,n=4){
 const a=(arr||[]).filter(Boolean), out=[];
 for(let i=0;i<a.length;i+=n) out.push(a.slice(i,i+n));
 return out;
}
function uniqueText(arr){
 const seen=new Set(); return (arr||[]).filter(x=>{const k=String(x||'').trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true});
}
function presentationModules(c){return c.modules||[{id:'m1',title:c.title,topic_ids:c.topics.map(t=>t.id),minutes:c.topics.reduce((a,t)=>a+t.minutes,0),start_minute:0,end_minute:c.topics.reduce((a,t)=>a+t.minutes,0)}]}
function allocateSlideMinutes(total,weights){
 const n=weights.length;
 if(!n) return [];
 if(total<=0) return Array(n).fill(0);
 if(total<n){
   const out=Array(n).fill(0); for(let i=0;i<total;i++) out[i]=1; return out;
 }
 const base=Array(n).fill(1), remaining=total-n;
 const sum=weights.reduce((a,b)=>a+b,0)||n;
 const raw=weights.map(w=>remaining*w/sum);
 const add=raw.map(Math.floor);
 let used=add.reduce((a,b)=>a+b,0);
 let left=remaining-used;
 const order=raw.map((v,i)=>({i,frac:v-Math.floor(v)})).sort((a,b)=>b.frac-a.frac);
 for(let k=0;k<left;k++) add[order[k%order.length].i]++;
 return base.map((v,i)=>v+add[i]);
}
function topicSecondImage(t){
 const arr=t.idea_images||[];
 if(arr.length>1) return {src:`assets/${arr[1].file}`,caption:arr[1].caption||''};
 return getTopicImage(t);
}
function topicThirdImage(t){
 const arr=t.idea_images||[];
 if(arr.length>2) return {src:`assets/${arr[2].file}`,caption:arr[2].caption||''};
 return topicSecondImage(t);
}
function trimTopicSlides(slides,totalMinutes){
 let cap=Math.max(7,Math.min(24,Math.round(totalMinutes/3)+3));
 const hasMedia=slides.some(s=>s.type==='video'||s.type==='sourceDigest'||s.type==='graphic');
 if(hasMedia) cap=Math.max(cap,8);
 if(slides.length<=cap) return slides;
 const priority={concept:140,explain:132,actionPlan:131,howTo:130,escalation:129,graphic:126,risks:124,prevention:124,procedure:118,case:122,quiz:120,video:116,sourceDigest:112,behaviors:108,guided:104,deep:94};
 const mandatory=new Set();
 ['concept','explain','actionPlan','howTo','escalation','risks','prevention','case','quiz'].forEach(type=>{const i=slides.findIndex(s=>s.type===type);if(i>=0)mandatory.add(i)});
 let media=slides.findIndex(s=>s.type==='video'); if(media<0) media=slides.findIndex(s=>s.type==='sourceDigest'); if(media>=0) mandatory.add(media);
 const selected=[...mandatory];
 const candidates=slides.map((s,i)=>({s,i,score:(priority[s.type]||80)-(s.partIndex||0)*7})).filter(x=>!mandatory.has(x.i)).sort((a,b)=>b.score-a.score||a.i-b.i);
 for(const x of candidates){if(selected.length>=cap)break;selected.push(x.i)}
 return selected.sort((a,b)=>a-b).map(i=>slides[i]);
}


function generalFeedback(t){
 const f=t?.discussion_feedback||{};
 return {
   answer:f.answer||concise(t?.good||t?.prevention||[],3),
   explanation:f.explanation||t?.detail||'',
   caseSolution:f.case_solution||concise(t?.procedure||t?.prevention||[],4),
   generalSolution:f.general_solution||concise(t?.prevention||t?.good||[],3)
 };
}
function encAttr(s){return encodeURIComponent(String(s||''));}
window.openVideoPlayerFromData=(el)=>{
 const media=decodeURIComponent(el.dataset.media||''), page=decodeURIComponent(el.dataset.page||''), title=decodeURIComponent(el.dataset.title||'Video Napo'), scene=decodeURIComponent(el.dataset.scene||'');
 openVideoPlayer(media,page,title,scene);
};
window.openDeckVideo=(index)=>{
 const s=(window.__deckSlides||[])[Number(index)];
 if(!s||s.type!=='video') return;
 const v=s.video||{};
 openVideoPlayer(v.media_url||'',v.url||'',v.title||v.film||'Video Napo',v.scene||'');
};
window.openVideoPlayer=(media,page,title,scene)=>{
 closeVideoPlayer();
 const ov=document.createElement('div'); ov.id='videoOverlay'; ov.className='video-overlay';
 const safeTitle=esc(title), safeScene=esc(scene), safePage=esc(page);
 const mediaBlock=media?`<video id="napoVideo" class="video-player" controls autoplay playsinline preload="metadata"><source src="${esc(media)}" type="video/mp4">Il browser non riesce a riprodurre questo video.</video>`:`<iframe class="video-frame" src="${safePage}" title="${safeTitle}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
 ov.innerHTML=`<div class="video-modal" role="dialog" aria-modal="true" aria-label="Video Napo"><div class="video-modal-head"><div><span>VIDEO NAPO</span><h2>${safeTitle}</h2>${scene?`<p>${safeScene}</p>`:''}</div><button class="video-close" onclick="closeVideoPlayer()" aria-label="Chiudi">×</button></div><div class="video-modal-body" id="videoModalBody">${mediaBlock}</div><div class="video-modal-foot"><span>Se il filmato non parte, usa il collegamento ufficiale.</span>${page?`<a href="${safePage}" target="_blank" rel="noopener">Apri sul sito Napo ↗</a>`:''}</div></div>`;
 document.body.appendChild(ov);
 const video=ov.querySelector('video');
 if(video){video.addEventListener('error',()=>videoPlayerFallback(page,title));}
};
window.videoPlayerFallback=(page,title)=>{
 const body=document.getElementById('videoModalBody'); if(!body) return;
 body.innerHTML=`<div class="video-fallback"><div>⚠️</div><h3>Riproduzione diretta non disponibile</h3><p>Puoi comunque aprire la pagina ufficiale Napo nel riquadro oppure in una nuova scheda.</p>${page?`<iframe class="video-frame" src="${esc(page)}" title="${esc(title||'Video Napo')}"></iframe>`:''}</div>`;
};
window.closeVideoPlayer=()=>{const ov=document.getElementById('videoOverlay'); if(ov) ov.remove();};

window.closeAnswerOverlay=()=>{const ov=document.getElementById('answerOverlay'); if(ov) ov.remove();};
function renderAnswerOverlayContent(s){
 if(!s) return '';
 const expl=esc(splitSentences(s.explanation||s.sourceFocus||'',320)[0]||'');
 if(s.type==='case'){
   return `<div class="answer-modal-titlewrap"><span>DISCUSSIONE GUIDATA</span><h2>${esc(s.title||'Caso')}</h2></div><div class="answer-sections"><section><h3>✅ Risposta / cosa dovrebbe emergere</h3>${listHtml(s.answer||[])}</section><section><h3>💡 Spiegazione</h3><p>${expl}</p></section><section><h3>🛠 Soluzione del caso</h3>${listHtml(s.caseSolution||[])}</section><section><h3>🧭 Soluzione generale</h3>${listHtml(s.generalSolution||[])}</section></div>`;
 }
 if(s.type==='quiz'){
   return `<div class="answer-modal-titlewrap"><span>VERIFICA RAPIDA</span><h2>${esc(s.title||'Quiz')}</h2></div><div class="answer-sections"><section><h3>✅ Risposta corretta</h3><p>${esc(s.answer||'')}</p></section><section><h3>💡 Spiegazione</h3><p>${expl}</p></section><section><h3>🛠 Soluzione pratica</h3>${listHtml(s.caseSolution||[])}</section><section><h3>🧭 Soluzione generale</h3>${listHtml(s.generalSolution||[])}</section></div>`;
 }
 if(s.type==='video'){
   return `<div class="answer-modal-titlewrap"><span>DOPO IL VIDEO</span><h2>${esc((s.video&& (s.video.title||s.video.film)) || s.title || 'Discussione')}</h2></div><div class="answer-sections"><section><h3>👀 Cosa doveva emergere</h3>${(s.sourceAfter&&s.sourceAfter.length)?listHtml(s.sourceAfter):'<p>Nessun punto impostato.</p>'}</section><section><h3>💡 Spiegazione</h3><p>${expl}</p></section><section><h3>🛠 Applicazione al caso</h3>${listHtml(s.caseSolution||s.generalSolution||[])}</section><section><h3>🧭 Regola generale</h3>${listHtml(s.generalSolution||s.sourcePrompt||[])}</section></div>`;
 }
 return `<div class="answer-modal-titlewrap"><span>RISPOSTA</span><h2>${esc(s.title||'Approfondimento')}</h2></div><div class="answer-sections"><section><p>${expl}</p></section></div>`;
}
window.openDeckAnswer=(index)=>{
 closeAnswerOverlay();
 const s=(window.__deckSlides||[])[Number(index)];
 if(!s) return;
 const ov=document.createElement('div'); ov.id='answerOverlay'; ov.className='answer-overlay';
 ov.innerHTML=`<div class="answer-modal" role="dialog" aria-modal="true" aria-label="Risposta e spiegazione"><div class="answer-modal-head"><div>${renderAnswerOverlayContent(s)}</div><button class="answer-close" onclick="closeAnswerOverlay()" aria-label="Chiudi">×</button></div><div class="answer-modal-foot"><button class="ghost" onclick="closeAnswerOverlay()">Chiudi</button></div></div>`;
 ov.addEventListener('click',e=>{if(e.target===ov) closeAnswerOverlay();});
 document.body.appendChild(ov);
};

function buildDeck(c){
 const deck=[];
 const mods=presentationModules(c);
 mods.forEach((m,mi)=>{
   const topics=m.topic_ids.map(id=>getTopic(c,id)).filter(Boolean);
   deck.push({type:'module',moduleIndex:mi,module:m,title:m.title,topics,start:m.start_minute,end:m.start_minute,displayEnd:m.end_minute});
   let cur=m.start_minute;
   topics.forEach((t,ti)=>{
     const title=slideTitle(t);
     // Original Graphic Pack 01: only unfrozen DB-backed lessons without authored visuals.
     // A view-layer choice; does not change the source LU or its published version.
     const originalVisuals=[
       ...(window.SAFETY_GRAPHIC_PACK_04?.pick?.(c,t)||[]),
       ...(window.SAFETY_GRAPHIC_PACK_02?.pick?.(c,t)||[]),
       ...(window.SAFETY_GRAPHIC_PACK_03?.pick?.(c,t)||[]),
       ...(window.SAFETY_GRAPHIC_PACK_01?.pick?.(c,t)||[])
     ];
     const pdfVisuals=window.SAFETY_SOURCE_VISUALS_V23?.pick?.(c,t)||[];
     const packVisuals=[...originalVisuals.slice(0,1),...pdfVisuals.slice(0,1),...originalVisuals.slice(1)].filter((visual,i,arr)=>arr.findIndex(v=>v.src===visual.src)===i).slice(0,3);
     const img=packVisuals[0]||getTopicImage(t);
     const img2=packVisuals[1]||topicSecondImage(t);
     const img3=packVisuals[2]||topicThirdImage(t);
     const topicSlides=[];
     // Opening = one message + large image. No long explanation on the first slide.
     topicSlides.push({type:'concept',weight:.8,img,summary:t.summary,title});

     // Explanation: split long text into natural projected chunks.
     const explainSource=uniqueText([t.detail,...(t.teacher_expansion||[]).slice(0,1)]).join(' ');
     const explainParts=splitSentences(explainSource,245).slice(0,3);
     explainParts.forEach((p,pi)=>topicSlides.push({type:'explain',weight:1.05,img:pi%2?img2:img,explain:p,points:pi===explainParts.length-1?concise((t.guided&&t.guided.apply)||t.prevention,3):[],partIndex:pi,partTotal:explainParts.length,title}));

     // Existing detail sheets become projected deepening slides, split so they remain readable.
     const deeper=uniqueText([...(t.teacher_expansion||[]).slice(1),...(t.deepdetail||[]).slice(1)]).slice(0,4);
     let deepIndex=0;
     deeper.forEach((p,srcIndex)=>splitSentences(p,230).slice(0,2).forEach(piece=>{
       topicSlides.push({type:'deep',weight:.9,img:deepIndex%2?img3:img2,paragraph:piece,story:deepIndex===0?(t.example_story||''):'',errors:deepIndex===0?concise(t.common_errors,3):[],partIndex:deepIndex,title});deepIndex++;
     }));
     if(!deeper.length && t.example_story) topicSlides.push({type:'deep',weight:.9,img:img2,paragraph:'Vediamo come questo principio si applica a una situazione concreta di lavoro.',story:t.example_story,errors:concise(t.common_errors,3),partIndex:0,title});

     if(t.guided) topicSlides.push({type:'guided',weight:.85,img:img3,observe:concise(t.guided.observe,3),importance:concise(t.guided.importance,3),apply:concise(t.guided.apply,3),title});
     (t.graphic_cards||[]).slice(0,2).filter(g=>g&&typeof g==='object').forEach((g,gi)=>{
       // Some authored graphic cards supply text/points without their own image.
       // Reuse the topic's available visual rather than emitting "assets/undefined".
       const file=typeof g.image==='string'?g.image.trim():'';
       const graphicImage=(file&&!['undefined','null'].includes(file.toLowerCase()))
         ?{src:`assets/${file}`,caption:g.caption||''}
         :{...img2,caption:g.caption||img2.caption||''};
       topicSlides.push({type:'graphic',weight:.86,img:graphicImage,graphic:g,partIndex:gi,title:g.title||title});
     });
     if(t.operational){const o=t.operational; topicSlides.push({type:'actionPlan',weight:1.05,img:{src:'assets/procedura-operativa-5-fasi.svg',caption:'Prima, durante e dopo: la sequenza operativa.'},before:concise(o.before,4),during:concise(o.during,4),after:concise(o.after,4),remember:o.remember||'',title}); topicSlides.push({type:'howTo',weight:1.05,img:{src:'assets/procedura-operativa-5-fasi.svg',caption:'Procedura operativa in passi successivi.'},steps:concise(o.step_by_step,6),objective:o.objective||'',title}); topicSlides.push({type:'escalation',weight:.95,img:{src:'assets/stop-segnala-ripristina.svg',caption:'Se cambia la condizione: fermare, segnalare, ripristinare.'},problem:concise(o.if_problem,4),stop:concise(o.stop_conditions,4),who:concise(o.who_to_involve,3),remember:o.remember||'',title});}

     // Lists are split instead of shrinking the font.
     chunkList(t.risks,4).forEach((items,i)=>topicSlides.push({type:'risks',weight:.85,img:i%2?img2:img3,risks:items,partIndex:i,title}));
     const prevChunks=chunkList(t.prevention,4);
     prevChunks.forEach((items,i)=>topicSlides.push({type:'prevention',weight:.9,img:i%2?img3:img2,prevention:items,dpi:i===prevChunks.length-1?concise(t.dpi,3):[],partIndex:i,title}));
     chunkList(t.procedure,5).forEach((items,i)=>topicSlides.push({type:'procedure',weight:.9,img:i%2?img2:img3,procedure:items,partIndex:i,title}));
     if((t.good||[]).length||(t.bad||[]).length) topicSlides.push({type:'behaviors',weight:.75,img:img2,good:concise(t.good,3),bad:concise(t.bad,3),title});

     const fb=generalFeedback(t); topicSlides.push({type:'case',weight:1.0,img:img2,case:t.case,question:t.question,answer:fb.answer,explanation:fb.explanation,caseSolution:fb.caseSolution,generalSolution:fb.generalSolution,title});
     if(t.quiz){
       const correctText=(t.quiz.answers||[])[t.quiz.correct]||'';
       topicSlides.push({type:'quiz',weight:.75,img,quiz:t.quiz,answer:correctText,explanation:t.quiz.explanation||(t.teacher_expansion||[])[0]||t.detail||'',caseSolution:t.quiz.case_solution||concise(t.procedure,3),generalSolution:t.quiz.general_solution||concise(t.prevention,3),title});
     }

     const digests=(t.source_digest||[]).slice(0,2);
     digests.forEach((d,di)=>topicSlides.push({type:'sourceDigest',weight:.8,img:(d&&d.image)?{src:`assets/${d.image}`,caption:d.image_caption||''}:((di%2)?img2:img),digest:d,partIndex:di,title}));
     const video=t.video_moment||t.video_plan||null;
     if(video) topicSlides.push({type:'video',weight:.8,img:video.visual?{src:`assets/${video.visual}`,caption:''}:img,video,sourcePrompt:concise(video.before,3),sourceAfter:concise(video.after,3),sourceFocus:video.focus||'',caseSolution:concise(t.procedure||t.prevention,3),generalSolution:concise(t.prevention||t.good,3),title});

     const projectedSlides=trimTopicSlides(topicSlides,t.minutes);
     const mins=allocateSlideMinutes(t.minutes,projectedSlides.map(x=>x.weight));
     projectedSlides.forEach((s,si)=>{
       const slideStart=cur, slideEnd=cur+mins[si]; cur=slideEnd;
       deck.push({...s,moduleIndex:mi,module:m,topic:t,title:s.title||title,start:slideStart,end:slideEnd,topicStart:m.start_minute,topicMinutes:t.minutes,uid:`${c.id}-${t.id}-${s.type}-${si}`});
     });
     const expectedEnd=m.start_minute+topics.slice(0,ti+1).reduce((a,x)=>a+x.minutes,0);
     cur=expectedEnd;
     const topicDeck=deck.filter(x=>x.topic===t); if(topicDeck.length) topicDeck[topicDeck.length-1].end=expectedEnd;
   });
 });
 return deck;
}
function moduleSlideIndex(c,mi){
 const d=buildDeck(c); return d.findIndex(s=>s.type==='module'&&s.moduleIndex===mi);
}
window.deckGo=(cid,i)=>{setHash(`deck/${cid}/${Math.max(0,i)}`)};
window.deckReveal=(id)=>{
 const el=document.getElementById(id); if(!el) return;
 el.classList.toggle('deck-hidden');
 const btn=document.querySelector(`[data-reveal="${id}"]`);
 if(btn) btn.textContent=el.classList.contains('deck-hidden')?'Mostra risposta':'Nascondi risposta';
};
function deckSlideBody(s,index){
 const rid=`deck-answer-${index}`;
 const part=s.partTotal>1?` · ${s.partIndex+1}/${s.partTotal}`:'';
 if(s.type==='module'){
   return `<div class="slide-module"><div class="slide-kicker">MODULO ${s.moduleIndex+1}</div><h1>${esc(s.title)}</h1><div class="slide-time-big">${fmtMin(s.module.minutes)} · tempo corso ${clockMin(s.module.start_minute)}–${clockMin(s.displayEnd||s.module.end_minute)}</div><div class="module-topic-list">${s.topics.map((t,i)=>`<div><span>${i+1}</span><strong>${esc(slideTitle(t))}</strong><em>${t.minutes} min</em></div>`).join('')}</div></div>`;
 }
 if(s.type==='concept'){
   return `<div class="slide-grid slide-opening"><div class="slide-copy"><div class="slide-kicker">NUOVO ARGOMENTO</div><h1>${esc(s.title)}</h1><div class="opening-statement">${esc(s.summary)}</div></div><figure class="slide-visual hero-visual"><img src="${s.img.src}" alt="${esc(s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='explain'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">SPIEGAZIONE${part}</div><h1>${esc(s.title)}</h1><p class="slide-lead">${esc(s.explain)}</p>${s.points&&s.points.length?`<div class="takeaway"><strong>Da ricordare</strong>${listHtml(s.points)}</div>`:''}</div><figure class="slide-visual"><img src="${s.img.src}" alt="${esc(s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='deep'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">APPROFONDIMENTO</div><h1>${esc(s.title)}</h1><p class="slide-lead">${esc(s.paragraph||'')}</p>${s.story?`<div class="slide-callout"><strong>Esempio operativo</strong><br>${esc(s.story)}</div>`:''}${s.errors&&s.errors.length?`<div class="takeaway warning"><strong>Errori da evitare</strong>${listHtml(s.errors)}</div>`:''}</div><figure class="slide-visual"><img src="${s.img.src}" alt="${esc(s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='guided'){
   return `<div class="slide-kicker">LETTURA GUIDATA</div><h1>${esc(s.title)}</h1><div class="guided-project"><section><h2>👀 Osserva</h2>${listHtml(s.observe)}</section><section><h2>❓ Perché conta</h2>${listHtml(s.importance)}</section><section><h2>✅ Applica</h2>${listHtml(s.apply)}</section></div>`;
 }
 if(s.type==='graphic'){
   const g=s.graphic||{};
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">${esc(g.kicker||'SCHEMA GRAFICO')}</div><h1>${esc(g.title||s.title)}</h1><p class="slide-lead">${esc(g.text||'')}</p>${g.points&&g.points.length?`<div class="takeaway"><strong>Punti chiave</strong>${listHtml(g.points)}</div>`:''}</div><figure class="slide-visual graphic-visual"><img src="${s.img.src}" alt="${esc(g.title||s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='actionPlan'){
   return `<div class="slide-kicker">COSA FARE</div><h1>${esc(s.title)}</h1><div class="operational-slide-grid"><section><span>①</span><h2>Prima</h2>${listHtml(s.before||[])}</section><section><span>②</span><h2>Durante</h2>${listHtml(s.during||[])}</section><section><span>③</span><h2>Dopo</h2>${listHtml(s.after||[])}</section></div>${s.remember?`<div class="slide-memory"><strong>Regola da ricordare</strong> ${esc(s.remember)}</div>`:''}`;
 }
 if(s.type==='howTo'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">COME FARE</div><h1>${esc(s.title)}</h1><p class="slide-lead">${esc(s.objective||'')}</p><div class="big-list numbered">${stepsHtml(s.steps||[])}</div></div><figure class="slide-visual"><img src="${s.img.src}" alt="Procedura operativa"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='escalation'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">COME PROCEDERE SE QUALCOSA NON VA</div><h1>${esc(s.title)}</h1><div class="escalation-box"><h2>⛔ Fermati e gestisci</h2>${listHtml(s.problem||[])}</div><div class="escalation-mini"><div><strong>Quando fermarsi</strong>${listHtml(s.stop||[])}</div><div><strong>Chi coinvolgere</strong>${listHtml(s.who||[])}</div></div></div><figure class="slide-visual"><img src="${s.img.src}" alt="Stop, segnala, ripristina"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='risks'){
   return `<div class="slide-grid single-list"><div class="slide-copy"><div class="slide-kicker">RISCHI E POSSIBILI DANNI</div><h1>${esc(s.title)}</h1><div class="big-list">${listHtml(s.risks)}</div></div><figure class="slide-visual"><img src="${s.img.src}" alt="${esc(s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='prevention'){
   return `<div class="slide-grid single-list"><div class="slide-copy"><div class="slide-kicker">COME PREVENIRE</div><h1>${esc(s.title)}</h1><div class="big-list">${listHtml(s.prevention)}</div>${s.dpi&&s.dpi.length?`<div class="slide-bottom-strip"><strong>🥽 DPI / protezioni</strong><br>${s.dpi.map(esc).join(' · ')}</div>`:''}</div><figure class="slide-visual"><img src="${s.img.src}" alt="${esc(s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='procedure'){
   return `<div class="slide-grid single-list"><div class="slide-copy"><div class="slide-kicker">PROCEDURA OPERATIVA</div><h1>${esc(s.title)}</h1><div class="big-list numbered">${stepsHtml(s.procedure)}</div></div><figure class="slide-visual"><img src="${s.img.src}" alt="${esc(s.title)}"><figcaption>${esc(s.img.caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='behaviors'){
   return `<div class="slide-kicker">COMPORTAMENTI</div><h1>${esc(s.title)}</h1><div class="slide-columns"><section class="good"><h2>✅ Da fare</h2>${listHtml(s.good)}</section><section class="bad"><h2>❌ Da evitare</h2>${listHtml(s.bad)}</section></div>`;
 }
 if(s.type==='case'){
   return `<div class="slide-kicker">CASO DA DISCUTERE</div><h1>${esc(s.title)}</h1><div class="case-slide"><div class="case-big"><span>SITUAZIONE</span><p>${esc(s.case)}</p></div><div class="question-big"><span>DOMANDA ALL’AULA</span><p>${esc(s.question)}</p></div></div><div class="reveal-row"><button class="deck-reveal-btn" onclick="openDeckAnswer(${index})">Mostra risposta e spiegazione</button></div>`;
 }
 if(s.type==='quiz'){
   const answers=s.quiz.answers||[];
   return `<div class="slide-kicker">VERIFICA RAPIDA</div><h1>${esc(s.title)}</h1><div class="quiz-slide"><p class="quiz-question">${esc(s.quiz.q)}</p><div class="quiz-options">${answers.map((a,i)=>`<div><span>${String.fromCharCode(65+i)}</span><p>${esc(a)}</p></div>`).join('')}</div><button class="deck-reveal-btn" onclick="openDeckAnswer(${index})">Mostra risposta e spiegazione</button></div>`;
 }
 if(s.type==='sourceDigest'){
   const d=s.digest||{};
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">APPROFONDIMENTO · ${esc(d.source||'FONTE')}</div><h1>${esc(s.title)}</h1><h2 class="source-title">${esc(d.title||'Approfondimento')}</h2><p class="slide-lead source-summary">${esc(splitSentences(d.summary||'',230)[0]||'')}</p>${d.keypoints&&d.keypoints.length?`<div class="takeaway"><strong>Punti chiave</strong>${listHtml(concise(d.keypoints,3))}</div>`:''}</div><figure class="slide-visual"><img src="${s.img.src}" alt="Approfondimento"><figcaption>${esc(s.img.caption||d.image_caption||'')}</figcaption></figure></div>`;
 }
 if(s.type==='video'){
   const v=s.video||{};
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">MOMENTO VIDEO</div><h1>${esc(s.title)}</h1><div class="video-cue"><strong>🎬 ${esc(v.title||v.film||'Video Napo')}</strong>${v.scene?`<p>Scena consigliata: <b>${esc(v.scene)}</b></p>`:''}${v.when?`<p>${esc(v.when)}</p>`:''}</div>${s.sourcePrompt&&s.sourcePrompt.length?`<div class="takeaway"><strong>Prima di avviare il video</strong>${listHtml(s.sourcePrompt)}</div>`:''}<div class="video-button-row"><button class="deck-video-open" onclick="openDeckVideo(${index})">▶ Apri il video nel riquadro</button><button class="deck-reveal-btn" onclick="openDeckAnswer(${index})">Mostra spunti e spiegazione</button></div></div><button class="video-poster-button" onclick="openDeckVideo(${index})" title="Apri video"><figure class="slide-visual video-poster"><img src="${s.img.src}" alt="Apri ${esc(v.title||'video Napo')}"><div class="video-play-badge">▶</div><figcaption>${esc(v.click_hint||'Clicca l’immagine per aprire il video nel riquadro.')}</figcaption></figure></button></div>`;
 }
 return '';
}
// Read-only access to the exact presentation builders for visual printing.
window.SAFETY_DECK_RENDER={buildDeck,deckSlideBody};
function deckView(c,index=0){
 const deck=buildDeck(c);
 index=Math.min(Math.max(0,Number(index)||0),deck.length-1);
 const s=deck[index];
 document.body.classList.add('deckmode');
 const pct=((index+1)/deck.length)*100;
 app.innerHTML=`<div class="deck-shell"><div class="deck-top"><button class="deck-exit" onclick="setHash('course/${c.id}')">← Agenda</button><div class="deck-course">${c.icon} ${esc(c.title)}</div><div class="deck-actions"><button onclick="toggleFullscreen()">⛶</button></div></div>
 <div class="deck-stage" id="deckStage"><article class="projector-slide type-${s.type}" id="projectorSlide">${deckSlideBody(s,index)}</article></div>
 <div class="deck-footer"><div><strong>${esc(s.module.title)}</strong>${s.topic?`<span>${esc(s.topic.title)}</span>`:''}</div><div class="deck-time"><span>tempo corso ${clockMin(s.start)}–${clockMin(s.topic?s.end:(s.displayEnd||s.module.end_minute))}</span>${s.topic?`<b>${Math.max(0,s.end-s.start)} min slide</b>`:`<b>${s.module.minutes} min modulo</b>`}</div><div class="deck-counter">${index+1} / ${deck.length}</div></div>
 <div class="deck-progress"><span style="width:${pct}%"></span></div>
 <button class="deck-nav prev" ${index===0?'disabled':''} onclick="deckGo('${c.id}',${index-1})">‹</button><button class="deck-nav next" ${index===deck.length-1?'disabled':''} onclick="deckGo('${c.id}',${index+1})">›</button></div>`;
 window.__deck={cid:c.id,index,total:deck.length}; window.__deckSlides=deck;
 requestAnimationFrame(()=>{fitDeckContent();fitDeckToViewport();});
 setTimeout(()=>{fitDeckContent();fitDeckToViewport();},80);
}

function fitDeckContent(){
 const slide=document.getElementById('projectorSlide');
 if(!slide) return;
 slide.classList.remove('compact','compact2');
 // The logical slide is always 1600x900. Only reduce typography if its own content is too tall.
 requestAnimationFrame(()=>{
   if(slide.scrollHeight>slide.clientHeight+2 || slide.scrollWidth>slide.clientWidth+2){
     slide.classList.add('compact');
     requestAnimationFrame(()=>{
       if(slide.scrollHeight>slide.clientHeight+2 || slide.scrollWidth>slide.clientWidth+2) slide.classList.add('compact2');
     });
   }
 });
}
function fitDeckToViewport(){
 const stage=document.getElementById('deckStage'), slide=document.getElementById('projectorSlide');
 if(!stage||!slide) return;
 const pad=20;
 const sx=Math.max(.1,(stage.clientWidth-pad*2)/1600);
 const sy=Math.max(.1,(stage.clientHeight-pad*2)/900);
 const scale=Math.min(sx,sy);
 slide.style.transform=`scale(${scale})`;
 slide.style.setProperty('--deck-scale',scale);
}
function home(){
 document.body.classList.remove('deckmode');
 const foundation=DATA.find(c=>c.id==='fondamenti');
 const formal=DATA.filter(c=>c.id!=='fondamenti');
 app.innerHTML=`<section class="hero presentation-hero"><span class="pill">MODALITÀ PRESENTAZIONE</span><h1>Safety Training</h1><p>Corso progettato per essere proiettato: agenda temporale, moduli ordinati e slide leggibili da lontano.</p><div class="startpanel"><div><span class="startlabel">MODULO COMUNE</span><h2>🏛️ Fondamenti normativi e sistema prevenzione</h2><p>Normativa, figure della sicurezza, vigilanza, responsabilità e sanzioni.</p></div><button class="openbtn big" onclick="setHash('course/fondamenti')">Apri agenda</button></div></section>
 <h2 class="sectiontitle">Scegli il corso da proiettare</h2><section class="presentation-courses">${formal.map(c=>`<article class="presentation-course"><div class="pc-head"><span class="pc-icon">${c.icon}</span><div><div class="duration">${fmtMin(c.planned_minutes||c.target_minutes||0)}</div><h2>${esc(c.title)}</h2></div></div><p>${esc(c.subtitle)}</p><div class="pc-modules">${(c.modules||[]).map(m=>`<span>${esc(m.title)} · ${fmtMin(m.minutes)}</span>`).join('')}</div><div class="pc-actions"><button class="openbtn" onclick="setHash('deck/${c.id}/0')">▶ Avvia presentazione</button><button class="ghost" onclick="setHash('course/${c.id}')">Agenda</button></div></article>`).join('')}</section>
 <div class="footer">Le schede di approfondimento restano disponibili, ma la modalità principale è ora la presentazione sequenziale.</div>`;
}

function labCard(c,a,i){
 if(a.type==='find'){
   return `<article class="labcard"><div class="labtag">TROVA L'ERRORE</div><h3>${esc(a.title)}</h3><p>${esc(a.prompt)}</p>
   <img class="sceneimg" src="assets/${a.image}" alt="${esc(a.title)}">
   <button class="openbtn" onclick="toggleReveal('reveal-${c.id}-${i}')">Mostra soluzione</button>
   <div id="reveal-${c.id}-${i}" class="revealbox hidden"><div class="detail-answer-grid"><section><h4>✅ Risposta</h4>${listHtml(a.answers||[])}</section><section><h4>💡 Spiegazione</h4><p>${esc(a.explanation||a.teacher||'')}</p></section><section><h4>🛠 Soluzione al problema</h4>${listHtml(a.case_solution||[])}</section><section><h4>🧭 Regola generale</h4>${listHtml(a.general_solution||[])}</section></div></div></article>`;
 }
 return `<article class="labcard"><div class="labtag">CASO PRATICO</div><h3>${esc(a.title)}</h3><p>${esc(a.prompt)}</p>
 <div class="casechoices">${a.choices.map((x,j)=>`<button class="quiz-answer" onclick="checkCase(this,${j},${a.correct},'caseexp-${c.id}-${i}')">${esc(x)}</button>`).join('')}</div>
 <div id="caseexp-${c.id}-${i}" class="revealbox hidden"><div class="detail-answer-grid"><section><h4>💡 Spiegazione</h4><p>${esc(a.explain||'')}</p></section><section><h4>🛠 Soluzione al problema</h4>${listHtml(a.case_solution||[])}</section><section><h4>🧭 Regola generale</h4>${listHtml(a.general_solution||[])}</section></div></div></article>`;
}
window.toggleReveal=id=>document.getElementById(id)?.classList.toggle('hidden');
window.checkCase=(btn,i,c,expid)=>{
 const box=btn.parentElement;
 box.querySelectorAll('.quiz-answer').forEach(x=>x.disabled=true);
 btn.classList.add(i===c?'ok':'no');
 if(i!==c) box.querySelectorAll('.quiz-answer')[c].classList.add('ok');
 document.getElementById(expid)?.classList.remove('hidden');
};
function labView(c){
 const labs=c.labs||[];
 app.innerHTML=`<div class="breadcrumb"><button onclick="setHash('')">Home</button> › <button onclick="setHash('course/${c.id}')">${esc(c.title)}</button> › Laboratorio</div>
 <section class="hero"><span class="pill">ATTIVITÀ INTERATTIVE</span><h1>🧩 Laboratorio — ${esc(c.title)}</h1>
 <p>Scenari visuali, error spotting e casi pratici da usare durante la lezione. Prima fai rispondere l'aula, poi mostra la soluzione.</p></section>
 <div class="labgrid">${labs.map((a,i)=>labCard(c,a,i)).join('')||'<p>Nessuna attività disponibile.</p>'}</div>`;
}
function dpiView(){
 const items=window.DPI_LIBRARY||[];
 app.innerHTML=`<section class="hero"><span class="pill">CONSULTAZIONE RAPIDA</span><h1>🥽 Libreria DPI</h1>
 <p>Promemoria visuale per collegare il DPI al rischio e ricordare che il DPI non sostituisce le misure tecniche, collettive e organizzative.</p></section>
 <div class="grid">${items.map(d=>`<article class="card dpicard"><div class="icon">${d.icon}</div><h3>${esc(d.name)}</h3><p class="muted">${esc(d.use)}</p><h4>Controlli rapidi</h4>${listHtml(d.checks)}</article>`).join('')}</div>
 <div class="notice">⚠️ La scelta definitiva dei DPI deve derivare dal DVR, dall'attività concreta, dalle istruzioni del fabbricante e dalle procedure dell'ente.</div>`;
}





function videoPlanHtml(v){
 if(!v) return '';
 const media=encAttr(v.media_url||''), page=encAttr(v.url||''), title=encAttr(v.title||'Video Napo'), scene=encAttr(v.scene||'');
 return `<div class="section videocue"><div class="videotop"><div><span class="labtag">MOMENTO VIDEO</span><h3>▶️ ${esc(v.title)}</h3><p class="videoscene">${esc(v.scene||'')}</p></div>${v.visual?`<button class="video-thumb-button" data-media="${media}" data-page="${page}" data-title="${title}" data-scene="${scene}" onclick="openVideoPlayerFromData(this)" title="Apri video"><img class="videocueimg" src="assets/${v.visual}" alt="Apri video Napo"><span>▶</span></button>`:''}</div>
 <div class="videowhen"><strong>Quando mostrarlo:</strong> ${esc(v.when||'')}</div>
 <div class="threecols"><div class="mini"><h4>Prima del video</h4>${listHtml(v.before||[])}</div><div class="mini"><h4>Cosa osservare</h4><p>${esc(v.focus||'')}</p></div><div class="mini"><h4>Dopo il video</h4>${listHtml(v.after||[])}</div></div>
 <div class="video-actions"><button class="openbtn" data-media="${media}" data-page="${page}" data-title="${title}" data-scene="${scene}" onclick="openVideoPlayerFromData(this)">▶ Apri nel riquadro</button><a class="ghost videolink" href="${v.url}" target="_blank" rel="noopener">Apri sul sito Napo ↗</a></div></div>`;
}

function teacherExpansionHtml(t){
 const exp=t.teacher_expansion||[];
 const errs=t.common_errors||[];
 const steps=t.teaching_steps||[];
 const story=t.example_story||'';
 if(!exp.length && !errs.length && !steps.length && !story) return '';
 return `<div class="section"><h3>🎙️ Spiegazione docente estesa</h3>${exp.map(p=>`<p>${esc(p)}</p>`).join('')}
 ${story?`<div class="storybox"><h4>Esempio operativo</h4><p>${esc(story)}</p></div>`:''}
 ${(errs.length||steps.length)?`<div class="two"><div class="section"><h3>❗ Errori ricorrenti</h3>${listHtml(errs)}</div><div class="section"><h3>🪜 Sequenza consigliata per spiegare</h3>${stepsHtml(steps)}</div></div>`:''}</div>`;
}

function sourceDigestHtml(items){
 const arr=items||[];
 if(!arr.length) return '<p class="muted">Nessuna sintesi esterna collegata a questo argomento.</p>';
 return `<div class="digestgrid">${arr.map(r=>`<article class="digestcard"><div class="reskind">${esc(r.source||'Fonte')}</div><h4>${esc(r.title)}</h4><p>${esc(r.summary||'')}</p>${r.image?`<div class="digestimg"><img src="assets/${r.image}" alt="${esc(r.title)}"><div class="imgcaption">${esc(r.image_caption||'')}</div></div>`:''}<h5>Punti chiave</h5>${listHtml(r.keypoints||[])}${r.url?`<a class="softlink" href="${r.url}" target="_blank" rel="noopener">Vai alla fonte ↗</a>`:''}</article>`).join('')}</div>`;
}
function ideaImagesHtml(items){
 const arr=items||[];
 if(!arr.length) return '';
 return `<div class="imagegrid">${arr.map(x=>`<figure class="imagecard"><img src="assets/${x.file}" alt="Immagine di supporto"><figcaption>${esc(x.caption||'')}</figcaption></figure>`).join('')}</div>`;
}


function operationalGuideHtml(t){
 const o=t.operational||{}; if(!o.before)return '';
 return `<section class="section operational-guide"><div class="op-head"><div><span class="op-label">GUIDA OPERATIVA</span><h3>Cosa fare, come fare, come procedere</h3></div><p>${esc(o.objective||'')}</p></div><div class="op-grid three"><article><h4>① Prima di iniziare</h4>${listHtml(o.before||[])}</article><article><h4>② Durante l’attività</h4>${listHtml(o.during||[])}</article><article><h4>③ Dopo l’attività</h4>${listHtml(o.after||[])}</article></div><div class="op-grid two"><article><h4>🪜 Come procedere passo-passo</h4>${stepsHtml(o.step_by_step||[])}</article><article><h4>⛔ Se qualcosa non va</h4>${listHtml(o.if_problem||[])}<h4 class="subop">Quando fermarsi</h4>${listHtml(o.stop_conditions||[])}</article></div><div class="op-grid two"><article><h4>👥 Chi coinvolgere</h4>${listHtml(o.who_to_involve||[])}</article><article class="op-memory"><h4>🧭 Regola da ricordare</h4><p>${esc(o.remember||'')}</p><small>${esc(o.adaptation||'')}</small></article></div></section>`;
}

function resourceCards(items){
 const arr=items||[];
 if(!arr.length) return '<p class="muted">Nessun approfondimento esterno associato.</p>';
 return `<div class="resourcegrid">${arr.map(r=>`<article class="resourcecard"><div class="reskind">${esc(r.kind||'Risorsa')}</div><h4>${esc(r.title)}</h4><p>${esc(r.note||'')}</p><a class="softlink" href="${r.url}" target="_blank" rel="noopener">Apri risorsa ↗</a></article>`).join('')}</div>`;
}
function explainBlocks(t){
 const g=t.guided||{observe:[],importance:[],apply:[]};
 const deep=t.deepdetail||[];
 return `<div class="section"><h3>🔍 Lettura guidata dell'immagine</h3><div class="threecols"><div class="mini"><h4>Cosa osservare</h4>${listHtml(g.observe||[])}</div><div class="mini"><h4>Perché è importante</h4>${listHtml(g.importance||[])}</div><div class="mini"><h4>Cosa applicare</h4>${listHtml(g.apply||[])}</div></div></div>
 <div class="section"><h3>📘 Spiegazione estesa</h3>${deep.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`;
}
function resourceCourseView(c){
 app.innerHTML=`<div class="breadcrumb"><button onclick="setHash('')">Home</button> › <button onclick="setHash('course/${c.id}')">${esc(c.title)}</button> › Fonti</div><section class="hero"><span class="pill">FONTI UFFICIALI</span><h1>📚 ${esc(c.title)}</h1><p>Approfondimenti online selezionati per questo percorso. I collegamenti esterni sono utili per rafforzare la spiegazione con materiale ufficiale INAIL e Napo.</p></section><section class="section">${resourceCards(c.resources||[])}</section>`;
}

function resourcesView(){
 const items=DATA.filter(c=>c.resources&&c.resources.length);
 app.innerHTML=`<section class="hero"><span class="pill">FONTI UFFICIALI</span><h1>📚 Fonti e approfondimenti</h1><p>Raccolta di riferimenti ufficiali selezionati per rafforzare la spiegazione in aula: pagine INAIL, opuscoli/guide e film Napo da usare come rinforzo didattico. Necessaria connessione Internet per aprire i link esterni.</p></section>
 ${items.map(c=>`<section class="section"><h3>${c.icon} ${esc(c.title)}</h3>${resourceCards(c.resources)}</section>`).join('')}`;
}


function readinessScore(c){
 const topics=c.topics||[];
 if(!topics.length) return 0;
 return Math.round(topics.reduce((s,t)=>s+((t.quality&&t.quality.score)||0),0)/topics.length);
}
const CHECKS=[
 ['dvr','DVR e rischi effettivi dell’ente verificati'],
 ['plan','Piano di emergenza / planimetrie disponibili quando pertinenti'],
 ['dpi','DPI o attrezzature reali disponibili per le dimostrazioni'],
 ['video','Connessione e video Napo verificati se previsti nella lezione'],
 ['presenze','Registro presenze e documentazione del corso predisposti'],
 ['test','Test/verifica finale e modalità di correzione predisposti'],
 ['pratica','Esercitazioni pratiche organizzate quando obbligatorie o previste']
];
function checklistView(){
 const saved=JSON.parse(localStorage.getItem('teacherChecklist')||'{}');
 app.innerHTML=`<section class="hero"><span class="pill">PRIMA DELLA LEZIONE</span><h1>✅ Checklist docente</h1><p>Controlli essenziali prima di usare il materiale in aula. Le spunte restano salvate nel browser.</p></section><div class="checklistbox">${CHECKS.map(([id,label])=>`<label class="checkrow"><input type="checkbox" ${saved[id]?'checked':''} onchange="saveTeacherCheck('${id}',this.checked)"><span>${esc(label)}</span></label>`).join('')}</div><div class="notice">La completezza dell’app non sostituisce la verifica di DVR, procedure, attrezzature, piano di emergenza e requisiti formativi effettivamente applicabili.</div>`;
}
window.saveTeacherCheck=(id,v)=>{const s=JSON.parse(localStorage.getItem('teacherChecklist')||'{}');s[id]=v;localStorage.setItem('teacherChecklist',JSON.stringify(s));};

function courseView(c){
 document.body.classList.remove('deckmode');
 const total=c.topics.reduce((a,t)=>a+t.minutes,0);
 const mods=presentationModules(c);
 app.innerHTML=`<div class="breadcrumb"><button onclick="setHash('')">Home</button> › ${esc(c.title)}</div>
 <section class="hero agenda-hero"><span class="pill">AGENDA DEL CORSO</span><h1>${c.icon} ${esc(c.title)}</h1><p>${esc(c.subtitle)}</p><div class="agenda-summary"><strong>${fmtMin(total)}</strong><span>${mods.length} moduli</span><span>${c.topics.length} argomenti</span></div><button class="openbtn big" onclick="setHash('deck/${c.id}/0')">▶ Avvia presentazione dall'inizio</button></section>
 <div class="timeline">${mods.map((m,mi)=>`<article class="timeline-module"><div class="timeline-time"><strong>${clockMin(m.start_minute)}</strong><span>→ ${clockMin(m.end_minute)}</span></div><div class="timeline-content"><div class="module-head"><div><span class="module-num">MODULO ${mi+1}</span><h2>${esc(m.title)}</h2><p>${fmtMin(m.minutes)}</p></div><button class="openbtn" onclick="setHash('deck/${c.id}/${moduleSlideIndex(c,mi)}')">▶ Avvia da qui</button></div><div class="timeline-topics">${m.topic_ids.map(id=>{const t=getTopic(c,id);return `<button onclick="setHash('topic/${c.id}/${t.id}')"><span>${t.minutes} min</span><strong>${esc(t.title)}</strong><em>Dettaglio / approfondimento</em></button>`}).join('')}</div></div></article>`).join('')}</div>
 <div class="notice">Gli approfondimenti delle vecchie schede sono ora inseriti anche nella <strong>sequenza di proiezione</strong>, nel punto coerente con ciascun argomento. Le schede restano disponibili per consultazione.</div>`;
}
window.toggleFav=(cid,tid,e)=>{e?.stopPropagation();let k=cid+':'+tid;favs.has(k)?favs.delete(k):favs.add(k);saveFavs();renderRoute();}
function quizHtml(q){
 const id='detail-quiz-'+Math.random().toString(36).slice(2);
 const answer=(q.answers||[])[q.correct]||'';
 return `<div class="section"><h3>🧠 Mini quiz</h3><p><strong>${esc(q.q)}</strong></p><div class="detail-quiz-options">${(q.answers||[]).map((a,i)=>`<div><span>${String.fromCharCode(65+i)}</span>${esc(a)}</div>`).join('')}</div><button class="openbtn" onclick="toggleReveal('${id}')">Mostra risposta dopo la discussione</button><div id="${id}" class="revealbox hidden"><div class="detail-answer-grid"><section><h4>✅ Risposta corretta</h4><p>${esc(answer)}</p></section><section><h4>💡 Spiegazione</h4><p>${esc(splitSentences(q.explanation||'',300)[0]||'')}</p></section><section><h4>🛠 Soluzione pratica</h4>${listHtml(q.case_solution||[])}</section><section><h4>🧭 Regola generale</h4>${listHtml(q.general_solution||[])}</section></div></div></div>`;
}
window.checkQuiz=(btn,i,c)=>{};

function detailedDiscussionHtml(t){
 const id='detail-disc-'+t.id;
 const f=generalFeedback(t);
 return `<div class="section"><h3>🎯 Caso pratico</h3><p>${esc(t.case)}</p><h3>💬 Domanda all'aula</h3><p>${esc(t.question)}</p><button class="openbtn" onclick="toggleReveal('${id}')">Mostra risposta guidata</button><div id="${id}" class="revealbox hidden"><div class="detail-answer-grid"><section><h4>✅ Risposta / cosa dovrebbe emergere</h4>${listHtml(f.answer||[])}</section><section><h4>💡 Spiegazione</h4><p>${esc(splitSentences(f.explanation||'',300)[0]||'')}</p></section><section><h4>🛠 Soluzione al caso</h4>${listHtml(f.caseSolution||[])}</section><section><h4>🧭 Regola generale</h4>${listHtml(f.generalSolution||[])}</section></div></div></div>`;
}

function topicView(c,t){
 pushRecent(c.id,t.id);
 const k=topicKey(c,t), idx=c.topics.indexOf(t), prev=c.topics[idx-1], next=c.topics[idx+1];
 const visual=t.visual||'general';
 app.innerHTML=`<div class="breadcrumb"><button onclick="setHash('')">Home</button> › <button onclick="setHash('course/${c.id}')">${esc(c.title)}</button> › ${esc(t.title)}</div>
 <div class="topichead"><div class="topicicon">${t.icon}</div><div><div class="duration">${t.minutes} min • ${idx+1}/${c.topics.length}</div><h1>${esc(t.title)}</h1></div></div>
 <div class="toolbar"><button class="ghost ${favs.has(k)?'active':''}" onclick="toggleFav('${c.id}','${t.id}')">${favs.has(k)?'★ Preferito':'☆ Aggiungi ai preferiti'}</button>
 <button class="ghost" onclick="startTimer(${t.minutes})">⏱ Avvia timer</button><span class="ghost timer" id="timer">00:00</span>
 <button class="ghost" onclick="toggleFullscreen()">⛶ Presentazione</button><button class="ghost" onclick="window.print()">🖨 Stampa scheda</button></div>
 <div class="topicprogress"><span style="width:${((idx+1)/c.topics.length)*100}%"></span></div>
 <div class="visualcard"><img src="assets/${visual}.svg" alt="Schema visuale ${esc(t.title)}"><div class="imgcaption">Schema sintetico locale a supporto della spiegazione dell'argomento.</div></div>
 <div class="section summary"><h3>In aula</h3><p>${esc(t.summary)}</p></div>
 <div class="section"><h3>Approfondimento</h3><p>${esc(t.detail)}</p></div>
 ${explainBlocks(t)}
 ${operationalGuideHtml(t)}
 <div class="section"><h3>🖼️ Immagini che rendono l’idea</h3><p class="muted">Usa queste immagini come supporto visivo per far parlare l’aula prima di dare la spiegazione completa.</p>${ideaImagesHtml(t.idea_images||[])}</div>
 <div class="section"><h3>📚 Riassunto da INAIL / Napo</h3><p class="muted">Sintesi rielaborate per uso didattico a partire da materiali ufficiali esterni.</p>${sourceDigestHtml(t.source_digest||[])}</div>
 ${videoPlanHtml(t.video_plan)}
 ${teacherExpansionHtml(t)}
 <div class="two"><div class="section"><h3>⚠️ Rischi / danni</h3>${listHtml(t.risks)}</div><div class="section"><h3>🛡️ Prevenzione</h3>${listHtml(t.prevention)}</div></div>
 <div class="section"><h3>🥽 DPI / protezioni</h3>${listHtml(t.dpi)}</div>
 <div class="section"><h3>🧭 Procedura operativa</h3>${stepsHtml(t.procedure)}</div>
 <div class="two"><div class="section good"><h3>✅ Comportamenti corretti</h3>${listHtml(t.good)}</div><div class="section bad"><h3>❌ Da evitare</h3>${listHtml(t.bad)}</div></div>
 ${detailedDiscussionHtml(t)}
 ${quizHtml(t.quiz)}
 <div class="section"><h3>🔗 Fonti ufficiali collegate</h3>${resourceCards(t.resources||c.resources||[])}</div>
 <div class="section teacher detail-only"><h3>👨‍🏫 Note docente</h3><p>${esc(t.teacher)}</p></div>
 <div class="section norm detail-only"><h3>📚 Riferimenti normativi</h3><p>${esc(t.norm)}</p></div>
 ${t.db_backed&&!c.metadata?.freeze_scope&&!c.metadata?.frozen?(window.SAFETY_NORMATIVE_SANCTIONS_V23?.renderFor?.({title:t.title,summary:t.summary,detail:t.detail,norm:t.norm})||''):''}
 <div class="section detail-only disclaimer"><h3>🔎 Personalizzazione ente</h3><p>${esc(c.disclaimer||'Verificare sempre il DVR e le procedure effettive.')}</p></div>
 <div class="toolbar">${prev?`<button class="ghost" onclick="setHash('topic/${c.id}/${prev.id}')">← ${esc(prev.title)}</button>`:''}${next?`<button class="openbtn" onclick="setHash('topic/${c.id}/${next.id}')">${esc(next.title)} →</button>`:''}</div>`;
}
window.startTimer=(mins)=>{
 clearInterval(timerInt); timerStart=Date.now(); const el=document.getElementById('timer');
 timerInt=setInterval(()=>{let s=Math.floor((Date.now()-timerStart)/1000), m=Math.floor(s/60), ss=s%60; if(el) el.textContent=`${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')} / ${mins}:00`;},1000);
}
function searchView(q){
 const qq=q.trim().toLowerCase(); let found=[];
 DATA.forEach(c=>c.topics.forEach(t=>{
   const blob=[t.title,t.summary,t.detail,t.norm,...t.risks,...t.prevention,...t.dpi,...t.procedure].join(' ').toLowerCase();
   if(blob.includes(qq)) found.push({c,t});
 }));
 app.innerHTML=`<section class="hero"><h1>Risultati ricerca</h1><p>“${esc(q)}” — ${found.length} risultati</p></section>
 <div class="grid">${found.map(({c,t})=>`<article class="card"><div class="duration">${esc(c.title)} • ${t.minutes} min</div><div class="icon">${t.icon}</div><h3>${esc(t.title)}</h3><p class="muted">${esc(t.summary)}</p><button class="openbtn" onclick="setHash('topic/${c.id}/${t.id}')">Apri</button></article>`).join('')||'<p>Nessun risultato.</p>'}</div>`;
}
search.addEventListener('input',()=>{if(search.value.trim().length>=2) searchView(search.value); else renderRoute();});
document.getElementById('showFav').onclick=()=>{
 let items=[]; DATA.forEach(c=>c.topics.forEach(t=>{if(favs.has(topicKey(c,t)))items.push({c,t})}));
 app.innerHTML=`<section class="hero"><h1>⭐ Preferiti</h1><p>Argomenti salvati per accesso rapido durante la lezione.</p></section><div class="grid">${items.map(({c,t})=>`<article class="card"><div class="icon">${t.icon}</div><div class="duration">${esc(c.title)}</div><h3>${esc(t.title)}</h3><button class="openbtn" onclick="setHash('topic/${c.id}/${t.id}')">Apri</button></article>`).join('')||'<p>Nessun preferito salvato.</p>'}</div>`;
}
document.getElementById('showRecent').onclick=()=>{
 const items=getRecentItems();
 app.innerHTML=`<section class="hero"><h1>🕘 Argomenti recenti</h1><p>Ultime schede aperte, utili per riprendere rapidamente il corso in aula.</p></section><div class="smallgrid">${items.map(({c,t})=>topicMiniCard(c,t)).join('')||'<p>Nessun argomento aperto di recente.</p>'}</div>`;
}
document.getElementById('showDpi').onclick=()=>dpiView();
document.getElementById('showRefs').onclick=()=>resourcesView();
document.getElementById('showChecklist').onclick=()=>checklistView();

function renderRoute(){
 closeVideoPlayer();
 if(search.value.trim().length>=2){document.body.classList.remove('deckmode');searchView(search.value);return}
 clearInterval(timerInt);
 const p=location.hash.replace('#','').split('/');
 if(p[0]==='deck'){let c=getCourse(p[1]); return c?deckView(c,p[2]||0):home()}
 document.body.classList.remove('deckmode');
 if(p[0]==='course'){let c=getCourse(p[1]); return c?courseView(c):home()}
 if(p[0]==='topic'){let c=getCourse(p[1]),t=getTopic(c,p[2]); return c&&t?topicView(c,t):home()}
 if(p[0]==='lab'){let c=getCourse(p[1]); return c?labView(c):home()}
 if(p[0]==='resources'){let c=getCourse(p[1]); return c?resourceCourseView(c):home()}
 home();
}
window.addEventListener('hashchange',renderRoute);
window.addEventListener('resize',()=>{if(document.body.classList.contains('deckmode')){fitDeckContent();fitDeckToViewport();}});
document.addEventListener('fullscreenchange',()=>setTimeout(()=>{if(document.body.classList.contains('deckmode')){fitDeckContent();fitDeckToViewport();}},60));
window.addEventListener('keydown',e=>{if(document.getElementById('videoOverlay')){if(e.key==='Escape'){e.preventDefault();closeVideoPlayer();}return;} if(document.getElementById('answerOverlay')){if(e.key==='Escape'){e.preventDefault();closeAnswerOverlay();}return;} if(!window.__deck||!document.body.classList.contains('deckmode'))return; if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault(); if(window.__deck.index<window.__deck.total-1)deckGo(window.__deck.cid,window.__deck.index+1)} if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault(); if(window.__deck.index>0)deckGo(window.__deck.cid,window.__deck.index-1)} if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen?.();});
syncMode(); renderRoute();

window.toggleFullscreen=()=>{ if(!document.fullscreenElement){document.documentElement.requestFullscreen?.();}else{document.exitFullscreen?.();} };
