/* Original SafetyTraining slide engine. This section is copied from apps/training/app.js,
   unmodified: the internal learner sees the SAME slide builders and slide HTML.
   Test compares source and extracted segment on every GitHub CI run.
   No catalog, authentication or admin UI is mounted in this isolated reader. */
const DATA=window.SAFETY_DATA||(window.SAFETY_DATA=[]);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function getCourse(id){return DATA.find(c=>c.id===id)}
function getTopic(c,id){return c?.topics.find(t=>t.id===id)}
function listHtml(arr){return '<ul>'+arr.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>'}
function stepsHtml(arr){return '<ol>'+arr.map(x=>`<li>${esc(x)}</li>`).join('')+'</ol>'}
// Navigation in this isolated reader is provided by internal-player-v47.js.
function setHash(v){window.SAFETY_INTERNAL_SLIDE_V47_3?.navigate?.(v)}

function fmtMin(m){
 const h=Math.floor(m/60), mm=m%60;
 return h?`${h}h ${String(mm).padStart(2,'0')}m`:`${mm} min`;
}
function clockMin(m){
 const h=Math.floor(m/60), mm=m%60;
 return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function getTopicImage(t,c,slot=0){
 // Never treat a pedagogical visual category (e.g. "equipment-training")
 // as a real SVG filename. Select verified bundled assets by course/topic.
 return window.SAFETY_LOCAL_VISUALS_V32?.resolve?.(t,c,slot)||
   {src:'assets/general.svg',caption:'Schema generale di prevenzione'};
}

// Only original, additive diagrams. Never mutate authored content or frozen course data.
function topicAdditionalVisuals(course,topic){
 return window.SAFETY_VISUAL_ATLAS_V22?.collect?.(course,topic)||[];
}
function topicIllustrationsHtml(course,topic){
 const items=topicAdditionalVisuals(course,topic);
 if(!items.length)return '';
 return '<section class="section st-extra-illustrations" aria-label="Illustrazioni per l’argomento"><h3>🖼 Illustrazioni dell’argomento</h3><p class="muted">Schemi originali aggiuntivi per spiegare rischi e comportamenti sicuri. Le immagini didattiche già presenti restano disponibili.</p><div class="st-extra-grid">'+items.map(item=>'<figure class="st-extra-figure"><img loading="lazy" decoding="async" src="'+esc(item.src)+'" alt="'+esc(item.caption||topic.title)+'"><figcaption>'+esc(item.caption||'Schema didattico')+'</figcaption></figure>').join('')+'</div></section>';
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
function topicSecondImage(t,c){return getTopicImage(t,c,1);}
function topicThirdImage(t,c){return getTopicImage(t,c,2);}
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
       ...topicAdditionalVisuals(c,t),
       ...(window.SAFETY_GRAPHIC_PACK_02?.pick?.(c,t)||[]),
       ...(window.SAFETY_GRAPHIC_PACK_03?.pick?.(c,t)||[]),
       ...(window.SAFETY_GRAPHIC_PACK_01?.pick?.(c,t)||[])
     ];
     const pdfVisuals=window.SAFETY_SOURCE_VISUALS_V23?.pick?.(c,t)||[];
     const packVisuals=[...originalVisuals.slice(0,1),...pdfVisuals.slice(0,1),...originalVisuals.slice(1)].filter((visual,i,arr)=>arr.findIndex(v=>v.src===visual.src)===i).slice(0,3);
     // An authored course keeps its existing lead image; GP04 only enriches later image slots.
     const authoredMain=t.presentation_quality?.visual_mode==='authored'?getTopicImage(t,c):null;
     const img=authoredMain||packVisuals[0]||getTopicImage(t,c);
     const img2=packVisuals.find(v=>v.src!==img.src)||topicSecondImage(t,c);
     const img3=packVisuals.find(v=>v.src!==img.src&&v.src!==img2.src)||topicThirdImage(t,c);
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
       const graphicSource=file&&window.SAFETY_LOCAL_VISUALS_V32?.normalize?.(file);
       const graphicImage=graphicSource
         ?{src:graphicSource,caption:g.caption||''}
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
     digests.forEach((d,di)=>{
       const file=d?.image&&window.SAFETY_LOCAL_VISUALS_V32?.normalize?.(d.image);
       topicSlides.push({type:'sourceDigest',weight:.8,img:file?{src:file,caption:d.image_caption||''}:((di%2)?img2:img),digest:d,partIndex:di,title});
     });
     const video=t.video_moment||t.video_plan||null;
     if(video){
       const poster=video.visual&&window.SAFETY_LOCAL_VISUALS_V32?.normalize?.(video.visual);
       topicSlides.push({type:'video',weight:.8,img:poster?{src:poster,caption:''}:img,video,sourcePrompt:concise(video.before,3),sourceAfter:concise(video.after,3),sourceFocus:video.focus||'',caseSolution:concise(t.procedure||t.prevention,3),generalSolution:concise(t.prevention||t.good,3),title});
     }

     const trimmed=trimTopicSlides(topicSlides,t.minutes);
     const projectedSlides=window.SAFETY_VISUAL_ATLAS_V22?.distribute?.(c,t,trimmed)||trimmed;
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
 const d=cachedDeck(c); return d.findIndex(s=>s.type==='module'&&s.moduleIndex===mi);
}
window.deckGo=(cid,i)=>{setHash(`deck/${cid}/${Math.max(0,i)}`)};
window.resumeCourseDeck=cid=>{const c=getCourse(cid);if(!c)return;const saved=window.SAFETY_DECK_BOOKMARK_V42?.read?.(c,cachedDeck(c));if(saved)setHash('deck/'+c.id+'/'+saved.index);};
function continueCourseButton(c){if(!c||!window.SAFETY_DECK_BOOKMARK_V42?.has?.(c))return '';const saved=window.SAFETY_DECK_BOOKMARK_V42?.read?.(c,cachedDeck(c));if(!saved||saved.index<1)return '';return `<button type="button" class="deck-resume-btn" onclick="resumeCourseDeck('${esc(c.id)}')">▶ Riprendi dalla slide ${saved.number} / ${saved.total}</button>`;}
window.deckReveal=(id)=>{
 const el=document.getElementById(id); if(!el) return;
 el.classList.toggle('deck-hidden');
 const btn=document.querySelector(`[data-reveal="${id}"]`);
 if(btn) btn.textContent=el.classList.contains('deck-hidden')?'Mostra risposta':'Nascondi risposta';
};
/* v41: captions remain associated with each image in screen and printable deck. */
function slideVisualFigure(s,alt,extra=''){
 const extras=(s.visualGallery||[]).filter(x=>x?.src).slice(0,2);
 const primary={src:s.img?.src||'assets/general.svg',caption:s.img?.caption||alt||'Immagine di supporto'};
 if(!extras.length)return '<figure class="slide-visual '+extra+'"><img decoding="async" src="'+esc(primary.src)+'" alt="'+esc(alt||primary.caption)+'"><figcaption>'+esc(primary.caption)+'</figcaption></figure>';
 const figures=[primary,...extras].map((v,i)=>'<div class="st-slide-figure '+(i===0?'st-slide-main':'st-slide-extra')+'">'+
  '<img '+(i?'loading="eager" ':'')+'decoding="async" src="'+esc(v.src)+'" alt="'+esc(v.caption||('Figura '+(i+1)))+'">'+
  '<span class="st-slide-figure-caption">'+esc(v.caption||('Figura '+(i+1)))+'</span></div>').join('');
 return '<figure class="slide-visual st-multi-visual '+extra+'"><div class="st-slide-images">'+figures+'</div><figcaption class="st-gallery-label">Composizione illustrata · '+(extras.length+1)+' immagini</figcaption></figure>';
}
function deckSlideBody(s,index){
 const rid=`deck-answer-${index}`;
 const part=s.partTotal>1?` · ${s.partIndex+1}/${s.partTotal}`:'';
 if(s.type==='module'){
   return `<div class="slide-module"><img class="st-brand-course" src="assets/cna-avellino.png" alt="CNA Avellino"><div class="slide-kicker">MODULO ${s.moduleIndex+1}</div><h1>${esc(s.title)}</h1><div class="slide-time-big">${fmtMin(s.module.minutes)} · tempo corso ${clockMin(s.module.start_minute)}–${clockMin(s.displayEnd||s.module.end_minute)}</div><div class="module-topic-list">${s.topics.map((t,i)=>`<div><span>${i+1}</span><strong>${esc(slideTitle(t))}</strong><em>${t.minutes} min</em></div>`).join('')}</div></div>`;
 }
 if(s.type==='visualAtlas'){
   return '<div class="st-atlas-slide"><div class="slide-kicker">ATLANTE ILLUSTRATO · FIGURE AGGIUNTIVE</div><h1 class="st-atlas-heading">'+esc(s.title)+'</h1><div class="st-atlas-grid">'+(s.visuals||[]).map((v)=>'<figure><img decoding="async" src="'+esc(v.src)+'" alt="'+esc(v.caption)+'"><figcaption>'+esc(v.caption)+'</figcaption></figure>').join('')+'</div></div>';
 }
 if(s.type==='concept'){
   return `<div class="slide-grid slide-opening"><div class="slide-copy"><div class="slide-kicker">NUOVO ARGOMENTO</div><h1>${esc(s.title)}</h1><div class="opening-statement">${esc(s.summary)}</div></div>${slideVisualFigure(s,s.title,'hero-visual')}</div>`;
 }
 if(s.type==='explain'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">SPIEGAZIONE${part}</div><h1>${esc(s.title)}</h1><p class="slide-lead">${esc(s.explain)}</p>${s.points&&s.points.length?`<div class="takeaway"><strong>Da ricordare</strong>${listHtml(s.points)}</div>`:''}</div>${slideVisualFigure(s,s.title)}</div>`;
 }
 if(s.type==='deep'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">APPROFONDIMENTO</div><h1>${esc(s.title)}</h1><p class="slide-lead">${esc(s.paragraph||'')}</p>${s.story?`<div class="slide-callout"><strong>Esempio operativo</strong><br>${esc(s.story)}</div>`:''}${s.errors&&s.errors.length?`<div class="takeaway warning"><strong>Errori da evitare</strong>${listHtml(s.errors)}</div>`:''}</div>${slideVisualFigure(s,s.title)}</div>`;
 }
 if(s.type==='guided'){
   return `<div class="slide-kicker">LETTURA GUIDATA</div><h1>${esc(s.title)}</h1><div class="guided-project"><section><h2>👀 Osserva</h2>${listHtml(s.observe)}</section><section><h2>❓ Perché conta</h2>${listHtml(s.importance)}</section><section><h2>✅ Applica</h2>${listHtml(s.apply)}</section></div>`;
 }
 if(s.type==='graphic'){
   const g=s.graphic||{};
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">${esc(g.kicker||'SCHEMA GRAFICO')}</div><h1>${esc(g.title||s.title)}</h1><p class="slide-lead">${esc(g.text||'')}</p>${g.points&&g.points.length?`<div class="takeaway"><strong>Punti chiave</strong>${listHtml(g.points)}</div>`:''}</div>${slideVisualFigure(s,g.title||s.title,'graphic-visual')}</div>`;
 }
 if(s.type==='actionPlan'){
   return `<div class="slide-kicker">COSA FARE</div><h1>${esc(s.title)}</h1><div class="operational-slide-grid"><section><span>①</span><h2>Prima</h2>${listHtml(s.before||[])}</section><section><span>②</span><h2>Durante</h2>${listHtml(s.during||[])}</section><section><span>③</span><h2>Dopo</h2>${listHtml(s.after||[])}</section></div>${s.remember?`<div class="slide-memory"><strong>Regola da ricordare</strong> ${esc(s.remember)}</div>`:''}`;
 }
 if(s.type==='howTo'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">COME FARE</div><h1>${esc(s.title)}</h1><p class="slide-lead">${esc(s.objective||'')}</p><div class="big-list numbered">${stepsHtml(s.steps||[])}</div></div>${slideVisualFigure(s,'Procedura operativa')}</div>`;
 }
 if(s.type==='escalation'){
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">COME PROCEDERE SE QUALCOSA NON VA</div><h1>${esc(s.title)}</h1><div class="escalation-box"><h2>⛔ Fermati e gestisci</h2>${listHtml(s.problem||[])}</div><div class="escalation-mini"><div><strong>Quando fermarsi</strong>${listHtml(s.stop||[])}</div><div><strong>Chi coinvolgere</strong>${listHtml(s.who||[])}</div></div></div>${slideVisualFigure(s,'Stop, segnala, ripristina')}</div>`;
 }
 if(s.type==='risks'){
   return `<div class="slide-grid single-list"><div class="slide-copy"><div class="slide-kicker">RISCHI E POSSIBILI DANNI</div><h1>${esc(s.title)}</h1><div class="big-list">${listHtml(s.risks)}</div></div>${slideVisualFigure(s,s.title)}</div>`;
 }
 if(s.type==='prevention'){
   return `<div class="slide-grid single-list"><div class="slide-copy"><div class="slide-kicker">COME PREVENIRE</div><h1>${esc(s.title)}</h1><div class="big-list">${listHtml(s.prevention)}</div>${s.dpi&&s.dpi.length?`<div class="slide-bottom-strip"><strong>🥽 DPI / protezioni</strong><br>${s.dpi.map(esc).join(' · ')}</div>`:''}</div>${slideVisualFigure(s,s.title)}</div>`;
 }
 if(s.type==='procedure'){
   return `<div class="slide-grid single-list"><div class="slide-copy"><div class="slide-kicker">PROCEDURA OPERATIVA</div><h1>${esc(s.title)}</h1><div class="big-list numbered">${stepsHtml(s.procedure)}</div></div>${slideVisualFigure(s,s.title)}</div>`;
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
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">APPROFONDIMENTO · ${esc(d.source||'FONTE')}</div><h1>${esc(s.title)}</h1><h2 class="source-title">${esc(d.title||'Approfondimento')}</h2><p class="slide-lead source-summary">${esc(splitSentences(d.summary||'',230)[0]||'')}</p>${d.keypoints&&d.keypoints.length?`<div class="takeaway"><strong>Punti chiave</strong>${listHtml(concise(d.keypoints,3))}</div>`:''}</div>${slideVisualFigure(s,'Approfondimento')}</div>`;
 }
 if(s.type==='video'){
   const v=s.video||{};
   return `<div class="slide-grid"><div class="slide-copy"><div class="slide-kicker">MOMENTO VIDEO</div><h1>${esc(s.title)}</h1><div class="video-cue"><strong>🎬 ${esc(v.title||v.film||'Video Napo')}</strong>${v.scene?`<p>Scena consigliata: <b>${esc(v.scene)}</b></p>`:''}${v.when?`<p>${esc(v.when)}</p>`:''}</div>${s.sourcePrompt&&s.sourcePrompt.length?`<div class="takeaway"><strong>Prima di avviare il video</strong>${listHtml(s.sourcePrompt)}</div>`:''}<div class="video-button-row"><button class="deck-video-open" onclick="openDeckVideo(${index})">▶ Apri il video nel riquadro</button><button class="deck-reveal-btn" onclick="openDeckAnswer(${index})">Mostra spunti e spiegazione</button></div></div><button class="video-poster-button" onclick="openDeckVideo(${index})" title="Apri video"><figure class="slide-visual video-poster"><img src="${s.img.src}" alt="Apri ${esc(v.title||'video Napo')}"><div class="video-play-badge">▶</div><figcaption>${esc(v.click_hint||'Clicca l’immagine per aprire il video nel riquadro.')}</figcaption></figure></button></div>`;
 }
 return '';
}
// Read-only access to the exact presentation builders for visual printing.
window.SAFETY_DECK_RENDER={buildDeck,deckSlideBody};
