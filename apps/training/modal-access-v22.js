/* SafetyTraining v22.2 — focus trap and return to launcher for layered dialogs. */
(() => {
'use strict';
const previous=new WeakMap();
const active=root=>[...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
function opened(root){if(!root)return;previous.set(root,document.activeElement);active(root)[0]?.focus();}
function closed(root){const prev=root&&previous.get(root);if(prev?.isConnected)prev.focus();if(root)previous.delete(root);}
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const top=['practiceFormV22','gateAdminOverlay','finalTestOverlay'].map(id=>document.getElementById(id)).find(el=>el&&!el.classList.contains('hidden'));
  if(!top)return;
  const items=active(top);if(!items.length)return;
  if(!top.contains(document.activeElement)){e.preventDefault();items[0].focus();return;}
  if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus();}
  else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus();}
},true);
window.SAFETY_MODAL_ACCESS={opened,closed};
})();
