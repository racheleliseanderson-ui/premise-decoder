/**
 * The Vanity context — one vocabulary for the things that legitimately move
 * between Skincare, Makeup and Spa Intelligence.
 *
 * SINGLE SOURCE OF TRUTH. This file is byte-identical in all three repositories,
 * exactly like `fleet.ts`. When you change it, change it in all three in the
 * same pass — a drifted vocabulary is worse than no vocabulary, because both
 * ends still believe they agree.
 *
 * WHY IT EXISTS. Three desks had grown three wire formats. Skincare said
 * `from=skincare&hv=1&concern=…`; Makeup said `via=makeup&v=…&skin=…`; and a
 * third, richer record travelled in the URL fragment under `#vvdr=`. All three
 * worked. None of them agreed on what a "concern" was, two of them used the
 * word for different things, and the only place the overlap was written down
 * was in the parsers at either end. Adding a fourth edge meant inventing a
 * fourth dialect.
 *
 * This does not replace those formats. They are tested, they are deployed, and
 * rewriting a working handoff to tidy a vocabulary is how you break a link
 * nobody notices until someone's session lands on an empty form. What it does
 * is state the vocabulary ONCE, so every format can validate against it and a
 * new edge has something to be built out of.
 *
 * THE RULES THAT MAKE THIS NOT CREEPY. They are the whole design, not a
 * postscript.
 *
 *   1. CLOSED LISTS ONLY. Every value that crosses is a short token from a list
 *      defined here. No free text, ever — not a product name, not a note, not a
 *      venue, not a price. A query string is user-editable, and a desk that
 *      prints whatever is in the address bar is a defacement vector.
 *
 *   2. WHAT TRAVELS IS PRINTED BEFORE IT IS USED. Every receiving desk shows
 *      the payload in words and lets the reader refuse it. `describeCarry`
 *      exists so all three do that in the same sentences.
 *
 *   3. NOTHING IS CARRIED BECAUSE IT MIGHT BE INTERESTING. Each field below has
 *      a comment saying which decision at the far end it changes. A field that
 *      cannot answer that question does not belong here, and several obvious
 *      candidates — age, budget, brand history, photographs — are absent for
 *      exactly that reason.
 *
 *   4. THE PAYLOAD IS STRIPPED FROM THE URL AFTER READING, so a refresh or a
 *      shared link cannot replay one person's session onto another's desk.
 */

export const VANITY_CONTEXT_VERSION = "vc-1" as const;

export type VanityApp = "skincare" | "makeup" | "spa";

/* ---------------------------------------------------------------- concern */

/**
 * What the person is trying to change about their face.
 *
 * One list, shared. Skincare and Spa each had their own and they overlapped by
 * about half, with two different spellings of "oiliness" between them.
 */
export const CONCERNS = [
  "acne",
  "aging",
  "barrier",
  "dryness",
  "oiliness",
  "pigment",
  "redness",
  "scarring",
  "sensitivity",
  "texture",
  "volume",
  "other",
] as const;
export type Concern = (typeof CONCERNS)[number];

export const CONCERN_LABEL: Record<Concern, string> = {
  acne: "Breakouts",
  aging: "Lines and laxity",
  barrier: "Barrier repair",
  dryness: "Dryness",
  oiliness: "Oil control",
  pigment: "Pigmentation",
  redness: "Redness",
  scarring: "Scarring",
  sensitivity: "Sensitivity",
  texture: "Texture",
  volume: "Volume loss",
  other: "Something else",
};

/* -------------------------------------------------------------- tolerance */

/**
 * How much the skin can currently take.
 *
 * Changes, at the far end: whether Makeup may recommend anything with friction
 * or a hard remove, and whether Spa's consult sheet should open on the barrier
 * rather than on the goal.
 */
export const TOLERANCE_STATES = ["clear", "watch", "hold", "verify"] as const;
export type ToleranceState = (typeof TOLERANCE_STATES)[number];

export const TOLERANCE_LABEL: Record<ToleranceState, string> = {
  clear: "Settled",
  watch: "Watching it",
  hold: "On hold",
  verify: "Needs checking",
};

/* --------------------------------------------------------- active families */

/**
 * Leave-on active families detected in a routine.
 *
 * Changes, at the far end: which questions Spa puts on the consult sheet — a
 * room asks about retinoids and acids first and the answer is usually
 * misreported — and which causes Makeup raises for pilling and texture.
 */
