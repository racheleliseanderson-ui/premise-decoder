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

import type { Assessment, PrepQuestion } from "./engine";
import type { Mode } from "./modes";
import { VANITY } from "./fleet.ts";
import { SKIN_STATE_LABEL, VANITY_CONTEXT_VERSION, type SkinState } from "./vanity-context.ts";

export const HANDOFF_VERSION = "1";

/**
 * Senders this desk will read.
 *
 * Skincare Intelligence sends `from=skincare&hv=1`. Makeup Intelligence's
 * handoff cards send `via=makeup` and carry no version at all — so both the
 * name of the sender field and the presence of a version have to be optional
 * here. They were not, and the consequence was that four links out of the
 * makeup desk landed on an empty form with a query string still in the
 * address bar.
 */
const SENDERS = new Set(["skincare", "makeup"]);

/**
 * A count, or null.
 *
 * `Number("")` is 0 — finite, in range, and completely wrong. An absent field
 * is not a zero, here or anywhere else in this bridge.
 */
const countIn = (raw: unknown, lo: number, hi: number): number | null => {
  const text = asString(raw);
  if (!text) return null;
  const n = Number.parseInt(text, 10);
  if (!Number.isFinite(n)) return null;
  return n >= lo && n <= hi ? n : null;
};

/**
 * Every parameter this bridge consumes.
 *
 * Exported so the desk can strip exactly its own payload from the URL and
 * leave anything else on the query string alone.
 */
export const HANDOFF_PARAM_KEYS = [
  "from",
  "via",
  "hv",
  "concern",
  "tolerance",
  "actives",
  "reassess",
  "professional",
  "term",
  "noticed",
  // The shared-vocabulary keys. Stripped alongside this desk's own, so a reader
  // who arrives and refuses the context does not leave it in the URL to be
  // replayed by a refresh or a shared link.
  "v",
  "also",
  "skinState",
  "burden",
  "prep",
  "goal",
  "service",
  "open",
  "aftercare",
] as const;

/**
 * Makeup Intelligence's structural concerns, said in this desk's words.
 *
 * That desk routes someone here when the goal has stopped being cosmetic:
 * volume, established pigment and static lines are things makeup diffuses
 * light across rather than fills. Its vocabulary is its own, so it gets its
 * own closed list rather than being forced through the skincare pathway ids.
 */
const MAKEUP_CONCERN_LABELS: Record<string, string> = {
  "under-eye volume": "under-eye volume",
  pigmentation: "established pigmentation",
  "fine lines": "fine lines and static texture",
};

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
  /** Which desk sent this. */
  from: "skincare" | "makeup";
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
   * How many leave-on films are on the face, when the sending desk counted them.
   *
   * From Skincare it is the routine; from Makeup it is what goes UNDER the base.
   * Either way it is the number that decides whether a consult question about
   * "your current routine" is answerable in a sentence.
   */
  routineBurden: number | null;
  /**
   * Films counted under the makeup, when Makeup sent it.
   *
   * This desk has never learned anything about what a reader wears over a
   * routine, which is odd for one that spends its time on facials and peels —
   * "what are you using" and "what goes on top of it" are both asked in that
   * room, and only the first has ever crossed.
   */
  prepBurden: number | null;
  /** The surface as it is this week, when stated. */
  skinState: string | null;
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
  // `from` is Skincare's spelling of the sender field; `via` is Makeup's.
  // Either one names it, and neither desk gets to be the only one that works.
  const sender = asString(search["from"]) || asString(search["via"]);
  if (!SENDERS.has(sender)) return null;
  const from = sender as Arrival["from"];

  // A version that is present and is not ours is a payload from a shape this
  // desk has not seen, and is still refused. An absent version is not an
  // error: the makeup cards have never carried one.
  const version = asString(search["hv"]);
  if (version && version !== HANDOFF_VERSION) return null;

  const concern = asString(search["concern"]);
  const tolerance = asString(search["tolerance"]);
  const reassessRaw = Number.parseInt(asString(search["reassess"]), 10);
  const term = asString(search["term"]);
  // Each sender's concern vocabulary is checked against that sender's own
  // closed list. A skincare pathway id arriving from makeup is not a concern
  // this desk can say, and is dropped like any other unrecognised token.
  const concernKnown =
    from === "makeup" ? !!MAKEUP_CONCERN_LABELS[concern] : !!CONCERN_LABELS[concern];

  return {
    from,
    version: version || HANDOFF_VERSION,
    concern: concernKnown ? concern : null,
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
    routineBurden: countIn(search["burden"], 0, 20),
    prepBurden: countIn(search["prep"], 0, 20),
    skinState: SKIN_STATE_LABEL[asString(search["skinState"]) as SkinState]
      ? asString(search["skinState"])
      : null,
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
  if (a.routineBurden !== null) out["burden"] = String(a.routineBurden);
  if (a.prepBurden !== null) out["prep"] = String(a.prepBurden);
  if (a.skinState) out["skinState"] = a.skinState;
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
    a.concern ||
    a.tolerance ||
    a.actives.length ||
    a.reassessDays ||
    a.professional ||
    a.term ||
    a.routineBurden !== null ||
    a.prepBurden !== null ||
    a.skinState,
  );
}

