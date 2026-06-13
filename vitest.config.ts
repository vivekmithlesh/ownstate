import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Pure business logic — fast Node environment, no DOM needed.
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Critical business logic we hold to a high bar.
      include: [
        "src/lib/utils.ts",
        "src/lib/deal-logic.ts",
        "src/lib/validation.ts",
        "src/lib/filters.ts",
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
