import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import { emptyInput } from "@/lib/engine";
import { fieldDomId } from "@/lib/fields";
import { MODES, MODE_PATH, MODE_STANDFIRST, type Mode } from "@/lib/modes";
import { SCENARIOS } from "@/lib/scenarios";
import { blockLabel } from "@/lib/session";
import { useDesk } from "@/lib/desk-context";

import { ArrivalNotice } from "./ArrivalNotice";
import { DeskPanel } from "./DeskPanel";
import { PromiseVsPlace } from "./PromiseVsPlace";
import { StageReadout } from "./StageReadout";
import { TermTip } from "./TermTip";
import { SavedSets, VenueBar } from "./VenueBar";
import { FileThisVenue } from "./VenueLibrary";

const SEEN_LIBRARY = "spa-intel-seen-library";

/**
 * The working surface.
 *
 * This used to be welded into `DeskLayout`, which meant every URL in the app
 * rendered the entire front page — hero, eleven demo cards, chapter break,
 * method — with only this middle section swapped. Ten routes, one page. A link
 * to the Claim Decoder landed you at the top of an advertisement and left you
 * to find the decoder; `window.print()` on the decision card printed the hero
 * photograph; and a handoff from Skincare that promised to open the consult
 * sheet opened the marketing copy instead.
 *
 * So: this is the desk, and only the desk. `/` wraps it in the front matter
 * because a first visit needs the argument. Every other route renders it on its
 * own, under its own heading, which is what a route is for.
 */
export function Workbench({ mode, tone = "page" }: { mode: Mode; tone?: "home" | "page" }) {
  const desk = useDesk();

  return (
    <section id="desk" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-8 md:px-8 md:py-10">
      {tone === "home" ? <DeskActions /> : null}

      <ModeTabs mode={mode} />

      <ArrivalNotice />

      {/*
        On the front page this names which of several sections you are looking
        at. On a panel page it repeats the h1 immediately above it, which is
        noise on a phone where the two are a thumb apart.
      */}
      {tone === "home" ? (
        <p className="eyebrow mb-5" id="work-panel-label">
          Now on this desk · {MODES.find((m) => m.id === mode)?.label}
        </p>
      ) : null}

      <div id="work-panel" className="min-h-[12rem]">
        <DeskPanel mode={mode} />
      </div>

      <div className="no-print mt-10 space-y-4">
        <VenueBar
          blocks={desk.blocks}
          activeId={desk.active.id}
          scores={desk.assessments}
          onSelect={desk.setActiveId}
          onAdd={desk.addBlock}
          onDuplicate={desk.duplicateBlock}
          onRemove={desk.removeBlock}
          onRename={desk.renameBlock}
          onCompare={() => desk.go("compare", { scroll: "panel" })}
          unlocked={desk.multiUnlocked}
        />
        <SavedSets
          sets={desk.sets}
          savedAt={desk.savedAt}
          onSave={desk.onSaveSet}
          onLoad={desk.onLoadSet}
          onDelete={desk.onDeleteSet}
          onClear={desk.onClearAll}
          onImport={desk.importJson}
        />
        {desk.hasInput ? (
          <StageReadout stages={desk.stages} onOpen={(m) => desk.go(m, { scroll: "panel" })} />
        ) : null}
        <FileThisVenue />
        <LibraryPointer mode={mode} />
        <p className="text-xs leading-relaxed text-ink-soft">
          Education only · no diagnosis, candidacy or ranking. Saved in this browser only — nothing
          is transmitted. Where identity is unresolved the desk fails closed and prints the gap.
        </p>
      </div>
    </section>
  );
}

/**
 * A panel on its own page: heading, standfirst, then the desk.
 *
 * The heading is a real `h1`. Every panel used to share the hero's h1 ("See the
 * room before you book it"), so ten pages announced themselves identically to a
 * screen reader and to a search engine.
 */
