"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/supabase-client";
import mapError from "../lib/error-map";

const SUPPORT = {
  telegram: "https://t.me/parhamsoleimanybot",
  web: "https://utino.org/chat/supportusername",
  utino: "https://utino.org",
  wdner: "https://wdner.co",
  iparham: "https://iparham.com",
};

const TEXT = {
  fa: {
    tag: "پیام‌رسان سریع، خصوصی و مدرن",
    login: "ورود به حساب",
    register: "ساخت حساب",
    username: "نام کاربری",
    display: "نام نمایشی",
    password: "رمز عبور",
    confirm: "تکرار رمز عبور",
    signIn: "ورود",
    signUp: "ساخت حساب",
    switchReg: "حساب نداری؟ ثبت‌نام کن",
    switchLogin: "حساب داری؟ وارد شو",
    busy: "در حال بررسی…",
    show: "نمایش",
    hide: "پنهان",
    support: "پشتیبانی رسمی",
    supportHandle: "@support",
    supportText: "برای مشکل ورود، ثبت‌نام یا حساب مسدودشده با پشتیبانی رسمی در ارتباط باش.",
    telegram: "تلگرام",
    utinoSupport: "پشتیبانی یوتینو",
    utinoSite: "وب‌سایت یوتینو",
    wdner: "WDNER",
    iparham: "iParham",
    invalidUser: "نام کاربری باید ۳ تا ۲۰ کاراکتر و فقط شامل a-z، عدد یا _ باشد.",
    invalidPassword: "رمز عبور باید بین ۶ تا ۱۲۸ کاراکتر باشد.",
    mismatch: "رمزها یکسان نیستند.",
    invalidDisplay: "نام نمایشی باید بین ۱ تا ۸۰ کاراکتر باشد.",
    disabled: "ثبت‌نام عمومی فعلاً غیرفعال است. با پشتیبانی رسمی در ارتباط باش.",
    banned: "این کاربر مسدود شده است. برای پیگیری با پشتیبانی رسمی در ارتباط باش.",
    invalidCredentials: "نام کاربری یا رمز عبور اشتباه است.",
  },
  en: {
    tag: "Fast, private, modern messaging",
    login: "Sign in",
    register: "Create account",
    username: "Username",
    display: "Display name",
    password: "Password",
    confirm: "Confirm password",
    signIn: "Sign in",
    signUp: "Create account",
    switchReg: "No account? Create one",
    switchLogin: "Already have an account? Sign in",
    busy: "Working…",
    show: "Show",
    hide: "Hide",
    support: "Official support",
    supportHandle: "@support",
    supportText: "Need help with sign in, registration, or a blocked account? Contact official support.",
    telegram: "Telegram",
    utinoSupport: "Utino support",
    utinoSite: "Utino website",
    wdner: "WDNER",
    iparham: "iParham",
    invalidUser: "Username must be 3–20 characters using a-z, numbers, or _.",
    invalidPassword: "Password must be 6–128 characters.",
    mismatch: "Passwords do not match.",
    invalidDisplay: "Display name must be 1–80 characters.",
    disabled: "Public registration is currently disabled. Contact official support.",
    banned: "This user is blocked. Contact official support for help.",
    invalidCredentials: "Incorrect username or password.",
  },
};

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const emailFor = (username) => `${username.trim().toLowerCase()}@utino.chat`;
const isBlocked = (profile) => Boolean(profile?.is_banned || (profile?.banned_until && new Date(profile.banned_until) > new Date()));

async function getMyProfile() {
  const { data, error } = await db.rpc("get_my_profile");
  return { profile: Array.isArray(data) ? data[0] || null : data || null, error };
}

