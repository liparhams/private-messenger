"use client";

import { useEffect, useState } from "react";
import "../utino-platform.css";
import "../utino-system.css";
import "./intro.css";
import "./intro-polish.css";
import "./intro-v2.css";
import "./telegram-style.css";

const copy = {
  fa: {
    login: "ورود", register: "ساخت حساب", menu: "منو", features: "ویژگی‌ها", badge: "UTINOCHATV1",
    title: <>پیام‌رسانی که<br />ساده کار می‌کند.</>,
    text: "گفت‌وگوی سریع، گروه و کانال در یک فضای خلوت و مدرن. بدون شماره تلفن، با ورود نام کاربری و رمز عبور.",
    start: "شروع استفاده", view: "آشنایی بیشتر", access: "ورود به حساب",
    why: "چرا UTINOCHATV1؟", whyText: "ساختار محصول از الگوهای جاافتاده‌ی کلاینت‌های وب و دسکتاپ پیام‌رسان‌ها الهام گرفته شده، اما تجربه و هویت خودش را دارد.",
    privateTitle: "گفت‌وگوی خصوصی", privateText: "چت مستقیم با وضعیت ارسال، ویرایش و دیده‌شدن و رابطی سریع برای استفاده روزمره.",
    groupsTitle: "گروه‌ها", groupsText: "ساخت گروه، مدیریت اعضا، نقش‌ها و فضای مشترک گفتگو با کنترل روشن و ساده.",
    channelsTitle: "کانال‌ها", channelsText: "انتشار محتوا در کانال‌های عمومی یا خصوصی با فهرست اعضا و مدیریت اختصاصی.",
    supportTitle: "پشتیبانی", supportText: "بخش پشتیبانی یکپارچه برای ثبت و پیگیری درخواست‌ها در خود پلتفرم.",
    capabilityTitle: "یک پیام‌رسان کامل در مرورگر", capabilityText: "تمرکز این نسخه روی تجربه‌ای شبیه کلاینت‌های مدرن پیام‌رسان است: پاسخ‌گویی سریع، چیدمان دو ستونه، پنل‌های تمیز و رفتار مناسب موبایل.",
    caps: [["همگام‌سازی", "وضعیت گفتگوها و پیام‌ها با Supabase و رویدادهای realtime."],["رسانه", "ارسال تصویر، فایل، صدا و ویدئو با محدودیت و اعتبارسنجی سمت کلاینت."],["جستجو", "جست‌وجوی کاربران و اجتماعات عمومی با نمایش زنده نتایج."],["رابط کاربری", "تم تاریک و روشن، فارسی و انگلیسی، طراحی واکنش‌گرا و منوهای یکپارچه."],["مدیریت", "پنل مدیریت برای کاربران، گفتگوها، پیام‌ها، تنظیمات و پشتیبانی."],["امنیت حساب", "احراز هویت با نام کاربری و رمز عبور، بدون نمایش یا درخواست شماره تلفن."]],
    newsTitle: "ساخته‌شده برای امروز", news: [["SIMPLE", "شروع سریع", "از صفحه اصلی تا اولین گفتگو، مسیر کاربر کوتاه و واضح نگه داشته شده است."],["PRIVATE", "حساب با نام کاربری", "کاربر با شناسه و رمز خودش وارد می‌شود و شماره تلفن بخشی از تجربه نیست."],["MODERN", "تجربه وب", "چیدمان، انیمیشن‌های محدود و نقاط تعاملی برای سرعت و تمرکز طراحی شده‌اند."]],
    footer: "UTINOCHATV1 • پیام‌رسان یوتینو"
  },
  en: {
    login: "Sign in", register: "Create account", menu: "Menu", features: "Features", badge: "UTINOCHATV1",
    title: <>Messaging that<br />just works.</>,
    text: "Fast chats, groups and channels in a focused modern space. No phone number required, just a username and password.",
    start: "Get started", view: "Explore", access: "Sign in",
    why: "Why UTINOCHATV1?", whyText: "The product architecture takes cues from mature web and desktop messenger clients while keeping its own visual identity and account model.",
    privateTitle: "Private chats", privateText: "Direct conversations with send, edit and seen states in a fast everyday interface.",
    groupsTitle: "Groups", groupsText: "Create groups, manage members and roles, and keep shared conversations easy to control.",
    channelsTitle: "Channels", channelsText: "Publish to public or private channels with dedicated member and management views.",
    supportTitle: "Support", supportText: "Built-in support for creating and following requests without leaving the platform.",
    capabilityTitle: "A complete messenger in your browser", capabilityText: "This version focuses on the interaction model of modern messaging clients: responsive layouts, fast chat loading, clean panels and mobile behavior.",
    caps: [["Sync", "Conversation and message state powered by Supabase realtime events."],["Media", "Image, file, audio and video uploads with client-side validation."],["Search", "Live search across users and discoverable public communities."],["Interface", "Dark/light themes, Persian/English, responsive layouts and unified menus."],["Admin", "Management for users, conversations, messages, settings and support."],["Account", "Username/password authentication with no phone number in the login flow."]],
    newsTitle: "Built for today", news: [["SIMPLE", "Fast start", "The path from landing page to first conversation stays short and obvious."],["PRIVATE", "Username accounts", "Users sign in with their own identifier and password, without a phone number step."],["MODERN", "Web-first", "Layout, restrained motion and interaction points are designed around speed and focus."]],
    footer: "UTINOCHATV1 • Utino Messenger"
  }
};

