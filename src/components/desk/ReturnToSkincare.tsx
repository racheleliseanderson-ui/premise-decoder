import { SERVICE_LABELS, isMedicalClass, type Assessment } from "@/lib/engine";
import { RETURN_CARRIES, returnHandoffHref } from "@/lib/handoff";
import type { Mode } from "@/lib/modes";

/**
 * The return leg.
 *
 * A procedure decision does not end at the procedure. The week either side of
 * it is a routine question, and that is the other desk's subject. This is the
 * only outbound link in the app that carries anything, so it says what.
 *
 * It appears once a service class has been named, because before that there is
 * nothing to hand over and the link would just be an advertisement.
 */
export function ReturnToSkincare({ a, mode }: { a: Assessment; mode: Mode }) {
  const cls = a.input.serviceClass;
  if (cls === "unselected") return null;

  const medical = isMedicalClass(cls);
  const href = returnHandoffHref({ serviceClass: cls, medical, mode });

  return (
    <section className="no-print border border-rule bg-parchment/60 p-6">
      <p className="eyebrow">Before and after the appointment</p>
      <h3 className="mt-3 font-display text-xl leading-snug text-ink">
        The fortnight either side of this is a routine question
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
        {medical
          ? `A ${SERVICE_LABELS[cls].toLowerCase()} changes what a routine can carry for a while — before it, and for longer after it than most people are told. Skincare Intelligence keeps the routine side: what to pause, in what order to bring things back, and what a reaction afterwards actually rules out.`
          : `Even without a medical class in play, the days around a ${SERVICE_LABELS[cls].toLowerCase()} are when a routine most often gets changed by accident. Skincare Intelligence keeps that side of the record.`}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{RETURN_CARRIES}</p>
      <a href={href} className="btn-primary mt-5 inline-flex" target="_blank" rel="noopener">
        Take this to Skincare Intelligence
      </a>
    </section>
  );
}
