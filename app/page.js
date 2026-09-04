"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jcblfgrcsgbdeamogzfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
const AUTH_DOMAIN = "utino.chat";
const SUPPORT = {
  telegram: "https://t.me/parhamsoleimanybot",
  utino: "https://utino.org/chat/supportusername"
};

const TEXT = {
  fa: {
    brand: "Messenger", tagline: "پیام‌رسان خصوصی", secure: "ورود امن", login: "ورود به حساب",
    username: "نام کاربری", password: "رمز عبور", usernameHint: "نام کاربری خود را وارد کن",
    passwordHint: "رمز عبور خود را وارد کن", signIn: "ورود", wait: "در حال ورود...",
    supportTitle: "پشتیبانی", support: "ثبت‌نام عمومی فعال نیست. برای ساخت حساب با پشتیبانی در ارتباط باش.",
    supportTelegram: "پشتیبانی در تلگرام", supportWeb: "پشتیبانی در یوتینو", openSupport: "ارتباط با پشتیبانی",
    show: "نمایش رمز", hide: "پنهان کردن رمز", language: "EN", theme: "تغییر پوسته",
    invalidUser: "نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل حروف انگلیسی، عدد یا _ باشد.",
    shortPassword: "رمز عبور باید حداقل ۶ کاراکتر باشد.", invalidLogin: "نام کاربری یا رمز عبور اشتباه است.",
    emailDisabled: "ورود ایمیلی در Supabase خاموش است. از بخش Authentication > Providers، Email را فعال کن.",
    notConfirmed: "این حساب تأیید نشده است. برای این سیستم Confirm email را خاموش کن.",
    network: "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن.", generic: "ورود انجام نشد. دوباره تلاش کن.", close: "بستن"
  },
  en: {
    brand: "Messenger", tagline: "Private messaging", secure: "SECURE ACCESS", login: "Sign in",
    username: "Username", password: "Password", usernameHint: "Enter your username",
    passwordHint: "Enter your password", signIn: "Sign in", wait: "Signing in...",
    supportTitle: "Support", support: "Public registration is disabled. Contact support to create an account.",
    supportTelegram: "Support on Telegram", supportWeb: "Support on Utino", openSupport: "Contact support",
    show: "Show password", hide: "Hide password", language: "فا", theme: "Change theme",
    invalidUser: "Username must be 3–20 characters and use only letters, numbers, or _.",
    shortPassword: "Password must be at least 6 characters.", invalidLogin: "Incorrect username or password.",
    emailDisabled: "Email login is disabled in Supabase. Enable Email under Authentication > Providers.",
    notConfirmed: "This account is not confirmed. Turn off Confirm email for this system.",
    network: "Could not connect to the server. Check your internet connection.", generic: "Sign-in failed. Please try again.", close: "Close"
  }
};

function usernameEmail(value) {
  return `${value.trim().toLowerCase()}@${AUTH_DOMAIN}`;
}

