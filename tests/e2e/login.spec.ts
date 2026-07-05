import { test, expect } from "./fixtures";

/**
 * Smoke test — proves the E2E stack works end to end:
 * Playwright boots the dev server, external APIs are mocked,
 * and the login page renders its critical elements.
 */
test.describe("login page", () => {
  test("renders the login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("unauthenticated access to a protected route redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
