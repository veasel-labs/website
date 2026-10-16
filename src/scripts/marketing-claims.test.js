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
    assert.equal(release.tag, "v0.42.0-next.0");
    assert.match(index, /verified-release\.json/);
    assert.match(index, /\{release\}/);
    assert.match(index, /The new standard/);
    assert.match(index, /one-shot invoke/i);
    assert.match(index, /Graduated/);
    assert.match(index, /Reviewed shell \+ MCP calls/);
    assert.match(
      index,
      /Reviewed shell \+ MCP calls[\s\S]*?<small>READY<\/small>/,
    );
    assert.doesNotMatch(
      index,
      /Reviewed shell \+ MCP calls[\s\S]*?<small>PREVIEW<\/small>/,
    );
    assert.match(index, /DiffRenderable/);
    assert.match(index, /MarkdownRenderable|SolidJS \+ OpenTUI/);
    assert.match(index, /Ctrl\+P/);
    assert.match(index, /Compose/);
    assert.match(index, /mint/i);
    assert.match(index, /pixel/i);
    assert.match(index, /\$skill|\$<\/code> skill|\$<\/code>/);
    assert.match(index, /\/<\/code>.*@|autocomplete/i);
    assert.match(index, /VEASEL_MCP_STDIO_SANDBOX|MCP stdio sandbox/);
    assert.match(
      index,
      /cost schedule honesty|Honest dollars|pinned schedule/i,
    );
    assert.match(index, /Builder · SSE · json2|json2/);
    // Build Board: SolidJS + OpenTUI session client is READY (not EARLY) —
    // mint shell, Ctrl+P, reviews, / @ $ autocomplete. ConPTY stays open.
    assert.match(
      index,
      /SolidJS \+ OpenTUI session client[\s\S]*?<small>READY<\/small>/,
    );
    assert.doesNotMatch(
      index,
      /SolidJS \+ OpenTUI session client[\s\S]*?<small>EARLY<\/small>/,
    );
    assert.doesNotMatch(index, /dual-path|experimental Solid/i);
    assert.match(index, /Harbor Index/);
    assert.match(index, /No Harbor Index|never invented|without inventing/i);
    assert.doesNotMatch(index, /Harbor Index score of|#\d+ on Harbor/i);
    assert.doesNotMatch(index, /v0\.43\.0|v1\.0\.0-next/);
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
    assert.match(tui, /SolidJS \+ OpenTUI|SolidJS on/);
    assert.match(tui, /Ctrl\+P/);
    assert.match(tui, /Compose/);
    assert.match(tui, /mint/);
    assert.match(tui, /DiffRenderable/);
    assert.match(tui, /MarkdownRenderable/);
    assert.match(tui, /\$source\/skill|\$<\/kbd> to autocomplete/);
    assert.match(tui, /typo-tolerant|fuzzy/);
    assert.match(tui, /content washes/);
    assert.match(tui, /Context footers/);
    assert.match(tui, /systemLabel|system\/tool/);
    assert.match(tui, /VEASEL_TUI_REDUCED_MOTION/);
    assert.doesNotMatch(tui, /dual-path|experimental Solid/i);
    assert.match(docs, /SolidJS \+ OpenTUI/);
    const architecture = await readDoc("src/pages/docs/architecture.astro");
    const faq = await readDoc("src/pages/docs/faq.astro");
    const downloads = await readDoc("src/pages/downloads.astro");
    assert.match(architecture, /Solid \+ OpenTUI|SolidJS \+ OpenTUI/);
    assert.match(faq, /SolidJS \+ OpenTUI/);
    assert.match(downloads, /SolidJS \+ OpenTUI/);
    assert.match(downloads, /0\.42|verified tag|does not invent/);
    assert.doesNotMatch(downloads, /v0\.43\.0/);
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
    assert.match(
      benchmarks,
      /Windows ConPTY interactive\s+smoke is still open/,
    );
    assert.match(benchmarks, /Not submitted/);
    assert.doesNotMatch(
      benchmarks,
      /Harbor Index score|submitted to Harbor Index/i,
    );
    const tuiStartup = JSON.parse(
      await readDoc(
        "public/data/benchmarks/tui-startup-linux-x64-2026-10-15.json",
      ),
    );
    assert.equal(
      tuiStartup.binaries.tuiVersionLine,
      "Veasel Code Terminal 0.41.0-next.0",
    );
    assert.equal(Number(tuiStartup.cli.version.wall.medianMs.toFixed(1)), 41.1);
    assert.equal(Number(tuiStartup.cli.help.wall.medianMs.toFixed(1)), 41.9);
    assert.equal(
      Number(tuiStartup.ptyConnectedMs.wall.medianMs.toFixed(1)),
      70.0,
    );
  });
});
