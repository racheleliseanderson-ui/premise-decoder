/**
 * Figure models for the spa desk.
 *
 * Two pictures, both answering questions this desk already answers in prose and
 * neither of which lands as prose:
 *
 *   1. THE LEDGER. "Sixty per cent resolved" is a number nobody can weigh. The
 *      same signals drawn as a weighted bar — established, partly named, never
 *      named, asked-and-refused — is a shape, and a shape is something you can
 *      look at and decide about.
 *
 *   2. CLAIM ANATOMY. A marketing sentence reads as one continuous assertion.
 *      Drawn with the matched phrases marked in place, it stops reading that
 *      way: you can see how much of the line is doing emotional work and how
 *      little of it named anything. That is the entire argument of the Claim
 *      Decoder, made in one image.
 *
 * Layout maths only. Nothing here decides what is true — the engine did that.
 */

// Relative rather than aliased: this module is unit-tested with `node --test`,
// which resolves no bundler alias. Every other lib file here does the same.
import { bandScale, clamp, isCompact, linearScale, type Point } from "./core.ts";
import type { Assessment, DecodedClaim, Signal } from "../engine.ts";

/* ---------------------------------------------------------------------------
 * 1. The establishment ledger
 * ------------------------------------------------------------------------ */

export type LedgerBand = "established" | "partial" | "unnamed" | "refused";

export const LEDGER_LABELS: Record<LedgerBand, string> = {
  established: "Established",
  partial: "Partly named",
  unnamed: "Never named",
  refused: "Asked, no answer",
};

export const LEDGER_BLURB: Record<LedgerBand, string> = {
  established: "Named on the record, in a form you could check.",
  partial: "Gestured at. Enough to sound answered, not enough to be.",
  unnamed: "Not addressed anywhere you have looked.",
  refused: "You asked and were not told. That is a finding, not a gap.",
};

export type LedgerSegment = {
  band: LedgerBand;
  weight: number;
  share: number;
  x: number;
  width: number;
  signals: string[];
};

export type LedgerModel = {
  width: number;
  height: number;
  segments: LedgerSegment[];
  totalWeight: number;
  /** Share of the weighted picture that is actually established, 0–1. */
  establishedShare: number;
  /** The single most consequential thing still unnamed, when there is one. */
  heaviestGap: { label: string; ask: string; weight: number } | null;
  reading: string[];
  empty: boolean;
};

const LEDGER_PAD = { top: 46, bottom: 20, side: 16 };

/**
 * Below the compact threshold the ledger stops printing a band's name inside
 * its own segment — at 320 units a four-band bar gives each label about sixty
 * units, which truncates every one of them to an ellipsis. The legend under the
 * figure already names all four, so the label is redundant rather than lost.
 */
export function ledgerLabelsInside(width: number): boolean {
  return !isCompact(width);
}
const LEDGER_BAR = 42;

function bandOf(signal: Signal): LedgerBand {
  if (signal.refused) return "refused";
  if (signal.state === "known") return "established";
  if (signal.state === "partial") return "partial";
  return "unnamed";
}

/** Order matters: the bar reads left to right from settled to unsettled. */
const BAND_ORDER: LedgerBand[] = ["established", "partial", "refused", "unnamed"];

export function ledgerModel(signals: Signal[], width = 640): LedgerModel {
  const scored = signals.filter((s) => s.weight > 0);
  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0);
  if (scored.length === 0 || totalWeight === 0) {
    return {
      width,
      height: 110,
      segments: [],
      totalWeight: 0,
      establishedShare: 0,
      heaviestGap: null,
      reading: [],
      empty: true,
    };
  }

  const inner = width - LEDGER_PAD.side * 2;
  const grouped = new Map<LedgerBand, Signal[]>();
  for (const s of scored) {
    const band = bandOf(s);
    grouped.set(band, [...(grouped.get(band) ?? []), s]);
  }

  let cursor = LEDGER_PAD.side;
  const segments: LedgerSegment[] = [];
  for (const band of BAND_ORDER) {
    const list = grouped.get(band);
    if (!list || list.length === 0) continue;
    const weight = list.reduce((sum, s) => sum + s.weight, 0);
    const share = weight / totalWeight;
    const segWidth = inner * share;
    segments.push({
      band,
      weight,
      share,
      x: cursor,
      width: segWidth,
      signals: list.map((s) => s.label),
    });
    cursor += segWidth;
  }

  const gaps = scored
    .filter((s) => s.state === "fail-closed" && !s.refused)
    .sort((a, b) => b.weight - a.weight);
  const heaviest = gaps[0];

  const established = segments.find((s) => s.band === "established")?.share ?? 0;

  const reading = segments.map(
    (s) =>
      `${LEDGER_LABELS[s.band]} — ${Math.round(s.share * 100)}% of the weighted picture: ${s.signals.join(", ")}. ${LEDGER_BLURB[s.band]}`,
  );
  if (heaviest) {
    reading.push(`The heaviest thing still unnamed is ${heaviest.label}. Ask: ${heaviest.ask}`);
  }

  return {
    width,
    height: LEDGER_PAD.top + LEDGER_BAR + LEDGER_PAD.bottom + 26,
    segments,
    totalWeight,
    establishedShare: established,
    heaviestGap: heaviest ? { label: heaviest.label, ask: heaviest.ask, weight: heaviest.weight } : null,
    reading,
    empty: false,
  };
}

