/**
 * Arrivals from, and departures to, the rest of the Vanity fleet.
 *
 * Skincare Intelligence sends a small, versioned, human-readable context on the
 * query string. Until now this desk resolved its panel from the path and threw
 * the rest away, so a link that said "take this into a procedure conversation"
 * landed on an empty form. That was the one honest failure in the bridge, and
 * this module is the receiving half.
 *
 * Three rules govern what happens to an arrival:
 *
 *   1. Nothing arriving is trusted as fact about a person. Every value is
 *      checked against a closed list; anything unrecognised is dropped without
 *      comment rather than echoed back. A query string is user-editable, and a
 *      desk that prints whatever is in the address bar is a defacement vector.
 *   2. An arrival never fills an answer. It writes QUESTIONS. This desk's whole
 *      claim is that it reports what was named and what was not; inventing a
 *      venue's disclosures from another app's session would break that outright.
 *      The single exception is the Claim Decoder's marketing line, which is a
 *      sentence the reader chose to carry across, and it is marked as such.
 *   3. What arrived is shown, in full, in words, before it is used.
 *
 * Nothing here is medical guidance. Every generated line is a question for the
 * provider, never an instruction about a product.
 */

import type { PrepQuestion } from "./engine";
import type { Mode } from "./modes";
import { VANITY } from "./fleet.ts";

export const HANDOFF_VERSION = "1";

/** Skincare Intelligence's ten pathway ids, and the words for them here. */
const CONCERN_LABELS: Record<string, string> = {
  pigment: "uneven pigment",
  acne: "acne",
  aging: "lines and laxity",
  texture: "texture",
  dryness: "dryness",
  oil: "oil control",
  oiliness: "oil control",
  sensitivity: "reactivity",
  barrier: "a compromised barrier",
  scarring: "scarring",
  redness: "persistent redness",
  other: "an unnamed primary job",
};

/** Tolerance states, and what each one means for booking anything. */
const TOLERANCE_LABELS: Record<string, string> = {
  clear: "settled",
  watch: "watched",
  hold: "on hold",
  verify: "unverified",
};

/** Active families that survive the crossing, and how to say them out loud. */
const FAMILY_LABELS: Record<string, string> = {
  retinoid: "a topical retinoid",
  acid: "a leave-on acid (AHA or BHA)",
  vitamin_c: "vitamin C",
  benzoyl: "benzoyl peroxide",
  hydroquinone: "hydroquinone",
  azelaic: "azelaic acid",
  exfoliant_other: "another leave-on exfoliant",
  brightener: "a brightening agent",
};

export interface Arrival {
  /** Which desk sent this. Only "skincare" is recognised today. */
  from: "skincare";
  version: string;
  /** Primary job id, when it was one this desk knows how to say. */
  concern: string | null;
  /** Tolerance state id, when recognised. */
  tolerance: string | null;
  /** Leave-on active families, filtered to the known set, order preserved. */
  actives: string[];
  /** Days until the sending desk reassesses that routine. 1–365 or null. */
  reassessDays: number | null;
  /** Whether a professional stop is already on that desk's record. */
  professional: boolean;
  /** A marketing term carried over for the Claim Decoder. */
  term: string | null;
  /**
   * Whether the reader has already seen and dismissed the arrival notice.
   * The context itself outlives the notice: the questions it generated stay on
   * the consult sheet, so an answer written into one of them still has its
   * question printed next to it a week later.
   */
  noticed: boolean;
}

const asString = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Read an arrival off a parsed search object.
 *
 * Returns null unless the payload names a sender and a version this desk
 * understands. A partial payload is fine — every field is independently
 * optional, and an unrecognised token is simply absent rather than an error.
 */
