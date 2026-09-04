"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jcblfgrcsgbdeamogzfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const AUTH_DOMAIN = "utino.chat";
const SUPPORT = { telegram: "https://t.me/parhamsoleimanybot", utino: "https://utino.org/chat/supportusername" };

const TEXT = {
  fa: { brand:"Messenger",tagline:"پیام‌رسان خصوصی",username:"نام کاربری",password:"رمز عبور",signIn:"ورود به حساب",wait:"در حال ورود...",supportTitle:"پشتیبانی",support:"ثبت‌نام عمومی فعال نیست. برای ساخت حساب با پشتیبانی در ارتباط باش.",supportTelegram:"پشتیبانی در تلگرام",supportWeb:"پشتیبانی در یوتینو",language:"EN",invalidUser:"نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، عدد یا _ باشد.",shortPassword:"رمز عبور باید حداقل ۶ کاراکتر باشد.",invalidLogin:"نام کاربری یا رمز عبور اشتباه است.",emailDisabled:"سرویس ورود ایمیلی در Supabase فعال نیست. Email Provider را روشن کن.",notConfirmed:"این حساب هنوز تأیید نشده است. برای این سیستم Confirm email باید خاموش باشد.",network:"ارتباط با سرور برقرار نشد.",generic:"ورود انجام نشد. دوباره تلاش کن.",close:"بستن" },
  en: { brand:"Messenger",tagline:"Private messaging",username:"Username",password:"Password",signIn:"Sign in",wait:"Signing in...",supportTitle:"Support",support:"Public registration is disabled. Contact support to create an account.",supportTelegram:"Support on Telegram",supportWeb:"Support on Utino",language:"فا",invalidUser:"Username must be 3–20 characters and use only letters, numbers, or _.",shortPassword:"Password must be at least 6 characters.",invalidLogin:"Incorrect username or password.",emailDisabled:"Supabase Email Provider is disabled. Enable the Email provider.",notConfirmed:"This account is not confirmed. Confirm email must be disabled for this system.",network:"Could not connect to the server.",generic:"Sign-in failed. Please try again.",close:"Close" }
};

function usernameEmail(value) { return `${value.trim().toLowerCase()}@${AUTH_DOMAIN}`; }

