import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Accessibility regression guard.
 *
 * An automated scan is not a substitute for manual testing with a keyboard and
 * a screen reader — it catches roughly a third of real barriers. What it is
 * good for is holding a line that has already been cleared by hand: every route
 * below is currently free of WCAG 2.1/2.2 A and AA violations that axe can see,
 * and this test exists so a future change cannot quietly give that back.
 *
 * If this fails, read the printed violation rather than raising the threshold.
 */

const AXE = fs.readFileSync(path.join(process.cwd(), "node_modules/axe-core/axe.min.js"), "utf8");

/**
 * Every panel route, and only real ones.
 *
 * `/fast-path` was in this list and redirects to `/`, so one of the nine scans
 * was the front page checked twice. `/cost` and `/history` — the two newest
 * panels, and the two most likely to have a fresh problem — were never scanned
 * at all. This is now the same list `MODES` publishes, which is the list that
 * cannot drift.
 */
const ROUTES = [
  "/",
  "/venue-text",
  "/evaluate",
  "/cost",
  "/compare",
  "/consult-prep",
  "/claim-decoder",
  "/library",
  "/history",
  "/packet",
] as const;

type AxeResult = {
  violations: {
    id: string;
    impact: string | null;
    help: string;
    nodes: { html: string; target: unknown[] }[];
  }[];
};

for (const route of ROUTES) {
  test(`no axe violations: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    // The desk hydrates browser-local state after mount; scan the settled page.
    await page.waitForTimeout(800);
    await page.addScriptTag({ content: AXE });

    const result = (await page.evaluate(async () => {
      // @ts-expect-error injected by the script tag above
      return await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });
    })) as AxeResult;

    const summary = result.violations.map(
      (v) =>
        `${v.id} [${v.impact}] ${v.help}\n` +
        v.nodes
          .slice(0, 5)
          .map((n) => `    ${JSON.stringify(n.target)}\n    ${n.html.slice(0, 160)}`)
          .join("\n"),
    );

    expect(summary, `Accessibility violations on ${route}:\n${summary.join("\n")}`).toEqual([]);
  });
}
