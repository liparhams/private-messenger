"use client";

import { useEffect, useState } from "react";
import "./intro.css";

const copy = {
  fa: {
    navLogin: "ورود",
    navRegister: "ثبت‌نام",
    badge: "نسخه UTINOCHATV1",
    title: "پیام‌رسانی ساده،
    خصوصی و سریع.",
    text: "یک فضای مدرن برای گفت‌وگوی مستقیم، گروه‌ها و کانال‌ها، با تمرکز روی تجربه کاربری تمیز و کنترل بیشتر روی حساب و گفتگوها.",
    start: "شروع استفاده",
    learn: "ویژگی‌ها",
    privateTitle: "گفت‌وگوی خصوصی",
    privateText: "پیام‌های مستقیم با تجربه‌ای خلوت و بدون شلوغی اضافه.",
    groupsTitle: "گروه و کانال",
    groupsText: "گفت‌وگوهای گروهی و کانال‌های عمومی را در یک فضای یکپارچه مدیریت کن.",
    supportTitle: "پشتیبانی رسمی",
    supportText: "در صورت نیاز، ارتباط با پشتیبانی رسمی در دسترس است.",
    footer: "UTINOCHATV1 • پیام‌رسان یوتینو",
  },
  en: {
    navLogin: "Sign in",
    navRegister: "Create account",
    badge: "UTINOCHATV1",
    title: "Simple, private,
    modern messaging.",
    text: "A clean space for direct messages, groups and channels, built around a focused experience and more control over your account and conversations.",
    start: "Get started",
    learn: "Features",
    privateTitle: "Private chats",
    privateText: "Direct conversations with a focused interface and less clutter.",
    groupsTitle: "Groups & channels",
    groupsText: "Manage group conversations and public channels in one connected space.",
    supportTitle: "Official support",
    supportText: "Official support is available whenever you need help.",
    footer: "UTINOCHATV1 • Utino Messenger",
  },
};

export default function IntroPage() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const t = copy[lang];

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("utino-language");
      const savedTheme = localStorage.getItem("utino-theme");
      if (savedLang === "fa" || savedLang === "en") setLang(savedLang);
      if (savedTheme === "light" || savedTheme === "dark") setDark(savedTheme === "dark");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("utino-language", lang);
      localStorage.setItem("utino-theme", dark ? "dark" : "light");
    } catch {}
  }, [lang, dark]);

  return (
    <main className={`intro-page ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr"}>
      <div className="intro-glow intro-glow-one" aria-hidden="true" />
      <div className="intro-glow intro-glow-two" aria-hidden="true" />

      <nav className="intro-nav" aria-label="Navigation">
        <a className="intro-brand" href="/">
          <span className="intro-logo">U</span>
          <span>UTINOCHATV1</span>
        </a>
        <div className="intro-nav-actions">
          <button type="button" onClick={() => setLang((v) => (v === "fa" ? "en" : "fa"))}>{lang === "fa" ? "EN" : "فا"}</button>
          <button type="button" onClick={() => setDark((v) => !v)} aria-label="Toggle theme">{dark ? "Light" : "Dark"}</button>
          <a className="nav-login" href="/">{t.navLogin}</a>
          <a className="nav-register" href="/?register=1">{t.navRegister}</a>
        </div>
      </nav>

      <section className="intro-hero">
        <div className="hero-copy">
          <div className="intro-badge"><span />{t.badge}</div>
          <h1>{t.title}</h1>
          <p>{t.text}</p>
          <div className="hero-actions">
            <a className="primary-cta" href="/">{t.start}<span>↗</span></a>
            <a className="secondary-cta" href="#features">{t.learn}</a>
          </div>
          <div className="hero-note"><span className="status-dot" />{lang === "fa" ? "طراحی شده برای تجربه‌ای سریع و خلوت" : "Designed for a focused, fast experience"}</div>
        </div>

        <div className="hero-preview" aria-label="Messenger preview">
          <div className="preview-window">
            <div className="preview-topbar"><span className="preview-dot" /><span /><span /></div>
            <div className="preview-body">
              <aside className="preview-sidebar">
                <div className="preview-mini-brand">U</div>
                <div className="preview-line wide" /><div className="preview-line" /><div className="preview-line" />
                <div className="preview-avatar-row"><i /><div><b /><small /></div></div>
                <div className="preview-avatar-row"><i /><div><b /><small /></div></div>
                <div className="preview-avatar-row"><i /><div><b /><small /></div></div>
              </aside>
              <div className="preview-chat">
                <div className="preview-chat-head"><div className="preview-avatar" /><div><b /><small /></div></div>
                <div className="preview-messages"><span /><span className="right" /><span /><span className="right short" /><span className="right" /></div>
                <div className="preview-input" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid" id="features">
        <article><div className="feature-icon">01</div><h2>{t.privateTitle}</h2><p>{t.privateText}</p></article>
        <article><div className="feature-icon">02</div><h2>{t.groupsTitle}</h2><p>{t.groupsText}</p></article>
        <article><div className="feature-icon">03</div><h2>{t.supportTitle}</h2><p>{t.supportText}</p></article>
      </section>

      <footer className="intro-footer"><span>{t.footer}</span><a href="https://utino.org" target="_blank" rel="noreferrer">utino.org</a></footer>
    </main>
  );
}
