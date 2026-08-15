/**
 * Panel modes and their public URLs.
 * Each desk panel is a real route so it can be linked, bookmarked, and indexed.
 */

export type Mode =
  | "fast"
  | "intake"
  | "full"
  | "compare"
  | "prep"
  | "decode"
  | "library"
  | "packet";

export const MODE_PATH = {
  fast: "/fast-path",
  intake: "/venue-text",
  full: "/evaluate",
  compare: "/compare",
  prep: "/consult-prep",
  decode: "/claim-decoder",
  library: "/library",
  packet: "/packet",
} as const satisfies Record<Mode, string>;

export const PATH_MODE: Record<string, Mode> = {
  "/fast-path": "fast",
  "/venue-text": "intake",
  "/evaluate": "full",
  "/compare": "compare",
  "/consult-prep": "prep",
  "/claim-decoder": "decode",
  "/library": "library",
  "/packet": "packet",
};

export const MODES: { id: Mode; path: (typeof MODE_PATH)[Mode]; label: string }[] = [
  { id: "fast", path: "/fast-path", label: "Fast path" },
  { id: "intake", path: "/venue-text", label: "Add venue text" },
  { id: "full", path: "/evaluate", label: "Full evaluate" },
  { id: "compare", path: "/compare", label: "Compare venues" },
  { id: "prep", path: "/consult-prep", label: "Consult prep" },
  { id: "decode", path: "/claim-decoder", label: "Claim decoder" },
  { id: "library", path: "/library", label: "Reference library" },
  { id: "packet", path: "/packet", label: "Decision packet" },
];

export const isMode = (v: string): v is Mode => MODES.some((m) => m.id === v);

function cleanPath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

/** Resolve a URL to a panel. Returns null when the path is not a desk panel. */
export function modeFromPath(pathname: string): Mode | null {
  const clean = cleanPath(pathname);
  if (PATH_MODE[clean]) return PATH_MODE[clean];
  for (const [path, mode] of Object.entries(PATH_MODE)) {
    if (path !== "/" && clean.endsWith(path)) return mode;
  }
  return null;
}

/** Per-route <title> + meta. Descriptions stay ~155 characters and lead with the reader's problem. */
export const MODE_META: Record<
  Mode,
  { title: string; description: string; ogTitle: string }
> = {
  fast: {
    title: "Fast path · four questions before you book · Spa Intelligence",
    description:
      "Four answers before you book: the service, the setting, who performs it, and the named product. Gaps stay gaps. Education only.",
    ogTitle: "Fast path · Spa Intelligence",
  },
  intake: {
    title: "Paste a spa menu · see what it stayed silent on · Spa Intelligence",
    description:
      "Paste a spa ad or menu. The desk quotes what was named and reports what the text stayed silent on. Education only.",
    ogTitle: "Add venue text · Spa Intelligence",
  },
  full: {
    title: "Full evaluate · setting disclosure desk · Spa Intelligence",
    description:
      "Walk the setting one stage at a time — identity, who performs it, practice, marketing. Unknowns print as unknowns. Education only.",
    ogTitle: "Full evaluate · Spa Intelligence",
  },
  compare: {
    title: "Compare settings · disclosure side by side · Spa Intelligence",
    description:
      "Compare up to five settings on how much each one named. Not a ranking of quality or safety. Education only.",
    ogTitle: "Compare venues · Spa Intelligence",
  },
  prep: {
    title: "Consult prep · questions to take into the room · Spa Intelligence",
    description:
      "A question sheet built from your own gaps. Tick what they answered and write what they said. Print it. Education only.",
    ogTitle: "Consult prep · Spa Intelligence",
  },
  decode: {
    title: "Claim Decoder · paste a spa ad and see what it hides · Spa Intelligence",
    description:
      "Paste a spa’s ad and see what the sentence left out. Certainty language, tier words, and pressure come apart first. Education only.",
    ogTitle: "Claim Decoder · Spa Intelligence",
  },
  library: {
    title: "What does medical-grade mean? · Reference library · Spa Intelligence",
    description:
      "What each service class has to name, a 14-entry glossary of spa language, and where to verify a credential. Education only.",
    ogTitle: "Reference library · Spa Intelligence",
  },
  packet: {
    title: "Setting Decision Packet · print for your consult · Spa Intelligence",
    description:
      "A typeset packet of what was named, what was refused, and what stayed silent — plus your consult notes. Education only.",
    ogTitle: "Decision packet · Spa Intelligence",
  },
};

/** Default / share-card description — the strongest line in the project. */
export const SITE_DESCRIPTION =
  "Compare up to five settings, decode marketing claims, and take a typeset decision packet into the consultation. Education only.";

export const SITE_TITLE = "Spa Intelligence · Setting Evaluation Desk · Vanity or Vice";

export function routeHead(mode: Mode) {
  const m = MODE_META[mode];
  return {
    meta: [
      { title: m.title },
      { name: "description", content: m.description },
      { property: "og:title", content: m.ogTitle },
      { property: "og:description", content: SITE_DESCRIPTION },
      { name: "twitter:title", content: m.ogTitle },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
  };
}

export function scrollToId(id: string, behavior: ScrollBehavior = "auto") {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector("header");
  const offset = header instanceof HTMLElement ? header.getBoundingClientRect().height + 8 : 64;
  const r = el.getBoundingClientRect();
  // Already on screen — do not yank the page.
  if (r.top >= offset - 8 && r.top <= window.innerHeight * 0.6) return;
  const top = r.top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export type GoScroll = "desk" | "top" | "demos" | "none" | "panel";

