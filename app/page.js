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

  // چت
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

  // اسکرول به آخرین پیام
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // دریافت پیام‌ها + realtime
  useEffect(() => {
    if (!currentUser || !supabase) return;

    // اول پیام‌های قبلی رو بگیر
    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data);
      }
    }

    loadMessages();

    // گوش دادن به پیام‌های جدید (realtime)
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase]);

  // ====================== ثبت‌نام ======================
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
      setMessage("خطایی رخ داد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  // ====================== ورود ======================
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
      setMessage("خطایی رخ داد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  // ====================== ارسال پیام ======================
  async function sendMessage() {
    if (!newMessage.trim() || !currentUser || !supabase) return;

    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        sender: currentUser.username,
        content: newMessage.trim()
      });

      if (error) {
        alert("خطا در ارسال پیام: " + error.message);
      } else {
        setNewMessage("");
      }
    } catch (err) {
      alert("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  }

  // ====================== خروج ======================
  function logout() {
    setCurrentUser(null);
    setMessages([]);
    setMode("login");
    setMessage("");
  }

  // ====================== صفحه چت ======================
  if (currentUser) {
    return (
      <main className="page" style={{ padding: "10px" }}>
        <div
          className="card"
          style={{
            maxWidth: "600px",
            width: "100%",
            height: "90vh",
            display: "flex",
            flexDirection: "column",
            padding: "0",
            overflow: "hidden"
          }}
        >
          {/* هدر */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#0f172a",
              color: "white"
            }}
          >
            <div>
              <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                Private Messenger
              </div>
              <div style={{ fontSize: "13px", opacity: 0.8 }}>
                {currentUser.username}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              خروج
            </button>
          </div>

          {/* لیست پیام‌ها */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              background: "#f8fafc",
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
                هنوز پیامی نیست. اولین پیام را بفرستید!
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender === currentUser.username;
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "75%"
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
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      fontSize: "15px",
                      lineHeight: "1.4"
                    }}
                  >
                    {!isMe && (
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                          opacity: 0.8
                        }}
                      >
                        {msg.sender}
                      </div>
                    )}
                    {msg.content}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginTop: "3px",
                      textAlign: isMe ? "right" : "left",
                      padding: "0 4px"
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

          {/* ورودی پیام */}
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
                if (e.key === "Enter" && !e.shiftKey) {
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
                padding: "0 20px",
                borderRadius: "24px",
                cursor: "pointer",
                fontWeight: "bold",
                opacity: sending || !newMessage.trim() ? 0.6 : 1
              }}
            >
              ارسال
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ====================== صفحه ورود / ثبت‌نام ======================
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