export default function IntroPage() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const [modal, setModal] = useState(null);
  const t = copy[lang];

  useEffect(() => {
    try {
      const l = localStorage.getItem("utino-language");
      const th = localStorage.getItem("utino-theme");
      if (l === "fa" || l === "en") setLang(l);
      if (th === "light" || th === "dark") setDark(th === "dark");
    } catch {}
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

  useEffect(() => {
    if (!modal) return;
    const close = (event) => event.key === "Escape" && setModal(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [modal]);

  return (
    <main className={`intro-page platform-page ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr"}>
      <header className="intro-topline">
        <nav className="intro-nav">
          <a className="intro-brand" href="/" aria-label="UTINOCHATV1"><span className="intro-logo">U</span><span>UTINOCHATV1</span></a>
          <div className="intro-nav-actions">
            <button className="utino-control intro-menu-button" type="button" onClick={() => setModal("menu")}>☰ {t.menu}</button>
            <button className="utino-control" type="button" onClick={() => setLang((v) => v === "fa" ? "en" : "fa")}>{lang === "fa" ? "EN" : "فا"}</button>
            <button className="utino-control" type="button" onClick={() => setDark((v) => !v)}>{dark ? "☀" : "☾"}</button>
            <a className="nav-login" href="/login">{t.login}</a>
            <a className="nav-register" href="/login?register=1">{t.register}</a>
          </div>
        </nav>
      </header>

      <section className="intro-hero">
        <div className="hero-copy">
          <div className="intro-badge"><span />{t.badge}</div>
          <h1>{t.title}</h1>
          <p>{t.text}</p>
          <div className="hero-actions">
            <a className="primary-cta" href="/login?register=1">{t.start} ↗</a>
            <button className="secondary-cta" type="button" onClick={() => document.getElementById("why")?.scrollIntoView({ behavior: "smooth" })}>{t.view}</button>
          </div>
          <div className="hero-note"><span className="status-dot" />{lang === "fa" ? "نسخه وب • فارسی و انگلیسی • دسکتاپ و موبایل" : "Web app • Persian and English • desktop and mobile"}</div>
        </div>
        <div className="hero-preview" aria-hidden="true">
          <div className="preview-window">
            <div className="preview-topbar"><span className="preview-dot" /><span /><span /></div>
            <div className="preview-body">
              <aside className="preview-sidebar"><div className="preview-mini-brand">U</div><div className="preview-line wide" /><div className="preview-line" /><div className="preview-avatar-row"><i /><div><b /><small /></div></div><div className="preview-avatar-row"><i /><div><b /><small /></div></div><div className="preview-avatar-row"><i /><div><b /><small /></div></div></aside>
              <div className="preview-chat"><div className="preview-chat-head"><div className="preview-avatar" /><div><b /><small /></div></div><div className="preview-messages"><span /><span className="right" /><span /><span className="right short" /><span className="right" /></div><div className="preview-input" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="intro-section" id="why">
        <div className="intro-section-head"><span className="intro-section-kicker">UTINOCHATV1</span><h2>{t.why}</h2><p>{t.whyText}</p></div>
        <div className="feature-grid">
          <article><div className="feature-icon">💬</div><h2>{t.privateTitle}</h2><p>{t.privateText}</p></article>
          <article><div className="feature-icon">👥</div><h2>{t.groupsTitle}</h2><p>{t.groupsText}</p></article>
          <article><div className="feature-icon">📣</div><h2>{t.channelsTitle}</h2><p>{t.channelsText}</p></article>
        </div>
      </section>

      <section className="intro-section">
        <div className="intro-section-head"><span className="intro-section-kicker">PRODUCT</span><h2>{t.capabilityTitle}</h2><p>{t.capabilityText}</p></div>
        <div className="capability-grid">{t.caps.map(([title, body], index) => <article className="capability" key={title}><div className="mini-icon">{["↔","◉","⌕","◌","▣","@"][index]}</div><div><strong>{title}</strong><span>{body}</span></div></article>)}</div>
      </section>

      <section className="intro-section">
        <div className="intro-section-head"><span className="intro-section-kicker">EXPERIENCE</span><h2>{t.newsTitle}</h2></div>
        <div className="intro-news">{t.news.map(([tag, title, body]) => <article className="news-card" key={tag}><small>{tag}</small><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <footer className="intro-footer"><span>{t.footer}</span><span>{lang === "fa" ? "ساخته‌شده برای وب مدرن" : "Built for the modern web"}</span></footer>

      {modal && (
        <div className="intro-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <section className="intro-modal" role="dialog" aria-modal="true" aria-label={t.menu}>
            <header className="intro-modal-head"><strong>{t.menu}</strong><button className="intro-modal-close" type="button" onClick={() => setModal(null)}>×</button></header>
            <div className="intro-modal-body">
              <a className="intro-modal-option" href="/login?register=1"><span className="modal-icon">✨</span><span><b>{t.register}</b><small>{t.start}</small></span><span className="modal-arrow">›</span></a>
              <a className="intro-modal-option" href="/login"><span className="modal-icon">🔐</span><span><b>{t.login}</b><small>{t.access}</small></span><span className="modal-arrow">›</span></a>
              <button className="intro-modal-option" type="button" onClick={() => { setModal(null); document.getElementById("why")?.scrollIntoView({ behavior: "smooth" }); }}><span className="modal-icon">🧩</span><span><b>{t.features}</b><small>{t.why}</small></span><span className="modal-arrow">›</span></button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
