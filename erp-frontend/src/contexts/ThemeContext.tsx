import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "erp_theme";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "system" ? stored : "light";
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#020617" : "#f8fafc");
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : resolveTheme(readStoredTheme()),
  );

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(applyTheme(nextTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    setResolvedTheme(applyTheme(theme));

    if (theme !== "system") return;
    const media = window.matchMedia(SYSTEM_DARK_QUERY);
    const handleSystemThemeChange = () => setResolvedTheme(applyTheme("system"));
    media.addEventListener("change", handleSystemThemeChange);
    return () => media.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextTheme = readStoredTheme();
      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [resolvedTheme, setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme phải được sử dụng bên trong ThemeProvider");
  return context;
}
