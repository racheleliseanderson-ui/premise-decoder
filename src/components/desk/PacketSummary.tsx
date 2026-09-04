import type { Assessment } from "@/lib/engine";
import { isNoAnswer } from "@/lib/engine";
import { EstablishmentLedgerFigure } from "@/components/figures/EstablishmentLedger";

/**
 * The page someone actually reads in the waiting room.
 *
 * The packet behind this is thorough, and thorough is not the same as usable.
 * Nobody standing at a reception desk with a card machine in front of them is
 * going to work through four pages of signal ledger. What they need is one
 * spread that answers, in the order the decision is actually made:
 *
 *   1. WHAT AM I ABOUT TO PAY, and is it a single figure or the first of
 *      several? A package is a different decision from an appointment and the
 *      packet should say so on the first page rather than the fourth.
 *   2. WHAT IS ACTUALLY SETTLED — as a shape, not a percentage.
 *   3. WHAT IS THE HEAVIEST THING NOBODY HAS TOLD ME, with the sentence to say
 *      out loud in order to find out.
 *   4. WHAT DO I CONFIRM BEFORE MONEY MOVES. Short, ordered, and finite —
 *      three questions someone will ask beats eleven they will not.
 *
 * Everything else in the packet is the working. This is the finding.
 *
 * Designed for paper as much as for glass: no colour is load-bearing, the
 * columns collapse to a single column under `sm`, and the whole thing is one
 * `break-inside: avoid` block so it never splits across a page.
 */
export function PacketSummary({ a }: { a: Assessment }) {
  const price = a.input.price.trim();
  const hasPrice = price.length > 0 && !isNoAnswer(price);
  const series = a.input.seriesPressure.trim();
  const hasSeries = series.length > 0 && !isNoAnswer(series);

  const unnamed = [...a.failClosed].filter((s) => !s.refused).sort((x, y) => y.weight - x.weight);
  const heaviest = unnamed[0];
  const confirm = [
    ...a.refused.map((s) => ({ label: s.label, ask: s.ask, why: "Asked, and not answered." })),
    ...unnamed.slice(0, 3).map((s) => ({ label: s.label, ask: s.ask, why: "Never named anywhere." })),
  ].slice(0, 4);

  const counts = {
    established: a.known.length,
    partial: a.signals.filter((s) => s.state === "partial" && !s.refused).length,
    refused: a.refused.length,
    unnamed: unnamed.length,
  };

  return (
    <section className="packet-summary border-b border-rule px-6 py-9 md:px-12 md:py-12">
      <p className="eyebrow">Before you book</p>
      <h3 className="mt-3 max-w-2xl font-display text-2xl leading-tight text-ink md:text-3xl">
        {heaviest
          ? "The decision you are actually making, and the one thing nobody has told you."
          : "Everything this desk asks about has been named. That is unusual."}
      </h3>

      {/* the money, first, because it is what the room is about */}
      <div className="mt-7 grid gap-px border border-rule sm:grid-cols-3">
        <Cell
          label="What is quoted"
          value={hasPrice ? price : "Not quoted"}
          note={hasPrice ? undefined : "A price that has not been written down is not a price."}
        />
        <Cell
          label="Is it one payment"
          value={hasSeries ? "No — a package or series" : hasPrice ? "As far as you were told" : "Unknown"}
          note={
            hasSeries
              ? series
              : "Ask for the full-course total before the first payment, not the per-session figure."
          }
        />
        <Cell
          label="Decision burden"
          value={a.burden.band}
          note={a.burden.drivers[0] ?? "Nothing is pushing this decision faster than it should go."}
        />
      </div>

      {/* what is settled, as a shape */}
      <div className="mt-9">
        <EstablishmentLedgerFigure signals={a.signals} />
      </div>

      {/* the four states, counted, so the figure has a legend in words */}
      <dl className="grid gap-px border border-rule sm:grid-cols-4">
        <Count label="Established" n={counts.established} note="Named, and checkable." />
        <Count label="Partly named" n={counts.partial} note="Sounds answered. Is not." />
        <Count label="Asked, refused" n={counts.refused} note="A finding, not a gap." />
        <Count label="Never named" n={counts.unnamed} note="Nobody has raised it." />
      </dl>

      {heaviest ? (
        <div className="mt-9 border-l-2 border-oxblood bg-oxblood-tint/25 px-5 py-5">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-oxblood">
            The heaviest thing nobody has told you
          </p>
          <p className="mt-2 font-display text-xl leading-snug text-ink">{heaviest.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{heaviest.reading}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-oxblood">
              Say this:
            </span>{" "}
            “{heaviest.ask}”
          </p>
        </div>
      ) : null}

      {confirm.length ? (
        <div className="mt-9">
          <h4 className="packet-h">Confirm before money moves</h4>
          <ol className="mt-4 border border-rule">
            {confirm.map((c, i) => (
              <li key={c.label} className="flex gap-4 border-b border-rule px-4 py-4 last:border-b-0">
                <span className="num shrink-0 text-lg text-bronze-ink">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block font-display text-lg leading-snug text-ink">“{c.ask}”</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                    {c.label} — {c.why}
                  </span>
                  {/* Ruled space, because this sheet is meant to be written on. */}
                  <span
                    aria-hidden="true"
                    className="mt-3 block h-6 border-b border-dotted border-rule print:h-8"
                  />
                  <span className="sr-only">Space to write what they said.</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="mt-7 max-w-2xl text-xs leading-relaxed text-ink-soft">
        This page is about disclosure and nothing else. It does not say whether the treatment is a
        good idea, whether it suits you, or whether the people offering it are any good — only how
        much of it has actually been established, and what to ask before you pay for the rest.
      </p>
    </section>
  );
}

function Cell({ label, value, note }: { label: string; value: string; note?: string | undefined }) {
  return (
    <div className="bg-parchment/50 px-4 py-4">
      <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-lg leading-snug text-ink">{value}</p>
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{note}</p> : null}
    </div>
  );
}

function Count({ label, n, note }: { label: string; n: number; note: string }) {
  return (
    <div className="bg-parchment/50 px-4 py-4">
      <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft">{label}</dt>
      <dd className="num mt-1.5 text-2xl text-ink">{n}</dd>
      <dd className="mt-1 text-xs leading-relaxed text-ink-soft">{note}</dd>
    </div>
  );
}
