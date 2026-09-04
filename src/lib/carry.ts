/**
 * What this desk contributes to the Vanity context, and how it puts it on a
 * link.
 *
 * The vocabulary is in `vanity-context.ts` and the record that keeps it is in
 * `vanity-carry.ts`; both are byte-identical across the three repositories.
 * This file is the local half.
 *
 * This desk's contribution is narrow on purpose. It knows one thing the other
 * two cannot know — that a professional treatment of a particular class is
 * being considered, and how settled that is — and it knows nothing at all about
 * anybody's skin. It does not read a face, it reads a website. So it states the
 * service class, the count of things the setting has still not named, and
 * whether a provider has actually given an aftercare window; and it states
 * nothing else, however much of the assessment might look interesting.
 *
 * The count is the field that changes a decision at the far end. "A procedure
 * is in play" and "a procedure is in play and eleven things about the room are
 * still unanswered" are different instructions about whether a routine should
 * stop escalating, and the second one is the truth far more often.
 */

import { isMedicalClass, type Assessment, type ServiceClass as SpaServiceClass } from "./engine";
import {
  VANITY_CONTEXT_VERSION,
  vanityContextParams,
  type ServiceClass,
  type VanityContext,
} from "./vanity-context.ts";
import {
  carryContext,
  loadCarry,
  mergeCarry,
  saveCarry,
  type CarriedContext,
} from "./vanity-carry.ts";

/**
 * This desk's classes, in the fleet's words.
 *
 * The two lists were written independently and mostly agree. Where they do not,
 * the mapping is explicit here rather than being assumed to be an identity —
 * which is how `medspa` would otherwise have crossed as a service class that no
 * receiver has ever heard of, and been dropped in silence.
 */
const CLASS_MAP: Partial<Record<SpaServiceClass, ServiceClass>> = {
  facial: "facial",
  injectable: "injectable",
  device: "device",
  bodywork: "bodywork",
  chemical: "chemical",
  iv: "iv",
  other: "other",
};

export function spaContext(a: Assessment): VanityContext {
  const ctx: VanityContext = { v: VANITY_CONTEXT_VERSION, from: "spa" };
  const cls = a.input.serviceClass;
  if (cls !== "unselected") {
    ctx.serviceClass = CLASS_MAP[cls] ?? "other";
    // A named class means somebody is being considered to perform it. That is
    // the only reading of "professional" this desk can honestly make, and it is
    // the reading the other two need: stop climbing a ladder toward a date.
    ctx.professional = true;
  }
  ctx.openQuestions = a.failClosed.length;
  if (a.signals.some((s) => s.id === "aftercare" && s.state === "known")) {
    ctx.aftercareAnswered = true;
  }
  return ctx;
}

/** True when there is anything worth writing down yet. */
export function spaContextIsUseful(a: Assessment): boolean {
  return a.input.serviceClass !== "unselected" || a.posture.key !== "empty";
}

export function contributeSpa(a: Assessment): CarriedContext {
  const next = mergeCarry(loadCarry(), spaContext(a));
  saveCarry(next);
  return next;
}

/** Whether this desk classes the considered service as medical. Re-exported so
 * the shell does not have to import the engine to ask. */
export const spaClassIsMedical = isMedicalClass;

/**
 * Put the whole record on an outbound fleet link.
 *
 * Applied at click time rather than baked into every `href`: a link whose
 * address depends on localStorage renders one way on the server and another in
 * the browser, which is a hydration mismatch dressed as a feature.
 */
export function withCarry(href: string): string {
  const ctx = carryContext(loadCarry(), "spa");
  if (!ctx) return href;
  try {
    const url = new URL(href, typeof window === "undefined" ? undefined : window.location.href);
    for (const [key, value] of vanityContextParams(ctx)) url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return href;
  }
}
