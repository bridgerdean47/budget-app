import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/budget-app/",   // important for GitHub Pages under /budget-app/
  plugins: [react()],
});
