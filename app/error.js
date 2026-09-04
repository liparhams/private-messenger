"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card" role="alert">
        <div className="brand-mark">U</div>
        <div className="auth-title">
          <span>UTINOCHATV1</span>
          <h1>خطایی رخ داد</h1>
        </div>
        <p>اتصال یا اجرای این بخش با مشکل روبه‌رو شد. دوباره تلاش کنید.</p>
        <button className="auth-submit" type="button" onClick={() => reset()}>تلاش دوباره</button>
        <a className="auth-switch" href="/">بازگشت به صفحه ورود</a>
      </section>
    </main>
  );
}
