import { test, expect } from "./fixtures";
import { E2E_USER } from "./global-setup";

/**
 * Real authentication flow against the seeded test user (lyfx_test DB).
 * Proves the full stack: form → server action → bcrypt → session cookie
 * (HMAC) → proxy middleware → protected layout.
 */
test.describe("authentication flow", () => {
  test("logs in with valid credentials and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", E2E_USER.email);
    await page.fill('input[type="password"]', E2E_USER.password);
    await page.getByRole("button", { name: /entrar na lyfx/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    // Sidebar renders module navigation for the authenticated user
    await expect(page.locator('a[href="/transactions"]').first()).toBeVisible();
  });

  test("rejects a wrong password and stays on the login page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", E2E_USER.email);
    await page.fill('input[type="password"]', "Wrong!Pass123");
    await page.getByRole("button", { name: /entrar na lyfx/i }).click();

    // No redirect — still on /login with the form present
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("session persists across navigation to protected modules", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", E2E_USER.email);
    await page.fill('input[type="password"]', E2E_USER.password);
    await page.getByRole("button", { name: /entrar na lyfx/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Direct navigation to protected routes must not bounce back to login
    await page.goto("/transactions");
    await expect(page).toHaveURL(/\/transactions/);
    await page.goto("/budget");
    await expect(page).toHaveURL(/\/budget/);
  });
});
