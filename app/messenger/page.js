"use client";

import { useEffect, useState } from "react";
import "../utino-system.css";
import "./ux-polish.css";
import "./messenger-menu.css";
import ChatWorkspace from "./ChatWorkspace";

function MessengerMenu() {
  const [open, setOpen] = useState(false);

  function newChat() {
    setOpen(false);
    const input = document.querySelector(".uc-search-wrap input");
    input?.focus();
    input?.select();
  }

  return (
    <div className="uc-messenger-menu">
      <button className="uc-menu-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="منوی مسنجر" title="منوی مسنجر">
        <span aria-hidden="true">⋮</span>
      </button>
      {open && (
        <>
          <button className="uc-menu-scrim" type="button" aria-label="بستن منو" onClick={() => setOpen(false)} />
          <div className="uc-menu-panel" role="menu" dir="rtl">
            <div className="uc-menu-heading">UTINOCHATV1</div>
            <button className="uc-menu-item uc-menu-primary" type="button" onClick={newChat} role="menuitem">
              <span className="uc-menu-icon" aria-hidden="true">＋</span>
              <span><strong>گفتگوی جدید</strong><small>پیدا کردن کاربر و شروع چت</small></span>
            </button>
            <a className="uc-menu-item" href="/settings/" role="menuitem" onClick={() => setOpen(false)}>
              <span className="uc-menu-icon uc-menu-icon-neutral" aria-hidden="true">⚙</span>
              <span><strong>تنظیمات و پروفایل</strong><small>بیو، نام نمایشی، ظاهر و حساب</small></span>
            </a>
            <a className="uc-menu-item" href="/admin/" role="menuitem" onClick={() => setOpen(false)}>
              <span className="uc-menu-icon uc-menu-icon-neutral" aria-hidden="true">▦</span>
              <span><strong>پنل مدیریت</strong><small>فقط برای حساب‌های مجاز</small></span>
            </a>
            <div className="uc-menu-divider" />
            <a className="uc-menu-item" href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer" role="menuitem" onClick={() => setOpen(false)}>
              <span className="uc-menu-icon uc-menu-icon-neutral" aria-hidden="true">?</span>
              <span><strong>پشتیبانی</strong><small>ارتباط با پشتیبانی رسمی</small></span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function MessengerPage() {
  return (
    <>
      <MessengerMenu />
      <ChatWorkspace />
    </>
  );
}
