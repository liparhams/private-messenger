import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { bootstrapProfile, getPublicSettings } from "@/lib/chat/actions";
import { mapError, USERNAME_RE } from "@/lib/utils";
import { useTheme } from "@/components/theme";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const { t, lang, setLang, theme, setTheme } = useTheme();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [regOn, setRegOn] = useState(true);

  useEffect(() => {
    getPublicSettings().then((s) => setRegOn(s.registrationEnabled)).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const uname = username.trim().toLowerCase();
    if (!USERNAME_RE.test(uname)) {
      setError(mapError("invalid_username", lang));
      return;
    }
    if (password.length < 6) {
      setError(mapError("invalid_password", lang));
      return;
    }
    if (mode === "register" && !regOn) {
      setError(mapError("registration_disabled", lang));
      return;
    }
    setBusy(true);
    try {
      const email = `${uname}@utino.chat`;
      if (mode === "register") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: displayName.trim() || uname,
        });
        if (res.error) throw new Error(res.error.message || "unknown");
        await bootstrapProfile({ data: { username: uname, displayName: displayName.trim() || uname } });
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "unknown");
        await bootstrapProfile({ data: { username: uname } });
      }
      nav({ to: "/messenger" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      const code = msg.includes("USER_ALREADY_EXISTS") || msg.includes("exists") ? "username_exists" : msg;
      setError(mapError(code, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 wallpaper">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-bold text-fg">U</span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary">{t.product}</p>
              <h1 className="text-lg font-semibold">{mode === "login" ? t.login : t.register}</h1>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <button type="button" className="rounded-md border border-line px-2 py-1 text-muted" onClick={() => setLang(lang === "fa" ? "en" : "fa")}>
              {lang === "fa" ? "EN" : "فا"}
            </button>
            <button type="button" className="rounded-md border border-line px-2 py-1 text-muted" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? t.light : t.dark}
            </button>
          </div>
        </div>

        {mode === "register" && !regOn && (
          <p className="mb-4 rounded-md bg-raised p-3 text-sm text-danger">{mapError("registration_disabled", lang)}</p>
        )}

        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.username}</span>
            <input
              className="w-full rounded-md border border-line bg-raised px-3 py-3 text-fg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          {mode === "register" && (
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.displayName}</span>
              <input
                className="w-full rounded-md border border-line bg-raised px-3 py-3 text-fg"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.password}</span>
            <input
              type="password"
              className="w-full rounded-md border border-line bg-raised px-3 py-3 text-fg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy || (mode === "register" && !regOn)}
            className="w-full rounded-md bg-primary py-3 font-semibold text-fg hover:bg-primary-hover"
          >
            {busy ? "…" : mode === "login" ? t.login : t.register}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {GROK_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              onClick={() => signIn(p.providerId, { callbackURL: "/messenger" })}
              className="w-full rounded-md border border-line px-4 py-2 text-sm text-muted hover:bg-raised"
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          {mode === "login" ? (
            <Link to="/register" className="text-primary">{t.register}</Link>
          ) : (
            <Link to="/login" className="text-primary">{t.login}</Link>
          )}
        </p>
        <p className="mt-4 text-center text-xs text-muted">
          <a href="https://t.me/parhamsoleimanybot" className="text-primary">Telegram</a>
          {" · "}
          <a href="https://utino.org/chat/supportusername" className="text-primary">Utino Support</a>
        </p>
      </div>
    </div>
  );
}