/* ---------------------------------------------------------------------------
 * 2. Claim anatomy
 * ------------------------------------------------------------------------ */

export type AnatomySpan = {
  /** Character range in the source text. */
  start: number;
  end: number;
  text: string;
  claim: DecodedClaim | null;
  /** Line this span was laid onto. */
  line: number;
  x: number;
  width: number;
  y: number;
};

export type AnatomyMarker = {
  spanIndex: number;
  category: string;
  severity: DecodedClaim["severity"];
  hides: string;
  ask: string;
  /** Where the leader line starts and ends. */
  from: Point;
  to: Point;
  labelY: number;
};

export type ClaimAnatomyModel = {
  width: number;
  height: number;
  lineHeight: number;
  charWidth: number;
  spans: AnatomySpan[];
  markers: AnatomyMarker[];
  /** Share of the sentence's characters that a decoder rule matched, 0–1. */
  markedShare: number;
  reading: string[];
  empty: boolean;
};

const ANATOMY = {
  padX: 16,
  padTop: 44,
  lineHeight: 26,
  fontSize: 13,
  /** Average advance of IBM Plex Mono at `fontSize`. Monospace, so this is exact. */
  charRatio: 0.6,
  markerGap: 22,
  markerBlock: 34,
};

/**
 * Lay a claim sentence out as wrapped monospaced text with the decoded phrases
 * marked in place.
 *
 * Monospace is not a style choice: it is the only way to place a highlight over
 * a character range without measuring text in a DOM. The decoder already speaks
 * in phrases; this puts them back where they were said.
 */
