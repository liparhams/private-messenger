"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const supabase = useMemo(() => {
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://jcblfgrcsgbdeamogzfc.supabase.co";
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";

    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  // اسکرول به آخر
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // لود کاربران
  useEffect(() => {
    if (!currentUser || !supabase) return;

    async function loadUsers() {
      const { data } = await supabase
        .from("users")
        .select("username")
        .neq("username", currentUser.username)
        .order("username");

      if (data) setUsers(data);
    }

    loadUsers();
  }, [currentUser, supabase]);

  // لود پیام‌های چت خصوصی + realtime
  useEffect(() => {
    if (!currentUser || !selectedUser || !supabase) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender.eq.\( {currentUser.username},receiver.eq. \){selectedUser.username}),and(sender.eq.\( {selectedUser.username},receiver.eq. \){currentUser.username})`
        )
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    }

    loadMessages();

    const channel = supabase
      .channel(`chat-\( {currentUser.username}- \){selectedUser.username}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const isRelevant =
            (msg.sender === currentUser.username &&
              msg.receiver === selectedUser.username) ||
            (msg.sender === selectedUser.username &&
              msg.receiver === currentUser.username);

          if (isRelevant) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedUser, supabase]);

  // ثبت‌نام
  async function register() {
    if (!username || !password) {
      setMessage("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }
    if (username.length < 3) {
      setMessage("نام کاربری باید حداقل ۳ کاراکتر باشد.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage("نام کاربری فقط حروف انگلیسی، عدد و _ مجاز است.");
      return;
    }
    if (password.length < 4) {
      setMessage("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }
    if (!supabase) {
      setMessage("اتصال به سرور برقرار نیست.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (existing) {
        setMessage("این نام کاربری قبلاً ثبت شده است.");
        return;
      }

      const { error } = await supabase.from("users").insert({
        username: username.toLowerCase(),
        password: password
      });

      if (error) {
        setMessage("خطا در ثبت‌نام: " + error.message);
        return;
      }

      setMessage("ثبت‌نام با موفقیت انجام شد! حالا وارد شوید.");
      setMode("login");
      setUsername("");
      setPassword("");
    } catch (err) {
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
    if (!supabase) {
      setMessage("اتصال به سرور برقرار نیست.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", loginName.toLowerCase())
        .eq("password", password)
        .maybeSingle();

      if (error) {
        setMessage("خطا در ورود: " + error.message);
        return;
      }

      if (!data) {
        setMessage("نام کاربری یا رمز عبور اشتباه است.");
        return;
      }

      setCurrentUser(data);
      setMessage("");
      setPassword("");
      setUserId("");
      setUsername("");
    } catch (err) {
      setMessage("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  // ارسال پیام
  async function sendMessage() {
    if (!newMessage.trim() || !currentUser || !selectedUser || !supabase) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender: currentUser.username,
        receiver: selectedUser.username,
        content: newMessage.trim()
      });

      if (error) {
        alert("خطا در ارسال: " + error.message);
      } else {
        setNewMessage("");
      }
    } catch (err) {
      alert("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  }

  function logout() {
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    setUsers([]);
    setMode("login");
  }

  // ====================== صفحه چت خصوصی ======================
  if (currentUser) {
    return (
      <main className="page" style={{ padding: "0", height: "100vh" }}>
        <div
          style={{
            display: "flex",
            height: "100vh",
            maxWidth: "900px",
            margin: "0 auto",
            background: "white",
            boxShadow: "0 0 20px rgba(0,0,0,0.1)"
          }}
        >
          {/* لیست کاربران */}
          <div
            style={{
              width: "280px",
              borderLeft: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              background: "#f8fafc"
            }}
          >
            <div
              style={{
                padding: "16px",
                background: "#0f172a",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>Private Messenger</div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>
                  {currentUser.username}
                </div>
              </div>
              <button
                onClick={logout}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                خروج
              </button>
            </div>

            <div style={{ padding: "12px", fontWeight: "bold", color: "#64748b" }}>
              کاربران
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {users.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  هنوز کاربری ثبت‌نام نکرده
                </div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.username}
                    onClick={() => setSelectedUser(u)}
                    style={{
                      padding: "14px 16px",
                      cursor: "pointer",
                      background:
                        selectedUser?.username === u.username
                          ? "#e0f2fe"
                          : "transparent",
                      borderBottom: "1px solid #e2e8f0",
                      fontWeight:
                        selectedUser?.username === u.username ? "bold" : "normal"
                    }}
                  >
                    {u.username}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* قسمت چت */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {selectedUser ? (
              <>
                {/* هدر چت */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#0f172a",
                    color: "white",
                    fontWeight: "bold"
                  }}
                >
                  چت با {selectedUser.username}
                </div>

                {/* پیام‌ها */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px",
                    background: "#f1f5f9",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  {messages.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        marginTop: "40px"
                      }}
                    >
                      هنوز پیامی بین شما رد و بدل نشده
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isMe = msg.sender === currentUser.username;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "70%"
                        }}
                      >
                        <div
                          style={{
                            background: isMe ? "#3b82f6" : "white",
                            color: isMe ? "white" : "#0f172a",
                            padding: "10px 14px",
                            borderRadius: isMe
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            fontSize: "15px"
                          }}
                        >
                          {msg.content}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            marginTop: "3px",
                            textAlign: isMe ? "right" : "left"
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* ورودی */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    gap: "10px",
                    background: "white"
                  }}
                >
                  <input
                    type="text"
                    placeholder="پیام بنویسید..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: "24px",
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: "15px"
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      padding: "0 22px",
                      borderRadius: "24px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      opacity: sending || !newMessage.trim() ? 0.5 : 1
                    }}
                  >
                    ارسال
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontSize: "18px"
                }}
              >
                یک کاربر را برای شروع چت انتخاب کنید
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ====================== ورود / ثبت‌نام ======================
  return (
    <main className="page">
      <div className="card">
        <div className="logo">P</div>
        <h1>Private Messenger</h1>
        <p className="subtitle">پیام‌رسان خصوصی</p>

        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            ورود
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
          >
            ثبت‌نام
          </button>
        </div>

        {mode === "login" ? (
          <div className="form">
            <label>نام کاربری</label>
            <input
              type="text"
              placeholder="نام کاربری"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <label>رمز عبور</label>
            <input
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="mainButton" onClick={login} disabled={loading}>
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </div>
        ) : (
          <div className="form">
            <label>نام کاربری</label>
            <input
              type="text"
              placeholder="فقط حروف انگلیسی و عدد"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label>رمز عبور</label>
            <input
              type="password"
              placeholder="حداقل ۴ کاراکتر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="mainButton" onClick={register} disabled={loading}>
              {loading ? "در حال ثبت‌نام..." : "ساخت حساب"}
            </button>
          </div>
        )}

        {message && <div className="message">{message}</div>}
      </div>
    </main>
  );
}
