import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admin=read('apps/training/admin.js');
const invite=read('apps/training/admin-access-import-v21.js');
const migration=read('supabase/migrations/20261017052954_v21_022_qualify_invite_crypto_extensions.sql');

test('the resend/invite button is offered to active learners without an account, even without email',()=>{
 assert.match(admin,/\$\{x\.active&&!x\.auth_user_id\?btn\(inv\?'Reinvia':'Invita','invite-learner',x\.id\):''\}/);
 assert.doesNotMatch(admin,/x\.email&&!x\.auth_user_id\?btn\(inv\?'Reinvia'/);
});

test('the list warning no longer says learners without email cannot receive a link',()=>{
 assert.doesNotMatch(admin,/non può ricevere l’invito di accesso/);
 assert.match(admin,/Copia link o QR code/);
});

test('the invite dialog defaults to a channel that needs no contact when there is no email',()=>{
 assert.match(invite,/if\(!l\.email\) ov\.querySelector\('#aiChannel'\)\.value='manual';/);
});

test('the dialog explains what each channel needs before it contacts the server',()=>{
 for(const label of ['Email (serve l’email)','WhatsApp (serve il telefono)','SMS (serve il telefono)',
  'Copia link (nessun contatto richiesto)','QR code (nessun contatto richiesto)'])assert.ok(invite.includes(label),label);
 const emailCheck=invite.indexOf("if(channel==='email'&&!email) throw");
 const phoneCheck=invite.indexOf("if((channel==='whatsapp'||channel==='sms')&&!phone) throw");
 const save=invite.indexOf('await saveContact(l.id,email,phone);');
 assert.ok(emailCheck>0&&phoneCheck>0&&save>0);
 assert.ok(emailCheck<save&&phoneCheck<save,'validation must run before any contact is saved');
});

test('the server only requires an email for the email channel (copy link and QR need none)',()=>{
 assert.match(migration,/if v_channel='email' and nullif\(btrim\(coalesce\(v_l\.email,''\)\),''\) is null then raise exception 'learner_email_required'/);
 assert.match(migration,/if v_channel in \('whatsapp','sms'\) and nullif\(btrim\(coalesce\(v_l\.phone,''\)\),''\) is null then raise exception 'learner_phone_required'/);
});
