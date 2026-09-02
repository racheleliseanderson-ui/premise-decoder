import { useEffect, useId, useRef, useState } from "react";
import { HOUSE_URL, VANITY } from "@/lib/fleet";
import type { MODES, Mode } from "@/lib/modes";

/**
 * House bar — one row, six nav items maximum (Fleet Shell Standard v1 §3.1).
 * On a phone the six items cannot fit a 44px target, so the closed bar is
 * wordmark + Menu. Desktop keeps the one-row strip. Gold is house level only:
 * the Labs wordmark. Display appearance is not here — it is the one floating
 * control in the lower right.
 */
const HOUSE_NAV: Mode[] = ["fast", "intake", "full", "compare", "decode", "library"];

export function HouseBar({
  mode,
  panels,
  onNavigate,
}: {
  mode: Mode;
  panels: typeof MODES;
  onNavigate: (m: Mode) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Six of the eight panels, named by the same list the tab strip reads, so the
  // house nav and the tab strip can never call one panel two things again.
  const nav = HOUSE_NAV.map((id) => panels.find((p) => p.id === id)).filter((p) => p !== undefined);

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
    const first = panelRef.current?.querySelector<HTMLElement>("button, a");
    first?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const go = (m: Mode) => {
    setOpen(false);
    onNavigate(m);
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <a href="#desk" className="skip-link">
        Skip to desk
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 md:hidden">
        <a
          href={HOUSE_URL}
          target="_blank"
          rel="noopener"
          className="house-mark min-h-11 shrink-0 py-2 font-mono text-[0.625rem] uppercase leading-tight tracking-[0.12em] no-underline hover:underline"
        >
          Northern Lantern House Labs
        </a>
        <button
          ref={btnRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-rule px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div id={menuId} ref={panelRef} className="border-t border-rule bg-background md:hidden">
          <nav aria-label="App panels" className="flex flex-col">
            {nav.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-current={mode === n.id ? "page" : undefined}
                onClick={() => go(n.id)}
                className={
                  mode === n.id
                    ? "min-h-11 border-b border-rule px-4 text-left font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-oxblood"
                    : "min-h-11 border-b border-rule px-4 text-left font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-soft"
                }
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      ) : null}

      <div className="mx-auto hidden max-w-6xl flex-nowrap items-center gap-2 px-8 py-2.5 md:flex">
        <a
          href={HOUSE_URL}
          target="_blank"
          rel="noopener"
          className="house-mark shrink-0 font-mono text-[0.5625rem] uppercase leading-tight tracking-[0.2em] no-underline hover:underline"
        >
          Northern Lantern House Labs
        </a>

        <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-rule lg:block" />

        <a
          href={VANITY.publication.url}
          target="_blank"
          rel="noopener"
          className="hidden shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-soft no-underline hover:text-oxblood lg:inline"
        >
          Vanity or Vice
        </a>

        <nav
          aria-label="App panels"
          className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={mode === n.id ? "page" : undefined}
              onClick={() => onNavigate(n.id)}
              className={
                mode === n.id
                  ? "whitespace-nowrap border-b-2 border-oxblood px-1 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-oxblood"
                  : "whitespace-nowrap border-b-2 border-transparent px-1 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-ink"
              }
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
