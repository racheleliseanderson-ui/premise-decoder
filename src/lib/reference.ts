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
      "Acid name, concentration, and intended depth",
      "Who applies it and under which license",
      "Written aftercare and the person who owns complications",
    ],
    tierPhrases: ["medical-grade", "signature peel", "clinical strength"],
    verifyPath: "Ingredient list on consent; operator license; supervising clinician name.",
    variance: "Depth limits and who may apply medium peels differ by jurisdiction.",
  },
  {
    id: "iv",
    name: "IV & infusion",
    burdenBand: "High",
    whatItIs: "A prescription fluid or drug delivered by vein. Contents, dose, and the overseeing clinician are the disclosure.",
    mustBeNamed: [
      "Exact contents and doses on the bag or order",
      "Who places the line and who oversees",
      "What is claimed, and what evidence is cited",
    ],
    tierPhrases: ["custom blend", "immunity boost", "detox", "reset"],
    verifyPath: "Prescriber license; pharmacy source; written order.",
    variance: "Infusion rules are state-specific; ask which board would receive a complaint.",
  },
  {
    id: "facial",
    name: "Facials & esthetics",
    burdenBand: "Low",
    whatItIs: "Topical and manual esthetic work. Product identity and license still matter.",
    mustBeNamed: ["Product line by name", "Esthetics license held"],
    tierPhrases: ["medical-grade facial", "clinical facial"],
    verifyPath: "License against the cosmetology or esthetics board; product labels.",
    variance: "Some actives cross into medical class when prescribed.",
  },
  {
    id: "bodywork",
    name: "Bodywork",
    burdenBand: "Low",
    whatItIs: "Manual therapy under a massage or related license.",
    mustBeNamed: ["Therapist license", "Pressure and draping consent"],
    tierPhrases: ["medical massage", "therapeutic deep tissue"],
    verifyPath: "Massage license against the state board.",
    variance: "Post-surgical work may require clearance from the operating clinician.",
  },
  {
    id: "other",
    name: "Other / not named",
    burdenBand: "Moderate",
    whatItIs: "Unclassified service. Everything remains to be named.",
    mustBeNamed: ["What is done", "Who does it", "Under which license"],
    tierPhrases: ["signature", "proprietary", "custom protocol"],
    verifyPath: "Start by naming the service class, then the product, then the person.",
    variance: "Without a class, jurisdiction questions cannot be aimed.",
  },
];

export interface GlossaryEntry {
  phrase: string;
  reads: string;
  hides: string;
  replaceWith: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    phrase: "Medical-grade / clinical-strength",
    reads: "Sounds like a regulated tier.",
    hides: "Implies a regulated tier that does not exist. Product or device name and real regulatory status remain unnamed.",
    replaceWith: "Which exact product or device, and what is its real regulatory status — FDA cleared, approved, or neither?",
  },
  {
    phrase: "Medical spa",
    reads: "Sounds like clinical oversight.",
    hides: "Whether a supervising licensee exists, and whether they are on site while you are treated.",
    replaceWith: "Who supervises, under which license, and are they in the building today?",
  },
  {
    phrase: "FDA-approved technology",
    reads: "Sounds like your specific use was reviewed.",
    hides: "Conflates device clearance with treatment appropriateness. Clearance is device- and indication-specific.",
    replaceWith: "Cleared or approved for exactly which indication, and does that match what you're proposing for me?",
  },
  {
    phrase: "Permanent / lasts forever",
    reads: "Sounds like one purchase.",
    hides: "Most aesthetic results require maintenance. Realistic duration and yearly upkeep cost stay unspoken.",
    replaceWith: "What is the realistic duration, and what does upkeep cost per year?",
  },
  {
    phrase: "Injection specialist / aesthetic provider / skin expert",
    reads: "Sounds like a credential.",
    hides: "A title with no defined scope. License, board, and supervising physician stay unnamed.",
    replaceWith: "What is your license, and who is the supervising physician?",
  },
  {
    phrase: "Detox / boosts immunity / resets your system",
    reads: "Sounds like a mechanism.",
    hides: "Mechanism claims with thin evidence. What is measured, how, and by whom remains unspoken.",
    replaceWith: "What is the specific mechanism claim, and what evidence supports it for this outcome?",
  },
  {
    phrase: "Guaranteed results / money-back",
    reads: "Sounds like an absence of downside.",
    hides: "An outcome guarantee is not a clinical claim. Measurement method and accountable party stay unnamed.",
    replaceWith: "What specifically is guaranteed, measured how, and by whom?",
  },
  {
    phrase: "Today only / limited spots / lock it in",
    reads: "Sounds like scarcity.",
    hides: "Urgency pressure on an elective medical decision. Time to read consent and verify credentials.",
    replaceWith: "Is this price still available after a proper consultation, or only under time pressure?",
  },
  {
    phrase: "Spotless / immaculate rooms",
    reads: "Sounds like sanitation.",
    hides: "Procedure: single-use opening, autoclave cycles, logs, and processing between clients.",
    replaceWith: "Is packaging opened in front of me, and how are reusable tools processed?",
  },
  {
    phrase: "Safe for all skin types",
    reads: "Sounds like universal suitability.",
    hides: "Screening, especially for light and energy on deeper tones, and the intake conversation.",
    replaceWith: "What device and settings, and how do you screen my skin type and history first?",
  },
  {
    phrase: "Signature / proprietary protocol / blend",
    reads: "Sounds like a refined, exclusive method.",
    hides: "The actual products, concentrations, device settings, or ingredients inside the name.",
    replaceWith: "What are the actual products, concentrations, or device settings in it?",
  },
  {
    phrase: "Painless, no downtime",
    reads: "Sounds like an absence of recovery or risk.",
    hides: "Realistic recovery, side effects, and complications.",
    replaceWith: "What is the realistic downtime and the full list of possible side effects and complications?",
  },
  {
    phrase: "Customized just for you",
    reads: "Sounds tailored to the individual.",
    hides: "Whether assessment changes anything, who performs it, and what actually varies.",
    replaceWith: "Customized based on what assessment, by whom, and what changes for my case?",
  },
  {
    phrase: "Voted best / as seen on",
    reads: "Sounds like an external quality signal.",
    hides: "Credentials, medical director identity, and the written complication protocol.",
    replaceWith: "Who is the medical director, and can I verify credentials and the complication protocol?",
  },
];

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
