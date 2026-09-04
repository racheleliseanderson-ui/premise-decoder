import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { emptyInput, type EvalInput } from "../engine.ts";
import { OVERSIGHT_ORDER, SERVICE_NEED, settingMapModel } from "./spa.ts";

const input = (over: Partial<EvalInput> = {}): EvalInput => ({ ...emptyInput, ...over });

describe("the setting map", () => {
  it("draws nothing, and says so, when neither fact is named", () => {
    const m = settingMapModel(input());
    assert.equal(m.empty, true);
    assert.equal(m.venue, null);
    assert.equal(m.need, null);
    assert.match(m.headline, /Name the service and the setting/);
  });

  it("places one fact and says which one is missing", () => {
    const onlyVenue = settingMapModel(input({ venue: "day-spa" }));
    assert.ok(onlyVenue.venue);
    assert.equal(onlyVenue.need, null);
    assert.match(onlyVenue.headline, /service is not/);

    const onlyService = settingMapModel(input({ serviceClass: "injectable" }));
    assert.equal(onlyService.venue, null);
    assert.ok(onlyService.need);
    assert.match(onlyService.headline, /setting is not/);
  });

  it("opens a gap when the service starts above what the setting implies", () => {
    // An injectable is a medical act; a salon suite's label implies none.
    const m = settingMapModel(input({ serviceClass: "injectable", venue: "salon-suite" }));
    assert.ok(m.gap, "the whole point of the figure is this distance");
    assert.equal(m.gap.stops, OVERSIGHT_ORDER.length - 1, "the full width of the axis");
    assert.match(m.headline, /above what the setting/);
    assert.ok(
      m.reading.some((line) => line.includes("who holds the license")),
      "a gap has to end in a question, not a verdict",
    );
  });

  it("opens no gap when the setting already implies more than the service needs", () => {
    const m = settingMapModel(input({ serviceClass: "bodywork", venue: "clinic" }));
    assert.equal(m.gap, null);
    assert.match(m.headline, /not the question that decides this booking/);
  });

  it("refuses to call two agreeing labels a name", () => {
    const m = settingMapModel(input({ serviceClass: "injectable", venue: "clinic" }));
    assert.equal(m.gap, null);
    assert.match(m.headline, /same stop/);
    assert.ok(
      m.reading.some((line) => line.includes("it is a person who is accountable")),
      "agreement between two labels is not accountability",
    );
  });

  it("draws a range, not a point, for the classes that honestly span one", () => {
    const peel = settingMapModel(input({ serviceClass: "chemical", venue: "day-spa" }));
    assert.ok(peel.need);
    assert.notEqual(
      peel.need.from,
      peel.need.to,
      "a peel spans the axis and the menu never says where",
    );

    const tox = settingMapModel(input({ serviceClass: "injectable", venue: "day-spa" }));
    assert.ok(tox.need);
    assert.equal(tox.need.from, tox.need.to, "an injectable is a medical act wherever it happens");
  });

  it("treats an unresolved setting as unresolved rather than as safe", () => {
    const m = settingMapModel(input({ serviceClass: "device", venue: "unclear" }));
    assert.equal(m.venue, null, "'unclear from marketing' is not a position on the axis");
    assert.match(m.headline, /setting is not/);
  });

  it("gives every service class a placement or an explicit refusal", () => {
    for (const [id, spec] of Object.entries(SERVICE_NEED)) {
      if (id === "unselected") {
        assert.equal(spec, null);
        continue;
      }
      assert.ok(spec, `${id} needs a placement`);
      assert.ok(OVERSIGHT_ORDER.includes(spec.from));
      assert.ok(OVERSIGHT_ORDER.includes(spec.to));
      assert.ok(
        OVERSIGHT_ORDER.indexOf(spec.from) <= OVERSIGHT_ORDER.indexOf(spec.to),
        `${id} has its range backwards`,
      );
      assert.ok(spec.why.length > 40, `${id} needs a reason, not a label`);
    }
  });

  it("keeps every mark inside the drawing box", () => {
    const m = settingMapModel(input({ serviceClass: "device", venue: "med-spa" }), 320);
    for (const s of m.stops) {
      assert.ok(s.x >= 0 && s.x <= 320, `stop ${s.id} at ${s.x} is off the canvas`);
    }
    assert.ok(m.venue && m.venue.x >= 0 && m.venue.x <= 320);
    assert.ok(m.need && m.need.x1 >= 0 && m.need.x2 <= 320);
  });
});
