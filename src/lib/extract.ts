/**
 * Venue text extraction — education only.
 *
 * Reads pasted venue material (menu page, booking confirmation, DM reply,
 * consult email) and proposes values for unresolved setting fields. It never
 * infers: every proposal quotes the sentence it came from, and anything the
 * text does not literally name stays unfilled and fail-closed.
 */

import {
  SERVICE_LABELS,
  VENUE_LABELS,
  REGIONS,
  type EvalInput,
  type ServiceClass,
  type Venue,
} from "./engine";

export type ExtractField = keyof EvalInput;

export interface Proposal {
  field: ExtractField;
  label: string;
  /** Display value (option label for selects, raw text otherwise). */
  display: string;
  /** Value written into EvalInput. */
  value: string;
  /** The sentence in the pasted text that supports it. */
  evidence: string;
  /** True when the field already holds something else. */
  conflict: boolean;
}

export interface ExtractResult {
  proposals: Proposal[];
  sentences: number;
  /** Fields the text did not name — kept visible rather than guessed. */
  silent: { field: ExtractField; label: string }[];
}

const FIELD_LABELS: Record<ExtractField, string> = {
  serviceClass: "Service class",
  venue: "Setting type",
  region: "Jurisdiction",
  menuLine: "Menu line",
  product: "Product / device named",
  performer: "Who performs it",
  license: "License evidence",
  price: "Price / units",
  supervision: "Medical supervision",
  sanitation: "Sanitation practice",
  afterHours: "After-hours ownership",
  consent: "Consent / intake",
  seriesPressure: "Series & commitment",
  marketing: "Marketing text",
};

const EXTRACTABLE: ExtractField[] = [
  "serviceClass",
  "venue",
  "region",
  "menuLine",
  "product",
  "performer",
  "license",
  "price",
  "supervision",
  "sanitation",
  "afterHours",
  "consent",
  "seriesPressure",
];


const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?;:])\s+|\n+|\s{2,}·\s{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 1);

const clip = (s: string, n = 180) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ------------------------------------------------------------- matchers */

const SERVICE_PATTERNS: { cls: ServiceClass; test: RegExp }[] = [
  { cls: "injectable", test: /\b(botox|dysport|xeomin|jeuveau|filler|juvederm|juvéderm|restylane|sculptra|kybella|neurotoxin|tox|lip flip|units?\b|prp injection|inject)/i },
  { cls: "device", test: /\b(laser|ipl|bbl|co2|radiofrequency|rf microneedling|morpheus|ultherapy|coolsculpt|emsculpt|hifu|nd:?yag|diode|cryolipolysis|microneedling)/i },
  { cls: "iv", test: /\b(iv (?:drip|therapy|infusion)|infusion|vitamin drip|banana bag|nad\+?)/i },
  { cls: "chemical", test: /\b(chemical peel|tca|jessner|glycolic\s?\d|salicylic\s?\d|dermaplan|resurfac|vi peel|perfect derma)/i },
  { cls: "bodywork", test: /\b(massage|bodywork|lymphatic|deep tissue|swedish|cupping|reflexolog)/i },
  { cls: "facial", test: /\b(facial|hydrafacial|dermaplaning|extraction|enzyme mask|led facial|hydro?dermabrasion)/i },
];

const VENUE_PATTERNS: { venue: Venue; test: RegExp }[] = [
  { venue: "clinic", test: /\b(dermatology (?:clinic|practice)|medical (?:clinic|practice|office)|plastic surgery (?:clinic|practice)|physician[- ]owned|surgical center)/i },
  { venue: "med-spa", test: /\b(med[- ]?spa|medspa|medical spa|aesthetic (?:clinic|medicine)|cosmetic clinic)/i },
  { venue: "day-spa", test: /\b(day spa|wellness spa|beauty (?:bar|lounge|studio)|salon|spa retreat|esthetics studio)/i },
];

const PRODUCT_TEST =
  /\b(botox|dysport|xeomin|jeuveau|juvederm|juvéderm|restylane|rha\b|versa|sculptra|radiesse|kybella|hydrafacial|zo skin|obagi|skinceuticals|biologique recherche|dermalogica|pca skin|vi peel|perfect derma|morpheus8|ultherapy|coolsculpting|emsculpt|sciton|cutera|candela|lumenis|alma|inmode|clear ?\+ ?brilliant|fraxel|picoway|picosure)\b/i;

const PERFORMER_TEST =
  /\b(nurse injector|registered nurse|nurse practitioner|physician assistant|licensed esthetician|master esthetician|medical esthetician|esthetician|dermatologist|physician|doctor|dr\.|massage therapist|lmt|rn\b|np\b|pa-?c\b|md\b|do\b|aprn|dnp|technician|specialist|our team|our staff)/i;

