import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    exclude: ["apps/mobile/**", "node_modules/**"],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
