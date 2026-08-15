import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assess, emptyInput, type Assessment, type EvalInput } from "@/lib/engine";
import { stageStatuses, STAGE_DEFS, type StageId } from "@/lib/pipeline";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { StageStepper } from "@/components/desk/StageStepper";
import { Masthead } from "@/components/desk/Masthead";
import { EvidenceRail } from "@/components/desk/EvidenceRail";
import { fieldDomId } from "@/lib/fields";
import { SCENARIOS } from "@/lib/scenarios";
import { PromiseVsPlace } from "@/components/desk/PromiseVsPlace";
import { ConsultPrep, DecoderPanel, FastPath, FullEvaluate } from "@/components/desk/Paths";
import { DecisionCard } from "@/components/desk/DecisionCard";
import { Packet } from "@/components/desk/Packet";
import { ReferenceLibrary } from "@/components/desk/Library";
import { VenueIntake } from "@/components/desk/VenueIntake";
import { Compare } from "@/components/desk/Compare";
import { SavedSets, VenueBar } from "@/components/desk/VenueBar";
import {
  MAX_VENUES,
  blockLabel,
  clearDesk,
  deleteSet,
  listSets,
  loadDesk,
  makeBlock,
  newId,
  saveDesk,
  saveSet,
  type Evidence,
  type Origin,
  type SavedSet,
  type VenueBlock,
} from "@/lib/session";
import { useTheme, type Theme } from "@/lib/theme";
import { EDITORIAL, MAKEUP_DESK, PUBLICATION, shareHead, SKINCARE_DESK } from "@/lib/seo";
import consentImg from "@/assets/consent-paper.jpg";

export const Route = createFileRoute("/")({
  head: () => shareHead("/"),
  component: Desk,
});

type Mode = "fast" | "intake" | "full" | "compare" | "prep" | "decode" | "library" | "packet";

const MODES: { id: Mode; label: string }[] = [
  { id: "fast", label: "Fast path" },
  { id: "intake", label: "Add venue text" },
  { id: "full", label: "Full evaluate" },
  { id: "compare", label: "Compare venues" },
  { id: "prep", label: "Consult prep" },
  { id: "decode", label: "Claim decoder" },
  { id: "library", label: "Reference library" },
  { id: "packet", label: "Decision packet" },
];

const isMode = (v: string): v is Mode => MODES.some((m) => m.id === v);

