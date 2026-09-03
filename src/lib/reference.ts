/**
 * Reference library — static education data. No diagnosis, no candidacy,
 * no provider ranking. Everything here is a question set or a definition.
 */

import type { ServiceClass } from "./engine";

/**
 * When the contents of this file were last read through against primary
 * sources. Reference material with no date on it asks the reader to trust that
 * it is current, which is exactly the move the rest of this desk refuses to
 * make. Bump this in the same commit that changes an entry below — never
 * separately, and never to "today" without having done the reading.
 */
export const REFERENCE_REVIEWED = "2026-09-02";

export const REFERENCE_REVIEWED_LABEL = new Date(
  `${REFERENCE_REVIEWED}T00:00:00`,
).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

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
    whatItIs:
      "A prescription fluid or drug delivered by vein. Contents, dose, and the overseeing clinician are the disclosure.",
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
    hides:
      "Implies a regulated tier that does not exist. Product or device name and real regulatory status remain unnamed.",
    replaceWith:
      "Which exact product or device, and what is its real regulatory status — FDA cleared, approved, or neither?",
  },
  {
    phrase: "Medical spa",
    reads: "Sounds like clinical oversight.",
    hides:
      "Whether a supervising licensee exists, and whether they are on site while you are treated.",
    replaceWith: "Who supervises, under which license, and are they in the building today?",
  },
  {
    phrase: "FDA-approved technology",
    reads: "Sounds like your specific use was reviewed.",
    hides:
      "Conflates device clearance with treatment appropriateness. Clearance is device- and indication-specific.",
    replaceWith:
      "Cleared or approved for exactly which indication, and does that match what you're proposing for me?",
  },
  {
    phrase: "Permanent / lasts forever",
    reads: "Sounds like one purchase.",
    hides:
      "Most aesthetic results require maintenance. Realistic duration and yearly upkeep cost stay unspoken.",
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
    hides:
      "Mechanism claims with thin evidence. What is measured, how, and by whom remains unspoken.",
    replaceWith:
      "What is the specific mechanism claim, and what evidence supports it for this outcome?",
  },
  {
    phrase: "Guaranteed results / money-back",
    reads: "Sounds like an absence of downside.",
    hides:
      "An outcome guarantee is not a clinical claim. Measurement method and accountable party stay unnamed.",
    replaceWith: "What specifically is guaranteed, measured how, and by whom?",
  },
  {
    phrase: "Today only / limited spots / lock it in",
    reads: "Sounds like scarcity.",
    hides:
      "Urgency pressure on an elective medical decision. Time to read consent and verify credentials.",
    replaceWith:
      "Is this price still available after a proper consultation, or only under time pressure?",
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
    hides:
      "Screening, especially for light and energy on deeper tones, and the intake conversation.",
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
    replaceWith:
      "What is the realistic downtime and the full list of possible side effects and complications?",
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
    replaceWith:
      "Who is the medical director, and can I verify credentials and the complication protocol?",
  },
];

/**
 * A directory a reader can actually open.
 *
 * The verification section told the reader five times to "search the board"
 * and supplied no way to find one. That is the same failure as an evidence
 * rating with no source: an instruction that sounds rigorous and cannot be
 * carried out. Naming a registry without linking it puts the hardest part of
 * the work — finding the right registry out of fifty states and four licence
 * types — back on the person who came here because they did not know it.
 *
 * These are directory roots, not deep links, and deliberately so: a deep link
 * into a specific state board rots within a year, while these national
 * directories are the stable entry points that route to the current one. They
 * were added by hand and have not been machine-checked for reachability, which
 * is what `linkCheck` records. It is better for that to be visible than
 * implied.
 */
export interface VerificationLink {
  label: string;
  url: string;
  /** What this specific directory gets you, in one line. */
  gets: string;
}

export interface VerificationDesk {
  label: string;
  what: string;
  how: string;
  /** Where to actually do it. Empty only where no public registry exists. */
  links: VerificationLink[];
  /** Why there are no links, when there are none. */
  noLinkReason?: string;
}

/** Provenance of the `links` above. See the note on VerificationDesk. */
export const LINK_CHECK = {
  addedOn: REFERENCE_REVIEWED,
  linkCheck: "manual" as const,
  note:
    "Directory URLs were entered by hand against the issuing organisation and have not been automatically re-checked since. If one is dead, the organisation is still the right one to search for.",
};

