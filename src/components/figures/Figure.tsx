import { useId, useState, type ReactNode } from "react";
import { hatchId, tone, toneMix, type FigureTone, type Hatch } from "@/lib/figures/core";

/**
 * The frame every Vanity figure is drawn inside.
 *
 * A figure on this desk is an argument, not an ornament, so the frame insists
 * on four things a bare `<svg>` would let you skip:
 *
 *   - A CAPTION that says what the picture claims. If the caption is hard to
 *     write, the figure is not explaining anything and should be a sentence.
 *   - A TEXT READING. Every figure carries the same content as prose, one line
 *     per mark, behind a disclosure. That is the screen-reader path, the print
 *     path, the 320px-phone path and the "I do not trust this chart" path, and
 *     it is one implementation rather than four.
 *   - A LEGEND, when more than one thing is encoded, stating the non-colour
 *     channel as well as the colour.
 *   - A SOURCE LINE: where these numbers came from. "From what you entered" and
 *     "read from the product name" are very different figures and the reader is
 *     entitled to know which one they are looking at.
 */

export type LegendItem = {
  label: string;
  tone: FigureTone;
  hatch?: Hatch;
  /** Square, round or a line — the shape channel. */
  shape?: "square" | "round" | "line";
  note?: string;
};

export type FigureProps = {
  /** The claim the picture makes, in one sentence. */
  caption: string;
  /** Small-caps label above the caption. */
  eyebrow?: string;
  /** Long description for assistive technology; defaults to the caption. */
  description?: string;
  /** Intrinsic drawing box. */
  width: number;
  height: number;
  legend?: LegendItem[];
  /** One line per mark, in reading order. Required — see the frame's contract. */
  reading: string[];
  /** Where the numbers came from. */
  source?: string;
  /** Rendered inside the svg, already positioned in viewBox units. */
  children: (ctx: { id: string }) => ReactNode;
  className?: string;
  /** Cap the drawn width so a small figure does not stretch across a desk. */
  maxWidth?: number;
};

export function Figure({
  caption,
  eyebrow,
  description,
  width,
  height,
  legend,
  reading,
  source,
  children,
  className,
  maxWidth,
}: FigureProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [open, setOpen] = useState(false);
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <figure className={["my-6 min-w-0", className].filter(Boolean).join(" ")}>
      {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
      <div
        className="overflow-hidden rounded-lg border border-rule bg-parchment"
        style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto w-full"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <title id={titleId}>{caption}</title>
          <desc id={descId}>{description ?? reading.join(" ")}</desc>
          <FigureDefs id={id} />
          {children({ id })}
        </svg>
      </div>

      {legend && legend.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-soft">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <LegendSwatch item={item} id={id} />
              <span className="text-ink">{item.label}</span>
              {item.note ? <span className="text-ink-soft">— {item.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <figcaption className="mt-3 text-sm leading-relaxed text-ink-soft">
        {caption}
        {source ? <span className="block mt-1 text-xs">{source}</span> : null}
      </figcaption>

      <div className="mt-2 no-print">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${id}-reading`}
          className="inline-flex min-h-11 items-center rounded border border-rule px-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-soft hover:text-bronze-ink"
        >
          {open ? "Hide the reading" : "Read as text"}
        </button>
      </div>
      <div
        id={`${id}-reading`}
        className={`mt-3 border-l-2 border-rule pl-4 ${open ? "block" : "hidden print:block"}`}
      >
        <ul className="space-y-1 text-sm leading-relaxed text-ink-soft">
          {reading.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

function LegendSwatch({ item, id }: { item: LegendItem; id: string }) {
  const colour = tone(item.tone);
  const fill = item.hatch && item.hatch !== "none" && item.hatch !== "solid"
    ? `url(#${hatchId(id, item.hatch)})`
    : toneMix(item.tone, 30);
  if (item.shape === "line") {
    return (
      <span aria-hidden className="inline-block h-0.5 w-5 shrink-0" style={{ background: colour }} />
    );
  }
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <FigureDefs id={id} />
      {item.shape === "round" ? (
        <circle cx="7" cy="7" r="5.5" fill={fill} stroke={colour} strokeWidth="1.4" />
      ) : (
        <rect x="1" y="1" width="12" height="12" fill={fill} stroke={colour} strokeWidth="1.4" />
      )}
    </svg>
  );
}

/**
 * Hatch patterns, the non-colour channel.
 *
 * `currentColor` is used inside each pattern and set by the consumer on the
 * element that references it, so one set of defs serves every tone in the
 * figure rather than one set per tone.
 */
export function FigureDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={hatchId(id, "diagonal")} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      </pattern>
      <pattern id={hatchId(id, "cross")} width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M0 3h6M3 0v6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </pattern>
      <pattern id={hatchId(id, "dots")} width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.2" fill="currentColor" opacity="0.5" />
      </pattern>
      <pattern id={hatchId(id, "vertical")} width="5" height="5" patternUnits="userSpaceOnUse">
        <line x1="1" y1="0" x2="1" y2="5" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
      </pattern>
    </defs>
  );
}

/* ---------------------------------------------------------------------------
 * Marks shared by more than one figure
 * ------------------------------------------------------------------------ */

export function AxisLabel({
  x,
  y,
  children,
  anchor = "middle",
  size = 10,
  toneName = "muted",
  uppercase,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  size?: number;
  toneName?: FigureTone;
  uppercase?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={tone(toneName)}
      fontSize={size}
      letterSpacing={uppercase ? 1.4 : 0}
      style={uppercase ? { textTransform: "uppercase" } : undefined}
    >
      {children}
    </text>
  );
}

/** A hairline rule in the figure's own border tone. */
export function Rule({ x1, y1, x2, y2, dashed }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={tone("line")}
      strokeWidth={1}
      strokeDasharray={dashed ? "3 4" : undefined}
    />
  );
}
