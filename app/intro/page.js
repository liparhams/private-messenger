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
    signIn: "ورود", create: "ساخت حساب", language: "EN", menu: "منو", product: "محصول", privacy: "حریم خصوصی", apps: "برنامه‌ها", support: "پشتیبانی",
    eyebrow: "پیام‌رسانی برای وب",
    hero: <>پیام‌رسانی که<br /><span>ساده کار می‌کند.</span></>,
    heroText: "گفت‌وگوهای خصوصی، گروه‌ها و کانال‌ها در یک تجربه‌ی سریع و روان. از هر دستگاهی ادامه بده و گفتگوهایت را همیشه همراه خودت داشته باش.",
    start: "شروع استفاده", explore: "آشنایی با امکانات",
    proof: [["shield", "حریم خصوصی"], ["bolt", "سریع و زنده"], ["devices", "همگام روی دستگاه‌ها"]],
    simple: "ساده", simpleText: "از ورود تا اولین پیام، مسیر کوتاه و روشن است.",
    private: "خصوصی", privateText: "کنترل گفتگوها و دسترسی‌ها در مرکز تجربه قرار دارد.",
    synced: "همگام", syncedText: "پیام‌ها با به‌روزرسانی زنده در گفتگوها هماهنگ می‌مانند.",
    fast: "سریع", fastText: "رابط سبک و واکنش‌گرا برای استفاده‌ی روزمره روی وب.",
    expressive: "بیانگر", expressiveText: "آیکون‌های برداری، حرکت‌های ظریف و تعاملات واضح.",
    social: "اجتماعی", socialText: "گروه‌ها و کانال‌ها برای ارتباط و انتشار محتوا.",
    secure: "امن", secureText: "دسترسی‌ها و عملیات حساس از مسیرهای کنترل‌شده انجام می‌شوند.",
    open: "قابل توسعه", openText: "ساختار محصول برای رشد قابلیت‌های جدید آماده است.",
    everything: "یک پیام‌رسان کامل، بدون شلوغی", everythingText: "چت خصوصی، گروه، کانال، جستجو، رسانه، تم، زبان، پروفایل و پشتیبانی در یک محیط یکپارچه.",
    features: [["chat","گفتگوی خصوصی","پیام، پاسخ، ویرایش، حذف و وضعیت پیام."],["group","گروه‌ها","اعضا، نقش‌ها، مدیریت و گفتگوهای جمعی."],["channel","کانال‌ها","انتشار محتوا با ساختار ساده و قابل مدیریت."],["search","جستجو","یافتن کاربران و فضاهای عمومی با سرعت بالا."],["image","رسانه","تصویر، فایل، صدا و ویدئو در جریان گفتگو."],["settings","شخصی‌سازی","تم روشن و تاریک، فارسی و انگلیسی و تنظیمات حساب."]],
    privacyTitle: "کنترل گفتگوها دست خودت است", privacyText: "رابط و دسترسی‌ها با تمرکز روی گفتگوهای خصوصی و مدیریت روشن طراحی شده‌اند.",
    ready: "آماده‌ای؟", readyText: "حساب خودت را بساز و وارد فضای گفتگویت شو.", footer: "utino chat • پیام‌رسان وب", about: "درباره", mobile: "وب و موبایل"
  },
  en: {
    signIn: "Sign in", create: "Create account", language: "فا", menu: "Menu", product: "Product", privacy: "Privacy", apps: "Apps", support: "Support",
    eyebrow: "MESSAGING FOR THE WEB",
    hero: <>Messaging that<br /><span>just works.</span></>,
    heroText: "Private chats, groups and channels in a fast, focused experience. Continue from any device and keep your conversations close.",
    start: "Get started", explore: "Explore features",
    proof: [["shield", "Private"], ["bolt", "Fast & live"], ["devices", "Synced across devices"]],
    simple: "Simple", simpleText: "A short, clear path from sign-in to your first message.",
    private: "Private", privateText: "Conversation access and control stay at the center.",
    synced: "Synced", syncedText: "Live updates keep conversations aligned as they change.",
    fast: "Fast", fastText: "A lightweight, responsive interface for everyday web use.",
    expressive: "Expressive", expressiveText: "Vector icons, subtle motion and clear interactions.",
    social: "Social", socialText: "Groups and channels for conversation and publishing.",
    secure: "Secure", secureText: "Sensitive access and actions follow controlled paths.",
    open: "Extensible", openText: "The product structure is ready for new capabilities.",
    everything: "A complete messenger, without the clutter", everythingText: "Private chat, groups, channels, search, media, themes, language, profiles and support in one interface.",
    features: [["chat","Private chat","Messages, replies, editing, deletion and message state."],["group","Groups","Members, roles, management and shared conversations."],["channel","Channels","Simple publishing with clear management tools."],["search","Search","Find available users and public spaces quickly."],["image","Media","Images, files, audio and video inside conversations."],["settings","Personalize","Light and dark themes, Persian and English, account settings."]],
    privacyTitle: "Your conversations stay under your control", privacyText: "The interface and access model are built around private conversations and clear management.",
    ready: "Ready?", readyText: "Create your account and enter your own conversation space.", footer: "utino chat • Web messenger", about: "About", mobile: "Web & mobile"
  }
};

