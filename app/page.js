"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const AUTH_EMAIL_DOMAIN = "messenger.local"; // ایمیل ساختگی داخلی، فقط برای Supabase Auth
const AVATAR_COLORS = ["#a9782e", "#4f6f8a", "#4f8a5b", "#8a4f7a", "#b3453f", "#3f8a86"];

function usernameToEmail(u) {
  return `${u.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

function mapAuthError(err) {
  const m = (err?.message || "").toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "این نام کاربری قبلاً ثبت شده.";
  if (m.includes("password") && m.includes("6")) return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  if (m.includes("invalid login credentials")) return "نام کاربری یا رمز عبور اشتباه است.";
  return err?.message || "خطایی رخ داد.";
}

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialFor(name) {
  const t = (name || "").trim();
  return t ? t.charAt(0).toUpperCase() : "؟";
}

function formatClock(iso) {
  return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "امروز";
  if (sameDay(d, yesterday)) return "دیروز";
  return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

function IconSend(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 4 3 11.5l6.5 2.2M20 4l-6.7 16-3.8-8.3M20 4 9.7 13.9" />
    </svg>
  );
}
function IconAttach(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 6.5 8.6 14.4a3 3 0 1 0 4.2 4.2l8-8a5 5 0 1 0-7-7l-8 8a1 1 0 0 0 1.4 1.4l7.6-7.6" />
    </svg>
  );
}
function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}
function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}
function IconLink(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.6 4.9a3.6 3.6 0 1 1 5.1 5.1L16 11.6" />
      <path d="M13 17.5 11.4 19.1a3.6 3.6 0 1 1-5.1-5.1L8 12.4" />
    </svg>
  );
}
function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 6 15 12 9 18" />
    </svg>
  );
}
function IconLogout(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" />
      <path d="M10 12h10m0 0-3-3m3 3-3 3" />
    </svg>
  );
}
function IconMoon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}
function IconSun(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}
function IconDoubleCheck(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m1 12 4.2 4.2L14 7.4" />
      <path d="m9 12 4.2 4.2L22 7.4" />
    </svg>
  );
}
function IconPaperclipFile(props) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 6.5 8.6 14.4a3 3 0 1 0 4.2 4.2l8-8a5 5 0 1 0-7-7l-8 8a1 1 0 0 0 1.4 1.4l7.6-7.6" />
    </svg>
  );
}

export default function Home() {
  const [mode, setMode] = useState("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactType, setContactType] = useState("telegram");
  const [contactValue, setContactValue] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  const [darkMode, setDarkMode] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [peerTyping, setPeerTyping] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invites, setInvites] = useState([]);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const selectedUserRef = useRef(null);
  const channelRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // خواندن کد دعوت از لینک + بازیابی نشست قبلی
  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const inv = params.get("invite");
    if (inv) {
      setInviteCode(inv);
      setMode("register");
    }
    async function restoreSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).maybeSingle();
        if (profile) setCurrentUser(profile);
      }
      setCheckingSession(false);
    }
    restoreSession();
  }, [supabase]);

  // لود مخاطبین
  useEffect(() => {
    if (!currentUser || !supabase) return;
    async function loadUsers() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, contact_type, contact_value")
        .neq("id", currentUser.id)
        .order("username");
      if (data) setUsers(data);
    }
    loadUsers();
  }, [currentUser, supabase]);

  const loadLastMessages = useCallback(async () => {
    if (!currentUser || !supabase) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false })
      .limit(300);
    if (data) {
      const map = {};
      data.forEach((m) => {
        const other = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
        if (!map[other]) map[other] = m;
      });
      setLastMessages(map);
    }
  }, [currentUser, supabase]);

  const loadUnreadCounts = useCallback(async () => {
    if (!currentUser || !supabase) return;
    const { data } = await supabase.from("messages").select("sender_id").eq("receiver_id", currentUser.id).is("read_at", null);
    if (data) {
      const counts = {};
      data.forEach((m) => {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  }, [currentUser, supabase]);

  // inbox زنده: آخرین پیام‌ها + تعداد نخوانده صرف‌نظر از مکالمه‌ی باز
  useEffect(() => {
    if (!currentUser || !supabase) return;
    loadLastMessages();
    loadUnreadCounts();

    const inbox = supabase
      .channel(`inbox-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${currentUser.id}` },
        (payload) => {
          const msg = payload.new;
          setLastMessages((prev) => ({ ...prev, [msg.sender_id]: msg }));
          if (selectedUserRef.current?.id !== msg.sender_id) {
            setUnreadCounts((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(inbox);
  }, [currentUser, supabase, loadLastMessages, loadUnreadCounts]);

  // حضور آنلاین (Presence)
  useEffect(() => {
    if (!currentUser || !supabase) return;
    const presence = supabase.channel("online-users", { config: { presence: { key: currentUser.id } } });
    presence
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(new Set(Object.keys(presence.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({ online_at: new Date().toISOString() });
        }
      });
    return () => supabase.removeChannel(presence);
  }, [currentUser, supabase]);

  // پیام‌های مکالمه‌ی باز + realtime + تایپینگ
  useEffect(() => {
    if (!currentUser || !selectedUser || !supabase) {
      setMessages([]);
      return;
    }
    setPeerTyping(false);

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });
      if (!error && data) {
        setMessages(data);
        const unreadIds = data.filter((m) => m.receiver_id === currentUser.id && !m.read_at).map((m) => m.id);
        if (unreadIds.length) {
          await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
          setUnreadCounts((prev) => ({ ...prev, [selectedUser.id]: 0 }));
        }
      }
    }
    loadMessages();

    const channel = supabase
      .channel(`chat-${currentUser.id}-${selectedUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const msg = payload.new;
          const isRelevant =
            (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id);
          if (isRelevant) {
            setMessages((prev) => [...prev, msg]);
            if (msg.sender_id === selectedUser.id) {
              supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", msg.id).then(() => {});
            }
          }
        }
        if (payload.eventType === "UPDATE") {
          setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.from === selectedUser.id) {
          setPeerTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 2500);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentUser, selectedUser, supabase]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { from: currentUser.id } });
  }

  async function register() {
    if (!username || !password || !displayName) {
      setMessage("نام کاربری، نام نمایشی و رمز عبور الزامی است.");
      return;
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage("نام کاربری فقط حروف انگلیسی، عدد و _ (حداقل ۳ کاراکتر)");
      return;
    }
    if (password.length < 6) {
      setMessage("رمز عبور حداقل ۶ کاراکتر");
      return;
    }
    if (!supabase) {
      setMessage("اتصال به Supabase برقرار نیست.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { data, error } = await supabase.auth.signUp({ email: usernameToEmail(username), password });
        if (error) {
          setMessage(mapAuthError(error));
          return;
        }
        session = data.session;
        if (!session) {
          setMessage("حساب ساخته شد ولی نشست فعال نیست. گزینه‌ی Confirm email را در تنظیمات Supabase غیرفعال کنید.");
          return;
        }
      }
      const { data: profile, error: rpcError } = await supabase.rpc("redeem_invite", {
        invite_code: inviteCode ? inviteCode.trim() : null,
        p_username: username.toLowerCase(),
        p_display_name: displayName,
        p_contact_type: contactType,
        p_contact_value: contactValue || null
      });
      if (rpcError) {
        setMessage(rpcError.message);
        return;
      }
      setMessage("");
      setCurrentUser(profile);
    } catch {
      setMessage("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    const loginName = loginUsername.trim();
    if (!loginName || !password) {
      setMessage("نام کاربری و رمز عبور را وارد کنید.");
      return;
    }
    if (!supabase) {
      setMessage("اتصال به Supabase برقرار نیست.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(loginName), password });
      if (error || !data.session) {
        setMessage("نام کاربری یا رمز عبور اشتباه است.");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).maybeSingle();
      if (!profile) {
        setMessage("ثبت‌نام شما کامل نشده. کد دعوت را وارد و ثبت‌نام را کامل کنید.");
        setMode("register");
        return;
      }
      setCurrentUser(profile);
      setMessage("");
      setPassword("");
      setLoginUsername("");
    } catch {
      setMessage("خطایی رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setSelectedUser(null);
    setMessages([]);
    setUsers([]);
    setLastMessages({});
    setUnreadCounts({});
    setMobileChatOpen(false);
    setMode("login");
  }

  function openConversation(u) {
    setSelectedUser(u);
    setMobileChatOpen(true);
    setUnreadCounts((prev) => ({ ...prev, [u.id]: 0 }));
  }

  async function sendMessage() {
    const content = newMessage.trim();
    if (!content || !currentUser || !selectedUser || !supabase) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ sender_id: currentUser.id, receiver_id: selectedUser.id, content })
        .select()
        .single();
      if (error) {
        alert("خطا در ارسال: " + error.message);
        return;
      }
      setNewMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (data) setLastMessages((prev) => ({ ...prev, [selectedUser.id]: data }));
    } catch {
      alert("خطا در ارسال");
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !selectedUser || !supabase) return;
    setSending(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName);
      const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({ sender_id: currentUser.id, receiver_id: selectedUser.id, content: file.name, file_url: urlData.publicUrl, file_type: fileType })
        .select()
        .single();
      if (insertError) throw insertError;
      if (data) setLastMessages((prev) => ({ ...prev, [selectedUser.id]: data }));
    } catch (err) {
      alert("خطا در آپلود فایل: " + (err.message || "مشکل ناشناخته"));
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function addReaction(msgId, emoji) {
    if (!supabase || !currentUser) return;
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(currentUser.username)) {
      reactions[emoji] = reactions[emoji].filter((u) => u !== currentUser.username);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(currentUser.username);
    }
    await supabase.from("messages").update({ reactions }).eq("id", msgId);
  }

  async function loadInvites() {
    if (!supabase || !currentUser) return;
    const { data } = await supabase.from("invites").select("*").eq("created_by", currentUser.id).order("created_at", { ascending: false });
    if (data) setInvites(data);
  }

  function openInviteModal() {
    setShowInviteModal(true);
    loadInvites();
  }

  async function createInvite() {
    if (!supabase || !currentUser) return;
    setCreatingInvite(true);
    try {
      const { data, error } = await supabase.from("invites").insert({ created_by: currentUser.id }).select().single();
      if (error) {
        alert("خطا در ساخت دعوت: " + error.message);
        return;
      }
      setInvites((prev) => [data, ...prev]);
    } finally {
      setCreatingInvite(false);
    }
  }

  function inviteLinkFor(code) {
    return `${window.location.origin}${window.location.pathname}?invite=${code}`;
  }

  async function copyInvite(code) {
    try {
      await navigator.clipboard.writeText(inviteLinkFor(code));
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch {
      // کپی خودکار در این مرورگر پشتیبانی نشد
    }
  }

  function handleComposerInput(e) {
    setNewMessage(e.target.value);
    notifyTyping();
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }

  function handleComposerKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? users.filter((u) => (u.display_name || "").toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
      : users;
    return [...list].sort((a, b) => {
      const ta = lastMessages[a.id]?.created_at ? new Date(lastMessages[a.id].created_at).getTime() : 0;
      const tb = lastMessages[b.id]?.created_at ? new Date(lastMessages[b.id].created_at).getTime() : 0;
      return tb - ta;
    });
  }, [users, searchQuery, lastMessages]);

  let content;

  if (checkingSession) {
    content = (
      <main className="splash">
        <span className="brand-mark">Private Messenger</span>
      </main>
    );
  } else if (!supabase) {
    content = (
      <main className="splash">
        <p className="splash-error">متغیرهای محیطی NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY تنظیم نشده‌اند.</p>
      </main>
    );
  } else if (currentUser) {
    content = (
      <div className={`shell ${mobileChatOpen ? "mobile-chat" : "mobile-list"}`}>
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="me">
              <span className="avatar" style={{ background: colorForId(currentUser.id) }}>
                {initialFor(currentUser.display_name || currentUser.username)}
              </span>
              <div>
                <div className="me-name">{currentUser.display_name || currentUser.username}</div>
                <div className="me-username">@{currentUser.username}</div>
              </div>
            </div>
            <div className="sidebar-actions">
              <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} aria-label="تغییر پوسته">
                {darkMode ? <IconSun /> : <IconMoon />}
              </button>
              <button className="icon-btn" onClick={logout} aria-label="خروج">
                <IconLogout />
              </button>
            </div>
          </div>

          <button className="invite-trigger" onClick={openInviteModal}>
            <IconLink /> دعوت کاربر جدید
          </button>

          <div className="search-box">
            <IconSearch />
            <input placeholder="جستجوی مخاطب" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="contact-list">
            {filteredUsers.length === 0 ? (
              <div className="empty-note">{users.length === 0 ? "هنوز کاربری عضو نشده" : "نتیجه‌ای پیدا نشد"}</div>
            ) : (
              filteredUsers.map((u) => {
                const last = lastMessages[u.id];
                const unread = unreadCounts[u.id] || 0;
                const isOnline = onlineIds.has(u.id);
                return (
                  <button key={u.id} className={`contact-row ${selectedUser?.id === u.id ? "active" : ""}`} onClick={() => openConversation(u)}>
                    <span className="avatar-wrap">
                      <span className="avatar" style={{ background: colorForId(u.id) }}>
                        {initialFor(u.display_name || u.username)}
                      </span>
                      {isOnline && <span className="online-dot" />}
                    </span>
                    <span className="contact-info">
                      <span className="contact-top">
                        <span className="contact-name">{u.display_name || u.username}</span>
                        {last && <span className="contact-time">{formatClock(last.created_at)}</span>}
                      </span>
                      <span className="contact-bottom">
                        <span className="contact-preview">{last ? (last.file_url ? "📎 فایل" : last.content) : "هنوز پیامی نیست"}</span>
                        {unread > 0 && <span className="unread-badge">{unread}</span>}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="sidebar-footer">
            ساخته شده توسط{" "}
            <a href="https://iparham.com" target="_blank" rel="noopener">
              پرهام سلیمانی
            </a>
          </div>
        </aside>

        <section className="conversation">
          {selectedUser ? (
            <>
              <header className="conv-header">
                <button className="icon-btn back-btn" onClick={() => setMobileChatOpen(false)} aria-label="بازگشت">
                  <IconBack />
                </button>
                <span className="avatar-wrap">
                  <span className="avatar" style={{ background: colorForId(selectedUser.id) }}>
                    {initialFor(selectedUser.display_name || selectedUser.username)}
                  </span>
                  {onlineIds.has(selectedUser.id) && <span className="online-dot" />}
                </span>
                <div className="conv-title">
                  <div className="conv-name">{selectedUser.display_name || selectedUser.username}</div>
                  <div className="conv-status">
                    {peerTyping
                      ? "در حال تایپ…"
                      : onlineIds.has(selectedUser.id)
                      ? "آنلاین"
                      : selectedUser.contact_value
                      ? `${selectedUser.contact_type === "telegram" ? "تلگرام" : selectedUser.contact_type === "email" ? "ایمیل" : "تلفن"}: ${selectedUser.contact_value}`
                      : ""}
                  </div>
                </div>
              </header>

              <div className="message-list">
                {messages.length === 0 && <div className="empty-note center">هنوز پیامی نیست. اولین پیام را بفرستید.</div>}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id;
                  const prev = messages[idx - 1];
                  const showDayLabel = !prev || formatDayLabel(prev.created_at) !== formatDayLabel(msg.created_at);
                  const reactions = msg.reactions || {};
                  return (
                    <div key={msg.id}>
                      {showDayLabel && (
                        <div className="day-divider">
                          <span>{formatDayLabel(msg.created_at)}</span>
                        </div>
                      )}
                      <div className={`bubble-row ${isMe ? "mine" : ""}`}>
                        <div className="bubble">
                          {msg.file_url && msg.file_type === "image" && <img src={msg.file_url} alt="" className="bubble-media" />}
                          {msg.file_url && msg.file_type === "video" && <video src={msg.file_url} controls className="bubble-media" />}
                          {msg.file_url && msg.file_type === "file" && (
                            <a href={msg.file_url} target="_blank" rel="noopener" className="bubble-file">
                              <IconPaperclipFile /> {msg.content}
                            </a>
                          )}
                          {!msg.file_url && <span className="bubble-text">{msg.content}</span>}

                          {Object.keys(reactions).length > 0 && (
                            <div className="reactions">
                              {Object.entries(reactions).map(([emoji, reactedUsers]) => (
                                <button key={emoji} className="reaction-chip" onClick={() => addReaction(msg.id, emoji)}>
                                  {emoji} {reactedUsers.length}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="bubble-meta">
                            <span>{formatClock(msg.created_at)}</span>
                            {isMe && <span className="ticks">{msg.read_at ? <IconDoubleCheck /> : <IconCheck />}</span>}
                          </div>
                        </div>
                        <div className="quick-reactions">
                          {["👍", "❤️", "😂", "🔥"].map((emoji) => (
                            <button key={emoji} onClick={() => addReaction(msg.id, emoji)}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {peerTyping && (
                  <div className="bubble-row">
                    <div className="bubble typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="composer">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.zip" />
                <button className="icon-btn composer-attach" onClick={() => fileInputRef.current?.click()} aria-label="پیوست فایل">
                  <IconAttach />
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="پیام بنویسید…"
                  value={newMessage}
                  onChange={handleComposerInput}
                  onKeyDown={handleComposerKeyDown}
                />
                <button className="send-btn" onClick={sendMessage} disabled={sending || !newMessage.trim()} aria-label="ارسال">
                  <IconSend />
                </button>
              </div>
            </>
          ) : (
            <div className="empty-note center full">یک مخاطب را برای شروع گفتگو انتخاب کنید</div>
          )}
        </section>

        {showInviteModal && (
          <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>دعوت کاربر جدید</h2>
                <button className="icon-btn" onClick={() => setShowInviteModal(false)} aria-label="بستن">
                  <IconClose />
                </button>
              </div>
              <p className="modal-desc">یک لینک دعوت یک‌بارمصرف بسازید و برای فرد موردنظر بفرستید. هر لینک تا ۷ روز معتبر است.</p>
              <button className="mainButton" onClick={createInvite} disabled={creatingInvite}>
                {creatingInvite ? "در حال ساخت…" : "+ ساخت لینک دعوت جدید"}
              </button>
              <div className="invite-list">
                {invites.length === 0 && <div className="empty-note">هنوز دعوتی نساخته‌اید</div>}
                {invites.map((inv) => {
                  const used = !!inv.used_by;
                  const expired = new Date(inv.expires_at) < new Date();
                  return (
                    <div key={inv.id} className="invite-row">
                      <div className="invite-code">{inv.code}</div>
                      <div className={`invite-status ${used ? "used" : expired ? "expired" : "active"}`}>
                        {used ? "استفاده‌شده" : expired ? "منقضی‌شده" : "فعال"}
                      </div>
                      {!used && !expired && (
                        <button className="copy-btn" onClick={() => copyInvite(inv.code)}>
                          {copiedCode === inv.code ? "کپی شد ✓" : "کپی لینک"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <main className="auth-shell">
        <div className="auth-hero">
          <span className="brand-mark">Private Messenger</span>
          <h1>پیام‌رسان خصوصی</h1>
          <p>یک فضای بسته و امن، فقط برای افرادی که دعوت می‌کنید.</p>
          <div className="seal" aria-hidden="true">
            <span className="seal-ring" />
            <span className="seal-ring seal-ring-2" />
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              ورود
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              ثبت‌نام
            </button>
          </div>

          {mode === "login" ? (
            <div className="form">
              <label>
                نام کاربری
                <input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="نام کاربری" />
              </label>
              <label>
                رمز عبور
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" />
              </label>
              <button className="mainButton" onClick={login} disabled={loading}>
                {loading ? "در حال ورود…" : "ورود به حساب"}
              </button>
            </div>
          ) : (
            <div className="form">
              <label>
                کد دعوت <span className="hint">(اولین کاربر خالی بگذارد)</span>
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="کد دعوت" />
              </label>
              <label>
                نام کاربری (انگلیسی)
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="مثلاً parham" />
              </label>
              <label>
                نام نمایشی
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="مثلاً پرهام سلیمانی" />
              </label>
              <label>
                راه ارتباطی
                <div className="inline-fields">
                  <select value={contactType} onChange={(e) => setContactType(e.target.value)}>
                    <option value="telegram">تلگرام</option>
                    <option value="email">ایمیل</option>
                    <option value="phone">تلفن</option>
                  </select>
                  <input
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={contactType === "telegram" ? "@username" : contactType === "email" ? "email@example.com" : "09xxxxxxxxx"}
                  />
                </div>
              </label>
              <label>
                رمز عبور
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" />
              </label>
              <button className="mainButton" onClick={register} disabled={loading}>
                {loading ? "در حال ثبت‌نام…" : "ساخت حساب"}
              </button>
            </div>
          )}

          {message && <div className="form-message">{message}</div>}

          <div className="auth-footer">
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? (
                <>
                  <IconSun /> حالت روشن
                </>
              ) : (
                <>
                  <IconMoon /> حالت تاریک
                </>
              )}
            </button>
            <span>
              ساخته شده توسط{" "}
              <a href="https://iparham.com" target="_blank" rel="noopener">
                پرهام سلیمانی
              </a>
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {content}
      <style jsx global>{`
        .splash {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--text-muted);
          padding: 24px;
          text-align: center;
        }
        .splash-error {
          max-width: 420px;
          line-height: 1.9;
        }

        .shell {
          height: 100dvh;
          display: flex;
          background: var(--bg);
        }
        .sidebar {
          width: 340px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-elevated);
          border-inline-end: 1px solid var(--border);
        }
        .sidebar-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }
        .me {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .me-name {
          font-weight: 600;
          font-size: 14px;
        }
        .me-username {
          font-size: 12px;
          color: var(--text-muted);
        }
        .sidebar-actions {
          display: flex;
          gap: 6px;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff8ec;
          font-weight: 700;
          font-size: 15px;
          flex-shrink: 0;
        }
        .avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .online-dot {
          position: absolute;
          bottom: -1px;
          left: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--online);
          border: 2px solid var(--bg-elevated);
        }
        .icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .icon-btn:hover {
          background: var(--accent-wash);
          color: var(--accent);
        }
        .back-btn {
          display: none;
        }
        .invite-trigger {
          margin: 12px 16px;
          padding: 10px;
          border-radius: 12px;
          border: 1px dashed var(--accent-soft);
          background: var(--accent-wash);
          color: var(--accent);
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }
        .invite-trigger:hover {
          background: var(--accent-soft);
          color: var(--bubble-mine-text);
        }
        .search-box {
          margin: 0 16px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 12px;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .search-box input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          color: var(--text);
          font-size: 13px;
        }
        .contact-list {
          flex: 1;
          overflow-y: auto;
        }
        .contact-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          text-align: start;
          color: var(--text);
        }
        .contact-row:hover {
          background: var(--accent-wash);
        }
        .contact-row.active {
          background: var(--accent-wash);
        }
        .contact-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .contact-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
        }
        .contact-name {
          font-weight: 600;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .contact-time {
          font-size: 11px;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .contact-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .contact-preview {
          font-size: 12.5px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .unread-badge {
          background: var(--accent);
          color: var(--bubble-mine-text);
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          flex-shrink: 0;
        }
        .empty-note {
          padding: 24px 16px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }
        .empty-note.center {
          margin-top: 40px;
        }
        .empty-note.full {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }
        .sidebar-footer {
          padding: 12px;
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
        }
        .sidebar-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }

        .conversation {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--bg);
        }
        .conv-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: var(--bg-sunken);
          color: #fff;
          border-bottom: 1px solid var(--border);
        }
        .conv-header .avatar-wrap .online-dot {
          border-color: var(--bg-sunken);
        }
        .conv-title {
          min-width: 0;
        }
        .conv-name {
          font-weight: 600;
          font-size: 14.5px;
        }
        .conv-status {
          font-size: 11.5px;
          opacity: 0.75;
        }
        .conv-header .icon-btn {
          border-color: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        .message-list {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .day-divider {
          display: flex;
          justify-content: center;
          margin: 14px 0;
        }
        .day-divider span {
          font-size: 11.5px;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          padding: 3px 12px;
          border-radius: 20px;
        }
        .bubble-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 72%;
          margin-bottom: 12px;
          animation: fadeSlideIn 0.2s ease;
        }
        .bubble-row.mine {
          align-items: flex-end;
          align-self: flex-end;
        }
        .bubble {
          background: var(--bubble-theirs);
          color: var(--text);
          padding: 10px 14px;
          border-radius: 16px 16px 16px 4px;
          box-shadow: var(--shadow-1);
          position: relative;
          border: 1px solid var(--border);
        }
        .bubble-row.mine .bubble {
          background: var(--bubble-mine);
          color: var(--bubble-mine-text);
          border-radius: 16px 16px 4px 16px;
          border-color: transparent;
        }
        .bubble-text {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 14.5px;
          line-height: 1.7;
        }
        .bubble-media {
          max-width: 100%;
          border-radius: 8px;
          margin-bottom: 6px;
          display: block;
        }
        .bubble-file {
          display: flex;
          align-items: center;
          gap: 6px;
          color: inherit;
          text-decoration: none;
          font-size: 13.5px;
        }
        .bubble-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
          margin-top: 4px;
          font-size: 10.5px;
          opacity: 0.7;
        }
        .ticks {
          display: flex;
          align-items: center;
        }
        .reactions {
          display: flex;
          gap: 4px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .reaction-chip {
          background: var(--accent-wash);
          border: none;
          border-radius: 12px;
          padding: 2px 7px;
          font-size: 11.5px;
          cursor: pointer;
          color: inherit;
        }
        .quick-reactions {
          display: flex;
          gap: 4px;
          margin-top: 3px;
        }
        .quick-reactions button {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 13px;
          opacity: 0.55;
          padding: 2px;
        }
        .quick-reactions button:hover {
          opacity: 1;
        }
        .typing-bubble {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: pulseDot 1.1s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .composer {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background: var(--bg-elevated);
        }
        .composer textarea {
          flex: 1;
          resize: none;
          max-height: 120px;
          padding: 11px 16px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          outline: none;
          font-size: 14.5px;
          line-height: 1.5;
          font-family: inherit;
        }
        .composer textarea:focus {
          border-color: var(--accent-soft);
        }
        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: var(--accent);
          color: var(--bubble-mine-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.1s ease, opacity 0.15s ease;
        }
        .send-btn:active {
          transform: scale(0.92);
        }
        .send-btn:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 8, 4, 0.5);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
        }
        .modal {
          width: 100%;
          max-width: 420px;
          background: var(--bg-elevated);
          border-radius: 20px;
          padding: 22px;
          box-shadow: var(--shadow-2);
          animation: sealReveal 0.18s ease;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .modal-header h2 {
          font-size: 17px;
          margin: 0;
        }
        .modal-desc {
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.8;
          margin: 4px 0 16px;
        }
        .invite-list {
          margin-top: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .invite-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 12.5px;
        }
        .invite-code {
          font-family: monospace;
          font-weight: 700;
          flex: 1;
        }
        .invite-status {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          color: var(--text-muted);
          background: var(--bg);
        }
        .invite-status.active {
          color: var(--online);
        }
        .invite-status.used {
          color: var(--text-muted);
        }
        .invite-status.expired {
          color: var(--danger);
        }
        .copy-btn {
          border: none;
          background: var(--accent-wash);
          color: var(--accent);
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          cursor: pointer;
        }
        .mainButton {
          height: 46px;
          border: none;
          border-radius: 12px;
          background: var(--accent);
          color: var(--bubble-mine-text);
          cursor: pointer;
          font-size: 14.5px;
          font-weight: 600;
        }
        .mainButton:hover {
          background: var(--accent-strong);
        }
        .mainButton:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .auth-shell {
          min-height: 100dvh;
          display: flex;
          background: var(--bg);
        }
        .auth-hero {
          flex: 1;
          background: var(--bg-sunken);
          color: #f4efe4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 64px;
          position: relative;
          overflow: hidden;
        }
        .auth-hero .brand-mark {
          font-size: 19px;
          color: var(--accent-soft);
          margin-bottom: 18px;
          display: block;
        }
        .auth-hero h1 {
          font-size: 40px;
          margin: 0 0 14px;
          font-weight: 800;
          max-width: 380px;
          line-height: 1.35;
        }
        .auth-hero p {
          max-width: 320px;
          color: rgba(244, 239, 228, 0.7);
          font-size: 15px;
          line-height: 1.9;
          margin: 0;
        }
        .seal {
          position: absolute;
          bottom: -60px;
          left: -60px;
          width: 220px;
          height: 220px;
        }
        .seal-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid var(--accent-soft);
          opacity: 0.35;
        }
        .seal-ring-2 {
          inset: 26px;
          opacity: 0.25;
        }
        .auth-panel {
          width: 460px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
        }
        .auth-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 13px;
          margin-bottom: 26px;
        }
        .auth-tabs button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          font-size: 13.5px;
        }
        .auth-tabs button.active {
          background: var(--accent);
          color: var(--bubble-mine-text);
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .form label {
          font-size: 12.5px;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .hint {
          font-size: 11px;
          opacity: 0.7;
        }
        .form input,
        .form select {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1px solid var(--border);
          border-radius: 11px;
          outline: none;
          font-size: 14px;
          background: var(--bg-elevated);
          color: var(--text);
        }
        .form input:focus,
        .form select:focus {
          border-color: var(--accent-soft);
        }
        .inline-fields {
          display: flex;
          gap: 8px;
        }
        .inline-fields select {
          width: 130px;
          flex-shrink: 0;
        }
        .form-message {
          margin-top: 14px;
          padding: 11px;
          border-radius: 10px;
          background: var(--accent-wash);
          color: var(--accent);
          font-size: 13px;
          text-align: center;
          line-height: 1.7;
        }
        .auth-footer {
          margin-top: 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .auth-footer a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11.5px;
        }

        @media (max-width: 860px) {
          .shell {
            position: relative;
            overflow: hidden;
          }
          .sidebar,
          .conversation {
            width: 100%;
            position: absolute;
            inset: 0;
            transition: transform 0.22s ease;
          }
          .shell.mobile-list .sidebar {
            transform: translateX(0);
          }
          .shell.mobile-list .conversation {
            transform: translateX(100%);
          }
          .shell.mobile-chat .sidebar {
            transform: translateX(-100%);
          }
          .shell.mobile-chat .conversation {
            transform: translateX(0);
          }
          .back-btn {
            display: flex;
          }
          .auth-hero {
            display: none;
          }
          .auth-panel {
            width: 100%;
            padding: 40px 24px;
          }
        }
      `}</style>
    </>
  );
}

