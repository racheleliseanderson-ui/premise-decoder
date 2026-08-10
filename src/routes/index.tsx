import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { assess, emptyInput, type EvalInput } from "@/lib/engine";
import { SCENARIOS } from "@/lib/scenarios";
import { PromiseVsPlace } from "@/components/desk/PromiseVsPlace";
import { ConsultPrep, DecoderPanel, FastPath, FullEvaluate } from "@/components/desk/Paths";
import { DecisionCard } from "@/components/desk/DecisionCard";
import heroImg from "@/assets/hero-tray.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spa Intelligence · Setting Evaluation Desk · Vanity or Vice" },
      {
        name: "description",
        content:
          "Try the setting, not just the promise. Score menu identity, spa vs med-spa, who performs it and under what license, exact product or device, sanitation, burden and after-hours ownership. Education only.",
      },
      { property: "og:title", content: "Spa Intelligence · Setting Evaluation Desk" },
      {
        property: "og:description",
        content:
          "A fail-closed setting-evaluation instrument for before you book. Promise vs Place scoring, Claim Decoder, and a printable Setting Decision Packet. Education only.",
      },
      { name: "twitter:title", content: "Spa Intelligence · Setting Evaluation Desk" },
      {
        name: "twitter:description",
        content:
          "Promise vs Place scoring, Claim Decoder, consultation prep, and a printable Setting Decision Packet. Education only.",
      },
    ],
  }),
  component: Desk,
});

type Mode = "fast" | "full" | "prep" | "decode" | "packet";

const MODES: { id: Mode; label: string }[] = [
  { id: "fast", label: "Fast path" },
  { id: "full", label: "Full evaluate" },
  { id: "prep", label: "Consult prep" },
  { id: "decode", label: "Claim decoder" },
  { id: "packet", label: "Decision packet" },
];

