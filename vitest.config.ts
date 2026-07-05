import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Coverage targets (LC standard): Unit min. 80% on lib/,
      // Integration/Feature 100% on app/actions/ — enforced per-module
      // as the retrofit progresses (see docs/CONDUCT-MODEL.md).
      include: ["lib/**/*.ts", "app/actions/**/*.ts"],
      exclude: ["lib/generated/**", "lib/types.ts", "lib/pills-data.json"],
    },
  },
});
