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

/**
 * One venue column, in the same order as every `CompareRow.cells` array, so a
 * view rendering all the blocks and this module analysing the answered ones
 * cannot drift apart. `live` is false for a block with nothing on the desk:
 * its cells are all fail-closed because nobody has typed anything yet, which is
 * not a finding about a room.
 */
export interface CompareColumn {
  item: CompareItem;
  /** Index into every CompareRow.cells. */
  index: number;
  live: boolean;
}

export interface CompareReadout {
  rows: CompareRow[];
  /** Every block on the desk, in cell order — empty ones included and marked. */
  columns: CompareColumn[];
  /** Blocks with at least something on the desk. */
  live: CompareItem[];
  /** Names of the blocks with nothing on them, excluded from every finding below. */
  dormant: string[];
  /** Questions every venue leaves unstated — the category-wide silence. */
  universalGaps: string[];
  /** Signals only one venue answered. */
  differentiators: { label: string; name: string }[];
  spread: number;
  line: string;
}

export function buildComparison(items: CompareItem[]): CompareReadout {
  const columns: CompareColumn[] = items.map((item, index) => ({
    item,
    index,
    live: item.a.posture.key !== "empty",
  }));
  const liveColumns = columns.filter((c) => c.live);
  const live = liveColumns.map((c) => c.item);
  const dormant = columns.filter((c) => !c.live).map((c) => c.item.block.name);
  const first = items[0]?.a.signals ?? [];

  const rows: CompareRow[] = first.map((sig) => ({
    id: sig.id,
    label: sig.label,
    cells: items.map((i) => {
      const match = i.a.signals.find((s) => s.id === sig.id);
      return { state: match?.state ?? "fail-closed", reading: match?.reading ?? "" };
    }),
  }));

  // No `mostResolved`. It used to be computed here, with a tie-break, and never
  // read — the contract forbids ranking venues, so the primitive is gone rather
  // than left lying next to a screen that must not use it. `spread` describes
  // how far apart the disclosure levels are, and names nobody.
  const scores = live.map((i) => i.a.place);
  const spread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : 0;

  const universalGaps =
    liveColumns.length > 1
      ? rows
          .filter((r) => liveColumns.every((c) => r.cells[c.index]?.state === "fail-closed"))
          .map((r) => r.label)
      : [];

  const differentiators: { label: string; name: string }[] = [];
  if (liveColumns.length > 1) {
    for (const r of rows) {
      const known = liveColumns.filter((c) => r.cells[c.index]?.state === "known");
      if (known.length === 1)
        differentiators.push({ label: r.label, name: known[0]!.item.block.name });
    }
  }

  const dormantLine = dormant.length
    ? ` ${dormant.length === 1 ? `${dormant[0]} is` : `${dormant.join(", ")} are`} still empty and counted in nothing below.`
    : "";

  const reading =
    live.length < 2
      ? "Add a second venue to compare. One on its own is a reading, not a comparison."
      : universalGaps.length
        ? `Every venue here leaves ${universalGaps.length} of the same question${universalGaps.length > 1 ? "s" : ""} unanswered. That is a pattern in how this service is sold, not a difference between rooms.`
        : spread <= 8
          ? "These settings name a comparable amount. The difference is in which specific items each one left open."
          : "One setting names materially more than the other. That is a difference in how much was said, not a ranking of quality or safety.";
  const line = `${reading}${dormantLine}`;

  return { rows, columns, live, dormant, universalGaps, differentiators, spread, line };
}
