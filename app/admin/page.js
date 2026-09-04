"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";

const db=createClient("https://jcblfgrcsgbdeamogzfc.supabase.co","sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const ACTIONS="admin-user-actions";

export default function Admin(){
 const[me,setMe]=useState(null),[users,setUsers]=useState([]),[msgs,setMsgs]=useState([]),[logs,setLogs]=useState([]),[tab,setTab]=useState("home"),[err,setErr]=useState(""),[ok,setOk]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const[form,setForm]=useState({username:"",display_name:"",password:"",role:"user",is_verified:false});
 async function load(){
  setLoading(true);setErr("");
  try{
   const{data:{user},error:ue}=await db.auth.getUser();if(ue||!user){location.href="/";return;}
   const{data:p,error:pe}=await db.from("profiles").select("id,username,display_name,role,public_id,is_verified,is_banned,created_at").eq("id",user.id).single();
   if(pe||p?.role!=="admin"){setErr("دسترسی غیرمجاز");setLoading(false);return;}setMe(p);
   const[u,m,l]=await Promise.all([
    db.from("profiles").select("id,username,display_name,role,public_id,is_verified,is_banned,created_at").order("created_at",{ascending:false}),
    db.from("messages").select("id,sender_id,receiver_id,content,message_type,file_name,created_at").order("created_at",{ascending:false}).limit(200),
    db.from("admin_logs").select("id,action,target_user_id,target_message_id,details,created_at").order("created_at",{ascending:false}).limit(200)
   ]);
   if(u.error||m.error||l.error)throw new Error(u.error?.message||m.error?.message||l.error?.message);
   setUsers(u.data||[]);setMsgs(m.data||[]);setLogs(l.data||[]);
  }catch(e){setErr(e.message||"خطا در بارگذاری داشبورد");}finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);
 function setField(k,v){setForm(x=>({...x,[k]:v}));setErr("");}
 async function action(action,userId,extra={}){
  setBusy(true);setErr("");setOk("");
  try{const{data,error}=await db.functions.invoke(ACTIONS,{body:{action,user_id:userId,...extra}});if(error)throw error;if(data?.error)throw new Error(data.error);setOk("عملیات با موفقیت انجام شد.");await load();}
  catch(e){setErr(e.message||"عملیات انجام نشد.");}finally{setBusy(false)}
 }
 async function createUser(){
  const username=form.username.trim().toLowerCase(),display_name=form.display_name.trim(),password=form.password;
  if(!/^[a-z0-9_]{3,20}$/.test(username))return setErr("نام کاربری باید ۳ تا ۲۰ کاراکتر انگلیسی، عدد یا _ باشد.");
  if(!display_name||display_name.length>80)return setErr("نام نمایشی را درست وارد کن.");
  if(password.length<6)return setErr("رمز عبور باید حداقل ۶ کاراکتر باشد.");
  await action("create_user",null,{username,display_name,password,role:form.role,is_verified:form.is_verified});
  setForm({username:"",display_name:"",password:"",role:"user",is_verified:false});
 }
 async function resetPassword(user){
  const p=window.prompt(`رمز جدید برای @${user.username} را وارد کن:`,"");if(p===null)return;if(p.length<6)return setErr("رمز عبور باید حداقل ۶ کاراکتر باشد.");await action("reset_password",user.id,{password:p});
 }
 async function changeRole(user){
  if(user.id===me.id)return setErr("نقش مدیر اصلی قابل حذف نیست.");const role=user.role==="admin"?"user":"admin";if(!confirm(`نقش @${user.username} به ${role} تغییر کند؟`))return;await action("set_role",user.id,{role});
 }
 async function toggleVerify(user){await action("set_verified",user.id,{is_verified:!user.is_verified});}
 async function toggleBan(user){if(user.id===me.id)return setErr("نمی‌توانی حساب خودت را مسدود کنی.");const actionName=user.is_banned?"unban":"ban";if(!confirm(`${user.is_banned?"رفع مسدودی":"مسدود کردن"} @${user.username}؟`))return;await action(actionName,user.id);}
 async function deleteUser(user){if(user.id===me.id)return setErr("نمی‌توانی حساب خودت را حذف کنی.");if(!confirm(`حذف کامل @${user.username}؟ این کار قابل بازگشت نیست.`))return;await action("delete_user",user.id);}
 async function delMsg(x){if(!confirm("حذف پیام؟"))return;setBusy(true);const{error}=await db.from("messages").delete().eq("id",x.id);if(error)setErr(error.message);else{await db.from("admin_logs").insert({admin_id:me.id,action:"delete_message",target_message_id:x.id});setOk("پیام حذف شد.");await load()}setBusy(false)}
 async function out(){await db.auth.signOut();location.href="/"}
 if(loading)return <main className="admin-shell"><div className="admin-card">در حال بررسی دسترسی…</div></main>;
 if(!me)return <main className="admin-shell"><div className="admin-card"><h1>403</h1><p>{err}</p><a href="/">بازگشت</a></div></main>;
 const title={home:"داشبورد",users:"کاربران",create:"ساخت کاربر",messages:"پیام‌ها",logs:"لاگ‌ها",tickets:"پشتیبانی"}[tab]||"داشبورد";
 return <main className="admin-shell" dir="rtl"><aside className="admin-sidebar"><div className="admin-brand"><h2>Messenger</h2><small>@{me.username} · مدیر</small></div>{[["home","داشبورد"],["users","کاربران"],["create","+ ساخت کاربر"],["messages","پیام‌ها"],["logs","لاگ‌ها"],["tickets","پشتیبانی"]].map(([k,v])=><button className={tab===k?"active":""} onClick={()=>{setTab(k);setErr("")}} key={k}>{v}</button>)}<button onClick={out}>خروج</button></aside>
 <section className="admin-main"><header className="admin-header"><div><h1>{title}</h1><span>مدیریت مرکزی · حساب مدیر: @{me.username}</span></div><button onClick={load} disabled={busy} aria-label="بازخوانی">↻</button></header>{err&&<div className="admin-error">{err}</div>}{ok&&<div className="admin-success">{ok}</div>}
 {tab==="home"&&<div className="admin-grid"><div className="admin-stat"><b>{users.length}</b><span>کاربر</span></div><div className="admin-stat"><b>{msgs.length}</b><span>پیام اخیر</span></div><div className="admin-stat"><b>{logs.length}</b><span>لاگ</span></div><div className="admin-card"><h3>وضعیت سیستم</h3><p>Database / Auth: متصل</p><p>RLS: فعال</p><p>مدیریت کاربران: فعال</p></div></div>}
 {tab==="create"&&<div className="admin-card admin-form"><h3>ساخت حساب جدید</h3><p className="admin-muted">این حساب از طریق Auth ساخته و ایمیل داخلی آن به‌صورت خودکار تأیید می‌شود.</p><label>نام کاربری<input value={form.username} maxLength={20} onChange={e=>setField("username",e.target.value.replace(/\s/g,"").toLowerCase())} placeholder="username" /></label><label>نام نمایشی<input value={form.display_name} maxLength={80} onChange={e=>setField("display_name",e.target.value)} placeholder="نام کاربر" /></label><label>رمز عبور<input value={form.password} maxLength={128} onChange={e=>setField("password",e.target.value)} type="password" placeholder="حداقل ۶ کاراکتر" /></label><label>نقش<select value={form.role} onChange={e=>setField("role",e.target.value)}><option value="user">کاربر</option><option value="admin">مدیر</option></select></label><label className="admin-check"><input type="checkbox" checked={form.is_verified} onChange={e=>setField("is_verified",e.target.checked)} /> نشان تأیید آبی</label><button className="admin-primary" disabled={busy} onClick={createUser}>{busy?"در حال ساخت…":"ساخت کاربر"}</button></div>}
 {tab==="users"&&<div className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>کاربر</th><th>نام</th><th>نقش</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{users.map(x=><tr key={x.id}><td><b>@{x.username}</b>{x.is_verified&&<span className="admin-verified">✓</span>}</td><td>{x.display_name||"-"}</td><td>{x.role}</td><td>{x.is_banned?<span className="admin-danger-text">مسدود</span>:"فعال"}</td><td><div className="admin-actions"><button disabled={busy} onClick={()=>toggleVerify(x)}>{x.is_verified?"حذف تیک":"تأیید"}</button><button disabled={busy} onClick={()=>resetPassword(x)}>تغییر رمز</button><button disabled={busy||x.id===me.id} onClick={()=>changeRole(x)}>{x.role==="admin"?"کاربر کردن":"مدیر کردن"}</button><button disabled={busy||x.id===me.id} onClick={()=>toggleBan(x)}>{x.is_banned?"رفع مسدودی":"مسدود"}</button><button className="danger" disabled={busy||x.id===me.id} onClick={()=>deleteUser(x)}>حذف</button></div></td></tr>)}</tbody></table></div></div>}
 {tab==="messages"&&<div className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>پیام</th><th>نوع</th><th>زمان</th><th></th></tr></thead><tbody>{msgs.map(x=><tr key={x.id}><td>{x.file_name||x.content||"فایل"}</td><td>{x.message_type}</td><td>{new Date(x.created_at).toLocaleString("fa-IR")}</td><td><button className="danger" disabled={busy} onClick={()=>delMsg(x)}>حذف</button></td></tr>)}</tbody></table></div></div>}
 {tab==="logs"&&<div className="admin-card"><div className="admin-table-wrap"><table><thead><tr><th>عملیات</th><th>زمان</th><th>جزئیات</th></tr></thead><tbody>{logs.map(x=><tr key={x.id}><td>{x.action}</td><td>{new Date(x.created_at).toLocaleString("fa-IR")}</td><td>{JSON.stringify(x.details||{})}</td></tr>)}</tbody></table></div></div>}
 {tab==="tickets"&&<div className="admin-card"><h3>پشتیبانی</h3><p>مدیریت تیکت‌ها از بخش اختصاصی انجام می‌شود.</p><a href="/admin/tickets">باز کردن تیکت‌ها</a></div>}
 </section></main>;
}
