"use client";

import { useState } from "react";
import mapError from "../lib/error-map";

const MAX_SUBJECT = 120;
const MAX_BODY = 4000;

export default function TicketForm({ onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const cleanSubject = subject.trim();
    const cleanBody = body.trim();

    if (cleanSubject.length < 3 || cleanSubject.length > MAX_SUBJECT) {
      setError("موضوع تیکت باید بین ۳ تا ۱۲۰ کاراکتر باشد.");
      return;
    }
    if (!cleanBody || cleanBody.length > MAX_BODY) {
      setError("توضیحات تیکت را وارد کنید و حداکثر ۴۰۰۰ کاراکتر باشد.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { data, error: requestError } = await db.rpc("create_support_ticket", {
        p_subject: cleanSubject,
        p_content: cleanBody,
      });

      if (requestError) throw requestError;
      if (!data) throw new Error("ticket_creation_failed");
      setTicketId(data);
    } catch (requestError) {
      setError(mapError(requestError, "fa"));
    } finally {
      setBusy(false);
    }
  }

  if (ticketId) {
    return (
      <div className="uc-ticket-success" dir="rtl">
        <div className="uc-ticket-success-icon" aria-hidden="true">✓</div>
        <h3>تیکت با موفقیت ثبت شد</h3>
        <p>درخواست شما برای پشتیبانی ارسال شد و در صف بررسی قرار گرفت.</p>
        <div className="uc-ticket-id">
          <span>شناسه تیکت</span>
          <code>{ticketId}</code>
        </div>
        <button type="button" className="primary" onClick={onClose}>بازگشت به پشتیبانی</button>
      </div>
    );
  }

  const subjectCount = subject.trim().length;
  const bodyCount = body.length;

  return (
    <form className="uc-ticket-form" dir="rtl" onSubmit={submit}>
      <div className="uc-ticket-intro">
        <strong>درخواست پشتیبانی</strong>
        <span>موضوع و توضیح مشکل را وارد کنید. تیم پشتیبانی از همین تیکت پاسخ می‌دهد.</span>
      </div>

      <label>
        <span>موضوع</span>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={MAX_SUBJECT}
          placeholder="مثلاً مشکل ورود به حساب"
          autoComplete="off"
          required
        />
        <small>{subjectCount}/{MAX_SUBJECT}</small>
      </label>

      <label>
        <span>توضیحات</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MAX_BODY}
          placeholder="مشکل یا درخواست خود را با جزئیات بنویسید..."
          rows={7}
          required
        />
        <small>{bodyCount}/{MAX_BODY}</small>
      </label>

      {error && <div className="uc-error" role="alert">{error}</div>}

      <div className="uc-modal-actions">
        <button type="button" onClick={onClose} disabled={busy}>انصراف</button>
        <button className="primary" type="submit" disabled={busy || subject.trim().length < 3 || !body.trim()}>
          {busy ? "در حال ثبت…" : "ثبت تیکت"}
        </button>
      </div>
    </form>
  );
}
