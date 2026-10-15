import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function readDoc(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("MCP OAuth and runtime docs honesty", () => {
  it("documents PKCE credentials and refuses auto-browser claims", async () => {
    const mcp = await readDoc("src/pages/docs/mcp.astro");
    assert.match(mcp, /mcp\.oauth/);
    assert.match(mcp, /mcp\.credentials/);
    assert.match(mcp, /PKCE/);
    assert.match(mcp, /--listen/);
    assert.match(
      mcp,
      /does not auto-launch a browser|does <strong>not<\/strong> open a browser/i,
    );
    assert.doesNotMatch(mcp, /OAuth remains open/i);
    assert.doesNotMatch(mcp, /xdg-open|automatically opens (your )?browser/i);
  });

  it("surfaces worktrees, skills list, and oauth in API/headless docs", async () => {
    const api = await readDoc("src/pages/docs/api.astro");
    const sessions = await readDoc("src/pages/docs/sessions.astro");
    const skills = await readDoc("src/pages/docs/skills.astro");
    const faq = await readDoc("src/pages/docs/faq.astro");
    assert.match(api, /\/v1\/mcp-oauth\/authorize/);
    assert.match(api, /\/v1\/mcp-credentials/);
    assert.match(api, /veasel worktrees list/);
    assert.match(api, /veasel skills list/);
    assert.match(api, /prints URL; no auto browser/);
    assert.match(sessions, /veasel worktrees list/);
    assert.match(skills, /veasel skills list/);
    assert.match(faq, /Does MCP OAuth open my browser automatically/);
  });
});
