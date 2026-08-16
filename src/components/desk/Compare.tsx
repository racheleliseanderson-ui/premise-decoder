import { buildComparison, type CompareItem } from "@/lib/compare";
import { VENUE_PROFILES, regionOf } from "@/lib/engine";
import { SectionHead, StateChip, Meter } from "./ui";

/**
 * Side-by-side setting comparison. Desktop reads as a matrix; mobile
 * recomposes into stacked cards so nothing is clipped or scrolled away.
 *
 * Disclosure only — never ranks quality, safety, or providers.
 */
export function Compare({
  items,
  onOpen,
  onDownload,
  busy,
}: {
  items: CompareItem[];
  onOpen: (id: string) => void;
  onDownload: () => void;
  busy?: boolean;
}) {
  const c = buildComparison(items);

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
        {items.map((i) => {
          const vp = VENUE_PROFILES[i.a.input.venue];
          return (
            <button
              key={i.block.id}
              type="button"
              onClick={() => onOpen(i.block.id)}
              className="border-b border-r border-rule bg-parchment/60 p-5 text-left transition-colors hover:bg-oxblood-tint/20 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow">{i.block.name}</span>
              </div>
              <p className="mt-3 font-display text-2xl leading-tight text-ink">
                {i.a.input.menuLine.trim() || "Unnamed service"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                {vp.short} · {regionOf(i.a.input.region).label}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat n={`${i.a.place}%`} l="Resolved" />
                <Stat n={String(i.a.failClosed.length)} l="Fail closed" />
                <Stat n={i.a.burden.band} l="Burden" />
              </div>
              <div className="mt-4">
                {/* Neutral fill only — never a green/red safety gauge */}
                <Meter value={i.a.place} tone="bronze" />
              </div>
            </button>
          );
        })}
      </div>

      {/* matrix — desktop */}
      <div className="hidden overflow-x-auto border border-rule lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-oxblood-deep text-parchment">
              <th className="px-5 py-3 font-mono text-[0.625rem] uppercase tracking-[0.16em]">
                Signal
              </th>
              {items.map((i) => (
                <th
                  key={i.block.id}
                  className="px-5 py-3 font-mono text-[0.625rem] uppercase tracking-[0.16em]"
                >
                  {i.block.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r, ri) => (
              <tr key={r.id} className={ri % 2 ? "bg-parchment/40" : "bg-bone/40"}>
                <th className="border-t border-rule px-5 py-4 align-top font-sans text-sm font-medium text-ink">
                  {r.label}
                </th>
                {r.cells.map((cell, ci) => (
                  <td key={ci} className="border-t border-l border-rule px-5 py-4 align-top">
                    <StateChip state={cell.state} />
                    <p className="mt-2 max-w-[30ch] text-xs leading-relaxed text-ink-soft">
                      {cell.reading}
                    </p>
                  </td>
                ))}
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
              {r.cells.map((cell, ci) => (
                <li key={ci} className="border-l-2 border-rule pl-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="eyebrow truncate">{items[ci]?.block.name}</span>
                    <StateChip state={cell.state} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">{cell.reading}</p>
                </li>
              ))}
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
              No signal is fail-closed across every venue on the desk.
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

      <p className="max-w-2xl text-xs leading-relaxed text-ink-soft">
        Education only. This comparison measures how much of each setting was named to you. It does
        not rank providers, assess candidacy, or predict outcomes. A higher resolution percentage is
        a difference in disclosure, not a ranking of quality or safety.
      </p>
    </div>
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
