"use client";

import { useEffect } from "react";

export default function Register() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("register", "1");
    window.location.replace(`/?${params.toString()}`);
  }, []);

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card" aria-live="polite">
        <div className="brand-mark">U</div>
        <div className="auth-title">
          <span>utino chat</span>
          <h1>در حال انتقال…</h1>
        </div>
        <p>صفحه ثبت‌نام یکپارچه در حال آماده‌سازی است.</p>
      </section>
    </main>
  );
}
