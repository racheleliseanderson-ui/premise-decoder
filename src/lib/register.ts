/**
 * The Register of Unproven Claims, read by the desk.
 *
 * The publication keeps a permanent record for beauty claims it has taken
 * apart: the claim as marketed, the same claim rewritten so somebody could
 * test it, an evidence position from a closed set, a named type of absence,
 * and the date the search behind it was last run. It lives at
 * vanityvice.blog/register/ and it publishes itself as JSON.
 *
 * This desk already reads pasted marketing copy and names the patterns in it.
 * What it could not do until now is say whether the specific claim in front of
 * you has already been adjudicated — which is the more useful sentence, and the
 * one nobody else can say, because nobody else keeps the record.
 *
 * So: where the pasted text makes a claim the Register covers, the decoder
 * says so, gives the position, and links the entry. Where it does not, nothing
 * appears. The matchers are deliberately narrow. A false positive here would
 * attach a published verdict to a claim that was never made, which is the exact
 * failure this publication exists to complain about, so every pattern below has
 * to name the thing rather than gesture at its neighbourhood.
 *
 * The data is a snapshot, committed rather than fetched. A live request would
 * put a network dependency and a CORS surface in front of a page that has to
 * work offline, for a payload that changes a few times a month. Run
 * `node scripts/sync-register.mjs` to refresh it; the script rewrites the
 * block below from the published export and leaves the matchers alone.
 */

export const REGISTER_SOURCE = "https://vanityvice.blog/register/";
export const REGISTER_EXPORT = "https://vanityvice.blog/register/export.json";
export const REGISTER_METHOD = "https://vanityvice.blog/how-the-register-works/";

/** One published claim record. */
export interface RegisterEntry {
  slug: string;
  title: string;
  url: string;
  /** One of the six published evidence positions. */
  position: string;
  /** The named type of absence, where the position carries one. */
  absence: string;
  /** Written to be true when quoted alone. Twenty-five words or fewer. */
  verdict: string;
  /** The date the absence was last verified, not the date the page changed. */
  lastSearched: string;
}

/** An entry plus the words in the pasted copy that reached it. */
export interface RegisterHit {
  entry: RegisterEntry;
  /** What the reader's text actually said, quoted back. */
  matched: string;
}

interface RegisterRule {
  entry: RegisterEntry;
  /**
   * Both halves have to appear. The subject pins which claim this is; the
   * assertion confirms a claim is being made about it rather than the word
   * merely appearing on the page. "We use exosomes" is a fact about the menu.
   * "Exosomes rebuild your skin" is a claim, and only the second gets an entry
   * attached to it.
   */
  subject: RegExp;
  assertion: RegExp;
}

/* --- BEGIN REGISTER SNAPSHOT (generated; edit via scripts/sync-register.mjs) --- */
const ENTRIES: Record<string, RegisterEntry> = {
  exosomes: {
    slug: "topical-exosome-skin-rejuvenation",
    title: "Exosomes rebuild skin after treatment",
    url: "https://vanityvice.blog/register/topical-exosome-skin-rejuvenation/",
    position: "Thinly supported",
    absence: "Characterisation failure",
    verdict:
      "No exosome product is FDA-approved, and the published studies do not describe what was in the vial well enough for anyone to repeat them.",
    lastSearched: "2026-09-03",
  },
  polynucleotides: {
    slug: "polynucleotide-injections-skin-regeneration",
    title: "Polynucleotide injections regenerate the skin",
    url: "https://vanityvice.blog/register/polynucleotide-injections-skin-regeneration/",
    position: "Thinly supported",
    absence: "Characterisation failure",
    verdict:
      "Nine studies, all rated low or moderate quality, covering 219 patients between them. Real signal, and nowhere near enough of it to conclude.",
    lastSearched: "2026-09-03",
  },
  ledMask: {
    slug: "at-home-led-mask-dose",
    title: "At-home LED masks deliver a clinical dose",
    url: "https://vanityvice.blog/register/at-home-led-mask-dose/",
    position: "No adequate source found",
    absence: "Characterisation failure",
    verdict:
      "We found no published independent measurement of what a consumer facial LED mask actually delivers. The dose is the claim, and it is unverified.",
    lastSearched: "2026-09-03",
  },
  medicalGrade: {
    slug: "medical-grade-skincare",
    title: "“Medical-grade” skincare is a regulated tier",
    url: "https://vanityvice.blog/register/medical-grade-skincare/",
    position: "Not established",
    absence: "True absence",
    verdict:
      "No regulator in the US, UK or EU defines, confers or enforces \"medical-grade\" for cosmetics. There are cosmetics and there are drugs.",
    lastSearched: "2026-09-03",
  },
  collagen: {
    slug: "oral-collagen-skin-ageing",
    title: "Oral collagen supplements reverse skin ageing",
    url: "https://vanityvice.blog/register/oral-collagen-skin-ageing/",
    position: "Not established",
    absence: "Supplier-generated only",
    verdict:
      "Oral collagen's measured benefit for skin disappears once pharmaceutical-company-funded and low-quality trials are separated from the rest.",
    lastSearched: "2026-09-03",
  },
  nad: {
    slug: "topical-nad-nmn-serums",
    title: "Topical NAD+ and NMN serums",
    url: "https://vanityvice.blog/register/topical-nad-nmn-serums/",
    position: "Untested as claimed",
    absence: "Plausibility gap",
    verdict:
      "No controlled human trial of topical NAD+ or NMN with skin endpoints has been published. The formulation literature exists because the molecule penetrates poorly.",
    lastSearched: "2026-09-03",
  },
  blueLight: {
    slug: "screen-blue-light-skin",
    title: "Blue light from screens ages your skin",
    url: "https://vanityvice.blog/register/screen-blue-light-skin/",
    position: "No adequate source found",
    absence: "Claim transfer",
    verdict:
      "Visible light from the sun does cause pigmentation. That evidence belongs to sunlight, not your monitor, and was carried across without a trial.",
    lastSearched: "2026-09-03",
  },
};
/* --- END REGISTER SNAPSHOT --- */

