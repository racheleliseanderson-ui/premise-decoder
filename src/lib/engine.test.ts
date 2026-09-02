/**
 * Engine tests — the contract, asserted.
 *
 * These cover the parts of the desk that make promises to the reader: an
 * unknown is displayed as an unknown, a refusal is not silence, and no chip
 * ever says one thing while the sentence beside it says another. Education
 * only, like the module under test: nothing here asserts a clinical fact.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  assess,
  claimText,
  decodeClaims,
  emptyInput,
  NO_ANSWER,
  type EvalInput,
  type Signal,
} from "./engine.ts";
import { extractFromText } from "./extract.ts";
import { stageStatuses, STAGE_WORD } from "./pipeline.ts";
import { buildComparison, type CompareItem } from "./compare.ts";

const desk = (patch: Partial<EvalInput> = {}): EvalInput => ({ ...emptyInput, ...patch });

const sig = (input: EvalInput, id: string): Signal => {
  const found = assess(input).signals.find((s) => s.id === id);
  assert.ok(found, `no signal "${id}"`);
  return found;
};

/** A desk where every signal is answered, used as the baseline for deltas. */
const RESOLVED: EvalInput = desk({
  serviceClass: "injectable",
  venue: "clinic",
  region: "us-co",
  menuLine: "Botox Cosmetic, glabella, 20 units",
  product: "Botox Cosmetic",
  performer: "Nurse practitioner injector",
  license: "NP, license #12345",
  price: "$12 per unit",
  supervision: "Medical director on site during treatment",
  sanitation: "Single-use needles, vial opened in front of me",
  afterHours: "Named licensee cell line, on call",
  consent: "Written consent provided in advance, copy kept",
  marketing: "We inject Botox Cosmetic. 20 units for the glabella.",
});

/* ------------------------------------------------ 1 · the empty desk */

test("an empty desk resolves nothing and is credited nothing", () => {
  const a = assess(emptyInput);
  assert.equal(a.place, 0);
  assert.equal(a.posture.key, "empty");
  assert.deepEqual(
    a.signals.filter((s) => s.state !== "fail-closed"),
    [],
    "every signal on an untouched desk must read fail-closed",
  );
});

test("supervision and consent earn no credit for an untouched field", () => {
  // Both used to score "partial" — 45% of weight — with nothing entered, which
  // is an unknown rounded up into a probably.
  for (const cls of ["facial", "bodywork", "injectable", "other"] as const) {
    const a = assess(desk({ serviceClass: cls }));
    assert.equal(sig(desk({ serviceClass: cls }), "supervision").state, "fail-closed");
    assert.equal(sig(desk({ serviceClass: cls }), "consent").state, "fail-closed");
    assert.equal(a.place, 0, `${cls}: an empty desk must score 0`);
  }
});

test("naming supervision or consent is what moves the score", () => {
  const base = assess(desk({ serviceClass: "facial" })).place;
  const withSupervision = assess(
    desk({ serviceClass: "facial", supervision: "Owner esthetician on site, no medical director" }),
  ).place;
  const withConsent = assess(
    desk({ serviceClass: "facial", consent: "Written consent form emailed in advance" }),
  ).place;
  assert.ok(withSupervision > base);
  assert.ok(withConsent > base);
});

/* ------------------------------------------------ 2 · refusal vs silence */

test("a refused field is marked refused and reads as a refusal", () => {
  const s = sig(desk({ sanitation: NO_ANSWER }), "sanitation");
  assert.equal(s.refused, true);
  assert.equal(s.state, "fail-closed");
  assert.match(s.reading, /refusal/i);
  assert.match(s.reading, /no answer was given/i);
});

test("every refusable field sets refused on its signal", () => {
  const pairs: [keyof EvalInput, string][] = [
    ["menuLine", "menu"],
    ["product", "product"],
    ["performer", "performer"],
    ["license", "performer"],
    ["supervision", "supervision"],
    ["sanitation", "sanitation"],
    ["afterHours", "afterhours"],
    ["consent", "consent"],
  ];
  for (const [field, id] of pairs) {
    const a = assess(desk({ [field]: NO_ANSWER }));
    const s = a.signals.find((x) => x.id === id);
    assert.ok(s, id);
    assert.equal(s.refused, true, `${field} must mark ${id} refused`);
    assert.equal(a.refused.length, 1, `${field} must appear in assessment.refused`);
  }
});

