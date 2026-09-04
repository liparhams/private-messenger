"use client";

import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import "../utino-platform.css";
import "../utino-system.css";
import "./intro.css";
import "./intro-polish.css";
import "./intro-v2.css";
import "./telegram-style.css";
import "./telegram-inspired.css";

const copy = {
  fa: {
    login: "ورود", register: "ثبت‌نام", menu: "منو", features: "ویژگی‌ها", badge: "پیام‌رسان وب",
    title: <>پیام‌رسانی<br /><span>سریع، ساده و مدرن.</span></>,
    text: "گفت‌وگوی خصوصی، گروه و کانال در یک تجربه‌ی وب روان. حساب کاربری با نام کاربری و رمز عبور، بدون مرحله‌ی شماره تلفن.",
    start: "شروع استفاده", view: "دیدن امکانات", access: "ورود به حساب",
    why: "همه‌چیز برای گفتگو", whyText: "چیدمان این نسخه از الگوهای جاافتاده‌ی Telegram Web، Webogram و کلاینت دسکتاپ الهام گرفته، اما رابط و هویت خودش را دارد.",
    privateTitle: "چت خصوصی", privateText: "گفت‌وگوی مستقیم با وضعیت پیام، پاسخ، ویرایش و تجربه‌ی سریع روزمره.",
    groupsTitle: "گروه‌ها", groupsText: "فضای مشترک برای گفتگو، مدیریت اعضا و نقش‌ها، با ساختار روشن و قابل کنترل.",
    channelsTitle: "کانال‌ها", channelsText: "انتشار عمومی یا خصوصی با ابزارهای مدیریتی مخصوص کانال و اعضا.",
    supportTitle: "پشتیبانی", supportText: "ثبت درخواست و گفتگو با پشتیبانی از داخل خود پیام‌رسان.",
    capabilityTitle: "تجربه‌ای شبیه یک کلاینت واقعی", capabilityText: "هدرهای سبک، نوار جستجو، پنل‌های جمع‌وجور، حرکت‌های نرم، تم تاریک و روشن و طراحی واکنش‌گرا برای دسکتاپ و موبایل.",
    caps: [["همگام‌سازی", "به‌روزرسانی گفتگوها و پیام‌ها با Supabase Realtime."],["رسانه", "تصویر، فایل، صدا و ویدئو با اعتبارسنجی سمت کاربر."],["جستجو", "جست‌وجوی سریع کاربران و اجتماعات قابل کشف."],["تم و زبان", "فارسی و انگلیسی، راست‌چین و چپ‌چین، تاریک و روشن."],["گروه و کانال", "مدیریت اعضا، نقش‌ها و ساختار اجتماعات."],["حساب", "ورود امن با نام کاربری و رمز عبور و مدیریت پروفایل."]],
    newsTitle: "طراحی‌شده برای وب", news: [["SIMPLE", "شروع سریع", "از صفحه‌ی اول تا اولین گفتگو، مسیر کاربر کوتاه و روشن است."],["PRIVATE", "حساب با نام کاربری", "شناسه‌ی کاربر در مرکز تجربه قرار دارد و شماره تلفن بخشی از ورود نیست."],["MODERN", "حرکت و تعامل", "آیکون‌های برداری، بازخوردهای کوچک و انیمیشن‌های محدود برای حس زنده‌تر رابط."]],
    footer: "پیام‌رسان یوتینو • وب مدرن"
  },
  en: {
    login: "Sign in", register: "Create account", menu: "Menu", features: "Features", badge: "WEB MESSENGER",
    title: <>Messaging<br /><span>fast, simple, modern.</span></>,
    text: "Private chats, groups and channels in a smooth web experience. Username and password accounts without a phone-number step.",
    start: "Get started", view: "Explore features", access: "Sign in",
    why: "Everything for conversation", whyText: "The interface takes cues from Telegram Web, Webogram and desktop messenger patterns while keeping its own product identity.",
    privateTitle: "Private chats", privateText: "Direct conversations with message states, replies, editing and a fast everyday workflow.",
    groupsTitle: "Groups", groupsText: "Shared spaces for conversation with clear member and role management.",
    channelsTitle: "Channels", channelsText: "Public or private publishing with dedicated management views.",
    supportTitle: "Support", supportText: "Create requests and talk to support without leaving the messenger.",
    capabilityTitle: "A real client-like experience", capabilityText: "Lightweight headers, search, compact panels, restrained motion, dark/light themes and responsive desktop/mobile layouts.",
    caps: [["Sync", "Conversation and message updates through Supabase Realtime."],["Media", "Image, file, audio and video flows with client validation."],["Search", "Fast search across users and discoverable communities."],["Theme & language", "Persian and English, RTL/LTR, dark and light themes."],["Groups & channels", "Member, role and community management."],["Account", "Username/password sign-in and profile management."]],
    newsTitle: "Built for the web", news: [["SIMPLE", "Fast start", "The path from landing page to first conversation stays short and obvious."],["PRIVATE", "Username accounts", "The user identifier is central to the experience and phone numbers are not part of sign-in."],["MODERN", "Motion & interaction", "Vector icons, micro-feedback and restrained animation keep the interface alive without slowing it down."]],
    footer: "Utino Messenger • Modern web"
  }
};

