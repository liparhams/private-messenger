import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { USERNAME_RE } from "@/lib/utils";

export type Role = "user" | "support" | "admin";

export type Profile = {
  userId: string;
  username: string;
  displayName: string;
  publicId: string;
  role: Role;
  verified: boolean;
  avatarHue: number;
  banned: boolean;
  bannedUntil: string | null;
  bio: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  kind: "direct" | "group" | "channel";
  title: string | null;
  username: string | null;
  description: string | null;
  isPublic: boolean;
  discoverable: boolean;
  ownerId: string;
  memberRole: string | null;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
  peer?: Profile | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  body: string;
  editedAt: string | null;
  deletedAt: string | null;
  attachmentName: string | null;
  attachmentMime: string | null;
  attachmentSize: number | null;
  createdAt: string;
  seenBy: { readerId: string; displayName: string; readAt: string }[];
};

function nid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function publicId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function fail(code: string): never {
  throw new Error(code);
}

function mapProfile(r: Record<string, unknown>): Profile {
  return {
    userId: String(r.user_id),
    username: String(r.username),
    displayName: String(r.display_name),
    publicId: String(r.public_id),
    role: (r.role as Role) || "user",
    verified: Boolean(r.verified),
    avatarHue: Number(r.avatar_hue ?? 200),
    banned: Boolean(r.banned),
    bannedUntil: r.banned_until ? String(r.banned_until) : null,
    bio: r.bio ? String(r.bio) : null,
    createdAt: String(r.created_at),
  };
}

async function getProfile(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql`select * from profiles where user_id = ${userId} limit 1`;
  return rows[0] ? mapProfile(rows[0]) : null;
}

async function requireProfile(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const p = await getProfile(sql, userId);
  if (!p) fail("not_authenticated");
  if (p.banned) {
    if (!p.bannedUntil || new Date(p.bannedUntil).getTime() > Date.now()) fail("banned");
  }
  return p;
}

async function isMember(sql: Awaited<ReturnType<typeof getSql>>, convId: string, userId: string) {
  const rows = await sql`
    select member_role from conversation_members
    where conversation_id = ${convId} and user_id = ${userId} limit 1`;
  return rows[0] ? String(rows[0].member_role) : null;
}

async function logAdmin(sql: Awaited<ReturnType<typeof getSql>>, actor: string, action: string, target?: string, meta?: string) {
  await sql`
    insert into admin_logs (id, actor_id, action, target, meta)
    values (${nid("log")}, ${actor}, ${action}, ${target ?? null}, ${meta ?? null})`;
}

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql`select registration_enabled from app_settings where id = 1`;
  return { registrationEnabled: Boolean(rows[0]?.registration_enabled ?? true) };
});

const bootstrapSchema = z.object({
  username: z.string().optional(),
  displayName: z.string().min(1).max(80).optional(),
});

export const bootstrapProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => bootstrapSchema.parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await getProfile(sql, context.userId);
    if (existing) return existing;

    const settings = await sql`select registration_enabled from app_settings where id = 1`;
    if (settings[0] && !settings[0].registration_enabled) fail("registration_disabled");

    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const session = await getSessionUser();
    const email = session?.email ?? "";
    let username = (data.username || email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    if (!USERNAME_RE.test(username)) username = `u_${nid("u").slice(-8)}`;

    const clash = await sql`select 1 from profiles where username = ${username} limit 1`;
    if (clash.length) fail("username_exists");

    const displayName = (data.displayName || session?.email?.split("@")[0] || username).slice(0, 80);
    let role: Role = "user";
    if (username === "parham") role = "admin";
    if (username === "support") role = "support";

    const hue = Math.floor(Math.random() * 360);
    const pid = publicId();
    await sql`
      insert into profiles (user_id, username, display_name, public_id, role, avatar_hue)
      values (${context.userId}, ${username}, ${displayName}, ${pid}, ${role}, ${hue})`;
    const created = await requireProfile(sql, context.userId);
    return created;
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return getProfile(sql, context.userId);
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      displayName: z.string().min(1).max(80).optional(),
      bio: z.string().max(280).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    if (data.displayName) {
      await sql`update profiles set display_name = ${data.displayName} where user_id = ${context.userId}`;
    }
    if (data.bio !== undefined) {
      await sql`update profiles set bio = ${data.bio} where user_id = ${context.userId}`;
    }
    return requireProfile(sql, context.userId);
  });

