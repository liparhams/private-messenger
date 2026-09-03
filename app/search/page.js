"use client";
import {useState} from "react";
import {createClient} from "@supabase/supabase-js";

const db=createClient("https://jcblfgrcsgbdeamogzfc.supabase.co","sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

export default function Search(){
  const[q,setQ]=useState(""),[r,setR]=useState([]),[e,setE]=useState(""),[busy,setBusy]=useState(false);
  async function go(){
    setE("");const v=q.trim().replace(/^@/,"");if(!v)return setR([]);setBusy(true);
    const{data,error}=await db.from("profiles").select("username,display_name,public_id").ilike("username",v).limit(10);
    if(error)setE(error.message);setR(data||[]);setBusy(false)
  }
  return <main style={{minHeight:"100vh",padding:24,fontFamily:"system-ui",background:"#0b0b10",color:"#f7f7f8"}} dir="rtl"><div style={{maxWidth:720,margin:"0 auto"}}><a href="/" style={{color:"inherit",opacity:.7,textDecoration:"none"}}>← Messenger</a><h1>پیدا کردن کاربر</h1><p style={{opacity:.65}}>نام کاربری را وارد کن.</p><div style={{display:"flex",gap:8}}><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")go()}} placeholder="@username یا username" aria-label="نام کاربری" style={{flex:1,padding:12,borderRadius:12,border:"1px solid #30303a",background:"#17171d",color:"inherit"}}/><button type="button" onClick={go} disabled={busy} style={{padding:"0 18px",border:0,borderRadius:12}}>{busy?"...":"جستجو"}</button></div>{e&&<p role="alert">{e}</p>}<ul>{r.map(x=><li key={x.public_id} style={{marginTop:12}}><b>{x.display_name}</b> @{x.username}</li>)}</ul></div></main>
}