export function PanelPage({ mode }: { mode: Mode }) {
  const desk = useDesk();
  const meta = MODES.find((m) => m.id === mode);

  return (
    <>
      <header className="border-b border-rule bg-parchment">
        <div className="mx-auto max-w-6xl px-5 pb-8 pt-10 md:px-8 md:pb-10 md:pt-14">
          <p className="eyebrow">Spa Intelligence · the desk</p>
          <h1 className="display-lg mt-3 text-ink">{meta?.label}</h1>
          <p className="lede mt-4 max-w-2xl">{MODE_STANDFIRST[mode]}</p>
        </div>
      </header>

      <Workbench mode={mode} />

      {desk.hasInput ? (
        <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
          <PromiseVsPlace a={desk.a} />
        </section>
      ) : null}
    </>
  );
}

function focusDeskField() {
  const el =
    document.getElementById(fieldDomId("menuLine")) ??
    document.querySelector<HTMLElement>(
      "#work-panel select, #work-panel input, #work-panel textarea",
    );
  el?.focus();
}

function focusPaste() {
  const el =
    document.getElementById("venue-paste") ??
    document.getElementById("hero-paste") ??
    document.getElementById("fast-paste");
  if (el instanceof HTMLTextAreaElement) {
    el.focus();
    el.scrollIntoView({ block: "center", behavior: "auto" });
  }
}

