import assert from "node:assert/strict";
import test from "node:test";
import {
  ledgerModel,
  ledgerLabelsInside,
  claimAnatomyModel,
  anatomyLines,
  promisePlaceModel,
} from "./figures/spa.ts";
import { tone, toneText, toneMix, niceCeil, smoothPath, polyline } from "./figures/core.ts";
import { assess, emptyInput, type Signal } from "./engine.ts";

const signal = (over: Partial<Signal> & { id: string }): Signal => ({
  label: over.id,
  state: "fail-closed",
  weight: 10,
  reading: "",
  ask: `Who does the ${over.id}?`,
  depth: "full",
  ...over,
});

/* ---------------------------------------------------------------- the palette */

test("a figure's colour only ever comes from a token", () => {
  for (const t of ["ink", "muted", "accent", "ok", "warn", "risk", "surface", "line"] as const) {
    assert.match(tone(t), /^var\(--[a-z-]+\)$/);
    assert.doesNotMatch(tone(t), /#|rgb\(|oklch\(|hsl\(/);
    assert.doesNotMatch(toneText(t), /#|rgb\(|oklch\(|hsl\(/);
  }
});

test("small text uses the contrast-checked bronze, marks use the display bronze", () => {
  assert.equal(tone("accent"), "var(--bronze)");
  assert.equal(toneText("accent"), "var(--bronze-ink)");
});

test("a mix stays inside 0-100 whatever it is handed", () => {
  assert.ok(toneMix("ok", 300).includes("100%"));
  assert.ok(toneMix("ok", -12).includes("0%"));
});

test("an axis top reads like a number a person would say", () => {
  assert.equal(niceCeil(137), 200);
  assert.equal(niceCeil(0), 0);
});

test("no path ever carries NaN into an attribute", () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 10, y: Number.NaN },
    { x: 20, y: 5 },
    { x: 30, y: 1 },
  ];
  assert.doesNotMatch(smoothPath(pts), /NaN|Infinity/);
  assert.doesNotMatch(polyline(pts), /NaN|Infinity/);
});

/* --------------------------------------------------------------- the ledger */

test("an empty desk produces an empty ledger rather than a misleading one", () => {
  const m = ledgerModel([]);
  assert.ok(m.empty);
  assert.equal(m.segments.length, 0);
  assert.equal(m.establishedShare, 0);
});

test("segments fill the bar exactly once — no gaps, no overlap", () => {
  const m = ledgerModel([
    signal({ id: "operator", state: "known", weight: 30 }),
    signal({ id: "product", state: "partial", weight: 20 }),
    signal({ id: "aftercare", state: "fail-closed", weight: 25 }),
    signal({ id: "complications", state: "fail-closed", weight: 25, refused: true }),
  ]);
  assert.ok(!m.empty);
  const total = m.segments.reduce((s, seg) => s + seg.share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `shares summed to ${total}`);
  for (let i = 1; i < m.segments.length; i += 1) {
    const prev = m.segments[i - 1];
    const cur = m.segments[i];
    assert.ok(prev && cur);
    assert.ok(Math.abs(prev.x + prev.width - cur.x) < 1e-6, "a gap opened between segments");
  }
});

test("the bar reads settled to unsettled, left to right", () => {
  const m = ledgerModel([
    signal({ id: "a", state: "fail-closed", weight: 10 }),
    signal({ id: "b", state: "known", weight: 10 }),
    signal({ id: "c", state: "partial", weight: 10 }),
  ]);
  assert.deepEqual(m.segments.map((s) => s.band), ["established", "partial", "unnamed"]);
});

test("a refused answer is its own band, not filed as merely unnamed", () => {
  const m = ledgerModel([signal({ id: "licence", state: "fail-closed", weight: 40, refused: true })]);
  assert.deepEqual(m.segments.map((s) => s.band), ["refused"]);
});

test("weight decides width, so three light answers do not outweigh one heavy gap", () => {
  const m = ledgerModel([
    signal({ id: "a", state: "known", weight: 4 }),
    signal({ id: "b", state: "known", weight: 4 }),
    signal({ id: "c", state: "known", weight: 4 }),
    signal({ id: "heavy", state: "fail-closed", weight: 40 }),
  ]);
  const established = m.segments.find((s) => s.band === "established");
  const unnamed = m.segments.find((s) => s.band === "unnamed");
  assert.ok(established && unnamed);
  assert.ok(unnamed.width > established.width, "a heavy gap was drawn smaller than three light answers");
});

