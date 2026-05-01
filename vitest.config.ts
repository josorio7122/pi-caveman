import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    exclude: ["**/*-e2e.test.ts", "node_modules", "vendor"],
    globals: true,
    passWithNoTests: true,
  },
});
