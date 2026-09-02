import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env["E2E_PORT"] ?? 8080);
const baseURL = process.env["E2E_BASE_URL"] ?? `http://localhost:${PORT}`;
const reuse = !process.env["CI"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env["CI"] ? 1 : 0,
  // Omitted rather than set to undefined, per exactOptionalPropertyTypes.
  ...(process.env["CI"] ? { workers: 2 } : {}),
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 1800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1800 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // `exactOptionalPropertyTypes` rejects an explicit `undefined` here, so the
  // key is omitted entirely when an external base URL is supplied.
  ...(process.env["E2E_BASE_URL"]
    ? {}
    : {
        webServer: {
          command: `bun run dev --port ${PORT}`,
          url: baseURL,
          reuseExistingServer: reuse,
          timeout: 120_000,
        },
      }),
});
