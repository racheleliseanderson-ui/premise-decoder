/**
 * Multi-venue comparison. Compares how much each SETTING actually names — never
 * which facility is better, safer, or more effective. Education only.
 */

import type { Assessment, SignalState } from "./engine";
import type { VenueBlock } from "./session";

export interface CompareItem {
  block: VenueBlock;
  a: Assessment;
}

export interface CompareRow {
  id: string;
  label: string;
  cells: { state: SignalState; reading: string }[];
}

export interface CompareReadout {
  rows: CompareRow[];
  /** Blocks with at least something on the desk. */
  live: CompareItem[];
  /** Highest setting resolution, or null on a tie or an empty desk. */
  mostResolved: CompareItem | null;
  /** Questions every venue leaves unstated — the category-wide silence. */
  universalGaps: string[];
  /** Signals only one venue answered. */
  differentiators: { label: string; name: string }[];
  spread: number;
  line: string;
}

export function buildComparison(items: CompareItem[]): CompareReadout {
  const live = items.filter((i) => i.a.posture.key !== "empty");
  const first = items[0]?.a.signals ?? [];

  const rows: CompareRow[] = first.map((sig) => ({
    id: sig.id,
    label: sig.label,
    cells: items.map((i) => {
      const match = i.a.signals.find((s) => s.id === sig.id);
      return { state: match?.state ?? "fail-closed", reading: match?.reading ?? "" };
    }),
  }));

  const scores = live.map((i) => i.a.place);
  const top = Math.max(-1, ...scores);
  const winners = live.filter((i) => i.a.place === top);
  const mostResolved = live.length > 1 && winners.length === 1 ? winners[0]! : null;
  const spread = scores.length > 1 ? top - Math.min(...scores) : 0;

  const universalGaps =
    live.length > 1
      ? rows
          .filter((r) =>
            live.every((i) => {
              const cell = r.cells[items.indexOf(i)];
              return cell?.state === "fail-closed";
            }),
          )
          .map((r) => r.label)
      : [];

  const differentiators: { label: string; name: string }[] = [];
  if (live.length > 1) {
    for (const r of rows) {
      const known = live.filter((i) => r.cells[items.indexOf(i)]?.state === "known");
      if (known.length === 1) differentiators.push({ label: r.label, name: known[0]!.block.name });
    }
  }

  const line =
    live.length < 2
      ? "Add a second venue to compare. One on its own is a reading, not a comparison."
      : universalGaps.length
        ? `Every venue here leaves ${universalGaps.length} of the same question${universalGaps.length > 1 ? "s" : ""} unanswered. That is a pattern in how this service is sold, not a difference between rooms.`
        : spread <= 8
          ? "These settings name a comparable amount. The difference is in which specific items each one left open."
          : "One setting names materially more than the other. That is a difference in how much was said, not a ranking of quality or safety.";

  return { rows, live, mostResolved, universalGaps, differentiators, spread, line };
}
