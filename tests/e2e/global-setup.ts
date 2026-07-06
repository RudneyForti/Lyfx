import { execSync } from "child_process";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import { testDatabaseUrl } from "../integration/db-url";

export const E2E_USER = {
  name: "E2E Tester",
  email: "e2e@test.lyfx",
  password: "E2e!Pass123",
};

/**
 * Playwright global setup — runs once before the suite:
 * 1. Pushes the Prisma schema to the dedicated lyfx_test database
 * 2. Seeds a known user for real login flows (raw pg — the TS-only Prisma
 *    client does not load under Playwright's transpiler)
 *
 * The webServer (playwright.config.ts) points DATABASE_URL at the same
 * lyfx_test database — E2E never touches lyfx_dev data.
 */
export default async function globalSetup() {
  const url = testDatabaseUrl();
  execSync("npx prisma db push", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
    timeout: 120_000,
  });

  const hashed = await bcrypt.hash(E2E_USER.password, 10);
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO "User" (id, name, email, password, "twoFactorEnabled", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       ON CONFLICT (email)
       DO UPDATE SET password = $4, "twoFactorEnabled" = false, "updatedAt" = NOW()`,
      ["e2e-user-0001", E2E_USER.name, E2E_USER.email, hashed],
    );
  } finally {
    await client.end();
  }
}
