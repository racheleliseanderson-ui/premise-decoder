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
  workers: process.env["CI"] ? 2 : undefined,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    viewport: { width: 1280, height: 1800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env["E2E_BASE_URL"]
    ? undefined
    : {
        command: `bun run dev --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: reuse,
        timeout: 120_000,
      },
});
