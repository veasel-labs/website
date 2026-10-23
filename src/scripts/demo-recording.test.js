import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const demoPath = fileURLToPath(new URL("../pages/demo.astro", import.meta.url));
const metaPath = fileURLToPath(
  new URL("../../public/demo/recording.meta.json", import.meta.url),
);
const meta = JSON.parse(await readFile(metaPath, "utf8"));
const castPath = fileURLToPath(
  new URL(`../../public/demo/${meta.cast_file}`, import.meta.url),
);

test("demo page embeds an authentic recording and labels its release age", async () => {
  const source = await readFile(demoPath, "utf8");
  assert.match(source, /recordingMeta\.cast_file/);
  assert.match(source, /recordingIsCurrent/);
  assert.match(source, /asciinema-player/);
  assert.match(source, /Terminal capture from the verified binary/i);
  assert.match(source, /demo\/recording\.meta\.json/);
  assert.doesNotMatch(source, /leaderboard score|99%|solved all tasks/i);
});

test("public demo cast is authentic, release-pinned, and makes no model calls", async () => {
  const raw = await readFile(castPath);
  const lines = raw.toString("utf8").trimEnd().split("\n");
  const header = JSON.parse(lines[0]);
  assert.equal(header.version, 2);
  assert.equal(header.width, 80);
  assert.equal(header.height, 30);
  assert.match(
    header.title,
    new RegExp(meta.veasel_version.replaceAll(".", "\\.")),
  );
  const blob = lines
    .slice(1)
    .map((line) => JSON.parse(line))
    .filter((event) => event[1] === "o")
    .map((event) => event[2])
    .join("");
  assert.match(blob, /\$ veasel --version/);
  assert.match(
    blob,
    new RegExp(`Veasel Code ${meta.veasel_version.replaceAll(".", "\\.")}`),
  );
  assert.match(blob, /\$ veasel mcp list/);
  assert.match(blob, /Configured MCP/);
  assert.match(blob, /\/help/);
  assert.match(blob, /\/mcp/);
  assert.match(blob, /\/connect/);
  assert.match(blob, /OpenCode Go/);
  assert.match(blob, /API key/i);
  assert.match(blob, /Demo complete/);
  assert.doesNotMatch(blob, /leaderboard score|99%/i);
  assert.doesNotMatch(blob, /\/home\//);

  assert.equal(meta.source_commit.length, 40);
  assert.match(meta.source_archive_sha256, /^[a-f0-9]{64}$/);
  assert.equal(meta.cast_file, `veasel-${meta.veasel_version}-demo.cast`);
  assert.equal(meta.sha256, createHash("sha256").update(raw).digest("hex"));
  assert.match(meta.disclaimer, /No live model calls/i);
  assert.match(
    meta.credential_policy,
    /provider API-key environment variables are not inherited/,
  );
  assert.match(meta.flows.join(" "), /OpenCode Go/);
});
