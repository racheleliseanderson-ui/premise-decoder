/**
 * Spa Intelligence — setting evaluation engine.
 *
 * Education only. This module never diagnoses, never scores candidacy, never
 * ranks providers, and never predicts outcomes. It scores how much of the
 * SETTING is actually resolved by the information on hand, and keeps every
 * unresolved item visible (fail-closed) instead of smoothing it over.
 */

import { matchProduct, matchService } from "./catalog.ts";
import { containsAny, containsTermCased } from "./text-match.ts";
import { matchRegister, type RegisterHit } from "./register.ts";

export type ServiceClass =
  | "unselected"
  | "facial"
  | "injectable"
  | "device"
  | "bodywork"
  | "chemical"
  | "iv"
  | "other";

export type Venue =
  | "day-spa"
  | "hotel-spa"
  | "wellness-studio"
  | "salon-suite"
  | "franchise-chain"
  | "mobile"
  | "med-spa"
  | "dental-adjacent"
  | "clinic"
  | "unclear";

export type SignalState = "known" | "partial" | "fail-closed";

export interface EvalInput {
  serviceClass: ServiceClass;
  venue: Venue;
  /** Jurisdiction id from REGIONS. "unstated" until named. */
  region: string;
  menuLine: string;
  product: string;
  performer: string;
  license: string;
  price: string;
  supervision: string;
  sanitation: string;
  afterHours: string;
  consent: string;
  seriesPressure: string;
  marketing: string;
}

export const emptyInput: EvalInput = {
  serviceClass: "unselected",
  venue: "unclear",
  region: "unstated",
  menuLine: "",
  product: "",
  performer: "",
  license: "",
  price: "",
  supervision: "",
  sanitation: "",
  afterHours: "",
  consent: "",
  seriesPressure: "",
  marketing: "",
};

/**
 * Sentinel written into a field when the reader ASKED and got no answer.
 * A refusal is a stronger finding than silence: silence may be an oversight,
 * a refusal is a decision. It never scores as resolved.
 */
export const NO_ANSWER = "◇ Asked — no answer given";
export const isNoAnswer = (v: string) => v.trim() === NO_ANSWER;

export interface Signal {
  id: string;
  label: string;
  state: SignalState;
  weight: number;
  reading: string;
  ask: string;
  depth: "fast" | "full";
  /** True when the reader asked and the facility declined or deflected. */
  refused?: boolean;
  /** Catalog context: what this named thing still does not establish. */
  note?: string;
}

/**
 * How the promise/place comparison should be read. The number alone is not
 * enough: `gap` is <= 0 both when the place answers everything and when there
 * is no promise text at all, and those are opposite findings. Callers branch on
 * this, never on the sign of `gap`.
 */
export type GapState =
  /** No copy on the desk at all. There is nothing to weigh the place against. */
  | "no-promise"
  /** Copy on the desk, and nothing named behind it. */
  | "no-place"
  /** Measured on both sides, promise well ahead. */
  | "promise-far-ahead"
  /** Measured on both sides, promise ahead. */
  | "promise-ahead"
  /** Promise is not ahead, and every signal is named. The only honest parity. */
  | "level"
  /** Promise is not ahead because the copy is quiet — the room is still unnamed. */
  | "level-unresolved";

export interface DecodedClaim {
  phrase: string;
  category: string;
  hides: string;
  ask: string;
  severity: "note" | "flag" | "hard";
}

export interface Assessment {
  input: EvalInput;
  signals: Signal[];
  place: number; // 0-100 setting resolution
  promise: number; // 0-100 marketing density
  gap: number;
  /** What the gap number actually means. Never infer parity from `gap <= 0`. */
  gapState: GapState;
  /** The honest sentence for `gapState`, written once here rather than per view. */
  gapLine: string;
  burden: { score: number; band: string; drivers: string[] };
  claims: DecodedClaim[];
  /**
   * Claims in this copy that the publication has already adjudicated.
   *
   * The decoder above names the pattern; this names the verdict. Empty for
   * almost everything, because the Register covers a few dozen claims and the
   * market makes thousands, and an empty list is the honest answer rather than
   * a gap to fill.
   */
  register: RegisterHit[];
  known: Signal[];
  failClosed: Signal[];
  /** Signals the reader asked about and was refused an answer on. */
  refused: Signal[];
  unknowns: string[];
  nextSteps: string[];
  posture: {
    key: "resolved" | "partial" | "unresolved" | "empty";
    label: string;
    line: string;
  };
  identityLine: string;
}

/* ------------------------------------------------------------------ labels */

export const SERVICE_LABELS: Record<ServiceClass, string> = {
  unselected: "— not selected —",
  facial: "Facial / esthetic service",
  injectable: "Injectable",
  device: "Energy / device treatment",
  bodywork: "Bodywork / massage",
  chemical: "Chemical peel / resurfacing",
  iv: "IV / infusion service",
  other: "Other / not sure yet",
};

/**
 * Setting profiles. `oversight` describes what the setting label alone implies
 * about medical accountability — never what any specific facility actually has.
 * Education only.
 */
export interface VenueProfile {
  label: string;
  short: string;
  /** What the label alone implies about a supervising medical licensee. */
  oversight: "medical" | "mixed" | "none" | "unknown";
  note: string;
  /** Added verification burden carried by the setting type itself. */
  burden: number;
}

export const VENUE_PROFILES: Record<Venue, VenueProfile> = {
  "day-spa": {
    label: "Day spa / wellness spa",
    short: "Day spa",
    oversight: "none",
    note: "Operates under cosmetology, esthetics, or massage licensing. A medical licensee is not implied by the name.",
    burden: 0,
  },
  "hotel-spa": {
    label: "Hotel / resort spa",
    short: "Hotel spa",
    oversight: "none",
    note: "Often staffed by rotating or contracted providers. Ask which licensed individual is working your appointment, not which brand runs the spa.",
    burden: 4,
  },
  "wellness-studio": {
    label: "Wellness studio / recovery lounge",
    short: "Wellness studio",
    oversight: "unknown",
    note: "Menus here mix esthetics, bodywork, and sometimes infusion or device work under one wellness label. The license behind each line has to be named separately.",
    burden: 8,
  },
  "salon-suite": {
    label: "Salon suite / independent booth rental",
    short: "Salon suite",
    oversight: "none",
    note: "The renter, not the building, holds the license and the liability. Ask whose license the service runs under and who answers afterwards.",
    burden: 10,
  },
  "franchise-chain": {
    label: "Franchise / chain location",
    short: "Franchise",
    oversight: "mixed",
    note: "Brand protocol is not oversight. Ask which licensee is responsible at this specific location, not what the national brand states.",
    burden: 6,
  },
  mobile: {
    label: "Mobile / in-home / event service",
    short: "Mobile",
    oversight: "unknown",
    note: "No fixed room means no fixed sanitation setup, no autoclave on site, and no facility to return to. Sterile handling and after-hours cover carry more weight here.",
    burden: 14,
  },
  "med-spa": {
    label: "Medical spa",
    short: "Med spa",
    oversight: "mixed",
    note: "The label implies medical oversight without stating it. Ask who supervises, under which license, and whether they are on site while you are treated.",
    burden: 4,
  },
  "dental-adjacent": {
    label: "Dental or dental-adjacent practice",
    short: "Dental-adjacent",
    oversight: "mixed",
    note: "A dental license covers dentistry. Aesthetic services offered alongside it may sit inside, beside, or outside that scope — ask which license covers this specific service.",
    burden: 10,
  },
  clinic: {
    label: "Medical clinic / physician practice",
    short: "Clinic",
    oversight: "medical",
    note: "A medical practice carries a named responsible licensee. That still has to be identified rather than assumed from the signage.",
    burden: 0,
  },
  unclear: {
    label: "Unclear from marketing",
    short: "Unclear",
    oversight: "unknown",
    note: "The material does not resolve which kind of setting this is. Everything that follows inherits that gap.",
    burden: 10,
  },
};

