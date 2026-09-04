"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "../components/Icon";
import { db } from "../lib/supabase-client";
import mapError from "../lib/error-map";
import "../utino-system.css";
import "./settings.css";
import "./settings-v2.css";

const SUPPORT_LINKS = [
  ["پشتیبانی در تلگرام", "https://t.me/parhamsoleimanybot", "support"],
  ["پشتیبانی در یوتینو", "https://utino.org/chat/supportusername", "chat"],
  ["Utino", "https://utino.org", "globe"],
  ["iParham", "https://iparham.com", "globe"],
  ["WDNER", "https://wdner.co", "globe"],
];

function Badge({ value }) {
  return value && value !== "none" ? <span className={`settings-badge settings-badge-${value}`} aria-label="نشان تأیید"><Icon name="check" size={12} /></span> : null;
}

function go(path) {
  if (typeof window !== "undefined") window.location.assign(path);
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
    setError("");
    try {
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData?.session) {
        go("/");
        return;
      }

      const { data, error: profileError } = await db.rpc("get_my_profile");
      if (profileError) throw profileError;

      const next = Array.isArray(data) ? data[0] || null : data || null;
      if (!next) {
        setError("پروفایل پیدا نشد.");
        return;
      }

      setProfile(next);
      setName(next.display_name || "");
      setBio(next.bio || "");
    } catch (cause) {
      setError(mapError(cause, "fa") || "خطا در دریافت تنظیمات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("utino-theme");
      const next = saved === "light" ? "light" : "dark";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch {}
    void load();
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
    try {
      const { data, error: saveError } = await db.rpc("update_my_profile", {
        new_display_name: cleanName,
        new_bio: cleanBio,
      });
      if (saveError) throw saveError;

      const next = Array.isArray(data) ? data[0] || null : data || null;
      if (next) setProfile(next);
      setMessage("پروفایل با موفقیت ذخیره شد.");
    } catch (cause) {
      setError(mapError(cause, "fa") || "خطا در ذخیره پروفایل.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (saving) return;
    setError("");
    try {
      const { error: logoutError } = await db.auth.signOut();
      if (logoutError) throw logoutError;
      go("/");
    } catch (cause) {
      setError(mapError(cause, "fa") || "خطا در خروج از حساب.");
    }
  }

  if (loading) return <main className="settings-page" dir="rtl"><div className="settings-loading"><span className="settings-spinner" />در حال آماده‌سازی تنظیمات…</div></main>;
  if (!profile) return <main className="settings-page" dir="rtl"><div className="settings-card"><h1>تنظیمات</h1><p>{error || "خطایی رخ داد."}</p><a className="settings-button" href="/messenger/">بازگشت به پیام‌رسان</a></div></main>;

  const initial = (profile.display_name || profile.username || "U").slice(0, 1).toUpperCase();
  const role = profile.role === "admin" ? "ادمین" : profile.role === "support" ? "پشتیبانی" : "کاربر";

  return (
    <main className="settings-page" dir="rtl">
      <div className="settings-shell">
        <header className="settings-topbar">
          <a className="settings-back" href="/messenger/" aria-label="بازگشت" title="بازگشت"><Icon name="back" size={20} animated /></a>
          <div className="settings-topbar-title"><span className="settings-topbar-icon"><Icon name="settings" size={17} animated /></span><span><strong>تنظیمات</strong><small>utino chat</small></span></div>
          <a className="settings-home" href="/messenger/"><Icon name="chat" size={16} /> <span>مسنجر</span></a>
        </header>

        {error && <div className="settings-alert settings-alert-error" role="alert"><Icon name="info" size={17} />{error}</div>}
        {message && <div className="settings-alert settings-alert-success" role="status"><Icon name="check" size={17} />{message}</div>}

        <section className="settings-card settings-profile-card">
          <div className="settings-profile-head">
            <div className="settings-avatar"><span>{initial}</span><i aria-hidden="true" /></div>
            <div className="settings-profile-copy"><h1>{profile.display_name} <Badge value={profile.verification} /></h1><p>@{profile.username}</p><span>{role} · {profile.public_id}</span></div>
            <div className="settings-profile-action"><Icon name="user" size={22} animated /></div>
          </div>
          <form onSubmit={save} className="settings-form">
            <label><span>نام نمایشی</span><input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <label><span>بیو <em>{bio.length}/160</em></span><textarea value={bio} maxLength={160} rows={4} placeholder="کمی درباره خودت بنویس…" onChange={(e) => setBio(e.target.value)} /></label>
            <div className="settings-readonly-grid">
              <div><Icon name="user" size={16} /><span><small>نام کاربری</small><strong>@{profile.username}</strong></span></div>
              <div><Icon name="shield" size={16} /><span><small>شناسه عمومی</small><strong>{profile.public_id}</strong></span></div>
              <div><Icon name="lock" size={16} /><span><small>نقش حساب</small><strong>{role}</strong></span></div>
            </div>
            <button className="settings-primary" disabled={saving}><Icon name="check" size={17} animated />{saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-section-title"><div><strong>ظاهر برنامه</strong><span>انتخاب ظاهر در همه صفحات</span></div><Icon name="sun" size={19} animated /></div>
          <div className="settings-theme-grid">
            <button type="button" className={theme === "light" ? "active" : ""} onClick={() => changeTheme("light")} aria-pressed={theme === "light"}><span className="settings-theme-icon"><Icon name="sun" size={19} animated /></span><span><b>روشن</b><small>تم روشن و خوانا</small></span>{theme === "light" && <Icon name="check" size={16} />}</button>
            <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => changeTheme("dark")} aria-pressed={theme === "dark"}><span className="settings-theme-icon"><Icon name="moon" size={19} animated /></span><span><b>تاریک</b><small>تم تیره و آرام</small></span>{theme === "dark" && <Icon name="check" size={16} />}</button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-title"><div><strong>پشتیبانی و دسترسی</strong><span>راه‌های ارتباطی و بخش‌های حساب</span></div><Icon name="support" size={19} animated /></div>
          <div className="settings-links">
            <button type="button" onClick={() => go("/messenger/?support=1")}><span className="settings-link-icon"><Icon name="support" size={17} animated /></span><span><b>گفتگوی پشتیبانی</b><small>ارتباط مستقیم با تیم پشتیبانی</small></span><Icon name="chevron" size={16} /></button>
            {profile.role === "admin" && <button type="button" onClick={() => go("/admin/")}><span className="settings-link-icon"><Icon name="shield" size={17} animated /></span><span><b>پنل مدیریت</b><small>مدیریت و نظارت بر سرویس</small></span><Icon name="chevron" size={16} /></button>}
            {SUPPORT_LINKS.map(([label, href, icon]) => <a key={href} href={href} target="_blank" rel="noreferrer"><span className="settings-link-icon"><Icon name={icon} size={17} animated /></span><span><b>{label}</b><small>باز کردن در صفحه جدید</small></span><Icon name="arrow" size={16} /></a>)}
          </div>
        </section>

        <section className="settings-card settings-account-card">
          <div className="settings-account-icon"><Icon name="lock" size={18} animated /></div><div><strong>حساب کاربری</strong><span>نام کاربری و شناسه عمومی قابل ویرایش نیستند.</span></div>
          <button type="button" className="settings-logout" onClick={logout}><Icon name="arrow" size={16} /> خروج از حساب</button>
        </section>
      </div>
    </main>
  );
}
