import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme";
import { AdminPanel } from "@/components/AdminPanel";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMe, type Profile } from "@/lib/chat/actions";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [me, setMe] = useState<Profile | null>(null);
  useEffect(() => {
    if (user) getMe().then(setMe).catch(() => setMe(null));
  }, [user]);
  if (isPending) return <div className="grid min-h-screen place-items-center bg-bg">…</div>;
  if (!user) return <RedirectToSignIn to="/login" />;
  if (!me) return <div className="grid min-h-screen place-items-center bg-bg text-muted">…</div>;
  if (me.role !== "admin" && me.role !== "support") {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6 text-fg">
        <p>permission_denied</p>
        <Link to="/messenger" className="mt-3 text-primary">
          Messenger
        </Link>
      </div>
    );
  }
  return (
    <ThemeProvider>
      <AdminPanel me={me} />
    </ThemeProvider>
  );
}