const list = (items: string[]): string =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const activeLabel = (id: string): string => FAMILY_LABELS[id] ?? id;
export const concernLabel = (id: string): string =>
  CONCERN_LABELS[id] ?? MAKEUP_CONCERN_LABELS[id] ?? id;
export const toleranceLabel = (id: string): string => TOLERANCE_LABELS[id] ?? id;

/**
 * What actually came across, in a sentence, before anything is done with it.
 * Deliberately plain: the reader should be able to check it against the URL.
 */
export function arrivalSummary(a: Arrival): string[] {
  const lines: string[] = [];
  if (a.from === "makeup") {
    // The makeup desk never looked at a routine, so this desk must not report
    // one. "No leave-on actives were detected" would be a finding about an
    // examination that did not happen.
    lines.push(
      a.concern
        ? `Makeup Intelligence sent you over ${concernLabel(a.concern)}.`
        : "Makeup Intelligence sent you here without settling on a concern.",
    );
    lines.push(
      "That desk reads makeup, not skincare, so nothing about your actives or your tolerance came with you.",
    );
    /*
     * What the makeup desk CAN say, and now does.
     *
     * It has never looked at a routine and must not report on one. It has,
     * however, counted the films going under the base — which is a fact about
     * what is on the face, it is the thing this room asks about second, and it
     * used to stop at the county line for no reason other than that nobody had
     * built the road.
     */
    if (a.prepBurden !== null) {
      lines.push(
        a.prepBurden === 0
          ? "It counted nothing left on the skin under the makeup."
          : `It counted ${a.prepBurden} leave-on film${a.prepBurden === 1 ? "" : "s"} going under the makeup. That is a count of layers, not a reading of a routine — the products themselves did not travel.`,
      );
    }
    if (a.skinState) {
      lines.push(
        `The surface as that desk had it this week: ${SKIN_STATE_LABEL[a.skinState as SkinState] ?? a.skinState}. Worth saying out loud in the room, because it changes what a treatment lands on.`,
      );
    }
    if (a.term) lines.push(`Carried for decoding: \u201C${a.term}\u201D.`);
    return lines;
  }
  if (a.concern) lines.push(`Primary job over there: ${concernLabel(a.concern)}.`);
  if (a.tolerance) lines.push(`Skin tolerance: ${toleranceLabel(a.tolerance)}.`);
  lines.push(
    a.actives.length
      ? `Leave-on actives detected: ${list(a.actives.map(activeLabel))}.`
      : "No leave-on actives were detected in that routine.",
  );
  if (a.routineBurden !== null) {
    lines.push(
      `${a.routineBurden} leave-on step${a.routineBurden === 1 ? "" : "s"} on the face. The count travels; the products do not.`,
    );
  }
  if (a.skinState) {
    lines.push(
      `The surface this week: ${SKIN_STATE_LABEL[a.skinState as SkinState] ?? a.skinState}.`,
    );
  }
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
  const group =
    a.from === "makeup" ? "Carried from Makeup Intelligence" : "Carried from your skincare routine";

  if (a.from === "makeup") {
    // Nothing below this desk's usual routine questions applies: no actives,
    // no tolerance state and no reassessment window travelled. What did travel
    // is the reason someone stopped trying to solve it with makeup.
    if (a.concern) {
      out.push({
        id: "ho-mk-concern",
        group,
        text: `I have been handling ${concernLabel(a.concern)} with makeup. What would this treatment change that makeup cannot, and how long before I would see it?`,
        why: "Makeup diffuses light across a surface. It does not fill or move one. A room that cannot say which of those it is selling, or over what period, is quoting a hope.",
      });
    }
    out.push({
      id: "ho-mk-maintenance",
      group,
      text: "If it works, what does keeping it look like \u2014 how often, for how long, and at what cost each time?",
      why: "The first session is the number on the menu. The maintenance schedule is the number nobody prints, and it is the one that decides whether this was ever affordable.",
    });
    if (a.prepBurden !== null && a.prepBurden >= 3) {
      out.push({
        id: "ho-mk-prep",
        group,
        text: `There are ${a.prepBurden} leave-on layers under my makeup on a normal day. Which of them do you want off the skin before this, and for how long afterwards?`,
        why: "A room that treats the face and never asks what is habitually on it is answering half the question. The count is the reader's own; only the provider can say which layers matter for this procedure.",
      });
    }
    if (a.skinState && a.skinState !== "settled") {
      out.push({
        id: "ho-mk-state",
        group,
        text: `My skin has been ${SKIN_STATE_LABEL[a.skinState as SkinState] ?? a.skinState} lately. Does that change whether today is the right day for this, or the settings you would use?`,
        why: "The surface a treatment lands on is not a constant. It is the variable most likely to be assumed rather than asked about, and the reader is the only one who knows it.",
      });
    }
    return out;
  }

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
  /**
   * How many signals this desk still has unnamed.
   *
   * The one number the skincare desk actually needs and never had. "A procedure
   * is in play" and "a procedure is in play and eleven things about the room
   * are still unanswered" are different instructions about whether to keep
   * escalating a titration ladder — the first is a date, the second is a maybe.
   */
  openQuestions?: number;
  /**
   * Whether a pre- or post-procedure pause window has actually been ANSWERED by
   * the provider.
   *
   * Not what the window is. This desk has never printed a pause list and does
   * not start now: windows differ by procedure, by depth, by operator and by
   * the skin in front of them, and a desk with none of those printing "stop
   * retinoids for a week" is guessing in a voice that sounds like it is not.
   * All that crosses is whether somebody qualified has given an answer at all,
   * which is exactly the thing the skincare desk cannot find out for itself.
   */
  aftercareAnswered?: boolean;
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
  if (ctx.openQuestions !== undefined) u.searchParams.set("open", String(ctx.openQuestions));
  if (ctx.aftercareAnswered) u.searchParams.set("aftercare", "1");
  u.searchParams.set("panel", ctx.mode);
  return u.toString();
}

