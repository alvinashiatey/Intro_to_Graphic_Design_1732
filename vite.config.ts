import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import path from "path";
import schedule from "./src/data/schedule.json" assert { type: "json" };

export default defineConfig({
  plugins: [
    handlebars({
      partialDirectory: path.resolve(__dirname, "src/partials"),
      context: {
        dev: process.env.NODE_ENV === "development",
        schedule,
      },
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