export function parseArrival(search: Record<string, unknown>): Arrival | null {
  if (asString(search["from"]) !== "skincare") return null;
  const version = asString(search["hv"]);
  if (version !== HANDOFF_VERSION) return null;

  const concern = asString(search["concern"]);
  const tolerance = asString(search["tolerance"]);
  const reassessRaw = Number.parseInt(asString(search["reassess"]), 10);
  const term = asString(search["term"]);

  return {
    from: "skincare",
    version,
    concern: CONCERN_LABELS[concern] ? concern : null,
    tolerance: TOLERANCE_LABELS[tolerance] ? tolerance : null,
    actives: asString(search["actives"])
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s in FAMILY_LABELS)
      // A hand-edited link could repeat a family forty times.
      .filter((s, i, all) => all.indexOf(s) === i)
      .slice(0, 8),
    reassessDays:
      Number.isFinite(reassessRaw) && reassessRaw > 0 && reassessRaw <= 365 ? reassessRaw : null,
    professional: asString(search["professional"]) === "1",
    // Long enough for a marketing sentence, short enough not to be a payload.
    term: term && term.length <= 160 ? term : null,
    noticed: asString(search["noticed"]) === "1",
  };
}

/**
 * The token form again, for persistence. Round-trips through `parseArrival`,
 * so a stored arrival is validated on the way back in exactly as a link is.
 */
export function serializeArrival(a: Arrival): Record<string, string> {
  const out: Record<string, string> = { from: a.from, hv: a.version };
  if (a.concern) out["concern"] = a.concern;
  if (a.tolerance) out["tolerance"] = a.tolerance;
  if (a.actives.length) out["actives"] = a.actives.join(",");
  if (a.reassessDays) out["reassess"] = String(a.reassessDays);
  if (a.professional) out["professional"] = "1";
  if (a.term) out["term"] = a.term;
  if (a.noticed) out["noticed"] = "1";
  return out;
}

/** Read an arrival off a raw query string. Same rules. */
export function parseArrivalFromSearch(raw: string): Arrival | null {
  if (!raw) return null;
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const obj: Record<string, string> = {};
  for (const [k, v] of params) obj[k] = v;
  return parseArrival(obj);
}

/** Is there anything here worth telling the reader about? */
export function arrivalIsUseful(a: Arrival): boolean {
  return Boolean(
    a.concern || a.tolerance || a.actives.length || a.reassessDays || a.professional || a.term,
  );
}

const list = (items: string[]): string =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const activeLabel = (id: string): string => FAMILY_LABELS[id] ?? id;
export const concernLabel = (id: string): string => CONCERN_LABELS[id] ?? id;
export const toleranceLabel = (id: string): string => TOLERANCE_LABELS[id] ?? id;

/**
 * What actually came across, in a sentence, before anything is done with it.
 * Deliberately plain: the reader should be able to check it against the URL.
 */
export function arrivalSummary(a: Arrival): string[] {
  const lines: string[] = [];
  if (a.concern) lines.push(`Primary job over there: ${concernLabel(a.concern)}.`);
  if (a.tolerance) lines.push(`Skin tolerance: ${toleranceLabel(a.tolerance)}.`);
  lines.push(
    a.actives.length
      ? `Leave-on actives detected: ${list(a.actives.map(activeLabel))}.`
      : "No leave-on actives were detected in that routine.",
  );
  if (a.reassessDays) lines.push(`That routine is due for reassessment in ${a.reassessDays} days.`);
  if (a.professional) lines.push("A professional stop is already on that desk's record.");
  if (a.term) lines.push(`Carried for decoding: “${a.term}”.`);
  return lines;
}

/** One line saying what this desk did with it — and what it did not do. */
export const ARRIVAL_DISPOSITION =
  "None of this fills in anything about the venue. It adds questions to your consult sheet, because home actives are the first thing a room asks about and the thing most often misreported.";

/**
 * The questions a home routine puts into the room.
 *
 * Every one is addressed to the provider and answerable by them. None of them
 * tells anyone to stop using anything: what pauses, when, and for how long is
 * the provider's call on the specific procedure, and this desk does not have
 * the procedure.
 */
