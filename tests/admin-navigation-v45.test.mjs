import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('v45 admin UI shares menu, filter and popup surface styles without new route logic',()=>{
 const css=read('apps/training/admin-visual-v45.css');
 for(const s of ['.admin-shell .admin-nav nav .admin-menu-group','.admin-list-tools','.admin-list-search','.admin-row-btn','.admin-modal-overlay','.admin-modal-close',':focus-visible','min-height:44px'])assert.ok(css.includes(s),s);
 const menu=read('apps/training/admin-menu-v39.js'),admin=read('apps/training/admin.js');
 assert.ok(menu.includes('SAFETY_ADMIN_MENU_V39'));
 assert.ok(admin.includes("const jump=e.target.closest('[data-jump]')"));
});
test('v45 final handoffs and service worker share same cache id',()=>{
 const sw=read('apps/training/sw.js'),cache=/const CACHE='([^']+)'/.exec(sw)?.[1];
 assert.equal(cache,'safety-training-v45-ui-navigation');
 for(const p of ['docs/SAFETYTRAINING_HANDOFF.md','docs/SAFETYTRAINING_HANDOFF_LATEST.md']){
  const c=read(p);
  assert.ok(c.slice(0,800).includes(cache),p);
  assert.ok(c.includes('v45 — Tranche 3: filtri, popup e navigazione'),p);
  assert.ok(c.includes('27 catalog entry frozen'),p);
 }
});
