"use client";

import { useEffect, useState } from "react";
import { db } from "./lib/supabase-client";
import "./core.css";

export default function Home() {
  const [session, setSession] = useState(null);
  useEffect(() => { db.auth.getSession().then(({data}) => setSession(data.session)); }, []);
  return <main className="landing" dir="rtl">
    <nav className="landing-nav"><a className="brand" href="/"><span className="brand-logo">U</span><b>utino chat</b></a><div className="nav-actions"><a href="#features">ویژگی‌ها</a><a href="/messenger/">پیام‌رسان</a><a className="nav-login" href={session ? "/messenger/" : "/login/"}>{session ? "ورود به پیام‌رسان" : "ورود"}</a></div></nav>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">پیام‌رسان خصوصی و سریع</span><h1>گفت‌وگو، ساده‌تر از همیشه.</h1><p>utino chat یک پیام‌رسان مدرن برای گفت‌وگوهای شخصی، گروه‌ها و کانال‌هاست، با تجربه‌ای تمیز، سریع و بدون شلوغی.</p><div className="hero-actions"><a className="primary" href={session ? "/messenger/" : "/register/"}>{session ? "باز کردن پیام‌رسان" : "شروع رایگان"}<span>←</span></a><a className="secondary" href="/messenger/">مشاهده پیام‌رسان</a></div></div><div className="hero-art"><div className="float-icon i1">✦</div><div className="float-icon i2">⌁</div><div className="phone"><div className="phone-head"><span className="mini-avatar">U</span><span><b>utino chat</b><small>آنلاین</small></span><i>⋮</i></div><div className="chat-bg"><div className="bubble incoming">سلام 👋<small>۲۰:۴۱</small></div><div className="bubble outgoing">خوش اومدی به utino chat <small>۲۰:۴۲ ✓✓</small></div><div className="bubble incoming">ساده، سریع و خصوصی.</div></div><div className="composer"><span>پیام...</span><b>➤</b></div></div></div></section>
    <section className="trust"><span>طراحی شده برای وب و دسکتاپ</span><span>⚡ سریع</span><span>🔒 خصوصی</span><span>☁ همگام</span></section>
    <section id="features" className="features"><div className="section-head"><span className="eyebrow">همه‌چیز سر جای خودش</span><h2>قدرت زیاد، ظاهر آرام</h2><p>ساختار و الگوهای رابط از کلاینت‌های مدرن پیام‌رسان الهام گرفته شده، اما پیاده‌سازی utino chat مستقل و اختصاصی است.</p></div><div className="feature-grid"><article><b>◌</b><h3>ساده</h3><p>رابط خلوت، ناوبری واضح و دسترسی سریع به گفت‌وگوها.</p></article><article><b>⌁</b><h3>خصوصی</h3><p>احراز هویت و کنترل دسترسی با Supabase و سیاست‌های RLS.</p></article><article><b>↻</b><h3>همگام</h3><p>پیام‌ها و وضعیت گفت‌وگوها با Realtime به‌روز می‌شوند.</p></article><article><b>⌕</b><h3>جست‌وجو</h3><p>پیدا کردن کاربران و جوامع عمومی از داخل پیام‌رسان.</p></article><article><b>♧</b><h3>گروه و کانال</h3><p>فضاهای عمومی و خصوصی برای ارتباط‌های کوچک و بزرگ.</p></article><article><b>◈</b><h3>فایل و رسانه</h3><p>ارسال رسانه و فایل با رابطی سریع و قابل فهم.</p></article></div></section>
    <section className="cta"><div><span className="eyebrow">utino chat</span><h2>گفت‌وگوت را شروع کن.</h2><p>یک تجربه سبک و مدرن، با همان چیزهایی که هر پیام‌رسان خوب باید داشته باشد.</p></div><a className="primary" href={session ? "/messenger/" : "/register/">{session ? "ورود" : "ثبت‌نام"} <span>←</span></a></section>
    <footer><span>© 2026 utino chat</span><div><a href="https://wdner.co">ودنر</a><a href="https://iparham.com">پرهام سلیمانی</a><a href="https://utino.org">یوتینو</a></div></footer>
  </main>;
}
