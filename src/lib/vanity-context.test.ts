import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTIVE_FAMILIES,
  CONCERNS,
  NEVER_CARRIED,
  VANITY_CONTEXT_KEYS,
  VANITY_CONTEXT_VERSION,
  describeCarry,
  parseVanityContext,
  vanityContextParams,
  type VanityContext,
} from "./vanity-context.ts";

const ctx = (over: Partial<VanityContext> = {}): VanityContext => ({
  v: VANITY_CONTEXT_VERSION,
  from: "skincare",
  ...over,
});

describe("the closed lists", () => {
  it("drops anything not on them rather than echoing it back", () => {
    // A query string is user-editable. A desk that prints whatever it is handed
    // is a defacement vector wearing a personalisation feature.
    const read = parseVanityContext({
      from: "skincare",
      concern: "<script>alert(1)</script>",
      tolerance: "extremely-bad",
      actives: "retinoid,not_a_family,acid",
    });
    assert.ok(read);
    assert.equal(read.concern, undefined);
    assert.equal(read.tolerance, undefined);
    assert.deepEqual(read.actives, ["retinoid", "acid"]);
  });

  it("refuses a version that is present and wrong, and accepts an absent one", () => {
    assert.equal(parseVanityContext({ from: "spa", v: "vc-99" }), null);
    assert.ok(parseVanityContext({ from: "spa" }));
  });

  it("refuses an unknown sender outright", () => {
    assert.equal(parseVanityContext({ from: "somewhere-else" }), null);
    assert.equal(parseVanityContext({}), null);
  });

  it("clamps numbers instead of trusting them", () => {
    assert.equal(parseVanityContext({ from: "spa", reassess: "9999" })?.reassessDays, undefined);
    assert.equal(parseVanityContext({ from: "spa", reassess: "-4" })?.reassessDays, undefined);
    assert.equal(parseVanityContext({ from: "spa", reassess: "56" })?.reassessDays, 56);
  });

  it("deduplicates and caps a list", () => {
    const read = parseVanityContext({
      from: "skincare",
      actives: ACTIVE_FAMILIES.concat(ACTIVE_FAMILIES).join(","),
    });
    assert.equal(read?.actives?.length, ACTIVE_FAMILIES.length);
  });
});

describe("round trip", () => {
  it("survives serialising and parsing unchanged", () => {
    const original = ctx({
      concern: "pigment",
      also: ["texture"],
      tolerance: "hold",
      skinState: "retinised",
      actives: ["retinoid", "acid"],
      reassessDays: 84,
      routineBurden: 5,
      professional: true,
      openQuestions: 3,
    });
    const params = vanityContextParams(original);
    const back = parseVanityContext(Object.fromEntries(params));
    assert.deepEqual(back, original);
  });

  it("writes only what is set — an absent field is never defaulted in", () => {
    const params = vanityContextParams(ctx());
    assert.deepEqual([...params.keys()].sort(), ["from", "v"]);
  });

  it("every key it writes is one a receiver knows to strip", () => {
    const params = vanityContextParams(
      ctx({ concern: "acne", actives: ["acid"], openQuestions: 1, aftercareAnswered: true }),
    );
    for (const k of params.keys()) {
      assert.ok((VANITY_CONTEXT_KEYS as readonly string[]).includes(k), k);
    }
  });
});

describe("what the reader is told", () => {
  it("describes every carried field in words", () => {
    const lines = describeCarry(
      ctx({ concern: "acne", tolerance: "watch", actives: ["retinoid"], routineBurden: 4 }),
    );
    assert.ok(lines.length >= 4);
    for (const l of lines) assert.ok(l.length > 10);
  });

  it("says plainly when nothing travelled, rather than showing an empty list", () => {
    const lines = describeCarry(ctx());
    assert.equal(lines.length, 1);
    assert.match(lines[0]!, /nothing with it/i);
  });

  it("never promises to carry frequency, which is the misreported half", () => {
    const lines = describeCarry(ctx({ actives: ["retinoid"] }));
    assert.ok(lines.some((l) => /frequency does not travel/i.test(l)));
  });

  it("states what is never carried, and money is on that list", () => {
    assert.ok(NEVER_CARRIED.some((l) => /money|budget|price/i.test(l)));
    assert.ok(NEVER_CARRIED.some((l) => /product names|brands/i.test(l)));
    assert.ok(NEVER_CARRIED.some((l) => /photograph|identifier/i.test(l)));
  });
});

describe("the vocabulary itself", () => {
  it("has no duplicate tokens", () => {
    assert.equal(new Set(CONCERNS).size, CONCERNS.length);
    assert.equal(new Set(ACTIVE_FAMILIES).size, ACTIVE_FAMILIES.length);
  });

  it("carries nothing that is free text", () => {
    // The whole safety argument rests on this: every crossing value is a token
    // from a list in this file, so there is no path by which a note, a venue
    // name or a pasted sentence can reach another desk.
    const params = vanityContextParams(
      ctx({ concern: "acne", tolerance: "hold", actives: ["retinoid"], skinState: "flaking" }),
    );
    for (const [key, value] of params) {
      if (key === "v" || key === "from") continue;
      for (const part of value.split(",")) {
        assert.ok(/^[a-z0-9_-]+$/.test(part), `${key}=${part}`);
      }
    }
  });
});
