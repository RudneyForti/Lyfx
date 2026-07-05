import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

// The Playwright webServer runs on the HOST, but .env points DATABASE_URL at
// `db-dev:5432` — a hostname that only resolves inside the Docker network.
// Translate to the host-mapped port (5433) so the dev server reaches the DB.
const hostDatabaseUrl = (process.env.DATABASE_URL ?? "").replace(
  "db-dev:5432",
  "localhost:5433",
);

/**
 * Playwright — E2E/frontend tests (LC standard, dev-requirements #5/#6).
 *
 * Backend mock rule: no test may hit a live external API. Google Maps,
 * BrasilAPI and Turnstile are blocked/mocked globally in tests/e2e/fixtures.ts.
 * The app itself runs against the local test stack (port 3005, lyfx_dev DB).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3005",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev -- --port 3005",
    url: "http://localhost:3005",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: hostDatabaseUrl,
    },
  },
});
