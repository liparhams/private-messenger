import { createFileRoute } from "@tanstack/react-router";
import { AuthScreen } from "@/components/AuthScreen";
import { ThemeProvider } from "@/components/theme";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  return (
    <ThemeProvider>
      <AuthScreen mode="register" />
    </ThemeProvider>
  );
}
