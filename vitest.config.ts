import path from "node:path";
import { defineConfig } from "vitest/config";

// Server produksi (Vercel) berjalan dengan zona waktu UTC. Test dijalankan
// di zona yang sama supaya hasil konsisten di semua mesin dan mencerminkan produksi.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/access.ts",
        "src/lib/billing.ts",
        "src/lib/order-number.ts",
        "src/lib/period.ts",
        "src/lib/reports.ts",
        "src/lib/stock.ts",
        "src/lib/timezone.ts",
        "src/lib/utils.ts",
        "src/lib/validations.ts",
      ],
      reporter: [["text", { skipFull: false }], "text-summary"],
    },
  },
});
