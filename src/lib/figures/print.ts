/**
 * Figures on paper.
 *
 * The printed records this desk produces have always been text and tables. They
 * are honest and they are not what someone takes to an appointment, because the
 * arguments this desk makes best — the overlap map, the chronicle, the spend
 * curve — are spatial, and a table of the same numbers is not the same
 * argument.
 *
 * Two ways to put a figure on paper. The wrong one is to write a second
 * renderer that emits SVG strings: two renderers drift, and the printed figure
 * becomes subtly wrong in a way nobody notices until it is in someone's hand.
 * The right one is to take the SVG the browser has already drawn and carry it
 * across — one renderer, one geometry, no drift.
 *
 * What has to change on the way is the palette, and only the palette. A figure
 * painted in the dark desk's tokens prints as a black rectangle with black type
 * on it. So the print document declares the same eight token names at
 * ink-on-paper values, and every `var(--…)` inside the serialised SVG resolves
 * against those instead. The figure's own drawing code never learns that it is
 * being printed, which is exactly the point.
 */

/** The attribute every printable figure carries. Set by the `Figure` frame. */
export const FIGURE_ATTR = "data-vv-figure";

/**
 * The figure tokens, at values that work on white paper.
 *
 * These are the printed edition of the palette, not a new one: the same
 * oxblood, the same brass, the same ink already declared in `PRINT_STYLES` and
 * already locked to the publication's presets. Named here so a figure and the
 * prose beside it come off the printer in one voice.
 */
export const PRINT_FIGURE_TOKENS = `
      --foreground: #1a1714;
      --muted-foreground: #5c5349;
      --champagne: #7a1f2b;
      --ok: #2f5d43;
      --warn: #8a6a1f;
      --risk: #7a1f2b;
      --card: #ffffff;
      --border: #d8cdb8;`;

export type CapturedFigure = {
  /** Serialised `<svg>` markup, ready to inline. */
  svg: string;
  caption: string;
  /** The text reading, so the printed figure carries its own words. */
  reading: string[];
  source: string;
};

/**
 * Take every figure inside `scope` and turn it into printable markup.
 *
 * Deliberately forgiving: a figure that has not rendered, or that a browser
 * cannot serialise, is skipped rather than allowed to break the print. A
 * missing diagram in a printout is a shame; a blank page is a bug.
 */
export function captureFigures(scope: ParentNode | null = null): CapturedFigure[] {
  if (typeof document === "undefined") return [];
  const root = scope ?? document;
  const out: CapturedFigure[] = [];

  for (const figure of Array.from(root.querySelectorAll(`figure[${FIGURE_ATTR}]`))) {
    const svg = figure.querySelector("svg");
    if (!svg) continue;
    let markup: string;
    try {
      const clone = svg.cloneNode(true) as SVGElement;
      clone.removeAttribute("class");
      clone.setAttribute("width", "100%");
      clone.setAttribute("style", "max-width:100%;height:auto;");
      markup = new XMLSerializer().serializeToString(clone);
    } catch {
      continue;
    }

    const caption = figure.querySelector("figcaption")?.textContent?.trim() ?? "";
    const reading = Array.from(figure.querySelectorAll("li"))
      .map((li) => li.textContent?.trim() ?? "")
      .filter(Boolean);

    out.push({
      svg: markup,
      caption,
      reading,
      source: figure.getAttribute(`${FIGURE_ATTR}-source`) ?? "",
    });
  }

  return out;
}

/**
 * A captured figure as a print block.
 *
 * The reading travels with the picture. On paper that is not an accessibility
 * afterthought — it is the half a reader can annotate, and the half that
 * survives a bad photocopier.
 */
export function figurePrintHtml(figure: CapturedFigure, escape: (v: unknown) => string): string {
  const reading = figure.reading.length
    ? `<ul class="figure-reading">${figure.reading.map((l) => `<li>${escape(l)}</li>`).join("")}</ul>`
    : "";
  return `<figure class="print-figure">
  <div class="print-figure-art">${figure.svg}</div>
  ${figure.caption ? `<figcaption>${escape(figure.caption)}</figcaption>` : ""}
  ${reading}
</figure>`;
}

/** Every captured figure, in document order, as one block of markup. */
export function figuresPrintHtml(
  figures: CapturedFigure[],
  escape: (v: unknown) => string,
): string {
  if (figures.length === 0) return "";
  return figures.map((f) => figurePrintHtml(f, escape)).join("\n");
}

/** Styles for the print document's figure blocks. Paired with the tokens above. */
export const PRINT_FIGURE_STYLES = `
    .print-figure {
      margin: 0.9rem 0 1.1rem;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .print-figure-art {
      border: 1px solid var(--line);
      padding: 0.35rem;
      background: #fff;
    }
    .print-figure-art svg { display: block; width: 100%; height: auto; }
    .print-figure figcaption {
      margin-top: 0.4rem;
      font-size: 0.8rem;
      line-height: 1.4;
      color: var(--muted);
    }
    .figure-reading {
      margin: 0.4rem 0 0 0;
      padding-left: 0.9rem;
      font-size: 0.74rem;
      line-height: 1.4;
      color: var(--muted);
      border-left: 2px solid var(--line);
      list-style: none;
    }
    .figure-reading li { margin: 0.12rem 0; }`;
