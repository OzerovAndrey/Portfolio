// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// GitHub Pages без домену: SITE_BASE=/Portfolio/. З власним доменом: SITE_BASE=/ і SITE_URL=https://домен
export default defineConfig({
  site: process.env.SITE_URL ?? "https://ozerovandrey.github.io",
  base: process.env.SITE_BASE ?? "/",
  trailingSlash: "always",
  integrations: [react()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "uk"],
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  build: { inlineStylesheets: "auto" },
});
