import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConsultIcs,
  consultEvents,
  escapeIcsText,
  foldIcsLine,
  isDay,
  shiftDay,
  type ConsultCalendarSource,
} from "./calendar.ts";

const encoder = new TextEncoder();
const NOW = new Date("2026-09-03T10:00:00.000Z");

function source(over: Partial<ConsultCalendarSource> = {}): ConsultCalendarSource {
  return {
    blockId: "b1",
    venueName: "Aster & Co, Leith",
    date: "2026-10-14",
    open: [
      { id: "q1", group: "Who", text: "Who performs it, and what are they registered to do?", why: "" },
      { id: "q2", group: "What", text: "What device, at what setting, for my skin?", why: "" },
    ] as ConsultCalendarSource["open"],
    total: 5,
    now: NOW,
    ...over,
  };
}

/* ------------------------------------------------------------------ escaping */

test("escapes the four characters that break a TEXT value", () => {
  assert.equal(escapeIcsText("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
});

test("escapes the backslash before the escapes it introduces", () => {
  // Naive ordering yields "\\\\;" here, which imports as a literal backslash
  // followed by a terminated value.
  assert.equal(escapeIcsText("\\;"), "\\\\\\;");
});

test("drops control characters rather than emitting them", () => {
  const withControl = `ok${String.fromCharCode(7)}fine`;
  assert.equal(escapeIcsText(withControl), "okfine");
});

test("leaves colons and quotes alone, because TEXT permits them", () => {
  assert.equal(escapeIcsText('a:b"c'), 'a:b"c');
});

/* ------------------------------------------------------------------- folding */

test("leaves a short line unfolded", () => {
  assert.equal(foldIcsLine("SUMMARY:short"), "SUMMARY:short");
});

test("folds every line to 75 octets or fewer, counting bytes not characters", () => {
  const line = "DESCRIPTION:" + "é".repeat(200);
  for (const part of foldIcsLine(line).split("\r\n")) {
    assert.ok(
      encoder.encode(part).length <= 75,
      `line of ${encoder.encode(part).length} octets exceeds the limit`,
    );
  }
});

test("never splits a multi-byte character across a fold", () => {
  const folded = foldIcsLine("DESCRIPTION:" + "é".repeat(200));
  const rejoined = folded
    .split("\r\n")
    .map((part, i) => (i === 0 ? part : part.slice(1)))
    .join("");
  assert.equal(rejoined, "DESCRIPTION:" + "é".repeat(200));
  assert.ok(!folded.includes("�"));
});

test("keeps a surrogate pair intact across a fold", () => {
  const folded = foldIcsLine("DESCRIPTION:" + "🧴".repeat(60));
  const rejoined = folded
    .split("\r\n")
    .map((part, i) => (i === 0 ? part : part.slice(1)))
    .join("");
  assert.equal(rejoined, "DESCRIPTION:" + "🧴".repeat(60));
});

/* ---------------------------------------------------------------------- days */

test("recognises only a plain calendar day", () => {
  assert.equal(isDay("2026-10-14"), true);
  assert.equal(isDay("14/10/2026"), false);
  assert.equal(isDay(""), false);
  assert.equal(isDay(undefined), false);
});

test("shifts a day across a month boundary", () => {
  assert.equal(shiftDay("2026-10-31", 1), "2026-11-01");
});

test("shifts a day across a daylight-saving boundary", () => {
  // The UK clocks go back on 2026-10-25. Parsing at local midnight and adding
  // 24 hours lands on the 25th twice.
  assert.equal(shiftDay("2026-10-24", 1), "2026-10-25");
  assert.equal(shiftDay("2026-10-25", 1), "2026-10-26");
});

/* -------------------------------------------------------------------- events */

test("produces nothing without a date, so the button cannot emit an empty file", () => {
  assert.deepEqual(consultEvents(source({ date: "" })), []);
  assert.equal(buildConsultIcs(source({ date: "" })), "");
});

test("produces the consultation and the write-up, in that order", () => {
  const [consult, writeUp] = consultEvents(source());
  assert.match(consult.summary, /^Consultation — Aster & Co, Leith$/);
  assert.equal(consult.date, "2026-10-14");
  assert.match(writeUp.summary, /^Write down what they said/);
  assert.equal(writeUp.date, "2026-10-15");
});

test("lists the open questions in full rather than counting them", () => {
  const [consult] = consultEvents(source());
  assert.match(consult.description, /Still to ask \(2 of 5\)/);
  assert.match(consult.description, /01\. Who performs it/);
  assert.match(consult.description, /02\. What device/);
});

test("says so plainly when nothing is outstanding", () => {
  const [consult] = consultEvents(source({ open: [] }));
  assert.match(consult.description, /All 5 questions on the sheet are already answered\./);
  assert.doesNotMatch(consult.description, /Still to ask/);
});

test("counts what was already on record, and pluralises it", () => {
  const one = consultEvents(source({ total: 3, open: source().open.slice(0, 2) }))[1];
  assert.match(one.description, /1 question was already on record/);
  const none = consultEvents(source({ total: 2 }))[1];
  assert.match(none.description, /Nothing was on record before the appointment/);
});

test("uses UIDs that are stable for a block and date, so re-import updates", () => {
  const a = consultEvents(source());
  const b = consultEvents(source({ now: new Date("2027-01-01T00:00:00Z") }));
  assert.equal(a[0].uid, b[0].uid);
  assert.notEqual(a[0].uid, a[1].uid);
});

/* ---------------------------------------------------------------- the document */

test("emits a well-formed calendar with CRLF endings", () => {
  const ics = buildConsultIcs(source());
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.equal((ics.match(/END:VEVENT/g) ?? []).length, 2);
  assert.ok(!/\n(?<!\r\n)/.test(ics.replace(/\r\n/g, "")));
});

test("ends an all-day event on the following day, because DTEND is exclusive", () => {
  const ics = buildConsultIcs(source());
  assert.match(ics, /DTSTART;VALUE=DATE:20261014/);
  assert.match(ics, /DTEND;VALUE=DATE:20261015/);
});

test("escapes the comma in a venue name instead of truncating the summary", () => {
  const ics = buildConsultIcs(source());
  assert.match(ics, /Aster & Co\\, Leith/);
});

test("holds every content line to 75 octets", () => {
  const ics = buildConsultIcs(
    source({ venueName: "Clinique Rénové — Saint-Germain, Paris 6ᵉ arrondissement" }),
  );
  for (const line of ics.split("\r\n")) {
    assert.ok(
      encoder.encode(line).length <= 75,
      `"${line.slice(0, 40)}..." is ${encoder.encode(line).length} octets`,
    );
  }
});

test("stamps every export with the same timestamp", () => {
  const ics = buildConsultIcs(source());
  assert.equal((ics.match(/DTSTAMP:20260903T100000Z/g) ?? []).length, 2);
});
