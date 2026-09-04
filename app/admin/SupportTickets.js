"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import mapError from "../lib/error-map";

const db = createClient(
  "https://jcblfgrcsgbdeamogzfc.supabase.co",
  "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K",
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const statusLabel = { open: "باز", pending: "در انتظار", closed: "بسته" };
const priorityLabel = { low: "کم", normal: "عادی", high: "زیاد", urgent: "فوری" };

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const { data, error: e } = await db
      .from("support_tickets")
      .select("id,user_id,subject,status,priority,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (e) {
      setError(mapError(e));
      setLoading(false);
      return;
    }

    const nextTickets = data || [];
    setTickets(nextTickets);
    const ids = [...new Set(nextTickets.map((x) => x.user_id).filter(Boolean))];
    if (ids.length) {
      const { data: profiles, error: pe } = await db.rpc("get_public_profiles", { p_user_ids: ids });
      if (pe) {
        setError(mapError(pe));
        setLoading(false);
        return;
      }
      setUsers(Object.fromEntries((profiles || []).map((x) => [x.id, x])));
    } else {
      setUsers({});
    }
    setLoading(false);
  }

  async function openTicket(ticket) {
    setSelected(ticket);
    setOpening(true);
    setError("");
    const { data, error: e } = await db
      .from("support_ticket_messages")
      .select("id,ticket_id,sender_id,content,created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    if (e) setError(mapError(e));
    else setMessages(data || []);
    setOpening(false);
  }

  async function send() {
    const value = text.trim();
    if (!selected || !value || value.length > 4000 || busy) return;
    setBusy(true);
    setError("");
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      setError(mapError("not_authenticated"));
      setBusy(false);
      return;
    }
    const { error: e } = await db
      .from("support_ticket_messages")
      .insert({ ticket_id: selected.id, sender_id: user.id, content: value });
    if (e) {
      setError(mapError(e));
    } else {
      setText("");
      await openTicket(selected);
      await load();
    }
    setBusy(false);
  }

  async function setState(status, priority = selected?.priority) {
    if (!selected || busy || !Object.keys(statusLabel).includes(status) || !Object.keys(priorityLabel).includes(priority)) return;
    setBusy(true);
    setError("");
    const { error: e } = await db.rpc("update_support_ticket", {
      ticket_uuid: selected.id,
      new_status: status,
      new_priority: priority,
    });
    if (e) {
      setError(mapError(e));
    } else {
      const next = { ...selected, status, priority, updated_at: new Date().toISOString() };
      setSelected(next);
      setTickets((current) => current.map((ticket) => ticket.id === next.id ? next : ticket));
    }
    setBusy(false);
  }

  useEffect(() => { load(); }, []);

  const filteredTickets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (!needle) return true;
      const username = users[ticket.user_id]?.username || "";
      return `${ticket.subject} ${username} ${ticket.id}`.toLowerCase().includes(needle);
    });
  }, [tickets, users, query, statusFilter]);

  const openCount = tickets.filter((x) => x.status === "open").length;
  const pendingCount = tickets.filter((x) => x.status === "pending").length;

  if (loading) return <div className="admin-card"><p>در حال بارگذاری تیکت‌ها…</p></div>;

  return (
    <div className="admin-ticket-layout">
      <div className="admin-card admin-ticket-list">
        <div className="admin-toolbar ticket-toolbar">
          <div>
            <strong>تیکت‌ها ({tickets.length})</strong>
            <small className="muted">{openCount} باز · {pendingCount} در انتظار</small>
          </div>
          <button type="button" className="admin-button" onClick={load} disabled={busy}>↻</button>
        </div>

        <div className="ticket-filters">
          <input
            className="admin-search utino-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی موضوع، کاربر یا شناسه…"
            aria-label="جستجوی تیکت"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="فیلتر وضعیت">
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="pending">در انتظار</option>
            <option value="closed">بسته</option>
          </select>
        </div>

        {error && <div className="admin-error" role="alert">{error}</div>}
        {!filteredTickets.length ? (
          <div className="ticket-list-empty">
            <b>{tickets.length ? "نتیجه‌ای پیدا نشد" : "هنوز تیکتی ثبت نشده است"}</b>
            <span>{tickets.length ? "فیلتر یا عبارت جستجو را تغییر بده." : "تیکت‌های کاربران پس از ثبت در اینجا نمایش داده می‌شوند."}</span>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <button
              type="button"
              key={ticket.id}
              className={`ticket-item ${selected?.id === ticket.id ? "active" : ""}`}
              onClick={() => openTicket(ticket)}
              disabled={opening && selected?.id === ticket.id}
            >
              <div>
                <b>{ticket.subject}</b>
                <small>@{users[ticket.user_id]?.username || "unknown"} · {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString("fa-IR")}</small>
              </div>
              <span className={`ticket-status ${ticket.status}`}>{statusLabel[ticket.status] || ticket.status}</span>
            </button>
          ))
        )}
      </div>

      {selected ? (
        <div className="admin-card admin-ticket-chat">
          <div className="ticket-head">
            <div className="ticket-title-block">
              <span className="ticket-kicker">تیکت پشتیبانی</span>
              <h2>{selected.subject}</h2>
              <p>@{users[selected.user_id]?.username || "unknown"} · اولویت {priorityLabel[selected.priority] || selected.priority}</p>
            </div>
            <div className="ticket-controls">
              <select value={selected.priority} disabled={busy} onChange={(e) => setState(selected.status, e.target.value)} aria-label="اولویت">
                <option value="low">کم</option>
                <option value="normal">عادی</option>
                <option value="high">زیاد</option>
                <option value="urgent">فوری</option>
              </select>
              <select value={selected.status} disabled={busy} onChange={(e) => setState(e.target.value)} aria-label="وضعیت">
                <option value="open">باز</option>
                <option value="pending">در انتظار</option>
                <option value="closed">بسته</option>
              </select>
            </div>
          </div>

          <div className="ticket-messages" aria-live="polite">
            {opening ? <p className="muted">در حال باز کردن گفتگو…</p> : messages.length ? messages.map((message) => (
              <div className={`ticket-message ${message.sender_id === selected.user_id ? "from-user" : "from-support"}`} key={message.id}>
                <small>{message.sender_id === selected.user_id ? "کاربر" : "پشتیبانی"} · {new Date(message.created_at).toLocaleString("fa-IR")}</small>
                <p>{message.content}</p>
              </div>
            )) : <p className="muted">هنوز پیامی در این تیکت نیست.</p>}
          </div>

          <div className="ticket-compose">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="پاسخ به کاربر… (Enter برای ارسال، Shift+Enter برای خط جدید)"
              maxLength={4000}
              disabled={busy || selected.status === "closed"}
            />
            <div className="ticket-compose-foot">
              <small>{text.length}/4000</small>
              <button type="button" className="admin-button primary" disabled={busy || selected.status === "closed" || !text.trim()} onClick={send}>
                {busy ? "در حال ارسال…" : "ارسال پاسخ"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-card ticket-empty">
          <span className="ticket-empty-icon">?</span>
          <h2>یک تیکت را انتخاب کن</h2>
          <p className="muted">از فهرست سمت راست یک درخواست را انتخاب کن تا گفتگو و عملیات مدیریت نمایش داده شود.</p>
        </div>
      )}
    </div>
  );
}
