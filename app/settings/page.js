"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "../lib/supabase-client";
import mapError from "../lib/error-map";
import "../utino-system.css";
import "./settings.css";

const SUPPORT_LINKS = [
  ["پشتیبانی در تلگرام", "https://t.me/parhamsoleimanybot"],
  ["پشتیبانی در یوتینو", "https://utino.org/chat/supportusername"],
  ["Utino", "https://utino.org"],
  ["iParham", "https://iparham.com"],
  ["WDNER", "https://wdner.co"],
];

function Badge({ value }) {
  return value && value !== "none" ? <span className={`settings-badge settings-badge-${value}`}>✓</span> : null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("dark");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError || !sessionData.session) {
      location.href = "/";
      return;
    }
    const { data, error: profileError } = await db.rpc("get_my_profile");
    if (profileError) {
      setError(mapError(profileError, "fa"));
      setLoading(false);
      return;
    }
    const next = Array.isArray(data) ? data[0] || null : data || null;
    if (!next) {
      setError("پروفایل پیدا نشد.");
      setLoading(false);
      return;
    }
    setProfile(next);
    setName(next.display_name || "");
    setBio(next.bio || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("utino-theme");
      const next = saved === "light" ? "light" : "dark";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch {}
    load();
  }, [load]);

  function changeTheme(next) {
    setTheme(next);
    try {
      localStorage.setItem("utino-theme", next);
      document.documentElement.dataset.theme = next;
    } catch {}
    window.dispatchEvent(new CustomEvent("utino-theme-change", { detail: next === "dark" }));
  }

  async function save(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanBio = bio.trim();
    if (!cleanName || cleanName.length > 80) {
      setError(mapError("invalid_display_name", "fa"));
      return;
    }
    if (cleanBio.length > 160) {
      setError("بیو باید حداکثر ۱۶۰ کاراکتر باشد.");
      return;
    }
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    const { data, error: saveError } = await db.rpc("update_my_profile", {
      new_display_name: cleanName,
      new_bio: cleanBio,
    });
    if (saveError) {
      setError(mapError(saveError, "fa"));
      setSaving(false);
      return;
    }
    const next = Array.isArray(data) ? data[0] || null : data || null;
    if (next) setProfile(next);
    setMessage("پروفایل با موفقیت ذخیره شد.");
    setSaving(false);
  }

  async function logout() {
    if (saving) return;
    const { error: logoutError } = await db.auth.signOut();
    if (logoutError) {
      setError(mapError(logoutError, "fa"));
      return;
    }
    location.href = "/";
  }

  if (loading) return <main className="settings-page" dir="rtl"><div className="settings-loading">در حال بارگذاری تنظیمات…</div></main>;
  if (!profile) return <main className="settings-page" dir="rtl"><div className="settings-card"><h1>تنظیمات</h1><p>{error || "خطایی رخ داد."}</p><a className="settings-button" href="/messenger/">بازگشت به پیام‌رسان</a></div></main>;

  const initial = (profile.display_name || profile.username || "U").slice(0, 1).toUpperCase();
  const role = profile.role === "admin" ? "ادمین" : profile.role === "support" ? "پشتیبانی" : "کاربر";

  return (
    <main className="settings-page" dir="rtl">
      <div className="settings-shell">
        <header className="settings-topbar">
          <a className="settings-back" href="/messenger/" aria-label="بازگشت">‹</a>
          <div><strong>تنظیمات</strong><span>UTINOCHATV1</span></div>
          <a className="settings-home" href="/messenger/">مسنجر</a>
        </header>

        {error && <div className="settings-alert settings-alert-error" role="alert">{error}</div>}
        {message && <div className="settings-alert settings-alert-success" role="status">{message}</div>}

        <section className="settings-card settings-profile-card">
          <div className="settings-profile-head">
            <div className="settings-avatar">{initial}</div>
            <div className="settings-profile-copy">
              <h1>{profile.display_name} <Badge value={profile.verification} /></h1>
              <p>@{profile.username}</p>
              <span>{role} · {profile.public_id}</span>
            </div>
          </div>
          <form onSubmit={save} className="settings-form">
            <label>نام نمایشی<input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <label>بیو <span>{bio.length}/160</span><textarea value={bio} maxLength={160} rows={4} placeholder="کمی درباره خودت بنویس…" onChange={(e) => setBio(e.target.value)} /></label>
            <div className="settings-readonly-grid">
              <div><small>نام کاربری</small><strong>@{profile.username}</strong></div>
              <div><small>شناسه عمومی</small><strong>{profile.public_id}</strong></div>
              <div><small>نقش</small><strong>{role}</strong></div>
            </div>
            <button className="settings-primary" disabled={saving}>{saving ? "در حال ذخیره…" : "ذخیره پروفایل"}</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-section-title"><strong>ظاهر</strong><span>انتخاب ظاهر برنامه در همه صفحات</span></div>
          <div className="settings-theme-grid">
            <button type="button" className={theme === "light" ? "active" : ""} onClick={() => changeTheme("light")} aria-pressed={theme === "light"}><b>☀️</b><span>روشن</span><small>تم روشن و خوانا</small></button>
            <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}><b>🌙</b><span>تاریک</span><small>تم تیره برای استفاده راحت</small></button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-title"><strong>پشتیبانی و دسترسی</strong><span>راه‌های رسمی ارتباطی</span></div>
          <div className="settings-links">
            <button type="button" onClick={() => location.href = "/messenger/?support=1"}>گفتگوی پشتیبانی <span>›</span></button>
            {profile.role === "admin" && <button type="button" onClick={() => location.href = "/admin/"}>پنل مدیریت <span>›</span></button>}
            {SUPPORT_LINKS.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer">{label}<span>↗</span></a>)}
          </div>
        </section>

        <section className="settings-card settings-account-card">
          <div><strong>حساب کاربری</strong><span>نام کاربری و شناسه عمومی قابل ویرایش نیستند.</span></div>
          <button type="button" className="settings-logout" onClick={logout}>خروج از حساب</button>
        </section>
      </div>
    </main>
  );
}
