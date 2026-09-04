import { buildComparison, type CompareItem } from "@/lib/compare";
import { VENUE_PROFILES, regionOf } from "@/lib/engine";
import type { Mode } from "@/lib/modes";
import { SectionHead, StateChip, Meter } from "./ui";

/**
 * Side-by-side setting comparison. Desktop reads as a matrix; mobile
 * recomposes into stacked cards so nothing is clipped or scrolled away.
 *
 * Every part of this screen iterates `readout.columns`, not the raw blocks. The
 * two halves used to disagree: the cards and the matrix drew an untouched venue
 * as "Unnamed service · 0% · Unclear" with a full column of fail-closed chips,
 * while the findings underneath excluded it. A blank form is not a room that
 * answered nothing, and it is now drawn as the blank form it is.
 *
 * Disclosure only — never ranks quality, safety, or providers.
 */
export function Compare({
  items,
  onOpen,
  onDownload,
  onGo,
  busy,
}: {
  items: CompareItem[];
  onOpen: (id: string) => void;
  onDownload: () => void;
  /** Same navigation mechanism the other panels use — the desk owns the route. */
  onGo: (mode: Mode) => void;
  busy?: boolean;
}) {
  const c = buildComparison(items);
  const gapCount = c.universalGaps.length;

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead
          eyebrow="Comparison · setting resolution"
          title="How much of each setting is named?"
        >
          {c.line}
        </SectionHead>
        <button
          type="button"
          className="btn-primary no-print"
          onClick={onDownload}
          disabled={busy || c.live.length < 2}
        >
          {busy ? "Preparing…" : "Download comparison PDF"}
        </button>
      </div>

      {/* headline scores — stacked on mobile, row on desktop. No winner highlight. */}
      <div className="grid gap-px border border-rule sm:grid-cols-2 xl:grid-cols-3">
        {c.columns.map(({ item: i, live }) => {
          const vp = VENUE_PROFILES[i.a.input.venue];
          return (
            <button
              key={i.block.id}
              type="button"
              onClick={() => onOpen(i.block.id)}
              className={`border-b border-r border-rule p-5 text-left transition-colors hover:bg-oxblood-tint/20 sm:p-6 ${
                live ? "bg-parchment/60" : "border-dashed bg-bone/40"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow">{i.block.name}</span>
                {live ? null : <span className="chip">Empty form</span>}
              </div>

              {live ? (
                <>
                  <p className="mt-3 font-display text-2xl leading-tight text-ink">
                    {i.a.input.menuLine.trim() || "Unnamed service"}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    {vp.short} · {regionOf(i.a.input.region).label}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <Stat n={`${i.a.place}%`} l="Resolved" />
                    <Stat n={String(i.a.failClosed.length)} l="Unnamed" />
                    <Stat n={i.a.burden.band} l="Burden" />
                  </div>
                  <div className="mt-4">
                    {/* Neutral fill only — never a green/red safety gauge */}
                    <Meter value={i.a.place} tone="bronze" />
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 font-display text-2xl leading-tight text-ink-soft">
                    Nothing on this block
                  </p>
                  <p className="mt-2 max-w-[34ch] text-xs leading-relaxed text-ink-soft">
                    An empty form, not a room that answered nothing. It is counted in none of the
                    findings below.
                  </p>
                </>
              )}

              <span className="eyebrow mt-5 block text-oxblood">
                {live ? "Open this venue →" : "Fill this venue in →"}
              </span>
            </button>
          );
        })}
      </div>

      {/*
        Money, in its own matrix.
        Deliberately above the signal table and deliberately not inside it: a
        currency figure under a Known / Partial / Unnamed legend would be a
        category error, and money is the axis most readers are actually
        choosing on. A blank cell here is not "cheaper" — the caption says so,
        because a reader scanning a table reads the numbers first.
      */}
      {c.anyPriced ? (
        <section className="border border-rule">
          <p className="border-b border-rule bg-oxblood-deep px-5 py-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-parchment">
            What each one said about money
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="border-b border-rule bg-parchment/60 px-5 py-3 text-left text-xs leading-relaxed text-ink-soft">
                Read from each room's own quote. An empty cell means that room did not say — it is
                not a lower number, and the desk will not treat it as one.
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="bg-parchment/60 px-5 py-3 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft"
                  >
                    &nbsp;
                  </th>
                  {c.columns.map(({ item: i }) => (
                    <th
                      key={i.block.id}
                      scope="col"
                      className="bg-parchment/60 px-5 py-3 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft"
                    >
                      {i.block.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.moneyRows.map((r) => (
                  <tr key={r.label}>
                    <th
                      scope="row"
                      className="border-t border-rule px-5 py-4 align-top font-sans text-sm font-medium text-ink"
                    >
                      {r.label}
                      {r.note ? (
                        <span className="mt-1.5 block max-w-[26ch] text-xs font-normal leading-relaxed text-ink-soft">
                          {r.note}
                        </span>
                      ) : null}
                    </th>
                    {c.columns.map(({ item: i, index }) => (
                      <td
                        key={i.block.id}
                        className="border-l border-t border-rule px-5 py-4 align-top"
                      >
                        {r.cells[index] ? (
                          <span className="num text-base text-ink">{r.cells[index]}</span>
                        ) : (
                          <span className="text-xs italic text-ink-soft">Not said</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* matrix — desktop */}
      <div className="hidden overflow-x-auto border border-rule lg:block">
        <table className="w-full border-collapse text-left">
          <caption className="border-b border-rule bg-parchment/60 px-5 py-3 text-left text-xs leading-relaxed text-ink-soft">
            Signal by signal, across {c.columns.length} venue
            {c.columns.length === 1 ? "" : "s"} on the desk
            {c.dormant.length ? ` · ${c.dormant.length} still empty and marked as such` : ""} — what
            each one named, not which is better.
          </caption>
          <thead>
            <tr className="bg-oxblood-deep text-parchment">
              <th
                scope="col"
                className="px-5 py-3 font-mono text-[0.625rem] uppercase tracking-[0.16em]"
              >
                Signal
              </th>
              {c.columns.map(({ item: i, live }) => (
                <th
                  key={i.block.id}
                  scope="col"
                  className="px-5 py-3 font-mono text-[0.625rem] uppercase tracking-[0.16em]"
                >
                  {i.block.name}
                  {live ? "" : " · empty"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, ri) => (
              <tr key={r.id} className={ri % 2 ? "bg-parchment/40" : "bg-bone/40"}>
                <th
                  scope="row"
                  className="border-t border-rule px-5 py-4 align-top font-sans text-sm font-medium text-ink"
                >
                  {r.label}
                </th>
                {c.columns.map(({ item: i, index, live }) => {
                  const cell = r.cells[index];
                  return (
                    <td
                      key={i.block.id}
                      className="border-t border-l border-rule px-5 py-4 align-top"
                    >
                      {!live ? (
                        <DormantCell />
                      ) : cell ? (
                        <>
                          <StateChip state={cell.state} />
                          <p className="mt-2 max-w-[30ch] text-xs leading-relaxed text-ink-soft">
                            {cell.reading}
                          </p>
                        </>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* matrix — mobile / tablet */}
      <div className="space-y-px border border-rule lg:hidden">
        {c.rows.map((r) => (
          <div key={r.id} className="border-b border-rule bg-parchment/50 p-5 last:border-b-0">
            <p className="font-display text-xl leading-tight text-ink">{r.label}</p>
            <ul className="mt-4 space-y-4">
              {c.columns.map(({ item: i, index, live }) => {
                const cell = r.cells[index];
                return (
                  <li key={i.block.id} className="border-l-2 border-rule pl-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <span className="eyebrow truncate">{i.block.name}</span>
                      {live && cell ? <StateChip state={cell.state} /> : null}
                    </div>
                    {!live ? (
                      <DormantCell />
                    ) : cell ? (
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">{cell.reading}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="border border-rule bg-oxblood-tint/25 p-6">
          <p className="eyebrow">Unanswered by every venue</p>
          {c.universalGaps.length ? (
            <>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink">
                {c.universalGaps.map((g) => (
                  <li key={g} className="flex gap-3">
                    <span aria-hidden="true" className="num text-oxblood">
                      ·
                    </span>
                    {g}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs italic leading-relaxed text-ink-soft">
                When every option is silent on the same thing, the silence belongs to the category.
                Ask for it in writing wherever you book.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              No signal is unnamed across every venue on the desk.
            </p>
          )}
        </div>

        <div className="border border-rule bg-pine-tint/30 p-6">
          <p className="eyebrow">Answered by only one</p>
          {c.differentiators.length ? (
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink">
              {c.differentiators.map((d) => (
                <li key={d.label} className="flex gap-3">
                  <span aria-hidden="true" className="num text-pine">
                    ·
                  </span>
                  <span>
                    <span className="font-medium">{d.label}</span> — named only by {d.name}.
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Nothing is uniquely resolved by a single venue yet.
            </p>
          )}
        </div>
      </div>

      <div className="no-print border border-rule bg-parchment/60 p-6">
        <p className="eyebrow">Where this goes</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
          {c.live.length < 2
            ? "A comparison needs a second venue with something on it. Open a card above to fill one in."
            : gapCount
              ? `The ${gapCount} question${gapCount === 1 ? "" : "s"} nobody answered ${gapCount === 1 ? "is" : "are"} the ${gapCount === 1 ? "one" : "ones"} to ask wherever you book. The decision card prints them per venue, with the sentence each answer came from.`
              : "The decision card prints every block on the desk — what was named, what was refused, what stayed silent, and the sentence each answer came from."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => onGo("packet")}>
            Open the decision card
          </button>
          <button type="button" className="btn-quiet" onClick={() => onGo("prep")}>
            Take the questions into the room
          </button>
        </div>
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-ink-soft">
        Education only. This comparison measures how much of each setting was named to you. It does
        not rank providers, assess candidacy, or predict outcomes. A higher resolution percentage is
        a difference in disclosure, not a ranking of quality or safety.
      </p>
    </div>
  );
}

/** A cell on a block nobody has typed into. Not a finding about a room. */
function DormantCell() {
  return (
    <p className="mt-2 text-xs italic leading-relaxed text-ink-soft">
      <span aria-hidden="true" className="num not-italic">
        —{" "}
      </span>
      Empty form. Nothing was entered here, so nothing was left unanswered.
    </p>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <p className="num text-lg leading-none text-ink">{n}</p>
      <p className="eyebrow mt-1.5">{l}</p>
    </div>
  );
}
