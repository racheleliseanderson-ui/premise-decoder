/**
 * Vanity Figures — the drawing vocabulary.
 *
 * Every diagram in the Vanity or Vice fleet is built from this file. Three
 * rules made it exist, and breaking any of them is how a figure stops being an
 * explanation and becomes decoration:
 *
 * 1. NO COLOUR OF ITS OWN. Figures paint with the application's CSS custom
 *    properties and nothing else. The palette is locked; a figure that hard-codes
 *    a hex is a palette change smuggled in through a chart. `tone()` returns a
 *    `var(--token)` string and there is no other way to get a colour in here.
 *    This also means every figure survives all four themes — dark, light,
 *    hc-black, hc-white — and the colour-blind variant, for free.
 *
 * 2. COLOUR IS NEVER THE ONLY CHANNEL. Anything encoded by hue is also encoded
 *    by fill pattern, shape, position or a printed label. `HATCH` exists for
 *    exactly this. A reader who cannot separate the greens from the reds, or who
 *    is looking at a black-and-white print of a decision packet, still gets the
 *    figure.
 *
 * 3. GEOMETRY IS PURE. Nothing in this file imports React or touches the DOM,
 *    so the layout maths is testable on its own and a figure that lays out wrong
 *    fails in a unit test rather than in someone's browser at 2am.
 *
 * Units are abstract viewBox units throughout. Figures declare their own
 * intrinsic box and scale to their container; do not think in pixels here.
 */

/* ---------------------------------------------------------------------------
 * Tone
 * ------------------------------------------------------------------------ */

/**
 * The semantic slots a figure may paint with. These map onto tokens the
 * application already defines for its status language, so a figure and the
 * sentence beside it cannot disagree about what "watch" looks like.
 */
export type FigureTone =
  | "ink"
  | "muted"
  | "accent"
  | "ok"
  | "warn"
  | "risk"
  | "surface"
  | "line";

/*
 * The spa desk's own token map.
 *
 * This file is otherwise byte-identical to the one in the skincare and makeup
 * desks — deliberately, so a figure written for one reads the same in another.
 * Only this table differs, because Spa Intelligence runs a bone-and-parchment
 * ground with an ink/oxblood/bronze/pine signal set rather than the dark
 * ink-and-champagne desks. Changing a value here changes nothing about the
 * approved palette; it points the same eight semantic slots at the tokens this
 * application already defines for exactly these meanings.
 *
 * `accent` is `--bronze` rather than `--bronze-ink` because figures paint rules,
 * fills and large type. Small text inside a figure uses `toneText("accent")`,
 * which resolves to the contrast-checked text bronze.
 */
const TONE_VAR: Record<FigureTone, string> = {
  ink: "--ink",
  muted: "--ink-soft",
  accent: "--bronze",
  ok: "--pine",
  warn: "--bronze",
  risk: "--oxblood",
  surface: "--parchment",
  line: "--rule",
};

/**
 * Text-safe variants. The display bronze fails AA below about 12px on
 * parchment, and a figure's labels are exactly that size, so label text goes
 * through here and marks go through `tone`.
 */
const TONE_TEXT_VAR: Partial<Record<FigureTone, string>> = {
  accent: "--bronze-ink",
  warn: "--bronze-ink",
};

/** A CSS colour reference safe for small text in a figure. */
export function toneText(t: FigureTone): string {
  const v = TONE_TEXT_VAR[t];
  return v ? `var(${v})` : tone(t);
}

/** A CSS colour reference for a tone. The only source of colour in a figure. */
export function tone(t: FigureTone): string {
  return `var(${TONE_VAR[t]})`;
}

/**
 * A tone at partial opacity.
 *
 * `color-mix` is used rather than `fill-opacity` because a figure often needs a
 * translucent fill *underneath* an opaque stroke of the same tone, and an
 * element-level opacity would take the stroke with it.
 */
export function toneMix(t: FigureTone, percent: number): string {
  const p = clamp(Math.round(percent), 0, 100);
  return `color-mix(in oklab, ${tone(t)} ${p}%, transparent)`;
}

/**
 * The non-colour channel. Each tone gets a distinguishable fill texture, so a
 * bar chart read in greyscale still separates its series.
 *
 * `none` is a legitimate value: a figure with a single series has nothing to
 * disambiguate and hatching it is noise.
 */
export type Hatch = "none" | "solid" | "diagonal" | "cross" | "dots" | "vertical";

/** Stable id for a hatch pattern inside a given figure. Patterns are per-figure
 *  because two figures on one page must not share a `<defs>` id. */
export function hatchId(figureId: string, hatch: Hatch): string {
  return `${figureId}-hatch-${hatch}`;
}

export function hatchFill(figureId: string, hatch: Hatch, t: FigureTone, percent = 14): string {
  if (hatch === "none") return "transparent";
  if (hatch === "solid") return toneMix(t, percent);
  return `url(#${hatchId(figureId, hatch)})`;
}