export const VENUE_LABELS: Record<Venue, string> = Object.fromEntries(
  (Object.keys(VENUE_PROFILES) as Venue[]).map((v) => [v, VENUE_PROFILES[v].label]),
) as Record<Venue, string>;

/* ------------------------------------------------------------ jurisdiction */

export interface Region {
  id: string;
  label: string;
  /** Education-only note on how oversight questions tend to differ. */
  note: string;
}

/**
 * Jurisdiction context. These notes describe what to ASK, never what the law
 * currently is — rules change and vary by product, class, and year.
 */
export const REGIONS: Region[] = [
  {
    id: "unstated",
    label: "Not stated yet",
    note: "Without a jurisdiction, scope-of-practice questions cannot be aimed anywhere. Name the state or country and ask the facility which board licenses the person treating you.",
  },
  {
    id: "us-ca",
    label: "California, US",
    note: "Ask which board — medical, nursing, or cosmetology — licenses the performer, and whether a good-faith examination by a licensee is required before a medical-class service.",
  },
  {
    id: "us-ny",
    label: "New York, US",
    note: "Ask which licensed profession the service falls under and who holds the supervising relationship, since aesthetic medical services are commonly tied to a physician practice.",
  },
  {
    id: "us-tx",
    label: "Texas, US",
    note: "Ask about delegation: who prescribes, who performs, and what written delegation or standing order covers it.",
  },
  {
    id: "us-fl",
    label: "Florida, US",
    note: "Ask whether the location is a registered medical facility and who the named medical director is, in writing.",
  },
  {
    id: "us-il",
    label: "Illinois, US",
    note: "Ask which license category the service sits in and whether the supervising licensee must be physically present.",
  },
  {
    id: "us-az",
    label: "Arizona, US",
    note: "Ask how device and injection services are classified locally, and which board would receive a complaint.",
  },
  {
    id: "us-wa",
    label: "Washington, US",
    note: "Ask which credential covers device work specifically, since energy devices are treated differently from topical esthetics.",
  },
  {
    id: "us-co",
    label: "Colorado, US",
    note: "Ask which board licenses the performer and whether a medical director or delegating physician relationship is required for the service class.",
  },
  {
    id: "us-nv",
    label: "Nevada, US",
    note: "Ask which license category covers injectables and devices, and whether the supervising licensee must be on site.",
  },
  {
    id: "us-ga",
    label: "Georgia, US",
    note: "Ask who the supervising physician is for medical-class services and how the practice is registered locally.",
  },
  {
    id: "us-other",
    label: "Other US state",
    note: "Name the state, then search that state's board for the license the performer claims. Rules on who may inject or operate devices differ state to state.",
  },
  {
    id: "ca-canada",
    label: "Canada",
    note: "Ask which provincial college regulates the performer, and whether the service is a delegated medical act in that province.",
  },
  {
    id: "uk",
    label: "United Kingdom",
    note: "Ask who prescribes, who administers, and whether the premises are registered with the relevant inspectorate.",
  },
  {
    id: "eu",
    label: "European Union",
    note: "Ask which national health authority regulates the service and who the responsible clinician is.",
  },
  {
    id: "au-nz",
    label: "Australia / New Zealand",
    note: "Ask whether a prescribing consultation is required before the appointment and who conducts it.",
  },
  {
    id: "other",
    label: "Elsewhere / international",
    note: "Ask which authority licenses the performer and where a complaint would be filed. If nobody can answer that, treat it as unresolved.",
  },
];

export const regionOf = (id: string) => REGIONS.find((r) => r.id === id) ?? REGIONS[0]!;

/**
 * Regions that do not resolve the jurisdiction signal. "unstated" is nothing at
 * all; the other two are placeholders standing in for a jurisdiction the reader
 * still has to name before any board can be searched.
 */
const UNRESOLVED_REGIONS = new Set(["unstated", "us-other", "other"]);

/** Classes where the setting question changes materially. */
const MEDICAL_CLASSES: ServiceClass[] = ["injectable", "device", "iv", "chemical"];

/** Whether a class sits on the medical side of the line. */
export const isMedicalClass = (c: ServiceClass): boolean => MEDICAL_CLASSES.includes(c);

/* ---------------------------------------------------------------- helpers */

const has = (v: string) => v.trim().length > 1 && !isNoAnswer(v);
const words = (v: string) => v.trim().split(/\s+/).filter(Boolean).length;
const lower = (v: string) => v.toLowerCase();

/**
 * The reading printed when a field carries the NO_ANSWER sentinel. Silence may
 * be an oversight; a declined question is a decision, and the desk records it
 * as one. It never resolves a signal, and it costs more than saying nothing.
 */
const refusedReading = (subject: string) =>
  `Asked ${subject}; no answer was given. Held open as a refusal — a decision, not an oversight, and it scores below silence.`;

const VAGUE_PRODUCT = [
  "medical grade",
  "medical-grade",
  "proprietary",
  "signature",
  "custom blend",
  "advanced",
  "clinical strength",
  "pharmaceutical grade",
  "our own",
  "house",
  "premium",
  "cosmeceutical",
];

/**
 * License evidence, split by how it is written.
 *
 * These used to be one flat list tested with `includes()`, unanchored. That
 * made "The spa staff" a licensed performer ("pa" inside "spa"), and "does not
 * disclose" a licensed performer ("do" inside "does") — a false KNOWN on the
 * weight-18 signal this engine itself calls the single most consequential gap.
 */
const LICENSE_PHRASES = [
  "licensed esthetician",
  "esthetician license",
  "master esthetician",
  "medical esthetician",
  "massage license",
  "massage therapist",
  "registered nurse",
  "nurse practitioner",
  "physician assistant",
  "cosmetology",
  "physician",
  "dermatologist",
  "nurse",
  "license #",
  "license number",
  "lic #",
  "state license",
  "state licensed",
  "board certified",
];

