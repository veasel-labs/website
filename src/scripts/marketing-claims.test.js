import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function readDoc(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Marketing claims stay declarative and honest", () => {
  it("landing page declares the standard without Harbor Index claims", async () => {
    const index = await readDoc("src/pages/index.astro");
    const release = JSON.parse(await readDoc("src/data/verified-release.json"));
    assert.equal(release.tag, "v0.41.0-next.0");
    assert.match(index, /verified-release\.json/);
    assert.match(index, /\{release\}/);
    assert.match(index, /The new standard/);
    assert.match(index, /one-shot invoke/i);
    assert.match(index, /Graduated/);
    assert.match(index, /DiffRenderable/);
    assert.match(index, /MarkdownRenderable/);
    assert.match(index, /\$skill|\$<\/code> skill/);
    assert.match(index, /fuzzy/);
    assert.match(index, /content washes/);
    assert.match(index, /context footers/);
    assert.match(index, /VEASEL_MCP_STDIO_SANDBOX|MCP stdio sandbox/);
    assert.match(
      index,
      /cost schedule honesty|Honest dollars|pinned schedule/i,
    );
    assert.match(index, /Builder · SSE · json2|json2/);
    assert.match(index, /Harbor Index/);
    assert.match(index, /No Harbor Index|never invented|without inventing/i);
    assert.doesNotMatch(index, /Harbor Index score of|#\d+ on Harbor/i);
    assert.doesNotMatch(index, /v0\.42\.0|v1\.0\.0-next/);
    assert.doesNotMatch(index, /ConPTY.*(done|complete|READY)/i);
  });

  it("docs hub and trust surfaces cover shipped capabilities", async () => {
    const docs = await readDoc("src/pages/docs/index.astro");
    const security = await readDoc("src/pages/docs/security.astro");
    const mcp = await readDoc("src/pages/docs/mcp.astro");
    const tui = await readDoc("src/pages/docs/tui.astro");
    const skills = await readDoc("src/pages/docs/skills.astro");
    const sessions = await readDoc("src/pages/docs/sessions.astro");
    const benchmarks = await readDoc("src/pages/benchmarks.astro");
    assert.match(docs, /The standard/);
    assert.match(security, /Approval is the product/);
    assert.match(mcp, /mcp-oauth\/refresh/);
    assert.match(mcp, /VEASEL_MCP_STDIO_SANDBOX/);
    assert.match(tui, /DiffRenderable/);
    assert.match(tui, /MarkdownRenderable/);
    assert.match(tui, /\$source\/skill|\$<\/kbd> to autocomplete/);
    assert.match(tui, /typo-tolerant|fuzzy/);
    assert.match(tui, /content washes/);
    assert.match(tui, /Context footers/);
    assert.match(tui, /systemLabel|system\/tool/);
    assert.match(tui, /VEASEL_TUI_REDUCED_MOTION/);
    assert.match(skills, /skills\/invoke/);
    assert.match(skills, /VEASEL_MCP_STDIO_SANDBOX/);
    assert.doesNotMatch(skills, /macOS\/Windows stay unsandboxed/i);
    assert.match(sessions, /Parallel read-only/);
    assert.match(sessions, /Cost schedule honesty/);
    assert.match(sessions, /prompt_cache_key|prompt-cache|cache counters/i);
    assert.match(benchmarks, /tui-startup-linux-x64-2026-10-15\.json/);
    assert.match(benchmarks, /tuiVersionP50|cli\.version\.wall\.medianMs/);
    assert.match(benchmarks, /tuiHelpP50|cli\.help\.wall\.medianMs/);
    assert.match(benchmarks, /tuiPtyP50|ptyConnectedMs\.wall\.medianMs/);
    assert.match(benchmarks, /Windows ConPTY interactive smoke is still open/);
    assert.match(benchmarks, /Not submitted/);
    assert.doesNotMatch(benchmarks, /Harbor Index score|submitted to Harbor Index/i);
    const tuiStartup = JSON.parse(
      await readDoc(
        "public/data/benchmarks/tui-startup-linux-x64-2026-10-15.json",
      ),
    );
    assert.equal(tuiStartup.binaries.tuiVersionLine, "Veasel Code Terminal 0.41.0-next.0");
    assert.equal(Number(tuiStartup.cli.version.wall.medianMs.toFixed(1)), 41.1);
    assert.equal(Number(tuiStartup.cli.help.wall.medianMs.toFixed(1)), 41.9);
    assert.equal(Number(tuiStartup.ptyConnectedMs.wall.medianMs.toFixed(1)), 70.0);
  });
});
