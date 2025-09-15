import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const KEY = env.VITE_GNEWS_KEY || "";
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/dailyNews": {
          target: "https://gnews.io",
          changeOrigin: true,
          secure: true,
          rewrite: () =>
            "/api/v4/top-headlines?lang=en&topic=world&max=3&token=" + KEY,
        },
      },
    },
  };
});
