import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import schedule from "./src/data/schedule.json" with { type: "json" };
import handlebarsPlugin from "./plugins/vite-handlebars.js";

export default defineConfig({
  plugins: [
    handlebarsPlugin({
      partialDirectory: path.resolve(__dirname, "src/partials"),
      context: {
        dev: process.env.NODE_ENV === "development",
        schedule,
      },
      reloadOnPartialChange: true
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
