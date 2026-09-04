/**
 * The venue library — settings you have filed, and what changed since.
 *
 * The History panel's own doc comment already states the problem it was built
 * for: "Booking decisions take weeks. You read a menu, ask two questions,
 * decide to wait, and come back having forgotten which two questions you
 * asked." What it actually shipped was a read-only render of the decision
 * record — a log you scroll past, with no way to open, name, revisit or remove
 * anything in it. Every piece needed for the real thing was already built and
 * none of them were connected: venue blocks persist, prep answers persist,
 * saved sets persist, and the record has a `decisions` array that nothing in
 * the application ever writes a decision into.
 *
 * A filed venue is the missing object. It is a venue block kept on purpose,
 * with the dates on which you came back to it and what the desk knew each time.
 *
 * THE ONLY MEASURE IT KEEPS IS DISCLOSURE. How much the setting has named, how
 * much it has not, and how many of your own questions have been answered. Not
 * quality, not safety, not a ranking, and not whether you should book. Those
 * are the same boundaries the desk holds everywhere else, and a library is
 * exactly where they would be easiest to lose.
 *
 * Everything is in this browser. Nothing is transmitted.
 */

import { SERVICE_LABELS, type Assessment, type ServiceClass } from "./engine";
import { newId, type VenueBlock } from "./session";

const LIBRARY_KEY = "spa-intel-library-v1";
const SCHEMA = 1;

/** Why a visit was written. */
export type VisitKind = "filed" | "revisited" | "note";

export interface FiledVisit {
  at: number;
  kind: VisitKind;
  /** Per cent of the setting the desk could resolve at that moment. */
  place: number;
  /** How many signals were still unnamed. */
  unnamed: number;
  /** How many of the reader's own consult questions had an answer written in. */
  answered: number;
  /** The reader's words. Only ever theirs. */
  note?: string;
}

export interface FiledVenue {
  id: string;
  /** The reader's name for it. Never a real facility unless they typed one. */
  name: string;
  serviceClass: ServiceClass;
  filedAt: number;
  updatedAt: number;
  /** The block as it stood at the last update, so it can be reopened. */
  block: VenueBlock;
  /** Newest last: a history reads forwards. */
  visits: FiledVisit[];
}

interface LibraryFile {
  version: number;
  venues: FiledVenue[];
}

/** How many answered prep questions there are, counting only real answers. */
export function answeredCount(block: VenueBlock): number {
  return Object.values(block.prep.answers).filter((a) => a.trim().length > 0).length;
}

function visitFrom(block: VenueBlock, a: Assessment, kind: VisitKind, note?: string): FiledVisit {
  return {
    at: Date.now(),
    kind,
    place: a.place,
    unnamed: a.failClosed.length,
    answered: answeredCount(block),
    ...(note && note.trim() ? { note: note.trim().slice(0, 600) } : {}),
  };
}

/* ------------------------------------------------------------- storage */

function store(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(): LibraryFile {
  const s = store();
  if (!s) return { version: SCHEMA, venues: [] };
  try {
    const raw = s.getItem(LIBRARY_KEY);
    if (!raw) return { version: SCHEMA, venues: [] };
    const parsed = JSON.parse(raw) as Partial<LibraryFile>;
    if (parsed.version !== SCHEMA || !Array.isArray(parsed.venues)) {
      return { version: SCHEMA, venues: [] };
    }
    return { version: SCHEMA, venues: parsed.venues.filter(isFiled) };
  } catch {
    return { version: SCHEMA, venues: [] };
  }
}

function isFiled(v: unknown): v is FiledVenue {
  if (!v || typeof v !== "object") return false;
  const f = v as Partial<FiledVenue>;
  return (
    typeof f.id === "string" &&
    typeof f.name === "string" &&
    typeof f.filedAt === "number" &&
    Array.isArray(f.visits) &&
    Boolean(f.block)
  );
}

function write(file: LibraryFile): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(LIBRARY_KEY, JSON.stringify(file));
  } catch {
    // Local-first is best effort. A browser that refuses storage still gets a
    // working desk; it just does not remember between visits.
  }
}

