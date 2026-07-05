import "dotenv/config";

/**
 * Resolves the integration-test database URL.
 *
 * Priority:
 *   1. TEST_DATABASE_URL env (CI provides a service container here)
 *   2. Derived from .env DATABASE_URL: docker hostname → host-mapped port,
 *      lyfx_dev → lyfx_test (never touches the dev database)
 */
export function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL ?? "";
  if (!base) throw new Error("[integration] DATABASE_URL not set — check .env");
  return base
    .replace("db-dev:5432", "localhost:5433")
    .replace("/lyfx_dev", "/lyfx_test");
}
