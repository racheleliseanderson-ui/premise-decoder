import { test, expect, type Page } from "@playwright/test";

/**
 * Live-conditions flow: landing → Fast Path → venue text intake → evaluate → packet.
 * The desk is client-only and autosaves to localStorage, so each test starts from
 * a cleared storage state.
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
  await expect(place(page)).toBeVisible({ timeout: 15_000 });
  return Number((await place(page).innerText()).trim());
}

async function seedMenuLine(page: Page, value: string) {
  await page.locator("#f-menuLine").fill(value);
  await expect(place(page)).toBeVisible({ timeout: 15_000 });
}

test.describe("desk shell", () => {
  test("the landing screen opens on the three steps and reaches the Fast path", async ({
    page,
  }) => {
    await freshDesk(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Desk panels" })).toBeVisible();

    await page.getByRole("button", { name: /Four questions/i }).click();
    await expect(page.locator("#f-menuLine")).toBeVisible({ timeout: 15_000 });
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
      await expect(page.getByRole("main")).toBeVisible();
    }
  });
});

test.describe("fast path scoring", () => {
  test("an empty desk reports the gap instead of a score of confidence", async ({ page }) => {
    await freshDesk(page);
    await expect(page.getByText(/Desk empty|Nothing is established yet/i).first()).toBeVisible();
  });

  test("naming the setting raises resolution and does not add fail-closed signals", async ({
    page,
  }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Hyaluronic acid filler, 1 syringe, nasolabial folds");

    const before = await scoreOf(page);
    const failBefore = Number((await failClosed(page).innerText()).trim());

    await page.locator("#f-product").fill("Juvederm Ultra XC");
    await page.locator("#f-performer").fill("RN injector");
    await page.locator("#f-license").fill("RN 884120");
    await page.locator("#f-price").fill("$650");

    await expect.poll(async () => scoreOf(page), { timeout: 15_000 }).toBeGreaterThan(before);

    const failAfter = Number((await failClosed(page).innerText()).trim());
    expect(failAfter).toBeLessThanOrEqual(failBefore);
  });

  test("state survives a hard reload", async ({ page }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Chemical peel, medium depth");
    const score = await scoreOf(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#f-menuLine")).toHaveValue(/Chemical peel/, { timeout: 15_000 });
    expect(await scoreOf(page)).toBe(score);
  });
});

test.describe("venue text intake", () => {
  test("the sample page extracts proposals with source quotes", async ({ page }) => {
    await freshDesk(page, "/venue-text");
    await page.getByRole("button", { name: "Load a sample page" }).click();
    await expect(page.locator("#venue-paste")).not.toHaveValue("");
    await expect(page.getByRole("button", { name: /^Fill /i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("a filled proposal carries through to the decision card", async ({ page }) => {
    await freshDesk(page, "/venue-text");
    await page
      .locator("#venue-paste")
      .fill(
        "Botox Cosmetic, 20 units, treated by our RN injector under a supervising physician. " +
          "Single-use needles opened in front of you. Written consent at every visit.",
      );
    await page.getByRole("button", { name: "Extract setting fields" }).click();

    const fill = page.getByRole("button", { name: /^Fill /i }).first();
    await expect(fill).toBeVisible({ timeout: 15_000 });
    await fill.click();

    await page.goto("/fast-path", { waitUntil: "domcontentloaded" });
    expect(await scoreOf(page)).toBeGreaterThan(0);
  });
});

test.describe("evaluate and decode", () => {
  test("stages open and take practice detail", async ({ page }) => {
    await freshDesk(page, "/evaluate");
    await expect(page.getByText("One stage at a time")).toBeVisible();

    await page.getByRole("button", { name: /Practice/ }).first().click();
    await page.locator("#f-sanitation").fill("Sealed single-use packaging opened in front of me.");
    await page
      .locator("#f-afterHours")
      .fill("Direct line to the supervising physician until 10pm.");
    await expect(page.locator("#f-sanitation")).toHaveValue(/single-use/);
  });

  test("marketing text is decoded into flagged claim patterns", async ({ page }) => {
    await freshDesk(page, "/claim-decoder");
    await page
      .getByRole("textbox", { name: /Marketing sentence/i })
      .fill("Permanent results, guaranteed and 100% safe for everyone. FDA approved. Today only.");
    await expect(page.getByText(/pattern\(s\) caught/i)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("packet generation", () => {
  test("the packet renders named fields, the signal ledger and print controls", async ({
    page,
  }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Microneedling with RF, full face");
    await page.locator("#f-performer").fill("Licensed medical esthetician");

    await page.goto("/packet", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("What was actually named").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Signal ledger").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Print packet/i })).toBeVisible();
  });

  test("a PDF packet can be downloaded", async ({ page }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Chemical peel, medium depth");
    await page.goto("/packet", { waitUntil: "domcontentloaded" });

    const button = page.getByRole("button", { name: /Download PDF packet/i });
    await expect(button).toBeVisible({ timeout: 15_000 });
    const download = page.waitForEvent("download", { timeout: 45_000 });
    await button.click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
  });
});

test.describe("reference library and compare", () => {
  test("the library renders its reference content", async ({ page }) => {
    await freshDesk(page, "/library");
    await expect(page.getByText(/glossary|Reference/i).first()).toBeVisible();
  });

  test("compare renders the current venue block", async ({ page }) => {
    await freshDesk(page, "/compare");
    await expect(page.getByRole("main")).toContainText(/venue|setting/i);
  });
});
