import { useEffect } from "react";
import { spaHandoffUrl } from "@/lib/spa-decision-record";
import { useDesk } from "@/lib/desk-context";
import { contributeSpa, spaContextIsUseful, withCarry } from "@/lib/carry";

/**
 * Attach the Vanity Decision Record to outgoing fleet links, at click time.
 *
 * Click time rather than render time on purpose. The record is written into the
 * URL fragment, which means it is genuinely large and genuinely private — it
 * never leaves the browser, because a fragment is not sent to a server — and
 * building it into every link on every render would put a reader's whole
 * history into the DOM of a page they may never leave.
 *
 * Only the two sibling desks are decorated. A link to the publication, to the
 * house, or anywhere else gets nothing: a record is for the desks that can read
 * it, and quietly attaching one to an ordinary outbound link would be a
 * transfer nobody asked for. `data-vv-no-record="1"` opts a link out entirely.
 */
const FLEET_HOSTS = ["skincare.vanityvice.blog", "makeup.vanityvice.blog"];

export function DecisionRecordBridge() {
  const { a: assessment } = useDesk();

  /**
   * Keep the standing Vanity context current.
   *
   * This desk knows one thing the other two cannot: that a treatment of a
   * particular class is being considered, and how settled that is. Carrying it
   * is what lets Skincare stop escalating a titration toward a date, instead of
   * a reader having to remember to say so on three separate desks.
   */
  useEffect(() => {
    if (!spaContextIsUseful(assessment)) return;
    contributeSpa(assessment);
  }, [assessment]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.dataset["vvNoRecord"] === "1") return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (!FLEET_HOSTS.includes(url.hostname)) return;
      const original = anchor.href;
      // Two payloads on one click. `withCarry` writes the shared vocabulary —
      // the union of what all three desks have been told, not just this one's
      // slice — and it survives being copied, bookmarked and opened cold. The
      // record envelope in the fragment is richer and does not.
      anchor.href = spaHandoffUrl(withCarry(url.toString()), assessment);
      // Put it back on the next tick so the DOM does not hold the record.
      window.setTimeout(() => {
        if (anchor.isConnected) anchor.href = original;
      }, 0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [assessment]);

  return null;
}
