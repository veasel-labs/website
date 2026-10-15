import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const walkthroughPath = fileURLToPath(
  new URL("../data/demo-walkthrough.json", import.meta.url),
);

test("demo walkthrough stays a labeled script of authentic commands", async () => {
  const walkthrough = JSON.parse(await readFile(walkthroughPath, "utf8"));
  assert.match(walkthrough.disclaimer, /not a live Veasel session/i);
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
  assert.match(joined, /\/mcp add/);
  assert.match(joined, /\/patch approve/);
  assert.doesNotMatch(joined, /leaderboard score|99%|solved all tasks/i);
});
