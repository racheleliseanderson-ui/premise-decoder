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

/* ------------------------------------------------------------------ */
/* Arrivals from Makeup Intelligence.                                   */
/*                                                                      */
/* That desk names the sender `via` rather than `from` and sends no      */
/* version at all. Both spellings have to work, and the closed-list      */
/* rules have to hold for the new sender exactly as they do for the old. */
/* ------------------------------------------------------------------ */

test("a makeup arrival is read from via= with no version", () => {
  const a = link("?via=makeup&concern=under-eye%20volume");
  assert.ok(a, "via=makeup must be recognised as a sender");
  assert.equal(a.from, "makeup");
  assert.equal(a.concern, "under-eye volume");
  assert.equal(a.version, "1", "an absent version normalises to the current one");
  assert.equal(arrivalIsUseful(a), true);
});

test("every concern the makeup desk can actually send is recognised", () => {
  for (const c of ["under-eye volume", "pigmentation", "fine lines"]) {
    const a = link(`?via=makeup&concern=${encodeURIComponent(c)}`);
    assert.ok(a, `${c} must parse`);
    assert.equal(a.concern, c, `${c} must survive the closed list`);
  }
});

test("a makeup arrival with no concern still parses, and is not useful on its own", () => {
  const a = link("?via=makeup");
  assert.ok(a);
  assert.equal(a.concern, null);
  assert.equal(arrivalIsUseful(a), false);
});

test("the closed list is per sender, not shared", () => {
  // `pigment` is a Skincare pathway id. It is not a word the makeup desk sends.
  const fromMakeup = link("?via=makeup&concern=pigment");
  assert.ok(fromMakeup);
  assert.equal(fromMakeup.concern, null, "a skincare id arriving from makeup is dropped");
  // And the reverse: makeup's phrasing is not a skincare pathway.
  const fromSkincare = link("?from=skincare&hv=1&concern=under-eye%20volume");
  assert.ok(fromSkincare);
  assert.equal(fromSkincare.concern, null, "a makeup phrase arriving from skincare is dropped");
});

test("an unrecognised sender is still refused, on either parameter name", () => {
  assert.equal(link("?via=elsewhere&concern=pigmentation"), null);
  assert.equal(link("?from=elsewhere&concern=pigmentation"), null);
  assert.equal(link("?via=&concern=pigmentation"), null);
});

test("a makeup arrival carrying a future version is still refused", () => {
  assert.equal(link("?via=makeup&hv=2&concern=pigmentation"), null);
});

test("hostile tokens from the new sender are dropped, not echoed", () => {
  const a = link("?via=makeup&concern=%3Cscript%3Ealert(1)%3C%2Fscript%3E");
  assert.ok(a);
  assert.equal(a.concern, null);
  assert.equal(
    arrivalSummary(a).some((l) => l.includes("script")),
    false,
    "nothing unrecognised reaches the page",
  );
});

test("a makeup arrival never reports on a routine that desk did not read", () => {
  const a = link("?via=makeup&concern=pigmentation");
  assert.ok(a);
  const summary = arrivalSummary(a);
  assert.equal(
    summary.some((l) => l.includes("No leave-on actives were detected")),
    false,
    "that sentence is a finding about an examination that never happened",
  );
  assert.ok(
    summary.some((l) => l.includes("reads makeup, not skincare")),
    "it says plainly what did not come with you",
  );
});

test("a makeup arrival writes questions for the provider, never instructions", () => {
  const a = link("?via=makeup&concern=fine%20lines");
  assert.ok(a);
  const qs = arrivalQuestions(a);
  assert.ok(qs.length > 0, "an arrival that is useful must produce something");
  for (const q of qs) {
    assert.ok(q.text.trim().endsWith("?"), `not a question: ${q.text}`);
    assert.equal(
      /you should|you must|stop using|discontinue|avoid using/i.test(q.text),
      false,
      `instruction leaked into: ${q.text}`,
    );
    assert.equal(q.group, "Carried from Makeup Intelligence");
  }
});

test("a makeup arrival does not borrow the skincare routine questions", () => {
  const a = link("?via=makeup&concern=pigmentation");
  assert.ok(a);
  const ids = arrivalQuestions(a).map((q) => q.id);
  for (const id of ["ho-routine", "ho-writing", "ho-retinoid", "ho-acid", "ho-tolerance"]) {
    assert.equal(ids.includes(id), false, `${id} assumes a routine that did not travel`);
  }
});

test("the maintenance question is always asked of a makeup arrival", () => {
  // The first session is the number on the menu; the schedule is the one that
  // decides affordability. It has to be asked even when no concern travelled.
  const bare = link("?via=makeup&term=medical-grade%20resurfacing");
  assert.ok(bare);
  assert.ok(arrivalQuestions(bare).some((q) => q.id === "ho-mk-maintenance"));
});

test("a makeup arrival round-trips through serialize and parse", () => {
  const a = link("?via=makeup&concern=pigmentation");
  assert.ok(a);
  const again = parseArrival(serializeArrival(a));
  assert.ok(again, "a stored makeup arrival must re-validate on the way back in");
  assert.equal(again.from, "makeup");
  assert.equal(again.concern, "pigmentation");
});

test("skincare arrivals are completely unchanged by the new sender", () => {
  const a = link("?from=skincare&hv=1&concern=acne&tolerance=hold&actives=retinoid,acid&reassess=28");
  assert.ok(a);
  assert.equal(a.from, "skincare");
  assert.equal(a.concern, "acne");
  assert.equal(a.tolerance, "hold");
  assert.deepEqual(a.actives, ["retinoid", "acid"]);
  assert.equal(a.reassessDays, 28);
  assert.ok(arrivalQuestions(a).some((q) => q.id === "ho-retinoid"));
  assert.ok(arrivalSummary(a).some((l) => l.includes("Leave-on actives detected")));
});
