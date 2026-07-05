import { test as base, expect } from "@playwright/test";

/**
 * Shared E2E fixture — LC standard, dev-requirements #6.
 *
 * Backend mock rule: no E2E test may reach a live external API.
 * Every request leaving localhost is intercepted:
 *   - Google Maps/Directions/Static Maps → blocked (tests assert UI, not maps)
 *   - BrasilAPI (holidays)               → mocked with an empty holiday list
 *   - Cloudflare Turnstile               → blocked (dev bypass renders no widget)
 *
 * If a test needs a specific external response, override the route inside
 * the test with page.route() AFTER using this fixture.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Block Google Maps entirely — deterministic UI, zero API consumption
    await page.route("**://maps.googleapis.com/**", (route) => route.abort());
    await page.route("**://maps.gstatic.com/**", (route) => route.abort());

    // BrasilAPI holidays → deterministic empty list
    await page.route("**://brasilapi.com.br/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );

    // Cloudflare Turnstile → blocked (login uses dev bypass without secret)
    await page.route("**://challenges.cloudflare.com/**", (route) => route.abort());

    await use(page);
  },
});

export { expect };
