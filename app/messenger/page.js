"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jcblfgrcsgbdeamogzfc.supabase.co",
  "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const MAX_MESSAGE_LENGTH = 4000;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const FILE_BUCKET = "chat-files";

const TEXT = {
  fa: { brand:"Messenger", users:"کاربران", search:"جستجوی کاربران", start:"یک گفت‌وگو را شروع کن", hint:"یک نفر را از فهرست انتخاب کن.", noUsers:"کاربری پیدا نشد", noMessages:"هنوز پیامی نیست", first:"اولین پیام را بفرست.", write:"پیامت را بنویس...", send:"ارسال", support:"پشتیبانی", profile:"پروفایل", logout:"خروج", notifications:"اعلان‌ها", back:"بازگشت", loading:"در حال بارگذاری...", file:"فایل", openFile:"باز کردن فایل", error:"خطایی رخ داد.", messageFailed:"ارسال پیام انجام نشد.", uploadFailed:"ارسال فایل انجام نشد.", tooLarge:"حجم فایل بیشتر از ۱۵ مگابایت است.", tooLong:"پیام نمی‌تواند بیشتر از ۴۰۰۰ کاراکتر باشد.", contact:"راه ارتباطی" },
  en: { brand:"Messenger", users:"Users", search:"Search users", start:"Start a conversation", hint:"Choose someone from the list.", noUsers:"No users found", noMessages:"No messages yet", first:"Send the first message.", write:"Write a message...", send:"Send", support:"Support", profile:"Profile", logout:"Sign out", notifications:"Notifications", back:"Back", loading:"Loading...", file:"File", openFile:"Open file", error:"Something went wrong.", messageFailed:"Message could not be sent.", uploadFailed:"File could not be sent.", tooLarge:"File size is over 15 MB.", tooLong:"Message cannot exceed 4000 characters.", contact:"Contact" }
};