export const ACTIVE_FAMILIES = [
  "retinoid",
  "acid",
  "vitamin_c",
  "benzoyl",
  "hydroquinone",
  "azelaic",
  "exfoliant_other",
  "brightener",
] as const;
export type ActiveFamily = (typeof ACTIVE_FAMILIES)[number];

export const ACTIVE_LABEL: Record<ActiveFamily, string> = {
  retinoid: "a retinoid",
  acid: "a leave-on acid",
  vitamin_c: "vitamin C",
  benzoyl: "benzoyl peroxide",
  hydroquinone: "hydroquinone",
  azelaic: "azelaic acid",
  exfoliant_other: "another exfoliant",
  brightener: "a brightening agent",
};

/* ------------------------------------------------------------- skin state */

/**
 * The condition of the surface right now — not the skin type, which is a
 * different and much slower fact.
 *
 * Changes, at the far end: whether Makeup treats a base problem as a formula
 * question or routes it upstream, and whether it will suggest anything that
 * sets.
 */
export const SKIN_STATES = ["settled", "dehydrated", "retinised", "flaking", "oily-now"] as const;
export type SkinState = (typeof SKIN_STATES)[number];

export const SKIN_STATE_LABEL: Record<SkinState, string> = {
  settled: "settled",
  dehydrated: "dehydrated",
  retinised: "actively retinised",
  flaking: "flaking",
  "oily-now": "oilier than usual",
};

/* ----------------------------------------------------------- cosmetic goal */

/**
 * What the finished face is meant to do.
 *
 * Changes, at the far end: whether Skincare's prep advice is aimed at grip or
 * at comfort, and whether Spa hears "I want to stop wearing so much" as a
 * treatment motivation, which is a very different conversation from a
 * cosmetic one.
 */
export const COSMETIC_GOALS = [
  "skin-like-skin",
  "high-coverage",
  "luminous",
  "matte-control",
  "less-texture",
  "stronger-eye",
  "specific-lip",
  "dramatic",
  "heat-resistant",
  "eight-hour",
  "photographed",
  "rescue",
] as const;
export type CosmeticGoal = (typeof COSMETIC_GOALS)[number];

/* ---------------------------------------------------------- service class */

/**
 * The class of professional service in play.
 *
 * Changes, at the far end: whether Skincare should stop escalating a titration
 * ladder, and whether it offers to park every climbing active pending a date.
 */
export const SERVICE_CLASSES = [
  "facial",
  "injectable",
  "device",
  "bodywork",
  "chemical",
  "iv",
  "other",
] as const;
export type ServiceClass = (typeof SERVICE_CLASSES)[number];

export const MEDICAL_CLASSES: ServiceClass[] = ["injectable", "device", "iv", "chemical"];

/* -------------------------------------------------------------- the shape */

/**
 * Everything that may cross between desks. Every field optional: an absent
 * field is a thing the sending desk did not know, which is never the same as a
 * default, and no receiver may substitute one.
 */
export interface VanityContext {
  v: typeof VANITY_CONTEXT_VERSION;
  /** Which desk built this. */
  from: VanityApp;

  /* what they are working on */
  concern?: Concern;
  /** Secondary concerns, in the order the sending desk ranked them. Max 3. */
  also?: Concern[];

  /* the skin */
  tolerance?: ToleranceState;
  skinState?: SkinState;
  actives?: ActiveFamily[];
  /** Days until the sending desk thinks a verdict is fair. */
  reassessDays?: number;
  /**
   * How much is on the face, as a count of leave-on films.
   * Changes, at the far end: whether Makeup's first move is subtraction.
   */
  routineBurden?: number;

  /* the cosmetic layer */
  cosmeticGoal?: CosmeticGoal[];
  /** Leave-on films counted under the makeup. */
  prepBurden?: number;

  /* the professional conversation */
  serviceClass?: ServiceClass;
  /** True when a professional is already involved, not when one might be. */
  professional?: boolean;
  /**
   * How many questions the sending desk left open.
   * Changes, at the far end: whether Skincare treats a booking as settled.
   */
  openQuestions?: number;
  /**
   * Whether an aftercare pause window has actually been ANSWERED by a provider.
   * Not what the window is — this desk does not know and will not guess.
   */
  aftercareAnswered?: boolean;
}

/* ------------------------------------------------------------ validation */

const inList = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