const featureIcons = ["chat", "group", "channel", "support"];
const capIcons = ["devices", "download", "search", "globe", "group", "shield"];

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

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className={`intro-page platform-page telegram-inspired-page ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr"}>
      <header className="ti-nav-wrap">
        <nav className="ti-nav">
          <a className="ti-brand" href="/" aria-label="UTINOCHATV1"><span className="ti-logo"><Icon name="send" size={22} strokeWidth={2.1} /></span><span>UTINOCHATV1</span></a>
          <div className="ti-nav-links"><button onClick={() => scrollTo("why")} type="button">{t.features}</button><button onClick={() => scrollTo("capabilities")} type="button">{lang === "fa" ? "امکانات" : "Product"}</button></div>
          <div className="ti-nav-actions">
            <button className="ti-icon-button" type="button" onClick={() => setLang((v) => v === "fa" ? "en" : "fa")} aria-label="Language"><Icon name="globe" size={19} /> <span>{lang === "fa" ? "EN" : "فا"}</span></button>
            <button className="ti-icon-button" type="button" onClick={() => setDark((v) => !v)} aria-label="Theme"><Icon name={dark ? "sun" : "moon"} size={19} /></button>
            <button className="ti-icon-button ti-mobile-menu" type="button" onClick={() => setModal("menu")} aria-label={t.menu}><Icon name="menu" size={20} /></button>
            <a className="ti-login" href="/login">{t.login}</a>
            <a className="ti-register" href="/login?register=1">{t.register}</a>
          </div>
        </nav>
      </header>

      <section className="ti-hero">
        <div className="ti-hero-copy">
          <div className="ti-badge"><span className="ti-live-dot" />{t.badge}</div>
          <h1>{t.title}</h1>
          <p>{t.text}</p>
          <div className="ti-actions"><a className="ti-primary" href="/login?register=1">{t.start}<Icon name="arrow" size={18} /></a><button className="ti-secondary" type="button" onClick={() => scrollTo("why")}>{t.view}</button></div>
          <div className="ti-proof"><span><Icon name="shield" size={16} />{lang === "fa" ? "حساب کاربری" : "Account based"}</span><span><Icon name="bolt" size={16} />{lang === "fa" ? "Realtime" : "Realtime"}</span><span><Icon name="devices" size={16} />{lang === "fa" ? "وب و موبایل" : "Web & mobile"}</span></div>
        </div>
        <div className="ti-hero-art" aria-hidden="true">
          <div className="ti-orbit ti-orbit-a" /><div className="ti-orbit ti-orbit-b" />
          <div className="ti-window">
            <div className="ti-window-top"><span className="ti-window-title"><Icon name="chat" size={17} />Chats</span><span className="ti-window-actions"><i /><i /><i /></span></div>
            <div className="ti-window-body">
              <aside className="ti-mini-sidebar"><div className="ti-mini-search"><Icon name="search" size={15} /></div><div className="ti-mini-chat active"><b /><span><i /><em /></span></div><div className="ti-mini-chat"><b /><span><i /><em /></span></div><div className="ti-mini-chat"><b /><span><i /><em /></span></div><div className="ti-mini-chat"><b /><span><i /><em /></span></div></aside>
              <div className="ti-mini-conversation"><div className="ti-mini-head"><b /><span><i /><em /></span><Icon name="search" size={16} /></div><div className="ti-mini-messages"><div className="ti-bubble incoming">Hello!<small>10:24</small></div><div className="ti-bubble outgoing">Welcome 👋<small>10:25 ✓✓</small></div><div className="ti-bubble incoming wide">A clean, fast messenger.<small>10:26</small></div><div className="ti-bubble outgoing short">Let’s go.<small>10:26 ✓✓</small></div></div><div className="ti-mini-input"><span>Write a message...</span><Icon name="send" size={17} /></div></div>
            </div>
          </div>
          <div className="ti-float-card"><span className="ti-float-icon"><Icon name="bolt" size={17} /></span><span><b>Realtime</b><small>Messages stay in sync</small></span><Icon name="check" size={16} /></div>
        </div>
      </section>

      <section className="ti-section" id="why">
        <div className="ti-section-head"><span className="ti-kicker">WHY UTINO</span><h2>{t.why}</h2><p>{t.whyText}</p></div>
        <div className="ti-feature-grid">
          {[t.privateTitle, t.groupsTitle, t.channelsTitle, t.supportTitle].map((title, index) => {
            const texts = [t.privateText, t.groupsText, t.channelsText, t.supportText];
            return <article className="ti-feature-card" key={title}><div className="ti-feature-icon"><Icon name={featureIcons[index]} size={25} /></div><span className="ti-card-index">0{index + 1}</span><h3>{title}</h3><p>{texts[index]}</p></article>;
          })}
        </div>
      </section>

      <section className="ti-section ti-capabilities" id="capabilities">
        <div className="ti-section-head"><span className="ti-kicker">PRODUCT</span><h2>{t.capabilityTitle}</h2><p>{t.capabilityText}</p></div>
        <div className="ti-cap-grid">{t.caps.map(([title, body], index) => <article className="ti-cap-card" key={title}><div className="ti-cap-icon"><Icon name={capIcons[index]} size={22} /></div><div><strong>{title}</strong><span>{body}</span></div><Icon className="ti-cap-arrow" name="arrow" size={17} /></article>)}</div>
      </section>

      <section className="ti-section ti-experience">
        <div className="ti-section-head"><span className="ti-kicker">EXPERIENCE</span><h2>{t.newsTitle}</h2></div>
        <div className="ti-news-grid">{t.news.map(([tag, title, body]) => <article className="ti-news-card" key={tag}><span>{tag}</span><h3>{title}</h3><p>{body}</p><Icon name="arrow" size={18} /></article>)}</div>
      </section>

      <footer className="ti-footer"><a className="ti-brand" href="/"><span className="ti-logo"><Icon name="send" size={19} /></span><span>UTINOCHATV1</span></a><span>{t.footer}</span><div><a href="/login">{t.login}</a><a href="/login?register=1">{t.register}</a></div></footer>

      {modal && <div className="ti-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}><section className="ti-modal" role="dialog" aria-modal="true" aria-label={t.menu}><header><strong>{t.menu}</strong><button type="button" onClick={() => setModal(null)}><Icon name="plus" size={20} /></button></header><div><a href="/login?register=1"><Icon name="user" size={21} /><span>{t.register}</span><Icon name="arrow" size={17} /></a><a href="/login"><Icon name="shield" size={21} /><span>{t.login}</span><Icon name="arrow" size={17} /></a><button type="button" onClick={() => { setModal(null); scrollTo("why"); }}><Icon name="chat" size={21} /><span>{t.features}</span><Icon name="arrow" size={17} /></button></div></section></div>}
    </main>
  );
}