function Desk() {
  const [blocks, setBlocks] = useState<VenueBlock[]>(() => [makeBlock(0)]);
  const [activeId, setActiveId] = useState<string>(() => "");
  const [mode, setMode] = useState<Mode>("fast");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [comparePdfBusy, setComparePdfBusy] = useState(false);
  const [sets, setSets] = useState<SavedSet[]>([]);
  const [savedAt, setSavedAt] = useState(0);
  const [running, setRunning] = useState<StageId | null>(null);
  const [runLog, setRunLog] = useState<{ at: number; text: string }[]>([]);
  const { lang, setLang, t } = useLang();
  const hydrated = useRef(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const stored = loadDesk();
    if (stored) {
      setBlocks(stored.blocks);
      setActiveId(stored.activeId);
      if (isMode(stored.mode)) setMode(stored.mode);
      setSavedAt(stored.savedAt);
    }
    setSets(listSets());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => {
      saveDesk({ blocks, activeId: active.id, mode });
      setSavedAt(Date.now());
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, activeId, mode]);

  const active = useMemo(
    () => blocks.find((b) => b.id === activeId) ?? blocks[0]!,
    [blocks, activeId],
  );
  const input = active.input;

  const assessments = useMemo(() => {
    const map: Record<string, Assessment> = {};
    for (const b of blocks) map[b.id] = assess(b.input);
    return map;
  }, [blocks]);
  const a = assessments[active.id] ?? assess(emptyInput);

  const hasInput = a.posture.key !== "empty";

  const multiUnlocked = Object.values(assessments).some(
    (x) => x.posture.key === "resolved",
  );

  const compareItems = useMemo(
    () => blocks.map((b) => ({ block: b, a: assessments[b.id] ?? assess(b.input) })),
    [blocks, assessments],
  );

  const [packetScope, setPacketScope] = useState<"active" | "all">("active");

  const patch = useCallback(
    (p: Partial<EvalInput>, meta?: Record<string, Evidence>) =>
      setBlocks((bs) =>
        bs.map((b) => {
          if (b.id !== active.id) return b;
          const evidence = { ...b.evidence };
          for (const key of Object.keys(p)) {
            const given = meta?.[key];
            const value = String((p as Record<string, unknown>)[key] ?? "");
            if (given) evidence[key] = given;
            else if (!value.trim()) delete evidence[key];
            else evidence[key] = { origin: "typed", at: Date.now() };
          }
          return { ...b, input: { ...b.input, ...p }, evidence };
        }),
      ),
    [active.id],
  );

  const setField = useCallback(
    (field: keyof EvalInput, value: string, origin: Origin = "typed") =>
      patch({ [field]: value } as Partial<EvalInput>, {
        [field]: { origin, at: Date.now() },
      }),
    [patch],
  );

  const setActiveInput = (next: EvalInput, origin: Origin = "scenario") =>
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== active.id) return b;
        const evidence: Record<string, Evidence> = {};
        for (const [k, v] of Object.entries(next)) {
          if (typeof v === "string" && v.trim() && k !== "serviceClass") {
            evidence[k] = { origin, at: Date.now() };
          }
        }
        return { ...b, input: { ...next }, evidence };
      }),
    );

  const addBlock = () =>
    setBlocks((bs) => {
      if (bs.length >= MAX_VENUES) return bs;
      const b = makeBlock(bs.length);
      setActiveId(b.id);
      return [...bs, b];
    });

  const duplicateBlock = (id: string) =>
    setBlocks((bs) => {
      if (bs.length >= MAX_VENUES) return bs;
      const src = bs.find((b) => b.id === id);
      if (!src) return bs;
      const copy: VenueBlock = {
        id: newId(),
        name: `${src.name} copy`.slice(0, 48),
        input: { ...src.input },
        evidence: { ...src.evidence },
      };
      setActiveId(copy.id);
      return [...bs, copy];
    });

  const removeBlock = (id: string) =>
    setBlocks((bs) => {
      if (bs.length <= 1) return bs;
      const next = bs.filter((b) => b.id !== id);
      if (id === activeId) setActiveId(next[0]!.id);
      return next;
    });

  const renameBlock = (id: string, name: string) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, name: name.slice(0, 48) } : b)));

  const onSaveSet = (name: string) => setSets(saveSet(name, blocks));
  const onDeleteSet = (id: string) => setSets(deleteSet(id));
  const onLoadSet = (id: string) => {
    const set = sets.find((s) => s.id === id);
    if (!set) return;
    setBlocks(set.blocks.map((b) => ({ ...b, input: { ...b.input } })));
    setActiveId(set.blocks[0]!.id);
    setLoaded(null);
    go(set.blocks.length > 1 ? "compare" : "full");
  };
  const onClearAll = () => {
    clearDesk();
    const fresh = makeBlock(0);
    setBlocks([fresh]);
    setActiveId(fresh.id);
    setLoaded(null);
    setMode("fast");
  };

  const stages = useMemo(
    () => stageStatuses(a, active.evidence, running),
    [a, active.evidence, running],
  );

  const runStage = (id: StageId) => {
    setRunning(id);
    const def = STAGE_DEFS.find((d) => d.id === id)!;
    window.setTimeout(() => {
      setRunning(null);
      const status = stageStatuses(a, active.evidence, null).find((s) => s.def.id === id);
      setRunLog((l) =>
        [{ at: Date.now(), text: `${def.name} · ${status?.line ?? "no reading"}` }, ...l].slice(
          0,
          20,
        ),
      );
    }, 420);
  };

  const runAll = () => {
    const order = STAGE_DEFS.map((d) => d.id);
    order.forEach((id, i) => {
      window.setTimeout(() => {
        setRunning(id);
        const def = STAGE_DEFS.find((d) => d.id === id)!;
        const status = stageStatuses(a, active.evidence, null).find((s) => s.def.id === id);
        setRunLog((l) =>
          [{ at: Date.now(), text: `${def.name} · ${status?.line ?? "no reading"}` }, ...l].slice(
            0,
            20,
          ),
        );
        if (i === order.length - 1) window.setTimeout(() => setRunning(null), 260);
      }, i * 300);
    });
  };

  const jumpToField = (field: string) => {
    setMode("full");
    window.setTimeout(() => {
      const el = document.getElementById(fieldDomId(field));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | null)?.focus?.();
    }, 120);
  };

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadPacketPdf } = await import("@/lib/packet-pdf");
      await downloadPacketPdf(a);
    } finally {
      setPdfBusy(false);
    }
  };

  const exportComparison = async () => {
    setComparePdfBusy(true);
    try {
      const { downloadComparisonPdf } = await import("@/lib/packet-pdf");
      await downloadComparisonPdf(compareItems.map((i) => ({ name: i.block.name, a: i.a })));
    } finally {
      setComparePdfBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Header
        mode={mode}
        setMode={setMode}
        failClosed={a.failClosed.length}
        venues={blocks.length}
        theme={theme}
        toggleTheme={toggle}
        lang={lang}
        setLang={setLang}
        t={t}
        hasInput={hasInput}
      />

      <main>
        <Masthead
          onDemo={() => {
            document.getElementById("demos")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onFast={() => go("fast")}
          onFull={() => go("full")}
          onPrep={() => go("prep")}
          onPaste={() => go("intake")}
          place={a.place}
          burden={a.burden.band}
          failClosed={a.failClosed.length}
          venues={blocks.length}
          hasInput={hasInput}
        />

        <Rail />

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
                clinics. Expected fail-closed patterns stay labeled — nothing here is a real
                facility.
              </p>
            </div>

            <div className="mt-9 grid gap-px border border-rule sm:grid-cols-2 lg:grid-cols-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveInput(s.input);
                    renameBlock(active.id, s.title.split("·")[0]!.trim().slice(0, 32));
                    setLoaded(s.id);
                    go("full");
                  }}
                  className={`group border-b border-r border-rule p-5 text-left transition-colors sm:p-6 ${
                    loaded === s.id
                      ? "bg-oxblood-tint/40"
                      : "bg-parchment/70 hover:bg-oxblood-tint/25"
                  }`}
                >
                  <p className="eyebrow">{loaded === s.id ? "On the desk" : "Demo scenario"}</p>
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
                    setActiveInput(emptyInput, "typed");
                    renameBlock(active.id, blockLabel(blocks.indexOf(active)));
                    setLoaded(null);
                    go("fast");
                  }}
                >
                  Clear this venue
                </button>
              </div>
            </div>
          </div>
        </section>

        {hasInput ? (
          <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-24">
            <PromiseVsPlace a={a} />
          </section>
        ) : null}

        <section id="desk" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-14 md:px-8 md:py-24">
          <div className="no-print space-y-4">
            <VenueBar
              blocks={blocks}
              activeId={active.id}
              scores={assessments}
              onSelect={setActiveId}
              onAdd={addBlock}
              onDuplicate={duplicateBlock}
              onRemove={removeBlock}
              onRename={renameBlock}
              onCompare={() => setMode("compare")}
              unlocked={multiUnlocked}
            />
            <SavedSets
              sets={sets}
              savedAt={savedAt}
              onSave={onSaveSet}
              onLoad={onLoadSet}
              onDelete={onDeleteSet}
              onClear={onClearAll}
            />
            {hasInput ? (
              <StageStepper
                stages={stages}
                running={running}
                log={runLog}
                onRun={runStage}
                onRunAll={runAll}
                onReset={() => setRunLog([])}
                onOpen={(m) => {
                  if (isMode(m)) setMode(m);
                }}
                title={t("run.title")}
                runAllLabel={t("run.all")}
              />
            ) : null}
          </div>

          <div className="no-print my-10 -mx-5 overflow-x-auto border-b border-rule px-5 md:mx-0 md:px-0">
            <div className="flex w-max min-w-full items-center gap-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={mode === m.id ? "segment segment-active" : "segment"}
                >
                  {t(`mode.${m.id}`)}
                </button>
              ))}
            </div>
          </div>

          {mode === "fast" && (
            <FastPath
              input={input}
              patch={patch}
              setField={setField}
              evidence={active.evidence}
              a={a}
              onDeepen={() => setMode("full")}
            />
          )}
          {mode === "intake" && (
            <VenueIntake
              input={input}
              patch={patch}
              a={a}
              evidence={active.evidence}
              onEvaluate={() => setMode("full")}
            />
          )}
          {mode === "full" && (
            <>
              <FullEvaluate
                input={input}
                patch={patch}
                setField={setField}
                evidence={active.evidence}
                a={a}
              />
              <div className="mt-14">
                <EvidenceRail a={a} evidence={active.evidence} onJump={jumpToField} />
              </div>
            </>
          )}
          {mode === "compare" && (
            <Compare
              items={compareItems}
              busy={comparePdfBusy}
              onDownload={exportComparison}
              onOpen={(id) => {
                setActiveId(id);
                setMode("full");
              }}
            />
          )}
          {mode === "prep" && <ConsultPrep a={a} />}
          {mode === "decode" && <DecoderPanel input={input} patch={patch} a={a} />}
          {mode === "library" && <ReferenceLibrary a={a} />}
          {mode === "packet" && (
            <div className="space-y-8">
              <div className="no-print flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-xl">
                  <p className="eyebrow">Setting decision packet · {active.name}</p>
                  <h2 className="display-lg mt-3 text-ink">Take it with you</h2>
                  <p className="lede mt-4">
                    Every field that was actually named, with the sentence it came from; every
                    refusal; every fail-closed signal; the burden drivers and the cleanest next
                    verification steps. Typeset for paper. It states nothing it cannot support.
                  </p>
                  {blocks.length > 1 ? (
                    <div className="mt-5 flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        className={packetScope === "active" ? "segment segment-active" : "segment"}
                        onClick={() => setPacketScope("active")}
                      >
                        This venue
                      </button>
                      <button
                        type="button"
                        className={packetScope === "all" ? "segment segment-active" : "segment"}
                        onClick={() => setPacketScope("all")}
                      >
                        All {blocks.length} venues
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={exportPdf}
                    disabled={pdfBusy}
                  >
                    {pdfBusy ? "Setting type…" : "Download PDF packet"}
                  </button>
                  {blocks.length > 1 ? (
                    <button
                      type="button"
                      className="btn-quiet"
                      onClick={exportComparison}
                      disabled={comparePdfBusy}
                    >
                      {comparePdfBusy
                        ? "Setting type…"
                        : `Comparison PDF · ${blocks.length} venues`}
                    </button>
                  ) : null}
                  <button type="button" className="btn-quiet" onClick={() => window.print()}>
                    Print packet
                  </button>
                </div>
              </div>
              <Packet
                items={
                  packetScope === "all"
                    ? compareItems
                    : compareItems.filter((i) => i.block.id === active.id)
                }
              />
              <div className="no-print">
                <DecisionCard a={a} />
              </div>
            </div>
          )}
        </section>

        <ChapterBreak />

        <Boundaries />
      </main>

      <Footer />
    </div>
  );

  function go(m: Mode) {
    setMode(m);
    if (typeof document !== "undefined") {
      document.getElementById("desk")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function Header({
  mode,
  setMode,
  failClosed,
  venues,
  theme,
  toggleTheme,
  lang,
  setLang,
  t,
  hasInput,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  failClosed: number;
  venues: number;
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  hasInput: boolean;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-bone/85 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 md:px-8 md:py-3.5">
        <a href={PUBLICATION} className="min-w-0">
          <p className="eyebrow truncate">{t("hdr.kicker")}</p>
          <p className="truncate font-display text-lg leading-none text-ink md:text-xl">
            Spa Intelligence
          </p>
        </a>
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {hasInput ? (
            <span
              className={
                failClosed > 0
                  ? "chip chip-fail hidden sm:inline-flex"
                  : "chip hidden sm:inline-flex"
              }
            >
              {failClosed > 0 ? `${failClosed} ${t("chip.failClosed")}` : t("chip.clear")}
            </span>
          ) : (
            <span className="chip hidden sm:inline-flex">Desk empty</span>
          )}
          {venues > 1 ? (
            <button
              type="button"
              onClick={() => {
                setMode("compare");
                document.getElementById("desk")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="chip transition-colors hover:border-oxblood/50"
            >
              {venues} {t("chip.venues")}
            </button>
          ) : null}
          <label className="sr-only" htmlFor="lang">
            {t("lang.label")}
          </label>
          <select
            id="lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="chip touch-chip cursor-pointer bg-transparent"
            title={t("lang.label")}
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.short}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to day desk" : "Switch to night desk"}
            title={theme === "dark" ? "Day desk" : "Night desk"}
            className="chip transition-colors hover:border-oxblood/50"
          >
            <span aria-hidden="true">{theme === "dark" ? "◐" : "◑"}</span>
            <span className="hidden sm:inline">
              {theme === "dark" ? t("theme.night") : t("theme.day")}
            </span>
          </button>
          <button
            type="button"
            className="btn-primary hidden sm:inline-flex"
            onClick={() => {
              document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {t("hdr.start")}
          </button>
        </div>
      </div>
    </header>
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
