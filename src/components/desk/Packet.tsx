import type { Assessment, PrepQuestion } from "@/lib/engine";
import {
  isNoAnswer,
  notedAnswers,
  prepSheet,
  regionOf,
  SERVICE_LABELS,
  VENUE_LABELS,
} from "@/lib/engine";
import { ORIGIN_LABELS, type Evidence, type VenueBlock } from "@/lib/session";
import { whatIfAll } from "@/lib/sensitivity";

export interface PacketItem {
  block: VenueBlock;
  a: Assessment;
}

/** Reader-facing label for every field the packet can print. */
const FIELDS: { key: string; label: string; value: (i: PacketItem) => string }[] = [
  { key: "menuLine", label: "Menu line as sold", value: (i) => i.a.input.menuLine },
  {
    key: "serviceClass",
    label: "Service class",
    value: (i) => SERVICE_LABELS[i.a.input.serviceClass],
  },
  { key: "venue", label: "Setting type", value: (i) => VENUE_LABELS[i.a.input.venue] },
  { key: "region", label: "Jurisdiction", value: (i) => regionOf(i.a.input.region).label },
  { key: "product", label: "Product or device named", value: (i) => i.a.input.product },
  { key: "performer", label: "Who performs it", value: (i) => i.a.input.performer },
  { key: "license", label: "License or credential", value: (i) => i.a.input.license },
  { key: "supervision", label: "Supervision on site", value: (i) => i.a.input.supervision },
  { key: "sanitation", label: "Sanitation practice", value: (i) => i.a.input.sanitation },
  { key: "afterHours", label: "After-hours route", value: (i) => i.a.input.afterHours },
  { key: "consent", label: "Consent and records", value: (i) => i.a.input.consent },
  { key: "price", label: "Price as quoted", value: (i) => i.a.input.price },
  {
    key: "seriesPressure",
    label: "Series or package pressure",
    value: (i) => i.a.input.seriesPressure,
  },
];

const stated = (v: string) => v.trim().length > 0 && !isNoAnswer(v);

function Provenance({ e }: { e: Evidence | undefined }) {
  if (!e) {
    return (
      <p className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-soft">
        No source on record
      </p>
    );
  }
  return (
    <div className="mt-1.5">
      <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-oxblood">
        {ORIGIN_LABELS[e.origin]}
        {e.source ? ` · ${e.source}` : ""}
      </p>
      {e.quote ? (
        <p className="mt-1 border-l-2 border-bronze/60 pl-2.5 text-xs italic leading-relaxed text-ink-soft">
          “{e.quote.trim()}”
        </p>
      ) : null}
    </div>
  );
}

/**
 * Setting Decision Packet — typeset for screen and paper.
 * It prints only what the desk can support: stated fields with their
 * provenance, refusals, fail-closed signals, residual unknowns and the next
 * verification steps, for every venue block on the desk.
 */
