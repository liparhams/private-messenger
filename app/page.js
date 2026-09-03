"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jcblfgrcsgbdeamogzfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const AUTH_DOMAIN = "utino.chat";

const FA = { brand:"Messenger", tagline:"پیام‌رسان", login:"ورود", username:"نام کاربری", password:"رمز عبور", signIn:"ورود به حساب", wait:"در حال ورود...", support:"ثبت‌نام آزاد نیست. برای ساخت حساب با پشتیبانی در ارتباط باش.", invalidUser:"نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، عدد یا _ باشد.", shortPassword:"رمز عبور باید حداقل ۶ کاراکتر باشد.", invalidLogin:"نام کاربری یا رمز عبور اشتباه است.", network:"ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن.", generic:"ورود انجام نشد. دوباره تلاش کن." };
const EN = { brand:"Messenger", tagline:"Messaging platform", login:"Sign in", username:"Username", password:"Password", signIn:"Sign in", wait:"Signing in...", support:"Public registration is disabled. Contact support to create an account.", invalidUser:"Username must be 3–20 characters and use only letters, numbers, or _.", shortPassword:"Password must be at least 6 characters.", invalidLogin:"Incorrect username or password.", network:"Could not connect to the server. Check your internet connection.", generic:"Sign-in failed. Please try again." };

function usernameEmail(value) { return `${value.trim().toLowerCase()}@${AUTH_DOMAIN}`; }

export default function Page() {
  const [lang,setLang]=useState("fa");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const t=lang==="fa"?FA:EN;

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(({data})=>{
      if(active && data.session) window.location.replace("/messenger/");
    });
    return ()=>{active=false};
  },[]);

  async function login(e){
    e?.preventDefault();
    setError("");
    const u=username.trim().toLowerCase();
    if(!/^[a-z0-9_]{3,20}$/.test(u)){setError(t.invalidUser);return}
    if(password.length<6){setError(t.shortPassword);return}
    setBusy(true);
    try {
      const {data,error:e}=await supabase.auth.signInWithPassword({email:usernameEmail(u),password});
      if(e){
        const msg=String(e.message||"").toLowerCase();
        console.error("[Messenger auth] signInWithPassword failed", { code:e.code||null, status:e.status||null, message:e.message||null });
        if(msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) setError(t.invalidLogin);
        else if(msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) setError(t.network);
        else setError(`${t.generic} (${e.message||"unknown auth error"})`);
        setBusy(false);return;
      }
      if(!data.session){setError(t.generic);setBusy(false);return}
      window.location.replace("/messenger/");
    } catch(e) {
      console.error("[Messenger auth] unexpected error", e);
      setError(`${t.network} ${e?.message||""}`.trim());
      setBusy(false);
    }
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
    <section style={{width:"100%",maxWidth:430,padding:28,borderRadius:24,border:"1px solid #ddd",boxShadow:"0 12px 40px rgba(0,0,0,.08)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><h1 style={{margin:0}}>{t.brand}</h1><p style={{margin:"6px 0 0",opacity:.65}}>{t.tagline}</p></div><button type="button" onClick={()=>setLang(lang==="fa"?"en":"fa")} style={{padding:"7px 10px",borderRadius:10,border:"1px solid #ccc",background:"transparent"}}>{lang==="fa"?"EN":"فا"}</button></div>
      <form onSubmit={login} style={{marginTop:28,display:"grid",gap:14}}>
        <label>{t.username}<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" disabled={busy} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,padding:13,borderRadius:12,border:"1px solid #ccc"}} /></label>
        <label>{t.password}<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,padding:13,borderRadius:12,border:"1px solid #ccc"}} /></label>
        {error&&<div role="alert" style={{padding:12,borderRadius:12,background:"#fff1f1",color:"#9b1c1c",fontSize:14}}>{error}</div>}
        <button type="submit" disabled={busy} style={{padding:14,border:0,borderRadius:12,cursor:busy?"wait":"pointer"}}>{busy?t.wait:t.signIn}</button>
      </form>
      <p style={{marginTop:20,fontSize:13,opacity:.7,lineHeight:1.8}}>{t.support}</p>
    </section>
  </main>;
}
