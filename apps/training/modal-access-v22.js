/* SafetyTraining v22.2 — focus trap, layered-dialog isolation and Escape handling. */
(() => {
'use strict';
const previous=new WeakMap();
const stack=[];
const active=root=>[...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
const visible=root=>!!root?.isConnected&&!root.classList.contains('hidden')&&root.getClientRects().length>0;
function prune(){for(let i=stack.length-1;i>=0;i--)if(!visible(stack[i].root))stack.splice(i,1);}
function syncLayers(){
  prune();
  stack.forEach((entry,index)=>{
    const top=index===stack.length-1;
    entry.root.toggleAttribute('inert',!top);
    if(top)entry.root.removeAttribute('aria-hidden');else entry.root.setAttribute('aria-hidden','true');
  });
}
function opened(root,close){
  if(!root)return;
  const existing=stack.findIndex(entry=>entry.root===root);
  if(existing>=0)stack.splice(existing,1);
  previous.set(root,document.activeElement);
  stack.push({root,close:typeof close==='function'?close:null});
  syncLayers();
  active(root)[0]?.focus();
}
function closed(root){
  if(!root)return;
  const index=stack.findIndex(entry=>entry.root===root);
  const wasTop=index===stack.length-1;
  if(index>=0)stack.splice(index,1);
  root.removeAttribute('inert');root.removeAttribute('aria-hidden');
  const prev=previous.get(root);previous.delete(root);
  syncLayers();
  if(wasTop){
    const next=stack.at(-1)?.root;
    if(next)active(next)[0]?.focus();
    else if(prev?.isConnected)prev.focus();
  }
}
function closeTop(){
  syncLayers();
  const entry=stack.at(-1);if(!entry)return false;
  if(entry.close){entry.close();return true;}
  const button=active(entry.root).find(el=>el.matches('[aria-label="Chiudi"],.ai-close,.cloud-close,.final-test-close,.gate-admin-close,.pf22-close'));
  if(button){button.click();return true;}
  return false;
}
document.addEventListener('keydown',e=>{
  syncLayers();
  const top=stack.at(-1)?.root;if(!top)return;
  if(e.key==='Escape'){if(closeTop()){e.preventDefault();e.stopImmediatePropagation();}return;}
  if(e.key!=='Tab')return;
  const items=active(top);if(!items.length)return;
  if(!top.contains(document.activeElement)){e.preventDefault();items[0].focus();return;}
  if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}
  else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}
},true);
new MutationObserver(syncLayers).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.SAFETY_MODAL_ACCESS={opened,closed,closeTop};
})();
