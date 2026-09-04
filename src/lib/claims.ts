/**
 * The Claim Decoder.
 *
 * A sentence in aesthetics marketing is doing one of a small number of jobs. It
 * is promising an outcome, describing a mechanism, implying a qualification,
 * borrowing a regulator's authority, setting the terms of a sale, compressing
 * time, or telling you how you will feel. Most of them are doing one of those
 * jobs while sounding like they are doing another, and that is the whole trick.
 *
 * The previous version of this module had fifteen patterns, returned the FIRST
 * sentence that matched each one, and described the result as a category and a
 * thing it hid. That is a lookup table. It could not tell you that a membership
 * page used time pressure six separate times, and it had no vocabulary for the
 * difference between a claim that could be checked and a claim that no possible
 * evidence would ever count against.
 *
 * So each finding now carries four things the old shape could not say:
 *
 *   kind            what job the sentence is doing
 *   measurability   whether any answer could falsify it
 *   substantiation  what would have to be produced for it to stand up
 *   emotionalWork   the words persuading rather than describing, quoted back
 *
 * And every occurrence is found, not the first.
 *
 * The boundary is unchanged and load-bearing. This module reads SENTENCES. It
 * has no opinion on whether a treatment works, whether a price is fair, or
 * whether a provider is good. A flagged phrase is not an accusation — plenty of
 * honest rooms write bad copy, and the decoder says so. Absence of flags is not
 * an endorsement either, which is the more common mistake.
 */

/* --------------------------------------------------------------- shapes */

/** What job the sentence is actually doing. */
export type ClaimKind =
  /** What will happen to your face or body. */
  | "outcome"
  /** How it is said to work. */
  | "mechanism"
  /** Who is said to be qualified, and how. */
  | "credential"
  /** A name standing in for a fact. */
  | "brand"
  /** Authority borrowed from a regulator. */
  | "regulatory"
  /** The terms of the sale. */
  | "commercial"
  /** When, how fast, and for how long. */
  | "temporal"
  /** Who it is for, and who it is not for. */
  | "scope"
  /** How you are told you will feel. */
  | "affective";

export const KIND_LABEL: Record<ClaimKind, string> = {
  outcome: "Outcome",
  mechanism: "Mechanism",
  credential: "Credential",
  brand: "Brand",
  regulatory: "Regulatory",
  commercial: "Commercial",
  temporal: "Timing",
  scope: "Scope",
  affective: "How you will feel",
};

export const KIND_NOTE: Record<ClaimKind, string> = {
  outcome: "A statement about the result. Ask what is measured, by whom, and against what.",
  mechanism: "A statement about how it works. Ask what the mechanism is, in plain words.",
  credential: "A statement about qualification. Ask for the licence and the board that issued it.",
  brand:
    "A name doing the work of a fact. Ask what the name establishes that the description does not.",
  regulatory: "Authority borrowed from a regulator. Ask for the indication, not the badge.",
  commercial: "A term of the sale. Ask for it in writing before any money moves.",
  temporal: "A claim about time. Ask when it is reviewed and when it has to be repeated.",
  scope: "A claim about who it suits. Ask what screening happens before it is offered to you.",
  affective: "A sentence about you rather than about the service. Nothing here can be verified.",
};

/**
 * Whether any answer could count against the claim.
 *
 * This is the axis the old decoder was missing, and it is the one that changes
 * what a reader should do. A measurable claim is a question you can ask. An
 * unfalsifiable one is not a claim at all, and asking about it politely will
 * produce more of the same sentence.
 */
export type Measurability = "measurable" | "vague" | "unfalsifiable";

export const MEASURABILITY_LABEL: Record<Measurability, string> = {
  measurable: "Could be measured",
  vague: "Could be specific, and is not",
  unfalsifiable: "Nothing would count as failing it",
};

export type ClaimSeverity = "note" | "flag" | "hard";

export interface DecodedClaim {
  /** The sentence, verbatim, clipped. */
  phrase: string;
  category: string;
  kind: ClaimKind;
  measurability: Measurability;
  /** What the sentence leaves unresolved. */
  hides: string;
  /** What would have to be produced for this to stand up. */
  substantiation: string[];
  /** Words persuading rather than describing, quoted from the phrase. */
  emotionalWork: string | null;
  ask: string;
  severity: ClaimSeverity;
  /** Character offset of the match in the pasted text. */
  at: number;
  /** How many separate sentences in the text carry this pattern. */
  count: number;
}

