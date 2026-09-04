"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./v1.css";

const db = createClient(
  "https://jcblfgrcsgbdeamogzfc.supabase.co",
  "sb_publishable_9qBGewmR-UHx6Pc3_Gl36Q_7WhHCw2K",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const MAX_MESSAGE_LENGTH = 4000;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const BUCKET = "chat-files";

const copy = {
  fa: {
    brand: "Utino Chat v1", chats: "گفت‌وگوها", search: "جستجوی کاربر یا شناسه عمومی", newGroup: "گروه جدید",
    support: "پشتیبانی", profile: "پروفایل", admin: "مدیریت", settings: "تنظیمات", logout: "خروج",
    start: "یک گفت‌وگو را شروع کنید", choose: "از جستجو یک کاربر را انتخاب کنید یا گروه بسازید.",
    message: "پیام", mention: "منشن", write: "پیامت را بنویسید...", send: "ارسال", attach: "پیوست",
    noMessages: "هنوز پیامی نیست", members: "عضو", addMember: "افزودن عضو", leave: "خروج از گروه",
    create: "ساخت گروه", cancel: "لغو", groupName: "نام گروه", selectMembers: "اعضای گروه را انتخاب کنید",
    readers: "دیده شده توسط", seen: "دیده شد", online: "آنلاین", back: "بازگشت", close: "بستن",
    supportOfficial: "پشتیبانی رسمی", creator: "ساخته شده توسط پرهام سلیمانی", verified: "حساب تأیید شده",
    contact: "راه ارتباطی", telegram: "تلگرام", utino: "یوتینو", website: "iParham", adminHint: "پنل مدیریت",
    emptySearch: "کاربری پیدا نشد", file: "فایل", loading: "در حال بارگذاری...", error: "خطایی رخ داد.",
    tooLarge: "حجم فایل بیشتر از ۱۵ مگابایت است.", tooLong: "پیام بیشتر از ۴۰۰۰ کاراکتر نمی‌تواند باشد.",
    groupCreated: "گروه ساخته شد", leaveConfirm: "از این گروه خارج می‌شوید؟", theme: "ظاهر", dark: "تیره", light: "روشن"
  },
  en: {
    brand: "Utino Chat v1", chats: "Chats", search: "Search user or public ID", newGroup: "New group",
    support: "Support", profile: "Profile", admin: "Admin", settings: "Settings", logout: "Sign out",
    start: "Start a conversation", choose: "Choose a user from search or create a group.",
    message: "Message", mention: "Mention", write: "Write a message...", send: "Send", attach: "Attach",
    noMessages: "No messages yet", members: "members", addMember: "Add member", leave: "Leave group",
    create: "Create group", cancel: "Cancel", groupName: "Group name", selectMembers: "Select group members",
    readers: "Seen by", seen: "Seen", online: "Online", back: "Back", close: "Close",
    supportOfficial: "Official support", creator: "Created by Parham Soleimani", verified: "Verified account",
    contact: "Contact", telegram: "Telegram", utino: "Utino", website: "iParham", adminHint: "Admin panel",
    emptySearch: "No users found", file: "File", loading: "Loading...", error: "Something went wrong.",
    tooLarge: "File is larger than 15 MB.", tooLong: "Messages cannot exceed 4000 characters.",
    groupCreated: "Group created", leaveConfirm: "Leave this group?", theme: "Theme", dark: "Dark", light: "Light"
  }
};

function Icon({ name, size = 20 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    paperclip: <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.5-8.5"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6"/>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    shield: <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"/>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-5"/></>,
    external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    hash: <><path d="M10 3 8 21M16 3l-2 18M4 9h17M3 15h17"/></>,
    check2: <><path d="m2 12 4 4L16 6"/><path d="m10 12 4 4L24 6"/></>
  };
  return <svg {...p}>{paths[name] || paths.user}</svg>;
}

function Avatar({ user, group = false, size = "md" }) {
  const label = group ? "U" : ((user?.display_name || user?.username || "U").trim().slice(0, 1).toUpperCase());
  return <div className={`uc-avatar uc-avatar-${size} ${group ? "uc-avatar-group" : ""}`}>{label}</div>;
}

function timeOf(value, lang) {
  try { return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch { return ""; }
}

function dateLabel(value, lang) {
  try { return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" }).format(new Date(value)); } catch { return ""; }
}

export default function ChatWorkspace() {
  const [lang, setLang] = useState("fa");
  const [dark, setDark] = useState(true);
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reads, setReads] = useState([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSelection, setGroupSelection] = useState([]);
  const [readerOpen, setReaderOpen] = useState(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(true);
  const [signedFiles, setSignedFiles] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const t = copy[lang];

  useEffect(() => {
    try {
      const l = localStorage.getItem("messenger-language");
      const th = localStorage.getItem("messenger-theme");
      if (l === "fa" || l === "en") setLang(l);
      if (th === "light" || th === "dark") setDark(th === "dark");
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("messenger-language", lang); localStorage.setItem("messenger-theme", dark ? "dark" : "light"); } catch {} }, [lang, dark]);

  const loadUsers = useCallback(async () => {
    const { data, error: e } = await db.from("profiles").select("id,username,display_name,public_id,contact_type,contact_value,role,is_verified").order("username", { ascending: true }).limit(1000);
    if (!e) setUsers((data || []).filter(u => u.id !== session?.user?.id));
  }, [session?.user?.id]);

  const loadConversations = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data: cm, error: ce } = await db.from("conversation_members").select("conversation_id,user_id,role,left_at").eq("user_id", session.user.id).is("left_at", null);
    if (ce) { setError(t.error); return; }
    const ids = (cm || []).map(x => x.conversation_id);
    if (!ids.length) { setConversations([]); setMembers({}); return; }
    const [{ data: cs }, { data: ms }] = await Promise.all([
      db.from("conversations").select("id,type,title,created_by,created_at").in("id", ids),
      db.from("conversation_members").select("conversation_id,user_id,role,left_at").in("conversation_id", ids).is("left_at", null)
    ]);
    const allUserIds = [...new Set((ms || []).map(x => x.user_id))];
    const { data: ps } = allUserIds.length ? await db.from("profiles").select("id,username,display_name,public_id,is_verified,role").in("id", allUserIds) : { data: [] };
    const map = Object.fromEntries((ps || []).map(x => [x.id, x]));
    const mm = {};
    (ms || []).forEach(x => { (mm[x.conversation_id] ||= []).push({ ...x, profile: map[x.user_id] }); });
    setMembers(mm);
    const lastMap = {};
    const { data: lastMessages } = await db.from("messages").select("id,conversation_id,content,file_name,created_at,sender_id,message_type").in("conversation_id", ids).order("created_at", { ascending: false }).limit(Math.min(ids.length * 5, 500));
    (lastMessages || []).forEach(m => { if (!lastMap[m.conversation_id]) lastMap[m.conversation_id] = m; });
    const sorted = (cs || []).map(c => ({ ...c, last: lastMap[c.id], memberList: mm[c.id] || [] })).sort((a, b) => new Date(b.last?.created_at || b.created_at) - new Date(a.last?.created_at || a.created_at));
    setConversations(sorted);
    if (selectedId && !sorted.some(c => c.id === selectedId)) setSelectedId(null);
  }, [session?.user?.id, selectedId, t.error]);

  const loadSelected = useCallback(async (id) => {
    if (!id) { setMessages([]); setReads([]); return; }
    const { data, error: e } = await db.from("messages").select("id,conversation_id,sender_id,receiver_id,content,file_url,file_type,file_name,message_type,created_at,reactions").eq("conversation_id", id).order("created_at", { ascending: true }).limit(1000);
    if (e) { setError(t.error); return; }
    setMessages(data || []);
    const mids = (data || []).map(m => m.id);
    if (mids.length) {
      const { data: r } = await db.from("message_reads").select("message_id,user_id,seen_at").in("message_id", mids);
      setReads(r || []);
      await db.rpc("mark_messages_seen", { message_ids: mids });
    } else setReads([]);
  }, [t.error]);

  const boot = useCallback(async () => {
    setLoading(true); setError("");
    const { data, error: e } = await db.auth.getSession();
    if (e || !data?.session) { window.location.replace("/"); return; }
    setSession(data.session);
    const { data: p, error: pe } = await db.from("profiles").select("id,username,display_name,public_id,contact_type,contact_value,role,is_verified,is_banned").eq("id", data.session.user.id).maybeSingle();
    if (pe || p?.is_banned) { await db.auth.signOut(); window.location.replace("/"); return; }
    setMe(p || null);
    setLoading(false);
  }, []);

  useEffect(() => { boot(); const { data } = db.auth.onAuthStateChange((_e, s) => { if (!s) window.location.replace("/"); }); return () => data?.subscription?.unsubscribe(); }, [boot]);
  useEffect(() => { if (session) { loadUsers(); loadConversations(); } }, [session, loadUsers, loadConversations]);
  useEffect(() => { loadSelected(selectedId); setReaderOpen(null); setMembersOpen(false); }, [selectedId, loadSelected]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  useEffect(() => {
    if (!session) return;
    const channel = db.channel("utino-chat-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, payload => {
        const cid = payload.new?.conversation_id || payload.old?.conversation_id;
        if (cid === selectedId) loadSelected(cid);
        loadConversations();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reads" }, payload => {
        const mid = payload.new?.message_id || payload.old?.message_id;
        if (mid && messages.some(m => m.id === mid)) {
          db.from("message_reads").select("message_id,user_id,seen_at").in("message_id", messages.map(m => m.id)).then(({ data }) => setReads(data || []));
        }
      })
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [session, selectedId, loadSelected, loadConversations, messages]);

  const selected = conversations.find(c => c.id === selectedId) || null;
  const selectedMembers = selected ? (members[selected.id] || []) : [];
  const other = selected?.type === "direct" ? selectedMembers.find(m => m.user_id !== session?.user?.id)?.profile : null;
  const title = selected?.type === "group" ? selected.title : (other?.display_name || other?.username || "");
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 12);
    return users.filter(u => `${u.username} ${u.display_name} ${u.public_id}`.toLowerCase().includes(q)).slice(0, 20);
  }, [users, search]);
  const mentionCandidates = useMemo(() => {
    const part = text.match(/@([a-z0-9_]*)$/i)?.[1]?.toLowerCase();
    if (part === undefined) return [];
    return users.filter(u => u.username.toLowerCase().startsWith(part)).slice(0, 8);
  }, [text, users]);

  async function openDirect(user) {
    setBusy(true); setError("");
    const { data, error: e } = await db.rpc("get_or_create_direct_conversation", { other_user_id: user.id });
    setBusy(false);
    if (e || !data) { setError(e?.message || t.error); return; }
    await loadConversations(); setSelectedId(data); setSearch(""); setMobileSidebar(false);
  }

  async function createGroup() {
    if (!groupName.trim() || groupSelection.length === 0) return;
    setBusy(true); setError("");
    const { data, error: e } = await db.rpc("create_group_conversation", { group_title: groupName.trim(), member_ids: groupSelection });
    setBusy(false);
    if (e || !data) { setError(e?.message || t.error); return; }
    setGroupOpen(false); setGroupName(""); setGroupSelection([]); await loadConversations(); setSelectedId(data); setMobileSidebar(false);
  }

  async function addMember(user) {
    if (!selected || selected.type !== "group") return;
    setBusy(true);
    const { error: e } = await db.rpc("add_conversation_member", { conversation_uuid: selected.id, member_uuid: user.id });
    setBusy(false);
    if (e) { setError(e.message || t.error); return; }
    setSearch(""); await loadConversations();
  }

  async function leaveGroup() {
    if (!selected || selected.type !== "group" || !window.confirm(t.leaveConfirm)) return;
    await db.rpc("leave_conversation", { conversation_uuid: selected.id });
    setSelectedId(null); await loadConversations(); setMobileSidebar(true);
  }

  async function sendMessage() {
    const value = text.trim();
    if (!value || !selected || busy) return;
    if (value.length > MAX_MESSAGE_LENGTH) { setError(t.tooLong); return; }
    setBusy(true); setError("");
    const mentions = [...value.matchAll(/@([a-z0-9_]{3,20})/gi)].map(x => x[1].toLowerCase());
    const mentionedIds = [...new Set(users.filter(u => mentions.includes(u.username.toLowerCase()) && selectedMembers.some(m => m.user_id === u.id)).map(u => u.id))];
    const payload = { conversation_id: selected.id, sender_id: session.user.id, receiver_id: selected.type === "direct" ? other?.id : null, content: value, message_type: "text", reactions: {} };
    const { data: m, error: e } = await db.from("messages").insert(payload).select("id").single();
    if (!e && m && mentionedIds.length) await db.from("message_mentions").insert(mentionedIds.map(user_id => ({ message_id: m.id, user_id })));
    setBusy(false);
    if (e) { setError(e.message || t.error); return; }
    setText(""); setMentionOpen(false); await loadSelected(selected.id); await loadConversations();
  }

  async function uploadFile(file) {
    if (!file || !selected || busy) return;
    if (file.size > MAX_FILE_SIZE) { setError(t.tooLarge); return; }
    setBusy(true); setError("");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const path = `${selected.id}/${crypto.randomUUID()}-${safe}`;
    const { error: ue } = await db.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
    if (ue) { setBusy(false); setError(ue.message || t.error); return; }
    const { error: me2 } = await db.from("messages").insert({ conversation_id: selected.id, sender_id: session.user.id, receiver_id: selected.type === "direct" ? other?.id : null, content: file.name, file_url: path, file_type: file.type || "application/octet-stream", file_name: file.name, message_type: "file", reactions: {} });
    setBusy(false);
    if (me2) setError(me2.message || t.error); else { await loadSelected(selected.id); await loadConversations(); }
  }

  async function getFileUrl(path) {
    if (!path) return "#";
    if (/^https?:\/\//i.test(path)) return path;
    if (signedFiles[path]) return signedFiles[path];
    const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (data?.signedUrl) { setSignedFiles(x => ({ ...x, [path]: data.signedUrl })); return data.signedUrl; }
    return "#";
  }

  function chooseMention(user) {
    const next = text.replace(/@[a-z0-9_]*$/i, `@${user.username} `);
    setText(next); setMentionOpen(false); inputRef.current?.focus();
  }

  async function searchAction(user, action) {
    if (action === "message") return openDirect(user);
    if (!selected) { setGroupSelection([user.id]); setGroupOpen(true); setSearch(""); return; }
    if (selected.type === "group") return addMember(user);
    setGroupSelection([other?.id, user.id].filter(Boolean)); setGroupOpen(true); setSearch("");
  }

  const readersFor = messageId => reads.filter(r => r.message_id === messageId);
  const readerProfiles = ids => ids.map(id => selectedMembers.find(m => m.user_id === id)?.profile).filter(Boolean);

  if (loading) return <div className={`uc-shell ${dark ? "is-dark" : "is-light"}`}><div className="uc-loading">{t.loading}</div></div>;

  return (
    <main className={`uc-shell ${dark ? "is-dark" : "is-light"} ${mobileSidebar ? "sidebar-open" : "sidebar-closed"}`} dir={lang === "fa" ? "rtl" : "ltr"}>
      <aside className="uc-sidebar">
        <div className="uc-sidebar-head">
          <button className="uc-brand" onClick={() => setSelectedId(null)} aria-label={t.brand}><span className="uc-brand-mark">U</span><span>{t.brand}</span></button>
          <button className="uc-icon-btn" onClick={() => setSettingsOpen(v => !v)} aria-label={t.settings}><Icon name="more" /></button>
        </div>
        <div className="uc-search-wrap"><Icon name="search" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} /></div>
        {search.trim() ? (
          <div className="uc-search-results">
            {filteredUsers.length ? filteredUsers.map(user => <div className="uc-search-card" key={user.id}><Avatar user={user}/><div className="uc-search-main"><strong>{user.display_name}</strong><span>@{user.username} · {user.public_id}</span></div><div className="uc-search-actions"><button onClick={() => searchAction(user, "message")} disabled={busy}>{t.message}</button><button onClick={() => searchAction(user, "mention")} disabled={busy}>@</button></div></div>) : <div className="uc-empty-mini">{t.emptySearch}</div>}
          </div>
        ) : null}
        <div className="uc-sidebar-tools"><button className="uc-new-group" onClick={() => setGroupOpen(true)}><Icon name="plus" size={17}/>{t.newGroup}</button></div>
        <div className="uc-section-label">{t.chats}</div>
        <div className="uc-chat-list">
          {conversations.map(c => {
            const op = c.type === "direct" ? c.memberList.find(m => m.user_id !== session.user.id)?.profile : null;
            const name = c.type === "group" ? c.title : (op?.display_name || op?.username || "");
            return <button className={`uc-chat-row ${selectedId === c.id ? "active" : ""}`} key={c.id} onClick={() => { setSelectedId(c.id); setMobileSidebar(false); }}><Avatar user={op} group={c.type === "group"}/><span className="uc-chat-copy"><strong>{name}</strong><small>{c.last?.file_name || c.last?.content || (c.type === "group" ? `${c.memberList.length} ${t.members}` : "")}</small></span><time>{c.last?.created_at ? timeOf(c.last.created_at, lang) : ""}</time></button>;
          })}
          {!conversations.length && <div className="uc-empty-list"><div className="uc-empty-icon"><Icon name="send"/></div><strong>{t.start}</strong><span>{t.choose}</span></div>}
        </div>
        <div className="uc-sidebar-foot">
          <button onClick={() => setProfileOpen(true)}><Avatar user={me} size="sm"/><span><strong>{me?.display_name || me?.username}</strong><small>@{me?.username}</small></span></button>
          <div className="uc-foot-actions"><button onClick={() => setSupportOpen(true)} aria-label={t.support}><Icon name="users" size={18}/></button>{me?.role === "admin" && <button onClick={() => window.location.href = "/admin/"} aria-label={t.admin}><Icon name="shield" size={18}/></button>}<button onClick={async () => { await db.auth.signOut(); }} aria-label={t.logout}><Icon name="logout" size={18}/></button></div>
        </div>
        {settingsOpen && <div className="uc-popover"><div className="uc-popover-title">{t.theme}</div><button onClick={() => setDark(true)} className={dark ? "selected" : ""}><Icon name="moon" size={17}/>{t.dark}</button><button onClick={() => setDark(false)} className={!dark ? "selected" : ""}><Icon name="sun" size={17}/>{t.light}</button><button onClick={() => setLang(lang === "fa" ? "en" : "fa")}>{lang === "fa" ? "English" : "فارسی"}</button></div>}
      </aside>

      <section className="uc-chat">
        {!selected ? <div className="uc-welcome"><div className="uc-welcome-mark">U</div><h1>{t.brand}</h1><p>{t.choose}</p><div className="uc-welcome-actions"><button onClick={() => inputRef.current?.focus()}>{t.message}</button><button onClick={() => setGroupOpen(true)}><Icon name="plus" size={17}/>{t.newGroup}</button></div><small>{t.creator} · <a href="https://iparham.com" target="_blank" rel="noreferrer">iparham.com</a></small></div> : (
          <>
            <header className="uc-chat-head">
              <button className="uc-mobile-back" onClick={() => setMobileSidebar(true)} aria-label={t.back}><Icon name="back"/></button>
              <Avatar user={other} group={selected.type === "group"}/>
              <button className="uc-chat-title" onClick={() => selected.type === "group" && setMembersOpen(v => !v)}><strong>{title}</strong><span>{selected.type === "group" ? `${selectedMembers.length} ${t.members}` : `@${other?.username || ""} · ${other?.public_id || ""}`}</span></button>
              <div className="uc-head-actions"><button onClick={() => setMembersOpen(v => !v)} aria-label={t.members}><Icon name={selected.type === "group" ? "users" : "user"}/></button><button onClick={() => setProfileOpen(true)} aria-label={t.profile}><Icon name="more"/></button></div>
            </header>
            <div className="uc-message-area">
              <div className="uc-day-chip">{messages[0] ? dateLabel(messages[0].created_at, lang) : ""}</div>
              {messages.length ? messages.map((m, i) => {
                const mine = m.sender_id === session.user.id;
                const sender = selectedMembers.find(x => x.user_id === m.sender_id)?.profile;
                const mr = readersFor(m.id);
                const rp = readerProfiles(mr.map(x => x.user_id));
                const prev = messages[i - 1];
                const showSender = selected.type === "group" && (!prev || prev.sender_id !== m.sender_id);
                return <div className={`uc-message-line ${mine ? "mine" : "theirs"}`} key={m.id}><div className="uc-message-wrap">{showSender && !mine && <div className="uc-message-sender">{sender?.display_name || sender?.username}</div>}<div className="uc-bubble">{m.message_type === "file" ? <FileMessage message={m} getUrl={getFileUrl} t={t}/> : <div className="uc-message-text">{m.content?.split(/(@[a-z0-9_]{3,20})/gi).map((part, idx) => /^@[a-z0-9_]{3,20}$/i.test(part) ? <span className="uc-mention" key={idx}>{part}</span> : <span key={idx}>{part}</span>)}</div>}<div className="uc-message-meta"><time>{timeOf(m.created_at, lang)}</time>{mine && <button className="uc-seen" onClick={() => setReaderOpen(readerOpen === m.id ? null : m.id)}>{selected.type === "group" ? `${t.seen} ${mr.length}/${selectedMembers.length}` : <Icon name={mr.some(x => x.user_id !== session.user.id) ? "check2" : "check"} size={15}/>}</button>}</div></div>{readerOpen === m.id && mine && <div className="uc-readers"><strong>{t.readers}</strong>{rp.length ? rp.map(p => <span key={p.id}><Avatar user={p} size="xs"/>{p.display_name}</span>) : <small>{t.seen}: 0</small>}</div>}</div></div>;
              }) : <div className="uc-no-messages"><div><Icon name="send"/></div><strong>{t.noMessages}</strong><span>{selected.type === "group" ? selected.title : other?.display_name}</span></div>}
              <div ref={endRef}/>
            </div>
            <div className="uc-composer-area">
              {error && <div className="uc-error">{error}<button onClick={() => setError("")}><Icon name="close" size={15}/></button></div>}
              {mentionOpen && mentionCandidates.length > 0 && <div className="uc-mention-menu">{mentionCandidates.map(u => <button key={u.id} onClick={() => chooseMention(u)}><Avatar user={u} size="sm"/><span><strong>{u.display_name}</strong><small>@{u.username}</small></span></button>)}</div>}
              <div className="uc-composer"><button onClick={() => fileRef.current?.click()} disabled={busy} aria-label={t.attach}><Icon name="paperclip"/></button><input ref={inputRef} value={text} onChange={e => { setText(e.target.value); setMentionOpen(/@[a-z0-9_]*$/i.test(e.target.value)); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } if (e.key === "Escape") setMentionOpen(false); }} placeholder={t.write} maxLength={MAX_MESSAGE_LENGTH}/><button className="uc-send" onClick={sendMessage} disabled={busy || !text.trim()} aria-label={t.send}><Icon name="send" size={19}/></button></div>
              <input ref={fileRef} type="file" hidden onChange={e => { uploadFile(e.target.files?.[0]); e.target.value = ""; }}/>
            </div>
          </>
        )}
      </section>

      {membersOpen && selected && <aside className="uc-drawer"><div className="uc-drawer-head"><strong>{selected.type === "group" ? selected.title : other?.display_name}</strong><button onClick={() => setMembersOpen(false)}><Icon name="close"/></button></div><div className="uc-drawer-content">{selectedMembers.map(m => <div className="uc-member-row" key={m.user_id}><Avatar user={m.profile}/><span><strong>{m.profile?.display_name}</strong><small>@{m.profile?.username} · {m.role}</small></span>{m.profile?.is_verified && <span className="uc-verified"><Icon name="check" size={13}/></span>}</div>)}{selected.type === "group" && <><div className="uc-drawer-search"><Icon name="search" size={17}/><input placeholder={t.addMember} value={search} onChange={e => setSearch(e.target.value)}/></div>{search && filteredUsers.slice(0, 8).map(u => <button className="uc-add-row" key={u.id} onClick={() => addMember(u)}><Avatar user={u}/><span>{u.display_name}<small>@{u.username}</small></span><Icon name="plus" size={17}/></button>)}<button className="uc-leave" onClick={leaveGroup}>{t.leave}</button></>}</div></aside>}

      {profileOpen && <Modal onClose={() => setProfileOpen(false)} title={t.profile}><div className="uc-profile-card"><Avatar user={me} size="lg"/><h2>{me?.display_name}</h2><p>@{me?.username}</p>{me?.is_verified && <span className="uc-badge"><Icon name="check" size={13}/>{t.verified}</span>}<div className="uc-profile-id"><span>Public ID</span><strong>{me?.public_id}</strong></div>{me?.contact_value && <div className="uc-profile-id"><span>{t.contact}</span><strong>{me.contact_value}</strong></div>}<div className="uc-profile-links"><a href="https://iparham.com" target="_blank" rel="noreferrer">{t.website}<Icon name="external" size={15}/></a></div></div></Modal>}
      {supportOpen && <Modal onClose={() => setSupportOpen(false)} title={t.supportOfficial}><div className="uc-support"><div className="uc-support-icon"><Icon name="users"/></div><h2>{t.supportOfficial}</h2><p>{t.creator}</p><a href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer"><span>{t.telegram}</span><small>@parhamsoleimanybot</small><Icon name="external" size={16}/></a><a href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer"><span>{t.utino}</span><small>utino.org/chat/supportusername</small><Icon name="external" size={16}/></a><a href="https://iparham.com" target="_blank" rel="noreferrer"><span>{t.website}</span><small>iparham.com</small><Icon name="external" size={16}/></a></div></Modal>}
      {groupOpen && <Modal onClose={() => { setGroupOpen(false); setGroupSelection([]); }} title={t.create}><div className="uc-group-form"><label>{t.groupName}<input value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={80} autoFocus/></label><div className="uc-group-label">{t.selectMembers}</div><div className="uc-selected-members">{groupSelection.map(id => { const u = users.find(x => x.id === id); return u ? <button key={id} onClick={() => setGroupSelection(x => x.filter(y => y !== id))}><Avatar user={u} size="xs"/>@{u.username}<Icon name="close" size={13}/></button> : null; })}</div><div className="uc-group-user-list">{users.filter(u => !groupSelection.includes(u.id)).slice(0, 80).map(u => <button key={u.id} onClick={() => setGroupSelection(x => [...x, u.id])}><Avatar user={u}/><span><strong>{u.display_name}</strong><small>@{u.username} · {u.public_id}</small></span><Icon name="plus" size={17}/></button>)}</div><div className="uc-modal-actions"><button onClick={() => { setGroupOpen(false); setGroupSelection([]); }}>{t.cancel}</button><button className="primary" onClick={createGroup} disabled={busy || !groupName.trim() || !groupSelection.length}>{t.create}</button></div></div></Modal>}
    </main>
  );
}

function FileMessage({ message, getUrl, t }) {
  const [url, setUrl] = useState("");
  useEffect(() => { let alive = true; getUrl(message.file_url).then(u => { if (alive) setUrl(u); }); return () => { alive = false; }; }, [message.file_url, getUrl]);
  return <a className="uc-file" href={url || "#"} target="_blank" rel="noreferrer"><div className="uc-file-icon"><Icon name="paperclip" size={19}/></div><span><strong>{message.file_name || t.file}</strong><small>{message.file_type || t.file}</small></span><Icon name="external" size={16}/></a>;
}

function Modal({ title, children, onClose }) {
  return <div className="uc-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="uc-modal" role="dialog" aria-modal="true"><header><strong>{title}</strong><button onClick={onClose} aria-label="Close"><Icon name="close"/></button></header>{children}</section></div>;
}
