/**
 * Whole-word term matching, shared by the engine and the catalog.
 *
 * Both files used to ask `String.includes` whether a term was present. That is
 * the wrong instrument for vocabularies that contain two- and three-letter
 * tokens: "pa" is inside "spa", "do" is inside "does", "tox" is inside
 * "detox", "pla" is inside "plasma". Each of those produced a silent false
 * positive -- a licensed performer, a neurotoxin injection -- on evidence the
 * reader never gave.
 *
 * Guards are Unicode-aware letter/number lookarounds rather than a word
 * boundary escape, so a term that begins or ends in punctuation ("license #",
 * "pa-c", "clear + brilliant") anchors on the side that has a word character
 * and stays open on the side that does not. A word boundary after "#" would
 * refuse to match "license #12345".
 */

const RE_SPECIALS = /[.*+?^${}()|[\]\\]/g;
const cache = new Map<string, RegExp>();

/**
 * A cached, boundary-anchored pattern for one term. Internal whitespace is
 * relaxed so "medical  grade" and "medical grade" read the same.
 */
export function termPattern(term: string, flags = "iu"): RegExp {
  const key = `${flags} ${term}`;
  let re = cache.get(key);
  if (!re) {
    const trimmed = term.trim();
    const body = trimmed.replace(RE_SPECIALS, "\\$&").replace(/\s+/g, "\\s+");
    const pre = /^[\p{L}\p{N}]/u.test(trimmed) ? "(?<![\\p{L}\\p{N}])" : "";
    const post = /[\p{L}\p{N}]$/u.test(trimmed) ? "(?![\\p{L}\\p{N}])" : "";
    re = new RegExp(`${pre}${body}${post}`, flags);
    cache.set(key, re);
  }
  return re;
}

/** True when `term` appears in `text` as a whole word, case-insensitively. */
export const containsTerm = (text: string, term: string): boolean =>
  term.trim().length > 0 && termPattern(term, "iu").test(text);

/** Case-SENSITIVE whole-word test, for tokens that collide with English. */
export const containsTermCased = (text: string, term: string): boolean =>
  term.trim().length > 0 && termPattern(term, "u").test(text);

/** True when any term in the list appears as a whole word. */
export const containsAny = (text: string, terms: readonly string[]): boolean =>
  terms.some((t) => containsTerm(text, t));
