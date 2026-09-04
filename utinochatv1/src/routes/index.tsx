import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeProvider, useTheme } from "@/components/theme";
import { SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/")({ component: LandingWrap });

function LandingWrap() {
  return (
    <ThemeProvider>
      <Landing />
    </ThemeProvider>
  );
}

function Landing() {
  const { t, lang, setLang, theme, setTheme } = useTheme();
  return (
    <div className="min-h-screen bg-bg text-fg wallpaper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary font-bold">U</span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary">{t.product}</p>
            <p className="text-sm text-muted">{t.messenger}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <button className="rounded-md px-2 py-2 text-muted" onClick={() => setLang(lang === "fa" ? "en" : "fa")}>
            {lang === "fa" ? "EN" : "فا"}
          </button>
          <button className="rounded-md px-2 py-2 text-muted" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? t.light : t.dark}
          </button>
          <SignedOut>
            <Link to="/login" className="rounded-md px-3 py-2">
              {t.login}
            </Link>
            <Link to="/register" className="rounded-md bg-primary px-3 py-2 font-semibold">
              {t.register}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/messenger" className="rounded-md bg-primary px-3 py-2 font-semibold">
              {t.messenger}
            </Link>
          </SignedIn>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10">
        <p className="text-sm font-semibold text-primary">{t.product}</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">{t.tagline}</h1>
        <p className="mt-4 max-w-xl text-muted">
          {lang === "fa"
            ? "گفتگوی خصوصی، گروه، کانال، تیکت پشتیبانی و پنل مدیریت — با هویت مستقل UTINO."
            : "Private chats, groups, channels, support tickets and admin — with a distinct UTINO identity."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-md bg-primary px-5 py-3 font-semibold">
            {t.register}
          </Link>
          <Link to="/login" className="rounded-md border border-line px-5 py-3">
            {t.login}
          </Link>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            lang === "fa" ? ["پیام مستقیم", "ارسال، ویرایش، حذف نرم، وضعیت دیده شدن."] : ["Direct messages", "Send, edit, soft-delete, seen receipts."],
            lang === "fa" ? ["گروه و کانال", "عمومی یا خصوصی، دعوت و عضویت."] : ["Groups & channels", "Public or private, invites and join."],
            lang === "fa" ? ["پشتیبانی", "تیکت با اولویت و وضعیت."] : ["Support", "Tickets with priority and status."],
          ].map(([h, b]) => (
            <article key={h} className="rounded-lg border border-line bg-surface p-5">
              <h2 className="font-semibold">{h}</h2>
              <p className="mt-2 text-sm text-muted">{b}</p>
            </article>
          ))}
        </div>
        <footer className="mt-16 flex flex-wrap gap-4 text-sm text-muted">
          <a className="text-primary" href="https://t.me/parhamsoleimanybot">Telegram</a>
          <a className="text-primary" href="https://utino.org/chat/supportusername">Utino Support</a>
          <a className="text-primary" href="https://utino.org">Utino</a>
          <a className="text-primary" href="https://iparham.com">iParham</a>
          <a className="text-primary" href="https://wdner.co">WDNER</a>
        </footer>
      </main>
    </div>
  );
}
