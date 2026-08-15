/** DOM id for an input field, so the evidence rail can jump straight to it. */
export const fieldDomId = (field: string) => `f-${field}`;

export function jumpToField(field: string, go: (mode: "full") => void) {
  go("full");
  window.setTimeout(() => {
    const el = document.getElementById(fieldDomId(field));
    if (!el) return;
    const header = document.querySelector("header");
    const offset = header instanceof HTMLElement ? header.getBoundingClientRect().height + 12 : 72;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    (el as HTMLInputElement | null)?.focus?.();
  }, 140);
}