const LICENSE_TEST =
  /\b(license[d]?(?: #| number| no\.?)?|lic\.? ?#|state[- ]licensed|board[- ]certified|certification|certified in|credential|registry|license verification)/i;

const PRICE_TEST = /(\$\s?\d[\d,.]*|\b\d+\s?(?:units?|syringes?|ml|cc|sessions?|treatments?)\b|\bper (?:unit|area|syringe|session)\b)/i;

const SUPERVISION_TEST =
  /\b(medical director|supervising (?:physician|provider|md|np)|under the supervision|on[- ]site (?:physician|md|provider)|physician[- ]supervised|standing order|delegat(?:ed|ion)|good faith exam|telehealth (?:exam|consult) before)/i;

const SANITATION_TEST =
  /\b(autoclave|steriliz|sterile|single[- ]use|disposable|sharps|barrier film|disinfect|hospital[- ]grade|cavicide|new needle|opened in front of you|lot number|expiration date)/i;

const AFTER_HOURS_TEST =
  /\b(after[- ]hours|24\/7|on[- ]call|emergency (?:line|number|contact)|reach (?:us|me) after|complication (?:protocol|plan)|hyaluronidase|adverse (?:event|reaction)|urgent care|voicemail|answering service|next business day)/i;

const CONSENT_TEST =
  /\b(consent (?:form|is signed)|informed consent|intake (?:form|paperwork)|health history|medical history|contraindication|patch test|photos? (?:before|at intake)|screening questionnaire)/i;

const SERIES_TEST =
  /\b(package of \d+|series of \d+|\d+[- ]session|membership|monthly plan|auto[- ]renew|prepay|credits?|subscription|maintenance every|recommended (?:every|\d+) (?:weeks?|months?))/i;

function findSentence(sentences: string[], test: RegExp) {
  return sentences.find((s) => test.test(s));
}

/* --------------------------------------------------------------- extract */

export function extractFromText(text: string, current: EvalInput): ExtractResult {
  const sentences = splitSentences(text);
  const proposals: Proposal[] = [];

  const push = (
    field: ExtractField,
    value: string,
    evidence: string,
    display = value,
  ) => {
    const existing = String(current[field] ?? "").trim();
    if (existing && existing.toLowerCase() === value.trim().toLowerCase()) return;
    proposals.push({
      field,
      label: FIELD_LABELS[field],
      value: value.trim(),
      display: clip(display.trim()),
      evidence: clip(evidence),
      conflict: Boolean(existing) && field !== "serviceClass" && field !== "venue",
    });
  };

  if (sentences.length) {
    // service class
    for (const p of SERVICE_PATTERNS) {
      const hit = findSentence(sentences, p.test);
      if (hit) {
        if (current.serviceClass !== p.cls)
          push("serviceClass", p.cls, hit, SERVICE_LABELS[p.cls]);
        break;
      }
    }

    // venue
    for (const p of VENUE_PATTERNS) {
      const hit = findSentence(sentences, p.test);
      if (hit) {
        if (current.venue !== p.venue) push("venue", p.venue, hit, VENUE_LABELS[p.venue]);
        break;
      }
    }

    // menu line — first sentence that reads like a service line
    if (!current.menuLine.trim()) {
      const menu =
        sentences.find((s) => s.length <= 90 && SERVICE_PATTERNS.some((p) => p.test.test(s))) ??
        sentences.find((s) => s.length <= 90);
      if (menu) push("menuLine", menu, menu);
    }

    const simple: { field: ExtractField; test: RegExp }[] = [
      { field: "product", test: PRODUCT_TEST },
      { field: "performer", test: PERFORMER_TEST },
      { field: "license", test: LICENSE_TEST },
      { field: "price", test: PRICE_TEST },
      { field: "supervision", test: SUPERVISION_TEST },
      { field: "sanitation", test: SANITATION_TEST },
      { field: "afterHours", test: AFTER_HOURS_TEST },
      { field: "consent", test: CONSENT_TEST },
      { field: "seriesPressure", test: SERIES_TEST },
    ];

    for (const { field, test } of simple) {
      const hit = findSentence(sentences, test);
      if (!hit) continue;
      if (field === "product") {
        const m = hit.match(PRODUCT_TEST);
        push("product", m ? m[0] : hit, hit, m ? m[0] : hit);
        continue;
      }
      push(field, hit, hit);
    }
  }

  const proposed = new Set(proposals.map((p) => p.field));
  const silent = EXTRACTABLE.filter(
    (f) => !proposed.has(f) && !String(current[f] ?? "").trim(),
  ).map((f) => ({ field: f, label: FIELD_LABELS[f] }));

  return { proposals, sentences: sentences.length, silent };
}

export { FIELD_LABELS };