export default function Page() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
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
    try {
      localStorage.setItem("messenger-language", lang);
      localStorage.setItem("messenger-theme", dark ? "dark" : "light");
    } catch {}
  }, [lang, dark]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data?.session) window.location.replace("/messenger/");
    });
    return () => { active = false; };
  }, []);

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setError(t.invalidUser);
    if (password.length < 6) return setError(t.shortPassword);
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: usernameEmail(u),
        password
      });
      if (authError) {
        const m = String(authError.message || "").toLowerCase();
        if (m.includes("email logins are disabled")) setError(t.emailDisabled);
        else if (m.includes("email not confirmed") || m.includes("not confirmed")) setError(t.notConfirmed);
        else if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) setError(t.invalidLogin);
        else if (m.includes("fetch") || m.includes("network")) setError(t.network);
        else setError(t.generic);
        return;
      }
      if (!data?.session) return setError(t.generic);
      window.location.replace("/messenger/");
    } catch (e) {
      const m = String(e?.message || "").toLowerCase();
      setError(m.includes("fetch") || m.includes("network") ? t.network : t.generic);
    } finally {
      setBusy(false);
    }
  }

  const colors = dark ? {
    page: "#070b14", card: "rgba(15,23,42,.92)", text: "#f8fafc", muted: "#94a3b8",
    border: "rgba(255,255,255,.10)", input: "rgba(255,255,255,.055)", soft: "rgba(255,255,255,.035)", danger: "#fecaca"
  } : {
    page: "#f4f7fb", card: "rgba(255,255,255,.96)", text: "#111827", muted: "#64748b",
    border: "#dbe3ee", input: "#fff", soft: "#f8fafc", danger: "#9f1239"
  };

  return (
    <main dir={lang === "fa" ? "rtl" : "ltr"} style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px 16px", background: dark ? "radial-gradient(circle at 50% 0%, #172554 0%, #0b1020 35%, #070b14 75%)" : "radial-gradient(circle at 50% 0%, #e0e7ff 0%, #f8fafc 45%, #eef2f7 100%)", color: colors.text, fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 440, border: `1px solid ${colors.border}`, background: colors.card, borderRadius: 26, padding: "28px", boxShadow: dark ? "0 30px 90px rgba(0,0,0,.42)" : "0 24px 70px rgba(15,23,42,.12)", backdropFilter: "blur(18px)" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 15, display: "grid", placeItems: "center", color: "#fff", fontWeight: 850, fontSize: 20, background: "linear-gradient(135deg,#2563eb,#6366f1)", boxShadow: "0 12px 30px rgba(37,99,235,.28)" }}>M</div>
            <div><div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -.5 }}>{t.brand}</div><div style={{ marginTop: 3, fontSize: 12, color: colors.muted }}>{t.tagline}</div></div>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button type="button" onClick={() => setLang(v => v === "fa" ? "en" : "fa")} style={{ border: `1px solid ${colors.border}`, background: colors.soft, color: colors.text, borderRadius: 11, padding: "8px 10px", cursor: "pointer", fontWeight: 700 }}>{t.language}</button>
            <button type="button" onClick={() => setDark(v => !v)} aria-label={t.theme} style={{ width: 38, border: `1px solid ${colors.border}`, background: colors.soft, color: colors.text, borderRadius: 11, cursor: "pointer", fontSize: 16 }}>{dark ? "☀" : "☾"}</button>
          </div>
        </header>

        <div style={{ marginTop: 30 }}>
          <div style={{ color: "#60a5fa", fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>{t.secure}</div>
          <h1 style={{ margin: "7px 0 0", fontSize: 27, letterSpacing: -.6 }}>{t.login}</h1>
        </div>

        <form onSubmit={login} autoComplete="on" style={{ marginTop: 23, display: "grid", gap: 17 }}>
          <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
            <span>{t.username}</span>
            <input
              name="username"
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
              placeholder={t.usernameHint}
              disabled={busy}
              style={{ width: "100%", height: 52, boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.input, color: colors.text, padding: "0 15px", outline: "none", fontSize: 15, direction: "ltr", textAlign: "left" }}
            />
          </label>

          <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 700 }}>
            <span>{t.password}</span>
            <div style={{ position: "relative", direction: "ltr" }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") login(e); }}
                placeholder={t.passwordHint}
                disabled={busy}
                style={{ width: "100%", height: 52, boxSizing: "border-box", border: `1px solid ${colors.border}`, borderRadius: 14, background: colors.input, color: colors.text, padding: "0 48px 0 15px", outline: "none", fontSize: 15, letterSpacing: showPassword ? ".01em" : ".08em", textAlign: "left" }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} disabled={busy} aria-label={showPassword ? t.hide : t.show} style={{ position: "absolute", right: 8, top: 8, height: 36, minWidth: 36, border: 0, borderRadius: 9, background: "transparent", color: colors.muted, cursor: "pointer", fontSize: 16 }}>{showPassword ? "◉" : "◌"}</button>
            </div>
          </label>

          {error && <div role="alert" style={{ border: `1px solid ${dark ? "rgba(248,113,113,.25)" : "#fecdd3"}`, background: dark ? "rgba(248,113,113,.09)" : "#fff1f2", color: colors.danger, borderRadius: 13, padding: "12px 14px", fontSize: 13, lineHeight: 1.75 }}>{error}</div>}

          <button type="submit" disabled={busy} style={{ height: 52, border: 0, borderRadius: 14, background: busy ? "#475569" : "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", cursor: busy ? "wait" : "pointer", fontSize: 15, fontWeight: 800, boxShadow: "0 12px 26px rgba(37,99,235,.22)" }}>{busy ? t.wait : t.signIn}</button>
        </form>

        <div style={{ marginTop: 18, padding: 15, border: `1px solid ${colors.border}`, background: colors.soft, borderRadius: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{t.supportTitle}</div>
          <div style={{ marginTop: 5, color: colors.muted, fontSize: 12, lineHeight: 1.8 }}>{t.support}</div>
          <button type="button" onClick={() => setSupportOpen(true)} style={{ width: "100%", marginTop: 11, height: 43, border: `1px solid ${colors.border}`, borderRadius: 12, background: "transparent", color: colors.text, cursor: "pointer", fontWeight: 700 }}>{t.openSupport}</button>
        </div>

        <div style={{ marginTop: 18, textAlign: "center", color: colors.muted, fontSize: 10 }}>Username access · Messenger</div>
      </section>

      {supportOpen && <div onMouseDown={() => setSupportOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, display: "grid", placeItems: "center", padding: 18, background: "rgba(0,0,0,.62)" }}>
        <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 410, padding: 24, borderRadius: 22, background: dark ? "#111827" : "#fff", color: colors.text, boxShadow: "0 30px 90px rgba(0,0,0,.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 20 }}>{t.supportTitle}</h2><button type="button" onClick={() => setSupportOpen(false)} style={{ border: 0, background: "transparent", color: colors.text, fontSize: 24, cursor: "pointer" }}>×</button></div>
          <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.8 }}>{t.support}</p>
          <a href={SUPPORT.telegram} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 14, marginTop: 10, borderRadius: 13, background: colors.soft, color: colors.text, textDecoration: "none", fontWeight: 700 }}>{t.supportTelegram}</a>
          <a href={SUPPORT.utino} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 14, marginTop: 8, borderRadius: 13, background: colors.soft, color: colors.text, textDecoration: "none", fontWeight: 700 }}>{t.supportWeb}</a>
          <button type="button" onClick={() => setSupportOpen(false)} style={{ width: "100%", marginTop: 16, height: 44, border: 0, borderRadius: 12, background: dark ? "#334155" : "#e2e8f0", color: colors.text, cursor: "pointer", fontWeight: 700 }}>{t.close}</button>
        </div>
      </div>}
    </main>
  );
}