/** Credential abbreviations with no ordinary-English reading of their own. */
const LICENSE_ABBREVIATIONS = [
  "rn",
  "np",
  "md",
  "dnp",
  "aprn",
  "lme",
  "lmt",
  "pa-c",
  "np-c",
  "cnm",
  "cns",
];

/**
 * Abbreviations that ARE ordinary English words. A credential is written in
 * capitals — "Jane Smith, DO" — and the verb is not, so these are the one
 * place the desk reads case. Anchoring alone would not save them: "do" is a
 * whole word in "what do you use", and "pa" is a whole word in plenty of copy.
 */
const LICENSE_ABBREVIATIONS_CASED = ["DO", "PA"];

/**
 * Whether a performer/license pair carries anything checkable against a board.
 * One function, used by both `promiseScore` and the performer signal, so the
 * number and the sentence beside it cannot disagree about what "licensed" met.
 */
export const hasLicenseEvidence = (text: string): boolean =>
  containsAny(text, LICENSE_PHRASES) ||
  containsAny(text, LICENSE_ABBREVIATIONS) ||
  LICENSE_ABBREVIATIONS_CASED.some((t) => containsTermCased(text, t));

const VAGUE_PERFORMER = [
  "specialist",
  "technician",
  "expert",
  "artist",
  "consultant",
  "team",
  "staff",
  "provider",
  "our girls",
  "esthetician", // title alone, no license evidence
];

/**
 * Role words, removed whole and with an optional plural — "specialists" and
 * "our girls" identify no more than "specialist" does. Anchored, so removing
 * "team" cannot also gut "teamwork".
 */
