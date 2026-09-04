import { useEffect, useRef, useState, type ReactNode } from "react";
import consentImg from "@/assets/consent-paper.jpg";
import { emptyInput } from "@/lib/engine";
import { fieldDomId } from "@/lib/fields";
import { MODES, scrollToId, type Mode } from "@/lib/modes";
import { SCENARIOS } from "@/lib/scenarios";
import { blockLabel } from "@/lib/session";
import { TermTip } from "./TermTip";
import { DeskPanel } from "./DeskPanel";
import { ArrivalNotice } from "./ArrivalNotice";
import { PromiseVsPlace } from "./PromiseVsPlace";
import { SavedSets, VenueBar } from "./VenueBar";
import { StageReadout } from "./StageReadout";
import { useDesk } from "@/lib/desk-context";
import { PASTE_SAMPLE } from "./VenueIntake";
import { AppearanceControl } from "@/components/shell/AppearanceControl";
import { HouseBar } from "@/components/shell/HouseBar";
import { Hero } from "@/components/shell/Hero";
import { LabsFooter } from "@/components/shell/LabsFooter";

const SEEN_LIBRARY = "spa-intel-seen-library";

/**
 * Panel names, one list, read by the tab strip, the house nav and the footer.
 *
 * `MODES` is the registry and every label here is its own, with one exception:
 * it calls the fast path "Start here", which is wayfinding rather than a name,
 * and it is the only place in the app that does. The route title, the hero
 * action, the 404 link and the panel's own eyebrow all say "Four questions" —
 * as did the interface dictionary that used to feed the house nav, which is
 * how the tab strip and the nav ended up labelling one panel two ways. The
 * override belongs in modes.ts; it sits here until that file can be edited.
 */
const PANELS: typeof MODES = MODES.map((m) =>
  m.id === "fast" ? { ...m, label: "Four questions" } : m,
);

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

/**
 * Fleet shell. House bar, full-bleed hero, then the working surface. Every
 * panel stays reachable: the six-item house nav covers the common paths and
 * the full eight-panel tab strip sits above the working panel.
 */
export function DeskLayout(_props: { children?: ReactNode }) {
  const desk = useDesk();
  const mode = desk.mode;

  const loadFeaturedDemo = () => {
    const s = SCENARIOS[0]!;
    desk.setActiveInput(s.input);
    desk.renameBlock(desk.active.id, s.title.split("·")[0]!.trim().slice(0, 32));
    desk.setLoaded(s.id);
    desk.go("full");
  };

  const openPaste = (text?: string) => {
    if (text === "sample") desk.setIntakeDraft(PASTE_SAMPLE);
    else if (text?.trim()) desk.setIntakeDraft(text);
    desk.go("intake", { scroll: "panel" });
    window.setTimeout(() => focusPaste(), 60);
  };

  const startFast = () => {
    desk.go("fast", { scroll: "panel" });
    window.setTimeout(() => focusDeskField(), 80);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <HouseBar mode={mode} panels={PANELS} onNavigate={(m) => desk.go(m, { scroll: "panel" })} />

      <main>
        {/* 1 · Hero */}
        <Hero onStart={startFast} onExamples={() => scrollToId("demos", "smooth")} />

        {/* 2 · Working surface */}
        <section id="desk" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-8 md:px-8 md:py-10">
          <DeskActions
            mode={mode}
            hasInput={desk.hasInput}
            place={desk.a.place}
            burden={desk.a.burden.band}
            failClosed={desk.a.failClosed.length}
            venues={desk.blocks.length}
            onDemo={loadFeaturedDemo}
            onPaste={openPaste}
            onFast={startFast}
            onPrep={() => desk.go("prep", { scroll: "panel" })}
          />

          <ModeTabs mode={mode} />

          <ArrivalNotice />

          <p className="eyebrow mb-5" id="work-panel-label">
            Now on this desk · {PANELS.find((m) => m.id === mode)?.label}
          </p>

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
            <LibraryPointer mode={mode} />
            <p className="text-xs leading-relaxed text-ink-soft">
              Education only · no diagnosis, candidacy or ranking. Saved in this browser only —
              nothing is transmitted. Where identity is unresolved the desk fails closed and prints
              the gap.
            </p>
          </div>
        </section>

        {/* 3 · Results */}
        {desk.hasInput ? (
          <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
            <PromiseVsPlace a={desk.a} />
          </section>
        ) : null}

        {/* 4 · Demo settings */}
        <Demos />

        {/* 5 · Chapter break */}
        <ChapterBreak />

        {/* 6 · Method and boundaries */}
        <Method />
      </main>

      {/* 7 · Labs footer */}
      <LabsFooter panels={PANELS} />

      {/* 8 · The one floating control */}
      <AppearanceControl />
    </div>
  );
}