/** The three-step card and the live readout. Front page only. */
function DeskActions() {
  const desk = useDesk();

  const loadFeaturedDemo = () => {
    const s = SCENARIOS[0]!;
    desk.setActiveInput(s.input);
    desk.renameBlock(desk.active.id, s.title.split("·")[0]!.trim().slice(0, 32));
    desk.setLoaded(s.id);
    desk.go("full");
  };

  const openPaste = () => {
    desk.go("intake", { scroll: "panel" });
    window.setTimeout(() => focusPaste(), 60);
  };

  const startFast = () => {
    desk.go("fast", { scroll: "panel" });
    window.setTimeout(() => focusDeskField(), 80);
  };

  return (
    <div className="no-print mb-8 border border-rule bg-parchment">
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div>
          <p className="eyebrow">Three steps</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-5">
            {[
              ["1", "Name the service and the setting."],
              ["2", "See what the spa hasn’t told you."],
              ["3", "Print the card for your consult."],
            ].map(([n, line]) => (
              <li key={n} className="flex gap-2.5">
                <span className="num shrink-0 text-oxblood">{n}</span>
                <span className="text-sm leading-snug text-ink-soft">{line}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button type="button" className="btn-primary" onClick={startFast}>
              Four questions
            </button>
            <button type="button" className="btn-quiet" onClick={openPaste}>
              Paste a menu or ad
            </button>
            <button type="button" className="btn-quiet" onClick={loadFeaturedDemo}>
              Try a demo
            </button>
            {desk.hasInput ? (
              <Link to={MODE_PATH.prep} className="btn-quiet">
                Consultation prep
              </Link>
            ) : null}
          </div>
        </div>

        {desk.hasInput ? (
          <dl className="grid grid-cols-2 gap-px border border-rule bg-rule md:w-64">
            {(
              [
                ["Resolved", `${desk.a.place}%`, "place"],
                ["Burden", desk.a.burden.band, "burden"],
                ["Unnamed", String(desk.a.failClosed.length), "failClosed"],
                [
                  "On the desk",
                  `${desk.blocks.length} venue${desk.blocks.length === 1 ? "" : "s"}`,
                  null,
                ],
              ] as const
            ).map(([k, v, term]) => (
              <div key={k} className="bg-bone px-3 py-2.5">
                <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-soft">
                  {term ? <TermTip id={term}>{k}</TermTip> : k}
                </dt>
                <dd className="num mt-1.5 truncate text-lg text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="max-w-xs text-sm leading-relaxed text-ink-soft md:w-64">
            Four answers is enough to start. The desk quotes the sentence behind every fill.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The panel strip.
 *
 * Now real links with real hrefs. They used to be buttons calling `desk.go`,
 * which meant the strongest navigation in the application could not be
 * middle-clicked, opened in a new tab, copied, or followed by a crawler — and
 * `role="tablist"` announced ten tabs on ten separate pages, which is not what
 * a tab is. It is a `nav` now, because that is what it is.
 */
function ModeTabs({ mode }: { mode: Mode }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scroller.current;
    const el = root?.querySelector<HTMLElement>(`[data-mode="${mode}"]`);
    if (!root || !el) return;
    const left = el.offsetLeft - root.clientWidth / 2 + el.clientWidth / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [mode]);

  return (
    <div className="no-print mb-5">
      <div className="mode-tabs">
        <nav
          ref={scroller}
          className="mode-tabs-scroller flex flex-nowrap items-center gap-1 overflow-x-auto"
          aria-label="Desk panels"
        >
          {MODES.map((m) => (
            <Link
              key={m.id}
              to={m.path}
              data-mode={m.id}
              aria-current={mode === m.id ? "page" : undefined}
              resetScroll={false}
              className={
                mode === m.id
                  ? "segment segment-active shrink-0 whitespace-nowrap no-underline"
                  : "segment shrink-0 whitespace-nowrap no-underline"
              }
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-soft md:hidden">
        On a phone · swipe the panel names
      </p>
    </div>
  );
}

function LibraryPointer({ mode }: { mode: Mode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(window.localStorage.getItem(SEEN_LIBRARY) !== "1");
    } catch {
      setShow(true);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "library") return;
    try {
      window.localStorage.setItem(SEEN_LIBRARY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }, [mode]);

  if (!show || mode === "library") return null;

  return (
    <div className="border border-rule bg-bronze-soft/35 px-4 py-3 sm:px-5">
      <p className="eyebrow">First visit</p>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        New here? The{" "}
        <Link
          to={MODE_PATH.library}
          className="underline decoration-dotted underline-offset-2"
          onClick={() => {
            try {
              window.localStorage.setItem(SEEN_LIBRARY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
        >
          Reference library
        </Link>{" "}
        names what each service class has to disclose, expands NP, RN, PA-C and the rest, and points
        at the board that checks a license.
      </p>
    </div>
  );
}

/** The demo shelf. Front page only — it is an invitation, not a tool. */
export function Demos() {
  const desk = useDesk();
  return (
    <section id="demos" className="no-print scroll-mt-16 border-y border-rule bg-oxblood-tint/45">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Try a demo</p>
            <h2 className="display-lg mt-3 text-ink">
              See a real setting, <span className="italic text-oxblood">not a blank form</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            Concrete menu lines from day spas, hotel spas, suite rentals, mobile services, and
            clinics. Nothing here is a real facility.
          </p>
        </div>

        <div className="mt-9 grid gap-px border border-rule sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                desk.setActiveInput(s.input);
                desk.renameBlock(desk.active.id, s.title.split("·")[0]!.trim().slice(0, 32));
                desk.setLoaded(s.id);
                desk.go("full", { scroll: "panel" });
              }}
              className={`group border-b border-r border-rule p-5 text-left transition-colors sm:p-6 ${
                desk.loaded === s.id ? "bg-oxblood-tint" : "bg-parchment hover:bg-oxblood-tint/60"
              }`}
            >
              <p className="eyebrow">{desk.loaded === s.id ? "On the desk" : "Demo scenario"}</p>
              <p className="mt-3 font-display text-2xl leading-tight text-ink">{s.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{s.note}</p>
              <p className="num mt-4 text-[0.625rem] tracking-[0.14em] text-oxblood">
                {s.expected.toUpperCase()}
              </p>
            </button>
          ))}
          <div className="border-b border-r border-rule bg-bone p-5 sm:p-6">
            <p className="eyebrow">Or start clean</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              An empty desk is a valid state. Nothing is inferred on your behalf.
            </p>
            <button
              type="button"
              className="btn-quiet mt-5"
              onClick={() => {
                desk.setActiveInput(emptyInput, "typed");
                desk.renameBlock(desk.active.id, blockLabel(desk.blocks.indexOf(desk.active)));
                desk.setLoaded(null);
                desk.go("fast", { scroll: "top" });
              }}
            >
              Clear this venue
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
