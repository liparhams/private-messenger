"use client";

import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState("login");

  return (
    <main className="page">
      <div className="card">
        <div className="logo">P</div>

        <h1>Private Messenger</h1>
        <p className="subtitle">پیام‌رسان خصوصی</p>

        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            ورود
          </button>

          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            ثبت‌نام
          </button>
        </div>

        <div className="form">
          {mode === "register" && (
            <>
              <label>نام کاربری</label>
              <input placeholder="نام کاربری" />
            </>
          )}

          <label>شناسه کاربری</label>
          <input placeholder="مثلاً 102458" />

          <label>رمز عبور</label>
          <input type="password" placeholder="رمز عبور" />

          <button className="mainButton">
            {mode === "login" ? "ورود به حساب" : "ساخت حساب"}
          </button>
        </div>
      </div>
    </main>
  );
}