test("the heaviest gap is named, and a refusal is not offered as one", () => {
  const m = ledgerModel([
    signal({ id: "small", state: "fail-closed", weight: 5 }),
    signal({ id: "big", state: "fail-closed", weight: 40 }),
    signal({ id: "refused", state: "fail-closed", weight: 90, refused: true }),
  ]);
  assert.equal(m.heaviestGap?.label, "big");
});

/* -------------------------------------------------------------- claim anatomy */

const LINE = "Medical-grade results in a luxury setting, performed by our expert team.";

/**
 * The claim fields `claimAnatomyModel` does not read, filled once so the
 * fixtures below stay about the thing they are testing.
 */
const REST = {
  kind: "outcome" as const,
  measurability: "vague" as const,
  substantiation: [] as string[],
  emotionalWork: null,
  at: 0,
  count: 1,
};

test("an empty box draws nothing", () => {
  assert.ok(claimAnatomyModel("", []).empty);
  assert.ok(claimAnatomyModel("   ", []).empty);
});

test("a highlight lands on the phrase it is highlighting", () => {
  const claims = [
    { phrase: "Medical-grade", category: "tier word", hides: "no standard", ask: "which standard?", severity: "hard" as const, ...REST },
  ];
  const m = claimAnatomyModel(LINE, claims);
  assert.equal(m.spans.length, 1);
  assert.equal(m.spans[0]?.text, "Medical-grade");
  assert.equal(m.spans[0]?.start, LINE.indexOf("Medical-grade"));
});

test("two claims never highlight the same characters twice", () => {
  const claims = [
    { phrase: "expert", category: "credential", hides: "no licence", ask: "licensed as what?", severity: "flag" as const, ...REST },
    { phrase: "expert team", category: "credential", hides: "no names", ask: "who?", severity: "flag" as const, ...REST },
  ];
  const m = claimAnatomyModel(LINE, claims);
  const ranges = m.spans.map((s) => [s.start, s.end] as const).sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < ranges.length; i += 1) {
    const prev = ranges[i - 1];
    const cur = ranges[i];
    assert.ok(prev && cur);
    assert.ok(cur[0] >= prev[1], "two highlights overlapped");
  }
});

test("a phrase the decoder claims but the copy does not contain is dropped silently", () => {
  const m = claimAnatomyModel(LINE, [
    { phrase: "clinically proven", category: "certainty", hides: "no trial", ask: "which trial?", severity: "hard" as const, ...REST },
  ]);
  assert.equal(m.spans.length, 0);
  assert.equal(m.markers.length, 0);
});

test("nothing matched is reported as a fact about the rules, not a clean bill of health", () => {
  const m = claimAnatomyModel("A quiet, factual sentence about opening hours.", []);
  assert.match(m.reading.join(" "), /fact about the desk/i);
});

test("marked share is a share — never above one, never below zero", () => {
  const claims = [
    { phrase: LINE, category: "everything", hides: "-", ask: "-", severity: "hard" as const, ...REST },
  ];
  const m = claimAnatomyModel(LINE, claims);
  assert.ok(m.markedShare <= 1 && m.markedShare >= 0);
});

test("wrapped lines and highlight rows agree about where each line sits", () => {
  const long = `${LINE} ${LINE} ${LINE}`;
  const m = claimAnatomyModel(long, [
    { phrase: "luxury setting", category: "tier word", hides: "no standard", ask: "which?", severity: "flag" as const, ...REST },
  ]);
  const lines = anatomyLines(long);
  for (const span of m.spans) {
    const row = lines[span.line];
    assert.ok(row, `span on line ${span.line} has no printed row`);
    assert.equal(row.y, span.y, "a highlight sat on a different baseline from its text");
  }
});

test("every span stays inside the figure it is drawn in", () => {
  const long = `${LINE} ${LINE}`;
  const m = claimAnatomyModel(long, [
    { phrase: "expert team", category: "credential", hides: "-", ask: "-", severity: "flag" as const, ...REST },
  ]);
  for (const span of m.spans) {
    assert.ok(span.x >= 0 && span.x + span.width <= m.width + 1, "a highlight escaped the frame");
    assert.ok(span.y <= m.height, "a highlight was drawn below the frame");
  }
});

/* ------------------------------------------------------------ promise vs place */

