import { testDatabaseUrl } from "./db-url";

// Runs in every worker BEFORE test files import @/lib/db —
// the Prisma client must be instantiated against lyfx_test, never lyfx_dev.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "integration-test-secret";
