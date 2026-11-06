import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const siteLayout = await readFile(
  new URL("../layouts/SiteLayout.astro", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../styles/global.css", import.meta.url),
  "utf8",
);

function relativeLuminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

describe("site-wide keyboard navigation", () => {
  it("provides a programmatically focusable skip-link destination", () => {
    assert.match(siteLayout, /<a class="skip-link" href="#main">/);
    assert.match(siteLayout, /<main id="main" tabindex="-1">/);
  });

  it("uses a foreground that meets normal-text contrast in light and dark themes", () => {
    const foregrounds = [
      ...globalStyles.matchAll(/--green-dark:\s*(#[0-9a-f]{6})/gi),
    ].map((match) => match[1]);
    const backgrounds = [
      ...globalStyles.matchAll(/--paper:\s*(#[0-9a-f]{6})/gi),
    ].map((match) => match[1]);
    assert.match(
      globalStyles,
      /\.wordmark-light\s*\{\s*color:\s*var\(--green-dark\);/,
    );
    assert.ok(
      foregrounds.length >= 2,
      "light and dark theme tokens are required",
    );
    assert.equal(foregrounds.length, backgrounds.length);

    for (let index = 0; index < foregrounds.length; index += 1) {
      const [foreground, background] = [
        relativeLuminance(foregrounds[index]),
        relativeLuminance(backgrounds[index]),
      ].sort((left, right) => right - left);
      assert.ok(
        (foreground + 0.05) / (background + 0.05) >= 4.5,
        `theme ${index + 1} wordmark contrast must be at least 4.5:1`,
      );
    }
  });
});
