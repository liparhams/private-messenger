"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jcblfgrcsgbdeamogzfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";
const FILE_BUCKET = "chat-files";
const MAX_MESSAGE_LENGTH = 4000;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 180;
const AUTH_DOMAIN = "auth.messenger.local";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const SUPPORT = {
  username: "parham",
  displayName: "Parham Soleimany",
  telegram: "https://t.me/parhamsoleimanybot",
  utinoSupport: "https://utino.org/chat/supportusername",
  utino: "https://utino.org",
  iparham: "https://iparham.com",
  wdner: "https://wdner.co"
};

const TEXT = {
  fa: {
    brand: "Messenger", tagline: "پیام‌رسان", login: "ورود", register: "ثبت‌نام", username: "نام کاربری",
    usernameHint: "۳ تا ۲۰ کاراکتر، فقط حروف انگلیسی، عدد و _", display: "نام نمایشی", displayHint: "نامی که دیگران می‌بینند",
    password: "رمز عبور", signIn: "ورود به حساب", create: "ساخت حساب", pleaseWait: "لطفاً صبر کن...",
    contactQuestion: "راه ارتباطی من برای دیگران نمایش داده شود", optional: "اختیاری", telegram: "تلگرام", instagram: "اینستاگرام",
    email: "ایمیل", phone: "تلفن", other: "سایر", contactPlaceholder: "مثلاً @username یا شماره", search: "جستجوی کاربران",
    users: "کاربران", noUsers: "کاربری پیدا نشد", startChat: "یک گفت‌وگو را شروع کن", startChatHint: "یک نفر را از فهرست انتخاب کن.",
    noMessages: "هنوز پیامی نیست", firstMessage: "اولین پیام را بفرست.", write: "پیامت را بنویس...", send: "ارسال", support: "پشتیبانی",
    notifications: "اعلان‌ها", profile: "پروفایل", logout: "خروج", supportTitle: "پشتیبانی",
    supportText: "برای گزارش مشکل یا دریافت کمک، یکی از مسیرهای پشتیبانی را باز کن.", supportTelegram: "پشتیبانی در تلگرام", supportWeb: "پشتیبانی در یوتینو",
    supportUsername: "@parham", noNotifications: "اعلان جدیدی نداری.", back: "بازگشت", loading: "در حال بارگذاری...", close: "بستن",
    invalidUser: "نام کاربری نامعتبر است.", shortPassword: "رمز عبور باید حداقل ۶ کاراکتر باشد.", registerRequired: "نام نمایشی، نام کاربری و رمز عبور را کامل کن.",
    displayTooLong: "نام نمایشی بیش از حد طولانی است.", contactRequired: "برای نمایش راه ارتباطی، اطلاعات تماس را وارد کن.", invalidContactType: "نوع راه ارتباطی نامعتبر است.",
    invalidLogin: "نام کاربری یا رمز عبور اشتباه است.", already: "این نام کاربری قبلاً ثبت شده است.", genericError: "خطایی رخ داد. دوباره تلاش کن.",
    messageTooLong: "پیام نمی‌تواند بیشتر از ۴۰۰۰ کاراکتر باشد.", messageFailed: "ارسال پیام انجام نشد.", uploadFailed: "ارسال فایل انجام نشد.",
    fileTooLarge: "حجم فایل بیشتر از ۱۵ مگابایت است.", fileNameTooLong: "نام فایل بیش از حد طولانی است.", file: "فایل", openFile: "باز کردن فایل",
    signedIn: "ورود موفق بود.", accountCreated: "حساب ساخته شد. حالا وارد شو.", contact: "راه ارتباطی", supportFromError: "ارتباط با پشتیبانی",
    notificationSupport: "پشتیبانی در دسترس است.", notificationSupportText: "برای گزارش مشکل یا دریافت کمک، پشتیبانی رسمی را باز کن.", signedOut: "از حساب خارج شدی."
  },
  en: {
    brand: "Messenger", tagline: "Messaging platform", login: "Sign in", register: "Create account", username: "Username",
    usernameHint: "3–20 characters, English letters, numbers and _ only", display: "Display name", displayHint: "The name others see",
    password: "Password", signIn: "Sign in", create: "Create account", pleaseWait: "Please wait...",
    contactQuestion: "Show my contact method to other users", optional: "Optional", telegram: "Telegram", instagram: "Instagram",
    email: "Email", phone: "Phone", other: "Other", contactPlaceholder: "e.g. @username or phone", search: "Search users",
    users: "Users", noUsers: "No users found", startChat: "Start a conversation", startChatHint: "Choose someone from the list.",
    noMessages: "No messages yet", firstMessage: "Send the first message.", write: "Write a message...", send: "Send", support: "Support",
    notifications: "Notifications", profile: "Profile", logout: "Sign out", supportTitle: "Support",
    supportText: "Open one of the support options to report a problem or get help.", supportTelegram: "Support on Telegram", supportWeb: "Support on Utino",
    supportUsername: "@parham", noNotifications: "You have no new notifications.", back: "Back", loading: "Loading...", close: "Close",
    invalidUser: "Invalid username.", shortPassword: "Password must be at least 6 characters.", registerRequired: "Complete your display name, username and password.",
    displayTooLong: "Display name is too long.", contactRequired: "Enter contact details to display a contact method.", invalidContactType: "Invalid contact type.",
    invalidLogin: "Incorrect username or password.", already: "This username is already registered.", genericError: "Something went wrong. Please try again.",
    messageTooLong: "Messages cannot exceed 4000 characters.", messageFailed: "Message could not be sent.", uploadFailed: "File could not be sent.",
    fileTooLarge: "File size is over 15 MB.", fileNameTooLong: "File name is too long.", file: "File", openFile: "Open file",
    signedIn: "Signed in successfully.", accountCreated: "Account created. You can sign in now.", contact: "Contact", supportFromError: "Contact support",
    notificationSupport: "Support is available.", notificationSupportText: "Open official support to report a problem or get help.", signedOut: "You have signed out."
  }
};