export const VERIFICATION_DESKS: VerificationDesk[] = [
  {
    label: "State licensing board",
    what: "License status, type, issue date, and disciplinary history for a named person.",
    how: "Search the person's full name on the board that issued the license they claim — medical, nursing, cosmetology, or massage. Which board matters: a nurse injector is not on the medical board.",
    links: [
      {
        label: "Federation of State Medical Boards — find your state medical board",
        url: "https://www.fsmb.org/contact-a-state-medical-board/",
        gets: "The physician and, in most states, physician-assistant registry for every state.",
      },
      {
        label: "NCSBN — state boards of nursing directory",
        url: "https://www.ncsbn.org/contact-bon.htm",
        gets: "The right board for an RN or NP injector, which the medical board will not list.",
      },
      {
        label: "NCSBN Nursys — verify a nurse licence",
        url: "https://www.nursys.com/",
        gets: "Direct multi-state nurse licence lookup where the state participates.",
      },
    ],
  },
  {
    label: "Manufacturer labelling",
    what: "Product identity, indications, and what the maker itself claims.",
    how: "Search the exact brand name from the box. If a facility will not name it, there is nothing to search — and that refusal is itself the answer.",
    links: [
      {
        label: "DailyMed — current US prescribing information",
        url: "https://dailymed.nlm.nih.gov/dailymed/",
        gets: "The actual approved label for an injectable, including indications and contraindications.",
      },
      {
        label: "Drugs@FDA",
        url: "https://www.accessdata.fda.gov/scripts/cder/daf/",
        gets: "Approval status and history. A product absent here is not FDA-approved, whatever the room says.",
      },
    ],
  },
  {
    label: "Device clearance record",
    what: "Which indications a specific device model was cleared for.",
    how: "Search the model number printed on the device panel, not the marketing name of the treatment. \"FDA-approved\" on a brochure usually means 510(k) cleared, which is a different and lower bar.",
    links: [
      {
        label: "FDA 510(k) premarket notification database",
        url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm",
        gets: "The cleared indications for a named device, in the manufacturer's own submission.",
      },
      {
        label: "FDA MAUDE — adverse event reports by device",
        url: "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfmaude/search.cfm",
        gets: "What has gone wrong with this device model elsewhere.",
      },
    ],
  },
  {
    label: "Facility ownership and oversight",
    what: "Who owns the practice and which licensee is medically responsible.",
    how: "Ask for the supervising licensee's name in writing, then confirm that license separately through the boards above.",
    links: [],
    noLinkReason:
      "There is no national registry of med-spa ownership or medical direction. Corporate filings sit with each state's Secretary of State and are not consistent enough to link generically. The written name, checked against the licence boards above, is the route that works.",
  },
  {
    label: "Written paper",
    what: "Consent, complication pathway, refund and unused-credit terms.",
    how: "Request all of it before payment, and keep a copy. Consent read on the table is consent under pressure.",
    links: [],
    noLinkReason:
      "This one is not a registry lookup. It is a document the facility either hands you before you pay or does not.",
  },
];

/**
 * State-by-state scope of practice.
 *
 * The class reference says several times that scope "differs by state" — who
 * may inject, whether energy devices are the practice of medicine, who may
 * apply a medium-depth peel. That is true and it is the single most consequential
 * fact on this desk, and it was stated with nothing behind it and no way to
 * resolve it for the reader's own state. There is no single authoritative
 * national table of it; the honest answer is to name that and point at the two
 * bodies that hold the pieces.
 */
export const SCOPE_OF_PRACTICE_NOTE = {
  claim:
    "Who may perform a treatment, and under what supervision, is set by each state and changes without notice.",
  whyNoTable:
    "No public national table of cosmetic scope of practice exists that is current enough to publish. Anything claiming to be one is out of date somewhere, and a reader who trusts it in the wrong state is the person it hurts.",
  resolveHere: [
    {
      label: "Your state medical board — via FSMB",
      url: "https://www.fsmb.org/contact-a-state-medical-board/",
      gets: "Delegation and supervision rules for physicians, PAs and, in many states, laser operators.",
    },
    {
      label: "Your state board of nursing — via NCSBN",
      url: "https://www.ncsbn.org/contact-bon.htm",
      gets: "Whether an RN or NP may inject unsupervised in your state.",
    },
  ],
  ask:
    "Put it to the facility as a question with a checkable answer: which licence permits this person to do this procedure in this state, and who supervises it?",
};
