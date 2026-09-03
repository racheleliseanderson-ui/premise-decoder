/**
 * Refresh the Register snapshot in src/lib/register.ts.
 *
 * The desk carries a committed copy of a handful of Register entries rather
 * than fetching them, so the page works offline and adds no CORS surface. A
 * committed copy rots, which is what this script is for.
 *
 * It rewrites only the block between the two SNAPSHOT markers. The matchers
 * underneath are editorial judgement about which words constitute a claim, and
 * this script does not touch them — if you add an entry to the Register that
 * belongs on this desk, add its key here and write its matcher by hand.
 *
 *   node scripts/sync-register.mjs            check and rewrite
 *   node scripts/sync-register.mjs --check    fail if stale, change nothing
 *
 * Exit codes: 0 nothing to do or written, 1 stale under --check, 2 failed.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const EXPORT_URL = "https://vanityvice.blog/register/export.json";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(HERE, "..", "src", "lib", "register.ts");
const BEGIN = "/* --- BEGIN REGISTER SNAPSHOT (generated; edit via scripts/sync-register.mjs) --- */";
const END = "/* --- END REGISTER SNAPSHOT --- */";

/**
 * Which entries this desk carries, and what it calls them.
 *
 * Keyed by the local name used in the matchers, valued by the Register slug.
 * Deliberately explicit: the Register is a publication-wide instrument and most
 * of it has nothing to do with booking a treatment, so the desk takes the part
 * that does rather than everything.
 */
const WANTED = {
  exosomes: "topical-exosome-skin-rejuvenation",
  polynucleotides: "polynucleotide-injections-skin-regeneration",
  ledMask: "at-home-led-mask-dose",
  medicalGrade: "medical-grade-skincare",
  collagen: "oral-collagen-skin-ageing",
  nad: "topical-nad-nmn-serums",
  blueLight: "screen-blue-light-skin",
};

const quote = (value) => JSON.stringify(String(value ?? ""));

function block(bySlug) {
  const lines = [BEGIN, "const ENTRIES: Record<string, RegisterEntry> = {"];
  for (const [key, slug] of Object.entries(WANTED)) {
    const row = bySlug.get(slug);
    if (!row) {
      throw new Error(`the Register no longer publishes "${slug}" — remove its matcher too`);
    }
    lines.push(`  ${key}: {`);
    lines.push(`    slug: ${quote(row.slug)},`);
    lines.push(`    title: ${quote(row.title)},`);
    lines.push(`    url: ${quote(row.url)},`);
    lines.push(`    position: ${quote(row.evidence_position)},`);
    lines.push(`    absence: ${quote(row.absence_type)},`);
    lines.push(`    verdict:`);
    lines.push(`      ${quote(row.verdict)},`);
    lines.push(`    lastSearched: ${quote(row.last_searched)},`);
    lines.push("  },");
  }
  lines.push("};", END);
  return lines.join("\n");
}

async function main() {
  const check = process.argv.includes("--check");

  const response = await fetch(EXPORT_URL, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`${EXPORT_URL} returned ${response.status}`);
  }
  const payload = await response.json();
  const claims = Array.isArray(payload?.claims) ? payload.claims : [];
  if (!claims.length) {
    throw new Error("the export came back with no claims in it; refusing to blank the snapshot");
  }
  const bySlug = new Map(claims.map((row) => [row.slug, row]));

  const source = await readFile(TARGET, "utf8");
  const start = source.indexOf(BEGIN);
  const finish = source.indexOf(END);
  if (start === -1 || finish === -1) {
    throw new Error("snapshot markers are missing from src/lib/register.ts");
  }

  const current = source.slice(start, finish + END.length);
  const next = block(bySlug);
  if (current === next) {
    console.log("Register snapshot is current.");
    return 0;
  }
  if (check) {
    console.error("Register snapshot is stale. Run: node scripts/sync-register.mjs");
    return 1;
  }
  await writeFile(TARGET, source.slice(0, start) + next + source.slice(finish + END.length), "utf8");
  console.log(`Register snapshot updated from ${EXPORT_URL}.`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`sync-register: ${error.message}`);
    process.exit(2);
  });