const VAGUE_PERFORMER_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${VAGUE_PERFORMER.map((t) => t.replace(/\s+/g, "\\s+")).join("|")})(?:e?s)?(?![\\p{L}\\p{N}])`,
  "giu",
);

/** Grammar with no identifying content of its own. */
const PERFORMER_FILLER =
  /\b(?:a|an|the|our|your|my|we|us|they|and|or|of|by|with|at|in|is|are|will|be|it|to|licensed|certified|spa|med|medspa|salon|clinic|studio|centre|center|office|professionals?|people|here)\b/g;

/**
 * True when the performer field contains role words and nothing else — "our
 * team", "esthetician", "the specialist". Those name a category, not a person
 * and not a license, so nothing is resolved. A field that still has content
 * left after the role words are removed ("Maria Gonzalez") does name someone,
 * which is a partial answer rather than none.
 */
const roleWordsOnly = (v: string) => {
  let rest = lower(v);
  rest = rest.replace(VAGUE_PERFORMER_RE, " ");
  rest = rest
    .replace(PERFORMER_FILLER, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return rest.length === 0;
};

/**
 * Sanitation described as a PROCEDURE rather than an impression. One regex,
 * used for both the state and the reading, so the chip and the sentence beside
 * it cannot disagree. "log" is only counted when it is a log of something
 * ("sharps log"), never as a bare substring — "see our blog" is not a practice.
 */
const SANITATION_PRACTICE =
  /\b(?:single[-\s]?use|sealed|autoclave[sd]?|opened in front|new needle|steril(?:e|is\w*|iz\w*)|spore test|barrier film|sharps (?:container|bin|box|log)|(?:autoclave|cleaning|steriliser|sterilizer) log)\b/i;

/* -------------------------------------------------------- claim decoder */

interface ClaimRule {
  test: RegExp;
  category: string;
  hides: string;
  ask: string;
  severity: DecodedClaim["severity"];
}

const CLAIM_RULES: ClaimRule[] = [
  {
    test: /\b(?:medical[-\s]?grade|pharmaceutical[-\s]?grade|clinical[-\s]?strength)\b/i,
    category: "Unregulated tier language",
    hides:
      "Implies a regulated tier that does not exist. It replaces the product or device name and its real regulatory status.",
    ask: "Which exact product or device, and what is its real regulatory status — FDA cleared, approved, or neither?",
    severity: "flag",
  },
  {
    test: /\b(?:medical spa|medspa|med[-\s]?spa)\b/i,
    category: "Setting label without oversight detail",
    hides: "The label does not say who the supervising licensee is or whether they are on site.",
    ask: "Who is the supervising medical licensee, and are they physically on site during my appointment?",
    severity: "flag",
  },
  {
    test: /\b(?:(?<!semi[-\s])permanent(?:ly)?|forever|lifetime results)\b/i,
    category: "Permanence claim",
    hides: "Maintenance schedule, retreatment cost, and what happens when the effect fades.",
    ask: "What is the realistic duration, and what does upkeep cost per year?",
    severity: "hard",
  },
  {
    test: /\b(?:guarantee[ds]?|money[-\s]?back|risk[-\s]?free|zero risk)\b/i,
    category: "Certainty claim",
    hides:
      "An outcome guarantee is not a clinical claim. Measurement method and accountable party stay unnamed.",
    ask: "What specifically is guaranteed, measured how, and by whom?",
    severity: "hard",
  },
  {
    test: /\b(?:today only|expires|last chance|limited spots|flash|book now to lock)\b/i,
    category: "Time pressure",
    hides:
      "Urgency pressure on an elective medical decision. Time to read consent and verify credentials.",
    ask: "Is this price still available after a proper consultation, or only under time pressure?",
    severity: "flag",
  },
  {
    test: /\b(?:specials?|deals?|discounts?|package of \d+|bogo)\b|\$?\d+\s?(?:per|\/)\s?(?:unit|area)/i,
    category: "Price-led framing",
    hides: "Product identity, units, dilution, and who performs the service.",
    ask: "Which product, how many units, and which licensed person administers it?",
    severity: "note",
  },
  {
    test: /\b(?:detox\w*|toxin release|boosts? immunity|immune boost|reset your|cellular renewal|lymphatic drainage cures)\b/i,
    category: "Mechanism language without a mechanism",
    hides:
      "Mechanism claims with thin evidence. What is measured, how, and by whom remains unspoken.",
    ask: "What is the specific mechanism claim, and what evidence supports it for this outcome?",
    severity: "flag",
  },
  {
    test: /\b(?:instant(?:ly|aneous)?|immediate results|walk out (?:looking|glowing)|see results in one)\b/i,
    category: "Timeline compression",
    hides: "Swelling, settling period, and the honest review window.",
    ask: "When is the follow-up review, and what does it cost?",
    severity: "note",
  },
  {
    test: /\bFDA[-\s]?approved\b/i,
    category: "Regulatory borrowing",
    hides:
      "Conflates device clearance with treatment appropriateness. Clearance is device- and indication-specific.",
    ask: "Cleared or approved for exactly which indication, and does that match what you're proposing for me?",
    severity: "flag",
  },
  {
    test: /\b(?:award\w*|voted|best in|celebrit\w*|as seen)\b|#1\b/i,
    category: "Reputation substitution",
    hides: "Credentials, medical director identity, and the written complication protocol.",
    ask: "Who is the medical director, and can I verify credentials and the complication protocol?",
    severity: "note",
  },
  {
    test: /\b(?:painless|gentle enough for anyone|safe for everyone|all skin types, no exceptions)\b/i,
    category: "Universality claim",
    hides:
      "Screening, especially for light and energy on deeper tones, and the intake conversation.",
    ask: "What device and settings, and how do you screen my skin type and history first?",
    severity: "flag",
  },
  {
    test: /\b(?:memberships?|auto[-\s]?renew\w*|prepay\w*|credits expire|subscriptions?)\b/i,
    category: "Commitment structure",
    hides: "Exit terms, refund policy, and what happens to unused sessions.",
    ask: "What are the written cancellation and unused-credit terms?",
    severity: "flag",
  },
  {
    test: /\b(?:signature|proprietary protocol|proprietary blend|our own blend|house blend)\b/i,
    category: "Signature / proprietary language",
    hides: "The actual products, concentrations, device settings, or ingredients inside the name.",
    ask: "What are the actual products, concentrations, or device settings in it?",
    severity: "flag",
  },
  {
    test: /\b(?:injection specialist|aesthetic provider|skin expert|master injector|skin specialist)\b/i,
    category: "Title without defined scope",
    hides: "A title with no defined scope. License, board, and supervising physician stay unnamed.",
    ask: "What is your license, and who is the supervising physician?",
    severity: "flag",
  },
  {
    test: /\b(?:customized just for you|custom protocol|tailored to you)\b/i,
    category: "Customization claim",
    hides: "Whether assessment changes anything, who performs it, and what actually varies.",
    ask: "Customized based on what assessment, by whom, and what changes for my case?",
    severity: "note",
  },
];

/** Quote at most `n` characters, and say so when the quote was cut. */
const quote = (s: string, n = 180) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

export function decodeClaims(text: string): DecodedClaim[] {
  if (!has(text)) return [];
  const out: DecodedClaim[] = [];
  const sentences = text.split(/(?<=[.!?;])\s+|\n+/).filter((s) => s.trim());
  for (const rule of CLAIM_RULES) {
    const sentence = sentences.find((s) => rule.test.test(s));
    let phrase: string;
    if (sentence) {
      phrase = quote(sentence);
    } else {
      // The rule only matches across a sentence boundary. Quoting the whole
      // pasted block back as "the phrase" would put words in the venue's mouth,
      // so quote exactly what matched and nothing around it.
      const m = rule.test.exec(text);
      if (!m) continue;
      phrase = quote(m[0]);
    }
    out.push({
      phrase,
      category: rule.category,
      hides: rule.hides,
      ask: rule.ask,
      severity: rule.severity,
    });
  }
  return out;
}

/**
 * Everything the decoder reads. `promiseScore` and `assess` share it, so the
 * Promise number can never be 0 while flagged claims are on the desk.
 */
export const claimText = (input: EvalInput) =>
  [input.marketing, input.menuLine, input.seriesPressure]
    .map((v) => (isNoAnswer(v) ? "" : v.trim()))
    .filter(Boolean)
    .join("\n");

/** Marketing density: how much of the copy is persuasion vs specification. */
function promiseScore(input: EvalInput, claims: DecodedClaim[]): number {
  const text = claimText(input);
  if (!has(text)) return 0;
  const severityLoad = claims.reduce(
    (n, c) => n + (c.severity === "hard" ? 26 : c.severity === "flag" ? 16 : 8),
    0,
  );
  const specificity =
    (has(input.product) && !containsAny(input.product, VAGUE_PRODUCT) ? 14 : 0) +
    (hasLicenseEvidence(`${input.performer} ${input.license}`) ? 12 : 0) +
    (/\d/.test(text) && /\b(?:unit|ml|%|mg|joule|nm|session)\b/i.test(text) ? 10 : 0);
  // Base weight for having copy at all: a written-out sentence carries more
  // persuasion surface than a fragment. Flagged patterns are counted ONCE, at
  // half weight, on top of it — they used to be added inside this base AND
  // again outside it, which double-counted every flag and, because the base was
  // capped at 40, quietly shrank what each extra flag was worth.
  const base = words(text) > 6 ? 18 : 8;
  return clamp(base + severityLoad / 2 - specificity, 0, 100);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/* ------------------------------------------------------------- signals */

function buildSignals(input: EvalInput): Signal[] {
  const medical = MEDICAL_CLASSES.includes(input.serviceClass);
  const s: Signal[] = [];

  // 1 — menu identity
  const menuNamed = has(input.menuLine);
  const menuVague = menuNamed && containsAny(input.menuLine, VAGUE_PRODUCT);
  // One word is a category, not a line item. This used to score "partial" while
  // printing the affirmative "nameable line item" sentence beside the chip.
  const menuThin = menuNamed && !menuVague && words(input.menuLine) < 2;
  s.push({
    id: "menu",
    label: "Menu identity",
    weight: 14,
    depth: "fast",
    refused: isNoAnswer(input.menuLine),
    state: !menuNamed ? "fail-closed" : menuVague || menuThin ? "partial" : "known",
    reading: isNoAnswer(input.menuLine)
      ? refusedReading("for the exact menu line")
      : !menuNamed
        ? "No menu line on the desk. The service being bought is unnamed."
        : menuVague
          ? `"${input.menuLine.trim()}" reads as a brand name, not a described service.`
          : menuThin
            ? `"${input.menuLine.trim()}" is one word, not a described line item. It does not say what is done, with what, or for how long.`
            : `"${input.menuLine.trim()}" is a nameable line item that can be quoted back.`,
    ask: "Read me the exact menu line and what it includes, step by step.",
  });

  // 2 — venue identity
  const vp = VENUE_PROFILES[input.venue];
  const mismatch = medical && (vp.oversight === "none" || vp.oversight === "unknown");
  s.push({
    id: "venue",
    label: "Setting type + oversight implied",
    weight: 14,
    depth: "fast",
    state:
      input.venue === "unclear"
        ? "fail-closed"
        : mismatch
          ? "partial"
          : vp.oversight === "mixed"
            ? "partial"
            : "known",
    reading:
      input.venue === "unclear"
        ? "Setting class unresolved. Spa, hotel spa, suite rental, med-spa, and clinic carry different oversight."
        : mismatch
          ? `${SERVICE_LABELS[input.serviceClass]} offered in a ${vp.short.toLowerCase()} setting — a class/setting question that has to be explained, not assumed. ${vp.note}`
          : `${vp.label} named. ${vp.note}`,
    ask: "Which kind of setting is this, and under whose license does this specific service operate?",
  });

  // 2b — jurisdiction
  const region = regionOf(input.region);
  s.push({
    id: "region",
    label: "Jurisdiction named",
    weight: 8,
    depth: "fast",
    /**
     * "Other US state" and "Elsewhere / international" name a bucket, not a
     * jurisdiction. Neither one tells you which board issued the license or
     * which scope-of-practice rules apply, so neither resolves this signal.
     * `us-other` used to score a full KNOWN while its own note told the reader
     * to go and name their state — the chip contradicted the sentence beside it.
     */
    state: UNRESOLVED_REGIONS.has(input.region)
      ? input.region === "unstated"
        ? "fail-closed"
        : "partial"
      : "known",
    reading:
      input.region === "unstated"
        ? "No jurisdiction on the desk. Scope of practice, supervision rules, and the board you would search all depend on it."
        : input.region === "us-other" || input.region === "other"
          ? `${region.label} names a bucket, not a jurisdiction. ${region.note}`
          : `${region.label}. ${region.note}`,
    ask: "Which state or country licenses the person performing this, and which board issued that license?",
  });

  // 3 — performer + license
  const perfRefused = isNoAnswer(input.performer) || isNoAnswer(input.license);
  const licensed = hasLicenseEvidence(`${input.performer} ${input.license}`);
  // Role words and nothing else ("our team", "the specialist") identify nobody,
  // so nothing is resolved. Anything else — including a person's name — does
  // name someone, and the engine says only that the LICENSE is missing. It used
  // to call every unmatched entry "a job title", which told a reader who typed
  // "Maria Gonzalez" that her name was a job title.
  const roleOnly = !licensed && roleWordsOnly(`${input.performer} ${input.license}`);
  s.push({
    id: "performer",
    label: "Who performs it + license",
    weight: 18,
    depth: "fast",
    refused: perfRefused,
    state: !has(input.performer)
      ? "fail-closed"
      : licensed
        ? "known"
        : roleOnly
          ? "fail-closed"
          : "partial",
    reading: perfRefused
      ? refusedReading("who performs it and under which license")
      : !has(input.performer)
        ? "The performing person is unnamed. This is the single most consequential gap."
        : licensed
          ? `Performer described with a license type (${input.performer.trim()}${has(input.license) ? ` · ${input.license.trim()}` : ""}). Verifiable against the state board.`
          : roleOnly
            ? `"${input.performer.trim()}" names a role, not a person and not a license. Nobody in particular has been identified.`
            : `"${input.performer.trim()}" carries no license evidence. Somebody is named; which license they hold, and which board issued it, is a separate answer.`,
    ask: "What is the performer's license type and license number, so I can check the state board?",
  });

  // 4 — product / device identity
  const prodVague = containsAny(input.product, VAGUE_PRODUCT);
  const catalogHit = has(input.product)
    ? (matchProduct(input.product) ?? matchService(input.product))
    : null;
  s.push({
    id: "product",
    label: "Exact product / device",
    weight: 16,
    depth: "fast",
    refused: isNoAnswer(input.product),
    state: !has(input.product) ? "fail-closed" : prodVague ? "fail-closed" : "known",
    reading: isNoAnswer(input.product)
      ? refusedReading("which product or device is used")
      : !has(input.product)
        ? "No product or device named. Nothing about strength, clearance, or dilution can be checked."
        : prodVague
          ? `"${input.product.trim()}" is tier language, not a product. Treated as unresolved.`
          : catalogHit
            ? `"${input.product.trim()}" is a checkable name. ${catalogHit.silent}`
            : `"${input.product.trim()}" is a checkable name — manufacturer, indication, and labeling can be read independently.`,
    ask: "What is the brand name printed on the box, vial, or device panel?",
    ...(catalogHit ? { note: catalogHit.silent } : {}),
  });

  // 5 — supervision
  const supNamed = has(input.supervision);
  const supOnSite =
    supNamed && /on site|onsite|present|in the building|same suite/i.test(input.supervision);
  const supOffSite =
    supNamed &&
    !supOnSite &&
    /remote|telehealth|off site|offsite|phone|by chart|available by/i.test(input.supervision);
  s.push({
    id: "supervision",
    label: "Oversight on site",
    weight: medical ? 14 : 8,
    depth: "full",
    refused: isNoAnswer(input.supervision),
    // An empty field is an unknown for every class, not a half-answer for the
    // non-medical ones. This used to hand 45% of the weight to a desk where
    // nothing had been entered at all.
    state: !supNamed ? "fail-closed" : supOnSite ? "known" : "partial",
    reading: isNoAnswer(input.supervision)
      ? refusedReading("who supervises and whether they are on site")
      : !supNamed
        ? medical
          ? "Medical oversight unstated for a class that usually requires it."
          : "Oversight unstated. Lower stakes for this class, and still nothing named."
        : supOnSite
          ? input.supervision.trim()
          : supOffSite
            ? `"${input.supervision.trim()}" places oversight somewhere other than the room. Off site is an answer, but not the same answer as on site — ask who is physically present while you are treated.`
            : `"${input.supervision.trim()}" does not say whether the supervising licensee is on site while you are treated.`,
    ask: "Who supervises, and are they on site while my service is performed?",
  });

  // 6 — sanitation signals
  // One regex for the chip and the sentence: a reader was previously shown
  // "Known" beside a sentence calling the same answer decor.
  const sanitationPractice = has(input.sanitation) && SANITATION_PRACTICE.test(input.sanitation);
  s.push({
    id: "sanitation",
    label: "Sanitation signals",
    weight: 12,
    depth: "full",
    refused: isNoAnswer(input.sanitation),
    state: !has(input.sanitation) ? "fail-closed" : sanitationPractice ? "known" : "partial",
    reading: isNoAnswer(input.sanitation)
      ? refusedReading("how tools and packaging are handled between clients")
      : !has(input.sanitation)
        ? "No sanitation practice described. Cleanliness of a room is decor, not a practice."
        : sanitationPractice
          ? input.sanitation.trim()
          : `"${input.sanitation.trim()}" describes appearance more than procedure.`,
    ask: "Is packaging opened in front of me, and how are reusable tools processed between clients?",
  });

  // 7 — after-hours ownership
  const nightQueued = /voicemail|email|front desk|business hours|instagram|dm/i.test(
    input.afterHours,
  );
  const nightOwned =
    !nightQueued &&
    /\b(?:named|direct(?:ly)?|cell|licensee|on[- ]call|physician|24\/7)\b/i.test(input.afterHours);
  s.push({
    id: "afterhours",
    label: "After-hours ownership",
    weight: 14,
    depth: "full",
    refused: isNoAnswer(input.afterHours),
    state: !has(input.afterHours)
      ? "fail-closed"
      : nightOwned
        ? "known"
        : nightQueued
          ? "fail-closed"
          : "partial",
    reading: isNoAnswer(input.afterHours)
      ? refusedReading("who is reachable after hours")
      : !has(input.afterHours)
        ? "Nobody owns the night. If something changes at 9pm, there is no named path."
        : nightQueued
          ? `"${input.afterHours.trim()}" routes a possible complication to a queue. Treated as unresolved.`
          : input.afterHours.trim(),
    ask: "If something changes tonight, which named licensed person do I reach, and how?",
  });

  // 8 — consent + record
  s.push({
    id: "consent",
    label: "Written consent + record",
    weight: 10,
    depth: "full",
    refused: isNoAnswer(input.consent),
    // Nothing entered is nothing known. This was "partial" unconditionally,
    // which paid out 45% of the weight for an untouched field.
    state: !has(input.consent)
      ? "fail-closed"
      : /written|form|in advance|before payment|copy|chart|photo/i.test(input.consent)
        ? "known"
        : "partial",
    reading: isNoAnswer(input.consent)
      ? refusedReading("to read the consent form before paying")
      : !has(input.consent)
        ? "Consent process unstated. Nothing on the desk says what you would sign, or when. Ask to read it before paying, not on the table."
        : input.consent.trim(),
    ask: "Can I read the consent form and keep a copy before I pay?",
  });

  return s;
}

/* -------------------------------------------------------------- burden */

const CLASS_BURDEN: Record<ServiceClass, { base: number; note: string }> = {
  unselected: {
    base: 30,
    note: "Class unnamed — burden cannot be aimed until the service class is chosen.",
  },
  facial: { base: 18, note: "Low structural burden; product identity still matters." },
  injectable: {
    base: 62,
    note: "Injectable class: dosing, product identity, and complication path carry the burden.",
  },
  device: {
    base: 55,
    note: "Device class: settings, operator training, and skin-type screening carry the burden.",
  },
  bodywork: { base: 14, note: "Low structural burden; scope and pressure consent still apply." },
  chemical: {
    base: 48,
    note: "Resurfacing class: depth, aftercare, and sun discipline carry the burden.",
  },
  iv: {
    base: 58,
    note: "Infusion class: sterile technique and medical oversight carry the burden.",
  },
  other: { base: 30, note: "Class unresolved, so burden is estimated conservatively." },
};

function burdenOf(input: EvalInput, signals: Signal[], claims: DecodedClaim[]) {
  const cls = CLASS_BURDEN[input.serviceClass];
  const drivers = [cls.note];
  let score = cls.base;

  const vp = VENUE_PROFILES[input.venue];
  if (vp.burden) {
    score += vp.burden;
    drivers.push(`${vp.label}: ${vp.note}`);
  }
  if (
    MEDICAL_CLASSES.includes(input.serviceClass) &&
    (vp.oversight === "none" || vp.oversight === "unknown")
  ) {
    score += 14;
    drivers.push(
      `Higher-burden class in a ${vp.short.toLowerCase()} setting, where medical oversight is not implied by the name.`,
    );
  }
  if (input.region === "unstated") {
    score += 8;
    drivers.push("Jurisdiction unnamed, so there is no board to check the license against.");
  }

  const fc = signals.filter((s) => s.state === "fail-closed").length;
  if (fc) {
    score += fc * 4;
    drivers.push(`${fc} unnamed item${fc > 1 ? "s" : ""} adds verification work before booking.`);
  }
  const refusedCount = signals.filter((s) => s.refused).length;
  if (refusedCount) {
    score += refusedCount * 7;
    drivers.push(
      `${refusedCount} question${refusedCount > 1 ? "s" : ""} asked and declined. A declined question does not resolve by asking it the same way again — it has to be answered in writing or taken as the answer.`,
    );
  }
  if (has(input.seriesPressure) && /\d/.test(input.seriesPressure)) {
    score += 8;
    drivers.push(`Series/maintenance commitment stated: ${input.seriesPressure.trim()}.`);
  }
  if (claims.some((c) => c.category === "Commitment structure")) {
    score += 6;
    drivers.push("Membership or prepay structure extends the commitment past one visit.");
  }
  if (claims.some((c) => c.category === "Permanence claim")) {
    score += 6;
    drivers.push("Permanence language usually conceals a maintenance schedule.");
  }

  score = clamp(score, 0, 100);
  const band = score >= 70 ? "High" : score >= 45 ? "Moderate" : score >= 25 ? "Contained" : "Low";
  return { score, band, drivers };
}

/* ------------------------------------------------------------- assemble */

/**
 * One sentence per gap state, so no view has to invent one from the number.
 * Only `level` is allowed to sound reassuring, and only because it requires
 * that nothing is left unnamed.
 */
const gapLineFor = (state: GapState, open: number, total: number): string => {
  switch (state) {
    case "no-promise":
      return "No copy on the desk, so there is no promise to weigh the place against. An empty column is not parity — paste what you were sold on and the comparison becomes possible.";
    case "no-place":
      return "There is copy on the desk and nothing named behind it. Not a narrow gap: the place has not been described at all yet.";
    case "promise-far-ahead":
      return "The promise is far ahead of the place. Everything below stays open until a person answers it out loud.";
    case "promise-ahead":
      return "The promise is running ahead of the place. Closeable in one conversation.";
    case "level-unresolved":
      return `The copy is not overselling. That is not the same as the room being answered — ${open} of ${total} signals are still unnamed, and quiet marketing is not disclosure.`;
    case "level":
      return "The place is keeping pace with the promise. Verify, don't discover.";
  }
};

export function assess(input: EvalInput): Assessment {
  const signals = buildSignals(input);
  const promiseText = claimText(input);
  const claims = decodeClaims(promiseText);
  const register = matchRegister(promiseText);

  const maxWeight = signals.reduce((n, s) => n + s.weight, 0);
  const earned = signals.reduce(
    (n, s) => n + (s.state === "known" ? s.weight : s.state === "partial" ? s.weight * 0.45 : 0),
    0,
  );
  // A refusal scores below silence, as the desk tells the reader it does.
  // Silence earns nothing; a declined question subtracts half the weight of the
  // signal it was asked about. The floor is still 0 — an untouched desk and a
  // wholly refused desk both read 0% resolved — but the refusals stay visible
  // in the ledger, the burden, the stage readout and the packet.
  const refusedLoad = signals.reduce((n, s) => n + (s.refused ? s.weight * 0.5 : 0), 0);
  const place = clamp(((earned - refusedLoad) / maxWeight) * 100, 0, 100);
  const promise = promiseScore(input, claims);

  const known = signals.filter((s) => s.state === "known");
  const failClosed = signals.filter((s) => s.state === "fail-closed");
  const partials = signals.filter((s) => s.state === "partial");
  const refused = signals.filter((s) => s.refused);

  const unknowns = [...failClosed, ...partials].map((s) => `${s.label} — ${s.reading}`);

  // Severity order, not stage order. The old list took the first four
  // fail-closed items before any hard claim, so a fifth and sixth item could
  // push the highest-severity finding on the desk off the end of the list.
  const nextSteps = dedupe([
    ...refused.map((s) => s.ask),
    ...claims.filter((c) => c.severity === "hard").map((c) => c.ask),
    ...failClosed.filter((s) => !s.refused).map((s) => s.ask),
    ...partials.map((s) => s.ask),
  ]).slice(0, 6);

  const anyInput =
    has(input.menuLine) ||
    has(input.product) ||
    has(input.performer) ||
    has(input.marketing) ||
    input.region !== "unstated" ||
    input.venue !== "unclear" ||
    input.serviceClass !== "unselected";

  const posture = !anyInput
    ? {
        key: "empty" as const,
        label: "Desk empty",
        line: "Nothing on the desk yet. Four fields is enough to start.",
      }
    : failClosed.length === 0 && place >= 78
      ? {
          key: "resolved" as const,
          label: "Setting largely resolved",
          line: "The room answers most of the questions a booking should answer. Remaining items are verification, not discovery.",
        }
      : failClosed.length <= 2
        ? {
            key: "partial" as const,
            label: "Partly resolved",
            line: "Enough is named to have a real conversation. The listed gaps are what that conversation is for.",
          }
        : {
            key: "unresolved" as const,
            label: "Setting unresolved — too much is unnamed to treat marketing as information.",
            line: "Too much of the setting is unnamed to treat marketing as information. These stay open until answered out loud.",
          };

  const identityLine = anyInput
    ? [
        has(input.menuLine) ? `"${input.menuLine.trim()}"` : "unnamed service",
        input.serviceClass === "unselected"
          ? "class not selected"
          : SERVICE_LABELS[input.serviceClass].toLowerCase(),
        `in a ${VENUE_PROFILES[input.venue].short.toLowerCase()} setting`,
        input.region === "unstated" ? "jurisdiction unnamed" : regionOf(input.region).label,
      ].join(" · ")
    : "No service on the desk";

  const gap = clamp(promise - place, -100, 100);
  // `gap <= 0` is not parity. With no marketing copy on the desk the promise is
  // 0 by construction, and the gap is negative for a room where nothing at all
  // has been named. The state says which of those it is; the number alone
  // cannot, and a caller reading only the number prints a reassurance.
  const gapState: GapState = !has(promiseText)
    ? "no-promise"
    : place === 0
      ? "no-place"
      : gap > 30
        ? "promise-far-ahead"
        : gap > 5
          ? "promise-ahead"
          : failClosed.length
            ? "level-unresolved"
            : "level";
  const gapLine = gapLineFor(gapState, failClosed.length + partials.length, signals.length);

  return {
    input,
    signals,
    place,
    promise,
    gap,
    gapState,
    gapLine,
    burden: burdenOf(input, signals, claims),
    claims,
    register,
    known,
    failClosed,
    refused,
    unknowns,
    nextSteps,
    posture,
    identityLine,
  };
}

function dedupe(a: string[]) {
  return Array.from(new Set(a.filter(Boolean)));
}

/* ------------------------------------------------- consultation prep */

export interface PrepQuestion {
  id: string;
  group: string;
  text: string;
  why: string;
}

const CLASS_PREP: Partial<Record<ServiceClass, PrepQuestion[]>> = {
  injectable: [
    {
      id: "tox-product-units",
      group: "Neuromodulators",
      text: "Which product by name, and how many units for my areas?",
      why: "Brand and unit count are the minimum identity for a toxin plan.",
    },
    {
      id: "tox-who",
      group: "Neuromodulators",
      text: "Who injects, what is their license, and who supervises?",
      why: "Title is not scope. License and supervision are checkable.",
    },
    {
      id: "tox-duration-droop",
      group: "Neuromodulators",
      text: "Realistic duration, and the plan if I get asymmetry or a droop?",
      why: "Duration and complication pathway belong in writing before treatment.",
    },
    {
      id: "tox-cost-followup",
      group: "Neuromodulators",
      text: "Total cost including any recommended follow-up?",
      why: "Per-unit price is not the course cost.",
    },
    {
      id: "tox-show-vial",
      group: "Neuromodulators",
      text: "Will you show me the vial and the units?",
      why: "Seeing the labeled product is basic disclosure, not a favor.",
    },
    {
      id: "filler-product",
      group: "Fillers",
      text: "Exactly which filler and how many syringes?",
      why: "Family name is not product identity; volume is not optional.",
    },
    {
      id: "filler-hyaluronidase",
      group: "Fillers",
      text: "Is hyaluronidase reversal on site, and who manages a vascular occlusion emergency?",
      why: "Reverse-agent path and accountable clinician must be named before placement.",
    },
    {
      id: "filler-license",
      group: "Fillers",
      text: "Injector license and supervising physician?",
      why: "Both answers are required for medical-class injection.",
    },
    {
      id: "filler-consent",
      group: "Fillers",
      text: "Written consent and before/after photos?",
      why: "Consent under time pressure is incomplete disclosure.",
    },
    {
      id: "filler-duration",
      group: "Fillers",
      text: "Expected duration and touch-up cost?",
      why: "Maintenance is part of the real cost.",
    },
  ],
  device: [
    {
      id: "energy-device",
      group: "Energy devices / lasers / IPL",
      text: "What is the exact device and settings, and its clearance for my indication?",
      why: "Platform and indication clearance are not interchangeable with marketing names.",
    },
    {
      id: "energy-skin",
      group: "Energy devices / lasers / IPL",
      text: "How do you assess my skin type and history, and the risk on my skin tone?",
      why: "Universality language is not a screening protocol.",
    },
    {
      id: "energy-who",
      group: "Energy devices / lasers / IPL",
      text: "Who operates it, and who is the medical director?",
      why: "Operator and director are separate answers.",
    },
    {
      id: "energy-downtime",
      group: "Energy devices / lasers / IPL",
      text: "Downtime, and the protocol for a burn or pigment change?",
      why: "Recovery and complication ownership belong in the disclosure.",
    },
    {
      id: "energy-sessions",
      group: "Energy devices / lasers / IPL",
      text: "Number of sessions and total cost?",
      why: "Single-session price is not the course cost.",
    },
    {
      id: "rf-platform",
      group: "RF microneedling",
      text: "What platform, by name, and what depth/energy settings?",
      why: "Signature branding is not a platform name or settings.",
    },
    {
      id: "rf-tips",
      group: "RF microneedling",
      text: "Single-use sterile tips, shown to me?",
      why: "Sterile tip identity is a basic sanitation disclosure.",
    },
    {
      id: "rf-who",
      group: "RF microneedling",
      text: "Operator license and physician oversight?",
      why: "Both must be named for barrier-crossing energy work.",
    },
    {
      id: "rf-infection",
      group: "RF microneedling",
      text: "Downtime and the infection/scarring protocol?",
      why: "Infection and scarring pathway is part of the service disclosure.",
    },
    {
      id: "rf-timeline",
      group: "RF microneedling",
      text: "Realistic result timeline and maintenance?",
      why: "Maintenance is part of the real cost.",
    },
    {
      id: "contour-device",
      group: "Body contouring",
      text: "Which device, cleared for what, and the realistic expected change — not guaranteed inches?",
      why: "Outcome guarantees are not device identity or clearance.",
    },
    {
      id: "contour-who",
      group: "Body contouring",
      text: "Who operates and who supervises?",
      why: "Operator and supervisor must both be named.",
    },
    {
      id: "contour-pah",
      group: "Body contouring",
      text: "Known risks (e.g. paradoxical adipose hyperplasia) and how they're handled?",
      why: "Named risks and ownership are part of disclosure.",
    },
    {
      id: "contour-cost",
      group: "Body contouring",
      text: "Total cost across the recommended areas?",
      why: "Per-area specials hide course cost.",
    },
    {
      id: "contour-guarantee",
      group: "Body contouring",
      text: "What actually happens if a guarantee isn't met?",
      why: "Guarantee language without a written remedy is incomplete.",
    },
  ],
  chemical: [
    {
      id: "peel-acids",
      group: "Chemical peels",
      text: "Which acid(s), concentration, and pH — or the branded peel's ingredient list?",
      why: "Medical-grade is not an ingredient list.",
    },
    {
      id: "peel-who",
      group: "Chemical peels",
      text: "Operator license and supervising clinician?",
      why: "Depth and accountability travel together.",
    },
    {
      id: "peel-aftercare",
      group: "Chemical peels",
      text: "Aftercare, sun protection, and the plan for prolonged redness or hyperpigmentation?",
      why: "Aftercare ownership is part of the service disclosure.",
    },
    {
      id: "peel-tone",
      group: "Chemical peels",
      text: "Suitability for my skin tone and history?",
      why: "Screening must be stated, not assumed.",
    },
    {
      id: "peel-series",
      group: "Chemical peels",
      text: "How many in a series, and spacing?",
      why: "Series pressure without a plan is incomplete cost disclosure.",
    },
  ],
  iv: [
    {
      id: "iv-contents",
      group: "IV / injectable wellness",
      text: "What is in the drip, at what doses, and what exactly is claimed?",
      why: "Custom blend is not a contents list.",
    },
    {
      id: "iv-who",
      group: "IV / injectable wellness",
      text: "Who places the line, and who is the overseeing clinician?",
      why: "Line placement and oversight are separate licenses.",
    },
    {
      id: "iv-evidence",
      group: "IV / injectable wellness",
      text: "What evidence supports the claimed benefit?",
      why: "Mechanism language is not evidence.",
    },
    {
      id: "iv-membership",
      group: "IV / injectable wellness",
      text: "Membership terms, auto-renewal, and credit expiry?",
      why: "Commitment structure must be readable before payment.",
    },
  ],
};

/** The reader's ticks and verbatim wording, structurally typed to avoid a cycle. */
export interface PrepRecord {
  checked: Record<string, boolean>;
  answers: Record<string, string>;
}

/** One line of the consult record, ready to typeset. */
export interface NotedAnswer {
  id: string;
  group: string;
  text: string;
  checked: boolean;
  /** Exactly what the reader wrote, or "" when they only ticked the box. */
  said: string;
  /** False when no generated or carried question owns this id any more. */
  captioned: boolean;
}

/**
 * Everything the reader ticked or wrote, whatever produced the question.
 *
 * The packet used to derive this from `prepSheet(a)` alone and keep only the
 * ids that survived the filter. Two classes of note fell silently on the floor:
 * questions carried in from another desk, whose ids come from
 * `arrivalQuestions` and were never in `prepSheet`; and questions that stopped
 * being generated because the reader closed the gap that produced them. The
 * card promised to print what was said and printed nothing.
 *
 * So the reader's own record is the source of truth here, and the question list
 * only captions it. An id with no caption still prints, with its wording.
 */
export function notedAnswers(prep: PrepRecord, known: PrepQuestion[]): NotedAnswer[] {
  const byId = new Map<string, PrepQuestion>();
  for (const q of known) if (!byId.has(q.id)) byId.set(q.id, q);

  const ids = Array.from(new Set([...Object.keys(prep.checked), ...Object.keys(prep.answers)]));
  const out: NotedAnswer[] = [];
  for (const id of ids) {
    const checked = Boolean(prep.checked[id]);
    const said = (prep.answers[id] ?? "").trim();
    if (!checked && !said) continue;
    const q = byId.get(id);
    out.push({
      id,
      group: q?.group ?? "Asked in the room",
      text: q?.text ?? "Question no longer on the generated sheet — your wording is kept verbatim.",
      checked,
      said,
      captioned: Boolean(q),
    });
  }
  return out;
}

export function prepSheet(a: Assessment): PrepQuestion[] {
  const medical = MEDICAL_CLASSES.includes(a.input.serviceClass);
  const base: PrepQuestion[] = [
    {
      id: "identity",
      group: "Identity of the room",
      text: "Is this a spa, a medical spa, or a medical practice, and under whose license?",
      why: "The answer changes who is accountable for everything after it.",
    },
    {
      id: "person",
      group: "The person",
      text: "Who performs my service, what license do they hold, and what is the number?",
      why: "A title is marketing. A license number is checkable.",
    },
    {
      id: "thing",
      group: "The thing used on me",
      text: "What exact product or device — the name printed on the box or panel?",
      why: "Named products can be read about independently. Tiers cannot.",
    },
    {
      id: "sanitation",
      group: "Practice, not decor",
      text: "Will packaging be opened in front of me, and how are reusable tools processed?",
      why: "Sanitation is a procedure with steps, not an impression of a clean room.",
    },
    {
      id: "night",
      group: "After hours",
      text: "If something changes at 9pm, which named person do I reach, and how?",
      why: "A voicemail box is not an owner.",
    },
    {
      id: "paper",
      group: "Paper",
      text: "May I read the consent form and keep a copy before I pay?",
      why: "Consent read at the table is consent under pressure.",
    },
    {
      id: "cost",
      group: "Real cost",
      text: "What is the total for the recommended course, including maintenance for a year?",
      why: "Single-session pricing is rarely the actual commitment.",
    },
  ];
  if (medical) {
    base.splice(2, 0, {
      id: "supervision",
      group: "Oversight",
      text: "Is the supervising licensee on site during my appointment, or reachable remotely?",
      why: "On site and on call are different answers to the same question.",
    });
  }
  const fromGaps = a.failClosed.map((s) => ({
    id: `gap-${s.id}`,
    group: "Raised by your inputs",
    text: s.ask,
    why: s.reading,
  }));
  const fromClaims = a.claims
    .filter((c) => c.severity === "hard" || c.severity === "flag")
    .map((c, i) => ({
      id: `claim-${i}`,
      group: "Raised by marketing language",
      text: c.ask,
      why: c.hides,
    }));
  const classQs = CLASS_PREP[a.input.serviceClass] ?? [];
  const seen = new Set<string>();
  return [...fromGaps, ...fromClaims, ...classQs, ...base].filter((q) => {
    const k = q.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