function firstLetter(value) { return (value || "M").trim().slice(0, 1).toUpperCase(); }
function formatTime(value, lang) { try { return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { hour:"2-digit", minute:"2-digit" }).format(new Date(value)); } catch { return ""; } }
function Icon({ name }) {
  const common={width:19,height:19,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round",ariaHidden:true};
  const s={search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,send:<><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,paperclip:<path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.5-8.5"/>,user:<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,support:<><circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>,bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/></>,moon:<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z"/>};
  return <svg {...common}>{s[name] || s.user}</svg>;
}

export default function MessengerPage() {
  const [lang,setLang]=useState("fa"),[dark,setDark]=useState(true),[session,setSession]=useState(null),[profile,setProfile]=useState(null),[users,setUsers]=useState([]),[selected,setSelected]=useState(null),[messages,setMessages]=useState([]),[search,setSearch]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const fileRef=useRef(null),endRef=useRef(null),t=TEXT[lang];

  useEffect(()=>{try{const l=localStorage.getItem("messenger-language"),th=localStorage.getItem("messenger-theme");if(l==="fa"||l==="en")setLang(l);if(th==="light"||th==="dark")setDark(th==="dark")}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem("messenger-language",lang);localStorage.setItem("messenger-theme",dark?"dark":"light")}catch{}},[lang,dark]);

  async function boot(){
    setLoading(true);setError("");
    const {data,error:e}=await supabase.auth.getSession();
    if(e||!data?.session){window.location.replace("/");return;}
    setSession(data.session);
    const [{data:p,error:pe},{data:u,error:ue}]=await Promise.all([
      supabase.from("profiles").select("id,username,display_name,contact_type,contact_value").eq("id",data.session.user.id).maybeSingle(),
      supabase.from("profiles").select("id,username,display_name,contact_type,contact_value").neq("id",data.session.user.id).order("username",{ascending:true}).limit(500)
    ]);
    if(pe||ue){setError(t.error)} else {setProfile(p||null);setUsers(u||[])}
    setLoading(false);
  }
  useEffect(()=>{boot();const {data}=supabase.auth.onAuthStateChange((_e,s)=>{if(!s)window.location.replace("/")});return()=>data?.subscription?.unsubscribe()},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth",block:"end"})},[messages]);
  useEffect(()=>{
    if(!session?.user?.id)return;
    const ch=supabase.channel(`messages-${session.user.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},payload=>{
      const m=payload.new;if(!m?.id)return;const relevant=m.sender_id===session.user.id||m.receiver_id===session.user.id;if(!relevant)return;
      if(selected&&((m.sender_id===selected.id&&m.receiver_id===session.user.id)||(m.receiver_id===selected.id&&m.sender_id===session.user.id)))setMessages(x=>x.some(v=>v.id===m.id)?x:[...x,m]);
    }).subscribe();return()=>{supabase.removeChannel(ch)};
  },[session?.user?.id,selected?.id]);

  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return q?users.filter(u=>`${u.username} ${u.display_name||""}`.toLowerCase().includes(q)):users},[users,search]);
  async function openChat(user){setSelected(user);setMessages([]);setError("");if(!session)return;const {data,error:e}=await supabase.from("messages").select("id,sender_id,receiver_id,content,message_type,file_name,created_at").or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${session.user.id})`).order("created_at",{ascending:true}).limit(500);if(e)setError(t.messageFailed);else setMessages(data||[])}
  async function sendMessage(){const c=message.trim();if(!c||!selected||!session||busy)return;if(c.length>MAX_MESSAGE_LENGTH){setError(t.tooLong);return}setBusy(true);setError("");const {data,error:e}=await supabase.from("messages").insert({sender_id:session.user.id,receiver_id:selected.id,content:c,message_type:"text"}).select("id,sender_id,receiver_id,content,message_type,file_name,created_at").single();if(e)setError(t.messageFailed);else{setMessages(x=>x.some(v=>v.id===data.id)?x:[...x,data]);setMessage("")}setBusy(false)}
  async function sendFile(e){const file=e.target.files?.[0];e.target.value="";if(!file||!selected||!session||busy)return;if(file.size>MAX_FILE_SIZE){setError(t.tooLarge);return}setBusy(true);setError("");let path="";try{const safe=String(file.name||"file").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,180)||"file";path=`${session.user.id}/${crypto.randomUUID()}-${safe}`;const up=await supabase.storage.from(FILE_BUCKET).upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream",cacheControl:"3600"});if(up.error)throw up.error;const ins=await supabase.from("messages").insert({sender_id:session.user.id,receiver_id:selected.id,content:path,message_type:"file",file_name:file.name}).select("id,sender_id,receiver_id,content,message_type,file_name,created_at").single();if(ins.error)throw ins.error;setMessages(x=>[...x,ins.data])}catch(err){setError(t.uploadFailed);if(path)await supabase.storage.from(FILE_BUCKET).remove([path])}setBusy(false)}
  async function openFile(item){const {data,error:e}=await supabase.storage.from(FILE_BUCKET).createSignedUrl(item.content,3600,{download:item.file_name||true});if(e||!data?.signedUrl){setError(t.uploadFailed);return}window.open(data.signedUrl,"_blank","noopener,noreferrer")}
  async function logout(){setBusy(true);await supabase.auth.signOut();window.location.replace("/")}

  if(loading)return <main className={`app-shell ${dark?"theme-dark":"theme-light"}`} dir={lang==="fa"?"rtl":"ltr"}><div className="loading-screen"><div className="brand-mark">M</div><span>{t.loading}</span></div></main>;
  return <main className={`app-shell ${dark?"theme-dark":"theme-light"}`} dir={lang==="fa"?"rtl":"ltr"}>
    <div className="app-frame">
      <aside className={`sidebar ${selected?"chat-selected":""}`}>
        <div className="side-header"><div className="brand-lockup"><div className="brand-mark small">M</div><div><div className="brand-name">{t.brand}</div><div className="side-me">@{profile?.username||"user"}</div></div></div><div className="top-actions"><button className="icon-button" type="button" onClick={()=>setLang(v=>v==="fa"?"en":"fa")} aria-label="language">{lang==="fa"?"EN":"فا"}</button><button className="icon-button" type="button" onClick={()=>setDark(v=>!v)} aria-label="theme"><Icon name={dark?"sun":"moon"}/></button></div></div>
        <button type="button" className="profile-pill"><div className="avatar">{firstLetter(profile?.display_name||profile?.username)}</div><div className="profile-text"><strong>{profile?.display_name||profile?.username}</strong><span>@{profile?.username}</span></div></button>
        <div className="search-wrap"><Icon name="search"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} aria-label={t.search}/></div>
        <div className="section-title"><span>{t.users}</span><span className="count-badge">{users.length}</span></div>
        <div className="user-list">{filtered.map(u=><button type="button" className={`user-row ${selected?.id===u.id?"selected":""}`} key={u.id} onClick={()=>openChat(u)}><div className="avatar">{firstLetter(u.display_name||u.username)}</div><div className="user-meta"><strong>{u.display_name||u.username}</strong><span>@{u.username}</span></div></button>)}{!filtered.length&&<div className="empty-list">{t.noUsers}</div>}</div>
        <div className="side-footer"><button type="button"><Icon name="support"/>{t.support}</button><button type="button"><Icon name="user"/>{t.profile}</button><button type="button" onClick={logout} disabled={busy}><span className="logout-dot"/>{t.logout}</button></div>
      </aside>
      <section className="chat-panel">
        {!selected?<div className="empty-chat"><div className="empty-icon"><span>✦</span></div><h1>{t.start}</h1><p>{t.hint}</p></div>:<><header className="chat-header"><div className="chat-person"><button type="button" className="back-button" onClick={()=>setSelected(null)} aria-label={t.back}>‹</button><div className="avatar large">{firstLetter(selected.display_name||selected.username)}</div><div><h2>{selected.display_name||selected.username}</h2><span>@{selected.username}</span></div></div></header><div className="messages">{!messages.length&&<div className="empty-messages"><div className="empty-icon small">✦</div><strong>{t.noMessages}</strong><span>{t.first}</span></div>}{messages.map(m=>{const mine=m.sender_id===session.user.id;return <div key={m.id} className={`message-line ${mine?"mine":"theirs"}`}><div className={`message-bubble ${mine?"mine":"theirs"}`}>{m.message_type==="file"?<button className="file-message" type="button" onClick={()=>openFile(m)}><Icon name="paperclip"/><span>{m.file_name||t.file}</span></button>:<div className="message-content">{m.content}</div>}<time>{formatTime(m.created_at,lang)}</time></div></div>})}<div ref={endRef}/></div><div className="composer"><button className="icon-button attach" type="button" onClick={()=>fileRef.current?.click()} disabled={busy}><Icon name="paperclip"/></button><input ref={fileRef} hidden type="file" onChange={sendFile}/><textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={MAX_MESSAGE_LENGTH} placeholder={t.write} rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}}/><button className="send-button" type="button" onClick={sendMessage} disabled={busy||!message.trim()} aria-label={t.send}><Icon name="send"/></button></div></>}
      </section>
    </div>
    {error&&<div className="toast error" role="alert"><span>{error}</span><button type="button" onClick={()=>setError("")}>×</button></div>}
  </main>;
}