/** Newest activity first — the one you touched last is the one you are on. */
export function listFiled(): FiledVenue[] {
  return [...read().venues].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * File a venue, or bring an already-filed one up to date.
 *
 * Matching is by the block's own id, so re-filing the setting you are working
 * on adds a dated visit rather than a duplicate row. That is the behaviour the
 * whole object is for: the same room, six weeks apart, with the difference
 * visible.
 */
export function fileVenue(block: VenueBlock, a: Assessment, note?: string): FiledVenue[] {
  const file = read();
  const existing = file.venues.find((v) => v.block.id === block.id);
  const now = Date.now();

  if (existing) {
    existing.name = block.name;
    existing.serviceClass = a.input.serviceClass;
    existing.block = block;
    existing.updatedAt = now;
    existing.visits = [...existing.visits, visitFrom(block, a, "revisited", note)].slice(-40);
  } else {
    file.venues.push({
      id: newId(),
      name: block.name,
      serviceClass: a.input.serviceClass,
      filedAt: now,
      updatedAt: now,
      block,
      visits: [visitFrom(block, a, "filed", note)],
    });
  }
  write(file);
  return listFiled();
}

/** A dated line in the reader's own words, without re-reading the setting. */
export function addNote(id: string, note: string): FiledVenue[] {
  const text = note.trim();
  if (!text) return listFiled();
  const file = read();
  const venue = file.venues.find((v) => v.id === id);
  if (!venue) return listFiled();
  venue.updatedAt = Date.now();
  const last = venue.visits[venue.visits.length - 1];
  const entry: FiledVisit = {
    at: Date.now(),
    kind: "note",
    place: last?.place ?? 0,
    unnamed: last?.unnamed ?? 0,
    answered: last?.answered ?? 0,
    note: text.slice(0, 600),
  };
  venue.visits = [...venue.visits, entry].slice(-40);
  write(file);
  return listFiled();
}

export function removeFiled(id: string): FiledVenue[] {
  const file = read();
  file.venues = file.venues.filter((v) => v.id !== id);
  write(file);
  return listFiled();
}

export function isFiledBlock(id: string): boolean {
  return read().venues.some((v) => v.block.id === id);
}

/* --------------------------------------------------------------- words */

const DAY = 86_400_000;

export function whenWords(at: number, now = Date.now()): string {
  const days = Math.max(0, Math.round((now - at) / DAY));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 10) return `${weeks} weeks ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/**
 * What moved between two visits, in sentences.
 *
 * The one question a library exists to answer: you came back — is anything
 * different? Silence is a real answer and is stated as one, because "nothing
 * has changed since March" is often the most useful thing this desk can tell
 * somebody who has been waiting for a call back.
 */
export function changedSince(prev: FiledVisit, next: FiledVisit): string[] {
  const out: string[] = [];
  const gapDays = Math.max(0, Math.round((next.at - prev.at) / DAY));

  if (next.place !== prev.place) {
    out.push(
      next.place > prev.place
        ? `The setting resolves ${next.place - prev.place} points further than it did — ${prev.place}% to ${next.place}%.`
        : `The setting resolves ${prev.place - next.place} points LESS than it did. That normally means a field was cleared or an answer was withdrawn, not that the room changed.`,
    );
  }
  if (next.unnamed !== prev.unnamed) {
    const moved = Math.abs(next.unnamed - prev.unnamed);
    out.push(
      next.unnamed < prev.unnamed
        ? `${moved} thing${moved === 1 ? "" : "s"} that had not been named ${moved === 1 ? "has" : "have"} been named since.`
        : `${moved} more thing${moved === 1 ? "" : "s"} ${moved === 1 ? "is" : "are"} unnamed than last time.`,
    );
  }
  if (next.answered !== prev.answered) {
    const moved = Math.abs(next.answered - prev.answered);
    out.push(
      next.answered > prev.answered
        ? `${moved} more of your own questions ${moved === 1 ? "has" : "have"} an answer written against ${moved === 1 ? "it" : "them"}.`
        : `${moved} answer${moved === 1 ? "" : "s"} you had written ${moved === 1 ? "is" : "are"} no longer there.`,
    );
  }

  if (!out.length) {
    out.push(
      gapDays >= 14
        ? `Nothing has moved in ${gapDays} days. If you are waiting on a call back, that is the finding.`
        : "Nothing measurable has moved since the last time you looked.",
    );
  }
  return out;
}

/** The one line at the head of a filed venue. */
export function venueLine(venue: FiledVenue, now = Date.now()): string {
  const latest = venue.visits[venue.visits.length - 1];
  const cls =
    venue.serviceClass === "unselected"
      ? "No service class named"
      : SERVICE_LABELS[venue.serviceClass];
  if (!latest) return cls;
  const looks = venue.visits.filter((v) => v.kind !== "note").length;
  return `${cls} · ${latest.place}% of the setting resolved · ${latest.unnamed} still unnamed · filed ${whenWords(venue.filedAt, now)}, looked at ${looks} time${looks === 1 ? "" : "s"}`;
}
