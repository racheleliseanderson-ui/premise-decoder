/**
 * Desk vocabulary, defined at the point of use.
 * These are the guide's own words — not clinical advice.
 */

export const TERMS = {
  desk: {
    word: "the desk",
    meaning:
<<<<<<< Updated upstream
      "This guide. It scores how much of a setting was named to you. It does not diagnose, rank, or clear you for anything.",
  },
  failClosed: {
    word: "unnamed stays open",
    meaning:
      "When identity is unnamed or vague, the field stays open. We do not guess. The desk never fills a gap by assuming.",
=======
      "This tool. It shows how much of a setting was actually named to you. It does not diagnose, rank, or clear you for anything.",
  },
  failClosed: {
    word: "Not stated",
    meaning:
      "The spa has not named this, or named it too vaguely to check. The line stays open — nothing is filled in by guessing.",
>>>>>>> Stashed changes
  },
  place: {
    word: "Place",
    meaning:
      "How much of the setting is actually named and checkable — performer, license, product, sanitation, night cover. Not a quality score.",
  },
  promise: {
    word: "Promise",
    meaning:
      "How much marketing pressure is in the text as written. A high Promise with a low Place is a Gap.",
  },
  gap: {
    word: "Gap",
    meaning: "Promise minus Place. Marketing density that is not matched by named setting facts.",
  },
  burden: {
    word: "Burden",
    meaning:
      "How much verification this service class and setting typically require. High burden is not a warning against booking — it is a longer question list.",
  },
  posture: {
    word: "where this stands",
    meaning:
      "How far this venue has got: nothing entered, partly named, or largely named. Largely named means enough was said to have a real conversation — not that the service is right for you.",
  },
  signal: {
    word: "what gets checked",
    meaning:
<<<<<<< Updated upstream
      "One scored fact about the setting (menu, performer, sanitation…). Each signal is known, partial, or unnamed, and can also be a refusal.",
=======
      "One thing about the setting (the menu line, who performs it, sanitation…). Each one is either named, partly named, or not stated — and can also be something you asked about and were not told.",
>>>>>>> Stashed changes
  },
  weight: {
    word: "weight",
    meaning:
      "How much one answer moves the Place figure. Identity and who performs it weigh more than optional marketing texture.",
  },
} as const;

export type TermId = keyof typeof TERMS;

/** Credential abbreviations expanded on first use. A title is not a credential. */
export const CREDENTIALS: { abbr: string; expand: string }[] = [
  { abbr: "NP", expand: "nurse practitioner" },
  { abbr: "RN", expand: "registered nurse" },
  { abbr: "PA-C", expand: "physician assistant, certified" },
  { abbr: "MD", expand: "doctor of medicine" },
  { abbr: "DO", expand: "doctor of osteopathic medicine" },
  { abbr: "APRN", expand: "advanced practice registered nurse" },
  { abbr: "DNP", expand: "doctor of nursing practice" },
  { abbr: "LME", expand: "licensed medical esthetician" },
  { abbr: "LMT", expand: "licensed massage therapist" },
  { abbr: "DDS", expand: "doctor of dental surgery" },
  { abbr: "DMD", expand: "doctor of dental medicine" },
];

export const CREDENTIAL_HINT =
  "A title is marketing. A license is checkable against the state board. First use: NP (nurse practitioner), RN (registered nurse), PA-C (physician assistant), MD / DO (physician), APRN (advanced practice RN), DNP (doctor of nursing practice), LME (licensed medical esthetician), LMT (licensed massage therapist), DDS / DMD (dentist).";
