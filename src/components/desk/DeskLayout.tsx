import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { emptyInput } from "@/lib/engine";
import { fieldDomId } from "@/lib/fields";
import { MODES, type Mode } from "@/lib/modes";
import { SCENARIOS } from "@/lib/scenarios";
import { blockLabel } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { TermTip } from "./TermTip";
import { DeskPanel } from "./DeskPanel";
import { Masthead } from "./Masthead";
import { PromiseVsPlace } from "./PromiseVsPlace";
import { SavedSets, VenueBar } from "./VenueBar";
import { StageReadout } from "./StageReadout";
import { useDesk } from "@/lib/desk-context";
import { PASTE_SAMPLE } from "./VenueIntake";
import { EDITORIAL, MAKEUP_DESK, PUBLICATION, SKINCARE_DESK } from "@/lib/seo";

const SEEN_LIBRARY = "spa-intel-seen-library";

function focusDeskField() {
  const el =
    document.getElementById(fieldDomId("menuLine")) ??
    document.querySelector<HTMLElement>("#work-panel select, #work-panel input, #work-panel textarea");
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
 * Shared desk chrome. The working panel sits first so each tab and CTA
 * changes what is already on screen. Venue / session chrome follows.
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

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <Header mode={mode} />

      <main>
        <Masthead
          mode={mode}
          onDemo={loadFeaturedDemo}
          onFast={() => {
            desk.go("fast", { scroll: "panel" });
            window.setTimeout(() => focusDeskField(), 80);
          }}
          onFull={() => desk.go("full", { scroll: "panel" })}
          onPrep={() => desk.go("prep", { scroll: "panel" })}
          onPaste={openPaste}
          place={desk.a.place}
          burden={desk.a.burden.band}
          failClosed={desk.a.failClosed.length}
          venues={desk.blocks.length}
          hasInput={desk.hasInput}
        />

        <section id="desk" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-6 md:px-8 md:py-8">
          <ModeTabs mode={mode} />

          <p className="eyebrow mb-5" id="work-panel-label">
            Now on this desk · {MODES.find((m) => m.id === mode)?.label}
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
          </div>
        </section>

        {desk.hasInput ? (
          <section className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
            <PromiseVsPlace a={desk.a} />
          </section>
        ) : null}

        <Rail />
        <Demos />
        <ChapterBreak />
        <Boundaries />
      </main>

      <Footer />
    </div>
  );
}

function Header({ mode }: { mode: Mode }) {
  const desk = useDesk();
  const { theme, toggle } = useTheme();
  const failClosed = desk.a.failClosed.length;
  const venues = desk.blocks.length;
  const toDay = theme === "dark";

  const printPacket = () => {
    if (mode !== "packet") {
      desk.go("packet", { scroll: "panel" });
      window.setTimeout(() => window.print(), 480);
    } else {
      window.print();
    }
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-bone/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 md:px-8 md:py-3.5">
        <Link
          to="/"
          className="min-w-0 no-underline"
          onClick={(e) => {
            e.preventDefault();
            desk.go("fast", { scroll: "top" });
          }}
        >
          <p className="eyebrow truncate">Vanity or Vice Desk</p>
          <p className="truncate font-display text-lg leading-none text-ink md:text-xl">
            Spa Intelligence
          </p>
        </Link>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <span
            className={
              !desk.hasInput
                ? "chip hidden sm:inline-flex"
                : failClosed > 0
                  ? "chip chip-fail hidden sm:inline-flex"
                  : "chip hidden sm:inline-flex"
            }
          >
            {!desk.hasInput ? (
              "Desk empty"
            ) : failClosed > 0 ? (
              <>
                {failClosed}{" "}
                <TermTip id="failClosed">fail closed</TermTip>
              </>
            ) : (
              "Desk clear"
            )}
          </span>
          {venues > 1 ? (
            <button
              type="button"
              onClick={() => desk.go("compare", { scroll: "panel" })}
              className="chip touch-chip transition-colors hover:border-oxblood/50"
            >
              {venues} venues
            </button>
          ) : null}
          <span className="hidden font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-soft lg:inline">
            English only for now
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-label={toDay ? "Switch to day desk" : "Switch to night desk"}
            title={toDay ? "Switch to day desk" : "Switch to night desk"}
            className="chip touch-chip transition-colors hover:border-oxblood/50"
          >
            <span aria-hidden="true">{toDay ? "◑" : "◐"}</span>
            <span className="hidden sm:inline">{toDay ? "Day desk" : "Night desk"}</span>
          </button>
          <button type="button" className="btn-quiet hidden md:inline-flex" onClick={printPacket}>
            Print
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              desk.go("fast", { scroll: "panel" });
              window.setTimeout(() => focusDeskField(), 80);
            }}
          >
            Start evaluate
          </button>
        </div>
      </div>
    </header>
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
    <div className="mode-tabs no-print mb-5">
      <div
        ref={scroller}
        className="flex flex-wrap items-center gap-1"
        role="tablist"
        aria-label="Desk panels"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            data-mode={m.id}
            aria-selected={mode === m.id}
            className={mode === m.id ? "segment segment-active" : "segment"}
            onClick={() => desk.go(m.id, { scroll: "panel" })}
          >
            {m.label}
          </button>
        ))}
      </div>
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
        names what each service class has to disclose, expands NP, RN, PA-C and the rest, and
        points at the board that checks a license.
      </p>
    </div>
  );
}

