import { useEffect, useRef, useState, type RefObject } from "react";
import { COMPACT_BELOW, isCompact } from "./core.ts";

/**
 * The width a figure should actually draw itself at.
 *
 * This is the whole answer to figures on a phone, and it is worth writing down
 * why the obvious approach fails. An SVG with a fixed 640-unit viewBox scaled
 * into a 360px screen renders its 10-unit labels at about 5.6 real pixels. The
 * figure does not break; it becomes unreadable, which is worse, because it
 * still looks like a figure. Every diagram in this fleet would have been
 * decoration on the device most people use.
 *
 * So a figure is not scaled down — it is REDRAWN narrower. Every model in
 * `@/lib/figures` takes a width and lays out against it: fewer axis ticks,
 * shorter labels through `fitText`, tighter gutters. One viewBox unit stays
 * roughly one CSS pixel at every size, so 10 means 10 on a phone exactly as it
 * does on a desk.
 *
 * Server-safe by construction. The first render uses `preferred`, which is what
 * the server has to assume anyway; the measurement lands on mount and the
 * figure reflows once. A figure that flashed at the wrong size would be worse
 * than the flash — hence the ceiling at `preferred` rather than growing to fill
 * a very wide column, which would stretch a small figure into a banner.
 */
export function useFigureWidth(
  preferred = 640,
  min = 300,
): { ref: RefObject<HTMLElement | null>; width: number } {
  const ref = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(preferred);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      // Round to 4px so a scrollbar appearing does not cause a re-layout storm.
      const raw = el.getBoundingClientRect().width;
      if (raw <= 0) return;
      const next = Math.max(min, Math.min(preferred, Math.round(raw / 4) * 4));
      setWidth((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [preferred, min]);

  return { ref, width };
}

/**
 * Re-exported so a component can ask "am I compact?" without a second import,
 * while the definition itself stays in `core` where the pure models can reach
 * it without pulling React into a unit test. See the note there.
 */
export { COMPACT_BELOW, isCompact };
