import type { Assessment, EvalInput } from "@/lib/engine";
import { parseCost, money, UNIT_LABEL, type CostProjection } from "@/lib/cost";
import type { Mode } from "@/lib/modes";
import { CostLadderFigure } from "@/components/figures/CostLadder";
import { SectionHead, StateChip } from "./ui";
import { FieldEditor } from "./Field";
import { fieldDomId } from "@/lib/fields";
import type { Evidence, Origin } from "@/lib/session";

/**
 * The money panel.
 *
 * The desk has always been able to say that a room had not named its injector.
 * It has never been able to say that the same room had not named what happens
 * to the four prepaid sessions you did not use, which is the term most likely
 * to move money without a treatment happening.
 *
 * Two rules hold this panel together, and both are refusals:
 *
 *   1. No total is produced that the copy does not support. Where a year cannot
 *      be costed, the row says which sentence is missing and stops.
 *   2. No opinion is offered about whether a price is high. The desk does not
 *      know what anything should cost, has no market data, and would be making
 *      it up. It knows what has been committed to and what has been left for
 *      later, and that is a different and more useful thing.
 */

const STATE_MARK: Record<"named" | "derived" | "unknown", string> = {
  named: "●",
  derived: "◐",
  unknown: "○",
};

const STATE_WORD: Record<"named" | "derived" | "unknown", string> = {
  named: "They said it",
  derived: "Worked out",
  unknown: "Not knowable yet",
};

