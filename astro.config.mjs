import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://veasel-labs.github.io",
  base: "/website",
  output: "static",
  build: { inlineStylesheets: "always" },
  integrations: [sitemap()],
});