const CONTACT_TYPES = new Set(["telegram", "instagram", "email", "phone", "other"]);

// Supabase Auth requires a syntactically valid email. Users never see this address.
function usernameEmail(username) {
  const u = username.trim().toLowerCase();
  return `${u}@${AUTH_DOMAIN}`;
}
function firstLetter(value) { return (value || "M").trim().slice(0, 1).toUpperCase(); }
function formatTime(value, lang) {
  if (!value) return "";
  try { return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch { return ""; }
}
function authError(error, t) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return t.invalidLogin;
  if (message.includes("already registered") || message.includes("already exists") || message.includes("duplicate") || message.includes("user already registered")) return t.already;
  if (message.includes("rate limit") || message.includes("too many requests")) return "تعداد تلاش‌ها زیاد است. چند دقیقه صبر کن و دوباره امتحان کن.";
  if (message.includes("invalid email") || message.includes("email address")) return "خطای تنظیمات احراز هویت. دامنه داخلی حساب در Supabase باید فعال باشد.";
  if (message.includes("password")) return t.shortPassword;
  return t.genericError;
}

function Icon({ name }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const shapes = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    paperclip: <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.5-8.5" />,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    support: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>
  };
  return <svg {...common}>{shapes[name] || shapes.user}</svg>;
}