export default function LoginPage() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [display, setDisplay] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const t = TEXT[lang];

  useEffect(() => {
    let alive = true;
    try {
      const savedLang = localStorage.getItem("utino-language");
      const savedTheme = localStorage.getItem("utino-theme");
      const params = new URLSearchParams(window.location.search);
      if (savedLang === "fa" || savedLang === "en") setLang(savedLang);
      if (savedTheme === "light" || savedTheme === "dark") setDark(savedTheme === "dark");
      if (params.get("register") === "1") setMode("register");
    } catch {}

    (async () => {
      try {
        const [{ data: sessionData, error: sessionError }, { data: registration, error: registrationError }] = await Promise.all([
          db.auth.getSession(),
          db.rpc("get_registration_enabled"),
        ]);
        if (!alive) return;
        if (!sessionError && !registrationError) setRegistrationEnabled(registration === true);
        if (sessionData?.session) {
          const { profile, error: profileError } = await getMyProfile();
          if (!alive) return;
          if (profileError) return setError(mapError(profileError, lang));
          if (isBlocked(profile)) {
            await db.auth.signOut();
            if (alive) setError(t.banned);
            return;
          }
          window.location.replace("/messenger/");
        }
      } catch (err) {
        if (alive) setError(mapError(err, lang));
      }
    })();

    return () => { alive = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("utino-language", lang);
      localStorage.setItem("utino-theme", dark ? "dark" : "light");
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.lang = lang === "fa" ? "fa" : "en";
      document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    } catch {}
  }, [lang, dark]);

  async function finishLogin(usernameValue, passwordValue) {
    const { error: authError } = await db.auth.signInWithPassword({ email: emailFor(usernameValue), password: passwordValue });
    if (authError) {
      const raw = String(authError.message || "").toLowerCase();
      throw new Error(raw.includes("fetch") || raw.includes("network") ? "network" : "invalid_credentials");
    }
    const { profile, error: profileError } = await getMyProfile();
    if (profileError) throw profileError;
    if (isBlocked(profile)) {
      await db.auth.signOut();
      throw new Error("banned");
    }
  }

  async function login(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const u = username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) return setError(t.invalidUser);
    if (password.length < 6 || password.length > 128) return setError(t.invalidPassword);
    setBusy(true);
    try {
      await finishLogin(u, password);
      window.location.replace("/messenger/");
    } catch (err) {
      if (err?.message === "banned") setError(t.banned);
      else if (err?.message === "invalid_credentials") setError(t.invalidCredentials);
      else setError(mapError(err, lang));
    } finally {
      setBusy(false);
    }
  }

  async function register(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const u = username.trim().toLowerCase();
    const d = display.trim();
    if (!registrationEnabled) return setError(t.disabled);
    if (!USERNAME_RE.test(u)) return setError(t.invalidUser);
    if (!d || d.length > 80) return setError(t.invalidDisplay);
    if (password.length < 6 || password.length > 128) return setError(t.invalidPassword);
    if (password !== confirm) return setError(t.mismatch);
    setBusy(true);
    try {
      const { data, error: invokeError } = await db.functions.invoke("public-register", {
        body: { username: u, display_name: d, password },
      });
      if (invokeError) throw invokeError;
      if (!data?.ok) throw new Error(data?.error || "server_error");
      await finishLogin(u, password);
      window.location.replace("/messenger/");
    } catch (err) {
      setError(mapError(err, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page platform-page" dir={lang === "fa" ? "rtl" : "ltr"}>
      <section className="auth-card">
        <header className="auth-head">
          <a className="auth-back" href="/" aria-label={lang === "fa" ? "بازگشت" : "Back"}>‹</a>
          <div className="brand-lockup">
            <div className="brand-mark">U</div>
            <div className="brand-copy"><strong>UTINOCHATV1</strong><span>{t.tag}</span></div>
          </div>
          <div className="auth-actions">
            <button className="utino-control" type="button" onClick={() => setLang((v) => v === "fa" ? "en" : "fa")} aria-label="language">{lang === "fa" ? "EN" : "فا"}</button>
            <button className="utino-control" type="button" onClick={() => setDark((v) => !v)} aria-label="theme">{dark ? "☀" : "☾"}</button>
          </div>
        </header>

        <div className="auth-title"><span>SECURE ACCESS</span><h1>{mode === "login" ? t.login : t.register}</h1></div>

        <form className="auth-form" onSubmit={mode === "login" ? login : register} noValidate>
          <label><span>{t.username}</span><input required name="username" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} placeholder="username" /></label>
          {mode === "register" && <label><span>{t.display}</span><input required name="display_name" value={display} onChange={(e) => setDisplay(e.target.value)} autoComplete="name" maxLength={80} /></label>}
          <label><span>{t.password}</span><div className="password-field"><input required name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} maxLength={128} /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? t.hide : t.show}</button></div></label>
          {mode === "register" && <label><span>{t.confirm}</span><input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} maxLength={128} autoComplete="new-password" /></label>}
          {error && <div className="auth-error" role="alert" aria-live="polite">{error}</div>}
          <button className="auth-submit utino-primary" type="submit" disabled={busy || (mode === "register" && !registrationEnabled)}>{busy ? t.busy : mode === "login" ? t.signIn : t.signUp}</button>
        </form>

        <button className="auth-switch" type="button" disabled={busy} onClick={() => { setMode((v) => v === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? t.switchReg : t.switchLogin}</button>
        <button className="auth-support" type="button" onClick={() => setSupportOpen(true)}><span className="support-avatar">✓</span><span className="support-copy"><strong>{t.support}</strong><small>{t.supportHandle} ✓</small><em>{t.supportText}</em></span><span className="support-arrow">›</span></button>
      </section>

      {supportOpen && <div className="auth-overlay" onMouseDown={(e) => e.target === e.currentTarget && setSupportOpen(false)}><section className="auth-modal" role="dialog" aria-modal="true" aria-label={t.support}><div className="modal-head"><div><span className="modal-kicker">UTINOCHATV1</span><h2>{t.support} ✓</h2><small>{t.supportHandle}</small></div><button type="button" onClick={() => setSupportOpen(false)} aria-label="close">×</button></div><p>{t.supportText}</p><div className="support-links"><a href={SUPPORT.telegram} target="_blank" rel="noreferrer">{t.telegram}</a><a href={SUPPORT.web} target="_blank" rel="noreferrer">{t.utinoSupport}</a><a href={SUPPORT.utino} target="_blank" rel="noreferrer">{t.utinoSite}</a><a href={SUPPORT.wdner} target="_blank" rel="noreferrer">{t.wdner}</a><a href={SUPPORT.iparham} target="_blank" rel="noreferrer">{t.iparham}</a></div></section></div>}
    </main>
  );
}
