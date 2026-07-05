import { execSync } from "child_process";
import { testDatabaseUrl } from "./db-url";

/**
 * Runs once before the integration suite: pushes the Prisma schema to the
 * dedicated lyfx_test database (created by Prisma if it does not exist).
 */
export default function globalSetup() {
  const url = testDatabaseUrl();
  execSync("npx prisma db push", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
    timeout: 120_000,
  });
}
