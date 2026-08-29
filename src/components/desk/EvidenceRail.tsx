import type { Assessment } from "@/lib/engine";
import type { Evidence } from "@/lib/session";
import { ProvenanceLine } from "./Field";
import { StateChip } from "./ui";

/** Signal id → the input field that drives it. */
const SIGNAL_FIELD: Record<string, string> = {
  menu: "menuLine",
  venue: "venue",
  region: "region",
  product: "product",
  performer: "performer",
  supervision: "supervision",
  sanitation: "sanitation",
  afterhours: "afterHours",
  consent: "consent",
};

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
  const cited = a.signals.filter((s) => evidence[SIGNAL_FIELD[s.id] ?? ""]).length;

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
          const field = SIGNAL_FIELD[s.id];
          const e = field ? evidence[field] : undefined;
          return (
            <li key={s.id} className="border-b border-rule bg-parchment/40 p-4 last:border-b-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="min-w-0 font-display text-lg leading-tight text-ink">{s.label}</p>
                <StateChip state={s.state} refused={s.refused} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{s.reading}</p>
              {s.note ? <p className="mt-1.5 text-xs leading-relaxed text-ink">{s.note}</p> : null}
              {e ? (
                <ProvenanceLine e={e} />
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
                  Edit this field
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