const listOf = <T extends string>(
  list: readonly T[],
  raw: unknown,
  max: number,
): T[] | undefined => {
  const parts =
    typeof raw === "string" ? raw.split(",") : Array.isArray(raw) ? raw.map(String) : null;
  if (!parts) return undefined;
  const out = [...new Set(parts.map((p) => p.trim()).filter((p) => inList(list, p)))] as T[];
  return out.length ? out.slice(0, max) : undefined;
};

const intIn = (raw: unknown, lo: number, hi: number): number | undefined => {
  // An ABSENT field is not zero. `Number("")` is 0, which is finite and inside
  // most ranges, so the obvious one-liner here turned every unset count into a
  // confident nought — this module's own first rule, broken by its own parser.
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "string" && raw.trim() === "") return undefined;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return undefined;
  const r = Math.round(n);
  return r >= lo && r <= hi ? r : undefined;
};

/**
 * Read a context out of anything.
 *
 * Every unrecognised token is DROPPED rather than echoed. This is the rule that
 * makes it safe to read from a URL: a query string is user-editable, and a desk
 * that prints back whatever it was handed is a defacement vector wearing a
 * personalisation feature.
 *
 * A version that is PRESENT and is not ours is refused outright. An ABSENT one
 * is not an error — the earlier formats did not carry one, and refusing them
 * would break links that are already in the wild.
 */
export function parseVanityContext(raw: Record<string, unknown>): VanityContext | null {
  const v = raw["v"] ?? raw["vc"];
  if (v !== undefined && v !== VANITY_CONTEXT_VERSION) return null;

  const from = raw["from"] ?? raw["via"];
  if (!inList(["skincare", "makeup", "spa"] as const, from)) return null;

  const ctx: VanityContext = { v: VANITY_CONTEXT_VERSION, from };

  if (inList(CONCERNS, raw["concern"])) ctx.concern = raw["concern"];
  const also = listOf(CONCERNS, raw["also"], 3);
  if (also) ctx.also = also;
  if (inList(TOLERANCE_STATES, raw["tolerance"])) ctx.tolerance = raw["tolerance"];
  if (inList(SKIN_STATES, raw["skinState"])) ctx.skinState = raw["skinState"];
  const actives = listOf(ACTIVE_FAMILIES, raw["actives"], 8);
  if (actives) ctx.actives = actives;

  const reassess = intIn(raw["reassess"], 1, 365);
  if (reassess !== undefined) ctx.reassessDays = reassess;
  const burden = intIn(raw["burden"], 0, 20);
  if (burden !== undefined) ctx.routineBurden = burden;
  const prep = intIn(raw["prep"], 0, 20);
  if (prep !== undefined) ctx.prepBurden = prep;

  const goals = listOf(COSMETIC_GOALS, raw["goal"], 4);
  if (goals) ctx.cosmeticGoal = goals;

  if (inList(SERVICE_CLASSES, raw["service"])) ctx.serviceClass = raw["service"];
  if (raw["professional"] === "1" || raw["professional"] === true) ctx.professional = true;
  const open = intIn(raw["open"], 0, 50);
  if (open !== undefined) ctx.openQuestions = open;
  if (raw["aftercare"] === "1" || raw["aftercare"] === true) ctx.aftercareAnswered = true;

  return ctx;
}

/** The query keys this vocabulary owns, so a receiver can strip them cleanly. */
export const VANITY_CONTEXT_KEYS = [
  "v",
  "vc",
  "from",
  "via",
  "concern",
  "also",
  "tolerance",
  "skinState",
  "actives",
  "reassess",
  "burden",
  "prep",
  "goal",
  "service",
  "professional",
  "open",
  "aftercare",
] as const;

/** Serialise for a URL. Only set keys are written; nothing is defaulted in. */
export function vanityContextParams(ctx: VanityContext): URLSearchParams {
  const p = new URLSearchParams();
  p.set("v", ctx.v);
  p.set("from", ctx.from);
  if (ctx.concern) p.set("concern", ctx.concern);
  if (ctx.also?.length) p.set("also", ctx.also.join(","));
  if (ctx.tolerance) p.set("tolerance", ctx.tolerance);
  if (ctx.skinState) p.set("skinState", ctx.skinState);
  if (ctx.actives?.length) p.set("actives", ctx.actives.join(","));
  if (ctx.reassessDays !== undefined) p.set("reassess", String(ctx.reassessDays));
  if (ctx.routineBurden !== undefined) p.set("burden", String(ctx.routineBurden));
  if (ctx.prepBurden !== undefined) p.set("prep", String(ctx.prepBurden));
  if (ctx.cosmeticGoal?.length) p.set("goal", ctx.cosmeticGoal.join(","));
  if (ctx.serviceClass) p.set("service", ctx.serviceClass);
  if (ctx.professional) p.set("professional", "1");
  if (ctx.openQuestions !== undefined) p.set("open", String(ctx.openQuestions));
  if (ctx.aftercareAnswered) p.set("aftercare", "1");
  return p;
}