const featureIcons = ["simple", "shield", "devices", "bolt", "heart", "group", "lock", "plus"];

function MiniMessenger() {
  return <div className="ti-showcase" aria-hidden="true">
    <div className="ti-showcase-glow" />
    <div className="ti-window">
      <div className="ti-window-top"><span className="ti-window-title"><span className="ti-status-dot" />utino chat</span><span className="ti-window-actions"><i /><i /><i /></span></div>
      <div className="ti-window-body">
        <aside className="ti-mini-sidebar"><div className="ti-mini-search"><Icon name="search" size={15} animated /></div>{["A","M","U","C"].map((x,i)=><div className={`ti-mini-chat ${i===0?"active":""}`} key={x}><b>{x}</b><span><i /><em /></span>{i===0 && <small>2</small>}</div>)}</aside>
        <div className="ti-mini-conversation"><div className="ti-mini-head"><b>U</b><span><strong>utino chat</strong><em>online</em></span><Icon name="more" size={18} animated /></div><div className="ti-mini-messages"><div className="ti-bubble incoming">سلام!<small>10:24</small></div><div className="ti-bubble outgoing">Welcome 👋<small>10:25 ✓✓</small></div><div className="ti-bubble incoming wide">همه‌چیز آماده است.<small>10:26</small></div><div className="ti-bubble outgoing short">Let’s go.<small>10:26 ✓✓</small></div></div><div className="ti-mini-input"><span>Write a message...</span><Icon name="send" size={18} animated /></div></div>
      </div>
    </div>
    <div className="ti-floating ti-floating-a"><Icon name="check" size={16} animated /><span>Synced</span></div>
    <div className="ti-floating ti-floating-b"><Icon name="bolt" size={16} animated /><span>Realtime</span></div>
  </div>;
}

