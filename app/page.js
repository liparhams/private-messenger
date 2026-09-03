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
        setLoading(false);
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

  // ورود
  async function login() {
    const loginName = mode === "login" ? userId : username;

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

      setMessage(`خوش آمدید ${data.username}!`);
    } catch (err) {
      setMessage("خطایی رخ داد. دوباره تلاش کنید.");
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