/* -------------------------------------------------------------- the card */

const APP_NAME: Record<VanityApp, string> = {
  skincare: "Skincare Intelligence",
  makeup: "Makeup Intelligence",
  spa: "Spa Intelligence",
};

/**
 * What is travelling, in plain sentences.
 *
 * Every desk prints this before applying anything, and they all print the same
 * sentences because they all call this. The previous arrangement had three
 * desks each writing their own description of the same payload, which is how
 * one of them ended up describing a field it did not actually send.
 */
export function describeCarry(ctx: VanityContext): string[] {
  const lines: string[] = [];

  if (ctx.concern) {
    lines.push(
      `What you are working on: ${CONCERN_LABEL[ctx.concern].toLowerCase()}${
        ctx.also?.length
          ? `, then ${ctx.also.map((c) => CONCERN_LABEL[c].toLowerCase()).join(" and ")}`
          : ""
      }.`,
    );
  }
  if (ctx.tolerance) {
    lines.push(`How your skin is taking things: ${TOLERANCE_LABEL[ctx.tolerance].toLowerCase()}.`);
  }
  if (ctx.skinState && ctx.skinState !== "settled") {
    lines.push(`The surface right now: ${SKIN_STATE_LABEL[ctx.skinState]}.`);
  }
  if (ctx.actives?.length) {
    lines.push(
      `Leave-on actives detected: ${ctx.actives.map((a) => ACTIVE_LABEL[a]).join(", ")}. Frequency does not travel — it is the half people misreport and the half worth saying out loud.`,
    );
  }
  if (ctx.routineBurden !== undefined) {
    lines.push(
      `${ctx.routineBurden} leave-on step${ctx.routineBurden === 1 ? "" : "s"} on the face.`,
    );
  }
  if (ctx.prepBurden !== undefined) {
    lines.push(
      `${ctx.prepBurden} film${ctx.prepBurden === 1 ? "" : "s"} counted under the makeup.`,
    );
  }
  if (ctx.reassessDays !== undefined) {
    lines.push(`A ${ctx.reassessDays}-day window before a verdict on that routine is fair.`);
  }
  if (ctx.cosmeticGoal?.length) {
    lines.push(`What the face is meant to do: ${ctx.cosmeticGoal.join(", ").replace(/-/g, " ")}.`);
  }
  if (ctx.serviceClass) {
    lines.push(
      `A ${ctx.serviceClass} service is being considered${MEDICAL_CLASSES.includes(ctx.serviceClass) ? ", which is a medical class" : ""}.`,
    );
  }
  if (ctx.professional) lines.push("A professional is already involved.");
  if (ctx.openQuestions !== undefined) {
    lines.push(
      ctx.openQuestions === 0
        ? "Nothing about that setting is still unanswered."
        : `${ctx.openQuestions} question${ctx.openQuestions === 1 ? "" : "s"} about that setting are still unanswered.`,
    );
  }
  if (ctx.aftercareAnswered)
    lines.push("An aftercare pause window has been answered by the provider.");

  if (!lines.length) {
    lines.push(
      `${APP_NAME[ctx.from]} sent a link and nothing with it. You will be asked from scratch.`,
    );
  }
  return lines;
}

/** What deliberately does not travel. Printed alongside the above, always. */
export const NEVER_CARRIED = [
  "No product names, no brands, and nothing you typed in a free-text box.",
  "No money — not a budget, not a price, not what you have spent.",
  "No photographs, no dates of birth, no identifier of any kind.",
  "No frequency figures. What you use is carried; how often is a sentence for you to say out loud, because it is the half that changes the answer.",
];

/** The one line a link should carry so nobody is surprised on arrival. */
export const carryLine = (ctx: VanityContext): string => {
  const n = describeCarry(ctx).length;
  return `${n} thing${n === 1 ? "" : "s"} travel with this link, listed before anything is used, and refusable on arrival.`;
};