/** The actions and readouts that used to crowd the hero. Below the fold now. */
function DeskActions({
  mode,
  hasInput,
  place,
  burden,
  failClosed,
  venues,
  onDemo,
  onPaste,
  onFast,
  onPrep,
}: {
  mode: Mode;
  hasInput: boolean;
  place: number;
  burden: string;
  failClosed: number;
  venues: number;
  onDemo: () => void;
  onPaste: (text?: string) => void;
  onFast: () => void;
  onPrep: () => void;
}) {
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
            <button type="button" className="btn-primary" onClick={onFast}>
              Four questions
            </button>
            <button type="button" className="btn-quiet" onClick={() => onPaste()}>
              Paste a menu or ad
            </button>
            <button type="button" className="btn-quiet" onClick={onDemo}>
              Try a demo
            </button>
            {hasInput ? (
              <button type="button" className="btn-quiet" onClick={onPrep}>
                Consultation prep
              </button>
            ) : null}
          </div>
        </div>

        {hasInput ? (
          <dl className="grid grid-cols-2 gap-px border border-rule bg-rule md:w-64">
            {(
              [
                ["Resolved", `${place}%`, "place"],
                ["Burden", burden, "burden"],
                ["Unnamed", String(failClosed), "failClosed"],
                ["On the desk", `${venues} venue${venues === 1 ? "" : "s"}`, null],
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
            {mode === "fast"
              ? "Four answers is enough to start. The desk quotes the sentence behind every fill."
              : "The room answers first. The promise waits."}
          </p>
        )}
      </div>
    </div>
  );
}

function ModeTabs({ mode }: { mode: Mode }) {
  const desk = useDesk();
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
        <div
          ref={scroller}
          className="mode-tabs-scroller flex flex-nowrap items-center gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Desk panels"
        >
          {PANELS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              data-mode={m.id}
              aria-selected={mode === m.id}
              className={
                mode === m.id
                  ? "segment segment-active shrink-0 whitespace-nowrap"
                  : "segment shrink-0 whitespace-nowrap"
              }
              onClick={() => desk.go(m.id, { scroll: "panel" })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-soft md:hidden">
        On a phone · swipe the panel names
      </p>
    </div>
  );
}

function LibraryPointer({ mode }: { mode: Mode }) {
  const desk = useDesk();
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
        <button
          type="button"
          className="underline decoration-dotted underline-offset-2"
          onClick={() => {
            try {
              window.localStorage.setItem(SEEN_LIBRARY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
            desk.go("library", { scroll: "panel" });
          }}
        >
          Reference library
        </button>{" "}
        names what each service class has to disclose, expands NP, RN, PA-C and the rest, and points
        at the board that checks a license.
      </p>
    </div>
  );
}

function Demos() {
  const desk = useDesk();
  return (
    <section id="demos" className="scroll-mt-16 border-y border-rule bg-oxblood-tint/45">
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

function ChapterBreak() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-deep">
      <img
        src={consentImg}
        alt="Macro view of cream consent paperwork with a blank signature line and an unticked box, brass pen resting across it"
        width={1920}
        height={912}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
      />
      <div className="scrim-hero absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="chapter-mark text-pearl/60">Chapter · the unsigned line</p>
        <h2 className="display-lg mt-6 max-w-3xl text-pearl">
          A blank box is not consent.
          <span className="block italic text-pearl/70">It is a question nobody asked.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-pearl/80">
          The desk records a declined answer differently from silence. Both stay open. Neither is
          smoothed into a result.
        </p>
      </div>
    </section>
  );
}

/** Method, boundaries and the standing limits — the rigor, kept below the fold. */
function Method() {
  return (
    <section className="border-t border-rule bg-parchment">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">This guide</p>
            <h2 className="display-lg mt-3 text-ink">What the desk does</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
              {[
                "Scores how much of the setting is actually named before you book",
                "Separates day spa, hotel spa, suite rental, mobile, med-spa, dental-adjacent, and clinic questions",
                "Holds performer, license, product, device, sanitation, and jurisdiction to the same standard",
                "Compares up to five settings on disclosure, and prints the residual unknowns",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="num text-bronze">
                    ·
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Boundaries</p>
            <h2 className="display-lg mt-3 text-ink">What it will not pretend</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
              {[
                "No diagnosis, candidacy, or clinical clearance",
                "No provider ranking and no outcome promises",
                "Comparison measures disclosure, never safety or quality",
                "Unnamed identity stays unresolved — we do not guess",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="num text-oxblood">
                    ·
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Education only", "No diagnosis, candidacy, provider ranking, or clinical verdict."],
            ["Unknowns stay", "Gaps are printed, not smoothed over or filled in by inference."],
            [
              "Unnamed stays open",
              "Tier language and voicemail queues count as unresolved. We do not guess.",
            ],
            ["This browser only", "The desk autosaves locally. Nothing is transmitted anywhere."],
          ].map(([t, d]) => (
            <div key={t} className="bg-bone px-4 py-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-oxblood">
                {t}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
