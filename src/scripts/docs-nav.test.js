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