/** The compact read, for inside the evaluate stage. */
export function CostReadout({ a, onGo }: { a: Assessment; onGo: (m: Mode) => void }) {
  const cost = a.cost;
  const priced = cost.floor !== null || cost.entry !== null;

  return (
    <div className="border border-rule bg-parchment/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">The money, as far as it goes</p>
        {a.signals.find((s) => s.id === "cost") ? (
          <StateChip
            state={a.signals.find((s) => s.id === "cost")!.state}
            refused={a.signals.find((s) => s.id === "cost")!.refused}
          />
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">{cost.line}</p>
      {priced ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Cell label="To start" value={money(cost.entry, cost.currency)} />
          <Cell label="Named so far" value={money(cost.floor, cost.currency)} />
          <Cell
            label="Twelve months"
            value={cost.yearOne === null ? "—" : money(cost.yearOne, cost.currency)}
            muted={cost.yearOne === null}
          />
        </dl>
      ) : null}
      <button type="button" className="btn-quiet mt-5" onClick={() => onGo("cost")}>
        Open the money panel
      </button>
    </div>
  );
}

function Cell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <dt className="label-mono">{label}</dt>
      <dd className={`num mt-1 text-lg ${muted ? "text-ink-soft" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------- the panel */

export function CostPanel({
  input,
  setField,
  evidence,
  a,
  onGo,
}: {
  input: EvalInput;
  setField: (field: keyof EvalInput, value: string, origin?: Origin) => void;
  evidence: Record<string, Evidence>;
  a: Assessment;
  onGo: (m: Mode) => void;
}) {
  // Read from the assessment rather than recomputing, so this panel and the
  // signal ledger can never disagree about what the same quote says.
  const shape = parseCost(input);
  const cost: CostProjection = a.cost;
  const priced = shape.quoted !== null || shape.membershipMonthly !== null;

  const ed = (field: keyof EvalInput) => ({
    id: fieldDomId(field),
    value: input[field] as string,
    evidence: evidence[field],
    onChange: (v: string, origin: Origin) => setField(field, v, origin),
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHead eyebrow="The money" title="What it costs, and for how long">
          Paste the quote exactly as it was given to you — the number, the deposit, the package, the
          cancellation line. The desk reads the structure out of it and works out only what the
          words support. Where a year cannot be costed, it says which sentence is missing rather
          than filling one in.
        </SectionHead>

        <div className="mt-8 space-y-5">
          <FieldEditor
            {...ed("price")}
            label="The quote, exactly as given"
            area
            rows={4}
            placeholder="$12 per unit, roughly 20 units for the glabella. $100 deposit, non-refundable. 48 hours notice to cancel."
          />
          <FieldEditor
            {...ed("seriesPressure")}
            label="Series, membership, maintenance"
            area
            rows={3}
            placeholder="Package of 6, then maintenance every 4 months. Membership $99/mo, credits expire after 12 months."
            hint="This is the field that decides whether this is a purchase or a standing order."
          />
        </div>

        <div className="mt-8 border border-rule bg-parchment/60 p-6">
          <p className="eyebrow">What this panel will not do</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            It has no opinion on whether a price is high. It has no market data, no idea what your
            city charges, and no business telling you what a face is worth. It reads what has been
            committed to in writing, works out what follows from it, and leaves the rest visibly
            unfinished.
          </p>
        </div>
      </div>

      <div className="min-w-0">
        {!priced ? (
          <div className="panel rounded-xl px-7 py-14 text-center">
            <p className="eyebrow">Nothing priced</p>
            <h3 className="display-lg mx-auto mt-4 max-w-sm text-ink">
              A number, and what it is a <span className="italic text-oxblood">number for</span>
            </h3>
            <p className="lede mx-auto mt-4 max-w-md">
              “$450” and “$450 per area, four areas recommended, repeated at four months” are the
              same sentence to a price list and different decisions entirely. Paste the quote and
              the second one becomes visible.
            </p>
          </div>
        ) : (
          <div className="rise space-y-8">
            <CostLadderFigure cost={cost} />

            <div>
              <p className="eyebrow">Every line, and where it came from</p>
              <ul className="mt-4 space-y-px border border-rule">
                {cost.rows.map((r, i) => (
                  <li
                    key={`${r.label}-${i}`}
                    className="grid gap-2 border-b border-rule bg-parchment/70 px-5 py-4 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-5"
                  >
                    <div className="flex items-baseline justify-between gap-3 sm:block">
                      <p className="font-display text-lg leading-none text-ink">{r.label}</p>
                      <p
                        className={`num text-lg ${r.amount === null ? "text-ink-soft" : "text-oxblood"} sm:mt-2`}
                      >
                        {r.amount === null ? "—" : money(r.amount, cost.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft">
                        <span aria-hidden="true" className="mr-1.5 tracking-normal">
                          {STATE_MARK[r.state]}
                        </span>
                        {STATE_WORD[r.state]}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.basis}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {shape.quotes.length ? (
              <div className="border border-rule bg-parchment/50">
                <p className="eyebrow border-b border-rule bg-oxblood-deep px-5 py-3 text-parchment">
                  Read out of your own words
                </p>
                <ul className="space-y-px">
                  {shape.quotes.map((q) => (
                    <li
                      key={`${q.field}-${q.text}`}
                      className="border-b border-rule px-5 py-3 last:border-b-0"
                    >
                      <p className="label-mono">{QUOTE_LABEL[q.field] ?? q.field}</p>
                      <p className="mt-1.5 text-sm italic leading-relaxed text-ink">“{q.text}”</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {cost.unknowns.length ? (
              <div className="border border-rule bg-parchment/60 p-6">
                <p className="eyebrow">Still open, in the order it costs you</p>
                <ol className="mt-4 space-y-3">
                  {cost.unknowns.map((u, i) => (
                    <li key={u} className="flex gap-4">
                      <span className="num shrink-0 text-xs text-oxblood">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm leading-relaxed text-ink">{u}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" className="btn-primary" onClick={() => onGo("prep")}>
                    Put these on the question sheet
                  </button>
                  <button type="button" className="btn-quiet" onClick={() => onGo("packet")}>
                    Take it to the decision card
                  </button>
                </div>
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-ink-soft">
              {shape.unit
                ? `Quoted ${UNIT_LABEL[shape.unit]}. `
                : "The quote does not say what the number is a price for. "}
              Every figure above is arithmetic on sentences you entered. None of it is a market
              estimate, and none of it is a judgement about value.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const QUOTE_LABEL: Record<string, string> = {
  quoted: "The headline number",
  unit: "What it is a price for",
  sessions: "How many",
  quantity: "Quantity stated",
  deposit: "Deposit",
  consultFee: "Consultation fee",
  cancellationHours: "Cancellation window",
  creditsExpireDays: "Credit expiry",
  maintenanceIntervalMonths: "Maintenance interval",
  membershipMonthly: "Recurring charge",
  fromPrice: "A floor, not a price",
};
