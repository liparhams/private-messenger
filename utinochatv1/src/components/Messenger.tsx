import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  CheckCheck,
  Hash,
  LogOut,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  SunMoon,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import {
  bootstrapProfile,
  createChannel,
  createGroup,
  createInvite,
  createTicket,
  deleteMessage,
  editMessage,
  getAttachment,
  getMe,
  joinInvite,
  joinPublic,
  listConversations,
  listMembers,
  listMessages,
  listTickets,
  markRead,
  openDirect,
  searchDirectory,
  sendMessage,
  updateMyProfile,
  type Conversation,
  type Message,
  type Profile,
} from "@/lib/chat/actions";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/components/theme";
import { mapError } from "@/lib/utils";

function timeLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Messenger() {
  const { t, lang, setLang, theme, setTheme, dir } = useTheme();
  const [me, setMe] = useState<Profile | null>(null);
  const [bootError, setBootError] = useState("");
  const [chats, setChats] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<(Profile & { memberRole: string })[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ people: Profile[]; channels: Conversation[] }>({
    people: [],
    channels: [],
  });
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [modal, setModal] = useState<null | "group" | "channel" | "ticket" | "settings" | "profile">(null);
  const [inviteCode, setInviteCode] = useState("");
  const [toast, setToast] = useState("");
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof listTickets>>>([]);
  const scroller = useRef<HTMLDivElement>(null);

  async function refreshMe() {
    let profile = await getMe();
    if (!profile) profile = await bootstrapProfile({ data: {} });
    setMe(profile);
    return profile;
  }

  async function refreshChats() {
    const list = await listConversations();
    setChats(list);
    return list;
  }

  useEffect(() => {
    refreshMe()
      .then(() => refreshChats())
      .catch((e) => setBootError(mapError(String(e.message || e), lang)));
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshChats().catch(() => {});
      if (activeId) {
        listMessages({ data: { conversationId: activeId } })
          .then(setMessages)
          .catch(() => {});
      }
    }, 2500);
    return () => window.clearInterval(id);
  }, [activeId]);

  useEffect(() => {
    const tmr = window.setTimeout(() => {
      if (!query.trim()) {
        setResults({ people: [], channels: [] });
        return;
      }
      searchDirectory({ data: { q: query } }).then(setResults).catch(() => {});
    }, 280);
    return () => window.clearTimeout(tmr);
  }, [query]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const active = chats.find((c) => c.id === activeId) ?? null;

  async function openChat(id: string) {
    setActiveId(id);
    setMobilePane("chat");
    setQuery("");
    const msgs = await listMessages({ data: { conversationId: id } });
    setMessages(msgs);
    await markRead({ data: { conversationId: id } });
    const mem = await listMembers({ data: { conversationId: id } });
    setMembers(mem);
    await refreshChats();
  }

  async function startDm(userId: string) {
    const { id } = await openDirect({ data: { userId } });
    await refreshChats();
    await openChat(id);
  }

  async function onSend() {
    if (!activeId || busy) return;
    const text = draft.trim();
    if (!text && !editing) return;
    setBusy(true);
    try {
      if (editing) {
        await editMessage({ data: { messageId: editing.id, body: text } });
        setEditing(null);
      } else {
        await sendMessage({ data: { conversationId: activeId, body: text } });
      }
      setDraft("");
      const msgs = await listMessages({ data: { conversationId: activeId } });
      setMessages(msgs);
      await refreshChats();
    } catch (e) {
      setToast(mapError(String((e as Error).message || e), lang));
    } finally {
      setBusy(false);
    }
  }

  async function onAttach(file: File) {
    if (!activeId) return;
    if (file.size > 15 * 1024 * 1024) {
      setToast(lang === "fa" ? "حداکثر حجم فایل ۱۵ مگابایت است." : "Max file size is 15MB.");
      return;
    }
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      await sendMessage({
        data: {
          conversationId: activeId,
          body: draft.trim(),
          attachmentName: file.name,
          attachmentMime: file.type || "application/octet-stream",
          attachmentSize: file.size,
          attachmentData: data,
        },
      });
      setDraft("");
      setMessages(await listMessages({ data: { conversationId: activeId } }));
    } catch (e) {
      setToast(mapError(String((e as Error).message || e), lang));
    } finally {
      setBusy(false);
    }
  }

  const filteredChats = useMemo(() => {
    if (query.trim()) return [];
    return chats;
  }, [chats, query]);

  if (bootError) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6 text-fg">
        <p>{bootError}</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-muted">
        <div className="h-10 w-48 animate-pulse rounded-md bg-raised" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg" dir={dir}>
      <aside
        className={`flex w-full max-w-full flex-col border-line bg-surface md:w-[360px] md:border-e ${
          mobilePane === "list" ? "flex" : "hidden md:flex"
        }`}
      >
        <header className="flex items-center gap-3 border-b border-line px-3 py-3">
          <Avatar name={me.displayName} hue={me.avatarHue} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate font-semibold">
              {me.displayName}
              {me.verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="verified" />}
            </p>
            <p className="truncate text-xs text-muted">@{me.username}</p>
          </div>
          <button aria-label={t.settings} className="rounded-md p-2 hover:bg-raised" onClick={() => setModal("settings")}>
            <Settings className="h-5 w-5" />
          </button>
          {(me.role === "admin" || me.role === "support") && (
            <Link to="/admin" className="rounded-md p-2 hover:bg-raised" aria-label={t.admin}>
              <Shield className="h-5 w-5" />
            </Link>
          )}
        </header>
        <div className="p-3">
          <label className="flex items-center gap-2 rounded-md bg-raised px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="flex gap-2 px-3 pb-2">
          <button className="flex-1 rounded-md bg-raised py-2 text-sm" onClick={() => setModal("group")}>
            {t.newGroup}
          </button>
          <button className="flex-1 rounded-md bg-raised py-2 text-sm" onClick={() => setModal("channel")}>
            {t.newChannel}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto chat-scroll">
          {query.trim() ? (
            <div className="px-2 pb-4">
              {!results.people.length && !results.channels.length && (
                <p className="px-3 py-8 text-center text-sm text-muted">{t.noResults}</p>
              )}
              {results.people.map((p) => (
                <button
                  key={p.userId}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start hover:bg-raised"
                  onClick={() => startDm(p.userId)}
                >
                  <Avatar name={p.displayName} hue={p.avatarHue} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-medium">
                      {p.displayName}
                      {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                    </span>
                    <span className="block truncate text-xs text-muted">@{p.username} · {p.publicId}</span>
                  </span>
                </button>
              ))}
              {results.channels.map((c) => (
                <button
                  key={c.id}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start hover:bg-raised"
                  onClick={async () => {
                    await joinPublic({ data: { conversationId: c.id } });
                    await refreshChats();
                    await openChat(c.id);
                  }}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-raised">
                    <Hash className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-medium">{c.title}</span>
                    <span className="text-xs text-muted">@{c.username}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted">{t.emptyChatHint}</p>
          ) : (
            filteredChats.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-raised ${
                  c.id === activeId ? "bg-raised" : ""
                }`}
              >
                {c.kind === "direct" && c.peer ? (
                  <Avatar name={c.peer.displayName} hue={c.peer.avatarHue} />
                ) : c.kind === "channel" ? (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-raised">
                    <Hash className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-raised">
                    <Users className="h-4 w-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {c.kind === "direct" && c.peer ? c.peer.displayName : c.title}
                    </span>
                    <span className="text-[11px] text-muted">{timeLabel(c.lastAt)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-muted">{c.lastBody || " "}</span>
                    {c.unread > 0 && (
                      <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold">
                        {c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className={`min-w-0 flex-1 flex-col wallpaper ${mobilePane === "chat" ? "flex" : "hidden md:flex"}`}>
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-line bg-surface/90 px-3 py-2.5 backdrop-blur">
              <button className="rounded-md p-2 md:hidden" onClick={() => setMobilePane("list")} aria-label="back">
                <Menu className="h-5 w-5" />
              </button>
              {active.kind === "direct" && active.peer ? (
                <Avatar name={active.peer.displayName} hue={active.peer.avatarHue} size={36} />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-raised">
                  {active.kind === "channel" ? <Hash className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {active.kind === "direct" && active.peer ? active.peer.displayName : active.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {active.kind === "direct" && active.peer
                    ? `@${active.peer.username}`
                    : `${members.length} · ${active.isPublic ? t.public : t.private}`}
                </p>
              </div>
              {(active.memberRole === "owner" || active.memberRole === "admin") && active.kind !== "direct" && (
                <button
                  className="rounded-md px-3 py-2 text-sm text-primary"
                  onClick={async () => {
                    const { code } = await createInvite({ data: { conversationId: active.id } });
                    setToast(`${t.invite}: ${code}`);
                  }}
                >
                  {t.invite}
                </button>
              )}
            </header>
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 chat-scroll">
              {messages.length === 0 && <p className="py-16 text-center text-sm text-muted">{t.noMessages}</p>}
              {messages.map((m) => {
                const mine = m.senderId === me.userId;
                const seen = m.seenBy.some((s) => s.readerId !== me.userId);
                return (
                  <div key={m.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[min(78%,28rem)] rounded-lg px-3 py-2 shadow-sm ${
                        mine ? "bg-bubble-out" : "bg-bubble-in"
                      }`}
                    >
                      {!mine && active.kind !== "direct" && (
                        <p className="mb-0.5 text-xs font-semibold text-primary">{m.senderName}</p>
                      )}
                      {m.deletedAt ? (
                        <p className="italic text-muted">{t.deleted}</p>
                      ) : (
                        <>
                          {m.body && <p className="whitespace-pre-wrap text-[15px] leading-6">{m.body}</p>}
                          {m.attachmentName && (
                            <button
                              className="mt-1 flex items-center gap-2 text-sm text-primary"
                              onClick={async () => {
                                const file = await getAttachment({ data: { messageId: m.id } });
                                if (!file.data) return;
                                const a = document.createElement("a");
                                a.href = file.data;
                                a.download = file.name || "file";
                                a.click();
                              }}
                            >
                              <Paperclip className="h-4 w-4" />
                              {m.attachmentName}
                            </button>
                          )}
                        </>
                      )}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted">
                        {m.editedAt && !m.deletedAt && <span>{t.edited}</span>}
                        <span>{timeLabel(m.createdAt)}</span>
                        {mine && (seen ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Check className="h-3.5 w-3.5" />)}
                      </div>
                      {mine && !m.deletedAt && (
                        <div className="mt-1 flex justify-end gap-2 text-[11px]">
                          <button className="text-muted" onClick={() => { setEditing(m); setDraft(m.body); }}>
                            {lang === "fa" ? "ویرایش" : "Edit"}
                          </button>
                          <button
                            className="text-danger"
                            onClick={async () => {
                              await deleteMessage({ data: { messageId: m.id } });
                              setMessages(await listMessages({ data: { conversationId: active.id } }));
                            }}
                          >
                            {lang === "fa" ? "حذف" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              className="border-t border-line bg-surface p-3"
              onSubmit={(e) => {
                e.preventDefault();
                onSend();
              }}
            >
              {editing && (
                <div className="mb-2 flex items-center justify-between rounded-md bg-raised px-3 py-2 text-sm">
                  <span>{lang === "fa" ? "در حال ویرایش" : "Editing"}</span>
                  <button type="button" onClick={() => { setEditing(null); setDraft(""); }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <label className="rounded-md p-2 hover:bg-raised">
                  <Paperclip className="h-5 w-5" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onAttach(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                <textarea
                  rows={1}
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-md bg-raised px-3 py-2.5 outline-none"
                  placeholder={t.send}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="grid h-11 w-11 place-items-center rounded-full bg-primary text-fg"
                  aria-label={t.send}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted" />
              <h2 className="text-xl font-semibold">{t.emptyChat}</h2>
              <p className="mt-2 max-w-sm text-sm text-muted">{t.emptyChatHint}</p>
            </div>
          </div>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-40 grid place-items-end bg-black/40 md:place-items-center" onClick={() => setModal(null)}>
          <div
            className="w-full max-w-md rounded-t-lg border border-line bg-surface p-5 md:rounded-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                {modal === "group" && t.newGroup}
                {modal === "channel" && t.newChannel}
                {modal === "ticket" && t.ticket}
                {modal === "settings" && t.settings}
                {modal === "profile" && t.profile}
              </h3>
              <button onClick={() => setModal(null)} aria-label="close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modal === "group" && <CreateGroupForm onDone={async (id) => { setModal(null); await refreshChats(); await openChat(id); }} />}
            {modal === "channel" && <CreateChannelForm onDone={async (id) => { setModal(null); await refreshChats(); await openChat(id); }} />}
            {modal === "ticket" && (
              <TicketForm
                onDone={async () => {
                  setTickets(await listTickets());
                  setModal(null);
                  setToast(lang === "fa" ? "تیکت ثبت شد." : "Ticket submitted.");
                }}
              />
            )}
            {modal === "settings" && (
              <div className="space-y-3 text-sm">
                <button className="flex w-full items-center justify-between rounded-md bg-raised px-3 py-3" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  <span className="flex items-center gap-2"><SunMoon className="h-4 w-4" />{t.theme}</span>
                  <span>{theme === "dark" ? t.dark : t.light}</span>
                </button>
                <button className="flex w-full items-center justify-between rounded-md bg-raised px-3 py-3" onClick={() => setLang(lang === "fa" ? "en" : "fa")}>
                  {t.language}
                  <span>{lang === "fa" ? "فارسی" : "English"}</span>
                </button>
                <ProfileForm me={me} onSave={async (p) => { setMe(p); setModal(null); }} />
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const { id } = await joinInvite({ data: { code: inviteCode.trim() } });
                      setInviteCode("");
                      setModal(null);
                      await refreshChats();
                      await openChat(id);
                    } catch (err) {
                      setToast(mapError(String((err as Error).message), lang));
                    }
                  }}
                >
                  <input className="flex-1 rounded-md bg-raised px-3 py-2" placeholder={t.invite} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                  <button className="rounded-md bg-primary px-3 py-2">{t.join}</button>
                </form>
                <button className="flex w-full items-center gap-2 rounded-md bg-raised px-3 py-3" onClick={() => setModal("ticket")}>
                  <Ticket className="h-4 w-4" /> {t.ticket}
                </button>
                <div className="flex items-center justify-between rounded-md bg-raised px-3 py-3">
                  <span>{t.signOut}</span>
                  <span className="flex items-center gap-2">
                    <UserButton />
                    <button onClick={() => signOut()} aria-label={t.signOut}><LogOut className="h-4 w-4" /></button>
                  </span>
                </div>
                <p className="pt-2 text-xs text-muted">
                  <a className="text-primary" href="https://t.me/parhamsoleimanybot">Telegram</a> ·{" "}
                  <a className="text-primary" href="https://utino.org">Utino</a> ·{" "}
                  <a className="text-primary" href="https://iparham.com">iParham</a> ·{" "}
                  <a className="text-primary" href="https://wdner.co">WDNER</a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        className="fixed bottom-5 start-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-primary shadow-lg md:hidden"
        onClick={() => setModal("group")}
        aria-label={t.newGroup}
      >
        <Plus className="h-5 w-5" />
      </button>
      {toast && (
        <button className="fixed bottom-5 end-5 z-50 max-w-xs rounded-md bg-raised px-4 py-3 text-sm shadow-lg" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}

function CreateGroupForm({ onDone }: { onDone: (id: string) => void }) {
  const { t, lang } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
          const { id } = await createGroup({ data: { title, description, isPublic } });
          onDone(id);
        } catch (e2) {
          setErr(mapError(String((e2 as Error).message), lang));
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="w-full rounded-md bg-raised px-3 py-3" required maxLength={80} placeholder={t.newGroup} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="w-full rounded-md bg-raised px-3 py-3" maxLength={280} placeholder="…" value={description} onChange={(e) => setDescription(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        {isPublic ? t.public : t.private}
      </label>
      {err && <p className="text-sm text-danger">{err}</p>}
      <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-semibold">{t.create}</button>
    </form>
  );
}

function CreateChannelForm({ onDone }: { onDone: (id: string) => void }) {
  const { t, lang } = useTheme();
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
          const { id } = await createChannel({ data: { title, username, description, isPublic } });
          onDone(id);
        } catch (e2) {
          setErr(mapError(String((e2 as Error).message), lang));
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="w-full rounded-md bg-raised px-3 py-3" required placeholder={t.newChannel} value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="w-full rounded-md bg-raised px-3 py-3" required placeholder="@username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <textarea className="w-full rounded-md bg-raised px-3 py-3" value={description} onChange={(e) => setDescription(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        {isPublic ? t.public : t.private}
      </label>
      {err && <p className="text-sm text-danger">{err}</p>}
      <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-semibold">{t.create}</button>
    </form>
  );
}

function TicketForm({ onDone }: { onDone: () => void }) {
  const { t, lang } = useTheme();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await createTicket({ data: { title, body, priority } });
          onDone();
        } catch (err) {
          alert(mapError(String((err as Error).message), lang));
        }
      }}
    >
      <input className="w-full rounded-md bg-raised px-3 py-3" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.ticket} />
      <textarea className="w-full rounded-md bg-raised px-3 py-3" required value={body} onChange={(e) => setBody(e.target.value)} />
      <select className="w-full rounded-md bg-raised px-3 py-3" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
        <option value="low">low</option>
        <option value="normal">normal</option>
        <option value="high">high</option>
        <option value="urgent">urgent</option>
      </select>
      <button className="w-full rounded-md bg-primary py-3 font-semibold">{t.send}</button>
    </form>
  );
}

function ProfileForm({ me, onSave }: { me: Profile; onSave: (p: Profile) => void }) {
  const { t } = useTheme();
  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio ?? "");
  return (
    <form
      className="space-y-2 rounded-md bg-raised p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const p = await updateMyProfile({ data: { displayName, bio } });
        onSave(p);
      }}
    >
      <p className="text-xs text-muted">@{me.username} · {me.publicId} · {me.role}</p>
      <input className="w-full rounded-md border border-line bg-surface px-3 py-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <textarea className="w-full rounded-md border border-line bg-surface px-3 py-2" value={bio} onChange={(e) => setBio(e.target.value)} />
      <button className="rounded-md bg-primary px-3 py-2 text-sm">{t.profile}</button>
    </form>
  );
}
