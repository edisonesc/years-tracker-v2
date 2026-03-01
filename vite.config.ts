import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const base = env.VITE_BASE_PATH || "/";
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["years-tracker-icon.jpg", "apple-touch-icon-180x180.png"],
        manifest: {
          name: "Years Tracker",
          short_name: "Years",
          description: "Visualize your life in years, months, weeks, and days.",
          theme_color: "#0f0f0f",
          background_color: "#0f0f0f",
          display: "standalone",
          scope: base,
          start_url: base,
          icons: [
            { src: "pwa-64x64.png",            sizes: "64x64",   type: "image/png" },
            { src: "pwa-192x192.png",           sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png",           sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base,
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
    },
  };
});