function Demos() {
  const desk = useDesk();
  return (
    <section id="demos" className="scroll-mt-16 border-y border-rule bg-parchment/50">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Try a demo</p>
            <h2 className="display-lg mt-3 text-ink">
              See a real setting, <span className="italic text-oxblood">not a blank form</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
            Concrete menu lines from day spas, hotel spas, suite rentals, mobile services, and
            clinics. Expected fail-closed patterns stay labeled — nothing here is a real facility.
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
                desk.loaded === s.id
                  ? "bg-oxblood-tint/40"
                  : "bg-parchment/70 hover:bg-oxblood-tint/25"
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
          <div className="border-b border-r border-rule bg-bone/60 p-5 sm:p-6">
            <p className="eyebrow">Or start clean</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              An empty desk is a valid state. Nothing is inferred on your behalf.
            </p>
            <button
              type="button"
              className="btn-quiet mt-5"
              onClick={() => {
                desk.setActiveInput(emptyInput, "typed");
                desk.renameBlock(
                  desk.active.id,
                  blockLabel(desk.blocks.indexOf(desk.active)),
                );
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
    <section className="relative isolate overflow-hidden border-y border-rule bg-oxblood-deep">
      <img
        src={consentImg}
        alt="Macro view of cream consent paperwork with a blank signature line and an unticked box, brass pen resting across it"
        width={1920}
        height={912}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
      />
      <div className="scrim-oxblood absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="chapter-mark text-bronze-soft">Chapter · the unsigned line</p>
        <h2 className="display-lg mt-6 max-w-3xl text-parchment">
          A blank box is not consent.
          <span className="block italic text-bronze-soft">It is a question nobody asked.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-parchment/80">
          The desk records a declined answer differently from silence. Both stay open. Neither is
          smoothed into a result.
        </p>
      </div>
    </section>
  );
}

function Rail() {
  const items = [
    ["Education only", "No diagnosis, candidacy, provider ranking, or clinical verdict."],
    ["Unknowns stay", "Gaps are printed, not smoothed over or filled in by inference."],
    ["Fail closed", "Tier language and voicemail queues count as unresolved."],
    ["This browser only", "The desk autosaves locally. Nothing is transmitted anywhere."],
  ];
  return (
    <section className="border-b border-rule bg-oxblood-deep">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        {items.map(([t, d]) => (
          <div key={t} className="flex gap-4">
            <span aria-hidden="true" className="mt-1.5 h-px w-6 shrink-0 bg-bronze" />
            <p className="text-sm leading-relaxed text-parchment/75">
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bronze-soft">
                {t}
              </span>
              <span className="mt-1 block">{d}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Boundaries() {
  return (
    <section className="border-t border-rule bg-parchment/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 md:px-8 md:py-16">
        <div>
          <p className="eyebrow">This instrument</p>
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
          <h2 className="display-lg mt-3 text-ink">What it refuses to pretend</h2>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
            {[
              "No diagnosis, candidacy, or clinical clearance",
              "No provider ranking and no outcome promises",
              "Comparison measures disclosure, never safety or quality",
              "Fail closed whenever identity is unresolved",
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
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-rule bg-oxblood-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-xl text-parchment">Spa Intelligence · Vanity or Vice</p>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bronze-soft">
            Saved in this browser only · Not medical advice · Claim Decoder is optional
          </p>
        </div>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bronze-soft">
          Education only
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <a
            href={PUBLICATION}
            className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-parchment hover:text-bronze"
          >
            Publication home
          </a>
          <a
            href={MAKEUP_DESK}
            className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-parchment hover:text-bronze"
          >
            Makeup Intelligence
          </a>
          <a
            href={SKINCARE_DESK}
            className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-parchment hover:text-bronze"
          >
            Skincare Desk
          </a>
          <a
            href={EDITORIAL}
            className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-parchment hover:text-bronze"
          >
            Editorial standards
          </a>
        </nav>
      </div>
    </footer>
  );
}
