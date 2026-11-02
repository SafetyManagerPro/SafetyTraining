import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type',
 'Access-Control-Allow-Methods':'POST, OPTIONS',
 'Cache-Control':'no-store'
};
function reply(body:unknown,status=200){
 return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json; charset=utf-8'}});
}
function temporaryPassword(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
 const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
 const chars=Array.from(bytes,x=>alphabet[x%alphabet.length]);
 // Force a mix of all categories even if crypto happened not to choose one.
 chars[0]='A';chars[1]='m';chars[2]='7';chars[3]='!';
 return chars.join('');
}
Deno.serve(async(request:Request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL')||'';
  const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
  const header=request.headers.get('Authorization')||'';
  const token=header.replace(/^Bearer\s+/i,'').trim();
  if(!url||!serviceRole||!anonKey)return reply({error:'server_not_configured'},503);
  if(!token||token===header)return reply({error:'authentication_required'},401);
  const admin=createClient(url,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:auth,error:authError}=await admin.auth.getUser(token);
  if(authError||!auth?.user)return reply({error:'invalid_session'},401);
  const body=await request.json().catch(()=>({}));
  const action=String(body?.action||'activate');
  const learnerId=String(body?.learner_id||'');
  if(!['activate','reset'].includes(action))return reply({error:'unsupported_action'},400);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(learnerId)){
   return reply({error:'invalid_learner_id'},400);
  }
  // This call executes as the actual administrator; the RPC checks the learner's
  // organization and rejects users who lack its training-management role.
  const scoped=createClient(url,anonKey,{global:{headers:{Authorization:header}},auth:{persistSession:false,autoRefreshToken:false}});
  const prepare=await scoped.rpc('admin_prepare_learner_access_v46_11',{p_learner_id:learnerId});
  if(prepare.error)return reply({error:'not_authorized_or_invalid',message:String(prepare.error.message||'').slice(0,160)},403);
  const p=prepare.data||{};
  if(p.learner_id!==learnerId||!p.email)return reply({error:'learner_not_available'},409);
  if(action==='reset'&&!p.linked)return reply({error:'account_not_active',message:'Attiva prima l’accesso del corsista.'},409);
  if(action==='activate'&&p.linked)return reply({error:'already_active',message:'Account già collegato. Usa Reimposta password.'},409);
  let authId=String(p.auth_user_id||'');
  const password=temporaryPassword();
  let created=false;
  if(!authId){
   const result=await admin.auth.admin.createUser({
    email:p.email,password,email_confirm:true,
    user_metadata:{safety_training_internal_account:true,learner_id:learnerId}
   });
   if(result.error||!result.data?.user?.id){
    return reply({error:'create_auth_failed',message:String(result.error?.message||'Impossibile creare l’account.').slice(0,180)},409);
   }
   authId=result.data.user.id;
   created=true;
  }
  // Link only after server-side validation of verified email, exact organization,
  // uniqueness of ownership and absence of conflicting privileged accounts.
  if(!p.linked){
   const linked=await scoped.rpc('admin_bind_learner_access_v46_11',{p_learner_id:learnerId,p_auth_user_id:authId});
   if(linked.error){
    if(created)await admin.auth.admin.deleteUser(authId).catch(()=>{});
    return reply({error:'account_link_failed',message:String(linked.error.message||'Collegamento non riuscito.').slice(0,180)},409);
   }
  }
  if(!created){
   const updated=await admin.auth.admin.updateUserById(authId,{password});
   if(updated.error)return reply({error:'password_update_failed',message:String(updated.error.message||'Riprova il reset.').slice(0,180)},500);
   if(p.linked){
    // Reuse audited administrative binder for password rotation without storing the secret.
    await scoped.rpc('admin_bind_learner_access_v46_11',{p_learner_id:learnerId,p_auth_user_id:authId});
   }
  }
  // Never persist or log the temporary password. It is delivered once over HTTPS,
  // only to an authenticated and scope-checked administrator.
  return reply({status:'ready',action,email:p.email,temporary_password:password,linked:true});
 }catch(error){
  console.error('[learner-access] operation failed without credentials');
  return reply({error:'internal_error',message:'Servizio temporaneamente non disponibile.'},500);
 }
});
