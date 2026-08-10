/**
 * Spa Intelligence — setting evaluation engine.
 *
 * Education only. This module never diagnoses, never scores candidacy, never
 * ranks providers, and never predicts outcomes. It scores how much of the
 * SETTING is actually resolved by the information on hand, and keeps every
 * unresolved item visible (fail-closed) instead of smoothing it over.
 */

export type ServiceClass =
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
  serviceClass: "facial",
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
    note: "The material does not resolve which kind of setting this is. Everything downstream inherits that gap.",
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
    hides: "No standard defines this tier. It replaces the product name, concentration, and pH.",
    ask: "What is the exact product name, active, and percentage on the label?",
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
    ask: "What is the maintenance interval and per-session cost after the initial series?",
    severity: "hard",
  },
  {
    test: /guarantee|guaranteed|risk[-\s]?free|no downtime at all|zero risk/i,
    category: "Certainty claim",
    hides: "Variability, non-responders, and the complication pathway.",
    ask: "What is written in the consent form about outcomes that do not meet expectation?",
    severity: "hard",
  },
  {
    test: /today only|expires|last chance|limited spots|flash|book now to lock/i,
    category: "Time pressure",
    hides: "Time to read consent, compare settings, and verify credentials.",
    ask: "Is the same price available after a 48-hour consultation gap?",
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
    hides: "What is actually measured, and by whom.",
    ask: "What measurable change is claimed, and how is it recorded before and after?",
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
    hides: "Whether the specific device, indication, and setting match the clearance.",
    ask: "Which exact device and which cleared indication — and is my use on-label?",
    severity: "flag",
  },
  {
    test: /(?:award|voted|#1|best in|celebrity|as seen)/i,
    category: "Reputation substitution",
    hides: "Credentials, product identity, and sanitation practice.",
    ask: "Setting the awards aside — who performs it and under what license?",
    severity: "note",
  },
  {
    test: /painless|gentle enough for anyone|safe for everyone|all skin types, no exceptions/i,
    category: "Universality claim",
    hides: "Screening, contraindications, and the intake conversation.",
    ask: "What conditions or medications would make you decline to treat me?",
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
    test: /off[-\s]?label|not FDA|compounded (?:semaglutide|tirzepatide|version)|research grade|for research use/i,
    category: "Off-label or compounded sourcing",
    hides: "Who prescribed it, which pharmacy compounded it, and what the label actually says.",
    ask: "Is this an on-label use of a brand product, or compounded — and by which licensed pharmacy?",
    severity: "hard",
  },
  {
    test: /before (?:and|&) after|real (?:client|patient) results|typical results shown|see our transformations/i,
    category: "Result imagery as evidence",
    hides: "Lighting, timing, unit counts, session totals, and non-responders who were not photographed.",
    ask: "For that photo: which product, how many units or sessions, and how long after treatment?",
    severity: "flag",
  },
  {
    test: /no consultation (?:needed|required)|walk[-\s]?ins welcome for (?:botox|filler|injections)|same[-\s]?day (?:injections|treatment) available/i,
    category: "Screening compression",
    hides: "The medical history, medication review, and examination that normally precede a medical-class service.",
    ask: "Who examines me before treatment, and is that person licensed to prescribe?",
    severity: "hard",
  },
  {
    test: /nurse[-\s]?owned|physician[-\s]?founded|doctor[-\s]?designed|medically (?:led|directed) by/i,
    category: "Credential proximity",
    hides: "Whether that licensee is present, treating, or supervising on the day you are treated.",
    ask: "Will that named licensee be on site during my appointment, and are they treating me?",
    severity: "flag",
  },
  {
    test: /all[-\s]?natural|holistic|chemical[-\s]?free|non[-\s]?toxic|clean beauty|plant[-\s]?based (?:injection|infusion)/i,
    category: "Purity framing",
    hides: "Actual ingredients, concentrations, and the fact that potency and risk are unrelated to sourcing.",
    ask: "May I read the ingredient list and concentrations on the actual label?",
    severity: "flag",
  },
  {
    test: /anti[-\s]?aging|reverse aging|turn back the clock|younger cells|age reversal/i,
    category: "Biological-age claim",
    hides: "What is measured, over what interval, and by which instrument.",
    ask: "What exactly is measured before and after, and who records it?",
    severity: "flag",
  },
  {
    test: /boost(?:s)? (?:metabolism|collagen by \d+)|\d+% more collagen|increases? (?:collagen|elastin) by/i,
    category: "Quantified biology",
    hides: "The source of the number, the population it came from, and whether it applies to this protocol.",
    ask: "Where does that percentage come from, and does it describe this exact device and setting?",
    severity: "flag",
  },
  {
    test: /trained by|certified by the (?:academy|institute)|master (?:injector|esthetician)|advanced certified/i,
    category: "Certificate in place of licence",
    hides: "Whether a state board issued anything, and what scope that board allows.",
    ask: "Which state licence do you hold for this service, and what is the number?",
    severity: "flag",
  },
  {
    test: /financing available|as low as \$\d+\/mo|buy now pay later|klarna|cherry|affirm/i,
    category: "Financing before verification",
    hides: "That the commitment is being fixed before the setting is resolved.",
    ask: "Can the quote be held for 48 hours without financing paperwork?",
    severity: "note",
  },
  {
    test: /results may vary|individual results|not a substitute for medical advice/i,
    category: "Disclaimer alongside certainty",
    hides: "That the fine print contradicts the headline in the same material.",
    ask: "Which statement governs — the headline or the disclaimer?",
    severity: "note",
  },
  {
    test: /no needles|needle[-\s]?free (?:filler|botox)|non[-\s]?surgical facelift|liquid facelift/i,
    category: "Procedure renaming",
    hides: "What is actually being placed, where, and by whom.",
    ask: "In clinical terms, what is placed or delivered, at what depth, and by which licensee?",
    severity: "flag",
  },
  {
    test: /we handle any (?:issue|complication)|complications (?:are|is) (?:rare|extremely rare)|never had a problem/i,
    category: "Complication minimising",
    hides: "The written protocol, the reversal agent, and the named clinician who manages it.",
    ask: "What is the written complication protocol, and what is kept on site to manage it?",
    severity: "hard",
  },
  {
    test: /sterile environment|hospital[-\s]?clean|impeccably clean|spotless/i,
    category: "Cleanliness as procedure",
    hides: "Instrument processing steps, single-use policy, and logs.",
    ask: "What is opened in front of me, and how are reusable instruments processed?",
    severity: "flag",
  },
  {
    test: /confidential|discreet entrance|no records kept|we don't keep charts/i,
    category: "Record avoidance",
    hides: "That a chart is what protects you afterwards.",
    ask: "What record is kept of what was used on me, and can I get a copy?",
    severity: "hard",
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
    (LICENSE_TOKENS.some((t) => lower(`${input.performer} ${input.license}`).includes(t)) ? 12 : 0) +
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
  const svc = has(input.menuLine) ? matchService(input.menuLine) : null;
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
        : svc
          ? `"${input.menuLine.trim()}" resolves to a catalogued line item: ${svc.name}.`
          : `"${input.menuLine.trim()}" is a nameable line item that can be quoted back.`,
    note: svc ? `Named, but still silent on: ${svc.silent}` : undefined,
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
    state: input.region === "unstated" ? "fail-closed" : input.region === "other" ? "partial" : "known",
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
  s.push({
    id: "product",
    label: "Exact product / device",
    weight: 16,
    depth: "fast",
    state: !has(input.product) ? "fail-closed" : prodVague ? "fail-closed" : "known",
    reading: !has(input.product)
      ? "No product or device named. Nothing about strength, clearance, or dilution can be checked."
      : prodVague
        ? `"${input.product.trim()}" is tier language, not a product. Treated as unresolved.`
        : `"${input.product.trim()}" is a checkable name — manufacturer, indication, and labeling can be read independently.`,
    ask: "What is the brand name printed on the box, vial, or device panel?",
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
        ? "Medical oversight unstated for a class that usually requires it."
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
      : /single[-\s]?use|sealed|autoclave|opened in front|new needle|sharps|log/i.test(input.sanitation)
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
  facial: { base: 18, note: "Low structural burden; product identity still matters." },
  injectable: { base: 62, note: "Injectable class: dosing, product identity, and complication path carry the burden." },
  device: { base: 55, note: "Device class: settings, operator training, and skin-type screening carry the burden." },
  bodywork: { base: 14, note: "Low structural burden; scope and pressure consent still apply." },
  chemical: { base: 48, note: "Resurfacing class: depth, aftercare, and sun discipline carry the burden." },
  iv: { base: 58, note: "Infusion class: sterile technique and medical oversight carry the burden." },
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
  if (MEDICAL_CLASSES.includes(input.serviceClass) && (vp.oversight === "none" || vp.oversight === "unknown")) {
    score += 14;
    drivers.push(`Higher-burden class in a ${vp.short.toLowerCase()} setting, where medical oversight is not implied by the name.`);
  }
  if (input.region === "unstated") {
    score += 8;
    drivers.push("Jurisdiction unnamed, so there is no board to check the license against.");
  }

  const fc = signals.filter((s) => s.state === "fail-closed").length;
  if (fc) {
    score += fc * 4;
    drivers.push(`${fc} fail-closed signal${fc > 1 ? "s" : ""} adds verification work before booking.`);
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
    input.venue !== "unclear";


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
            label: "Setting unresolved — fail closed",
            line: "Too much of the setting is unnamed to treat marketing as information. These stay open until answered out loud.",
          };

  const identityLine = anyInput
    ? [
        has(input.menuLine) ? `"${input.menuLine.trim()}"` : "unnamed service",
        SERVICE_LABELS[input.serviceClass].toLowerCase(),
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
  const seen = new Set<string>();
  return [...fromGaps, ...base].filter((q) => {
    const k = q.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
