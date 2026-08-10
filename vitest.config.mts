import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      // Mirror the "@/*" path alias from tsconfig.json so tests can import
      // through the same module specifiers the app uses.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
