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
import "./telegram-clean.css";

const copy = {
  fa: {
    login: "ورود", register: "ثبت‌نام", menu: "منو", features: "ویژگی‌ها", badge: "پیام‌رسان وب",
    title: <>پیام‌رسانی<br /><span>ساده، سریع، برای همه.</span></>,
    text: "گفت‌وگوهای خصوصی، گروه‌ها و کانال‌ها در یک تجربه‌ی وب تمیز و روان. همه‌چیز با حساب کاربری خودت و بدون شلوغی اضافه.",
    start: "شروع استفاده", view: "امکانات", why: "چرا UTINOCHATV1؟", whyText: "یک تجربه‌ی پیام‌رسانی مدرن با معماری رابطی الهام‌گرفته از الگوهای موفق Telegram Web و کلاینت‌های دسکتاپ، اما با هویت مستقل.",
    privateTitle: "خصوصی", privateText: "گفت‌وگوی مستقیم، وضعیت پیام، پاسخ، ویرایش و تجربه‌ای سریع برای استفاده‌ی روزانه.",
    groupsTitle: "گروه‌ها", groupsText: "فضای گفتگو با اعضا، نقش‌ها و ابزارهای مدیریتی روشن و قابل کنترل.",
    channelsTitle: "کانال‌ها", channelsText: "انتشار محتوا با ساختار ساده و ابزارهای مخصوص مدیریت کانال.",
    supportTitle: "پشتیبانی", supportText: "ارتباط با پشتیبانی و ثبت درخواست بدون خروج از محیط پیام‌رسان.",
    capabilityTitle: "هر چیزی که از یک مسنجر مدرن انتظار داری", capabilityText: "جستجو، همگام‌سازی، رسانه، تم، زبان، پروفایل و مدیریت گفتگوها در یک رابط یکپارچه.",
    caps: [["همگام‌سازی", "به‌روزرسانی گفتگوها با Supabase Realtime."],["رسانه", "پشتیبانی از مسیرهای تصویر، فایل، صدا و ویدئو."],["جستجو", "جستجوی سریع کاربران و گفتگوهای قابل دسترس."],["تم و زبان", "فارسی و انگلیسی، RTL و LTR، روشن و تاریک."],["گروه و کانال", "مدیریت اعضا، نقش‌ها و ساختار گفتگو."],["حساب", "مدیریت پروفایل و ورود با حساب کاربری."]],
    newsTitle: "ساخته‌شده برای وب", news: [["SIMPLE", "شروع سریع", "مسیر ورود تا شروع اولین گفتگو کوتاه و واضح است."],["PRIVATE", "حریم گفتگو", "ساختار رابط و دسترسی‌ها با تمرکز روی گفتگوهای خصوصی طراحی شده است."],["EXPRESSIVE", "تعامل زنده", "آیکون‌های برداری و حرکت‌های ظریف، بدون شلوغ کردن محیط."]], footer: "UTINOCHATV1 • پیام‌رسان وب"
  },
  en: {
    login: "Sign in", register: "Create account", menu: "Menu", features: "Features", badge: "WEB MESSENGER",
    title: <>Messaging<br /><span>simple, fast, for everyone.</span></>,
    text: "Private chats, groups and channels in a clean, responsive web experience. Your account stays at the center without unnecessary clutter.",
    start: "Get started", view: "Features", why: "Why UTINOCHATV1?", whyText: "A modern messaging experience shaped by proven Telegram Web and desktop-client patterns, with its own product identity.",
    privateTitle: "Private", privateText: "Direct conversations with message states, replies, editing and a fast daily workflow.", groupsTitle: "Groups", groupsText: "Shared spaces with members, roles and clear management tools.", channelsTitle: "Channels", channelsText: "Simple publishing with dedicated channel management tools.", supportTitle: "Support", supportText: "Contact support and create requests without leaving the messenger.",
    capabilityTitle: "Everything you expect from a modern messenger", capabilityText: "Search, sync, media, themes, languages, profiles and conversation management in one interface.",
    caps: [["Sync", "Conversation updates through Supabase Realtime."],["Media", "Image, file, audio and video flows."],["Search", "Fast search across available users and conversations."],["Theme & language", "Persian and English, RTL/LTR, light and dark."],["Groups & channels", "Members, roles and community structure."],["Account", "Profile management and account sign-in."]],
    newsTitle: "Built for the web", news: [["SIMPLE", "Fast start", "The path from sign-in to the first conversation stays short and obvious."],["PRIVATE", "Conversation privacy", "The interface and access model are designed around private conversations."],["EXPRESSIVE", "Live interaction", "Vector icons and subtle motion keep the interface alive without clutter."]], footer: "UTINOCHATV1 • Web messenger"
  }
};
const featureIcons = ["chat", "group", "channel", "support"];
const capIcons = ["devices", "download", "search", "globe", "group", "shield"];

