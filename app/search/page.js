"use client";
import {useState} from "react";
import {createClient} from "@supabase/supabase-js";
const db=createClient("https://jcblfgrcsgbdeamogzfc.supabase.co","sb_publishable_9qBGewmR-HUx6Pc3_Gl36Q_7WhHC2wK");
export default function Search(){const[q,setQ]=useState("");const[r,setR]=useState([]);const[e,setE]=useState("");async function go(){setE("");const v=q.trim().replace(/^@/,"");if(!v)return;const{data,error}=await db.from("profiles").select("username,display_name,public_id").ilike("username",v).limit(10);if(error)setE(error.message);setR(data||[])}return <main style={{padding:24,fontFamily:"system-ui"}}><h1>پیدا کردن کاربر</h1><input value={q} onChange={e=>setQ(e.target.value)} placeholder="@username یا username"/><button onClick={go}>جستجو</button>{e&&<p>{e}</p>}<ul>{r.map(x=><li key={x.public_id}><b>{x.display_name}</b> @{x.username} · {x.public_id}</li>)}</ul></main>}
