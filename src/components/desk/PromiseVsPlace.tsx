import type { Assessment } from "@/lib/engine";
import { Meter, StateChip } from "./ui";
import { TermTip } from "./TermTip";

/**
 * Promise vs Place — the signature panel.
 * Left: marketing pressure. Right: how much of the setting is actually resolved.
 */
export function PromiseVsPlace({ a }: { a: Assessment }) {
  const empty = a.posture.key === "empty";

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
              <p className="eyebrow text-bronze-soft/80">
                <TermTip id="gap" tone="parchment">
                  Gap
                </TermTip>
              </p>
              <p className="num mt-2 text-3xl text-parchment">
                {a.gap > 0 ? "+" : ""}
                {a.gap}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-parchment/70">
                {a.gap > 30
                  ? "The promise is far ahead of the place. Everything below stays open until a person answers it out loud."
                  : a.gap > 5
                    ? "The promise is running ahead of the place. Closeable in one conversation."
                    : "The place is keeping pace with the promise. Verify, don't discover."}
              </p>
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
              <StateChip state={s.state} tone="parchment" />
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
  tip?: string;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <p className={`eyebrow text-parchment/60${tip ? " cursor-help" : ""}`} title={tip}>
          {label}
        </p>
        <p className="num text-2xl text-parchment">{value}</p>
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
