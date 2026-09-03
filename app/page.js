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

  // ساخت کلاینت فقط وقتی envها موجود باشند (جلوگیری از ارور در build)
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return null;
    }

    return createClient(url, key);
  }, []);

  async function register() {
    if (!username || !password) {
      setMessage("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    if (!supabase) {
      setMessage("تنظیمات Supabase هنوز کامل نیست.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      /*
       * فعلاً ثبت‌نام واقعی را بعد از تنظیم Supabase Auth
       * کامل می‌کنیم.
       */
      const { error } = await supabase.auth.signUp({
        email: `${username.toLowerCase()}@private-messenger.local`,
        password
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("ثبت‌نام با موفقیت انجام شد.");
      setMode("login");
    } catch (error) {
      setMessage("خطایی هنگام ثبت‌نام رخ داد.");
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
      setMessage(
        "ورود با شناسه عددی را در مرحله بعد به سیستم کاربران وصل می‌کنیم."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="card">

        <div className="logo">P</div>

        <h1>Private Messenger</h1>

        <p className="subtitle">
          پیام‌رسان خصوصی
        </p>

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

            <button
              className="mainButton"
              onClick={login}
              disabled={loading}
            >
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>

          </div>

        ) : (

          <div className="form">

            <label>نام کاربری</label>

            <input
              type="text"
              placeholder="نام کاربری"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>رمز عبور</label>

            <input
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="mainButton"
              onClick={register}
              disabled={loading}
            >
              {loading ? "در حال ثبت‌نام..." : "ساخت حساب"}
            </button>

          </div>

        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>
    </main>
  );
}
