import { test, expect, type Page } from "@playwright/test";

/**
 * Live-conditions flow: landing → Fast Path → venue text intake → evaluate → packet.
 * The desk is client-only and autosaves to localStorage, so each test starts from
 * a cleared storage state.
 */

async function freshDesk(page: Page, path = "/fast-path") {
  // Clear once, on the first document only: later navigations and reloads in the
  // same test must keep the autosaved desk so restore can be asserted.
  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem("e2e-cleared")) {
        window.localStorage.clear();
        window.sessionStorage.setItem("e2e-cleared", "1");
      }
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

/**
 * Waits until React owns the element. The desk is a hydrated client app: an input
 * touched before hydration keeps its DOM value but the desk never sees it.
 */
async function hydrated(page: Page, selector: string) {
  const locator = page.locator(selector);
  await expect(locator).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(
      () =>
        locator.evaluate((el) =>
          Object.keys(el).some((k) => k.startsWith("__react") || k.startsWith("_reactListening")),
        ),
      { timeout: 20_000, intervals: [200, 400, 700, 1000] },
    )
    .toBe(true);
  return locator;
}

async function fillField(page: Page, selector: string, value: string) {
  const input = await hydrated(page, selector);
  await input.fill(value);
  await expect(input).toHaveValue(value);
}


/** Clicks until the click is actually handled (post-hydration). */
async function clickUntil(page: Page, click: () => Promise<void>, ready: () => Promise<boolean>) {
  await expect
    .poll(
      async () => {
        if (await ready()) return true;
        await click();
        return ready();
      },
      { timeout: 20_000, intervals: [250, 500, 750, 1000] },
    )
    .toBe(true);
}

async function seedMenuLine(page: Page, value: string) {
  await fillField(page, "#f-menuLine", value);
  await expect(place(page)).toBeVisible({ timeout: 15_000 });
}

test.describe("desk shell", () => {
  test("the landing screen opens on the three steps and reaches the Fast path", async ({
    page,
  }) => {
    await freshDesk(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const jump = page.getByRole("button", { name: /Four questions/i });
    await clickUntil(
      page,
      () => jump.click(),
      () => page.locator("#f-menuLine").isVisible(),
    );
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
    await expect(page.getByText(/No service on the desk/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("metric-place")).toHaveCount(0);
  });

  test("naming the setting raises resolution and does not add fail-closed signals", async ({
    page,
  }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Hyaluronic acid filler, 1 syringe, nasolabial folds");

    const before = await scoreOf(page);
    const failBefore = Number((await failClosed(page).innerText()).trim());

    await fillField(page, "#f-product", "Juvederm Ultra XC");
    await fillField(page, "#f-performer", "RN injector");
    await fillField(page, "#f-license", "RN 884120");
    await fillField(page, "#f-price", "$650");

    await expect.poll(async () => scoreOf(page), { timeout: 15_000 }).toBeGreaterThan(before);

    const failAfter = Number((await failClosed(page).innerText()).trim());
    expect(failAfter).toBeLessThanOrEqual(failBefore);
  });

  test("state survives a hard reload", async ({ page }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Chemical peel, medium depth");
    const score = await scoreOf(page);

    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#f-menuLine")).toHaveValue(/Chemical peel/, { timeout: 15_000 });
    expect(await scoreOf(page)).toBe(score);
  });
});

test.describe("venue text intake", () => {
  test("the sample page extracts proposals with source quotes", async ({ page }) => {
    await freshDesk(page, "/venue-text");
    const sample = page.getByRole("button", { name: "Load a sample page" });
    await clickUntil(
      page,
      () => sample.click(),
      async () => (await page.locator("#venue-paste").inputValue()).length > 0,
    );
    await expect(page.getByRole("button", { name: /^Fill /i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("a filled proposal carries through to the decision card", async ({ page }) => {
    await freshDesk(page, "/venue-text");
    await fillField(
      page,
      "#venue-paste",
      "Botox Cosmetic, 20 units, treated by our RN injector under a supervising physician. " +
        "Single-use needles opened in front of you. Written consent at every visit.",
    );
    const extract = page.getByRole("button", { name: "Extract setting fields" });
    const fill = page.getByRole("button", { name: /^Fill /i }).first();
    await clickUntil(
      page,
      () => extract.click(),
      () => fill.isVisible(),
    );
    await fill.click();

    await page.waitForTimeout(1000);
    await page.goto("/fast-path", { waitUntil: "domcontentloaded" });
    expect(await scoreOf(page)).toBeGreaterThan(0);
  });
});

test.describe("evaluate and decode", () => {
  test("stages open and take practice detail", async ({ page }) => {
    await freshDesk(page, "/evaluate");
    await expect(page.getByText("One stage at a time")).toBeVisible();

    const practice = page.getByRole("button", { name: /Practice/ }).first();
    await clickUntil(
      page,
      () => practice.click(),
      () => page.locator("#f-sanitation").isVisible(),
    );
    await fillField(page, "#f-sanitation", "Sealed single-use packaging opened in front of me.");
    await fillField(page, "#f-afterHours", "Direct line to the supervising physician until 10pm.");
  });

  test("marketing text is decoded into flagged claim patterns", async ({ page }) => {
    await freshDesk(page, "/claim-decoder");
    const decoder = page.getByRole("textbox", { name: /Marketing sentence/i });
    await expect(decoder).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(
        async () => {
          await decoder.fill(
            "Permanent results, guaranteed and 100% safe for everyone. FDA approved. Today only.",
          );
          return decoder.inputValue();
        },
        { timeout: 20_000, intervals: [250, 500, 750, 1000] },
      )
      .toContain("Permanent results");
    await expect(page.getByText(/pattern\(s\) caught/i)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("packet generation", () => {
  test("the packet renders named fields, the signal ledger and print controls", async ({
    page,
  }) => {
    await freshDesk(page);
    await seedMenuLine(page, "Microneedling with RF, full face");
    await fillField(page, "#f-performer", "Licensed medical esthetician");

    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(1000);
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
