"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

const translations = {
  fa: {
    brand: "Messenger",
    subtitle: "پیام‌رسان خصوصی",
    login: "ورود",
    register: "ثبت‌نام",
    username: "نام کاربری",
    displayName: "نام نمایشی",
    password: "رمز عبور",
    contactMethod: "راه ارتباطی",
    contactValue: "اطلاعات تماس",
    optional: "اختیاری",
    loginButton: "ورود به حساب",
    registerButton: "ساخت حساب",
    usernamePlaceholder: "مثلاً arman",
    displayNamePlaceholder: "مثلاً آرمان",
    passwordPlaceholder: "رمز عبور",
    contactPlaceholder: "مثلاً @username یا شماره تماس",
    contactTelegram: "تلگرام",
    contactInstagram: "اینستاگرام",
    contactEmail: "ایمیل",
    contactPhone: "شماره تلفن",
    contactOther: "سایر",
    language: "EN",
    light: "حالت روشن",
    dark: "حالت تاریک",
    loading: "در حال بارگذاری...",
    wait: "لطفاً صبر کن...",
    userPassRequired: "نام کاربری و رمز عبور را وارد کن.",
    registerRequired: "نام کاربری، نام نمایشی و رمز عبور الزامی هستند.",
    usernameInvalid: "نام کاربری باید ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد.",
    passwordInvalid: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
    profileCreated: "حساب با موفقیت ساخته شد.",
    loginSuccess: "ورود با موفقیت انجام شد.",
    serverError: "برقراری ارتباط با سرور انجام نشد.",
    configError: "تنظیمات اتصال پیام‌رسان کامل نیست. متغیرهای Supabase را در Cloudflare بررسی کن.",
    accountCreationFailed: "ساخت حساب انجام نشد.",
    invalidLogin: "نام کاربری یا رمز عبور اشتباه است.",
    alreadyRegistered: "این نام کاربری قبلاً ثبت شده است.",
    emailNotConfirmed: "تأیید ایمیل برای این سیستم فعال نیست.",
    searchUser: "جستجوی کاربر...",
    users: "کاربران",
    noUser: "کاربری پیدا نشد",
    support: "پشتیبانی",
    logout: "خروج",
    privateChat: "Private Chat",
    chooseUser: "یک کاربر را انتخاب کن",
    chooseUserDesc: "از فهرست کاربران یک نفر را انتخاب کن و گفت‌وگوی خصوصی را شروع کن.",
    firstMessage: "هنوز پیامی وجود ندارد",
    firstMessageDesc: "اولین پیام را ارسال کن.",
    messagePlaceholder: "پیام خود را بنویس...",
    openFile: "باز کردن فایل",
    fileUpload: "ارسال فایل",
    uploadFailed: "آپلود فایل انجام نشد.",
    sendFailed: "ارسال پیام انجام نشد.",
    supportDesc: "برای دریافت کمک می‌توانی از مسیرهای زیر استفاده کنی.",
    supportUtino: "پشتیبانی Utino",
    supportTelegram: "پشتیبانی Telegram",
    profile: "پروفایل",
    contact: "راه ارتباطی",
    close: "بستن",
  },
  en: {
    brand: "Messenger",
    subtitle: "Private messaging",
    login: "Sign in",
    register: "Create account",
    username: "Username",
    displayName: "Display name",
    password: "Password",
    contactMethod: "Contact method",
    contactValue: "Contact details",
    optional: "Optional",
    loginButton: "Sign in",
    registerButton: "Create account",
    usernamePlaceholder: "e.g. arman",
    displayNamePlaceholder: "e.g. Arman",
    passwordPlaceholder: "Password",
    contactPlaceholder: "e.g. @username or phone number",
    contactTelegram: "Telegram",
    contactInstagram: "Instagram",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactOther: "Other",
    language: "فا",
    light: "Light mode",
    dark: "Dark mode",
    loading: "Loading...",
    wait: "Please wait...",
    userPassRequired: "Enter your username and password.",
    registerRequired: "Username, display name and password are required.",
    usernameInvalid: "Username must be 3–20 characters and use English letters, numbers or _.",
    passwordInvalid: "Password must be at least 6 characters.",
    profileCreated: "Your account was created successfully.",
    loginSuccess: "Signed in successfully.",
    serverError: "Could not connect to the server.",
    configError: "Supabase configuration is incomplete. Check the Cloudflare variables.",
    accountCreationFailed: "Account creation failed.",
    invalidLogin: "Incorrect username or password.",
    alreadyRegistered: "This username is already registered.",
    emailNotConfirmed: "Email confirmation is not enabled for this system.",
    searchUser: "Search users...",
    users: "Users",
    noUser: "No users found",
    support: "Support",
    logout: "Sign out",
    privateChat: "Private Chat",
    chooseUser: "Choose a user",
    chooseUserDesc: "Select someone from the user list to start a private conversation.",
    firstMessage: "No messages yet",
    firstMessageDesc: "Send the first message.",
    messagePlaceholder: "Write a message...",
    openFile: "Open file",
    fileUpload: "Send file",
    uploadFailed: "File upload failed.",
    sendFailed: "Message could not be sent.",
    supportDesc: "Use one of the options below to get help.",
    supportUtino: "Utino Support",
    supportTelegram: "Telegram Support",
    profile: "Profile",
    contact: "Contact",
    close: "Close",
  },
};

