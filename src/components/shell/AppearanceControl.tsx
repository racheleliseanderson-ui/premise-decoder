import { useEffect, useId, useRef, useState } from "react";
import { THEMES, useTheme } from "@/lib/theme";

/**
 * The desk's one floating control: display appearance, lower right.
 *
 * It replaces the two duplicate theme strips that used to sit in the house bar
 * — one buried in the collapsed phone menu, one in the desktop strip at 24px,
 * under the WCAG 2.2 AA target minimum. The corner was empty: nothing else in
 * this app is fixed.
 *
 * Disclosure contract: Escape closes and returns focus to the trigger, a
 * pointer press outside closes, every target clears 44px, and the whole dock
 * is hidden when the desk is printed.
 */
export function AppearanceControl() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btnRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const node = e.target as Node | null;
      if (!node) return;
      if (panelRef.current?.contains(node) || btnRef.current?.contains(node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="appearance-dock no-print print:hidden">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 min-w-11 items-center gap-2 border border-rule bg-parchment px-3.5 py-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink shadow-md transition-colors hover:bg-bone"
      >
        <span aria-hidden="true" className="text-[0.875rem] leading-none">
          {current.short}
        </span>
        Appearance
        <span className="sr-only">— currently {current.label}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className="absolute bottom-full right-0 mb-2 w-60 border border-rule bg-parchment shadow-lg sm:w-64"
        >
          <p className="border-b border-rule px-4 py-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-soft">
            Display
          </p>
          <div role="group" aria-label="Display mode" className="flex flex-col">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={theme === t.id}
                onClick={() => setTheme(t.id)}
                className={
                  theme === t.id
                    ? "flex min-h-11 w-full items-start gap-3 border-b border-rule bg-oxblood-tint px-4 py-2.5 text-left"
                    : "flex min-h-11 w-full items-start gap-3 border-b border-rule px-4 py-2.5 text-left transition-colors hover:bg-bone"
                }
              >
                <span aria-hidden="true" className="mt-0.5 text-base leading-none text-oxblood">
                  {t.short}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink">
                    {t.label}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-ink-soft">{t.note}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="px-4 py-2.5 text-xs leading-snug text-ink-soft">
            Held in this browser only. Status marks keep their shape and their word in every mode.
          </p>
        </div>
      ) : null}
    </div>
  );
}
