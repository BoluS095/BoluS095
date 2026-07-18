import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Kalshi Nexus AI",
        short_name: "NexusAI",
        description: "Autonomous AI Trading Engine for Kalshi Markets",
        theme_color: "#0a0a1a",
        background_color: "#0a0a1a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/favicon.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/favicon.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/external-api\.kalshi\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "kalshi-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  server: { host: "0.0.0.0", port: 3000 },
});
