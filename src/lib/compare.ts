/**
 * Multi-venue comparison. Compares how much each SETTING actually names — never
 * which facility is better, safer, or more effective. Education only.
 */

import type { Assessment, SignalState } from "./engine";
import type { VenueBlock } from "./session";
import { money } from "./cost.ts";

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

/**
 * A money row.
 *
 * Kept apart from the signal rows because it is a different kind of statement.
 * A signal cell says how much of a question a room answered; a money cell says
 * what a room said a thing costs, and a blank one means nobody said. Mixing
 * them into one matrix would put a currency figure under a Known/Partial/Unnamed
 * legend, which is a category error the rest of this desk spends its time
 * avoiding.
 */
export interface CompareMoneyRow {
  label: string;
  /** One cell per column, in the same order. Null is "not named here". */
  cells: (string | null)[];
  /** What the row means, when it is not obvious from the label. */
  note?: string;
}

export interface CompareReadout {
  rows: CompareRow[];
  /**
   * Price, package shape and the terms that move money without a treatment.
   * The comparison PDF used to print price nowhere at all, which made it a
   * disclosure comparison of two things a reader was choosing between mostly
   * on price.
   */
  moneyRows: CompareMoneyRow[];
  /** True when at least one column named a number. */
  anyPriced: boolean;
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

  /* ------------------------------------------------------------- money */

  const costs = items.map((i) => i.a.cost);
  const anyPriced = costs.some((c) => c.entry !== null || c.floor !== null);

  const moneyRows: CompareMoneyRow[] = anyPriced
    ? [
        {
          label: "To start",
          cells: costs.map((c) => (c.entry === null ? null : money(c.entry, c.currency))),
          note: "Deposit plus anything else payable before the first treatment.",
        },
        {
          label: "Named so far",
          cells: costs.map((c) => (c.floor === null ? null : money(c.floor, c.currency))),
          note: "What has actually been committed to, not a projection.",
        },
        {
          label: "Twelve months",
          cells: costs.map((c) => (c.yearOne === null ? null : money(c.yearOne, c.currency))),
          note: "Blank where the room has not said how often it has to be repeated. That blank is a finding.",
        },
        {
          label: "Cancellation",
          cells: costs.map(
            (c) => c.rows.find((r) => r.label === "Cancellation")?.basis?.split(".")[0] ?? null,
          ),
          note: "The term most likely to take money without a treatment happening.",
        },
        {
          label: "Credits expire",
          cells: costs.map(
            (c) => c.rows.find((r) => r.label === "Credits expire")?.basis?.split(".")[0] ?? null,
          ),
        },
      ].filter((r) => r.cells.some((c) => c !== null))
    : [];

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
  // A blank twelve-month cell beside a filled one is the single most useful
  // thing this screen can show, and it is not a price comparison: it is the
  // difference between a room that told you what a year costs and one that did
  // not. Said out loud, because a reader scanning a table reads the numbers.
  const yearCells = moneyRows.find((r) => r.label === "Twelve months")?.cells ?? [];
  const namedYear = liveColumns.filter((c) => yearCells[c.index] !== null).length;
  const moneyLine =
    !anyPriced || liveColumns.length < 2
      ? ""
      : namedYear === 0
        ? " None of these rooms has said enough for a twelve-month figure to exist. That is the same silence twice, not a tie."
        : namedYear < liveColumns.length
          ? ` ${namedYear} of ${liveColumns.length} said enough to cost a year. A blank there is not cheaper — it is unsaid.`
          : "";

  const line = `${reading}${dormantLine}${moneyLine}`;

  return {
    rows,
    moneyRows,
    anyPriced,
    columns,
    live,
    dormant,
    universalGaps,
    differentiators,
    spread,
    line,
  };
}
