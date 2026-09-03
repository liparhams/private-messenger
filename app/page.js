"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jcblfgrcsgbdeamogzfc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const translations = {
  fa: {
    brand: "Messenger", subtitle: "پیام‌رسان خصوصی", login: "ورود", register: "ثبت‌نام",
    username: "نام کاربری", displayName: "نام نمایشی", password: "رمز عبور",
    contactMethod: "راه ارتباطی", contactValue: "اطلاعات تماس", optional: "اختیاری",
    loginButton: "ورود به حساب", registerButton: "ساخت حساب", usernamePlaceholder: "مثلاً arman",
    displayNamePlaceholder: "مثلاً آرمان", passwordPlaceholder: "رمز عبور",
    contactPlaceholder: "مثلاً @username یا شماره تماس", contactTelegram: "تلگرام",
    contactInstagram: "اینستاگرام", contactEmail: "ایمیل", contactPhone: "شماره تلفن", contactOther: "سایر",
    language: "EN", light: "حالت روشن", dark: "حالت تاریک", loading: "در حال بارگذاری...",
    wait: "لطفاً صبر کن...", userPassRequired: "نام کاربری و رمز عبور را وارد کن.",
    registerRequired: "نام کاربری، نام نمایشی و رمز عبور الزامی هستند.",
    usernameInvalid: "نام کاربری باید ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد.",
    passwordInvalid: "رمز عبور باید حداقل ۶ کاراکتر باشد.", profileCreated: "حساب با موفقیت ساخته شد.",
    loginSuccess: "ورود با موفقیت انجام شد.", serverError: "برقراری ارتباط با سرور انجام نشد.",
    accountCreationFailed: "ساخت حساب انجام نشد.", invalidLogin: "نام کاربری یا رمز عبور اشتباه است.",
    alreadyRegistered: "این نام کاربری قبلاً ثبت شده است.", emailNotConfirmed: "تأیید ایمیل برای این سیستم فعال نیست.",
    searchUser: "جستجوی کاربر...", users: "کاربران", noUser: "کاربری پیدا نشد", support: "پشتیبانی",
    logout: "خروج", privateChat: "گفت‌وگوی خصوصی", chooseUser: "یک کاربر را انتخاب کن",
    chooseUserDesc: "از فهرست کاربران یک نفر را انتخاب کن و گفت‌وگوی خصوصی را شروع کن.",
    firstMessage: "هنوز پیامی وجود ندارد", firstMessageDesc: "اولین پیام را ارسال کن.",
    messagePlaceholder: "پیام خود را بنویس...", openFile: "باز کردن فایل", fileUpload: "ارسال فایل",
    uploadFailed: "آپلود فایل انجام نشد.", sendFailed: "ارسال پیام انجام نشد.",
    supportDesc: "برای دریافت کمک می‌توانی از مسیرهای زیر استفاده کنی.",
    supportUtino: "پشتیبانی Utino", supportTelegram: "پشتیبانی Telegram", profile: "پروفایل",
    contact: "راه ارتباطی", close: "بستن", configError: "اتصال پیام‌رسان آماده نیست."
  },
  en: {
    brand: "Messenger", subtitle: "Private messaging", login: "Sign in", register: "Create account",
    username: "Username", displayName: "Display name", password: "Password",
    contactMethod: "Contact method", contactValue: "Contact details", optional: "Optional",
    loginButton: "Sign in", registerButton: "Create account", usernamePlaceholder: "e.g. arman",
    displayNamePlaceholder: "e.g. Arman", passwordPlaceholder: "Password",
    contactPlaceholder: "e.g. @username or phone number", contactTelegram: "Telegram",
    contactInstagram: "Instagram", contactEmail: "Email", contactPhone: "Phone", contactOther: "Other",
    language: "فا", light: "Light mode", dark: "Dark mode", loading: "Loading...", wait: "Please wait...",
    userPassRequired: "Enter your username and password.", registerRequired: "Username, display name and password are required.",
    usernameInvalid: "Username must be 3–20 characters and use English letters, numbers or _.",
    passwordInvalid: "Password must be at least 6 characters.", profileCreated: "Your account was created successfully.",
    loginSuccess: "Signed in successfully.", serverError: "Could not connect to the server.",
    accountCreationFailed: "Account creation failed.", invalidLogin: "Incorrect username or password.",
    alreadyRegistered: "This username is already registered.", emailNotConfirmed: "Email confirmation is not enabled for this system.",
    searchUser: "Search users...", users: "Users", noUser: "No users found", support: "Support",
    logout: "Sign out", privateChat: "Private Chat", chooseUser: "Choose a user",
    chooseUserDesc: "Select someone from the user list to start a private conversation.",
    firstMessage: "No messages yet", firstMessageDesc: "Send the first message.",
    messagePlaceholder: "Write a message...", openFile: "Open file", fileUpload: "Send file",
    uploadFailed: "File upload failed.", sendFailed: "Message could not be sent.",
    supportDesc: "Use one of the options below to get help.", supportUtino: "Utino Support",
    supportTelegram: "Telegram Support", profile: "Profile", contact: "Contact", close: "Close",
    configError: "Messenger connection is not ready."
  }
};

