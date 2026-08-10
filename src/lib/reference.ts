/**
 * Reference library — static education data. No diagnosis, no candidacy,
 * no provider ranking. Everything here is a question set or a definition.
 */

import type { ServiceClass } from "./engine";

export interface ClassReference {
  id: ServiceClass;
  name: string;
  burdenBand: "Low" | "Contained" | "Moderate" | "High";
  whatItIs: string;
  mustBeNamed: string[];
  tierPhrases: string[];
  verifyPath: string;
  variance: string;
}

export const CLASS_REFERENCE: ClassReference[] = [
  {
    id: "injectable",
    name: "Injectables",
    burdenBand: "High",
    whatItIs:
      "A prescription product crossing the skin barrier. Identity, dose, and the complication path carry the weight — not the room.",
    mustBeNamed: [
      "Brand name on the vial and the lot it came from",
      "Units or millilitres, and dilution if reconstituted",
      "Prescriber, and whether that person is the injector",
      "Named licensee reachable the same night",
    ],
    tierPhrases: ["medical grade", "per unit special", "baby dose", "our own blend"],
    verifyPath:
      "License type and number against the state licensing board; product name against the manufacturer's own labelling.",
    variance:
      "Who may inject, and whether a supervising licensee must be physically present, differs by state and can differ by product.",
  },
  {
    id: "device",
    name: "Energy & device treatments",
    burdenBand: "High",
    whatItIs:
      "Laser, radiofrequency, ultrasound, microneedling with energy. Settings and operator training decide the result more than the brochure.",
    mustBeNamed: [
      "Device make and model, printed on the panel",
      "Cleared indication being used, and whether your use is on-label",
      "Operator training on that specific platform",
      "Skin-type screening method before the first pass",
    ],
    tierPhrases: ["FDA-approved", "medical laser", "permanent", "no downtime at all"],
    verifyPath:
      "Device model against the manufacturer's cleared indications; operator license and device-specific training certificate.",
    variance:
      "Some states treat energy devices as the practice of medicine; others license technicians directly. Ask which applies.",
  },
  {
    id: "chemical",
    name: "Chemical peels & resurfacing",
    burdenBand: "Moderate",
    whatItIs:
      "Controlled injury at a chosen depth. Depth, aftercare, and sun discipline are the service — the acid name alone is not.",
    mustBeNamed: [
      "Acid or blend, concentration, and pH",
      "Intended depth and expected visible recovery",
      "Who decides to stop, and on what sign",
      "Aftercare products and sun protocol in writing",
    ],
    tierPhrases: ["medical-grade peel", "proprietary blend", "instant glow", "safe for everyone"],
    verifyPath:
      "Esthetician or clinician license against the state board; product concentration against the manufacturer's own sheet.",
    variance:
      "Maximum depth and acid strength permitted to an esthetician versus a clinician varies widely by jurisdiction.",
  },
  {
    id: "iv",
    name: "IV & infusion services",
    burdenBand: "High",
    whatItIs:
      "A sterile line into a vein under a prescription. Sterile technique and medical oversight are the whole service.",
    mustBeNamed: [
      "Every component and its amount, in writing",
      "Prescribing licensee, and their relationship to the site",
      "Who places the line, and their license",
      "Screening for kidney, cardiac, and medication interactions",
    ],
    tierPhrases: ["immunity boost", "detox", "cellular reset", "custom cocktail"],
    verifyPath:
      "Prescriber and nurse licenses against the state board; compounding source of the bag if it is not a stock product.",
    variance:
      "Standing-order and delegation rules for infusions differ by state; remote oversight is not universally allowed.",
  },
  {
    id: "facial",
    name: "Facials & esthetic services",
    burdenBand: "Contained",
    whatItIs:
      "Topical work within an esthetics scope. Lower structural burden — product identity and extraction hygiene still matter.",
    mustBeNamed: [
      "Actives used and their percentages",
      "Extraction and lancet policy, if any",
      "Esthetician license",
      "What is added by any upgrade that changes depth",
    ],
    tierPhrases: ["medical-grade facial", "signature", "cosmeceutical", "results-driven"],
    verifyPath:
      "Esthetician license against the state board; product line against the manufacturer's site.",
    variance:
      "Add-ons such as microneedling or peels can move the service out of an esthetics scope entirely.",
  },
  {
    id: "bodywork",
    name: "Bodywork & massage",
    burdenBand: "Low",
    whatItIs:
      "Manual work under a massage or bodywork license. The questions are scope, consent, and draping — not product tiers.",
    mustBeNamed: [
      "Massage license and modality trained",
      "Pressure and draping consent before the table",
      "Any adjunct device or heat used",
      "Whether a medical claim is being attached to the session",
    ],
    tierPhrases: ["lymphatic drainage cures", "detox massage", "therapeutic-grade oils"],
    verifyPath:
      "Massage license against the state board; modality certificate from the training body.",
    variance:
      "Titles are protected differently by state; some restrict the word 'therapy' outright.",
  },
  {
    id: "other",
    name: "Unclassified",
    burdenBand: "Moderate",
    whatItIs:
      "The class has not been resolved yet, so the burden estimate stays conservative and every identity question stands.",
    mustBeNamed: [
      "What is physically done, step by step",
      "Whether anything crosses the skin barrier",
      "Which license covers it in this state",
      "Who is accountable after you leave",
    ],
    tierPhrases: ["advanced", "signature", "clinical", "wellness protocol"],
    verifyPath:
      "Ask the facility to name the license category the service falls under, then check that board.",
    variance: "Unnamed services are the most jurisdiction-sensitive of all. Naming comes first.",
  },
];

