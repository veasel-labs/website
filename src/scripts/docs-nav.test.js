import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const root = new URL("../../", import.meta.url);
const layout = await readFile(
  new URL("src/layouts/DocsLayout.astro", root),
  "utf8",
);
const styles = await readFile(new URL("src/styles/global.css", root), "utf8");

describe("responsive docs navigation", () => {
  it("shows the current page while the mobile navigation is collapsed", () => {
    assert.match(
      layout,
      /id="docs-nav-toggle"[\s\S]*?aria-controls="docs-nav-groups"[\s\S]*?aria-expanded="false"/,
    );
    assert.match(layout, /docs-nav-toggle-current">Current: \{activePage\}/);
    assert.match(
      layout,
      /aria-current=\{isActive\(item\.href\) \? "page" : undefined\}/,
    );
    assert.match(styles, /\.docs-nav-toggle-current\s*\{/);
  });

  it("opens results for search and lets the user collapse them", () => {
    assert.match(
      layout,
      /if \(mobileDocs\.matches\)\s*\{\s*setNavExpanded\(query\.length > 0\);/,
    );
    assert.match(
      layout,
      /navToggle\?\.addEventListener\("click",\s*\(\) =>\s*\{\s*setNavExpanded\(navToggle\.getAttribute\("aria-expanded"\) !== "true"\);/,
    );
  });

  it("moves focus before hiding controls at either responsive breakpoint", () => {
    assert.match(
      layout,
      /if \(document\.activeElement === navToggle\) filter\?\.focus\(\);/,
    );
    assert.match(
      layout,
      /navContainer\?\.contains\(document\.activeElement\)[\s\S]*?navToggle\.focus\(\);/,
    );
  });

  it("keeps the navigation visible when JavaScript does not run", () => {
    assert.match(layout, /id="docs-nav-groups"/);
    assert.match(layout, /class="docs-nav-toggle"[\s\S]*?hidden/);
    assert.match(
      layout,
      /document\.documentElement\.classList\.add\("docs-js"\)/,
    );
  });
});

describe("Desktop documentation entry points", () => {
  it("exposes the Desktop guide in the docs navigation and overview", async () => {
    const overview = await readFile(
      new URL("src/pages/docs/index.astro", root),
      "utf8",
    );
    assert.match(layout, /href: "\/docs\/desktop\/",[\s\S]*?label: "Desktop"/);
    assert.match(overview, /\/docs\/desktop\//);
  });

  it("renders only installers from the immutable verified release record", async () => {
    const desktop = await readFile(
      new URL("src/pages/docs/desktop.astro", root),
      "utf8",
    );
    const downloads = await readFile(
      new URL("src/pages/downloads.astro", root),
      "utf8",
    );
    assert.match(desktop, /release\.immutable === true/);
    assert.match(desktop, /Object\.entries\(platforms\)/);
    assert.match(desktop, /metadata\.assets\.map/);
    assert.match(desktop, /release\.assets\[name\]/);
    assert.match(desktop, /release\.assets\["SHA256SUMS"\]/);
    assert.match(desktop, /release\.assets\["release\.json"\]/);
    assert.match(
      desktop,
      /does not create sample projects or simulated progress/,
    );
    assert.match(desktop, /This is an unsigned preview installer\./);
    assert.match(
      desktop,
      /macOS disk image is not notarized; Gatekeeper may ask you to approve opening it\./,
    );
    assert.match(
      downloads,
      /macOS disk image is not notarized; Gatekeeper may ask you to approve opening it\./,
    );
    assert.match(downloads, /Windows SmartScreen may display a warning\./);
    assert.doesNotMatch(desktop, /0\.\d+\.\d+-next\.\d+/);
  });
});
