/**
 * The consultation, as a date you will actually see again.
 *
 * This desk's whole loop depends on a second visit. You decode a premise, you
 * build a question sheet, you go into the room - and then the part that makes
 * any of it worth having is coming back and writing down what the provider
 * actually said, in their words, against the question it answers. Until now
 * nothing in the app made that second visit happen. The sheet sat in a tab, the
 * appointment sat in a calendar, and the two never met.
 *
 * So: two all-day events. The consultation, carrying the questions that are
 * still unanswered, so the sheet is legible from a phone lock screen without
 * opening anything. And the day after, carrying one instruction - write down
 * what they said, while you still remember the wording.
 *
 * Two things this file is fussy about, because they are the two that actually
 * break calendar imports:
 *
 *   1. Lines are folded at 75 OCTETS, counted in UTF-8 bytes rather than
 *      characters, and never split mid-character. Venue names carry accents and
 *      the question text carries curly quotes and en dashes; a naive
 *      slice(0, 75) is exactly how you get a file that imports as mojibake.
 *   2. Every TEXT value is escaped - backslash, semicolon, comma, newline.
 *      Venue names and question wording are user-facing strings with commas all
 *      through them, and an unescaped comma silently terminates the value and
 *      swallows the rest of the description.
 *
 * Nothing is uploaded. The file is built here and saved by the browser, which
 * is the same promise every other export on this desk makes.
 *
 * Nothing here is medical guidance: the events carry questions to ask and a
 * reminder to write the answers down, never an instruction about a treatment.
 */

import type { PrepQuestion } from "./engine";

/** RFC 5545 section 3.1 - no content line may exceed 75 octets. */
const MAX_OCTETS = 75;

const DAY_MS = 86_400_000;

export const ICS_PRODID = "-//Vanity or Vice//Spa Intelligence consultation//EN";

/**
 * UID domain. Not a real host - a UID only has to be globally unique and
 * stable, and nothing on this desk should imply a server exists.
 */
export const ICS_UID_DOMAIN = "spa-intelligence.local";

const encoder = new TextEncoder();

/**
 * Characters with no legal representation in a content line.
 *
 * Built from a string rather than written as a literal so the source file
 * itself stays free of control characters.
 */
const CONTROL_CHARS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g",
);

function octets(value: string): number {
  return encoder.encode(value).length;
}

/**
 * Escape a TEXT value (RFC 5545 section 3.3.11).
 *
 * Backslash first, or the escapes introduced below get double-escaped. Colons
 * and quotes are legal in TEXT and are left alone. Control characters are
 * dropped rather than escaped: there is no representation for them, and one
 * stray character invalidates the whole line.
 */
export function escapeIcsText(value: unknown): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(CONTROL_CHARS, "");
}

/**
 * Fold one content line, continuations prefixed with a single space.
 *
 * The leading space on a continuation counts toward that line's 75 octets, so
 * continuations carry one octet less of payload than the first line does. The
 * loop iterates by code point, so a surrogate pair is never split in half.
 */
export function foldIcsLine(line: string): string {
  if (octets(line) <= MAX_OCTETS) return line;

  const parts: string[] = [];
  let current = "";
  let used = 0;
  let limit = MAX_OCTETS;

  for (const ch of line) {
    const size = octets(ch);
    if (used + size > limit) {
      parts.push(current);
      current = "";
      used = 0;
      limit = MAX_OCTETS - 1;
    }
    current += ch;
    used += size;
  }
  parts.push(current);

  return parts.map((part, i) => (i === 0 ? part : ` ${part}`)).join("\r\n");
}

/** Is this a plain calendar day? */
export function isDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** `YYYY-MM-DD` to the DATE value form `YYYYMMDD`. */
function icsDate(day: string): string {
  return day.replace(/-/g, "");
}

/**
 * Shift a plain day by whole days, staying in plain-day space.
 *
 * Parsed at midday UTC deliberately: parsing at local midnight and adding
 * twenty-four hours lands on the wrong date across a daylight-saving boundary
 * in half the world, which is exactly the sort of bug that shows up once a year
 * and is never reproducible.
 */