interface ClaimRule {
  id: string;
  test: RegExp;
  category: string;
  kind: ClaimKind;
  measurability: Measurability;
  hides: string;
  substantiation: string[];
  ask: string;
  severity: ClaimSeverity;
}

/* ---------------------------------------------------------- the ruleset */

/**
 * Patterns, in no particular order — severity and position decide the display
 * order, not this array. Every `hides` says what is missing rather than what is
 * wrong, because the sentence is usually not a lie; it is an omission wearing
 * the clothes of a statement.
 */
const CLAIM_RULES: ClaimRule[] = [
  /* ---------------------------------------------------- regulatory */
  {
    id: "tier",
    test: /\b(?:medical[-\s]?grade|pharmaceutical[-\s]?grade|clinical[-\s]?strength|cosmeceutical)\b/gi,
    category: "Unregulated tier language",
    kind: "regulatory",
    measurability: "unfalsifiable",
    hides:
      "It implies a regulated tier that does not exist, and it stands where the product name and its actual status should be.",
    substantiation: [
      "The product name printed on the box",
      "Its actual status — cleared, approved, a cosmetic, or none of those",
      "Which body decided that, and for what indication",
    ],
    ask: "Which exact product or device, and what is its real regulatory status — FDA cleared, approved, or neither?",
    severity: "flag",
  },
  {
    id: "fda-approved",
    test: /\bFDA[-\s]?approved\b/gi,
    category: "Regulatory borrowing",
    kind: "regulatory",
    measurability: "measurable",
    hides:
      "Clearance is device- and indication-specific. Approval of a device for one thing says nothing about its appropriateness for what is being proposed for you.",
    substantiation: [
      "The exact indication in the clearance or approval",
      "Whether the treatment being proposed matches that indication",
      "The 510(k) or PMA number, which is public and searchable",
    ],
    ask: "Cleared or approved for exactly which indication, and does that match what you are proposing for me?",
    severity: "flag",
  },
  {
    id: "fda-registered",
    test: /\bFDA[-\s]?(?:registered|listed)\b/gi,
    category: "Regulatory borrowing, one step further",
    kind: "regulatory",
    measurability: "measurable",
    hides:
      "Registration and listing are administrative. A facility registers; a device is listed. Neither is a review of whether the thing works, and both are frequently printed where “approved” would be untrue.",
    substantiation: [
      "The distinction, said out loud: registered, listed, cleared, or approved",
      "If it is only registered or listed, what evidence exists for the outcome being sold",
    ],
    ask: "Registered, listed, cleared, or approved — which one, and what did the FDA actually review?",
    severity: "flag",
  },

  /* ------------------------------------------------------- outcome */
  {
    id: "permanent",
    test: /\b(?:(?<!semi[-\s])permanent(?:ly)?|forever|lifetime results|never (?:comes?|come) back)\b/gi,
    category: "Permanence claim",
    kind: "outcome",
    measurability: "measurable",
    hides:
      "The maintenance schedule, the retreatment cost, and what the result looks like as it fades.",
    substantiation: [
      "The longest published follow-up for this treatment, and what it found",
      "What this room's own patients do at two years",
      "The annual cost of holding the result",
    ],
    ask: "What is the realistic duration, and what does upkeep cost per year?",
    severity: "hard",
  },
  {
    id: "guarantee",
    test: /\b(?:guarantee[ds]?|money[-\s]?back|risk[-\s]?free|zero risk|we promise)\b/gi,
    category: "Certainty claim",
    kind: "outcome",
    measurability: "unfalsifiable",
    hides:
      "An outcome guarantee is a commercial term, not a clinical one. What is being guaranteed, how it would be measured, and who decides are all unnamed.",
    substantiation: [
      "The written terms of the guarantee",
      "The measurement that would trigger it — photographs, a scale, a date",
      "Who adjudicates, and whether it is the same person who sold it",
    ],
    ask: "What specifically is guaranteed, measured how, and by whom?",
    severity: "hard",
  },
  {
    id: "clinically-proven",
    test: /\b(?:clinically[-\s]?(?:proven|tested|validated)|studies show|science[-\s]?backed|research[-\s]?backed|proven results)\b/gi,
    category: "Evidence language without an evidence trail",
    kind: "outcome",
    measurability: "measurable",
    hides:
      "Which study, on how many people, against what comparator, on this device at these settings, and whether it was ever published.",
    substantiation: [
      "The citation — journal, year, authors",
      "How many participants, and whether there was a control group",
      "Whether the study used this exact device and protocol, or a related one",
      "Who funded it",
    ],
    ask: "Which study — can you send me the citation, and was it on this device at these settings?",
    severity: "flag",
  },
  {
    id: "percentage",
    test: /\bup to \d{1,3}\s?%|\b\d{1,3}\s?% (?:improvement|reduction|increase|more|better|of (?:patients|clients))/gi,
    category: "A number with no denominator",
    kind: "outcome",
    measurability: "measurable",
    hides:
      "“Up to” describes the best result anybody had, not the result you should plan for. The average, the spread, and the number of people behind it are all absent.",
    substantiation: [
      "The average, not the ceiling",
      "How many people, and how many saw nothing",
      "What was measured, and by whom — a rater, a device, or the patient",
    ],
    ask: "What was the average result, across how many people, and how many saw no change at all?",
    severity: "flag",
  },
  {
    id: "no-side-effects",
    test: /\bno (?:side[-\s]?effects?|downtime whatsoever|risks?)\b|\bside[-\s]?effect[-\s]?free\b|\bcompletely safe\b/gi,
    category: "Absence claim",
    kind: "outcome",
    measurability: "unfalsifiable",
    hides:
      "Nothing that changes tissue has no risk. The claim removes the conversation in which risks would be named and consented to.",
    substantiation: [
      "The consent form, which will list risks the advertisement does not",
      "The known adverse events for this device or product, from its own labelling",
      "What this room has actually seen, and how often",
    ],
    ask: "What is on the consent form under risks, and what have you personally seen go wrong with this?",
    severity: "hard",
  },
  {
    id: "natural-look",
    test: /\b(?:natural[-\s]?looking|undetectable|nobody will know|refreshed, not done|subtle enhancement)\b/gi,
    category: "Aesthetic reassurance",
    kind: "outcome",
    measurability: "vague",
    hides:
      "Whose judgement decides, and what happens if you disagree. It is a taste claim written as a technical one.",
    substantiation: [
      "Before-and-after photographs of this injector's own work, in the same lighting",
      "What the correction path is if you do not like it, and what it costs",
    ],
    ask: "Can I see your own before-and-afters, in the same lighting, and what is the fix if I do not like it?",
    severity: "note",
  },

  /* ----------------------------------------------------- mechanism */
  {
    id: "pseudo-mechanism",
    test: /\b(?:detox\w*|toxin release|boosts? immunity|immune boost|reset your|cellular renewal|rebalanc\w*|lymphatic drainage cures|energy fields?|restores? balance)\b/gi,
    category: "Mechanism language without a mechanism",
    kind: "mechanism",
    measurability: "unfalsifiable",
    hides: "What is being removed, added, or changed, and how anyone would know it happened.",
    substantiation: [
      "The substance or process being named, in ordinary words",
      "How the change would be detected if it did occur",
      "Whether that detection has ever been done",
    ],
    ask: "What is the specific mechanism, in plain words, and what evidence supports it for this outcome?",
    severity: "flag",
  },
  {
    id: "collagen",
    test: /\b(?:stimulates?|boosts?|builds?|regenerates?|rebuilds?)\s+(?:your\s+)?(?:own\s+)?collagen\b|\bcollagen (?:induction|remodelling|remodeling)\b/gi,
    category: "A real mechanism, doing rhetorical work",
    kind: "mechanism",
    measurability: "vague",
    hides:
      "Collagen stimulation is real for several of these treatments and says nothing on its own about how much, how long it lasts, or whether it is visible on your face.",
    substantiation: [
      "How much, over what period — the claim is usually about a biopsy, not a mirror",
      "How long the effect holds before it needs repeating",
      "Whether the visible change comes from collagen or from swelling in the first weeks",
    ],
    ask: "How much change, over what timescale, and how long before it needs repeating?",
    severity: "note",
  },
  {
    id: "chemical-free",
    test: /\b(?:chemical[-\s]?free|all[-\s]?natural|100%\s?natural|toxin[-\s]?free|clean (?:beauty|ingredients))\b/gi,
    category: "Purity framing",
    kind: "mechanism",
    measurability: "unfalsifiable",
    hides:
      "None of these words has a regulatory definition. They describe a mood rather than a formulation, and they are compatible with any ingredient list at all.",
    substantiation: [
      "The full ingredient list",
      "What the word is being used to exclude, specifically",
    ],
    ask: "What is actually in it — can I see the full ingredient list?",
    severity: "note",
  },

  /* ---------------------------------------------------- credential */
  {
    id: "title",
    test: /\b(?:injection specialist|aesthetic provider|skin expert|master injector|skin specialist|beauty expert|certified specialist)\b/gi,
    category: "Title without defined scope",
    kind: "credential",
    measurability: "measurable",
    hides:
      "A title nobody issues. The licence, the board, and the supervising physician stay unnamed.",
    substantiation: [
      "The licence type and number",
      "The board that issued it, which is searchable",
      "Who certified the certification, if one is claimed",
    ],
    ask: "What is your licence type and number, and who is the supervising physician?",
    severity: "flag",
  },
  {
    id: "experience-vague",
    test: /\b(?:years of experience|decades of experience|extensive (?:training|experience)|thousands of (?:treatments|patients|clients)|over \d[\d,]* (?:treatments|patients|procedures))\b/gi,
    category: "Volume as qualification",
    kind: "credential",
    measurability: "measurable",
    hides:
      "How many of those were this treatment, on skin like yours, and who counted. Volume is a real thing to ask about; it is just never the number that is printed.",
    substantiation: [
      "How many of this specific treatment, in the last year",
      "Training on this specific device, and who provided it",
      "Whether the number belongs to the person treating you or to the building",
    ],
    ask: "How many of this exact treatment have you personally done in the last year?",
    severity: "note",
  },
  {
    id: "medical-director",
    test: /\b(?:medical director|physician[-\s]?(?:led|owned|supervised)|doctor[-\s]?(?:led|owned))\b/gi,
    category: "Oversight named as a role, not a person",
    kind: "credential",
    measurability: "measurable",
    hides:
      "Whether the named clinician is in the building, how often, and whether they have ever seen you. A medical director can be a signature on a wall.",
    substantiation: [
      "The director's name and licence number",
      "How often they are physically on site",
      "Whether they review charts, and whether they would review yours",
    ],
    ask: "Who is the medical director by name, are they on site while I am treated, and do they review my chart?",
    severity: "flag",
  },
  {
    id: "medspa",
    test: /\b(?:medical spa|medspa|med[-\s]?spa)\b/gi,
    category: "Setting label without oversight detail",
    kind: "credential",
    measurability: "measurable",
    hides: "The label does not say who the supervising licensee is or whether they are on site.",
    substantiation: [
      "The supervising licensee's name and licence",
      "Whether the state requires supervision for this service, and at what distance",
    ],
    ask: "Who is the supervising medical licensee, and are they physically on site during my appointment?",
    severity: "flag",
  },

  /* --------------------------------------------------------- brand */
  {
    id: "proprietary",
    test: /\b(?:signature|proprietary protocol|proprietary blend|our own blend|house blend|exclusive (?:protocol|formula|method)|trademarked)\b/gi,
    category: "Signature / proprietary language",
    kind: "brand",
    measurability: "vague",
    hides: "The actual products, concentrations, device settings or ingredients inside the name.",
    substantiation: [
      "The products used, by name",
      "The concentrations or device settings",
      "What is proprietary about it, beyond the name",
    ],
    ask: "What are the actual products, concentrations, or device settings in it?",
    severity: "flag",
  },
  {
    id: "reputation",
    test: /\b(?:award[-\s]?winning|award\w*|voted|best in|celebrit\w*|as seen (?:on|in)|featured in|\d[\d,]*\+? (?:five[-\s]star|5[-\s]star) reviews?)\b|#1\b/gi,
    category: "Reputation substitution",
    kind: "brand",
    measurability: "vague",
    hides:
      "Who gave the award and what they measured. Reputation is being offered where credentials and the complication protocol would go.",
    substantiation: [
      "Which award, from whom, in what year, judged on what",
      "Whether the publication was paid",
      "The credentials the reputation is standing in for",
    ],
    ask: "Who is the medical director, and can I verify credentials and the complication protocol?",
    severity: "note",
  },
  {
    id: "latest-tech",
    test: /\b(?:latest technology|most advanced|state[-\s]?of[-\s]?the[-\s]?art|cutting[-\s]?edge|next[-\s]?generation|gold[-\s]?standard|revolutionary|breakthrough)\b/gi,
    category: "Superiority without a comparator",
    kind: "brand",
    measurability: "vague",
    hides:
      "What it is more advanced than, and whether newer is better for this indication. Newness is a purchasing decision the room made, not a clinical finding about you.",
    substantiation: [
      "What the previous generation was, and what changed",
      "Head-to-head evidence against the older approach, if any exists",
      "Whether the older one would suit you better and costs less",
    ],
    ask: "More advanced than what, and is there head-to-head evidence against the older approach?",
    severity: "note",
  },

  /* ---------------------------------------------------- commercial */
  {
    id: "time-pressure",
    test: /\b(?:today only|this week only|expires|last chance|limited spots|only \d+ (?:spots|slots) left|flash sale|book now to lock|while supplies last|ends (?:friday|sunday|tonight))\b/gi,
    category: "Time pressure",
    kind: "commercial",
    measurability: "measurable",
    hides:
      "Urgency applied to an elective medical decision. What it removes is the time to read the consent form and check a licence.",
    substantiation: [
      "Whether the price survives a proper consultation",
      "What the price is next month",
    ],
    ask: "Is this price still available after a proper consultation, or only under time pressure?",
    severity: "flag",
  },
  {
    id: "price-led",
    test: /\b(?:specials?|deals?|discounts?|package of \d+|bogo|save \d{1,3}\s?%|\d{1,3}\s?% off)\b|\$?\d+\s?(?:per|\/)\s?(?:unit|area|syringe)/gi,
    category: "Price-led framing",
    kind: "commercial",
    measurability: "measurable",
    hides: "Product identity, units, dilution, and who performs the service.",
    substantiation: [
      "Which product, and how many units",
      "Who administers it, and under what licence",
      "Whether the discounted product is the same as the full-price one",
    ],
    ask: "Which product, how many units, and which licensed person administers it?",
    severity: "note",
  },
  {
    id: "commitment",
    test: /\b(?:members?hips?|auto[-\s]?renew\w*|prepay\w*|credits? expire|subscriptions?|monthly plan|payment plan)\b/gi,
    category: "Commitment structure",
    kind: "commercial",
    measurability: "measurable",
    hides: "Exit terms, refund policy, and what happens to unused sessions.",
    substantiation: [
      "The written cancellation terms and the notice required",
      "What happens to credits already paid for",
      "Whether the price can change mid-term",
    ],
    ask: "What are the written cancellation and unused-credit terms?",
    severity: "flag",
  },
  {
    id: "financing",
    test: /\b(?:financing|0%\s?(?:apr|interest|finance)|as low as \$?\d+\s?(?:a|per|\/)\s?(?:month|mo)|affirm|klarna|cherry|buy now,? pay later)\b/gi,
    category: "Financing as pricing",
    kind: "commercial",
    measurability: "measurable",
    hides:
      "The total. A monthly figure is a smaller number describing the same amount of money, plus interest, over a term nobody has named.",
    substantiation: [
      "The total repayable, not the monthly figure",
      "The term, the APR after any promotional period, and the late terms",
      "Whether the treatment can be cancelled while the finance continues",
    ],
    ask: "What is the total repayable, over what term, and what happens to the loan if I stop treatment?",
    severity: "flag",
  },
  {
    id: "free-consult",
    test: /\b(?:free consultation|complimentary consultation|no[-\s]?obligation consultation)\b/gi,
    category: "The consultation as a sales appointment",
    kind: "commercial",
    measurability: "vague",
    hides:
      "Who conducts it, whether they are licensed, whether they are paid on what you buy, and whether you can leave with a written plan and no payment.",
    substantiation: [
      "Who runs the consultation, and their licence",
      "Whether the consultant is commissioned",
      "Whether a written plan and quote can be taken away without paying",
    ],
    ask: "Who conducts the consultation, are they licensed, and are they paid on what I buy?",
    severity: "note",
  },

  /* ------------------------------------------------------ temporal */
  {
    id: "instant",
    test: /\b(?:instant(?:ly|aneous)?|immediate results|walk out (?:looking|glowing)|see results in one|same[-\s]?day results|results you can see today)\b/gi,
    category: "Timeline compression",
    kind: "temporal",
    measurability: "measurable",
    hides: "Swelling, the settling period, and the honest review window.",
    substantiation: [
      "What the face looks like at day three, not day zero",
      "When the result is actually assessed",
      "What the review costs",
    ],
    ask: "When is the follow-up review, and what does it cost?",
    severity: "note",
  },
  {
    id: "no-downtime",
    test: /\b(?:no downtime|zero downtime|lunchtime (?:treatment|procedure|peel|lift)|back to work (?:immediately|the same day)|walk[-\s]?in walk[-\s]?out)\b/gi,
    category: "Downtime minimised",
    kind: "temporal",
    measurability: "measurable",
    hides:
      "What the first 72 hours actually require. Downtime is not only time off work — it is sun avoidance, skipped exercise, no makeup, and a face you may not want photographed.",
    substantiation: [
      "The written aftercare sheet, which is where the real downtime lives",
      "What percentage bruise, and for how long",
      "What you cannot do for the first week",
    ],
    ask: "Can I see the aftercare sheet — what can I not do for the first week?",
    severity: "flag",
  },

  /* --------------------------------------------------------- scope */
  {
    id: "universal",
    test: /\b(?:painless|gentle enough for anyone|safe for (?:everyone|all skin types)|all skin types,? no exceptions|suitable for everyone|works for every\w*)\b/gi,
    category: "Universality claim",
    kind: "scope",
    measurability: "unfalsifiable",
    hides:
      "Screening — especially for light and energy devices on deeper skin tones — and the intake conversation that would have found the reason not to.",
    substantiation: [
      "The device, and its settings for your skin type",
      "How the room screens Fitzpatrick type and history",
      "Who it is NOT suitable for, in their own words",
    ],
    ask: "What device and settings, and how do you screen my skin type and history first?",
    severity: "flag",
  },
  {
    id: "customised",
    test: /\b(?:customi[sz]ed just for you|custom protocol|tailored to you|bespoke (?:treatment|protocol|plan)|personali[sz]ed (?:protocol|plan|treatment))\b/gi,
    category: "Customisation claim",
    kind: "scope",
    measurability: "vague",
    hides: "Whether the assessment changes anything, who performs it, and what actually varies.",
    substantiation: [
      "What the assessment consists of",
      "Which variables actually change between two clients",
      "Who decides, and whether they are the person treating you",
    ],
    ask: "Customised based on what assessment, by whom, and what changes for my case?",
    severity: "note",
  },

  /* ----------------------------------------------------- affective */
  {
    id: "affective",
    test: /\b(?:best version of yourself|you deserve|confidence|invest in yourself|self[-\s]?care|feel like yourself again|glow[-\s]?up|transform(?:ative|ation)?|radian\w*|luminous|goddess|queen|treat yourself)\b/gi,
    category: "Language about you, not about the service",
    kind: "affective",
    measurability: "unfalsifiable",
    hides:
      "Everything. This is the part of the page doing the persuading, and it contains no information about the treatment, the person, the product or the price.",
    substantiation: [
      "Nothing could substantiate it — it is not that kind of sentence",
      "The useful move is to read the page again with these sentences removed, and see what is left",
    ],
    ask: "Setting aside how it is described — what exactly is done, by whom, with what, and what does it cost?",
    severity: "note",
  },
];