export default function IntroPage() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const [modal, setModal] = useState(false);
  const t = copy[lang];
  useEffect(() => { try { const l = localStorage.getItem("utino-language"); const th = localStorage.getItem("utino-theme"); if (l === "fa" || l === "en") setLang(l); if (th === "light" || th === "dark") setDark(th === "dark"); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("utino-language", lang); localStorage.setItem("utino-theme", dark ? "dark" : "light"); document.documentElement.dataset.theme = dark ? "dark" : "light"; document.documentElement.lang = lang; document.documentElement.dir = lang === "fa" ? "rtl" : "ltr"; } catch {} }, [lang, dark]);
  useEffect(() => { if (!modal) return; const close = e => e.key === "Escape" && setModal(false); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [modal]);
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return <main className={`intro-page platform-page telegram-inspired-page ${dark ? "theme-dark" : "theme-light"}`} dir={lang === "fa" ? "rtl" : "ltr"}>
    <header className="ti-nav-wrap"><nav className="ti-nav"><a className="ti-brand" href="/" aria-label="UTINOCHATV1"><span className="ti-logo"><Icon name="send" size={22} animated /></span><span>UTINOCHATV1</span></a><div className="ti-nav-links"><button onClick={() => scrollTo("why")} type="button">{t.features}</button><button onClick={() => scrollTo("capabilities")} type="button">{lang === "fa" ? "امکانات" : "Product"}</button></div><div className="ti-nav-actions"><button className="ti-icon-button" type="button" onClick={() => setLang(v => v === "fa" ? "en" : "fa")} aria-label="Language"><Icon name="globe" size={19} animated />{lang === "fa" ? "EN" : "فا"}</button><button className="ti-icon-button" type="button" onClick={() => setDark(v => !v)} aria-label="Theme"><Icon name={dark ? "sun" : "moon"} size={19} animated /></button><button className="ti-icon-button ti-mobile-menu" type="button" onClick={() => setModal(true)} aria-label={t.menu}><Icon name="menu" size={20} animated /></button><a className="ti-login" href="/login">{t.login}</a><a className="ti-register" href="/login?register=1">{t.register}</a></div></nav></header>
    <section className="ti-hero"><div className="ti-hero-copy"><div className="ti-badge"><span className="ti-live-dot" />{t.badge}</div><h1>{t.title}</h1><p>{t.text}</p><div className="ti-actions"><a className="ti-primary" href="/login?register=1">{t.start}<Icon name="arrow" size={18} animated /></a><button className="ti-secondary" type="button" onClick={() => scrollTo("why")}>{t.view}</button></div><div className="ti-proof"><span><Icon name="shield" size={16} animated />{lang === "fa" ? "حساب کاربری" : "Account"}</span><span><Icon name="bolt" size={16} animated />Realtime</span><span><Icon name="devices" size={16} animated />{lang === "fa" ? "وب و موبایل" : "Web & mobile"}</span></div></div><div className="ti-hero-art" aria-hidden="true"><div className="ti-orbit ti-orbit-a" /><div className="ti-orbit ti-orbit-b" /><div className="ti-window"><div className="ti-window-top"><span className="ti-window-title"><Icon name="chat" size={17} />Chats</span><span className="ti-window-actions"><i /><i /><i /></span></div><div className="ti-window-body"><aside className="ti-mini-sidebar"><div className="ti-mini-search"><Icon name="search" size={15} /></div>{[1,2,3,4].map(i => <div className={`ti-mini-chat ${i===1 ? "active" : ""}`} key={i}><b /><span><i /><em /></span></div>)}</aside><div className="ti-mini-conversation"><div className="ti-mini-head"><b /><span><i /><em /></span><Icon name="search" size={16} /></div><div className="ti-mini-messages"><div className="ti-bubble incoming">Hello!<small>10:24</small></div><div className="ti-bubble outgoing">Welcome 👋<small>10:25 ✓✓</small></div><div className="ti-bubble incoming wide">A clean, fast messenger.<small>10:26</small></div><div className="ti-bubble outgoing short">Let’s go.<small>10:26 ✓✓</small></div></div><div className="ti-mini-input"><span>Write a message...</span><Icon name="send" size={17} animated /></div></div></div></div><div className="ti-float-card"><span className="ti-float-icon"><Icon name="bolt" size={17} animated /></span><span><b>Realtime</b><small>Messages stay in sync</small></span><Icon name="check" size={16} animated /></div></div></section>
    <section className="ti-section" id="why"><div className="ti-section-head"><span className="ti-kicker">WHY UTINO</span><h2>{t.why}</h2><p>{t.whyText}</p></div><div className="ti-feature-grid">{[t.privateTitle,t.groupsTitle,t.channelsTitle,t.supportTitle].map((title,i)=><article className="ti-feature-card" key={title}><div className="ti-feature-icon"><Icon name={featureIcons[i]} size={25} animated /></div><span className="ti-card-index">0{i+1}</span><h3>{title}</h3><p>{[t.privateText,t.groupsText,t.channelsText,t.supportText][i]}</p></article>)}</div></section>
    <section className="ti-section ti-capabilities" id="capabilities"><div className="ti-section-head"><span className="ti-kicker">PRODUCT</span><h2>{t.capabilityTitle}</h2><p>{t.capabilityText}</p></div><div className="ti-cap-grid">{t.caps.map(([title,body],i)=><article className="ti-cap-card" key={title}><div className="ti-cap-icon"><Icon name={capIcons[i]} size={22} animated /></div><div><strong>{title}</strong><span>{body}</span></div><Icon className="ti-cap-arrow" name="arrow" size={17} /></article>)}</div></section>
    <section className="ti-section ti-experience"><div className="ti-section-head"><span className="ti-kicker">EXPERIENCE</span><h2>{t.newsTitle}</h2></div><div className="ti-news-grid">{t.news.map(([tag,title,body])=><article className="ti-news-card" key={tag}><span>{tag}</span><h3>{title}</h3><p>{body}</p><Icon name="arrow" size={18} animated /></article>)}</div></section>
    <footer className="ti-footer"><a className="ti-brand" href="/"><span className="ti-logo"><Icon name="send" size={19} animated /></span><span>UTINOCHATV1</span></a><span>{t.footer}</span><div><a href="/login">{t.login}</a><a href="/login?register=1">{t.register}</a></div></footer>
    {modal && <div className="ti-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}><section className="ti-modal" role="dialog" aria-modal="true"><button onClick={() => setModal(false)} aria-label="Close"><Icon name="close" size={19} animated /></button><a href="/login">{t.login}</a><a href="/login?register=1">{t.register}</a><button onClick={() => { setLang(v => v === "fa" ? "en" : "fa"); setModal(false); }}>{lang === "fa" ? "English" : "فارسی"}</button></section></div>}
  </main>;
}
