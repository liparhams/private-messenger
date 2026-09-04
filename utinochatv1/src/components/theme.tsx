import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { copy, type Lang } from "@/lib/i18n";

type Theme = "dark" | "light";
type Ctx = {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  t: (typeof copy)[Lang];
  dir: "rtl" | "ltr";
};

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    const storedTheme = localStorage.getItem("utino-theme") as Theme | null;
    const storedLang = localStorage.getItem("utino-lang") as Lang | null;
    if (storedTheme === "light" || storedTheme === "dark") setThemeState(storedTheme);
    if (storedLang === "en" || storedLang === "fa") setLangState(storedLang);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("utino-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    localStorage.setItem("utino-lang", lang);
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      lang,
      setTheme: setThemeState,
      setLang: setLangState,
      t: copy[lang],
      dir: lang === "fa" ? "rtl" : "ltr",
    }),
    [theme, lang],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("theme");
  return ctx;
}