export function arrivalQuestions(a: Arrival): PrepQuestion[] {
  const out: PrepQuestion[] = [];
  const group = "Carried from your skincare routine";

  if (a.actives.length) {
    out.push({
      id: "ho-routine",
      group,
      text: `I use ${list(a.actives.map(activeLabel))} at home. Which of those do you want paused, from when, and until when?`,
      why: "Pre- and post-procedure pauses vary by procedure and by depth, not by product. Getting the window in their words — before the day — is what stops it being decided in the chair.",
    });
    out.push({
      id: "ho-writing",
      group,
      text: "Can I have that pause window and the restart date in writing before I book?",
      why: "A verbal instruction on the day is the one most often remembered wrongly, in both directions.",
    });
  }

  if (a.actives.includes("retinoid")) {
    out.push({
      id: "ho-retinoid",
      group,
      text: "How does a topical retinoid change what you would do today, or how deep you would go?",
      why: "It is the first home active a room asks about, and the answer differs sharply between a facial, a peel, a laser and hair removal.",
    });
  }

  if (a.actives.includes("hydroquinone")) {
    out.push({
      id: "ho-hydroquinone",
      group,
      text: "I am using hydroquinone. Does that change your plan, and does it change what happens if I pigment afterwards?",
      why: "Pigment-suppressing agents interact with both the procedure choice and the aftercare plan, and the second half is usually left unsaid.",
    });
  }

  if (a.actives.includes("acid") || a.actives.includes("exfoliant_other")) {
    out.push({
      id: "ho-acid",
      group,
      text: "I use a leave-on exfoliant. Does that affect the depth you would choose, or the interval between sessions?",
      why: "Exfoliation at home and exfoliation in the room are the same load on the same barrier. Only one of them is being counted.",
    });
  }

  if (a.actives.includes("benzoyl")) {
    out.push({
      id: "ho-benzoyl",
      group,
      text: "I use benzoyl peroxide. Does it affect anything you would apply, and does anything in the room bleach on contact with it?",
      why: "Two different questions with two different answers, and the second one is about your towels and clothing.",
    });
  }

  if (a.tolerance === "hold" || a.tolerance === "verify") {
    out.push({
      id: "ho-tolerance",
      group,
      text: "My skin is currently reactive and my routine is on hold. Would you move this appointment, and what would you need to see before going ahead?",
      why: "A room that will book anyone on any skin day has told you something. So has one that names a condition for going ahead.",
    });
  }

  if (a.reassessDays) {
    out.push({
      id: "ho-window",
      group,
      text: `I am reassessing my routine in ${a.reassessDays} days. Should this treatment sit before or after that, and why?`,
      why: "Changing a routine and adding a procedure in the same fortnight means neither result can be read.",
    });
  }

  if (a.concern) {
    out.push({
      id: "ho-concern",
      group,
      text: `I am working on ${concernLabel(a.concern)} at home. What would this treatment add that the routine will not, and over what timeframe?`,
      why: "The honest answers to this include “very little” and “nothing yet”. A room that cannot give a timeframe is quoting a hope.",
    });
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* The return direction.                                               */
/* ------------------------------------------------------------------ */

const skincareUrl =
  VANITY.apps.find((app) => app.url.startsWith("https://skincare."))?.url ?? VANITY.publication.url;

export const SKINCARE_URL = skincareUrl;

export interface ReturnContext {
  /** Service class id, when one was chosen. */
  serviceClass: string;
  /** Whether that class sits on the medical side of the line. */
  medical: boolean;
  /** Which panel the reader is leaving from. */
  mode: Mode;
}

/**
 * Back to Skincare Intelligence, carrying the one thing this desk knows that
 * the other one needs: that a procedure is in play, and what kind.
 *
 * The same honesty rule applies in reverse. `sr=1` marks the payload; the
 * skincare desk reads it into its own procedure-pause pathway. Nothing about
 * the venue travels — not its name, not its price, not a word of its marketing.
 */
export function returnHandoffHref(ctx: ReturnContext): string {
  const base = SKINCARE_URL.endsWith("/") ? SKINCARE_URL : `${SKINCARE_URL}/`;
  const u = new URL("desk", base);
  u.searchParams.set("from", "spa");
  u.searchParams.set("hv", HANDOFF_VERSION);
  u.searchParams.set("stage", "actives");
  if (ctx.serviceClass && ctx.serviceClass !== "unselected") {
    u.searchParams.set("service", ctx.serviceClass);
  }
  if (ctx.medical) u.searchParams.set("medical", "1");
  u.searchParams.set("panel", ctx.mode);
  return u.toString();
}

export const RETURN_CARRIES =
  "Carries the service class you selected and nothing else — no venue name, no price, no pasted text, no notes. Your record here stays in this browser.";
