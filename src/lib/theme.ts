import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "spa-intel-theme";

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Day desk / night desk. Persisted locally, defaults to the system setting.
 * Read after hydration so server and client markup always agree.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let next: Theme = "light";
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored === "light" || stored === "dark") {
        next = stored;
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        next = "dark";
      }
    } catch {
      /* storage unavailable — stay light */
    }
    setTheme(next);
    apply(next);
  }, []);

  const set = useCallback((next: Theme) => {
    setTheme(next);
    apply(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => set(theme === "dark" ? "light" : "dark"), [set, theme]);

  return { theme, setTheme: set, toggle };
}