/**
 * What counts as an assertion.
 *
 * Shared across rules so one vocabulary governs the whole file. A treatment
 * menu that lists an ingredient is not making a claim; a menu that says the
 * ingredient does something is.
 */
const ASSERTS =
  /\b(?:rebuild\w*|regenerat\w*|repair\w*|restor\w*|reverse\w*|renew\w*|stimulat\w*|boost\w*|rejuvenat\w*|remodel\w*|heal\w*|proven|clinically|results?|transform\w*|firm\w*|plump\w*|lift\w*|anti[-\s]?ag\w*|younger|tighten\w*|improve\w*|deliver\w*|treat\w*)\b/i;

const RULES: RegisterRule[] = [
  {
    entry: ENTRIES["exosomes"]!,
    subject: /\bexosom\w*\b/i,
    assertion: ASSERTS,
  },
  {
    entry: ENTRIES["polynucleotides"]!,
    subject: /\b(?:polynucleotides?|\bPDRN\b|salmon\s+DNA)\b/i,
    assertion: ASSERTS,
  },
  {
    entry: ENTRIES["ledMask"]!,
    subject:
      /\b(?:LED\s+(?:mask|facial|therapy|light)|red[-\s]light\s+therapy|photobiomodulation)\b/i,
    assertion: /\b(?:clinic(?:al|-strength|\s+strength)|professional[-\s]grade|same\s+(?:light|wavelengths?|technology)|salon[-\s]strength|medical[-\s]grade|proven|results?)\b/i,
  },
  {
    entry: ENTRIES["medicalGrade"]!,
    subject: /\bmedical[-\s]?grade\b/i,
    // The phrase is itself the claim, so any use of it qualifies. Kept as a
    // matcher rather than a bare subject test so the shape of the file holds.
    assertion: /\b(?:medical[-\s]?grade)\b/i,
  },
  {
    entry: ENTRIES["collagen"]!,
    subject:
      /\b(?:collagen\s+(?:drink|supplement|shot|sachet|peptides?|powder)|(?:drink|ingest|oral)\w*\s+collagen)\b/i,
    assertion: ASSERTS,
  },
  {
    entry: ENTRIES["nad"]!,
    subject: /\b(?:NAD\+?|NMN|nicotinamide\s+(?:mononucleotide|riboside))\b/,
    assertion: /\b(?:topical\w*|serum|cream|facial|infusion|applied|skin)\b/i,
  },
  {
    entry: ENTRIES["blueLight"]!,
    subject: /\bblue\s+light\b/i,
    assertion: /\b(?:screens?|devices?|phones?|laptops?|digital|monitor)\b/i,
  },
];

/** Quote the sentence a rule fired on, trimmed, so the reader sees their own words. */
function sentenceFor(text: string, subject: RegExp, assertion: RegExp): string {
  const sentences = text.split(/(?<=[.!?;])\s+|\n+/).filter((s) => s.trim());
  const hit = sentences.find((s) => subject.test(s) && assertion.test(s));
  const source = (hit ?? text).trim().replace(/\s+/g, " ");
  return source.length > 180 ? `${source.slice(0, 179)}…` : source;
}

/**
 * Which published claims does this text actually make?
 *
 * Order follows the rule list rather than the text, so two runs on the same
 * copy produce the same reading. Returns an empty array for anything that
 * makes no claim the Register covers, which is most copy, and that silence is
 * the correct answer rather than a failure to find something.
 */
export function matchRegister(text: string): RegisterHit[] {
  const source = (text ?? "").trim();
  if (source.length < 3) return [];
  const hits: RegisterHit[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    if (seen.has(rule.entry.slug)) continue;
    if (!rule.subject.test(source)) continue;
    if (!rule.assertion.test(source)) continue;
    // Both halves must land in the same sentence. A menu that mentions
    // exosomes in one paragraph and promises results in another has not
    // necessarily promised results from the exosomes.
    const sentences = source.split(/(?<=[.!?;])\s+|\n+/).filter((s) => s.trim());
    const together = sentences.some((s) => rule.subject.test(s) && rule.assertion.test(s));
    if (!together && sentences.length > 1) continue;
    seen.add(rule.entry.slug);
    hits.push({ entry: rule.entry, matched: sentenceFor(source, rule.subject, rule.assertion) });
  }
  return hits;
}
