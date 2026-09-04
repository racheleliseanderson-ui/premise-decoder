import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CARRY_FORGET_DAYS,
  CARRY_STALE_DAYS,
  CARRY_VERSION,
  carryContext,
  carryIsEmpty,
  carryRows,
  carrySummary,
  emptyCarry,
  forgetCarryField,
  mergeCarry,
  reviveCarry,
} from "./vanity-carry.ts";
import { VANITY_CONTEXT_VERSION, type VanityContext } from "./vanity-context.ts";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 4);

const fromSkincare: VanityContext = {
  v: VANITY_CONTEXT_VERSION,
  from: "skincare",
  concern: "pigment",
  tolerance: "watch",
  actives: ["retinoid", "vitamin_c"],
  reassessDays: 84,
  routineBurden: 5,
};

const fromMakeup: VanityContext = {
  v: VANITY_CONTEXT_VERSION,
  from: "makeup",
  cosmeticGoal: ["eight-hour", "luminous"],
  prepBurden: 3,
};

test("an empty carry holds nothing and says so", () => {
  const carry = emptyCarry();
  assert.equal(carryIsEmpty(carry), true);
  assert.equal(carryContext(carry, "spa"), null);
  assert.deepEqual(carryRows(carry), []);
  assert.match(carrySummary(carry), /Nothing is travelling/);
});

test("merging keeps every desk's contribution", () => {
  const carry = mergeCarry(mergeCarry(emptyCarry(), fromSkincare, NOW), fromMakeup, NOW);
  const ctx = carryContext(carry, "spa");
  assert.ok(ctx);
  assert.equal(ctx.concern, "pigment");
  assert.deepEqual(ctx.actives, ["retinoid", "vitamin_c"]);
  assert.deepEqual(ctx.cosmeticGoal, ["eight-hour", "luminous"]);
  assert.equal(ctx.prepBurden, 3);
  // Addressed from the reading desk, not from whoever wrote it last.
  assert.equal(ctx.from, "spa");
});

test("silence is not an instruction to forget", () => {
  const carry = mergeCarry(mergeCarry(emptyCarry(), fromSkincare, NOW), fromMakeup, NOW);
  const ctx = carryContext(carry, "makeup");
  assert.equal(ctx?.tolerance, "watch", "makeup said nothing about tolerance; it should survive");
});

test("every field records the desk that said it", () => {
  const carry = mergeCarry(mergeCarry(emptyCarry(), fromSkincare, NOW), fromMakeup, NOW);
  const rows = carryRows(carry, NOW);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  assert.equal(byKey.get("concern")?.from, "skincare");
  assert.equal(byKey.get("concern")?.fromLabel, "Skincare Intelligence");
  assert.equal(byKey.get("cosmeticGoal")?.from, "makeup");
  assert.equal(byKey.get("concern")?.ageLabel, "today");
});

test("a later desk overwrites the field it speaks to, and only that field", () => {
  const first = mergeCarry(emptyCarry(), fromSkincare, NOW);
  const later: VanityContext = {
    v: VANITY_CONTEXT_VERSION,
    from: "spa",
    tolerance: "hold",
    serviceClass: "device",
  };
  const carry = mergeCarry(first, later, NOW + DAY);
  const ctx = carryContext(carry, "skincare");
  assert.equal(ctx?.tolerance, "hold");
  assert.equal(ctx?.concern, "pigment");
  const rows = carryRows(carry, NOW + DAY);
  assert.equal(rows.find((r) => r.key === "tolerance")?.from, "spa");
  assert.equal(rows.find((r) => r.key === "concern")?.from, "skincare");
});

test("a field the reader drops does not come back", () => {
  const carry = forgetCarryField(mergeCarry(emptyCarry(), fromSkincare, NOW), "actives");
  assert.equal(carryContext(carry, "spa")?.actives, undefined);
  assert.equal(carryContext(carry, "spa")?.concern, "pigment");
});

test("old fields are marked stale, older ones are dropped", () => {
  const carry = mergeCarry(emptyCarry(), fromSkincare, NOW);

  const fresh = carryRows(carry, NOW + (CARRY_STALE_DAYS - 1) * DAY);
  assert.equal(
    fresh.every((r) => !r.stale),
    true,
  );

  const aging = carryRows(carry, NOW + (CARRY_STALE_DAYS + 1) * DAY);
  assert.equal(
    aging.every((r) => r.stale),
    true,
  );
  assert.match(carrySummary(carry, NOW + (CARRY_STALE_DAYS + 1) * DAY), /worth confirming/);

  const revived = reviveCarry(carry, NOW + (CARRY_FORGET_DAYS + 1) * DAY);
  assert.equal(carryIsEmpty(revived), true, "nothing in this vocabulary survives a season");
});

test("a hand-edited record cannot smuggle a value past the wire parser", () => {
  const carry = reviveCarry(
    {
      v: CARRY_VERSION,
      params: { concern: "<script>", tolerance: "watch" },
      sources: {
        concern: { from: "skincare", at: NOW },
        tolerance: { from: "skincare", at: NOW },
      },
    },
    NOW,
  );
  const ctx = carryContext(carry, "spa");
  assert.equal(ctx?.concern, undefined, "an unrecognised token is dropped, never echoed");
  assert.equal(ctx?.tolerance, "watch");
});

test("a corrupt or foreign record reads as empty rather than throwing", () => {
  assert.equal(carryIsEmpty(reviveCarry(null, NOW)), true);
  assert.equal(carryIsEmpty(reviveCarry("nonsense", NOW)), true);
  assert.equal(carryIsEmpty(reviveCarry({ v: "vcarry-99", params: {} }, NOW)), true);
  assert.equal(
    carryIsEmpty(reviveCarry({ v: CARRY_VERSION, params: { concern: "pigment" } }, NOW)),
    true,
    "a value with no source is a value that cannot attribute itself",
  );
});

test("a value with a source but no clock is refused", () => {
  const carry = reviveCarry(
    {
      v: CARRY_VERSION,
      params: { concern: "pigment" },
      sources: { concern: { from: "skincare" } },
    },
    NOW,
  );
  assert.equal(carryIsEmpty(carry), true);
});
