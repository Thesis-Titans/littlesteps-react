import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1" },
  test: { maxWorkers: 1 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](?:firebase|@firebase)[\\/]/.test(id)) return "firebase";
          if (id.includes("/node_modules/")) return "vendor";
        }
      }
    }
  }
});
