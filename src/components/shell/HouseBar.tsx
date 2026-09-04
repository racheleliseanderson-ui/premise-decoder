import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import { HOUSE_URL, VANITY } from "@/lib/fleet";
import { MODE_PATH, modeFromPath, type MODES, type Mode } from "@/lib/modes";

/**
 * House bar.
 *
 * Two things changed here, and both were structural rather than cosmetic.
 *
 * FIRST, the app now says its own name. The bar carried "Northern Lantern
 * House Labs" and, above `lg`, "Vanity or Vice" — the house and the
 * publication — and never once said Spa Intelligence. Its two sibling desks
 * both put their name in the masthead in display type; this one left a reader
 * to work out where they were from the hero, which is only on the front page.
 *
 * SECOND, the nav items are links. They were buttons calling `desk.go`, so the
 * primary navigation of the application had no hrefs: nothing could be
 * middle-clicked, opened in a new tab, copied out, or followed by a crawler,
 * and the browser's own back button was the only way anything moved.
 *
 * Six items on the desktop row (Fleet Shell Standard v1 §3.1) — the decision
 * spine: arrive, paste, walk the room, price it, read the copy, take the card.
 * The phone menu carries all ten, because a menu that has been opened on
 * purpose is the one place completeness costs nothing.
 */
const HOUSE_NAV: Mode[] = ["fast", "intake", "full", "cost", "decode", "packet"];

export function HouseBar({ panels }: { panels: typeof MODES }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const mode = modeFromPath(pathname);

  const spine = HOUSE_NAV.map((id) => panels.find((p) => p.id === id)).filter(
    (p) => p !== undefined,
  );

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
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <a href="#desk" className="skip-link">
        Skip to desk
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 md:px-8 md:py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <a
              href={VANITY.publication.url}
              target="_blank"
              rel="noopener"
              className="font-mono text-[0.5625rem] uppercase leading-tight tracking-[0.2em] text-ink-soft no-underline hover:text-oxblood"
            >
              Vanity or Vice
            </a>
            <a
              href={HOUSE_URL}
              target="_blank"
              rel="noopener"
              className="house-mark hidden font-mono text-[0.5625rem] uppercase leading-tight tracking-[0.2em] no-underline hover:underline sm:inline"
            >
              Northern Lantern House Labs
            </a>
          </div>
          <Link
            to="/"
            className="mt-0.5 inline-flex min-h-11 items-center font-display text-2xl leading-none text-ink no-underline md:text-[1.7rem]"
          >
            Spa Intelligence
          </Link>
        </div>

        <nav aria-label="Desk panels" className="hidden min-w-0 items-center gap-3 md:flex">
          {spine.map((n) => (
            <Link
              key={n.id}
              to={n.path}
              resetScroll={false}
              aria-current={mode === n.id ? "page" : undefined}
              className={
                mode === n.id
                  ? "whitespace-nowrap border-b-2 border-oxblood px-0.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-oxblood no-underline"
                  : "whitespace-nowrap border-b-2 border-transparent px-0.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft no-underline transition-colors hover:text-ink"
              }
            >
              {n.label}
            </Link>
          ))}
          <Link
            to={MODE_PATH.prep}
            resetScroll={false}
            className="ml-1 inline-flex min-h-9 items-center whitespace-nowrap border border-oxblood/45 px-3 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-oxblood no-underline hover:bg-oxblood-tint"
          >
            Consult prep
          </Link>
        </nav>

        <button
          ref={btnRef}
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-rule px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink md:hidden"
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
          <nav aria-label="All desk panels" className="flex flex-col">
            {panels.map((n) => (
              <Link
                key={n.id}
                to={n.path}
                resetScroll={false}
                aria-current={mode === n.id ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={
                  mode === n.id
                    ? "flex min-h-12 items-center border-b border-rule px-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-oxblood no-underline"
                    : "flex min-h-12 items-center border-b border-rule px-5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-soft no-underline"
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