function usernameToEmail(username) { return `${username.toLowerCase()}@messenger.local`; }
function formatTime(value, lang) {
  if (!value) return "";
  try { return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
  catch { return ""; }
}
function mapAuthError(error, t) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("already registered") || message.includes("already exists") || message.includes("user already registered")) return t.alreadyRegistered;
  if (message.includes("invalid login credentials")) return t.invalidLogin;
  if (message.includes("email not confirmed")) return t.emailNotConfirmed;
  if (message.includes("password")) return t.passwordInvalid;
  return error?.message || t.accountCreationFailed;
}

export default function Home() {
  const [mode, setMode] = useState("login"), [lang, setLang] = useState("fa"), [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null), [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null), [messages, setMessages] = useState([]), [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState(""), [darkMode, setDarkMode] = useState(true);
  const [showProfile, setShowProfile] = useState(false), [showSupport, setShowSupport] = useState(false);
  const [username, setUsername] = useState(""), [password, setPassword] = useState(""), [displayName, setDisplayName] = useState("");
  const [contactEnabled, setContactEnabled] = useState(false), [contactType, setContactType] = useState("telegram"), [contactValue, setContactValue] = useState("");
  const [sendingFile, setSendingFile] = useState(false);
  const messagesEndRef = useRef(null), fileInputRef = useRef(null), t = translations[lang];

  async function loadProfile(userId) {
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) { console.error(profileError); setError(profileError.message); return null; }
    setProfile(data || null); return data || null;
  }
  async function loadUsers(userId) {
    const { data, error: usersError } = await supabase.from("profiles").select("id, username, display_name, contact_type, contact_value, created_at").neq("id", userId).order("username");
    if (usersError) { console.error(usersError); setError(usersError.message); return; }
    setUsers(data || []);
  }

  useEffect(() => {
    try {
      const l = localStorage.getItem("messenger-language"), th = localStorage.getItem("messenger-theme");
      if (l === "fa" || l === "en") setLang(l); if (th === "light" || th === "dark") setDarkMode(th === "dark");
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("messenger-language", lang); localStorage.setItem("messenger-theme", darkMode ? "dark" : "light"); } catch {} }, [lang, darkMode]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.auth.getSession();
        if (e) throw e; const s = data?.session || null; if (!mounted) return;
        setSession(s); if (s?.user) { await loadProfile(s.user.id); await loadUsers(s.user.id); }
      } catch (e) { if (mounted) setError(mapAuthError(e, t)); }
      finally { if (mounted) setLoading(false); }
    })();
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return; setSession(next || null);
      if (!next?.user) { setProfile(null); setUsers([]); setSelectedUser(null); setMessages([]); setLoading(false); return; }
      window.setTimeout(async () => { if (!mounted) return; await loadProfile(next.user.id); await loadUsers(next.user.id); if (mounted) setLoading(false); }, 0);
    });
    return () => { mounted = false; data?.subscription?.unsubscribe(); };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return users;
    return users.filter((u) => [u.username, u.display_name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [users, search]);

  async function loadMessages(other) {
    setSelectedUser(other); setError("");
    const my = session?.user?.id; if (!my || !other) return;
    const { data, error: e } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${my},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${my})`).order("created_at");
    if (e) { console.error(e); setError(e.message); return; } setMessages(data || []);
  }
  useEffect(() => {
    if (!session?.user?.id) return;
    const c = supabase.channel(`messages-${session.user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
      const m = p?.new; if (!m || !selectedUser) return;
      const ok = (m.sender_id === session.user.id && m.receiver_id === selectedUser.id) || (m.sender_id === selectedUser.id && m.receiver_id === session.user.id);
      if (ok) setMessages((cur) => cur.some((x) => x.id === m.id) ? cur : [...cur, m]);
    }).subscribe();
    return () => { supabase.removeChannel(c); };
  }, [session?.user?.id, selectedUser?.id]);
  useEffect(() => { try { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); } catch {} }, [messages]);

  async function login() {
    setError(""); setSuccess(""); const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.usernameInvalid); if (password.length < 6) return setError(t.passwordInvalid);
    setBusy(true); try { const { data, error: e } = await supabase.auth.signInWithPassword({ email: usernameToEmail(u), password }); if (e) throw e; if (!data?.session) throw new Error(t.invalidLogin); setSuccess(t.loginSuccess); } catch (e) { setError(mapAuthError(e, t)); } finally { setBusy(false); }
  }
  async function register() {
    setError(""); setSuccess(""); const u = username.trim().toLowerCase(), dn = displayName.trim();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.usernameInvalid); if (!dn || password.length < 6) return setError(t.registerRequired);
    setBusy(true); try {
      const { data, error: e } = await supabase.auth.signUp({ email: usernameToEmail(u), password, options: { data: { username: u, display_name: dn } } }); if (e) throw e;
      const payload = { id: data.user.id, username: u, display_name: dn, contact_type: contactEnabled ? contactType : null, contact_value: contactEnabled ? (contactValue.trim() || null) : null };
      const { error: pe } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }); if (pe) throw pe;
      setSuccess(t.profileCreated); setMode("login"); setPassword(""); setContactValue(""); setContactEnabled(false);
    } catch (e) { console.error(e); setError(mapAuthError(e, t)); } finally { setBusy(false); }
  }
  async function sendMessage() {
    const text = messageText.trim(); if (!text || !session?.user || !selectedUser) return; setBusy(true); setError("");
    try { const { data, error: e } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selectedUser.id, content: text, message_type: "text" }).select().single(); if (e) throw e; setMessages((cur) => cur.some((x) => x.id === data.id) ? cur : [...cur, data]); setMessageText(""); } catch (e) { setError(e.message || t.sendFailed); } finally { setBusy(false); }
  }
  async function uploadFile(ev) {
    const file = ev.target.files?.[0]; ev.target.value = ""; if (!file || !session?.user || !selectedUser) return;
    setSendingFile(true); setError("");
    try {
      const path = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: ue } = await supabase.storage.from("chat-files").upload(path, file, { upsert: false }); if (ue) throw ue;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
      const { data, error: me } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selectedUser.id, content: urlData.publicUrl, message_type: "file", file_name: file.name }).select().single(); if (me) throw me;
      setMessages((cur) => cur.some((x) => x.id === data.id) ? cur : [...cur, data]);
    } catch (e) { setError(e.message || t.uploadFailed); } finally { setSendingFile(false); }
  }
  async function logout() { await supabase.auth.signOut(); }

  const page = { minHeight: "100vh", background: darkMode ? "#09090b" : "#f4f4f5", color: darkMode ? "#fafafa" : "#18181b", padding: 16, boxSizing: "border-box", fontFamily: "system-ui, Arial, sans-serif" };
  const card = { background: darkMode ? "#18181b" : "#fff", border: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}`, borderRadius: 20, boxShadow: darkMode ? "0 18px 50px rgba(0,0,0,.25)" : "0 15px 45px rgba(0,0,0,.08)" };
  const input = { width: "100%", boxSizing: "border-box", padding: "12px 14px", marginBottom: 10, borderRadius: 12, border: `1px solid ${darkMode ? "#3f3f46" : "#d4d4d8"}`, background: darkMode ? "#111113" : "#fafafa", color: "inherit", outline: "none" };
  const primary = { width: "100%", padding: 12, border: 0, borderRadius: 12, background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 700 };
  const secondary = { width: "100%", padding: 11, borderRadius: 12, border: `1px solid ${darkMode ? "#3f3f46" : "#d4d4d8"}`, background: "transparent", color: "inherit", cursor: "pointer" };

  if (loading) return <main dir={lang === "fa" ? "rtl" : "ltr"} style={{ ...page, display: "grid", placeItems: "center" }}><div style={{ ...card, padding: 30 }}>{t.loading}</div></main>;
  if (!session) return <main dir={lang === "fa" ? "rtl" : "ltr"} style={{ ...page, display: "grid", placeItems: "center" }}><div style={{ ...card, width: "min(460px,100%)", padding: 28 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><div><div style={{ fontSize: 30, fontWeight: 800 }}>{t.brand}</div><div style={{ opacity: .6 }}>{t.subtitle}</div></div><div style={{ display: "flex", gap: 8 }}><button onClick={() => setLang((x) => x === "fa" ? "en" : "fa")} style={secondary}>{t.language}</button><button onClick={() => setDarkMode((x) => !x)} style={secondary}>{darkMode ? "☀" : "☾"}</button></div></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}><button onClick={() => { setMode("login"); setError(""); }} style={secondary}>{t.login}</button><button onClick={() => { setMode("register"); setError(""); }} style={secondary}>{t.register}</button></div>
    {mode === "register" && <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.displayNamePlaceholder} style={input} />}
    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.usernamePlaceholder} autoComplete="username" style={input} />
    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? login() : register())} style={input} />
    {mode === "register" && <>
      <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "6px 0 10px", cursor: "pointer", fontSize: 14 }}><input type="checkbox" checked={contactEnabled} onChange={(e) => setContactEnabled(e.target.checked)} style={{ width: 18, height: 18, margin: 0 }} />{t.contactMethod} <span style={{ opacity: .55 }}>({t.optional})</span></label>
      {contactEnabled && <><select value={contactType} onChange={(e) => setContactType(e.target.value)} style={input}><option value="telegram">{t.contactTelegram}</option><option value="instagram">{t.contactInstagram}</option><option value="email">{t.contactEmail}</option><option value="phone">{t.contactPhone}</option><option value="other">{t.contactOther}</option></select><input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder={t.contactPlaceholder} style={input} /></>}
    </>}
    {error && <div style={{ ...noticeError, marginBottom: 10 }}>{error}</div>}{success && <div style={{ ...noticeSuccess, marginBottom: 10 }}>{success}</div>}
    <button disabled={busy} onClick={mode === "login" ? login : register} style={primary}>{busy ? t.wait : mode === "login" ? t.loginButton : t.registerButton}</button>
    <button onClick={() => setShowSupport(true)} style={{ ...secondary, marginTop: 10 }}>{t.support}</button>
  </div>{showSupport && <Modal title={t.support} onClose={() => setShowSupport(false)}>{<><p>{t.supportDesc}</p><a href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer" style={link}>Telegram</a><a href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer" style={link}>Utino</a><a href="https://wdner.co" target="_blank" rel="noreferrer" style={link}>WDNER</a><a href="https://iparham.com" target="_blank" rel="noreferrer" style={link}>iParham</a></>}</Modal>}</main>;

  return <main dir={lang === "fa" ? "rtl" : "ltr"} style={page}><div className="messenger-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 16, minHeight: "calc(100vh - 32px)" }}>
    <aside style={{ ...card, padding: 16, display: "flex", flexDirection: "column" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div><strong>{profile?.display_name || profile?.username}</strong><div style={{ opacity: .55, fontSize: 12 }}>@{profile?.username}</div></div><div style={{ display: "flex", gap: 6 }}><button onClick={() => setLang((x) => x === "fa" ? "en" : "fa")} style={secondary}>{t.language}</button><button onClick={() => setDarkMode((x) => !x)} style={secondary}>{darkMode ? "☀" : "☾"}</button></div></div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchUser} style={input} /><button onClick={() => setShowSupport(true)} style={{ ...secondary, marginBottom: 12 }}>{t.support}</button><div style={{ opacity: .55, fontSize: 13, marginBottom: 8 }}>{t.users}</div><div style={{ overflow: "auto" }}>{filteredUsers.map((u) => <button key={u.id} onClick={() => loadMessages(u)} style={{ width: "100%", textAlign: "inherit", padding: 12, border: 0, borderRadius: 12, marginBottom: 6, background: selectedUser?.id === u.id ? (darkMode ? "#27272a" : "#e4e4e7") : "transparent", color: "inherit", cursor: "pointer" }}><div style={{ fontWeight: 700 }}>{u.display_name || u.username}</div><div style={{ opacity: .5, fontSize: 12 }}>@{u.username}</div></button>)}{!filteredUsers.length && <div style={{ opacity: .55, padding: 12 }}>{t.noUser}</div>}</div><div style={{ marginTop: "auto", display: "grid", gap: 8, paddingTop: 12 }}><button onClick={() => setShowProfile(true)} style={secondary}>{t.profile}</button><button onClick={logout} style={secondary}>{t.logout}</button></div></aside>
    <section style={{ ...card, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 32px)", overflow: "hidden" }}>{!selectedUser ? <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 30, textAlign: "center" }}><div><div style={{ fontSize: 24, fontWeight: 800 }}>{t.chooseUser}</div><div style={{ opacity: .6, marginTop: 8 }}>{t.chooseUserDesc}</div></div></div> : <><div style={{ padding: 18, borderBottom: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}` }}><strong>{selectedUser.display_name || selectedUser.username}</strong><div style={{ opacity: .5, fontSize: 12 }}>@{selectedUser.username}</div></div><div style={{ flex: 1, overflowY: "auto", padding: 18 }}>{!messages.length && <div style={{ textAlign: "center", opacity: .55, padding: 40 }}>{t.firstMessage}</div>}{messages.map((m) => { const mine = m.sender_id === session.user.id; return <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-start" : "flex-end", marginBottom: 10 }}><div style={{ maxWidth: "78%", padding: "10px 13px", borderRadius: 14, background: mine ? "#2563eb" : (darkMode ? "#27272a" : "#e4e4e7") }}>{m.message_type === "file" ? <a href={m.content} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>{m.file_name || t.openFile}</a> : <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.content}</div>}<div style={{ fontSize: 11, opacity: .6, marginTop: 4 }}>{formatTime(m.created_at, lang)}</div></div></div>; })}<div ref={messagesEndRef} /></div><div style={{ padding: 12, borderTop: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}`, display: "flex", gap: 8 }}><input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={t.messagePlaceholder} style={{ ...input, margin: 0, flex: 1 }} /><input ref={fileInputRef} type="file" hidden onChange={uploadFile} /><button onClick={() => fileInputRef.current?.click()} disabled={sendingFile} style={secondary}>📎</button><button onClick={sendMessage} disabled={busy || !messageText.trim()} style={primary}>{lang === "fa" ? "ارسال" : "Send"}</button></div></>}</section></div>{error && <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, maxWidth: 650, margin: "0 auto", ...noticeError }}>{error}</div>}{showProfile && <Modal title={t.profile} onClose={() => setShowProfile(false)}><div><strong>{profile?.display_name}</strong></div><div style={{ opacity: .55 }}>@{profile?.username}</div>{profile?.contact_value && <div style={{ marginTop: 10 }}>{t.contact}: {profile.contact_value}</div>}</Modal>}{showSupport && <Modal title={t.support} onClose={() => setShowSupport(false)}><p>{t.supportDesc}</p><a href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer" style={link}>Telegram</a><a href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer" style={link}>Utino</a><a href="https://wdner.co" target="_blank" rel="noreferrer" style={link}>WDNER</a><a href="https://iparham.com" target="_blank" rel="noreferrer" style={link}>iParham</a></Modal>}</main>;
}

const noticeError = { padding: 12, borderRadius: 12, background: "#991b1b", color: "#fff" };
const noticeSuccess = { padding: 12, borderRadius: 12, background: "#166534", color: "#fff" };
const link = { display: "block", padding: "9px 0", color: "#60a5fa" };
function Modal({ title, onClose, children }) { return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.62)", display: "grid", placeItems: "center", padding: 20, zIndex: 30 }}><div style={{ width: "min(500px,100%)", background: "#18181b", color: "#fff", borderRadius: 18, padding: 22 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0 }}>{title}</h2><button onClick={onClose} style={{ ...secondary, width: "auto" }}>×</button></div><div style={{ marginTop: 12 }}>{children}</div></div></div>;
}
