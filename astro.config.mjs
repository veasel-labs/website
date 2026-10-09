import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  site: isVercel ? "https://www.veasel.dev" : "https://veasel-labs.github.io",
  base: isVercel ? "/" : "/website",
  output: "static",
  build: { inlineStylesheets: "always" },
  integrations: [sitemap()],
});
