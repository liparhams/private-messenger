"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../lib/supabase-client";
import mapError from "../lib/error-map";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_GROUP_MEMBERS = 100;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "video/webm",
]);

const safeFileName = (name) =>
  String(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120) || "file";

function Badge({ value }) {
  return value && value !== "none" ? (
    <span className={`uc-badge uc-badge-${value}`} aria-label="نشان تأیید">
      ✓
    </span>
  ) : null;
}

function Avatar({ user, group = false, channel = false }) {
  const label = channel
    ? "C"
    : group
      ? "G"
      : (user?.display_name || user?.username || "U").slice(0, 1).toUpperCase();
  return <div className="uc-avatar" aria-hidden="true">{label}</div>;
}

function Modal({ title, onClose, children, className = "" }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="uc-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`uc-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <strong>{title}</strong>
          <button type="button" onClick={onClose} aria-label="بستن">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default function ChatWorkspace() {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [convos, setConvos] = useState([]);
  const [publicCommunities, setPublicCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [create, setCreate] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPublic, setGroupPublic] = useState(false);
  const [groupUsers, setGroupUsers] = useState([]);
  const [channelForm, setChannelForm] = useState({ title: "", username: "", description: "", public: true });
  const [edit, setEdit] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [invite, setInvite] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [notice, setNotice] = useState("");

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const selectedRef = useRef(null);
  const busyRef = useRef(false);

  const fail = useCallback((value) => {
    setError(mapError(value, "fa"));
  }, []);

  const setBusySafe = (value) => {
    busyRef.current = value;
    setBusy(value);
  };

  useEffect(() => {
    selectedRef.current = selected?.id || null;
  }, [selected?.id]);

  const loadUsers = useCallback(async () => {
    if (!session) return;
    const { data, error: requestError } = await db.rpc("search_user_directory", {
      search_text: "",
      result_limit: 50,
    });
    if (requestError) return fail(requestError);
    setUsers((data || []).filter((user) => user.id !== session.user.id));
  }, [session, fail]);

  const loadConvos = useCallback(async () => {
    if (!session) return;

    const { data: memberships, error: membershipError } = await db
      .from("conversation_members")
      .select("conversation_id,user_id,role,left_at")
      .eq("user_id", session.user.id)
      .is("left_at", null);
    if (membershipError) return fail(membershipError);

    const ids = [...new Set((memberships || []).map((row) => row.conversation_id))];
    if (!ids.length) {
      setConvos([]);
      return;
    }

    const [{ data: conversations, error: conversationsError }, { data: allMembers, error: membersError }, { data: lastMessages, error: lastError }, { data: unreadRows, error: unreadError }] = await Promise.all([
      db.from("conversations").select("id,type,title,created_by,created_at,is_channel,is_public,description,channel_username,badge").in("id", ids),
      db.from("conversation_members").select("conversation_id,user_id,role,left_at").in("conversation_id", ids).is("left_at", null),
      db.from("messages").select("id,conversation_id,content,file_name,created_at,deleted_at,message_type").in("conversation_id", ids).order("created_at", { ascending: false }).limit(500),
      db.rpc("get_unread_counts", { p_conversation_ids: ids }),
    ]);

    if (conversationsError || membersError || lastError || unreadError) {
      return fail(conversationsError || membersError || lastError || unreadError);
    }

    const profileIds = [...new Set((allMembers || []).map((row) => row.user_id))];
    const { data: profiles, error: profileError } = profileIds.length
      ? await db.rpc("get_public_profiles", { p_user_ids: profileIds })
      : { data: [], error: null };
    if (profileError) return fail(profileError);

    const profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
    const memberMap = {};
    (allMembers || []).forEach((row) => {
      (memberMap[row.conversation_id] ||= []).push({ ...row, profile: profileMap[row.user_id] });
    });

    const lastMap = {};
    (lastMessages || []).forEach((message) => {
      if (!lastMap[message.conversation_id]) lastMap[message.conversation_id] = message;
    });

    const unreadMap = Object.fromEntries((unreadRows || []).map((row) => [row.conversation_id, row.unread_count]));
    setConvos(
      (conversations || [])
        .map((conversation) => ({
          ...conversation,
          memberList: memberMap[conversation.id] || [],
          last: lastMap[conversation.id],
          unread: Number(unreadMap[conversation.id] || 0),
        }))
        .sort((a, b) => new Date(b.last?.created_at || b.created_at) - new Date(a.last?.created_at || a.created_at)),
    );
  }, [session, fail]);

  const loadPublicCommunities = useCallback(async () => {
    if (!session) return;
    const { data, error: requestError } = await db.rpc("list_public_communities");
    if (requestError) return fail(requestError);
    setPublicCommunities(data || []);
  }, [session, fail]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      setMembers([]);
      return;
    }

    const [{ data, error: messageError }, { data: memberRows, error: memberError }] = await Promise.all([
      db.from("messages").select("id,conversation_id,sender_id,receiver_id,content,file_url,file_type,file_name,message_type,created_at,reactions,edited_at,deleted_at").eq("conversation_id", conversationId).order("created_at"),
      db.from("conversation_members").select("user_id,role,left_at").eq("conversation_id", conversationId).is("left_at", null),
    ]);
    if (messageError || memberError) return fail(messageError || memberError);

    const cleanMessages = [...new Map((data || []).map((message) => [message.id, message])).values()];
    setMessages(cleanMessages);

    const profileIds = [...new Set((memberRows || []).map((row) => row.user_id))];
    const { data: profiles, error: profileError } = profileIds.length
      ? await db.rpc("get_public_profiles", { p_user_ids: profileIds })
      : { data: [], error: null };
    if (profileError) return fail(profileError);

    const profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
    setMembers((memberRows || []).map((row) => ({ ...row, profile: profileMap[row.user_id] })));

    if (cleanMessages.length) {
      const { error: seenError } = await db.rpc("mark_messages_seen", {
        message_ids: cleanMessages.map((message) => message.id),
      });
      if (seenError) fail(seenError);
    }
  }, [fail]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: sessionError } = await db.auth.getSession();
      if (!alive) return;
      if (sessionError) {
        fail(sessionError);
        setLoading(false);
        return;
      }
      if (!data.session) {
        location.href = "/";
        return;
      }

      setSession(data.session);
      const { data: profileData, error: profileError } = await db.rpc("get_my_profile");
      if (!alive) return;
      if (profileError) {
        fail(profileError);
        setLoading(false);
        return;
      }

      const profile = Array.isArray(profileData) ? profileData[0] || null : profileData || null;
      const banned = Boolean(profile?.is_banned || (profile?.banned_until && new Date(profile.banned_until) > new Date()));
      if (banned) {
        await db.auth.signOut();
        location.href = "/";
        return;
      }

      setMe(profile);
      setLoading(false);
    })();

    const { data: authListener } = db.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") location.href = "/";
      if (nextSession && !session) setSession(nextSession);
    });

    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
    };
  }, [fail]);

  useEffect(() => {
    if (!session) return;
    loadUsers();
    loadConvos();
    loadPublicCommunities();
  }, [session, loadUsers, loadConvos, loadPublicCommunities]);

  useEffect(() => {
    loadMessages(selected?.id);
  }, [selected?.id, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteCode = params.get("invite");
    if (inviteCode) setInvite(inviteCode);
  }, []);

  useEffect(() => {
    if (!session) return undefined;

    const channel = db
      .channel(`utinochatv1:user:${session.user.id}:messages`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = payload.new || payload.old;
        const conversationId = row?.conversation_id;
        if (!conversationId) return;

        if (conversationId === selectedRef.current) {
          loadMessages(conversationId);
        }

        if (payload.eventType === "INSERT") {
          setConvos((current) =>
            current
              .map((conversation) =>
                conversation.id === conversationId
                  ? { ...conversation, last: row, unread: conversation.id === selectedRef.current || row.sender_id === session.user.id ? 0 : (conversation.unread || 0) + 1 }
                  : conversation,
              )
              .sort((a, b) => new Date(b.last?.created_at || b.created_at) - new Date(a.last?.created_at || a.created_at)),
          );
        }

        if (payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
          setConvos((current) => current.map((conversation) => (conversation.id === conversationId ? { ...conversation, last: row } : conversation)));
        }
      })
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [session, loadMessages]);

  useEffect(() => {
    const query = search.trim();
    if (!session || !query) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      const [{ data: userRows, error: userError }, { data: channelRows, error: channelError }] = await Promise.all([
        db.rpc("search_user_directory", { search_text: query, result_limit: 20 }),
        db.rpc("search_public_channels", { search_text: query }),
      ]);
      if (cancelled) return;
      if (userError || channelError) {
        fail(userError || channelError);
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      const usersFound = (userRows || []).map((user) => ({ ...user, _kind: "user" }));
      const channelsFound = (channelRows || []).filter((channel) => channel.is_public && channel.discoverable !== false).map((channel) => ({ ...channel, _kind: "community" }));
      const groupsFound = publicCommunities
        .filter((community) => !community.is_channel && `${community.title || ""} ${community.description || ""}`.toLowerCase().includes(query.toLowerCase()))
        .map((community) => ({ ...community, _kind: "community" }));
      setSearchResults([...usersFound, ...channelsFound, ...groupsFound].slice(0, 30));
      setSearchLoading(false);
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, session, publicCommunities, fail]);

  const mentionMatches = useMemo(() => {
    const match = text.match(/(?:^|\s)@([a-z0-9_]*)$/i);
    if (!match) return [];
    const q = match[1].toLowerCase();
    setTimeout(() => setMentionQuery(q), 0);
    return users.filter((user) => user.username.toLowerCase().startsWith(q)).slice(0, 6);
  }, [text, users]);

  const other = selected?.type === "direct"
    ? selected.memberList?.find((member) => member.user_id !== session?.user.id)?.profile
    : null;

  const title = selected?.is_channel
    ? selected.title
    : selected?.type === "group"
      ? selected.title
      : (other?.display_name || other?.username || "گفتگو");

  const canManageMembers = Boolean(
    selected &&
    selected.type === "group" &&
    members.some((member) => member.user_id === session?.user.id && ["owner", "admin"].includes(member.role)),
  );

  const mentionUsers = mentionMatches.length ? mentionMatches : (mentionQuery ? users.filter((user) => user.username.toLowerCase().startsWith(mentionQuery)).slice(0, 6) : []);

  function pickMention(user) {
    setText((current) => current.replace(/(?:^|\s)@[a-z0-9_]*$/i, (match) => `${match.startsWith(" ") ? " " : ""}@${user.username} `));
    inputRef.current?.focus();
  }

  async function openDirect(user) {
    if (busyRef.current) return;
    setBusySafe(true);
    setError("");
    const { data, error: requestError } = await db.rpc("get_or_create_direct_conversation", { other_user_id: user.id });
    if (requestError) {
      setBusySafe(false);
      return fail(requestError);
    }
    await loadConvos();
    setSelected({ id: data, type: "direct", memberList: [{ user_id: user.id, profile: user }] });
    setSearch("");
    setSearchResults([]);
    setBusySafe(false);
  }

  async function createGroup() {
    const name = groupName.trim();
    const description = groupDescription.trim();
    if (!name) return fail("invalid_title");
    if (name.length > 128) return fail("invalid_title");
    if (description.length > 1000) return fail("invalid_description");
    if (groupUsers.length > MAX_GROUP_MEMBERS) return fail("too_many_members");
    if (busyRef.current) return;

    setBusySafe(true);
    const { data, error: requestError } = await db.rpc("create_conversation", {
      p_kind: "group",
      p_title: name,
      p_description: description,
      p_is_public: groupPublic,
      p_username: null,
      p_member_ids: groupUsers,
    });
    if (requestError) {
      setBusySafe(false);
      return fail(requestError);
    }

    const createdId = data;
    setCreate(null);
    setGroupName("");
    setGroupDescription("");
    setGroupPublic(false);
    setGroupUsers([]);
    await loadConvos();
    await loadPublicCommunities();
    setSelected({ id: createdId, type: "group", title: name, is_public: groupPublic });

    if (!groupPublic) {
      const { data: token, error: inviteError } = await db.rpc("get_conversation_invite", { conversation_uuid: createdId });
      if (!inviteError && token) setInviteLink(`${location.origin}/messenger/?invite=${encodeURIComponent(token)}`);
    }
    setBusySafe(false);
  }

  async function createChannel() {
    const form = channelForm;
    const name = form.title.trim();
    const username = form.username.trim().toLowerCase();
    const description = form.description.trim();
    if (!name) return fail("invalid_title");
    if (name.length > 128) return fail("invalid_title");
    if (description.length > 1000) return fail("invalid_description");
    if (form.public && !username) return fail("username_required_for_public_channel");
    if (!form.public && username) return fail("private_channel_username_not_allowed");
    if (username && !USERNAME_RE.test(username)) return fail("invalid_channel_username");
    if (busyRef.current) return;

    setBusySafe(true);
    const { data, error: requestError } = await db.rpc("create_conversation", {
      p_kind: "channel",
      p_title: name,
      p_description: description,
      p_is_public: form.public,
      p_username: username || null,
      p_member_ids: [],
    });
    if (requestError) {
      setBusySafe(false);
      return fail(requestError);
    }

    const createdId = data;
    setCreate(null);
    setChannelForm({ title: "", username: "", description: "", public: true });
    await loadConvos();
    await loadPublicCommunities();
    setSelected({ id: createdId, type: "group", is_channel: true, title: name, channel_username: username, is_public: form.public });

    if (!form.public) {
      const { data: token, error: inviteError } = await db.rpc("get_conversation_invite", { conversation_uuid: createdId });
      if (!inviteError && token) setInviteLink(`${location.origin}/messenger/?invite=${encodeURIComponent(token)}`);
    }
    setBusySafe(false);
  }

  async function joinPublic(id) {
    if (!id || busyRef.current) return;
    setBusySafe(true);
    const { data, error: requestError } = await db.rpc("join_conversation", { p_conversation_id: id });
    if (requestError) {
      setBusySafe(false);
      return fail(requestError);
    }
    await loadConvos();
    const found = publicCommunities.find((community) => community.id === id) || searchResults.find((item) => item.id === id);
    setSelected({ id: data, type: "group", is_channel: !!found?.is_channel, title: found?.title || "", channel_username: found?.channel_username || null, is_public: true });
    setSearch("");
    setSearchResults([]);
    setBusySafe(false);
  }

  async function joinInvite() {
    const code = invite.trim();
    if (!code || code.length < 32 || code.length > 128) return fail("invalid_invite");
    if (busyRef.current) return;
    setBusySafe(true);
    const { data, error: requestError } = await db.rpc("join_via_invite", { invite_code: code });
    if (requestError) {
      setBusySafe(false);
      return fail(requestError);
    }
    history.replaceState({}, "", location.pathname);
    setInvite("");
    await loadConvos();
    const found = convos.find((conversation) => conversation.id === data);
    setSelected(found || { id: data, type: "group" });
    setBusySafe(false);
  }

  async function send() {
    const value = text.trim();
    if (!value || !selected || busyRef.current || value.length > MAX_MESSAGE_LENGTH) {
      if (value.length > MAX_MESSAGE_LENGTH) fail("invalid_message");
      return;
    }

    setBusySafe(true);
    setError("");
    const { data: inserted, error: requestError } = await db
      .from("messages")
      .insert({
        conversation_id: selected.id,
        sender_id: session.user.id,
        receiver_id: selected.type === "direct" ? other?.id : null,
        content: value,
        message_type: "text",
        reactions: {},
      })
      .select("id")
      .single();

    if (requestError) {
      setBusySafe(false);
      return fail(requestError);
    }

    const mentionedUsernames = [...new Set(value.match(/@[a-z0-9_]{3,20}/gi) || [])]
      .map((item) => item.slice(1).toLowerCase());
    if (inserted?.id && mentionedUsernames.length) {
      const mentionedIds = users.filter((user) => mentionedUsernames.includes(user.username.toLowerCase())).map((user) => user.id);
      if (mentionedIds.length) {
        const { error: mentionError } = await db.from("message_mentions").insert(
          mentionedIds.map((userId) => ({ message_id: inserted.id, user_id: userId })),
        );
        if (mentionError) fail(mentionError);
      }
    }

    setText("");
    setMentionQuery("");
    await loadMessages(selected.id);
    setConvos((current) => current.map((conversation) => (conversation.id === selected.id ? { ...conversation, unread: 0 } : conversation)));
    setBusySafe(false);
    inputRef.current?.focus();
  }

  async function uploadFile(file) {
    if (!file || !selected || uploading || busyRef.current) return;
    if (file.size > MAX_FILE_SIZE) return fail("file_too_large");
    if (!ALLOWED_FILE_TYPES.has(file.type)) return fail("file_type_not_allowed");

    setUploading(true);
    setError("");
    try {
      const path = `${session.user.id}/${selected.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: uploadError } = await db.storage.from("chat-files").upload(path, file, {
        upsert: false,
        contentType: file.type,
        cacheControl: "3600",
      });
      if (uploadError) throw uploadError;

      const { error: messageError } = await db.from("messages").insert({
        conversation_id: selected.id,
        sender_id: session.user.id,
        receiver_id: selected.type === "direct" ? other?.id : null,
        content: null,
        file_url: path,
        file_type: file.type,
        file_name: file.name.slice(0, 120),
        message_type: "file",
        reactions: {},
      });
      if (messageError) {
        await db.storage.from("chat-files").remove([path]);
        throw messageError;
      }

      await loadMessages(selected.id);
      await loadConvos();
    } catch (requestError) {
      fail(requestError);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function downloadFile(message) {
    if (!message?.file_url || busyRef.current) return;
    setBusySafe(true);
    const { data, error: requestError } = await db.storage.from("chat-files").createSignedUrl(message.file_url, 60);
    setBusySafe(false);
    if (requestError) return fail(requestError);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    else fail("file_unavailable");
  }

  async function editMessage() {
    const value = edit?.content?.trim() || "";
    if (!value || value.length > MAX_MESSAGE_LENGTH) return fail("invalid_message");
    if (busyRef.current) return;
    setBusySafe(true);
    const { error: requestError } = await db.rpc("edit_message", { message_uuid: edit.id, new_content: value });
    setBusySafe(false);
    if (requestError) return fail(requestError);
    setEdit(null);
    await loadMessages(selected.id);
  }

  async function deleteMessage(message) {
    if (!message || busyRef.current) return;
    if (!window.confirm("این پیام حذف شود؟")) return;
    setBusySafe(true);
    const { error: requestError } = await db.rpc("delete_message", { message_uuid: message.id });
    setBusySafe(false);
    if (requestError) return fail(requestError);
    await loadMessages(selected.id);
  }

  async function openInviteManager() {
    if (!selected?.id) return;
    setBusySafe(true);
    const { data: token, error: requestError } = await db.rpc("get_conversation_invite", { conversation_uuid: selected.id });
    setBusySafe(false);
    if (requestError) return fail(requestError);
    if (token) setInviteLink(`${location.origin}/messenger/?invite=${encodeURIComponent(token)}`);
  }

  async function regenerateInvite() {
    if (!selected?.id || busyRef.current) return;
    setBusySafe(true);
    const { data: token, error: requestError } = await db.rpc("regenerate_conversation_invite", { conversation_uuid: selected.id });
    setBusySafe(false);
    if (requestError) return fail(requestError);
    if (token) setInviteLink(`${location.origin}/messenger/?invite=${encodeURIComponent(token)}`);
  }

  async function addMember(userId) {
    if (!selected?.id || !canManageMembers || busyRef.current) return;
    setBusySafe(true);
    const { error: requestError } = await db.rpc("add_conversation_member", { conversation_uuid: selected.id, user_uuid: userId });
    setBusySafe(false);
    if (requestError) return fail(requestError);
    await loadMessages(selected.id);
    setNotice("عضو با موفقیت اضافه شد.");
  }

  async function removeMember(userId) {
    if (!selected?.id || !canManageMembers || busyRef.current) return;
    if (!window.confirm("این عضو از گفتگو حذف شود؟")) return;
    setBusySafe(true);
    const { error: requestError } = await db.rpc("remove_conversation_member", { conversation_uuid: selected.id, user_uuid: userId });
    setBusySafe(false);
    if (requestError) return fail(requestError);
    await loadMessages(selected.id);
    setNotice("عضو حذف شد.");
  }

  if (loading) {
    return (
      <main className="uc-shell is-dark">
        <div className="uc-loading">در حال بارگذاری UTINOCHATV1…</div>
      </main>
    );
  }

  return (
    <main className={`uc-shell is-dark ${selected ? "chat-open" : "sidebar-open"}`} dir="rtl">
      <aside className="uc-sidebar" aria-label="فهرست گفتگوها">
        <div className="uc-sidebar-head">
          <button className="uc-brand" type="button" onClick={() => setSelected(null)} aria-label="صفحه اصلی UTINOCHATV1">
            <span className="uc-brand-mark">U</span>
            <span>UTINOCHATV1</span>
          </button>
        </div>

        <div className="uc-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="جستجوی کاربر، گروه یا کانال"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جستجوی کاربر، گروه یا کانال"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {search.trim() && (
          <div className="uc-search-results" role="region" aria-label="نتایج جستجو">
            {searchLoading && <div className="uc-empty-mini">در حال جستجو…</div>}
            {!searchLoading && searchResults.map((item) => (
              <div className="uc-search-card" key={`${item._kind}-${item.id}`}>
                <Avatar user={item._kind === "user" ? item : null} group={item._kind === "community" && !item.is_channel} channel={item._kind === "community" && !!item.is_channel} />
                <div className="uc-search-main">
                  <strong>{item._kind === "user" ? item.display_name : item.title} {item._kind === "user" && <Badge value={item.verification} />}</strong>
                  <span>{item._kind === "user" ? `@${item.username} · ${item.public_id}` : item.is_channel ? `@${item.channel_username || ""}` : "گروه عمومی"}</span>
                </div>
                {item._kind === "user" ? (
                  <button type="button" onClick={() => openDirect(item)} disabled={busy}>پیام</button>
                ) : (
                  <button type="button" onClick={() => joinPublic(item.id)} disabled={busy}>عضویت</button>
                )}
              </div>
            ))}
            {!searchLoading && !searchResults.length && <div className="uc-empty-mini">نتیجه‌ای پیدا نشد</div>}
          </div>
        )}

        <div className="uc-sidebar-tools">
          <button className="uc-new-group" type="button" onClick={() => setCreate("menu")} disabled={busy}>＋ جدید</button>
        </div>

        <div className="uc-section-label">گفت‌وگوها</div>
        <div className="uc-chat-list">
          {convos.length === 0 && <div className="uc-empty-mini">هنوز گفتگویی نداری. از «＋ جدید» شروع کن.</div>}
          {convos.map((conversation) => {
            const directUser = conversation.type === "direct"
              ? conversation.memberList?.find((member) => member.user_id !== session.user.id)?.profile
              : null;
            const name = conversation.is_channel
              ? conversation.title
              : conversation.type === "group"
                ? conversation.title
                : (directUser?.display_name || directUser?.username || "گفتگو");
            return (
              <button
                className={`uc-chat-row ${selected?.id === conversation.id ? "active" : ""}`}
                key={conversation.id}
                type="button"
                onClick={() => setSelected(conversation)}
              >
                <Avatar user={directUser} group={conversation.type === "group" && !conversation.is_channel} channel={!!conversation.is_channel} />
                <span className="uc-chat-copy">
                  <strong>{name} <Badge value={conversation.badge || directUser?.verification} /></strong>
                  <small>{conversation.last?.deleted_at ? "این پیام حذف شده است." : (conversation.last?.content || conversation.last?.file_name || "")}</small>
                </span>
                {conversation.unread > 0 && <span className="uc-unread-badge" aria-label={`${conversation.unread} پیام خوانده‌نشده`}>{conversation.unread > 99 ? "99+" : conversation.unread}</span>}
              </button>
            );
          })}
        </div>

        <div className="uc-sidebar-foot">
          <button type="button" onClick={() => setSupportOpen(true)}>
            <Avatar user={{ display_name: "پشتیبانی" }} />
            <span><strong>پشتیبانی رسمی <Badge value="blue" /></strong><small>@support</small></span>
          </button>
          {me?.role === "admin" && <button type="button" aria-label="مدیریت" onClick={() => location.href = "/admin/"}>⚙</button>}
        </div>
      </aside>

      <section className="uc-chat">
        {!selected ? (
          <div className="uc-welcome">
            <div className="uc-welcome-mark">U</div>
            <h1>UTINOCHATV1</h1>
            <p>پیام‌رسان سریع، خصوصی و مدرن</p>
            <div className="uc-welcome-actions">
              <button type="button" onClick={() => setCreate("menu")}>＋ ساخت گروه یا کانال</button>
              <button type="button" onClick={() => setSupportOpen(true)}>پشتیبانی</button>
            </div>
          </div>
        ) : (
          <>
            <header className="uc-chat-head">
              <button className="uc-mobile-back" type="button" onClick={() => setSelected(null)} aria-label="بازگشت به فهرست گفتگوها">‹</button>
              <button className="uc-chat-head-profile" type="button" onClick={() => setDetailsOpen(true)} aria-label="جزئیات گفتگو">
                <Avatar user={other} group={selected.type === "group" && !selected.is_channel} channel={!!selected.is_channel} />
                <span className="uc-chat-title">
                  <strong>{title} <Badge value={selected.badge || other?.verification} /></strong>
                  <span>{selected.is_channel ? `@${selected.channel_username || "خصوصی"}` : selected.type === "group" ? `${members.length} عضو` : `@${other?.username || ""}`}</span>
                </span>
              </button>
              <button className="uc-chat-head-action" type="button" onClick={() => setDetailsOpen(true)} aria-label="جزئیات">⋮</button>
            </header>

            <div className="uc-message-area" aria-live="polite">
              {!messages.length && (
                <div className="uc-no-messages">
                  <div>U</div>
                  <strong>هنوز پیامی نیست</strong>
                  <span>اولین پیام این گفتگو را بفرست.</span>
                </div>
              )}
              {messages.map((message) => {
                const mine = message.sender_id === session.user.id;
                return (
                  <div className={`uc-message-line ${mine ? "mine" : "theirs"}`} key={message.id}>
                    <div className="uc-message-wrap">
                      <div className="uc-bubble">
                        {message.deleted_at ? (
                          <div className="uc-message-text muted">این پیام حذف شده است.</div>
                        ) : message.message_type === "file" ? (
                          <div className="uc-file-message">
                            <strong>{message.file_name || "فایل"}</strong>
                            <small>{message.file_type || ""}</small>
                            <button type="button" onClick={() => downloadFile(message)} disabled={busy}>دریافت فایل</button>
                          </div>
                        ) : (
                          <div className="uc-message-text">{message.content}</div>
                        )}
                        <div className="uc-message-meta">
                          <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</time>
                          {message.edited_at && !message.deleted_at && <small>ویرایش‌شده</small>}
                          {!message.deleted_at && (mine || me?.role === "admin") && (
                            <span className="uc-msg-actions">
                              {message.message_type === "text" && <button type="button" onClick={() => setEdit({ id: message.id, content: message.content || "" })}>ویرایش</button>}
                              <button type="button" onClick={() => deleteMessage(message)}>حذف</button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="uc-composer-area">
              {error && <div className="uc-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="بستن خطا">×</button></div>}
              {notice && <div className="uc-upload-status" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="بستن">×</button></div>}
              {mentionUsers.length > 0 && (
                <div className="uc-mention-menu" role="listbox" aria-label="پیشنهاد نام کاربری">
                  {mentionUsers.map((user) => (
                    <button type="button" key={user.id} onClick={() => pickMention(user)}>
                      <Avatar user={user} />
                      <span><strong>@{user.username}</strong><small>{user.display_name}</small></span>
                    </button>
                  ))}
                </div>
              )}
              <div className="uc-composer">
                <input
                  ref={inputRef}
                  value={text}
                  maxLength={MAX_MESSAGE_LENGTH}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="پیامت را بنویس…"
                  aria-label="پیام"
                  autoComplete="off"
                />
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm"
                  onChange={(event) => uploadFile(event.target.files?.[0])}
                />
                <button type="button" className="uc-attach" onClick={() => fileRef.current?.click()} disabled={busy || uploading} aria-label="پیوست فایل">＋</button>
                <button type="button" className="uc-send" onClick={send} disabled={busy || uploading || !text.trim()} aria-label="ارسال پیام">➤</button>
              </div>
              {uploading && <div className="uc-upload-status" role="status">در حال بارگذاری فایل…</div>}
            </div>
          </>
        )}
      </section>

      {invite && (
        <Modal title="ورود با لینک دعوت" onClose={() => setInvite("")}>
          <div className="uc-dialog-body">
            <p>این لینک دعوت برای یک گروه یا کانال خصوصی است.</p>
            <button className="primary" type="button" disabled={busy} onClick={joinInvite}>{busy ? "در حال ورود…" : "عضویت"}</button>
          </div>
        </Modal>
      )}

      {inviteLink && (
        <Modal title="لینک دعوت آماده است" onClose={() => setInviteLink("")}>
          <div className="uc-dialog-body">
            <p>این لینک را فقط با افرادی که می‌خواهی وارد شوند به اشتراک بگذار.</p>
            <input className="uc-invite-input" dir="ltr" readOnly value={inviteLink} onFocus={(event) => event.target.select()} />
            <div className="uc-dialog-actions">
              <button type="button" className="primary" onClick={async () => { try { await navigator.clipboard.writeText(inviteLink); setNotice("لینک دعوت کپی شد."); } catch { fail("network"); } }}>کپی لینک</button>
              <button type="button" onClick={() => setInviteLink("")}>بستن</button>
            </div>
          </div>
        </Modal>
      )}

      {create && (
        <Modal title={create === "menu" ? "ساخت جدید" : create === "group" ? "گروه جدید" : "کانال جدید"} onClose={() => setCreate(null)}>
          {create === "menu" ? (
            <div className="uc-create-menu">
              <button type="button" onClick={() => setCreate("group")}><span className="uc-create-icon">G</span><strong>گروه</strong><small>عمومی یا خصوصی، با دعوت و مدیریت اعضا</small></button>
              <button type="button" onClick={() => setCreate("channel")}><span className="uc-create-icon">C</span><strong>کانال</strong><small>انتشار عمومی یا خصوصی</small></button>
            </div>
          ) : create === "group" ? (
            <div className="uc-group-form">
              <label>نام گروه<input autoFocus maxLength={128} value={groupName} onChange={(event) => setGroupName(event.target.value)} /></label>
              <label>توضیحات<textarea maxLength={1000} value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} /></label>
              <label className="uc-check"><input type="checkbox" checked={groupPublic} onChange={(event) => setGroupPublic(event.target.checked)} /> عمومی و قابل جستجو</label>
              <p className="uc-form-hint">{groupPublic ? "گروه عمومی در جستجو نمایش داده می‌شود و قابل عضویت است." : "گروه خصوصی در جستجو نمایش داده نمی‌شود و فقط با لینک دعوت قابل ورود است."}</p>
              <div className="uc-group-user-list">
                {users.slice(0, 60).map((user) => (
                  <button type="button" key={user.id} className={groupUsers.includes(user.id) ? "selected" : ""} onClick={() => setGroupUsers((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : current.length < MAX_GROUP_MEMBERS ? [...current, user.id] : current)}>
                    <Avatar user={user} />
                    <span>{user.display_name}<small>@{user.username}</small></span>
                    <b>{groupUsers.includes(user.id) ? "✓" : "＋"}</b>
                  </button>
                ))}
              </div>
              <button className="primary" type="button" disabled={busy || !groupName.trim()} onClick={createGroup}>{busy ? "در حال ساخت…" : "ساخت گروه"}</button>
            </div>
          ) : (
            <div className="uc-group-form">
              <label>نام کانال<input autoFocus maxLength={128} value={channelForm.title} onChange={(event) => setChannelForm({ ...channelForm, title: event.target.value })} /></label>
              <label>شناسه عمومی<input dir="ltr" disabled={!channelForm.public} maxLength={20} value={channelForm.username} onChange={(event) => setChannelForm({ ...channelForm, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder={channelForm.public ? "mychannel" : "برای کانال خصوصی لازم نیست"} /></label>
              <label>توضیحات<textarea maxLength={1000} value={channelForm.description} onChange={(event) => setChannelForm({ ...channelForm, description: event.target.value })} /></label>
              <label className="uc-check"><input type="checkbox" checked={channelForm.public} onChange={(event) => setChannelForm({ ...channelForm, public: event.target.checked, username: event.target.checked ? event.target.value : "" })} /> عمومی و قابل جستجو</label>
              <p className="uc-form-hint">{channelForm.public ? "کانال عمومی باید یک شناسه عمومی یکتا داشته باشد." : "کانال خصوصی قابل Discover نیست و با لینک دعوت مدیریت می‌شود."}</p>
              <button className="primary" type="button" disabled={busy || !channelForm.title.trim() || (channelForm.public && !channelForm.username.trim())} onClick={createChannel}>{busy ? "در حال ساخت…" : "ساخت کانال"}</button>
            </div>
          )}
        </Modal>
      )}

      {detailsOpen && selected && (
        <Modal title="جزئیات گفتگو" onClose={() => setDetailsOpen(false)} className="uc-details-modal">
          <div className="uc-details-body">
            <div className="uc-details-hero">
              <Avatar user={other} group={selected.type === "group" && !selected.is_channel} channel={!!selected.is_channel} />
              <strong>{title}</strong>
              <span>{selected.is_channel ? `@${selected.channel_username || "خصوصی"}` : selected.type === "group" ? `${members.length} عضو` : `@${other?.username || ""}`}</span>
            </div>
            {selected.description && <p className="uc-details-description">{selected.description}</p>}
            {(selected.is_public === false || selected.type === "group") && (canManageMembers || selected.is_public === false) && (
              <div className="uc-details-actions">
                {selected.is_public === false && <button type="button" onClick={openInviteManager} disabled={busy}>لینک دعوت</button>}
                {selected.is_public === false && canManageMembers && <button type="button" onClick={regenerateInvite} disabled={busy}>ساخت لینک جدید</button>}
              </div>
            )}
            {selected.type === "group" && (
              <div className="uc-member-section">
                <div className="uc-member-heading"><strong>اعضا</strong><span>{members.length}</span></div>
                <div className="uc-member-list">
                  {members.map((member) => (
                    <div className="uc-member-row" key={member.user_id}>
                      <Avatar user={member.profile} />
                      <span><strong>{member.profile?.display_name || member.profile?.username || "کاربر"}</strong><small>@{member.profile?.username || ""} · {member.role === "owner" ? "مالک" : member.role === "admin" ? "مدیر" : "عضو"}</small></span>
                      {canManageMembers && member.user_id !== session.user.id && member.role !== "owner" && <button type="button" onClick={() => removeMember(member.user_id)} disabled={busy}>حذف</button>}
                    </div>
                  ))}
                </div>
                {canManageMembers && (
                  <div className="uc-add-member-list">
                    <div className="uc-member-heading"><strong>افزودن عضو</strong></div>
                    {users.filter((user) => !members.some((member) => member.user_id === user.id)).slice(0, 8).map((user) => (
                      <button type="button" key={user.id} onClick={() => addMember(user.id)} disabled={busy}><Avatar user={user} /><span>@{user.username}</span><b>＋</b></button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {supportOpen && (
        <Modal title="پشتیبانی رسمی" onClose={() => setSupportOpen(false)}>
          <div className="uc-support">
            <h2>@support <Badge value="blue" /></h2>
            <p>پشتیبانی رسمی UTINOCHATV1</p>
            <a href="https://t.me/parhamsoleimanybot" target="_blank" rel="noreferrer">تلگرام پشتیبانی</a>
            <a href="https://utino.org/chat/supportusername" target="_blank" rel="noreferrer">پشتیبانی در Utino</a>
            <a href="https://utino.org" target="_blank" rel="noreferrer">Utino</a>
            <a href="https://wdner.co" target="_blank" rel="noreferrer">WDNER</a>
            <a href="https://iparham.com" target="_blank" rel="noreferrer">iParham</a>
          </div>
        </Modal>
      )}

      {edit && (
        <Modal title="ویرایش پیام" onClose={() => setEdit(null)}>
          <div className="uc-dialog-body">
            <textarea autoFocus maxLength={MAX_MESSAGE_LENGTH} value={edit.content} onChange={(event) => setEdit({ ...edit, content: event.target.value })} />
            <button className="primary" type="button" disabled={busy || !edit.content.trim()} onClick={editMessage}>ذخیره ویرایش</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
