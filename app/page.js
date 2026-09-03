"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./messenger.css";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const i18n = {
  fa: {
    brand: "Messenger", tagline: "پیام‌رسان خصوصی و ساده", login: "ورود", register: "ثبت‌نام",
    username: "نام کاربری", display: "نام نمایشی", password: "رمز عبور", signIn: "ورود به حساب",
    create: "ساخت حساب", usernameHint: "فقط حروف انگلیسی، عدد و _", displayHint: "نامی که دیگران می‌بینند",
    contact: "راه ارتباطی", optional: "اختیاری", contactQuestion: "می‌خواهی راه ارتباطی‌ات برای دیگران نمایش داده شود؟",
    telegram: "تلگرام", instagram: "اینستاگرام", email: "ایمیل", phone: "تلفن", other: "سایر",
    contactPlaceholder: "مثلاً @username یا شماره", search: "جستجوی کاربران", users: "کاربران",
    noUsers: "کاربری پیدا نشد", startChat: "یک گفت‌وگو را شروع کن", startChatHint: "یک نفر را از فهرست انتخاب کن.",
    noMessages: "هنوز پیامی نیست", firstMessage: "اولین پیام را بفرست.", write: "پیامت را بنویس...", send: "ارسال",
    file: "فایل", profile: "پروفایل", settings: "تنظیمات", support: "پشتیبانی", notifications: "اعلان‌ها",
    supportTitle: "پشتیبانی", supportText: "برای ارتباط با پشتیبانی از یکی از مسیرهای زیر استفاده کن.",
    logout: "خروج", language: "EN", light: "روشن", dark: "تیره", back: "بازگشت", loading: "در حال بارگذاری...",
    pleaseWait: "لطفاً صبر کن...", invalidUser: "نام کاربری باید ۳ تا ۲۰ کاراکتر باشد.",
    shortPassword: "رمز عبور حداقل ۶ کاراکتر باشد.", registerRequired: "نام نمایشی، نام کاربری و رمز عبور را کامل کن.",
    invalidLogin: "نام کاربری یا رمز عبور اشتباه است.", already: "این نام کاربری قبلاً ثبت شده است.",
    genericError: "خطایی رخ داد. دوباره تلاش کن.", config: "اتصال Supabase در Cloudflare تنظیم نشده است.",
    messageFailed: "ارسال پیام انجام نشد.", uploadFailed: "ارسال فایل انجام نشد.", profileSaved: "پروفایل آماده است.",
    helpBot: "ربات پشتیبانی", website: "وب‌سایت", noNotifications: "اعلان جدیدی نداری.", close: "بستن"
  },
  en: {
    brand: "Messenger", tagline: "Simple private messaging", login: "Sign in", register: "Create account",
    username: "Username", display: "Display name", password: "Password", signIn: "Sign in",
    create: "Create account", usernameHint: "English letters, numbers and _ only", displayHint: "The name others see",
    contact: "Contact method", optional: "Optional", contactQuestion: "Show a contact method to other users?",
    telegram: "Telegram", instagram: "Instagram", email: "Email", phone: "Phone", other: "Other",
    contactPlaceholder: "e.g. @username or phone", search: "Search users", users: "Users",
    noUsers: "No users found", startChat: "Start a conversation", startChatHint: "Choose someone from the list.",
    noMessages: "No messages yet", firstMessage: "Send the first message.", write: "Write a message...", send: "Send",
    file: "File", profile: "Profile", settings: "Settings", support: "Support", notifications: "Notifications",
    supportTitle: "Support", supportText: "Use one of the following channels to contact support.",
    logout: "Sign out", language: "فا", light: "Light", dark: "Dark", back: "Back", loading: "Loading...",
    pleaseWait: "Please wait...", invalidUser: "Username must be 3–20 characters.",
    shortPassword: "Password must be at least 6 characters.", registerRequired: "Complete your display name, username and password.",
    invalidLogin: "Incorrect username or password.", already: "This username is already registered.",
    genericError: "Something went wrong. Please try again.", config: "Supabase is not configured in Cloudflare.",
    messageFailed: "Message could not be sent.", uploadFailed: "File could not be sent.", profileSaved: "Profile ready.",
    helpBot: "Support bot", website: "Website", noNotifications: "You have no new notifications.", close: "Close"
  }
};

function usernameEmail(value) {
  return `${value.trim().toLowerCase()}@messenger.local`;
}

