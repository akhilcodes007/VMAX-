import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiPlugin } from "./api/ai.ts";
import { loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Pass server-side env vars to the API plugin
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL = env.GEMINI_MODEL;

  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  };
});
