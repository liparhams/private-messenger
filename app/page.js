"use client";

import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

export default function Home() {
  const [mode, setMode] = useState("login");

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد و _ باشد.");
      return;
    }

    if (password.length < 6) {
      setMessage("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (!supabase) {
      setMessage("تنظیمات Supabase هنوز کامل نیست.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // پشت صحنه ایمیل جعلی می‌سازیم (کاربر نمی‌بیند)
      const fakeEmail = `${username.toLowerCase()}@private-messenger.app`;

      const { error } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            username: username,
            display_name: username
          }
        }
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          setMessage("این نام کاربری قبلاً ثبت شده است.");
        } else if (error.message.toLowerCase().includes("password")) {
          setMessage("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        } else {
          setMessage("خطا در ثبت‌نام: " + error.message);
        }
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

  async function login() {
    if (!userId || !password) {
      setMessage("شناسه کاربری و رمز عبور را وارد کنید.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // فعلاً ورود با شناسه عددی را کامل نکردیم
      setMessage("ورود با شناسه عددی در مرحله بعد اضافه می‌شود.");
    } finally {
      setLoading(false);
    }
  }

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
            <label>شناسه کاربری</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="مثلاً 102458"
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
              placeholder="حداقل ۶ کاراکتر"
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
