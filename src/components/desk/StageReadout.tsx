import { STAGE_TONE, STAGE_WORD, type StageStatus } from "@/lib/pipeline";
import { isMode, type Mode } from "@/lib/modes";

/**
 * Live stage readout. Every line is derived from what is on the desk right now.
 * There is no run button, no delay, and no invented progress — a stage that
 * cannot resolve simply says so.
 */
export function StageReadout({
  stages,
  onOpen,
}: {
  stages: StageStatus[];
  onOpen: (mode: Mode) => void;
}) {
  const blocked = stages.filter((s) => s.state === "blocked").length;
  const clear = stages.filter((s) => s.state === "clear").length;
  const open = stages.filter((s) => s.state === "gaps").length;

  return (
    <section className="no-print border border-rule bg-bone/70 grain" aria-label="Where you stand">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-rule bg-oxblood-deep px-4 py-3 text-parchment sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-bronze-soft">
            Where you stand · six live readings
          </p>
          <p className="mt-1 truncate text-sm text-parchment/85">
            {blocked
              ? `${blocked} step${blocked > 1 ? "s" : ""} waiting on a question you asked and were not given an answer to.`
              : `${clear} answered · ${open} with open items · nothing is inferred.`}
          </p>
        </div>
      </div>

      <ol className="flex snap-x snap-mandatory overflow-x-auto">
        {stages.map((s) => (
          <li
            key={s.def.id}
            className="min-w-[15rem] shrink-0 snap-start border-r border-rule p-4 last:border-r-0 sm:min-w-[16rem]"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span className="num text-xs text-oxblood">
                {String(s.def.index + 1).padStart(2, "0")} / 06
              </span>
              <span className={STAGE_TONE[s.state]}>{STAGE_WORD[s.state]}</span>
            </div>

            <p className="mt-2.5 font-display text-2xl leading-tight text-ink">{s.def.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.def.what}</p>
            <p className="mt-2.5 text-xs leading-relaxed text-ink">{s.line}</p>

            {s.open.length ? (
              <ul className="mt-3 flex flex-wrap gap-1">
                {s.open.slice(0, 4).map((o) => (
                  <li key={o}>
                    <span className="chip chip-partial">{o}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              className="chip touch-chip mt-3 hover:border-oxblood/50"
              onClick={() => {
                if (isMode(s.def.mode)) onOpen(s.def.mode);
              }}
            >
              Open this step
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