test("a refusal scores lower than the same field left silent", () => {
  const silent = assess(RESOLVED);
  const refused = assess({ ...RESOLVED, supervision: NO_ANSWER });
  const blank = assess({ ...RESOLVED, supervision: "" });
  assert.ok(refused.place < blank.place, "a refusal must cost more resolution than silence");
  assert.ok(blank.place < silent.place);
  assert.ok(refused.burden.score > blank.burden.score, "a refusal must cost more burden too");
  assert.match(refused.burden.drivers.join(" "), /asked and declined/i);
});

test("a refusal leads the next steps, ahead of ordinary gaps", () => {
  const a = assess({ ...RESOLVED, supervision: NO_ANSWER });
  assert.equal(a.nextSteps[0], sig({ ...RESOLVED, supervision: NO_ANSWER }, "supervision").ask);
});

test("a refusal blocks its pipeline stage", () => {
  const a = assess({ ...RESOLVED, sanitation: NO_ANSWER });
  const stages = stageStatuses(a, {}, null);
  const practice = stages.find((s) => s.def.id === "practice");
  assert.ok(practice);
  assert.equal(practice.state, "blocked");
  assert.equal(practice.refused, 1);
  assert.match(practice.line, /asked and declined/i);
});

test("the pipeline has no unreachable running state", () => {
  assert.ok(!("running" in STAGE_WORD));
});

/* ------------------------------------------------ 3 · promise vs place */

test("no copy on the desk is reported as no promise, never as parity", () => {
  const a = assess(desk({ venue: "day-spa", region: "us-co" }));
  assert.equal(a.gapState, "no-promise");
  assert.ok(a.gap <= 0, "the number alone would read as parity");
  assert.doesNotMatch(a.gapLine, /keeping pace/i);
  assert.match(a.gapLine, /no promise/i);
});

test("quiet copy over an unnamed room is not parity either", () => {
  // The promise number is low because there is barely any copy, not because the
  // room answered anything. gap <= 0 here, and it must not read as reassurance.
  const a = assess(desk({ menuLine: "Hydrafacial", venue: "day-spa" }));
  assert.ok(a.gap <= 0);
  assert.ok(a.failClosed.length > 0);
  assert.equal(a.gapState, "level-unresolved");
  assert.doesNotMatch(a.gapLine, /keeping pace/i);
  assert.match(a.gapLine, /still unnamed/i);
});

test("copy with nothing named behind it is reported as no place", () => {
  const a = assess(desk({ marketing: "Award-winning medical-grade glow, guaranteed." }));
  assert.equal(a.place, 0);
  assert.equal(a.gapState, "no-place");
  assert.doesNotMatch(a.gapLine, /keeping pace/i);
});

test("a measured gap still reads as a gap", () => {
  const ahead = assess(
    desk({
      serviceClass: "injectable",
      venue: "med-spa",
      menuLine: "Signature Glow Tox",
      marketing: "Permanent results, guaranteed. Painless, medical-grade, award-winning.",
    }),
  );
  assert.ok(["promise-ahead", "promise-far-ahead"].includes(ahead.gapState), ahead.gapState);
  const level = assess(RESOLVED);
  assert.equal(level.gapState, "level");
});

/* ------------------------------------------------ 4 · the performer read */

test("a person's name is not called a job title", () => {
  const s = sig(desk({ performer: "Maria Gonzalez" }), "performer");
  assert.doesNotMatch(s.reading, /job title/i);
  assert.match(s.reading, /no license evidence/i);
  assert.equal(s.state, "partial");
});

test("role words alone identify nobody", () => {
  for (const v of ["our team", "the specialist", "our staff", "esthetician"]) {
    const s = sig(desk({ performer: v }), "performer");
    assert.equal(s.state, "fail-closed", `"${v}" resolves nobody`);
    assert.match(s.reading, /names a role/i);
  }
});

test("a license token still reads as known", () => {
  const s = sig(desk({ performer: "Dana, RN injector", license: "RN #4417" }), "performer");
  assert.equal(s.state, "known");
  assert.match(s.reading, /state board/i);
});

