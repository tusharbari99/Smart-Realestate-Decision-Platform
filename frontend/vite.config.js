import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  base:
    command === "build"
      ? "/Smart-Realestate-Decision-Platform/"
      : "/",

  build: {
    chunkSizeWarningLimit: 1500,
  },

  plugins: [react(), tailwindcss()],
}));
