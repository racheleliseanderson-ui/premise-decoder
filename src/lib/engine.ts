/**
 * Spa Intelligence — setting evaluation engine.
 *
 * Education only. This module never diagnoses, never scores candidacy, never
 * ranks providers, and never predicts outcomes. It scores how much of the
 * SETTING is actually resolved by the information on hand, and keeps every
 * unresolved item visible (fail-closed) instead of smoothing it over.
 */

import { matchProduct, matchService } from "./catalog";

export type ServiceClass =
  "unselected" | "facial" | "injectable" | "device" | "bodywork" | "chemical" | "iv" | "other";

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
  burden: { score: number; band: string; drivers: string[] };
  claims: DecodedClaim[];
  known: Signal[];
  failClosed: Signal[];
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
<<<<<<< Updated upstream
    note: "The material does not resolve which kind of setting this is. Everything that follows inherits that gap.",
=======
    note: "The material does not say which kind of setting this is. Every question after it inherits that gap.",
>>>>>>> Stashed changes
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
    note: "Ask which authority licenses the performer and where a complaint would be filed. If nobody can answer that, treat it as unanswered.",
  },
];

export const regionOf = (id: string) => REGIONS.find((r) => r.id === id) ?? REGIONS[0]!;

/** Classes where the setting question changes materially. */
const MEDICAL_CLASSES: ServiceClass[] = ["injectable", "device", "iv", "chemical"];

/* ---------------------------------------------------------------- helpers */

const has = (v: string) => v.trim().length > 1 && !isNoAnswer(v);
const words = (v: string) => v.trim().split(/\s+/).filter(Boolean).length;
const lower = (v: string) => v.toLowerCase();

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

const LICENSE_TOKENS = [
  "rn",
  "np",
  "pa",
  "md",
  "do",
  "dnp",
  "aprn",
  "lme",
  "licensed esthetician",
  "esthetician license",
  "lmt",
  "massage license",
  "cosmetology",
  "physician",
  "dermatologist",
  "nurse",
  "license #",
  "lic #",
  "state license",
];

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
    test: /medical[-\s]?grade|pharmaceutical[-\s]?grade|clinical[-\s]?strength/i,
    category: "Unregulated tier language",
    hides:
      "Implies a regulated tier that does not exist. It replaces the product or device name and its real regulatory status.",
    ask: "Which exact product or device, and what is its real regulatory status — FDA cleared, approved, or neither?",
    severity: "flag",
  },
  {
    test: /medical spa|medspa|med[-\s]?spa/i,
    category: "Setting label without oversight detail",
    hides: "The label does not say who the supervising licensee is or whether they are on site.",
    ask: "Who is the supervising medical licensee, and are they physically on site during my appointment?",
    severity: "flag",
  },
  {
    test: /permanent|permanently|forever|lifetime results/i,
    category: "Permanence claim",
    hides: "Maintenance schedule, retreatment cost, and what happens when the effect fades.",
    ask: "What is the realistic duration, and what does upkeep cost per year?",
    severity: "hard",
  },
  {
    test: /guarantee|guaranteed|money[-\s]?back|risk[-\s]?free|zero risk/i,
    category: "Certainty claim",
    hides:
      "An outcome guarantee is not a clinical claim. Measurement method and accountable party stay unnamed.",
    ask: "What specifically is guaranteed, measured how, and by whom?",
    severity: "hard",
  },
  {
    test: /today only|expires|last chance|limited spots|flash|book now to lock/i,
    category: "Time pressure",
    hides:
      "Urgency pressure on an elective medical decision. Time to read consent and verify credentials.",
    ask: "Is this price still available after a proper consultation, or only under time pressure?",
    severity: "flag",
  },
  {
    test: /special|\$?\d+\s?(?:per|\/)\s?(?:unit|area)|deal|discount|package of \d+|bogo/i,
    category: "Price-led framing",
    hides: "Product identity, units, dilution, and who performs the service.",
    ask: "Which product, how many units, and which licensed person administers it?",
    severity: "note",
  },
  {
    test: /detox|toxin release|boost(?:s)? immunity|immune boost|reset your|cellular renewal|lymphatic drainage cures/i,
    category: "Mechanism language without a mechanism",
    hides:
      "Mechanism claims with thin evidence. What is measured, how, and by whom remains unspoken.",
    ask: "What is the specific mechanism claim, and what evidence supports it for this outcome?",
    severity: "flag",
  },
  {
    test: /instant|immediate results|walk out (?:looking|glowing)|see results in one/i,
    category: "Timeline compression",
    hides: "Swelling, settling period, and the honest review window.",
    ask: "When is the follow-up review, and what does it cost?",
    severity: "note",
  },
  {
    test: /FDA[-\s]?approved/i,
    category: "Regulatory borrowing",
    hides:
      "Conflates device clearance with treatment appropriateness. Clearance is device- and indication-specific.",
    ask: "Cleared or approved for exactly which indication, and does that match what you're proposing for me?",
    severity: "flag",
  },
  {
    test: /(?:award|voted|#1|best in|celebrity|as seen)/i,
    category: "Reputation substitution",
    hides: "Credentials, medical director identity, and the written complication protocol.",
    ask: "Who is the medical director, and can I verify credentials and the complication protocol?",
    severity: "note",
  },
  {
    test: /painless|gentle enough for anyone|safe for everyone|all skin types, no exceptions/i,
    category: "Universality claim",
    hides:
      "Screening, especially for light and energy on deeper tones, and the intake conversation.",
    ask: "What device and settings, and how do you screen my skin type and history first?",
    severity: "flag",
  },
  {
    test: /membership|auto[-\s]?renew|prepay|credits expire|subscription/i,
    category: "Commitment structure",
    hides: "Exit terms, refund policy, and what happens to unused sessions.",
    ask: "What are the written cancellation and unused-credit terms?",
    severity: "flag",
  },
  {
    test: /signature|proprietary protocol|proprietary blend|our own blend|house blend/i,
    category: "Signature / proprietary language",
    hides: "The actual products, concentrations, device settings, or ingredients inside the name.",
    ask: "What are the actual products, concentrations, or device settings in it?",
    severity: "flag",
  },
  {
    test: /injection specialist|aesthetic provider|skin expert|master injector|skin specialist/i,
    category: "Title without defined scope",
    hides: "A title with no defined scope. License, board, and supervising physician stay unnamed.",
    ask: "What is your license, and who is the supervising physician?",
    severity: "flag",
  },
  {
    test: /customized just for you|custom protocol|tailored to you/i,
    category: "Customization claim",
    hides: "Whether assessment changes anything, who performs it, and what actually varies.",
    ask: "Customized based on what assessment, by whom, and what changes for my case?",
    severity: "note",
  },
];

