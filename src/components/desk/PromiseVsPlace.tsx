import type { Assessment, GapState } from "@/lib/engine";
import { Meter, StateChip } from "./ui";
import { TermTip } from "./TermTip";
import { InfoTip } from "./InfoTip";
import { PromisePlaceFigure } from "@/components/figures/PromisePlace";

/**
 * How each gap state is presented. The sentence itself comes from the engine
 * (`a.gapLine`) so no view invents one from the number; what lives here is only
 * the emphasis. Only `level` is allowed to read quietly — every other state is
 * an open finding and is framed as one, including the two that used to be
 * indistinguishable from parity because `gap` was <= 0.
 */
const GAP_READ: Record<GapState, { word: string; chip: string; frame: string }> = {
  "no-promise": {
    word: "No promise on the desk",
    chip: "chip",
    frame: "border-l-2 border-bronze-soft/60 pl-3 text-parchment/85",
  },
  "no-place": {
    word: "Place unnamed",
    chip: "chip chip-fail",
    frame: "border-l-2 border-oxblood-tint pl-3 text-parchment",
  },
  "promise-far-ahead": {
    word: "Promise far ahead",
    chip: "chip chip-fail",
    frame: "border-l-2 border-oxblood-tint pl-3 text-parchment",
  },
  "promise-ahead": {
    word: "Promise ahead",
    chip: "chip chip-partial",
    frame: "border-l-2 border-bronze pl-3 text-parchment/85",
  },
  "level-unresolved": {
    word: "Level, still unnamed",
    chip: "chip chip-partial",
    frame: "border-l-2 border-bronze pl-3 text-parchment/85",
  },
  level: {
    word: "Level",
    chip: "chip chip-known",
    frame: "text-parchment/70",
  },
};

/**
 * Promise vs Place — the signature panel.
 * Left: marketing pressure. Right: how much of the setting is actually resolved.
 */
export function PromiseVsPlace({ a }: { a: Assessment }) {
  const empty = a.posture.key === "empty";
  const gap = GAP_READ[a.gapState];

  return (
    <>
      <PromiseVsPlacePanel a={a} empty={empty} gap={gap} />
      {/*
        The figure sits on the page ground rather than inside the ink panel.
        Both are correct places for it and only one of them keeps the figure's
        own contrast contract: the panel is a dark surface with parchment type,
        and a figure that paints in `--ink` on `--parchment` would invert inside
        it. Below the panel, on the desk's own ground, it reads as intended in
        both the day and the night desk.
      */}
      {!empty ? <PromisePlaceFigure a={a} className="mt-6" /> : null}
    </>
  );
}

function PromiseVsPlacePanel({
  a,
  empty,
  gap,
}: {
  a: Assessment;
  empty: boolean;
  gap: (typeof GAP_READ)[GapState];
}) {
  return (
    <section className="grain panel-ink relative overflow-hidden rounded-xl">
      <div className="relative grid gap-10 p-7 md:grid-cols-[1.05fr_1fr] md:gap-12 md:p-10">
        {/* scoring column */}
        <div>
          <p className="eyebrow text-bronze-soft/80">Setting literacy</p>
          <h2 className="display-lg mt-3 text-parchment">
            Promise vs
            <span className="block italic text-bronze-soft">place</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-parchment/70">
            Pretty menus are not a study design. The desk scores the identity of the room before it
            reads the glow copy.
          </p>

          <div className="mt-9 space-y-7">
            <ScoreRow
              label={
                <>
                  <TermTip id="promise" tone="parchment">
                    Promise
                  </TermTip>
                  {" — marketing pressure"}
                </>
              }
              value={a.promise}
              tone="oxblood"
              tip="How much of the copy is persuasion versus named product, person, and practice."
              note={
                empty
                  ? "Nothing to read yet."
                  : a.promise >= 55
                    ? "Persuasion is doing most of the work in this copy."
                    : a.promise >= 25
                      ? "Some persuasion, some specification."
                      : "Copy is unusually specific. Note it."
              }
            />
            <ScoreRow
              label={
                <>
                  <TermTip id="place" tone="parchment">
                    Place
                  </TermTip>
                  {" — setting resolved"}
                </>
              }
              value={a.place}
              tone="bronze"
              tip="Share of the setting that is named and checkable, not inferred."
              note={
                empty
                  ? "Four fields is enough to move this."
                  : `${a.known.length} of ${a.signals.length} signals named · ${a.failClosed.length} unnamed`
              }
            />
          </div>

          {!empty && (
            <div className="mt-8 border-t border-bronze-soft/20 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow text-bronze-soft/80">
                  <TermTip id="gap" tone="parchment">
                    Gap
                  </TermTip>
                </p>
                <span className={gap.chip}>{gap.word}</span>
              </div>
              {/* With no copy on the desk the promise is 0 by construction, so the
                  subtraction is arithmetic about an empty column rather than a
                  reading. It prints as a dash instead of a reassuring number. */}
              <p className="num mt-2 text-3xl text-parchment">
                {a.gapState === "no-promise" ? (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">No gap figure — nothing to compare against</span>
                  </>
                ) : (
                  `${a.gap > 0 ? "+" : ""}${a.gap}`
                )}
              </p>
              <p className={`mt-3 max-w-sm text-sm leading-relaxed ${gap.frame}`}>{a.gapLine}</p>
            </div>
          )}
        </div>

        {/* signal ledger */}
        <div className="space-y-px self-start border border-bronze-soft/20 bg-oxblood-deep/40">
          {a.signals.map((s) => (
            <div
              key={s.id}
              className="flex items-baseline justify-between gap-4 border-b border-bronze-soft/12 px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="font-display text-lg leading-tight text-parchment">{s.label}</p>
                <p className="mt-1 max-w-[26ch] text-xs leading-relaxed text-parchment/55">
                  {s.depth === "fast" ? "Starting-question signal" : "Deeper-check signal"}
                </p>
              </div>
              <StateChip state={s.state} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScoreRow({
  label,
  value,
  tone,
  note,
  tip,
}: {
  label: React.ReactNode;
  value: number;
  tone: "oxblood" | "bronze";
  note: string;
  /** Shown through InfoTip, not `title` — a bare tooltip is keyboard-unreachable. */
  tip: string;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <InfoTip
          className="min-w-0"
          tone="parchment"
          label={<span className="eyebrow text-parchment/60">{label}</span>}
        >
          {tip}
        </InfoTip>
        <p className="num shrink-0 text-2xl text-parchment">{value}</p>
      </div>
      <div className="mt-2 h-[3px] w-full bg-bronze-soft/20">
        <div
          className={`meter-fill h-full ${tone === "oxblood" ? "bg-oxblood-tint" : "bg-bronze"}`}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-parchment/60">{note}</p>
    </div>
  );
}

export { Meter };
