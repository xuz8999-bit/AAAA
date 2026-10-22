import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/AAAA/ielts/" : "/",
  plugins: [tailwindcss()],
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
}));