export function shiftDay(day: string, days: number): string {
  const t = Date.parse(`${day}T12:00:00Z`);
  if (!Number.isFinite(t)) return day;
  return new Date(t + days * DAY_MS).toISOString().slice(0, 10);
}

/** UTC timestamp form, `YYYYMMDDTHHMMSSZ`. */
export function icsTimestamp(at: Date = new Date()): string {
  return at.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type ConsultEvent = {
  /** Stable across exports, so re-importing updates rather than duplicates. */
  uid: string;
  /** All-day date, YYYY-MM-DD. */
  date: string;
  summary: string;
  description: string;
};

export type ConsultCalendarSource = {
  /** Identifies the venue block, so the UIDs stay stable per block. */
  blockId: string;
  /** Whatever the reader called this place. May be empty. */
  venueName: string;
  /** The appointment, as a plain day. */
  date: string;
  /** Questions with nothing written against them yet. */
  open: PrepQuestion[];
  /** How many questions the sheet holds in total. */
  total: number;
  now?: Date;
};

/** A venue with no name is still a venue. */
function venueLabel(name: string): string {
  const trimmed = name.trim();
  return trimmed === "" ? "this venue" : trimmed;
}

/**
 * The two events.
 *
 * The open questions are listed in full rather than counted. A calendar entry
 * reading "5 questions outstanding" is a number you cannot act on while
 * standing at a reception desk; the questions themselves are the entire reason
 * for carrying the appointment around.
 */
export function consultEvents(source: ConsultCalendarSource): ConsultEvent[] {
  if (!isDay(source.date)) return [];

  const label = venueLabel(source.venueName);
  const open = source.open.length;
  const answered = Math.max(0, source.total - open);

  const questionLines = open
    ? source.open.map((q, i) => `${String(i + 1).padStart(2, "0")}. ${q.text}`)
    : ["Every question on the sheet already has wording against it. Ask about anything that has changed since."];

  const consultation: ConsultEvent = {
    uid: `consult-${source.blockId}-${source.date}@${ICS_UID_DOMAIN}`,
    date: source.date,
    summary: `Consultation — ${label}`,
    description: [
      open
        ? `Still to ask (${open} of ${source.total}):`
        : `All ${source.total} questions on the sheet are already answered.`,
      ...questionLines,
      "",
      "Write the answers in their words, not yours. A paraphrase is the thing you will not be able to check later.",
      "Education only. This sheet records what was said. It does not assess candidacy or clear you for any service.",
    ].join("\n"),
  };

  const writeUp: ConsultEvent = {
    uid: `writeup-${source.blockId}-${source.date}@${ICS_UID_DOMAIN}`,
    date: shiftDay(source.date, 1),
    summary: `Write down what they said — ${label}`,
    description: [
      "Open Spa Intelligence and put the wording against the questions while you still remember it.",
      answered > 0
        ? `${answered} question${answered === 1 ? " was" : "s were"} already on record before the appointment.`
        : "Nothing was on record before the appointment, so everything useful is still only in your head.",
      "",
      "If they would not answer something, that is an answer. Write that down too.",
    ].join("\n"),
  };

  return [consultation, writeUp];
}

/** Serialise events to an RFC 5545 document with CRLF line endings. */
export function buildIcs(events: ConsultEvent[], now: Date = new Date()): string {
  const stamp = icsTimestamp(now);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${ICS_PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcsText(event.uid)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(event.date)}`,
      // DTEND is exclusive for DATE values, so a one-day event ends the next day.
      `DTEND;VALUE=DATE:${icsDate(shiftDay(event.date, 1))}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      "CATEGORIES:Spa Intelligence,Consultation",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

/** Build the file for one venue block. Returns "" when there is no date yet. */
export function buildConsultIcs(source: ConsultCalendarSource): string {
  const events = consultEvents(source);
  if (!events.length) return "";
  return buildIcs(events, source.now);
}

/** Hand the file to the browser. No network, nothing uploaded. */
export function downloadConsultIcs(source: ConsultCalendarSource): boolean {
  const text = buildConsultIcs(source);
  if (text === "" || typeof document === "undefined") return false;

  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consultation-${source.date}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
