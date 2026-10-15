import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const demoPath = fileURLToPath(new URL("../pages/demo.astro", import.meta.url));
const castPath = fileURLToPath(
  new URL("../../public/demo/veasel-0.39.0-next.0-demo.cast", import.meta.url),
);
const metaPath = fileURLToPath(
  new URL(
    "../../public/demo/veasel-0.39.0-next.0-demo.meta.json",
    import.meta.url,
  ),
);

test("demo page embeds authentic asciinema recording for 0.39.0-next.0", async () => {
  const source = await readFile(demoPath, "utf8");
  assert.match(source, /veasel-0\.39\.0-next\.0-demo\.cast/);
  assert.match(source, /asciinema-player/);
  assert.match(source, /Terminal capture from the real binary/i);
  assert.doesNotMatch(source, /leaderboard score|99%|solved all tasks/i);
});

test("public demo cast is asciicast v2 with real CLI/TUI markers", async () => {
  const raw = await readFile(castPath);
  const lines = raw.toString("utf8").trimEnd().split("\n");
  const header = JSON.parse(lines[0]);
  assert.equal(header.version, 2);
  assert.match(header.title, /0\.39\.0-next\.0/);
  const blob = lines
    .slice(1)
    .map((line) => JSON.parse(line))
    .filter((event) => event[1] === "o")
    .map((event) => event[2])
    .join("");
  assert.match(blob, /\$ veasel --version/);
  assert.match(blob, /Veasel Code 0\.39\.0-next\.0/);
  assert.match(blob, /\$ veasel mcp list/);
  assert.match(blob, /Configured MCP/);
  assert.match(blob, /\/help/);
  assert.match(blob, /\/mcp/);
  assert.match(blob, /\/connect/);
  assert.match(blob, /API key/i);
  assert.match(blob, /Demo complete/);
  assert.doesNotMatch(blob, /leaderboard score|99%/i);

  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  assert.equal(meta.veasel_version, "0.39.0-next.0");
  assert.equal(meta.sha256, createHash("sha256").update(raw).digest("hex"));
  assert.match(meta.disclaimer, /No live model calls/i);
});
