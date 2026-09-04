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
import {
  SERVICE_LABELS,
  VENUE_PROFILES,
  type Assessment,
  type DecodedClaim,
  type EvalInput,
  type ServiceClass,
  type Signal,
} from "../engine.ts";
import type { CostProjection } from "../cost.ts";

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
    heaviestGap: heaviest
      ? { label: heaviest.label, ask: heaviest.ask, weight: heaviest.weight }
      : null,
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
export function anatomyLines(
  text: string,
  width = 640,
  maxChars?: number,
): { text: string; y: number }[] {
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
    out.push({
      text: source.slice(cursor, cursor + take),
      y: ANATOMY.padTop + li * ANATOMY.lineHeight,
    });
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
    promise: {
      x: pad.side,
      y: promiseBand.start,
      w: promiseW,
      h: promiseBand.size,
      value: a.promise,
    },
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

/* ---------------------------------------------------------------------------
 * 3. The cost ladder
 *
 * Every consumer cost graphic in this category draws a confident line to a
 * five-year total, because the assumptions needed to reach one are easy to make
 * and nobody checks them. This figure draws the line only as far as the copy
 * actually supports, and then stops — visibly, with an open end and a question
 * mark rather than a fading dashed extrapolation that still reads as a
 * prediction.
 *
 * The argument the picture makes: "the part of this you have been told" is
 * usually a short bar at the left, and the rest of the horizon is a shape
 * nobody has described to you.
 * ------------------------------------------------------------------------ */

export type CostRung = {
  label: string;
  amount: number | null;
  basis: string;
  state: "named" | "derived" | "unknown";
  y: number;
  /** Bar geometry. Zero width for an unknown rung — it draws an open end instead. */
  x: number;
  width: number;
};

export type CostLadderModel = {
  width: number;
  height: number;
  rungs: CostRung[];
  max: number;
  currency: string;
  /** The horizon the copy could not reach, in words. */
  blocked: string | null;
  reading: string[];
  empty: boolean;
};

const COST_PAD = { top: 34, bottom: 26, left: 16, right: 16 };
const COST_ROW = 46;
const COST_LABEL_W = 108;

export function costLadderModel(cost: CostProjection, width: number): CostLadderModel {
  const rows = cost.rows.filter(
    (r) => r.amount !== null || r.label === "Twelve months" || r.label === "Three years",
  );
  if (!rows.length) {
    return {
      width,
      height: 120,
      rungs: [],
      max: 0,
      currency: cost.currency,
      blocked: cost.blockedBy[0] ?? null,
      reading: ["No money has been named, so there is nothing to draw."],
      empty: true,
    };
  }

  const compact = isCompact(width);
  const labelW = compact ? 78 : COST_LABEL_W;
  const left = COST_PAD.left + labelW;
  const right = width - COST_PAD.right;
  const inner = Math.max(40, right - left);

  const amounts = rows.map((r) => r.amount ?? 0);
  const max = Math.max(1, ...amounts);
  const scale = linearScale([0, max], [0, inner]);

  const rungs: CostRung[] = rows.map((r, i) => ({
    label: r.label,
    amount: r.amount,
    basis: r.basis,
    state: r.state,
    y: COST_PAD.top + i * COST_ROW,
    x: left,
    width: r.amount === null ? 0 : Math.max(2, scale(r.amount)),
  }));

  const height = COST_PAD.top + rows.length * COST_ROW + COST_PAD.bottom;

  const reading = rungs.map((r) =>
    r.amount === null
      ? `${r.label}: not knowable from what has been said. ${r.basis}`
      : `${r.label}: ${cost.currency}${Math.round(r.amount).toLocaleString("en-US")}. ${r.basis}`,
  );
  reading.push(cost.line);

  return {
    width,
    height,
    rungs,
    max,
    currency: cost.currency,
    blocked: cost.blockedBy[0] ?? null,
    reading,
    empty: false,
  };
}

/* ---------------------------------------------------------------------------
 * The setting map
 *
 * This desk's central sentence is that a service and a setting are two facts,
 * not one — and that the interesting question is the DISTANCE between what the
 * service needs and what the setting's own label implies. It has always said
 * that in prose. Prose is the wrong instrument for a distance.
 *
 * Drawn: one axis, four stops, from a setting that implies no medical
 * accountability to one that implies a named responsible licensee. The setting
 * is a point on it. The service is a RANGE on it, because several classes
 * honestly span more than one stop — the depth of a peel, or the energy on a
 * device, is what decides where it sits, and neither is on the menu. Where the
 * service's range starts above the setting's point, the gap between them is the
 * thing to be closed with a name, and it is drawn as a gap rather than
 * described as one.
 *
 * WHAT IT REFUSES. It is a map of what the LABELS imply, never of what a
 * specific facility has. A clinic with a named responsible physician and a
 * clinic with a sign are the same point here, which is exactly why the caption
 * says the point is a question and not a finding.
 * ------------------------------------------------------------------------ */

/** The four stops, least accountable to most. Order is the whole figure. */
export type OversightStop = "none" | "unknown" | "mixed" | "medical";

export const OVERSIGHT_ORDER: OversightStop[] = ["none", "unknown", "mixed", "medical"];

export const OVERSIGHT_LABELS: Record<OversightStop, string> = {
  none: "None implied",
  unknown: "Not resolved",
  mixed: "Implied, unnamed",
  medical: "Named licensee",
};

export const OVERSIGHT_BLURB: Record<OversightStop, string> = {
  none: "The label implies cosmetology, esthetics or massage licensing and nothing above it.",
  unknown:
    "The material does not settle what kind of setting this is, so everything below inherits the gap.",
  mixed: "The label gestures at medical accountability without stating who holds it.",
  medical:
    "The label implies a responsible medical licensee — who still has to be named rather than assumed.",
};

/**
 * What each service class needs, as a range.
 *
 * A range rather than a point because the honest answer for three of these is
 * "it depends on the depth, and the depth is not on the menu". Naming that as a
 * span is more useful than picking a middle and pretending.
 */
export const SERVICE_NEED: Record<
  ServiceClass,
  { from: OversightStop; to: OversightStop; why: string } | null
> = {
  unselected: null,
  bodywork: {
    from: "none",
    to: "none",
    why: "Bodywork runs under massage licensing. A medical licensee is not implied and not required.",
  },
  facial: {
    from: "none",
    to: "mixed",
    why: "An esthetic facial sits inside esthetics licensing until it starts using depth, and the menu word rarely says which one this is.",
  },
  chemical: {
    from: "none",
    to: "medical",
    why: "Peels span the whole axis. A superficial acid is an esthetics service; a medium or deep peel is not, and the strength is almost never printed.",
  },
  device: {
    from: "unknown",
    to: "medical",
    why: "Energy devices span it too. What decides is the energy and the depth, neither of which appears on a menu, and both of which change who may operate it.",
  },
  injectable: {
    from: "medical",
    to: "medical",
    why: "An injectable is a medical act wherever it happens, and the question is only who is accountable for it.",
  },
  iv: {
    from: "medical",
    to: "medical",
    why: "An infusion is a medical act wherever it happens, and the setting does not change that.",
  },
  other: {
    from: "unknown",
    to: "unknown",
    why: "The class has not been settled, so what it requires cannot be placed on this axis at all.",
  },
};

export type SettingMapModel = {
  width: number;
  height: number;
  empty: boolean;
  /** Pixel x of each stop, in order. */
  stops: { id: OversightStop; x: number; label: string }[];
  /** Where the SETTING's own label sits. Null when no setting is named. */
  venue: { x: number; stop: OversightStop; label: string } | null;
  /** The span the SERVICE needs. Null when no class is named. */
  need: { x1: number; x2: number; from: OversightStop; to: OversightStop; label: string } | null;
  /** Drawn only when the service starts above the setting. */
  gap: { x1: number; x2: number; stops: number } | null;
  /** The sentence the picture is making. */
  headline: string;
  reading: string[];
};

const MAP_PAD = { side: 56, top: 44, bottom: 52 };

export function settingMapModel(input: EvalInput, width = 640): SettingMapModel {
  const venueNamed = input.venue !== "unclear" && Boolean(input.venue);
  const classNamed = input.serviceClass !== "unselected";
  const height = 168;

  const inner = Math.max(120, width - MAP_PAD.side * 2);
  const step = inner / (OVERSIGHT_ORDER.length - 1);
  const xOf = (s: OversightStop) => MAP_PAD.side + OVERSIGHT_ORDER.indexOf(s) * step;
  const stops = OVERSIGHT_ORDER.map((id) => ({ id, x: xOf(id), label: OVERSIGHT_LABELS[id] }));

  if (!venueNamed && !classNamed) {
    return {
      width,
      height,
      empty: true,
      stops,
      venue: null,
      need: null,
      gap: null,
      headline: "Name the service and the setting and this draws the distance between them.",
      reading: [],
    };
  }

  const profile = VENUE_PROFILES[input.venue];
  const venue = venueNamed
    ? { x: xOf(profile.oversight), stop: profile.oversight, label: profile.short }
    : null;

  const spec = SERVICE_NEED[input.serviceClass];
  const need = spec
    ? {
        x1: xOf(spec.from),
        x2: xOf(spec.to),
        from: spec.from,
        to: spec.to,
        label: SERVICE_LABELS[input.serviceClass],
      }
    : null;

  const venueIndex = venue ? OVERSIGHT_ORDER.indexOf(venue.stop) : -1;
  const needIndex = need ? OVERSIGHT_ORDER.indexOf(need.from) : -1;
  const gapStops = venue && need ? needIndex - venueIndex : 0;
  const gap = venue && need && gapStops > 0 ? { x1: venue.x, x2: need.x1, stops: gapStops } : null;

  const reading: string[] = [];
  if (venue) {
    reading.push(
      `Setting: ${venue.label}. Its label implies ${OVERSIGHT_LABELS[venue.stop].toLowerCase()}. ${OVERSIGHT_BLURB[venue.stop]}`,
    );
  } else {
    reading.push("No setting named, so nothing can be placed on the axis for it.");
  }
  if (need && spec) {
    reading.push(
      need.from === need.to
        ? `Service: ${need.label}. It sits at "${OVERSIGHT_LABELS[need.from].toLowerCase()}". ${spec.why}`
        : `Service: ${need.label}. It spans "${OVERSIGHT_LABELS[need.from].toLowerCase()}" to "${OVERSIGHT_LABELS[need.to].toLowerCase()}". ${spec.why}`,
    );
  } else {
    reading.push("No service class named, so what it requires cannot be placed.");
  }

  let headline: string;
  if (!venue) {
    headline =
      "The service is placed; the setting is not. Which kind of place this is decides who is accountable for it.";
  } else if (!need) {
    headline =
      "The setting is placed; the service is not. What is actually being done decides what the setting has to carry.";
  } else if (gap) {
    headline =
      gap.stops >= 2
        ? `This service starts ${gap.stops} stops above what the setting's own label implies. That distance is not a verdict — it is the thing a name has to close.`
        : "This service starts above what the setting's own label implies. Somebody has to be named to close the distance.";
    reading.push(
      `The gap: the service begins at "${OVERSIGHT_LABELS[need.from].toLowerCase()}" and the setting's label reaches "${OVERSIGHT_LABELS[venue.stop].toLowerCase()}". Ask who holds the license this service runs under, and whether they are on site while it happens.`,
    );
  } else if (needIndex < venueIndex) {
    headline =
      "The setting implies more accountability than this service requires. That is not a problem; it is simply not the question that decides this booking.";
    reading.push(
      "No distance to close on this axis. The remaining questions are about the room, the product and the money.",
    );
  } else {
    headline =
      "The service and the setting's own label sit at the same stop. That is agreement between two labels, which is not the same as a name.";
    reading.push(
      "Both labels agree. Neither of them is a person, and it is a person who is accountable.",
    );
  }

  return { width, height, empty: false, stops, venue, need, gap, headline, reading };
}
