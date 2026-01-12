import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        // The main popup entry
        main: resolve(__dirname, "index.html"),
        // The script that injects the button into Gmail
        content: resolve(__dirname, "src/content.ts"),
        // The service worker that talks to Gemini
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        // This ensures the files are named exactly content.js and background.js
        // instead of having random hashes (like content-d82f3.js)
        entryFileNames: "[name].js",
      },
    },
  },
});
