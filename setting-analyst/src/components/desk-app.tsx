import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Moon,
  Printer,
  Sun,
  Contrast,
} from "lucide-react";
import { Chip, EmptyDesk, Field, Meter, SectionHead, Why } from "@/components/bits";
import { MiniResult, ResultCard } from "@/components/result-card";
import { DEMOS } from "@/lib/data/demos";
import {
  CATALOG_PROVENANCE,
  LICENSE_GLOSSARY,
  PRODUCTS,
  REGIONS,
  SERVICE_CLASS_LABEL,
  SERVICES,
  VENUES,
} from "@/lib/data/catalog";
import { CONTEXT_LINKS, EDITORIAL } from "@/lib/data/editorial";
import { cn } from "@/lib/cn";
import { decodeClaims } from "@/lib/engine/claims";
import { evaluate, isDeskActive } from "@/lib/engine/evaluate";
import { extractFromPaste } from "@/lib/engine/extract";
import { consultQuestions } from "@/lib/engine/questions";
import { applyProbe, whatIfAll } from "@/lib/engine/sensitivity";
import { ASKED_NO_ANSWER, type DeskInput, type Mode, type ServiceClass, type VenueId } from "@/lib/engine/types";
import { useDesk, type Theme } from "@/lib/store";

const MODES: { id: Mode; label: string }[] = [
  { id: "fast", label: "Fast path" },
  { id: "intake", label: "Add venue text" },
  { id: "full", label: "Full evaluate" },
  { id: "whatif", label: "What if" },
  { id: "compare", label: "Compare venues" },
  { id: "prep", label: "Consult prep" },
  { id: "decode", label: "Claim decoder" },
  { id: "library", label: "Reference library" },
  { id: "packet", label: "Decision packet" },
];

