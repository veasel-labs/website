import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const siteLayout = await readFile(
  new URL("../layouts/SiteLayout.astro", import.meta.url),
  "utf8",
);

describe("site-wide keyboard navigation", () => {
  it("provides a programmatically focusable skip-link destination", () => {
    assert.match(siteLayout, /<a class="skip-link" href="#main">/);
    assert.match(siteLayout, /<main id="main" tabindex="-1">/);
  });
});