/* ------------------------------------------------ 5 · sanitation */

test("a sharps log is a practice, and reads as one", () => {
  const s = sig(desk({ sanitation: "We keep a sharps log" }), "sanitation");
  assert.equal(s.state, "known");
  assert.doesNotMatch(s.reading, /describes appearance/i);
});

test("a blog is not a sanitation practice", () => {
  const s = sig(desk({ sanitation: "See our blog for our cleaning philosophy" }), "sanitation");
  assert.notEqual(s.state, "known");
  assert.match(s.reading, /describes appearance/i);
});

test("single-use packaging still reads as known", () => {
  const s = sig(
    desk({ sanitation: "Needles are single-use and opened in front of you" }),
    "sanitation",
  );
  assert.equal(s.state, "known");
});

/* ------------------------------------------------ 6 · menu identity */

test("one word is not a described line item", () => {
  const s = sig(desk({ menuLine: "Facial" }), "menu");
  assert.equal(s.state, "partial");
  assert.match(s.reading, /one word/i);
  assert.doesNotMatch(s.reading, /nameable line item/i);
});

/* --------------------------------------- 7 · state never fights its reading */

const CONTRADICTS_KNOWN = [
  /describes appearance more than procedure/i,
  /one word, not a described line item/i,
  /names a role, not a person/i,
  /carries no license evidence/i,
  /reads as a brand name/i,
  /is tier language, not a product/i,
  /does not say whether the supervising licensee is on site/i,
  /places oversight somewhere other than the room/i,
  /routes a possible complication to a queue/i,
  /no answer was given/i,
  /No menu line on the desk/i,
  /The performing person is unnamed/i,
  /No product or device named/i,
  /oversight unstated/i,
  /No sanitation practice described/i,
  /Nobody owns the night/i,
  /Consent process unstated/i,
  /Setting class unresolved/i,
  /No jurisdiction on the desk/i,
];

const CONTRADICTS_OPEN = [
  /is a nameable line item that can be quoted back/i,
  /Verifiable against the state board/i,
  /is a checkable name/i,
];

const SCENARIOS: [string, EvalInput][] = [
  ["empty", emptyInput],
  ["resolved", RESOLVED],
  ["one-word menu", desk({ menuLine: "Facial" })],
  ["branded menu", desk({ menuLine: "Our Signature Glow Ritual" })],
  ["named person", desk({ performer: "Maria Gonzalez" })],
  ["role only", desk({ performer: "our team" })],
  ["sharps log", desk({ sanitation: "We keep a sharps log" })],
  ["blog", desk({ sanitation: "See our blog" })],
  [
    "remote supervision",
    desk({ serviceClass: "injectable", supervision: "Medical director available by phone" }),
  ],
  [
    "unparseable supervision",
    desk({ serviceClass: "injectable", supervision: "Dr. Lee signs off" }),
  ],
  ["voicemail night", desk({ afterHours: "Leave a voicemail and we return it in business hours" })],
  [
    "refusals",
    desk({ menuLine: NO_ANSWER, performer: NO_ANSWER, sanitation: NO_ANSWER, consent: NO_ANSWER }),
  ],
  ["vague product", desk({ product: "medical grade serum" })],
  ["catalog product", desk({ product: "Botox Cosmetic" })],
];

test("no signal's state contradicts its own reading", () => {
  for (const [name, input] of SCENARIOS) {
    for (const s of assess(input).signals) {
      const bad = s.state === "known" ? CONTRADICTS_KNOWN : CONTRADICTS_OPEN;
      for (const re of bad) {
        assert.doesNotMatch(
          s.reading,
          re,
          `${name} · ${s.id} is "${s.state}" but reads: ${s.reading}`,
        );
      }
    }
  }
});

test("off-site oversight reads differently from an answer the engine cannot parse", () => {
  const off = sig(
    desk({ serviceClass: "injectable", supervision: "Medical director available by phone" }),
    "supervision",
  );
  const unparsed = sig(
    desk({ serviceClass: "injectable", supervision: "Dr. Lee signs off" }),
    "supervision",
  );
  assert.notEqual(off.reading, unparsed.reading);
  assert.match(off.reading, /off site is an answer/i);
  assert.match(unparsed.reading, /does not say whether/i);
});