function Modal({ title, onClose, closeLabel, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
    <div className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={closeLabel}>×</button></div>
      <div className="modal-body">{children}</div>
    </div>
  </div>;
}

function SupportPanel({ t, onClose }) {
  return <Modal title={t.supportTitle} onClose={onClose} closeLabel={t.close}>
    <div className="support-account"><div className="avatar huge">P</div><div><strong>{SUPPORT.displayName}</strong><span>{t.supportUsername}</span></div></div>
    <p>{t.supportText}</p>
    <a className="modal-link" href={SUPPORT.telegram} target="_blank" rel="noopener noreferrer"><span>{t.supportTelegram}</span><Icon name="external" /></a>
    <a className="modal-link" href={SUPPORT.utinoSupport} target="_blank" rel="noopener noreferrer"><span>{t.supportWeb}</span><Icon name="external" /></a>
    <div className="support-sites"><a href={SUPPORT.iparham} target="_blank" rel="noopener noreferrer">iParham</a><a href={SUPPORT.wdner} target="_blank" rel="noopener noreferrer">WDNER</a><a href={SUPPORT.utino} target="_blank" rel="noopener noreferrer">Utino</a></div>
  </Modal>;
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
  const [unread, setUnread] = useState({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [shareContact, setShareContact] = useState(false);
  const [contactType, setContactType] = useState("telegram");
  const [contactValue, setContactValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [panel, setPanel] = useState(null);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const t = TEXT[lang];

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("messenger-language");
      const savedTheme = localStorage.getItem("messenger-theme");
      if (savedLang === "fa" || savedLang === "en") setLang(savedLang);
      if (savedTheme === "light" || savedTheme === "dark") setDark(savedTheme === "dark");
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("messenger-language", lang); localStorage.setItem("messenger-theme", dark ? "dark" : "light"); } catch {}
  }, [lang, dark]);

  const reportError = (cause, fallback = t.genericError) => { console.error(cause); setError(fallback); };

  async function refreshUser(userId) {
    const [profileResult, usersResult] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, contact_type, contact_value, created_at").eq("id", userId).maybeSingle(),
      supabase.from("profiles").select("id, username, display_name, contact_type, contact_value, created_at").neq("id", userId).order("username").limit(500)
    ]);
    if (profileResult.error) throw profileResult.error;
    if (usersResult.error) throw usersResult.error;
    setProfile(profileResult.data || null); setUsers(usersResult.data || []);
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!active) return;
        const nextSession = data?.session || null;
        setSession(nextSession);
        if (nextSession?.user) await refreshUser(nextSession.user.id);
      } catch (cause) { if (active) reportError(cause); } finally { if (active) setLoading(false); }
    }
    boot();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession || null);
      if (!nextSession?.user) { setProfile(null); setUsers([]); setSelected(null); setMessages([]); setUnread({}); return; }
      window.setTimeout(() => refreshUser(nextSession.user.id).catch((cause) => reportError(cause)), 0);
    });
    return () => { active = false; data?.subscription?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase.channel(`messages-${session.user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const incoming = payload.new;
      if (!incoming?.id) return;
      const mine = incoming.sender_id === session.user.id;
      const forMe = incoming.receiver_id === session.user.id;
      if (!mine && !forMe) return;
      setSelected((currentSelected) => {
        if (currentSelected && ((incoming.sender_id === session.user.id && incoming.receiver_id === currentSelected.id) || (incoming.sender_id === currentSelected.id && incoming.receiver_id === session.user.id))) {
          setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
          if (incoming.sender_id === currentSelected.id) setUnread((current) => ({ ...current, [currentSelected.id]: 0 }));
        } else if (forMe) setUnread((current) => ({ ...current, [incoming.sender_id]: (current[incoming.sender_id] || 0) + 1 }));
        return currentSelected;
      });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? users.filter((user) => `${user.username || ""} ${user.display_name || ""}`.toLowerCase().includes(q)) : users;
  }, [users, search]);

  async function login() {
    setError(""); setSuccess("");
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.invalidUser);
    if (password.length < 6) return setError(t.shortPassword);
    setBusy(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: usernameEmail(u), password });
      if (loginError) throw loginError;
      setSuccess(t.signedIn); setPassword("");
    } catch (cause) { setError(authError(cause, t)); } finally { setBusy(false); }
  }

  async function register() {
    setError(""); setSuccess("");
    const u = username.trim().toLowerCase();
    const d = displayName.trim();
    const c = contactValue.trim();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.invalidUser);
    if (!d || password.length < 6) return setError(t.registerRequired);
    if (d.length > 80) return setError(t.displayTooLong);
    if (shareContact && !c) return setError(t.contactRequired);
    if (shareContact && !CONTACT_TYPES.has(contactType)) return setError(t.invalidContactType);
    setBusy(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: usernameEmail(u), password,
        options: { data: { username: u, display_name: d, contact_type: shareContact ? contactType : null, contact_value: shareContact ? c : null } }
      });
      if (signupError) throw signupError;
      if (!data?.user) throw new Error("signup_failed");
      setSuccess(t.accountCreated); setAuthMode("login"); setUsername(u); setPassword(""); setDisplayName(""); setShareContact(false); setContactValue("");
    } catch (cause) { setError(authError(cause, t)); } finally { setBusy(false); }
  }

  async function openChat(user) {
    if (!session?.user?.id || !user?.id) return;
    setSelected(user); setMessages([]); setError(""); setUnread((current) => ({ ...current, [user.id]: 0 }));
    const { data, error: queryError } = await supabase.from("messages").select("id, sender_id, receiver_id, content, message_type, file_name, created_at").or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${session.user.id})`).order("created_at", { ascending: true }).limit(500);
    if (queryError) reportError(queryError, t.messageFailed); else setMessages(data || []);
  }

  async function sendMessage() {
    const content = message.trim();
    if (!content || !selected || !session?.user?.id || busy) return;
    if (content.length > MAX_MESSAGE_LENGTH) return setError(t.messageTooLong);
    setBusy(true); setError("");
    try {
      const { data, error: insertError } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selected.id, content, message_type: "text" }).select("id, sender_id, receiver_id, content, message_type, file_name, created_at").single();
      if (insertError) throw insertError;
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]); setMessage("");
    } catch (cause) { reportError(cause, t.messageFailed); } finally { setBusy(false); }
  }

  async function sendFile(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !selected || !session?.user?.id || busy) return;
    if (file.size > MAX_FILE_SIZE) return setError(t.fileTooLarge);
    const originalName = String(file.name || t.file);
    if (originalName.length > MAX_FILENAME_LENGTH) return setError(t.fileNameTooLong);
    setBusy(true); setError(""); let path = "";
    try {
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, MAX_FILENAME_LENGTH) || "file";
      path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from(FILE_BUCKET).upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream", cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data, error: messageError } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selected.id, content: path, message_type: "file", file_name: originalName }).select("id, sender_id, receiver_id, content, message_type, file_name, created_at").single();
      if (messageError) throw messageError;
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]);
    } catch (cause) {
      reportError(cause, t.uploadFailed);
      if (path) { const { error: cleanupError } = await supabase.storage.from(FILE_BUCKET).remove([path]); if (cleanupError) console.error(cleanupError); }
    } finally { setBusy(false); }
  }

  async function openFile(item) {
    if (!item?.content) return;
    const { data, error: signedError } = await supabase.storage.from(FILE_BUCKET).createSignedUrl(item.content, 3600, { download: item.file_name || true });
    if (signedError || !data?.signedUrl) return reportError(signedError, t.uploadFailed);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function logout() {
    setBusy(true);
    try { const { error: logoutError } = await supabase.auth.signOut(); if (logoutError) throw logoutError; setSuccess(t.signedOut); }
    catch (cause) { reportError(cause); } finally { setBusy(false); }
  }

  const direction = lang === "fa" ? "rtl" : "ltr";
  // Keep the existing visual markup/styles from the repository below this point.
  return <main dir={direction} className={dark ? "app dark" : "app light"}>
    {loading ? <div className="loading-screen">{t.loading}</div> : !session ? <section className="auth-page">
      <div className="auth-card"><div className="brand"><strong>{t.brand}</strong><span>{t.tagline}</span></div>
        <div className="auth-tabs"><button type="button" className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setError(""); }}>{t.login}</button><button type="button" className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setError(""); }}>{t.register}</button></div>
        {authMode === "register" && <label>{t.display}<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.displayHint} maxLength={80} /></label>}
        <label>{t.username}<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoComplete="username" maxLength={20} /></label>
        {authMode === "register" && <small>{t.usernameHint}</small>}
        <label>{t.password}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
        {authMode === "register" && <>
          <label className="check-row"><input type="checkbox" checked={shareContact} onChange={(e) => setShareContact(e.target.checked)} /><span>{t.contactQuestion} <em>{t.optional}</em></span></label>
          {shareContact && <div className="contact-fields"><select value={contactType} onChange={(e) => setContactType(e.target.value)}><option value="telegram">{t.telegram}</option><option value="instagram">{t.instagram}</option><option value="email">{t.email}</option><option value="phone">{t.phone}</option><option value="other">{t.other}</option></select><input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder={t.contactPlaceholder} maxLength={160} /></div>}
        </>}
        {error && <div className="error-box">{error}</div>}{success && <div className="success-box">{success}</div>}
        <button type="button" className="primary-button" disabled={busy} onClick={authMode === "login" ? login : register}>{busy ? t.pleaseWait : authMode === "login" ? t.signIn : t.create}</button>
        <div className="auth-tools"><button type="button" onClick={() => setLang(lang === "fa" ? "en" : "fa")}>{lang === "fa" ? "EN" : "FA"}</button><button type="button" onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} /></button></div>
      </div>
    </section> : <section className="messenger-shell">
      <header><div><strong>{t.brand}</strong><span>{profile?.display_name || profile?.username || ""}</span></div><nav><button type="button" onClick={() => setPanel("support")}><Icon name="support" /></button><button type="button" onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} /></button><button type="button" onClick={() => setLang(lang === "fa" ? "en" : "fa")}>{lang === "fa" ? "EN" : "FA"}</button><button type="button" onClick={logout}>{t.logout}</button></nav></header>
      <div className="messenger-body"><aside><div className="search-box"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} /></div>{filteredUsers.length ? filteredUsers.map((user) => <button type="button" className={`user-row ${selected?.id === user.id ? "selected" : ""}`} key={user.id} onClick={() => openChat(user)}><span className="avatar">{firstLetter(user.display_name || user.username)}</span><span><strong>{user.display_name || user.username}</strong><small>@{user.username}</small></span>{unread[user.id] ? <b>{unread[user.id]}</b> : null}</button>) : <div className="empty-list">{t.noUsers}</div>}</aside>
        <div className="chat-panel">{selected ? <><div className="chat-head"><span className="avatar">{firstLetter(selected.display_name || selected.username)}</span><div><strong>{selected.display_name || selected.username}</strong><small>@{selected.username}</small></div></div><div className="messages">{messages.length ? messages.map((item) => <div key={item.id} className={`message ${item.sender_id === session.user.id ? "mine" : "theirs"}`}>{item.message_type === "file" ? <button type="button" onClick={() => openFile(item)}>{t.file}: {item.file_name || t.file}</button> : <span>{item.content}</span>}<time>{formatTime(item.created_at, lang)}</time></div>) : <div className="empty-chat">{t.noMessages}<small>{t.firstMessage}</small></div>}<div ref={endRef} /></div><div className="composer"><input type="file" ref={fileRef} onChange={sendFile} hidden /><button type="button" onClick={() => fileRef.current?.click()} disabled={busy}><Icon name="paperclip" /></button><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={t.write} maxLength={MAX_MESSAGE_LENGTH} /><button type="button" onClick={sendMessage} disabled={busy || !message.trim()}><Icon name="send" /></button></div></> : <div className="empty-chat"><h2>{t.startChat}</h2><p>{t.startChatHint}</p></div>}</div></div>
      </div>
    </section>}
    {panel === "support" && <SupportPanel t={t} onClose={() => setPanel(null)} />}
  </main>;
}
