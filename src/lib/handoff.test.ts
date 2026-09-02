/**
 * Handoff tests — the receiving contract, asserted.
 *
 * The bridge's only real risk is that a query string is user-editable. These
 * cover the three promises: unrecognised tokens never reach the page, an
 * arrival never fills in a venue fact, and the generated lines are questions
 * for a provider rather than instructions about a product.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  arrivalIsUseful,
  arrivalQuestions,
  arrivalSummary,
  parseArrival,
  parseArrivalFromSearch,
  returnHandoffHref,
  serializeArrival,
  type Arrival,
} from "./handoff.ts";

const link = (q: string) => parseArrivalFromSearch(q);

test("a link without a recognised sender is not an arrival", () => {
  assert.equal(link("?concern=acne&tolerance=hold"), null);
  assert.equal(link("?from=elsewhere&hv=1&concern=acne"), null);
  assert.equal(link(""), null);
});

test("a payload from a future version is refused rather than half-read", () => {
  assert.equal(link("?from=skincare&hv=2&concern=acne"), null);
});

test("unrecognised tokens are dropped, not echoed", () => {
  const a = link("?from=skincare&hv=1&concern=<script>&tolerance=molten&actives=retinoid,dragon");
  assert.ok(a);
  assert.equal(a.concern, null);
  assert.equal(a.tolerance, null);
  assert.deepEqual(a.actives, ["retinoid"]);
  // Nothing unrecognised survives into anything the page prints.
  const printed = arrivalSummary(a).join(" ");
  assert.ok(!printed.includes("script"));
  assert.ok(!printed.includes("dragon"));
  assert.ok(!printed.includes("molten"));
});

test("a repeated or overlong actives list is bounded", () => {
  const a = link(`?from=skincare&hv=1&actives=${Array(40).fill("acid").join(",")}`);
  assert.ok(a);
  assert.deepEqual(a.actives, ["acid"]);
});

test("a reassessment window outside a plausible range is dropped", () => {
  assert.equal(link("?from=skincare&hv=1&reassess=0")?.reassessDays, null);
  assert.equal(link("?from=skincare&hv=1&reassess=-30")?.reassessDays, null);
  assert.equal(link("?from=skincare&hv=1&reassess=9999")?.reassessDays, null);
  assert.equal(link("?from=skincare&hv=1&reassess=84")?.reassessDays, 84);
});

test("an oversized carried term is refused", () => {
  const long = "x".repeat(400);
  assert.equal(link(`?from=skincare&hv=1&term=${long}`)?.term, null);
  assert.equal(link("?from=skincare&hv=1&term=medical-grade")?.term, "medical-grade");
});

test("an empty payload is not worth telling anyone about", () => {
  const a = parseArrival({ from: "skincare", hv: "1" });
  assert.ok(a);
  assert.equal(arrivalIsUseful(a), false);
});

test("the summary reports an absence of actives as an absence", () => {
  const a = parseArrival({ from: "skincare", hv: "1", concern: "acne" })!;
  assert.ok(arrivalSummary(a).some((l) => /no leave-on actives/i.test(l)));
});

test("generated lines are questions for the provider, never product instructions", () => {
  const a = link(
    "?from=skincare&hv=1&concern=pigment&tolerance=hold&actives=retinoid,acid,benzoyl,hydroquinone&reassess=84&professional=1",
  )!;
  const qs = arrivalQuestions(a);
  assert.ok(qs.length >= 6);
  for (const q of qs) {
    assert.ok(q.text.trim().endsWith("?"), `not a question: ${q.text}`);
    // No line may tell the reader to stop, pause or avoid anything itself.
    assert.ok(
      !/\b(you should|you must|stop using|discontinue|avoid using)\b/i.test(q.text),
      `instructs rather than asks: ${q.text}`,
    );
  }
  // Question ids must be unique or the prep sheet's answer map collides.
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length);
});

test("no actives means no home-routine questions are invented", () => {
  const a = parseArrival({ from: "skincare", hv: "1", concern: "acne" })!;
  const ids = arrivalQuestions(a).map((q) => q.id);
  assert.ok(!ids.includes("ho-routine"));
  assert.ok(!ids.includes("ho-retinoid"));
  assert.ok(ids.includes("ho-concern"));
});

test("an arrival round-trips through storage under the same validation", () => {
  const a = link(
    "?from=skincare&hv=1&concern=acne&tolerance=watch&actives=retinoid&reassess=60&professional=1&term=medical-grade",
  )!;
  const back = parseArrival(serializeArrival({ ...a, noticed: true }))!;
  assert.deepEqual(back, { ...a, noticed: true });
});

test("the return link carries the service class and nothing about the venue", () => {
  const href = returnHandoffHref({ serviceClass: "injectable", medical: true, mode: "prep" });
  const u = new URL(href);
  assert.equal(u.searchParams.get("from"), "spa");
  assert.equal(u.searchParams.get("service"), "injectable");
  assert.equal(u.searchParams.get("medical"), "1");
  assert.equal([...u.searchParams.keys()].sort().join(","), "from,hv,medical,panel,service,stage");
});

test("an unselected service class is not sent as a fact", () => {
  const u = new URL(
    returnHandoffHref({ serviceClass: "unselected", medical: false, mode: "fast" }),
  );
  assert.equal(u.searchParams.get("service"), null);
  assert.equal(u.searchParams.get("medical"), null);
});

test("the Arrival type is fully described by what crosses the wire", () => {
  const a: Arrival = {
    from: "skincare",
    version: "1",
    concern: "acne",
    tolerance: "clear",
    actives: [],
    reassessDays: null,
    professional: false,
    term: null,
    noticed: false,
  };
  assert.deepEqual(parseArrival(serializeArrival(a)), a);
});
