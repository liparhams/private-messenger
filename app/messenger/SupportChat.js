"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/supabase-client";
import mapError from "../lib/error-map";
import TicketForm from "./TicketForm";
import "./support-chat.css";

export default function SupportChat({ onClose, embedded = false }) {
  const [session, setSession] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);

  const load = async () => {
    const { data, error: sessionError } = await db.auth.getSession();
    if (sessionError || !data.session) {
      setError(mapError(sessionError || "not_authenticated", "fa"));
      setLoading(false);
      return;
    }

    setSession(data.session);
    const { data: currentChat, error: chatError } = await db
      .from("support_chats")
      .select("id,status")
      .eq("user_id", data.session.user.id)
      .maybeSingle();
    if (chatError) {
      setError(mapError(chatError, "fa"));
      setLoading(false);
      return;
    }

    if (currentChat) {
      setChat(currentChat);
      const { data: rows, error: messageError } = await db
        .from("support_chat_messages")
        .select("id,sender_id,content,created_at")
        .eq("chat_id", currentChat.id)
        .order("created_at");
      if (messageError) setError(mapError(messageError, "fa"));
      else setMessages(rows || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!chat?.id) return undefined;
    const channel = db
      .channel(`support:${chat.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_chat_messages", filter: `chat_id=eq.${chat.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_chats", filter: `id=eq.${chat.id}` }, load)
      .subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [chat?.id]);

  const send = async () => {
    const clean = value.trim();
    if (!clean || busy || !session || clean.length > 4000) return;
    setBusy(true);
    setError("");
    try {
      let chatId = chat?.id;
      if (!chatId || chat?.status === "closed") {
        const { data: newChatId, error: createError } = await db.rpc("get_or_create_support_chat");
        if (createError) throw createError;
        chatId = newChatId;
        setChat({ id: chatId, status: "open" });
      }

      const { error: messageError } = await db
        .from("support_chat_messages")
        .insert({ chat_id: chatId, sender_id: session.user.id, content: clean });
      if (messageError) throw messageError;
      setValue("");
      await load();
    } catch (requestError) {
      setError(mapError(requestError, "fa"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="usch-card">در حال بارگذاری…</div>;

  const card = (
    <div className="usch-card" dir="rtl">
      <header>
        <div className="usch-title">
          <span className="usch-avatar">U</span>
          <div><b>پشتیبانی رسمی</b><small>@support · پاسخ‌گویی مستقیم</small></div>
        </div>
        {onClose && <button className="usch-close" type="button" onClick={onClose} aria-label="بستن">×</button>}
      </header>

      <div className="usch-body">
        {error && <div role="alert" className="usch-error">{error}</div>}
        {!messages.length && (
          <div className="usch-empty">
            <strong>پشتیبانی رسمی UTINOCHATV1</strong>
            <span>سؤال یا مشکل خود را اینجا بنویسید.</span>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`usch-msg ${message.sender_id === session?.user?.id ? "mine" : "theirs"}`}>
            {message.content}
            <time>{new Date(message.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</time>
          </div>
        ))}
        {chat?.status === "closed" && <div className="usch-ended">این گفتگو پایان یافته است. با ارسال پیام، گفتگوی جدید باز می‌شود.</div>}
      </div>

      <div className="usch-compose">
        <button type="button" className="usch-ticket-button" onClick={() => setTicketOpen(true)} aria-label="ثبت تیکت پشتیبانی">تیکت</button>
        <textarea value={value} maxLength={4000} placeholder="پیامتان را بنویسید…" onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} />
        <button type="button" onClick={send} disabled={!value.trim() || busy}>{busy ? "…" : "ارسال"}</button>
      </div>

      {ticketOpen && (
        <div className="usch-ticket-overlay" role="dialog" aria-modal="true" aria-label="ثبت تیکت" onMouseDown={(event) => event.target === event.currentTarget && setTicketOpen(false)}>
          <div className="usch-ticket-card">
            <header><strong>ثبت تیکت پشتیبانی</strong><button type="button" onClick={() => setTicketOpen(false)} aria-label="بستن">×</button></header>
            <TicketForm onClose={() => setTicketOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );

  return embedded ? card : <div className="usch-overlay">{card}</div>;
}