function Desk() {
  const [input, setInput] = useState<EvalInput>(emptyInput);
  const [mode, setMode] = useState<Mode>("fast");
  const [loaded, setLoaded] = useState<string | null>(null);

  const patch = (p: Partial<EvalInput>) => setInput((s) => ({ ...s, ...p }));
  const a = useMemo(() => assess(input), [input]);

  return (
    <div className="min-h-dvh bg-background">
      <Header mode={mode} setMode={setMode} failClosed={a.failClosed.length} />

      <main>
        <Hero
          onFast={() => go("fast")}
          onFull={() => go("full")}
          onPrep={() => go("prep")}
          place={a.place}
        />

        <Rail />

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <PromiseVsPlace a={a} />
        </section>

        <section className="border-y border-rule bg-parchment/50">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Smart paths</p>
                <h2 className="display-lg mt-3 text-ink">
                  Start intelligent, <span className="italic text-oxblood">not blank</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                Five demonstration scenarios with realistic menu lines. Expected fail-closed patterns
                stay labeled — nothing here is a real facility.
              </p>
            </div>

            <div className="mt-9 grid gap-px border border-rule md:grid-cols-2 lg:grid-cols-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setInput(s.input);
                    setLoaded(s.id);
                    go("full");
                  }}
                  className={`group border-b border-r border-rule p-6 text-left transition-colors ${
                    loaded === s.id ? "bg-oxblood-tint/40" : "bg-parchment/70 hover:bg-oxblood-tint/25"
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
              <div className="hidden border-b border-r border-rule bg-bone/60 p-6 lg:block">
                <p className="eyebrow">Or start clean</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  An empty desk is a valid state. Nothing is inferred on your behalf.
                </p>
                <button
                  type="button"
                  className="btn-quiet mt-5"
                  onClick={() => {
                    setInput(emptyInput);
                    setLoaded(null);
                    go("fast");
                  }}
                >
                  Clear the desk
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="desk" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:px-8 md:py-24">
          <div className="no-print mb-12 flex flex-wrap items-center gap-1 border-b border-rule">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={mode === m.id ? "segment segment-active" : "segment"}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === "fast" && (
            <FastPath input={input} patch={patch} a={a} onDeepen={() => setMode("full")} />
          )}
          {mode === "full" && <FullEvaluate input={input} patch={patch} a={a} />}
          {mode === "prep" && <ConsultPrep a={a} />}
          {mode === "decode" && <DecoderPanel input={input} patch={patch} a={a} />}
          {mode === "packet" && (
            <div className="space-y-8">
              <div className="no-print flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-xl">
                  <p className="eyebrow">Setting decision packet</p>
                  <h2 className="display-lg mt-3 text-ink">Print it and take it with you</h2>
                  <p className="lede mt-4">
                    One page: what is known, what is fail closed, residual unknowns, and the cleanest
                    next verification steps. It states nothing it cannot support.
                  </p>
                </div>
                <button type="button" className="btn-primary" onClick={() => window.print()}>
                  Print to PDF
                </button>
              </div>
              <DecisionCard a={a} />
            </div>
          )}
        </section>

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

/* --------------------------------------------------------------- chrome */

function Header({
  mode,
  setMode,
  failClosed,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  failClosed: number;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-bone/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 md:px-8">
        <div className="min-w-0">
          <p className="eyebrow">Vanity or Vice Desk</p>
          <p className="font-display text-xl leading-none text-ink">Spa Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={failClosed > 0 ? "chip chip-fail" : "chip"}>
            {failClosed > 0 ? `${failClosed} fail closed` : "Desk clear"}
          </span>
          <button
            type="button"
            className="btn-primary hidden sm:inline-flex"
            onClick={() => {
              setMode(mode === "fast" ? "full" : "fast");
              document.getElementById("desk")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Start evaluate
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({
  onFast,
  onFull,
  onPrep,
  place,
}: {
  onFast: () => void;
  onFull: () => void;
  onPrep: () => void;
  place: number;
}) {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-16 md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:px-8 md:pb-20 md:pt-24">
        <div className="rise">
          <p className="eyebrow">Desire is allowed · the setting still has to answer</p>
          <h1 className="display-xl mt-6 text-ink">
            Before you book —
            <span className="block italic text-oxblood">try the setting,</span>
            <span className="block">not just the promise.</span>
          </h1>
          <p className="lede mt-7 max-w-xl">
            Menu identity, spa versus med-spa, who performs it and under what license, the exact product
            or device, sanitation practice, burden, and who owns the night — with fail-closed states kept
            visible. The Claim Decoder waits for when one marketing sentence is the whole problem.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={onFast}>
              Start fast path
            </button>
            <button type="button" className="btn-quiet" onClick={onFull}>
              Full evaluate
            </button>
            <button type="button" className="btn-quiet" onClick={onPrep}>
              Consultation prep
            </button>
          </div>
          <p className="num mt-8 text-xs text-ink-soft">
            SETTING RESOLVED {place}% · CREDENTIALS OVER FACILITY BRAND · EDUCATION ONLY
          </p>
        </div>

        <figure className="relative -mr-5 self-end md:mr-0">
          <img
            src={heroImg}
            alt="A steel instrument tray on travertine holding a sealed sterile pouch and an amber ampoule with a blank label"
            width={1600}
            height={1104}
            className="h-[22rem] w-full rounded-xl border border-rule object-cover shadow-[0_40px_80px_-60px_oklch(0.268_0.086_22/0.7)] md:h-[30rem]"
          />
          <figcaption className="mt-3 max-w-xs text-xs leading-relaxed text-ink-soft">
            The label is blank. Until someone reads the product name out loud, this is the whole finding.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Rail() {
  const items = [
    ["Education only", "No diagnosis, candidacy, provider ranking, or clinical verdict."],
    ["Unknowns stay", "Gaps are printed, not smoothed over or filled in by inference."],
    ["Fail closed", "Tier language and voicemail queues count as unresolved."],
  ];
  return (
    <section className="border-b border-rule bg-oxblood-deep">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 md:grid-cols-3 md:px-8">
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
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:px-8">
        <div>
          <p className="eyebrow">This instrument</p>
          <h2 className="display-lg mt-3 text-ink">What the desk does</h2>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
            {[
              "Scores how much of the setting is actually named before you book",
              "Separates spa, medical spa, and medical practice questions",
              "Holds performer, license, product, device, and sanitation to the same standard",
              "Prints burden, residual unknowns, and next verification steps",
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
              "The Claim Decoder is optional — not the product",
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 md:px-8">
        <p className="font-display text-xl text-parchment">Spa Intelligence · Vanity or Vice</p>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-bronze-soft">
          Session only · Not medical advice · Claim Decoder is optional
        </p>
      </div>
    </footer>
  );
}