/* ------------------------------------------------------- language glossary */

export interface GlossaryEntry {
  phrase: string;
  reads: string;
  hides: string;
  replaceWith: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    phrase: "Medical grade",
    reads: "Sounds like a regulated tier.",
    hides: "No body defines it. It stands in for the product name, active, and concentration.",
    replaceWith: "What is printed on the label — name, active, percentage?",
  },
  {
    phrase: "Medical spa",
    reads: "Sounds like clinical oversight.",
    hides:
      "Whether a supervising licensee exists, and whether they are on site while you are treated.",
    replaceWith: "Who supervises, under which license, and are they in the building today?",
  },
  {
    phrase: "FDA approved",
    reads: "Sounds like your specific use was reviewed.",
    hides:
      "Clearance is device- and indication-specific. Off-label use is common and not disclosed by the phrase.",
    replaceWith: "Which device model, which cleared indication, and is my use on-label?",
  },
  {
    phrase: "Permanent",
    reads: "Sounds like one purchase.",
    hides: "The maintenance interval and the per-session cost after the first series.",
    replaceWith: "What does year two cost, at what interval?",
  },
  {
    phrase: "Specialist / technician / expert",
    reads: "Sounds like a credential.",
    hides: "The license type and number, which is the only checkable part.",
    replaceWith: "What license, issued by whom, and what is the number?",
  },
  {
    phrase: "Detox / reset / boost",
    reads: "Sounds like a mechanism.",
    hides: "What is measured, by whom, and against what baseline.",
    replaceWith: "What measurable change is claimed, and how is it recorded?",
  },
  {
    phrase: "Guaranteed / risk free",
    reads: "Sounds like an absence of downside.",
    hides: "Non-responders, variability, and the written complication pathway.",
    replaceWith: "What does the consent form say about outcomes that miss expectation?",
  },
  {
    phrase: "Today only / limited spots",
    reads: "Sounds like scarcity.",
    hides: "The time you would otherwise use to read consent and verify credentials.",
    replaceWith: "Is this price still available after a 48-hour gap?",
  },
  {
    phrase: "Spotless / immaculate rooms",
    reads: "Sounds like sanitation.",
    hides: "Procedure: single-use opening, autoclave cycles, logs, and processing between clients.",
    replaceWith: "Is packaging opened in front of me, and how are reusable tools processed?",
  },
];

/* -------------------------------------------------------- verification map */

export interface VerificationDesk {
  label: string;
  what: string;
  how: string;
}

export const VERIFICATION_DESKS: VerificationDesk[] = [
  {
    label: "State licensing board",
    what: "License status, type, issue date, and disciplinary history for a named person.",
    how: "Search the person's full name on the board that issued the license they claim — medical, nursing, cosmetology, or massage.",
  },
  {
    label: "Manufacturer labelling",
    what: "Product identity, indications, and what the maker itself claims.",
    how: "Search the exact brand name from the box. If a facility will not name it, there is nothing to search.",
  },
  {
    label: "Device clearance record",
    what: "Which indications a specific device model was cleared for.",
    how: "Search the model number printed on the device panel, not the marketing name of the treatment.",
  },
  {
    label: "Facility ownership and oversight",
    what: "Who owns the practice and which licensee is medically responsible.",
    how: "Ask for the supervising licensee's name in writing, then confirm that license separately.",
  },
  {
    label: "Written paper",
    what: "Consent, complication pathway, refund and unused-credit terms.",
    how: "Request all of it before payment, and keep a copy. Consent read on the table is consent under pressure.",
  },
];
