import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL")!;
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
const cors={"access-control-allow-origin":"*","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, x-client-info, apikey, content-type","access-control-max-age":"86400"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json",...cors}});
const email=(u:string)=>`${u.trim().toLowerCase()}@utino.chat`;
const valid=(u:string)=>/^[a-z0-9_]{3,20}$/.test(u);
Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{status:204,headers:cors});
  if(req.method!=="POST") return json({error:"method_not_allowed"},405);
  try{
    const h=req.headers.get("authorization")||"",token=h.startsWith("Bearer ")?h.slice(7):"";
    if(!token)return json({error:"unauthorized"},401);
    const{data:{user:caller},error:ce}=await admin.auth.getUser(token);
    if(ce||!caller)return json({error:"unauthorized"},401);
    const{data:cp,error:cpe}=await admin.from("profiles").select("id,role").eq("id",caller.id).single();
    if(cpe||cp?.role!=="admin")return json({error:"forbidden"},403);
    const b=await req.json(),action=String(b?.action||""),id=String(b?.user_id||"");
    if(action==="create_user"){
      const username=String(b?.username||"").trim().toLowerCase(),display_name=String(b?.display_name||username).trim(),password=String(b?.password||""),role=b?.role==="admin"?"admin":"user",verification=["blue","green","orange","red"].includes(b?.verification)?b.verification:"none",is_verified=verification!=="none";
      if(!valid(username))return json({error:"invalid_username"},400);
      if(password.length<6||password.length>128)return json({error:"weak_password"},400);
      if(!display_name||display_name.length>80)return json({error:"invalid_display_name"},400);
      const{data:existingProfile,error:lookupError}=await admin.from("profiles").select("id").eq("username",username).maybeSingle();
      if(lookupError)return json({error:"profile_lookup_failed",message:lookupError.message},500);
      if(existingProfile)return json({error:"username_exists"},409);
      const{data,error}=await admin.auth.admin.createUser({email:email(username),password,email_confirm:true,user_metadata:{username,display_name}});
      if(error||!data.user){const m=error?.message||"create_failed",lo=m.toLowerCase();return json({error:lo.includes("already")||lo.includes("exists")||lo.includes("duplicate")?"username_exists":"auth_create_failed",message:m},400)}
      const newUserId=data.user.id;
      const{error:pe}=await admin.from("profiles").update({username,display_name,role,is_verified,is_banned:false,banned_until:null,verification}).eq("id",newUserId);
      if(pe){await admin.auth.admin.deleteUser(newUserId);return json({error:pe.code==="23505"?"username_exists":"profile_create_failed",message:pe.message},400)}
      await admin.from("admin_logs").insert({admin_id:caller.id,action:"create_user",target_user_id:newUserId,details:{username,role,verification}});
      return json({ok:true,user_id:newUserId});
    }
    if(!id)return json({error:"missing_user_id"},400);
    if(action==="set_verification"){
      const verification=["blue","green","orange","red","none"].includes(b?.verification)?b.verification:"none";
      const{error}=await admin.from("profiles").update({verification,is_verified:verification!=="none"}).eq("id",id);if(error)return json({error:error.message},400);
      await admin.from("admin_logs").insert({admin_id:caller.id,action:"set_verification",target_user_id:id,details:{verification}});return json({ok:true});
    }
    if(action==="reset_password"){
      const password=String(b?.password||"");if(password.length<6||password.length>128)return json({error:"weak_password"},400);
      const{error}=await admin.auth.admin.updateUserById(id,{password});if(error)return json({error:"password_update_failed",message:error.message},400);
      await admin.from("admin_logs").insert({admin_id:caller.id,action:"reset_password",target_user_id:id});return json({ok:true});
    }
    if(action==="set_role"){
      const role=b?.role==="admin"?"admin":"user";if(id===caller.id&&role!=="admin")return json({error:"cannot_remove_own_admin"},400);
      const{error}=await admin.from("profiles").update({role}).eq("id",id);if(error)return json({error:error.message},400);
      await admin.from("admin_logs").insert({admin_id:caller.id,action:"set_role",target_user_id:id,details:{role}});return json({ok:true});
    }
    if(action==="ban"||action==="unban"){
      if(id===caller.id&&action==="ban")return json({error:"cannot_ban_self"},400);let until:null|string=null;
      if(action==="ban"){const raw=String(b?.duration||"permanent"),hours=raw==="1h"?1:raw==="24h"?24:raw==="7d"?168:raw==="30d"?720:0;until=hours?new Date(Date.now()+hours*3600000).toISOString():null;}
      const{error}=await admin.auth.admin.updateUserById(id,{ban_duration:action==="ban"?(until?`${Math.max(1,Math.ceil((new Date(until).getTime()-Date.now())/3600000))}h`:"876000h"):"none"});if(error)return json({error:error.message},400);
      const{error:pe}=await admin.from("profiles").update({is_banned:action==="ban",banned_until:until}).eq("id",id);if(pe)return json({error:pe.message},400);
      await admin.from("admin_logs").insert({admin_id:caller.id,action:action==="ban"?"ban_user":"unban_user",target_user_id:id,details:{duration:b?.duration||"permanent",banned_until:until}});return json({ok:true,banned_until:until});
    }
    if(action==="delete_user"){if(id===caller.id)return json({error:"cannot_delete_self"},400);const{error}=await admin.auth.admin.deleteUser(id);if(error)return json({error:error.message},400);await admin.from("admin_logs").insert({admin_id:caller.id,action:"delete_user",target_user_id:id});return json({ok:true});}
    return json({error:"unknown_action"},400);
  }catch(e){return json({error:e instanceof Error?e.message:"server_error"},500)}
});