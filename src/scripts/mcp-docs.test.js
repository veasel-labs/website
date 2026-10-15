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

  it("marks configured MCP OAuth as roadmap foundation, not auto-browser", async () => {
    const roadmap = await readDoc("src/pages/docs/roadmap.astro");
    assert.match(roadmap, /Configured MCP and OAuth PKCE/);
    assert.match(roadmap, /no\s+automatic browser launch/i);
    assert.match(roadmap, /automatic OAuth browser\s+launch/);
  });

  it("documents three-OS MCP stdio sandbox opt-in", async () => {
    const mcp = await readDoc("src/pages/docs/mcp.astro");
    const plugins = await readDoc("src/pages/docs/plugins.astro");
    const security = await readDoc("src/pages/docs/security.astro");
    for (const doc of [mcp, plugins, security]) {
      assert.match(doc, /VEASEL_MCP_STDIO_SANDBOX/);
      assert.match(doc, /Bubblewrap/);
      assert.match(doc, /Seatbelt/);
      assert.match(doc, /AppContainer/);
      assert.doesNotMatch(doc, /macOS\/Windows (MCP )?stdio stay unsandboxed/i);
    }
    assert.match(mcp, /mcp\.stdio\.sandbox\.bubblewrap/);
    assert.match(mcp, /mcp\.stdio\.sandbox\.seatbelt/);
    assert.match(mcp, /mcp\.stdio\.sandbox\.windows/);
    assert.doesNotMatch(mcp, /OS sandboxing for stdio MCP/);
  });
});
