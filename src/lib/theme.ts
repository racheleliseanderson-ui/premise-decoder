import { useCallback, useEffect, useState } from "react";

/**
 * Three display modes (Fleet Shell Standard v1 §2):
 * pearl (light ground), dark (navy ground), cvd (colour-vision-safe).
 * Status marks always carry a shape and a word, so hue is never the signal.
 */
export type Theme = "light" | "dark" | "cvd";

const KEY = "spa-intel-theme";

export const THEMES: { id: Theme; short: string; labelKey: string }[] = [
  { id: "light", short: "☀", labelKey: "theme.day" },
  { id: "dark", short: "☾", labelKey: "theme.night" },
  { id: "cvd", short: "◐", labelKey: "theme.cvd" },
];

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("cvd", theme === "cvd");
}

function isTheme(v: string | null): v is Theme {
  return v === "light" || v === "dark" || v === "cvd";
}

/**
 * Persisted locally, defaults to the system setting.
 * Read after hydration so server and client markup always agree.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let next: Theme = "light";
    try {
      const stored = window.localStorage.getItem(KEY);
      if (isTheme(stored)) {
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

  const cycle = useCallback(() => {
    const order: Theme[] = ["light", "dark", "cvd"];
    set(order[(order.indexOf(theme) + 1) % order.length]!);
  }, [set, theme]);

  return { theme, setTheme: set, toggle: cycle, cycle };
}