function usernameToEmail(username) {
  return `${username.toLowerCase()}@messenger.local`;
}

function formatTime(value, lang) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function mapAuthError(error, t) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("already registered") || message.includes("already exists") || message.includes("user already registered")) return t.alreadyRegistered;
  if (message.includes("password") && (message.includes("6") || message.includes("8") || message.includes("characters"))) return t.passwordInvalid;
  if (message.includes("invalid login credentials")) return t.invalidLogin;
  if (message.includes("email not confirmed")) return t.emailNotConfirmed;
  return error?.message || t.accountCreationFailed;
}

export default function Home() {
  const [mode, setMode] = useState("login");
  const [lang, setLang] = useState("fa");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactType, setContactType] = useState("telegram");
  const [contactValue, setContactValue] = useState("");
  const [sendingFile, setSendingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const t = translations[lang];

  async function loadProfile(userId) {
    if (!supabase || !userId) return null;
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) {
      console.error(profileError);
      setError(profileError.message);
      return null;
    }
    setProfile(data || null);
    return data || null;
  }

  async function loadUsers(userId) {
    if (!supabase || !userId) return;
    const { data, error: usersError } = await supabase
      .from("profiles")
      .select("id, username, display_name, contact_type, contact_value, created_at")
      .neq("id", userId)
      .order("username", { ascending: true });
    if (usersError) {
      console.error(usersError);
      setError(usersError.message);
      return;
    }
    setUsers(data || []);
  }

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("messenger-language");
      const savedTheme = localStorage.getItem("messenger-theme");
      if (savedLang === "fa" || savedLang === "en") setLang(savedLang);
      if (savedTheme === "light" || savedTheme === "dark") setDarkMode(savedTheme === "dark");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("messenger-language", lang);
      localStorage.setItem("messenger-theme", darkMode ? "dark" : "light");
    } catch {}
  }, [lang, darkMode]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        setError(t.configError);
        setLoading(false);
        return;
      }
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted) return;
        const currentSession = data?.session || null;
        setSession(currentSession);
        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
          await loadUsers(currentSession.user.id);
        }
      } catch (err) {
        console.error("Messenger init error", err);
        if (mounted) setError(mapAuthError(err, t));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    if (!supabase) return () => { mounted = false; };

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession || null);

      if (!newSession?.user) {
        setProfile(null);
        setUsers([]);
        setSelectedUser(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      window.setTimeout(async () => {
        if (!mounted) return;
        await loadProfile(newSession.user.id);
        await loadUsers(newSession.user.id);
        if (mounted) setLoading(false);
      }, 0);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) => [user.username, user.display_name].filter(Boolean).some((item) => String(item).toLowerCase().includes(value)));
  }, [users, search]);

  async function loadMessages(otherUser) {
    if (!supabase || !session?.user || !otherUser) return;
    setSelectedUser(otherUser);
    setError("");

    const myId = session.user.id;
    const otherId = otherUser.id;
    const { data, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error(messagesError);
      setError(messagesError.message);
      return;
    }
    setMessages(data || []);
  }

  useEffect(() => {
    if (!supabase || !session?.user?.id) return undefined;

    const channel = supabase
      .channel(`messages-${session.user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const message = payload?.new;
        if (!message) return;
        setMessages((current) => {
          const belongsToSelected = selectedUser && ((message.sender_id === session.user.id && message.receiver_id === selectedUser.id) || (message.sender_id === selectedUser.id && message.receiver_id === session.user.id));
          if (!belongsToSelected || current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload?.new;
        if (!updated) return;
        setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") console.error("Supabase realtime channel error");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, selectedUser?.id]);

  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {}
  }, [messages]);

  async function login() {
    setError("");
    setSuccess("");
    const cleanUsername = username.trim().toLowerCase();
    if (!supabase) return setError(t.configError);
    if (!cleanUsername || !password) return setError(t.userPassRequired);
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) return setError(t.usernameInvalid);
    if (password.length < 6) return setError(t.passwordInvalid);

    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: usernameToEmail(cleanUsername), password });
      if (authError) throw authError;
      if (!data?.session) throw new Error(t.invalidLogin);
      setSuccess(t.loginSuccess);
    } catch (err) {
      console.error("Login error", err);
      setError(mapAuthError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function register() {
    setError("");
    setSuccess("");
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    if (!supabase) return setError(t.configError);
    if (!cleanUsername || !cleanDisplayName || !password) return setError(t.registerRequired);
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) return setError(t.usernameInvalid);
    if (password.length < 6) return setError(t.passwordInvalid);

    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: usernameToEmail(cleanUsername),
        password,
        options: { data: { username: cleanUsername, display_name: cleanDisplayName } },
      });
      if (authError) throw authError;
      if (!data?.user) throw new Error(t.accountCreationFailed);

      const profilePayload = {
        id: data.user.id,
        username: cleanUsername,
        display_name: cleanDisplayName,
        contact_type: contactType || null,
        contact_value: contactValue.trim() || null,
      };

      const { error: profileError } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });
      if (profileError) {
        console.error("Profile create error", profileError);
        throw profileError;
      }

      setSuccess(t.profileCreated);
      setMode("login");
      setPassword("");
    } catch (err) {
      console.error("Registration error", err);
      setError(mapAuthError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const text = messageText.trim();
    if (!supabase || !session?.user || !selectedUser || !text) return;
    setError("");
    setBusy(true);
    try {
      const { data, error: messageError } = await supabase.from("messages").insert({ sender_id: session.user.id, receiver_id: selectedUser.id, content: text, message_type: "text" }).select().single();
      if (messageError) throw messageError;
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]);
      setMessageText("");
    } catch (err) {
      console.error("Send message error", err);
      setError(err?.message || t.sendFailed);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!supabase || !session?.user || !selectedUser || !file) return;
    setSendingFile(true);
    setError("");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${session.user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("chat-files").getPublicUrl(path);
      const { data, error: messageError } = await supabase.from("messages").insert({
        sender_id: session.user.id,
        receiver_id: selectedUser.id,
        content: publicUrlData.publicUrl,
        message_type: "file",
        file_name: file.name,
      }).select().single();
      if (messageError) throw messageError;
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data]);
    } catch (err) {
      console.error("Upload error", err);
      setError(err?.message || t.uploadFailed);
    } finally {
      setSendingFile(false);
    }
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  function toggleLanguage() {
    setLang((current) => (current === "fa" ? "en" : "fa"));
  }

  function toggleTheme() {
    setDarkMode((current) => !current);
  }

  const pageStyle = {
    minHeight: "100vh",
    background: darkMode ? "#09090b" : "#f4f4f5",
    color: darkMode ? "#f4f4f5" : "#18181b",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  };

  const cardStyle = {
    background: darkMode ? "#18181b" : "#ffffff",
    border: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}`,
    borderRadius: 18,
    boxShadow: darkMode ? "0 18px 60px rgba(0,0,0,.28)" : "0 18px 60px rgba(24,24,27,.08)",
  };

  if (loading) {
    return <main style={{ ...pageStyle, display: "grid", placeItems: "center" }}><div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>{t.loading}</div></main>;
  }

  if (!session) {
    return (
      <main dir={lang === "fa" ? "rtl" : "ltr"} style={{ ...pageStyle, display: "grid", placeItems: "center" }}>
        <div style={{ ...cardStyle, width: "min(460px, 100%)", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div><div style={{ fontSize: 28, fontWeight: 800 }}>{t.brand}</div><div style={{ opacity: .65, marginTop: 4 }}>{t.subtitle}</div></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={toggleLanguage} style={{ border: 0, borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>{t.language}</button>
              <button onClick={toggleTheme} style={{ border: 0, borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}>{darkMode ? "☀" : "☾"}</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["login", "register"].map((item) => <button key={item} onClick={() => { setMode(item); setError(""); setSuccess(""); }} style={{ flex: 1, padding: "11px 12px", borderRadius: 12, border: "1px solid #3f3f46", cursor: "pointer", background: mode === item ? "#27272a" : "transparent", color: "inherit" }}>{t[item]}</button>)}
          </div>

          {mode === "register" && <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.displayNamePlaceholder} style={inputStyle} />}
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t.usernamePlaceholder} autoComplete="username" style={inputStyle} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} onKeyDown={(e) => { if (e.key === "Enter") mode === "login" ? login() : register(); }} style={inputStyle} />

          {mode === "register" && <>
            <select value={contactType} onChange={(e) => setContactType(e.target.value)} style={inputStyle}>
              <option value="telegram">{t.contactTelegram}</option>
              <option value="instagram">{t.contactInstagram}</option>
              <option value="email">{t.contactEmail}</option>
              <option value="phone">{t.contactPhone}</option>
              <option value="other">{t.contactOther}</option>
            </select>
            <input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder={`${t.contactValue} (${t.optional})`} style={inputStyle} />
          </>}

          {error && <div style={noticeError}>{error}</div>}
          {success && <div style={noticeSuccess}>{success}</div>}

          <button disabled={busy} onClick={mode === "login" ? login : register} style={primaryButton}>{busy ? t.wait : mode === "login" ? t.loginButton : t.registerButton}</button>
          <button onClick={() => setShowSupport(true)} style={{ ...secondaryButton, marginTop: 10 }}>{t.support}</button>
        </div>

        {showSupport && <Modal title={t.support} onClose={() => setShowSupport(false)} darkMode={darkMode}>
          <p>{t.supportDesc}</p>
          <a href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer" style={linkStyle}>{t.supportTelegram}</a>
          <a href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer" style={linkStyle}>{t.supportUtino}</a>
          <a href="https://wdner.co" target="_blank" rel="noreferrer" style={linkStyle}>WDNER</a>
          <a href="https://iparham.com" target="_blank" rel="noreferrer" style={linkStyle}>iParham</a>
        </Modal>}
      </main>
    );
  }

  return (
    <main dir={lang === "fa" ? "rtl" : "ltr"} style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
        <aside style={{ ...cardStyle, padding: 18, minHeight: "calc(100vh - 48px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 18 }}>
            <div><strong>{profile?.display_name || profile?.username || "Messenger"}</strong><div style={{ opacity: .55, fontSize: 13 }}>{profile?.username ? `@${profile.username}` : ""}</div></div>
            <div style={{ display: "flex", gap: 6 }}><button onClick={toggleLanguage} style={smallButton}>{t.language}</button><button onClick={toggleTheme} style={smallButton}>{darkMode ? "☀" : "☾"}</button></div>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchUser} style={inputStyle} />
          <button onClick={() => setShowSupport(true)} style={{ ...secondaryButton, marginBottom: 12 }}>{t.support}</button>
          <div style={{ opacity: .55, fontSize: 13, marginBottom: 8 }}>{t.users}</div>
          <div>
            {filteredUsers.map((user) => <button key={user.id} onClick={() => loadMessages(user)} style={{ width: "100%", textAlign: lang === "fa" ? "right" : "left", padding: 12, borderRadius: 12, border: 0, marginBottom: 6, background: selectedUser?.id === user.id ? (darkMode ? "#27272a" : "#e4e4e7") : "transparent", color: "inherit", cursor: "pointer" }}><div style={{ fontWeight: 700 }}>{user.display_name || user.username}</div><div style={{ opacity: .55, fontSize: 12 }}>@{user.username}</div></button>)}
            {!filteredUsers.length && <div style={{ opacity: .55, padding: 12 }}>{t.noUser}</div>}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 18, display: "grid", gap: 8 }}>
            <button onClick={() => setShowProfile(true)} style={secondaryButton}>{t.profile}</button>
            <button onClick={logout} style={secondaryButton}>{t.logout}</button>
          </div>
        </aside>

        <section style={{ ...cardStyle, minHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selectedUser ? <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 30, textAlign: "center" }}><div><div style={{ fontSize: 24, fontWeight: 800 }}>{t.chooseUser}</div><div style={{ opacity: .6, marginTop: 8 }}>{t.chooseUserDesc}</div></div></div> : <>
            <div style={{ padding: 18, borderBottom: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}` }}><div style={{ fontWeight: 800 }}>{selectedUser.display_name || selectedUser.username}</div><div style={{ opacity: .55, fontSize: 13 }}>@{selectedUser.username}</div></div>
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
              {!messages.length && <div style={{ textAlign: "center", opacity: .55, padding: 40 }}><div style={{ fontWeight: 700 }}>{t.firstMessage}</div><div style={{ marginTop: 6 }}>{t.firstMessageDesc}</div></div>}
              {messages.map((message) => {
                const mine = message.sender_id === session.user.id;
                return <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-start" : "flex-end", marginBottom: 10 }}><div style={{ maxWidth: "75%", padding: "10px 13px", borderRadius: 14, background: mine ? "#2563eb" : (darkMode ? "#27272a" : "#e4e4e7"), color: mine ? "#fff" : "inherit" }}>
                  {message.message_type === "file" ? <a href={message.content} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>{message.file_name || t.openFile}</a> : <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{message.content}</div>}
                  <div style={{ fontSize: 11, opacity: .65, marginTop: 4 }}>{formatTime(message.created_at, lang)}</div>
                </div></div>;
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: 12, borderTop: `1px solid ${darkMode ? "#27272a" : "#e4e4e7"}`, display: "flex", gap: 8 }}>
              <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder={t.messagePlaceholder} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} style={{ ...inputStyle, margin: 0, flex: 1 }} />
              <input ref={fileInputRef} onChange={uploadFile} type="file" hidden />
              <button disabled={sendingFile} onClick={() => fileInputRef.current?.click()} style={secondaryButton}>{sendingFile ? "…" : "📎"}</button>
              <button disabled={busy || !messageText.trim()} onClick={sendMessage} style={primaryButton}>{t.login === "ورود" ? "ارسال" : "Send"}</button>
            </div>
          </>}
        </section>
      </div>

      {error && <div style={{ position: "fixed", bottom: 18, left: 18, right: 18, maxWidth: 700, margin: "0 auto", ...noticeError, boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>{error}</div>}

      {showProfile && <Modal title={t.profile} onClose={() => setShowProfile(false)} darkMode={darkMode}><div><strong>{profile?.display_name || ""}</strong></div><div style={{ opacity: .65, marginTop: 4 }}>@{profile?.username || ""}</div>{profile?.contact_value && <div style={{ marginTop: 12 }}>{t.contact}: {profile.contact_value}</div>}</Modal>}
      {showSupport && <Modal title={t.support} onClose={() => setShowSupport(false)} darkMode={darkMode}><p>{t.supportDesc}</p><a href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer" style={linkStyle}>{t.supportTelegram}</a><a href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer" style={linkStyle}>{t.supportUtino}</a><a href="https://wdner.co" target="_blank" rel="noreferrer" style={linkStyle}>WDNER</a><a href="https://iparham.com" target="_blank" rel="noreferrer" style={linkStyle}>iParham</a></Modal>}
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  marginBottom: 10,
  borderRadius: 12,
  border: "1px solid #3f3f46",
  background: "transparent",
  color: "inherit",
  outline: "none",
};

const primaryButton = {
  width: "100%",
  padding: "12px 14px",
  border: 0,
  borderRadius: 12,
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButton = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid #3f3f46",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const smallButton = { border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 9px", background: "transparent", color: "inherit", cursor: "pointer" };
const noticeError = { padding: 12, borderRadius: 12, background: "#7f1d1d", color: "#fff", marginBottom: 10 };
const noticeSuccess = { padding: 12, borderRadius: 12, background: "#14532d", color: "#fff", marginBottom: 10 };
const linkStyle = { display: "block", padding: "10px 0", color: "#60a5fa" };

function Modal({ title, onClose, children }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.62)", display: "grid", placeItems: "center", padding: 20, zIndex: 20 }}><div style={{ width: "min(500px, 100%)", background: "#18181b", color: "#f4f4f5", borderRadius: 18, padding: 22 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}><h2 style={{ margin: 0 }}>{title}</h2><button onClick={onClose} style={smallButton}>×</button></div>{children}</div></div>;
}
