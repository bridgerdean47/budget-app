import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/budget-app/", // important for GitHub Pages
  plugins: [react()],
  build: {
    // just raise the limit so the 500 kB warning goes away
    chunkSizeWarningLimit: 1000,
  },
});
