"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "../messenger.css";

const SUPABASE_URL = "https://jcblfgrcsgbdeamogzfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9qBGewmR-HUx6Pc3_Gl36Q_7WhHC2wK";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    const { data: { session: current } } = await supabase.auth.getSession();
    setSession(current);
    if (!current) { setBusy(false); return; }

    const { data: me, error: meError } = await supabase
      .from("profiles").select("id,username,display_name,role,created_at")
      .eq("id", current.user.id).single();
    if (meError || me?.role !== "admin") {
      setProfile(me || null);
      setError("دسترسی به پنل مدیریت مجاز نیست.");
      setBusy(false);
      return;
    }
    setProfile(me);

    const [u, m, l] = await Promise.all([
      supabase.from("profiles").select("id,username,display_name,role,created_at").order("created_at", { ascending: false }),
      supabase.from("messages").select("id,sender_id,receiver_id,content,message_type,file_name,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("admin_logs").select("id,admin_id,action,target_user_id,target_message_id,details,created_at").order("created_at", { ascending: false }).limit(200)
    ]);
    if (u.error) setError(u.error.message);
    setUsers(u.data || []);
    setMessages(m.data || []);
    setLogs(l.data || []);
    setBusy(false);
  }

  useEffect(() => { load(); }, []);

  async function log(action, details = {}, target_user_id = null, target_message_id = null) {
    if (!session) return;
    await supabase.from("admin_logs").insert({
      admin_id: session.user.id, action, details, target_user_id, target_message_id
    });
  }

  async function deleteMessage(message) {
    if (!confirm("این پیام حذف شود؟")) return;
    const { error: e } = await supabase.from("messages").delete().eq("id", message.id);
    if (e) return setError(e.message);
    await log("delete_message", { message_type: message.message_type }, null, message.id);
    await load();
  }

  async function deleteUser(user) {
    setError("حذف کامل حساب و تغییر رمز به کلید امن سروری نیاز دارد و از مرورگر انجام نمی‌شود. این بخش را بعد از اتصال Edge Function فعال می‌کنیم.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  if (busy) return <main className="admin-shell"><div className="admin-card">در حال بررسی دسترسی…</div></main>;
  if (!session) return <main className="admin-shell"><div className="admin-card"><h1>Admin</h1><p>ابتدا وارد حساب شوید.</p><a className="button" href="/">ورود به پیام‌رسان</a></div></main>;
  if (profile?.role !== "admin") return <main className="admin-shell"><div className="admin-card"><h1>403</h1><p>{error}</p><a className="button" href="/">بازگشت</a></div></main>;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div><strong>Messenger</strong><small>Admin Panel</small></div>
        {[['dashboard','داشبورد'],['users','کاربران'],['messages','پیام‌ها'],['logs','لاگ‌ها']].map(([key,label]) =>
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
        )}
        <button onClick={signOut}>خروج</button>
      </aside>
      <section className="admin-main">
        <header className="admin-header"><div><h1>{tab === 'dashboard' ? 'داشبورد' : tab === 'users' ? 'کاربران' : tab === 'messages' ? 'پیام‌ها' : 'لاگ‌ها'}</h1><span>@{profile.username} · administrator</span></div><button onClick={load}>↻ بروزرسانی</button></header>
        {error && <div className="admin-error">{error}</div>}
        {tab === "dashboard" && <div className="admin-grid">
          <div className="admin-stat"><b>{users.length}</b><span>کاربر</span></div>
          <div className="admin-stat"><b>{messages.length}</b><span>پیام اخیر</span></div>
          <div className="admin-stat"><b>{logs.length}</b><span>لاگ</span></div>
          <div className="admin-card"><h2>وضعیت</h2><p>Auth: متصل</p><p>Database: متصل</p><p>Realtime: فعال در اپ</p><p>Storage: متصل در اپ</p></div>
        </div>}
        {tab === "users" && <div className="admin-card"><table><thead><tr><th>نام کاربری</th><th>نام</th><th>نقش</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td>@{u.username}</td><td>{u.display_name}</td><td>{u.role}</td><td>{new Date(u.created_at).toLocaleString('fa-IR')}</td><td><button onClick={() => deleteUser(u)}>مدیریت</button></td></tr>)}</tbody></table></div>}
        {tab === "messages" && <div className="admin-card"><table><thead><tr><th>پیام</th><th>نوع</th><th>فرستنده</th><th>گیرنده</th><th>زمان</th><th>عملیات</th></tr></thead><tbody>{messages.map(m => <tr key={m.id}><td className="admin-content">{m.file_name || m.content || "فایل"}</td><td>{m.message_type}</td><td>{m.sender_id.slice(0,8)}</td><td>{m.receiver_id.slice(0,8)}</td><td>{new Date(m.created_at).toLocaleString('fa-IR')}</td><td><button onClick={() => deleteMessage(m)}>حذف</button></td></tr>)}</tbody></table></div>}
        {tab === "logs" && <div className="admin-card"><table><thead><tr><th>عملیات</th><th>جزئیات</th><th>زمان</th></tr></thead><tbody>{logs.map(l => <tr key={l.id}><td>{l.action}</td><td>{JSON.stringify(l.details)}</td><td>{new Date(l.created_at).toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
