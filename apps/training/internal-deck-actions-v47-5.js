/* v47.5. Preserve the original slide HTML while making its legacy onclick controls
   functional under the strict script-src 'self' CSP of the link-only reader.
   Whitelist exact known actions; never evaluate or execute arbitrary attributes. */
(()=>{'use strict';
 document.addEventListener('click',event=>{
  const button=event.target?.closest?.('button[onclick]');
  if(!button||!button.closest?.('#internalApp, #answerOverlay, #videoOverlay'))return;
  const action=String(button.getAttribute('onclick')||'').trim();
  let invoke=null;
  const answer=/^openDeckAnswer\(([0-9]+)\)$/.exec(action);
  const video=/^openDeckVideo\(([0-9]+)\)$/.exec(action);
  if(answer)invoke=()=>window.openDeckAnswer?.(Number(answer[1]));
  else if(video)invoke=()=>window.openDeckVideo?.(Number(video[1]));
  else if(action==='closeAnswerOverlay()')invoke=()=>window.closeAnswerOverlay?.();
  else if(action==='closeVideoPlayer()')invoke=()=>window.closeVideoPlayer?.();
  else if(/^resumeCourseDeck\('[^']+'\)$/.test(action))invoke=()=>window.SAFETY_INTERNAL_SLIDE_V47_3?.resume?.();
  if(!invoke)return;
  // Capturing before the target-phase blocks the inline handler (already denied
  // by CSP) and prevents duplicate actions should browser behavior differ.
  button.removeAttribute('onclick');
  event.preventDefault();
  event.stopPropagation();
  invoke();
 },true);
})();