export function Packet({
  items,
  preparedAt,
  carried = [],
}: {
  items: PacketItem[];
  preparedAt?: number;
  /** Questions handed over by another desk, so their answers can be captioned. */
  carried?: PrepQuestion[];
}) {
  const date = new Date(preparedAt ?? Date.now()).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="packet border border-rule bg-bone">
      {/* ------------------------------------------------------------- cover */}
      <header className="relative overflow-hidden bg-oxblood-deep px-6 py-10 text-parchment md:px-12 md:py-14">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-bronze-lift">
          Vanity or Vice · Spa Intelligence · Education only
        </p>
        <h2 className="mt-5 font-display text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[0.94]">
          Setting
          <br />
          <span className="italic">Decision Card</span>
        </h2>
        <div className="mt-8 grid gap-x-10 gap-y-3 border-t border-parchment/25 pt-5 text-xs sm:grid-cols-3">
          <p>
            <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-bronze-lift">
              Prepared
            </span>
            {date}
          </p>
          <p>
            <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-bronze-lift">
              Venue blocks
            </span>
            {items.length}
          </p>
          <p>
            <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-bronze-lift">
              Scope
            </span>
            Disclosure only — not quality, safety or candidacy
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------ blocks */}
      {items.map((item, idx) => {
        const { a, block } = item;
        const refusals = FIELDS.filter((f) => isNoAnswer(f.value(item)));
        const resolved = FIELDS.filter((f) => stated(f.value(item)));
        const silent = FIELDS.filter((f) => !f.value(item).trim());

        return (
          <section
            key={block.id}
            className="packet-block border-t border-rule px-6 py-10 md:px-12 md:py-14"
          >
            <div className="grid gap-6 border-b border-rule pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="min-w-0">
                <p className="eyebrow">
                  Block {idx + 1} of {items.length}
                </p>
                <h3 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">
                  {block.name}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
                  {a.identityLine}
                </p>
              </div>
              <div className="shrink-0 border border-rule bg-parchment/60 px-5 py-4">
                <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-oxblood">
                  {a.posture.label}
                </p>
                <p className="num mt-2 text-4xl text-ink">{a.place}%</p>
                <p className="mt-1 text-[0.625rem] uppercase tracking-[0.12em] text-ink-soft">
                  Setting resolved
                </p>
              </div>
            </div>

            {/* readings */}
            <dl className="mt-6 grid gap-px border border-rule sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["Promise density", `${a.promise}%`],
                  ["Promise minus place", `${a.gap > 0 ? "+" : ""}${a.gap}`],
                  ["Burden index", `${a.burden.score} · ${a.burden.band}`],
                  ["Unnamed", `${a.failClosed.length} of ${a.signals.length}`],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="bg-parchment/50 px-4 py-4">
                  <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft">
                    {k}
                  </dt>
                  <dd className="num mt-2 text-lg text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{a.posture.line}</p>

            {/* resolved fields with provenance */}
            <h4 className="packet-h mt-10">What was actually named</h4>
            {resolved.length ? (
              <ul className="mt-4 grid gap-px border border-rule sm:grid-cols-2">
                {resolved.map((f) => (
                  <li key={f.key} className="bg-parchment/40 px-4 py-4">
                    <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft">
                      {f.label}
                    </p>
                    <p className="mt-1.5 font-display text-lg leading-snug text-ink">
                      {f.value(item)}
                    </p>
                    <Provenance e={block.evidence[f.key]} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm italic text-ink-soft">
                Nothing was entered on this block. An empty desk resolves nothing.
              </p>
            )}

            {/* refusals */}
            <h4 className="packet-h mt-10">Asked — no answer given</h4>
            {refusals.length ? (
              <ul className="mt-4 space-y-px">
                {refusals.map((f) => (
                  <li
                    key={f.key}
                    className="border-l-2 border-oxblood bg-oxblood-tint/30 px-4 py-3 text-sm text-ink"
                  >
                    <span className="font-display text-lg">{f.label}</span>
                    <span className="block text-xs leading-relaxed text-ink-soft">
                      A refusal is a decision, not an oversight. It never scores as resolved.
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm italic text-ink-soft">
                No refusals recorded. Nothing here was asked and declined.
              </p>
            )}

            {/* signal ledger */}
            <h4 className="packet-h mt-10">Signal ledger</h4>
            <ul className="mt-4 border border-rule">
              {a.signals.map((s) => (
                <li key={s.id} className="border-b border-rule px-4 py-4 last:border-b-0">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <p className="min-w-0 font-display text-lg leading-tight text-ink">{s.label}</p>
                    <span
                      className={`num shrink-0 text-[0.5625rem] uppercase tracking-[0.16em] ${
                        s.state === "known"
                          ? "text-pine"
                          : s.state === "partial"
                            ? "text-bronze-ink"
                            : "text-oxblood"
                      }`}
                    >
                      {s.refused
                        ? "Refused"
                        : s.state === "known"
                          ? "Known"
                          : s.state === "partial"
                            ? "Partial"
                            : "Unnamed"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{s.reading}</p>
                  {s.state !== "known" ? (
                    // Printed monochrome, oxblood/bronze/pine collapse to the
                    // same grey. The arrow and the bold label carry the line
                    // when the colour does not.
                    <p className="mt-1.5 border-l-2 border-oxblood/70 pl-2.5 text-xs italic leading-relaxed text-oxblood">
                      <span aria-hidden="true" className="not-italic">
                        →{" "}
                      </span>
                      <span className="font-semibold not-italic uppercase tracking-[0.1em]">
                        Ask:
                      </span>{" "}
                      {s.ask}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {/* unknowns + silence */}
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div>
                <h4 className="packet-h">Residual unknowns</h4>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                  {(a.unknowns.length
                    ? a.unknowns
                    : ["No unresolved signals recorded on this block."]
                  ).map((u) => (
                    <li key={u} className="border-l border-rule pl-3">
                      {u}
                    </li>
                  ))}
                </ul>
                {silent.length ? (
                  <p className="mt-4 text-xs leading-relaxed text-ink-soft">
                    Never mentioned by anyone:{" "}
                    <span className="text-ink">{silent.map((f) => f.label).join(" · ")}</span>
                  </p>
                ) : null}
              </div>
              <div>
                <h4 className="packet-h">Burden drivers</h4>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                  {a.burden.drivers.map((d) => (
                    <li key={d} className="border-l border-rule pl-3">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* claims */}
            {a.claims.length ? (
              <>
                <h4 className="packet-h mt-10">Decoded marketing language</h4>
                <ul className="mt-4 grid gap-px border border-rule sm:grid-cols-2">
                  {a.claims.map((c, i) => (
                    <li key={`${c.category}-${i}`} className="bg-parchment/40 px-4 py-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <p className="min-w-0 font-display text-lg leading-tight text-ink">
                          {c.category}
                        </p>
                        <span
                          className={`num shrink-0 text-[0.5625rem] uppercase tracking-[0.16em] ${
                            c.severity === "hard"
                              ? "text-oxblood"
                              : c.severity === "flag"
                                ? "text-bronze-ink"
                                : "text-ink-soft"
                          }`}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs italic leading-relaxed text-ink-soft">
                        “{c.phrase}”
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                        Hides: {c.hides}
                      </p>
                      <p className="mt-1.5 border-l-2 border-oxblood/70 pl-2.5 text-xs italic leading-relaxed text-oxblood">
                        <span aria-hidden="true" className="not-italic">
                          →{" "}
                        </span>
                        <span className="font-semibold not-italic uppercase tracking-[0.1em]">
                          Ask:
                        </span>{" "}
                        {c.ask}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {/* next steps */}
            <h4 className="packet-h mt-10">Next verification steps</h4>
            <ol className="mt-4 space-y-3">
              {(a.nextSteps.length
                ? a.nextSteps
                : ["Enter a menu line, performer and product to generate verification steps."]
              ).map((s, i) => (
                <li key={s} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span className="num text-xs text-oxblood">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm leading-relaxed text-ink">{s}</span>
                </li>
              ))}
            </ol>

            <WhatIfPrint a={a} />
            <ConsultNotes block={block} a={a} carried={carried} />
          </section>
        );
      })}

      {/* -------------------------------------------------------- boundaries */}
      <footer className="border-t border-rule bg-ink px-6 py-10 text-bone md:px-12 md:py-12">
        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.24em] text-bronze">
          Boundaries
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bone/80">
          Education only. This card records how much of each setting was named to you and what
          stayed unanswered. It does not diagnose, does not assess candidacy, does not rank
          providers, does not compare safety or outcomes, and does not recommend a booking. A higher
          resolution figure means more was disclosed — not that a service is appropriate for you.
          Bring the open items to the consultation and ask for them out loud.
        </p>
      </footer>
    </article>
  );
}

/**
 * The same five rows DecisionCard.tsx prints, in the same shape.
 *
 * This block and the one in DecisionCard used to disagree twice: six rows here
 * against five there, and this one dropped a negative delta while that one
 * showed it. Both are now five rows with the sign printed. A probe CAN lower
 * Place — naming a jurisdiction, for instance, brings signals into scope that
 * were not being weighed — and hiding that would tell the reader every answer
 * improves the number, which is a promise about disclosure the desk cannot
 * make. A row that moves nothing prints no delta at all, which is also true.
 */
function WhatIfPrint({ a }: { a: Assessment }) {
  const rows = whatIfAll(a.input, a);
  if (rows.length === 0) return null;
  return (
    <section>
      <h4 className="packet-h mt-10">What if this were named</h4>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Example answers only. Each row shows how Place would move if one currently-open field were
        actually named. It is not a safer-room recommendation.
      </p>
      <ul className="mt-4 space-y-px border border-rule">
        {rows.slice(0, 5).map((row) => (
          <li
            key={row.field}
            className="border-b border-rule bg-parchment/40 px-4 py-4 last:border-b-0"
          >
            <p className="font-display text-lg leading-tight text-ink">{row.label}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{row.proposed}</p>
            <p className="num mt-2 text-[0.5625rem] uppercase tracking-[0.14em] text-oxblood">
              Place {row.placeBefore} → {row.placeAfter}
              {row.delta > 0 ? ` · +${row.delta}` : row.delta < 0 ? ` · ${row.delta}` : ""}
              {row.closes ? " · would close" : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Everything the reader ticked or wrote, whatever produced the question.
 * The reconciliation lives in `notedAnswers` so the screen card and the PDF
 * cannot drift apart about what counts as a note.
 */
function ConsultNotes({
  block,
  a,
  carried = [],
}: {
  block: VenueBlock;
  a: Assessment;
  carried?: PrepQuestion[];
}) {
  const noted = notedAnswers(block.prep, [...carried, ...prepSheet(a)]);

  return (
    <section className="print-consult">
      <h4 className="packet-h mt-10">Consult notes you wrote</h4>
      {noted.length ? (
        <ul className="mt-4 space-y-px border border-rule">
          {noted.map((n) => (
            <li
              key={n.id}
              className="border-b border-rule bg-parchment/40 px-4 py-4 last:border-b-0"
            >
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft">
                {n.group}
                {n.checked ? " · marked answered" : ""}
              </p>
              <p className="mt-1.5 font-display text-lg leading-snug text-ink">
                {n.captioned ? `“${n.text}”` : n.text}
              </p>
              {n.said ? (
                <p className="mt-2 border-l-2 border-bronze/60 pl-3 text-sm italic leading-relaxed text-ink">
                  “{n.said}”
                </p>
              ) : (
                <p className="mt-2 text-xs italic text-ink-soft">
                  Ticked, with no wording written down.
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm italic text-ink-soft">
          No consult ticks or notes on this block yet. They appear here once you use Consult prep.
        </p>
      )}
    </section>
  );
}
