import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  adminAct,
  adminCreateUser,
  adminListUsers,
  adminLogs,
  adminSetRegistration,
  adminStats,
  getPublicSettings,
  listTickets,
  updateTicket,
  type Profile,
} from "@/lib/chat/actions";
import { Avatar } from "@/components/Avatar";
import { mapError } from "@/lib/utils";
import { useTheme } from "@/components/theme";

export function AdminPanel({ me }: { me: Profile }) {
  const { lang } = useTheme();
  const [tab, setTab] = useState<"dash" | "users" | "create" | "tickets" | "logs" | "settings">("dash");
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof listTickets>>>([]);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof adminLogs>>>([]);
  const [reg, setReg] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setStats(await adminStats());
      setUsers(await adminListUsers());
      setTickets(await listTickets());
      setLogs(await adminLogs());
      setReg((await getPublicSettings()).registrationEnabled);
    } catch (e) {
      setErr(mapError(String((e as Error).message), lang));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tabs = [
    ["dash", "Dashboard"],
    ["users", "Users"],
    ["create", "Create"],
    ["tickets", "Tickets"],
    ["logs", "Logs"],
    ["settings", "Settings"],
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg md:flex-row">
      <aside className="border-b border-line bg-surface p-3 md:w-56 md:border-b-0 md:border-e">
        <Link to="/messenger" className="mb-4 block text-sm text-primary">
          ← Messenger
        </Link>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted">UTINOCHATV1</p>
        <div className="flex gap-1 overflow-x-auto md:flex-col">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-2 text-start text-sm ${tab === id ? "bg-raised text-primary" : "text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        {err && <p className="mb-4 text-danger">{err}</p>}
        {tab === "dash" && stats && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Users", stats.users],
              ["Chats", stats.conversations],
              ["Messages", stats.messages],
              ["Tickets", stats.openTickets],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-lg border border-line bg-surface p-4">
                <p className="text-xs text-muted">{k}</p>
                <p className="text-2xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "users" && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-raised text-muted">
                <tr>
                  <th className="p-3 text-start">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-t border-line">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.displayName} hue={u.avatarHue} size={28} />
                        <div>
                          <p>{u.displayName}</p>
                          <p className="text-xs text-muted">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">{u.role}</td>
                    <td className="p-3 text-center">{u.banned ? "banned" : u.verified ? "verified" : "ok"}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(["user", "support", "admin"] as const).map((r) => (
                          <button
                            key={r}
                            className="rounded bg-raised px-2 py-1"
                            onClick={async () => {
                              await adminAct({ data: { targetUserId: u.userId, action: "set_role", role: r } });
                              load();
                            }}
                          >
                            {r}
                          </button>
                        ))}
                        <button className="rounded bg-raised px-2 py-1" onClick={async () => { await adminAct({ data: { targetUserId: u.userId, action: u.verified ? "unverify" : "verify" } }); load(); }}>
                          verify
                        </button>
                        <button className="rounded bg-raised px-2 py-1" onClick={async () => { await adminAct({ data: { targetUserId: u.userId, action: "ban" } }); load(); }}>
                          ban
                        </button>
                        <button className="rounded bg-raised px-2 py-1" onClick={async () => { await adminAct({ data: { targetUserId: u.userId, action: "temp_ban" } }); load(); }}>
                          24h
                        </button>
                        <button className="rounded bg-raised px-2 py-1" onClick={async () => { await adminAct({ data: { targetUserId: u.userId, action: "unban" } }); load(); }}>
                          unban
                        </button>
                        {u.userId !== me.userId && (
                          <button className="rounded bg-danger/20 px-2 py-1 text-danger" onClick={async () => { await adminAct({ data: { targetUserId: u.userId, action: "delete" } }); load(); }}>
                            delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "create" && <CreateUser onDone={load} />}
        {tab === "tickets" && (
          <div className="space-y-3">
            {tickets.map((tk) => (
              <article key={tk.id} className="rounded-lg border border-line bg-surface p-4">
                <p className="font-semibold">{tk.title}</p>
                <p className="text-sm text-muted">@{tk.username} · {tk.status} · {tk.priority}</p>
                <p className="mt-2 text-sm">{tk.body}</p>
                <div className="mt-3 flex gap-2">
                  {(["open", "pending", "closed"] as const).map((s) => (
                    <button
                      key={s}
                      className="rounded bg-raised px-2 py-1 text-sm"
                      onClick={async () => {
                        await updateTicket({ data: { ticketId: tk.id, status: s } });
                        load();
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            {!tickets.length && <p className="text-muted">No tickets.</p>}
          </div>
        )}
        {tab === "logs" && (
          <ul className="space-y-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="rounded-md border border-line bg-surface px-3 py-2">
                <span className="font-medium">{l.action}</span>
                <span className="text-muted"> · {l.target} · {l.meta} · {new Date(l.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        {tab === "settings" && (
          <label className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
            <input
              type="checkbox"
              checked={reg}
              onChange={async (e) => {
                const enabled = e.target.checked;
                await adminSetRegistration({ data: { enabled } });
                setReg(enabled);
              }}
            />
            Registration enabled
          </label>
        )}
      </main>
    </div>
  );
}

function CreateUser({ onDone }: { onDone: () => void }) {
  const { lang } = useTheme();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form
      className="max-w-md space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg("");
        try {
          await adminCreateUser({ data: { username, displayName, password } });
          setUsername("");
          setDisplayName("");
          setPassword("");
          setMsg("Created.");
          onDone();
        } catch (err) {
          setMsg(mapError(String((err as Error).message), lang));
        }
      }}
    >
      <input className="w-full rounded-md bg-surface px-3 py-3" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input className="w-full rounded-md bg-surface px-3 py-3" placeholder="display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      <input className="w-full rounded-md bg-surface px-3 py-3" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {msg && <p className="text-sm">{msg}</p>}
      <button className="rounded-md bg-primary px-4 py-3 font-semibold">Create user</button>
    </form>
  );
}