export const searchDirectory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ q: z.string().max(80) }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const q = data.q.trim().toLowerCase();
    if (!q) return { people: [] as Profile[], channels: [] as Conversation[] };
    const like = `%${q}%`;
    const people = await sql`
      select * from profiles
      where user_id <> ${context.userId}
        and (username ilike ${like} or lower(display_name) ilike ${like} or public_id ilike ${like})
      order by username
      limit 20`;
    const channels = await sql`
      select * from conversations
      where discoverable = true and is_public = true and kind = 'channel'
        and (coalesce(username,'') ilike ${like} or coalesce(title,'') ilike ${like})
      limit 12`;
    return {
      people: people.map(mapProfile),
      channels: channels.map((c) => ({
        id: String(c.id),
        kind: "channel" as const,
        title: c.title ? String(c.title) : null,
        username: c.username ? String(c.username) : null,
        description: c.description ? String(c.description) : null,
        isPublic: true,
        discoverable: true,
        ownerId: String(c.owner_id),
        memberRole: null,
        lastBody: null,
        lastAt: null,
        unread: 0,
      })),
    };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    const rows = await sql`
      select c.*, m.member_role,
        (select body from messages where conversation_id = c.id and deleted_at is null order by created_at desc limit 1) as last_body,
        (select created_at from messages where conversation_id = c.id order by created_at desc limit 1) as last_at
      from conversations c
      join conversation_members m on m.conversation_id = c.id
      where m.user_id = ${context.userId}
      order by coalesce(
        (select created_at from messages where conversation_id = c.id order by created_at desc limit 1),
        c.created_at
      ) desc`;

    const out: Conversation[] = [];
    for (const c of rows) {
      let peer: Profile | null = null;
      if (c.kind === "direct") {
        const others = await sql`
          select p.* from conversation_members cm
          join profiles p on p.user_id = cm.user_id
          where cm.conversation_id = ${c.id} and cm.user_id <> ${context.userId}
          limit 1`;
        peer = others[0] ? mapProfile(others[0]) : null;
      }
      const unreadRows = await sql`
        select count(*)::int as n from messages msg
        where msg.conversation_id = ${c.id}
          and msg.sender_id <> ${context.userId}
          and msg.deleted_at is null
          and not exists (
            select 1 from message_reads r where r.message_id = msg.id and r.reader_id = ${context.userId}
          )`;
      out.push({
        id: String(c.id),
        kind: c.kind as Conversation["kind"],
        title: c.title ? String(c.title) : peer?.displayName ?? null,
        username: c.username ? String(c.username) : peer?.username ?? null,
        description: c.description ? String(c.description) : null,
        isPublic: Boolean(c.is_public),
        discoverable: Boolean(c.discoverable),
        ownerId: String(c.owner_id),
        memberRole: String(c.member_role),
        lastBody: c.last_body ? String(c.last_body) : null,
        lastAt: c.last_at ? String(c.last_at) : null,
        unread: Number(unreadRows[0]?.n ?? 0),
        peer,
      });
    }
    void me;
    return out;
  });

export const openDirect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ userId: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    if (data.userId === context.userId) fail("unknown");
    const other = await getProfile(sql, data.userId);
    if (!other) fail("not_found");
    const pair = [context.userId, data.userId].sort().join(":");
    const existing = await sql`select id from conversations where pair_key = ${pair} limit 1`;
    if (existing[0]) return { id: String(existing[0].id) };
    const id = nid("c");
    await sql`
      insert into conversations (id, kind, owner_id, pair_key, is_public, discoverable)
      values (${id}, 'direct', ${context.userId}, ${pair}, false, false)`;
    await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${id}, ${context.userId}, 'member')`;
    await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${id}, ${data.userId}, 'member')`;
    return { id };
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(80),
      description: z.string().max(280).optional(),
      isPublic: z.boolean(),
      memberIds: z.array(z.string()).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const id = nid("g");
    await sql`
      insert into conversations (id, kind, title, description, is_public, discoverable, owner_id)
      values (${id}, 'group', ${data.title}, ${data.description ?? ""}, ${data.isPublic}, ${data.isPublic}, ${context.userId})`;
    await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${id}, ${context.userId}, 'owner')`;
    for (const uid of data.memberIds ?? []) {
      if (uid === context.userId) continue;
      const p = await getProfile(sql, uid);
      if (p) {
        await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${id}, ${uid}, 'member') on conflict do nothing`;
      }
    }
    return { id };
  });

