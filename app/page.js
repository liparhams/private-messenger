"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactType, setContactType] = useState("telegram");
  const [contactValue, setContactValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jcblfgrcsgbdeamogzfc.supabase.co";
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  // تم
  useEffect(() => {
    document.body.style.background = darkMode ? "#0f172a" : "#f1f5f9";
    document.body.style.color = darkMode ? "#e2e8f0" : "#0f172a";
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // لود کاربران
  useEffect(() => {
    if (!currentUser || !supabase) return;
    async function loadUsers() {
      const { data } = await supabase
        .from("users")
        .select("username, display_name, contact_type, contact_value")
        .neq("username", currentUser.username)
        .order("username");
      if (data) setUsers(data);
    }
    loadUsers();
  }, [currentUser, supabase]);

  // لود پیام‌ها + realtime
  useEffect(() => {
    if (!currentUser || !selectedUser || !supabase) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender.eq.\( {currentUser.username},receiver.eq. \){selectedUser.username}),and(sender.eq.\( {selectedUser.username},receiver.eq. \){currentUser.username})`)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    }
    loadMessages();

    const channel = supabase
      .channel(`chat-\( {currentUser.username}- \){selectedUser.username}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const msg = payload.new;
          const isRelevant =
            (msg.sender === currentUser.username && msg.receiver === selectedUser.username) ||
            (msg.sender === selectedUser.username && msg.receiver === currentUser.username);
          if (isRelevant) setMessages((prev) => [...prev, msg]);
        }
        if (payload.eventType === "UPDATE") {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, selectedUser, supabase]);

  // ثبت‌نام
  async function register() {
    if (!username || !password || !displayName) {
      setMessage("نام کاربری، نام نمایشی و رمز عبور الزامی است.");
      return;
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage("نام کاربری فقط حروف انگلیسی، عدد و _ (حداقل ۳ کاراکتر)");
      return;
    }
    if (password.length < 4) {
      setMessage("رمز عبور حداقل ۴ کاراکتر");
      return;
    }
    if (!supabase) return;

    setLoading(true);
    setMessage("");
    try {
      const { data: existing } = await supabase.from("users").select("id").eq("username", username.toLowerCase()).maybeSingle();
      if (existing) {
        setMessage("این نام کاربری قبلاً ثبت شده.");
        return;
      }

      const { error } = await supabase.from("users").insert({
        username: username.toLowerCase(),
        password,
        display_name: displayName,
        contact_type: contactType,
        contact_value: contactValue || null
      });

      if (error) {
        setMessage("خطا: " + error.message);
        return;
      }
      setMessage("ثبت‌نام موفق! حالا وارد شوید.");
      setMode("login");
      setUsername("");
      setPassword("");
      setDisplayName("");
      setContactValue("");
    } catch {
      setMessage("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  // ورود
  async function login() {
    const loginName = userId || username;
    if (!loginName || !password) {
      setMessage("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }
    if (!supabase) return;

    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", loginName.toLowerCase())
        .eq("password", password)
        .maybeSingle();

      if (error || !data) {
        setMessage("نام کاربری یا رمز عبور اشتباه است.");
        return;
      }
      setCurrentUser(data);
      setMessage("");
      setPassword("");
      setUserId("");
    } catch {
      setMessage("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  // ارسال پیام متنی
  async function sendMessage() {
    if (!newMessage.trim() || !currentUser || !selectedUser || !supabase) return;
    setSending(true);
    try {
      await supabase.from("messages").insert({
        sender: currentUser.username,
        receiver: selectedUser.username,
        content: newMessage.trim()
      });
      setNewMessage("");
    } catch {
      alert("خطا در ارسال");
    } finally {
      setSending(false);
    }
  }

  // ارسال فایل
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !selectedUser || !supabase) return;

    setSending(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `\( {Date.now()}- \){Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName);
      const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";

      await supabase.from("messages").insert({
        sender: currentUser.username,
        receiver: selectedUser.username,
        content: file.name,
        file_url: urlData.publicUrl,
        file_type: fileType
      });
    } catch (err) {
      alert("خطا در آپلود فایل: " + (err.message || "مشکل ناشناخته"));
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // واکنش
  async function addReaction(msgId, emoji) {
    if (!supabase || !currentUser) return;
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const reactions = { ...(msg.reactions || {}) };
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(currentUser.username)) {
      reactions[emoji] = reactions[emoji].filter((u) => u !== currentUser.username);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(currentUser.username);
    }

    await supabase.from("messages").update({ reactions }).eq("id", msgId);
  }

  function logout() {
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    setUsers([]);
    setMode("login");
  }

  const bg = darkMode ? "#0f172a" : "#f8fafc";
  const cardBg = darkMode ? "#1e293b" : "#ffffff";
  const text = darkMode ? "#e2e8f0" : "#0f172a";
  const muted = darkMode ? "#94a3b8" : "#64748b";
  const border = darkMode ? "#334155" : "#e2e8f0";
  const primary = "#3b82f6";

  // ====================== صفحه چت ======================
  if (currentUser) {
    return (
      <div style={{ height: "100vh", background: bg, color: text, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", height: "100%", maxWidth: "1000px", margin: "0 auto", boxShadow: "0 0 40px rgba(0,0,0,0.3)" }}>
          
          {/* سایدبار */}
          <div style={{ width: "300px", borderLeft: `1px solid ${border}`, background: cardBg, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", background: darkMode ? "#020617" : "#0f172a", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Private Messenger</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{currentUser.display_name || currentUser.username}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDarkMode(!darkMode)} style={{ background: "transparent", border: "1px solid #475569", color: "white", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}>
                  {darkMode ? "☀️" : "🌙"}
                </button>
                <button onClick={logout} style={{ background: "#ef4444", border: "none", color: "white", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                  خروج
                </button>
              </div>
            </div>

            <div style={{ padding: "12px 16px", fontSize: 13, color: muted, fontWeight: 600 }}>کاربران</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {users.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: muted }}>هنوز کاربری نیست</div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.username}
                    onClick={() => setSelectedUser(u)}
                    style={{
                      padding: "14px 16px",
                      cursor: "pointer",
                      background: selectedUser?.username === u.username ? (darkMode ? "#1e3a5f" : "#e0f2fe") : "transparent",
                      borderBottom: `1px solid ${border}`,
                      transition: "0.15s"
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{u.display_name || u.username}</div>
                    {u.contact_value && (
                      <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                        {u.contact_type === "telegram" ? "✈️" : u.contact_type === "email" ? "✉️" : "📞"} {u.contact_value}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: "12px", fontSize: 11, color: muted, textAlign: "center", borderTop: `1px solid ${border}` }}>
              ساخته شده توسط{" "}
              <a href="https://iparham.com" target="_blank" rel="noopener" style={{ color: primary }}>
                پرهام سلیمانی
              </a>
            </div>
          </div>

          {/* چت */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
            {selectedUser ? (
              <>
                <div style={{ padding: "14px 20px", background: darkMode ? "#020617" : "#0f172a", color: "white", fontWeight: 600 }}>
                  {selectedUser.display_name || selectedUser.username}
                  {selectedUser.contact_value && (
                    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8, marginRight: 10 }}>
                      · {selectedUser.contact_type}: {selectedUser.contact_value}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: muted, marginTop: 60 }}>هنوز پیامی نیست</div>
                  )}

                  {messages.map((msg) => {
                    const isMe = msg.sender === currentUser.username;
                    const reactions = msg.reactions || {};
                    return (
                      <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                        <div
                          style={{
                            background: isMe ? primary : cardBg,
                            color: isMe ? "white" : text,
                            padding: "10px 14px",
                            borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            position: "relative"
                          }}
                        >
                          {msg.file_url && msg.file_type === "image" && (
                            <img src={msg.file_url} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }} />
                          )}
                          {msg.file_url && msg.file_type === "video" && (
                            <video src={msg.file_url} controls style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 6 }} />
                          )}
                          {msg.file_url && msg.file_type === "file" && (
                            <a href={msg.file_url} target="_blank" rel="noopener" style={{ color: isMe ? "#bfdbfe" : primary, display: "block", marginBottom: 4 }}>
                              📎 {msg.content}
                            </a>
                          )}
                          {!msg.file_url && msg.content}

                          {/* واکنش‌ها */}
                          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                            {Object.entries(reactions).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(msg.id, emoji)}
                                style={{
                                  background: darkMode ? "#334155" : "#e2e8f0",
                                  border: "none",
                                  borderRadius: 12,
                                  padding: "2px 6px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                  color: text
                                }}
                              >
                                {emoji} {users.length}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* دکمه‌های واکنش سریع */}
                        <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                          {["👍", "❤️", "😂", "🔥"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 14, opacity: 0.6 }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div style={{ fontSize: 11, color: muted, marginTop: 2, textAlign: isMe ? "right" : "left" }}>
                          {new Date(msg.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* ورودی */}
                <div style={{ padding: 12, borderTop: `1px solid ${border}`, display: "flex", gap: 8, background: cardBg, alignItems: "center" }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.zip" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: "transparent", border: `1px solid ${border}`, color: text, width: 42, height: 42, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    placeholder="پیام بنویسید..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 24,
                      border: `1px solid ${border}`,
                      background: bg,
                      color: text,
                      outline: "none",
                      fontSize: 15
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    style={{
                      background: primary,
                      color: "white",
                      border: "none",
                      padding: "0 20px",
                      height: 42,
                      borderRadius: 24,
                      cursor: "pointer",
                      fontWeight: 600,
                      opacity: sending || !newMessage.trim() ? 0.5 : 1
                    }}
                  >
                    ارسال
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 18 }}>
                یک کاربر را انتخاب کنید
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====================== ورود / ثبت‌نام ======================
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, background: cardBg, borderRadius: 20, padding: 32, boxShadow: "0 10px 40px rgba(0,0,0,0.2)", color: text }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: primary, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, margin: "0 auto 12px" }}>
            P
          </div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Private Messenger</h1>
          <p style={{ margin: "6px 0 0", color: muted, fontSize: 14 }}>پیام‌رسان خصوصی</p>
        </div>

        <div style={{ display: "flex", marginBottom: 20, background: bg, borderRadius: 12, padding: 4 }}>
          <button
            onClick={() => { setMode("login"); setMessage(""); }}
            style={{ flex: 1, padding: 10, border: "none", borderRadius: 10, background: mode === "login" ? primary : "transparent", color: mode === "login" ? "white" : muted, cursor: "pointer", fontWeight: 600 }}
          >
            ورود
          </button>
          <button
            onClick={() => { setMode("register"); setMessage(""); }}
            style={{ flex: 1, padding: 10, border: "none", borderRadius: 10, background: mode === "register" ? primary : "transparent", color: mode === "register" ? "white" : muted, cursor: "pointer", fontWeight: 600 }}
          >
            ثبت‌نام
          </button>
        </div>

        {mode === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: muted }}>نام کاربری</label>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="نام کاربری" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: muted }}>رمز عبور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }} />
            </div>
            <button onClick={login} disabled={loading} style={{ marginTop: 8, padding: 14, borderRadius: 12, border: "none", background: primary, color: "white", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: muted }}>نام کاربری (انگلیسی)</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="مثلاً parham" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: muted }}>نام نمایشی</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="مثلاً پرهام سلیمانی" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: muted }}>نوع راه ارتباطی</label>
              <select value={contactType} onChange={(e) => setContactType(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }}>
                <option value="telegram">تلگرام</option>
                <option value="email">ایمیل</option>
                <option value="phone">شماره تلفن</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: muted }}>مقدار راه ارتباطی</label>
              <input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder={contactType === "telegram" ? "@username" : contactType === "email" ? "email@example.com" : "09xxxxxxxxx"} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: muted }}>رمز عبور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۴ کاراکتر" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${border}`, background: bg, color: text, marginTop: 4, outline: "none" }} />
            </div>
            <button onClick={register} disabled={loading} style={{ marginTop: 8, padding: 14, borderRadius: 12, border: "none", background: primary, color: "white", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "در حال ثبت‌نام..." : "ساخت حساب"}
            </button>
          </div>
        )}

        {message && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: darkMode ? "#1e3a5f" : "#e0f2fe", color: primary, fontSize: 14, textAlign: "center" }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: muted }}>
          ساخته شده توسط{" "}
          <a href="https://iparham.com" target="_blank" rel="noopener" style={{ color: primary, textDecoration: "none", fontWeight: 600 }}>
            پرهام سلیمانی
          </a>
        </div>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "transparent", border: `1px solid ${border}`, color: muted, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
            {darkMode ? "حالت روشن ☀️" : "حالت تاریک 🌙"}
          </button>
        </div>
      </div>
    </main>
  );
              }
