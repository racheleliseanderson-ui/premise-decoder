import { SIGNAL_FIELDS } from "@/lib/signal-fields";
import type { Assessment } from "@/lib/engine";
import type { Evidence } from "@/lib/session";
import { ProvenanceLine } from "./Field";
import { StateChip } from "./ui";

/**
 * Signal id → the input fields that drive it, primary first.
 *
 * This was a one-to-one map, which quietly lost evidence: the performer signal
 * is scored from `performer` AND `license` (see `buildSignals` in engine.ts),
 * so a reader who pasted a sentence naming the licence and nothing else had a
 * quote on the desk that this rail could never show. It is the inverse of
 * `SIGNAL_OF_FIELD` in Paths.tsx; neither file can derive the other without
 * moving one of them into lib/, so both carry a pointer to the other instead.
 */


/**
 * Where each answer came from. Every question, the reading behind it, and where
 * the value came from — with the source sentence quoted. Nothing on the rail is
 * derived from anything the reader did not put on the desk.
 */
export function EvidenceRail({
  a,
  evidence,
  onJump,
}: {
  a: Assessment;
  evidence: Record<string, Evidence>;
  onJump: (field: string) => void;
}) {
  const sourcesFor = (id: string) =>
    (SIGNAL_FIELDS[id] ?? [])
      .filter((f) => evidence[f])
      .map((f) => ({ field: f, e: evidence[f]! }));
  const cited = a.signals.filter((s) => sourcesFor(s.id).length > 0).length;

  return (
    <section
      className="border border-rule bg-parchment/50"
      aria-label="Where each answer came from"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-rule bg-oxblood-deep px-4 py-3 text-parchment">
        <p className="min-w-0 font-mono text-[0.625rem] uppercase tracking-[0.16em]">
          Where each answer came from · {cited} of {a.signals.length} have a source
        </p>
        <span className="num shrink-0 text-xs">{a.place}%</span>
      </div>

      <ul className="space-y-px">
        {a.signals.map((s) => {
          const sources = sourcesFor(s.id);
          // Jump to the field that carries the evidence when there is one, so
          // "Edit this field" on a licence-sourced quote lands on the licence.
          const field = sources[0]?.field ?? SIGNAL_FIELDS[s.id]?.[0];
          return (
            <li key={s.id} className="border-b border-rule bg-parchment/40 p-4 last:border-b-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="min-w-0 font-display text-lg leading-tight text-ink">{s.label}</p>
                <StateChip state={s.state} refused={s.refused} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{s.reading}</p>
              {s.note ? <p className="mt-1.5 text-xs leading-relaxed text-ink">{s.note}</p> : null}
              {sources.length ? (
                sources.map((src) => <ProvenanceLine key={src.field} e={src.e} />)
              ) : (
                <p className="mt-2 text-xs italic text-ink-soft">
                  No source on record. Nothing was pasted or entered for this line.
                </p>
              )}
              {field ? (
                <button
                  type="button"
                  className="chip touch-chip mt-3 hover:border-oxblood/50"
                  onClick={() => onJump(field)}
                >
                  {/* Nine of these on one screen. The visible words stay short;
                      the accessible name says which field it opens. */}
                  Edit this field
                  <span className="sr-only"> · {s.label}</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
