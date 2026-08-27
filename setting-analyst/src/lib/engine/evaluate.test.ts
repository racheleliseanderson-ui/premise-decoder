import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMOS } from "../data/demos.ts";
import { evaluate } from "./evaluate.ts";
import { decodeClaims } from "./claims.ts";
import { extractFromPaste } from "./extract.ts";
import { whatIfAll } from "./sensitivity.ts";
import { EMPTY_INPUT } from "./types.ts";

describe("Spa Intelligence disclosure engine", () => {
  it("empty desk stays empty and does not invent identity", () => {
    const ev = evaluate(EMPTY_INPUT);
    assert.equal(ev.posture.key, "empty");
    assert.ok(ev.place < 15);
    assert.equal(ev.promise, 0);
    assert.ok(ev.failClosed.length >= 3);
  });

  it("Botox special day-spa demo fails closed on product and after-hours", () => {
    const demo = DEMOS.find((d) => d.id === "botox-special")!;
    const ev = evaluate(demo.input);
    const product = ev.signals.find((s) => s.id === "product")!;
    const after = ev.signals.find((s) => s.id === "afterhours")!;
    const performer = ev.signals.find((s) => s.id === "performer")!;
    assert.equal(product.state, "fail-closed");
    assert.equal(after.state, "fail-closed");
    assert.equal(performer.state, "partial");
    assert.ok(ev.posture.key === "unresolved" || ev.posture.key === "partial");
    assert.ok(ev.place < 50);
    assert.ok(ev.claims.some((c) => c.category === "Time pressure"));
  });

  it("named NP neuromodulator demo is largely resolved", () => {
    const demo = DEMOS.find((d) => d.id === "tox-named-good")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.posture.key, "resolved");
    assert.ok(ev.place >= 78);
    assert.equal(ev.failClosed.length, 0);
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "known");
    assert.equal(ev.signals.find((s) => s.id === "performer")!.state, "known");
    assert.equal(ev.signals.find((s) => s.id === "afterhours")!.state, "known");
  });

  it("lip-flip flash sale fails closed on unnamed product and Instagram aftercare", () => {
    const demo = DEMOS.find((d) => d.id === "lip-flip-flash")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "fail-closed");
    assert.equal(ev.signals.find((s) => s.id === "afterhours")!.state, "fail-closed");
    assert.ok(ev.claims.some((c) => c.category === "Time pressure"));
  });

  it("IPL with safe-for-everyone flags universality and unnamed device", () => {
    const demo = DEMOS.find((d) => d.id === "ipl-no-screen")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "fail-closed");
    assert.ok(ev.claims.some((c) => c.category === "Universality claim"));
    assert.equal(ev.signals.find((s) => s.id === "region")!.state, "fail-closed");
  });

  it("named VI Peel path is mostly known and does not invent candidacy", () => {
    const demo = DEMOS.find((d) => d.id === "vi-peel-named")!;
    const ev = evaluate(demo.input);
    assert.ok(ev.place >= 70);
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "known");
    assert.ok(!ev.posture.line.toLowerCase().includes("safe"));
    assert.ok(!ev.posture.line.toLowerCase().includes("recommended"));
  });

  it("proprietary exosome add-on is fail-closed as tier language", () => {
    const demo = DEMOS.find((d) => d.id === "exosome-microneedling")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "fail-closed");
    assert.ok(ev.claims.some((c) => /biologic|proprietary|signature/i.test(c.category)));
  });

  it("fat-freezing guarantee flags certainty, FDA halo, and prepay", () => {
    const demo = DEMOS.find((d) => d.id === "body-contour-guarantee")!;
    const ev = evaluate(demo.input);
    const cats = ev.claims.map((c) => c.category).join(" ");
    assert.match(cats, /Certainty/);
    assert.match(cats, /cleared|Regulatory/);
    assert.match(cats, /Commitment/);
  });

  it("signature RF keeps performer known and product fail-closed", () => {
    const demo = DEMOS.find((d) => d.id === "morpheus-signature")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.signals.find((s) => s.id === "performer")!.state, "known");
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "fail-closed");
    assert.equal(ev.signals.find((s) => s.id === "supervision")!.state, "known");
  });

  it("Kybella product is known while injector title stays partial", () => {
    const demo = DEMOS.find((d) => d.id === "kybella-scope")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "known");
    assert.equal(ev.signals.find((s) => s.id === "performer")!.state, "partial");
    assert.ok(ev.costHorizon.stated.includes("600"));
  });

  it("PDO thread facelift flags surgery synonym and permanence", () => {
    const demo = DEMOS.find((d) => d.id === "thread-facelift")!;
    const ev = evaluate(demo.input);
    const cats = ev.claims.map((c) => c.category).join(" ");
    assert.match(cats, /Surgery synonym|Permanence/);
  });

  it("HydraFacial booster flags growth-factor add-on and verbal consent", () => {
    const demo = DEMOS.find((d) => d.id === "hydrafacial-booster")!;
    const ev = evaluate(demo.input);
    assert.equal(ev.signals.find((s) => s.id === "consent")!.state, "partial");
    assert.ok(ev.claims.some((c) => /biologic|growth/i.test(c.category + c.phrase)));
  });

  it("irrelevant climate of copy does not invent a product name", () => {
    const ev = evaluate({
      ...EMPTY_INPUT,
      menuLine: "Swedish massage 60 minutes",
      serviceClass: "bodywork",
      venue: "day-spa",
      region: "us-wa",
      performer: "Licensed massage therapist",
      license: "LMT",
      marketing: "Relax. Unwind. Voted best candles.",
    });
    assert.equal(ev.signals.find((s) => s.id === "product")!.state, "fail-closed");
    assert.ok(ev.place > 0);
  });

  it("declined answers are distinct from silence", () => {
    const ev = evaluate({
      ...EMPTY_INPUT,
      menuLine: "Asked, no answer given",
      serviceClass: "injectable",
      venue: "med-spa",
    });
    assert.equal(ev.signals.find((s) => s.id === "menu")!.state, "declined");
    assert.match(ev.signals.find((s) => s.id === "menu")!.reading, /refusal|declined/i);
  });

  it("FDA registered is a harder flag than FDA cleared", () => {
    const registered = decodeClaims("FDA registered device used in our spa.");
    const cleared = decodeClaims("FDA-cleared technology.");
    assert.ok(registered.some((c) => c.severity === "hard"));
    assert.ok(cleared.some((c) => /cleared/i.test(c.category)));
  });

  it("what-if on product naming increases Place on the special demo", () => {
    const demo = DEMOS.find((d) => d.id === "botox-special")!;
    const base = evaluate(demo.input);
    const rows = whatIfAll(demo.input, base);
    const product = rows.find((r) => r.field === "product");
    assert.ok(product);
    assert.ok(product!.delta > 0);
  });

  it("paste extractor quotes a named product without guessing a license", () => {
    const { next, fills } = extractFromPaste(
      "Botox Cosmetic $13 per unit by our nurse practitioner. Written consent. Med spa in Colorado.",
      EMPTY_INPUT,
    );
    assert.equal(next.product, "Botox Cosmetic");
    assert.ok(fills.some((f) => f.key === "product"));
    assert.ok(next.serviceClass === "injectable" || next.product.includes("Botox"));
  });

  it("high-burden class in a day spa stays partial on venue, never silently medical", () => {
    const ev = evaluate({
      ...EMPTY_INPUT,
      serviceClass: "injectable",
      venue: "day-spa",
      region: "us-az",
      menuLine: "Lip filler",
      product: "Juvéderm Ultra XC",
    });
    assert.equal(ev.signals.find((s) => s.id === "venue")!.state, "partial");
    assert.match(ev.signals.find((s) => s.id === "venue")!.reading, /day spa/i);
  });
});