/* ------------------------------------------------------------ decoding */

/** Words doing persuasion rather than description. Quoted back, never counted. */
const PERSUASION =
  /\b(?:amazing|incredible|stunning|flawless|effortless|transformative|life[-\s]?changing|radiant|luminous|glowing|youthful|rejuvenat\w*|revitali[sz]\w*|indulg\w*|luxur\w*|blissful|serene|pamper\w*|melt away|banish|erase|obliterate|zap|magic\w*|miracle|secret weapon|holy grail)\b/gi;

const clip = (s: string, n = 180) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Sentences, with the character offset each one started at. */
function sentenceSpans(text: string): { text: string; at: number }[] {
  const out: { text: string; at: number }[] = [];
  const re = /[^.!?;\n]+[.!?;]*/g;
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    if (raw.trim().length < 2) continue;
    out.push({ text: raw.trim(), at: m.index ?? 0 });
  }
  return out;
}

function emotionalWorkIn(phrase: string): string | null {
  const hits = Array.from(
    new Set(Array.from(phrase.matchAll(PERSUASION)).map((m) => m[0].toLowerCase())),
  );
  if (!hits.length) return null;
  return hits.slice(0, 5).join(", ");
}

/** At most this many separate occurrences of one pattern are shown. */
const MAX_PER_RULE = 3;

