import assert from "node:assert/strict";
import { test } from "node:test";
import { matchRegister } from "./register.ts";

/*
 * The whole risk in this feature is the false positive. Attaching a published
 * verdict to a claim a venue never made would be exactly the move this
 * publication complains about, so the tests are weighted towards silence.
 */

test("a claim the Register covers is matched and quoted back", () => {
  const hits = matchRegister(
    "Our signature facial finishes with exosomes to rebuild the skin barrier overnight.",
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.entry.slug, "topical-exosome-skin-rejuvenation");
  assert.equal(hits[0]?.entry.position, "Thinly supported");
  assert.ok(hits[0]?.matched.includes("exosomes"), "the reader should see their own sentence back");
});

test("naming an ingredient without claiming anything for it matches nothing", () => {
  assert.deepEqual(matchRegister("Add-ons available: exosomes, PDRN, LED."), []);
  assert.deepEqual(matchRegister("We stock polynucleotides."), []);
});

test("subject and assertion have to land in the same sentence", () => {
  const split = matchRegister(
    "We offer exosome add-ons. Our microneedling protocol has proven results at eight weeks.",
  );
  assert.deepEqual(split, [], "results promised for the needling is not results promised for the vial");
});

test("the medical-grade claim is the phrase itself", () => {
  const hits = matchRegister("We only use medical-grade skincare in the treatment room.");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.entry.slug, "medical-grade-skincare");
});

test("a device claim borrowing clinic authority is caught", () => {
  const hits = matchRegister("Take home an LED mask with the same wavelengths we use in clinic.");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.entry.slug, "at-home-led-mask-dose");
});

test("blue light from the sun is not blue light from a screen", () => {
  assert.deepEqual(
    matchRegister("Mineral SPF with iron oxides for visible and blue light from the sun."),
    [],
  );
  assert.equal(
    matchRegister("Protects against blue light from your phone and laptop screens.").length,
    1,
  );
});

test("two different claims in one page both surface, once each", () => {
  const hits = matchRegister(
    "Exosomes rebuild collagen from within. We also finish with polynucleotides to regenerate the under-eye. Exosomes rebuild collagen from within.",
  );
  assert.equal(hits.length, 2);
  assert.deepEqual(
    hits.map((h) => h.entry.slug).sort(),
    ["polynucleotide-injections-skin-regeneration", "topical-exosome-skin-rejuvenation"],
  );
});

test("ordinary spa copy makes no claims the Register covers", () => {
  assert.deepEqual(
    matchRegister(
      "Sixty minutes of Swedish massage in a quiet room, followed by tea. Free parking behind the building.",
    ),
    [],
  );
  assert.deepEqual(matchRegister(""), []);
  assert.deepEqual(matchRegister("   "), []);
});

test("every entry carries the fields the desk renders", () => {
  const hits = matchRegister(
    "Exosomes rebuild skin. Topical NAD+ serum applied after. Medical-grade only. Collagen drinks proven to firm.",
  );
  assert.ok(hits.length >= 3);
  for (const hit of hits) {
    assert.ok(hit.entry.url.startsWith("https://vanityvice.blog/register/"));
    assert.ok(hit.entry.verdict.length > 20);
    assert.ok(hit.entry.position.length > 3);
    assert.match(hit.entry.lastSearched, /^\d{4}-\d{2}-\d{2}$/);
  }
});