export function DeskApp() {
  const theme = useDesk((s) => s.theme);
  const setTheme = useDesk((s) => s.setTheme);
  const input = useDesk((s) => s.input);
  const mode = useDesk((s) => s.mode);
  const setMode = useDesk((s) => s.setMode);

  useEffect(() => {
    void useDesk.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "pearl" ? "" : theme;
    if (theme === "pearl") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  const evaluation = useMemo(() => evaluate(input), [input]);
  const active = isDeskActive(input);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-(--bone) text-(--ink)">
      <a className="skip-link" href="#desk">
        Skip to desk
      </a>
      <Header theme={theme} setTheme={setTheme} mode={mode} setMode={setMode} />
      <main>
        <Hero onStart={() => {
          document.getElementById("desk")?.scrollIntoView({ behavior: "smooth" });
          setMode("fast");
        }} />
        <section id="desk" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-8 md:px-8 md:py-10">
          <HowTo setMode={setMode} />
          <ModeTabs mode={mode} setMode={setMode} />
          {mode === "fast" && <FastPath evaluation={evaluation} active={active} />}
          {mode === "intake" && <IntakePanel />}
          {mode === "full" && <FullEvaluate evaluation={evaluation} />}
          {mode === "whatif" && <WhatIfPanel evaluation={evaluation} />}
          {mode === "compare" && <ComparePanel />}
          {mode === "prep" && <PrepPanel evaluation={evaluation} />}
          {mode === "decode" && <DecoderPanel />}
          {mode === "library" && <LibraryPanel />}
          {mode === "packet" && <PacketPanel evaluation={evaluation} />}
        </section>
        <Demos />
        <Chapter />
        <Instrument />
      </main>
      <Footer />
    </div>
  );
}

function Header({
  theme,
  setTheme,
  mode,
  setMode,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-(--rule) bg-(--bone)/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-2.5 overflow-x-auto px-4 py-2.5 md:gap-4 md:px-8">
        <a
          href={EDITORIAL.house}
          target="_blank"
          rel="noopener"
          className="shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-(--gold) no-underline hover:underline"
        >
          Northern Lantern House Labs
        </a>
        <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-(--rule) lg:block" />
        <a
          href={EDITORIAL.home}
          target="_blank"
          rel="noopener"
          className="hidden shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-(--ink-soft) no-underline hover:text-(--oxblood) lg:inline"
        >
          Vanity or Vice
        </a>
        <nav aria-label="App panels" className="ml-auto flex shrink-0 items-center gap-1">
          {MODES.slice(0, 5).map((m) => (
            <button
              key={m.id}
              type="button"
              aria-current={mode === m.id ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 px-1.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em]",
                mode === m.id ? "border-(--oxblood) text-(--oxblood)" : "border-transparent text-(--ink-soft) hover:text-(--ink)",
              )}
              onClick={() => {
                setMode(m.id);
                document.getElementById("desk")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {m.label}
            </button>
          ))}
        </nav>
        <div role="group" aria-label="Display mode" className="flex shrink-0 items-center border border-(--rule)">
          {(
            [
              ["pearl", Sun, "Pearl"],
              ["dark", Moon, "Dark"],
              ["cvd", Contrast, "High contrast"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={theme === id}
              title={label}
              className={cn("px-2 py-1.5", theme === id ? "bg-(--oxblood) text-(--pearl)" : "text-(--ink-soft) hover:text-(--ink)")}
              onClick={() => setTheme(id)}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  const bad = useMemo(() => evaluate(DEMOS[0].input), []);
  const good = useMemo(() => evaluate(DEMOS[1].input), []);
  const loadDemo = useDesk((s) => s.loadDemo);
  return (
    <section className="relative isolate overflow-hidden bg-(--navy-deep)">
      <img
        src="/images/room-night.jpg"
        alt="An empty reclining treatment chair upholstered in oxblood leather, lit by a single hard lamp, with an instrument cart waiting in shadow"
        width={1920}
        height={1088}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[62%_center]"
      />
      <div className="scrim-hero absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-20 md:px-8 md:pb-14 md:pt-24">
        <p className="chapter-mark text-(--pearl)/60">Spa Intelligence · Setting Evaluation Desk</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,7.4vw,5.2rem)] font-semibold leading-[0.92] tracking-[-0.028em] text-(--pearl)">
          See the room
          <span className="block italic text-(--pearl)/65">before you book it.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-(--pearl)/85">
          Spa Intelligence names the service, the setting, the performer and the product — then prints what nobody told you.
          It scores disclosure, not quality. Desire is allowed. The claim still has to answer.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button type="button" className="btn-accent" onClick={onStart}>
            Start with four questions
          </button>
          <button
            type="button"
            className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-(--pearl) underline decoration-(--pearl)/45 decoration-1 underline-offset-[6px]"
            onClick={() => {
              loadDemo("botox-special");
              onStart();
            }}
          >
            See a real setting
          </button>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <button type="button" className="text-left" onClick={() => { loadDemo("botox-special"); onStart(); }}>
            <MiniResult evaluation={bad} kicker="Worked example · flash-sale injectable" />
          </button>
          <button type="button" className="text-left" onClick={() => { loadDemo("tox-named-good"); onStart(); }}>
            <MiniResult evaluation={good} kicker="Worked example · named product and licensee" />
          </button>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-(--pearl)/70">
          Same class of service. Different amount of the room named. Neither card tells you whether to book — only what is still
          open. Click either to load it onto the desk.
        </p>
      </div>
    </section>
  );
}

function HowTo({ setMode }: { setMode: (m: Mode) => void }) {
  return (
    <div className="no-print mb-8 border border-(--rule) bg-(--parchment)">
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
        <div>
          <p className="eyebrow">Three steps</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-5">
            <li className="flex gap-2.5">
              <span className="num shrink-0 text-(--oxblood)">1</span>
              <span className="text-sm leading-snug text-(--ink-soft)">Name the service and the setting.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="num shrink-0 text-(--oxblood)">2</span>
              <span className="text-sm leading-snug text-(--ink-soft)">See what the spa hasn’t told you.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="num shrink-0 text-(--oxblood)">3</span>
              <span className="text-sm leading-snug text-(--ink-soft)">Print the packet for your consult.</span>
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button type="button" className="btn-primary" onClick={() => setMode("fast")}>
              Four questions
            </button>
            <button type="button" className="btn-quiet" onClick={() => setMode("intake")}>
              Paste a menu or ad
            </button>
            <button type="button" className="btn-quiet" onClick={() => {
              document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Try a demo
            </button>
          </div>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-(--ink-soft) md:w-64">
          Four answers is enough to start. The desk quotes the sentence behind every fill. Nothing is transmitted.
        </p>
      </div>
    </div>
  );
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="mode-tabs no-print mb-5">
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto" role="tablist" aria-label="Desk panels">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={cn("segment", mode === m.id && "segment-active")}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FastPath({ evaluation, active }: { evaluation: ReturnType<typeof evaluate>; active: boolean }) {
  const input = useDesk((s) => s.input);
  const setInput = useDesk((s) => s.setInput);
  const setMode = useDesk((s) => s.setMode);
  const lastSavedAt = useDesk((s) => s.lastSavedAt);
  const saved = useDesk((s) => s.saved);
  const saveNamed = useDesk((s) => s.saveNamed);
  const [name, setName] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
      <div className="panel p-5 md:p-6">
        <p className="eyebrow">Now on this desk · Fast path</p>
        <h2 className="mt-2 font-display text-3xl leading-tight">What are you considering?</h2>
        <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">
          Four fields produce a card. Use “I don’t know” or “They wouldn’t answer” instead of inventing a name.
        </p>
        <div className="mt-6 grid gap-4">
          <Field id="menuLine" label="Menu identity" hint="Quote the line, not the mood.">
            <input
              id="menuLine"
              className="field-input"
              value={input.menuLine}
              onChange={(e) => setInput({ menuLine: e.target.value })}
              placeholder="e.g. Botox Cosmetic, glabella, 20 units"
              autoComplete="off"
            />
            <DontKnow onPick={(v) => setInput({ menuLine: v })} />
          </Field>
          <Field id="venue" label="Spa vs med-spa" hint="The name on the door is not the license inside.">
            <select
              id="venue"
              className="field-select"
              value={input.venue}
              onChange={(e) => setInput({ venue: e.target.value as VenueId })}
            >
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="performer" label="Who performs it" hint="A title is marketing. A license is checkable.">
            <input
              id="performer"
              className="field-input"
              value={input.performer}
              onChange={(e) => setInput({ performer: e.target.value })}
              placeholder="e.g. Nurse practitioner, license visible"
              autoComplete="off"
            />
            <DontKnow onPick={(v) => setInput({ performer: v })} />
          </Field>
          <Field id="product" label="Exact product / device" hint="The brand on the box, vial, or panel — not ‘medical-grade’.">
            <input
              id="product"
              className="field-input"
              value={input.product}
              onChange={(e) => setInput({ product: e.target.value })}
              placeholder="e.g. Botox Cosmetic, VI Peel, SkinPen"
              autoComplete="off"
            />
            <DontKnow onPick={(v) => setInput({ product: v })} />
          </Field>
          <Field id="serviceClass" label="Service class" hint="Optional here — the catalog will often infer it.">
            <select
              id="serviceClass"
              className="field-select"
              value={input.serviceClass}
              onChange={(e) => setInput({ serviceClass: e.target.value as ServiceClass })}
            >
              {(Object.keys(SERVICE_CLASS_LABEL) as ServiceClass[]).map((k) => (
                <option key={k} value={k}>
                  {SERVICE_CLASS_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--ink-soft)">
          {lastSavedAt ? `Autosaved in this browser · ${new Date(lastSavedAt).toLocaleString()}` : "Autosave not yet"} ·{" "}
          {saved.length} saved settings
        </p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveNamed(name);
            setName("");
          }}
        >
          <input
            className="field-input max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this setting"
            aria-label="Name this setting"
          />
          <button type="submit" className="btn-quiet">
            Save
          </button>
          <button type="button" className="btn-quiet" onClick={() => setMode("full")}>
            Dig deeper → full evaluate
          </button>
        </form>
      </div>
      <div>
        {active ? (
          <div className="space-y-4">
            <ResultCard evaluation={evaluation} />
            <SignalsStrip evaluation={evaluation} />
          </div>
        ) : (
          <EmptyDesk
            title="No service on the desk yet"
            body="Name the menu line, the setting, the person, and the product. Four fields produce a card. The rest of the desk exists for when four is not enough."
          />
        )}
      </div>
    </div>
  );
}

function DontKnow({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" className="chip" onClick={() => onPick("")}>
        Clear
      </button>
      <button type="button" className="chip" onClick={() => onPick(ASKED_NO_ANSWER)}>
        They wouldn’t answer
      </button>
    </div>
  );
}

function SignalsStrip({ evaluation }: { evaluation: ReturnType<typeof evaluate> }) {
  return (
    <div className="panel divide-y divide-(--rule)">
      {evaluation.signals
        .filter((s) => s.depth === "fast")
        .map((s) => (
          <div key={s.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{s.label}</p>
              <Chip state={s.state} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{s.reading}</p>
            <Why title="Why this matters">
              <p>{s.why}</p>
              <p className="mt-2">{s.ask}</p>
            </Why>
          </div>
        ))}
    </div>
  );
}

function IntakePanel() {
  const paste = useDesk((s) => s.paste);
  const setPaste = useDesk((s) => s.setPaste);
  const input = useDesk((s) => s.input);
  const replaceInput = useDesk((s) => s.replaceInput);
  const setMode = useDesk((s) => s.setMode);
  const [fills, setFills] = useState<ReturnType<typeof extractFromPaste>["fills"]>([]);

  function run() {
    const result = extractFromPaste(paste, input);
    replaceInput(result.next);
    setFills(result.fills);
    setMode("fast");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-5 md:p-6">
        <SectionHead
          kicker="Add venue text"
          title="Paste the menu, ad, or caption"
          lede="The desk extracts what the page actually said, quotes the sentence, and leaves the rest open. It will not fill a license it did not find."
        />
        <label className="field-label" htmlFor="paste">
          Venue copy
        </label>
        <textarea
          id="paste"
          className="field-area"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste the treatment menu, Instagram caption, or consult notes."
        />
        <button type="button" className="btn-primary mt-4" onClick={run} disabled={!paste.trim()}>
          Read this copy
        </button>
      </div>
      <div className="panel p-5 md:p-6">
        <p className="eyebrow">Quoted fills</p>
        {fills.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-(--ink-soft)">
            Nothing extracted yet. An empty desk is a valid state. Nothing is inferred on your behalf.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {fills.map((f) => (
              <li key={f.key} className="border-b border-(--rule) pb-3">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--oxblood)">
                  {f.key} · {f.confidence}
                </p>
                <p className="mt-1 text-sm">{f.value}</p>
                {f.quote ? <p className="mt-1 text-sm italic text-(--ink-soft)">“{f.quote}”</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FullEvaluate({ evaluation }: { evaluation: ReturnType<typeof evaluate> }) {
  const input = useDesk((s) => s.input);
  const setInput = useDesk((s) => s.setInput);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="panel grid gap-4 p-5 md:p-6">
        <SectionHead
          kicker="Full evaluate"
          title="The rest of the room"
          lede="Fast path is identity. These fields are how the night is owned, how tools are processed, and what the copy is asking you to feel."
        />
        <Field id="venueName" label="Venue name (optional, stays in this browser)">
          <input id="venueName" className="field-input" value={input.venueName} onChange={(e) => setInput({ venueName: e.target.value })} />
        </Field>
        <Field id="region" label="Jurisdiction">
          <select id="region" className="field-select" value={input.region} onChange={(e) => setInput({ region: e.target.value as DeskInput["region"] })}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="license" label="License / credential as printed">
          <input id="license" className="field-input" value={input.license} onChange={(e) => setInput({ license: e.target.value })} placeholder="NP, RN, PA-C, MD…" />
        </Field>
        <Field id="supervision" label="Oversight on site">
          <input id="supervision" className="field-input" value={input.supervision} onChange={(e) => setInput({ supervision: e.target.value })} placeholder="Named director on site / available by phone" />
          <DontKnow onPick={(v) => setInput({ supervision: v })} />
        </Field>
        <Field id="sanitation" label="Sanitation signals">
          <input id="sanitation" className="field-input" value={input.sanitation} onChange={(e) => setInput({ sanitation: e.target.value })} placeholder="Single-use tips opened in front of me" />
        </Field>
        <Field id="afterHours" label="After-hours ownership">
          <input id="afterHours" className="field-input" value={input.afterHours} onChange={(e) => setInput({ afterHours: e.target.value })} placeholder="Named licensee cell line" />
          <DontKnow onPick={(v) => setInput({ afterHours: v })} />
        </Field>
        <Field id="consent" label="Consent">
          <input id="consent" className="field-input" value={input.consent} onChange={(e) => setInput({ consent: e.target.value })} placeholder="Written form before payment" />
        </Field>
        <Field id="price" label="Stated price">
          <input id="price" className="field-input" value={input.price} onChange={(e) => setInput({ price: e.target.value })} placeholder="$13 per unit" />
        </Field>
        <Field id="series" label="Series / membership / prepay">
          <input id="series" className="field-input" value={input.seriesPressure} onChange={(e) => setInput({ seriesPressure: e.target.value })} />
        </Field>
        <Field id="marketing" label="Marketing copy (for the claim decoder)">
          <textarea id="marketing" className="field-area" value={input.marketing} onChange={(e) => setInput({ marketing: e.target.value })} />
        </Field>
      </div>
      <div className="space-y-4">
        <ResultCard evaluation={evaluation} />
        <div className="panel divide-y divide-(--rule)">
          {evaluation.signals.map((s) => (
            <div key={s.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{s.label}</p>
                <Chip state={s.state} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{s.reading}</p>
              <Why title="Why this field">
                <p>{s.why}</p>
                <p className="mt-2">{s.ask}</p>
              </Why>
            </div>
          ))}
        </div>
        {evaluation.claims.length > 0 ? (
          <div className="panel p-5">
            <p className="eyebrow">Claims in the copy</p>
            <ul className="mt-4 space-y-3">
              {evaluation.claims.map((c) => (
                <li key={c.category}>
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--oxblood)">
                    {c.severity} · {c.category}
                  </p>
                  <p className="mt-1 text-sm italic">“{c.phrase}”</p>
                  <p className="mt-1 text-sm text-(--ink-soft)">{c.hides}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <EditorialHints text={`${input.marketing} ${input.menuLine} ${input.product}`} />
      </div>
    </div>
  );
}

function WhatIfPanel({ evaluation }: { evaluation: ReturnType<typeof evaluate> }) {
  const input = useDesk((s) => s.input);
  const replaceInput = useDesk((s) => s.replaceInput);
  const rows = useMemo(() => whatIfAll(input, evaluation), [input, evaluation]);
  if (!isDeskActive(input)) {
    return (
      <EmptyDesk
        title="Nothing to pressure-test yet"
        body="Load a demo or fill four fields. Then ask what would change the answer if one gap closed."
      />
    );
  }
  return (
    <div>
      <SectionHead
        kicker="What if"
        title="What would change this answer?"
        lede="Each row is a single hypothetical fill. The desk does not apply it until you say so. This is sensitivity, not a recommendation."
      />
      <div className="mb-6">
        <ResultCard evaluation={evaluation} compact />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-(--rule) text-left text-sm">
          <caption className="sr-only">Sensitivity of Place score to naming each open field</caption>
          <thead className="bg-(--bone) font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--ink-soft)">
            <tr>
              <th className="px-3 py-3">If this were named</th>
              <th className="px-3 py-3">Place now</th>
              <th className="px-3 py-3">Place after</th>
              <th className="px-3 py-3">Delta</th>
              <th className="px-3 py-3">Posture</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.field} className="border-t border-(--rule)">
                <td className="px-3 py-3 align-top">
                  <p className="font-medium">{row.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-(--ink-soft)">{row.proposed}</p>
                </td>
                <td className="px-3 py-3 tabular-nums">{row.placeBefore}</td>
                <td className="px-3 py-3 tabular-nums">{row.placeAfter}</td>
                <td className="px-3 py-3 tabular-nums text-(--oxblood)">+{row.delta}</td>
                <td className="px-3 py-3">{row.postureAfter}</td>
                <td className="px-3 py-3">
                  <button type="button" className="btn-quiet" onClick={() => replaceInput(applyProbe(input, row.field))}>
                    Apply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {evaluation.weakest ? (
        <p className="mt-4 text-sm leading-relaxed text-(--ink-soft)">
          Weakest assumption on this desk: <strong>{evaluation.weakest.label}</strong>. {evaluation.weakest.reading}
        </p>
      ) : null}
    </div>
  );
}

function ComparePanel() {
  const saved = useDesk((s) => s.saved);
  const input = useDesk((s) => s.input);
  const saveNamed = useDesk((s) => s.saveNamed);
  const compareIds = useDesk((s) => s.compareIds);
  const toggleCompare = useDesk((s) => s.toggleCompare);
  const loadSaved = useDesk((s) => s.loadSaved);
  const loadDemo = useDesk((s) => s.loadDemo);

  const currentEv = useMemo(() => evaluate(input), [input]);
  const selected = saved.filter((s) => compareIds.includes(s.id));
  const columns = [
    { id: "current", name: input.venueName || "This desk", ev: currentEv },
    ...selected.map((s) => ({ id: s.id, name: s.name, ev: evaluate(s.input) })),
  ].slice(0, 5);

  return (
    <div>
      <SectionHead
        kicker="Compare venues"
        title="Up to five settings, disclosure only"
        lede="Comparison measures how much of the room is named — never safety, quality, or who you should book. Highlighted cells are the differences."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <button type="button" className="btn-quiet" onClick={() => saveNamed(input.venueName || input.menuLine || "This desk")}>
          Save current to compare
        </button>
        {DEMOS.slice(0, 4).map((d) => (
          <button key={d.id} type="button" className="chip" onClick={() => loadDemo(d.id)}>
            Load {d.id.replace(/-/g, " ")}
          </button>
        ))}
      </div>
      {saved.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {saved.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={compareIds.includes(s.id)}
              className={cn("chip", compareIds.includes(s.id) && "chip-closed")}
              onClick={() => toggleCompare(s.id)}
            >
              {s.pinned ? "Pinned · " : ""}
              {s.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="mb-6 text-sm text-(--ink-soft)">Save named settings to hold them side by side. Demos can be loaded onto the desk first.</p>
      )}

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border border-(--rule) text-sm">
          <thead className="bg-(--bone)">
            <tr>
              <th className="px-3 py-3 text-left font-mono text-[0.625rem] uppercase tracking-[0.14em]">Signal</th>
              {columns.map((c) => (
                <th key={c.id} className="px-3 py-3 text-left">
                  {c.name}
                  <div className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-(--oxblood)">
                    Place {c.ev.place} · {c.ev.posture.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentEv.signals.map((signal) => {
              const states = columns.map((c) => c.ev.signals.find((x) => x.id === signal.id)?.state);
              const differs = new Set(states).size > 1;
              return (
                <tr key={signal.id} className={cn("border-t border-(--rule)", differs && "bg-(--oxblood-tint)")}>
                  <td className="px-3 py-3 font-medium">{signal.label}</td>
                  {columns.map((c) => {
                    const s = c.ev.signals.find((x) => x.id === signal.id);
                    return (
                      <td key={c.id} className="px-3 py-3 align-top">
                        {s ? <Chip state={s.state} /> : "—"}
                        <p className="mt-2 text-xs leading-relaxed text-(--ink-soft)">{s?.reading}</p>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {columns.map((c) => (
          <article key={c.id} className="panel p-4">
            <p className="eyebrow">{c.name}</p>
            <p className="mt-1 font-display text-2xl">{c.ev.posture.label}</p>
            <div className="mt-3">
              <Meter value={c.ev.place} label="Place" />
            </div>
            <ul className="mt-3 space-y-2">
              {c.ev.signals.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-2 text-sm">
                  <span>{s.label}</span>
                  <Chip state={s.state} />
                </li>
              ))}
            </ul>
            {c.id !== "current" ? (
              <button type="button" className="btn-quiet mt-4" onClick={() => loadSaved(c.id)}>
                Open on desk
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function PrepPanel({ evaluation }: { evaluation: ReturnType<typeof evaluate> }) {
  const input = useDesk((s) => s.input);
  const questions = useMemo(() => consultQuestions(input, evaluation), [input, evaluation]);
  const [copied, setCopied] = useState(false);
  const text = questions.map((q, i) => `${i + 1}. ${q.text}`).join("\n");
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div>
        <SectionHead
          kicker="Consult prep"
          title="Questions worth saying out loud"
          lede="A competent consultation should tolerate these without treating curiosity as disloyalty. Write the answers down before you leave."
        />
        <ol className="space-y-4">
          {questions.map((q, i) => (
            <li key={q.id} className="panel p-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--oxblood)">
                {String(i + 1).padStart(2, "0")} · {q.group} · {q.priority}
              </p>
              <p className="mt-2 text-base leading-relaxed">{q.text}</p>
              <p className="mt-2 text-sm text-(--ink-soft)">{q.why}</p>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="btn-quiet mt-4"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          <Copy className="mr-2 size-3.5" aria-hidden="true" />
          {copied ? "Copied" : "Copy questions"}
        </button>
      </div>
      <aside className="panel h-fit p-5">
        <p className="eyebrow">Handoff</p>
        <h3 className="mt-2 font-display text-2xl">Carry this into the Skincare Desk</h3>
        <p className="mt-3 text-sm leading-relaxed text-(--ink-soft)">
          The consultation receipt lives next door. It scores readiness to spend — identity, risks, after-hours owner — without
          this desk diagnosing you.
        </p>
        <pre className="mt-4 overflow-x-auto bg-(--bone) p-3 font-mono text-[0.7rem] leading-relaxed">
{JSON.stringify(
  {
    version: 1,
    from: "spa-intelligence",
    service: input.menuLine,
    product: input.product,
    performer: input.performer,
    license: input.license,
    venue: input.venue,
    region: input.region,
    unresolved: evaluation.failClosed.map((s) => s.label),
  },
  null,
  2,
)}
        </pre>
        <a className="btn-primary mt-4 inline-flex" href={EDITORIAL.skincareConsult} target="_blank" rel="noopener">
          Open consultation receipt
        </a>
      </aside>
    </div>
  );
}

function DecoderPanel() {
  const [text, setText] = useState("");
  const hits = useMemo(() => decodeClaims(text), [text]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-5 md:p-6">
        <SectionHead
          kicker="Claim decoder"
          title="Paste the exact wording"
          lede="The phrase looks finished. The evidence may still be getting dressed. This decoder separates the literal claim from the implied promise."
        />
        <label className="field-label" htmlFor="claim">
          Marketing sentence
        </label>
        <textarea id="claim" className="field-area" value={text} onChange={(e) => setText(e.target.value)} placeholder="Clinically proven glow. FDA-cleared. Guaranteed inches." />
      </div>
      <div className="panel p-5 md:p-6">
        {text.trim() === "" ? (
          <EmptyDesk title="No sentence on the desk" body="Copy one line from the menu, package, or provider page." />
        ) : hits.length === 0 ? (
          <div>
            <p className="eyebrow">Quiet copy</p>
            <p className="mt-3 text-sm leading-relaxed">
              No flagged patterns in this wording. Quiet copy is not proof. Identity (product, person, license) still has to be named on the fast path.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {hits.map((h) => (
              <li key={h.category} className="border-b border-(--rule) pb-4">
                <Chip state={h.severity === "hard" ? "fail-closed" : h.severity === "flag" ? "partial" : "info"} />
                <p className="mt-2 font-medium">{h.category}</p>
                <p className="mt-1 text-sm italic text-(--ink-soft)">“{h.phrase}”</p>
                <p className="mt-2 text-sm">Hides: {h.hides}</p>
                <p className="mt-1 text-sm">Ask: {h.ask}</p>
              </li>
            ))}
          </ul>
        )}
        <a className="mt-6 inline-block text-sm underline underline-offset-2" href={EDITORIAL.claimDecoder} target="_blank" rel="noopener">
          Editorial companion → how to take a claim apart
        </a>
      </div>
    </div>
  );
}

function LibraryPanel() {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const services = SERVICES.filter(
    (s) => !n || s.name.toLowerCase().includes(n) || s.aliases.some((a) => a.includes(n)) || s.group.toLowerCase().includes(n),
  );
  const products = PRODUCTS.filter(
    (s) => !n || s.name.toLowerCase().includes(n) || s.aliases.some((a) => a.includes(n)) || s.group.toLowerCase().includes(n),
  );
  return (
    <div>
      <SectionHead
        kicker="Reference library"
        title="Quote the menu, not the mood"
        lede="The catalog holds common lines across spa, med-spa, clinic and studio menus. It is a naming aid. It does not rank brands."
      />
      <label className="field-label" htmlFor="libq">
        Search services and products
      </label>
      <input id="libq" className="field-input mb-6 max-w-lg" value={q} onChange={(e) => setQ(e.target.value)} placeholder="botox, hydrafacial, peel, iv…" />
      <p className="mb-6 text-xs leading-relaxed text-(--ink-soft)">
        {CATALOG_PROVENANCE.source} · checked {CATALOG_PROVENANCE.checked} · {CATALOG_PROVENANCE.freshness}.{" "}
        {CATALOG_PROVENANCE.method}{" "}
        <a className="underline" href={CATALOG_PROVENANCE.sourceUrl} target="_blank" rel="noopener">
          Source
        </a>
        .
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Services · {services.length}</p>
          <ul className="mt-4 divide-y divide-(--rule) border border-(--rule)">
            {services.slice(0, 24).map((s) => (
              <li key={s.id} className="p-4">
                <p className="font-medium">{s.name}</p>
                <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-(--oxblood)">
                  {s.group} · {s.serviceClass}
                </p>
                <p className="mt-2 text-sm text-(--ink-soft)">{s.silent}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Products and platforms · {products.length}</p>
          <ul className="mt-4 divide-y divide-(--rule) border border-(--rule)">
            {products.slice(0, 24).map((s) => (
              <li key={s.id} className="p-4">
                <p className="font-medium">{s.name}</p>
                <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-(--oxblood)">
                  {s.group} · {s.rx ? "prescription-adjacent" : "ask the indication"}
                </p>
                <p className="mt-2 text-sm text-(--ink-soft)">{s.silent} {s.ask}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8 panel p-5">
        <p className="eyebrow">License glossary</p>
        <p className="mt-2 text-sm text-(--ink-soft)">
          A title is marketing. A license is checkable against the state board. First use:{" "}
          {LICENSE_GLOSSARY.map((g) => `${g.abbr} (${g.expand})`).join(", ")}.
        </p>
      </div>
    </div>
  );
}

function PacketPanel({ evaluation }: { evaluation: ReturnType<typeof evaluate> }) {
  const input = useDesk((s) => s.input);
  const questions = consultQuestions(input, evaluation);
  const clearDesk = useDesk((s) => s.clearDesk);
  const duplicateCurrent = useDesk((s) => s.duplicateCurrent);
  const dated = new Date().toLocaleDateString();
  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          <Printer className="mr-2 size-3.5" aria-hidden="true" />
          Print packet
        </button>
        <button type="button" className="btn-quiet" onClick={() => duplicateCurrent()}>
          Duplicate setting
        </button>
        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            if (confirm("Clear this venue from the desk? Saved settings are kept.")) clearDesk();
          }}
        >
          Clear this venue
        </button>
      </div>
      <article className="panel p-6 md:p-10" id="packet">
        <p className="eyebrow">Vanity or Vice · Spa Intelligence</p>
        <h2 className="mt-2 font-display text-4xl leading-none">Decision packet</h2>
        <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-(--ink-soft)">
          {dated} · education only · not a diagnosis · not a ranking
        </p>
        <ResultCard evaluation={evaluation} />
        <h3 className="mt-8 font-display text-2xl">Residual questions</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {questions.slice(0, 8).map((q) => (
            <li key={q.id}>{q.text}</li>
          ))}
        </ol>
        <h3 className="mt-8 font-display text-2xl">What this packet refuses</h3>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-(--ink-soft)">
          <li>No diagnosis, candidacy, or clinical clearance.</li>
          <li>No provider ranking and no outcome promises.</li>
          <li>Comparison measures disclosure, never safety or quality.</li>
          <li>Unnamed identity stays unresolved — we do not guess.</li>
        </ul>
      </article>
    </div>
  );
}

function Demos() {
  const loadDemo = useDesk((s) => s.loadDemo);
  const setMode = useDesk((s) => s.setMode);
  const clearDesk = useDesk((s) => s.clearDesk);
  return (
    <section id="demos" className="border-t border-(--rule) bg-(--bone)">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <SectionHead
          kicker="Try a demo"
          title="See a real setting, not a blank form"
          lede="Concrete menu lines from day spas, hotel spas, suite rentals, mobile services, and clinics. Nothing here is a real facility."
        />
        <div className="grid gap-px border border-(--rule) bg-(--rule) sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((d) => (
            <button
              key={d.id}
              type="button"
              className="bg-(--parchment) p-5 text-left hover:bg-(--bone)"
              onClick={() => {
                loadDemo(d.id);
                setMode("fast");
                document.getElementById("desk")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <p className="eyebrow">Demo scenario</p>
              <h3 className="mt-2 font-display text-2xl leading-tight">{d.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-(--ink-soft)">{d.note}</p>
              <p className="num mt-4 text-(--oxblood)">{d.expected}</p>
            </button>
          ))}
          <div className="bg-(--bone) p-5 sm:p-6">
            <p className="eyebrow">Or start clean</p>
            <p className="mt-3 text-sm leading-relaxed text-(--ink-soft)">An empty desk is a valid state. Nothing is inferred on your behalf.</p>
            <button type="button" className="btn-quiet mt-5" onClick={() => clearDesk()}>
              Clear this venue
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chapter() {
  return (
    <section className="relative isolate overflow-hidden bg-(--navy-deep)">
      <img
        src="/images/consent-paper.jpg"
        alt="Macro view of cream consent paperwork with a blank signature line and an unticked box, brass pen resting across it"
        width={1920}
        height={912}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
      />
      <div className="scrim-hero absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="chapter-mark text-(--pearl)/60">Chapter · the unsigned line</p>
        <h2 className="display-lg mt-6 max-w-3xl text-(--pearl)">
          A blank box is not consent.
          <span className="block italic text-(--pearl)/70">It is a question nobody asked.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-(--pearl)/80">
          The desk records a declined answer differently from silence. Both stay open. Neither is smoothed into a result.
        </p>
      </div>
    </section>
  );
}

function Instrument() {
  return (
    <section className="border-t border-(--rule) bg-(--parchment)">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">This guide</p>
            <h2 className="display-lg mt-3">What the desk does</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-(--ink-soft)">
              <li className="flex gap-3"><span className="num text-(--bronze)">·</span>Scores how much of the setting is actually named before you book</li>
              <li className="flex gap-3"><span className="num text-(--bronze)">·</span>Separates day spa, hotel spa, suite rental, mobile, med-spa, dental-adjacent, and clinic questions</li>
              <li className="flex gap-3"><span className="num text-(--bronze)">·</span>Holds performer, license, product, device, sanitation, and jurisdiction to the same standard</li>
              <li className="flex gap-3"><span className="num text-(--bronze)">·</span>Compares up to five settings on disclosure, and prints the residual unknowns</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Boundaries</p>
            <h2 className="display-lg mt-3">What it refuses to pretend</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-(--ink-soft)">
              <li className="flex gap-3"><span className="num text-(--oxblood)">·</span>No diagnosis, candidacy, or clinical clearance</li>
              <li className="flex gap-3"><span className="num text-(--oxblood)">·</span>No provider ranking and no outcome promises</li>
              <li className="flex gap-3"><span className="num text-(--oxblood)">·</span>Comparison measures disclosure, never safety or quality</li>
              <li className="flex gap-3"><span className="num text-(--oxblood)">·</span>Unnamed identity stays unresolved — we do not guess</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 grid gap-px border border-(--rule) bg-(--rule) sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Education only", "No diagnosis, candidacy, provider ranking, or clinical verdict."],
            ["Unknowns stay", "Gaps are printed, not smoothed over or filled in by inference."],
            ["Unnamed stays open", "Tier language and voicemail queues count as unresolved."],
            ["This browser only", "The desk autosaves locally. Nothing is transmitted anywhere."],
          ].map(([k, v]) => (
            <div key={k} className="bg-(--bone) px-4 py-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-(--oxblood)">{k}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-(--ink-soft)">{v}</p>
            </div>
          ))}
        </div>
        <Feedback />
      </div>
    </section>
  );
}

function Feedback() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const input = useDesk((s) => s.input);
  return (
    <div className="mt-10 panel p-5">
      <p className="eyebrow">Correction loop</p>
      <h3 className="mt-2 font-display text-2xl">Saw a stale line, a missing option, or a confusing output?</h3>
      <p className="mt-2 max-w-xl text-sm text-(--ink-soft)">
        No account. The note stays on your machine unless you choose to send it to{" "}
        <a className="underline" href="https://vanityvice.blog/contact/" target="_blank" rel="noopener">
          Vanity or Vice corrections
        </a>
        . The current menu line is attached so we know which record you mean.
      </p>
      {sent ? (
        <p className="mt-4 text-sm">Noted in this browser. Open the contact page if you want it on the record.</p>
      ) : (
        <>
          <button type="button" className="btn-quiet mt-4" onClick={() => setOpen((v) => !v)}>
            Report a problem
          </button>
          {open ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label className="field-label" htmlFor="fb">
                What should we look at
              </label>
              <textarea id="fb" className="field-area" required placeholder="Incorrect data, confusing output, missing option…" />
              <p className="text-xs text-(--ink-soft)">Attached locally: {input.menuLine || "empty desk"} · {input.venue} · {input.region}</p>
              <button type="submit" className="btn-primary w-fit">
                Keep the note
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}

function EditorialHints({ text }: { text: string }) {
  const links = CONTEXT_LINKS.filter((l) => l.match.test(text)).slice(0, 3);
  if (!links.length) return null;
  return (
    <div className="panel p-5">
      <p className="eyebrow">Deeper on Vanity or Vice</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <a className="text-sm underline decoration-(--oxblood)/40 underline-offset-2" href={l.href} target="_blank" rel="noopener">
              {l.label}
            </a>
            <span className="block text-xs text-(--ink-soft)">{l.why}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="no-print bg-(--navy-deep)">
      <div className="h-px w-full bg-(--gold)" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="font-display text-2xl leading-none text-(--gold) md:text-3xl">Northern Lantern House Labs</p>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-(--pearl)/50">The House</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-(--pearl)/75">
              Independent publications and the decision instruments built for them.
            </p>
            <a href={EDITORIAL.house} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-(--gold-soft) hover:underline">
              northernlanternhouse.com
            </a>
          </div>
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-(--pearl)/50">This publication</p>
            <div className="mt-3">
              <a href={EDITORIAL.home} target="_blank" rel="noopener" className="block py-1 text-sm text-(--pearl)/85 hover:text-(--gold-soft)">
                Vanity or Vice
              </a>
              <a href={EDITORIAL.makeupDesk} target="_blank" rel="noopener" className="block py-1 text-sm text-(--pearl)/85 hover:text-(--gold-soft)">
                Makeup Intelligence
              </a>
              <a href={EDITORIAL.skincareDesk} target="_blank" rel="noopener" className="block py-1 text-sm text-(--pearl)/85 hover:text-(--gold-soft)">
                Skincare Desk
              </a>
              <span className="block py-1 text-sm text-(--pearl)/55">
                Spa Intelligence <span className="text-(--gold-soft)">· you are here</span>
              </span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-(--pearl)/50">Across the fleet</p>
            <div className="mt-3 space-y-1 text-sm">
              <a className="block py-1 text-(--pearl)/85 hover:text-(--gold-soft)" href="https://saltnotes.blog" target="_blank" rel="noopener">Salty & Clever</a>
              <a className="block py-1 text-(--pearl)/85 hover:text-(--gold-soft)" href="https://tangledthistle.blog" target="_blank" rel="noopener">Tangled Thistle</a>
              <a className="block py-1 text-(--pearl)/85 hover:text-(--gold-soft)" href="https://dramaroom.blog" target="_blank" rel="noopener">Room for Drama</a>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-(--pearl)/15 pt-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-(--pearl)/55">© 2026 Northern Lantern House</p>
          <a href={EDITORIAL.legal} target="_blank" rel="noopener" className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-(--pearl)/75 hover:text-(--gold-soft)">
            Legal & Accessibility
          </a>
          <a href={EDITORIAL.support} target="_blank" rel="noopener" className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-(--pearl)/75 hover:text-(--gold-soft)">
            Support
          </a>
          <p className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.16em] text-(--pearl)/45">
            Education only · no diagnosis · no ranking · no candidacy
          </p>
        </div>
      </div>
    </footer>
  );
}
