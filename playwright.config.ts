import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";
import { testDatabaseUrl } from "./tests/integration/db-url";

/**
 * Playwright — E2E/frontend tests (LC standard, dev-requirements #5/#6).
 *
 * Backend mock rule: no test may hit a live external API. Google Maps,
 * BrasilAPI and Turnstile are blocked/mocked globally in tests/e2e/fixtures.ts.
 *
 * Database: the webServer points DATABASE_URL at the dedicated lyfx_test
 * database (schema pushed + user seeded in tests/e2e/global-setup.ts).
 * E2E never touches lyfx_dev data. In CI, TEST_DATABASE_URL comes from the
 * postgres service container.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false, // login flows share the seeded user + DB state
  workers: 1,
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
      DATABASE_URL: testDatabaseUrl(),
      SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e-test-secret",
      ADMIN_SECRET: process.env.ADMIN_SECRET ?? "e2e-admin-secret",
    },
  },
});
