/* SafetyTraining v20 — resilient external media handling.
   Direct video is attempted first. If the source is unavailable or blocked,
   the learner/teacher always gets an explicit link to the official page.
   We intentionally do not rely on third-party pages being embeddable in iframes. */
(function(){
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const safeHttpUrl = (value) => {
    if(!value) return '';
    try {
      const url = new URL(String(value), window.location.href);
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : '';
    } catch (_) { return ''; }
  };
  const externalLink = (page, label='Apri la fonte ufficiale ↗') => {
    const href=safeHttpUrl(page);
    return href ? `<a class="openbtn media-external-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : '';
  };

  window.closeVideoPlayer = () => {
    const overlay=document.getElementById('videoOverlay');
    if(overlay) overlay.remove();
  };

  window.videoPlayerFallback = (page,title,reason='La riproduzione diretta non è disponibile su questo dispositivo o dalla fonte esterna.') => {
    const body=document.getElementById('videoModalBody');
    if(!body) return;
    const href=safeHttpUrl(page);
    body.innerHTML=`<div class="video-fallback media-safe-fallback">
      <div class="media-fallback-icon">↗</div>
      <h3>${escapeHtml(title || 'Materiale multimediale')}</h3>
      <p>${escapeHtml(reason)}</p>
      ${href ? `<p>Il materiale resta fruibile dalla pagina ufficiale, aperta in una nuova scheda.</p>${externalLink(href)}` : '<p>Non è disponibile un collegamento alternativo verificabile. Segnalare la risorsa al docente/amministratore.</p>'}
    </div>`;
  };

  window.openVideoPlayer = (media,page,title,scene) => {
    window.closeVideoPlayer();
    const mediaUrl=safeHttpUrl(media), pageUrl=safeHttpUrl(page);
    const overlay=document.createElement('div');
    overlay.id='videoOverlay';
    overlay.className='video-overlay';
    const safeTitle=escapeHtml(title || 'Materiale multimediale');
    const safeScene=escapeHtml(scene || '');
    overlay.innerHTML=`<div class="video-modal" role="dialog" aria-modal="true" aria-label="Materiale multimediale">
      <div class="video-modal-head"><div><span>MATERIALE DIDATTICO</span><h2>${safeTitle}</h2>${safeScene?`<p>${safeScene}</p>`:''}</div><button class="video-close" type="button" onclick="closeVideoPlayer()" aria-label="Chiudi">×</button></div>
      <div class="video-modal-body" id="videoModalBody"></div>
      <div class="video-modal-foot"><span id="mediaPlayerStatus">${mediaUrl?'Tentativo di riproduzione diretta dalla fonte ufficiale.':'Apri il materiale sulla fonte ufficiale.'}</span>${pageUrl?externalLink(pageUrl,'Apri sul sito ufficiale ↗'):''}</div>
    </div>`;
    overlay.addEventListener('click',event=>{if(event.target===overlay) window.closeVideoPlayer();});
    document.body.appendChild(overlay);

    const body=overlay.querySelector('#videoModalBody');
    if(!mediaUrl){
      window.videoPlayerFallback(pageUrl,title,'Questa risorsa non espone un file video diretto affidabile per il player interno.');
      return;
    }

    const video=document.createElement('video');
    video.id='napoVideo';
    video.className='video-player';
    video.controls=true;
    video.playsInline=true;
    video.preload='metadata';
    video.setAttribute('controlsList','nodownload');
    const source=document.createElement('source');
    source.src=mediaUrl;
    source.type='video/mp4';
    video.appendChild(source);
    video.appendChild(document.createTextNode('Il browser non riesce a riprodurre questo video.'));
    body.replaceChildren(video);

    let failed=false;
    const fallback=(message)=>{
      if(failed) return;
      failed=true;
      window.videoPlayerFallback(pageUrl,title,message);
    };
    video.addEventListener('loadedmetadata',()=>{
      const status=document.getElementById('mediaPlayerStatus');
      if(status) status.textContent='Video caricato dalla fonte ufficiale.';
    },{once:true});
    video.addEventListener('error',()=>fallback('Il file video diretto non è raggiungibile oppure non è riproducibile dal browser.'));
    source.addEventListener('error',()=>fallback('La fonte diretta del video ha restituito un errore.'));
    try {
      const playPromise=video.play();
      if(playPromise && typeof playPromise.catch==='function') playPromise.catch(()=>{/* autoplay may be blocked: controls remain usable */});
    } catch (_) {/* controls remain usable */}
  };

  /* Add a graceful error state to didactic images without hiding the text content. */
  document.addEventListener('error', event => {
    const img=event.target;
    if(!(img instanceof HTMLImageElement)) return;
    if(img.dataset.assetFallback==='1') return;
    // A genuinely missing local file gets a clearly labelled neutral diagram,
    // while print previews retain their strict image-readiness preflight.
    if(window.SAFETY_LOCAL_VISUALS_V32?.recoverBrokenLocalImage?.(img))return;
    img.dataset.assetFallback='1';
    img.classList.add('asset-unavailable');
    img.alt=(img.alt ? img.alt+' — ' : '')+'immagine non disponibile';
  }, true);
})();
