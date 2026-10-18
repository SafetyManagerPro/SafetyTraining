import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const sandbox={window:{}};
runInNewContext(readFileSync(new URL('../apps/training/learner-navigation-v22.js',import.meta.url),'utf8'),sandbox);
const nav=sandbox.window.SAFETY_LEARNER_NAV_V22;
const now=Date.parse('2026-10-18T12:00:00Z');
const base=[
  {id:'one',courseStableKey:'general',status:'in_progress'},
  {id:'two',courseStableKey:'special-db',status:'not_started'},
  {id:'three',courseStableKey:'revoked',status:'revoked'},
  {id:'four',courseStableKey:'future',status:'not_started',availableFrom:'2026-10-22T12:00:00Z'},
  {id:'five',courseStableKey:'expired',status:'in_progress',availableUntil:'2026-10-01T12:00:00Z'}
];

test('uses stable keys rather than menu button positions, including DB-only courses',()=>{
  assert.equal(nav.assigned(base,'special-db',now)?.id,'two');
  assert.equal(nav.assigned(base,'general',now)?.id,'one');
  assert.equal(nav.assigned(base,'outside',now),null);
});
test('blocks revoked, future and expired enrollments',()=>{
  for(const key of ['revoked','future','expired'])assert.equal(nav.assigned(base,key,now),null);
});
test('allows valid course, topic and presentation deep links',()=>{
  for(const hash of ['#course/special-db','#topic/special-db/unit-1','#deck/general/0','#lab/general','#resources/general']) {
    assert.equal(nav.allowedRoute(hash,base,now),true,hash);
  }
});
test('denies unassigned deep links and technical library routes',()=>{
  for(const hash of ['#course/outside','#topic/revoked/one','#course/future','#course/expired','#library/general','#deck/outside/0','#invalid/anything']) {
    assert.equal(nav.allowedRoute(hash,base,now),false,hash);
  }
});
test('normalizes encoded stable keys and resists malformed URLs',()=>{
  assert.equal(nav.route('#course/course%2D1').key,'course-1');
  assert.equal(nav.allowedRoute('#course/%E0%A4%A',base,now),false);
});
test('marks completed assigned courses as reviewable',()=>{
  assert.equal(nav.access({courseStableKey:'a',status:'completed'},now).usable,true);
  assert.equal(nav.access({courseStableKey:'a',status:'passed'},now).label,'Rivedi percorso');
});