export const createChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(80),
      username: z.string().min(3).max(20),
      description: z.string().max(280).optional(),
      isPublic: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const uname = data.username.toLowerCase();
    if (!USERNAME_RE.test(uname)) fail("invalid_username");
    const clash = await sql`select 1 from conversations where username = ${uname} limit 1`;
    if (clash.length) fail("username_taken");
    const id = nid("ch");
    await sql`
      insert into conversations (id, kind, title, username, description, is_public, discoverable, owner_id)
      values (${id}, 'channel', ${data.title}, ${uname}, ${data.description ?? ""}, ${data.isPublic}, ${data.isPublic}, ${context.userId})`;
    await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${id}, ${context.userId}, 'owner')`;
    return { id };
  });

export const joinPublic = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ conversationId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const conv = await sql`select * from conversations where id = ${data.conversationId} limit 1`;
    if (!conv[0]) fail("not_found");
    if (!conv[0].is_public) fail("conversation_private");
    const already = await isMember(sql, data.conversationId, context.userId);
    if (already) return { id: data.conversationId };
    await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${data.conversationId}, ${context.userId}, 'member')`;
    return { id: data.conversationId };
  });

export const createInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ conversationId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const role = await isMember(sql, data.conversationId, context.userId);
    if (!role || (role !== "owner" && role !== "admin")) fail("permission_denied");
    const code = nid("inv").slice(4);
    await sql`insert into invites (code, conversation_id, created_by) values (${code}, ${data.conversationId}, ${context.userId})`;
    return { code };
  });

export const joinInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ code: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const inv = await sql`select * from invites where code = ${data.code} limit 1`;
    if (!inv[0]) fail("invite_invalid");
    const cid = String(inv[0].conversation_id);
    const already = await isMember(sql, cid, context.userId);
    if (!already) {
      await sql`insert into conversation_members (conversation_id, user_id, member_role) values (${cid}, ${context.userId}, 'member')`;
    }
    return { id: cid };
  });

export const listMembers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ conversationId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const role = await isMember(sql, data.conversationId, context.userId);
    if (!role) fail("permission_denied");
    const rows = await sql`
      select p.*, cm.member_role
      from conversation_members cm
      join profiles p on p.user_id = cm.user_id
      where cm.conversation_id = ${data.conversationId}
      order by cm.joined_at`;
    return rows.map((r) => ({ ...mapProfile(r), memberRole: String(r.member_role) }));
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ conversationId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const role = await isMember(sql, data.conversationId, context.userId);
    const me = await getProfile(sql, context.userId);
    if (!role && me?.role !== "support" && me?.role !== "admin") fail("permission_denied");
    const rows = await sql`
      select msg.*, p.display_name as sender_name, p.username as sender_username
      from messages msg
      join profiles p on p.user_id = msg.sender_id
      where msg.conversation_id = ${data.conversationId}
      order by msg.created_at asc
      limit 400`;
    const reads = await sql<{
      message_id: string;
      reader_id: string;
      display_name: string;
      read_at: string;
    }>`
      select r.message_id, r.reader_id, p.display_name, r.read_at
      from message_reads r
      join profiles p on p.user_id = r.reader_id
      join messages m on m.id = r.message_id
      where m.conversation_id = ${data.conversationId}`;
    const byMsg = new Map<string, Message["seenBy"]>();
    for (const r of reads) {
      const list = byMsg.get(r.message_id) ?? [];
      list.push({ readerId: r.reader_id, displayName: r.display_name, readAt: String(r.read_at) });
      byMsg.set(r.message_id, list);
    }
    return rows.map((r) => ({
      id: String(r.id),
      conversationId: String(r.conversation_id),
      senderId: String(r.sender_id),
      senderName: String(r.sender_name),
      senderUsername: String(r.sender_username),
      body: r.deleted_at ? "" : String(r.body ?? ""),
      editedAt: r.edited_at ? String(r.edited_at) : null,
      deletedAt: r.deleted_at ? String(r.deleted_at) : null,
      attachmentName: r.deleted_at ? null : r.attachment_name ? String(r.attachment_name) : null,
      attachmentMime: r.deleted_at ? null : r.attachment_mime ? String(r.attachment_mime) : null,
      attachmentSize: r.attachment_size ? Number(r.attachment_size) : null,
      createdAt: String(r.created_at),
      seenBy: byMsg.get(String(r.id)) ?? [],
    })) satisfies Message[];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      conversationId: z.string(),
      body: z.string().max(8000),
      attachmentName: z.string().max(180).optional(),
      attachmentMime: z.string().max(80).optional(),
      attachmentSize: z.number().int().optional(),
      attachmentData: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    const role = await isMember(sql, data.conversationId, context.userId);
    if (!role) fail("permission_denied");
    const conv = await sql`select kind from conversations where id = ${data.conversationId} limit 1`;
    if (conv[0]?.kind === "channel" && role !== "owner" && role !== "admin" && me.role !== "admin") {
      fail("permission_denied");
    }
    const body = data.body.trim();
    if (!body && !data.attachmentData) fail("unknown");
    if (data.attachmentSize && data.attachmentSize > 15 * 1024 * 1024) fail("unknown");
    const id = nid("m");
    await sql`
      insert into messages (id, conversation_id, sender_id, body, attachment_name, attachment_mime, attachment_size, attachment_data)
      values (${id}, ${data.conversationId}, ${context.userId}, ${body}, ${data.attachmentName ?? null}, ${data.attachmentMime ?? null}, ${data.attachmentSize ?? null}, ${data.attachmentData ?? null})`;
    return { id };
  });