/**
 * Decode every claim in the text.
 *
 * Every occurrence is found, not the first — a membership page that applies
 * time pressure six times is describing its own sales process, and a decoder
 * that reports one instance of it has flattened the most useful thing on the
 * page. `count` carries the full number even when the list is clipped.
 */
export function decodeClaims(text: string): DecodedClaim[] {
  const t = text.trim();
  if (t.length < 2) return [];
  const spans = sentenceSpans(t);
  const out: DecodedClaim[] = [];

  for (const rule of CLAIM_RULES) {
    const matching = spans.filter((s) => {
      rule.test.lastIndex = 0;
      return rule.test.test(s.text);
    });

    let hits: { text: string; at: number }[] = matching;
    if (!hits.length) {
      // The pattern only matches across a sentence boundary. Quoting the whole
      // block back as "the phrase" would put words in the venue's mouth, so
      // quote exactly what matched and nothing around it.
      rule.test.lastIndex = 0;
      const m = rule.test.exec(t);
      if (!m) continue;
      hits = [{ text: m[0], at: m.index }];
    }

    // Two sentences that are byte-identical are one finding, not two.
    const seen = new Set<string>();
    const distinct = hits.filter((h) => {
      const k = h.text.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    for (const h of distinct.slice(0, MAX_PER_RULE)) {
      out.push({
        phrase: clip(h.text),
        category: rule.category,
        kind: rule.kind,
        measurability: rule.measurability,
        hides: rule.hides,
        substantiation: rule.substantiation,
        emotionalWork: emotionalWorkIn(h.text),
        ask: rule.ask,
        severity: rule.severity,
        at: h.at,
        count: distinct.length,
      });
    }
  }

  const rank: Record<ClaimSeverity, number> = { hard: 0, flag: 1, note: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.at - b.at);
}

/* ------------------------------------------------------------ readouts */

export interface ClaimSummary {
  total: number;
  /** Distinct patterns, as opposed to occurrences. */
  patterns: number;
  byKind: { kind: ClaimKind; n: number }[];
  byMeasurability: Record<Measurability, number>;
  hard: number;
  flag: number;
  note: number;
  /** The single sentence that best describes what this copy is doing. */
  line: string;
  /**
   * What is left when the unfalsifiable sentences are removed — the honest
   * information density of the page.
   */
  checkable: number;
}

export function summariseClaims(claims: DecodedClaim[], text: string): ClaimSummary {
  const byKindMap = new Map<ClaimKind, number>();
  for (const c of claims) byKindMap.set(c.kind, (byKindMap.get(c.kind) ?? 0) + 1);
  const byKind = Array.from(byKindMap, ([kind, n]) => ({ kind, n })).sort((a, b) => b.n - a.n);

  const byMeasurability: Record<Measurability, number> = {
    measurable: 0,
    vague: 0,
    unfalsifiable: 0,
  };
  for (const c of claims) byMeasurability[c.measurability] += 1;

  const hard = claims.filter((c) => c.severity === "hard").length;
  const flag = claims.filter((c) => c.severity === "flag").length;
  const note = claims.filter((c) => c.severity === "note").length;
  const patterns = new Set(claims.map((c) => c.category)).size;
  const checkable = byMeasurability.measurable;

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const line = !claims.length
    ? words < 8
      ? "Not enough copy to read. Paste the paragraph they sold you on, not the service name."
      : "No flagged pattern in this passage. That is not an endorsement — quiet copy and a resolved room are different things, and only one of them is on this desk."
    : byMeasurability.unfalsifiable > byMeasurability.measurable
      ? `Most of what this passage claims could not be shown to be wrong. ${byMeasurability.unfalsifiable} of ${claims.length} findings are sentences no answer would count against, which means asking about them politely produces more of the same sentence.`
      : hard > 0
        ? `${hard} claim${hard === 1 ? "" : "s"} here would need something in writing before money moves. The rest is ordinary marketing, and ordinary marketing is not the problem — the two hard ones are.`
        : `${claims.length} findings, ${checkable} of them checkable. The checkable ones are your questions; the rest is atmosphere.`;

  return {
    total: claims.length,
    patterns,
    byKind,
    byMeasurability,
    hard,
    flag,
    note,
    line,
    checkable,
  };
}

/** Every rule's category, for the reference library. */
export const CLAIM_CATEGORIES = CLAIM_RULES.map((r) => ({
  id: r.id,
  category: r.category,
  kind: r.kind,
  measurability: r.measurability,
  severity: r.severity,
  hides: r.hides,
}));