/* ---------------------------------------------------------------------------
 * Numbers
 * ------------------------------------------------------------------------ */

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Guard against NaN/Infinity reaching an SVG attribute, where it silently
 *  blanks the element instead of throwing. */
export function finite(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

/** Round to a fixed number of places for compact, diff-stable path data. */
export function r(v: number, places = 2): number {
  const f = 10 ** places;
  return Math.round(finite(v) * f) / f;
}

export type Scale = {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
  invert(position: number): number;
};

/** A clamped linear scale. Clamped on purpose: a figure should never draw
 *  outside its own frame because one datum was larger than expected. */
export function linearScale(
  domain: [number, number],
  range: [number, number],
  { clamped = true }: { clamped?: boolean } = {},
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const fn = ((value: number) => {
    if (span === 0) return r0;
    const t = (finite(value) - d0) / span;
    const u = clamped ? clamp(t, 0, 1) : t;
    return r0 + u * (r1 - r0);
  }) as Scale;
  fn.domain = domain;
  fn.range = range;
  fn.invert = (position: number) => {
    const t = (r1 - r0) === 0 ? 0 : (position - r0) / (r1 - r0);
    return d0 + t * span;
  };
  return fn;
}

export type Band = { index: number; start: number; end: number; center: number; size: number };

/** Evenly divide a range into n bands with proportional padding between them. */
export function bandScale(
  count: number,
  range: [number, number],
  { padding = 0.16 }: { padding?: number } = {},
): Band[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return [];
  const [r0, r1] = range;
  const total = r1 - r0;
  const step = total / n;
  const pad = step * clamp(padding, 0, 0.9);
  const size = step - pad;
  return Array.from({ length: n }, (_, index) => {
    const start = r0 + index * step + pad / 2;
    return { index, start, end: start + size, center: start + size / 2, size };
  });
}

/**
 * A round number at or above `value`, for an axis top that reads like money
 * rather than like a maximum. 137 becomes 150, 1_402 becomes 1_500.
 */
export function niceCeil(value: number): number {
  const v = finite(value);
  if (v <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(v));
  const normalised = v / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Evenly spaced tick values across a domain, inclusive of both ends. */
export function ticks(domain: [number, number], count: number): number[] {
  const n = Math.max(1, Math.floor(count));
  const [d0, d1] = domain;
  return Array.from({ length: n + 1 }, (_, i) => d0 + ((d1 - d0) * i) / n);
}

/* ---------------------------------------------------------------------------
 * Paths
 * ------------------------------------------------------------------------ */

export type Point = { x: number; y: number };

export function polyline(points: Point[]): string {
  if (points.length === 0) return "";
  return points
    .filter((p): p is Point => !!p)
    .map((p, i) => `${i === 0 ? "M" : "L"}${r(p.x)} ${r(p.y)}`)
    .join(" ");
}

/**
 * A monotone cubic through the points — smooth without the overshoot a plain
 * Catmull-Rom gives you, which matters because an overshooting cost curve draws
 * money that was never spent.
 */
export function smoothPath(points: Point[]): string {
  if (points.length < 3) return polyline(points);
  const pts = points.filter((p): p is Point => !!p);
  const n = pts.length;
  if (n < 3) return polyline(pts);

  const dx: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = pts[i] as Point;
    const b = pts[i + 1] as Point;
    const h = b.x - a.x;
    dx.push(h);
    slopes.push(h === 0 ? 0 : (b.y - a.y) / h);
  }

  const m: number[] = new Array(n).fill(0);
  m[0] = slopes[0] ?? 0;
  m[n - 1] = slopes[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i += 1) {
    const s0 = slopes[i - 1] ?? 0;
    const s1 = slopes[i] ?? 0;
    if (s0 * s1 <= 0) {
      m[i] = 0;
      continue;
    }
    const h0 = dx[i - 1] ?? 0;
    const h1 = dx[i] ?? 0;
    const w1 = 2 * h1 + h0;
    const w2 = h1 + 2 * h0;
    const denom = w1 / s0 + w2 / s1;
    m[i] = denom === 0 ? 0 : (w1 + w2) / denom;
  }

  let d = `M${r((pts[0] as Point).x)} ${r((pts[0] as Point).y)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const a = pts[i] as Point;
    const b = pts[i + 1] as Point;
    const h = (dx[i] ?? 0) / 3;
    const ma = m[i] ?? 0;
    const mb = m[i + 1] ?? 0;
    d += ` C${r(a.x + h)} ${r(a.y + ma * h)} ${r(b.x - h)} ${r(b.y - mb * h)} ${r(b.x)} ${r(b.y)}`;
  }
  return d;
}

/** Close a line path down to a baseline, for an area fill under a curve. */
export function areaUnder(path: string, points: Point[], baseline: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return "";
  return `${path} L${r(last.x)} ${r(baseline)} L${r(first.x)} ${r(baseline)} Z`;
}

export type Corners = number | { tl?: number; tr?: number; br?: number; bl?: number };

/** A rect with independently rounded corners — used for stacked bands where
 *  only the outer ends of the stack should be round. */
export function roundedRect(x: number, y: number, w: number, h: number, corners: Corners = 0): string {
  const width = Math.max(0, finite(w));
  const height = Math.max(0, finite(h));
  const lim = Math.min(width, height) / 2;
  const c = typeof corners === "number" ? { tl: corners, tr: corners, br: corners, bl: corners } : corners;
  const tl = clamp(c.tl ?? 0, 0, lim);
  const tr = clamp(c.tr ?? 0, 0, lim);
  const br = clamp(c.br ?? 0, 0, lim);
  const bl = clamp(c.bl ?? 0, 0, lim);
  return [
    `M${r(x + tl)} ${r(y)}`,
    `H${r(x + width - tr)}`,
    tr ? `A${r(tr)} ${r(tr)} 0 0 1 ${r(x + width)} ${r(y + tr)}` : "",
    `V${r(y + height - br)}`,
    br ? `A${r(br)} ${r(br)} 0 0 1 ${r(x + width - br)} ${r(y + height)}` : "",
    `H${r(x + bl)}`,
    bl ? `A${r(bl)} ${r(bl)} 0 0 1 ${r(x)} ${r(y + height - bl)}` : "",
    `V${r(y + tl)}`,
    tl ? `A${r(tl)} ${r(tl)} 0 0 1 ${r(x + tl)} ${r(y)}` : "",
    "Z",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * A cubic ribbon from one point to another, bulging horizontally.
 *
 * This is the overlap-map connector. It is drawn as a filled ribbon rather than
 * a stroked line because the *thickness* carries the money: a wide ribbon is an
 * expensive overlap.
 */
export function ribbon(from: Point, to: Point, thickness: number, bow = 0.5): string {
  const half = Math.max(0.5, thickness / 2);
  const cx = (to.x - from.x) * clamp(bow, 0, 1);
  const top = `M${r(from.x)} ${r(from.y - half)} C${r(from.x + cx)} ${r(from.y - half)} ${r(
    to.x - cx,
  )} ${r(to.y - half)} ${r(to.x)} ${r(to.y - half)}`;
  const bottom = `L${r(to.x)} ${r(to.y + half)} C${r(to.x - cx)} ${r(to.y + half)} ${r(
    from.x + cx,
  )} ${r(from.y + half)} ${r(from.x)} ${r(from.y + half)} Z`;
  return `${top} ${bottom}`;
}

/* ---------------------------------------------------------------------------
 * Text
 * ------------------------------------------------------------------------ */

/**
 * Truncate to fit an approximate width in viewBox units.
 *
 * SVG has no text wrapping and measuring text requires a DOM, so figures budget
 * characters instead. `perChar` is the average advance of the label font at
 * `size`, measured once rather than guessed: 0.52em for Source Sans 3 at these sizes.
 */
export function fitText(text: string, maxWidth: number, size: number, perChar = 0.52): string {
  const budget = Math.floor(maxWidth / (size * perChar));
  if (budget <= 1) return "";
  if (text.length <= budget) return text;
  return `${text.slice(0, Math.max(1, budget - 1)).trimEnd()}…`;
}

/** Break a string into lines of at most `budget` characters, on word bounds. */
export function wrapText(text: string, maxWidth: number, size: number, maxLines = 2, perChar = 0.52): string[] {
  const budget = Math.max(1, Math.floor(maxWidth / (size * perChar)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= budget) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === 0) return [];
  const overflowed = lines.join(" ").length < text.replace(/\s+/g, " ").length;
  const last = lines[lines.length - 1];
  if (overflowed && last !== undefined) {
    lines[lines.length - 1] = fitText(`${last}…`, maxWidth, size, perChar);
  }
  return lines;
}

/* ---------------------------------------------------------------------------
 * Size
 * ------------------------------------------------------------------------ */

/**
 * The width below which a figure takes its compact form.
 *
 * It lives in `core` rather than beside the React hook that measures width, for
 * a reason worth stating: everything in this file is pure, and the geometry
 * modules that import it are unit-tested with `node --test`, which has no
 * bundler and no React. A model that reached through a hook module to ask
 * "am I narrow?" dragged React into a maths test and broke it — quietly on a
 * machine with the package installed, loudly on one without.
 *
 * A layout constant is not a hook. It belongs with the layout.
 */
export const COMPACT_BELOW = 460;

export function isCompact(width: number): boolean {
  return width < COMPACT_BELOW;
}
