"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";

const db=createClient("https://jcblfgrcsgbdeamogzfc.supabase.co","sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

export default function Tickets(){
  const[t,setT]=useState([]),[e,setE]=useState(""),[loading,setL]=useState(true);
  async function load(){
    setL(true);setE("");
    const{data:{user}}=await db.auth.getUser();
    if(!user){location.href="/";return}
    const{data:p,error:pe}=await db.from("profiles").select("role").eq("id",user.id).single();
    if(pe||p?.role!=="admin"){location.href="/";return}
    const{data,error}=await db.from("support_tickets").select("id,ticket_no,user_id,subject,status,priority,created_at,updated_at").order("updated_at",{ascending:false});
    if(error)setE(error.message);setT(data||[]);setL(false)
  }
  useEffect(()=>{load()},[]);
  async function closeTicket(x){
    const{error}=await db.from("support_tickets").update({status:"closed",updated_at:new Date().toISOString()}).eq("id",x.id);
    if(error)setE(error.message);else load()
  }
  return <main style={{minHeight:"100vh",padding:24,fontFamily:"system-ui",background:"#0b0b10",color:"#f7f7f8"}}><div style={{maxWidth:1100,margin:"0 auto"}}><a href="/admin" style={{color:"inherit",opacity:.7,textDecoration:"none"}}>← مدیریت</a><h1>پشتیبانی</h1>{e&&<p role="alert">{e}</p>}{loading?<p>در حال بارگذاری…</p>:!t.length?<p style={{opacity:.65}}>تیکتی وجود ندارد.</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th style={{textAlign:"right",padding:10}}>#</th><th style={{textAlign:"right",padding:10}}>موضوع</th><th style={{textAlign:"right",padding:10}}>وضعیت</th><th style={{textAlign:"right",padding:10}}>اولویت</th><th style={{padding:10}}>عملیات</th></tr></thead><tbody>{t.map(x=><tr key={x.id}><td style={{padding:10}}>#{x.ticket_no}</td><td style={{padding:10}}>{x.subject}</td><td style={{padding:10}}>{x.status}</td><td style={{padding:10}}>{x.priority}</td><td style={{padding:10}}>{x.status!=="closed"&&<button type="button" onClick={()=>closeTicket(x)}>بستن</button>}</td></tr>)}</tbody></table></div>}</div></main>
}