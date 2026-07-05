import { defineConfig } from "vitest/config";

/**
 * Integration tests — real Prisma client against the lyfx_test database.
 * Separate config: unit tests must stay runnable without any database.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/setup-env.ts"],
    // DB-backed tests share state — run files sequentially
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