export default function IntroPage() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const t = copy[lang];
  useEffect(() => { try { const l=localStorage.getItem("utino-language"); const th=localStorage.getItem("utino-theme"); if(l==="fa"||l==="en")setLang(l); if(th==="light"||th==="dark")setDark(th==="dark"); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("utino-language",lang); localStorage.setItem("utino-theme",dark?"dark":"light"); document.documentElement.dataset.theme=dark?"dark":"light"; document.documentElement.lang=lang; document.documentElement.dir=lang==="fa"?"rtl":"ltr"; } catch {} }, [lang,dark]);
  useEffect(() => { if(!menu)return; const f=e=>e.key==="Escape"&&setMenu(false); window.addEventListener("keydown",f); return()=>window.removeEventListener("keydown",f); },[menu]);
  const scrollTo=id=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  return <main className={`intro-page platform-page telegram-inspired-page utino-home ${dark?"theme-dark":"theme-light"}`}>
    <header className="ti-nav-wrap"><nav className="ti-nav">
      <a className="ti-brand" href="/" aria-label="utino chat"><span className="ti-logo"><Icon name="send" size={21} animated /></span><span>utino chat</span></a>
      <div className="ti-nav-links"><button type="button" onClick={()=>scrollTo("features")}>{t.product}</button><button type="button" onClick={()=>scrollTo("privacy")}>{t.privacy}</button><button type="button" onClick={()=>scrollTo("footer")}>{t.support}</button></div>
      <div className="ti-nav-actions"><button className="ti-icon-button" type="button" onClick={()=>setLang(v=>v==="fa"?"en":"fa")} aria-label="Language"><Icon name="globe" size={18} animated />{t.language}</button><button className="ti-icon-button" type="button" onClick={()=>setDark(v=>!v)} aria-label="Theme"><Icon name={dark?"sun":"moon"} size={18} animated /></button><button className="ti-icon-button ti-mobile-menu" type="button" onClick={()=>setMenu(true)} aria-label={t.menu}><Icon name="menu" size={20} animated /></button><a className="ti-login" href="/login">{t.signIn}</a><a className="ti-register" href="/login?register=1">{t.create}</a></div>
    </nav></header>

    <section className="ti-hero utino-hero"><div className="ti-hero-copy"><div className="ti-badge"><span className="ti-live-dot" />{t.eyebrow}</div><h1>{t.hero}</h1><p>{t.heroText}</p><div className="ti-actions"><a className="ti-primary" href="/login?register=1">{t.start}<Icon name="arrow" size={18} animated /></a><button className="ti-secondary" type="button" onClick={()=>scrollTo("features")}>{t.explore}</button></div><div className="ti-proof">{t.proof.map(([icon,label])=><span key={label}><Icon name={icon} size={16} animated />{label}</span>)}</div></div><MiniMessenger /></section>

    <section className="utino-pillars"><div className="utino-pillars-inner">{[["simple",t.simple,t.simpleText],["shield",t.private,t.privateText],["devices",t.synced,t.syncedText],["bolt",t.fast,t.fastText]].map(([icon,title,body])=><article key={title}><Icon name={icon} size={25} animated /><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="ti-section" id="features"><div className="ti-section-head"><span className="ti-kicker">PRODUCT</span><h2>{t.everything}</h2><p>{t.everythingText}</p></div><div className="utino-feature-grid">{t.features.map(([icon,title,body],i)=><article className="utino-feature" key={title}><span className="utino-feature-number">0{i+1}</span><div className="ti-feature-icon"><Icon name={icon} size={24} animated /></div><h3>{title}</h3><p>{body}</p><Icon name="arrow" size={16} animated /></article>)}</div></section>

    <section className="utino-statement" id="privacy"><div className="utino-statement-art"><div className="utino-shield"><Icon name="shield" size={48} animated /></div><span className="utino-ring r1" /><span className="utino-ring r2" /><span className="utino-ring r3" /></div><div className="utino-statement-copy"><span className="ti-kicker">PRIVATE BY DESIGN</span><h2>{t.privacyTitle}</h2><p>{t.privacyText}</p><div className="utino-checks"><span><Icon name="lock" size={17} animated />{t.secure}</span><span><Icon name="heart" size={17} animated />{t.expressive}</span><span><Icon name="group" size={17} animated />{t.social}</span></div></div></section>

    <section className="ti-section utino-more"><div className="ti-section-head"><span className="ti-kicker">BUILT TO GROW</span><h2>{t.open}</h2><p>{t.openText}</p></div><div className="utino-more-grid">{[["heart",t.expressive,t.expressiveText],["group",t.social,t.socialText],["lock",t.secure,t.secureText],["plus",t.open,t.openText]].map(([icon,title,body])=><article key={title}><div className="ti-feature-icon"><Icon name={icon} size={23} animated /></div><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="utino-cta"><div><span className="ti-kicker">UTINO CHAT</span><h2>{t.ready}</h2><p>{t.readyText}</p></div><a className="ti-primary" href="/login?register=1">{t.create}<Icon name="arrow" size={18} animated /></a></section>

    <footer className="ti-footer" id="footer"><a className="ti-brand" href="/"><span className="ti-logo"><Icon name="send" size={18} animated /></span><span>utino chat</span></a><span>{t.footer} · UTINOCHATV1</span><div><a href="/">{t.about}</a><a href="/login">{t.signIn}</a><a href="/login?register=1">{t.create}</a></div></footer>
    {menu&&<div className="ti-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setMenu(false)}><section className="ti-modal" role="dialog" aria-modal="true"><header><strong>utino chat</strong><button type="button" onClick={()=>setMenu(false)} aria-label="Close"><Icon name="close" size={18} animated /></button></header><div><a href="/login">{t.signIn}</a><a href="/login?register=1">{t.create}</a><button type="button" onClick={()=>{setLang(v=>v==="fa"?"en":"fa");setMenu(false)}}><Icon name="globe" size={18} />{t.language}</button><button type="button" onClick={()=>{setDark(v=>!v);setMenu(false)}}><Icon name={dark?"sun":"moon"} size={18} />{dark?(lang==="fa"?"روشن":"Light"):(lang==="fa"?"تاریک":"Dark")}</button></div></section></div>}
  </main>;
}