/* ------------------------------------------------ 8 · the claim decoder */

test("skin specialist fires one rule, not two", () => {
  const claims = decodeClaims("Book with our skin specialist this week.");
  assert.deepEqual(
    claims.map((c) => c.category),
    ["Title without defined scope"],
  );
});

test("price-led framing still fires on an actual special", () => {
  const claims = decodeClaims("Tox special: $11 per unit, package of 3 available.");
  assert.ok(claims.some((c) => c.category === "Price-led framing"));
});

test("word boundaries keep unrelated words out of the decoder", () => {
  assert.deepEqual(decodeClaims("In this instance the room was quiet."), []);
  assert.deepEqual(decodeClaims("We offer semi-permanent brow shaping."), []);
});

test("a cross-sentence match quotes what matched, not the whole paste", () => {
  const text = "Results are lasting.\nWe use medical\ngrade product on every client here.";
  const claims = decodeClaims(text);
  assert.equal(claims.length, 1);
  assert.equal(claims[0]?.phrase, "medical grade");
});

test("a quoted phrase is never a silent truncation", () => {
  const long = `Our guarantee is simple: ${"we promise a beautiful outcome, ".repeat(12)}every time.`;
  const claims = decodeClaims(long);
  assert.ok(claims.length > 0);
  for (const c of claims) {
    assert.ok(c.phrase.length <= 180, c.phrase.length.toString());
    if (c.phrase.length === 180) assert.ok(c.phrase.endsWith("…"));
  }
});

test("promise and claims read the same text", () => {
  const a = assess(desk({ seriesPressure: "Package of 6, prepay, credits expire after a year" }));
  assert.ok(a.claims.length > 0, "series pressure produces claims");
  assert.ok(a.promise > 0, "so the promise score cannot be 0");
  assert.equal(claimText(a.input).includes("Package of 6"), true);
});

test("every hard claim survives into the next steps", () => {
  const a = assess(
    desk({
      menuLine: NO_ANSWER,
      product: NO_ANSWER,
      marketing: "Permanent results. Guaranteed, or your money back.",
    }),
  );
  const hard = a.claims.filter((c) => c.severity === "hard");
  assert.ok(hard.length >= 2);
  assert.ok(a.failClosed.length >= 5, "and there are more gaps than the list can hold");
  for (const c of hard) assert.ok(a.nextSteps.includes(c.ask), `dropped: ${c.ask}`);
  assert.equal(a.nextSteps.length, 6);
});

/* ------------------------------------------------ 9 · the extractor */

test("a sentence that names no service cannot fill the menu line", () => {
  const r = extractFromText(
    "Open Tuesday through Saturday. Free parking behind the building.",
    emptyInput,
  );
  assert.equal(
    r.proposals.filter((p) => p.field === "menuLine").length,
    0,
    "no menu line may be proposed from text that names no service",
  );
  assert.ok(r.silent.some((s) => s.field === "menuLine"));
});

test("a sentence that does name a service still fills the menu line", () => {
  const r = extractFromText("Hydrafacial with dermaplaning, 60 minutes, $250.", emptyInput);
  const menu = r.proposals.find((p) => p.field === "menuLine");
  assert.ok(menu);
  assert.match(menu.evidence, /Hydrafacial/i);
});

/* ------------------------------------------------ 10 · comparison */

const block = (id: string, name: string, input: EvalInput) => ({
  block: { id, name, input, evidence: {}, notes: "" },
  a: assess(input),
});

test("comparison exposes its columns and never a winner", () => {
  const items = [
    block("a", "Venue A", RESOLVED),
    block("b", "Venue B", desk({ menuLine: "Hydrafacial", venue: "day-spa" })),
    block("c", "Venue C", emptyInput),
  ] as unknown as CompareItem[];
  const c = buildComparison(items);

  assert.ok(!("mostResolved" in c), "no ranking primitive may survive on the readout");
  assert.equal(c.columns.length, items.length, "one column per block the view renders");
  assert.deepEqual(
    c.columns.map((col) => col.live),
    [true, true, false],
  );
  assert.deepEqual(c.dormant, ["Venue C"]);
  assert.match(c.line, /Venue C is still empty/);
  for (const row of c.rows) assert.equal(row.cells.length, items.length);
});
