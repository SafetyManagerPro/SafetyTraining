import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=read('apps/training/admin-internal-v47.js');
const sql=read('supabase/migrations/20261103103712_v47_7_internal_progress_detail.sql');
const style=read('apps/training/admin-internal-v47.css');

test('resending remains available after reopening admin page and never exposes previous token',()=>{
 assert.match(ui,/Reinvia link/);
 assert.match(ui,/data-internal-rotate/);
 assert.match(ui,/internal_admin_link_v47/);
 assert.match(ui,/p_token_hash:await tokenHash\(token\)/);
 assert.match(ui,/Il link è pronto|link è pronto|Nuovo link pronto/);
 assert.match(ui,/precedente smetterà di funzionare/);
 assert.match(ui,/Le slide già viste e i progressi resteranno invariati/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
 assert.match(ui,/scrollIntoView/);
 assert.match(ui,/id="iv47EmailLink">Prepara email/);
 assert.match(ui,/conferma tu l’invio/);
 assert.match(ui,/navigator\.share/);
 assert.match(ui,/navigator\.clipboard\.writeText\(state\.link\)/);
});

test('authorized admin sees percentage, last exact slide, current module/topic, last activity and refresh',()=>{
 for(const label of ['Ultima posizione: ','Aggiorna progressi','Progressi aggiornati','Assegnato: '])
  assert.ok(ui.includes(label),'missing dashboard field: '+label);
 assert.match(ui,/lastSlide\(a\)/);
 assert.match(ui,/currentTopic\(a\)/);
 assert.match(ui,/a\.last_activity_at\|\|a\.last_opened_at/);
 assert.match(ui,/state\.search=event\.target\.value;paintRows\(\)/);
 assert.match(ui,/value="\x27\+esc\(state\.search\)/);
 assert.match(sql,/'current_unit_title'/);
 assert.match(sql,/'current_module_title'/);
 assert.match(sql,/'last_activity_at',greatest\(/);
 assert.match(sql,/max\(ss\.last_viewed_at\)/);
 assert.match(sql,/max\(x\.last_viewed_at\)/);
 assert.match(sql,/a\.last_opened_at/);
 assert.match(sql,/lu\.title/);
 assert.match(sql,/m\.course_version_id=a\.course_version_id/);
 assert.match(sql,/private\.can_manage_training_org/);
 assert.match(sql,/grant execute on function public\.internal_admin_state_v47\(uuid\) to authenticated/);
 assert.doesNotMatch(sql,/\b(?:alter|drop|delete|truncate|update|insert)\s+(?:table\s+)?(?:public|private)\./i);
 assert.match(style,/iv47-progress-detail/);
});

test('link reinvite dynamically rotates hash, preserves known progress and exposes fresh link in the admin panel',async()=>{
 const mockedAssignment={id:'assignment-1',person_id:'person-1',course_version_id:'cv-1',
  first_name:'Giulia',last_name:'Bianchi',fiscal_code:'BNCGLL90A01H501Q',
  email:'example@example.invalid',course_title:'Corso interno',
  version_number:1,active:true,visited_slides:12,total_slides:40,last_slide_index:16,
  last_activity_at:'2026-11-03T10:05:00Z',current_module_title:'Modulo A',
  current_unit_title:'Argomento B',visited_count:4,total_units:10,
  started_at:'2026-11-03T10:00:00Z',created_at:'2026-11-02T10:00:00Z'};
 const data={organization_id:'org-1',organizations:[{id:'org-1',name:'Test'}],
  courses:[{version_id:'cv-1',title:'Corso interno',version_number:1,unit_count:10}],
  people:[],assignments:[mockedAssignment]};
 const calls=[], root={innerHTML:'',querySelectorAll:()=>[]},rows={innerHTML:'',querySelectorAll:()=>[]};
 let scrollCount=0;
 let failRefresh=false;
 const document={
  readyState:'loading',addEventListener:()=>{},
  querySelector:()=>null,
  getElementById:id=>id==='adminContent'?root:id==='iv47Rows'?rows:id==='iv47LinkCard'?{
   scrollIntoView:()=>{scrollCount++;}
  }:null
 };
 const window={
  SAFETY_CLOUD:{state:{client:{rpc:async(name,args)=>{
   calls.push({name,args});
   if(name==='internal_admin_state_v47'&&failRefresh)return {data:null,error:{message:'server temporarily unavailable'}};
   return {data:name==='internal_admin_state_v47'?data:{active:true},error:null};
  }}}},
  SAFETY_ACCESS_V46_10:{state:{phase:'admin'}},
  SAFETY_ADMIN_MENU_V39:{reconcile:()=>{}},
 };
 const source=ui.replace('window.SAFETY_INTERNAL_V47={open};',
  'window.__testState={state,rotate,percent,lastSlide,currentTopic};window.SAFETY_INTERNAL_V47={open};');
 assert.notEqual(source,ui,'test seam must be inserted');
 runInNewContext(source,{window,document,navigator:{},crypto:webcrypto,btoa,TextEncoder,
  confirm:()=>true,alert:()=>{},console});
 const {state,rotate,percent,lastSlide,currentTopic}=window.__testState;
 state.open=true;state.org='org-1';state.data=data;
 assert.equal(percent(mockedAssignment),30);
 assert.equal(lastSlide(mockedAssignment),'Slide 17 di 40');
 assert.equal(currentTopic(mockedAssignment),'Modulo A › Argomento B');
 await rotate('assignment-1');
 const link1=state.link;
 assert.ok(link1,'Resend must make a link visible; state: '+String(state.notice));
 assert.match(link1,/^https:\/\/safety-training-safety-manager\.vercel\.app\/interno\.html#t=[A-Za-z0-9_-]{43}$/);
 assert.match(rows.innerHTML,/Reinvia link/);
 assert.match(rows.innerHTML,/Ultima posizione: Slide 17 di 40/);
 assert.match(rows.innerHTML,/Modulo A › Argomento B/);
 assert.match(rows.innerHTML,/12\/40 slide aperte/);
 assert.ok(scrollCount>0);
 const sent1=calls.find(x=>x.name==='internal_admin_link_v47');
 assert.equal(sent1.args.p_assignment_id,'assignment-1');
 assert.match(sent1.args.p_token_hash,/^[a-f0-9]{64}$/);
 assert.equal(state.data.assignments[0].last_slide_index,16);
 // Simulate a later revisit: plaintext links are NOT persisted in state.
 state.link='';state.data=data;
 await rotate('assignment-1');
 const link2=state.link;
 assert.notEqual(link2,link1);
 const updates=calls.filter(x=>x.name==='internal_admin_link_v47');
 assert.equal(updates.length,2);
 assert.notEqual(updates[0].args.p_token_hash,updates[1].args.p_token_hash);
 assert.equal(state.data.assignments[0].visited_slides,12);
 assert.equal(state.data.assignments[0].last_slide_index,16);
 // A failed dashboard refresh must not hide the freshly rotated access link.
 failRefresh=true;
 const previous=state.link;
 await rotate('assignment-1');
 assert.notEqual(state.link,previous);
 assert.ok(root.innerHTML.includes(state.link),'new link must already be in the panel before the failed refresh');
 assert.match(state.notice,/Il nuovo link è disponibile nel pannello/);
 assert.equal(calls.filter(x=>x.name==='internal_admin_link_v47').length,3);
 assert.equal(state.data.assignments[0].visited_slides,12);
});