export const RETURN_CARRIES =
  "Carries the service class you selected, how many questions about the room are still unanswered, and whether anyone has actually given you an aftercare window. Nothing else — no venue name, no price, no pasted text, no notes, and not the window itself, which this desk has no business guessing at. Your record here stays in this browser.";

/* ------------------------------------------------------- out to Makeup */

/**
 * The edge that did not exist.
 *
 * Makeup routes people here when a concern has stopped being cosmetic —
 * volume, established pigment, static lines. Nothing ever went the other way,
 * and it should, because the commonest expensive mistake in this category is
 * not a bad clinic. It is booking a treatment for something a cosmetic layer
 * handles perfectly well, and finding that out afterwards.
 *
 * The tone matters here and it is easy to get wrong. This is NOT "you don't
 * need this" — the desk has no idea what anyone needs, desire is allowed, and a
 * publication that talks people out of things they want is just a different
 * kind of condescension. It is: while this room is still unresolved, here is
 * the version of the same decision that costs forty pounds and is reversible
 * tonight. Both remain open.
 *
 * Offered only when the setting is genuinely unresolved. A room that has
 * answered everything gets no such card — at that point the reader has the
 * information they came for and a nudge sideways is just noise.
 */
export const MAKEUP_URL =
  VANITY.apps.find((a) => a.name === "Makeup Intelligence")?.url ?? VANITY.publication.url;

/** Service classes with a cosmetic counterpart worth naming. */
const COSMETIC_COUNTERPART: Record<string, { goal: string; line: string }> = {
  chemical: {
    goal: "less-texture",
    line: "A resurfacing course and a base chosen not to sit in texture are aimed at the same complaint from opposite ends. One is permanent-ish, has downtime and costs four figures; the other is reversible at the sink.",
  },
  device: {
    goal: "luminous",
    line: "Most of what an energy device is sold on — tone, brightness, a lit quality — is also what a finish decision does, immediately and for the price of one product. That is not an argument against the device. It is an argument for knowing which of the two you are actually buying.",
  },
  injectable: {
    goal: "stronger-eye",
    line: "Structural changes are structural, and no cosmetic layer moves volume. Where the goal is emphasis rather than structure, though, the cosmetic version is available tonight and undoes itself.",
  },
  facial: {
    goal: "skin-like-skin",
    line: "A facial buys a few days of surface. A base chosen for your actual skin buys the same look on the days between facials, which is most of them.",
  },
};

export interface MakeupOffer {
  href: string;
  /** The heading. Never a discouragement. */
  title: string;
  line: string;
  /** What the link carries. */
  carries: string;
}

export function makeupOffer(a: Assessment): MakeupOffer | null {
  const cls = a.input.serviceClass;
  const counterpart = COSMETIC_COUNTERPART[cls];
  if (!counterpart) return null;
  // A resolved room does not need to be nudged sideways.
  if (a.failClosed.length === 0) return null;

  const p = new URLSearchParams();
  p.set("v", VANITY_CONTEXT_VERSION);
  p.set("from", "spa");
  p.set("service", cls);
  p.set("goal", counterpart.goal);
  p.set("open", String(a.failClosed.length));

  return {
    href: `${MAKEUP_URL}/edit?${p.toString()}`,
    title: "The other version of this decision",
    line: `${counterpart.line} With ${a.failClosed.length} thing${a.failClosed.length === 1 ? "" : "s"} about this room still unanswered, it is worth having both on the table rather than one.`,
    carries:
      "Carries the class of service you are considering and the cosmetic goal it corresponds to. No venue, no price, no marketing text, nothing you typed.",
  };
}