export const editMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ messageId: z.string(), body: z.string().min(1).max(8000) }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql`select * from messages where id = ${data.messageId} limit 1`;
    if (!rows[0] || String(rows[0].sender_id) !== context.userId) fail("permission_denied");
    if (rows[0].deleted_at) fail("unknown");
    await sql`update messages set body = ${data.body.trim()}, edited_at = now() where id = ${data.messageId}`;
    return { ok: true };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ messageId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    const rows = await sql`select * from messages where id = ${data.messageId} limit 1`;
    if (!rows[0]) fail("not_found");
    const mine = String(rows[0].sender_id) === context.userId;
    if (!mine && me.role !== "admin") fail("permission_denied");
    await sql`update messages set deleted_at = now(), body = '', attachment_data = null where id = ${data.messageId}`;
    return { ok: true };
  });

export const markRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ conversationId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const role = await isMember(sql, data.conversationId, context.userId);
    if (!role) fail("permission_denied");
    await sql`
      insert into message_reads (message_id, reader_id)
      select id, ${context.userId} from messages
      where conversation_id = ${data.conversationId}
        and sender_id <> ${context.userId}
      on conflict do nothing`;
    return { ok: true };
  });

export const getAttachment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ messageId: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql`select * from messages where id = ${data.messageId} limit 1`;
    if (!rows[0] || rows[0].deleted_at) fail("not_found");
    const role = await isMember(sql, String(rows[0].conversation_id), context.userId);
    const me = await getProfile(sql, context.userId);
    if (!role && me?.role !== "admin" && me?.role !== "support") fail("permission_denied");
    return {
      name: rows[0].attachment_name ? String(rows[0].attachment_name) : null,
      mime: rows[0].attachment_mime ? String(rows[0].attachment_mime) : null,
      data: rows[0].attachment_data ? String(rows[0].attachment_data) : null,
    };
  });

export const createTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      title: z.string().min(1).max(80),
      body: z.string().min(1).max(4000),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireProfile(sql, context.userId);
    const id = nid("t");
    await sql`
      insert into tickets (id, user_id, title, body, priority)
      values (${id}, ${context.userId}, ${data.title}, ${data.body}, ${data.priority ?? "normal"})`;
    return { id };
  });

export const listTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    const rows =
      me.role === "admin" || me.role === "support"
        ? await sql`select t.*, p.username, p.display_name from tickets t join profiles p on p.user_id = t.user_id order by t.created_at desc`
        : await sql`select t.*, p.username, p.display_name from tickets t join profiles p on p.user_id = t.user_id where t.user_id = ${context.userId} order by t.created_at desc`;
    return rows.map((t) => ({
      id: String(t.id),
      userId: String(t.user_id),
      username: String(t.username),
      displayName: String(t.display_name),
      title: String(t.title),
      body: String(t.body),
      status: String(t.status),
      priority: String(t.priority),
      createdAt: String(t.created_at),
    }));
  });