export function decodeClaims(text: string): DecodedClaim[] {
  if (!has(text)) return [];
  const out: DecodedClaim[] = [];
  const sentences = text.split(/(?<=[.!?;])\s+|\n+/).filter((s) => s.trim());
  for (const rule of CLAIM_RULES) {
    const hit = sentences.find((s) => rule.test.test(s)) ?? (rule.test.test(text) ? text : null);
    if (!hit) continue;
    out.push({
      phrase: hit.trim().slice(0, 180),
      category: rule.category,
      hides: rule.hides,
      ask: rule.ask,
      severity: rule.severity,
    });
  }
  return out;
}

/** Marketing density: how much of the sentence is persuasion vs specification. */
function promiseScore(input: EvalInput, claims: DecodedClaim[]): number {
  const text = `${input.marketing} ${input.menuLine}`.trim();
  if (!has(text)) return 0;
  const severityLoad = claims.reduce(
    (n, c) => n + (c.severity === "hard" ? 26 : c.severity === "flag" ? 16 : 8),
    0,
  );
  const specificity =
    (has(input.product) && !VAGUE_PRODUCT.some((v) => lower(input.product).includes(v)) ? 14 : 0) +
    (LICENSE_TOKENS.some((t) => lower(`${input.performer} ${input.license}`).includes(t))
      ? 12
      : 0) +
    (/\d/.test(text) && /\b(?:unit|ml|%|mg|joule|nm|session)\b/i.test(text) ? 10 : 0);
  const density = Math.min(40, Math.round((words(text) > 6 ? 18 : 8) + severityLoad / 2));
  return clamp(density + severityLoad / 2 - specificity, 0, 100);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/* ------------------------------------------------------------- signals */

function buildSignals(input: EvalInput): Signal[] {
  const medical = MEDICAL_CLASSES.includes(input.serviceClass);
  const s: Signal[] = [];

  // 1 — menu identity
  const menuVague = VAGUE_PRODUCT.some((v) => lower(input.menuLine).includes(v));
  s.push({
    id: "menu",
    label: "Menu identity",
    weight: 14,
    depth: "fast",
    state: !has(input.menuLine)
      ? "fail-closed"
      : menuVague || words(input.menuLine) < 2
        ? "partial"
        : "known",
    reading: !has(input.menuLine)
      ? "No menu line on the desk. The service being bought is unnamed."
      : menuVague
        ? `"${input.menuLine.trim()}" reads as a brand name, not a described service.`
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
        ? "The kind of setting has not been named. Spa, hotel spa, suite rental, med-spa, and clinic carry different oversight."
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
    state:
      input.region === "unstated" ? "fail-closed" : input.region === "other" ? "partial" : "known",
    reading:
      input.region === "unstated"
        ? "No jurisdiction on the desk. Scope of practice, supervision rules, and the board you would search all depend on it."
        : `${region.label}. ${region.note}`,
    ask: "Which state or country licenses the person performing this, and which board issued that license?",
  });

  // 3 — performer + license
  const perfText = lower(`${input.performer} ${input.license}`);
  const licensed = LICENSE_TOKENS.some((t) => perfText.includes(t));
  const vaguePerf = VAGUE_PERFORMER.some((t) => perfText.includes(t));
  s.push({
    id: "performer",
    label: "Who performs it + license",
    weight: 18,
    depth: "fast",
    state: !has(input.performer)
      ? "fail-closed"
      : licensed
        ? "known"
        : vaguePerf
          ? "partial"
          : "partial",
    reading: !has(input.performer)
      ? "The performing person is unnamed. This is the single most consequential gap."
      : licensed
        ? `Performer described with a license type (${input.performer.trim()}${has(input.license) ? ` · ${input.license.trim()}` : ""}). Verifiable against the state board.`
        : `"${input.performer.trim()}" is a job title, not a license. Title does not establish scope.`,
    ask: "What is the performer's license type and license number, so I can check the state board?",
  });

  // 4 — product / device identity
  const prodVague = VAGUE_PRODUCT.some((v) => lower(input.product).includes(v));
  const catalogHit = has(input.product)
    ? (matchProduct(input.product) ?? matchService(input.product))
    : null;
  s.push({
    id: "product",
    label: "Exact product / device",
    weight: 16,
    depth: "fast",
    state: !has(input.product) ? "fail-closed" : prodVague ? "fail-closed" : "known",
    reading: !has(input.product)
      ? "No product or device named. Nothing about strength, clearance, or dilution can be checked."
      : prodVague
        ? `"${input.product.trim()}" is tier language, not a product name. Counts as not stated.`
        : catalogHit
          ? `"${input.product.trim()}" is a checkable name. ${"silent" in catalogHit ? (catalogHit as { silent: string }).silent : ""}`
          : `"${input.product.trim()}" is a checkable name — manufacturer, indication, and labeling can be read independently.`,
    ask: "What is the brand name printed on the box, vial, or device panel?",
    ...(catalogHit && "silent" in catalogHit
      ? { note: (catalogHit as { silent: string }).silent }
      : {}),
  });

  // 5 — supervision
  s.push({
    id: "supervision",
    label: "Oversight on site",
    weight: medical ? 14 : 8,
    depth: "full",
    state: !has(input.supervision)
      ? medical
        ? "fail-closed"
        : "partial"
      : /on site|onsite|present|in the building|same suite/i.test(input.supervision)
        ? "known"
        : /remote|telehealth|off site|offsite|phone|by chart|available by/i.test(input.supervision)
          ? "partial"
          : "partial",
    reading: !has(input.supervision)
      ? medical
        ? "Medical oversight has not been stated, for a class that usually calls for it."
        : "Oversight unstated. Lower stakes here, still an open line."
      : input.supervision.trim(),
    ask: "Who supervises, and are they on site while my service is performed?",
  });

  // 6 — sanitation signals
  s.push({
    id: "sanitation",
    label: "Sanitation signals",
    weight: 12,
    depth: "full",
    state: !has(input.sanitation)
      ? "fail-closed"
      : /single[-\s]?use|sealed|autoclave|opened in front|new needle|sharps|log/i.test(
            input.sanitation,
          )
        ? "known"
        : "partial",
    reading: !has(input.sanitation)
      ? "No sanitation practice described. Cleanliness of a room is decor, not a practice."
      : /single[-\s]?use|sealed|autoclave|opened in front|new needle/i.test(input.sanitation)
        ? input.sanitation.trim()
        : `"${input.sanitation.trim()}" describes appearance more than procedure.`,
    ask: "Is packaging opened in front of me, and how are reusable tools processed between clients?",
  });

  // 7 — after-hours ownership
  s.push({
    id: "afterhours",
    label: "After-hours ownership",
    weight: 14,
    depth: "full",
    state: !has(input.afterHours)
      ? "fail-closed"
      : /named|direct|cell|licensee|on call|physician|24/i.test(input.afterHours)
        ? "known"
        : /voicemail|email|front desk|business hours|instagram|dm/i.test(input.afterHours)
          ? "fail-closed"
          : "partial",
    reading: !has(input.afterHours)
      ? "Nobody owns the night. If something changes at 9pm, there is no named path."
      : /voicemail|email|front desk|business hours|instagram|dm/i.test(input.afterHours)
        ? `"${input.afterHours.trim()}" routes a possible complication into a queue rather than to a named person. Counts as not stated.`
        : input.afterHours.trim(),
    ask: "If something changes tonight, which named licensed person do I reach, and how?",
  });

  // 8 — consent + record
  s.push({
    id: "consent",
    label: "Written consent + record",
    weight: 10,
    depth: "full",
    state: !has(input.consent)
      ? "partial"
      : /written|form|in advance|before payment|copy|chart|photo/i.test(input.consent)
        ? "known"
        : "partial",
    reading: !has(input.consent)
      ? "Consent process unstated. Ask to read it before paying, not on the table."
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
  other: { base: 30, note: "Service class not named yet, so this burden is a cautious estimate." },
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
    drivers.push(
<<<<<<< Updated upstream
      `${fc} unnamed item${fc > 1 ? "s" : ""} adds verification work before booking.`,
=======
      `${fc} thing${fc > 1 ? "s" : ""} the spa has not stated, each adding a question before you book.`,
>>>>>>> Stashed changes
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

export function assess(input: EvalInput): Assessment {
  const signals = buildSignals(input);
  const claims = decodeClaims(`${input.marketing}\n${input.menuLine}\n${input.seriesPressure}`);

  const maxWeight = signals.reduce((n, s) => n + s.weight, 0);
  const earned = signals.reduce(
    (n, s) => n + (s.state === "known" ? s.weight : s.state === "partial" ? s.weight * 0.45 : 0),
    0,
  );
  const place = clamp((earned / maxWeight) * 100, 0, 100);
  const promise = promiseScore(input, claims);

  const known = signals.filter((s) => s.state === "known");
  const failClosed = signals.filter((s) => s.state === "fail-closed");
  const partials = signals.filter((s) => s.state === "partial");

  const unknowns = [...failClosed, ...partials].map((s) => `${s.label} — ${s.reading}`);

  const nextSteps = dedupe([
    ...failClosed.slice(0, 4).map((s) => s.ask),
    ...claims.filter((c) => c.severity === "hard").map((c) => c.ask),
    ...partials.slice(0, 2).map((s) => s.ask),
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
        label: "Nothing on the desk yet",
        line: "Nothing entered yet. Four fields is enough to start.",
      }
    : failClosed.length === 0 && place >= 78
      ? {
          key: "resolved" as const,
          label: "The setting is largely named",
          line: "The room answers most of the questions a booking should answer. What is left is confirming, not discovering.",
        }
      : failClosed.length <= 2
        ? {
            key: "partial" as const,
            label: "Partly named",
            line: "Enough is named to have a real conversation. The listed gaps are what that conversation is for.",
          }
        : {
            key: "unresolved" as const,
<<<<<<< Updated upstream
            label: "Setting unresolved — too much is unnamed to treat marketing as information.",
            line: "Too much of the setting is unnamed to treat marketing as information. These stay open until answered out loud.",
=======
            label: "Too little named so far",
            line: "Most of the setting has not been named, so there is not enough here to treat the marketing as information. These stay open until someone answers them out loud.",
>>>>>>> Stashed changes
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

  return {
    input,
    signals,
    place,
    promise,
    gap: clamp(promise - place, -100, 100),
    burden: burdenOf(input, signals, claims),
    claims,
    known,
    failClosed,
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
