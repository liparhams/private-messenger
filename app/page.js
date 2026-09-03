"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/*
====================================================
SUPABASE CONFIG
====================================================

این دو مقدار عمومی هستند.

URL:
Supabase Dashboard
→ Project Settings
→ API
→ Project URL

Publishable Key:
Project Settings
→ API
→ Publishable key

هرگز Secret key یا Service Role key را اینجا نگذار.
====================================================
*/

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://YOUR-PROJECT-ID.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const AUTH_EMAIL_DOMAIN = "messenger.local";

function usernameToEmail(username) {
  return `${username.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

function mapAuthError(error) {
  const message = String(error?.message || "").toLowerCase();

  if (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already registered")
  ) {
    return "این نام کاربری قبلاً ثبت شده است.";
  }

  if (
    message.includes("password") &&
    (
      message.includes("6") ||
      message.includes("8") ||
      message.includes("characters")
    )
  ) {
    return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  }

  if (message.includes("invalid login credentials")) {
    return "نام کاربری یا رمز عبور اشتباه است.";
  }

  if (message.includes("email not confirmed")) {
    return "تأیید ایمیل برای این سیستم فعال نیست. تنظیمات Auth را بررسی کن.";
  }

  return error?.message || "خطایی رخ داد.";
}

function formatTime(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function randomInviteCode() {
  return (
    Math.random().toString(36).slice(2, 8).toUpperCase() +
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
}

export default function Home() {
  const [mode, setMode] = useState("login");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);

  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");

  const [darkMode, setDarkMode] = useState(true);

  const [showProfile, setShowProfile] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const [inviteCode, setInviteCode] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [contactType, setContactType] = useState("telegram");
  const [contactValue, setContactValue] = useState("");

  const [registerInviteCode, setRegisterInviteCode] = useState("");

  const [sendingFile, setSendingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  /*
  ====================================================
  INITIAL SESSION
  ====================================================
  */

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
          await loadUsers(currentSession.user.id);
        }
      } catch (err) {
        console.error(err);
        setError("برقراری ارتباط با سرور انجام نشد.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (newSession?.user) {
        await loadProfile(newSession.user.id);
        await loadUsers(newSession.user.id);
      } else {
        setProfile(null);
        setUsers([]);
        setSelectedUser(null);
        setMessages([]);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
  ====================================================
  LOAD PROFILE
  ====================================================
  */

  async function loadProfile(userId) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);
      return;
    }

    setProfile(data);
  }

  /*
  ====================================================
  LOAD USERS
  ====================================================
  */

  async function loadUsers(userId) {
    const { data, error: usersError } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, contact_type, contact_value, created_at"
      )
      .neq("id", userId)
      .order("username", { ascending: true });

    if (usersError) {
      console.error(usersError);
      setError(usersError.message);
      return;
    }

    setUsers(data || []);
  }

  /*
  ====================================================
  SEARCH
  ====================================================
  */

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return users;

    return users.filter((user) => {
      return (
        user.username?.toLowerCase().includes(value) ||
        user.display_name?.toLowerCase().includes(value)
      );
    });
  }, [users, search]);

  /*
  ====================================================
  LOAD MESSAGES
  ====================================================
  */

  async function loadMessages(otherUser) {
    if (!session?.user || !otherUser) return;

    setSelectedUser(otherUser);

    const myId = session.user.id;
    const otherId = otherUser.id;

    const { data, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
      )
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error(messagesError);
      setError(messagesError.message);
      return;
    }

    setMessages(data || []);
  }

  /*
  ====================================================
  REALTIME
  ====================================================
  */

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel(`messages-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new;

          const isMine =
            message.sender_id === session.user.id;

          const belongsToSelected =
            selectedUser &&
            (
              (
                message.sender_id === session.user.id &&
                message.receiver_id === selectedUser.id
              ) ||
              (
                message.sender_id === selectedUser.id &&
                message.receiver_id === session.user.id
              )
            );

          if (belongsToSelected && !isMine) {
            setMessages((current) => {
              if (current.some((item) => item.id === message.id)) {
                return current;
              }

              return [...current, message];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new;

          setMessages((current) =>
            current.map((item) =>
              item.id === updated.id ? updated : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, selectedUser?.id]);

  /*
  ====================================================
  SCROLL
  ====================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
  ====================================================
  LOGIN
  ====================================================
  */

  async function login() {
    setError("");
    setSuccess("");

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      setError("نام کاربری و رمز عبور را وارد کن.");
      return;
    }

    setBusy(true);

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: usernameToEmail(cleanUsername),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      setSuccess("ورود با موفقیت انجام شد.");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  /*
  ====================================================
  REGISTER
  ====================================================
  */

  async function register() {
    setError("");
    setSuccess("");

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password || !displayName) {
      setError("نام کاربری، نام نمایشی و رمز عبور الزامی هستند.");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      setError(
        "نام کاربری باید ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد."
      );
      return;
    }

    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (!registerInviteCode.trim()) {
      setError("کد دعوت را وارد کن.");
      return;
    }

    setBusy(true);

    try {
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: usernameToEmail(cleanUsername),
          password,
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("ساخت حساب انجام نشد.");
      }

      /*
      ثبت پروفایل از طریق RPC
      */

      const { data: profileData, error: rpcError } =
        await supabase.rpc("redeem_invite", {
          invite_code: registerInviteCode.trim(),
          p_username: cleanUsername,
          p_display_name: displayName.trim(),
          p_contact_type: contactType,
          p_contact_value: contactValue.trim() || null,
        });

      if (rpcError) {
        /*
        اگر ساخت پروفایل شکست خورد، حساب Auth را حذف نمی‌کنیم
        چون حذف auth از frontend مجاز نیست.
        */
        throw rpcError;
      }

      setProfile(profileData);

      setSuccess("حساب با موفقیت ساخته شد.");

      setUsername("");
      setPassword("");
      setDisplayName("");
      setContactValue("");
      setRegisterInviteCode("");

    } catch (err) {
      console.error(err);
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  /*
  ====================================================
  SEND MESSAGE
  ====================================================
  */

  async function sendMessage() {
    const text = messageText.trim();

    if (!text || !session?.user || !selectedUser) return;

    setBusy(true);
    setError("");

    try {
      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({
          sender_id: session.user.id,
          receiver_id: selectedUser.id,
          content: text,
        })
        .select()
        .single();

      if (sendError) {
        throw sendError;
      }

      setMessages((current) => {
        if (current.some((item) => item.id === data.id)) {
          return current;
        }

        return [...current, data];
      });

      setMessageText("");
    } catch (err) {
      console.error(err);
      setError(err.message || "ارسال پیام انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  /*
  ====================================================
  ENTER SEND
  ====================================================
  */

  function handleMessageKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  /*
  ====================================================
  FILE UPLOAD
  ====================================================
  */

  async function uploadFile(event) {
    const file = event.target.files?.[0];

    if (!file || !session?.user || !selectedUser) {
      return;
    }

    setSendingFile(true);
    setError("");

    try {
      const extension =
        file.name.includes(".")
          ? file.name.split(".").pop()
          : "bin";

      const path =
        `${session.user.id}/` +
        `${Date.now()}-${crypto.randomUUID()}.` +
        extension;

      const { error: uploadError } =
        await supabase.storage
          .from("chat-files")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      /*
      جدول فعلی page.js از file_url استفاده می‌کند.
      چون bucket فعلی public است، URL عمومی می‌سازیم.
      */

      const {
        data: publicData,
      } = supabase.storage
        .from("chat-files")
        .getPublicUrl(path);

      const { data: message, error: messageError } =
        await supabase
          .from("messages")
          .insert({
            sender_id: session.user.id,
            receiver_id: selectedUser.id,
            content: file.name,
            file_url: publicData.publicUrl,
            file_type: file.type || "application/octet-stream",
          })
          .select()
          .single();

      if (messageError) {
        throw messageError;
      }

      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) {
          return current;
        }

        return [...current, message];
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "آپلود فایل انجام نشد.");
    } finally {
      setSendingFile(false);
    }
  }

  /*
  ====================================================
  REACTION
  ====================================================
  */

  async function toggleReaction(message) {
    if (!session?.user) return;

    const currentReactions =
      message.reactions &&
      typeof message.reactions === "object"
        ? message.reactions
        : {};

    const currentCount =
      Number(currentReactions.heart || 0);

    const nextReactions = {
      ...currentReactions,
      heart:
        currentCount > 0
          ? 0
          : 1,
    };

    const { data, error: reactionError } =
      await supabase
        .from("messages")
        .update({
          reactions: nextReactions,
        })
        .eq("id", message.id)
        .select()
        .single();

    if (reactionError) {
      console.error(reactionError);
      setError(reactionError.message);
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === data.id ? data : item
      )
    );
  }

  /*
  ====================================================
  INVITE
  ====================================================
  */

  async function createInvite() {
    if (!session?.user) return;

    setBusy(true);
    setError("");

    try {
      const code = randomInviteCode();

      const { data, error: inviteError } =
        await supabase
          .from("invites")
          .insert({
            code,
            created_by: session.user.id,
            expires_at:
              new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
          })
          .select()
          .single();

      if (inviteError) {
        throw inviteError;
      }

      setInviteCode(data.code);
      setShowInvite(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "ساخت کد دعوت انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setSuccess("کد دعوت کپی شد.");
    } catch {
      setError("کپی خودکار انجام نشد.");
    }
  }

  /*
  ====================================================
  LOGOUT
  ====================================================
  */

  async function logout() {
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
  }

  /*
  ====================================================
  LOGIN SCREEN
  ====================================================
  */

  if (loading) {
    return (
      <main className="screen">
        <div className="loader-card">
          <div className="spinner" />
          <div>در حال بارگذاری...</div>
        </div>

        <style jsx global>{styles}</style>
      </main>
    );
  }

  /*
  ====================================================
  AUTH SCREEN
  ====================================================
  */

  if (!session) {
    return (
      <main className={`auth-screen ${darkMode ? "dark" : "light"}`}>
        <div className="auth-background" />

        <section className="auth-card">
          <div className="brand">
            <div className="brand-icon">✦</div>

            <div>
              <h1>Messenger</h1>
              <p>پیام‌رسان خصوصی</p>
            </div>
          </div>

          <div className="mode-switch">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              ورود
            </button>

            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
            >
              ثبت‌نام
            </button>
          </div>

          <div className="form">
            <label>نام کاربری</label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="مثلاً parham"
              autoComplete="username"
            />

            {mode === "register" && (
              <>
                <label>نام نمایشی</label>

                <input
                  value={displayName}
                  onChange={(e) =>
                    setDisplayName(e.target.value)
                  }
                  placeholder="نام شما"
                />

                <label>نوع راه ارتباطی</label>

                <select
                  value={contactType}
                  onChange={(e) =>
                    setContactType(e.target.value)
                  }
                >
                  <option value="telegram">
                    Telegram
                  </option>

                  <option value="email">
                    Email
                  </option>

                  <option value="phone">
                    Phone
                  </option>
                </select>

                <label>اطلاعات تماس</label>

                <input
                  value={contactValue}
                  onChange={(e) =>
                    setContactValue(e.target.value)
                  }
                  placeholder="اختیاری"
                />

                <label>کد دعوت</label>

                <input
                  value={registerInviteCode}
                  onChange={(e) =>
                    setRegisterInviteCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="کد دعوت"
                />
              </>
            )}

            <label>رمز عبور</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="رمز عبور"
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (mode === "login") {
                    login();
                  } else {
                    register();
                  }
                }
              }}
            />

            {error && (
              <div className="alert error">
                {error}
              </div>
            )}

            {success && (
              <div className="alert success">
                {success}
              </div>
            )}

            <button
              className="primary-button"
              disabled={busy}
              onClick={
                mode === "login"
                  ? login
                  : register
              }
            >
              {busy
                ? "لطفاً صبر کن..."
                : mode === "login"
                ? "ورود به حساب"
                : "ساخت حساب"}
            </button>
          </div>

          <div className="auth-footer">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="ghost-button"
            >
              {darkMode ? "☀️ حالت روشن" : "🌙 حالت تاریک"}
            </button>
          </div>
        </section>

        <style jsx global>{styles}</style>
      </main>
    );
  }

  /*
  ====================================================
  MAIN APP
  ====================================================
  */

  return (
    <main className={`app ${darkMode ? "dark" : "light"}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand small">
            <div className="brand-icon">✦</div>

            <div>
              <h1>Messenger</h1>
              <span>Private Chat</span>
            </div>
          </div>

          <div className="top-actions">
            <button
              title="دعوت"
              onClick={createInvite}
            >
              ＋
            </button>

            <button
              title="پشتیبانی"
              onClick={() =>
                setShowSupport(true)
              }
            >
              ?
            </button>

            <button
              title="حالت نمایش"
              onClick={() =>
                setDarkMode(!darkMode)
              }
            >
              {darkMode ? "☀" : "☾"}
            </button>
          </div>
        </div>

        <div className="me-card">
          <div className="avatar">
            {(profile?.display_name ||
              profile?.username ||
              "?")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="me-info">
            <strong>
              {profile?.display_name ||
                profile?.username}
            </strong>

            <span>
              @{profile?.username}
            </span>
          </div>

          <button
            className="more-button"
            onClick={() =>
              setShowProfile(true)
            }
          >
            ⋮
          </button>
        </div>

        <div className="search-box">
          <span>⌕</span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="جستجوی کاربر..."
          />
        </div>

        <div className="users-title">
          <span>کاربران</span>

          <span>{filteredUsers.length}</span>
        </div>

        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="empty-users">
              کاربری پیدا نشد
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                className={`user-item ${
                  selectedUser?.id === user.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  loadMessages(user)
                }
              >
                <div className="avatar">
                  {(user.display_name ||
                    user.username ||
                    "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="user-text">
                  <strong>
                    {user.display_name}
                  </strong>

                  <span>
                    @{user.username}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-bottom">
          <button
            onClick={() =>
              setShowSupport(true)
            }
          >
            <span>◉</span>
            پشتیبانی
          </button>

          <button onClick={logout}>
            <span>↪</span>
            خروج
          </button>
        </div>
      </aside>

      <section className="chat">
        {!selectedUser ? (
          <div className="welcome">
            <div className="welcome-icon">
              ✦
            </div>

            <h2>پیام‌رسان خصوصی</h2>

            <p>
              یک کاربر را انتخاب کن و گفت‌وگوی
              خصوصی خودت را شروع کن.
            </p>

            <button
              className="primary-button compact"
              onClick={createInvite}
            >
              ساخت کد دعوت
            </button>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <div className="chat-person">
                <div className="avatar large">
                  {(selectedUser.display_name ||
                    selectedUser.username ||
                    "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {selectedUser.display_name}
                  </strong>

                  <span>
                    @{selectedUser.username}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                ×
              </button>
            </header>

            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div>💬</div>
                  <strong>
                    هنوز پیامی وجود ندارد
                  </strong>

                  <span>
                    اولین پیام را ارسال کن.
                  </span>
                </div>
              ) : (
                messages.map((message) => {
                  const mine =
                    message.sender_id ===
                    session.user.id;

                  return (
                    <div
                      key={message.id}
                      className={`message-row ${
                        mine ? "mine" : "theirs"
                      }`}
                    >
                      <div className="message">
                        {message.file_url ? (
                          <a
                            href={
                              message.file_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-message"
                          >
                            <span>📎</span>

                            <div>
                              <strong>
                                {message.content}
                              </strong>

                              <small>
                                باز کردن فایل
                              </small>
                            </div>
                          </a>
                        ) : (
                          <div className="message-content">
                            {message.content}
                          </div>
                        )}

                        <div className="message-bottom">
                          <span>
                            {formatTime(
                              message.created_at
                            )}
                          </span>

                          <button
                            onClick={() =>
                              toggleReaction(
                                message
                              )
                            }
                          >
                            {message.reactions
                              ?.heart
                              ? "❤️"
                              : "♡"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="composer">
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={uploadFile}
              />

              <button
                className="attach"
                disabled={sendingFile}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                {sendingFile ? "…" : "📎"}
              </button>

              <textarea
                value={messageText}
                onChange={(e) =>
                  setMessageText(e.target.value)
                }
                onKeyDown={
                  handleMessageKeyDown
                }
                placeholder="پیام خود را بنویس..."
                rows={1}
              />

              <button
                className="send"
                disabled={
                  busy ||
                  !messageText.trim()
                }
                onClick={sendMessage}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </section>

      {showInvite && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowInvite(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowInvite(false)
              }
            >
              ×
            </button>

            <div className="modal-icon">
              🔗
            </div>

            <h2>کد دعوت</h2>

            <p>
              این کد را برای کاربر موردنظر
              ارسال کن.
            </p>

            <div className="invite-code">
              {inviteCode}
            </div>

            <button
              className="primary-button"
              onClick={copyInvite}
            >
              کپی کد
            </button>
          </div>
        </div>
      )}

      {showSupport && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowSupport(false)
          }
        >
          <div
            className="modal support"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowSupport(false)
              }
            >
              ×
            </button>

            <div className="modal-icon">
              🎧
            </div>

            <h2>پشتیبانی</h2>

            <p>
              برای دریافت کمک می‌توانی از
              مسیرهای زیر استفاده کنی.
            </p>

            <a
              href="https://utino.org/chat/supportusername"
              target="_blank"
              rel="noopener noreferrer"
              className="support-link"
            >
              پشتیبانی Utino
            </a>

            <a
              href="https://t.me/parhamsoleimanybot"
              target="_blank"
              rel="noopener noreferrer"
              className="support-link"
            >
              پشتیبانی Telegram
            </a>

            <a
              href="https://iparham.com"
              target="_blank"
              rel="noopener noreferrer"
              className="support-link"
            >
              iparham.com
            </a>

            <a
              href="https://wdner.co"
              target="_blank"
              rel="noopener noreferrer"
              className="support-link"
            >
              WDNER
            </a>
          </div>
        </div>
      )}

      {showProfile && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowProfile(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowProfile(false)
              }
            >
              ×
            </button>

            <div className="profile-big-avatar">
              {(profile?.display_name ||
                profile?.username ||
                "?")
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2>
              {profile?.display_name}
            </h2>

            <p>
              @{profile?.username}
            </p>

            {profile?.contact_value && (
              <div className="profile-contact">
                <span>
                  {profile.contact_type}
                </span>

                <strong>
                  {profile.contact_value}
                </strong>
              </div>
            )}

            <button
              className="primary-button"
              onClick={logout}
            >
              خروج از حساب
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="toast error-toast">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="toast success-toast">
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      <style jsx global>{styles}</style>
    </main>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family:
    Inter,
    Vazirmatn,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #080a10;
  color: white;
}

.loader-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  opacity: .85;
}

.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,.15);
  border-top-color: white;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.auth-screen.dark,
.app.dark {
  --bg: #080a10;
  --panel: #10131b;
  --panel2: #151923;
  --border: rgba(255,255,255,.08);
  --text: #f5f7fb;
  --muted: #8d95a7;
  --input: #0d1017;
  --accent: #7c6cff;
  --accent2: #6557ed;
  --mine: #6659e9;
  --theirs: #171b25;
}

.auth-screen.light,
.app.light {
  --bg: #f5f7fb;
  --panel: #ffffff;
  --panel2: #f0f2f7;
  --border: rgba(0,0,0,.08);
  --text: #151823;
  --muted: #6f7585;
  --input: #f4f5f8;
  --accent: #6758e9;
  --accent2: #5748db;
  --mine: #6758e9;
  --theirs: #eef0f5;
}

.auth-screen {
  background: var(--bg);
  color: var(--text);
}

.auth-background {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(
      circle at 50% 30%,
      rgba(124,108,255,.18),
      transparent 30%
    );
  pointer-events: none;
}

.auth-card {
  width: min(440px, 100%);
  position: relative;
  z-index: 1;
  padding: 34px;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: color-mix(
    in srgb,
    var(--panel) 94%,
    transparent
  );
  box-shadow:
    0 30px 100px rgba(0,0,0,.3);
  backdrop-filter: blur(25px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-icon {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: white;
  font-size: 23px;
  box-shadow: 0 12px 35px rgba(124,108,255,.3);
}

.brand h1 {
  margin: 0;
  font-size: 22px;
}

.brand p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin: 28px 0;
  padding: 5px;
  border-radius: 13px;
  background: var(--input);
}

.mode-switch button {
  border: 0;
  border-radius: 10px;
  padding: 11px;
  background: transparent;
  color: var(--muted);
}

.mode-switch button.active {
  background: var(--panel2);
  color: var(--text);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.form label {
  margin-top: 7px;
  color: var(--muted);
  font-size: 13px;
}

.form input,
.form select {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--input);
  color: var(--text);
  outline: none;
  border-radius: 13px;
  padding: 13px 14px;
}

.form input:focus,
.form select:focus {
  border-color: var(--accent);
}

.primary-button {
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 14px;
  margin-top: 10px;
  color: white;
  background: var(--accent);
  transition: .2s;
  font-weight: 700;
}

.primary-button:hover {
  background: var(--accent2);
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: .5;
  cursor: not-allowed;
  transform: none;
}

.primary-button.compact {
  width: auto;
  padding: 12px 18px;
}

.ghost-button {
  background: transparent;
  border: 0;
  color: var(--muted);
}

.auth-footer {
  display: flex;
  justify-content: center;
  margin-top: 22px;
}

.alert {
  padding: 11px 13px;
  border-radius: 12px;
  font-size: 13px;
  margin-top: 7px;
}

.alert.error {
  background: rgba(255,70,90,.1);
  color: #ff8795;
}

.alert.success {
  background: rgba(50,200,120,.1);
  color: #66d99d;
}


/* APP */

.app {
  min-height: 100vh;
  display: flex;
  background: var(--bg);
  color: var(--text);
  direction: rtl;
}

.sidebar {
  width: 350px;
  min-width: 350px;
  height: 100vh;
  border-left: 1px solid var(--border);
  background: var(--panel);
  display: flex;
  flex-direction: column;
}

.sidebar-top {
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  direction: ltr;
}

.brand.small .brand-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 18px;
}

.brand.small h1 {
  font-size: 17px;
}

.brand.small span {
  color: var(--muted);
  font-size: 11px;
}

.top-actions {
  display: flex;
  gap: 5px;
}

.top-actions button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: var(--panel2);
  color: var(--text);
}

.me-card {
  margin: 0 15px 15px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  background: var(--panel2);
  border-radius: 16px;
}

.avatar {
  width: 42px;
  height: 42px;
  min-width: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  font-weight: 800;
}

.avatar.large {
  width: 45px;
  height: 45px;
}

.me-info,
.user-text {
  min-width: 0;
  flex: 1;
  text-align: right;
}

.me-info strong,
.user-text strong {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.me-info span,
.user-text span {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  direction: ltr;
  text-align: right;
}

.more-button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 20px;
}

.search-box {
  margin: 0 15px 16px;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  background: var(--input);
  border: 1px solid var(--border);
  border-radius: 13px;
}

.search-box span {
  font-size: 22px;
  color: var(--muted);
}

.search-box input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
}

.users-title {
  padding: 0 20px 9px;
  display: flex;
  justify-content: space-between;
  color: var(--muted);
  font-size: 12px;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
}

.user-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border-radius: 14px;
  direction: rtl;
  text-align: right;
}

.user-item:hover,
.user-item.selected {
  background: var(--panel2);
}

.empty-users {
  padding: 30px 15px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}

.sidebar-bottom {
  border-top: 1px solid var(--border);
  padding: 10px;
}

.sidebar-bottom button {
  width: 100%;
  padding: 11px 13px;
  border: 0;
  background: transparent;
  color: var(--muted);
  border-radius: 10px;
  text-align: right;
}

.sidebar-bottom button:hover {
  background: var(--panel2);
  color: var(--text);
}

.sidebar-bottom span {
  margin-left: 8px;
}


/* CHAT */

.chat {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(124,108,255,.06),
      transparent 35%
    ),
    var(--bg);
}

.chat-header {
  height: 75px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 22px;
}

.chat-person {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-person strong {
  display: block;
}

.chat-person span {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
  direction: ltr;
  text-align: right;
}

.chat-header > button {
  border: 0;
  background: var(--panel2);
  color: var(--muted);
  border-radius: 10px;
  width: 35px;
  height: 35px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 25px 7%;
}

.message-row {
  display: flex;
  margin: 6px 0;
}

.message-row.mine {
  justify-content: flex-start;
}

.message-row.theirs {
  justify-content: flex-end;
}

.message {
  max-width: min(600px, 75%);
  padding: 10px 13px;
  border-radius: 17px;
  box-shadow: 0 5px 20px rgba(0,0,0,.05);
}

.mine .message {
  background: var(--mine);
  color: white;
  border-bottom-right-radius: 5px;
}

.theirs .message {
  background: var(--theirs);
  border-bottom-left-radius: 5px;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.message-bottom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 5px;
  font-size: 10px;
  opacity: .65;
}

.message-bottom button {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.file-message {
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-message > span {
  font-size: 26px;
}

.file-message strong,
.file-message small {
  display: block;
}

.file-message small {
  opacity: .65;
  margin-top: 3px;
}

.composer {
  margin: 15px;
  min-height: 58px;
  padding: 8px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 17px;
}

.composer textarea {
  flex: 1;
  min-height: 40px;
  max-height: 140px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text);
  padding: 10px;
  line-height: 1.5;
}

.attach,
.send {
  width: 42px;
  height: 42px;
  min-width: 42px;
  border: 0;
  border-radius: 12px;
}

.attach {
  background: var(--panel2);
  color: var(--text);
}

.send {
  background: var(--accent);
  color: white;
}

.send:disabled,
.attach:disabled {
  opacity: .4;
  cursor: not-allowed;
}


/* WELCOME */

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 25px;
}

.welcome-icon {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border-radius: 25px;
  background: var(--accent);
  color: white;
  font-size: 34px;
  box-shadow: 0 25px 60px rgba(124,108,255,.25);
}

.welcome h2 {
  margin: 22px 0 5px;
}

.welcome p {
  color: var(--muted);
  max-width: 400px;
}


/* EMPTY CHAT */

.empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--muted);
  gap: 7px;
}

.empty-chat div {
  font-size: 38px;
  margin-bottom: 5px;
}

.empty-chat strong {
  color: var(--text);
}


/* MODAL */

.modal-overlay {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(8px);
}

.modal {
  width: min(430px, 100%);
  position: relative;
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: 25px;
  background: var(--panel);
  text-align: center;
  box-shadow: 0 30px 100px rgba(0,0,0,.4);
}

.modal-close {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: var(--panel2);
  color: var(--muted);
}

.modal-icon {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  margin: 0 auto 15px;
  border-radius: 19px;
  background: var(--panel2);
  font-size: 27px;
}

.modal h2 {
  margin: 5px 0;
}

.modal p {
  color: var(--muted);
  line-height: 1.7;
}

.invite-code {
  direction: ltr;
  padding: 17px;
  margin: 20px 0;
  border-radius: 13px;
  background: var(--input);
  font-size: 23px;
  font-weight: 800;
  letter-spacing: 3px;
}

.support-link {
  display: block;
  padding: 13px;
  margin-top: 9px;
  border-radius: 12px;
  background: var(--panel2);
  color: var(--text);
  text-decoration: none;
}

.support-link:hover {
  background: var(--accent);
  color: white;
}

.profile-big-avatar {
  width: 80px;
  height: 80px;
  display: grid;
  place-items: center;
  margin: 0 auto 15px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  font-size: 30px;
  font-weight: 800;
}

.profile-contact {
  padding: 14px;
  margin: 18px 0;
  background: var(--panel2);
  border-radius: 13px;
}

.profile-contact span,
.profile-contact strong {
  display: block;
}

.profile-contact span {
  color: var(--muted);
  font-size: 11px;
  margin-bottom: 5px;
}


/* TOAST */

.toast {
  position: fixed;
  z-index: 200;
  left: 20px;
  bottom: 20px;
  max-width: min(420px, calc(100vw - 40px));
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 14px;
  box-shadow: 0 15px 50px rgba(0,0,0,.3);
  backdrop-filter: blur(15px);
}

.toast button {
  border: 0;
  background: transparent;
  color: inherit;
  opacity: .7;
}

.error-toast {
  background: #5e2028;
  color: #ffd9dd;
}

.success-toast {
  background: #164f38;
  color: #d5ffe9;
}


/* MOBILE */

@media (max-width: 800px) {
  .sidebar {
    width: 290px;
    min-width: 290px;
  }

  .messages {
    padding: 20px 15px;
  }

  .message {
    max-width: 85%;
  }
}

@media (max-width: 620px) {
  .app {
    display: block;
  }

  .sidebar {
    width: 100%;
    min-width: 0;
    height: 43vh;
    max-height: 420px;
  }

  .chat {
    height: 57vh;
  }

  .sidebar-bottom {
    display: none;
  }

  .users-list {
    min-height: 80px;
  }

  .chat-header {
    height: 64px;
  }

  .composer {
    margin: 8px;
  }

  .auth-card {
    padding: 25px 20px;
  }
}
`;