export const updateTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      ticketId: z.string(),
      status: z.enum(["open", "pending", "closed"]).optional(),
      reply: z.string().max(4000).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin" && me.role !== "support") fail("permission_denied");
    if (data.status) {
      await sql`update tickets set status = ${data.status} where id = ${data.ticketId}`;
    }
    if (data.reply?.trim()) {
      await sql`insert into ticket_messages (id, ticket_id, sender_id, body) values (${nid("tm")}, ${data.ticketId}, ${context.userId}, ${data.reply.trim()})`;
    }
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin") fail("permission_denied");
    const rows = await sql`select * from profiles order by created_at desc`;
    return rows.map(mapProfile);
  });

export const adminAct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      targetUserId: z.string(),
      action: z.enum(["set_role", "verify", "unverify", "ban", "temp_ban", "unban", "delete"]),
      role: z.enum(["user", "support", "admin"]).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin") fail("permission_denied");
    const target = await getProfile(sql, data.targetUserId);
    if (!target) fail("not_found");
    if (data.action === "set_role" && data.role) {
      await sql`update profiles set role = ${data.role} where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "role_change", data.targetUserId, data.role);
    } else if (data.action === "verify") {
      await sql`update profiles set verified = true where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "verification_change", data.targetUserId, "true");
    } else if (data.action === "unverify") {
      await sql`update profiles set verified = false where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "verification_change", data.targetUserId, "false");
    } else if (data.action === "ban") {
      await sql`update profiles set banned = true, banned_until = null where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "ban", data.targetUserId);
    } else if (data.action === "temp_ban") {
      await sql`update profiles set banned = true, banned_until = now() + interval '24 hours' where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "temp_ban", data.targetUserId);
    } else if (data.action === "unban") {
      await sql`update profiles set banned = false, banned_until = null where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "unban", data.targetUserId);
    } else if (data.action === "delete") {
      await sql`delete from conversation_members where user_id = ${data.targetUserId}`;
      await sql`delete from profiles where user_id = ${data.targetUserId}`;
      await logAdmin(sql, context.userId, "delete_user", data.targetUserId);
    }
    return { ok: true };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) =>
    z.object({
      username: z.string(),
      displayName: z.string().min(1).max(80),
      password: z.string().min(6).max(128),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin") fail("permission_denied");
    const username = data.username.toLowerCase();
    if (!USERNAME_RE.test(username)) fail("invalid_username");
    const clash = await sql`select 1 from profiles where username = ${username} limit 1`;
    if (clash.length) fail("username_exists");
    const { auth } = await import("@/lib/auth/server");
    const email = `${username}@utino.chat`;
    const created = await auth.api.signUpEmail({
      body: { email, password: data.password, name: data.displayName },
    });
    const uid = (created as { user?: { id?: string } })?.user?.id;
    if (!uid) fail("unknown");
    const hue = Math.floor(Math.random() * 360);
    await sql`
      insert into profiles (user_id, username, display_name, public_id, role, avatar_hue)
      values (${uid}, ${username}, ${data.displayName}, ${publicId()}, 'user', ${hue})`;
    await logAdmin(sql, context.userId, "create_user", uid, username);
    return { userId: uid };
  });

export const adminSetRegistration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => z.object({ enabled: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin") fail("permission_denied");
    await sql`update app_settings set registration_enabled = ${data.enabled} where id = 1`;
    return { enabled: data.enabled };
  });

export const adminLogs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin") fail("permission_denied");
    const rows = await sql`select * from admin_logs order by created_at desc limit 80`;
    return rows.map((r) => ({
      id: String(r.id),
      actorId: String(r.actor_id),
      action: String(r.action),
      target: r.target ? String(r.target) : null,
      meta: r.meta ? String(r.meta) : null,
      createdAt: String(r.created_at),
    }));
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireProfile(sql, context.userId);
    if (me.role !== "admin") fail("permission_denied");
    const users = await sql`select count(*)::int as n from profiles`;
    const conv = await sql`select count(*)::int as n from conversations`;
    const msgs = await sql`select count(*)::int as n from messages`;
    const tickets = await sql`select count(*)::int as n from tickets where status <> 'closed'`;
    return {
      users: Number(users[0]?.n ?? 0),
      conversations: Number(conv[0]?.n ?? 0),
      messages: Number(msgs[0]?.n ?? 0),
      openTickets: Number(tickets[0]?.n ?? 0),
    };
  });
