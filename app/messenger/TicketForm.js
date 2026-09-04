"use client";

import { useState } from "react";
import { db } from "../lib/supabase-client";
import mapError from "../lib/error-map";

export default function TicketForm({ onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();
    if (!cleanSubject || !cleanBody) return;
    if (cleanSubject.length > 160 || cleanBody.length > 4000) {
      setError(mapError("invalid_message", "fa"));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { data: { user }, error: userError } = await db.auth.getUser();
      if (userError || !user) {
        setError(mapError(userError || "not_authenticated", "fa"));
        return;
      }

      const { data: ticket, error: ticketError } = await db
        .from("support_tickets")
        .insert({ user_id: user.id, subject: cleanSubject, status: "open", priority: "normal" })
        .select("id")
        .single();
      if (ticketError) {
        setError(mapError(ticketError, "fa"));
        return;
      }

      const { error: messageError } = await db
        .from("support_ticket_messages")
        .insert({ ticket_id: ticket.id, sender_id: user.id, content: cleanBody });
      if (messageError) {
        setError(mapError(messageError, "fa"));
        return;
      }

      setDone(true);
    } catch (requestError) {
      setError(mapError(requestError, "fa"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="uc-ticket-success" dir="rtl">
        <h3>تیکت ثبت شد ✓</h3>
        <p>درخواستت برای پشتیبانی ارسال شد.</p>
        <button type="button" onClick={onClose}>بستن</button>
      </div>
    );
  }

  return (
    <form className="uc-ticket-form" dir="rtl" onSubmit={submit}>
      <label>
        موضوع
        <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} required />
      </label>
      <label>
        توضیحات
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} required placeholder="مشکل یا درخواستت را بنویس..." />
      </label>
      {error && <div className="uc-error" role="alert">{error}</div>}
      <div className="uc-modal-actions">
        <button type="button" onClick={onClose} disabled={busy}>لغو</button>
        <button className="primary" type="submit" disabled={busy || !subject.trim() || !body.trim()}>{busy ? "در حال ارسال…" : "ثبت تیکت"}</button>
      </div>
    </form>
  );
}
