/**
 * Claim decoder tests.
 *
 * The old decoder had one job — does this pattern appear — and one way to be
 * wrong. This one makes four claims about every sentence it reads, so most of
 * what is asserted here is that it does not overstate any of them: it quotes
 * verbatim, it counts occurrences rather than inventing them, and it never
 * calls a room dishonest.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { decodeClaims, summariseClaims, CLAIM_CATEGORIES } from "./claims.ts";

test("quiet copy produces nothing, and says so without reassuring", () => {
  // Long enough to clear the "not enough copy to read" branch, so this is
  // testing the quiet-but-unresolved sentence rather than the short-paste one.
  const text =
    "The treatment takes about forty minutes and is performed in our third-floor room by the practitioner you booked with.";
  const claims = decodeClaims(text);
  assert.deepEqual(claims, []);
  const s = summariseClaims(claims, text);
  assert.match(s.line, /not an endorsement/i);
});

test("semi-permanent is not permanent", () => {
  assert.deepEqual(decodeClaims("We offer semi-permanent brow shaping."), []);
});

test("every occurrence of a pattern is found, not the first", () => {
  const text =
    "Book today only. Our May special expires Friday. Limited spots left for this week only.";
  const pressure = decodeClaims(text).filter((c) => c.category === "Time pressure");
  assert.ok(pressure.length >= 2, `expected several, got ${pressure.length}`);
  assert.ok(pressure[0] && pressure[0].count >= 2);
});

test("identical sentences are one finding, not two", () => {
  const text = "Book today only. Book today only.";
  const pressure = decodeClaims(text).filter((c) => c.category === "Time pressure");
  assert.equal(pressure.length, 1);
});

test("a phrase is quoted verbatim from the text", () => {
  const text = "Our master injector will see you.";
  const c = decodeClaims(text)[0];
  assert.ok(c);
  assert.ok(text.includes(c.phrase.replace(/…$/, "")));
});

test("a quoted phrase is never a silent truncation", () => {
  const long = `Our guarantee is simple: ${"we promise a beautiful outcome, ".repeat(12)}every time.`;
  for (const c of decodeClaims(long)) {
    assert.ok(c.phrase.length <= 180);
    if (c.phrase.length === 180) assert.ok(c.phrase.endsWith("…"));
  }
});

test("a cross-sentence match quotes what matched, not the whole paste", () => {
  const text = "Results are lasting.\nWe use medical\ngrade product on every client here.";
  const claims = decodeClaims(text);
  assert.equal(claims.length, 1);
  assert.equal(claims[0]?.phrase, "medical grade");
});

/* ------------------------------------------------------- the new axes */

test("a guarantee is unfalsifiable; FDA approval is measurable", () => {
  const g = decodeClaims("Results guaranteed.")[0];
  assert.equal(g?.measurability, "unfalsifiable");
  const f = decodeClaims("Our device is FDA-approved.")[0];
  assert.equal(f?.measurability, "measurable");
});

test("registered and approved are different findings", () => {
  const reg = decodeClaims("Our facility is FDA-registered.");
  assert.ok(reg.some((c) => /one step further/i.test(c.category)));
});

test("every finding names what would substantiate it", () => {
  for (const c of decodeClaims(BIG)) {
    assert.ok(c.substantiation.length > 0, c.category);
    for (const line of c.substantiation) assert.ok(line.length > 8);
  }
});

test("persuasion words are quoted back, and only when present", () => {
  const warm = decodeClaims("You deserve to feel radiant and confident.")[0];
  assert.ok(warm?.emotionalWork);
  assert.match(warm.emotionalWork ?? "", /radiant/);
  const plain = decodeClaims("Membership is $99 per month.")[0];
  assert.equal(plain?.emotionalWork, null);
});

test("affective copy is classified as being about you, not about the service", () => {
  const c = decodeClaims("Become the best version of yourself.")[0];
  assert.equal(c?.kind, "affective");
  assert.equal(c?.measurability, "unfalsifiable");
});

test("hard flags sort above notes", () => {
  const claims = decodeClaims(BIG);
  const firstNote = claims.findIndex((c) => c.severity === "note");
  const lastHard = claims.map((c) => c.severity).lastIndexOf("hard");
  if (firstNote >= 0 && lastHard >= 0) assert.ok(lastHard < firstNote);
});

test("no finding accuses anyone of lying", () => {
  for (const c of decodeClaims(BIG)) {
    const all = `${c.category} ${c.hides} ${c.ask} ${c.substantiation.join(" ")}`;
    assert.ok(!/\b(lie|lying|liar|fraud|scam|dishonest|deceit)\b/i.test(all), c.category);
  }
});

/* --------------------------------------------------------- the summary */

const BIG = `
Our award-winning medical spa uses only medical-grade, FDA-approved technology.
Results guaranteed — permanent, painless, with no downtime whatsoever.
Our master injector has years of experience and thousands of treatments behind her.
Book today only: 20% off our signature protocol, from $199 per area.
Memberships from $99/month with auto-renew, credits expire after 12 months.
Financing as low as $49 a month. Free consultation.
You deserve to feel radiant. Become the best version of yourself.
Clinically proven to stimulate collagen, with up to 80% improvement.
`;

test("a dense passage is summarised by what it is doing, not by a score", () => {
  const claims = decodeClaims(BIG);
  const s = summariseClaims(claims, BIG);
  assert.ok(s.total > 8);
  assert.ok(s.patterns > 6);
  assert.ok(s.byKind.length > 3);
  assert.equal(
    s.byMeasurability.measurable + s.byMeasurability.vague + s.byMeasurability.unfalsifiable,
    s.total,
  );
  assert.ok(s.line.length > 30);
});

test("the summary counts what is checkable, because that is the reader's list", () => {
  const claims = decodeClaims(BIG);
  const s = summariseClaims(claims, BIG);
  assert.equal(s.checkable, s.byMeasurability.measurable);
  assert.ok(s.checkable > 0);
});

test("a short paste is told it is short rather than told it is clean", () => {
  const s = summariseClaims([], "Facials");
  assert.match(s.line, /not enough copy/i);
});

test("the category reference is complete and unique", () => {
  const ids = CLAIM_CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(CLAIM_CATEGORIES.length >= 25);
  for (const c of CLAIM_CATEGORIES) assert.ok(c.hides.length > 20);
});
