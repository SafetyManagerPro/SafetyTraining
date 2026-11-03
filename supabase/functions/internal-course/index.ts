import {createClient} from 'jsr:@supabase/supabase-js@2';

// v47: the only unauthenticated surface. A 256-bit bearer link grants access to
// ONE explicitly assigned, published course. SQL RPCs are service-role-only.
const APP_ORIGIN='https://safety-training-safety-manager.vercel.app';
const plainKeys=[
 'title','slide_title','summary','detail','minutes','risks','prevention','procedure',
 'steps','step_by_step','dpi','ppe','good','bad','case','question','norm','guided',
 'deepdetail','idea_images','visuals','graphic_cards','common_errors','example_story',
 'teaching_steps','operational','resources','evidence_sources','focus','source_digest',
 'source_integration_note','delivery_note','video','media',
 'teacher_expansion','discussion_feedback','video_moment','video_plan','icon','quality',
 'normative_basis','didactic_version','teacher_notes','source_group'
];
const headers=(origin:string|null):Record<string,string>=>({
 'Access-Control-Allow-Origin':origin===APP_ORIGIN?APP_ORIGIN:APP_ORIGIN,
 'Access-Control-Allow-Methods':'POST, OPTIONS',
 'Access-Control-Allow-Headers':'content-type, apikey',
 'Cache-Control':'no-store, private',
 'Referrer-Policy':'no-referrer',
 'X-Content-Type-Options':'nosniff',
 'Vary':'Origin'
});
const answer=(body:unknown,status=200,origin:string|null=null)=>new Response(
 JSON.stringify(body),{status,headers:{...headers(origin),'Content-Type':'application/json; charset=utf-8'}}
);
function filterContent(value:unknown){
 const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const out:Record<string,unknown>={};
 for(const key of plainKeys)if(Object.prototype.hasOwnProperty.call(raw,key))out[key]=raw[key];
 // The original authored slide renderer includes its own self-check/reveal slides.
 // Preserve the quiz object exactly as in the published Learning Unit, without
 // exposing editorial notes outside the slide fields selected above.
 const quiz=raw.quiz&&typeof raw.quiz==='object'&&!Array.isArray(raw.quiz)?raw.quiz:null;
 if(quiz)out.quiz=quiz;
 return out;
}
function limitCourse(data:any){
 const modules=Array.isArray(data?.modules)?data.modules:[];
 return {
  person_first_name:data?.person_first_name||'',
  course:data?.course||{},
  modules:modules.map((m:any)=>({
   title:m?.title||'Modulo', module_key:m?.module_key||'',
   position:Number(m?.position||0),nominal_minutes:Number(m?.nominal_minutes||0),
   units:(Array.isArray(m?.units)?m.units:[]).map((unit:any)=>({
    unit_id:unit?.unit_id,stable_key:unit?.stable_key||unit?.unit_id,
    title:unit?.title||'Unità didattica',position:Number(unit?.position||0),
    default_minutes:Number(unit?.default_minutes||0),
    metadata:unit?.metadata||{},source_group:unit?.source_group||'',
    content:filterContent(unit?.content)
   }))
  })),
  progress_pct:Number(data?.progress_pct||0),
  visited_unit_ids:Array.isArray(data?.visited_unit_ids)?data.visited_unit_ids:[],
  visited_count:Number(data?.visited_count||0),total_units:Number(data?.total_units||0),
  last_unit_version_id:data?.last_unit_version_id||null,
  last_slide_index:Number.isInteger(data?.last_slide_index)?data.last_slide_index:null,
  total_slides:Number(data?.total_slides||0),visited_slides:Number(data?.visited_slides||0)
 };
}
const hex=async (token:string)=>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
};
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin');
 if(req.method==='OPTIONS')return new Response('ok',{headers:headers(origin)});
 if(req.method!=='POST')return answer({error:'method_not_allowed'},405,origin);
 if(origin&&origin!==APP_ORIGIN)return answer({error:'origin_not_allowed'},403,origin);
 if(Number(req.headers.get('content-length')||0)>2048)return answer({error:'invalid_request'},413,origin);
 try{
  const body=await req.json().catch(()=>null);
  const action=String(body?.action||'open');
  const token=String(body?.token||'');
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)||!['open','visit','slide'].includes(action)){
   return answer({error:'invalid_or_revoked_link'},404,origin);
  }
  const url=Deno.env.get('SUPABASE_URL')||'';
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!secret)return answer({error:'service_unavailable'},503,origin);
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const hash=await hex(token);
  if(action==='slide'){
   const slideIndex=Number(body?.slide_index);
   const totalSlides=Number(body?.total_slides);
   const unitId=body?.unit_id==null?null:String(body.unit_id);
   if(!Number.isInteger(slideIndex)||!Number.isInteger(totalSlides)||totalSlides<1||totalSlides>5000||slideIndex<0||slideIndex>=totalSlides||
     (unitId!==null&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unitId))){
     return answer({error:'invalid_slide'},400,origin);
   }
   const {data,error}=await db.rpc('internal_link_slide_v47_3',{p_token_hash:hash,p_slide_index:slideIndex,
     p_total_slides:totalSlides,p_unit_version_id:unitId});
   if(error)return answer({error:'invalid_or_revoked_link'},404,origin);
   return answer({status:'recorded',progress:data},200,origin);
  }
  if(action==='visit'){
   const id=String(body?.unit_id||'');
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)){
    return answer({error:'invalid_unit'},400,origin);
   }
   const {data,error}=await db.rpc('internal_link_visit_v47',{p_token_hash:hash,p_unit_version_id:id});
   if(error)return answer({error:'invalid_or_revoked_link'},404,origin);
   return answer({status:'recorded',progress:data},200,origin);
  }
  const {data,error}=await db.rpc('internal_link_open_v47',{p_token_hash:hash});
  if(error||!data)return answer({error:'invalid_or_revoked_link'},404,origin);
  return answer({status:'ready',course:limitCourse(data)},200,origin);
 }catch(_error){
  // Never log link tokens or course contents.
  return answer({error:'service_unavailable'},503,origin);
 }
});
