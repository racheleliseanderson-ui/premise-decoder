/**
 * Cost tests — the refusal, asserted.
 *
 * The point of this module is not that it can multiply. It is that it declines
 * to produce a twelve-month number out of a quote that does not contain one,
 * and says which sentence is missing. Most of these tests are about the null.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { emptyInput, type EvalInput, NO_ANSWER } from "./engine.ts";
import { parseCost, projectCost, moneyPrep, costSignalState, isRateUnit } from "./cost.ts";

const withMoney = (price: string, series = "", marketing = ""): EvalInput => ({
  ...emptyInput,
  price,
  seriesPressure: series,
  marketing,
});

/* ------------------------------------------------------------ parsing */

test("reads a plain session price and its unit", () => {
  const s = parseCost(withMoney("$350 per session."));
  assert.equal(s.quoted, 350);
  assert.equal(s.currency, "$");
  assert.equal(s.unit, "session");
});

test("reads thousands, and does not treat the comma as a decimal", () => {
  const s = parseCost(withMoney("The full course is $3,200."));
  assert.equal(s.quoted, 3200);
});

test("counts the sessions in a package", () => {
  const s = parseCost(withMoney("Package of 6 sessions, $2,400 for the course."));
  assert.equal(s.sessions, 6);
  assert.equal(s.unit, "course");
});

test("a rate unit is recognised as a rate, not a price", () => {
  const s = parseCost(withMoney("$12 per unit."));
  assert.equal(s.unit, "unit");
  assert.equal(isRateUnit(s.unit), true);
  assert.equal(s.quantity, null);
});

test("takes the far end of a maintenance range", () => {
  // Sold as three months, lived as four. The reader is the one who finds out.
  const s = parseCost(withMoney("$600 per session.", "Maintenance every 3-4 months."));
  assert.equal(s.maintenanceIntervalMonths, 4);
});

test("converts a cancellation window in days to hours", () => {
  const s = parseCost(withMoney("$200 per session. We require 2 days notice to cancel."));
  assert.equal(s.cancellationHours, 48);
});

test("reads credit expiry in months as days", () => {
  const s = parseCost(
    withMoney("$1,200 package of 4.", "Credits expire 12 months after purchase."),
  );
  assert.equal(s.creditsExpireDays, Math.round(12 * 30.4));
});

test("a non-refundable deposit is recorded as non-refundable", () => {
  const s = parseCost(withMoney("A $100 non-refundable deposit is required to book."));
  assert.equal(s.deposit, 100);
  assert.equal(s.depositRefundable, false);
});

test("a deposit applied to the balance is recorded as refundable", () => {
  const s = parseCost(withMoney("A $100 deposit is applied to your treatment on the day."));
  assert.equal(s.depositRefundable, true);
});

test("the deposit sentence does not become the headline price", () => {
  const s = parseCost(withMoney("A $100 deposit holds the slot. Treatment is $450 per session."));
  assert.equal(s.quoted, 450);
  assert.equal(s.deposit, 100);
});

test("a from-price is marked as a floor", () => {
  const s = parseCost(withMoney("Starting at $199 per area."));
  assert.equal(s.fromPrice, true);
  assert.equal(s.unit, "area");
});

test("membership is read as a recurring charge", () => {
  const s = parseCost(withMoney("", "", "Membership is $99/month with auto-renew."));
  assert.equal(s.membershipMonthly, 99);
});

test("every parsed value carries the sentence it came from", () => {
  const s = parseCost(withMoney("$350 per session. A $100 deposit is required."));
  assert.ok(s.quotes.some((q) => q.field === "quoted" && q.text.includes("350")));
  assert.ok(s.quotes.some((q) => q.field === "deposit" && q.text.includes("deposit")));
});

test("an empty desk produces no numbers and says so", () => {
  const s = parseCost(withMoney(""));
  assert.equal(s.quoted, null);
  assert.ok(s.unknowns.length > 0);
});

test("money asked about and declined is a refusal, not silence", () => {
  const s = parseCost(withMoney(NO_ANSWER));
  assert.equal(s.refused, true);
  assert.ok(s.unknowns.some((u) => /not answered/i.test(u)));
  assert.equal(costSignalState(s).state, "fail-closed");
});

/* --------------------------------------------------------- projection */