test("promise and place bars are proportional and stay in the frame", () => {
  const a = assess({ ...emptyInput, marketing: LINE, serviceClass: "injectable", venue: "med-spa" });
  const m = promisePlaceModel(a);
  assert.ok(m.promise.w >= 0 && m.place.w >= 0);
  assert.ok(m.promise.x + m.promise.w <= m.width);
  assert.ok(m.place.x + m.place.w <= m.width);
  assert.equal(m.reading.length, 3);
});

test("the gap band only exists when the promise is actually ahead", () => {
  const a = assess({ ...emptyInput });
  const m = promisePlaceModel(a);
  if (a.promise <= a.place) assert.equal(m.gapBand, null);
});

/* ---------------------------------------------------------------------------
 * Responsive layout
 * ------------------------------------------------------------------------ */

const WIDTHS = [320, 390, 480, 640];

test("the ledger fills its bar exactly at every width", () => {
  const signals = [
    signal({ id: "operator", state: "known", weight: 30 }),
    signal({ id: "product", state: "partial", weight: 20 }),
    signal({ id: "aftercare", state: "fail-closed", weight: 25 }),
    signal({ id: "complications", state: "fail-closed", weight: 25, refused: true }),
  ];
  for (const width of WIDTHS) {
    const m = ledgerModel(signals, width);
    const total = m.segments.reduce((s, seg) => s + seg.share, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `shares broke at ${width}`);
    const last = m.segments[m.segments.length - 1];
    assert.ok(last);
    assert.ok(last.x + last.width <= width + 0.001, `the bar overflowed at ${width}`);
  }
});

test("the ledger drops its inside labels on a phone rather than truncating them", () => {
  assert.equal(ledgerLabelsInside(320), false);
  assert.equal(ledgerLabelsInside(640), true);
});

test("claim anatomy rewraps rather than shrinking, and every highlight stays on its line", () => {
  const long = `${LINE} ${LINE}`;
  const claims = [
    { phrase: "expert team", category: "credential", hides: "no licence", ask: "licensed as what?", severity: "flag" as const, ...REST },
    { phrase: "Medical-grade", category: "tier word", hides: "no standard", ask: "which standard?", severity: "hard" as const, ...REST },
  ];
  let previousLines = 0;
  for (const width of [640, 480, 390, 320]) {
    const m = claimAnatomyModel(long, claims, width);
    const lines = anatomyLines(long, width);
    assert.ok(lines.length >= previousLines, "a narrower figure used fewer lines, which means it shrank instead of wrapping");
    previousLines = lines.length;
    for (const span of m.spans) {
      const row = lines[span.line];
      assert.ok(row, `span on line ${span.line} has no row at ${width}`);
      assert.equal(row.y, span.y, `highlight left its baseline at ${width}`);
      assert.ok(span.x + span.width <= width + 1, `highlight overflowed at ${width}`);
    }
  }
});

test("promise and place stay inside the frame at every width", () => {
  const a = assess({ ...emptyInput, marketing: LINE, serviceClass: "injectable", venue: "med-spa" });
  for (const width of WIDTHS) {
    const m = promisePlaceModel(a, width);
    assert.ok(m.promise.x + m.promise.w <= width + 0.001, `promise bar overflowed at ${width}`);
    assert.ok(m.place.x + m.place.w <= width + 0.001, `place bar overflowed at ${width}`);
    if (m.gapBand) {
      assert.ok(m.gapBand.x + m.gapBand.w <= width + 0.001, `gap band overflowed at ${width}`);
    }
  }
});

const PURE_MODULES = ["./figures/core.ts", "./figures/spa.ts"];

/* ---------------------------------------------------------------------------
 * The purity guard
 * ------------------------------------------------------------------------ */

/**
 * The geometry modules must not import React, directly or transitively.
 *
 * This is not style. These modules are unit-tested with `node --test`, which
 * has no bundler: the moment one of them reaches into a React file for a
 * constant, every maths test in this file stops running — and it stops running
 * *quietly* on a machine that happens to have React installed and loudly on one
 * that does not, which is the worst possible failure mode for a check that is
 * supposed to protect the layout.
 *
 * It has already happened once, to `isCompact`, which lived beside the hook
 * that measures width instead of beside the layout it belongs to. This test is
 * the reason it cannot happen again.
 */
test("the geometry modules stay free of React", async () => {
  const { readFile } = await import("node:fs/promises");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));

  for (const file of PURE_MODULES) {
    const source = await readFile(join(here, file), "utf8");
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*react[^"']*["']/,
      `${file} imports React — see the note above this test`,
    );
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*use-figure-width[^"']*["']/,
      `${file} imports the width hook, which imports React`,
    );
  }
});
