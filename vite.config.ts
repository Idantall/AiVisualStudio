import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5000,
    host: "0.0.0.0",
    allowedHosts: [
      "81c81d37-fba0-44e0-a4f9-2fbcfe266e27-00-4shy1xyso5is.janeway.replit.dev",
      ".replit.dev",
      "localhost",
      "127.0.0.1"
    ],
  },
});