test("a full quote produces a twelve-month number", () => {
  const s = parseCost(
    withMoney("$600 per session. Package of 3 sessions.", "Maintenance every 6 months."),
  );
  const p = projectCost(s);
  assert.equal(p.blockedBy.length, 0);
  assert.equal(p.perSession, 600);
  assert.equal(p.floor, 1800);
  assert.ok(p.yearOne !== null && p.yearOne > 1800);
  assert.ok(p.yearThree !== null && p.yearThree > p.yearOne);
});

test("no maintenance interval blocks the year and names what is missing", () => {
  const s = parseCost(withMoney("$600 per session."));
  const p = projectCost(s);
  assert.equal(p.yearOne, null);
  assert.ok(p.blockedBy.some((b) => /how often/i.test(b)));
  assert.ok(p.rows.some((r) => r.label === "Twelve months" && r.state === "unknown"));
});

test("a rate with no quantity blocks the session, not just the year", () => {
  const s = parseCost(withMoney("$12 per unit.", "Repeat every 4 months."));
  const p = projectCost(s);
  assert.equal(p.perSession, null);
  assert.equal(p.yearOne, null);
  assert.ok(p.blockedBy.some((b) => /quantity/i.test(b)));
});

test("a stated quantity resolves a rate into a session price", () => {
  const s = parseCost(withMoney("$12 per unit, typically 40 units.", "Repeat every 4 months."));
  const p = projectCost(s);
  assert.equal(p.perSession, 480);
});

test("a membership adds twelve months of charge whether or not you book", () => {
  const s = parseCost(withMoney("", "", "Membership $99 per month."));
  const p = projectCost(s);
  assert.ok(p.rows.some((r) => r.label === "Membership, one year" && r.amount === 1188));
});

test("the projection line never invents a total it does not have", () => {
  const p = projectCost(parseCost(withMoney("$600 per session.")));
  assert.ok(!/\bper year\b/i.test(p.line));
  assert.ok(/does not exist yet|not enough/i.test(p.line));
});

test("a course price is divided into a session price and the row says so", () => {
  const p = projectCost(parseCost(withMoney("$2,400 for the course of 6.")));
  const row = p.rows.find((r) => r.label === "One session");
  assert.equal(row?.amount, 400);
  assert.equal(row?.state, "derived");
});

/* -------------------------------------------------------------- prep */

test("prep asks about the terms this quote left open, and not the ones it named", () => {
  const named = parseCost(
    withMoney("$400 per session. 48 hours notice to cancel.", "Maintenance every 6 months."),
  );
  const ids = moneyPrep(named).map((q) => q.id);
  assert.ok(!ids.includes("money-cancel"));
  assert.ok(!ids.includes("money-maintenance"));

  const bare = parseCost(withMoney("$400."));
  const bareIds = moneyPrep(bare).map((q) => q.id);
  assert.ok(bareIds.includes("money-cancel"));
  assert.ok(bareIds.includes("money-maintenance"));
});

test("the one-number question is always asked", () => {
  assert.ok(
    moneyPrep(parseCost(withMoney("$400 per session. 24 hour cancellation."))).some(
      (q) => q.id === "money-total",
    ),
  );
});

test("a rate quote asks how many, in the room's own words", () => {
  const q = moneyPrep(parseCost(withMoney("$12 per unit."))).find((x) => x.id === "money-quantity");
  assert.ok(q);
  assert.ok(q.text.includes("per unit"));
});

/* ------------------------------------------------------------ signal */

test("a headline price with no structure around it is partial, not known", () => {
  assert.equal(costSignalState(parseCost(withMoney("$400."))).state, "partial");
});

test("a price with unit, interval and cancellation named reads as known", () => {
  const s = parseCost(
    withMoney("$400 per session. 48 hours notice to cancel.", "Repeat every 6 months."),
  );
  assert.equal(costSignalState(s).state, "known");
});

test("no number at all fails closed", () => {
  assert.equal(costSignalState(parseCost(withMoney("Ask us about pricing."))).state, "fail-closed");
});

test("the signal reading never calls a price high or low", () => {
  for (const price of ["$50 per session.", "$5,000 per session."]) {
    const r = costSignalState(parseCost(withMoney(price))).reading;
    assert.ok(!/expensive|cheap|affordable|good value|overpriced|reasonable/i.test(r));
  }
});
