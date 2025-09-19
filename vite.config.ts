import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // any call to /api/* will be sent to vercel dev server
      "/api": {
        target: "http://localhost:3000", // where `vercel dev` runs
        changeOrigin: true,
      },
    },
  },
});
