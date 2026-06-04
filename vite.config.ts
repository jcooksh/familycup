import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

// On GitHub Pages the site is served from /<repo>/. The deploy workflow sets
// GITHUB_PAGES=1; locally we serve from root.
const base = process.env.GITHUB_PAGES ? "/familycup/" : "/"

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
