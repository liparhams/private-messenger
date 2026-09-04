import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/AuthScreen";
import { ThemeProvider } from "@/components/theme";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <ThemeProvider>
      <AuthScreen mode="login" />
    </ThemeProvider>
  );
}
