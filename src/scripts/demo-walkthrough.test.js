import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const walkthroughPath = fileURLToPath(
  new URL("../data/demo-walkthrough.json", import.meta.url),
);
const docsRoot = new URL("../pages/docs/", import.meta.url);

test("demo walkthrough stays a labeled script of authentic commands", async () => {
  const walkthrough = JSON.parse(await readFile(walkthroughPath, "utf8"));
  assert.match(walkthrough.disclaimer, /not a live Veasel session/i);
  assert.match(walkthrough.disclaimer, /authentic CLI\/TUI output/i);
  assert.ok(walkthrough.steps.length >= 5);
  for (const step of walkthrough.steps) {
    assert.ok(step.id);
    assert.ok(step.title);
    assert.ok(step.lines.length > 0);
    for (const line of step.lines) {
      assert.ok(
        ["comment", "command", "output", "user", "agent", "tool"].includes(
          line.kind,
        ),
      );
      assert.ok(line.text.length > 0);
    }
  }
  const joined = JSON.stringify(walkthrough);
  assert.match(joined, /veasel mcp add stdio/);
  assert.match(joined, /\{\{version\}\}/);
  assert.match(joined, /Ctrl\+R/);
  assert.doesNotMatch(
    joined,
    /\/patch (?:show|approve)|\/command (?:show|approve)|\/mcp call (?:show|approve)/,
  );
  assert.match(joined, /Harbor Index is still Not submitted/i);
  assert.doesNotMatch(joined, /leaderboard score|99%|solved all tasks/i);
});

test("TUI guides use live review routes and distinguish interactive MCP setup", async () => {
  const paths = [
    "api.astro",
    "faq.astro",
    "mcp.astro",
    "plugins.astro",
    "quickstart.astro",
    "security.astro",
    "skills.astro",
    "tui.astro",
  ];
  const pages = await Promise.all(
    paths.map((path) => readFile(new URL(path, docsRoot), "utf8")),
  );
  const joined = pages.join("\n");
  assert.doesNotMatch(
    joined,
    /\/mcp (?:remove|enable|disable|credential|credentials|oauth)\b/,
  );
  assert.doesNotMatch(joined, /\/(?:patch|command) (?:show|approve|reject)\b/);
  assert.doesNotMatch(joined, /\/mcp call (?:show|approve|reject)\b/);
  assert.match(joined, /veasel mcp add/);
  assert.match(joined, /Ctrl\+R/);
  const mcp = pages[2];
  assert.match(mcp, /Enter <code>\/mcp add<\/code>/);
  assert.match(mcp, /Project options appear only inside a session/);
  assert.match(mcp, /Remote endpoints need HTTPS; HTTP is limited to loopback/);
  assert.match(mcp, /No server starts or\s+connects until you trust it/);
  assert.match(mcp, /asks before\s+replacing\s+its\s+saved configuration/);
});