export function claimAnatomyModel(
  text: string,
  claims: DecodedClaim[],
  width = 640,
  maxChars?: number,
): ClaimAnatomyModel {
  const source = text.trim();
  if (!source) {
    return {
      width,
      height: 90,
      lineHeight: ANATOMY.lineHeight,
      charWidth: ANATOMY.fontSize * ANATOMY.charRatio,
      spans: [],
      markers: [],
      markedShare: 0,
      reading: [],
      empty: true,
    };
  }

  const charWidth = ANATOMY.fontSize * ANATOMY.charRatio;
  const perLine = maxChars ?? Math.max(20, Math.floor((width - ANATOMY.padX * 2) / charWidth));

  // Wrap on word bounds, tracking the character offset of each line so a
  // highlight can be placed by index rather than by re-searching the string.
  const lines: { text: string; start: number }[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    if (source.length - cursor <= perLine) {
      lines.push({ text: source.slice(cursor), start: cursor });
      break;
    }
    const window = source.slice(cursor, cursor + perLine + 1);
    const breakAt = window.lastIndexOf(" ");
    const take = breakAt > perLine * 0.4 ? breakAt : perLine;
    lines.push({ text: source.slice(cursor, cursor + take), start: cursor });
    cursor += take;
    while (source[cursor] === " ") cursor += 1;
    if (lines.length > 40) break;
  }

  // Locate each decoded phrase in the source, first occurrence, no overlaps.
  const lowered = source.toLowerCase();
  const ranges: { start: number; end: number; claim: DecodedClaim }[] = [];
  const taken: [number, number][] = [];
  for (const claim of claims) {
    const needle = claim.phrase.trim().toLowerCase();
    if (!needle) continue;
    let at = lowered.indexOf(needle);
    while (at !== -1) {
      const end = at + needle.length;
      const clashes = taken.some(([s, e]) => at < e && end > s);
      if (!clashes) {
        ranges.push({ start: at, end, claim });
        taken.push([at, end]);
        break;
      }
      at = lowered.indexOf(needle, at + 1);
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  // Split each range across the lines it falls on.
  const spans: AnatomySpan[] = [];
  ranges.forEach((range) => {
    lines.forEach((line, li) => {
      const lineEnd = line.start + line.text.length;
      const from = Math.max(range.start, line.start);
      const to = Math.min(range.end, lineEnd);
      if (to <= from) return;
      spans.push({
        start: from,
        end: to,
        text: source.slice(from, to),
        claim: range.claim,
        line: li,
        x: ANATOMY.padX + (from - line.start) * charWidth,
        width: (to - from) * charWidth,
        y: ANATOMY.padTop + li * ANATOMY.lineHeight,
      });
    });
  });

  const textBlockHeight = lines.length * ANATOMY.lineHeight;
  const markerTop = ANATOMY.padTop + textBlockHeight + ANATOMY.markerGap;

  // One marker per distinct claim, anchored to its first span.
  const markers: AnatomyMarker[] = [];
  const seen = new Set<string>();
  spans.forEach((span, i) => {
    if (!span.claim) return;
    const key = `${span.claim.phrase}|${span.claim.category}`;
    if (seen.has(key)) return;
    seen.add(key);
    const order = markers.length;
    const labelY = markerTop + order * ANATOMY.markerBlock;
    markers.push({
      spanIndex: i,
      category: span.claim.category,
      severity: span.claim.severity,
      hides: span.claim.hides,
      ask: span.claim.ask,
      from: { x: span.x + span.width / 2, y: span.y + 6 },
      to: { x: ANATOMY.padX + 6, y: labelY - 8 },
      labelY,
    });
  });

  const markedChars = ranges.reduce((sum, r) => sum + (r.end - r.start), 0);

  const reading = [
    `The line reads: “${source}”`,
    ...markers.map(
      (m) =>
        `“${spans[m.spanIndex]?.text ?? ""}” — ${m.category}. What it leaves out: ${m.hides} Ask: ${m.ask}`,
    ),
  ];
  if (markers.length === 0) {
    reading.push(
      "No decoder rule matched this line. That is not a clean bill of health — it means the desk has no rule for this phrasing, which is a fact about the desk.",
    );
  }

  return {
    width,
    height: markerTop + Math.max(1, markers.length) * ANATOMY.markerBlock + 12,
    lineHeight: ANATOMY.lineHeight,
    charWidth,
    spans,
    markers,
    markedShare: clamp(markedChars / source.length, 0, 1),
    reading,
    empty: false,
  };
}

/** The wrapped lines, for the component to print underneath the highlights. */
export function anatomyLines(text: string, width = 640, maxChars?: number): { text: string; y: number }[] {
  const model = claimAnatomyModel(text, [], width, maxChars);
  if (model.empty) return [];
  const charWidth = model.charWidth;
  const perLine = maxChars ?? Math.max(20, Math.floor((width - ANATOMY.padX * 2) / charWidth));
  const source = text.trim();
  const out: { text: string; y: number }[] = [];
  let cursor = 0;
  let li = 0;
  while (cursor < source.length) {
    if (source.length - cursor <= perLine) {
      out.push({ text: source.slice(cursor), y: ANATOMY.padTop + li * ANATOMY.lineHeight });
      break;
    }
    const window = source.slice(cursor, cursor + perLine + 1);
    const breakAt = window.lastIndexOf(" ");
    const take = breakAt > perLine * 0.4 ? breakAt : perLine;
    out.push({ text: source.slice(cursor, cursor + take), y: ANATOMY.padTop + li * ANATOMY.lineHeight });
    cursor += take;
    while (source[cursor] === " ") cursor += 1;
    li += 1;
    if (li > 40) break;
  }
  return out;
}

export const ANATOMY_GEOMETRY = ANATOMY;

/* ---------------------------------------------------------------------------
 * 3. Promise against place
 * ------------------------------------------------------------------------ */

export type PromisePlaceModel = {
  width: number;
  height: number;
  promise: { x: number; y: number; w: number; h: number; value: number };
  place: { x: number; y: number; w: number; h: number; value: number };
  /** The band between the two, where the gap lives. */
  gapBand: { x: number; y: number; w: number; h: number } | null;
  reading: string[];
};

export function promisePlaceModel(a: Assessment, width = 640, height = 200): PromisePlaceModel {
  const pad = { top: 40, bottom: 34, side: 18 };
  const bands = bandScale(2, [pad.top, height - pad.bottom], { padding: 0.34 });
  const scale = linearScale([0, 100], [pad.side, width - pad.side]);
  const promiseBand = bands[0] ?? { start: pad.top, size: 24, index: 0, end: 0, center: 0 };
  const placeBand = bands[1] ?? { start: pad.top + 40, size: 24, index: 1, end: 0, center: 0 };

  const promiseW = scale(a.promise) - pad.side;
  const placeW = scale(a.place) - pad.side;

  return {
    width,
    height,
    promise: { x: pad.side, y: promiseBand.start, w: promiseW, h: promiseBand.size, value: a.promise },
    place: { x: pad.side, y: placeBand.start, w: placeW, h: placeBand.size, value: a.place },
    gapBand:
      promiseW > placeW
        ? {
            x: pad.side + placeW,
            y: promiseBand.start,
            w: promiseW - placeW,
            h: placeBand.start + placeBand.size - promiseBand.start,
          }
        : null,
    reading: [
      `Marketing pressure: ${a.promise} out of 100.`,
      `How much of the setting is actually named: ${a.place} out of 100.`,
      a.gapLine,
    ],
  };
}
