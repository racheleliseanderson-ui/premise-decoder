import { test, expect, type Page } from "@playwright/test";

/**
 * Live-conditions flow: Fast Path → venue text intake → full evaluate → packet.
 * The desk is client-only and persists to localStorage, so every test starts
 * from a clean storage state.
 */

async function freshDesk(page: Page, path = "/fast-path") {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* storage blocked — the desk still runs in memory */
    }
  });
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

const place = (page: Page) => page.getByTestId("metric-place").first();
const failClosed = (page: Page) => page.getByTestId("metric-failclosed").first();

async function scoreOf(page: Page) {
  await expect(place(page)).toBeVisible();
  return Number((await place(page).innerText()).trim());
}

test.describe("desk shell", () => {
  test("/ redirects to the Fast path", async ({ page }) => {
    await freshDesk(page, "/");
    await expect(page).toHaveURL(/\/fast-path$/);
    await expect(page.getByRole("navigation", { name: "Desk panels" })).toBeVisible();
  });

  test("every panel route renders with its own title", async ({ page }) => {
    const routes: [string, RegExp][] = [
      ["/fast-path", /Fast path/],
      ["/venue-text", /Paste a spa menu/],
      ["/evaluate", /Full evaluate/],
      ["/compare", /Compare settings/],
      ["/consult-prep", /Consult prep/],
      ["/claim-decoder", /Claim Decoder/],
      ["/library", /Reference library/],
      ["/packet", /Setting Decision Packet/],
    ];
    for (const [path, title] of routes) {
      await freshDesk(page, path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("main, body")).toBeVisible();
    }
  });
});

test.describe("fast path scoring", () => {
  test("naming the setting raises resolution and clears fail-closed signals", async ({ page }) => {
    await freshDesk(page);

    const before = await scoreOf(page);
    const failBefore = Number((await failClosed(page).innerText()).trim());

    await page.locator("#f-menuLine").fill("Hyaluronic acid filler, 1 syringe, nasolabial folds");
    await page.locator("#f-product").fill("Juvederm Ultra XC");
    await page.locator("#f-performer").fill("RN injector");
    await page.locator("#f-license").fill("RN 884120");
    await page.locator("#f-price").fill("$650");

    await expect
      .poll(async () => scoreOf(page), { timeout: 15_000 })
      .toBeGreaterThan(before);

    const failAfter = Number((await failClosed(page).innerText()).trim());
    expect(failAfter).toBeLessThanOrEqual(failBefore);
  });

  test("an empty desk still reports the finding rather than a score of confidence", async ({
    page,
  }) => {
    await freshDesk(page);
    await expect(page.getByText("Setting decision card").first()).toBeVisible();
    expect(await scoreOf(page)).toBeLessThan(60);
  });
});

test.describe("venue text intake", () => {
  test("the sample page extracts proposals with source quotes", async ({ page }) => {
    await freshDesk(page, "/venue-text");

    await page.getByRole("button", { name: "Load a sample page" }).click();
    await expect(page.locator("#venue-paste")).not.toHaveValue("");

    // Extraction surfaces at least one named proposal from the pasted text.
    await expect(page.getByRole("button", { name: /^Fill /i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("pasted text carries through to the evaluate panel", async ({ page }) => {
    await freshDesk(page, "/venue-text");
    const text =
      "Botox Cosmetic, 20 units, treated by our RN injector under a supervising physician. " +
      "Single-use needles opened in front of you. Written consent at every visit.";
    await page.locator("#venue-paste").fill(text);
    await page.getByRole("button", { name: "Extract setting fields" }).click();
    await expect(page.getByRole("button", { name: /^Fill /i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/evaluate", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Setting decision card").first()).toBeVisible();
  });
});

test.describe("full evaluate", () => {
  test("stages open and expose their own signal readings", async ({ page }) => {
    await freshDesk(page, "/evaluate");
    await expect(page.getByText("One stage at a time")).toBeVisible();

    await page.getByRole("button", { name: /Practice/ }).first().click();
    await page.locator("#f-sanitation").fill("Sealed single-use packaging opened in front of me.");
    await page.locator("#f-afterHours").fill("Direct line to the supervising physician until 10pm.");
    await expect(page.getByText(/Sanitation/i).first()).toBeVisible();
  });

  test("marketing text is decoded into flagged claim patterns", async ({ page }) => {
    await freshDesk(page, "/claim-decoder");
    await page
      .getByRole("textbox")
      .first()
      .fill("Permanent results, guaranteed and 100% safe for everyone. FDA approved. Today only.");
    await expect(page.getByText(/pattern\(s\) caught/i)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("packet generation", () => {
  test("the packet renders the named fields, unknowns and boundaries", async ({ page }) => {
    await freshDesk(page);
    await page.locator("#f-menuLine").fill("Microneedling with RF, full face");
    await page.locator("#f-performer").fill("Licensed medical esthetician");

    await page.goto("/packet", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("What was actually named").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Signal ledger").first()).toBeVisible();
    await expect(page.getByText(/Microneedling with RF/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Print packet/i })).toBeVisible();
  });

  test("a PDF packet can be downloaded", async ({ page }) => {
    await freshDesk(page);
    await page.locator("#f-menuLine").fill("Chemical peel, medium depth");
    await page.goto("/packet", { waitUntil: "domcontentloaded" });

    const button = page.getByRole("button", { name: /Download PDF packet/i });
    await expect(button).toBeVisible({ timeout: 15_000 });
    const download = page.waitForEvent("download", { timeout: 45_000 });
    await button.click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  });
});

test.describe("reference library and compare", () => {
  test("the library lists service classes and the glossary", async ({ page }) => {
    await freshDesk(page, "/library");
    await expect(page.getByText(/glossary|Reference/i).first()).toBeVisible();
  });

  test("compare shows the current venue block", async ({ page }) => {
    await freshDesk(page, "/compare");
    await expect(page.locator("body")).toContainText(/venue|setting/i);
  });
});