function timeLabel(value, lang) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch { return ""; }
}

function friendlyAuthError(error, t) {
  const m = String(error?.message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return t.invalidLogin;
  if (m.includes("already registered") || m.includes("already exists")) return t.already;
  if (m.includes("password")) return t.shortPassword;
  return error?.message || t.genericError;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="close">×</button></div>
      <div className="modal-body">{children}</div>
    </div>
  </div>;
}

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    paperclip: <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.5-8.5"/>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    support: <><circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>
  };
  return <svg {...common}>{paths[name] || paths.user}</svg>;
}

export default function Home() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [shareContact, setShareContact] = useState(false);
  const [contactType, setContactType] = useState("telegram");
  const [contactValue, setContactValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [panel, setPanel] = useState(null);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const t = i18n[lang];

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem("messenger-language");
      const storedTheme = localStorage.getItem("messenger-theme");
      if (storedLang === "fa" || storedLang === "en") setLang(storedLang);
      if (storedTheme === "light" || storedTheme === "dark") setDark(storedTheme === "dark");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("messenger-language", lang);
      localStorage.setItem("messenger-theme", dark ? "dark" : "light");
    } catch {}
  }, [lang, dark]);

  async function refreshUser(userId) {
    if (!supabase) return;
    const [{ data: p }, { data: u }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("profiles").select("id, username, display_name, contact_type, contact_value, created_at").neq("id", userId).order("username")
    ]);
    setProfile(p || null);
    setUsers(u || []);
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      if (!supabase) { setPageLoading(false); return; }
      const { data, error: e } = await supabase.auth.getSession();
      if (!active) return;
      if (e) setError(e.message);
      const next = data?.session || null;
      setSession(next);
      if (next?.user) await refreshUser(next.user.id);
      if (active) setPageLoading(false);
    }
    boot();
    const { data } = supabase?.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next || null);
      if (!next?.user) { setProfile(null); setUsers([]); setSelected(null); setMessages([]); return; }
      window.setTimeout(() => active && refreshUser(next.user.id), 0);
    }) || { data: null };
    return () => { active = false; data?.subscription?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase.channel(`private-messenger-${session.user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new;
        if (!selected) return;
        const belongs = (m.sender_id === session.user.id && m.receiver_id === selected.id) || (m.sender_id === selected.id && m.receiver_id === session.user.id);
        if (belongs) setMessages((list) => list.some((x) => x.id === m.id) ? list : [...list, m]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, selected?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.username || ""} ${u.display_name || ""}`.toLowerCase().includes(q));
  }, [users, search]);

  async function login() {
    setError(""); setSuccess("");
    if (!supabase) return setError(t.config);
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.invalidUser);
    if (password.length < 6) return setError(t.shortPassword);
    setBusy(true);
    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email: usernameEmail(u), password });
      if (e) throw e;
      setSuccess(t.profileSaved);
    } catch (e) { setError(friendlyAuthError(e, t)); }
    finally { setBusy(false); }
  }

  async function register() {
    setError(""); setSuccess("");
    if (!supabase) return setError(t.config);
    const u = username.trim().toLowerCase();
    const d = displayName.trim();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.invalidUser);
    if (!d || password.length < 6) return setError(t.registerRequired);
    if (shareContact && !contactValue.trim()) return setError(t.contact);
    setBusy(true);
    try {
      const { data, error: e } = await supabase.auth.signUp({ email: usernameEmail(u), password, options: { data: { username: u, display_name: d } } });
      if (e) throw e;
      if (!data.user) throw new Error(t.genericError);
      const { error: pe } = await supabase.from("profiles").upsert({ id: data.user.id, username: u, display_name: d, contact_type: shareContact ? contactType : null, contact_value: shareContact ? contactValue.trim() : null }, { onConflict: "id" });
      if (pe) throw pe;
      setSuccess(t.profileSaved); setAuthMode("login"); setPassword(""); setShareContact(false); setContactValue("");
    } catch (e) { setError(friendlyAuthError(e, t)); }
    finally { setBusy(false); }
  }

  async function openChat(user) {
    if (!session?.user?.id) return;
    setSelected(user); setMessages([]); setError("");
    const { data, error: e } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${session.user.id})`).order("created_at", { ascending: true }).limit(300);
    if (e) setError(e.message); else setMessages(data || []);
  }

  async function sendMessage() {
    const content = message.trim();
    if (!content || !selected || !session?.user?.id) return;
    setBusy(true); setError("");
    try {
      const { data, error: e } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selected.id, content, message_type: "text" }).select().single();
      if (e) throw e;
      setMessages((list) => list.some((x) => x.id === data.id) ? list : [...list, data]); setMessage("");
    } catch (e) { setError(e.message || t.messageFailed); }
    finally { setBusy(false); }
  }

  async function sendFile(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !selected || !session?.user?.id) return;
    if (file.size > 15 * 1024 * 1024) return setError("File size must be 15 MB or less.");
    setBusy(true); setError("");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: ue } = await supabase.storage.from("chat-files").upload(path, file, { upsert: false });
      if (ue) throw ue;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
      const { data, error: me } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selected.id, content: urlData.publicUrl, message_type: "file", file_name: file.name }).select().single();
      if (me) throw me;
      setMessages((list) => list.some((x) => x.id === data.id) ? list : [...list, data]);
    } catch (e) { setError(e.message || t.uploadFailed); }
    finally { setBusy(false); }
  }

  if (pageLoading) return <main className={`app-shell ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr"}><div className="loading-screen"><div className="brand-mark">M</div><span>{t.loading}</span></div></main>;

  if (!session) return <main className={`auth-page ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr"}>
    <div className="auth-orbit" />
    <section className="auth-card">
      <header className="auth-top"><div className="brand-lockup"><div className="brand-mark">M</div><div><div className="brand-name">{t.brand}</div><div className="brand-tagline">{t.tagline}</div></div></div><div className="top-actions"><button className="ghost-button" onClick={() => setLang((v) => v === "fa" ? "en" : "fa")}>{t.language}</button><button className="icon-button" onClick={() => setDark((v) => !v)}><Icon name={dark ? "sun" : "moon"} /></button></div></header>
      <div className="auth-tabs"><button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>{t.login}</button><button className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>{t.register}</button></div>
      <div className="auth-form">
        {authMode === "register" && <label><span>{t.display}</span><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.displayHint} autoComplete="name" /></label>}
        <label><span>{t.username}</span><input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="username" autoComplete="username" /></label>
        <label><span>{t.password}</span><input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} onKeyDown={(e) => e.key === "Enter" && (authMode === "login" ? login() : register())} /></label>
        {authMode === "register" && <div className="contact-box"><label className="check-line"><input type="checkbox" checked={shareContact} onChange={(e) => setShareContact(e.target.checked)} /><span>{t.contactQuestion} <small>{t.optional}</small></span></label>{shareContact && <div className="contact-fields"><select value={contactType} onChange={(e) => setContactType(e.target.value)}><option value="telegram">{t.telegram}</option><option value="instagram">{t.instagram}</option><option value="email">{t.email}</option><option value="phone">{t.phone}</option><option value="other">{t.other}</option></select><input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder={t.contactPlaceholder} /></div>}</div>}
      </div>
      {error && <div className="notice error">{error}</div>}{success && <div className="notice success">{success}</div>}
      <button className="primary-button" disabled={busy} onClick={authMode === "login" ? login : register}>{busy ? t.pleaseWait : authMode === "login" ? t.signIn : t.create}</button>
      <button className="support-link" onClick={() => setPanel("support")}><Icon name="support" /> {t.support}</button>
    </section>
    {panel === "support" && <Modal title={t.supportTitle} onClose={() => setPanel(null)}><p>{t.supportText}</p><a className="modal-link" href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer">{t.helpBot}</a><a className="modal-link" href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer">Utino</a><a className="modal-link" href="https://wdner.co" target="_blank" rel="noreferrer">WDNER</a><a className="modal-link" href="https://iparham.com" target="_blank" rel="noreferrer">iParham</a></Modal>}
  </main>;

  return <main className={`app-shell ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr">
    <div className="app-frame">
      <aside className={`sidebar ${selected ? "mobile-chat-open" : ""}`}>
        <div className="side-header"><div className="brand-lockup"><div className="brand-mark small">M</div><div><div className="brand-name">{t.brand}</div><div className="side-me">@{profile?.username || "user"}</div></div></div><div className="top-actions"><button className="icon-button" onClick={() => setPanel("notifications")} aria-label={t.notifications}><Icon name="bell" /></button><button className="icon-button" onClick={() => setDark((v) => !v)}><Icon name={dark ? "sun" : "moon"} /></button></div></div>
        <button className="profile-pill" onClick={() => setPanel("profile")}><div className="avatar">{(profile?.display_name || profile?.username || "M").slice(0,1).toUpperCase()}</div><div className="profile-text"><strong>{profile?.display_name || profile?.username}</strong><span>@{profile?.username}</span></div><span className="chevron">›</span></button>
        <div className="search-wrap"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></div>
        <div className="section-title"><span>{t.users}</span><span className="count-badge">{users.length}</span></div>
        <div className="user-list">{filteredUsers.map((u) => <button className={`user-row ${selected?.id === u.id ? "selected" : ""}`} key={u.id} onClick={() => openChat(u)}><div className="avatar">{(u.display_name || u.username || "U").slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{u.display_name || u.username}</strong><span>@{u.username}</span></div></button>)}{!filteredUsers.length && <div className="empty-list">{t.noUsers}</div>}</div>
        <div className="side-footer"><button onClick={() => setPanel("support")}><Icon name="support" />{t.support}</button><button onClick={() => setPanel("profile")}><Icon name="user" />{t.profile}</button><button onClick={() => supabase?.auth.signOut()}><span className="logout-dot" />{t.logout}</button></div>
      </aside>

      <section className="chat-panel">
        {!selected ? <div className="empty-chat"><div className="empty-icon"><span>✦</span></div><h1>{t.startChat}</h1><p>{t.startChatHint}</p></div> : <>
          <header className="chat-header"><div className="chat-person"><button className="back-button" onClick={() => setSelected(null)}>‹</button><div className="avatar large">{(selected.display_name || selected.username || "U").slice(0,1).toUpperCase()}</div><div><h2>{selected.display_name || selected.username}</h2><span>@{selected.username}</span></div></div><div className="chat-actions"><button className="icon-button" onClick={() => setPanel("notifications")}><Icon name="bell" /></button></div></header>
          <div className="messages">{!messages.length && <div className="empty-messages"><div className="empty-icon small">✦</div><strong>{t.noMessages}</strong><span>{t.firstMessage}</span></div>}{messages.map((m) => { const mine = m.sender_id === session.user.id; return <div key={m.id} className={`message-line ${mine ? "mine" : "theirs"}`}><div className={`message-bubble ${mine ? "mine" : "theirs"}`}>{m.message_type === "file" ? <a href={m.content} target="_blank" rel="noreferrer" className="file-message"><Icon name="paperclip" />{m.file_name || t.file}</a> : <div className="message-content">{m.content}</div>}<time>{timeLabel(m.created_at, lang)}</time></div></div>; })}<div ref={endRef} /></div>
          <div className="composer"><button className="icon-button attach" onClick={() => fileRef.current?.click()} disabled={busy}><Icon name="paperclip" /></button><input ref={fileRef} type="file" hidden onChange={sendFile} /><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.write} rows={1} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} /><button className="send-button" onClick={sendMessage} disabled={busy || !message.trim()}><Icon name="send" /></button></div>
        </>}
      </section>
    </div>

    {error && <div className="toast error">{error}<button onClick={() => setError("")}>×</button></div>}
    {success && <div className="toast success">{success}</div>}
    {panel === "support" && <Modal title={t.supportTitle} onClose={() => setPanel(null)}><p>{t.supportText}</p><a className="modal-link" href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer">{t.helpBot}</a><a className="modal-link" href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer">Utino</a><a className="modal-link" href="https://wdner.co" target="_blank" rel="noreferrer">WDNER</a><a className="modal-link" href="https://iparham.com" target="_blank" rel="noreferrer">iParham</a></Modal>}
    {panel === "notifications" && <Modal title={t.notifications} onClose={() => setPanel(null)}><div className="notice-card"><Icon name="support" /><div><strong>{t.support}</strong><p>{t.supportText}</p><button className="modal-button" onClick={() => setPanel("support")}>{t.support}</button></div></div><p className="muted">{t.noNotifications}</p></Modal>}
    {panel === "profile" && <Modal title={t.profile} onClose={() => setPanel(null)}><div className="profile-modal"><div className="avatar huge">{(profile?.display_name || profile?.username || "M").slice(0,1).toUpperCase()}</div><h3>{profile?.display_name || profile?.username}</h3><span>@{profile?.username}</span>{profile?.contact_value && <div className="contact-chip">{profile.contact_type}: {profile.contact_value}</div>}</div></Modal>}
  </main>;
}
