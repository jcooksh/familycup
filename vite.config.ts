import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

// base must match the GitHub Pages repo name for asset paths to resolve
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/wolrdcuptracker/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
