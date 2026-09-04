import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme";
import { Messenger } from "@/components/Messenger";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/messenger")({ component: MessengerPage });

function MessengerPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="grid min-h-screen place-items-center bg-bg text-muted">UTINOCHATV1</div>;
  }
  if (!user) return <RedirectToSignIn to="/login" />;
  return (
    <ThemeProvider>
      <Messenger />
    </ThemeProvider>
  );
}