export default function Page() {
  const [lang,setLang]=useState("fa");
  const [dark,setDark]=useState(true);
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [supportOpen,setSupportOpen]=useState(false);
  const t=lang==="fa"?TEXT.fa:TEXT.en;

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(({data})=>{ if(active&&data.session) window.location.replace("/messenger/"); });
    return()=>{active=false};
  },[]);

  async function login(e){
    e.preventDefault(); setError("");
    const u=username.trim().toLowerCase();
    if(!/^[a-z0-9_]{3,20}$/.test(u)){setError(t.invalidUser);return}
    if(password.length<6){setError(t.shortPassword);return}
    setBusy(true);
    try {
      const {data,error:e}=await supabase.auth.signInWithPassword({email:usernameEmail(u),password});
      if(e){
        const m=String(e.message||"").toLowerCase();
        if(m.includes("email logins are disabled")) setError(t.emailDisabled);
        else if(m.includes("email not confirmed")||m.includes("not confirmed")) setError(t.notConfirmed);
        else if(m.includes("invalid login credentials")||m.includes("invalid_credentials")) setError(t.invalidLogin);
        else if(m.includes("fetch")||m.includes("network")) setError(t.network);
        else setError(t.generic);
        setBusy(false); return;
      }
      if(!data.session){setError(t.generic);setBusy(false);return}
      window.location.replace("/messenger/");
    } catch { setError(t.network); setBusy(false); }
  }

  const page={minHeight:"100vh",padding:24,display:"grid",placeItems:"center",fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",direction:lang==="fa"?"rtl":"ltr",background:dark?"radial-gradient(circle at 20% 0%,#172554 0,#090d18 38%,#060810 100%)":"radial-gradient(circle at 20% 0%,#e0e7ff 0,#f8fafc 42%,#eef2ff 100%)",color:dark?"#f8fafc":"#111827",transition:"background .25s,color .25s"};
  const card={width:"100%",maxWidth:460,padding:28,borderRadius:28,border:dark?"1px solid rgba(255,255,255,.10)":"1px solid rgba(15,23,42,.10)",background:dark?"rgba(15,23,42,.82)":"rgba(255,255,255,.88)",boxShadow:dark?"0 28px 80px rgba(0,0,0,.38)":"0 28px 80px rgba(15,23,42,.12)",backdropFilter:"blur(18px)"};
  const input={width:"100%",boxSizing:"border-box",marginTop:8,padding:"14px 15px",borderRadius:14,border:dark?"1px solid rgba(255,255,255,.12)":"1px solid #dbe2ea",background:dark?"rgba(255,255,255,.05)":"#fff",color:"inherit",outline:"none",fontSize:15};
  const ghost={border:dark?"1px solid rgba(255,255,255,.12)":"1px solid #dbe2ea",background:"transparent",color:"inherit",borderRadius:12,padding:"9px 11px",cursor:"pointer"};

  return <main style={page}>
    <section style={card}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:13}}>
          <div style={{width:48,height:48,borderRadius:16,display:"grid",placeItems:"center",fontWeight:800,fontSize:20,background:"linear-gradient(135deg,#2563eb,#7c3aed)",color:"white",boxShadow:"0 12px 30px rgba(37,99,235,.28)"}}>M</div>
          <div><h1 style={{margin:0,fontSize:24,letterSpacing:-.5}}>{t.brand}</h1><p style={{margin:"4px 0 0",opacity:.62,fontSize:13}}>{t.tagline}</p></div>
        </div>
        <div style={{display:"flex",gap:7}}><button type="button" style={ghost} onClick={()=>setLang(lang==="fa"?"en":"fa")}>{t.language}</button><button type="button" style={ghost} onClick={()=>setDark(!dark)} aria-label="theme">{dark?"☀":"◐"}</button></div>
      </header>

      <div style={{marginTop:28,display:"grid",gap:5}}><span style={{fontSize:12,opacity:.58,letterSpacing:.5}}>{lang==="fa"?"ورود امن":"SECURE ACCESS"}</span><h2 style={{margin:0,fontSize:26}}>{t.signIn}</h2></div>
      <form onSubmit={login} style={{marginTop:22,display:"grid",gap:16}}>
        <label style={{fontSize:13,fontWeight:650}}>{t.username}<input autoFocus autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="username" disabled={busy} style={input}/></label>
        <label style={{fontSize:13,fontWeight:650}}>{t.password}<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} style={input}/></label>
        {error&&<div role="alert" style={{padding:"12px 14px",borderRadius:14,background:dark?"rgba(248,113,113,.10)":"#fff1f2",border:dark?"1px solid rgba(248,113,113,.22)":"1px solid #fecdd3",color:dark?"#fecaca":"#9f1239",fontSize:13,lineHeight:1.8}}>{error}</div>}
        <button type="submit" disabled={busy} style={{padding:15,border:0,borderRadius:15,cursor:busy?"wait":"pointer",background:"linear-gradient(135deg,#2563eb,#4f46e5)",color:"white",fontWeight:750,fontSize:15,boxShadow:"0 12px 26px rgba(37,99,235,.25)"}}>{busy?t.wait:t.signIn}</button>
      </form>

      <div style={{marginTop:18,padding:14,borderRadius:16,border:dark?"1px solid rgba(255,255,255,.08)":"1px solid #e5e7eb",background:dark?"rgba(255,255,255,.035)":"#f8fafc",lineHeight:1.75}}>
        <div style={{fontSize:13,fontWeight:700}}>{t.supportTitle}</div><div style={{fontSize:12,opacity:.65,marginTop:3}}>{t.support}</div>
        <button type="button" onClick={()=>setSupportOpen(true)} style={{marginTop:10,width:"100%",padding:11,borderRadius:12,border:dark?"1px solid rgba(255,255,255,.1)":"1px solid #dbe2ea",background:"transparent",color:"inherit",cursor:"pointer",fontWeight:650}}>{lang==="fa"?"باز کردن پشتیبانی":"Open support"}</button>
      </div>
      <p style={{margin:"18px 0 0",textAlign:"center",fontSize:11,opacity:.42}}>Username access · Messenger</p>
    </section>

    {supportOpen&&<div onMouseDown={()=>setSupportOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.58)",display:"grid",placeItems:"center",padding:20,zIndex:20}}><div onMouseDown={e=>e.stopPropagation()} role="dialog" aria-modal="true" style={{width:"100%",maxWidth:420,padding:24,borderRadius:24,background:dark?"#111827":"#fff",color:dark?"#f8fafc":"#111827",boxShadow:"0 30px 90px rgba(0,0,0,.35)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0}}>{t.supportTitle}</h2><button type="button" onClick={()=>setSupportOpen(false)} style={ghost}>×</button></div><p style={{opacity:.7,lineHeight:1.8,fontSize:13}}>{t.support}</p><a href={SUPPORT.telegram} target="_blank" rel="noreferrer" style={{display:"block",padding:13,borderRadius:13,background:dark?"rgba(255,255,255,.06)":"#f8fafc",color:"inherit",textDecoration:"none",marginTop:10}}>{t.supportTelegram}</a><a href={SUPPORT.utino} target="_blank" rel="noreferrer" style={{display:"block",padding:13,borderRadius:13,background:dark?"rgba(255,255,255,.06)":"#f8fafc",color:"inherit",textDecoration:"none",marginTop:8}}>{t.supportWeb}</a><button type="button" onClick={()=>setSupportOpen(false)} style={{marginTop:16,width:"100%",padding:12,borderRadius:12,border:"none",background:dark?"#374151":"#e5e7eb",color:"inherit",cursor:"pointer"}}>{t.close}</button></div></div>}
  </main>;
}
