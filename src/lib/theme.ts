import { useCallback, useEffect, useState } from "react";

/**
 * Three display modes (Fleet Shell Standard v1 §2):
 * pearl (light ground), dark (navy ground), and a signal swap for readers who
 * cannot separate the green/red pair. Status marks always carry a shape and a
 * word as well, so hue is never the only signal in any mode.
 */
export type Theme = "light" | "dark" | "cvd";

const KEY = "spa-intel-theme";

/**
 * `short` is decorative and always rendered aria-hidden; `label` is the control
 * name and `note` says what the mode actually changes. The third mode is named
 * for what it does to the page — it swaps which hues carry meaning — not for a
 * condition somebody might have.
 */
export const THEMES: { id: Theme; short: string; label: string; note: string }[] = [
  { id: "light", short: "☀", label: "Pearl", note: "Light ground, green and red signals" },
  { id: "dark", short: "☾", label: "Dark", note: "Navy ground, green and red signals" },
  { id: "cvd", short: "◐", label: "Blue and amber", note: "Signal pair swaps off green and red" },
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

  // No `toggle`/`cycle` here. Three modes do not toggle, and a blind cycle
  // hides the destination from the person pressing the control; the appearance
  // disclosure names all three and sets one directly.
  return { theme, setTheme: set };
}
